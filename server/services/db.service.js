import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "skillora-db.json");
const STATE_COLLECTION = "app_state";
const STATE_DOCUMENT_ID = "skillora";

const initialDb = {
  users: [],
  jobs: [],
  interviews: [],
};

let mongoClientPromise = null;

function useMongo() {
  return Boolean(process.env.MONGODB_URI);
}

async function getMongoCollection() {
  if (!mongoClientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI);
    mongoClientPromise = client.connect();
  }

  const client = await mongoClientPromise;
  const dbName = process.env.MONGODB_DB || "skillora";
  return client.db(dbName).collection(STATE_COLLECTION);
}

function readJsonDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  }
  try {
    return { ...initialDb, ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) };
  } catch {
    return initialDb;
  }
}

function writeJsonDb(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify({ ...initialDb, ...db }, null, 2));
}

export async function readDb() {
  if (!useMongo()) return readJsonDb();

  const collection = await getMongoCollection();
  const document = await collection.findOne({ _id: STATE_DOCUMENT_ID });

  if (!document) {
    await collection.insertOne({ _id: STATE_DOCUMENT_ID, ...initialDb });
    return initialDb;
  }

  const { _id, ...data } = document;
  return { ...initialDb, ...data };
}

export async function writeDb(db) {
  if (!useMongo()) {
    writeJsonDb(db);
    return;
  }

  const collection = await getMongoCollection();
  await collection.replaceOne(
    { _id: STATE_DOCUMENT_ID },
    { _id: STATE_DOCUMENT_ID, ...initialDb, ...db },
    { upsert: true },
  );
}

export function getDbLocation() {
  if (useMongo()) {
    return `mongodb:${process.env.MONGODB_DB || "skillora"}.${STATE_COLLECTION}`;
  }

  return DB_FILE;
}

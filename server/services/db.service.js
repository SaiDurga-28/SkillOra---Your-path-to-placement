import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.join(__dirname, "..", "data");
const DEFAULT_DB_FILE = path.join(DEFAULT_DATA_DIR, "skillora-db.json");
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

function getJsonDbFile() {
  return process.env.SKILLORA_DB_FILE || DEFAULT_DB_FILE;
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
  const dbFile = getJsonDbFile();
  const dataDir = path.dirname(dbFile);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify(initialDb, null, 2));
  }
  try {
    return { ...initialDb, ...JSON.parse(fs.readFileSync(dbFile, "utf8")) };
  } catch {
    return initialDb;
  }
}

function writeJsonDb(db) {
  const dbFile = getJsonDbFile();
  const dataDir = path.dirname(dbFile);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbFile, JSON.stringify({ ...initialDb, ...db }, null, 2));
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

  return getJsonDbFile();
}

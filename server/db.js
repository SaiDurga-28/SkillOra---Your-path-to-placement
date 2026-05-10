import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "skillora-db.json");

const initialDb = {
  users: [],
  jobs: [],
  interviews: [],
};

export function readDb() {
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

export function writeDb(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify({ ...initialDb, ...db }, null, 2));
}

export function getDbFilePath() {
  return DB_FILE;
}

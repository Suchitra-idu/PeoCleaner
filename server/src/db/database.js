import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || "./data/database.sqlite";

let db = null;

async function initializeDatabase() {
  if (db) {
    return db;
  }

  try {
    db = await open({
      filename: path.resolve(DATABASE_URL),
      driver: sqlite3.Database,
    });
    console.log("SQLite database connected.");
    return db;
  } catch (error) {
    console.error("Error connecting to SQLite database:", error);
    process.exit(1);
  }
}

async function closeDatabase() {
  if (db) {
    await db.close();
    console.log("SQLite database connection closed.");
    db = null;
  }
}

export { initializeDatabase, closeDatabase };

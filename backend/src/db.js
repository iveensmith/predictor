const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = path.join(__dirname, "..", "..", "database", "match-predictor.sqlite");
const SCHEMA_PATH = path.join(__dirname, "..", "..", "database", "schema.sql");

const db = new sqlite3.Database(DB_PATH);

const initDb = () => {
  const fs = require("fs");
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  db.exec(schema);
};

module.exports = {
  db,
  initDb,
};

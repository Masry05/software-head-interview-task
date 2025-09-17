import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const db = new sqlite3.Database("./app.db");

// --- Setup tables and seed admin ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    userId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    text TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  // Seed admin user
  db.get("SELECT * FROM users WHERE email = ?", ["admin@example.com"], (err, row) => {
    if (!row) {
      const hashed = bcrypt.hashSync("password", 10);
      db.run(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ["Admin", "admin@example.com", hashed, "admin"]
      );
    }
  });
});

// --- Helper functions ---
export const createUser = (name, email, password, role = "user") =>
  new Promise((resolve, reject) => {
    const hashed = bcrypt.hashSync(password, 10);
    db.run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashed, role],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, name, email, role });
      }
    );
  });

export const findUserByEmail = (email) =>
  new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

export const createSession = (userId) =>
  new Promise((resolve, reject) => {
    const token = uuidv4();
    db.run(
      "INSERT INTO sessions (token, userId) VALUES (?, ?)",
      [token, userId],
      (err) => {
        if (err) return reject(err);
        resolve(token);
      }
    );
  });

export const findSession = (token) =>
  new Promise((resolve, reject) => {
    db.get("SELECT * FROM sessions WHERE token = ?", [token], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

export const deleteSession = (token) =>
  new Promise((resolve, reject) => {
    db.run("DELETE FROM sessions WHERE token = ?", [token], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });

export const addNote = (userId, text) =>
  new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO notes (userId, text) VALUES (?, ?)",
      [userId, text],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, userId, text });
      }
    );
  });

export const getNotesByUser = (userId) =>
  new Promise((resolve, reject) => {
    db.all("SELECT * FROM notes WHERE userId = ?", [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

export const deleteNote = (id, userId) =>
  new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM notes WHERE id = ? AND userId = ?",
      [id, userId],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });

export default db;

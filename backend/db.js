const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data', 'ich.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'client')),
    company TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK(priority IN ('Low', 'Medium', 'High')),
    status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Escalated', 'Resolved', 'Closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    package_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    start_date TEXT,
    end_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed default users (only if table is empty)
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

if (userCount === 0) {
  const hash = (password) => bcrypt.hashSync(password, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password, name, role, company, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'admin@infinitecyberspace.com',
    hash('admin123'),
    'Augustine Ouma',
    'admin',
    'Infinite Cyberspace Hub',
    '+254700000000'
  );

  insertUser.run(
    'demo@client.com',
    hash('demo123'),
    'John Odhiambo',
    'client',
    'Acme Solutions Ltd',
    '+254712345678'
  );

  console.log('Default users created');
}

module.exports = db;
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Ensure data folder exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'ich.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// ====================== TABLES ======================
db.exec(`
  -- Users (Admin + Clients)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'client', 'technician')),
    company TEXT,
    phone TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Subscription Packages
  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,               -- basic, standard, premium
    name TEXT NOT NULL,
    price_kes INTEGER NOT NULL,
    description TEXT,
    features TEXT,                           -- JSON string
    is_active INTEGER DEFAULT 1
  );

  -- Client Subscriptions
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expired', 'cancelled', 'pending')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    amount_paid INTEGER,
    payment_ref TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (package_id) REFERENCES packages(id)
  );

  -- Support Tickets
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,          -- TKT-xxxxxx
    user_id INTEGER NOT NULL,
    assigned_to INTEGER,                     -- technician id
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Escalated', 'Resolved', 'Closed')),
    category TEXT DEFAULT 'General',         -- Security, Network, Software, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  -- Ticket Messages / Conversation
  CREATE TABLE IF NOT EXISTS ticket_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_internal INTEGER DEFAULT 0,           -- internal notes only visible to staff
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  -- Security Reports / Documents
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT,
    file_url TEXT,
    report_type TEXT,                        -- Monthly, Vulnerability, Training, Incident
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Activity Logs (important for cybersecurity company)
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ====================== SEED DATA ======================
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

if (userCount === 0) {
  const hash = (password) => bcrypt.hashSync(password, 12);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password, name, role, company, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Admin
  insertUser.run(
    'admin@infinitecyberspace.com',
    hash('admin123'),
    'Augustine Ouma',
    'admin',
    'Infinite Cyberspace Hub',
    '+254700000000'
  );

  // Demo Client
  insertUser.run(
    'demo@client.com',
    hash('demo123'),
    'John Odhiambo',
    'client',
    'Acme Solutions Ltd',
    '+254712345678'
  );

  // Seed Packages
  const insertPackage = db.prepare(`
    INSERT INTO packages (code, name, price_kes, description, features)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertPackage.run('basic', 'Basic Protection', 12900, 'Essential security for small businesses',
    JSON.stringify(['24/7 Monitoring', 'Endpoint Protection', 'Email Security', 'Monthly Report']));

  insertPackage.run('standard', 'Standard Protection', 25900, 'Advanced protection + priority support',
    JSON.stringify(['Everything in Basic', 'Vulnerability Scans', 'Priority Support', 'Employee Training']));

  insertPackage.run('premium', 'Premium Protection', 38900, 'Full enterprise-grade security',
    JSON.stringify(['Everything in Standard', 'Penetration Testing', 'Incident Response', 'Dedicated Technician']));

  console.log('✅ Database seeded successfully');
}

module.exports = db;

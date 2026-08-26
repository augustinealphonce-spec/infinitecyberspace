const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new Database(path.join(dataDir, 'ich.db'));
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'client', 'technician')),
    company TEXT,
    phone TEXT,
    is_active INTEGER DEFAULT 1,
    must_change_password INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price_kes INTEGER NOT NULL,
    description TEXT,
    features TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
      CHECK(status IN ('active', 'expired', 'cancelled', 'pending')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    amount_paid INTEGER,
    payment_ref TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (package_id) REFERENCES packages(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checkout_request_id TEXT UNIQUE,
    merchant_request_id TEXT,
    phone TEXT NOT NULL,
    amount INTEGER NOT NULL,
    package_code TEXT,
    user_id INTEGER,
    customer_name TEXT,
    customer_email TEXT,
    customer_company TEXT,
    account_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending', 'success', 'failed', 'cancelled')),
    mpesa_receipt TEXT,
    result_code INTEGER,
    result_desc TEXT,
    raw_callback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_to INTEGER,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium'
      CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT NOT NULL DEFAULT 'Open'
      CHECK(status IN ('Open', 'In Progress', 'Escalated', 'Resolved', 'Closed')),
    category TEXT DEFAULT 'General',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ticket_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_internal INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT,
    file_url TEXT,
    report_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function logActivity(userId, action, details, ip) {
  db.prepare(
    `INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)`
  ).run(userId || null, action, details || null, ip || null);
}

const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const hash = (p) => bcrypt.hashSync(p, 12);
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

  const insertPkg = db.prepare(`
    INSERT INTO packages (code, name, price_kes, description, features)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertPkg.run(
    'basic',
    'Basic Protection',
    12900,
    'Essential security for small businesses',
    JSON.stringify(['Firewall', 'EDR baseline', 'Email security', 'Monthly report'])
  );
  insertPkg.run(
    'standard',
    'Standard Protection',
    25900,
    'Advanced protection + priority support',
    JSON.stringify(['Everything in Basic', '24/7 SOC', 'XDR', 'Priority support'])
  );
  insertPkg.run(
    'premium',
    'Premium Protection',
    38900,
    'Full enterprise-grade security',
    JSON.stringify(['Everything in Standard', 'Pen testing', 'Dedicated tech', 'IR retainer'])
  );

  console.log('✅ Database seeded');
}

module.exports = db;
module.exports.logActivity = logActivity;

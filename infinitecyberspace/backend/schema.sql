-- schema.sql
PRAGMA foreign_keys = ON;

-- Users (customers + admins)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  company TEXT,
  password_hash TEXT,               -- null until they set it
  role TEXT DEFAULT 'customer',     -- 'customer' | 'admin'
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Packages (static reference)
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,        -- 'basic', 'standard', 'premium'
  name TEXT NOT NULL,
  price_kes INTEGER NOT NULL,
  description TEXT
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  package_code TEXT NOT NULL,
  package_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT DEFAULT 'pending_payment',  -- pending_payment | pending_activation | active | expired | cancelled
  start_date DATE,
  end_date DATE,
  merchant_reference TEXT UNIQUE,
  order_tracking_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER,
  user_id INTEGER,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT DEFAULT 'pending',    -- pending | completed | failed | reversed
  merchant_reference TEXT,
  order_tracking_id TEXT,
  payment_method TEXT,              -- 'pesapal', 'mpesa'
  raw_response TEXT,                -- JSON from Pesapal
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number TEXT UNIQUE,
  user_id INTEGER,
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Medium',   -- Low | Medium | High
  status TEXT DEFAULT 'Open',       -- Open | In Progress | Resolved | Closed
  assigned_to INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed packages
INSERT OR IGNORE INTO packages (code, name, price_kes, description) VALUES
('basic', 'Basic Protection', 12900, 'Network security essentials, firewall, basic malware protection, monthly reports'),
('standard', 'Standard Protection', 25900, 'Everything in Basic + Endpoint protection, Email & phishing protection, 24/7 monitoring'),
('premium', 'Premium Protection', 38900, 'Everything in Standard + Penetration testing, Employee training, Priority support');
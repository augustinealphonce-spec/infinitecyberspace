require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');
const { logActivity } = require('./db');
const { stkPush, formatPhone } = require('./services/mpesa');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'https://augustinealphonce-spec.github.io'
  ],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

function randomPassword(len = 10) {
  return crypto.randomBytes(8).toString('base64url').slice(0, len);
}

function addOneMonth(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

/** Find or create client after successful payment */
function ensureClientAccount({ email, name, phone, company }) {
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  let tempPassword = null;
  let created = false;

  if (!user) {
    tempPassword = randomPassword(10);
    const hash = bcrypt.hashSync(tempPassword, 12);
    const r = db.prepare(`
      INSERT INTO users (email, password, name, role, company, phone, must_change_password)
      VALUES (?, ?, ?, 'client', ?, ?, 1)
    `).run(
      email.toLowerCase(),
      hash,
      name || 'Client',
      company || null,
      phone || null
    );
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(r.lastInsertRowid);
    created = true;
  } else {
    // refresh contact info
    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        company = COALESCE(?, company),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name || null, phone || null, company || null, user.id);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  }

  return { user, tempPassword, created };
}

function activateSubscription(userId, packageCode, amount, receipt) {
  const pkg = db.prepare('SELECT * FROM packages WHERE code = ?').get(packageCode);
  if (!pkg) return null;

  // expire previous active for this user (simple model: one active package)
  db.prepare(`
    UPDATE subscriptions SET status = 'cancelled'
    WHERE user_id = ? AND status = 'active'
  `).run(userId);

  const start = new Date().toISOString().slice(0, 10);
  const end = addOneMonth(start);

  const r = db.prepare(`
    INSERT INTO subscriptions (user_id, package_id, status, start_date, end_date, amount_paid, payment_ref)
    VALUES (?, ?, 'active', ?, ?, ?, ?)
  `).run(userId, pkg.id, start, end, amount, receipt || null);

  return db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(r.lastInsertRowid);
}
// ========== REGISTER (any email + password → client account) ==========
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, company, phone } = req.body || {};

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' });
  }

  const hash = bcrypt.hashSync(String(password), 12);
  const result = db.prepare(`
    INSERT INTO users (email, password, name, role, company, phone, must_change_password)
    VALUES (?, ?, ?, 'client', ?, ?, 0)
  `).run(
    String(email).toLowerCase().trim(),
    hash,
    String(name).trim(),
    company ? String(company).trim() : null,
    phone ? String(phone).trim() : null
  );

  const user = db.prepare(
    'SELECT id, email, name, role, company, phone, must_change_password FROM users WHERE id = ?'
  ).get(result.lastInsertRowid);

  logActivity(user.id, 'register', null, req.ip);

  res.status(201).json({
    success: true,
    token: generateToken(user),
    user
  });
});
// ========== AUTH ==========
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  logActivity(user.id, 'login', null, req.ip);
  res.json({
    success: true,
    token: generateToken(user),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      phone: user.phone,
      must_change_password: !!user.must_change_password
    }
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare(
    'SELECT id, email, name, role, company, phone, must_change_password FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

// ========== PACKAGES (public) ==========
app.get('/api/packages', (req, res) => {
  const packages = db.prepare('SELECT * FROM packages WHERE is_active = 1').all();
  res.json({
    packages: packages.map((p) => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : []
    }))
  });
});

// ========== MPESA STK ==========
app.post('/api/payments/mpesa/stk', async (req, res) => {
  try {
    const { phone, packageCode, name, email, company } = req.body || {};
    if (!phone || !packageCode) {
      return res.status(400).json({ success: false, message: 'Phone and package required' });
    }
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Name and email required' });
    }

    const pkg = db.prepare('SELECT * FROM packages WHERE code = ? AND is_active = 1').get(packageCode);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    let formatted;
    try {
      formatted = formatPhone(phone);
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    const accountRef = `ICH-${packageCode}`.slice(0, 12);
    const result = await stkPush({
      phone: formatted,
      amount: pkg.price_kes,
      accountReference: accountRef,
      transactionDesc: pkg.name
    });

    if (String(result.ResponseCode) !== '0') {
      return res.status(400).json({
        success: false,
        message: result.CustomerMessage || result.ResponseDescription || 'STK failed'
      });
    }

    db.prepare(`
      INSERT INTO payments (
        checkout_request_id, merchant_request_id, phone, amount, package_code,
        customer_name, customer_email, customer_company, account_reference, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      result.CheckoutRequestID,
      result.MerchantRequestID,
      formatted,
      pkg.price_kes,
      packageCode,
      name,
      email.toLowerCase(),
      company || null,
      accountRef
    );

    logActivity(null, 'stk_initiated', `${packageCode} ${formatted}`, req.ip);

    res.json({
      success: true,
      message: 'STK Push sent',
      checkoutRequestId: result.CheckoutRequestID
    });
  } catch (err) {
    console.error('STK error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: err.response?.data?.errorMessage || err.message || 'Payment init failed'
    });
  }
});

// Daraja callback — always 200 quickly
app.post('/api/payments/mpesa/callback', (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) return;

    const checkoutId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc || '';

    const payment = db.prepare(
      'SELECT * FROM payments WHERE checkout_request_id = ?'
    ).get(checkoutId);
    if (!payment || payment.status !== 'pending') return;

    if (resultCode === 0) {
      const items = callback.CallbackMetadata?.Item || [];
      const get = (n) => items.find((i) => i.Name === n)?.Value;
      const receipt = get('MpesaReceiptNumber');
      const amount = get('Amount') || payment.amount;
      const phone = String(get('PhoneNumber') || payment.phone);

      const { user, tempPassword, created } = ensureClientAccount({
        email: payment.customer_email,
        name: payment.customer_name,
        phone,
        company: payment.customer_company
      });

      activateSubscription(user.id, payment.package_code, amount, receipt);

      db.prepare(`
        UPDATE payments SET
          status = 'success',
          user_id = ?,
          mpesa_receipt = ?,
          result_code = ?,
          result_desc = ?,
          raw_callback = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE checkout_request_id = ?
      `).run(user.id, receipt, resultCode, resultDesc, JSON.stringify(req.body), checkoutId);

      logActivity(user.id, 'payment_success', `${receipt} ${payment.package_code}`, null);

      // Placeholder: wire Africa's Talking / email here
      console.log('✅ PAYMENT OK', {
        receipt,
        email: user.email,
        created,
        tempPassword: created ? tempPassword : '(existing user — no new password)'
      });
      // TODO: sendWelcome({ email: user.email, name: user.name, tempPassword, packageCode: payment.package_code })
    } else {
      const status = resultCode === 1032 ? 'cancelled' : 'failed';
      db.prepare(`
        UPDATE payments SET
          status = ?,
          result_code = ?,
          result_desc = ?,
          raw_callback = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE checkout_request_id = ?
      `).run(status, resultCode, resultDesc, JSON.stringify(req.body), checkoutId);

      console.log('❌ PAYMENT', status, resultDesc);
    }
  } catch (err) {
    console.error('Callback error:', err);
  }
});

app.get('/api/payments/status/:checkoutRequestId', (req, res) => {
  const payment = db.prepare(`
    SELECT status, mpesa_receipt, result_desc, package_code, amount, customer_email
    FROM payments WHERE checkout_request_id = ?
  `).get(req.params.checkoutRequestId);

  if (!payment) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, payment });
});

// ========== CLIENT: subscription, tickets, reports, billing ==========
app.get('/api/me/subscription', authMiddleware, (req, res) => {
  const sub = db.prepare(`
    SELECT s.*, p.code as package_code, p.name as package_name, p.price_kes, p.features
    FROM subscriptions s
    JOIN packages p ON p.id = s.package_id
    WHERE s.user_id = ? AND s.status = 'active'
    ORDER BY s.id DESC LIMIT 1
  `).get(req.user.id);

  if (sub && sub.features) {
    try { sub.features = JSON.parse(sub.features); } catch { sub.features = []; }
  }
  res.json({ subscription: sub || null });
});

app.get('/api/me/payments', authMiddleware, (req, res) => {
  const payments = db.prepare(`
    SELECT id, amount, package_code, status, mpesa_receipt, created_at
    FROM payments
    WHERE user_id = ? OR customer_email = (SELECT email FROM users WHERE id = ?)
    ORDER BY created_at DESC
  `).all(req.user.id, req.user.id);
  res.json({ payments });
});

app.get('/api/me/tickets', authMiddleware, (req, res) => {
  const tickets = db.prepare(`
    SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);
  res.json({ tickets });
});

app.post('/api/me/tickets', authMiddleware, (req, res) => {
  const { subject, description, priority = 'Medium', category = 'General' } = req.body || {};
  if (!subject || !description) {
    return res.status(400).json({ message: 'Subject and description required' });
  }
  const ticketId = 'TKT-' + Date.now().toString().slice(-8);
  const r = db.prepare(`
    INSERT INTO tickets (ticket_id, user_id, subject, description, priority, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(ticketId, req.user.id, subject, description, priority, category);

  // simple auto-routing: Critical → leave unassigned (admin sees first); else open
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(r.lastInsertRowid);
  logActivity(req.user.id, 'ticket_created', ticketId, req.ip);
  res.status(201).json({ success: true, ticket });
});

app.get('/api/me/reports', authMiddleware, (req, res) => {
  const reports = db.prepare(`
    SELECT id, title, file_name, file_url, report_type, created_at
    FROM reports WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);
  res.json({ reports });
});

// ========== ADMIN ==========
app.get('/api/admin/overview', authMiddleware, requireAdmin, (req, res) => {
  const clients = db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'client'`).get().c;
  const activeSubs = db.prepare(`SELECT COUNT(*) as c FROM subscriptions WHERE status = 'active'`).get().c;
  const openTickets = db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE status IN ('Open','In Progress','Escalated')`).get().c;
  const revenue = db.prepare(`
    SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'success'
  `).get().total;
  const recentPayments = db.prepare(`
    SELECT id, customer_name, customer_email, phone, amount, package_code, status, mpesa_receipt, created_at
    FROM payments ORDER BY created_at DESC LIMIT 15
  `).all();
  res.json({
    stats: { clients, activeSubs, openTickets, revenue },
    recentPayments
  });
});

app.get('/api/admin/payments', authMiddleware, requireAdmin, (req, res) => {
  const payments = db.prepare(`
    SELECT * FROM payments ORDER BY created_at DESC LIMIT 200
  `).all();
  res.json({ payments });
});

app.get('/api/admin/clients', authMiddleware, requireAdmin, (req, res) => {
  const clients = db.prepare(`
    SELECT u.id, u.email, u.name, u.company, u.phone, u.is_active, u.created_at,
      (SELECT p.name FROM subscriptions s JOIN packages p ON p.id = s.package_id
       WHERE s.user_id = u.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as package_name,
      (SELECT s.end_date FROM subscriptions s
       WHERE s.user_id = u.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as sub_end
    FROM users u
    WHERE u.role = 'client'
    ORDER BY u.created_at DESC
  `).all();
  res.json({ clients });
});

app.get('/api/admin/tickets', authMiddleware, requireAdmin, (req, res) => {
  const tickets = db.prepare(`
    SELECT t.*, u.name as customer_name, u.company, u.email as customer_email
    FROM tickets t
    JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC
  `).all();
  res.json({ tickets });
});

app.patch('/api/admin/tickets/:id', authMiddleware, requireAdmin, (req, res) => {
  const { status, priority, assigned_to } = req.body || {};
  db.prepare(`
    UPDATE tickets SET
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      assigned_to = COALESCE(?, assigned_to),
      updated_at = CURRENT_TIMESTAMP,
      resolved_at = CASE WHEN ? IN ('Resolved','Closed') THEN CURRENT_TIMESTAMP ELSE resolved_at END
    WHERE id = ?
  `).run(status || null, priority || null, assigned_to ?? null, status || null, req.params.id);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  res.json({ success: true, ticket });
});

app.patch('/api/admin/clients/:id', authMiddleware, requireAdmin, (req, res) => {
  const { is_active } = req.body || {};
  db.prepare(`UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = 'client'`)
    .run(is_active ? 1 : 0, req.params.id);
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Infinite Cyberspace Hub API', version: '1.1.0' });
});

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
});
app.use(cors({
  origin: true, // reflect request origin (dev only)
  credentials: true
}));
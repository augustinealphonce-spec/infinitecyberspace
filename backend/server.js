require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'https://augustinealphonce-spec.github.io'],
  credentials: true
}));
app.use(express.json());

// ========== HELPER FUNCTIONS ==========
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// ========== AUTH ROUTES ==========
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = generateToken(user);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company
    }
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, company, phone FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

// ========== TICKETS ROUTES ==========
app.get('/api/tickets', authMiddleware, (req, res) => {
  let tickets;

  if (req.user.role === 'admin') {
    tickets = db.prepare(`
      SELECT t.*, u.name as customer_name, u.company 
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `).all();
  } else {
    tickets = db.prepare(`
      SELECT * FROM tickets 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.user.id);
  }

  res.json({ tickets });
});

app.post('/api/tickets', authMiddleware, (req, res) => {
  const { subject, description, priority = 'Medium' } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ message: 'Subject and description are required' });
  }

  const ticketId = 'TKT-' + Date.now().toString().slice(-6);

  const result = db.prepare(`
    INSERT INTO tickets (ticket_id, user_id, subject, description, priority)
    VALUES (?, ?, ?, ?, ?)
  `).run(ticketId, req.user.id, subject, description, priority);

  const newTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ success: true, ticket: newTicket });
});

app.patch('/api/tickets/:id', authMiddleware, requireAdmin, (req, res) => {
  const { status, priority } = req.body;
  const id = req.params.id;

  db.prepare(`
    UPDATE tickets 
    SET status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, priority, id);

  const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  res.json({ success: true, ticket: updated });
});

// ========== HEALTH CHECK ==========
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Infinite Cyberspace Hub API',
    version: '1.0.0'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
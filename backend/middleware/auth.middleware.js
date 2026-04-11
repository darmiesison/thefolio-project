// backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
// OLD: const User = require('../models/User');
// NEW: use pool directly
const pool = require('../config/db');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized — please log in first' });
  }
  try {
    console.log('auth middleware verifying token:', token);
    console.log('auth middleware JWT_SECRET loaded:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('auth middleware decoded:', decoded);
    // OLD: req.user = await User.findById(decoded.id).select('-password');
    // NEW: SQL query that excludes password column
    const result = await pool.query(
      'SELECT id, name, email, role, bio, profile_pic FROM users WHERE id = $1',
      [decoded.id]
    );
    console.log('auth query result:', result.rows[0]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Account not found or deactivated' });
    }
    req.user = result.rows[0];
    console.log('auth middleware user loaded:', req.user);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or has expired' });
  }
};

module.exports = { protect };

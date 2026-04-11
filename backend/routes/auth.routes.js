// backend/routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// OLD: const User = require('../models/User');
const pool = require('../config/db');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');

const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // OLD: const exists = await User.findOne({ email });
    const emailExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailExists.rows.length > 0)
      return res.status(400).json({ message: 'Email is already registered' });

    const nameExists = await pool.query('SELECT id FROM users WHERE LOWER(name) = LOWER($1)', [name]);
    if (nameExists.rows.length > 0)
      return res.status(400).json({ message: 'Name is already taken' });

    // OLD: password was hashed by pre-save hook automatically
    // NEW: must hash manually before INSERT
    const hashedPassword = await bcrypt.hash(password, 12);

    // OLD: const user = await User.create({ name, email, password });
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, hashedPassword]
    );
    const user = result.rows[0];

    res.status(201).json({
      token: generateToken(user.id),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($1)',
      [email]
    );
    
    if (result.rows.length === 0)
      return res.status(400).json({ message: 'Invalid email or password' });

    const user = result.rows[0];

    if (user.status && user.status === 'inactive')
      return res.status(403).json({ message: 'Your account is deactivated. Contact admin.' });

    // OLD: const match = await user.matchPassword(password);
    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ message: 'Invalid email or password' });

    const profilePicUrl = user.profile_pic
      ? `${req.protocol}://${req.get('host')}/uploads/${user.profile_pic}`
      : "";

    res.json({
      token: generateToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_pic: profilePicUrl,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, role, bio, profile_pic, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  const profileUser = result.rows[0];
  if (profileUser.profile_pic) {
    profileUser.profile_pic = `${req.protocol}://${req.get('host')}/uploads/${profileUser.profile_pic}`;
  }
  res.json(profileUser);
});

// PUT /api/auth/profile
router.put('/profile', protect, upload.single('profilePic'), async (req, res) => {
  try {
    const { name, bio } = req.body;
    const profilePic = req.file ? req.file.filename : null;

    console.log("Profile update request:", { name, bio, profilePic, file: req.file });

    if (name) {
      const nameExists = await pool.query(
        'SELECT id FROM users WHERE LOWER(name) = LOWER($1) AND id <> $2',
        [name, req.user.id]
      );
      if (nameExists.rows.length > 0)
        return res.status(400).json({ message: 'Name is already taken' });
    }

    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const values = [];
    let idx = 1;

    if (name) { query += `, name = $${idx++}`; values.push(name); }
    if (bio !== undefined) { query += `, bio = $${idx++}`; values.push(bio); }
    if (profilePic) { query += `, profile_pic = $${idx++}`; values.push(profilePic); }

    query += ` WHERE id = $${idx} RETURNING id, name, email, role, bio, profile_pic, created_at`;
    values.push(req.user.id);

    const result = await pool.query(query, values);
    const updatedUser = result.rows[0];
    if (updatedUser.profile_pic) {
      updatedUser.profile_pic = `${req.protocol}://${req.get('host')}/uploads/${updatedUser.profile_pic}`;
    }

    console.log("Profile update response:", updatedUser);
    res.json(updatedUser);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ message: 'Email is required' });

  if (!email.toLowerCase().endsWith('@gmail.com'))
    return res.status(400).json({ message: 'Please use a Gmail account' });

  try {
    const result = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [result.rows[0].id, token, expiresAt]
    );

    // In a real app, send this token to the user's Gmail address.
    res.json({ message: 'Reset token created. Use it to reset your password.', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword)
    return res.status(400).json({ message: 'Email, token, and new password are required' });

  try {
    const userResult = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (userResult.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const resetResult = await pool.query(
      'SELECT * FROM password_resets WHERE user_id = $1 AND token = $2 AND expires_at > NOW()',
      [userResult.rows[0].id, token]
    );
    if (resetResult.rows.length === 0)
      return res.status(400).json({ message: 'Invalid or expired reset token' });

    const hashedNew = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNew, userResult.rows[0].id]);
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [userResult.rows[0].id]);

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    
    const match = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!match)
      return res.status(400).json({ message: 'Current password is incorrect' });

    const hashedNew = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNew, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/auth/delete
router.delete('/delete', protect, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

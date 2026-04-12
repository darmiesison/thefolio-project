const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');

const router = express.Router();

const generateToken = (id) => {
  // Ensure id is a string
  const idString = id && typeof id === 'object' && id.toString ? id.toString() : String(id);
  return jwt.sign({ id: idString }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const emailExists = await User.findOne({ email: { $regex: email, $options: 'i' } });
    if (emailExists)
      return res.status(400).json({ message: 'Email is already registered' });

    const nameExists = await User.findOne({ name: { $regex: name, $options: 'i' } });
    if (nameExists)
      return res.status(400).json({ message: 'Name is already taken' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      token: generateToken(user._id.toString()),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [
        { email: { $regex: email, $options: 'i' } },
        { name: { $regex: email, $options: 'i' } }
      ]
    });
    
    if (!user)
      return res.status(400).json({ message: 'Invalid email or password' });

    if (user.status === 'inactive')
      return res.status(403).json({ message: 'Your account is deactivated. Contact admin.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: 'Invalid email or password' });

    const profilePicUrl = user.profile_pic
      ? `${req.protocol}://${req.get('host')}/uploads/${user.profile_pic}`
      : "";

    res.json({
      token: generateToken(user._id.toString()),
      user: {
        id: user._id,
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
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const userData = user.toObject();
    if (userData.profile_pic) {
      userData.profile_pic = `${req.protocol}://${req.get('host')}/uploads/${userData.profile_pic}`;
    }
    res.json(userData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, upload.single('profilePic'), async (req, res) => {
  try {
    const { name, bio } = req.body;
    const profilePic = req.file ? req.file.filename : null;

    if (name) {
      const nameExists = await User.findOne({
        name: { $regex: name, $options: 'i' },
        _id: { $ne: req.user.id }
      });
      if (nameExists)
        return res.status(400).json({ message: 'Name is already taken' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePic) updateData.profile_pic = profilePic;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    const userData = user.toObject();
    if (userData.profile_pic) {
      userData.profile_pic = `${req.protocol}://${req.get('host')}/uploads/${userData.profile_pic}`;
    }

    res.json(userData);
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
    const user = await User.findOne({ email: { $regex: email, $options: 'i' } });
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordReset.create({
      user_id: user._id,
      token,
      expires_at: expiresAt
    });

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
    const user = await User.findOne({ email: { $regex: email, $options: 'i' } });
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    const resetRecord = await PasswordReset.findOne({
      user_id: user._id,
      token,
      expires_at: { $gt: new Date() }
    });
    
    if (!resetRecord)
      return res.status(400).json({ message: 'Invalid or expired reset token' });

    const hashedNew = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, { password: hashedNew });
    await PasswordReset.deleteMany({ user_id: user._id });

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match)
      return res.status(400).json({ message: 'Current password is incorrect' });

    const hashedNew = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user.id, { password: hashedNew });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/auth/delete
router.delete('/delete', protect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

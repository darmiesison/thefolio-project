const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const CatPost = require('../models/CatPost');
const PasswordReset = require('../models/PasswordReset');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');

const router = express.Router();

const generateToken = (id) => {
  // Ensure id is a string
  const idString = id && typeof id === 'object' && id.toString ? id.toString() : String(id);
  return jwt.sign({ id: idString }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const buildImageUrl = (req, image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  // Always use HTTPS for production
  return `https://${req.get('host')}/uploads/${image}`;
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, gender, interestLevel } = req.body;
  try {
    // Validate required fields
    if (!gender) {
      return res.status(400).json({ message: 'Gender is required' });
    }

    const emailExists = await User.findOne({ email: { $regex: email, $options: 'i' } });
    if (emailExists)
      return res.status(400).json({ message: 'Email is already registered' });

    const nameExists = await User.findOne({ name: { $regex: name, $options: 'i' } });
    if (nameExists)
      return res.status(400).json({ message: 'Name is already taken' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      gender: gender,
      interestLevel: interestLevel || null,
    });

    res.status(201).json({
      token: generateToken(user._id.toString()),
      user: { 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email, 
        role: user.role,
        gender: user.gender,
        interestLevel: user.interestLevel,
      }
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

    res.json({
      token: generateToken(user._id.toString()),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        profile_pic: user.profile_pic && user.profile_pic.startsWith('data:') ? user.profile_pic : buildImageUrl(req, user.profile_pic),
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
    userData.id = user._id.toString();
    userData.profile_pic = userData.profile_pic && userData.profile_pic.startsWith('data:') ? userData.profile_pic : buildImageUrl(req, userData.profile_pic);
    userData.gender = user.gender;
    userData.interestLevel = user.interestLevel || null;
    res.json(userData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, gender, interestLevel, profile_pic } = req.body;
    
    // Handle base64 image from frontend
    let profilePicToSave = null;
    if (profile_pic) {
      // Base64 image from frontend
      profilePicToSave = profile_pic;
    }

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
    if (profilePicToSave) updateData.profile_pic = profilePicToSave;
    if (gender) updateData.gender = gender;
    if (interestLevel !== undefined) updateData.interestLevel = interestLevel || null;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    const userData = user.toObject();
    userData.id = user._id.toString();
    // If profile_pic is a base64 string, return it directly; otherwise build URL
    userData.profile_pic = userData.profile_pic && userData.profile_pic.startsWith('data:') 
      ? userData.profile_pic 
      : buildImageUrl(req, userData.profile_pic);
    userData.gender = user.gender;
    userData.interestLevel = user.interestLevel || null;

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
    const userId = req.user.id && typeof req.user.id === 'object' && req.user.id.toString 
      ? req.user.id.toString() 
      : String(req.user.id);
    
    // Delete all posts by this user
    await CatPost.deleteMany({ authorId: userId });
    
    // Delete all password reset tokens for this user
    await PasswordReset.deleteMany({ user_id: req.user.id });
    
    // Delete the user account
    await User.findByIdAndDelete(req.user.id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle both numeric IDs and ObjectId strings from tokens
    let userId = decoded.id;
    
    // If the decoded id is numeric, it might be from an old token - convert to ObjectId if valid
    if (typeof userId === 'number') {
      // Try to find user by numeric id first (for backwards compatibility)
      let user = await User.findOne({ _id: userId }).select('-password');
      if (!user && mongoose.Types.ObjectId.isValid(userId.toString())) {
        // If not found, try converting to ObjectId
        user = await User.findById(new mongoose.Types.ObjectId(userId.toString())).select('-password');
      }
      if (user) {
        req.user = user.toObject();
        req.user.id = user._id;
        return next();
      }
    } else {
      // Try to use the decoded id directly (should be ObjectId string)
      const user = await User.findById(userId).select('-password');
      if (user) {
        req.user = user.toObject();
        req.user.id = user._id;
        return next();
      }
    }
    
    return res.status(401).json({ message: 'Account not found or deactivated' });
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: 'Token is invalid or has expired' });
  }
};

module.exports = { protect };

// backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
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
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Account not found or deactivated' });
    }
    req.user = user.toObject();
    req.user.id = user._id; // Ensure id field is set for compatibility
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or has expired' });
  }
};

module.exports = { protect };

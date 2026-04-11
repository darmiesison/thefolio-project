const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/thefolio';

console.log('MongoDB connection URI:', MONGO_URI ? 'Set' : 'Not set');
console.log('Attempting MongoDB connection...');

mongoose.connect(MONGO_URI, {
  // Remove deprecated options - they're no longer needed in mongoose 6+
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

mongoose.connection.on('connected', () => {
  console.log('✓ MongoDB Connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('✗ MongoDB connection failed:', err.message);
  console.error('Full error:', err);
  process.exit(1);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

module.exports = mongoose;

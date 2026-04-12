// backend/seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    // Check if admin already exists
    const exists = await User.findOne({
      $or: [{ email: 'admin@thefolio.com' }, { name: 'admin' }]
    });

    if (exists) {
      console.log('Admin already exists.');
      process.exit();
    }

    // Hash password manually
    const hashed = await bcrypt.hash('admin', 12);
    
    // Create admin user
    const admin = new User({
      name: 'admin',
      email: 'admin@thefolio.com',
      password: hashed,
      role: 'admin',
      status: 'active'
    });

    await admin.save();
    console.log('Admin created! Username: admin / Email: admin@thefolio.com / Password: admin');
    process.exit();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

seed();
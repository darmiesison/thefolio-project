// backend/seedAdmin.js
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  try {
    const exists = await pool.query("SELECT id FROM users WHERE email = 'admin@thefolio.com' OR LOWER(name) = LOWER('admin')");
    if (exists.rows.length > 0) {
      console.log('Admin already exists.');
      process.exit();
    }

    // Must hash manually — no Mongoose pre-save hook!
    const hashed = await bcrypt.hash('admin', 12);
    await pool.query(
      'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)',
      ['admin', 'admin@thefolio.com', hashed, 'admin', 'active']
    );
    console.log('Admin created! Username: admin / Email: admin@thefolio.com / Password: admin');
    process.exit();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

seed();
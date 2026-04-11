require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const res = await pool.query('SELECT id, user_id, title, content, image_url, created_at FROM posts ORDER BY created_at DESC LIMIT 5');
    console.log('posts:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
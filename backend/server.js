require("dotenv").config(); // Load .env variables FIRST
console.log('backend cwd:', process.cwd());
console.log('backend JWT_SECRET loaded:', !!process.env.JWT_SECRET, process.env.JWT_SECRET ? process.env.JWT_SECRET.slice(0, 5) : 'none');
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require('bcryptjs');
const pool = require("./config/db");
//Importroutes(youwillcreatethese files in the next steps)
const authRoutes = require("./routes/auth.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");
const adminRoutes = require("./routes/admin.routes");
const contactRoutes = require("./routes/contact.routes");
const app = express();
//ConnecttoPostgreSQL(handles connection in config/db.js)
//──Middleware─────────────────────────────────────────────────
//AllowReact(port3000)tocall this server
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
//ParseincomingJSONrequestbodies
app.use(express.json());
//Serveuploadedimagefilesaspublic URLs
//e.g.http://localhost:5000/uploads/my-image.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
//──Routes────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
const ensureContactTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Contact messages table ensured');
  } catch (err) {
    console.error('Unable to ensure contact messages table exists:', err.message);
  }
};

const ensurePasswordResetTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Password resets table ensured');
  } catch (err) {
    console.error('Unable to ensure password reset table exists:', err.message);
  }
};

const ensureAdminUser = async () => {
  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($2)",
      ['admin@thefolio.com', 'admin']
    );
    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin', 12);
      await pool.query(
        'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)',
        ['admin', 'admin@thefolio.com', hashedPassword, 'admin', 'active']
      );
      console.log('Admin user auto-created: admin / admin');
    }
  } catch (err) {
    console.error('Unable to ensure admin user exists:', err.message);
  }
};

Promise.all([ensureContactTable(), ensurePasswordResetTable(), ensureAdminUser()]).then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});

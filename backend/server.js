require("dotenv").config();
console.log('backend cwd:', process.cwd());
console.log('backend JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('backend MONGO_URI loaded:', !!process.env.MONGO_URI);
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("./config/mongo");
//Import routes
const authRoutes = require("./routes/auth.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");
const adminRoutes = require("./routes/admin.routes");
const contactRoutes = require("./routes/contact.routes");
const app = express();
//──Middleware─────────────────────────────────────────────────
//AllowReact(port3000)tocall this server
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    'https://thefolio.vercel.app'  // your Vercel URL (update after deployment)
  ], 
  credentials: true 
}));

// Or allow all origins during development/testing:
// app.use(cors());  - use this temporarily if you are unsure of your Vercel URL
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

const User = require('./models/User');
const bcrypt = require('bcryptjs');

const ensureAdminUser = async () => {
  try {
    const admin = await User.findOne({
      $or: [{ email: 'admin@thefolio.com' }, { name: 'admin' }]
    });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin', 12);
      await User.create({
        name: 'admin',
        email: 'admin@thefolio.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      console.log('Admin user auto-created: admin / admin');
    }
  } catch (err) {
    console.error('Unable to ensure admin user exists:', err.message);
  }
};

let connectionTimeout;

mongoose.connection.on('connected', async () => {
  console.log('✓ MongoDB Connected');
  clearTimeout(connectionTimeout); // Clear timeout once connected
  await ensureAdminUser();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✓ Server is running on port ${PORT}`);
  });
});

// Fallback timeout if connection doesn't complete
let connectionStarted = false;
mongoose.connection.on('connecting', () => {
  console.log('Attempting to connect to MongoDB...');
  connectionStarted = true;
});

connectionTimeout = setTimeout(() => {
  if (!connectionStarted || mongoose.connection.readyState !== 1) {
    console.error('✗ MongoDB connection timeout - not connected after 30 seconds');
    process.exit(1);
  }
}, 30000);

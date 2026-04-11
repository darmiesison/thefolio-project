// backend/config/initDatabase.js
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Connect to default postgres database first
const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace('/thefolio', '/postgres'),
});

const initDatabase = async () => {
  try {
    console.log('Connecting to PostgreSQL...');
    const client = await pool.connect();

    // Create database
    console.log('Creating database "thefolio"...');
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = 'thefolio'
        AND pid <> pg_backend_pid();
    `);
    await client.query('DROP DATABASE IF EXISTS thefolio WITH (FORCE)');
    await client.query('CREATE DATABASE thefolio');
    console.log('✓ Database created');

    client.release();

    // Now connect to the new database
    const dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const dbClient = await dbPool.connect();

    // Create tables
    console.log('Creating tables...');

    await dbClient.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        bio TEXT DEFAULT '',
        profile_pic VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    const adminPassword = await bcrypt.hash('admin', 12);
    await dbClient.query(
      'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
      ['admin', 'admin@thefolio.com', adminPassword, 'admin', 'active']
    );
    console.log('✓ Admin user seeded');

    await dbClient.query(`
      CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(255) DEFAULT '',
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'removed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Posts table created');

    await dbClient.query(`
      CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Comments table created');

    await dbClient.query(`
      CREATE TABLE likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (post_id, user_id)
      )
    `);
    console.log('✓ Likes table created');

    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Contact messages table created');

    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Password resets table created');

    // Create indexes
    await dbClient.query('CREATE INDEX idx_posts_user_id ON posts(user_id)');
    await dbClient.query('CREATE INDEX idx_comments_post_id ON comments(post_id)');
    await dbClient.query('CREATE INDEX idx_comments_author_id ON comments(author_id)');
    await dbClient.query('CREATE INDEX idx_likes_post_id ON likes(post_id)');
    await dbClient.query('CREATE INDEX idx_likes_user_id ON likes(user_id)');
    console.log('✓ Indexes created');

    dbClient.release();
    await dbPool.end();
    await pool.end();

    console.log('\n✅ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
};

initDatabase();

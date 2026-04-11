// backend/routes/post.routes.js
const express = require('express');
const pool = require('../config/db');
const { protect } = require('../middleware/auth.middleware');
const { memberOrAdmin } = require('../middleware/role.middleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.use((req, res, next) => {
  console.log('post route middleware:', req.method, req.originalUrl, 'auth user id:', req.user?.id);
  next();
});

const buildImageUrl = (req, image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return `${req.protocol}://${req.get('host')}/uploads/${image}`;
};

router.get('/', protect, async (req, res) => {
  console.log('GET /posts route reached:', req.user?.id, req.user?.role);
  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS author_name, u.profile_pic AS author_pic,
              COUNT(DISTINCT l.id) AS likes,
              MAX(CASE WHEN l.user_id = $1 THEN 1 ELSE 0 END)::boolean AS liked,
              COUNT(DISTINCT c.id) AS comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       GROUP BY p.id, u.name, u.profile_pic
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    const posts = result.rows.map((row) => ({
      ...row,
      likes: Number(row.likes),
      comments_count: Number(row.comments_count),
      author_pic: buildImageUrl(req, row.author_pic),
      image_url: buildImageUrl(req, row.image_url),
    }));

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my-posts', protect, async (req, res) => {
  console.log('GET /posts/my-posts route reached:', req.user?.id);
  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS author_name, u.profile_pic AS author_pic,
              COUNT(DISTINCT l.id) AS likes,
              true AS liked,
              COUNT(DISTINCT c.id) AS comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id, u.name, u.profile_pic
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    const posts = result.rows.map((row) => ({
      ...row,
      likes: Number(row.likes),
      comments_count: Number(row.comments_count),
      author_pic: buildImageUrl(req, row.author_pic),
      image_url: buildImageUrl(req, row.image_url),
    }));

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS author_name, u.profile_pic AS author_pic,
              COUNT(DISTINCT l.id) AS likes,
              MAX(CASE WHEN l.user_id = $2 THEN 1 ELSE 0 END)::boolean AS liked,
              COUNT(DISTINCT c.id) AS comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, u.name, u.profile_pic`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Post not found' });

    const row = result.rows[0];
    row.likes = Number(row.likes);
    row.comments_count = Number(row.comments_count);
    row.author_pic = buildImageUrl(req, row.author_pic);
    row.image_url = buildImageUrl(req, row.image_url);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, memberOrAdmin, upload.single('image'), async (req, res) => {
  console.log('POST /posts route reached:', req.user?.id, req.user?.role, { body: req.body });
  try {
    console.log("Create post request:", { body: req.body, file: req.file });

    const title = req.body.title || (req.body.content || 'Cat Post').slice(0, 255);
    const content = req.body.content || '';
    const image = req.file ? req.file.filename : '';

    console.log("Inserting post:", { user_id: req.user.id, title, content, image });

    const result = await pool.query(
      'INSERT INTO posts (user_id, title, content, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, content, image]
    );

    console.log("Post inserted:", result.rows[0]);

    const postQuery = await pool.query(
      `SELECT p.*, u.name AS author_name, u.profile_pic AS author_pic,
              0 AS likes, false AS liked, 0 AS comments_count
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [result.rows[0].id]
    );

    const post = postQuery.rows[0];
    post.author_pic = buildImageUrl(req, post.author_pic);
    post.image_url = buildImageUrl(req, post.image_url);

    res.status(201).json(post);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, memberOrAdmin, (req, res, next) => {
  // Check if this is a multipart request (with file) or JSON request
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    upload.single('image')(req, res, next);
  } else {
    next();
  }
}, async (req, res) => {
  try {
    console.log('PUT /posts/:id route reached:', req.params.id, req.user?.id, req.user?.role);
    console.log('PUT request body:', req.body);
    console.log('PUT request file:', req.file);

    const saved = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (saved.rows.length === 0)
      return res.status(404).json({ message: 'Post not found' });

    const post = saved.rows[0];
    const isOwner = post.user_id === req.user.id;
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    const content = req.body.content !== undefined ? req.body.content : post.content;
    const image = req.file ? req.file.filename : post.image_url;

    console.log('Updating post:', { content, image });

    const result = await pool.query(
      'UPDATE posts SET content = $1, image_url = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [content, image, req.params.id]
    );

    const postQuery = await pool.query(
      `SELECT p.*, u.name AS author_name, u.profile_pic AS author_pic,
              COUNT(DISTINCT l.id) AS likes,
              MAX(CASE WHEN l.user_id = $2 THEN 1 ELSE 0 END)::boolean AS liked,
              COUNT(DISTINCT c.id) AS comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, u.name, u.profile_pic`,
      [req.params.id, req.user.id]
    );

    const updated = postQuery.rows[0];
    updated.author_pic = buildImageUrl(req, updated.author_pic);
    updated.image_url = buildImageUrl(req, updated.image_url);

    res.json(updated);
  } catch (err) {
    console.error("PUT post error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (post.rows.length === 0)
      return res.status(404).json({ message: 'Post not found' });

    const userId = req.user.id;
    const existing = await pool.query('SELECT id FROM likes WHERE post_id = $1 AND user_id = $2', [req.params.id, userId]);

    if (existing.rows.length === 0) {
      await pool.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [req.params.id, userId]);
    } else {
      await pool.query('DELETE FROM likes WHERE id = $1', [existing.rows[0].id]);
    }

    const status = await pool.query(
      `SELECT COUNT(*) AS likes,
              MAX(CASE WHEN user_id = $1 THEN 1 ELSE 0 END)::boolean AS liked
       FROM likes WHERE post_id = $2`,
      [userId, req.params.id]
    );

    res.json({
      likes: Number(status.rows[0].likes),
      liked: status.rows[0].liked,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, memberOrAdmin, async (req, res) => {
  try {
    const saved = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (saved.rows.length === 0)
      return res.status(404).json({ message: 'Post not found' });

    const post = saved.rows[0];
    const isOwner = post.user_id === req.user.id;
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

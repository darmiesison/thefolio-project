// backend/routes/comment.routes.js
const express = require('express');
const pool = require('../config/db');
const { protect } = require('../middleware/auth.middleware');
const { memberOrAdmin } = require('../middleware/role.middleware');

const router = express.Router();

// GET /api/comments/:postId
router.get('/:postId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.post_id, c.author_id, c.body AS content, c.created_at,
              u.name AS author_name, u.profile_pic AS author_pic
       FROM comments c JOIN users u ON c.author_id = u.id
       WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
      [req.params.postId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/comments/:postId
router.post('/:postId', protect, memberOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO comments (post_id, author_id, body) VALUES ($1, $2, $3) RETURNING *',
      [req.params.postId, req.user.id, req.body.body]
    );
    const comment = await pool.query(
      `SELECT c.id, c.post_id, c.author_id, c.body AS content, c.created_at,
              u.name AS author_name, u.profile_pic AS author_pic
       FROM comments c JOIN users u ON c.author_id = u.id WHERE c.id = $1`,
      [result.rows[0].id]
    );
    res.status(201).json(comment.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', protect, memberOrAdmin, async (req, res) => {
  try {
    const comment = await pool.query('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (comment.rows.length === 0)
      return res.status(404).json({ message: 'Comment not found' });

    const isOwner = comment.rows[0].author_id === req.user.id;
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

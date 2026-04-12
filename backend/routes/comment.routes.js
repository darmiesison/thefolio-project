const express = require('express');
const CatPost = require('../models/CatPost');
const User = require('../models/User');
const { protect } = require('../middleware/auth.middleware');
const { memberOrAdmin } = require('../middleware/role.middleware');

const router = express.Router();

// GET /api/comments/:postId
router.get('/:postId', async (req, res) => {
  try {
    const post = await CatPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const comments = await Promise.all(post.comments.map(async (comment) => {
      const author = await User.findById(comment.authorId).select('name profile_pic');
      return {
        ...comment,
        author_name: author?.name || 'Unknown',
        author_pic: author?.profile_pic || ''
      };
    }));
    
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/comments/:postId
router.post('/:postId', protect, memberOrAdmin, async (req, res) => {
  try {
    const { body } = req.body;
    const post = await CatPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // Ensure authorId is a string
    const authorId = req.user.id && typeof req.user.id === 'object' && req.user.id.toString 
      ? req.user.id.toString() 
      : String(req.user.id);
    
    const comment = {
      commentId: Date.now().toString(),
      authorId: authorId,
      authorName: req.user.name,
      authorPic: req.user.profile_pic || '',
      body: body,
      createdAt: new Date()
    };
    
    post.comments.push(comment);
    await post.save();
    
    res.status(201).json({
      ...comment,
      author_name: req.user.name
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/comments/:postId/:commentId
router.delete('/:postId/:commentId', protect, memberOrAdmin, async (req, res) => {
  try {
    const post = await CatPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const comment = post.comments.find(c => c.commentId === req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
    if (comment.authorId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    
    post.comments = post.comments.filter(c => c.commentId !== req.params.commentId);
    await post.save();
    
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

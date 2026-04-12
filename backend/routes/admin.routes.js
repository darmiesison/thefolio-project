const express = require('express');
const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage');
const CatPost = require('../models/CatPost');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/role.middleware');

const router = express.Router();

router.use(protect, adminOnly);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
    const formattedUsers = users.map(user => ({
      ...user.toObject(),
      id: user._id.toString(),
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()
    }));
    res.json(formattedUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin')
      return res.status(404).json({ message: 'User not found' });

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true }
    ).select('-password');
    
    res.json({ message: `User is now ${newStatus}`, user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin')
      return res.status(404).json({ message: 'User not found' });

    // Ensure userId is a string for comparison
    const userId = req.params.id && typeof req.params.id === 'object' && req.params.id.toString 
      ? req.params.id.toString() 
      : String(req.params.id);
    
    // Delete all posts by this user
    await CatPost.deleteMany({ authorId: userId });
    
    // Delete the user account
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'User account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/contact-messages
router.get('/contact-messages', async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    const formattedMessages = messages.map(msg => ({
      ...msg.toObject(),
      id: msg._id.toString(),
      createdAt: msg.createdAt ? new Date(msg.createdAt).toISOString() : new Date().toISOString()
    }));
    res.json(formattedMessages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/contact-messages/:id
router.delete('/contact-messages/:id', async (req, res) => {
  try {
    const result = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json({ message: 'Contact message deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await CatPost.find().sort({ createdAt: -1 });
    const enrichedPosts = await Promise.all(posts.map(async (post) => {
      const author = await User.findById(post.authorId).select('name profile_pic');
      const postObj = post.toObject();
      return {
        ...postObj,
        id: post._id.toString(),
        author_name: author?.name || 'Unknown',
        author_pic: author?.profile_pic || '',
        image_url: post.image || '',
        created_at: post.createdAt,
        status: 'published'
      };
    }));
    res.json(enrichedPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', async (req, res) => {
  try {
    const result = await CatPost.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

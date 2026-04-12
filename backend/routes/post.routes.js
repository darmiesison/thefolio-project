const express = require('express');
const CatPost = require('../models/CatPost');
const User = require('../models/User');
const { protect } = require('../middleware/auth.middleware');
const { memberOrAdmin } = require('../middleware/role.middleware');
const upload = require('../middleware/upload');

const router = express.Router();

const buildImageUrl = (req, image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  
  // For Render, always use HTTPS. Check X-Forwarded-Proto header for reverse proxy
  const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
  const host = req.get('host');
  
  return `https://${host}/uploads/${image}`;
};

// GET /api/posts
router.get('/', protect, async (req, res) => {
  try {
    const posts = await CatPost.find().sort({ createdAt: -1 });
    const enrichedPosts = await Promise.all(posts.map(async (post) => {
      const author = await User.findById(post.authorId).select('name profile_pic');
      const postObj = post.toObject();
      return {
        ...postObj,
        id: post._id.toString(),
        author_name: author?.name || 'Unknown',
        author_pic: author?.profile_pic ? buildImageUrl(req, author.profile_pic) : '',
        image_url: buildImageUrl(req, post.image),
        liked: post.likedBy.includes(req.user.id),
        likes: post.likedBy.length,
        comments_count: post.comments.length
      };
    }));
    res.json(enrichedPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await CatPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const author = await User.findById(post.authorId).select('name profile_pic');
    const postObj = post.toObject();
    res.json({
      ...postObj,
      id: post._id.toString(),
      author_name: author?.name || 'Unknown',
      author_pic: author?.profile_pic ? buildImageUrl(req, author.profile_pic) : '',
      image_url: buildImageUrl(req, post.image),
      liked: post.likedBy.includes(req.user.id),
      likes: post.likedBy.length,
      comments_count: post.comments.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts
// Note: upload.single('image') is still used to parse FormData, but files are ignored on Vercel
// (Vercel has no persistent storage for file uploads)
router.post('/', protect, memberOrAdmin, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    // On Vercel, images are not supported (no persistent /uploads/ folder)
    // Files uploaded are silently ignored
    const image = '';
    
    // Ensure authorId is a string
    const authorId = req.user.id && typeof req.user.id === 'object' && req.user.id.toString 
      ? req.user.id.toString() 
      : String(req.user.id);
    
    const post = await CatPost.create({
      authorId: authorId,
      authorName: req.user.name,
      authorPic: req.user.profile_pic || '',
      content: content || '',
      image: image
    });
    
    const postObj = post.toObject();
    res.status(201).json({
      ...postObj,
      id: post._id.toString(),
      author_name: req.user.name,
      author_pic: buildImageUrl(req, req.user.profile_pic || ''),
      image_url: buildImageUrl(req, image),
      liked: false,
      likes: 0,
      comments_count: 0
    });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/posts/:id
router.put('/:id', protect, memberOrAdmin, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await CatPost.findById(req.params.id);
    
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.authorId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    
    post.content = content || post.content;
    await post.save();
    
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', protect, memberOrAdmin, async (req, res) => {
  try {
    const post = await CatPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    if (post.authorId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    
    await CatPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await CatPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const idx = post.likedBy.indexOf(req.user.id);
    if (idx > -1) {
      post.likedBy.splice(idx, 1);
    } else {
      post.likedBy.push(req.user.id);
    }
    await post.save();
    
    res.json({ liked: idx === -1, likes: post.likedBy.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

module.exports = router;

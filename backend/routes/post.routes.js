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
  if (image.startsWith('data:')) return image; // Base64 image, return as-is
  
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
        authorId: post.authorId.toString(),
        author_name: author?.name || 'Unknown',
        author_pic: author?.profile_pic && author.profile_pic.startsWith('data:') ? author.profile_pic : buildImageUrl(req, author?.profile_pic || ''),
        image_url: post.image && post.image.startsWith('data:') ? post.image : buildImageUrl(req, post.image),
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

// GET /api/posts/my-posts - Get only current user's posts
router.get('/my-posts', protect, async (req, res) => {
  try {
    // Ensure userId is a string for comparison
    const userId = req.user.id && typeof req.user.id === 'object' && req.user.id.toString 
      ? req.user.id.toString() 
      : String(req.user.id);
    
    const posts = await CatPost.find({ authorId: userId }).sort({ createdAt: -1 });
    const enrichedPosts = await Promise.all(posts.map(async (post) => {
      const author = await User.findById(post.authorId).select('name profile_pic');
      const postObj = post.toObject();
      return {
        ...postObj,
        id: post._id.toString(),
        authorId: post.authorId.toString(),
        author_name: author?.name || 'Unknown',
        author_pic: author?.profile_pic && author.profile_pic.startsWith('data:') ? author.profile_pic : buildImageUrl(req, author?.profile_pic || ''),
        image_url: post.image && post.image.startsWith('data:') ? post.image : buildImageUrl(req, post.image),
        liked: post.likedBy.includes(userId),
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
      authorId: post.authorId.toString(),
      author_name: author?.name || 'Unknown',
      author_pic: author?.profile_pic && author.profile_pic.startsWith('data:') ? author.profile_pic : buildImageUrl(req, author?.profile_pic || ''),
      image_url: post.image && post.image.startsWith('data:') ? post.image : buildImageUrl(req, post.image),
      liked: post.likedBy.includes(req.user.id),
      likes: post.likedBy.length,
      comments_count: post.comments.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts
router.post('/', protect, memberOrAdmin, async (req, res) => {
  try {
    const { content, image } = req.body;
    
    console.log("Creating post - image length:", image ? image.length : 0);
    
    // Ensure authorId is a string
    const authorId = req.user.id && typeof req.user.id === 'object' && req.user.id.toString 
      ? req.user.id.toString() 
      : String(req.user.id);
    
    const post = await CatPost.create({
      authorId: authorId,
      authorName: req.user.name,
      authorPic: req.user.profile_pic || '',
      content: content || '',
      image: image || '' // Store base64 image directly
    });
    
    console.log("Post created - stored image length:", post.image ? post.image.length : 0);
    
    const postObj = post.toObject();
    const { image, ...postWithoutImage } = postObj; // Exclude raw image field
    
    // Always return the actual stored image, don't try to build URL
    const responseObj = {
      ...postWithoutImage,
      id: post._id.toString(),
      author_name: req.user.name,
      author_pic: req.user.profile_pic && req.user.profile_pic.startsWith('data:') ? req.user.profile_pic : buildImageUrl(req, req.user.profile_pic || ''),
      image_url: post.image, // Return the actual stored image (could be base64 or empty string)
      liked: false,
      likes: 0,
      comments_count: 0
    };
    
    console.log("Response image_url length:", responseObj.image_url ? responseObj.image_url.length : 0);
    
    res.status(201).json(responseObj);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/posts/:id
router.put('/:id', protect, memberOrAdmin, async (req, res) => {
  try {
    const { content, image } = req.body;
    const post = await CatPost.findById(req.params.id);
    
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // Ensure userId is a string for safe comparison
    const userId = req.user.id && typeof req.user.id === 'object' && req.user.id.toString 
      ? req.user.id.toString() 
      : String(req.user.id);
    
    const postAuthorId = post.authorId && typeof post.authorId === 'string' 
      ? post.authorId 
      : String(post.authorId);
    
    if (postAuthorId !== userId && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    
    post.content = content || post.content;
    if (image) {
      post.image = image; // Store base64 image directly
    }
    await post.save();
    
    const postObj = post.toObject();
    res.json({
      ...postObj,
      id: post._id.toString(),
      authorId: post.authorId.toString(),
      author_name: req.user.name,
      author_pic: req.user.profile_pic && req.user.profile_pic.startsWith('data:') ? req.user.profile_pic : buildImageUrl(req, req.user.profile_pic || ''),
      image_url: post.image || '',
      liked: post.likedBy.includes(userId),
      likes: post.likedBy.length,
      comments_count: post.comments.length
    });
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ message: err.message });
  }
});
  }
});

// DELETE /api/posts/:id
router.delete('/:id', protect, memberOrAdmin, async (req, res) => {
  try {
    const post = await CatPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // Ensure userId is a string for safe comparison
    const userId = req.user.id && typeof req.user.id === 'object' && req.user.id.toString 
      ? req.user.id.toString() 
      : String(req.user.id);
    
    const postAuthorId = post.authorId && typeof post.authorId === 'string' 
      ? post.authorId 
      : String(post.authorId);
    
    if (postAuthorId !== userId && req.user.role !== 'admin')
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

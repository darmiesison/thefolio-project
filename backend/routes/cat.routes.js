const express = require('express');
const mongoose = require('mongoose');
const CatPost = require('../models/CatPost');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');

const router = express.Router();

const buildUploadUrl = (req, filename) => {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

const buildProfilePicUrl = (req, profilePicValue) => {
  if (!profilePicValue) return '';
  if (profilePicValue.startsWith('http')) return profilePicValue;
  return `${req.protocol}://${req.get('host')}/uploads/${profilePicValue}`;
};

const buildPostResponse = (post, userId) => {
  const postObj = post.toObject ? post.toObject() : post;
  return {
    ...postObj,
    likes: postObj.likedBy?.length || 0,
    liked: postObj.likedBy?.includes(userId),
  };
};

router.get('/', protect, async (req, res) => {
  try {
    const posts = await CatPost.find().sort({ createdAt: -1 });
    res.json(posts.map((post) => buildPostResponse(post, req.user.id.toString())));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const imageUrl = req.file ? buildUploadUrl(req, req.file.filename) : '';
    const authorPic = buildProfilePicUrl(req, req.user.profile_pic || '');

    const post = await CatPost.create({
      authorId: req.user.id.toString(),
      authorName: req.user.name,
      authorPic,
      content: req.body.content || '',
      image: imageUrl,
      likedBy: [],
      comments: [],
    });

    res.status(201).json(buildPostResponse(post, req.user.id.toString()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const post = await CatPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.authorId === req.user.id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.content = req.body.content !== undefined ? req.body.content : post.content;
    if (req.file) {
      post.image = buildUploadUrl(req, req.file.filename);
    }
    post.updatedAt = new Date();

    await post.save();
    res.json(buildPostResponse(post, req.user.id.toString()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/comments', protect, async (req, res) => {
  try {
    const post = await CatPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = {
      commentId: new mongoose.Types.ObjectId().toString(),
      authorId: req.user.id.toString(),
      authorName: req.user.name,
      authorPic: buildProfilePicUrl(req, req.user.profile_pic || ''),
      body: req.body.body || '',
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await CatPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user.id.toString();
    const likedIndex = post.likedBy.indexOf(userId);
    if (likedIndex === -1) {
      post.likedBy.push(userId);
    } else {
      post.likedBy.splice(likedIndex, 1);
    }

    await post.save();
    res.json(buildPostResponse(post, userId));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

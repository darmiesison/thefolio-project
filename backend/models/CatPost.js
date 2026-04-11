const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    commentId: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorPic: { type: String, default: '' },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CatPostSchema = new mongoose.Schema(
  {
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorPic: { type: String, default: '' },
    content: { type: String, default: '' },
    image: { type: String, default: '' },
    likedBy: { type: [String], default: [] },
    comments: { type: [CommentSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CatPost', CatPostSchema);

const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/feed', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name avatarUrl').sort({ createdAt: -1 });
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name avatarUrl');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comments = await Comment.find({ post: post._id }).populate('author', 'name avatarUrl').sort({ createdAt: 1 });
    res.json({ success: true, data: { post, comments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      imageUrl: imageUrl || '',
    });

    const populatedPost = await post.populate('author', 'name avatarUrl');
    res.status(201).json({ success: true, data: populatedPost });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own posts' });
    }

    const { content, imageUrl } = req.body;
    if (typeof content === 'string') post.content = content;
    if (typeof imageUrl === 'string') post.imageUrl = imageUrl;

    await post.save();
    const populatedPost = await post.populate('author', 'name avatarUrl');
    res.json({ success: true, data: populatedPost });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts' });
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const likeIndex = post.likes.findIndex((like) => like.toString() === userId);

    if (likeIndex >= 0) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    const populatedPost = await post.populate('author', 'name avatarUrl');
    res.json({ success: true, data: populatedPost });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
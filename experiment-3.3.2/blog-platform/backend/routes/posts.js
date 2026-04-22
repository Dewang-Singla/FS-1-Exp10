const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name avatarUrl bio').sort({ createdAt: -1 });
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name avatarUrl bio');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comments = await Comment.find({ post: post._id })
      .populate('author', 'name avatarUrl')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: { post, comments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const post = await Post.create({
      author: req.user._id,
      title,
      content,
      tags: Array.isArray(tags) ? tags : String(tags).split(',').map((tag) => tag.trim()).filter(Boolean),
    });

    const populatedPost = await post.populate('author', 'name avatarUrl bio');
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

    const { title, content, tags = [] } = req.body;
    if (typeof title === 'string') post.title = title;
    if (typeof content === 'string') post.content = content;
    post.tags = Array.isArray(tags) ? tags : String(tags).split(',').map((tag) => tag.trim()).filter(Boolean);

    await post.save();
    const populatedPost = await post.populate('author', 'name avatarUrl bio');
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

module.exports = router;
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign({ userId: user._id }, secret, { expiresIn: '7d' });
}

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user);
    res.status(201).json({ success: true, token, user: toPublicUser(user) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await user.comparePassword(password || '');
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user);
    res.json({ success: true, token, user: toPublicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ success: true, user: toPublicUser(req.user) });
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;
    if (name) req.user.name = name;
    if (typeof bio === 'string') req.user.bio = bio;
    if (typeof avatarUrl === 'string') req.user.avatarUrl = avatarUrl;

    await req.user.save();
    res.json({ success: true, user: toPublicUser(req.user) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
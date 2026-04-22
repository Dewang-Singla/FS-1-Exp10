const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDb } = require('./config/db');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');

const app = express();
const port = process.env.PORT || 5002;
const allowedOrigins = ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Social media API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

app.use((error, req, res, next) => {
  res.status(500).json({ success: false, message: error.message });
});

async function startServer() {
  await connectDb();
  console.log('MongoDB connected');

  app.listen(port, () => {
    console.log(`Social media API running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});
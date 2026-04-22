const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDb } = require('./config/db');
const todosRouter = require('./routes/todos');

const app = express();
const port = process.env.PORT || 5000;
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
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Todo API is running' });
});

app.use('/api/todos', todosRouter);

app.use((error, req, res, next) => {
  res.status(500).json({ success: false, message: error.message });
});

async function startServer() {
  await connectDb();
  console.log('MongoDB connected');

  app.listen(port, () => {
    console.log(`Todo API running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});
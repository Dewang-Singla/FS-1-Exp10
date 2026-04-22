const mongoose = require('mongoose');

async function connectDb() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/experiment_3_3_3';
  await mongoose.connect(mongoUri);
  return mongoose.connection;
}

module.exports = { connectDb };
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const connectWithUri = async (mongoUri) => {
  const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

const connectDB = async () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const configuredUri = process.env.MONGO_URI;
  const mongoUri = configuredUri || 'mongodb://127.0.0.1:27017/studysync';

  try {
    await connectWithUri(mongoUri);
    return;
  } catch (error) {
    if (nodeEnv === 'production') {
      console.error(`MongoDB connection error: ${error.message}`);
      process.exit(1);
    }

    if (configuredUri) {
      console.error(`MongoDB connection error: ${error.message}`);
      process.exit(1);
    }

    try {
      memoryServer = await MongoMemoryServer.create();
      const inMemoryUri = memoryServer.getUri('studysync');
      await connectWithUri(inMemoryUri);
      console.log('Using in-memory MongoDB (development fallback)');
      return;
    } catch (memError) {
      console.error(`MongoDB connection error: ${error.message}`);
      console.error(`MongoDB memory server error: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

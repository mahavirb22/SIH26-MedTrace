import mongoose from 'mongoose';
import env from './env.js';

let memServer = null;

/**
 * Connect to MongoDB. Retries standard connection first.
 * If local MongoDB is unreachable, attempts memory-server fallback & auto-seeds.
 */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`⚠️  Could not connect to local MongoDB at ${env.MONGO_URI} (${err.message}).`);
    console.log('🔄 Attempting fallback to in-memory MongoDB server for zero-setup execution...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memServer = await MongoMemoryServer.create();
      const memoryUri = memServer.getUri();

      const conn = await mongoose.connect(memoryUri);
      console.log(`✅ In-Memory MongoDB connected at ${memoryUri}`);

      // Auto-seed in-memory DB so logins and verification work out-of-the-box
      try {
        const { runSeed } = await import('../scripts/seedData.js');
        await runSeed();
        console.log('🌱 In-memory database auto-seeded with demo accounts and batches!');
      } catch (seedErr) {
        console.error('⚠️  In-memory auto-seed warning:', seedErr.message);
      }

      return conn;
    } catch (memErr) {
      console.error('❌ Could not start in-memory MongoDB fallback:', memErr.message);
      console.error('👉 Please make sure MongoDB is running locally (`mongod`) or provide MONGO_URI in server/.env');
      process.exit(1);
    }
  }
}

export default connectDB;

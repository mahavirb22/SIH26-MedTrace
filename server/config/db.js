import mongoose from 'mongoose';
import env from './env.js';

/**
 * Connect to MongoDB. Retries once on failure.
 */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      // Mongoose 8 defaults are sane; no deprecated options needed
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    // Retry once after 3 seconds
    console.log('   Retrying in 3 seconds...');
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const conn = await mongoose.connect(env.MONGO_URI);
      console.log(`✅ MongoDB connected on retry: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (retryErr) {
      console.error('❌ MongoDB connection failed on retry:', retryErr.message);
      process.exit(1);
    }
  }
}

export default connectDB;

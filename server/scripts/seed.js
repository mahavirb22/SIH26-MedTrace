import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { runSeed } from './seedData.js';

async function seed() {
  await connectDB();
  await runSeed();
  console.log('✅ Standalone seed finished successfully.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

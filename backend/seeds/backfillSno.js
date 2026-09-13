import mongoose from 'mongoose';
import Outreach from '../models/OutReach.model.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  console.warn('MONGO_URL environment variable is not defined.');
}

async function run() {
  await mongoose.connect(MONGO_URL);
  const docs = await Outreach.find().sort({ createdAt: 1 });
  let nextSno = 1;
  for (const doc of docs) {
    if (!doc.sNo) {
      doc.sNo = nextSno;
      await doc.save();
      console.log(`Assigned sNo ${nextSno} to doc ${doc._id}`);
    } else {
      nextSno = Math.max(nextSno, doc.sNo);
    }
    nextSno++;
  }
  console.log('Backfill complete. Total docs:', docs.length);
  process.exit(0);
}

run().catch(console.error);

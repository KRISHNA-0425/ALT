import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import User from '../models/User.model.js';

async function updatePasswords() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('Connected to DB to update advocate passwords.');

  const newHash = await bcryptjs.hash('12345678', 10);

  // Update all users with role ADV or userID starting with ADV
  const result = await User.updateMany(
    {
      $or: [
        { roles: 'ADV' },
        { userID: /^ADV/i },
      ],
    },
    {
      $set: { password: newHash },
    }
  );

  console.log(`Updated passwords for ${result.modifiedCount} advocate accounts to '12345678'.`);

  // Verify by attempting to compare with test advocate ADV10041
  const advUser = await User.findOne({ userID: 'ADV10041' });
  if (advUser) {
    const isMatch = await bcryptjs.compare('12345678', advUser.password);
    console.log(`Verification for ${advUser.userID}: password '12345678' matches = ${isMatch}`);
  }

  process.exit(0);
}

updatePasswords().catch((err) => {
  console.error('Failed to update advocate passwords:', err);
  process.exit(1);
});

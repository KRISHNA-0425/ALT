import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import Advocate from '../models/Advocate.model.js';
import User from '../models/User.model.js';
import { rawAdvocateData } from '../seeds/seedAdvocates.js';

// Load production environment
dotenv.config({ path: '.env.production', override: true });

async function seedProduction() {
  const prodMongoUrl = process.env.MONGO_URL;
  if (!prodMongoUrl) {
    throw new Error('MONGO_URL not found in .env.production');
  }

  console.log('Connecting to Production MongoDB:', prodMongoUrl.replace(/:([^:@]+)@/, ':****@'));
  await mongoose.connect(prodMongoUrl);
  console.log('Connected to Production MongoDB successfully! DB Name:', mongoose.connection.name);

  const defaultPasswordHash = await bcryptjs.hash('12345678', 10);

  const advocateDocs = [];
  const userDocs = [];

  rawAdvocateData.forEach((item, index) => {
    const numericPart = 10001 + index;
    const userID = `ADV${numericPart}`;
    const email = `adv.${item.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@delhibar.org`;

    advocateDocs.push({
      ...item,
      userID,
      email,
      state: 'Delhi',
    });

    userDocs.push({
      userName: item.name,
      userID,
      email,
      password: defaultPasswordHash,
      roles: 'ADV',
    });
  });

  // Clear existing advocate records and their corresponding ADV user accounts
  const deletedAdvocates = await Advocate.deleteMany({});
  console.log(`Cleared ${deletedAdvocates.deletedCount} existing Advocate records in Production.`);

  const userIDs = advocateDocs.map(a => a.userID);
  const deletedUsers = await User.deleteMany({ userID: { $in: userIDs } });
  console.log(`Cleared ${deletedUsers.deletedCount} existing ADV user credentials in Production.`);

  // Insert into Advocate collection
  const insertedAdvocates = await Advocate.insertMany(advocateDocs);
  console.log(`Successfully seeded ${insertedAdvocates.length} Advocate records in Production.`);

  // Insert into User collection for authentication
  const insertedUsers = await User.insertMany(userDocs);
  console.log(`Successfully seeded ${insertedUsers.length} User accounts for advocates in Production.`);

  console.log('\n--- Production Advocates Seed Verification ---');
  const countAdvocates = await Advocate.countDocuments();
  const countUsers = await User.countDocuments({ roles: 'ADV' });
  console.log(`Total Advocates in Production DB: ${countAdvocates}`);
  console.log(`Total Advocate Users in Production DB: ${countUsers}`);
  console.log('Sample advocates:');
  const sample = await Advocate.find({}).limit(3);
  sample.forEach(s => console.log(` - ${s.name} (${s.userID}) | ${s.specialization} | ${s.practiceCourt} | Exp: ${s.yearsOfExperience}y`));
  console.log('Password for all advocates: 12345678');
  console.log('---------------------------------------------\n');

  process.exit(0);
}

seedProduction().catch((err) => {
  console.error('Failed to seed production database:', err);
  process.exit(1);
});

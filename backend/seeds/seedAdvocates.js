import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import Advocate from '../models/Advocate.model.js';
import User from '../models/User.model.js';

dotenv.config();

export const rawAdvocateData = [
  { name: "Kritika Mehta", yearsOfExperience: 2, casesTaken: 33, casesWon: 19, specialization: "Assault", practiceCourt: "District Courts, Rohini" },
  { name: "Saurabh Saxena", yearsOfExperience: 4, casesTaken: 107, casesWon: 69, specialization: "POCSO", practiceCourt: "District Courts, Rohini" },
  { name: "Siddharth Sinha", yearsOfExperience: 18, casesTaken: 452, casesWon: 222, specialization: "Cyber Crime", practiceCourt: "South-East Delhi District Court" },
  { name: "Priya Sinha", yearsOfExperience: 16, casesTaken: 429, casesWon: 254, specialization: "POCSO", practiceCourt: "District Courts, Dwarka" },
  { name: "Isha Tiwari", yearsOfExperience: 12, casesTaken: 238, casesWon: 129, specialization: "White-Collar Crime", practiceCourt: "District Courts, Rohini" },
  { name: "Karan Mishra", yearsOfExperience: 5, casesTaken: 85, casesWon: 70, specialization: "Property Dispute", practiceCourt: "District Courts, Saket" },
  { name: "Muskan Singh", yearsOfExperience: 19, casesTaken: 215, casesWon: 187, specialization: "Constitutional Law", practiceCourt: "District Courts, Rohini" },
  { name: "Ankit Khanna", yearsOfExperience: 28, casesTaken: 594, casesWon: 422, specialization: "Rape", practiceCourt: "District Courts, Saket" },
  { name: "Preeti Sinha", yearsOfExperience: 26, casesTaken: 504, casesWon: 441, specialization: "Fraud & Cheating", practiceCourt: "District Courts, Rohini" },
  { name: "Nandini Chauhan", yearsOfExperience: 16, casesTaken: 453, casesWon: 369, specialization: "Domestic Violence", practiceCourt: "Karkardooma Courts" },
  { name: "Tanvi Bansal", yearsOfExperience: 23, casesTaken: 320, casesWon: 243, specialization: "Rape", practiceCourt: "Shahdara District Court" },
  { name: "Kritika Malhotra", yearsOfExperience: 19, casesTaken: 525, casesWon: 303, specialization: "Labour Dispute", practiceCourt: "Delhi High Court" },
  { name: "Varun Saxena", yearsOfExperience: 9, casesTaken: 247, casesWon: 151, specialization: "Murder", practiceCourt: "District Courts, Tis Hazari" },
  { name: "Ananya Arora", yearsOfExperience: 14, casesTaken: 249, casesWon: 126, specialization: "White-Collar Crime", practiceCourt: "District Courts, Tis Hazari" },
  { name: "Gaurav Agarwal", yearsOfExperience: 14, casesTaken: 346, casesWon: 186, specialization: "Assault", practiceCourt: "District Courts, Tis Hazari" },
  { name: "Ayush Saxena", yearsOfExperience: 19, casesTaken: 286, casesWon: 223, specialization: "Family Law", practiceCourt: "Shahdara District Court" },
  { name: "Mohit Ahuja", yearsOfExperience: 9, casesTaken: 107, casesWon: 73, specialization: "Rape", practiceCourt: "District Courts, Saket" },
  { name: "Rohan Kapoor", yearsOfExperience: 22, casesTaken: 257, casesWon: 205, specialization: "Family Law", practiceCourt: "Shahdara District Court" },
  { name: "Aditi Mishra", yearsOfExperience: 14, casesTaken: 417, casesWon: 366, specialization: "Property Dispute", practiceCourt: "South-East Delhi District Court" },
  { name: "Aarav Mehta", yearsOfExperience: 23, casesTaken: 637, casesWon: 443, specialization: "Property Dispute", practiceCourt: "Karkardooma Courts" },
  { name: "Rohan Khanna", yearsOfExperience: 15, casesTaken: 200, casesWon: 132, specialization: "Property Dispute", practiceCourt: "South-East Delhi District Court" },
  { name: "Nisha Malhotra", yearsOfExperience: 18, casesTaken: 198, casesWon: 164, specialization: "Narcotics", practiceCourt: "South-East Delhi District Court" },
  { name: "Pallavi Bansal", yearsOfExperience: 6, casesTaken: 143, casesWon: 112, specialization: "POCSO", practiceCourt: "Shahdara District Court" },
  { name: "Simran Agarwal", yearsOfExperience: 2, casesTaken: 23, casesWon: 20, specialization: "Narcotics", practiceCourt: "District Courts, Tis Hazari" },
  { name: "Arjun Sinha", yearsOfExperience: 20, casesTaken: 200, casesWon: 103, specialization: "Motor Accident Claims", practiceCourt: "District Courts, Rohini" },
  { name: "Nisha Saxena", yearsOfExperience: 26, casesTaken: 336, casesWon: 179, specialization: "Motor Accident Claims", practiceCourt: "South-East Delhi District Court" },
  { name: "Ishita Chauhan", yearsOfExperience: 18, casesTaken: 454, casesWon: 295, specialization: "Cyber Crime", practiceCourt: "South-East Delhi District Court" },
  { name: "Nisha Bansal", yearsOfExperience: 24, casesTaken: 511, casesWon: 327, specialization: "Juvenile Justice", practiceCourt: "New Delhi District Court" },
  { name: "Raj Singh", yearsOfExperience: 5, casesTaken: 71, casesWon: 40, specialization: "White-Collar Crime", practiceCourt: "District Courts, Saket" },
  { name: "Rajat Saxena", yearsOfExperience: 9, casesTaken: 222, casesWon: 126, specialization: "Rape", practiceCourt: "District Courts, Saket" },
  { name: "Pooja Gupta", yearsOfExperience: 3, casesTaken: 66, casesWon: 34, specialization: "Fraud & Cheating", practiceCourt: "District Courts, Patiala House" },
  { name: "Preeti Agarwal", yearsOfExperience: 8, casesTaken: 202, casesWon: 108, specialization: "Motor Accident Claims", practiceCourt: "District Courts, Tis Hazari" },
  { name: "Sakshi Tiwari", yearsOfExperience: 8, casesTaken: 88, casesWon: 46, specialization: "Family Law", practiceCourt: "Karkardooma Courts" },
  { name: "Akash Tiwari", yearsOfExperience: 16, casesTaken: 155, casesWon: 116, specialization: "Harassment", practiceCourt: "District Courts, Saket" },
  { name: "Mohit Arora", yearsOfExperience: 27, casesTaken: 327, casesWon: 189, specialization: "Cyber Crime", practiceCourt: "South-East Delhi District Court" },
  { name: "Sneha Kapoor", yearsOfExperience: 15, casesTaken: 213, casesWon: 126, specialization: "Fraud & Cheating", practiceCourt: "District Courts, Rohini" },
  { name: "Sneha Saxena", yearsOfExperience: 5, casesTaken: 46, casesWon: 34, specialization: "POCSO", practiceCourt: "District Courts, Rohini" },
  { name: "Nisha Sinha", yearsOfExperience: 7, casesTaken: 160, casesWon: 108, specialization: "Cyber Crime", practiceCourt: "Delhi High Court" },
  { name: "Arjun Malhotra", yearsOfExperience: 14, casesTaken: 113, casesWon: 99, specialization: "Property Dispute", practiceCourt: "New Delhi District Court" },
  { name: "Shreya Tiwari", yearsOfExperience: 24, casesTaken: 690, casesWon: 374, specialization: "Narcotics", practiceCourt: "District Courts, Tis Hazari" },
  { name: "Arjun Bhatt", yearsOfExperience: 25, casesTaken: 262, casesWon: 204, specialization: "Murder", practiceCourt: "District Courts, Saket" },
  { name: "Rajat Agarwal", yearsOfExperience: 18, casesTaken: 415, casesWon: 225, specialization: "Rape", practiceCourt: "District Courts, Dwarka" },
  { name: "Aditi Chawla", yearsOfExperience: 4, casesTaken: 118, casesWon: 97, specialization: "Constitutional Law", practiceCourt: "District Courts, Rohini" },
  { name: "Swati Sinha", yearsOfExperience: 20, casesTaken: 464, casesWon: 230, specialization: "Rape", practiceCourt: "Delhi High Court" },
  { name: "Preeti Bhatt", yearsOfExperience: 20, casesTaken: 427, casesWon: 259, specialization: "Property Dispute", practiceCourt: "District Courts, Tis Hazari" },
  { name: "Preeti Arora", yearsOfExperience: 9, casesTaken: 139, casesWon: 89, specialization: "Narcotics", practiceCourt: "New Delhi District Court" },
  { name: "Simran Gupta", yearsOfExperience: 2, casesTaken: 45, casesWon: 33, specialization: "Harassment", practiceCourt: "District Courts, Rohini" },
  { name: "Komal Bansal", yearsOfExperience: 18, casesTaken: 279, casesWon: 149, specialization: "Juvenile Justice", practiceCourt: "District Courts, Rohini" },
  { name: "Nikhil Ahuja", yearsOfExperience: 11, casesTaken: 128, casesWon: 84, specialization: "Narcotics", practiceCourt: "Shahdara District Court" },
  { name: "Gaurav Jain", yearsOfExperience: 2, casesTaken: 58, casesWon: 47, specialization: "Narcotics", practiceCourt: "District Courts, Rohini" },
];

/**
 * Seeds all 50 advocates into the database with 5-digit ADV user IDs (ADV10001 - ADV10050)
 * and creates corresponding User accounts for authentication.
 */
export const seedAllAdvocates = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error('MONGO_URL not defined in environment variables');
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URL);
      console.log('MongoDB connected successfully.');
    }

    const defaultPasswordHash = await bcryptjs.hash('advocate123', 10);

    const advocateDocs = [];
    const userDocs = [];

    rawAdvocateData.forEach((item, index) => {
      // Generate 5-digit number starting at 10001
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

    // Delete existing advocate records and their corresponding ADV user accounts to allow clean re-seeding
    await Advocate.deleteMany({});
    console.log('Cleared existing Advocate records.');

    // Remove existing test ADV users in range ADV10001 to ADV10050
    const userIDs = advocateDocs.map(a => a.userID);
    await User.deleteMany({ userID: { $in: userIDs } });
    console.log('Cleared existing ADV user credentials.');

    // Insert into Advocate collection
    const insertedAdvocates = await Advocate.insertMany(advocateDocs);
    console.log(`Successfully seeded ${insertedAdvocates.length} Advocate records.`);

    // Insert into User collection for authentication
    const insertedUsers = await User.insertMany(userDocs);
    console.log(`Successfully seeded ${insertedUsers.length} User accounts for advocates.`);

    console.log('\n--- Sample Advocate Credentials ---');
    for (let i = 0; i < Math.min(5, advocateDocs.length); i++) {
      console.log(`Name: ${advocateDocs[i].name} | UserID: ${advocateDocs[i].userID} | Default Password: advocate123`);
    }
    console.log('------------------------------------\n');

    return { insertedAdvocates, insertedUsers };
  } catch (error) {
    console.error('Error seeding advocates:', error);
    throw error;
  }
};

// Run directly when executed
if (process.argv[1] && (process.argv[1].endsWith('seedAdvocates.js') || process.argv[1].includes('seedAdvocates'))) {
  (async () => {
    try {
      await seedAllAdvocates();
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed:', err);
      process.exit(1);
    }
  })();
}

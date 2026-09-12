import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Notification from '../models/Notification.model.js';
import {
  sendNewOutreachCaseNotification,
  sendAdvocateAssignmentNotification,
} from '../services/email.service.js';

async function testNotifications() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('Connected to DB for notification testing.');

  // Test 1: Outreach to Socio-Legal Notification
  console.log('\n--- 1. Testing Outreach Case Notification ---');
  const mockCase = {
    _id: new mongoose.Types.ObjectId(),
    slcNo: 999,
    inmate: {
      name: 'Ramesh Verma',
      offenceType: 'Attempt to Murder',
      crimeCategory: 'Heinous',
    },
    caseDetails: {
      firNumber: '123/2026',
      policeStation: 'Kashmere Gate',
      court: 'Tis Hazari Courts',
    },
    contactPerson: {
      name: 'Sunita Verma',
      phoneNumbers: ['9876543210'],
    },
  };

  const slcNotif = await Notification.create({
    recipientRole: 'SLC',
    title: `New Case: ${mockCase.inmate.name}`,
    message: `A new inmate file (SLC #${mockCase.slcNo}) was registered by Outreach and is awaiting Socio-Legal assessment.`,
    type: 'NEW_OUTREACH_CASE',
    caseId: mockCase._id,
    caseNumber: `SLC #${mockCase.slcNo}`,
    inmateName: mockCase.inmate.name,
  });
  console.log('Saved SLC In-App Notification in DB:', slcNotif._id);

  const emailResult1 = await sendNewOutreachCaseNotification(mockCase);
  console.log('Dispatched SLC Email Result:', emailResult1?.messageId || emailResult1?.response);

  // Test 2: Advocate Assignment Notification
  console.log('\n--- 2. Testing Advocate Assignment Notification ---');
  const mockAdvocate = {
    name: 'Arjun Bhatt',
    userID: 'ADV10041',
    email: 'adv.arjunbhatt@delhibar.org',
    specialization: 'Attempt to Murder',
    practiceCourt: 'Tis Hazari Courts',
  };

  const advNotif = await Notification.create({
    recipientRole: 'ADV',
    recipientId: mockAdvocate.userID,
    title: `New Case Assigned: ${mockCase.inmate.name}`,
    message: `You have been assigned to provide legal representation for ${mockCase.inmate.name} (SLC #${mockCase.slcNo}).`,
    type: 'ADVOCATE_ASSIGNED',
    caseId: mockCase._id,
    caseNumber: `SLC #${mockCase.slcNo}`,
    inmateName: mockCase.inmate.name,
    metadata: {
      advocateName: mockAdvocate.name,
      advocateUserID: mockAdvocate.userID,
    },
  });
  console.log('Saved Advocate In-App Notification in DB:', advNotif._id);

  const emailResult2 = await sendAdvocateAssignmentNotification(mockCase, mockAdvocate);
  console.log('Dispatched Advocate Email Result:', emailResult2?.messageId || emailResult2?.response);

  // Verify fetch via API logic
  const slcList = await Notification.find({ recipientRole: 'SLC' }).sort({ createdAt: -1 }).limit(1);
  const advList = await Notification.find({ recipientId: 'ADV10041' }).sort({ createdAt: -1 }).limit(1);
  console.log('\nFetched SLC latest notification:', slcList[0]?.title);
  console.log('Fetched ADV10041 latest notification:', advList[0]?.title);

  console.log('\nAll notification tests passed successfully!');
  process.exit(0);
}

testNotifications().catch((err) => {
  console.error('Notification test failed:', err);
  process.exit(1);
});

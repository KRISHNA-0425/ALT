import mongoose from 'mongoose';
import Outreach from '../models/OutReach.model.js';
import Advocate from '../models/Advocate.model.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  console.warn('MONGO_URL environment variable is not defined.');
}

export async function seedPipelineCases() {
  try {
    const advocate = await Advocate.findOne().sort({ createdAt: 1 });
    const advocate2 = await Advocate.findOne({ userID: 'ADV10002' }) || advocate;

    // Check if Ajay already exists
    const existingAjay = await Outreach.findOne({ 'inmate.name': 'Ajay' });
    if (!existingAjay) {
      // 1. Ajay - Case from Screenshot (Resolved / Bail Out, 186 days since intake)
      const intakeDateAjay = new Date(Date.now() - 186 * 24 * 60 * 60 * 1000); // 186 days ago
      const docDateAjay = new Date(Date.now() - 150 * 24 * 60 * 60 * 1000);
      const slcDateAjay = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
      const advDateAjay = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const resDateAjay = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      await Outreach.create({
        sNo: 2,
        dateOfFirstContact: intakeDateAjay,
        contactPerson: {
          name: 'Sunil Kumar',
          relationshipWithInmate: 'Brother',
          phoneNumbers: ['9876543210'],
        },
        inmate: {
          name: 'Ajay',
          gender: 'Male',
          age: 28,
          education: '10th Pass',
          occupation: 'Electrician',
          offenceType: ['NDPS', 'Arms Act'],
        },
        discovery: {
          mode: 'Inside Prison',
          sourceOfDiscovery: 'Jail Camp Outreach',
        },
        prisonDetails: {
          prisonName: 'Delhi Prison Jail No 4',
          prisonerType: 'In-prison (Undertrial)',
        },
        slcNo: 101,
        tier: 'Tier 1 (High Priority)',
        legalAssessment: {
          crimeCategory: 'Heinous',
          accessToDocuments: 'FIR and Chargesheet',
          stageOfCase: 'Bail Filing',
        },
        caseDetails: {
          firNumber: 'FIR 412/2025',
          policeStation: 'Hauz Khas',
          court: 'Saket Court',
          lawyerType: 'Govt. Lawyer',
          bailApplicationsFiled: true,
          nextHearingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          hearingNotes: 'Regular bail application argued before ASJ Saket Court. Interim bail granted.',
        },
        assignedAdvocate: {
          advocateId: advocate?._id,
          name: advocate?.name || 'Rahul Sharma',
          userID: advocate?.userID || 'ADV10001',
          assignedAt: advDateAjay,
        },
        callStatus: 'Bail out',
        followUps: [
          {
            round: 1,
            date: intakeDateAjay,
            poc: 'Camp Outreach Officer',
            callStatus: 'Transferred to socio-legal support',
            notes: 'First intake call with inmate brother. Transferred to Socio-Legal wing.',
          },
          {
            round: 2,
            date: docDateAjay,
            poc: 'Outreach Verification Team',
            callStatus: 'Document Submitted',
            notes: 'FIR copy and custody certificate collected and verified.',
          },
          {
            round: 3,
            date: slcDateAjay,
            poc: 'SLC Counsellor Meera',
            callStatus: 'Hearing Scheduled',
            notes: 'Socio-legal evaluation complete. Assigned to Advocate Rahul Sharma.',
          },
          {
            round: 4,
            date: resDateAjay,
            poc: `Adv. ${advocate?.name || 'Rahul Sharma'}`,
            callStatus: 'Bail out',
            notes: 'Bail order pronounced by Saket Court. Release formalities completed.',
          },
        ],
        attachedFiles: [
          {
            documentType: 'FIR',
            title: 'FIR_Copy_412_2025.pdf',
            originalName: 'FIR_Copy_412_2025.pdf',
            fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.pdf',
            publicId: 'fir_412_sample',
            fileType: 'application/pdf',
            uploadedByName: 'Rajesh (OR)',
            uploadedAt: docDateAjay,
          },
          {
            documentType: 'Advocate Submission',
            title: 'ADV_Bail_Application_Saket.pdf',
            originalName: 'Bail_Application_Saket.pdf',
            fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.pdf',
            publicId: 'adv_bail_sample',
            fileType: 'application/pdf',
            uploadedByName: advocate?.name || 'Rahul Sharma',
            uploadedAt: advDateAjay,
          },
        ],
      });
      console.log('Seeded pipeline case: Ajay (Resolved)');
    }

    // 2. Rohit Verma - Stage: Appointed to Advocate (Bail Support stage, 45 days)
    const existingRohit = await Outreach.findOne({ 'inmate.name': 'Rohit Verma' });
    if (!existingRohit) {
      const intakeDateRohit = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
      const slcDateRohit = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000);
      const advDateRohit = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      await Outreach.create({
        sNo: 3,
        dateOfFirstContact: intakeDateRohit,
        contactPerson: {
          name: 'Kavita Verma',
          relationshipWithInmate: 'Mother',
          phoneNumbers: ['9811223344'],
        },
        inmate: {
          name: 'Rohit Verma',
          gender: 'Male',
          age: 24,
          education: '12th Pass',
          occupation: 'Delivery Executive',
          offenceType: ['Theft', 'Assault'],
        },
        discovery: {
          mode: 'Outside Prison',
          sourceOfDiscovery: 'Family Helpline',
        },
        prisonDetails: {
          prisonName: 'Tihar Jail No 2',
          prisonerType: 'In-prison (Undertrial)',
        },
        slcNo: 102,
        tier: 'Tier 2 (Low Priority)',
        legalAssessment: {
          crimeCategory: 'Non-Heinous',
          accessToDocuments: 'FIR',
          stageOfCase: 'Chargesheet Filed',
        },
        caseDetails: {
          firNumber: 'FIR 108/2026',
          policeStation: 'Tilak Marg',
          court: 'Patiala House Court',
          lawyerType: 'Govt. Lawyer',
          bailApplicationsFiled: true,
          nextHearingDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          hearingNotes: 'Hearing for bail arguments listed before CMM Patiala House.',
        },
        assignedAdvocate: {
          advocateId: advocate2?._id,
          name: advocate2?.name || 'Priya Verma',
          userID: advocate2?.userID || 'ADV10002',
          assignedAt: advDateRohit,
        },
        callStatus: 'Hearing Scheduled',
        followUps: [
          {
            round: 1,
            date: intakeDateRohit,
            poc: 'Outreach Officer Amit',
            callStatus: 'Call back',
            notes: 'Mother requested legal aid for young son in custody for 3 months.',
          },
          {
            round: 2,
            date: slcDateRohit,
            poc: 'SLC Counsellor Pooja',
            callStatus: 'Transferred to socio-legal support',
            notes: 'SLC evaluation complete. Case referred for defense advocate appointment.',
          },
        ],
        attachedFiles: [
          {
            documentType: 'FIR',
            title: 'FIR_108_2026.pdf',
            originalName: 'FIR_108_2026.pdf',
            fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.pdf',
            publicId: 'fir_108_sample',
            fileType: 'application/pdf',
            uploadedByName: 'Amit (OR)',
            uploadedAt: slcDateRohit,
          },
        ],
      });
      console.log('Seeded pipeline case: Rohit Verma (Advocate Appointed)');
    }

    // 3. Sunita Devi - Stage: In Socio-Legal Counselling (Decoding stage, 15 days)
    const existingSunita = await Outreach.findOne({ 'inmate.name': 'Sunita Devi' });
    if (!existingSunita) {
      const intakeDateSunita = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      const slcDateSunita = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

      await Outreach.create({
        sNo: 4,
        dateOfFirstContact: intakeDateSunita,
        contactPerson: {
          name: 'Rameshwar Lal',
          relationshipWithInmate: 'Father',
          phoneNumbers: ['9899001122'],
        },
        inmate: {
          name: 'Sunita Devi',
          gender: 'Female',
          age: 32,
          education: 'Below 10th Pass',
          occupation: 'Domestic Worker',
          offenceType: ['Dowry', 'Assault'],
        },
        discovery: {
          mode: 'Inside Prison',
          sourceOfDiscovery: 'Women Jail Outreach Camp',
        },
        prisonDetails: {
          prisonName: 'Mandoli Jail No 6 (Women)',
          prisonerType: 'In-prison (Undertrial)',
        },
        slcNo: 103,
        tier: 'Tier 1 (High Priority)',
        legalAssessment: {
          crimeCategory: 'Non-Heinous',
          accessToDocuments: 'Not Available',
          stageOfCase: 'FIR',
        },
        caseDetails: {
          firNumber: 'FIR 55/2026',
          policeStation: 'Seemapuri',
          court: 'Karkardooma Court',
          lawyerType: "Don't Have",
          bailApplicationsFiled: false,
        },
        callStatus: 'Transferred to socio-legal support',
        followUps: [
          {
            round: 1,
            date: intakeDateSunita,
            poc: 'Camp POC Neha',
            callStatus: 'Transferred to socio-legal support',
            notes: 'Identified during Mandoli women jail camp. Transferred to Socio-Legal.',
          },
          {
            round: 2,
            date: slcDateSunita,
            poc: 'SLC Counsellor Meera',
            callStatus: 'Busy',
            notes: 'Awaiting FIR chargesheet documents from police station to assign advocate.',
          },
        ],
      });
      console.log('Seeded pipeline case: Sunita Devi (Socio-Legal Decoding)');
    }
  } catch (err) {
    console.error('Error seeding pipeline cases:', err);
  }
}

if (process.argv[1]?.endsWith('seedPipelineCases.js')) {
  mongoose.connect(MONGO_URL).then(async () => {
    await seedPipelineCases();
    process.exit(0);
  });
}

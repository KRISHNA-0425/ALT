import mongoose from 'mongoose';
const { Schema } = mongoose;

export const DOCUMENTS_SUBMITTED_OPTIONS = [
  'FIR',
  'Chargesheet',
  'Final Report',
  'Court Orders',
  'Bail/Parole/Appeal Application',
  'FSL',
  'Arrest Memo',
  'Other',
];

export const TIER_OPTIONS = [
  'Tier 0 (Data Needed)',
  'Tier 1 (High Priority)',
  'Tier 2 (Low Priority)',
  'Tier 3 (Complex)',
];

export const CRIME_CATEGORY_OPTIONS = [
  'Heinous',
  'Non-Heinous',
  'Unrecognized Crime Type',
];

export const PRISONER_TYPE_OPTIONS = [
  'In-prison (Undertrial)',
  'In-prison (Convict)',
  'Bailed Out',
  'Released',
];

export const LAWYER_TYPE_OPTIONS = [
  'Private Lawyer',
  'Govt. Lawyer',
  "Don't Have",
  'No response',
];

export const SUPPORT_NEEDED_OPTIONS = [
  'Bail/Parole/Appeal Guidance',
  'Lawyer support',
  'Lawyer guidance',
  'FIR support',
  'Chargesheet support',
  'Court Proceeding',
  'Mulakat support',
  'Any other application support',
  'Will call again if needed',
];

export const EDUCATION_OPTIONS = [
  'Illiterate',
  'Below 10th Pass',
  '10th Pass',
  '11th Pass',
  '12th Pass',
  'Graduation',
  'Post Graduation',
  'Others',
];

export const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Transgender',
  'Other',
];

// Sub-schema for Call Notes & Follow-up tracking (Columns AP to BF)
const FollowUpSchema = new Schema(
  {
    followUpNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    scheduledDate: {
      type: Date,
    },
    callDate: {
      type: Date,
    },
    poc: {
      type: String,
      trim: true,
    },
    documentBottleneck: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: true, timestamps: true }
);

// Main Socio-Legal Counselling Schema
const SocioLegalCounsellingSchema = new Schema(
  {
    // Link to originating Outreach case (optional)
    outreachId: {
      type: Schema.Types.ObjectId,
      ref: 'Outreach',
      index: true,
    },

    // Basic Case Identifiers (Columns A - H)
    slcNo: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },
    dateOfContact: {
      type: Date,
    },
    poc: {
      type: String,
      trim: true,
    },
    modeOfDiscovery: {
      type: String,
      enum: ['Inside Prison', 'Outside Prison', 'Helpline', 'Other'],
      default: 'Outside Prison',
    },
    familyMember: {
      name: { type: String, trim: true },
      relationshipWithInmate: { type: String, trim: true },
      phoneNumber: { type: String, trim: true },
    },
    inmate: {
      name: { type: String, trim: true, required: true },
      gender: { type: String, enum: GENDER_OPTIONS },
      age: { type: Number, min: 0, max: 120 },
      education: {
        type: String,
        enum: EDUCATION_OPTIONS,
      },
      occupation: { type: String, trim: true },
      address: { type: String, trim: true },
      monthlyIncome: { type: String, trim: true },
      isSoleBreadwinner: { type: Boolean, default: null },
    },

    // Column I: Documents Submitted
    documentsSubmitted: [
      {
        type: String,
        trim: true,
        enum: DOCUMENTS_SUBMITTED_OPTIONS,
      },
    ],

    // Column J & Z: Priority Tier
    tier: {
      type: String,
      enum: TIER_OPTIONS,
      index: true,
    },

    // Incarceration Details (Columns K - L)
    dateOfArrest: {
      type: Date,
    },
    durationInCustodyMonths: {
      type: Number,
      min: 0,
    },
    prisonDetails: {
      prisonName: { type: String, trim: true },
      prisonerType: {
        type: String,
        enum: PRISONER_TYPE_OPTIONS,
      },
    },

    // Scoring Areas & Legal Profile (Columns M - X)
    legalAssessment: {
      numberOfPendingCases: {
        type: String,
        default: '1',
      },
      caseType: [
        {
          type: String,
          trim: true,
        },
      ],
      crimeCategory: {
        type: String,
        enum: CRIME_CATEGORY_OPTIONS,
      },
      accessToDocuments: {
        type: String,
        enum: ['FIR', 'FIR and Chargesheet', 'Chargesheet', 'Not Available', 'Other'],
        default: 'Not Available',
      },
      stageOfCase: {
        type: String,
        enum: ['FIR', 'Chargesheet Filed', 'Cross-examination', 'Bail Filing', 'Judgment', 'Unknown Status'],
      },
      firstTimeOffender: {
        type: Boolean,
        default: null,
      },
      healthConcerns: {
        hasConcerns: { type: Boolean, default: false },
        notes: { type: String, trim: true },
      },
      rliScore: {
        type: Schema.Types.Mixed,
      },
    },

    // Case & Court Particulars (Columns AG - AM)
    caseDetails: {
      caseSections: [{ type: String, trim: true }],
      lawyerType: {
        type: String,
        enum: LAWYER_TYPE_OPTIONS,
      },
      firNumber: { type: String, trim: true },
      policeStation: { type: String, trim: true },
      court: { type: String, trim: true },
      courtStatus: { type: String, trim: true },
      bailApplicationsFiled: {
        type: Boolean,
        default: null,
      },
      nextHearingDate: {
        type: Date,
        default: null,
      },
      hearingNotes: {
        type: String,
        trim: true,
      },
    },

    // Column AN: Support Needed
    supportNeeded: [
      {
        type: String,
        trim: true,
        enum: SUPPORT_NEEDED_OPTIONS,
      },
    ],

    // Column AO: Initial Call / Support Provided Notes
    initialCallNotes: {
      type: String,
      trim: true,
    },

    // Assigned Legal Advocate
    assignedAdvocate: {
      advocateId: {
        type: Schema.Types.ObjectId,
        ref: 'Advocate',
      },
      name: { type: String, trim: true },
      userID: { type: String, trim: true },
      specialization: { type: String, trim: true },
      practiceCourt: { type: String, trim: true },
      yearsOfExperience: { type: Number },
      casesWon: { type: Number },
      casesTaken: { type: Number },
      assignedAt: { type: Date, default: Date.now },
    },

    // Columns AP - BF: Dynamic Follow-up Entries (1st to 4th+ Follow-ups)
    followUps: [FollowUpSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
SocioLegalCounsellingSchema.index({ tier: 1, 'legalAssessment.crimeCategory': 1 });
SocioLegalCounsellingSchema.index({ 'inmate.name': 'text', 'caseDetails.firNumber': 'text' });

const SocioLegalCounselling = mongoose.model('SocioLegalCounselling', SocioLegalCounsellingSchema);

export default SocioLegalCounselling;

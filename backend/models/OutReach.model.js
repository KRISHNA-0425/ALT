/**
 * ==============================================================================
 * Unified Case Model (OutreachRecord)
 * ==============================================================================
 * Defines the comprehensive MongoDB schema that stores both initial Outreach
 * camp records and enriched Socio-Legal Counselling (SLC) case files.
 * 
 * Key Schema Sub-Documents:
 *  - Inmate Demographics (Name, Age, Gender, Education, Offence type)
 *  - Family / Contact Person Details
 *  - Discovery Details (Location, Camp POC, Mode of Discovery)
 *  - Socio-Legal Evaluation (Tier, Crime Category, RLI score, Health concerns)
 *  - Court Particulars (Court Name, Lawyer Type, Vakalatnama, Bail status)
 *  - Follow-up Interaction Timeline Logs
 *  - Case Document Attachments (PDF/Image file metadata from Cloudinary/Local)
 * ==============================================================================
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;

export const OFFENCE_TYPE_OPTIONS = [
  'Theft',
  'Dacoity',
  'Robbery',
  'Snatching',
  'Murder',
  'Attempt to Murder',
  'Assault',
  'Kidnapping',
  'Arms Act',
  'Rape',
  'POCSO',
  'Cheating',
  'Cybercrime',
  'NDPS',
  'Dowry',
  'Others',
  'Accident',
  'Not Recorded',
  'Ladhai Jhagda',
  'DP Act',
  'Fraud/Cheating',
  'UAPA',
  'MCOCA',
  'Cheque Bounce',
  'Sexual Harassment',
];

export const RELATIONSHIP_OPTIONS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Friend',
  'Other',
];

export const DISCOVERY_MODE_OPTIONS = [
  'Outside Prison',
  'Inside Prison',
  'Helpline',
  'Other',
];

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

export const CALL_STATUS_OPTIONS = [
  'Call back',
  'Switched off',
  'Bail out',
  'Not available',
  'Incoming not available',
  'RNR',
  'Busy',
  'Transferred to socio-legal support',
  'No help needed',
  'Will reach out later',
  'Invalid number',
  'Wrong number',
  'Other person pick up',
  'Hearing Scheduled',
  'Hearing Update',
  'Document Submitted',
  'Other',
];

// Unified Follow-up Schema supporting both Outreach & Socio-Legal notes
const FollowUpSchema = new Schema(
  {
    round: {
      type: Number,
    },
    followUpNumber: {
      type: Number,
    },
    date: {
      type: Date,
    },
    callDate: {
      type: Date,
    },
    scheduledDate: {
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
    callStatus: {
      type: String,
      trim: true,
      enum: CALL_STATUS_OPTIONS,
    },
  },
  { _id: true, timestamps: true }
);

// Schema for uploaded case documents (FIR, Chargesheet, etc.)
export const AttachedFileSchema = new Schema(
  {
    documentType: {
      type: String,
      enum: [...DOCUMENTS_SUBMITTED_OPTIONS, 'Other', 'Legal Document', 'Advocate Submission'],
      default: 'Other',
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    fileType: {
      type: String, // e.g. 'application/pdf', 'image/jpeg'
    },
    resourceType: {
      type: String, // 'image' | 'raw'
      default: 'auto',
    },
    fileSize: {
      type: Number, // in bytes
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedByRole: {
      type: String,
    },
    uploadedByName: {
      type: String,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true, timestamps: true }
);

// Unified Case Schema (Created by Outreach, enriched directly by Socio-Legal Counselling)
const OutreachSchema = new Schema(
  {
    // OutReach Identifiers
    sNo: {
      type: Number,
      index: true,
    },
    dateOfFirstContact: {
      type: Date,
      required: true,
    },

    // Contact Person / Family Member Details
    contactPerson: {
      name: {
        type: String,
        trim: true,
      },
      relationshipWithInmate: {
        type: String,
        trim: true,
      },
      otherRelationship: {
        type: String,
        trim: true,
      },
      phoneNumbers: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    familyMember: {
      name: {
        type: String,
        trim: true,
      },
      relationshipWithInmate: {
        type: String,
        trim: true,
      },
      phoneNumber: {
        type: String,
        trim: true,
      },
    },

    // Inmate Demographics (populated by Outreach, expanded by Socio-Legal)
    inmate: {
      name: {
        type: String,
        trim: true,
      },
      gender: {
        type: String,
        enum: GENDER_OPTIONS,
      },
      age: {
        type: Number,
        min: 0,
        max: 120,
      },
      education: {
        type: String,
        enum: EDUCATION_OPTIONS,
      },
      occupation: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      monthlyIncome: {
        type: String,
        trim: true,
      },
      isSoleBreadwinner: {
        type: Boolean,
        default: null,
      },
      offenceType: [
        {
          type: String,
          enum: OFFENCE_TYPE_OPTIONS,
        },
      ],
      otherOffence: {
        type: String,
        trim: true,
      },
      pastCaseHistory: {
        type: String,
        enum: ['Yes', 'No'],
        default: 'No',
      },
    },

    // Case Discovery Information
    discovery: {
      mode: {
        type: String,
        enum: DISCOVERY_MODE_OPTIONS,
        default: 'Outside Prison',
      },
      otherMode: {
        type: String,
        trim: true,
      },
      sourceOfDiscovery: {
        type: String,
        trim: true,
      },
    },

    // -------------------------------------------------------------
    // SOCIO-LEGAL COUNSELLING (SLC) ENRICHMENT FIELDS (Added to SAME doc)
    // -------------------------------------------------------------
    slcNo: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },
    poc: {
      type: String,
      trim: true,
    },
    documentsSubmitted: [
      {
        type: String,
        trim: true,
        enum: DOCUMENTS_SUBMITTED_OPTIONS,
      },
    ],
    tier: {
      type: String,
      enum: TIER_OPTIONS,
      index: true,
    },
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
    supportNeeded: [
      {
        type: String,
        trim: true,
        enum: SUPPORT_NEEDED_OPTIONS,
      },
    ],
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

    // Follow-up Calls & Timeline
    followUps: [FollowUpSchema],

    // Uploaded Documents & Case Files (FIR, Chargesheet, etc.)
    attachedFiles: [AttachedFileSchema],
  },
  {
    timestamps: true,
  }
);

// Helpful Indexes
OutreachSchema.index({ 'contactPerson.phoneNumbers': 1 });
OutreachSchema.index({ 'inmate.name': 'text', 'contactPerson.name': 'text', 'caseDetails.firNumber': 'text' });
OutreachSchema.index({ 'discovery.sourceOfDiscovery': 1 });
OutreachSchema.index({ tier: 1, 'legalAssessment.crimeCategory': 1 });

const Outreach = mongoose.models.Outreach || mongoose.model('Outreach', OutreachSchema);
export default Outreach;
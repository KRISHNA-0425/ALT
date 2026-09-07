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
  'Other',
];

const FollowUpSchema = new Schema({
  round: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
  },
  callStatus: {
    type: String,
    trim: true,
    enum: [
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
      'Other',
    ],
  },
}, { _id: false });

const OutreachSchema = new Schema(
  {
    sNo: {
      type: Number,
      index: true,
    },
    dateOfFirstContact: {
      type: Date,
      required: true,
    },

    // Contact Person Details
    contactPerson: {
      name: {
        type: String,
        trim: true,
      },
      relationshipWithInmate: {
        type: String,
        enum: RELATIONSHIP_OPTIONS,
        trim: true,
      },
      otherRelationship: {
        type: String, // Text area for custom relationship
        trim: true,
      },
      phoneNumbers: [{
        type: String,
        trim: true,
      }],
    },

    // Inmate Details
    inmate: {
      name: {
        type: String,
        trim: true,
      },
      offenceType: [{
        type: String,
        enum: OFFENCE_TYPE_OPTIONS,
      }],
      otherOffence: {
        type: String, // Text area for other offence
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
        type: String, // Text area for other mode
        trim: true,
      },
      sourceOfDiscovery: {
        type: String, // Plain text field
        trim: true,
      },
    },

    // Follow-up Calls & Timeline
    followUps: [FollowUpSchema],
  },
  {
    timestamps: true,
  }
);

// Helpful Indexes
OutreachSchema.index({ 'contactPerson.phoneNumbers': 1 });
OutreachSchema.index({ 'inmate.name': 'text', 'contactPerson.name': 'text' });
OutreachSchema.index({ 'discovery.sourceOfDiscovery': 1 });

const Outreach = mongoose.models.Outreach || mongoose.model('Outreach', OutreachSchema);
export default Outreach;
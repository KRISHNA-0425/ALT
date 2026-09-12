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

export const DISCOVERY_MODE_OPTIONS = [
  'Inside Prison',
  'Outside Prison',
  'Helpline',
  'Other',
];

export const ACCESS_DOCUMENTS_OPTIONS = [
  'FIR',
  'FIR and Chargesheet',
  'Chargesheet',
  'Not Available',
  'Other',
];

export const STAGE_OF_CASE_OPTIONS = [
  'FIR',
  'Chargesheet Filed',
  'Cross-examination',
  'Bail Filing',
  'Judgment',
  'Unknown Status',
];

export const ADVOCATE_SPECIALIZATION_OPTIONS = [
  'POCSO',
  'Murder',
  'Rape',
  'Harassment',
  'Assault',
  'Domestic Violence',
  'Cyber Crime',
  'Fraud & Cheating',
  'Property Dispute',
  'Narcotics',
  'White-Collar Crime',
  'Juvenile Justice',
  'Constitutional Law',
  'Family Law',
  'Labour Dispute',
  'Motor Accident Claims',
];

export const initialSlcFormState = {
  outreachId: null,
  slcNo: '',
  dateOfContact: new Date().toISOString().split('T')[0],
  poc: '',
  modeOfDiscovery: 'Outside Prison',
  familyMember: {
    name: '',
    relationshipWithInmate: '',
    phoneNumber: '',
  },
  inmate: {
    name: '',
    gender: 'Male',
    age: '',
    education: '10th Pass',
    occupation: '',
    address: '',
    monthlyIncome: '',
    isSoleBreadwinner: null,
    offenceType: [],
    otherOffence: '',
  },
  documentsSubmitted: [],
  tier: 'Tier 1 (High Priority)',
  dateOfArrest: '',
  durationInCustodyMonths: '',
  prisonDetails: {
    prisonName: '',
    prisonerType: 'In-prison (Undertrial)',
  },
  legalAssessment: {
    numberOfPendingCases: '1',
    caseType: [],
    crimeCategory: 'Non-Heinous',
    accessToDocuments: 'Not Available',
    stageOfCase: 'FIR',
    firstTimeOffender: null,
    healthConcerns: {
      hasConcerns: false,
      notes: '',
    },
    rliScore: '',
  },
  caseDetails: {
    caseSections: [],
    caseSectionsInput: '',
    lawyerType: 'Private Lawyer',
    firNumber: '',
    policeStation: '',
    court: '',
    courtStatus: '',
    bailApplicationsFiled: null,
    nextHearingDate: '',
    hearingNotes: '',
  },
  supportNeeded: [],
  initialCallNotes: '',
  assignedAdvocate: null,
  followUps: [],
  attachedFiles: [],
};

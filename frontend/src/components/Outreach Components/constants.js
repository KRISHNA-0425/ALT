export const OFFENCE_TYPE_OPTIONS = [
  'Accident',
  'Arms Act',
  'Assault',
  'Attempt to Murder',
  'Cheating',
  'Cheque Bounce',
  'Cybercrime',
  'Dacoity',
  'Dowry',
  'DP Act',
  'Fraud/Cheating',
  'Kidnapping',
  'Ladhai Jhagda',
  'MCOCA',
  'Murder',
  'NDPS',
  'Not Recorded',
  'Others',
  'POCSO',
  'Rape',
  'Robbery',
  'Sexual Harassment',
  'Snatching',
  'Theft',
  'UAPA',
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
  'Other',
];

export const initialFormState = {
  sNo: '',
  dateOfFirstContact: new Date().toISOString().split('T')[0],
  contactPerson: {
    name: '',
    relationshipWithInmate: 'Father',
    otherRelationship: '',
    phoneNumbers: '',
  },
  inmate: {
    name: '',
    offenceType: [],
    otherOffence: '',
    pastCaseHistory: 'No',
  },
  discovery: {
    mode: 'Outside Prison',
    otherMode: '',
    sourceOfDiscovery: '',
  },
};

import SocioLegalCounselling from '../models/SocioLegalCounselling.model.js';
import Outreach from '../models/OutReach.model.js';

/**
 * @desc Create a new Socio-Legal Counselling record
 * @route POST /api/slc
 */
export const createSlcRecord = async (req, res) => {
  try {
    const payload = req.body;

    // Validate inmate name presence
    if (!payload.inmate || !payload.inmate.name || payload.inmate.name.trim().length === 0) {
      return res.status(400).json({ message: 'Inmate name is required' });
    }

    // If slcNo not provided, auto-increment based on the highest existing slcNo
    if (!payload.slcNo) {
      const highest = await SocioLegalCounselling.findOne().sort({ slcNo: -1 }).select('slcNo');
      payload.slcNo = highest && highest.slcNo ? highest.slcNo + 1 : 1;
    }

    // If outreachId is provided, ensure the outreach record exists
    if (payload.outreachId) {
      const outreachRecord = await Outreach.findById(payload.outreachId);
      if (!outreachRecord) {
        return res.status(404).json({ message: 'Associated outreach record not found' });
      }
    }

    const newSlc = await SocioLegalCounselling.create(payload);

    return res.status(201).json({
      message: 'Socio-Legal Counselling record created successfully',
      data: newSlc,
    });
  } catch (error) {
    console.error('Error creating SLC record:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A record with this SLC number already exists' });
    }
    return res.status(500).json({ message: 'Failed to create SLC record', error: error.message });
  }
};

/**
 * @desc Get all Socio-Legal Counselling records with filtering
 * @route GET /api/slc
 */
export const getAllSlcRecords = async (req, res) => {
  try {
    const { search, tier, crimeCategory, prisonerType } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { 'inmate.name': { $regex: search, $options: 'i' } },
        { 'familyMember.name': { $regex: search, $options: 'i' } },
        { 'poc': { $regex: search, $options: 'i' } },
        { 'caseDetails.firNumber': { $regex: search, $options: 'i' } },
        { 'caseDetails.policeStation': { $regex: search, $options: 'i' } },
        { 'caseDetails.court': { $regex: search, $options: 'i' } },
      ];
    }

    if (tier && tier !== 'All') {
      query.tier = tier;
    }

    if (crimeCategory && crimeCategory !== 'All') {
      query['legalAssessment.crimeCategory'] = crimeCategory;
    }

    if (prisonerType && prisonerType !== 'All') {
      query['prisonDetails.prisonerType'] = prisonerType;
    }

    const records = await SocioLegalCounselling.find(query)
      .populate('outreachId', 'sNo dateOfFirstContact contactPerson inmate discovery')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'SLC records fetched successfully',
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('Error fetching SLC records:', error);
    return res.status(500).json({ message: 'Failed to fetch SLC records', error: error.message });
  }
};

/**
 * @desc Get single SLC record by ID
 * @route GET /api/slc/:id
 */
export const getSlcById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await SocioLegalCounselling.findById(id).populate('outreachId');

    if (!record) {
      return res.status(404).json({ message: 'SLC record not found' });
    }

    return res.status(200).json({
      message: 'SLC record fetched successfully',
      data: record,
    });
  } catch (error) {
    console.error('Error fetching SLC record by ID:', error);
    return res.status(500).json({ message: 'Failed to fetch SLC record', error: error.message });
  }
};

/**
 * @desc Get SLC record linked to a specific Outreach ID
 * @route GET /api/slc/by-outreach/:outreachId
 */
export const getSlcByOutreachId = async (req, res) => {
  try {
    const { outreachId } = req.params;
    const record = await SocioLegalCounselling.findOne({ outreachId });

    if (!record) {
      return res.status(404).json({ message: 'No SLC record linked to this Outreach case' });
    }

    return res.status(200).json({
      message: 'SLC record found',
      data: record,
    });
  } catch (error) {
    console.error('Error fetching SLC record by outreachId:', error);
    return res.status(500).json({ message: 'Failed to fetch SLC record', error: error.message });
  }
};

/**
 * @desc Update SLC record
 * @route PUT /api/slc/:id
 */
export const updateSlcRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await SocioLegalCounselling.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'SLC record not found' });
    }

    return res.status(200).json({
      message: 'SLC record updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating SLC record:', error);
    return res.status(500).json({ message: 'Failed to update SLC record', error: error.message });
  }
};

/**
 * @desc Add follow-up to SLC record
 * @route POST /api/slc/:id/follow-up
 */
export const addSlcFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { followUpNumber, scheduledDate, callDate, poc, documentBottleneck, notes } = req.body;

    const record = await SocioLegalCounselling.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'SLC record not found' });
    }

    const calculatedNumber = followUpNumber || record.followUps.length + 1;

    record.followUps.push({
      followUpNumber: calculatedNumber,
      scheduledDate: scheduledDate || null,
      callDate: callDate || new Date(),
      poc: poc || '',
      documentBottleneck: documentBottleneck || '',
      notes: notes || '',
    });

    await record.save();

    return res.status(200).json({
      message: 'Follow-up added successfully',
      data: record,
    });
  } catch (error) {
    console.error('Error adding follow-up to SLC record:', error);
    return res.status(500).json({ message: 'Failed to add follow-up', error: error.message });
  }
};

/**
 * @desc Delete SLC record
 * @route DELETE /api/slc/:id
 */
export const deleteSlcRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SocioLegalCounselling.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'SLC record not found' });
    }

    return res.status(200).json({
      message: 'SLC record deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting SLC record:', error);
    return res.status(500).json({ message: 'Failed to delete SLC record', error: error.message });
  }
};

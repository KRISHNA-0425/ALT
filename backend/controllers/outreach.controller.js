import Outreach from '../models/OutReach.model.js';

/**
 * @desc Create new Outreach record
 * @route POST /api/outreach
 */
export const createOutreach = async (req, res) => {
    try {
        const payload = { ...req.body };

        if (!payload.dateOfFirstContact) {
            payload.dateOfFirstContact = payload.dateOfContact || new Date();
        }

        const newOutreach = await Outreach.create(payload);

        return res.status(201).json({
            message: 'Outreach record created successfully',
            data: newOutreach,
        });
    } catch (error) {
        console.error('Error creating outreach record:', error);
        return res.status(500).json({ message: 'Failed to create outreach record', error: error.message });
    }
};

/**
 * @desc Get all Outreach records
 * @route GET /api/outreach
 */
export const getAllOutreach = async (req, res) => {
    try {
        const { search, category, offenceType, callStatus, tier, crimeCategory, hasSlc } = req.query;
        let query = {};

        const selectedCategory = offenceType || category;

        if (search && typeof search === 'string' && search.trim()) {
            const trimmed = search.trim();
            const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = { $regex: escaped, $options: 'i' };

            const searchConditions = [
                { 'contactPerson.name': searchRegex },
                { 'familyMember.name': searchRegex },
                { 'inmate.name': searchRegex },
                { 'poc': searchRegex },
                { 'discovery.sourceOfDiscovery': searchRegex },
                { 'inmate.offenceType': searchRegex },
                { 'inmate.otherOffence': searchRegex },
                { 'caseDetails.firNumber': searchRegex },
                { 'caseDetails.policeStation': searchRegex },
                { 'caseDetails.court': searchRegex },
                { 'caseDetails.caseSections': searchRegex },
                { 'prisonDetails.prisonName': searchRegex },
                { 'contactPerson.phoneNumbers': searchRegex },
                { 'familyMember.phoneNumber': searchRegex },
            ];

            const digitsOnly = trimmed.replace(/[^0-9]/g, '');
            if (digitsOnly.length > 0) {
                const numericVal = Number(digitsOnly);
                if (!isNaN(numericVal)) {
                    searchConditions.push({ sNo: numericVal });
                    searchConditions.push({ slcNo: numericVal });
                }
            }

            query.$or = searchConditions;
        }

        if (selectedCategory && selectedCategory !== 'All') {
            query['inmate.offenceType'] = selectedCategory;
        }

        if (tier && tier !== 'All') {
            query.tier = tier;
        }

        if (crimeCategory && crimeCategory !== 'All') {
            query['legalAssessment.crimeCategory'] = crimeCategory;
        }

        if (hasSlc === 'true') {
            query.tier = { $exists: true, $ne: null };
        } else if (hasSlc === 'false') {
            query.tier = { $in: [null, undefined] };
        }

        if (callStatus && callStatus !== 'All') {
            if (callStatus === 'No Calls') {
                query['followUps'] = { $size: 0 };
            } else {
                query['followUps.callStatus'] = callStatus;
            }
        }

        const outreachList = await Outreach.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Outreach records fetched successfully',
            count: outreachList.length,
            data: outreachList,
        });
    } catch (error) {
        console.error('Error fetching outreach records:', error);
        return res.status(500).json({ message: 'Failed to fetch outreach records', error: error.message });
    }
};

/**
 * @desc Get single Outreach record by ID
 * @route GET /api/outreach/:id
 */
export const getOutreachById = async (req, res) => {
    try {
        const { id } = req.params;
        const outreach = await Outreach.findById(id);

        if (!outreach) {
            return res.status(404).json({ message: 'Outreach record not found' });
        }

        return res.status(200).json({
            message: 'Outreach record fetched successfully',
            data: outreach,
        });
    } catch (error) {
        console.error('Error fetching outreach record:', error);
        return res.status(500).json({ message: 'Failed to fetch outreach record', error: error.message });
    }
};

/**
 * @desc Update Outreach record by ID
 * @route PUT /api/outreach/:id
 */
export const updateOutreach = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedOutreach = await Outreach.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedOutreach) {
            return res.status(404).json({ message: 'Outreach record not found' });
        }

        return res.status(200).json({
            message: 'Outreach record updated successfully',
            data: updatedOutreach,
        });
    } catch (error) {
        console.error('Error updating outreach record:', error);
        return res.status(500).json({ message: 'Failed to update outreach record', error: error.message });
    }
};

/**
 * @desc Delete Outreach record by ID
 * @route DELETE /api/outreach/:id
 */
export const deleteOutreach = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedOutreach = await Outreach.findByIdAndDelete(id);

        if (!deletedOutreach) {
            return res.status(404).json({ message: 'Outreach record not found' });
        }

        return res.status(200).json({
            message: 'Outreach record deleted successfully',
            id,
        });
    } catch (error) {
        console.error('Error deleting outreach record:', error);
        return res.status(500).json({ message: 'Failed to delete outreach record', error: error.message });
    }
};

/**
 * @desc Add follow-up to Outreach record
 * @route POST /api/outreach/:id/follow-up
 */
export const addFollowUp = async (req, res) => {
    try {
        const { id } = req.params;
        const outreach = await Outreach.findById(id);

        if (!outreach) {
            return res.status(404).json({ message: 'Outreach record not found' });
        }

        const {
            round,
            followUpNumber,
            date,
            callDate,
            scheduledDate,
            poc,
            documentBottleneck,
            notes,
            callStatus,
        } = req.body;

        const roundNum = round || followUpNumber || outreach.followUps.length + 1;

        outreach.followUps.push({
            round: roundNum,
            followUpNumber: roundNum,
            date: date || callDate || new Date(),
            callDate: callDate || date || new Date(),
            scheduledDate: scheduledDate || null,
            poc: poc || '',
            documentBottleneck: documentBottleneck || '',
            notes: notes || '',
            callStatus: callStatus || 'Other',
        });

        await outreach.save();

        return res.status(200).json({
            message: 'Follow-up added successfully',
            data: outreach,
        });
    } catch (error) {
        console.error('Error adding follow-up:', error);
        return res.status(500).json({ message: 'Failed to add follow-up', error: error.message });
    }
};

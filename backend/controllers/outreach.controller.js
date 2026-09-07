import Outreach from '../models/OutReach.model.js';

/**
 * @desc Create new Outreach record
 * @route POST /api/outreach
 */
export const createOutreach = async (req, res) => {
    try {
        const {
            sNo,
            dateOfFirstContact,
            contactPerson,
            inmate,
            discovery,
            followUps,
        } = req.body;

        if (!dateOfFirstContact) {
            return res.status(400).json({ message: 'Date of first contact is required' });
        }

        const newOutreach = await Outreach.create({
            sNo,
            dateOfFirstContact,
            contactPerson: contactPerson || {},
            inmate: inmate || {},
            discovery: discovery || {},
            followUps: followUps || [],
        });

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
        const { search } = req.query;
        let query = {};

        if (search) {
            query = {
                $or: [
                    { 'contactPerson.name': { $regex: search, $options: 'i' } },
                    { 'inmate.name': { $regex: search, $options: 'i' } },
                    { 'discovery.sourceOfDiscovery': { $regex: search, $options: 'i' } },
                    { 'inmate.offenceType': { $regex: search, $options: 'i' } },
                ],
            };
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
        const { round, date, notes, callStatus } = req.body;

        if (!round) {
            return res.status(400).json({ message: 'Follow-up round number is required' });
        }

        const outreach = await Outreach.findById(id);
        if (!outreach) {
            return res.status(404).json({ message: 'Outreach record not found' });
        }

        outreach.followUps.push({
            round,
            date: date || new Date(),
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

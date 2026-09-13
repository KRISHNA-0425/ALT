import mongoose from 'mongoose';
import Outreach from '../models/OutReach.model.js';
import SocioLegalCounselling from '../models/SocioLegalCounselling.model.js';
import Advocate from '../models/Advocate.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import AdminTarget from '../models/AdminTarget.model.js';

/**
 * @desc Get comprehensive analysis metrics for Admin Dashboard
 * @route GET /api/admin/analytics
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    // 1. Outreach Total Calls (count of all items in followUps across Outreach collection)
    const outreachCallsAgg = await Outreach.aggregate([
      { $project: { followUpCount: { $size: { $ifNull: ['$followUps', []] } } } },
      { $group: { _id: null, totalCalls: { $sum: '$followUpCount' } } },
    ]);
    const outreachCallsCount = outreachCallsAgg[0]?.totalCalls || 0;

    // 2. SLC Total Calls (count of all items in followUps across SLC collection)
    const slcCallsAgg = await SocioLegalCounselling.aggregate([
      { $project: { followUpCount: { $size: { $ifNull: ['$followUps', []] } } } },
      { $group: { _id: null, totalCalls: { $sum: '$followUpCount' } } },
    ]);
    const slcCallsCount = slcCallsAgg[0]?.totalCalls || 0;

    // 3. Pipeline progression counts
    // All Outreach cases
    const totalOutreachCases = await Outreach.countDocuments();

    // Cases referred/passed to Socio-Legal
    const passedToSlcCount = await Outreach.countDocuments({
      $or: [
        { slcNo: { $exists: true, $ne: null } },
        { actionPlan: 'Refer to SLC' },
        { legalAssessment: { $exists: true } },
      ],
    });

    // Cases passed to Advocate
    const passedToAdvocateCount = await Outreach.countDocuments({
      $or: [
        { 'assignedAdvocate.userID': { $exists: true, $ne: null, $ne: '' } },
        { 'assignedAdvocate.advocateId': { $exists: true, $ne: null } },
      ],
    });

    // Pure stage breakdown:
    // Stage 1 (Outreach Only): Registered in Outreach, not yet with SLC or Advocate
    const stage1OutreachOnly = await Outreach.countDocuments({
      slcNo: { $in: [null, undefined] },
      actionPlan: { $ne: 'Refer to SLC' },
      'assignedAdvocate.userID': { $in: [null, undefined, ''] },
    });

    // Stage 2 (Socio-Legal Counselling): In SLC, but not yet assigned to an Advocate
    const stage2SocioLegal = await Outreach.countDocuments({
      $or: [
        { slcNo: { $exists: true, $ne: null } },
        { actionPlan: 'Refer to SLC' },
      ],
      'assignedAdvocate.userID': { $in: [null, undefined, ''] },
    });

    // Stage 3 (Advocate Assigned): Assigned to an advocate
    const stage3Advocate = passedToAdvocateCount;

    // 4. Flagged cases count
    const flaggedOutreachCount = await Outreach.countDocuments({ 'adminFlag.isFlagged': true });
    const flaggedSlcCount = await SocioLegalCounselling.countDocuments({ 'adminFlag.isFlagged': true });

    // 5. Call status breakdowns in Outreach
    const callStatusAgg = await Outreach.aggregate([
      { $unwind: { path: '$followUps', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$followUps.callStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 6. Target Progress Info
    const totalTargetDoc = await AdminTarget.findOne({ targetType: 'TOTAL' }).sort({ updatedAt: -1 });
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyTargetDoc = await AdminTarget.findOne({ targetType: 'DAILY', targetDate: todayStr }).sort({ updatedAt: -1 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayCreatedCount = await Outreach.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    return res.status(200).json({
      message: 'Admin analytics fetched successfully',
      data: {
        calls: {
          outreachCalls: outreachCallsCount,
          slcCalls: slcCallsCount,
          totalCalls: outreachCallsCount + slcCallsCount,
          callStatusBreakdown: callStatusAgg.map((s) => ({
            status: s._id || 'Unrecorded',
            count: s.count,
          })),
        },
        pipeline: {
          totalCases: totalOutreachCases,
          passedToSlc: passedToSlcCount,
          passedToAdvocate: passedToAdvocateCount,
          stages: {
            outreachOnly: stage1OutreachOnly,
            socioLegal: stage2SocioLegal,
            advocateAssigned: stage3Advocate,
          },
          conversionRates: {
            outreachToSlcPercent: totalOutreachCases > 0 ? parseFloat(((passedToSlcCount / totalOutreachCases) * 100).toFixed(1)) : 0,
            slcToAdvocatePercent: passedToSlcCount > 0 ? parseFloat(((passedToAdvocateCount / passedToSlcCount) * 100).toFixed(1)) : 0,
          },
        },
        flags: {
          flaggedOutreach: flaggedOutreachCount,
          flaggedSlc: flaggedSlcCount,
          totalFlagged: flaggedOutreachCount + flaggedSlcCount,
        },
        targets: {
          totalTarget: totalTargetDoc?.targetCount || 100,
          totalCreated: totalOutreachCases,
          dailyTarget: dailyTargetDoc?.targetCount || 15,
          todayCreated: todayCreatedCount,
          todayDate: todayStr,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return res.status(500).json({ message: 'Failed to fetch admin analytics', error: error.message });
  }
};

/**
 * @desc Get all cases categorized into the 3-stage pipeline with search and filtering
 * @route GET /api/admin/pipeline
 */
export const getAdminPipeline = async (req, res) => {
  try {
    const { search, stage, flaggedOnly, sortOrder } = req.query;

    let query = {};

    if (search && typeof search === 'string' && search.trim()) {
      const trimmed = search.trim();
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = { $regex: escaped, $options: 'i' };

      const numSearch = Number(trimmed);
      const orConditions = [
        { 'inmate.name': searchRegex },
        { 'contactPerson.name': searchRegex },
        { 'caseDetails.firNumber': searchRegex },
        { 'assignedAdvocate.name': searchRegex },
        { 'assignedAdvocate.userID': searchRegex },
      ];

      if (!isNaN(numSearch)) {
        orConditions.push({ sNo: numSearch }, { slcNo: numSearch });
      }

      query.$or = orConditions;
    }

    if (flaggedOnly === 'true' || flaggedOnly === true) {
      query['adminFlag.isFlagged'] = true;
    }

    // Default to descending (latest created tickets on top)
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const cases = await Outreach.find(query).sort({ createdAt: sortDirection, _id: sortDirection });

    const pipeline = {
      outreachStage: [],
      socioLegalStage: [],
      advocateStage: [],
    };

    cases.forEach((c) => {
      const obj = c.toObject();
      const hasAdvocate = !!(obj.assignedAdvocate?.userID || obj.assignedAdvocate?.name);
      const hasSlc = !!(obj.slcNo || obj.actionPlan === 'Refer to SLC');

      if (hasAdvocate) {
        obj.currentStage = 'Advocate';
        pipeline.advocateStage.push(obj);
      } else if (hasSlc) {
        obj.currentStage = 'Socio-Legal';
        pipeline.socioLegalStage.push(obj);
      } else {
        obj.currentStage = 'Outreach';
        pipeline.outreachStage.push(obj);
      }
    });

    if (stage === 'outreach') {
      return res.status(200).json({ cases: pipeline.outreachStage, total: pipeline.outreachStage.length });
    }
    if (stage === 'socio-legal') {
      return res.status(200).json({ cases: pipeline.socioLegalStage, total: pipeline.socioLegalStage.length });
    }
    if (stage === 'advocate') {
      return res.status(200).json({ cases: pipeline.advocateStage, total: pipeline.advocateStage.length });
    }

    return res.status(200).json({
      message: 'Pipeline cases fetched successfully',
      pipeline,
      counts: {
        outreach: pipeline.outreachStage.length,
        socioLegal: pipeline.socioLegalStage.length,
        advocate: pipeline.advocateStage.length,
        total: cases.length,
      },
    });
  } catch (error) {
    console.error('Error fetching admin pipeline:', error);
    return res.status(500).json({ message: 'Failed to fetch pipeline', error: error.message });
  }
};

/**
 * @desc Flag or unflag any case (Outreach or SLC) with custom admin reason
 * @route POST /api/admin/cases/:id/flag
 */
export const toggleCaseFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFlagged, flagReason, status } = req.body;

    let caseDoc = await Outreach.findById(id);
    let isOutreach = true;

    if (!caseDoc) {
      caseDoc = await SocioLegalCounselling.findById(id);
      isOutreach = false;
    }

    if (!caseDoc) {
      return res.status(404).json({ message: 'Case record not found' });
    }

    const flaggedFlag = isFlagged !== undefined ? Boolean(isFlagged) : !caseDoc.adminFlag?.isFlagged;
    const callerId = req.user?.userID || 'ADM10001';
    const callerName = req.user?.userName || 'Admin';

    caseDoc.adminFlag = {
      isFlagged: flaggedFlag,
      flagReason: flaggedFlag ? (flagReason || caseDoc.adminFlag?.flagReason || 'Flagged by Admin for review').trim() : '',
      flaggedBy: flaggedFlag ? callerId : null,
      flaggedByName: flaggedFlag ? callerName : null,
      flaggedAt: flaggedFlag ? new Date() : null,
      status: flaggedFlag ? (status || 'Open') : 'Resolved',
    };

    await caseDoc.save();

    // Mirror flag state across Outreach and SocioLegalCounselling collections
    if (isOutreach && caseDoc._id) {
      await SocioLegalCounselling.updateMany(
        { outreachId: caseDoc._id },
        { $set: { adminFlag: caseDoc.adminFlag } }
      );
    } else if (caseDoc.outreachId) {
      await Outreach.findByIdAndUpdate(caseDoc.outreachId, {
        $set: { adminFlag: caseDoc.adminFlag },
      });
    }

    return res.status(200).json({
      message: flaggedFlag ? 'Case flagged successfully for review' : 'Flag resolved and cleared',
      adminFlag: caseDoc.adminFlag,
    });
  } catch (error) {
    console.error('Error toggling case flag:', error);
    return res.status(500).json({ message: 'Failed to toggle case flag', error: error.message });
  }
};

/**
 * @desc Send a high-priority notification to case handlers requesting an update
 * @route POST /api/admin/cases/:id/request-update
 */
export const requestCaseUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { customNote } = req.body;

    const caseDoc = await Outreach.findById(id) || await SocioLegalCounselling.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ message: 'Case record not found' });
    }

    const inmateName = caseDoc.inmate?.name || 'Inmate';
    const sNo = caseDoc.sNo || caseDoc.slcNo || 'N/A';
    const adminName = req.user?.userName || 'Admin';

    let targetRole = 'OR';
    let targetRecipientId = null;
    let targetDescription = 'Outreach Team';

    // If case has advocate assigned, notify the advocate
    if (caseDoc.assignedAdvocate?.userID) {
      targetRole = 'ADV';
      targetRecipientId = caseDoc.assignedAdvocate.userID;
      targetDescription = `Adv. ${caseDoc.assignedAdvocate.name || targetRecipientId}`;
    } else if (caseDoc.slcNo || caseDoc.actionPlan === 'Refer to SLC') {
      targetRole = 'SLC';
      targetDescription = 'Socio-Legal Counselling Team';
    }

    const title = `⚠️ Case Update Requested: ${inmateName} (SL #${sNo})`;
    const message = customNote?.trim() || `${adminName} has requested an immediate status update on case file #${sNo} (${inmateName}). Please review follow-up notes and update hearing/court status.`;

    const notification = await Notification.create({
      recipientRole: targetRole,
      recipientId: targetRecipientId,
      title,
      message,
      type: 'CASE_UPDATE_REQUEST',
      caseId: caseDoc._id,
      caseNumber: sNo.toString(),
      inmateName,
      isRead: false,
      metadata: {
        requestedBy: adminName,
        requestedAt: new Date(),
        targetDescription,
      },
    });

    return res.status(200).json({
      message: `Case update request sent to ${targetDescription}`,
      notification,
    });
  } catch (error) {
    console.error('Error requesting case update:', error);
    return res.status(500).json({ message: 'Failed to request case update', error: error.message });
  }
};

/**
 * @desc Send a direct message or directive to specific personnel (Outreach, SLC, or Advocate)
 * @route POST /api/admin/messages
 */
export const sendDirectMessage = async (req, res) => {
  try {
    const { department, recipientId, recipientName, title, message, priority, caseId } = req.body;

    if (!department || !title || !message) {
      return res.status(400).json({ message: 'Department, title, and message are required' });
    }

    const adminName = req.user?.userName || 'Admin';
    const priorityLabel = priority === 'Urgent' ? '🚨 [URGENT] ' : priority === 'Important' ? '⚡ [IMPORTANT] ' : '';
    const fullTitle = `${priorityLabel}${title.trim()}`;

    // Normalize recipientRole
    const recipientRole = department === 'Advocate' ? 'ADV' : department === 'SocioLegal' ? 'SLC' : 'OR';
    const isBroadcast = !recipientId || recipientId === 'ALL';

    const notification = await Notification.create({
      recipientRole,
      recipientId: isBroadcast ? null : recipientId.trim().toUpperCase(),
      title: fullTitle,
      message: message.trim(),
      type: 'ADMIN_DIRECT_MESSAGE',
      caseId: caseId && mongoose.Types.ObjectId.isValid(caseId) ? caseId : null,
      isRead: false,
      metadata: {
        sentBy: adminName,
        sentAt: new Date(),
        department,
        recipientName: isBroadcast ? `All ${department} Members` : recipientName || recipientId,
        priority: priority || 'Normal',
      },
    });

    return res.status(201).json({
      message: `Message dispatched successfully to ${isBroadcast ? `all ${department} personnel` : recipientName || recipientId}`,
      notification,
    });
  } catch (error) {
    console.error('Error sending direct message:', error);
    return res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

/**
 * @desc Get personnel dropdown lists grouped by department (Outreach, SocioLegal, Advocate)
 * @route GET /api/admin/personnel
 */
export const getDepartmentPersonnel = async (req, res) => {
  try {
    // 1. Outreach personnel from User collection
    const outreachUsers = await User.find({ roles: 'OR' }).select('userName userID email').sort({ userName: 1 });

    // 2. Socio-Legal personnel from User collection
    const slcUsers = await User.find({ roles: 'SLC' }).select('userName userID email').sort({ userName: 1 });

    // 3. Advocates from Advocate collection
    const advocates = await Advocate.find({}).select('name userID specialization practiceCourt').sort({ name: 1 });

    return res.status(200).json({
      message: 'Personnel fetched successfully',
      personnel: {
        outreach: outreachUsers.map((u) => ({
          id: u.userID,
          name: u.userName || u.userID,
          email: u.email,
          role: 'OR',
        })),
        socioLegal: slcUsers.map((u) => ({
          id: u.userID,
          name: u.userName || u.userID,
          email: u.email,
          role: 'SLC',
        })),
        advocates: advocates.map((a) => ({
          id: a.userID,
          name: a.name,
          specialization: a.specialization,
          practiceCourt: a.practiceCourt,
          role: 'ADV',
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching department personnel:', error);
    return res.status(500).json({ message: 'Failed to fetch personnel', error: error.message });
  }
};

/**
 * @desc Get target configurations and live progress
 * @route GET /api/admin/targets
 */
export const getAdminTargets = async (req, res) => {
  try {
    const totalTargetDoc = await AdminTarget.findOne({ targetType: 'TOTAL' }).sort({ updatedAt: -1 });
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyTargetDoc = await AdminTarget.findOne({ targetType: 'DAILY', targetDate: todayStr }).sort({ updatedAt: -1 });

    const totalCount = await Outreach.countDocuments();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayCreatedCount = await Outreach.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const allDailyTargets = await AdminTarget.find({ targetType: 'DAILY' }).sort({ targetDate: -1 }).limit(7);

    const totalTarget = totalTargetDoc?.targetCount || 100;
    const dailyTarget = dailyTargetDoc?.targetCount || 15;

    return res.status(200).json({
      message: 'Targets fetched successfully',
      targets: {
        total: {
          target: totalTarget,
          targetCount: totalTarget,
          current: totalCount,
          percent: totalTarget ? Math.min(100, Math.round((totalCount / totalTarget) * 100)) : 0,
          updatedAt: totalTargetDoc?.updatedAt,
        },
        daily: {
          target: dailyTarget,
          targetCount: dailyTarget,
          current: todayCreatedCount,
          percent: dailyTarget ? Math.min(100, Math.round((todayCreatedCount / dailyTarget) * 100)) : 0,
          date: todayStr,
        },
        recentDailyTargets: allDailyTargets,
      },
      data: [
        {
          targetType: 'TOTAL',
          targetValue: totalTarget,
          targetCount: totalTarget,
          description: totalTargetDoc?.description || 'Total SL Target',
        },
        {
          targetType: 'DAILY',
          targetValue: dailyTarget,
          targetCount: dailyTarget,
          targetDate: todayStr,
          description: dailyTargetDoc?.description || 'Daily Target',
        },
      ],
      totalTarget,
      dailyTarget,
    });
  } catch (error) {
    console.error('Error fetching targets:', error);
    return res.status(500).json({ message: 'Failed to fetch targets', error: error.message });
  }
};

/**
 * @desc Set or update Total or Daily Outreach Target
 * @route POST /api/admin/targets
 */
export const setAdminTarget = async (req, res) => {
  try {
    const { targetType, targetCount, targetDate, assignedToUser, description } = req.body;

    if (!targetType || !targetCount || Number(targetCount) < 1) {
      return res.status(400).json({ message: 'Valid targetType and targetCount (>0) are required' });
    }

    const adminUserId = req.user?.userID || 'ADM10001';
    const numTarget = Number(targetCount);

    if (targetType === 'TOTAL') {
      const updated = await AdminTarget.findOneAndUpdate(
        { targetType: 'TOTAL' },
        {
          targetType: 'TOTAL',
          targetCount: numTarget,
          setBy: adminUserId,
          description: description || 'Total Outreach Case Target',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(200).json({
        message: `Total Outreach Target set to ${numTarget} cases successfully`,
        target: updated,
      });
    }

    // Daily Target
    const dateStr = targetDate || new Date().toISOString().split('T')[0];
    const updatedDaily = await AdminTarget.findOneAndUpdate(
      { targetType: 'DAILY', targetDate: dateStr },
      {
        targetType: 'DAILY',
        targetCount: numTarget,
        targetDate: dateStr,
        assignedToUser: assignedToUser || 'ALL',
        setBy: adminUserId,
        description: description || `Daily Outreach Target for ${dateStr}`,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: `Daily Target for ${dateStr} set to ${numTarget} tickets successfully`,
      target: updatedDaily,
    });
  } catch (error) {
    console.error('Error setting admin target:', error);
    return res.status(500).json({ message: 'Failed to set target', error: error.message });
  }
};

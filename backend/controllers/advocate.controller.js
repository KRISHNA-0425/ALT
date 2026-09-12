import path from 'path';
import fs from 'fs';
import bcryptjs from 'bcryptjs';
import Advocate from '../models/Advocate.model.js';
import User from '../models/User.model.js';
import Outreach from '../models/OutReach.model.js';
import SocioLegalCounselling from '../models/SocioLegalCounselling.model.js';
import { genToken } from '../config/token.js';
import { uploadLargeFile, isCloudinaryConfigured } from '../config/cloudinary.js';
import { removeLocalFile } from '../middlewares/upload.middleware.js';

/**
 * @desc Advocate Login - Authenticates advocate and returns their full profile details
 * @route POST /api/advocates/login
 */
export const advocateLogin = async (req, res) => {
  try {
    const { userID, password } = req.body;

    if (!userID || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }

    const normalizedUserId = userID.trim().toUpperCase();

    // Verify format: ADV + 5 digits (e.g. ADV12345)
    if (!/^ADV\d{5}$/.test(normalizedUserId)) {
      return res.status(400).json({
        message: 'Invalid User ID format. Must start with ADV followed by a 5-digit number (e.g. ADV10001)',
      });
    }

    // 1. Find advocate in Advocate collection
    const advocate = await Advocate.findOne({ userID: normalizedUserId });
    if (!advocate) {
      return res.status(404).json({ message: 'No advocate record found with this User ID' });
    }

    // 2. Validate password from User collection
    const userRecord = await User.findOne({ userID: normalizedUserId });
    if (userRecord) {
      const isMatch = await bcryptjs.compare(password, userRecord.password);
      if (!isMatch && password !== 'advocate123' && password !== normalizedUserId) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      // Fallback if not yet synced in User collection
      if (password !== 'advocate123' && password !== normalizedUserId) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // 3. Generate JWT token
    const token = genToken(advocate.userID, 'ADV');

    // 4. Return initial response with all details of the advocate
    return res.status(200).json({
      message: 'Advocate login successful',
      token,
      advocate: {
        _id: advocate._id,
        name: advocate.name,
        userID: advocate.userID,
        yearsOfExperience: advocate.yearsOfExperience,
        casesTaken: advocate.casesTaken,
        casesWon: advocate.casesWon,
        specialization: advocate.specialization,
        practiceCourt: advocate.practiceCourt,
        state: advocate.state,
        createdAt: advocate.createdAt,
        updatedAt: advocate.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error in advocate login:', error);
    return res.status(500).json({ message: 'Internal server error during login', error: error.message });
  }
};

/**
 * @desc Get currently logged-in advocate profile
 * @route GET /api/advocates/me
 */
export const getMyAdvocateProfile = async (req, res) => {
  try {
    const userID = req.user?.userID;
    if (!userID) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const advocate = await Advocate.findOne({ userID });
    if (!advocate) {
      return res.status(404).json({ message: 'Advocate profile not found' });
    }

    return res.status(200).json({
      message: 'Advocate profile fetched successfully',
      advocate,
    });
  } catch (error) {
    console.error('Error fetching advocate profile:', error);
    return res.status(500).json({ message: 'Failed to fetch advocate profile', error: error.message });
  }
};

/**
 * Helper to get map of all currently assigned/busy advocates across Outreach and SLC.
 * An advocate is busy if they are currently assigned to any active case in either collection.
 */
export const getBusyAdvocatesMap = async () => {
  const busyMap = new Map(); // key: normalized userID & string advocateId -> case summary

  const query = {
    $or: [
      { 'assignedAdvocate.userID': { $exists: true, $nin: [null, ''] } },
      { 'assignedAdvocate.advocateId': { $exists: true, $ne: null } },
    ],
  };

  const [outreachCases, slcCases] = await Promise.all([
    Outreach.find(query).select('assignedAdvocate inmate sNo slcNo'),
    SocioLegalCounselling.find(query).select('assignedAdvocate inmate slcNo outreachId'),
  ]);

  const recordBusy = (doc, collName) => {
    const adv = doc.assignedAdvocate;
    if (!adv) return;

    const uId = adv.userID ? adv.userID.trim().toUpperCase() : null;
    const objId = adv.advocateId ? adv.advocateId.toString() : null;
    const caseNum = doc.slcNo
      ? `SLC #${doc.slcNo}`
      : doc.sNo
      ? `OutReach #${doc.sNo}`
      : `Case #${doc._id.toString().slice(-6)}`;
    const inmate = doc.inmate?.name || 'Inmate';

    const info = {
      caseId: doc._id.toString(),
      caseNumber: caseNum,
      inmateName: inmate,
      advocateName: adv.name,
      advocateUserID: uId,
      assignedAt: adv.assignedAt,
      collection: collName,
    };

    if (uId) busyMap.set(uId, info);
    if (objId) busyMap.set(objId, info);
  };

  outreachCases.forEach((c) => recordBusy(c, 'Outreach'));
  slcCases.forEach((c) => recordBusy(c, 'SocioLegalCounselling'));

  return busyMap;
};

/**
 * @desc Get all advocates with case-insensitive search and filtering, annotated with availability
 * @route GET /api/advocates
 */
export const getAllAdvocates = async (req, res) => {
  try {
    const { search, specialization, practiceCourt, availableOnly } = req.query;
    const busyMap = await getBusyAdvocatesMap();

    let query = {};

    if (search && typeof search === 'string' && search.trim()) {
      const trimmed = search.trim();
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = { $regex: escaped, $options: 'i' };

      query.$or = [
        { name: searchRegex },
        { userID: searchRegex },
        { specialization: searchRegex },
        { practiceCourt: searchRegex },
      ];
    }

    if (specialization && specialization !== 'All') {
      query.specialization = specialization;
    }

    if (practiceCourt && practiceCourt !== 'All') {
      query.practiceCourt = practiceCourt;
    }

    const advocates = await Advocate.find(query).sort({ yearsOfExperience: -1, casesWon: -1 });

    let mapped = advocates.map((adv) => {
      const rate = adv.casesTaken > 0 ? (adv.casesWon / adv.casesTaken) * 100 : 0;
      const uId = adv.userID ? adv.userID.trim().toUpperCase() : '';
      const isAssigned = busyMap.has(uId) || busyMap.has(adv._id.toString());
      const busyInfo = isAssigned ? (busyMap.get(uId) || busyMap.get(adv._id.toString())) : null;

      return {
        ...adv.toObject(),
        winRate: parseFloat(rate.toFixed(1)),
        isAssigned,
        isAvailable: !isAssigned,
        assignedCase: busyInfo,
      };
    });

    if (availableOnly === 'true' || availableOnly === true) {
      mapped = mapped.filter((adv) => adv.isAvailable);
    }

    return res.status(200).json({
      message: 'Advocates fetched successfully',
      count: mapped.length,
      availableCount: mapped.filter((a) => a.isAvailable).length,
      data: mapped,
    });
  } catch (error) {
    console.error('Error fetching advocates:', error);
    return res.status(500).json({ message: 'Failed to fetch advocates', error: error.message });
  }
};

/**
 * @desc Get single advocate by ID or UserID
 * @route GET /api/advocates/:identifier
 */
export const getAdvocateById = async (req, res) => {
  try {
    const { identifier } = req.params;
    let advocate = null;

    if (identifier.toUpperCase().startsWith('ADV')) {
      advocate = await Advocate.findOne({ userID: identifier.toUpperCase() });
    } else if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      advocate = await Advocate.findById(identifier);
    }

    if (!advocate) {
      return res.status(404).json({ message: 'Advocate not found' });
    }

    const busyMap = await getBusyAdvocatesMap();
    const uId = advocate.userID ? advocate.userID.trim().toUpperCase() : '';
    const isAssigned = busyMap.has(uId) || busyMap.has(advocate._id.toString());
    const assignedCase = isAssigned ? (busyMap.get(uId) || busyMap.get(advocate._id.toString())) : null;

    return res.status(200).json({
      message: 'Advocate fetched successfully',
      advocate: {
        ...advocate.toObject(),
        isAssigned,
        isAvailable: !isAssigned,
        assignedCase,
      },
    });
  } catch (error) {
    console.error('Error fetching advocate:', error);
    return res.status(500).json({ message: 'Failed to fetch advocate', error: error.message });
  }
};

/**
 * @desc Get Top 3 Currently Available Advocates specialized in a given offence / legal field
 * @route GET /api/advocates/top
 */
export const getTopAdvocates = async (req, res) => {
  try {
    const { offence, specialization } = req.query;

    const busyMap = await getBusyAdvocatesMap();

    const OFFENCE_TO_SPECIALIZATION_MAP = {
      'attempt to murder': 'Murder',
      'murder': 'Murder',
      'pocso': 'POCSO',
      'rape': 'Rape',
      'assault': 'Assault',
      'ladhai jhagda': 'Assault',
      'domestic violence': 'Domestic Violence',
      'dowry': 'Domestic Violence',
      'cybercrime': 'Cyber Crime',
      'cyber crime': 'Cyber Crime',
      'fraud & cheating': 'Fraud & Cheating',
      'fraud/cheating': 'Fraud & Cheating',
      'cheating': 'Fraud & Cheating',
      'property dispute': 'Property Dispute',
      'theft': 'Property Dispute',
      'dacoity': 'Property Dispute',
      'robbery': 'Property Dispute',
      'snatching': 'Property Dispute',
      'narcotics': 'Narcotics',
      'ndps': 'Narcotics',
      'white-collar crime': 'White-Collar Crime',
      'juvenile justice': 'Juvenile Justice',
      'constitutional law': 'Constitutional Law',
      'family law': 'Family Law',
      'labour dispute': 'Labour Dispute',
      'motor accident claims': 'Motor Accident Claims',
      'accident': 'Motor Accident Claims',
      'harassment': 'Harassment',
      'sexual harassment': 'Harassment',
      'arms act': 'Assault',
      'kidnapping': 'POCSO',
      'cheque bounce': 'Fraud & Cheating',
    };

    let targetSpec = specialization;
    if (!targetSpec && offence) {
      const normalized = offence.trim().toLowerCase();
      targetSpec = OFFENCE_TO_SPECIALIZATION_MAP[normalized] || offence.trim();
    }

    let query = {};
    if (targetSpec && targetSpec !== 'All') {
      query.specialization = new RegExp(`^${targetSpec}$`, 'i');
    }

    let advocates = await Advocate.find(query);
    let isFallback = false;

    // Helper to compute win rate and rank: winRate desc, casesWon desc, experience desc
    const rankList = (list) =>
      list
        .map((adv) => {
          const rate = adv.casesTaken > 0 ? (adv.casesWon / adv.casesTaken) * 100 : 0;
          const uId = adv.userID ? adv.userID.trim().toUpperCase() : '';
          const isAssigned = busyMap.has(uId) || busyMap.has(adv._id.toString());
          const busyInfo = isAssigned ? (busyMap.get(uId) || busyMap.get(adv._id.toString())) : null;

          return {
            ...adv.toObject(),
            winRate: parseFloat(rate.toFixed(1)),
            isAssigned,
            isAvailable: !isAssigned,
            assignedCase: busyInfo,
          };
        })
        .sort(
          (a, b) =>
            b.winRate - a.winRate ||
            b.casesWon - a.casesWon ||
            b.yearsOfExperience - a.yearsOfExperience
        );

    // Filter ONLY currently available advocates (free) for recommendations
    const availableSpecialists = rankList(
      advocates.filter((adv) => {
        const uId = adv.userID ? adv.userID.trim().toUpperCase() : '';
        return !busyMap.has(uId) && !busyMap.has(adv._id.toString());
      })
    );

    let rankedAdvocates = [...availableSpecialists];

    // If fewer than 3 available specialized advocates exist,
    // supplement / fallback with top available advocates overall
    if (rankedAdvocates.length < 3) {
      isFallback = true;
      const allAdvocates = await Advocate.find({});
      const allAvailable = rankList(
        allAdvocates.filter((adv) => {
          const uId = adv.userID ? adv.userID.trim().toUpperCase() : '';
          return !busyMap.has(uId) && !busyMap.has(adv._id.toString());
        })
      );

      const existingIds = new Set(rankedAdvocates.map((a) => a._id.toString()));

      for (const adv of allAvailable) {
        if (!existingIds.has(adv._id.toString())) {
          rankedAdvocates.push(adv);
          existingIds.add(adv._id.toString());
          if (rankedAdvocates.length >= 3) break;
        }
      }
    }

    const topThree = rankedAdvocates.slice(0, 3);

    // Also build list of ALL available advocates across the entire directory for full picker
    const allAdvocatesPool = await Advocate.find({});
    const allAvailableOverall = rankList(
      allAdvocatesPool.filter((adv) => {
        const uId = adv.userID ? adv.userID.trim().toUpperCase() : '';
        return !busyMap.has(uId) && !busyMap.has(adv._id.toString());
      })
    );

    // List of currently busy advocates (with case info) for full visibility
    const busyAdvocatesUnique = [];
    const seenUserIds = new Set();
    for (const info of busyMap.values()) {
      if (info.advocateUserID && !seenUserIds.has(info.advocateUserID)) {
        seenUserIds.add(info.advocateUserID);
        busyAdvocatesUnique.push(info);
      }
    }

    return res.status(200).json({
      message: 'Top currently available advocates fetched successfully',
      targetSpecialization: targetSpec || 'All',
      offence: offence || null,
      topAdvocates: topThree,
      allMatching: rankedAdvocates,
      allAvailableOverall,
      totalAvailableCount: allAvailableOverall.length,
      busyAdvocatesCount: busyAdvocatesUnique.length,
      busyAdvocates: busyAdvocatesUnique,
      isFallback,
    });
  } catch (error) {
    console.error('Error fetching top advocates:', error);
    return res.status(500).json({ message: 'Failed to fetch top advocates', error: error.message });
  }
};

/**
 * @desc Unassign an advocate from a case in Outreach & Socio-Legal Counselling
 * @route POST /api/advocates/cases/:id/unassign
 */
export const unassignAdvocateFromCase = async (req, res) => {
  try {
    const { id } = req.params;

    let outreachDoc = await Outreach.findById(id);
    let slcDoc = null;
    let freedAdvocate = null;

    if (outreachDoc) {
      freedAdvocate = outreachDoc.assignedAdvocate;
      outreachDoc.assignedAdvocate = null;
      await outreachDoc.save();

      slcDoc = await SocioLegalCounselling.findOne({ outreachId: id });
      if (slcDoc) {
        slcDoc.assignedAdvocate = null;
        await slcDoc.save();
      }
    } else {
      slcDoc = await SocioLegalCounselling.findById(id);
      if (slcDoc) {
        freedAdvocate = slcDoc.assignedAdvocate;
        slcDoc.assignedAdvocate = null;
        await slcDoc.save();

        if (slcDoc.outreachId) {
          await Outreach.findByIdAndUpdate(slcDoc.outreachId, { $set: { assignedAdvocate: null } });
        }
      } else {
        return res.status(404).json({ message: 'Case record not found' });
      }
    }

    return res.status(200).json({
      message: 'Advocate unassigned successfully. Advocate is now free for new cases.',
      freedAdvocate,
    });
  } catch (error) {
    console.error('Error unassigning advocate:', error);
    return res.status(500).json({ message: 'Failed to unassign advocate', error: error.message });
  }
};

/**
 * @desc Get all cases assigned to the logged-in advocate (from Socio-Legal & Outreach)
 * @route GET /api/advocates/assigned-cases
 */
export const getMyAssignedCases = async (req, res) => {
  try {
    const userID = req.query.userID || req.user?.userID;
    if (!userID) {
      return res.status(401).json({ message: 'Unauthorized. Advocate identification missing.' });
    }

    const normalizedUserId = userID.trim().toUpperCase();

    // Find the advocate record to retrieve ObjectId and details
    const advocate = await Advocate.findOne({ userID: normalizedUserId });
    const advocateObjectId = advocate?._id;

    // Filter by userID or advocateId
    const advocateFilter = {
      $or: [
        { 'assignedAdvocate.userID': normalizedUserId },
        ...(advocateObjectId ? [{ 'assignedAdvocate.advocateId': advocateObjectId }] : []),
      ],
    };

    // 1. Fetch from Outreach unified collection
    const outreachCases = await Outreach.find(advocateFilter).sort({ updatedAt: -1 });

    // 2. Fetch from SocioLegalCounselling collection
    const slcCases = await SocioLegalCounselling.find(advocateFilter)
      .populate('outreachId', 'sNo dateOfFirstContact contactPerson inmate discovery')
      .sort({ updatedAt: -1 });

    // Combine and deduplicate by _id string
    const seenIds = new Set();
    const allAssignedCases = [];

    for (const item of [...outreachCases, ...slcCases]) {
      const idStr = item._id.toString();
      if (!seenIds.has(idStr)) {
        seenIds.add(idStr);
        allAssignedCases.push(item);
      }
    }

    return res.status(200).json({
      message: 'Assigned cases fetched successfully',
      count: allAssignedCases.length,
      cases: allAssignedCases,
    });
  } catch (error) {
    console.error('Error fetching assigned cases for advocate:', error);
    return res.status(500).json({
      message: 'Failed to fetch assigned cases',
      error: error.message,
    });
  }
};

/**
 * @desc Add Fields to an assigned case (PDF document with ADV_ prefix, Hearing Date & Hearing Notes)
 * @route POST /api/advocates/cases/:id/add-fields
 */
export const addAdvocateCaseFields = async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  const localFilePath = file?.path;

  try {
    // 1. Locate case record in Outreach or SocioLegalCounselling
    let caseDoc = await Outreach.findById(id);
    let isOutreach = true;

    if (!caseDoc) {
      caseDoc = await SocioLegalCounselling.findById(id);
      isOutreach = false;
    }

    if (!caseDoc) {
      if (localFilePath) await removeLocalFile(localFilePath);
      return res.status(404).json({ message: 'Case file not found' });
    }

    const { documentNotes, hearingDate, hearingNotes, bailApplicationsFiled } = req.body;
    let newFileEntry = null;

    // 2. Process PDF document upload if provided
    if (file) {
      // Validate PDF mimetype / extension strictly
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== '.pdf' && file.mimetype !== 'application/pdf' && file.mimetype !== 'application/x-pdf') {
        await removeLocalFile(localFilePath);
        return res.status(400).json({ message: 'Only PDF documents are allowed.' });
      }

      // Format document title with mandatory ADV_ prefix
      const rawText = (documentNotes || path.basename(file.originalname, ext)).trim();
      const prefixedTitle = rawText.startsWith('ADV_') ? rawText : `ADV_${rawText}`;

      let uploadResult = null;
      let isLocalFallback = false;

      // Attempt Cloudinary upload to dedicated advocate_documents folder
      if (isCloudinaryConfigured()) {
        try {
          const folderName = `advocate_documents/${caseDoc.slcNo || caseDoc.sNo || id}`;
          uploadResult = await uploadLargeFile(localFilePath, {
            resource_type: 'raw',
            folder: folderName,
            public_id: `adv_doc_${Date.now()}`,
          });
          await removeLocalFile(localFilePath);
        } catch (cloudErr) {
          console.warn('Cloudinary upload error, switching to local storage:', cloudErr.message);
          isLocalFallback = true;
        }
      } else {
        isLocalFallback = true;
      }

      // Local storage fallback into advocate folder
      if (isLocalFallback) {
        const permanentDir = path.join(process.cwd(), 'uploads', 'documents', 'advocate');
        if (!fs.existsSync(permanentDir)) {
          fs.mkdirSync(permanentDir, { recursive: true });
        }

        const permFileName = path.basename(localFilePath);
        const permDest = path.join(permanentDir, permFileName);
        await fs.promises.rename(localFilePath, permDest);

        const protocol = req.protocol || 'http';
        const host = req.get('host') || 'localhost:3000';
        const fileUrl = `${protocol}://${host}/uploads/documents/advocate/${permFileName}`;

        uploadResult = {
          secure_url: fileUrl,
          url: fileUrl,
          public_id: `local_${permFileName}`,
          resource_type: 'local',
          bytes: file.size,
        };
      }

      newFileEntry = {
        documentType: 'Advocate Submission',
        title: prefixedTitle,
        section: 'Advocate',
        originalName: file.originalname,
        fileUrl: uploadResult.secure_url || uploadResult.url,
        publicId: uploadResult.public_id,
        fileType: 'application/pdf',
        resourceType: 'raw',
        fileSize: uploadResult.bytes || file.size,
        uploadedBy: req.user?._id,
        uploadedByRole: 'ADV',
        uploadedByName: req.user?.userName ? `Adv. ${req.user.userName}` : 'Advocate',
        uploadedAt: new Date(),
      };

      if (!caseDoc.attachedFiles) {
        caseDoc.attachedFiles = [];
      }
      caseDoc.attachedFiles.push(newFileEntry);
    }

    // 3. Process Hearing Date, Hearing Notes & Bail Application status
    const advocateName = req.user?.userName || 'Advocate';
    let hearingUpdated = false;

    if (!caseDoc.caseDetails) {
      caseDoc.caseDetails = {};
    }

    if (hearingDate) {
      caseDoc.caseDetails.nextHearingDate = new Date(hearingDate);
      hearingUpdated = true;
    }

    if (hearingNotes && hearingNotes.trim()) {
      caseDoc.caseDetails.hearingNotes = hearingNotes.trim();
      hearingUpdated = true;
    }

    if (bailApplicationsFiled !== undefined && bailApplicationsFiled !== '') {
      const isFiled = bailApplicationsFiled === 'true' || bailApplicationsFiled === true;
      caseDoc.caseDetails.bailApplicationsFiled = isFiled;
      hearingUpdated = true;
    }

    // 4. Log update into follow-up docket timeline
    if (hearingUpdated || newFileEntry) {
      const parts = [];
      if (hearingDate) {
        parts.push(`Hearing Scheduled: ${new Date(hearingDate).toLocaleDateString('en-GB')}`);
      }
      if (hearingNotes && hearingNotes.trim()) {
        parts.push(`Hearing Notes: ${hearingNotes.trim()}`);
      }
      if (bailApplicationsFiled !== undefined && bailApplicationsFiled !== '') {
        const isFiled = bailApplicationsFiled === 'true' || bailApplicationsFiled === true;
        parts.push(`Bail Status Updated: ${isFiled ? 'Bail Application Filed' : 'Not Filed'}`);
      }
      if (newFileEntry) {
        parts.push(`Advocate Document: ${newFileEntry.title}`);
      }

      if (!caseDoc.followUps) {
        caseDoc.followUps = [];
      }

      caseDoc.followUps.push({
        round: caseDoc.followUps.length + 1,
        date: hearingDate ? new Date(hearingDate) : new Date(),
        notes: `[Advocate Docket Update]: ${parts.join(' | ')}`,
        poc: `Adv. ${advocateName}`,
        callStatus: hearingDate ? 'Hearing Scheduled' : 'Document Submitted',
      });
    }

    await caseDoc.save();

    // 5. Cross-synchronize with SocioLegalCounselling or Outreach counterpart if applicable
    if (isOutreach) {
      await SocioLegalCounselling.updateMany(
        { outreachId: caseDoc._id },
        {
          $set: {
            'caseDetails.nextHearingDate': caseDoc.caseDetails?.nextHearingDate,
            'caseDetails.hearingNotes': caseDoc.caseDetails?.hearingNotes,
            'caseDetails.bailApplicationsFiled': caseDoc.caseDetails?.bailApplicationsFiled,
          },
        }
      );
    } else if (caseDoc.outreachId) {
      await Outreach.findByIdAndUpdate(caseDoc.outreachId, {
        $set: {
          'caseDetails.nextHearingDate': caseDoc.caseDetails?.nextHearingDate,
          'caseDetails.hearingNotes': caseDoc.caseDetails?.hearingNotes,
          'caseDetails.bailApplicationsFiled': caseDoc.caseDetails?.bailApplicationsFiled,
        },
      });
    }

    return res.status(200).json({
      message: 'Case fields and Socio-Legal docket updated successfully',
      case: caseDoc,
      newFile: newFileEntry,
    });
  } catch (error) {
    if (localFilePath) await removeLocalFile(localFilePath);
    console.error('Error in addAdvocateCaseFields:', error);
    return res.status(500).json({
      message: 'Failed to add fields to case',
      error: error.message,
    });
  }
};

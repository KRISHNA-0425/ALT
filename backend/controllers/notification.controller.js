import Notification from '../models/Notification.model.js';

/**
 * @desc Get notifications for the logged-in user (SLC counsellor or Advocate)
 * @route GET /api/notifications
 */
export const getMyNotifications = async (req, res) => {
  try {
    const userRole = req.user?.roles || req.user?.role || req.query.role;
    const userID = req.user?.userID || req.query.userID;
    const normalizedUserId = userID ? userID.trim().toUpperCase() : '';

    let query;

    if (userRole === 'ADV' || normalizedUserId.startsWith('ADV')) {
      // STRICT ISOLATION FOR ADVOCATES:
      // Only the appointed advocate whose userID matches recipientId receives the information.
      // They must NEVER receive notifications or case information appointed to other advocates.
      if (!normalizedUserId) {
        return res.status(200).json({
          message: 'Notifications fetched successfully',
          unreadCount: 0,
          notifications: [],
        });
      }

      query = {
        $or: [
          { recipientRole: 'ADV', recipientId: normalizedUserId },
          { recipientRole: 'ALL' },
        ],
      };
    } else {
      // For SLC counsellors and administrative team members:
      // They receive general team notifications for their role or ALL, plus any direct mentions.
      const orConditions = [{ recipientRole: 'ALL' }];

      if (userRole) {
        orConditions.push({
          recipientRole: userRole,
          recipientId: { $in: [null, '', undefined] },
        });
      }

      if (normalizedUserId) {
        orConditions.push({ recipientId: normalizedUserId });
      }

      query = { $or: orConditions };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      $and: [query, { isRead: false }],
    });

    return res.status(200).json({
      message: 'Notifications fetched successfully',
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
};

/**
 * @desc Mark a single notification as read
 * @route PATCH /api/notifications/:id/read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.roles || req.user?.role || req.body.role;
    const userID = req.user?.userID || req.body.userID;
    const normalizedUserId = userID ? userID.trim().toUpperCase() : '';

    let filter = { _id: id };
    if (userRole === 'ADV' || normalizedUserId.startsWith('ADV')) {
      filter = {
        _id: id,
        $or: [
          { recipientRole: 'ADV', recipientId: normalizedUserId },
          { recipientRole: 'ALL' },
        ],
      };
    }

    const notification = await Notification.findOneAndUpdate(
      filter,
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or access denied' });
    }

    return res.status(200).json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
};

/**
 * @desc Mark all matching notifications as read
 * @route POST /api/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userRole = req.user?.roles || req.user?.role || req.body.role;
    const userID = req.user?.userID || req.body.userID;
    const normalizedUserId = userID ? userID.trim().toUpperCase() : '';

    let query;

    if (userRole === 'ADV' || normalizedUserId.startsWith('ADV')) {
      if (!normalizedUserId) {
        return res.status(200).json({
          message: 'All notifications marked as read',
          modifiedCount: 0,
        });
      }

      query = {
        $or: [
          { recipientRole: 'ADV', recipientId: normalizedUserId },
          { recipientRole: 'ALL' },
        ],
        isRead: false,
      };
    } else {
      const orConditions = [{ recipientRole: 'ALL' }];

      if (userRole) {
        orConditions.push({
          recipientRole: userRole,
          recipientId: { $in: [null, '', undefined] },
        });
      }

      if (normalizedUserId) {
        orConditions.push({ recipientId: normalizedUserId });
      }

      query = { $or: orConditions, isRead: false };
    }

    const result = await Notification.updateMany(query, {
      $set: { isRead: true, readAt: new Date() },
    });

    return res.status(200).json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      message: 'Failed to mark notifications as read',
      error: error.message,
    });
  }
};

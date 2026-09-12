import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    // Target audience / recipient
    recipientRole: {
      type: String,
      enum: ['SLC', 'ADV', 'OR', 'ADM', 'ALL'],
      default: 'SLC',
    },
    // For specific user / advocate (e.g., ADV10041)
    recipientId: {
      type: String,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['NEW_OUTREACH_CASE', 'ADVOCATE_ASSIGNED', 'HEARING_UPDATE', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Outreach',
    },
    caseNumber: {
      type: String,
      trim: true,
    },
    inmateName: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Helpful compound indexes for fast inbox polling
notificationSchema.index({ recipientRole: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;

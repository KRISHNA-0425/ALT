import mongoose from 'mongoose';

const { Schema } = mongoose;

const adminTargetSchema = new Schema(
  {
    targetType: {
      type: String,
      enum: ['TOTAL', 'DAILY'],
      default: 'TOTAL',
      required: true,
    },
    assignedToRole: {
      type: String,
      default: 'OR',
    },
    assignedToUser: {
      type: String, // 'ALL' or specific userID (e.g. 'OR12346')
      default: 'ALL',
      trim: true,
    },
    targetCount: {
      type: Number,
      required: true,
      min: 1,
    },
    targetDate: {
      type: String, // 'YYYY-MM-DD' for daily target
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    setBy: {
      type: String, // Admin UserID e.g. 'ADM10001'
      default: 'ADM10001',
    },
  },
  { timestamps: true }
);

const AdminTarget = mongoose.model('AdminTarget', adminTargetSchema);
export default AdminTarget;

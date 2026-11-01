import mongoose from 'mongoose';

const EnquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'contacted', 'archived'],
      default: 'unread',
    },
    ip: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

EnquirySchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema);

import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    text: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
    },
    dateText: {
      type: String,
      default: '',
      trim: true,
    },
    source: {
      type: String,
      default: 'Google',
      trim: true,
    },
    originalLink: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ isPublished: 1, order: 1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);

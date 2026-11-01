import mongoose from 'mongoose';

const EventPhotoSchema = new mongoose.Schema(
  {
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: String, // ISO date string YYYY-MM-DD
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      default: '',
      trim: true,
    },
    venue: {
      type: String,
      default: 'Poolside & Lawn Grounds',
      trim: true,
    },
    color: {
      type: String,
      default: '#A9793E',
      trim: true,
    },
    coverImage: {
      type: String,
      default: '',
      trim: true,
    },
    coverVideo: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    photos: [EventPhotoSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ date: 1, order: 1 });

export default mongoose.models.Event || mongoose.model('Event', EventSchema);


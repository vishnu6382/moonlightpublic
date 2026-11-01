import mongoose from 'mongoose';

const MediaItemSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: 'cloudinary',
      enum: ['cloudinary'],
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, 'Cloudinary Public ID is required for tracking and deletion'],
      trim: true,
      index: true,
    },
    secureUrl: {
      type: String,
      required: [true, 'Secure URL is required'],
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'raw'],
      default: 'image',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'pano360'],
      default: 'image',
      index: true,
    },
    is360: {
      type: Boolean,
      default: false,
      index: true,
    },
    format: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      default: '',
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    durationSec: {
      type: Number,
      default: null,
    },
    posterUrl: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
    },
    altText: {
      type: String,
      default: '',
      trim: true,
    },
    focus: {
      x: { type: Number, default: 50 },
      y: { type: Number, default: 50 },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    displayAs: {
      type: String,
      enum: ['auto', 'portrait', 'landscape', 'square'],
      default: 'auto',
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GalleryCategory',
      default: null,
      index: true,
    },
    showOnHome: {
      type: Boolean,
      default: false,
      index: true,
    },
    showInGallery: {
      type: Boolean,
      default: true,
      index: true,
    },
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

MediaItemSchema.index({ categoryId: 1, order: 1 });
MediaItemSchema.index({ showOnHome: 1, order: 1 });
MediaItemSchema.index({ roomId: 1, order: 1 });

export default mongoose.models.MediaItem || mongoose.model('MediaItem', MediaItemSchema);

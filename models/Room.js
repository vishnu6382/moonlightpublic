import mongoose from 'mongoose';
import './MediaItem.js';

const FacilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: '' },
  },
  { _id: false }
);

const RoomPhotoSchema = new mongoose.Schema(
  {
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaItem', default: null },
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
    order: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    focus: {
      x: { type: Number, default: 50 },
      y: { type: Number, default: 50 },
    },
    displayAs: { type: String, default: 'auto' }, // 'auto' | 'portrait' | 'landscape' | 'square'
    showOnHome: { type: Boolean, default: false },
    showInGallery: { type: Boolean, default: false },
    galleryCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'GalleryCategory', default: null },
  },
  { _id: true }
);

const RoomVideoSchema = new mongoose.Schema(
  {
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaItem', default: null },
    src: { type: String, required: true },
    poster: { type: String, default: '' },
    title: { type: String, default: '' },
    caption: { type: String, default: '' },
    alt: { type: String, default: '' },
    order: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    durationSec: { type: Number, default: null },
    displayAs: { type: String, default: 'auto' },
    showOnHome: { type: Boolean, default: false },
    showInGallery: { type: Boolean, default: false },
    galleryCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'GalleryCategory', default: null },
  },
  { _id: true }
);

const RoomPano360Schema = new mongoose.Schema(
  {
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaItem', default: null },
    src: { type: String, default: '' },
    previewSrc: { type: String, default: '' },
    caption: { type: String, default: '' },
    alt: { type: String, default: '' },
    is2to1: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: false },
    showInGallery: { type: Boolean, default: false },
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Room slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    roomType: {
      type: String,
      default: '',
      trim: true,
    },
    bedType: {
      type: String,
      default: '',
      trim: true,
    },
    maxOccupancy: {
      type: Number,
      default: null,
    },
    numberOfRooms: {
      type: Number,
      default: null,
    },
    shortDescription: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    features: {
      type: [String],
      default: [],
    },
    facilities: {
      type: [FacilitySchema],
      default: [],
    },
    mainMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaItem',
      default: null,
    },
    mainImage: {
      type: String,
      default: '',
    },
    photos: {
      type: [RoomPhotoSchema],
      default: [],
    },
    videos: {
      type: [RoomVideoSchema],
      default: [],
    },
    pano360: {
      type: RoomPano360Schema,
      default: null,
    },
    media: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MediaItem',
      },
    ],
    featuredOnHome: {
      type: Boolean,
      default: false,
      index: true,
    },
    featuredOrder: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    seoTitle: {
      type: String,
      default: '',
    },
    seoDescription: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

RoomSchema.index({ order: 1, isActive: 1 });

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);

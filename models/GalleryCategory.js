import mongoose from 'mongoose';
import './MediaItem.js';

const GalleryCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    coverMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaItem',
      default: null,
    },
    coverImage: {
      type: String,
      default: '',
    },
    isSpecial: {
      type: Boolean,
      default: false,
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
  },
  {
    timestamps: true,
  }
);

GalleryCategorySchema.index({ order: 1, isActive: 1 });

export default mongoose.models.GalleryCategory || mongoose.model('GalleryCategory', GalleryCategorySchema);

import mongoose from 'mongoose';

/**
 * Server-side / shared persistent rate limit model.
 * Uses MongoDB TTL index to automatically purge records after expiry.
 */
const AdminRateLimitSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 1800, // Expire documents automatically after 30 minutes
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AdminRateLimit ||
  mongoose.model('AdminRateLimit', AdminRateLimitSchema);

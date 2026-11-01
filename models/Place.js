// PLACE / NEARBY AREA SCHEMA (Mongoose model preparation)
// Shape of records for the future MongoDB backend & Admin task

import mongoose from 'mongoose';

const PhotoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, default: '' },
  caption: { type: String, default: '' },
  width: { type: Number },
  height: { type: Number },
  order: { type: Number, default: 0 }
});

const PlaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Place name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    district: {
      type: String,
      default: 'salem',
      lowercase: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      default: 'Attraction',
      trim: true,
      index: true
    },
    // Google Maps link (legacy / optional)
    mapsUrl: {
      type: String,
      default: ''
    },
    lat: {
      type: Number,
      default: 11.5835
    },
    lng: {
      type: Number,
      default: 77.7885
    },
    // Optional distance typed by owner. If empty, client calculates straight-line haversine distance
    distanceKm: {
      type: Number,
      default: null
    },
    // Optional travel time typed by owner (e.g. "45 mins"). If empty, hidden on site
    travelTime: {
      type: String,
      default: ''
    },
    travelMinutes: {
      type: Number,
      default: null
    },
    travelTimeLabel: {
      type: String,
      default: ''
    },
    routeGeometry: {
      type: Object,
      default: null
    },
    routeDistanceKm: {
      type: Number,
      default: null
    },
    routeDurationMin: {
      type: Number,
      default: null
    },
    featuredOnHome: {
      type: Boolean,
      default: false
    },
    landmarkImage: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    photos: [PhotoSchema],
    coordsVerified: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Place || mongoose.model('Place', PlaceSchema);

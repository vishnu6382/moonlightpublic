import mongoose from 'mongoose';
import './MediaItem.js';

const ShowcaseSlotSchema = new mongoose.Schema(
  {
    slotNumber: { type: Number, required: true },
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaItem', default: null },
    src: { type: String, default: '' },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
    isVideoSlot: { type: Boolean, default: false },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
  },
  { _id: false }
);

const HomeContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'home_singleton',
      unique: true,
      required: true,
    },
    logo: {
      url: { type: String, default: '' },
      mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaItem', default: null },
      alt: { type: String, default: 'Moon Light Resort' },
      showText: { type: Boolean, default: true },
    },
    showcase: {
      title: { type: String, default: 'Captured Moments of Serenity' },
      subtitle: { type: String, default: 'Villas, pool and open spaces at Moon Light Resort.' },
      pills: {
        type: [String],
        default: ['Villa rooms', 'Dorms', 'Clean pool', 'Open spaces'],
      },
      portalItem: {
        mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaItem', default: null },
        src: { type: String, default: '' },
        alt: { type: String, default: 'Moon Light Resort Pool and Grounds' },
        title: { type: String, default: 'Moon Light Resort' },
        is360: { type: Boolean, default: false },
      },
      items: {
        type: [ShowcaseSlotSchema],
        default: [],
      },
    },
    intro: {
      eyebrow: { type: String, default: 'NEDUNGULAM • TAMIL NADU' },
      headingLine1: { type: String, default: 'Together Time' },
      headingLine2: { type: String, default: 'In Nedungulam' },
      description: {
        type: String,
        default: 'A peaceful resort nestled in the countryside, welcoming families and groups for reunions, celebrations, and calm escapes.',
      },
      ctaText: { type: String, default: 'Explore Rooms →' },
      ctaHref: { type: String, default: '#rooms' },
      welcomeSubtitle: { type: String, default: 'PEACEFUL NATURE RETREAT' },
      welcomeTitle: { type: String, default: 'WELCOME TO MOON LIGHT' },
    },
    facilities: {
      title: { type: String, default: 'Facilities' },
      subtitle: { type: String, default: 'Comfort-first stay essentials.' },
      badge: { type: String, default: 'Thoughtful Amenities' },
      featuredTitle: { type: String, default: 'All Essentials For A Relaxing Stay' },
      featuredText: {
        type: String,
        default: 'From air conditioning and full power backup to a clean swimming pool and dining space.',
      },
      image: { type: String, default: '' },
      mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaItem', default: null },
      groups: {
        type: [
          {
            id: { type: String },
            name: { type: String },
            items: [
              {
                name: { type: String },
                icon: { type: String, default: 'check' },
                group: { type: String },
              },
            ],
          },
        ],
        default: [],
      },
    },
    stay: {
      label: { type: String, default: 'MOON LIGHT RESORT · NEDUNGULAM' },
      title: { type: String, default: 'Together Time in Nedungulam' },
      heading: { type: String, default: 'Where calm landscapes meet warm hospitality' },
      paragraph: {
        type: String,
        default: 'Surrounded by open nature and tranquil breezes, Moon Light Resort is designed for families and groups who want privacy, comfort, and shared memories without rush.',
      },
      checkInTime: { type: String, default: '13:00' },
      checkOutTime: { type: String, default: '11:00' },
      featurePills: {
        type: [String],
        default: ['Villa rooms', 'Dorms', 'Clean pool', 'Open spaces'],
      },
      stats: [
        {
          label: { type: String, default: '' },
          value: { type: String, default: '' },
          icon: { type: String, default: 'bed' },
          link: { type: String, default: '' },
        },
      ],
      tallPhoto: {
        url: { type: String, default: '' },
        mediaId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MediaItem',
          default: null,
        },
        alt: { type: String, default: 'Moon Light Resort pool and villa grounds' },
      },
      video: {
        src: { type: String, default: '' },
        mediaId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MediaItem',
          default: null,
        },
        title: { type: String, default: 'Watch Resort Video' },
        subtitle: { type: String, default: 'See pool, villas and open spaces' },
        duration: { type: String, default: '0:45' },
        poster: { type: String, default: '' },
      },
      infoTile: {
        image: { type: String, default: '' },
        mediaId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MediaItem',
          default: null,
        },
        badge: { type: String, default: 'Timings' },
        title: { type: String, default: 'Check-in & Check-out' },
        subtitle: { type: String, default: 'Check-in 13:00 · Check-out 11:00' },
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.HomeContent || mongoose.model('HomeContent', HomeContentSchema);

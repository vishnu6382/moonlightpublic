import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global_settings', unique: true },
    resortName: { type: String, default: 'Moon Light Resort' },
    phone: { type: String, default: '+91 98944 86300' },
    phoneRaw: { type: String, default: '919894486300' },
    secondaryPhone: { type: String, default: '+91 90878 44300' },
    secondaryPhoneRaw: { type: String, default: '919087844300' },
    whatsapp: { type: String, default: '+91 98944 86300' },
    whatsappNumber: { type: String, default: '919894486300' },
    whatsappMessage: {
      type: String,
      default: 'Hi, I would like to know about rooms and availability at Moon Light Resort.',
    },
    email: { type: String, default: 'contact@moonlightresortstays.com' },
    instagramUrl: { type: String, default: 'https://www.instagram.com/moonlightresortstays' },
    addressShort: { type: String, default: 'Nedungulam, Salem, Tamil Nadu' },
    addressFull: { type: String, default: 'Nedungulam, Edappadi Taluk, Salem District, Tamil Nadu 637107' },
    googleMapsUrl: { type: String, default: 'https://maps.google.com' },
    checkInTime: { type: String, default: '13:00' },
    checkOutTime: { type: String, default: '11:00' },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);

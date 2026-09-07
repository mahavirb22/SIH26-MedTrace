import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    licenseId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    geoLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
    complianceScore: { type: Number, default: 100, min: 0, max: 100 },
  },
  { timestamps: true }
);

const Store = mongoose.model('Store', storeSchema);
export default Store;

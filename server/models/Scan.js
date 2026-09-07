import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for anonymous scans
    },
    batchId: { type: String, required: true, index: true },
    microCode: { type: String, default: null },
    result: {
      type: String,
      enum: ['verified', 'warning', 'counterfeit'],
      required: true,
    },
    deviceFingerprint: { type: String, default: '' },
    geoLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    verifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// For patient scan history queries
scanSchema.index({ userId: 1, verifiedAt: -1 });

const Scan = mongoose.model('Scan', scanSchema);
export default Scan;

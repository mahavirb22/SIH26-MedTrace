import mongoose from 'mongoose';

const microCodeSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    code: { type: String, required: true },
    isDispensed: { type: Boolean, default: false },
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    product: {
      name: { type: String, required: true },
      dosageForm: { type: String, default: '' },
      strength: { type: String, default: '' },
      manufacturer: { type: String, required: true },
      manufacturerLicense: { type: String, default: '' },
    },
    totalUnits: { type: Number, required: true, min: 1 },
    remainingUnits: { type: Number, required: true, min: 0 },
    mfgDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    hmacSecret: { type: String, required: true },
    microCodes: [microCodeSchema],
    masterQrData: { type: String, default: '' },
    // Track which store currently holds custody
    currentHolder: {
      storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
      storeLicenseId: { type: String, default: null },
      receivedAt: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ['active', 'recalled', 'expired'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Index for fast lookup by micro-code
batchSchema.index({ 'microCodes.code': 1 });

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;

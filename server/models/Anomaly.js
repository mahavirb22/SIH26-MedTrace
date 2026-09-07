import mongoose from 'mongoose';

const anomalySchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, index: true },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'HASH_MISMATCH',
        'DUPLICATE_SCAN',
        'EXPIRED_DISPENSE',
        'VOLUME_SPIKE',
        'GEO_DIVERSION',
      ],
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    detectedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ledgerEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LedgerEntry',
      default: null,
    },
  },
  { timestamps: true }
);

anomalySchema.index({ riskLevel: 1, resolvedAt: 1 });

const Anomaly = mongoose.model('Anomaly', anomalySchema);
export default Anomaly;

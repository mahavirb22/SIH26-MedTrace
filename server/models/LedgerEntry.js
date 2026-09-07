import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, index: true },
    sequenceNumber: { type: Number, required: true },
    previousHash: { type: String, default: null },
    currentHash: { type: String, required: true },
    event: {
      type: String,
      enum: ['MANUFACTURED', 'SHIPPED', 'RECEIVED', 'SOLD', 'VERIFIED', 'FLAGGED'],
      required: true,
    },
    actor: {
      role: { type: String, default: 'system' },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
      name: { type: String, default: '' },
    },
    payload: {
      quantityChanged: { type: Number, default: 0 },
      remainingAfter: { type: Number, default: 0 },
      geoLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
      metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index ensures sequential integrity per batch
ledgerEntrySchema.index({ batchId: 1, sequenceNumber: 1 }, { unique: true });
// Fast queries for event type filtering
ledgerEntrySchema.index({ batchId: 1, event: 1 });

const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);
export default LedgerEntry;

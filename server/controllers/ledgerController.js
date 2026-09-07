import LedgerEntry from '../models/LedgerEntry.js';
import { verifyChainIntegrity } from '../utils/hashChain.js';

/**
 * GET /api/ledger/:batchId
 */
export async function getChain(req, res, next) {
  try {
    const { batchId } = req.params;
    const entries = await LedgerEntry.find({ batchId: batchId.toUpperCase() })
      .sort({ sequenceNumber: 1 })
      .lean();

    res.json({
      batchId: batchId.toUpperCase(),
      chain: entries,
      length: entries.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ledger/:batchId/verify-integrity
 */
export async function verifyIntegrity(req, res, next) {
  try {
    const { batchId } = req.params;
    const result = await verifyChainIntegrity(batchId.toUpperCase());

    res.json({
      batchId: batchId.toUpperCase(),
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

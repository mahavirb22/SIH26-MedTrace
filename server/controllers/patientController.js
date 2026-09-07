import Scan from '../models/Scan.js';
import Batch from '../models/Batch.js';

/**
 * GET /api/patient/history
 * Returns authenticated patient's scan/verification history.
 */
export async function getHistory(req, res, next) {
  try {
    const scans = await Scan.find({ userId: req.userId })
      .sort({ verifiedAt: -1 })
      .limit(50)
      .lean();

    // Enrich with product info
    const enriched = await Promise.all(
      scans.map(async (scan) => {
        const batch = await Batch.findOne({ batchId: scan.batchId })
          .select('batchId product mfgDate expiryDate currentHolder status')
          .lean();
        return {
          ...scan,
          product: batch?.product || null,
          currentHolder: batch?.currentHolder || null,
        };
      })
    );

    res.json({ history: enriched });
  } catch (err) {
    next(err);
  }
}

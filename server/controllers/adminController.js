import LedgerEntry from '../models/LedgerEntry.js';
import Store from '../models/Store.js';
import Anomaly from '../models/Anomaly.js';
import Batch from '../models/Batch.js';
import Scan from '../models/Scan.js';

/**
 * GET /api/admin/overview
 */
export async function getOverview(req, res, next) {
  try {
    const totalLedgerEntries = await LedgerEntry.countDocuments();
    const activeStores = await Store.countDocuments({ isActive: true });
    const unresolvedAnomalies = await Anomaly.countDocuments({ resolvedAt: null });
    const highPriorityAnomalies = await Anomaly.countDocuments({
      resolvedAt: null,
      riskLevel: 'high',
    });

    // Calculate overall compliance rate
    const stores = await Store.find({ isActive: true }).lean();
    const avgCompliance =
      stores.length > 0
        ? stores.reduce((sum, s) => sum + (s.complianceScore || 100), 0) / stores.length
        : 100;

    res.json({
      metrics: {
        totalVerifiedLedgers: totalLedgerEntries,
        activeRegisteredStores: activeStores,
        flaggedDiversions: unresolvedAnomalies,
        highPriorityCount: highPriorityAnomalies,
        chainComplianceRate: avgCompliance.toFixed(1),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/stores
 */
export async function getStores(req, res, next) {
  try {
    const stores = await Store.find({}).sort({ name: 1 }).lean();

    // Enrich with scan counts
    const enriched = await Promise.all(
      stores.map(async (store) => {
        const scanCount = await LedgerEntry.countDocuments({
          'actor.storeId': store._id,
        });
        return { ...store, totalScans: scanCount };
      })
    );

    res.json({ stores: enriched });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/anomalies
 */
export async function getAnomalies(req, res, next) {
  try {
    const { risk, type, resolved } = req.query;
    const filter = {};

    if (risk && ['high', 'medium', 'low'].includes(risk)) {
      filter.riskLevel = risk;
    }
    if (type) {
      filter.type = type.toUpperCase();
    }
    if (resolved === 'true') {
      filter.resolvedAt = { $ne: null };
    } else if (resolved === 'false') {
      filter.resolvedAt = null;
    }

    const anomalies = await Anomaly.find(filter)
      .populate('storeId', 'name licenseId region')
      .sort({ detectedAt: -1 })
      .limit(100)
      .lean();

    res.json({ anomalies });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/anomalies/:id/resolve
 */
export async function resolveAnomaly(req, res, next) {
  try {
    const anomaly = await Anomaly.findById(req.params.id);
    if (!anomaly) {
      return res.status(404).json({ error: 'Anomaly not found.' });
    }

    anomaly.resolvedAt = new Date();
    anomaly.resolvedBy = req.userId;
    await anomaly.save();

    res.json({ message: 'Anomaly resolved.', anomaly });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/audit/:batchId
 */
export async function getAuditTrail(req, res, next) {
  try {
    const { batchId } = req.params;
    const entries = await LedgerEntry.find({ batchId: batchId.toUpperCase() })
      .sort({ sequenceNumber: 1 })
      .lean();

    if (entries.length === 0) {
      return res.status(404).json({ error: `No audit trail found for batch ${batchId}.` });
    }

    const batch = await Batch.findOne({ batchId: batchId.toUpperCase() })
      .select('batchId product totalUnits remainingUnits mfgDate expiryDate status')
      .lean();

    res.json({
      batch,
      auditTrail: entries,
      chainLength: entries.length,
    });
  } catch (err) {
    next(err);
  }
}

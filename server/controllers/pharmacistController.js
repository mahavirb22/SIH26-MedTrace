import Batch from '../models/Batch.js';
import Store from '../models/Store.js';
import LedgerEntry from '../models/LedgerEntry.js';
import User from '../models/User.js';
import { appendToChain } from '../utils/hashChain.js';
import { runAnomalyChecks } from '../utils/anomalyRules.js';

/**
 * GET /api/pharmacist/dashboard
 * Returns summary metrics for the logged-in pharmacist's store.
 */
export async function getDashboard(req, res, next) {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user?.storeId) {
      return res.status(400).json({ error: 'No store associated with this account.' });
    }

    const store = await Store.findById(user.storeId).lean();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's sell events for this store
    const todaySales = await LedgerEntry.find({
      'actor.storeId': user.storeId,
      event: 'SOLD',
      timestamp: { $gte: today },
    }).lean();

    const todayReceived = await LedgerEntry.find({
      'actor.storeId': user.storeId,
      event: 'RECEIVED',
      timestamp: { $gte: today },
    }).lean();

    // Inventory: all batches currently held by this store
    const inventory = await Batch.find({
      'currentHolder.storeId': user.storeId,
      remainingUnits: { $gt: 0 },
    })
      .select('batchId product remainingUnits totalUnits expiryDate status')
      .lean();

    const lowStockCount = inventory.filter((b) => b.remainingUnits < 20).length;

    // Flagged anomalies for this store
    const { default: Anomaly } = await import('../models/Anomaly.js');
    const activeAnomalies = await Anomaly.countDocuments({
      storeId: user.storeId,
      resolvedAt: null,
    });

    res.json({
      store: store ? { name: store.name, licenseId: store.licenseId, region: store.region } : null,
      metrics: {
        todayScans: todaySales.length + todayReceived.length,
        todayDispensed: todaySales.length,
        flaggedAnomalies: activeAnomalies,
        lowStockItems: lowStockCount,
      },
      inventorySummary: inventory.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/pharmacist/receive
 * Receive stock — one-way custody lock validation.
 */
export async function receiveStock(req, res, next) {
  try {
    const { batchId, quantity } = req.body;
    if (!batchId) {
      return res.status(400).json({ error: 'Batch ID is required.' });
    }

    const user = await User.findById(req.userId).lean();
    if (!user?.storeId) {
      return res.status(400).json({ error: 'No store associated with this account.' });
    }

    const batch = await Batch.findOne({ batchId: batchId.toUpperCase() });
    if (!batch) {
      return res.status(404).json({ error: `Batch ${batchId} not found.` });
    }

    // ONE-WAY CUSTODY LOCK: If batch already has a holder (different store), reject
    if (
      batch.currentHolder?.storeId &&
      batch.currentHolder.storeId.toString() !== user.storeId.toString()
    ) {
      return res.status(403).json({
        error: 'One-way custody lock violation. This batch is already held by another store.',
        currentHolder: batch.currentHolder.storeLicenseId,
      });
    }

    // Update batch custody
    const store = await Store.findById(user.storeId).lean();
    batch.currentHolder = {
      storeId: user.storeId,
      storeLicenseId: store?.licenseId || 'UNKNOWN',
      receivedAt: new Date(),
    };
    await batch.save();

    // Append RECEIVED event to ledger
    const entry = await appendToChain({
      batchId: batch.batchId,
      event: 'RECEIVED',
      actor: {
        role: 'pharmacist',
        userId: req.userId,
        storeId: user.storeId,
        name: store?.name || 'Unknown Store',
      },
      payload: {
        quantityChanged: quantity || batch.totalUnits,
        remainingAfter: batch.remainingUnits,
        metadata: { storeLicenseId: store?.licenseId },
      },
    });

    res.json({
      message: `Batch ${batch.batchId} received successfully.`,
      batch: {
        batchId: batch.batchId,
        product: batch.product,
        remainingUnits: batch.remainingUnits,
        totalUnits: batch.totalUnits,
      },
      ledgerEntry: {
        sequenceNumber: entry.sequenceNumber,
        currentHash: entry.currentHash,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/pharmacist/sell
 * Sell/dispense — decrement digital twin, create ledger entry.
 */
export async function sellStock(req, res, next) {
  try {
    const { batchId, quantity } = req.body;
    if (!batchId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Batch ID and quantity (>=1) are required.' });
    }

    const user = await User.findById(req.userId).lean();
    if (!user?.storeId) {
      return res.status(400).json({ error: 'No store associated with this account.' });
    }

    const batch = await Batch.findOne({ batchId: batchId.toUpperCase() });
    if (!batch) {
      return res.status(404).json({ error: `Batch ${batchId} not found.` });
    }

    // Verify this store holds custody
    if (!batch.currentHolder?.storeId || batch.currentHolder.storeId.toString() !== user.storeId.toString()) {
      return res.status(403).json({ error: 'This batch is not in your store\'s custody.' });
    }

    // Check sufficient stock
    if (batch.remainingUnits < quantity) {
      return res.status(400).json({
        error: `Insufficient stock. Available: ${batch.remainingUnits}, Requested: ${quantity}`,
      });
    }

    // Run anomaly checks before allowing the sale
    const anomalies = await runAnomalyChecks({
      batchId: batch.batchId,
      batch,
      storeId: user.storeId,
    });

    // Check for expired dispense (block it)
    const expiredAnomaly = anomalies.find((a) => a.type === 'EXPIRED_DISPENSE');
    if (expiredAnomaly) {
      return res.status(403).json({
        error: 'Cannot dispense expired stock.',
        anomaly: expiredAnomaly,
      });
    }

    // Decrement stock
    batch.remainingUnits -= quantity;

    // Mark micro-codes as dispensed
    let dispensedCodes = [];
    let dispensedCount = 0;
    for (const mc of batch.microCodes) {
      if (!mc.isDispensed && dispensedCount < quantity) {
        mc.isDispensed = true;
        dispensedCodes.push(mc.code);
        dispensedCount++;
      }
    }

    await batch.save();

    // Append SOLD event to ledger
    const store = await Store.findById(user.storeId).lean();
    const entry = await appendToChain({
      batchId: batch.batchId,
      event: 'SOLD',
      actor: {
        role: 'pharmacist',
        userId: req.userId,
        storeId: user.storeId,
        name: store?.name || 'Unknown Store',
      },
      payload: {
        quantityChanged: -quantity,
        remainingAfter: batch.remainingUnits,
        metadata: {
          dispensedMicroCodes: dispensedCodes,
          storeLicenseId: store?.licenseId,
        },
      },
    });

    res.json({
      message: `${quantity} unit(s) of ${batch.product.name} dispensed successfully.`,
      batch: {
        batchId: batch.batchId,
        product: batch.product,
        remainingUnits: batch.remainingUnits,
        totalUnits: batch.totalUnits,
      },
      dispensedMicroCodes: dispensedCodes,
      ledgerEntry: {
        sequenceNumber: entry.sequenceNumber,
        currentHash: entry.currentHash,
      },
      anomalies: anomalies.filter((a) => a.type !== 'EXPIRED_DISPENSE'),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/pharmacist/inventory
 */
export async function getInventory(req, res, next) {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user?.storeId) {
      return res.status(400).json({ error: 'No store associated with this account.' });
    }

    const inventory = await Batch.find({
      'currentHolder.storeId': user.storeId,
    })
      .select('batchId product totalUnits remainingUnits mfgDate expiryDate status currentHolder')
      .sort({ 'currentHolder.receivedAt': -1 })
      .lean();

    res.json({ inventory });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/pharmacist/transactions
 */
export async function getTransactions(req, res, next) {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user?.storeId) {
      return res.status(400).json({ error: 'No store associated with this account.' });
    }

    const transactions = await LedgerEntry.find({
      'actor.storeId': user.storeId,
      event: { $in: ['RECEIVED', 'SOLD'] },
    })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.json({ transactions });
  } catch (err) {
    next(err);
  }
}

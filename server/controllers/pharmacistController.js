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

    const inventory = await Batch.find({
      'currentHolder.storeId': user.storeId,
      remainingUnits: { $gt: 0 },
    })
      .select('batchId product remainingUnits totalUnits expiryDate status microCodes')
      .lean();

    const lowStockCount = inventory.filter((b) => b.remainingUnits < 20).length;

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
 * GET /api/pharmacist/batch/:batchId
 * Fetch full Digital Twin Batch metadata including micro-codes for blister visualization.
 */
export async function getBatchDetails(req, res, next) {
  try {
    const { batchId } = req.params;
    const batch = await Batch.findOne({ batchId: batchId.toUpperCase() }).lean();
    if (!batch) {
      return res.status(404).json({ error: `Batch ${batchId} not found.` });
    }
    res.json({ batch });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/pharmacist/receive
 * Receive stock — Master QR Code scan. One-way custody lock validation.
 */
export async function receiveStock(req, res, next) {
  try {
    const { batchId, quantity } = req.body;
    if (!batchId) {
      return res.status(400).json({ error: 'Master Pack ID is required.' });
    }

    const user = await User.findById(req.userId).lean();
    if (!user?.storeId) {
      return res.status(400).json({ error: 'No store associated with this account.' });
    }

    const batch = await Batch.findOne({ batchId: batchId.toUpperCase() });
    if (!batch) {
      return res.status(404).json({ error: `Master Pack ${batchId} not found in global manufacturer database.` });
    }

    if (
      batch.currentHolder?.storeId &&
      batch.currentHolder.storeId.toString() !== user.storeId.toString()
    ) {
      return res.status(403).json({
        error: 'One-way custody lock violation. This Master Pack is already held by another dispensary.',
        currentHolder: batch.currentHolder.storeLicenseId,
      });
    }

    const store = await Store.findById(user.storeId).lean();
    batch.currentHolder = {
      storeId: user.storeId,
      storeLicenseId: store?.licenseId || 'UNKNOWN',
      receivedAt: new Date(),
    };
    await batch.save();

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
      message: `Master Pack ${batch.batchId} received successfully. Digital Twin initialized.`,
      batch: {
        batchId: batch.batchId,
        product: batch.product,
        remainingUnits: batch.remainingUnits,
        totalUnits: batch.totalUnits,
        microCodes: batch.microCodes,
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
 * Sell/dispense — Digital Twin blister cavity cut validation.
 */
export async function sellStock(req, res, next) {
  try {
    const { batchId, quantity, stripIndex, targetCode } = req.body;
    const qtyToSell = parseInt(quantity, 10) || 1;

    if (!batchId || qtyToSell < 1) {
      return res.status(400).json({ error: 'Master Pack ID and valid quantity (>=1) are required.' });
    }

    const user = await User.findById(req.userId).lean();
    if (!user?.storeId) {
      return res.status(400).json({ error: 'No store associated with this account.' });
    }

    const batch = await Batch.findOne({ batchId: batchId.toUpperCase() });
    if (!batch) {
      return res.status(404).json({ error: `Batch ${batchId} not found.` });
    }

    if (!batch.currentHolder?.storeId || batch.currentHolder.storeId.toString() !== user.storeId.toString()) {
      return res.status(403).json({ error: 'This batch is not in your store\'s custody.' });
    }

    if (batch.remainingUnits < qtyToSell) {
      return res.status(400).json({
        error: `Insufficient stock in pack. Available intact tablets: ${batch.remainingUnits}, Requested: ${qtyToSell}`,
      });
    }

    const anomalies = await runAnomalyChecks({
      batchId: batch.batchId,
      batch,
      storeId: user.storeId,
    });

    const expiredAnomaly = anomalies.find((a) => a.type === 'EXPIRED_DISPENSE');
    if (expiredAnomaly) {
      return res.status(403).json({
        error: 'Cannot dispense expired stock.',
        anomaly: expiredAnomaly,
      });
    }

    // Validation for specific blister strip cuts
    let targetStartIndex = 0;
    let targetEndIndex = batch.microCodes.length - 1;

    if (stripIndex !== undefined && stripIndex !== null && stripIndex >= 0) {
      targetStartIndex = stripIndex * 10;
      targetEndIndex = targetStartIndex + 9;

      const stripMicroCodes = batch.microCodes.filter(
        (mc) => mc.index >= targetStartIndex && mc.index <= targetEndIndex
      );

      const intactOnStrip = stripMicroCodes.filter((mc) => !mc.isDispensed).length;

      if (intactOnStrip < qtyToSell) {
        return res.status(400).json({
          error: `Cannot dispense ${qtyToSell} tablet(s) from Blister Strip #${stripIndex + 1}. Only ${intactOnStrip} intact tablet(s) remain on this strip.`,
          availableOnStrip: intactOnStrip,
          requested: qtyToSell,
        });
      }
    }

    // If targetCode specified (single pill scan), find its index
    if (targetCode) {
      const foundMc = batch.microCodes.find((mc) => mc.code === targetCode.toUpperCase());
      if (foundMc) {
        const foundStrip = Math.floor(foundMc.index / 10);
        targetStartIndex = foundStrip * 10;
        targetEndIndex = targetStartIndex + 9;
      }
    }

    // Mark quantity micro-codes as dispensed sequentially starting from target strip
    let dispensedCodes = [];
    let dispensedCount = 0;

    // First pass: try within target strip range
    for (const mc of batch.microCodes) {
      if (mc.index >= targetStartIndex && mc.index <= targetEndIndex) {
        if (!mc.isDispensed && dispensedCount < qtyToSell) {
          mc.isDispensed = true;
          dispensedCodes.push(mc.code);
          dispensedCount++;
        }
      }
    }

    // Second pass: fallback if needed
    if (dispensedCount < qtyToSell) {
      for (const mc of batch.microCodes) {
        if (!mc.isDispensed && dispensedCount < qtyToSell) {
          mc.isDispensed = true;
          dispensedCodes.push(mc.code);
          dispensedCount++;
        }
      }
    }

    // Decrement stock count
    batch.remainingUnits -= qtyToSell;
    await batch.save();

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
        quantityChanged: -qtyToSell,
        remainingAfter: batch.remainingUnits,
        metadata: {
          dispensedMicroCodes: dispensedCodes,
          storeLicenseId: store?.licenseId,
        },
      },
    });

    res.json({
      message: `${qtyToSell} tablet(s) dispensed successfully from Digital Twin.`,
      batch: {
        batchId: batch.batchId,
        product: batch.product,
        remainingUnits: batch.remainingUnits,
        totalUnits: batch.totalUnits,
        microCodes: batch.microCodes,
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
      .select('batchId product totalUnits remainingUnits mfgDate expiryDate status currentHolder microCodes')
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

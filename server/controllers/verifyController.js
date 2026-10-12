import Batch from '../models/Batch.js';
import Scan from '../models/Scan.js';
import LedgerEntry from '../models/LedgerEntry.js';
import { appendToChain } from '../utils/hashChain.js';
import { runAnomalyChecks } from '../utils/anomalyRules.js';

/**
 * GET /api/verify/:code
 * Public verification — look up by batchId or microCode.
 */
export async function verifyCode(req, res, next) {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ error: 'Verification code is required.' });
    }

    const codeUpper = code.toUpperCase().trim();

    // First try exact batchId match
    let batch = await Batch.findOne({ batchId: codeUpper });

    // If not found, try micro-code lookup
    if (!batch) {
      batch = await Batch.findOne({ 'microCodes.code': codeUpper });
    }

    if (!batch) {
      return res.status(404).json({
        verified: false,
        result: 'counterfeit',
        error: `No batch or micro-code found matching: ${codeUpper}`,
      });
    }

    // Check if batch is expired
    const isExpired = new Date(batch.expiryDate) < new Date();

    // Find the specific micro-code if one was scanned
    let microCodeEntry = null;
    if (batch.batchId !== codeUpper) {
      microCodeEntry = batch.microCodes.find((mc) => mc.code === codeUpper);
    }

    // Get custody chain summary (last 3 events)
    const custodyChain = await LedgerEntry.find({ batchId: batch.batchId })
      .sort({ sequenceNumber: -1 })
      .limit(5)
      .lean();

    const result = isExpired ? 'warning' : 'verified';

    res.json({
      verified: !isExpired,
      result,
      batch: {
        batchId: batch.batchId,
        product: batch.product,
        totalUnits: batch.totalUnits,
        remainingUnits: batch.remainingUnits,
        mfgDate: batch.mfgDate,
        expiryDate: batch.expiryDate,
        status: batch.status,
        isExpired,
        currentHolder: batch.currentHolder,
      },
      microCode: microCodeEntry
        ? { index: microCodeEntry.index, isDispensed: microCodeEntry.isDispensed }
        : null,
      custodyChain: custodyChain.reverse(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/verify
 * Submit a verification event with optional metadata.
 * Creates a scan record and a VERIFIED ledger entry.
 */
export async function submitVerification(req, res, next) {
  try {
    const { code, geoLocation, deviceFingerprint } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Verification code is required.' });
    }

    const codeUpper = code.toUpperCase().trim();
    let batch = await Batch.findOne({ batchId: codeUpper });
    if (!batch) {
      batch = await Batch.findOne({ 'microCodes.code': codeUpper });
    }

    if (!batch) {
      // Record as a failed scan
      await Scan.create({
        userId: req.userId || null,
        batchId: codeUpper,
        microCode: codeUpper,
        result: 'counterfeit',
        deviceFingerprint: deviceFingerprint || '',
        geoLocation: geoLocation || {},
      });

      return res.status(404).json({
        verified: false,
        result: 'counterfeit',
        error: 'Code not found in the system. Possible counterfeit.',
      });
    }

    const isExpired = new Date(batch.expiryDate) < new Date();
    const result = isExpired ? 'warning' : 'verified';

    // Deduplicate: If user logged a scan for this batch within the last 15 seconds, reuse existing scan
    if (req.userId) {
      const fifteenSecsAgo = new Date(Date.now() - 15000);
      const recentScan = await Scan.findOne({
        userId: req.userId,
        batchId: batch.batchId,
        verifiedAt: { $gte: fifteenSecsAgo },
      });

      if (recentScan) {
        return res.json({
          verified: !isExpired,
          result,
          scanId: recentScan._id,
          batch: {
            batchId: batch.batchId,
            product: batch.product,
            mfgDate: batch.mfgDate,
            expiryDate: batch.expiryDate,
            status: batch.status,
            currentHolder: batch.currentHolder,
          },
        });
      }
    }

    // Create scan record
    const scan = await Scan.create({
      userId: req.userId || null,
      batchId: batch.batchId,
      microCode: codeUpper !== batch.batchId ? codeUpper : null,
      result,
      deviceFingerprint: deviceFingerprint || '',
      geoLocation: geoLocation || {},
    });

    // Append VERIFIED event to ledger
    await appendToChain({
      batchId: batch.batchId,
      event: 'VERIFIED',
      actor: {
        role: req.userRole || 'anonymous',
        userId: req.userId || null,
        name: 'Patient Verification',
      },
      payload: {
        quantityChanged: 0,
        remainingAfter: batch.remainingUnits,
        geoLocation: geoLocation || {},
        metadata: { scanId: scan._id, deviceFingerprint },
      },
    });

    // Run anomaly checks
    await runAnomalyChecks({
      batchId: batch.batchId,
      batch,
      storeId: batch.currentHolder?.storeId,
      geoLocation,
    });

    res.json({
      verified: !isExpired,
      result,
      scanId: scan._id,
      batch: {
        batchId: batch.batchId,
        product: batch.product,
        mfgDate: batch.mfgDate,
        expiryDate: batch.expiryDate,
        status: batch.status,
        currentHolder: batch.currentHolder,
      },
    });
  } catch (err) {
    next(err);
  }
}

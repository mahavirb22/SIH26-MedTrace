import Batch from '../models/Batch.js';
import { appendToChain } from '../utils/hashChain.js';
import {
  generateBatchSecret,
  generateBatchMicroCodes,
  generateMasterQrPayload,
} from '../utils/hmacMicroCode.js';

/**
 * POST /api/manufacturer/batch
 * Create a new pharmaceutical batch with HMAC micro-codes.
 */
export async function createBatch(req, res, next) {
  try {
    const { batchId, product, totalUnits, mfgDate, expiryDate } = req.body;

    if (!batchId || !product?.name || !product?.manufacturer || !totalUnits || !mfgDate || !expiryDate) {
      return res.status(400).json({
        error: 'Required: batchId, product.name, product.manufacturer, totalUnits, mfgDate, expiryDate',
      });
    }

    // Generate HMAC secret and micro-codes for this batch
    const hmacSecret = generateBatchSecret();
    const microCodes = generateBatchMicroCodes(hmacSecret, batchId.toUpperCase(), totalUnits);
    const masterQrData = generateMasterQrPayload(
      batchId.toUpperCase(),
      product.name,
      product.manufacturer,
      new Date(expiryDate)
    );

    const batch = await Batch.create({
      batchId: batchId.toUpperCase(),
      product,
      totalUnits,
      remainingUnits: totalUnits,
      mfgDate: new Date(mfgDate),
      expiryDate: new Date(expiryDate),
      hmacSecret,
      microCodes,
      masterQrData,
      status: 'active',
    });

    // Create genesis ledger entry
    await appendToChain({
      batchId: batch.batchId,
      event: 'MANUFACTURED',
      actor: {
        role: 'manufacturer',
        userId: req.userId,
        name: product.manufacturer,
      },
      payload: {
        quantityChanged: totalUnits,
        remainingAfter: totalUnits,
        metadata: {
          productName: product.name,
          dosageForm: product.dosageForm,
          strength: product.strength,
        },
      },
    });

    res.status(201).json({
      message: 'Batch created successfully.',
      batch: {
        batchId: batch.batchId,
        product: batch.product,
        totalUnits: batch.totalUnits,
        mfgDate: batch.mfgDate,
        expiryDate: batch.expiryDate,
        masterQrData: batch.masterQrData,
        microCodesCount: microCodes.length,
        // Return first 5 micro-codes as sample
        sampleMicroCodes: microCodes.slice(0, 5).map((mc) => mc.code),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/manufacturer/batches
 */
export async function listBatches(req, res, next) {
  try {
    const batches = await Batch.find({})
      .select('-hmacSecret -microCodes')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ batches });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/manufacturer/batch/:batchId
 */
export async function getBatch(req, res, next) {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId.toUpperCase() })
      .select('-hmacSecret')
      .lean();

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    res.json({ batch });
  } catch (err) {
    next(err);
  }
}

import Scan from '../models/Scan.js';
import Batch from '../models/Batch.js';
import Store from '../models/Store.js';

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

/**
 * GET /api/patient/search-stores
 * Search nearby registered pharmacies for medicine stock, prices, and location.
 */
export async function searchStores(req, res, next) {
  try {
    const { medicine } = req.query;
    const stores = await Store.find({ isActive: true }).lean();

    // Standardized prices per medicine name
    const priceMap = {
      amoxicillin: 120,
      lipitor: 240,
      paracetamol: 45,
      crestor: 180,
      azithromycin: 160,
    };

    const medicineQuery = (medicine || '').toLowerCase().trim();

    // Calculate prices and inventory for each store
    const results = await Promise.all(
      stores.map(async (store, idx) => {
        let matchingBatches = [];
        if (medicineQuery) {
          matchingBatches = await Batch.find({
            'currentHolder.storeId': store._id,
            'product.name': { $regex: medicineQuery, $options: 'i' },
            remainingUnits: { $gt: 0 },
          }).lean();
        } else {
          matchingBatches = await Batch.find({
            'currentHolder.storeId': store._id,
            remainingUnits: { $gt: 0 },
          }).lean();
        }

        let itemPrice = 120;
        if (medicineQuery) {
          for (const key of Object.keys(priceMap)) {
            if (medicineQuery.includes(key)) {
              itemPrice = priceMap[key];
              break;
            }
          }
        }

        const totalStock = matchingBatches.reduce((acc, b) => acc + (b.remainingUnits || 0), 0);
        const demoDistances = ['0.8 km', '1.4 km', '2.1 km', '3.5 km'];

        return {
          _id: store._id,
          name: store.name,
          licenseId: store.licenseId,
          region: store.region,
          address: store.address || 'Central Healthcare Street',
          geoLocation: store.geoLocation || { lat: 19.076, lng: 72.8777 },
          distance: demoDistances[idx % demoDistances.length],
          price: itemPrice,
          inStock: totalStock > 0 || !medicineQuery,
          availableUnits: totalStock || (medicineQuery ? 0 : 150),
          medicineName: medicineQuery ? medicine : 'General Inventory',
        };
      })
    );

    res.json({ stores: results });
  } catch (err) {
    next(err);
  }
}

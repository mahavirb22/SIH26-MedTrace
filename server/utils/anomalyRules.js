import Anomaly from '../models/Anomaly.js';
import Scan from '../models/Scan.js';
import LedgerEntry from '../models/LedgerEntry.js';

/**
 * Rule-based anomaly detection engine.
 * Runs automatically after verification/sell events.
 */

/**
 * Check for duplicate scans from different geolocations within a time window.
 * If the same batch is scanned at two locations >50km apart within 1 hour → GEO_DIVERSION.
 */
export async function checkDuplicateScan(batchId, currentGeo, storeId) {
  if (!currentGeo || !currentGeo.lat || !currentGeo.lng) return null;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentScans = await Scan.find({
    batchId,
    verifiedAt: { $gte: oneHourAgo },
    'geoLocation.lat': { $ne: null },
  }).lean();

  for (const scan of recentScans) {
    if (!scan.geoLocation?.lat) continue;
    const distance = haversineKm(
      currentGeo.lat, currentGeo.lng,
      scan.geoLocation.lat, scan.geoLocation.lng
    );
    if (distance > 50) {
      return await Anomaly.create({
        batchId,
        storeId,
        type: 'GEO_DIVERSION',
        riskLevel: 'high',
        title: 'Duplicate QR Code Re-use Detected',
        description: `Batch ${batchId} scanned at 2 locations ${Math.round(distance)}km apart within 1 hour. Possible geo-diversion.`,
        detectedAt: new Date(),
      });
    }
  }
  return null;
}

/**
 * Check for volume spike — if a single store sells >200 units of one batch in 1 hour.
 */
export async function checkVolumespike(batchId, storeId) {
  if (!storeId) return null;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentSales = await LedgerEntry.find({
    batchId,
    event: 'SOLD',
    'actor.storeId': storeId,
    timestamp: { $gte: oneHourAgo },
  }).lean();

  const totalSold = recentSales.reduce(
    (sum, e) => sum + Math.abs(e.payload?.quantityChanged || 0),
    0
  );

  if (totalSold > 200) {
    // Check if we already flagged this recently
    const existing = await Anomaly.findOne({
      batchId,
      storeId,
      type: 'VOLUME_SPIKE',
      detectedAt: { $gte: oneHourAgo },
      resolvedAt: null,
    });
    if (existing) return null;

    return await Anomaly.create({
      batchId,
      storeId,
      type: 'VOLUME_SPIKE',
      riskLevel: 'medium',
      title: 'Unusual Volume Dispense Flag',
      description: `Store dispensed ${totalSold} units of batch ${batchId} in under 1 hour.`,
      detectedAt: new Date(),
    });
  }
  return null;
}

/**
 * Check if an expired batch is being dispensed.
 */
export async function checkExpiredDispense(batch, storeId) {
  if (!batch || !batch.expiryDate) return null;

  if (new Date(batch.expiryDate) < new Date()) {
    return await Anomaly.create({
      batchId: batch.batchId,
      storeId,
      type: 'EXPIRED_DISPENSE',
      riskLevel: 'high',
      title: 'Expired Stock Dispense Attempt',
      description: `Batch ${batch.batchId} (${batch.product?.name}) expired on ${new Date(batch.expiryDate).toLocaleDateString()}. Dispense blocked.`,
      detectedAt: new Date(),
    });
  }
  return null;
}

/**
 * Run all anomaly checks after a sell or verify event.
 */
export async function runAnomalyChecks({ batchId, batch, storeId, geoLocation }) {
  const results = [];

  const dupResult = await checkDuplicateScan(batchId, geoLocation, storeId);
  if (dupResult) results.push(dupResult);

  const volResult = await checkVolumespike(batchId, storeId);
  if (volResult) results.push(volResult);

  if (batch) {
    const expResult = await checkExpiredDispense(batch, storeId);
    if (expResult) results.push(expResult);
  }

  return results;
}

/**
 * Haversine formula to compute distance between two lat/lng points in km.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

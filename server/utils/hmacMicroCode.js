import crypto from 'crypto';

/**
 * Generate an HMAC-based micro-code for a single tablet/unit.
 *
 * The code is derived from:
 *   HMAC-SHA256(secret, batchId + "|" + unitIndex)
 * Then truncated to `length` hex characters for human-readability.
 *
 * @param {string} secret - The batch's HMAC secret key
 * @param {string} batchId - The batch identifier
 * @param {number} unitIndex - The tablet/unit index (0-based)
 * @param {number} [length=8] - Desired code length (hex chars)
 * @returns {string} The micro-code (uppercase hex)
 */
export function generateMicroCode(secret, batchId, unitIndex, length = 8) {
  const message = `${batchId}|${unitIndex}`;
  const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex');
  return hmac.substring(0, length).toUpperCase();
}

/**
 * Verify a micro-code against a batch's HMAC secret.
 *
 * @param {string} secret - The batch's HMAC secret key
 * @param {string} batchId
 * @param {number} unitIndex
 * @param {string} code - The micro-code to verify
 * @param {number} [length=8]
 * @returns {boolean}
 */
export function verifyMicroCode(secret, batchId, unitIndex, code, length = 8) {
  const expected = generateMicroCode(secret, batchId, unitIndex, length);
  return expected === code.toUpperCase();
}

/**
 * Generate all micro-codes for an entire batch.
 *
 * @param {string} secret - The batch's HMAC secret key
 * @param {string} batchId
 * @param {number} totalUnits - Number of tablets/units in the batch
 * @param {number} [codeLength=8]
 * @returns {Array<{ index: number, code: string, isDispensed: boolean }>}
 */
export function generateBatchMicroCodes(secret, batchId, totalUnits, codeLength = 8) {
  const codes = [];
  for (let i = 0; i < totalUnits; i++) {
    codes.push({
      index: i,
      code: generateMicroCode(secret, batchId, i, codeLength),
      isDispensed: false,
    });
  }
  return codes;
}

/**
 * Generate a random HMAC secret key for a new batch.
 * @returns {string} 32-byte hex string
 */
export function generateBatchSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate the master QR data payload for a pack-level QR code.
 * This encodes enough data for the patient to verify the pack.
 *
 * @param {string} batchId
 * @param {string} productName
 * @param {string} manufacturer
 * @param {Date} expiryDate
 * @returns {string} JSON string to encode into QR
 */
export function generateMasterQrPayload(batchId, productName, manufacturer, expiryDate) {
  const payload = {
    v: 1, // version
    b: batchId,
    p: productName,
    m: manufacturer,
    e: expiryDate instanceof Date ? expiryDate.toISOString().split('T')[0] : expiryDate,
    t: Date.now(),
  };
  return JSON.stringify(payload);
}

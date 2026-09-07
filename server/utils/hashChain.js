import crypto from 'crypto';
import LedgerEntry from '../models/LedgerEntry.js';

/**
 * Generate a SHA-256 hash of the given data string.
 */
export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Compute the hash for a ledger entry.
 * Hash = SHA-256(previousHash + event + batchId + sequenceNumber + JSON(payload) + timestamp)
 */
export function computeEntryHash(entry) {
  const data = [
    entry.previousHash || 'GENESIS',
    entry.event,
    entry.batchId,
    String(entry.sequenceNumber),
    JSON.stringify(entry.payload || {}),
    entry.timestamp instanceof Date ? entry.timestamp.toISOString() : String(entry.timestamp),
  ].join('|');
  return sha256(data);
}

/**
 * Append a new entry to the hash-chain for a given batch.
 *
 * @param {Object} params
 * @param {string} params.batchId
 * @param {string} params.event - MANUFACTURED | SHIPPED | RECEIVED | SOLD | VERIFIED | FLAGGED
 * @param {Object} params.actor - { role, userId, storeId, name }
 * @param {Object} params.payload - { quantityChanged, remainingAfter, geoLocation, metadata }
 * @returns {Promise<LedgerEntry>}
 */
export async function appendToChain({ batchId, event, actor, payload }) {
  // Find the last entry in this batch's chain
  const lastEntry = await LedgerEntry.findOne({ batchId })
    .sort({ sequenceNumber: -1 })
    .lean();

  const sequenceNumber = lastEntry ? lastEntry.sequenceNumber + 1 : 0;
  const previousHash = lastEntry ? lastEntry.currentHash : null;
  const timestamp = new Date();

  const entryData = {
    batchId,
    sequenceNumber,
    previousHash,
    event,
    actor: actor || {},
    payload: payload || {},
    timestamp,
  };

  const currentHash = computeEntryHash(entryData);

  const entry = await LedgerEntry.create({
    ...entryData,
    currentHash,
  });

  return entry;
}

/**
 * Verify the integrity of the entire hash-chain for a batch.
 * Re-computes every hash and checks linkage.
 *
 * @param {string} batchId
 * @returns {Promise<{ valid: boolean, entries: number, brokenAt: number|null }>}
 */
export async function verifyChainIntegrity(batchId) {
  const entries = await LedgerEntry.find({ batchId })
    .sort({ sequenceNumber: 1 })
    .lean();

  if (entries.length === 0) {
    return { valid: true, entries: 0, brokenAt: null };
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Check sequence continuity
    if (entry.sequenceNumber !== i) {
      return { valid: false, entries: entries.length, brokenAt: i };
    }

    // Check previous hash linkage
    if (i === 0) {
      if (entry.previousHash !== null) {
        return { valid: false, entries: entries.length, brokenAt: 0 };
      }
    } else {
      if (entry.previousHash !== entries[i - 1].currentHash) {
        return { valid: false, entries: entries.length, brokenAt: i };
      }
    }

    // Re-compute hash and compare
    const recomputed = computeEntryHash(entry);
    if (recomputed !== entry.currentHash) {
      return { valid: false, entries: entries.length, brokenAt: i };
    }
  }

  return { valid: true, entries: entries.length, brokenAt: null };
}

/**
 * MedTrace Database Seeder
 * Populates the database with demo data for hackathon demonstration.
 *
 * Usage: cd server && npm run seed
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Store from '../models/Store.js';
import Batch from '../models/Batch.js';
import LedgerEntry from '../models/LedgerEntry.js';
import Anomaly from '../models/Anomaly.js';
import Scan from '../models/Scan.js';
import {
  generateBatchSecret,
  generateBatchMicroCodes,
  generateMasterQrPayload,
} from '../utils/hmacMicroCode.js';
import { appendToChain } from '../utils/hashChain.js';

async function seed() {
  console.log('🌱 Starting MedTrace database seed...\n');

  await connectDB();

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Store.deleteMany({}),
    Batch.deleteMany({}),
    LedgerEntry.deleteMany({}),
    Anomaly.deleteMany({}),
    Scan.deleteMany({}),
  ]);

  // ── 1. Create Stores ─────────────────────────────────────────
  console.log('🏪 Creating stores...');
  const stores = await Store.insertMany([
    {
      licenseId: 'PHARM-8492',
      name: 'MediCare Central Pharmacy',
      region: 'Downtown District',
      address: '123 Health Street, Mumbai',
      geoLocation: { lat: 19.076, lng: 72.8777 },
      isActive: true,
      complianceScore: 99.8,
    },
    {
      licenseId: 'PHARM-3310',
      name: 'Apollo Health Dispensary',
      region: 'North District',
      address: '456 Wellness Road, Delhi',
      geoLocation: { lat: 28.6139, lng: 77.209 },
      isActive: true,
      complianceScore: 99.2,
    },
    {
      licenseId: 'PHARM-1102',
      name: 'Wellness Care Chemist',
      region: 'East District',
      address: '789 Care Lane, Kolkata',
      geoLocation: { lat: 22.5726, lng: 88.3639 },
      isActive: true,
      complianceScore: 94.5,
    },
    {
      licenseId: 'PHARM-9941',
      name: 'City Center Pharmacy',
      region: 'West District',
      address: '321 Medicine Blvd, Ahmedabad',
      geoLocation: { lat: 23.0225, lng: 72.5714 },
      isActive: true,
      complianceScore: 100,
    },
  ]);
  console.log(`   ✅ Created ${stores.length} stores`);

  // ── 2. Create Users ───────────────────────────────────────────
  console.log('👤 Creating users...');
  const passwordHash = await bcrypt.hash('demo1234', 12);

  const users = await User.insertMany([
    {
      role: 'admin',
      email: 'admin@medtrace.in',
      passwordHash,
      name: 'Inspector Director',
      phone: '+91-9876543210',
    },
    {
      role: 'manufacturer',
      email: 'mfg@biohealth.com',
      passwordHash,
      name: 'BioHealth Labs Ltd.',
      manufacturerId: 'MFG-BIOHEALTH-001',
    },
    {
      role: 'pharmacist',
      email: 'pharmacist@medicare.com',
      passwordHash,
      name: 'Dr. Sarah Jenkins',
      phone: '+91-9876543211',
      storeId: stores[0]._id,
    },
    {
      role: 'pharmacist',
      email: 'pharmacist@apollo.com',
      passwordHash,
      name: 'Dr. Rahul Sharma',
      phone: '+91-9876543212',
      storeId: stores[1]._id,
    },
    {
      role: 'patient',
      email: 'patient@demo.com',
      passwordHash,
      name: 'Aisha Patel',
      phone: '+91-9876543213',
    },
  ]);
  console.log(`   ✅ Created ${users.length} users`);

  const manufacturer = users.find((u) => u.role === 'manufacturer');
  const pharmacist1 = users.find((u) => u.email === 'pharmacist@medicare.com');
  const patient = users.find((u) => u.role === 'patient');

  // ── 3. Create Batches ─────────────────────────────────────────
  console.log('💊 Creating pharmaceutical batches...');

  const batchConfigs = [
    {
      batchId: 'BH-992-QX',
      product: {
        name: 'Amoxicillin 500mg',
        dosageForm: 'Oral Capsules',
        strength: '500mg',
        manufacturer: 'BioHealth Labs Ltd.',
        manufacturerLicense: 'MFG-BIOHEALTH-001',
      },
      totalUnits: 200,
      mfgDate: new Date('2024-01-12'),
      expiryDate: new Date('2025-12-31'),
    },
    {
      batchId: 'LP-334-MX',
      product: {
        name: 'Lipitor (Atorvastatin) 20mg',
        dosageForm: 'Film-Coated Tablets',
        strength: '20mg',
        manufacturer: 'BioHealth Labs Ltd.',
        manufacturerLicense: 'MFG-BIOHEALTH-001',
      },
      totalUnits: 150,
      mfgDate: new Date('2024-03-05'),
      expiryDate: new Date('2026-08-31'),
    },
    {
      batchId: 'CR-882-FL',
      product: {
        name: 'Crestor (Rosuvastatin) 10mg',
        dosageForm: 'Film-Coated Tablets',
        strength: '10mg',
        manufacturer: 'BioHealth Labs Ltd.',
        manufacturerLicense: 'MFG-BIOHEALTH-001',
      },
      totalUnits: 100,
      mfgDate: new Date('2023-09-15'),
      expiryDate: new Date('2025-10-31'),
    },
    {
      batchId: 'PB-104-ZT',
      product: {
        name: 'Paracetamol 650mg',
        dosageForm: 'Tablets',
        strength: '650mg',
        manufacturer: 'BioHealth Labs Ltd.',
        manufacturerLicense: 'MFG-BIOHEALTH-001',
      },
      totalUnits: 500,
      mfgDate: new Date('2024-06-01'),
      expiryDate: new Date('2027-03-31'),
    },
    {
      batchId: 'AZ-500-KL',
      product: {
        name: 'Azithromycin 500mg',
        dosageForm: 'Tablets',
        strength: '500mg',
        manufacturer: 'BioHealth Labs Ltd.',
        manufacturerLicense: 'MFG-BIOHEALTH-001',
      },
      totalUnits: 120,
      mfgDate: new Date('2023-11-20'),
      expiryDate: new Date('2025-05-31'),
    },
  ];

  const createdBatches = [];

  for (const cfg of batchConfigs) {
    const hmacSecret = generateBatchSecret();
    const microCodes = generateBatchMicroCodes(hmacSecret, cfg.batchId, cfg.totalUnits);
    const masterQrData = generateMasterQrPayload(
      cfg.batchId,
      cfg.product.name,
      cfg.product.manufacturer,
      cfg.expiryDate
    );

    const batch = await Batch.create({
      ...cfg,
      remainingUnits: cfg.totalUnits,
      hmacSecret,
      microCodes,
      masterQrData,
      status: 'active',
    });

    createdBatches.push(batch);
  }
  console.log(`   ✅ Created ${createdBatches.length} batches with HMAC micro-codes`);

  // ── 4. Create Custody Chain (Ledger Entries) ──────────────────
  console.log('🔗 Building custody hash-chains...');

  // Full chain for BH-992-QX: Manufactured → Shipped → Received → Sold → Verified
  const mainBatch = createdBatches[0]; // BH-992-QX

  // Genesis: Manufactured
  await appendToChain({
    batchId: mainBatch.batchId,
    event: 'MANUFACTURED',
    actor: {
      role: 'manufacturer',
      userId: manufacturer._id,
      name: 'BioHealth Labs Ltd. (Plant #9)',
    },
    payload: {
      quantityChanged: mainBatch.totalUnits,
      remainingAfter: mainBatch.totalUnits,
      metadata: { plantId: 'Plant #9', chemicalAnalysis: 'Passed', purity: '99.8%' },
    },
  });

  // Shipped to wholesaler
  await appendToChain({
    batchId: mainBatch.batchId,
    event: 'SHIPPED',
    actor: {
      role: 'manufacturer',
      userId: manufacturer._id,
      name: 'Apex Pharma Logistics Hub',
    },
    payload: {
      quantityChanged: 0,
      remainingAfter: mainBatch.totalUnits,
      metadata: { carrier: 'Apex Pharma Logistics', tamperSeals: 'Intact', coldChain: true },
    },
  });

  // Received at pharmacy
  mainBatch.currentHolder = {
    storeId: stores[0]._id,
    storeLicenseId: stores[0].licenseId,
    receivedAt: new Date('2024-01-24'),
  };
  mainBatch.remainingUnits = 142; // some sold
  await mainBatch.save();

  await appendToChain({
    batchId: mainBatch.batchId,
    event: 'RECEIVED',
    actor: {
      role: 'pharmacist',
      userId: pharmacist1._id,
      storeId: stores[0]._id,
      name: stores[0].name,
    },
    payload: {
      quantityChanged: mainBatch.totalUnits,
      remainingAfter: mainBatch.totalUnits,
      metadata: { storeLicenseId: stores[0].licenseId },
    },
  });

  // Some sales
  await appendToChain({
    batchId: mainBatch.batchId,
    event: 'SOLD',
    actor: {
      role: 'pharmacist',
      userId: pharmacist1._id,
      storeId: stores[0]._id,
      name: stores[0].name,
    },
    payload: {
      quantityChanged: -58,
      remainingAfter: 142,
      metadata: { storeLicenseId: stores[0].licenseId },
    },
  });

  // Patient verification
  await appendToChain({
    batchId: mainBatch.batchId,
    event: 'VERIFIED',
    actor: {
      role: 'patient',
      userId: patient._id,
      name: 'Patient Verification',
    },
    payload: {
      quantityChanged: 0,
      remainingAfter: 142,
      geoLocation: { lat: 19.076, lng: 72.8777 },
    },
  });

  // Create chains for other batches (genesis + received)
  for (let i = 1; i < createdBatches.length; i++) {
    const batch = createdBatches[i];

    await appendToChain({
      batchId: batch.batchId,
      event: 'MANUFACTURED',
      actor: {
        role: 'manufacturer',
        userId: manufacturer._id,
        name: 'BioHealth Labs Ltd.',
      },
      payload: {
        quantityChanged: batch.totalUnits,
        remainingAfter: batch.totalUnits,
      },
    });

    // Assign to stores
    const storeIndex = i % stores.length;
    batch.currentHolder = {
      storeId: stores[storeIndex]._id,
      storeLicenseId: stores[storeIndex].licenseId,
      receivedAt: new Date(),
    };
    await batch.save();

    await appendToChain({
      batchId: batch.batchId,
      event: 'RECEIVED',
      actor: {
        role: 'pharmacist',
        storeId: stores[storeIndex]._id,
        name: stores[storeIndex].name,
      },
      payload: {
        quantityChanged: batch.totalUnits,
        remainingAfter: batch.totalUnits,
      },
    });
  }

  console.log('   ✅ Custody chains created for all batches');

  // ── 5. Create Sample Anomalies ────────────────────────────────
  console.log('⚠️  Creating sample anomalies...');
  await Anomaly.insertMany([
    {
      batchId: 'CR-882-FL',
      storeId: stores[2]._id,
      type: 'HASH_MISMATCH',
      riskLevel: 'high',
      title: 'Counterfeit Matrix Checksum Mismatch',
      description:
        'Dispensary scan generated invalid cryptographic signature for Crestor 10mg.',
      detectedAt: new Date(Date.now() - 12 * 60 * 1000),
    },
    {
      batchId: 'AZ-500-KL',
      storeId: stores[1]._id,
      type: 'EXPIRED_DISPENSE',
      riskLevel: 'medium',
      title: 'Expired Stock Dispense Attempt',
      description: 'Attempted sale of Azithromycin batch expired in 05/2025.',
      detectedAt: new Date(Date.now() - 60 * 60 * 1000),
    },
    {
      batchId: 'PB-991-XX',
      storeId: stores[3]._id,
      type: 'DUPLICATE_SCAN',
      riskLevel: 'high',
      title: 'Duplicate QR Code Re-use Detected',
      description:
        'Serial number scanned at 2 distinct locations simultaneously (Geo-diversion).',
      detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ]);
  console.log('   ✅ Created 3 sample anomalies');

  // ── 6. Create Sample Scans (Patient History) ──────────────────
  console.log('📱 Creating sample patient scan history...');
  await Scan.insertMany([
    {
      userId: patient._id,
      batchId: 'BH-992-QX',
      result: 'verified',
      verifiedAt: new Date(),
      geoLocation: { lat: 19.076, lng: 72.8777 },
    },
    {
      userId: patient._id,
      batchId: 'LP-334-MX',
      result: 'verified',
      verifiedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      geoLocation: { lat: 19.076, lng: 72.8777 },
    },
    {
      userId: patient._id,
      batchId: 'CR-882-FL',
      result: 'warning',
      verifiedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    },
    {
      userId: patient._id,
      batchId: 'PB-104-ZT',
      result: 'verified',
      verifiedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    },
  ]);
  console.log('   ✅ Created 4 sample scans');

  // ── Summary ───────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════╗
║         🌱 Seed Complete!                    ║
╠══════════════════════════════════════════════╣
║  Stores:      ${String(stores.length).padEnd(31)}║
║  Users:       ${String(users.length).padEnd(31)}║
║  Batches:     ${String(createdBatches.length).padEnd(31)}║
║  Anomalies:   3                              ║
║  Scans:       4                              ║
╠══════════════════════════════════════════════╣
║  Demo Login Credentials:                     ║
║  ─────────────────────────────────────────── ║
║  Admin:       admin@medtrace.in / demo1234   ║
║  Manufacturer: mfg@biohealth.com / demo1234  ║
║  Pharmacist:  pharmacist@medicare.com        ║
║              / demo1234                      ║
║  Patient:    patient@demo.com / demo1234     ║
╚══════════════════════════════════════════════╝
  `);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

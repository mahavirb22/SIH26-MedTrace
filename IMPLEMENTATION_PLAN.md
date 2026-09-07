# IMPLEMENTATION_PLAN.md — MedTrace Backend & Integration

> **Last updated:** 2026-09-06  
> **Prerequisite:** Read [PROJECT_CONTEXT.md](file:///d:/DEV/SIH26/PROJECT_CONTEXT.md) first.

---

## 1. Goal

Build the backend services, database, and hash-chain ledger for MedTrace, then wire the existing React frontend to real APIs. Remove pages that don't match the spec. By the end, the hackathon prototype should demo the full process flow end-to-end:

```
Manufacturer generates pack + per-tablet micro-codes
    → Store scans pack to receive (one-way custody lock)
    → Sale: staff picks quantity, digital twin decrements
    → User scans QR or enters micro-code to verify
    → Verified genuine — full custody history displayed
    → Duplicate scan → flagged as diversion; AI anomaly check runs
```

---

## 2. Open Questions (Require Your Input)

> [!IMPORTANT]
> These decisions affect the database schema and API design. Please answer before I start coding.

### Q1: Patient Accounts
The spec says "dispensed to is anonymised by default." Should patients:
- **(A)** Have optional accounts (sign up to persist scan history across devices, but verification works without login)?
- **(B)** Be fully anonymous (scan history is device-local only, no server-side patient records)?
- **(C)** Require accounts (mandatory sign-up)?

**Recommendation:** Option A — optional accounts. Verification is public; scan history needs auth.

### Q2: Hash-Chain Implementation
The spec says "immutable custody ledger" and "hash-chain." Should this be:
- **(A)** A simple append-only linked-hash structure in MongoDB (each record stores the SHA-256 hash of the previous record, forming a verifiable chain)?
- **(B)** A full blockchain implementation (peer nodes, consensus, etc.)?

**Recommendation:** Option A — MongoDB-based hash-chain. Simpler, sufficient for hackathon, still provably immutable.

### Q3: Manufacturer Portal Scope
Should we build:
- **(A)** A full manufacturer dashboard (CRUD for batches, micro-code generation UI, analytics)?
- **(B)** A minimal seed/CLI tool that populates the database with sample batches + micro-codes for demo purposes, with a bare-bones UI?
- **(C)** No manufacturer UI at all — just seed scripts + backend API endpoints?

**Recommendation:** Option B — minimal UI for demo + seed script.

### Q4: AI Chatbot Backend
For the multilingual medication assistant, should we use:
- **(A)** Google Gemini API (fast to integrate, multilingual out-of-the-box)?
- **(B)** Local TensorFlow model (matches spec's TensorFlow mention, but training takes time)?
- **(C)** A simple rule-based system with drug info from a local database (fastest, no external dependency)?

**Recommendation:** Option A for hackathon — Gemini API with a system prompt grounding it in the drug's metadata.

### Q5: AI Anomaly Detection
For proactive diversion detection, should we:
- **(A)** Use a real ML model (TensorFlow) trained on synthetic sell-through data?
- **(B)** Use rule-based heuristics (e.g., flag if >X units sold in Y hours, flag duplicate scans from different geolocations)?
- **(C)** Start with heuristics, with the ML pipeline scaffolded but using mock predictions?

**Recommendation:** Option C — heuristics now, ML scaffolding for the pitch.

### Q6: Nearby Medicine Search
The spec lists "Nearby Medicine Search" as a feature. Should we:
- **(A)** Implement with Leaflet + store geolocation data?
- **(B)** Defer to post-hackathon?

**Recommendation:** Option B — defer. Focus on core custody chain first.

---

## 3. Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  Patient PWA │ Pharmacist Dashboard │ Admin Dashboard        │
│              │ (Manufacturer — minimal)                      │
└───────┬──────┴──────────┬───────────┴────────────────────────┘
        │ REST API        │ REST API
        ▼                 ▼
┌───────────────────────────────────────────────┐
│           Node.js + Express API Server        │
│                 (Port 3001)                    │
│                                               │
│  /api/auth/*       → JWT auth                 │
│  /api/verify/*     → public verification      │
│  /api/manufacturer/* → batch + micro-code gen  │
│  /api/pharmacist/* → receive / sell / inventory│
│  /api/admin/*      → anomalies, stores, audit │
│  /api/ledger/*     → hash-chain queries       │
│  /api/chat/*       → AI assistant proxy       │
└───────┬───────────────┬───────────────────────┘
        │               │
        ▼               ▼
┌──────────────┐ ┌─────────────────────────┐
│   MongoDB    │ │  Python FastAPI Service  │
│  (Port 27017)│ │      (Port 8000)        │
│              │ │                         │
│  Collections:│ │  /anomaly/analyze       │
│  - users     │ │  /anomaly/batch-check   │
│  - stores    │ │  /ocr/micro-code        │
│  - batches   │ │                         │
│  - ledger    │ │  (TensorFlow / rules)   │
│  - anomalies │ └─────────────────────────┘
│  - scans     │
└──────────────┘
```

---

## 4. Database Schema (MongoDB Collections)

### `users`
```js
{
  _id: ObjectId,
  role: "patient" | "pharmacist" | "manufacturer" | "admin",
  email: String,           // unique
  phone: String,           // optional
  passwordHash: String,    // bcrypt
  name: String,
  storeId: ObjectId,       // ref → stores (for pharmacist role)
  manufacturerId: String,  // for manufacturer role
  createdAt: Date,
  updatedAt: Date
}
```

### `stores`
```js
{
  _id: ObjectId,
  licenseId: String,       // e.g. "PHARM-8492", unique
  name: String,
  region: String,
  address: String,
  geoLocation: { lat: Number, lng: Number },  // for future Leaflet
  isActive: Boolean,
  complianceScore: Number, // calculated field, updated by anomaly service
  createdAt: Date
}
```

### `batches`
```js
{
  _id: ObjectId,
  batchId: String,         // human-readable, e.g. "BH-992-QX", unique
  product: {
    name: String,          // e.g. "Amoxicillin 500mg"
    dosageForm: String,    // e.g. "Oral Capsules"
    strength: String,
    manufacturer: String,
    manufacturerLicense: String
  },
  totalUnits: Number,      // original quantity manufactured
  remainingUnits: Number,  // current available (decremented on sell)
  mfgDate: Date,
  expiryDate: Date,
  hmacSecret: String,      // HMAC key used to generate micro-codes (encrypted at rest)
  microCodes: [{           // per-tablet HMAC micro-codes
    index: Number,
    code: String,          // HMAC-SHA256 truncated
    isDispensed: Boolean
  }],
  masterQrData: String,    // encoded payload for the pack-level QR code
  status: "active" | "recalled" | "expired",
  createdAt: Date
}
```

### `ledger` (Hash-Chain)
```js
{
  _id: ObjectId,
  batchId: String,          // ref → batches.batchId
  sequenceNumber: Number,   // monotonically increasing per batch
  previousHash: String,     // SHA-256 of previous ledger entry (null for genesis)
  currentHash: String,      // SHA-256(previousHash + payload)
  event: "MANUFACTURED" | "SHIPPED" | "RECEIVED" | "SOLD" | "VERIFIED" | "FLAGGED",
  actor: {
    role: String,
    userId: ObjectId,       // optional for anonymous patient verification
    storeId: ObjectId,      // optional
    name: String
  },
  payload: {
    quantityChanged: Number,  // negative for sell, positive for receive
    remainingAfter: Number,
    geoLocation: { lat: Number, lng: Number },  // optional
    metadata: Object          // flexible: scan device info, anomaly details, etc.
  },
  timestamp: Date,
  createdAt: Date
}
// Index: { batchId: 1, sequenceNumber: 1 } unique
// Index: { batchId: 1, event: 1 }
```

### `anomalies`
```js
{
  _id: ObjectId,
  batchId: String,
  storeId: ObjectId,
  type: "HASH_MISMATCH" | "DUPLICATE_SCAN" | "EXPIRED_DISPENSE" | "VOLUME_SPIKE" | "GEO_DIVERSION",
  riskLevel: "high" | "medium" | "low",
  title: String,
  description: String,
  detectedAt: Date,
  resolvedAt: Date,         // null if unresolved
  resolvedBy: ObjectId,     // ref → users
  ledgerEntryId: ObjectId,  // ref → ledger entry that triggered it
  createdAt: Date
}
```

### `scans` (Patient Verification History)
```js
{
  _id: ObjectId,
  userId: ObjectId,         // optional (null for anonymous)
  batchId: String,
  microCode: String,        // the code the patient entered/scanned
  result: "verified" | "warning" | "counterfeit",
  deviceFingerprint: String,
  geoLocation: { lat: Number, lng: Number },
  verifiedAt: Date
}
```

---

## 5. API Endpoints

### 5a. Authentication (`/api/auth`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/register` | Create account (patient/pharmacist/admin) | Public |
| `POST` | `/api/auth/login` | Login → JWT access + refresh tokens | Public |
| `POST` | `/api/auth/refresh` | Refresh JWT | Refresh token |
| `GET`  | `/api/auth/me` | Get current user profile | Bearer JWT |

### 5b. Public Verification (`/api/verify`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/verify/:code` | Verify a micro-code or batch ID. Returns batch info, product details, verification status, and custody chain summary. | Public |
| `POST` | `/api/verify` | Submit verification with additional metadata (geo, device). Creates a `scans` record and a `VERIFIED` ledger entry. | Public (optional JWT for history linking) |

### 5c. Manufacturer (`/api/manufacturer`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/manufacturer/batch` | Create a new batch: generates HMAC micro-codes, creates genesis ledger entry. Returns batch ID + QR payload. | JWT (manufacturer) |
| `GET`  | `/api/manufacturer/batches` | List manufacturer's batches | JWT (manufacturer) |
| `GET`  | `/api/manufacturer/batch/:batchId` | Get batch details | JWT (manufacturer) |

### 5d. Pharmacist / Store (`/api/pharmacist`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`  | `/api/pharmacist/dashboard` | Dashboard metrics (today's scans, verified, flagged, low stock) | JWT (pharmacist) |
| `POST` | `/api/pharmacist/receive` | Receive stock: scan batch QR → one-way custody lock check → creates `RECEIVED` ledger entry. **Validates**: batch hasn't already been received by another store (one-way lock). | JWT (pharmacist) |
| `POST` | `/api/pharmacist/sell` | Sell/dispense: scan batch QR + select quantity → creates `SOLD` ledger entry, decrements `remainingUnits`. Triggers anomaly check. | JWT (pharmacist) |
| `GET`  | `/api/pharmacist/inventory` | List store's current inventory (batches received, stock levels) | JWT (pharmacist) |
| `GET`  | `/api/pharmacist/transactions` | Recent sell/receive transactions for this store | JWT (pharmacist) |

### 5e. Admin / Regulator (`/api/admin`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`  | `/api/admin/overview` | National metrics (total ledger entries, stores, flagged diversions, compliance rate) | JWT (admin) |
| `GET`  | `/api/admin/stores` | All stores with compliance scores and scan volumes | JWT (admin) |
| `GET`  | `/api/admin/stores/:storeId` | Single store details + performance metrics | JWT (admin) |
| `GET`  | `/api/admin/anomalies` | List anomaly alerts, filterable by risk level and type | JWT (admin) |
| `PATCH`| `/api/admin/anomalies/:id/resolve` | Mark anomaly as resolved | JWT (admin) |
| `GET`  | `/api/admin/audit/:batchId` | Full immutable audit trail (custody chain) for a batch | JWT (admin) |

### 5f. Ledger (`/api/ledger`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`  | `/api/ledger/:batchId` | Full hash-chain for a batch (public for verified batches, restricted for unverified) | Public / JWT |
| `GET`  | `/api/ledger/:batchId/verify-integrity` | Verify the entire chain's hash integrity (re-hash and compare) | Public |

### 5g. AI Chat (`/api/chat`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/chat/medication` | Send a question about a specific batch's medication. Proxies to Gemini API with drug metadata as grounding context. | Public (rate-limited) |

### 5h. Patient History (`/api/patient`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`  | `/api/patient/history` | Get authenticated patient's scan/verification history | JWT (patient) |

---

## 6. Frontend → Backend Integration Map

| Frontend Page | Component File | API Endpoints Needed |
|--------------|---------------|---------------------|
| PatientLanding | `pages/patient/PatientLanding.jsx` | `GET /api/admin/overview` (for trust metrics — or keep hardcoded for demo) |
| ScanMedicine | `pages/patient/ScanMedicine.jsx` | Camera → decode QR → `POST /api/verify` |
| VerificationResult | `pages/patient/VerificationResult.jsx` | `GET /api/verify/:code`, `GET /api/ledger/:batchId`, `POST /api/chat/medication` |
| ~~ConfirmPurchase~~ | ~~`pages/patient/ConfirmPurchase.jsx`~~ | **REMOVE** |
| ScanHistory | `pages/patient/ScanHistory.jsx` | `GET /api/patient/history` |
| PatientLogin | `pages/patient/PatientLogin.jsx` | `POST /api/auth/login`, `POST /api/auth/register` |
| PharmacistLogin | `pages/pharmacist/PharmacistLogin.jsx` | `POST /api/auth/login` |
| Dashboard | `pages/pharmacist/Dashboard.jsx` | `GET /api/pharmacist/dashboard`, `GET /api/pharmacist/transactions` |
| SellPOS | `pages/pharmacist/SellPOS.jsx` | `POST /api/pharmacist/sell` — **rework UI to match spec's two-action model** |
| InventoryManagement | `pages/pharmacist/InventoryManagement.jsx` | `POST /api/pharmacist/receive`, `GET /api/pharmacist/inventory` |
| RegulatorOverview | `pages/admin/RegulatorOverview.jsx` | `GET /api/admin/overview`, `GET /api/admin/anomalies?limit=3&risk=high` |
| StoreAnalytics | `pages/admin/StoreAnalytics.jsx` | `GET /api/admin/stores` (admin) or `GET /api/pharmacist/dashboard` (pharmacist own store) |
| AnomalyAlerts | `pages/admin/AnomalyAlerts.jsx` | `GET /api/admin/anomalies` |
| AuditTrail | `pages/admin/AuditTrail.jsx` | `GET /api/admin/audit/:batchId` or `GET /api/ledger/:batchId` |

---

## 7. Step-by-Step Build Order

### Phase 0: Cleanup & Prep
- [ ] Remove `ConfirmPurchase.jsx` and its routes from `routes.jsx`
- [ ] Remove links to ConfirmPurchase from `VerificationResult.jsx`
- [ ] Add `dist/` to `.gitignore`
- [ ] Clean up `code/`, `images/`, `download.ps1`, `download_batch2.ps1` (archive or delete)
- [ ] Create backend folder structure: `server/` for Express, `services/` for FastAPI

### Phase 1: Backend Foundation (Express + MongoDB)
- [ ] Initialize `server/` with `package.json` (express, mongoose, bcryptjs, jsonwebtoken, cors, dotenv, helmet, express-rate-limit)
- [ ] Set up MongoDB connection (`server/config/db.js`)
- [ ] Create Mongoose models: `User`, `Store`, `Batch`, `LedgerEntry`, `Anomaly`, `Scan`
- [ ] Implement hash-chain utility (`server/utils/hashChain.js`) — SHA-256 linked hashing
- [ ] Implement HMAC micro-code generation utility (`server/utils/hmacMicroCode.js`)
- [ ] Set up Express app with middleware (CORS, helmet, rate-limiting, JSON parsing)
- [ ] Create `.env` with `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`

### Phase 2: Authentication
- [ ] Implement `POST /api/auth/register` (bcrypt hash, role validation, create user)
- [ ] Implement `POST /api/auth/login` (verify credentials, issue JWT + refresh token)
- [ ] Implement `POST /api/auth/refresh` and `GET /api/auth/me`
- [ ] Create auth middleware (`server/middleware/auth.js`) — JWT verification + role-based access
- [ ] Wire `PatientLogin.jsx` and `PharmacistLogin.jsx` to real auth endpoints
- [ ] Add auth context/provider to React (`src/contexts/AuthContext.jsx`)
- [ ] Implement protected route wrapper for pharmacist/admin pages

### Phase 3: Core Ledger & Batch Management
- [ ] Implement `POST /api/manufacturer/batch` — generate batch, HMAC micro-codes, genesis ledger entry
- [ ] Implement `GET /api/manufacturer/batches` and `GET /api/manufacturer/batch/:batchId`
- [ ] Create seed script (`server/scripts/seed.js`) — populate DB with sample manufacturers, stores, batches, and a complete custody chain for demo
- [ ] Implement `GET /api/ledger/:batchId` — return full hash-chain timeline
- [ ] Implement `GET /api/ledger/:batchId/verify-integrity` — re-hash and validate chain

### Phase 4: Public Verification (Core Feature)
- [ ] Implement `GET /api/verify/:code` — look up by batchId or microCode, return product info + verification status
- [ ] Implement `POST /api/verify` — record verification event, create `VERIFIED` ledger entry, check for duplicate scans (anomaly trigger)
- [ ] Integrate camera scanning library in `ScanMedicine.jsx` (e.g. `html5-qrcode`)
- [ ] Wire `VerificationResult.jsx` to `GET /api/verify/:code` + `GET /api/ledger/:batchId`
- [ ] Replace hardcoded product data with API response

### Phase 5: Pharmacist Workflows (Add / Sell)
- [ ] Implement `POST /api/pharmacist/receive` — one-way custody lock validation + `RECEIVED` ledger entry
- [ ] Implement `POST /api/pharmacist/sell` — quantity validation + `SOLD` ledger entry + decrement `remainingUnits`
- [ ] Implement `GET /api/pharmacist/inventory` and `GET /api/pharmacist/dashboard`
- [ ] Implement `GET /api/pharmacist/transactions`
- [ ] **Rework `SellPOS.jsx`:** Replace cart/pricing POS with spec-aligned two-action UI (Scan QR → Select Quantity → Confirm Dispense)
- [ ] Wire `InventoryManagement.jsx` to `POST /api/pharmacist/receive` + `GET /api/pharmacist/inventory`
- [ ] Wire `Dashboard.jsx` to `GET /api/pharmacist/dashboard` + `GET /api/pharmacist/transactions`

### Phase 6: Anomaly Detection & Admin
- [ ] Create Python FastAPI service (`services/anomaly/`)
- [ ] Implement rule-based anomaly detection:
  - Duplicate scan from different geolocations → `GEO_DIVERSION`
  - Volume spike (>X units in Y hours) → `VOLUME_SPIKE`
  - Expired stock dispense attempt → `EXPIRED_DISPENSE`
  - Hash/signature mismatch → `HASH_MISMATCH`
- [ ] Implement `GET /api/admin/overview`, `GET /api/admin/stores`, `GET /api/admin/anomalies`
- [ ] Implement `GET /api/admin/audit/:batchId`
- [ ] Implement `PATCH /api/admin/anomalies/:id/resolve`
- [ ] Wire `RegulatorOverview.jsx`, `AnomalyAlerts.jsx`, `StoreAnalytics.jsx`, `AuditTrail.jsx` to API endpoints
- [ ] Add role-based data filtering for `StoreAnalytics` (pharmacist sees own store only)

### Phase 7: AI Medication Assistant
- [ ] Implement `POST /api/chat/medication` — proxy to Gemini API with drug metadata as system context
- [ ] Add multilingual support (detect language or user preference, instruct Gemini accordingly)
- [ ] Wire `VerificationResult.jsx` chat component to `POST /api/chat/medication`
- [ ] Replace canned responses with real API responses
- [ ] Add rate-limiting to chat endpoint

### Phase 8: Patient History & Polish
- [ ] Implement `GET /api/patient/history`
- [ ] Wire `ScanHistory.jsx` to API
- [ ] Add loading states, error handling, and empty states to all pages
- [ ] Add toast/notification system for success/error feedback
- [ ] Implement proper logout flow
- [ ] Add Vite proxy config for API (`vite.config.js` → `server.proxy`)

### Phase 9: Demo Prep
- [ ] Run seed script to populate demo data
- [ ] Verify full flow: manufacturer creates batch → store receives → store sells → patient verifies → anomaly triggers
- [ ] Create minimal manufacturer page (if Q3 = Option B)
- [ ] Test on mobile device (PWA-readiness)
- [ ] Update `PROJECT_CONTEXT.md` with final status

---

## 8. Backend Folder Structure (Proposed)

```
server/
├── package.json
├── .env
├── index.js                    # Express app entry
├── config/
│   ├── db.js                   # MongoDB connection
│   └── env.js                  # Environment variable validation
├── middleware/
│   ├── auth.js                 # JWT verification + role guard
│   ├── rateLimiter.js
│   └── errorHandler.js
├── models/
│   ├── User.js
│   ├── Store.js
│   ├── Batch.js
│   ├── LedgerEntry.js
│   ├── Anomaly.js
│   └── Scan.js
├── routes/
│   ├── auth.js
│   ├── verify.js
│   ├── manufacturer.js
│   ├── pharmacist.js
│   ├── admin.js
│   ├── ledger.js
│   ├── chat.js
│   └── patient.js
├── controllers/
│   ├── authController.js
│   ├── verifyController.js
│   ├── manufacturerController.js
│   ├── pharmacistController.js
│   ├── adminController.js
│   ├── ledgerController.js
│   ├── chatController.js
│   └── patientController.js
├── utils/
│   ├── hashChain.js            # SHA-256 hash-chain utilities
│   ├── hmacMicroCode.js        # HMAC-based micro-code generation
│   ├── qrGenerator.js          # QR code data encoding
│   └── anomalyRules.js         # Rule-based anomaly detection (before ML)
└── scripts/
    └── seed.js                 # Demo data seeder

services/
└── anomaly/
    ├── requirements.txt
    ├── main.py                 # FastAPI entry
    ├── models/                 # ML model files (future)
    └── rules/
        └── heuristics.py       # Rule-based anomaly detection
```

---

## 9. Verification Plan

### Automated Tests
- Unit tests for hash-chain integrity (create chain → verify → tamper → verify fails)
- Unit tests for HMAC micro-code generation + verification
- Integration tests for each API endpoint (use Jest + Supertest)
- Test one-way custody lock enforcement (attempt to receive at 2 stores → second should fail)

### Manual Verification
- Full demo flow walkthrough on localhost
- Mobile device testing (camera scanning)
- Role-based access: verify pharmacist can't access admin endpoints and vice versa
- Anomaly trigger: create a duplicate scan → verify alert appears in admin dashboard

---

## 10. Estimated Effort (Hackathon Pace)

| Phase | Estimated Time |
|-------|---------------|
| Phase 0: Cleanup | 30 min |
| Phase 1: Backend Foundation | 2-3 hours |
| Phase 2: Authentication | 2 hours |
| Phase 3: Ledger & Batch | 3-4 hours |
| Phase 4: Public Verification | 3-4 hours |
| Phase 5: Pharmacist Workflows | 3-4 hours |
| Phase 6: Anomaly Detection | 3-4 hours |
| Phase 7: AI Chat | 2 hours |
| Phase 8: Polish | 2-3 hours |
| Phase 9: Demo Prep | 1-2 hours |
| **Total** | **~22-30 hours** |

---

> [!WARNING]
> **Do not start implementation until you've reviewed the Open Questions in §2 and approved this plan.** Decisions on patient accounts, hash-chain design, and manufacturer scope directly affect the database schema.

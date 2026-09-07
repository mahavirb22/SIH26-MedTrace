# PROJECT_CONTEXT.md — MedTrace

> **Last updated:** 2026-09-06  
> **Status:** Hackathon prototype — frontend shell only, zero backend

---

## 1. What is MedTrace?

MedTrace is a **pharmaceutical supply-chain integrity platform** built for Smart India Hackathon 2026 (Problem Statement SIH26198 — MedTech / BioTech / HealthTech).

**Core problem:** Medicines are diverted or counterfeited after leaving the manufacturer. A single tablet is too small for a printed QR code, and store-to-store diversion only surfaces after a patient complaint.

**Core solution — Hybrid Identity Model:**

| Layer | What | How |
|-------|------|-----|
| **Layer A — Physical** | Short HMAC micro-code lasered onto every blister cavity | Reuses existing pharma printing lines, zero new hardware |
| **Layer B — Digital Twin** | Master QR = a live record on an immutable custody hash-chain ledger, updated by quantity (not per-pill scans) | One-way custody locks prevent reverse-flow diversion |

**Key differentiators:**
- Role-aware one-way custody locks stop store-to-store diversion automatically
- AI flags abnormal sell-through before a complaint is filed (proactive anomaly detection)
- Builds on (not against) CDSCO's existing QR/barcode mandate
- "Dispensed to" is anonymised by default; only DPDP-aligned for scheduled drugs
- Multilingual AI health assistant for rural/underserved access
- Nearby medicine search

---

## 2. User Roles & Portals

| Role | Portal | Description |
|------|--------|-------------|
| **Patient / Consumer** | Public-facing PWA (camera-enabled) | Scans QR / enters micro-code → sees verification result + custody chain. Optional: AI medication assistant, scan history, purchase confirmation. |
| **Pharmacist / Store Staff** | Authenticated dashboard | Two-action UI (Add stock / Sell) with quantity selector. Scans pack to receive → one-way custody lock checked. On sale, digital twin decrements units remaining. |
| **Manufacturer** | Authenticated dashboard *(not yet scoped in UI)* | Generates pack + per-tablet micro-codes. Creates initial ledger entries. |
| **Regulator / Admin (CDSCO)** | Authenticated dashboard | National oversight: anomaly alerts, store compliance analytics, immutable audit trail per batch. |

---

## 3. Technology Stack (per spec)

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS 3 (current) |
| Icons | Material Symbols Outlined + Lucide React |
| Fonts | Syne (headlines), Hanken Grotesk (body), JetBrains Mono (codes/IDs) |
| Backend API | Node.js + Express (planned) |
| AI/ML Services | Python + FastAPI + TensorFlow (anomaly detection, OCR) |
| Database | MongoDB (planned) |
| Ledger | Custom hash-chain ledger (not blockchain — append-only hash-chain) |
| Maps | Leaflet (nearby medicine search — planned) |

---

## 4. Current Repository Structure

```
SIH26/
├── index.html                  # Vite entry point
├── package.json                # React 18, react-router-dom 7, lucide-react, tailwind 3
├── vite.config.js
├── tailwind.config.js          # Full Material 3-style token system
├── postcss.config.js
├── design_system/
│   └── DESIGN.md               # Complete design system spec (colors, typography, spacing, shapes)
├── code/                        # Stitch-generated raw HTML prototypes (16 files) — NOT used by React app
├── images/                      # Stitch-generated reference screenshots (17 PNG files)
├── src/
│   ├── main.jsx                 # React root
│   ├── App.jsx                  # BrowserRouter wrapper
│   ├── index.css                # Tailwind directives + base styles + blister motif
│   ├── routes.jsx               # All route definitions (14 pages + redirects)
│   ├── assets/                  # Logo + pharmacist hero photo + reference PNGs
│   ├── components/              # 9 shared components (see §5)
│   └── pages/
│       ├── patient/             # 6 pages
│       ├── pharmacist/          # 4 pages
│       └── admin/               # 4 pages
└── dist/                        # Stale Vite build output
```

---

## 5. Component Inventory

### 5a. Shared Components (all KEEP)

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| `Navbar` | `src/components/Navbar.jsx` | Patient-facing top nav with mobile menu | ✅ Keep — matches spec. Links to all 3 portals for demo navigation. |
| `Sidebar` | `src/components/Sidebar.jsx` | Pharmacist/Admin sidebar nav with portal switcher | ✅ Keep — matches spec |
| `Button` | `src/components/Button.jsx` | 5-variant pill button (primary/secondary/ghost/outline/danger) | ✅ Keep |
| `Card` | `src/components/Card.jsx` | 3-variant card (flat/outlined/elevated) per DESIGN.md depth levels | ✅ Keep |
| `FormInput` | `src/components/FormInput.jsx` | Input with label, icon, mono mode, error state | ✅ Keep |
| `StatusBadge` | `src/components/StatusBadge.jsx` | Verification status chips (verified/pending/warning/error/info) | ✅ Keep |
| `BatchBadge` | `src/components/BatchBadge.jsx` | Monospaced batch/serial ID display | ✅ Keep |
| `RiskBadge` | `src/components/RiskBadge.jsx` | Risk level indicator (high/medium/low) for anomaly alerts | ✅ Keep |
| `BlisterDivider` | `src/components/BlisterDivider.jsx` | Visual "blister pack" section divider motif | ✅ Keep |

### 5b. Patient Pages

| Page | File | Route(s) | Classification | Justification |
|------|------|----------|----------------|---------------|
| **PatientLanding** | `pages/patient/PatientLanding.jsx` | `/`, `/patient` | **(a) Keep — matches spec** | Public landing with hero, trust metrics, how-it-works. All data is hardcoded/decorative. Needs backend wiring for real metrics. |
| **ScanMedicine** | `pages/patient/ScanMedicine.jsx` | `/scan`, `/patient/scan` | **(b) Keep — needs rework** | Camera scan is fully simulated (uses a stock photo background + `setTimeout` navigation). Needs real camera integration (e.g. `html5-qrcode` or `zxing-js`) for QR/matrix code scanning, plus API call to `POST /api/verify`. Manual code entry modal also needs API wiring. |
| **VerificationResult** | `pages/patient/VerificationResult.jsx` | `/verify`, `/verify/:code`, `/patient/verify` | **(b) Keep — needs rework** | Displays hardcoded "Amoxicillin 500mg" result. Must fetch real data from `GET /api/verify/:code`. AI assistant chat is fully client-side simulated with canned responses — needs wiring to a real LLM/chatbot backend endpoint. |
| **ConfirmPurchase** | `pages/patient/ConfirmPurchase.jsx` | `/confirm`, `/patient/confirm` | **(c) FLAG FOR REMOVAL** | This page lets a patient "confirm purchase" with a 6-digit OTP that "links it to their medical history ledger." Per the spec, the digital twin is updated by the **store staff** when they sell (via POS), not by the patient. The patient's role is to **verify** authenticity, not confirm a purchase transaction. This page conflates the pharmacist's sell action with a patient-side OTP confirmation that doesn't exist in the spec's process flow. The OTP mechanism is also not mentioned anywhere in the spec. |
| **ScanHistory** | `pages/patient/ScanHistory.jsx` | `/history`, `/patient/history` | **(b) Keep — needs rework** | "My Medicines" personal scan history. Matches the spec's user-facing verification history concept. Currently uses hardcoded mock data. Needs API integration (`GET /api/patient/history`), real auth, and local storage/account persistence. |
| **PatientLogin** | `pages/patient/PatientLogin.jsx` | `/login`, `/patient/login` | **(b) Keep — needs rework** | Sign in / sign up form. Currently a no-op (any email+password navigates to landing). Needs real auth (JWT or session-based). Per spec, "dispensed to" is anonymised — patient accounts may be optional. Design decision needed. |

### 5c. Pharmacist Pages

| Page | File | Route(s) | Classification | Justification |
|------|------|----------|----------------|---------------|
| **PharmacistLogin** | `pages/pharmacist/PharmacistLogin.jsx` | `/pharmacist/login` | **(b) Keep — needs rework** | Login with Store ID + password. Currently a no-op (`setTimeout` → navigate). Needs real auth against store credentials. |
| **Dashboard** | `pages/pharmacist/Dashboard.jsx` | `/pharmacist/dashboard` | **(b) Keep — needs rework** | Summary metrics + recent transactions table. All hardcoded. Needs API wiring (`GET /api/pharmacist/dashboard`). |
| **SellPOS** | `pages/pharmacist/SellPOS.jsx` | `/pharmacist/sell` | **(b) Keep — needs major rework** | This is the spec's core "Sell" action. Current UI is a traditional retail POS with cart, line items, prices, subtotal/tax/total, and "Complete Sale & Generate Invoice." **The spec describes a minimal two-action UI (Add / Sell) with a quantity selector** — staff picks a whole pack or a quantity of loose tablets, and the digital twin decrements units remaining. The current POS is over-engineered with dollar pricing, tax calculations, and invoice generation that don't match the spec's intent. Needs significant simplification: scan pack QR → select quantity → confirm → ledger decrements. No pricing/invoicing. |
| **InventoryManagement** | `pages/pharmacist/InventoryManagement.jsx` | `/pharmacist/inventory` | **(b) Keep — needs rework** | Maps to the spec's "Add" (receive stock) action. The "Receive New Stock Batch" modal is conceptually correct (scan batch QR to add to inventory with one-way custody lock). Currently hardcoded. Needs API wiring (`POST /api/pharmacist/receive`). The "Reorder Stock" action is not in spec — can remain as a nice-to-have or be removed. |

### 5d. Admin / Regulator Pages

| Page | File | Route(s) | Classification | Justification |
|------|------|----------|----------------|---------------|
| **RegulatorOverview** | `pages/admin/RegulatorOverview.jsx` | `/admin/overview` | **(b) Keep — needs rework** | National oversight dashboard with metrics + critical anomaly table. All hardcoded. Needs API wiring. Matches spec's "live anomaly dashboards running for regulators." |
| **StoreAnalytics** | `pages/admin/StoreAnalytics.jsx` | `/admin/stores`, `/pharmacist/analytics` | **(b) Keep — needs rework** | Store compliance table. Hardcoded. Note: this page is shared between pharmacist and admin routes. For the pharmacist portal, it should show only **their own** store's analytics, not all stores nationally. Needs role-based data filtering. |
| **AnomalyAlerts** | `pages/admin/AnomalyAlerts.jsx` | `/admin/alerts` | **(b) Keep — needs rework** | Feed of supply-chain anomaly alerts with risk-level filtering. Hardcoded. Needs `GET /api/admin/anomalies` + real AI anomaly detection backend. Matches spec's "AI flags abnormal sell-through." |
| **AuditTrail** | `pages/admin/AuditTrail.jsx` | `/admin/audit`, `/admin/audit/:batchId` | **(a) Keep — matches spec** | Immutable custody timeline for a batch. Hardcoded mock timeline (Manufacturer → Wholesale → Retail → Patient). Structure directly matches spec's process flow. Needs `GET /api/ledger/:batchId` wiring. |

### 5e. Files to Remove or Ignore

| Item | Path | Reason |
|------|------|--------|
| **ConfirmPurchase page** | `src/pages/patient/ConfirmPurchase.jsx` | Not part of spec process flow (see §5b above) |
| **ConfirmPurchase route** | `src/routes.jsx` lines 35-36 | Remove `/confirm` and `/patient/confirm` routes |
| **code/ directory** | `code/*.html` | 16 raw Stitch-generated HTML prototypes. Not used by the React app. Keep as reference only or delete to reduce repo noise. |
| **dist/ directory** | `dist/` | Stale build output. Add to `.gitignore` and delete. |
| **download scripts** | `download.ps1`, `download_batch2.ps1` | One-time Stitch asset download scripts. No longer needed. |
| **images/ directory** | `images/` | Duplicate of `src/assets/` (same PNG files). Keep one location. |

---

## 6. What's Real vs. Mocked

### ✅ Real (implemented and functional)
- React SPA scaffolding with Vite + TailwindCSS
- Full design system token configuration (colors, typography, spacing, shapes)
- All 9 shared UI components
- All page layouts and visual designs
- Client-side routing for all 3 portals
- Responsive mobile/desktop layouts with Navbar + Sidebar navigation

### 🟡 Mocked (UI exists but uses hardcoded data / simulated interactions)
- **Every single data display** — all metrics, tables, history items, alerts, and timeline events are hardcoded JavaScript arrays inside components
- **Camera scanning** — uses a stock photo background with `setTimeout` to simulate scan
- **AI medication assistant** — client-side `if/else` on keywords, returns canned strings
- **All form submissions** — login forms, POS checkout, stock receipt all just call `setTimeout` → `navigate()`
- **OTP verification** — fully client-side, accepts any 6 digits

### ❌ Missing entirely (no implementation at all)
- **No backend server** (Node/Express or FastAPI)
- **No database** (MongoDB or any persistence)
- **No authentication** (JWT, sessions, or any auth mechanism)
- **No API endpoints** (zero REST or GraphQL routes)
- **No hash-chain ledger** implementation
- **No HMAC micro-code** generation
- **No QR code generation** for digital twin
- **No real camera/QR scanning** integration
- **No AI/ML anomaly detection** model or service
- **No real chatbot/LLM** integration for medication assistant
- **No Leaflet/maps** integration (nearby medicine search — mentioned in spec features)
- **No manufacturer portal** (spec mentions it but no UI exists)

---

## 7. Spec Features Not Represented in Current UI

| Feature from Spec | Current Status |
|-------------------|---------------|
| HMAC micro-code generation (manufacturer) | No UI or backend |
| Manufacturer portal (generate pack + per-tablet micro-codes) | No UI |
| One-way custody locks (role-aware, prevents reverse-flow) | Conceptually referenced in UI text, but no backend enforcement |
| Digital twin ledger (quantity-based, not per-pill) | No implementation |
| AI anomaly detection (flags abnormal sell-through proactively) | No ML model or service |
| Nearby medicine search (Leaflet maps) | No implementation |
| Multilingual AI health assistant | AI chat exists but is English-only canned responses |
| DPDP-aligned anonymisation of "dispensed to" | No implementation |
| Duplicate scan detection (geo-diversion) | Referenced in mock data, no implementation |

---

## 8. Key Architecture Decisions Still Needed

1. **Patient accounts: optional or required?** Spec says "dispensed to" is anonymised by default. Do patients need accounts to view scan history, or is it device-local/anonymous?
2. **Hash-chain vs. blockchain?** Spec says "hash-chain ledger" — is this a simple append-only linked-hash data structure in MongoDB, or a full blockchain?
3. **HMAC key management:** Who holds the secret key for micro-code generation? How are keys distributed to manufacturers?
4. **AI chatbot backend:** Is this a local TensorFlow model, or an external LLM API (e.g., Gemini)?
5. **Manufacturer portal scope:** Full CRUD for batch creation, or just a seed script for the hackathon demo?
6. **Multi-language support:** Which languages for the AI assistant? How deep (UI labels too, or just chat)?
7. **Quantity tracking granularity:** Per-pack or per-tablet level in the ledger?

---

> **This file is the single source of truth for MedTrace project state.** Update it whenever the implementation status changes.

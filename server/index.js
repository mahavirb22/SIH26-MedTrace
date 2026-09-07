import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env.js';
import { connectDB } from './config/db.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.js';
import verifyRoutes from './routes/verify.js';
import manufacturerRoutes from './routes/manufacturer.js';
import pharmacistRoutes from './routes/pharmacist.js';
import adminRoutes from './routes/admin.js';
import ledgerRoutes from './routes/ledger.js';
import chatRoutes from './routes/chat.js';
import patientRoutes from './routes/patient.js';

const app = express();

// ── Global Middleware ──────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

// ── Health Check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MedTrace API',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/manufacturer', manufacturerRoutes);
app.use('/api/pharmacist', pharmacistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/patient', patientRoutes);

// ── 404 Handler ────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ── Global Error Handler ───────────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────
async function start() {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║       MedTrace API Server Running        ║
║──────────────────────────────────────────║
║  Port:     ${String(env.PORT).padEnd(29)}║
║  Env:      ${env.NODE_ENV.padEnd(29)}║
║  Health:   http://localhost:${env.PORT}/api/health  ║
╚══════════════════════════════════════════╝
    `);
  });
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

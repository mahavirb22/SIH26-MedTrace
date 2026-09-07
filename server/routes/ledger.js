import { Router } from 'express';
import { getChain, verifyIntegrity } from '../controllers/ledgerController.js';

const router = Router();

// Public — hash-chain is publicly auditable
router.get('/:batchId', getChain);
router.get('/:batchId/verify-integrity', verifyIntegrity);

export default router;

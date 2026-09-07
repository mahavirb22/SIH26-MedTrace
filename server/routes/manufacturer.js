import { Router } from 'express';
import { createBatch, listBatches, getBatch } from '../controllers/manufacturerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All manufacturer routes require auth + manufacturer/admin role
router.use(authenticate, authorize('manufacturer', 'admin'));

router.post('/batch', createBatch);
router.get('/batches', listBatches);
router.get('/batch/:batchId', getBatch);

export default router;

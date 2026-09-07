import { Router } from 'express';
import {
  getOverview,
  getStores,
  getAnomalies,
  resolveAnomaly,
  getAuditTrail,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate, authorize('admin'));

router.get('/overview', getOverview);
router.get('/stores', getStores);
router.get('/anomalies', getAnomalies);
router.patch('/anomalies/:id/resolve', resolveAnomaly);
router.get('/audit/:batchId', getAuditTrail);

export default router;

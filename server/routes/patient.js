import { Router } from 'express';
import { getHistory, searchStores } from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/history', authenticate, authorize('patient', 'admin'), getHistory);
router.get('/search-stores', searchStores); // Public stock & pharmacy location search

export default router;

import { Router } from 'express';
import { getHistory } from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/history', authenticate, authorize('patient', 'admin'), getHistory);

export default router;

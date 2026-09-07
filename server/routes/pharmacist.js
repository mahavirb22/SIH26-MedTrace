import { Router } from 'express';
import {
  getDashboard,
  receiveStock,
  sellStock,
  getInventory,
  getTransactions,
} from '../controllers/pharmacistController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All pharmacist routes require auth + pharmacist role
router.use(authenticate, authorize('pharmacist', 'admin'));

router.get('/dashboard', getDashboard);
router.post('/receive', receiveStock);
router.post('/sell', sellStock);
router.get('/inventory', getInventory);
router.get('/transactions', getTransactions);

export default router;

import { Router } from 'express';
import { verifyCode, submitVerification } from '../controllers/verifyController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public — anyone can verify a medicine
router.get('/:code', verifyCode);
router.post('/', optionalAuth, submitVerification);

export default router;

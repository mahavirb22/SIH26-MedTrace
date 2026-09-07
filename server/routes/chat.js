import { Router } from 'express';
import { chatMedication } from '../controllers/chatController.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public but rate-limited
router.post('/medication', chatLimiter, chatMedication);

export default router;

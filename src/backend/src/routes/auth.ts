import { Router } from 'express';
import { register, login, getMe, recoverPassword } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/recover', recoverPassword);
router.get('/me', authMiddleware, getMe);

export default router;
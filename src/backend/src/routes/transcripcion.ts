import { Router } from 'express';
import multer from 'multer';
import { transcribirAudio } from '../controllers/transcripcionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.post('/', upload.single('audio'), transcribirAudio);

export default router;

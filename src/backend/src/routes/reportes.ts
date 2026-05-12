import { Router } from 'express';
import { generatePatientPDF } from '../controllers/pdfController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/paciente/:id', generatePatientPDF);

export default router;

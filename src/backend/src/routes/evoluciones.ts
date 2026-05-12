import { Router } from 'express';
import {
  getEvoluciones,
  createEvolucion,
  getEvolucionesDemo,
  getSiguienteNumeroSesion
} from '../controllers/evolucionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/demo', authMiddleware, getEvolucionesDemo);
router.get('/next/:pacienteId', authMiddleware, getSiguienteNumeroSesion);
router.get('/', authMiddleware, getEvoluciones);
router.post('/', authMiddleware, createEvolucion);

export default router;
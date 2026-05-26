import { Router } from 'express';
import {
  getPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  getPacienteDemo,
  getTimeline,
  updateSesiones
} from '../controllers/pacienteController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/demo', authMiddleware, getPacienteDemo);
router.get('/', authMiddleware, getPacientes);
router.get('/:id', authMiddleware, getPacienteById);
router.post('/', authMiddleware, createPaciente);
router.put('/:id', authMiddleware, updatePaciente);
router.get('/:id/timeline', authMiddleware, getTimeline);
router.patch('/:id/sesiones', authMiddleware, updateSesiones);

export default router;
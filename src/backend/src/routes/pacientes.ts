import { Router } from 'express';
import {
  getPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  getPacienteDemo
} from '../controllers/pacienteController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/demo', authMiddleware, getPacienteDemo);
router.get('/', authMiddleware, getPacientes);
router.get('/:id', authMiddleware, getPacienteById);
router.post('/', authMiddleware, createPaciente);
router.put('/:id', authMiddleware, updatePaciente);

export default router;
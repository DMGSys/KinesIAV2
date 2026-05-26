import { Router } from 'express';
import {
  getTurnos, getTurno, createTurno, updateTurno, updateTurnoEstado, deleteTurno,
} from '../controllers/turnoController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getTurnos);
router.get('/:id', getTurno);
router.post('/', createTurno);
router.put('/:id', updateTurno);
router.patch('/:id/estado', updateTurnoEstado);
router.delete('/:id', deleteTurno);

export default router;

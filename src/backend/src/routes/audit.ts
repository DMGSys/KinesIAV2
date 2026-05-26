import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

router.get('/', authMiddleware, adminMiddleware, getAuditLogs);

export default router;

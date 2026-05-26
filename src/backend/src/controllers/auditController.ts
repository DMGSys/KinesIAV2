import { Response } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.coleccion) filter.coleccion = req.query.coleccion;
    if (req.query.documentoId) filter.documentoId = req.query.documentoId;
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit as string) || 100);
    res.json(logs);
  } catch {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

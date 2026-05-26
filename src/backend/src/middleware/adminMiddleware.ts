import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from './auth.js';

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No autorizado' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'kinesia-secret-key-2026';
    const decoded = jwt.verify(token, secret) as { id: string; usuario: string; roles: string[] };

    if (!decoded.roles || !decoded.roles.includes('admin')) {
      res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
      return;
    }

    req.user = { id: decoded.id, usuario: decoded.usuario, roles: decoded.roles };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

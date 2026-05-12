import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    usuario: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No autorizado' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'kinesia-secret-key-2026';
    const decoded = jwt.verify(token, secret) as { id: string; usuario: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export const generateToken = (id: string, usuario: string): string => {
  const secret = process.env.JWT_SECRET || 'kinesia-secret-key-2026';
  const options: SignOptions = { expiresIn: '5m' };
  return jwt.sign({ id, usuario }, secret, options);
};
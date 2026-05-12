import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        usuario: string;
    };
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const generateToken: (id: string, usuario: string) => string;
//# sourceMappingURL=auth.d.ts.map
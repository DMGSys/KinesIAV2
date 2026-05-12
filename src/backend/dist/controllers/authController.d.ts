import { Request, Response } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        usuario: string;
        rol?: string;
    };
}
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const getMe: (req: AuthRequest, res: Response) => Promise<void>;
export declare const recoverPassword: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map
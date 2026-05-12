import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const getPacientes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPacienteById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createPaciente: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePaciente: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPacienteDemo: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=pacienteController.d.ts.map
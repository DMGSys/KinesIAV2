"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const adminMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'No autorizado' });
        return;
    }
    try {
        const secret = process.env.JWT_SECRET || 'kinesia-secret-key-2026';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        if (decoded.rol !== 'admin') {
            res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
            return;
        }
        req.user = { id: decoded.id, usuario: decoded.usuario, rol: decoded.rol };
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=adminMiddleware.js.map
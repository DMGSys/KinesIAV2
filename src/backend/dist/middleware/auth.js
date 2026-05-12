"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'No autorizado' });
        return;
    }
    try {
        const secret = process.env.JWT_SECRET || 'kinesia-secret-key-2026';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
};
exports.authMiddleware = authMiddleware;
const generateToken = (id, usuario, rol) => {
    const secret = process.env.JWT_SECRET || 'kinesia-secret-key-2026';
    const options = { expiresIn: '5m' };
    return jsonwebtoken_1.default.sign({ id, usuario, rol }, secret, options);
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map
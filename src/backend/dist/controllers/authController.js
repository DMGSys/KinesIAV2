"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoverPassword = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_js_1 = require("../models/User.js");
const auth_js_1 = require("../middleware/auth.js");
const register = async (req, res) => {
    try {
        const { usuario, contrasena, nombre, apellido, correo, celular } = req.body;
        if (!usuario || !contrasena || !nombre || !apellido || !correo || !celular) {
            res.status(400).json({ message: 'Todos los campos son requeridos' });
            return;
        }
        const existingUser = await User_js_1.User.findOne({
            $or: [{ usuario }, { correo }]
        });
        if (existingUser) {
            res.status(400).json({ message: 'El usuario o correo ya existe' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(contrasena, 10);
        const user = new User_js_1.User({
            usuario,
            contrasena: hashedPassword,
            nombre,
            apellido,
            correo,
            celular,
            activo: true
        });
        await user.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;
        if (!usuario || !contrasena) {
            res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
            return;
        }
        const user = await User_js_1.User.findOne({ usuario, activo: true });
        if (!user) {
            res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(contrasena, user.contrasena);
        if (!isMatch) {
            res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
            return;
        }
        const token = (0, auth_js_1.generateToken)(user._id.toString(), user.usuario);
        res.json({
            token,
            user: {
                id: user._id,
                usuario: user.usuario,
                nombre: user.nombre,
                apellido: user.apellido,
                correo: user.correo,
                celular: user.celular
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'No autorizado' });
            return;
        }
        const user = await User_js_1.User.findById(userId).select('-contrasena');
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        res.json({
            id: user._id,
            usuario: user.usuario,
            nombre: user.nombre,
            apellido: user.apellido,
            correo: user.correo,
            celular: user.celular
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getMe = getMe;
const recoverPassword = async (req, res) => {
    try {
        const { correo, nuevaContrasena } = req.body;
        if (!correo || !nuevaContrasena) {
            res.status(400).json({ message: 'Correo y nueva contraseña son requeridos' });
            return;
        }
        const user = await User_js_1.User.findOne({ correo });
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(nuevaContrasena, 10);
        user.contrasena = hashedPassword;
        await user.save();
        res.json({ message: 'Contraseña actualizada exitosamente' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.recoverPassword = recoverPassword;
//# sourceMappingURL=authController.js.map
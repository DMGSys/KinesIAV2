"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleUserActive = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_js_1 = require("../models/User.js");
const getUsers = async (req, res) => {
    try {
        const users = await User_js_1.User.find().select('-contrasena');
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const user = await User_js_1.User.findById(req.params.id).select('-contrasena');
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const { usuario, contrasena, nombre, apellido, correo, celular, rol } = req.body;
        if (!usuario || !contrasena || !nombre || !apellido || !correo || !celular) {
            res.status(400).json({ message: 'Todos los campos son requeridos' });
            return;
        }
        const validRoles = ['admin', 'kinesiologo'];
        if (rol && !validRoles.includes(rol)) {
            res.status(400).json({ message: 'Rol inválido. Use admin o kinesiologo.' });
            return;
        }
        const existing = await User_js_1.User.findOne({ $or: [{ usuario }, { correo }] });
        if (existing) {
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
            activo: true,
            rol: rol || 'kinesiologo'
        });
        await user.save();
        const userResponse = user.toObject();
        const { contrasena: _removed, ...rest } = userResponse;
        res.status(201).json(rest);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        if (updates.contrasena) {
            updates.contrasena = await bcryptjs_1.default.hash(updates.contrasena, 10);
        }
        else {
            delete updates.contrasena;
        }
        const validRoles = ['admin', 'kinesiologo'];
        if (updates.rol && !validRoles.includes(updates.rol)) {
            res.status(400).json({ message: 'Rol inválido.' });
            return;
        }
        const user = await User_js_1.User.findByIdAndUpdate(id, updates, { new: true }).select('-contrasena');
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const user = await User_js_1.User.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        res.json({ message: 'Usuario eliminado' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.deleteUser = deleteUser;
const toggleUserActive = async (req, res) => {
    try {
        const user = await User_js_1.User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        user.activo = !user.activo;
        await user.save();
        const userResponse = user.toObject();
        const { contrasena: _removed, ...rest } = userResponse;
        res.json(rest);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.toggleUserActive = toggleUserActive;
//# sourceMappingURL=userController.js.map
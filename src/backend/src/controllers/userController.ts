import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-contrasena');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-contrasena');
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const existing = await User.findOne({ $or: [{ usuario }, { correo }] });
    if (existing) {
      res.status(400).json({ message: 'El usuario o correo ya existe' });
      return;
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const user = new User({
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
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: Record<string, unknown> = { ...req.body };

    if (updates.contrasena) {
      updates.contrasena = await bcrypt.hash(updates.contrasena as string, 10);
    } else {
      delete updates.contrasena;
    }

    const validRoles = ['admin', 'kinesiologo'];
    if (updates.rol && !validRoles.includes(updates.rol as string)) {
      res.status(400).json({ message: 'Rol inválido.' });
      return;
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-contrasena');
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const toggleUserActive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    user.activo = !user.activo;
    await user.save();
    const userResponse = user.toObject();
    const { contrasena: _removed, ...rest } = userResponse;
    res.json(rest);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

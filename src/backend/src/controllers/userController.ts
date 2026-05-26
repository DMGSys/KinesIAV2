import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, ROLES } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

const VALID_ROLES = ROLES as readonly string[];

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
    const { usuario, contrasena, nombre, apellido, correo, celular, roles } = req.body;

    if (!usuario || !contrasena || !nombre || !apellido || !correo || !celular) {
      res.status(400).json({ message: 'Todos los campos son requeridos' });
      return;
    }

    const finalRoles = Array.isArray(roles) && roles.length > 0
      ? roles.filter((r: string) => VALID_ROLES.includes(r))
      : ['kinesiologo'];

    if (finalRoles.length === 0) {
      res.status(400).json({ message: 'Roles inválidos.' });
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
      roles: finalRoles
    });

    await user.save();
    const { contrasena: _removed, ...rest } = user.toObject();
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

    if (updates.roles) {
      const filtered = (updates.roles as string[]).filter(r => VALID_ROLES.includes(r));
      if (filtered.length === 0) {
        res.status(400).json({ message: 'Roles inválidos.' });
        return;
      }
      updates.roles = filtered;
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
    const { contrasena: _removed, ...rest } = user.toObject();
    res.json(rest);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const updateUserRoles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { roles } = req.body;

    if (!Array.isArray(roles) || roles.length === 0) {
      res.status(400).json({ message: 'Se requiere al menos un rol' });
      return;
    }

    const filtered = roles.filter((r: string) => VALID_ROLES.includes(r));
    if (filtered.length === 0) {
      res.status(400).json({ message: 'Roles inválidos' });
      return;
    }

    const user = await User.findByIdAndUpdate(id, { roles: filtered }, { new: true }).select('-contrasena');
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

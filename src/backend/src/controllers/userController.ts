import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, ROLES } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuthRequest } from '../middleware/auth.js';

const VALID_ROLES = ROLES as readonly string[];

async function logAudit(req: AuthRequest, accion: string, documentoId: string, cambios: { campo: string; valorAnterior: unknown; valorNuevo: unknown }[], descripcion: string) {
  try {
    const adminNombre = `${(req.user as any)?.nombre || ''} ${(req.user as any)?.apellido || ''}`.trim() || req.user?.usuario || 'desconocido';
    await AuditLog.create({
      usuarioId: req.user!.id,
      usuarioNombre: adminNombre,
      accion,
      coleccion: 'User',
      documentoId,
      cambios,
      descripcion,
    });
  } catch { /* silencioso */ }
}

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

    await logAudit(req, 'crear_usuario', user._id.toString(), [
      { campo: 'usuario', valorAnterior: null, valorNuevo: user.usuario },
      { campo: 'nombre', valorAnterior: null, valorNuevo: user.nombre },
      { campo: 'apellido', valorAnterior: null, valorNuevo: user.apellido },
      { campo: 'correo', valorAnterior: null, valorNuevo: user.correo },
      { campo: 'celular', valorAnterior: null, valorNuevo: user.celular },
      { campo: 'roles', valorAnterior: null, valorNuevo: finalRoles },
    ], `Creación de usuario ${user.usuario}`);

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

    const cambios: { campo: string; valorAnterior: unknown; valorNuevo: unknown }[] = [];
    const oldUser = await User.findById(id).select('-contrasena');
    if (oldUser) {
      for (const key of Object.keys(updates)) {
        if (key === 'contrasena') continue;
        const oldVal = (oldUser as any)[key];
        const newVal = updates[key];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          cambios.push({ campo: key, valorAnterior: oldVal, valorNuevo: newVal });
        }
      }
    }
    if (cambios.length > 0) {
      await logAudit(req, 'actualizar_usuario', user._id.toString(), cambios, `Actualización de usuario ${user.usuario}`);
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
    const oldActivo = user.activo;
    user.activo = !user.activo;
    await user.save();
    await logAudit(req, user.activo ? 'activar_usuario' : 'desactivar_usuario', user._id.toString(), [
      { campo: 'activo', valorAnterior: oldActivo, valorNuevo: user.activo },
    ], `Usuario ${user.activo ? 'activado' : 'desactivado'}: ${user.usuario}`);
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

    const oldUser = await User.findById(id);
    if (!oldUser) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    const oldRoles = [...oldUser.roles];
    oldUser.roles = filtered;
    await oldUser.save();
    await logAudit(req, 'actualizar_roles', oldUser._id.toString(), [
      { campo: 'roles', valorAnterior: oldRoles, valorNuevo: filtered },
    ], `Roles actualizados para ${oldUser.usuario}: ${oldRoles.join(', ')} → ${filtered.join(', ')}`);

    const { contrasena: _removed, ...rest } = oldUser.toObject();
    res.json(rest);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

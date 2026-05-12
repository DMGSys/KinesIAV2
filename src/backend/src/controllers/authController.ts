import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { usuario, contrasena, nombre, apellido, correo, celular } = req.body;

    if (!usuario || !contrasena || !nombre || !apellido || !correo || !celular) {
      res.status(400).json({ message: 'Todos los campos son requeridos' });
      return;
    }

    const existingUser = await User.findOne({
      $or: [{ usuario }, { correo }]
    });

    if (existingUser) {
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
      activo: true
    });

    await user.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
      return;
    }

    const user = await User.findOne({ usuario, activo: true });

    if (!user) {
      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
      return;
    }

    const isMatch = await bcrypt.compare(contrasena, user.contrasena);

    if (!isMatch) {
      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
      return;
    }

    const token = generateToken(user._id.toString(), user.usuario);

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
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    const user = await User.findById(userId).select('-contrasena');
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
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const recoverPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { correo, nuevaContrasena } = req.body;

    if (!correo || !nuevaContrasena) {
      res.status(400).json({ message: 'Correo y nueva contraseña son requeridos' });
      return;
    }

    const user = await User.findOne({ correo });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
    user.contrasena = hashedPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
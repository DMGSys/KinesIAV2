import mongoose, { Document, Schema } from 'mongoose';

export const ROLES = ['admin', 'kinesiologo', 'secretario'] as const;
export type Rol = typeof ROLES[number];

export interface IUser extends Document {
  usuario: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  activo: boolean;
  roles: Rol[];
}

const userSchema = new Schema<IUser>({
  usuario: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  celular: { type: String, required: true },
  activo: { type: Boolean, default: true },
  roles: { type: [String], enum: ROLES, default: ['kinesiologo'] }
});

export const User = mongoose.model<IUser>('User', userSchema);
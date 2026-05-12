import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  usuario: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  activo: boolean;
  rol: 'admin' | 'kinesiologo';
}

const userSchema = new Schema<IUser>({
  usuario: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  celular: { type: String, required: true },
  activo: { type: Boolean, default: true },
  rol: { type: String, enum: ['admin', 'kinesiologo'], default: 'kinesiologo' }
});

export const User = mongoose.model<IUser>('User', userSchema);
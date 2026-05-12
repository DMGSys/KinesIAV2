import mongoose, { Document, Schema } from 'mongoose';

export interface IEvolucion extends Document {
  pacienteId: string;
  fecha: string;
  sesion: number;
  kinesiologo: string;
  contenido: string;
  tipo: 'escrita' | 'audio';
  usuarioId: mongoose.Types.ObjectId;
}

const evolucionSchema = new Schema<IEvolucion>({
  pacienteId: { type: String, required: true },
  fecha: { type: String, required: true },
  sesion: { type: Number, required: true },
  kinesiologo: { type: String, required: true },
  contenido: { type: String, required: true },
  tipo: { type: String, enum: ['escrita', 'audio'], default: 'escrita' },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'User' }
});

export const Evolucion = mongoose.model<IEvolucion>('Evolucion', evolucionSchema);
import mongoose, { Document, Schema } from 'mongoose';

export interface ITurno extends Document {
  pacienteId: mongoose.Types.ObjectId;
  profesionalId: mongoose.Types.ObjectId;
  creadoPor: mongoose.Types.ObjectId;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'pendiente' | 'confirmado' | 'en_curso' | 'completado' | 'cancelado';
  notas: string;
  notificarPor: ('wa' | 'email' | 'ambos')[];
  notificadoCreacion: boolean;
  notificadoModificacion: boolean;
}

const turnoSchema = new Schema<ITurno>({
  pacienteId: { type: Schema.Types.ObjectId, ref: 'Paciente', required: true },
  profesionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  creadoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fecha: { type: String, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  estado: { type: String, enum: ['pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado'], default: 'pendiente' },
  notas: { type: String, default: '' },
  notificarPor: { type: [String], enum: ['wa', 'email', 'ambos'], default: [] },
  notificadoCreacion: { type: Boolean, default: false },
  notificadoModificacion: { type: Boolean, default: false },
}, { timestamps: true });

export const Turno = mongoose.model<ITurno>('Turno', turnoSchema);

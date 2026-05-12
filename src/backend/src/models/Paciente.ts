import mongoose, { Document, Schema } from 'mongoose';

export interface IPaciente extends Document {
  id: string;
  nombre: string;
  edad: number;
  dni: string;
  telefono: string;
  email: string;
  obraSocial: string;
  nroAfiliado: string;
  diagnostico: string;
  medicoDerivante: string;
  fechaIngreso: string;
  sesionesTotales: number;
  sesionesRealizadas: number;
  antecedentes: string;
  alergias: string;
  medicacion: string;
  usuarioId: mongoose.Types.ObjectId;
}

const pacienteSchema = new Schema<IPaciente>({
  id: { type: String, required: true },
  nombre: { type: String, required: true },
  edad: { type: Number, required: true },
  dni: { type: String, required: true },
  telefono: { type: String, required: true },
  email: { type: String, required: true },
  obraSocial: { type: String, required: true },
  nroAfiliado: { type: String, required: true },
  diagnostico: { type: String, required: true },
  medicoDerivante: { type: String, required: true },
  fechaIngreso: { type: String, required: true },
  sesionesTotales: { type: Number, required: true },
  sesionesRealizadas: { type: Number, required: true },
  antecedentes: { type: String, default: '' },
  alergias: { type: String, default: '' },
  medicacion: { type: String, default: '' },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'User' }
});

export const Paciente = mongoose.model<IPaciente>('Paciente', pacienteSchema);
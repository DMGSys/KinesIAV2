import mongoose, { Document, Schema } from 'mongoose';

export interface ICambio {
  campo: string;
  valorAnterior: unknown;
  valorNuevo: unknown;
}

export interface IAuditLog extends Document {
  usuarioId: mongoose.Types.ObjectId;
  usuarioNombre: string;
  accion: string;
  coleccion: string;
  documentoId: mongoose.Types.ObjectId;
  cambios: ICambio[];
  descripcion: string;
}

const auditLogSchema = new Schema<IAuditLog>({
  usuarioId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  usuarioNombre: { type: String, required: true },
  accion: { type: String, required: true },
  coleccion: { type: String, required: true },
  documentoId: { type: Schema.Types.ObjectId, required: true },
  cambios: [{
    campo: String,
    valorAnterior: Schema.Types.Mixed,
    valorNuevo: Schema.Types.Mixed,
  }],
  descripcion: { type: String, default: '' },
}, { timestamps: true });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

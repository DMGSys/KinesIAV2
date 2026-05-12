import mongoose, { Document } from 'mongoose';
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
export declare const Paciente: mongoose.Model<IPaciente, {}, {}, {}, mongoose.Document<unknown, {}, IPaciente, {}, {}> & IPaciente & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Paciente.d.ts.map
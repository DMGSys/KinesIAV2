import mongoose, { Document } from 'mongoose';
export interface IEvolucion extends Document {
    pacienteId: string;
    fecha: string;
    sesion: number;
    kinesiologo: string;
    contenido: string;
    tipo: 'escrita' | 'audio';
    usuarioId: mongoose.Types.ObjectId;
}
export declare const Evolucion: mongoose.Model<IEvolucion, {}, {}, {}, mongoose.Document<unknown, {}, IEvolucion, {}, {}> & IEvolucion & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Evolucion.d.ts.map
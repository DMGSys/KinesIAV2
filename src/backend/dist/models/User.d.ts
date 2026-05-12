import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    usuario: string;
    contrasena: string;
    nombre: string;
    apellido: string;
    correo: string;
    celular: string;
    activo: boolean;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map
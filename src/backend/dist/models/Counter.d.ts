import mongoose, { Document } from 'mongoose';
export interface ICounter extends Document {
    key: string;
    seq: number;
}
export declare const Counter: mongoose.Model<ICounter, {}, {}, {}, mongoose.Document<unknown, {}, ICounter, {}, {}> & ICounter & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const getNextSequence: (key: string) => Promise<string>;
//# sourceMappingURL=Counter.d.ts.map
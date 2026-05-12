import mongoose, { Document, Schema } from 'mongoose';

export interface ICounter extends Document {
  key: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

export const Counter = mongoose.model<ICounter>('Counter', counterSchema);

export const getNextSequence = async (key: string): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `P-${String(counter!.seq).padStart(4, '0')}`;
};

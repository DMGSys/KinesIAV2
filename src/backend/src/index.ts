import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import pacienteRoutes from './routes/pacientes.js';
import evolucionRoutes from './routes/evoluciones.js';
import usuarioRoutes from './routes/usuarios.js';
import statsRoutes from './routes/stats.js';
import reportesRoutes from './routes/reportes.js';
import transcripcionRoutes from './routes/transcripcion.js';
import turnoRoutes from './routes/turnos.js';
import auditRoutes from './routes/audit.js';
import { User } from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

connectDB();

// Migrar usuarios con rol (string) → roles (array)
setTimeout(async () => {
  try {
    const pending = await User.find({ roles: { $exists: false } }).lean();
    for (const user of pending) {
      const oldRol = (user as any).rol || 'kinesiologo';
      await User.updateOne({ _id: user._id }, { $set: { roles: [oldRol] } });
    }
    if (pending.length > 0) {
      console.log(`Migrados ${pending.length} usuarios: rol → roles`);
    }
  } catch (e) {
    // migración silenciosa
  }
}, 1000);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'KinesIA API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/evoluciones', evolucionRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/transcribir', transcripcionRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/audit', auditRoutes);

app.listen(PORT, () => {
  console.log(`KinesIA Backend running on port ${PORT}`);
});
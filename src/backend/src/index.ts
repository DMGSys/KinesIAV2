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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

connectDB();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'KinesIA API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/evoluciones', evolucionRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reportes', reportesRoutes);

app.listen(PORT, () => {
  console.log(`KinesIA Backend running on port ${PORT}`);
});
import { Response } from 'express';
import { Paciente } from '../models/Paciente.js';
import { User } from '../models/User.js';
import { Evolucion } from '../models/Evolucion.js';
import { AuthRequest } from '../middleware/auth.js';

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const totalPacientes = await Paciente.countDocuments({ usuarioId: userId });
    const totalKinesiologos = await User.countDocuments({ rol: 'kinesiologo' });
    const totalAdmin = await User.countDocuments({ rol: 'admin' });
    const totalEvoluciones = await Evolucion.countDocuments({ usuarioId: userId });

    const pacientesRecientes = await Paciente.find({ usuarioId: userId })
      .sort({ _id: -1 })
      .limit(5)
      .select('id nombre diagnostico sesionesRealizadas sesionesTotales');

    const evolucionesUltimas = await Evolucion.find({ usuarioId: userId })
      .sort({ _id: -1 })
      .limit(5)
      .select('fecha sesion kinesiologo contenido');

    const sesionesCompletadas = await Paciente.aggregate([
      { $match: { usuarioId: userId } },
      { $group: { _id: null, total: { $sum: '$sesionesRealizadas' } } }
    ]);

    res.json({
      totalPacientes,
      totalKinesiologos,
      totalAdmin,
      totalEvoluciones,
      sesionesCompletadas: sesionesCompletadas[0]?.total || 0,
      pacientesRecientes,
      evolucionesUltimas
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

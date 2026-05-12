import { Request, Response } from 'express';
import { Evolucion } from '../models/Evolucion.js';
import { AuthRequest } from '../middleware/auth.js';

export const getEvoluciones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pacienteId } = req.query;
    const userId = req.user?.id;

    const query: Record<string, unknown> = { usuarioId: userId };
    if (pacienteId) {
      query.pacienteId = pacienteId as string;
    }

    const evoluciones = await Evolucion.find(query).sort({ sesion: -1 });
    res.json(evoluciones);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const createEvolucion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const evolucion = new Evolucion({ ...req.body, usuarioId: userId });
    await evolucion.save();
    res.status(201).json(evolucion);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const getEvolucionesDemo = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'demo';
  const demoEvoluciones = [
    {
      id: 1,
      pacienteId: 'P-001',
      fecha: '10/05/2026',
      sesion: 8,
      kinesiologo: 'Lic. María González',
      contenido: 'Paciente presenta mejoría en rango articular. Se trabajó flexión de rodilla 0-110° con resistencia. Toleró ejercicios de fortalecimiento de cuádriceps sin dolor significativo. Se指示 continue con protocolo de rehabilitación. EVA: 4/10 al finalizar.',
      tipo: 'audio' as const
    },
    {
      id: 2,
      pacienteId: 'P-001',
      fecha: '08/05/2026',
      sesion: 7,
      kinesiologo: 'Lic. María González',
      contenido: 'Sesión de electroterapia + ejercicios pasivos. Paciente refiere menor rigidez matutina. Se agregó trabajo de propiocepción en plataforma inestable. Sin eventos adversos.',
      tipo: 'escrita' as const
    },
    {
      id: 3,
      pacienteId: 'P-001',
      fecha: '05/05/2026',
      sesion: 6,
      kinesiologo: 'Lic. María González',
      contenido: 'Control de edema residual. Se iniciaron ejercicios de carga parcial con muletas. El paciente tolerancia 50% de peso sobre miembro inferior derecho. RX de control solicitada.',
      tipo: 'audio' as const
    }
  ];

  res.json(demoEvoluciones);
};

export const getSiguienteNumeroSesion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pacienteId } = req.params;
    const userId = req.user?.id;

    const ultimaEvolucion = await Evolucion.findOne({
      pacienteId,
      usuarioId: userId
    }).sort({ sesion: -1 });

    const siguienteSesion = ultimaEvolucion ? ultimaEvolucion.sesion + 1 : 1;
    res.json({ sesion: siguienteSesion });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
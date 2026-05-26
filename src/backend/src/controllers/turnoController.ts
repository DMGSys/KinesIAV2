import { Response } from 'express';
import { Turno } from '../models/Turno.js';
import { AuthRequest } from '../middleware/auth.js';
import { enviarEmail } from '../services/notificaciones.js';

export const getTurnos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.fecha) filter.fecha = req.query.fecha;
    if (req.query.profesionalId) filter.profesionalId = req.query.profesionalId;
    const turnos = await Turno.find(filter)
      .populate('pacienteId', 'nombre telefono email')
      .populate('profesionalId', 'nombre apellido')
      .sort({ fecha: 1, horaInicio: 1 });
    res.json(turnos);
  } catch {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const getTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turno = await Turno.findById(req.params.id)
      .populate('pacienteId', 'nombre telefono email')
      .populate('profesionalId', 'nombre apellido');
    if (!turno) {
      res.status(404).json({ message: 'Turno no encontrado' });
      return;
    }
    res.json(turno);
  } catch {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const createTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pacienteId, profesionalId, fecha, horaInicio, horaFin, notas, notificarPor } = req.body;
    if (!pacienteId || !profesionalId || !fecha || !horaInicio || !horaFin) {
      res.status(400).json({ message: 'Campos requeridos: pacienteId, profesionalId, fecha, horaInicio, horaFin' });
      return;
    }
    const turno = await Turno.create({
      pacienteId, profesionalId, creadoPor: req.user!.id, fecha, horaInicio, horaFin,
      notas: notas || '', notificarPor: notificarPor || [],
    });
    await dispararNotificaciones(turno._id.toString(), 'creacion');
    const populated = await Turno.findById(turno._id)
      .populate('pacienteId', 'nombre telefono email')
      .populate('profesionalId', 'nombre apellido');
    res.status(201).json(populated);
  } catch {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const updateTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates: Record<string, unknown> = { ...req.body };
    delete updates._id;
    const turno = await Turno.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('pacienteId', 'nombre telefono email')
      .populate('profesionalId', 'nombre apellido');
    if (!turno) {
      res.status(404).json({ message: 'Turno no encontrado' });
      return;
    }
    await dispararNotificaciones(turno._id.toString(), 'modificacion');
    res.json(turno);
  } catch {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const updateTurnoEstado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { estado } = req.body;
    const turno = await Turno.findByIdAndUpdate(req.params.id, { estado }, { new: true })
      .populate('pacienteId', 'nombre telefono email')
      .populate('profesionalId', 'nombre apellido');
    if (!turno) {
      res.status(404).json({ message: 'Turno no encontrado' });
      return;
    }
    res.json(turno);
  } catch {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const deleteTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turno = await Turno.findByIdAndDelete(req.params.id);
    if (!turno) {
      res.status(404).json({ message: 'Turno no encontrado' });
      return;
    }
    res.json({ message: 'Turno eliminado' });
  } catch {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

async function dispararNotificaciones(turnoId: string, tipo: 'creacion' | 'modificacion') {
  try {
    const turno = await Turno.findById(turnoId).populate('pacienteId', 'nombre telefono email');
    if (!turno || !turno.notificarPor.length) return;
    const paciente = turno.pacienteId as any;
    const mensaje = `Hola ${paciente.nombre}, tu turno de kinesiología fue ${tipo === 'creacion' ? 'agendado' : 'modificado'} para el ${turno.fecha} de ${turno.horaInicio} a ${turno.horaFin}.`;
    if (turno.notificarPor.includes('email') || turno.notificarPor.includes('ambos')) {
      await enviarEmail(paciente.email, 'Notificación de turno - KinesIA', mensaje);
    }
    const update: Record<string, unknown> = {};
    if (tipo === 'creacion') update.notificadoCreacion = true;
    else update.notificadoModificacion = true;
    await Turno.findByIdAndUpdate(turnoId, update);
  } catch (e) {
    console.error('Error al notificar:', e);
  }
}

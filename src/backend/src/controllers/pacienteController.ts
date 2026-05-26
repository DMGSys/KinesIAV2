import { Request, Response } from 'express';
import { Paciente } from '../models/Paciente.js';
import { Evolucion } from '../models/Evolucion.js';
import { Turno } from '../models/Turno.js';
import { AuthRequest } from '../middleware/auth.js';
import { getNextSequence } from '../models/Counter.js';

export const getPacientes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const pacientes = await Paciente.find({ usuarioId: userId });
    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const getPacienteById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const paciente = await Paciente.findOne({ id, usuarioId: userId });

    if (!paciente) {
      res.status(404).json({ message: 'Paciente no encontrado' });
      return;
    }

    res.json(paciente);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const createPaciente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const autoId = req.body.id === undefined || req.body.id === null || req.body.id === '';

    if (autoId) {
      const paciente = new Paciente({ ...req.body, id: await getNextSequence('pacientes'), usuarioId: userId });
      await paciente.save();
      res.status(201).json(paciente);
    } else {
      const paciente = new Paciente({ ...req.body, usuarioId: userId });
      await paciente.save();
      res.status(201).json(paciente);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const updatePaciente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const paciente = await Paciente.findOneAndUpdate(
      { id, usuarioId: userId },
      req.body,
      { new: true }
    );

    if (!paciente) {
      res.status(404).json({ message: 'Paciente no encontrado' });
      return;
    }

    res.json(paciente);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const getTimeline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const [evoluciones, turnos] = await Promise.all([
      Evolucion.find({ pacienteId: id, usuarioId: userId }).sort({ fecha: -1, sesion: -1 }).lean(),
      Turno.find({ pacienteId: id, creadoPor: userId }).sort({ fecha: -1, horaInicio: -1 }).lean(),
    ]);

    const timeline: any[] = [
      ...evoluciones.map(e => ({ ...e, _tipo: 'evolucion', _orden: e.fecha + 'T' + String(e.sesion).padStart(6, '0') })),
      ...turnos.map(t => ({ ...t, _tipo: 'turno', _orden: t.fecha + 'T' + (t.horaInicio || '00:00') })),
    ];
    timeline.sort((a, b) => b._orden.localeCompare(a._orden));

    res.json(timeline);
  } catch {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const updateSesiones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sesionesRealizadas } = req.body;
    const userId = req.user?.id;

    const paciente = await Paciente.findOneAndUpdate(
      { id, usuarioId: userId },
      { sesionesRealizadas },
      { new: true }
    );
    if (!paciente) {
      res.status(404).json({ message: 'Paciente no encontrado' });
      return;
    }
    res.json(paciente);
  } catch {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const getPacienteDemo = async (req: AuthRequest, res: Response): Promise<void> => {
  const demoPaciente = {
    id: 'P-001',
    nombre: 'Diego Gatica',
    edad: 45,
    dni: '20.147.063',
    telefono: '+54 11 1234-5678',
    email: 'diego.gatica@email.com',
    obraSocial: 'OSDE 210',
    nroAfiliado: '12345678',
    diagnostico: 'Lesión meniscal bilateral / Gonartrosis grado III. Posible candidato a artroplastia total de rodilla',
    medicoDerivante: 'Dr. Diego Ferro',
    fechaIngreso: '15/04/2025',
    sesionesTotales: 20,
    sesionesRealizadas: 8,
    antecedentes: 'Hipertensión arterial controlada con Losartán 50mg. Diabetes tipo 2 en control.',
    alergias: 'Penicilina (rash cutáneo)',
    medicacion: 'Losartán 50mg, Metformina 850mg, Ibuprofeno 400mg PRN'
  };
  res.json(demoPaciente);
};
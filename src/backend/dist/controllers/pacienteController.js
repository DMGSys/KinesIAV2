"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPacienteDemo = exports.updatePaciente = exports.createPaciente = exports.getPacienteById = exports.getPacientes = void 0;
const Paciente_js_1 = require("../models/Paciente.js");
const Counter_js_1 = require("../models/Counter.js");
const getPacientes = async (req, res) => {
    try {
        const userId = req.user?.id;
        const pacientes = await Paciente_js_1.Paciente.find({ usuarioId: userId });
        res.json(pacientes);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getPacientes = getPacientes;
const getPacienteById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const paciente = await Paciente_js_1.Paciente.findOne({ id, usuarioId: userId });
        if (!paciente) {
            res.status(404).json({ message: 'Paciente no encontrado' });
            return;
        }
        res.json(paciente);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getPacienteById = getPacienteById;
const createPaciente = async (req, res) => {
    try {
        const userId = req.user?.id;
        const autoId = req.body.id === undefined || req.body.id === null || req.body.id === '';
        if (autoId) {
            const paciente = new Paciente_js_1.Paciente({ ...req.body, id: await (0, Counter_js_1.getNextSequence)('pacientes'), usuarioId: userId });
            await paciente.save();
            res.status(201).json(paciente);
        }
        else {
            const paciente = new Paciente_js_1.Paciente({ ...req.body, usuarioId: userId });
            await paciente.save();
            res.status(201).json(paciente);
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createPaciente = createPaciente;
const updatePaciente = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const paciente = await Paciente_js_1.Paciente.findOneAndUpdate({ id, usuarioId: userId }, req.body, { new: true });
        if (!paciente) {
            res.status(404).json({ message: 'Paciente no encontrado' });
            return;
        }
        res.json(paciente);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updatePaciente = updatePaciente;
const getPacienteDemo = async (req, res) => {
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
exports.getPacienteDemo = getPacienteDemo;
//# sourceMappingURL=pacienteController.js.map
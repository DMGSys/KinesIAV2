"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSiguienteNumeroSesion = exports.getEvolucionesDemo = exports.createEvolucion = exports.getEvoluciones = void 0;
const Evolucion_js_1 = require("../models/Evolucion.js");
const getEvoluciones = async (req, res) => {
    try {
        const { pacienteId } = req.query;
        const userId = req.user?.id;
        const query = { usuarioId: userId };
        if (pacienteId) {
            query.pacienteId = pacienteId;
        }
        const evoluciones = await Evolucion_js_1.Evolucion.find(query).sort({ sesion: -1 });
        res.json(evoluciones);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getEvoluciones = getEvoluciones;
const createEvolucion = async (req, res) => {
    try {
        const userId = req.user?.id;
        const evolucion = new Evolucion_js_1.Evolucion({ ...req.body, usuarioId: userId });
        await evolucion.save();
        res.status(201).json(evolucion);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createEvolucion = createEvolucion;
const getEvolucionesDemo = async (req, res) => {
    const userId = req.user?.id || 'demo';
    const demoEvoluciones = [
        {
            id: 1,
            pacienteId: 'P-001',
            fecha: '10/05/2026',
            sesion: 8,
            kinesiologo: 'Lic. María González',
            contenido: 'Paciente presenta mejoría en rango articular. Se trabajó flexión de rodilla 0-110° con resistencia. Toleró ejercicios de fortalecimiento de cuádriceps sin dolor significativo. Se指示 continue con protocolo de rehabilitación. EVA: 4/10 al finalizar.',
            tipo: 'audio'
        },
        {
            id: 2,
            pacienteId: 'P-001',
            fecha: '08/05/2026',
            sesion: 7,
            kinesiologo: 'Lic. María González',
            contenido: 'Sesión de electroterapia + ejercicios pasivos. Paciente refiere menor rigidez matutina. Se agregó trabajo de propiocepción en plataforma inestable. Sin eventos adversos.',
            tipo: 'escrita'
        },
        {
            id: 3,
            pacienteId: 'P-001',
            fecha: '05/05/2026',
            sesion: 6,
            kinesiologo: 'Lic. María González',
            contenido: 'Control de edema residual. Se iniciaron ejercicios de carga parcial con muletas. El paciente tolerancia 50% de peso sobre miembro inferior derecho. RX de control solicitada.',
            tipo: 'audio'
        }
    ];
    res.json(demoEvoluciones);
};
exports.getEvolucionesDemo = getEvolucionesDemo;
const getSiguienteNumeroSesion = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const userId = req.user?.id;
        const ultimaEvolucion = await Evolucion_js_1.Evolucion.findOne({
            pacienteId,
            usuarioId: userId
        }).sort({ sesion: -1 });
        const siguienteSesion = ultimaEvolucion ? ultimaEvolucion.sesion + 1 : 1;
        res.json({ sesion: siguienteSesion });
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getSiguienteNumeroSesion = getSiguienteNumeroSesion;
//# sourceMappingURL=evolucionController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = void 0;
const Paciente_js_1 = require("../models/Paciente.js");
const User_js_1 = require("../models/User.js");
const Evolucion_js_1 = require("../models/Evolucion.js");
const getStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        const totalPacientes = await Paciente_js_1.Paciente.countDocuments({ usuarioId: userId });
        const totalKinesiologos = await User_js_1.User.countDocuments({ rol: 'kinesiologo' });
        const totalAdmin = await User_js_1.User.countDocuments({ rol: 'admin' });
        const totalEvoluciones = await Evolucion_js_1.Evolucion.countDocuments({ usuarioId: userId });
        const pacientesRecientes = await Paciente_js_1.Paciente.find({ usuarioId: userId })
            .sort({ _id: -1 })
            .limit(5)
            .select('id nombre diagnostico sesionesRealizadas sesionesTotales');
        const evolucionesUltimas = await Evolucion_js_1.Evolucion.find({ usuarioId: userId })
            .sort({ _id: -1 })
            .limit(5)
            .select('fecha sesion kinesiologo contenido');
        const sesionesCompletadas = await Paciente_js_1.Paciente.aggregate([
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getStats = getStats;
//# sourceMappingURL=statsController.js.map
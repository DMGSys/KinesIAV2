"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paciente = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const pacienteSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    nombre: { type: String, required: true },
    edad: { type: Number, required: true },
    dni: { type: String, required: true },
    telefono: { type: String, required: true },
    email: { type: String, required: true },
    obraSocial: { type: String, required: true },
    nroAfiliado: { type: String, required: true },
    diagnostico: { type: String, required: true },
    medicoDerivante: { type: String, required: true },
    fechaIngreso: { type: String, required: true },
    sesionesTotales: { type: Number, required: true },
    sesionesRealizadas: { type: Number, required: true },
    antecedentes: { type: String, default: '' },
    alergias: { type: String, default: '' },
    medicacion: { type: String, default: '' },
    usuarioId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
});
exports.Paciente = mongoose_1.default.model('Paciente', pacienteSchema);
//# sourceMappingURL=Paciente.js.map
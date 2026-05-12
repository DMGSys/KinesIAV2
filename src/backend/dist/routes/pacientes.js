"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pacienteController_js_1 = require("../controllers/pacienteController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/demo', auth_js_1.authMiddleware, pacienteController_js_1.getPacienteDemo);
router.get('/', auth_js_1.authMiddleware, pacienteController_js_1.getPacientes);
router.get('/:id', auth_js_1.authMiddleware, pacienteController_js_1.getPacienteById);
router.post('/', auth_js_1.authMiddleware, pacienteController_js_1.createPaciente);
router.put('/:id', auth_js_1.authMiddleware, pacienteController_js_1.updatePaciente);
exports.default = router;
//# sourceMappingURL=pacientes.js.map
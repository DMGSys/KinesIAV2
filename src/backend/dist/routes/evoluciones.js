"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const evolucionController_js_1 = require("../controllers/evolucionController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/demo', auth_js_1.authMiddleware, evolucionController_js_1.getEvolucionesDemo);
router.get('/next/:pacienteId', auth_js_1.authMiddleware, evolucionController_js_1.getSiguienteNumeroSesion);
router.get('/', auth_js_1.authMiddleware, evolucionController_js_1.getEvoluciones);
router.post('/', auth_js_1.authMiddleware, evolucionController_js_1.createEvolucion);
exports.default = router;
//# sourceMappingURL=evoluciones.js.map
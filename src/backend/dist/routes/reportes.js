"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pdfController_js_1 = require("../controllers/pdfController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authMiddleware);
router.get('/paciente/:id', pdfController_js_1.generatePatientPDF);
exports.default = router;
//# sourceMappingURL=reportes.js.map
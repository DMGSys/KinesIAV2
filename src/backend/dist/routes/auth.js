"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_js_1 = require("../controllers/authController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.post('/register', authController_js_1.register);
router.post('/login', authController_js_1.login);
router.post('/recover', authController_js_1.recoverPassword);
router.get('/me', auth_js_1.authMiddleware, authController_js_1.getMe);
exports.default = router;
//# sourceMappingURL=auth.js.map
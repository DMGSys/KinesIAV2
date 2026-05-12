"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_js_1 = require("../controllers/userController.js");
const auth_js_1 = require("../middleware/auth.js");
const adminMiddleware_js_1 = require("../middleware/adminMiddleware.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authMiddleware);
router.use(adminMiddleware_js_1.adminMiddleware);
router.get('/', userController_js_1.getUsers);
router.get('/:id', userController_js_1.getUserById);
router.post('/', userController_js_1.createUser);
router.put('/:id', userController_js_1.updateUser);
router.delete('/:id', userController_js_1.deleteUser);
router.patch('/:id/toggle', userController_js_1.toggleUserActive);
exports.default = router;
//# sourceMappingURL=usuarios.js.map
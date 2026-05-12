"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statsController_js_1 = require("../controllers/statsController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authMiddleware);
router.get('/', statsController_js_1.getStats);
exports.default = router;
//# sourceMappingURL=stats.js.map
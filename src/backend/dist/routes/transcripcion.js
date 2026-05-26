"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const transcripcionController_js_1 = require("../controllers/transcripcionController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.use(auth_js_1.authMiddleware);
router.post('/', upload.single('audio'), transcripcionController_js_1.transcribirAudio);
exports.default = router;
//# sourceMappingURL=transcripcion.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = __importDefault(require("./config/db.js"));
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const pacientes_js_1 = __importDefault(require("./routes/pacientes.js"));
const evoluciones_js_1 = __importDefault(require("./routes/evoluciones.js"));
const usuarios_js_1 = __importDefault(require("./routes/usuarios.js"));
const stats_js_1 = __importDefault(require("./routes/stats.js"));
const reportes_js_1 = __importDefault(require("./routes/reportes.js"));
const transcripcion_js_1 = __importDefault(require("./routes/transcripcion.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
(0, db_js_1.default)();
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'KinesIA API running' });
});
app.use('/api/auth', auth_js_1.default);
app.use('/api/pacientes', pacientes_js_1.default);
app.use('/api/evoluciones', evoluciones_js_1.default);
app.use('/api/usuarios', usuarios_js_1.default);
app.use('/api/stats', stats_js_1.default);
app.use('/api/reportes', reportes_js_1.default);
app.use('/api/transcribir', transcripcion_js_1.default);
app.listen(PORT, () => {
    console.log(`KinesIA Backend running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map
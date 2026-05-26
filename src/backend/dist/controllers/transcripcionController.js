"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribirAudio = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const WHISPER_URL = process.env.WHISPER_URL || 'http://whisper:9000';
const TMP_DIR = '/tmp/audio';
const transcribirAudio = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'Archivo de audio requerido' });
            return;
        }
        fs_1.default.mkdirSync(TMP_DIR, { recursive: true });
        const id = crypto_1.default.randomUUID();
        const webmPath = path_1.default.join(TMP_DIR, `${id}.webm`);
        const wavPath = path_1.default.join(TMP_DIR, `${id}.wav`);
        fs_1.default.writeFileSync(webmPath, req.file.buffer);
        (0, child_process_1.execSync)(`ffmpeg -y -i "${webmPath}" -ar 16000 -ac 1 -sample_fmt s16 "${wavPath}"`, {
            stdio: 'pipe',
            timeout: 30000,
        });
        const wavBuffer = fs_1.default.readFileSync(wavPath);
        const whisperRes = await axios_1.default.post(`${WHISPER_URL}/inference`, wavBuffer, {
            headers: { 'Content-Type': 'audio/wav' },
            timeout: 60000,
        });
        fs_1.default.unlinkSync(webmPath);
        fs_1.default.unlinkSync(wavPath);
        const texto = whisperRes.data?.text || whisperRes.data?.data?.text || '';
        res.json({ texto: texto.trim() });
    }
    catch (error) {
        res.status(500).json({ message: 'Error al transcribir audio', error: error.message });
    }
};
exports.transcribirAudio = transcribirAudio;
//# sourceMappingURL=transcripcionController.js.map
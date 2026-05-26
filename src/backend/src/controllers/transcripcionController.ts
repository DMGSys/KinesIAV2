import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import axios from 'axios';

const WHISPER_URL = process.env.WHISPER_URL || 'http://whisper:9000';

export const transcribirAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Archivo de audio requerido' });
      return;
    }

    const whisperRes = await axios.post(
      `${WHISPER_URL}/inference`,
      req.file.buffer,
      {
        headers: { 'Content-Type': 'audio/webm' },
        timeout: 120000,
      }
    );

    const texto = whisperRes.data?.text || '';
    res.json({ texto: texto.trim() });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al transcribir audio', error: error.message });
  }
};

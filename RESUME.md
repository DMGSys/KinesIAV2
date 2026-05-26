# KinesIA — Session Resume

**Fecha:** Mayo 2026
**Estado:** En Desarrollo — Transcripción IA real implementada
**Docker:** ✅ Corriendo (5/5 containers activos)

---

## Lo que se construyó

### Stack completo

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript + MongoDB (Mongoose 8)
- **PDF:** PDFKit
- **Auth:** JWT (5 min) + bcrypt (10 rounds) + roles admin/kinesiologo
- **STT:** faster-whisper (Whisper base, open-source, local)
- **Docker:** 5 servicios (nginx, frontend, backend, whisper, mongodb)

### Features implementadas

| Feature                                                            | Estado |
| ------------------------------------------------------------------ | ------ |
| Login / Registro / Recuperación                                   | ✅     |
| Roles admin/kinesiologo                                            | ✅     |
| Auto-ID secuencial pacientes (P-0001, P-0002...)                   | ✅     |
| CRUD pacientes                                                     | ✅     |
| Historial de evoluciones por paciente                              | ✅     |
| Grabadora de voz (getUserMedia, idle→grabando→procesando→listo) | ✅     |
| Transcripción real con Whisper (faster-whisper, modelo base)      | ✅     |
| Simulación IA (textos pregenerados, fallback)                     | ✅     |
| Panel Admin (Stats + Gestión de usuarios)                         | ✅     |
| Exportar PDF por paciente (historia clínica completa)             | ✅     |
| Contenedores Docker                                                | ✅     |

### Archivos nuevos/modificados

**Nuevos:**

- `src/whisper/Dockerfile` — servicio whisper con faster-whisper + Flask
- `src/whisper/server.py` — HTTP server para transcripción de audio
- `src/backend/src/controllers/transcripcionController.ts` — recibe audio del frontend, llama a whisper
- `src/backend/src/routes/transcripcion.ts` — POST /api/transcribir con multer

**Modificados:**

- `docker-compose.yml` — agregado servicio `whisper`, `WHISPER_URL` env en backend
- `src/backend/Dockerfile` — agregado ffmpeg para conversión de audio
- `src/backend/package.json` — agregado axios, multer, @types/multer
- `src/backend/src/index.ts` — agregada ruta `/api/transcribir`
- `src/frontend/nginx.conf` — agregado `client_max_body_size 10M`
- `src/frontend/src/pages/PacientePage.tsx` — `processAudio` envía blob real al backend

---

## Estado actual

```
Contenedores activos:
  kinesia-nginx      → http://localhost:80       (frontend producción)
  kinesia-frontend   → http://localhost:5173    (Vite dev, no usado)
  kinesia-backend    → http://localhost:3001     (API REST)
  kinesia-whisper    → http://localhost:9000     (STT whisper)
  kinesia-mongodb    → localhost:27017          (DB, solo en Docker network)

Imágenes: kinesia2-nginx, kinesia2-frontend, kinesia2-backend, kinesia2-whisper
```

### Pipeline de transcripción

```
Frontend (MediaRecorder, audio/webm)
  → POST /api/transcribir (multipart: audio)
  → Backend reenvía a http://whisper:9000/inference
  → Whisper: ffmpeg webm→wav + faster-whisper inference (modelo base)
  → Backend devuelve { texto: "..." }
  → Frontend muestra transcripción editable
```

---

## Issues conocidos

1. **Stats admin filtran por userId** — Muestran 0 pacientes/evoluciones porque filtran por `usuarioId` propio. Deberían ser globales para admin.
2. **PDF route** — La ruta real es `/api/reportes/paciente/:id` (sin `/pdf`). El frontend ya la usa correctamente.

---

## Para retomar

### Próximos pasos posibles

1. **Mejoras UI:**
   - Estados de carga (spinners) en todas las operaciones async
   - Validación de formularios más robusta
   - Notificaciones toast para feedback
2. **Search/filtrado avanzado:**
   - Búsqueda por nombre/dni/obra social en dashboard
3. **Reconstruir Docker** si hay cambios pendientes:
   ```
   docker-compose down && docker-compose up -d --build
   ```

### Archivos importantes para leer al retomar

| Archivo                                                    | Para qué                                     |
| ---------------------------------------------------------- | --------------------------------------------- |
| `src/frontend/src/pages/PacientePage.tsx`                | Ficha paciente + evolución + PDF + grabadora |
| `src/whisper/server.py`                                  | Servicio de transcripción whisper            |
| `src/backend/src/controllers/transcripcionController.ts` | Proxy backend → whisper                      |
| `src/backend/src/controllers/pdfController.ts`           | Lógica de generación PDF                    |
| `src/frontend/src/lib/api.ts`                            | Axios + auth + getToken                       |
| `README.md`                                              | Documentación completa del proyecto          |

### Comandos útiles# Ver estado

```powershell
docker ps

# Logs del backend
docker logs kinesia-backend --tail 50 -f

# Logs del whisper
docker logs kinesia-whisper --tail 50 -f

# Reiniciar todo
docker-compose down && docker-compose up -d --build

# Verificar que funciona
curl http://localhost/api/health

# Test transcripción (desde backend container)
docker exec kinesia-backend sh -c "ffmpeg -y -f lavfi -i anullsrc -t 2 -c:a libopus /tmp/test.webm && curl -s -X POST http://whisper:9000/inference --data-binary @/tmp/test.webm"
```

---

*Última actualización: Mayo 2026*

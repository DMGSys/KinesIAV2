# KinesIA — Agenda de Turnos

**Fecha:** 2026-05-26  
**Status:** Design approved, pending implementation  
**Stack:** React + Vite · TypeScript · Tailwind CSS · Node.js/Express · MongoDB · Docker Compose · @fullcalendar/react · Nodemailer

---

## 1. Modelo de datos: Turno

```typescript
interface ITurno {
  pacienteId: ObjectId;           // FK → Paciente
  profesionalId: ObjectId;        // FK → User (kinesiólogo)
  creadoPor: ObjectId;            // FK → User (secretario/kinesiólogo que creó)
  fecha: string;                  // YYYY-MM-DD
  horaInicio: string;             // HH:mm
  horaFin: string;                // HH:mm
  estado: 'pendiente' | 'confirmado' | 'en_curso' | 'completado' | 'cancelado';
  notas: string;
  notificarPor: ('wa' | 'email' | 'ambos')[];
  notificadoCreacion: boolean;
  notificadoModificacion: boolean;
}
```

### Schema Mongoose

```typescript
const turnoSchema = new Schema<ITurno>({
  pacienteId: { type: Schema.Types.ObjectId, ref: 'Paciente', required: true },
  profesionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  creadoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fecha: { type: String, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  estado: { type: String, enum: ['pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado'], default: 'pendiente' },
  notas: { type: String, default: '' },
  notificarPor: { type: [String], enum: ['wa', 'email'], default: [] },
  notificadoCreacion: { type: Boolean, default: false },
  notificadoModificacion: { type: Boolean, default: false },
}, { timestamps: true });
```

---

## 2. Endpoints API

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/turnos` | GET | Lista turnos (filterable por fecha, profesional) | JWT |
| `/api/turnos` | POST | Crear turno + dispara notificaciones | JWT |
| `/api/turnos/:id` | GET | Detalle turno | JWT |
| `/api/turnos/:id` | PUT | Actualizar turno + dispara notificaciones si cambió | JWT |
| `/api/turnos/:id` | PATCH | Cambiar estado | JWT |
| `/api/turnos/:id` | DELETE | Eliminar turno | JWT |

---

## 3. Frontend — UI

### Librería
- `@fullcalendar/react` + `@fullcalendar/daygrid` (vista mensual) + `@fullcalendar/timegrid` (vista semanal)
- Vista por defecto: mensual. Toggle a semanal.

### Componentes nuevos
- **`AgendaPage`** (`/agenda`) — ruta protegida (`/agenda` en App.tsx)
  - Header con logo + volver a dashboard
  - FullCalendar con eventos de turnos
  - Click en fecha vacía → modal "Nuevo turno"
  - Click en turno existente → modal "Editar turno"
  - Botón de toggle mes/semana
- **`TurnoModal`** — modal de creación/edición
  - Selector de paciente (búsqueda con autocomplete)
  - Selector de profesional (kinesiólogo)
  - Date picker + hora inicio/fin
  - Estado (solo en edición)
  - Notas (textarea)
  - Checkboxes: "Notificar por WhatsApp" / "Notificar por Email"
  - Botones: Guardar / Cancelar

### Navegación
- Link en DashboardPage header (junto a "Panel Admin", visible para kinesiólogos y secretarios)
- Ruta: `/agenda`

---

## 4. Notificaciones

### WhatsApp
- Al crear o modificar, si el usuario seleccionó WA, se genera:
  `https://wa.me/549{codigoAreaPaciente}?text={mensajeUrlEncoded}`
- Se abre en una nueva pestaña del navegador
- El mensaje incluye: datos del turno (fecha, hora, profesional, paciente)

### Email
- Vía Nodemailer (backend). Se envía desde el backend después de crear/modificar el turno.
- Se necesita configurar un transporte SMTP (env vars).
- Si el usuario no configura SMTP, el email se skipea silenciosamente.

### Comportamiento
- Las notificaciones se disparan **después** de la creación/modificación exitosa
- Si falla el envío de email, no se bloquea la creación del turno (log del error nomás)
- WA se abre en frontend (no requiere backend)
- Se marca `notificadoCreacion` o `notificadoModificacion: true` en el documento

---

## 5. Modelo Paciente — campos necesarios

Se necesita agregar `telefono` (ya existe) y `email` (ya existe) para las notificaciones. Ambos ya están en el modelo Paciente actual. Para WA se usa el código de país + el teléfono del paciente.

Asumimos: los teléfonos tienen formato argentino (`11XXXXXXXX`). Se arma el link como `549` + teléfono (sin el 15).

---

## 6. Consideraciones

- `@fullcalendar` se instala via npm. Es una dependencia solo del frontend.
- Nodemailer se instala en backend. No requiere APIs externas.
- Los turnos se asignan a un profesional específico; el calendario puede filtrar por profesional.
- La agenda es visible para kinesiólogos y secretarios (no solo admin).
- Las notificaciones no son en tiempo real — son acciones manuales del secretario al crear/modificar.

---

## 7. Archivos a modificar/crear

**Backend (nuevos):**
- `src/backend/src/models/Turno.ts`
- `src/backend/src/controllers/turnoController.ts`
- `src/backend/src/routes/turnos.ts`
- `src/backend/src/services/notificaciones.ts` (lógica de WA link + Nodemailer)

**Backend (modificar):**
- `src/backend/src/index.ts` (registrar ruta `/api/turnos`)
- `.env` (agregar config SMTP opcional)

**Frontend (nuevos):**
- `src/frontend/src/pages/AgendaPage.tsx`
- `src/frontend/src/components/TurnoModal.tsx`

**Frontend (modificar):**
- `src/frontend/src/App.tsx` (agregar ruta `/agenda`)
- `src/frontend/src/pages/DashboardPage.tsx` (link a agenda)
- `src/frontend/src/lib/api.ts` (si hace falta)
- `package.json` (agregar `@fullcalendar/*`)

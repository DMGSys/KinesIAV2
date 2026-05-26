# Agenda de Turnos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add agenda/scheduling module with calendar UI, full CRUD for turnos, and notifications via WhatsApp (wa.me link) and Nodemailer.

**Architecture:** New `Turno` model in MongoDB, REST endpoints under `/api/turnos`, frontend page with FullCalendar (+ month/week views). Notifications fire on create/update: WA link opens in browser tab, email sent via Nodemailer (SKIP if SMTP not configured).

**Tech Stack:** @fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/timegrid, Nodemailer, existing React/TS/Tailwind/Express/Mongoose stack.

---

### Task 1: Backend — Turno model

**Files:**
- Create: `src/backend/src/models/Turno.ts`

- [ ] **Create Turno model**

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface ITurno extends Document {
  pacienteId: mongoose.Types.ObjectId;
  profesionalId: mongoose.Types.ObjectId;
  creadoPor: mongoose.Types.ObjectId;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'pendiente' | 'confirmado' | 'en_curso' | 'completado' | 'cancelado';
  notas: string;
  notificarPor: ('wa' | 'email' | 'ambos')[];
  notificadoCreacion: boolean;
  notificadoModificacion: boolean;
}

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

export const Turno = mongoose.model<ITurno>('Turno', turnoSchema);
```

- [ ] **Commit**

```bash
git add src/backend/src/models/Turno.ts
git commit -m "feat: add Turno model"
```

---

### Task 2: Backend — Turno controller

**Files:**
- Create: `src/backend/src/controllers/turnoController.ts`

- [ ] **Create turno controller**

```typescript
import { Response } from 'express';
import { Turno } from '../models/Turno.js';
import { Paciente } from '../models/Paciente.js';
import { AuthRequest } from '../middleware/auth.js';
import { enviarEmail } from '../services/notificaciones.js';

export const getTurnos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.fecha) filter.fecha = req.query.fecha;
    if (req.query.profesionalId) filter.profesionalId = req.query.profesionalId;
    const turnos = await Turno.find(filter)
      .populate('pacienteId', 'nombre telefono email')
      .populate('profesionalId', 'nombre apellido')
      .sort({ fecha: 1, horaInicio: 1 });
    res.json(turnos);
  } catch { res.status(500).json({ message: 'Error en el servidor' }); }
};

export const getTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turno = await Turno.findById(req.params.id)
      .populate('pacienteId', 'nombre telefono email')
      .populate('profesionalId', 'nombre apellido');
    if (!turno) { res.status(404).json({ message: 'Turno no encontrado' }); return; }
    res.json(turno);
  } catch { res.status(500).json({ message: 'Error en el servidor' }); }
};

export const createTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pacienteId, profesionalId, fecha, horaInicio, horaFin, notas, notificarPor } = req.body;
    if (!pacienteId || !profesionalId || !fecha || !horaInicio || !horaFin) {
      res.status(400).json({ message: 'Campos requeridos: pacienteId, profesionalId, fecha, horaInicio, horaFin' }); return;
    }
    const turno = await Turno.create({
      pacienteId, profesionalId, creadoPor: req.user!.id, fecha, horaInicio, horaFin,
      notas: notas || '', notificarPor: notificarPor || [],
    });
    await dispararNotificaciones(turno._id.toString(), 'creacion');
    const populated = await Turno.findById(turno._id)
      .populate('pacienteId', 'nombre telefono email')
      .populate('profesionalId', 'nombre apellido');
    res.status(201).json(populated);
  } catch { res.status(500).json({ message: 'Error en el servidor' }); }
};

export const updateTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates: Record<string, unknown> = { ...req.body };
    delete updates._id;
    const turno = await Turno.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('pacienteId', 'nombre telefono email')
      .populate('profesionalId', 'nombre apellido');
    if (!turno) { res.status(404).json({ message: 'Turno no encontrado' }); return; }
    await dispararNotificaciones(turno._id.toString(), 'modificacion');
    res.json(turno);
  } catch { res.status(500).json({ message: 'Error en el servidor' }); }
};

export const updateTurnoEstado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { estado } = req.body;
    const turno = await Turno.findByIdAndUpdate(req.params.id, { estado }, { new: true })
      .populate('pacienteId', 'nombre telefono email')
      .populate('profesionalId', 'nombre apellido');
    if (!turno) { res.status(404).json({ message: 'Turno no encontrado' }); return; }
    res.json(turno);
  } catch { res.status(500).json({ message: 'Error en el servidor' }); }
};

export const deleteTurno = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const turno = await Turno.findByIdAndDelete(req.params.id);
    if (!turno) { res.status(404).json({ message: 'Turno no encontrado' }); return; }
    res.json({ message: 'Turno eliminado' });
  } catch { res.status(500).json({ message: 'Error en el servidor' }); }
};

async function dispararNotificaciones(turnoId: string, tipo: 'creacion' | 'modificacion') {
  try {
    const turno = await Turno.findById(turnoId).populate('pacienteId', 'nombre telefono email');
    if (!turno || !turno.notificarPor.length) return;
    const paciente = turno.pacienteId as any;
    const mensaje = `Hola ${paciente.nombre}, tu turno de kinesiología fue ${tipo === 'creacion' ? 'agendado' : 'modificado'} para el ${turno.fecha} de ${turno.horaInicio} a ${turno.horaFin}.`;
    if (turno.notificarPor.includes('wa') || turno.notificarPor.includes('ambos')) {
      // WA link is generated in frontend via wa.me URL
    }
    if (turno.notificarPor.includes('email') || turno.notificarPor.includes('ambos')) {
      await enviarEmail(paciente.email, 'Notificación de turno - KinesIA', mensaje);
    }
    const update: Record<string, unknown> = {};
    if (tipo === 'creacion') update.notificadoCreacion = true;
    else update.notificadoModificacion = true;
    await Turno.findByIdAndUpdate(turnoId, update);
  } catch (e) {
    console.error('Error al notificar:', e);
  }
}
```

- [ ] **Commit**

```bash
git add src/backend/src/controllers/turnoController.ts
git commit -m "feat: add Turno controller with CRUD + notifications"
```

---

### Task 3: Backend — Notificaciones service + routes

**Files:**
- Create: `src/backend/src/services/notificaciones.ts`
- Create: `src/backend/src/routes/turnos.ts`
- Modify: `src/backend/src/index.ts`

- [ ] **Create notificaciones service**

```typescript
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return transporter;
}

export async function enviarEmail(to: string, subject: string, text: string): Promise<void> {
  const t = getTransporter();
  if (!t) { console.warn('SMTP no configurado, email no enviado'); return; }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || 'noreply@kinesia.com', to, subject, text });
  } catch (e) {
    console.error('Error enviando email:', e);
  }
}
```

- [ ] **Create turnos route**

```typescript
import { Router } from 'express';
import { getTurnos, getTurno, createTurno, updateTurno, updateTurnoEstado, deleteTurno } from '../controllers/turnoController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getTurnos);
router.get('/:id', getTurno);
router.post('/', createTurno);
router.put('/:id', updateTurno);
router.patch('/:id/estado', updateTurnoEstado);
router.delete('/:id', deleteTurno);

export default router;
```

- [ ] **Register route in index.ts**

```typescript
import turnoRoutes from './routes/turnos.js';
// Add after other routes:
app.use('/api/turnos', turnoRoutes);
```

- [ ] **Install nodemailer**

Run: `cd src/backend && npm install nodemailer && npm install -D @types/nodemailer`

- [ ] **Commit**

```bash
git add src/backend/src/services/notificaciones.ts src/backend/src/routes/turnos.ts src/backend/src/index.ts src/backend/package.json src/backend/package-lock.json
git commit -m "feat: add notificaciones service + turnos route"
```

---

### Task 4: Frontend — Install FullCalendar + add lib

**Files:**
- Modify: `src/frontend/package.json`

- [ ] **Install FullCalendar packages**

Run: `cd src/frontend && npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction`

- [ ] **Commit**

```bash
git add src/frontend/package.json src/frontend/package-lock.json
git commit -m "feat: install @fullcalendar dependencies"
```

---

### Task 5: Frontend — AgendaPage + TurnoModal

**Files:**
- Create: `src/frontend/src/pages/AgendaPage.tsx`
- Create: `src/frontend/src/components/TurnoModal.tsx`

- [ ] **Create AgendaPage component**

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { api, getAuth } from '../lib/api';
import TurnoModal from '../components/TurnoModal';

interface TurnoEvent {
  _id: string;
  pacienteId: { _id: string; nombre: string; telefono: string; email: string };
  profesionalId: { _id: string; nombre: string; apellido: string };
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  notas: string;
  notificarPor: string[];
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: '#f59e0b',
  confirmado: '#3b82f6',
  en_curso: '#10b981',
  completado: '#6b7280',
  cancelado: '#ef4444',
};

export default function AgendaPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [turnos, setTurnos] = useState<TurnoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTurno, setEditTurno] = useState<TurnoEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => { loadTurnos(); }, []);

  const loadTurnos = async () => {
    try {
      const res = await api.get('/api/turnos');
      setTurnos(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const events = turnos.map(t => ({
    id: t._id,
    title: `${t.pacienteId?.nombre || '?'} - ${t.estado}`,
    start: `${t.fecha}T${t.horaInicio}`,
    end: `${t.fecha}T${t.horaFin}`,
    backgroundColor: ESTADO_COLORS[t.estado] || '#6b7280',
    borderColor: 'transparent',
    extendedProps: t,
  }));

  const handleDateClick = (info: { dateStr: string }) => {
    setSelectedDate(info.dateStr);
    setEditTurno(null);
    setShowModal(true);
  };

  const handleEventClick = (info: { event: { extendedProps: TurnoEvent } }) => {
    setEditTurno(info.event.extendedProps);
    setSelectedDate('');
    setShowModal(true);
  };

  const handleClose = () => { setShowModal(false); setEditTurno(null); };

  const handleSaved = () => { handleClose(); loadTurnos(); };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-primary">Agenda</h1>
          </div>
          <p className="text-sm text-slate-400">{auth?.user?.nombre}</p>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando...</div>
        ) : (
          <div className="card p-4">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              height="auto"
              locale="es"
              buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana' }}
            />
          </div>
        )}
      </main>
      {showModal && (
        <TurnoModal
          turno={editTurno}
          fechaInicial={selectedDate}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
```

- [ ] **Create TurnoModal component**

```typescript
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Props {
  turno: any | null;
  fechaInicial: string;
  onClose: () => void;
  onSaved: () => void;
}

const ESTADOS = ['pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado'] as const;

export default function TurnoModal({ turno, fechaInicial, onClose, onSaved }: Props) {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pacienteId: turno?.pacienteId?._id || '',
    profesionalId: turno?.profesionalId?._id || '',
    fecha: turno?.fecha || fechaInicial || '',
    horaInicio: turno?.horaInicio || '',
    horaFin: turno?.horaFin || '',
    estado: turno?.estado || 'pendiente',
    notas: turno?.notas || '',
    notificarPor: turno?.notificarPor || [] as string[],
  });

  useEffect(() => {
    Promise.all([
      api.get('/api/pacientes'),
      api.get('/api/usuarios'),
    ]).then(([pacRes, usrRes]) => {
      setPacientes(pacRes.data);
      setProfesionales(usrRes.data.filter((u: any) => u.roles.includes('kinesiologo')));
    }).catch(() => {});
  }, []);

  const toggleNotif = (ch: string) => {
    setForm(prev => ({
      ...prev,
      notificarPor: prev.notificarPor.includes(ch)
        ? prev.notificarPor.filter((x: string) => x !== ch)
        : prev.notificarPor.length === 1 && prev.notificarPor[0] !== ch
          ? [...prev.notificarPor, ch]
          : [ch],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (turno) {
        await api.put(`/api/turnos/${turno._id}`, form);
      } else {
        await api.post('/api/turnos', form);
      }
      onSaved();
    } catch {
      alert('Error al guardar turno');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{turno ? 'Editar turno' : 'Nuevo turno'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Paciente</label>
            <select className="input-field" value={form.pacienteId} onChange={e => setForm({...form, pacienteId: e.target.value})} required>
              <option value="">Seleccionar paciente...</option>
              {pacientes.map((p: any) => <option key={p._id || p.id} value={p._id || p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Kinesiólogo</label>
            <select className="input-field" value={form.profesionalId} onChange={e => setForm({...form, profesionalId: e.target.value})} required>
              <option value="">Seleccionar profesional...</option>
              {profesionales.map((u: any) => <option key={u._id} value={u._id}>{u.nombre} {u.apellido}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fecha</label>
            <input type="date" className="input-field" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Hora inicio</label>
              <input type="time" className="input-field" value={form.horaInicio} onChange={e => setForm({...form, horaInicio: e.target.value})} required />
            </div>
            <div>
              <label className="label">Hora fin</label>
              <input type="time" className="input-field" value={form.horaFin} onChange={e => setForm({...form, horaFin: e.target.value})} required />
            </div>
          </div>
          {turno && (
            <div>
              <label className="label">Estado</label>
              <select className="input-field" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Notas</label>
            <textarea className="input-field" rows={2} value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />
          </div>
          <div>
            <label className="label">Notificar al paciente</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.notificarPor.includes('wa')} onChange={() => toggleNotif('wa')} className="rounded border-slate-300" />
                WhatsApp
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.notificarPor.includes('email')} onChange={() => toggleNotif('email')} className="rounded border-slate-300" />
                Email
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className={`btn-primary flex-1 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {saving ? 'Guardando...' : (turno ? 'Actualizar turno' : 'Crear turno')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add src/frontend/src/pages/AgendaPage.tsx src/frontend/src/components/TurnoModal.tsx
git commit -m "feat: add AgendaPage + TurnoModal components"
```

---

### Task 6: Frontend — Route + navigation

**Files:**
- Modify: `src/frontend/src/App.tsx`
- Modify: `src/frontend/src/pages/DashboardPage.tsx`

- [ ] **Add route in App.tsx**

```typescript
import AgendaPage from './pages/AgendaPage';
// Add inside <Routes>:
<Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
```

- [ ] **Add link in DashboardPage header** — junto al botón "Panel Admin", visible para kinesiólogos y secretarios:

```typescript
{isAdmin && (
  <button onClick={() => navigate('/admin')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors">
    Panel Admin
  </button>
)}
{isKinesiologoOrSecretario && (
  <button onClick={() => navigate('/agenda')} className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full hover:bg-teal-200 transition-colors">
    Agenda
  </button>
)}
```

Donde `isKinesiologoOrSecretario` se define como:
```typescript
const userRoles = getAuth()?.user?.roles || [];
const isKinesiologoOrSecretario = userRoles.includes('kinesiologo') || userRoles.includes('secretario');
```

- [ ] **Commit**

```bash
git add src/frontend/src/App.tsx src/frontend/src/pages/DashboardPage.tsx
git commit -m "feat: add /agenda route and nav link"
```

---

### Task 7: WA notification — frontend after save

**Files:**
- Modify: `src/frontend/src/pages/AgendaPage.tsx`

- [ ] **After creating/updating a turno with WA notification, open wa.me link**

En `TurnoModal.tsx`, después de `onSaved()`, si el formulario tenía `notificarPor` con `'wa'` o `'ambos'`, abrir el link. Esto se puede hacer en el `onSaved` callback del `AgendaPage`:

```typescript
const handleSaved = (turnoGuardado: TurnoEvent) => {
  handleClose();
  loadTurnos();
  const notificaWA = turnoGuardado.notificarPor.includes('wa') || turnoGuardado.notificarPor.includes('ambos');
  if (notificaWA && turnoGuardado.pacienteId?.telefono) {
    const tel = turnoGuardado.pacienteId.telefono.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Hola ${turnoGuardado.pacienteId.nombre}, tu turno de kinesiología fue agendado para el ${turnoGuardado.fecha} de ${turnoGuardado.horaInicio} a ${turnoGuardado.horaFin}.`
    );
    window.open(`https://wa.me/549${tel}?text=${msg}`, '_blank');
  }
};
```

- [ ] **Commit**

```bash
git add src/frontend/src/pages/AgendaPage.tsx
git commit -m "feat: open wa.me link after turno saved"
```

---

### Task 8: SMTP config + .env

**Files:**
- Modify: `src/backend/.env.example` (or `.env`)

- [ ] **Add SMTP env vars**

```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@kinesia.com
```

- [ ] **Commit**

```bash
git add src/backend/.env.example
git commit -m "chore: add SMTP env vars for email notifications"
```

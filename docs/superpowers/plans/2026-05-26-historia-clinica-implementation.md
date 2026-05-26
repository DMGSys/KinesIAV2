# Historia Clínica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a unified clinical history timeline tab in PacientePage + improved PDF with turnos.

**Architecture:** New backend endpoint merges evoluciones + turnos by date; frontend renders a chronological timeline with expandable items; PDF includes turnos section.

**Tech Stack:** Express/Mongoose backend, React/TypeScript frontend, PDFKit

---

### Task 1: Backend — Timeline + sesiones endpoints

**Files:**
- Modify: `src/backend/src/controllers/pacienteController.ts`
- Modify: `src/backend/src/routes/pacientes.ts`

- [ ] **Add timeline and sesiones endpoints to pacienteController**

```typescript
import { Turno } from '../models/Turno.js';

export const getTimeline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const [evoluciones, turnos] = await Promise.all([
      Evolucion.find({ pacienteId: id, usuarioId: userId }).sort({ fecha: -1, sesion: -1 }).lean(),
      Turno.find({ pacienteId: id, creadoPor: userId }).sort({ fecha: -1, horaInicio: -1 }).lean(),
    ]);

    const timeline: any[] = [
      ...evoluciones.map(e => ({ ...e, _tipo: 'evolucion', _orden: e.fecha + 'T' + String(e.sesion).padStart(6, '0') })),
      ...turnos.map(t => ({ ...t, _tipo: 'turno', _orden: t.fecha + 'T' + (t.horaInicio || '00:00') })),
    ];
    timeline.sort((a, b) => b._orden.localeCompare(a._orden));

    res.json(timeline);
  } catch {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const updateSesiones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sesionesRealizadas } = req.body;
    const userId = req.user?.id;

    const paciente = await Paciente.findOneAndUpdate(
      { id, usuarioId: userId },
      { sesionesRealizadas },
      { new: true }
    );
    if (!paciente) {
      res.status(404).json({ message: 'Paciente no encontrado' });
      return;
    }
    res.json(paciente);
  } catch {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
```

- [ ] **Register routes in pacientes.ts**

Add imports and routes (after existing routes):
```typescript
import { getTimeline, updateSesiones } from '../controllers/pacienteController.js';
```
```typescript
router.get('/:id/timeline', authMiddleware, getTimeline);
router.patch('/:id/sesiones', authMiddleware, updateSesiones);
```

### Task 2: Backend — Include turnos in PDF

**Files:**
- Modify: `src/backend/src/controllers/pdfController.ts`

- [ ] **Add turnos to PDF generation**

Add import at top:
```typescript
import { Turno } from '../models/Turno.js';
```

After fetching evoluciones, add:
```typescript
const turnos = await Turno.find({ pacienteId: id, creadoPor: userId })
  .sort({ fecha: -1, horaInicio: -1 })
  .lean();
```

After the evoluciones section, add:
```typescript
doc.fontSize(12).fillColor('#0d9488').text(`TURNOS (${turnos.length})`, { underline: true });
doc.moveDown();

if (turnos.length === 0) {
  doc.fontSize(10).fillColor('#888').text('No hay turnos registrados.');
} else {
  turnos.forEach((turno, i) => {
    const estado = (turno as any).estado || 'pendiente';
    doc.fontSize(10).fillColor('#0d9488').text(`${(turno as any).fecha} ${(turno as any).horaInicio || ''} - ${(turno as any).horaFin || ''} [${estado}]`);
    if ((turno as any).notas) {
      doc.fontSize(9).fillColor('#333').text((turno as any).notas);
    }
    if (i < turnos.length - 1) doc.moveDown(0.3);
  });
}
doc.moveDown();
```

### Task 3: Frontend — Historia Clínica tab in PacientePage

**Files:**
- Modify: `src/frontend/src/pages/PacientePage.tsx`

- [ ] **Add "Historia Clínica" to tabs and add state**

Add `'historia'` to the Tab union type:
```typescript
type Tab = 'ficha' | 'evoluciones' | 'historia' | 'nueva';
```

Add state variables:
```typescript
const [timeline, setTimeline] = useState<any[]>([]);
const [timelineLoading, setTimelineLoading] = useState(false);
const [editSesiones, setEditSesiones] = useState(false);
const [sesionesInput, setSesionesInput] = useState(0);
const [showNewEntry, setShowNewEntry] = useState(false);
const [newEntryContent, setNewEntryContent] = useState('');
const [newEntryDate, setNewEntryDate] = useState('');
const [expandedItem, setExpandedItem] = useState<string | null>(null);
```

- [ ] **Add loadTimeline function**

```typescript
const loadTimeline = async () => {
  if (!id) return;
  setTimelineLoading(true);
  try {
    const res = await api.get(`/api/pacientes/${id}/timeline`);
    setTimeline(res.data);
  } catch {
    setTimeline([]);
  } finally {
    setTimelineLoading(false);
  }
};
```

- [ ] **Add handleUpdateSesiones function**

```typescript
const handleUpdateSesiones = async () => {
  if (!id || !paciente) return;
  try {
    const res = await api.patch(`/api/pacientes/${id}/sesiones`, { sesionesRealizadas: sesionesInput });
    setPaciente(prev => prev ? { ...prev, sesionesRealizadas: res.data.sesionesRealizadas } : prev);
    setEditSesiones(false);
  } catch {
    alert('Error al actualizar sesiones');
  }
};
```

- [ ] **Add handleNewEntry function**

```typescript
const handleNewEntry = async () => {
  if (!id || !newEntryContent || !newEntryDate) return;
  try {
    const auth = getAuth();
    await api.post('/api/evoluciones', {
      pacienteId: id,
      fecha: newEntryDate,
      sesion: (paciente?.sesionesRealizadas || 0) + 1,
      kinesiologo: `${auth?.user?.nombre || ''} ${auth?.user?.apellido || ''}`.trim() || auth?.user?.usuario || '',
      contenido: newEntryContent,
      tipo: 'escrita',
    });
    setShowNewEntry(false);
    setNewEntryContent('');
    setNewEntryDate('');
    loadTimeline();
    loadData();
  } catch {
    alert('Error al crear entrada');
  }
};
```

- [ ] **Add tab button in nav**

After the 'evoluciones' tab button, add:
```typescript
<button onClick={() => { setTab('historia'); loadTimeline(); }}
  className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${tab === 'historia' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
  Historia Clínica
</button>
```

- [ ] **Add historia tab content**

Before the `{tab === 'nueva' &&` section, add:
```tsx
{tab === 'historia' && (
  <div className="space-y-4">
    {/* Header */}
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-700">{paciente?.nombre} · {paciente?.dni}</p>
          <p className="text-sm text-slate-500">{paciente?.diagnostico}</p>
        </div>
        <div className="flex items-center gap-2">
          {editSesiones ? (
            <div className="flex items-center gap-1">
              <input type="number" className="input-field w-16 text-center text-sm py-1" value={sesionesInput}
                onChange={(e) => setSesionesInput(Number(e.target.value))} min={0} />
              <span className="text-sm text-slate-400">/{paciente?.sesionesTotales || 0}</span>
              <button onClick={handleUpdateSesiones} className="btn-primary text-xs px-2 py-1">OK</button>
              <button onClick={() => setEditSesiones(false)} className="btn-secondary text-xs px-2 py-1">X</button>
            </div>
          ) : (
            <button onClick={() => { setSesionesInput(paciente?.sesionesRealizadas || 0); setEditSesiones(true); }}
              className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors">
              Sesiones: {paciente?.sesionesRealizadas || 0}/{paciente?.sesionesTotales || 0} ✏️
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Timeline */}
    {timelineLoading ? (
      <div className="text-center py-8 text-slate-400">Cargando...</div>
    ) : timeline.length === 0 ? (
      <div className="card text-center py-8 text-slate-400">
        Sin registros clínicos aún
      </div>
    ) : (
      <div className="space-y-3">
        {timeline.map((item, i) => (
          <div key={item._id || i} className="card py-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${item._tipo === 'evolucion' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item._tipo === 'evolucion' ? `Evolución #${item.sesion || ''}` : 'Turno'}
                  </span>
                  <span className="text-xs text-slate-400">{item.fecha}</span>
                  {item._tipo === 'turno' && item.horaInicio && (
                    <span className="text-xs text-slate-400">{item.horaInicio} - {item.horaFin || ''}</span>
                  )}
                </div>
                {item._tipo === 'evolucion' && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{item.kinesiologo} {item.tipo === 'audio' ? '🎤' : '✍️'}</p>
                    <p className="text-sm text-slate-600">
                      {expandedItem === item._id ? item.contenido : (item.contenido?.slice(0, 120) + (item.contenido?.length > 120 ? '...' : ''))}
                    </p>
                    {item.contenido?.length > 120 && (
                      <button onClick={() => setExpandedItem(expandedItem === item._id ? null : item._id)}
                        className="text-xs text-primary hover:underline mt-1">
                        {expandedItem === item._id ? 'Ver menos' : 'Ver más'}
                      </button>
                    )}
                  </div>
                )}
                {item._tipo === 'turno' && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      {(item as any).profesionalId || ''} · {(item as any).estado || 'pendiente'}
                    </p>
                    {(item as any).notas && (
                      <p className="text-sm text-slate-600">
                        {expandedItem === item._id ? (item as any).notas : ((item as any).notas?.slice(0, 120) + ((item as any).notas?.length > 120 ? '...' : ''))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* FAB: add new entry */}
    <button onClick={() => { setNewEntryDate(new Date().toISOString().slice(0, 10)); setShowNewEntry(true); }}
      className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center text-2xl z-20">
      +
    </button>

    {/* New entry modal */}
    {showNewEntry && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowNewEntry(false)}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">Nueva entrada clínica</h3>
            <button onClick={() => setShowNewEntry(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
          </div>
          <div>
            <label className="label">Fecha</label>
            <input type="date" className="input-field" value={newEntryDate} onChange={e => setNewEntryDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Contenido</label>
            <textarea className="input-field min-h-[120px]" value={newEntryContent} onChange={e => setNewEntryContent(e.target.value)} placeholder="Detalle de la evolución clínica..." />
          </div>
          <button onClick={handleNewEntry} disabled={!newEntryContent || !newEntryDate} className="btn-primary w-full">
            Guardar entrada
          </button>
        </div>
      </div>
    )}
  </div>
)}
```

Also add a call to `loadTimeline()` in `loadData()` or in a separate useEffect when tab changes to 'historia'.

### Task 4: Rebuild Docker + verify

- [ ] `docker compose down`
- [ ] `docker compose up -d --build`
- [ ] Verify: navigate to paciente, click "Historia Clínica", see timeline
- [ ] Verify: edit sesiones consumidas
- [ ] Verify: add new entry
- [ ] Verify: PDF shows turnos
- [ ] Commit

# Loading States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Add loading spinners + disabled buttons + error feedback to all async operations missing them

**Architecture:** Add local `loading` / `pdfLoading` state vars to each component. Buttons show `<Spinner> + Text` while disabled during API calls. Error handling upgraded from silent `console.error` to visible messages.

**Tech Stack:** React 18, Tailwind CSS, React state hooks

---

## File Structure

| File | Responsibility |
|---|---|
| `src/frontend/src/pages/DashboardPage.tsx` | Loading: crear paciente + PDF. Error: carga pacientes |
| `src/frontend/src/pages/PacientePage.tsx` | Loading: confirmar evolución + PDF |
| `src/frontend/src/pages/AdminPage.tsx` | Loading: toggle activo + PDF. Error: toggle catch |

---

### Task 1: Loading state — Crear paciente (DashboardPage)

**Files:**
- Modify: `src/frontend/src/pages/DashboardPage.tsx:43-58`

- [ ] **Step 1: Add `creating` state variable**

Add after line 26 (`const [newPaciente, ...]`):
```typescript
const [creating, setCreating] = useState(false);
```

- [ ] **Step 2: Update `handleCreate` to use loading state**

Replace lines 43-58:
```typescript
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const payload: Record<string, unknown> = { ...newPaciente };
      if (payload.id === '') delete payload.id;
      payload.edad = parseInt(newPaciente.edad as unknown as string) || 0;
      payload.sesionesTotales = parseInt(newPaciente.sesionesTotales as unknown as string) || 0;
      payload.sesionesRealizadas = 0;
      await api.post('/api/pacientes', payload);
      setShowForm(false);
      setNewPaciente({ id: '', nombre: '', edad: '', dni: '', telefono: '', email: '', obraSocial: '', nroAfiliado: '', diagnostico: '', medicoDerivante: '', fechaIngreso: '', sesionesTotales: '', antecedentes: '', alergias: '', medicacion: '' });
      loadPacientes();
    } catch {
      alert('Error al crear paciente');
    } finally {
      setCreating(false);
    }
  };
```

- [ ] **Step 3: Update submit button with spinner**

Replace line 273:
```html
                <button type="submit" className="btn-primary flex-1">Guardar paciente</button>
```
With:
```html
                <button type="submit" disabled={creating} className={`btn-primary flex-1 ${creating ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  {creating ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Guardando...
                    </span>
                  ) : 'Guardar paciente'}
                </button>
```

---

### Task 2: Loading state — Export PDF (DashboardPage)

**Files:**
- Modify: `src/frontend/src/pages/DashboardPage.tsx:67-86`

- [ ] **Step 1: Add `pdfLoading` state**

Add after `const [creating, setCreating] = useState(false);`:
```typescript
const [pdfLoading, setPdfLoading] = useState<string | null>(null);
```

- [ ] **Step 2: Update `handleExportPDF`**

Replace lines 67-86:
```typescript
  const handleExportPDF = async (pacienteId: string) => {
    if (pdfLoading) return;
    setPdfLoading(pacienteId);
    try {
      const token = localStorage.getItem('kinesia_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reportes/paciente/${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historia-clinica-${pacienteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al generar el PDF');
    } finally {
      setPdfLoading(null);
    }
  };
```

- [ ] **Step 3: Update PDF button in card**

Replace lines 166-172:
```html
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExportPDF(paciente.id); }}
                        className="text-slate-400 hover:text-primary transition-colors text-xs"
                        title="Exportar PDF"
                      >
                        📄 PDF
                      </button>
```
With:
```html
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExportPDF(paciente.id); }}
                        disabled={pdfLoading === paciente.id}
                        className={`transition-colors text-xs ${pdfLoading === paciente.id ? 'text-slate-300' : 'text-slate-400 hover:text-primary'}`}
                        title="Exportar PDF"
                      >
                        {pdfLoading === paciente.id ? (
                          <span className="inline-flex items-center gap-1">
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            PDF
                          </span>
                        ) : '📄 PDF'}
                      </button>
```

---

### Task 3: Error handling — Cargar pacientes (DashboardPage)

**Files:**
- Modify: `src/frontend/src/pages/DashboardPage.tsx:32-41`

- [ ] **Step 1: Add `loadError` state and update `loadPacientes`**

Add after `const [pdfLoading, setPdfLoading] = useState<string | null>(null);`:
```typescript
const [loadError, setLoadError] = useState('');
```

Replace lines 32-41:
```typescript
  const loadPacientes = async () => {
    setLoadError('');
    try {
      const res = await api.get('/api/pacientes');
      setPacientes(res.data);
    } catch {
      setLoadError('Error al cargar pacientes. Verificá tu conexión.');
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 2: Show error in UI**

After the loading check (after line 132 `Cargando...` div), add error display before the empty check:
```html
        ) : loadError ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-2">{loadError}</p>
            <button onClick={() => { setLoading(true); loadPacientes(); }} className="btn-secondary text-sm">
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
```

Replace line 133:
```html
        ) : filtered.length === 0 ? (
```

---

### Task 4: Loading state — Confirmar evolución (PacientePage)

**Files:**
- Modify: `src/frontend/src/pages/PacientePage.tsx:134-160`

- [ ] **Step 1: Add `saving` state**

Add after line 58 (`const chunksRef`):
```typescript
const [saving, setSaving] = useState(false);
```

- [ ] **Step 2: Update `handleConfirmar`**

Replace lines 134-160:
```typescript
  const handleConfirmar = async () => {
    if (!transcripcion.trim() || !paciente || saving) return;
    setSaving(true);
    const auth = getAuth();
    const kinesiologo = auth ? `${(auth.user as any).nombre} ${(auth.user as any).apellido}` : 'Kinesiólogo';
    try {
      const res = await api.get(`/api/evoluciones/next/${paciente.id}`);
      const sesion = res.data.sesion || evoluciones.length + 1;
      const today = new Date();
      const fecha = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      await api.post('/api/evoluciones', {
        pacienteId: paciente.id,
        fecha,
        sesion,
        kinesiologo,
        contenido: transcripcion,
        tipo: transcriptionMode === 'real' ? 'audio' : 'escrita'
      });
      setTranscripcion('');
      setRecState('idle');
      setTimer(0);
      const evoRes = await api.get(`/api/evoluciones?pacienteId=${id}`);
      setEvoluciones(evoRes.data);
      setTab('evoluciones');
    } catch {
      alert('Error al guardar la evolución');
    } finally {
      setSaving(false);
    }
  };
```

- [ ] **Step 3: Update confirm button**

Replace line 454:
```html
                  <button onClick={handleConfirmar} className="btn-primary flex-1">
                    ✅ Agregar a evoluciones
                  </button>
```
With:
```html
                  <button onClick={handleConfirmar} disabled={saving} className={`btn-primary flex-1 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Guardando evolución...
                      </span>
                    ) : '✅ Agregar a evoluciones'}
                  </button>
```

---

### Task 5: Loading state — Export PDF (PacientePage)

**Files:**
- Modify: `src/frontend/src/pages/PacientePage.tsx:162-182`

- [ ] **Step 1: Add `pdfLoading` state**

Add after `const [saving, setSaving] = useState(false);`:
```typescript
const [pdfLoading, setPdfLoading] = useState(false);
```

- [ ] **Step 2: Update `handleExportPDF`**

Replace lines 162-182:
```typescript
  const handleExportPDF = async () => {
    if (!id || pdfLoading) return;
    setPdfLoading(true);
    try {
      const token = localStorage.getItem('kinesia_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reportes/paciente/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historia-clinica-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al generar el PDF');
    } finally {
      setPdfLoading(false);
    }
  };
```

- [ ] **Step 3: Update PDF button in header**

Replace lines 225-231:
```html
          <button
            onClick={handleExportPDF}
            className="text-sm text-primary border border-primary px-3 py-1 rounded-lg hover:bg-teal-50 transition-colors flex items-center gap-1"
            title="Exportar historia clínica en PDF"
          >
            📄 PDF
          </button>
```
With:
```html
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            className={`text-sm border px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${pdfLoading ? 'text-slate-300 border-slate-200' : 'text-primary border-primary hover:bg-teal-50'}`}
            title="Exportar historia clínica en PDF"
          >
            {pdfLoading ? (
              <span className="inline-flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Generando PDF...
              </span>
            ) : '📄 PDF'}
          </button>
```

---

### Task 6: Loading state — Toggle activo + Export PDF (AdminPage)

**Files:**
- Modify: `src/frontend/src/pages/AdminPage.tsx`

- [ ] **Step 1: Add `toggling` and `pdfLoading` states**

Add after line 38 (`const [formSuccess, ...]`):
```typescript
const [toggling, setToggling] = useState<string | null>(null);
const [pdfLoading, setPdfLoading] = useState<string | null>(null);
```

- [ ] **Step 2: Update `handleToggleActive`**

Replace lines 78-83:
```typescript
  const handleToggleActive = async (id: string, _currentActivo: boolean) => {
    if (toggling) return;
    setToggling(id);
    try {
      await api.patch(`/api/usuarios/${id}/toggle`);
      loadData();
    } catch {
      alert('Error al cambiar estado del usuario');
    } finally {
      setToggling(null);
    }
  };
```

- [ ] **Step 3: Update `handleExportPDF`**

Replace lines 90-109:
```typescript
  const handleExportPDF = async (pacienteId: string) => {
    if (pdfLoading) return;
    setPdfLoading(pacienteId);
    try {
      const token = localStorage.getItem('kinesia_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reportes/paciente/${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error generando PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historia-clinica-${pacienteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al generar el PDF');
    } finally {
      setPdfLoading(null);
    }
  };
```

- [ ] **Step 4: Update toggle button with loading state**

Replace lines 270-275:
```html
                        <button
                          onClick={() => handleToggleActive(u._id, u.activo)}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors ${u.activo ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
                        >
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
```
With:
```html
                        <button
                          onClick={() => handleToggleActive(u._id, u.activo)}
                          disabled={toggling === u._id}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors ${toggling === u._id ? 'border-slate-200 text-slate-400' : u.activo ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
                        >
                          {toggling === u._id ? '...' : (u.activo ? 'Desactivar' : 'Activar')}
                        </button>
```

- [ ] **Step 5: Update PDF button in stats**

Replace line 171:
```html
                            <button onClick={() => handleExportPDF(p.id)} className="text-primary hover:text-primary-dark text-xs" title="Exportar PDF">📄</button>
```
With:
```html
                            <button onClick={() => handleExportPDF(p.id)} disabled={pdfLoading === p.id} className={`text-xs ${pdfLoading === p.id ? 'text-slate-300' : 'text-primary hover:text-primary-dark'}`} title="Exportar PDF">
                              {pdfLoading === p.id ? (
                                <span className="inline-flex items-center gap-1">
                                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                </span>
                              ) : '📄'}
                            </button>
```

- [ ] **Step 6: Update crear usuario button with loading state**

Add state after `const [formSuccess, ...]` (already done in step 1, add `creatingUser`):
```typescript
const [creatingUser, setCreatingUser] = useState(false);
```

Replace lines 63-76:
```typescript
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingUser) return;
    setFormError('');
    setFormSuccess('');
    setCreatingUser(true);
    try {
      await api.post('/api/usuarios', newUser);
      setFormSuccess('Usuario creado exitosamente');
      setNewUser({ usuario: '', contrasena: '', nombre: '', apellido: '', correo: '', celular: '', rol: 'kinesiologo' });
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al crear usuario');
    } finally {
      setCreatingUser(false);
    }
  };
```

Replace line 251:
```html
                      <button type="submit" className="btn-primary w-full">Crear usuario</button>
```
With:
```html
                      <button type="submit" disabled={creatingUser} className={`btn-primary w-full ${creatingUser ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        {creatingUser ? (
                          <span className="inline-flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            Creando...
                          </span>
                        ) : 'Crear usuario'}
                      </button>
```

---

### Task 7: Rebuild frontend and verify

- [ ] **Step 1: Rebuild Docker**

```bash
docker-compose down && docker-compose up -d --build
```

- [ ] **Step 2: Verify frontend compiles**

Check containers are running: `docker ps`

- [ ] **Step 3: Quick manual test**

Open `http://localhost/`, log in, verify buttons show loading states on click.

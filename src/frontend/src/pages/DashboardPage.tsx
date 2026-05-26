import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearAuth, getAuth } from '../lib/api';

interface Paciente {
  id: string;
  nombre: string;
  edad: number;
  diagnostico: string;
  sesionesRealizadas: number;
  sesionesTotales: number;
  telefono: string;
  email: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newPaciente, setNewPaciente] = useState({
    id: '', nombre: '', edad: '', dni: '', telefono: '', email: '',
    obraSocial: '', nroAfiliado: '', diagnostico: '', medicoDerivante: '',
    fechaIngreso: '', sesionesTotales: '', antecedentes: '', alergias: '', medicacion: ''
  });
  const [creating, setCreating] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadPacientes();
  }, []);

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

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const authUser = getAuth()?.user;
  const isAdmin = authUser?.roles?.includes('admin');
  const isAgendaVisible = authUser?.roles?.some(r => r === 'kinesiologo' || r === 'secretario');

  const handleExportPDF = async (pacienteId: string) => {
    if (pdfLoading === pacienteId) return;
    setPdfLoading(pacienteId);
    try {
      const token = localStorage.getItem('kinesia_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reportes/paciente/${pacienteId}`, {
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

  const filtered = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-primary">KinesIA</h1>
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors">
                Panel Admin
              </button>
            )}
            {isAgendaVisible && (
              <button onClick={() => navigate('/agenda')} className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full hover:bg-teal-200 transition-colors">
                Agenda
              </button>
            )}
          </div>
          <button onClick={handleLogout} className="btn-secondary text-sm">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <p className="text-sm text-slate-500">Bienvenido/a, <span className="font-semibold text-slate-700">{getAuth()?.user?.nombre} {getAuth()?.user?.apellido}</span></p>
          <div className="flex gap-1.5 mt-1.5">
            {getAuth()?.user?.roles?.map(r => {
              const colors: Record<string, string> = { admin: 'bg-purple-100 text-purple-700', kinesiologo: 'bg-blue-100 text-blue-700', secretario: 'bg-amber-100 text-amber-700' };
              const labels: Record<string, string> = { admin: 'Admin', kinesiologo: 'Kinesiólogo', secretario: 'Secretario/a' };
              return <span key={r} className={`text-xs px-2 py-0.5 rounded ${colors[r] || 'bg-slate-100 text-slate-600'}`}>{labels[r] || r}</span>;
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Mis Pacientes</h2>
            <p className="text-slate-500 text-sm">{pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            + Agregar paciente
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando...</div>
        ) : loadError ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-2">{loadError}</p>
            <button onClick={() => { setLoading(true); loadPacientes(); }} className="btn-secondary text-sm">
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-2">
              {search ? 'No se encontraron pacientes' : 'Aún no tenés pacientes cargados'}
            </p>
            {!search && (
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
                Agregar el primero
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((paciente) => {
              const progreso = paciente.sesionesTotales > 0
                ? Math.round((paciente.sesionesRealizadas / paciente.sesionesTotales) * 100)
                : 0;
              return (
                <div
                  key={paciente.id}
                  onClick={() => navigate(`/paciente/${paciente.id}`)}
                  className="card cursor-pointer hover:shadow-md hover:border-primary transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">{paciente.id}</span>
                        <h3 className="font-semibold text-slate-800">{paciente.nombre}</h3>
                      </div>
                      <p className="text-sm text-slate-500">{paciente.edad} años · {paciente.diagnostico?.slice(0, 50)}{paciente.diagnostico && paciente.diagnostico.length > 50 ? '...' : ''}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm text-slate-400">{paciente.sesionesRealizadas}/{paciente.sesionesTotales}</span>
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
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{progreso}% completado</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Nuevo Paciente</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="label">Nombre completo</label>
                <input type="text" className="input-field" value={newPaciente.nombre}
                  onChange={(e) => setNewPaciente({ ...newPaciente, nombre: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Edad</label>
                  <input type="number" className="input-field" value={newPaciente.edad}
                    onChange={(e) => setNewPaciente({ ...newPaciente, edad: e.target.value })} required />
                </div>
                <div>
                  <label className="label">DNI</label>
                  <input type="text" className="input-field" value={newPaciente.dni}
                    onChange={(e) => setNewPaciente({ ...newPaciente, dni: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input type="tel" className="input-field" value={newPaciente.telefono}
                  onChange={(e) => setNewPaciente({ ...newPaciente, telefono: e.target.value })} required />
              </div>
              <div>
                <label className="label">Correo electrónico</label>
                <input type="email" className="input-field" value={newPaciente.email}
                  onChange={(e) => setNewPaciente({ ...newPaciente, email: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Obra social</label>
                  <input type="text" className="input-field" value={newPaciente.obraSocial}
                    onChange={(e) => setNewPaciente({ ...newPaciente, obraSocial: e.target.value })} />
                </div>
                <div>
                  <label className="label">N° Afiliado</label>
                  <input type="text" className="input-field" value={newPaciente.nroAfiliado}
                    onChange={(e) => setNewPaciente({ ...newPaciente, nroAfiliado: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Médico derivante</label>
                <input type="text" className="input-field" value={newPaciente.medicoDerivante}
                  onChange={(e) => setNewPaciente({ ...newPaciente, medicoDerivante: e.target.value })} />
              </div>
              <div>
                <label className="label">Fecha de ingreso (DD/MM/YYYY)</label>
                <input type="text" className="input-field" value={newPaciente.fechaIngreso}
                  onChange={(e) => setNewPaciente({ ...newPaciente, fechaIngreso: e.target.value })} required />
              </div>
              <div>
                <label className="label">Diagnóstico</label>
                <textarea className="input-field" rows={2} value={newPaciente.diagnostico}
                  onChange={(e) => setNewPaciente({ ...newPaciente, diagnostico: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sesiones totales</label>
                  <input type="number" className="input-field" value={newPaciente.sesionesTotales}
                    onChange={(e) => setNewPaciente({ ...newPaciente, sesionesTotales: e.target.value })} />
                </div>
                <div>
                  <label className="label">Antecedentes</label>
                  <input type="text" className="input-field" value={newPaciente.antecedentes}
                    onChange={(e) => setNewPaciente({ ...newPaciente, antecedentes: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Alergias</label>
                <input type="text" className="input-field" value={newPaciente.alergias}
                  onChange={(e) => setNewPaciente({ ...newPaciente, alergias: e.target.value })} />
              </div>
              <div>
                <label className="label">Medicación actual</label>
                <input type="text" className="input-field" value={newPaciente.medicacion}
                  onChange={(e) => setNewPaciente({ ...newPaciente, medicacion: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating} className={`btn-primary flex-1 ${creating ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  {creating ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Guardando...
                    </span>
                  ) : 'Guardar paciente'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

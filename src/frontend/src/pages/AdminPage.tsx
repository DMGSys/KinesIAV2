import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearAuth, getAuth } from '../lib/api';

interface Stats {
  totalPacientes: number;
  totalKinesiologos: number;
  totalAdmin: number;
  totalEvoluciones: number;
  sesionesCompletadas: number;
  pacientesRecientes: Array<{ id: string; nombre: string; diagnostico: string; sesionesRealizadas: number; sesionesTotales: number }>;
  evolucionesUltimas: Array<{ fecha: string; sesion: number; kinesiologo: string; contenido: string }>;
}

interface Usuario {
  _id: string;
  usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  rol: 'admin' | 'kinesiologo';
  activo: boolean;
}

type Tab = 'stats' | 'usuarios';

export default function AdminPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ usuario: '', contrasena: '', nombre: '', apellido: '', correo: '', celular: '', rol: 'kinesiologo' as 'admin' | 'kinesiologo' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (!auth || auth.user.rol !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/usuarios')
      ]);
      setStats(statsRes.data);
      setUsuarios(usersRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

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

  const handleToggleActive = async (id: string, _currentActivo: boolean) => {
    if (toggling === id) return;
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

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleExportPDF = async (pacienteId: string) => {
    if (pdfLoading === pacienteId) return;
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

  if (!auth || auth.user.rol !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-white px-2 py-0.5 rounded text-xs font-bold">ADMIN</span>
            <h1 className="text-xl font-bold text-primary">KinesIA</h1>
          </div>
          <button onClick={handleLogout} className="btn-secondary text-sm">Cerrar sesión</button>
        </div>
        <nav className="max-w-2xl mx-auto px-4 flex border-t border-slate-100">
          {(['stats', 'usuarios'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${tab === t ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
              {t === 'stats' && '📊 Estadísticas'}
              {t === 'usuarios' && '👥 Usuarios'}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando...</div>
        ) : (
          <>
            {tab === 'stats' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="card text-center">
                    <p className="text-3xl font-bold text-primary">{stats.totalPacientes}</p>
                    <p className="text-sm text-slate-500 mt-1">Pacientes</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-3xl font-bold text-primary">{stats.totalEvoluciones}</p>
                    <p className="text-sm text-slate-500 mt-1">Evoluciones</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-3xl font-bold text-blue-600">{stats.totalKinesiologos}</p>
                    <p className="text-sm text-slate-500 mt-1">Kinesiólogos</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-3xl font-bold text-blue-600">{stats.sesionesCompletadas}</p>
                    <p className="text-sm text-slate-500 mt-1">Sesiones completadas</p>
                  </div>
                </div>

                {stats.pacientesRecientes.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-slate-700 mb-3">Pacientes recientes</h3>
                    <div className="space-y-2">
                      {stats.pacientesRecientes.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded bg-slate-50">
                          <div>
                            <p className="font-medium text-slate-700 text-sm">{p.nombre}</p>
                            <p className="text-xs text-slate-400">{p.id} · {p.diagnostico?.slice(0, 40)}{p.diagnostico && p.diagnostico.length > 40 ? '...' : ''}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-xs text-slate-400">{p.sesionesRealizadas}/{p.sesionesTotales}</span>
                            <button onClick={() => handleExportPDF(p.id)} disabled={pdfLoading === p.id} className={`text-xs ${pdfLoading === p.id ? 'text-slate-300' : 'text-primary hover:text-primary-dark'}`} title="Exportar PDF">
                              {pdfLoading === p.id ? (
                                <span className="inline-flex items-center gap-1">
                                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                </span>
                              ) : '📄'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stats.evolucionesUltimas.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-slate-700 mb-3">Últimas evoluciones</h3>
                    <div className="space-y-2">
                      {stats.evolucionesUltimas.map((evo, i) => (
                        <div key={i} className="p-2 rounded bg-slate-50">
                          <p className="text-xs text-slate-500">Sesión {evo.sesion} · {evo.fecha} · {evo.kinesiologo}</p>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{evo.contenido}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'usuarios' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
                    {showForm ? 'Cancelar' : '+ Crear usuario'}
                  </button>
                </div>

                {showForm && (
                  <div className="card">
                    <h3 className="font-semibold text-slate-700 mb-4">Nuevo usuario</h3>
                    <form onSubmit={handleCreateUser} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Nombre</label>
                          <input type="text" className="input-field" value={newUser.nombre}
                            onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })} required />
                        </div>
                        <div>
                          <label className="label">Apellido</label>
                          <input type="text" className="input-field" value={newUser.apellido}
                            onChange={(e) => setNewUser({ ...newUser, apellido: e.target.value })} required />
                        </div>
                      </div>
                      <div>
                        <label className="label">Correo electrónico</label>
                        <input type="email" className="input-field" value={newUser.correo}
                          onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })} required />
                      </div>
                      <div>
                        <label className="label">Celular</label>
                        <input type="tel" className="input-field" value={newUser.celular}
                          onChange={(e) => setNewUser({ ...newUser, celular: e.target.value })} required />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="label">Usuario</label>
                          <input type="text" className="input-field" value={newUser.usuario}
                            onChange={(e) => setNewUser({ ...newUser, usuario: e.target.value })} required />
                        </div>
                        <div>
                          <label className="label">Contraseña</label>
                          <input type="password" className="input-field" value={newUser.contrasena}
                            onChange={(e) => setNewUser({ ...newUser, contrasena: e.target.value })} required />
                        </div>
                        <div>
                          <label className="label">Rol</label>
                          <select className="input-field" value={newUser.rol}
                            onChange={(e) => setNewUser({ ...newUser, rol: e.target.value as 'admin' | 'kinesiologo' })}>
                            <option value="kinesiologo">Kinesiólogo</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                      </div>
                      {formError && <p className="text-red-600 text-sm">{formError}</p>}
                      {formSuccess && <p className="text-green-600 text-sm">{formSuccess}</p>}
                      <button type="submit" disabled={creatingUser} className={`btn-primary w-full ${creatingUser ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        {creatingUser ? (
                          <span className="inline-flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            Creando...
                          </span>
                        ) : 'Crear usuario'}
                      </button>
                    </form>
                  </div>
                )}

                <div className="space-y-2">
                  {usuarios.map((u) => (
                    <div key={u._id} className="card py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-700">{u.nombre} {u.apellido}</p>
                            <span className={`badge ${u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {u.rol === 'admin' ? 'Admin' : 'Kinesiólogo'}
                            </span>
                            {!u.activo && <span className="badge bg-red-100 text-red-700">Inactivo</span>}
                          </div>
                          <p className="text-sm text-slate-400">@{u.usuario} · {u.correo}</p>
                        </div>
                        <button
                          onClick={() => handleToggleActive(u._id, u.activo)}
                          disabled={toggling === u._id}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors ${toggling === u._id ? 'border-slate-200 text-slate-400' : u.activo ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
                        >
                          {toggling === u._id ? '...' : (u.activo ? 'Desactivar' : 'Activar')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

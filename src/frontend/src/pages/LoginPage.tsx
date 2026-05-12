import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuth } from '../lib/api';

type View = 'login' | 'register' | 'recover';

interface LoginForm {
  usuario: string;
  contrasena: string;
}

interface RegisterForm {
  usuario: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
}

interface RecoverForm {
  correo: string;
  nuevaContrasena: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [loginForm, setLoginForm] = useState<LoginForm>({ usuario: '', contrasena: '' });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    usuario: '', contrasena: '', nombre: '', apellido: '', correo: '', celular: ''
  });
  const [recoverForm, setRecoverForm] = useState<RecoverForm>({ correo: '', nuevaContrasena: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/api/auth/login', loginForm);
      setAuth(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/api/auth/register', registerForm);
      setMessage({ type: 'success', text: 'Registro exitoso. Iniciá sesión.' });
      setTimeout(() => setView('login'), 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/api/auth/recover', recoverForm);
      setMessage({ type: 'success', text: 'Contraseña actualizada. Iniciá sesión.' });
      setTimeout(() => setView('login'), 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">KinesIA</h1>
          <p className="text-slate-500 mt-1">Gestión clínica kinesiológica</p>
        </div>

        <div className="card">
          {view === 'login' && (
            <>
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Iniciar sesión</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">Usuario</label>
                  <input
                    type="text"
                    className="input-field"
                    value={loginForm.usuario}
                    onChange={(e) => setLoginForm({ ...loginForm, usuario: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <input
                    type="password"
                    className="input-field"
                    value={loginForm.contrasena}
                    onChange={(e) => setLoginForm({ ...loginForm, contrasena: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </form>
              <div className="mt-4 flex justify-between text-sm text-slate-500">
                <button onClick={() => setView('register')} className="hover:text-primary transition-colors">
                  Crear cuenta
                </button>
                <button onClick={() => setView('recover')} className="hover:text-primary transition-colors">
                  Olvidé mi contraseña
                </button>
              </div>
            </>
          )}

          {view === 'register' && (
            <>
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Crear cuenta</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nombre</label>
                    <input type="text" className="input-field" value={registerForm.nombre}
                      onChange={(e) => setRegisterForm({ ...registerForm, nombre: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Apellido</label>
                    <input type="text" className="input-field" value={registerForm.apellido}
                      onChange={(e) => setRegisterForm({ ...registerForm, apellido: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="label">Correo electrónico</label>
                  <input type="email" className="input-field" value={registerForm.correo}
                    onChange={(e) => setRegisterForm({ ...registerForm, correo: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Celular</label>
                  <input type="tel" className="input-field" value={registerForm.celular}
                    onChange={(e) => setRegisterForm({ ...registerForm, celular: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Usuario</label>
                  <input type="text" className="input-field" value={registerForm.usuario}
                    onChange={(e) => setRegisterForm({ ...registerForm, usuario: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <input type="password" className="input-field" value={registerForm.contrasena}
                    onChange={(e) => setRegisterForm({ ...registerForm, contrasena: e.target.value })} required />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Registrando...' : 'Crear cuenta'}
                </button>
              </form>
              <button onClick={() => setView('login')} className="mt-4 text-sm text-slate-500 hover:text-primary transition-colors">
                Volver al login
              </button>
            </>
          )}

          {view === 'recover' && (
            <>
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Recuperar contraseña</h2>
              <form onSubmit={handleRecover} className="space-y-4">
                <div>
                  <label className="label">Correo electrónico</label>
                  <input type="email" className="input-field" value={recoverForm.correo}
                    onChange={(e) => setRecoverForm({ ...recoverForm, correo: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Nueva contraseña</label>
                  <input type="password" className="input-field" value={recoverForm.nuevaContrasena}
                    onChange={(e) => setRecoverForm({ ...recoverForm, nuevaContrasena: e.target.value })} required />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
              <button onClick={() => setView('login')} className="mt-4 text-sm text-slate-500 hover:text-primary transition-colors">
                Volver al login
              </button>
            </>
          )}

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

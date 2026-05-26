import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Props {
  turno: any | null;
  fechaInicial: string;
  onClose: () => void;
  onSaved: (saved: any) => void;
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
    notificarPor: (turno?.notificarPor || []) as string[],
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
    setForm(prev => {
      const current = prev.notificarPor;
      if (current.includes(ch)) {
        return { ...prev, notificarPor: current.filter(x => x !== ch) };
      }
      if (current.includes('ambos')) {
        return { ...prev, notificarPor: [ch] };
      }
      if (current.length === 1 && current[0] !== ch) {
        return { ...prev, notificarPor: ['ambos'] };
      }
      return { ...prev, notificarPor: [...current, ch] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      let res;
      if (turno) {
        res = await api.put(`/api/turnos/${turno._id}`, form);
      } else {
        res = await api.post('/api/turnos', form);
      }
      onSaved(res.data);
    } catch {
      alert('Error al guardar turno');
    } finally {
      setSaving(false);
    }
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
              {pacientes.map((p: any) => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Kinesiólogo</label>
            <select className="input-field" value={form.profesionalId} onChange={e => setForm({...form, profesionalId: e.target.value})} required>
              <option value="">Seleccionar profesional...</option>
              {profesionales.map((u: any) => (
                <option key={u._id} value={u._id}>{u.nombre} {u.apellido}</option>
              ))}
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
                <input type="checkbox" checked={form.notificarPor.includes('wa') || form.notificarPor.includes('ambos')} onChange={() => toggleNotif('wa')} className="rounded border-slate-300" />
                WhatsApp
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.notificarPor.includes('email') || form.notificarPor.includes('ambos')} onChange={() => toggleNotif('email')} className="rounded border-slate-300" />
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

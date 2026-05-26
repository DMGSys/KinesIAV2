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

  const handleEventClick = (info: any) => {
    setEditTurno(info.event.extendedProps);
    setSelectedDate('');
    setShowModal(true);
  };

  const handleClose = () => { setShowModal(false); setEditTurno(null); };

  const handleSaved = (turnoGuardado?: TurnoEvent) => {
    handleClose();
    loadTurnos();
    if (turnoGuardado) {
      const notificaWA = turnoGuardado.notificarPor.includes('wa') || turnoGuardado.notificarPor.includes('ambos');
      if (notificaWA && turnoGuardado.pacienteId?.telefono) {
        const tel = turnoGuardado.pacienteId.telefono.replace(/\D/g, '');
        const msg = encodeURIComponent(
          `Hola ${turnoGuardado.pacienteId.nombre}, tu turno de kinesiología fue agendado para el ${turnoGuardado.fecha} de ${turnoGuardado.horaInicio} a ${turnoGuardado.horaFin}.`
        );
        window.open(`https://wa.me/549${tel}?text=${msg}`, '_blank');
      }
    }
  };

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
                right: 'dayGridMonth,timeGridWeek',
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

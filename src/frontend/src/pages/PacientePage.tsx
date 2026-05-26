import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getAuth, getToken } from '../lib/api';

type Tab = 'ficha' | 'evoluciones' | 'nueva';

interface Paciente {
  id: string;
  nombre: string;
  edad: number;
  dni: string;
  telefono: string;
  email: string;
  obraSocial: string;
  nroAfiliado: string;
  diagnostico: string;
  medicoDerivante: string;
  fechaIngreso: string;
  sesionesTotales: number;
  sesionesRealizadas: number;
  antecedentes: string;
  alergias: string;
  medicacion: string;
}

interface Evolucion {
  _id?: string;
  id?: number;
  pacienteId: string;
  fecha: string;
  sesion: number;
  kinesiologo: string;
  contenido: string;
  tipo: 'escrita' | 'audio';
}

const DEMO_TEXTS = [
  'Paciente refiere disminución del dolor en región lumbar derecha. Se realizaron técnicas de terapia manual en zona paravertebral. Se indicaron ejercicios de fortalecimiento de core para realizar en domicilio. Buena tolerancia a la sesión. EVA inicial: 6/10, EVA final: 3/10.',
  'Evolución de la sesión 9. Paciente presenta buena evolución del cuadro de tendinitis aquílea derecha. Se continuó con ejercicios excéntricos de Aquiles. Se agregó trabajo de propiocepción en plataforma inestable. Sin eventos adversos. Continuar con protocolo.',
  'Sesión número 5. Paciente con síndrome de túnel del carpo bilateral en tratamiento. Se aplicó terapia con láser en ambas manos. Se indican ejercicios de deslizamiento neural para domicile. Mejoría subjetiva del entumecimiento nocturno. Revisión en 2 semanas.'
];

type RecorderState = 'idle' | 'grabando' | 'procesando' | 'listo';

export default function PacientePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('ficha');
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [evoluciones, setEvoluciones] = useState<Evolucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcripcion, setTranscripcion] = useState('');
  const [recState, setRecState] = useState<RecorderState>('idle');
  const [timer, setTimer] = useState(0);
  const [transcriptionMode, setTranscriptionMode] = useState<'real' | 'simulate'>('simulate');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pacRes, evoRes] = await Promise.all([
        api.get(`/api/pacientes/${id}`),
        api.get(`/api/evoluciones?pacienteId=${id}`)
      ]);
      setPaciente(pacRes.data);
      setEvoluciones(evoRes.data);
    } catch {
      setPaciente(null);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setRecState('grabando');
    setTimer(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecState('procesando');
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(blob);
      };

      recorder.start();
    } catch {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecState('procesando');
      setTimeout(() => fallbackTranscription(), 1800);
    }
  };

  const processAudio = async (blob: Blob) => {
    if (transcriptionMode === 'simulate') {
      setTimeout(() => simulateTranscription(), 1600);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/transcribir`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Error al transcribir');
      const data = await res.json();
      setTranscripcion(data.texto || '');
      setRecState('listo');
    } catch {
      fallbackTranscription();
    }
  };

  const simulateTranscription = () => {
    const text = DEMO_TEXTS[Math.floor(Math.random() * DEMO_TEXTS.length)];
    setTranscripcion(text);
    setRecState('listo');
  };

  const fallbackTranscription = () => {
    simulateTranscription();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecState('procesando');
      setTimeout(() => fallbackTranscription(), 1800);
    }
  };

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

  const handleDescartar = () => {
    setTranscripcion('');
    setRecState('idle');
    setTimer(0);
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Cargando...</div>;
  }

  if (!paciente) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Paciente no encontrado</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">Volver al dashboard</button>
      </div>
    );
  }

  const progreso = paciente.sesionesTotales > 0
    ? Math.round((paciente.sesionesRealizadas / paciente.sesionesTotales) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800 truncate">{paciente.nombre}</h1>
          </div>
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
        </div>
        <nav className="max-w-2xl mx-auto px-4 flex border-t border-slate-100">
          {(['ficha', 'evoluciones', 'nueva'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              {t === 'ficha' && '👤 Ficha'}
              {t === 'evoluciones' && '📋 Evoluciones'}
              {t === 'nueva' && '🎙️ Nueva nota'}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {tab === 'ficha' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {paciente.nombre.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{paciente.nombre}</h2>
                  <p className="text-slate-500">{paciente.edad} años · DNI {paciente.dni}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-8">📱</span>
                  <span className="text-slate-700">{paciente.telefono}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-8">✉️</span>
                  <span className="text-slate-700">{paciente.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-8">🏥</span>
                  <span className="text-slate-700">{paciente.obraSocial} {paciente.nroAfiliado && `· #${paciente.nroAfiliado}`}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-8">👨‍⚕️</span>
                  <span className="text-slate-700">{paciente.medicoDerivante}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-8">📅</span>
                  <span className="text-slate-700">Ingreso: {paciente.fechaIngreso}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-2">Diagnóstico</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 text-sm">{paciente.diagnostico}</p>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Progreso de sesiones</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">{paciente.sesionesRealizadas} de {paciente.sesionesTotales} sesiones</span>
                <span className="text-sm font-medium text-primary">{progreso}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progreso}%` }} />
              </div>
            </div>

            {(paciente.alergias || paciente.medicacion || paciente.antecedentes) && (
              <div className="card">
                <h3 className="font-semibold text-slate-700 mb-3">Información clínica</h3>
                <div className="space-y-2 text-sm">
                  {paciente.alergias && (
                    <div className="flex items-start gap-2">
                      <span className="text-red-500">⚠️</span>
                      <div>
                        <span className="text-slate-500">Alergias: </span>
                        <span className="text-slate-700">{paciente.alergias}</span>
                      </div>
                    </div>
                  )}
                  {paciente.medicacion && (
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500">💊</span>
                      <div>
                        <span className="text-slate-500">Medicación: </span>
                        <span className="text-slate-700">{paciente.medicacion}</span>
                      </div>
                    </div>
                  )}
                  {paciente.antecedentes && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500">📋</span>
                      <div>
                        <span className="text-slate-500">Antecedentes: </span>
                        <span className="text-slate-700">{paciente.antecedentes}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'evoluciones' && (
          <div>
            {evoluciones.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-3">Aún no hay evoluciones registradas</p>
                <button onClick={() => setTab('nueva')} className="btn-primary">Agregar primera nota</button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">{evoluciones.length} evolución{evoluciones.length !== 1 ? 'es' : ''}</p>
                {evoluciones.map((evo) => (
                  <div key={evo._id || evo.id} className="card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">Sesión {evo.sesion}</span>
                        <span className={`badge ${evo.tipo === 'audio' ? 'badge-ia' : 'badge-manual'}`}>
                          {evo.tipo === 'audio' ? '🎙️ IA' : '✍️ Manual'}
                        </span>
                      </div>
                      <span className="text-sm text-slate-400">{evo.fecha}</span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{evo.contenido}</p>
                    <p className="text-xs text-slate-400 mt-2">Por {evo.kinesiologo}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'nueva' && (
          <div className="space-y-4">
            {recState === 'idle' && (
              <div className="card text-center space-y-4">
                <p className="text-slate-500 text-sm">Registrá una nueva nota de evolución</p>
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => { setTranscriptionMode('real'); startRecording(); }}
                    className="btn-primary px-8 py-3 text-base"
                  >
                    🎙️ Grabar nota de voz
                  </button>
                  <div className="relative flex items-center gap-2 text-sm text-slate-400">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span>o</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <button
                    onClick={() => { setTranscriptionMode('simulate'); startRecording(); }}
                    className="btn-secondary px-8 py-2 text-sm"
                  >
                    Simular con IA (demo)
                  </button>
                </div>
              </div>
            )}

            {recState === 'grabando' && (
              <div className="card text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-recording/10 flex items-center justify-center animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-recording flex" />
                  </div>
                </div>
                <div>
                  <p className="text-recording font-semibold text-lg">{formatTimer(timer)}</p>
                  <p className="text-slate-400 text-sm">Grabando...</p>
                </div>
                <div className="h-12 flex items-end justify-center gap-0.5 px-4">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-recording rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 40 + 10}%`,
                        animationDelay: `${i * 50}ms`
                      }}
                    />
                  ))}
                </div>
                <button onClick={stopRecording} className="btn-danger px-8 py-2">
                  ⏹ Detener
                </button>
              </div>
            )}

            {recState === 'procesando' && (
              <div className="card text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
                </div>
                <div>
                  <p className="text-slate-700 font-medium">KinesIA está procesando...</p>
                  <p className="text-slate-400 text-sm">Transcribiendo y estructurando la nota</p>
                </div>
              </div>
            )}

            {recState === 'listo' && (
              <div className="card space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <span>✨</span>
                  <span className="font-medium">Transcripción lista</span>
                  <span className="badge badge-ia">IA</span>
                </div>
                <textarea
                  className="input-field min-h-[160px]"
                  value={transcripcion}
                  onChange={(e) => setTranscripcion(e.target.value)}
                  placeholder="Editá la transcripción si es necesario..."
                />
                <div className="flex gap-3">
                  <button onClick={handleConfirmar} disabled={saving} className={`btn-primary flex-1 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Guardando evolución...
                      </span>
                    ) : '✅ Agregar a evoluciones'}
                  </button>
                  <button onClick={handleDescartar} className="btn-secondary">
                    Descartar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

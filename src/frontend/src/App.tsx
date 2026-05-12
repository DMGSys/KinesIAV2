import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth } from './lib/api';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PacientePage from './pages/PacientePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/paciente/:id"
          element={
            <ProtectedRoute>
              <PacientePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ModulePage from './components/ModulePage';
import { moduleConfigs } from './config/modules';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="empty-state" style={{ minHeight: '100vh' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<ModulePage config={moduleConfigs.clients} />} />
        <Route path="/projects" element={<ModulePage config={moduleConfigs.projects} />} />
        <Route path="/billing" element={<ModulePage config={moduleConfigs.billing} />} />
        <Route path="/payments" element={<ModulePage config={moduleConfigs.payments} />} />
        <Route path="/transactions" element={<ModulePage config={moduleConfigs.transactions} />} />
        <Route path="/employees" element={<ModulePage config={moduleConfigs.employees} />} />
        <Route path="/salaries" element={<ModulePage config={moduleConfigs.salaries} />} />
        <Route path="/attendance" element={<ModulePage config={moduleConfigs.attendance} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppRoutes />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

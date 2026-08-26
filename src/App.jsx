// src/App.jsx
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Unauthorized from './pages/Unauthorized';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Chat from './components/Chat';
import ChatPage from './pages/ChatPage';
import Settings from './pages/Settings';
import BackButton from './components/BackButton';
import { useAuth } from './context/AuthContext';
import { normalizeRole } from './utils/roles';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const normalizedRole = normalizeRole(user?.role);
  const isPublicPage = ['/', '/login', '/register', '/unauthorized'].includes(location.pathname);

  useEffect(() => {
    if (isAuthenticated && isPublicPage) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isPublicPage, navigate]);

  return (
    <>
      {!isPublicPage && <BackButton />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes: USER, DEVELOPER, ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={['USER', 'DEVELOPER', 'ADMIN']} />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:userId" element={<ChatPage />} />
        </Route>

        {/* Admin / Developer Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['DEVELOPER', 'ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {normalizedRole === 'DEVELOPER' && (
          <Route element={<ProtectedRoute allowedRoles={['DEVELOPER']} />}>
            <Route path="/developer" element={<AdminDashboard />} />
          </Route>
        )}
      </Routes>
    </>
  );
}

function App() {
  return (
    <AppContent />
  );
}

export default App;
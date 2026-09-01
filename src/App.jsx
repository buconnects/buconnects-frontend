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

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

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

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    const subscribeToPushNotifications = async () => {
      try {
        const permission = Notification.permission;
        if (permission === 'default') {
          const granted = await Notification.requestPermission();
          if (granted !== 'granted') return;
        }

        if (permission !== 'granted' && Notification.permission !== 'granted') return;

        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await registration.update();

        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) return;

        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.warn('Push notification key is not configured yet.');
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ userId: user.id, subscription }),
        });
      } catch (error) {
        console.error('Failed to register push notifications:', error);
      }
    };

    subscribeToPushNotifications();
  }, [isAuthenticated, user?.id]);

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
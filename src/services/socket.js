// src/services/socket.js
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socketHost = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');

export const socket = io(socketHost, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
});

export const registerSocketUser = (userId) => {
  if (!userId) return;
  const uid = String(userId);
  if (socket.connected) {
    socket.emit('register_user', uid);
  }
};

// Auto register whenever socket reconnects
socket.on('connect', () => {
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed?.id) {
        socket.emit('register_user', String(parsed.id));
      }
    }
  } catch (e) {
    console.error('Socket reconnect register error:', e);
  }
});

export default socket;

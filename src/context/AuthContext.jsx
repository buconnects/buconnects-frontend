// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import API from "../services/api";
import { normalizeRole } from '../utils/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    const parsed = savedUser ? JSON.parse(savedUser) : null;
    return parsed ? { ...parsed, role: normalizeRole(parsed.role) } : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    const { token: newToken, user: userData } = res.data;
    const normalizedUser = { ...userData, role: normalizeRole(userData.role) };

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    setToken(newToken);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const register = async (formData) => {
    const res = await API.post("/auth/register", formData);
    const { token: newToken, user: userData } = res.data;
    const normalizedUser = { ...userData, role: normalizeRole(userData.role) };

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    setToken(newToken);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((currentUser) => {
      const nextUser = { ...currentUser, ...updates, role: normalizeRole(updates.role || currentUser?.role) };
      localStorage.setItem('user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
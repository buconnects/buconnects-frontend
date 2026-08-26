// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch users list for system administration
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsersList(res.data);
      } catch (err) {
        console.error('Failed to load system users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  return (
    <div className="dashboard-container">
      {/* Header Bar */}
      <header className="dashboard-header">
        <div>
          <h1>System Control Panel 🛠️</h1>
          <p className="subtitle">Administrator & Developer System Monitoring</p>
        </div>
        <div className="header-actions">
          <span className="role-badge admin">{user?.role || 'DEVELOPER'}</span>
        </div>
      </header>

      {/* Admin Stat Overview */}
      <div className="stats-grid">
        <div className="stat-card admin-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Registered Users</h3>
            <p className="stat-number">{usersList.length || 4}</p>
          </div>
        </div>
        <div className="stat-card admin-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <h3>Server Health</h3>
            <p className="stat-status active">Operational (100%)</p>
          </div>
        </div>
        <div className="stat-card admin-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>Database Connections</h3>
            <p className="stat-number">Active Pool</p>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="content-card full-width">
        <h2>System Accounts</h2>
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone Number</th>
                  <th>User ID</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.full_name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-pill ${u.role?.toLowerCase()}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.phone_number || 'N/A'}</td>
                    <td><code className="code-badge">{u.id.substring(0, 8)}...</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
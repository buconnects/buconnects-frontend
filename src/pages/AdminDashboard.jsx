import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Trash2, Users, Activity, Cpu, Search, RefreshCw } from 'lucide-react';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch users list
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(Array.isArray(res.data) ? res.data : res.data?.users || []);
    } catch (err) {
      console.error('Failed to load system users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  // Handle User Deletion
  const handleDeleteUser = async (userId, userName) => {
    if (userId === user?.id) {
      alert('Action denied: You cannot delete your own administrative account.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete user "${userName || userId}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeletingId(userId);
    try {
      await axios.delete(`${API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update state dynamically
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err.message);
      alert(err.response?.data?.message || 'Failed to delete user from system.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Users List
  const filteredUsers = usersList.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Bar */}
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: '#000000' }}>System Control Panel </h1>
          <p className="subtitle" style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Administrator & Developer Infrastructure Operations
          </p>
        </div>
        <div className="header-actions">
          <span className={user?.role === 'DEVELOPER' ? 'developer-badge' : 'admin-badge'}>
            {user?.role || 'ADMINISTRATOR'}
          </span>
        </div>
      </header>

      {/* Admin Stat Overview */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="stat-card admin-card" style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="stat-icon" style={{ background: '#eef2ff', color: '#6366f1', padding: '0.85rem', borderRadius: '12px', display: 'flex' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Registered Users</h3>
            <p className="stat-number" style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0.2rem 0 0 0' }}>
              {loading ? '...' : usersList.length}
            </p>
          </div>
        </div>

        <div className="stat-card admin-card" style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981', padding: '0.85rem', borderRadius: '12px', display: 'flex' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Server Health</h3>
            <p className="stat-status active" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981', margin: '0.2rem 0 0 0' }}>
              Operational (100%)
            </p>
          </div>
        </div>

        <div className="stat-card admin-card" style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.85rem', borderRadius: '12px', display: 'flex' }}>
            <Cpu size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Database Status</h3>
            <p className="stat-number" style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0.2rem 0 0 0' }}>
              Active Pool
            </p>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="admin-toolbar">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#000000ff' }}>System Accounts</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Manage and monitor registered platform accounts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              className="admin-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={fetchUsers}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              padding: '0.6rem',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-main)'
            }}
            title="Refresh User List"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '1.5rem 0' }}>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {[...Array(5)].map((_, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.8fr 2fr 1fr 1.2fr 1.2fr 0.8fr', gap: '1rem', padding: '0.85rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ height: '18px', background: '#e2e8f0', borderRadius: '999px' }} />
                  <div style={{ height: '18px', background: '#e2e8f0', borderRadius: '999px' }} />
                  <div style={{ height: '18px', background: '#e2e8f0', borderRadius: '999px' }} />
                  <div style={{ height: '18px', background: '#e2e8f0', borderRadius: '999px' }} />
                  <div style={{ height: '18px', background: '#e2e8f0', borderRadius: '999px' }} />
                  <div style={{ height: '18px', background: '#e2e8f0', borderRadius: '999px' }} />
                </div>
              ))}
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <ShieldAlert size={32} style={{ marginBottom: '0.5rem', color: '#cbd5e1' }} />
            <p>No user accounts matching your criteria.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Phone Number</th>
                <th>User Identifier</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSelf = u.id === user?.id;
                const displayName = u.full_name || u.name || 'Unnamed User';
                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{displayName}</strong>
                      {isSelf && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#6366f1' }}>(You)</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-pill ${(u.role || 'user').toLowerCase()}`}>
                        {u.role || 'USER'}
                      </span>
                    </td>
                    <td>{u.phone_number || u.phone || 'N/A'}</td>
                    <td>
                      <code className="code-badge">
                        {typeof u.id === 'string' ? u.id.substring(0, 8) : u.id}...
                      </code>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="delete-user-btn"
                        onClick={() => handleDeleteUser(u.id, displayName)}
                        disabled={isSelf || deletingId === u.id}
                        title={isSelf ? "You cannot delete your own account" : "Delete User"}
                      >
                        <Trash2 size={14} />
                        {deletingId === u.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
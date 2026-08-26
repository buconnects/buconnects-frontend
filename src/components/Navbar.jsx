import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import  AuthContext  from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ onOpenChats, unreadCount = 0, onOpenNotifications }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkNotificationsRead = () => {
    setShowNotifications((open) => !open);
    onOpenNotifications?.();
  };

  return (
    <header className="main-navbar">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <div className="navbar-brand">
          <Link to="/dashboard" className="brand-logo">
            <img src='/bu-CONNECTS-logo.png' alt="buCONNECTS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Link>
        </div>

        {/* Center Main App Links */}
        <nav className="navbar-links">
          <Link to="/dashboard" className="nav-item">Dashboard</Link>
          <button type="button" onClick={onOpenChats} className="nav-item nav-link-button">Chat</button>
          <Link to="/settings" className="nav-item">Settings</Link>
          
          {(user?.role === 'ADMIN' || user?.role === 'DEVELOPER') && (
            <Link to="/admin" className="nav-item admin-link">Admin Panel</Link>
          )}

          {user?.role === 'DEVELOPER' && (
            <Link to="/developer" className="nav-item admin-link">Developer Tools</Link>
          )}
        </nav>

        {/* Right Section: Socials, Notifications, Logout */}
        <div className="navbar-actions">
          {/* Social Links */}
          <div className="social-links">
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="social-icon whatsapp" title="WhatsApp">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.12.55 4.13 1.6 5.91L2 22l4.33-1.63c1.72.94 3.67 1.44 5.71 1.44 5.46 0 9.91-4.45 9.91-9.91A9.91 9.91 0 0 0 12.04 2zm0 18.1a8.16 8.16 0 0 1-4.18-1.15l-.3-.18-3.1 1.17.84-2.96-.2-.31a8.17 8.17 0 0 1 13.11-6.76c2.25 2.25 2.25 5.91 0 8.16a8.13 8.13 0 0 1-6.17 2.03z"/>
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon facebook" title="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.6 13.78 5.6c1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 3h-2.33v6.8c4.56-.93 8-4.96 8-9.8z"/>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon youtube" title="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>

          <div className="divider-line"></div>

          {/* Notifications Trigger */}
          <div className="notification-wrapper">
            <button 
              className="icon-btn" 
              onClick={handleMarkNotificationsRead}
              title="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="dropdown-header">Notifications</div>
                <div className="dropdown-body">
                  <p className="empty-text">No new notifications</p>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
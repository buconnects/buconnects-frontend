import React, { useState, useEffect } from 'react';
import { Bell, Check, LockKeyhole, Palette, Shield, UserRound } from 'lucide-react';
import apiClient from '../services/apiClient';
import './Settings.css';

export default function Settings({ embedded = false }) {
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Settings State
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    profileVisibility: 'CAMPUS_ONLY',
    showEmail: false,
    theme: 'SYSTEM',
  });

  // Password State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    if (settings.theme !== 'SYSTEM') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => applyTheme('SYSTEM');
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [settings.theme]);

  const applyTheme = (theme) => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedTheme = theme === 'SYSTEM' ? (prefersDark ? 'DARK' : 'LIGHT') : theme;
    document.documentElement.dataset.theme = resolvedTheme.toLowerCase();
  };

  const fetchSettings = async () => {
    try {
      const data = await apiClient('/settings');
      setSettings({
        emailNotifications: Boolean(data.email_notifications),
        pushNotifications: Boolean(data.push_notifications),
        soundEnabled: Boolean(data.sound_enabled),
        profileVisibility: data.profile_visibility || 'CAMPUS_ONLY',
        showEmail: Boolean(data.show_email),
        theme: data.theme || 'SYSTEM',
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load user settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      await apiClient('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      applyTheme(settings.theme);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings' });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      await apiClient('/settings/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    }
  };

  if (loading) {
    return (
      <div className={`settings-container ${embedded ? 'settings-embedded' : ''}`}>
        <div className="settings-heading">
          <div>
            <p className="settings-eyebrow">Personal workspace</p>
            <h1 className="settings-title">Account Settings</h1>
          </div>
        </div>

        <div className="settings-tabs" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          {[...Array(4)].map((_, index) => (
            <div key={index} className="skeleton-line" style={{ width: '110px', height: '38px', background: '#e2e8f0', borderRadius: '999px' }} />
          ))}
        </div>

        <div className="settings-form" style={{ display: 'grid', gap: '1rem' }}>
          {[...Array(3)].map((_, index) => (
            <div key={index} className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.85rem 0' }}>
              <div style={{ flex: 1, display: 'grid', gap: '0.5rem' }}>
                <div className="skeleton-line" style={{ width: '35%', height: '14px', background: '#e2e8f0', borderRadius: '999px' }} />
                <div className="skeleton-line" style={{ width: '60%', height: '12px', background: '#e2e8f0', borderRadius: '999px' }} />
              </div>
              <div className="skeleton-line" style={{ width: '44px', height: '24px', background: '#e2e8f0', borderRadius: '999px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`settings-container ${embedded ? 'settings-embedded' : ''}`}>
      <div className="settings-heading">
        <div>
          <p className="settings-eyebrow">Personal workspace</p>
          <h1 className="settings-title">Account Settings</h1>
          <p className="settings-intro">Control your notifications, privacy, security, and appearance.</p>
        </div>
        <div className="settings-account-mark"><UserRound size={22} /></div>
      </div>

      {message.text && (
        <div className={`settings-alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="settings-tabs">
        {[
          ['notifications', Bell],
          ['privacy', Shield],
          ['security', LockKeyhole],
          ['preferences', Palette],
        ].map(([tab, Icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
          >
            <Icon size={16} />
            {tab}
          </button>
        ))}
      </div>

      {/* 1. Notifications Tab */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSavePreferences} className="settings-form">
          <div className="setting-row">
            <div className="setting-info">
              <p className="setting-label">Email Alerts</p>
              <p className="setting-description">Receive campus updates and announcements via email</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
              className="checkbox-input"
            />
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <p className="setting-label">Push Notifications</p>
              <p className="setting-description">Receive real-time popups on comments and mentions</p>
            </div>
            <input
              type="checkbox"
              checked={settings.pushNotifications}
              onChange={() => handleToggle('pushNotifications')}
              className="checkbox-input"
            />
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <p className="setting-label">Notification Sounds</p>
              <p className="setting-description">Play chime when new direct messages arrive</p>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={() => handleToggle('soundEnabled')}
              className="checkbox-input"
            />
          </div>

          <button type="submit" className="save-btn">
            <Check size={16} />
            Save Changes
          </button>
        </form>
      )}

      {/* 2. Privacy Tab */}
      {activeTab === 'privacy' && (
        <form onSubmit={handleSavePreferences} className="settings-form">
          <div className="form-group">
            <label className="form-label">Profile Visibility</label>
            <select
              value={settings.profileVisibility}
              onChange={(e) =>
                setSettings({ ...settings, profileVisibility: e.target.value })
              }
              className="select-input"
            >
              <option value="PUBLIC">Public (Anyone can view)</option>
              <option value="CAMPUS_ONLY">Campus Only (BU Students & Faculty)</option>
              <option value="PRIVATE">Private (Only Connections)</option>
            </select>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <p className="setting-label">Display Email on Profile</p>
              <p className="setting-description">Allow other students to see your institutional email address</p>
            </div>
            <input
              type="checkbox"
              checked={settings.showEmail}
              onChange={() => handleToggle('showEmail')}
              className="checkbox-input"
            />
          </div>

          <button type="submit" className="save-btn">
            <Check size={16} />
            Save Changes
          </button>
        </form>
      )}

      {/* 3. Security Tab */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordChange} className="settings-form form-narrow">
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, currentPassword: e.target.value })
              }
              className="text-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
              className="text-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              required
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, confirmPassword: e.target.value })
              }
              className="text-input"
            />
          </div>

          <button type="submit" className="save-btn">
            <LockKeyhole size={16} />
            Update Password
          </button>
        </form>
      )}

      {/* 4. Preferences Tab */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="settings-form">
          <div className="form-group">
            <label className="form-label">Appearance Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="select-input"
            >
              <option value="LIGHT">Light Theme</option>
              <option value="DARK">Dark Theme</option>
              <option value="SYSTEM">Follow System Preference</option>
            </select>
          </div>

          <button type="submit" className="save-btn">
            <Check size={16} />
            Save Preferences
          </button>
        </form>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Camera, Check, Mail, Phone, UserRound } from 'lucide-react';
import apiClient from '../services/apiClient';
import './Profile.css';

const emptyProfile = {
  id: '',
  fullName: '',
  email: '',
  phoneNumber: '',
  campus: '',
  role: 'USER',
  avatarUrl: '',
  createdAt: '',
};

export default function Profile({ onProfileUpdated }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiClient('/users/profile');
        setProfile(data);
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Unable to load your profile.' });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please choose an image file.' });
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Profile pictures must be smaller than 5 MB.' });
      event.target.value = '';
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage({ type: '', text: '' });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('fullName', profile.fullName.trim());
      formData.append('phoneNumber', profile.phoneNumber.trim());
      formData.append('campus', profile.campus.trim());
      if (selectedFile) formData.append('avatar', selectedFile);

      const updatedProfile = await apiClient('/users/profile', {
        method: 'PUT',
        body: formData,
      });

      setProfile(updatedProfile);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      onProfileUpdated?.(updatedProfile);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to update your profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="profile-loading">Loading your profile...</div>;

  const displayedAvatar = previewUrl || profile.avatarUrl;
  const initials = (profile.fullName || 'User').charAt(0).toUpperCase();
  const joinedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <section className="profile-container">
      <div className="profile-heading">
        <div>
          <p className="profile-eyebrow">Your campus identity</p>
          <h1>My Profile</h1>
          <p className="profile-intro">Keep your personal details current so people know who they are connecting with.</p>
        </div>
        <div className="profile-heading-icon"><UserRound size={22} /></div>
      </div>

      {message.text && <div className={`profile-alert profile-alert-${message.type}`}>{message.text}</div>}

      <div className="profile-layout">
        <aside className="profile-summary">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {displayedAvatar ? <img src={displayedAvatar} alt={`${profile.fullName} profile`} /> : initials}
            </div>
            <label className="profile-camera-button" title="Choose profile picture">
              <Camera size={16} />
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
            </label>
          </div>
          <h2>{profile.fullName || 'Campus User'}</h2>
          <span className="profile-role">{profile.role}</span>
          <p className="profile-member-since">Member since {joinedDate}</p>
          <p className="profile-picture-note">Choose a JPG, PNG, or WebP image up to 5 MB. You can review it before saving.</p>
        </aside>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form-header">
            <div>
              <h2>Personal details</h2>
              <p>These details are saved to your account.</p>
            </div>
            <Check size={20} />
          </div>

          <div className="profile-field-grid">
            <label className="profile-field">
              <span>Full name</span>
              <input name="fullName" value={profile.fullName} onChange={handleChange} required />
            </label>
            <label className="profile-field">
              <span>Email address</span>
              <div className="profile-input-with-icon"><Mail size={16} /><input value={profile.email} readOnly /></div>
              <small>Email changes are managed by an administrator.</small>
            </label>
            <label className="profile-field">
              <span>Phone number</span>
              <div className="profile-input-with-icon"><Phone size={16} /><input name="phoneNumber" value={profile.phoneNumber} onChange={handleChange} placeholder="Add a phone number" /></div>
            </label>
            <label className="profile-field">
              <span>Campus</span>
              <input name="campus" value={profile.campus} onChange={handleChange} placeholder="Add your campus" />
            </label>
          </div>

          <div className="profile-actions">
            <button type="submit" className="profile-save-button" disabled={saving}>
              <Check size={17} />
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

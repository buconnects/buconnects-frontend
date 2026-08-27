import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const BUSITEMA_CAMPUSES = [
  'Main Campus (Busitema)',
  'Nagongera Campus',
  'Mbale Campus',
  'Arapai Campus',
  'Namasagali Campus',
  'Pallisa Campus',
  'Kaliro Campus'
];

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    campus: BUSITEMA_CAMPUSES[0],
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      await register(formData);
      // Explicitly navigate to login page after successful registration
      navigate('/login', { state: { registered: true, email: formData.email } });
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      if (serverMsg && serverMsg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: serverMsg }));
      } else {
        setGeneralError(serverMsg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ maxHeight: '60px', overflow: 'hidden', marginBottom: '0.75rem' }}>
            <img src='/bu-CONNECTS-logo.png' alt="buCONNECTS Logo" style={{ maxHeight: '60px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Create your account</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Join the buCONNECTS campus network</p>
        </div>

        {generalError && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* FULL NAME */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Okello John"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                  borderRadius: '8px',
                  border: errors.fullName ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  fontSize: '0.925rem',
                  backgroundColor: '#fff',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            {errors.fullName && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem', margin: '0.3rem 0 0 0' }}>{errors.fullName}</p>}
          </div>

          {/* EMAIL ADDRESS */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@busitema.ac.ug"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                  borderRadius: '8px',
                  border: errors.email ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  fontSize: '0.925rem',
                  backgroundColor: '#fff',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            {errors.email && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem', margin: '0.3rem 0 0 0' }}>{errors.email}</p>}
          </div>

          {/* CAMPUS SELECT */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>Select Campus</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <select
                name="campus"
                value={formData.campus}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.925rem',
                  backgroundColor: '#fff',
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                {BUSITEMA_CAMPUSES.map((campus) => (
                  <option key={campus} value={campus}>
                    {campus}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PASSWORD WITH SEE PASSWORD TOGGLE */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.65rem 2.4rem 0.65rem 2.4rem',
                  borderRadius: '8px',
                  border: errors.password ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  backgroundColor: '#fff',
                  color: '#0f172a',
                  fontSize: '0.925rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem', margin: '0.3rem 0 0 0' }}>{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span>{loading ? 'Creating account...' : 'Register'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
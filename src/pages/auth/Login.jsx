import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true, state: { showLoginToast: true } });
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.response?.data?.message || 'Invalid credentials or server offline.';
      
      if (serverMsg.toLowerCase().includes('email') || serverMsg.toLowerCase().includes('user')) {
        setErrors((prev) => ({ ...prev, email: serverMsg }));
      } else if (serverMsg.toLowerCase().includes('password')) {
        setErrors((prev) => ({ ...prev, password: serverMsg }));
      } else {
        setGeneralError(serverMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)' }}>
        
        {/* LOGO AND TITLE */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ maxHeight: '60px', overflow: 'hidden', marginBottom: '0.75rem' }}>
            <img src='/bu-CONNECTS-logo.png' alt="buCONNECTS Logo" style={{ maxHeight: '60px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Login to buCONNECTS</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Enter your credentials to continue</p>
        </div>

        {/* REGISTRATION SUCCESS BANNER */}
        {location.state?.registered && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
            Account created successfully! Please sign in with your password.
          </div>
        )}

        {/* GENERAL SERVER ERROR */}
        {generalError && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* EMAIL FIELD */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="admin@buconnects.com"
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
            {errors.email && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0.3rem 0 0 0' }}>{errors.email}</p>}
          </div>

          {/* PASSWORD FIELD WITH SEE PASSWORD TOGGLE */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
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
            {errors.password && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0.3rem 0 0 0' }}>{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
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
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
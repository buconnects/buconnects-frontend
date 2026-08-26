import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BackButton.css';

export default function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    if (location.pathname === '/dashboard') {
      window.dispatchEvent(new CustomEvent('dashboard-back'));
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <button type="button" className="site-back-button" onClick={handleBack} title="Back to dashboard">
      <ArrowLeft size={17} />
      <span>Back</span>
    </button>
  );
}

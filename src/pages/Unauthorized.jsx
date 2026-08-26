// src/pages/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <div className="content-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '2.5rem' }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>🚫 403</h1>
        <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
          You do not have the required permissions or role to view this page.
        </p>
        <button 
          className="btn-primary" 
          onClick={() => navigate('/dashboard')}
          style={{ width: '100%', textAlign: 'center' }}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
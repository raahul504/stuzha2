// frontend/src/pages/VerifyEmail.jsx - Already exists, UPDATE

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    apiClient.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'Verification failed');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-gradient">
      <div className="bg-dcs-dark-gray p-12 rounded-[20px] shadow-2xl border border-dcs-purple/20 text-center max-w-md">
        {status === 'verifying' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dcs-purple mx-auto mb-4"></div>
            <p className="text-white">Verifying email...</p>
          </div>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-400 text-6xl mb-6">✓</div>
            <p className="text-green-400 text-xl mb-8">{message}</p>
            <button 
              onClick={() => navigate('/login')} 
              className="btn-purple"
            >
              Login
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-400 text-6xl mb-6">✕</div>
            <p className="text-red-400 text-xl mb-8">{message}</p>
            <button 
              onClick={() => navigate('/register')} 
              className="btn-purple"
            >
              Register Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
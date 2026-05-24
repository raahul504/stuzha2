import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
        setError('Invalid or expired reset link');
        return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      showSuccess('Password reset successful!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-gradient">
      <div className="bg-dcs-dark-gray w-[90%] max-w-[450px] p-12 rounded-[20px] shadow-2xl border border-dcs-purple/20">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Reset Password</h2>
        
        {error && <div className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-dcs-text-gray mb-2 text-sm">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="form-input"
            />
            <p className="text-xs text-dcs-text-gray mt-1">Minimum 8 characters</p>
          </div>

          <div className="mb-6">
            <label className="block text-dcs-text-gray mb-2 text-sm">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-4 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: loading || !token ? 'none' : '0 5px 15px rgba(157, 80, 187, 0.4)' }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
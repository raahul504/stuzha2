import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../api/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authService.forgotPassword(email);
      setMessage(result.message);
    } catch (err) {
      setMessage('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-gradient">
      <div className="bg-dcs-dark-gray w-[90%] max-w-[450px] p-12 rounded-[20px] shadow-2xl border border-dcs-purple/20">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Forgot Password</h2>
        
        {message && (
          <div className="bg-blue-900/30 border border-blue-500/30 text-blue-300 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-dcs-text-gray mb-2 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: loading ? 'none' : '0 5px 15px rgba(157, 80, 187, 0.4)' }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-dcs-text-gray">
          <Link to="/login" className="text-dcs-purple no-underline font-bold hover:text-dcs-electric-indigo cursor-pointer">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
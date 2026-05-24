import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import { authService } from '../api/authService';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData);
      if (result.requiresOtp) {
        setUserId(result.userId);
        setOtpRequired(true);
        setLoading(false);
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.verifyOtp(userId, otp);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-gradient">
      <div className="bg-dcs-dark-gray w-[90%] max-w-[450px] p-12 rounded-[20px] shadow-2xl border border-dcs-purple/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Data Centre Skills</h1>
        </div>

        <h2 className="text-center mb-6 font-bold text-white text-2xl">Login</h2>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}

        {otpRequired ? (
          <form onSubmit={handleOtpSubmit}>
            <p className="text-dcs-text-gray mb-4 text-sm">
              Your account has been inactive for 60+ days. Enter the OTP sent to your email.
            </p>
            <div className="mb-6">
              <label className="block mb-2 text-sm text-dcs-text-gray">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                placeholder="______"
                className="form-input text-center tracking-widest text-2xl font-bold"
                required
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: loading ? 'none' : '0 5px 15px rgba(157, 80, 187, 0.4)' }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block mb-2 text-sm text-dcs-text-gray">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm text-dcs-text-gray">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
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
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-dcs-text-gray">
          <p className="mb-2">
            <Link to="/forgot-password" className="text-dcs-purple no-underline font-bold hover:text-dcs-electric-indigo cursor-pointer">
              Forgot Password?
            </Link>
          </p>
          <p>
            New here?{' '}
            <Link to="/register" className="text-dcs-purple no-underline font-bold hover:text-dcs-electric-indigo cursor-pointer">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
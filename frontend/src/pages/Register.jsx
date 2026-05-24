import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import { showSuccess, showError } from '../utils/toast';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      showSuccess('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
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

        <h2 className="text-center mb-6 font-bold text-white text-2xl">Join the Wave</h2>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-2 text-sm text-dcs-text-gray">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm text-dcs-text-gray">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm text-dcs-text-gray">Email</label>
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
            <label className="block mb-2 text-sm text-dcs-text-gray">Phone Number <span className="text-dcs-text-gray/50">(required for instructors)</span></label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+1234567890"
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
              minLength={8}
              className="form-input"
            />
            <p className="text-xs text-dcs-text-gray mt-1">Minimum 8 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: loading ? 'none' : '0 5px 15px rgba(157, 80, 187, 0.4)' }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-dcs-text-gray">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-dcs-purple no-underline font-bold hover:text-dcs-electric-indigo cursor-pointer">
              Return to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
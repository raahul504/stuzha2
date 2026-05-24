import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../api/userService';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { showSuccess, showError } from '../utils/toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);

  // Profile info form
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Fetch fresh profile data instead of using AuthContext user
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        setProfileForm({
          firstName: data.profile.firstName || '',
          lastName: data.profile.lastName || '',
          email: data.profile.email || '',
          phoneNumber: data.profile.phoneNumber || '',
        });
      } catch (err) {
        console.error('Failed to load profile');
      }
    };

    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await userService.updateProfile(profileForm);
      showSuccess('Profile updated successfully');
      updateUser(data.user);
    } catch (err) {
      console.error('Error caught:', err); // Debug
      showError(err.response?.data?.error?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await userService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.response?.data?.error?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dcs-black">
      <Navbar />
      <div className="pt-24 sm:pt-32 pb-12 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl text-center mb-8 sm:mb-12 bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent">
            My Profile
          </h1>

          {/* Tabs */}
          <div className="card overflow-hidden">
            <div className="flex border-b border-dcs-purple/20 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 sm:px-6 py-3 font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${activeTab === 'info'
                  ? 'border-b-2 border-dcs-purple text-dcs-purple'
                  : 'text-dcs-text-gray hover:text-white'
                  }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-4 sm:px-6 py-3 font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${activeTab === 'password'
                  ? 'border-b-2 border-dcs-purple text-dcs-purple'
                  : 'text-dcs-text-gray hover:text-white'
                  }`}
              >
                Change Password
              </button>
            </div>

            <div className="p-4 sm:p-8">

              {/* Profile Info Tab */}
              {activeTab === 'info' && (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div>
                    <label className="block text-dcs-text-gray mb-2 text-sm">First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, firstName: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-dcs-text-gray mb-2 text-sm">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, lastName: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-dcs-text-gray mb-2 text-sm">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, email: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-dcs-text-gray mb-2 text-sm">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phoneNumber}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phoneNumber: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>

                  <div className="bg-dcs-black p-4 rounded border border-dcs-purple/20">
                    <p className="text-sm text-dcs-text-gray mb-2">
                      <strong className="text-white">Role:</strong> {user?.role}
                    </p>
                    <p className="text-sm text-dcs-text-gray">
                      <strong className="text-white">Member since:</strong>{' '}
                      {new Date(user?.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    style={{ boxShadow: loading ? 'none' : '0 5px 15px rgba(157, 80, 187, 0.4)' }}
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <label className="block text-dcs-text-gray mb-2 text-sm">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-dcs-text-gray mb-2 text-sm">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className="form-input"
                      minLength={8}
                      required
                    />
                    <p className="text-xs text-dcs-text-gray mt-1">Minimum 8 characters</p>
                  </div>

                  <div>
                    <label className="block text-dcs-text-gray mb-2 text-sm">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    style={{ boxShadow: loading ? 'none' : '0 5px 15px rgba(157, 80, 187, 0.4)' }}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
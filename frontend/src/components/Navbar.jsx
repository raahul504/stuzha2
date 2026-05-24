import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../api/messageService';
import DCS_Skills_logo from "../assets/DCS_Skills_logo.png"
import Powered_by_ABS_logo from "../assets/Powered_by_ABS_logo.png"

export default function Navbar() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowDropdown(false);
    setMobileMenuOpen(false);
  };

  const getInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase() || 'U';
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      const data = await messageService.getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const navTo = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setShowDropdown(false);
  };

  // Don't render user info while loading
  if (loading) {
    return (
      <nav className="fixed top-0 w-full max-w-[100vw] bg-dcs-black/95 backdrop-blur-lg z-50 border-b border-dcs-purple/20 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-4 flex justify-end items-center">
          <div className="text-white">Loading...</div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="fixed top-0 w-full max-w-[100vw] bg-dcs-black/95 backdrop-blur-lg z-50 border-b border-dcs-purple/20 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-1 sm:py-2 flex justify-between items-center">

          {/* Logo / Brand - visible on all screens */}
          <button
            onClick={() => navTo('/')}
          >
            <span><img src={DCS_Skills_logo} alt="DCS Skills" className="h-15 sm:h-18 object-contain" /></span>
          </button>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex gap-6 list-none items-center">
            <li>
              <span><img src={Powered_by_ABS_logo} alt="Powered by Abstream" className="h-12 sm:h-15 object-contain" /></span>
            </li>
            <li>
              <button
                onClick={() => navTo('/')}
                className="text-white no-underline font-medium text-sm transition-all duration-300 hover:text-dcs-purple"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => navTo('/courses')}
                className="text-white no-underline font-medium text-sm transition-all duration-300 hover:text-dcs-purple"
              >
                Courses
              </button>
            </li>
            {isAuthenticated && (
              <>
                <li>
                  <button
                    onClick={() => navTo('/my-courses')}
                    className="text-white no-underline font-medium text-sm transition-all duration-300 hover:text-dcs-purple"
                  >
                    My Courses
                  </button>
                </li>
                {(user?.role === 'ADMIN') && (
                  <li>
                    <button
                      onClick={() => navTo('/admin')}
                      className="text-white no-underline font-medium text-sm transition-all duration-300 hover:text-dcs-purple"
                    >
                      Admin
                    </button>
                  </li>
                )}
                {(user?.role === 'INSTRUCTOR') && (
                  <li>
                    <button
                      onClick={() => navTo('/instructor')}
                      className="text-white no-underline font-medium text-sm transition-all duration-300 hover:text-dcs-purple"
                    >
                      Instructor
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => navTo('/messages')}
                    className="text-white no-underline font-medium text-sm transition-all duration-300 hover:text-dcs-purple relative"
                  >
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </li>
                <li className="relative" ref={dropdownRef}>
                  <div
                    className="flex items-center gap-2.5 cursor-pointer px-3 py-1.5 rounded-full bg-dcs-light-gray border border-dcs-purple/30 hover:border-dcs-purple/50 transition-all"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <div className="w-8 h-8 bg-dcs-purple text-white rounded-full flex justify-center items-center font-bold text-sm">
                      {getInitials()}
                    </div>
                    <span className="text-white text-sm">{user?.firstName || 'User'}</span>
                  </div>
                  {showDropdown && (
                    <div className="absolute top-11 right-0 bg-dcs-dark-gray border border-dcs-purple rounded-xl w-60 p-6 mt-5 z-[1100] shadow-2xl">
                      <h4 className="my-2 text-white font-semibold">
                        {user?.firstName} {user?.lastName}
                      </h4>
                      <p className="text-xs text-dcs-text-gray mb-3">{user?.email}</p>
                      <hr className="border-0 border-t border-gray-700 my-2.5" />
                      <button
                        onClick={() => navTo('/profile')}
                        className="block w-full text-left text-white hover:text-dcs-purple transition-colors text-sm py-1"
                      >
                        Profile
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => navTo('/admin/approvals')}
                          className="block w-full text-left text-white hover:text-dcs-purple transition-colors text-sm py-1"
                        >
                          Course Approvals
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-center text-red-400 no-underline font-bold text-sm mt-2 hover:text-red-500 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </li>
              </>
            )}
            {!isAuthenticated && (
              <>
                <li>
                  <button
                    onClick={() => navTo('/login')}
                    className="text-white no-underline font-medium text-sm transition-all duration-300 hover:text-dcs-purple"
                  >
                    Login
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navTo('/register')}
                    className="bg-dcs-purple text-white px-6 py-2 rounded-full no-underline font-bold hover:bg-dcs-dark-purple transition-all"
                  >
                    Register
                  </button>
                </li>
              </>
            )}
          </ul>

          {/* Mobile: Messages badge + Hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            {isAuthenticated && (
              <button
                onClick={() => navTo('/messages')}
                className="text-white relative p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-2 hover:text-dcs-purple transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-in panel */}
          <div className="flex flex-col absolute right-0 top-0 h-full w-[280px] max-w-[85vw] bg-dcs-dark-gray border-l border-dcs-purple/20 shadow-2xl overflow-y-auto animate-slideInRight">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-dcs-purple text-white rounded-full flex justify-center items-center font-bold text-sm">
                    {getInitials()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{user?.firstName} {user?.lastName}</p>
                    <p className="text-dcs-text-gray text-xs">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <span className="text-white font-bold text-lg"><span className="text-dcs-purple">DCS</span> Learn</span>
              )}
              <button onClick={() => setMobileMenuOpen(false)} className="text-dcs-text-gray hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav Links */}
            <div className="p-4 space-y-1 mb-auto">
              <button onClick={() => navTo('/')} className="w-full text-left px-4 py-3 text-white hover:bg-dcs-purple/10 hover:text-dcs-purple rounded-xl transition-all font-medium text-sm">
                Home
              </button>
              <button onClick={() => navTo('/courses')} className="w-full text-left px-4 py-3 text-white hover:bg-dcs-purple/10 hover:text-dcs-purple rounded-xl transition-all font-medium text-sm">
                Courses
              </button>
              {isAuthenticated && (
                <>
                  <button onClick={() => navTo('/my-courses')} className="w-full text-left px-4 py-3 text-white hover:bg-dcs-purple/10 hover:text-dcs-purple rounded-xl transition-all font-medium text-sm">
                    My Courses
                  </button>
                  <button onClick={() => navTo('/messages')} className="w-full text-left px-4 py-3 text-white hover:bg-dcs-purple/10 hover:text-dcs-purple rounded-xl transition-all font-medium text-sm flex items-center justify-between">
                    Messages
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {user?.role === 'ADMIN' && (
                    <button onClick={() => navTo('/admin')} className="w-full text-left px-4 py-3 text-white hover:bg-dcs-purple/10 hover:text-dcs-purple rounded-xl transition-all font-medium text-sm">
                      Admin Dashboard
                    </button>
                  )}
                  {user?.role === 'INSTRUCTOR' && (
                    <button onClick={() => navTo('/instructor')} className="w-full text-left px-4 py-3 text-white hover:bg-dcs-purple/10 hover:text-dcs-purple rounded-xl transition-all font-medium text-sm">
                      Instructor Dashboard
                    </button>
                  )}

                  <hr className="border-white/10 my-3" />
                  <button onClick={() => navTo('/profile')} className="w-full text-left px-4 py-3 text-white hover:bg-dcs-purple/10 hover:text-dcs-purple rounded-xl transition-all font-medium text-sm">
                    Profile
                  </button>
                  {user?.role === 'ADMIN' && (
                    <button onClick={() => navTo('/admin/approvals')} className="w-full text-left px-4 py-3 text-white hover:bg-dcs-purple/10 hover:text-dcs-purple rounded-xl transition-all font-medium text-sm">
                      Course Approvals
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm mt-2"
                  >
                    Sign Out
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <hr className="border-white/10 my-3" />
                  <button onClick={() => navTo('/login')} className="w-full text-left px-4 py-3 text-white hover:bg-dcs-purple/10 hover:text-dcs-purple rounded-xl transition-all font-medium text-sm">
                    Login
                  </button>
                  <button onClick={() => navTo('/register')} className="w-full bg-dcs-purple text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-dcs-dark-purple transition-all text-center mt-2">
                    Register
                  </button>
                </>
              )}
            </div>
            <span><img src={Powered_by_ABS_logo} alt="Powered by Abstream" className="justify-self-end h-12 sm:h-15 mt-auto mb-2 mr-1 object-contain" /></span>
          </div>
        </div>
      )}
    </>
  );
}
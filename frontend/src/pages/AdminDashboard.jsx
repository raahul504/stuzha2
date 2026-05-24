import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CreateCourse from '../components/admin/CreateCourse';
import ManageCourses from '../components/admin/ManageCourses';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (user?.role !== 'ADMIN' && user?.role !== 'INSTRUCTOR') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Access Denied. Admin/Instructor only.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dcs-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-dcs-purple/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-dcs-electric-indigo/10 blur-[120px] rounded-full"></div>
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-6 sm:pb-12">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-white bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-dcs-text-gray text-base sm:text-lg">System Management & Control Center</p>
        </div>

        <div className="bg-dcs-dark-gray/40 backdrop-blur-md border border-dcs-purple/20 rounded-3xl p-4 sm:p-8 shadow-2xl overflow-hidden relative">
          {/* Header/Tabs */}
          <div className="flex flex-nowrap sm:flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-10 border-b border-white/5 pb-6 pt-1 pl-2 sm:pb-8 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-4 py-3 rounded-full font-bold transition-all duration-300 ${activeTab === 'courses'
                ? 'bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white shadow-[0_0_20px_rgba(157,80,187,0.4)] scale-105'
                : 'bg-dcs-light-gray/50 text-dcs-text-gray hover:text-white hover:bg-dcs-light-gray'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Manage Courses
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-3 rounded-full font-bold transition-all duration-300 ${activeTab === 'create'
                ? 'bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white shadow-[0_0_20px_rgba(157,80,187,0.4)] scale-105'
                : 'bg-dcs-light-gray/50 text-dcs-text-gray hover:text-white hover:bg-dcs-light-gray'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Course
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin/approvals')}
                className="flex items-center gap-2 px-4 py-3 rounded-full font-bold transition-all duration-300 bg-dcs-light-gray/50 text-dcs-text-gray hover:text-white hover:bg-dcs-light-gray"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Course Approvals
              </button>
            )}
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin/messages-monitor')}
                className="flex items-center gap-2 px-4 py-3 rounded-full font-bold transition-all duration-300 bg-dcs-light-gray/50 text-dcs-text-gray hover:text-white hover:bg-dcs-light-gray"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Messages Monitor
              </button>
            )}
            <button
              onClick={() => navigate('/admin/activity-log')}
              className="flex items-center gap-2 px-4 py-3 rounded-full font-bold transition-all duration-300 bg-dcs-light-gray/50 text-dcs-text-gray hover:text-white hover:bg-dcs-light-gray whitespace-nowrap text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Activity Log
            </button>
            <button
              onClick={() => navigate('/admin/coupons')}
              className="flex items-center gap-2 px-4 py-3 rounded-full font-bold transition-all duration-300 bg-dcs-light-gray/50 text-dcs-text-gray hover:text-white hover:bg-dcs-light-gray"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
              </svg>
              Coupons
            </button>
          </div>

          <div className="relative animate-fadeInUp">
            {activeTab === 'courses' && <ManageCourses />}
            {activeTab === 'create' && <CreateCourse />}
          </div>
        </div>
      </div>
    </div>
  );
}
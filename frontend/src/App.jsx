import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import MyCourses from './pages/MyCourses';
import Learn from './pages/Learn';
import AdminDashboard from './pages/AdminDashboard';
import CourseEditor from './pages/CourseEditor';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCreateCourse from './pages/InstructorCreateCourse';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CourseSettings from './pages/CourseSettings';
import AdminApprovalDashboard from './pages/AdminApprovalDashboard';
import ChatInbox from './pages/ChatInbox';
import AdminMessagesMonitor from './pages/AdminMessagesMonitor';
import AdminActivityLog from './pages/AdminActivityLog';
import AdminCoupons from './pages/AdminCoupons';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const Router = window.navigator.userAgent.includes('Electron') ? HashRouter : BrowserRouter;
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/my-courses" element={<ProtectedRoute> <MyCourses /> </ProtectedRoute>} />
            <Route path="/learn/:id" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute><AdminApprovalDashboard /></ProtectedRoute>} />
            <Route path="/admin/course/:id" element={<ProtectedRoute><CourseEditor /></ProtectedRoute>} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/instructor" element={<ProtectedRoute><InstructorDashboard /></ProtectedRoute>} />
            <Route path="/instructor/create-course" element={<ProtectedRoute><InstructorCreateCourse /></ProtectedRoute>} />
            <Route path="/instructor/course/:id" element={<ProtectedRoute><CourseEditor /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/instructor/course/:id/settings" element={<ProtectedRoute><CourseSettings /></ProtectedRoute>} />
            <Route path="/admin/course/:id/settings" element={<ProtectedRoute><CourseSettings /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><ChatInbox /></ProtectedRoute>} />
            <Route path="/admin/messages-monitor" element={<ProtectedRoute><AdminMessagesMonitor /></ProtectedRoute>} />
            <Route path="/admin/activity-log" element={<ProtectedRoute><AdminActivityLog /></ProtectedRoute>} />
            <Route path="/admin/coupons" element={<ProtectedRoute><AdminCoupons /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
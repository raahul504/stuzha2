import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../api/adminService';
import ModuleList from '../components/admin/ModuleList';
import AddModule from '../components/admin/AddModule';
import { showError } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const courseData = await adminService.getCourseById(id);
      setCourse(courseData.course);
      const modulesData = await adminService.getModules(id);
      setModules(modulesData.modules);
    } catch (err) {
      showError('Failed to load course');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading course..." />;

  return (
    <div className="min-h-screen bg-dcs-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-dcs-purple/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-dcs-electric-indigo/10 blur-[120px] rounded-full"></div>
      </div>

      <nav className="relative z-20 bg-dcs-black/40 backdrop-blur-md border-b border-white/5 py-6">
        <div className="container mx-auto px-4">
          <button
            onClick={() => {
              const isInstructor =
                window.location.pathname.includes('/instructor/') ||
                window.location.hash.includes('/instructor/');
              navigate(isInstructor ? '/instructor' : '/admin');
            }}
            className="flex items-center gap-2 text-dcs-text-gray hover:text-white transition-colors mb-4 group"
          >
            <svg
              className="w-5 h-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to {(window.location.pathname.includes('/instructor/') || window.location.hash.includes('/instructor/')) ? 'Instructor' : 'Admin'} Dashboard
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent">
            {course.title}
          </h1>
          <p className="text-dcs-text-gray mt-1 font-medium opacity-80 uppercase tracking-widest text-xs">Course Editor</p>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 relative z-10 font-geist">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <ModuleList modules={modules} courseId={id} onUpdate={fetchCourse} />
          </div>
          <div className="lg:sticky lg:top-24 h-fit">
            <AddModule courseId={id} onAdd={fetchCourse} />
          </div>
        </div>
      </div>
    </div>
  );
}
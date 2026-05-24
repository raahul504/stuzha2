import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { courseService } from '../api/courseService';
import { userService } from '../api/userService';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import CourseCard from '../components/CourseCard';
import MyRecommendationCard from '../components/MyRecommendationCard';
import ConfirmModal from '../components/ConfirmModal';
import { showSuccess, showError } from '../utils/toast';

export default function MyCourses() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyCourses();
  }, []);

  useEffect(() => {
    if (activeTab === 'recommendations') {
      fetchRecommendations();
    }
  }, [activeTab]);

  const fetchMyCourses = async () => {
    try {
      const data = await courseService.getMyCourses();
      setCourses(data.courses);
    } catch (err) {
      console.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      const data = await userService.getRecommendations();
      setRecommendations(data.recommendations);
    } catch (err) {
      console.error('Failed to load recommendations');
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleDeleteRecommendation = async () => {
    const id = deleteTargetId;
    if (!id) return;
    try {
      await userService.deleteRecommendation(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
      showSuccess('Recommendation removed');
    } catch (err) {
      showError(err.response?.data?.error?.message || 'Failed to delete recommendation');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your courses..." />;
  }

  return (
    <div className="min-h-screen bg-dcs-black relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-dcs-purple/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-dcs-electric-indigo/10 blur-[120px] rounded-full"></div>
      </div>

      <Navbar />

      <div className="relative z-10 pt-24 sm:pt-32 pb-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent">
              My Courses
            </h1>
            <p className="text-dcs-text-gray text-base sm:text-lg lg:text-xl max-w-2xl">
              Continue your learning journey and sharpen your professional skills.
            </p>
          </div>

          <div className="card overflow-hidden mb-8">
            <div className="flex border-b border-dcs-purple/20 overflow-x-auto scrollbar-hide">
              <button
                type="button"
                onClick={() => setActiveTab('courses')}
                className={`px-4 sm:px-6 py-3 font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'courses'
                    ? 'border-b-2 border-dcs-purple text-dcs-purple'
                    : 'text-dcs-text-gray hover:text-white'
                }`}
              >
                My Courses
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('recommendations')}
                className={`px-4 sm:px-6 py-3 font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'recommendations'
                    ? 'border-b-2 border-dcs-purple text-dcs-purple'
                    : 'text-dcs-text-gray hover:text-white'
                }`}
              >
                My Recommendations
              </button>
            </div>
          </div>

          {activeTab === 'courses' && (
            <>
              {courses.length === 0 ? (
                <div className="text-center py-12 sm:py-20 bg-dcs-dark-gray/30 backdrop-blur-md rounded-3xl border border-dcs-purple/20 shadow-2xl px-4">
                  <div className="mb-4 sm:mb-6 opacity-20">
                    <svg className="w-16 h-16 sm:w-24 sm:h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-dcs-text-gray text-lg sm:text-xl mb-6 sm:mb-8">You haven&apos;t enrolled in any courses yet.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/courses')}
                    className="bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-bold shadow-lg transition-all hover:scale-105 text-sm sm:text-base"
                  >
                    Browse Our Courses
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      progress={course.progressPercentage}
                      onClick={() => navigate(`/learn/${course.id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'recommendations' && (
            <>
              {recommendationsLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-dcs-purple mx-auto mb-4" />
                  <p className="text-dcs-text-gray animate-pulse">Loading your recommendations...</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-12 sm:py-20 bg-dcs-dark-gray/30 backdrop-blur-md rounded-3xl border border-dcs-purple/20 shadow-2xl px-4">
                  <div className="mb-4 sm:mb-6 opacity-20">
                    <svg className="w-16 h-16 sm:w-24 sm:h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-dcs-text-gray text-lg sm:text-xl mb-4">
                    No recommendations yet.
                  </p>
                  <p className="text-dcs-text-gray text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
                    Chat with our AI Career Consultant to get personalized learning paths and course suggestions tailored to your goals.
                  </p>
                  <Link
                    to="/courses"
                    state={{ openAdvisor: true }}
                    className="inline-block bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-bold shadow-lg transition-all hover:scale-105 text-sm sm:text-base"
                  >
                    Talk to AI Career Consultant
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {recommendations.map((rec) => (
                    <MyRecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      onDelete={setDeleteTargetId}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteRecommendation}
        title="Delete recommendation"
        message="Remove this recommendation from your list? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

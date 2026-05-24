import { useNavigate } from 'react-router-dom';
import CourseCard from './CourseCard';

function TopicCourseLink({ course, onNavigate, className = '' }) {
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => onNavigate(`/courses/${course.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate(`/courses/${course.id}`);
        }
      }}
      className={`p-3 bg-dcs-dark-gray rounded-lg cursor-pointer hover:bg-dcs-light-gray transition-all ${className}`}
    >
      <p className="font-semibold text-white text-sm line-clamp-2">{course.title}</p>
      <p className="text-xs text-dcs-text-gray line-clamp-1">
        {course.categories?.map((cat) => cat.category.name).join(', ')}
      </p>
    </div>
  );
}

function TopicCourseLinks({ courses, onNavigate }) {
  if (courses.length <= 2) {
    return (
      <div className="space-y-2">
        {courses.map((course) => (
          <TopicCourseLink key={course.id} course={course} onNavigate={onNavigate} />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
      <div className="grid grid-rows-2 grid-flow-col auto-cols-[minmax(11rem,14rem)] gap-2 w-max min-w-full">
        {courses.map((course) => (
          <TopicCourseLink
            key={course.id}
            course={course}
            onNavigate={onNavigate}
            className="h-full min-h-[4.25rem]"
          />
        ))}
      </div>
    </div>
  );
}

export default function MyRecommendationCard({ recommendation, onDelete }) {
  const navigate = useNavigate();
  const { learningPath, courses, extractedGoal } = recommendation;
  const isPathRecommendation = Boolean(learningPath);

  const handleViewAll = () => {
    if (!learningPath?.requiredCategoryIds?.length) {
      navigate('/courses');
      return;
    }
    navigate('/courses', { state: { categoryIds: learningPath.requiredCategoryIds } });
  };

  return (
    <div className="bg-gradient-to-r from-dcs-purple/20 to-dcs-electric-indigo/20 border border-dcs-purple/30 rounded-2xl p-4 sm:p-6 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
            {isPathRecommendation ? learningPath.name : 'Recommendation'}
          </h3>
          {!isPathRecommendation && extractedGoal && (
            <p className="text-dcs-text-gray text-sm">{extractedGoal}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {isPathRecommendation && (
            <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
              <span className="bg-dcs-purple/30 px-3 py-1 rounded text-white">
                {learningPath.difficultyLevel}
              </span>
              {learningPath.estimatedMonths != null && (
                <span className="bg-dcs-light-gray px-3 py-1 rounded text-white">
                  {learningPath.estimatedMonths} months
                </span>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => onDelete(recommendation.id)}
            className="text-xs text-dcs-text-gray hover:text-red-400 transition-colors"
            aria-label="Delete recommendation"
          >
            Delete
          </button>
        </div>
      </div>

      {courses.length > 0 && (
        <div className="flex-grow mb-4">
          {isPathRecommendation ? (
            <div className="grid grid-cols-1 gap-4">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  categoryName={course.categories?.[0]?.category?.name}
                  onClick={() => navigate(`/courses/${course.id}`)}
                />
              ))}
            </div>
          ) : (
            <TopicCourseLinks courses={courses} onNavigate={navigate} />
          )}
        </div>
      )}

      {isPathRecommendation && (
        <button
          type="button"
          onClick={handleViewAll}
          className="text-dcs-purple text-sm font-semibold hover:text-dcs-electric-indigo transition-colors mt-auto"
        >
          View All →
        </button>
      )}
    </div>
  );
}

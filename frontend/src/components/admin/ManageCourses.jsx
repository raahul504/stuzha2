import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../api/adminService';

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await adminService.getAllCourses();
      setCourses(data.courses);
    } catch (err) {
      console.error('Failed to load courses');
    }
  };

  const handleEdit = (courseId) => {
    navigate(`/admin/course/${courseId}`);
  };
  
  return (
    <div className="bg-dcs-dark-gray rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Courses</h2>
      
      {courses.length === 0 ? (
        <p className="text-gray-600">No courses created yet.</p>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="border border-dcs-purple/20 rounded-lg p-6 hover:border-dcs-purple transition-all bg-dcs-dark-gray">
              <div>
                <h3 className="font-bold">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{course.shortDescription}</p>
                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${course.isPublished 
                    ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <button
                onClick={() => handleEdit(course.id)}
                className="bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo justify-end text-white px-6 py-2 mt-5 mr-3 rounded-lg hover:shadow-lg transition-all"
              >
                Manage
              </button>
              <button
                onClick={() => navigate(`/admin/course/${course.id}/settings`)}
                className="bg-gray-600 text-white px-6 py-2 mt-5 rounded-lg hover:bg-gray-700 transition-all"
              >
                Settings
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
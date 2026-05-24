import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { courseService } from '../api/courseService';
import { categoryService } from '../api/categoryService';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import CourseAdvisor from '../components/CourseAdvisor';
import CourseCard from '../components/CourseCard';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [bottomInput, setBottomInput] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const categoryDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const advisorRef = useRef(null);

  useEffect(() => {
    fetchCourses();
    fetchCategories();

    const navState = location.state || {};
    if (navState.openAdvisor) {
      setShowAdvisor(true);
    }
    if (navState.categoryIds?.length) {
      setSelectedCategories(navState.categoryIds);
    }
    if (navState.openAdvisor || navState.categoryIds?.length) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  /* Scroll to advisor when it opens
  useEffect(() => {
    if (showAdvisor && advisorRef.current) {
      setTimeout(() => {
        advisorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showAdvisor]);*/

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategories, selectedDifficulty, priceRange, courses]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
        setActiveCategory(null);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await courseService.getAllCourses();
      const published = data.courses.filter(c => c.isPublished);
      setCourses(published);
      setFilteredCourses(published);
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data.categories);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const applyFilters = () => {
    let filtered = [...courses];

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(course =>
        course.categories.some(cc => selectedCategories.includes(cc.categoryId))
      );
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(course => course.difficultyLevel === selectedDifficulty);
    }

    if (priceRange) {
      filtered = filtered.filter(course => {
        const price = parseFloat(course.price);
        switch (priceRange) {
          case 'free': return price === 0;
          case 'under50': return price > 0 && price < 50;
          case '50to100': return price >= 50 && price <= 100;
          case 'over100': return price > 100;
          default: return true;
        }
      });
    }

    setFilteredCourses(filtered);
  };

  const toggleCategory = (catId, e) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const removeCategory = (catId) => {
    setSelectedCategories(prev => prev.filter(id => id !== catId));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedDifficulty('');
    setPriceRange('');
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.name || '';
  };

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleBottomSend = () => {
    if (!bottomInput.trim()) return;
    if (!showAdvisor) setShowAdvisor(true);
    setTimeout(() => {
      advisorRef.current?.sendMessage(bottomInput);
      setBottomInput('');
    }, 50); // small delay to ensure modal/component is visible
  };

  return (
    <div className="min-h-screen bg-dcs-black pb-24">
      <Navbar />

      {/* Header 
      <div className="pt-27 pb-5 px-8">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-3xl leading-normal text-center mb-2 bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent">
            Explore Our Programs
          </h1>
        </div>
      </div>*/}

      <div className="max-w-[1400px] mx-auto mt-20" style={{ padding: '1rem 1rem' }}>
        {/* Search & Filters Row */}
        <div className="mb-4">
          <div className="flex flex-row gap-2">
            {/* Category Dropdown */}
            <div className="relative" ref={categoryDropdownRef}>
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="px-4 sm:px-5 py-3 sm:py-4 bg-dcs-purple/20 border border-dcs-purple/50 rounded-full text-white font-semibold hover:bg-dcs-purple/30 transition-all flex items-center gap-2 whitespace-nowrap text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">Categories</span>
                <svg className={`w-3 h-3 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCategoryDropdown && (
                <div className="absolute left-0 top-full mt-2 bg-dcs-dark-gray border border-dcs-purple/30 rounded-2xl shadow-2xl z-50 flex flex-col sm:flex-row max-h-[70vh] overflow-y-auto w-[280px] sm:w-auto">

                  {/* Left side - Main Categories */}
                  <div className={`w-full sm:w-72 p-4 sm:p-6 ${activeCategory ? 'hidden sm:block' : 'block'}`}>
                    <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-hide">
                      {categories
                        .filter(cat => cat.level === 0)
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((category) => (
                          <div
                            key={category.id}
                            onMouseEnter={() => setActiveCategory(category.id)}
                            className="relative"
                          >
                            <label className={`flex items-center justify-between px-4 py-2 rounded-lg transition-colors cursor-pointer ${activeCategory === category.id
                              ? 'bg-dcs-light-gray text-white'
                              : 'text-dcs-text-gray hover:bg-dcs-light-gray hover:text-white'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCategory(category.id);
                                toggleCategory(category.id, e);
                              }}>
                              <span className="text-sm">{category.name}</span>
                              {category.subCategories?.length > 0 && (
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Right side - Subcategories (shown when activeCategory is set) */}
                  {activeCategory && (
                    <div
                      className="w-full sm:w-72 p-4 sm:p-6 bg-dcs-black/50 sm:border-l border-dcs-purple/30 flex flex-col"
                      onMouseEnter={() => setActiveCategory(activeCategory)}
                    >
                      {/* Back button for mobile */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveCategory(null); }}
                        className="sm:hidden flex items-center gap-2 text-dcs-text-gray hover:text-white transition-colors mb-4 text-sm font-semibold w-full bg-dcs-light-gray/20 px-3 py-2 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Main Menu
                      </button>
                      <div className="space-y-1 max-h-[350px] sm:max-h-[400px] overflow-y-auto scrollbar-hide">
                        {categories
                          .find(cat => cat.id === activeCategory)
                          ?.subCategories?.sort((a, b) => a.orderIndex - b.orderIndex)
                          .map((subcat) => (
                            <label
                              key={subcat.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCategory(subcat.id, e);
                              }}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${selectedCategories.includes(subcat.id)
                                ? 'bg-dcs-purple text-white'
                                : 'text-dcs-text-gray hover:bg-dcs-light-gray hover:text-white'
                                }`}
                            >
                              <span className="text-sm">{subcat.name}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Explore courses..."
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-dcs-dark-gray border border-dcs-purple/30 rounded-full text-white placeholder-dcs-text-gray focus:border-dcs-purple focus:outline-none transition-all pr-12 sm:pr-28 text-sm sm:text-base"
              />
              <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dcs-text-gray pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {/*<button
                onClick={() => setShowAdvisor(!showAdvisor)}
                className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo rounded-full text-white text-sm font-semibold hover:scale-105 transition-transform items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Consultant
              </button>*/}
            </div>

            {/* Filter Button */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 sm:px-4 py-3 sm:py-4 bg-dcs-purple/20 border border-dcs-purple/50 rounded-full text-white font-semibold hover:bg-dcs-purple/30 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>

              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-dcs-dark-gray border border-dcs-purple/30 rounded-2xl p-4 sm:p-6 shadow-2xl z-50">
                  <div className="mb-4">
                    <label className="block text-white text-sm font-semibold mb-2">Difficulty</label>
                    <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full px-4 py-3 bg-dcs-black border border-dcs-purple/30 rounded-lg text-white focus:border-dcs-purple focus:outline-none">
                      <option value="">All Levels</option>
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-white text-sm font-semibold mb-2">Price Range</label>
                    <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}
                      className="w-full px-4 py-3 bg-dcs-black border border-dcs-purple/30 rounded-lg text-white focus:border-dcs-purple focus:outline-none">
                      <option value="">All Prices</option>
                      <option value="free">Free</option>
                      <option value="under50">Under $50</option>
                      <option value="50to100">$50 - $100</option>
                      <option value="over100">Over $100</option>
                    </select>
                  </div>

                  {(selectedDifficulty || priceRange) && (
                    <button onClick={() => { setSelectedDifficulty(''); setPriceRange(''); }}
                      className="w-full py-2 text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Advisor - Positioned under search bar 
        {showAdvisor && (
          <div ref={advisorRef} className="mb-6 scroll-mt-30">
            <CourseAdvisor onClose={() => setShowAdvisor(false)} />
          </div>
        )}*/}

        {/* Selected Category Tags */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {selectedCategories.map(catId => (
              <span key={catId} className="flex items-center gap-1.5 bg-dcs-purple/20 border border-dcs-purple/40 text-dcs-purple px-3 py-1.5 rounded-full text-sm font-medium">
                {getCategoryName(catId)}
                <button onClick={() => removeCategory(catId)} className="text-dcs-purple hover:text-white transition-colors ml-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <button onClick={() => setSelectedCategories([])} className="text-xs text-dcs-text-gray hover:text-white transition-colors underline">
              Clear all
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">{error}</div>
        )}

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dcs-text-gray text-lg">
              {courses.length === 0
                ? 'No courses available yet.'
                : 'No courses match your filters. Try adjusting your search.'}
            </p>
            {(selectedCategories.length > 0 || selectedDifficulty || priceRange || searchTerm) && (
              <button onClick={clearFilters} className="mt-4 text-dcs-purple hover:text-dcs-electric-indigo transition-colors font-semibold">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid mt-6 sm:mt-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                categoryName={getCategoryName(course.categoryId)}
                onClick={() => handleCourseClick(course.id)}
              />
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <footer className="bg-dcs-dark-gray py-16 px-8 text-center border-t border-dcs-purple/20 mt-20" style={{ borderTop: '1px solid rgba(157, 80, 187, 0.2)' }}>
          <h3 className="text-dcs-purple mb-4 text-2xl font-bold">Ready to start?</h3>
          <p className="text-dcs-text-gray mb-8">Join thousands of students transforming their careers.</p>
          <button onClick={() => navigate('/courses')} className="btn-purple">Enroll in a Course</button>
        </footer>
      </div>

      {/* Backdrop only - behind everything */}
      {showAdvisor && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={() => { setShowAdvisor(false); setBottomInput(''); }}
        />
      )}

      {/* Advisor Modal - above backdrop, below bottom bar */}
      <div
        className={`fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 ${showAdvisor ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-4xl">
          <CourseAdvisor
            ref={advisorRef}
            onClose={() => { setShowAdvisor(false); setBottomInput(''); }}
          />
        </div>
      </div>

      {/* Fixed bottom chat bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-4 pt-2 bg-gradient-to-t from-dcs-black via-dcs-black/80 to-transparent">
        <div className={`mx-auto flex gap-2 transition-all duration-300 ${showAdvisor ? 'max-w-4xl' : 'max-w-2xl'}`}>
          <input
            type="text"
            value={bottomInput}
            onChange={(e) => setBottomInput(e.target.value)}
            onFocus={() => setShowAdvisor(true)}
            onKeyPress={(e) => e.key === 'Enter' && handleBottomSend()}
            placeholder="Have a query? Ask your AI Career Consultant..."
            className="flex-1 px-5 py-3 bg-dcs-dark-gray border border-dcs-purple/40 rounded-full text-white placeholder-dcs-text-gray focus:outline-none focus:border-dcs-purple text-sm"
          />
          {bottomInput.trim() && (
            <button
              onClick={handleBottomSend}
              className="px-5 py-3 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-full text-sm font-semibold"
            >
              Ask
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
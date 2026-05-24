import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../api/adminService';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import { showSuccess, showError } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { categoryService } from '../api/categoryService';
import { useAuth } from '../context/AuthContext';

export default function CourseSettings() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    difficultyLevel: 'BEGINNER',
    estimatedDurationHours: '',
    courseIncludes: '',
    requirements: '',
    targetAudience: '',
    isPublished: false,
  });

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const data = await adminService.getCourseById(id);
      const c = data.course;
      setCourse(c);
      setFormData({
        title: c.title,
        slug: c.slug,
        description: c.description,
        shortDescription: c.shortDescription || '',
        price: String(c.price),
        difficultyLevel: c.difficultyLevel || 'BEGINNER',
        estimatedDurationHours: c.estimatedDurationHours || '',
        courseIncludes: c.courseIncludes || '',
        requirements: c.requirements || '',
        targetAudience: c.targetAudience || '',
        isPublished: c.isPublished,
      });
      // Set selected categories from the course
      if (c.categories && c.categories.length > 0) {
        setSelectedCategoryIds(c.categories.map(cc => cc.categoryId));
      }
    } catch (err) {
      showError('Failed to load course');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoryService.getAllCategories()
      .then(data => setCategories(data.categories))
      .catch(() => { });
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data.categories);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const data = await categoryService.createCategory(newCategoryName.trim());
      showSuccess('Category created!');
      setCategories([...categories, data.category]);
      setSelectedCategoryIds([...selectedCategoryIds, data.category.id]);
      setNewCategoryName('');
    } catch (err) {
      showError(err.response?.data?.error?.message || 'Failed to create category');
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const removeCategory = (categoryId) => {
    setSelectedCategoryIds(prev => prev.filter(id => id !== categoryId));
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.name || '';
  };

  const filterCategories = (cats) => {
    if (!categorySearchTerm.trim()) return cats;
    const searchLower = categorySearchTerm.toLowerCase();
    return cats.filter(cat =>
      cat.name.toLowerCase().includes(searchLower) ||
      (cat.subCategories && cat.subCategories.some(sub =>
        sub.name.toLowerCase().includes(searchLower)
      ))
    );
  };

  const filterSubCategories = (subCats) => {
    if (!categorySearchTerm.trim()) return subCats;
    const searchLower = categorySearchTerm.toLowerCase();
    return subCats.filter(sub => sub.name.toLowerCase().includes(searchLower));
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Prepare data with proper type conversions
      const dataToSend = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        shortDescription: formData.shortDescription,
        price: formData.price,
        difficultyLevel: formData.difficultyLevel,
        estimatedDurationHours: formData.estimatedDurationHours
          ? parseInt(formData.estimatedDurationHours)
          : null,
        categoryIds: selectedCategoryIds,
        // Only include isPublished if admin
        ...(user?.role === 'ADMIN' && { isPublished: formData.isPublished }),
      };
      // In updateCourse, before the price block:
      console.log('price received in service:', dataToSend.price, typeof dataToSend.price);
      await adminService.updateCourse(id, dataToSend);
      showSuccess('Course updated successfully');
      navigate(-1);
    } catch (err) {
      showError('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminService.deleteCourse(id);
      showSuccess('Course deleted successfully');
      const isAdmin = window.location.pathname.includes('/admin/');
      navigate(isAdmin ? '/admin' : '/instructor');
    } catch (err) {
      showError('Failed to delete course');
    }
  };

  if (loading) return <LoadingSpinner message="Loading course settings..." />;

  return (
    <div className="min-h-screen bg-dcs-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-dcs-purple/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-dcs-electric-indigo/10 blur-[120px] rounded-full"></div>
      </div>

      <Navbar />

      <div className="container mx-auto px-4 py-16 relative z-10 font-geist">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-dcs-text-gray hover:text-white transition-colors mt-10 mb-4 group"
              >
                <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent italic">
                Course Settings
              </h1>
              <p className="text-dcs-text-gray mt-2 font-medium opacity-80 uppercase tracking-widest text-xs">Manage your course details and configuration</p>
            </div>
          </div>

          <div className="bg-dcs-dark-gray/30 backdrop-blur-xl rounded-3xl p-5 sm:p-10 border border-white/5 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-dcs-purple rounded-full"></span>
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-dcs-text-gray text-xs font-bold uppercase tracking-wider ml-1">Course Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Master React.js from Scratch"
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-white/10 rounded-2xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-dcs-text-gray text-xs font-bold uppercase tracking-wider ml-1">URL Slug *</label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      required
                      placeholder="react-masterclass"
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-white/10 rounded-2xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-dcs-text-gray text-xs font-bold uppercase tracking-wider ml-1">Short Description</label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    maxLength={500}
                    placeholder="A brief overview for the course card..."
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-white/10 rounded-2xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-dcs-text-gray text-xs font-bold uppercase tracking-wider ml-1">Full Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Tell your students everything they need to know about the course..."
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-white/10 rounded-2xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              {/* Pricing & Level Section */}
              <div className="space-y-6 pt-6 border-t border-white/5">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-dcs-purple rounded-full"></span>
                  Pricing & Difficulty
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-dcs-text-gray text-xs font-bold uppercase tracking-wider ml-1">Price (INR) *</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-dcs-purple font-bold">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]{0,2}"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        step="0.01"
                        min="0"
                        className="w-full pl-10 pr-5 py-4 border border-white/10 rounded-2xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-dcs-text-gray text-xs font-bold uppercase tracking-wider ml-1">Difficulty Level</label>
                    <select
                      name="difficultyLevel"
                      value={formData.difficultyLevel}
                      onChange={handleChange}
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-white/10 rounded-2xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="BEGINNER">🟢 Beginner</option>
                      <option value="INTERMEDIATE">🟡 Intermediate</option>
                      <option value="ADVANCED">🔴 Advanced</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-dcs-text-gray text-xs font-bold uppercase tracking-wider ml-1">Estimated Hours</label>
                    <input
                      type="number"
                      name="estimatedDurationHours"
                      value={formData.estimatedDurationHours}
                      onChange={handleChange}
                      min="1"
                      placeholder="e.g. 20"
                      className="w-full px-5 py-4 border border-white/10 rounded-2xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Categories Section */}
              <div className="space-y-6 pt-6 border-t border-white/5">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-dcs-purple rounded-full"></span>
                  Categorization
                </h3>

                <div className="space-y-4">
                  <div className="w-full p-4 sm:p-6 border border-white/10 rounded-3xl bg-dcs-black/40 backdrop-blur-sm">
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedCategoryIds.length === 0 ? (
                        <p className="text-xs text-dcs-text-gray/50 italic py-2">No categories selected yet...</p>
                      ) : (
                        selectedCategoryIds.map(catId => (
                          <span key={catId} className="flex items-center gap-2 bg-dcs-purple/10 border border-dcs-purple/20 text-dcs-purple px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold group/tag transition-all hover:bg-dcs-purple hover:text-white">
                            {getCategoryName(catId)}
                            <button type="button" onClick={() => removeCategory(catId)} className="text-dcs-purple group-hover/tag:text-white transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    <div className="relative mb-6">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dcs-text-gray/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={categorySearchTerm}
                        onChange={(e) => setCategorySearchTerm(e.target.value)}
                        placeholder="Filter categories..."
                        className="w-full pl-11 pr-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/10 focus:border-dcs-purple focus:outline-none focus:ring-1 focus:ring-dcs-purple"
                      />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {filterCategories(categories.filter(cat => cat.level === 0).sort((a, b) => a.orderIndex - b.orderIndex)).map(mainCat => (
                        <div key={mainCat.id} className="space-y-1">
                          <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all group/cat">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedCategoryIds.includes(mainCat.id)}
                                onChange={() => toggleCategory(mainCat.id)}
                                className="w-5 h-5 rounded-md border-white/20 bg-dcs-black/50 text-dcs-purple focus:ring-dcs-purple"
                              />
                            </div>
                            <span className="text-sm font-bold text-white group-hover/cat:text-dcs-purple transition-colors">{mainCat.name}</span>
                          </label>
                          {mainCat.subCategories && mainCat.subCategories.length > 0 && (
                            <div className="ml-10 grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                              {filterSubCategories(mainCat.subCategories.sort((a, b) => a.orderIndex - b.orderIndex)).map(subCat => (
                                <label key={subCat.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all group/subcat">
                                  <input
                                    type="checkbox"
                                    checked={selectedCategoryIds.includes(subCat.id)}
                                    onChange={() => toggleCategory(subCat.id)}
                                    className="w-4 h-4 rounded-md border-white/20 bg-dcs-black/50 text-dcs-purple focus:ring-dcs-purple"
                                  />
                                  <span className="text-xs text-dcs-text-gray group-hover/subcat:text-white transition-colors">{subCat.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Add new category (e.g. Cloud Computing)"
                      className="flex-1 px-5 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:outline-none transition-all placeholder:text-white/10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="px-6 py-3 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-all font-bold border border-white/10 hover:border-white/20 text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Detailed Content Section */}
              <div className="space-y-6 pt-6 border-t border-white/5">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-dcs-purple rounded-full"></span>
                  Marketing Content
                </h3>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-dcs-text-gray text-xs font-bold uppercase tracking-wider ml-1">What This Course Includes</label>
                    <textarea
                      name="courseIncludes"
                      value={formData.courseIncludes}
                      onChange={handleChange}
                      rows={5}
                      placeholder="e.g.:&#10;10 hours on-demand video&#10;5 downloadable resources&#10;Full lifetime access"
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-white/10 rounded-2xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-white/10"
                    />
                    <p className="text-[10px] text-dcs-text-gray/40 uppercase tracking-widest font-bold px-1">Tip: Press Enter for each new advantage</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-dcs-text-gray text-xs font-bold uppercase tracking-wider ml-1">Requirements</label>
                      <textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleChange}
                        rows={4}
                        placeholder="e.g.:&#10;Basic Javascript knowledge&#10;VS Code installed"
                        className="w-full px-5 py-4 border border-white/10 rounded-2xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-white/10 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-dcs-text-gray text-xs font-bold uppercase tracking-wider ml-1">Ideal Student Profile</label>
                      <textarea
                        name="targetAudience"
                        value={formData.targetAudience}
                        onChange={handleChange}
                        rows={4}
                        placeholder="e.g.:&#10;Frontend developers wanting to learn React&#10;Students building their first portfolio"
                        className="w-full px-5 py-4 border border-white/10 rounded-2xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-white/10 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-6 pt-6 border-t border-white/5">
                {user?.role === 'ADMIN' ? (
                  // Admin keeps the toggle
                  <div className="flex items-center justify-between p-6 bg-dcs-purple/5 border border-dcs-purple/10 rounded-3xl">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${formData.isPublished ? 'bg-green-500/10 text-green-400' : 'bg-dcs-text-gray/10 text-dcs-text-gray'}`}>
                        {formData.isPublished ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.888 9.888L3 3m18 18l-6.888-6.888" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">Public Visibility</h4>
                        <p className="text-xs text-dcs-text-gray font-medium">
                          {formData.isPublished ? 'Course is live and accessible to learners.' : 'Course is currently in draft mode.'}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={formData.isPublished}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-dcs-purple shadow-lg"></div>
                    </label>
                  </div>
                ) : (
                  // Instructor sees read-only status
                  <div className="flex items-center gap-4 p-6 bg-dcs-purple/5 border border-dcs-purple/10 rounded-3xl">
                    <div className={`p-3 rounded-2xl flex-shrink-0 ${course?.approvalStatus === 'PUBLISHED' ? 'bg-green-500/10 text-green-400' :
                      course?.approvalStatus === 'PENDING_PUBLISH' ? 'bg-yellow-500/10 text-yellow-400' :
                        course?.approvalStatus === 'PENDING_UNPUBLISH' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-dcs-text-gray/10 text-dcs-text-gray'
                      }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Publication Status</h4>
                      <p className="text-xs font-medium mt-1 capitalize">
                        {course?.approvalStatus === 'PUBLISHED' && <span className="text-green-400">Live — visible to all students</span>}
                        {course?.approvalStatus === 'PENDING_PUBLISH' && <span className="text-yellow-400">Pending admin approval to publish</span>}
                        {course?.approvalStatus === 'PENDING_UNPUBLISH' && <span className="text-orange-400">Pending admin approval to unpublish</span>}
                        {course?.approvalStatus === 'DRAFT' && <span className="text-dcs-text-gray">Draft — go to your dashboard to request publishing</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white py-3 sm:py-4 rounded-2xl hover:shadow-[0_0_40px_rgba(157,80,187,0.3)] transition-all font-bold text-base sm:text-lg hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : 'Save Updates'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={formData.isPublished}
                  className={`px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all font-bold border ${formData.isPublished
                    ? 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed'
                    : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/20 hover:border-red-500/50'
                    }`}
                  title={formData.isPublished ? "Unpublish course to delete" : "Delete Course"}
                >
                  Delete Course
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Permanently Delete Course?"
        message="This action is irreversible. You will lose all modules, content types, and student enrollment data. Are you absolutely sure?"
        confirmText="Yes, Delete Permanently"
      />
    </div>
  );
}
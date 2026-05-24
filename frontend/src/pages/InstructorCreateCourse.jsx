// frontend/src/pages/InstructorCreateCourse.jsx - NEW FILE

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../api/adminService';
import { categoryService } from '../api/categoryService';
import Navbar from '../components/Navbar';
import { showSuccess, showError } from '../utils/toast';

export default function InstructorCreateCourse() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
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
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data.categories);
    } catch (err) {
      console.error('Failed to load categories');
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
    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: (formData.price),
        estimatedDurationHours: formData.estimatedDurationHours ? parseInt(formData.estimatedDurationHours) : undefined,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      };
      console.log('Submitting payload:', JSON.stringify(payload, null, 2));
      const response = await adminService.createCourse(payload);
      showSuccess('Course created successfully!');
      navigate(`/instructor/course/${response.course.id}`);
    } catch (err) {
      console.error('Create course error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      showError(err.response?.data?.error?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dcs-black relative overflow-hidden font-geist">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-dcs-purple/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-dcs-electric-indigo/10 blur-[120px] rounded-full"></div>
      </div>

      <Navbar />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <button
                onClick={() => navigate('/instructor')}
                className="flex items-center gap-2 text-dcs-text-gray hover:text-white transition-colors mt-10 mb-4 group"
              >
                <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent italic">
                Create New Course
              </h1>
              <p className="text-dcs-text-gray mt-2 font-medium opacity-80 uppercase tracking-widest text-xs">Configure your new course details and curriculum</p>
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
                    <label className="block text-dcs-text-gray text-xs font-bold uppercase tracking-wider ml-1">Title *</label>
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
                        type="number"
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
                            <input
                              type="checkbox"
                              checked={selectedCategoryIds.includes(mainCat.id)}
                              onChange={() => toggleCategory(mainCat.id)}
                              className="w-5 h-5 rounded-md border-white/20 bg-dcs-black/50 text-dcs-purple focus:ring-dcs-purple"
                            />
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
                </div>
              </div>

              {/* Marketing Content Section */}
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
                      className="w-full px-5 py-4 border border-white/10 rounded-2xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-white/10"
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
                <div className="flex items-center gap-4 p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Course will be saved as Draft</h4>
                    <p className="text-xs text-dcs-text-gray font-medium mt-1">
                      After creating your course and adding content, you can request admin approval to publish it from your dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white py-4 rounded-2xl hover:shadow-[0_0_40px_rgba(157,80,187,0.3)] transition-all font-bold text-lg hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Course...
                    </span>
                  ) : 'Create New Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
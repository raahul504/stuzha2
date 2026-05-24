import { useState } from 'react';
import { adminService } from '../../api/adminService';
import { showSuccess, showError } from '../../utils/toast';

export default function AddModule({ courseId, onAdd }) {
  const [formData, setFormData] = useState({ title: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminService.createModule(courseId, formData);
      showSuccess('Module added!');
      setFormData({ title: '', description: '' });
      onAdd();
    } catch (err) {
      console.error('Full error:', JSON.stringify(err.response?.data, null, 2)); // Log the actual error
      showError('Failed to add module');
    }
  };

  return (
    <div className="bg-dcs-dark-gray/30 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <svg className="w-16 h-16 text-dcs-purple" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </div>

      <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
        <span className="w-2 h-6 bg-dcs-purple rounded-full"></span>
        Add New Module
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-dcs-text-gray mb-2 text-sm font-semibold uppercase tracking-wider">Module Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g. Introduction to React"
            className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-dcs-text-gray/30"
          />
        </div>
        <div>
          <label className="block text-dcs-text-gray mb-2 text-sm font-semibold uppercase tracking-wider">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="What will students learn in this module?"
            className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-dcs-text-gray/30"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(157,80,187,0.3)] hover:shadow-[0_0_30px_rgba(157,80,187,0.5)] transition-all hover:scale-[1.02] active:scale-95"
        >
          Create Module
        </button>
      </form>
    </div>
  );
}
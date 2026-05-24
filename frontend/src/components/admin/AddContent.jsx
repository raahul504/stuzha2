import { useState } from 'react';
import { adminService } from '../../api/adminService';
import { showSuccess, showError } from '../../utils/toast';

export default function AddContent({ moduleId, onAdd }) {
  const [type, setType] = useState('VIDEO');
  const [formData, setFormData] = useState({ title: '', description: '', isPreview: false });
  const [videoFile, setVideoFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const [articleFile, setArticleFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    setVideoFile(file);

    if (file) {
      // Extract video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoDuration(Math.ceil(video.duration));
        window.URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'VIDEO' && videoFile) {
        if (!videoDuration) {
          showError('Could not determine video duration. Please try again.');
          setLoading(false);
          return;
        }
        await adminService.uploadVideo(moduleId, { ...formData, videoDurationSeconds: videoDuration }, videoFile);
      } else if (type === 'ARTICLE' && articleFile) {
        await adminService.uploadArticle(moduleId, formData, articleFile);
      } else if (type === 'ASSESSMENT') {
        await adminService.createContent(moduleId, { ...formData, contentType: 'ASSESSMENT' });
      }
      showSuccess('Content added!');
      setFormData({ title: '', description: '', isPreview: false });
      setVideoFile(null);
      setVideoDuration(null);
      setArticleFile(null);
      onAdd();
    } catch (err) {
      showError('Failed to add content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dcs-dark-gray/20 backdrop-blur-md p-4 sm:p-6 lg:p-8 rounded-2xl border border-white/5 mt-6 group">
      <h4 className="font-bold mb-4 sm:mb-6 text-white text-base sm:text-lg flex items-center gap-2">
        <span className="w-1.5 h-5 bg-dcs-purple/50 rounded-full"></span>
        Add New Content
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all cursor-pointer text-sm sm:text-base"
        >
          <option value="VIDEO">Video Lesson</option>
          <option value="ARTICLE">Article / Resource</option>
          <option value="ASSESSMENT">Assessment / Quiz</option>
        </select>

        <input
          type="text"
          placeholder="Content Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-dcs-text-gray/30 text-sm sm:text-base"
        />

        <textarea
          placeholder="What will students learn here?"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-dcs-text-gray/30"
          rows={2}
        />

        {type === 'VIDEO' && (
          <div className="p-4 bg-dcs-black/30 border border-white/5 rounded-xl space-y-3">
            <p className="text-xs font-bold text-dcs-text-gray uppercase tracking-widest">Select Video File</p>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoFileChange}
              className="w-full text-sm text-dcs-text-gray file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-dcs-purple/10 file:text-dcs-purple hover:file:bg-dcs-purple/20 transition-all cursor-pointer"
              required
            />
            {videoDuration && (
              <p className="text-xs text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-full w-fit">
                ✓ Video Metadata Loaded: {videoDuration} seconds
              </p>
            )}
          </div>
        )}

        {type === 'ARTICLE' && (
          <div className="p-4 bg-dcs-black/30 border border-white/5 rounded-xl space-y-3">
            <p className="text-xs font-bold text-dcs-text-gray uppercase tracking-widest">Select Resource File</p>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
              onChange={(e) => setArticleFile(e.target.files[0])}
              className="w-full text-sm text-dcs-text-gray file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-dcs-purple/10 file:text-dcs-purple hover:file:bg-dcs-purple/20 transition-all cursor-pointer"
              required
            />
            <p className="text-xs text-dcs-text-gray opacity-50 px-1">Supported formats: PDF, Images (PNG, JPG, etc.)</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 sm:py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${loading
            ? 'bg-dcs-text-gray/20 text-dcs-text-gray cursor-not-allowed'
            : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-green-500/20 hover:scale-[1.01]'
            }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add {type === 'VIDEO' ? 'Lesson' : type === 'ARTICLE' ? 'Resource' : 'Quiz'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { adminService } from '../../api/adminService';
import AddContent from './AddContent';
import AddQuestion from './AddQuestion';
import { showSuccess, showError } from '../../utils/toast';
import ConfirmModal from '../ConfirmModal';

export default function ModuleList({ modules, courseId, onUpdate }) {
  const [expandedModule, setExpandedModule] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, moduleId: null });

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const handleDeleteModule = async (moduleId) => {
    setConfirmModal({ isOpen: true, moduleId });
  };

  const executeDeleteModule = async () => {
    const moduleId = confirmModal.moduleId;
    setDeletingId(moduleId);
    try {
      await adminService.deleteModule(moduleId);
      showSuccess('Module deleted');
      onUpdate();
    } catch (err) {
      showError('Failed to delete module');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (module) => {
    setEditingModule(module.id);
    setEditForm({ title: module.title, description: module.description || '' });
  };

  const handleSaveEdit = async (moduleId) => {
    try {
      await adminService.updateModule(moduleId, editForm);
      showSuccess('Module updated');
      setEditingModule(null);
      onUpdate();
    } catch (err) {
      showError('Failed to update');
    }
  };

  const handleMoveModule = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;

    const reordered = [...modules];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

    const orders = reordered.map((mod, idx) => ({
      moduleId: mod.id,
      orderIndex: idx,
    }));

    try {
      await adminService.reorderModules(courseId, orders);
      showSuccess('Module reordered');
      onUpdate();
    } catch (err) {
      showError('Failed to reorder');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Course Curriculum</h2>
        <span className="bg-dcs-purple/10 text-dcs-purple px-4 py-1 rounded-full text-xs font-bold border border-dcs-purple/20 uppercase tracking-wider">
          {modules.length} Modules
        </span>
      </div>

      {modules.map((module, index) => (
        <div key={module.id} className="bg-dcs-dark-gray/30 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-dcs-purple/20 shadow-xl group/module">
          {editingModule === module.id ? (
            <div className="p-6 space-y-4">
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Module Title"
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all"
              />
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Module Description"
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all"
                rows={2}
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleSaveEdit(module.id)}
                  className="bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingModule(null)}
                  className="bg-white/5 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`p-6 flex justify-between items-center cursor-pointer transition-colors ${expandedModule === module.id ? 'bg-white/5' : 'hover:bg-white/5'}`}
              onClick={() => toggleModule(module.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-dcs-purple/10 text-dcs-purple text-sm font-bold border border-dcs-purple/20">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-bold text-white group-hover/module:text-dcs-purple transition-colors">{module.title}</h3>
                </div>
                {module.description && (
                  <p className="text-dcs-text-gray mt-2 text-sm line-clamp-1 opacity-80 ml-11">{module.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-3 ml-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex bg-dcs-black/40 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => handleMoveModule(index, 'up')}
                    disabled={index === 0}
                    className="p-2 text-dcs-text-gray hover:text-white disabled:opacity-20 transition-all hover:bg-white/5 rounded-lg"
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveModule(index, 'down')}
                    disabled={index === modules.length - 1}
                    className="p-2 text-dcs-text-gray hover:text-white disabled:opacity-20 transition-all hover:bg-white/5 rounded-lg"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => handleEdit(module)}
                  className="p-2.5 bg-dcs-black/40 text-dcs-text-gray hover:text-dcs-purple transition-all hover:bg-white/5 rounded-xl border border-white/5 shadow-inner"
                  title="Edit Module"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDeleteModule(module.id)}
                  disabled={deletingId === module.id}
                  className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all rounded-xl border border-red-500/20 shadow-inner"
                  title="Delete Module"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                <div className={`p-2 transition-transform duration-300 ${expandedModule === module.id ? 'rotate-180 text-dcs-purple' : 'text-dcs-text-gray'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {expandedModule === module.id && (
            <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="border-t border-white/5 pt-6">
                <ContentList moduleId={module.id} onUpdate={onUpdate} />
                <div className="mt-8">
                  <AddContent moduleId={module.id} onAdd={onUpdate} />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, moduleId: null })}
        onConfirm={executeDeleteModule}
        title="Delete Module"
        message="Are you sure you want to delete this module? This will remove all associated content and assessments. This action cannot be undone."
        confirmText="Delete Module"
      />
    </div>
  );
}

function ContentList({ moduleId, onUpdate }) {
  const [content, setContent] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, contentId: null });

  useEffect(() => {
    fetchContent();
  }, [moduleId]);

  const fetchContent = async () => {
    try {
      const data = await adminService.getContent(moduleId);
      setContent(data.content);
    } catch (err) {
      console.error('Failed to load content');
    }
  };

  const fetchQuestions = async (contentId) => {
    try {
      const data = await adminService.getQuestions(contentId);
      setQuestions(data.questions);
      setSelectedAssessment(contentId);
    } catch (err) {
      console.error('Failed to load questions');
    }
  };

  const handleDeleteContent = async (contentId) => {
    setConfirmModal({ isOpen: true, contentId });
  };

  const executeDeleteContent = async () => {
    const contentId = confirmModal.contentId;
    setDeletingId(contentId);
    try {
      await adminService.deleteContent(contentId);
      alert('Content deleted');
      onUpdate();
    } catch (err) {
      alert('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMoveContent = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= content.length) return;

    const reordered = [...content];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

    const orders = reordered.map((item, idx) => ({
      contentId: item.id,
      orderIndex: idx,
    }));

    try {
      await adminService.reorderContent(moduleId, orders);
      showSuccess('Content reordered');
      onUpdate();
    } catch (err) {
      showError('Failed to reorder');
    }
  };

  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">Content Items</h4>
      {content.length === 0 ? (
        <p className="text-sm text-gray-500">No content yet.</p>
      ) : (
        <ul className="space-y-2">
          {content.map((item, index) => (
            <li key={item.id}>
              <div className="flex justify-between items-center bg-dcs-dark-gray p-2 border border-dcs-purple/20 rounded-lg">
                <span className="text-sm">
                  {item.contentType === 'VIDEO' && '🎥'}
                  {item.contentType === 'ARTICLE' && '📄'}
                  {item.contentType === 'ASSESSMENT' && '✏️'} {item.title}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMoveContent(index, 'up')}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveContent(index, 'down')}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    ↓
                  </button>
                  {item.contentType === 'ASSESSMENT' && (
                    <button
                      onClick={() => fetchQuestions(item.id)}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      Questions
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteContent(item.id)}
                    disabled={deletingId === item.id}
                    className="text-red-600 text-xs hover:underline disabled:text-gray-400"
                  >
                    {deletingId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                  <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ isOpen: false, contentId: null })}
                    onConfirm={executeDeleteContent}
                    title="Delete Content"
                    message="Are you sure you want to delete this content? This action cannot be undone."
                    confirmText="Delete"
                  />
                </div>
              </div>

              {selectedAssessment === item.id && (
                <div className="ml-4 mt-2 p-3 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo rounded">
                  <p className="text-md font-semibold mb-2">{questions.length} Questions</p>
                  {questions.map((q, idx) => (
                    <div key={q.id} className="text-xs text-gray-600 mb-3 p-3 bg-white rounded">
                      <p className="font-semibold mb-2">
                        {idx + 1}. {q.questionText}
                      </p>
                      <p className="text-gray-600">Type: {q.questionType}</p>
                      {q.questionType === 'MCQ' ? (
                        <div className="ml-3 text-gray-600 space-y-1">
                          {q.optionA && <p>A. {q.optionA}</p>}
                          {q.optionB && <p>B. {q.optionB}</p>}
                          {q.optionC && <p>C. {q.optionC}</p>}
                          {q.optionD && <p>D. {q.optionD}</p>}
                        </div>
                      ) : (
                        <div className="ml-3 text-gray-600 space-y-1">
                          <p>• True</p>
                          <p>• False</p>
                        </div>
                      )}
                      <p className="mt-2 text-green-700 font-medium">
                        Correct Answer: {q.correctAnswer}
                      </p>
                      {q.explanation && (
                        <p className="mt-1 text-gray-600 italic">
                          Explanation: {q.explanation}
                        </p>
                      )}
                      <p className="mt-1 text-gray-500">
                        Points: {q.points}
                      </p>
                    </div>
                  ))}
                  <AddQuestion contentId={item.id} onAdd={() => fetchQuestions(item.id)} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
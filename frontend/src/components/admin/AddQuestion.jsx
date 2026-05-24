import { useState } from 'react';
import { adminService } from '../../api/adminService';
import { showSuccess, showError } from '../../utils/toast';

export default function AddQuestion({ contentId, onAdd }) {
  const [type, setType] = useState('MCQ');
  const [formData, setFormData] = useState({
    questionText: '',
    correctAnswer: '',
    explanation: '',
    points: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Build the payload based on question type
      const payload = {
        questionType: type,
        questionText: formData.questionText,
        correctAnswer: formData.correctAnswer,
        points: Number(formData.points) || 1
      };

      // Only include explanation if it's not empty
      if (formData.explanation.trim()) {
        payload.explanation = formData.explanation;
      }

      // Only include options for MCQ questions
      if (type === 'MCQ') {
        payload.optionA = formData.optionA;
        payload.optionB = formData.optionB;
        if (formData.optionC.trim()) payload.optionC = formData.optionC;
        if (formData.optionD.trim()) payload.optionD = formData.optionD;
      }

      console.log('Sending data:', payload); // Debug
      await adminService.addQuestion(contentId, payload);
      showSuccess('Question added!');
      setFormData({
        questionText: '',
        correctAnswer: '',
        explanation: '',
        points: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: ''
      });
      onAdd();
    } catch (err) {
      console.error('Full error:', err); // Debug
      console.error('Response data:', err.response?.data); // Debug
      console.error('Response status:', err.response?.status); // Debug
      showError(err.response?.data?.error?.message || 'Failed to add question');
    }
  };

  return (
    <div className="bg-dcs-dark-gray/20 backdrop-blur-md p-8 rounded-2xl border border-white/5 mt-6 group">
      <h4 className="font-bold mb-6 text-white text-lg flex items-center gap-2">
        <span className="w-1.5 h-5 bg-dcs-purple/50 rounded-full"></span>
        Add Quiz Question
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all cursor-pointer"
        >
          <option value="MCQ">Multiple Choice</option>
          <option value="TRUE_FALSE">True / False</option>
        </select>

        <textarea
          placeholder="Question Text"
          value={formData.questionText}
          onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
          required
          className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-dcs-text-gray/30"
          rows={3}
        />

        {type === 'MCQ' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Option A"
              value={formData.optionA}
              onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
              required
              className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-dcs-text-gray/30"
            />
            <input
              type="text"
              placeholder="Option B"
              value={formData.optionB}
              onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
              required
              className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-dcs-text-gray/30"
            />
            <input
              type="text"
              placeholder="Option C (optional)"
              value={formData.optionC}
              onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
              className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-dcs-text-gray/30"
            />
            <input
              type="text"
              placeholder="Option D (optional)"
              value={formData.optionD}
              onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
              className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-dcs-text-gray/30"
            />
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Correct Answer (A, B, C, or D)"
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value.toUpperCase() })}
                required
                maxLength={1}
                className="w-full px-4 py-3 border border-dcs-purple/30 rounded-xl bg-dcs-purple/5 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-dcs-text-gray/30 font-bold uppercase tracking-widest text-center"
              />
            </div>
          </div>
        ) : (
          <select
            value={formData.correctAnswer}
            onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
            required
            className="w-full px-4 py-3 border border-dcs-purple/30 rounded-xl bg-dcs-purple/5 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all cursor-pointer font-bold"
          >
            <option value="">Select correct answer</option>
            <option value="TRUE">TRUE</option>
            <option value="FALSE">FALSE</option>
          </select>
        )}

        <textarea
          placeholder="Explanation for the correct answer (optional)"
          value={formData.explanation}
          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
          className="w-full px-4 py-3 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all placeholder:text-dcs-text-gray/30"
          rows={2}
        />

        <div className="flex items-center gap-4">
          <label className="text-dcs-text-gray text-sm font-bold uppercase tracking-widest">Points:</label>
          <input
            placeholder="1"
            type="number"
            min="1"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: e.target.value })}
            required
            className="w-24 px-4 py-2 border border-white/10 rounded-xl bg-dcs-black/50 text-white focus:border-dcs-purple focus:outline-none transition-all text-center font-bold"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.01] hover:shadow-dcs-purple/20"
        >
          Save Question
        </button>
      </form>
    </div>
  );
}
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { messageService } from '../api/messageService';
import { showSuccess, showError } from '../utils/toast';

const AskInstructorButton = ({ courseId, courseTitle }) => {
    const [showModal, setShowModal] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!messageText.trim()) {
            showError('Please enter a message');
            return;
        }

        try {
            setSending(true);
            await messageService.sendToInstructor(courseId, messageText);
            showSuccess('Message sent to instructor!');
            setMessageText('');
            setShowModal(false);
        } catch (error) {
            showError(error.response?.data?.error?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-6 py-3 mt-5 bg-dcs-purple/10 hover:bg-dcs-purple/20 text-dcs-purple border border-dcs-purple/30 rounded-xl font-semibold transition-all"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Ask Instructor
            </button>

            {/* Modal */}
            {showModal && createPortal(
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-dcs-dark-gray rounded-t-2xl sm:rounded-2xl border border-dcs-purple/30 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Ask Your Instructor</h2>
                                <p className="text-sm text-dcs-text-gray mt-1">Course: {courseTitle}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-dcs-text-gray hover:text-white text-3xl leading-none transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-dcs-purple uppercase tracking-wider mb-2">
                                    Your Question
                                </label>
                                <textarea
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    rows={8}
                                    placeholder="Ask your instructor anything about this course..."
                                    className="w-full px-4 py-3 bg-dcs-black border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all resize-none"
                                    autoFocus
                                />
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                <p className="text-sm text-blue-400">
                                    💡 Your instructor will receive this message and reply to you directly in your inbox.
                                </p>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-5 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-dcs-light-gray hover:bg-dcs-light-gray/80 text-white font-semibold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending || !messageText.trim()}
                                    className="px-4 py-2 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-dcs-purple/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default AskInstructorButton;
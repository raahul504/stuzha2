import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageService } from '../api/messageService';
import { useAuth } from '../context/AuthContext';
import { showSuccess, showError } from '../utils/toast';
import Navbar from '../components/Navbar';

export default function AdminMessagesMonitor() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterHours, setFilterHours] = useState('all');
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderText, setReminderText] = useState('');
    const [sending, setSending] = useState(false);

    // Bulk selection states
    const [selectedInstructors, setSelectedInstructors] = useState(new Set());
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkReminderText, setBulkReminderText] = useState('');
    const [sendingBulk, setSendingBulk] = useState(false);

    useEffect(() => {
        if (user?.role !== 'ADMIN') {
            navigate('/');
            return;
        }
        fetchUnansweredQuestions();
    }, [filterHours]);

    const fetchUnansweredQuestions = async () => {
        try {
            setLoading(true);
            const filters = filterHours !== 'all' ? { olderThan: filterHours } : {};
            const data = await messageService.getUnansweredQuestions(filters);
            setQuestions(data.questions);
            setSelectedInstructors(new Set()); // Clear selection on refetch
        } catch (error) {
            showError('Failed to fetch unanswered questions');
        } finally {
            setLoading(false);
        }
    };

    const getTimeSince = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        return 'Just now';
    };

    const getUrgencyColor = (dateString) => {
        const diffHours = (new Date() - new Date(dateString)) / (1000 * 60 * 60);
        if (diffHours > 48) return 'text-red-400 bg-red-500/10 border-red-500/20';
        if (diffHours > 24) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        return 'text-green-400 bg-green-500/10 border-green-500/20';
    };

    const groupedByInstructor = questions.reduce((acc, question) => {
        const instructorId = question.recipient.id;
        if (!acc[instructorId]) {
            acc[instructorId] = {
                instructor: question.recipient,
                questions: []
            };
        }
        acc[instructorId].questions.push(question);
        return acc;
    }, {});

    const handleSendReminder = async () => {
        if (!reminderText.trim() || !selectedQuestion) return;

        try {
            setSending(true);
            await messageService.sendAdminToInstructor(
                selectedQuestion.recipient.id,
                reminderText,
                selectedQuestion.courseId
            );
            showSuccess('Reminder sent to instructor!');
            setShowReminderModal(false);
            setReminderText('');
            setSelectedQuestion(null);
        } catch (error) {
            showError('Failed to send reminder');
        } finally {
            setSending(false);
        }
    };

    const openReminderModal = (question) => {
        setSelectedQuestion(question);
        setReminderText(
            `Hi ${question.recipient.firstName}, a student is waiting for your reply on "${question.course?.title}". Please check your inbox when you get a chance.`
        );
        setShowReminderModal(true);
    };

    const toggleInstructorSelection = (instructorId) => {
        const newSelection = new Set(selectedInstructors);
        if (newSelection.has(instructorId)) {
            newSelection.delete(instructorId);
        } else {
            newSelection.add(instructorId);
        }
        setSelectedInstructors(newSelection);
    };

    const selectAllInstructors = () => {
        const allIds = Object.keys(groupedByInstructor);
        setSelectedInstructors(new Set(allIds));
    };

    const clearSelection = () => {
        setSelectedInstructors(new Set());
    };

    const openBulkReminderModal = () => {
        if (selectedInstructors.size === 0) {
            showError('Please select at least one instructor');
            return;
        }
        setBulkReminderText(
            'Hi! This is a reminder that you have unanswered student questions waiting in your inbox. Please take a moment to respond when you can. Thank you!'
        );
        setShowBulkModal(true);
    };

    const handleSendBulkReminders = async () => {
        if (!bulkReminderText.trim()) {
            showError('Please enter a reminder message');
            return;
        }

        try {
            setSendingBulk(true);
            const instructorIds = Array.from(selectedInstructors);
            const result = await messageService.sendBulkReminders(instructorIds, bulkReminderText);

            showSuccess(`Reminders sent to ${result.successful} instructor(s)!`);
            if (result.failed > 0) {
                showWarning(`${result.failed} reminder(s) failed to send`);
            }

            setShowBulkModal(false);
            setBulkReminderText('');
            clearSelection();
        } catch (error) {
            showError('Failed to send bulk reminders');
        } finally {
            setSendingBulk(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dcs-black via-dcs-black to-dcs-dark-gray/30">
            <Navbar />

            <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24 pb-6 sm:pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <button
                            onClick={() => navigate('/admin')}
                            className="flex items-center gap-2 text-dcs-text-gray hover:text-white transition-colors mb-4 group"
                        >
                            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            Back to Dashboard
                        </button>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent">
                            Unanswered Questions
                        </h1>
                        <p className="text-dcs-text-gray">Monitor student questions that haven't received instructor replies</p>
                    </div>

                    {/* Filter */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'All', value: 'all' },
                            { label: '24h+', value: '24' },
                            { label: '48h+', value: '48' },
                            { label: '1 week+', value: '168' },
                        ].map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setFilterHours(f.value)}
                                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${filterHours === f.value
                                    ? 'bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white shadow-lg shadow-dcs-purple/30'
                                    : 'bg-dcs-dark-gray text-dcs-text-gray hover:text-white border border-white/10'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-dcs-dark-gray/40 border border-dcs-purple/20 rounded-2xl p-5">
                        <p className="text-dcs-text-gray text-xs font-bold uppercase tracking-wider mb-1">Total Unanswered</p>
                        <p className="text-3xl font-bold text-white">{questions.length}</p>
                    </div>
                    <div className="bg-dcs-dark-gray/40 border border-yellow-500/20 rounded-2xl p-5">
                        <p className="text-dcs-text-gray text-xs font-bold uppercase tracking-wider mb-1">Over 24 Hours</p>
                        <p className="text-3xl font-bold text-yellow-400">
                            {questions.filter(q => (new Date() - new Date(q.createdAt)) > 24 * 60 * 60 * 1000).length}
                        </p>
                    </div>
                    <div className="bg-dcs-dark-gray/40 border border-red-500/20 rounded-2xl p-5">
                        <p className="text-dcs-text-gray text-xs font-bold uppercase tracking-wider mb-1">Over 48 Hours</p>
                        <p className="text-3xl font-bold text-red-400">
                            {questions.filter(q => (new Date() - new Date(q.createdAt)) > 48 * 60 * 60 * 1000).length}
                        </p>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {Object.keys(groupedByInstructor).length > 0 && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-dcs-dark-gray/40 border border-dcs-purple/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-dcs-text-gray">
                                {selectedInstructors.size} instructor(s) selected
                            </span>
                            <button
                                onClick={selectAllInstructors}
                                className="text-sm text-dcs-purple hover:text-dcs-electric-indigo font-semibold transition-colors"
                            >
                                Select All
                            </button>
                            {selectedInstructors.size > 0 && (
                                <button
                                    onClick={clearSelection}
                                    className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors"
                                >
                                    Clear Selection
                                </button>
                            )}
                        </div>
                        <button
                            onClick={openBulkReminderModal}
                            disabled={selectedInstructors.size === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-dcs-purple/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Send Bulk Reminders ({selectedInstructors.size})
                        </button>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dcs-purple"></div>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-dcs-dark-gray/50 rounded-2xl border border-dcs-purple/20">
                        <div className="text-6xl mb-4">✅</div>
                        <p className="text-dcs-text-gray text-lg">All questions have been answered!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.values(groupedByInstructor).map(({ instructor, questions: instructorQuestions }) => (
                            <div key={instructor.id} className="bg-dcs-dark-gray/40 border border-dcs-purple/20 rounded-2xl overflow-hidden">
                                {/* Instructor Header */}
                                <div className="p-3 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedInstructors.has(instructor.id)}
                                            onChange={() => toggleInstructorSelection(instructor.id)}
                                            className="w-5 h-5 rounded border-2 border-dcs-purple/50 bg-dcs-black checked:bg-dcs-purple checked:border-dcs-purple focus:ring-2 focus:ring-dcs-purple focus:ring-offset-2 focus:ring-offset-dcs-dark-gray transition-all cursor-pointer"
                                        />
                                        <div className="w-10 h-10 rounded-full bg-dcs-purple/20 flex items-center justify-center">
                                            <span className="text-dcs-purple font-bold">
                                                {instructor.firstName[0]}{instructor.lastName[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">
                                                {instructor.firstName} {instructor.lastName}
                                            </p>
                                            <p className="text-sm text-dcs-text-gray">{instructor.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-dcs-purple/10 text-dcs-purple text-sm font-bold rounded-full border border-dcs-purple/20">
                                            {instructorQuestions.length} unanswered
                                        </span>
                                        <button
                                            onClick={() => openReminderModal(instructorQuestions[0])}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-dcs-purple/30"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                            Send Reminder
                                        </button>
                                    </div>
                                </div>

                                {/* Questions List */}
                                <div className="divide-y divide-white/5">
                                    {instructorQuestions.map((question) => (
                                        <div key={question.id} className="p-5 hover:bg-white/5 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <p className="font-semibold text-white">
                                                            {question.sender.firstName} {question.sender.lastName}
                                                        </p>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getUrgencyColor(question.createdAt)}`}>
                                                            {getTimeSince(question.createdAt)}
                                                        </span>
                                                    </div>
                                                    {question.course && (
                                                        <p className="text-sm text-dcs-purple mb-2">
                                                            Course: {question.course.title}
                                                        </p>
                                                    )}
                                                    <p className="text-dcs-text-gray text-sm line-clamp-2">
                                                        {question.messageText}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => openReminderModal(question)}
                                                    className="flex-shrink-0 px-4 py-2 bg-dcs-light-gray hover:bg-dcs-light-gray/80 text-white text-sm font-semibold rounded-xl transition-all border border-white/10"
                                                >
                                                    Remind
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Single Reminder Modal */}
            {showReminderModal && selectedQuestion && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowReminderModal(false)}
                >
                    <div
                        className="bg-dcs-dark-gray rounded-2xl border border-dcs-purple/30 max-w-lg w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Send Reminder</h2>
                                <p className="text-sm text-dcs-text-gray mt-1">
                                    To: {selectedQuestion.recipient.firstName} {selectedQuestion.recipient.lastName}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowReminderModal(false)}
                                className="text-dcs-text-gray hover:text-white text-3xl leading-none transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <textarea
                                value={reminderText}
                                onChange={(e) => setReminderText(e.target.value)}
                                rows={5}
                                className="w-full px-4 py-3 bg-dcs-black border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all resize-none"
                            />
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                                <p className="text-xs text-blue-400">
                                    ℹ This message will appear in the instructor's inbox.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowReminderModal(false)}
                                    className="px-5 py-2.5 bg-dcs-light-gray text-white font-semibold rounded-xl transition-all border border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendReminder}
                                    disabled={sending || !reminderText.trim()}
                                    className="px-5 py-2.5 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-dcs-purple/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? 'Sending...' : 'Send Reminder'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Reminder Modal */}
            {showBulkModal && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowBulkModal(false)}
                >
                    <div
                        className="bg-dcs-dark-gray rounded-2xl border border-dcs-purple/30 max-w-lg w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Send Bulk Reminders</h2>
                                <p className="text-sm text-dcs-text-gray mt-1">
                                    To: {selectedInstructors.size} instructor(s)
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBulkModal(false)}
                                className="text-dcs-text-gray hover:text-white text-3xl leading-none transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <textarea
                                value={bulkReminderText}
                                onChange={(e) => setBulkReminderText(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 bg-dcs-black border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all resize-none"
                            />
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                                <p className="text-xs text-yellow-400">
                                    ⚠ This message will be sent to all {selectedInstructors.size} selected instructor(s).
                                </p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowBulkModal(false)}
                                    className="px-5 py-2.5 bg-dcs-light-gray text-white font-semibold rounded-xl transition-all border border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendBulkReminders}
                                    disabled={sendingBulk || !bulkReminderText.trim()}
                                    className="px-5 py-2.5 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-dcs-purple/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendingBulk ? 'Sending...' : `Send to ${selectedInstructors.size} Instructor(s)`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
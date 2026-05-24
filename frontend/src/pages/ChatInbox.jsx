import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageService } from '../api/messageService';
import { useAuth } from '../context/AuthContext';
import { showSuccess, showError } from '../utils/toast';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

const ChatInbox = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [mobileView, setMobileView] = useState('list'); // 'list' or 'conversation'
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    // Filter states
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [messageTypeFilter, setMessageTypeFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, [filter, messageTypeFilter]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMessages();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const filters = {};

            if (filter === 'unread') {
                filters.isRead = false;
            }

            if (searchTerm.trim()) {
                filters.search = searchTerm.trim();
            }

            if (messageTypeFilter) {
                filters.messageType = messageTypeFilter;
            }

            const data = await messageService.getInbox(filters);
            setMessages(data.messages);
        } catch (error) {
            showError('Failed to load messages');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMessage = async (message) => {
        setSelectedMessage(message);
        setReplyText('');
        setMobileView('conversation'); // Switch to conversation on mobile

        // Check if there are any unread messages in this thread for the current user
        const hasUnread = !message.isRead && message.recipientId === user.id;
        const hasUnreadReplies = message.replies?.some(r => !r.isRead && r.recipientId === user.id);
        // Mark as read if there's anything unread
        if (hasUnread || hasUnreadReplies) {
            try {
                await messageService.markAsRead(message.id);
                fetchMessages();
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();

        if (!replyText.trim() || !selectedMessage) return;

        try {
            setSending(true);
            await messageService.replyToMessage(selectedMessage.id, replyText);
            showSuccess('Reply sent!');
            setReplyText('');

            const data = await messageService.getConversation(selectedMessage.id);
            setSelectedMessage(data.conversation);
            fetchMessages();
        } catch (error) {
            showError(error.response?.data?.error?.message || 'Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    const canReply = (message) => {
        if (message.messageType === 'ADMIN_TO_USER' && user.role === 'STUDENT') {
            return false;
        }
        return true;
    };

    const getMessageTypeLabel = (messageType) => {
        switch (messageType) {
            case 'USER_TO_INSTRUCTOR':
                return 'Question to Instructor';
            case 'INSTRUCTOR_TO_USER':
                return 'Instructor Reply';
            case 'ADMIN_TO_INSTRUCTOR':
                return 'Admin Message';
            case 'ADMIN_TO_USER':
                return 'Admin Announcement';
            default:
                return 'Message';
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setMessageTypeFilter('');
        setFilter('all');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dcs-black via-dcs-black to-dcs-dark-gray/30">
            <Navbar />

            <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24 pb-6 sm:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                        <span className="bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent">Messages</span>
                    </h1>
                    <p className="text-dcs-text-gray text-sm sm:text-base">Your conversations and notifications</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-[calc(100vh-200px)] sm:h-[calc(100vh-300px)]">
                    {/* Message List - hidden on mobile when viewing conversation */}
                    <div className={`bg-dcs-dark-gray/50 rounded-2xl border border-dcs-purple/10 overflow-hidden flex flex-col ${mobileView === 'conversation' ? 'hidden lg:flex' : 'flex'}`}>
                        {/* Header with Filters */}
                        <div className="p-4 border-b border-white/10 space-y-3">
                            {/* Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search messages, courses, or people..."
                                    className="w-full pl-10 pr-4 py-2 bg-dcs-black border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all"
                                />
                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dcs-text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Quick Filters */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'all'
                                        ? 'bg-dcs-purple text-white'
                                        : 'bg-dcs-light-gray/50 text-dcs-text-gray hover:text-white'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('unread')}
                                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'unread'
                                        ? 'bg-dcs-purple text-white'
                                        : 'bg-dcs-light-gray/50 text-dcs-text-gray hover:text-white'
                                        }`}
                                >
                                    Unread
                                </button>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${showFilters || messageTypeFilter
                                        ? 'bg-dcs-purple text-white'
                                        : 'bg-dcs-light-gray/50 text-dcs-text-gray hover:text-white'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </button>
                            </div>

                            {/* Advanced Filters */}
                            {showFilters && (
                                <div className="space-y-2 p-3 bg-dcs-black/30 rounded-lg border border-white/5">
                                    <label className="block text-xs font-bold text-dcs-purple uppercase tracking-wider">Message Type</label>
                                    <select
                                        value={messageTypeFilter}
                                        onChange={(e) => setMessageTypeFilter(e.target.value)}
                                        className="w-full px-3 py-2 bg-dcs-black border border-white/10 rounded-lg text-white text-sm focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none"
                                    >
                                        <option value="">All Types</option>
                                        <option value="USER_TO_INSTRUCTOR">Questions to Instructor</option>
                                        <option value="INSTRUCTOR_TO_USER">Instructor Replies</option>
                                        <option value="ADMIN_TO_INSTRUCTOR">Admin to Instructor</option>
                                        <option value="ADMIN_TO_USER">Admin Announcements</option>
                                    </select>

                                    {(searchTerm || messageTypeFilter) && (
                                        <button
                                            onClick={clearFilters}
                                            className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-all border border-red-500/20"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dcs-purple"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                    <div className="text-6xl mb-4">📭</div>
                                    <p className="text-dcs-text-gray">
                                        {searchTerm || messageTypeFilter ? 'No messages match your filters' : 'No messages yet'}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {messages.map((message) => (
                                        <button
                                            key={message.id}
                                            onClick={() => handleSelectMessage(message)}
                                            className={`w-full p-4 text-left transition-all hover:bg-white/5 ${selectedMessage?.id === message.id ? 'bg-dcs-purple/10 border-l-4 border-dcs-purple' : ''
                                                } ${!message.isRead ? 'bg-dcs-purple/5' : ''}`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-white truncate">
                                                        {message.sender.firstName} {message.sender.lastName}
                                                    </p>
                                                    <p className="text-xs text-dcs-text-gray">
                                                        {getMessageTypeLabel(message.messageType)}
                                                    </p>
                                                </div>
                                                {!message.isRead && (
                                                    <div className="w-2 h-2 bg-dcs-purple rounded-full flex-shrink-0"></div>
                                                )}
                                            </div>
                                            {message.course && (
                                                <p className="text-xs text-dcs-purple mb-1 truncate">
                                                    Course: {message.course.title}
                                                </p>
                                            )}
                                            <p className="text-sm text-dcs-text-gray truncate">{message.messageText}</p>
                                            <p className="text-xs text-dcs-text-gray/60 mt-1">
                                                {new Date(message.createdAt).toLocaleDateString()}
                                            </p>
                                            {message.replies && message.replies.length > 0 && (
                                                <p className="text-xs text-dcs-purple mt-1">
                                                    {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Conversation View - Keep the same as before */}
                    <div className={`lg:col-span-1 bg-dcs-dark-gray rounded-2xl border border-dcs-purple/20 overflow-hidden flex flex-col ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
                        {selectedMessage ? (
                            <>
                                <div className="p-4 sm:p-6 border-b border-dcs-purple/10 flex items-center gap-3">
                                    {/* Mobile back button */}
                                    <button
                                        onClick={() => setMobileView('list')}
                                        className="lg:hidden text-dcs-purple hover:text-white transition-colors p-1"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                                                {selectedMessage.sender.firstName} {selectedMessage.sender.lastName}
                                            </h2>
                                            <p className="text-sm text-dcs-text-gray">
                                                {getMessageTypeLabel(selectedMessage.messageType)}
                                            </p>
                                            {selectedMessage.course && (
                                                <p className="text-sm text-dcs-purple mt-1">
                                                    Course: {selectedMessage.course.title}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-dcs-text-gray">
                                            {new Date(selectedMessage.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-dcs-purple/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-dcs-purple font-bold">
                                                {selectedMessage.sender.firstName[0]}{selectedMessage.sender.lastName[0]}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-dcs-light-gray/50 rounded-xl p-4">
                                                <p className="text-white whitespace-pre-wrap">{selectedMessage.messageText}</p>
                                            </div>
                                            <p className="text-xs text-dcs-text-gray mt-1 ml-2">
                                                {new Date(selectedMessage.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedMessage.replies && selectedMessage.replies.map((reply) => (
                                        <div key={reply.id} className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-green-400 font-bold">
                                                    {reply.sender.firstName[0]}{reply.sender.lastName[0]}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                                    <p className="text-sm font-semibold text-green-400 mb-1">
                                                        {reply.sender.firstName} {reply.sender.lastName}
                                                    </p>
                                                    <p className="text-white whitespace-pre-wrap">{reply.messageText}</p>
                                                </div>
                                                <p className="text-xs text-dcs-text-gray mt-1 ml-2">
                                                    {new Date(reply.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {canReply(selectedMessage) ? (
                                    <div className="p-6 border-t border-white/10">
                                        <form onSubmit={handleSendReply} className="flex gap-3">
                                            <input
                                                type="text"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Type your reply..."
                                                className="flex-1 px-4 py-3 bg-dcs-black border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all"
                                            />
                                            <button
                                                type="submit"
                                                disabled={sending || !replyText.trim()}
                                                className="px-6 py-3 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-dcs-purple/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {sending ? 'Sending...' : 'Send'}
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="p-6 border-t border-white/10 bg-dcs-black/30">
                                        <p className="text-sm text-dcs-text-gray text-center italic">
                                            {selectedMessage.messageType === 'ADMIN_TO_USER'
                                                ? 'This is an announcement from admin. Replies are not allowed.'
                                                : 'You cannot reply to this message.'}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <div className="text-6xl mb-4">💬</div>
                                <p className="text-dcs-text-gray text-lg">Select a message to view conversation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInbox;
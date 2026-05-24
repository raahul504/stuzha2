import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { approvalService } from '../api/approvalService';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../utils/toast';
import Navbar from '../components/Navbar';

export default function AdminActivityLog() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        approvedPublish: 0,
        disapprovedPublish: 0,
        approvedUnpublish: 0,
        disapprovedUnpublish: 0
    });

    useEffect(() => {
        if (user?.role !== 'ADMIN') {
            navigate('/');
            return;
        }
        fetchLogs();
    }, [actionFilter, startDate, endDate]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const filters = {};

            if (searchTerm.trim()) {
                filters.search = searchTerm.trim();
            }
            if (actionFilter) {
                filters.action = actionFilter;
            }
            if (startDate) {
                filters.startDate = startDate;
            }
            if (endDate) {
                filters.endDate = endDate;
            }

            const data = await approvalService.getAllApprovalLogs(filters);
            setLogs(data.logs);

            // Calculate stats
            setStats({
                total: data.logs.length,
                approvedPublish: data.logs.filter(l => l.action === 'APPROVED_PUBLISH').length,
                disapprovedPublish: data.logs.filter(l => l.action === 'DISAPPROVED_PUBLISH').length,
                approvedUnpublish: data.logs.filter(l => l.action === 'APPROVED_UNPUBLISH').length,
                disapprovedUnpublish: data.logs.filter(l => l.action === 'DISAPPROVED_UNPUBLISH').length
            });
        } catch (error) {
            showError('Failed to fetch approval logs');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setActionFilter('');
        setStartDate('');
        setEndDate('');
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'APPROVED_PUBLISH':
                return { text: 'Approved Publish', icon: '✅', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
            case 'DISAPPROVED_PUBLISH':
                return { text: 'Disapproved Publish', icon: '❌', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
            case 'APPROVED_UNPUBLISH':
                return { text: 'Approved Unpublish', icon: '✅', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
            case 'DISAPPROVED_UNPUBLISH':
                return { text: 'Disapproved Unpublish', icon: '❌', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
            default:
                return { text: action, icon: '📋', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' };
        }
    };

    const exportLogs = () => {
        // Simple CSV export
        const headers = ['Date', 'Admin', 'Action', 'Course', 'Instructor', 'Status Change', 'Reason'];
        const rows = logs.map(log => [
            new Date(log.createdAt).toLocaleString(),
            `${log.admin.firstName} ${log.admin.lastName}`,
            log.action,
            log.course.title,
            `${log.course.creator.firstName} ${log.course.creator.lastName}`,
            `${log.previousStatus} → ${log.newStatus}`,
            log.reason || 'N/A'
        ]);

        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `approval-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dcs-black via-dcs-black to-dcs-dark-gray/30">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 text-dcs-text-gray hover:text-white transition-colors mb-4 group"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        Back to Dashboard
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent">
                                Approval Activity Log
                            </h1>
                            <p className="text-dcs-text-gray">Complete history of all course approval decisions</p>
                        </div>

                        <button
                            onClick={exportLogs}
                            disabled={logs.length === 0}
                            className="flex items-center gap-2 px-4 py-2.5 bg-dcs-purple/10 hover:bg-dcs-purple/20 text-dcs-purple border border-dcs-purple/30 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-dcs-dark-gray/40 border border-dcs-purple/20 rounded-2xl p-3 sm:p-4">
                        <p className="text-dcs-text-gray text-xs font-bold uppercase tracking-wider mb-1">Total Actions</p>
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="bg-dcs-dark-gray/40 border border-green-500/20 rounded-2xl p-3 sm:p-4">
                        <p className="text-dcs-text-gray text-xs font-bold uppercase tracking-wider mb-1">Approved Publish</p>
                        <p className="text-2xl font-bold text-green-400">{stats.approvedPublish}</p>
                    </div>
                    <div className="bg-dcs-dark-gray/40 border border-red-500/20 rounded-2xl p-3 sm:p-4">
                        <p className="text-dcs-text-gray text-xs font-bold uppercase tracking-wider mb-1">Declined Publish</p>
                        <p className="text-2xl font-bold text-red-400">{stats.disapprovedPublish}</p>
                    </div>
                    <div className="bg-dcs-dark-gray/40 border border-blue-500/20 rounded-2xl p-3 sm:p-4">
                        <p className="text-dcs-text-gray text-xs font-bold uppercase tracking-wider mb-1">Approved Unpublish</p>
                        <p className="text-2xl font-bold text-blue-400">{stats.approvedUnpublish}</p>
                    </div>
                    <div className="bg-dcs-dark-gray/40 border border-orange-500/20 rounded-2xl p-3 sm:p-4">
                        <p className="text-dcs-text-gray text-xs font-bold uppercase tracking-wider mb-1">Declined Unpublish</p>
                        <p className="text-2xl font-bold text-orange-400">{stats.disapprovedUnpublish}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-dcs-dark-gray/40 border border-dcs-purple/20 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by course title, admin name, or instructor..."
                                className="w-full pl-10 pr-4 py-3 bg-dcs-black border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all"
                            />
                            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-dcs-text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Advanced Filters Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 text-dcs-purple hover:text-dcs-electric-indigo text-sm font-semibold transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            {showFilters ? 'Hide' : 'Show'} Advanced Filters
                        </button>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-dcs-black/30 rounded-xl border border-white/5">
                                <div>
                                    <label className="block text-xs font-bold text-dcs-purple uppercase tracking-wider mb-2">Action Type</label>
                                    <select
                                        value={actionFilter}
                                        onChange={(e) => setActionFilter(e.target.value)}
                                        className="w-full px-3 py-2 bg-dcs-black border border-white/10 rounded-lg text-white text-sm focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none"
                                    >
                                        <option value="">All Actions</option>
                                        <option value="APPROVED_PUBLISH">Approved Publish</option>
                                        <option value="DISAPPROVED_PUBLISH">Disapproved Publish</option>
                                        <option value="APPROVED_UNPUBLISH">Approved Unpublish</option>
                                        <option value="DISAPPROVED_UNPUBLISH">Disapproved Unpublish</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-dcs-purple uppercase tracking-wider mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-dcs-black border border-white/10 rounded-lg text-white text-sm focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-dcs-purple uppercase tracking-wider mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-dcs-black border border-white/10 rounded-lg text-white text-sm focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Clear Filters */}
                        {(searchTerm || actionFilter || startDate || endDate) && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Logs List */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dcs-purple"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-dcs-dark-gray/50 rounded-2xl border border-dcs-purple/20">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-dcs-text-gray text-lg">
                            {searchTerm || actionFilter || startDate || endDate ? 'No logs match your filters' : 'No approval activity yet'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log) => {
                            const actionLabel = getActionLabel(log.action);
                            return (
                                <div key={log.id} className="bg-dcs-dark-gray/40 border border-dcs-purple/20 rounded-xl p-4 sm:p-5 hover:border-dcs-purple/40 transition-all">
                                    <div className="flex items-start gap-4">
                                        {/* Course Thumbnail */}
                                        {log.course.thumbnailUrl && (
                                            <img
                                                src={log.course.thumbnailUrl}
                                                alt={log.course.title}
                                                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-white/10 flex-shrink-0"
                                            />
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-white text-base sm:text-lg mb-1 truncate" title={log.course.title}>{log.course.title}</h3>
                                                    <p className="text-sm text-dcs-text-gray">
                                                        Instructor: <span className="text-dcs-purple">{log.course.creator.firstName} {log.course.creator.lastName}</span>
                                                    </p>
                                                </div>
                                                <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border whitespace-nowrap flex-shrink-0 ${actionLabel.color}`}>
                                                    {actionLabel.icon} {actionLabel.text}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-dcs-text-gray mb-1">Admin</p>
                                                    <p className="text-white font-medium">{log.admin.firstName} {log.admin.lastName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-dcs-text-gray mb-1">Status Change</p>
                                                    <p className="text-white font-medium">{log.previousStatus} → {log.newStatus}</p>
                                                </div>
                                                <div>
                                                    <p className="text-dcs-text-gray mb-1">Date & Time</p>
                                                    <p className="text-white font-medium">{new Date(log.createdAt).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {log.reason && (
                                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                    <p className="text-xs font-bold text-red-400 mb-1">Reason for Disapproval:</p>
                                                    <p className="text-sm text-red-300">{log.reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
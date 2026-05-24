import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { approvalService } from '../api/approvalService';
import { getServerUrl } from '../api/axios';
import { showSuccess, showError } from '../utils/toast';
import Navbar from '../components/Navbar';
import DOMPurify from 'dompurify';

const AdminApprovalDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('publish');
    const [publishRequests, setPublishRequests] = useState([]);
    const [unpublishRequests, setUnpublishRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedContent, setSelectedContent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState(null);
    const [disapprovalReason, setDisapprovalReason] = useState('');

    useEffect(() => {
        if (user?.role !== 'ADMIN') {
            navigate('/');
            return;
        }
        fetchAllRequests();
    }, []);

    const fetchAllRequests = async () => {
        try {
            setLoading(true);
            const [publishData, unpublishData] = await Promise.all([
                approvalService.getPendingPublishRequests(),
                approvalService.getPendingUnpublishRequests()
            ]);
            setPublishRequests(publishData.requests);
            setUnpublishRequests(unpublishData.requests);
        } catch (error) {
            showError('Failed to fetch requests');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (course, action) => {
        setSelectedCourse(course);
        setModalAction(action);
        setShowModal(true);
        setDisapprovalReason('');
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCourse(null);
        setSelectedContent(null);
        setModalAction(null);
        setDisapprovalReason('');
    };

    const handleApprove = async () => {
        if (!selectedCourse) return;

        try {
            if (activeTab === 'publish') {
                await approvalService.approvePublish(selectedCourse.id);
                showSuccess('Course publish approved!');
            } else {
                await approvalService.approveUnpublish(selectedCourse.id);
                showSuccess('Course unpublish approved!');
            }
            closeModal();
            fetchAllRequests();
        } catch (error) {
            showError('Failed to approve request');
            console.error(error);
        }
    };

    const handleDisapprove = async () => {
        if (!selectedCourse) return;

        if (!disapprovalReason.trim()) {
            showError('Please provide a reason for disapproval');
            return;
        }
        if (disapprovalReason.trim().length < 10) {
            showError('Reason must be at least 10 characters');
            return;
        }

        try {
            if (activeTab === 'publish') {
                await approvalService.disapprovePublish(selectedCourse.id, disapprovalReason);
                showSuccess('Course publish request disapproved');
            } else {
                await approvalService.disapproveUnpublish(selectedCourse.id, disapprovalReason);
                showSuccess('Course unpublish request disapproved');
            }
            closeModal();
            fetchAllRequests();
        } catch (error) {
            showError('Failed to disapprove request');
            console.error(error);
        }
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'APPROVED_PUBLISH':
                return { text: 'Approved Publish', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
            case 'DISAPPROVED_PUBLISH':
                return { text: 'Disapproved Publish', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
            case 'APPROVED_UNPUBLISH':
                return { text: 'Approved Unpublish', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
            case 'DISAPPROVED_UNPUBLISH':
                return { text: 'Disapproved Unpublish', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
            default:
                return { text: action, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' };
        }
    };

    const renderCourseCard = (course) => (
        <div key={course.id} className="bg-dcs-dark-gray rounded-2xl border border-dcs-purple/20 overflow-hidden hover:border-dcs-purple/40 transition-all duration-300 hover:shadow-xl hover:shadow-dcs-purple/10">
            <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                        <p className="text-sm text-dcs-text-gray">
                            By: <span className="text-dcs-purple font-medium">{course.creator?.firstName} {course.creator?.lastName}</span>
                        </p>
                    </div>
                    {course.thumbnailUrl && (
                        <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-24 h-24 object-cover rounded-xl border border-white/10"
                        />
                    )}
                </div>

                {/* Description */}
                <p className="text-sm text-dcs-text-gray leading-relaxed line-clamp-3">
                    {course.shortDescription || course.description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-dcs-black/50 rounded-lg border border-white/5">
                        <span className="text-xs text-dcs-text-gray">Modules:</span>
                        <span className="text-sm font-bold text-white">{course.modules?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-dcs-black/50 rounded-lg border border-white/5">
                        <span className="text-xs text-dcs-text-gray">Content:</span>
                        <span className="text-sm font-bold text-white">
                            {course.modules?.reduce((acc, m) => acc + (m.contentItems?.length || 0), 0) || 0}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-dcs-black/50 rounded-lg border border-white/5">
                        <span className="text-xs text-dcs-text-gray">Price:</span>
                        <span className="text-sm font-bold text-dcs-purple">${course.price}</span>
                    </div>
                    {activeTab === 'unpublish' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-dcs-black/50 rounded-lg border border-white/5">
                            <span className="text-xs text-dcs-text-gray">Enrolled:</span>
                            <span className="text-sm font-bold text-white">{course.enrollments?.length || 0}</span>
                        </div>
                    )}
                </div>

                {/* Categories */}
                {course.categories && course.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {course.categories.map(cc => (
                            <span
                                key={cc.id}
                                className="px-3 py-1 bg-dcs-purple/10 text-dcs-purple text-xs font-medium rounded-full border border-dcs-purple/20"
                            >
                                {cc.category.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button
                        onClick={() => openModal(course, 'review')}
                        className="flex-1 px-4 py-2.5 bg-dcs-light-gray hover:bg-dcs-light-gray/80 text-white text-sm font-semibold rounded-xl transition-all border border-white/10 hover:border-white/20"
                    >
                        Review Course
                    </button>
                    <button
                        onClick={() => openModal(course, 'approve')}
                        className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20"
                    >
                        Approve
                    </button>
                    <button
                        onClick={() => openModal(course, 'disapprove')}
                        className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-red-500/20"
                    >
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );

    const currentRequests = activeTab === 'publish' ? publishRequests : unpublishRequests;

    return (
        <div className="min-h-screen bg-gradient-to-br from-dcs-black via-dcs-black to-dcs-dark-gray/30">
            <Navbar />
            <div className="max-w-7xl mx-auto p-4 sm:p-8 pt-20 sm:pt-28">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-dcs-text-gray hover:text-white transition-colors mb-4 group"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back to Dashboard
                </button>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-dcs-purple bg-clip-text text-transparent">
                        Course Approval Dashboard
                    </h1>

                    {/* Tabs */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('publish')}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'publish'
                                ? 'bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white shadow-lg shadow-dcs-purple/30'
                                : 'bg-dcs-dark-gray text-dcs-text-gray hover:text-white border border-white/10'
                                }`}
                        >
                            Publish Requests ({publishRequests.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('unpublish')}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'unpublish'
                                ? 'bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white shadow-lg shadow-dcs-purple/30'
                                : 'bg-dcs-dark-gray text-dcs-text-gray hover:text-white border border-white/10'
                                }`}
                        >
                            Unpublish Requests ({unpublishRequests.length})
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dcs-purple"></div>
                    </div>
                ) : currentRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-dcs-dark-gray/50 rounded-2xl border border-dcs-purple/20">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-dcs-text-gray text-lg">No pending {activeTab} requests</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentRequests.map(renderCourseCard)}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && selectedCourse && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
                    onClick={closeModal}
                >
                    <div
                        className="bg-dcs-dark-gray rounded-t-2xl sm:rounded-2xl border border-dcs-purple/30 w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg sm:text-2xl font-bold text-white">
                                {modalAction === 'review'
                                    ? 'Review Course'
                                    : modalAction === 'approve'
                                        ? 'Approve Request'
                                        : 'Disapprove Request'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-dcs-text-gray hover:text-white text-3xl leading-none transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                            <h3 className="text-xl font-bold text-white">{selectedCourse.title}</h3>

                            {modalAction === 'review' && (
                                <div className="space-y-6">
                                    {selectedContent ? (
                                        <div className="space-y-6">
                                            <button
                                                onClick={() => setSelectedContent(null)}
                                                className="flex items-center gap-2 text-dcs-purple hover:text-dcs-electric-indigo font-semibold transition-all mb-4"
                                            >
                                                ← Back to Course Overview
                                            </button>
                                            <AdminContentViewer content={selectedContent} />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Course Metadata Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-dcs-black/30 p-6 rounded-2xl border border-white/5">
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-dcs-text-gray uppercase tracking-wider mb-1">Price</h4>
                                                        <p className="text-xl font-bold text-dcs-purple">${selectedCourse.price} {selectedCourse.currency}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-dcs-text-gray uppercase tracking-wider mb-1">Difficulty</h4>
                                                        <p className="text-white font-medium">{selectedCourse.difficultyLevel || 'Not set'}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-dcs-text-gray uppercase tracking-wider mb-1">Estimated Duration</h4>
                                                        <p className="text-white font-medium">{selectedCourse.estimatedDurationHours ? `${selectedCourse.estimatedDurationHours} hours` : 'Not set'}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-dcs-text-gray uppercase tracking-wider mb-1">Slug</h4>
                                                        <p className="text-white font-mono text-sm">{selectedCourse.slug}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Short Description */}
                                            {selectedCourse.shortDescription && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-dcs-purple uppercase tracking-wider mb-2">Short Description</h4>
                                                    <p className="text-dcs-text-gray leading-relaxed italic">{selectedCourse.shortDescription}</p>
                                                </div>
                                            )}

                                            {/* Description */}
                                            <div>
                                                <h4 className="text-sm font-bold text-dcs-purple uppercase tracking-wider mb-2">Full Description</h4>
                                                <p className="text-dcs-text-gray leading-relaxed whitespace-pre-line">{selectedCourse.description}</p>
                                            </div>

                                            {/* Requirements & Target Audience */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {selectedCourse.requirements && (
                                                    <div>
                                                        <h4 className="text-sm font-bold text-dcs-purple uppercase tracking-wider mb-2">Requirements</h4>
                                                        <p className="text-dcs-text-gray text-sm whitespace-pre-line">{selectedCourse.requirements}</p>
                                                    </div>
                                                )}
                                                {selectedCourse.targetAudience && (
                                                    <div>
                                                        <h4 className="text-sm font-bold text-dcs-purple uppercase tracking-wider mb-2">Target Audience</h4>
                                                        <p className="text-dcs-text-gray text-sm whitespace-pre-line">{selectedCourse.targetAudience}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Course Structure */}
                                            <div>
                                                <h4 className="text-sm font-bold text-dcs-purple uppercase tracking-wider mb-3">Course Structure (Click items to preview)</h4>
                                                <div className="space-y-4">
                                                    {selectedCourse.modules?.map((module, idx) => (
                                                        <div key={module.id} className="bg-dcs-black/50 rounded-xl p-4 border border-white/5">
                                                            <h5 className="font-bold text-white mb-2">Module {idx + 1}: {module.title}</h5>
                                                            {module.description && (
                                                                <p className="text-sm text-dcs-text-gray mb-3">{module.description}</p>
                                                            )}
                                                            <ul className="space-y-2">
                                                                {module.contentItems?.map(item => (
                                                                    <li
                                                                        key={item.id}
                                                                        onClick={() => setSelectedContent(item)}
                                                                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-dcs-light-gray/20 hover:bg-dcs-purple/20 border border-transparent hover:border-dcs-purple/30 cursor-pointer transition-all group"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.contentType === 'VIDEO' ? 'bg-blue-500/20 text-blue-400' :
                                                                                item.contentType === 'ARTICLE' ? 'bg-green-500/20 text-green-400' :
                                                                                    'bg-purple-500/20 text-purple-400'
                                                                                }`}>
                                                                                {item.contentType}
                                                                            </span>
                                                                            <span className="text-sm text-white font-medium group-hover:text-dcs-purple transition-colors">{item.title}</span>
                                                                        </div>
                                                                        <span className="text-xs text-dcs-text-gray group-hover:text-dcs-purple transition-colors">Preview →</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {modalAction === 'approve' && (
                                <div className="space-y-4">
                                    <p className="text-white">
                                        Are you sure you want to approve this {activeTab} request?
                                    </p>
                                    {activeTab === 'publish' && (
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                            <p className="text-sm text-green-400">
                                                ✓ The course will be published and visible to all users.
                                            </p>
                                        </div>
                                    )}
                                    {activeTab === 'unpublish' && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                                            <p className="text-sm text-yellow-400">
                                                ⚠ The course will be unpublished and hidden from the marketplace. Enrolled students will still have access.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalAction === 'disapprove' && (
                                <div className="space-y-4">
                                    <p className="text-white font-medium">Please provide a reason for disapproval:</p>
                                    <textarea
                                        value={disapprovalReason}
                                        onChange={(e) => setDisapprovalReason(e.target.value)}
                                        rows={6}
                                        placeholder="Enter reason for disapproval..."
                                        className="w-full px-4 py-3 bg-dcs-black border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-dcs-purple focus:ring-1 focus:ring-dcs-purple focus:outline-none transition-all"
                                    />
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                        <p className="text-sm text-blue-400">
                                            ℹ The instructor will receive this message in their inbox.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2.5 bg-dcs-light-gray hover:bg-dcs-light-gray/80 text-white font-semibold rounded-xl transition-all border border-white/10"
                            >
                                Cancel
                            </button>
                            {modalAction === 'approve' && (
                                <button
                                    onClick={handleApprove}
                                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20"
                                >
                                    Confirm Approval
                                </button>
                            )}
                            {modalAction === 'disapprove' && (
                                <button
                                    onClick={handleDisapprove}
                                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/20"
                                >
                                    Confirm Disapproval
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Admin Content Viewer Sub-components
const AdminContentViewer = ({ content }) => {
    if (content.contentType === 'VIDEO') {
        return <AdminVideoPlayer content={content} />;
    }
    if (content.contentType === 'ARTICLE') {
        return <AdminArticleViewer content={content} />;
    }
    if (content.contentType === 'ASSESSMENT') {
        return <AdminAssessmentViewer content={content} />;
    }
    return null;
};

const AdminVideoPlayer = ({ content }) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!content.videoUrl) {
            setError(true);
            setLoading(false);
            return;
        }

        fetch(getServerUrl(content.videoUrl), { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error('Video not accessible');
                return res.blob();
            })
            .then(blob => {
                setVideoUrl(URL.createObjectURL(blob));
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });

        return () => {
            if (videoUrl) URL.revokeObjectURL(videoUrl);
        };
    }, [content.id]);

    return (
        <div className="space-y-4">
            <h5 className="text-lg sm:text-xl font-bold text-white">{content.title}</h5>
            {content.description && <p className="text-dcs-text-gray text-sm sm:text-base">{content.description}</p>}

            {loading ? (
                <div className="aspect-video bg-dcs-black rounded-xl flex items-center justify-center border border-white/5">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dcs-purple"></div>
                </div>
            ) : error ? (
                <div className="aspect-video bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                    <p className="text-red-400">⚠️ Video file could not be loaded</p>
                </div>
            ) : (
                <div className="rounded-xl overflow-hidden border border-dcs-purple/20 bg-black">
                    <video controls className="w-full aspect-video" src={videoUrl} />
                </div>
            )}
        </div>
    );
};

const AdminArticleViewer = ({ content }) => {
    const [fileUrl, setFileUrl] = useState('');
    const [fileType, setFileType] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (content.articleFileUrl) {
            const extension = content.articleFileUrl.split('.').pop().toLowerCase();
            setFileType(extension);

            const url = content.articleFileUrl.replace('/download/', '/view/');

            fetch(getServerUrl(url), { credentials: 'include' })
                .then(res => {
                    if (!res.ok) throw new Error('File not accessible');
                    return res.blob();
                })
                .then(blob => {
                    setFileUrl(URL.createObjectURL(blob));
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to load article file:', err);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }

        return () => {
            if (fileUrl) URL.revokeObjectURL(fileUrl);
        };
    }, [content.id]);

    return (
        <div className="space-y-4">
            <h5 className="text-lg sm:text-xl font-bold text-white">{content.title}</h5>
            {content.description && <p className="text-dcs-text-gray text-sm sm:text-base">{content.description}</p>}

            <div className="bg-dcs-black/50 border border-white/5 rounded-2xl p-4 sm:p-6">
                {content.articleContent && (
                    <div
                        className="prose prose-invert max-w-none text-dcs-text-gray mb-6"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.articleContent) }}
                    />
                )}

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dcs-purple"></div>
                    </div>
                ) : fileUrl && (
                    <div className="mt-4">
                        {fileType === 'pdf' ? (
                            <iframe
                                src={fileUrl}
                                className="w-full h-[50vh] sm:h-[600px] border border-white/10 rounded-xl bg-white"
                                title="File Preview"
                            />
                        ) : (
                            <img src={fileUrl} alt="Preview" className="max-w-full rounded-xl border border-white/10" />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminAssessmentViewer = ({ content }) => {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h5 className="text-lg sm:text-xl font-bold text-white">{content.title}</h5>
                    {content.description && <p className="text-dcs-text-gray mt-1 text-sm sm:text-base">{content.description}</p>}
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <span className="px-3 py-1 bg-dcs-purple/20 text-dcs-purple rounded-full text-xs font-bold border border-dcs-purple/30 whitespace-nowrap">
                        {content.questions?.length || 0} Questions
                    </span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30 whitespace-nowrap">
                        Pass: {content.assessmentPassPercentage}%
                    </span>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                {content.questions?.map((q, idx) => (
                    <div key={q.id} className="bg-dcs-black/50 border border-white/5 rounded-xl p-5 space-y-3">
                        <div className="flex justify-between">
                            <p className="font-bold text-white">Q{idx + 1}: {q.questionText}</p>
                            <span className="text-xs text-dcs-text-gray uppercase">{q.questionType}</span>
                        </div>

                        {q.questionType === 'MCQ' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {['A', 'B', 'C', 'D'].map(opt => (
                                    q[`option${opt}`] && (
                                        <div
                                            key={opt}
                                            className={`p-3 rounded-lg text-sm border ${q.correctAnswer === opt
                                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                : 'bg-dcs-light-gray/20 border-white/5 text-dcs-text-gray'
                                                }`}
                                        >
                                            <span className="font-bold mr-2">{opt}.</span> {q[`option${opt}`]}
                                            {q.correctAnswer === opt && <span className="ml-2 font-bold">(Correct)</span>}
                                        </div>
                                    )
                                ))}
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                {['TRUE', 'FALSE'].map(val => (
                                    <div
                                        key={val}
                                        className={`px-6 py-2 rounded-lg text-sm border font-bold ${q.correctAnswer === val
                                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                            : 'bg-dcs-light-gray/20 border-white/5 text-dcs-text-gray'
                                            }`}
                                    >
                                        {val} {q.correctAnswer === val && '✓'}
                                    </div>
                                ))}
                            </div>
                        )}

                        {q.explanation && (
                            <div className="mt-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                                <p className="text-xs text-blue-400"><span className="font-bold uppercase mr-2">Explanation:</span> {q.explanation}</p>
                            </div>
                        )}
                    </div>
                ))}

                {(!content.questions || content.questions.length === 0) && (
                    <div className="p-8 text-center bg-dcs-black/30 rounded-xl border border-dashed border-white/10">
                        <p className="text-dcs-text-gray italic">No questions added to this assessment yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminApprovalDashboard;
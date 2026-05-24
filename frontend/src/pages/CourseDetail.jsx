import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../api/courseService';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { showSuccess, showError } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { couponService } from '../api/couponService';
import { formatIndianCurrency } from '../utils/currency';
import { paymentService } from '../api/paymentService';

function CourseVoiceOver({ text }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState('speechSynthesis' in window);
  const utteranceRef = useRef(null);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const handlePlay = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-US' && v.localService);
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  if (!supported) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-dcs-dark-gray/50 border border-dcs-purple/20 rounded-xl mb-10">
      <button onClick={handlePlay}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-lg font-semibold hover:opacity-90 transition-all text-sm whitespace-nowrap">
        {speaking ? (
          <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>Stop</>
        ) : (
          <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>Listen</>
        )}
      </button>
      {speaking && (
        <div className="flex gap-1 items-end h-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-1 bg-dcs-purple rounded-full animate-bounce"
              style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}
      <p className="text-dcs-text-gray text-xs">Voice-over of course description</p>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const data = await courseService.getCourseById(id);
      setCourse(data.course);
    } catch (err) {
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      const orderData = await paymentService.createOrder(id, couponResult ? couponCode : null);
      console.log('Order data received:', orderData);
      console.log('Free?:', orderData.free);
      console.log('User:', user?.firstName, user?.email);
      console.log('Course title:', course.title);
      console.log('Razorpay available:', typeof window.Razorpay);

      // Free course
      if (orderData.free) {
        showSuccess('Enrolled successfully!');
        fetchCourse();
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Data Centre Skills',
        description: course.title,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              courseId: id,
              couponId: orderData.couponId,
            });
            showSuccess('Payment successful! You are now enrolled.');
            fetchCourse();
          } catch (err) {
            showError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
        },
        theme: { color: '#9D50BB' },
        modal: {
          ondismiss: () => {
            setEnrolling(false);
          },
        },
      };

      if (typeof window.Razorpay === 'undefined') {
        showError('Payment requires an internet connection.');
        setEnrolling(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        showError(`Payment failed: ${response.error.description}`);
        setEnrolling(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Full error:', err);
      console.error('Error message:', err.message);
      showError(err.response?.data?.error?.message || 'Enrollment failed');
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    navigate(`/learn/${id}`);
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading course details..." />;
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-xl">{error || 'Course not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dcs-black text-white font-sans selection:bg-dcs-purple selection:text-white pb-12">
      <Navbar />

      {/* Hero Section - Modern & Spacious */}
      <div className="relative pt-12 pb-16 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-dcs-dark-gray"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-dcs-purple/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-dcs-electric-indigo/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm font-medium">
              <span
                onClick={() => navigate('/courses')}
                className="text-dcs-purple hover:text-white cursor-pointer transition-colors duration-200"
              >
                Courses
              </span>
              <span className="text-dcs-text-gray/50">/</span>
              <span className="text-dcs-text-gray truncate max-w-[300px]">{course.title}</span>
            </div>

            {/* Title & Description */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                {course.title}
              </h1>
              <p className="text-xl text-dcs-text-gray leading-relaxed max-w-3xl font-light">
                {course.shortDescription || course.description?.substring(0, 150) + '...'}
              </p>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {course.difficultyLevel && (
                <span className="bg-dcs-purple/10 text-dcs-purple px-4 py-1.5 rounded-full font-medium border border-dcs-purple/20 backdrop-blur-sm">
                  {course.difficultyLevel}
                </span>
              )}

              <div className="flex items-center gap-6 text-dcs-text-gray/80 font-medium">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-dcs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {(() => {
                    if (course.estimatedDurationHours) {
                      return <span>{course.estimatedDurationHours} hours</span>;
                    }
                    const totalSeconds = course.modules?.reduce((acc, m) =>
                      acc + (m.contentItems?.reduce((a, item) =>
                        item.contentType === 'VIDEO' ? a + (item.videoDurationSeconds || 0) : a, 0) || 0), 0) || 0;
                    const hours = Math.ceil(totalSeconds / 3600);
                    return <span>{hours || '< 1'} hours {!course.estimatedDurationHours && totalSeconds > 0 ? '(auto)' : ''}</span>;
                  })()}
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-dcs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Updated {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-dcs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span>English</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left Column: Course Details */}
          <div className="lg:col-span-2 space-y-12 pt-8">

            {/* What you'll learn */}
            <div className="border border-dcs-purple/10 p-8 mt-8 rounded-2xl bg-dcs-light-gray/30 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <span>What this course includes:</span>
                <div className="h-px flex-1 bg-gradient-to-r from-dcs-purple/30 to-transparent"></div>
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {course.courseIncludes?.split('\n').filter(line => line.trim()).map((item, index) => (
                  <li key={index} className="flex items-start gap-3 group">
                    <div className="mt-1 w-5 h-5 rounded-full bg-dcs-purple/10 flex items-center justify-center flex-shrink-0 group-hover:bg-dcs-purple/20 transition-colors">
                      <svg className="w-3 h-3 text-dcs-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-dcs-text-gray group-hover:text-white transition-colors duration-300 text-sm leading-relaxed">{item.trim()}</span>
                  </li>
                )) || <div className="text-dcs-text-gray italic">No specific learning outcomes listed.</div>}
              </ul>
            </div>

            {/* Course Content Accordion */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Course Content</h2>
              <div className="flex items-center justify-between text-sm text-dcs-text-gray mb-4 font-medium">
                <span>
                  {course.modules?.length || 0} sections • {course.modules?.reduce((acc, m) => acc + (m.contentItems?.length || 0), 0) || 0} lectures
                </span>
                <button
                  onClick={() => {
                    if (expandedModules.size === course.modules.length) {
                      setExpandedModules(new Set());
                    } else {
                      setExpandedModules(new Set(course.modules.map(m => m.id)));
                    }
                  }}
                  className="text-dcs-purple hover:text-dcs-electric-indigo transition-colors"
                >
                  {expandedModules.size === course.modules.length ? 'Collapse all' : 'Expand all'}
                </button>
              </div>

              <div className="border border-dcs-purple/10 rounded-xl overflow-hidden bg-dcs-dark-gray/50 backdrop-blur-sm">
                {course.modules?.map((module, index) => (
                  <div key={module.id} className="group border-b border-dcs-purple/5 last:border-0">
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full flex items-center justify-between p-5 hover:bg-dcs-light-gray/30 transition-all duration-200 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full bg-dcs-black/50 text-dcs-purple transition-all duration-300 ${expandedModules.has(module.id) ? 'rotate-180 bg-dcs-purple/10' : ''}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                        <div>
                          <h3 className="text-white font-semibold text-base group-hover:text-dcs-purple transition-colors">
                            {module.title}
                          </h3>
                        </div>
                      </div>
                      <span className="text-xs text-dcs-text-gray/70">
                        {module.contentItems?.length || 0} lectures
                      </span>
                    </button>

                    {/* Module Content */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedModules.has(module.id) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="bg-dcs-black/20 p-5 pt-2 border-t border-dcs-purple/5">
                        {module.description && (
                          <p className="text-sm text-dcs-text-gray mb-4 italic pl-10 border-l-2 border-dcs-purple/20">{module.description}</p>
                        )}
                        <ul className="space-y-1">
                          {module.contentItems?.map((item) => (
                            <li key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-dcs-purple/5 transition-colors group/item cursor-default">
                              <div className="flex items-center gap-4 text-dcs-text-gray group-hover/item:text-white transition-colors">
                                <span className="text-dcs-purple/70 group-hover/item:text-dcs-purple">
                                  {item.contentType === 'VIDEO' && (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                  )}
                                  {item.contentType === 'ARTICLE' && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  )}
                                  {item.contentType === 'ASSESSMENT' && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                  )}
                                </span>
                                <span className="text-sm">{item.title}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-invert prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-white mb-6">Description</h2>
              <div className="text-dcs-text-gray leading-loose text-base whitespace-pre-wrap">
                {course.description}
              </div>
            </div>

            {/* Requirements & Target Audience Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Requirements */}
              {course.requirements && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Requirements</h3>
                  <ul className="space-y-2">
                    {course.requirements.split('\n').filter(line => line.trim()).map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-dcs-text-gray text-sm">
                        <span className="text-dcs-purple mt-1">•</span>
                        <span>{item.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Target Audience */}
              {course.targetAudience && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Who this course is for</h3>
                  <ul className="space-y-2">
                    {course.targetAudience.split('\n').filter(line => line.trim()).map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-dcs-text-gray text-sm">
                        <span className="text-dcs-purple mt-1">•</span>
                        <span>{item.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Sticky Sidebar - Floating Glass Effect */}
          <div className="lg:col-span-1 relative">
            <div className="sticky top-24">
              <div className="bg-dcs-dark-gray/90 backdrop-blur-xl border border-dcs-purple/20 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl z-5 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(157,80,187,0.15)] hover:border-dcs-purple/30">

                {/* Voice-over / Preview */}
                {!course.isPurchased && course.description && (
                  <CourseVoiceOver text={course.description} />
                )}

                {/* Preview Image / Placeholder 
                <div className="aspect-video bg-dcs-black/50 rounded-xl mb-6 flex items-center justify-center border border-dcs-purple/10 overflow-hidden relative group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-tr from-dcs-purple/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl border border-white/10">
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>*/}

                {course.isPurchased ? (
                  <div>
                    <div className="flex items-center gap-3 text-green-400 font-bold mb-6 bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span>You are enrolled</span>
                    </div>

                    {course.enrollment?.progressPercentage !== undefined && (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2 text-dcs-text-gray font-medium">
                          <span>Course Progress</span>
                          <span className="text-white">{parseFloat(course.enrollment.progressPercentage).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-dcs-black/50 rounded-full h-2 overflow-hidden border border-white/5">
                          <div
                            className="bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(157,80,187,0.6)]"
                            style={{ width: `${course.enrollment.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleStartLearning}
                      className="w-full py-4 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-xl font-bold hover:shadow-[0_4px_20px_rgba(157,80,187,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Continue Learning
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-end gap-3 pb-4 border-b border-dcs-purple/10">
                      <span className="text-5xl font-extrabold text-white tracking-tight">
                        ₹{couponResult ? couponResult.finalPrice : formatIndianCurrency(course.price)}
                      </span>
                      {couponResult && (
                        <div className="flex flex-col mb-1">
                          <span className="text-base text-dcs-text-gray line-through decoration-dcs-purple/50 decoration-2">
                            ₹{couponResult.originalPrice}
                          </span>
                          <span className="text-sm text-dcs-purple font-semibold">
                            {couponResult.discountType === 'PERCENTAGE' ? `${couponResult.discountValue}% Discount` : `₹${couponResult.discountValue} off`}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full py-4 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-xl font-bold text-lg hover:shadow-[0_0_25px_rgba(157,80,187,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                      {enrolling ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enrolling...
                        </span>
                      ) : (
                        'Enroll Now'
                      )}
                    </button>
                    {!course.isPurchased && course.price > 0 && (
                      <div className="mt-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Coupon code"
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value); setCouponResult(null); setCouponError(''); }}
                            className="flex-1 px-4 py-2 bg-dcs-black border border-white/10 rounded-lg text-white placeholder:text-dcs-text-gray focus:border-dcs-purple focus:outline-none"
                          />
                          <button
                            onClick={async () => {
                              if (!couponCode.trim()) return;
                              setCouponLoading(true);
                              setCouponError('');
                              try {
                                const result = await couponService.validate(couponCode, course.id);
                                setCouponResult(result);
                              } catch (err) {
                                setCouponError(err.response?.data?.error?.message || 'Invalid coupon');
                              } finally {
                                setCouponLoading(false);
                              }
                            }}
                            disabled={couponLoading}
                            className="px-4 py-2 bg-dcs-purple rounded-lg text-white font-semibold hover:bg-dcs-electric-indigo transition-colors disabled:opacity-50"
                          >
                            {couponLoading ? 'Checking...' : 'Apply'}
                          </button>
                        </div>
                        {couponError && <p className="text-red-400 text-sm mt-1">{couponError}</p>}
                        {couponResult && (
                          <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-green-400 text-sm font-semibold">
                              Coupon applied! {couponResult.discountType === 'PERCENTAGE' ? `${couponResult.discountValue}% off` : `₹${couponResult.discountValue} off`}
                            </p>
                            <p className="text-white text-sm">
                              Final price: <span className="line-through text-dcs-text-gray">₹{formatIndianCurrency(couponResult.originalPrice)}</span> ₹{formatIndianCurrency(couponResult.finalPrice)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2 text-xs text-dcs-text-gray">
                      <svg className="w-4 h-4 text-dcs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      30-Day Money-Back Guarantee
                    </div>

                    <div className="space-y-4 pt-2">
                      <h4 className="text-white font-semibold text-sm">This course includes:</h4>
                      <ul className="space-y-3 text-sm text-dcs-text-gray/90">
                        <li className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-dcs-purple/10 text-dcs-purple">📺</span>
                          {(() => {
                            if (course.estimatedDurationHours) {
                              return <span>{course.estimatedDurationHours} hours</span>;
                            }
                            const totalSeconds = course.modules?.reduce((acc, m) =>
                              acc + (m.contentItems?.reduce((a, item) =>
                                item.contentType === 'VIDEO' ? a + (item.videoDurationSeconds || 0) : a, 0) || 0), 0) || 0;
                            const hours = Math.ceil(totalSeconds / 3600);
                            return <span>{hours || '< 1'} hours {!course.estimatedDurationHours && totalSeconds > 0 ? '(auto)' : ''}</span>;
                          })()}
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-dcs-purple/10 text-dcs-purple">♾️</span>
                          <span>Full lifetime access</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-dcs-purple/10 text-dcs-purple">🏆</span>
                          <span>Certificate of completion</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
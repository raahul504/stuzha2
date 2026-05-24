import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // console.log('Home render:', { user, isAuthenticated, loading });
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-dcs-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dcs-black">
        <Navbar />
        <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-8" style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1a0a2e 100%)', minHeight: "20vh" }}>
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl mt-10 mb-6" style={{ background: 'linear-gradient(135deg, #FFFFFF, #9D50BB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Welcome to <span className="text-dcs-purple">Data Center Skills</span>
              </h1>
              <p className="text-base sm:text-lg text-dcs-text-gray mb-8 sm:mb-10">
                Transform your career with our comprehensive learning management system.
                Access expert-led courses and advance your skills.
              </p>
              <p className="text-lg text-dcs-text-gray mb-5">
                Need help finding your perfect course? Connect with our Free AI career consultant.
              </p>
              <button
                onClick={() => navigate('/courses', { state: { openAdvisor: true } })}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2 mb-8 sm:mb-10 text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Get AI Career Advice
              </button>
              <div className="flex flex-wrap gap-6 sm:gap-12">
                <div>
                  <h2 className="text-2xl sm:text-3xl text-dcs-purple mb-2">100+</h2>
                  <p className="text-dcs-text-gray">Courses Available</p>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl text-dcs-purple mb-2">24/7</h2>
                  <p className="text-dcs-text-gray">Access Anytime</p>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl text-dcs-purple mb-2">Expert</h2>
                  <p className="text-dcs-text-gray">Instructors</p>
                </div>
              </div>
            </div>
            {/*<div className="card" >
              <h3 className="text-white mb-6 text-xl font-bold">Platform Highlights</h3>
              <ul className="list-none text-white leading-8 space-y-2 font-semibold">
                <li>✓ Comprehensive Course Library</li>
                <li>✓ Expert Instructors</li>
                <li>✓ Interactive Learning Experience</li>
                <li>✓ Progress Tracking</li>
                <li>✓ Certificates on Completion</li>
              </ul>
            </div>*/}
          </div>
        </section>

        <section className="max-w-[1400px] mx-auto bg-dcs-dark-gray" style={{ padding: '3rem 1rem' }}>
          <h2 className="section-title text-xl sm:text-2xl lg:text-[2.5rem]">
            Why Choose <span className="purple-text">Our Platform?</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            <div className="card">
              <h3 className="text-dcs-purple mb-4 text-xl">🎓 Expert Faculty</h3>
              <p className="text-dcs-text-gray">
                Learn from industry veterans and professionals with real-world expertise.
              </p>
            </div>
            <div className="card">
              <h3 className="text-dcs-purple mb-4 text-xl">💼 Career Support</h3>
              <p className="text-dcs-text-gray">
                Comprehensive career guidance and resources to help you succeed.
              </p>
            </div>
            <div className="card">
              <h3 className="text-dcs-purple mb-4 text-xl">🔧 Hands-on Training</h3>
              <p className="text-dcs-text-gray">
                Over 50% experiential learning with real-world projects and exercises.
              </p>
            </div>
          </div>
        </section>
        {/* Our Vision Section */}
        <section className="vision-section bg-dcs-black" style={{ padding: '6rem 2rem' }}>
          <div className="vision-container">
            <h2 className="section-title-custom">
              Our <span className="purple-text">Vision</span>
            </h2>
            <p className="vision-text">
              <strong>Empower every learner to achieve excellence through innovative education.</strong><br /><br />
              In the process, we enable, equip and encourage learning beyond conventional limits.
            </p>
          </div>
        </section>

        {/* Our Core Domains Section */}
        <section className="core-domains-section bg-dcs-dark-gray" style={{ padding: '6rem 2rem' }}>
          <div className="domains-container">
            <h2 className="section-title-custom">
              Our <span className="purple-text">Core Domains</span>
            </h2>
            <div className="domains-grid">
              <div className="domain-card">
                <div className="domain-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                </div>
                <h3>Enterprise Technologies</h3>
                <p>Comprehensive solutions designed for enterprise-scale operations with plug-and-play deployment and seamless integration.</p>
              </div>
              <div className="domain-card">
                <div className="domain-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="8" rx="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" />
                    <path d="M6 6h.01M6 18h.01" />
                  </svg>
                </div>
                <h3>Cloud Services</h3>
                <p>Scalable cloud infrastructure and migration services designed to build towards exponential business growth.</p>
              </div>
              <div className="domain-card">
                <div className="domain-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h3>Gen AI Solutions</h3>
                <p>Cutting-edge AI and machine learning products revolutionizing education. Advanced artificial intelligence capabilities tailored for modern learning.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Team Section */}
        <section className="team-section bg-dcs-black" style={{ padding: '6rem 2rem' }}>
          <div className="team-container-custom">
            <h2 className="section-title-custom">
              Our <span className="purple-text">Team</span>
            </h2>

            <div className="team-content-custom">
              <div className="team-vision-custom">
                <h3>Leadership Vision</h3>
                <p>Our Leadership Team's core vision is to build solutions that empower learners to achieve their full potential and unlock unlimited opportunities.</p>
                <p>We press for every action to be viewed through a leadership lens. We achieve this by the right level of investment to impart knowledge that nourishes minds to think relevant, new and ahead of time.</p>
                <p>We are a strong team of experts working consistently to build cutting-edge educational products and learning solutions. Completely focused on the core objective, we aim to enable our global students towards their success.</p>
                <p><strong>Our operations are currently spanned across multiple regions, with dedicated support available 24/7.</strong></p>
              </div>
              <div className="team-stats-custom">
                <div className="stat-card-custom">
                  <div className="stat-number-custom">100+</div>
                  <div className="stat-label-custom">Courses Available</div>
                </div>
                <div className="stat-card-custom">
                  <div className="stat-number-custom">10,000+</div>
                  <div className="stat-label-custom">Active Learners</div>
                </div>
                <div className="stat-card-custom">
                  <div className="stat-number-custom">50+</div>
                  <div className="stat-label-custom">Expert Instructors</div>
                </div>
                <div className="stat-card-custom">
                  <div className="stat-number-custom">95%</div>
                  <div className="stat-label-custom">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section className="about-section bg-dcs-dark-gray" style={{ padding: '6rem 2rem' }}>
          <div className="about-container">
            <h2 className="section-title-custom">
              About <span className="purple-text">Our Platform</span>
            </h2>
            <p className="about-text">
              Our strategic intent is to lead the market by ideating structured learning processes to stay ahead of the curve, in terms of educational innovation and technology solutions.<br /><br />
              Our focus and services are connected strongly to our core domains: <strong>Enterprise Learning, Cloud Infrastructure, and AI-Powered Education.</strong><br /><br />
              And as a result, <strong>"We build Learning Solutions For Life".</strong>
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dcs-black">
      <Navbar />
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-8" style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #291048ff 100%)', minHeight: "20vh" }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-12 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold mt-2 leading-normal" style={{ background: 'linear-gradient(135deg, #FFFFFF, #9D50BB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              DATA CENTRE SKILLS
            </h1>
            <h1 className="text-3xl sm:text-3xl lg:text-4xl mt-7 mb-3 leading-normal" style={{ background: 'linear-gradient(135deg, #FFFFFF, #9D50BB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Welcome back, <span className="text-dcs-purple">{user?.firstName}</span>
            </h1>
            <p className="text-md sm:text-md lg:text-lg text-dcs-text-gray mb-7">
              Continue your learning journey. Explore new courses and track your progress.
            </p>
            <p className="text-md sm:text-md lg:text-lg text-dcs-text-gray mb-4">
              Need help finding your perfect course? Connect with our Free AI career consultant.
            </p>
            <button
              onClick={() => navigate('/courses', { state: { openAdvisor: true } })}
              className="px-8 py-4 bg-gradient-to-r from-dcs-purple to-dcs-electric-indigo text-white rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Get AI Career Advice
            </button>

            <div className="flex flex-wrap gap-6 sm:gap-12 mt-10 sm:mt-10 lg:mt-15">
              <div>
                <h2 className="text-2xl sm:text-3xl text-dcs-purple mb-2">100+</h2>
                <p className="text-dcs-text-gray">Courses Available</p>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl text-dcs-purple mb-2">24/7</h2>
                <p className="text-dcs-text-gray">Access Anytime</p>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl text-dcs-purple mb-2">Expert</h2>
                <p className="text-dcs-text-gray">Instructors</p>
              </div>
            </div>
          </div>
          {/*<div className="card">
            <h3 className="text-white mb-6 text-xl font-semibold">Quick Actions</h3>
            <ul className="list-none text-gray leading-8 space-y-2">
              <li>✓ View My Courses</li>
              <li>✓ Browse Catalog</li>
              <li>✓ Track Progress</li>
              <li>✓ Update Profile</li>
            </ul>
          </div>*/}
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto bg-dcs-dark-gray" style={{ padding: '3rem 1rem' }}>
        <h2 className="section-title text-xl sm:text-2xl lg:text-[2.5rem]">
          Your <span className="purple-text">Learning Path</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
          <div className="card bg-dcs-black">
            <h3 className="text-dcs-purple mb-4 text-xl">📚 My Courses</h3>
            <p className="text-dcs-text-gray mb-4">
              Continue learning from your enrolled courses.
            </p>
            <button
              onClick={() => navigate('/my-courses')}
              className="text-dcs-purple hover:text-dcs-electric-indigo transition-colors font-semibold"
            >
              View My Courses →
            </button>
          </div>
          <div className="card bg-dcs-black">
            <h3 className="text-dcs-purple mb-4 text-xl">🔍 Explore</h3>
            <p className="text-dcs-text-gray mb-4">
              Discover new courses and expand your skills.
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="text-dcs-purple hover:text-dcs-electric-indigo transition-colors font-semibold"
            >
              Browse All Courses →
            </button>
          </div>
          <div className="card bg-dcs-black">
            <h3 className="text-dcs-purple mb-4 text-xl">👤 Profile</h3>
            <p className="text-dcs-text-gray mb-4">
              Manage your account and preferences.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="text-dcs-purple hover:text-dcs-electric-indigo transition-colors font-semibold"
            >
              View Profile →
            </button>
          </div>
        </div>
      </section>
      {/* Our Vision Section */}
      <section className="vision-section bg-dcs-black" style={{ padding: '6rem 2rem' }}>
        <div className="vision-container">
          <h2 className="section-title-custom">
            Our <span className="purple-text">Vision</span>
          </h2>
          <p className="vision-text">
            <strong>Empower every learner to achieve excellence through innovative education.</strong><br /><br />
            In the process, we enable, equip and encourage learning beyond conventional limits.
          </p>
        </div>
      </section>

      {/* Our Core Domains Section */}
      <section className="core-domains-section bg-dcs-dark-gray" style={{ padding: '6rem 2rem' }}>
        <div className="domains-container">
          <h2 className="section-title-custom">
            Our <span className="purple-text">Core Domains</span>
          </h2>
          <div className="domains-grid">
            <div className="domain-card">
              <div className="domain-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              </div>
              <h3>Enterprise Technologies</h3>
              <p>Comprehensive solutions designed for enterprise-scale operations with plug-and-play deployment and seamless integration.</p>
            </div>
            <div className="domain-card">
              <div className="domain-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="8" rx="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" />
                  <path d="M6 6h.01M6 18h.01" />
                </svg>
              </div>
              <h3>Cloud Services</h3>
              <p>Scalable cloud infrastructure and migration services designed to build towards exponential business growth.</p>
            </div>
            <div className="domain-card">
              <div className="domain-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3>Gen AI Solutions</h3>
              <p>Cutting-edge AI and machine learning products revolutionizing education. Advanced artificial intelligence capabilities tailored for modern learning.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="team-section" style={{ padding: '6rem 2rem', background: '#0A0A0A' }}>
        <div className="team-container-custom">
          <h2 className="section-title-custom">
            Our <span className="purple-text">Team</span>
          </h2>

          <div className="team-content-custom">
            <div className="team-vision-custom">
              <h3>Leadership Vision</h3>
              <p>Our Leadership Team's core vision is to build solutions that empower learners to achieve their full potential and unlock unlimited opportunities.</p>
              <p>We press for every action to be viewed through a leadership lens. We achieve this by the right level of investment to impart knowledge that nourishes minds to think relevant, new and ahead of time.</p>
              <p>We are a strong team of experts working consistently to build cutting-edge educational products and learning solutions. Completely focused on the core objective, we aim to enable our global students towards their success.</p>
              <p><strong>Our operations are currently spanned across multiple regions, with dedicated support available 24/7.</strong></p>
            </div>
            <div className="team-stats-custom">
              <div className="stat-card-custom">
                <div className="stat-number-custom">100+</div>
                <div className="stat-label-custom">Courses Available</div>
              </div>
              <div className="stat-card-custom">
                <div className="stat-number-custom">10,000+</div>
                <div className="stat-label-custom">Active Learners</div>
              </div>
              <div className="stat-card-custom">
                <div className="stat-number-custom">50+</div>
                <div className="stat-label-custom">Expert Instructors</div>
              </div>
              <div className="stat-card-custom">
                <div className="stat-number-custom">95%</div>
                <div className="stat-label-custom">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="about-section" style={{ padding: '6rem 2rem', background: '#121212' }}>
        <div className="about-container">
          <h2 className="section-title-custom">
            About <span className="purple-text">Our Platform</span>
          </h2>
          <p className="about-text">
            Our strategic intent is to lead the market by ideating structured learning processes to stay ahead of the curve, in terms of educational innovation and technology solutions.<br /><br />
            Our focus and services are connected strongly to our core domains: <strong>Enterprise Learning, Cloud Infrastructure, and AI-Powered Education.</strong><br /><br />
            And as a result, <strong>"We build Learning Solutions For Life".</strong>
          </p>
        </div>
      </section>
    </div>
  );
}
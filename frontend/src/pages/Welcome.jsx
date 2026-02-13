import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Animated Logo Component
const PayEngineLogo = ({ size = 48 }) => (
  <div style={{
    width: size,
    height: size,
    background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
    borderRadius: size * 0.25,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.35)',
  }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

// Feature Card Component
const FeatureCard = ({ icon, title, desc, delay }) => (
  <div className="feature-card" style={{ animationDelay: `${delay}ms` }}>
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

// Stat Counter Component
const StatItem = ({ value, label }) => (
  <div className="stat-item">
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
);

export default function Welcome() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: '📱', title: 'Instant Airtime', desc: 'Top up MTN, GLO, Airtel, 9mobile in seconds' },
    { icon: '📶', title: 'Cheap Data', desc: 'Best data prices across all networks' },
    { icon: '⚡', title: 'Pay Bills', desc: 'Electricity, cable TV, and more' },
    { icon: '🛡️', title: 'KYC Verification', desc: 'Verify NIN & BVN instantly' },
    { icon: '🤖', title: 'AI Assistant', desc: 'Chat to make transactions' },
    { icon: '💳', title: 'Virtual Account', desc: 'Fund wallet via bank transfer' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .welcome-page {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          background: #050508;
          color: #fff;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* Animated Background */
        .bg-gradient {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          animation: float 20s ease-in-out infinite;
        }

        .bg-orb-1 {
          width: 600px;
          height: 600px;
          background: #8B5CF6;
          top: -20%;
          left: -10%;
          opacity: 0.15;
        }

        .bg-orb-2 {
          width: 500px;
          height: 500px;
          background: #06B6D4;
          bottom: -10%;
          right: -10%;
          opacity: 0.12;
          animation-delay: -10s;
        }

        .bg-orb-3 {
          width: 400px;
          height: 400px;
          background: #D946EF;
          top: 40%;
          right: 20%;
          opacity: 0.08;
          animation-delay: -5s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(20px, 30px) scale(1.02); }
        }

        /* Grid Pattern */
        .bg-grid {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: 0;
          pointer-events: none;
        }

        /* Navigation */
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .nav.scrolled {
          background: rgba(5, 5, 8, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-brand-text {
          display: flex;
          flex-direction: column;
        }

        .nav-brand-name {
          font-size: 22px;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #A1A1AA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }

        .nav-brand-sub {
          font-size: 10px;
          color: #71717A;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .nav-btn {
          padding: 12px 28px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }

        /* Hero Section */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 120px 24px 80px;
          position: relative;
          z-index: 1;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 100px;
          margin-bottom: 32px;
          animation: fadeInUp 0.8s ease forwards;
        }

        .hero-badge-dot {
          width: 8px;
          height: 8px;
          background: #10B981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .hero-badge-text {
          font-size: 13px;
          color: #10B981;
          font-weight: 600;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        .hero-title {
          font-size: clamp(40px, 8vw, 72px);
          font-weight: 800;
          line-height: 1.05;
          margin-bottom: 24px;
          animation: fadeInUp 0.8s ease 0.1s forwards;
          opacity: 0;
        }

        .hero-title-gradient {
          background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #D946EF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% 200%;
          animation: gradientShift 5s ease infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .hero-subtitle {
          font-size: clamp(16px, 3vw, 20px);
          color: #A1A1AA;
          max-width: 600px;
          margin: 0 auto 48px;
          line-height: 1.7;
          animation: fadeInUp 0.8s ease 0.2s forwards;
          opacity: 0;
        }

        .hero-cta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          animation: fadeInUp 0.8s ease 0.3s forwards;
          opacity: 0;
        }

        .btn-primary {
          padding: 18px 48px;
          background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
          border: none;
          border-radius: 16px;
          color: #fff;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.35);
        }

        .btn-primary:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(139, 92, 246, 0.45);
        }

        .btn-primary svg {
          transition: transform 0.3s ease;
        }

        .btn-primary:hover svg {
          transform: translateX(4px);
        }

        .hero-cta-sub {
          font-size: 13px;
          color: #71717A;
        }

        .hero-cta-sub span {
          color: #10B981;
          font-weight: 600;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Stats Section */
        .stats {
          display: flex;
          justify-content: center;
          gap: 48px;
          padding: 60px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
          position: relative;
          z-index: 1;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-value {
          font-size: 36px;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stat-label {
          font-size: 14px;
          color: #71717A;
        }

        /* Features Section */
        .features {
          padding: 100px 24px;
          position: relative;
          z-index: 1;
        }

        .section-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .section-tag {
          display: inline-block;
          padding: 8px 20px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.25);
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          color: #8B5CF6;
          letter-spacing: 2px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: clamp(28px, 5vw, 42px);
          font-weight: 800;
          margin-bottom: 16px;
        }

        .section-desc {
          font-size: 17px;
          color: #A1A1AA;
          max-width: 500px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 32px;
          transition: all 0.4s ease;
          animation: fadeInUp 0.6s ease forwards;
          opacity: 0;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(139, 92, 246, 0.3);
          transform: translateY(-8px);
        }

        .feature-icon {
          font-size: 40px;
          margin-bottom: 20px;
        }

        .feature-card h3 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .feature-card p {
          font-size: 15px;
          color: #A1A1AA;
          line-height: 1.6;
        }

        /* AI Section */
        .ai-section {
          padding: 100px 24px;
          background: rgba(217, 70, 239, 0.03);
          border-top: 1px solid rgba(217, 70, 239, 0.1);
          border-bottom: 1px solid rgba(217, 70, 239, 0.1);
          position: relative;
          z-index: 1;
        }

        .ai-content {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .ai-demo {
          background: #0a0a0f;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        .ai-demo-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .ai-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #D946EF 0%, #8B5CF6 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .ai-demo-header-text h4 {
          font-size: 15px;
          font-weight: 700;
        }

        .ai-demo-header-text p {
          font-size: 12px;
          color: #71717A;
        }

        .ai-messages {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ai-msg {
          padding: 14px 18px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
          max-width: 85%;
          animation: msgSlide 0.5s ease forwards;
        }

        .ai-msg.bot {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          align-self: flex-start;
        }

        .ai-msg.user {
          background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
          align-self: flex-end;
        }

        @keyframes msgSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-text h2 {
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 800;
          margin-bottom: 20px;
        }

        .ai-text h2 span {
          background: linear-gradient(135deg, #D946EF 0%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .ai-text p {
          font-size: 17px;
          color: #A1A1AA;
          line-height: 1.8;
          margin-bottom: 28px;
        }

        .ai-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .ai-features li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
        }

        .ai-features li::before {
          content: '✓';
          width: 24px;
          height: 24px;
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        /* CTA Section */
        .cta {
          padding: 120px 24px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .cta-box {
          max-width: 700px;
          margin: 0 auto;
          padding: 60px 40px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 32px;
          position: relative;
          overflow: hidden;
        }

        .cta-box::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
          animation: rotateBg 20s linear infinite;
        }

        @keyframes rotateBg {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .cta-content {
          position: relative;
          z-index: 1;
        }

        .cta h2 {
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 800;
          margin-bottom: 16px;
        }

        .cta p {
          font-size: 17px;
          color: #A1A1AA;
          margin-bottom: 32px;
        }

        /* Footer */
        .footer {
          padding: 40px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
          z-index: 1;
        }

        .footer-content {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-brand-text {
          font-size: 18px;
          font-weight: 700;
        }

        .footer-brand-sub {
          font-size: 11px;
          color: #71717A;
          letter-spacing: 1px;
        }

        .footer-links {
          display: flex;
          gap: 32px;
        }

        .footer-links a {
          color: #71717A;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.3s;
          cursor: pointer;
        }

        .footer-links a:hover {
          color: #fff;
        }

        .footer-cac {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }

        .footer-cac-icon {
          font-size: 18px;
        }

        .footer-cac-text {
          font-size: 11px;
          color: #10B981;
          font-weight: 600;
        }

        .footer-cac-num {
          font-size: 10px;
          color: #71717A;
        }

        .footer-bottom {
          text-align: center;
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          color: #52525B;
          font-size: 13px;
        }

        /* Mobile Responsive */
        @media (max-width: 900px) {
          .ai-content {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .ai-demo { order: 1; }
          .ai-text { order: 0; text-align: center; }
          .ai-features { align-items: center; }
        }

        @media (max-width: 600px) {
          .nav { padding: 12px 16px; }
          .nav-brand-name { font-size: 18px; }
          .nav-btn { padding: 10px 20px; font-size: 13px; }
          .hero { padding: 100px 20px 60px; }
          .stats { gap: 32px; padding: 40px 20px; }
          .stat-value { font-size: 28px; }
          .features, .ai-section, .cta { padding: 60px 20px; }
          .footer-content { flex-direction: column; text-align: center; }
          .footer-links { flex-wrap: wrap; justify-content: center; gap: 20px; }
        }
      `}</style>

      <div className="welcome-page">
        {/* Animated Background */}
        <div className="bg-gradient">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
        </div>
        <div className="bg-grid" />

        {/* Navigation */}
        <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
          <div className="nav-brand">
            <PayEngineLogo size={42} />
            <div className="nav-brand-text">
              <span className="nav-brand-name">PayEngine</span>
              <span className="nav-brand-sub">by OneTap (ChiVera) </span>
            </div>
          </div>
          <button className="nav-btn" onClick={() => navigate('/auth')}>
            Sign In
          </button>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            <span className="hero-badge-text">CAC Registered · RC 9247692</span>
          </div>
          
          <h1 className="hero-title">
            VTU Payments Made<br />
            <span className="hero-title-gradient">Ridiculously Simple</span>
          </h1>
          
          <p className="hero-subtitle">
            PayEngine by OneTap — Nigeria's smartest VTU payment platform. Buy airtime, data, pay bills, 
            and verify KYC with one tap. Powered by AI for the fastest experience.
          </p>

          <div className="hero-cta">
            <button className="btn-primary" onClick={() => navigate('/auth')}>
              Get Started — It's Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <p className="hero-cta-sub">
              <span>✓</span> No fees to sign up · Instant wallet funding
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="stats">
          <StatItem value="30%+" label="Cheaper than most apps" />
          <StatItem value="99.9%" label="Uptime" />
          <StatItem value="<3s" label="Delivery Time" />
        </section>

        {/* Features */}
        <section className="features">
          <div className="section-header">
            <span className="section-tag">SERVICES</span>
            <h2 className="section-title">Everything in One App</h2>
            <p className="section-desc">All your digital payments, simplified and secured.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} delay={i * 100} />
            ))}
          </div>
        </section>

        {/* AI Section */}
        <section className="ai-section">
          <div className="ai-content">
            <div className="ai-text">
              <span className="section-tag">AI ASSISTANT</span>
              <h2>Meet <span>PAY ENGINE</span></h2>
              <p>
                Our highly trained AI model understands what you need. Just type "send 2GB MTN to 0801..." 
                and watch the magic happen. It's like having a personal assistant for all your payments.
              </p>
              <ul className="ai-features">
                <li>Friendly and Interactive AI Engine</li>
                <li>Instant transaction execution</li>
                <li>24/7 smart support</li>
                <li>Nigerian Pidgin supported 🇳🇬</li>
              </ul>
            </div>
            <div className="ai-demo">
              <div className="ai-demo-header">
                <div className="ai-avatar">✨</div>
                <div className="ai-demo-header-text">
                  <h4>PAY ENGINE</h4>
                  <p>Online · AI Assistant</p>
                </div>
              </div>
              <div className="ai-messages">
                <div className="ai-msg bot">Hey! 👋 How can I help you today?</div>
                <div className="ai-msg user">Buy 2GB MTN for 08012345678</div>
                <div className="ai-msg bot">Done! ✅ 2GB MTN sent to 08012345678. Balance: ₦4,500</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="cta-box">
            <div className="cta-content">
              <h2>Ready to Start?</h2>
              <p>Join thousands of Nigerians enjoying seamless payments every day.</p>
              <button className="btn-primary" onClick={() => navigate('/auth')}>
                Create Free Account
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-brand">
              <PayEngineLogo size={36} />
              <div>
                <div className="footer-brand-text">PayEngine</div>
                <div className="footer-brand-sub">by OneTap, a subsidiary of CHIVERA</div>
              </div>
            </div>
            <div className="footer-links">
              <a>Privacy</a>
              <a>Terms</a>
              <a onClick={() => window.location.href = 'mailto:chiblinks3@gmail.com'}>Contact</a>
            </div>
            <div className="footer-cac">
              <span className="footer-cac-icon">🛡️</span>
              <div>
                <div className="footer-cac-text">CAC VERIFIED</div>
                <div className="footer-cac-num">RC: 9247692</div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            © 2026 PayEngine by OneTap (CHIVERA). All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}

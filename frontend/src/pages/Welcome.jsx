import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, OneTapLogo } from '../App';

// Landing Page Styles
const landingStyles = `
  .landing-page {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #0a0a0f;
    color: #ffffff;
    line-height: 1.6;
    overflow-x: hidden;
  }

  .landing-page * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.3); }
    50% { box-shadow: 0 0 60px rgba(139, 92, 246, 0.5); }
  }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slide-in-left {
    from { opacity: 0; transform: translateX(-50px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes slide-in-right {
    from { opacity: 0; transform: translateX(50px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .landing-animate {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  .landing-animate.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .landing-beta-badge {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    background: rgba(217, 70, 239, 0.15);
    border: 1px solid rgba(217, 70, 239, 0.4);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: #D946EF;
    z-index: 1000;
    backdrop-filter: blur(10px);
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .landing-beta-badge::before {
    content: '';
    width: 6px;
    height: 6px;
    background: #D946EF;
    border-radius: 50%;
    animation: pulse-glow 2s infinite;
  }

  .landing-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 20px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 100;
    background: rgba(10, 10, 15, 0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .landing-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
  }

  .landing-logo-text {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
  }

  .landing-nav-links {
    display: flex;
    gap: 40px;
    list-style: none;
  }

  .landing-nav-links a {
    color: #A1A1AA;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.3s;
    cursor: pointer;
  }

  .landing-nav-links a:hover {
    color: #fff;
  }

  .landing-nav-cta {
    padding: 12px 28px;
    background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s;
  }

  .landing-nav-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
  }

  .landing-hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 120px 40px 80px;
    position: relative;
    overflow: hidden;
  }

  .landing-hero-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .landing-hero-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
  }

  .landing-hero-orb-1 {
    width: 600px;
    height: 600px;
    background: #8B5CF6;
    top: -200px;
    left: -100px;
    opacity: 0.3;
  }

  .landing-hero-orb-2 {
    width: 500px;
    height: 500px;
    background: #06B6D4;
    bottom: -100px;
    right: -100px;
    opacity: 0.25;
  }

  .landing-hero-orb-3 {
    width: 300px;
    height: 300px;
    background: #D946EF;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.15;
  }

  .landing-hero-content {
    max-width: 1200px;
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .landing-hero-text {
    animation: slide-in-left 1s ease;
  }

  .landing-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 30px;
    margin-bottom: 24px;
  }

  .landing-hero-badge-icon {
    width: 18px;
    height: 18px;
    background: #10B981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #fff;
  }

  .landing-hero-badge-text {
    font-size: 13px;
    color: #10B981;
    font-weight: 600;
  }

  .landing-hero h1 {
    font-size: 56px;
    font-weight: 700;
    line-height: 1.1;
    margin-bottom: 24px;
  }

  .landing-hero h1 span {
    background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .landing-hero-description {
    font-size: 18px;
    color: #A1A1AA;
    margin-bottom: 40px;
    max-width: 500px;
    line-height: 1.8;
  }

  .landing-hero-buttons {
    display: flex;
    gap: 16px;
  }

  .landing-btn-primary {
    padding: 16px 32px;
    background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .landing-btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(139, 92, 246, 0.4);
  }

  .landing-btn-secondary {
    padding: 16px 32px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s, border-color 0.3s;
    backdrop-filter: blur(10px);
  }

  .landing-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .landing-hero-visual {
    position: relative;
    animation: slide-in-right 1s ease;
  }

  .landing-phone-mockup {
    position: relative;
    width: 100%;
    max-width: 340px;
    margin: 0 auto;
    animation: float 6s ease-in-out infinite;
  }

  .landing-phone-frame {
    background: #12121a;
    border-radius: 40px;
    padding: 12px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 50px 100px rgba(0, 0, 0, 0.5);
  }

  .landing-phone-screen {
    background: #0a0a0f;
    border-radius: 32px;
    overflow: hidden;
    aspect-ratio: 9/19;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .landing-phone-notch {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 28px;
    background: #0a0a0f;
    border-radius: 20px;
    z-index: 10;
  }

  .landing-trust {
    padding: 60px 40px;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .landing-trust-container {
    max-width: 1000px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    text-align: center;
  }

  .landing-trust-item {
    padding: 24px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    transition: transform 0.3s, border-color 0.3s;
  }

  .landing-trust-item:hover {
    transform: translateY(-4px);
    border-color: rgba(139, 92, 246, 0.3);
  }

  .landing-trust-item-icon {
    font-size: 36px;
    margin-bottom: 12px;
  }

  .landing-trust-item p {
    color: #A1A1AA;
    font-size: 15px;
    font-weight: 500;
  }

  .landing-section {
    padding: 120px 40px;
    position: relative;
  }

  .landing-section-header {
    text-align: center;
    margin-bottom: 80px;
  }

  .landing-section-tag {
    display: inline-block;
    padding: 8px 20px;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 30px;
    font-size: 13px;
    font-weight: 600;
    color: #8B5CF6;
    margin-bottom: 20px;
    letter-spacing: 1px;
  }

  .landing-section-header h2 {
    font-size: 44px;
    font-weight: 700;
    margin-bottom: 20px;
  }

  .landing-section-header p {
    color: #A1A1AA;
    font-size: 18px;
    max-width: 600px;
    margin: 0 auto;
  }

  .landing-services-grid {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .landing-service-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 40px 32px;
    transition: transform 0.3s, border-color 0.3s, background 0.3s;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .landing-service-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .landing-service-card:hover {
    transform: translateY(-8px);
    border-color: rgba(139, 92, 246, 0.3);
    background: rgba(255, 255, 255, 0.05);
  }

  .landing-service-card:hover::before {
    opacity: 1;
  }

  .landing-service-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin-bottom: 24px;
  }

  .landing-service-card h3 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .landing-service-card p {
    color: #A1A1AA;
    font-size: 15px;
    line-height: 1.7;
  }

  .landing-steps-container {
    max-width: 1000px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 40px;
    position: relative;
  }

  .landing-steps-container::before {
    content: '';
    position: absolute;
    top: 40px;
    left: 60px;
    right: 60px;
    height: 2px;
    background: rgba(255, 255, 255, 0.08);
  }

  .landing-step {
    text-align: center;
    position: relative;
  }

  .landing-step-number {
    width: 80px;
    height: 80px;
    background: #12121a;
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 700;
    color: #8B5CF6;
    margin: 0 auto 24px;
    position: relative;
    z-index: 1;
    transition: border-color 0.3s, background 0.3s;
  }

  .landing-step:hover .landing-step-number {
    border-color: #8B5CF6;
    background: rgba(139, 92, 246, 0.1);
  }

  .landing-step h3 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .landing-step p {
    color: #A1A1AA;
    font-size: 14px;
  }

  .landing-ai-section {
    background: rgba(255, 255, 255, 0.02);
  }

  .landing-ai-content {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
  }

  .landing-ai-card {
    background: rgba(217, 70, 239, 0.05);
    border: 1px solid rgba(217, 70, 239, 0.2);
    border-radius: 32px;
    padding: 40px;
    position: relative;
    overflow: hidden;
  }

  .landing-ai-card::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(217, 70, 239, 0.3) 0%, transparent 70%);
    filter: blur(60px);
  }

  .landing-ai-avatar {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #D946EF 0%, #8B5CF6 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    margin-bottom: 24px;
    animation: pulse-glow 3s infinite;
  }

  .landing-ai-chat-demo {
    background: #12121a;
    border-radius: 20px;
    padding: 20px;
    margin-top: 24px;
  }

  .landing-ai-message {
    padding: 16px 20px;
    border-radius: 16px;
    font-size: 14px;
    margin-bottom: 12px;
    line-height: 1.6;
  }

  .landing-ai-message.user {
    background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
    margin-left: 40px;
  }

  .landing-ai-message.bot {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    margin-right: 40px;
  }

  .landing-ai-text h2 {
    font-size: 44px;
    font-weight: 700;
    margin-bottom: 24px;
  }

  .landing-ai-text h2 span {
    background: linear-gradient(135deg, #D946EF 0%, #8B5CF6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .landing-ai-text p {
    color: #A1A1AA;
    font-size: 18px;
    line-height: 1.8;
    margin-bottom: 32px;
  }

  .landing-ai-features {
    list-style: none;
  }

  .landing-ai-features li {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    font-size: 16px;
  }

  .landing-ai-features li::before {
    content: '✓';
    width: 28px;
    height: 28px;
    background: rgba(16, 185, 129, 0.15);
    color: #10B981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    flex-shrink: 0;
  }

  .landing-cta {
    position: relative;
    overflow: hidden;
  }

  .landing-cta-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
    opacity: 0.1;
  }

  .landing-cta-content {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .landing-cta h2 {
    font-size: 48px;
    font-weight: 700;
    margin-bottom: 24px;
  }

  .landing-cta p {
    color: #A1A1AA;
    font-size: 20px;
    margin-bottom: 40px;
  }

  .landing-cta-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
  }

  .landing-footer {
    padding: 60px 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .landing-footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .landing-footer-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .landing-footer-text {
    color: #71717A;
    font-size: 14px;
  }

  .landing-footer-links {
    display: flex;
    gap: 32px;
  }

  .landing-footer-links a {
    color: #A1A1AA;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s;
    cursor: pointer;
  }

  .landing-footer-links a:hover {
    color: #fff;
  }

  .landing-cac-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 10px;
  }

  .landing-cac-badge span {
    font-size: 12px;
    color: #10B981;
    font-weight: 600;
  }

  .landing-cac-badge small {
    display: block;
    font-size: 11px;
    color: #A1A1AA;
  }

  .landing-copyright {
    text-align: center;
    margin-top: 40px;
    color: #71717A;
    font-size: 13px;
  }

  /* Mobile Responsive */
  @media (max-width: 1024px) {
    .landing-hero-content {
      grid-template-columns: 1fr;
      text-align: center;
      gap: 60px;
    }

    .landing-hero-text { order: 1; }
    .landing-hero-visual { order: 0; }
    .landing-hero h1 { font-size: 42px; }
    .landing-hero-description { margin: 0 auto 40px; }
    .landing-hero-buttons { justify-content: center; }
    .landing-services-grid { grid-template-columns: repeat(2, 1fr); }
    .landing-steps-container { grid-template-columns: repeat(2, 1fr); gap: 60px; }
    .landing-steps-container::before { display: none; }
    .landing-ai-content { grid-template-columns: 1fr; gap: 60px; }
    .landing-trust-container { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 768px) {
    .landing-nav { padding: 16px 20px; }
    .landing-nav-links { display: none; }
    .landing-hero { padding: 100px 20px 60px; }
    .landing-hero h1 { font-size: 32px; }
    .landing-hero-buttons { flex-direction: column; align-items: center; }
    .landing-section-header h2, .landing-ai-text h2, .landing-cta h2 { font-size: 32px; }
    .landing-services-grid { grid-template-columns: 1fr; }
    .landing-steps-container { grid-template-columns: 1fr; }
    .landing-footer-content { flex-direction: column; gap: 24px; text-align: center; }
    .landing-footer-links { flex-wrap: wrap; justify-content: center; }
    .landing-section { padding: 80px 20px; }
    .landing-cta-buttons { flex-direction: column; align-items: center; }
  }
`;

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Inject styles
    const styleId = 'landing-page-styles';
    if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      styleSheet.textContent = landingStyles;
      document.head.appendChild(styleSheet);
    }

    // Scroll animation observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.landing-animate').forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const services = [
    { icon: '📱', title: 'Instant Airtime', desc: 'Top up any Nigerian network instantly — MTN, GLO, Airtel, 9mobile. Starting from just ₦50 with automatic delivery.', color: 'rgba(139, 92, 246, 0.15)', textColor: '#8B5CF6' },
    { icon: '📶', title: 'Data Bundles', desc: '40+ affordable data plans across all networks. SME, Corporate Gifting, and Awoof data at unbeatable prices.', color: 'rgba(6, 182, 212, 0.15)', textColor: '#06B6D4' },
    { icon: '⚡', title: 'Electricity Bills', desc: 'Pay for prepaid or postpaid meters across all DISCOs — IKEDC, EKEDC, AEDC, and more. Get tokens instantly.', color: 'rgba(251, 191, 36, 0.15)', textColor: '#FBBF24' },
    { icon: '📺', title: 'Cable TV', desc: 'Subscribe to DStv, GOtv, and Startimes. All bouquets available with instant activation.', color: 'rgba(236, 72, 153, 0.15)', textColor: '#EC4899' },
    { icon: '🛡️', title: 'KYC Verification', desc: 'Verify NIN, BVN, and phone numbers instantly. Perfect for businesses, HR departments, and compliance needs.', color: 'rgba(16, 185, 129, 0.15)', textColor: '#10B981' },
    { icon: '💳', title: 'Virtual Accounts', desc: 'Get a dedicated bank account for instant wallet funding. Transfer from any bank and your wallet is credited automatically.', color: 'rgba(217, 70, 239, 0.15)', textColor: '#D946EF' },
  ];

  const steps = [
    { num: '1', title: 'Create Account', desc: 'Sign up with your email and phone number. It takes less than a minute.' },
    { num: '2', title: 'Fund Wallet', desc: 'Transfer to your virtual account or use card payment to add funds.' },
    { num: '3', title: 'Choose Service', desc: 'Select from airtime, data, bills, cable TV, or KYC verification.' },
    { num: '4', title: 'One Tap Done', desc: 'Complete your transaction instantly. Get confirmation immediately.' },
  ];

  const trustItems = [
    { icon: '🔒', text: 'Bank-Grade Security' },
    { icon: '⚡', text: 'Instant Delivery' },
    { icon: '🤖', text: 'AI-Powered Support' },
    { icon: '✅', text: 'CAC Registered' },
  ];

  return (
    <div className="landing-page">
      {/* Beta Badge */}
      <div className="landing-beta-badge">BETA</div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <OneTapLogo size={44} />
          <span className="landing-logo-text">OneTap</span>
        </div>
        <ul className="landing-nav-links">
          <li><a onClick={() => scrollToSection('services')}>Services</a></li>
          <li><a onClick={() => scrollToSection('how-it-works')}>How It Works</a></li>
          <li><a onClick={() => scrollToSection('ai')}>PAY ENGINE</a></li>
          <li><a onClick={() => scrollToSection('contact')}>Contact</a></li>
        </ul>
        <button className="landing-nav-cta" onClick={() => navigate('/auth')}>Open App</button>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="landing-hero-orb landing-hero-orb-1" />
          <div className="landing-hero-orb landing-hero-orb-2" />
          <div className="landing-hero-orb landing-hero-orb-3" />
        </div>
        <div className="landing-hero-content">
          <div className="landing-hero-text">
            <div className="landing-hero-badge">
              <div className="landing-hero-badge-icon">✓</div>
              <span className="landing-hero-badge-text">CAC Registered · RC 9247692</span>
            </div>
            <h1>All Your Payments,<br /><span>One Tap Away</span></h1>
            <p className="landing-hero-description">
              Buy airtime, data bundles, pay electricity bills, subscribe to cable TV, and verify KYC — all from one super-app. Powered by AI for the smartest financial experience.
            </p>
            <div className="landing-hero-buttons">
              <button className="landing-btn-primary" onClick={() => navigate('/auth')}>
                <span>Get Started Free</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button className="landing-btn-secondary" onClick={() => scrollToSection('how-it-works')}>
                Learn More
              </button>
            </div>
          </div>
          <div className="landing-hero-visual">
            <div className="landing-phone-mockup">
              <div className="landing-phone-frame">
                <div className="landing-phone-notch" />
                <div className="landing-phone-screen">
                  <OneTapLogo size={80} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="landing-trust">
        <div className="landing-trust-container">
          {trustItems.map((item, i) => (
            <div key={i} className="landing-trust-item landing-animate">
              <div className="landing-trust-item-icon">{item.icon}</div>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="landing-section" id="services">
        <div className="landing-section-header landing-animate">
          <span className="landing-section-tag">SERVICES</span>
          <h2>Everything You Need, One App</h2>
          <p>From airtime to KYC verification, we've got all your digital payment needs covered with the best rates in Nigeria.</p>
        </div>
        <div className="landing-services-grid">
          {services.map((service, i) => (
            <div key={i} className="landing-service-card landing-animate">
              <div className="landing-service-icon" style={{ background: service.color, color: service.textColor }}>
                {service.icon}
              </div>
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section landing-ai-section" id="how-it-works">
        <div className="landing-section-header landing-animate">
          <span className="landing-section-tag">HOW IT WORKS</span>
          <h2>Start in 4 Simple Steps</h2>
          <p>Getting started with OneTap is quick and easy. No paperwork, no hassle.</p>
        </div>
        <div className="landing-steps-container">
          {steps.map((step, i) => (
            <div key={i} className="landing-step landing-animate">
              <div className="landing-step-number">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Section */}
      <section className="landing-section" id="ai">
        <div className="landing-ai-content">
          <div className="landing-ai-card landing-animate">
            <div className="landing-ai-avatar">✨</div>
            <h3 style={{ fontSize: 24, marginBottom: 8 }}>PAY ENGINE</h3>
            <p style={{ color: '#A1A1AA', marginBottom: 0 }}>Your AI-powered assistant</p>
            <div className="landing-ai-chat-demo">
              <div className="landing-ai-message bot">Hey! 👋 I'm PAY ENGINE. How can I help you today?</div>
              <div className="landing-ai-message user">I need 2GB MTN data for 08012345678</div>
              <div className="landing-ai-message bot">Done! ✅ 2GB MTN data sent to 08012345678. Your new balance is ₦4,500.</div>
            </div>
          </div>
          <div className="landing-ai-text landing-animate">
            <span className="landing-section-tag">AI ASSISTANT</span>
            <h2>Meet <span>PAY ENGINE</span></h2>
            <p>Our GPT-4 powered AI assistant understands natural language. Just tell it what you need — buy airtime, check balance, pay bills — and it handles everything for you.</p>
            <ul className="landing-ai-features">
              <li>Natural language transactions</li>
              <li>Nigerian Pidgin English support</li>
              <li>Instant transaction execution</li>
              <li>24/7 intelligent support</li>
              <li>Transaction history & insights</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section landing-cta" id="contact">
        <div className="landing-cta-bg" />
        <div className="landing-cta-content landing-animate">
          <h2>Ready to Simplify Your Payments?</h2>
          <p>Be among the first to experience the future of digital payments in Nigeria.</p>
          <div className="landing-cta-buttons">
            <button className="landing-btn-primary" onClick={() => navigate('/auth')}>
              <span>Join the Beta</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button className="landing-btn-secondary" onClick={() => window.location.href = 'mailto:chiblinks3@gmail.com'}>
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-logo">
            <OneTapLogo size={40} />
            <div>
              <span className="landing-logo-text" style={{ fontSize: 20 }}>OneTap</span>
              <p className="landing-footer-text">by CHIVERA</p>
            </div>
          </div>
          <div className="landing-footer-links">
            <a>Privacy Policy</a>
            <a>Terms of Service</a>
            <a>Support</a>
            <a onClick={() => window.location.href = 'mailto:chiblinks3@gmail.com'}>Contact</a>
          </div>
          <div className="landing-cac-badge">
            <span>🛡️</span>
            <div>
              <span>CAC APPROVED ✓</span>
              <small>RC: 9247692</small>
            </div>
          </div>
        </div>
        <p className="landing-copyright">© 2026 OneTap by CHIVERA. All rights reserved.</p>
      </footer>
    </div>
  );
}

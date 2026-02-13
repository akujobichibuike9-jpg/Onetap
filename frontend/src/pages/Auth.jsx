import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { C, useUser, OneTapLogo } from '../App';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound, ShieldCheck } from 'lucide-react';
import api from '../api';

// Liquid Glass Styles
const liquidGlassStyles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes logo-glow {
    0%, 100% { filter: drop-shadow(0 0 20px rgba(138, 92, 246, 0.4)) drop-shadow(0 0 40px rgba(6, 182, 212, 0.2)); }
    50% { filter: drop-shadow(0 0 30px rgba(138, 92, 246, 0.6)) drop-shadow(0 0 60px rgba(6, 182, 212, 0.4)); }
  }
  
  @keyframes logo-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  
  .logo-animated { animation: logo-glow 3s ease-in-out infinite, logo-float 4s ease-in-out infinite; }
  
  .liquid-glass {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(255, 255, 255, 0.08) 100%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    position: relative;
    overflow: hidden;
  }
  
  .liquid-glass::before {
    content: '';
    position: absolute;
    top: 0;
    left: -200%;
    width: 200%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
    animation: shimmer 10s ease-in-out infinite;
    pointer-events: none;
  }
  
  .liquid-glass-input {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  }
  
  .liquid-glass-input:focus {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(138, 92, 246, 0.5);
    box-shadow: 0 0 0 3px rgba(138, 92, 246, 0.15);
  }
  
  .liquid-glass-btn {
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .liquid-glass-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 30px rgba(138, 92, 246, 0.35);
  }
  
  .liquid-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  
  .liquid-orb-1 {
    top: 10%;
    left: 5%;
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, rgba(138, 92, 246, 0.25) 0%, transparent 70%);
    filter: blur(60px);
  }
  
  .liquid-orb-2 {
    bottom: 10%;
    right: 5%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%);
    filter: blur(60px);
  }
  
  .cac-badge-glass {
    background: rgba(16, 185, 129, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(16, 185, 129, 0.25);
  }
`;

// Input style - defined outside component
const inputStyle = { 
  width: '100%', 
  padding: 16, 
  borderRadius: 16, 
  background: 'rgba(255, 255, 255, 0.05)', 
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)', 
  color: '#F8FAFC', 
  fontSize: 15, 
  boxSizing: 'border-box',
  outline: 'none',
};

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();
  const [screen, setScreen] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', otp: '', newPassword: '' });

  // Inject styles once
  useEffect(() => {
    const styleId = 'liquid-glass-styles';
    if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      styleSheet.textContent = liquidGlassStyles;
      document.head.appendChild(styleSheet);
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/reset-password') setScreen('forgot');
  }, [location]);

  const update = (k, v) => { 
    setForm(prev => ({ ...prev, [k]: v })); 
    setError(''); 
    setSuccess(''); 
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) return setError('Please fill all fields');
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email: form.email.trim(), password: form.password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) return setError('Please fill all fields');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', { 
        firstName: form.firstName.trim(), 
        lastName: form.lastName.trim(), 
        email: form.email.trim(), 
        phone: form.phone.trim(), 
        password: form.password 
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Registration failed');
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!form.email) return setError('Enter your email address');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: form.email.trim() });
      setSuccess('Reset code sent! Check your email.');
      setScreen('otp');
    } catch (e) { 
      setError(e.response?.data?.error || 'Failed to send reset code'); 
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!form.otp || form.otp.length !== 6) return setError('Enter 6-digit code');
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { email: form.email.trim(), otp: form.otp });
      if (data.valid) setScreen('reset');
      else setError('Invalid code');
    } catch (e) { 
      setError(e.response?.data?.error || 'Invalid or expired code'); 
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!form.newPassword || form.newPassword.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { email: form.email.trim(), otp: form.otp, newPassword: form.newPassword });
      setSuccess('Password reset successful!');
      setTimeout(() => { setScreen('login'); navigate('/auth'); }, 1500);
    } catch (e) { 
      setError(e.response?.data?.error || 'Reset failed'); 
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: form.email.trim() });
      setSuccess('New code sent!');
    } catch (e) { 
      setError('Failed to resend code'); 
    }
    setLoading(false);
  };

  const btnStyle = { 
    width: '100%', 
    padding: 18, 
    borderRadius: 16, 
    border: 'none', 
    background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 600, 
    cursor: loading ? 'not-allowed' : 'pointer', 
    opacity: loading ? 0.6 : 1,
    boxShadow: '0 4px 20px rgba(138, 92, 246, 0.3)',
  };

  const backBtnStyle = { 
    background: 'rgba(255, 255, 255, 0.05)', 
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    color: C.textSec, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8, 
    cursor: 'pointer', 
    marginBottom: 24,
    padding: '10px 16px',
    borderRadius: 12,
  };

  const errorStyle = { padding: 14, borderRadius: 14, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', marginBottom: 20, fontSize: 14 };
  const successStyle = { padding: 14, borderRadius: 14, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', marginBottom: 20, fontSize: 14 };

  // WELCOME SCREEN
  if (screen === 'welcome') return (
    <div style={{ minHeight: '100vh', background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <div className="liquid-orb liquid-orb-1" />
      <div className="liquid-orb liquid-orb-2" />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', zIndex: 1 }}>
        <div className="cac-badge-glass" style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14 }}>
          <ShieldCheck size={20} color={C.success} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: C.success, fontWeight: 700, fontSize: 11 }}>CAC APPROVED</span>
              <span style={{ background: C.success, color: '#fff', fontSize: 8, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>✓</span>
            </div>
            <span style={{ color: C.textSec, fontSize: 10 }}>RC:9306790 </span>
          </div>
        </div>
        <div className="logo-animated"><OneTapLogo size={100} /></div>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: C.text, marginTop: 24, letterSpacing: 3 }}>OneTap</h1>
        <p style={{ color: C.textMuted, fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 40 }}>by Chivera</p>
        <div className="liquid-glass" style={{ padding: 32, borderRadius: 24, maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <p style={{ color: C.textSec, fontSize: 16, marginBottom: 32, lineHeight: 1.7 }}>Buy airtime, data, pay bills & verify KYC all in one place</p>
          <button onClick={() => setScreen('login')} className="liquid-glass-btn" style={btnStyle}>Get Started</button>
          <p style={{ color: C.textMuted, fontSize: 14, marginTop: 16 }}>
            New here? <button onClick={() => setScreen('signup')} style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 600, cursor: 'pointer' }}>Create Account</button>
          </p>
        </div>
      </div>
    </div>
  );

  // LOGIN SCREEN
  if (screen === 'login') return (
    <div style={{ minHeight: '100vh', background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <div className="liquid-orb liquid-orb-1" />
      <div className="liquid-orb liquid-orb-2" />
      <div style={{ minHeight: '100vh', padding: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 40 }}>
          <button onClick={() => { setScreen('welcome'); setError(''); }} style={backBtnStyle}><ArrowLeft size={20} /> Back</button>
          <div className="liquid-glass" style={{ padding: 32, borderRadius: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <OneTapLogo size={60} />
              <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, marginTop: 16 }}>Welcome Back</h1>
              <p style={{ color: C.textSec }}>Sign in to continue</p>
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>{success}</div>}
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <Mail size={18} color={C.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input type="email" placeholder="Email" value={form.email} onChange={e => update('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="liquid-glass-input" style={{ ...inputStyle, paddingLeft: 48 }} />
            </div>
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <Lock size={18} color={C.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input type={showPwd ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={e => update('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="liquid-glass-input" style={{ ...inputStyle, paddingLeft: 48 }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', zIndex: 1 }}>{showPwd ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <button onClick={() => setScreen('forgot')} style={{ background: 'none', border: 'none', color: C.primary, fontSize: 14, marginBottom: 24, cursor: 'pointer', display: 'block', marginLeft: 'auto' }}>Forgot Password?</button>
            <button onClick={handleLogin} disabled={loading} className="liquid-glass-btn" style={btnStyle}>{loading ? 'Signing in...' : 'Sign In'}</button>
            <p style={{ color: C.textMuted, fontSize: 14, textAlign: 'center', marginTop: 24 }}>
              Don't have an account? <button onClick={() => setScreen('signup')} style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 600, cursor: 'pointer' }}>Sign Up</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // SIGNUP SCREEN
  if (screen === 'signup') return (
    <div style={{ minHeight: '100vh', background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <div className="liquid-orb liquid-orb-1" />
      <div className="liquid-orb liquid-orb-2" />
      <div style={{ minHeight: '100vh', padding: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 20 }}>
          <button onClick={() => { setScreen('welcome'); setError(''); }} style={backBtnStyle}><ArrowLeft size={20} /> Back</button>
          <div className="liquid-glass" style={{ padding: 32, borderRadius: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <OneTapLogo size={50} />
              <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, marginTop: 12 }}>Create Account</h1>
              <p style={{ color: C.textSec, fontSize: 14 }}>Join thousands of happy users</p>
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <User size={18} color={C.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                <input placeholder="First Name" value={form.firstName} onChange={e => update('firstName', e.target.value)} className="liquid-glass-input" style={{ ...inputStyle, paddingLeft: 48 }} />
              </div>
              <div style={{ position: 'relative' }}>
                <User size={18} color={C.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                <input placeholder="Last Name" value={form.lastName} onChange={e => update('lastName', e.target.value)} className="liquid-glass-input" style={{ ...inputStyle, paddingLeft: 48 }} />
              </div>
            </div>
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <Mail size={18} color={C.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input type="email" placeholder="Email" value={form.email} onChange={e => update('email', e.target.value)} className="liquid-glass-input" style={{ ...inputStyle, paddingLeft: 48 }} />
            </div>
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <Phone size={18} color={C.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input type="tel" placeholder="Phone (e.g. 08012345678)" value={form.phone} onChange={e => update('phone', e.target.value)} className="liquid-glass-input" style={{ ...inputStyle, paddingLeft: 48 }} />
            </div>
            <div style={{ marginBottom: 24, position: 'relative' }}>
              <Lock size={18} color={C.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input type={showPwd ? 'text' : 'password'} placeholder="Password (min 6 chars)" value={form.password} onChange={e => update('password', e.target.value)} className="liquid-glass-input" style={{ ...inputStyle, paddingLeft: 48 }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', zIndex: 1 }}>{showPwd ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <button onClick={handleSignup} disabled={loading} className="liquid-glass-btn" style={btnStyle}>{loading ? 'Creating...' : 'Create Account'}</button>
            <p style={{ color: C.textMuted, fontSize: 14, textAlign: 'center', marginTop: 24 }}>
              Already have an account? <button onClick={() => setScreen('login')} style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // FORGOT PASSWORD SCREEN
  if (screen === 'forgot') return (
    <div style={{ minHeight: '100vh', background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <div className="liquid-orb liquid-orb-1" />
      <div className="liquid-orb liquid-orb-2" />
      <div style={{ minHeight: '100vh', padding: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 40 }}>
          <button onClick={() => { setScreen('login'); setError(''); }} style={backBtnStyle}><ArrowLeft size={20} /> Back</button>
          <div className="liquid-glass" style={{ padding: 32, borderRadius: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(138, 92, 246, 0.15)', border: '1px solid rgba(138, 92, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <KeyRound size={36} color={C.primary} />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text }}>Forgot Password?</h1>
              <p style={{ color: C.textSec, marginTop: 8 }}>Enter your email to receive a reset code</p>
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>{success}</div>}
            <div style={{ marginBottom: 24, position: 'relative' }}>
              <Mail size={18} color={C.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input type="email" placeholder="Enter your email" value={form.email} onChange={e => update('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleForgot()} className="liquid-glass-input" style={{ ...inputStyle, paddingLeft: 48 }} />
            </div>
            <button onClick={handleForgot} disabled={loading} className="liquid-glass-btn" style={btnStyle}>{loading ? 'Sending...' : 'Send Reset Code'}</button>
          </div>
        </div>
      </div>
    </div>
  );

  // OTP SCREEN
  if (screen === 'otp') return (
    <div style={{ minHeight: '100vh', background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <div className="liquid-orb liquid-orb-1" />
      <div className="liquid-orb liquid-orb-2" />
      <div style={{ minHeight: '100vh', padding: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 40 }}>
          <button onClick={() => { setScreen('forgot'); setError(''); }} style={backBtnStyle}><ArrowLeft size={20} /> Back</button>
          <div className="liquid-glass" style={{ padding: 32, borderRadius: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Mail size={36} color={C.secondary} />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text }}>Check Your Email</h1>
              <p style={{ color: C.textSec, marginTop: 8 }}>We sent a 6-digit code to</p>
              <p style={{ color: C.text, fontWeight: 600 }}>{form.email}</p>
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>{success}</div>}
            <div style={{ background: 'rgba(138, 92, 246, 0.1)', border: '1px solid rgba(138, 92, 246, 0.25)', borderRadius: 14, padding: 14, marginBottom: 20 }}>
              <p style={{ color: C.textSec, fontSize: 13, margin: 0 }}>📧 Check your inbox and spam folder. The code expires in 15 minutes.</p>
            </div>
            <div style={{ marginBottom: 24 }}>
              <input type="text" maxLength={6} placeholder="000000" value={form.otp} onChange={e => update('otp', e.target.value.replace(/\D/g, ''))} onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} className="liquid-glass-input" style={{ ...inputStyle, textAlign: 'center', fontSize: 32, letterSpacing: 12, fontWeight: 700, padding: 20 }} />
            </div>
            <button onClick={handleVerifyOtp} disabled={loading} className="liquid-glass-btn" style={btnStyle}>{loading ? 'Verifying...' : 'Verify Code'}</button>
            <p style={{ color: C.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 }}>
              Didn't receive code? <button onClick={handleResendOtp} disabled={loading} style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontWeight: 600 }}>Resend</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // RESET PASSWORD SCREEN
  if (screen === 'reset') return (
    <div style={{ minHeight: '100vh', background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <div className="liquid-orb liquid-orb-1" />
      <div className="liquid-orb liquid-orb-2" />
      <div style={{ minHeight: '100vh', padding: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 40 }}>
          <button onClick={() => { setScreen('otp'); setError(''); }} style={backBtnStyle}><ArrowLeft size={20} /> Back</button>
          <div className="liquid-glass" style={{ padding: 32, borderRadius: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={36} color={C.success} />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text }}>Create New Password</h1>
              <p style={{ color: C.textSec, marginTop: 8 }}>Your new password must be different from previous passwords</p>
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>{success}</div>}
            <div style={{ marginBottom: 24, position: 'relative' }}>
              <Lock size={18} color={C.textMuted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input type={showPwd ? 'text' : 'password'} placeholder="New password (min 6 chars)" value={form.newPassword} onChange={e => update('newPassword', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReset()} className="liquid-glass-input" style={{ ...inputStyle, paddingLeft: 48 }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', zIndex: 1 }}>{showPwd ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <button onClick={handleReset} disabled={loading} className="liquid-glass-btn" style={btnStyle}>{loading ? 'Resetting...' : 'Reset Password'}</button>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}

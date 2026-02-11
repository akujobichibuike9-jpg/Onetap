import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import api from './api';
import InstallPWA from './components/InstallPWA';

import Welcome from './pages/Welcome';
import Maintenance from './pages/Maintenance';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Airtime from './pages/Airtime';
import Data from './pages/Data';
import Electricity from './pages/Electricity';
import Cable from './pages/Cable';
import KYC from './pages/KYC';
import History from './pages/History';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Privacy from './pages/Privacy';
import FundWallet from './pages/FundWallet';

/* =======================
   Constants & Helpers
======================= */

export const C = {
  bg: '#0a0a0f',
  bgCard: 'rgba(15, 15, 25, 0.9)',
  bgGlass: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(139, 92, 246, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  primary: '#8B5CF6',
  secondary: '#06B6D4',
  accent: '#D946EF',
  gold: '#F59E0B',
  success: '#10B981',
  error: '#EF4444',
  text: '#F8FAFC',
  textSec: 'rgba(248, 250, 252, 0.7)',
  textMuted: 'rgba(248, 250, 252, 0.4)',
  grad1: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
  grad2: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
  grad3: 'linear-gradient(135deg, #06B6D4, #10B981)',
};

export const formatNaira = n => '₦' + Number(n || 0).toLocaleString();

/* =======================
   Context
======================= */

const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

/* =======================
   UI Components
======================= */

export const OneTapLogo = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="24" fill="url(#logoGrad)" />
    <path d="M55 15L35 50H48L42 85L70 45H55L65 15H55Z" fill="#fff" />
  </svg>
);

const Splash = () => (
  <div style={{ position: 'fixed', inset: 0, background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
    <div style={{ position: 'absolute', top: '30%', left: '20%', width: 300, height: 300, background: C.primary, borderRadius: '50%', filter: 'blur(150px)', opacity: 0.15 }} />
    <div style={{ animation: 'pulse 2s infinite', marginBottom: 24 }}>
      <OneTapLogo size={88} />
    </div>
    <h1 style={{ fontSize: 36, fontWeight: 800, color: C.text, letterSpacing: 2, marginBottom: 6 }}>OneTap</h1>
    <p style={{ color: C.textMuted, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>by Chivera</p>
    <style>{`@keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.05)} }`}</style>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/auth" replace />;
  return children;
};

/* =======================
   Payment Callback
======================= */

const PaymentCallback = () => {
  const [status, setStatus] = useState('verifying');
  const [balance, setBalance] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reference = params.get('reference');

    if (reference) {
      api.get(`/wallet/fund/verify/${reference}`)
        .then(r => {
          setStatus(r.data.status);
          if (r.data.balance) setBalance(r.data.balance);
          if (r.data.status === 'completed') refreshUser();
        })
        .catch(() => setStatus('failed'));
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        {status === 'verifying' && <p style={{ color: C.text }}>Verifying payment...</p>}
        {status === 'completed' && <p style={{ color: C.success }}>Payment successful — New Balance: {formatNaira(balance)}</p>}
        {status === 'pending' && <p style={{ color: C.gold }}>Payment pending...</p>}
        {status === 'failed' && <p style={{ color: C.error }}>Verification failed</p>}
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: 20, padding: '14px 32px', borderRadius: 12, background: C.grad1, border: 'none', color: '#fff', fontWeight: 600 }}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

/* =======================
   APP
======================= */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Initial load + auth restore
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);

    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');

    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
        api.get('/auth/me')
          .then(r => {
            setUser(r.data.user);
            localStorage.setItem('user', JSON.stringify(r.data.user));
          })
          .catch(() => {});
      } catch {
        localStorage.clear();
      }
    }

    return () => clearTimeout(timer);
  }, []);

  // Maintenance check
  useEffect(() => {
    const checkSystem = async () => {
      try {
        const r = await fetch('/api/system/status');
        const data = await r.json();

        if (data.maintenance_mode) {
          const path = window.location.pathname;
          if (!path.startsWith('/admin') && path !== '/maintenance') {
            setMaintenanceMode(true);
          }
        }
      } catch (e) {
        console.error('System check failed', e);
      }
    };

    checkSystem();
    const interval = setInterval(checkSystem, 60000);
    return () => clearInterval(interval);
  }, []);

  const refreshUser = async () => {
    try {
      const r = await api.get('/auth/me');
      setUser(r.data.user);
      localStorage.setItem('user', JSON.stringify(r.data.user));
    } catch {}
  };

  if (maintenanceMode) return <Maintenance />;
  if (loading) return <Splash />;

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      <BrowserRouter>
        <Routes>
          {/* Landing/Welcome page - visitors see this first */}
          <Route path="/" element={<Welcome />} />
          
          {/* Auth pages */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<Auth />} />
          
          {/* Admin & Public pages */}
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/maintenance" element={<Maintenance />} />
          
          {/* Protected routes - require login */}
          <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
          <Route path="/airtime" element={<ProtectedRoute><Airtime /></ProtectedRoute>} />
          <Route path="/data" element={<ProtectedRoute><Data /></ProtectedRoute>} />
          <Route path="/electricity" element={<ProtectedRoute><Electricity /></ProtectedRoute>} />
          <Route path="/cable" element={<ProtectedRoute><Cable /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
          <Route path="/fund-wallet" element={<ProtectedRoute><FundWallet /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* Catch-all - redirect to welcome */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <InstallPWA />
      </BrowserRouter>
    </UserContext.Provider>
  );
}

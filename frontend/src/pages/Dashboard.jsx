import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { C, formatNaira, useUser, OneTapLogo } from '../App';
import { Home, Grid, Clock, User, Phone, Wifi, Zap, Tv, Shield, Sparkles, Send, X, Plus, TrendingUp, ChevronRight, Bell, Info, AlertTriangle, Check } from 'lucide-react';

// Liquid Glass Styles for Dashboard
const liquidGlassStyles = `
  .wallet-glass {
    position: relative;
    overflow: hidden;
  }
  
  .wallet-glass::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    pointer-events: none;
  }
  
  .wallet-glass-btn {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: background 0.2s ease, transform 0.2s ease;
  }
  
  .wallet-glass-btn:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
  }
  
  .wallet-glass-btn:active {
    transform: translateY(0);
  }
  
  .wallet-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  
  .wallet-orb-1 {
    top: -30px;
    right: -30px;
    width: 120px;
    height: 120px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  
  .wallet-orb-2 {
    bottom: -40px;
    left: 20%;
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.08);
  }
  
  .service-glass {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  }
  
  .service-glass:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  
  .tx-glass {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: background 0.2s ease;
  }
  
  .tx-glass:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

// Inject styles
const injectStyles = () => {
  const styleId = 'dashboard-liquid-glass-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = liquidGlassStyles;
    document.head.appendChild(styleSheet);
  }
};

// Bottom Nav Component - Liquid Glass with AI in center
export const BottomNav = ({ active, onAIClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => { injectStyles(); }, []);
  
  const leftItems = [
    { id: 'dashboard', icon: Home, label: 'Home', path: '/dashboard' },
    { id: 'services', icon: Grid, label: 'Services', path: '/services' },
  ];
  
  const rightItems = [
    { id: 'history', icon: Clock, label: 'History', path: '/history' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];
  
  const handleNav = (path) => {
    console.log('Navigating to:', path);
    navigate(path);
  };
  
  const NavItem = ({ item }) => {
    const isActive = active === item.id || location.pathname === item.path;
    return (
      <button 
        onClick={() => handleNav(item.path)} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 4, 
          background: 'none', 
          border: 'none', 
          color: isActive ? C.primary : C.textMuted, 
          cursor: 'pointer', 
          padding: '8px 16px',
          transition: 'color 0.2s',
          flex: 1,
        }}
      >
        <item.icon size={22} />
        <span style={{ fontSize: 11, fontWeight: 500 }}>{item.label}</span>
      </button>
    );
  };
  
  return (
    <div 
      style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 40,
        padding: '0 16px 20px',
      }}
    >
      <div 
        className="nav-glass-bar"
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 8px',
          borderRadius: 24,
          background: 'rgba(30, 30, 40, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Left Items */}
        {leftItems.map(item => <NavItem key={item.id} item={item} />)}
        
        {/* Center AI Button */}
        <button 
          onClick={onAIClick}
          style={{ 
            width: 56, 
            height: 56, 
            borderRadius: 18, 
            background: C.grad2, 
            border: 'none', 
            color: '#fff', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(217, 70, 239, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            margin: '0 8px',
          }}
        >
          {/* Glass shine */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '18px 18px 0 0',
            pointerEvents: 'none',
          }} />
          <Sparkles size={24} />
        </button>
        
        {/* Right Items */}
        {rightItems.map(item => <NavItem key={item.id} item={item} />)}
      </div>
    </div>
  );
};

// AI Chat - Enhanced with full capabilities
const AIChat = ({ onClose }) => {
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState([{ role: 'ai', text: `Hey ${user?.name?.split(' ')[0] || 'there'}! I'm PAY ENGINE, your personal assistant. I can help you buy airtime, data, pay bills, or do KYC verification. Just tell me what you need!` }]);
  const [inp, setInp] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    if (!inp.trim() || loading) return;
    const m = inp.trim();
    setInp('');
    setMsgs(p => [...p, { role: 'user', text: m }]);
    setLoading(true);
    
    try {
      // Send message with conversation history
      const history = msgs.map(msg => ({ role: msg.role, text: msg.text }));
      const res = await api.post('/ai/chat', { message: m, history });
      
      console.log('🤖 AI Response:', res.data);
      
      const reply = res.data.reply || "I'm not sure how to help with that. Can you try rephrasing?";
      const action = res.data.action;
      
      // Add reply to messages
      setMsgs(p => [...p, { role: 'ai', text: reply }]);
      
      // Handle actions from AI
      if (action) {
        console.log('🤖 Executing action:', action);
        
        // Navigation
        if (action.type === 'navigate') {
          setTimeout(() => { onClose(); navigate(`/${action.to}`); }, 1000);
        }
        // Balance check
        else if (action.type === 'balance') {
          await refreshUser();
        }
        // Buy airtime
        else if (action.type === 'airtime') {
          console.log('🤖 Airtime action - network:', action.network, 'phone:', action.phone, 'amount:', action.amount);
          if (action.network && action.phone && action.amount) {
            try {
              console.log('🤖 Calling /ai/execute for airtime...');
              const execRes = await api.post('/ai/execute', { action });
              console.log('🤖 Execute response:', execRes.data);
              if (execRes.data.success) {
                setMsgs(p => [...p, { role: 'ai', text: `✅ ${execRes.data.message}` }]);
                await refreshUser();
              } else {
                setMsgs(p => [...p, { role: 'ai', text: `❌ ${execRes.data.message || 'Could not complete. Check your balance.'}` }]);
              }
            } catch (e) {
              console.error('🤖 Airtime execute error:', e);
              setMsgs(p => [...p, { role: 'ai', text: `❌ ${e.response?.data?.error || 'Something went wrong. Try again?'}` }]);
            }
          } else {
            console.log('🤖 Airtime action missing fields');
          }
        }
        // Buy data
        else if (action.type === 'data') {
          console.log('🤖 Data action - network:', action.network, 'phone:', action.phone, 'planId:', action.planId);
          if (action.network && action.phone && action.planId) {
            try {
              console.log('🤖 Calling /ai/execute for data...');
              const execRes = await api.post('/ai/execute', { action });
              console.log('🤖 Execute response:', execRes.data);
              if (execRes.data.success) {
                setMsgs(p => [...p, { role: 'ai', text: `✅ ${execRes.data.message}` }]);
                await refreshUser();
              } else {
                setMsgs(p => [...p, { role: 'ai', text: `❌ ${execRes.data.message || 'Could not complete.'}` }]);
              }
            } catch (e) {
              console.error('🤖 Data execute error:', e);
              setMsgs(p => [...p, { role: 'ai', text: `❌ ${e.response?.data?.error || 'Something went wrong.'}` }]);
            }
          } else {
            console.log('🤖 Data action missing fields');
          }
        }
      } else {
        console.log('🤖 No action in response');
      }
    } catch (e) {
      console.error('🤖 AI Chat error:', e);
      setMsgs(p => [...p, { role: 'ai', text: `Oops, something went wrong. Try that again?` }]);
    }
    setLoading(false);
  };

  // Quick action buttons
  const quickActions = [
    { label: 'Check Balance', msg: 'What is my balance?' },
    { label: 'Buy Airtime', msg: 'I want to buy airtime' },
    { label: 'Buy Data', msg: 'I need to buy data' },
    { label: 'View History', msg: 'Show my transactions' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: C.grad2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Sparkles size={22} /></div>
          <div><h3 style={{ fontWeight: 700, fontSize: 16, color: C.text }}>PAY ENGINE</h3><span style={{ color: C.success, fontSize: 12 }}>● Online</span></div>
        </div>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: C.bgGlass, border: `1px solid ${C.borderLight}`, color: C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
            <div style={{ maxWidth: '85%', padding: '14px 18px', borderRadius: 18, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', background: m.role === 'user' ? C.grad1 : C.bgCard, border: m.role === 'ai' ? `1px solid ${C.border}` : 'none', color: C.text }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ display: 'flex' }}><div style={{ padding: '14px 18px', borderRadius: 18, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textMuted }}>Thinking...</div></div>}
        <div ref={ref} />
      </div>
      
      {/* Quick Actions */}
      {msgs.length <= 2 && (
        <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => { setInp(a.msg); }} style={{ padding: '10px 16px', borderRadius: 20, background: C.bgGlass, border: `1px solid ${C.border}`, color: C.textSec, fontSize: 13, cursor: 'pointer' }}>{a.label}</button>
          ))}
        </div>
      )}
      
      <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12 }}>
        <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type your message..." style={{ flex: 1, padding: 16, borderRadius: 14, background: C.bgGlass, border: `1px solid ${C.border}`, color: C.text, fontSize: 14 }} />
        <button onClick={send} disabled={!inp.trim() || loading} style={{ padding: '0 20px', borderRadius: 14, background: inp.trim() ? C.grad1 : C.bgGlass, border: 'none', color: inp.trim() ? '#fff' : C.textMuted, cursor: 'pointer' }}><Send size={20} /></button>
      </div>
    </div>
  );
};

// Announcement Banner
const AnnouncementBanner = ({ announcements }) => {
  if (!announcements || announcements.length === 0) return null;
  const ann = announcements[0];
  const colors = { info: C.primary, warning: C.gold, success: C.success, error: C.error };
  const icons = { info: Info, warning: AlertTriangle, success: Bell, error: AlertTriangle };
  const Icon = icons[ann.type] || Info;
  const color = colors[ann.type] || C.primary;
  
  return (
    <div style={{ margin: '0 20px 20px', padding: 16, borderRadius: 14, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <Icon size={20} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        <p style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>{ann.title}</p>
        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>{ann.message}</p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [txs, setTxs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    injectStyles();
    Promise.all([
      api.get('/wallet/transactions').then(r => setTxs(r.data.transactions || [])),
      api.get('/announcements').then(r => setAnnouncements(r.data.announcements || []))
    ]).finally(() => setLoading(false));
  }, [user?.balance]);

  const services = [
    { id: 'airtime', name: 'Airtime', icon: Phone, color: C.primary, path: '/airtime' },
    { id: 'data', name: 'Data', icon: Wifi, color: C.secondary, path: '/data' },
    { id: 'electricity', name: 'Electric', icon: Zap, color: C.gold, path: '/electricity' },
    { id: 'cable', name: 'Cable', icon: Tv, color: C.accent, path: '/cable' },
    { id: 'kyc', name: 'KYC', icon: Shield, color: C.success, path: '/kyc' },
  ];

  // Handle "See all" click
  const handleSeeAll = () => {
    console.log('See All clicked - navigating to /services');
    navigate('/services');
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingBottom: 120 }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ padding: '24px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: C.textSec, fontSize: 14, marginBottom: 4 }}>Hello,</p>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{user?.name?.split(' ')[0]} 👋</h1>
          </div>
          <div style={{ width: 44, height: 44 }}><OneTapLogo size={44} /></div>
        </div>

        <AnnouncementBanner announcements={announcements} />

        {/* Wallet Card with Liquid Glass */}
        <div 
          className="wallet-glass"
          style={{ 
            margin: '20px 20px', 
            padding: 28, 
            borderRadius: 24, 
            background: C.grad1, 
            position: 'relative', 
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.25)',
          }}
        >
          {/* Glass Orbs */}
          <div className="wallet-orb wallet-orb-1" />
          <div className="wallet-orb wallet-orb-2" />
          
          {/* Glass Shine Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '24px 24px 0 0',
            pointerEvents: 'none',
          }} />
          
          <p style={{ opacity: 0.9, fontSize: 14, marginBottom: 8, position: 'relative', zIndex: 1 }}>Available Balance</p>
          <h1 style={{ fontSize: 38, fontWeight: 800, marginBottom: 24, color: '#fff', position: 'relative', zIndex: 1 }}>{formatNaira(user?.balance)}</h1>
          
          <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
            <button 
              onClick={() => navigate('/fund-wallet')} 
              className="wallet-glass-btn"
              style={{ 
                flex: 1, 
                padding: 14, 
                borderRadius: 14, 
                color: '#fff', 
                fontSize: 14, 
                fontWeight: 600, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8 
              }}
            >
              <Plus size={18} /> Fund Wallet
            </button>
            <button 
              onClick={() => navigate('/history')} 
              className="wallet-glass-btn"
              style={{ 
                flex: 1, 
                padding: 14, 
                borderRadius: 14, 
                color: '#fff', 
                fontSize: 14, 
                fontWeight: 600, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8 
              }}
            >
              <TrendingUp size={18} /> History
            </button>
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600 }}>Quick Services</h3>
            <button onClick={handleSeeAll} style={{ background: 'none', border: 'none', color: C.primary, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>See all <ChevronRight size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {services.map(s => (
              <button 
                key={s.id} 
                onClick={() => navigate(s.path)} 
                className="service-glass"
                style={{ 
                  padding: '16px 8px', 
                  borderRadius: 16, 
                  cursor: 'pointer', 
                  textAlign: 'center' 
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><s.icon size={20} /></div>
                <span style={{ fontSize: 11, color: C.textSec, fontWeight: 500 }}>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600 }}>Recent Transactions</h3>
            <button onClick={() => navigate('/history')} style={{ background: 'none', border: 'none', color: C.primary, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>See all <ChevronRight size={16} /></button>
          </div>
          {loading ? <p style={{ color: C.textMuted, textAlign: 'center', padding: 40 }}>Loading...</p> : txs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}><Clock size={40} style={{ marginBottom: 12, opacity: 0.4 }} /><p style={{ fontSize: 14 }}>No transactions yet</p></div>
          ) : txs.slice(0, 5).map(tx => (
            <div 
              key={tx.id} 
              onClick={() => navigate(`/history?receipt=${tx.id}`)} 
              className="tx-glass"
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: 16, 
                borderRadius: 14, 
                marginBottom: 10, 
                cursor: 'pointer' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: tx.type === 'credit' ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.12)', color: tx.type === 'credit' ? C.success : C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tx.type === 'credit' ? <Plus size={18} /> : <Zap size={18} />}</div>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 4 }}>{tx.description?.slice(0, 25)}{tx.description?.length > 25 ? '...' : ''}</p>
                  <p style={{ color: C.textMuted, fontSize: 12 }}>{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: tx.type === 'credit' ? C.success : C.text }}>{tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Button with Glass Effect */}
      {/* REMOVED - Now integrated into BottomNav */}

      <BottomNav active="dashboard" onAIClick={() => setShowAI(true)} />
      {showAI && <AIChat onClose={() => setShowAI(false)} />}
    </div>
  );
}

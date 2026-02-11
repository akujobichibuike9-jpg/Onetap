import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { C, formatNaira, useUser, OneTapLogo } from '../App';
import { ArrowLeft, User, Mail, Phone, Shield, Trash2, LogOut, ChevronRight, AlertTriangle, X } from 'lucide-react';
import { BottomNav } from './Dashboard';

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [showDelete, setShowDelete] = useState(false);
  const [deletePass, setDeletePass] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/auth');
  };

  const deleteAccount = async () => {
    if (!deletePass) { setDeleteError('Password required'); return; }
    setDeleting(true); setDeleteError('');
    try {
      await api.delete('/auth/delete-account', { data: { password: deletePass } });
      localStorage.clear();
      setUser(null);
      navigate('/auth');
    } catch (e) { setDeleteError(e.response?.data?.error || 'Failed to delete account'); }
    setDeleting(false);
  };

  const menuItems = [
    { icon: User, label: user?.name, sub: 'Full Name', color: C.primary },
    { icon: Mail, label: user?.email, sub: 'Email Address', color: C.secondary },
    { icon: Phone, label: user?.phone, sub: 'Phone Number', color: C.accent },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ width: 44, height: 44, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Profile</h1>
        </div>

        {/* Profile Card */}
        <div style={{ margin: '0 20px 24px', padding: 28, borderRadius: 20, background: C.grad1, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32, fontWeight: 700, color: '#fff', backdropFilter: 'blur(10px)' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{user?.name}</h2>
          <p style={{ fontSize: 14, opacity: 0.85 }}>{user?.email}</p>
          <div style={{ marginTop: 20, padding: '12px 24px', background: 'rgba(255,255,255,0.15)', borderRadius: 12, display: 'inline-block' }}>
            <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Wallet Balance</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{formatNaira(user?.balance)}</p>
          </div>
        </div>

        {/* Info Cards */}
        <div style={{ padding: '0 20px' }}>
          {menuItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.icon size={22} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 2 }}>{item.label}</p>
                <p style={{ color: C.textMuted, fontSize: 12 }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ padding: '24px 20px' }}>
          <h3 style={{ fontSize: 14, color: C.textMuted, marginBottom: 16, fontWeight: 500 }}>Settings</h3>
          
          <Link to="/privacy" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, marginBottom: 12, textDecoration: 'none' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16,185,129,0.12)', color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Privacy Policy</p>
              <p style={{ color: C.textMuted, fontSize: 12 }}>Read our privacy policy</p>
            </div>
            <ChevronRight size={20} color={C.textMuted} />
          </Link>

          <button onClick={() => setShowDelete(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 18, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, marginBottom: 12, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.12)', color: C.error, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: C.error }}>Delete Account</p>
              <p style={{ color: C.textMuted, fontSize: 12 }}>Permanently delete your account</p>
            </div>
            <ChevronRight size={20} color={C.textMuted} />
          </button>

          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 18, background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 16, marginTop: 12, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.12)', color: C.error, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={22} />
            </div>
            <p style={{ fontWeight: 600, fontSize: 15, color: C.error }}>Logout</p>
          </button>
        </div>

        {/* App Info */}
        <div style={{ textAlign: 'center', padding: '20px 20px 40px' }}>
          <OneTapLogo size={44} />
          <p style={{ color: C.textMuted, fontSize: 12, marginTop: 12 }}>OneTap v1.0.0</p>
          <p style={{ color: C.textMuted, fontSize: 11, marginTop: 4 }}>© 2026 Chivera Technologies</p>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 380, background: C.bgCard, borderRadius: 20, padding: 28, border: `1px solid ${C.border}` }}>
            <button onClick={() => { setShowDelete(false); setDeletePass(''); setDeleteError(''); }} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}><X size={20} /></button>
            
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(239,68,68,0.12)', color: C.error, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>Delete Account?</h3>
              <p style={{ color: C.textSec, fontSize: 14, lineHeight: 1.5 }}>This action is permanent and cannot be undone. All your data will be deleted.</p>
            </div>

            {deleteError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, marginBottom: 16, color: C.error, fontSize: 13, textAlign: 'center' }}>{deleteError}</div>}

            <input type="password" value={deletePass} onChange={e => { setDeletePass(e.target.value); setDeleteError(''); }} placeholder="Enter your password to confirm" style={{ width: '100%', padding: 16, borderRadius: 12, background: C.bgGlass, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, marginBottom: 16 }} />

            <button onClick={deleteAccount} disabled={!deletePass || deleting} style={{ width: '100%', padding: 16, borderRadius: 12, border: 'none', background: C.error, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 12, opacity: (!deletePass || deleting) ? 0.6 : 1 }}>
              {deleting ? 'Deleting...' : 'Delete My Account'}
            </button>
            <button onClick={() => { setShowDelete(false); setDeletePass(''); setDeleteError(''); }} style={{ width: '100%', padding: 16, borderRadius: 12, background: 'transparent', border: `1px solid ${C.border}`, color: C.textSec, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  );
}

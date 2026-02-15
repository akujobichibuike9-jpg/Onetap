import { useState, useEffect } from 'react';
import { C, formatNaira } from '../App';

export default function Admin() {
  // Auth state
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [pwdInput, setPwdInput] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Data state
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [txs, setTxs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [anns, setAnns] = useState([]);
  const [pricing, setPricing] = useState({ 
    airtime_markup: 2, 
    data_markup: 2, 
    electricity_markup: 0,
    cable_markup: 0,
    kyc_profit: 50 
  });
  const [systemStatus, setSystemStatus] = useState({
    maintenance_mode: false,
    payment_enabled: true
  });
  const [search, setSearch] = useState('');
  const [selUser, setSelUser] = useState(null);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: '', message: '', type: 'info' });
  
  // Credit/Debit modal
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAction, setCreditAction] = useState('credit');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  // Shutdown modal
  const [showShutdownModal, setShowShutdownModal] = useState(false);
  const [shutdownPassword, setShutdownPassword] = useState('');
  const [shutdownAction, setShutdownAction] = useState('');

  // Transaction selection for bulk delete
  const [selectedTxs, setSelectedTxs] = useState([]);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  // SEARCH FILTER LOGIC
  const filteredTxs = txs.filter(t => 
    t.reference?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied: ' + text);
  };

  // LOGIN
  const login = async () => {
    if (!pwdInput) { setLoginErr('Enter password'); return; }
    setLoginLoading(true);
    setLoginErr('');
    try {
      const r = await fetch('/api/admin/stats', { headers: { 'x-admin-key': pwdInput } });
      if (r.ok) {
        const data = await r.json();
        setAdminKey(pwdInput);
        setStats(data);
        setLoggedIn(true);
      } else {
        setLoginErr('Invalid password');
      }
    } catch (e) {
      setLoginErr('Connection failed');
    }
    setLoginLoading(false);
  };

  // LOGOUT
  const logout = () => {
    setLoggedIn(false);
    setAdminKey('');
    setPwdInput('');
    setStats(null);
    setUsers([]);
    setTxs([]);
    setLogs([]);
    setSelUser(null);
  };

  // FETCH DATA
  const fetchData = async () => {
    if (!adminKey) return;
    setLoading(true);
    const h = { 'x-admin-key': adminKey };
    try {
      const [s, u, t, l, a, p, sys] = await Promise.all([
        fetch('/api/admin/stats', { headers: h }).then(r => r.json()),
        fetch(`/api/admin/users${search ? `?search=${search}` : ''}`, { headers: h }).then(r => r.json()),
        fetch('/api/admin/transactions', { headers: h }).then(r => r.json()),
        fetch('/api/admin/logs', { headers: h }).then(r => r.json()),
        fetch('/api/admin/announcements', { headers: h }).then(r => r.json()),
        fetch('/api/admin/settings/pricing', { headers: h }).then(r => r.json()),
        fetch('/api/admin/settings/system', { headers: h }).then(r => r.json()).catch(() => ({ status: systemStatus }))
      ]);
      if (s) setStats(s);
      if (u?.users) setUsers(u.users);
      if (t?.transactions) setTxs(t.transactions);
      if (l?.logs) setLogs(l.logs);
      if (a?.announcements) setAnns(a.announcements);
      if (p?.pricing) setPricing(p.pricing);
      
      // FIXED: Check for sys.settings OR sys.status to ensure toggles load correctly
      if (sys?.settings) setSystemStatus(sys.settings);
      else if (sys?.status) setSystemStatus(sys.status);

    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // GET USER DETAILS
  const getUser = async (id) => {
    try {
      const r = await fetch(`/api/admin/users/${id}`, { headers: { 'x-admin-key': adminKey } });
      if (r.ok) setSelUser(await r.json());
    } catch (e) {}
  };

  // TOGGLE USER STATUS
  const toggleStatus = async (id, status) => {
    if (!confirm(`${status === 'blocked' ? 'Block' : 'Unblock'} this user?`)) return;
    try {
      const r = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ status })
      });
      if (r.ok) { alert('Done!'); fetchData(); if (selUser) getUser(id); }
    } catch (e) { alert('Failed'); }
  };

  // DELETE USER ACCOUNT
  const handleDeleteUser = async () => {
    if (!deletePassword) {
      alert('Enter admin password');
      return;
    }
    
    if (deleteConfirmEmail !== selUser.user.email) {
      alert('Email does not match. Please type the exact email to confirm deletion.');
      return;
    }
    
    setDeleting(true);
    
    try {
      const r = await fetch(`/api/admin/users/${selUser.user.id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json', 
          'x-admin-key': adminKey 
        },
        body: JSON.stringify({ 
          password: deletePassword,
          confirmEmail: deleteConfirmEmail
        })
      });
      
      if (r.ok) {
        const data = await r.json();
        alert(data.message || 'User account deleted successfully!');
        setShowDeleteModal(false);
        setDeletePassword('');
        setDeleteConfirmEmail('');
        setSelUser(null);
        fetchData();
      } else {
        const data = await r.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (e) {
      alert('Failed to delete user');
    }
    
    setDeleting(false);
  };

  // CREDIT/DEBIT USER
  const handleCreditDebit = async () => {
    if (!creditAmount || isNaN(parseFloat(creditAmount)) || parseFloat(creditAmount) <= 0) {
      alert('Enter valid amount');
      return;
    }
    if (!creditReason.trim()) {
      alert('Enter reason');
      return;
    }
    
    try {
      const r = await fetch(`/api/admin/users/${selUser.user.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ 
          type: creditAction, 
          amount: parseFloat(creditAmount),
          reason: creditReason
        })
      });
      
      if (r.ok) {
        alert(`${creditAction === 'credit' ? 'Credited' : 'Debited'} ₦${parseFloat(creditAmount).toLocaleString()} successfully!`);
        setShowCreditModal(false);
        setCreditAmount('');
        setCreditReason('');
        getUser(selUser.user.id);
        fetchData();
      } else {
        const data = await r.json();
        alert(data.error || 'Failed');
      }
    } catch (e) {
      alert('Failed');
    }
  };

  // SAVE PRICING
  const savePricing = async () => {
    try {
      const r = await fetch('/api/admin/settings/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ pricing })
      });
      if (r.ok) alert('Pricing saved!');
      else alert('Failed to save');
    } catch (e) { alert('Failed'); }
  };

  // SYSTEM CONTROL - Toggle maintenance/payment
  const handleSystemToggle = async () => {
    if (!shutdownPassword) {
      alert('Enter admin password');
      return;
    }
    
    // Construct the new status based on current state
    const newStatus = shutdownAction === 'maintenance' 
      ? { ...systemStatus, maintenance_mode: !systemStatus.maintenance_mode }
      : { ...systemStatus, payment_enabled: !systemStatus.payment_enabled };

    try {
      const r = await fetch('/api/admin/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ 
          password: shutdownPassword,
          action: shutdownAction,
          status: newStatus
        })
      });
      
      if (r.ok) {
        const data = await r.json();
        // Update local state with the returned settings
        setSystemStatus(data.status || data.settings || newStatus);
        setShowShutdownModal(false);
        setShutdownPassword('');
        alert(data.message || 'Settings updated!');
      } else {
        const data = await r.json();
        alert(data.error || 'Failed');
      }
    } catch (e) { 
      alert('Failed'); 
    }
  };

  // CREATE ANNOUNCEMENT
  const createAnn = async () => {
    if (!newAnn.title || !newAnn.message) { alert('Fill all fields'); return; }
    try {
      const r = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(newAnn)
      });
      if (r.ok) { setShowAnnForm(false); setNewAnn({ title: '', message: '', type: 'info' }); fetchData(); }
    } catch (e) { alert('Failed'); }
  };

  // DELETE ANNOUNCEMENT
  const delAnn = async (id) => {
    if (!confirm('Delete?')) return;
    try {
      await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
      fetchData();
    } catch (e) {}
  };

  // EFFECTS
  useEffect(() => { if (loggedIn && adminKey) fetchData(); }, [loggedIn, adminKey]);
  useEffect(() => { 
    if (loggedIn && adminKey && tab === 'users') { 
        const t = setTimeout(fetchData, 400); 
        return () => clearTimeout(t); 
    } 
  }, [search, tab]);

  // ===========================================
  // LOGIN SCREEN
  // ===========================================
  if (!loggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 380, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: C.grad1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🔐</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Admin Panel</h1>
            <p style={{ color: C.textMuted, fontSize: 14 }}>Enter password</p>
          </div>
          
          {loginErr && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, marginBottom: 16, color: '#ef4444', fontSize: 14, textAlign: 'center' }}>{loginErr}</div>}
          
          <input
            type="password"
            value={pwdInput}
            onChange={e => setPwdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Admin Password"
            autoFocus
            style={{ width: '100%', padding: 14, borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 16, marginBottom: 16, boxSizing: 'border-box' }}
          />
          
          <button onClick={login} disabled={loginLoading} style={{ width: '100%', padding: 14, borderRadius: 12, background: C.grad1, border: 'none', color: '#fff', fontSize: 16, fontWeight: 600, cursor: loginLoading ? 'wait' : 'pointer', opacity: loginLoading ? 0.7 : 1 }}>
            {loginLoading ? 'Checking...' : 'Login'}
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: '📊 Overview' },
    { id: 'users', name: '👥 Users' },
    { id: 'transactions', name: '💳 Transactions' },
    { id: 'logs', name: '📋 Logs' },
    { id: 'announcements', name: '📢 Announcements' },
    { id: 'settings', name: '⚙️ Settings' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* HEADER */}
      <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>OneTap Admin</h1>
          {systemStatus.maintenance_mode && (
            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
              🔴 MAINTENANCE MODE
            </span>
          )}
          {!systemStatus.payment_enabled && (
            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
              💳 PAYMENTS OFF
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchData} disabled={loading} style={{ padding: '8px 16px', borderRadius: 8, background: C.bgGlass, border: `1px solid ${C.border}`, color: C.text, cursor: 'pointer', fontSize: 13 }}>
            {loading ? '...' : '🔄 Refresh'}
          </button>
          <button onClick={logout} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* SIDEBAR */}
        <div style={{ width: 180, background: C.bgCard, borderRight: `1px solid ${C.border}`, minHeight: 'calc(100vh - 52px)', padding: 10 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(''); }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: 'none',
                background: tab === t.id ? `${C.primary}20` : 'transparent',
                color: tab === t.id ? C.primary : C.textSec,
                cursor: 'pointer',
                marginBottom: 4,
                fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                textAlign: 'left'
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, padding: 20, overflowY: 'auto', maxHeight: 'calc(100vh - 52px)' }}>
          
          {/* OVERVIEW */}
          {tab === 'overview' && stats && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Dashboard</h2>
                  {stats.lastReset && (
                    <p style={{ color: C.textMuted, fontSize: 11, marginTop: 4 }}>Stats since: {new Date(stats.lastReset).toLocaleString()}</p>
                  )}
                </div>
                <button 
                  onClick={async () => {
                    if (!confirm('Reset all stats counters?')) return;
                    try {
                      await fetch('/api/admin/stats/reset', { method: 'POST', headers: { 'x-admin-key': adminKey } });
                      alert('Stats reset!');
                      fetchData();
                    } catch (e) { alert('Failed'); }
                  }}
                  style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  🔄 Reset Stats
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                {[
                  { l: 'Users', v: stats.totalUsers, c: C.primary },
                  { l: 'Balance', v: formatNaira(stats.totalBalance), c: C.success },
                  { l: 'Transactions', v: stats.totalTransactions, c: C.secondary },
                  { l: 'Volume', v: formatNaira(stats.totalVolume), c: '#f59e0b' },
                  { l: 'Profit', v: formatNaira(stats.totalProfit), c: C.success },
                  { l: 'KYC', v: stats.kycCount, c: C.accent },
                  { l: 'Today Txns', v: stats.todayTransactions, c: C.primary },
                  { l: 'Today Vol', v: formatNaira(stats.todayVolume), c: '#f59e0b' }
                ].map((s, i) => (
                  <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 6 }}>{s.l}</p>
                    <p style={{ color: s.c, fontSize: 20, fontWeight: 700 }}>{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Users ({users.length})</h2>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search Users..."
                  style={{ padding: '10px 14px', borderRadius: 10, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, width: 200 }}
                />
              </div>
              
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                {users.length > 0 ? users.map(u => (
                  <div key={u.id} style={{ padding: 14, borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{u.first_name} {u.last_name}</p>
                      <p style={{ color: C.textMuted, fontSize: 12 }}>{u.email} • {u.phone}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: C.success, fontWeight: 700 }}>{formatNaira(u.balance)}</span>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: u.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: u.status === 'active' ? '#10b981' : '#ef4444' }}>{u.status}</span>
                      <button onClick={() => getUser(u.id)} style={{ padding: '6px 12px', borderRadius: 6, background: C.primary, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12 }}>View</button>
                    </div>
                  </div>
                )) : <p style={{ padding: 30, textAlign: 'center', color: C.textMuted }}>No users</p>}
              </div>
            </div>
          )}

          {/* TRANSACTIONS WITH SEARCH */}
          {tab === 'transactions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Transactions ({filteredTxs.length})</h2>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {selectedTxs.length > 0 && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete ${selectedTxs.length} selected transactions?`)) return;
                        try {
                          const r = await fetch('/api/admin/transactions/delete-bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
                            body: JSON.stringify({ ids: selectedTxs })
                          });
                          if (r.ok) {
                            alert(`Deleted ${selectedTxs.length} transactions`);
                            setSelectedTxs([]);
                            fetchData();
                          } else {
                            alert('Failed to delete');
                          }
                        } catch (e) { alert('Failed'); }
                      }}
                      style={{ padding: '8px 14px', borderRadius: 8, background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      🗑️ Delete Selected ({selectedTxs.length})
                    </button>
                  )}
                  {filteredTxs.length > 0 && (
                    <button
                      onClick={async () => {
                        if (!confirm('Delete ALL transactions? This cannot be undone!')) return;
                        try {
                          const r = await fetch('/api/admin/transactions', { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
                          if (r.ok) {
                            const data = await r.json();
                            alert(`Deleted ${data.deleted} transactions`);
                            setSelectedTxs([]);
                            fetchData();
                          } else {
                            alert('Failed');
                          }
                        } catch (e) { alert('Failed'); }
                      }}
                      style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      🗑️ Clear All
                    </button>
                  )}
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search Reference..."
                    style={{ padding: '10px 14px', borderRadius: 10, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, width: 200 }}
                  />
                </div>
              </div>
              
              {/* Select All checkbox */}
              {filteredTxs.length > 0 && (
                <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedTxs.length === filteredTxs.slice(0, 100).length && filteredTxs.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTxs(filteredTxs.slice(0, 100).map(t => t.id));
                      } else {
                        setSelectedTxs([]);
                      }
                    }}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <span style={{ color: C.textSec, fontSize: 13 }}>Select All (showing {Math.min(filteredTxs.length, 100)})</span>
                </div>
              )}
              
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                {filteredTxs.length > 0 ? filteredTxs.slice(0, 100).map(t => (
                  <div key={t.id} style={{ padding: 12, borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="checkbox"
                        checked={selectedTxs.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTxs([...selectedTxs, t.id]);
                          } else {
                            setSelectedTxs(selectedTxs.filter(id => id !== t.id));
                          }
                        }}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <div>
                        <p style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{t.description || t.category}</p>
                        <p style={{ color: C.textMuted, fontSize: 11 }}>
                          <span 
                            onClick={() => copyToClipboard(t.reference)}
                            style={{ color: C.primary, cursor: 'pointer', fontWeight: 600 }}
                            title="Click to copy"
                          >
                            {t.reference} 📋
                          </span> • {t.email || t.first_name || `User ${t.user_id}`}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: t.type === 'credit' ? '#10b981' : '#ef4444', fontWeight: 700 }}>{t.type === 'credit' ? '+' : '-'}{formatNaira(t.amount)}</p>
                        <p style={{ color: C.textMuted, fontSize: 10 }}>{new Date(t.created_at).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('Delete this transaction?')) return;
                          try {
                            const r = await fetch(`/api/admin/transactions/${t.id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
                            if (r.ok) {
                              setTxs(txs.filter(x => x.id !== t.id));
                              setSelectedTxs(selectedTxs.filter(id => id !== t.id));
                            } else {
                              alert('Failed');
                            }
                          } catch (e) { alert('Failed'); }
                        }}
                        style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11 }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )) : <p style={{ padding: 30, textAlign: 'center', color: C.textMuted }}>No matching transactions</p>}
              </div>
            </div>
          )}

          {/* LOGS */}
          {tab === 'logs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Activity Logs ({logs.length})</h2>
                {logs.length > 0 && (
                  <button 
                    onClick={async () => {
                      if (!confirm('Delete ALL logs?')) return;
                      try {
                        await fetch('/api/admin/logs', { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
                        fetchData();
                      } catch (e) { alert('Failed'); }
                    }}
                    style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    🗑️ Clear All
                  </button>
                )}
              </div>
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                {logs.length > 0 ? logs.slice(0, 50).map(l => (
                  <div key={l.id} style={{ padding: 12, borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.text, fontSize: 13 }}>{l.action}</p>
                      <p style={{ color: C.textMuted, fontSize: 11 }}>{l.email || `User ${l.user_id}`} • {l.device_type} • {l.ip_address}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: C.textMuted, fontSize: 10 }}>{new Date(l.created_at).toLocaleString()}</span>
                      <button onClick={async () => {
                          await fetch(`/api/admin/logs/${l.id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
                          setLogs(logs.filter(x => x.id !== l.id));
                      }} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11 }}>✕</button>
                    </div>
                  </div>
                )) : <p style={{ padding: 30, textAlign: 'center', color: C.textMuted }}>No logs</p>}
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS */}
          {tab === 'announcements' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Announcements</h2>
                <button onClick={() => setShowAnnForm(true)} style={{ padding: '10px 16px', borderRadius: 10, background: C.grad1, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>+ New</button>
              </div>
              {anns.map(a => (
                <div key={a.id} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: C.text, fontWeight: 600 }}>{a.title}</p>
                    <p style={{ color: C.textSec, fontSize: 13 }}>{a.message}</p>
                  </div>
                  <button onClick={() => delAnn(a.id)} style={{ padding: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', borderRadius: 8 }}>🗑️</button>
                </div>
              ))}
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 20 }}>Settings</h2>
              
              {/* SYSTEM CONTROLS */}
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🔒 System Controls</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Maintenance Mode */}
                  <div style={{ 
                    background: systemStatus.maintenance_mode ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', 
                    border: `1px solid ${systemStatus.maintenance_mode ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                    borderRadius: 12, 
                    padding: 16 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ color: C.text, fontWeight: 600 }}>🚧 Maintenance Mode</span>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: 20, 
                        fontSize: 11, 
                        fontWeight: 700,
                        background: systemStatus.maintenance_mode ? '#ef4444' : '#10b981',
                        color: '#fff'
                      }}>
                        {systemStatus.maintenance_mode ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p style={{ color: C.textSec, fontSize: 12, marginBottom: 12 }}>
                      {systemStatus.maintenance_mode 
                        ? 'App is currently in maintenance mode. Users cannot access.'
                        : 'App is running normally.'}
                    </p>
                    <button 
                      onClick={() => { setShutdownAction('maintenance'); setShowShutdownModal(true); }}
                      style={{ 
                        width: '100%', 
                        padding: 10, 
                        borderRadius: 8, 
                        border: 'none', 
                        background: systemStatus.maintenance_mode ? '#10b981' : '#ef4444', 
                        color: '#fff', 
                        fontWeight: 600, 
                        cursor: 'pointer' 
                      }}
                    >
                      {systemStatus.maintenance_mode ? '✅ Turn OFF' : '🔴 Turn ON'}
                    </button>
                  </div>

                  {/* Payment Engine */}
                  <div style={{ 
                    background: systemStatus.payment_enabled ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', 
                    border: `1px solid ${systemStatus.payment_enabled ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    borderRadius: 12, 
                    padding: 16 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ color: C.text, fontWeight: 600 }}>💳 Payment Engine</span>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: 20, 
                        fontSize: 11, 
                        fontWeight: 700,
                        background: systemStatus.payment_enabled ? '#10b981' : '#f59e0b',
                        color: '#fff'
                      }}>
                        {systemStatus.payment_enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p style={{ color: C.textSec, fontSize: 12, marginBottom: 12 }}>
                      {systemStatus.payment_enabled 
                        ? 'Monnify & wallet funding is active.'
                        : 'Users cannot fund wallets or receive payments.'}
                    </p>
                    <button 
                      onClick={() => { setShutdownAction('payment'); setShowShutdownModal(true); }}
                      style={{ 
                        width: '100%', 
                        padding: 10, 
                        borderRadius: 8, 
                        border: 'none', 
                        background: systemStatus.payment_enabled ? '#f59e0b' : '#10b981', 
                        color: '#fff', 
                        fontWeight: 600, 
                        cursor: 'pointer' 
                      }}
                    >
                      {systemStatus.payment_enabled ? '⏸️ Disable Payments' : '▶️ Enable Payments'}
                    </button>
                  </div>
                </div>
              </div>

              {/* PRICING */}
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>💰 Pricing Configuration</h3>
                
                {/* VTU Markups - Row 1 */}
                <p style={{ color: C.textSec, fontSize: 13, marginBottom: 12, fontWeight: 600 }}>VTU Services (% Markup)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', color: C.textSec, fontSize: 12, marginBottom: 6 }}>📱 Airtime Markup (%)</label>
                    <input 
                      type="number" 
                      value={pricing.airtime_markup} 
                      onChange={e => setPricing({ ...pricing, airtime_markup: parseFloat(e.target.value) || 0 })} 
                      style={{ width: '100%', padding: 12, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.text, boxSizing: 'border-box' }} 
                    />
                    <p style={{ color: C.textMuted, fontSize: 10, marginTop: 4 }}>Added to airtime purchases</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: C.textSec, fontSize: 12, marginBottom: 6 }}>📶 Data Markup (%)</label>
                    <input 
                      type="number" 
                      value={pricing.data_markup} 
                      onChange={e => setPricing({ ...pricing, data_markup: parseFloat(e.target.value) || 0 })} 
                      style={{ width: '100%', padding: 12, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.text, boxSizing: 'border-box' }} 
                    />
                    <p style={{ color: C.textMuted, fontSize: 10, marginTop: 4 }}>Added to data purchases</p>
                  </div>
                </div>

                {/* Bill Payments - Row 2 */}
                <p style={{ color: C.textSec, fontSize: 13, marginBottom: 12, fontWeight: 600 }}>Bill Payments (% Markup)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', color: C.textSec, fontSize: 12, marginBottom: 6 }}>⚡ Electricity Markup (%)</label>
                    <input 
                      type="number" 
                      value={pricing.electricity_markup} 
                      onChange={e => setPricing({ ...pricing, electricity_markup: parseFloat(e.target.value) || 0 })} 
                      style={{ width: '100%', padding: 12, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.text, boxSizing: 'border-box' }} 
                    />
                    <p style={{ color: C.textMuted, fontSize: 10, marginTop: 4 }}>Added to electricity bills</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: C.textSec, fontSize: 12, marginBottom: 6 }}>📺 Cable TV Markup (%)</label>
                    <input 
                      type="number" 
                      value={pricing.cable_markup} 
                      onChange={e => setPricing({ ...pricing, cable_markup: parseFloat(e.target.value) || 0 })} 
                      style={{ width: '100%', padding: 12, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.text, boxSizing: 'border-box' }} 
                    />
                    <p style={{ color: C.textMuted, fontSize: 10, marginTop: 4 }}>Added to cable subscriptions</p>
                  </div>
                </div>

                {/* KYC Profit - Row 3 */}
                <p style={{ color: C.textSec, fontSize: 13, marginBottom: 12, fontWeight: 600 }}>KYC Services (Fixed Amount)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', color: C.textSec, fontSize: 12, marginBottom: 6 }}>🪪 KYC Profit (₦)</label>
                    <input 
                      type="number" 
                      value={pricing.kyc_profit} 
                      onChange={e => setPricing({ ...pricing, kyc_profit: parseFloat(e.target.value) || 0 })} 
                      style={{ width: '100%', padding: 12, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.text, boxSizing: 'border-box' }} 
                    />
                    <p style={{ color: C.textMuted, fontSize: 10, marginTop: 4 }}>Fixed profit per KYC verification</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bgGlass, borderRadius: 10, padding: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ color: C.textMuted, fontSize: 11 }}>Current Settings</p>
                      <p style={{ color: C.text, fontSize: 12, marginTop: 4 }}>
                        Airtime: {pricing.airtime_markup}% | Data: {pricing.data_markup}%
                      </p>
                      <p style={{ color: C.text, fontSize: 12 }}>
                        Electric: {pricing.electricity_markup}% | Cable: {pricing.cable_markup}%
                      </p>
                      <p style={{ color: C.success, fontSize: 12 }}>
                        KYC: ₦{pricing.kyc_profit} profit
                      </p>
                    </div>
                  </div>
                </div>
                
                <button onClick={savePricing} style={{ width: '100%', padding: 14, borderRadius: 10, background: C.grad1, color: '#fff', border: 'none', marginTop: 20, fontWeight: 600, cursor: 'pointer' }}>
                  💾 Save Pricing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* USER MODAL */}
      {selUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.bgCard, borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700 }}>User Details</h2>
              <button onClick={() => setSelUser(null)} style={{ padding: 8, borderRadius: 8, background: C.bgGlass, border: 'none', color: C.text, cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div><p style={{ color: C.textMuted, fontSize: 11 }}>Name</p><p style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>{selUser.user?.firstName || selUser.user?.first_name} {selUser.user?.lastName || selUser.user?.last_name}</p></div>
                <div><p style={{ color: C.textMuted, fontSize: 11 }}>Status</p><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: selUser.user?.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: selUser.user?.status === 'active' ? '#10b981' : '#ef4444' }}>{selUser.user?.status}</span></div>
                <div><p style={{ color: C.textMuted, fontSize: 11 }}>Email</p><p style={{ color: C.text, fontSize: 13 }}>{selUser.user?.email}</p></div>
                <div><p style={{ color: C.textMuted, fontSize: 11 }}>Phone</p><p style={{ color: C.text, fontSize: 13 }}>{selUser.user?.phone}</p></div>
                <div><p style={{ color: C.textMuted, fontSize: 11 }}>Balance</p><p style={{ color: C.success, fontSize: 18, fontWeight: 700 }}>{formatNaira(selUser.user?.balance)}</p></div>
                <div><p style={{ color: C.textMuted, fontSize: 11 }}>Joined</p><p style={{ color: C.text, fontSize: 13 }}>{selUser.user?.createdAt ? new Date(selUser.user.createdAt).toLocaleDateString() : 'N/A'}</p></div>
              </div>
              
              {/* Virtual Account Info */}
              {selUser.user?.virtual_account_number && (
                <div style={{ background: C.bgGlass, borderRadius: 10, padding: 12, marginBottom: 16 }}>
                  <p style={{ color: C.textMuted, fontSize: 11, marginBottom: 6 }}>Virtual Account</p>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{selUser.user.virtual_account_number}</p>
                  <p style={{ color: C.textSec, fontSize: 12 }}>{selUser.user.virtual_account_bank}</p>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button onClick={() => { setCreditAction('credit'); setShowCreditModal(true); }} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', fontWeight: 600, cursor: 'pointer' }}>💰 Credit</button>
                <button onClick={() => { setCreditAction('debit'); setShowCreditModal(true); }} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', fontWeight: 600, cursor: 'pointer' }}>💸 Debit</button>
              </div>

              <button onClick={() => toggleStatus(selUser.user.id, selUser.user.status === 'active' ? 'blocked' : 'active')} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: selUser.user?.status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: selUser.user?.status === 'active' ? '#ef4444' : '#10b981', fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>
                {selUser.user?.status === 'active' ? '🚫 Block User' : '✅ Unblock User'}
              </button>

              {/* DELETE ACCOUNT BUTTON */}
              <button 
                onClick={() => setShowDeleteModal(true)} 
                style={{ 
                  width: '100%', 
                  padding: 14, 
                  borderRadius: 12, 
                  border: '2px solid #ef4444', 
                  background: 'transparent', 
                  color: '#ef4444', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                🗑️ Delete Account Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREDIT/DEBIT MODAL */}
      {showCreditModal && selUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 20 }}>
          <div style={{ background: C.bgCard, borderRadius: 20, width: '100%', maxWidth: 380, padding: 24 }}>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{creditAction === 'credit' ? '💰 Credit' : '💸 Debit'} {selUser.user?.firstName || selUser.user?.first_name}</h2>
            <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="Amount (₦)" style={{ width: '100%', padding: 14, borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`, color: C.text, marginBottom: 12, boxSizing: 'border-box' }} />
            <input type="text" value={creditReason} onChange={e => setCreditReason(e.target.value)} placeholder="Reason (e.g. Refund)" style={{ width: '100%', padding: 14, borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`, color: C.text, marginBottom: 20, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowCreditModal(false)} style={{ flex: 1, padding: 12, background: C.bgGlass, color: C.text, border: 'none', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreditDebit} style={{ flex: 1, padding: 12, background: C.grad1, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && selUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002, padding: 20, overflow: 'auto' }}>
          <div style={{ background: C.bgCard, borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: '90vh', overflow: 'auto', margin: 'auto' }}>
            <div style={{ padding: 24 }}>
              {/* Warning Header */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: 16, 
                  background: 'rgba(239,68,68,0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 16px', 
                  fontSize: 28 
                }}>
                  ⚠️
                </div>
                <h2 style={{ color: '#ef4444', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete User Account</h2>
                <p style={{ color: C.textSec, fontSize: 13 }}>This action is <strong style={{ color: '#ef4444' }}>permanent</strong></p>
              </div>

              {/* User Info */}
              <div style={{ 
                background: 'rgba(239,68,68,0.1)', 
                border: '1px solid rgba(239,68,68,0.3)', 
                borderRadius: 12, 
                padding: 14, 
                marginBottom: 16 
              }}>
                <p style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                  {selUser.user?.firstName || selUser.user?.first_name} {selUser.user?.lastName || selUser.user?.last_name}
                </p>
                <p style={{ color: C.textSec, fontSize: 12 }}>📧 {selUser.user?.email}</p>
                <p style={{ color: C.textSec, fontSize: 12 }}>📱 {selUser.user?.phone}</p>
                <p style={{ color: C.success, fontSize: 13, fontWeight: 600, marginTop: 6 }}>💰 Balance: {formatNaira(selUser.user?.balance)}</p>
              </div>

              {/* Warning List */}
              <div style={{ 
                background: C.bgGlass, 
                borderRadius: 10, 
                padding: 12, 
                marginBottom: 16 
              }}>
                <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>This will permanently delete:</p>
                <ul style={{ color: C.textSec, fontSize: 11, margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                  <li>User account and profile</li>
                  <li>All transaction history</li>
                  <li>Virtual account (if any)</li>
                  <li>Activity logs for this user</li>
                  <li>Wallet balance: <strong style={{ color: '#ef4444' }}>{formatNaira(selUser.user?.balance)}</strong></li>
                </ul>
              </div>

              {/* Confirmation Inputs */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', color: C.textSec, fontSize: 11, marginBottom: 6 }}>
                  Type email to confirm: <strong style={{ color: C.text }}>{selUser.user?.email}</strong>
                </label>
                <input
                  type="text"
                  value={deleteConfirmEmail}
                  onChange={e => setDeleteConfirmEmail(e.target.value)}
                  placeholder="Type email here..."
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    borderRadius: 10, 
                    background: C.bg, 
                    border: `1px solid ${deleteConfirmEmail === selUser.user?.email ? '#10b981' : C.border}`, 
                    color: C.text, 
                    boxSizing: 'border-box',
                    fontSize: 13
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: C.textSec, fontSize: 11, marginBottom: 6 }}>
                  Admin Password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && deleteConfirmEmail === selUser.user?.email && handleDeleteUser()}
                  placeholder="Enter admin password"
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    borderRadius: 10, 
                    background: C.bg, 
                    border: `1px solid ${C.border}`, 
                    color: C.text, 
                    boxSizing: 'border-box',
                    fontSize: 13
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => { 
                    setShowDeleteModal(false); 
                    setDeletePassword(''); 
                    setDeleteConfirmEmail(''); 
                  }} 
                  style={{ 
                    flex: 1, 
                    padding: 12, 
                    background: C.bgGlass, 
                    color: C.text, 
                    border: 'none', 
                    borderRadius: 10, 
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteUser}
                  disabled={deleting || deleteConfirmEmail !== selUser.user?.email || !deletePassword}
                  style={{ 
                    flex: 1, 
                    padding: 12, 
                    background: (deleteConfirmEmail === selUser.user?.email && deletePassword) ? '#ef4444' : C.border, 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 10, 
                    fontWeight: 600, 
                    fontSize: 13,
                    cursor: (deleteConfirmEmail === selUser.user?.email && deletePassword && !deleting) ? 'pointer' : 'not-allowed',
                    opacity: deleting ? 0.7 : 1
                  }}
                >
                  {deleting ? 'Deleting...' : '🗑️ Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM CONTROL MODAL */}
      {showShutdownModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 20 }}>
          <div style={{ background: C.bgCard, borderRadius: 20, width: '100%', maxWidth: 400, padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ 
                width: 60, 
                height: 60, 
                borderRadius: 16, 
                background: shutdownAction === 'maintenance' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px', 
                fontSize: 28 
              }}>
                {shutdownAction === 'maintenance' ? '🚧' : '💳'}
              </div>
              <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                {shutdownAction === 'maintenance' 
                  ? (systemStatus.maintenance_mode ? 'Disable Maintenance Mode?' : 'Enable Maintenance Mode?')
                  : (systemStatus.payment_enabled ? 'Disable Payments?' : 'Enable Payments?')}
              </h2>
              <p style={{ color: C.textSec, fontSize: 13 }}>
                {shutdownAction === 'maintenance' 
                  ? (systemStatus.maintenance_mode 
                      ? 'This will allow users to access the app again.'
                      : 'This will prevent all users from accessing the app.')
                  : (systemStatus.payment_enabled 
                      ? 'This will disable Monnify and wallet funding.'
                      : 'This will re-enable Monnify and wallet funding.')}
              </p>
            </div>
            
            <div style={{ 
              background: 'rgba(239,68,68,0.1)', 
              border: '1px solid rgba(239,68,68,0.3)', 
              borderRadius: 10, 
              padding: 12, 
              marginBottom: 16 
            }}>
              <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>
                ⚠️ Enter admin password to confirm this action
              </p>
            </div>
            
            <input 
              type="password" 
              value={shutdownPassword} 
              onChange={e => setShutdownPassword(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSystemToggle()}
              placeholder="Admin Password" 
              autoFocus
              style={{ width: '100%', padding: 14, borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`, color: C.text, marginBottom: 20, boxSizing: 'border-box' }} 
            />
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => { setShowShutdownModal(false); setShutdownPassword(''); }} 
                style={{ flex: 1, padding: 12, background: C.bgGlass, color: C.text, border: 'none', borderRadius: 10, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSystemToggle} 
                style={{ 
                  flex: 1, 
                  padding: 12, 
                  background: shutdownAction === 'maintenance' 
                    ? (systemStatus.maintenance_mode ? '#10b981' : '#ef4444')
                    : (systemStatus.payment_enabled ? '#f59e0b' : '#10b981'), 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 10, 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT FORM MODAL */}
      {showAnnForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 20 }}>
          <div style={{ background: C.bgCard, borderRadius: 20, width: '100%', maxWidth: 400, padding: 24 }}>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 20 }}>New Announcement</h2>
            <input value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} placeholder="Title" style={{ width: '100%', padding: 12, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.text, marginBottom: 12, boxSizing: 'border-box' }} />
            <textarea value={newAnn.message} onChange={e => setNewAnn({...newAnn, message: e.target.value})} placeholder="Message" style={{ width: '100%', padding: 12, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.text, marginBottom: 12, minHeight: 100, boxSizing: 'border-box' }} />
            <select value={newAnn.type} onChange={e => setNewAnn({...newAnn, type: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.text, marginBottom: 20, boxSizing: 'border-box' }}>
                <option value="info">Info (Blue)</option>
                <option value="success">Success (Green)</option>
                <option value="warning">Warning (Yellow)</option>
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowAnnForm(false)} style={{ flex: 1, padding: 12, background: C.bgGlass, color: C.text, border: 'none', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
                <button onClick={createAnn} style={{ flex: 1, padding: 12, background: C.grad1, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

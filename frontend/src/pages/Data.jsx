import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { C, formatNaira, useUser } from '../App';
import { ArrowLeft, Wifi, Check, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

export default function Data() {
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const [networks, setNetworks] = useState([]);
  const [network, setNetwork] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState({});

  useEffect(() => { api.get('/vtu/networks').then(r => setNetworks(r.data.networks)); }, []);
  
  useEffect(() => {
    if (network) {
      api.get(`/vtu/data-plans/${network.id}`).then(r => {
        setPlans(r.data.plans);
        setPlan(null);
        setExpandedTypes({});
      });
    }
  }, [network]);

  // Group plans by type
  const groupedPlans = plans.reduce((acc, p) => {
    const type = p.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(p);
    return acc;
  }, {});

  // Sort types in preferred order
  const typeOrder = ['SME', 'SME2', 'Corporate Gifting', 'Data Coupons', 'Gifting', 'Gifting (Awoof)', 'Awoof Data', 'Other'];
  const sortedTypes = Object.keys(groupedPlans).sort((a, b) => {
    const aIdx = typeOrder.indexOf(a);
    const bIdx = typeOrder.indexOf(b);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  const toggleType = (type) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const buy = async () => {
    if (!network || phone.length !== 11 || !plan) {
      setError('Please fill all fields correctly'); return;
    }
    if (plan.price > user.balance) {
      setError('Insufficient balance'); return;
    }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/vtu/data', { network: network.id, phone, planId: plan.id });
      setSuccess(res.data);
      await refreshUser();
    } catch (e) { setError(e.response?.data?.error || 'Purchase failed'); }
    setLoading(false);
  };

  // Type badge colors
  const getTypeColor = (type) => {
    const colors = {
      'SME': '#10B981',
      'SME2': '#059669',
      'Corporate Gifting': '#8B5CF6',
      'Data Coupons': '#F59E0B',
      'Gifting': '#EC4899',
      'Gifting (Awoof)': '#EF4444',
      'Awoof Data': '#EF4444',
    };
    return colors[type] || '#6B7280';
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: C.grad3, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}><Check size={40} color="#fff" /></div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: C.text }}>Success!</h2>
        <p style={{ color: C.textSec, marginBottom: 24 }}>Data sent successfully</p>
        <div style={{ width: '100%', maxWidth: 340, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          {[['Reference', success.reference], ['Plan', success.plan], ['Amount', formatNaira(success.amount)], ['Phone', success.phone], ['New Balance', formatNaira(success.newBalance)]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.borderLight}` }}>
              <span style={{ color: C.textMuted, fontSize: 13 }}>{k}</span>
              <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ width: '100%', maxWidth: 340, padding: 16, borderRadius: 14, border: 'none', background: C.grad1, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Done</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 40 }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{ width: 44, height: 44, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Buy Data</h1>
            <p style={{ color: C.textSec, fontSize: 13 }}>Affordable data bundles</p>
          </div>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 14, marginBottom: 20, color: C.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}><AlertCircle size={18} /> {error}</div>}

        {/* Network Selection */}
        <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Select Network</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {networks.map(n => (
            <button key={n.id} onClick={() => setNetwork(n)} style={{ padding: '18px 10px', borderRadius: 16, background: network?.id === n.id ? `${n.color}15` : C.bgCard, border: network?.id === n.id ? `2px solid ${n.color}` : `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: n.color, margin: '0 auto 10px', boxShadow: network?.id === n.id ? `0 0 12px ${n.color}60` : 'none' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: network?.id === n.id ? n.color : C.textSec }}>{n.name}</span>
            </button>
          ))}
        </div>

        {/* Phone Input */}
        <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Phone Number</label>
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Wifi size={18} color={C.textMuted} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="08012345678" style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 15 }} />
        </div>

        {/* Plan Selection */}
        {network && plans.length > 0 && (
          <>
            <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Select Data Plan</label>
            
            {/* Dropdown Trigger */}
            <button onClick={() => setShowPlans(!showPlans)} style={{ width: '100%', padding: 18, borderRadius: 14, background: C.bgCard, border: `1px solid ${plan ? C.primary : C.border}`, color: plan ? C.text : C.textMuted, fontSize: 15, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              {plan ? (
                <div>
                  <span style={{ fontWeight: 600 }}>{plan.size}</span>
                  <span style={{ color: C.textMuted, fontSize: 13, marginLeft: 8 }}>({plan.validity})</span>
                  <span style={{ color: C.primary, fontWeight: 700, marginLeft: 12 }}>{formatNaira(plan.price)}</span>
                </div>
              ) : (
                <span>Choose a plan</span>
              )}
              <ChevronDown size={20} style={{ transform: showPlans ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Plan List - Grouped by Type */}
            {showPlans && (
              <div style={{ maxHeight: 400, overflowY: 'auto', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 20 }}>
                {sortedTypes.map(type => (
                  <div key={type}>
                    {/* Type Header - Collapsible */}
                    <button 
                      onClick={() => toggleType(type)} 
                      style={{ 
                        width: '100%', 
                        padding: '14px 16px', 
                        background: 'rgba(139,92,246,0.05)', 
                        borderBottom: `1px solid ${C.borderLight}`, 
                        cursor: 'pointer', 
                        textAlign: 'left', 
                        border: 'none', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ 
                          background: getTypeColor(type), 
                          color: '#fff', 
                          padding: '4px 10px', 
                          borderRadius: 6, 
                          fontSize: 11, 
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {type}
                        </span>
                        <span style={{ color: C.textMuted, fontSize: 12 }}>
                          {groupedPlans[type].length} plans
                        </span>
                      </div>
                      <ChevronRight 
                        size={18} 
                        color={C.textMuted}
                        style={{ 
                          transform: expandedTypes[type] ? 'rotate(90deg)' : 'none', 
                          transition: 'transform 0.2s' 
                        }} 
                      />
                    </button>

                    {/* Plans under this type */}
                    {expandedTypes[type] && groupedPlans[type].map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => { setPlan(p); setShowPlans(false); }} 
                        style={{ 
                          width: '100%', 
                          padding: '14px 16px 14px 28px', 
                          background: plan?.id === p.id ? 'rgba(139,92,246,0.1)' : 'transparent', 
                          borderBottom: `1px solid ${C.borderLight}`, 
                          cursor: 'pointer', 
                          textAlign: 'left', 
                          border: 'none', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center' 
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 2 }}>{p.size}</p>
                          <p style={{ color: C.textMuted, fontSize: 11 }}>{p.validity}</p>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 15, color: C.primary }}>{formatNaira(p.price)}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Price Summary */}
        {plan && (
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: C.textMuted, fontSize: 13 }}>Data Plan</span>
              <span style={{ color: C.text, fontSize: 13 }}>{plan.size}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: C.textMuted, fontSize: 13 }}>Type</span>
              <span style={{ 
                background: getTypeColor(plan.type), 
                color: '#fff', 
                padding: '2px 8px', 
                borderRadius: 4, 
                fontSize: 11, 
                fontWeight: 600 
              }}>{plan.type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: C.textMuted, fontSize: 13 }}>Validity</span>
              <span style={{ color: C.textSec, fontSize: 13 }}>{plan.validity}</span>
            </div>
            {plan.note && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <span style={{ color: '#F59E0B', fontSize: 12 }}>⚠️ {plan.note}</span>
              </div>
            )}
            <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Total</span>
              <span style={{ color: C.primary, fontSize: 16, fontWeight: 700 }}>{formatNaira(plan.price)}</span>
            </div>
          </div>
        )}

        {/* Balance Warning */}
        {plan && plan.price > user?.balance && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14, marginBottom: 20, color: C.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} /> Insufficient balance. Current: {formatNaira(user?.balance)}
          </div>
        )}

        {/* Buy Button */}
        <button onClick={buy} disabled={!network || phone.length !== 11 || !plan || plan?.price > user?.balance || loading} style={{ width: '100%', padding: 18, borderRadius: 14, border: 'none', background: C.grad1, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', opacity: (!network || phone.length !== 11 || !plan || plan?.price > user?.balance || loading) ? 0.5 : 1 }}>
          {loading ? 'Processing...' : `Buy Data • ${plan ? formatNaira(plan.price) : '₦0'}`}
        </button>
      </div>
    </div>
  );
}

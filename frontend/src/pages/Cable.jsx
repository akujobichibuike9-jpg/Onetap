import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { C, formatNaira, useUser } from '../App';
import { ArrowLeft, Tv, Check, AlertCircle, ChevronDown } from 'lucide-react';

export default function Cable() {
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [card, setCard] = useState('');
  const [verified, setVerified] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const [markup, setMarkup] = useState(0);

  useEffect(() => { 
    api.get('/bills/cable/providers').then(r => setProviders(r.data.providers)); 
    api.get('/settings/pricing').then(r => setMarkup(r.data.cable_markup || 0)).catch(() => {});
  }, []);
  
  useEffect(() => { 
    if (provider) {
      api.get(`/bills/cable/plans/${provider.id}`).then(r => { 
        // Apply markup to plans
        const plansWithMarkup = (r.data.plans || []).map(p => ({
          ...p,
          price: Math.ceil(p.price * (1 + markup/100))
        }));
        setPlans(plansWithMarkup); 
        setPlan(null); 
      }); 
    }
  }, [provider, markup]);

  const verify = async () => {
    if (!provider || !card) return;
    setVerifying(true); setError('');
    try {
      const res = await api.post('/bills/cable/verify', { provider: provider.id, smartcardNumber: card });
      setVerified(res.data);
    } catch (e) { setError(e.response?.data?.error || 'Verification failed'); }
    setVerifying(false);
  };

  const pay = async () => {
    if (!verified || !plan) {
      setError('Please verify smartcard and select a plan'); return;
    }
    if (plan.price > user.balance) {
      setError('Insufficient balance'); return;
    }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/bills/cable/pay', { provider: provider.id, smartcardNumber: card, planId: plan.id });
      setSuccess(res.data);
      await refreshUser();
    } catch (e) { setError(e.response?.data?.error || 'Payment failed'); }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: C.grad3, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}><Check size={40} color="#fff" /></div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: C.text }}>Subscription Successful!</h2>
        <p style={{ color: C.textSec, marginBottom: 24 }}>Your subscription is now active</p>
        <div style={{ width: '100%', maxWidth: 340, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          {[['Reference', success.reference], ['Plan', success.plan], ['Amount', formatNaira(success.amount)], ['New Balance', formatNaira(success.newBalance)]].map(([k, v]) => (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{ width: 44, height: 44, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Cable TV</h1>
            <p style={{ color: C.textSec, fontSize: 13 }}>DStv, GOtv, Startimes</p>
          </div>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 14, marginBottom: 20, color: C.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}><AlertCircle size={18} /> {error}</div>}

        {/* Provider Selection */}
        <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Select Provider</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {providers.map(p => (
            <button key={p.id} onClick={() => { setProvider(p); setVerified(null); }} style={{ padding: '18px 12px', borderRadius: 14, background: provider?.id === p.id ? 'rgba(139,92,246,0.12)' : C.bgCard, border: provider?.id === p.id ? `2px solid ${C.primary}` : `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: provider?.id === p.id ? C.primary : C.textSec }}>{p.name}</span>
            </button>
          ))}
        </div>

        {/* Smartcard Number */}
        <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Smartcard / IUC Number</label>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Tv size={18} color={C.textMuted} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={card} onChange={e => { setCard(e.target.value.replace(/\D/g, '')); setVerified(null); }} placeholder="Enter smartcard number" style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 15 }} />
        </div>

        {/* Verify Button */}
        {provider && card && !verified && (
          <button onClick={verify} disabled={verifying} style={{ width: '100%', padding: 16, borderRadius: 12, background: C.bgCard, border: `1px solid ${C.primary}`, color: C.primary, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20, opacity: verifying ? 0.7 : 1 }}>{verifying ? 'Verifying...' : 'Verify Smartcard'}</button>
        )}

        {/* Verified Info */}
        {verified && (
          <>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Check size={20} color={C.success} />
              <div>
                <p style={{ color: C.success, fontSize: 14, fontWeight: 600 }}>{verified.customerName}</p>
                <p style={{ color: C.textMuted, fontSize: 12 }}>Card: {verified.smartcardNumber}</p>
              </div>
            </div>

            {/* Plan Selection */}
            <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Select Package</label>
            <button onClick={() => setShowPlans(!showPlans)} style={{ width: '100%', padding: 18, borderRadius: 14, background: C.bgCard, border: `1px solid ${plan ? C.primary : C.border}`, color: plan ? C.text : C.textMuted, fontSize: 15, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              {plan ? <span>{plan.name} - {formatNaira(plan.price)}</span> : <span>Choose a package</span>}
              <ChevronDown size={20} style={{ transform: showPlans ? 'rotate(180deg)' : 'none' }} />
            </button>

            {showPlans && (
              <div style={{ maxHeight: 280, overflowY: 'auto', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 20 }}>
                {plans.map(p => (
                  <button key={p.id} onClick={() => { setPlan(p); setShowPlans(false); }} style={{ width: '100%', padding: 16, background: plan?.id === p.id ? 'rgba(139,92,246,0.1)' : 'transparent', borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer', textAlign: 'left', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: C.text, fontSize: 14 }}>{p.name}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: C.primary }}>{formatNaira(p.price)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Price Summary */}
            {plan && (
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: C.textMuted, fontSize: 13 }}>Package</span>
                  <span style={{ color: C.text, fontSize: 13 }}>{plan.name}</span>
                </div>
                <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Total</span>
                  <span style={{ color: C.primary, fontSize: 16, fontWeight: 700 }}>{formatNaira(plan.price)}</span>
                </div>
              </div>
            )}

            {plan && plan.price > user?.balance && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14, marginBottom: 20, color: C.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={18} /> Insufficient balance. Current: {formatNaira(user?.balance)}
              </div>
            )}

            <button onClick={pay} disabled={!plan || plan?.price > user?.balance || loading} style={{ width: '100%', padding: 18, borderRadius: 14, border: 'none', background: C.grad1, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', opacity: (!plan || plan?.price > user?.balance || loading) ? 0.5 : 1 }}>
              {loading ? 'Processing...' : `Subscribe • ${plan ? formatNaira(plan.price) : '₦0'}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

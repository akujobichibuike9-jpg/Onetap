import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { C, formatNaira, useUser } from '../App';
import { ArrowLeft, Zap, Check, AlertCircle, ChevronDown } from 'lucide-react';

export default function Electricity() {
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const [discos, setDiscos] = useState([]);
  const [disco, setDisco] = useState(null);
  const [meter, setMeter] = useState('');
  const [meterType, setMeterType] = useState('prepaid');
  const [amount, setAmount] = useState('');
  const [verified, setVerified] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [showDiscos, setShowDiscos] = useState(false);
  const [markup, setMarkup] = useState(15);

  useEffect(() => { 
    api.get('/bills/electricity/discos').then(r => setDiscos(r.data.discos));
    api.get('/settings/pricing').then(r => setMarkup(r.data.electricity_markup || 15)).catch(() => {});
  }, []);

  const sellingPrice = amount ? Math.ceil(+amount * (1 + markup/100)) : 0;

  const verify = async () => {
    if (!disco || !meter) return;
    setVerifying(true); setError('');
    try {
      const res = await api.post('/bills/electricity/verify', { disco: disco.id, meterNumber: meter, meterType });
      setVerified(res.data);
    } catch (e) { setError(e.response?.data?.error || 'Verification failed'); }
    setVerifying(false);
  };

  const pay = async () => {
    if (!verified || !amount || +amount < 500) {
      setError('Please complete verification and enter amount (min ₦500)'); return;
    }
    if (sellingPrice > user.balance) {
      setError('Insufficient balance'); return;
    }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/bills/electricity/pay', { disco: disco.id, meterNumber: meter, amount: sellingPrice, meterType });
      setSuccess(res.data);
      await refreshUser();
    } catch (e) { setError(e.response?.data?.error || 'Payment failed'); }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: C.grad3, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}><Check size={40} color="#fff" /></div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: C.text }}>Payment Successful!</h2>
        <p style={{ color: C.textSec, marginBottom: 24 }}>Your token has been generated</p>
        <div style={{ width: '100%', maxWidth: 380, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ background: 'rgba(139,92,246,0.1)', borderRadius: 12, padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 8 }}>Your Token</p>
            <p style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: C.primary, letterSpacing: 2 }}>{success.token}</p>
          </div>
          {[['Reference', success.reference], ['Amount', formatNaira(success.amount)], ['New Balance', formatNaira(success.newBalance)]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.borderLight}` }}>
              <span style={{ color: C.textMuted, fontSize: 13 }}>{k}</span>
              <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ width: '100%', maxWidth: 380, padding: 16, borderRadius: 14, border: 'none', background: C.grad1, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Done</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 40 }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{ width: 44, height: 44, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Electricity</h1>
            <p style={{ color: C.textSec, fontSize: 13 }}>Pay electricity bills</p>
          </div>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 14, marginBottom: 20, color: C.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}><AlertCircle size={18} /> {error}</div>}

        {/* DisCo Selection */}
        <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Select Distribution Company</label>
        <button onClick={() => setShowDiscos(!showDiscos)} style={{ width: '100%', padding: 18, borderRadius: 14, background: C.bgCard, border: `1px solid ${disco ? C.primary : C.border}`, color: disco ? C.text : C.textMuted, fontSize: 15, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          {disco ? disco.name : 'Choose DisCo'}
          <ChevronDown size={20} style={{ transform: showDiscos ? 'rotate(180deg)' : 'none' }} />
        </button>
        {showDiscos && (
          <div style={{ maxHeight: 240, overflowY: 'auto', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 20 }}>
            {discos.map(d => (
              <button key={d.id} onClick={() => { setDisco(d); setShowDiscos(false); setVerified(null); }} style={{ width: '100%', padding: 16, background: disco?.id === d.id ? 'rgba(139,92,246,0.1)' : 'transparent', borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer', textAlign: 'left', border: 'none', color: C.text, fontSize: 14 }}>
                {d.name}
              </button>
            ))}
          </div>
        )}

        {/* Meter Type */}
        <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Meter Type</label>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {['prepaid', 'postpaid'].map(t => (
            <button key={t} onClick={() => setMeterType(t)} style={{ flex: 1, padding: 16, borderRadius: 12, background: meterType === t ? 'rgba(139,92,246,0.12)' : C.bgCard, border: meterType === t ? `2px solid ${C.primary}` : `1px solid ${C.border}`, color: meterType === t ? C.primary : C.textSec, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>

        {/* Meter Number */}
        <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Meter Number</label>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Zap size={18} color={C.textMuted} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={meter} onChange={e => { setMeter(e.target.value.replace(/\D/g, '')); setVerified(null); }} placeholder="Enter meter number" style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 15 }} />
        </div>

        {/* Verify Button */}
        {disco && meter && !verified && (
          <button onClick={verify} disabled={verifying} style={{ width: '100%', padding: 16, borderRadius: 12, background: C.bgCard, border: `1px solid ${C.primary}`, color: C.primary, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20, opacity: verifying ? 0.7 : 1 }}>{verifying ? 'Verifying...' : 'Verify Meter'}</button>
        )}

        {/* Verified Info */}
        {verified && (
          <>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Check size={20} color={C.success} />
              <div>
                <p style={{ color: C.success, fontSize: 14, fontWeight: 600 }}>{verified.customerName}</p>
                <p style={{ color: C.textMuted, fontSize: 12 }}>Meter: {verified.meterNumber}</p>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Amount (min ₦500)</label>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: C.textMuted }}>₦</span>
              <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="Enter amount" style={{ width: '100%', padding: '18px 18px 18px 46px', borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 15 }} />
            </div>

            {/* Quick Amounts */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {[1000, 2000, 5000, 10000, 20000].map(a => (
                <button key={a} onClick={() => setAmount(String(a))} style={{ padding: '10px 16px', borderRadius: 10, background: amount === String(a) ? C.primary : C.bgCard, border: `1px solid ${amount === String(a) ? C.primary : C.border}`, color: amount === String(a) ? '#fff' : C.textSec, fontSize: 13, cursor: 'pointer' }}>{formatNaira(a)}</button>
              ))}
            </div>

            {/* Price Summary */}
            {amount && +amount >= 500 && (
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: C.textMuted, fontSize: 13 }}>Unit Value</span>
                  <span style={{ color: C.text, fontSize: 13 }}>{formatNaira(amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: C.textMuted, fontSize: 13 }}>Service Fee</span>
                  <span style={{ color: C.textSec, fontSize: 13 }}>{formatNaira(sellingPrice - +amount)}</span>
                </div>
                <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Total</span>
                  <span style={{ color: C.primary, fontSize: 16, fontWeight: 700 }}>{formatNaira(sellingPrice)}</span>
                </div>
              </div>
            )}

            {sellingPrice > user?.balance && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14, marginBottom: 20, color: C.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={18} /> Insufficient balance. Current: {formatNaira(user?.balance)}
              </div>
            )}

            <button onClick={pay} disabled={!amount || +amount < 500 || sellingPrice > user?.balance || loading} style={{ width: '100%', padding: 18, borderRadius: 14, border: 'none', background: C.grad1, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', opacity: (!amount || +amount < 500 || sellingPrice > user?.balance || loading) ? 0.5 : 1 }}>
              {loading ? 'Processing...' : `Pay • ${formatNaira(sellingPrice)}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

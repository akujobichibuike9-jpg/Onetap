import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { C, formatNaira, useUser } from '../App';
import { ArrowLeft, Phone, Check, AlertCircle } from 'lucide-react';

export default function Airtime() {
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const [networks, setNetworks] = useState([]);
  const [network, setNetwork] = useState(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [markup, setMarkup] = useState(2);

  useEffect(() => { 
    api.get('/vtu/networks').then(r => setNetworks(r.data.networks)); 
    api.get('/settings/pricing').then(r => setMarkup(r.data.vtu_markup || 2)).catch(() => {});
  }, []);

  const sellingPrice = amount ? Math.ceil(+amount * (1 + markup/100)) : 0;

  const buy = async () => {
    if (!network || phone.length !== 11 || !amount || +amount < 50) {
      setError('Please fill all fields correctly'); return;
    }
    if (sellingPrice > user.balance) {
      setError('Insufficient balance'); return;
    }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/vtu/airtime', { network: network.id, phone, amount: sellingPrice });
      setSuccess(res.data);
      await refreshUser();
    } catch (e) { setError(e.response?.data?.error || 'Purchase failed'); }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: C.grad3, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}><Check size={40} color="#fff" /></div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: C.text }}>Success!</h2>
        <p style={{ color: C.textSec, marginBottom: 24 }}>Airtime sent successfully</p>
        <div style={{ width: '100%', maxWidth: 340, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          {[['Reference', success.reference], ['Amount', formatNaira(success.amount)], ['Phone', success.phone], ['New Balance', formatNaira(success.newBalance)]].map(([k, v]) => (
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
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Buy Airtime</h1>
            <p style={{ color: C.textSec, fontSize: 13 }}>Instant airtime delivery</p>
          </div>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 14, marginBottom: 20, color: C.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}><AlertCircle size={18} /> {error}</div>}

        {/* Network Selection */}
        <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Select Network</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {networks.map(n => (
            <button key={n.id} onClick={() => setNetwork(n)} style={{ padding: '18px 10px', borderRadius: 16, background: network?.id === n.id ? `${n.color}15` : C.bgCard, border: network?.id === n.id ? `2px solid ${n.color}` : `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: n.color, margin: '0 auto 10px', boxShadow: network?.id === n.id ? `0 0 12px ${n.color}60` : 'none' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: network?.id === n.id ? n.color : C.textSec }}>{n.name}</span>
            </button>
          ))}
        </div>

        {/* Phone Input */}
        <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Phone Number</label>
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Phone size={18} color={C.textMuted} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="08012345678" style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 15 }} />
        </div>

        {/* Amount Input */}
        <label style={{ display: 'block', fontSize: 13, color: C.textSec, marginBottom: 12, fontWeight: 500 }}>Amount (min ₦50)</label>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: C.textMuted }}>₦</span>
          <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="Enter amount" style={{ width: '100%', padding: '18px 18px 18px 46px', borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, fontSize: 15 }} />
        </div>

        {/* Quick Amounts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {[50, 100, 200, 500, 1000, 2000].map(a => (
            <button key={a} onClick={() => setAmount(String(a))} style={{ padding: '10px 18px', borderRadius: 10, background: amount === String(a) ? C.primary : C.bgCard, border: `1px solid ${amount === String(a) ? C.primary : C.border}`, color: amount === String(a) ? '#fff' : C.textSec, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>₦{a.toLocaleString()}</button>
          ))}
        </div>

        {/* Price Summary */}
        {amount && +amount >= 50 && (
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: C.textMuted, fontSize: 13 }}>Airtime Value</span>
              <span style={{ color: C.text, fontSize: 13 }}>{formatNaira(amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: C.textMuted, fontSize: 13 }}>Service Fee (15%)</span>
              <span style={{ color: C.textSec, fontSize: 13 }}>{formatNaira(sellingPrice - +amount)}</span>
            </div>
            <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Total</span>
              <span style={{ color: C.primary, fontSize: 16, fontWeight: 700 }}>{formatNaira(sellingPrice)}</span>
            </div>
          </div>
        )}

        {/* Balance Warning */}
        {sellingPrice > user?.balance && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14, marginBottom: 20, color: C.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} /> Insufficient balance. Current: {formatNaira(user?.balance)}
          </div>
        )}

        {/* Buy Button */}
        <button onClick={buy} disabled={!network || phone.length !== 11 || !amount || +amount < 50 || sellingPrice > user?.balance || loading} style={{ width: '100%', padding: 18, borderRadius: 14, border: 'none', background: C.grad1, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', opacity: (!network || phone.length !== 11 || !amount || +amount < 50 || sellingPrice > user?.balance || loading) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? 'Processing...' : `Buy Airtime • ${formatNaira(sellingPrice)}`}
        </button>
      </div>
    </div>
  );
}

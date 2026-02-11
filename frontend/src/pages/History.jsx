import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { C, formatNaira } from '../App';
import { BottomNav } from './Dashboard';
import { ArrowLeft, RefreshCw, Phone, Wifi, Zap, Tv, Shield, Wallet, ArrowDownLeft, ArrowUpRight, X, Download, Share2, Copy, Check } from 'lucide-react';

export default function History() {
  const navigate = useNavigate();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, credit, debit
  const [selectedTx, setSelectedTx] = useState(null); // For receipt modal
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadTxs(); }, []);

  const loadTxs = async () => {
    setLoading(true);
    try {
      const r = await api.get('/wallet/transactions');
      setTxs(r.data.transactions || []);
    } catch {}
    setLoading(false);
  };

  const getIcon = (cat) => {
    const icons = { airtime: Phone, data: Wifi, electricity: Zap, cable: Tv, kyc: Shield, funding: Wallet, refund: ArrowDownLeft };
    return icons[cat] || Wallet;
  };

  const getColor = (cat) => {
    const colors = { airtime: '#8B5CF6', data: '#06B6D4', electricity: '#F59E0B', cable: '#EF4444', kyc: '#10B981', funding: '#22C55E', refund: '#F59E0B' };
    return colors[cat] || C.primary;
  };

  const filtered = txs.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const copyRef = (ref) => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReceipt = (tx) => {
    const text = `OneTap Receipt\n\nTransaction: ${tx.description}\nAmount: ${formatNaira(tx.amount)}\nReference: ${tx.reference}\nDate: ${formatDate(tx.created_at)}\nStatus: ${tx.status}\n\nPowered by OneTap`;
    if (navigator.share) {
      navigator.share({ title: 'OneTap Receipt', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Receipt copied to clipboard!');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer', padding: 8 }}>
            <ArrowLeft size={24} />
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Transaction History</h1>
        </div>
        <button onClick={loadTxs} style={{ background: `${C.primary}20`, border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer' }}>
          <RefreshCw size={20} color={C.primary} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 10 }}>
        {['all', 'credit', 'debit'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '10px 20px',
              borderRadius: 20,
              border: 'none',
              background: filter === f ? C.grad1 : C.bgCard,
              color: filter === f ? '#fff' : C.textSec,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f === 'all' ? 'All' : f === 'credit' ? 'Credit' : 'Debit'}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Wallet size={48} color={C.textMuted} style={{ opacity: 0.5, marginBottom: 16 }} />
            <p style={{ color: C.textMuted }}>No transactions yet</p>
          </div>
        ) : (
          filtered.map(tx => {
            const Icon = getIcon(tx.category);
            const color = getColor(tx.category);
            return (
              <button
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  marginBottom: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description}</p>
                  <p style={{ fontSize: 12, color: C.textMuted }}>{formatDate(tx.created_at)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: tx.type === 'credit' ? C.success : C.error }}>
                    {tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                  </p>
                  <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                    {tx.status === 'success' ? '✓' : '○'} {tx.status}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Receipt Modal */}
      {selectedTx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
          <div style={{ background: C.bg, borderRadius: 20, width: '100%', maxWidth: 400, maxHeight: '90vh', overflow: 'auto' }}>
            {/* Receipt Header */}
            <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Transaction Receipt</h2>
              <button onClick={() => setSelectedTx(null)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4 }}>
                <X size={24} />
              </button>
            </div>

            {/* Receipt Body */}
            <div style={{ padding: 24 }}>
              {/* Status Badge */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: selectedTx.status === 'success' ? `${C.success}20` : `${C.error}20`,
                  borderRadius: 20,
                }}>
                  {selectedTx.type === 'credit' ? <ArrowDownLeft size={18} color={C.success} /> : <ArrowUpRight size={18} color={C.error} />}
                  <span style={{ fontSize: 14, fontWeight: 600, color: selectedTx.status === 'success' ? C.success : C.error, textTransform: 'capitalize' }}>
                    {selectedTx.status}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <p style={{ fontSize: 32, fontWeight: 700, color: selectedTx.type === 'credit' ? C.success : C.text }}>
                  {selectedTx.type === 'credit' ? '+' : '-'}{formatNaira(selectedTx.amount)}
                </p>
                <p style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>{selectedTx.description}</p>
              </div>

              {/* Details */}
              <div style={{ background: C.bgCard, borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.textMuted, fontSize: 14 }}>Type</span>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{selectedTx.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.textMuted, fontSize: 14 }}>Category</span>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{selectedTx.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.textMuted, fontSize: 14 }}>Date</span>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{formatDate(selectedTx.created_at)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.textMuted, fontSize: 14 }}>Balance Before</span>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{formatNaira(selectedTx.balance_before)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.textMuted, fontSize: 14 }}>Balance After</span>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{formatNaira(selectedTx.balance_after)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                  <span style={{ color: C.textMuted, fontSize: 14 }}>Reference</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: C.text, fontSize: 12, fontWeight: 500, fontFamily: 'monospace' }}>{selectedTx.reference?.slice(0, 20)}...</span>
                    <button onClick={() => copyRef(selectedTx.reference)} style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', padding: 4 }}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => shareReceipt(selectedTx)}
                  style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Share2 size={18} /> Share
                </button>
                <button
                  onClick={() => setSelectedTx(null)}
                  style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: C.grad1, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="history" />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

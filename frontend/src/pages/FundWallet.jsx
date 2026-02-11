import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, formatNaira, useUser } from '../App';
import { ArrowLeft, Wallet, Check, AlertCircle, Copy, RefreshCw, Building2, Clock } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function FundWallet() {
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch virtual account on mount
  useEffect(() => {
    fetchVirtualAccount();
    fetchDeposits();
  }, []);

  const fetchVirtualAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/wallet/virtual-account`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.hasAccount) {
        setVirtualAccount({
          accountNumber: data.accountNumber,
          bankName: data.bankName,
          accountName: data.accountName
        });
      } else if (data.error) {
        setError(data.error);
      }
    } catch (e) {
      console.error('Fetch VA error:', e);
      setError('Failed to load account details');
    }
    setLoading(false);
  };

  const fetchDeposits = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/wallet/deposits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRecentDeposits(data.deposits || []);
    } catch (e) {
      console.error('Fetch deposits error:', e);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshBalance = async () => {
    setRefreshing(true);
    await refreshUser();
    await fetchDeposits();
    setRefreshing(false);
  };

  // Loading State
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: C.textSec }}>Loading account details...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 20 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <button onClick={() => navigate('/dashboard')} style={{ width: 42, height: 42, borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSec, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Fund Wallet</h1>
            <p style={{ color: C.textSec, fontSize: 13 }}>Add money via bank transfer</p>
          </div>
          <button 
            onClick={refreshBalance} 
            disabled={refreshing}
            style={{ width: 42, height: 42, borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}`, color: C.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
          </button>
        </div>

        {/* Current Balance */}
        <div style={{ background: C.grad1, borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 }}>Current Balance</p>
          <p style={{ color: '#fff', fontSize: 36, fontWeight: 800 }}>{formatNaira(user?.balance || 0)}</p>
        </div>

        {/* Virtual Account Card */}
        {virtualAccount ? (
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', marginBottom: 24 }}>
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.secondary} 0%, ${C.primary} 100%)`, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Building2 size={24} color="#fff" />
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Your Dedicated Account</p>
                  <p style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{virtualAccount.bankName}</p>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div style={{ padding: 20 }}>
              {/* Account Number */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 6 }}>ACCOUNT NUMBER</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <p style={{ color: C.text, fontSize: 28, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace' }}>
                    {virtualAccount.accountNumber}
                  </p>
                  <button 
                    onClick={() => copyToClipboard(virtualAccount.accountNumber)}
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: 8, 
                      border: 'none', 
                      background: copied ? C.success : C.primary, 
                      color: '#fff', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Account Name */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 6 }}>ACCOUNT NAME</p>
                <p style={{ color: C.text, fontSize: 16, fontWeight: 600 }}>{virtualAccount.accountName}</p>
              </div>

              {/* Bank Name */}
              <div>
                <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 6 }}>BANK</p>
                <p style={{ color: C.text, fontSize: 16, fontWeight: 600 }}>{virtualAccount.bankName}</p>
              </div>
            </div>

            {/* Instructions */}
            <div style={{ background: `${C.primary}10`, padding: 16, borderTop: `1px solid ${C.border}` }}>
              <p style={{ color: C.primary, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>💡 How to fund your wallet:</p>
              <ol style={{ color: C.textSec, fontSize: 13, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                <li>Copy the account number above</li>
                <li>Transfer any amount from your bank app</li>
                <li>Your wallet will be credited instantly!</li>
              </ol>
            </div>
          </div>
        ) : error ? (
          <div style={{ background: C.bgCard, border: `1px solid ${C.error}`, borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'center' }}>
            <AlertCircle size={48} color={C.error} style={{ marginBottom: 16 }} />
            <h3 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Account Not Available</h3>
            <p style={{ color: C.textMuted, fontSize: 14 }}>{error}</p>
            <button 
              onClick={fetchVirtualAccount}
              style={{ marginTop: 16, padding: '12px 24px', borderRadius: 10, border: 'none', background: C.primary, color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'center' }}>
            <Wallet size={48} color={C.textMuted} style={{ marginBottom: 16 }} />
            <h3 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Setting Up Your Account</h3>
            <p style={{ color: C.textMuted, fontSize: 14 }}>Please wait while we create your dedicated account number...</p>
          </div>
        )}

        {/* Important Notice */}
        <div style={{ background: `${C.gold}15`, border: `1px solid ${C.gold}40`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <p style={{ color: C.gold, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>⚠️ Important</p>
          <p style={{ color: C.textSec, fontSize: 12, lineHeight: 1.6 }}>
            This account is exclusively for you. Funds from any bank will be credited to your wallet automatically. 
            Only transfer from accounts in your name.
          </p>
        </div>

        {/* Recent Deposits */}
        {recentDeposits.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent Deposits</h3>
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {recentDeposits.slice(0, 5).map((deposit, i) => (
                <div 
                  key={deposit.id} 
                  style={{ 
                    padding: 14, 
                    borderBottom: i < Math.min(recentDeposits.length, 5) - 1 ? `1px solid ${C.borderLight}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.success}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Wallet size={18} color={C.success} />
                    </div>
                    <div>
                      <p style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{deposit.description}</p>
                      <p style={{ color: C.textMuted, fontSize: 12 }}>
                        {new Date(deposit.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <p style={{ color: C.success, fontSize: 15, fontWeight: 700 }}>+{formatNaira(deposit.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Notice */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <Clock size={20} color={C.textMuted} style={{ marginTop: 2 }} />
          <div>
            <p style={{ color: C.text, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Waiting for payment?</p>
            <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.5 }}>
              Transfers usually reflect within seconds. If your deposit doesn't appear after 5 minutes, 
              please contact support with your transfer receipt.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

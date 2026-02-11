import { useNavigate } from 'react-router-dom';
import { C } from '../App';
import { BottomNav } from './Dashboard';
import { Phone, Wifi, Zap, Tv, Shield, ArrowLeft, ChevronRight } from 'lucide-react';

export default function Services() {
  const navigate = useNavigate();

  const services = [
    { id: 'airtime', name: 'Airtime', desc: 'Buy airtime for any network', icon: Phone, color: '#8B5CF6', path: '/airtime' },
    { id: 'data', name: 'Data Bundles', desc: 'MTN, GLO, Airtel, 9Mobile data', icon: Wifi, color: '#06B6D4', path: '/data' },
    { id: 'electricity', name: 'Electricity', desc: 'Pay electricity bills instantly', icon: Zap, color: '#F59E0B', path: '/electricity' },
    { id: 'cable', name: 'Cable TV', desc: 'GOtv, DStv, Startimes subscriptions', icon: Tv, color: '#EF4444', path: '/cable' },
    { id: 'kyc', name: 'KYC Verification', desc: 'NIN, BVN, VNIN verification', icon: Shield, color: '#10B981', path: '/kyc' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer', padding: 8 }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>All Services</h1>
      </div>

      {/* Services List */}
      <div style={{ padding: '0 20px' }}>
        {services.map(service => (
          <button
            key={service.id}
            onClick={() => navigate(service.path)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 20,
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              marginBottom: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: `${service.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <service.icon size={26} color={service.color} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 4 }}>{service.name}</h3>
              <p style={{ fontSize: 13, color: C.textMuted }}>{service.desc}</p>
            </div>
            <ChevronRight size={20} color={C.textMuted} />
          </button>
        ))}
      </div>

      {/* Quick Info */}
      <div style={{ padding: '24px 20px' }}>
        <div style={{
          padding: 20,
          background: `linear-gradient(135deg, ${C.primary}15, ${C.secondary}15)`,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>Need Help?</h3>
          <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6 }}>
            Tap the AI assistant button on the dashboard to get help with any service. You can buy airtime, data, and pay bills just by chatting!
          </p>
        </div>
      </div>

      <BottomNav active="services" />
    </div>
  );
}

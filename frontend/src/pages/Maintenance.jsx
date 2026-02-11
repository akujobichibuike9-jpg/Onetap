import { useEffect } from 'react';
import { C } from '../App'; // Importing your colors

export default function Maintenance() {
  
  // Optional: Auto-check every 30 seconds if maintenance is over
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const r = await fetch('/api/system/status');
      const data = await r.json();
      // If maintenance is OFF, go back to home
      if (!data.maintenance_mode) {
        window.location.href = '/dashboard';
      }
    } catch (e) {
      console.log('Still offline...');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: C?.bg || '#0f172a',
      color: C?.text || '#fff',
      padding: 20,
      textAlign: 'center',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      {/* Animated Pulse Effect behind logo */}
      <div style={{ position: 'relative', marginBottom: 30 }}>
        <div style={{
          position: 'absolute',
          inset: -10,
          background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          filter: 'blur(20px)',
          opacity: 0.3,
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }}></div>
        
        <div style={{
          position: 'relative',
          width: 90,
          height: 90,
          background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 42,
          boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)'
        }}>
          ⚡
        </div>
      </div>
      
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}> We Will Be Back Shortly...</h1>
      
      <p style={{ 
        maxWidth: 400, 
        color: C?.textMuted || '#94a3b8', 
        lineHeight: 1.6, 
        marginBottom: 30,
        fontSize: 15
      }}>
        OneTap By ChiVera is currently undergoing scheduled maintenance to bring you a faster and better experience.
         
        ©ChiVera Technologies MMXXVI.
      </p>

      <div style={{ 
        padding: '10px 20px', 
        background: 'rgba(245, 158, 11, 0.1)', 
        borderRadius: 20, 
        border: '1px solid rgba(245, 158, 11, 0.2)',
        fontSize: 13,
        color: '#fbbf24',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span style={{ width: 8, height: 8, background: '#fbbf24', borderRadius: '50%' }}></span>
        Maintenance Mode Active
      </div>

      <button 
        onClick={checkStatus} 
        style={{
          marginTop: 40,
          padding: '12px 30px',
          background: 'rgba(255,255,255,0.05)',
          color: C?.text || '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        🔄 Refresh Status
      </button>

      {/* Inline Keyframes for Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
          100% { transform: scale(0.95); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
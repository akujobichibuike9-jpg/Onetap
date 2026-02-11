// src/components/InstallPWA.jsx
import { useState, useEffect } from 'react';
import { promptInstall, isAppInstalled, canInstall } from '../pwa';

export default function InstallPWA() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isAppInstalled());

    const handleInstallAvailable = () => {
      if (!isAppInstalled()) {
        // Show prompt after 30 seconds
        setTimeout(() => setShowPrompt(true), 30000);
      }
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);

    // Check immediately if prompt is already available
    if (canInstall() && !isAppInstalled()) {
      setTimeout(() => setShowPrompt(true), 30000);
    }

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if installed or dismissed
  if (isInstalled || !showPrompt) return null;

  // Check if dismissed recently (within 7 days)
  const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
  if (dismissedAt && Date.now() - parseInt(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: 16,
      right: 16,
      zIndex: 9999,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 10px 40px rgba(139, 92, 246, 0.4)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 20,
            width: 28,
            height: 28,
            color: 'white',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Icon */}
          <div style={{
            width: 56,
            height: 56,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zm-4.2-5.78v1.75l3.2-2.99L12.8 9v1.7c-3.11.43-4.35 2.56-4.8 4.7 1.11-1.5 2.58-2.18 4.8-2.18z"/>
            </svg>
          </div>
          
          {/* Text */}
          <div style={{ flex: 1 }}>
            <h3 style={{
              color: 'white',
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              marginBottom: 4
            }}>
              Install OneTap
            </h3>
            <p style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 13,
              margin: 0
            }}>
              Add to home screen for quick access
            </p>
          </div>
        </div>
        
        {/* Install Button */}
        <button
          onClick={handleInstall}
          style={{
            marginTop: 16,
            width: '100%',
            background: 'white',
            color: '#8B5CF6',
            border: 'none',
            borderRadius: 12,
            padding: '14px 24px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#8B5CF6">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          Install App
        </button>
      </div>
      
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

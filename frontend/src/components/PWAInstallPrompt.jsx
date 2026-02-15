import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 24 hours)
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        return; // Don't show if dismissed within 24 hours
      }
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    setIsIOS(isIOSDevice && isSafari);

    // Show iOS prompt after delay
    if (isIOSDevice && isSafari) {
      setTimeout(() => setShowPrompt(true), 3000);
      return;
    }

    // Listen for beforeinstallprompt (Android/Desktop)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('✅ PWA installed successfully!');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted install');
    } else {
      console.log('❌ User dismissed install');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  // iOS-specific prompt (Safari doesn't support beforeinstallprompt)
  if (isIOS) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.iconContainer}>
            <img 
              src="/icons/web-app-manifest-192x192.png" 
              alt="OneTap" 
              style={styles.icon}
            />
          </div>
          
          <h2 style={styles.title}>Install OneTap</h2>
          <p style={styles.subtitle}>Add to your home screen for the best experience!</p>
          
          <div style={styles.iosInstructions}>
            <p style={styles.step}>
              <span style={styles.stepNumber}>1</span>
              Tap the <strong>Share</strong> button <span style={styles.shareIcon}>⬆️</span> below
            </p>
            <p style={styles.step}>
              <span style={styles.stepNumber}>2</span>
              Scroll down and tap <strong>"Add to Home Screen"</strong>
            </p>
            <p style={styles.step}>
              <span style={styles.stepNumber}>3</span>
              Tap <strong>"Add"</strong> to confirm
            </p>
          </div>
          
          <button onClick={handleDismiss} style={styles.dismissBtn}>
            Got it!
          </button>
        </div>
      </div>
    );
  }

  // Android/Desktop prompt
  return (
    <div style={styles.banner}>
      <div style={styles.bannerContent}>
        <img 
          src="/icons/web-app-manifest-192x192.png" 
          alt="OneTap" 
          style={styles.bannerIcon}
        />
        <div style={styles.bannerText}>
          <p style={styles.bannerTitle}>Install OneTap</p>
          <p style={styles.bannerSubtitle}>Quick access from your home screen</p>
        </div>
      </div>
      
      <div style={styles.bannerActions}>
        <button onClick={handleDismiss} style={styles.laterBtn}>
          Later
        </button>
        <button onClick={handleInstall} style={styles.installBtn}>
          Install
        </button>
      </div>
    </div>
  );
}

const styles = {
  // Banner styles (Android/Desktop)
  banner: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0f 100%)',
    borderTop: '1px solid rgba(139, 92, 246, 0.3)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
    animation: 'slideUp 0.3s ease-out'
  },
  bannerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  bannerIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px'
  },
  bannerText: {
    display: 'flex',
    flexDirection: 'column'
  },
  bannerTitle: {
    color: '#f8fafc',
    fontSize: '16px',
    fontWeight: '600',
    margin: 0
  },
  bannerSubtitle: {
    color: 'rgba(248, 250, 252, 0.6)',
    fontSize: '13px',
    margin: 0
  },
  bannerActions: {
    display: 'flex',
    gap: '10px'
  },
  laterBtn: {
    background: 'transparent',
    border: '1px solid rgba(248, 250, 252, 0.2)',
    color: 'rgba(248, 250, 252, 0.7)',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  installBtn: {
    background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  
  // Modal styles (iOS)
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0f 100%)',
    borderRadius: '24px 24px 0 0',
    padding: '30px 24px 40px',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderBottom: 'none'
  },
  iconContainer: {
    marginBottom: '20px'
  },
  icon: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
  },
  title: {
    color: '#f8fafc',
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 8px'
  },
  subtitle: {
    color: 'rgba(248, 250, 252, 0.6)',
    fontSize: '15px',
    margin: '0 0 24px'
  },
  iosInstructions: {
    background: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'left'
  },
  step: {
    color: 'rgba(248, 250, 252, 0.8)',
    fontSize: '14px',
    margin: '0 0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  stepNumber: {
    background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
    color: '#fff',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    flexShrink: 0
  },
  shareIcon: {
    fontSize: '16px'
  },
  dismissBtn: {
    background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
    border: 'none',
    color: '#fff',
    padding: '14px 32px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%'
  }
};

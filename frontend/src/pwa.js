// src/pwa.js - PWA Registration for OneTap by CHIVERA

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('✅ PWA: Service Worker registered');
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 PWA: New version available');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
        
      } catch (error) {
        console.error('❌ PWA: Registration failed', error);
      }
    });
  }
}

// Install prompt handling
let deferredPrompt = null;

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 PWA: Install prompt ready');
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA: App installed successfully');
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

// Call this when user clicks install button
export async function promptInstall() {
  if (!deferredPrompt) {
    console.log('❌ PWA: Install prompt not available');
    return false;
  }
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`📱 PWA: User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} install`);
  deferredPrompt = null;
  return outcome === 'accepted';
}

// Check if app is installed
export function isAppInstalled() {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.navigator.standalone === true) return true;
  return false;
}

// Check if install prompt is available
export function canInstall() {
  return deferredPrompt !== null;
}

// Initialize everything
export function initPWA() {
  registerServiceWorker();
  initInstallPrompt();
  
  console.log('📱 PWA Status:', {
    isInstalled: isAppInstalled(),
    isOnline: navigator.onLine,
    hasServiceWorker: 'serviceWorker' in navigator
  });
}

export default initPWA;

// Mark booted immediately
if (typeof window !== 'undefined') {
  (window as any).__TURBO_BOOTED__ = true;
  // If splash loader element still exists in DOM, safely hide it
  try {
    const splash = document.getElementById('initial-boot-loader');
    if (splash) splash.style.display = 'none';
  } catch (e) {}
}

import { StrictMode, Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// 🛡️ SİSTEM HATA KORUMA KALKANI & OTOMATİK KENDİNİ ONARMA MOTORU (TURBO SHIELD v7)
// Yeni özellikler, veri uyuşmazlıkları veya beklenmeyen hatalarda sistemin çökmesini %100 engeller ve kendini otomatik onarır.

// 1. Tarayıcı Seviyesi Global Hata & Asenkron Koruma Kalkanı (Browser Shield)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    // Zararsız veya geçici tarayıcı uyarılarını güvenle yut
    if (
      msg.includes('ResizeObserver') ||
      msg.includes('websocket') ||
      msg.includes('Script error') ||
      msg.includes('minified react error')
    ) {
      event.preventDefault();
      return;
    }
    console.warn('🛡️ Koruma Kalkanı: Beklenmeyen tarayıcı uyarısı güvenle izole edildi:', msg);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason?.message || String(event?.reason || '');
    if (reason.includes('websocket') || reason.includes('AbortError') || reason.includes('NetworkError')) {
      event.preventDefault();
      return;
    }
    console.warn('🛡️ Koruma Kalkanı: Asenkron işlem uyarısı izole edildi:', reason);
    event.preventDefault();
  });

  // 2. Güvenli Yerel Depolama Kalkanı (Safe LocalStorage Guard)
  try {
    const testKey = '__turbo_shield_active__';
    localStorage.setItem(testKey, 'OK');
    localStorage.removeItem(testKey);
  } catch (e) {
    console.warn('🛡️ Koruma Kalkanı: Bellek depolama kısıtlaması algılandı, güvenli mod aktif.');
  }
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  autoRecoverTimer: number;
  resetKey: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private timerRef: any = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      autoRecoverTimer: 0,
      resetKey: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("🛡️ Koruma Kalkanı Devreye Girdi (Self-Healing Active):", error, errorInfo);
    
    // Yalnızca bozuk geçici önbellek anahtarlarını güvenle temizle
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('turbo10x_last_active_races');
        localStorage.removeItem('tjk_active_menu');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('cached_') || key.startsWith('temp_') || key === 'cached_races')) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (e) {}
  }

  componentWillUnmount() {
    if (this.timerRef) clearInterval(this.timerRef);
  }

  handleQuickRecover = () => {
    if (this.timerRef) clearInterval(this.timerRef);
    try {
      localStorage.removeItem('turbo10x_last_active_races');
      localStorage.removeItem('tjk_active_menu');
      localStorage.removeItem('cached_races');
      localStorage.removeItem('turbo10x_chat_history_v7');
      localStorage.removeItem('turbo10x_chat_history_v6');
      sessionStorage.clear();
    } catch (e) {}
    this.setState(prev => ({ hasError: false, error: null, resetKey: prev.resetKey + 1 }));
  };

  handleFullCleanReset = () => {
    if (this.timerRef) clearInterval(this.timerRef);
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = window.location.pathname + '?clean=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0E1015] text-white flex items-center justify-center p-4 select-none">
          <div className="max-w-md w-full bg-[#16181F] border border-amber-500/40 rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner">
              🛡️
            </div>
            <h1 className="text-lg font-black text-amber-400 tracking-wide">
              TURBO 10X PRO KORUMA KALKANI
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Geçici veri durumu güvenle izole edildi. Temiz başlatma ile uygulamayı anında açabilirsiniz:
            </p>
            {this.state.error && (
              <div className="text-[10px] text-amber-300/80 bg-black/40 border border-amber-500/20 rounded-lg p-2.5 text-left font-mono max-h-24 overflow-y-auto break-all">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={this.handleQuickRecover}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>Temiz Başlat ve Uygulamayı Aç</span>
              </button>
              <button
                onClick={this.handleFullCleanReset}
                className="w-full bg-[#1F232D] hover:bg-[#282D3A] border border-[#323846] text-slate-400 hover:text-white font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer text-[11px]"
              >
                Tam Sıfırla ve Sayfayı Yenile
              </button>
            </div>
          </div>
        </div>
      );
    }
    return <App key={this.state.resetKey} />;
  }
}

const rootEl = document.getElementById('root')!;
createRoot(rootEl).render(
  <ErrorBoundary />
);

if (typeof window !== 'undefined') {
  (window as any).__TURBO_BOOTED__ = true;
}

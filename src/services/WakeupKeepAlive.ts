/**
 * TURBO 10X PRO — Otomatik Uyanma ve Canlı Tutma Kalkanı (Wake-up & Keep-Alive Engine)
 * 
 * Amaç:
 * 1. Cloud Run ve dev konteynerinin uyku moduna (cold start / hibernation) geçmesini engeller.
 * 2. Kullanıcı sekmeye geri döndüğünde (visibilitychange) veya internete yeniden bağlandığında sunucuyu anında uyandırır.
 * 3. Kullanıcı uygulamayı açık tuttuğu sürece 3.5 dakikada bir hafif /api/health sinyali göndererek konteyneri sıcak tutar.
 */

class WakeupKeepAliveService {
  private intervalId: any = null;
  private isWaking: boolean = false;
  private lastPingTime: number = 0;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Sekmeye dönüşte (visibilitychange) anında uyandır
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Son pingden bu yana 30 saniyeden fazla geçmişse hemen uyandır
        if (now - this.lastPingTime > 30000) {
          this.pingServer('tab_visible');
        }
      }
    });

    // 2. Cihaz çevrimdışı durumdan çevrimiçi duruma geçtiğinde anında uyandır
    window.addEventListener('online', () => {
      this.pingServer('network_online');
    });

    // 3. Kullanıcı sekmeyi açık tuttuğu sürece 3.5 dakikada bir (Cloud Run 5-15 dk uyku süresinden önce) sıcak tut
    this.intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.pingServer('interval_keepalive');
      }
    }, 210000); // 3.5 dakika (210.000 ms)

    // İlk açılışta hafif teyit
    setTimeout(() => {
      this.pingServer('initial_boot');
    }, 2000);
  }

  public async pingServer(reason: string = 'manual'): Promise<boolean> {
    if (this.isWaking) return false;
    this.isWaking = true;
    this.lastPingTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`/api/health?wake=1&reason=${reason}&t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeout);
      this.isWaking = false;
      return res.ok;
    } catch (e) {
      this.isWaking = false;
      return false;
    }
  }

  public destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const wakeupKeepAlive = new WakeupKeepAliveService();

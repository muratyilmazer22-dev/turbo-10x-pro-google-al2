/**
 * AlertManager.ts
 * 
 * BÖLÜM 2: AĞ GÜVENLİĞİ VE SESSİZ BİLDİRİM MERKEZİ (Network & Alerts)
 * 
 * Temel Prensipler:
 * 1. KESİNLİKLE SESLİ UYARI ÇALMAZ (Audio elements, Web Audio API vb. tamamen yasaktır).
 * 2. Takı değişiklikleri (KG, K, DB, SK vb.), jokey değişimleri, kilo farkları,
 *    pist/hava değişimi veya yarıştan çıkan atlar (SCRATCHED) tespit edildiğinde;
 *    bunları UI için sessiz, salt metin tabanlı (text-only) sistem logu / bildirim akışı
 *    olarak üretir ve dağıtır.
 * 3. Event Listener ve Publisher-Subscriber (Pub/Sub) mimarisi ile React arayüzüne
 *    ve yan bildirim paneline gerçek zamanlı, akıcı veri sağlar.
 */

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'VALUE_OPPORTUNITY';

export type AlertCategory = 
  | 'SCRATCHED_HORSE'     // Yarıştan çıkan safkan
  | 'JOCKEY_CHANGE'       // Jokey değişimi
  | 'EQUIPMENT_CHANGE'    // Takı değişikliği (KG, DB, SK vb.)
  | 'WEIGHT_CHANGE'       // Kilo değişimi
  | 'TRACK_CONDITION'     // Pist / hava durumu değişimi
  | 'ODDS_DRIFT'          // Ganyan / AGF dalgalanması
  | 'NETWORK_FALLBACK'    // Ağ hatası & Yerel AHP Moduna geçiş
  | 'SYSTEM_NOTICE';      // Sistem log bildirimi

export interface SilentAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  hipodrom: string;
  raceNumber?: number;
  horseNo?: string | number;
  horseName?: string;
  title: string;
  message: string;
  details?: {
    oldValue?: string | number;
    newValue?: string | number;
    impactOnEV?: 'INCREASED' | 'DECREASED' | 'NEUTRAL';
    paceAdjustmentNote?: string;
  };
  timestamp: string;
  isRead: boolean;
}

export type AlertListener = (alert: SilentAlert) => void;

export class AlertManager {
  private static instance: AlertManager;
  private alerts: SilentAlert[] = [];
  private listeners: Set<AlertListener> = new Set();
  private maxStoredAlerts: number = 200;

  private constructor() {
    // Varsayılan ilk sistem durum bildirimi (Sessiz)
    this.addAlert({
      category: 'SYSTEM_NOTICE',
      severity: 'INFO',
      hipodrom: 'SİSTEM',
      title: 'Turbo 10X Pro Aktif',
      message: 'Sessiz Bildirim Merkezi ve Ağ Kalkanı devrede. Sesli bildirimler devre dışıdır.'
    });
  }

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  /**
   * Yeni bir sessiz bildirim ekle ve abonelere ilet
   */
  public addAlert(params: {
    category: AlertCategory;
    severity: AlertSeverity;
    hipodrom: string;
    raceNumber?: number;
    horseNo?: string | number;
    horseName?: string;
    title: string;
    message: string;
    details?: SilentAlert['details'];
  }): SilentAlert {
    const alert: SilentAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      category: params.category,
      severity: params.severity,
      hipodrom: params.hipodrom,
      raceNumber: params.raceNumber,
      horseNo: params.horseNo,
      horseName: params.horseName,
      title: params.title,
      message: params.message,
      details: params.details,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Bellekte sakla (En yeniden en eskiye)
    this.alerts.unshift(alert);
    if (this.alerts.length > this.maxStoredAlerts) {
      this.alerts = this.alerts.slice(0, this.maxStoredAlerts);
    }

    // Konsol logu (Geliştirici takibi için sessiz)
    console.info(`[SilentAlertManager] [${alert.severity}] [${alert.category}] ${alert.hipodrom} R${alert.raceNumber || '-'}: ${alert.title} - ${alert.message}`);

    // UI dinleyicilerini tetikle
    this.notifyListeners(alert);

    return alert;
  }

  /**
   * 1. Yarıştan Çıkan At Bildirimi (Scratched Horse)
   */
  public notifyScratchedHorse(params: {
    hipodrom: string;
    raceNumber: number;
    horseNo: string | number;
    horseName: string;
    reason?: string;
  }): SilentAlert {
    return this.addAlert({
      category: 'SCRATCHED_HORSE',
      severity: 'CRITICAL',
      hipodrom: params.hipodrom,
      raceNumber: params.raceNumber,
      horseNo: params.horseNo,
      horseName: params.horseName,
      title: 'Yarıştan Çıkan Safkan',
      message: `${params.horseName} (${params.horseNo} No) koşudan çıkarılmıştır. Kurgu ve EV oranları otomatik revize ediliyor.`,
      details: {
        paceAdjustmentNote: 'Yarıştan çıkış temposu ve liderlik mücadelesi yeniden simüle edildi.'
      }
    });
  }

  /**
   * 2. Jokey Değişimi Bildirimi (Jockey Change)
   */
  public notifyJockeyChange(params: {
    hipodrom: string;
    raceNumber: number;
    horseNo: string | number;
    horseName: string;
    oldJockey: string;
    newJockey: string;
    impactScore?: number; // Pozitif veya negatif EV etkisi
  }): SilentAlert {
    const isUpgrade = (params.impactScore || 0) >= 0;
    return this.addAlert({
      category: 'JOCKEY_CHANGE',
      severity: 'WARNING',
      hipodrom: params.hipodrom,
      raceNumber: params.raceNumber,
      horseNo: params.horseNo,
      horseName: params.horseName,
      title: 'Jokey Değişikliği',
      message: `${params.horseName}: Eski Jokey [${params.oldJockey}] ➔ Yeni Jokey [${params.newJockey}] olarak güncellendi.`,
      details: {
        oldValue: params.oldJockey,
        newValue: params.newJockey,
        impactOnEV: isUpgrade ? 'INCREASED' : 'DECREASED',
        paceAdjustmentNote: `Jokey stili ve son 200m taktiği ${params.newJockey} profiline göre uyarlandı.`
      }
    });
  }

  /**
   * 3. Takı Değişikliği Bildirimi (Equipment Change: KG, DB, SK vb.)
   */
  public notifyEquipmentChange(params: {
    hipodrom: string;
    raceNumber: number;
    horseNo: string | number;
    horseName: string;
    oldEquipment: string;
    newEquipment: string;
  }): SilentAlert {
    return this.addAlert({
      category: 'EQUIPMENT_CHANGE',
      severity: 'INFO',
      hipodrom: params.hipodrom,
      raceNumber: params.raceNumber,
      horseNo: params.horseNo,
      horseName: params.horseName,
      title: 'Takı Değişikliği',
      message: `${params.horseName}: Takı [${params.oldEquipment || 'Yok'}] ➔ [${params.newEquipment}] olarak değişti.`,
      details: {
        oldValue: params.oldEquipment,
        newValue: params.newEquipment,
        impactOnEV: 'NEUTRAL',
        paceAdjustmentNote: 'Gözlük/Dilbağı değişikliği ilk 400m odaklanmasını artırabilir.'
      }
    });
  }

  /**
   * 4. Ağ Hatası & AHP Motoruna Geçiş Bildirimi (Network Fallback)
   */
  public notifyNetworkFallback(params: {
    hipodrom: string;
    endpoint: string;
    attempts: number;
  }): SilentAlert {
    return this.addAlert({
      category: 'NETWORK_FALLBACK',
      severity: 'WARNING',
      hipodrom: params.hipodrom,
      title: 'Ağ Kalkanı Devrede (Deterministik AHP)',
      message: `${params.endpoint} isteği ${params.attempts} deneme sonrası yanıt vermedi. Sistem kesintisiz 'Yerel Deterministik AHP Motoru' moduna geçti.`,
      details: {
        paceAdjustmentNote: 'Tüm EV hesaplamaları yerel matematiksel model ile güvenceye alınmıştır.'
      }
    });
  }

  /**
   * Tüm bildirimleri getir
   */
  public getAllAlerts(): SilentAlert[] {
    return [...this.alerts];
  }

  /**
   * Kategori veya hipodroma göre filtrele
   */
  public getAlertsByCategory(category: AlertCategory): SilentAlert[] {
    return this.alerts.filter(a => a.category === category);
  }

  /**
   * Okunmamış bildirim sayısı
   */
  public getUnreadCount(): number {
    return this.alerts.filter(a => !a.isRead).length;
  }

  /**
   * Tümünü okundu olarak işaretle
   */
  public markAllAsRead(): void {
    this.alerts.forEach(a => { a.isRead = true; });
  }

  /**
   * Bildirimleri temizle
   */
  public clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Abone ol (React useEffect içinde kullanılır)
   */
  public subscribe(listener: AlertListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(alert: SilentAlert): void {
    this.listeners.forEach(listener => {
      try {
        listener(alert);
      } catch (err) {
        console.error('[SilentAlertManager] Dinleyici tetikleme hatası:', err);
      }
    });
  }
}

export const alertManager = AlertManager.getInstance();
export default alertManager;

/**
 * ScoreCalculator.ts
 * 
 * BÖLÜM 2 - MODÜL 1: VERİ KÖPRÜSÜ (Feature Engineering & Score Normalizer)
 * Ham verileri, soy ağacı dozaj endekslerini ve sabah idman galoplarını
 * istatistiksel temellere dayalı olarak 0 - 100 arası normalize skorlara dönüştürür.
 */

import { DosageIndex, GallopEntry, SpeedRatingEntry } from '../db/mongodbSchema.js';

export interface RawHorseFeatureInput {
  name: string;
  age: number;
  carriedWeight: number;
  handicapRating?: number;
  dosageIndex?: DosageIndex;
  recentGallops?: GallopEntry[];
  speedHistory?: SpeedRatingEntry[];
  jockeyWinRate?: number;     // 0.00 - 1.00 (Örn: 0.18 -> %18)
  trackWinRate?: number;      // 0.00 - 1.00
  marketOdds?: number;        // Canlı ganyan
}

export interface NormalizedHorseFeatureScores {
  pedigreeDistanceFit: number;  // 0 - 100: Dozaj (DI/CD) & Mesafe uyum skoru
  gallopSpeedRating: number;    // 0 - 100: Galop süresi, mesafesi ve durumuna göre hız puanı
  formScore: number;            // 0 - 100: Son koşu dereceleri ve handikap puanı
  weightAdvantageScore: number; // 0 - 100: Kilo avantajı puanı
  trackAffinityScore: number;   // 0 - 100: Pist ve zemin uyumu
  jockeyEfficiencyScore: number;// 0 - 100: Jokey kazanma yüzdesi ve form puanı
}

export class ScoreCalculator {
  /**
   * 1. Pedigree Dozaj (DI / CD) & Mesafe Uyum Skoru (0 - 100)
   * 
   * Dozaj Teorisi (Dosage Theory):
   * - DI (Dosage Index) > 3.00 ve CD (Center of Distribution) > 0.80 -> Saf Sprint (1000m - 1300m)
   * - 2.00 <= DI <= 3.00 ve 0.40 <= CD <= 0.80 -> Mil / Orta Mesafe (1400m - 1800m)
   * - DI < 2.00 ve CD < 0.40 -> Klasik / Uzun Mesafe (1900m - 2400m+)
   * 
   * Bu formül, atın genetik dayanıklılık ve hız profili ile koşulacak yarış mesafesi arasındaki
   * sapmayı Gauss çan eğrisi benzeri ceza katsayısı ile 0-100 puan aralığına oturtur.
   */
  public static calculatePedigreeDistanceFit(dosage?: DosageIndex, raceDistance: number = 1400): number {
    if (!dosage || typeof dosage.di !== 'number' || typeof dosage.cd !== 'number') {
      // Dozaj bilgisi yoksa mesafeye göre dengeli nötr ortalama puan döner
      return 65.0;
    }

    const { di, cd } = dosage;
    
    // Genetik optimal mesafe öngörüsü (Optimum Stamina Projection)
    // DI düştükçe ve CD azaldıkça atın ideal mesafesi artar.
    // Örnek: DI=4.0 -> ~1100m, DI=2.4 -> ~1500m, DI=1.0 -> ~2200m
    const projectedOptimalDistance = Math.round(2400 - (di * 220) - (cd * 350));
    const clampedOptimal = Math.max(1000, Math.min(2600, projectedOptimalDistance));

    // Koşulacak yarış mesafesi ile atın genetik optimum mesafesi arasındaki fark
    const distanceDelta = Math.abs(raceDistance - clampedOptimal);

    // Sapma arttıkça puan kademeli düşer: 100m fark için ~3.5 puan ceza
    const fitScore = 100 - (distanceDelta / 100) * 3.5;
    
    return Number(Math.max(15, Math.min(99, fitScore)).toFixed(1));
  }

  /**
   * 2. Galop Hız Puanlayıcısı (0 - 100)
   * 
   * Formül:
   * - İdman mesafesi (Örn: 800m, 1000m) ve süre (sn) üzerinden km/h veya 100m temposu hesaplanır.
   * - Referans Tempolar:
   *   * 800m için 48.0 sn = 100 puan, 52.0 sn = 60 puan (Ters orantı)
   *   * 1000m için 60.0 sn = 100 puan, 65.0 sn = 60 puan
   *   * 600m için 35.5 sn = 100 puan, 39.0 sn = 60 puan
   *   * 400m için 23.5 sn = 100 puan, 26.5 sn = 60 puan
   * - İdman durumu çarpanı: 'Rahat' (x1.08), 'Çalışarak' (x1.00), 'Kenter' (x0.92)
   */
  public static calculateGallopSpeedRating(gallops?: GallopEntry[]): number {
    if (!gallops || !Array.isArray(gallops) || gallops.length === 0) {
      return 55.0; // Galop kaydı yoksa lig ortalaması nötr puan
    }

    // En güncel son 2 galopu dikkate al
    const recentGallops = gallops.slice(0, 2);
    const scores: number[] = [];

    for (const g of recentGallops) {
      if (!g.timeInSeconds || g.timeInSeconds <= 0 || !g.distance) continue;

      let baselineTime = 50.0;
      let targetDist = g.distance;

      // Mesafeye göre standart referans süresi (TJK Hipodrom Standartları)
      if (targetDist <= 450) baselineTime = 24.5;
      else if (targetDist <= 650) baselineTime = 37.0;
      else if (targetDist <= 850) baselineTime = 49.5;
      else if (targetDist <= 1050) baselineTime = 62.0;
      else baselineTime = 75.0; // 1200m

      // Ters orantılı hız skoru: Süre kısaldıkça puan 100'e yaklaşır
      // (baseline / timeInSeconds)^1.8 * 85
      const ratio = baselineTime / g.timeInSeconds;
      let gallopScore = Math.pow(ratio, 1.8) * 85.0;

      // İdman zorluk derecesi (Condition Multiplier)
      // At rahat tempoda bu dereceyi yaptıysa daha yüksek potansiyele sahiptir.
      if (g.condition === 'Rahat' || g.evaluation === 'VeryGood') {
        gallopScore *= 1.08;
      } else if (g.condition === 'Kenter') {
        gallopScore *= 0.94;
      } else if (g.evaluation === 'Poor') {
        gallopScore *= 0.85;
      }

      scores.push(gallopScore);
    }

    if (scores.length === 0) return 55.0;
    const avgGallopScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Number(Math.max(10, Math.min(99, avgGallopScore)).toFixed(1));
  }

  /**
   * 3. Form Skoru (0 - 100)
   * Handikap puanı ve son koşuların ağırlıklı ortalaması
   */
  public static calculateFormScore(handicap?: number, history?: SpeedRatingEntry[]): number {
    let baseForm = handicap && handicap > 0 ? Math.min(95, handicap * 1.05) : 0;

    if (history && history.length > 0) {
      // Son koşu derecelerinin ağırlıklı ortalaması (en son koşu %50, önceki %30, daha önceki %20)
      const weights = [0.50, 0.30, 0.20];
      let weightedSum = 0;
      let totalWeight = 0;

      history.slice(0, 3).forEach((entry, idx) => {
        const w = weights[idx] || 0.1;
        weightedSum += (entry.score || 60) * w;
        totalWeight += w;
      });

      const historyScore = totalWeight > 0 ? weightedSum / totalWeight : 60;
      baseForm = baseForm > 0 ? (baseForm * 0.4 + historyScore * 0.6) : historyScore;
    }

    return Number(Math.max(0, Math.min(99, baseForm)).toFixed(1));
  }

  /**
   * 4. Kilo Avantajı Skoru (0 - 100)
   * 50 kg -> 95 puan, 58 kg -> 70 puan, 63 kg -> 45 puan
   */
  public static calculateWeightAdvantage(carriedWeight: number): number {
    const safeWeight = carriedWeight && carriedWeight > 40 ? carriedWeight : 56;
    // 50kg baz alınır: Her 1kg artış ~3.8 puan kaybettirir
    const score = 95 - ((safeWeight - 50) * 3.8);
    return Number(Math.max(15, Math.min(99, score)).toFixed(1));
  }

  /**
   * Tüm ham verileri tek seferde normalize eden köprü fonksiyon
   */
  public static normalizeAllFeatures(
    horse: RawHorseFeatureInput,
    raceDistance: number = 1400
  ): NormalizedHorseFeatureScores {
    return {
      pedigreeDistanceFit: this.calculatePedigreeDistanceFit(horse.dosageIndex, raceDistance),
      gallopSpeedRating: this.calculateGallopSpeedRating(horse.recentGallops),
      formScore: this.calculateFormScore(horse.handicapRating, horse.speedHistory),
      weightAdvantageScore: this.calculateWeightAdvantage(horse.carriedWeight),
      trackAffinityScore: Number(((horse.trackWinRate || 0.15) * 400 + 40).toFixed(1)), // %20 win rate -> ~120
      jockeyEfficiencyScore: Number(((horse.jockeyWinRate || 0.12) * 450 + 35).toFixed(1))
    };
  }
}

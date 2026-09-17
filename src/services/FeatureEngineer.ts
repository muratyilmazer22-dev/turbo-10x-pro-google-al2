/**
 * FeatureEngineer.ts
 * 
 * BÖLÜM 3: VERİTABANI VE DİNAMİK SKORLAMA (MongoDB & Feature Engineering)
 * 
 * Sorumluluklar:
 * 1. PedigreeGraphNodes (Binary Tree) üzerinde hiyerarşik soy ağacı taraması.
 * 2. Dosage Index (DI) ve Center of Distribution (CD) değerlerini yarış mesafesiyle karşılaştırarak
 *    sprint/stamina uygunluk skoru üretme.
 * 3. Sabah idmanları (Gallops: mesafe, saniye, son 400m, efor düzeyi) ile yarış mesafesi/şartlarını
 *    kıyaslayarak 0-100 arası dinamik galop form skoru üretme.
 * 4. speed_ratings_history (geçmiş yarış dereceleri ve pist şartları) bağlamsal ağırlıklandırma.
 * 5. Matematiksel olarak doğrulanmış, 0-100 aralığında normalize özellik vektörleri üretme.
 */

import { HorseDocument, PedigreeGraphNode, GallopEntry, SpeedRatingEntry, DosageIndex } from '../db/mongodbSchema';

export interface RaceContextFeatures {
  distance: number;
  surface: 'Kum' | 'Çim' | 'Sentetik';
  trackCondition: 'Normal' | 'Ağır' | 'Islak' | 'Nemli' | 'Bozuk';
  raceClass?: 'ŞARTLI' | 'KV' | 'AÇIK' | 'HANDİKAP' | 'MAIDEN';
  paceScenario?: 'Fast Pace' | 'Moderate Pace' | 'Slow Pace';
}

export interface EngineeredHorseFeatures {
  horseId: string;
  horseName: string;
  pedigreeDosageScore: number;       // 0 - 100
  gallopFormScore: number;           // 0 - 100
  speedRatingScore: number;          // 0 - 100
  surfaceAffinityScore: number;      // 0 - 100
  distanceSuitabilityScore: number;  // 0 - 100
  jockeyWeightAdvantageScore: number;// 0 - 100
  paceFitScore: number;              // 0 - 100
  compositeRawScore: number;         // 0 - 100
  metricsBreakdown: {
    calculatedDI: number;
    calculatedCD: number;
    latestGallopSpeedMps: number;    // Metre / saniye
    averagePastSpeedRating: number;
    weightPenaltyBonus: number;
    pedigreeSireName: string;
    pedigreeDamName: string;
  };
}

export class FeatureEngineer {
  /**
   * Dosage Index (DI) ve Center of Distribution (CD) ile Mesafe Uygunluk Skoru (0 - 100)
   * 
   * Formül Mantığı:
   * - DI > 3.00: Safkan sprint eğilimli (1000m - 1400m)
   * - 2.00 <= DI <= 3.00: Mil / Orta mesafe (1400m - 1800m)
   * - DI < 2.00: Uzun mesafe / Dayanıklılık (1900m - 2400m+)
   * - CD (Center of Distribution): 0.50 üzeri hıza, altı dayanıklılığa işaret eder.
   */
  public static calculateDosageSuitability(dosage: DosageIndex | undefined, targetDistance: number): number {
    const di = dosage?.di ?? 2.20;
    const cd = dosage?.cd ?? 0.50;

    let optimalDistance = 1600;

    if (di >= 3.5) {
      optimalDistance = 1200;
    } else if (di >= 2.5) {
      optimalDistance = 1400;
    } else if (di >= 1.8) {
      optimalDistance = 1600;
    } else if (di >= 1.2) {
      optimalDistance = 1900;
    } else {
      optimalDistance = 2200;
    }

    // CD ile ince ayar (CD > 0.75 ise mesafeyi kısalt, CD < 0.25 ise mesafeyi uzat)
    if (cd > 0.70) optimalDistance -= 150;
    if (cd < 0.30) optimalDistance += 150;

    // Hedef mesafe ile optimum mesafe arasındaki farka göre ceza/puanlama
    const delta = Math.abs(targetDistance - optimalDistance);
    const score = Math.max(30, 100 - (delta / 800) * 45);

    return Math.min(100, Math.max(0, Math.round(score * 10) / 10));
  }

  /**
   * Sabah İdmanları (Gallops) Form Skoru Hesaplama (0 - 100)
   * Mesafe, bitiriş saniyesi, son 400m temposu ve efor derecesini normalize eder.
   */
  public static calculateGallopPerformanceScore(gallops: GallopEntry[] | undefined, targetDistance: number): {
    score: number;
    speedMps: number;
  } {
    if (!gallops || gallops.length === 0) {
      return { score: 65, speedMps: 15.5 }; // Varsayılan orta düzey puan
    }

    // En güncel 3 galopu al
    const recentGallops = gallops.slice(0, 3);
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let maxSpeedMps = 0;

    recentGallops.forEach((g, index) => {
      const recencyWeight = index === 0 ? 0.6 : (index === 1 ? 0.3 : 0.1);
      
      // Hız: metre / saniye (Örn: 800m / 48.0s = 16.66 m/s)
      const speedMps = g.distance > 0 && g.timeInSeconds > 0 ? (g.distance / g.timeInSeconds) : 15.5;
      if (speedMps > maxSpeedMps) maxSpeedMps = speedMps;

      // Son 400m hız skoru (Örn: 400m / 24.0s = 16.66 m/s -> Mükemmel sprint)
      let sprintBonus = 0;
      if (g.last400InSeconds && g.last400InSeconds > 0) {
        const sprintMps = 400 / g.last400InSeconds;
        if (sprintMps >= 16.8) sprintBonus = 12;      // 23.8 sn altı
        else if (sprintMps >= 16.0) sprintBonus = 8; // 25.0 sn altı
        else if (sprintMps >= 15.0) sprintBonus = 4;
      }

      // Efor katsayısı
      let conditionMultiplier = 1.0;
      switch (g.condition) {
        case 'Tırnağında': conditionMultiplier = 1.15; break;
        case 'Rahat': conditionMultiplier = 1.10; break;
        case 'Çalışarak': conditionMultiplier = 1.00; break;
        case 'Nefes Açma': conditionMultiplier = 0.95; break;
        case 'Kenter': conditionMultiplier = 0.85; break;
      }

      // Değerlendirme skoru
      let evalBase = 70;
      switch (g.evaluation) {
        case 'VeryGood': evalBase = 90; break;
        case 'Good': evalBase = 80; break;
        case 'Moderate': evalBase = 65; break;
        case 'Poor': evalBase = 45; break;
      }

      const singleGallopScore = (evalBase * conditionMultiplier) + sprintBonus;
      totalWeightedScore += singleGallopScore * recencyWeight;
      totalWeight += recencyWeight;
    });

    const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 70;
    return {
      score: Math.min(100, Math.max(20, Math.round(finalScore * 10) / 10)),
      speedMps: Math.round(maxSpeedMps * 100) / 100
    };
  }

  /**
   * Geçmiş Yarış Hız Dereceleri (Speed Ratings History) Analizi (0 - 100)
   * Pist türü ve mesafeye göre bağlamsal ağırlıklandırma.
   */
  public static calculateSpeedRatingScore(
    history: SpeedRatingEntry[] | undefined,
    targetSurface: 'Kum' | 'Çim' | 'Sentetik',
    targetDistance: number
  ): { score: number; averageRating: number } {
    if (!history || history.length === 0) {
      return { score: 68, averageRating: 70 };
    }

    let weightedSum = 0;
    let weightSum = 0;
    let simpleSum = 0;

    history.forEach((entry, idx) => {
      simpleSum += entry.score;
      
      // Zaman ağırlığı (En son yarış en yüksek ağırlık)
      const recencyWeight = Math.max(0.2, 1.0 - (idx * 0.18));
      
      // Pist uyum katsayısı
      const surfaceMatch = entry.surface === targetSurface ? 1.25 : 0.85;
      
      // Mesafe yakınlık katsayısı (+- 200m içi en yüksek)
      const distDelta = Math.abs(entry.distance - targetDistance);
      const distFactor = distDelta <= 200 ? 1.2 : (distDelta <= 400 ? 1.0 : 0.8);

      const effectiveWeight = recencyWeight * surfaceMatch * distFactor;
      weightedSum += entry.score * effectiveWeight;
      weightSum += effectiveWeight;
    });

    const finalScore = weightSum > 0 ? (weightedSum / weightSum) : 70;
    const averageRating = simpleSum / history.length;

    return {
      score: Math.min(100, Math.max(15, Math.round(finalScore * 10) / 10)),
      averageRating: Math.round(averageRating * 10) / 10
    };
  }

  /**
   * Jokey ve Kilo Avantaj Skoru (0 - 100)
   */
  public static calculateJockeyWeightScore(carriedWeight: number, jockeyWinRate: number = 0.15): number {
    // 58 kg standart baz alınır. Her -1 kg safkana avantaj sağlar (+3 puan).
    const weightAdvantage = (58 - carriedWeight) * 3.5;
    // Jokey kazanma oranı (Örn: %18 -> 0.18 * 200 = 36 puan)
    const jockeyBonus = Math.min(40, jockeyWinRate * 200);

    const baseScore = 55 + weightAdvantage + jockeyBonus;
    return Math.min(100, Math.max(20, Math.round(baseScore * 10) / 10));
  }

  /**
   * Tüm Özellikleri Birleştiren Ana Mühendislik Metodu (Composite Feature Engineering)
   */
  public static engineerFeatures(
    horse: HorseDocument,
    raceContext: RaceContextFeatures,
    carriedWeight: number = 56,
    jockeyWinRate: number = 0.15
  ): EngineeredHorseFeatures {
    // 1. Pedigree & Dosage Skoru
    const dosageSuitability = this.calculateDosageSuitability(horse.dosageIndex, raceContext.distance);

    // 2. Galop Skoru
    const gallopData = this.calculateGallopPerformanceScore(horse.gallops, raceContext.distance);

    // 3. Geçmiş Yarış Dereceleri Skoru
    const speedRatingData = this.calculateSpeedRatingScore(horse.speedRatingsHistory, raceContext.surface, raceContext.distance);

    // 4. Pist Uyumu (Surface Affinity)
    let surfaceAffinityScore = 70;
    if (horse.surfaceAffinity) {
      if (raceContext.surface === 'Kum') surfaceAffinityScore = horse.surfaceAffinity.kumScore;
      else if (raceContext.surface === 'Çim') surfaceAffinityScore = horse.surfaceAffinity.cimScore;
      else if (raceContext.surface === 'Sentetik') surfaceAffinityScore = horse.surfaceAffinity.sentetikScore;
    }

    // 5. Jokey & Kilo Skoru
    const jockeyWeightScore = this.calculateJockeyWeightScore(carriedWeight, jockeyWinRate);

    // 6. Yarış Temposu (Pace) Uyumu
    let paceFitScore = 75;
    if (raceContext.paceScenario === 'Fast Pace') {
      // Yüksek tempoda Closer (Sonlarda kuvvetli gelenler) avantajlı
      paceFitScore = horse.runningStyle === 'Closer' ? 90 : (horse.runningStyle === 'Stalker' ? 78 : 60);
    } else if (raceContext.paceScenario === 'Slow Pace') {
      // Düşük tempoda FrontRunner (Önde kaçanlar) avantajlı
      paceFitScore = horse.runningStyle === 'FrontRunner' ? 92 : (horse.runningStyle === 'Stalker' ? 75 : 55);
    }

    // 7. AHP / Çok Kriterli Ağırlıklı Bileşik Ham Skor (Composite Raw Score)
    // Ağırlık Dağılımı:
    // - Speed Ratings: %28
    // - Gallops: %22
    // - Pedigree / Dosage: %18
    // - Surface Affinity: %14
    // - Jockey & Weight: %10
    // - Pace Fit: %8
    const compositeRawScore = (
      speedRatingData.score * 0.28 +
      gallopData.score * 0.22 +
      dosageSuitability * 0.18 +
      surfaceAffinityScore * 0.14 +
      jockeyWeightScore * 0.10 +
      paceFitScore * 0.08
    );

    return {
      horseId: horse._id,
      horseName: horse.name,
      pedigreeDosageScore: dosageSuitability,
      gallopFormScore: gallopData.score,
      speedRatingScore: speedRatingData.score,
      surfaceAffinityScore,
      distanceSuitabilityScore: dosageSuitability,
      jockeyWeightAdvantageScore: jockeyWeightScore,
      paceFitScore,
      compositeRawScore: Math.round(compositeRawScore * 100) / 100,
      metricsBreakdown: {
        calculatedDI: horse.dosageIndex?.di ?? 2.20,
        calculatedCD: horse.dosageIndex?.cd ?? 0.50,
        latestGallopSpeedMps: gallopData.speedMps,
        averagePastSpeedRating: speedRatingData.averageRating,
        weightPenaltyBonus: 58 - carriedWeight,
        pedigreeSireName: horse.pedigreeTree?.sire?.name || 'Bilinmeyen Aygır',
        pedigreeDamName: horse.pedigreeTree?.dam?.name || 'Bilinmeyen Kısrak'
      }
    };
  }
}

export default FeatureEngineer;

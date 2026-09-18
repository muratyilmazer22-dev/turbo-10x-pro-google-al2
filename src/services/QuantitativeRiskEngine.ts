/**
 * QuantitativeRiskEngine.ts
 * 
 * BÖLÜM 2 - MODÜL 2 & 3: ÇEKİRDEK YAPAY ZEKA, EV HESAPLAMA, SOFTMAX VE FRACTIONAL KELLY
 * 
 * Özellikler:
 * 1. Dinamik Maiden / Cold-Start Ağırlık Kaydırma (Form=0 ise Form/Track -> Pedigree %40, Jockey %30).
 * 2. Sıfıra bölünme ve çıkan at filtrelemesi (marketOdds <= 1.0, NaN, null, undefined).
 * 3. Temperature-Scaled Softmax Normalizasyonu (Sayısal Taşma / Overflow Korumalı, Toplam = 1.0000).
 * 4. Piyasa Olasılığı (Implied Probability = 100 / Ganyan).
 * 5. Beklenen Değer (Expected Value - EV = Gerçek Olasılık * Ganyan) & EV >= 1.10 Value Bet Filtresi.
 * 6. Fractional Kelly Kriteri (0.25x Kelly, Kasanın Max %10 Tavanı).
 */

import { ScoreCalculator, RawHorseFeatureInput } from './ScoreCalculator.js';

export interface QuantitativeHorseInput extends RawHorseFeatureInput {
  id: string;
  name: string;
  no: number | string;
  jockey: string;
  carriedWeight: number;
  runningStyle?: 'FrontRunner' | 'Stalker' | 'Closer';
  marketOdds: number | null | undefined; // Canlı ganyan
  smartMoneyInflow?: number;             // > 1.15 ise pozitif para akışı
  isMaidenOrFirstStart?: boolean;
}

export interface DynamicWeightsBreakdown {
  form: number;
  weight: number;
  gallop: number;
  pedigree: number;
  track: number;
  jockey: number;
}

export interface EvaluatedQuantitativeRunner {
  id: string;
  no: number | string;
  name: string;
  jockey: string;
  carriedWeight: number;
  runningStyle: 'FrontRunner' | 'Stalker' | 'Closer';
  
  // Puanlar
  normalizedScores: {
    pedigreeDistanceFit: number;
    gallopSpeedRating: number;
    formScore: number;
    weightAdvantageScore: number;
    trackAffinityScore: number;
    jockeyEfficiencyScore: number;
  };
  appliedWeights: DynamicWeightsBreakdown;
  rawCompositeScore: number;
  paceMultiplier: number;
  finalPaceAdjustedScore: number;
  
  // İstatistiksel Olasılık & Değer Verileri
  marketOdds: number;
  impliedMarketProbPercent: number; // 100 / marketOdds (%)
  trueProbability: number;          // Modelin gerçek kazanma olasılığı (0.0000 - 1.0000)
  trueProbPercent: number;          // trueProbability * 100 (%)
  fairOdds: number;                 // 1 / trueProbability
  expectedValueEV: number;          // trueProbability * marketOdds
  isValueBet: boolean;              // EV >= 1.10
  kellyFractionStake: number;       // 0.25x Fractional Kelly (0.0000 - 0.1000)
  
  aiInsight: string;                // Kantitatif analiz gerekçesi
}

export interface QuantitativeRaceInput {
  raceNumber?: number;
  hipodrom: string;
  date?: string;
  distance: number;
  surface: string;
  condition?: string;
  paceScenario?: 'Slow' | 'Moderate' | 'Fast' | 'Suicidal';
  runners: QuantitativeHorseInput[];
}

export interface QuantitativeRaceAnalysisResult {
  raceNumber?: number;
  hipodrom: string;
  distance: number;
  surface: string;
  paceScenario: 'Slow' | 'Moderate' | 'Fast' | 'Suicidal';
  totalRunnersAnalyzed: number;
  valueBetsCount: number;
  bestValueBets: EvaluatedQuantitativeRunner[]; // Risk/Ödül oranı yüksek sürprizler
  rankedRunners: EvaluatedQuantitativeRunner[];  // Gerçek kazanma şansına göre sıralı liste
  summaryNotes: string;
  claudePromptPayload: string;                  // Claude 3.5 Sonnet için optimize edilmiş prompt yükü
}

export class QuantitativeRiskEngine {
  // Standart Normal Koşu Ağırlıkları (Toplam = 1.00)
  public static readonly DEFAULT_WEIGHTS: DynamicWeightsBreakdown = {
    form: 0.25,
    weight: 0.15,
    gallop: 0.15,
    pedigree: 0.15,
    track: 0.15,
    jockey: 0.15
  };

  /**
   * Koşu nesnesi kabul eden yardımcı metod
   */
  public static evaluateRace(raceInput: QuantitativeRaceInput): QuantitativeRaceAnalysisResult {
    return this.analyzeRace(
      raceInput.runners,
      raceInput.hipodrom,
      raceInput.distance,
      raceInput.surface,
      raceInput.paceScenario || 'Moderate'
    );
  }

  /**
   * 1. Güvenlik Filtrelemesi (Data Sanitization & Scratched Horse Filtering)
   * Çıkan atlar, ganyanı 1.0'dan küçük veya sıfır/null olanlar elenir.
   */
  public static sanitizeRunners(runners: QuantitativeHorseInput[]): QuantitativeHorseInput[] {
    if (!Array.isArray(runners)) return [];

    return runners.filter(r => {
      const validOdds = typeof r.marketOdds === 'number' && !isNaN(r.marketOdds) && r.marketOdds > 1.0;
      const validName = typeof r.name === 'string' && r.name.trim().length > 0;
      return validOdds && validName;
    });
  }

  /**
   * 2. Dinamik Maiden / Cold-Start Ağırlık Kaydırma Mantığı
   * At ilk kez koşuyorsa (Maiden) veya form puanı 0 ise Form (%25) ve Pist (%15) ağırlıkları sıfırlanır;
   * Pedigree (%40) ve Jokey (%30) ağırlıklarına kaydırılır.
   */
  public static resolveDynamicWeights(
    isMaiden: boolean,
    formScore: number
  ): DynamicWeightsBreakdown {
    if (isMaiden || formScore <= 0) {
      return {
        form: 0.0,
        weight: 0.15,
        gallop: 0.15,
        pedigree: 0.40, // 0.15 + 0.25 (Form payı aktarıldı)
        track: 0.0,     // Pist tecrübesi olmadığı için sıfırlandı
        jockey: 0.30    // 0.15 + 0.15 (Pist payı aktarıldı)
      };
    }

    return { ...this.DEFAULT_WEIGHTS };
  }

  /**
   * 3. Pace (Tempo) Etki Çarpanı
   * Suicidal (Çok Hızlı) tempoda öndeki kaçak atlar (FrontRunner) 0.70x ile cezalandırılır;
   * arkadan gelen Closer atlar 1.28x bonus kazanır.
   */
  public static calculatePaceMultiplier(
    style: 'FrontRunner' | 'Stalker' | 'Closer' = 'Stalker',
    pace: 'Slow' | 'Moderate' | 'Fast' | 'Suicidal' = 'Moderate'
  ): number {
    switch (pace) {
      case 'Suicidal':
        if (style === 'FrontRunner') return 0.70;
        if (style === 'Stalker') return 1.05;
        if (style === 'Closer') return 1.28;
        break;
      case 'Fast':
        if (style === 'FrontRunner') return 0.82;
        if (style === 'Stalker') return 1.02;
        if (style === 'Closer') return 1.18;
        break;
      case 'Slow':
        if (style === 'FrontRunner') return 1.20;
        if (style === 'Stalker') return 1.05;
        if (style === 'Closer') return 0.78;
        break;
      case 'Moderate':
      default:
        return 1.00;
    }
    return 1.00;
  }

  /**
   * 4. Temperature-Scaled Softmax (Sayısal Taşma / Overflow Korumalı)
   * Formül: P(i) = exp((S_i - max(S)) / T) / sum(exp((S_j - max(S)) / T))
   * Sıcaklık (T=18.5) aşırı güveni (overconfidence) engeller ve dağılım toplamını tam 1.0000 yapar.
   */
  public static calculateSoftmaxProbabilities(scores: number[], temperature: number = 18.5): number[] {
    if (scores.length === 0) return [];
    
    // Sayısal taşma (numerical overflow) koruması için maksimum skor çıkarılır
    const maxScore = Math.max(...scores);
    const expValues = scores.map(s => Math.exp((s - maxScore) / temperature));
    const sumExp = expValues.reduce((sum, val) => sum + val, 0);

    if (sumExp === 0) {
      return scores.map(() => 1 / scores.length);
    }

    return expValues.map(exp => exp / sumExp);
  }

  /**
   * 5. Fractional Kelly Kriteri (0.25x Kelly & Max %10 Tavanı)
   * Formül:
   * b = marketOdds - 1
   * p = trueProbability
   * q = 1 - p
   * Full Kelly = (b * p - q) / b
   * Suggested Stake = min(Full Kelly * 0.25, 0.10)
   */
  public static calculateFractionalKellyStake(trueProb: number, marketOdds: number, fraction: number = 0.25): number {
    const b = marketOdds - 1;
    if (b <= 0) return 0; // Sıfıra bölünme ve negatif oran engeli

    const q = 1 - trueProb;
    const fullKelly = (b * trueProb - q) / b;

    if (fullKelly <= 0) return 0;

    const fractionalStake = fullKelly * fraction;
    // Maksimum kasanın %10'u ile sınırla
    return Number(Math.min(fractionalStake, 0.10).toFixed(4));
  }

  /**
   * 6. Claude 3.5 Sonnet için Optimize Edilmiş Prompt Yükü Üreticisi
   */
  public static generateClaudePromptPayload(
    hipodrom: string,
    distance: number,
    surface: string,
    pace: 'Slow' | 'Moderate' | 'Fast' | 'Suicidal',
    runners: EvaluatedQuantitativeRunner[]
  ): string {
    return `
[SYSTEM ROLE: SEN QUANTITATIVE HORSE RACING ANALYST & CLAUDE 3.5 SONNET PREDICTION ENGINE'SİN]
Lütfen aşağıdaki yarış verisini istatistiksel Beklenen Değer (Expected Value - EV) ve Fractional Kelly risk yönetimi prensiplerine göre doğrula ve nihai karar özetini çıkar.

Yarış Parametreleri:
- Hipodrom: ${hipodrom}
- Mesafe: ${distance}m, Pist: ${surface}
- Pace (Tempo) Senaryosu: ${pace}

İşlenmiş At İstatistikleri (Dinamik AHP + Softmax + EV):
${JSON.stringify(runners.map(r => ({
  no: r.no,
  name: r.name,
  jockey: r.jockey,
  kilo: r.carriedWeight,
  stil: r.runningStyle,
  ganyan: r.marketOdds,
  piyasaIhtimali: `%${r.impliedMarketProbPercent}`,
  modelGercekIhtimal: `%${r.trueProbPercent}`,
  adilOran: r.fairOdds,
  EV: r.expectedValueEV,
  valueBetMi: r.isValueBet ? "EVET 🔥" : "HAYIR",
  kellyKasaYuzdesi: `%${(r.kellyFractionStake * 100).toFixed(2)}`,
  bilesenPuanlari: r.normalizedScores
})), null, 2)}

Görev:
1. EV >= 1.10 olan sürpriz değer atlarını (Value Bets) öne çıkar.
2. Neden bu atların piyasa ganyanına göre fiyat/performans avantajı taşıdığını galop, dozaj, kilo ve tempo avantajlarıyla açıkla.
3. Kupon stratejisi için tek / alternatif tek / sürpriz kombinasyon önerisi sun.
`.trim();
  }

  /**
   * ANA ANALİZ ÇALIŞTIRICI (PIPELINE ENTRYPOINT)
   */
  public static analyzeRace(
    runners: QuantitativeHorseInput[],
    hipodrom: string = 'İSTANBUL',
    distance: number = 1400,
    surface: string = 'Kum',
    paceScenario: 'Slow' | 'Moderate' | 'Fast' | 'Suicidal' = 'Moderate'
  ): QuantitativeRaceAnalysisResult {
    // Adım 1: Güvenlik Kontrolü & Çıkan At Filtresi
    const validRunners = this.sanitizeRunners(runners);
    if (validRunners.length === 0) {
      return {
        hipodrom,
        distance,
        surface,
        paceScenario,
        totalRunnersAnalyzed: 0,
        valueBetsCount: 0,
        bestValueBets: [],
        rankedRunners: [],
        summaryNotes: 'Analiz edilecek geçerli at veya oran verisi bulunamadı.',
        claudePromptPayload: ''
      };
    }

    // Adım 2: Veri Köprüsü & Dinamik Ağırlıklı Ham Skorlama
    const intermediateData = validRunners.map(runner => {
      const normalizedScores = ScoreCalculator.normalizeAllFeatures(runner, distance);
      const isMaiden = runner.isMaidenOrFirstStart || normalizedScores.formScore <= 0;
      const appliedWeights = this.resolveDynamicWeights(isMaiden, normalizedScores.formScore);

      const rawCompositeScore = (
        normalizedScores.formScore * appliedWeights.form +
        normalizedScores.weightAdvantageScore * appliedWeights.weight +
        normalizedScores.gallopSpeedRating * appliedWeights.gallop +
        normalizedScores.pedigreeDistanceFit * appliedWeights.pedigree +
        normalizedScores.trackAffinityScore * appliedWeights.track +
        normalizedScores.jockeyEfficiencyScore * appliedWeights.jockey
      );

      const paceMultiplier = this.calculatePaceMultiplier(runner.runningStyle, paceScenario);
      const moneyInflow = runner.smartMoneyInflow || 1.0;
      const moneyFactor = moneyInflow > 1.15 ? 1.04 : (moneyInflow < 0.85 ? 0.96 : 1.0);

      const finalPaceAdjustedScore = rawCompositeScore * paceMultiplier * moneyFactor;

      return {
        runner,
        normalizedScores,
        appliedWeights,
        rawCompositeScore: Number(rawCompositeScore.toFixed(2)),
        paceMultiplier,
        finalPaceAdjustedScore: Number(finalPaceAdjustedScore.toFixed(2))
      };
    });

    // Adım 3: Softmax Olasılık Normalizasyonu (Temperature = 18.5)
    const scoreArray = intermediateData.map(d => d.finalPaceAdjustedScore);
    const probabilities = this.calculateSoftmaxProbabilities(scoreArray, 18.5);

    // Adım 4: Piyasa Olasılığı, EV ve Fractional Kelly Hesaplaması
    const evaluatedRunners: EvaluatedQuantitativeRunner[] = intermediateData.map((item, idx) => {
      const trueProb = probabilities[idx];
      const marketOdds = item.runner.marketOdds as number;
      const impliedMarketProbPercent = Number((100 / marketOdds).toFixed(1));
      const trueProbPercent = Number((trueProb * 100).toFixed(1));
      const fairOdds = Number((1 / trueProb).toFixed(2));
      
      // Beklenen Değer (EV = Gerçek Olasılık * Ganyan)
      const expectedValueEV = Number((trueProb * marketOdds).toFixed(3));
      
      // Gerçek Olasılık > Piyasa Olasılığı VE EV >= 1.10 ise Value Bet
      const isValueBet = (trueProb * 100 > impliedMarketProbPercent) && (expectedValueEV >= 1.10);
      const kellyFractionStake = isValueBet ? this.calculateFractionalKellyStake(trueProb, marketOdds, 0.25) : 0;

      let aiInsight = '';
      if (isValueBet) {
        aiInsight = `🔥 [YÜKSEK DEĞER BAHİSİ] Piyasa bu ata %${impliedMarketProbPercent} şans verip ${marketOdds} ganyan açmışken, modelimiz %${trueProbPercent} gerçek kazanma potansiyeli ve ${fairOdds} adil oran tespit etti (EV: ${expectedValueEV} | Kasa Önerisi: %${(kellyFractionStake * 100).toFixed(1)}).`;
      } else if (trueProbPercent > 35) {
        aiInsight = `⭐ [GÜÇLÜ FAVORİ] Modelin en yüksek kazanma ihtimaline (%${trueProbPercent}) sahip safkanı.`;
      } else {
        aiInsight = `Dengeli piyasa oranlaması (${marketOdds} ganyan).`;
      }

      return {
        id: item.runner.id || `horse_${item.runner.no}`,
        no: item.runner.no,
        name: item.runner.name,
        jockey: item.runner.jockey || 'Bilinmiyor',
        carriedWeight: item.runner.carriedWeight || 56,
        runningStyle: item.runner.runningStyle || 'Stalker',
        normalizedScores: item.normalizedScores,
        appliedWeights: item.appliedWeights,
        rawCompositeScore: item.rawCompositeScore,
        paceMultiplier: item.paceMultiplier,
        finalPaceAdjustedScore: item.finalPaceAdjustedScore,
        marketOdds,
        impliedMarketProbPercent,
        trueProbability: Number(trueProb.toFixed(4)),
        trueProbPercent,
        fairOdds,
        expectedValueEV,
        isValueBet,
        kellyFractionStake,
        aiInsight
      };
    });

    // Gerçek kazanma şansına göre sıralı liste
    const rankedRunners = [...evaluatedRunners].sort((a, b) => b.trueProbability - a.trueProbability);
    
    // Risk/Ödül oranı en yüksek sürprizler (EV'ye göre sıralı)
    const bestValueBets = evaluatedRunners
      .filter(r => r.isValueBet)
      .sort((a, b) => b.expectedValueEV - a.expectedValueEV);

    const claudePromptPayload = this.generateClaudePromptPayload(
      hipodrom,
      distance,
      surface,
      paceScenario,
      rankedRunners
    );

    return {
      hipodrom,
      distance,
      surface,
      paceScenario,
      totalRunnersAnalyzed: rankedRunners.length,
      valueBetsCount: bestValueBets.length,
      bestValueBets,
      rankedRunners,
      summaryNotes: `${hipodrom} ${distance}m koşusunda ${bestValueBets.length} adet pozitif beklenen değerli (EV >= 1.10) Value Bet safkan tespit edildi.`,
      claudePromptPayload
    };
  }
}

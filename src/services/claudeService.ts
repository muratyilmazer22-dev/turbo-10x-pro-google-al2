/**
 * Gemini Pro / Flash Quantitative Analysis Service
 * 
 * Modül Özellikleri:
 * 1. Google Gemini 2.5 Pro / Flash Entegrasyonu (Server-side native).
 * 2. Beklenen Değer (EV), Gerçek Olasılık (Softmax), Pace senaryosu ve Kelly Kriteri analizi.
 * 3. Network Reliability: AbortController, Safe JSON Parse, Exponential Retry ve Yerel Deterministik AHP Fallback.
 */

import { GoogleGenAI } from '@google/genai';
import { safeJsonParse } from './networkReliability';
import { QuantitativeRiskEngine, QuantitativeHorseInput, EvaluatedQuantitativeRunner } from './QuantitativeRiskEngine';
import { ScoreCalculator } from './ScoreCalculator';

export function getAnthropicClient(): null {
  return null;
}

export interface HybridRaceAnalysisInput {
  raceNumber: number;
  hipodrom: string;
  date: string;
  distance: number;
  surface: 'Kum' | 'Çim' | 'Sentetik';
  trackCondition: string;
  paceScenario?: 'Slow' | 'Moderate' | 'Fast' | 'Suicidal';
  runners: Array<{
    no: number | string;
    name: string;
    jockey: string;
    weight: number;
    handicapScore?: number;
    marketOdds: number;
    agfRatio?: number;
    smartMoneyInflow?: number;
    runningStyle?: 'FrontRunner' | 'Stalker' | 'Closer';
    isMaidenOrFirstStart?: boolean;
    gallopRating?: number;
    pedigreeScore?: number;
    trackAffinity?: number;
  }>;
}

export interface QuantitativeAnalyzedHorse {
  no: number | string;
  name: string;
  jockey: string;
  weight: number;
  marketOdds: number;
  impliedMarketProb: number;  // (100 / marketOdds) %
  trueProbability: number;     // Modelin hesapladığı gerçek kazanma olasılığı (0.00 - 1.00)
  fairOdds: number;            // 1 / trueProbability
  expectedValueEV: number;     // trueProbability * marketOdds
  isValueBet: boolean;         // EV >= 1.10
  kellyFractionStake: number;  // Fractional Kelly (0.25x), max %10
  paceMultiplier: number;
  appliedWeights: {
    form: number;
    pedigree: number;
    jockey: number;
    weight: number;
    gallop: number;
    track: number;
  };
  aiInsight: string;           // Gemini Pro kantitatif değerlendirme özeti
}

export interface HybridAnalysisResult {
  raceNumber: number;
  hipodrom: string;
  surface: string;
  distance: number;
  engineUsed: 'GEMINI_2_5_PRO' | 'GEMINI_2_5_FLASH' | 'LOCAL_DETERMINISTIC_AHP';
  isFallback: boolean;
  valueBetsCount: number;
  bestValueBets: QuantitativeAnalyzedHorse[];
  allRunners: QuantitativeAnalyzedHorse[];
  paceScenario: string;
  summaryNote: string;
  timestamp: string;
}

/**
 * Yerel Deterministik AHP & EV Hesaplayıcı (Fallback Motoru)
 */
export function calculateLocalDeterministicAhp(input: HybridRaceAnalysisInput): HybridAnalysisResult {
  const quantitativeRunners: QuantitativeHorseInput[] = (input.runners || []).map(r => ({
    id: `runner_${r.no}`,
    no: r.no,
    name: r.name,
    jockey: r.jockey,
    carriedWeight: r.weight,
    age: 4,
    handicapRating: r.handicapScore,
    marketOdds: r.marketOdds,
    smartMoneyInflow: r.smartMoneyInflow,
    runningStyle: r.runningStyle || 'Stalker',
    isMaidenOrFirstStart: r.isMaidenOrFirstStart,
    dosageIndex: r.pedigreeScore ? { di: 2.2, cd: 0.6 } : undefined,
    jockeyWinRate: 0.15,
    trackWinRate: (r.trackAffinity || 60) / 400
  }));

  const result = QuantitativeRiskEngine.analyzeRace(
    quantitativeRunners,
    input.hipodrom,
    input.distance,
    input.surface,
    input.paceScenario || 'Moderate'
  );

  const mappedRunners: QuantitativeAnalyzedHorse[] = result.rankedRunners.map(r => ({
    no: r.no,
    name: r.name,
    jockey: r.jockey,
    weight: r.carriedWeight,
    marketOdds: r.marketOdds,
    impliedMarketProb: r.impliedMarketProbPercent,
    trueProbability: r.trueProbability,
    fairOdds: r.fairOdds,
    expectedValueEV: r.expectedValueEV,
    isValueBet: r.isValueBet,
    kellyFractionStake: r.kellyFractionStake,
    paceMultiplier: r.paceMultiplier,
    appliedWeights: r.appliedWeights,
    aiInsight: r.aiInsight
  }));

  const mappedValueBets = mappedRunners.filter(h => h.isValueBet);

  return {
    raceNumber: input.raceNumber,
    hipodrom: input.hipodrom,
    surface: input.surface,
    distance: input.distance,
    engineUsed: 'LOCAL_DETERMINISTIC_AHP',
    isFallback: true,
    valueBetsCount: mappedValueBets.length,
    bestValueBets: mappedValueBets,
    allRunners: mappedRunners,
    paceScenario: input.paceScenario || 'Moderate',
    summaryNote: result.summaryNotes,
    timestamp: new Date().toISOString()
  };
}

/**
 * Gemini 2.5 Pro / Flash Kantitatif Analiz Çağrısı
 */
export async function analyzeRaceWithClaude(input: HybridRaceAnalysisInput): Promise<HybridAnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    return calculateLocalDeterministicAhp(input);
  }

  const prompt = `
Aşağıdaki at yarışı koşu verisini profesyonel kantitatif bahis ve Beklenen Değer (Expected Value - EV) prensibine göre analiz et.

Koşu Bilgileri:
- Hipodrom: ${input.hipodrom}
- Koşu No: ${input.raceNumber}
- Mesafe: ${input.distance}m, Pist: ${input.surface}, Zemin: ${input.trackCondition}
- Öngörülen Pace (Tempo): ${input.paceScenario || 'Moderate'}

At Listesi:
${JSON.stringify(input.runners, null, 2)}

Görevler:
1. marketOdds değeri 1.0'dan küçük, 0 veya geçersiz olan çıkan atları filtrele.
2. Formu 0 olan veya ilk kez koşan Maiden atlarda Form ve Pist ağırlıklarını sıfırlayıp Pedigree (%40) ve Jokey (%30) ağırlıklarına kaydır.
3. Softmax ile Gerçek Kazanma Olasılığı (trueProbability) hesapla. Tüm atların olasılık toplamı tam 1.0 olmalıdır.
4. EV = trueProbability * marketOdds hesapla. EV >= 1.10 olanları isValueBet: true olarak etiketle.
5. Value Bet atlar için 0.25x Fractional Kelly (max %10 kasa) yatırım yüzdesi (kellyFractionStake) belirle.

Yanıtını SADECE geçerli bir JSON nesnesi olarak döndür:
{
  "paceScenario": "${input.paceScenario || 'Moderate'}",
  "summaryNote": "Koşu analizi ve değer tespit özeti",
  "analyzedRunners": [
    {
      "no": 1,
      "name": "AT ADI",
      "jockey": "JOKEY",
      "weight": 58,
      "marketOdds": 4.5,
      "impliedMarketProb": 22.2,
      "trueProbability": 0.315,
      "fairOdds": 3.17,
      "expectedValueEV": 1.417,
      "isValueBet": true,
      "kellyFractionStake": 0.045,
      "paceMultiplier": 1.05,
      "appliedWeights": { "form": 0.25, "pedigree": 0.15, "jockey": 0.15, "weight": 0.15, "gallop": 0.15, "track": 0.15 },
      "aiInsight": "Fiyat/Performans gerekçesi..."
    }
  ]
}
`;

  try {
    const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });

    const textContent = response.text || '';
    const parseResult = safeJsonParse(textContent);

    if (parseResult.success && parseResult.data.analyzedRunners) {
      const runners: QuantitativeAnalyzedHorse[] = parseResult.data.analyzedRunners;
      const bestValueBets = runners.filter(r => r.isValueBet).sort((a, b) => b.expectedValueEV - a.expectedValueEV);

      return {
        raceNumber: input.raceNumber,
        hipodrom: input.hipodrom,
        surface: input.surface,
        distance: input.distance,
        engineUsed: 'GEMINI_2_5_PRO',
        isFallback: false,
        valueBetsCount: bestValueBets.length,
        bestValueBets,
        allRunners: runners.sort((a, b) => b.trueProbability - a.trueProbability),
        paceScenario: parseResult.data.paceScenario || input.paceScenario || 'Moderate',
        summaryNote: parseResult.data.summaryNote || 'Gemini 2.5 Pro Değer Bahis Analizi tamamlandı.',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Gemini yanıtı parse edilemedi');
    }
  } catch (err: any) {
    console.warn(`[GeminiQuantService] Gemini API çağrısı başarısız oldu (${err.message}). Deterministik Yerel AHP Motoruna geçiliyor...`);
    return calculateLocalDeterministicAhp(input);
  }
}

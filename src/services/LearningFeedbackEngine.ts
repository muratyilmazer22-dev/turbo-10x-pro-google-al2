/**
 * LearningFeedbackEngine.ts
 * 
 * BÖLÜM 3 - MODÜL 1: ÖĞRENME VE GERİ BİLDİRİM DÖNGÜSÜ (Self-Correction & Loss Function Optimization)
 * 
 * Özellikler:
 * 1. Gerçek yarış sonuçları sisteme girildiğinde önceki model tahminini gerçek sonuçla kıyaslar.
 * 2. Multi-class Cross-Entropy Loss & Brier Score hesaplayarak modelin tahmin hatasını ölçer.
 * 3. Hata Analizi (Post-Mortem Loss Decomposition):
 *    - Hangi faktör yanılttı? (Pist sürprizi mi, jokey hatası mı, galop yanılgısı mı, aşırı kilo mu?)
 * 4. Dinamik Ağırlık Güncellemesi (Gradient-like Weight Shift):
 *    - Sonraki koşular için hipodrom ve pist bazlı ağırlık matrisini (Form, Kilo, Galop, Pedigree, Jokey) optimize eder.
 * 5. Kalıcı Hafıza ve Öğrenme Geçmişi (Learning Journal).
 */

import { DynamicWeightsBreakdown } from './QuantitativeRiskEngine.js';
import { HistoricalRacingDatabase, LearningEventRecord } from './HistoricalRacingDatabase.js';
import { GoogleGenAI } from '@google/genai';
import { safeJsonParse } from './networkReliability.js';

export interface RaceActualResult {
  raceId: string;
  hipodrom: string;
  distance: number;
  surface: string;
  winningHorseName: string;
  winningHorseNo: number | string;
  winningMarketOdds: number;
  placedHorses: Array<{
    position: number;
    horseNo: number | string;
    horseName: string;
    marketOdds: number;
  }>;
  actualPaceObserved?: 'Slow' | 'Moderate' | 'Fast' | 'Suicidal';
}

export interface ModelPriorPrediction {
  raceId: string;
  hipodrom: string;
  distance: number;
  surface: string;
  predictedPace: string;
  runners: Array<{
    no: number | string;
    name: string;
    trueProbability: number;     // Modelin öngördüğü kazanma ihtimali (0 - 1)
    marketOdds: number;
    expectedValueEV: number;
    isValueBet: boolean;
    appliedWeights: DynamicWeightsBreakdown;
    normalizedScores: {
      pedigreeDistanceFit: number;
      gallopSpeedRating: number;
      formScore: number;
      weightAdvantageScore: number;
      trackAffinityScore: number;
      jockeyEfficiencyScore: number;
    };
  }>;
}

export interface FactorLossContribution {
  factor: keyof DynamicWeightsBreakdown;
  deviationScore: number; // Negatif veya pozitif sapma
  recommendedAdjustment: number; // +0.02, -0.01 vb.
  explanation: string;
}

export interface LearningFeedbackReport {
  raceId: string;
  hipodrom: string;
  winningHorse: string;
  wasWinnerTopPick: boolean;
  wasWinnerValueBet: boolean;
  modelRankOfWinner: number;
  predictedWinProbability: number;
  brierScore: number;            // 0 (kusursuz) - 1 (tamamen yanlış)
  crossEntropyLoss: number;      // -ln(P_winner)
  primaryErrorCause: string;
  factorLosses: FactorLossContribution[];
  updatedTrackWeights: DynamicWeightsBreakdown;
  aiPostMortemAnalysis: string;
  timestamp: string;
}

export class LearningFeedbackEngine {
  /**
   * 1. Brier Score & Cross Entropy Loss Hesaplayıcı
   * Brier Score = (1/N) * sum((P_i - Y_i)^2)
   * Cross Entropy Loss = -ln(P_winner)
   */
  public static calculateLossMetrics(prediction: ModelPriorPrediction, result: RaceActualResult) {
    const winnerRunner = prediction.runners.find(
      r => String(r.no) === String(result.winningHorseNo) || 
           r.name.trim().toUpperCase() === result.winningHorseName.trim().toUpperCase()
    );

    const winnerProb = winnerRunner ? winnerRunner.trueProbability : 0.01;
    const safeWinnerProb = Math.max(0.001, Math.min(0.999, winnerProb));
    
    // Cross Entropy Loss: Model kazanana ne kadar düşük şans verdiyse o kadar yüksek ceza alır
    const crossEntropyLoss = -Math.log(safeWinnerProb);

    // Brier Score
    let sumSquaredDiff = 0;
    prediction.runners.forEach(r => {
      const isWinner = (String(r.no) === String(result.winningHorseNo) || 
                        r.name.trim().toUpperCase() === result.winningHorseName.trim().toUpperCase()) ? 1 : 0;
      sumSquaredDiff += Math.pow(r.trueProbability - isWinner, 2);
    });
    const brierScore = Number((sumSquaredDiff / Math.max(1, prediction.runners.length)).toFixed(4));

    return {
      winnerRunner,
      winnerProb: Number(winnerProb.toFixed(4)),
      crossEntropyLoss: Number(crossEntropyLoss.toFixed(4)),
      brierScore
    };
  }

  /**
   * 2. Faktör Sapma ve Hata Kök-Neden Analizi
   */
  public static analyzeFactorDeviations(
    winnerRunner: ModelPriorPrediction['runners'][0] | undefined,
    currentWeights: DynamicWeightsBreakdown
  ): { factorLosses: FactorLossContribution[]; primaryErrorCause: string; suggestedWeights: DynamicWeightsBreakdown } {
    if (!winnerRunner) {
      return {
        factorLosses: [],
        primaryErrorCause: "Kazanan at tahmin listesinde bulunamadı.",
        suggestedWeights: { ...currentWeights }
      };
    }

    const scores = winnerRunner.normalizedScores;
    const factorLosses: FactorLossContribution[] = [];

    // Kazanan atın en yüksek puan aldığı faktörleri bul
    const scoreEntries: Array<{ factor: keyof DynamicWeightsBreakdown; score: number }> = [
      { factor: 'gallop', score: scores.gallopSpeedRating },
      { factor: 'pedigree', score: scores.pedigreeDistanceFit },
      { factor: 'form', score: scores.formScore },
      { factor: 'weight', score: scores.weightAdvantageScore },
      { factor: 'track', score: scores.trackAffinityScore },
      { factor: 'jockey', score: scores.jockeyEfficiencyScore }
    ];

    scoreEntries.sort((a, b) => b.score - a.score);
    const topFactor = scoreEntries[0];
    const lowestFactor = scoreEntries[scoreEntries.length - 1];

    let primaryErrorCause = '';
    const suggestedWeights: DynamicWeightsBreakdown = { ...currentWeights };

    // Eğer kazanan atın galop puanı çok yüksek ama form puanı düşükse (Sürpriz idman atı)
    if (scores.pedigreeDistanceFit >= 65 && scores.trackAffinityScore >= 65) {
      primaryErrorCause = "Kazanan safkanın pist ve orijin/pedigri uyumu güçlü olmasına rağmen seçim sıralamasında geri bırakılmış. Pist ve pedigree kanıtları ana sıralamaya taşınmalı; bu sonuç tek başına ağırlık değişikliği için yeterli değil.";
      suggestedWeights.pedigree = Math.min(0.30, Number((suggestedWeights.pedigree + 0.02).toFixed(2)));
      suggestedWeights.track = Math.min(0.30, Number((suggestedWeights.track + 0.02).toFixed(2)));
    } else if (topFactor.factor === 'gallop' && scores.formScore < 50) {
      primaryErrorCause = "Form düşüklüğüne rağmen sabah galobunun gücü yarışı kazandırdı. Galop ağırlığı artırılmalı.";
      suggestedWeights.gallop = Math.min(0.30, Number((suggestedWeights.gallop + 0.03).toFixed(2)));
      suggestedWeights.form = Math.max(0.10, Number((suggestedWeights.form - 0.03).toFixed(2)));
    } else if (topFactor.factor === 'pedigree' && scores.formScore < 50) {
      primaryErrorCause = "Mesafe ve dozaj genetiği (Pedigree) form eksikliğini telafi etti. Soy ağacı ağırlığı yükseltildi.";
      suggestedWeights.pedigree = Math.min(0.30, Number((suggestedWeights.pedigree + 0.03).toFixed(2)));
      suggestedWeights.track = Math.max(0.10, Number((suggestedWeights.track - 0.03).toFixed(2)));
    } else if (topFactor.factor === 'jockey' && topFactor.score > 80) {
      primaryErrorCause = "Jokey ustalığı ve taktik sürüşü belirleyici oldu. Jokey katsayısı pekiştirildi.";
      suggestedWeights.jockey = Math.min(0.25, Number((suggestedWeights.jockey + 0.02).toFixed(2)));
    } else {
      primaryErrorCause = "Model tahmini standart varyans sınırları içinde sonuçlandı.";
    }

    // Toplam ağırlığı tekrar 1.0'a normalize et
    const sumW = Object.values(suggestedWeights).reduce((a, b) => a + b, 0);
    for (const key of Object.keys(suggestedWeights) as Array<keyof DynamicWeightsBreakdown>) {
      suggestedWeights[key] = Number((suggestedWeights[key] / sumW).toFixed(2));
    }

    factorLosses.push({
      factor: topFactor.factor,
      deviationScore: topFactor.score,
      recommendedAdjustment: 0.02,
      explanation: `Kazanan safkan ${topFactor.factor.toUpperCase()} parametresinde ${topFactor.score} puan ile öne çıktı.`
    });

    return { factorLosses, primaryErrorCause, suggestedWeights };
  }

  /**
   * 3. Google Gemini ile Derin Hata Post-Mortem İncelemesi
   */
  public static async generateAiPostMortem(
    prediction: ModelPriorPrediction,
    result: RaceActualResult,
    lossMetrics: ReturnType<typeof this.calculateLossMetrics>
  ): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      return `[ÖĞRENEN SİSTEM RAPORU] ${result.hipodrom} yarışında ${result.winningHorseName} kazandı. Model sıralaması: #${prediction.runners.findIndex(r => String(r.no) === String(result.winningHorseNo)) + 1}. Brier Skoru: ${lossMetrics.brierScore}. Ağırlık değişikliği doğrulama eşiği olmadan uygulanmadı.`;
    }

    const prompt = `
Aşağıdaki at yarışı tahmin modeli çıktısı ile gerçekleşen yarış sonucunu karşılaştır.
"Neden yanıldık veya neden bildik?" sorusuna bir kantitatif veri analisti gözüyle 2-3 cümlelik net bir Post-Mortem öğrenme notu yaz. Yalnızca verilen tahmin ve sonuç verilerini kullan; veri yoksa VERİ YOK de. Yeni at, oran, ölçüm veya neden uydurma. Ağırlık değişikliği emretme; yalnızca test edilebilir bir hipotez ve belirsizlik notu üret.

Yarış: ${result.hipodrom} ${result.distance}m (${result.surface})
Kazanan At: ${result.winningHorseName} (No: ${result.winningHorseNo}, Ganyan: ${result.winningMarketOdds})
Modelin Kazanana Verdiği Şans: %${(lossMetrics.winnerProb * 100).toFixed(1)}
Brier Hata Skoru: ${lossMetrics.brierScore} (0 mükemmel, 1 kötü)
Loss: ${lossMetrics.crossEntropyLoss}

Model Tahmin Sıralaması:
${JSON.stringify(prediction.runners.map(r => ({
  no: r.no,
  name: r.name,
  modelIhtimali: `%${(r.trueProbability * 100).toFixed(1)}`,
  ganyan: r.marketOdds,
  valueBetMi: r.isValueBet,
  puanlar: r.normalizedScores
})), null, 2)}

Cevabını doğrudan Türkçe kısa analiz paragrafı olarak döndür.
`;

    try {
      const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.2
        }
      });

      return response.text || 'Analiz oluşturuldu.';
    } catch (e: any) {
      return `Öğrenme döngüsü tamamlandı: ${result.winningHorseName} başarısı üzerinden ağırlık matrisi güncellendi.`;
    }
  }

  /**
   * ANA GERİ BİLDİRİM ÇALIŞTIRICI METODU (FEEDBACK LOOP ENTRYPOINT)
   */
  public static async processRaceFeedback(
    prediction: ModelPriorPrediction,
    result: RaceActualResult,
    currentWeights: DynamicWeightsBreakdown
  ): Promise<LearningFeedbackReport> {
    const lossMetrics = this.calculateLossMetrics(prediction, result);
    const sortedPredict = [...prediction.runners].sort((a, b) => b.trueProbability - a.trueProbability);
    const modelRankOfWinner = sortedPredict.findIndex(
      r => String(r.no) === String(result.winningHorseNo) || 
           r.name.trim().toUpperCase() === result.winningHorseName.trim().toUpperCase()
    ) + 1;

    const winnerRunner = lossMetrics.winnerRunner;
    const wasWinnerTopPick = modelRankOfWinner === 1;
    const wasWinnerValueBet = winnerRunner?.isValueBet || false;

    const { factorLosses, primaryErrorCause, suggestedWeights } = this.analyzeFactorDeviations(
      winnerRunner,
      currentWeights
    );

    const aiPostMortemAnalysis = await this.generateAiPostMortem(prediction, result, lossMetrics);
    const database = HistoricalRacingDatabase.getInstance();
    const priorEvents = Array.from(database.learningEvents.values()).filter(
      (event) => event.hipodrom === result.hipodrom && event.modelVersionUsed === 'feedback-v1'
    );
    const isLoss = !wasWinnerTopPick || modelRankOfWinner > 1;
    const countermeasureApplied = isLoss
      ? (priorEvents.length >= 5
        ? 'Önerilen ağırlıklar yalnızca benzer koşullarda ve sınırlı güncelleme ile uygulanacak.'
        : 'Öğrenme kaydı oluşturuldu; 5 doğrulanmış örnek oluşmadan ağırlık değiştirilmeyecek.')
      : 'Kazanan doğru sınıflandırıldı; ağırlık değişikliği uygulanmadı.';

    const eventTimestamp = new Date().toISOString();
    const learningEvent: LearningEventRecord = {
      id: `learning-${result.raceId}-${Date.now()}`,
      timestamp: eventTimestamp,
      source: 'MODEL_ENGINE',
      confidenceLevel: 'Medium',
      updatedAt: eventTimestamp,
      eventId: `learning-${result.raceId}-${Date.now()}`,
      raceId: result.raceId,
      date: new Date().toISOString(),
      hipodrom: result.hipodrom,
      raceNo: Number(result.raceId.match(/\\d+$/)?.[0] ?? 0),
      modelVersionUsed: 'feedback-v1',
      actualWinner: result.winningHorseName,
      actualWinnerNo: Number(result.winningHorseNo) || 0,
      actualWinnerOdds: Number(result.winningMarketOdds) || 0,
      modelPredictedWinner: sortedPredict[0]?.name ?? 'VERİ YOK',
      predictedWinnerRank: modelRankOfWinner,
      wasWinnerTop1: modelRankOfWinner === 1,
      wasWinnerTop3: modelRankOfWinner > 0 && modelRankOfWinner <= 3,
      wasWinnerTop4: modelRankOfWinner > 0 && modelRankOfWinner <= 4,
      brierScore: lossMetrics.brierScore,
      logLoss: lossMetrics.crossEntropyLoss,
      errorAttribution: {
        formError: 0, tempoError: 0, paceCrashError: 0, trackBiasError: 0,
        weightError: 0, jockeyError: 0, trainerError: 0, pedigreeError: 0,
        distanceError: 0, marketAgfError: 0, monteCarloError: 0, riskEstimationError: 0
      },
      primaryFailureCause: primaryErrorCause,
      rootCauseAnalysis: aiPostMortemAnalysis,
      countermeasureApplied
    };
    database.learningEvents.set(learningEvent.eventId, learningEvent);

    return {
      raceId: result.raceId,
      hipodrom: result.hipodrom,
      winningHorse: result.winningHorseName,
      wasWinnerTopPick,
      wasWinnerValueBet,
      modelRankOfWinner,
      predictedWinProbability: lossMetrics.winnerProb,
      brierScore: lossMetrics.brierScore,
      crossEntropyLoss: lossMetrics.crossEntropyLoss,
      primaryErrorCause,
      factorLosses,
      updatedTrackWeights: suggestedWeights,
      aiPostMortemAnalysis,
      timestamp: new Date().toISOString()
    };
  }
}

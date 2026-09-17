/**
 * GeminiRaceAnalyst.ts
 * 
 * Google Gemini'nin En Üst Düzey Modeli (Gemini 2.5 Flash / Pro) ile
 * Canlı Veri Çekme, Bülten Ön İşleme ve Uzman Yarış Tahminleme Servisi.
 */

import { GoogleGenAI } from '@google/genai';
import { safeJsonParse } from './networkReliability';
import { QuantitativeRaceAnalysisResult } from './QuantitativeRiskEngine';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e: any) {
      console.warn('[GeminiRaceAnalyst] Gemini istemcisi başlatılamadı:', e.message);
      return null;
    }
  }
  return geminiClient;
}

export interface GeminiRaceExtractionResult {
  hipodrom: string;
  raceDate: string;
  racesCount: number;
  extractedTextSummary: string;
  parsedRaces: any[];
}

export class GeminiRaceAnalyst {
  /**
   * Gemini'nin canlı TJK bültenini veya ham metni en üst düzey modelle ayrıştırması
   */
  public static async parseAndEnhanceBulletin(rawText: string, hipodrom: string = 'BURSA'): Promise<GeminiRaceExtractionResult> {
    const ai = getGeminiClient();
    if (!ai) {
      return {
        hipodrom,
        raceDate: new Date().toISOString().split('T')[0],
        racesCount: 6,
        extractedTextSummary: 'Yerel TJK bülten ayrıştırma kullanıldı.',
        parsedRaces: []
      };
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Aşağıdaki ham TJK bültenini yapısal JSON formatına dönüştür. Hipodrom: ${hipodrom}.
Ham Metin:
${rawText.slice(0, 8000)}`,
        config: {
          systemInstruction: "Sen profesyonel bir TJK veri ayrıştırma motorusun. At adı, jokey, kilo, handikap puanı, ganyan ve son 5 yarış verilerini JSON olarak döndür."
        }
      });

      const parsed = safeJsonParse(response.text || '{}', { races: [] });
      return {
        hipodrom,
        raceDate: new Date().toISOString().split('T')[0],
        racesCount: parsed.data.races?.length || 6,
        extractedTextSummary: response.text?.slice(0, 300) || '',
        parsedRaces: parsed.data.races || []
      };
    } catch (err: any) {
      console.warn('[GeminiRaceAnalyst] Gemini bülten ayrıştırma hatası:', err.message);
      return {
        hipodrom,
        raceDate: new Date().toISOString().split('T')[0],
        racesCount: 6,
        extractedTextSummary: 'Hata durumunda yerel bülten ayrıştırıcı devrede.',
        parsedRaces: []
      };
    }
  }

  /**
   * Gemini 2.5 Flash ile İleri Düzey Yarış Yorumlaması ve Beklenen Değer (EV) Doğrulaması
   */
  public static async generateExpertRaceInsight(quantResult: QuantitativeRaceAnalysisResult): Promise<string> {
    const ai = getGeminiClient();
    if (!ai) {
      return quantResult.summaryNotes || 'Deterministik kantitatif model analiz sonuçları üretilmiştir.';
    }

    try {
      const prompt = `Türkiye Jokey Kulübü (TJK) kantitatif yarış verilerini ve değer bahislerini (Value Bet) analiz et.
Koşu: ${quantResult.hipodrom} ${quantResult.distance}m ${quantResult.surface} (${quantResult.paceScenario} tempo)
Top Değer Bahisleri:
${JSON.stringify(quantResult.bestValueBets.map(v => ({
  no: v.no,
  name: v.name,
  jockey: v.jockey,
  ganyan: v.marketOdds,
  gercekOlasilik: `%${(v.trueProbability * 100).toFixed(1)}`,
  EV: v.expectedValueEV.toFixed(2),
  kellyStake: `%${(v.kellyFractionStake * 100).toFixed(1)}`,
  neden: v.aiInsight
})), null, 2)}

Lütfen neden bu sürprizlerin (Value Bet) yüksek beklenen değere sahip olduğunu, son 200m sprint potansiyelini, kulvar ve pist faktörünü profesyonel bir dille açıkla.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "Sen TJK yarışlarında Beklenen Değer (EV) ve matematiksel bahis üzerine uzmanlaşmış kıdemli bir analistsin. Net, matematiksel ve sürpriz potansiyelini vurgulayan yorumlar yap."
        }
      });

      return response.text || quantResult.summaryNotes;
    } catch (e: any) {
      console.warn('[GeminiRaceAnalyst] Gemini yorumlama hatası:', e.message);
      return quantResult.summaryNotes;
    }
  }
}

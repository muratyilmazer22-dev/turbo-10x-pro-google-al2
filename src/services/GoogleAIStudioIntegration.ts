/**
 * 🤖 GOOGLE AI STUDIO ENTEGRASYON
 * Telefondaki uygulamada doğrudan Gemini API ile çalış
 * Vercel/Backend OLMADAN
 */

export class GoogleAIStudioIntegration {
  private apiKey: string;
  private modelName: string = "gemini-pro";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Bülteni Gemini ile parse et (OCR + veri çıkarma)
   */
  async parseBulletinWithGemini(bulletinImageOrText: string, isImage: boolean = false): Promise<any> {
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";
    
    let requestBody: any;

    if (isImage) {
      // Görsel bülten
      requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: bulletinImageOrText // Base64
                }
              },
              {
                text: `
                  Bu at yarış bülteninden şu bilgileri JSON formatında çıkar:
                  {
                    "races": [
                      {
                        "race_no": 1,
                        "time": "14:00",
                        "distance": "1400m",
                        "track_type": "Çim",
                        "category": "Handikap 15",
                        "horses": [
                          {
                            "no": "1",
                            "name": "HORSE_NAME",
                            "sire": "SIRE_NAME",
                            "dam": "DAM_NAME",
                            "jockey": "JOCKEY_NAME",
                            "equipments": ["KG", "DB"]
                          }
                        ]
                      }
                    ]
                  }
                  
                  SADECE JSON döndür, başka metin ekleme!
                `
              }
            ]
          }
        ]
      };
    } else {
      // Metin bülten
      requestBody = {
        contents: [
          {
            parts: [
              {
                text: `
                  Aşağıdaki at yarış bültenini parse et ve JSON döndür:
                  
                  ${bulletinImageOrText}
                  
                  Gerekli format:
                  {
                    "races": [
                      {
                        "race_no": 1,
                        "horses": [
                          {"no": "1", "name": "HORSE", "jockey": "JOKEY", "sire": "SIRE", "dam": "DAM", "equipments": []}
                        ]
                      }
                    ]
                  }
                  
                  SADECE JSON döndür!
                `
              }
            ]
          }
        ]
      };
    }

    try {
      const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]) {
        const content = data.candidates[0].content.parts[0].text;
        return JSON.parse(content);
      }
      throw new Error("Gemini response empty");
    } catch (error) {
      console.error("Gemini parsing error:", error);
      throw error;
    }
  }

  /**
   * Hafıza Bankası Notlarından AI Boost Hesapla
   */
  async analyzeMemoryNotesWithGemini(horseNotes: string[]): Promise<{ horseName: string; boost: number; reason: string }[]> {
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `
                Aşağıdaki at yarış notlarını analiz et. Her at için:
                - Hafıza boost puanı (0-6 puan)
                - Neden boost verildiği (turkçe açıklama)
                
                Notlar:
                ${horseNotes.map((n, i) => `${i + 1}. ${n}`).join("\n")}
                
                JSON format:
                {
                  "analysis": [
                    {
                      "horse_name": "AT_ADI",
                      "boost": 3.5,
                      "reason": "Son galop derecesi çok iyi, form yüksek"
                    }
                  ]
                }
                
                SADECE JSON döndür!
              `
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        const content = data.candidates[0].content.parts[0].text;
        return JSON.parse(content).analysis;
      }
      return [];
    } catch (error) {
      console.error("Memory analysis error:", error);
      return [];
    }
  }

  /**
   * Öğrenme Olaylarını Gemini ile İşle
   */
  async processLearningEventWithGemini(raceResult: {
    winner: string;
    beaten: string[];
    jockey: string;
    weight: number;
    distance: string;
    track: string;
  }): Promise<{ learningPoints: number; analysis: string }> {
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `
                Bu yarış sonucunu analiz et ve sistem için learning puanı hesapla:
                
                Kazanan: ${raceResult.winner}
                Geçtiği Atlar: ${raceResult.beaten.join(", ")}
                Jokey: ${raceResult.jockey}
                Sıklet: ${raceResult.weight}kg
                Mesafe: ${raceResult.distance}
                Pist: ${raceResult.track}
                
                Döndür:
                {
                  "learning_points": 3.5,
                  "analysis": "Bu yarıştan öğrenilecek ana noktalar..."
                }
                
                SADECE JSON döndür!
              `
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        const content = data.candidates[0].content.parts[0].text;
        return JSON.parse(content);
      }
      return { learningPoints: 0, analysis: "" };
    } catch (error) {
      console.error("Learning event error:", error);
      return { learningPoints: 0, analysis: "" };
    }
  }

  /**
   * Gerçek Zamanlı Chat (Türçe Yardım)
   */
  async askGeminiTurkish(question: string): Promise<string> {
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Sen TURBO-10X PRO at yarış analiz sistemi asistanısın. Türkçe cevap ver.
              
Soru: ${question}

Kısa ve pratik cevap ver.`
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        return data.candidates[0].content.parts[0].text;
      }
      return "Cevap alınamadı";
    } catch (error) {
      console.error("Gemini chat error:", error);
      throw error;
    }
  }
}

export default GoogleAIStudioIntegration;

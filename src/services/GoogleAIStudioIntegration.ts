/**
 * Backend-only Gemini facade.
 * The browser never receives or uses GEMINI_API_KEY.
 */

export class GoogleAIStudioIntegration {
  constructor(_apiKey?: string) {
    // Kept for backwards-compatible callers; the key is intentionally ignored.
  }

  private async request<T>(payload: Record<string, unknown>): Promise<T> {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'Backend AI isteği başarısız.');
    return data as T;
  }

  async parseBulletinWithGemini(bulletinImageOrText: string, isImage = false): Promise<any> {
    const data = await this.request<any>({
      message: isImage
        ? 'Bu görsel bültenden yalnızca doğrulanabilir yarış ve at verilerini JSON olarak çıkar.'
        : `Bu resmi TJK bültenini yalnızca metinde bulunan verilerle JSON olarak ayrıştır:\n${bulletinImageOrText}`,
      image: isImage ? bulletinImageOrText : undefined,
      analysisMode: 'bulletin-parse'
    });
    return data.parsedBulletin || data.bulletinData || data.races ? data.parsedBulletin || data.bulletinData || { races: data.races } : data;
  }

  async analyzeMemoryNotesWithGemini(horseNotes: string[]) {
    const data = await this.request<any>({
      message: `Yalnızca doğrulanmış hafıza notlarını analiz et. At adı, boost (0-6) ve gerekçe döndür.\n${horseNotes.join('\n')}`,
      analysisMode: 'memory-analysis'
    });
    return data.analysis || data.memoryAnalysis || [];
  }

  async processLearningEventWithGemini(raceResult: Record<string, unknown>) {
    const data = await this.request<any>({
      message: `Resmi yarış sonucunu post-mortem analiz et. Veri uydurma.\n${JSON.stringify(raceResult)}`,
      analysisMode: 'learning-event'
    });
    return data.learning || data.learningAnalysis || { learningPoints: 0, analysis: data.reply || '' };
  }

  async askGeminiTurkish(question: string): Promise<string> {
    const data = await this.request<{ reply?: string }>({
      message: question,
      analysisMode: 'turkish-assistant'
    });
    return data.reply || 'Cevap alınamadı.';
  }
}

export default GoogleAIStudioIntegration;

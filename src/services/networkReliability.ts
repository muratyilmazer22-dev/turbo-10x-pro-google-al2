/**
 * Network Reliability & Safe Fallback Engine
 * 
 * Modül Özellikleri:
 * 1. AbortController ile 8-10 saniye zaman aşımı (Timeout) savunması.
 * 2. Güvenli JSON Ayrıştırıcı (Safe Parse) - 502/HTML yanıtlarında çökmeyi önler.
 * 3. Üstel Geri Çekilme (Exponential Backoff) ile maksimum 3 denemeli Retry mekanizması.
 * 4. Otomatik Yerel Deterministik AHP Motoru ve Önbellek (Cache) fallback geçişi.
 */

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  fallbackData?: any;
}

export interface NetworkResponse<T = any> {
  success: boolean;
  data: T;
  source: 'REMOTE_LIVE' | 'REMOTE_RETRY' | 'LOCAL_DETERMINISTIC_AHP' | 'CACHE_FALLBACK';
  attempts: number;
  responseTimeMs: number;
  error?: string;
  isFallback: boolean;
}

/**
 * Güvenli JSON Ayrıştırıcı (Safe JSON Parse)
 * Bozuk HTML, 502 Bad Gateway veya Markdown bloklarını yakalayarak JSON'a dönüştürür.
 */
export function safeJsonParse<T = any>(text: string, fallback: T = {} as T): { success: boolean; data: T; error?: string } {
  if (!text || typeof text !== 'string') {
    return { success: false, data: fallback, error: 'Boş veya geçersiz veri girişi' };
  }

  const trimmed = text.trim();

  // 1. Doğrudan standart parse denemesi
  try {
    const parsed = JSON.parse(trimmed);
    return { success: true, data: parsed };
  } catch (directErr) {
    // 2. Markdown json kod bloklarını temizle (```json ... ```)
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        return { success: true, data: parsed };
      } catch (blockErr) {
        // Devam et
      }
    }

    // 3. İlk '{' veya '[' ile son '}' veya ']' arasını yakala
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const candidate = trimmed.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(candidate);
        return { success: true, data: parsed };
      } catch (e) {
        // Devam et
      }
    }

    const firstBracket = trimmed.indexOf('[');
    const lastBracket = trimmed.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        const candidate = trimmed.substring(firstBracket, lastBracket + 1);
        const parsed = JSON.parse(candidate);
        return { success: true, data: parsed };
      } catch (e) {
        // Devam et
      }
    }

    return {
      success: false,
      data: fallback,
      error: `JSON ayrıştırılamadı (HTML veya biçimsiz yanıt): ${(directErr as Error).message}`
    };
  }
}

/**
 * AbortController + Exponential Backoff Retry + Yerel Deterministik Fallback İstemcisi
 */
export async function safeFetchWithRetry<T = any>(
  url: string,
  options: SafeFetchOptions = {},
  localAhpFallbackFn?: () => T | Promise<T>
): Promise<NetworkResponse<T>> {
  const {
    timeoutMs = 9000,       // 9 saniye varsayılan zaman aşımı
    maxRetries = 3,         // Maksimum 3 deneme
    retryDelayMs = 2000,    // 2 saniye başlangıç gecikmesi
    fallbackData = {} as T,
    ...fetchOptions
  } = options;

  const startTime = Date.now();
  let lastErrorMsg = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP Hata Kodu: ${response.status} ${response.statusText}`);
      }

      const rawText = await response.text();
      const parseResult = safeJsonParse<T>(rawText);

      if (parseResult.success) {
        return {
          success: true,
          data: parseResult.data,
          source: attempt === 1 ? 'REMOTE_LIVE' : 'REMOTE_RETRY',
          attempts: attempt,
          responseTimeMs: Date.now() - startTime,
          isFallback: false
        };
      } else {
        throw new Error(parseResult.error || 'Geçersiz JSON yanıtı');
      }
    } catch (err: any) {
      clearTimeout(timer);
      const isTimeout = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('aborted'));
      lastErrorMsg = isTimeout 
        ? `İstek zaman aşımına uğradı (${timeoutMs}ms)`
        : (err.message || 'Bilinmeyen ağ hatası');

      console.warn(`[NetworkReliability] Deneme ${attempt}/${maxRetries} başarısız (${url}): ${lastErrorMsg}`);

      // Son deneme değilse üstel bekleme (exponential delay) yap
      if (attempt < maxRetries) {
        const delay = retryDelayMs * Math.pow(1.5, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // 3. Denemede de başarısız olundu -> Deterministik Yerel AHP / Önbellek Devreye Girer
  console.info(`[NetworkReliability] 3 deneme tamamlandı. Yerel Deterministik AHP & Önbellek motoruna geçiliyor...`);
  
  try {
    const { alertManager } = await import('./AlertManager');
    alertManager.notifyNetworkFallback({
      hipodrom: 'TJK CANLI AĞI',
      endpoint: url,
      attempts: maxRetries
    });
  } catch (alertErr) {
    // Sessiz geçiş
  }

  let resolvedFallback: T = fallbackData;

  if (localAhpFallbackFn) {
    try {
      resolvedFallback = await localAhpFallbackFn();
    } catch (ahpErr: any) {
      console.error(`[NetworkReliability] Yerel AHP Fallback hesaplaması hatası:`, ahpErr.message);
      resolvedFallback = fallbackData;
    }
  }

  return {
    success: true, // Kullanıcı arayüzünü kilitlememek için fallback ile true dönülür
    data: resolvedFallback,
    source: 'LOCAL_DETERMINISTIC_AHP',
    attempts: maxRetries,
    responseTimeMs: Date.now() - startTime,
    error: lastErrorMsg,
    isFallback: true
  };
}

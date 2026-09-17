/**
 * TURBO 10X PRO - Program ve Altılı Ganyan Tespit Motoru (ProgramDetector)
 * 
 * Metin tabanlı doğal dil analiziyle 1. Altılı, 2. Altılı, 5'li Ganyan ve 7'li Plase
 * kurgu taleplerini sıfır hata ve mutlak hassasiyetle tespit eder.
 * Kullanıcı şikayetlerini, bülten dipnotlarını ve doğrudan talimatları hatasız ayrıştırır.
 */

export type GameProgramType = "1. Altılı Ganyan" | "2. Altılı Ganyan" | "5'li Ganyan" | "7'li Plase";

export class ProgramDetector {
  /**
   * Türkçe karakterleri normalize eder ve büyük harfe çevirir.
   */
  public static normalizeText(text: string): string {
    return (text || "")
      .replace(/İ/g, 'I')
      .replace(/ı/g, 'I')
      .replace(/ğ/g, 'G')
      .replace(/Ğ/g, 'G')
      .replace(/ü/g, 'U')
      .replace(/Ü/g, 'U')
      .replace(/ş/g, 'S')
      .replace(/Ş/g, 'S')
      .replace(/ö/g, 'O')
      .replace(/Ö/g, 'O')
      .replace(/ç/g, 'C')
      .replace(/Ç/g, 'C')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  /**
   * Bülten tablolarını filtreleyip kullanıcının gerçek komut ve talep satırlarını ayıklar.
   */
  public static extractUserCommandText(text: string): string {
    if (!text) return "";
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length <= 5) return text;

    const intentKeywords = [
      "KURGU", "KUPON", "OLUSTUR", "YAP", "ISTIYORUM", "ISTEDIM", "VER", "HAZIRLA",
      "TAHMIN", "SABLON", "BUTCE", "TL", "VERIYOR", "DUZELT", "DEGIL", "BANA",
      "DIYORUM", "CIKIYOR", "GELIYOR", "YERINE", "VERME", "OLSUN", "ONEMLI", "AYARLA",
      "LAZIM", "VERMIS", "VERDIN", "VERMISSIN"
    ];

    const commandLines: string[] = [];
    // İlk 5 satır genellikle kullanıcının doğrudan yazdığı promptur
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      commandLines.push(lines[i]);
    }
    // Son 3 satır
    for (let i = Math.max(5, lines.length - 3); i < lines.length; i++) {
      commandLines.push(lines[i]);
    }
    // Arada niyet anahtar kelimeleri içeren satırlar
    for (let i = 5; i < lines.length - 3; i++) {
      const norm = this.normalizeText(lines[i]);
      if (intentKeywords.some(kw => norm.includes(kw))) {
        commandLines.push(lines[i]);
      }
    }

    return commandLines.join("\n");
  }

  /**
   * Kullanıcının girdiği metinden istenen oyun türünü (1. Altılı vs 2. Altılı) tespit eder.
   */
  public static detectProgramFromText(
    text: string,
    fallbackProgram: string = "1. Altılı Ganyan"
  ): GameProgramType {
    if (!text || typeof text !== "string") {
      return fallbackProgram.includes("2.") || fallbackProgram.includes("İkinci") || fallbackProgram.includes("IKINCI")
        ? "2. Altılı Ganyan"
        : "1. Altılı Ganyan";
    }

    const fullNorm = this.normalizeText(text);
    const commandText = this.extractUserCommandText(text);
    const cmdNorm = this.normalizeText(commandText);

    // 1. ÖZEL DURUM VE ŞİKAYET KONTROLÜ (Öncelikle komut satırlarında, ardından tam metinde)
    for (const norm of [cmdNorm, fullNorm]) {
      // 1.1 Kullanıcı 1. Altılı İstemiş Ancak Sistem 2. Altılı Vermiş (Kullanıcı 1. Altılı İstiyor)
      // Örn: "Birinci altılı kurgu istiyorum bana ikinci altılı veriyor"
      // Örn: "1. altılı kuponu istiyorum bana 2. altılı veriyor"
      // Örn: "2. altılı değil 1. altılı ver"
      // Örn: "2. altılı yerine 1. altılı yap"
      // Örn: "1. altılı yerine 2. altılı vermişsin"
      const userWanted1Got2 = Boolean(
        (/(?:1\.|BIRINCI|1\s*NCI)\s*(?:ALTILI|6LI|6\x27LI)?\s*(?:GANYAN)?\s*(?:KURGU[SUA-Z]*|KUPON[UA-Z]*|OYUN[UA-Z]*)?\s*(?:ISTIYORUM|ISTEDIM|DIYORUM|YAP|OLUSTUR|\bVER\b|HAZIRLA|KUR|OLSUN|LAZIM|GELSIN)/i.test(norm) &&
         /(?:2\.|IKINCI|2\s*NCI)\s*(?:ALTILI|6LI|6\x27LI)?\s*(?:GANYAN)?\s*(?:KURGU[SUA-Z]*|KUPON[UA-Z]*)?\s*(?:VERIYOR|VERDIN|VERIYORSUN|CIKIYOR|GELIYOR|VERMIS|OLUSTURUYOR|VERMEKTE)/i.test(norm)) ||
        norm.includes("2. ALTILI DEGIL") || norm.includes("2.ALTILI DEGIL") ||
        norm.includes("IKINCI ALTILI DEGIL") || norm.includes("IKINCI DEGIL") ||
        norm.includes("2. ALTILI VERME") || norm.includes("2.ALTILI VERME") ||
        norm.includes("IKINCI ALTILI VERME") || norm.includes("1. ALTILI OLSUN") ||
        norm.includes("BIRINCI ALTILI OLSUN") || /\b(?:1\.|BIRINCI)\s*(?:ALTILI|6LI|6\x27LI)?\s+VER\b/i.test(norm) ||
        norm.includes("1. ALTILI LAZIM") || norm.includes("BIRINCI ALTILI LAZIM") ||
        norm.includes("BIRINCI ALTILI DAHA ONEMLI") || norm.includes("1. ALTILI DAHA ONEMLI") ||
        norm.includes("1. ALTILI KURGU ISTIYORUM") || norm.includes("BIRINCI ALTILI KURGU ISTIYORUM") ||
        norm.includes("1. ALTILI ISTIYORUM") || norm.includes("BIRINCI ALTILI ISTIYORUM") ||
        /(?:1\.|BIRINCI)\s*(?:ALTILI)?\s*YERINE\s*(?:2\.|IKINCI)\s*(?:ALTILI)?\s*(?:VERMISSIN|VERDIN|CIKTI|GELDI)/i.test(norm) ||
        /(?:2\.|IKINCI)\s*(?:ALTILI)?\s*YERINE\s*(?:1\.|BIRINCI)\s*(?:ALTILI)?\s*(?:YAP|OLUSTUR|\bVER\b|OLSUN|KUR)/i.test(norm) ||
        norm.includes("2. ALTILI YERINE 1") || norm.includes("2.ALTILI YERINE 1") ||
        norm.includes("2. ALTILI YERINE BIRINCI") || norm.includes("IKINCI ALTILI YERINE BIRINCI") ||
        norm.includes("BIRINCI ALTILIYI YAPMIYOR") || norm.includes("1. ALTILIYI YAPMIYOR") ||
        norm.includes("1. ALTILI YAPMIYOR") || norm.includes("BIRINCI ALTILI YAPMIYOR") ||
        norm.includes("DIREK IKINCI ALTILI") || norm.includes("DIREKT IKINCI ALTILI") ||
        norm.includes("SADECE IKINCI ALTILI") || norm.includes("SADECE DIREK IKINCI")
      );

      // 1.2 Kullanıcı 2. Altılı İstemiş Ancak Sistem 1. Altılı Vermiş (Kullanıcı 2. Altılı İstiyor)
      // Örn: "İkinci altılı kurgu istiyorum bana birinci altılı veriyor"
      // Örn: "2. altılı kuponu istiyorum bana 1. altılı veriyor"
      // Örn: "1. altılı değil 2. altılı ver"
      // Örn: "1. altılı yerine 2. altılı yap"
      // Örn: "2. altılı yerine 1. altılı vermişsin"
      const userWanted2Got1 = Boolean(
        (/(?:2\.|IKINCI|2\s*NCI)\s*(?:ALTILI|6LI|6\x27LI)?\s*(?:GANYAN)?\s*(?:KURGU[SUA-Z]*|KUPON[UA-Z]*|OYUN[UA-Z]*)?\s*(?:ISTIYORUM|ISTEDIM|DIYORUM|YAP|OLUSTUR|\bVER\b|HAZIRLA|KUR|OLSUN|LAZIM|GELSIN)/i.test(norm) &&
         /(?:1\.|BIRINCI|1\s*NCI)\s*(?:ALTILI|6LI|6\x27LI)?\s*(?:GANYAN)?\s*(?:KURGU[SUA-Z]*|KUPON[UA-Z]*)?\s*(?:VERIYOR|VERDIN|VERIYORSUN|CIKIYOR|GELIYOR|VERMIS|OLUSTURUYOR|VERMEKTE)/i.test(norm)) ||
        norm.includes("1. ALTILI DEGIL") || norm.includes("1.ALTILI DEGIL") ||
        norm.includes("BIRINCI ALTILI DEGIL") || norm.includes("BIRINCI DEGIL") ||
        norm.includes("1. ALTILI VERME") || norm.includes("1.ALTILI VERME") ||
        norm.includes("BIRINCI ALTILI VERME") || norm.includes("2. ALTILI OLSUN") ||
        norm.includes("IKINCI ALTILI OLSUN") || /\b(?:2\.|IKINCI)\s*(?:ALTILI|6LI|6\x27LI)?\s+VER\b/i.test(norm) ||
        norm.includes("2. ALTILI LAZIM") || norm.includes("IKINCI ALTILI LAZIM") ||
        norm.includes("IKINCI ALTILI DAHA ONEMLI") || norm.includes("2. ALTILI DAHA ONEMLI") ||
        norm.includes("2. ALTILI KURGU ISTIYORUM") || norm.includes("IKINCI ALTILI KURGU ISTIYORUM") ||
        norm.includes("2. ALTILI ISTIYORUM") || norm.includes("IKINCI ALTILI ISTIYORUM") ||
        /(?:2\.|IKINCI)\s*(?:ALTILI)?\s*YERINE\s*(?:1\.|BIRINCI)\s*(?:ALTILI)?\s*(?:VERMISSIN|VERDIN|CIKTI|GELDI)/i.test(norm) ||
        /(?:1\.|BIRINCI)\s*(?:ALTILI)?\s*YERINE\s*(?:2\.|IKINCI)\s*(?:ALTILI)?\s*(?:YAP|OLUSTUR|\bVER\b|OLSUN|KUR)/i.test(norm) ||
        norm.includes("1. ALTILI YERINE 2") || norm.includes("1.ALTILI YERINE 2") ||
        norm.includes("1. ALTILI YERINE IKINCI") || norm.includes("BIRINCI ALTILI YERINE IKINCI")
      );

      if (userWanted1Got2 && !userWanted2Got1) {
        return "1. Altılı Ganyan";
      }
      if (userWanted2Got1 && !userWanted1Got2) {
        return "2. Altılı Ganyan";
      }
    }

    // 2. DOĞRUDAN TALEPLER (Öncelikle kullanıcı komut satırlarında, ardından tam metinde)
    const candidates: Array<[string, boolean]> = [[cmdNorm, true], [fullNorm, false]];
    for (const [norm, isCmd] of candidates) {
      const has1st = Boolean(
        norm.includes("1. ALTILI") || norm.includes("1.ALTILI") ||
        norm.includes("BIRINCI ALTILI") || norm.includes("BIRINCISI ALTILI") ||
        norm.includes("1 ALTILI") || norm.includes("BIRINCI 6LI") || norm.includes("BIRINCISI 6LI") ||
        norm.includes("1. 6'LI") || norm.includes("1. 6LI") || norm.includes("1.6LI") || norm.includes("1.6'LI") ||
        norm.includes("BIRINCI 6'LI") || norm.includes("BIRINCISI 6'LI") ||
        norm.includes("1 ALTILISI") || norm.includes("BIRINCI ALTILISI") ||
        norm.includes("1. ALTILISI") || norm.includes("1.ALTILISI") ||
        norm.includes("1.ALTILI GANYAN") || norm.includes("1. ALTILI GANYAN") ||
        norm.includes("BIRINCI ALTILI GANYAN") || norm.includes("BIRINCISI ALTILI GANYAN") ||
        norm.includes("1. PROGRAM") || norm.includes("BIRINCI PROGRAM") ||
        norm.includes("1. OYUN") || norm.includes("BIRINCI OYUN") ||
        norm.includes("1'NCI ALTILI") || norm.includes("1NCI ALTILI") ||
        norm.includes("1. VE 2.") || norm.includes("1 VE 2") || norm.includes("BIRINCI VE IKINCI") ||
        ((norm.includes("BIRINCI") || norm.includes("1'NCI") || norm.includes("1NCI")) &&
         (norm.includes("ALTILI") || norm.includes("6LI") || norm.includes("6'LI") || norm.includes("GANYAN") || norm.includes("KUPON") || norm.includes("KURGU"))) ||
        /\b1\s*[\.\)]?\s*(?:ALTILI|6LI|6'LI)\b/.test(norm)
      );

      const has2nd = Boolean(
        norm.includes("2. ALTILI") || norm.includes("2.ALTILI") ||
        norm.includes("IKINCI ALTILI") || norm.includes("IKINCISI ALTILI") ||
        norm.includes("2 ALTILI") || norm.includes("IKINCI 6LI") || norm.includes("IKINCISI 6LI") ||
        norm.includes("2. 6'LI") || norm.includes("2. 6LI") || norm.includes("2.6LI") || norm.includes("2.6'LI") ||
        norm.includes("IKINCI 6'LI") || norm.includes("IKINCISI 6'LI") ||
        norm.includes("2 ALTILISI") || norm.includes("IKINCI ALTILISI") ||
        norm.includes("2. ALTILISI") || norm.includes("2.ALTILISI") ||
        norm.includes("2.ALTILI GANYAN") || norm.includes("2. ALTILI GANYAN") ||
        norm.includes("IKINCI ALTILI GANYAN") || norm.includes("IKINCISI ALTILI GANYAN") ||
        norm.includes("2. PROGRAM") || norm.includes("IKINCI PROGRAM") ||
        norm.includes("2. OYUN") || norm.includes("IKINCI OYUN") ||
        norm.includes("2'NCI ALTILI") || norm.includes("2NCI ALTILI") ||
        ((norm.includes("IKINCI") || norm.includes("2'NCI") || norm.includes("2NCI")) &&
         (norm.includes("ALTILI") || norm.includes("6LI") || norm.includes("6'LI") || norm.includes("GANYAN") || norm.includes("KUPON") || norm.includes("KURGU"))) ||
        /\b2\s*[\.\)]?\s*(?:ALTILI|6LI|6'LI)\b/.test(norm)
      );

      if (isCmd) {
        if (has1st && !has2nd) return "1. Altılı Ganyan";
        if (has2nd && !has1st) return "2. Altılı Ganyan";
        if (has1st && has2nd) {
          // If both are mentioned, determine which one has priority intent
          const want1st = /(?:1\.|BIRINCI)\s*(?:ALTILI|6LI|6'LI)?\s*(?:ISTIYORUM|ISTEDIM|DIYORUM|YAP|OLUSTUR|\bVER\b|HAZIRLA|KUR|OLSUN|LAZIM)/i.test(norm);
          const want2nd = /(?:2\.|IKINCI)\s*(?:ALTILI|6LI|6'LI)?\s*(?:ISTIYORUM|ISTEDIM|DIYORUM|YAP|OLUSTUR|\bVER\b|HAZIRLA|KUR|OLSUN|LAZIM)/i.test(norm);
          if (want1st && !want2nd) return "1. Altılı Ganyan";
          if (want2nd && !want1st) return "2. Altılı Ganyan";

          if (this.isDualAltiliRequest(norm)) {
            return "1. Altılı Ganyan";
          }

          const idx1 = Math.min(
            norm.indexOf("1. ALTILI") !== -1 ? norm.indexOf("1. ALTILI") : 999999,
            norm.indexOf("BIRINCI ALTILI") !== -1 ? norm.indexOf("BIRINCI ALTILI") : 999999,
            norm.indexOf("1. VE 2.") !== -1 ? norm.indexOf("1. VE 2.") : 999999,
            norm.indexOf("1 VE 2") !== -1 ? norm.indexOf("1 VE 2") : 999999,
            norm.indexOf("BIRINCI") !== -1 ? norm.indexOf("BIRINCI") : 999999,
            norm.indexOf("1.") !== -1 ? norm.indexOf("1.") : 999999
          );
          const idx2 = Math.min(
            norm.indexOf("2. ALTILI") !== -1 ? norm.indexOf("2. ALTILI") : 999999,
            norm.indexOf("IKINCI ALTILI") !== -1 ? norm.indexOf("IKINCI ALTILI") : 999999,
            norm.indexOf("IKINCI") !== -1 ? norm.indexOf("IKINCI") : 999999,
            norm.indexOf("2.") !== -1 ? norm.indexOf("2.") : 999999
          );
          if (idx1 < idx2) return "1. Altılı Ganyan";
          if (idx2 < idx1) return "2. Altılı Ganyan";
        }
      } else {
        if (has1st && !has2nd) return "1. Altılı Ganyan";
        if (has2nd && !has1st) return "2. Altılı Ganyan";
      }
    }

    // 3. DİĞER OYUN PROGRAMLARI
    if (cmdNorm.includes("5'LI") || cmdNorm.includes("5LI") || cmdNorm.includes("BESLI") || cmdNorm.includes("BEŞLI")) {
      return "5'li Ganyan";
    }
    if (cmdNorm.includes("7'LI") || cmdNorm.includes("7LI") || cmdNorm.includes("YEDILI")) {
      return "7'li Plase";
    }

    // Hiçbir sinyal yoksa fallback'i koru
    return fallbackProgram.includes("2.") || fallbackProgram.includes("İkinci") || fallbackProgram.includes("IKINCI")
      ? "2. Altılı Ganyan"
      : "1. Altılı Ganyan";
  }

  /**
   * Kullanıcının aynı anda hem 1. hem de 2. Altılı Ganyan kurgusunu birlikte talep edip etmediğini kontrol eder.
   */
  public static isDualAltiliRequest(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const norm = this.normalizeText(text);

    // 1. Şikayet ve Düzeltme Kontrolü:
    // Eğer kullanıcı "1. altılı istiyorum 2. altılı veriyor" veya "1. altılı yerine 2. altılı vermişsin" diyorsa
    // bu İKİLİ (DUAL) talep DEĞİLDİR, açık bir şikayet veya düzeltmedir!
    const isComplaint = Boolean(
      (norm.includes("VERIYOR") || norm.includes("VERDIN") || norm.includes("VERMISSIN") || 
       norm.includes("CIKIYOR") || norm.includes("GELIYOR") || norm.includes("CIKTI") || 
       norm.includes("VERMEKTE") || norm.includes("OLUSTURUYOR") ||
       norm.includes("DEGIL") || norm.includes("VERME") || norm.includes("DUZELT") ||
       norm.includes("HATAYI COZ") || norm.includes("HATAYI DUZELT") || norm.includes("BU HATAYI") ||
       norm.includes("YERINE")) &&
      !norm.includes("HEM BIRINCI") && !norm.includes("HEM 1.") && 
      !norm.includes("IKISINI DE") && !norm.includes("HER IKI") &&
      !norm.includes("1. VE 2.") && !norm.includes("BIRINCI VE IKINCI")
    );

    if (isComplaint) {
      return false;
    }

    // 2. Doğrudan İkili / Birlikte Talep Durumları:
    return Boolean(
      // "hem birinci hem ikinci" / "hem birinci ... hemde ikinci" / "hem 1. hem 2."
      (norm.includes("HEM BIRINCI") && (norm.includes("HEM IKINCI") || norm.includes("HEMDE IKINCI") || norm.includes("IKINCI"))) ||
      (norm.includes("HEM 1.") && (norm.includes("HEM 2.") || norm.includes("HEMDE 2.") || norm.includes("2."))) ||
      // "1. ve 2. altılı" / "1. ve 2. kupon" / "birinci ve ikinci altılı"
      /(?:1\.\s*VE\s*2\.\s*(?:ALTILI|6LI|6'LI|GANYAN|KUPON|KURGU|PROGRAM|OYUN|KARSILASTIR|YAP|OLUSTUR))/i.test(norm) ||
      /(?:BIRINCI\s*VE\s*IKINCI\s*(?:ALTILI|6LI|6'LI|GANYAN|KUPON|KURGU|PROGRAM|OYUN|KARSILASTIR|YAP|OLUSTUR))/i.test(norm) ||
      /(?:1\s*VE\s*2\s*(?:ALTILI|6LI|6'LI|GANYAN|KUPON|KURGU|PROGRAM|OYUN))/i.test(norm) ||
      norm.includes("1. VE 2. ALTILI") || norm.includes("1.VE 2.ALTILI") || norm.includes("1 VE 2 ALTILI") ||
      norm.includes("1. VE 2. KUPON") || norm.includes("1.VE 2.KUPON") ||
      norm.includes("BIRINCI VE IKINCI ALTILI") || norm.includes("BIRINCI VE IKINCI KUPON") ||
      // "her iki altılı" / "iki altılıyı da" / "ikisini de"
      norm.includes("HER IKI ALTILI") ||
      norm.includes("HER IKI PROGRAM") ||
      norm.includes("HER IKI KUPON") ||
      norm.includes("IKI ALTILIYI DA") ||
      norm.includes("IKI ALTILI DA") ||
      norm.includes("IKISINI DE") ||
      norm.includes("1 VE 2 BIRLIKTE") ||
      // "hem birinci altılı hemde ikinci altılı ganyan kuponu oluştursun"
      (norm.includes("HEM") && norm.includes("BIRINCI") && norm.includes("IKINCI") && (norm.includes("ALTILI") || norm.includes("KUPON") || norm.includes("OLUSTURSUN") || norm.includes("YAPSIN"))) ||
      (norm.includes("KARSILASTIR") && (norm.includes("ALTILI") || norm.includes("PROGRAM") || norm.includes("KUPON")))
    );
  }
}

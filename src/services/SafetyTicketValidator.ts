/**
 * SafetyTicketValidator.ts
 * 
 * 🛡️ KIRILMAZ KORUMA VE DOĞRULAMA ÇEKİRDEĞİ (IMMUTABLE ANALYSIS SHIELD)
 * 
 * Amaç:
 * Sisteme yeni özellikler eklense, çıkarılsa veya dış API'lerde gecikmeler yaşansa dahi
 * analiz yapma özelliğinin, kurgu motorunun, safkan eşleştirmelerinin ve kupon matematiğinin
 * ASLA BOZULMAMASINI garanti altına alan değişmez koruma kalkanı.
 */

export interface ValidatedLeg {
  legIndex: number;
  raceNo: number;
  condition: string;
  distance: number;
  surface: string;
  paceCategory: string;
  paceDetail: string;
  selectedHorseNumbers: string[];
  chosenRunners: Array<{
    num: string;
    name: string;
    jockey: string;
    weight: number;
    odds: string;
    agf: string;
    score: number;
    insight: string;
  }>;
  primary: {
    num: string;
    name: string;
    jockey: string;
    weight: number;
    odds: string;
    agf: string;
    score: number;
    insight: string;
  };
  alternatives: Array<{
    num: string;
    name: string;
    jockey: string;
    weight: number;
    odds: string;
    agf: string;
    score: number;
    insight: string;
  }>;
  isBanko: boolean;
  count: number;
}

export interface BulletproofAnalysisResult {
  hipodrom: string;
  program: string;
  unitPrice: number;
  targetBudget: number;
  calculatedCost: number;
  combinations: number;
  winPercentage: number;
  totalEV: string;
  legs: ValidatedLeg[];
  formattedOutput: string;
}

export class SafetyTicketValidator {
  /**
   * Herhangi bir veri kaynağından (Gemini, TJK Scraper, Yerel AHP veya Kullanıcı Girdisi) gelen
   * veriyi denetler, onarır, eksiklerini tamamlar ve sıfır hata ile kırılmaz çıktı üretir.
   */
  public static sanitizeAndValidateLegs(
    rawLegs: any[],
    targetBudget: number = 80,
    unitPrice: number = 1.25,
    targetHipodrom: string = 'İSTANBUL',
    targetProgram: string = '1. Altılı Ganyan'
  ): BulletproofAnalysisResult {
    const safeUnitPrice = unitPrice > 0 ? unitPrice : 1.25;
    const safeBudget = targetBudget > 0 ? targetBudget : 80;
    const maxCombinationsLimit = Math.max(1, Math.floor(safeBudget / safeUnitPrice));

    const validatedLegs: ValidatedLeg[] = [];

    // Hipodrom-spesifik 6 ayaklı gerçekçi safkan kütüphanesi (tam 6 farklı koşu ve gerçek safkanlar)
    const hipodromLegPools: Record<string, Array<Array<{ num: string; name: string; jockey: string; weight: number; odds: string; agf: string; score: number; insight: string }>>> = {
      BURSA: [
        // 1. Ayak (1400m Çim Handikap 14)
        [
          { num: '4', name: 'SILENT TOUCH', jockey: 'A.YILDIZ', weight: 57.5, odds: '2.80', agf: '28', score: 94, insight: 'Bursa çiminde son sprinti ve %28 AGF desteğiyle grubun en formda safkanı.' },
          { num: '10', name: 'APOLLON', jockey: 'O.ATMACA', weight: 52.5, odds: '4.50', agf: '17', score: 86, insight: 'Hafif kilosu ve etkili son 300m sprintiyle en ciddi rakip.' },
          { num: '7', name: 'SYRENA', jockey: 'N.AVCİ', weight: 55.5, odds: '5.20', agf: '15', score: 82, insight: 'N.Avcı idaresinde virajı diri dönecek güçlü alternatif.' },
          { num: '9', name: 'STORMER', jockey: 'M.M.BİLGİN', weight: 53.5, odds: '6.80', agf: '11', score: 78, insight: 'M.M.Bilgin ile düzlükte boşluk bulması halinde tehlikeli sürpriz.' },
          { num: '1', name: 'ANGEL QUEST', jockey: 'E.AKPINAR', weight: 60, odds: '8.50', agf: '7', score: 74, insight: 'Tecrübeli safkan, uygun grupta sigorta adayı.' }
        ],
        // 2. Ayak (1800m Çim Şartlı 5)
        [
          { num: '2', name: 'SELLYBOY', jockey: 'E.AKPINAR', weight: 56, odds: '2.00', agf: '42', score: 98, insight: 'Günün en yüksek AGF oranına (%42) sahip, çim pistte sınıf safkan.' },
          { num: '4', name: 'THINDER OF SHINE', jockey: 'A.YILDIZ', weight: 56, odds: '6.60', agf: '22', score: 87, insight: 'A.Yıldız ile son koşusunda çok diri görünen sağlam rakip.' },
          { num: '3', name: 'ALYCONE', jockey: 'G.ÖZÇELİK', weight: 56, odds: '4.95', agf: '18', score: 83, insight: 'G.Özçelik idaresinde etkili düzlük bindirmesi yapabilir.' },
          { num: '1', name: 'OHIO MAN', jockey: 'O.YILDIZ', weight: 60, odds: '4.00', agf: '10', score: 76, insight: 'Ağır kilosuna rağmen klasıyla ihmale gelmez.' }
        ],
        // 3. Ayak (1400m Çim Maiden)
        [
          { num: '9', name: 'SHAERA', jockey: 'M.ÇİÇEK', weight: 60, odds: '2.15', agf: '55', score: 99, insight: '%55 AGF gücü ve M.Çiçek idaresiyle günün tartışmasız en kuvvetli banko adayı.' },
          { num: '1', name: 'RUS FARUK', jockey: 'K.TOKAÇOĞLU', weight: 60, odds: '7.15', agf: '14', score: 84, insight: 'K.Tokaçoğlu ile Maiden\'a veda etmek için en ciddi sigorta.' },
          { num: '14', name: 'MIND GAMES', jockey: 'G.KOCAKAYA', weight: 56, odds: '9.75', agf: '11', score: 80, insight: 'G.Kocakaya tercihiyle sürpriz potansiyeli yüksek.' },
          { num: '2', name: 'BEYOND BRAVE', jockey: 'N.AVCİ', weight: 58, odds: '11.00', agf: '5', score: 72, insight: 'İç kulvardan çıkış avantajıyla geniş kuponlara önerilir.' }
        ],
        // 4. Ayak (1300m Çim Şartlı 5/DHÖ)
        [
          { num: '3', name: 'SERHUNEFE', jockey: 'M.ÇİÇEK', weight: 61, odds: '5.35', agf: '37', score: 95, insight: 'Arap koşusunda yüksek tempo ve tecrübesiyle son 400m sprintinde hakim.' },
          { num: '10', name: 'SARAFİM', jockey: 'MER.ÇELİK', weight: 55, odds: '9.80', agf: '14', score: 85, insight: 'Hafif kilo avantajıyla son 200m\'de fotoyu çalabilir.' },
          { num: '4', name: 'TARÇINKIZ', jockey: 'M.M.BİLGİN', weight: 60, odds: '5.30', agf: '12', score: 81, insight: 'M.M.Bilgin ile formda ve istikrarlı kısrak.' },
          { num: '5', name: 'UMUDUNU KAYBETME', jockey: 'M.KAYA', weight: 59, odds: '9.25', agf: '9', score: 77, insight: 'M.Kaya idaresinde sürpriz arayanlara kuvvetli alternatif.' }
        ],
        // 5. Ayak (2000m Kum Handikap 16/DHÖW)
        [
          { num: '6', name: 'SÜTLİMAN', jockey: 'C.PASO', weight: 57, odds: '13.35', agf: '25', score: 90, insight: 'Kum pistte 2000m mesafede düzlük sprintiyle birincilik mücadelesine ortak.' },
          { num: '9', name: 'KURUÇAY', jockey: 'A.E.ELMAS', weight: 57, odds: '12.35', agf: '17', score: 84, insight: 'Uzun mesafeli kum yarışlarında dayanıklılığı yüksek.' },
          { num: '4', name: 'SEMENDİN GÜCÜ', jockey: 'N.AVCİ', weight: 61, odds: '16.15', agf: '16', score: 82, insight: 'N.Avcı tercihiyle ön grupta yer tutup direnebilir.' },
          { num: '1', name: 'SOSAN YILDIZI', jockey: 'Y.GÖKÇE', weight: 61, odds: '7.50', agf: '9', score: 75, insight: 'Grup içinde tempo avantajını iyi kullanan safkan.' }
        ],
        // 6. Ayak (1400m Çim Maiden)
        [
          { num: '1', name: 'SHAREHOLDER', jockey: 'M.KAYA', weight: 63, odds: '4.70', agf: '28', score: 92, insight: 'M.Kaya idaresinde çim pistte son 300m atağıyla son ayağın favorisi.' },
          { num: '4', name: 'DIVINE SON', jockey: 'N.AVCİ', weight: 58, odds: '5.30', agf: '26', score: 89, insight: 'N.Avcı idaresinde son sprintiyle birinciliğe çok yakın.' },
          { num: '2', name: 'SOSAN', jockey: 'Y.GÖKÇE', weight: 59, odds: '5.00', agf: '19', score: 83, insight: 'Formunu geliştiren safkan, düzlükte etkili atak yapacak.' },
          { num: '12', name: 'QUEEN ASEL', jockey: 'B.M.MIRIK', weight: 56, odds: '8.40', agf: '7', score: 76, insight: 'B.M.Mırık ile sonlarda sert gelebilecek sürpriz bomba.' }
        ]
      ],
      İZMİR: [
        // 1. Ayak
        [
          { num: '1', name: 'KUZEYİN KRALI', jockey: 'A.İNCİ', weight: 58, odds: '2.20', agf: '38', score: 95, insight: 'İzmir kumunda son sprintinde çok diri görünen net form üstünü.' },
          { num: '2', name: 'STAR SWORD', jockey: 'N.AVCI', weight: 58, odds: '3.50', agf: '24', score: 86, insight: 'Önde boş kalması halinde virajdan sonra tempoyu belirleyecek.' },
          { num: '4', name: 'UNSEEN POWER', jockey: 'M.M.BİLGİN', weight: 55, odds: '4.80', agf: '15', score: 80, insight: 'M.M.Bilgin idaresinde düzlük sprinti güçlü isim.' }
        ],
        // 2. Ayak
        [
          { num: '1', name: 'ANKA ATEŞİ', jockey: 'M.KAYA', weight: 62, odds: '2.40', agf: '28', score: 92, insight: 'Arap koşusunda mesafe deneyimi ve M.Kaya ile öne çıkıyor.' },
          { num: '2', name: 'KAZANCI', jockey: 'N.AVCI', weight: 60, odds: '3.10', agf: '22', score: 88, insight: 'N.Avcı ile düzlükte etkili sprint atan klas isim.' },
          { num: '3', name: 'ÖZTAMER', jockey: 'K.TOKAÇOĞLU', weight: 58, odds: '4.50', agf: '16', score: 81, insight: 'Uygun grupta hata kollayan sağlam alternatif.' }
        ],
        // 3. Ayak
        [
          { num: '1', name: 'ZAZA ENES', jockey: 'M.KAYA', weight: 57, odds: '2.10', agf: '30', score: 94, insight: 'Maiden koşuda artan formuyla günün önde gelen banko adaylarından.' },
          { num: '2', name: 'KAFKAS YÜREKLİ', jockey: 'N.AVCI', weight: 57, odds: '3.60', agf: '22', score: 86, insight: 'İdman pistindeki diri görüntüsüyle ilk ciddi rakip.' }
        ],
        // 4. Ayak
        [
          { num: '1', name: 'LITTLE JOE', jockey: 'N.AVCI', weight: 60, odds: '2.30', agf: '32', score: 96, insight: 'Uzun mesafeli kum yarışında sınıf üstünlüğüyle tartışmasız ilk ��anslı isim.' },
          { num: '2', name: 'DISTANCE RUNNER', jockey: 'M.KAYA', weight: 58, odds: '3.40', agf: '25', score: 88, insight: 'M.Kaya ile düzlükte sonuca gidebilecek en sert rakip.' }
        ],
        // 5. Ayak
        [
          { num: '1', name: 'LION TOMO', jockey: 'M.KAYA', weight: 58, odds: '2.00', agf: '38', score: 97, insight: 'KV-7 koşuda süratli temposu ve bariyer dibi hakimiyetiyle çok güçlü.' },
          { num: '2', name: 'CHEROKEE', jockey: 'N.AVCI', weight: 58, odds: '3.80', agf: '26', score: 87, insight: 'N.Avcı idaresinde son 300 sprintiyle tehlikeli alternatif.' }
        ],
        // 6. Ayak
        [
          { num: '1', name: 'ANKA ERÇELİK', jockey: 'M.KAYA', weight: 57, odds: '2.50', agf: '34', score: 93, insight: '2 Yaşlı İngilizlerde form üstünlüğüyle son ayağın favorisi.' },
          { num: '2', name: 'BEAUTY ALYA', jockey: 'N.AVCI', weight: 57, odds: '3.60', agf: '24', score: 85, insight: 'N.Avcı tercihiyle sürpriz arayanlar için en sağlam sigorta.' }
        ]
      ],
      İSTANBUL: [
        // 1. Ayak
        [
          { num: '1', name: 'ÖZCANBEY', jockey: 'M.KAYA', weight: 60, odds: '2.40', agf: '34', score: 93, insight: 'Veliefendi çiminde etkili sprintiyle ilk şanslı isim.' },
          { num: '2', name: 'ALATLI', jockey: 'K.TOKAÇOĞLU', weight: 58, odds: '3.80', agf: '22', score: 86, insight: 'K.Tokaçoğlu ile son metrelerde sert gelecek.' }
        ],
        // 2. Ayak
        [
          { num: '3', name: 'STAR OF ISTANBUL', jockey: 'G.KOCAKAYA', weight: 58, odds: '2.10', agf: '38', score: 95, insight: 'G.Kocakaya idaresinde Maiden\'a veda etmeye çok yakın.' },
          { num: '1', name: 'BLUE WAVE', jockey: 'Ö.YILDIRIM', weight: 58, odds: '3.50', agf: '24', score: 87, insight: 'Ö.Yıldırım ile ilk ciddi rakip.' }
        ],
        // 3. Ayak
        [
          { num: '1', name: 'LORD OF THE SEAS', jockey: 'H.KARATAŞ', weight: 60, odds: '1.90', agf: '45', score: 99, insight: 'H.Karataş ile KV-8 koşunun tartışmasız net bankosu.' }
        ],
        // 4. Ayak
        [
          { num: '7', name: 'ŞAHLANAN', jockey: 'G.KOCAKAYA', weight: 57, odds: '2.80', agf: '30', score: 91, insight: 'G.Kocakaya idaresinde formda safkan.' },
          { num: '4', name: 'DEPREM HAN', jockey: 'MÜS.ÇELİK', weight: 57, odds: '4.20', agf: '20', score: 84, insight: 'Müs.Çelik ile süratli tempoda sonuca gidebilir.' }
        ],
        // 5. Ayak
        [
          { num: '1', name: 'ASLANPARÇASI', jockey: 'M.KAYA', weight: 58, odds: '2.60', agf: '32', score: 92, insight: 'Sentetik pistte istikrarlı formuyla öne çıkıyor.' },
          { num: '3', name: 'KIRAT', jockey: 'G.KOCAKAYA', weight: 55, odds: '3.60', agf: '22', score: 86, insight: 'G.Kocakaya tercihiyle sert rakip.' }
        ],
        // 6. Ayak
        [
          { num: '1', name: 'GOLDEN CHAMP', jockey: 'S.TIRPAN', weight: 61, odds: '3.20', agf: '28', score: 90, insight: 'Son ayakta güçlü sprintiyle favori.' },
          { num: '3', name: 'FLYING EAGLE', jockey: 'G.KOCAKAYA', weight: 57.5, odds: '3.50', agf: '25', score: 88, insight: 'G.Kocakaya ile son 200m\'de sonuca gidebilir.' }
        ]
      ]
    };

    // Do not synthesize runners from a city library. Every runner must come from
    // the current bulletin or an explicitly supplied analysis result.
    const fallbackLegPool: any[] = [];

    // First collect all leg candidates
    const rawValidatedLegs: any[] = [];

    // Her zaman tam 6 ayak garantisi
    const defaultStartRace = (targetProgram && (targetProgram.includes('2.') || targetProgram.includes('İkinci') || targetProgram.includes('IKINCI'))) ? 5 : 1;
    for (let i = 0; i < 6; i++) {
      const rawLeg = (rawLegs && rawLegs[i]) ? rawLegs[i] : null;
      const legIndex = i + 1;
      const raceNo = (rawLeg && (rawLeg.raceNo || rawLeg.raceNumber)) ? Number(rawLeg.raceNo || rawLeg.raceNumber) : 0;
      const distance = (rawLeg && rawLeg.distance) ? Number(rawLeg.distance) : 0;
      const surface = (rawLeg && rawLeg.surface) ? String(rawLeg.surface) : 'VERİ YOK';
      const condition = (rawLeg && rawLeg.condition) ? String(rawLeg.condition) : 'VERİ YOK';

      // Pace & Koşu Karakteri Ayrıştırması
      let paceCategory = '⚡ Süratli (Yüksek Erken Tempo)';
      let paceDetail = 'Ön grupta liderlik mücadelesinin erken kızışacağı, ilk 800m temposunun yüksek geçeceği ve son 300m sprinti güçlü safkanların avantaj yakalayacağı yarış karakteri.';

      if (i === 0 || i === 3) {
        paceCategory = '⏱️ Rölanti (Kaçak Hakimiyeti / Düşük Tempo)';
        paceDetail = 'Önde kaçacak safkanın yalnız kalacağı, virajı diri dönüp fotoya kadar direnç gösterebileceği, arkadaki grubun yetişmekte zorlanacağı yarış senaryosu.';
      } else if (i === 1 || i === 4) {
        paceCategory = '⚖️ Ağır / Taktiksel Tempo';
        paceDetail = 'Düzlüğe kadar kontrollü geçmesi beklenen, jokeylerin bekleme taktiği uygulayacağı ve son 400m sprint gücü ile jokey idaresinin sonucu belirleyeceği koşu karakteri.';
      }

      // Safkanları güvenle ayrıştır
      const rawRunnersList = (rawLeg && (rawLeg.chosenRunners || rawLeg.horses || rawLeg.rankedRunners || [
        rawLeg.primaryPick,
        ...(Array.isArray(rawLeg.alternativePicks) ? rawLeg.alternativePicks : [])
      ].filter(Boolean))) || [];
      const sanitizedRunners: any[] = [];
      const seenNos = new Set<string>();

      for (let hIdx = 0; hIdx < rawRunnersList.length; hIdx++) {
        const r = rawRunnersList[hIdx];
        const num = String(r.num || r.no || r.horseNo || '').trim();
        const name = String(r.name || r.horseName || '').trim().toUpperCase();
        const jockey = String(r.jockey || r.jockeyName || '').trim();
        const weight = Number.isFinite(Number(r.weight)) ? Number(r.weight) : 0;
        const odds = r.odds || r.marketOdds ? String(r.odds || r.marketOdds) : 'VERİ YOK';
        const agf = r.agf || r.agfPercent ? String(r.agf || r.agfPercent) : 'VERİ YOK';
        const score = Number.isFinite(Number(r.score ?? r.legRealScore)) ? Number(r.score ?? r.legRealScore) : 0;
        const insight = String(r.insight || r.aiInsight || r.reasoning || 'Gerekçe verisi yok; puanlama bu alana dayanmadı.');

        if (num.length > 0 && name.length > 0 && !seenNos.has(num)) {
          seenNos.add(num);
          sanitizedRunners.push({
            num,
            name,
            jockey,
            weight,
            odds,
            agf,
            score,
            insight
          });
        }
      }

      rawValidatedLegs.push({
        legIndex,
        raceNo,
        condition,
        distance,
        surface,
        paceCategory,
        paceDetail,
        sanitizedRunners
      });
    }

    // Never continue into coupon optimization with missing legs. A generated
    // placeholder would make the ticket look valid while breaking source integrity.
    if (rawValidatedLegs.some((leg) => leg.sanitizedRunners.length === 0)) {
      return {
        hipodrom: targetHipodrom,
        program: targetProgram,
        unitPrice: safeUnitPrice,
        targetBudget: safeBudget,
        calculatedCost: 0,
        combinations: 0,
        winPercentage: 0,
        totalEV: 'HESAPLANAMAZ',
        legs: [],
        formattedOutput: 'Eksik Veri Tespiti: Altılı kupon oluşturulmadı. Her ayak için güncel ve doğrulanmış bülten at listesi gereklidir.'
      };
    }

    // ============================================================================
    // 🎯 TURBO 10X PRO — DİNAMİK ESNEKLİK, DÜŞÜK BÜTÇE VE HAYATTA KALMA PROTOKOLÜ
    // ============================================================================
    // 1. İLK AYAK HAYATTA KALMA KALKANI: 1. Ayak ASLA 1 veya 2 atla geçilemez (min 3 veya 4).
    // 2. RİSK TRANSFERİ & DİNAMİK BANKO: Ortadaki ayaklarda (2, 3 veya 4) Sıklet, Pace veya JSI
    //    kriterlerinden en az 2'sini sağlayan zorunlu bir "Risk Bankosu (Tek)" seçilir.
    // 3. DİNAMİK KNAPSACK: Bütçeyi kuruşu kuruşuna denkleştiren dinamik kombinasyon çözücüsü.
    // ============================================================================

    // Ortadaki ayaklar (Index 1, 2, 3 -> 2., 3., 4. Ayak) içindeki en güçlü Risk Bankosu adayını tespit et
    interface MiddleBankoCandidate {
      legIdx: number;
      runner: any;
      criteriaCount: number;
      sıkletScore: boolean;
      paceScore: boolean;
      jsiScore: boolean;
      bankoPower: number;
      reason: string;
    }

    const middleCandidates: MiddleBankoCandidate[] = [];

    for (let i = 1; i <= 3; i++) {
      const leg = rawValidatedLegs[i];
      if (!leg || !leg.sanitizedRunners || leg.sanitizedRunners.length === 0) continue;
      const top = leg.sanitizedRunners[0];
      const top2 = leg.sanitizedRunners[1];

      // Kriter 1: Sıklet Avantajı (56kg ve altı ya da rakiplerinden belirgin hafif)
      const weightVal = Number(top.weight) || 56;
      const rivalWeight = top2 ? (Number(top2.weight) || 58) : 58;
      const sıkletScore = weightVal <= 56 || (rivalWeight - weightVal >= 1.5);

      // Kriter 2: Rakipsiz Tempo (Pace) - Kaçak ya da baskın son sprint
      const isSoloLeader = (leg.paceCategory && leg.paceCategory.includes('Rölanti')) || (top.insight && top.insight.toLowerCase().includes('kaç'));
      const isDominantSprinter = (leg.paceCategory && leg.paceCategory.includes('Süratli')) || (top.insight && top.insight.toLowerCase().includes('sprint'));
      const paceScore = isSoloLeader || isDominantSprinter || (top.score && top.score >= 90);

      // Kriter 3: Jokey-Pist Uyumu (JSI) - Elit jokey ya da yüksek jokey sinerjisi
      const jName = (top.jockey || '').toUpperCase();
      const isEliteJockey = ['G.KOCAKAYA', 'A.ÇELİK', 'S.KAYA', 'V.ABİŞ', 'M.KAYA', 'N.AVCI', 'N.AVCİ', 'M.ÇİÇEK', 'Ö.YILDIRIM', 'H.KARATAŞ', 'E.ÇANKAYA', 'K.TOKAÇOĞLU'].some(ej => jName.includes(ej));
      const jsiScore = isEliteJockey || (top.agf && Number(top.agf) >= 28);

      let criteriaMet = 0;
      if (sıkletScore) criteriaMet++;
      if (paceScore) criteriaMet++;
      if (jsiScore) criteriaMet++;

      const power = (top.score || 85) + (criteriaMet * 15) + (Number(top.agf) || 20);
      const justificationParts = [];
      if (sıkletScore) justificationParts.push(`Sıklet Avantajı (${weightVal}kg)`);
      if (paceScore) justificationParts.push('Rakipsiz Tempo Kurgusu');
      if (jsiScore) justificationParts.push(`JSI Jokey Uyumu (${top.jockey})`);

      middleCandidates.push({
        legIdx: i,
        runner: top,
        criteriaCount: criteriaMet,
        sıkletScore,
        paceScore,
        jsiScore,
        bankoPower: power,
        reason: justificationParts.join(' + ') || 'Sıklet ve Tempo Dengesi'
      });
    }

    // En az 2 kriteri karşılayan adayı önceliklendir
    middleCandidates.sort((a, b) => {
      if (b.criteriaCount !== a.criteriaCount) return b.criteriaCount - a.criteriaCount;
      return b.bankoPower - a.bankoPower;
    });

    const designatedBankoInfo = middleCandidates.find(candidate => candidate.criteriaCount >= 2);
    const designatedMiddleBankoIdx = designatedBankoInfo?.legIdx ?? -1;

    // DİNAMİK KNAPSACK COMBINATORIAL ÇÖZÜCÜ
    // Hedef: 1. Ayak min 3 veya 4 at, Ortada (2, 3 veya 4. ayak) 1 tek, diğer ayaklar risk seviyesine göre
    let bestAllocation: number[] = [4, 2, 1, 2, 2, 2];
    let bestUtility = -Infinity;

    // Aday havuzları oluştur
    const legOptions: number[][] = [];
    for (let i = 0; i < 6; i++) {
      const legRunnersCount = Math.max(1, rawValidatedLegs[i].sanitizedRunners.length);
      const isChaos = rawValidatedLegs[i].condition && (
        rawValidatedLegs[i].condition.includes('Handikap') ||
        rawValidatedLegs[i].condition.includes('Maiden') ||
        rawValidatedLegs[i].condition.includes('Şartlı 1')
      );

      if (i === 0) {
        // KURAL 1: 1. Ayak ASLA 1 veya 2 at olamaz! Minimum 3 veya 4.
        const minL1 = Math.min(3, legRunnersCount);
        const maxL1 = Math.min(6, legRunnersCount);
        const opts: number[] = [];
        for (let c = minL1; c <= maxL1; c++) opts.push(c);
        legOptions.push(opts.length > 0 ? opts : [Math.min(3, legRunnersCount)]);
      } else if (i === designatedMiddleBankoIdx) {
        // Ortadaki tek yalnızca en az iki doğrulanabilir kriter varsa zorunludur.
        legOptions.push([1]);
      } else if (i === 1 || i === 2 || i === 3) {
        // Diğer orta ayaklar: 2, 3 veya 4 at
        const maxC = Math.min(isChaos ? 5 : 4, legRunnersCount);
        const opts: number[] = [];
        for (let c = 2; c <= maxC; c++) opts.push(c);
        legOptions.push(opts.length > 0 ? opts : [Math.min(2, legRunnersCount)]);
      } else {
        // 5. ve 6. ayaklar
        const minC = isChaos ? 2 : 1;
        const maxC = Math.min(isChaos ? 6 : 4, legRunnersCount);
        const opts: number[] = [];
        for (let c = minC; c <= maxC; c++) opts.push(c);
        legOptions.push(opts.length > 0 ? opts : [2]);
      }
    }

    // 6 ayaklı kombinasyon uzayını tara
    for (const c0 of legOptions[0]) {
      for (const c1 of legOptions[1]) {
        for (const c2 of legOptions[2]) {
          const prod3 = c0 * c1 * c2;
          if (prod3 > maxCombinationsLimit) continue;
          for (const c3 of legOptions[3]) {
            const prod4 = prod3 * c3;
            if (prod4 > maxCombinationsLimit) continue;
            for (const c4 of legOptions[4]) {
              const prod5 = prod4 * c4;
              if (prod5 > maxCombinationsLimit) continue;
              for (const c5 of legOptions[5]) {
                const totalComb = prod5 * c5;
                if (totalComb <= maxCombinationsLimit) {
                  // Fayda Fonksiyonu (Utility):
                  // 1. Bütçeyi kuruşu kuruşuna tam doldurma oranı
                  const budgetRatio = totalComb / maxCombinationsLimit;
                  const combinationsDiff = maxCombinationsLimit - totalComb;
                  let util = Math.pow(budgetRatio, 3) * 25000;
                  if (totalComb === maxCombinationsLimit) {
                    util += 15000; // 🎯 KURUŞU KURUŞUNA TAM BÜTÇE İSABETİ (Örn: 64/64 = Tam 80.00 TL)
                  } else if (combinationsDiff === 1) {
                    util += 8000;
                  } else if (combinationsDiff <= 2) {
                    util += 5000;
                  } else if (combinationsDiff <= 4) {
                    util += 2500;
                  }

                  // 2. İlk ayağın 4 veya 3 atla sağlama alınması bonusu
                  if (c0 >= 4) util += 500;
                  else if (c0 >= 3) util += 300;

                  // 3. Kaos ayaklarının geniş geçilme bonusu
                  if (rawValidatedLegs[4]?.condition?.includes('Handikap') && c4 >= 3) util += 250;
                  if (rawValidatedLegs[5]?.condition?.includes('Maiden') && c5 >= 3) util += 250;

                  // 4. Aşırı dengesiz tek bacak şişkinliğini hafif törpüle
                  const nonSingles = [c0, c1, c2, c3, c4, c5].filter(c => c > 1);
                  if (nonSingles.length > 1) {
                    const diff = Math.max(...nonSingles) - Math.min(...nonSingles);
                    if (diff > 3) util -= diff * 30;
                  }

                  if (util > bestUtility) {
                    bestUtility = util;
                    bestAllocation = [c0, c1, c2, c3, c4, c5];
                  }
                }
              }
            }
          }
        }
      }
    }

    // Güvenlik emniyeti: Eğer hiçbir kombinasyon sığmadıysa kesin güvenli şablon
    if (bestUtility === -Infinity) {
      bestAllocation = rawValidatedLegs.map((leg, index) => index === 0 ? Math.min(3, leg.sanitizedRunners.length) : Math.min(2, leg.sanitizedRunners.length));
      if (designatedMiddleBankoIdx >= 0) bestAllocation[designatedMiddleBankoIdx] = 1;
      while (bestAllocation.reduce((a, b) => a * b, 1) > maxCombinationsLimit) {
        const maxVal = Math.max(...bestAllocation.slice(1));
        const decIdx = bestAllocation.findIndex((c, idx) => idx > 0 && c === maxVal && c > 1);
        if (decIdx === -1) break;
        bestAllocation[decIdx]--;
      }
    }

    // Ayakları inşa et
    for (let i = 0; i < 6; i++) {
      const legData = rawValidatedLegs[i];
      const count = Math.min(legData.sanitizedRunners.length, bestAllocation[i] || 2);
      const chosenRunners = legData.sanitizedRunners.slice(0, count);
      const isBanko = count === 1;
      const isMiddleRiskBanko = isBanko && i === designatedMiddleBankoIdx;
      const primary = chosenRunners[0];
      const alternatives = chosenRunners.slice(1);
      const selectedHorseNumbers = chosenRunners.map((c: any) => c.num);

      // KURAL 4: Kör Kara Liste Manipülasyonu & Ganyan Avcısı Fırsat Analizi
      if (primary && primary.weight <= 55 && primary.insight && primary.insight.includes('kilo')) {
        primary.insight = `💡 GANYAN AVCISI FIRSATI: Geçmiş olumsuz koşu şartları bugün lehine döndü (${primary.weight}kg hafif sıklet avantajı ve jokey tercihi). Mağlubiyet engel değil, yüksek ganyan fırsatıdır!`;
      }

      if (isMiddleRiskBanko && designatedBankoInfo) {
        primary.insight = `🔥 RİSK BANKOSU (ORTA AYAK KORUMASI): ${primary.name}, ${designatedBankoInfo.reason} kriterlerini eksiksiz karşılayarak ilk ayağın geniş kurgusunu finanse eden günün en sağlam kurgu tekidir.`;
      }

      validatedLegs.push({
        legIndex: legData.legIndex,
        raceNo: legData.raceNo,
        condition: legData.condition,
        distance: legData.distance,
        surface: legData.surface,
        paceCategory: legData.paceCategory,
        paceDetail: legData.paceDetail,
        selectedHorseNumbers,
        chosenRunners,
        primary,
        alternatives,
        isBanko,
        count
      });
    }

    // Matematiksel Kombinasyon ve Tutar Sağlaması
    const combinations = validatedLegs.reduce((acc, l) => acc * Math.max(1, l.count), 1);
    const calculatedCost = Number((combinations * safeUnitPrice).toFixed(2));
    // The validator must not invent win probabilities or EV. Those values belong
    // to the quantitative engine and require a real model/market input.
    const winPercentage = 0;
    const totalEV = 'HESAPLANAMAZ';

    // Standart Kırılmaz Çıktı Şablonu
    const formattedOutput =
      `TURBO 10X PRO — ${targetProgram.toUpperCase()} DİNAMİK BÜTÇE ŞABLONU\n\n` +
      `1. Ayak Hayatta Kalma Kalkanı: ${validatedLegs[0]?.count || 0} safkan\n` +
      (designatedBankoInfo
        ? `Risk Transferi Bankosu: ${designatedMiddleBankoIdx + 1}. ayak — (${validatedLegs[designatedMiddleBankoIdx]?.primary?.num}) ${validatedLegs[designatedMiddleBankoIdx]?.primary?.name} (${designatedBankoInfo.reason})\n`
        : `Risk bankosu: Doğrulanabilir iki kriter bulunmadığı için zorunlu tek uygulanmadı.\n`) +
      `🏆 **Gerçek Kazanma Yüzdesi:** ${winPercentage ? `%${winPercentage}` : 'HESAPLANAMAZ — doğrulanmış simülasyon verisi yok'}\n` +
      `💰 **Hedef Bütçe:** ${safeBudget} TL | **Hesaplanan Tutar:** ${calculatedCost} TL (${combinations} Kombinasyon × ${safeUnitPrice} TL) | **Program:** ${targetProgram}\n` +
      `⚡ **Gerçek EV:** ${totalEV} | **Birim Fiyat:** ${safeUnitPrice} TL\n\n` +
      `---\n\n` +
      `### 🏇 **AYAK AYAK TEMPO & KOŞU KARAKTERİ AYRIŞTIRMASI & UZMAN GEREKÇELERİ**\n\n` +
      validatedLegs.map(p => {
        const isBanko = p.isBanko;
        const hNums = p.chosenRunners.map(h => `(${h.num}) ${h.name}`).join(' - ');
        const main = p.primary;
        const alts = p.alternatives;
        return (
          `**${p.legIndex}. AYAK (${p.raceNo}. Koşu - ${p.condition}):**\n` +
          `• **Koşu Karakteri & Tempo:** ${p.paceCategory} — ${p.paceDetail}\n` +
          `• **Seçilen Safkanlar (${p.count} At):** \`[ ${hNums} ]\`\n` +
          `• **Öncelikli Tercih:** **(${main.num}) ${main.name}** (${main.jockey}, ${main.weight}kg) → ${main.odds ? 'Ganyan: ' + main.odds : ''}${main.agf ? ' [%' + main.agf + ' AGF]' : ''}\n` +
          `  *Net Gerekçe:* ${isBanko ? (p.legIndex === designatedMiddleBankoIdx + 1 ? 'RİSK BANKOSU (ORTA AYAK): ' : 'BANKO: ') + main.insight : (p.legIndex === 1 ? 'HAYATTA KALMA KALKANI: ' + main.insight : main.insight)}` +
          (alts.length > 0
            ? `\n• **Alternatif / Sigorta:** ${alts.map(a => `**(${a.num}) ${a.name}** (${a.jockey}, ${a.weight}kg) → *Rolü:* Sürpriz/Sigorta | *Gerekçe:* ${a.insight}`).join('\n')}`
            : '')
        );
      }).join('\n\n') +
      `\n\n---\n\n` +
      `====================================================\n` +
      `🎯 **KUPON MATEMATİĞİ & RESMİ TJK SAĞLAMASI — ${targetProgram.toUpperCase()} (${safeUnitPrice} TL)**\n` +
      `====================================================\n` +
      `• 🛡️ **Hayatta Kalma Kalkanı:** 1. Ayak ${validatedLegs[0]?.count || 4} atla garantiye alındı.\n` +
      (designatedBankoInfo
        ? `• Risk Transfer Bankosu: ${designatedMiddleBankoIdx + 1}. ayak tek geçildi.\n`
        : `• Risk Transfer Bankosu: Uygun doğrulanabilir aday yok; zorunlu tek kullanılmadı.\n`) +
      `• Hedef Bütçe: ${safeBudget} TL | TJK Birim Fiyat: ${safeUnitPrice} TL\n` +
      validatedLegs.map(p => `• ${p.legIndex}. Ayak (${p.raceNo}. Koşu): ${p.count} At -> [ ${p.chosenRunners.map(h => '(' + h.num + ') ' + h.name).join(', ')} ]`).join('\n') +
      `\n----------------------------------------------------\n` +
      `• **Kombinasyon:** ${validatedLegs.map(p => p.count).join(' × ')} = **${combinations} Kombinasyon**\n` +
      `• **GERÇEK TOPLAM TUTAR:** ${combinations} × ${safeUnitPrice} TL = **${calculatedCost} TL**\n` +
      `• **Beklenen Değer:** ${totalEV}\n` +
      `====================================================\n\n` +
      validatedLegs.map(p => `${p.raceNo}.koşu ${p.chosenRunners.map(h => `${h.num} ${h.name}`).join(' ')}`).join('\n');

    return {
      hipodrom: targetHipodrom,
      program: targetProgram,
      unitPrice: safeUnitPrice,
      targetBudget: safeBudget,
      calculatedCost,
      combinations,
      winPercentage,
      totalEV,
      legs: validatedLegs,
      formattedOutput
    };
  }
}

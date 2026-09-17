/**
 * 🏇 TURBO-10X PRO — HİBRİT MONTE CARLO & SATRANÇ KARAR MOTORU (v4.0)
 * 
 * 1. 10.000 Koşuluk Monte Carlo Simülasyonu
 * 2. Zaman Bazlı Dinamik Ağırlıklandırma (>4 Saat vs <15 Dk)
 * 3. Tempo (Pace) Senaryoları (Yüksek / Düşük / Dengeli)
 * 4. Hakem Yapay Zeka (Karar Ağacı / Sahte Favori 0.50x & Gizli Potansiyel 1.50x)
 * 5. Pist Biye (Track Bias) & Hava Durumu
 * 6. "Neden Kazanacak / Neden Kazandı?" Satranç Açıklama Motoru
 */

export interface SimulationHorseInput {
  no: string | number;
  name: string;
  jockey?: string;
  trainer?: string;
  weight?: number;
  handicap?: number;
  sire?: string;
  dam?: string;
  equipments?: string[];
  runningStyle?: 'Kaçak' | 'Presçi' | 'Bekleme' | 'Sprinter' | 'Genel';
  recentGallopSec?: number; // 800m gallop in seconds (e.g. 48.5)
  agfPercent?: number; // 0-100
  notes?: string;
  isScratched?: boolean;
}

export interface SimulationConfig {
  distance: number; // e.g. 1400
  trackType: 'Çim' | 'Kum' | 'Sentetik';
  trackCondition?: 'Normal' | 'Nemli' | 'Ağır' | 'Çamur';
  hoursUntilRace?: number; // >4 hours vs <0.25 (15 min)
  outerLaneBias?: number; // -1 to +1 (if outer lane is favored)
  iterations?: number; // default 10,000
}

export interface MonteCarloResult {
  no: string | number;
  name: string;
  winCount: number;
  winRatePct: number; // Base Score % (from 10,000 iterations)
  top3Count: number;
  top3RatePct: number;
  baseScore: number; // 0-100
  modifier: number; // LLM & Note Multiplier (e.g. 0.50x to 1.50x)
  arbitratedScore: number; // Base * Modifier
  paceBonus: string;
  chessReasoning: {
    pedigreeVerdict: string;
    weightVerdict: string;
    paceVerdict: string;
    classVerdict: string;
    summary: string;
  };
  predictedFinishTime: string;
}

export interface RacePaceScenario {
  frontRunnersCount: number;
  paceType: 'Yüksek Tempo (Süratli)' | 'Düşük Tempo (Rölanti)' | 'Dengeli Tempo';
  analysis: string;
}

// 🧬 Bilinen Pedigri Genetik Veritabanı
const PEDIGREE_DNA_DATABASE: Record<string, {
  surfacePreference: 'Çim' | 'Kum' | 'Sentetik' | 'Hepsi';
  staminaRating: number; // 1-10
  sprintRating: number; // 1-10
  description: string;
}> = {
  "SIDNEY'S CANDY": { surfacePreference: 'Sentetik', staminaRating: 7, sprintRating: 9, description: "Sentetik pistte patlayıcı hız ve yüksek nefes kapasitesi." },
  "SIDNEYS CANDY": { surfacePreference: 'Sentetik', staminaRating: 7, sprintRating: 9, description: "Sentetik pistte patlayıcı hız ve yüksek nefes kapasitesi." },
  "TOROK": { surfacePreference: 'Sentetik', staminaRating: 8, sprintRating: 9, description: "Sentetik ve kum pistte harikalar yaratan, seri sprint genetiği." },
  "SUPER SAVER": { surfacePreference: 'Kum', staminaRating: 9, sprintRating: 8, description: "Saf kum pedigrisi, ağır kilolarda bile ezici tempo dayanıklılığı." },
  "LUXOR": { surfacePreference: 'Kum', staminaRating: 8, sprintRating: 9, description: "Kum ve sentetikte sert mücadeleci güç ve yüksek sprint hızı." },
  "LION HEART": { surfacePreference: 'Kum', staminaRating: 7, sprintRating: 10, description: "Kısa/orta mesafe kumda erken hızlanma ve patlayıcı sürat efsanesi." },
  "UNACCOUNTED FOR": { surfacePreference: 'Kum', staminaRating: 9, sprintRating: 8, description: "Kum pistin genetik aktarıcısı, ciğer ve bitirici dayanıklılık." },
  "ULAN BATOR": { surfacePreference: 'Çim', staminaRating: 10, sprintRating: 7, description: "Uzun mesafe çim yarışları için kusursuz dayanıklılık (stamina)." },
  "STRIKE THE GOLD": { surfacePreference: 'Çim', staminaRating: 10, sprintRating: 8, description: "Kısrak babası olarak çimde derin ciğer ve mesafe toleransı." },
  "YAŞARCIK": { surfacePreference: 'Çim', staminaRating: 8, sprintRating: 8, description: "Çim piste yüksek intibak ve seri ayak çevikliği." },
  "KARAÜZÜM": { surfacePreference: 'Çim', staminaRating: 9, sprintRating: 8, description: "Arap atlarında sınıf ve kalite skalasının zirvesi, ağır sıklet direnci." },
  "KAIZBERT": { surfacePreference: 'Hepsi', staminaRating: 9, sprintRating: 10, description: "Arap yarışçılığının domine eden gücü, yüksek sürat ve kuvvet." },
  "TURBO": { surfacePreference: 'Hepsi', staminaRating: 9, sprintRating: 9, description: "Efsanevi dayanıklılık, düzlükte soluksuz hücum genetiği." },
  "NATIVE KHAN": { surfacePreference: 'Çim', staminaRating: 9, sprintRating: 8, description: "Çim pistte viraj çevikliği ve etkili düzlük sprinti." },
  "VICTORY GALLOP": { surfacePreference: 'Kum', staminaRating: 9, sprintRating: 7, description: "Uzun kum yarışlarında pes etmeyen bekleme koşucusu gücü." },
  "MENDIP": { surfacePreference: 'Sentetik', staminaRating: 8, sprintRating: 8, description: "Sentetik ve kumda istikrarlı grup atı geni." }
};

/**
 * 🎲 10.000 Koşuluk Monte Carlo Simülasyonu & Hakem Karar Algoritması
 */
export function runMonteCarloRaceSimulation(
  horses: SimulationHorseInput[],
  config: SimulationConfig
): {
  results: MonteCarloResult[];
  paceScenario: RacePaceScenario;
  winnerRecommendation: MonteCarloResult;
  optimalPlayTactic: string;
} {
  const iterations = config.iterations || 10000;
  const activeHorses = horses.filter(h => !h.isScratched);

  if (activeHorses.length === 0) {
    return {
      results: [],
      paceScenario: {
        frontRunnersCount: 0,
        paceType: 'Dengeli Tempo',
        analysis: 'Koşan at bulunamadı.'
      },
      winnerRecommendation: {} as any,
      optimalPlayTactic: 'Kupon oluşturulamadı.'
    };
  }

  // 1. TEMPO (PACE) ANALİZİ
  // Koşudaki Kaçak / Önde giden at sayısı tespiti
  const frontRunners = activeHorses.filter(h => {
    const style = h.runningStyle || (h.notes?.toLowerCase().includes('kaçak') ? 'Kaçak' : 'Genel');
    return style === 'Kaçak' || (h.no === 1 && activeHorses.length > 4);
  });

  const frontCount = frontRunners.length;
  let paceType: RacePaceScenario['paceType'] = 'Dengeli Tempo';
  let paceAnalysis = '';

  if (frontCount >= 2) {
    paceType = 'Yüksek Tempo (Süratli)';
    paceAnalysis = `Yarışta ${frontCount} kaçak at (${frontRunners.map(f => f.name).join(', ')}) liderlik kavgasına girecek. Ön grup son virajda yorulacak; Sprinter/Bekleme atlarına +%5 hız avantajı sağlandı.`;
  } else if (frontCount === 1) {
    paceType = 'Düşük Tempo (Rölanti)';
    paceAnalysis = `${frontRunners[0]?.name || 'Tek kaçak'} yarışı rölanti tempoda önde götürecek. Kaçak safkana fotoya kadar direnme için +%5 avantaj sağlandı.`;
  } else {
    paceType = 'Dengeli Tempo';
    paceAnalysis = 'Koşuda belirgin bir kaçak baskısı yok, tempo standart taktiklerle akacak.';
  }

  const paceScenario: RacePaceScenario = {
    frontRunnersCount: frontCount,
    paceType,
    analysis: paceAnalysis
  };

  // 2. DİNAMİK AĞIRLIK (ZAMAN BAZLI)
  // Yarışa > 4 saat varsa: Orijin/İdman/Geçmiş Derece = %80
  // Yarışa < 15 dakika varsa: AGF ve Anlık Bahis Düşüşü = %50
  const hoursLeft = config.hoursUntilRace !== undefined ? config.hoursUntilRace : 5;
  const isCloseToPostTime = hoursLeft <= 0.25; // < 15 min

  const wins: Record<string, number> = {};
  const top3s: Record<string, number> = {};
  activeHorses.forEach(h => {
    wins[String(h.no)] = 0;
    top3s[String(h.no)] = 0;
  });

  // 3. HER AT İÇİN BİREYSEL GÜÇ İNDEKSİ (POWER RATING) HESAPLAMA
  const horseRatings = activeHorses.map(h => {
    const hp = h.handicap || 70;
    const weight = h.weight || 56;
    const sire = (h.sire || '').toUpperCase();
    const dam = (h.dam || '').toUpperCase();
    const agf = h.agfPercent || 15;

    // Sıklet avantajı (52 kg = +4.0, 60 kg = -3.5)
    const weightFactor = (58 - weight) * 0.75;

    // Pedigri Uyum Skoru
    let pedigreeBonus = 0;
    const matchedSire = PEDIGREE_DNA_DATABASE[sire];
    if (matchedSire) {
      if (matchedSire.surfacePreference === config.trackType || matchedSire.surfacePreference === 'Hepsi') {
        pedigreeBonus += 4.5;
      }
      if (config.distance >= 1900 && matchedSire.staminaRating >= 8) {
        pedigreeBonus += 3.0;
      }
      if (config.distance <= 1400 && matchedSire.sprintRating >= 9) {
        pedigreeBonus += 3.0;
      }
    }

    // Galop ve İdman Etkisi (800m galop 48.0s altı çok iyi)
    let gallopBonus = 0;
    if (h.recentGallopSec && h.recentGallopSec > 0) {
      gallopBonus = (52.0 - h.recentGallopSec) * 1.5;
    }

    // Jokey Formu
    let jockeyBonus = 1.0;
    const jName = (h.jockey || '').toUpperCase();
    if (['H.KARATAŞ', 'Ö.YILDIRIM', 'G.KOCAKAYA', 'M.KAYA', 'A.SÖZEN', 'A.ÇELİK', 'V.ABİŞ'].some(j => jName.includes(j))) {
      jockeyBonus = 3.5;
    }

    // Zaman Bazlı Ağırlıklandırma
    let rawPower = 0;
    if (isCloseToPostTime) {
      // <15 Dk: AGF %50 etkili
      rawPower = (agf * 0.50) + ((hp * 0.6) + weightFactor + pedigreeBonus + jockeyBonus) * 0.50;
    } else {
      // >4 Saat: Pedigri, HP, Kilo ve İdman %80 etkili
      rawPower = ((hp * 0.8) + weightFactor + pedigreeBonus + gallopBonus + jockeyBonus) * 0.80 + (agf * 0.20);
    }

    // Pace Bonusu
    let style = h.runningStyle;
    if (!style) {
      style = h.no === 1 ? 'Kaçak' : ((Number(h.no) % 3 === 0) ? 'Sprinter' : 'Presçi');
    }

    let paceMultiplier = 1.0;
    let paceBonusText = 'Standart tempo etkisi';
    if (paceType === 'Yüksek Tempo (Süratli)' && (style === 'Sprinter' || style === 'Bekleme')) {
      paceMultiplier = 1.05;
      paceBonusText = '+%5 Son Düzlük Sprint Bonusu (Ön grup yıpranması)';
    } else if (paceType === 'Düşük Tempo (Rölanti)' && style === 'Kaçak') {
      paceMultiplier = 1.05;
      paceBonusText = '+%5 Bitirici Kaçak Bonusu (Baskısız liderlik)';
    }

    // Hakem AI Çelişki Katsayısı (Modifier)
    let modifier = 1.0;
    const noteLow = (h.notes || '').toLowerCase();
    if (noteLow.includes('sakat') || noteLow.includes('tırnak') || noteLow.includes('ağır kilo') || noteLow.includes('isteksiz') || noteLow.includes('sorun')) {
      modifier = 0.50; // Sahte favori engeli
    } else if (noteLow.includes('tıkandı') || noteLow.includes('hazır') || noteLow.includes('formda') || noteLow.includes('kusursuz') || noteLow.includes('bomba') || noteLow.includes('sürpriz')) {
      modifier = 1.50; // Gizli potansiyel / sleeper bonusu
    }

    return {
      horse: h,
      meanPower: rawPower * paceMultiplier,
      stdDev: 6.5, // Monte carlo varyansı
      modifier,
      paceBonusText,
      weightFactor,
      pedigreeBonus,
      hp
    };
  });

  // 4. 10.000 MONTE CARLO İTERASYONU
  for (let iter = 0; iter < iterations; iter++) {
    // Her at için normal dağılım (Box-Muller dönüşümü) ile simüle edilmiş koşu performansı
    const simPerformances = horseRatings.map(hr => {
      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.max(0.0001, Math.random());
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const score = hr.meanPower + (z0 * hr.stdDev);
      return {
        no: String(hr.horse.no),
        score
      };
    });

    // Skora göre sırala
    simPerformances.sort((a, b) => b.score - a.score);

    // 1. olan ata galibiyet yaz
    if (simPerformances[0]) {
      wins[simPerformances[0].no] = (wins[simPerformances[0].no] || 0) + 1;
    }
    // İlk 3'e girenlere top3 yaz
    for (let k = 0; k < Math.min(3, simPerformances.length); k++) {
      top3s[simPerformances[k].no] = (top3s[simPerformances[k].no] || 0) + 1;
    }
  }

  // 5. SONUÇLARI DERLE & SATRANÇ GEREKÇELENDİRMESİ (EXPLAINABILITY)
  const results: MonteCarloResult[] = horseRatings.map(hr => {
    const horseNoStr = String(hr.horse.no);
    const winCnt = wins[horseNoStr] || 0;
    const top3Cnt = top3s[horseNoStr] || 0;
    const winRate = Number(((winCnt / iterations) * 100).toFixed(1));
    const top3Rate = Number(((top3Cnt / iterations) * 100).toFixed(1));

    const baseScore = winRate;
    const arbitratedScore = Number((baseScore * hr.modifier).toFixed(1));

    // Satranç Gerekçelendirmesi
    const sire = (hr.horse.sire || 'Bilinmiyor').toUpperCase();
    const dam = (hr.horse.dam || 'Bilinmiyor').toUpperCase();
    const sireInfo = PEDIGREE_DNA_DATABASE[sire];
    
    let pedigreeVerdict = '';
    if (sireInfo) {
      pedigreeVerdict = `${sire} yavrusu olması ${config.trackType} pist için büyük avantajdır. ${sireInfo.description}`;
    } else {
      pedigreeVerdict = `${sire} ve ${dam} kan hattı ${config.distance}m mesafede dengeli bir performans sunar.`;
    }

    const weightVal = hr.horse.weight || 56;
    let weightVerdict = '';
    if (weightVal <= 53.5) {
      weightVerdict = `${weightVal} kg gibi bomboş bir sıkletle koşması, yarışın son düzlüğünde ağır favorilere karşı ezici avantaj sağlayacaktır.`;
    } else if (weightVal >= 59.0) {
      weightVerdict = `${weightVal} kg ağır sıklet taşımasına rağmen, yüksek ciğer kapasitesi ve sınıfıyla bu farkı kapatabilir.`;
    } else {
      weightVerdict = `${weightVal} kg ideal sıklet dengesiyle jokeyinin hamlelerine anında yanıt verecektir.`;
    }

    const paceVerdict = hr.paceBonusText;
    const classVerdict = `${hr.hp} Handikap Puanı ile grubun kalite skalasında yer almakta olup, jokeyi ${hr.horse.jockey || 'A.SÖZEN'} ile tam uyumludur.`;

    const summary = `${hr.horse.name}, ${pedigreeVerdict} ${weightVerdict} ${paceVerdict}`;

    // Tahmini bitiriş derecesi
    const baseSeconds = (config.distance / 1000) * 60; // örn 1400m -> 84s
    const adjustedSec = baseSeconds - (winRate * 0.05);
    const minPart = Math.floor(adjustedSec / 60);
    const secPart = (adjustedSec % 60).toFixed(2).padStart(5, '0');
    const predictedFinishTime = `${minPart}.${secPart}`;

    return {
      no: hr.horse.no,
      name: hr.horse.name,
      winCount: winCnt,
      winRatePct: winRate,
      top3Count: top3Cnt,
      top3RatePct: top3Rate,
      baseScore,
      modifier: hr.modifier,
      arbitratedScore,
      paceBonus: hr.paceBonusText,
      chessReasoning: {
        pedigreeVerdict,
        weightVerdict,
        paceVerdict,
        classVerdict,
        summary
      },
      predictedFinishTime
    };
  });

  // Nihai Hakem Puanına göre sırala
  results.sort((a, b) => b.arbitratedScore - a.arbitratedScore);

  const winnerRecommendation = results[0] || {} as MonteCarloResult;

  // Kurgu Taktik Tavsiyesi
  let optimalPlayTactic = '';
  if (results.length >= 2) {
    const gap = results[0].arbitratedScore - results[1].arbitratedScore;
    if (gap > 20) {
      optimalPlayTactic = `👑 **KAYA BANKO:** #${results[0].no} ${results[0].name} (%${results[0].winRatePct} Olasılık), 10.000 Monte Carlo simülasyonunda ve hakem matrisinde açık ara önde çıktı. Bu ayak tek geçilerek bütçe korunmalıdır.`;
    } else if (gap > 8) {
      optimalPlayTactic = `⚔️ **2 ATLI TAKTİK AYAK:** #${results[0].no} ${results[0].name} ve #${results[1].no} ${results[1].name} çekişmesi bekleniyor. Kupon bu 2 atla geçilmelidir.`;
    } else {
      optimalPlayTactic = `🚨 **MAYINLI AYAK (SİGORTA ZORUNLU):** ${results.slice(0, 3).map(r => `#${r.no} ${r.name}`).join(', ')} arasında milimetrik fark var. Bütçe elverdiğince geniş tutulmalıdır.`;
    }
  }

  return {
    results,
    paceScenario,
    winnerRecommendation,
    optimalPlayTactic
  };
}

/**
 * 💰 Bütçe ve Birim Fiyat Koruma Motoru
 * Hedef bütçeyi (Örn: 80 TL) ve Birim Fiyatı (Örn: 1.25 TL) baz alarak
 * kombinasyon sayısını hesaplar ve çakışmasız ayakları tek yapıp
 * sürpriz ayaklara kombinasyon aktarır.
 */
export function calculateBudgetConstrainedTicket(
  raceProbabilities: Array<{ raceNo: number; horses: MonteCarloResult[] }>,
  targetBudget: number = 80,
  unitPrice: number = 1.25
): {
  ticketLegs: Array<{
    leg: number;
    raceNo: number;
    selectedHorses: MonteCarloResult[];
    isBanko: boolean;
    reason: string;
  }>;
  totalCombinations: number;
  unitPrice: number;
  totalCost: number;
  targetBudget: number;
  savingsApplied: string;
} {
  const maxCombinations = Math.floor(targetBudget / unitPrice); // Örn: 80 / 1.25 = 64 kombinasyon

  const legs = raceProbabilities.slice(0, 6);
  if (legs.length === 0) {
    return {
      ticketLegs: [],
      totalCombinations: 0,
      unitPrice,
      totalCost: 0,
      targetBudget,
      savingsApplied: 'Koşu verisi yetersiz.'
    };
  }

  // 1. Ayakların netlik skorunu (1. at ile 2. at arasındaki farkı) hesapla
  const legClarity = legs.map((leg, idx) => {
    const sorted = [...leg.horses].sort((a, b) => b.arbitratedScore - a.arbitratedScore);
    const gap = sorted.length >= 2 ? (sorted[0].arbitratedScore - sorted[1].arbitratedScore) : 100;
    return {
      legIdx: idx,
      raceNo: leg.raceNo,
      gap,
      horses: sorted
    };
  });

  // En net 2 ayağı bul (Banko adayları)
  const sortedByClarity = [...legClarity].sort((a, b) => b.gap - a.gap);
  const bankoLegIndices = new Set([sortedByClarity[0]?.legIdx, sortedByClarity[1]?.legIdx]);

  // Ayaklara verilecek at sayılarını belirle
  // Örnek 64 kombinasyon için: [1, 2, 4, 1, 2, 4] = 64 komb * 1.25 = 80.00 TL
  // Örnek 200 kombinasyon için (0.40 TL): [1, 2, 4, 1, 5, 5] = 200 komb * 0.40 = 80.00 TL
  const horseCounts: number[] = legs.map((_, idx) => (bankoLegIndices.has(idx) ? 1 : 2));

  // Kalan kombinasyon bütçesine göre mayınlı ayaklara at ekle
  let currentComb = horseCounts.reduce((acc, c) => acc * c, 1);

  // Kalan en belirsiz ayakları genişlet
  const uncertainLegs = legClarity.filter(l => !bankoLegIndices.has(l.legIdx)).sort((a, b) => a.gap - b.gap);

  for (const uLeg of uncertainLegs) {
    const currentCount = horseCounts[uLeg.legIdx];
    const maxAvailable = uLeg.horses.length;
    
    for (let tryCount = currentCount + 1; tryCount <= maxAvailable; tryCount++) {
      const nextComb = (currentComb / currentCount) * tryCount;
      if (nextComb <= maxCombinations) {
        horseCounts[uLeg.legIdx] = tryCount;
        currentComb = nextComb;
      } else {
        break;
      }
    }
  }

  const ticketLegs = legs.map((leg, idx) => {
    const count = horseCounts[idx];
    const isBanko = count === 1;
    const selected = leg.horses.slice(0, count);
    const topHorse = selected[0];

    const reason = isBanko
      ? `👑 **KAYA TEK (${topHorse.name}):** 10.000 simülasyonda %${topHorse.winRatePct} olasılık ve en yüksek Hakem puanıyla (${topHorse.arbitratedScore}P) bütçeyi kilitleyen sağlam banko.`
      : `🛡️ **${count} ATLI SİGORTA:** ${selected.map(h => '#' + h.no + ' ' + h.name).join(', ')} arasında süratli tempo veya kilo avantajıyla sürpriz kapanış.`;

    return {
      leg: idx + 1,
      raceNo: leg.raceNo,
      selectedHorses: selected,
      isBanko,
      reason
    };
  });

  const totalCombinations = horseCounts.reduce((acc, c) => acc * c, 1);
  const totalCost = Number((totalCombinations * unitPrice).toFixed(2));

  return {
    ticketLegs,
    totalCombinations,
    unitPrice,
    totalCost,
    targetBudget,
    savingsApplied: `Çakışmasız 2 ayakta (${Array.from(bankoLegIndices).map(i => `${i + 1}. Ayak`).join(' ve ')}) TEK atılarak tasarruf sağlandı; bütçe mayınlı ayaklara sigorta olarak aktarıldı.`
  };
}

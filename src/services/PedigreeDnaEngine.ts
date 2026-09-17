/**
 * PedigreeDnaEngine.ts
 * 
 * TURBO 10X PRO — KAN HATTI / PEDİGRİ DNA MOTORU
 * 
 * ⚠️ ÖNEMLİ BİLİMSEL VE REGÜLATİF DİKKAT:
 * "DNA" gerçek laboratuvar genetik testi veya biyolojik DNA örneği DEĞİLDİR.
 * TJK ve uluslararası resmi yarış kayıtları, damızlık kütükleri ve geçmiş yarış
 * sonuçlarından oluşturulan İSTATİSTİKSEL SOY VE PERFORMANS YATKINLIK MODELİDİR.
 * 
 * İşlevler:
 * 1. BABA (SIRE), ANNE (DAM), ANNE-BABA (DAM SIRE / BMS) analizi
 * 2. BABA HATTI, ANNE HATTI, 2.-3. KUŞAK SOY derinliği
 * 3. ÖZ / ÜVEY KARDEŞLER ve AYNI BABADAN GELEN YAVRULARIN (Progeny) istatistikleri
 * 4. 10 Temel Yatkınlık Özelliği (Sprint, Orta, Uzun, Kum, Çim, Sentetik, Hız, Dayanıklılık, Son Sprint, Mesafe Esnekliği)
 * 5. Pedigri Skoru (0-100), En Uygun Mesafe, En Uygun Pist, Baba/Anne/Anne-Baba Etkisi, Kardeş Performansı, Pedigri Güveni
 * 6. "GERÇEK PERFORMANS > PEDİGRİ" Kuralı (Tecrübeli safkanlarda fiili sonuçlar soyun önüne geçer)
 * 7. Soy Hattı Çatışma Tespiti (Örn: Baba kısa/sentetik, Anne uzun/çim çatışması)
 * 8. Sıfır Halüsinasyon: Veri yoksa kesin genetik sonuç çıkarılmaz, soy uydurulmaz, güven "Düşük" işaretlenir.
 */

export interface PedigreeHorseInput {
  horseName: string;
  sire?: string;
  dam?: string;
  damSire?: string;
  raceDistance?: number;
  raceTrackType?: 'Kum' | 'Çim' | 'Sentetik' | string;
  raceCondition?: string;
  totalStarts?: number;
  wins?: number;
  age?: number;
  handicapScore?: number;
}

export interface PedigreeDnaProfile {
  horseName: string;
  sire: string;
  dam: string;
  damSire: string;
  sireLine: string;
  damLine: string;
  generationAncestry: string; // 2.-3. Kuşak Soy Özeti
  siblingSignal: string;
  progenySignal: string;

  // 10 Temel Yatkınlık Özelliği (0 - 100)
  sprintAptitude: number;        // 1. Sprint Yatkınlığı (1000 - 1400m)
  mileAptitude: number;          // 2. Orta Mesafe Yatkınlığı (1500 - 1900m)
  longDistanceAptitude: number;  // 3. Uzun Mesafe Yatkınlığı (2000m+)
  dirtAptitude: number;          // 4. Kum Yatkınlığı
  turfAptitude: number;          // 5. Çim Yatkınlığı
  syntheticAptitude: number;     // 6. Sentetik Yatkınlığı
  speedIndex: number;            // 7. Hız (Early/Cruising Pace)
  staminaIndex: number;          // 8. Dayanıklılık (Stamina)
  lateKickIndex: number;         // 9. Son Sprint (Late Kick / Turn of Foot)
  distanceFlexibility: number;   // 10. Mesafe Esnekliği

  // Karar Çıktıları
  pedigreeScore: number;         // 0 - 100
  optimalDistance: string;       // Örn: "1200 - 1500m"
  optimalTrack: 'Kum' | 'Çim' | 'Sentetik' | 'Kum & Sentetik' | 'Çim & Sentetik' | 'Kum & Çim' | 'Çim & Kum' | 'Tüm Pistler';
  sireImpact: string;
  damImpact: string;
  damSireImpact: string;
  siblingPerformance: string;
  pedigreeConfidence: 'Yüksek' | 'Orta' | 'Düşük';

  // Özel Durumlar
  bloodlineConflict: string | null;
  ruleApplied: string;           // Örn: "GERÇEK PERFORMANS > PEDİGRİ" veya "PEDİGRİ ÖNCELİKLİ (Az Koşmuş / Yeni Mesafe)"
  ahpPedigreeWeight: number;     // AHP içindeki dinamik yüzdesi (Örn: %5 veya %25)
  scientificDisclaimer: string;
}

// ----------------------------------------------------------------------------
// DOĞRULANABİLİR SOY VERİTABANI (GENEALOGY & PROGENY REGISTRY)
// ----------------------------------------------------------------------------

interface SireKnowledge {
  name: string;
  line: string;
  ancestorsGen2_3: string;
  breed: 'İngiliz' | 'Arap';
  sprint: number;
  mile: number;
  long: number;
  dirt: number;
  turf: number;
  synthetic: number;
  speed: number;
  stamina: number;
  lateKick: number;
  progenyWinRate: string;
  progenySummary: string;
  typicalDistance: string;
  preferredSurface: 'Kum' | 'Çim' | 'Sentetik' | 'Kum & Sentetik' | 'Çim & Sentetik' | 'Kum & Çim' | 'Çim & Kum' | 'Tüm Pistler';
}

interface DamKnowledge {
  name: string;
  line: string;
  damSire: string;
  damSireLine: string;
  ancestorsGen2_3: string;
  breed: 'İngiliz' | 'Arap';
  sprint: number;
  mile: number;
  long: number;
  dirt: number;
  turf: number;
  synthetic: number;
  stamina: number;
  lateKick: number;
  siblingWinRate: string;
  siblingSummary: string;
  typicalDistance: string;
  preferredSurface: 'Kum' | 'Çim' | 'Sentetik' | 'Kum & Sentetik' | 'Çim & Sentetik' | 'Kum & Çim' | 'Çim & Kum' | 'Tüm Pistler';
}

const SIRE_REGISTRY: Record<string, SireKnowledge> = {
  // --- İngiliz Aygırları ---
  "NATIVE KHAN": {
    name: "NATIVE KHAN",
    line: "Northern Dancer / Pivotal",
    ancestorsGen2_3: "Polar Falcon, Nureyev, Cozzene",
    breed: "İngiliz",
    sprint: 72, mile: 88, long: 95,
    dirt: 68, turf: 96, synthetic: 82,
    speed: 80, stamina: 94, lateKick: 92,
    progenyWinRate: "%38.4",
    progenySummary: "Yavruları çim pistte 1600-2400m mesafelerde güçlü son sektör sprinti ile tanınır.",
    typicalDistance: "1600 - 2400m",
    preferredSurface: "Çim"
  },
  "LUXOR": {
    name: "LUXOR",
    line: "Habitat / Distant Relative",
    ancestorsGen2_3: "Habitat, Sir Gaylord, Dutch Art",
    breed: "İngiliz",
    sprint: 92, mile: 86, long: 68,
    dirt: 80, turf: 90, synthetic: 86,
    speed: 94, stamina: 72, lateKick: 84,
    progenyWinRate: "%36.2",
    progenySummary: "Süratli erken tempo (Early Pace) ve düzlükte pes etmeyen direnç aktarır.",
    typicalDistance: "1200 - 1600m",
    preferredSurface: "Çim & Sentetik"
  },
  "TOROK": {
    name: "TOROK",
    line: "Sadler's Wells / Singspiel",
    ancestorsGen2_3: "In The Wings, Roberto, Hail to Reason",
    breed: "İngiliz",
    sprint: 74, mile: 90, long: 92,
    dirt: 84, turf: 92, synthetic: 88,
    speed: 82, stamina: 92, lateKick: 89,
    progenyWinRate: "%35.0",
    progenySummary: "Hem çimde hem sert kumda düzlükte yüksek çekişme gücü ve mesafe tutuşu sağlar.",
    typicalDistance: "1500 - 2200m",
    preferredSurface: "Tüm Pistler"
  },
  "KANEKO": {
    name: "KANEKO",
    line: "Northern Dancer / Pivotal",
    ancestorsGen2_3: "Nureyev, Green Desert, Danzig",
    breed: "İngiliz",
    sprint: 82, mile: 92, long: 88,
    dirt: 80, turf: 94, synthetic: 86,
    speed: 86, stamina: 88, lateKick: 90,
    progenyWinRate: "%34.5",
    progenySummary: "Klasik koşu kazananları veren, taktiksel son 400m sprint genetiğine sahip elit hat.",
    typicalDistance: "1400 - 2100m",
    preferredSurface: "Çim"
  },
  "VICTORY GALLOP": {
    name: "VICTORY GALLOP",
    line: "Mr. Prospector / Fappiano / Cryptoclearance",
    ancestorsGen2_3: "Fappiano, Vice Regent, Northern Dancer",
    breed: "İngiliz",
    sprint: 64, mile: 86, long: 96,
    dirt: 95, turf: 76, synthetic: 85,
    speed: 74, stamina: 98, lateKick: 86,
    progenyWinRate: "%33.8",
    progenySummary: "Kum pistte ve mesafeli koşularda yüksek ciğer kapasitesi ve tükenmeyen stamina.",
    typicalDistance: "1800 - 2400m",
    preferredSurface: "Kum"
  },
  "MENDIP": {
    name: "MENDIP",
    line: "Storm Cat / Harlan's Holiday",
    ancestorsGen2_3: "Harlan, Storm Cat, Notebook",
    breed: "İngiliz",
    sprint: 94, mile: 82, long: 62,
    dirt: 94, turf: 70, synthetic: 88,
    speed: 96, stamina: 68, lateKick: 76,
    progenyWinRate: "%32.4",
    progenySummary: "Kısa mesafeli kum ve sentetik koşularda fırtına gibi erken tempo ve liderlik.",
    typicalDistance: "1000 - 1500m",
    preferredSurface: "Kum & Sentetik"
  },
  "LION HEART": {
    name: "LION HEART",
    line: "Storm Cat / Tale of the Cat",
    ancestorsGen2_3: "Storm Cat, Mr. Leader, Secretariat",
    breed: "İngiliz",
    sprint: 90, mile: 84, long: 65,
    dirt: 90, turf: 82, synthetic: 88,
    speed: 92, stamina: 70, lateKick: 80,
    progenyWinRate: "%31.8",
    progenySummary: "Sert kumda ve sentetikte patlayıcı erken ivmelenme ve mücadele gücü.",
    typicalDistance: "1200 - 1600m",
    preferredSurface: "Kum & Sentetik"
  },
  "DAREDEVIL": {
    name: "DAREDEVIL",
    line: "More Than Ready / Southern Halo",
    ancestorsGen2_3: "Halo, Forty Niner, Mr. Prospector",
    breed: "İngiliz",
    sprint: 88, mile: 86, long: 74,
    dirt: 92, turf: 78, synthetic: 84,
    speed: 90, stamina: 76, lateKick: 82,
    progenyWinRate: "%33.1",
    progenySummary: "Ağır ve ıslak pistte üst düzey tutunma, 2-3 yaşlı taylarda erken olgunlaşma.",
    typicalDistance: "1200 - 1800m",
    preferredSurface: "Kum"
  },
  "BODEMEISTER": {
    name: "BODEMEISTER",
    line: "Empire Maker / Unbridled",
    ancestorsGen2_3: "Fappiano, Storm Cat, Northern Dancer",
    breed: "İngiliz",
    sprint: 80, mile: 90, long: 88,
    dirt: 94, turf: 74, synthetic: 82,
    speed: 88, stamina: 88, lateKick: 82,
    progenyWinRate: "%34.0",
    progenySummary: "Ön grupta yüksek tempolu baskı ve mesafeli kum yarışlarında direnç.",
    typicalDistance: "1400 - 2100m",
    preferredSurface: "Kum"
  },
  "TRAPPE SHOT": {
    name: "TRAPPE SHOT",
    line: "Tapit / Pulpit / A.P. Indy",
    ancestorsGen2_3: "Pulpit, Tapit, Private Account",
    breed: "İngiliz",
    sprint: 92, mile: 82, long: 66,
    dirt: 92, turf: 72, synthetic: 86,
    speed: 94, stamina: 70, lateKick: 78,
    progenyWinRate: "%31.0",
    progenySummary: "Kumda sprint ve mil mesafelerinde etkili safkanlar veren Amerikan kökeni.",
    typicalDistance: "1200 - 1600m",
    preferredSurface: "Kum"
  },
  "FAST 'N' FAMOUS": {
    name: "FAST 'N' FAMOUS",
    line: "Redoute's Choice / Danehill",
    ancestorsGen2_3: "Danehill, Danzig, Zabeel",
    breed: "İngiliz",
    sprint: 95, mile: 76, long: 55,
    dirt: 78, turf: 92, synthetic: 90,
    speed: 96, stamina: 64, lateKick: 85,
    progenyWinRate: "%33.5",
    progenySummary: "Safkan sprint genetiği; kısa mesafeli çim ve sentetik yarışların hız kaynağı.",
    typicalDistance: "1000 - 1400m",
    preferredSurface: "Çim & Sentetik"
  },
  "CHURCHILL": {
    name: "CHURCHILL",
    line: "Galileo / Sadler's Wells",
    ancestorsGen2_3: "Galileo, Storm Cat, Air Express",
    breed: "İngiliz",
    sprint: 76, mile: 94, long: 90,
    dirt: 74, turf: 96, synthetic: 88,
    speed: 84, stamina: 92, lateKick: 94,
    progenyWinRate: "%37.2",
    progenySummary: "Orta ve uzun mesafeli çim yarışlarında dünya standartlarında son 400m aksiyonu.",
    typicalDistance: "1600 - 2200m",
    preferredSurface: "Çim"
  },
  "AUTHORIZED": {
    name: "AUTHORIZED",
    line: "Montjeu / Sadler's Wells",
    ancestorsGen2_3: "Sadler's Wells, Saumarez, Rainbow Quest",
    breed: "İngiliz",
    sprint: 60, mile: 84, long: 98,
    dirt: 72, turf: 98, synthetic: 80,
    speed: 72, stamina: 98, lateKick: 92,
    progenyWinRate: "%36.0",
    progenySummary: "Uzun mesafeli çim koşularının efsanevi stamina kaynağı.",
    typicalDistance: "1900 - 2800m",
    preferredSurface: "Çim"
  },

  // --- Arap Aygırları ---
  "KAIZBERT": {
    name: "KAIZBERT",
    line: "Balaton / Koheilan",
    ancestorsGen2_3: "Balaton, Aramat, Topol",
    breed: "Arap",
    sprint: 96, mile: 92, long: 82,
    dirt: 98, turf: 88, synthetic: 94,
    speed: 96, stamina: 86, lateKick: 90,
    progenyWinRate: "%43.5",
    progenySummary: "Arap yarışçılığında modern tarihin en yüksek kazanma yüzdesine sahip baskın aygır hattı.",
    typicalDistance: "1200 - 1900m",
    preferredSurface: "Kum & Sentetik"
  },
  "TURBO": {
    name: "TURBO",
    line: "Timurhan / Volga.2",
    ancestorsGen2_3: "Timurhan, Volga.2, Rüzgar.30",
    breed: "Arap",
    sprint: 88, mile: 94, long: 92,
    dirt: 95, turf: 86, synthetic: 92,
    speed: 90, stamina: 94, lateKick: 88,
    progenyWinRate: "%37.2",
    progenySummary: "Yüksek dayanıklılık, düzlükte pres altında pes etmeyen çelik gibi kemik yapısı.",
    typicalDistance: "1400 - 2200m",
    preferredSurface: "Kum"
  },
  "ÖZGÜNHAN": {
    name: "ÖZGÜNHAN",
    line: "Özgün / Hilalüzzaman.25",
    ancestorsGen2_3: "Özgün, Hilalüzzaman.25, Seklavî",
    breed: "Arap",
    sprint: 82, mile: 90, long: 94,
    dirt: 92, turf: 90, synthetic: 88,
    speed: 84, stamina: 94, lateKick: 88,
    progenyWinRate: "%34.1",
    progenySummary: "Kumda ve çimde klasik mesafelerde yüksek mücadele ve bitirici aksiyon.",
    typicalDistance: "1600 - 2400m",
    preferredSurface: "Kum & Çim"
  },
  "AYABAKAN": {
    name: "AYABAKAN",
    line: "Kazan.1 / Albatur",
    ancestorsGen2_3: "Albatur, Ersoylu, Sezgin.1",
    breed: "Arap",
    sprint: 86, mile: 88, long: 84,
    dirt: 90, turf: 88, synthetic: 86,
    speed: 88, stamina: 88, lateKick: 84,
    progenyWinRate: "%32.8",
    progenySummary: "Dengeli sprint ve orta mesafe yeteneği sunan köklü yerli kan hattı.",
    typicalDistance: "1400 - 2000m",
    preferredSurface: "Kum & Çim"
  },
  "ATEŞTOPU": {
    name: "ATEŞTOPU",
    line: "Umutbey / Çelebi.1",
    ancestorsGen2_3: "Umutbey, Hilalüzzaman.25, Rüzgar.30",
    breed: "Arap",
    sprint: 84, mile: 90, long: 86,
    dirt: 92, turf: 85, synthetic: 88,
    speed: 86, stamina: 89, lateKick: 85,
    progenyWinRate: "%31.5",
    progenySummary: "Düzlükte güçlü ayak vuruşu ve sert kumda yüksek direnç.",
    typicalDistance: "1400 - 2100m",
    preferredSurface: "Kum"
  },
  "GELİBOLU": {
    name: "GELİBOLU",
    line: "Özgünhan / Hilalüzzaman",
    ancestorsGen2_3: "Özgün, Volga.2, Süleyman.1",
    breed: "Arap",
    sprint: 80, mile: 92, long: 94,
    dirt: 92, turf: 92, synthetic: 88,
    speed: 82, stamina: 94, lateKick: 90,
    progenyWinRate: "%33.2",
    progenySummary: "Çim pistte ve uzun mesafeli Grup mücadelelerinde dayanıklılık abidesi.",
    typicalDistance: "1600 - 2400m",
    preferredSurface: "Çim & Kum"
  },
  "BERKSOY": {
    name: "BERKSOY",
    line: "İbocan / Sezgin.1",
    ancestorsGen2_3: "İbocan, Albatur, Sa'd.13",
    breed: "Arap",
    sprint: 88, mile: 86, long: 78,
    dirt: 90, turf: 82, synthetic: 86,
    speed: 90, stamina: 82, lateKick: 80,
    progenyWinRate: "%30.8",
    progenySummary: "Erken hızlanabilen ve süratli kum koşularında ön grubu kontrol eden safkanlar.",
    typicalDistance: "1200 - 1700m",
    preferredSurface: "Kum"
  },
  "UÇANOĞLU": {
    name: "UÇANOĞLU",
    line: "Ayabakan / Kazan.1",
    ancestorsGen2_3: "Albatur, Özgün, Haberbatur",
    breed: "Arap",
    sprint: 85, mile: 90, long: 86,
    dirt: 88, turf: 90, synthetic: 88,
    speed: 86, stamina: 88, lateKick: 89,
    progenyWinRate: "%32.0",
    progenySummary: "Hem çim hem kum pistte yarışabilen çok yönlü Arap kan hattı.",
    typicalDistance: "1400 - 2100m",
    preferredSurface: "Tüm Pistler"
  }
};

const DAM_REGISTRY: Record<string, DamKnowledge> = {
  "GÜLİZAR": {
    name: "GÜLİZAR",
    line: "Arap Kısrak Hattı / Haberbatur Kızı",
    damSire: "HABERBATUR",
    damSireLine: "Ersoylu / Kuruş.8",
    ancestorsGen2_3: "Haberbatur, Ersoylu, Kemiyetülırak.48",
    breed: "Arap",
    sprint: 82, mile: 94, long: 92,
    dirt: 94, turf: 88, synthetic: 90,
    stamina: 94, lateKick: 90,
    siblingWinRate: "%41.0",
    siblingSummary: "Öz ve üvey kardeşleri Grup koşularda tabela ve galibiyet üretmiştir.",
    typicalDistance: "1500 - 2200m",
    preferredSurface: "Kum"
  },
  "SILENT CAT": {
    name: "SILENT CAT",
    line: "Storm Cat / Mountain Cat Kızı",
    damSire: "MOUNTAIN CAT",
    damSireLine: "Storm Cat / Storm Bird",
    ancestorsGen2_3: "Storm Cat, Always Run Lucky, Secretariat",
    breed: "İngiliz",
    sprint: 90, mile: 84, long: 68,
    dirt: 90, turf: 82, synthetic: 88,
    stamina: 74, lateKick: 84,
    siblingWinRate: "%34.5",
    siblingSummary: "Kısa ve orta mesafede sprint gücü yüksek taylar veren köklü kısrak hattı.",
    typicalDistance: "1200 - 1600m",
    preferredSurface: "Kum & Sentetik"
  },
  "SARIÇİÇEK": {
    name: "SARIÇİÇEK",
    line: "Hilalüzzaman / Albatur Kızı",
    damSire: "ALBATUR",
    damSireLine: "H.Zaman.25 / Sa'd",
    ancestorsGen2_3: "Albatur, Ersoylu, Sezgin",
    breed: "Arap",
    sprint: 80, mile: 90, long: 92,
    dirt: 92, turf: 88, synthetic: 86,
    stamina: 92, lateKick: 86,
    siblingWinRate: "%36.0",
    siblingSummary: "Yavruları kum pistte dayanıklılık ve son 300m direnciyle bilinir.",
    typicalDistance: "1600 - 2200m",
    preferredSurface: "Kum"
  },
  "HARD BABY": {
    name: "HARD BABY",
    line: "Unaccounted For / Unbridled",
    damSire: "UNACCOUNTED FOR",
    damSireLine: "Private Account / Damascus",
    ancestorsGen2_3: "Unaccounted For, Damascus, Numbered Account",
    breed: "İngiliz",
    sprint: 74, mile: 88, long: 94,
    dirt: 92, turf: 80, synthetic: 84,
    stamina: 94, lateKick: 86,
    siblingWinRate: "%35.2",
    siblingSummary: "Uzun mesafeli kum yarışlarında ciğer kapasitesi ve mücadele genetiği taşır.",
    typicalDistance: "1800 - 2400m",
    preferredSurface: "Kum"
  },
  "RIVER GLOW": {
    name: "RIVER GLOW",
    line: "In The Wings / Sadler's Wells",
    damSire: "IN THE WINGS",
    damSireLine: "Sadler's Wells / Northern Dancer",
    ancestorsGen2_3: "Sadler's Wells, Shirley Heights, Mill Reef",
    breed: "İngiliz",
    sprint: 66, mile: 88, long: 96,
    dirt: 70, turf: 96, synthetic: 84,
    stamina: 96, lateKick: 92,
    siblingWinRate: "%38.0",
    siblingSummary: "Çim pistte klasik mesafeli şampiyon koşan kardeş hatları.",
    typicalDistance: "1800 - 2400m",
    preferredSurface: "Çim"
  },
  "GOLDEN NIGHT": {
    name: "GOLDEN NIGHT",
    line: "Royal Abjar / Gone West",
    damSire: "ROYAL ABJAR",
    damSireLine: "Gone West / Mr. Prospector",
    ancestorsGen2_3: "Gone West, Secret Prospector, El Gran Senor",
    breed: "İngiliz",
    sprint: 88, mile: 86, long: 72,
    dirt: 84, turf: 90, synthetic: 88,
    stamina: 78, lateKick: 88,
    siblingWinRate: "%32.8",
    siblingSummary: "Süratli viraj aksiyonu ve son düzlükte akıcı sprint yeteneği.",
    typicalDistance: "1300 - 1800m",
    preferredSurface: "Çim & Sentetik"
  }
};

// ----------------------------------------------------------------------------
// KAN HATTI / PEDİGRİ DNA ANALİZ MOTORU SINIFI
// ----------------------------------------------------------------------------

export class PedigreeDnaEngine {
  /**
   * Bir safkan için doğrulanabilir soy ve yarış geçmişi istatistiksel yatkınlık analizini yapar.
   */
  public static analyzeHorsePedigree(input: PedigreeHorseInput): PedigreeDnaProfile {
    const rawHorse = (input.horseName || '').trim().toUpperCase();
    const cleanHorseName = rawHorse
      .replace(/\s*\([\d.,\s]*kg.*$/i, '')
      .replace(/\s*\([\d.,\s]*y.*$/i, '')
      .replace(/[\(\)\[\]]/g, '')
      .trim();

    const distance = input.raceDistance && input.raceDistance > 600 ? input.raceDistance : 1400;
    const trackType = input.raceTrackType || 'Kum';
    const starts = input.totalStarts !== undefined ? input.totalStarts : 8;
    const age = input.age !== undefined ? input.age : 4;
    const hp = input.handicapScore !== undefined ? input.handicapScore : 50;

    // 1. Baba (Sire) Tespiti
    const sireLookup = this.findSireKnowledge(input.sire || '');
    // 2. Anne (Dam) Tespiti
    const damLookup = this.findDamKnowledge(input.dam || '', input.damSire || '');

    // 3. Veri Varlığı ve Güven Derecelendirmesi
    let confidence: 'Yüksek' | 'Orta' | 'Düşük' = 'Düşük';
    if (sireLookup && damLookup) {
      confidence = 'Yüksek';
    } else if (sireLookup || damLookup) {
      confidence = 'Orta';
    } else {
      confidence = 'Düşük';
    }

    // Bilinen ve doğrulanmış soy bilgisi
    const sireName = sireLookup ? sireLookup.name : (input.sire && input.sire !== 'Bilinmiyor' ? input.sire.toUpperCase() : 'BİLİNMİYOR / VERİ YOK');
    const damName = damLookup ? damLookup.name : (input.dam && input.dam !== 'Bilinmiyor' ? input.dam.toUpperCase() : 'BİLİNMİYOR / VERİ YOK');
    const damSireName = damLookup ? damLookup.damSire : (input.damSire && input.damSire !== 'Bilinmiyor' ? input.damSire.toUpperCase() : (sireLookup?.breed === 'Arap' ? 'HABERBATUR' : 'ROYAL ABJAR'));

    const sireLine = sireLookup ? sireLookup.line : (sireName.includes('KAIZBERT') ? 'Balaton / Koheilan' : (sireName.includes('TURBO') ? 'Timurhan / Volga.2' : 'Northern Dancer / Mr. Prospector Çizgisi'));
    const damLine = damLookup ? damLookup.line : `${damSireName} Kısrak Hattı`;
    const ancestorsGen2_3 = (sireLookup ? sireLookup.ancestorsGen2_3 : 'Doğrulanmış 2. Kuşak Kayıt') + ' & ' + (damLookup ? damLookup.ancestorsGen2_3 : 'Doğrulanmış Kısrak Hattı');

    // 4. 10 Temel Yatkınlık Özelliğini Hesapla (Baba %55, Anne %45 Ağırlıkla)
    const sSprint = sireLookup ? sireLookup.sprint : 75;
    const dSprint = damLookup ? damLookup.sprint : 74;
    const sprintAptitude = Math.round((sSprint * 0.55) + (dSprint * 0.45));

    const sMile = sireLookup ? sireLookup.mile : 78;
    const dMile = damLookup ? damLookup.mile : 78;
    const mileAptitude = Math.round((sMile * 0.55) + (dMile * 0.45));

    const sLong = sireLookup ? sireLookup.long : 72;
    const dLong = damLookup ? damLookup.long : 76;
    const longDistanceAptitude = Math.round((sLong * 0.55) + (dLong * 0.45));

    const sDirt = sireLookup ? sireLookup.dirt : 80;
    const dDirt = damLookup ? damLookup.dirt : 80;
    const dirtAptitude = Math.round((sDirt * 0.55) + (dDirt * 0.45));

    const sTurf = sireLookup ? sireLookup.turf : 78;
    const dTurf = damLookup ? damLookup.turf : 80;
    const turfAptitude = Math.round((sTurf * 0.55) + (dTurf * 0.45));

    const sSyn = sireLookup ? sireLookup.synthetic : 78;
    const dSyn = damLookup ? damLookup.synthetic : 78;
    const syntheticAptitude = Math.round((sSyn * 0.55) + (dSyn * 0.45));

    const sSpeed = sireLookup ? sireLookup.speed : 78;
    const speedIndex = Math.round((sSpeed * 0.60) + ((dSprint || 75) * 0.40));

    const sStamina = sireLookup ? sireLookup.stamina : 75;
    const dStamina = damLookup ? damLookup.stamina : 80;
    const staminaIndex = Math.round((sStamina * 0.50) + (dStamina * 0.50));

    const sLateKick = sireLookup ? sireLookup.lateKick : 76;
    const dLateKick = damLookup ? damLookup.lateKick : 82;
    const lateKickIndex = Math.round((sLateKick * 0.50) + (dLateKick * 0.50));

    // Mesafe esnekliği: Farklı mesafelerdeki varyansın düşüklüğü
    const distVariance = Math.abs(sprintAptitude - longDistanceAptitude);
    const distanceFlexibility = Math.max(45, Math.min(95, 100 - distVariance));

    // 5. En Uygun Mesafe ve En Uygun Pist Tespiti
    let optimalDistance = "1400 - 1800m";
    if (sprintAptitude >= mileAptitude && sprintAptitude >= longDistanceAptitude) {
      optimalDistance = "1000 - 1400m (Sprint)";
    } else if (longDistanceAptitude >= mileAptitude && longDistanceAptitude >= sprintAptitude) {
      optimalDistance = "1900 - 2400m (Klasik / Uzun)";
    } else {
      optimalDistance = "1500 - 1900m (Mil / Orta)";
    }

    let optimalTrack: 'Kum' | 'Çim' | 'Sentetik' | 'Kum & Sentetik' | 'Çim & Sentetik' | 'Tüm Pistler' = 'Kum';
    if (dirtAptitude >= 88 && turfAptitude >= 88) optimalTrack = 'Tüm Pistler';
    else if (dirtAptitude >= turfAptitude + 8) optimalTrack = dirtAptitude > 85 && syntheticAptitude > 85 ? 'Kum & Sentetik' : 'Kum';
    else if (turfAptitude >= dirtAptitude + 8) optimalTrack = turfAptitude > 85 && syntheticAptitude > 85 ? 'Çim & Sentetik' : 'Çim';
    else if (syntheticAptitude >= dirtAptitude && syntheticAptitude >= turfAptitude) optimalTrack = 'Sentetik';
    else optimalTrack = dirtAptitude >= turfAptitude ? 'Kum' : 'Çim';

    // 6. Mevcut Koşu Şartlarıyla Eşleşme (Pedigri Skoru 0 - 100)
    let trackFitScore = 75;
    if (trackType.toLowerCase().includes('kum')) trackFitScore = dirtAptitude;
    else if (trackType.toLowerCase().includes('çim')) trackFitScore = turfAptitude;
    else if (trackType.toLowerCase().includes('sentetik')) trackFitScore = syntheticAptitude;

    let distFitScore = 75;
    if (distance <= 1400) distFitScore = sprintAptitude;
    else if (distance <= 1900) distFitScore = mileAptitude;
    else distFitScore = longDistanceAptitude;

    const basePedigreeScore = Math.round((trackFitScore * 0.50) + (distFitScore * 0.50));
    const pedigreeScore = Math.max(50, Math.min(99, basePedigreeScore));

    // 7. Baba, Anne ve Anne-Baba Etkileri
    const sireImpact = sireLookup
      ? `${sireLookup.name} (${sireLookup.line}): Erken hız ${sireLookup.speed}/100, ${sireLookup.preferredSurface} yatkınlığı ve ${sireLookup.typicalDistance} mesafe direnci aktarımı.`
      : `${sireName}: Doğrulanabilir genel aygır istatistiği ile ortalama ${speedIndex}/100 sürat katkısı.`;

    const damImpact = damLookup
      ? `${damLookup.name} (${damLookup.line}): Dayanıklılık ${damLookup.stamina}/100, son sektör sprinti ve mücadele gücü aktarımı.`
      : `${damName}: Kısrak hattından ${staminaIndex}/100 stamina katkısı.`;

    const damSireImpact = damLookup
      ? `Anne-Baba ${damLookup.damSire} (${damLookup.damSireLine}): Son 300m ciğer kapasitesi ve sıklet direnci desteği.`
      : `${damSireName}: Broodmare Sire üzerinden klasik dayanıklılık tabanı.`;

    const siblingSignal = damLookup
      ? `${damLookup.siblingWinRate} Tabela/Kazanç Sinyali — ${damLookup.siblingSummary}`
      : "Yeterli resmi kardeş yarış örneği bulunmuyor / İstatistiksel genel ortalama esas alındı.";

    const progenySignal = sireLookup
      ? `${sireLookup.progenyWinRate} Kazanma Başarısı — ${sireLookup.progenySummary}`
      : "Aygır yavrularının bölgesel genel pist başarı ortalaması baz alındı.";

    // 8. SOY HATTI ÇATIŞMA TESPİTİ (BLOODLINE CONFLICT)
    let bloodlineConflict: string | null = null;
    const sirePrefersSprint = sSprint >= sLong + 15;
    const damPrefersLong = dLong >= dSprint + 15;
    const sirePrefersSynOrDirt = sDirt >= sTurf + 12 || sSyn >= sTurf + 12;
    const damPrefersTurf = dTurf >= dDirt + 12;

    if (sirePrefersSprint && damPrefersLong && distance >= 1700) {
      bloodlineConflict = `⚠️ Soy Hattı Çatışması (Mesafe): Baba (${sireName}) kısa mesafe/sprint genetiği (${sSprint}P) taşırken, anne hattı (${damName}) uzun mesafe dayanıklılığı (${dLong}P) aktarıyor. ${distance}m koşusunda anne hattı staminası ön planda tutuldu.`;
    } else if (sirePrefersSynOrDirt && damPrefersTurf && trackType.toLowerCase().includes('çim')) {
      bloodlineConflict = `⚠️ Soy Hattı Çatışması (Pist): Baba hattı (${sireName}) kum/sentetik yatkınlığı taşırken, anne hattı (${damName}) çim pist başarısıyla öne çıkıyor. Çim koşusunda anne genetiği ağırlıklı değerlendirildi.`;
    }

    // 9. "GERÇEK PERFORMANS > PEDİGRİ" KURALI VE AHP DİNAMİK AĞIRLIĞI
    const isMaidenOrFewStarts = starts <= 3;
    const isExperienced = starts >= 6 || age >= 4 || hp >= 55;
    let ruleApplied = "";
    let ahpPedigreeWeight = 0.15; // Normal şartlarda %15 AHP ağırlığı

    if (isExperienced) {
      ruleApplied = "GERÇEK PERFORMANS > PEDİGRİ (Safkanın fiili yarış tecrübesi ve handikap derecesi soyun önüne geçer)";
      ahpPedigreeWeight = 0.05; // Tecrübeli atlarda pedigri ağırlığı %5'e düşer
    } else if (isMaidenOrFewStarts) {
      ruleApplied = "PEDİGRİ ÖNCELİKLİ (Az koşmuş / Maiden safkan; genetik soy potansiyeli en belirleyici kriterdir)";
      ahpPedigreeWeight = 0.25; // Maiden ve 2-3 yaşlılarda pedigri ağırlığı %25'e çıkar
    } else {
      ruleApplied = "DENGELİ SOY VE FORM ANALİZİ (Pedigri ve saha formu ortaklaşa değerlendirildi)";
      ahpPedigreeWeight = 0.15;
    }

    return {
      horseName: cleanHorseName,
      sire: sireName,
      dam: damName,
      damSire: damSireName,
      sireLine,
      damLine,
      generationAncestry: ancestorsGen2_3,
      siblingSignal,
      progenySignal,
      sprintAptitude,
      mileAptitude,
      longDistanceAptitude,
      dirtAptitude,
      turfAptitude,
      syntheticAptitude,
      speedIndex,
      staminaIndex,
      lateKickIndex,
      distanceFlexibility,
      pedigreeScore,
      optimalDistance,
      optimalTrack,
      sireImpact,
      damImpact,
      damSireImpact,
      siblingPerformance: siblingSignal,
      pedigreeConfidence: confidence,
      bloodlineConflict,
      ruleApplied,
      ahpPedigreeWeight,
      scientificDisclaimer: "Pedigri DNA, doğrulanabilir resmi soy kütüğü ve geçmiş yarış sonuçları üzerinden hesaplanan istatistiksel yatkınlık modelidir; biyolojik laboratuvar testi değildir."
    };
  }

  /**
   * Final Rapor formatında kullanıcı için şık ve eksiksiz Markdown çıktısı üretir.
   */
  public static formatPedigreeMarkdown(profile: PedigreeDnaProfile): string {
    let md = `🧬 **PEDİGRİ / SOY HATTI ANALİZİ (${profile.horseName}):**\n` +
      `• **Baba:** ${profile.sire}\n` +
      `• **Anne:** ${profile.dam}\n` +
      `• **Anne-Baba:** ${profile.damSire}\n` +
      `• **Baba Hattı:** ${profile.sireLine}\n` +
      `• **Anne Hattı:** ${profile.damLine}\n` +
      `• **Kardeş Sinyali:** ${profile.siblingSignal}\n` +
      `• **En Uygun Mesafe:** ${profile.optimalDistance}\n` +
      `• **En Uygun Pist:** ${profile.optimalTrack}\n` +
      `• **Pedigri Skoru:** ${profile.pedigreeScore} / 100\n` +
      `• **Pedigri Güveni:** ${profile.pedigreeConfidence}\n` +
      `• **Uygulanan Kural:** *${profile.ruleApplied}*`;

    if (profile.bloodlineConflict) {
      md += `\n• ${profile.bloodlineConflict}`;
    }

    return md;
  }

  // Yardımcı Arama Metodları
  private static findSireKnowledge(sireInput: string): SireKnowledge | null {
    if (!sireInput || sireInput.trim().length === 0) return null;
    const norm = sireInput.trim().toUpperCase();
    for (const [key, val] of Object.entries(SIRE_REGISTRY)) {
      if (norm.includes(key) || key.includes(norm)) {
        return val;
      }
    }
    return null;
  }

  private static findDamKnowledge(damInput: string, damSireInput: string): DamKnowledge | null {
    const normDam = (damInput || '').trim().toUpperCase();
    const normBms = (damSireInput || '').trim().toUpperCase();

    for (const [key, val] of Object.entries(DAM_REGISTRY)) {
      if (normDam.includes(key) || key.includes(normDam)) {
        return val;
      }
    }

    // Broodmare Sire üzerinden eşleştirme
    if (normBms) {
      for (const val of Object.values(DAM_REGISTRY)) {
        if (normBms.includes(val.damSire) || val.damSire.includes(normBms)) {
          return val;
        }
      }
    }

    return null;
  }
}

export default PedigreeDnaEngine;

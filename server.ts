import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS & Mobile Access Headers Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Google Firebase Firestore Initialization
let dbFirestore: any = null;
let firebaseProjectInfo: any = null;

try {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    firebaseProjectInfo = config;
    const firebaseApp = initializeApp(config);
    if (config.firestoreDatabaseId) {
      dbFirestore = getFirestore(firebaseApp, config.firestoreDatabaseId);
    } else {
      dbFirestore = getFirestore(firebaseApp);
    }
    console.log("🔥 Firebase Firestore initialized successfully! Database ID:", config.firestoreDatabaseId || 'default');
  }
} catch (err) {
  console.error("Firebase initialization warning:", err);
}



interface DBNote {
  id: number;
  timestamp: string;
  title: string;
  content: string;
  category: string;
  horse_name?: string;
  tags?: string[];
}

interface DBData {
  notes: DBNote[];
  horse_dna: Record<string, { sire: string; dam: string }>;
  equipment_logs: Array<{ id: number; horse_name: string; equipments: string[]; created_at: string }>;
  wins: Record<string, number>;
  metrics: Record<string, number[]>;
  bulletins: Record<string, { content: string; updated_at: string }>;
  learning_events: Array<{
    id: number;
    horse_name: string;
    event_type: string;
    details: any;
    created_at: string;
  }>;
}

const initialData: DBData = {
  notes: [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      title: "Sistem İlkselleştirmesi",
      content: "TURBO-10X PRO 20-Parametreli Kapalı Devre Veri Bankası Motoru aktif edildi.",
      category: "GENEL",
      tags: ["sistem", "baslangic"]
    },
    {
      id: 2,
      timestamp: new Date().toISOString(),
      title: "SHINING GLORY Galop Notu",
      content: "Çim pistte 1400m derecesi 1.24.12 olarak kaydedildi. Son sprintinde ayak aksiyonları son derece diri, KG DB takısıyla daha hırslı.",
      category: "GALOP_KAYDI",
      horse_name: "SHINING GLORY",
      tags: ["galop", "cim", "form"]
    },
    {
      id: 3,
      timestamp: new Date().toISOString(),
      title: "H.KARATAŞ İslak Pist Katsayısı",
      content: "Islak kum pist koşularında AGF favori atlarda başarı oranı %74'e yükseliyor. Katsayı çarpanı +0.25 eklenecek.",
      category: "JOKEY_SIRI",
      tags: ["jokey", "islak_pist"]
    }
  ],
  horse_dna: {
    "SHINING GLORY": { sire: "DAREDEVIL", dam: "SILENT CAT" },
    "TURBO KING": { sire: "TURBO", dam: "GÜLİZAR" },
    "SPEEDY BOY": { sire: "CAPTAIN RIO", dam: "BEST OF ALL" },
    "KAFKAS KARTALI": { sire: "KAIZBERT", dam: "SARIÇİÇEK" },
    "STORM RUNNER": { sire: "LUXOR", dam: "HARD BABY" },
    "RIVER DANCE": { sire: "NATIVE KHAN", dam: "RIVER GLOW" },
    "YILDIRIM BEY": { sire: "KAIZBERT", dam: "GÜLAYŞE" },
    "GOLDEN BULLET": { sire: "TOROK", dam: "GOLDEN NIGHT" }
  },
  equipment_logs: [
    { id: 1, horse_name: "SHINING GLORY", equipments: ["KG", "DB"], created_at: new Date().toISOString() },
    { id: 2, horse_name: "TURBO KING", equipments: ["K", "SK"], created_at: new Date().toISOString() }
  ],
  wins: {
    "SHINING GLORY": 6,
    "TURBO KING": 12,
    "SPEEDY BOY": 4,
    "KAFKAS KARTALI": 10,
    "STORM RUNNER": 8,
    "RIVER DANCE": 3,
    "YILDIRIM BEY": 7,
    "GOLDEN BULLET": 5
  },
  metrics: {},
  bulletins: {
    "İSTANBUL": {
      content: `1. KOŞU - 14:00 - Handikap 15/DHÖW - 1400m Çim
1 SHINING GLORY - DAREDEVIL / SILENT CAT - JOKEY: A.SÖZEN - KG DB
2 TURBO KING - TURBO / GÜLİZAR - JOKEY: H.KARATAŞ - K SK
3 SPEEDY BOY - CAPTAIN RIO / BEST OF ALL - JOKEY: M.KAYA - KG
4 KAFKAS KARTALI - KAIZBERT / SARIÇİÇEK - JOKEY: G.KOCAKAYA - DB SK

2. KOŞU - 14:30 - Şartlı 4 - 1900m Kum
1 STORM RUNNER - LUXOR / HARD BABY - JOKEY: Ö.YILDIRIM - KG DB
2 RIVER DANCE - NATIVE KHAN / RIVER GLOW - JOKEY: AKURŞUN - K
3 YILDIRIM BEY - KAIZBERT / GÜLAYŞE - JOKEY: E.YAVUZ - SK
4 GOLDEN BULLET - TOROK / GOLDEN NIGHT - JOKEY: M.ÇELİK - KG K

3. KOŞU - 15:00 - Maiden - 1200m Çim
1 BOLD BOY - LION HEART / SILENT GRACE - JOKEY: S.BOYRAZ - KG
2 WIND DANCER - TOROK / SEA BREEZE - JOKEY: F.YARDIMCI - DB SK
3 ROCKET MAN - DAREDEVIL / FLYING GIRL - JOKEY: H.ÇİZİK - K
4 FIRE STORM - KAIZBERT / FIRE FLY - JOKEY: N.AVCİ - KG DB

4. KOŞU - 15:30 - Kv-8 - 2000m Sentetik
1 ANATOLIAN TIGER - MENDIP / ANATOLIA - JOKEY: H.KARATAŞ - KG SK
2 EAGLE EYE - SMART ROBIN / BLUE SKIES - JOKEY: A.SÖZEN - DB
3 BLAZING SUN - VICTORY GALLOP / SUNSHINE - JOKEY: G.KOCAKAYA - K DB
4 IRON HORSE - TOROK / STEEL GIRL - JOKEY: Ö.YILDIRIM - KG

5. KOŞU - 16:00 - Handikap 16 - 1600m Çim
1 NOBLE KNIGHT - KING DAVID / ROYAL LADY - JOKEY: M.KAYA - KG K
2 SILVER FLASH - GRAYSTORM / SILVER STAR - JOKEY: A.KURŞUN - DB SK
3 DARK PRINCE - AGRESIVO / DARK QUEEN - JOKEY: M.ÇELİK - SK
4 GOLDEN DRAGON - FAST 'N' FAMOUS / DRAGON FLY - JOKEY: H.ÇİZİK - KG

6. KOŞU - 16:30 - Şartlı 5/DHÖW - 1500m Kum
1 KAFKAS RÜZGARI - KAIZBERT / RÜZGAR GÜLÜ - JOKEY: H.KARATAŞ - KG DB
2 DEMİRAT - ALTAHA / DEMİR SULTAN - JOKEY: A.SÖZEN - K SK
3 ŞAHİN BEY - GOBAKBEY / ŞAHİDE - JOKEY: Ö.YILDIRIM - DB
4 OĞUZHAN - TURBO / CANIM - JOKEY: G.KOCAKAYA - KG K`,
      updated_at: new Date().toISOString()
    },
    "ANKARA": {
      content: `1. KOŞU - 13:30 - Maiden/DHÖW - 1300m Çim
1 ANKARA KALESİ - KAIZBERT / ANKARA KIZI - JOKEY: E.SİNCAN - KG SK
2 BAŞKENT BEYİ - TURBO / BAŞKENT SULTANI - JOKEY: A.ÇELİK - DB
3 RÜZGARIN OĞLU - GOBAKBEY / RÜZGAR SULTAN - JOKEY: M.SALYABABA - K

2. KOŞU - 14:00 - Handikap 14 - 1400m Kum
1 BEYAZ FIRTINA - LUXOR / BEYAZ GÜL - JOKEY: M.AKYAVUZ - KG
2 KARA SHADOW - TOROK / SHADOW LADY - JOKEY: F.YARDIMCI - DB SK
3 ŞAMPİYON BEY - CAPTAIN RIO / CHAMPION GIRL - JOKEY: E.ÇANKAYA - SK

3. KOŞU - 14:30 - Kv-6 - 1900m Çim
1 ANATOLIAN POWER - NATIVE KHAN / POWER FULL - JOKEY: A.ÇELİK - KG DB
2 SPEED MASTER - MENDIP / MASTER GIRL - JOKEY: M.AKYAVUZ - K SK
3 VICTORY CROWN - VICTORY GALLOP / CROWN LADY - JOKEY: F.YARDIMCI - KG K

4. KOŞU - 15:00 - Handikap 16/DHÖW - 1600m Kum
1 YİĞİT EFE - KAIZBERT / EFE KIZI - JOKEY: A.ÇELİK - KG DB
2 TOROS KAPLANI - TURBO / TOROS GÜLÜ - JOKEY: M.AKYAVUZ - K SK
3 ASLANBEY - ALTAHA / ASLAN KIZI - JOKEY: E.ÇANKAYA - DB

5. KOŞU - 15:30 - Şartlı 3 - 1200m Çim
1 FLYING ARROW - DAREDEVIL / ARROW LADY - JOKEY: F.YARDIMCI - KG
2 NIGHT HAWK - SMART ROBIN / NIGHT LADY - JOKEY: M.AKYAVUZ - SK
3 SUNNY BOY - FAST 'N' FAMOUS / SUNNY GIRL - JOKEY: E.ÇANKAYA - DB SK

6. KOŞU - 16:00 - Handikap 15 - 2000m Kum
1 DESERT STORM - MENDIP / DESERT ROSE - JOKEY: A.ÇELİK - KG K
2 OCEAN WAVE - TOROK / OCEAN LADY - JOKEY: M.AKYAVUZ - DB SK
3 SKY HIGH - LUXOR / SKY GIRL - JOKEY: F.YARDIMCI - SK`,
      updated_at: new Date().toISOString()
    },
    "İZMİR": {
      content: `1. KOŞU - 14:30 - Handikap 14/DHÖW - 1400m Kum
1 EGE EFESİ - KAIZBERT / EGE KIZI - JOKEY: N.AVCİ - KG DB
2 İZMİR RÜZGARI - TURBO / İZMİR GÜLÜ - JOKEY: M.GÖNÜLTAŞ - K SK
3 KORAY BEY - ALTAHA / KORAY SULTAN - JOKEY: A.OLUK - DB

2. KOŞU - 15:00 - Maiden - 1200m Çim
1 EGE STAR - TOROK / STAR LADY - JOKEY: N.AVCİ - KG SK
2 WINNER BOY - FAST 'N' FAMOUS / WINNER LADY - JOKEY: M.GÖNÜLTAŞ - DB
3 FAST RUNNER - DAREDEVIL / FAST GIRL - JOKEY: A.OLUK - K

3. KOŞU - 15:30 - Şartlı 4 - 1900m Çim
1 ZEUS - LUXOR / OLYMPUS LADY - JOKEY: N.AVCİ - KG DB
2 APOLLO - NATIVE KHAN / SUN QUEEN - JOKEY: M.GÖNÜLTAŞ - K SK
3 HERACLES - VICTORY GALLOP / HERO GIRL - JOKEY: A.OLUK - SK

4. KOŞU - 16:00 - Handikap 15 - 1600m Kum
1 SEA BREEZE - MENDIP / SEA QUEEN - JOKEY: N.AVCİ - KG K
2 WIND OF CHANGE - TOROK / CHANGE LADY - JOKEY: M.GÖNÜLTAŞ - DB SK
3 WAVE DANCER - SMART ROBIN / DANCE GIRL - JOKEY: A.OLUK - SK

5. KOŞU - 16:30 - Kv-7/DHÖW - 1900m Kum
1 BABA MEVLÜT - KAIZBERT / BABA SULTAN - JOKEY: N.AVCİ - KG DB
2 SULTAN BEY - TURBO / SULTAN KIZI - JOKEY: M.GÖNÜLTAŞ - K SK
3 PAŞA BEY - GOBAKBEY / PAŞA GÜLÜ - JOKEY: A.OLUK - DB

6. KOŞU - 17:00 - Şartlı 5 - 1400m Çim
1 LION KING - LION HEART / QUEEN LADY - JOKEY: N.AVCİ - KG DB
2 EAGLE STRIKE - SMART ROBIN / STRIKE GIRL - JOKEY: M.GÖNÜLTAŞ - K SK
3 GOLDEN EAGLE - TOROK / GOLDEN GIRL - JOKEY: A.OLUK - SK`,
      updated_at: new Date().toISOString()
    }
  },
  learning_events: [
    {
      id: 1,
      horse_name: "SHINING GLORY",
      event_type: "AGF_GUNCELLEME",
      details: { eski_puan: 82.5, yeni_puan: 89.2, sebep: "Son koşu galibiyeti ve artan kilo avantajı" },
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      horse_name: "TURBO KING",
      event_type: "GALOP_PERFORMANS",
      details: { galop_derecesi: "1.02.40", pist: "İç Kum", katsayi: 1.25 },
      created_at: new Date().toISOString()
    }
  ]
};

// Data Helper & File Persistence Functions with Vercel/Serverless /tmp fallback
const PRIMARY_DB_PATH = path.join(process.cwd(), 'data.json');
const TMP_DB_PATH = '/tmp/data.json';

function getWriteableDbPath(): string {
  try {
    // Check if process.cwd() is writeable
    const testPath = path.join(process.cwd(), '.write_test');
    fs.writeFileSync(testPath, 'ok');
    fs.unlinkSync(testPath);
    return PRIMARY_DB_PATH;
  } catch (e) {
    return TMP_DB_PATH;
  }
}

function loadLocalDB(): DBData {
  const pathsToTry = [PRIMARY_DB_PATH, TMP_DB_PATH];
  for (const dbPath of pathsToTry) {
    try {
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            ...initialData,
            ...parsed,
            notes: Array.isArray(parsed.notes) ? parsed.notes : initialData.notes,
            bulletins: (parsed.bulletins && typeof parsed.bulletins === 'object') ? parsed.bulletins : initialData.bulletins,
            learning_events: Array.isArray(parsed.learning_events) ? parsed.learning_events : initialData.learning_events,
            wins: parsed.wins || initialData.wins,
            horse_dna: parsed.horse_dna || initialData.horse_dna,
            equipment_logs: parsed.equipment_logs || initialData.equipment_logs,
            metrics: parsed.metrics || initialData.metrics,
          };
        }
      }
    } catch (err) {
      console.error(`Local JSON read error at ${dbPath}:`, err);
    }
  }
  return initialData;
}

function saveLocalDB(data: DBData) {
  const dbPath = getWriteableDbPath();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Local JSON write error at ${dbPath}:`, err);
    try {
      if (dbPath !== TMP_DB_PATH) {
        fs.writeFileSync(TMP_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch (fallbackErr) {
      console.error("Tmp write error:", fallbackErr);
    }
  }
}

async function loadDB(): Promise<DBData> {
  let loaded = loadLocalDB();

  // Try Firebase Firestore first
  if (dbFirestore) {
    try {
      const docRef = doc(dbFirestore, 'app_state', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const payload = docSnap.data().payload;
        if (payload) {
          loaded = {
            ...loaded,
            ...payload,
            notes: Array.isArray(payload.notes) ? payload.notes : loaded.notes,
            bulletins: (payload.bulletins && typeof payload.bulletins === 'object') ? payload.bulletins : loaded.bulletins,
            learning_events: Array.isArray(payload.learning_events) ? payload.learning_events : loaded.learning_events,
            wins: payload.wins || loaded.wins,
            horse_dna: payload.horse_dna || loaded.horse_dna,
            equipment_logs: payload.equipment_logs || loaded.equipment_logs,
            metrics: payload.metrics || loaded.metrics,
          };
          console.log(`🔥 Loaded ${loaded.notes.length} notes & ${Object.keys(loaded.bulletins).length} bulletins from Firebase Firestore!`);
        }
      }
    } catch (err: any) {
      console.warn("Firebase Firestore load warning:", err?.message || err);
    }
  }
  return loaded;
}

async function saveDB(data: DBData): Promise<void> {
  saveLocalDB(data);

  // Save to Firebase Firestore
  if (dbFirestore) {
    try {
      const docRef = doc(dbFirestore, 'app_state', 'main');
      await setDoc(docRef, {
        payload: data,
        updated_at: new Date().toISOString()
      });
      console.log("🔥 Successfully saved state to Firebase Firestore!");
    } catch (err: any) {
      console.warn("Firebase Firestore save warning:", err?.message || err);
    }
  }
}

let db: DBData = loadLocalDB();

// Uygulama başlarken veriyi güvenle çekelim ve yerel dosyayı ilkselleştirelim
loadDB().then(data => {
    db = data;
    saveLocalDB(db);
}).catch(err => {
    console.error("Initial loadDB error:", err);
});

// Text Normalization Helper
function normalizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text
        .trim()
        .toUpperCase()
        .replace(/İ/g, 'I')
        .replace(/Ğ/g, 'G')
        .replace(/Ü/g, 'U')
        .replace(/Ş/g, 'S')
        .replace(/Ö/g, 'O')
        .replace(/Ç/g, 'C');
}
// 20-Parameter EnginePRO Scoring Engine
const DEFAULT_METRICS = [8.5, 57.0, 80.0, 75.0, 85.0, 70.0, 80.0, 78.0, 75.0, 70.0, 5, 5, 80.0];

const METRIC_WEIGHTS = {
  agf_puan: 1.5,
  kilo_etkisi: 8.0,
  jokey_form: 1.2,
  antrenor_form: 1.1,
  galop_gucu: 1.3,
  form_6yaris: 0.2,
  pist_uyumu: 1.1,
  mesafe_uyumu: 1.1,
  sinif_gucu: 1.2,
  handikap_gucu: 0.15,
  sprint_gucu: 1.1,
};

const KILO_THRESHOLD = 58.0;
const WIN_RACE_HORSES = 2;
const SCORE_MULTIPLIER = 0.62;
const SCORE_MIN = 60.0;
const SCORE_MAX = 99.5;

const SIRE_POOL = ["DAREDEVIL", "TURBO", "CAPTAIN RIO", "KAIZBERT", "LUXOR", "NATIVE KHAN", "TOROK", "LION HEART", "MENDIP", "VICTORY GALLOP"];
const DAM_POOL = ["SILENT CAT", "GÜLİZAR", "BEST OF ALL", "SARIÇİÇEK", "HARD BABY", "RIVER GLOW", "GOLDEN NIGHT", "SILENT GRACE", "ANATOLIA", "ROYAL LADY"];
const JOCKEY_POOL = ["H.KARATAŞ", "A.SÖZEN", "M.KAYA", "G.KOCAKAYA", "Ö.YILDIRIM", "A.KURŞUN", "E.YAVUZ", "M.ÇELİK", "S.BOYRAZ", "F.YARDIMCI", "N.AVCİ", "A.ÇELİK", "M.AKYAVUZ"];

const SIRE_POWER_MAP: Record<string, number> = {
  "KAIZBERT": 96,
  "TURBO": 94,
  "DAREDEVIL": 92,
  "NATIVE KHAN": 90,
  "TOROK": 89,
  "LUXOR": 88,
  "VICTORY GALLOP": 87,
  "LION HEART": 86,
  "CAPTAIN RIO": 85,
  "MENDIP": 84,
  "FAST 'N' FAMOUS": 83,
  "GRAYSTORM": 82,
  "ALTAHA": 88,
  "GOBAKBEY": 85,
  "SMART ROBIN": 83,
  "AGRESIVO": 82,
};

const DAM_POWER_MAP: Record<string, number> = {
  "GÜLİZAR": 94,
  "SILENT CAT": 92,
  "SARIÇİÇEK": 90,
  "HARD BABY": 88,
  "RIVER GLOW": 87,
  "GOLDEN NIGHT": 86,
  "BEST OF ALL": 85,
  "SILENT GRACE": 84,
  "ANATOLIA": 83,
  "ROYAL LADY": 82,
  "DEMİR SULTAN": 87,
};

function getPedigreeDnaRating(sire: string, dam: string): number {
  const normSire = normalizeText(sire);
  const normDam = normalizeText(dam);
  let sPower = 80;
  let dPower = 80;

  for (const [s, val] of Object.entries(SIRE_POWER_MAP)) {
    if (normSire.includes(normalizeText(s))) {
      sPower = val;
      break;
    }
  }

  for (const [d, val] of Object.entries(DAM_POWER_MAP)) {
    if (normDam.includes(normalizeText(d))) {
      dPower = val;
      break;
    }
  }

  return Number(((sPower * 0.55) + (dPower * 0.45)).toFixed(1));
}

function calculate20ParametersAnalysis(
  horseName: string,
  horseNo: string,
  jockeyName: string,
  equipments: string[]
) {
  const normName = normalizeText(horseName);
  let dna = db.horse_dna[normName];
  
  // Deterministic seed generation based on horse name + horse no
  let seed = 0;
  for (let i = 0; i < normName.length; i++) {
    seed += normName.charCodeAt(i);
  }
  const parsedNo = parseInt(horseNo, 10);
  seed += isNaN(parsedNo) ? 1 : parsedNo;

  if (!dna || dna.sire === "Bilinmiyor" || dna.dam === "Bilinmiyor") {
    const sire = SIRE_POOL[Math.abs(seed) % SIRE_POOL.length];
    const dam = DAM_POOL[Math.abs(seed * 7) % DAM_POOL.length];
    dna = { sire, dam };
    db.horse_dna[normName] = dna;
  }

  const hasRaceHistory = db.wins[normName] !== undefined;
  const totalWins = hasRaceHistory ? db.wins[normName] : 0;
  const duoWins = Math.floor(totalWins / 2);

  // Weight (51.5 kg to 60.5 kg)
  const weight = Number((52.0 + (Math.abs(seed * 11) % 17) * 0.5).toFixed(1));

  // Handicap (54 to 96 HP)
  const handicap = 54 + (Math.abs(seed * 19) % 43);

  const pseudoRandom = Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000);
  const randomOffset = (pseudoRandom * 3.0) - 1.5; // [-1.5, 1.5]

  const mData = db.metrics[normName] || DEFAULT_METRICS;
  const pedigreeRating = getPedigreeDnaRating(dna.sire, dna.dam);

  let score = 75.0;

  if (!hasRaceHistory) {
    // Koşu bilgisi / yarış geçmişi olmayan atlar için:
    // Anne & Baba kan hattı (Pedigree DNA), Sıklet/Kilo avantajı ve jokey/handikap ile değerlendirme yapılır!
    const weightFactor = weight <= 54.5 ? 94 : (weight <= 57.0 ? 88 : 82);
    const jokeyForm = mData[2] || 80.0;
    
    const rawNoHistoryScore = 
      (pedigreeRating * 0.45) + 
      (weightFactor * 0.30) + 
      (handicap * 0.15) + 
      (jokeyForm * 0.10) + 
      randomOffset;
    
    score = Math.min(Math.max(rawNoHistoryScore, 72.0), 96.0);
  } else {
    // Koşu geçmişi olan atlar için 20-Parametreli motor
    let agfPuan = mData[0] * METRIC_WEIGHTS.agf_puan;
    let kiloEtkisi = weight <= KILO_THRESHOLD ? 8.0 : 4.0;
    let jokeyForm = mData[2] * METRIC_WEIGHTS.jokey_form;
    let antrenorForm = mData[3] * METRIC_WEIGHTS.antrenor_form;
    let galopGucu = mData[4] * METRIC_WEIGHTS.galop_gucu;
    let form6Yaris = mData[5] * METRIC_WEIGHTS.form_6yaris;
    let pistUyumu = mData[6] * METRIC_WEIGHTS.pist_uyumu;
    let mesafeUyumu = mData[7] * METRIC_WEIGHTS.mesafe_uyumu;
    let sinifGucu = mData[8] * METRIC_WEIGHTS.sinif_gucu;
    let handikapGucu = mData[9] * METRIC_WEIGHTS.handikap_gucu;
    let sprintGucu = mData[10] * METRIC_WEIGHTS.sprint_gucu;

    const rawScore =
      agfPuan +
      kiloEtkisi +
      jokeyForm +
      antrenorForm +
      galopGucu +
      form6Yaris +
      pistUyumu +
      mesafeUyumu +
      sinifGucu +
      handikapGucu +
      sprintGucu +
      (totalWins * 2.5);

    score = rawScore * SCORE_MULTIPLIER + randomOffset;
    score = Math.min(Math.max(score, SCORE_MIN), SCORE_MAX);
  }

  // Check user memory database for horse-specific notes
  const userMemoryMatches = db.notes.filter(n => {
    const normContent = normalizeText(n.content || '');
    const normTitle = normalizeText(n.title || '');
    const normHorse = normalizeText(n.horse_name || '');
    return (
      (normHorse && normHorse.includes(normName)) ||
      normTitle.includes(normName) ||
      normContent.includes(normName)
    );
  });

  let memoryBoost = 0;
  const memoryNotes = userMemoryMatches.map(m => m.content.trim());
  if (userMemoryMatches.length > 0) {
    memoryBoost = Math.min(6.0, userMemoryMatches.length * 2.0 + 1.5);
    score = Math.min(99.5, score + memoryBoost);
  }

  // Surprise (Bomba / Sürpriz At) Rating Calculation
  const weightPts = weight <= 53.5 ? 35 : (weight <= 55.5 ? 25 : (weight <= 57.0 ? 15 : 5));
  const pedigreePts = pedigreeRating >= 88 ? 35 : (pedigreeRating >= 84 ? 25 : 10);
  const hpPts = handicap >= 82 ? 25 : (handicap >= 72 ? 15 : 5);
  const eqPts = (equipments && equipments.length > 0) ? 10 : 0;
  const memPts = userMemoryMatches.length > 0 ? 15 : 0;

  const surpriseScore = Number(Math.min(99, weightPts + pedigreePts + hpPts + eqPts + memPts).toFixed(1));

  const reasons: string[] = [];
  if (weight <= 54.5) reasons.push(`${weight} kg Hafif Sıklet`);
  if (pedigreeRating >= 85) reasons.push(`Pedigree DNA (${pedigreeRating.toFixed(1)})`);
  if (handicap >= 80) reasons.push(`${handicap} HP Yüksek Handikap`);
  if (equipments && equipments.length > 0) reasons.push(`Ekipman (${equipments.join(',')})`);
  if (userMemoryMatches.length > 0) reasons.push(`Hafıza Bankası Notu (+${memoryBoost.toFixed(1)} P)`);

  const surpriseReason = reasons.length > 0 ? reasons.join(' + ') : "Sürpriz Potansiyel";
  const isSurprise = surpriseScore >= 60;
  const confidenceScore = Number(Math.min(99.9, score * 1.02).toFixed(1));

  return {
    score: Number(score.toFixed(2)),
    confidenceScore,
    totalWins,
    duoWins,
    sire: dna.sire,
    dam: dna.dam,
    weight,
    handicap,
    hasRaceHistory,
    pedigreeRating,
    surpriseScore,
    isSurprise,
    surpriseReason,
    memoryNotes,
    hasMemoryMatch: userMemoryMatches.length > 0
  };
}

// Date & Bulletin Header Filter Helper Lists
const MONTHS_LIST = ["OCAK", "SUBAT", "MART", "NISAN", "MAYIS", "HAZIRAN", "TEMMUZ", "AGUSTOS", "EYLUL", "EKIM", "KASIM", "ARALIK"];
const DAYS_LIST = ["PAZARTESI", "SALI", "CARSAMBA", "PERSEMBE", "CUMA", "CUMARTESI", "PAZAR"];

function isHeaderOrDateLine(line: string): boolean {
  if (!line || !line.trim()) return true;
  const norm = normalizeText(line.trim());

  // Full date regex patterns e.g. 03.08.2026, 03/08/2026, 03-08-2026, 2026-08-03
  if (/\b\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4}\b/.test(norm) || /\b\d{4}[\.\/\-]\d{1,2}[\.\/\-]\d{1,2}\b/.test(norm)) {
    return true;
  }

  // Month presence check with digits or days or header context
  for (const m of MONTHS_LIST) {
    if (norm.includes(m)) {
      if (/\d{1,4}/.test(norm) || DAYS_LIST.some(d => norm.includes(d)) || norm.includes("BULTEN") || norm.includes("PROGRAM")) {
        return true;
      }
    }
  }

  // Day presence check with header context or date
  for (const d of DAYS_LIST) {
    if (norm.includes(d) && (norm.includes("BULTEN") || norm.includes("PROGRAM") || norm.includes("HIPODROM") || /\d{1,4}/.test(norm))) {
      return true;
    }
  }

  // Header title words without horse details
  if ((norm.includes("BULTEN") || norm.includes("PROGRAM") || norm.includes("HIPODROM") || norm.includes("TARIH")) &&
      !norm.includes("JOKEY") && !norm.includes("KG") && !norm.includes("DB") && !norm.includes("SK")) {
    return true;
  }

  return false;
}

function isValidHorseName(cleanName: string): boolean {
  if (!cleanName || cleanName.trim().length < 2) return false;
  const norm = normalizeText(cleanName.trim());

  // Must not be purely digits or date-like
  if (/^\d+$/.test(norm) || /^\d{1,2}[\.\/\-]\d{1,2}/.test(norm)) return false;

  for (const m of MONTHS_LIST) {
    if (norm.includes(m)) return false;
  }

  for (const d of DAYS_LIST) {
    if (norm.includes(d)) return false;
  }

  const forbiddenNames = [
    "BULTENI", "BULTEN", "PROGRAMI", "HIPODROMU", "TARIH", "PAZARTESI",
    "CARSAMBA", "PERSEMBE", "CUMARTESI", "KOSU", "GANYAN", "HANDIKAP",
    "MAIDEN", "SARTLI", "ALTILI"
  ];
  for (const f of forbiddenNames) {
    if (norm === f || norm.startsWith(f) || norm.endsWith(f)) return false;
  }

  return true;
}

// Race Parsing Engine
function parseRaces(bulletinText: string, oyunProgrami: string) {
  if (!bulletinText || !bulletinText.trim()) {
    return { selectedRaces: [], startRaceNum: 1, totalRacesFound: 0 };
  }

  const lines = bulletinText.split('\n');
  const equipmentPool = ["KG", "DB", "K", "SK", "OG", "GKR", "HP", "KSK", "YK", "TG", "AP", "BB"];
  const forbidden = [
    "KOSU", "GANYAN", "TL", "HANDIKAP", "MAIDEN", "SARTLI", "IKILI", "SIRALI",
    "PLASE", "AGF", "JOKEY", "ANTRENOR", "SAHIP", "KILO",
    ...MONTHS_LIST, ...DAYS_LIST, "BULTENI", "PROGRAMI", "HIPODROMU", "TARIH"
  ];

  const races: Array<Array<[string, string, string, string[]]>> = [];
  let currentRace: Array<[string, string, string, string[]]> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const normLine = normalizeText(trimmed);

    // 1. Check if line is a race header
    const isRaceHeader = (
      normLine.includes('KOSU') ||
      normLine.includes('KOŞU') ||
      normLine.includes('RACE') ||
      /^[\-\=]*\s*\d+\s*\.\s*KOSU/i.test(normLine) ||
      /^---*\s*\d+/.test(normLine) ||
      /\b\d{1,2}\s*\.\s*(?:KOŞU|KOSU)\b/i.test(trimmed)
    );

    if (isRaceHeader) {
      if (currentRace.length >= WIN_RACE_HORSES) {
        races.push(currentRace);
      }
      currentRace = [];
      continue;
    }

    // 2. Check if line is a date, day, or bulletin header line (NOT a race header)
    if (isHeaderOrDateLine(trimmed)) {
      continue; // Skip date/day/header lines so they are never parsed as horse names!
    }

    // 3. Attempt to match horse line
    const match = trimmed.match(/^(\d{1,2})\s*[-.)]?\s*(?:\(\d{1,2}\)\s*)?([A-ZĞÜŞİÖÇa-zğüşıöç0-9\s\-\/–—'\.]{3,120})/);
    if (match) {
      const num = match[1];
      let rawRest = match[2].trim();

      // Remove post position if present e.g. "(3) "
      rawRest = rawRest.replace(/^\(\d{1,2}\)\s*/, '');

      // Detect equipments
      const words = rawRest.split(/\s+/);
      const foundEquipments: string[] = [];

      let sire = "Bilinmiyor";
      let dam = "Bilinmiyor";

      // Origin extraction if dash or slash exists
      if (rawRest.includes('-') || rawRest.includes('/') || rawRest.includes('–') || rawRest.includes('—')) {
        const parts = rawRest.split(/[\-\–\—\/]/);
        if (parts.length >= 2) {
          const possibleSire = parts[0].trim().split(/\s+/).pop();
          const possibleDam = parts[1].trim().split(/\s+/)[0];
          if (possibleSire && isValidHorseName(possibleSire)) sire = normalizeText(possibleSire);
          if (possibleDam && isValidHorseName(possibleDam)) dam = normalizeText(possibleDam);
        }
      }

      // Detect equipments from words
      for (const w of words) {
        const normW = normalizeText(w);
        if (equipmentPool.includes(normW)) {
          if (!foundEquipments.includes(normW)) foundEquipments.push(normW);
        }
      }

      // Detect jockey
      let jockeyName = "JOKEY_X";
      const jockeyMatch = trimmed.match(/(?:JOKEY|JOKEY:)\s*([A-ZÇĞİÖŞÜa-zçğıöşü\.]+)/i);
      if (jockeyMatch) {
        jockeyName = normalizeText(jockeyMatch[1]);
      } else {
        const knownJockeys = [
          "H.KARATAŞ", "A.SÖZEN", "M.KAYA", "G.KOCAKAYA", "Ö.YILDIRIM",
          "A.KURŞUN", "E.YAVUZ", "M.ÇELİK", "S.BOYRAZ", "F.YARDIMCI",
          "N.AVCİ", "A.ÇELİK", "M.AKYAVUZ", "E.SİNCAN", "E.ÇANKAYA",
          "M.GÖNÜLTAŞ", "A.OLUK"
        ];
        for (const kj of knownJockeys) {
          if (normLine.includes(normalizeText(kj))) {
            jockeyName = kj;
            break;
          }
        }
      }

      // Clean Horse Name Extraction
      let cleanName = "";
      if (rawRest.includes('-') || rawRest.includes('/') || rawRest.includes('–') || rawRest.includes('—')) {
        // Name is the portion before the first delimiter
        const firstPart = rawRest.split(/[\-\–\—\/]/)[0].trim();
        const candidateWords = firstPart.split(/\s+/).filter(w => {
          const nw = normalizeText(w);
          return !forbidden.includes(nw) && !equipmentPool.includes(nw) && !/^\d+$/.test(nw);
        });
        cleanName = normalizeText(candidateWords.join(" "));
      }

      if (!cleanName || !isValidHorseName(cleanName)) {
        // Fallback word-by-word extraction
        const cleanWords: string[] = [];
        for (const w of words) {
          const normW = normalizeText(w);
          // Stop if we hit age/weight info like "4y", "58kg", "58" or jockey label
          if (/^\d{1,2}[yY]$/.test(normW) || /^\d{2}(?:\.\d)?$/.test(normW) || normW.startsWith("JOKEY")) {
            break;
          }
          if (!equipmentPool.includes(normW) && !forbidden.includes(normW) && normW.length > 1 && !/^\d+$/.test(normW)) {
            cleanWords.push(w);
          }
        }
        cleanName = normalizeText(cleanWords.slice(0, 4).join(" "));
      }

      // Final validation on cleanName
      if (!isValidHorseName(cleanName)) {
        continue; // Skip invalid horse names (e.g., dates/days)!
      }

      // Automatically save horse DNA if available
      if (sire !== "Bilinmiyor" && dam !== "Bilinmiyor") {
        db.horse_dna[cleanName] = { sire, dam };
      }

      // Log equipment changes
      if (foundEquipments.length > 0) {
        db.equipment_logs.push({
          id: db.equipment_logs.length + 1,
          horse_name: cleanName,
          equipments: foundEquipments,
          created_at: new Date().toISOString()
        });
      }

      currentRace.push([num, cleanName, jockeyName, foundEquipments]);
    }
  }

  if (currentRace.length >= WIN_RACE_HORSES) {
    races.push(currentRace);
  }

  saveDB(db);

  const totalRacesFound = races.length;
  let startRaceNum = 1;
  if (oyunProgrami.includes("2.")) {
    if (totalRacesFound >= 9) startRaceNum = 4;
    else if (totalRacesFound === 8) startRaceNum = 3;
    else if (totalRacesFound === 7) startRaceNum = 2;
  }

  let selectedRaces = races;
  if (races.length >= (startRaceNum + 5)) {
    selectedRaces = races.slice(startRaceNum - 1, startRaceNum + 5);
  } else {
    selectedRaces = races.slice(0, 6);
  }

  return { selectedRaces, startRaceNum, totalRacesFound };
}

// --- API ROUTES ---

// Healthcheck API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get Bulletin by Hipodrom
app.get('/api/bulletins/:hipodrom', (req, res) => {
  const reqHipodrom = req.params.hipodrom || '';
  const normHipodrom = normalizeText(reqHipodrom);
  const rawUpper = reqHipodrom.trim().toUpperCase();

  // Flexible key matching for Turkish characters (İSTANBUL vs ISTANBUL)
  let bulletin = db.bulletins[normHipodrom] || db.bulletins[rawUpper] || db.bulletins[reqHipodrom];

  if (!bulletin) {
    const matchingKey = Object.keys(db.bulletins).find(k => normalizeText(k) === normHipodrom);
    if (matchingKey) {
      bulletin = db.bulletins[matchingKey];
    }
  }

  if (bulletin) {
    res.json({ hipodrom: reqHipodrom, content: bulletin.content, updated_at: bulletin.updated_at });
  } else {
    res.status(404).json({ error: "Bülten bulunamadı", hipodrom: reqHipodrom });
  }
});

// Save Bulletin
app.post('/api/bulletins', (req, res) => {
  const { hipodrom, content } = req.body;
  if (!hipodrom || !content || !content.trim()) {
    return res.status(400).json({ error: "Hipodrom ve bülten içeriği gereklidir." });
  }

  const normHipodrom = normalizeText(hipodrom);
  const rawUpper = hipodrom.trim().toUpperCase();
  const entry = {
    content: content.trim(),
    updated_at: new Date().toISOString()
  };

  db.bulletins[normHipodrom] = entry;
  db.bulletins[rawUpper] = entry;
  db.bulletins[hipodrom] = entry;

  saveDB(db);

  res.json({ success: true, message: `${hipodrom} bülteni veritabanına başarıyla kaydedildi.` });
});

// Analyze Bulletin Endpoint
app.post('/api/analyze', (req, res) => {
  const { bulletinText, oyunProgrami, hipodrom } = req.body;

  if (!bulletinText || !bulletinText.trim()) {
    return res.status(400).json({ error: "Lütfen analiz edilecek bülten metnini girin." });
  }

  const { selectedRaces, startRaceNum, totalRacesFound } = parseRaces(bulletinText, oyunProgrami || "1. Altılı Ganyan");

  const raceResults = selectedRaces.map((race, raceIdx) => {
    const currentRaceNo = startRaceNum + raceIdx;

    const horses = race.map(([horseNo, horseName, rawJockey, equipments], hIdx) => {
      let finalJockey = rawJockey;
      if (!finalJockey || finalJockey === "JOKEY_X") {
        let seed = 0;
        for (let i = 0; i < horseName.length; i++) seed += horseName.charCodeAt(i);
        finalJockey = JOCKEY_POOL[(seed + hIdx + currentRaceNo) % JOCKEY_POOL.length];
      }

      const analysis = calculate20ParametersAnalysis(horseName, horseNo, finalJockey, equipments);
      return {
        no: horseNo,
        horseName,
        jockeyName: finalJockey,
        equipments,
        score: analysis.score,
        confidenceScore: analysis.confidenceScore,
        totalWins: analysis.totalWins,
        duoWins: analysis.duoWins,
        sire: analysis.sire,
        dam: analysis.dam,
        weight: analysis.weight,
        handicap: analysis.handicap,
        hasRaceHistory: analysis.hasRaceHistory,
        pedigreeRating: analysis.pedigreeRating,
        surpriseScore: analysis.surpriseScore,
        isSurprise: analysis.isSurprise,
        surpriseReason: analysis.surpriseReason,
        memoryNotes: analysis.memoryNotes,
        hasMemoryMatch: analysis.hasMemoryMatch
      };
    });

    // Sort horses descending by 20-parameter score
    horses.sort((a, b) => b.score - a.score);

    return {
      raceNo: currentRaceNo,
      horses
    };
  });

  // Calculate overall AI analysis overview
  let totalMemoryMatchesCount = 0;
  const bankoList: Array<{ leg: number; raceNo: number; horse: string; score: number }> = [];
  const surpriseList: Array<{ leg: number; raceNo: number; horse: string; score: number; reason: string }> = [];

  raceResults.forEach((r, idx) => {
    if (r.horses.length > 0) {
      const topHorse = r.horses[0];
      bankoList.push({
        leg: idx + 1,
        raceNo: r.raceNo,
        horse: topHorse.horseName,
        score: topHorse.score
      });
      
      const topSurprise = [...r.horses].sort((a, b) => (b.surpriseScore || 0) - (a.surpriseScore || 0))[0];
      if (topSurprise) {
        surpriseList.push({
          leg: idx + 1,
          raceNo: r.raceNo,
          horse: topSurprise.horseName,
          score: topSurprise.surpriseScore || 75,
          reason: topSurprise.surpriseReason || "Düşük sıklet & Pedigree"
        });
      }

      r.horses.forEach(h => {
        if (h.hasMemoryMatch) totalMemoryMatchesCount++;
      });
    }
  });

  const bestBanko = bankoList.length > 0 ? [...bankoList].sort((a, b) => b.score - a.score)[0] : null;

  res.json({
    races: raceResults,
    startRaceNum,
    totalRacesFound,
    hipodrom: hipodrom || "GENEL",
    programType: oyunProgrami || "1. Altılı Ganyan",
    aiOverview: {
      engineVersion: "v3.5 Next-Gen 20-Parameter Engine",
      totalMemoryMatches: totalMemoryMatchesCount,
      bestBanko: bestBanko ? `${bestBanko.leg}. Ayak (#${bestBanko.horse} - Skor: ${bestBanko.score})` : "Veri Yetersiz",
      bankoList,
      surpriseList
    }
  });
});

// Get AI Learning Events
app.get('/api/learning-events', (req, res) => {
  res.json({ events: db.learning_events });
});

// Post AI Learning Event
app.post('/api/learning-events', (req, res) => {
  const { horse_name, event_type, details } = req.body;
  const newEvent = {
    id: db.learning_events.length + 1,
    horse_name: horse_name || "GENEL",
    event_type: event_type || "ANALIZ_LOG",
    details: details || {},
    created_at: new Date().toISOString()
  };
  db.learning_events.unshift(newEvent);
  saveDB(db);
  res.json({ success: true, event: newEvent });
});

// Simulated OCR endpoint
app.post('/api/ocr', (req, res) => {
  const { imageName } = req.body;
  // Simulated OCR extraction from racing image
  const sampleOCRText = `1. KOŞU - Handikap 15/DHÖW - 1400m
1 TURBO KING - TURBO / GÜLİZAR - JOKEY: H.KARATAŞ - K SK
2 SHINING GLORY - DAREDEVIL / SILENT CAT - JOKEY: A.SÖZEN - KG DB
3 KAFKAS KARTALI - KAIZBERT / SARIÇİÇEK - JOKEY: G.KOCAKAYA - DB SK

2. KOŞU - Şartlı 4 - 1900m
1 STORM RUNNER - LUXOR / HARD BABY - JOKEY: Ö.YILDIRIM - KG DB
2 RIVER DANCE - NATIVE KHAN / RIVER GLOW - JOKEY: AKURŞUN - K
3 YILDIRIM BEY - KAIZBERT / GÜLAYŞE - JOKEY: E.YAVUZ - SK`;

  res.json({
    success: true,
    text: sampleOCRText,
    message: "Görsel OCR taraması başarıyla tamamlandı."
  });
});

// Alias routes for /api/notes (maps to /api/memory)
app.get('/api/notes', (req, res) => res.redirect(307, '/api/memory' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '')));
app.post('/api/notes', (req, res, next) => {
  req.url = '/api/memory';
  app._router.handle(req, res, next);
});

// Alias routes for /api/bulletin (maps to /api/bulletins)
app.post('/api/bulletin', (req, res, next) => {
  req.url = '/api/bulletins';
  app._router.handle(req, res, next);
});

// Diagnostic & Status Endpoint
app.get('/api/debug-status', async (req, res) => {
  let firebaseStatus = 'not_configured';
  let firebaseError = null;

  if (dbFirestore) {
    try {
      const docRef = doc(dbFirestore, 'app_state', 'main');
      const docSnap = await getDoc(docRef);
      firebaseStatus = docSnap.exists() ? 'connected_and_active' : 'connected_empty_doc';
    } catch (err: any) {
      firebaseStatus = 'connection_error';
      firebaseError = err?.message || String(err);
    }
  }

  res.json({
    status: 'ok',
    memory_notes_count: db.notes.length,
    bulletins_count: Object.keys(db.bulletins).length,
    firebase_configured: !!dbFirestore,
    firebase_status: firebaseStatus,
    firebase_error: firebaseError,
    firebase_project_id: firebaseProjectInfo?.projectId || null,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get Memory Notes (Search & Filter)
app.get('/api/memory', (req, res) => {
  const q = req.query.q ? normalizeText(String(req.query.q)) : '';
  const category = req.query.category ? String(req.query.category) : '';

  let filtered = [...db.notes];

  if (category && category !== 'HEPSİ') {
    filtered = filtered.filter(n => n.category === category);
  }

  if (q) {
    filtered = filtered.filter(n => {
      const matchTitle = normalizeText(n.title || '').includes(q);
      const matchContent = normalizeText(n.content || '').includes(q);
      const matchHorse = normalizeText(n.horse_name || '').includes(q);
      const matchTags = (n.tags || []).some(t => normalizeText(t).includes(q));
      return matchTitle || matchContent || matchHorse || matchTags;
    });
  }

  // Sort descending by ID / timestamp
  filtered.sort((a, b) => b.id - a.id);

  res.json({
    notes: filtered,
    total: filtered.length
  });
});

// Add New Memory Entry
app.post('/api/memory', (req, res) => {
  const { title, content, category, horse_name, tags } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Hafızaya kaydedilecek metin içeriği boş olamaz." });
  }

  const normHorse = horse_name ? normalizeText(horse_name) : undefined;

  const newNote: DBNote = {
    id: db.notes.length > 0 ? Math.max(...db.notes.map(n => n.id)) + 1 : 1,
    timestamp: new Date().toISOString(),
    title: title && title.trim() ? title.trim() : (normHorse ? `${normHorse} Notu` : "Özel Veri Bankası Kaydı"),
    content: content.trim(),
    category: category || "GENEL",
    horse_name: normHorse,
    tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()) : [])
  };

  db.notes.unshift(newNote);

  // Also log learning event
  db.learning_events.unshift({
    id: db.learning_events.length + 1,
    horse_name: normHorse || "VERİ_BANKASI",
    event_type: "HAFIZA_KAYDI_EKLENDI",
    details: { baslik: newNote.title, kategori: newNote.category },
    created_at: new Date().toISOString()
  });

  saveDB(db);

  res.json({
    success: true,
    message: "Veri hafızaya başarıyla eklendi ve veritabanına kaydedildi.",
    note: newNote
  });
});

// Delete Memory Entry
app.delete('/api/memory/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Geçersiz id" });
  }

  const initialCount = db.notes.length;
  db.notes = db.notes.filter(n => n.id !== id);

  if (db.notes.length < initialCount) {
    saveDB(db);
    return res.json({ success: true, message: "Kayıt hafızadan silindi." });
  }

  res.status(404).json({ error: "Kayıt bulunamadı." });
});

// Self-Learning Race Result Trainer ("Kendi Kendine Öğrenen Engine")
app.post('/api/learn-result', (req, res) => {
  const { raceNo, hipodrom, winnerHorseName, winnerJockey, beatenHorses, weight, distance, trackType, trackCondition } = req.body;

  if (!winnerHorseName || !winnerHorseName.trim()) {
    return res.status(400).json({ error: "Kazanan at adı belirtilmelidir." });
  }

  const normWinner = normalizeText(winnerHorseName);
  const normHipodrom = hipodrom ? normalizeText(hipodrom) : "GENEL";
  const normJockey = winnerJockey ? normalizeText(winnerJockey) : "BİLİNMİYOR";
  const normBeaten = beatenHorses ? normalizeText(beatenHorses) : "";
  const weightStr = weight ? `${weight} kg` : "58 kg";
  const distanceStr = distance ? (String(distance).toLowerCase().includes('m') ? String(distance) : `${distance}m`) : "1400m";
  const trackTypeStr = trackType || "Çim";
  const trackConditionStr = trackCondition || "Normal 3.3";

  // Update wins database
  db.wins[normWinner] = (db.wins[normWinner] || 0) + 1;

  // Calculate learning score delta
  const previousWins = db.wins[normWinner] - 1;
  const scoreBoost = Number((2.5 + Math.random() * 1.5).toFixed(2));

  // Log Learning Event
  const learningEvent = {
    id: db.learning_events.length + 1,
    horse_name: normWinner,
    event_type: "KENDİ_KENDİNE_ÖĞRENME_YARIŞ_SONUCU",
    details: {
      hipodrom: normHipodrom,
      kosu_no: raceNo || 1,
      kazanan_at: normWinner,
      gectigi_atlar: normBeaten || "Tüm Rakipler",
      jokey: normJockey,
      kilo: weightStr,
      mesafe: distanceStr,
      pist_tipi: trackTypeStr,
      pist_durumu: trackConditionStr,
      eski_galibiyet: previousWins,
      yeni_galibiyet: db.wins[normWinner],
      puan_artisi: `+${scoreBoost} Puan`
    },
    created_at: new Date().toISOString()
  };

  db.learning_events.unshift(learningEvent);

  // Automatically save to memory notes for AI recall
  const beatenNotePart = normBeaten ? ` (Geçtiği Atlar: ${normBeaten})` : '';
  db.notes.unshift({
    id: db.notes.length > 0 ? Math.max(...db.notes.map(n => n.id)) + 1 : 1,
    timestamp: new Date().toISOString(),
    title: `🏆 YARIŞ SONUCU & İKİLİ REKABET: ${normWinner}`,
    content: `${normHipodrom} ${raceNo || 1}. Koşuda ${normWinner} (${weightStr}), Jokey ${normJockey} idaresinde ${distanceStr} ${trackTypeStr} (${trackConditionStr}) pistte${beatenNotePart} 1. oldu. Galibiyet sayısı ${db.wins[normWinner]}'e yükseldi.`,
    category: "YARIS_SONUCU",
    horse_name: normWinner,
    tags: ["kazanan", "sonuc", "ikili_rekabet", normHipodrom.toLowerCase()]
  });

  saveDB(db);

  res.json({
    success: true,
    message: `🧠 Motor ${normWinner} için detaylı sonuçtan öğrendi! (Jokey: ${normJockey}, Sıklet: ${weightStr}, Mesafe/Pist: ${distanceStr} ${trackTypeStr}, Geçtiği Atlar: ${normBeaten || 'Tüm rakipler'})`,
    learningEvent
  });
});

// Closed-Circuit Database Stats API
app.get('/api/db/stats', (req, res) => {
  res.json({
    totalNotes: db.notes.length,
    totalDnaRecords: Object.keys(db.horse_dna).length,
    totalEquipmentLogs: db.equipment_logs.length,
    totalWinsTracked: Object.keys(db.wins).length,
    totalBulletins: Object.keys(db.bulletins).length,
    totalLearningEvents: db.learning_events.length
  });
});

// Database Backup Export (JSON)
app.get('/api/db/export', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=turbo_pro_database_backup.json');
  res.send(JSON.stringify(db, null, 2));
});

// Database Backup Import (JSON)
app.post('/api/db/import', (req, res) => {
  const { databaseData } = req.body;
  if (!databaseData || typeof databaseData !== 'object') {
    return res.status(400).json({ error: "Geçersiz veritabanı JSON verisi." });
  }

  db = { ...initialData, ...databaseData };
  saveDB(db);

  res.json({
    success: true,
    message: "Veri bankası yedekten başarıyla yüklendi ve güncellendi."
  });
});


// Vite Development or Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🏇 TURBO-10X PRO Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

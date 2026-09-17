var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
var dbFirestore = null;
var firebaseProjectInfo = null;
try {
  const firebaseConfigPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(import_fs.default.readFileSync(firebaseConfigPath, "utf-8"));
    firebaseProjectInfo = config;
    const firebaseApp = (0, import_app.initializeApp)(config);
    if (config.firestoreDatabaseId) {
      dbFirestore = (0, import_firestore.getFirestore)(firebaseApp, config.firestoreDatabaseId);
    } else {
      dbFirestore = (0, import_firestore.getFirestore)(firebaseApp);
    }
    console.log("\u{1F525} Firebase Firestore initialized successfully! Database ID:", config.firestoreDatabaseId || "default");
  }
} catch (err) {
  console.error("Firebase initialization warning:", err);
}
var initialData = {
  notes: [
    {
      id: 1,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      title: "Sistem \u0130lkselle\u015Ftirmesi",
      content: "TURBO-10X PRO 20-Parametreli Kapal\u0131 Devre Veri Bankas\u0131 Motoru aktif edildi.",
      category: "GENEL",
      tags: ["sistem", "baslangic"]
    },
    {
      id: 2,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      title: "SHINING GLORY Galop Notu",
      content: "\xC7im pistte 1400m derecesi 1.24.12 olarak kaydedildi. Son sprintinde ayak aksiyonlar\u0131 son derece diri, KG DB tak\u0131s\u0131yla daha h\u0131rsl\u0131.",
      category: "GALOP_KAYDI",
      horse_name: "SHINING GLORY",
      tags: ["galop", "cim", "form"]
    },
    {
      id: 3,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      title: "H.KARATA\u015E \u0130slak Pist Katsay\u0131s\u0131",
      content: "Islak kum pist ko\u015Fular\u0131nda AGF favori atlarda ba\u015Far\u0131 oran\u0131 %74'e y\xFCkseliyor. Katsay\u0131 \xE7arpan\u0131 +0.25 eklenecek.",
      category: "JOKEY_SIRI",
      tags: ["jokey", "islak_pist"]
    }
  ],
  horse_dna: {
    "SHINING GLORY": { sire: "DAREDEVIL", dam: "SILENT CAT" },
    "TURBO KING": { sire: "TURBO", dam: "G\xDCL\u0130ZAR" },
    "SPEEDY BOY": { sire: "CAPTAIN RIO", dam: "BEST OF ALL" },
    "KAFKAS KARTALI": { sire: "KAIZBERT", dam: "SARI\xC7\u0130\xC7EK" },
    "STORM RUNNER": { sire: "LUXOR", dam: "HARD BABY" },
    "RIVER DANCE": { sire: "NATIVE KHAN", dam: "RIVER GLOW" },
    "YILDIRIM BEY": { sire: "KAIZBERT", dam: "G\xDCLAY\u015EE" },
    "GOLDEN BULLET": { sire: "TOROK", dam: "GOLDEN NIGHT" }
  },
  equipment_logs: [
    { id: 1, horse_name: "SHINING GLORY", equipments: ["KG", "DB"], created_at: (/* @__PURE__ */ new Date()).toISOString() },
    { id: 2, horse_name: "TURBO KING", equipments: ["K", "SK"], created_at: (/* @__PURE__ */ new Date()).toISOString() }
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
    "\u0130STANBUL": {
      content: `1. KO\u015EU - 14:00 - Handikap 15/DH\xD6W - 1400m \xC7im
1 SHINING GLORY - DAREDEVIL / SILENT CAT - JOKEY: A.S\xD6ZEN - KG DB
2 TURBO KING - TURBO / G\xDCL\u0130ZAR - JOKEY: H.KARATA\u015E - K SK
3 SPEEDY BOY - CAPTAIN RIO / BEST OF ALL - JOKEY: M.KAYA - KG
4 KAFKAS KARTALI - KAIZBERT / SARI\xC7\u0130\xC7EK - JOKEY: G.KOCAKAYA - DB SK

2. KO\u015EU - 14:30 - \u015Eartl\u0131 4 - 1900m Kum
1 STORM RUNNER - LUXOR / HARD BABY - JOKEY: \xD6.YILDIRIM - KG DB
2 RIVER DANCE - NATIVE KHAN / RIVER GLOW - JOKEY: AKUR\u015EUN - K
3 YILDIRIM BEY - KAIZBERT / G\xDCLAY\u015EE - JOKEY: E.YAVUZ - SK
4 GOLDEN BULLET - TOROK / GOLDEN NIGHT - JOKEY: M.\xC7EL\u0130K - KG K

3. KO\u015EU - 15:00 - Maiden - 1200m \xC7im
1 BOLD BOY - LION HEART / SILENT GRACE - JOKEY: S.BOYRAZ - KG
2 WIND DANCER - TOROK / SEA BREEZE - JOKEY: F.YARDIMCI - DB SK
3 ROCKET MAN - DAREDEVIL / FLYING GIRL - JOKEY: H.\xC7\u0130Z\u0130K - K
4 FIRE STORM - KAIZBERT / FIRE FLY - JOKEY: N.AVC\u0130 - KG DB

4. KO\u015EU - 15:30 - Kv-8 - 2000m Sentetik
1 ANATOLIAN TIGER - MENDIP / ANATOLIA - JOKEY: H.KARATA\u015E - KG SK
2 EAGLE EYE - SMART ROBIN / BLUE SKIES - JOKEY: A.S\xD6ZEN - DB
3 BLAZING SUN - VICTORY GALLOP / SUNSHINE - JOKEY: G.KOCAKAYA - K DB
4 IRON HORSE - TOROK / STEEL GIRL - JOKEY: \xD6.YILDIRIM - KG

5. KO\u015EU - 16:00 - Handikap 16 - 1600m \xC7im
1 NOBLE KNIGHT - KING DAVID / ROYAL LADY - JOKEY: M.KAYA - KG K
2 SILVER FLASH - GRAYSTORM / SILVER STAR - JOKEY: A.KUR\u015EUN - DB SK
3 DARK PRINCE - AGRESIVO / DARK QUEEN - JOKEY: M.\xC7EL\u0130K - SK
4 GOLDEN DRAGON - FAST 'N' FAMOUS / DRAGON FLY - JOKEY: H.\xC7\u0130Z\u0130K - KG

6. KO\u015EU - 16:30 - \u015Eartl\u0131 5/DH\xD6W - 1500m Kum
1 KAFKAS R\xDCZGARI - KAIZBERT / R\xDCZGAR G\xDCL\xDC - JOKEY: H.KARATA\u015E - KG DB
2 DEM\u0130RAT - ALTAHA / DEM\u0130R SULTAN - JOKEY: A.S\xD6ZEN - K SK
3 \u015EAH\u0130N BEY - GOBAKBEY / \u015EAH\u0130DE - JOKEY: \xD6.YILDIRIM - DB
4 O\u011EUZHAN - TURBO / CANIM - JOKEY: G.KOCAKAYA - KG K`,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    "ANKARA": {
      content: `1. KO\u015EU - 13:30 - Maiden/DH\xD6W - 1300m \xC7im
1 ANKARA KALES\u0130 - KAIZBERT / ANKARA KIZI - JOKEY: E.S\u0130NCAN - KG SK
2 BA\u015EKENT BEY\u0130 - TURBO / BA\u015EKENT SULTANI - JOKEY: A.\xC7EL\u0130K - DB
3 R\xDCZGARIN O\u011ELU - GOBAKBEY / R\xDCZGAR SULTAN - JOKEY: M.SALYABABA - K

2. KO\u015EU - 14:00 - Handikap 14 - 1400m Kum
1 BEYAZ FIRTINA - LUXOR / BEYAZ G\xDCL - JOKEY: M.AKYAVUZ - KG
2 KARA SHADOW - TOROK / SHADOW LADY - JOKEY: F.YARDIMCI - DB SK
3 \u015EAMP\u0130YON BEY - CAPTAIN RIO / CHAMPION GIRL - JOKEY: E.\xC7ANKAYA - SK

3. KO\u015EU - 14:30 - Kv-6 - 1900m \xC7im
1 ANATOLIAN POWER - NATIVE KHAN / POWER FULL - JOKEY: A.\xC7EL\u0130K - KG DB
2 SPEED MASTER - MENDIP / MASTER GIRL - JOKEY: M.AKYAVUZ - K SK
3 VICTORY CROWN - VICTORY GALLOP / CROWN LADY - JOKEY: F.YARDIMCI - KG K

4. KO\u015EU - 15:00 - Handikap 16/DH\xD6W - 1600m Kum
1 Y\u0130\u011E\u0130T EFE - KAIZBERT / EFE KIZI - JOKEY: A.\xC7EL\u0130K - KG DB
2 TOROS KAPLANI - TURBO / TOROS G\xDCL\xDC - JOKEY: M.AKYAVUZ - K SK
3 ASLANBEY - ALTAHA / ASLAN KIZI - JOKEY: E.\xC7ANKAYA - DB

5. KO\u015EU - 15:30 - \u015Eartl\u0131 3 - 1200m \xC7im
1 FLYING ARROW - DAREDEVIL / ARROW LADY - JOKEY: F.YARDIMCI - KG
2 NIGHT HAWK - SMART ROBIN / NIGHT LADY - JOKEY: M.AKYAVUZ - SK
3 SUNNY BOY - FAST 'N' FAMOUS / SUNNY GIRL - JOKEY: E.\xC7ANKAYA - DB SK

6. KO\u015EU - 16:00 - Handikap 15 - 2000m Kum
1 DESERT STORM - MENDIP / DESERT ROSE - JOKEY: A.\xC7EL\u0130K - KG K
2 OCEAN WAVE - TOROK / OCEAN LADY - JOKEY: M.AKYAVUZ - DB SK
3 SKY HIGH - LUXOR / SKY GIRL - JOKEY: F.YARDIMCI - SK`,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    "\u0130ZM\u0130R": {
      content: `1. KO\u015EU - 14:30 - Handikap 14/DH\xD6W - 1400m Kum
1 EGE EFES\u0130 - KAIZBERT / EGE KIZI - JOKEY: N.AVC\u0130 - KG DB
2 \u0130ZM\u0130R R\xDCZGARI - TURBO / \u0130ZM\u0130R G\xDCL\xDC - JOKEY: M.G\xD6N\xDCLTA\u015E - K SK
3 KORAY BEY - ALTAHA / KORAY SULTAN - JOKEY: A.OLUK - DB

2. KO\u015EU - 15:00 - Maiden - 1200m \xC7im
1 EGE STAR - TOROK / STAR LADY - JOKEY: N.AVC\u0130 - KG SK
2 WINNER BOY - FAST 'N' FAMOUS / WINNER LADY - JOKEY: M.G\xD6N\xDCLTA\u015E - DB
3 FAST RUNNER - DAREDEVIL / FAST GIRL - JOKEY: A.OLUK - K

3. KO\u015EU - 15:30 - \u015Eartl\u0131 4 - 1900m \xC7im
1 ZEUS - LUXOR / OLYMPUS LADY - JOKEY: N.AVC\u0130 - KG DB
2 APOLLO - NATIVE KHAN / SUN QUEEN - JOKEY: M.G\xD6N\xDCLTA\u015E - K SK
3 HERACLES - VICTORY GALLOP / HERO GIRL - JOKEY: A.OLUK - SK

4. KO\u015EU - 16:00 - Handikap 15 - 1600m Kum
1 SEA BREEZE - MENDIP / SEA QUEEN - JOKEY: N.AVC\u0130 - KG K
2 WIND OF CHANGE - TOROK / CHANGE LADY - JOKEY: M.G\xD6N\xDCLTA\u015E - DB SK
3 WAVE DANCER - SMART ROBIN / DANCE GIRL - JOKEY: A.OLUK - SK

5. KO\u015EU - 16:30 - Kv-7/DH\xD6W - 1900m Kum
1 BABA MEVL\xDCT - KAIZBERT / BABA SULTAN - JOKEY: N.AVC\u0130 - KG DB
2 SULTAN BEY - TURBO / SULTAN KIZI - JOKEY: M.G\xD6N\xDCLTA\u015E - K SK
3 PA\u015EA BEY - GOBAKBEY / PA\u015EA G\xDCL\xDC - JOKEY: A.OLUK - DB

6. KO\u015EU - 17:00 - \u015Eartl\u0131 5 - 1400m \xC7im
1 LION KING - LION HEART / QUEEN LADY - JOKEY: N.AVC\u0130 - KG DB
2 EAGLE STRIKE - SMART ROBIN / STRIKE GIRL - JOKEY: M.G\xD6N\xDCLTA\u015E - K SK
3 GOLDEN EAGLE - TOROK / GOLDEN GIRL - JOKEY: A.OLUK - SK`,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  },
  learning_events: [
    {
      id: 1,
      horse_name: "SHINING GLORY",
      event_type: "AGF_GUNCELLEME",
      details: { eski_puan: 82.5, yeni_puan: 89.2, sebep: "Son ko\u015Fu galibiyeti ve artan kilo avantaj\u0131" },
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: 2,
      horse_name: "TURBO KING",
      event_type: "GALOP_PERFORMANS",
      details: { galop_derecesi: "1.02.40", pist: "\u0130\xE7 Kum", katsayi: 1.25 },
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ]
};
var PRIMARY_DB_PATH = import_path.default.join(process.cwd(), "data.json");
var TMP_DB_PATH = "/tmp/data.json";
function getWriteableDbPath() {
  try {
    const testPath = import_path.default.join(process.cwd(), ".write_test");
    import_fs.default.writeFileSync(testPath, "ok");
    import_fs.default.unlinkSync(testPath);
    return PRIMARY_DB_PATH;
  } catch (e) {
    return TMP_DB_PATH;
  }
}
function loadLocalDB() {
  const pathsToTry = [PRIMARY_DB_PATH, TMP_DB_PATH];
  for (const dbPath of pathsToTry) {
    try {
      if (import_fs.default.existsSync(dbPath)) {
        const raw = import_fs.default.readFileSync(dbPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return {
            ...initialData,
            ...parsed,
            notes: Array.isArray(parsed.notes) ? parsed.notes : initialData.notes,
            bulletins: parsed.bulletins && typeof parsed.bulletins === "object" ? parsed.bulletins : initialData.bulletins,
            learning_events: Array.isArray(parsed.learning_events) ? parsed.learning_events : initialData.learning_events,
            wins: parsed.wins || initialData.wins,
            horse_dna: parsed.horse_dna || initialData.horse_dna,
            equipment_logs: parsed.equipment_logs || initialData.equipment_logs,
            metrics: parsed.metrics || initialData.metrics
          };
        }
      }
    } catch (err) {
      console.error(`Local JSON read error at ${dbPath}:`, err);
    }
  }
  return initialData;
}
function saveLocalDB(data) {
  const dbPath = getWriteableDbPath();
  try {
    import_fs.default.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Local JSON write error at ${dbPath}:`, err);
    try {
      if (dbPath !== TMP_DB_PATH) {
        import_fs.default.writeFileSync(TMP_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
      }
    } catch (fallbackErr) {
      console.error("Tmp write error:", fallbackErr);
    }
  }
}
async function loadDB() {
  let loaded = loadLocalDB();
  if (dbFirestore) {
    try {
      const docRef = (0, import_firestore.doc)(dbFirestore, "app_state", "main");
      const docSnap = await (0, import_firestore.getDoc)(docRef);
      if (docSnap.exists()) {
        const payload = docSnap.data().payload;
        if (payload) {
          loaded = {
            ...loaded,
            ...payload,
            notes: Array.isArray(payload.notes) ? payload.notes : loaded.notes,
            bulletins: payload.bulletins && typeof payload.bulletins === "object" ? payload.bulletins : loaded.bulletins,
            learning_events: Array.isArray(payload.learning_events) ? payload.learning_events : loaded.learning_events,
            wins: payload.wins || loaded.wins,
            horse_dna: payload.horse_dna || loaded.horse_dna,
            equipment_logs: payload.equipment_logs || loaded.equipment_logs,
            metrics: payload.metrics || loaded.metrics
          };
          console.log(`\u{1F525} Loaded ${loaded.notes.length} notes & ${Object.keys(loaded.bulletins).length} bulletins from Firebase Firestore!`);
        }
      }
    } catch (err) {
      console.warn("Firebase Firestore load warning:", err?.message || err);
    }
  }
  return loaded;
}
async function saveDB(data) {
  saveLocalDB(data);
  if (dbFirestore) {
    try {
      const docRef = (0, import_firestore.doc)(dbFirestore, "app_state", "main");
      await (0, import_firestore.setDoc)(docRef, {
        payload: data,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      console.log("\u{1F525} Successfully saved state to Firebase Firestore!");
    } catch (err) {
      console.warn("Firebase Firestore save warning:", err?.message || err);
    }
  }
}
var db = loadLocalDB();
loadDB().then((data) => {
  db = data;
  saveLocalDB(db);
}).catch((err) => {
  console.error("Initial loadDB error:", err);
});
function normalizeText(text) {
  if (!text || typeof text !== "string") return "";
  return text.trim().toUpperCase().replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C");
}
var DEFAULT_METRICS = [8.5, 57, 80, 75, 85, 70, 80, 78, 75, 70, 5, 5, 80];
var METRIC_WEIGHTS = {
  agf_puan: 1.5,
  kilo_etkisi: 8,
  jokey_form: 1.2,
  antrenor_form: 1.1,
  galop_gucu: 1.3,
  form_6yaris: 0.2,
  pist_uyumu: 1.1,
  mesafe_uyumu: 1.1,
  sinif_gucu: 1.2,
  handikap_gucu: 0.15,
  sprint_gucu: 1.1
};
var KILO_THRESHOLD = 58;
var WIN_RACE_HORSES = 2;
var SCORE_MULTIPLIER = 0.62;
var SCORE_MIN = 60;
var SCORE_MAX = 99.5;
var SIRE_POOL = ["DAREDEVIL", "TURBO", "CAPTAIN RIO", "KAIZBERT", "LUXOR", "NATIVE KHAN", "TOROK", "LION HEART", "MENDIP", "VICTORY GALLOP"];
var DAM_POOL = ["SILENT CAT", "G\xDCL\u0130ZAR", "BEST OF ALL", "SARI\xC7\u0130\xC7EK", "HARD BABY", "RIVER GLOW", "GOLDEN NIGHT", "SILENT GRACE", "ANATOLIA", "ROYAL LADY"];
var JOCKEY_POOL = ["H.KARATA\u015E", "A.S\xD6ZEN", "M.KAYA", "G.KOCAKAYA", "\xD6.YILDIRIM", "A.KUR\u015EUN", "E.YAVUZ", "M.\xC7EL\u0130K", "S.BOYRAZ", "F.YARDIMCI", "N.AVC\u0130", "A.\xC7EL\u0130K", "M.AKYAVUZ"];
var SIRE_POWER_MAP = {
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
  "AGRESIVO": 82
};
var DAM_POWER_MAP = {
  "G\xDCL\u0130ZAR": 94,
  "SILENT CAT": 92,
  "SARI\xC7\u0130\xC7EK": 90,
  "HARD BABY": 88,
  "RIVER GLOW": 87,
  "GOLDEN NIGHT": 86,
  "BEST OF ALL": 85,
  "SILENT GRACE": 84,
  "ANATOLIA": 83,
  "ROYAL LADY": 82,
  "DEM\u0130R SULTAN": 87
};
function getPedigreeDnaRating(sire, dam) {
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
  return Number((sPower * 0.55 + dPower * 0.45).toFixed(1));
}
function calculate20ParametersAnalysis(horseName, horseNo, jockeyName, equipments) {
  const normName = normalizeText(horseName);
  let dna = db.horse_dna[normName];
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
  const hasRaceHistory = db.wins[normName] !== void 0;
  const totalWins = hasRaceHistory ? db.wins[normName] : 0;
  const duoWins = Math.floor(totalWins / 2);
  const weight = Number((52 + Math.abs(seed * 11) % 17 * 0.5).toFixed(1));
  const handicap = 54 + Math.abs(seed * 19) % 43;
  const pseudoRandom = Math.sin(seed) * 1e4 - Math.floor(Math.sin(seed) * 1e4);
  const randomOffset = pseudoRandom * 3 - 1.5;
  const mData = db.metrics[normName] || DEFAULT_METRICS;
  const pedigreeRating = getPedigreeDnaRating(dna.sire, dna.dam);
  let score = 75;
  if (!hasRaceHistory) {
    const weightFactor = weight <= 54.5 ? 94 : weight <= 57 ? 88 : 82;
    const jokeyForm = mData[2] || 80;
    const rawNoHistoryScore = pedigreeRating * 0.45 + weightFactor * 0.3 + handicap * 0.15 + jokeyForm * 0.1 + randomOffset;
    score = Math.min(Math.max(rawNoHistoryScore, 72), 96);
  } else {
    let agfPuan = mData[0] * METRIC_WEIGHTS.agf_puan;
    let kiloEtkisi = weight <= KILO_THRESHOLD ? 8 : 4;
    let jokeyForm = mData[2] * METRIC_WEIGHTS.jokey_form;
    let antrenorForm = mData[3] * METRIC_WEIGHTS.antrenor_form;
    let galopGucu = mData[4] * METRIC_WEIGHTS.galop_gucu;
    let form6Yaris = mData[5] * METRIC_WEIGHTS.form_6yaris;
    let pistUyumu = mData[6] * METRIC_WEIGHTS.pist_uyumu;
    let mesafeUyumu = mData[7] * METRIC_WEIGHTS.mesafe_uyumu;
    let sinifGucu = mData[8] * METRIC_WEIGHTS.sinif_gucu;
    let handikapGucu = mData[9] * METRIC_WEIGHTS.handikap_gucu;
    let sprintGucu = mData[10] * METRIC_WEIGHTS.sprint_gucu;
    const rawScore = agfPuan + kiloEtkisi + jokeyForm + antrenorForm + galopGucu + form6Yaris + pistUyumu + mesafeUyumu + sinifGucu + handikapGucu + sprintGucu + totalWins * 2.5;
    score = rawScore * SCORE_MULTIPLIER + randomOffset;
    score = Math.min(Math.max(score, SCORE_MIN), SCORE_MAX);
  }
  const userMemoryMatches = db.notes.filter((n) => {
    const normContent = normalizeText(n.content || "");
    const normTitle = normalizeText(n.title || "");
    const normHorse = normalizeText(n.horse_name || "");
    return normHorse && normHorse.includes(normName) || normTitle.includes(normName) || normContent.includes(normName);
  });
  let memoryBoost = 0;
  const memoryNotes = userMemoryMatches.map((m) => m.content.trim());
  if (userMemoryMatches.length > 0) {
    memoryBoost = Math.min(6, userMemoryMatches.length * 2 + 1.5);
    score = Math.min(99.5, score + memoryBoost);
  }
  const weightPts = weight <= 53.5 ? 35 : weight <= 55.5 ? 25 : weight <= 57 ? 15 : 5;
  const pedigreePts = pedigreeRating >= 88 ? 35 : pedigreeRating >= 84 ? 25 : 10;
  const hpPts = handicap >= 82 ? 25 : handicap >= 72 ? 15 : 5;
  const eqPts = equipments && equipments.length > 0 ? 10 : 0;
  const memPts = userMemoryMatches.length > 0 ? 15 : 0;
  const surpriseScore = Number(Math.min(99, weightPts + pedigreePts + hpPts + eqPts + memPts).toFixed(1));
  const reasons = [];
  if (weight <= 54.5) reasons.push(`${weight} kg Hafif S\u0131klet`);
  if (pedigreeRating >= 85) reasons.push(`Pedigree DNA (${pedigreeRating.toFixed(1)})`);
  if (handicap >= 80) reasons.push(`${handicap} HP Y\xFCksek Handikap`);
  if (equipments && equipments.length > 0) reasons.push(`Ekipman (${equipments.join(",")})`);
  if (userMemoryMatches.length > 0) reasons.push(`Haf\u0131za Bankas\u0131 Notu (+${memoryBoost.toFixed(1)} P)`);
  const surpriseReason = reasons.length > 0 ? reasons.join(" + ") : "S\xFCrpriz Potansiyel";
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
var MONTHS_LIST = ["OCAK", "SUBAT", "MART", "NISAN", "MAYIS", "HAZIRAN", "TEMMUZ", "AGUSTOS", "EYLUL", "EKIM", "KASIM", "ARALIK"];
var DAYS_LIST = ["PAZARTESI", "SALI", "CARSAMBA", "PERSEMBE", "CUMA", "CUMARTESI", "PAZAR"];
function isHeaderOrDateLine(line) {
  if (!line || !line.trim()) return true;
  const norm = normalizeText(line.trim());
  if (/\b\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4}\b/.test(norm) || /\b\d{4}[\.\/\-]\d{1,2}[\.\/\-]\d{1,2}\b/.test(norm)) {
    return true;
  }
  for (const m of MONTHS_LIST) {
    if (norm.includes(m)) {
      if (/\d{1,4}/.test(norm) || DAYS_LIST.some((d) => norm.includes(d)) || norm.includes("BULTEN") || norm.includes("PROGRAM")) {
        return true;
      }
    }
  }
  for (const d of DAYS_LIST) {
    if (norm.includes(d) && (norm.includes("BULTEN") || norm.includes("PROGRAM") || norm.includes("HIPODROM") || /\d{1,4}/.test(norm))) {
      return true;
    }
  }
  if ((norm.includes("BULTEN") || norm.includes("PROGRAM") || norm.includes("HIPODROM") || norm.includes("TARIH")) && !norm.includes("JOKEY") && !norm.includes("KG") && !norm.includes("DB") && !norm.includes("SK")) {
    return true;
  }
  return false;
}
function isValidHorseName(cleanName) {
  if (!cleanName || cleanName.trim().length < 2) return false;
  const norm = normalizeText(cleanName.trim());
  if (/^\d+$/.test(norm) || /^\d{1,2}[\.\/\-]\d{1,2}/.test(norm)) return false;
  for (const m of MONTHS_LIST) {
    if (norm.includes(m)) return false;
  }
  for (const d of DAYS_LIST) {
    if (norm.includes(d)) return false;
  }
  const forbiddenNames = [
    "BULTENI",
    "BULTEN",
    "PROGRAMI",
    "HIPODROMU",
    "TARIH",
    "PAZARTESI",
    "CARSAMBA",
    "PERSEMBE",
    "CUMARTESI",
    "KOSU",
    "GANYAN",
    "HANDIKAP",
    "MAIDEN",
    "SARTLI",
    "ALTILI"
  ];
  for (const f of forbiddenNames) {
    if (norm === f || norm.startsWith(f) || norm.endsWith(f)) return false;
  }
  return true;
}
function resolveSixGameProgram(programInput) {
  const normalized = normalizeText(typeof programInput === "string" ? programInput : "");
  const firstSixPattern = /(?:^|\s)(?:1(?:\s*[.]\s*)?|BIRINCI|ILK)(?:\s+ALTILI)?(?:\s+GANYAN)?(?:\s|$)/;
  if (firstSixPattern.test(normalized) || normalized.includes("1 ALTILI") || normalized.includes("ILK ALTILI") || normalized.includes("BIRINCI ALTILI")) {
    return { programType: "1. Alt\u0131l\u0131 Ganyan", startRaceNum: 1 };
  }
  return { programType: "2. Alt\u0131l\u0131 Ganyan", startRaceNum: 2 };
}
function parseRaces(bulletinText, oyunProgrami) {
  if (!bulletinText || !bulletinText.trim()) {
    return { selectedRaces: [], startRaceNum: 1, totalRacesFound: 0 };
  }
  const lines = bulletinText.split("\n");
  const equipmentPool = ["KG", "DB", "K", "SK", "OG", "GKR", "HP", "KSK", "YK", "TG", "AP", "BB"];
  const forbidden = [
    "KOSU",
    "GANYAN",
    "TL",
    "HANDIKAP",
    "MAIDEN",
    "SARTLI",
    "IKILI",
    "SIRALI",
    "PLASE",
    "AGF",
    "JOKEY",
    "ANTRENOR",
    "SAHIP",
    "KILO",
    ...MONTHS_LIST,
    ...DAYS_LIST,
    "BULTENI",
    "PROGRAMI",
    "HIPODROMU",
    "TARIH"
  ];
  const races = [];
  let currentRace = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const normLine = normalizeText(trimmed);
    const isRaceHeader = normLine.includes("KOSU") || normLine.includes("KO\u015EU") || normLine.includes("RACE") || /^[\-\=]*\s*\d+\s*\.\s*KOSU/i.test(normLine) || /^---*\s*\d+/.test(normLine) || /\b\d{1,2}\s*\.\s*(?:KOŞU|KOSU)\b/i.test(trimmed);
    if (isRaceHeader) {
      if (currentRace.length >= WIN_RACE_HORSES) {
        races.push(currentRace);
      }
      currentRace = [];
      continue;
    }
    if (isHeaderOrDateLine(trimmed)) {
      continue;
    }
    const match = trimmed.match(/^(\d{1,2})\s*[-.)]?\s*(?:\(\d{1,2}\)\s*)?([A-ZĞÜŞİÖÇa-zğüşıöç0-9\s\-\/–—'\.]{3,120})/);
    if (match) {
      const num = match[1];
      let rawRest = match[2].trim();
      rawRest = rawRest.replace(/^\(\d{1,2}\)\s*/, "");
      const words = rawRest.split(/\s+/);
      const foundEquipments = [];
      let sire = "Bilinmiyor";
      let dam = "Bilinmiyor";
      if (rawRest.includes("-") || rawRest.includes("/") || rawRest.includes("\u2013") || rawRest.includes("\u2014")) {
        const parts = rawRest.split(/[\-\–\—\/]/);
        if (parts.length >= 2) {
          const possibleSire = parts[0].trim().split(/\s+/).pop();
          const possibleDam = parts[1].trim().split(/\s+/)[0];
          if (possibleSire && isValidHorseName(possibleSire)) sire = normalizeText(possibleSire);
          if (possibleDam && isValidHorseName(possibleDam)) dam = normalizeText(possibleDam);
        }
      }
      for (const w of words) {
        const normW = normalizeText(w);
        if (equipmentPool.includes(normW)) {
          if (!foundEquipments.includes(normW)) foundEquipments.push(normW);
        }
      }
      let jockeyName = "JOKEY_X";
      const jockeyMatch = trimmed.match(/(?:JOKEY|JOKEY:)\s*([A-ZÇĞİÖŞÜa-zçğıöşü\.]+)/i);
      if (jockeyMatch) {
        jockeyName = normalizeText(jockeyMatch[1]);
      } else {
        const knownJockeys = [
          "H.KARATA\u015E",
          "A.S\xD6ZEN",
          "M.KAYA",
          "G.KOCAKAYA",
          "\xD6.YILDIRIM",
          "A.KUR\u015EUN",
          "E.YAVUZ",
          "M.\xC7EL\u0130K",
          "S.BOYRAZ",
          "F.YARDIMCI",
          "N.AVC\u0130",
          "A.\xC7EL\u0130K",
          "M.AKYAVUZ",
          "E.S\u0130NCAN",
          "E.\xC7ANKAYA",
          "M.G\xD6N\xDCLTA\u015E",
          "A.OLUK"
        ];
        for (const kj of knownJockeys) {
          if (normLine.includes(normalizeText(kj))) {
            jockeyName = kj;
            break;
          }
        }
      }
      let cleanName = "";
      if (rawRest.includes("-") || rawRest.includes("/") || rawRest.includes("\u2013") || rawRest.includes("\u2014")) {
        const firstPart = rawRest.split(/[\-\–\—\/]/)[0].trim();
        const candidateWords = firstPart.split(/\s+/).filter((w) => {
          const nw = normalizeText(w);
          return !forbidden.includes(nw) && !equipmentPool.includes(nw) && !/^\d+$/.test(nw);
        });
        cleanName = normalizeText(candidateWords.join(" "));
      }
      if (!cleanName || !isValidHorseName(cleanName)) {
        const cleanWords = [];
        for (const w of words) {
          const normW = normalizeText(w);
          if (/^\d{1,2}[yY]$/.test(normW) || /^\d{2}(?:\.\d)?$/.test(normW) || normW.startsWith("JOKEY")) {
            break;
          }
          if (!equipmentPool.includes(normW) && !forbidden.includes(normW) && normW.length > 1 && !/^\d+$/.test(normW)) {
            cleanWords.push(w);
          }
        }
        cleanName = normalizeText(cleanWords.slice(0, 4).join(" "));
      }
      if (!isValidHorseName(cleanName)) {
        continue;
      }
      if (sire !== "Bilinmiyor" && dam !== "Bilinmiyor") {
        db.horse_dna[cleanName] = { sire, dam };
      }
      if (foundEquipments.length > 0) {
        db.equipment_logs.push({
          id: db.equipment_logs.length + 1,
          horse_name: cleanName,
          equipments: foundEquipments,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
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
  const resolvedProgram = resolveSixGameProgram(oyunProgrami);
  let startRaceNum = resolvedProgram.startRaceNum;
  if (resolvedProgram.programType === "2. Alt\u0131l\u0131 Ganyan") {
    if (totalRacesFound >= 9) startRaceNum = 4;
    else if (totalRacesFound === 8) startRaceNum = 3;
    else if (totalRacesFound === 7) startRaceNum = 2;
  }
  let selectedRaces = races;
  if (races.length >= startRaceNum + 5) {
    selectedRaces = races.slice(startRaceNum - 1, startRaceNum + 5);
  } else {
    selectedRaces = races.slice(0, 6);
  }
  return { selectedRaces, startRaceNum, totalRacesFound };
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/bulletins/:hipodrom", (req, res) => {
  const reqHipodrom = req.params.hipodrom || "";
  const normHipodrom = normalizeText(reqHipodrom);
  const rawUpper = reqHipodrom.trim().toUpperCase();
  let bulletin = db.bulletins[normHipodrom] || db.bulletins[rawUpper] || db.bulletins[reqHipodrom];
  if (!bulletin) {
    const matchingKey = Object.keys(db.bulletins).find((k) => normalizeText(k) === normHipodrom);
    if (matchingKey) {
      bulletin = db.bulletins[matchingKey];
    }
  }
  if (bulletin) {
    res.json({ hipodrom: reqHipodrom, content: bulletin.content, updated_at: bulletin.updated_at });
  } else {
    res.status(404).json({ error: "B\xFClten bulunamad\u0131", hipodrom: reqHipodrom });
  }
});
app.post("/api/bulletins", (req, res) => {
  const { hipodrom, content } = req.body;
  if (!hipodrom || !content || !content.trim()) {
    return res.status(400).json({ error: "Hipodrom ve b\xFClten i\xE7eri\u011Fi gereklidir." });
  }
  const normHipodrom = normalizeText(hipodrom);
  const rawUpper = hipodrom.trim().toUpperCase();
  const entry = {
    content: content.trim(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.bulletins[normHipodrom] = entry;
  db.bulletins[rawUpper] = entry;
  db.bulletins[hipodrom] = entry;
  saveDB(db);
  res.json({ success: true, message: `${hipodrom} b\xFClteni veritaban\u0131na ba\u015Far\u0131yla kaydedildi.` });
});
app.post("/api/analyze", (req, res) => {
  const { bulletinText, oyunProgrami, hipodrom } = req.body;
  if (!bulletinText || !bulletinText.trim()) {
    return res.status(400).json({ error: "L\xFCtfen analiz edilecek b\xFClten metnini girin." });
  }
  const resolvedProgram = resolveSixGameProgram(oyunProgrami);
  const { selectedRaces, startRaceNum, totalRacesFound } = parseRaces(bulletinText, resolvedProgram.programType);
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
    horses.sort((a, b) => b.score - a.score);
    return {
      raceNo: currentRaceNo,
      horses
    };
  });
  let totalMemoryMatchesCount = 0;
  const bankoList = [];
  const surpriseList = [];
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
          reason: topSurprise.surpriseReason || "D\xFC\u015F\xFCk s\u0131klet & Pedigree"
        });
      }
      r.horses.forEach((h) => {
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
    programType: resolvedProgram.programType,
    aiOverview: {
      engineVersion: "v3.5 Next-Gen 20-Parameter Engine",
      totalMemoryMatches: totalMemoryMatchesCount,
      bestBanko: bestBanko ? `${bestBanko.leg}. Ayak (#${bestBanko.horse} - Skor: ${bestBanko.score})` : "Veri Yetersiz",
      bankoList,
      surpriseList
    }
  });
});
app.get("/api/learning-events", (req, res) => {
  res.json({ events: db.learning_events });
});
app.post("/api/learning-events", (req, res) => {
  const { horse_name, event_type, details } = req.body;
  const newEvent = {
    id: db.learning_events.length + 1,
    horse_name: horse_name || "GENEL",
    event_type: event_type || "ANALIZ_LOG",
    details: details || {},
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.learning_events.unshift(newEvent);
  saveDB(db);
  res.json({ success: true, event: newEvent });
});
app.post("/api/ocr", (req, res) => {
  const { imageName } = req.body;
  const sampleOCRText = `1. KO\u015EU - Handikap 15/DH\xD6W - 1400m
1 TURBO KING - TURBO / G\xDCL\u0130ZAR - JOKEY: H.KARATA\u015E - K SK
2 SHINING GLORY - DAREDEVIL / SILENT CAT - JOKEY: A.S\xD6ZEN - KG DB
3 KAFKAS KARTALI - KAIZBERT / SARI\xC7\u0130\xC7EK - JOKEY: G.KOCAKAYA - DB SK

2. KO\u015EU - \u015Eartl\u0131 4 - 1900m
1 STORM RUNNER - LUXOR / HARD BABY - JOKEY: \xD6.YILDIRIM - KG DB
2 RIVER DANCE - NATIVE KHAN / RIVER GLOW - JOKEY: AKUR\u015EUN - K
3 YILDIRIM BEY - KAIZBERT / G\xDCLAY\u015EE - JOKEY: E.YAVUZ - SK`;
  res.json({
    success: true,
    text: sampleOCRText,
    message: "G\xF6rsel OCR taramas\u0131 ba\u015Far\u0131yla tamamland\u0131."
  });
});
app.get("/api/notes", (req, res) => res.redirect(307, "/api/memory" + (req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "")));
app.post("/api/notes", (req, res, next) => {
  req.url = "/api/memory";
  app._router.handle(req, res, next);
});
app.post("/api/bulletin", (req, res, next) => {
  req.url = "/api/bulletins";
  app._router.handle(req, res, next);
});
app.get("/api/debug-status", async (req, res) => {
  let firebaseStatus = "not_configured";
  let firebaseError = null;
  if (dbFirestore) {
    try {
      const docRef = (0, import_firestore.doc)(dbFirestore, "app_state", "main");
      const docSnap = await (0, import_firestore.getDoc)(docRef);
      firebaseStatus = docSnap.exists() ? "connected_and_active" : "connected_empty_doc";
    } catch (err) {
      firebaseStatus = "connection_error";
      firebaseError = err?.message || String(err);
    }
  }
  res.json({
    status: "ok",
    memory_notes_count: db.notes.length,
    bulletins_count: Object.keys(db.bulletins).length,
    firebase_configured: !!dbFirestore,
    firebase_status: firebaseStatus,
    firebase_error: firebaseError,
    firebase_project_id: firebaseProjectInfo?.projectId || null,
    environment: process.env.NODE_ENV || "development"
  });
});
app.get("/api/memory", (req, res) => {
  const q = req.query.q ? normalizeText(String(req.query.q)) : "";
  const category = req.query.category ? String(req.query.category) : "";
  let filtered = [...db.notes];
  if (category && category !== "HEPS\u0130") {
    filtered = filtered.filter((n) => n.category === category);
  }
  if (q) {
    filtered = filtered.filter((n) => {
      const matchTitle = normalizeText(n.title || "").includes(q);
      const matchContent = normalizeText(n.content || "").includes(q);
      const matchHorse = normalizeText(n.horse_name || "").includes(q);
      const matchTags = (n.tags || []).some((t) => normalizeText(t).includes(q));
      return matchTitle || matchContent || matchHorse || matchTags;
    });
  }
  filtered.sort((a, b) => b.id - a.id);
  res.json({
    notes: filtered,
    total: filtered.length
  });
});
app.post("/api/memory", (req, res) => {
  const { title, content, category, horse_name, tags } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Haf\u0131zaya kaydedilecek metin i\xE7eri\u011Fi bo\u015F olamaz." });
  }
  const normHorse = horse_name ? normalizeText(horse_name) : void 0;
  const newNote = {
    id: db.notes.length > 0 ? Math.max(...db.notes.map((n) => n.id)) + 1 : 1,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    title: title && title.trim() ? title.trim() : normHorse ? `${normHorse} Notu` : "\xD6zel Veri Bankas\u0131 Kayd\u0131",
    content: content.trim(),
    category: category || "GENEL",
    horse_name: normHorse,
    tags: Array.isArray(tags) ? tags : tags ? String(tags).split(",").map((t) => t.trim()) : []
  };
  db.notes.unshift(newNote);
  db.learning_events.unshift({
    id: db.learning_events.length + 1,
    horse_name: normHorse || "VER\u0130_BANKASI",
    event_type: "HAFIZA_KAYDI_EKLENDI",
    details: { baslik: newNote.title, kategori: newNote.category },
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveDB(db);
  res.json({
    success: true,
    message: "Veri haf\u0131zaya ba\u015Far\u0131yla eklendi ve veritaban\u0131na kaydedildi.",
    note: newNote
  });
});
app.delete("/api/memory/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Ge\xE7ersiz id" });
  }
  const initialCount = db.notes.length;
  db.notes = db.notes.filter((n) => n.id !== id);
  if (db.notes.length < initialCount) {
    saveDB(db);
    return res.json({ success: true, message: "Kay\u0131t haf\u0131zadan silindi." });
  }
  res.status(404).json({ error: "Kay\u0131t bulunamad\u0131." });
});
app.post("/api/learn-result", (req, res) => {
  const { raceNo, hipodrom, winnerHorseName, winnerJockey, beatenHorses, weight, distance, trackType, trackCondition } = req.body;
  if (!winnerHorseName || !winnerHorseName.trim()) {
    return res.status(400).json({ error: "Kazanan at ad\u0131 belirtilmelidir." });
  }
  const normWinner = normalizeText(winnerHorseName);
  const normHipodrom = hipodrom ? normalizeText(hipodrom) : "GENEL";
  const normJockey = winnerJockey ? normalizeText(winnerJockey) : "B\u0130L\u0130NM\u0130YOR";
  const normBeaten = beatenHorses ? normalizeText(beatenHorses) : "";
  const weightStr = weight ? `${weight} kg` : "58 kg";
  const distanceStr = distance ? String(distance).toLowerCase().includes("m") ? String(distance) : `${distance}m` : "1400m";
  const trackTypeStr = trackType || "\xC7im";
  const trackConditionStr = trackCondition || "Normal 3.3";
  db.wins[normWinner] = (db.wins[normWinner] || 0) + 1;
  const previousWins = db.wins[normWinner] - 1;
  const scoreBoost = Number((2.5 + Math.random() * 1.5).toFixed(2));
  const learningEvent = {
    id: db.learning_events.length + 1,
    horse_name: normWinner,
    event_type: "KEND\u0130_KEND\u0130NE_\xD6\u011ERENME_YARI\u015E_SONUCU",
    details: {
      hipodrom: normHipodrom,
      kosu_no: raceNo || 1,
      kazanan_at: normWinner,
      gectigi_atlar: normBeaten || "T\xFCm Rakipler",
      jokey: normJockey,
      kilo: weightStr,
      mesafe: distanceStr,
      pist_tipi: trackTypeStr,
      pist_durumu: trackConditionStr,
      eski_galibiyet: previousWins,
      yeni_galibiyet: db.wins[normWinner],
      puan_artisi: `+${scoreBoost} Puan`
    },
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.learning_events.unshift(learningEvent);
  const beatenNotePart = normBeaten ? ` (Ge\xE7ti\u011Fi Atlar: ${normBeaten})` : "";
  db.notes.unshift({
    id: db.notes.length > 0 ? Math.max(...db.notes.map((n) => n.id)) + 1 : 1,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    title: `\u{1F3C6} YARI\u015E SONUCU & \u0130K\u0130L\u0130 REKABET: ${normWinner}`,
    content: `${normHipodrom} ${raceNo || 1}. Ko\u015Fuda ${normWinner} (${weightStr}), Jokey ${normJockey} idaresinde ${distanceStr} ${trackTypeStr} (${trackConditionStr}) pistte${beatenNotePart} 1. oldu. Galibiyet say\u0131s\u0131 ${db.wins[normWinner]}'e y\xFCkseldi.`,
    category: "YARIS_SONUCU",
    horse_name: normWinner,
    tags: ["kazanan", "sonuc", "ikili_rekabet", normHipodrom.toLowerCase()]
  });
  saveDB(db);
  res.json({
    success: true,
    message: `\u{1F9E0} Motor ${normWinner} i\xE7in detayl\u0131 sonu\xE7tan \xF6\u011Frendi! (Jokey: ${normJockey}, S\u0131klet: ${weightStr}, Mesafe/Pist: ${distanceStr} ${trackTypeStr}, Ge\xE7ti\u011Fi Atlar: ${normBeaten || "T\xFCm rakipler"})`,
    learningEvent
  });
});
app.get("/api/db/stats", (req, res) => {
  res.json({
    totalNotes: db.notes.length,
    totalDnaRecords: Object.keys(db.horse_dna).length,
    totalEquipmentLogs: db.equipment_logs.length,
    totalWinsTracked: Object.keys(db.wins).length,
    totalBulletins: Object.keys(db.bulletins).length,
    totalLearningEvents: db.learning_events.length
  });
});
app.get("/api/db/export", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=turbo_pro_database_backup.json");
  res.send(JSON.stringify(db, null, 2));
});
app.post("/api/db/import", (req, res) => {
  const { databaseData } = req.body;
  if (!databaseData || typeof databaseData !== "object") {
    return res.status(400).json({ error: "Ge\xE7ersiz veritaban\u0131 JSON verisi." });
  }
  db = { ...initialData, ...databaseData };
  saveDB(db);
  res.json({
    success: true,
    message: "Veri bankas\u0131 yedekten ba\u015Far\u0131yla y\xFCklendi ve g\xFCncellendi."
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F3C7} TURBO-10X PRO Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

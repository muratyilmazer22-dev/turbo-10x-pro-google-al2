export interface GallopRecord {
  id: number;
  horse_name: string;
  date: string;
  distance: string; // e.g. "1000m", "800m", "600m"
  time: string; // e.g. "1.02.40", "0.49.20"
  grade: string; // e.g. "Çok Rahat", "Rahat", "Çok Canlı"
  track: string; // e.g. "İç Kum", "Çim"
  score_boost: number;
}

export interface HandicapRecord {
  id: number;
  horse_name: string;
  date: string;
  score: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  change: number;
}

export interface HistoricalRaceRecord {
  id: number;
  date: string;
  hipodrom: string;
  race_no: number;
  horse_name: string;
  position: number;
  jockey: string;
  weight: number;
  time: string;
  handicap_after: number;
}

export interface CityTrackDNAProfile {
  city: string;
  hipodromName: string;
  trackType: string;
  characteristics: string;
  winningSires: Array<{ name: string; powerBonus: number; winRate: string; specialty: string }>;
  winningDams: Array<{ name: string; powerBonus: number; winRate: string; specialty: string }>;
  staminaIndex: number;
  sprintThreshold: string;
  optimalWeightRange: string;
  dominantStrategy: string;
  dnaAffinityMultiplier: number;
}

export interface HipodromWinningValueProfile {
  hipodrom: string;
  city: string;
  totalWinnersAnalyzed: number;
  optimalWeightRange: string;
  averageWinningWeight: number;
  lightWeightWinRate: string; // e.g. "%68.5"
  heavyWeightWinRate: string; // e.g. "%18.2"
  dominantWinningCriteria: string[];
  topWinningSires: Array<{ name: string; wins: number; winRate: string; boost: number; specialty: string }>;
  topWinningDams: Array<{ name: string; wins: number; winRate: string; boost: number; specialty: string }>;
  topWinningJockeys: Array<{ name: string; wins: number; winRate: string }>;
  topWinningEquipments: Array<{ equipment: string; winCount: number; frequency: string }>;
  distanceTrends: Array<{ distance: string; avgTime: string; winningTactic: string }>;
  surpriseFrequency: string; // e.g. "%32 (Bomba/Sürpriz Oranı)"
  lastUpdated: string;
}

export interface HorseRaceEntry {
  no: string;
  horseName: string;
  jockeyName: string;
  trainerName?: string;
  statusNote?: string;
  equipments: string[];
  score: number;
  totalWins: number;
  duoWins: number;
  sire: string;
  dam: string;
  weight: number;
  handicap: number;
  hasRaceHistory?: boolean;
  pedigreeRating?: number;
  surpriseScore?: number;
  isSurprise?: boolean;
  surpriseReason?: string;
  hasMemoryMatch?: boolean;
  memoryNotes?: string[];
  confidenceScore?: number;
  latestGallop?: string;
  gallopScoreBoost?: number;
  handicapTrend?: string;
  historical12mWins?: number;
  isEquivalentContender?: boolean;
  equivalentNote?: string;
  hasWinnerHistoryBadge?: boolean;
  isScratched?: boolean;
  dnaMatchAffinity?: number;
  dnaMatchReason?: string;
  dnaBadges?: string[];
  cityDnaScoreBoost?: number;
  hipodromWinnerMatchScore?: number;
  hipodromMatchDetails?: string;
  matchedWinningValues?: string[];
  hipodromTrendBonus?: number;
  fieldRealityRate?: number;
  fieldRealityVerdict?: string;
  publicVoteRate?: number;
  accuracyProbability?: number;
  sentimentBadge?: string;
}

export interface Race {
  raceNo: number;
  title?: string;
  condition?: string;
  horses: HorseRaceEntry[];
}

export interface Bulletin {
  hipodrom: string;
  content: string;
  updated_at: string;
}

export interface LearningEvent {
  id: number;
  horse_name: string;
  event_type: string;
  details: any;
  created_at: string;
}

export interface MemoryEntry {
  id: number;
  timestamp: string;
  title: string;
  content: string;
  category: 'AT_NOTU' | 'JOKEY_SIRI' | 'GALOP_KAYDI' | 'PIST_BILGISI' | 'YARIS_SONUCU' | 'GENEL' | 'HAFIZA_NOTU' | 'CANLI_TJK_VERISI' | 'OTOMATIK_GUNLUK_CEKIM';
  horse_name?: string;
  tags?: string[];
}

export interface EquipmentLog {
  id: number;
  horse_name: string;
  equipments: string[];
  created_at: string;
}

export interface EquivalentAnalysisItem {
  leg: number;
  raceNo: number;
  horseA: { no: string; name: string; score: number; wins: number };
  horseB: { no: string; name: string; score: number; wins: number };
  winnerAdvantageHorse: string;
  reason: string;
}

export interface AnalysisResponse {
  races: Race[];
  startRaceNum: number;
  totalRacesFound: number;
  hipodrom: string;
  programType: string;
  equivalentAnalysis?: EquivalentAnalysisItem[];
  cityTrackDnaOverview?: {
    city: string;
    hipodromName: string;
    characteristics: string;
    topSires: string[];
    topDams: string[];
    staminaIndex: number;
    dominantStrategy: string;
    optimalWeightRange: string;
  };
  aiOverview?: {
    engineVersion: string;
    totalMemoryMatches: number;
    bestBanko: string;
    bankoList: Array<{ leg: number; raceNo: number; horse: string; score: number }>;
    surpriseList: Array<{ leg: number; raceNo: number; horse: string; score: number; reason: string }>;
  };
}

export interface DatabaseStats {
  totalNotes: number;
  totalDnaRecords: number;
  totalEquipmentLogs: number;
  totalWinsTracked: number;
  totalBulletins: number;
  totalLearningEvents: number;
  learningEventsCount?: number;
  totalHistoricalRaces?: number;
  totalGallopsTracked?: number;
  totalHandicapsTracked?: number;
  totalDetailedHorses?: number;
  lastTjkSyncDate?: string;
}

export interface TJKFetchResult {
  success: boolean;
  message: string;
  racesFetched: number;
  gallopsFetched: number;
  handicapsFetched: number;
  timestamp: string;
  integratedMemoryNotes: number;
}

export interface TJK12MonthWinnerRecord {
  id: number;
  date: string;
  hipodrom: string;
  raceNo: number;
  horseName: string;
  sire: string;
  dam: string;
  damSire?: string;
  jockey: string;
  weight: number;
  distance: string;
  trackType: string;
  trackCondition: string;
  finishTime: string;
  sprint800m?: string;
  handicap: number;
  score: number;
  winningReason: string;
  dnaAffinity: number;
  pedigreeType: 'İNGİLİZ' | 'ARAP';
}

export interface City12MonthDnaSummary {
  city: string;
  hipodromName: string;
  trackType: string;
  characteristics: string;
  total12MonthWinners: number;
  optimalWeight: string;
  avgWinningWeight: number;
  lightWeightWinPct: number;
  heavyWeightWinPct: number;
  topSires: Array<{ name: string; wins: number; winRate: string; bonus: number; specialty: string; pedigreeType: string }>;
  topDams: Array<{ name: string; wins: number; winRate: string; bonus: number; specialty: string }>;
  staminaIndex: number;
  sprintThreshold: string;
  distanceBenchmarks: Array<{ distance: string; avgTime: string; winningTactic: string }>;
  lastAutoSyncDate: string;
}

export interface AutoSyncStatus {
  enabled: boolean;
  intervalMinutes: number;
  lastSyncDate: string;
  nextSyncCountdownSeconds?: number;
  totalHistoricalRecords: number;
  totalCitiesCovered: number;
  liveFeedActive: boolean;
}

export interface UserPickRecord {
  id: number;
  date: string;
  hipodrom: string;
  race_no: number;
  horse_no: number;
  horse_name: string;
  sire?: string;
  dam?: string;
  jockey?: string;
  weight?: number;
  pick_type: 'BANKO' | 'SURPRIZ' | 'SIGORTA' | 'FAVORI' | 'KURGU_DAHILI';
  status: 'WON' | 'LOST' | 'PENDING';
  actual_position?: number;
  finish_time?: string;
  analysis_score?: number;
  ai_feedback?: string;
  user_note?: string;
  created_at: string;
}

export interface DetailedHorseProfile {
  horse_name: string;
  sire?: string;
  dam?: string;
  sire_sire?: string;
  dam_sire?: string;
  breed?: 'İNGİLİZ' | 'ARAP' | string;
  origin?: string;
  age?: string | number;
  gender?: string;
  color?: string;
  owner?: string;
  trainer?: string;
  breeder?: string;
  handicap_rating?: number;
  total_starts?: number;
  wins?: number;
  seconds?: number;
  thirds?: number;
  fourths?: number;
  total_earnings_tl?: number;
  win_rate_percent?: number;
  career_stats?: {
    total_races: number;
    wins: number;
    seconds: number;
    thirds: number;
    fourths: number;
    win_rate: number;
    total_earnings: number;
  };
  pedigree?: {
    sire: string;
    dam: string;
    sires_sire: string;
    dams_sire: string;
  };
  surface_stats?: {
    grass: { starts: number; wins: number; win_rate: number; best_time: string };
    dirt: { starts: number; wins: number; win_rate: number; best_time: string };
    synthetic: { starts: number; wins: number; win_rate: number; best_time: string };
  };
  track_performance?: {
    grass?: { runs: number; wins: number; best_time: string };
    dirt?: { runs: number; wins: number; best_time: string };
    synthetic?: { runs: number; wins: number; best_time: string };
  };
  distance_records?: Record<string, { best_time: string; best_hipodrom: string }>;
  weight_sensitivity?: { under_54kg_win_rate: number; over_58kg_win_rate: number };
  recent_races?: HistoricalRaceRecord[];
  historical_races?: Array<{
    date: string;
    hipodrom: string;
    surface: string;
    distance: number;
    weight: number;
    jockey: string;
    time?: string;
    finish_position: number;
    handicap_rating?: number;
    ganyan?: number;
  }>;
  recent_gallops?: GallopRecord[];
  gallops?: Array<{
    date: string;
    hipodrom: string;
    distance: number;
    time: string;
    surface: string;
    condition: string;
    points_boost: number;
  }>;
  handicap_score?: number;
  handicap_trend?: 'UP' | 'DOWN' | 'STABLE';
  last_updated?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
  image?: string;
  images?: string[];
  races?: Race[];
  parsedData?: any;
  autoSavedNote?: boolean;
  ticketPlan?: any;
  ticketPlan2?: any;
  isDualAltili?: boolean;
}

export interface TrackBiasCalibration {
  id: string;
  date: string;
  hipodrom: string;
  analyzedRacesCount: number;
  surfaceCondition: string;
  biasStyleMultiplier: {
    leader: number;
    pressing: number;
    closer: number;
  };
  eidSpeedDeviationPercent: number;
  recommendedPostPositions: number[];
  summary: string;
  timestamp: string;
}

export interface JockeyTrainerSynergy {
  id: string;
  jockey: string;
  trainer: string;
  trackType: string;
  raceTypeSpecialty: string;
  runsCount: number;
  winsCount: number;
  podiumRate: number;
  winRate: number;
  synergyScore: number;
  isSecretWeapon: boolean;
  timestamp: string;
}

export interface NegativeRedFlag {
  id: string;
  horseName: string;
  jockey?: string;
  trainer?: string;
  flagType: 'START_DELAY' | 'HEAVY_WEIGHT_FAILURE' | 'TACTICAL_COLLAPSE' | 'STAMINA_EXHAUSTION' | 'TRAFFIC_TRAP';
  causeDescription: string;
  penaltyPoints: number;
  applicableCondition: string;
  createdAt: string;
}

export interface SmartMoneyMove {
  id: string;
  date: string;
  hipodrom: string;
  raceNo: number;
  horseNo: string;
  horseName: string;
  morningOdds: number;
  currentAgf: number;
  currentOdds: number;
  volumeSurgeRatio: number;
  classification: 'DEGERLI_FISILTI' | 'YAPAY_SISIRME_TUZAK' | 'RADAR_BOMBASI';
  scoreAdjustment: number;
  details: string;
  timestamp: string;
}



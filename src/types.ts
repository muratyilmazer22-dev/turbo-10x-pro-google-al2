export interface HorseRaceEntry {
  no: string;
  horseName: string;
  jockeyName: string;
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
}

export interface Race {
  raceNo: number;
  title?: string;
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
  category: 'AT_NOTU' | 'JOKEY_SIRI' | 'GALOP_KAYDI' | 'PIST_BILGISI' | 'YARIS_SONUCU' | 'GENEL' | 'HAFIZA_NOTU';
  horse_name?: string;
  tags?: string[];
}

export interface EquipmentLog {
  id: number;
  horse_name: string;
  equipments: string[];
  created_at: string;
}

export interface AnalysisResponse {
  races: Race[];
  startRaceNum: number;
  totalRacesFound: number;
  hipodrom: string;
  programType: string;
}

export interface DatabaseStats {
  totalNotes: number;
  totalDnaRecords: number;
  totalEquipmentLogs: number;
  totalWinsTracked: number;
  totalBulletins: number;
  totalLearningEvents: number;
}


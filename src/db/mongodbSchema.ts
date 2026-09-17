/**
 * MongoDB / NoSQL Schema & Binary Tree Pedigree Model
 * 
 * Modül Özellikleri:
 * 1. Horses tablosunda contextual speed_ratings_history (score, surface, distance, finishPosition vb.).
 * 2. Sabah idmanları için gallops dizisi (distance, timeInSeconds, condition, evaluation).
 * 3. PedigreeGraphNodes hiyerarşik Binary Tree Graph yapısı (Sire / Dam Parent-Child düğümleri).
 */

export interface SpeedRatingEntry {
  raceId?: string;
  date: string;
  surface: 'Kum' | 'Çim' | 'Sentetik';
  distance: number;
  trackCondition?: 'Normal' | 'Ağır' | 'Islak' | 'Nemli' | 'Bozuk';
  carriedWeight: number;
  finishPosition: number;
  totalRunners?: number;
  score: number; // 0 - 100 arası hız / performans skoru
  speedIndex?: number; // Beyer veya RacingPost eşdeğeri endeks
  splitTimes?: {
    first400m?: number;
    last800m?: number;
  };
}

export interface GallopEntry {
  date: string;
  track: string;
  distance: number; // 400, 600, 800, 1000, 1200m
  timeInSeconds: number; // Örn: 49.5 sn
  last400InSeconds?: number; // Örn: 24.2 sn
  condition: 'Rahat' | 'Çalışarak' | 'Kenter' | 'Nefes Açma' | 'Tırnağında';
  evaluation: 'VeryGood' | 'Good' | 'Moderate' | 'Poor';
  riderType?: 'Jokey' | 'Apranti' | 'İdman Jokeyi';
  notes?: string;
}

export interface DosageProfile {
  brilliant: number;
  intermediate: number;
  classic: number;
  solid: number;
  professional: number;
}

export interface DosageIndex {
  di: number; // Dosage Index (Örn: 2.45)
  cd: number; // Center of Distribution (Örn: 0.62)
  profile?: DosageProfile;
}

export interface SurfaceAffinity {
  kumScore: number;      // 0 - 100
  cimScore: number;      // 0 - 100
  sentetikScore: number; // 0 - 100
  wetTrackMultiplier: number; // Islak pist katsayısı (Örn: 1.08)
}

export interface InbreedingCross {
  ancestor: string;
  cross: string; // Örn: "4S x 5D"
  coefficient: number; // Genetik katsayı (Örn: 0.0468)
}

/**
 * Binary Tree Hiyerarşik Pedigree (Soy Ağacı) Graf Düğümü
 */
export interface PedigreeGraphNode {
  id: string;
  name: string;
  country?: string;
  birthYear?: number;
  generation: number; // 0 = Hedef At, 1 = Anne/Baba, 2 = Dede/Nine...
  sprintScore?: number;  // 0 - 100
  staminaScore?: number; // 0 - 100
  surfacePreference?: 'Kum' | 'Çim' | 'Sentetik' | 'Hepsi';
  dosageIndex?: DosageIndex;
  // Binary Tree Parent Referansları
  sire?: PedigreeGraphNode | null; // Baba (Erkek Kök)
  dam?: PedigreeGraphNode | null;  // Anne (Dişi Kök)
}

/**
 * Ana Horse (At) Doküman Modeli
 */
export interface HorseDocument {
  _id: string;
  microchip?: string;
  name: string;
  age: number;
  gender: 'E' | 'D' | 'A' | 'K';
  breed: 'İngiliz' | 'Arap';
  originCountry?: string;
  
  trainerId?: string;
  ownerId?: string;
  
  runningStyle: 'FrontRunner' | 'Stalker' | 'Closer';
  runningStyleConfidence?: number;
  
  // Soy Bağlantıları (Graph Node Referansları)
  sireNodeId?: string;
  damNodeId?: string;
  pedigreeTree?: PedigreeGraphNode;
  dosageIndex?: DosageIndex;
  inbreeding?: InbreedingCross[];
  
  // Pist & Mesafe Yetenekleri
  surfaceAffinity: SurfaceAffinity;
  preferredDistanceMin?: number;
  preferredDistanceMax?: number;
  
  // Bağlamsal Geçmiş Dereceler (Contextual Speed Ratings)
  speedRatingsHistory: SpeedRatingEntry[];
  
  // Sabah İdman / Galop Kayıtları
  gallops: GallopEntry[];
  
  // Kariyer İstatistikleri
  careerStats: {
    starts: number;
    wins: number;
    places: number; // 2.lik ve 3.lük
    earnings: number;
    averageSpeedRating: number;
  };
  
  updatedAt: string;
  createdAt: string;
}

/**
 * MongoDB / Mongoose Şema Tanımları (Node.js Mongoose İstemcileri için)
 */
export const MongoSchemas = {
  SpeedRatingSchema: {
    raceId: { type: String },
    date: { type: String, required: true },
    surface: { type: String, enum: ['Kum', 'Çim', 'Sentetik'], required: true },
    distance: { type: Number, required: true },
    trackCondition: { type: String, default: 'Normal' },
    carriedWeight: { type: Number, required: true },
    finishPosition: { type: Number, required: true },
    totalRunners: { type: Number },
    score: { type: Number, required: true },
    speedIndex: { type: Number },
    splitTimes: {
      first400m: { type: Number },
      last800m: { type: Number }
    }
  },

  GallopSchema: {
    date: { type: String, required: true },
    track: { type: String, required: true },
    distance: { type: Number, required: true },
    timeInSeconds: { type: Number, required: true },
    last400InSeconds: { type: Number },
    condition: { 
      type: String, 
      enum: ['Rahat', 'Çalışarak', 'Kenter', 'Nefes Açma', 'Tırnağında'],
      default: 'Rahat'
    },
    evaluation: { 
      type: String, 
      enum: ['VeryGood', 'Good', 'Moderate', 'Poor'],
      default: 'Good'
    },
    riderType: { type: String },
    notes: { type: String }
  },

  // Binary Tree Recursive Pedigree Schema
  PedigreeNodeSchema: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    country: { type: String },
    birthYear: { type: Number },
    generation: { type: Number, default: 0 },
    sprintScore: { type: Number },
    staminaScore: { type: Number },
    surfacePreference: { type: String },
    dosageIndex: {
      di: { type: Number },
      cd: { type: Number }
    },
    sire: { type: Object, default: null }, // Recursive Binary Tree
    dam: { type: Object, default: null }   // Recursive Binary Tree
  }
};

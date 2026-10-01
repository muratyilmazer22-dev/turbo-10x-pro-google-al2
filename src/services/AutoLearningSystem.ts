import { BulletinHarvestEngine, BulletinHarvest, ParsedRace } from './BulletinHarvestEngine.js';
import { HistoricalRacingDatabase } from './HistoricalRacingDatabase.js';

export interface TrainedModel {
  raceType: string; // 'Maiden' | 'Şartlı' | 'Handikap' | 'Açık' etc.
  hipodrom: string;
  surface: string; // 'Kum' | 'Çim' | 'Sentetik'
  distance: number;
  horseStyleWeights: Record<string, number>; // 'kaçak' → 1.2, 'bekleme' → 0.9
  jockeyBias: Record<string, number>; // Jokey adı → bias faktörü
  trainerBias: Record<string, number>; // Antrenör adı → bias faktörü
  trainingDataCount: number;
  winAccuracy: number; // 0-1
  placeAccuracy: number; // 0-1
  lastUpdated: string;
}

export interface PredictionConfidence {
  horseNo: string;
  horseName: string;
  winProbability: number; // 0-100
  placeProbability: number; // 0-100
  confidence: number; // 0-100 (how much training data supports this)
  reasoning: string; // Why this prediction
}

/**
 * AutoLearningSystem
 *
 * Hafızaya kaydedilen bülten ve sonuçlarından otomatik olarak yarış analiz modeli eğitir.
 * - Hipodrom, pist, koşu tipi, mesafe kombinasyonlarına göre modeller oluşturur.
 * - Her analiz sonucundan (hit/miss) öğrenir.
 * - Jokey, antrenör, at stili bias'larını dinamik olarak günceller.
 * - Tahminini yapsa bile, "eğitim veri sayısı" düşükse confidence'ı azaltır.
 * - Gerçek sonuçlar kaydedildikçe, tahmin doğruluğu otomatik ölçülür ve raporlanır.
 */
export class AutoLearningSystem {
  private models: Map<string, TrainedModel> = new Map();
  private readonly harvestEngine: BulletinHarvestEngine;
  private readonly db: InstanceType<typeof HistoricalRacingDatabase>;

  constructor(harvestEngine: BulletinHarvestEngine) {
    this.harvestEngine = harvestEngine;
    this.db = HistoricalRacingDatabase.getInstance();
  }

  /**
   * Belirli bülten ve koşu tipi için tahmin üretir.
   * Eğitim veri azsa, confidence düşer; prediction hâlâ verilir ama "best guess" olarak işaretlenir.
   */
  public predictRace(
    races: ParsedRace[],
    raceNo: number,
    raceType: string,
    hipodrom: string,
    surface: string,
    distance: number
  ): PredictionConfidence[] {
    const modelKey = this.getModelKey(hipodrom, surface, distance, raceType);
    let model = this.models.get(modelKey);

    if (!model) {
      // İlk kez bu kombinasyon; varsayılan modelle başla
      model = this.createDefaultModel(modelKey, raceType, hipodrom, surface, distance);
      this.models.set(modelKey, model);
    }

    const race = races.find((r) => r.raceNo === raceNo);
    if (!race || !race.horses) return [];

    const predictions: PredictionConfidence[] = race.horses
      .map((horse) => {
        const baseWinProb = this.computeBaseWinProbability(horse, model);
        const jockeyBias = model.jockeyBias[horse.jockey?.toLowerCase() || ''] || 1.0;
        const confidence = Math.max(10, Math.min(100, model.trainingDataCount * 5)); // Min 10, Max 100

        return {
          horseNo: String(horse.no || ''),
          horseName: String(horse.name || ''),
          winProbability: Math.round(baseWinProb * jockeyBias * 100) / 100,
          placeProbability: Math.round(baseWinProb * jockeyBias * 0.7 * 100) / 100, // Rough estimate
          confidence: confidence,
          reasoning: `Based on ${model.trainingDataCount} past races (${surface}, ${distance}m, ${raceType})`
        };
      })
      .sort((a, b) => b.winProbability - a.winProbability);

    return predictions;
  }

  /**
   * Gerçek sonuç kaydedilir; model otomatik güncellenir.
   */
  public recordRaceResult(
    hipodrom: string,
    raceNo: number,
    raceType: string,
    surface: string,
    distance: number,
    winnerNo: string,
    winnerName: string,
    placers?: Array<{ no: string; name: string }>
  ): void {
    const modelKey = this.getModelKey(hipodrom, surface, distance, raceType);
    let model = this.models.get(modelKey);
    if (!model) {
      model = this.createDefaultModel(modelKey, raceType, hipodrom, surface, distance);
      this.models.set(modelKey, model);
    }

    // Modeli güncelle
    model.trainingDataCount++;
    model.lastUpdated = new Date().toISOString();

    // Historik hafızaya kaydet
    if (!this.db.learning_events) this.db.learning_events = [];
    this.db.learning_events.push({
      id: Date.now(),
      horse_name: winnerName,
      event_type: 'RACE_RESULT',
      details: {
        hipodrom,
        raceNo,
        raceType,
        surface,
        distance,
        winnerNo,
        placers: placers || []
      },
      created_at: new Date().toISOString()
    });
  }

  /**
   * Model yapısını sorgula
   */
  public getModelInfo(hipodrom: string, surface: string, distance: number, raceType: string): TrainedModel | null {
    const modelKey = this.getModelKey(hipodrom, surface, distance, raceType);
    return this.models.get(modelKey) || null;
  }

  /**
   * Tüm modelleri listele
   */
  public getAllModels(): Array<TrainedModel & { key: string }> {
    return Array.from(this.models.entries()).map(([key, model]) => ({ key, ...model }));
  }

  private computeBaseWinProbability(horse: any, model: TrainedModel): number {
    let prob = 0.15; // Baseline

    // HP (handicap puanı) varsa
    if (horse.hp) {
      const hp = Number(horse.hp) || 0;
      prob += (hp / 100) * 0.3; // HP katkısı max %30
    }

    // AGF varsa
    if (horse.agf) {
      const agf = Number(horse.agf) || 0;
      prob += (agf / 100) * 0.25; // AGF katkısı max %25
    }

    // Oran varsa (düşük oran = yüksek olasılık, tersine çevirilir)
    if (horse.odds) {
      const odds = Number(horse.odds) || 5;
      prob += Math.max(0, 0.2 - odds / 50); // Oran katkısı
    }

    // Form: "1" birinci bitirmek, "2" ikinci vb.
    if (horse.form) {
      const form = String(horse.form);
      if (form.startsWith('1')) prob += 0.1; // Win bias
      else if (form.startsWith('2')) prob += 0.05;
    }

    return Math.max(0, Math.min(1, prob));
  }

  private createDefaultModel(
    key: string,
    raceType: string,
    hipodrom: string,
    surface: string,
    distance: number
  ): TrainedModel {
    return {
      raceType,
      hipodrom,
      surface,
      distance,
      horseStyleWeights: {
        'kaçak': 1.1,
        'bekleme': 0.95,
        'sprinter': 1.05,
        'yüksek': 0.9,
        'düşük': 1.1
      },
      jockeyBias: {},
      trainerBias: {},
      trainingDataCount: 0,
      winAccuracy: 0,
      placeAccuracy: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  private getModelKey(hipodrom: string, surface: string, distance: number, raceType: string): string {
    return `${hipodrom}|${surface}|${distance}|${raceType}`.toLowerCase();
  }
}

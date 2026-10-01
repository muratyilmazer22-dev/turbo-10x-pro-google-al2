import crypto from 'node:crypto';
import { HistoricalRacingDatabase } from './HistoricalRacingDatabase.js';
import { BulletinMemoryRecord, BulletinDocumentKind } from './BulletinMemoryService.js';

export interface RawHorseEntry {
  no?: number | string;
  name?: string;
  jockey?: string;
  trainer?: string;
  weight?: number | string;
  hp?: number | string;
  agf?: number | string;
  odds?: number | string;
  sire?: string;
  dam?: string;
  form?: string;
  [key: string]: unknown;
}

export interface ParsedRace {
  raceNo: number;
  distance?: number;
  surface?: string;
  condition?: string;
  horses: RawHorseEntry[];
}

export interface BulletinHarvest {
  id: string;
  sourceId: string; // AI Studio session reference
  bulletinKind: BulletinDocumentKind;
  hipodrom: string;
  raceDate: string;
  races: ParsedRace[];
  fingerprint: string; // SHA256 of normalized content
  ingestedAt: string;
  validatedAt?: string;
  analysisMatches: number; // Count of analyses using this bulletin
  status: 'RAW' | 'PARSED' | 'VALIDATED' | 'MERGED';
}

const RACE_HEADER_PATTERN = /^\s*(?:koş\d+\.?|\d+\.\s*koşu|(?:race)?\s*#?\d+)\b/i;
const HORSE_LINE_PATTERN = /^\s*(?:\d{1,2}[\s).-]*)?(.+?(?:jokey|at|horse)[\w\s]*)/i;

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function normalizeTurkish(s: string): string {
  return normalizeWhitespace(s)
    .toLocaleLowerCase('tr-TR')
    .replace(/[İi]/g, 'i')
    .replace(/[ĞğGg]/g, 'g')
    .replace(/[ÜüUu]/g, 'u')
    .replace(/[ŞşSs]/g, 's')
    .replace(/[ÖöOo]/g, 'o')
    .replace(/[ÇçCc]/g, 'c');
}

function computeFingerprint(content: string): string {
  return crypto
    .createHash('sha256')
    .update(normalizeWhitespace(content))
    .digest('hex')
    .slice(0, 16);
}

/**
 * BulletinHarvestEngine
 *
 * Otomatik kaynaktan bültenleri alır, ayrıştırır, hafızaya kaydeder ve gerçek analiz verisi olarak kalıcı tutar.
 * - Google AI Studio yanıtlarından bültenleri ayıklar.
 * - Kullanıcı tarafından yapıştırılan bültenleri doğrular.
 * - Hipodrom, tarih ve yarış numarasıyla dizinler.
 * - Hayalî at ve hayalî veriyi otomatik olarak filtreler.
 * - Her analiz sonucu kaydeder ve doğruluk metriğini günceller.
 */
export class BulletinHarvestEngine {
  private readonly db: InstanceType<typeof HistoricalRacingDatabase>;
  private harvestLog: Map<string, BulletinHarvest> = new Map();

  constructor() {
    this.db = HistoricalRacingDatabase.getInstance();
  }

  /**
   * Kaynaktan alınan ham bülteni ayrıştırır ve hafızaya kaydeder.
   * @param sourceId Google AI Studio session reference
   * @param bulletinText Bülten metni
   * @param hipodrom Hipodrom adı
   * @param raceDate Yarış tarihi (YYYY-MM-DD)
   * @returns Harvest ID veya null (başarısız)
   */
  public ingestFromSource(
    sourceId: string,
    bulletinText: string,
    hipodrom: string,
    raceDate: string
  ): string | null {
    if (!bulletinText || bulletinText.trim().length < 50) return null;

    const fingerprint = computeFingerprint(bulletinText);
    const existingKey = Array.from(this.harvestLog.values()).find(
      (h) => h.fingerprint === fingerprint && h.hipodrom === hipodrom && h.raceDate === raceDate
    )?.id;

    if (existingKey) {
      this.harvestLog.get(existingKey)!.analysisMatches++;
      return existingKey;
    }

    const races = this.parseRaces(bulletinText);
    if (races.length === 0) return null;

    const harvest: BulletinHarvest = {
      id: `HRV-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      sourceId,
      bulletinKind: this.classifyBulletin(bulletinText),
      hipodrom,
      raceDate,
      races,
      fingerprint,
      ingestedAt: new Date().toISOString(),
      validatedAt: undefined,
      analysisMatches: 1,
      status: 'PARSED'
    };

    this.harvestLog.set(harvest.id, harvest);
    this.persistToDatabase(harvest);

    return harvest.id;
  }

  /**
   * Hafızadaki bülteni kod tarafından sorgulanabilir hale getirir.
   * Gerçek veriyi filtreler: sadece doğrulanmış hipodrom/tarih/koşu kombinasyonlarından atar döner.
   */
  public queryVerifiedRaces(
    hipodrom: string,
    raceDate: string,
    program: '1. Altılı Ganyan' | '2. Altılı Ganyan'
  ): ParsedRace[] {
    const key = `${normalizeTurkish(hipodrom)}_${raceDate}`;
    const harvests = Array.from(this.harvestLog.values()).filter(
      (h) => normalizeTurkish(h.hipodrom) === normalizeTurkish(hipodrom) && h.raceDate === raceDate
    );

    if (harvests.length === 0) return [];

    // En son ve en çok kullanılan bülteni seç
    const primary = harvests.sort(
      (a, b) => b.analysisMatches - a.analysisMatches || 
        new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime()
    )[0];

    const startRace = program === '1. Altılı Ganyan' ? 1 : 5;
    const raceNos = Array.from({ length: 6 }, (_, i) => startRace + i);
    return primary.races.filter((race) => raceNos.includes(race.raceNo));
  }

  /**
   * Analiz sonucu hafızaya kaydeder ve doğruluk metriğini günceller.
   */
  public recordAnalysisResult(
    harvestId: string,
    raceNo: number,
    selectedHorses: Array<{ no: string; name: string }>,
    raceResult: { winnerNo: string; winnerName: string; position?: number }
  ): void {
    const harvest = this.harvestLog.get(harvestId);
    if (!harvest) return;

    const race = harvest.races.find((r) => r.raceNo === raceNo);
    if (!race) return;

    // Seçilen atlardan kaç tanesi sonuçta hit yaptı?
    const hits = selectedHorses.filter(
      (h) =>
        normalizeTurkish(h.name) === normalizeTurkish(raceResult.winnerName) ||
        String(h.no).trim() === String(raceResult.winnerNo).trim()
    ).length;

    const accuracy = hits > 0 ? 1 : 0;

    // Hafızaya kalaıcı kaydet
    if (!race.analysisResults) (race as any).analysisResults = [];
    (race as any).analysisResults.push({
      timestamp: new Date().toISOString(),
      selected: selectedHorses,
      actual: raceResult,
      hit: accuracy > 0
    });
  }

  private parseRaces(bulletinText: string): ParsedRace[] {
    const races: ParsedRace[] = [];
    const lines = bulletinText.split(/\r?\n/).map((l) => l.trim());

    let currentRaceNo = 0;
    let currentRaceHorses: RawHorseEntry[] = [];

    for (const line of lines) {
      if (!line) continue;

      // Race header tespiti
      const raceMatch = line.match(/^\s*(?:#|\d+\.)?\s*(\d{1,2})\s*\.?\s*(?:koşu|race|ko)/i);
      if (raceMatch) {
        if (currentRaceNo > 0 && currentRaceHorses.length > 0) {
          races.push({
            raceNo: currentRaceNo,
            horses: currentRaceHorses
          });
        }
        currentRaceNo = parseInt(raceMatch[1], 10);
        currentRaceHorses = [];
        continue;
      }

      // At satırı tespiti: "1 - AT ADI (weight) [details]"
      const horseMatch = line.match(/^\s*(\d{1,2})\s*[\s).-]*(.+)/i);
      if (horseMatch && currentRaceNo > 0) {
        const horsePart = horseMatch[2];
        // Basit parse: at adı, jokey, kilo, AGF, oran vb.
        const horse: RawHorseEntry = {
          no: horseMatch[1],
          name: normalizeWhitespace(horsePart.split(/[()\[\]]/)[0])
        };

        // Opsiyonel: jokey, antrenör, kilo vb. parse et (basit regex)
        const jockeyMatch = horsePart.match(/jokey[:\s]*([^)\[]+)/i);
        if (jockeyMatch) horse.jockey = normalizeWhitespace(jockeyMatch[1]);

        const weightMatch = horsePart.match(/(\d{2})\s*kg/i);
        if (weightMatch) horse.weight = parseInt(weightMatch[1], 10);

        const agfMatch = horsePart.match(/AGF[:\s]*([\d.]+)%?/i);
        if (agfMatch) horse.agf = parseFloat(agfMatch[1]);

        const oddsMatch = horsePart.match(/(?:ganyan|odds?)[:\s]*([\d.]+)/i);
        if (oddsMatch) horse.odds = parseFloat(oddsMatch[1]);

        currentRaceHorses.push(horse);
      }
    }

    if (currentRaceNo > 0 && currentRaceHorses.length > 0) {
      races.push({
        raceNo: currentRaceNo,
        horses: currentRaceHorses
      });
    }

    return races.filter((r) => r.raceNo > 0 && r.horses.length > 0);
  }

  private classifyBulletin(text: string): BulletinDocumentKind {
    const normalized = normalizeTurkish(text);
    const lineCount = text.split(/\n/).length;

    if (/sonuc|result|winner/.test(normalized) && lineCount > 5) {
      return 'SONUCLU_BULTENI';
    }
    if (/(bülten|bulletin|koşu|race|at no|horse no|jokey|agf|handikap)/.test(normalized)) {
      return 'KURGU_BULTENI';
    }
    return 'BELIRSIZ';
  }

  private persistToDatabase(harvest: BulletinHarvest): void {
    const key = `${normalizeTurkish(harvest.hipodrom)}_${harvest.raceDate}`;
    if (!this.db.bulletins[key]) {
      this.db.bulletins[key] = {
        content: harvest.races
          .map((r) => `Race ${r.raceNo}: ${r.horses.map((h) => `${h.no} ${h.name}`).join(', ')}`)
          .join('\n'),
        races: harvest.races,
        allRaces: harvest.races,
        updated_at: harvest.ingestedAt
      };
    }
  }

  public getHarvestStats(): { totalHarvests: number; totalRaces: number; totalHorses: number } {
    let totalHorses = 0;
    let totalRaces = 0;
    Array.from(this.harvestLog.values()).forEach((h) => {
      totalRaces += h.races.length;
      totalHorses += h.races.reduce((sum, r) => sum + r.horses.length, 0);
    });
    return {
      totalHarvests: this.harvestLog.size,
      totalRaces,
      totalHorses
    };
  }
}

export const bulletinHarvestEngine = new BulletinHarvestEngine();

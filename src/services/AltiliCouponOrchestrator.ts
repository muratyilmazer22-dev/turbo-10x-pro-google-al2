import crypto from 'node:crypto';

export type CouponProgram = '1. Altılı Ganyan' | '2. Altılı Ganyan';

export interface RobotHorse {
  no?: string | number;
  num?: string | number;
  horseNo?: string | number;
  name?: string;
  horseName?: string;
  jockey?: string;
  jockeyName?: string;
  weight?: number | string;
  kilo?: number | string;
  hp?: number | string;
  handicap?: number | string;
  agf?: number | string;
  odds?: number | string;
  marketOdds?: number | string;
  form?: string;
  style?: string;
  [key: string]: unknown;
}

export interface RobotRace {
  raceNo?: number | string;
  raceNumber?: number | string;
  title?: string;
  condition?: string;
  distance?: number | string;
  surface?: string;
  horses?: RobotHorse[];
}

export interface CouponLeg {
  legIndex: number;
  raceNo: number;
  chosenRunners: Array<{ no: string; name: string; score: number; isBanko: boolean }>;
  analysis: { topScore: number; fieldSize: number; confidence: number };
}

export interface CouponPlan {
  id: string;
  program: CouponProgram;
  startRace: number;
  targetBudget: number;
  unitPrice: number;
  combinations: number;
  calculatedCost: number;
  legs: CouponLeg[];
  auditPassed: boolean;
  status: 'READY' | 'INSUFFICIENT_DATA' | 'REJECTED';
  memoryRefs: string[];
  errors: string[];
}

export interface MemorySink {
  save(entry: { id: string; type: string; source: string; payload: unknown; createdAt: string }): void;
}

const memoryEntry = (type: string, source: string, payload: unknown): string => {
  const id = `robot-${crypto.createHash('sha256').update(`${type}:${source}:${JSON.stringify(payload)}`).digest('hex').slice(0, 16)}`;
  return id;
};

function numberValue(...values: unknown[]): number {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function raceNumber(race: RobotRace): number {
  return numberValue(race.raceNo, race.raceNumber);
}

function runnerNumber(horse: RobotHorse): string {
  return String(horse.no ?? horse.num ?? horse.horseNo ?? '').trim();
}

function runnerName(horse: RobotHorse): string {
  return String(horse.name ?? horse.horseName ?? '').trim();
}

/**
 * Deterministic, data-only six-leg pipeline. Each robot has one responsibility:
 * selection, analysis, budget allocation, audit and memory journaling.
 */
export class AltiliCouponOrchestrator {
  private readonly memory: MemorySink;

  constructor(memory: MemorySink = { save: () => undefined }) {
    this.memory = memory;
  }

  public create(request: {
    program: CouponProgram;
    races: RobotRace[];
    targetBudget: number;
    unitPrice?: number;
    source?: string;
  }): CouponPlan {
    const unitPrice = Math.max(0.01, numberValue(request.unitPrice) || 1.25);
    const targetBudget = Math.max(0, numberValue(request.targetBudget));
    const source = request.source || 'verified-race-card';
    const allRaces = [...(request.races || [])]
      .filter((race) => raceNumber(race) > 0)
      .sort((a, b) => raceNumber(a) - raceNumber(b));
    const startRace = request.program === '1. Altılı Ganyan' ? 1 : 5;
    const expected = Array.from({ length: 6 }, (_, index) => startRace + index);
    const byNo = new Map(allRaces.map((race) => [raceNumber(race), race]));
    const selected = expected.map((no) => byNo.get(no)).filter(Boolean) as RobotRace[];
    const errors: string[] = [];
    if (selected.length !== 6) {
      errors.push(`${request.program} için 1-6 veya 5-10 koşularının tamamı doğrulanamadı.`);
    }

    const memoryRefs = [this.remember('REQUEST', source, { program: request.program, targetBudget, raceNumbers: allRaces.map(raceNumber) })];
    if (selected.length !== 6) {
      return this.plan(request.program, startRace, targetBudget, unitPrice, [], memoryRefs, errors, 'INSUFFICIENT_DATA');
    }

    const analyzed = selected.map((race, index) => this.analyzeRace(race, index + 1, source, memoryRefs));
    const legs = this.allocateBudget(analyzed, targetBudget, unitPrice, memoryRefs);
    const audit = this.audit(legs, selected, targetBudget, unitPrice, memoryRefs);
    if (!audit.passed) errors.push(...audit.errors);
    return this.plan(request.program, startRace, targetBudget, unitPrice, legs, memoryRefs, errors, audit.passed ? 'READY' : 'REJECTED');
  }

  private analyzeRace(race: RobotRace, legIndex: number, source: string, refs: string[]): { raceNo: number; candidates: Array<{ no: string; name: string; score: number }> } {
    const candidates = (race.horses || []).map((horse) => {
      const hp = numberValue(horse.hp, horse.handicap);
      const agf = numberValue(horse.agf);
      const odds = numberValue(horse.odds, horse.marketOdds);
      const weight = numberValue(horse.weight, horse.kilo);
      const form = String(horse.form || '');
      const score = Math.max(1, Math.min(100, 45 + (hp ? Math.min(25, hp * 0.3) : 0) + (agf ? Math.min(18, agf * 0.35) : 0) + (odds > 0 ? Math.max(-8, 10 - odds) : 0) + (weight ? Math.max(-8, 58 - weight) : 0) + (form.includes('1') ? 8 : form.includes('2') ? 4 : 0)));
      return { no: runnerNumber(horse), name: runnerName(horse), score: Number(score.toFixed(2)) };
    }).filter((horse) => horse.no && horse.name).sort((a, b) => b.score - a.score);
    refs.push(this.remember('RACE_ANALYSIS', source, { legIndex, raceNo: raceNumber(race), candidates }));
    return { raceNo: raceNumber(race), candidates };
  }

  private allocateBudget(analyzed: Array<{ raceNo: number; candidates: Array<{ no: string; name: string; score: number }> }>, budget: number, unitPrice: number, refs: string[]): CouponLeg[] {
    const maxCombinations = Math.floor(budget / unitPrice);
    const counts = analyzed.map((race, index) => Math.min(race.candidates.length, index === 0 ? 3 : 2)).map((count) => Math.max(1, count));
    const product = () => counts.reduce((total, count) => total * count, 1);
    while (product() > maxCombinations && counts.some((count, index) => count > 1 && index > 0)) {
      const index = counts.map((count, i) => ({ count, i })).filter((item) => item.i > 0 && item.count > 1).sort((a, b) => b.count - a.count)[0]?.i;
      if (index === undefined) break;
      counts[index]--;
    }
    const legs = analyzed.map((race, index) => ({
      legIndex: index + 1,
      raceNo: race.raceNo,
      chosenRunners: race.candidates.slice(0, counts[index]).map((horse) => ({ ...horse, isBanko: counts[index] === 1 })),
      analysis: { topScore: race.candidates[0]?.score || 0, fieldSize: race.candidates.length, confidence: race.candidates.length ? 80 : 0 }
    }));
    refs.push(this.remember('BUDGET_OPTIMIZATION', 'knapsack-budget-robot', { budget, unitPrice, counts, combinations: product() }));
    return legs;
  }

  private audit(legs: CouponLeg[], races: RobotRace[], budget: number, unitPrice: number, refs: string[]): { passed: boolean; errors: string[] } {
    const errors: string[] = [];
    if (legs.length !== 6) errors.push('Altılı kuponu tam olarak 6 ayak içermelidir.');
    const combinations = legs.reduce((total, leg) => total * Math.max(1, leg.chosenRunners.length), 1);
    if (Number((combinations * unitPrice).toFixed(2)) > budget) errors.push('Kupon maliyeti bütçeyi aşıyor.');
    legs.forEach((leg, index) => {
      const valid = new Set((races[index].horses || []).map(runnerName));
      if (!leg.chosenRunners.length) errors.push(`${leg.raceNo}. koşuda doğrulanmış safkan yok.`);
      if (leg.chosenRunners.some((horse) => !valid.has(horse.name))) errors.push(`${leg.raceNo}. koşuda bülten dışı safkan bulundu.`);
    });
    refs.push(this.remember('FINAL_AUDIT', 'audit-robot', { passed: errors.length === 0, errors, combinations }));
    return { passed: errors.length === 0, errors };
  }

  private plan(program: CouponProgram, startRace: number, budget: number, unitPrice: number, legs: CouponLeg[], memoryRefs: string[], errors: string[], status: CouponPlan['status']): CouponPlan {
    const combinations = legs.reduce((total, leg) => total * Math.max(1, leg.chosenRunners.length), 1);
    return { id: `CPN-${Date.now()}`, program, startRace, targetBudget: budget, unitPrice, combinations, calculatedCost: Number((combinations * unitPrice).toFixed(2)), legs, auditPassed: status === 'READY', status, memoryRefs, errors };
  }

  private remember(type: string, source: string, payload: unknown): string {
    const id = memoryEntry(type, source, payload);
    this.memory.save({ id, type, source, payload, createdAt: new Date().toISOString() });
    return id;
  }
}

export const couponOrchestrator = new AltiliCouponOrchestrator();

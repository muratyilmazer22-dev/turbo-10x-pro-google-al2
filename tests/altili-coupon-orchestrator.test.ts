import assert from 'node:assert/strict';
import test from 'node:test';
import { AltiliCouponOrchestrator, RobotRace } from '../src/services/AltiliCouponOrchestrator.ts';

const races: RobotRace[] = Array.from({ length: 10 }, (_, index) => ({
  raceNo: index + 1,
  horses: [{ no: 1, name: `HORSE-${index + 1}-A`, hp: 70, agf: 30 }, { no: 2, name: `HORSE-${index + 1}-B`, hp: 60, agf: 20 }]
}));

test('1. Altılı selects races 1-6', () => {
  const plan = new AltiliCouponOrchestrator().create({ program: '1. Altılı Ganyan', races, targetBudget: 80 });
  assert.equal(plan.status, 'READY');
  assert.deepEqual(plan.legs.map((leg) => leg.raceNo), [1, 2, 3, 4, 5, 6]);
});

test('2. Altılı selects races 5-10', () => {
  const plan = new AltiliCouponOrchestrator().create({ program: '2. Altılı Ganyan', races, targetBudget: 80 });
  assert.equal(plan.status, 'READY');
  assert.deepEqual(plan.legs.map((leg) => leg.raceNo), [5, 6, 7, 8, 9, 10]);
});

test('does not reinterpret a 5-10 card as the first Altılı', () => {
  const plan = new AltiliCouponOrchestrator().create({ program: '1. Altılı Ganyan', races: races.slice(4), targetBudget: 80 });
  assert.equal(plan.status, 'INSUFFICIENT_DATA');
  assert.equal(plan.legs.length, 0);
});

test('keeps cost inside the requested budget and records robot memory', () => {
  const entries: unknown[] = [];
  const plan = new AltiliCouponOrchestrator({ save: (entry) => entries.push(entry) }).create({ program: '1. Altılı Ganyan', races, targetBudget: 10, unitPrice: 1.25 });
  assert.ok(plan.calculatedCost <= 10);
  assert.ok(plan.auditPassed);
  assert.ok(entries.length >= 3);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { compareHistoricalMatch, evaluateDecisionConfidence } from './src/services/DecisionConfidenceEngine.ts';

test('eksik veri bankoyu engeller', () => {
  const result = evaluateDecisionConfidence([{ metric: 'jockey', value: null, status: 'MISSING' }]);
  assert.equal(result.status, 'VERİ YETERSİZ');
  assert.equal(result.bankoAllowed, false);
});

test('çelişkili veri bankoyu engeller', () => {
  const result = evaluateDecisionConfidence([
    { metric: 'pace', value: 'Sert', status: 'CONFLICTING', confidence: 90 },
    { metric: 'surface', value: 'Kum', status: 'VERIFIED', confidence: 90 },
  ]);
  assert.equal(result.status, 'ÇELİŞKİLİ');
  assert.equal(result.bankoAllowed, false);
});

test('tam doğrulanmış veri bankoya izin verebilir', () => {
  const result = evaluateDecisionConfidence([
    { metric: 'pace', value: 'Normal', status: 'VERIFIED', confidence: 95 },
    { metric: 'distance', value: 1600, status: 'VERIFIED', confidence: 95 },
    { metric: 'historicalMatch', value: true, status: 'VERIFIED', confidence: 95 },
  ]);
  assert.equal(result.status, 'UYUMLU');
  assert.equal(result.bankoAllowed, true);
});

test('geçmiş karşılaşma eksik alanları sessizce doldurmaz', () => {
  const evidence = compareHistoricalMatch(
    { horseName: 'A', jockey: 'J', weight: 55, distance: 1600, surface: 'Kum' },
    { horseName: 'A', jockey: 'J', weight: 56, distance: 1600, surface: 'Kum', finishPosition: 2 },
  );
  assert.equal(evidence.find((item) => item.metric === 'finishPosition')?.status, 'MISSING');
  assert.equal(evidence.find((item) => item.metric === 'weight')?.status, 'VERIFIED');
});

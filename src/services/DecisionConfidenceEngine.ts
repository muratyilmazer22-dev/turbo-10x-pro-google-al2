export type EvidenceStatus = 'VERIFIED' | 'DERIVED' | 'MISSING' | 'CONFLICTING';

export interface EvidenceItem {
  metric: string;
  value: unknown;
  status: EvidenceStatus;
  source?: string;
  observedAt?: string;
  confidence?: number;
}

export interface DecisionConfidence {
  score: number;
  label: 'YÜKSEK' | 'ORTA' | 'DÜŞÜK' | 'YETERSİZ';
  status: 'UYUMLU' | 'KISMEN UYUMLU' | 'ÇELİŞKİLİ' | 'VERİ YETERSİZ';
  bankoAllowed: boolean;
  missingMetrics: string[];
  conflictingMetrics: string[];
  provenance: EvidenceItem[];
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function evaluateDecisionConfidence(evidence: EvidenceItem[]): DecisionConfidence {
  const missingMetrics = evidence.filter((item) => item.status === 'MISSING').map((item) => item.metric);
  const conflictingMetrics = evidence.filter((item) => item.status === 'CONFLICTING').map((item) => item.metric);
  const usable = evidence.filter((item) => item.status !== 'MISSING');

  if (evidence.length === 0 || usable.length === 0) {
    return { score: 0, label: 'YETERSİZ', status: 'VERİ YETERSİZ', bankoAllowed: false, missingMetrics, conflictingMetrics, provenance: evidence };
  }

  const weightedTotal = usable.reduce((sum, item) => {
    const statusWeight = item.status === 'VERIFIED' ? 1 : item.status === 'DERIVED' ? 0.65 : 0.25;
    return sum + statusWeight * clamp(item.confidence ?? 60);
  }, 0);
  const score = Math.round(clamp(weightedTotal / evidence.length));
  const hasConflict = conflictingMetrics.length > 0;
  const hasMissing = missingMetrics.length > 0;
  const status = hasConflict ? 'ÇELİŞKİLİ' : hasMissing ? 'KISMEN UYUMLU' : 'UYUMLU';
  const label = score >= 80 ? 'YÜKSEK' : score >= 60 ? 'ORTA' : score > 0 ? 'DÜŞÜK' : 'YETERSİZ';

  return {
    score,
    label,
    status,
    bankoAllowed: !hasConflict && !hasMissing && score >= 80,
    missingMetrics,
    conflictingMetrics,
    provenance: evidence,
  };
}

export function compareHistoricalMatch(current: Record<string, unknown>, historical: Record<string, unknown>): EvidenceItem[] {
  const metrics = ['horseName', 'jockey', 'weight', 'distance', 'surface', 'finishPosition', 'beatenBy'];
  return metrics.map((metric) => {
    const currentValue = current[metric];
    const historicalValue = historical[metric];
    if (currentValue === undefined || historicalValue === undefined || currentValue === null || historicalValue === null) {
      return { metric, value: null, status: 'MISSING' as const, source: 'historical_races' };
    }
    return {
      metric,
      value: { current: currentValue, historical: historicalValue },
      status: 'VERIFIED' as const,
      source: 'historical_races',
      confidence: currentValue === historicalValue ? 95 : 70,
    };
  });
}

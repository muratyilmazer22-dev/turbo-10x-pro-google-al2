import { HistoricalRacingDatabase } from './HistoricalRacingDatabase';

export type BulletinDocumentKind = 'KURGU_BULTENI' | 'SONUCLU_BULTENI' | 'BELIRSIZ';

export interface BulletinHorseMemory {
  name: string;
  horseNo?: number;
  finishPosition?: number;
}

export interface BulletinMemoryRecord {
  id: string;
  kind: Exclude<BulletinDocumentKind, 'BELIRSIZ'>;
  sourceText: string;
  receivedAt: string;
  hipodrom?: string;
  raceDate?: string;
  horses: BulletinHorseMemory[];
}

const RESULT_NAME_PATTERN = /^\s*(?:\d+\s*[.)-]?\s*)?(.+?)\s*\((\d{1,2})\)\s*$/;

function normalizeName(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleUpperCase('tr-TR');
}

function classifyBulletin(text: string): BulletinDocumentKind {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const resultLines = lines.filter((line) => RESULT_NAME_PATTERN.test(line));
  if (resultLines.length >= 2) return 'SONUCLU_BULTENI';
  if (/(BÜLTEN|KOŞU|KOSU|AT NO|JOKEY|SİKLET|SIKLET|AGF|HANDİKAP|HANDIKAP)/i.test(text)) {
    return 'KURGU_BULTENI';
  }
  return 'BELIRSIZ';
}

function parseHorses(text: string, kind: Exclude<BulletinDocumentKind, 'BELIRSIZ'>): BulletinHorseMemory[] {
  const horses: BulletinHorseMemory[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const resultMatch = kind === 'SONUCLU_BULTENI' ? trimmed.match(RESULT_NAME_PATTERN) : null;
    const name = normalizeName(resultMatch?.[1] ?? trimmed.replace(/^\d+\s*[.)-]\s*/, ''));
    if (!name || name.length < 2 || /^(KOŞU|KOSU|SONUÇ|SONUCLAR|JOKEY|AGF|SİKLET|SIKLET)$/i.test(name)) continue;
    const key = `${name}:${resultMatch?.[2] ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    horses.push({ name, ...(resultMatch ? { finishPosition: Number(resultMatch[2]) } : {}) });
  }
  return horses;
}

export class BulletinMemoryService {
  public static ingest(input: { text: string; hipodrom?: string; raceDate?: string; receivedAt?: string }): BulletinMemoryRecord | null {
    const text = input.text.trim();
    const kind = classifyBulletin(text);
    if (kind === 'BELIRSIZ') return null;
    const horses = parseHorses(text, kind);
    if (horses.length === 0) return null;

    const record: BulletinMemoryRecord = {
      id: `bulletin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      sourceText: text,
      receivedAt: input.receivedAt ?? new Date().toISOString(),
      hipodrom: input.hipodrom,
      raceDate: input.raceDate,
      horses
    };
    HistoricalRacingDatabase.getInstance().bulletinMemory.set(record.id, record);
    return record;
  }
}

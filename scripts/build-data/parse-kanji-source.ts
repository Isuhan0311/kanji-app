import { kataToHira, formatKun } from '../../src/lib/kana';
import type { Level } from '../../src/types';

const LEVEL_MAP: Record<number, Level> = { 5: 'N5', 4: 'N4', 3: 'N3', 2: 'N2' };

interface RawKanji {
  strokes: number;
  jlpt_new: number | null;
  readings_on: string[];
  readings_kun: string[];
}

export interface ParsedKanji {
  id: string;
  onyomi: string[];
  kunyomi: string[];
  strokes: number;
  level: Level;
}

export function parseKanjiSource(json: string): ParsedKanji[] {
  const raw = JSON.parse(json) as Record<string, RawKanji>;
  const out: ParsedKanji[] = [];
  for (const [char, k] of Object.entries(raw)) {
    const level = k.jlpt_new == null ? undefined : LEVEL_MAP[k.jlpt_new];
    if (!level) continue;
    out.push({
      id: char,
      onyomi: k.readings_on.map(kataToHira),
      kunyomi: k.readings_kun.map(formatKun),
      strokes: k.strokes,
      level,
    });
  }
  return out;
}

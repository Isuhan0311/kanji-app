import type { Level, WordEntry } from '../../src/types';

const HAS_KANJI = /[㐀-鿿]/u;

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { fields.push(cur); cur = ''; }
    else cur += ch;
  }
  fields.push(cur);
  return fields;
}

export function parseVocab(
  csv: string,
  level: Level,
  kanjiSet: Set<string>,
  koOverrides: Record<string, string>,
): WordEntry[] {
  const lines = csv.split('\n').map((l) => l.replace(/\r$/, ''));
  const out = new Map<string, WordEntry>();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const [expression, reading, meaning] = parseCsvLine(line);
    const surface = (expression ?? '').trim();
    if (!surface || out.has(surface)) continue;
    const kanjiChars = [...surface].filter((c) => HAS_KANJI.test(c));
    if (kanjiChars.length === 0) continue;
    if (!kanjiChars.every((c) => kanjiSet.has(c))) continue;
    out.set(surface, {
      surface,
      reading: reading?.trim() || surface,
      meaningKo: koOverrides[surface] ?? '',
      meaningEn: meaning ?? '',
      kanji: [...new Set(kanjiChars)],
      level,
    });
  }
  return [...out.values()];
}

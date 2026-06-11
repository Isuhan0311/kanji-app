import type { ParsedKanji } from './parse-kanji-source';

export function parseHanjaKo(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of text.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [, hanja, hunum] = line.split(':');
    if (!hanja || !hunum) continue;
    if (!map.has(hanja)) map.set(hanja, hunum.trim());
  }
  return map;
}

export type KanjiWithHunum = ParsedKanji & { hunum: string };

export function mergeHunum(
  kanji: ParsedKanji[],
  hunumMap: Map<string, string>,
  overrides: Record<string, string>,
): { merged: KanjiWithHunum[]; missing: string[] } {
  const missing: string[] = [];
  const merged = kanji.map((k) => {
    const hunum = overrides[k.id] ?? hunumMap.get(k.id) ?? '';
    if (!hunum) missing.push(k.id);
    return { ...k, hunum };
  });
  return { merged, missing };
}

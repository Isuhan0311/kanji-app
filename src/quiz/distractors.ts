import type { KanjiEntry, KanjiGroup, WordEntry } from '../types';

const DAKUTEN: Record<string, string> = {
  か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご',
  さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ',
  た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど',
  は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ',
};
const REVERSE = Object.fromEntries(Object.entries(DAKUTEN).map(([a, b]) => [b, a]));

export function shuffled<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mutations(reading: string): string[] {
  const out = new Set<string>();
  const chars = [...reading];
  for (let i = 0; i < chars.length; i++) {
    const swap = DAKUTEN[chars[i]] ?? REVERSE[chars[i]];
    if (swap) out.add([...chars.slice(0, i), swap, ...chars.slice(i + 1)].join(''));
  }
  if (reading.includes('ょう')) out.add(reading.replace('ょう', 'ょ'));
  else if (reading.includes('ょ')) out.add(reading.replace('ょ', 'ょう'));
  if (reading.includes('ゅう')) out.add(reading.replace('ゅう', 'ゅ'));
  else if (reading.includes('ゅ')) out.add(reading.replace('ゅ', 'ゅう'));
  if (reading.endsWith('う')) out.add(reading.slice(0, -1));
  else out.add(reading + 'う');
  out.delete(reading);
  return [...out];
}

export function readingDistractors(
  word: WordEntry,
  pool: WordEntry[],
  rand: () => number,
): string[] {
  const picked = new Set<string>();
  for (const m of shuffled(mutations(word.reading), rand)) {
    if (picked.size >= 3) break;
    picked.add(m);
  }
  const fallback = shuffled(
    pool.map((w) => w.reading).filter((r) => r !== word.reading),
    rand,
  );
  for (const r of fallback) {
    if (picked.size >= 3) break;
    picked.add(r);
  }
  return [...picked].slice(0, 3);
}

export function kanjiDistractors(
  word: WordEntry,
  kanjiPool: KanjiEntry[],
  groups: KanjiGroup[],
  rand: () => number,
): string[] {
  const chars = [...word.surface];
  const targets = chars
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => kanjiPool.some((k) => k.id === c));
  const picked = new Set<string>();

  const similarTo = (c: string): string[] => {
    const group = groups.find((g) => g.kanji.includes(c));
    const sameGroup = group ? group.kanji.filter((k) => k !== c) : [];
    const sameLevel = kanjiPool
      .filter((k) => k.id !== c && !sameGroup.includes(k.id))
      .map((k) => k.id);
    return [...shuffled(sameGroup, rand), ...shuffled(sameLevel, rand)];
  };

  outer: for (const { c, i } of shuffled(targets, rand)) {
    for (const repl of similarTo(c)) {
      const variant = [...chars.slice(0, i), repl, ...chars.slice(i + 1)].join('');
      if (variant !== word.surface && !picked.has(variant)) {
        picked.add(variant);
        if (picked.size >= 3) break outer;
      }
    }
  }
  return [...picked].slice(0, 3);
}

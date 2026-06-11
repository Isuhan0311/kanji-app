import type { SentenceEntry, WordEntry } from '../../src/types';

function parseTsv(text: string): Map<number, string> {
  const map = new Map<number, string>();
  for (const line of text.split('\n')) {
    const [id, , sentence] = line.split('\t');
    if (id && sentence) map.set(Number(id), sentence.trim());
  }
  return map;
}

export function buildSentences(
  jpnTsv: string,
  korTsv: string,
  linksTsv: string,
  words: WordEntry[],
  maxPerWord = 2,
  maxLength = 40,
): SentenceEntry[] {
  const jpn = parseTsv(jpnTsv);
  const kor = parseTsv(korTsv);

  const jpnToKor = new Map<number, number>();
  for (const line of linksTsv.split('\n')) {
    const [a, b] = line.split('\t').map(Number);
    if (jpn.has(a) && kor.has(b) && !jpnToKor.has(a)) jpnToKor.set(a, b);
  }

  // 첫 글자 → 후보 문장 id 색인 (단어 수 × 문장 수 전수 비교 회피)
  const index = new Map<string, number[]>();
  for (const [id, text] of jpn) {
    if (!jpnToKor.has(id) || text.length > maxLength) continue;
    for (const ch of new Set([...text])) {
      index.set(ch, [...(index.get(ch) ?? []), id]);
    }
  }

  const out: SentenceEntry[] = [];
  for (const w of words) {
    let count = 0;
    for (const id of index.get(w.surface[0]) ?? []) {
      if (count >= maxPerWord) break;
      const text = jpn.get(id)!;
      if (!text.includes(w.surface)) continue;
      out.push({
        id,
        japanese: text,
        targetWord: w.surface,
        reading: w.reading,
        translationKo: kor.get(jpnToKor.get(id)!)!,
      });
      count++;
    }
  }
  return out;
}

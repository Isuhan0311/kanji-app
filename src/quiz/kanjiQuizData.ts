import type { KanjiEntry, WordEntry, SentenceEntry } from '../types';

export interface KanjiQuizItem {
  k: string;
  on: string;
  kun: string;
  m: string;
  onw: string; onwr: string; onwm: string;
  s: string; sm: string;
  kunw?: string; kunwr?: string; kunwm?: string;
}

export function buildKanjiQuizPool(
  kanji: KanjiEntry[],
  words: WordEntry[],
  sentences: SentenceEntry[],
): KanjiQuizItem[] {
  const result: KanjiQuizItem[] = [];

  for (const k of kanji) {
    if (k.isPart) continue;
    if (!k.onyomi.length) continue;

    const on = k.onyomi[0];
    const kun = k.kunyomi.length ? k.kunyomi[0].split('(')[0] : '';
    // hunum: "쉴 휴" → drop last space-separated token (kanji name)
    const parts = k.hunum.split(' ');
    const m = parts.length > 1 ? parts.slice(0, -1).join(' ') : k.hunum;

    // on'yomi representative word
    const onWord = words.find((w) => w.kanji.includes(k.id));
    if (!onWord) continue;

    const item: KanjiQuizItem = {
      k: k.id, on, kun, m,
      onw: onWord.surface, onwr: onWord.reading, onwm: onWord.meaningKo,
      s: '', sm: '',
    };

    // kun'yomi representative word
    if (kun) {
      const kunWord = words.find(
        (w) => w.kanji.includes(k.id) && w.reading.startsWith(kun) && w.surface !== onWord.surface,
      );
      if (kunWord) {
        item.kunw = kunWord.surface;
        item.kunwr = kunWord.reading;
        item.kunwm = kunWord.meaningKo;
      }
    }

    // sentence
    const sent = sentences.find((s) => s.targetWord.includes(k.id));
    if (sent) {
      item.s = sent.japanese.replace(sent.targetWord, `___`);
      item.sm = sent.translationKo;
    }

    result.push(item);
  }

  return result;
}

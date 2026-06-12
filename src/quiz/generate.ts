import type { KanjiEntry, KanjiGroup, SentenceEntry, WordEntry } from '../types';
import type { KanjiStat } from '../db/progress';
import { weight, pickWeighted } from '../db/progress';
import { readingDistractors, kanjiDistractors, shuffled } from './distractors';

export type QuestionType = 'word-reading' | 'word-meaning' | 'sentence-reading' | 'sentence-kanji';

export interface Question {
  type: QuestionType;
  prompt: string;          // 화면 안내문
  sentence?: string;       // 문장 문제일 때 표시할 문장
  underlined: string;      // 밑줄 칠 부분 (단어 표기 또는 읽기)
  choices: string[];
  answerIndex: number;
  kanjiIds: string[];      // 진도 기록 대상
  explanation: string;
  breakdown: string;       // e.g. "休(쉴 휴) + 日(날 일)"
}

interface Options {
  words: WordEntry[];
  sentences: SentenceEntry[];
  kanji: KanjiEntry[];
  groups: KanjiGroup[];
  stats: Map<string, KanjiStat>;
  count: number;
  rand?: () => number;
}

function insertAnswer(distractors: string[], answer: string, rand: () => number) {
  const answerIndex = Math.floor(rand() * (distractors.length + 1));
  const choices = [...distractors];
  choices.splice(answerIndex, 0, answer);
  return { choices, answerIndex };
}

export function generateQuiz(opts: Options): Question[] {
  const { words, sentences, kanji, groups, stats, count } = opts;
  const rand = opts.rand ?? Math.random;
  const explain = (w: WordEntry) =>
    `${w.surface}(${w.reading}) — ${w.meaningKo || w.meaningEn}`;
  const buildBreakdown = (w: WordEntry) => {
    const kanjiMap = new Map(kanji.map((k) => [k.id, k]));
    return w.kanji
      .map((id) => { const k = kanjiMap.get(id); return k ? `${id}(${k.hunum})` : null; })
      .filter((s): s is string => s !== null)
      .join(' + ');
  };
  const wordWeight = (w: WordEntry) =>
    Math.max(...w.kanji.map((id) => weight(stats.get(id))));
  const sentenceByWord = new Map<string, SentenceEntry[]>();
  for (const s of sentences) {
    sentenceByWord.set(s.targetWord, [...(sentenceByWord.get(s.targetWord) ?? []), s]);
  }

  const types: QuestionType[] = ['word-reading', 'word-meaning', 'sentence-reading', 'sentence-kanji'];
  const out: Question[] = [];
  const used = new Set<string>();
  // cursor advances on every iteration (even continue), preventing infinite retry
  // on the same type when its pool is empty
  let cursor = 0;
  const guard = count * 30;

  for (let iter = 0; iter < guard && out.length < count; iter++) {
    const type = types[cursor % types.length];
    cursor++;

    const pool = words.filter((w) => {
      if (used.has(type + w.surface)) return false;
      if (type === 'word-meaning' && !w.meaningKo) return false;
      if (type.startsWith('sentence') && !sentenceByWord.has(w.surface)) return false;
      return true;
    });
    if (pool.length === 0) continue; // advance to next type

    const word = pickWeighted(pool, wordWeight, rand);
    used.add(type + word.surface);

    if (type === 'word-reading' || type === 'sentence-reading') {
      const distractors = readingDistractors(word, words, rand);
      if (distractors.length < 3) continue;
      const { choices, answerIndex } = insertAnswer(distractors, word.reading, rand);
      const sentence = type === 'sentence-reading'
        ? sentenceByWord.get(word.surface)![0] : undefined;
      out.push({
        type, choices, answerIndex,
        prompt: sentence ? '밑줄 친 단어의 읽기는?' : '이 단어의 읽기는?',
        sentence: sentence?.japanese,
        underlined: word.surface,
        kanjiIds: word.kanji,
        explanation: explain(word),
        breakdown: buildBreakdown(word),
      });
    } else if (type === 'word-meaning') {
      const others = words.filter((w) => w.surface !== word.surface && w.meaningKo);
      if (others.length < 3) continue;
      const distractors = shuffled(
        [...new Set(others.map((w) => w.meaningKo))].filter((m) => m !== word.meaningKo),
        rand,
      ).slice(0, 3);
      if (distractors.length < 3) continue;
      const { choices, answerIndex } = insertAnswer(distractors, word.meaningKo, rand);
      out.push({
        type, choices, answerIndex,
        prompt: '이 단어의 뜻은?',
        underlined: word.surface,
        kanjiIds: word.kanji,
        explanation: explain(word),
        breakdown: buildBreakdown(word),
      });
    } else {
      // sentence-kanji
      const distractors = kanjiDistractors(word, kanji, groups, rand);
      if (distractors.length < 3) continue;
      const sentence = sentenceByWord.get(word.surface)![0];
      const { choices, answerIndex } = insertAnswer(distractors, word.surface, rand);
      out.push({
        type, choices, answerIndex,
        prompt: '밑줄 친 부분의 올바른 한자는?',
        sentence: sentence.japanese.replace(word.surface, word.reading),
        underlined: word.reading,
        kanjiIds: word.kanji,
        explanation: explain(word),
        breakdown: buildBreakdown(word),
      });
    }
  }
  return out;
}

import { parseKanjiSource } from './parse-kanji-source';
import { test, expect } from 'vitest';

const FIXTURE = JSON.stringify({
  休: {
    strokes: 6, jlpt_new: 5,
    readings_on: ['キュウ'], readings_kun: ['やす.む', 'やす.まる'],
  },
  鬱: {
    strokes: 29, jlpt_new: null,
    readings_on: ['ウツ'], readings_kun: [],
  },
  頂: {
    strokes: 11, jlpt_new: 3,
    readings_on: ['チョウ'], readings_kun: ['いただ.く'],
  },
});

test('N급수가 있는 한자만 추출하고 읽기를 변환한다', () => {
  const out = parseKanjiSource(FIXTURE);
  expect(out).toHaveLength(2);
  const kyuu = out.find((k) => k.id === '休')!;
  expect(kyuu.level).toBe('N5');
  expect(kyuu.onyomi).toEqual(['きゅう']);
  expect(kyuu.kunyomi).toEqual(['やす(む)', 'やす(まる)']);
  expect(kyuu.strokes).toBe(6);
  expect(out.find((k) => k.id === '頂')!.level).toBe('N3');
});

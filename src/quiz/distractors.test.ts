import { readingDistractors, kanjiDistractors } from './distractors';
import { FIX_GROUPS, FIX_KANJI, FIX_WORDS } from '../test/fixtures';
import { mulberry32 } from '../lib/rand';

const kyuujitsu = FIX_WORDS[0]; // 休日 きゅうじつ

test('읽기 오답 3개: 정답과 다르고 서로 다르다', () => {
  const out = readingDistractors(kyuujitsu, FIX_WORDS, mulberry32(1));
  expect(out).toHaveLength(3);
  expect(new Set(out).size).toBe(3);
  expect(out).not.toContain('きゅうじつ');
});

test('한자 오답 3개: 표기가 정답과 다르고 서로 다르다', () => {
  const out = kanjiDistractors(kyuujitsu, FIX_KANJI, FIX_GROUPS, mulberry32(1));
  expect(out).toHaveLength(3);
  expect(new Set(out).size).toBe(3);
  expect(out).not.toContain('休日');
  for (const s of out) expect(s).toHaveLength(2); // 글자 수 유지
});

test('같은 시드면 같은 결과 (결정적)', () => {
  const a = readingDistractors(kyuujitsu, FIX_WORDS, mulberry32(7));
  const b = readingDistractors(kyuujitsu, FIX_WORDS, mulberry32(7));
  expect(a).toEqual(b);
});

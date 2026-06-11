import { kataToHira, formatKun } from './kana';

test('가타카나를 히라가나로 변환한다', () => {
  expect(kataToHira('キュウ')).toBe('きゅう');
  expect(kataToHira('ヘン')).toBe('へん');
});

test('히라가나와 한자는 그대로 둔다', () => {
  expect(kataToHira('やすム')).toBe('やすむ');
  expect(kataToHira('休み')).toBe('休み');
});

test('훈독의 오쿠리가나 점을 괄호 표기로 바꾼다', () => {
  expect(formatKun('やす.む')).toBe('やす(む)');
  expect(formatKun('き')).toBe('き');
});

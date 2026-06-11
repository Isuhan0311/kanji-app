import { parseHanjaKo, mergeHunum } from './parse-hanja-ko';
import type { ParsedKanji } from './parse-kanji-source';

const HANJA_TXT = [
  '# comment line',
  '휴:休:쉴 휴',
  '변:變:변할 변',
  '변:變:변할 변',
  '',
].join('\n');

test('hanja.txt에서 한자→훈음 맵을 만든다', () => {
  const map = parseHanjaKo(HANJA_TXT);
  expect(map.get('休')).toBe('쉴 휴');
  expect(map.get('變')).toBe('변할 변');
  expect(map.has('#')).toBe(false);
});

const KANJI: ParsedKanji[] = [
  { id: '休', onyomi: ['きゅう'], kunyomi: ['やす(む)'], strokes: 6, level: 'N5' },
  { id: '頂', onyomi: ['ちょう'], kunyomi: ['いただ(く)'], strokes: 11, level: 'N3' },
];

test('훈음을 병합하고, 오버라이드가 우선하며, 누락 목록을 보고한다', () => {
  const map = new Map([['休', '쉴 휴']]);
  const { merged, missing } = mergeHunum(KANJI, map, { 頂: '정수리 정' });
  expect(merged.find((k) => k.id === '休')!.hunum).toBe('쉴 휴');
  expect(merged.find((k) => k.id === '頂')!.hunum).toBe('정수리 정');
  expect(missing).toEqual([]);
});

test('맵에도 오버라이드에도 없으면 missing에 들어간다', () => {
  const { merged, missing } = mergeHunum(KANJI, new Map(), {});
  expect(missing).toEqual(['休', '頂']);
  expect(merged.find((k) => k.id === '休')!.hunum).toBe('');
});

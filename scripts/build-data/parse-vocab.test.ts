import { parseVocab } from './parse-vocab';
import { test, expect } from 'vitest';

const FIXTURE = [
  'expression,reading,meaning,tags',
  '休日,きゅうじつ,holiday,JLPT JLPT_N5',
  '休日,きゅうじつ,holiday (dup),JLPT JLPT_N5',
  'ねこ,ねこ,cat,JLPT JLPT_N5',
  '挨拶,あいさつ,greeting,JLPT JLPT_N5',
  '木,き,"tree, wood",JLPT JLPT_N5',
].join('\n');

const KANJI_SET = new Set(['休', '日', '木']);

test('범위 내 한자로만 이루어진 단어를 추출하고 중복을 제거한다', () => {
  const out = parseVocab(FIXTURE, 'N5', KANJI_SET, { 休日: '휴일' });
  expect(out).toHaveLength(2);
  const word = out.find((w) => w.surface === '休日')!;
  expect(word.reading).toBe('きゅうじつ');
  expect(word.meaningKo).toBe('휴일');
  expect(word.meaningEn).toBe('holiday');
  expect(word.kanji).toEqual(['休', '日']);
  expect(word.level).toBe('N5');
  const tree = out.find((w) => w.surface === '木')!;
  expect(tree.meaningKo).toBe('');
  expect(tree.meaningEn).toBe('tree, wood'); // 따옴표 안 쉼표 처리
});

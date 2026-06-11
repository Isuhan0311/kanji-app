import { describe, test, expect } from 'vitest';
import { parseIds, expandComponents } from './parse-ids';

const IDS_TXT = [
  ';; comment',
  'U+4F11\t休\t⿰亻木',
  'U+6797\t林\t⿰木木',
  'U+68EE\t森\t⿱木林',
  'U+76F8\t相\t⿰木目\t⿰木目[GT]',
  'U+672C\t本\t⿻木一',
].join('\n');

test('직접 구성요소를 추출한다 (IDC 연산자와 자기 자신 제외)', () => {
  const direct = parseIds(IDS_TXT);
  expect(direct.get('休')).toEqual(['亻', '木']);
  expect(direct.get('林')).toEqual(['木']);
  expect(direct.get('相')).toEqual(['木', '目']);
});

test('구성요소를 재귀 확장한다', () => {
  const direct = parseIds(IDS_TXT);
  const all = expandComponents(direct);
  expect(all.get('森')).toEqual(new Set(['木', '林']));
});

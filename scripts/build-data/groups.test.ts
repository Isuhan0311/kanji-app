import { buildGroups, applyGroupOverrides } from './groups';
import { parseIds, expandComponents } from './parse-ids';
import type { KanjiWithHunum } from './parse-hanja-ko';

function k(id: string, strokes: number, level: 'N5' | 'N4' = 'N5'): KanjiWithHunum {
  return { id, strokes, level, hunum: '', onyomi: [], kunyomi: [] };
}

const IDS_TXT = [
  'U+4F11\t休\t⿰亻木',
  'U+6797\t林\t⿰木木',
  'U+76F8\t相\t⿰木目',
  'U+672C\t本\t⿻木一',
  'U+4E00\t一\t一',
  'U+6728\t木\t木',
  'U+76EE\t目\t目',
  'U+5186\t円\t⿵冂土',
].join('\n');

function setup() {
  const kanji = [k('木', 4), k('休', 6), k('林', 8), k('相', 9), k('本', 5), k('目', 5), k('円', 4)];
  const direct = parseIds(IDS_TXT);
  return { kanji, direct, all: expandComponents(direct) };
}

test('기본자별로 그룹을 만들고 모든 한자를 정확히 1개 그룹에 배정한다', () => {
  const { kanji, direct, all } = setup();
  const { groups, assignment } = buildGroups(kanji, direct, all);
  expect(assignment.get('休')).toBe('木');
  expect(assignment.get('林')).toBe('木');
  expect(assignment.get('本')).toBe('木');
  expect(assignment.get('木')).toBe('木');
  expect(assignment.get('相')).toBe('目'); // 木(4획) vs 目(5획) → 획수 큰 쪽
  expect(assignment.get('目')).toBe('目');
  expect(assignment.get('円')).toBe('misc-N5'); // 구성요소가 집합에 없음
  const wood = groups.find((g) => g.id === '木')!;
  expect(wood.name).toBe('木의 파생');
  expect(new Set(wood.kanji)).toEqual(new Set(['木', '休', '林', '本']));
  expect(kanji.every((x) => assignment.has(x.id))).toBe(true);
});

test('오버라이드로 그룹 이동과 이름 변경이 된다', () => {
  const { kanji, direct, all } = setup();
  const built = buildGroups(kanji, direct, all);
  const out = applyGroupOverrides(built, {
    moves: { 相: '木' },
    names: { 木: '나무 가족' },
  });
  expect(out.assignment.get('相')).toBe('木');
  expect(out.groups.find((g) => g.id === '木')!.kanji).toContain('相');
  expect(out.groups.find((g) => g.id === '木')!.name).toBe('나무 가족');
  expect(out.groups.find((g) => g.id === '目')!.kanji).toEqual(['目']);
});

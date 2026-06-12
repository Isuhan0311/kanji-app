import { describe, expect, test } from 'vitest';
import { detectParts, orderGroupKanji } from './parts';
import type { KanjiEntry, KanjiGroup } from '../../src/types';

// Fixture: 田 group
// Members: 田(base), 福, 富, 男
// 畐 is not in kanjiSet, is in named, recursive components of 畐 include 田,
// 畐 is a direct component of both 福 and 富.
// 男 is not derived from 畐.

const FIX_MEMBERS: KanjiEntry[] = [
  { id: '田', hunum: '밭 전', onyomi: ['でん'], kunyomi: ['た'], strokes: 5, level: 'N4', groupId: '田' },
  { id: '福', hunum: '복 복', onyomi: ['ふく'], kunyomi: [], strokes: 13, level: 'N3', groupId: '田' },
  { id: '富', hunum: '부자 부', onyomi: ['ふ', 'ふう'], kunyomi: ['とみ'], strokes: 12, level: 'N2', groupId: '田' },
  { id: '男', hunum: '사내 남', onyomi: ['だん'], kunyomi: ['おとこ'], strokes: 7, level: 'N4', groupId: '田' },
];

const FIX_GROUP: KanjiGroup = {
  id: '田',
  base: '田',
  name: '田의 파생',
  kanji: ['田', '福', '富', '男'],
};

const kanjiByGroup = new Map<string, KanjiEntry[]>([['田', FIX_MEMBERS]]);
const kanjiSet = new Set(['田', '福', '富', '男']);
const named = new Set(['畐', '田', '男']); // 畐 is named (non-kanji part)

// direct: 福→[畐,...], 富→[畐,...], 男→[田,力], 畐→[田,口]
const direct = new Map<string, string[]>([
  ['福', ['畐', '示']],
  ['富', ['畐', '宀']],
  ['男', ['田', '力']],
  ['畐', ['田', '口']],
  ['田', []],
]);

// expandComponents-like all map for 畐: recursive components = {田, 口}
const all = new Map<string, Set<string>>([
  ['田', new Set()],
  ['男', new Set(['田', '力'])],
  ['福', new Set(['畐', '示', '田', '口'])],
  ['富', new Set(['畐', '宀', '田', '口'])],
  ['畐', new Set(['田', '口'])],  // 畐 contains 田 recursively
]);

describe('detectParts', () => {
  test('畐가 田 그룹의 part로 탐지된다', () => {
    const parts = detectParts([FIX_GROUP], kanjiByGroup, direct, all, kanjiSet, named);
    expect(parts).toHaveLength(1);
    expect(parts[0].id).toBe('畐');
    expect(parts[0].groupId).toBe('田');
    expect(parts[0].derived.sort()).toEqual(['福', '富'].sort());
  });

  test('level은 derived 멤버 중 가장 낮은 급수', () => {
    // 福=N3, 富=N2 → N3
    const parts = detectParts([FIX_GROUP], kanjiByGroup, direct, all, kanjiSet, named);
    expect(parts[0].level).toBe('N3');
  });

  test('misc 그룹은 무시된다', () => {
    const miscGroup: KanjiGroup = { id: 'misc-N4', base: '', name: '기타 (N4)', kanji: ['男'] };
    const parts = detectParts([miscGroup], kanjiByGroup, direct, all, kanjiSet, named);
    expect(parts).toHaveLength(0);
  });

  test('직접 구성요소가 1개 멤버에만 있으면 part 아님', () => {
    // 示 is named but only in 福, not ≥2 members
    const namedWith示 = new Set([...named, '示']);
    const all2 = new Map(all);
    all2.set('示', new Set(['田'])); // 示 contains 田
    const direct2 = new Map(direct);
    direct2.set('福', ['畐', '示']);
    const parts = detectParts([FIX_GROUP], kanjiByGroup, direct2, all2, kanjiSet, namedWith示);
    // 畐 still detected (2 members), 示 not (only 1 member = 福)
    expect(parts.map((p) => p.id)).toContain('畐');
    expect(parts.map((p) => p.id)).not.toContain('示');
  });
});

describe('orderGroupKanji', () => {
  test('田→男→畐→福→富 순서', () => {
    const parts = detectParts([FIX_GROUP], kanjiByGroup, direct, all, kanjiSet, named);
    const order = orderGroupKanji(FIX_GROUP, FIX_MEMBERS, parts);
    expect(order).toEqual(['田', '男', '畐', '福', '富']);
  });

  test('part 없는 그룹은 base 먼저, 나머지 원래 순서', () => {
    const simpleGroup: KanjiGroup = { id: '木', base: '木', name: '木의 파생', kanji: ['木', '休', '林'] };
    const simpleMembers: KanjiEntry[] = [
      { id: '木', hunum: '나무 목', onyomi: [], kunyomi: [], strokes: 4, level: 'N5', groupId: '木' },
      { id: '休', hunum: '쉴 휴', onyomi: [], kunyomi: [], strokes: 6, level: 'N5', groupId: '木' },
      { id: '林', hunum: '수풀 림', onyomi: [], kunyomi: [], strokes: 8, level: 'N5', groupId: '木' },
    ];
    const order = orderGroupKanji(simpleGroup, simpleMembers, []);
    expect(order).toEqual(['木', '休', '林']);
  });
});

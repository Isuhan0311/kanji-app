import { describe, expect, test } from 'vitest';
import { mergeSmallGroups } from './groups';
import { orderGroupKanji } from './parts';
import type { KanjiWithHunum } from './parse-hanja-ko';
import type { KanjiEntry, KanjiGroup } from '../../src/types';

// Fixture layout:
//  木 group: [木, 休, 林]           木 has 4 strokes
//  未 group: [未, 味, 妹]           未 derives from 木 (direct: 未→[木])
//  早 group: [早, 朝]               早 derives from 日 (direct: 早→[日])
//  日 group: [日, 明]
//
// maxSize 3 → 未 group (3 members) and 早 group (2 members) should merge.
// 未 → 木 (未 direct contains 木, 木 is a base of another group)
// 早 → 日 (早 direct contains 日, 日 is a base of another group)

function k(id: string, strokes: number): KanjiWithHunum {
  return { id, strokes, level: 'N5', hunum: '', onyomi: [], kunyomi: [] };
}

function makeFixture() {
  const kanjiById = new Map<string, KanjiWithHunum>([
    ['木', k('木', 4)],
    ['休', k('休', 6)],
    ['林', k('林', 8)],
    ['未', k('未', 5)],
    ['味', k('味', 8)],
    ['妹', k('妹', 8)],
    ['早', k('早', 6)],
    ['朝', k('朝', 12)],
    ['日', k('日', 4)],
    ['明', k('明', 8)],
  ]);

  // direct components for each kanji
  const direct = new Map<string, string[]>([
    ['木', []],
    ['休', ['亻', '木']],
    ['林', ['木', '木']],
    ['未', ['木']],        // 未 directly contains 木
    ['味', ['口', '未']],
    ['妹', ['女', '未']],
    ['早', ['日']],        // 早 directly contains 日
    ['朝', ['早', '月']],
    ['日', []],
    ['明', ['日', '月']],
  ]);

  // all components (recursive)
  const all = new Map<string, Set<string>>([
    ['木', new Set()],
    ['休', new Set(['亻', '木'])],
    ['林', new Set(['木'])],
    ['未', new Set(['木'])],
    ['味', new Set(['口', '未', '木'])],
    ['妹', new Set(['女', '未', '木'])],
    ['早', new Set(['日'])],
    ['朝', new Set(['早', '月', '日'])],
    ['日', new Set()],
    ['明', new Set(['日', '月'])],
  ]);

  // built groups — these mirror what buildGroups would produce
  const assignment = new Map<string, string>([
    ['木', '木'],
    ['休', '木'],
    ['林', '木'],
    ['未', '未'],
    ['味', '未'],
    ['妹', '未'],
    ['早', '早'],
    ['朝', '早'],
    ['日', '日'],
    ['明', '日'],
  ]);
  const groups: KanjiGroup[] = [
    { id: '木', base: '木', name: '木의 파생', kanji: ['木', '休', '林'] },
    { id: '未', base: '未', name: '未의 파생', kanji: ['未', '味', '妹'] },
    { id: '早', base: '早', name: '早의 파생', kanji: ['早', '朝'] },
    { id: '日', base: '日', name: '日의 파생', kanji: ['日', '明'] },
  ];

  return { kanjiById, direct, all, assignment, groups };
}

describe('mergeSmallGroups', () => {
  test('未 그룹(크기 3)이 木 그룹으로 병합된다', () => {
    const { kanjiById, direct, all, assignment, groups } = makeFixture();
    const built = { groups, assignment };
    const result = mergeSmallGroups(built, kanjiById, direct, all, 3);

    // 未 그룹이 사라지고 모든 멤버가 木에 할당되어야 한다
    expect(result.built.assignment.get('未')).toBe('木');
    expect(result.built.assignment.get('味')).toBe('木');
    expect(result.built.assignment.get('妹')).toBe('木');
    expect(result.built.groups.find((g) => g.id === '未')).toBeUndefined();
  });

  test('早 그룹(크기 2)이 日 그룹으로 병합된다', () => {
    const { kanjiById, direct, all, assignment, groups } = makeFixture();
    const built = { groups, assignment };
    const result = mergeSmallGroups(built, kanjiById, direct, all, 3);

    expect(result.built.assignment.get('早')).toBe('日');
    expect(result.built.assignment.get('朝')).toBe('日');
    expect(result.built.groups.find((g) => g.id === '早')).toBeUndefined();
  });

  test('subs map에 MergedSub 레코드가 기록된다', () => {
    const { kanjiById, direct, all, assignment, groups } = makeFixture();
    const built = { groups, assignment };
    const result = mergeSmallGroups(built, kanjiById, direct, all, 3);

    const woodSubs = result.subs.get('木');
    expect(woodSubs).toBeDefined();
    expect(woodSubs!.length).toBeGreaterThanOrEqual(1);
    const miSub = woodSubs!.find((s) => s.baseId === '未');
    expect(miSub).toBeDefined();
    expect(miSub!.members).toEqual(['味', '妹']);
  });

  test('木 그룹(크기 3)은 maxSize 3이어도 병합 대상이 아니다 (parent 없어야 유지)', () => {
    // 木 has no parent base in any other group (木 has no direct components that are group bases)
    const { kanjiById, direct, all, assignment, groups } = makeFixture();
    const built = { groups, assignment };
    const result = mergeSmallGroups(built, kanjiById, direct, all, 3);

    // 木 group still exists (no parent to merge into)
    expect(result.built.groups.find((g) => g.id === '木')).toBeDefined();
  });

  test('maxSize 1이면 어떤 그룹도 병합되지 않는다 (2+멤버 그룹은 모두 유지)', () => {
    const { kanjiById, direct, all, assignment, groups } = makeFixture();
    const built = { groups, assignment };
    const result = mergeSmallGroups(built, kanjiById, direct, all, 1);

    // No group has ≤1 member groups (all have ≥2), so nothing merges
    expect(result.built.groups).toHaveLength(4);
    expect(result.subs.size).toBe(0);
  });

  test('병합 후 木 그룹의 kanji 배열이 재구성된다 (未와 파생어 포함)', () => {
    const { kanjiById, direct, all, assignment, groups } = makeFixture();
    const built = { groups, assignment };
    const result = mergeSmallGroups(built, kanjiById, direct, all, 3);

    const woodGroup = result.built.groups.find((g) => g.id === '木')!;
    // 木 group should now contain 木, 休, 林, 未, 味, 妹
    expect(new Set(woodGroup.kanji)).toEqual(new Set(['木', '休', '林', '未', '味', '妹']));
  });
});

describe('orderGroupKanji with subs', () => {
  test('병합된 서브그룹이 base→plain→sub(subBase+members) 순서로 배치된다', () => {
    // Simulate post-merge 木 group
    // Wood group after merge: base=木, members=[木,休,林,未,味,妹], no parts
    // subs for 木: [{baseId: '未', members: ['味', '妹']}]
    const group: KanjiGroup = {
      id: '木',
      base: '木',
      name: '木의 파생',
      kanji: ['木', '休', '林', '未', '味', '妹'],
    };
    const members: KanjiEntry[] = [
      { id: '木', hunum: '나무 목', onyomi: [], kunyomi: [], strokes: 4, level: 'N5', groupId: '木' },
      { id: '休', hunum: '쉴 휴', onyomi: [], kunyomi: [], strokes: 6, level: 'N5', groupId: '木' },
      { id: '林', hunum: '수풀 림', onyomi: [], kunyomi: [], strokes: 8, level: 'N5', groupId: '木' },
      { id: '未', hunum: '아닐 미', onyomi: [], kunyomi: [], strokes: 5, level: 'N5', groupId: '木' },
      { id: '味', hunum: '맛 미', onyomi: [], kunyomi: [], strokes: 8, level: 'N5', groupId: '木' },
      { id: '妹', hunum: '누이 매', onyomi: [], kunyomi: [], strokes: 8, level: 'N5', groupId: '木' },
    ];
    const subs = [{ baseId: '未', members: ['味', '妹'] }];

    const order = orderGroupKanji(group, members, [], subs);
    // Expected: 木 (base), 休, 林 (plain non-sub members), then 未 (subBase), 味, 妹 (sub members)
    expect(order).toEqual(['木', '休', '林', '未', '味', '妹']);
  });

  test('subs 없이 호출하면 기존 동작 유지 (하위 호환)', () => {
    const group: KanjiGroup = {
      id: '木',
      base: '木',
      name: '木의 파생',
      kanji: ['木', '休', '林'],
    };
    const members: KanjiEntry[] = [
      { id: '木', hunum: '나무 목', onyomi: [], kunyomi: [], strokes: 4, level: 'N5', groupId: '木' },
      { id: '休', hunum: '쉴 휴', onyomi: [], kunyomi: [], strokes: 6, level: 'N5', groupId: '木' },
      { id: '林', hunum: '수풀 림', onyomi: [], kunyomi: [], strokes: 8, level: 'N5', groupId: '木' },
    ];
    const order = orderGroupKanji(group, members, []);
    expect(order).toEqual(['木', '休', '林']);
  });
});

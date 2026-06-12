import type { KanjiGroup } from '../../src/types';
import type { KanjiWithHunum } from './parse-hanja-ko';

export interface BuiltGroups {
  groups: KanjiGroup[];
  assignment: Map<string, string>; // 한자 → 그룹 id
}

export interface GroupOverrides {
  moves: Record<string, string>;
  names: Record<string, string>;
}

export interface MergedSub {
  baseId: string;   // 병합된 소그룹의 기본자
  members: string[]; // 소그룹의 비기본자 멤버들 (순서 유지)
}

export function buildGroups(
  kanji: KanjiWithHunum[],
  direct: Map<string, string[]>,
  all: Map<string, Set<string>>,
): BuiltGroups {
  const inSet = new Map(kanji.map((k) => [k.id, k]));

  const usedAsComponent = new Set<string>();
  for (const k of kanji) {
    for (const c of all.get(k.id) ?? []) {
      if (inSet.has(c)) usedAsComponent.add(c);
    }
  }

  const pick = (candidates: string[]): string | undefined => {
    const bases = candidates.filter((c) => usedAsComponent.has(c) && inSet.has(c));
    if (bases.length === 0) return undefined;
    return bases.sort(
      (a, b) =>
        (inSet.get(b)!.strokes - inSet.get(a)!.strokes) || a.localeCompare(b),
    )[0];
  };

  const assignment = new Map<string, string>();
  for (const k of kanji) {
    if (usedAsComponent.has(k.id)) {
      assignment.set(k.id, k.id); // 기본자는 자기 그룹
      continue;
    }
    const base =
      pick(direct.get(k.id) ?? []) ?? pick([...(all.get(k.id) ?? [])]);
    assignment.set(k.id, base ?? `misc-${k.level}`);
  }

  return { groups: groupsFromAssignment(assignment), assignment };
}

export function groupsFromAssignment(assignment: Map<string, string>): KanjiGroup[] {
  const byId = new Map<string, string[]>();
  for (const [k, g] of assignment) {
    byId.set(g, [...(byId.get(g) ?? []), k]);
  }
  return [...byId.entries()].map(([id, members]) => ({
    id,
    base: id.startsWith('misc-') ? '' : id,
    name: id.startsWith('misc-') ? `기타 (${id.slice(5)})` : `${id}의 파생`,
    kanji: members.sort(),
  }));
}

export function applyGroupOverrides(
  built: BuiltGroups,
  overrides: GroupOverrides,
): BuiltGroups {
  const assignment = new Map(built.assignment);
  for (const [k, g] of Object.entries(overrides.moves)) {
    if (assignment.has(k)) assignment.set(k, g);
  }
  const groups = groupsFromAssignment(assignment);
  for (const g of groups) {
    if (overrides.names[g.id]) g.name = overrides.names[g.id];
  }
  return { groups, assignment };
}

/**
 * 크기가 maxSize 이하인 비-misc 파생 그룹을, 기본자의 구성요소 중
 * 다른 그룹의 기본자인 한자를 상위 그룹으로 삼아 병합한다.
 *
 * @param built      applyGroupOverrides 결과
 * @param kanjiById  한자 id → KanjiWithHunum (획수 참조용)
 * @param direct     직접 구성요소 맵
 * @param all        재귀 구성요소 맵
 * @param maxSize    이 크기 이하(기본자 포함)인 그룹을 병합 후보로 삼음
 * @returns          병합된 BuiltGroups와 subs 맵
 *                   subs: 상위 그룹 id → 병합된 소그룹 목록(순서대로)
 */
export function mergeSmallGroups(
  built: BuiltGroups,
  kanjiById: Map<string, KanjiWithHunum>,
  direct: Map<string, string[]>,
  all: Map<string, Set<string>>,
  maxSize: number,
): { built: BuiltGroups; subs: Map<string, MergedSub[]> } {
  // 현재 그룹들의 id 집합 (기본자 집합)
  const groupIds = new Set(built.groups.filter((g) => !g.id.startsWith('misc-')).map((g) => g.id));

  // 후보: non-misc 그룹 중 kanji.length <= maxSize
  const candidates = built.groups.filter(
    (g) => !g.id.startsWith('misc-') && g.kanji.length <= maxSize,
  );

  // 각 후보 그룹의 기본자 b에 대해, b의 직접/재귀 구성요소 중
  // 다른 그룹의 기본자인 것을 찾아 상위 그룹으로 결정한다 (max strokes 우선)
  function findParent(baseId: string): string | undefined {
    // 자기 자신 제외
    const pickCandidates = (ids: string[]) =>
      ids.filter((c) => c !== baseId && groupIds.has(c));

    const directComps = pickCandidates(direct.get(baseId) ?? []);
    const allComps = pickCandidates([...(all.get(baseId) ?? [])]);

    const pool = directComps.length > 0 ? directComps : allComps;
    if (pool.length === 0) return undefined;

    // max strokes, tie-break by localeCompare
    return pool.sort(
      (a, b) =>
        ((kanjiById.get(b)?.strokes ?? 0) - (kanjiById.get(a)?.strokes ?? 0)) ||
        a.localeCompare(b),
    )[0];
  }

  // 각 후보의 직접 parent (없으면 undefined)
  const directParent = new Map<string, string | undefined>();
  for (const g of candidates) {
    directParent.set(g.id, findParent(g.id));
  }

  // union-find 스타일로 최종 parent 해소 (체인 팔로우, 사이클 방지)
  function resolveParent(gId: string, visited = new Set<string>()): string | undefined {
    if (visited.has(gId)) return undefined; // 사이클 차단
    visited.add(gId);
    const p = directParent.get(gId);
    if (p === undefined) return undefined;
    // p 자체가 병합 대상이면 p의 최종 parent로 계속 따라감
    if (directParent.has(p) && directParent.get(p) !== undefined) {
      return resolveParent(p, visited) ?? p;
    }
    return p;
  }

  // 크기 오름차순으로 처리 (작은 그룹 먼저)
  const sorted = [...candidates].sort((a, b) => a.kanji.length - b.kanji.length);

  // assignment 복사 후 병합 적용
  const assignment = new Map(built.assignment);

  // subs: parentId → MergedSub[]
  const rawSubs = new Map<string, MergedSub[]>();

  for (const g of sorted) {
    const parent = resolveParent(g.id);
    if (parent === undefined) continue;

    // g의 기본자 b와 비기본자 멤버들을 parent에 재할당
    const nonBaseMembers = g.kanji.filter((k) => k !== g.id).sort();
    for (const k of g.kanji) {
      assignment.set(k, parent);
    }

    // rawSubs에 기록: parent(또는 g 자신이 이미 다른 그룹에 병합됐다면 그 최종 parent)가 키
    const list = rawSubs.get(parent) ?? [];
    list.push({ baseId: g.id, members: nonBaseMembers });
    rawSubs.set(parent, list);

    // groupIds에서 g를 제거해야 이후 체인 해소가 올바르게 동작
    groupIds.delete(g.id);
  }

  // groups 재구성
  const newGroups = groupsFromAssignment(assignment);

  // 기존 그룹 이름 보존 (생존 그룹만)
  const oldNameMap = new Map(built.groups.map((g) => [g.id, g.name]));
  for (const g of newGroups) {
    const old = oldNameMap.get(g.id);
    if (old) g.name = old;
  }

  return {
    built: { groups: newGroups, assignment },
    subs: rawSubs,
  };
}

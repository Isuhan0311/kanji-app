import { LEVELS, type KanjiEntry, type KanjiGroup, type Level } from '../../src/types';
import type { MergedSub } from './groups';

export interface PartInfo {
  id: string;
  groupId: string;
  derived: string[];
  level: Level;
}

/**
 * 학습 한자 집합에 없지만 component-names에 이름이 있고,
 * 그룹 기본자를 재귀 구성요소로 포함하면서,
 * 그룹 멤버 중 ≥2명의 직접 구성요소인 중간 부품을 탐지한다.
 */
export function detectParts(
  groups: KanjiGroup[],
  kanjiByGroup: Map<string, KanjiEntry[]>,
  direct: Map<string, string[]>,
  all: Map<string, Set<string>>,
  kanjiSet: Set<string>,
  named: Set<string>,
): PartInfo[] {
  const parts: PartInfo[] = [];

  for (const group of groups) {
    // misc 그룹은 제외
    if (group.id.startsWith('misc-')) continue;

    const base = group.base;
    const members = kanjiByGroup.get(group.id) ?? [];
    if (members.length === 0) continue;

    // 그룹 멤버들의 모든 직접 구성요소를 수집 (학습 한자 아닌 것 중 named인 것)
    const candidateSet = new Map<string, string[]>(); // candidate → derived members
    for (const member of members) {
      for (const comp of direct.get(member.id) ?? []) {
        if (kanjiSet.has(comp)) continue;  // 학습 한자면 제외
        if (!named.has(comp)) continue;    // 이름 없으면 제외
        // 이 부품이 base를 재귀 구성요소로 포함하는지 확인
        const compAll = all.get(comp);
        if (!compAll || !compAll.has(base)) continue;

        const list = candidateSet.get(comp) ?? [];
        list.push(member.id);
        candidateSet.set(comp, list);
      }
    }

    // ≥2 멤버의 직접 구성요소인 후보만 part로 등록
    for (const [comp, derivedIds] of candidateSet) {
      if (derivedIds.length < 2) continue;

      // level = derived 멤버들 중 가장 낮은 급수 (LEVELS 순서상 앞)
      const derivedEntries = derivedIds.map((id) => members.find((m) => m.id === id)!);
      const level = derivedEntries.reduce<Level>((best, m) => {
        return LEVELS.indexOf(m.level) < LEVELS.indexOf(best) ? m.level : best;
      }, derivedEntries[0].level);

      parts.push({ id: comp, groupId: group.id, derived: derivedIds, level });
    }
  }

  return parts;
}

/**
 * 그룹의 한자 배열을 재정렬한다:
 * 1. base가 멤버이면 맨 앞
 * 2. 어떤 part/sub의 derived도 아닌 멤버 (현재 순서 유지)
 * 3. 각 merged sub마다: subBase, 그 sub members
 * 4. 각 part마다: part.id, 그 derived 멤버들 (먼저 나온 part에서 처리된 멤버는 건너뜀)
 *
 * @param subs  mergeSmallGroups에서 반환한 이 그룹의 MergedSub 목록 (없으면 빈 배열)
 */
export function orderGroupKanji(
  group: KanjiGroup,
  members: KanjiEntry[],
  parts: PartInfo[],
  subs: MergedSub[] = [],
): string[] {
  const groupParts = parts.filter((p) => p.groupId === group.id);

  // sub에 속하는 멤버 ID 집합 (subBase 포함)
  const allSubMembers = new Set<string>();
  for (const sub of subs) {
    allSubMembers.add(sub.baseId);
    for (const m of sub.members) allSubMembers.add(m);
  }

  // 어떤 part의 derived인 멤버 ID 집합 (first-come 처리)
  const derivedByPart = new Map<string, string[]>(); // part.id → derived member ids in order
  const allDerived = new Set<string>();

  for (const part of groupParts) {
    const ordered: string[] = [];
    for (const id of part.derived) {
      if (!allDerived.has(id) && !allSubMembers.has(id)) {
        ordered.push(id);
        allDerived.add(id);
      }
    }
    derivedByPart.set(part.id, ordered);
  }

  const result: string[] = [];
  const seen = new Set<string>();

  const addId = (id: string) => {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  };

  // 1. base first
  if (members.find((m) => m.id === group.base)) {
    addId(group.base);
  }

  // 2. non-derived, non-sub members (in original order)
  for (const m of members) {
    if (!allDerived.has(m.id) && !allSubMembers.has(m.id)) {
      addId(m.id);
    }
  }

  // 3. each merged sub: subBase then sub members
  for (const sub of subs) {
    addId(sub.baseId);
    for (const id of sub.members) addId(id);
  }

  // 4. each part then its derived members
  for (const part of groupParts) {
    addId(part.id);
    for (const id of derivedByPart.get(part.id) ?? []) {
      addId(id);
    }
  }

  // safety: add any members not yet seen (shouldn't happen)
  for (const m of members) addId(m.id);

  return result;
}

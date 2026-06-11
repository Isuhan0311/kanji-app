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

function groupsFromAssignment(assignment: Map<string, string>): KanjiGroup[] {
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

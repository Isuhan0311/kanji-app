import type { KanjiEntry, KanjiGroup } from '../../src/types';

export function validateBundle(
  kanji: KanjiEntry[],
  groups: KanjiGroup[],
): string[] {
  const errors: string[] = [];
  const groupIds = new Set(groups.map((g) => g.id));
  const kanjiIds = new Set(kanji.map((k) => k.id));
  for (const k of kanji) {
    if (!groupIds.has(k.groupId)) errors.push(`${k.id}: 존재하지 않는 그룹 "${k.groupId}"`);
    if (!k.hunum) errors.push(`${k.id}: 훈음 누락`);
  }
  for (const g of groups) {
    for (const member of g.kanji) {
      if (!kanjiIds.has(member)) errors.push(`그룹 ${g.id}: 알 수 없는 한자 "${member}"`);
    }
  }
  return errors;
}

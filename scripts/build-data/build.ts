import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { parseKanjiSource } from './parse-kanji-source';
import { parseHanjaKo, mergeHunum } from './parse-hanja-ko';
import { parseIds, expandComponents } from './parse-ids';
import { buildGroups, applyGroupOverrides, type GroupOverrides } from './groups';
import { detectParts, orderGroupKanji } from './parts';
import { parseVocab } from './parse-vocab';
import { buildSentences } from './parse-tatoeba';
import { validateBundle } from './validate';
import { LEVELS, type KanjiEntry } from '../../src/types';

const raw = (f: string) => readFileSync(`data/raw/${f}`, 'utf8');
const json = <T>(f: string): T => JSON.parse(readFileSync(f, 'utf8'));

const kanjiKoOv = json<Record<string, string>>('data/overrides/kanji-ko.json');
const wordsKoOv = json<Record<string, string>>('data/overrides/words-ko.json');
const groupsOv = json<GroupOverrides>('data/overrides/groups.json');
const explainOv = json<Record<string, string>>('data/overrides/explanations.json');
const compNamesOv = json<Record<string, string>>('data/overrides/component-names.json');

const parsed = parseKanjiSource(raw('kanji-jouyou.json'));
const { merged, missing } = mergeHunum(parsed, parseHanjaKo(raw('hanja.txt')), kanjiKoOv);

const direct = parseIds(raw('ids.txt'));
const built = applyGroupOverrides(
  buildGroups(merged, direct, expandComponents(direct)),
  groupsOv,
);

const compNotesOv: Record<string, string> = existsSync('data/overrides/component-notes.json')
  ? json<Record<string, string>>('data/overrides/component-notes.json')
  : {};

const kanji: KanjiEntry[] = merged.map((k) => {
  const rawComponents = direct.get(k.id) ?? [];
  const components = rawComponents.filter((c) => c in compNamesOv);
  return {
    ...k,
    groupId: built.assignment.get(k.id)!,
    ...(explainOv[k.id] ? { explanation: explainOv[k.id] } : {}),
    ...(components.length > 0 ? { components } : {}),
    ...(compNotesOv[k.id] ? { componentNote: compNotesOv[k.id] } : {}),
  };
});
const kanjiSet = new Set(kanji.map((k) => k.id));

// 오버라이드 이동 대상이 실제 한자가 아닌 경우 경고 (유령 그룹 방지)
for (const target of Object.values(groupsOv.moves)) {
  if (!kanjiSet.has(target) && !target.startsWith('misc-')) {
    console.warn(`경고: groups.json 이동 대상 "${target}"가 한자 집합에 없음`);
  }
}

// --- 중간 부품(part) 탐지 및 삽입 ---
const allComps = expandComponents(direct);
const kanjiByGroup = new Map<string, KanjiEntry[]>();
for (const k of kanji) {
  const list = kanjiByGroup.get(k.groupId) ?? [];
  list.push(k);
  kanjiByGroup.set(k.groupId, list);
}
const named = new Set(Object.keys(compNamesOv));
const parts = detectParts(built.groups, kanjiByGroup, direct, allComps, kanjiSet, named);

// 부품 pseudo-KanjiEntry 생성 후 kanji 배열에 추가
for (const part of parts) {
  const partComponents = (direct.get(part.id) ?? []).filter((c) => c in compNamesOv);
  const entry: KanjiEntry = {
    id: part.id,
    hunum: compNamesOv[part.id] ?? part.id,
    onyomi: [],
    kunyomi: [],
    strokes: 0,
    level: part.level,
    groupId: part.groupId,
    isPart: true,
    explanation: `단독으로는 잘 쓰이지 않는 부품자예요. ${part.derived.join('·')}을(를) 만드는 조각으로 기억하세요.`,
    ...(partComponents.length > 0 ? { components: partComponents } : {}),
    ...(compNotesOv[part.id] ? { componentNote: compNotesOv[part.id] } : {}),
  };
  kanji.push(entry);
}

// 그룹의 kanji 배열을 orderGroupKanji로 재정렬 (부품 포함)
const kanjiByGroupUpdated = new Map<string, KanjiEntry[]>();
for (const k of kanji) {
  const list = kanjiByGroupUpdated.get(k.groupId) ?? [];
  list.push(k);
  kanjiByGroupUpdated.set(k.groupId, list);
}
for (const group of built.groups) {
  const members = kanjiByGroupUpdated.get(group.id) ?? [];
  group.kanji = orderGroupKanji(group, members, parts);
}

console.log(`부품 ${parts.length}개 추가`);
if (parts.length > 0) {
  const examples = parts.slice(0, 10).map((p) => `${p.id}(${p.groupId}그룹, derived:${p.derived.join('·')})`);
  console.log(`  예시: ${examples.join(' / ')}`);
}

// --- 이하 기존 ---
mkdirSync('public/data', { recursive: true });
writeFileSync(
  'public/data/components.json',
  readFileSync('data/overrides/component-names.json', 'utf8'),
);

// Tatoeba 파일을 한 번만 읽어 4개 레벨에서 재사용
const jpnTsv = raw('jpn_sentences.tsv');
const korTsv = raw('kor_sentences.tsv');
const linksTsv = raw('jpn-kor_links.tsv');

let missingKo = 0;
for (const level of LEVELS) {
  const words = parseVocab(
    raw(`vocab-${level.toLowerCase()}.csv`), level, kanjiSet, wordsKoOv,
  );
  missingKo += words.filter((w) => !w.meaningKo).length;
  const sentences = buildSentences(
    jpnTsv, korTsv, linksTsv, words,
  );
  const levelKanji = kanji.filter((k) => k.level === level);
  writeFileSync(
    `public/data/${level}.json`,
    JSON.stringify({ kanji: levelKanji, words, sentences }),
  );
  console.log(`${level}: 한자 ${levelKanji.length} / 단어 ${words.length} / 예문 ${sentences.length}`);
}
writeFileSync('public/data/groups.json', JSON.stringify(built.groups));

const errors = validateBundle(kanji, built.groups);
const structural = errors.filter((e) => e.includes('존재하지 않는') || e.includes('알 수 없는'));
console.log(`훈음 누락 ${missing.length}자: ${missing.slice(0, 30).join(' ')}`);
console.log(`한국어 뜻 누락 단어 ${missingKo}개 (data/overrides/words-ko.json 으로 보완)`);
console.log(`구조 오류 ${structural.length}건`);
for (const e of structural.slice(0, 50)) console.log('  ' + e);
if (structural.length > 0) process.exit(1);

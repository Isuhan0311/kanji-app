import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseKanjiSource } from './parse-kanji-source';
import { parseHanjaKo, mergeHunum } from './parse-hanja-ko';
import { parseIds, expandComponents } from './parse-ids';
import { buildGroups, applyGroupOverrides, type GroupOverrides } from './groups';
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

const kanji: KanjiEntry[] = merged.map((k) => {
  const rawComponents = direct.get(k.id) ?? [];
  const components = rawComponents.filter((c) => c in compNamesOv);
  return {
    ...k,
    groupId: built.assignment.get(k.id)!,
    ...(explainOv[k.id] ? { explanation: explainOv[k.id] } : {}),
    ...(components.length > 0 ? { components } : {}),
  };
});
const kanjiSet = new Set(kanji.map((k) => k.id));

// 오버라이드 이동 대상이 실제 한자가 아닌 경우 경고 (유령 그룹 방지)
for (const target of Object.values(groupsOv.moves)) {
  if (!kanjiSet.has(target) && !target.startsWith('misc-')) {
    console.warn(`경고: groups.json 이동 대상 "${target}"가 한자 집합에 없음`);
  }
}

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

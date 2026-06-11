import { validateBundle } from './validate';
import type { KanjiEntry, KanjiGroup } from '../../src/types';

const KANJI: KanjiEntry[] = [
  { id: '休', hunum: '쉴 휴', onyomi: ['きゅう'], kunyomi: ['やす(む)'], strokes: 6, level: 'N5', groupId: '木' },
  { id: '林', hunum: '', onyomi: ['りん'], kunyomi: [], strokes: 8, level: 'N5', groupId: '없는그룹' },
];

const GROUPS: KanjiGroup[] = [
  { id: '木', base: '木', name: '木의 파생', kanji: ['休', '유령한자'] },
];

test('그룹 불일치와 훈음 누락을 보고한다', () => {
  const errors = validateBundle(KANJI, GROUPS);
  expect(errors).toContain('林: 존재하지 않는 그룹 "없는그룹"');
  expect(errors).toContain('그룹 木: 알 수 없는 한자 "유령한자"');
  expect(errors).toContain('林: 훈음 누락');
});

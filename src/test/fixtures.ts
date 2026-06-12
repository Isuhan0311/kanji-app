import type { KanjiEntry, KanjiGroup, SentenceEntry, WordEntry } from '../types';

export const FIX_KANJI: KanjiEntry[] = [
  { id: '木', hunum: '나무 목', onyomi: ['もく', 'ぼく'], kunyomi: ['き'], strokes: 4, level: 'N5', groupId: '木' },
  { id: '休', hunum: '쉴 휴', onyomi: ['きゅう'], kunyomi: ['やす(む)'], strokes: 6, level: 'N5', groupId: '木',
    explanation: '사람(亻)이 나무(木)에 기대어 쉬는 모습', components: ['亻', '木'] },
  { id: '林', hunum: '수풀 림', onyomi: ['りん'], kunyomi: ['はやし'], strokes: 8, level: 'N5', groupId: '木',
    components: ['木'] },
  { id: '頂', hunum: '정수리 정', onyomi: ['ちょう'], kunyomi: ['いただ(く)'], strokes: 11, level: 'N3', groupId: '頁',
    components: ['丁', '頁'] },
  { id: '順', hunum: '순할 순', onyomi: ['じゅん'], kunyomi: [], strokes: 12, level: 'N3', groupId: '頁' },
  { id: '頁', hunum: '머리 혈', onyomi: ['けつ'], kunyomi: [], strokes: 9, level: 'N3', groupId: '頁' },
];

export const FIX_GROUPS: KanjiGroup[] = [
  { id: '木', base: '木', name: '木의 파생', kanji: ['木', '休', '林'] },
  { id: '頁', base: '頁', name: '頁의 파생', kanji: ['頁', '頂', '順'] },
];

export const FIX_WORDS: WordEntry[] = [
  { surface: '休日', reading: 'きゅうじつ', meaningKo: '휴일', meaningEn: 'holiday', kanji: ['休', '日'], level: 'N5' },
  { surface: '休む', reading: 'やすむ', meaningKo: '쉬다', meaningEn: 'to rest', kanji: ['休'], level: 'N5' },
  { surface: '林', reading: 'はやし', meaningKo: '수풀', meaningEn: 'woods', kanji: ['林'], level: 'N5' },
  { surface: '頂上', reading: 'ちょうじょう', meaningKo: '정상', meaningEn: 'summit', kanji: ['頂', '上'], level: 'N3' },
];

export const FIX_SENTENCES: SentenceEntry[] = [
  { id: 1, japanese: '明日は休日なので、家でゆっくりします。', targetWord: '休日',
    reading: 'きゅうじつ', translationKo: '내일은 휴일이라 집에서 쉽니다.' },
  { id: 2, japanese: '休日に映画を見ました。', targetWord: '休日',
    reading: 'きゅうじつ', translationKo: '휴일에 영화를 봤습니다.' },
];

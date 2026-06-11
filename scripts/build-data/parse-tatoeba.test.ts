import { describe, test, expect } from 'vitest';
import { buildSentences } from './parse-tatoeba';
import type { WordEntry } from '../../src/types';

const JPN = [
  '1\tjpn\t明日は休日なので、家でゆっくりします。',
  '2\tjpn\t休日に映画を見ました。',
  '3\tjpn\t休日はいいですね、本当に素晴らしい、最高です、いつまでも続いてほしいものですね。',
  '4\tjpn\t木の下で休みました。',
].join('\n');

const KOR = [
  '10\tkor\t내일은 휴일이라 집에서 쉽니다.',
  '11\tkor\t휴일에 영화를 봤습니다.',
].join('\n');

const LINKS = ['1\t10', '2\t11'].join('\n');

const WORDS: WordEntry[] = [
  { surface: '休日', reading: 'きゅうじつ', meaningKo: '휴일', meaningEn: 'holiday', kanji: ['休', '日'], level: 'N5' },
  { surface: '木', reading: 'き', meaningKo: '나무', meaningEn: 'tree', kanji: ['木'], level: 'N5' },
];

describe('parse-tatoeba', () => {
  test('한국어 번역이 있는 짧은 문장을 단어당 최대 2개 매칭한다', () => {
    const out = buildSentences(JPN, KOR, LINKS, WORDS, 2, 40);
    const forKyuujitsu = out.filter((s) => s.targetWord === '休日');
    expect(forKyuujitsu).toHaveLength(2); // 3번 문장은 번역 없음+길이 초과로 제외
    expect(forKyuujitsu[0].translationKo).toBe('내일은 휴일이라 집에서 쉽니다.');
    expect(forKyuujitsu[0].reading).toBe('きゅうじつ');
    expect(out.filter((s) => s.targetWord === '木')).toHaveLength(0); // 4번 문장은 번역 없음
  });
});

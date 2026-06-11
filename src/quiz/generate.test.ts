import { generateQuiz } from './generate';
import { FIX_GROUPS, FIX_KANJI, FIX_SENTENCES, FIX_WORDS } from '../test/fixtures';
import { mulberry32 } from '../lib/rand';

function gen(count = 8) {
  return generateQuiz({
    words: FIX_WORDS, sentences: FIX_SENTENCES, kanji: FIX_KANJI, groups: FIX_GROUPS,
    stats: new Map(), count, rand: mulberry32(42),
  });
}

test('요청 개수만큼 문제를 만들고 보기는 4개, 정답 위치가 유효하다', () => {
  const qs = gen(8);
  expect(qs).toHaveLength(8);
  for (const q of qs) {
    expect(q.choices).toHaveLength(4);
    expect(new Set(q.choices).size).toBe(4);
    expect(q.choices[q.answerIndex]).toBeTruthy();
    expect(q.kanjiIds.length).toBeGreaterThan(0);
  }
});

test('문장 문제는 예문이 있는 단어에서만 나온다', () => {
  const qs = gen(20);
  for (const q of qs.filter((x) => x.type.startsWith('sentence'))) {
    expect(q.sentence).toContain(q.type === 'sentence-reading' ? '休日' : 'きゅうじつ');
  }
});

test('뜻 문제의 정답은 한국어 뜻이다', () => {
  const qs = gen(20);
  const meaningQ = qs.find((x) => x.type === 'word-meaning');
  if (meaningQ) expect(meaningQ.choices[meaningQ.answerIndex]).toMatch(/[가-힣]/);
});

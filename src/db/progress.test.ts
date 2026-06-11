import 'fake-indexeddb/auto';
import { recordAnswer, markLearned, getStats, weight, pickWeighted, resetDbForTest } from './progress';

beforeEach(async () => {
  await resetDbForTest();
});

test('정답/오답을 기록하고 통계를 읽는다', async () => {
  await recordAnswer('休', true);
  await recordAnswer('休', false);
  await recordAnswer('休', false);
  const stats = await getStats();
  const s = stats.get('休')!;
  expect(s.correct).toBe(1);
  expect(s.wrong).toBe(2);
  expect(s.seen).toBe(3);
});

test('학습 완료를 기록한다', async () => {
  await markLearned('木');
  const stats = await getStats();
  expect(stats.get('木')!.learned).toBe(true);
});

test('가중치: 미학습 > 오답 많음 > 정답만', () => {
  const fresh = weight(undefined);
  const wrongHeavy = weight({ id: 'a', seen: 4, correct: 1, wrong: 3, learned: true, lastSeen: 0 });
  const mastered = weight({ id: 'b', seen: 4, correct: 4, wrong: 0, learned: true, lastSeen: 0 });
  expect(wrongHeavy).toBeGreaterThan(fresh);
  expect(fresh).toBeGreaterThan(mastered);
});

test('pickWeighted는 가중치에 비례해 선택한다', () => {
  const items = ['a', 'b'];
  const w = (x: string) => (x === 'a' ? 9 : 1);
  expect(pickWeighted(items, w, () => 0.5)).toBe('a'); // 0.5*10=5 < 9
  expect(pickWeighted(items, w, () => 0.95)).toBe('b');
});

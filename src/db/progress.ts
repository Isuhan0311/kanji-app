import { openDB, type IDBPDatabase } from 'idb';

export interface KanjiStat {
  id: string;
  seen: number;
  correct: number;
  wrong: number;
  learned: boolean;
  lastSeen: number;
}

const DB_NAME = 'kanji-progress';
let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore('stats', { keyPath: 'id' });
    },
  });
  return dbPromise;
}

async function update(id: string, fn: (s: KanjiStat) => void) {
  const d = await db();
  const s: KanjiStat = (await d.get('stats', id)) ?? {
    id, seen: 0, correct: 0, wrong: 0, learned: false, lastSeen: 0,
  };
  fn(s);
  s.lastSeen = Date.now();
  await d.put('stats', s);
}

export const recordAnswer = (id: string, correct: boolean) =>
  update(id, (s) => {
    s.seen++;
    if (correct) s.correct++;
    else s.wrong++;
  });

export const markLearned = (id: string) =>
  update(id, (s) => {
    s.learned = true;
  });

export async function getStats(): Promise<Map<string, KanjiStat>> {
  const all: KanjiStat[] = await (await db()).getAll('stats');
  return new Map(all.map((s) => [s.id, s]));
}

export function weight(stat?: KanjiStat): number {
  if (!stat || stat.seen === 0) return 3; // 미출제
  const wrongRate = stat.wrong / stat.seen;
  return 1 + wrongRate * 9; // 전부 오답이면 10, 전부 정답이면 1
}

export function pickWeighted<T>(
  items: T[],
  getWeight: (item: T) => number,
  rand: () => number = Math.random,
): T {
  const total = items.reduce((sum, it) => sum + getWeight(it), 0);
  let r = rand() * total;
  for (const it of items) {
    r -= getWeight(it);
    if (r < 0) return it;
  }
  return items[items.length - 1];
}

export async function resetDbForTest() {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

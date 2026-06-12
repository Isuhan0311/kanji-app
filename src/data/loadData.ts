import type { KanjiGroup, Level, LevelBundle } from '../types';

const cache = new Map<string, unknown>();

export function clearCache() {
  cache.clear();
}

async function fetchJson<T>(name: string): Promise<T> {
  if (cache.has(name)) return cache.get(name) as T;
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`);
  if (!res.ok) throw new Error(`데이터 로드 실패: ${res.status} (${name})`);
  const data = (await res.json()) as T;
  cache.set(name, data);
  return data;
}

export const loadLevel = (level: Level) => fetchJson<LevelBundle>(level);
export const loadGroups = () => fetchJson<KanjiGroup[]>('groups');
export const loadComponentNames = () => fetchJson<Record<string, string>>('components');

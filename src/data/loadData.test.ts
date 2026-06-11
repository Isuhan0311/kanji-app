import { loadLevel, loadGroups, clearCache } from './loadData';

const BUNDLE = { kanji: [], words: [], sentences: [] };

beforeEach(() => {
  clearCache();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true,
    json: async () => (String(url).includes('groups') ? [] : BUNDLE),
  })));
});

test('레벨 번들을 fetch하고 캐시한다', async () => {
  const a = await loadLevel('N5');
  const b = await loadLevel('N5');
  expect(a).toEqual(BUNDLE);
  expect(b).toBe(a);
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
});

test('그룹 목록을 로드한다', async () => {
  expect(await loadGroups()).toEqual([]);
});

test('실패 시 에러를 던진다', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
  await expect(loadLevel('N4')).rejects.toThrow('404');
});

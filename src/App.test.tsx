import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import App from './App';
import { FIX_GROUPS, FIX_KANJI } from './test/fixtures';
import { clearCache } from './data/loadData';

beforeEach(() => {
  clearCache();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true,
    json: async () => {
      const u = String(url);
      if (u.includes('groups')) return FIX_GROUPS;
      if (u.includes('components')) return {};
      return { kanji: FIX_KANJI, words: [], sentences: [] };
    },
  })));
});

test('로딩 후 홈 화면이 보인다', async () => {
  render(<App />);
  expect(await screen.findByText('木의 파생')).toBeTruthy();
});

test('데이터 로드 실패 시 재시도 화면이 보인다', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
  render(<App />);
  expect(await screen.findByText('데이터를 불러오지 못했어요.')).toBeTruthy();
  expect(screen.getByRole('button', { name: '다시 시도' })).toBeTruthy();
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Home from './Home';
import type { KanjiEntry, KanjiGroup } from '../types';
import { FIX_GROUPS, FIX_KANJI } from '../test/fixtures';

const noop = () => {};

function renderHome(onOpenGroup = noop as (g: string, l: string) => void) {
  return render(
    <Home groups={FIX_GROUPS} kanji={FIX_KANJI} learned={new Set(['休'])}
      onOpenGroup={onOpenGroup} onReview={noop} onQuiz={noop} onWrongNotes={noop} />,
  );
}

// 12개 N5 그룹 생성 (페이지네이션 테스트용)
const MANY_GROUPS: KanjiGroup[] = Array.from({ length: 12 }, (_, i) => ({
  id: `G${i}`,
  base: `G${i}`,
  name: `그룹${i}`,
  kanji: [`K${i}`],
}));
const MANY_KANJI: KanjiEntry[] = Array.from({ length: 12 }, (_, i) => ({
  id: `K${i}`,
  hunum: `훈음${i}`,
  onyomi: [],
  kunyomi: [],
  strokes: 4,
  level: 'N5' as const,
  groupId: `G${i}`,
}));

describe('Home', () => {
  test('기본 N5 탭에서 해당 급수 그룹과 진도를 보여준다', () => {
    renderHome();
    expect(screen.getByText('木의 파생')).toBeTruthy();
    expect(screen.queryByText('頁의 파생')).toBeNull();
    expect(screen.getByText('1/3 학습 완료')).toBeTruthy();
  });

  test('급수 탭을 바꾸면 그룹이 바뀐다', () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'N3' }));
    expect(screen.getByText('頁의 파생')).toBeTruthy();
    expect(screen.queryByText('木의 파생')).toBeNull();
  });

  test('그룹을 누르면 onOpenGroup이 호출된다', () => {
    const spy = vi.fn();
    renderHome(spy);
    fireEvent.click(screen.getByText('木의 파생'));
    expect(spy).toHaveBeenCalledWith('木', 'N5');
  });

  test('12개 그룹: 1페이지에 10개만 보이고, 다음 클릭 시 11번째가 보인다', () => {
    render(
      <Home groups={MANY_GROUPS} kanji={MANY_KANJI} learned={new Set()}
        onOpenGroup={noop} onReview={noop} onQuiz={noop} onWrongNotes={noop} />,
    );
    // 첫 페이지: 그룹0~9 보임, 그룹10 안 보임
    expect(screen.getByText('그룹0')).toBeTruthy();
    expect(screen.getByText('그룹9')).toBeTruthy();
    expect(screen.queryByText('그룹10')).toBeNull();
    // 페이지 표시
    expect(screen.getByText('1 / 2')).toBeTruthy();
    // 다음 클릭
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByText('그룹10')).toBeTruthy();
    expect(screen.queryByText('그룹0')).toBeNull();
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });

  test('레벨을 바꾸면 페이지가 초기화된다', () => {
    render(
      <Home groups={[...MANY_GROUPS, ...FIX_GROUPS]} kanji={[...MANY_KANJI, ...FIX_KANJI]}
        learned={new Set()} onOpenGroup={noop} onReview={noop} onQuiz={noop} onWrongNotes={noop} />,
    );
    // 다음 페이지로 이동
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByText('2 / 2')).toBeTruthy();
    // N3으로 변경 → 페이지 초기화
    fireEvent.click(screen.getByRole('button', { name: 'N3' }));
    expect(screen.getByText('頁의 파생')).toBeTruthy();
    // 페이지네이션 없음 (N3은 1그룹이라 totalPages=1)
    expect(screen.queryByText('이전')).toBeNull();
  });
});

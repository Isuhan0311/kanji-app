import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Home from './Home';
import { FIX_GROUPS, FIX_KANJI } from '../test/fixtures';

const noop = () => {};

function renderHome(onOpenGroup = noop as (g: string, l: string) => void) {
  return render(
    <Home groups={FIX_GROUPS} kanji={FIX_KANJI} learned={new Set(['休'])}
      onOpenGroup={onOpenGroup} onReview={noop} onQuiz={noop} onWrongNotes={noop} />,
  );
}

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
});

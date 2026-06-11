import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import WrongNotes from './WrongNotes';
import { FIX_KANJI } from '../test/fixtures';
import type { KanjiStat } from '../db/progress';

const stats = new Map<string, KanjiStat>([
  ['休', { id: '休', seen: 4, correct: 1, wrong: 3, learned: true, lastSeen: 0 }],
  ['木', { id: '木', seen: 5, correct: 4, wrong: 1, learned: true, lastSeen: 0 }],
  ['林', { id: '林', seen: 3, correct: 3, wrong: 0, learned: true, lastSeen: 0 }],
]);

describe('WrongNotes', () => {
  test('오답이 있는 한자만 오답률 순으로 보여준다', () => {
    render(<WrongNotes kanji={FIX_KANJI} stats={stats} onStudy={() => {}} onReviewWrong={() => {}} />);
    const rows = screen.getAllByText(/오답 \d/);
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('오답 3');
    expect(screen.queryByText('수풀 림')).toBeNull();
  });

  test('전체 복습 버튼이 오답 한자 목록을 전달한다', () => {
    const spy = vi.fn();
    render(<WrongNotes kanji={FIX_KANJI} stats={stats} onStudy={() => {}} onReviewWrong={spy} />);
    fireEvent.click(screen.getByRole('button', { name: /오답 전체 복습/ }));
    expect(spy).toHaveBeenCalledWith(['休', '木']);
  });
});

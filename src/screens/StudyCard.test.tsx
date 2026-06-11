import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import StudyCard from './StudyCard';
import { FIX_GROUPS, FIX_KANJI, FIX_WORDS } from '../test/fixtures';

const kyuu = FIX_KANJI.find((k) => k.id === '休')!;
const noop = () => {};

function renderCard(over: Partial<Parameters<typeof StudyCard>[0]> = {}) {
  return render(
    <StudyCard kanji={kyuu} group={FIX_GROUPS[0]} words={FIX_WORDS}
      index={1} total={3} onPrev={noop} onNext={noop} onJump={noop} onLearned={noop} {...over} />,
  );
}

test('훈음·읽기·예시 단어·설명을 보여준다', () => {
  renderCard();
  expect(screen.getByText('쉴 휴')).toBeTruthy();
  expect(screen.getByText('きゅう')).toBeTruthy();
  expect(screen.getByText('やす(む)')).toBeTruthy();
  expect(screen.getByText(/休日/)).toBeTruthy();
  expect(screen.getByText(/사람\(亻\)이 나무/)).toBeTruthy();
  expect(screen.getByText('木의 파생 2/3')).toBeTruthy();
});

test('같은 그룹의 다른 한자를 누르면 onJump가 호출된다', () => {
  const spy = vi.fn();
  renderCard({ onJump: spy });
  fireEvent.click(screen.getByRole('button', { name: '林' }));
  expect(spy).toHaveBeenCalledWith('林');
});

test('학습 완료 버튼이 onLearned를 호출한다', () => {
  const spy = vi.fn();
  renderCard({ onLearned: spy });
  fireEvent.click(screen.getByRole('button', { name: /학습 완료/ }));
  expect(spy).toHaveBeenCalledWith('休');
});

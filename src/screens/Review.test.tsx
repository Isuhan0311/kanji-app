import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Review from './Review';
import { FIX_KANJI } from '../test/fixtures';

const cards = FIX_KANJI.slice(0, 2); // 木, 休

test('처음에는 한자만 보이고, 탭하면 답이 공개된다', () => {
  render(<Review cards={cards} onAnswer={() => {}} onDone={() => {}} />);
  expect(screen.getByText('木')).toBeTruthy();
  expect(screen.queryByText('나무 목')).toBeNull();
  fireEvent.click(screen.getByText('탭해서 확인'));
  expect(screen.getByText('나무 목')).toBeTruthy();
});

test('알아요/몰라요가 기록되고 다음 카드로 넘어가며, 끝나면 onDone', () => {
  const onAnswer = vi.fn();
  const onDone = vi.fn();
  render(<Review cards={cards} onAnswer={onAnswer} onDone={onDone} />);
  fireEvent.click(screen.getByText('탭해서 확인'));
  fireEvent.click(screen.getByRole('button', { name: '알아요' }));
  expect(onAnswer).toHaveBeenCalledWith('木', true);
  expect(screen.getByText('休')).toBeTruthy();
  fireEvent.click(screen.getByText('탭해서 확인'));
  fireEvent.click(screen.getByRole('button', { name: '몰라요' }));
  expect(onAnswer).toHaveBeenCalledWith('休', false);
  expect(onDone).toHaveBeenCalled();
});

test('카드가 없으면 안내 문구를 보여준다', () => {
  render(<Review cards={[]} onAnswer={() => {}} onDone={() => {}} />);
  expect(screen.getByText('복습할 카드가 없어요.')).toBeTruthy();
});

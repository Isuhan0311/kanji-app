import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Quiz from './Quiz';
import type { Question } from '../quiz/generate';

const QS: Question[] = [
  {
    type: 'word-reading', prompt: '이 단어의 읽기는?', underlined: '休日',
    choices: ['きゅうじつ', 'やすび', 'きゅうにち', 'くじつ'], answerIndex: 0,
    kanjiIds: ['休', '日'], explanation: '休日(きゅうじつ) — 휴일',
    breakdown: '休(쉴 휴) + 日(날 일)',
  },
  {
    type: 'sentence-reading', prompt: '밑줄 친 단어의 읽기는?', underlined: '休日',
    sentence: '明日は休日です。',
    choices: ['やすび', 'きゅうじつ', 'くじつ', 'きゅうび'], answerIndex: 1,
    kanjiIds: ['休', '日'], explanation: '休日(きゅうじつ) — 휴일',
    breakdown: '休(쉴 휴) + 日(날 일)',
  },
];

test('정답을 고르면 정답 표시 후 다음으로 넘어가고, 끝나면 결과를 전달한다', () => {
  const onAnswer = vi.fn();
  const onFinish = vi.fn();
  render(<Quiz questions={QS} onAnswer={onAnswer} onFinish={onFinish} />);

  expect(screen.getByText('이 단어의 읽기는?')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /きゅうじつ/ }));
  expect(screen.getByText('정답!')).toBeTruthy();
  expect(onAnswer).toHaveBeenCalledWith(QS[0], true);
  fireEvent.click(screen.getByRole('button', { name: '다음' }));

  expect(screen.getByText(/明日は/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /やすび/ }));
  expect(screen.getByText(/오답/)).toBeTruthy();
  expect(screen.getByText(/休日\(きゅうじつ\)/)).toBeTruthy();
  expect(screen.getByText(/休\(쉴 휴\) \+ 日\(날 일\)/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '결과 보기' }));
  expect(onFinish).toHaveBeenCalledWith([
    { question: QS[0], correct: true },
    { question: QS[1], correct: false },
  ]);
});

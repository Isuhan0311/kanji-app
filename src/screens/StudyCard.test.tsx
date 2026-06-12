import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import StudyCard from './StudyCard';
import { FIX_GROUPS, FIX_KANJI, FIX_WORDS } from '../test/fixtures';

const kyuu = FIX_KANJI.find((k) => k.id === '休')!;
const noop = () => {};

const FIX_COMP_NAMES: Record<string, string> = { '亻': '사람인변', '木': '나무 목' };

function renderCard(over: Partial<Parameters<typeof StudyCard>[0]> = {}) {
  return render(
    <StudyCard kanji={kyuu} group={FIX_GROUPS[0]} words={FIX_WORDS}
      index={1} total={3} componentNames={FIX_COMP_NAMES}
      onPrev={noop} onNext={noop} onJump={noop} onLearned={noop} {...over} />,
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

test('구성요소 이름을 보여준다', () => {
  renderCard();
  expect(screen.getByText(/亻\(사람인변\) \+ 木\(나무 목\)/)).toBeTruthy();
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

const partKanji: Parameters<typeof StudyCard>[0]['kanji'] = {
  id: '畐',
  hunum: '가득할 복',
  onyomi: [],
  kunyomi: [],
  strokes: 0,
  level: 'N3',
  groupId: '田',
  isPart: true,
  explanation: '단독으로는 잘 쓰이지 않는 부품자예요. 福·富을(를) 만드는 조각으로 기억하세요.',
};

const partGroup: Parameters<typeof StudyCard>[0]['group'] = {
  id: '田',
  base: '田',
  name: '田의 파생',
  kanji: ['田', '男', '畐', '福', '富'],
};

test('isPart=true이면 "부품" 배지가 보이고 획수 표시가 없다', () => {
  render(
    <StudyCard kanji={partKanji} group={partGroup} words={[]}
      index={2} total={5} componentNames={FIX_COMP_NAMES}
      onPrev={noop} onNext={noop} onJump={noop} onLearned={noop} />,
  );
  expect(screen.getByText('부품')).toBeTruthy();
  expect(screen.queryByText(/0획/)).toBeNull();
});

test('componentNote가 있으면 노트가 보인다', () => {
  const kanjiWithNote = { ...kyuu, componentNote: '테스트 노트' };
  renderCard({ kanji: kanjiWithNote });
  expect(screen.getByText(/테스트 노트/)).toBeTruthy();
});

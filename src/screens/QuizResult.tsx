import type { QuizOutcome } from './Quiz';

interface Props {
  results: QuizOutcome[];
  onRetry: () => void;
  onHome: () => void;
  onJumpKanji: (kanjiId: string) => void;
}

export default function QuizResult({ results, onRetry, onHome, onJumpKanji }: Props) {
  const correct = results.filter((r) => r.correct).length;
  const wrong = results.filter((r) => !r.correct);
  return (
    <div>
      <h1>결과: {correct} / {results.length}</h1>
      {wrong.length > 0 && <div className="muted">틀린 문제</div>}
      {wrong.map((r, i) => (
        <div key={i} className="card">
          <div>{r.question.explanation}</div>
          {r.question.breakdown && <div className="muted">{r.question.breakdown}</div>}
          <div className="row" style={{ marginTop: 8 }}>
            {r.question.kanjiIds.map((id) => (
              <button key={id} className="kanji-glyph" onClick={() => onJumpKanji(id)}>{id} 카드 보기</button>
            ))}
          </div>
        </div>
      ))}
      <div className="row" style={{ marginTop: 12 }}>
        <button onClick={onRetry}>다시 풀기</button>
        <button onClick={onHome}>홈으로</button>
      </div>
    </div>
  );
}

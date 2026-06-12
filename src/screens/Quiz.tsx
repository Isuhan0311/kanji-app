import { useState, type CSSProperties } from 'react';
import type { Question } from '../quiz/generate';

export interface QuizOutcome {
  question: Question;
  correct: boolean;
}

interface Props {
  questions: Question[];
  onAnswer: (question: Question, correct: boolean) => void;
  onFinish: (results: QuizOutcome[]) => void;
}

function Sentence({ text, underlined }: { text: string; underlined: string }) {
  const i = text.indexOf(underlined);
  if (i < 0) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, i)}
      <u style={{ textDecorationColor: 'var(--danger)', fontWeight: 500 }}>{underlined}</u>
      {text.slice(i + underlined.length)}
    </span>
  );
}

export default function Quiz({ questions, onAnswer, onFinish }: Props) {
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<QuizOutcome[]>([]);
  const q = questions[i];
  const isLast = i + 1 >= questions.length;

  const select = (idx: number) => {
    if (selected !== null) return;
    const correct = idx === q.answerIndex;
    setSelected(idx);
    setResults([...results, { question: q, correct }]);
    onAnswer(q, correct);
  };

  const next = () => {
    if (isLast) onFinish(results);
    else {
      setI(i + 1);
      setSelected(null);
    }
  };

  return (
    <div>
      <div className="muted">{i + 1} / {questions.length}</div>
      <div className="card">
        <div className="muted">{q.prompt}</div>
        <div style={{ fontSize: q.sentence ? 18 : 28, margin: '12px 0', lineHeight: 1.7 }}>
          {q.sentence
            ? <Sentence text={q.sentence} underlined={q.underlined} />
            : <span className="kanji-glyph">{q.underlined}</span>}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {q.choices.map((c, idx) => {
            let style: CSSProperties = {};
            if (selected !== null && idx === q.answerIndex)
              style = { borderColor: 'var(--accent)', background: 'var(--accent-bg)' };
            else if (selected === idx)
              style = { borderColor: 'var(--danger)', background: 'var(--danger-bg)' };
            return (
              <button key={c} onClick={() => select(idx)} style={{ textAlign: 'left', ...style }}>
                {'①②③④'[idx]} {c}
              </button>
            );
          })}
        </div>
        {selected !== null && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 500, color: selected === q.answerIndex ? 'var(--accent)' : 'var(--danger)' }}>
              {selected === q.answerIndex ? '정답!' : '오답…'}
            </div>
            <div className="muted">{q.explanation}</div>
            {q.breakdown && <div className="muted">{q.breakdown}</div>}
            <button onClick={next} style={{ marginTop: 10, width: '100%' }}>
              {isLast ? '결과 보기' : '다음'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

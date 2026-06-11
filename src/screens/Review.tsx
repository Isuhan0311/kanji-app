import { useState } from 'react';
import type { KanjiEntry } from '../types';

interface Props {
  cards: KanjiEntry[];
  onAnswer: (kanjiId: string, known: boolean) => void;
  onDone: () => void;
}

export default function Review({ cards, onAnswer, onDone }: Props) {
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (cards.length === 0) {
    return <div className="muted">복습할 카드가 없어요.</div>;
  }

  const card = cards[i];

  const answer = (known: boolean) => {
    onAnswer(card.id, known);
    if (i + 1 >= cards.length) onDone();
    else {
      setI(i + 1);
      setRevealed(false);
    }
  };

  return (
    <div>
      <div className="muted">{i + 1} / {cards.length}</div>
      <div className="card" style={{ textAlign: 'center', padding: '28px 14px' }}>
        <div className="kanji-glyph" style={{ fontSize: 96 }}>{card.id}</div>
        {revealed ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 500 }}>{card.hunum}</div>
            <div className="muted" style={{ marginTop: 6 }}>
              {card.onyomi.length > 0 && <>음독: {card.onyomi.join(' · ')}<br /></>}
              {card.kunyomi.length > 0 && <>훈독: {card.kunyomi.join(' · ')}</>}
            </div>
            <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => answer(false)} style={{ color: 'var(--danger)' }}>몰라요</button>
              <button onClick={() => answer(true)} style={{ color: 'var(--accent)' }}>알아요</button>
            </div>
          </div>
        ) : (
          <div onClick={() => setRevealed(true)}
            style={{ marginTop: 16, border: '1px dashed var(--border)', borderRadius: 10, padding: 14, color: 'var(--muted)' }}>
            탭해서 확인
          </div>
        )}
      </div>
    </div>
  );
}

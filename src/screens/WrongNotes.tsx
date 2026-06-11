import type { KanjiEntry } from '../types';
import type { KanjiStat } from '../db/progress';

interface Props {
  kanji: KanjiEntry[];
  stats: Map<string, KanjiStat>;
  onStudy: (kanjiId: string) => void;
  onReviewWrong: (kanjiIds: string[]) => void;
}

export default function WrongNotes({ kanji, stats, onStudy, onReviewWrong }: Props) {
  const items = kanji
    .map((k) => ({ k, s: stats.get(k.id) }))
    .filter((x): x is { k: KanjiEntry; s: KanjiStat } => !!x.s && x.s.wrong > 0)
    .sort((a, b) => b.s.wrong / b.s.seen - a.s.wrong / a.s.seen);

  if (items.length === 0) return <div className="muted">아직 틀린 한자가 없어요.</div>;

  return (
    <div>
      <h1>오답 노트</h1>
      <button onClick={() => onReviewWrong(items.map((x) => x.k.id))} style={{ width: '100%' }}>
        오답 전체 복습 ({items.length}자)
      </button>
      {items.map(({ k, s }) => (
        <div key={k.id} className="card" onClick={() => onStudy(k.id)} style={{ marginTop: 10 }}>
          <div className="row">
            <span className="kanji-glyph" style={{ fontSize: 30 }}>{k.id}</span>
            <div>
              <div>{k.hunum}</div>
              <div className="muted">오답 {s.wrong} / {s.seen}회 출제 · {k.level}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

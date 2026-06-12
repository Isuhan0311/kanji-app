import { useState } from 'react';
import type { KanjiEntry, KanjiGroup, Level } from '../types';
import { LEVELS } from '../types';

const PAGE_SIZE = 10;

interface Props {
  groups: KanjiGroup[];
  kanji: KanjiEntry[];
  learned: Set<string>;
  onOpenGroup: (groupId: string, level: Level) => void;
  onReview: (level: Level) => void;
  onQuiz: (level: Level) => void;
  onWrongNotes: () => void;
}

export default function Home({ groups, kanji, learned, onOpenGroup, onReview, onQuiz, onWrongNotes }: Props) {
  const [level, setLevel] = useState<Level>('N5');
  const [page, setPage] = useState(0);

  const changeLevel = (l: Level) => { setLevel(l); setPage(0); };

  const byGroup = new Map<string, KanjiEntry[]>();
  for (const k of kanji) {
    if (k.level !== level) continue;
    byGroup.set(k.groupId, [...(byGroup.get(k.groupId) ?? []), k]);
  }
  const visible = groups.filter((g) => byGroup.has(g.id));
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = visible.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div>
      <h1>한자 학습</h1>
      <div className="row">
        {LEVELS.map((l) => (
          <button key={l} onClick={() => changeLevel(l)}
            style={l === level ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}>
            {l}
          </button>
        ))}
        <button onClick={onWrongNotes}>오답 노트</button>
      </div>
      <div className="row" style={{ margin: '12px 0' }}>
        <button onClick={() => onReview(level)}>{level} 복습</button>
        <button onClick={() => onQuiz(level)}>{level} 퀴즈</button>
      </div>
      {pageItems.map((g) => {
        const members = byGroup.get(g.id)!;
        const done = members.filter((k) => learned.has(k.id)).length;
        return (
          <div key={g.id} className="card" onClick={() => onOpenGroup(g.id, level)}>
            <div className="row">
              <span className="kanji-glyph" style={{ fontSize: 30 }}>{g.base || '〼'}</span>
              <div>
                <div>{g.name} <span className="badge">{members.length}자</span></div>
                <div className="muted">{done}/{members.length} 학습 완료</div>
              </div>
            </div>
          </div>
        );
      })}
      {totalPages > 1 && (
        <div className="row" style={{ justifyContent: 'center', marginTop: 12, gap: 16 }}>
          <button onClick={() => setPage(safePage - 1)} disabled={safePage === 0}>이전</button>
          <span className="muted">{safePage + 1} / {totalPages}</span>
          <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages - 1}>다음</button>
        </div>
      )}
    </div>
  );
}

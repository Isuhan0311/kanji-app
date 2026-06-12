import { useState } from 'react';
import type { KanjiEntry, KanjiGroup, Scope } from '../types';
import { LEVELS } from '../types';

const PAGE_SIZE = 10;

interface Props {
  groups: KanjiGroup[];
  kanji: KanjiEntry[];
  learned: Set<string>;
  onOpenGroup: (groupId: string, scope: Scope) => void;
  onReview: (scope: Scope) => void;
  onQuiz: (scope: Scope) => void;
  onWrongNotes: () => void;
}

export default function Home({ groups, kanji, learned, onOpenGroup, onReview, onQuiz, onWrongNotes }: Props) {
  const [scope, setScope] = useState<Scope>('N5');
  const [page, setPage] = useState(0);

  const changeScope = (s: Scope) => { setScope(s); setPage(0); };

  const byGroup = new Map<string, KanjiEntry[]>();
  for (const k of kanji) {
    if (scope !== 'ALL' && k.level !== scope) continue;
    byGroup.set(k.groupId, [...(byGroup.get(k.groupId) ?? []), k]);
  }
  const visible = groups.filter((g) => byGroup.has(g.id));
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = visible.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const scopeLabel = scope === 'ALL' ? '전체' : scope;

  return (
    <div>
      <h1>한자 학습</h1>
      <div className="row">
        {LEVELS.map((l) => (
          <button key={l} onClick={() => changeScope(l)}
            style={l === scope ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}>
            {l}
          </button>
        ))}
        <button onClick={() => changeScope('ALL')}
          style={scope === 'ALL' ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}>
          전체
        </button>
        <button onClick={onWrongNotes}>오답 노트</button>
      </div>
      <div className="row" style={{ margin: '12px 0' }}>
        <button onClick={() => onReview(scope)}>{scopeLabel} 복습</button>
        <button onClick={() => onQuiz(scope)}>{scopeLabel} 퀴즈</button>
      </div>
      {pageItems.map((g) => {
        const members = byGroup.get(g.id)!;
        const done = members.filter((k) => learned.has(k.id)).length;
        return (
          <div key={g.id} className="card" onClick={() => onOpenGroup(g.id, scope)}>
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

import type { KanjiEntry, KanjiGroup, VariantInfo, WordEntry } from '../types';

interface Props {
  kanji: KanjiEntry;
  group: KanjiGroup;
  words: WordEntry[];
  index: number;  // 0-based
  total: number;
  componentNames: Record<string, string>;
  variants: Record<string, VariantInfo>;
  onPrev: () => void;
  onNext: () => void;
  onJump: (kanjiId: string) => void;
  onLearned: (kanjiId: string) => void;
}

export default function StudyCard({ kanji, group, words, index, total, componentNames, variants, onPrev, onNext, onJump, onLearned }: Props) {
  const examples = words.filter((w) => w.kanji.includes(kanji.id)).slice(0, 4);
  const siblings = group.kanji.filter((id) => id !== kanji.id);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 4 }}>
          <span className="badge">{group.name} {index + 1}/{total}</span>
          {kanji.isPart && <span className="badge">부품</span>}
        </div>
        <span className="muted">
          {kanji.isPart ? kanji.level : `${kanji.level} · ${kanji.strokes}획`}
        </span>
      </div>
      <div className="card">
        <div className="row">
          <span className="kanji-glyph" style={{ fontSize: 72 }}>{kanji.id}</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500 }}>{kanji.hunum}</div>
            {kanji.explanation && <div className="muted">{kanji.explanation}</div>}
          </div>
        </div>
        {kanji.components && kanji.components.length > 0 && (
          <div className="muted" style={{ fontSize: 14, marginTop: 6 }}>
            구성: {kanji.components.map((c) => {
              const v = variants[c];
              return v ? `(${v.base}→${c}) ${v.name}` : `${c}(${componentNames[c] ?? '?'})`;
            }).join(' + ')}
          </div>
        )}
        {kanji.componentNote && (
          <div className="muted">💡 {kanji.componentNote}</div>
        )}
        {kanji.onyomi.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
            <span className="badge">음독</span>
            {kanji.onyomi.map((r) => <span key={r} style={{ marginLeft: 8 }}>{r}</span>)}
          </div>
        )}
        {kanji.kunyomi.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <span className="badge">훈독</span>
            {kanji.kunyomi.map((r) => <span key={r} style={{ marginLeft: 8 }}>{r}</span>)}
          </div>
        )}
        {examples.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
            {examples.map((w) => (
              <div key={w.surface} className="muted" style={{ fontSize: 15 }}>
                {w.surface}({w.reading}) {w.meaningKo || w.meaningEn}
              </div>
            ))}
          </div>
        )}
        {siblings.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
            <div className="muted">같은 그룹 한자</div>
            <div className="row" style={{ marginTop: 6 }}>
              {siblings.map((id) => (
                <button key={id} className="kanji-glyph" onClick={() => onJump(id)}>{id}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button onClick={onPrev}>이전</button>
        <button onClick={() => onLearned(kanji.id)} style={{ color: 'var(--accent)' }}>학습 완료 ✓</button>
        <button onClick={onNext}>다음</button>
      </div>
    </div>
  );
}

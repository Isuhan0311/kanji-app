import { useState, useRef, useEffect } from 'react';
import type { KanjiQuizItem } from '../quiz/kanjiQuizData';

interface Props {
  items: KanjiQuizItem[];
  onHome: () => void;
}

type Diff = 'easy' | 'hard';

const EASY_MODES = ['음독 고르기', '훈독 고르기', '의미 고르기', '단어 입력', '매칭 게임'];
const HARD_MODES = ['독음→한자', '훈독→한자', '동음이의 구분', '예문 빈칸', '단어 입력'];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pick3Others(all: KanjiQuizItem[], exclude: string): KanjiQuizItem[] {
  return shuffle(all.filter((x) => x.k !== exclude)).slice(0, 3);
}

// ── sub-components ────────────────────────────────────────────────

function ProgressBar({ cur, total, accent }: { cur: number; total: number; accent: string }) {
  return (
    <>
      <div className="kq-progress-label">{cur + 1} / {total}</div>
      <div className="kq-progress-outer">
        <div className="kq-progress-inner" style={{ width: `${(cur / total) * 100}%`, background: accent }} />
      </div>
    </>
  );
}

function ExplainCard({ item }: { item: KanjiQuizItem }) {
  return (
    <div className="kq-explain">
      <span className="kanji-glyph kq-explain-kanji">{item.k}</span>
      <span className="kq-tag kq-tag-on">음</span><b>{item.on}</b>
      {item.kun && <><span className="kq-tag kq-tag-kun" style={{ marginLeft: 8 }}>훈</span><b>{item.kun}</b></>}
      {' · '}{item.m}<br />
      <span className="kq-explain-row">음독) <b>{item.onw}</b>（{item.onwr}）— {item.onwm}</span><br />
      {item.kunw && (
        <><span className="kq-explain-row">훈독) <b>{item.kunw}</b>（{item.kunwr}）— {item.kunwm}</span><br /></>
      )}
      {item.s && <span className="kq-explain-row">{item.s.replace('___', item.k)}　<b>{item.sm}</b></span>}
    </div>
  );
}

interface ChoiceGridProps {
  item: KanjiQuizItem;
  options: string[];
  correct: string;
  isKanji?: boolean;
  onResult: (ok: boolean) => void;
  onNext: () => void;
}

function ChoiceGrid({ item, options, correct, isKanji, onResult, onNext }: ChoiceGridProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;

  const pick = (o: string) => {
    if (answered) return;
    setSelected(o);
    onResult(o === correct);
    if (o === correct) setTimeout(onNext, 800);
  };

  return (
    <>
      <div className={`kq-grid ${isKanji ? 'kq-grid-4' : 'kq-grid-2'}`}>
        {options.map((o) => {
          let cls = `kq-opt ${isKanji ? 'kq-opt-kanji' : 'kq-opt-txt'}`;
          if (answered) {
            if (o === correct) cls += ' kq-correct';
            else if (o === selected) cls += ' kq-wrong';
          }
          return (
            <button key={o} className={cls} disabled={answered} onClick={() => pick(o)}>{o}</button>
          );
        })}
      </div>
      {answered && selected !== correct && (
        <>
          <ExplainCard item={item} />
          <button className="kq-next-btn" onClick={onNext}>다음 →</button>
        </>
      )}
    </>
  );
}

interface WordInputProps {
  item: KanjiQuizItem;
  word: string;
  answer: string;
  onResult: (ok: boolean) => void;
  onNext: () => void;
}

function WordInput({ item, word, answer, onResult, onNext }: WordInputProps) {
  const [val, setVal] = useState('');
  const [answered, setAnswered] = useState(false);
  const [ok, setOk] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const check = () => {
    if (answered) return;
    const isOk = val.trim() === answer;
    setAnswered(true); setOk(isOk);
    onResult(isOk);
  };

  return (
    <>
      {answered && (
        <div className={`kq-feedback ${ok ? 'kq-feedback-ok' : 'kq-feedback-ng'}`}>
          {ok ? `정답! ${word} = ${answer}` : `오답 — 정답: ${answer}`}
        </div>
      )}
      <div className="kq-input-row">
        <input ref={ref} value={val} disabled={answered} placeholder="よみかた"
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()} />
        <button onClick={answered ? onNext : check}>{answered ? '다음 →' : '확인'}</button>
      </div>
      {answered && !ok && <ExplainCard item={item} />}
    </>
  );
}

// ── mode renderers ─────────────────────────────────────────────────

interface ModeProps {
  item: KanjiQuizItem;
  all: KanjiQuizItem[];
  onResult: (ok: boolean) => void;
  onNext: () => void;
}

function EasyReading({ item, all, onResult, onNext, type }: ModeProps & { type: 'on' | 'kun' }) {
  const correct = type === 'on' ? item.on : item.kun;
  const others = pick3Others(type === 'kun' ? all.filter((x) => x.kun) : all, item.k)
    .map((x) => (type === 'on' ? x.on : x.kun));
  const opts = shuffle([correct, ...others]);
  const ex = type === 'on' ? `${item.onw}（${item.onwm}）` : item.kunw ? `${item.kunw}（${item.kunwm}）` : '';
  return (
    <>
      <div className="kq-card">
        <div className="kanji-glyph kq-card-kanji">{item.k}</div>
        <div className="kq-card-hint">
          <span className={`kq-tag ${type === 'on' ? 'kq-tag-on' : 'kq-tag-kun'}`}>{type === 'on' ? '음독' : '훈독'}</span>
          {' '}읽기를 고르세요{ex && <><br />예) {ex}</>}
        </div>
      </div>
      <ChoiceGrid item={item} options={opts} correct={correct} onResult={onResult} onNext={onNext} />
    </>
  );
}

function EasyMeaning({ item, all, onResult, onNext }: ModeProps) {
  const others = pick3Others(all, item.k).map((x) => x.m);
  const opts = shuffle([item.m, ...others]);
  return (
    <>
      <div className="kq-card">
        <div className="kanji-glyph kq-card-kanji">{item.k}</div>
        <div className="kq-card-hint">의미를 고르세요 · 예) {item.onw}（{item.onwr}）</div>
      </div>
      <ChoiceGrid item={item} options={opts} correct={item.m} onResult={onResult} onNext={onNext} />
    </>
  );
}

function EasyInput({ item, onResult, onNext }: ModeProps) {
  return (
    <>
      <div className="kq-card">
        <div className="kanji-glyph kq-card-kanji" style={{ fontSize: 36 }}>{item.onw}</div>
        <div className="kq-card-hint">뜻: {item.onwm} — 단어를 히라가나로 입력</div>
      </div>
      <WordInput item={item} word={item.onw} answer={item.onwr} onResult={onResult} onNext={onNext} />
    </>
  );
}

function HardReadingToKanji({ item, all, onResult, onNext, type }: ModeProps & { type: 'on' | 'kun' }) {
  const reading = type === 'on' ? item.on : item.kun;
  const pool = type === 'kun' ? all.filter((x) => x.kun) : all;
  const others = pick3Others(pool, item.k);
  const opts = shuffle([item, ...others]).map((x) => x.k);
  const w = type === 'on' ? item.onw : (item.kunw ?? item.onw);
  const wm = type === 'on' ? item.onwm : (item.kunwm ?? item.onwm);
  const masked = w.replace(item.k, '□');
  return (
    <>
      <div className="kq-card">
        <div className="kq-card-prompt">
          <span className={`kq-tag ${type === 'on' ? 'kq-tag-on' : 'kq-tag-kun'}`}>{type === 'on' ? '음독' : '훈독'}</span>
          {' '}「{reading}」
        </div>
        <div className="kq-card-hint">뜻: {item.m} · 예) {masked}（{wm}）</div>
      </div>
      <ChoiceGrid item={item} options={opts} correct={item.k} isKanji onResult={onResult} onNext={onNext} />
    </>
  );
}

function HardConfusable({ item, all, onResult, onNext }: ModeProps) {
  const myOn = item.on.split('/')[0];
  let same = all.filter((x) => x.on.split('/')[0] === myOn && x.k !== item.k);
  const others = same.length >= 3 ? shuffle(same).slice(0, 3)
    : shuffle([...same, ...pick3Others(all.filter((x) => !same.includes(x)), item.k)]).slice(0, 3);
  const opts = shuffle([item, ...others]).map((x) => x.k);
  const masked = item.onw.replace(item.k, '□');
  return (
    <>
      <div className="kq-card">
        <div className="kq-card-prompt" style={{ fontSize: 30 }}>{masked}</div>
        <div className="kq-card-hint">「{item.onwr}」 = {item.onwm} — □에 들어갈 한자는?</div>
      </div>
      <ChoiceGrid item={item} options={opts} correct={item.k} isKanji onResult={onResult} onNext={onNext} />
    </>
  );
}

function HardSentence({ item, all, onResult, onNext }: ModeProps) {
  if (!item.s) {
    // fallback to confusable if no sentence
    return <HardConfusable item={item} all={all} onResult={onResult} onNext={onNext} />;
  }
  const others = pick3Others(all, item.k);
  const opts = shuffle([item, ...others]).map((x) => x.k);
  return (
    <>
      <div className="kq-card">
        <div className="kq-card-big">
          {item.s.split('___').map((part, i, arr) => (
            <span key={i}>{part}{i < arr.length - 1 && <span className="kq-blank">？</span>}</span>
          ))}
        </div>
        <div className="kq-card-hint">{item.sm}</div>
      </div>
      <ChoiceGrid item={item} options={opts} correct={item.k} isKanji onResult={onResult} onNext={onNext} />
    </>
  );
}

function HardWordInput({ item, onResult, onNext }: ModeProps) {
  return (
    <>
      <div className="kq-card">
        <div className="kanji-glyph kq-card-kanji" style={{ fontSize: 36 }}>{item.onw}</div>
        <div className="kq-card-hint">뜻: {item.onwm} — 단어 전체를 히라가나로 입력</div>
      </div>
      <WordInput item={item} word={item.onw} answer={item.onwr} onResult={onResult} onNext={onNext} />
    </>
  );
}

// ── matching game ──────────────────────────────────────────────────

function MatchingGame({ queue, chunkIdx, onChunkDone, onAllDone, results, setResults }:
  { queue: KanjiQuizItem[]; chunkIdx: number; onChunkDone: () => void; onAllDone: () => void;
    results: { k: string; ok: boolean }[]; setResults: React.Dispatch<React.SetStateAction<{ k: string; ok: boolean }[]>> }) {

  const chunk = queue.slice(chunkIdx, chunkIdx + 6);
  const [left] = useState(() => shuffle(chunk));
  const [right] = useState(() => shuffle(chunk));
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, 'ok' | 'ng' | undefined>>({});
  const [correct, setCorrect] = useState(0);

  const pickRight = (item: KanjiQuizItem) => {
    if (!selectedLeft) return;
    const isOk = selectedLeft === item.k;
    if (isOk) {
      const next = correct + 1;
      setStatus((s) => ({ ...s, [item.k]: 'ok', [selectedLeft]: 'ok' }));
      setCorrect(next);
      setResults((r) => [...r, { k: item.k, ok: true }]);
      setSelectedLeft(null);
      if (next >= chunk.length) {
        if (chunkIdx + chunk.length >= queue.length) onAllDone();
        else setTimeout(onChunkDone, 400);
      }
    } else {
      setStatus((s) => ({ ...s, [item.k]: 'ng', [selectedLeft]: 'ng' }));
      setResults((r) => [...r, { k: selectedLeft, ok: false }]);
      setSelectedLeft(null);
      setTimeout(() => setStatus((s) => { const n = { ...s }; delete n[item.k]; delete n[selectedLeft!]; return n; }), 700);
    }
  };

  return (
    <>
      <div className="kq-progress-label">
        매칭 라운드 {Math.floor(chunkIdx / 6) + 1} / {Math.ceil(queue.length / 6)} — {correct}/{chunk.length}
      </div>
      <div className="kq-match-wrap">
        <div className="kq-match-col">
          <div className="kq-section-label">한자</div>
          {left.map((item) => {
            const st = status[item.k];
            let cls = 'kq-match-btn';
            if (st === 'ok') cls += ' kq-match-ok';
            else if (st === 'ng') cls += ' kq-match-ng';
            else if (selectedLeft === item.k) cls += ' kq-match-sel';
            return (
              <button key={item.k} className={`kanji-glyph ${cls}`} disabled={st === 'ok'}
                onClick={() => setSelectedLeft(item.k)}>{item.k}</button>
            );
          })}
        </div>
        <div className="kq-match-col">
          <div className="kq-section-label">의미</div>
          {right.map((item) => {
            const st = status[item.k];
            let cls = 'kq-match-btn';
            if (st === 'ok') cls += ' kq-match-ok';
            else if (st === 'ng') cls += ' kq-match-ng';
            return (
              <button key={item.k} className={cls} disabled={st === 'ok'}
                onClick={() => pickRight(item)}>{item.m}</button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── result screen ──────────────────────────────────────────────────

function ResultScreen({ results, onRestart, onHome }:
  { results: { k: string; ok: boolean }[]; onRestart: () => void; onHome: () => void }) {
  const total = results.length;
  const correctCount = results.filter((r) => r.ok).length;
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const wrong = [...new Set(results.filter((r) => !r.ok).map((r) => r.k))];

  return (
    <div className="kq-result">
      <div className="kq-result-score">{pct}%</div>
      <div className="kq-result-label">
        {correctCount} / {total} 정답 · {pct >= 80 ? '훌륭해요!' : pct >= 50 ? '계속 연습해 봐요' : '다시 도전해 봐요'}
      </div>
      {wrong.length > 0 && (
        <div className="kq-result-wrong">
          <div className="muted" style={{ marginBottom: 6 }}>틀린 한자</div>
          <div className="row">
            {wrong.map((k) => <span key={k} className="kq-result-item-ng">{k}</span>)}
          </div>
        </div>
      )}
      <div className="row" style={{ marginTop: 20, justifyContent: 'center' }}>
        <button onClick={onRestart}>↺ 다시 시작</button>
        <button onClick={onHome}>홈으로</button>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────

export default function KanjiQuiz({ items, onHome }: Props) {
  const [diff, setDiff] = useState<Diff>('easy');
  const [mode, setMode] = useState(0);
  const [queue, setQueue] = useState<KanjiQuizItem[]>(() => {
    const pool = items.filter((x) => x.on);
    return shuffle(pool);
  });
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<{ k: string; ok: boolean }[]>([]);
  const [done, setDone] = useState(false);
  const [matchChunk, setMatchChunk] = useState(0);
  const [itemKey, setItemKey] = useState(0); // force re-mount on next question

  const isMatchMode = diff === 'easy' && mode === 4;
  const accent = diff === 'easy' ? 'var(--accent)' : 'var(--danger)';
  const modes = diff === 'easy' ? EASY_MODES : HARD_MODES;

  const restart = (newDiff = diff, newMode = mode) => {
    const pool = newDiff === 'hard' && newMode === 1
      ? items.filter((x) => x.kun)
      : items.filter((x) => x.on);
    setQueue(shuffle(pool));
    setIdx(0); setResults([]); setDone(false); setMatchChunk(0); setItemKey((k) => k + 1);
  };

  const changeDiff = (d: Diff) => { setDiff(d); setMode(0); restart(d, 0); };
  const changeMode = (m: number) => { setMode(m); restart(diff, m); };

  const handleResult = (ok: boolean) => {
    setResults((r) => [...r, { k: queue[idx].k, ok }]);
  };

  const handleNext = () => {
    const next = idx + 1;
    if (next >= queue.length) { setDone(true); return; }
    setIdx(next);
    setItemKey((k) => k + 1);
  };

  const item = queue[idx];

  const modeProps: ModeProps = { item, all: queue, onResult: handleResult, onNext: handleNext };

  let content: React.ReactNode;
  if (done) {
    content = <ResultScreen results={results} onRestart={() => restart()} onHome={onHome} />;
  } else if (isMatchMode) {
    content = (
      <MatchingGame key={matchChunk} queue={queue} chunkIdx={matchChunk}
        results={results} setResults={setResults}
        onChunkDone={() => { setMatchChunk((c) => c + 6); setItemKey((k) => k + 1); }}
        onAllDone={() => setDone(true)} />
    );
  } else if (item) {
    content = (
      <>
        <ProgressBar cur={idx} total={queue.length} accent={accent} />
        {diff === 'easy' && mode === 0 && <EasyReading key={itemKey} {...modeProps} type="on" />}
        {diff === 'easy' && mode === 1 && <EasyReading key={itemKey} {...modeProps} type="kun" />}
        {diff === 'easy' && mode === 2 && <EasyMeaning key={itemKey} {...modeProps} />}
        {diff === 'easy' && mode === 3 && <EasyInput key={itemKey} {...modeProps} />}
        {diff === 'hard' && mode === 0 && <HardReadingToKanji key={itemKey} {...modeProps} type="on" />}
        {diff === 'hard' && mode === 1 && <HardReadingToKanji key={itemKey} {...modeProps} type="kun" />}
        {diff === 'hard' && mode === 2 && <HardConfusable key={itemKey} {...modeProps} />}
        {diff === 'hard' && mode === 3 && <HardSentence key={itemKey} {...modeProps} />}
        {diff === 'hard' && mode === 4 && <HardWordInput key={itemKey} {...modeProps} />}
      </>
    );
  }

  return (
    <div>
      <div className="kq-diff-toggle">
        {(['easy', 'hard'] as Diff[]).map((d) => (
          <button key={d} className={`kq-diff-btn ${d}${diff === d ? ' active' : ''}`}
            onClick={() => changeDiff(d)}>
            {d === 'easy' ? '쉬운 버전' : '어려운 버전'}
          </button>
        ))}
      </div>
      <div className="kq-mode-tabs">
        {modes.map((label, i) => (
          <button key={i} className={`kq-mode-tab${mode === i ? ' active' : ''}`}
            style={mode === i ? { background: diff === 'easy' ? 'var(--accent-bg)' : 'var(--danger-bg)', color: accent, borderColor: accent } : undefined}
            onClick={() => changeMode(i)}>{label}</button>
        ))}
      </div>
      {content}
    </div>
  );
}

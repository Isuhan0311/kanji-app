import { useEffect, useState, type ReactNode } from 'react';
import type { KanjiGroup, Level, LevelBundle } from './types';
import { LEVELS } from './types';
import { loadGroups, loadLevel } from './data/loadData';
import { getStats, recordAnswer, markLearned, weight, type KanjiStat } from './db/progress';
import { generateQuiz, type Question } from './quiz/generate';
import Home from './screens/Home';
import StudyCard from './screens/StudyCard';
import Review from './screens/Review';
import Quiz, { type QuizOutcome } from './screens/Quiz';
import QuizResult from './screens/QuizResult';
import WrongNotes from './screens/WrongNotes';

type Route =
  | { name: 'home' }
  | { name: 'study'; groupId: string; level: Level; index: number }
  | { name: 'review'; ids: string[] }
  | { name: 'quiz'; level: Level; questions: Question[] }
  | { name: 'result'; level: Level; results: QuizOutcome[] }
  | { name: 'wrong' };

interface Data {
  groups: KanjiGroup[];
  bundles: Record<Level, LevelBundle>;
}

export default function App() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Map<string, KanjiStat>>(new Map());
  const [storageOk, setStorageOk] = useState(true);
  const [route, setRoute] = useState<Route>({ name: 'home' });

  const refreshStats = () =>
    getStats().then(setStats).catch(() => setStorageOk(false));

  useEffect(() => {
    (async () => {
      try {
        const [groups, ...rest] = await Promise.all([
          loadGroups(),
          ...LEVELS.map((l) => loadLevel(l)),
        ]);
        const bundles = Object.fromEntries(
          LEVELS.map((l, i) => [l, rest[i]]),
        ) as Record<Level, LevelBundle>;
        setData({ groups, bundles });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
      void refreshStats();
    })();
  }, []);

  if (error) {
    return (
      <div className="card">
        <div>데이터를 불러오지 못했어요.</div>
        <div className="muted">{error}</div>
        <button onClick={() => location.reload()} style={{ marginTop: 10 }}>다시 시도</button>
      </div>
    );
  }
  if (!data) return <div className="muted">불러오는 중…</div>;

  const allKanji = LEVELS.flatMap((l) => data.bundles[l].kanji);
  const kanjiById = new Map(allKanji.map((k) => [k.id, k]));
  const learned = new Set(
    [...stats.values()].filter((s) => s.learned).map((s) => s.id),
  );

  const record = (id: string, correct: boolean) =>
    recordAnswer(id, correct).then(refreshStats).catch(() => setStorageOk(false));

  const groupMembers = (groupId: string, level: Level) =>
    data.bundles[level].kanji.filter((k) => k.groupId === groupId);

  const goStudy = (kanjiId: string) => {
    const k = kanjiById.get(kanjiId);
    if (!k) return;
    const members = groupMembers(k.groupId, k.level);
    setRoute({
      name: 'study', groupId: k.groupId, level: k.level,
      index: Math.max(0, members.findIndex((m) => m.id === kanjiId)),
    });
  };

  const startReview = (ids: string[]) => {
    const sorted = [...ids].sort(
      (a, b) => weight(stats.get(b)) - weight(stats.get(a)),
    );
    setRoute({ name: 'review', ids: sorted.slice(0, 20) });
  };

  const startQuiz = (level: Level) => {
    const b = data.bundles[level];
    const questions = generateQuiz({
      words: b.words, sentences: b.sentences, kanji: b.kanji,
      groups: data.groups, stats, count: 10,
    });
    setRoute({ name: 'quiz', level, questions });
  };

  let screen: ReactNode;
  switch (route.name) {
    case 'home':
      screen = (
        <Home groups={data.groups} kanji={allKanji} learned={learned}
          onOpenGroup={(groupId, level) => setRoute({ name: 'study', groupId, level, index: 0 })}
          onReview={(level) => startReview(data.bundles[level].kanji.map((k) => k.id))}
          onQuiz={startQuiz}
          onWrongNotes={() => setRoute({ name: 'wrong' })} />
      );
      break;
    case 'study': {
      const members = groupMembers(route.groupId, route.level);
      const k = members[route.index];
      const group = data.groups.find((g) => g.id === route.groupId)!;
      if (!k || !group) {
        screen = <div className="muted">한자를 찾을 수 없어요.</div>;
        break;
      }
      screen = (
        <StudyCard kanji={k} group={group} words={data.bundles[route.level].words}
          index={route.index} total={members.length}
          onPrev={() =>
            route.index > 0
              ? setRoute({ ...route, index: route.index - 1 })
              : setRoute({ name: 'home' })}
          onNext={() =>
            route.index + 1 < members.length
              ? setRoute({ ...route, index: route.index + 1 })
              : setRoute({ name: 'home' })}
          onJump={goStudy}
          onLearned={(id) => {
            markLearned(id).then(refreshStats).catch(() => setStorageOk(false));
          }} />
      );
      break;
    }
    case 'review': {
      const cards = route.ids
        .map((id) => kanjiById.get(id))
        .filter((k): k is NonNullable<typeof k> => !!k);
      screen = (
        <Review cards={cards}
          onAnswer={(id, known) => void record(id, known)}
          onDone={() => setRoute({ name: 'home' })} />
      );
      break;
    }
    case 'quiz':
      screen = (
        <Quiz questions={route.questions}
          onAnswer={(q, correct) => q.kanjiIds.forEach((id) => void record(id, correct))}
          onFinish={(results) => setRoute({ name: 'result', level: route.level, results })} />
      );
      break;
    case 'result':
      screen = (
        <QuizResult results={route.results}
          onRetry={() => startQuiz(route.level)}
          onHome={() => setRoute({ name: 'home' })}
          onJumpKanji={goStudy} />
      );
      break;
    case 'wrong':
      screen = (
        <WrongNotes kanji={allKanji} stats={stats}
          onStudy={goStudy} onReviewWrong={startReview} />
      );
      break;
  }

  return (
    <>
      {route.name !== 'home' && (
        <button className="muted" style={{ marginBottom: 8 }}
          onClick={() => setRoute({ name: 'home' })}>← 홈</button>
      )}
      {!storageOk && (
        <div className="muted" style={{ marginBottom: 8 }}>
          ⚠ 이 브라우저에서는 진도가 저장되지 않아요 (시크릿 모드 등)
        </div>
      )}
      {screen}
    </>
  );
}

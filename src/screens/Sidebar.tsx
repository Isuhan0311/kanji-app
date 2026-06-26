export type NavKey = 'home' | 'study' | 'quiz' | 'search' | 'stats';

interface Props {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
}

const ICONS: Record<NavKey, JSX.Element> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 4l9 6.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" />
    </svg>
  ),
  study: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5.2A2.2 2.2 0 0 1 7.2 3H18v15H7.2A2.2 2.2 0 0 0 5 20.2z" /><path d="M5 18.2A2.2 2.2 0 0 1 7.2 16H18" />
    </svg>
  ),
  quiz: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="17" rx="2.5" /><path d="M9.5 4V2.8h5V4" /><path d="m9 13.5 2 2 4-4.5" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" />
    </svg>
  ),
  stats: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20V11" /><path d="M12 20V4" /><path d="M19 20v-6" />
    </svg>
  ),
};

const LABELS: Record<NavKey, string> = {
  home: '홈', study: '학습', quiz: '퀴즈', search: '검색', stats: '통계',
};

const ORDER: NavKey[] = ['home', 'study', 'quiz', 'search', 'stats'];

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="rail">
      <div className="rail-logo serif">漢</div>
      <nav className="rail-nav">
        {ORDER.map((key) => (
          <button key={key} className={`rail-item${key === active ? ' active' : ''}`}
            onClick={() => onNavigate(key)} aria-current={key === active ? 'page' : undefined}>
            {ICONS[key]}
            <span>{LABELS[key]}</span>
          </button>
        ))}
      </nav>
      <div className="rail-avatar">민</div>
    </aside>
  );
}

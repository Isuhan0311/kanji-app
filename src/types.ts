export type Level = 'N5' | 'N4' | 'N3' | 'N2';
export const LEVELS: Level[] = ['N5', 'N4', 'N3', 'N2'];

export interface KanjiEntry {
  id: string;          // 한자 1글자 (예: "休")
  hunum: string;       // 한국어 훈음 (예: "쉴 휴")
  onyomi: string[];    // 음독, 히라가나
  kunyomi: string[];   // 훈독, "やす(む)" 표기
  strokes: number;
  level: Level;
  groupId: string;
  explanation?: string; // 구성 원리 설명 (overrides에서만 옴)
  components?: string[]; // 직접 구성요소 (component-names.json 에 있는 것만)
}

export interface WordEntry {
  surface: string;     // 표기 (예: "休日") — 고유 키
  reading: string;     // 히라가나 읽기
  meaningKo: string;   // 한국어 뜻 ('' 가능)
  meaningEn: string;
  kanji: string[];     // 포함된 한자 (N5~N2 범위 내)
  level: Level;
}

export interface SentenceEntry {
  id: number;          // Tatoeba 문장 id
  japanese: string;
  targetWord: string;  // 문장 속 대상 단어 표기
  reading: string;     // 대상 단어 읽기
  translationKo: string;
}

export interface KanjiGroup {
  id: string;          // 기본자와 동일 (예: "木") 또는 "misc-N5"
  base: string;        // 기본자
  name: string;        // "木의 파생"
  kanji: string[];     // 소속 한자 (기본자 포함)
}

export interface LevelBundle {
  kanji: KanjiEntry[];
  words: WordEntry[];
  sentences: SentenceEntry[];
}

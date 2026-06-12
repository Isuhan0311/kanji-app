# 한자 학습 (JLPT N5~N2)

파생 구조로 배우는 일본어 상용한자 오프라인 학습 앱 (PWA).

## 설치 (가족/지인용)
1. 휴대폰 브라우저로 앱 주소를 연다: https://<계정>.github.io/kanji-app/
2. **iPhone**: Safari → 공유 버튼 → "홈 화면에 추가"
3. **Android**: Chrome → 메뉴(⋮) → "앱 설치" 또는 "홈 화면에 추가"
4. 이후에는 인터넷 없이 동작합니다. 진도는 기기에만 저장됩니다.

## 개발
- `npm run download:data` — 원본 데이터 다운로드 (data/raw/)
- `npm run build:data` — 학습 데이터 번들 생성 (public/data/)
- `npm run dev` / `npm test` / `npm run build`
- 훈음·뜻·그룹 보정: `data/overrides/*.json` 수정 후 `npm run build:data`

## 데이터 출처
- KANJIDIC2 (EDRDG, CC BY-SA 4.0) — davidluzgouveia/kanji-data 가공본 사용
- JLPT 어휘 목록 — elzup/jlpt-word-list
- 한국어 훈음 — libhangul hanja.txt
- 한자 분해 — CHISE IDS (cjkvi-ids)
- 예문 — Tatoeba (CC-BY 2.0 FR)

# 경제 교재 배치 E · 09 무역 / 10 재정 검증

확인일 2026-10-19. 기준 main `508403e979384fccdef23421b80f2875a0be8a27`, tree `2fb4c5c0a0261dfbe5e6a7dd1de28e38285b5477`. 범위는 09 `trade`·10 `fiscal-policy`. 기존 URL/readId/저장 구현 보존, 11·12 미구현.

## 선행 상태와 읽은 기준

AGENTS·ECONOMICS-TEXTBOOK-PLAN·ECONOMICS-SESSION-PROMPTS 세션 E 전체·CONTENT-AUTHORING·HOME-INFORMATION-ARCHITECTURE·MONEY-TEXTBOOK-PLAN·MONEY-BOOK-REVIEW·경제 A–D 기록과 관련 MDX/컴포넌트/모델/테스트를 확인했다. D 구현 및 최종 문서 main의 Actions [39226369907](https://github.com/Middleages/my-books/actions/runs/39226369907) head 508403e·completed/success 재확인. 기존 게시 JS index-D08rxe-4.js/CSS index-Bf7ssbMF.css와 8장 공개 상태를 확인하고 시작했다. 과거 대화만으로 완료를 가정하지 않았다.

## 구현과 공식 근거

계획의 E 장면표와 일치하는 5개 실험. 그림·표·판정은 독립 모델을 공유한다. 수출의 포함 관계·경상/금융 경계·국가별 물량과 교환 방향·네 주체 현금 이동과 별도 채무·같은 눈금 소득 비교와 집행 달력으로 관계를 설명한다. 각 장 MDX에 예측 질문·해설·확인 문제·이유·출처·가정을 배치했다.

공식 원문을 직접 확인: OECD Trade in value-added의 국내/해외 부가가치·RBA Balance of Payments의 경상/자산부채 분류·IMF International Trade의 비교우위/조정 비용·BEA FAQ552의 GDP 정부 구매/이전 구분·IMF Fiscal Policy의 자동안정화/시차/재원/효과 조건. 한국은행 주요통계 해설은 국제수지표·국민소득통계로 이어지는 공식 확인 경로다. 실제 통계 시계열·현행 세율·급여 자격은 사용하지 않았다. 영어 trade balance와 한국 통관 무역수지의 범위 차이를 본문에 명시했다.

## 모델·빌드

- 기준 전체 npm test: 282/282.
- 테스트 선작성 후 신규 모델 미존재로 ERR_MODULE_NOT_FOUND 실패 확인. 모델 추가 후 신규 7개 통과. 수출 0/100/200와 수입 비중0/40/100·경상/차입 분리·교환 보존·일방 손해·세금/구매/이전 27조합의 전 단계 현금2100 보존·비음수·채무 초과 흑자 현금·자동 반응·시차 경계·결정적 재실행·잘못된 입력 거부를 검사한다.
- 전체 npm test: 289/289 통과.
- npm run build: TypeScript·MDX·Vite production 통과. 초기 JSX option 태그 문법 오류를 발견·수정한 뒤 통과했다. 기존처럼 500kB 이상 단일 번들 경고가 있으며 실패가 아니다.

## 실제 화면·접근성·회귀

환경: Node 24.19.0, Playwright + 로컬 Chromium 153.0.8010.0, production dist를 같은 QA 프로세스의 HTTP 서버로 제공. 제품 소스에는 폰트 의존성을 추가하지 않았고 캡처 환경에만 Noto Sans KR을 주입했다.

`node /tmp/economics-e-qa.cjs` 최종 exit0, `node /tmp/e-extra.cjs` exit0. 수정 전과 수정 후 production 빌드를 각각 확인했다.

- 1440×1000·390×1000·320×1000에서 두 장 실제 렌더·전체 및 장면 캡처. 문서 가로 넘침0, main del0, 강조 별표 잔류 없음, 잘못된 문단 중첩0, Vite overlay0. 각 장 본문과 모든 정적 표 표시 확인.
- 수출 기본 국내분60, 수입 비중100%에서0, 총액0에서0. 예측 선택·두 단계 후 해설 일치. 대외 분류 기본 상품40/경상−15, 차입0으로 바꿔도 경상−15, 서비스+100에서 경상135.
- 교환 빵18개 조건에서 A 변화−6·양쪽 개선 아님, 기본9개로 초기화하면 양쪽 개선. 최종 그림의 A27/B9개·천12/6장과 정적 표 확인.
- 재정 5단계 후 채무350, 이전은 직접 구매에 포함되지 않는 예측 해설 확인. 시작채무0·세금300·구매/이전0에서 채무0·현금잔여300. 기본으로 초기화 확인.
- 안정화 기본 처분가능소득630/금액고정450·차이180·수지−280. 관찰6개월에서 추가구매100·수지−380, 소득1400에서 비교 차이−80. 초기화 확인.
- 재생을 제공하는 네 실험 각각 재생→정지→1.75초 상태 불변, 수동 단계, 재생 최종 도달(재정8.3초/나머지3.4초)·조건 초기화. 대외 분류는 정적 즉시 비교라 재생 불필요.
- 320px에서 summary 키보드 Enter→Tab으로 표에 접근, solid 포커스와 ArrowRight 실제 가로 스크롤 확인. 슬라이더 Home/End 키로 주요 경계값 조작.
- 일회용 context에서 미확인/기존 readId를 넣고 10장 읽음→새로고침, unknown/kept·money/inflation·economics/exchange-rates·economics/fiscal-policy 모두 보존. 사용자 브라우저 저장값은 변경하지 않았다.
- 실제 reduced-motion=true 상태에서 두 장의 다섯 실험 단계/정적 표 확인. 강조 요소 computed animationName none/transitionDuration0s, 자동 재생을 기다리지 않고 모든 관계 확인 가능.
- 경제07·08, 돈08, 네트워크02, 쿠버네티스01, 컴퓨터01 대표 링크/단계/슬라이더 조작. 홈5권49장, 돈·경제 필터2권·표지2개, 경제 목차10개와 소개01–10 안내 일치.
- 앱 pageerror와 console error/warn 수집0. 캡처를 직접 검토해 모바일의 수직 국가 배치·수출 내부 경계·경상/금융 분리·현금/채무 별도 눈금·집행 달력과 라벨을 확인했다. 1440/320px 조작 후 장면도 별도 캡처해 값과 관계를 직접 검토했다.

독립 코드 리뷰 후 자동 반응과 재량 구매를 합친 표 행의 라벨을 명시하고, 재생이 안정화 그림의 소득→규칙→달력 강조를 실제로 바꾸도록 수정했다. 고정 노동/생산성에서 생산 가능 범위가 확대된다는 오해를 막도록 생산 조합 변화로 문장을 고쳤다. E 강조 CSS는 새 장면에 한정했다. 리뷰 재확인에서 세 항목 해소. 수정 후 위 QA·전체289테스트·빌드·git diff --check 재통과.

최종 로컬 앱 자산 JS `index-DIKpzTjB.js`, CSS `index-ClFOeAJw.css`. 한국은행 주요통계 해설의 링크 대상 ECOS 세부 페이지는 문서 도구에서 본문0줄로 반환되어 그 세부 내용 열람을 통과로 기록하지 않는다. 위 개념 근거는 실제 열람한 OECD/RBA/IMF/BEA 원문과 구분한다.

## main·Actions·Pages

로컬 검증 완료. 아래에 실제 원격 반영·게시 결과를 추가한다.

## 미검증 경계

실제 iOS/Android 터치 기기·Safari/Firefox·스크린리더 음성 출력·자동 axe·독자 학습효과 실험은 미실행. 실제 거시경제 예측·공식 통계 재현·기존 전 장 전수 검증은 범위 밖이다.

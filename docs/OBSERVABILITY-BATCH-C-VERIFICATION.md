# 관측 C · 라벨 조합과 trace 시간

2026-10-20. 검증된 B를 선행 의존으로 별도 worktree에서05 labels·06 traces를 준비한다. 신규 A·B 게시 창과 분리하며 main 직접 쓰기와 실제 설치/관측 스택 호출은 없다.

cardinalityFrame은 동일12사건을0/4/8/12개씩 넣으며 template6·URL10·request_id12개 실제 조합을 만든다. 가능한 곱8/24/96은 전체fixture에서 미리 고정한 후보의 상한이며 관측값이 아니다. 같은 크기 사건 원과 라벨 구획의 분할을 기준/선택 두 패널로 비교하고 전체 tuple 목록을 정적으로 남긴다. 바이트 비용이나 stream과series의 동일 비용은 주장하지 않는다.

traceFrame은 종료 span만 수집하며 공통0–300ms 축을 쓴다. 병렬DB100+150ms 합250과 부모200을 구별하고 직렬은 부모300으로 비교한다. 전파 누락은 T-B 별도루트, 수집 누락은 미관측이다. 받은 span만 시작·끝 막대로 그리고, 미관측에는 원본 길이나 부모를 몰래 표시하지 않는다. 수집한 parent ID와 부모 기록 수집 여부도 별개다. 실험 원본 사실은 별도 disclosure에서 명시한다.

Grafana Loki cardinality, OpenTelemetry traces/context propagation을2026-10-20 재확인했다. 합성자료만 사용한다. 모델4테스트가 우선 통과했고 전체unit/build/production·직접PNG는 후속 게이트다. 실계측·Tempo/Loki·SDK 설치·main/Pages/live 성공은 아직 주장하지 않는다.

진행 중 최신 main `9c1df885218915bd368744e1420c3c17ce911fd1`을 fetch해 AGENTS·작성 지침이 기존과 동일함을 확인했다. 새4A의 main/Pages 게시 창을 변경하지 않고, C는 검증 B 기준 stacked 후보로 분리한다. 최종 코드 리뷰에서 전파가 끊긴 T-B를 T-A 자식 합에 넣지 않도록 필터를 보강했고 모델4테스트를 재통과했다. 전체1153테스트는 성공했으며 최종 build와 production/원본 시각 게이트는 아직 대기다.

최종 로컬 TypeScript/Vite build도 통과했다. browser verifier 문법·diff 검사 성공. 이 소스는 B branch 기준의 별도 draft PR에서 production와 직접 PNG를 확인할 예정이다.

첫 production run39404824673은 통과했지만 직접1440 원본에서 C waterfall의 obs-span-row/track 이름이 A 스타일과 충돌하여 축과 막대 시작점이 어긋남을 발견했다. C 전용 obs-rel-* 이름으로 분리하고 각 track과 시간축의 좌측·폭 오차가2px 미만인지 browser 검사에 추가한다. C 스타일이 A에 영향을 줄 가능성도 있어 수정 후 A signals 원본을 함께 재검토한다. 첫 캡처 생성만으로 시각 통과를 판정하지 않는다.

## 수정 후 소스 게이트 마감

2026-10-20 run39406104808 completed/success. 공개 PR58 head `c83bc647867f30ae211a206403e3c256d63f85ef`, tree `fa1e72ce242af388bed7fe312e1f324a8669dfb4`, 실제 checkout `d149e0a3d391b23994ca68aea0a4e1241f4dcfbf`의 tree가 일치한다. 로컬 전체1153테스트와 TypeScript/Vite build가 재통과했고 production 관측26검사·102PNG·오류0 및 book-volumes 검사가 성공했다. Chromium155.0.8059.39. artifact12257710925 ZIP SHA256 `4253ad1709e0b21497953b933b5bdd759a13d8bd4f6438fddf67e4c9a8083731`.

새 원본1440-traces-parallel,320-traces-missing,390-traces-propagation,1440-labels-request,1440-signals-initial,1440-signals-complete를 직접 열어 핵심 영역을 확인했다. trace 축과 모든 track의 시작·폭이 일치하고 병렬 시작30ms와 부모200ms를 같은 축으로 읽을 수 있다. 모바일 미관측은 길이0으로 표시하지 않고, 별도trace는 색과T-B 라벨로 구별된다. 같은12사건의6→12구획 분할이 유지된다. A signals의100/900ms 막대도 기존 배치로 유지되어 C CSS 영향이 제거됐다. 첫 실패 캡처는 최종 통과 증거로 사용하지 않았다.

이 마감은 B 의존 소스의 production 게이트이며 최신 main 통합 및 실제 Pages 게시 검증과는 별개다. 실제 수집 스택 실습은 미실행이다.

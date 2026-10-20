# 관측 C · 라벨 조합과 trace 시간

2026-10-20. 검증된 B를 선행 의존으로 별도 worktree에서05 labels·06 traces를 준비한다. 신규 A·B 게시 창과 분리하며 main 직접 쓰기와 실제 설치/관측 스택 호출은 없다.

cardinalityFrame은 동일12사건을0/4/8/12개씩 넣으며 template6·URL10·request_id12개 실제 조합을 만든다. 가능한 곱8/24/96은 전체fixture에서 미리 고정한 후보의 상한이며 관측값이 아니다. 같은 크기 사건 원과 라벨 구획의 분할을 기준/선택 두 패널로 비교하고 전체 tuple 목록을 정적으로 남긴다. 바이트 비용이나 stream과series의 동일 비용은 주장하지 않는다.

traceFrame은 종료 span만 수집하며 공통0–300ms 축을 쓴다. 병렬DB100+150ms 합250과 부모200을 구별하고 직렬은 부모300으로 비교한다. 전파 누락은 T-B 별도루트, 수집 누락은 미관측이다. 받은 span만 시작·끝 막대로 그리고, 미관측에는 원본 길이나 부모를 몰래 표시하지 않는다. 수집한 parent ID와 부모 기록 수집 여부도 별개다. 실험 원본 사실은 별도 disclosure에서 명시한다.

Grafana Loki cardinality, OpenTelemetry traces/context propagation을2026-10-20 재확인했다. 합성자료만 사용한다. 모델4테스트가 우선 통과했고 전체unit/build/production·직접PNG는 후속 게이트다. 실계측·Tempo/Loki·SDK 설치·main/Pages/live 성공은 아직 주장하지 않는다.

진행 중 최신 main `9c1df885218915bd368744e1420c3c17ce911fd1`을 fetch해 AGENTS·작성 지침이 기존과 동일함을 확인했다. 새4A의 main/Pages 게시 창을 변경하지 않고, C는 검증 B 기준 stacked 후보로 분리한다. 최종 코드 리뷰에서 전파가 끊긴 T-B를 T-A 자식 합에 넣지 않도록 필터를 보강했고 모델4테스트를 재통과했다. 전체1153테스트는 성공했으며 최종 build와 production/원본 시각 게이트는 아직 대기다.

최종 로컬 TypeScript/Vite build도 통과했다. browser verifier 문법·diff 검사 성공. 이 소스는 B branch 기준의 별도 draft PR에서 production와 직접 PNG를 확인할 예정이다.

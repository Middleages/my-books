# 관측 D · 계측과 표본·전달

2026-10-20. 관측 C를 선행 의존으로07instrumentation·08sampling-and-delivery를 별도 후보에서 구현한다. 전체 본문/모델/시각화는 교육용 합성 자료이며 실제 SDK·OTLP·Alloy·저장소·장애 실습은 없다.

`OBSERVABILITY-BATCH-D-MODEL-CONTRACT.md`의 계약을 따른다. 브라우저와 서버 SDK를 별도 프로세스 경계로 표시하고 업무1회와 계측 기록 수를 분리한다. 자동/수동/중복/전파 누락과 resource 변경을 비교한다. 표본10trace와 전달5사건은 독립 실험이며 분모를 섞지 않는다. ACK 유실은 수신됨과 발신자 확인됨을 분리하고, 보존식은 배타적인 pending/acknowledged/dropped 상태로 검사한다. 수신 고유 사건·복사본·시도 횟수는 별도 수량이다.

모델5테스트가 통과했다. 전체 unit 및 build·production·직접 원본 PNG 게이트는 아직 진행 전/중이며 성공으로 기록하지 않는다. 영향 책01–08과 book-volumes를 검증하고, 기존 A/B/C의 스타일 영향도 확인한다. 1440/390/320·정적·키보드·초기화·재생 정지·감소된 움직임을 포함한다. 모바일의 긴 두 실험 사이에 동일 단계 제어를 반복해 변화 가까이서 조작하게 했다.

공식 근거: OpenTelemetry 계측·context propagation·sampling·collector resiliency, 2026-10-20 확인. 제품 기본값·성능값·실운영 권장 설정으로 합성 수치를 제시하지 않는다. main 통합·Pages 게시 완료는 별도 게이트다.

전체1158 unit tests 통과. 마지막 환경 선택 UI와 browser 검증기 연결을 포함한 정확한 소스의 build·production은 별도 draft PR CI에서 확인한다. 공용 자원을 중복 소비하지 않도록 로컬 build는 실행하지 않았다. 이 후보를 아직 게시 완료로 표시하지 않는다.

첫 CI39409232556 전체 성공과 관측 원본을 확인했다. ACK 유실 반례의 방향 화살표가 고정 ‘ACK 확인’ 문구여서 실제 수신 성공처럼 읽힐 여지가 있었다. 현재 단계의 전송 실패/저장됨/ACK 유실/ACK 수신을 동적으로 표시하고 browser assertion을 추가한다. 최초 캡처를 최종 시각 통과로 사용하지 않고 수정 소스로 재검증한다.

## 수정 후 소스 게이트 마감

2026-10-20 run39409788373 completed/success. PR64 head `28cc3d74298cf15a5149edcd0d70553590d1ca7b`, tree `2aff2c0df778114673764a680a5c923cf20e8221`, 실제 checkout `09d5e1388bb954b89feeec4f9a5a3fe37b8fc4b2`의 tree 일치. 전체1158테스트/build·관측34검사144PNG·오류0 및 book-volumes 성공. Chromium155.0.8059.84. artifact12258522656 ZIP SHA256 `30a64e8b21ce93df54eb0f5e286f924cbc44bb62a165c34617b6f8b555b656ee`.

최종 원본1440-instrumentation-manual,320-instrumentation-propagation,1440-delivery-ack-pending,320-delivery-ack-retry,390-sampling-tail-complete,1440-traces-parallel을 직접 열어 핵심 영역을 확인했다. 업무1회와 기록2/3개, 브라우저·서버 경계, 저장됨/ACK 유실 동시 상태, 고유3·복사본6·시도6, 전체20%/표본66.7%가 구별된다. 모바일 제어가 표본 및 전달 실험 가까이에 있고 화살표 방향·현재 전송 상태가 일치한다. 기존 C 공통 시간축도 유지됐다.

이 마감은 C 선행 소스의 production 게이트다. 최신 main 통합·실제 Pages 게이트는 별도이며, 실제 스택 계측·장애 실습은 미실행이다.


## 최신 여덟 배치 합본 production 확인 — 2026-10-20

[PR72/run39415697607](https://github.com/Middleages/my-books/actions/runs/39415697607), 실제 checkout `8142a5ba33b5ea19e8e1850384afc7ecebb346d9` / tree `943169b8a80ee63cb5d08d3ee58e30d94c447bf5`에서 전체1339 단위/build 및 선택9 production이 성공했다. 이 책은 **34/34 검사·144원본 PNG**, 앱 및 별도 호스트 진단0, clean source다. artifact12260763269 ZIP SHA256 `5c9a2e057b31a5483b1e79ed1782fd24fbce68de513ecfa4e623933dfd9cb248` 일치. 정확한 공통 JS/CSS 바이트와 선택/생략 범위는 [합본 기록](FOLLOWUP-EIGHT-WAVE-VERIFICATION.md)에 남겼다.

직접 연 새 원본: `1440-delivery-ack-pending.png, 320-delivery-ack-retry.png, 390-instrumentation-duplicate.png`. 작성자가 세 원본의 핵심 영역을 직접 열었다. 저장3과pending3 동시 존재, 재전송6기록≠3고유사건, 실제요청1≠span3 및 모바일 ACK 역방향을 확인했다. 모바일은 원본 y1800–3600 범위도 분할해 읽었다. 선택 범위에서 새 의미·겹침·잘림 차단점을 찾지 못했다. 모든 144개·모든 정적 표행을 사람이 읽은 것은 아니며 실제 시스템·실기기·스크린리더·임상/금융 판단 검증을 의미하지 않는다. 이 절은 **소스 합본 production** 결과다. 선행 배치의 실제 게시 게이트 이후 main/Pages 및 exact-published 확인은 별도로 수행한다.


## 최신 합본 실제 게시 완료 — 2026-10-20

정확한 main `5b257ffccec0199c960a1ec25bec27e81351dc31`, tree `8addcb735c563962876bb6873c3b19d335932895`의 [run39425708305](https://github.com/Middleages/my-books/actions/runs/39425708305)에서 전체1342단위·build, 선택9종 production→Pages(13:08:22UTC)→같은9종 published를 완료했다. 이 책 실제 게시 보고서는 **35/35검사·144원본PNG**, clean source·앱/page/console/resource 오류0이다. 정확한 호스트 루트 favicon404 한 건만 별도 진단으로 남겼다. 실제 제공된 JS/CSS 전체 바이트는 같은 단일 build 및 앞선 합본 production과 일치한다.

published artifact12266832063, ZIP SHA256 `97294448fc6cd6bf2bb683234784c67725068842ea997691a0ea6adac30fc44a`를 실제 다운로드와 대조했다. 이 책의 대표 원본을 직접 열어 확인한 정확한 파일/범위, 전체 선택9/생략5, 자산 해시와 다른 책의 순서는 [합본 최종 기록](FOLLOWUP-EIGHT-WAVE-VERIFICATION.md#정확한-mainpages실제-게시-게이트--2026-10-20)에 보존했다. 원본 전수 사람 검토·실기기·실제 서비스·임상 감수와 후속 배치 게시를 이 결과로 대신하지 않는다.

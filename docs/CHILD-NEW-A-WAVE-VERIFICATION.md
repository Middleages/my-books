# 육아 2·3권 A 신규 등록 합본 검증

2026-10-20. 육아 2권 《잠과 생활 리듬》과 3권 《먹는 법을 배우는 시간》의 소개·01–02만 추가한 합본이다. **현재 합본 production·직접 원본·main/Pages/실제 게시 검증 전**이다. 선행 PR57과 PR63의 각 exact-main/live 게이트 뒤에만 게시한다. 두 책 B 이후와 첫권의 미래 장을 섞지 않는다.

## 정확한 범위와 보존

- 수면 A 검증 source: PR56 `842dcd2d17650569de8506e7e42718bcbe1c4ab9`, tree `b8d9c326`. 작성자의 run39403796489에서 최초10 production suite·전용26검사/49PNG와 직접8원본 게이트가 닫혔다. 인계 문서까지의 로컬 `89aa8b293ff4f018e24016478ede35a3c99eb659`를 보존했다.
- 먹기 A 검증 source: PR60 `10bfd420b689d403357e32623e145ce1c975ad04`, tree `43cfb07440271a470d2a169ff60809344e02b1d3`. run39406529341에서 최초11 production suite·전용26검사/53PNG와 수정 후 직접4원본 게이트가 닫혔다. 인계 문서까지의 로컬 `be8eefcf1e53d1ad3f6492ead2b68d616851cfc6`를 보존했다.
- 선행 PR63의 검증 source `f9ca8065ecff294b4f903a23935ba2cfe7ac7b45`, tree `4637e434d6b082becac26e3dc229c4f873388b98`와 그 문서 마감 `e11be48`을 시작점으로 삼았다. 첫권6·DB8·회계8·확률6·관측6·인증4·세금/주거12 등 기존 모든 카탈로그 partition과 공통 선언이 바이트/구조상 동일함을 검증했다. 기존15권의 chapter ID·readId·권차·읽음 저장을 바꾸지 않았다.
- 먹기 A의 본문·모델·컴포넌트·전용 verifier·테스트는 위 작성자 source와 같다. 수면 A는 아래 안전 보강25e05f1의 본문2문장과 렌더 assertion/PNG 추가만 구분해서 적용했으며 모델·컴포넌트·단위 테스트·카탈로그 partition은 원래 A와 같다. 수면의 실제 Tab 키보드 모드 검사, 먹기의850px 라벨 높이4.5em 및 막대 기준선 회귀를 보존했다. 표지는 새 두 분기만 더하고 기존 분기를 그대로 유지했다.
- 기존12개 suite를 삭제하지 않고 `child-sleep`, `child-feeding`을 더해14개를 명시 등록했다. `catalog-published-count`의 책별 연속 공개 prefix 검사도 보존했다. 총17권·139장으로 새 두 권은 각각 실제2장뿐이다.

## 교육 모델과 실제 근거의 경계

실제 아이 기록·사진·체중·건강정보 입력이나 업로드·외부 전송을 연결하지 않는다. 수면 모델은 침대 시간과 확인 수면·미확인을 구분하고, 첫돌 전 영아의 방/별도 수면 표면 경계를 설명한다. 먹기 모델은 제시/탐색/확인 섭취/흘림/미확인과 일반 연령 안내/개별 관찰/상담 질문을 구분한다. 정상 점수·개인 시작일·안전 확률·수면/영양 처방·임의 수유 중단·약물/응급 술기를 제공하지 않는다.

통합 검토에서도2026-10-20 [질병관리청 영아돌연사증후군](https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5467), [AAP 안전 수면 안내](https://www.healthychildren.org/English/ages-stages/baby/sleep/pages/a-parents-guide-to-safe-sleep.aspx), [CDC 보완식 시작 안내](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html), [WHO 영유아 먹이기](https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding)의 관련 원문을 읽었다. 본문이 일반 안내를 개인의 판정·한국 제품 인증·의료 전문가 감수로 바꾸지 않는지 대조했다. 저작물 전체나 기관 삽화를 복제하지 않았다. 임상·영양 전문가 감수, 실제 아동의 결과나 제품 안전성 검증은 미실행이다.

## 로컬·후속 게이트

전체1268/1268 단위 테스트를 동시성4로 실행해 생략 없이 통과했다. 새 등록의 공통 분류기 변경 때문에 실제 선택은 **14개 전체 production**이며 생략은 없다. 선택한 verifier의 단언·원본 캡처·정적 대안·키보드·reduced-motion을 줄이지 않는다. main workflow 배포 권한이나 명령은 바꾸지 않았다. 로컬 build와 합본의 실제 source/직접 원본 결과는 아래에 별도로 기록한다.

작성자별 기존 캡처가 새 합본 화면을 대신하지 않는다. 이 후보에서 두 책과 공용 홈을 실제로 다시 캡처해 핵심 관계·모바일 제어·원본 막대 기준선을 직접 확인해야 한다. 실제 Safari/Firefox·물리 기기·스크린리더 음성·의학적 안전성을 실행 테스트로 보증하지 않는다. 마지막 main/Pages와 전체14 published 및 정확한 JS/CSS 대조는 앞선 배치 게시 이후의 별도 게이트다.


로컬 build 후속: 2026-10-20 전체1268/1268 통과 뒤 `NODE_OPTIONS=--max-old-space-size=2048 npm run build`가484 modules로 한 번에 성공했다. 기존 대형 bundle 경고는 남아 있다. 같은 source에 실제 main `a2a017730aed91c416e8ba6535c62580a6646bf4`의 새4권 A 게시 마감 문서를 보존 병합했으며 앱/모델/검증기 바이트는 바뀌지 않았다. 새2권의 실제 합본 QA·직접 원본·게시 상태는 여전히 미완료다.

- `index-8riXVrno.css`: 409780bytes, SHA-256 `a10b9af0369d046f3d47fbcbbed326ac44cc8011eb5900814a5f15e5d837fcf0`.
- `index-Vxf9SJDJ.js`: 3469179bytes, SHA-256 `5c50ecb4d21bc1ac99de8c6d17a9a9ed2b899c9a3fedb436466b196c39237420`.


## 독립 읽기 검토 후 안전 실천 보강

추가 읽기 전용 검토는 임상 감수가 아니다. 기존 원고가 위험 행동을 허용하는 오류는 없었으나, 보호자가 잠들기 전 수유/달래기 뒤 영아를 별도 적합한 수면 공간으로 옮기는 것과 소파·푹신한 안락의자에서 영아와 함께 잠들지 않는 실천을 수면02의 첫돌 전 범위에 더 명시하도록 권고했다. 작성자의 최소 커밋 `25e05f1f01f41cc772c2cbf80e267aa1d6257c61`을 그대로 적용했다. 근거는 기존 KDCA 생활습관 관리6와 AAP 방 공유 절이며 모델·카탈로그 변경은0이다. 이 보강은 앞선 작성자 A 앱 바이트와 다른 실제 본문 delta로 기록한다.

전용 verifier는 기존 검사 하나도 제거하지 않고320/390/850/1440에서 새 문단의 실제 렌더·넘침 검사·`caregiver-boundary` 원본 캡처를 더했다. 보강 후 전체 unit/build와 이 합본14 production 및 새 문단 직접 원본을 다시 확인하기 전 완료로 쓰지 않는다. 이전 build 자산은 위에 역사로 남기고 최종 보강 자산은 아래에 별도로 기록한다.


안전 보강 후2026-10-20 전체1268/1268 단위와484 modules production build를 다시 통과했다. 수면 실행 소스는 작성자25e05f1과, 먹기는 be8eefcf와 동일하며 새로운 임의 모델 변경은 없다. 최종 보강 자산:
- `index-8riXVrno.css`: 409780bytes, SHA-256 `a10b9af0369d046f3d47fbcbbed326ac44cc8011eb5900814a5f15e5d837fcf0`.
- `index-nWgtlK9n.js`: 3469492bytes, SHA-256 `73057201aacf30c4108391cdcf189f7efe8637b8e83ca83491cd6fb82ef83b9b`.

이 결과는 로컬 단위/build이며 실제 합본14 production과 새 안전 문단 원본·main/Pages 게이트를 대신하지 않는다.

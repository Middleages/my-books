# 두 번째 다섯 후속 배치 통합 검증

2026-10-20 UTC. 회계 D07–08·확률 C05–06·육아 발달 C05–06·인증 B03–04·관측 C05–06을 합친 **미게시 후보**다. 새4A 실제 게시, 이어지는 다섯 후속 배치의 실제 게시를 먼저 닫은 뒤에만 이 후보를 main/Pages에 반영한다. DB E·확률 D·육아 다음 권과 다른 더 뒤 배치는 포함하지 않는다.

## 보존과 범위

실제 main `9c1df885218915bd368744e1420c3c17ce911fd1`의 모든 소스·마감 기록과, PR57의 검증 앱 및 새 검증 기록을 보존한 로컬 `fdb6f459e799e7f8e50b4683c34dd53655aef24d` 위에서 통합했다. 이후 PR57의 확률 교차 검토와 알려진 DB 강조 렌더 한계도 문서로 보존했다. 이 순서는 선행 두 파동의 공개 완료를 주장하지 않는다.

| 추가 배치 | 보존한 작성자 소스·마감 |
| --- | --- |
| 회계 D07–08 | 공개9237a74cc1c8339883435f27e20020d8775cb190 / 로컬5e36ab17545df0863cc39c920a00b54333c83fe4 |
| 확률 C05–06 | 공개af9366499cb2d011c913e33713bc5de8da1be702 / 로컬631affd730a6dd0c9e034f6742d59fb4c372dd2a 및 검증 문서 전용 마감 |
| 육아 발달 C05–06 | 공개26f16d287dbb34c43172223075a4ed3840f68b42 / 로컬86bb94cb1817dada43827d5648591e65ee7b6005 |
| 관측 C05–06 | 공개c83bc647867f30ae211a206403e3c256d63f85ef / 문서8cf947be347a14e7022607543abfba1c694dee36 |
| 인증 B03–04 | 공개f59e523165b8e0bef5053ab4f99a0cca8c65855a / 문서5358ff7e0ba796e21087928195e8cde36d8ed6c5 |

다섯 책의 본문·컴포넌트·순수 모델·전용 브라우저 검증기·테스트가 작성자 소스와 바이트 단위로 동일함을 확인했다. 카탈로그는 책별 import·chapter·book 레코드만 통합하고, 구조적 파싱으로 공용 선언과 비대상 책 레코드가 이전 합본과 같음을 검증했다. workflow·suite 등록/선택기·package·lockfile·공통 표지/홈은 변경하지 않았다. 기존 ID·readId·권차·저장 키와 미지 읽음 ID를 보존한다.

후보는15권·135개 본문이며 대상 책 읽음 분모는 회계8·확률6·발달6·인증4·관측6이다. 비대상 DB8·주거12·세금12와 나머지 책의 범위를 그대로 둔다.

## 영향 범위와 실행 구분

diff 분류기의 선택은 book-volumes·accounting·probability·child-development·authentication·observability **6개 suite**다. insurance·investing·tax·database·kubernetes·housing·observability **7개 suite는 의도적으로 미실행**이며 통과로 기록하지 않는다. 선택된 각 suite의 기존 단언·키보드·reduced-motion·정적 대안·원본 캡처 범위는 줄이지 않는다. 전체 unit/build와 공용 홈/권차는 계속 검사한다.

이 통합의 전체 단위 검사는 모든 파일을 유지한 `node --test --test-concurrency=4 tests/*.test.mjs`로관측 C 추가 뒤1259/1259 통과했다. 앞선 네 배치 후보는1255/1255 뒤 Vite467모듈 변환에서 프로세스가 Killed로 끝났으며 빌드 성공으로 기록하지 않는다. 현재 다섯 배치는 다른 무거운 빌드를 직렬화하고 `NODE_OPTIONS=--max-old-space-size=2048 npm run build`로 한 번 재검증해 TypeScript·Vite472모듈 build를 통과했다. 이 제약은 로컬 프로세스에만 적용했으며 package/workflow 기본값을 바꾸지 않았다.  실제 합본 production·새 원본 직접 검토·main/Pages·정확한 공개 JS/CSS·published 게이트는 아직 미실행이다. 작성자별 source 검증을 합본의 실제 브라우저 성공으로 대신하지 않는다.

금융 예측·실제 DB/인증 시스템·실제 아이 진단을 검증하지 않는다. 실기기/스크린리더 음성·임상 감수의 증거도 없다. 검증된 구체적 화면 범위만 기록하며 모든 캡처/정적 표를 수동 검토했다고 확대하지 않는다.


로컬 검증 앱 소스는 `e0f918c352000ee0ae92ddca2a0384b62362f951`다. 그 뒤 이 기록 추가는 실행 바이트를 바꾸지 않는다. 산출물은 다음과 같다.
- `index-DKODbtgK.js`, 3429586 bytes, SHA-256 `7e0931a3924a4aed1d16974f2889349cc9fc17ad24857603fc602d7802f6c6a7`.
- `index-QmcLr7Yc.css`, 404022 bytes, SHA-256 `c790afef6f9b247780d4b02ae98ad173da299a9dbba989487ddf0979304c1122`.

# 쿠버네티스 배치 F 검증 기록

작성일: 2026-10-18 (KST). 범위 **11–12만**, 기준 main `21b44fb88639b6c19e9ed33724044e783360ebb2`.

## 선행 확인·공개 계약

AGENTS.md, CONTENT-AUTHORING, HOME-INFORMATION-ARCHITECTURE, 교재 계획·세션 F 전체, LAB-ENVIRONMENT, A–E 검증 기록과 기존 재생·자원·Service·Ingress·probe/rollout 모델을 확인했다. E 구현 `2483fc7e7203dc0960de1d563a5fb18e6821d870`, [Actions 39098731915](https://github.com/Middleages/my-books/actions/runs/39098731915)의 completed/success를 API로 재확인하고 실제 게시 09 화면과 01–10 목차를 관찰했다. 기존 지정 폭·reduced-motion 미검증 기록은 유지한다.

- 11: `#/kubernetes/helm`, readId `kubernetes/helm`.
- 12: `#/kubernetes/troubleshooting`, readId `kubernetes/troubleshooting`.
- 본문 Helm.mdx / Troubleshooting.mdx, UI HelmDiagnosisLabs.tsx / helm-diagnosis.css, 모델 helm-diagnosis.mjs / .d.mts, tests/kubernetes-helm-diagnosis.test.mjs.
- 소개·10 마지막 연결·catalog·README의 공개 범위만 01–12에 맞춤. 기존 39개 readId 전부 유지, 두 개만 추가해 총 41장. 기존 홈·표지·읽음 저장 키/파서·돈·경제·네트워크 소스 무변경.
- 설치·복구·폐쇄망 부록은 G. 새 13장이나 전체 구조 리팩터링 없음.

## 모델과 근거

2026-10-18 공식 Helm 4.3.1 표시의 charts/template/install/upgrade/rollback/history/hooks/CRD 문서, Kubernetes v1.35 Pod·Service 진단/Pod lifecycle/Deployment·kubectl logs, OpenSSL s_client 옵션을 확인했다. 본문 링크 및 LAB-ENVIRONMENT에 기준과 미실행 상태를 남김.

- Helm: 고정 chart/3필드, template의 로컬 출력과 API 적용 분리. 개발/운영 값, ConfigMap/replicas/이미지 변경 비교. release revision과 Deployment revision 별도 상태. 적용 대기 중 이전 성공 release는 deployed를 유지하고 완료 뒤 superseded로 전환. rollback은 이전 기록을 대상으로 새 revision 생성.
- 가상 chart 0.1.0·release study·namespace books-lab. checksum annotation 없는 별도 ConfigMap, API 적용 성공을 가정. 출력 YAML은 전체 manifest가 아닌 설명용 발췌. 실제 Helm/Go template/임의 코드 평가 없음. 외부 DB/PVC 데이터는 변경·복구하지 않음.
- 진단: Pending, pull 실패, 반복 종료, ready 없음, selector, targetPort, Ingress 규칙, 외부 TLS 여덟 가상 사례. 선택한 관측이 부족하면 원인 확정 없음. 보조 관측을 명시하며 상태 문자열·HTTP 코드 하나로 원인을 확정하지 않음.
- 08 resourceFrames, 04 serviceFrames, 05 ingressFrames 판정 재사용. 지도에서 점선은 미확정, 굵은 경계는 조사 지점이며 나머지 정상 보장 아님. 조사 지도와 HTTP 경로 구분.
- 기존 Playback 훅의 타이머 정리·reset 재사용. 조건 변경 시 단계·예측·재생 초기화. 정적 단계에는 Helm의 목표/적용 값·이력·revision 수치도 포함. CSS k8f 범위, 좁은 화면은 세로 배치, reduced-motion에서 효과 제거.

판단: runnable chart를 제공하지 않으므로 실제 helm template 수행을 주장하지 않는다. Helm 4.3.1은 문서 기준 후보이며 바이너리 설치/렌더/클러스터 실행 미검증이다. G에서 실제 패키지와 실행 검증을 별도로 제공해야 한다. 기존 실습 후보 버전은 바꾸지 않았다.

## 자동 검증·리뷰

제공 Linux, Node v24.19.0. npm ci --offline 성공.

- 신규 모델 파일 부재 실패 확인 → 신규 15개 통과.
- 독립 읽기 전용 리뷰: pending 시 이전 revision을 너무 일찍 superseded로 만드는 문제, install의 최종 설명, 정적 단계에서 수치 비교 누락 발견. 모두 정확성/정적 접근성 기준의 수정으로 판단. 회귀 실패 확인 후 수정.
- 최종 신규 **17개**, 전체 `npm test` **237/237** 통과.
- `npm run build` TypeScript·Vite production 성공. 기존 단일 번들의 500kB 경고는 유지.
- Vite SSR + React renderToStaticMarkup: 쿠버네티스 12장 모두 렌더됨, HTML parser로 중첩 p 0. 새 11/12는 의도하지 않은 del·리터럴 ** 없음. SSR은 브라우저 레이아웃/조작 검증이 아님.
- 01/03에서 기존 강조 기호 노출 각 1곳 발견(replica/desired state 첫 정의). F 범위 밖이므로 변경하지 않고 G 전체 편집 점검에 인계. 용어 뜻/ID 자체는 유지.
- 기존 readId 39개 보존 + 신규 2개, reading 모델 회귀 포함 전체 테스트 통과. 임의 읽음 ID 브라우저 주입 시험과 구분한다.
- `git diff --check` 통과. 원격 main 재조회 시 기준과 동일.

## 화면 검증 환경

Browser skill 사용. 연결 브라우저 plugin js 도구가 노출되지 않아 Cloud Browser 사용. Vite의 기본 0.0.0.0 preview는 uv_interface_addresses 오류였으나 **127.0.0.1 명시 시 시작 성공**. Cloud Browser에서 해당 localhost로 접근은 ERR_CONNECTION_REFUSED라 로컬 실제 화면 검증은 불가했다.
현재 브라우저 API는 viewport 변경/media emulation/임의 storage 쓰기를 제공하지 않는다. **1440/390/320px·reduced-motion media 실기·알 수 없는 ID 브라우저 주입**은 미검증이다. CSS/SSR/모델 테스트를 대체 통과로 쓰지 않는다. Safari·실제 터치·스크린리더 음성도 미검증. 배포 후 가능한 실제 게시 조작·가독성·읽음 reload는 아래 기록한다.

## main·배포·실제 게시

- 구현 main: `9329cbe2239aa2692c2d854b0d97bdeb6ea91628`. 검증한 로컬 tree와 원격 tree `d09fc61c863d2a33e989650c428ff4ea7bd4d5de` 일치 확인 후 non-force 반영.
- [Actions 39102209042](https://github.com/Middleages/my-books/actions/runs/39102209042): completed/success, build·deploy 성공. 게시 JS `index-D_dJX4os.js`, CSS `index-C75Uz6cD.css` 확인.
- 실제 URL: https://middleages.github.io/my-books/#/kubernetes/helm 및 https://middleages.github.io/my-books/#/kubernetes/troubleshooting.
- Cloud Chrome 1363×936: 11/12 가로 넘침 없음, 중첩 p·의도치 않은 del·리터럴 강조 기호 없음. 11의 화면 캡처로 패널/포커스 가독성 확인.
- 11: template 출력만/설치 없음, prod install replicas 2·각 revision 1, ConfigMap upgrade의 pending/deployed/superseded 이력과 Deployment revision 1 유지, 이미지 upgrade의 Deployment revision 2, 이미지 rollback의 Helm/Deployment revision 3 및 v1 복원 확인.
- 11 재생 완료 4/4, 정지 후 1/4 유지, 이전/다시 보기, Enter 한 단계 진행, 조건 변경 초기화, 정적 단계의 수치/이력 표시 확인. 재생 중 12로 이동하고 진단 화면의 초기 1/4 상태 확인.
- 12: 부족한 get 증거는 원인 확정 없음. Pending/events와 나머지 일곱 사례의 해당 관측을 각각 4/4까지 조작하여 다음 조사·재확인 내용을 확인. TLS 정적 대안에 이름 불일치·HTTP 이전 경계 표시 확인.
- 11/12 각각 읽음 표시 → 새로고침 유지 → 시험 표시 취소 확인. 기존 읽음 전체 초기화는 하지 않았다.
- 콘솔 조회에서 관찰된 오류는 chrome-extension의 metadata 전달 오류이며 앱 오류로 분류하지 않았다. 지정 폭·reduced-motion·스크린리더 등의 미검증 제한은 위와 같다.
- 최종 기록 반영 전 최신 main `4e080d8`의 경제 배치 B를 fast-forward로 받아 보존했다. 당시 전체 장 수는 경제 두 장 추가로 43장이다. F의 기존 39개 ID 보존 검사는 구현 기준 main에 대한 기록이다.

실제 클러스터·CLI·이미지 실행·DB/볼륨 조작은 미실행이다.

## 다음 범위

G: 설치·첫 배포/복구/폐쇄망 선택 부록과 전체 통합 점검. 남은 화면 검증·01/03 강조 표기를 먼저 확인한다. 앱 전환 계획은 12장에 짧게 연결했고 실제 서버 전환을 실행하지 않았다.

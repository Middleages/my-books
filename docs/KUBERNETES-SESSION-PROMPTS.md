# 쿠버네티스 교재 — 세션별 실행 프롬프트

작성일: 2026-10-18 (KST). [교재 계획](KUBERNETES-TEXTBOOK-PLAN.md)이 범위와 설계의 기준이다.

A → B → C → D → E → F → G 순서로 새 세션 하나에 해당 코드 블록 전체를 복사한다. 같은 교재의 여러 배치를 동시에 시작하지 않는다. 직전 세션이 main 반영·사이트 배포를 마치면 다음으로 넘어간다. 다른 교재 병행 변경은 최신 main에서 보존한다.

각 프롬프트는 공통 기준을 포함해 독립적으로 전달할 수 있다. 선행 세션 결과가 문서와 다르면 실제 소스·Actions·게시 버전으로 확인한다. 배치별 현재 상태는 교재 계획 10절과 각 KUBERNETES-BATCH-*-VERIFICATION.md를 기준으로 확인한다. 다음 배치는 직전 배치의 배포 상태와 미검증 항목을 확인한 뒤 이어 간다.

## 세션 A — 소개·01~02: 교재의 출발점

```text
Middleages/my-books의 쿠버네티스 교재 개발을 이어서 진행하자.
반드시 최신 main과 작업 트리를 확인하고 다음 문서를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/KUBERNETES-TEXTBOOK-PLAN.md
- docs/KUBERNETES-SESSION-PROMPTS.md
- 존재하는 docs/KUBERNETES-LAB-ENVIRONMENT.md와 이전 KUBERNETES-BATCH-*-VERIFICATION.md
기존 관련 본문·UI·모델·테스트도 먼저 검토해줘. 다른 세션의 돈 교재·홈 변경을 보존하고 과거 커밋을 현재 기준으로 쓰지 마.
선행 구현은 없으며 이번이 최초 배치 A야.

이번에는 책 소개와 01 컨테이너 다음에 필요한 것(why-kubernetes), 02 클러스터의 지도(cluster-map)만 구현해줘.
- Docker/Compose/Kubernetes가 맡는 실행·복구·업데이트 책임을 비교하고, Compose의 재시작 기능과 Kubernetes 도입 비용도 공정하게 설명해줘.
- 이미지와 실행 인스턴스, 앱 종료와 단일 VM 종료의 차이를 그림으로 보여줘.
- 사용자·API·controller·scheduler·kubelet·runtime·노드의 경계를 보여주고 제어 경로와 앱 HTTP 요청 경로를 구분해줘.
- context/namespace/권한과 클러스터 관리자·namespace 사용자의 역할을 소개해줘.
- bookId kubernetes, 분야 technology, 제목 ‘웹앱 운영자를 위한 쿠버네티스’로 등록하고 자체 SVG 표지를 추가해줘. 구현한 소개·01~02만 공개해줘.
- docs/KUBERNETES-LAB-ENVIRONMENT.md에 가상 앱 study-web의 계약, 선택 실습환경, 버전 후보와 실제 실행 확인 여부를 기록해줘. 이번에 실제 서버 설치나 기존 서버 변경은 하지 마.
- 기존 재생 UI를 검토해 필요한 최소 공통 요소만 재사용해줘. 03 이후의 모델을 미리 대규모 구현하지 마.
공통 구현·완료 기준:
본문은 MDX, 시각 UI는 React/TypeScript, 판정·관찰 프레임은 별도 모델로 작성해줘. 그림·애니메이션·수치·주소·판정·해설은 같은 모델 상태를 사용하고, 입력 폼·결과 숫자·긴 로그로 시각 설명을 대신하지 마.
재생·정지·이전 단계·한 단계 진행·다시 보기·초기화를 제공하고 설정 변경 시 단계·예측을 일관되게 초기화해줘. 정지·장 이동 시 타이머와 효과를 정리해줘. 모바일 재배치, 키보드, reduced-motion, 정적 단계 설명을 제공해줘.
기술적 사실은 기준 버전의 Kubernetes·K3s·Helm 등 공식 자료로 확인하고 출처·확인일·교육 모델의 가정과 생략을 표시해줘. MDX 문단 중첩·포맷터 JSX 문단·전역 CSS 간섭도 확인해줘.
기존 URL/chapterId/readId/읽음 키·알 수 없는 저장 ID, 다른 교재, 홈 분야·표지를 보존해줘. 이번 배치의 실제 구현 장만 공개해줘.
모델 테스트·전체 npm test·production 빌드·1440/390/320px 화면·접근성·읽음 저장·영향받는 기존 핵심 실험 회귀를 검증해줘. 최신 main의 다른 작업을 통합하고 main 반영·GitHub Pages Actions 성공·실제 게시 버전까지 확인해줘.
계획의 진행 상태와 이번 배치 검증 문서를 갱신하고 기준 커밋·검증 결과·공개 ID·배포 결과·미검증·다음 범위를 남겨줘. 실제 클러스터 실행과 웹 시뮬레이션 검증을 구분하고, 실행하지 못한 항목을 통과로 보고하지 마.
이번 검증 문서는 docs/KUBERNETES-BATCH-A-VERIFICATION.md에 남겨줘.
```

## 세션 B — 03~04: 원하는 상태와 앱 연결

```text
Middleages/my-books의 쿠버네티스 교재 개발을 이어서 진행하자.
반드시 최신 main과 작업 트리를 확인하고 다음 문서를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/KUBERNETES-TEXTBOOK-PLAN.md
- docs/KUBERNETES-SESSION-PROMPTS.md
- 존재하는 docs/KUBERNETES-LAB-ENVIRONMENT.md와 이전 KUBERNETES-BATCH-*-VERIFICATION.md
기존 관련 본문·UI·모델·테스트도 먼저 검토해줘. 다른 세션의 돈 교재·홈 변경을 보존하고 과거 커밋을 현재 기준으로 쓰지 마.
선행 배치 A까지의 코드·검증 기록·main 반영·배포 상태를 확인해줘. 선행 구현이 없으면 후속 장을 임의로 먼저 만들지 말고 미완료 범위를 알려줘.

이번에는 03 원하는 상태와 Pod(desired-state), 04 바뀌는 Pod와 고정된 입구(service-discovery)만 구현해줘.
- Deployment→ReplicaSet→Pod 소유 관계와 desired/current/ready 수를 같은 모델로 표현해줘.
- Pod 삭제, 컨테이너 재시작, replica 변경, 노드 불가를 비교하고 Pod UID 교체와 같은 Pod 내 재시작을 구분해줘.
- Service selector→EndpointSlice의 ready 대상→port/targetPort→Pod 경로를 보여주고, Pod 교체 후 주소가 바뀌어도 Service 이름으로 찾는 과정을 표현해줘.
- namespace별 DNS, selector 불일치, 잘못된 targetPort, ready 대상 없음의 관측 차이를 설명해줘.
- Service를 독립 프록시 Pod로 그리지 말고 교육 모델의 데이터 전달 방식·생략 조건을 표시해줘. 네트워크 교재의 Service 판정 모델을 먼저 검토해줘.
- 05 이후의 외부 진입·상세 probe는 이번에 확장하지 말고 필요한 연결 설명만 넣어줘.
공통 구현·완료 기준:
본문은 MDX, 시각 UI는 React/TypeScript, 판정·관찰 프레임은 별도 모델로 작성해줘. 그림·애니메이션·수치·주소·판정·해설은 같은 모델 상태를 사용하고, 입력 폼·결과 숫자·긴 로그로 시각 설명을 대신하지 마.
재생·정지·이전 단계·한 단계 진행·다시 보기·초기화를 제공하고 설정 변경 시 단계·예측을 일관되게 초기화해줘. 정지·장 이동 시 타이머와 효과를 정리해줘. 모바일 재배치, 키보드, reduced-motion, 정적 단계 설명을 제공해줘.
기술적 사실은 기준 버전의 Kubernetes·K3s·Helm 등 공식 자료로 확인하고 출처·확인일·교육 모델의 가정과 생략을 표시해줘. MDX 문단 중첩·포맷터 JSX 문단·전역 CSS 간섭도 확인해줘.
기존 URL/chapterId/readId/읽음 키·알 수 없는 저장 ID, 다른 교재, 홈 분야·표지를 보존해줘. 이번 배치의 실제 구현 장만 공개해줘.
모델 테스트·전체 npm test·production 빌드·1440/390/320px 화면·접근성·읽음 저장·영향받는 기존 핵심 실험 회귀를 검증해줘. 최신 main의 다른 작업을 통합하고 main 반영·GitHub Pages Actions 성공·실제 게시 버전까지 확인해줘.
계획의 진행 상태와 이번 배치 검증 문서를 갱신하고 기준 커밋·검증 결과·공개 ID·배포 결과·미검증·다음 범위를 남겨줘. 실제 클러스터 실행과 웹 시뮬레이션 검증을 구분하고, 실행하지 못한 항목을 통과로 보고하지 마.
이번 검증 문서는 docs/KUBERNETES-BATCH-B-VERIFICATION.md에 남겨줘.
```

## 세션 C — 05~06: 외부 진입과 설정

```text
Middleages/my-books의 쿠버네티스 교재 개발을 이어서 진행하자.
반드시 최신 main과 작업 트리를 확인하고 다음 문서를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/KUBERNETES-TEXTBOOK-PLAN.md
- docs/KUBERNETES-SESSION-PROMPTS.md
- 존재하는 docs/KUBERNETES-LAB-ENVIRONMENT.md와 이전 KUBERNETES-BATCH-*-VERIFICATION.md
기존 관련 본문·UI·모델·테스트도 먼저 검토해줘. 다른 세션의 돈 교재·홈 변경을 보존하고 과거 커밋을 현재 기준으로 쓰지 마.
선행 배치 B까지의 코드·검증 기록·main 반영·배포 상태를 확인해줘. 선행 구현이 없으면 후속 장을 임의로 먼저 만들지 말고 미완료 범위를 알려줘.

이번에는 05 외부 요청과 TLS(ingress-tls), 06 설정과 비밀정보(configuration)만 구현해줘.
- 브라우저→외부 진입→Ingress controller→Service→Pod의 구간·주소/포트·프로토콜·host/path·TLS 종료 위치를 같은 프레임으로 보여줘.
- Ingress 리소스와 controller·ServiceLB를 구분하고, k3s 기본 80/443 사용과 기존 호스트 NGINX의 공존·충돌을 비교해줘. 임의로 기존 호스트 프록시를 제거하도록 설명하지 마.
- 기존 인증서·프록시 모델을 검토하고 구간별 TLS 검증의 독립성을 유지해줘. Ingress API와 특정 controller의 지원 상태를 혼동하지 말고 Gateway API의 위치도 짧게 연결해줘.
- 이미지·ConfigMap·Secret·실행 프로세스를 분리하고 환경변수/마운트 파일 갱신·앱 재읽기·재시작 차이를 보여줘. subPath 등 생략/예외를 밝혀줘.
- base64와 암호화를 구분하고 Secret 접근 권한·저장 보호를 설명해줘. 모든 예는 가상 값만 쓰고 실제 자격 증명 입력을 요구하지 마.
- 07 이후 스토리지·자원 실험은 다음 배치로 남겨줘.
공통 구현·완료 기준:
본문은 MDX, 시각 UI는 React/TypeScript, 판정·관찰 프레임은 별도 모델로 작성해줘. 그림·애니메이션·수치·주소·판정·해설은 같은 모델 상태를 사용하고, 입력 폼·결과 숫자·긴 로그로 시각 설명을 대신하지 마.
재생·정지·이전 단계·한 단계 진행·다시 보기·초기화를 제공하고 설정 변경 시 단계·예측을 일관되게 초기화해줘. 정지·장 이동 시 타이머와 효과를 정리해줘. 모바일 재배치, 키보드, reduced-motion, 정적 단계 설명을 제공해줘.
기술적 사실은 기준 버전의 Kubernetes·K3s·Helm 등 공식 자료로 확인하고 출처·확인일·교육 모델의 가정과 생략을 표시해줘. MDX 문단 중첩·포맷터 JSX 문단·전역 CSS 간섭도 확인해줘.
기존 URL/chapterId/readId/읽음 키·알 수 없는 저장 ID, 다른 교재, 홈 분야·표지를 보존해줘. 이번 배치의 실제 구현 장만 공개해줘.
모델 테스트·전체 npm test·production 빌드·1440/390/320px 화면·접근성·읽음 저장·영향받는 기존 핵심 실험 회귀를 검증해줘. 최신 main의 다른 작업을 통합하고 main 반영·GitHub Pages Actions 성공·실제 게시 버전까지 확인해줘.
계획의 진행 상태와 이번 배치 검증 문서를 갱신하고 기준 커밋·검증 결과·공개 ID·배포 결과·미검증·다음 범위를 남겨줘. 실제 클러스터 실행과 웹 시뮬레이션 검증을 구분하고, 실행하지 못한 항목을 통과로 보고하지 마.
이번 검증 문서는 docs/KUBERNETES-BATCH-C-VERIFICATION.md에 남겨줘.
```

## 세션 D — 07~08: 데이터와 자원

```text
Middleages/my-books의 쿠버네티스 교재 개발을 이어서 진행하자.
반드시 최신 main과 작업 트리를 확인하고 다음 문서를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/KUBERNETES-TEXTBOOK-PLAN.md
- docs/KUBERNETES-SESSION-PROMPTS.md
- 존재하는 docs/KUBERNETES-LAB-ENVIRONMENT.md와 이전 KUBERNETES-BATCH-*-VERIFICATION.md
기존 관련 본문·UI·모델·테스트도 먼저 검토해줘. 다른 세션의 돈 교재·홈 변경을 보존하고 과거 커밋을 현재 기준으로 쓰지 마.
선행 배치 C까지의 코드·검증 기록·main 반영·배포 상태를 확인해줘. 선행 구현이 없으면 후속 장을 임의로 먼저 만들지 말고 미완료 범위를 알려줘.

이번에는 07 Pod가 바뀌어도 남을 것(storage), 08 자원이 모자랄 때(resources)만 구현해줘.
- writable layer·emptyDir·PVC/PV·노드 디스크의 경계를 그리고 컨테이너 재시작/Pod 교체/노드 상실/PVC 삭제를 비교해줘.
- 선택한 local storage와 reclaim 정책의 조건을 명시하고, PVC가 복제·백업을 자동 보장하는 것처럼 표현하지 마. 단일 replica 데이터 예제와 외부 DB의 책임을 구분해줘.
- 노드 allocatable·requests·limits·실사용량을 별도로 표시해줘. CPU가 한가해도 requests 때문에 Pending일 수 있는 경우를 조작하게 해줘.
- CPU throttling과 메모리 OOM을 다른 현상으로 설명하고 메모리 한도 초과 즉시 종료라는 단정은 피해야 해. namespace quota와 노드 여유도 구분해줘.
- 단일 노드와 고정된 배치 규칙을 가정한 교육 모델임을 명시하고 실제 scheduler/cgroup 전체를 재현하지 마.
- 실제 스토리지·클러스터 삭제 명령을 실행하지 말고, 09 이후는 다음 배치로 남겨줘.
공통 구현·완료 기준:
본문은 MDX, 시각 UI는 React/TypeScript, 판정·관찰 프레임은 별도 모델로 작성해줘. 그림·애니메이션·수치·주소·판정·해설은 같은 모델 상태를 사용하고, 입력 폼·결과 숫자·긴 로그로 시각 설명을 대신하지 마.
재생·정지·이전 단계·한 단계 진행·다시 보기·초기화를 제공하고 설정 변경 시 단계·예측을 일관되게 초기화해줘. 정지·장 이동 시 타이머와 효과를 정리해줘. 모바일 재배치, 키보드, reduced-motion, 정적 단계 설명을 제공해줘.
기술적 사실은 기준 버전의 Kubernetes·K3s·Helm 등 공식 자료로 확인하고 출처·확인일·교육 모델의 가정과 생략을 표시해줘. MDX 문단 중첩·포맷터 JSX 문단·전역 CSS 간섭도 확인해줘.
기존 URL/chapterId/readId/읽음 키·알 수 없는 저장 ID, 다른 교재, 홈 분야·표지를 보존해줘. 이번 배치의 실제 구현 장만 공개해줘.
모델 테스트·전체 npm test·production 빌드·1440/390/320px 화면·접근성·읽음 저장·영향받는 기존 핵심 실험 회귀를 검증해줘. 최신 main의 다른 작업을 통합하고 main 반영·GitHub Pages Actions 성공·실제 게시 버전까지 확인해줘.
계획의 진행 상태와 이번 배치 검증 문서를 갱신하고 기준 커밋·검증 결과·공개 ID·배포 결과·미검증·다음 범위를 남겨줘. 실제 클러스터 실행과 웹 시뮬레이션 검증을 구분하고, 실행하지 못한 항목을 통과로 보고하지 마.
이번 검증 문서는 docs/KUBERNETES-BATCH-D-VERIFICATION.md에 남겨줘.
```

## 세션 E — 09~10: 상태 점검과 업데이트

```text
Middleages/my-books의 쿠버네티스 교재 개발을 이어서 진행하자.
반드시 최신 main과 작업 트리를 확인하고 다음 문서를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/KUBERNETES-TEXTBOOK-PLAN.md
- docs/KUBERNETES-SESSION-PROMPTS.md
- 존재하는 docs/KUBERNETES-LAB-ENVIRONMENT.md와 이전 KUBERNETES-BATCH-*-VERIFICATION.md
기존 관련 본문·UI·모델·테스트도 먼저 검토해줘. 다른 세션의 돈 교재·홈 변경을 보존하고 과거 커밋을 현재 기준으로 쓰지 마.
선행 배치 D까지의 코드·검증 기록·main 반영·배포 상태를 확인해줘. 선행 구현이 없으면 후속 장을 임의로 먼저 만들지 말고 미완료 범위를 알려줘.

이번에는 09 살아 있음과 준비됨(health-checks), 10 교체하면서 배포하기(rollout)만 구현해줘.
- startup/liveness/readiness 시간선·실패 횟수·임계값·ready 대상 변화·컨테이너 재시작을 같은 상태로 연결해줘.
- readiness 실패가 곧 재시작을 의미하지 않음을 보여주고, startup 성공 전 동작과 외부 DB 장애를 무조건 liveness로 검사할 때의 문제를 설명해줘.
- old/new ReplicaSet·desired/ready 수와 maxSurge/maxUnavailable을 연결해 단계별 교체를 보여줘. 먼저 정수 조건으로 설명하고 비율을 넣으면 반올림 규칙을 검증해줘.
- 새 버전 준비 실패·자원 부족·명시적 rollback을 비교하고 이전 장의 자원/ready 정의를 재사용해줘.
- 무중단이나 자동 rollback을 일반적으로 보장하지 마. Deployment rollback과 DB/PVC/외부 상태 복구를 구분해줘.
- 실제 시간과 교육용 단계의 차이, 종료 유예·기존 연결 처리 등의 생략 조건을 밝혀줘. 11 이후는 다음 배치로 남겨줘.
공통 구현·완료 기준:
본문은 MDX, 시각 UI는 React/TypeScript, 판정·관찰 프레임은 별도 모델로 작성해줘. 그림·애니메이션·수치·주소·판정·해설은 같은 모델 상태를 사용하고, 입력 폼·결과 숫자·긴 로그로 시각 설명을 대신하지 마.
재생·정지·이전 단계·한 단계 진행·다시 보기·초기화를 제공하고 설정 변경 시 단계·예측을 일관되게 초기화해줘. 정지·장 이동 시 타이머와 효과를 정리해줘. 모바일 재배치, 키보드, reduced-motion, 정적 단계 설명을 제공해줘.
기술적 사실은 기준 버전의 Kubernetes·K3s·Helm 등 공식 자료로 확인하고 출처·확인일·교육 모델의 가정과 생략을 표시해줘. MDX 문단 중첩·포맷터 JSX 문단·전역 CSS 간섭도 확인해줘.
기존 URL/chapterId/readId/읽음 키·알 수 없는 저장 ID, 다른 교재, 홈 분야·표지를 보존해줘. 이번 배치의 실제 구현 장만 공개해줘.
모델 테스트·전체 npm test·production 빌드·1440/390/320px 화면·접근성·읽음 저장·영향받는 기존 핵심 실험 회귀를 검증해줘. 최신 main의 다른 작업을 통합하고 main 반영·GitHub Pages Actions 성공·실제 게시 버전까지 확인해줘.
계획의 진행 상태와 이번 배치 검증 문서를 갱신하고 기준 커밋·검증 결과·공개 ID·배포 결과·미검증·다음 범위를 남겨줘. 실제 클러스터 실행과 웹 시뮬레이션 검증을 구분하고, 실행하지 못한 항목을 통과로 보고하지 마.
이번 검증 문서는 docs/KUBERNETES-BATCH-E-VERIFICATION.md에 남겨줘.
```

## 세션 F — 11~12: Helm과 종합 진단

```text
Middleages/my-books의 쿠버네티스 교재 개발을 이어서 진행하자.
반드시 최신 main과 작업 트리를 확인하고 다음 문서를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/KUBERNETES-TEXTBOOK-PLAN.md
- docs/KUBERNETES-SESSION-PROMPTS.md
- 존재하는 docs/KUBERNETES-LAB-ENVIRONMENT.md와 이전 KUBERNETES-BATCH-*-VERIFICATION.md
기존 관련 본문·UI·모델·테스트도 먼저 검토해줘. 다른 세션의 돈 교재·홈 변경을 보존하고 과거 커밋을 현재 기준으로 쓰지 마.
선행 배치 E까지의 코드·검증 기록·main 반영·배포 상태를 확인해줘. 선행 구현이 없으면 후속 장을 임의로 먼저 만들지 말고 미완료 범위를 알려줘.

이번에는 11 반복 배포를 묶기(helm), 12 증거로 고치기(troubleshooting)만 구현해줘.
- chart+values→렌더링 YAML→release/revision→리소스의 관계를 그림과 작은 설정 비교로 보여줘.
- template/install/upgrade/rollback을 구분하고 Helm release revision과 Deployment revision을 혼동하지 않게 해줘. CLI는 기준 Helm 주요 버전의 공식 문서로 확인해줘.
- 브라우저 안에서는 제한된 가상 템플릿 모델을 사용하고 실제 Helm 실행/임의 코드 평가로 표현하지 마. 실제 샘플 chart를 제공하면 helm template 등 실행 검증 여부를 별도로 기록해줘.
- Pending, 이미지 가져오기 실패, CrashLoopBackOff, ready 대상 없음, Service/Ingress 경로, TLS 실패를 증거 카드와 다음 관측 선택으로 진단하게 해줘.
- get/describe/events/logs/previous/rollout의 사용 이유와 실행 위치를 연결해줘. 상태 문자열 하나로 원인을 확정하지 마.
- 기존 호스트 프록시·외부 DB를 유지하며 앱 하나씩 전환하는 계획을 짧게 연결하고 01~12의 용어·공개 범위를 검토해줘.
- 설치·복구·폐쇄망 부록 전체는 G에서 완성해. 13장이나 고급 Kubernetes 교재를 추가하지 마.
공통 구현·완료 기준:
본문은 MDX, 시각 UI는 React/TypeScript, 판정·관찰 프레임은 별도 모델로 작성해줘. 그림·애니메이션·수치·주소·판정·해설은 같은 모델 상태를 사용하고, 입력 폼·결과 숫자·긴 로그로 시각 설명을 대신하지 마.
재생·정지·이전 단계·한 단계 진행·다시 보기·초기화를 제공하고 설정 변경 시 단계·예측을 일관되게 초기화해줘. 정지·장 이동 시 타이머와 효과를 정리해줘. 모바일 재배치, 키보드, reduced-motion, 정적 단계 설명을 제공해줘.
기술적 사실은 기준 버전의 Kubernetes·K3s·Helm 등 공식 자료로 확인하고 출처·확인일·교육 모델의 가정과 생략을 표시해줘. MDX 문단 중첩·포맷터 JSX 문단·전역 CSS 간섭도 확인해줘.
기존 URL/chapterId/readId/읽음 키·알 수 없는 저장 ID, 다른 교재, 홈 분야·표지를 보존해줘. 이번 배치의 실제 구현 장만 공개해줘.
모델 테스트·전체 npm test·production 빌드·1440/390/320px 화면·접근성·읽음 저장·영향받는 기존 핵심 실험 회귀를 검증해줘. 최신 main의 다른 작업을 통합하고 main 반영·GitHub Pages Actions 성공·실제 게시 버전까지 확인해줘.
계획의 진행 상태와 이번 배치 검증 문서를 갱신하고 기준 커밋·검증 결과·공개 ID·배포 결과·미검증·다음 범위를 남겨줘. 실제 클러스터 실행과 웹 시뮬레이션 검증을 구분하고, 실행하지 못한 항목을 통과로 보고하지 마.
이번 검증 문서는 docs/KUBERNETES-BATCH-F-VERIFICATION.md에 남겨줘.
```

## 세션 G — 선택 실습 부록과 최종 통합

```text
Middleages/my-books의 쿠버네티스 교재 개발을 이어서 진행하자.
반드시 최신 main과 작업 트리를 확인하고 다음 문서를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/KUBERNETES-TEXTBOOK-PLAN.md
- docs/KUBERNETES-SESSION-PROMPTS.md
- 존재하는 docs/KUBERNETES-LAB-ENVIRONMENT.md와 이전 KUBERNETES-BATCH-*-VERIFICATION.md
기존 관련 본문·UI·모델·테스트도 먼저 검토해줘. 다른 세션의 돈 교재·홈 변경을 보존하고 과거 커밋을 현재 기준으로 쓰지 마.
선행 배치 F까지의 코드·검증 기록·main 반영·배포 상태를 확인해줘. 선행 구현이 없으면 후속 장을 임의로 먼저 만들지 말고 미완료 범위를 알려줘.

이번에는 새로운 번호 장을 추가하지 말고 계획 6절의 선택 실습 부록과 전체 통합 점검을 완료해줘.
- 환경과 첫 배포: 일회용 Linux VM의 기준 버전·구성·context/namespace, 최소 앱 v1 배포→Service→외부 진입→v2 업데이트→rollback→실습 자원 정리를 연결해줘.
- 기존 본문의 예제와 같은 앱/포트/이미지 계약을 사용하고 examples/kubernetes/에 필요한 최소 앱·manifest·chart·README를 정리해줘. 실제로 없는 이미지 주소를 실행 가능한 예제로 쓰지 마.
- 운영과 복구: manifest·클러스터 datastore/토큰·PV 파일/외부 DB의 백업 대상을 구분해줘. 선택한 datastore별 공식 절차와 별도 일회용 환경에서 복원 확인하는 방법을 설명해줘.
- 폐쇄망과 공존: 바이너리·이미지·chart·registry·CA·프록시·DNS·시간 동기화의 의존성 지도와 기존 NGINX/외부 DB 공존을 설명해줘.
- 제공된 실행 환경에서 가능한 정적 검사·Helm 렌더링·일회용 실습을 수행하고, 클러스터를 실행할 수 없으면 그 한계와 독자가 확인할 명령·기대 관측을 명확히 남겨줘. 사용자 사내/운영 서버를 변경하거나 실제 토큰을 요청하지 마.
- 01~12 및 부록의 링크·용어·버전·가정·출처·모바일·접근성·읽음 기록·핵심 실험을 최종 검토해줘. 필요한 범위의 수정만 하고 다른 교재를 일괄 개편하지 마.
- 브라우저 모델/manifest 정적 검증/실제 클러스터 실습/사이트 배포 완료를 각각 구분해 최종 상태를 기록해줘.
공통 구현·완료 기준:
본문은 MDX, 시각 UI는 React/TypeScript, 판정·관찰 프레임은 별도 모델로 작성해줘. 그림·애니메이션·수치·주소·판정·해설은 같은 모델 상태를 사용하고, 입력 폼·결과 숫자·긴 로그로 시각 설명을 대신하지 마.
재생·정지·이전 단계·한 단계 진행·다시 보기·초기화를 제공하고 설정 변경 시 단계·예측을 일관되게 초기화해줘. 정지·장 이동 시 타이머와 효과를 정리해줘. 모바일 재배치, 키보드, reduced-motion, 정적 단계 설명을 제공해줘.
기술적 사실은 기준 버전의 Kubernetes·K3s·Helm 등 공식 자료로 확인하고 출처·확인일·교육 모델의 가정과 생략을 표시해줘. MDX 문단 중첩·포맷터 JSX 문단·전역 CSS 간섭도 확인해줘.
기존 URL/chapterId/readId/읽음 키·알 수 없는 저장 ID, 다른 교재, 홈 분야·표지를 보존해줘. 이번 배치의 실제 구현 장만 공개해줘.
모델 테스트·전체 npm test·production 빌드·1440/390/320px 화면·접근성·읽음 저장·영향받는 기존 핵심 실험 회귀를 검증해줘. 최신 main의 다른 작업을 통합하고 main 반영·GitHub Pages Actions 성공·실제 게시 버전까지 확인해줘.
계획의 진행 상태와 이번 배치 검증 문서를 갱신하고 기준 커밋·검증 결과·공개 ID·배포 결과·미검증·다음 범위를 남겨줘. 실제 클러스터 실행과 웹 시뮬레이션 검증을 구분하고, 실행하지 못한 항목을 통과로 보고하지 마.
이번 검증 문서는 docs/KUBERNETES-BATCH-G-VERIFICATION.md에 남겨줘.
```

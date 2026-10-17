# 교과서 콘텐츠 작성 기준

적용일: 2026-10-17. 신규 본문은 **MDX**, 실험 UI는 **React/TypeScript**, 판정·계산은
별도 모델 파일로 작성한다. 장 수보다 본문 수정의 편의성을 기준으로 도입했다.

## 작성 위치와 역할

- `src/content/<bookId>/<Chapter>.mdx`: 설명·제목·문단·목록·표·출처와 실험 배치.
- `src/components/<bookId>/`: 상태·입력·단계 진행·결과 표시 등 상호작용.
- `src/simulations/<bookId>/`: UI와 독립적인 판정/계산. 기존 `.mjs` 모델은 현재 테스트 체계를 유지한다.
- `src/catalog.ts`: 장의 import와 id/readId/번호/제목. MDX import는 `.mdx` 확장자를 명시한다.

MDX 안에 복잡한 상태 처리나 판정 함수를 넣지 않는다. 기존 TSX 본문은 그대로
동작하며 대규모 일괄 전환은 하지 않는다. 본문을 크게 개정할 때 점진적으로 옮긴다.
이번 배치에서는 기존 04장 `Ports.mdx`만 시범 전환했다. 이미 작성한 07~09 TSX는
유지하고, **이후 추가하는 본문은 MDX를 기본으로 사용한다.**

## 예시

```mdx
import { Check, Sources } from "./shared";
import { MyLab } from "../../components/network/MyLab";

<section className="prose">

## 쉬운 질문에서 시작하기

일반 문단은 Markdown으로 쓴다. **중요한 말**과 `예시 코드`도 그대로 쓴다.

| 관찰 | 의미 |
| --- | --- |
| 연결 성공 | 앱의 업무 성공까지 뜻하지 않음 |

</section>

<MyLab />

<section className="prose">

## 실제 상황에 적용

관측 위치와 다음 확인 항목을 설명한다.

<Check question="무엇까지 알 수 있나요?" children="이 관찰이 뒷받침하는 범위까지만 알 수 있습니다." />

<Sources items={[["공식 근거", "https://example.org/spec"]]} />

</section>
```

JSX 컨테이너 안에서 Markdown을 쓸 때는 여는/닫는 태그와 본문 사이에 빈 줄을 둔다.
`Check`는 내부에 문단을 만들므로 짧은 답은 위처럼 `children` 문자열로 전달해
문단 중첩을 피한다. 코드 블록은 fenced code block을 사용한다. 주의 상자·학습 목표는
기존 `note`, `learning-goals` 클래스를 사용하는 작은 JSX 컨테이너로 감싼다.

## 빌드와 신뢰 경계

Vite에 `@mdx-js/rollup`과 `remark-gfm`을 추가했다. GFM 표를 지원하고,
`@types/mdx`로 TS의 MDX import 타입을 제공한다. Next.js나 사이트 구조 변경은 없다.
빌드 시 저장소 안의 신뢰한 MDX만 컴파일한다. 사용자 입력·원격 문서를 실행 가능한
MDX로 동적 평가하지 않는다. TypeScript 검사는 React/model 코드를, Vite 빌드는
MDX 문법과 import를 검사한다. MDX 내부의 모든 컴포넌트 prop이 TS로 완전히
검사된다고 가정하지 않고 실제 렌더와 조작도 검증한다.

## 전환/추가 완료 조건

1. 기존 URL, chapter id, readId, localStorage 키를 보존한다.
2. 학습 목표 → 쉬운 설명 → 필요한 실험 → 실제 적용 → 확인 문제·출처 순서를 유지한다.
3. 표·코드·링크·퀴즈·실험이 렌더링되고 예측·초기화가 동작해야 한다.
4. `npm test`, `npm run build`를 통과한다.
5. 데스크톱·모바일 폭에서 가로 넘침·줄바꿈·포커스·콘솔 오류를 확인한다.
6. 읽음 표시 후 새로고침과 기존 장의 링크·실험을 회귀 확인한다.

참고: https://mdxjs.com/packages/rollup/ · https://mdxjs.com/docs/getting-started/

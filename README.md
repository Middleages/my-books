# my books

직접 실험하며 배우는 개인 인터랙티브 교과서.

React + TypeScript + Vite 기반의 GitHub Pages 정적 웹사이트입니다. 로그인이나 서버 없이 실행되며 읽음 기록은 현재 브라우저의 localStorage에 저장됩니다.

## 개발

Node.js 22 이상에서:

```sh
npm ci
npm run dev
npm test
npm run build
```

## 배포

GitHub Settings → Pages → Source를 **GitHub Actions**로 설정합니다. main push 시 테스트와 빌드 후 자동 배포됩니다. PR에서는 빌드만 실행합니다.

예정 주소: https://middleages.github.io/my-books/

프로젝트 하위 경로는 vite.config.ts의 base에서 설정합니다. 해시 라우팅을 사용하므로 챕터 링크를 직접 열거나 새로고침해도 Pages의 404 문제를 피합니다.

## 콘텐츠 구성

- src/catalog.ts: 챕터 목록과 소개
- src/main.tsx: 책 목록, 본문, 읽기 기록
- src/Labs.tsx: 실험 UI
- src/models.mjs: 화면과 분리한 계산 모델
- tests/models.test.mjs: 계산 가정과 단위 검증

첫 책은 컴퓨터의 작동 원리이며 CPU/GPU 병렬화와 데이터 전송의 두 챕터를 제공합니다. 시뮬레이션은 교육용 이상 모델이며 실제 장비 성능을 예측하지 않습니다. 각 본문에 가정과 참고 자료를 표시합니다.

본문이 늘어나면 MDX 기반 챕터 파일로 분리할 수 있습니다. 사용자 데이터 동기화나 서버 기능은 현재 포함하지 않습니다.

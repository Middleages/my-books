import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { chapters } from "./catalog";
import { ParallelLab, MemoryLab } from "./Labs";
import "./style.css";
const storageKey = "my-books:read:v1";
function loadRead(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(v)
      ? v.filter(
          (x): x is string =>
            typeof x === "string" && chapters.some((c) => c.id === x),
        )
      : [];
  } catch {
    return [];
  }
}
function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || "/"),
    [read, setRead] = useState(loadRead),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const onHash = () => {
      setRoute(location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const chapter = chapters.find((c) => route === `/computer/${c.id}`);
  const home = route === "/";
  useEffect(() => {
    document.title = chapter
      ? `${chapter.title} · my books`
      : "my books · 직접 실험하며 배우는 교과서";
  }, [chapter]);
  function toggleRead(id: string) {
    const next = read.includes(id)
      ? read.filter((x) => x !== id)
      : [...read, id];
    setRead(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice("이 브라우저에 학습 기록을 저장했어요.");
    } catch {
      setNotice("브라우저 저장이 제한되어 이번 방문에서만 표시됩니다.");
    }
  }
  return (
    <>
      <a
        className="skip"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        본문으로 건너뛰기
      </a>
      <header>
        <a className="brand" href="#/">
          my books
        </a>
        <nav aria-label="전체 메뉴">
          <a href="#/">교과서</a>
          <span aria-hidden="true">│</span>
          <a
            href="https://github.com/Middleages/my-books"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </nav>
      </header>
      {home ? (
        <main id="main-content" tabIndex={-1} className="library">
          <section className="intro">
            <h1>
              읽는 데서 한 걸음 더.
              <br />
              <span>직접 실험하며 이해하기.</span>
            </h1>
            <p>
              궁금했던 원리를 나만의 속도로 탐색하는 교과서.
              <br />
              숫자를 바꾸고, 차이를 발견하고, 이해한 것을 쌓아갑니다.
            </p>
          </section>
          <div className="section-heading">
            <h2>나의 교과서</h2>
            <span>1권 · 2개 챕터 · 2개 실험</span>
          </div>
          <a className="book" href="#/computer/parallel">
            <div className="cover" aria-hidden="true">
              <span>
                COMPUTER
                <br />
                SCIENCE
              </span>
              <div className="cover-grid">
                {Array.from({ length: 16 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
              <b>01</b>
            </div>
            <div className="book-content">
              <small>컴퓨터 · 하드웨어</small>
              <h2>컴퓨터의 작동 원리</h2>
              <p>
                CPU와 GPU는 어떻게 다를까?
                <br />
                계산과 데이터 이동을 작은 실험으로 이해합니다.
              </p>
              <span className="progress-label">
                {read.length} / {chapters.length} 챕터 읽음
              </span>
              <progress
                aria-label="교과서 읽기 진행률"
                value={read.length}
                max={chapters.length}
              />
              <strong>
                교과서 펼치기 <span aria-hidden="true">↗</span>
              </strong>
            </div>
          </a>
          <section className="chapter-list">
            <h2>어디부터 시작할까요?</h2>
            {chapters.map((c) => (
              <a key={c.id} href={`#/computer/${c.id}`}>
                <span className="chapter-number">{c.number}</span>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                </div>
                <span>{read.includes(c.id) ? "읽음" : "읽기 →"}</span>
              </a>
            ))}
          </section>
          <footer>
            작은 질문에서 시작해, 한 챕터씩 쌓아갑니다.
            <br />
            학습 기록은 현재 브라우저에만 저장됩니다.
          </footer>
        </main>
      ) : chapter ? (
        <div className="reader">
          <aside>
            <a className="back" href="#/">
              ← 교과서 목록
            </a>
            <h2>컴퓨터의 작동 원리</h2>
            <nav aria-label="챕터 목차">
              {chapters.map((c) => (
                <a
                  key={c.id}
                  aria-current={chapter.id === c.id ? "page" : undefined}
                  href={`#/computer/${c.id}`}
                >
                  <span>{c.number}</span>
                  {c.title}
                  {read.includes(c.id) && <small>✓</small>}
                </a>
              ))}
            </nav>
            <p className="sidebar-note">{read.length} / 2 챕터 읽음</p>
          </aside>
          <main id="main-content" tabIndex={-1} className="chapter">
            <p className="breadcrumb">컴퓨터의 작동 원리 / {chapter.number}</p>
            <h1>{chapter.heading}</h1>
            {chapter.id === "parallel" ? (
              <>
                <p className="lead">
                  여러 개의 코어는 동시에 여러 작업을 처리하여 전체 실행 시간을
                  줄일 수 있습니다. 하지만 모든 작업이 병렬로 처리될 수 있는
                  것은 아닙니다.
                </p>
                <ParallelLab />
                <section className="prose">
                  <h2>직렬 구간이 만드는 한계</h2>
                  <p>
                    앞 단계의 결과가 있어야 다음 단계로 넘어갈 수 있는 작업은
                    순서대로 실행해야 합니다. 이 직렬 구간은 처리 장치를 늘려도
                    그대로 남습니다. 이 관계를 설명하는 것이{" "}
                    <strong>암달의 법칙</strong>입니다.
                  </p>
                  <p className="formula">속도 향상 = 1 ÷ ((1 − p) + p ÷ N)</p>
                  <p>
                    p는 병렬화 가능한 비율, N은 동일한 처리 장치의 수입니다.
                    전체 작업의 90%를 병렬화하고 8개로 나누면 약 4.71배
                    빨라집니다. 처리 장치를 무한히 늘려도 나머지 10% 때문에
                    10배가 한계입니다.
                  </p>
                  <h2>그럼 CPU와 GPU는?</h2>
                  <p>
                    CPU는 복잡한 제어와 다양한 작업의 빠른 응답에, GPU는 많은
                    데이터에 비슷한 연산을 반복하는 처리에 적합하게 설계됩니다.
                    단순히 코어 수만 비교해서 성능을 판단할 수는 없습니다.
                  </p>
                  <div className="note">
                    <strong>이 실험의 가정</strong>
                    <p>
                      처리 장치의 성능은 동일하고, 작업은 균등하게 나뉘며,
                      통신·동기화 비용은 없다고 가정합니다. CPU와 GPU의 실제
                      성능 비교나 벤치마크가 아닙니다.
                    </p>
                  </div>
                  <details>
                    <summary>직접 생각해 보기</summary>
                    <p>
                      병렬화 비율을 0%로 바꾸면 어떻게 될까요? 처리 장치를
                      32개로 늘려도 1배입니다. 빨라질 수 있는 작업 자체가 없기
                      때문입니다.
                    </p>
                  </details>
                  <h3>참고 자료</h3>
                  <a
                    href="https://doi.org/10.1145/1465482.1465560"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Gene M. Amdahl (1967), Validity of the single processor
                    approach… ↗
                  </a>
                </section>
              </>
            ) : (
              <>
                <p className="lead">
                  연산 장치가 아무리 빨라도 데이터가 도착하지 않으면 기다려야
                  합니다. 메모리 용량과 대역폭을 구분하고, 데이터를 옮기는 데
                  드는 시간을 살펴봅니다.
                </p>
                <MemoryLab />
                <section className="prose">
                  <h2>용량은 보관할 양, 대역폭은 이동 속도</h2>
                  <p>
                    RAM과 VRAM의 용량은 데이터를 얼마나 담을 수 있는지
                    나타냅니다. 대역폭은 1초 동안 얼마나 많은 데이터를 옮길 수
                    있는지 나타냅니다. 용량이 크다고 전송 속도가 항상 빨라지는
                    것은 아닙니다.
                  </p>
                  <h2>계산 전에 생기는 대기 시간</h2>
                  <p>
                    예를 들어 CPU 쪽 메모리의 데이터를 GPU로 옮긴 뒤 계산한다면
                    전송에도 시간이 필요합니다. 계산이 아주 짧은 작업은 이 이동
                    비용이 전체 시간을 좌우할 수 있습니다.
                  </p>
                  <div className="note">
                    <strong>이 실험의 가정</strong>
                    <p>
                      MB와 GB는 10진 단위입니다(1 GB = 1,000 MB). 표시한
                      대역폭을 지속적으로 모두 활용한다고 가정하며, 지연
                      시간·프로토콜 오버헤드·경합은 제외합니다. 실제 장비의 전송
                      시간을 보장하지 않습니다.
                    </p>
                  </div>
                  <details>
                    <summary>직접 생각해 보기</summary>
                    <p>
                      데이터 크기를 2배로 늘리면 전송 시간도 2배입니다.
                      대역폭까지 2배로 늘리면 시간은 원래대로 돌아옵니다.
                    </p>
                  </details>
                  <h3>참고 자료</h3>
                  <a
                    href="https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    NVIDIA CUDA C++ Best Practices Guide · Data Transfer ↗
                  </a>
                </section>
              </>
            )}
            <div className="chapter-actions">
              <button
                className={read.includes(chapter.id) ? "secondary" : "primary"}
                onClick={() => toggleRead(chapter.id)}
              >
                {read.includes(chapter.id)
                  ? "✓ 읽음 · 표시 취소"
                  : "읽음으로 표시"}
              </button>
              <a href={chapter.id === "parallel" ? "#/computer/memory" : "#/"}>
                {chapter.id === "parallel"
                  ? "다음: 메모리와 데이터 이동 →"
                  : "교과서 목록으로 →"}
              </a>
            </div>
            <p className="save-note" role="status">
              {notice || "학습 기록은 현재 브라우저에만 저장됩니다."}
            </p>
          </main>
        </div>
      ) : (
        <main id="main-content" tabIndex={-1} className="library">
          <h1>챕터를 찾을 수 없어요.</h1>
          <a href="#/">교과서 목록으로 돌아가기</a>
        </main>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

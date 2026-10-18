import { useEffect, useState, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { books, chapters, chapterHref } from "./catalog";
import { parseRead, storageKey } from "./reading.mjs";
import "./style.css";
import { Library } from "./components/Library";
function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  const [read, setRead] = useState<string[]>(() => {
    try {
      return parseRead(localStorage.getItem(storageKey));
    } catch {
      return [];
    }
  });
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const onHash = () => {
      setRoute(location.hash.slice(1) || "/");
      setNotice("");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const chapter = chapters.find((c) => route === `/${c.bookId}/${c.id}`);
  const book = books.find(
    (b) => b.id === chapter?.bookId || route === `/${b.id}`,
  );
  const bookChapters = chapters.filter((c) => c.bookId === book?.id);
  const count = (id: string) =>
    chapters.filter((c) => c.bookId === id && read.includes(c.readId)).length;
  const next = chapter
    ? bookChapters[bookChapters.indexOf(chapter) + 1]
    : undefined;
  useEffect(() => {
    document.title = `${chapter?.title || book?.title || "직접 실험하며 배우는 교과서"} · my books`;
  }, [chapter, book]);
  function toggleRead(id: string) {
    const updated = read.includes(id)
      ? read.filter((x) => x !== id)
      : [...read, id];
    setRead(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
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
      {route === "/" ? (
        <Library read={read} />
      ) : book ? (
        <div className="reader">
          <aside>
            <a className="back" href="#/">
              ← 교과서 목록
            </a>
            <h2>{book.title}</h2>
            <nav aria-label="챕터 목차">
              <a
                href={`#/${book.id}`}
                aria-current={!chapter ? "page" : undefined}
              >
                책 소개
              </a>
              {bookChapters.map((c) => (
                <a
                  key={c.id}
                  href={chapterHref(c)}
                  aria-current={chapter?.id === c.id ? "page" : undefined}
                >
                  <span>{c.number}</span>
                  {c.title}
                  {read.includes(c.readId) && <small>✓</small>}
                </a>
              ))}
            </nav>
            <p className="sidebar-note">
              {count(book.id)} / {bookChapters.length} 챕터 읽음
            </p>
          </aside>
          <main id="main-content" tabIndex={-1} className="chapter">
            {chapter ? (
              <>
                <p className="breadcrumb">
                  {book.title} / {chapter.number}
                </p>
                <h1>{chapter.heading}</h1>
                <chapter.Content key={chapter.readId} />
                <div className="chapter-actions">
                  <button
                    className={
                      read.includes(chapter.readId) ? "secondary" : "primary"
                    }
                    onClick={() => toggleRead(chapter.readId)}
                  >
                    {read.includes(chapter.readId)
                      ? "✓ 읽음 · 표시 취소"
                      : "읽음으로 표시"}
                  </button>
                  <a href={next ? chapterHref(next) : `#/${book.id}`}>
                    {next ? `다음: ${next.title} →` : "책 목차로 →"}
                  </a>
                </div>
                <p className="save-note" role="status">
                  {notice || "학습 기록은 현재 브라우저에만 저장됩니다."}
                </p>
              </>
            ) : (
              <>
                <p className="breadcrumb">{book.category}</p>
                <h1>{book.title}</h1>
                <p className="lead">{book.overview}</p>
                {book.future && (
                  <div className="note">
                    <strong>기초 감각부터 차근차근</strong>
                    <p>{book.future}</p>
                  </div>
                )}
                {book.Intro && <book.Intro />}
                <section className="chapter-list">
                  <h2>지금 읽을 수 있는 장</h2>
                  {bookChapters.map((c) => (
                    <a key={c.id} href={chapterHref(c)}>
                      <span className="chapter-number">{c.number}</span>
                      <div>
                        <h3>{c.title}</h3>
                        <p>{c.description}</p>
                      </div>
                      <span>{read.includes(c.readId) ? "읽음" : "읽기 →"}</span>
                    </a>
                  ))}
                </section>
              </>
            )}
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
  <StrictMode>
    <App />
  </StrictMode>,
);

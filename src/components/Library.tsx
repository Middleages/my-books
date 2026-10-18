import { useState } from "react";
import { books, chapters, bookCategories, type BookCategory } from "../catalog";
import "./library.css";
import { BookCover } from "./BookCover";

export function Library({ read }: { read: string[] }) {
  const [category, setCategory] = useState<BookCategory | "all">("all");
  const entries = books.map((book) => {
    const contents = chapters.filter((chapter) => chapter.bookId === book.id);
    const completed = contents.filter((chapter) =>
      read.includes(chapter.readId),
    ).length;
    return {
      book,
      total: contents.length,
      completed,
      active: completed > 0 && completed < contents.length,
    };
  });
  const visible = entries
    .filter(({ book }) => category === "all" || book.categoryId === category)
    .sort((a, b) => Number(b.active) - Number(a.active));
  return (
    <main id="main-content" tabIndex={-1} className="library home-library">
      <section className="intro">
        <h1>
          읽는 데서 한 걸음 더.
          <br />
          <span>직접 실험하며 이해하기.</span>
        </h1>
        <p>궁금한 분야의 책을 고르고, 나만의 속도로 탐색해 보세요.</p>
      </section>
      <section aria-labelledby="library-title">
        <div className="section-heading">
          <h2 id="library-title">나의 교과서</h2>
          <span>
            {books.length}권 · {chapters.length}개 챕터
          </span>
        </div>
        <div className="home-filters" role="group" aria-label="교과서 분야">
          <button
            type="button"
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
            aria-controls="home-books"
          >
            전체 <span>{books.length}</span>
          </button>
          {bookCategories
            .filter((group) =>
              books.some((book) => book.categoryId === group.id),
            )
            .map((group) => (
              <button
                key={group.id}
                type="button"
                aria-pressed={category === group.id}
                onClick={() => setCategory(group.id)}
                aria-controls="home-books"
              >
                {group.label}{" "}
                <span>
                  {books.filter((book) => book.categoryId === group.id).length}
                </span>
              </button>
            ))}
        </div>
        <p className="home-result" role="status">
          {category === "all"
            ? "전체"
            : bookCategories.find((group) => group.id === category)?.label}{" "}
          {visible.length}권
          {visible.some((entry) => entry.active)
            ? " · 읽는 중인 책부터 보여드려요."
            : " · 각 책에서 소개와 전체 목차를 볼 수 있어요."}
        </p>
        <div id="home-books" className="home-books">
          {visible.map(({ book, total, completed, active }) => (
            <a key={book.id} className="home-book" href={`#/${book.id}`}>
              <div
                className={`home-cover home-cover--${book.id}`}
                aria-hidden="true"
              >
                <BookCover bookId={book.id} />
              </div>
              <div className="home-book-body">
                <div className="home-book-meta">
                  <small>{book.category}</small>
                  {active && <span className="home-badge">읽는 중</span>}
                </div>
                <h3>{book.title}</h3>
                <p>{book.description}</p>
                <div className="home-progress">
                  <span>
                    {completed} / {total} 챕터 읽음
                    {total > 0 && completed === total ? " · 모두 읽음" : ""}
                  </span>
                  <progress
                    aria-label={`${book.title} 읽기 진행률`}
                    value={completed}
                    max={Math.max(total, 1)}
                  />
                </div>
                <strong>
                  {active ? "이어서 살펴보기" : "교과서 펼치기"}{" "}
                  <span aria-hidden="true">↗</span>
                </strong>
              </div>
            </a>
          ))}
        </div>
      </section>
      <footer>
        작은 질문에서 시작해, 한 챕터씩 쌓아갑니다.
        <br />
        학습 기록은 현재 브라우저에만 저장됩니다.
      </footer>
    </main>
  );
}

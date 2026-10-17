export function Check({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <details>
      <summary>{question}</summary>
      <p>{children}</p>
    </details>
  );
}
export function Sources({ items }: { items: [string, string][] }) {
  return (
    <section className="sources">
      <h2>근거와 더 읽을 자료</h2>
      <p>
        기술 설명은 아래 공식 자료를 기준으로 확인했습니다. 확인일: 2026-10-17.
      </p>
      <ul>
        {items.map(([title, url]) => (
          <li key={url}>
            <a href={url} target="_blank" rel="noreferrer">
              {title} ↗
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

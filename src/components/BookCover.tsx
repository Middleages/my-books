// Decorative topic illustrations, not technical diagrams or financial forecasts.
export function BookCover({ bookId }: { bookId: string }) {
  return (
    <svg
      className="home-cover-art"
      viewBox="0 0 280 120"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {bookId === "computer" ? (
        <>
          <path
            className="home-art-muted"
            d="M12 30h40v30h38M12 90h55V76h23M178 44h28V20h60M178 76h25v25h63"
          />
          <rect
            x="90"
            y="22"
            width="88"
            height="76"
            rx="12"
            fill="currentColor"
            fillOpacity=".08"
          />
          <rect x="108" y="38" width="52" height="44" rx="5" />
          {[108, 125, 143, 160].map((x) => (
            <path key={x} d={`M${x} 14v8M${x} 98v8`} />
          ))}
          {[38, 54, 70, 86].map((y) => (
            <path key={y} d={`M82 ${y}h8M178 ${y}h8`} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              className="home-art-signal"
              x={118 + (i % 2) * 18}
              y={46 + Math.floor(i / 2) * 18}
              width="12"
              height="12"
              rx="2"
              fill="currentColor"
              fillOpacity=".45"
              stroke="none"
            />
          ))}
          <rect x="220" y="36" width="40" height="46" rx="5" />
          <path d="M230 47h20M230 58h20M230 69h20" />
          <circle cx="26" cy="30" r="4" fill="currentColor" />
          <circle cx="40" cy="90" r="4" fill="currentColor" />
        </>
      ) : bookId === "network" ? (
        <>
          <path
            className="home-art-muted"
            d="M54 38h46l30 22h32l34-22h32M54 89h46l30-29M162 60l34 29h32"
          />
          <rect x="18" y="20" width="42" height="30" rx="5" />
          <path d="M39 50v8M28 58h22" />
          <rect x="24" y="73" width="30" height="28" rx="4" />
          <path d="M31 94h16" />
          <rect
            x="122"
            y="42"
            width="48"
            height="36"
            rx="8"
            fill="currentColor"
            fillOpacity=".12"
          />
          <path d="M132 53h26M132 66h5m6 0h5m6 0h5" />
          {[20, 73].map((y) => (
            <g key={y}>
              <rect x="225" y={y} width="37" height="30" rx="5" />
              <path d={`M233 ${y + 10}h21M233 ${y + 20}h4`} />
            </g>
          ))}
          <g className="home-art-signal" fill="currentColor" stroke="none">
            <rect x="83" y="32" width="12" height="12" rx="3" />
            <rect x="192" y="83" width="12" height="12" rx="3" />
          </g>
          <circle cx="146" cy="18" r="4" />
          <path className="home-art-muted" d="M146 22v12" />
        </>
      ) : bookId === "money" ? (
        <>
          <path d="M100 56l40-33 40 33M109 50v48h62V50" />
          <path d="M130 98V73h20v25" />
          <rect x="121" y="52" width="12" height="12" rx="2" />
          <rect x="148" y="52" width="12" height="12" rx="2" />
          <g className="home-art-gold">
            <ellipse cx="47" cy="75" rx="22" ry="8" />
            <path d="M25 75v12c0 11 44 11 44 0V75M25 87v12c0 11 44 11 44 0V87" />
            <circle
              className="home-art-signal"
              cx="230"
              cy="49"
              r="23"
              fill="currentColor"
              fillOpacity=".12"
            />
            <path d="M218 42l5 15 7-15 7 15 5-15M217 48h27" />
          </g>
          <path
            className="home-art-muted"
            d="M53 47c3-20 22-26 38-18m-6-8 6 8-10 4M190 88c17 12 39 9 49-5m-10 2 10-2-1 10"
          />
        </>
      ) : (
        <>
          <path d="M76 25h52l12 9 12-9h52v72h-52l-12 8-12-8H76zM140 34v71M90 45h28M162 45h28M90 60h28M162 60h28" />
        </>
      )}
    </svg>
  );
}

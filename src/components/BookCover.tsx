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
      {bookId === "accounting" ? (
        <>
          <path d="M79 22h122v85H79zM140 22v85M91 41h37M91 57h37M91 73h24M152 41h37M152 57h37M152 73h24" fill="currentColor" fillOpacity=".06" />
          <path d="M103 13h72M25 75l18-11 18 11v24H25zM25 75l18 11 18-11M43 86v13" />
          <circle cx="235" cy="42" r="19" fill="currentColor" fillOpacity=".12" />
          <path d="M228 42h14M235 35v14" />
          <path className="home-art-signal" d="M61 50h12m-5-5 5 5-5 5M208 84h29m-7-5 7 5-7 5" />
        </>
      ) : bookId === "housing" ? (
        <>
          <path d="M22 57 74 19l52 38M34 48v58h80V48M64 106V77h21v29M45 59h13v13H45zM91 59h13v13H91z" fill="currentColor" fillOpacity=".06" />
          <path d="M160 20h70l17 18v65h-87ZM230 20v18h17M174 51h55M174 66h40M174 81h26" />
          <circle cx="136" cy="90" r="11" /><path d="M131 90h10M136 85v10" />
          <path className="home-art-signal" d="M120 46h30m-5-5 5 5-5 5M150 65h-30m5-5-5 5 5 5" />
        </>
      ) : bookId === "database" ? (
        <>
          <ellipse cx="177" cy="32" rx="55" ry="16" fill="currentColor" fillOpacity=".14" />
          <path d="M122 32v58c0 22 110 22 110 0V32M122 60c0 22 110 22 110 0" />
          <path d="M30 26h56v66H30zM30 43h56M47 26v66M30 60h56M30 77h56" fill="currentColor" fillOpacity=".05" />
          <path className="home-art-signal" d="M86 52h26m-7-6 7 6-7 6M232 72h22v23h-12" />
          <circle cx="242" cy="95" r="5" fill="currentColor" fillOpacity=".2" />
        </>
      ) : bookId === "tax" ? (
        <>
          <path d="M91 15h88l20 20v72H91Z" fill="currentColor" fillOpacity=".06" />
          <path d="M179 15v20h20M107 46h54M107 61h34M107 76h54M107 91h22" />
          <rect x="31" y="66" width="22" height="34" rx="3" fill="currentColor" fillOpacity=".1" />
          <rect x="57" y="46" width="22" height="54" rx="3" fill="currentColor" fillOpacity=".2" />
          <circle cx="226" cy="64" r="23" fill="currentColor" fillOpacity=".08" />
          <path d="M215 73l22-18M218 55h1M234 73h1M212 97h29" />
          <path className="home-art-signal" d="M107 30h45M173 85l7 7 13-16" />
        </>
      ) : bookId === "insurance" ? (
        <>
          <path d="M140 17 183 34v31c0 22-21 35-43 44-22-9-43-22-43-44V34Z" fill="currentColor" fillOpacity=".08" />
          <path d="M118 61h44M140 40v43" strokeWidth="5" />
          <path d="M22 80V58l24-17 24 17v22M30 80V64h12v16M51 63h10v11H51zM210 80V58l24-17 24 17v22M218 80V64h12v16M239 63h10v11h-10z" />
          <path className="home-art-signal" d="M74 62h17m-5-5 5 5-5 5M189 62h17m-5-5 5 5-5 5" />
          <circle cx="48" cy="100" r="9" /><circle cx="232" cy="100" r="9" />
          <path d="M42 100h12M226 100h12M48 94v12M232 94v12" />
        </>
      ) : bookId === "investing" ? (
        <>
          <path d="M24 99h232M45 99V50l30-18 30 18v49M55 60h12v12H55zM82 60h12v12H82zM69 99V83h14v16" />
          <rect x="141" y="24" width="90" height="67" rx="8" fill="currentColor" fillOpacity=".06" />
          <path d="M153 39h34M153 49h24M153 72h21M183 62h34" />
          <circle cx="205" cy="43" r="12" fill="currentColor" fillOpacity=".12" />
          <path d="M205 31v12h12M115 63h17m-6-5 6 5-6 5" />
          <path className="home-art-signal" d="M132 80h-17m6-5-6 5 6 5" />
          <circle cx="241" cy="96" r="10" /><path d="M238 92h6m-6 4h6m-6 4h6" />
        </>
      ) : bookId === "economics" ? (
        <>
          <rect x="73" y="16" width="134" height="91" rx="8" fill="currentColor" fillOpacity=".06" />
          <path d="M90 33h100M90 45h42M90 55h42M90 65h32M145 45v42h44M151 76l12-14 11 7 14-18M90 92h40" />
          <circle cx="36" cy="59" r="17" /><path d="M29 59h14M36 52v14M53 59h13m-6-5 6 5-6 5M214 59h18m-6-5 6 5-6 5" />
          <path className="home-art-signal" d="M241 43h24v32h-24zM247 52h12M247 61h12" />
        </>
      ) : bookId === "kubernetes" ? (
        <>
          <rect
            x="65"
            y="12"
            width="150"
            height="97"
            rx="14"
            fill="currentColor"
            fillOpacity=".06"
          />
          <path d="M96 41h88M140 41v30M93 71h94" />
          <circle
            cx="140"
            cy="35"
            r="16"
            fill="currentColor"
            fillOpacity=".12"
          />
          <path d="M132 35h16M140 27v16" />
          {[80, 125, 170].map((x) => (
            <g key={x} className="home-art-signal">
              <rect x={x} y="71" width="30" height="24" rx="5" />
              <path d={`M${x + 8} 79h14M${x + 8} 86h8`} />
            </g>
          ))}
          <path
            className="home-art-muted"
            d="M20 60h35m-8-7 8 7-8 7M225 60h35m-8-7 8 7-8 7"
          />
        </>
      ) : bookId === "computer" ? (
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

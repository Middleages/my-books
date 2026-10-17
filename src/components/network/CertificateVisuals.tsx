import { useEffect, useState } from "react";
import {
  authorities,
  servers,
  visualPreset,
  visualResult,
  observationStages,
  playbackStep,
} from "../../simulations/network/certificate-visual.mjs";
import { environments } from "../../simulations/network/web.mjs";
import "./certificate-visuals.css";

type Config = ReturnType<typeof visualPreset>;
type Certificate = {
  id: string;
  name: string;
  role: string;
  sans?: string[];
  issuer: string;
};
type Result = ReturnType<typeof visualResult>;
const serverEntries = Object.entries(servers) as [string, Certificate][];
const ca = authorities as Record<string, Certificate>;
const leafs = servers as Record<string, Certificate>;
const envEntries = Object.entries(environments);
const status = (ok: boolean) => (ok ? "✓ 통과" : "× 실패");

function CertCard({
  cert,
  pem = false,
  source,
}: {
  cert: Certificate;
  pem?: boolean;
  source?: string;
}) {
  return (
    <div className={`cv-cert cv-${cert.role}`} data-cert={cert.id}>
      <span className="cv-role">
        {cert.role === "leaf"
          ? "서버 인증서 · LEAF"
          : cert.role === "root"
            ? "신뢰 기준 후보 · ROOT"
            : "발급 경로 · INTERMEDIATE"}
      </span>
      {pem && <code>-----BEGIN CERTIFICATE-----</code>}
      <strong>{cert.name}</strong>
      {cert.sans?.map((name) => (
        <span className="cv-san" key={name}>
          SAN DNS: {name}
        </span>
      ))}
      <small>
        {cert.role === "root"
          ? "자기 서명이 신뢰를 만들지는 않음"
          : `서명한 CA: ${ca[cert.issuer].name}`}
      </small>
      {pem && <code>-----END CERTIFICATE-----</code>}
      {source && <b className="cv-source">{source}</b>}
    </div>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
function CheckBox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="cv-checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
function Path({ r, step }: { r: Result; step: number }) {
  return (
    <div className={`cv-path ${step === 3 ? "cv-focus" : ""}`}>
      <h3>클라이언트가 따라가는 검증 경로</h3>
      <p className="cv-path-caption">
        leaf에서 발급자를 따라 내려갑니다. ↑는 아래 CA가 위 인증서에 서명한
        관계이며, 인증서 전송 방향이 아닙니다.
      </p>
      <ol aria-label="발급 관계와 자료 출처" className="cv-path-nodes">
        <li>
          <CertCard cert={r.leaf} />
        </li>
        <li className={`cv-link ${!r.checks[2].ok ? "cv-broken" : ""}`}>
          <span aria-hidden="true">↑</span>
          {r.checks[2].ok ? "이 CA가 leaf에 서명" : "× 발급자 자료를 찾지 못함"}
        </li>
        <li>
          {r.intermediateSource === "missing" ? (
            <div className="cv-gap">
              <b>비어 있는 중간 경로</b>
              <span>필요: {r.issuer.name}</span>
              <span>서버 목록에도 현재 환경 캐시에도 없음</span>
            </div>
          ) : (
            <CertCard
              cert={r.issuer}
              source={
                r.intermediateSource === "server"
                  ? "서버 목록에서 찾음"
                  : "현재 환경 캐시에서 찾음 · 신뢰 기준 아님"
              }
            />
          )}
        </li>
        <li className={`cv-link ${!r.checks[3].ok ? "cv-broken" : ""}`}>
          <span aria-hidden="true">↑</span>
          {r.checks[3].ok
            ? "신뢰한 루트가 중간 CA에 서명"
            : "× 이 루트에 대한 신뢰 없음"}
        </li>
        <li>
          <CertCard
            cert={r.root}
            source={
              r.checks[3].ok
                ? "현재 환경에 신뢰 기준으로 설정됨"
                : "필요한 루트 · 현재 신뢰 목록에 없음"
            }
          />
        </li>
      </ol>
    </div>
  );
}
function stageText(step: number, c: Config, r: Result) {
  switch (step) {
    case 0:
      return `서버 목록 ${r.sent.length}개와 ${environments[c.environment as keyof typeof environments]}의 신뢰 목록 ${r.roots.length}개는 별개입니다. 현재 조건: ${
        r.ok
          ? "네 조건 충족"
          : r.checks
              .filter((x) => !x.ok)
              .map((x) => x.label)
              .join(" · ") + " 실패"
      }.`;
    case 1:
      return `TLS SNI로 선택한 leaf는 ${r.leaf.name}입니다. 검증할 접속 이름은 ${c.target}입니다. 인증서 선택과 이름 검증은 다릅니다.`;
    case 2:
      return `서버가 공개 인증서 ${r.sent.map((x) => x.name).join(" → ")}를 목록으로 보냅니다. PEM 텍스트 그대로 전송하는 것이 아니라 TLS 인증서 목록으로 인코딩됩니다. 개인키와 클라이언트 신뢰 설정은 이동하지 않습니다.`;
    case 3:
      return `${r.checks[2].evidence}. ${r.checks[3].evidence}. 서버가 루트를 보낸 것과 신뢰 목록에 설정한 것은 별개입니다.`;
    case 4:
      return `${r.checks[0].evidence}: ${status(r.checks[0].ok)}. ${r.checks[1].evidence}: ${status(r.checks[1].ok)}. CA 추가는 SAN이나 유효기간을 바꾸지 않습니다.`;
    default:
      return `${r.ok ? "검증 통과 · HTTP 요청 가능" : "검증 실패 · HTTP 요청 전 중단"}. ${r.checks.map((x) => `${x.label}: ${status(x.ok)}`).join(". ")}.`;
  }
}

export function CertificateJourney({
  advanced = false,
}: {
  advanced?: boolean;
}) {
  const initial = advanced ? "untrusted" : "chain";
  const [config, setConfig] = useState(() => visualPreset(initial));
  const [scenario, setScenario] = useState(initial);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [prediction, setPrediction] = useState("");
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const r = visualResult(config);
  const env = config.environment;
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(media.matches);
      setPlaying(false);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!playing) return;
    if (step === observationStages.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setStep((s) => playbackStep(s, "next")),
      reduced ? 2600 : 1800,
    );
    return () => window.clearTimeout(timer);
  }, [playing, step, reduced]);
  const resetObservation = () => {
    setPlaying(false);
    setStep(playbackStep(step, "change"));
    setPrediction("");
  };
  const change = (patch: Partial<Config>) => {
    resetObservation();
    setConfig((c) => ({ ...c, ...patch }));
  };
  const chooseScenario = (id: string) => {
    resetObservation();
    setScenario(id);
    setConfig(visualPreset(id));
  };
  const toggleRoot = (id: string, checked: boolean) =>
    change({
      stores: {
        ...config.stores,
        [env]: checked
          ? [...config.stores[env], id]
          : config.stores[env].filter((x: string) => x !== id),
      },
    });
  return (
    <section
      className="cv-lab"
      data-playing={playing}
      aria-label={advanced ? "인증서 진단 시각 실험" : "인증서 경로 시각 실험"}
    >
      <div className="cv-heading">
        <span>SEE · CHANGE · UNDERSTAND</span>
        <h2>
          {advanced
            ? "같은 서버, 다른 검증자"
            : "파일 한 개, 서로 다른 인증서들"}
        </h2>
        <p>
          공개 인증서 블록을 조립하고, 서버 목록과 클라이언트 신뢰 경로를
          비교하세요. 모든 조작은 가상 상태입니다.
        </p>
      </div>
      <div className="cv-toolbar">
        <Select
          label="인증서 오류 사례"
          value={scenario}
          onChange={chooseScenario}
          options={[
            ["chain", "중간 CA 누락"],
            ["untrusted", "Python에 신뢰 CA 없음"],
            ["name", "이름 불일치 · IP 접속"],
            ["expired", "유효기간 만료"],
            ["future", "유효기간 시작 전"],
            ["sni", "잘못된 SNI 선택"],
            ["multiple", "이름·중간 CA·신뢰 복합 오류"],
            ["healthy", "정상 기준"],
          ]}
        />
        <Select
          label="검증 환경"
          value={env}
          onChange={(v) => change({ environment: v })}
          options={envEntries}
        />
      </div>
      <div className="cv-playback" aria-label="관찰 재생 제어">
        <button
          className="primary"
          disabled={playing || step === 5}
          onClick={() => setPlaying(true)}
        >
          재생
        </button>
        <button
          className="secondary"
          disabled={!playing}
          onClick={() => setPlaying(false)}
        >
          정지
        </button>
        <button
          className="secondary"
          disabled={step === 0}
          onClick={() => {
            setPlaying(false);
            setStep((s) => playbackStep(s, "previous"));
          }}
        >
          이전 단계
        </button>
        <button
          className="secondary"
          disabled={step === 5}
          onClick={() => {
            setPlaying(false);
            setStep((s) => playbackStep(s, "next"));
          }}
        >
          한 단계 진행
        </button>
        <button
          className="secondary"
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
        >
          다시 보기
        </button>
        <button className="secondary" onClick={() => chooseScenario(initial)}>
          초기화
        </button>
      </div>
      <ol className="cv-stages" aria-label="교육용 관찰 순서">
        {observationStages.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined}>
            <span>{i}</span>
            {s}
          </li>
        ))}
      </ol>
      <p className="cv-narration" role="status">
        <b>
          {step}/5 · {observationStages[step]}
        </b>
        <span>{stageText(step, config, r)}</span>
      </p>
      {reduced && (
        <p className="cv-motion-note">
          움직임 줄이기 적용: 이동 효과 없이 고정 장면과 강조로 보여 줍니다.
          재생은 같은 단계를 천천히 바꿉니다.
        </p>
      )}
      <div className="cv-world">
        <section
          className={`cv-zone ${step === 1 || step === 2 ? "cv-focus" : ""}`}
          aria-label="서버 전송 목록"
        >
          <h3>
            <span className="cv-number">01</span> 서버가 제시하는 목록
          </h3>
          <Select
            label="TLS SNI로 선택할 인증서"
            value={config.server}
            options={serverEntries.map(([id, c]) => [id, c.name])}
            onChange={(v) =>
              change({
                server: v,
                intermediate: config.intermediate ? leafs[v].issuer : "",
              })
            }
          />
          <div className="cv-file">
            <div className="cv-file-title">
              fullchain.pem <small>파일 경계 · 축약 PEM</small>
            </div>
            {r.sent.map((cert) => (
              <CertCard key={cert.id} cert={cert} pem />
            ))}
            {!config.intermediate && (
              <div className="cv-slot">＋ 여기에 중간 CA 블록이 이어집니다</div>
            )}
          </div>
          <Select
            label="뒤에 붙일 중간 CA"
            value={config.intermediate}
            onChange={(v) => change({ intermediate: v })}
            options={[
              ["", "포함하지 않음"],
              ["issuing-a", "Issuing CA A"],
              ["issuing-b", "Issuing CA B"],
              ["issuing-c", "Issuing CA C"],
            ]}
          />
          <CheckBox
            label="서버에서 루트도 전송"
            checked={config.rootSent}
            onChange={(v) => change({ rootSent: v })}
          />
          <div className="cv-private">
            <b>▣ privkey.pem · 서버에 보관</b>
            <span>개인키 소유 증명에 사용 · 목록에 넣지 않음</span>
          </div>
        </section>
        <div className={`cv-transfer ${step === 2 ? "cv-transmitting" : ""}`}>
          <span aria-hidden="true">↓</span>
          <b>공개 인증서 정보 전달</b>
          <small>
            서버 목록 → 클라이언트
            <br />
            신뢰 목록에 자동 등록되지 않음
          </small>
          <i aria-hidden="true">CERT</i>
        </div>
        <section
          className={`cv-zone ${step === 3 ? "cv-focus" : ""}`}
          aria-label="클라이언트 신뢰 목록"
        >
          <h3>
            <span className="cv-number">02</span>{" "}
            {environments[env as keyof typeof environments]}의 신뢰 기준
          </h3>
          <p>
            별도의 관리 경로로 설정한 CA bundle / trust store. 이 예제는 루트
            CA만 신뢰 기준으로 사용합니다.
          </p>
          <div className="cv-file cv-trust-file">
            <div className="cv-file-title">
              client-ca-bundle.pem <small>현재 환경의 가상 목록</small>
            </div>
            {r.roots.length ? (
              r.roots.map((cert) => <CertCard key={cert.id} cert={cert} pem />)
            ) : (
              <div className="cv-slot">
                신뢰 CA 없음 · 서버가 보내도 이 칸은 채워지지 않음
              </div>
            )}
          </div>
          {["root-a", "root-b"].map((id) => (
            <CheckBox
              key={id}
              label={`현재 환경에서 ${ca[id].name} 신뢰`}
              checked={config.stores[env].includes(id)}
              onChange={(v) => toggleRoot(id, v)}
            />
          ))}
          <div className="cv-cache">
            <b>별도 서랍 · 중간 CA 캐시</b>
            <CheckBox
              label={`현재 환경에 ${r.issuer.name} 캐시`}
              checked={config.caches[env].includes(r.issuer.id)}
              onChange={(v) =>
                change({
                  caches: {
                    ...config.caches,
                    [env]: v
                      ? [...config.caches[env], r.issuer.id]
                      : config.caches[env].filter(
                          (id: string) => id !== r.issuer.id,
                        ),
                  },
                })
              }
            />
            <small>발급자 자료 보충용. 신뢰 기준을 추가하지 않습니다.</small>
          </div>
        </section>
      </div>
      <p className="cv-caption">
        각 BEGIN~END 블록은 별개 인증서입니다. 뒤에 붙여도 leaf의
        SAN·공개키·서명은 그대로입니다. fullchain에 루트를 보내는 선택은 오해를
        비교하기 위한 것으로, 일반적인 서버 구성에서는 루트를 생략합니다.
      </p>
      <div className="cv-verification">
        <Path r={r} step={step} />
        <section className={`cv-identity ${step === 4 ? "cv-focus" : ""}`}>
          <h3>이 경로가 맞아도, 이름과 기간은 따로</h3>
          <Select
            label="접속 이름 · 검증 대상"
            value={config.target}
            options={[
              "app.example.test",
              "reports.example.test",
              "files.example.test",
              "outside.example.test",
              "other.example.test",
              "192.0.2.10",
            ].map((n) => [n, n])}
            onChange={(v) => change({ target: v })}
          />
          <div
            className={`cv-name-check ${r.checks[0].ok ? "cv-pass" : "cv-fail"}`}
          >
            <b>{config.target}</b>
            <span aria-hidden="true">↓ SAN과 비교 ↓</span>
            {r.leaf.sans.map((n) => (
              <span key={n}>{n}</span>
            ))}
            <strong>{status(r.checks[0].ok)} · 이름</strong>
          </div>
          <Select
            label="가상 UTC 날짜"
            value={config.date}
            options={[
              ["2025-12-15", "2025-12-15 · 시작 전"],
              ["2026-06-15", "2026-06-15 · 기간 내"],
              ["2027-01-15", "2027-01-15 · 만료 후"],
            ]}
            onChange={(v) => change({ date: v })}
          />
          <div
            className={`cv-validity ${r.checks[1].ok ? "cv-pass" : "cv-fail"}`}
          >
            <div className="cv-time-track">
              <span>시작 전</span>
              <b>유효한 구간</b>
              <span>만료 후</span>
            </div>
            <div
              className="cv-date-pointer"
              data-period={
                config.date < "2026-01-01"
                  ? "before"
                  : config.date > "2026-12-31"
                    ? "after"
                    : "within"
              }
            >
              <span>▲</span>
            </div>
            <small>2026-01-01 ~ 2026-12-31 · UTC 날짜 단위</small>
            <strong>
              {status(r.checks[1].ok)} · {config.date}
            </strong>
          </div>
        </section>
      </div>
      {advanced && (
        <section className="cv-environments">
          <h3>같은 서버를 바라보는 다섯 검증자</h3>
          <p>
            서버 목록은 같아도, 각 앱이 읽는 저장소·설정·파일 시스템은 다를 수
            있습니다. 아래 서랍을 선택해 CA를 추가해 보세요. 이 가상 예제의
            신뢰·캐시는 환경마다 따로 유지됩니다.
          </p>
          <div className="cv-env-grid">
            {envEntries.map(([id, name]) => {
              const result = visualResult({ ...config, environment: id });
              return (
                <button
                  className={`cv-env ${env === id ? "cv-selected" : ""}`}
                  key={id}
                  aria-pressed={env === id}
                  onClick={() => change({ environment: id })}
                >
                  <b>{name}</b>
                  <span>
                    ▤ 신뢰:{" "}
                    {config.stores[id]
                      .map((root: string) => ca[root].name)
                      .join(", ") || "없음"}
                  </span>
                  <span>
                    ▱ 캐시:{" "}
                    {config.caches[id]
                      .map((cert: string) => ca[cert].name)
                      .join(", ") || "없음"}
                  </span>
                  <strong>{status(result.ok)}</strong>
                </button>
              );
            })}
          </div>
          <p className="model-note">
            실제 기본값이 아닙니다. 브라우저·curl이 OS 신뢰를 공유하는 구성도
            있고, 별도 저장소를 쓰는 구성도 있습니다. 프로세스가 무엇을 읽는지
            확인해야 하며 ‘항상 다르다’는 뜻은 아닙니다. 프록시는 HTTPS
            upstream을 검증하는 클라이언트 역할이며, 이 실험에서는 검증이 켜져
            있다고 가정합니다.
          </p>
        </section>
      )}
      <label className="cv-prediction">
        지금 조건의 종합 결과를 예측해 보세요
        <select
          aria-label="시각 실험 검증 예측"
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="">예측 선택 · 선택 없이도 단계 관찰 가능</option>
          <option value="yes">통과</option>
          <option value="no">실패</option>
        </select>
      </label>
      <section
        className={`cv-results ${step === 5 ? "cv-focus" : ""}`}
        aria-label="현재 조건의 검증 판정"
      >
        <h3>
          {step === 5 ? "종합 판정" : "현재 조건 미리 보기"} ·{" "}
          {r.ok ? "검증 통과" : "검증 실패"}
        </h3>
        {prediction && step === 5 && (
          <p>
            {(prediction === "yes") === r.ok
              ? "예측과 일치합니다."
              : "예측과 달랐습니다."}
          </p>
        )}
        <ul>
          {r.checks.map((c) => (
            <li className={c.ok ? "cv-pass" : "cv-fail"} key={c.id}>
              <strong>
                {status(c.ok)} · {c.label}
              </strong>
              <span>{c.evidence}</span>
              {!c.ok && <small>수정할 곳: {c.fix}</small>}
            </li>
          ))}
        </ul>
        <p>
          {r.ok
            ? "네 가지 조건 충족 · HTTP 요청 가능. 앱의 응답과 접근 권한은 별도입니다."
            : "현재 조건에서는 HTTP 요청 전 중단. 한 조건만 고치면 다른 실패는 남습니다."}
        </p>
      </section>
      <details>
        <summary>모든 단계의 고정 설명 · 움직임 없이 읽기</summary>
        <ol>
          {observationStages.map((s, i) => (
            <li key={s}>
              <b>{s}</b>
              <p>{stageText(i, config, r)}</p>
            </li>
          ))}
        </ol>
      </details>
      <p className="model-note">
        교육상의 관찰 순서이며 실제 TLS 구현의 검증 순서·오류 문구를 재현하지
        않습니다. 정상 서명·개인키 소유 증명·유효한 중간 CA와 고정 발급 관계를
        가정합니다. leaf 날짜는 UTC 날짜 단위이며 SAN DNS 정확한 일치만
        판정합니다. 실제 암호 연산·키 교환·X.509 파싱·IP
        SAN·와일드카드·폐기·교차서명·name constraints·AIA 자동 취득·mTLS·세션
        재개는 생략합니다. 캐시는 명시적으로 선택한 인증서만 사용합니다.
      </p>
    </section>
  );
}

export function BundleExplorer() {
  const [roots, setRoots] = useState(["root-a"]);
  const [multi, setMulti] = useState(false);
  const base = visualPreset("healthy");
  const configured = { ...base, stores: { ...base.stores, browser: roots } };
  return (
    <section className="cv-lab cv-bundle" aria-label="여러 CA와 여러 SAN 비교">
      <div className="cv-heading">
        <span>ONE FILE ≠ ONE CERTIFICATE</span>
        <h2>CA 목록을 늘릴까, 한 인증서의 이름을 늘릴까?</h2>
        <p>
          왼쪽은 클라이언트의 신뢰 기준, 오른쪽은 검증 대상입니다. CA B를 추가해
          보고, CA C의 서버도 통과하는지 비교하세요.
        </p>
      </div>
      <div className="cv-bundle-layout">
        <section className="cv-zone">
          <h3>클라이언트 CA bundle</h3>
          {["root-a", "root-b"].map((id) => (
            <CheckBox
              key={id}
              label={`bundle에 ${ca[id].name} 포함`}
              checked={roots.includes(id)}
              onChange={(v) =>
                setRoots((prev) =>
                  v ? [...prev, id] : prev.filter((x) => x !== id),
                )
              }
            />
          ))}
          <div className="cv-file">
            <div className="cv-file-title">company-ca-bundle.pem</div>
            {roots.map((id) => (
              <CertCard key={id} cert={ca[id]} pem />
            ))}
            {!roots.length && <div className="cv-slot">신뢰 기준 없음</div>}
          </div>
        </section>
        <section className="cv-zone">
          <h3>서버별 발급 경로</h3>
          {["app", "files", "outside"].map((server) => {
            const leaf = leafs[server];
            const r = visualResult({
              ...configured,
              server,
              target: leaf.sans![0],
              intermediate: leaf.issuer,
            });
            return (
              <div
                className={`cv-server-row ${r.ok ? "cv-pass" : "cv-fail"}`}
                key={server}
              >
                <b>{leaf.name}</b>
                <span>
                  leaf ← {r.issuer.name} ← {r.root.name}
                </span>
                <strong>
                  {status(r.ok)}
                  {!r.ok ? " · 루트 신뢰 없음" : ""}
                </strong>
              </div>
            );
          })}
          <p>
            화살표는 오른쪽 CA가 왼쪽 인증서에 서명한 관계입니다. 세 서버 모두
            이름·기간·중간 CA는 정상으로 고정했습니다. CA A/B를 함께 담아도 CA
            C의 경로를 신뢰하지 않습니다.
          </p>
        </section>
      </div>
      <div className="cv-san-comparison">
        <section>
          <h3>파일 결합 · 서명된 내용 유지</h3>
          <CertCard cert={leafs.app} pem />
          <span className="cv-join">＋ 다른 인증서 블록을 뒤에 붙여도</span>
          <CertCard cert={leafs.other} pem />
          <p>
            <b>app leaf의 SAN은 여전히 하나.</b> 두 leaf를 연결한 파일은 올바른
            발급 체인이 아니며, 서버 인증서 선택이나 이름 검증을 대신하지
            않습니다.
          </p>
        </section>
        <section>
          <h3>여러 SAN · 발급된 인증서 하나</h3>
          <CheckBox
            label="여러 SAN 인증서를 발급받은 예 보기"
            checked={multi}
            onChange={setMulti}
          />
          <CertCard cert={multi ? leafs.multi : leafs.app} pem />
          <p>
            새 발급 예시로 전환합니다. 파일을 이어 붙이거나 서명된 인증서를
            편집하는 조작이 아닙니다.
          </p>
          <div className="cv-san-results">
            {["app.example.test", "reports.example.test"].map((target) => {
              const r = visualResult({
                ...configured,
                server: multi ? "multi" : "app",
                target,
                intermediate: "issuing-a",
              });
              return (
                <p key={target}>
                  <b>{target}</b>
                  <span>{status(r.checks[0].ok)} · SAN 이름 조건</span>
                  <span>{status(r.ok)} · 종합</span>
                </p>
              );
            })}
          </div>
        </section>
      </div>
      <p className="model-note">
        bundle의 블록과 판정은 같은 발급 관계 모델을 사용합니다. CA bundle을
        명시한 Requests 호출은 그 모음을 사용하며 기본 공개 CA 모음에 자동
        추가된다고 가정하지 않습니다. 실제 trust store의 형식·신뢰 속성·정책은
        구현에 따라 다릅니다.
      </p>
    </section>
  );
}

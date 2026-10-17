import {
  interestDefaults,
  projectInterest,
} from "../../simulations/money/interest.mjs";
import "./interest.css";
const won = (n: number) =>
  `${n.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`;
export function InterestPrimer() {
  const { paths } = projectInterest({
    ...interestDefaults,
    payment: 0,
    months: 2,
  });
  const first = paths.compound[5];
  const simple = paths.simple[10],
    compound = paths.compound[10];
  return (
    <figure className="interest-primer">
      <figcaption>
        첫 달 이자가 둘째 달 어디로 갈까요? · 납입·비용 없음, 명목연율 12% →
        월율 1%
      </figcaption>
      <div className="interest-primer-start">
        <b>최초 원금 {won(first.initial)}</b>
        <span>↓ 첫 달 수익 {won(first.periodReturn)}</span>
        <strong>첫 달 총액 {won(first.total)} · 두 방식 동일</strong>
      </div>
      <div className="interest-primer-branches">
        <section>
          <h3>단리 · 옆 칸에 보관</h3>
          <p>
            원금 <b>{won(simple.basis)}</b> → 다음 이자{" "}
            {won(simple.periodReturn)}
          </p>
          <p className="interest-reserve">
            첫 달 이자 {won(first.periodReturn)} → 별도 보관 → 이자 0원
          </p>
        </section>
        <section>
          <h3>복리 · 원금 옆에 합류</h3>
          <p>
            원금 + 첫 달 이자 = <b>{won(compound.basis)}</b>
          </p>
          <p className="interest-reinvest">
            ↓ 함께 운용 → 다음 이자 {won(compound.periodReturn)}
          </p>
          <strong>
            앞선 이자가 만든 차이{" "}
            {won(compound.periodReturn - simple.periodReturn)}
          </strong>
        </section>
      </div>
      <p>
        화살표는 계산 관계를 뜻합니다. 칸 크기·화살표 굵기는 금액 비례가
        아닙니다. 아래 실험의 같은 모델에서 두 달을 계산한 그림입니다.
      </p>
    </figure>
  );
}

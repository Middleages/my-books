import { ParallelLab } from "../../Labs";
export default function Parallel() {
  return (
    <>
      <p className="lead">
        여러 개의 코어는 동시에 여러 작업을 처리하여 전체 실행 시간을 줄일 수
        있습니다. 하지만 모든 작업이 병렬로 처리될 수 있는 것은 아닙니다.
      </p>
      <ParallelLab />
      <section className="prose">
        <h2>직렬 구간이 만드는 한계</h2>
        <p>
          앞 단계의 결과가 있어야 다음 단계로 넘어갈 수 있는 작업은 순서대로
          실행해야 합니다. 이 직렬 구간은 처리 장치를 늘려도 그대로 남습니다. 이
          관계를 설명하는 것이 <strong>암달의 법칙</strong>입니다.
        </p>
        <p className="formula">속도 향상 = 1 ÷ ((1 − p) + p ÷ N)</p>
        <p>
          p는 병렬화 가능한 비율, N은 동일한 처리 장치의 수입니다. 전체 작업의
          90%를 병렬화하고 8개로 나누면 약 4.71배 빨라집니다. 처리 장치를 무한히
          늘려도 나머지 10% 때문에 10배가 한계입니다.
        </p>
        <h2>그럼 CPU와 GPU는?</h2>
        <p>
          CPU는 복잡한 제어와 다양한 작업의 빠른 응답에, GPU는 많은 데이터에
          비슷한 연산을 반복하는 처리에 적합하게 설계됩니다. 단순히 코어 수만
          비교해서 성능을 판단할 수는 없습니다.
        </p>
        <div className="note">
          <strong>이 실험의 가정</strong>
          <p>
            처리 장치의 성능은 동일하고, 작업은 균등하게 나뉘며, 통신·동기화
            비용은 없다고 가정합니다. CPU와 GPU의 실제 성능 비교나 벤치마크가
            아닙니다.
          </p>
        </div>
        <details>
          <summary>직접 생각해 보기</summary>
          <p>
            병렬화 비율을 0%로 바꾸면 어떻게 될까요? 처리 장치를 32개로 늘려도
            1배입니다. 빨라질 수 있는 작업 자체가 없기 때문입니다.
          </p>
        </details>
        <h3>참고 자료</h3>
        <a
          href="https://doi.org/10.1145/1465482.1465560"
          target="_blank"
          rel="noreferrer"
        >
          Gene M. Amdahl (1967), Validity of the single processor approach… ↗
        </a>
      </section>
    </>
  );
}

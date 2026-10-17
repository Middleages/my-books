import { MemoryLab } from "../../Labs";
export default function Memory() {
  return (
    <>
      <p className="lead">
        연산 장치가 아무리 빨라도 데이터가 도착하지 않으면 기다려야 합니다.
        메모리 용량과 대역폭을 구분하고, 데이터를 옮기는 데 드는 시간을
        살펴봅니다.
      </p>
      <MemoryLab />
      <section className="prose">
        <h2>용량은 보관할 양, 대역폭은 이동 속도</h2>
        <p>
          RAM과 VRAM의 용량은 데이터를 얼마나 담을 수 있는지 나타냅니다.
          대역폭은 1초 동안 얼마나 많은 데이터를 옮길 수 있는지 나타냅니다.
          용량이 크다고 전송 속도가 항상 빨라지는 것은 아닙니다.
        </p>
        <h2>계산 전에 생기는 대기 시간</h2>
        <p>
          예를 들어 CPU 쪽 메모리의 데이터를 GPU로 옮긴 뒤 계산한다면 전송에도
          시간이 필요합니다. 계산이 아주 짧은 작업은 이 이동 비용이 전체 시간을
          좌우할 수 있습니다.
        </p>
        <div className="note">
          <strong>이 실험의 가정</strong>
          <p>
            MB와 GB는 10진 단위입니다(1 GB = 1,000 MB). 표시한 대역폭을
            지속적으로 모두 활용한다고 가정하며, 지연 시간·프로토콜
            오버헤드·경합은 제외합니다. 실제 장비의 전송 시간을 보장하지
            않습니다.
          </p>
        </div>
        <details>
          <summary>직접 생각해 보기</summary>
          <p>
            데이터 크기를 2배로 늘리면 전송 시간도 2배입니다. 대역폭까지 2배로
            늘리면 시간은 원래대로 돌아옵니다.
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
  );
}

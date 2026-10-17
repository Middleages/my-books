import { useEffect, useState } from "react";

export function useFoundationPlayback(count: number) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (index >= count - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setIndex((i) => Math.min(count - 1, i + 1)),
      1600,
    );
    return () => window.clearTimeout(timer);
  }, [playing, index, count]);
  const reset = () => {
    setPlaying(false);
    setIndex(0);
  };
  const go = (delta: number) => {
    setPlaying(false);
    setIndex((i) => Math.max(0, Math.min(count - 1, i + delta)));
  };
  return { index, playing, setPlaying, reset, go };
}
export function Playback({
  player,
  count,
  reset,
}: {
  player: ReturnType<typeof useFoundationPlayback>;
  count: number;
  reset: () => void;
}) {
  return (
    <div className="fv-playback" aria-label="단계 재생 조작">
      <button
        onClick={() => player.setPlaying(!player.playing)}
        disabled={!player.playing && player.index === count - 1}
      >
        {player.playing ? "정지" : "재생"}
      </button>
      <button onClick={() => player.go(-1)} disabled={player.index === 0}>
        이전 단계
      </button>
      <button
        onClick={() => player.go(1)}
        disabled={player.index === count - 1}
      >
        한 단계 진행
      </button>
      <button onClick={player.reset}>다시 보기</button>
      <button onClick={reset}>초기화</button>
      <span>
        {player.index + 1} / {count}단계
      </span>
    </div>
  );
}

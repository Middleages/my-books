import { comparePower } from "./inflation.mjs";

// Presentation of an existing annual frame: no new interest or price projection.
export function purchasingScene(frames, year) {
  if (!Number.isInteger(year) || year < 0 || year >= frames.length)
    throw new RangeError("관찰 연도가 범위를 벗어났습니다");
  const frame = frames[year],
    base = frames[0].nominal;
  const goalCount = base / frames[0].basketCost;
  const unit = Math.max(
    1,
    Math.ceil(
      Math.max(
        goalCount,
        ...frames.flatMap((f) => [f.fixedBaskets, f.baskets]),
      ) /
        10 -
        1e-10,
    ),
  );
  const tiles = (count) =>
    Array.from({ length: 10 }, (_, i) =>
      Math.min(1, Math.max(0, count / unit - i)),
    );
  const targetCost = goalCount * frame.basketCost;
  return {
    frame,
    base,
    goalCount,
    targetCost,
    gap: frame.nominal - targetCost,
    verdict: comparePower(frame.real, base),
    unit,
    baselineTiles: tiles(goalCount),
    cashTiles: tiles(frame.fixedBaskets),
    accountTiles: tiles(frame.baskets),
    scaleMax: Math.max(
      base,
      ...frames.flatMap((f) => [f.nominal, goalCount * f.basketCost]),
    ),
  };
}

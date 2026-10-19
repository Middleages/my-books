import { interestDefaults, projectInterest } from "./interest.mjs";

export function interestPrimerFrames() {
  const r = projectInterest({ ...interestDefaults, payment: 0, months: 2 });
  return [0, 5, 7, 8].map((i, stage) => ({
    stage,
    simple: r.paths.simple[i],
    compound: r.paths.compound[i],
    firstInterest: r.paths.compound[5].periodReturn,
    secondSimpleReturn: r.paths.simple[8].periodReturn,
    secondCompoundReturn: r.paths.compound[8].periodReturn,
    extraInterest:
      stage === 3
        ? r.paths.compound[i].periodReturn - r.paths.simple[i].periodReturn
        : 0,
  }));
}
export function interestVisualFrame(result, index) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= result.paths.compound.length
  )
    throw new RangeError("관찰 단계 범위 오류");
  const compound = result.paths.compound[index],
    simple = result.paths.simple[index],
    free = result.paths.free[index];
  const directCost = compound.cost,
    gap = free.total - compound.total;
  const poolMax = Math.max(
    1,
    ...Object.values(result.paths).flatMap((fs) =>
      fs.flatMap((f) => [f.active, f.reserve]),
    ),
  );
  const costMax = Math.max(
    1,
    ...result.paths.compound.flatMap((f, i) => {
      const gap = result.paths.free[i].total - f.total;
      return [Math.abs(gap), f.cost, Math.abs(gap - f.cost)];
    }),
  );
  return {
    compound,
    simple,
    free,
    directCost,
    gap,
    pathEffect: gap - directCost,
    poolMax,
    costMax,
  };
}

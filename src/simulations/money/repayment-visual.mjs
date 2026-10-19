// Read the existing schedule and frames; never recalculate loan terms in a picture.
export function repaymentScene(result, kind, index) {
  const path = result.paths[kind];
  if (
    !path ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= path.frames.length
  )
    throw new RangeError("상환 관찰 단계 범위 오류");
  const frame = path.frames[index],
    row = path.rows[frame.month - 1];
  return {
    frame,
    row,
    appliedPrincipal: frame.phase >= 2 ? row.principal : 0,
    principalScale: Math.max(1, path.rows[0].opening),
  };
}
export function repaymentMilestones(result, kind) {
  const rows = result.paths[kind].rows;
  const indices = [
    ...new Set([0, Math.ceil(rows.length / 2) - 1, rows.length - 1]),
  ];
  return {
    rows: indices.map((i) => rows[i]),
    paymentMax: Math.max(1, ...rows.map((r) => r.payment)),
  };
}

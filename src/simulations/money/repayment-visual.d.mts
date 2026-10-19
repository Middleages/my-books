import type {
  RepaymentResult,
  RepaymentKind,
  RepaymentFrame,
  RepaymentRow,
} from "./repayment.mjs";
export type RepaymentScene = {
  frame: RepaymentFrame;
  row: RepaymentRow;
  appliedPrincipal: number;
  principalScale: number;
};
export function repaymentScene(
  result: RepaymentResult,
  kind: RepaymentKind,
  index: number,
): RepaymentScene;
export function repaymentMilestones(
  result: RepaymentResult,
  kind: RepaymentKind,
): { rows: RepaymentRow[]; paymentMax: number };

import { projectInterest, type InterestFrame } from "./interest.mjs";
export type InterestVisual = {
  compound: InterestFrame;
  simple: InterestFrame;
  free: InterestFrame;
  directCost: number;
  gap: number;
  pathEffect: number;
  poolMax: number;
  costMax: number;
};
export function interestPrimerFrames(): {
  stage: number;
  simple: InterestFrame;
  compound: InterestFrame;
  firstInterest: number;
  secondSimpleReturn: number;
  secondCompoundReturn: number;
  extraInterest: number;
}[];
export function interestVisualFrame(
  result: ReturnType<typeof projectInterest>,
  index: number,
): InterestVisual;

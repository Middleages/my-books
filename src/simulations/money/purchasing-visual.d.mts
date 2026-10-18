import { projectPurchasingPower } from "./inflation.mjs";
export type PurchasingFrame = ReturnType<typeof projectPurchasingPower>[number];
export function purchasingScene(
  frames: PurchasingFrame[],
  year: number,
): {
  frame: PurchasingFrame;
  base: number;
  goalCount: number;
  targetCost: number;
  gap: number;
  verdict: "up" | "same" | "down";
  unit: number;
  baselineTiles: number[];
  cashTiles: number[];
  accountTiles: number[];
  scaleMax: number;
};

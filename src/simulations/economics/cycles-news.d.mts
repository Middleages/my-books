import type { Market } from "./foundations.mjs";
export type CycleRow = {
  quarter: number;
  a: number;
  b: number;
  output: number;
  orders: number;
  employment: number;
};
export type CycleSnapshot = CycleRow & {
  previous: number | null;
  peak: number;
  growth: number | null;
  annualGrowth: number | null;
  employmentGrowth: number | null;
  fromPeak: number;
};
export function changeRate(current: number, base: number): number | null;
export function cycleRows(): CycleRow[];
export function cycleSnapshot(quarter?: number): CycleSnapshot;
export function outputGap(
  actual?: number,
  potential?: number,
): { actual: number; potential: number; difference: number; gap: number };
export type Category =
  "observation" | "assumption" | "interpretation" | "forecast";
export const categories: ReadonlyArray<{ id: Category; label: string }>;
export type NewsId = "demand" | "cost" | "mixed";
export const newsIds: readonly NewsId[];
export type Claim = {
  id: string;
  category: Category;
  text: string;
  reason: string;
};
export type Evidence = {
  id: string;
  label: string;
  role: string;
  reason: string;
};
export function newsCase(id?: NewsId): {
  id: NewsId;
  title: string;
  base: Market;
  market: Market | null;
  cycle: CycleSnapshot | null;
  claims: Claim[];
  evidence: Evidence[];
  counterexample: string;
};
export function assessNews(
  id: NewsId,
  answers?: Record<string, Category>,
  selected?: string[],
): {
  correct: number;
  total: number;
  feedback: {
    id: string;
    category: Category;
    correct: boolean;
    reason: string;
  }[];
  evidence: Evidence[];
};

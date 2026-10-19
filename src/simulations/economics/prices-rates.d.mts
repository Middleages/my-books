export type BasketItem = {
  name: string;
  weight: number;
  change: number;
  baseCost: number;
  cost: number;
  contribution: number;
};
export type Basket = {
  items: BasketItem[];
  baseCost: number;
  cost: number;
  index: number;
  change: number;
};
export type PricePoint = {
  month: number;
  index: number;
  mom: number | null;
  yoy: number | null;
};
export type RealRate = {
  nominal: number;
  inflation: number;
  nominalFactor: number;
  priceFactor: number;
  exact: number | null;
  approx: number | null;
};
export function basket(
  foodWeight?: number,
  foodChange?: number,
  serviceChange?: number,
): Basket;
export function pricePath(kind?: string): PricePoint[];
export function realRate(nominal: number, inflation: number): RealRate;
export function rateComparison(
  nominal?: number,
  expected?: number,
  realised?: number,
): { before: RealRate; after: RealRate };

export type Ask = { id: string; price: number; quantity: number; arrival: number };
export type OrdersInput = { mode: 'market' | 'limit'; quantity: number; budget: number; limitPrice: number; lastTradedPrice: number | null; asks: readonly Ask[] };
export type OrderFill = { askId: string; price: number; quantity: number; notional: number };
export type OrderBookRow = Ask & { initialQuantity: number; remainingQuantity: number; filledQuantity: number; sellerCash: number; remainingFraction: number; filledFraction: number; withinLimit: boolean };
export type OrdersFrame = {
  phase: 'initial' | 'fill' | 'complete'; message: string; reason: 'limit' | 'budget' | 'liquidity' | null;
  status: 'observing' | 'no-order' | 'filled' | 'partial' | 'unfilled';
  filledQuantity: number; remainingQuantity: number; notional: number; averagePrice: number | null;
  lastFillPrice: number | null; initialLastTradedPrice: number | null; initialBestAsk: number | null;
  buyerCash: number; sellerCash: number; cashTotal: number; buyerShares: number; sellerShares: number; shareTotal: number;
  bookScale: number; orderScale: number; cashScale: number; orderFilledFraction: number; orderUnfilledFraction: number;
  buyerCashFraction: number; sellerCashFraction: number; currentFill: OrderFill | null; fills: OrderFill[]; asks: OrderBookRow[];
};
export const ordersDefaults: Readonly<OrdersInput>;
export function ordersFrames(options?: Partial<OrdersInput>): { input: OrdersInput; initialShares: number; frames: OrdersFrame[]; summary: OrdersFrame };

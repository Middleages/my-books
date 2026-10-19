export type OwnershipInput = {
  mode: 'issuance' | 'secondary'; quantity: number; price: number; existingShares: number;
  investorShares: number; companyCash: number; buyerCash: number; sellerShares: number;
};
export type OwnershipFlow = { from: 'company' | 'buyer' | 'seller'; to: 'company' | 'buyer' | 'seller'; amount: number };
export type OwnershipFrame = {
  shareTileUnit: number; shareTiles: { kind: 'observer' | 'existing' | 'issued'; shares: number; fraction: number }[];
  phase: 'initial' | 'order' | 'settled'; status: 'ready' | 'completed' | 'rejected'; message: string;
  companyCash: number; buyerCash: number; sellerCash: number; totalShares: number;
  investorShares: number; buyerShares: number; sellerShares: number; otherShares: number;
  ownershipRatio: number | null; ownershipPercent: number | null; cashTotal: number;
  issuedShares: number; companyCashChange: number; expectedCashRecipient: 'company' | 'seller';
  cashRecipient: 'company' | 'seller' | 'none'; companyCashDirection: 'up' | 'same';
  cashFlow: OwnershipFlow | null; shareFlow: OwnershipFlow | null;
};
export const ownershipDefaults: Readonly<OwnershipInput>;
export function ownershipFrames(options?: Partial<OwnershipInput>): { input: OwnershipInput; frames: OwnershipFrame[]; summary: OwnershipFrame };

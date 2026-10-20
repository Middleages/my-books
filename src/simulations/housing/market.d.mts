export interface PlaceInput {days?:number;requireAccess?:boolean;requireSpace?:boolean;moveBy?:number}
export const placeDefaults:Required<PlaceInput>;
export function placeComparison(input?:PlaceInput):Required<PlaceInput>&{places:{id:string;rent:number;roundTrip:number;access:boolean|null;space:boolean;available:number;monthlyMinutes:number;monthlyHours:number;reasons:string[];eligible:boolean}[];rentSaving:number;extraHours:number;candidateCount:number};
export interface MixInput {mix?:boolean;priceRise?:boolean;lowCount?:number|null;highCount?:number|null}
export function marketMix(input?:MixInput):Required<MixInput>&{lowCount:number;highCount:number;lowPrice:number;highPrice:number;count:number;mean:number|null;baselineMean:number;fixedComparison:number;trades:('low'|'high')[]};
export function supplyFrames(input?:{homes?:number;startMonth?:number;finishMonth?:number}):{homes:number;startMonth:number;finishMonth:number;month:number;stage:'permission'|'construction'|'completion';permission:number;construction:number;completion:number}[];

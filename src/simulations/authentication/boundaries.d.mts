export type BrowserCase={label:string;page:string;target:string;sameOrigin:boolean;sameSite:boolean;credentials:string;sameSiteCookie:string;secure:boolean;pathMatch:boolean;cors:boolean;preflight:boolean;needsPreflight:boolean};
export const browserCases:Readonly<Record<string,BrowserCase>>;
export function browserFrame(step?:number,scenario?:string,httpOnly?:boolean):{step:number;scenario:string;c:BrowserCase;httpOnly:boolean;cookieEligible:boolean;cookieJsReadable:boolean;requestSent:boolean|null;cookieSent:boolean|null;serverHandled:boolean|null;jsReadable:boolean|null};
export const tokenCases:Readonly<Record<string,{label:string}>>;
export function tokenFrame(step?:number,scenario?:string):{step:number;scenario:string;label:string;parseable:boolean;gates:{key:string;label:string;passed:boolean|null}[];decision:string;failed:string[];claims:{issuer:string;audience:string;purpose:string;now:number;exp:number}};

export type DurabilityCase='sync-before-flush'|'sync-after-flush-before-ack'|'sync-after-ack'|'uncommitted-page'|'async-before-flush'|'async-after-flush'|'storage-loss';
export interface WalRecord {readonly id:string;readonly txId:string;readonly endLsn:number;readonly kind:'change'|'commit';readonly pageId:string|null;readonly versionId:string|null;readonly qty:number|null}
export interface RowVersion {readonly id:string;readonly rowId:string;readonly qty:number;readonly createdBy:string;readonly retiredBy:string|null}
export interface WalPage {readonly id:string;readonly lsn:number;readonly versions:readonly RowVersion[]}
export interface DurabilityFrame {readonly step:number;readonly scenario:DurabilityCase;readonly mode:'sync'|'async';readonly phase:string;readonly title:string;readonly detail:string;
 readonly ram:{readonly id:string;readonly page:WalPage;readonly walRecords:readonly WalRecord[]}|null;
 readonly osCache:{readonly id:string;readonly walIds:readonly string[]}|null;
 readonly storage:{readonly id:string;readonly durableEnd:number;readonly walRecords:readonly WalRecord[];readonly page:WalPage}|null;
 readonly transactionStatus:string;readonly commitRequested:boolean;readonly acknowledged:boolean;readonly server:string;readonly readResult:{readonly rowId:string;readonly versionId:string;readonly qty:number}|null;readonly replaySkipped:boolean;
 readonly flows:readonly {readonly id:string;readonly from:string;readonly to:string;readonly label:string;readonly recordId:string|null}[];
 readonly finished:boolean;readonly rowId:string;readonly txId:string;readonly appRequestId:string;readonly appOutcome:string;readonly assumptions:readonly string[];
}
export const DURABILITY_CASES:readonly DurabilityCase[];
export const WAL_RECORDS:readonly WalRecord[];
export function durabilityFrames(options?:{scenario?:DurabilityCase}):readonly DurabilityFrame[];

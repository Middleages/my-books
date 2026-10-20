import type {Report,ReportScenario} from './reports.mjs';
export interface Ratio {numerator:number;denominator:number;defined:boolean;value:number|null;positiveBase:boolean;reason:string}
export interface AnalysisPart {id:string;label:string;value:number}
export interface AnalysisModel {scenario:ReportScenario;currentLoan:number;scope:'same'|'mixed';compatible:boolean;report:Report;assets:AnalysisPart[];liabilities:AnalysisPart[];currentAssets:number;currentLiabilities:number;currentRatio:Ratio|null;cash:number;totalLoan:number;noncurrentLoan:number;totalLiabilities:number;scale:number;margins:{revenue:number;cost:number;otherOperating:number;operating:number;gross:number;grossRatio:Ratio|null;operatingRatio:Ratio|null};scopeReason:string}
export interface AnalysisOptions {scenario?:ReportScenario;currentLoan?:number;scope?:'same'|'mixed'}
export interface AnalysisFrame {index:number;kind:'composition'|'maturity'|'margin';title:string;detail:string;model:AnalysisModel}
export interface Point {x:number;y:number}
export interface BreakEven {quantity:number;price:number;variable:number;fixed:number;contribution:number;revenue:number;cost:number;profit:number;breakEven:number|null;finitePositive:boolean;xMax:number;yMax:number;revenueLine:Point[];costLine:Point[];revenuePoint:Point;costPoint:Point;intersection:Point|null}
export const analysisScenarios:readonly ReportScenario[];
export const currentLoanChoices:readonly number[];
export function ratio(numerator:number,denominator:number):Ratio;
export function analysisModel(options?:AnalysisOptions):AnalysisModel;
export function analysisFrames(options?:AnalysisOptions):AnalysisFrame[];
export const ratioExamples:Readonly<Record<string,{label:string;numerator:number;denominator:number;unit:string;note:string}>>;
export function ratioExample(key?:string):{key:string;label:string;numerator:number;denominator:number;unit:string;note:string;ratio:Ratio};
export function breakEven(options?:{quantity?:number;price?:number}):BreakEven;

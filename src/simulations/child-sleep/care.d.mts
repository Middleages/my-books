export const wakingScenes:{id:string;label:string;fact:string;awake:boolean|null;afterCare:null}[];
export const careQuestions:{id:string;label:string;question:string}[];
export function wakingFrame(id?:string,question?:string):{scene:typeof wakingScenes[number];question:typeof careQuestions[number];questions:(typeof careQuestions[number]&{selected:boolean})[];cause:null;feedingStop:null;sleepOnset:null};
export const choiceDimensions:{id:string;label:string;question:string}[];
export const choiceFamilies:{id:string;label:string;carers:{id:string;label:string}[];support:string}[];
export function choiceFrame(familyId?:string,priority?:string):{family:typeof choiceFamilies[number];priority:string;dimensions:(typeof choiceDimensions[number]&{selected:boolean})[];questions:typeof choiceDimensions;bestMethod:null;effectiveness:null;attachmentPrediction:null;needsCare:true};

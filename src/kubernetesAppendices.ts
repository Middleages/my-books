import FirstDeployment from './content/kubernetes/FirstDeployment.mdx';
import Recovery from './content/kubernetes/Recovery.mdx';
import Airgap from './content/kubernetes/Airgap.mdx';
// Appendices are intentionally outside chapters/readId/progress denominators.
export const kubernetesAppendices = [
 {id:'lab-first-deployment',title:'환경과 첫 배포',Content:FirstDeployment},
 {id:'lab-recovery',title:'운영과 복구',Content:Recovery},
 {id:'lab-airgap',title:'폐쇄망과 기존 환경',Content:Airgap},
];

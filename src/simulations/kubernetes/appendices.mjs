// A backup coverage illustration, not an execution engine or recovery guarantee.
export function recoveryFrames(scenario = 'complete') {
  const token = scenario !== 'no-token', files = scenario !== 'no-pv';
  const base = {api:'unverified', pv:'unverified', app:'unverified', externalDb:'separate'};
  return [
    {...base, title:'1 · 백업 대상을 나누기', detail:'manifest는 명세, datastore는 API 기록, token은 복호화에 필요한 별도 재료입니다. PV 파일과 외부 DB는 다른 보관 대상입니다.'},
    {...base, title:'2 · 별도 VM에 복원 재료 준비', detail:`원본 datastore: 있음 / 원래 token: ${token?'있음':'없음'} / PV 파일 사본: ${files?'있음':'없음'}. 원본 클러스터와 격리된 일회용 환경을 가정합니다.`},
    {...base, api:token?'restored':'blocked', title:'3 · datastore와 token 연결', detail:token?'같은 token과 datastore로 API 기록을 복원했다고 가정합니다. PVC 객체가 보여도 파일 내용은 아직 확인하지 않았습니다.':'원래 token이 없어 datastore 복원을 진행할 수 없습니다. 새 token으로 해결됐다고 표시하지 않습니다.'},
    {...base, api:token?'restored':'blocked', pv:files?'restored':'missing', app:token?'check-required':'unverified', title:'4 · 파일과 앱을 별도로 확인', detail:token?`PV 파일 사본은 ${files?'별도 경로로 복원한 조건':'없어 데이터가 빠진 조건'}입니다. 마운트·권한·앱 응답·내용 해시를 직접 확인해야 하며 외부 DB는 별도 복원/정합성 확인 대상입니다.`:'파일 사본이 있어도 API 복원 실패를 보완하지 않습니다. 앱 복구 성공은 미확인입니다.'},
  ];
}
export function dependencyMap() {
 return [
  {id:'binary',label:'설치 바이너리·스크립트',requires:[],detail:'OS·아키텍처·고정 버전·체크섬. OS 패키지와 kernel/cgroup 조건도 확인.'},
  {id:'images',label:'시스템·앱 이미지',requires:['binary'],detail:'k3s airgap 묶음과 직접 빌드한 앱 tar는 별도. 모든 실행 노드에 반입하거나 registry 경로 제공.'},
  {id:'chart',label:'차트·values',requires:['images'],detail:'차트 tgz와 의존 chart도 반입. YAML 렌더는 이미지 파일까지 내려받지 않음.'},
  {id:'registry',label:'노드 → registry',requires:['dns','time','registry-ca'],detail:'노드 runtime의 mirror·인증·CA·프록시/NO_PROXY. 기본 외부 endpoint 재시도도 확인.'},
  {id:'browser',label:'브라우저 → NGINX',requires:['dns','time','browser-ca'],detail:'접속 이름·SAN·시각·브라우저 trust store. registry CA 설정과 독립.'},
  {id:'database',label:'앱 → 외부 DB',requires:['dns','time','app-ca'],detail:'Pod DNS·라우팅·방화벽·앱 trust store·DB 권한. 이미지 pull 성공과 독립.'},
 ];
}

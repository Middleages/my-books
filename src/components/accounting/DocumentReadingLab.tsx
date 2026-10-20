import {useMemo,useState} from 'react';
import {useFoundationPlayback} from '../network/FoundationPlayback';
import {packetKeys,packetLabels,claimKeys,claimLabels,evidenceFrames,type PacketKey,type ClaimKey,type EvidenceDocument} from '../../simulations/accounting/document-reading.mjs';
import './accounting.css';import './analysis.css';import './document-reading.css';
const kindLabels={observed:'관찰 자료',calculated:'계산 결과',assumption:'명시한 가정',unverified:'미확인 자료'};
const statusLabels={unread:'자료 관찰 전',matches:'제공 범위에서 일치',contradiction:'자료와 충돌',insufficient:'근거 부족','scope-mismatch':'범위 불일치'};
function DocumentText({document:d}:{document:EvidenceDocument}){
 return <dl>{d.rows.map((r,i)=><div key={i}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>;
}
export function DocumentReadingLab(){
 const [packet,setPacket]=useState<PacketKey>('base'),[claim,setClaim]=useState<ClaimKey>('cost'),[prediction,setPrediction]=useState('');
 const frames=useMemo(()=>evidenceFrames(packet,claim),[packet,claim]),player=useFoundationPlayback(frames.length),f=frames[player.index],p=f.packet;
 const reset=()=>{player.reset();setPacket('base');setClaim('cost');setPrediction('');};
 return <section className="ac-lab ac-documents-lab" data-ac-lab="documents" aria-label="가상 기업 자료의 주장과 근거 실험">
  <p className="ac-eyebrow">12 · 주장과 근거의 연결</p><h2>숫자가 맞아도 무엇을 더 확인할까요?</h2>
  <p>모든 문서는 자체 작성한 가상 교육 자료입니다. 실제 기업의 공시·계좌·감사 조서가 아닙니다. 자료를 여는 순서만 재생하며 거래나 결산 값을 바꾸지 않습니다.</p>
  <div className="ac-controls">
   <label>가상 문서 묶음<select aria-label="가상 문서 묶음" value={packet} onChange={e=>{player.reset();setPrediction('');setPacket(e.target.value as PacketKey);}}>{packetKeys.map(k=><option key={k} value={k}>{packetLabels[k]}</option>)}</select></label>
   <label>확인할 주장<select aria-label="확인할 주장" value={claim} onChange={e=>{player.reset();setPrediction('');setClaim(e.target.value as ClaimKey);}}>{claimKeys.map(k=><option key={k} value={k}>{claimLabels[k]}</option>)}</select></label>
   <label>등식이 맞으면 모든 기록이 맞을까<select aria-label="등식이 맞으면 모든 기록이 맞을까" value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option><option value="yes">그렇다 · 균형이면 충분하다</option><option value="no">아니다 · 거래 의미와 자료도 확인</option></select></label>
  </div>
  {p.intentionalError&&<p className="ac-doc-warning" data-intentional-error>의도적 오류 패킷입니다. 정본을 바꾼 것이 아니며 아래 계산의 균형을 올바른 회계 처리의 승인으로 읽지 않습니다.</p>}
  {p.scopeMismatch&&<p className="ac-doc-warning" data-scope-warning>다른 회사·기간·단위·범위를 섞은 반례입니다. 문서 표지를 확인한 뒤 계산을 중지해야 합니다.</p>}
  <div className="ac-playback" role="group" aria-label="문서 근거 관찰 단계"><button onClick={()=>player.setPlaying(!player.playing)} disabled={!player.playing&&player.index===frames.length-1}>{player.playing?'정지':'재생'}</button><button onClick={()=>player.go(-1)} disabled={!player.index}>이전 단계</button><button onClick={()=>player.go(1)} disabled={player.index===frames.length-1}>다음 단계</button><button onClick={player.reset}>다시 보기</button><button onClick={reset}>전체 초기화</button><span className="ac-step">{player.index+1} / {frames.length}단계</span></div>
  <div className="ac-current" role="status" aria-live="polite"><strong>{player.index===0?'먼저 주장과 필요한 문서를 고릅니다':`${f.links[player.index-1].document.title} 확인`}</strong><p>{f.detail}</p></div>
  <figure className="ac-figure ac-doc-figure">
   <h3>한 주장에 필요한 근거의 연결</h3><p className="ac-doc-legend">이중 테두리: 주장 · 문서 모양: 관찰 · 둥근 모양: 계산 · 점선: 가정 · 점 테두리: 미확인. 색만으로 판정하지 않습니다.</p>
   <div className="ac-doc-graph" data-claim={claim}>
    <div className="ac-doc-claim"><small>확인할 주장</small><strong>{f.label}</strong><p>선은 관련 근거의 짝을 뜻하며 금액이나 인과의 크기가 아닙니다.</p></div>
    <ol className="ac-doc-links">{f.links.map((link,i)=><li key={link.id} className={`ac-doc-node is-${link.document.kind} ${link.opened?'is-open':'is-closed'} ${player.index===i+1?'is-current':''}`} data-document-id={link.id} data-opened={link.opened} data-available={link.available}>
     <button aria-label={`${link.document.title} 보기`} aria-pressed={link.opened} onClick={()=>player.go(i+1-player.index)}><span>{link.document.title}</span><small>{kindLabels[link.document.kind]} · {link.opened?(link.available?'열어 본 자료':'미제공 확인'):'관찰 전'}</small></button>
     {link.opened?<DocumentText document={link.document}/>:<p className="ac-doc-closed">아직 펼치지 않은 근거입니다.</p>}
    </li>)}</ol>
   </div>
   <figcaption>문서 번호와 선의 양끝이 같은 주장에 연결됩니다. 버튼으로 해당 근거까지 열거나 ‘다음 단계’로 순서대로 관찰하세요. 가정과 미제공 자료는 열어도 확인된 사실로 바뀌지 않습니다.</figcaption>
  </figure>
  <div className={`ac-result ac-doc-result is-${f.status}`} data-status={f.status} data-matches={f.matches===null?'':String(f.matches)} data-open-count={f.opened.length}>
   <h3>{statusLabels[f.status]}</h3><p>{f.detail}</p>{f.checks.length>0&&<dl>{f.checks.map((r,i)=><div key={i}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>}
  </div>
  {f.allRead&&prediction&&<p className="ac-feedback" role="status">{prediction==='no'?'예측과 같습니다.':'균형만으로 충분하지 않습니다.'} 원가누락·출자 오분류 패킷에서 ‘등식과 현금 연결’을 본 뒤 각각 ‘재고 원가’·‘소유주 출자’를 확인하세요. 같은 장부가 계산 일치와 자료 충돌을 함께 보일 수 있습니다.</p>}
  <details className="ac-static"><summary>전체 근거 대응 · 움직임 없이 읽기</summary><p>아래는 모든 문서를 펼친 정적 대안입니다. 대화형 장면의 미관찰 단계와 혼동하지 마세요.</p><ol>{claimKeys.map(k=>{const e=evidenceFrames(packet,k).at(-1)!;return <li key={k} data-static-claim={k} data-static-status={e.status}><strong>{e.label} · {statusLabels[e.status]}</strong><p>근거: {e.links.map(l=>l.document.title).join(' / ')}</p><p>{e.detail}</p></li>;})}</ol><div className="ac-doc-all">{p.documents.map(d=><section key={d.id} className={`is-${d.kind}`}><h4>{d.title} · {kindLabels[d.kind]}</h4><DocumentText document={d}/></section>)}</div></details>
  <p className="ac-note">제공한 가상 자료 사이의 연결만 검토합니다. 문서 진위·계약상 권리·대손·재고 실재·손상·세금·법적 배당 가능성·계속기업은 이 화면으로 검증하지 않습니다. 확인 개수를 점수·감사의견·사기 판정·투자 추천으로 만들지 않습니다.</p>
 </section>;
}

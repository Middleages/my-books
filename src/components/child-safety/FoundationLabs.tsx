import { useState } from 'react';
import { layerFrame, movementFrame } from '../../simulations/child-safety/foundation.mjs';
import './safety.css';
export function LayersLab(){
 const [position,setPosition]=useState('floor'),[prediction,setPrediction]=useState('');const f=layerFrame(position);
 return <section className="cs-lab" data-cs-lab="layers" aria-label="접근 경로와 보호 층 비교">
 <h3>같은 방, 물건의 위치만 바꿔 봅니다</h3><p>가상의 방입니다. 거리·높이·잠금장치의 안전 기준을 그린 도면이 아닙니다.</p>
 <label>작은 물건의 위치<select aria-label="작은 물건의 위치" value={position} onChange={e=>setPosition(e.target.value)}><option value="floor">바닥에 놓임</option><option value="storage">별도 보관 공간으로 옮김</option></select></label>
 <div className="cs-room" data-position={f.position}>
 <div className="cs-storage"><strong>별도 보관 공간</strong><span>장치·잠금 상태 미확인</span>{!f.directPath&&<span className="cs-object">◆ {f.object}</span>}</div>
 <div className="cs-floor"><div className="cs-child"><i aria-hidden="true"/>아이</div><div className={'cs-access '+(f.directPath?'cs-connected':'cs-omitted')}><span>{f.directPath?'→ 직접 접근선':'⊥ 이 선은 제외'}</span>{f.directPath&&<span className="cs-object">◆ {f.object}</span>}</div></div>
 <div className="cs-adult">성인 관찰 · 계속 필요</div>
 </div>
 <div className="cs-result" aria-live="polite"><strong>{f.location}</strong><p>{f.path}</p><p>{f.remaining}</p><strong>{f.unknown}</strong></div>
 <p>물건을 옮기면 그림의 한 연결만 달라집니다. 빈 바닥이나 닫힌 상자 그림은 안전 인증이 아닙니다.</p>
 <label>예측: 접근선 하나를 지우면 관찰도 끝날까요?<select aria-label="예측: 접근선 하나를 지우면 관찰도 끝날까요?" value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">선택해 보세요</option><option value="no">아니요, 다른 층이 남습니다</option><option value="yes">네, 모두 안전합니다</option></select></label>
 {prediction&&<p role="status">{prediction==='no'?'맞습니다.':'다시 살펴보세요.'} 위치 변경은 관찰·제품 조건·다른 위험 확인을 대신하지 않습니다.</p>}
 <button type="button" onClick={()=>{setPosition('floor');setPrediction('')}}>전체 초기화</button>
 <details><summary>두 위치를 정적으로 비교</summary><ul>{['floor','storage'].map(p=>{const x=layerFrame(p);return <li key={p}><strong>{x.location}</strong>: {x.path} {x.remaining} {x.unknown}</li>})}</ul></details>
 </section>
}
export function MovementLab(){
 const [movement,setMovement]=useState('climb'),[furniture,setFurniture]=useState('near');const f=movementFrame(movement,furniture);
 return <section className="cs-lab" data-cs-lab="movement" aria-label="이동과 가구 연결 비교"><h3>아이의 움직임과 방의 연결을 따로 바꿉니다</h3>
 <p>0–36개월 보호자를 위한 합성 장면입니다. 움직임에 특정 월령을 붙이지 않습니다.</p>
 <div className="cs-controls"><label>관찰한 움직임<select aria-label="관찰한 움직임" value={movement} onChange={e=>setMovement(e.target.value)}><option value="floor">바닥 이동을 관찰함</option><option value="climb">가구를 오르는 움직임을 관찰함</option></select></label><label>가구 배치<select aria-label="가구 배치" value={furniture} onChange={e=>setFurniture(e.target.value)}><option value="near">창가와 연결된 배치</option><option value="away">창가에서 옮긴 배치</option></select></label></div>
 <div className="cs-route" data-connected={String(f.connected)} data-movement={f.movement} data-furniture={f.furniture}>
 <div className="cs-floor-node"><span aria-hidden="true">●</span><strong>바닥 · 아이</strong></div>
 <div className={'cs-link '+(movement==='climb'?'cs-connected':'cs-omitted')}>{movement==='climb'?'↑ 오르기 관찰':'⋮ 오르기는 미확인'}</div>
 <div className="cs-furniture"><strong>낮은 가구</strong></div>
 <div className={'cs-link '+(furniture==='near'?'cs-connected':'cs-omitted')}>{furniture==='near'?'↑ 창가로 이어지는 배치':'⊥ 이 연결은 제외'}</div>
 <div className="cs-window"><strong>창가</strong><span>개폐·장치 조건 미확인</span></div>
 </div>
 <div className="cs-result" aria-live="polite"><strong>{f.movementLabel}</strong><p>{f.furnitureLabel}</p><p>{f.path}</p><strong>{f.unknown}</strong></div>
 <p>굵은 선은 선택한 가정에서 살펴볼 연결, 점선은 관찰하지 않은 움직임 또는 제외한 연결입니다. 화살표는 예상 추락이나 사고 확률이 아닙니다. 그림 밖의 길은 계산하지 않습니다.</p>
 <button type="button" onClick={()=>{setMovement('climb');setFurniture('near')}}>전체 초기화</button>
 <details><summary>네 조합을 정적으로 읽기</summary><ul>{['floor','climb'].flatMap(m=>['near','away'].map(p=>{const x=movementFrame(m,p);return <li key={m+p}>{x.movementLabel} · {x.furnitureLabel}: {x.path} {x.unknown}</li>}))}</ul></details>
 </section>
}

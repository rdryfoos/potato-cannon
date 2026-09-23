(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function s(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(r){if(r.ep)return;r.ep=!0;const n=s(r);fetch(r.href,n)}})();const at=[3,4,5];function it(e){return typeof e=="number"&&at.includes(e)}function rt(e){const t=e??{},s=Array.isArray(t.rows)?t.rows.map(ot):[];return{...t,rows:s}}function ot(e){const t=e??{},s=t.carryingTasks??t.debtTasks??[],{debtTasks:i,...r}=t,n=t.origin,a=t.registry??(n?.kind==="registry-line"&&n.path?{path:n.path,line:n.line??0}:t.registry),o=ct(typeof t.id=="string"?t.id:"");return{...r,carryingTasks:s,area:o,...a!==void 0?{registry:a}:{}}}const lt=/^(?:FR|NFR|AC|US)-([A-Z][A-Z0-9]{1,5})-[0-9]{2,}[a-z]?$/;function ct(e){const t=lt.exec(e);return t?t[1]:"Unclassified"}function De(e){const t=[{key:"area",label:"Area",groupOf:i=>i.area}];return e.rows.some(i=>(i.parents?.length??0)>0)&&t.push({key:"user-story",label:"User story",groupOf:i=>i.parents&&i.parents.length>0?i.parents[0]:null}),t}function dt(e,t){const s=new Map;for(const i of e){const r=t.groupOf(i);if(r===null)continue;const n=s.get(r);n?n.push(i):s.set(r,[i])}return[...s.entries()].map(([i,r])=>({key:i,label:i,rows:r,counts:ee(r)}))}function ee(e){const t={proven:0,"tracked-debt":0,backlog:0,GAP:0};for(const s of e)t[s.status]++;return t}function fe(e){switch(e){case"proven":return"green";case"tracked-debt":return"amber";case"backlog":return"blue";case"GAP":return"red"}}function pt(e,t){if(t)return e.find(s=>s.id===t)?.id}function ut(e){return`
    <section class="descent-pane" data-design="descent-pane">
      <h2 class="pane-title">Thread</h2>
      ${e}
    </section>
    `}function ve(e){return e.tier?e.tier==="criterion":e.type==="AC"}function Ge(e){return e.status==="proven"&&ve(e)&&e.proofs.length===0}function ft(e){return e.status==="proven"&&e.implementations.length===0&&!Ge(e)}function ht(e){return e.proofs.length>0?"execution-verified":e.status==="proven"&&!ve(e)&&e.implementations.length>0?"coverage-proven":"no-proof"}function mt(e){const t=e.implementations[0];return t?{path:t.path.replace(/^\.\//,""),line:t.line}:null}function gt(){return{label:"Own proofs",title:"Direct test proofs on this row's own ID; a proven row can read 0 here when it's proven via a covered implementation or transitively through its children -- the Status badge is the row's real verdict, this column is narrower than that."}}function vt(e){const t=new Map;for(const d of e)t.set(d.id,d);const s=new Map;for(const d of e)d.type==="US"&&s.set(d.id,d);function i(d){const m=new Set;let A=d;for(;A&&(A.parents?.length??0)>0;){const P=A.parents.find(I=>t.has(I));if(!P||m.has(P))return null;if(m.add(P),s.has(P))return P;A=t.get(P)}return null}const r=new Map;for(const d of e){if(d.type==="US")continue;const m=i(d);if(!m)continue;const A=r.get(m);A?A.push(d):r.set(m,[d])}const n=new Set,a=(d,m)=>d.id.localeCompare(m.id),o=[...r.entries()].sort(([d],[m])=>d.localeCompare(m)).map(([d,m])=>{n.add(d);for(const P of m)n.add(P.id);const A=m.slice().sort(a);return{key:d,label:s.get(d).statement,rows:A,counts:ee(A)}}),c=e.filter(d=>!n.has(d.id)),h=new Map,b=[];for(const d of c)if(d.area&&d.area!=="Unclassified"){const m=h.get(d.area);m?m.push(d):h.set(d.area,[d])}else b.push(d);const p=[...h.entries()].sort(([d],[m])=>d.localeCompare(m)).map(([d,m])=>{const A=m.slice().sort(a);return{key:d,label:d,rows:A,counts:ee(A)}}),u=b.length===0?[]:[{key:"unparented",label:"Unparented",rows:b.slice().sort(a),counts:ee(b)}];return[...o,...p,...u]}function bt(e){if(!e||typeof e!="object")return"unknown";const t=e;if(it(t.schemaVersion)&&Array.isArray(t.rows))return"trace-manifest";const s=t.rows??t.candidates??t.proposedRows,i=Array.isArray(s)&&s.length>0?s[0]:null,r=!!i&&("rowId"in i||"epistemicClass"in i||"candidateParent"in i||"typeGuess"in i);return Array.isArray(s)&&(typeof t.generatorVersion=="string"||typeof t.generator=="string"||Array.isArray(t.honestLimits)||r)?"dig-report":(typeof t.formatVersion=="string"||typeof t.formatVersion=="number")&&("events"in t||"pricedEvents"in t||"resolvedRepo"in t)?"cost-cube":"unknown"}function yt(e){const t=e??{},s=t.provenance??t.source??{},i=typeof s.testName=="string"?s.testName:void 0,r=typeof t.statement=="string"?t.statement:"",n=typeof t.label=="string"&&t.label||typeof t.candidateLabel=="string"&&t.candidateLabel||typeof t.id=="string"&&t.id||typeof t.candidateId=="string"&&t.candidateId||i||r.slice(0,40)||"(unlabeled)",o=(Array.isArray(t.candidateParent)?t.candidateParent:[]).map(u=>{const d=u??{};return{parentRowId:typeof d.parentRowId=="string"?d.parentRowId:null,basis:typeof d.basis=="string"?d.basis:""}}),c=t.candidateProof,h=c?{test:typeof c.test=="string"&&c.test||typeof c.testName=="string"&&c.testName||"",file:typeof c.file=="string"?c.file:"",line:c.line!==void 0&&c.line!==null?String(c.line):"",basis:typeof c.basis=="string"?c.basis:""}:(s.source==="test"||s.sourceKind==="test"||s.kind==="test")&&(s.testName||s.test)?{test:s.testName||s.test||"",file:s.file||s.path||"",line:"",basis:"same-artifact"}:null,p=(Array.isArray(t.candidateBuild)?t.candidateBuild:t.candidateBuild&&typeof t.candidateBuild=="object"?[t.candidateBuild]:[]).map(u=>{const d=u??{},m=d.provenance??{};return{file:typeof d.file=="string"?d.file:"",line:d.line!==void 0&&d.line!==null?String(d.line):"",type:typeof d.importedType=="string"&&d.importedType||typeof d.type=="string"&&d.type||typeof d.method=="string"&&d.method||"",provenanceFile:typeof m.file=="string"?m.file:"",provenanceLine:m.line!==void 0&&m.line!==null?String(m.line):"",basis:typeof d.basis=="string"?d.basis:""}});return{rowId:typeof t.rowId=="string"?t.rowId:null,label:n,statement:r,typeGuess:(typeof t.typeGuess=="string"&&t.typeGuess||typeof t.type=="string"&&t.type||"?").toUpperCase(),epistemicClass:typeof t.epistemicClass=="string"&&t.epistemicClass||typeof t.epistemic=="string"&&t.epistemic||"inferred",confidence:typeof t.confidence=="string"&&t.confidence||typeof t.confidenceSignal=="string"&&t.confidenceSignal||null,suggestedArea:typeof t.suggestedArea=="string"&&t.suggestedArea||typeof t.area=="string"&&t.area||null,provenance:s,candidateParent:o,candidateProof:h,candidateBuild:p,gap:t.gap===!0?!0:t.gap==="partial"?"partial":null}}function $t(e){const t=e??{};return{rows:(Array.isArray(t.rows)&&t.rows||Array.isArray(t.candidates)&&t.candidates||Array.isArray(t.proposedRows)&&t.proposedRows||[]).map(yt),generatorVersion:typeof t.generatorVersion=="string"&&t.generatorVersion||typeof t.generator=="string"&&t.generator||"?",sourceRepoPath:typeof t.sourceRepoPath=="string"&&t.sourceRepoPath||typeof t.sourceRepo=="string"&&t.sourceRepo||typeof t.repo=="string"&&t.repo||"?",generatedAt:typeof t.generatedAt=="string"&&t.generatedAt||"?",sourceCommit:typeof t.sourceCommit=="string"&&t.sourceCommit||typeof t.commit=="string"&&t.commit||"",honestLimits:Array.isArray(t.honestLimits)?t.honestLimits.filter(i=>typeof i=="string"):[]}}function wt(e){const t=new Map;for(const p of e)p.rowId&&t.set(p.rowId,p);const s=new Map;for(const p of e){const d=p.candidateParent[0]?.parentRowId;if(!d||!t.has(d)||d===p.rowId)continue;const m=s.get(d);m?m.push(p):s.set(d,[p])}const i=new Set,r=(p,u)=>p.label.localeCompare(u.label),n=[...s.entries()].sort(([p],[u])=>p.localeCompare(u)).map(([p,u])=>{i.add(p);for(const d of u)d.rowId&&i.add(d.rowId);return{key:p,label:t.get(p).label,rows:u.slice().sort(r)}}),a=e.filter(p=>!p.rowId||!i.has(p.rowId)),o=new Map,c=[];for(const p of a)if(p.suggestedArea){const u=o.get(p.suggestedArea);u?u.push(p):o.set(p.suggestedArea,[p])}else c.push(p);const h=[...o.entries()].sort(([p],[u])=>p.localeCompare(u)).map(([p,u])=>({key:p,label:p,rows:u.slice().sort(r)})),b=c.length===0?[]:[{key:"unparented",label:"no proposed parent",rows:c.slice().sort(r)}];return[...n,...h,...b]}function St(e){if(!e||typeof e!="object")return"—";const t=typeof e.sourceKind=="string"&&e.sourceKind||typeof e.kind=="string"&&e.kind||typeof e.source=="string"&&e.source||"",s=typeof e.file=="string"&&e.file||typeof e.path=="string"&&e.path||"",i=e.line??e.lineRange??e.lines,r=i!=null?String(i):"",n=typeof e.testName=="string"&&e.testName||typeof e.test=="string"&&e.test||"",a=[t,s+(r?":"+r:""),n?"test: "+n:""].filter(Boolean);return a.length?a.join(" · "):"—"}const At=/^(?:https?:\/\/)?((?:[\w-]+\.)+[a-z]{2,}\/[\w.-]+\/[\w.-]+?)\/?$/i;function ke(e){const t=e??{},s=typeof t.sourceRepoPath=="string"&&t.sourceRepoPath||typeof t.repoPath=="string"&&t.repoPath||"",i=typeof t.sourceCommit=="string"&&t.sourceCommit||typeof t.commit=="string"&&t.commit||null,r=At.exec(s.trim());return{remote:r?`https://${r[1]}`:null,commit:i||null}}function Fe(e,t,s){if(!s.remote||!e)return null;const i=e.replace(/^\.\//,"").replace(/^\//,""),r=t==null||t===""?"":String(t),n=r&&/^\d+$/.test(r)?`#L${r}`:"";return`${s.remote}/blob/${s.commit||"main"}/${i}${n}`}function G(e,t,s,i,r={}){const n=t==null||t===""?"":String(t),a=`${r.prefix??""}${e}${n?`:${n}`:""}`,o=Fe(e,t,s);return o?`<a class="src-link" href="${i(o)}" target="_blank" rel="noopener">${i(a)}</a>`:i(a)}const kt="retired";function ae(e){return e.status===kt}function Be(e){const t=e.parents;if(t&&t.length>0)return t.filter(i=>typeof i=="string"&&i);const s=e.parent;return typeof s=="string"&&s?[s]:[]}function Lt(e){return e.some(t=>Be(t).length>0)}const Ct={US:"intent",FR:"requirement",NFR:"requirement",AC:"criterion"};function he(e){return e.tier?e.tier:Ct[e.type]??"criterion"}const Et={intent:"intent",requirement:"requirement",criterion:"criterion"};function je(e){return e.implementations.length>0||e.proofs.length>0||(e.carryingTasks?.length??0)>0}function Rt(e){const t=e.implementations.length>0,s=e.proofs.length>0;return t&&s?"full":t?"claim":s?"uncovered":"none"}function Pt(e){const t=new Map;for(const a of e)t.set(a.id,a);const s=new Map,i=[];for(const a of e){const o=Be(a).find(h=>t.has(h)&&h!==a.id);if(o===void 0){i.push(a);continue}const c=s.get(o);c?c.push(a.id):s.set(o,[a.id])}const r=new Set,n=(a,o)=>{r.add(a.id);const c=(s.get(a.id)??[]).filter(h=>!r.has(h)).map(h=>t.get(h)).sort(Ce);return{row:a,tier:he(a),depth:o,children:c.map(h=>n(h,o+1))}};return i.sort(Ce).map(a=>n(a,0))}const Le={intent:0,requirement:1,criterion:2};function Ce(e,t){const s=Le[he(e)]-Le[he(t)];return s!==0?s:e.id.localeCompare(t.id)}function Oe(e){return ae(e.row)||e.row.status==="backlog"?!1:je(e.row)||e.children.some(Oe)}const Ee={red:0,amber:1,green:2,blue:3,grey:4};function xt(e){return ae(e.row)||e.row.status==="backlog"?!1:je(e.row)}function _e(e){if(ae(e.row))return"grey";if(e.children.length===0)return fe(e.row.status);let t="blue";const s=i=>{Ee[i]<Ee[t]&&(t=i)};xt(e)&&s(fe(e.row.status));for(const i of e.children)Oe(i)&&s(_e(i));return t}function Tt(e){let t=0,s=0;const i=r=>{for(const n of r.children)ae(n.row)?s+=1:n.row.status==="backlog"&&(t+=1),i(n)};return i(e),{planned:t,retired:s}}function It(e){return e===!0?"passed":"proof named"}function Nt(e){return{buildEarned:!!(e.implementations&&e.implementations.length>0),proofEarned:!!(e.proofs&&e.proofs.length>0)}}function Mt(e){return e.statement.replace(/^\S+\s+—\s*/,"")}function qt(e,t,s,i=78,r=""){const{buildEarned:n}=Nt(e),a=Mt(e),o=t/2;let c;return e.status==="proven"?c=`<path d="M${o} 8 C ${o-2} 30, ${o+2} 52, ${o} 72" stroke="#e8bd52" stroke-width="1.4" fill="none" opacity=".85"/><circle cx="${o}" cy="8" r="2.5" fill="#219653"/><circle cx="${o}" cy="40" r="2.5" fill="#219653"/><circle cx="${o}" cy="72" r="2.5" fill="#219653"/>`:e.status==="tracked-debt"?c=`<path d="M${o} 8 C ${o-2} 30, ${o+2} 52, ${o} 72" stroke="#e8bd52" stroke-width="1.4" fill="none" opacity=".8"/><circle cx="${o}" cy="8" r="2.5" fill="#219653"/><circle cx="${o}" cy="40" r="2.5" fill="#c9903a"/><circle cx="${o}" cy="72" r="2.5" fill="none" stroke="#c9903a" stroke-width="1.2"/>`:e.status==="backlog"?c=`<path d="M${o} 8 L ${o} 22" stroke="#e8bd52" stroke-width="1.4" opacity=".8"/><path d="M${o} 22 C ${o-2} 34, ${o+2} 42, ${o-1} 50" stroke="#e8bd52" stroke-width="1" fill="none" opacity=".3" stroke-dasharray="2 3"/><circle cx="${o}" cy="8" r="2.5" fill="#9ed4ff"/>`:c=n?`<path d="M${o} 8 C ${o-2} 30, ${o+2} 52, ${o} 72" stroke="#7d8894" stroke-width="1.4" fill="none" opacity=".6"/><circle cx="${o}" cy="8" r="2.5" fill="#7d8894"/><circle cx="${o}" cy="40" r="2.5" fill="#219653"/><circle cx="${o}" cy="72" r="2.5" fill="#eb5757"/>`:`<path d="M${o} 8 C ${o-2} 24, ${o+2} 32, ${o} 40" stroke="#7d8894" stroke-width="1.4" fill="none" opacity=".6"/><circle cx="${o}" cy="8" r="2.5" fill="#7d8894"/><circle cx="${o}" cy="40" r="2.5" fill="#eb5757"/>`,`<button type="button" class="${r?`strand ${r}`:"strand"}" data-id="${s(e.id)}" title="${s(e.id)} · ${s(e.status)} · ${s(a)}"><svg width="${t}" height="${i}" viewBox="0 0 ${t} 78" xmlns="http://www.w3.org/2000/svg">${c}</svg></button>`}const Dt=13,Gt=8,Ft=30,Bt=78,f=document.querySelector("#app"),U='<span class="brand-accent">Loupe</span>',O=11,B=3.6,le=10,ze=[{key:"backlog",label:"Backlog"},{key:"tracked-debt",label:"Tracked debt"},{key:"proven",label:"Proven"},{key:"GAP",label:"GAP"}];function N(e){return v?.statusCounts[e]??0}function jt(){return v?.gate?v.gate.ok:N("GAP")===0}function Ue(){return!jt()}const Re={1:"READ",2:"SCAN",3:"SKYLINE"};function Q(e){return Math.min(3,Math.max(1,e))}let v=null,$=null,V=null,be="same-origin";function Ot(){return be==="same-origin"}let y=null,R=!1,x="list",w="all",T="",W=null,j=!1,E=2,He=!1,H=null,Ve=null;function _t(){return!v||!W?null:De(v).find(e=>e.key===W)??null}const z=new Set,D=new Map,te="loupe.paneSplit",Pe="clewloupe.paneSplit",Ke=.2,We=.8;let _=zt();function zt(){let e=window.localStorage.getItem(te);if(e===null){const s=window.localStorage.getItem(Pe);s!==null&&(window.localStorage.setItem(te,s),window.localStorage.removeItem(Pe),e=s)}const t=Number(e??NaN);return Number.isFinite(t)&&t>=Ke&&t<=We?t:null}const Ut=960;function Z(){const e=f.querySelector(".layout");if(e){if(_===null||window.innerWidth<=Ut){e.style.removeProperty("grid-template-columns");return}e.style.gridTemplateColumns=`minmax(0, ${_}fr) 6px minmax(280px, ${1-_}fr)`}}let ce=!1;function Ze(){ce||(ce=!0,requestAnimationFrame(()=>{ce=!1,ge(),nt()}))}const de=new ResizeObserver(Ze);function me(){de.disconnect();const e=f.querySelector(".thread, .ghost-thread");e&&(de.observe(e),e.querySelectorAll(":scope > .tier").forEach(t=>de.observe(t)))}function Xe(){return $?ke({sourceRepoPath:$.sourceRepoPath,sourceCommit:$.sourceCommit}):v?ke(v):{remote:null,commit:null}}function pe(e,t){return`${e}:${t}`}function X(e){return`<p class="footnote">${e}${be==="user-file"?" Loaded from your machine: nothing in this file was sent anywhere.":""}</p>`}function ye(){return`
        <div class="topbar-actions">
          <button type="button" class="load-manifest" id="loadManifest">Load Manifest…</button>
          <input type="file" id="manifestFile" accept="application/json,.json" hidden />
          <button type="button" class="load-manifest" id="loadDig">Load dig…</button>
          <input type="file" id="digFile" accept="application/json,.json" hidden />
        </div>`}function Ye(){return`
        <div class="lens-tabs" data-design="lens-tabs">
          <button type="button" class="lens-tab${x==="list"?" active":""}" data-lens="list">List</button>
          <button type="button" class="lens-tab${x==="map"?" active":""}" data-lens="map">Map</button>
          <button type="button" class="lens-tab${x==="descent"?" active":""}" data-lens="descent" title="Walk the rail: objective, intent, build, proof">Descent</button>
          ${x==="map"?Ht():""}
        </div>`}function Ht(){return`
          <div class="zoom-control" data-design="zoom-control">
            <button type="button" class="zoom-btn" data-zoom-out title="Zoom out (more density)">−</button>
            <span class="zoom-level" title="Map zoom: ${Re[E]}">${Re[E]}</span>
            <button type="button" class="zoom-btn" data-zoom-in title="Zoom in (more detail)">+</button>
          </div>`}async function Vt(){const e=new URLSearchParams(location.search).get("manifest")??"/trace-manifest.json",t=await fetch(e).catch(()=>null);if(!t||!t.ok){const c=t?`HTTP ${t.status}`:"fetch failed: for a cross-origin URL, the host must allow CORS";f.innerHTML=`<main class="topbar"><div><h1 class="brand">${U}</h1><p class="meta">Could not load ${l(e)} (${c}). Expected a trace-manifest.json (see samples/), or pass ?manifest=&lt;url&gt;.</p></div></main>`;return}const s=await t.json().catch(()=>null);if(!s){f.innerHTML=`<main class="topbar"><div><h1 class="brand">${U}</h1><p class="meta">Not JSON: ${l(e)}.</p></div></main>`;return}let i="remote-url";try{new URL(e,location.href).origin===location.origin&&(i="same-origin")}catch{i="remote-url"}const r=tt(s,i);if(r.kind==="unknown"){f.innerHTML=`<main class="topbar"><div><h1 class="brand">${U}</h1><p class="meta">${l(r.message??"Not a supported artifact.")}</p></div></main>`;return}const n=new URLSearchParams(location.search);He=n.get("embed")==="1";const a=n.get("ids");if(a){const c=a.split(",").map(h=>h.trim()).filter(Boolean);c.length>0&&(H=new Set(c))}Ve=n.get("title");const o=n.get("lens");if((o==="descent"||o==="list"||o==="map")&&(x=o),v){const c=pt(v.rows,n.get("id"));y=c??null,R=!!c}k(),window.addEventListener("resize",()=>{Z(),Ze()}),document.addEventListener("keydown",c=>{c.key==="Escape"&&(y||R)&&(y=null,R=!1,k())})}function Y(){if(!v)return[];const e=T.trim().toLowerCase();return v.rows.filter(t=>H===null||H.has(t.id)).filter(t=>e?t.id.toLowerCase().includes(e)||t.statement.toLowerCase().includes(e)||t.status.toLowerCase().includes(e):!0).filter(t=>w==="all"||t.status===w)}function Kt(){if(!y)return;Y().some(t=>t.id===y)||(y=null,R=!1)}function Je(){const e={window:{x:window.scrollX,y:window.scrollY}},t=f.querySelector(".table-wrap");t&&(e.table={top:t.scrollTop,left:t.scrollLeft});const s=f.querySelector(".field");return s&&(e.field={top:s.scrollTop}),e}function se(e){if(e.table){const t=f.querySelector(".table-wrap");t&&(t.scrollTop=e.table.top,t.scrollLeft=e.table.left)}if(e.field){const t=f.querySelector(".field");t&&(t.scrollTop=e.field.top)}e.window&&window.scrollTo(e.window.x,e.window.y)}function k(e={}){if(V){Wt();return}if($){ds(e);return}v&&Zt(e)}function Wt(){f.innerHTML=`
    <header class="topbar" data-design="topbar">
      <div>
        <h1 class="brand">${U}</h1>
        ${ye()}
      </div>
    </header>
    <main class="cube-refusal" data-design="cube-refusal">
      <p class="cube-refusal-message">${l(V??"")}</p>
    </main>
  `,ne()}function Zt(e={}){if(!v)return;Kt();const t=R?v.rows.find(a=>a.id===y)??null:null,s=Ue(),i=v.gate?.failures?.length??0,r=e.resetMatrixScroll?null:Je(),n=`
        ${t?us(t):Xt()}
        ${X("Reads trace-manifest.json only; no target re-scan: this readout is the emitter's, not re-derived here.")}
  `;if(He){f.innerHTML=ut(x==="descent"?Te():n),ne(),me(),requestAnimationFrame(()=>ge());return}f.innerHTML=`
    <header class="topbar${s?" gate-failed":""}" data-design="topbar">
      <div>
        <h1 class="brand">${U}</h1>
        <p class="meta">${l(v.targetName)} · manifest ${l(v.generatedAt)} · schema v${v.schemaVersion}</p>
        ${s?`<p class="gate-banner" data-design="gate-banner" title="Gate refused this manifest">Golden Thread broken${i?` · ${i} ${i===1?"refusal":"refusals"}`:""}</p>`:'<p class="gate-ok-meta" title="Gate accepted this manifest">Golden Thread intact</p>'}
        ${ye()}
      </div>
      <div class="stats" data-design="stats">
        <button type="button" class="stat${w==="all"&&!T.trim()?" active":""}" data-stat-filter="all" title="Show all rows">
          <div class="n">${v.rows.length}</div><div class="l">Rows</div>
        </button>
        <button type="button" class="stat${w==="backlog"&&!T.trim()?" active":""}" data-stat-filter="backlog" title="Show backlog rows">
          <div class="n">${N("backlog")}</div><div class="l">Backlog</div>
        </button>
        <button type="button" class="stat${w==="tracked-debt"&&!T.trim()?" active":""}" data-stat-filter="tracked-debt" title="Show tracked-debt rows">
          <div class="n">${N("tracked-debt")}</div><div class="l">Debt</div>
        </button>
        <button type="button" class="stat${w==="proven"&&!T.trim()?" active":""}" data-stat-filter="proven" title="Show proven rows">
          <div class="n">${N("proven")}</div><div class="l">Proven</div>
        </button>
        <button type="button" class="stat${N("GAP")>0?" stat-gap-hot":""}${w==="GAP"&&!T.trim()?" active":""}" data-stat-filter="GAP" title="Show GAP rows">
          <div class="n">${N("GAP")}</div><div class="l">GAP</div>
        </button>
      </div>
    </header>
    <div class="layout">
      <section class="matrix-pane" data-design="matrix-pane" tabindex="0">
        <h2 class="pane-title">Traceability matrix</h2>
        ${Ye()}
        <div class="toolbar" data-design="toolbar">
          <input id="q" type="search" placeholder="Filter by ID or statement…" value="${S(T)}" />
          <select id="status">
            <option value="all"${w==="all"?" selected":""}>All statuses</option>
            ${ze.map(({key:a,label:o})=>`<option value="${a}"${w===a?" selected":""}>${o}</option>`).join(`
            `)}
          </select>
          <!-- @covers FR-ROLL-10: sibling gesture beside find/filter, no apply step -->
          <select id="rollup" title="Roll the descent up by a dimension">
            <option value=""${W===null?" selected":""}>No rollup</option>
            ${De(v).map(a=>`<option value="${S(a.key)}"${W===a.key?" selected":""}>By ${l(a.label)}</option>`).join(`
            `)}
          </select>
        </div>
        ${x==="map"?es():x==="descent"?Te():Qt()}
      </section>
      <div class="pane-divider" data-design="pane-divider" role="separator" aria-orientation="vertical" title="Drag to resize; double-click to reset"></div>
      <section class="descent-pane" data-design="descent-pane">
        <h2 class="pane-title">Thread</h2>
        ${n}
      </section>
    </div>
  `,ne(),Z(),me(),r&&(se(r),requestAnimationFrame(()=>{se(r),ge()}))}function Xt(){const e=Y();if(e.length===0){const n=w!=="all"?ie(w,N(w)):{title:"No matching rows",body:"Try clearing the search filter."};return`<p class="descent-empty"><strong>${l(n.title)}</strong><br>${l(n.body)}</p>`}const t=j?Dt:Gt,s=j?Bt:Ft,i=e.map(n=>qt(n,t,l,s,n.id===y?"cross-pinned":"")).join(""),r=j?'<button type="button" class="field-expand-toggle" data-field-expand-toggle title="Collapse to a compact summary">collapse</button>':'<button type="button" class="field-expand-toggle" data-field-expand-toggle title="Expand to the full census">expand</button>';return`
      <div class="field-wrap${j?"":" field-wrap-compact"}" data-design="field-wrap">
        <div class="field-head" data-design="field-head">${e.length} thread${e.length===1?"":"s"}${r}</div>
        <div class="field${j?"":" field-compact"}" data-design="field">${i}</div>
      </div>
  `}function xe(e){return`
                <tr class="status-${e.status}${R&&e.id===y?" selected":""}${e.id===y?" cross-pinned":""}" data-id="${S(e.id)}">
                  <td class="id">${l(e.id)}</td>
                  <td><span class="badge ${e.status}">${l(e.status)}</span></td>
                  <td class="statement">${l(Se(re(e.id,e.statement),140))}</td>
                  <td>${e.proofs.length}</td>
                </tr>`}function Qe(e){return ze.map(({key:t,label:s})=>e[t]>0?`<span class="badge ${t}" title="${S(s)}">${e[t]} ${l(s)}</span>`:"").filter(Boolean).join(" ")}function Te(){if(!v)return"";const e=Y(),t=v.gate?.executionVerified===!0,s=`
      <div class="rail-head" data-design="rail-head">
        <div class="rail-head-line">DESCENT · ${l(Ve??v.targetName)}${H?` · ${H.size} id${H.size===1?"":"s"} on this card`:""} · manifest ${l(v.generatedAt)}</div>
        <div class="rail-head-flag rail-flag-${t?"on":"off"}" title="${S(t?"gate.executionVerified: proven was derived from a passing test-results report":"gate.executionVerified is false: proven was derived by name matching, with no test-results report read")}">${t?"execution verified":"execution not verified"}</div>
      </div>
      <div class="rail-objective" data-design="rail-objective">
        <span class="dn-level-tag">OBJECTIVE</span>
        <span class="rail-objective-none">no objective declared in this manifest</span>
      </div>`;if(e.length===0){const o=w==="all"?{title:"No matching rows",body:"Try clearing the search filter."}:ie(w,N(w));return`<div class="rail" data-design="rail">${s}
      <div class="table-empty" data-design="table-empty">
        <div class="table-empty-title">${l(o.title)}</div>
        <div class="table-empty-body">${l(o.body)}</div>
      </div></div>`}const i=Pt(e),n=!Lt(e)?'<div class="rail-flat-note" data-design="rail-flat-note">this manifest declares no hierarchy</div>':"",a=i.map(o=>et(o,t)).join("");return`<div class="rail" data-design="rail">
      ${s}
      ${n}
      <div class="rail-body">${a}</div>
      ${Jt()}
      ${X("Reads trace-manifest.json only; no target re-scan. Edges are the file's own declared parents, never inferred from an ID family.")}
    </div>`}function et(e,t){const s=e.row,i=_e(e),r=Tt(e),n=[];r.planned>0&&n.push(`${r.planned} planned`),r.retired>0&&n.push(`${r.retired} retired`);const a=n.length?`<span class="dn-marks" title="Counted under this node, not coloured into it">${l(n.join(" · "))}</span>`:"",o=s.id===y?" cross-pinned":"";return`
      <div class="dn-group" style="--dn-depth:${e.depth}">
        <div class="dn dn-${i}${o}" data-id="${S(s.id)}" title="${S(`${s.id} · ${s.status}`)}">
          <span class="dn-dot dn-dot-${i}" aria-hidden="true"></span>
          <span class="dn-level-tag">INTENT</span>
          <span class="dn-id">${l(s.id)}</span>
          <span class="dn-tier">${l(Et[e.tier])}</span>
          <span class="dn-statement">${l(Se(re(s.id,s.statement),150))}</span>
          ${a}
        </div>
        ${Yt(s,t)}
        ${e.children.map(c=>et(c,t)).join("")}
      </div>`}function Yt(e,t){const s=Rt(e);if(s==="none")return"";const i=It(t),r=e.implementations.length>0?`<div class="dn-ev dn-ev-build">
          <span class="dn-level-tag">BUILD</span>
          <span class="dn-ev-count">${e.implementations.length} mark${e.implementations.length===1?"":"s"}</span>
          <span class="dn-ev-detail">${l(e.implementations.map(a=>`${K(a.path)}:${a.line}`).join(" · "))}</span>
        </div>`:`<div class="dn-ev dn-ev-nobuild">
          <span class="dn-level-tag">BUILD</span>
          <span class="dn-ev-absent">no file carries this id</span>
        </div>`,n=e.proofs.length>0?`<div class="dn-ev dn-ev-proof">
          <span class="dn-level-tag">PROOF</span>
          <span class="dn-ev-count">${e.proofs.length} ${e.proofs.length===1?"test":"tests"}, ${l(i)}</span>
          <span class="dn-ev-detail">${l(e.proofs.map(a=>a.name).join(" · "))}</span>
        </div>`:`<div class="dn-ev dn-ev-noproof">
          <span class="dn-level-tag">PROOF</span>
          <span class="dn-ev-absent">no proof yet</span>
        </div>`;return`<div class="dn-evidence dn-strand-${s}" data-design="dn-evidence">${r}${n}</div>`}function Jt(){const e=v?.retired??[];return e.length===0?"":`<div class="rail-retired" data-design="rail-retired">
      <div class="rail-retired-head">RETIRED · ${e.length} withdrawn on purpose · not positioned on the rail</div>
      ${e.map(t=>`<div class="rail-retired-row"><span class="dn-id">${l(t.id)}</span><span class="dn-tier">${l(t.date??"")}</span><span class="dn-statement">${l(t.reason??"")}</span></div>`).join("")}
    </div>`}function Qt(){const e=Y(),t=_t(),s=e.length===0?(()=>{const n=w==="all"?{title:"No matching rows",body:"Try clearing the search filter."}:ie(w,N(w));return`<div class="table-empty" data-design="table-empty">
            <div class="table-empty-title">${l(n.title)}</div>
            <div class="table-empty-body">${l(n.body)}</div>
          </div>`})():"",i=t?dt(e,t).map(n=>`
                <tr class="rollup-group-header" data-design="rollup-group-header">
                  <td colspan="4">
                    <span class="rollup-group-label">${l(n.label)}</span>
                    <span class="rollup-group-count">${n.rows.length}</span>
                    <span class="rollup-strip" data-design="rollup-strip">${Qe(n.counts)}</span>
                  </td>
                </tr>${n.rows.map(xe).join("")}`).join(""):e.map(xe).join(""),r=gt();return`
        <div class="table-wrap">
          <table data-design="matrix-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Statement</th>
                <th title="${S(r.title)}">${l(r.label)}</th>
              </tr>
            </thead>
            <tbody>
              ${i}
            </tbody>
          </table>
          ${s}
        </div>
  `}function ie(e,t){if(t===0)switch(e){case"GAP":return{title:"No silent gaps",body:"Every AC in this run has proof or tracked debt."};case"tracked-debt":return{title:"No tracked debt",body:"Nothing in this run is deliberately deferred."};case"backlog":return{title:"No bare backlog",body:"Every US/FR/NFR here has its own build or proof, or is tracked as debt."};default:return{title:"Nothing proven yet",body:"No intent here has proof."}}return{title:"No matches",body:"Rows exist in this status, but the current filter hides them."}}function Ie(e){const t=re(e.id,e.statement);return`
    <div class="detail-card status-${e.status}${R&&e.id===y?" selected":""}${e.id===y?" cross-pinned":""}" data-id="${S(e.id)}" title="${S(e.id)} · ${S(e.status)} · ${S(t)}">
      <span class="detail-card-id ${e.status}">${l(e.id)}</span>
      <div class="detail-card-excerpt">${l(t)}</div>
    </div>
  `}function es(){const e=Y();if(e.length===0){const i=w!=="all"?ie(w,N(w)):{title:"No matching rows",body:"Try clearing the search filter."};return`<div class="map-empty" data-design="map-empty">
      <div class="map-empty-title">${l(i.title)}</div>
      <div class="map-empty-body">${l(i.body)}</div>
    </div>`}const t=vt(e),s=new Map(e.map(i=>[i.id,i]));return`
    <div class="map-wrap-outer" data-design="map-wrap-outer">
      <div class="map-head" data-design="map-head">${t.length} stor${t.length===1?"y":"ies"}</div>
      <div class="map-wrap${E===1?"":` map-wrap-level-${E}`}" data-design="map-wrap">${t.map(i=>ts(i,s)).join("")}</div>
      ${X("Reads trace-manifest.json only; no target re-scan: this readout is the emitter's, not re-derived here.")}
    </div>
  `}function ts(e,t){const s=t.get(e.key);return`
    <div class="map-column" data-design="map-column">
      ${s?`<div class="map-spine-card" data-design="map-spine-card">${Ie(s)}</div>`:`
      <div class="map-column-head" data-design="map-column-head">
        <span class="map-column-label">${l(e.label)}</span>
        <span class="map-column-count">${e.rows.length}</span>
        <span class="map-column-strip" data-design="map-column-strip">${Qe(e.counts)}</span>
      </div>`}
      <div class="map-column-cards">${e.rows.map(Ie).join("")}</div>
    </div>
  `}function ss(e){f.querySelectorAll(`[data-id="${CSS.escape(e)}"]`).forEach(t=>{t.scrollIntoView({block:"nearest"})})}function ns(){if(!y||!$)return;$e().some(t=>t.rowId===y)||(y=null,R=!1)}function $e(){if(!$)return[];const e=T.trim().toLowerCase();return e?$.rows.filter(t=>{const s=t.provenance,i=typeof s.file=="string"&&s.file||typeof s.path=="string"&&s.path||"";return t.label.toLowerCase().includes(e)||t.statement.toLowerCase().includes(e)||(t.rowId??"").toLowerCase().includes(e)||i.toLowerCase().includes(e)}):$.rows}function as(){if(!$)return"";const e=$.honestLimits.map(t=>`<li>${l(t)}</li>`).join("");return`
      <div class="ghost-provenance-card" data-design="ghost-provenance-card">
        <div class="ghost-provenance-row"><span class="l">Source repo</span><span class="v">${l($.sourceRepoPath)}</span></div>
        <div class="ghost-provenance-row"><span class="l">Source commit</span><span class="v">${l($.sourceCommit||"—")}</span></div>
        <div class="ghost-provenance-row"><span class="l">Generated</span><span class="v">${l($.generatedAt)}</span></div>
        <div class="ghost-provenance-row"><span class="l">Generator</span><span class="v">${l($.generatorVersion)}</span></div>
        ${e?`<div class="ghost-limits"><div class="l">Honest limits</div><ul>${e}</ul></div>`:""}
        <p class="ghost-epistemic-note">Every row here is proposed and attested by no one. Nothing here is anointed.</p>
      </div>
  `}function we(e){if(e.gap===null)return"";const t=e.gap==="partial"?"PARTIAL":"GAP",s=e.gap==="partial"?"The dig found this partially implemented or partially proven":"The dig found this published in the spec but not implemented or tested";return`<span class="hchip ghostgap" title="${S(s)}">${t}</span>`}function is(e){const t=Xe(),s=e.candidateParent.length>0,i=e.candidateBuild.length>0,r=e.candidateProof!==null,n=e.candidateBuild.length?e.candidateBuild.map(c=>`
              <li>
                <code>${l(c.type||K(c.file)||"(unnamed)")}</code>
                <div class="path">${G(c.file,c.line,t,l)}</div>
                ${c.provenanceFile?`<div class="path">seen at ${G(c.provenanceFile,c.provenanceLine,t,l)}</div>`:""}
                ${c.basis?`<div class="excerpt">${l(c.basis)}</div>`:""}
              </li>`).join(""):'<li class="empty">No candidate build.</li>',a=e.candidateParent.length?e.candidateParent.map(c=>`
              <li>
                <code>${l(c.parentRowId??"(unresolved)")}</code>
                <div class="path">${l(c.basis||"no basis stated")}</div>
              </li>`).join(""):'<li class="empty">No candidate parent — proposed as its own root.</li>',o=e.candidateProof?`
              <li>
                <code>${l(e.candidateProof.test||"(unnamed test)")}</code>
                <div class="path">${G(e.candidateProof.file,e.candidateProof.line,t,l)}</div>
                <div class="excerpt">${l(e.candidateProof.basis)}</div>
              </li>`:'<li class="empty">No candidate proof.</li>';return`
      <div class="descent ghost-descent" data-design="descent">
        <button type="button" class="descent-back" data-descent-back title="Back to the dig">‹ Back to the dig</button>
        <div class="ghost-descent-head">
          <span class="detail-card-id ghost-dim">${l(e.label)}</span>
          <span class="hchip ghostguess">${l(e.typeGuess)} — a guess</span>
          <span class="hchip ghost">${l(e.epistemicClass.toUpperCase())}</span>
          ${we(e)}
          ${e.confidence?`<span class="hchip ghostguess">confidence: ${l(e.confidence)}</span>`:""}
        </div>
        <div class="ghost-thread" data-design="ghost-thread">
          <svg class="ghost-rail" aria-hidden="true"></svg>
          <div class="tier ghost-tier" data-present="true">
            <div class="tier-label">PROPOSED INTENT</div>
            <div class="tier-body">${e.statement?l(e.statement):"<i>no statement text</i>"}</div>
            <div class="gdesc-faint">dug from: ${l(St(e.provenance))}</div>
          </div>
          <div class="tier ghost-tier${s?"":" ghost-leg-absent"}" data-present="${s}">
            <div class="tier-label">CANDIDATE PARENT</div>
            <ul class="hit-list">${a}</ul>
          </div>
          <div class="tier ghost-tier${i?"":" ghost-leg-absent"}" data-present="${i}">
            <div class="tier-label">CANDIDATE BUILD</div>
            <ul class="hit-list">${n}</ul>
          </div>
          <div class="tier ghost-tier${r?"":" ghost-leg-absent"}" data-present="${r}">
            <div class="tier-label">CANDIDATE PROOF</div>
            <ul class="hit-list">${o}</ul>
          </div>
        </div>
        <p class="ghost-epistemic-note">Proposed only — attested by no one. Anointment is not a button here, it is a pull request.</p>
      </div>
  `}function rs(e){const t=e.rowId?` data-id="${S(e.rowId)}"`:"";return`
                <tr class="ghost-row-tr${R&&e.rowId===y?" selected":""}${e.rowId===y?" cross-pinned":""}"${t}>
                  <td class="id ghost-dim">${l(e.label)}</td>
                  <td><span class="hchip ghostguess">${l(e.typeGuess)} — a guess</span> <span class="hchip ghost">${l(e.epistemicClass.toUpperCase())}</span> ${we(e)}</td>
                  <td class="statement">${l(Se(e.statement,140))}</td>
                  <td>${e.confidence?l(e.confidence):"—"}</td>
                </tr>`}function os(){const e=$e();return e.length===0?'<div class="table-empty" data-design="table-empty"><div class="table-empty-title">No proposed rows match.</div></div>':`
        <div class="table-wrap">
          <table data-design="matrix-table">
            <thead>
              <tr><th>ID</th><th>Type</th><th>Statement</th><th>Confidence</th></tr>
            </thead>
            <tbody>
              ${e.map(rs).join("")}
            </tbody>
          </table>
        </div>
  `}function Ne(e){const t=e.rowId?` data-id="${S(e.rowId)}"`:"";return`
    <div class="detail-card ghost-card${R&&e.rowId===y?" selected":""}${e.rowId===y?" cross-pinned":""}"${t} title="${S(e.label)} · proposed · ${S(e.typeGuess)}">
      <span class="detail-card-id ghost-dim">${l(e.label)}</span>
      <span class="hchip ghostguess">${l(e.typeGuess)} — a guess</span> <span class="hchip ghost">${l(e.epistemicClass.toUpperCase())}</span> ${we(e)}
      <div class="detail-card-excerpt">${l(e.statement)}</div>
    </div>
  `}function ls(){const e=$e();if(e.length===0)return'<div class="map-empty" data-design="map-empty"><div class="map-empty-title">No proposed rows match.</div></div>';const t=wt(e),s=new Map;for(const i of e)i.rowId&&s.set(i.rowId,i);return`
    <div class="map-wrap-outer" data-design="map-wrap-outer">
      <div class="map-head" data-design="map-head">${t.length} propos${t.length===1?"al":"als"}</div>
      <div class="map-wrap ghost-map-wrap${E===1?"":` map-wrap-level-${E}`}" data-design="map-wrap">${t.map(i=>cs(i,s)).join("")}</div>
      ${X("Reads the dig-report only; no target re-scan: this readout is the excavation tool's own, not re-derived here.")}
    </div>
  `}function cs(e,t){const s=t.get(e.key);return`
    <div class="map-column ghost-map-column" data-design="map-column">
      ${s?`<div class="map-spine-card ghost-spine-card" data-design="map-spine-card">${Ne(s)}</div>`:`
      <div class="map-column-head ghost-column-head" data-design="map-column-head">
        <span class="map-column-label">${l(e.label)}</span>
        <span class="map-column-count">${e.rows.length}</span>
      </div>`}
      <div class="map-column-cards">${e.rows.map(Ne).join("")}</div>
    </div>
  `}function ds(e={}){if(!$)return;ns();const t=R?$.rows.find(a=>a.rowId===y)??null:null,s=e.resetMatrixScroll?null:Je(),i=new Map;for(const a of $.rows)i.set(a.typeGuess,(i.get(a.typeGuess)??0)+1);const r=[...i.entries()].sort(([a],[o])=>a.localeCompare(o)).map(([a,o])=>`<span class="hchip ghostguess">${o} ${l(a)}</span>`).join(" "),n=`
        ${t?is(t):as()}
        ${X("Reads the dig-report only; no target re-scan: this readout is the excavation tool's own, not re-derived here.")}
  `;f.innerHTML=`
    <header class="topbar ghost-topbar" data-design="topbar">
      <div>
        <h1 class="brand">${U}</h1>
        <p class="meta">${l($.sourceRepoPath)} · dig ${l($.generatedAt)} · ${l($.generatorVersion)}</p>
        <p class="ghost-epistemic-banner" title="Every row here is a proposal">Proposed only — attested by no one</p>
        ${ye()}
      </div>
      <div class="stats ghost-stats" data-design="stats">
        <div class="stat"><div class="n">${$.rows.length}</div><div class="l">Proposed</div></div>
        <div class="ghost-type-chips">${r}</div>
      </div>
    </header>
    <div class="layout">
      <section class="matrix-pane" data-design="matrix-pane" tabindex="0">
        <h2 class="pane-title">Proposed rows</h2>
        ${Ye()}
        <div class="toolbar" data-design="toolbar">
          <input id="q" type="search" placeholder="Filter by ID or statement…" value="${S(T)}" />
        </div>
        ${x==="map"?ls():os()}
      </section>
      <div class="pane-divider" data-design="pane-divider" role="separator" aria-orientation="vertical" title="Drag to resize; double-click to reset"></div>
      <section class="descent-pane" data-design="descent-pane">
        <h2 class="pane-title">Thread</h2>
        ${n}
      </section>
    </div>
  `,ne(),Z(),me(),nt(),s&&(se(s),requestAnimationFrame(()=>se(s)))}function ne(){f.querySelector("#loadManifest")?.addEventListener("click",()=>{f.querySelector("#manifestFile")?.click()}),f.querySelector("#loadDig")?.addEventListener("click",()=>{f.querySelector("#digFile")?.click()}),f.querySelector("#digFile")?.addEventListener("change",n=>{const a=n.target.files?.[0];a&&qe(a),n.target.value=""}),f.querySelector("#manifestFile")?.addEventListener("change",n=>{const a=n.target.files?.[0];a&&qe(a)}),f.querySelector("#q")?.addEventListener("input",n=>{T=n.target.value,k({resetMatrixScroll:!0}),f.querySelector("#q")?.focus();const a=f.querySelector("#q");a&&(a.selectionStart=a.selectionEnd=a.value.length)}),f.querySelector("#status")?.addEventListener("change",n=>{w=n.target.value,k({resetMatrixScroll:!0})}),f.querySelector("#rollup")?.addEventListener("change",n=>{const a=n.target.value;W=a===""?null:a,k({resetMatrixScroll:!0})}),f.querySelectorAll("[data-stat-filter]").forEach(n=>{n.addEventListener("click",()=>{const a=n.getAttribute("data-stat-filter");a&&(T="",w=a==="all"?"all":a,k({resetMatrixScroll:!0}))})}),f.querySelectorAll(".lens-tab[data-lens]").forEach(n=>{n.addEventListener("click",()=>{const a=n.getAttribute("data-lens");!a||a===x||(x=a,k({resetMatrixScroll:!0}))})}),f.querySelectorAll("tbody tr[data-id], .strand[data-id], .detail-card[data-id]").forEach(n=>{n.addEventListener("click",()=>{const a=n.getAttribute("data-id");a&&(y=a,R=!0,k(),requestAnimationFrame(()=>ss(a)))})});const e=n=>{f.querySelectorAll(".cross-hover").forEach(a=>a.classList.remove("cross-hover")),n&&f.querySelectorAll(`[data-id="${CSS.escape(n)}"]`).forEach(a=>a.classList.add("cross-hover"))};let t=null;const s=n=>{if(x==="map")return;const a=f.querySelector(".matrix-pane");a&&(t=a,a.style.minHeight=`${a.getBoundingClientRect().height}px`),f.querySelectorAll("tbody tr[data-id]").forEach(o=>{o.getAttribute("data-id")!==n&&o.classList.add("cross-isolated")})},i=()=>{f.querySelectorAll(".cross-isolated").forEach(n=>n.classList.remove("cross-isolated")),t&&(t.style.minHeight="",t=null)};f.querySelectorAll(".strand[data-id]").forEach(n=>{n.addEventListener("mouseenter",()=>{const a=n.getAttribute("data-id");e(a),a&&s(a)}),n.addEventListener("mouseleave",()=>{e(null),i()})}),f.querySelectorAll("tbody tr[data-id], .detail-card[data-id]").forEach(n=>{n.addEventListener("mouseenter",()=>e(n.getAttribute("data-id"))),n.addEventListener("mouseleave",()=>e(null))}),f.querySelector("[data-descent-back]")?.addEventListener("click",()=>{if(R=!1,k(),y){const n=y;requestAnimationFrame(()=>{f.querySelector(`.strand[data-id="${CSS.escape(n)}"]`)?.scrollIntoView({block:"nearest"})})}}),f.querySelector("[data-field-expand-toggle]")?.addEventListener("click",()=>{j=!j,k()}),f.querySelector("[data-zoom-in]")?.addEventListener("click",()=>{E=Q(E+1),k()}),f.querySelector("[data-zoom-out]")?.addEventListener("click",()=>{E=Q(E-1),k()}),f.querySelector(".matrix-pane")?.addEventListener("keydown",n=>{if(x!=="map")return;const a=n.key;a==="+"||a==="="?(E=Q(E+1),k()):(a==="-"||a==="_")&&(E=Q(E-1),k())});const r=f.querySelector(".pane-divider");r&&(r.addEventListener("pointerdown",n=>{const a=f.querySelector(".layout");if(!a)return;n.preventDefault(),r.setPointerCapture(n.pointerId),r.classList.add("dragging"),document.body.classList.add("pane-resizing");const o=a.getBoundingClientRect(),c=b=>{const p=(b.clientX-o.left)/Math.max(o.width,1);_=Math.min(We,Math.max(Ke,p)),Z()},h=b=>{r.releasePointerCapture(b.pointerId),r.classList.remove("dragging"),document.body.classList.remove("pane-resizing"),r.removeEventListener("pointermove",c),r.removeEventListener("pointerup",h),r.removeEventListener("pointercancel",h),_!==null&&window.localStorage.setItem(te,String(_))};r.addEventListener("pointermove",c),r.addEventListener("pointerup",h),r.addEventListener("pointercancel",h)}),r.addEventListener("dblclick",()=>{_=null,window.localStorage.removeItem(te),Z()})),f.querySelectorAll(".source-toggle").forEach(n=>{n.addEventListener("click",()=>{const a=n.getAttribute("data-source-key");if(a){if(z.has(a)){z.delete(a),k();return}if(z.add(a),k(),!D.has(a)){const o=n.getAttribute("data-source-path"),c=Number(n.getAttribute("data-source-line"));hs(a,o,c)}}})})}function tt(e,t){const s=bt(e);return be=t,s==="trace-manifest"?(v=rt(e),$=null,V=null,Me(),{kind:s}):s==="dig-report"?($=$t(e),v=null,V=null,Me(),{kind:s}):s==="cost-cube"?(v=null,$=null,V="This is a cost-cube. Tally reads those.",{kind:s}):{kind:s,message:"Not a supported artifact — expected a trace-manifest, a dig-report, or a cost-cube."}}function Me(){z.clear(),D.clear(),T="",w="all",y=null,R=!1}async function qe(e){try{const t=await e.text(),s=JSON.parse(t),i=tt(s,"user-file");if(i.kind==="unknown"){window.alert(i.message);return}k({resetMatrixScroll:!0})}catch(t){window.alert(`Could not read file: ${t}`)}}function ps(e){switch(e){case"GAP":return"No proof: silent gap (Golden Thread broken)";case"tracked-debt":return"No proof: tracked as debt";case"backlog":return"No own proof: backlog altitude (not a silent gap)";default:return"No proof"}}function us(e){const t=Xe(),s=e.status==="GAP",i=e.status==="tracked-debt",r=e.status==="backlog",n=Ue(),a=i||r,o=Ge(e),c=ht(e),h=e.implementations.length===0,b=e.proofs.length===0,p=b&&(s||n),u=h&&ft(e),d=h?u?" lawful-absence":a?" missing-honest":" missing-impl":"",m=h?u?" carrier-lawful":a?" carrier-honest":" missing-carrier":"",A=p?" frayed":b&&a?" missing-honest":"",P=p?" frayed":b&&a?" carrier-honest":"",I=e.implementations.length===0?`<li class="empty${m}">${u?ve(e)?"no build mark · proof binds directly to intent":"no build mark · none claimed":r?"No own @covers (backlog altitude)":"No @covers found"}</li>`:e.implementations.map(g=>{const L=pe(g.path,g.line),q=z.has(L),Ae=gs(g.excerpt,e.id);return`
              <li>
                <button type="button" class="source-toggle" data-source-key="${S(L)}" data-source-path="${S(g.path)}" data-source-line="${g.line}" aria-expanded="${q}">
                  <span class="proof-caret">${q?"▾":"▸"}</span>
                  <code>${l(K(g.path))}:${g.line}</code>
                </button>
                <div class="path">${G(g.path,g.line,t,l)}</div>
                ${Ae.length?`<div class="excerpt">also covers: ${l(Ae.join(", "))}</div>`:""}
                ${q?ue(D.get(L)):""}
              </li>`}).join(""),M=e.carryingTasks??[],F=M.length===0?"":`<div class="debt-block">
        <div class="debt-label">Open debt (Carries:)</div>
        <ul class="hit-list debt-list">
          ${M.map(g=>`
            <li>
              <div class="path">${G(g.path,g.line,t,l)}</div>
              <div class="excerpt">${l(g.excerpt)}</div>
            </li>`).join("")}
        </ul>
      </div>`,oe=c==="coverage-proven"&&!n?(()=>{const g=mt(e);return`<li class="coverage-proven"><code>${l(K(g.path))}:${g.line}</code><div class="path">Covered by ${G(g.path,g.line,t,l)}: no test required for this type</div></li>`})():e.proofs.length===0?`<li class="empty${P}">${l(n&&!s?"Golden Thread broken":i&&M.length>0?"No proof: tracked as open debt (see above)":ps(e.status))}</li>`:e.proofs.map(g=>{const L=pe(g.path,g.line),q=z.has(L);return`
              <li>
                <button type="button" class="source-toggle" data-source-key="${S(L)}" data-source-path="${S(g.path)}" data-source-line="${g.line}" aria-expanded="${q}">
                  <span class="proof-caret">${q?"▾":"▸"}</span>
                  <code>${l(g.name)}</code>
                </button>
                <div class="path">${G(g.path,g.line,t,l)}</div>
                ${q?ue(D.get(L)):""}
              </li>`}).join(""),C=e.registry??null;let J="";if(C){const g=pe(C.path,C.line),L=z.has(g),q=C.path.includes("/")||Fe(C.path,C.line,t)!==null;J=`
      <ul class="hit-list registry-list">
        <li>
          <button type="button" class="source-toggle" data-source-key="${S(g)}" data-source-path="${S(C.path)}" data-source-line="${C.line}" aria-expanded="${L}">
            <span class="proof-caret">${L?"▾":"▸"}</span>
            <code>${l(K(C.path))}:${C.line}</code>
          </button>
          ${q?`<div class="path">${G(C.path,C.line,t,l)}</div>`:""}
          ${L?ue(D.get(g)):""}
        </li>
      </ul>`}return`
    <div class="descent-head" data-design="descent-head">
      <button type="button" class="descent-back" data-descent-back title="Back to field">‹ Back to field</button>
    </div>
    <div class="thread${n?" gate-broken":""}" data-design="descent-thread" data-status="${e.status}">
      <svg class="thread-rail" aria-hidden="true"></svg>
      <article class="tier${fe(e.status)==="amber"?" debt":""}" data-design="tier-requirement" data-broken="false">
        <div class="tier-label">Intent</div>
        <div class="tier-id">${l(e.id)}</div>
        <div class="tier-body">${l(re(e.id,e.statement))}</div>
        ${J}
        <p class="meta" style="margin-top:0.6rem"><span class="badge ${e.status}">${l(e.status)}</span></p>
        ${o?'<p class="incoherence-note" data-design="incoherence-note">status claims proven; manifest lists no proof</p>':""}
        ${F}
      </article>
      <article class="tier${d}" data-design="tier-implementation" data-broken="false">
        <div class="tier-label">Build</div>
        <div class="tier-id">${l(e.id)}</div>
        <ul class="hit-list">${I}</ul>
      </article>
      <article class="tier${A}" data-design="tier-proof" data-broken="${p?"true":"false"}">
        <div class="tier-label">Proof</div>
        <div class="tier-id">${l(e.id)}</div>
        <ul class="hit-list">${oe}</ul>
      </article>
    </div>
  `}function st(e,t,s,i,r,n=!1){const o=B*(r===0?1:-1),c=n?i:-i,h=t+(s-t)*.33,b=t+(s-t)*.67,p=e+c+o,u=e+c-o;return`M ${e} ${t} C ${p} ${h} ${u} ${b} ${e} ${s}`}function fs(e,t,s,i,r=!1){const n=Math.sign(s-t)||1,a=s-t;let o=t+a*.5,c=o+n*le;const h=s-n*18;n>0?(c=Math.min(c,h),o=Math.min(o,c-n*le)):(c=Math.max(c,h),o=Math.max(o,c-n*le));const b=t+(o-t)*.55,p=r?i:-i,u=`M ${e} ${t} C ${e+p+B} ${b} ${e+p+B*.35} ${t+(o-t)*.85} ${e+B*.4} ${o}`,d=`M ${e} ${t} C ${e+p-B} ${b} ${e+p-B*.35} ${t+(c-t)*.85} ${e-B*.4} ${c}`;return{short:u,long:d}}function ge(){const e=f.querySelector(".thread"),t=e?.querySelector(".thread-rail");if(!e||!t)return;const s=[...e.querySelectorAll(":scope > .tier")];if(s.length<2){t.replaceChildren();return}const i=parseFloat(getComputedStyle(document.documentElement).fontSize)||16,r=s.map(u=>({x:u.offsetLeft-.95*i+4.5,y:u.offsetTop+1.1*i+4.5,top:u.offsetTop,bottom:u.offsetTop+u.offsetHeight,broken:u.getAttribute("data-broken")==="true"})),n=Math.max(e.clientWidth,48),a=Math.max(e.scrollHeight,1),o=O+6,c=O+8;t.style.left=`${-o}px`,t.style.width=`${n+o+c}px`,t.style.height=`${a}px`,t.setAttribute("width",String(n+o+c)),t.setAttribute("height",String(a)),t.setAttribute("viewBox",`${-o} 0 ${n+o+c} ${a}`);const h="http://www.w3.org/2000/svg",b=document.createDocumentFragment(),p=r.length-2;for(let u=0;u<r.length-1;u++){const d=r[u],m=r[u+1],A=d.broken||m.broken,P=A&&u===p,I=document.createElementNS(h,"g");if(I.classList.add("seg",A?"seg-frayed":"seg-braid"),P&&I.classList.add("seg-reflect"),I.setAttribute("data-seg",String(u)),A){const M=d.broken&&!m.broken,F=M?m:d,oe=M?d:m,{short:C,long:J}=fs(d.x,F.y,oe.y,O,P),g=document.createElementNS(h,"path");g.setAttribute("d",C),g.classList.add("strand","strand-die","strand-short");const L=document.createElementNS(h,"path");L.setAttribute("d",J),L.classList.add("strand","strand-die","strand-long"),I.appendChild(g),I.appendChild(L)}else for(const M of[0,1]){const F=document.createElementNS(h,"path");F.setAttribute("d",st(d.x,d.y,m.y,O,M)),F.classList.add("strand",M===0?"strand-a":"strand-b"),I.appendChild(F)}b.appendChild(I)}t.replaceChildren(b)}function nt(){const e=f.querySelector(".ghost-thread"),t=e?.querySelector(".ghost-rail");if(!e||!t)return;const s=[...e.querySelectorAll(":scope > .tier")];let i=-1;for(const u of s){if(u.getAttribute("data-present")!=="true")break;i+=1}if(i<1){t.replaceChildren();return}const r=parseFloat(getComputedStyle(document.documentElement).fontSize)||16,n=s.slice(0,i+1).map(u=>({x:u.offsetLeft-.95*r+4.5,y:u.offsetTop+1.1*r+4.5})),a=Math.max(e.clientWidth,48),o=Math.max(e.scrollHeight,1),c=O+6,h=O+8;t.style.left=`${-c}px`,t.style.width=`${a+c+h}px`,t.style.height=`${o}px`,t.setAttribute("width",String(a+c+h)),t.setAttribute("height",String(o)),t.setAttribute("viewBox",`${-c} 0 ${a+c+h} ${o}`);const b="http://www.w3.org/2000/svg",p=document.createDocumentFragment();for(let u=0;u<n.length-1;u++){const d=n[u],m=n[u+1],A=document.createElementNS(b,"path");A.setAttribute("d",st(d.x,d.y,m.y,O,0)),A.classList.add("ghost-strand"),p.appendChild(A)}t.replaceChildren(p)}function ue(e){if(!e)return'<div class="proof-source proof-source-loading">Loading source…</div>';if("error"in e)return`<div class="proof-source ${e.info?"proof-source-info":"proof-source-error"}">${l(e.error)}</div>`;const t=e.lines.map(s=>`<div class="src-line${s.isTarget?" src-line-target":""}"><span class="src-n">${s.n}</span><span class="src-text">${l(s.text)}</span></div>`).join("");return`
    <div class="proof-source">
      <div class="proof-source-path">${l(e.path)} · lines ${e.startLine}–${e.endLine} of ${e.totalLines}</div>
      <div class="proof-source-code">${t}</div>
    </div>
  `}async function hs(e,t,s){if(v){if(!Ot()){D.set(e,{info:!0,error:"Source peek is off for artifacts you load yourself — nothing from this file leaves your machine. Run Loupe locally against the repository to read source in place."}),k();return}try{const i=`/api/source?repoPath=${encodeURIComponent(v.repoPath)}&path=${encodeURIComponent(t)}&line=${s}`,r=await fetch(i);r.headers.get("content-type")?.includes("application/json")?D.set(e,await r.json()):D.set(e,{info:!0,error:"This hosted demo reads the trace-manifest only. The source line above is shown in full when Loupe runs locally against the repository."})}catch(i){const r=i instanceof TypeError;D.set(e,{error:r?"Can't reach the Loupe dev server, so source can't be read from disk. Restart it (`npm run viz:dev` in loupe) and reload this page.":String(i)})}k()}}const ms=/(?:FR|NFR|AC|US)-[A-Z][A-Z0-9]{1,5}-[0-9]{2,}[a-z]?/g;function K(e){const t=e.lastIndexOf("/");return t===-1?e:e.slice(t+1)}function gs(e,t){const s=e.match(ms)??[];return[...new Set(s)].filter(i=>i!==t)}function Se(e,t){const s=e.replace(/\s+/g," ").trim();return s.length<=t?s:`${s.slice(0,t-1)}…`}function re(e,t){const s=t.replace(/\*\*/g,""),i=e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return s.replace(new RegExp(`^\\s*${i}\\s*[—:–-]\\s*`),"").trim()}function l(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function S(e){return l(e).replaceAll("'","&#39;")}Vt();

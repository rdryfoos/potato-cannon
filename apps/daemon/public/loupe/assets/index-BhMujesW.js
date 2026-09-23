(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&n(c)}).observe(document,{childList:!0,subtree:!0});function s(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(a){if(a.ep)return;a.ep=!0;const i=s(a);fetch(a.href,i)}})();const nt=[3,4,5];function at(e){return typeof e=="number"&&nt.includes(e)}function it(e){const t=e??{},s=Array.isArray(t.rows)?t.rows.map(ot):[];return{...t,rows:s}}function ot(e){const t=e??{},s=t.carryingTasks??t.debtTasks??[],{debtTasks:n,...a}=t,i=t.origin,c=t.registry??((i==null?void 0:i.kind)==="registry-line"&&i.path?{path:i.path,line:i.line??0}:t.registry),o=lt(typeof t.id=="string"?t.id:"");return{...a,carryingTasks:s,area:o,...c!==void 0?{registry:c}:{}}}const rt=/^(?:FR|NFR|AC|US)-([A-Z][A-Z0-9]{1,5})-[0-9]{2,}[a-z]?$/;function lt(e){const t=rt.exec(e);return t?t[1]:"Unclassified"}function qe(e){const t=[{key:"area",label:"Area",groupOf:n=>n.area}];return e.rows.some(n=>{var a;return(((a=n.parents)==null?void 0:a.length)??0)>0})&&t.push({key:"user-story",label:"User story",groupOf:n=>n.parents&&n.parents.length>0?n.parents[0]:null}),t}function ct(e,t){const s=new Map;for(const n of e){const a=t.groupOf(n);if(a===null)continue;const i=s.get(a);i?i.push(n):s.set(a,[n])}return[...s.entries()].map(([n,a])=>({key:n,label:n,rows:a,counts:te(a)}))}function te(e){const t={proven:0,"tracked-debt":0,backlog:0,GAP:0};for(const s of e)t[s.status]++;return t}function De(e){switch(e){case"proven":return"green";case"tracked-debt":return"amber";case"backlog":return"blue";case"GAP":return"red"}}function dt(e,t){var s;if(t)return(s=e.find(n=>n.id===t))==null?void 0:s.id}function pt(e){return`
    <section class="descent-pane" data-design="descent-pane">
      <h2 class="pane-title">Thread</h2>
      ${e}
    </section>
    `}function me(e){return e.tier?e.tier==="criterion":e.type==="AC"}function Ge(e){return e.status==="proven"&&me(e)&&e.proofs.length===0}function ut(e){return e.status==="proven"&&e.implementations.length===0&&!Ge(e)}function ft(e){return e.proofs.length>0?"execution-verified":e.status==="proven"&&!me(e)&&e.implementations.length>0?"coverage-proven":"no-proof"}function ht(e){const t=e.implementations[0];return t?{path:t.path.replace(/^\.\//,""),line:t.line}:null}function mt(){return{label:"Own proofs",title:"Direct test proofs on this row's own ID; a proven row can read 0 here when it's proven via a covered implementation or transitively through its children -- the Status badge is the row's real verdict, this column is narrower than that."}}function gt(e){const t=new Map;for(const d of e)t.set(d.id,d);const s=new Map;for(const d of e)d.type==="US"&&s.set(d.id,d);function n(d){var N;const v=new Set;let $=d;for(;$&&(((N=$.parents)==null?void 0:N.length)??0)>0;){const p=$.parents.find(u=>t.has(u));if(!p||v.has(p))return null;if(v.add(p),s.has(p))return p;$=t.get(p)}return null}const a=new Map;for(const d of e){if(d.type==="US")continue;const v=n(d);if(!v)continue;const $=a.get(v);$?$.push(d):a.set(v,[d])}const i=new Set,c=(d,v)=>d.id.localeCompare(v.id),o=[...a.entries()].sort(([d],[v])=>d.localeCompare(v)).map(([d,v])=>{i.add(d);for(const N of v)i.add(N.id);const $=v.slice().sort(c);return{key:d,label:s.get(d).statement,rows:$,counts:te($)}}),r=e.filter(d=>!i.has(d.id)),g=new Map,S=[];for(const d of r)if(d.area&&d.area!=="Unclassified"){const v=g.get(d.area);v?v.push(d):g.set(d.area,[d])}else S.push(d);const h=[...g.entries()].sort(([d],[v])=>d.localeCompare(v)).map(([d,v])=>{const $=v.slice().sort(c);return{key:d,label:d,rows:$,counts:te($)}}),f=S.length===0?[]:[{key:"unparented",label:"Unparented",rows:S.slice().sort(c),counts:te(S)}];return[...o,...h,...f]}function vt(e){if(!e||typeof e!="object")return"unknown";const t=e;if(at(t.schemaVersion)&&Array.isArray(t.rows))return"trace-manifest";const s=t.rows??t.candidates??t.proposedRows,n=Array.isArray(s)&&s.length>0?s[0]:null,a=!!n&&("rowId"in n||"epistemicClass"in n||"candidateParent"in n||"typeGuess"in n);return Array.isArray(s)&&(typeof t.generatorVersion=="string"||typeof t.generator=="string"||Array.isArray(t.honestLimits)||a)?"dig-report":(typeof t.formatVersion=="string"||typeof t.formatVersion=="number")&&("events"in t||"pricedEvents"in t||"resolvedRepo"in t)?"cost-cube":"unknown"}function bt(e){const t=e??{},s=t.provenance??t.source??{},n=typeof s.testName=="string"?s.testName:void 0,a=typeof t.statement=="string"?t.statement:"",i=typeof t.label=="string"&&t.label||typeof t.candidateLabel=="string"&&t.candidateLabel||typeof t.id=="string"&&t.id||typeof t.candidateId=="string"&&t.candidateId||n||a.slice(0,40)||"(unlabeled)",o=(Array.isArray(t.candidateParent)?t.candidateParent:[]).map(f=>{const d=f??{};return{parentRowId:typeof d.parentRowId=="string"?d.parentRowId:null,basis:typeof d.basis=="string"?d.basis:""}}),r=t.candidateProof,g=r?{test:typeof r.test=="string"&&r.test||typeof r.testName=="string"&&r.testName||"",file:typeof r.file=="string"?r.file:"",line:r.line!==void 0&&r.line!==null?String(r.line):"",basis:typeof r.basis=="string"?r.basis:""}:(s.source==="test"||s.sourceKind==="test"||s.kind==="test")&&(s.testName||s.test)?{test:s.testName||s.test||"",file:s.file||s.path||"",line:"",basis:"same-artifact"}:null,h=(Array.isArray(t.candidateBuild)?t.candidateBuild:t.candidateBuild&&typeof t.candidateBuild=="object"?[t.candidateBuild]:[]).map(f=>{const d=f??{},v=d.provenance??{};return{file:typeof d.file=="string"?d.file:"",line:d.line!==void 0&&d.line!==null?String(d.line):"",type:typeof d.importedType=="string"&&d.importedType||typeof d.type=="string"&&d.type||typeof d.method=="string"&&d.method||"",provenanceFile:typeof v.file=="string"?v.file:"",provenanceLine:v.line!==void 0&&v.line!==null?String(v.line):"",basis:typeof d.basis=="string"?d.basis:""}});return{rowId:typeof t.rowId=="string"?t.rowId:null,label:i,statement:a,typeGuess:(typeof t.typeGuess=="string"&&t.typeGuess||typeof t.type=="string"&&t.type||"?").toUpperCase(),epistemicClass:typeof t.epistemicClass=="string"&&t.epistemicClass||typeof t.epistemic=="string"&&t.epistemic||"inferred",confidence:typeof t.confidence=="string"&&t.confidence||typeof t.confidenceSignal=="string"&&t.confidenceSignal||null,suggestedArea:typeof t.suggestedArea=="string"&&t.suggestedArea||typeof t.area=="string"&&t.area||null,provenance:s,candidateParent:o,candidateProof:g,candidateBuild:h,gap:t.gap===!0?!0:t.gap==="partial"?"partial":null}}function yt(e){const t=e??{};return{rows:(Array.isArray(t.rows)&&t.rows||Array.isArray(t.candidates)&&t.candidates||Array.isArray(t.proposedRows)&&t.proposedRows||[]).map(bt),generatorVersion:typeof t.generatorVersion=="string"&&t.generatorVersion||typeof t.generator=="string"&&t.generator||"?",sourceRepoPath:typeof t.sourceRepoPath=="string"&&t.sourceRepoPath||typeof t.sourceRepo=="string"&&t.sourceRepo||typeof t.repo=="string"&&t.repo||"?",generatedAt:typeof t.generatedAt=="string"&&t.generatedAt||"?",sourceCommit:typeof t.sourceCommit=="string"&&t.sourceCommit||typeof t.commit=="string"&&t.commit||"",honestLimits:Array.isArray(t.honestLimits)?t.honestLimits.filter(n=>typeof n=="string"):[]}}function $t(e){const t=new Map;for(const h of e)h.rowId&&t.set(h.rowId,h);const s=new Map;for(const h of e){const f=h.candidateParent[0],d=f==null?void 0:f.parentRowId;if(!d||!t.has(d)||d===h.rowId)continue;const v=s.get(d);v?v.push(h):s.set(d,[h])}const n=new Set,a=(h,f)=>h.label.localeCompare(f.label),i=[...s.entries()].sort(([h],[f])=>h.localeCompare(f)).map(([h,f])=>{n.add(h);for(const d of f)d.rowId&&n.add(d.rowId);return{key:h,label:t.get(h).label,rows:f.slice().sort(a)}}),c=e.filter(h=>!h.rowId||!n.has(h.rowId)),o=new Map,r=[];for(const h of c)if(h.suggestedArea){const f=o.get(h.suggestedArea);f?f.push(h):o.set(h.suggestedArea,[h])}else r.push(h);const g=[...o.entries()].sort(([h],[f])=>h.localeCompare(f)).map(([h,f])=>({key:h,label:h,rows:f.slice().sort(a)})),S=r.length===0?[]:[{key:"unparented",label:"no proposed parent",rows:r.slice().sort(a)}];return[...i,...g,...S]}function wt(e){if(!e||typeof e!="object")return"—";const t=typeof e.sourceKind=="string"&&e.sourceKind||typeof e.kind=="string"&&e.kind||typeof e.source=="string"&&e.source||"",s=typeof e.file=="string"&&e.file||typeof e.path=="string"&&e.path||"",n=e.line??e.lineRange??e.lines,a=n!=null?String(n):"",i=typeof e.testName=="string"&&e.testName||typeof e.test=="string"&&e.test||"",c=[t,s+(a?":"+a:""),i?"test: "+i:""].filter(Boolean);return c.length?c.join(" · "):"—"}const St=/^(?:https?:\/\/)?((?:[\w-]+\.)+[a-z]{2,}\/[\w.-]+\/[\w.-]+?)\/?$/i;function Ae(e){const t=e??{},s=typeof t.sourceRepoPath=="string"&&t.sourceRepoPath||typeof t.repoPath=="string"&&t.repoPath||"",n=typeof t.sourceCommit=="string"&&t.sourceCommit||typeof t.commit=="string"&&t.commit||null,a=St.exec(s.trim());return{remote:a?`https://${a[1]}`:null,commit:n||null}}function Fe(e,t,s){if(!s.remote||!e)return null;const n=e.replace(/^\.\//,"").replace(/^\//,""),a=t==null||t===""?"":String(t),i=a&&/^\d+$/.test(a)?`#L${a}`:"";return`${s.remote}/blob/${s.commit||"main"}/${n}${i}`}function j(e,t,s,n,a={}){const i=t==null||t===""?"":String(t),c=`${a.prefix??""}${e}${i?`:${i}`:""}`,o=Fe(e,t,s);return o?`<a class="src-link" href="${n(o)}" target="_blank" rel="noopener">${n(c)}</a>`:n(c)}const At="retired";function ge(e){return e.status===At}function Be(e){const t=e.parents;if(t&&t.length>0)return t.filter(n=>typeof n=="string"&&n);const s=e.parent;return typeof s=="string"&&s?[s]:[]}function kt(e){return e.some(t=>Be(t).length>0)}const Lt={US:"intent",FR:"requirement",NFR:"requirement",AC:"criterion"};function ue(e){return e.tier?e.tier:Lt[e.type]??"criterion"}const Ct={intent:"intent",requirement:"requirement",criterion:"criterion"};function Et(e){var t;return e.implementations.length>0||e.proofs.length>0||(((t=e.carryingTasks)==null?void 0:t.length)??0)>0}function Rt(e){const t=e.implementations.length>0,s=e.proofs.length>0;return t&&s?"full":t?"claim":s?"uncovered":"none"}function Pt(e){const t=new Map;for(const c of e)t.set(c.id,c);const s=new Map,n=[];for(const c of e){const o=Be(c).find(g=>t.has(g)&&g!==c.id);if(o===void 0){n.push(c);continue}const r=s.get(o);r?r.push(c.id):s.set(o,[c.id])}const a=new Set,i=(c,o)=>{a.add(c.id);const r=(s.get(c.id)??[]).filter(g=>!a.has(g)).map(g=>t.get(g)).sort(Le);return{row:c,tier:ue(c),depth:o,children:r.map(g=>i(g,o+1))}};return n.sort(Le).map(c=>i(c,0))}const ke={intent:0,requirement:1,criterion:2};function Le(e,t){const s=ke[ue(e)]-ke[ue(t)];return s!==0?s:e.id.localeCompare(t.id)}function je(e){return ge(e.row)||e.row.status==="backlog"?!1:Et(e.row)||e.children.some(je)}const Ce={red:0,amber:1,green:2,blue:3,grey:4};function Oe(e){if(ge(e.row))return"grey";const t=e.children.filter(je);if(t.length===0)return e.children.length>0?"blue":De(e.row.status);let s="blue";for(const n of t){const a=Oe(n);Ce[a]<Ce[s]&&(s=a)}return s}function xt(e){let t=0,s=0;const n=a=>{for(const i of a.children)ge(i.row)?s+=1:i.row.status==="backlog"&&(t+=1),n(i)};return n(e),{planned:t,retired:s}}function Tt(e){return e===!0?"passed":"proof named"}function It(e){return{buildEarned:!!(e.implementations&&e.implementations.length>0),proofEarned:!!(e.proofs&&e.proofs.length>0)}}function Nt(e){return e.statement.replace(/^\S+\s+—\s*/,"")}function Mt(e,t,s,n=78,a=""){const{buildEarned:i}=It(e),c=Nt(e),o=t/2;let r;return e.status==="proven"?r=`<path d="M${o} 8 C ${o-2} 30, ${o+2} 52, ${o} 72" stroke="#e8bd52" stroke-width="1.4" fill="none" opacity=".85"/><circle cx="${o}" cy="8" r="2.5" fill="#219653"/><circle cx="${o}" cy="40" r="2.5" fill="#219653"/><circle cx="${o}" cy="72" r="2.5" fill="#219653"/>`:e.status==="tracked-debt"?r=`<path d="M${o} 8 C ${o-2} 30, ${o+2} 52, ${o} 72" stroke="#e8bd52" stroke-width="1.4" fill="none" opacity=".8"/><circle cx="${o}" cy="8" r="2.5" fill="#219653"/><circle cx="${o}" cy="40" r="2.5" fill="#c9903a"/><circle cx="${o}" cy="72" r="2.5" fill="none" stroke="#c9903a" stroke-width="1.2"/>`:e.status==="backlog"?r=`<path d="M${o} 8 L ${o} 22" stroke="#e8bd52" stroke-width="1.4" opacity=".8"/><path d="M${o} 22 C ${o-2} 34, ${o+2} 42, ${o-1} 50" stroke="#e8bd52" stroke-width="1" fill="none" opacity=".3" stroke-dasharray="2 3"/><circle cx="${o}" cy="8" r="2.5" fill="#9ed4ff"/>`:r=i?`<path d="M${o} 8 C ${o-2} 30, ${o+2} 52, ${o} 72" stroke="#7d8894" stroke-width="1.4" fill="none" opacity=".6"/><circle cx="${o}" cy="8" r="2.5" fill="#7d8894"/><circle cx="${o}" cy="40" r="2.5" fill="#219653"/><circle cx="${o}" cy="72" r="2.5" fill="#eb5757"/>`:`<path d="M${o} 8 C ${o-2} 24, ${o+2} 32, ${o} 40" stroke="#7d8894" stroke-width="1.4" fill="none" opacity=".6"/><circle cx="${o}" cy="8" r="2.5" fill="#7d8894"/><circle cx="${o}" cy="40" r="2.5" fill="#eb5757"/>`,`<button type="button" class="${a?`strand ${a}`:"strand"}" data-id="${s(e.id)}" title="${s(e.id)} · ${s(e.status)} · ${s(c)}"><svg width="${t}" height="${n}" viewBox="0 0 ${t} 78" xmlns="http://www.w3.org/2000/svg">${r}</svg></button>`}const qt=13,Dt=8,Gt=30,Ft=78,m=document.querySelector("#app"),V='<span class="brand-accent">Loupe</span>',z=11,O=3.6,re=10,_e=[{key:"backlog",label:"Backlog"},{key:"tracked-debt",label:"Tracked debt"},{key:"proven",label:"Proven"},{key:"GAP",label:"GAP"}];function q(e){return(y==null?void 0:y.statusCounts[e])??0}function Bt(){return y!=null&&y.gate?y.gate.ok:q("GAP")===0}function ze(){return!Bt()}const Ee={1:"READ",2:"SCAN",3:"SKYLINE"};function ee(e){return Math.min(3,Math.max(1,e))}let y=null,k=null,W=null,ve="same-origin";function jt(){return ve==="same-origin"}let w=null,T=!1,I="list",L="all",M="",X=null,_=!1,x=2,Ue=!1,K=null,He=null;function Ot(){return!y||!X?null:qe(y).find(e=>e.key===X)??null}const H=new Set,G=new Map,se="loupe.paneSplit",Re="clewloupe.paneSplit",Ve=.2,Ke=.8;let U=_t();function _t(){let e=window.localStorage.getItem(se);if(e===null){const s=window.localStorage.getItem(Re);s!==null&&(window.localStorage.setItem(se,s),window.localStorage.removeItem(Re),e=s)}const t=Number(e??NaN);return Number.isFinite(t)&&t>=Ve&&t<=Ke?t:null}const zt=960;function Y(){const e=m.querySelector(".layout");if(e){if(U===null||window.innerWidth<=zt){e.style.removeProperty("grid-template-columns");return}e.style.gridTemplateColumns=`minmax(0, ${U}fr) 6px minmax(280px, ${1-U}fr)`}}let le=!1;function We(){le||(le=!0,requestAnimationFrame(()=>{le=!1,he(),st()}))}const ce=new ResizeObserver(We);function fe(){ce.disconnect();const e=m.querySelector(".thread, .ghost-thread");e&&(ce.observe(e),e.querySelectorAll(":scope > .tier").forEach(t=>ce.observe(t)))}function Ze(){return k?Ae({sourceRepoPath:k.sourceRepoPath,sourceCommit:k.sourceCommit}):y?Ae(y):{remote:null,commit:null}}function de(e,t){return`${e}:${t}`}function J(e){return`<p class="footnote">${e}${ve==="user-file"?" Loaded from your machine: nothing in this file was sent anywhere.":""}</p>`}function be(){return`
        <div class="topbar-actions">
          <button type="button" class="load-manifest" id="loadManifest">Load Manifest…</button>
          <input type="file" id="manifestFile" accept="application/json,.json" hidden />
          <button type="button" class="load-manifest" id="loadDig">Load dig…</button>
          <input type="file" id="digFile" accept="application/json,.json" hidden />
        </div>`}function Xe(){return`
        <div class="lens-tabs" data-design="lens-tabs">
          <button type="button" class="lens-tab${I==="list"?" active":""}" data-lens="list">List</button>
          <button type="button" class="lens-tab${I==="map"?" active":""}" data-lens="map">Map</button>
          <button type="button" class="lens-tab${I==="descent"?" active":""}" data-lens="descent" title="Walk the rail: objective, intent, build, proof">Descent</button>
          ${I==="map"?Ut():""}
        </div>`}function Ut(){return`
          <div class="zoom-control" data-design="zoom-control">
            <button type="button" class="zoom-btn" data-zoom-out title="Zoom out (more density)">−</button>
            <span class="zoom-level" title="Map zoom: ${Ee[x]}">${Ee[x]}</span>
            <button type="button" class="zoom-btn" data-zoom-in title="Zoom in (more detail)">+</button>
          </div>`}async function Ht(){const e=new URLSearchParams(location.search).get("manifest")??"/trace-manifest.json",t=await fetch(e).catch(()=>null);if(!t||!t.ok){const r=t?`HTTP ${t.status}`:"fetch failed: for a cross-origin URL, the host must allow CORS";m.innerHTML=`<main class="topbar"><div><h1 class="brand">${V}</h1><p class="meta">Could not load ${l(e)} (${r}). Expected a trace-manifest.json (see samples/), or pass ?manifest=&lt;url&gt;.</p></div></main>`;return}const s=await t.json().catch(()=>null);if(!s){m.innerHTML=`<main class="topbar"><div><h1 class="brand">${V}</h1><p class="meta">Not JSON: ${l(e)}.</p></div></main>`;return}let n="remote-url";try{new URL(e,location.href).origin===location.origin&&(n="same-origin")}catch{n="remote-url"}const a=et(s,n);if(a.kind==="unknown"){m.innerHTML=`<main class="topbar"><div><h1 class="brand">${V}</h1><p class="meta">${l(a.message??"Not a supported artifact.")}</p></div></main>`;return}const i=new URLSearchParams(location.search);Ue=i.get("embed")==="1";const c=i.get("ids");if(c){const r=c.split(",").map(g=>g.trim()).filter(Boolean);r.length>0&&(K=new Set(r))}He=i.get("title");const o=i.get("lens");if((o==="descent"||o==="list"||o==="map")&&(I=o),y){const r=dt(y.rows,i.get("id"));w=r??null,T=!!r}R(),window.addEventListener("resize",()=>{Y(),We()}),document.addEventListener("keydown",r=>{r.key==="Escape"&&(w||T)&&(w=null,T=!1,R())})}function Q(){if(!y)return[];const e=M.trim().toLowerCase();return y.rows.filter(t=>K===null||K.has(t.id)).filter(t=>e?t.id.toLowerCase().includes(e)||t.statement.toLowerCase().includes(e)||t.status.toLowerCase().includes(e):!0).filter(t=>L==="all"||t.status===L)}function Vt(){if(!w)return;Q().some(t=>t.id===w)||(w=null,T=!1)}function Ye(){const e={window:{x:window.scrollX,y:window.scrollY}},t=m.querySelector(".table-wrap");t&&(e.table={top:t.scrollTop,left:t.scrollLeft});const s=m.querySelector(".field");return s&&(e.field={top:s.scrollTop}),e}function ne(e){if(e.table){const t=m.querySelector(".table-wrap");t&&(t.scrollTop=e.table.top,t.scrollLeft=e.table.left)}if(e.field){const t=m.querySelector(".field");t&&(t.scrollTop=e.field.top)}e.window&&window.scrollTo(e.window.x,e.window.y)}function R(e={}){if(W){Kt();return}if(k){cs(e);return}y&&Wt(e)}function Kt(){m.innerHTML=`
    <header class="topbar" data-design="topbar">
      <div>
        <h1 class="brand">${V}</h1>
        ${be()}
      </div>
    </header>
    <main class="cube-refusal" data-design="cube-refusal">
      <p class="cube-refusal-message">${l(W??"")}</p>
    </main>
  `,ae()}function Wt(e={}){var c,o;if(!y)return;Vt();const t=T?y.rows.find(r=>r.id===w)??null:null,s=ze(),n=((o=(c=y.gate)==null?void 0:c.failures)==null?void 0:o.length)??0,a=e.resetMatrixScroll?null:Ye(),i=`
        ${t?ps(t):Zt()}
        ${J("Reads trace-manifest.json only; no target re-scan: this readout is the emitter's, not re-derived here.")}
  `;if(Ue){m.innerHTML=pt(I==="descent"?xe():i),ae(),fe(),requestAnimationFrame(()=>he());return}m.innerHTML=`
    <header class="topbar${s?" gate-failed":""}" data-design="topbar">
      <div>
        <h1 class="brand">${V}</h1>
        <p class="meta">${l(y.targetName)} · manifest ${l(y.generatedAt)} · schema v${y.schemaVersion}</p>
        ${s?`<p class="gate-banner" data-design="gate-banner" title="Gate refused this manifest">Golden Thread broken${n?` · ${n} ${n===1?"refusal":"refusals"}`:""}</p>`:'<p class="gate-ok-meta" title="Gate accepted this manifest">Golden Thread intact</p>'}
        ${be()}
      </div>
      <div class="stats" data-design="stats">
        <button type="button" class="stat${L==="all"&&!M.trim()?" active":""}" data-stat-filter="all" title="Show all rows">
          <div class="n">${y.rows.length}</div><div class="l">Rows</div>
        </button>
        <button type="button" class="stat${L==="backlog"&&!M.trim()?" active":""}" data-stat-filter="backlog" title="Show backlog rows">
          <div class="n">${q("backlog")}</div><div class="l">Backlog</div>
        </button>
        <button type="button" class="stat${L==="tracked-debt"&&!M.trim()?" active":""}" data-stat-filter="tracked-debt" title="Show tracked-debt rows">
          <div class="n">${q("tracked-debt")}</div><div class="l">Debt</div>
        </button>
        <button type="button" class="stat${L==="proven"&&!M.trim()?" active":""}" data-stat-filter="proven" title="Show proven rows">
          <div class="n">${q("proven")}</div><div class="l">Proven</div>
        </button>
        <button type="button" class="stat${q("GAP")>0?" stat-gap-hot":""}${L==="GAP"&&!M.trim()?" active":""}" data-stat-filter="GAP" title="Show GAP rows">
          <div class="n">${q("GAP")}</div><div class="l">GAP</div>
        </button>
      </div>
    </header>
    <div class="layout">
      <section class="matrix-pane" data-design="matrix-pane" tabindex="0">
        <h2 class="pane-title">Traceability matrix</h2>
        ${Xe()}
        <div class="toolbar" data-design="toolbar">
          <input id="q" type="search" placeholder="Filter by ID or statement…" value="${C(M)}" />
          <select id="status">
            <option value="all"${L==="all"?" selected":""}>All statuses</option>
            ${_e.map(({key:r,label:g})=>`<option value="${r}"${L===r?" selected":""}>${g}</option>`).join(`
            `)}
          </select>
          <!-- @covers FR-ROLL-10: sibling gesture beside find/filter, no apply step -->
          <select id="rollup" title="Roll the descent up by a dimension">
            <option value=""${X===null?" selected":""}>No rollup</option>
            ${qe(y).map(r=>`<option value="${C(r.key)}"${X===r.key?" selected":""}>By ${l(r.label)}</option>`).join(`
            `)}
          </select>
        </div>
        ${I==="map"?Qt():I==="descent"?xe():Jt()}
      </section>
      <div class="pane-divider" data-design="pane-divider" role="separator" aria-orientation="vertical" title="Drag to resize; double-click to reset"></div>
      <section class="descent-pane" data-design="descent-pane">
        <h2 class="pane-title">Thread</h2>
        ${i}
      </section>
    </div>
  `,ae(),Y(),fe(),a&&(ne(a),requestAnimationFrame(()=>{ne(a),he()}))}function Zt(){const e=Q();if(e.length===0){const i=L!=="all"?ie(L,q(L)):{title:"No matching rows",body:"Try clearing the search filter."};return`<p class="descent-empty"><strong>${l(i.title)}</strong><br>${l(i.body)}</p>`}const t=_?qt:Dt,s=_?Ft:Gt,n=e.map(i=>Mt(i,t,l,s,i.id===w?"cross-pinned":"")).join(""),a=_?'<button type="button" class="field-expand-toggle" data-field-expand-toggle title="Collapse to a compact summary">collapse</button>':'<button type="button" class="field-expand-toggle" data-field-expand-toggle title="Expand to the full census">expand</button>';return`
      <div class="field-wrap${_?"":" field-wrap-compact"}" data-design="field-wrap">
        <div class="field-head" data-design="field-head">${e.length} thread${e.length===1?"":"s"}${a}</div>
        <div class="field${_?"":" field-compact"}" data-design="field">${n}</div>
      </div>
  `}function Pe(e){return`
                <tr class="status-${e.status}${T&&e.id===w?" selected":""}${e.id===w?" cross-pinned":""}" data-id="${C(e.id)}">
                  <td class="id">${l(e.id)}</td>
                  <td><span class="badge ${e.status}">${l(e.status)}</span></td>
                  <td class="statement">${l(we(oe(e.id,e.statement),140))}</td>
                  <td>${e.proofs.length}</td>
                </tr>`}function Je(e){return _e.map(({key:t,label:s})=>e[t]>0?`<span class="badge ${t}" title="${C(s)}">${e[t]} ${l(s)}</span>`:"").filter(Boolean).join(" ")}function xe(){var o;if(!y)return"";const e=Q(),t=((o=y.gate)==null?void 0:o.executionVerified)===!0,s=`
      <div class="rail-head" data-design="rail-head">
        <div class="rail-head-line">DESCENT · ${l(He??y.targetName)}${K?` · ${K.size} id${K.size===1?"":"s"} on this card`:""} · manifest ${l(y.generatedAt)}</div>
        <div class="rail-head-flag rail-flag-${t?"on":"off"}" title="${C(t?"gate.executionVerified: proven was derived from a passing test-results report":"gate.executionVerified is false: proven was derived by name matching, with no test-results report read")}">${t?"execution verified":"execution not verified"}</div>
      </div>
      <div class="rail-objective" data-design="rail-objective">
        <span class="dn-level-tag">OBJECTIVE</span>
        <span class="rail-objective-none">no objective declared in this manifest</span>
      </div>`;if(e.length===0){const r=L==="all"?{title:"No matching rows",body:"Try clearing the search filter."}:ie(L,q(L));return`<div class="rail" data-design="rail">${s}
      <div class="table-empty" data-design="table-empty">
        <div class="table-empty-title">${l(r.title)}</div>
        <div class="table-empty-body">${l(r.body)}</div>
      </div></div>`}const n=Pt(e),i=!kt(e)?'<div class="rail-flat-note" data-design="rail-flat-note">this manifest declares no hierarchy</div>':"",c=n.map(r=>Qe(r,t)).join("");return`<div class="rail" data-design="rail">
      ${s}
      ${i}
      <div class="rail-body">${c}</div>
      ${Yt()}
      ${J("Reads trace-manifest.json only; no target re-scan. Edges are the file's own declared parents, never inferred from an ID family.")}
    </div>`}function Qe(e,t){const s=e.row,n=Oe(e),a=xt(e),i=[];a.planned>0&&i.push(`${a.planned} planned`),a.retired>0&&i.push(`${a.retired} retired`);const c=i.length?`<span class="dn-marks" title="Counted under this node, not coloured into it">${l(i.join(" · "))}</span>`:"",o=s.id===w?" cross-pinned":"";return`
      <div class="dn-group" style="--dn-depth:${e.depth}">
        <div class="dn dn-${n}${o}" data-id="${C(s.id)}" title="${C(`${s.id} · ${s.status}`)}">
          <span class="dn-dot dn-dot-${n}" aria-hidden="true"></span>
          <span class="dn-level-tag">INTENT</span>
          <span class="dn-id">${l(s.id)}</span>
          <span class="dn-tier">${l(Ct[e.tier])}</span>
          <span class="dn-statement">${l(we(oe(s.id,s.statement),150))}</span>
          ${c}
        </div>
        ${Xt(s,t)}
        ${e.children.map(r=>Qe(r,t)).join("")}
      </div>`}function Xt(e,t){const s=Rt(e);if(s==="none")return"";const n=Tt(t),a=e.implementations.length>0?`<div class="dn-ev dn-ev-build">
          <span class="dn-level-tag">BUILD</span>
          <span class="dn-ev-count">${e.implementations.length} mark${e.implementations.length===1?"":"s"}</span>
          <span class="dn-ev-detail">${l(e.implementations.map(c=>`${Z(c.path)}:${c.line}`).join(" · "))}</span>
        </div>`:`<div class="dn-ev dn-ev-nobuild">
          <span class="dn-level-tag">BUILD</span>
          <span class="dn-ev-absent">no file carries this id</span>
        </div>`,i=e.proofs.length>0?`<div class="dn-ev dn-ev-proof">
          <span class="dn-level-tag">PROOF</span>
          <span class="dn-ev-count">${e.proofs.length} ${e.proofs.length===1?"test":"tests"}, ${l(n)}</span>
          <span class="dn-ev-detail">${l(e.proofs.map(c=>c.name).join(" · "))}</span>
        </div>`:`<div class="dn-ev dn-ev-noproof">
          <span class="dn-level-tag">PROOF</span>
          <span class="dn-ev-absent">no proof yet</span>
        </div>`;return`<div class="dn-evidence dn-strand-${s}" data-design="dn-evidence">${a}${i}</div>`}function Yt(){const e=(y==null?void 0:y.retired)??[];return e.length===0?"":`<div class="rail-retired" data-design="rail-retired">
      <div class="rail-retired-head">RETIRED · ${e.length} withdrawn on purpose · not positioned on the rail</div>
      ${e.map(t=>`<div class="rail-retired-row"><span class="dn-id">${l(t.id)}</span><span class="dn-tier">${l(t.date??"")}</span><span class="dn-statement">${l(t.reason??"")}</span></div>`).join("")}
    </div>`}function Jt(){const e=Q(),t=Ot(),s=e.length===0?(()=>{const i=L==="all"?{title:"No matching rows",body:"Try clearing the search filter."}:ie(L,q(L));return`<div class="table-empty" data-design="table-empty">
            <div class="table-empty-title">${l(i.title)}</div>
            <div class="table-empty-body">${l(i.body)}</div>
          </div>`})():"",n=t?ct(e,t).map(i=>`
                <tr class="rollup-group-header" data-design="rollup-group-header">
                  <td colspan="4">
                    <span class="rollup-group-label">${l(i.label)}</span>
                    <span class="rollup-group-count">${i.rows.length}</span>
                    <span class="rollup-strip" data-design="rollup-strip">${Je(i.counts)}</span>
                  </td>
                </tr>${i.rows.map(Pe).join("")}`).join(""):e.map(Pe).join(""),a=mt();return`
        <div class="table-wrap">
          <table data-design="matrix-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Statement</th>
                <th title="${C(a.title)}">${l(a.label)}</th>
              </tr>
            </thead>
            <tbody>
              ${n}
            </tbody>
          </table>
          ${s}
        </div>
  `}function ie(e,t){if(t===0)switch(e){case"GAP":return{title:"No silent gaps",body:"Every AC in this run has proof or tracked debt."};case"tracked-debt":return{title:"No tracked debt",body:"Nothing in this run is deliberately deferred."};case"backlog":return{title:"No bare backlog",body:"Every US/FR/NFR here has its own build or proof, or is tracked as debt."};default:return{title:"Nothing proven yet",body:"No intent here has proof."}}return{title:"No matches",body:"Rows exist in this status, but the current filter hides them."}}function Te(e){const t=oe(e.id,e.statement);return`
    <div class="detail-card status-${e.status}${T&&e.id===w?" selected":""}${e.id===w?" cross-pinned":""}" data-id="${C(e.id)}" title="${C(e.id)} · ${C(e.status)} · ${C(t)}">
      <span class="detail-card-id ${e.status}">${l(e.id)}</span>
      <div class="detail-card-excerpt">${l(t)}</div>
    </div>
  `}function Qt(){const e=Q();if(e.length===0){const n=L!=="all"?ie(L,q(L)):{title:"No matching rows",body:"Try clearing the search filter."};return`<div class="map-empty" data-design="map-empty">
      <div class="map-empty-title">${l(n.title)}</div>
      <div class="map-empty-body">${l(n.body)}</div>
    </div>`}const t=gt(e),s=new Map(e.map(n=>[n.id,n]));return`
    <div class="map-wrap-outer" data-design="map-wrap-outer">
      <div class="map-head" data-design="map-head">${t.length} stor${t.length===1?"y":"ies"}</div>
      <div class="map-wrap${x===1?"":` map-wrap-level-${x}`}" data-design="map-wrap">${t.map(n=>es(n,s)).join("")}</div>
      ${J("Reads trace-manifest.json only; no target re-scan: this readout is the emitter's, not re-derived here.")}
    </div>
  `}function es(e,t){const s=t.get(e.key);return`
    <div class="map-column" data-design="map-column">
      ${s?`<div class="map-spine-card" data-design="map-spine-card">${Te(s)}</div>`:`
      <div class="map-column-head" data-design="map-column-head">
        <span class="map-column-label">${l(e.label)}</span>
        <span class="map-column-count">${e.rows.length}</span>
        <span class="map-column-strip" data-design="map-column-strip">${Je(e.counts)}</span>
      </div>`}
      <div class="map-column-cards">${e.rows.map(Te).join("")}</div>
    </div>
  `}function ts(e){m.querySelectorAll(`[data-id="${CSS.escape(e)}"]`).forEach(t=>{t.scrollIntoView({block:"nearest"})})}function ss(){if(!w||!k)return;ye().some(t=>t.rowId===w)||(w=null,T=!1)}function ye(){if(!k)return[];const e=M.trim().toLowerCase();return e?k.rows.filter(t=>{const s=t.provenance,n=typeof s.file=="string"&&s.file||typeof s.path=="string"&&s.path||"";return t.label.toLowerCase().includes(e)||t.statement.toLowerCase().includes(e)||(t.rowId??"").toLowerCase().includes(e)||n.toLowerCase().includes(e)}):k.rows}function ns(){if(!k)return"";const e=k.honestLimits.map(t=>`<li>${l(t)}</li>`).join("");return`
      <div class="ghost-provenance-card" data-design="ghost-provenance-card">
        <div class="ghost-provenance-row"><span class="l">Source repo</span><span class="v">${l(k.sourceRepoPath)}</span></div>
        <div class="ghost-provenance-row"><span class="l">Source commit</span><span class="v">${l(k.sourceCommit||"—")}</span></div>
        <div class="ghost-provenance-row"><span class="l">Generated</span><span class="v">${l(k.generatedAt)}</span></div>
        <div class="ghost-provenance-row"><span class="l">Generator</span><span class="v">${l(k.generatorVersion)}</span></div>
        ${e?`<div class="ghost-limits"><div class="l">Honest limits</div><ul>${e}</ul></div>`:""}
        <p class="ghost-epistemic-note">Every row here is proposed and attested by no one. Nothing here is anointed.</p>
      </div>
  `}function $e(e){if(e.gap===null)return"";const t=e.gap==="partial"?"PARTIAL":"GAP",s=e.gap==="partial"?"The dig found this partially implemented or partially proven":"The dig found this published in the spec but not implemented or tested";return`<span class="hchip ghostgap" title="${C(s)}">${t}</span>`}function as(e){const t=Ze(),s=e.candidateParent.length>0,n=e.candidateBuild.length>0,a=e.candidateProof!==null,i=e.candidateBuild.length?e.candidateBuild.map(r=>`
              <li>
                <code>${l(r.type||Z(r.file)||"(unnamed)")}</code>
                <div class="path">${j(r.file,r.line,t,l)}</div>
                ${r.provenanceFile?`<div class="path">seen at ${j(r.provenanceFile,r.provenanceLine,t,l)}</div>`:""}
                ${r.basis?`<div class="excerpt">${l(r.basis)}</div>`:""}
              </li>`).join(""):'<li class="empty">No candidate build.</li>',c=e.candidateParent.length?e.candidateParent.map(r=>`
              <li>
                <code>${l(r.parentRowId??"(unresolved)")}</code>
                <div class="path">${l(r.basis||"no basis stated")}</div>
              </li>`).join(""):'<li class="empty">No candidate parent — proposed as its own root.</li>',o=e.candidateProof?`
              <li>
                <code>${l(e.candidateProof.test||"(unnamed test)")}</code>
                <div class="path">${j(e.candidateProof.file,e.candidateProof.line,t,l)}</div>
                <div class="excerpt">${l(e.candidateProof.basis)}</div>
              </li>`:'<li class="empty">No candidate proof.</li>';return`
      <div class="descent ghost-descent" data-design="descent">
        <button type="button" class="descent-back" data-descent-back title="Back to the dig">‹ Back to the dig</button>
        <div class="ghost-descent-head">
          <span class="detail-card-id ghost-dim">${l(e.label)}</span>
          <span class="hchip ghostguess">${l(e.typeGuess)} — a guess</span>
          <span class="hchip ghost">${l(e.epistemicClass.toUpperCase())}</span>
          ${$e(e)}
          ${e.confidence?`<span class="hchip ghostguess">confidence: ${l(e.confidence)}</span>`:""}
        </div>
        <div class="ghost-thread" data-design="ghost-thread">
          <svg class="ghost-rail" aria-hidden="true"></svg>
          <div class="tier ghost-tier" data-present="true">
            <div class="tier-label">PROPOSED INTENT</div>
            <div class="tier-body">${e.statement?l(e.statement):"<i>no statement text</i>"}</div>
            <div class="gdesc-faint">dug from: ${l(wt(e.provenance))}</div>
          </div>
          <div class="tier ghost-tier${s?"":" ghost-leg-absent"}" data-present="${s}">
            <div class="tier-label">CANDIDATE PARENT</div>
            <ul class="hit-list">${c}</ul>
          </div>
          <div class="tier ghost-tier${n?"":" ghost-leg-absent"}" data-present="${n}">
            <div class="tier-label">CANDIDATE BUILD</div>
            <ul class="hit-list">${i}</ul>
          </div>
          <div class="tier ghost-tier${a?"":" ghost-leg-absent"}" data-present="${a}">
            <div class="tier-label">CANDIDATE PROOF</div>
            <ul class="hit-list">${o}</ul>
          </div>
        </div>
        <p class="ghost-epistemic-note">Proposed only — attested by no one. Anointment is not a button here, it is a pull request.</p>
      </div>
  `}function is(e){const t=e.rowId?` data-id="${C(e.rowId)}"`:"";return`
                <tr class="ghost-row-tr${T&&e.rowId===w?" selected":""}${e.rowId===w?" cross-pinned":""}"${t}>
                  <td class="id ghost-dim">${l(e.label)}</td>
                  <td><span class="hchip ghostguess">${l(e.typeGuess)} — a guess</span> <span class="hchip ghost">${l(e.epistemicClass.toUpperCase())}</span> ${$e(e)}</td>
                  <td class="statement">${l(we(e.statement,140))}</td>
                  <td>${e.confidence?l(e.confidence):"—"}</td>
                </tr>`}function os(){const e=ye();return e.length===0?'<div class="table-empty" data-design="table-empty"><div class="table-empty-title">No proposed rows match.</div></div>':`
        <div class="table-wrap">
          <table data-design="matrix-table">
            <thead>
              <tr><th>ID</th><th>Type</th><th>Statement</th><th>Confidence</th></tr>
            </thead>
            <tbody>
              ${e.map(is).join("")}
            </tbody>
          </table>
        </div>
  `}function Ie(e){const t=e.rowId?` data-id="${C(e.rowId)}"`:"";return`
    <div class="detail-card ghost-card${T&&e.rowId===w?" selected":""}${e.rowId===w?" cross-pinned":""}"${t} title="${C(e.label)} · proposed · ${C(e.typeGuess)}">
      <span class="detail-card-id ghost-dim">${l(e.label)}</span>
      <span class="hchip ghostguess">${l(e.typeGuess)} — a guess</span> <span class="hchip ghost">${l(e.epistemicClass.toUpperCase())}</span> ${$e(e)}
      <div class="detail-card-excerpt">${l(e.statement)}</div>
    </div>
  `}function rs(){const e=ye();if(e.length===0)return'<div class="map-empty" data-design="map-empty"><div class="map-empty-title">No proposed rows match.</div></div>';const t=$t(e),s=new Map;for(const n of e)n.rowId&&s.set(n.rowId,n);return`
    <div class="map-wrap-outer" data-design="map-wrap-outer">
      <div class="map-head" data-design="map-head">${t.length} propos${t.length===1?"al":"als"}</div>
      <div class="map-wrap ghost-map-wrap${x===1?"":` map-wrap-level-${x}`}" data-design="map-wrap">${t.map(n=>ls(n,s)).join("")}</div>
      ${J("Reads the dig-report only; no target re-scan: this readout is the excavation tool's own, not re-derived here.")}
    </div>
  `}function ls(e,t){const s=t.get(e.key);return`
    <div class="map-column ghost-map-column" data-design="map-column">
      ${s?`<div class="map-spine-card ghost-spine-card" data-design="map-spine-card">${Ie(s)}</div>`:`
      <div class="map-column-head ghost-column-head" data-design="map-column-head">
        <span class="map-column-label">${l(e.label)}</span>
        <span class="map-column-count">${e.rows.length}</span>
      </div>`}
      <div class="map-column-cards">${e.rows.map(Ie).join("")}</div>
    </div>
  `}function cs(e={}){if(!k)return;ss();const t=T?k.rows.find(c=>c.rowId===w)??null:null,s=e.resetMatrixScroll?null:Ye(),n=new Map;for(const c of k.rows)n.set(c.typeGuess,(n.get(c.typeGuess)??0)+1);const a=[...n.entries()].sort(([c],[o])=>c.localeCompare(o)).map(([c,o])=>`<span class="hchip ghostguess">${o} ${l(c)}</span>`).join(" "),i=`
        ${t?as(t):ns()}
        ${J("Reads the dig-report only; no target re-scan: this readout is the excavation tool's own, not re-derived here.")}
  `;m.innerHTML=`
    <header class="topbar ghost-topbar" data-design="topbar">
      <div>
        <h1 class="brand">${V}</h1>
        <p class="meta">${l(k.sourceRepoPath)} · dig ${l(k.generatedAt)} · ${l(k.generatorVersion)}</p>
        <p class="ghost-epistemic-banner" title="Every row here is a proposal">Proposed only — attested by no one</p>
        ${be()}
      </div>
      <div class="stats ghost-stats" data-design="stats">
        <div class="stat"><div class="n">${k.rows.length}</div><div class="l">Proposed</div></div>
        <div class="ghost-type-chips">${a}</div>
      </div>
    </header>
    <div class="layout">
      <section class="matrix-pane" data-design="matrix-pane" tabindex="0">
        <h2 class="pane-title">Proposed rows</h2>
        ${Xe()}
        <div class="toolbar" data-design="toolbar">
          <input id="q" type="search" placeholder="Filter by ID or statement…" value="${C(M)}" />
        </div>
        ${I==="map"?rs():os()}
      </section>
      <div class="pane-divider" data-design="pane-divider" role="separator" aria-orientation="vertical" title="Drag to resize; double-click to reset"></div>
      <section class="descent-pane" data-design="descent-pane">
        <h2 class="pane-title">Thread</h2>
        ${i}
      </section>
    </div>
  `,ae(),Y(),fe(),st(),s&&(ne(s),requestAnimationFrame(()=>ne(s)))}function ae(){var i,c,o,r,g,S,h,f,d,v,$,N;(i=m.querySelector("#loadManifest"))==null||i.addEventListener("click",()=>{var p;(p=m.querySelector("#manifestFile"))==null||p.click()}),(c=m.querySelector("#loadDig"))==null||c.addEventListener("click",()=>{var p;(p=m.querySelector("#digFile"))==null||p.click()}),(o=m.querySelector("#digFile"))==null||o.addEventListener("change",p=>{var A;const u=(A=p.target.files)==null?void 0:A[0];u&&Me(u),p.target.value=""}),(r=m.querySelector("#manifestFile"))==null||r.addEventListener("change",p=>{var A;const u=(A=p.target.files)==null?void 0:A[0];u&&Me(u)}),(g=m.querySelector("#q"))==null||g.addEventListener("input",p=>{var A;M=p.target.value,R({resetMatrixScroll:!0}),(A=m.querySelector("#q"))==null||A.focus();const u=m.querySelector("#q");u&&(u.selectionStart=u.selectionEnd=u.value.length)}),(S=m.querySelector("#status"))==null||S.addEventListener("change",p=>{L=p.target.value,R({resetMatrixScroll:!0})}),(h=m.querySelector("#rollup"))==null||h.addEventListener("change",p=>{const u=p.target.value;X=u===""?null:u,R({resetMatrixScroll:!0})}),m.querySelectorAll("[data-stat-filter]").forEach(p=>{p.addEventListener("click",()=>{const u=p.getAttribute("data-stat-filter");u&&(M="",L=u==="all"?"all":u,R({resetMatrixScroll:!0}))})}),m.querySelectorAll(".lens-tab[data-lens]").forEach(p=>{p.addEventListener("click",()=>{const u=p.getAttribute("data-lens");!u||u===I||(I=u,R({resetMatrixScroll:!0}))})}),m.querySelectorAll("tbody tr[data-id], .strand[data-id], .detail-card[data-id]").forEach(p=>{p.addEventListener("click",()=>{const u=p.getAttribute("data-id");u&&(w=u,T=!0,R(),requestAnimationFrame(()=>ts(u)))})});const e=p=>{m.querySelectorAll(".cross-hover").forEach(u=>u.classList.remove("cross-hover")),p&&m.querySelectorAll(`[data-id="${CSS.escape(p)}"]`).forEach(u=>u.classList.add("cross-hover"))};let t=null;const s=p=>{if(I==="map")return;const u=m.querySelector(".matrix-pane");u&&(t=u,u.style.minHeight=`${u.getBoundingClientRect().height}px`),m.querySelectorAll("tbody tr[data-id]").forEach(A=>{A.getAttribute("data-id")!==p&&A.classList.add("cross-isolated")})},n=()=>{m.querySelectorAll(".cross-isolated").forEach(p=>p.classList.remove("cross-isolated")),t&&(t.style.minHeight="",t=null)};m.querySelectorAll(".strand[data-id]").forEach(p=>{p.addEventListener("mouseenter",()=>{const u=p.getAttribute("data-id");e(u),u&&s(u)}),p.addEventListener("mouseleave",()=>{e(null),n()})}),m.querySelectorAll("tbody tr[data-id], .detail-card[data-id]").forEach(p=>{p.addEventListener("mouseenter",()=>e(p.getAttribute("data-id"))),p.addEventListener("mouseleave",()=>e(null))}),(f=m.querySelector("[data-descent-back]"))==null||f.addEventListener("click",()=>{if(T=!1,R(),w){const p=w;requestAnimationFrame(()=>{var u;(u=m.querySelector(`.strand[data-id="${CSS.escape(p)}"]`))==null||u.scrollIntoView({block:"nearest"})})}}),(d=m.querySelector("[data-field-expand-toggle]"))==null||d.addEventListener("click",()=>{_=!_,R()}),(v=m.querySelector("[data-zoom-in]"))==null||v.addEventListener("click",()=>{x=ee(x+1),R()}),($=m.querySelector("[data-zoom-out]"))==null||$.addEventListener("click",()=>{x=ee(x-1),R()}),(N=m.querySelector(".matrix-pane"))==null||N.addEventListener("keydown",p=>{if(I!=="map")return;const u=p.key;u==="+"||u==="="?(x=ee(x+1),R()):(u==="-"||u==="_")&&(x=ee(x-1),R())});const a=m.querySelector(".pane-divider");a&&(a.addEventListener("pointerdown",p=>{const u=m.querySelector(".layout");if(!u)return;p.preventDefault(),a.setPointerCapture(p.pointerId),a.classList.add("dragging"),document.body.classList.add("pane-resizing");const A=u.getBoundingClientRect(),F=B=>{const b=(B.clientX-A.left)/Math.max(A.width,1);U=Math.min(Ke,Math.max(Ve,b)),Y()},E=B=>{a.releasePointerCapture(B.pointerId),a.classList.remove("dragging"),document.body.classList.remove("pane-resizing"),a.removeEventListener("pointermove",F),a.removeEventListener("pointerup",E),a.removeEventListener("pointercancel",E),U!==null&&window.localStorage.setItem(se,String(U))};a.addEventListener("pointermove",F),a.addEventListener("pointerup",E),a.addEventListener("pointercancel",E)}),a.addEventListener("dblclick",()=>{U=null,window.localStorage.removeItem(se),Y()})),m.querySelectorAll(".source-toggle").forEach(p=>{p.addEventListener("click",()=>{const u=p.getAttribute("data-source-key");if(u){if(H.has(u)){H.delete(u),R();return}if(H.add(u),R(),!G.has(u)){const A=p.getAttribute("data-source-path"),F=Number(p.getAttribute("data-source-line"));fs(u,A,F)}}})})}function et(e,t){const s=vt(e);return ve=t,s==="trace-manifest"?(y=it(e),k=null,W=null,Ne(),{kind:s}):s==="dig-report"?(k=yt(e),y=null,W=null,Ne(),{kind:s}):s==="cost-cube"?(y=null,k=null,W="This is a cost-cube. Tally reads those.",{kind:s}):{kind:s,message:"Not a supported artifact — expected a trace-manifest, a dig-report, or a cost-cube."}}function Ne(){H.clear(),G.clear(),M="",L="all",w=null,T=!1}async function Me(e){try{const t=await e.text(),s=JSON.parse(t),n=et(s,"user-file");if(n.kind==="unknown"){window.alert(n.message);return}R({resetMatrixScroll:!0})}catch(t){window.alert(`Could not read file: ${t}`)}}function ds(e){switch(e){case"GAP":return"No proof: silent gap (Golden Thread broken)";case"tracked-debt":return"No proof: tracked as debt";case"backlog":return"No own proof: backlog altitude (not a silent gap)";default:return"No proof"}}function ps(e){const t=Ze(),s=e.status==="GAP",n=e.status==="tracked-debt",a=e.status==="backlog",i=ze(),c=n||a,o=Ge(e),r=ft(e),g=e.implementations.length===0,S=e.proofs.length===0,h=S&&(s||i),f=g&&ut(e),d=g?f?" lawful-absence":c?" missing-honest":" missing-impl":"",v=g?f?" carrier-lawful":c?" carrier-honest":" missing-carrier":"",$=h?" frayed":S&&c?" missing-honest":"",N=h?" frayed":S&&c?" carrier-honest":"",p=e.implementations.length===0?`<li class="empty${v}">${f?me(e)?"no build mark · proof binds directly to intent":"no build mark · none claimed":a?"No own @covers (backlog altitude)":"No @covers found"}</li>`:e.implementations.map(b=>{const P=de(b.path,b.line),D=H.has(P),Se=ms(b.excerpt,e.id);return`
              <li>
                <button type="button" class="source-toggle" data-source-key="${C(P)}" data-source-path="${C(b.path)}" data-source-line="${b.line}" aria-expanded="${D}">
                  <span class="proof-caret">${D?"▾":"▸"}</span>
                  <code>${l(Z(b.path))}:${b.line}</code>
                </button>
                <div class="path">${j(b.path,b.line,t,l)}</div>
                ${Se.length?`<div class="excerpt">also covers: ${l(Se.join(", "))}</div>`:""}
                ${D?pe(G.get(P)):""}
              </li>`}).join(""),u=e.carryingTasks??[],A=u.length===0?"":`<div class="debt-block">
        <div class="debt-label">Open debt (Carries:)</div>
        <ul class="hit-list debt-list">
          ${u.map(b=>`
            <li>
              <div class="path">${j(b.path,b.line,t,l)}</div>
              <div class="excerpt">${l(b.excerpt)}</div>
            </li>`).join("")}
        </ul>
      </div>`,F=r==="coverage-proven"&&!i?(()=>{const b=ht(e);return`<li class="coverage-proven"><code>${l(Z(b.path))}:${b.line}</code><div class="path">Covered by ${j(b.path,b.line,t,l)}: no test required for this type</div></li>`})():e.proofs.length===0?`<li class="empty${N}">${l(i&&!s?"Golden Thread broken":n&&u.length>0?"No proof: tracked as open debt (see above)":ds(e.status))}</li>`:e.proofs.map(b=>{const P=de(b.path,b.line),D=H.has(P);return`
              <li>
                <button type="button" class="source-toggle" data-source-key="${C(P)}" data-source-path="${C(b.path)}" data-source-line="${b.line}" aria-expanded="${D}">
                  <span class="proof-caret">${D?"▾":"▸"}</span>
                  <code>${l(b.name)}</code>
                </button>
                <div class="path">${j(b.path,b.line,t,l)}</div>
                ${D?pe(G.get(P)):""}
              </li>`}).join(""),E=e.registry??null;let B="";if(E){const b=de(E.path,E.line),P=H.has(b),D=E.path.includes("/")||Fe(E.path,E.line,t)!==null;B=`
      <ul class="hit-list registry-list">
        <li>
          <button type="button" class="source-toggle" data-source-key="${C(b)}" data-source-path="${C(E.path)}" data-source-line="${E.line}" aria-expanded="${P}">
            <span class="proof-caret">${P?"▾":"▸"}</span>
            <code>${l(Z(E.path))}:${E.line}</code>
          </button>
          ${D?`<div class="path">${j(E.path,E.line,t,l)}</div>`:""}
          ${P?pe(G.get(b)):""}
        </li>
      </ul>`}return`
    <div class="descent-head" data-design="descent-head">
      <button type="button" class="descent-back" data-descent-back title="Back to field">‹ Back to field</button>
    </div>
    <div class="thread${i?" gate-broken":""}" data-design="descent-thread" data-status="${e.status}">
      <svg class="thread-rail" aria-hidden="true"></svg>
      <article class="tier${De(e.status)==="amber"?" debt":""}" data-design="tier-requirement" data-broken="false">
        <div class="tier-label">Intent</div>
        <div class="tier-id">${l(e.id)}</div>
        <div class="tier-body">${l(oe(e.id,e.statement))}</div>
        ${B}
        <p class="meta" style="margin-top:0.6rem"><span class="badge ${e.status}">${l(e.status)}</span></p>
        ${o?'<p class="incoherence-note" data-design="incoherence-note">status claims proven; manifest lists no proof</p>':""}
        ${A}
      </article>
      <article class="tier${d}" data-design="tier-implementation" data-broken="false">
        <div class="tier-label">Build</div>
        <div class="tier-id">${l(e.id)}</div>
        <ul class="hit-list">${p}</ul>
      </article>
      <article class="tier${$}" data-design="tier-proof" data-broken="${h?"true":"false"}">
        <div class="tier-label">Proof</div>
        <div class="tier-id">${l(e.id)}</div>
        <ul class="hit-list">${F}</ul>
      </article>
    </div>
  `}function tt(e,t,s,n,a,i=!1){const o=O*(a===0?1:-1),r=i?n:-n,g=t+(s-t)*.33,S=t+(s-t)*.67,h=e+r+o,f=e+r-o;return`M ${e} ${t} C ${h} ${g} ${f} ${S} ${e} ${s}`}function us(e,t,s,n,a=!1){const i=Math.sign(s-t)||1,c=s-t;let o=t+c*.5,r=o+i*re;const g=s-i*18;i>0?(r=Math.min(r,g),o=Math.min(o,r-i*re)):(r=Math.max(r,g),o=Math.max(o,r-i*re));const S=t+(o-t)*.55,h=a?n:-n,f=`M ${e} ${t} C ${e+h+O} ${S} ${e+h+O*.35} ${t+(o-t)*.85} ${e+O*.4} ${o}`,d=`M ${e} ${t} C ${e+h-O} ${S} ${e+h-O*.35} ${t+(r-t)*.85} ${e-O*.4} ${r}`;return{short:f,long:d}}function he(){const e=m.querySelector(".thread"),t=e==null?void 0:e.querySelector(".thread-rail");if(!e||!t)return;const s=[...e.querySelectorAll(":scope > .tier")];if(s.length<2){t.replaceChildren();return}const n=parseFloat(getComputedStyle(document.documentElement).fontSize)||16,a=s.map(f=>({x:f.offsetLeft-.95*n+4.5,y:f.offsetTop+1.1*n+4.5,top:f.offsetTop,bottom:f.offsetTop+f.offsetHeight,broken:f.getAttribute("data-broken")==="true"})),i=Math.max(e.clientWidth,48),c=Math.max(e.scrollHeight,1),o=z+6,r=z+8;t.style.left=`${-o}px`,t.style.width=`${i+o+r}px`,t.style.height=`${c}px`,t.setAttribute("width",String(i+o+r)),t.setAttribute("height",String(c)),t.setAttribute("viewBox",`${-o} 0 ${i+o+r} ${c}`);const g="http://www.w3.org/2000/svg",S=document.createDocumentFragment(),h=a.length-2;for(let f=0;f<a.length-1;f++){const d=a[f],v=a[f+1],$=d.broken||v.broken,N=$&&f===h,p=document.createElementNS(g,"g");if(p.classList.add("seg",$?"seg-frayed":"seg-braid"),N&&p.classList.add("seg-reflect"),p.setAttribute("data-seg",String(f)),$){const u=d.broken&&!v.broken,A=u?v:d,F=u?d:v,{short:E,long:B}=us(d.x,A.y,F.y,z,N),b=document.createElementNS(g,"path");b.setAttribute("d",E),b.classList.add("strand","strand-die","strand-short");const P=document.createElementNS(g,"path");P.setAttribute("d",B),P.classList.add("strand","strand-die","strand-long"),p.appendChild(b),p.appendChild(P)}else for(const u of[0,1]){const A=document.createElementNS(g,"path");A.setAttribute("d",tt(d.x,d.y,v.y,z,u)),A.classList.add("strand",u===0?"strand-a":"strand-b"),p.appendChild(A)}S.appendChild(p)}t.replaceChildren(S)}function st(){const e=m.querySelector(".ghost-thread"),t=e==null?void 0:e.querySelector(".ghost-rail");if(!e||!t)return;const s=[...e.querySelectorAll(":scope > .tier")];let n=-1;for(const f of s){if(f.getAttribute("data-present")!=="true")break;n+=1}if(n<1){t.replaceChildren();return}const a=parseFloat(getComputedStyle(document.documentElement).fontSize)||16,i=s.slice(0,n+1).map(f=>({x:f.offsetLeft-.95*a+4.5,y:f.offsetTop+1.1*a+4.5})),c=Math.max(e.clientWidth,48),o=Math.max(e.scrollHeight,1),r=z+6,g=z+8;t.style.left=`${-r}px`,t.style.width=`${c+r+g}px`,t.style.height=`${o}px`,t.setAttribute("width",String(c+r+g)),t.setAttribute("height",String(o)),t.setAttribute("viewBox",`${-r} 0 ${c+r+g} ${o}`);const S="http://www.w3.org/2000/svg",h=document.createDocumentFragment();for(let f=0;f<i.length-1;f++){const d=i[f],v=i[f+1],$=document.createElementNS(S,"path");$.setAttribute("d",tt(d.x,d.y,v.y,z,0)),$.classList.add("ghost-strand"),h.appendChild($)}t.replaceChildren(h)}function pe(e){if(!e)return'<div class="proof-source proof-source-loading">Loading source…</div>';if("error"in e)return`<div class="proof-source ${e.info?"proof-source-info":"proof-source-error"}">${l(e.error)}</div>`;const t=e.lines.map(s=>`<div class="src-line${s.isTarget?" src-line-target":""}"><span class="src-n">${s.n}</span><span class="src-text">${l(s.text)}</span></div>`).join("");return`
    <div class="proof-source">
      <div class="proof-source-path">${l(e.path)} · lines ${e.startLine}–${e.endLine} of ${e.totalLines}</div>
      <div class="proof-source-code">${t}</div>
    </div>
  `}async function fs(e,t,s){var n;if(y){if(!jt()){G.set(e,{info:!0,error:"Source peek is off for artifacts you load yourself — nothing from this file leaves your machine. Run Loupe locally against the repository to read source in place."}),R();return}try{const a=`/api/source?repoPath=${encodeURIComponent(y.repoPath)}&path=${encodeURIComponent(t)}&line=${s}`,i=await fetch(a);((n=i.headers.get("content-type"))==null?void 0:n.includes("application/json"))?G.set(e,await i.json()):G.set(e,{info:!0,error:"This hosted demo reads the trace-manifest only. The source line above is shown in full when Loupe runs locally against the repository."})}catch(a){const i=a instanceof TypeError;G.set(e,{error:i?"Can't reach the Loupe dev server, so source can't be read from disk. Restart it (`npm run viz:dev` in loupe) and reload this page.":String(a)})}R()}}const hs=/(?:FR|NFR|AC|US)-[A-Z][A-Z0-9]{1,5}-[0-9]{2,}[a-z]?/g;function Z(e){const t=e.lastIndexOf("/");return t===-1?e:e.slice(t+1)}function ms(e,t){const s=e.match(hs)??[];return[...new Set(s)].filter(n=>n!==t)}function we(e,t){const s=e.replace(/\s+/g," ").trim();return s.length<=t?s:`${s.slice(0,t-1)}…`}function oe(e,t){const s=t.replace(/\*\*/g,""),n=e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return s.replace(new RegExp(`^\\s*${n}\\s*[—:–-]\\s*`),"").trim()}function l(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function C(e){return l(e).replaceAll("'","&#39;")}Ht();

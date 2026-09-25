(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const d of i.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&n(d)}).observe(document,{childList:!0,subtree:!0});function s(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(a){if(a.ep)return;a.ep=!0;const i=s(a);fetch(a.href,i)}})();const it=[3,4,5];function ot(e){return typeof e=="number"&&it.includes(e)}function lt(e){const t=e??{},s=Array.isArray(t.rows)?t.rows.map(ct):[];return{...t,rows:s}}function ct(e){const t=e??{},s=t.carryingTasks??t.debtTasks??[],{debtTasks:n,...a}=t,i=t.origin,d=t.registry??((i==null?void 0:i.kind)==="registry-line"&&i.path?{path:i.path,line:i.line??0}:t.registry),r=pt(typeof t.id=="string"?t.id:"");return{...a,carryingTasks:s,area:r,...d!==void 0?{registry:d}:{}}}const dt=/^(?:FR|NFR|AC|US)-([A-Z][A-Z0-9]{1,5})-[0-9]{2,}[a-z]?$/;function pt(e){const t=dt.exec(e);return t?t[1]:"Unclassified"}function qe(e){const t=[{key:"area",label:"Area",groupOf:n=>n.area}];return e.rows.some(n=>{var a;return(((a=n.parents)==null?void 0:a.length)??0)>0})&&t.push({key:"user-story",label:"User story",groupOf:n=>n.parents&&n.parents.length>0?n.parents[0]:null}),t}function ut(e,t){const s=new Map;for(const n of e){const a=t.groupOf(n);if(a===null)continue;const i=s.get(a);i?i.push(n):s.set(a,[n])}return[...s.entries()].map(([n,a])=>({key:n,label:n,rows:a,counts:se(a)}))}function se(e){const t={proven:0,"tracked-debt":0,backlog:0,GAP:0};for(const s of e)t[s.status]++;return t}function fe(e){switch(e){case"proven":return"green";case"tracked-debt":return"amber";case"backlog":return"blue";case"GAP":return"red"}}function ft(e,t){var s;if(t)return(s=e.find(n=>n.id===t))==null?void 0:s.id}function ht(e){return`
    <section class="descent-pane" data-design="descent-pane">
      <h2 class="pane-title">Thread</h2>
      ${e}
    </section>
    `}function ve(e){return e.tier?e.tier==="criterion":e.type==="AC"}function De(e){return e.status==="proven"&&ve(e)&&e.proofs.length===0}function mt(e){return e.status==="proven"&&e.implementations.length===0&&!De(e)}function gt(e){return e.proofs.length>0?"execution-verified":e.status==="proven"&&!ve(e)&&e.implementations.length>0?"coverage-proven":"no-proof"}function vt(e){const t=e.implementations[0];return t?{path:t.path.replace(/^\.\//,""),line:t.line}:null}function $t(){return{label:"Own proofs",title:"Direct test proofs on this row's own ID; a proven row can read 0 here when it's proven via a covered implementation or transitively through its children -- the Status badge is the row's real verdict, this column is narrower than that."}}function bt(e){const t=new Map;for(const c of e)t.set(c.id,c);const s=new Map;for(const c of e)c.type==="US"&&s.set(c.id,c);function n(c){var u;const v=new Set;let S=c;for(;S&&(((u=S.parents)==null?void 0:u.length)??0)>0;){const p=S.parents.find(y=>t.has(y));if(!p||v.has(p))return null;if(v.add(p),s.has(p))return p;S=t.get(p)}return null}const a=new Map;for(const c of e){if(c.type==="US")continue;const v=n(c);if(!v)continue;const S=a.get(v);S?S.push(c):a.set(v,[c])}const i=new Set,d=(c,v)=>c.id.localeCompare(v.id),r=[...a.entries()].sort(([c],[v])=>c.localeCompare(v)).map(([c,v])=>{i.add(c);for(const u of v)i.add(u.id);const S=v.slice().sort(d);return{key:c,label:s.get(c).statement,rows:S,counts:se(S)}}),o=e.filter(c=>!i.has(c.id)),g=new Map,k=[];for(const c of o)if(c.area&&c.area!=="Unclassified"){const v=g.get(c.area);v?v.push(c):g.set(c.area,[c])}else k.push(c);const h=[...g.entries()].sort(([c],[v])=>c.localeCompare(v)).map(([c,v])=>{const S=v.slice().sort(d);return{key:c,label:c,rows:S,counts:se(S)}}),f=k.length===0?[]:[{key:"unparented",label:"Unparented",rows:k.slice().sort(d),counts:se(k)}];return[...r,...h,...f]}function yt(e){if(!e||typeof e!="object")return"unknown";const t=e;if(ot(t.schemaVersion)&&Array.isArray(t.rows))return"trace-manifest";const s=t.rows??t.candidates??t.proposedRows,n=Array.isArray(s)&&s.length>0?s[0]:null,a=!!n&&("rowId"in n||"epistemicClass"in n||"candidateParent"in n||"typeGuess"in n);return Array.isArray(s)&&(typeof t.generatorVersion=="string"||typeof t.generator=="string"||Array.isArray(t.honestLimits)||a)?"dig-report":(typeof t.formatVersion=="string"||typeof t.formatVersion=="number")&&("events"in t||"pricedEvents"in t||"resolvedRepo"in t)?"cost-cube":"unknown"}function wt(e){const t=e??{},s=t.provenance??t.source??{},n=typeof s.testName=="string"?s.testName:void 0,a=typeof t.statement=="string"?t.statement:"",i=typeof t.label=="string"&&t.label||typeof t.candidateLabel=="string"&&t.candidateLabel||typeof t.id=="string"&&t.id||typeof t.candidateId=="string"&&t.candidateId||n||a.slice(0,40)||"(unlabeled)",r=(Array.isArray(t.candidateParent)?t.candidateParent:[]).map(f=>{const c=f??{};return{parentRowId:typeof c.parentRowId=="string"?c.parentRowId:null,basis:typeof c.basis=="string"?c.basis:""}}),o=t.candidateProof,g=o?{test:typeof o.test=="string"&&o.test||typeof o.testName=="string"&&o.testName||"",file:typeof o.file=="string"?o.file:"",line:o.line!==void 0&&o.line!==null?String(o.line):"",basis:typeof o.basis=="string"?o.basis:""}:(s.source==="test"||s.sourceKind==="test"||s.kind==="test")&&(s.testName||s.test)?{test:s.testName||s.test||"",file:s.file||s.path||"",line:"",basis:"same-artifact"}:null,h=(Array.isArray(t.candidateBuild)?t.candidateBuild:t.candidateBuild&&typeof t.candidateBuild=="object"?[t.candidateBuild]:[]).map(f=>{const c=f??{},v=c.provenance??{};return{file:typeof c.file=="string"?c.file:"",line:c.line!==void 0&&c.line!==null?String(c.line):"",type:typeof c.importedType=="string"&&c.importedType||typeof c.type=="string"&&c.type||typeof c.method=="string"&&c.method||"",provenanceFile:typeof v.file=="string"?v.file:"",provenanceLine:v.line!==void 0&&v.line!==null?String(v.line):"",basis:typeof c.basis=="string"?c.basis:""}});return{rowId:typeof t.rowId=="string"?t.rowId:null,label:i,statement:a,typeGuess:(typeof t.typeGuess=="string"&&t.typeGuess||typeof t.type=="string"&&t.type||"?").toUpperCase(),epistemicClass:typeof t.epistemicClass=="string"&&t.epistemicClass||typeof t.epistemic=="string"&&t.epistemic||"inferred",confidence:typeof t.confidence=="string"&&t.confidence||typeof t.confidenceSignal=="string"&&t.confidenceSignal||null,suggestedArea:typeof t.suggestedArea=="string"&&t.suggestedArea||typeof t.area=="string"&&t.area||null,provenance:s,candidateParent:r,candidateProof:g,candidateBuild:h,gap:t.gap===!0?!0:t.gap==="partial"?"partial":null}}function St(e){const t=e??{};return{rows:(Array.isArray(t.rows)&&t.rows||Array.isArray(t.candidates)&&t.candidates||Array.isArray(t.proposedRows)&&t.proposedRows||[]).map(wt),generatorVersion:typeof t.generatorVersion=="string"&&t.generatorVersion||typeof t.generator=="string"&&t.generator||"?",sourceRepoPath:typeof t.sourceRepoPath=="string"&&t.sourceRepoPath||typeof t.sourceRepo=="string"&&t.sourceRepo||typeof t.repo=="string"&&t.repo||"?",generatedAt:typeof t.generatedAt=="string"&&t.generatedAt||"?",sourceCommit:typeof t.sourceCommit=="string"&&t.sourceCommit||typeof t.commit=="string"&&t.commit||"",honestLimits:Array.isArray(t.honestLimits)?t.honestLimits.filter(n=>typeof n=="string"):[]}}function At(e){const t=new Map;for(const h of e)h.rowId&&t.set(h.rowId,h);const s=new Map;for(const h of e){const f=h.candidateParent[0],c=f==null?void 0:f.parentRowId;if(!c||!t.has(c)||c===h.rowId)continue;const v=s.get(c);v?v.push(h):s.set(c,[h])}const n=new Set,a=(h,f)=>h.label.localeCompare(f.label),i=[...s.entries()].sort(([h],[f])=>h.localeCompare(f)).map(([h,f])=>{n.add(h);for(const c of f)c.rowId&&n.add(c.rowId);return{key:h,label:t.get(h).label,rows:f.slice().sort(a)}}),d=e.filter(h=>!h.rowId||!n.has(h.rowId)),r=new Map,o=[];for(const h of d)if(h.suggestedArea){const f=r.get(h.suggestedArea);f?f.push(h):r.set(h.suggestedArea,[h])}else o.push(h);const g=[...r.entries()].sort(([h],[f])=>h.localeCompare(f)).map(([h,f])=>({key:h,label:h,rows:f.slice().sort(a)})),k=o.length===0?[]:[{key:"unparented",label:"no proposed parent",rows:o.slice().sort(a)}];return[...i,...g,...k]}function kt(e){if(!e||typeof e!="object")return"—";const t=typeof e.sourceKind=="string"&&e.sourceKind||typeof e.kind=="string"&&e.kind||typeof e.source=="string"&&e.source||"",s=typeof e.file=="string"&&e.file||typeof e.path=="string"&&e.path||"",n=e.line??e.lineRange??e.lines,a=n!=null?String(n):"",i=typeof e.testName=="string"&&e.testName||typeof e.test=="string"&&e.test||"",d=[t,s+(a?":"+a:""),i?"test: "+i:""].filter(Boolean);return d.length?d.join(" · "):"—"}const Lt=/^(?:https?:\/\/)?((?:[\w-]+\.)+[a-z]{2,}\/[\w.-]+\/[\w.-]+?)\/?$/i;function Ae(e){const t=e??{},s=typeof t.sourceRepoPath=="string"&&t.sourceRepoPath||typeof t.repoPath=="string"&&t.repoPath||"",n=typeof t.sourceCommit=="string"&&t.sourceCommit||typeof t.commit=="string"&&t.commit||null,a=Lt.exec(s.trim());return{remote:a?`https://${a[1]}`:null,commit:n||null}}function Ge(e,t,s){if(!s.remote||!e)return null;const n=e.replace(/^\.\//,"").replace(/^\//,""),a=t==null||t===""?"":String(t),i=a&&/^\d+$/.test(a)?`#L${a}`:"";return`${s.remote}/blob/${s.commit||"main"}/${n}${i}`}function F(e,t,s,n,a={}){const i=t==null||t===""?"":String(t),d=`${a.prefix??""}${e}${i?`:${i}`:""}`,r=Ge(e,t,s);return r?`<a class="src-link" href="${n(r)}" target="_blank" rel="noopener">${n(d)}</a>`:n(d)}const Rt="retired";function ie(e){return e.status===Rt}function je(e){const t=e.parents;if(t&&t.length>0)return t.filter(n=>typeof n=="string"&&n);const s=e.parent;return typeof s=="string"&&s?[s]:[]}function Ct(e){return e.some(t=>je(t).length>0)}const Et={US:"intent",FR:"requirement",NFR:"requirement",AC:"criterion"};function he(e){return e.tier?e.tier:Et[e.type]??"criterion"}const Pt={intent:"intent",requirement:"requirement",criterion:"criterion"};function Fe(e){var t;return e.implementations.length>0||e.proofs.length>0||(((t=e.carryingTasks)==null?void 0:t.length)??0)>0}function It(e){const t=e.implementations.length>0,s=e.proofs.length>0;return t&&s?"full":t?"claim":s?"uncovered":"none"}function Tt(e){const t=new Map;for(const d of e)t.set(d.id,d);const s=new Map,n=[];for(const d of e){const r=je(d).find(g=>t.has(g)&&g!==d.id);if(r===void 0){n.push(d);continue}const o=s.get(r);o?o.push(d.id):s.set(r,[d.id])}const a=new Set,i=(d,r)=>{a.add(d.id);const o=(s.get(d.id)??[]).filter(g=>!a.has(g)).map(g=>t.get(g)).sort(Le);return{row:d,tier:he(d),depth:r,children:o.map(g=>i(g,r+1))}};return n.sort(Le).map(d=>i(d,0))}const ke={intent:0,requirement:1,criterion:2};function Le(e,t){const s=ke[he(e)]-ke[he(t)];return s!==0?s:e.id.localeCompare(t.id)}function Be(e){return ie(e.row)||e.row.status==="backlog"?!1:Fe(e.row)||e.children.some(Be)}const Re={red:0,amber:1,green:2,blue:3,grey:4};function xt(e){return ie(e.row)||e.row.status==="backlog"?!1:Fe(e.row)}function Oe(e){if(ie(e.row))return"grey";if(e.children.length===0)return fe(e.row.status);let t="blue";const s=n=>{Re[n]<Re[t]&&(t=n)};xt(e)&&s(fe(e.row.status));for(const n of e.children)Be(n)&&s(Oe(n));return t}function Nt(e){let t=0,s=0;const n=a=>{for(const i of a.children)ie(i.row)?s+=1:i.row.status==="backlog"&&(t+=1),n(i)};return n(e),{planned:t,retired:s}}function Mt(e){return e===!0?"passed":"proof named"}const qt={objective:"objectives",intent:"intents",requirement:"requirements",criterion:"criteria"};function _e(e){const t=e.children.filter(a=>a.row.status==="proven");if(t.length===0)return null;const s=new Set(t.map(a=>a.tier)),n=s.size===1?qt[[...s][0]]:"rows";return{count:t.length,noun:n}}function Dt(e,t){const s=e.row.proofs.length;if(s>0)return`${s} ${s===1?"test":"tests"}, ${Mt(t)}`;const n=_e(e);return n?`proven through ${n.count} ${n.noun}`:"no proof yet"}function Gt(e){return{buildEarned:!!(e.implementations&&e.implementations.length>0),proofEarned:!!(e.proofs&&e.proofs.length>0)}}function jt(e){return e.statement.replace(/^\S+\s+—\s*/,"")}function Ft(e,t,s,n=78,a=""){const{buildEarned:i}=Gt(e),d=jt(e),r=t/2;let o;return e.status==="proven"?o=`<path d="M${r} 8 C ${r-2} 30, ${r+2} 52, ${r} 72" stroke="#e8bd52" stroke-width="1.4" fill="none" opacity=".85"/><circle cx="${r}" cy="8" r="2.5" fill="#219653"/><circle cx="${r}" cy="40" r="2.5" fill="#219653"/><circle cx="${r}" cy="72" r="2.5" fill="#219653"/>`:e.status==="tracked-debt"?o=`<path d="M${r} 8 C ${r-2} 30, ${r+2} 52, ${r} 72" stroke="#e8bd52" stroke-width="1.4" fill="none" opacity=".8"/><circle cx="${r}" cy="8" r="2.5" fill="#219653"/><circle cx="${r}" cy="40" r="2.5" fill="#c9903a"/><circle cx="${r}" cy="72" r="2.5" fill="none" stroke="#c9903a" stroke-width="1.2"/>`:e.status==="backlog"?o=`<path d="M${r} 8 L ${r} 22" stroke="#e8bd52" stroke-width="1.4" opacity=".8"/><path d="M${r} 22 C ${r-2} 34, ${r+2} 42, ${r-1} 50" stroke="#e8bd52" stroke-width="1" fill="none" opacity=".3" stroke-dasharray="2 3"/><circle cx="${r}" cy="8" r="2.5" fill="#9ed4ff"/>`:o=i?`<path d="M${r} 8 C ${r-2} 30, ${r+2} 52, ${r} 72" stroke="#7d8894" stroke-width="1.4" fill="none" opacity=".6"/><circle cx="${r}" cy="8" r="2.5" fill="#7d8894"/><circle cx="${r}" cy="40" r="2.5" fill="#219653"/><circle cx="${r}" cy="72" r="2.5" fill="#eb5757"/>`:`<path d="M${r} 8 C ${r-2} 24, ${r+2} 32, ${r} 40" stroke="#7d8894" stroke-width="1.4" fill="none" opacity=".6"/><circle cx="${r}" cy="8" r="2.5" fill="#7d8894"/><circle cx="${r}" cy="40" r="2.5" fill="#eb5757"/>`,`<button type="button" class="${a?`strand ${a}`:"strand"}" data-id="${s(e.id)}" title="${s(e.id)} · ${s(e.status)} · ${s(d)}"><svg width="${t}" height="${n}" viewBox="0 0 ${t} 78" xmlns="http://www.w3.org/2000/svg">${o}</svg></button>`}const Bt=13,Ot=78,m=document.querySelector("#app"),H='<span class="brand-accent">Loupe</span>',O=11,B=3.6,le=10,ze=[{key:"backlog",label:"Backlog"},{key:"tracked-debt",label:"Tracked debt"},{key:"proven",label:"Proven"},{key:"GAP",label:"GAP"}];function q(e){return($==null?void 0:$.statusCounts[e])??0}function _t(){return $!=null&&$.gate?$.gate.ok:q("GAP")===0}function Ue(){return!_t()}const Ce={1:"READ",2:"SCAN",3:"SKYLINE"};function te(e){return Math.min(3,Math.max(1,e))}let $=null,L=null,K=null,$e="same-origin";function zt(){return $e==="same-origin"}let A=null,I=!1,T="list",R="all",N="",W=null,P=2,He=!1,Ve=!0,V=null,Ke=null;function Ut(){return!$||!W?null:qe($).find(e=>e.key===W)??null}const z=new Set,G=new Map,ne="loupe.paneSplit",Ee="clewloupe.paneSplit",Ze=.2,We=.8;let _=Ht();function Ht(){let e=window.localStorage.getItem(ne);if(e===null){const s=window.localStorage.getItem(Ee);s!==null&&(window.localStorage.setItem(ne,s),window.localStorage.removeItem(Ee),e=s)}const t=Number(e??NaN);return Number.isFinite(t)&&t>=Ze&&t<=We?t:null}const Vt=960;function X(){const e=m.querySelector(".layout");if(e){if(_===null||window.innerWidth<=Vt){e.style.removeProperty("grid-template-columns");return}e.style.gridTemplateColumns=`minmax(0, ${_}fr) 6px minmax(280px, ${1-_}fr)`}}let ce=!1;function Xe(){ce||(ce=!0,requestAnimationFrame(()=>{ce=!1,ge(),at()}))}const de=new ResizeObserver(Xe);function me(){de.disconnect();const e=m.querySelector(".thread, .ghost-thread");e&&(de.observe(e),e.querySelectorAll(":scope > .tier").forEach(t=>de.observe(t)))}function Ye(){return L?Ae({sourceRepoPath:L.sourceRepoPath,sourceCommit:L.sourceCommit}):$?Ae($):{remote:null,commit:null}}function pe(e,t){return`${e}:${t}`}function J(e){return`<p class="footnote">${e}${$e==="user-file"?" Loaded from your machine: nothing in this file was sent anywhere.":""}</p>`}function be(){return`
        <div class="topbar-actions">
          <button type="button" class="load-manifest" id="loadManifest">Load Manifest…</button>
          <input type="file" id="manifestFile" accept="application/json,.json" hidden />
          <button type="button" class="load-manifest" id="loadDig">Load dig…</button>
          <input type="file" id="digFile" accept="application/json,.json" hidden />
        </div>`}function Je(){return`
        <div class="lens-tabs" data-design="lens-tabs">
          <button type="button" class="lens-tab${T==="list"?" active":""}" data-lens="list">List</button>
          <button type="button" class="lens-tab${T==="map"?" active":""}" data-lens="map">Map</button>
          <button type="button" class="lens-tab${T==="descent"?" active":""}" data-lens="descent" title="Walk the rail: objective, intent, build, proof">Descent</button>
          ${T==="map"?Kt():""}
        </div>`}function Kt(){return`
          <div class="zoom-control" data-design="zoom-control">
            <button type="button" class="zoom-btn" data-zoom-out title="Zoom out (more density)">−</button>
            <span class="zoom-level" title="Map zoom: ${Ce[P]}">${Ce[P]}</span>
            <button type="button" class="zoom-btn" data-zoom-in title="Zoom in (more detail)">+</button>
          </div>`}async function Zt(){const e=new URLSearchParams(location.search).get("manifest")??"/trace-manifest.json",t=await fetch(e).catch(()=>null);if(!t||!t.ok){const o=t?`HTTP ${t.status}`:"fetch failed: for a cross-origin URL, the host must allow CORS";m.innerHTML=`<main class="topbar"><div><h1 class="brand">${H}</h1><p class="meta">Could not load ${l(e)} (${o}). Expected a trace-manifest.json (see samples/), or pass ?manifest=&lt;url&gt;.</p></div></main>`;return}const s=await t.json().catch(()=>null);if(!s){m.innerHTML=`<main class="topbar"><div><h1 class="brand">${H}</h1><p class="meta">Not JSON: ${l(e)}.</p></div></main>`;return}let n="remote-url";try{new URL(e,location.href).origin===location.origin&&(n="same-origin")}catch{n="remote-url"}const a=st(s,n);if(a.kind==="unknown"){m.innerHTML=`<main class="topbar"><div><h1 class="brand">${H}</h1><p class="meta">${l(a.message??"Not a supported artifact.")}</p></div></main>`;return}const i=new URLSearchParams(location.search);He=i.get("embed")==="1",Ve=i.get("field")!=="0";const d=i.get("ids");if(d){const o=d.split(",").map(g=>g.trim()).filter(Boolean);o.length>0&&(V=new Set(o))}Ke=i.get("title");const r=i.get("lens");if((r==="descent"||r==="list"||r==="map")&&(T=r),$){const o=ft($.rows,i.get("id"));A=o??null,I=!!o}E(),window.addEventListener("resize",()=>{X(),Xe()}),document.addEventListener("keydown",o=>{o.key==="Escape"&&(A||I)&&(A=null,I=!1,E())})}function Q(){if(!$)return[];const e=N.trim().toLowerCase();return $.rows.filter(t=>V===null||V.has(t.id)).filter(t=>e?t.id.toLowerCase().includes(e)||t.statement.toLowerCase().includes(e)||t.status.toLowerCase().includes(e):!0).filter(t=>R==="all"||t.status===R)}function Wt(){if(!A)return;Q().some(t=>t.id===A)||(A=null,I=!1)}function Qe(){const e={window:{x:window.scrollX,y:window.scrollY}},t=m.querySelector(".table-wrap");t&&(e.table={top:t.scrollTop,left:t.scrollLeft});const s=m.querySelector(".field");return s&&(e.field={top:s.scrollTop}),e}function ae(e){if(e.table){const t=m.querySelector(".table-wrap");t&&(t.scrollTop=e.table.top,t.scrollLeft=e.table.left)}if(e.field){const t=m.querySelector(".field");t&&(t.scrollTop=e.field.top)}e.window&&window.scrollTo(e.window.x,e.window.y)}function E(e={}){if(K){Xt();return}if(L){us(e);return}$&&Yt(e)}function Xt(){m.innerHTML=`
    <header class="topbar" data-design="topbar">
      <div>
        <h1 class="brand">${H}</h1>
        ${be()}
      </div>
    </header>
    <main class="cube-refusal" data-design="cube-refusal">
      <p class="cube-refusal-message">${l(K??"")}</p>
    </main>
  `,re()}function Yt(e={}){var d,r;if(!$)return;Wt();const t=I?$.rows.find(o=>o.id===A)??null:null,s=Ue(),n=((r=(d=$.gate)==null?void 0:d.failures)==null?void 0:r.length)??0,a=e.resetMatrixScroll?null:Qe(),i=`
        ${t?hs(t):Jt()}
        ${J("Reads trace-manifest.json only; no target re-scan: this readout is the emitter's, not re-derived here.")}
  `;if(He){m.innerHTML=ht(T==="descent"?Ie():i),re(),me(),requestAnimationFrame(()=>ge());return}m.innerHTML=`
    <header class="topbar${s?" gate-failed":""}" data-design="topbar">
      <div>
        <h1 class="brand">${H}</h1>
        <p class="meta">${l($.targetName)} · manifest ${l($.generatedAt)} · schema v${$.schemaVersion}</p>
        ${s?`<p class="gate-banner" data-design="gate-banner" title="Gate refused this manifest">Golden Thread broken${n?` · ${n} ${n===1?"refusal":"refusals"}`:""}</p>`:'<p class="gate-ok-meta" title="Gate accepted this manifest">Golden Thread intact</p>'}
        ${be()}
      </div>
      <div class="stats" data-design="stats">
        <button type="button" class="stat${R==="all"&&!N.trim()?" active":""}" data-stat-filter="all" title="Show all rows">
          <div class="n">${$.rows.length}</div><div class="l">Rows</div>
        </button>
        <button type="button" class="stat${R==="backlog"&&!N.trim()?" active":""}" data-stat-filter="backlog" title="Show backlog rows">
          <div class="n">${q("backlog")}</div><div class="l">Backlog</div>
        </button>
        <button type="button" class="stat${R==="tracked-debt"&&!N.trim()?" active":""}" data-stat-filter="tracked-debt" title="Show tracked-debt rows">
          <div class="n">${q("tracked-debt")}</div><div class="l">Debt</div>
        </button>
        <button type="button" class="stat${R==="proven"&&!N.trim()?" active":""}" data-stat-filter="proven" title="Show proven rows">
          <div class="n">${q("proven")}</div><div class="l">Proven</div>
        </button>
        <button type="button" class="stat${q("GAP")>0?" stat-gap-hot":""}${R==="GAP"&&!N.trim()?" active":""}" data-stat-filter="GAP" title="Show GAP rows">
          <div class="n">${q("GAP")}</div><div class="l">GAP</div>
        </button>
      </div>
    </header>
    <div class="layout">
      <section class="matrix-pane" data-design="matrix-pane" tabindex="0">
        <h2 class="pane-title">Traceability matrix</h2>
        ${Je()}
        <div class="toolbar" data-design="toolbar">
          <input id="q" type="search" placeholder="Filter by ID or statement…" value="${w(N)}" />
          <select id="status">
            <option value="all"${R==="all"?" selected":""}>All statuses</option>
            ${ze.map(({key:o,label:g})=>`<option value="${o}"${R===o?" selected":""}>${g}</option>`).join(`
            `)}
          </select>
          <!-- @covers FR-ROLL-10: sibling gesture beside find/filter, no apply step -->
          <select id="rollup" title="Roll the descent up by a dimension">
            <option value=""${W===null?" selected":""}>No rollup</option>
            ${qe($).map(o=>`<option value="${w(o.key)}"${W===o.key?" selected":""}>By ${l(o.label)}</option>`).join(`
            `)}
          </select>
        </div>
        ${T==="map"?ss():T==="descent"?Ie():ts()}
      </section>
      <div class="pane-divider" data-design="pane-divider" role="separator" aria-orientation="vertical" title="Drag to resize; double-click to reset"></div>
      <section class="descent-pane" data-design="descent-pane">
        <h2 class="pane-title">Thread</h2>
        ${i}
      </section>
    </div>
  `,re(),X(),me(),a&&(ae(a),requestAnimationFrame(()=>{ae(a),ge()}))}function Jt(){const e=Q();if(e.length===0){const a=R!=="all"?oe(R,q(R)):{title:"No matching rows",body:"Try clearing the search filter."};return`<p class="descent-empty"><strong>${l(a.title)}</strong><br>${l(a.body)}</p>`}const t=Bt,s=Ot,n=e.map(a=>Ft(a,t,l,s,a.id===A?"cross-pinned":"")).join("");return`
      <div class="field-wrap" data-design="field-wrap">
        <div class="field-head" data-design="field-head">${e.length} thread${e.length===1?"":"s"}</div>
        <div class="field" data-design="field">${n}</div>
      </div>
  `}function Pe(e){return`
                <tr class="status-${e.status}${I&&e.id===A?" selected":""}${e.id===A?" cross-pinned":""}" data-id="${w(e.id)}">
                  <td class="id">${l(e.id)}</td>
                  <td><span class="badge ${e.status}">${l(e.status)}</span></td>
                  <td class="statement">${l(rt(Y(e.id,e.statement),140))}</td>
                  <td>${e.proofs.length}</td>
                </tr>`}function et(e){return ze.map(({key:t,label:s})=>e[t]>0?`<span class="badge ${t}" title="${w(s)}">${e[t]} ${l(s)}</span>`:"").filter(Boolean).join(" ")}function Ie(){var r;if(!$)return"";const e=Q(),t=((r=$.gate)==null?void 0:r.executionVerified)===!0,s=`
      <div class="rail-head" data-design="rail-head">
        <div class="rail-head-line">DESCENT · ${l(Ke??$.targetName)}${V?` · ${V.size} id${V.size===1?"":"s"} on this card`:""} · manifest ${l($.generatedAt)}</div>
        <div class="rail-head-flag rail-flag-${t?"on":"off"}" title="${w(t?"gate.executionVerified: proven was derived from a passing test-results report":"gate.executionVerified is false: proven was derived by name matching, with no test-results report read")}">${t?"execution verified":"execution not verified"}</div>
      </div>
      <div class="rail-objective" data-design="rail-objective">
        <span class="dn-level-tag">OBJECTIVE</span>
        <span class="rail-objective-none">no objective declared in this manifest</span>
      </div>`;if(e.length===0){const o=R==="all"?{title:"No matching rows",body:"Try clearing the search filter."}:oe(R,q(R));return`<div class="rail" data-design="rail">${s}
      <div class="table-empty" data-design="table-empty">
        <div class="table-empty-title">${l(o.title)}</div>
        <div class="table-empty-body">${l(o.body)}</div>
      </div></div>`}const n=Tt(e),i=!Ct(e)?'<div class="rail-flat-note" data-design="rail-flat-note">this manifest declares no hierarchy</div>':"",d=n.map(o=>tt(o,t)).join("");return`<div class="rail" data-design="rail">
      ${s}
      ${i}
      <div class="rail-body">${d}</div>
      ${es()}
      ${J("Reads trace-manifest.json only; no target re-scan. Edges are the file's own declared parents, never inferred from an ID family.")}
    </div>`}function tt(e,t){const s=e.row,n=Oe(e),a=Nt(e),i=[];a.planned>0&&i.push(`${a.planned} planned`),a.retired>0&&i.push(`${a.retired} retired`);const d=i.length?`<span class="dn-marks" title="Counted under this node, not coloured into it">${l(i.join(" · "))}</span>`:"",r=s.id===A?" cross-pinned":"";return`
      <div class="dn-group" style="--dn-depth:${e.depth}">
        <div class="dn dn-${n}${r}" data-id="${w(s.id)}" title="${w(`${s.id} · ${s.status}`)}">
          <span class="dn-dot dn-dot-${n}" aria-hidden="true"></span>
          <span class="dn-level-tag">INTENT</span>
          <span class="dn-id">${l(s.id)}</span>
          <span class="dn-tier">${l(Pt[e.tier])}</span>
          <span class="dn-statement" title="${w(Y(s.id,s.statement))}">${l(Y(s.id,s.statement))}</span>
          ${d}
        </div>
        ${Qt(e,t)}
        ${e.children.map(o=>tt(o,t)).join("")}
      </div>`}function Qt(e,t){const s=e.row,n=It(s);if(n==="none")return"";const a=s.implementations.length>0?`<div class="dn-ev dn-ev-build">
          <span class="dn-level-tag">BUILD</span>
          <span class="dn-ev-count">${s.implementations.length} mark${s.implementations.length===1?"":"s"}</span>
          <span class="dn-ev-detail" title="${w(s.implementations.map(r=>`${r.path}:${r.line}`).join(" · "))}">${l(s.implementations.map(r=>`${Z(r.path)}:${r.line}`).join(" · "))}</span>
        </div>`:`<div class="dn-ev dn-ev-nobuild">
          <span class="dn-level-tag">BUILD</span>
          <span class="dn-ev-absent">no file carries this id</span>
        </div>`,i=Dt(e,t),d=s.proofs.length>0?`<div class="dn-ev dn-ev-proof">
          <span class="dn-level-tag">PROOF</span>
          <span class="dn-ev-count">${l(i)}</span>
          <span class="dn-ev-detail" title="${w(s.proofs.map(r=>r.name).join(" · "))}">${l(s.proofs.map(r=>r.name).join(" · "))}</span>
        </div>`:_e(e)?`<div class="dn-ev dn-ev-proof dn-ev-through">
          <span class="dn-level-tag">PROOF</span>
          <span class="dn-ev-count">${l(i)}</span>
          <span class="dn-ev-detail">${l(e.children.filter(r=>r.row.status==="proven").map(r=>r.row.id).join(" · "))}</span>
        </div>`:`<div class="dn-ev dn-ev-noproof">
          <span class="dn-level-tag">PROOF</span>
          <span class="dn-ev-absent">no proof yet</span>
        </div>`;return`<div class="dn-evidence dn-strand-${n}" data-design="dn-evidence">${a}${d}</div>`}function es(){const e=($==null?void 0:$.retired)??[];return e.length===0?"":`<div class="rail-retired" data-design="rail-retired">
      <div class="rail-retired-head">RETIRED · ${e.length} withdrawn on purpose · not positioned on the rail</div>
      ${e.map(t=>`<div class="rail-retired-row"><span class="dn-id">${l(t.id)}</span><span class="dn-tier">${l(t.date??"")}</span><span class="dn-statement">${l(t.reason??"")}</span></div>`).join("")}
    </div>`}function ts(){const e=Q(),t=Ut(),s=e.length===0?(()=>{const i=R==="all"?{title:"No matching rows",body:"Try clearing the search filter."}:oe(R,q(R));return`<div class="table-empty" data-design="table-empty">
            <div class="table-empty-title">${l(i.title)}</div>
            <div class="table-empty-body">${l(i.body)}</div>
          </div>`})():"",n=t?ut(e,t).map(i=>`
                <tr class="rollup-group-header" data-design="rollup-group-header">
                  <td colspan="4">
                    <span class="rollup-group-label">${l(i.label)}</span>
                    <span class="rollup-group-count">${i.rows.length}</span>
                    <span class="rollup-strip" data-design="rollup-strip">${et(i.counts)}</span>
                  </td>
                </tr>${i.rows.map(Pe).join("")}`).join(""):e.map(Pe).join(""),a=$t();return`
        <div class="table-wrap">
          <table data-design="matrix-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Statement</th>
                <th title="${w(a.title)}">${l(a.label)}</th>
              </tr>
            </thead>
            <tbody>
              ${n}
            </tbody>
          </table>
          ${s}
        </div>
  `}function oe(e,t){if(t===0)switch(e){case"GAP":return{title:"No silent gaps",body:"Every AC in this run has proof or tracked debt."};case"tracked-debt":return{title:"No tracked debt",body:"Nothing in this run is deliberately deferred."};case"backlog":return{title:"No bare backlog",body:"Every US/FR/NFR here has its own build or proof, or is tracked as debt."};default:return{title:"Nothing proven yet",body:"No intent here has proof."}}return{title:"No matches",body:"Rows exist in this status, but the current filter hides them."}}function Te(e){const t=Y(e.id,e.statement);return`
    <div class="detail-card status-${e.status}${I&&e.id===A?" selected":""}${e.id===A?" cross-pinned":""}" data-id="${w(e.id)}" title="${w(e.id)} · ${w(e.status)} · ${w(t)}">
      <span class="detail-card-id ${e.status}">${l(e.id)}</span>
      <div class="detail-card-excerpt">${l(t)}</div>
    </div>
  `}function ss(){const e=Q();if(e.length===0){const n=R!=="all"?oe(R,q(R)):{title:"No matching rows",body:"Try clearing the search filter."};return`<div class="map-empty" data-design="map-empty">
      <div class="map-empty-title">${l(n.title)}</div>
      <div class="map-empty-body">${l(n.body)}</div>
    </div>`}const t=bt(e),s=new Map(e.map(n=>[n.id,n]));return`
    <div class="map-wrap-outer" data-design="map-wrap-outer">
      <div class="map-head" data-design="map-head">${t.length} stor${t.length===1?"y":"ies"}</div>
      <div class="map-wrap${P===1?"":` map-wrap-level-${P}`}" data-design="map-wrap">${t.map(n=>ns(n,s)).join("")}</div>
      ${J("Reads trace-manifest.json only; no target re-scan: this readout is the emitter's, not re-derived here.")}
    </div>
  `}function ns(e,t){const s=t.get(e.key);return`
    <div class="map-column" data-design="map-column">
      ${s?`<div class="map-spine-card" data-design="map-spine-card">${Te(s)}</div>`:`
      <div class="map-column-head" data-design="map-column-head">
        <span class="map-column-label">${l(e.label)}</span>
        <span class="map-column-count">${e.rows.length}</span>
        <span class="map-column-strip" data-design="map-column-strip">${et(e.counts)}</span>
      </div>`}
      <div class="map-column-cards">${e.rows.map(Te).join("")}</div>
    </div>
  `}function as(e){m.querySelectorAll(`[data-id="${CSS.escape(e)}"]`).forEach(t=>{t.scrollIntoView({block:"nearest"})})}function rs(){if(!A||!L)return;ye().some(t=>t.rowId===A)||(A=null,I=!1)}function ye(){if(!L)return[];const e=N.trim().toLowerCase();return e?L.rows.filter(t=>{const s=t.provenance,n=typeof s.file=="string"&&s.file||typeof s.path=="string"&&s.path||"";return t.label.toLowerCase().includes(e)||t.statement.toLowerCase().includes(e)||(t.rowId??"").toLowerCase().includes(e)||n.toLowerCase().includes(e)}):L.rows}function is(){if(!L)return"";const e=L.honestLimits.map(t=>`<li>${l(t)}</li>`).join("");return`
      <div class="ghost-provenance-card" data-design="ghost-provenance-card">
        <div class="ghost-provenance-row"><span class="l">Source repo</span><span class="v">${l(L.sourceRepoPath)}</span></div>
        <div class="ghost-provenance-row"><span class="l">Source commit</span><span class="v">${l(L.sourceCommit||"—")}</span></div>
        <div class="ghost-provenance-row"><span class="l">Generated</span><span class="v">${l(L.generatedAt)}</span></div>
        <div class="ghost-provenance-row"><span class="l">Generator</span><span class="v">${l(L.generatorVersion)}</span></div>
        ${e?`<div class="ghost-limits"><div class="l">Honest limits</div><ul>${e}</ul></div>`:""}
        <p class="ghost-epistemic-note">Every row here is proposed and attested by no one. Nothing here is anointed.</p>
      </div>
  `}function we(e){if(e.gap===null)return"";const t=e.gap==="partial"?"PARTIAL":"GAP",s=e.gap==="partial"?"The dig found this partially implemented or partially proven":"The dig found this published in the spec but not implemented or tested";return`<span class="hchip ghostgap" title="${w(s)}">${t}</span>`}function os(e){const t=Ye(),s=e.candidateParent.length>0,n=e.candidateBuild.length>0,a=e.candidateProof!==null,i=e.candidateBuild.length?e.candidateBuild.map(o=>`
              <li>
                <code>${l(o.type||Z(o.file)||"(unnamed)")}</code>
                <div class="path">${F(o.file,o.line,t,l)}</div>
                ${o.provenanceFile?`<div class="path">seen at ${F(o.provenanceFile,o.provenanceLine,t,l)}</div>`:""}
                ${o.basis?`<div class="excerpt">${l(o.basis)}</div>`:""}
              </li>`).join(""):'<li class="empty">No candidate build.</li>',d=e.candidateParent.length?e.candidateParent.map(o=>`
              <li>
                <code>${l(o.parentRowId??"(unresolved)")}</code>
                <div class="path">${l(o.basis||"no basis stated")}</div>
              </li>`).join(""):'<li class="empty">No candidate parent — proposed as its own root.</li>',r=e.candidateProof?`
              <li>
                <code>${l(e.candidateProof.test||"(unnamed test)")}</code>
                <div class="path">${F(e.candidateProof.file,e.candidateProof.line,t,l)}</div>
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
            <div class="gdesc-faint">dug from: ${l(kt(e.provenance))}</div>
          </div>
          <div class="tier ghost-tier${s?"":" ghost-leg-absent"}" data-present="${s}">
            <div class="tier-label">CANDIDATE PARENT</div>
            <ul class="hit-list">${d}</ul>
          </div>
          <div class="tier ghost-tier${n?"":" ghost-leg-absent"}" data-present="${n}">
            <div class="tier-label">CANDIDATE BUILD</div>
            <ul class="hit-list">${i}</ul>
          </div>
          <div class="tier ghost-tier${a?"":" ghost-leg-absent"}" data-present="${a}">
            <div class="tier-label">CANDIDATE PROOF</div>
            <ul class="hit-list">${r}</ul>
          </div>
        </div>
        <p class="ghost-epistemic-note">Proposed only — attested by no one. Anointment is not a button here, it is a pull request.</p>
      </div>
  `}function ls(e){const t=e.rowId?` data-id="${w(e.rowId)}"`:"";return`
                <tr class="ghost-row-tr${I&&e.rowId===A?" selected":""}${e.rowId===A?" cross-pinned":""}"${t}>
                  <td class="id ghost-dim">${l(e.label)}</td>
                  <td><span class="hchip ghostguess">${l(e.typeGuess)} — a guess</span> <span class="hchip ghost">${l(e.epistemicClass.toUpperCase())}</span> ${we(e)}</td>
                  <td class="statement">${l(rt(e.statement,140))}</td>
                  <td>${e.confidence?l(e.confidence):"—"}</td>
                </tr>`}function cs(){const e=ye();return e.length===0?'<div class="table-empty" data-design="table-empty"><div class="table-empty-title">No proposed rows match.</div></div>':`
        <div class="table-wrap">
          <table data-design="matrix-table">
            <thead>
              <tr><th>ID</th><th>Type</th><th>Statement</th><th>Confidence</th></tr>
            </thead>
            <tbody>
              ${e.map(ls).join("")}
            </tbody>
          </table>
        </div>
  `}function xe(e){const t=e.rowId?` data-id="${w(e.rowId)}"`:"";return`
    <div class="detail-card ghost-card${I&&e.rowId===A?" selected":""}${e.rowId===A?" cross-pinned":""}"${t} title="${w(e.label)} · proposed · ${w(e.typeGuess)}">
      <span class="detail-card-id ghost-dim">${l(e.label)}</span>
      <span class="hchip ghostguess">${l(e.typeGuess)} — a guess</span> <span class="hchip ghost">${l(e.epistemicClass.toUpperCase())}</span> ${we(e)}
      <div class="detail-card-excerpt">${l(e.statement)}</div>
    </div>
  `}function ds(){const e=ye();if(e.length===0)return'<div class="map-empty" data-design="map-empty"><div class="map-empty-title">No proposed rows match.</div></div>';const t=At(e),s=new Map;for(const n of e)n.rowId&&s.set(n.rowId,n);return`
    <div class="map-wrap-outer" data-design="map-wrap-outer">
      <div class="map-head" data-design="map-head">${t.length} propos${t.length===1?"al":"als"}</div>
      <div class="map-wrap ghost-map-wrap${P===1?"":` map-wrap-level-${P}`}" data-design="map-wrap">${t.map(n=>ps(n,s)).join("")}</div>
      ${J("Reads the dig-report only; no target re-scan: this readout is the excavation tool's own, not re-derived here.")}
    </div>
  `}function ps(e,t){const s=t.get(e.key);return`
    <div class="map-column ghost-map-column" data-design="map-column">
      ${s?`<div class="map-spine-card ghost-spine-card" data-design="map-spine-card">${xe(s)}</div>`:`
      <div class="map-column-head ghost-column-head" data-design="map-column-head">
        <span class="map-column-label">${l(e.label)}</span>
        <span class="map-column-count">${e.rows.length}</span>
      </div>`}
      <div class="map-column-cards">${e.rows.map(xe).join("")}</div>
    </div>
  `}function us(e={}){if(!L)return;rs();const t=I?L.rows.find(d=>d.rowId===A)??null:null,s=e.resetMatrixScroll?null:Qe(),n=new Map;for(const d of L.rows)n.set(d.typeGuess,(n.get(d.typeGuess)??0)+1);const a=[...n.entries()].sort(([d],[r])=>d.localeCompare(r)).map(([d,r])=>`<span class="hchip ghostguess">${r} ${l(d)}</span>`).join(" "),i=`
        ${t?os(t):is()}
        ${J("Reads the dig-report only; no target re-scan: this readout is the excavation tool's own, not re-derived here.")}
  `;m.innerHTML=`
    <header class="topbar ghost-topbar" data-design="topbar">
      <div>
        <h1 class="brand">${H}</h1>
        <p class="meta">${l(L.sourceRepoPath)} · dig ${l(L.generatedAt)} · ${l(L.generatorVersion)}</p>
        <p class="ghost-epistemic-banner" title="Every row here is a proposal">Proposed only — attested by no one</p>
        ${be()}
      </div>
      <div class="stats ghost-stats" data-design="stats">
        <div class="stat"><div class="n">${L.rows.length}</div><div class="l">Proposed</div></div>
        <div class="ghost-type-chips">${a}</div>
      </div>
    </header>
    <div class="layout">
      <section class="matrix-pane" data-design="matrix-pane" tabindex="0">
        <h2 class="pane-title">Proposed rows</h2>
        ${Je()}
        <div class="toolbar" data-design="toolbar">
          <input id="q" type="search" placeholder="Filter by ID or statement…" value="${w(N)}" />
        </div>
        ${T==="map"?ds():cs()}
      </section>
      <div class="pane-divider" data-design="pane-divider" role="separator" aria-orientation="vertical" title="Drag to resize; double-click to reset"></div>
      <section class="descent-pane" data-design="descent-pane">
        <h2 class="pane-title">Thread</h2>
        ${i}
      </section>
    </div>
  `,re(),X(),me(),at(),s&&(ae(s),requestAnimationFrame(()=>ae(s)))}function re(){var i,d,r,o,g,k,h,f,c,v,S;(i=m.querySelector("#loadManifest"))==null||i.addEventListener("click",()=>{var u;(u=m.querySelector("#manifestFile"))==null||u.click()}),(d=m.querySelector("#loadDig"))==null||d.addEventListener("click",()=>{var u;(u=m.querySelector("#digFile"))==null||u.click()}),(r=m.querySelector("#digFile"))==null||r.addEventListener("change",u=>{var y;const p=(y=u.target.files)==null?void 0:y[0];p&&Me(p),u.target.value=""}),(o=m.querySelector("#manifestFile"))==null||o.addEventListener("change",u=>{var y;const p=(y=u.target.files)==null?void 0:y[0];p&&Me(p)}),(g=m.querySelector("#q"))==null||g.addEventListener("input",u=>{var y;N=u.target.value,E({resetMatrixScroll:!0}),(y=m.querySelector("#q"))==null||y.focus();const p=m.querySelector("#q");p&&(p.selectionStart=p.selectionEnd=p.value.length)}),(k=m.querySelector("#status"))==null||k.addEventListener("change",u=>{R=u.target.value,E({resetMatrixScroll:!0})}),(h=m.querySelector("#rollup"))==null||h.addEventListener("change",u=>{const p=u.target.value;W=p===""?null:p,E({resetMatrixScroll:!0})}),m.querySelectorAll("[data-stat-filter]").forEach(u=>{u.addEventListener("click",()=>{const p=u.getAttribute("data-stat-filter");p&&(N="",R=p==="all"?"all":p,E({resetMatrixScroll:!0}))})}),m.querySelectorAll(".lens-tab[data-lens]").forEach(u=>{u.addEventListener("click",()=>{const p=u.getAttribute("data-lens");!p||p===T||(T=p,E({resetMatrixScroll:!0}))})}),m.querySelectorAll("tbody tr[data-id], .strand[data-id], .detail-card[data-id]").forEach(u=>{u.addEventListener("click",()=>{const p=u.getAttribute("data-id");p&&(A=p,I=!0,E(),requestAnimationFrame(()=>as(p)))})});const e=u=>{m.querySelectorAll(".cross-hover").forEach(p=>p.classList.remove("cross-hover")),u&&m.querySelectorAll(`[data-id="${CSS.escape(u)}"]`).forEach(p=>p.classList.add("cross-hover"))};let t=null;const s=u=>{if(T==="map")return;const p=m.querySelector(".matrix-pane");p&&(t=p,p.style.minHeight=`${p.getBoundingClientRect().height}px`),m.querySelectorAll("tbody tr[data-id]").forEach(y=>{y.getAttribute("data-id")!==u&&y.classList.add("cross-isolated")})},n=()=>{m.querySelectorAll(".cross-isolated").forEach(u=>u.classList.remove("cross-isolated")),t&&(t.style.minHeight="",t=null)};m.querySelectorAll(".strand[data-id]").forEach(u=>{u.addEventListener("mouseenter",()=>{const p=u.getAttribute("data-id");e(p),p&&s(p)}),u.addEventListener("mouseleave",()=>{e(null),n()})}),m.querySelectorAll("tbody tr[data-id], .detail-card[data-id]").forEach(u=>{u.addEventListener("mouseenter",()=>e(u.getAttribute("data-id"))),u.addEventListener("mouseleave",()=>e(null))}),(f=m.querySelector("[data-descent-back]"))==null||f.addEventListener("click",()=>{if(I=!1,E(),A){const u=A;requestAnimationFrame(()=>{var p;(p=m.querySelector(`.strand[data-id="${CSS.escape(u)}"]`))==null||p.scrollIntoView({block:"nearest"})})}}),(c=m.querySelector("[data-zoom-in]"))==null||c.addEventListener("click",()=>{P=te(P+1),E()}),(v=m.querySelector("[data-zoom-out]"))==null||v.addEventListener("click",()=>{P=te(P-1),E()}),(S=m.querySelector(".matrix-pane"))==null||S.addEventListener("keydown",u=>{if(T!=="map")return;const p=u.key;p==="+"||p==="="?(P=te(P+1),E()):(p==="-"||p==="_")&&(P=te(P-1),E())});const a=m.querySelector(".pane-divider");a&&(a.addEventListener("pointerdown",u=>{const p=m.querySelector(".layout");if(!p)return;u.preventDefault(),a.setPointerCapture(u.pointerId),a.classList.add("dragging"),document.body.classList.add("pane-resizing");const y=p.getBoundingClientRect(),x=C=>{const U=(C.clientX-y.left)/Math.max(y.width,1);_=Math.min(We,Math.max(Ze,U)),X()},j=C=>{a.releasePointerCapture(C.pointerId),a.classList.remove("dragging"),document.body.classList.remove("pane-resizing"),a.removeEventListener("pointermove",x),a.removeEventListener("pointerup",j),a.removeEventListener("pointercancel",j),_!==null&&window.localStorage.setItem(ne,String(_))};a.addEventListener("pointermove",x),a.addEventListener("pointerup",j),a.addEventListener("pointercancel",j)}),a.addEventListener("dblclick",()=>{_=null,window.localStorage.removeItem(ne),X()})),m.querySelectorAll(".source-toggle").forEach(u=>{u.addEventListener("click",()=>{const p=u.getAttribute("data-source-key");if(p){if(z.has(p)){z.delete(p),E();return}if(z.add(p),E(),!G.has(p)){const y=u.getAttribute("data-source-path"),x=Number(u.getAttribute("data-source-line"));gs(p,y,x)}}})})}function st(e,t){const s=yt(e);return $e=t,s==="trace-manifest"?($=lt(e),L=null,K=null,Ne(),{kind:s}):s==="dig-report"?(L=St(e),$=null,K=null,Ne(),{kind:s}):s==="cost-cube"?($=null,L=null,K="This is a cost-cube. Tally reads those.",{kind:s}):{kind:s,message:"Not a supported artifact — expected a trace-manifest, a dig-report, or a cost-cube."}}function Ne(){z.clear(),G.clear(),N="",R="all",A=null,I=!1}async function Me(e){try{const t=await e.text(),s=JSON.parse(t),n=st(s,"user-file");if(n.kind==="unknown"){window.alert(n.message);return}E({resetMatrixScroll:!0})}catch(t){window.alert(`Could not read file: ${t}`)}}function fs(e){switch(e){case"GAP":return"No proof: silent gap (Golden Thread broken)";case"tracked-debt":return"No proof: tracked as debt";case"backlog":return"No own proof: backlog altitude (not a silent gap)";default:return"No proof"}}function hs(e){const t=Ye(),s=e.status==="GAP",n=e.status==="tracked-debt",a=e.status==="backlog",i=Ue(),d=n||a,r=De(e),o=gt(e),g=e.implementations.length===0,k=e.proofs.length===0,h=k&&(s||i),f=g&&mt(e),c=g?f?" lawful-absence":d?" missing-honest":" missing-impl":"",v=g?f?" carrier-lawful":d?" carrier-honest":" missing-carrier":"",S=h?" frayed":k&&d?" missing-honest":"",u=h?" frayed":k&&d?" carrier-honest":"",p=e.implementations.length===0?`<li class="empty${v}">${f?ve(e)?"no build mark · proof binds directly to intent":"no build mark · none claimed":a?"No own @covers (backlog altitude)":"No @covers found"}</li>`:e.implementations.map(b=>{const M=pe(b.path,b.line),D=z.has(M),Se=$s(b.excerpt,e.id);return`
              <li>
                <button type="button" class="source-toggle" data-source-key="${w(M)}" data-source-path="${w(b.path)}" data-source-line="${b.line}" aria-expanded="${D}">
                  <span class="proof-caret">${D?"▾":"▸"}</span>
                  <code>${l(Z(b.path))}:${b.line}</code>
                </button>
                <div class="path">${F(b.path,b.line,t,l)}</div>
                ${Se.length?`<div class="excerpt">also covers: ${l(Se.join(", "))}</div>`:""}
                ${D?ue(G.get(M)):""}
              </li>`}).join(""),y=e.carryingTasks??[],x=y.length===0?"":`<div class="debt-block">
        <div class="debt-label">Open debt (Carries:)</div>
        <ul class="hit-list debt-list">
          ${y.map(b=>`
            <li>
              <div class="path">${F(b.path,b.line,t,l)}</div>
              <div class="excerpt">${l(b.excerpt)}</div>
            </li>`).join("")}
        </ul>
      </div>`,j=o==="coverage-proven"&&!i?(()=>{const b=vt(e);return`<li class="coverage-proven"><code>${l(Z(b.path))}:${b.line}</code><div class="path">Covered by ${F(b.path,b.line,t,l)}: no test required for this type</div></li>`})():e.proofs.length===0?`<li class="empty${u}">${l(i&&!s?"Golden Thread broken":n&&y.length>0?"No proof: tracked as open debt (see above)":fs(e.status))}</li>`:e.proofs.map(b=>{const M=pe(b.path,b.line),D=z.has(M);return`
              <li>
                <button type="button" class="source-toggle" data-source-key="${w(M)}" data-source-path="${w(b.path)}" data-source-line="${b.line}" aria-expanded="${D}">
                  <span class="proof-caret">${D?"▾":"▸"}</span>
                  <code>${l(b.name)}</code>
                </button>
                <div class="path">${F(b.path,b.line,t,l)}</div>
                ${D?ue(G.get(M)):""}
              </li>`}).join(""),C=e.registry??null;let U="";if(C){const b=pe(C.path,C.line),M=z.has(b),D=C.path.includes("/")||Ge(C.path,C.line,t)!==null;U=`
      <ul class="hit-list registry-list">
        <li>
          <button type="button" class="source-toggle" data-source-key="${w(b)}" data-source-path="${w(C.path)}" data-source-line="${C.line}" aria-expanded="${M}">
            <span class="proof-caret">${M?"▾":"▸"}</span>
            <code>${l(Z(C.path))}:${C.line}</code>
          </button>
          ${D?`<div class="path">${F(C.path,C.line,t,l)}</div>`:""}
          ${M?ue(G.get(b)):""}
        </li>
      </ul>`}return`
    ${Ve?`<div class="descent-head" data-design="descent-head">
      <button type="button" class="descent-back" data-descent-back title="Back to field">‹ Back to field</button>
    </div>`:""}
    <div class="thread${i?" gate-broken":""}" data-design="descent-thread" data-status="${e.status}">
      <svg class="thread-rail" aria-hidden="true"></svg>
      <article class="tier${fe(e.status)==="amber"?" debt":""}" data-design="tier-requirement" data-broken="false">
        <div class="tier-label">Intent</div>
        <div class="tier-id">${l(e.id)}</div>
        <div class="tier-body">${l(Y(e.id,e.statement))}</div>
        ${U}
        <p class="meta" style="margin-top:0.6rem"><span class="badge ${e.status}">${l(e.status)}</span></p>
        ${r?'<p class="incoherence-note" data-design="incoherence-note">status claims proven; manifest lists no proof</p>':""}
        ${x}
      </article>
      <article class="tier${c}" data-design="tier-implementation" data-broken="false">
        <div class="tier-label">Build</div>
        <div class="tier-id">${l(e.id)}</div>
        <ul class="hit-list">${p}</ul>
      </article>
      <article class="tier${S}" data-design="tier-proof" data-broken="${h?"true":"false"}">
        <div class="tier-label">Proof</div>
        <div class="tier-id">${l(e.id)}</div>
        <ul class="hit-list">${j}</ul>
      </article>
    </div>
  `}function nt(e,t,s,n,a,i=!1){const r=B*(a===0?1:-1),o=i?n:-n,g=t+(s-t)*.33,k=t+(s-t)*.67,h=e+o+r,f=e+o-r;return`M ${e} ${t} C ${h} ${g} ${f} ${k} ${e} ${s}`}function ms(e,t,s,n,a=!1){const i=Math.sign(s-t)||1,d=s-t;let r=t+d*.5,o=r+i*le;const g=s-i*18;i>0?(o=Math.min(o,g),r=Math.min(r,o-i*le)):(o=Math.max(o,g),r=Math.max(r,o-i*le));const k=t+(r-t)*.55,h=a?n:-n,f=`M ${e} ${t} C ${e+h+B} ${k} ${e+h+B*.35} ${t+(r-t)*.85} ${e+B*.4} ${r}`,c=`M ${e} ${t} C ${e+h-B} ${k} ${e+h-B*.35} ${t+(o-t)*.85} ${e-B*.4} ${o}`;return{short:f,long:c}}function ge(){const e=m.querySelector(".thread"),t=e==null?void 0:e.querySelector(".thread-rail");if(!e||!t)return;const s=[...e.querySelectorAll(":scope > .tier")];if(s.length<2){t.replaceChildren();return}const n=parseFloat(getComputedStyle(document.documentElement).fontSize)||16,a=s.map(f=>({x:f.offsetLeft-.95*n+4.5,y:f.offsetTop+1.1*n+4.5,top:f.offsetTop,bottom:f.offsetTop+f.offsetHeight,broken:f.getAttribute("data-broken")==="true"})),i=Math.max(e.clientWidth,48),d=Math.max(e.scrollHeight,1),r=O+6,o=O+8;t.style.left=`${-r}px`,t.style.width=`${i+r+o}px`,t.style.height=`${d}px`,t.setAttribute("width",String(i+r+o)),t.setAttribute("height",String(d)),t.setAttribute("viewBox",`${-r} 0 ${i+r+o} ${d}`);const g="http://www.w3.org/2000/svg",k=document.createDocumentFragment(),h=a.length-2;for(let f=0;f<a.length-1;f++){const c=a[f],v=a[f+1],S=c.broken||v.broken,u=S&&f===h,p=document.createElementNS(g,"g");if(p.classList.add("seg",S?"seg-frayed":"seg-braid"),u&&p.classList.add("seg-reflect"),p.setAttribute("data-seg",String(f)),S){const y=c.broken&&!v.broken,x=y?v:c,j=y?c:v,{short:C,long:U}=ms(c.x,x.y,j.y,O,u),ee=document.createElementNS(g,"path");ee.setAttribute("d",C),ee.classList.add("strand","strand-die","strand-short");const b=document.createElementNS(g,"path");b.setAttribute("d",U),b.classList.add("strand","strand-die","strand-long"),p.appendChild(ee),p.appendChild(b)}else for(const y of[0,1]){const x=document.createElementNS(g,"path");x.setAttribute("d",nt(c.x,c.y,v.y,O,y)),x.classList.add("strand",y===0?"strand-a":"strand-b"),p.appendChild(x)}k.appendChild(p)}t.replaceChildren(k)}function at(){const e=m.querySelector(".ghost-thread"),t=e==null?void 0:e.querySelector(".ghost-rail");if(!e||!t)return;const s=[...e.querySelectorAll(":scope > .tier")];let n=-1;for(const f of s){if(f.getAttribute("data-present")!=="true")break;n+=1}if(n<1){t.replaceChildren();return}const a=parseFloat(getComputedStyle(document.documentElement).fontSize)||16,i=s.slice(0,n+1).map(f=>({x:f.offsetLeft-.95*a+4.5,y:f.offsetTop+1.1*a+4.5})),d=Math.max(e.clientWidth,48),r=Math.max(e.scrollHeight,1),o=O+6,g=O+8;t.style.left=`${-o}px`,t.style.width=`${d+o+g}px`,t.style.height=`${r}px`,t.setAttribute("width",String(d+o+g)),t.setAttribute("height",String(r)),t.setAttribute("viewBox",`${-o} 0 ${d+o+g} ${r}`);const k="http://www.w3.org/2000/svg",h=document.createDocumentFragment();for(let f=0;f<i.length-1;f++){const c=i[f],v=i[f+1],S=document.createElementNS(k,"path");S.setAttribute("d",nt(c.x,c.y,v.y,O,0)),S.classList.add("ghost-strand"),h.appendChild(S)}t.replaceChildren(h)}function ue(e){if(!e)return'<div class="proof-source proof-source-loading">Loading source…</div>';if("error"in e)return`<div class="proof-source ${e.info?"proof-source-info":"proof-source-error"}">${l(e.error)}</div>`;const t=e.lines.map(s=>`<div class="src-line${s.isTarget?" src-line-target":""}"><span class="src-n">${s.n}</span><span class="src-text">${l(s.text)}</span></div>`).join("");return`
    <div class="proof-source">
      <div class="proof-source-path">${l(e.path)} · lines ${e.startLine}–${e.endLine} of ${e.totalLines}</div>
      <div class="proof-source-code">${t}</div>
    </div>
  `}async function gs(e,t,s){var n;if($){if(!zt()){G.set(e,{info:!0,error:"Source peek is off for artifacts you load yourself — nothing from this file leaves your machine. Run Loupe locally against the repository to read source in place."}),E();return}try{const a=`/api/source?repoPath=${encodeURIComponent($.repoPath)}&path=${encodeURIComponent(t)}&line=${s}`,i=await fetch(a);((n=i.headers.get("content-type"))==null?void 0:n.includes("application/json"))?G.set(e,await i.json()):G.set(e,{info:!0,error:"This hosted demo reads the trace-manifest only. The source line above is shown in full when Loupe runs locally against the repository."})}catch(a){const i=a instanceof TypeError;G.set(e,{error:i?"Can't reach the Loupe dev server, so source can't be read from disk. Restart it (`npm run viz:dev` in loupe) and reload this page.":String(a)})}E()}}const vs=/(?:FR|NFR|AC|US)-[A-Z][A-Z0-9]{1,5}-[0-9]{2,}[a-z]?/g;function Z(e){const t=e.lastIndexOf("/");return t===-1?e:e.slice(t+1)}function $s(e,t){const s=e.match(vs)??[];return[...new Set(s)].filter(n=>n!==t)}function rt(e,t){const s=e.replace(/\s+/g," ").trim();return s.length<=t?s:`${s.slice(0,t-1)}…`}function Y(e,t){const s=t.replace(/\*\*/g,""),n=e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return s.replace(new RegExp(`^\\s*${n}\\s*[—:–-]\\s*`),"").trim()}function l(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function w(e){return l(e).replaceAll("'","&#39;")}Zt();

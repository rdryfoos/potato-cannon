(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const u of o.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&n(u)}).observe(document,{childList:!0,subtree:!0});function s(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(a){if(a.ep)return;a.ep=!0;const o=s(a);fetch(a.href,o)}})();const Ue=[3,4,5];function He(e){return typeof e=="number"&&Ue.includes(e)}function Ve(e){const t=e??{},s=Array.isArray(t.rows)?t.rows.map(Ke):[];return{...t,rows:s}}function Ke(e){const t=e??{},s=t.carryingTasks??t.debtTasks??[],{debtTasks:n,...a}=t,o=t.origin,u=t.registry??((o==null?void 0:o.kind)==="registry-line"&&o.path?{path:o.path,line:o.line??0}:t.registry),r=We(typeof t.id=="string"?t.id:"");return{...a,carryingTasks:s,area:r,...u!==void 0?{registry:u}:{}}}const Ze=/^(?:FR|NFR|AC|US)-([A-Z][A-Z0-9]{1,5})-[0-9]{2,}[a-z]?$/;function We(e){const t=Ze.exec(e);return t?t[1]:"Unclassified"}function Ee(e){const t=[{key:"area",label:"Area",groupOf:n=>n.area}];return e.rows.some(n=>{var a;return(((a=n.parents)==null?void 0:a.length)??0)>0})&&t.push({key:"user-story",label:"User story",groupOf:n=>n.parents&&n.parents.length>0?n.parents[0]:null}),t}function Xe(e,t){const s=new Map;for(const n of e){const a=t.groupOf(n);if(a===null)continue;const o=s.get(a);o?o.push(n):s.set(a,[n])}return[...s.entries()].map(([n,a])=>({key:n,label:n,rows:a,counts:Y(a)}))}function Y(e){const t={proven:0,"tracked-debt":0,backlog:0,GAP:0};for(const s of e)t[s.status]++;return t}function Ye(e){switch(e){case"proven":return"green";case"tracked-debt":return"amber";case"backlog":return"blue";case"GAP":return"red"}}function Je(e,t){var s;if(t)return(s=e.find(n=>n.id===t))==null?void 0:s.id}function Qe(e){return`
    <section class="descent-pane" data-design="descent-pane">
      <h2 class="pane-title">Descent</h2>
      ${e}
    </section>
    `}function pe(e){return e.tier?e.tier==="criterion":e.type==="AC"}function Pe(e){return e.status==="proven"&&pe(e)&&e.proofs.length===0}function et(e){return e.status==="proven"&&e.implementations.length===0&&!Pe(e)}function tt(e){return e.proofs.length>0?"execution-verified":e.status==="proven"&&!pe(e)&&e.implementations.length>0?"coverage-proven":"no-proof"}function st(e){const t=e.implementations[0];return t?{path:t.path.replace(/^\.\//,""),line:t.line}:null}function nt(){return{label:"Own proofs",title:"Direct test proofs on this row's own ID; a proven row can read 0 here when it's proven via a covered implementation or transitively through its children -- the Status badge is the row's real verdict, this column is narrower than that."}}function at(e){const t=new Map;for(const i of e)t.set(i.id,i);const s=new Map;for(const i of e)i.type==="US"&&s.set(i.id,i);function n(i){var T;const g=new Set;let $=i;for(;$&&(((T=$.parents)==null?void 0:T.length)??0)>0;){const d=$.parents.find(p=>t.has(p));if(!d||g.has(d))return null;if(g.add(d),s.has(d))return d;$=t.get(d)}return null}const a=new Map;for(const i of e){if(i.type==="US")continue;const g=n(i);if(!g)continue;const $=a.get(g);$?$.push(i):a.set(g,[i])}const o=new Set,u=(i,g)=>i.id.localeCompare(g.id),r=[...a.entries()].sort(([i],[g])=>i.localeCompare(g)).map(([i,g])=>{o.add(i);for(const T of g)o.add(T.id);const $=g.slice().sort(u);return{key:i,label:s.get(i).statement,rows:$,counts:Y($)}}),c=e.filter(i=>!o.has(i.id)),y=new Map,w=[];for(const i of c)if(i.area&&i.area!=="Unclassified"){const g=y.get(i.area);g?g.push(i):y.set(i.area,[i])}else w.push(i);const h=[...y.entries()].sort(([i],[g])=>i.localeCompare(g)).map(([i,g])=>{const $=g.slice().sort(u);return{key:i,label:i,rows:$,counts:Y($)}}),f=w.length===0?[]:[{key:"unparented",label:"Unparented",rows:w.slice().sort(u),counts:Y(w)}];return[...r,...h,...f]}function ot(e){if(!e||typeof e!="object")return"unknown";const t=e;if(He(t.schemaVersion)&&Array.isArray(t.rows))return"trace-manifest";const s=t.rows??t.candidates??t.proposedRows,n=Array.isArray(s)&&s.length>0?s[0]:null,a=!!n&&("rowId"in n||"epistemicClass"in n||"candidateParent"in n||"typeGuess"in n);return Array.isArray(s)&&(typeof t.generatorVersion=="string"||typeof t.generator=="string"||Array.isArray(t.honestLimits)||a)?"dig-report":(typeof t.formatVersion=="string"||typeof t.formatVersion=="number")&&("events"in t||"pricedEvents"in t||"resolvedRepo"in t)?"cost-cube":"unknown"}function rt(e){const t=e??{},s=t.provenance??t.source??{},n=typeof s.testName=="string"?s.testName:void 0,a=typeof t.statement=="string"?t.statement:"",o=typeof t.label=="string"&&t.label||typeof t.candidateLabel=="string"&&t.candidateLabel||typeof t.id=="string"&&t.id||typeof t.candidateId=="string"&&t.candidateId||n||a.slice(0,40)||"(unlabeled)",r=(Array.isArray(t.candidateParent)?t.candidateParent:[]).map(f=>{const i=f??{};return{parentRowId:typeof i.parentRowId=="string"?i.parentRowId:null,basis:typeof i.basis=="string"?i.basis:""}}),c=t.candidateProof,y=c?{test:typeof c.test=="string"&&c.test||typeof c.testName=="string"&&c.testName||"",file:typeof c.file=="string"?c.file:"",line:c.line!==void 0&&c.line!==null?String(c.line):"",basis:typeof c.basis=="string"?c.basis:""}:(s.source==="test"||s.sourceKind==="test"||s.kind==="test")&&(s.testName||s.test)?{test:s.testName||s.test||"",file:s.file||s.path||"",line:"",basis:"same-artifact"}:null,h=(Array.isArray(t.candidateBuild)?t.candidateBuild:t.candidateBuild&&typeof t.candidateBuild=="object"?[t.candidateBuild]:[]).map(f=>{const i=f??{},g=i.provenance??{};return{file:typeof i.file=="string"?i.file:"",line:i.line!==void 0&&i.line!==null?String(i.line):"",type:typeof i.importedType=="string"&&i.importedType||typeof i.type=="string"&&i.type||typeof i.method=="string"&&i.method||"",provenanceFile:typeof g.file=="string"?g.file:"",provenanceLine:g.line!==void 0&&g.line!==null?String(g.line):"",basis:typeof i.basis=="string"?i.basis:""}});return{rowId:typeof t.rowId=="string"?t.rowId:null,label:o,statement:a,typeGuess:(typeof t.typeGuess=="string"&&t.typeGuess||typeof t.type=="string"&&t.type||"?").toUpperCase(),epistemicClass:typeof t.epistemicClass=="string"&&t.epistemicClass||typeof t.epistemic=="string"&&t.epistemic||"inferred",confidence:typeof t.confidence=="string"&&t.confidence||typeof t.confidenceSignal=="string"&&t.confidenceSignal||null,suggestedArea:typeof t.suggestedArea=="string"&&t.suggestedArea||typeof t.area=="string"&&t.area||null,provenance:s,candidateParent:r,candidateProof:y,candidateBuild:h,gap:t.gap===!0?!0:t.gap==="partial"?"partial":null}}function it(e){const t=e??{};return{rows:(Array.isArray(t.rows)&&t.rows||Array.isArray(t.candidates)&&t.candidates||Array.isArray(t.proposedRows)&&t.proposedRows||[]).map(rt),generatorVersion:typeof t.generatorVersion=="string"&&t.generatorVersion||typeof t.generator=="string"&&t.generator||"?",sourceRepoPath:typeof t.sourceRepoPath=="string"&&t.sourceRepoPath||typeof t.sourceRepo=="string"&&t.sourceRepo||typeof t.repo=="string"&&t.repo||"?",generatedAt:typeof t.generatedAt=="string"&&t.generatedAt||"?",sourceCommit:typeof t.sourceCommit=="string"&&t.sourceCommit||typeof t.commit=="string"&&t.commit||"",honestLimits:Array.isArray(t.honestLimits)?t.honestLimits.filter(n=>typeof n=="string"):[]}}function lt(e){const t=new Map;for(const h of e)h.rowId&&t.set(h.rowId,h);const s=new Map;for(const h of e){const f=h.candidateParent[0],i=f==null?void 0:f.parentRowId;if(!i||!t.has(i)||i===h.rowId)continue;const g=s.get(i);g?g.push(h):s.set(i,[h])}const n=new Set,a=(h,f)=>h.label.localeCompare(f.label),o=[...s.entries()].sort(([h],[f])=>h.localeCompare(f)).map(([h,f])=>{n.add(h);for(const i of f)i.rowId&&n.add(i.rowId);return{key:h,label:t.get(h).label,rows:f.slice().sort(a)}}),u=e.filter(h=>!h.rowId||!n.has(h.rowId)),r=new Map,c=[];for(const h of u)if(h.suggestedArea){const f=r.get(h.suggestedArea);f?f.push(h):r.set(h.suggestedArea,[h])}else c.push(h);const y=[...r.entries()].sort(([h],[f])=>h.localeCompare(f)).map(([h,f])=>({key:h,label:h,rows:f.slice().sort(a)})),w=c.length===0?[]:[{key:"unparented",label:"no proposed parent",rows:c.slice().sort(a)}];return[...o,...y,...w]}function ct(e){if(!e||typeof e!="object")return"—";const t=typeof e.sourceKind=="string"&&e.sourceKind||typeof e.kind=="string"&&e.kind||typeof e.source=="string"&&e.source||"",s=typeof e.file=="string"&&e.file||typeof e.path=="string"&&e.path||"",n=e.line??e.lineRange??e.lines,a=n!=null?String(n):"",o=typeof e.testName=="string"&&e.testName||typeof e.test=="string"&&e.test||"",u=[t,s+(a?":"+a:""),o?"test: "+o:""].filter(Boolean);return u.length?u.join(" · "):"—"}const dt=/^(?:https?:\/\/)?((?:[\w-]+\.)+[a-z]{2,}\/[\w.-]+\/[\w.-]+?)\/?$/i;function be(e){const t=e??{},s=typeof t.sourceRepoPath=="string"&&t.sourceRepoPath||typeof t.repoPath=="string"&&t.repoPath||"",n=typeof t.sourceCommit=="string"&&t.sourceCommit||typeof t.commit=="string"&&t.commit||null,a=dt.exec(s.trim());return{remote:a?`https://${a[1]}`:null,commit:n||null}}function Re(e,t,s){if(!s.remote||!e)return null;const n=e.replace(/^\.\//,"").replace(/^\//,""),a=t==null||t===""?"":String(t),o=a&&/^\d+$/.test(a)?`#L${a}`:"";return`${s.remote}/blob/${s.commit||"main"}/${n}${o}`}function _(e,t,s,n,a={}){const o=t==null||t===""?"":String(t),u=`${a.prefix??""}${e}${o?`:${o}`:""}`,r=Re(e,t,s);return r?`<a class="src-link" href="${n(r)}" target="_blank" rel="noopener">${n(u)}</a>`:n(u)}function pt(e){return{buildEarned:!!(e.implementations&&e.implementations.length>0),proofEarned:!!(e.proofs&&e.proofs.length>0)}}function ut(e){return e.statement.replace(/^\S+\s+—\s*/,"")}function ft(e,t,s,n=78,a=""){const{buildEarned:o}=pt(e),u=ut(e),r=t/2;let c;return e.status==="proven"?c=`<path d="M${r} 8 C ${r-2} 30, ${r+2} 52, ${r} 72" style="stroke:var(--muted)" stroke-width="1.4" fill="none" opacity=".85"/><circle cx="${r}" cy="8" r="2.5" style="fill:var(--ok)"/><circle cx="${r}" cy="40" r="2.5" style="fill:var(--ok)"/><circle cx="${r}" cy="72" r="2.5" style="fill:var(--ok)"/>`:e.status==="tracked-debt"?c=`<path d="M${r} 8 C ${r-2} 30, ${r+2} 52, ${r} 72" style="stroke:var(--muted)" stroke-width="1.4" fill="none" opacity=".85"/><circle cx="${r}" cy="8" r="2.5" style="fill:var(--ok)"/><circle cx="${r}" cy="40" r="2.5" style="fill:var(--debt)"/><circle cx="${r}" cy="72" r="2.5" fill="none" style="stroke:var(--debt)" stroke-width="1.2"/>`:e.status==="backlog"?c=`<path d="M${r} 8 L ${r} 22" style="stroke:var(--muted)" stroke-width="1.4" opacity=".8"/><path d="M${r} 22 C ${r-2} 34, ${r+2} 42, ${r-1} 50" style="stroke:var(--muted)" stroke-width="1" fill="none" opacity=".3" stroke-dasharray="2 3"/><circle cx="${r}" cy="8" r="2.5" style="fill:var(--brand-accent)"/><circle cx="${r}" cy="40" r="2.5" style="fill:var(--muted)"/><circle cx="${r}" cy="72" r="2.5" style="fill:var(--muted)"/>`:c=o?`<path d="M${r} 8 C ${r-2} 30, ${r+2} 52, ${r} 72" style="stroke:var(--muted)" stroke-width="1.4" fill="none" opacity=".85"/><circle cx="${r}" cy="8" r="2.5" style="fill:var(--ok)"/><circle cx="${r}" cy="40" r="2.5" style="fill:var(--ok)"/><circle cx="${r}" cy="72" r="2.5" style="fill:var(--gap)"/>`:`<path d="M${r} 8 C ${r-2} 24, ${r+2} 32, ${r} 40" style="stroke:var(--muted)" stroke-width="1.4" fill="none" opacity=".6"/><circle cx="${r}" cy="8" r="2.5" style="fill:var(--ok)"/><circle cx="${r}" cy="40" r="2.5" style="fill:var(--gap)"/>`,`<button type="button" class="${a?`strand ${a}`:"strand"}" data-id="${s(e.id)}" title="${s(e.id)} · ${s(e.status)} · ${s(u)}"><svg width="${t}" height="${n}" viewBox="0 0 ${t} 78" xmlns="http://www.w3.org/2000/svg">${c}</svg></button>`}const ht=13,mt=8,gt=30,vt=78,m=document.querySelector("#app"),V='<span class="brand-accent">Loupe</span>',z=11,j=3.6,ae=10,xe=[{key:"backlog",label:"Backlog"},{key:"tracked-debt",label:"Tracked debt"},{key:"proven",label:"Proven"},{key:"GAP",label:"GAP"}];function q(e){return(b==null?void 0:b.statusCounts[e])??0}function yt(){return b!=null&&b.gate?b.gate.ok:q("GAP")===0}function Ie(){return!yt()}const $e={1:"READ",2:"SCAN",3:"SKYLINE"};function X(e){return Math.min(3,Math.max(1,e))}let b=null,A=null,K=null,ue="same-origin";function bt(){return ue==="same-origin"}let k=null,I=!1,D="list",L="all",N="",Z=null,O=!0,x=2,Te=!1;function $t(){return!b||!Z?null:Ee(b).find(e=>e.key===Z)??null}const H=new Set,G=new Map,Q="loupe.paneSplit",we="clewloupe.paneSplit",Ne=.2,Me=.8;let U=wt();function wt(){let e=window.localStorage.getItem(Q);if(e===null){const s=window.localStorage.getItem(we);s!==null&&(window.localStorage.setItem(Q,s),window.localStorage.removeItem(we),e=s)}const t=Number(e??NaN);return Number.isFinite(t)&&t>=Ne&&t<=Me?t:null}const St=960;function W(){const e=m.querySelector(".layout");if(e){if(U===null||window.innerWidth<=St){e.style.removeProperty("grid-template-columns");return}e.style.gridTemplateColumns=`minmax(0, ${U}fr) 6px minmax(280px, ${1-U}fr)`}}let oe=!1;function qe(){oe||(oe=!0,requestAnimationFrame(()=>{oe=!1,de(),Oe()}))}const re=new ResizeObserver(qe);function ce(){re.disconnect();const e=m.querySelector(".thread, .ghost-thread");e&&(re.observe(e),e.querySelectorAll(":scope > .tier").forEach(t=>re.observe(t)))}function De(){return A?be({sourceRepoPath:A.sourceRepoPath,sourceCommit:A.sourceCommit}):b?be(b):{remote:null,commit:null}}function ie(e,t){return`${e}:${t}`}function se(e){return`<p class="footnote">${e}${ue==="user-file"?" Loaded from your machine: nothing in this file was sent anywhere.":""}</p>`}function fe(){return`
        <div class="topbar-actions">
          <button type="button" class="load-manifest" id="loadManifest">Load Manifest…</button>
          <input type="file" id="manifestFile" accept="application/json,.json" hidden />
          <button type="button" class="load-manifest" id="loadDig">Load dig…</button>
          <input type="file" id="digFile" accept="application/json,.json" hidden />
        </div>`}function Ge(){return`
        <div class="lens-tabs" data-design="lens-tabs">
          <button type="button" class="lens-tab${D==="list"?" active":""}" data-lens="list">List</button>
          <button type="button" class="lens-tab${D==="map"?" active":""}" data-lens="map">Map</button>
          ${D==="map"?At():""}
        </div>`}function At(){return`
          <div class="zoom-control" data-design="zoom-control">
            <button type="button" class="zoom-btn" data-zoom-out title="Zoom out (more density)">−</button>
            <span class="zoom-level" title="Map zoom: ${$e[x]}">${$e[x]}</span>
            <button type="button" class="zoom-btn" data-zoom-in title="Zoom in (more detail)">+</button>
          </div>`}async function kt(){const e=new URLSearchParams(location.search).get("manifest")??"/trace-manifest.json",t=await fetch(e).catch(()=>null);if(!t||!t.ok){const u=t?`HTTP ${t.status}`:"fetch failed: for a cross-origin URL, the host must allow CORS";m.innerHTML=`<main class="topbar"><div><h1 class="brand">${V}</h1><p class="meta">Could not load ${l(e)} (${u}). Expected a trace-manifest.json (see samples/), or pass ?manifest=&lt;url&gt;.</p></div></main>`;return}const s=await t.json().catch(()=>null);if(!s){m.innerHTML=`<main class="topbar"><div><h1 class="brand">${V}</h1><p class="meta">Not JSON: ${l(e)}.</p></div></main>`;return}let n="remote-url";try{new URL(e,location.href).origin===location.origin&&(n="same-origin")}catch{n="remote-url"}const a=_e(s,n);if(a.kind==="unknown"){m.innerHTML=`<main class="topbar"><div><h1 class="brand">${V}</h1><p class="meta">${l(a.message??"Not a supported artifact.")}</p></div></main>`;return}const o=new URLSearchParams(location.search);if(Te=o.get("embed")==="1",b){const u=Je(b.rows,o.get("id"));k=u??null,I=!!u}P(),window.addEventListener("resize",()=>{W(),qe()}),document.addEventListener("keydown",u=>{u.key==="Escape"&&(k||I)&&(k=null,I=!1,P())})}function ne(){if(!b)return[];const e=N.trim().toLowerCase();return b.rows.filter(t=>e?t.id.toLowerCase().includes(e)||t.statement.toLowerCase().includes(e)||t.status.toLowerCase().includes(e):!0).filter(t=>L==="all"||t.status===L)}function Lt(){if(!k)return;ne().some(t=>t.id===k)||(k=null,I=!1)}function Fe(){const e={window:{x:window.scrollX,y:window.scrollY}},t=m.querySelector(".table-wrap");t&&(e.table={top:t.scrollTop,left:t.scrollLeft});const s=m.querySelector(".field");return s&&(e.field={top:s.scrollTop}),e}function ee(e){if(e.table){const t=m.querySelector(".table-wrap");t&&(t.scrollTop=e.table.top,t.scrollLeft=e.table.left)}if(e.field){const t=m.querySelector(".field");t&&(t.scrollTop=e.field.top)}e.window&&window.scrollTo(e.window.x,e.window.y)}function P(e={}){if(K){Ct();return}if(A){_t(e);return}b&&Et(e)}function Ct(){m.innerHTML=`
    <header class="topbar" data-design="topbar">
      <div>
        <h1 class="brand">${V}</h1>
        ${fe()}
      </div>
    </header>
    <main class="cube-refusal" data-design="cube-refusal">
      <p class="cube-refusal-message">${l(K??"")}</p>
    </main>
  `,te()}function Et(e={}){var u,r;if(!b)return;Lt();const t=I?b.rows.find(c=>c.id===k)??null:null,s=Ie(),n=((r=(u=b.gate)==null?void 0:u.failures)==null?void 0:r.length)??0,a=e.resetMatrixScroll?null:Fe(),o=`
        ${t?Ot(t):Pt()}
        ${se("Reads trace-manifest.json only; no target re-scan: this readout is the emitter's, not re-derived here.")}
  `;if(Te){m.innerHTML=Qe(o),te(),ce(),requestAnimationFrame(()=>de());return}m.innerHTML=`
    <header class="topbar${s?" gate-failed":""}" data-design="topbar">
      <div>
        <h1 class="brand">${V}</h1>
        <p class="meta">${l(b.targetName)} · manifest ${l(b.generatedAt)} · schema v${b.schemaVersion}</p>
        ${s?`<p class="gate-banner" data-design="gate-banner" title="Gate refused this manifest">Golden Thread broken${n?` · ${n} ${n===1?"refusal":"refusals"}`:""}</p>`:'<p class="gate-ok-meta" title="Gate accepted this manifest">Golden Thread intact</p>'}
        ${fe()}
      </div>
      <div class="stats" data-design="stats">
        <button type="button" class="stat${L==="all"&&!N.trim()?" active":""}" data-stat-filter="all" title="Show all rows">
          <div class="n">${b.rows.length}</div><div class="l">Rows</div>
        </button>
        <button type="button" class="stat${L==="backlog"&&!N.trim()?" active":""}" data-stat-filter="backlog" title="Show backlog rows">
          <div class="n">${q("backlog")}</div><div class="l">Backlog</div>
        </button>
        <button type="button" class="stat${L==="tracked-debt"&&!N.trim()?" active":""}" data-stat-filter="tracked-debt" title="Show tracked-debt rows">
          <div class="n">${q("tracked-debt")}</div><div class="l">Debt</div>
        </button>
        <button type="button" class="stat${L==="proven"&&!N.trim()?" active":""}" data-stat-filter="proven" title="Show proven rows">
          <div class="n">${q("proven")}</div><div class="l">Proven</div>
        </button>
        <button type="button" class="stat${q("GAP")>0?" stat-gap-hot":""}${L==="GAP"&&!N.trim()?" active":""}" data-stat-filter="GAP" title="Show GAP rows">
          <div class="n">${q("GAP")}</div><div class="l">GAP</div>
        </button>
      </div>
    </header>
    <div class="layout">
      <section class="matrix-pane" data-design="matrix-pane" tabindex="0">
        <h2 class="pane-title">Traceability matrix</h2>
        ${Ge()}
        <div class="toolbar" data-design="toolbar">
          <input id="q" type="search" placeholder="Filter by ID or statement…" value="${C(N)}" />
          <select id="status">
            <option value="all"${L==="all"?" selected":""}>All statuses</option>
            ${xe.map(({key:c,label:y})=>`<option value="${c}"${L===c?" selected":""}>${y}</option>`).join(`
            `)}
          </select>
          <!-- @covers FR-ROLL-10: sibling gesture beside find/filter, no apply step -->
          <select id="rollup" title="Roll the descent up by a dimension">
            <option value=""${Z===null?" selected":""}>No rollup</option>
            ${Ee(b).map(c=>`<option value="${C(c.key)}"${Z===c.key?" selected":""}>By ${l(c.label)}</option>`).join(`
            `)}
          </select>
        </div>
        ${D==="map"?xt():Rt()}
      </section>
      <div class="pane-divider" data-design="pane-divider" role="separator" aria-orientation="vertical" title="Drag to resize; double-click to reset"></div>
      <section class="descent-pane" data-design="descent-pane">
        <h2 class="pane-title">Descent</h2>
        ${o}
      </section>
    </div>
  `,te(),W(),ce(),a&&(ee(a),requestAnimationFrame(()=>{ee(a),de()}))}function Pt(){const e=ne();if(e.length===0){const o=L!=="all"?he(L,q(L)):{title:"No matching rows",body:"Try clearing the search filter."};return`<p class="descent-empty"><strong>${l(o.title)}</strong><br>${l(o.body)}</p>`}const t=O?ht:mt,s=O?vt:gt,n=e.map(o=>ft(o,t,l,s,o.id===k?"cross-pinned":"")).join(""),a=O?'<button type="button" class="field-expand-toggle" data-field-expand-toggle title="Collapse to a compact summary">collapse</button>':'<button type="button" class="field-expand-toggle" data-field-expand-toggle title="Expand to the full census">expand</button>';return`
      <div class="field-wrap${O?"":" field-wrap-compact"}" data-design="field-wrap">
        <div class="field-head" data-design="field-head">${e.length} thread${e.length===1?"":"s"}${a}</div>
        <div class="field${O?"":" field-compact"}" data-design="field">${n}</div>
      </div>
  `}function Se(e){return`
                <tr class="status-${e.status}${I&&e.id===k?" selected":""}${e.id===k?" cross-pinned":""}" data-id="${C(e.id)}">
                  <td class="id">${l(e.id)}</td>
                  <td><span class="badge ${e.status}">${l(e.status)}</span></td>
                  <td class="statement">${l(ze(ve(e.id,e.statement),140))}</td>
                  <td>${e.proofs.length}</td>
                </tr>`}function Be(e){return xe.map(({key:t,label:s})=>e[t]>0?`<span class="badge ${t}" title="${C(s)}">${e[t]} ${l(s)}</span>`:"").filter(Boolean).join(" ")}function Rt(){const e=ne(),t=$t(),s=e.length===0?(()=>{const o=L==="all"?{title:"No matching rows",body:"Try clearing the search filter."}:he(L,q(L));return`<div class="table-empty" data-design="table-empty">
            <div class="table-empty-title">${l(o.title)}</div>
            <div class="table-empty-body">${l(o.body)}</div>
          </div>`})():"",n=t?Xe(e,t).map(o=>`
                <tr class="rollup-group-header" data-design="rollup-group-header">
                  <td colspan="4">
                    <span class="rollup-group-label">${l(o.label)}</span>
                    <span class="rollup-group-count">${o.rows.length}</span>
                    <span class="rollup-strip" data-design="rollup-strip">${Be(o.counts)}</span>
                  </td>
                </tr>${o.rows.map(Se).join("")}`).join(""):e.map(Se).join(""),a=nt();return`
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
  `}function he(e,t){if(t===0)switch(e){case"GAP":return{title:"No silent gaps",body:"Every AC in this run has proof or tracked debt."};case"tracked-debt":return{title:"No tracked debt",body:"Nothing in this run is deliberately deferred."};case"backlog":return{title:"No bare backlog",body:"Every US/FR/NFR here has its own build or proof, or is tracked as debt."};default:return{title:"Nothing proven yet",body:"No intent here has proof."}}return{title:"No matches",body:"Rows exist in this status, but the current filter hides them."}}function Ae(e){const t=ve(e.id,e.statement);return`
    <div class="detail-card status-${e.status}${I&&e.id===k?" selected":""}${e.id===k?" cross-pinned":""}" data-id="${C(e.id)}" title="${C(e.id)} · ${C(e.status)} · ${C(t)}">
      <span class="detail-card-id ${e.status}">${l(e.id)}</span>
      <div class="detail-card-excerpt">${l(t)}</div>
    </div>
  `}function xt(){const e=ne();if(e.length===0){const n=L!=="all"?he(L,q(L)):{title:"No matching rows",body:"Try clearing the search filter."};return`<div class="map-empty" data-design="map-empty">
      <div class="map-empty-title">${l(n.title)}</div>
      <div class="map-empty-body">${l(n.body)}</div>
    </div>`}const t=at(e),s=new Map(e.map(n=>[n.id,n]));return`
    <div class="map-wrap-outer" data-design="map-wrap-outer">
      <div class="map-head" data-design="map-head">${t.length} stor${t.length===1?"y":"ies"}</div>
      <div class="map-wrap${x===1?"":` map-wrap-level-${x}`}" data-design="map-wrap">${t.map(n=>It(n,s)).join("")}</div>
      ${se("Reads trace-manifest.json only; no target re-scan: this readout is the emitter's, not re-derived here.")}
    </div>
  `}function It(e,t){const s=t.get(e.key);return`
    <div class="map-column" data-design="map-column">
      ${s?`<div class="map-spine-card" data-design="map-spine-card">${Ae(s)}</div>`:`
      <div class="map-column-head" data-design="map-column-head">
        <span class="map-column-label">${l(e.label)}</span>
        <span class="map-column-count">${e.rows.length}</span>
        <span class="map-column-strip" data-design="map-column-strip">${Be(e.counts)}</span>
      </div>`}
      <div class="map-column-cards">${e.rows.map(Ae).join("")}</div>
    </div>
  `}function Tt(e){m.querySelectorAll(`[data-id="${CSS.escape(e)}"]`).forEach(t=>{t.scrollIntoView({block:"nearest"})})}function Nt(){if(!k||!A)return;me().some(t=>t.rowId===k)||(k=null,I=!1)}function me(){if(!A)return[];const e=N.trim().toLowerCase();return e?A.rows.filter(t=>{const s=t.provenance,n=typeof s.file=="string"&&s.file||typeof s.path=="string"&&s.path||"";return t.label.toLowerCase().includes(e)||t.statement.toLowerCase().includes(e)||(t.rowId??"").toLowerCase().includes(e)||n.toLowerCase().includes(e)}):A.rows}function Mt(){if(!A)return"";const e=A.honestLimits.map(t=>`<li>${l(t)}</li>`).join("");return`
      <div class="ghost-provenance-card" data-design="ghost-provenance-card">
        <div class="ghost-provenance-row"><span class="l">Source repo</span><span class="v">${l(A.sourceRepoPath)}</span></div>
        <div class="ghost-provenance-row"><span class="l">Source commit</span><span class="v">${l(A.sourceCommit||"—")}</span></div>
        <div class="ghost-provenance-row"><span class="l">Generated</span><span class="v">${l(A.generatedAt)}</span></div>
        <div class="ghost-provenance-row"><span class="l">Generator</span><span class="v">${l(A.generatorVersion)}</span></div>
        ${e?`<div class="ghost-limits"><div class="l">Honest limits</div><ul>${e}</ul></div>`:""}
        <p class="ghost-epistemic-note">Every row here is proposed and attested by no one. Nothing here is anointed.</p>
      </div>
  `}function ge(e){if(e.gap===null)return"";const t=e.gap==="partial"?"PARTIAL":"GAP",s=e.gap==="partial"?"The dig found this partially implemented or partially proven":"The dig found this published in the spec but not implemented or tested";return`<span class="hchip ghostgap" title="${C(s)}">${t}</span>`}function qt(e){const t=De(),s=e.candidateParent.length>0,n=e.candidateBuild.length>0,a=e.candidateProof!==null,o=e.candidateBuild.length?e.candidateBuild.map(c=>`
              <li>
                <code>${l(c.type||J(c.file)||"(unnamed)")}</code>
                <div class="path">${_(c.file,c.line,t,l)}</div>
                ${c.provenanceFile?`<div class="path">seen at ${_(c.provenanceFile,c.provenanceLine,t,l)}</div>`:""}
                ${c.basis?`<div class="excerpt">${l(c.basis)}</div>`:""}
              </li>`).join(""):'<li class="empty">No candidate build.</li>',u=e.candidateParent.length?e.candidateParent.map(c=>`
              <li>
                <code>${l(c.parentRowId??"(unresolved)")}</code>
                <div class="path">${l(c.basis||"no basis stated")}</div>
              </li>`).join(""):'<li class="empty">No candidate parent — proposed as its own root.</li>',r=e.candidateProof?`
              <li>
                <code>${l(e.candidateProof.test||"(unnamed test)")}</code>
                <div class="path">${_(e.candidateProof.file,e.candidateProof.line,t,l)}</div>
                <div class="excerpt">${l(e.candidateProof.basis)}</div>
              </li>`:'<li class="empty">No candidate proof.</li>';return`
      <div class="descent ghost-descent" data-design="descent">
        <button type="button" class="descent-back" data-descent-back title="Back to the dig">‹ Back to the dig</button>
        <div class="ghost-descent-head">
          <span class="detail-card-id ghost-dim">${l(e.label)}</span>
          <span class="hchip ghostguess">${l(e.typeGuess)} — a guess</span>
          <span class="hchip ghost">${l(e.epistemicClass.toUpperCase())}</span>
          ${ge(e)}
          ${e.confidence?`<span class="hchip ghostguess">confidence: ${l(e.confidence)}</span>`:""}
        </div>
        <div class="ghost-thread" data-design="ghost-thread">
          <svg class="ghost-rail" aria-hidden="true"></svg>
          <div class="tier ghost-tier" data-present="true">
            <div class="tier-label">PROPOSED INTENT</div>
            <div class="tier-body">${e.statement?l(e.statement):"<i>no statement text</i>"}</div>
            <div class="gdesc-faint">dug from: ${l(ct(e.provenance))}</div>
          </div>
          <div class="tier ghost-tier${s?"":" ghost-leg-absent"}" data-present="${s}">
            <div class="tier-label">CANDIDATE PARENT</div>
            <ul class="hit-list">${u}</ul>
          </div>
          <div class="tier ghost-tier${n?"":" ghost-leg-absent"}" data-present="${n}">
            <div class="tier-label">CANDIDATE BUILD</div>
            <ul class="hit-list">${o}</ul>
          </div>
          <div class="tier ghost-tier${a?"":" ghost-leg-absent"}" data-present="${a}">
            <div class="tier-label">CANDIDATE PROOF</div>
            <ul class="hit-list">${r}</ul>
          </div>
        </div>
        <p class="ghost-epistemic-note">Proposed only — attested by no one. Anointment is not a button here, it is a pull request.</p>
      </div>
  `}function Dt(e){const t=e.rowId?` data-id="${C(e.rowId)}"`:"";return`
                <tr class="ghost-row-tr${I&&e.rowId===k?" selected":""}${e.rowId===k?" cross-pinned":""}"${t}>
                  <td class="id ghost-dim">${l(e.label)}</td>
                  <td><span class="hchip ghostguess">${l(e.typeGuess)} — a guess</span> <span class="hchip ghost">${l(e.epistemicClass.toUpperCase())}</span> ${ge(e)}</td>
                  <td class="statement">${l(ze(e.statement,140))}</td>
                  <td>${e.confidence?l(e.confidence):"—"}</td>
                </tr>`}function Gt(){const e=me();return e.length===0?'<div class="table-empty" data-design="table-empty"><div class="table-empty-title">No proposed rows match.</div></div>':`
        <div class="table-wrap">
          <table data-design="matrix-table">
            <thead>
              <tr><th>ID</th><th>Type</th><th>Statement</th><th>Confidence</th></tr>
            </thead>
            <tbody>
              ${e.map(Dt).join("")}
            </tbody>
          </table>
        </div>
  `}function ke(e){const t=e.rowId?` data-id="${C(e.rowId)}"`:"";return`
    <div class="detail-card ghost-card${I&&e.rowId===k?" selected":""}${e.rowId===k?" cross-pinned":""}"${t} title="${C(e.label)} · proposed · ${C(e.typeGuess)}">
      <span class="detail-card-id ghost-dim">${l(e.label)}</span>
      <span class="hchip ghostguess">${l(e.typeGuess)} — a guess</span> <span class="hchip ghost">${l(e.epistemicClass.toUpperCase())}</span> ${ge(e)}
      <div class="detail-card-excerpt">${l(e.statement)}</div>
    </div>
  `}function Ft(){const e=me();if(e.length===0)return'<div class="map-empty" data-design="map-empty"><div class="map-empty-title">No proposed rows match.</div></div>';const t=lt(e),s=new Map;for(const n of e)n.rowId&&s.set(n.rowId,n);return`
    <div class="map-wrap-outer" data-design="map-wrap-outer">
      <div class="map-head" data-design="map-head">${t.length} propos${t.length===1?"al":"als"}</div>
      <div class="map-wrap ghost-map-wrap${x===1?"":` map-wrap-level-${x}`}" data-design="map-wrap">${t.map(n=>Bt(n,s)).join("")}</div>
      ${se("Reads the dig-report only; no target re-scan: this readout is the excavation tool's own, not re-derived here.")}
    </div>
  `}function Bt(e,t){const s=t.get(e.key);return`
    <div class="map-column ghost-map-column" data-design="map-column">
      ${s?`<div class="map-spine-card ghost-spine-card" data-design="map-spine-card">${ke(s)}</div>`:`
      <div class="map-column-head ghost-column-head" data-design="map-column-head">
        <span class="map-column-label">${l(e.label)}</span>
        <span class="map-column-count">${e.rows.length}</span>
      </div>`}
      <div class="map-column-cards">${e.rows.map(ke).join("")}</div>
    </div>
  `}function _t(e={}){if(!A)return;Nt();const t=I?A.rows.find(u=>u.rowId===k)??null:null,s=e.resetMatrixScroll?null:Fe(),n=new Map;for(const u of A.rows)n.set(u.typeGuess,(n.get(u.typeGuess)??0)+1);const a=[...n.entries()].sort(([u],[r])=>u.localeCompare(r)).map(([u,r])=>`<span class="hchip ghostguess">${r} ${l(u)}</span>`).join(" "),o=`
        ${t?qt(t):Mt()}
        ${se("Reads the dig-report only; no target re-scan: this readout is the excavation tool's own, not re-derived here.")}
  `;m.innerHTML=`
    <header class="topbar ghost-topbar" data-design="topbar">
      <div>
        <h1 class="brand">${V}</h1>
        <p class="meta">${l(A.sourceRepoPath)} · dig ${l(A.generatedAt)} · ${l(A.generatorVersion)}</p>
        <p class="ghost-epistemic-banner" title="Every row here is a proposal">Proposed only — attested by no one</p>
        ${fe()}
      </div>
      <div class="stats ghost-stats" data-design="stats">
        <div class="stat"><div class="n">${A.rows.length}</div><div class="l">Proposed</div></div>
        <div class="ghost-type-chips">${a}</div>
      </div>
    </header>
    <div class="layout">
      <section class="matrix-pane" data-design="matrix-pane" tabindex="0">
        <h2 class="pane-title">Proposed rows</h2>
        ${Ge()}
        <div class="toolbar" data-design="toolbar">
          <input id="q" type="search" placeholder="Filter by ID or statement…" value="${C(N)}" />
        </div>
        ${D==="map"?Ft():Gt()}
      </section>
      <div class="pane-divider" data-design="pane-divider" role="separator" aria-orientation="vertical" title="Drag to resize; double-click to reset"></div>
      <section class="descent-pane" data-design="descent-pane">
        <h2 class="pane-title">Descent</h2>
        ${o}
      </section>
    </div>
  `,te(),W(),ce(),Oe(),s&&(ee(s),requestAnimationFrame(()=>ee(s)))}function te(){var o,u,r,c,y,w,h,f,i,g,$,T;(o=m.querySelector("#loadManifest"))==null||o.addEventListener("click",()=>{var d;(d=m.querySelector("#manifestFile"))==null||d.click()}),(u=m.querySelector("#loadDig"))==null||u.addEventListener("click",()=>{var d;(d=m.querySelector("#digFile"))==null||d.click()}),(r=m.querySelector("#digFile"))==null||r.addEventListener("change",d=>{var S;const p=(S=d.target.files)==null?void 0:S[0];p&&Ce(p),d.target.value=""}),(c=m.querySelector("#manifestFile"))==null||c.addEventListener("change",d=>{var S;const p=(S=d.target.files)==null?void 0:S[0];p&&Ce(p)}),(y=m.querySelector("#q"))==null||y.addEventListener("input",d=>{var S;N=d.target.value,P({resetMatrixScroll:!0}),(S=m.querySelector("#q"))==null||S.focus();const p=m.querySelector("#q");p&&(p.selectionStart=p.selectionEnd=p.value.length)}),(w=m.querySelector("#status"))==null||w.addEventListener("change",d=>{L=d.target.value,P({resetMatrixScroll:!0})}),(h=m.querySelector("#rollup"))==null||h.addEventListener("change",d=>{const p=d.target.value;Z=p===""?null:p,P({resetMatrixScroll:!0})}),m.querySelectorAll("[data-stat-filter]").forEach(d=>{d.addEventListener("click",()=>{const p=d.getAttribute("data-stat-filter");p&&(N="",L=p==="all"?"all":p,P({resetMatrixScroll:!0}))})}),m.querySelectorAll(".lens-tab[data-lens]").forEach(d=>{d.addEventListener("click",()=>{const p=d.getAttribute("data-lens");!p||p===D||(D=p,P({resetMatrixScroll:!0}))})}),m.querySelectorAll("tbody tr[data-id], .strand[data-id], .detail-card[data-id]").forEach(d=>{d.addEventListener("click",()=>{const p=d.getAttribute("data-id");p&&(k=p,I=!0,P(),requestAnimationFrame(()=>Tt(p)))})});const e=d=>{m.querySelectorAll(".cross-hover").forEach(p=>p.classList.remove("cross-hover")),d&&m.querySelectorAll(`[data-id="${CSS.escape(d)}"]`).forEach(p=>p.classList.add("cross-hover"))};let t=null;const s=d=>{if(D==="map")return;const p=m.querySelector(".matrix-pane");p&&(t=p,p.style.minHeight=`${p.getBoundingClientRect().height}px`),m.querySelectorAll("tbody tr[data-id]").forEach(S=>{S.getAttribute("data-id")!==d&&S.classList.add("cross-isolated")})},n=()=>{m.querySelectorAll(".cross-isolated").forEach(d=>d.classList.remove("cross-isolated")),t&&(t.style.minHeight="",t=null)};m.querySelectorAll(".strand[data-id]").forEach(d=>{d.addEventListener("mouseenter",()=>{const p=d.getAttribute("data-id");e(p),p&&s(p)}),d.addEventListener("mouseleave",()=>{e(null),n()})}),m.querySelectorAll("tbody tr[data-id], .detail-card[data-id]").forEach(d=>{d.addEventListener("mouseenter",()=>e(d.getAttribute("data-id"))),d.addEventListener("mouseleave",()=>e(null))}),(f=m.querySelector("[data-descent-back]"))==null||f.addEventListener("click",()=>{if(I=!1,P(),k){const d=k;requestAnimationFrame(()=>{var p;(p=m.querySelector(`.strand[data-id="${CSS.escape(d)}"]`))==null||p.scrollIntoView({block:"nearest"})})}}),(i=m.querySelector("[data-field-expand-toggle]"))==null||i.addEventListener("click",()=>{O=!O,P()}),(g=m.querySelector("[data-zoom-in]"))==null||g.addEventListener("click",()=>{x=X(x+1),P()}),($=m.querySelector("[data-zoom-out]"))==null||$.addEventListener("click",()=>{x=X(x-1),P()}),(T=m.querySelector(".matrix-pane"))==null||T.addEventListener("keydown",d=>{if(D!=="map")return;const p=d.key;p==="+"||p==="="?(x=X(x+1),P()):(p==="-"||p==="_")&&(x=X(x-1),P())});const a=m.querySelector(".pane-divider");a&&(a.addEventListener("pointerdown",d=>{const p=m.querySelector(".layout");if(!p)return;d.preventDefault(),a.setPointerCapture(d.pointerId),a.classList.add("dragging"),document.body.classList.add("pane-resizing");const S=p.getBoundingClientRect(),F=B=>{const v=(B.clientX-S.left)/Math.max(S.width,1);U=Math.min(Me,Math.max(Ne,v)),W()},E=B=>{a.releasePointerCapture(B.pointerId),a.classList.remove("dragging"),document.body.classList.remove("pane-resizing"),a.removeEventListener("pointermove",F),a.removeEventListener("pointerup",E),a.removeEventListener("pointercancel",E),U!==null&&window.localStorage.setItem(Q,String(U))};a.addEventListener("pointermove",F),a.addEventListener("pointerup",E),a.addEventListener("pointercancel",E)}),a.addEventListener("dblclick",()=>{U=null,window.localStorage.removeItem(Q),W()})),m.querySelectorAll(".source-toggle").forEach(d=>{d.addEventListener("click",()=>{const p=d.getAttribute("data-source-key");if(p){if(H.has(p)){H.delete(p),P();return}if(H.add(p),P(),!G.has(p)){const S=d.getAttribute("data-source-path"),F=Number(d.getAttribute("data-source-line"));Ut(p,S,F)}}})})}function _e(e,t){const s=ot(e);return ue=t,s==="trace-manifest"?(b=Ve(e),A=null,K=null,Le(),{kind:s}):s==="dig-report"?(A=it(e),b=null,K=null,Le(),{kind:s}):s==="cost-cube"?(b=null,A=null,K="This is a cost-cube. Tally reads those.",{kind:s}):{kind:s,message:"Not a supported artifact — expected a trace-manifest, a dig-report, or a cost-cube."}}function Le(){H.clear(),G.clear(),N="",L="all",k=null,I=!1}async function Ce(e){try{const t=await e.text(),s=JSON.parse(t),n=_e(s,"user-file");if(n.kind==="unknown"){window.alert(n.message);return}P({resetMatrixScroll:!0})}catch(t){window.alert(`Could not read file: ${t}`)}}function jt(e){switch(e){case"GAP":return"No proof: silent gap (Golden Thread broken)";case"tracked-debt":return"No proof: tracked as debt";case"backlog":return"No own proof: backlog altitude (not a silent gap)";default:return"No proof"}}function Ot(e){const t=De(),s=e.status==="GAP",n=e.status==="tracked-debt",a=e.status==="backlog",o=Ie(),u=n||a,r=Pe(e),c=tt(e),y=e.implementations.length===0,w=e.proofs.length===0,h=w&&(s||o),f=y&&et(e),i=y?f?" lawful-absence":u?" missing-honest":" missing-impl":"",g=y?f?" carrier-lawful":u?" carrier-honest":" missing-carrier":"",$=h?" frayed":w&&u?" missing-honest":"",T=h?" frayed":w&&u?" carrier-honest":"",d=e.implementations.length===0?`<li class="empty${g}">${f?pe(e)?"no build mark · proof binds directly to intent":"no build mark · none claimed":a?"No own @covers (backlog altitude)":"No @covers found"}</li>`:e.implementations.map(v=>{const R=ie(v.path,v.line),M=H.has(R),ye=Vt(v.excerpt,e.id);return`
              <li>
                <button type="button" class="source-toggle" data-source-key="${C(R)}" data-source-path="${C(v.path)}" data-source-line="${v.line}" aria-expanded="${M}">
                  <span class="proof-caret">${M?"▾":"▸"}</span>
                  <code>${l(J(v.path))}:${v.line}</code>
                </button>
                <div class="path">${_(v.path,v.line,t,l)}</div>
                ${ye.length?`<div class="excerpt">also covers: ${l(ye.join(", "))}</div>`:""}
                ${M?le(G.get(R)):""}
              </li>`}).join(""),p=e.carryingTasks??[],S=p.length===0?"":`<div class="debt-block">
        <div class="debt-label">Open debt (Carries:)</div>
        <ul class="hit-list debt-list">
          ${p.map(v=>`
            <li>
              <div class="path">${_(v.path,v.line,t,l)}</div>
              <div class="excerpt">${l(v.excerpt)}</div>
            </li>`).join("")}
        </ul>
      </div>`,F=c==="coverage-proven"&&!o?(()=>{const v=st(e);return`<li class="coverage-proven"><code>${l(J(v.path))}:${v.line}</code><div class="path">Covered by ${_(v.path,v.line,t,l)}: no test required for this type</div></li>`})():e.proofs.length===0?`<li class="empty${T}">${l(o&&!s?"Golden Thread broken":n&&p.length>0?"No proof: tracked as open debt (see above)":jt(e.status))}</li>`:e.proofs.map(v=>{const R=ie(v.path,v.line),M=H.has(R);return`
              <li>
                <button type="button" class="source-toggle" data-source-key="${C(R)}" data-source-path="${C(v.path)}" data-source-line="${v.line}" aria-expanded="${M}">
                  <span class="proof-caret">${M?"▾":"▸"}</span>
                  <code>${l(v.name)}</code>
                </button>
                <div class="path">${_(v.path,v.line,t,l)}</div>
                ${M?le(G.get(R)):""}
              </li>`}).join(""),E=e.registry??null;let B="";if(E){const v=ie(E.path,E.line),R=H.has(v),M=E.path.includes("/")||Re(E.path,E.line,t)!==null;B=`
      <ul class="hit-list registry-list">
        <li>
          <button type="button" class="source-toggle" data-source-key="${C(v)}" data-source-path="${C(E.path)}" data-source-line="${E.line}" aria-expanded="${R}">
            <span class="proof-caret">${R?"▾":"▸"}</span>
            <code>${l(J(E.path))}:${E.line}</code>
          </button>
          ${M?`<div class="path">${_(E.path,E.line,t,l)}</div>`:""}
          ${R?le(G.get(v)):""}
        </li>
      </ul>`}return`
    <div class="descent-head" data-design="descent-head">
      <button type="button" class="descent-back" data-descent-back title="Back to field">‹ Back to field</button>
    </div>
    <div class="thread${o?" gate-broken":""}" data-design="descent-thread" data-status="${e.status}">
      <svg class="thread-rail" aria-hidden="true"></svg>
      <article class="tier${Ye(e.status)==="amber"?" debt":""}" data-design="tier-requirement" data-broken="false">
        <div class="tier-label">Intent</div>
        <div class="tier-id">${l(e.id)}</div>
        <div class="tier-body">${l(ve(e.id,e.statement))}</div>
        ${B}
        <p class="meta" style="margin-top:0.6rem"><span class="badge ${e.status}">${l(e.status)}</span></p>
        ${r?'<p class="incoherence-note" data-design="incoherence-note">status claims proven; manifest lists no proof</p>':""}
        ${S}
      </article>
      <article class="tier${i}" data-design="tier-implementation" data-broken="false">
        <div class="tier-label">Build</div>
        <div class="tier-id">${l(e.id)}</div>
        <ul class="hit-list">${d}</ul>
      </article>
      <article class="tier${$}" data-design="tier-proof" data-broken="${h?"true":"false"}">
        <div class="tier-label">Proof</div>
        <div class="tier-id">${l(e.id)}</div>
        <ul class="hit-list">${F}</ul>
      </article>
    </div>
  `}function je(e,t,s,n,a,o=!1){const r=j*(a===0?1:-1),c=o?n:-n,y=t+(s-t)*.33,w=t+(s-t)*.67,h=e+c+r,f=e+c-r;return`M ${e} ${t} C ${h} ${y} ${f} ${w} ${e} ${s}`}function zt(e,t,s,n,a=!1){const o=Math.sign(s-t)||1,u=s-t;let r=t+u*.5,c=r+o*ae;const y=s-o*18;o>0?(c=Math.min(c,y),r=Math.min(r,c-o*ae)):(c=Math.max(c,y),r=Math.max(r,c-o*ae));const w=t+(r-t)*.55,h=a?n:-n,f=`M ${e} ${t} C ${e+h+j} ${w} ${e+h+j*.35} ${t+(r-t)*.85} ${e+j*.4} ${r}`,i=`M ${e} ${t} C ${e+h-j} ${w} ${e+h-j*.35} ${t+(c-t)*.85} ${e-j*.4} ${c}`;return{short:f,long:i}}function de(){const e=m.querySelector(".thread"),t=e==null?void 0:e.querySelector(".thread-rail");if(!e||!t)return;const s=[...e.querySelectorAll(":scope > .tier")];if(s.length<2){t.replaceChildren();return}const n=parseFloat(getComputedStyle(document.documentElement).fontSize)||16,a=s.map(f=>({x:f.offsetLeft-.95*n+4.5,y:f.offsetTop+1.1*n+4.5,top:f.offsetTop,bottom:f.offsetTop+f.offsetHeight,broken:f.getAttribute("data-broken")==="true"})),o=Math.max(e.clientWidth,48),u=Math.max(e.scrollHeight,1),r=z+6,c=z+8;t.style.left=`${-r}px`,t.style.width=`${o+r+c}px`,t.style.height=`${u}px`,t.setAttribute("width",String(o+r+c)),t.setAttribute("height",String(u)),t.setAttribute("viewBox",`${-r} 0 ${o+r+c} ${u}`);const y="http://www.w3.org/2000/svg",w=document.createDocumentFragment(),h=a.length-2;for(let f=0;f<a.length-1;f++){const i=a[f],g=a[f+1],$=i.broken||g.broken,T=$&&f===h,d=document.createElementNS(y,"g");if(d.classList.add("seg",$?"seg-frayed":"seg-braid"),T&&d.classList.add("seg-reflect"),d.setAttribute("data-seg",String(f)),$){const p=i.broken&&!g.broken,S=p?g:i,F=p?i:g,{short:E,long:B}=zt(i.x,S.y,F.y,z,T),v=document.createElementNS(y,"path");v.setAttribute("d",E),v.classList.add("strand","strand-die","strand-short");const R=document.createElementNS(y,"path");R.setAttribute("d",B),R.classList.add("strand","strand-die","strand-long"),d.appendChild(v),d.appendChild(R)}else for(const p of[0,1]){const S=document.createElementNS(y,"path");S.setAttribute("d",je(i.x,i.y,g.y,z,p)),S.classList.add("strand",p===0?"strand-a":"strand-b"),d.appendChild(S)}w.appendChild(d)}t.replaceChildren(w)}function Oe(){const e=m.querySelector(".ghost-thread"),t=e==null?void 0:e.querySelector(".ghost-rail");if(!e||!t)return;const s=[...e.querySelectorAll(":scope > .tier")];let n=-1;for(const f of s){if(f.getAttribute("data-present")!=="true")break;n+=1}if(n<1){t.replaceChildren();return}const a=parseFloat(getComputedStyle(document.documentElement).fontSize)||16,o=s.slice(0,n+1).map(f=>({x:f.offsetLeft-.95*a+4.5,y:f.offsetTop+1.1*a+4.5})),u=Math.max(e.clientWidth,48),r=Math.max(e.scrollHeight,1),c=z+6,y=z+8;t.style.left=`${-c}px`,t.style.width=`${u+c+y}px`,t.style.height=`${r}px`,t.setAttribute("width",String(u+c+y)),t.setAttribute("height",String(r)),t.setAttribute("viewBox",`${-c} 0 ${u+c+y} ${r}`);const w="http://www.w3.org/2000/svg",h=document.createDocumentFragment();for(let f=0;f<o.length-1;f++){const i=o[f],g=o[f+1],$=document.createElementNS(w,"path");$.setAttribute("d",je(i.x,i.y,g.y,z,0)),$.classList.add("ghost-strand"),h.appendChild($)}t.replaceChildren(h)}function le(e){if(!e)return'<div class="proof-source proof-source-loading">Loading source…</div>';if("error"in e)return`<div class="proof-source ${e.info?"proof-source-info":"proof-source-error"}">${l(e.error)}</div>`;const t=e.lines.map(s=>`<div class="src-line${s.isTarget?" src-line-target":""}"><span class="src-n">${s.n}</span><span class="src-text">${l(s.text)}</span></div>`).join("");return`
    <div class="proof-source">
      <div class="proof-source-path">${l(e.path)} · lines ${e.startLine}–${e.endLine} of ${e.totalLines}</div>
      <div class="proof-source-code">${t}</div>
    </div>
  `}async function Ut(e,t,s){var n;if(b){if(!bt()){G.set(e,{info:!0,error:"Source peek is off for artifacts you load yourself — nothing from this file leaves your machine. Run Loupe locally against the repository to read source in place."}),P();return}try{const a=`/api/source?repoPath=${encodeURIComponent(b.repoPath)}&path=${encodeURIComponent(t)}&line=${s}`,o=await fetch(a);((n=o.headers.get("content-type"))==null?void 0:n.includes("application/json"))?G.set(e,await o.json()):G.set(e,{info:!0,error:"This hosted demo reads the trace-manifest only. The source line above is shown in full when Loupe runs locally against the repository."})}catch(a){const o=a instanceof TypeError;G.set(e,{error:o?"Can't reach the Loupe dev server, so source can't be read from disk. Restart it (`npm run viz:dev` in loupe) and reload this page.":String(a)})}P()}}const Ht=/(?:FR|NFR|AC|US)-[A-Z][A-Z0-9]{1,5}-[0-9]{2,}[a-z]?/g;function J(e){const t=e.lastIndexOf("/");return t===-1?e:e.slice(t+1)}function Vt(e,t){const s=e.match(Ht)??[];return[...new Set(s)].filter(n=>n!==t)}function ze(e,t){const s=e.replace(/\s+/g," ").trim();return s.length<=t?s:`${s.slice(0,t-1)}…`}function ve(e,t){const s=t.replace(/\*\*/g,""),n=e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return s.replace(new RegExp(`^\\s*${n}\\s*[—:–-]\\s*`),"").trim()}function l(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function C(e){return l(e).replaceAll("'","&#39;")}kt();

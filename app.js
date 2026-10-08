
const fallback = { generatedAt:null, missions:[], chantiers:[] };
let data=fallback, current="home";

const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fmt=d=>{try{return new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"short"}).format(new Date(d+"T12:00:00"))}catch{return d}};
const teams=["Bâtiment","Voirie","Espaces verts","Propreté","Festivités","DMT","Moyens techniques"];
const teamIcon=t=>({"Bâtiment":"⌂","Voirie":"▥","Espaces verts":"●","Propreté":"♣","Festivités":"✦"}[t]||"•");
function normalize(raw){
  return {
    generatedAt:raw.generatedAt||raw.generated_at||null,
    missions:Array.isArray(raw.missions)?raw.missions:[],
    chantiers:Array.isArray(raw.chantiers)?raw.chantiers:(Array.isArray(raw.worksites)?raw.worksites:[])
  };
}
let loadError="";
async function load(){
 try{const r=await fetch("Charli_Consultation.json?ts="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);data=normalize(await r.json());loadError=""}
 catch(e){loadError="Données indisponibles : vérifiez la publication STM."}
 const d=data.generatedAt?new Date(data.generatedAt):null;
 document.querySelector("#updated").textContent=d&&!isNaN(d)?d.toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Non disponible";
 render();
}
function section(title,body,more="",target=""){return `<section class="section"><div class="section-title"><h2>${title}</h2>${more?`<a class="link" href="#vue=${encodeURIComponent(target)}">${more}</a>`:""}</div>${body}</section>`}
const isCodir=m=>m.codir===true||m.codir===1||m.codir==="true";
const codirMissions=()=>data.missions.filter(isCodir);
const futureMissions=()=>{const today=new Date().toLocaleDateString("en-CA");return data.missions.filter(m=>m.date&&m.date>=today&&m.status!=="Terminée").sort((a,b)=>a.date.localeCompare(b.date))};
const empty=msg=>`<div class="empty">${esc(msg)}</div>`;
function missionRow(m){
 const tag=(m.priority||"").toLowerCase().includes("urgent")?`<span class="pill urgent">Urgent</span>`:m.watchLevel?`<span class="pill watch">${esc(m.watchLevel)}</span>`:`<span class="pill info">${esc(m.status||"Info")}</span>`;
 return `<div class="row">${tag}<div class="grow"><div class="title">${esc(m.title)}</div><div class="sub">${esc(m.location||m.team||"")}</div></div><div class="sub">${fmt(m.date)}</div></div>`;
}
function chantierRow(c){
 const title=c.name||c.title||"Chantier sans nom";
 const nextAction=c.nextAction||c.nextStep||"";
 const watch=c.watchNote||c.watch||"";
 const hasProgress=c.progress!==undefined && c.progress!==null && c.progress!=="" && !Number.isNaN(Number(c.progress));
 const p=hasProgress?Math.max(0,Math.min(100,Number(c.progress))):null;
 return `<a class="row chantier-link" href="#chantier=${encodeURIComponent(String(c.id||''))}" data-chantier="${esc(c.id||'')}"><div class="grow"><div class="title">${esc(title)}</div><div class="sub">${esc(c.location||c.company||c.status||"")}</div>${hasProgress?`<div class="progress"><i style="width:${p}%"></i></div>`:""}</div>${hasProgress?`<b>${p}%</b>`:`<span class="pill info">${esc(c.status||"En cours")}</span>`}</a>`;
}
function home(){
 const urgent=data.missions.filter(m=>(m.priority||"").toLowerCase().includes("urgent")).length;
 const watch=data.missions.filter(m=>m.watchLevel||m.watchNote).length;
 const codir=codirMissions();
 const counts=Object.fromEntries(teams.map(t=>[t,data.missions.filter(m=>m.team===t).length]));
 const upcoming=futureMissions();
 return `${loadError?`<div class="error-banner">${esc(loadError)}</div>`:""}<div class="kpis">
 <div class="kpi"><b>${data.missions.length}</b><small>Missions</small></div>
 <div class="kpi"><b>${data.chantiers.length}</b><small>Chantiers</small></div>
 <div class="kpi"><b>${urgent}</b><small>Priorités</small></div>
 <div class="kpi"><b>${watch}</b><small>Vigilances</small></div></div>
 ${section("À RETENIR (CODIR)",`<div class="card">${codir.length?codir.slice(0,5).map(missionRow).join(""):empty("Aucune mission cochée CODIR dans STM.")}</div>`,"Voir tout →","codir")}
 ${section("CHANTIERS EN COURS",`<div class="card">${data.chantiers.length?data.chantiers.slice(0,4).map(chantierRow).join(""):empty("Aucun chantier publié.")}</div>`,"Voir tout →","chantiers")}
 ${section("ACTIVITÉ DES ÉQUIPES",`<div class="teamgrid">${teams.map(t=>`<a href="#vue=equipes" class="team"><div class="ico">${teamIcon(t)}</div><small>${t}</small><b>${counts[t]}</b><small>missions</small></a>`).join("")}</div>`,"Voir tout →","equipes")}
 ${section("PROCHAINEMENT",`<div class="card">${upcoming.length?upcoming.slice(0,5).map(missionRow).join(""):empty("Aucune mission à venir.")}</div>`,"Voir tout →","prochainement")}`;
}
function codirPage(){const ms=codirMissions();return `<h2 class="headline">Missions remontées au CODIR</h2><div class="card">${ms.length?ms.map(missionRow).join(""):empty("Aucune mission cochée CODIR dans STM.")}</div>`}
function prochainement(){const ms=futureMissions();return `<h2 class="headline">Missions à venir</h2><div class="card">${ms.length?ms.map(missionRow).join(""):empty("Aucune mission à venir.")}</div>`}
function planning(){
 const ms=[...data.missions].filter(m=>m.date).sort((a,b)=>a.date.localeCompare(b.date));
 // Toujours afficher la semaine de travail civile : lundi -> vendredi.
 // La semaine est déterminée à partir de la date de génération des données STM.
 const ref=new Date(data.generatedAt||new Date());
 const localRef=new Date(ref.getFullYear(),ref.getMonth(),ref.getDate(),12);
 const day=localRef.getDay(); // 0=dimanche, 1=lundi...
 const deltaToMonday=day===0?-6:1-day;
 const monday=new Date(localRef); monday.setDate(localRef.getDate()+deltaToMonday);
 const isoLocal=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
 const days=Array.from({length:5},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return isoLocal(d)});
 return `<h2 class="headline">Planning des équipes — semaine en cours</h2>
 ${teams.map(t=>{
   const tm=ms.filter(m=>m.team===t);
   return `<section class="team-plan">
     <div class="team-plan-head"><div><span class="team-big-icon">${teamIcon(t)}</span><b>${esc(t)}</b></div><span>${tm.length} mission${tm.length>1?"s":""}</span></div>
     <div class="week-grid">${days.map(d=>{
       const dm=tm.filter(m=>m.date===d);
       return `<div class="day-card"><div class="day-name">${new Intl.DateTimeFormat("fr-FR",{weekday:"short",day:"numeric"}).format(new Date(d+"T12:00:00"))}</div>
       ${dm.length?dm.map(m=>`<div class="mini-mission"><b>${esc(m.title)}</b><small>📍 ${esc(m.location||"Lieu non renseigné")}</small><small>${esc(m.status||"À faire")}${m.startTime?" • "+esc(m.startTime):""}</small></div>`).join(""):`<div class="no-mission">—</div>`}</div>`;
     }).join("")}</div>
   </section>`;
 }).join("")}`;
}
function chantiers(){
 return `<h2 class="headline">Chantiers en cours</h2><div class="worksite-grid">${data.chantiers.length?data.chantiers.map(c=>{
 const title=c.name||c.title||"Chantier sans nom";
 const nextAction=c.nextAction||c.nextStep||"";
 const deadline=c.endDate||c.deadline||"";
 const watch=c.watchNote||c.watch||"";
 const hasProgress=c.progress!==undefined&&c.progress!==null&&c.progress!==""&&!Number.isNaN(Number(c.progress));
 const p=hasProgress?Math.max(0,Math.min(100,Number(c.progress))):null;
 return `<a class="worksite-card chantier-link" href="#chantier=${encodeURIComponent(String(c.id||''))}" data-chantier="${esc(c.id||'')}"><div class="worksite-top"><div><div class="worksite-label">CHANTIER</div><h3>${esc(title)}</h3></div>${hasProgress?`<div class="percent">${p}%</div>`:`<span class="pill info">${esc(c.status||"En cours")}</span>`}</div>${hasProgress?`<div class="progress big"><i style="width:${p}%"></i></div>`:""}<div class="worksite-details"><div><small>Entreprise / intervenant</small><b>${esc(c.company||"Non renseigné")}</b></div><div><small>État</small><b>${esc(c.status||"En cours")}</b></div>${nextAction?`<div><small>Prochaine étape</small><b>${esc(nextAction)}</b></div>`:""}${deadline?`<div><small>Échéance</small><b>${esc(deadline)}</b></div>`:""}${c.watchLevel?`<div><small>Vigilance</small><b>${esc(c.watchLevel)}</b></div>`:""}${Array.isArray(c.phases)&&c.phases.length?`<div><small>Phases</small><b>${c.phases.length} phase${c.phases.length>1?"s":""}</b></div>`:""}</div>${(c.watchLevel||watch)?`<div class="worksite-watch"><span class="pill watch">${esc(c.watchLevel||"Vigilance")}</span>${watch?`<span>${esc(watch)}</span>`:""}</div>`:""}</a>`;
 }).join(""):`<div class="empty">Aucun chantier publié.</div>`}</div>`;
}
function chantierDetail(id){
 const c=data.chantiers.find(x=>String(x.id)===String(id)); if(!c){current="chantiers";return chantiers()}
 const hasProgress=c.progress!==undefined&&c.progress!==null&&c.progress!==""&&!Number.isNaN(Number(c.progress));
 const p=hasProgress?Math.max(0,Math.min(100,Number(c.progress))):null;
 const companies=Array.isArray(c.companies)?c.companies:[];
 const phases=Array.isArray(c.phases)?c.phases:[];
 const companyName=id=>companies.find(x=>String(x.id)===String(id))?.name||"";
 const field=(label,value,wide=false)=>value!==undefined&&value!==null&&String(value).trim()!==""?`<div class="detail-field ${wide?'wide':''}"><small>${esc(label)}</small><div>${esc(value)}</div></div>`:"";
 const money=v=>{const n=Number(v);return n?new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(n):""};
 return `<button class="detail-back" id="backChantiers">← Retour aux chantiers</button>
 <div class="detail-hero"><div class="worksite-label">FICHE CHANTIER</div><h2>${esc(c.name||"Chantier")}</h2><div class="sub">${esc(c.location||"Lieu non renseigné")}</div>
 <div class="detail-meta"><span class="pill info">${esc(c.status||"État non renseigné")}</span>${c.priority?`<span class="pill ${String(c.priority).toLowerCase().includes('urgent')?'urgent':'info'}">${esc(c.priority)}</span>`:""}${c.watchLevel?`<span class="pill watch">⚠ ${esc(c.watchLevel)}</span>`:""}${c.pinned?`<span class="pill watch">★ Suivi prioritaire</span>`:""}${c.codir?`<span class="pill info">CODIR</span>`:""}</div>
 ${hasProgress?`<div class="progress big"><i style="width:${p}%"></i></div><div class="sub">Avancement : ${p}%</div>`:""}</div>
 <section class="detail-section"><h3>ℹ️ Informations générales</h3><div class="detail-grid">${field("Description",c.description,true)}${field("Responsable interne",c.manager)}${field("Date de début prévue",c.startDate?fmt(c.startDate):"")}${field("Date de fin prévue",c.endDate?fmt(c.endDate):"")}${field("Motif de vigilance",c.watchNote,true)}</div></section>
 <section class="detail-section"><h3>🏢 Entreprises</h3>${companies.length?companies.map(co=>`<div class="company"><div class="company-head"><b>${esc(co.name||"Entreprise")}</b><span class="sub">${esc(co.specialty||"")}</span></div>${co.contact||co.phone||co.email?`<p>${esc([co.contact,co.phone,co.email].filter(Boolean).join(" • "))}</p>`:""}${co.forecast||co.actual?`<p>${co.forecast?`Prévision : ${esc(money(co.forecast))}`:""}${co.forecast&&co.actual?" • ":""}${co.actual?`Réel : ${esc(money(co.actual))}`:""}</p>`:""}</div>`).join(""):`<div class="muted">Aucune entreprise renseignée.</div>`}</section>
 <section class="detail-section"><h3>🧱 Phases du chantier</h3>${phases.length?phases.map(ph=>`<div class="phase"><div class="phase-head"><b>${esc(ph.name||"Phase")}</b><span class="pill info">${esc(ph.status||"À venir")}</span></div><p>${esc([ph.date?fmt(ph.date):"",companyName(ph.companyId),ph.duration].filter(Boolean).join(" • "))}</p>${ph.mission?`<p><b>Mission :</b> ${esc(ph.mission)}</p>`:""}${ph.report?`<p><b>Rapport :</b> ${esc(ph.report)}</p>`:""}${ph.watchLevel||ph.watchNote?`<p>⚠ ${esc([ph.watchLevel,ph.watchNote].filter(Boolean).join(" — "))}</p>`:""}</div>`).join(""):`<div class="muted">Aucune phase renseignée.</div>`}</section>
 <section class="detail-section"><h3>📝 Rapport d’intervention</h3><div class="detail-grid">${field("Date du rapport",c.reportDate?fmt(c.reportDate):"")}${field("Observations",c.observations,true)}${field("Réserves / problèmes",c.issues,true)}${field("Suite à donner / prochaine action",c.nextAction,true)}</div>${!c.reportDate&&!c.observations&&!c.issues&&!c.nextAction?`<div class="muted">Aucun rapport renseigné.</div>`:""}</section>
 <section class="detail-section"><h3>⚠️ Points bloquants / décisions</h3><div class="detail-grid">${field("Points bloquants",c.blockers,true)}${field("Décision / arbitrage",c.decision,true)}</div>${!c.blockers&&!c.decision?`<div class="muted">Aucun point bloquant ou arbitrage renseigné.</div>`:""}</section>
 ${c.updatedAt?`<div class="sub" style="text-align:center;margin:10px">Dernière mise à jour STM : ${esc(new Date(c.updatedAt).toLocaleString("fr-FR"))}</div>`:""}`;
}
function equipes(){return `<h2 class="headline">Activité par équipe</h2>${teams.map(t=>section(`${teamIcon(t)} ${t}`,`<div class="card">${data.missions.filter(m=>m.team===t).slice(0,8).map(missionRow).join("")||`<div class="empty">Aucune mission.</div>`}</div>`)).join("")}`}
function alerts(){const a=data.missions.filter(m=>m.watchLevel||m.watchNote||(m.priority||"").toLowerCase().includes("urgent"));return `<h2 class="headline">Priorités & vigilances</h2><div class="card">${a.length?a.map(missionRow).join(""):`<div class="empty">Aucune alerte publiée.</div>`}</div>`}
function render(){
 const view=document.querySelector("#view");
 if(current.startsWith("chantier:")) view.innerHTML=chantierDetail(current.slice(9));
 else view.innerHTML=({home,planning,chantiers,equipes,alerts,codir:codirPage,prochainement}[current]||home)();
 document.querySelectorAll(".bottom button").forEach(b=>b.classList.toggle("active",b.dataset.view===current));
 const back=document.querySelector("#backChantiers"); if(back)back.onclick=()=>{current="chantiers";render();window.scrollTo(0,0)};
}
// Navigation chantier par URL (#chantier=ID). Les cartes sont de vrais liens HTML :
// cela fonctionne même si un navigateur mobile bloque un gestionnaire tactile JavaScript.
function routeFromHash(){
 const h=location.hash||"";
 if(h.startsWith("#chantier=")){const id=decodeURIComponent(h.slice(10));if(id){current="chantier:"+id;render();window.scrollTo(0,0);return}}
 if(h.startsWith("#vue=")){const v=decodeURIComponent(h.slice(5));if(["home","planning","chantiers","equipes","alerts","codir","prochainement"].includes(v)){current=v;render();window.scrollTo(0,0);return}}
 current="home";render();
}
window.addEventListener("hashchange",routeFromHash);
document.querySelectorAll(".bottom button").forEach(b=>b.onclick=()=>{location.hash="vue="+b.dataset.view;routeFromHash()});
load().then(routeFromHash);

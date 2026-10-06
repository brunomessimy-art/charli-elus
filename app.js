
const fallback = {
 generatedAt:new Date().toISOString(),
 missions:[
 {title:"Fuites suite aux intempéries",team:"Bâtiment",location:"Salle du Riveral / Espace C. Urios",date:"2026-10-06",status:"À faire",priority:"Urgente",codir:true,watchLevel:"Vigilance"},
 {title:"Massif béton avenue Foch",team:"Voirie",location:"Avenue Foch",date:"2026-10-06",status:"En cours",priority:"Suivi",codir:true,progress:45},
 {title:"Pose de parapluies – Octobre rose",team:"Festivités",location:"Salle Sonambule",date:"2026-10-07",status:"À faire",priority:"Normale",watchLevel:"Vigilance"},
 {title:"Peinture entrée médiathèque",team:"Bâtiment",location:"Médiathèque",date:"2026-10-06",status:"À faire",priority:"Normale"},
 {title:"Panneaux vidéosurveillance",team:"Voirie",location:"Centre-ville",date:"2026-10-07",status:"À faire",priority:"Normale"},
 {title:"Entretien cimetière",team:"Espaces verts",location:"Cimetière",date:"2026-10-06",status:"À faire",priority:"Normale"},
 {title:"Tonte et marquage terrain de foot",team:"Espaces verts",location:"Complexe sportif",date:"2026-10-08",status:"À faire",priority:"Normale"}
 ],
 chantiers:[
 {title:"Reprise EP Rivelin",company:"Aqua Solutions",progress:60,status:"En cours",watch:"Accès riverains à maintenir"},
 {title:"Enrobé cour écoles",company:"Colas",progress:80,status:"Bon avancement"},
 {title:"Toiture Espace C. Urios",company:"Diagnostic en cours",progress:30,status:"Vigilance",watch:"Infiltrations"}
 ]
};
let data=fallback, current="home";

const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fmt=d=>{try{return new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"short"}).format(new Date(d+"T12:00:00"))}catch{return d}};
const teams=["Bâtiment","Voirie","Espaces verts","Propreté","Festivités"];
const teamIcon=t=>({"Bâtiment":"⌂","Voirie":"▥","Espaces verts":"●","Propreté":"♣","Festivités":"✦"}[t]||"•");
function normalize(raw){
  return {
    generatedAt:raw.generatedAt||raw.generated_at||new Date().toISOString(),
    missions:Array.isArray(raw.missions)?raw.missions:[],
    chantiers:Array.isArray(raw.chantiers)?raw.chantiers:(Array.isArray(raw.worksites)?raw.worksites:fallback.chantiers)
  };
}
async function load(){
  try{const r=await fetch("Charli_Consultation.json?ts="+Date.now(),{cache:"no-store"});if(r.ok)data=normalize(await r.json())}catch(e){}
  document.querySelector("#updated").textContent=new Date(data.generatedAt).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
  render();
}
function section(title,body,more=""){return `<section class="section"><div class="section-title"><h2>${title}</h2>${more?`<span class="link">${more}</span>`:""}</div>${body}</section>`}
function missionRow(m){
 const tag=(m.priority||"").toLowerCase().includes("urgent")?`<span class="pill urgent">Urgent</span>`:m.watchLevel?`<span class="pill watch">${esc(m.watchLevel)}</span>`:`<span class="pill info">${esc(m.status||"Info")}</span>`;
 return `<div class="row">${tag}<div class="grow"><div class="title">${esc(m.title)}</div><div class="sub">${esc(m.location||m.team||"")}</div></div><div class="sub">${fmt(m.date)}</div></div>`;
}
function chantierRow(c){
 let p=Number(c.progress)||0; return `<div class="row"><div class="grow"><div class="title">${esc(c.title)}</div><div class="sub">${esc(c.company||"")}</div><div class="progress"><i style="width:${Math.max(0,Math.min(100,p))}%"></i></div></div><b>${p}%</b></div>`;
}
function home(){
 const urgent=data.missions.filter(m=>(m.priority||"").toLowerCase().includes("urgent")).length;
 const watch=data.missions.filter(m=>m.watchLevel||m.watchNote).length;
 const codir=data.missions.filter(m=>m.codir||m.watchLevel||(m.priority||"").toLowerCase().includes("urgent")).slice(0,5);
 const counts=Object.fromEntries(teams.map(t=>[t,data.missions.filter(m=>m.team===t).length]));
 return `<div class="kpis">
  <div class="kpi"><b>${data.missions.length}</b><small>Missions</small></div>
  <div class="kpi"><b>${data.chantiers.length}</b><small>Chantiers</small></div>
  <div class="kpi"><b>${urgent}</b><small>Priorités</small></div>
  <div class="kpi"><b>${watch}</b><small>Vigilances</small></div></div>
  ${section("À RETENIR (CODIR)",`<div class="card">${(codir.length?codir:data.missions.slice(0,4)).map(missionRow).join("")}</div>`,"Voir tout →")}
  ${section("CHANTIERS EN COURS",`<div class="card">${data.chantiers.slice(0,4).map(chantierRow).join("")}</div>`,"Voir tout →")}
  ${section("ACTIVITÉ DES ÉQUIPES",`<div class="teamgrid">${teams.map(t=>`<div class="team"><div class="ico">${teamIcon(t)}</div><small>${t}</small><b>${counts[t]}</b><small>missions</small></div>`).join("")}</div>`)}
  ${section("PROCHAINEMENT",`<div class="card">${[...data.missions].filter(m=>m.date).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5).map(missionRow).join("")}</div>`)}
 `;
}
function planning(){
 const ms=[...data.missions].filter(m=>m.date).sort((a,b)=>a.date.localeCompare(b.date));
 const days=[...new Set(ms.map(m=>m.date))];
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
 return `<h2 class="headline">Chantiers en cours</h2>
 <div class="worksite-grid">${data.chantiers.length?data.chantiers.map(c=>{
   const p=Math.max(0,Math.min(100,Number(c.progress)||0));
   return `<article class="worksite-card">
     <div class="worksite-top"><div><div class="worksite-label">CHANTIER</div><h3>${esc(c.title)}</h3></div><div class="percent">${p}%</div></div>
     <div class="progress big"><i style="width:${p}%"></i></div>
     <div class="worksite-details">
       <div><small>Entreprise / intervenant</small><b>${esc(c.company||"Non renseigné")}</b></div>
       <div><small>État</small><b>${esc(c.status||"En cours")}</b></div>
       ${c.nextStep?`<div><small>Prochaine étape</small><b>${esc(c.nextStep)}</b></div>`:""}
       ${c.deadline?`<div><small>Échéance</small><b>${esc(c.deadline)}</b></div>`:""}
     </div>
     ${c.watch?`<div class="worksite-watch"><span class="pill watch">Vigilance</span><span>${esc(c.watch)}</span></div>`:""}
   </article>`;
 }).join(""):`<div class="empty">Aucun chantier publié.</div>`}</div>`;
}
function equipes(){return `<h2 class="headline">Activité par équipe</h2>${teams.map(t=>section(`${teamIcon(t)} ${t}`,`<div class="card">${data.missions.filter(m=>m.team===t).slice(0,8).map(missionRow).join("")||`<div class="empty">Aucune mission.</div>`}</div>`)).join("")}`}
function alerts(){const a=data.missions.filter(m=>m.watchLevel||m.watchNote||(m.priority||"").toLowerCase().includes("urgent"));return `<h2 class="headline">Priorités & vigilances</h2><div class="card">${a.length?a.map(missionRow).join(""):`<div class="empty">Aucune alerte publiée.</div>`}</div>`}
function render(){
 document.querySelector("#view").innerHTML=({home,planning,chantiers,equipes,alerts}[current])();
 document.querySelectorAll(".bottom button").forEach(b=>b.classList.toggle("active",b.dataset.view===current));
}
document.querySelectorAll(".bottom button").forEach(b=>b.onclick=()=>{current=b.dataset.view;render();scrollTo(0,0)});
load();

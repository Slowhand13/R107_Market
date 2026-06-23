import { useState, useRef, useEffect, useCallback } from "react";
import { Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK = [
{ id:"m1", title:"450 SL – 1973 – Palladium Silver", price:38500, km:87000, year:1973, engine:"450 SL", trans:"Auto", country:"DE", source:"AutoScout24", color:"Palladium Silver", url:"#", photo:"https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80", seller:"Classic Stuttgart GmbH", desc:"Original bodywork, refurbished burgundy leather interior. New roof 2022. Full service history." },
{ id:"m2", title:"450 SL – 1976 – Arctic White", price:32000, km:112000, year:1976, engine:"450 SL", trans:"Auto", country:"FR", source:"LeBonCoin", color:"Arctic White", url:"#", photo:"https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80", seller:"Private seller – Lyon", desc:"Good overall condition. Some surface rust on sills. CT valid. Price negotiable." },
{ id:"m3", title:"350 SL – 1972 – Fjord Blue", price:28500, km:98000, year:1972, engine:"350 SL", trans:"Auto", country:"FR", source:"La Centrale", color:"Fjord Blue", url:"#", photo:"https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80", seller:"Garage Provence Classic", desc:"Engine rebuilt at 85,000km. Both roofs original. Period chrome wheels." },
{ id:"m4", title:"500 SL – 1982 – Signal Red", price:24000, km:145000, year:1982, engine:"500 SL", trans:"Auto", country:"DE", source:"Mobile.de", color:"Signal Red", url:"#", photo:"https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80", seller:"Oldtimer Berlin", desc:"Partial restoration 2019. Fresh paint. Period fabric interior. Documentation available." },
{ id:"m5", title:"280 SL – 1974 – Mimosa Yellow", price:19500, km:178000, year:1974, engine:"280 SL", trans:"Manual", country:"IT", source:"AutoScout24", color:"Mimosa Yellow", url:"#", photo:"https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80", seller:"Milano Classiche", desc:"Restoration project. Mechanically sound, bodywork needs attention. Priced accordingly." },
{ id:"m6", title:"450 SLC – 1977 – Sage Green", price:22000, km:132000, year:1977, engine:"450 SLC", trans:"Auto", country:"BE", source:"AutoScout24", color:"Sage Green", url:"#", photo:"https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80", seller:"Classic Cars Brussels", desc:"Rare SLC in Europe. Original hardtop. Regular dealer servicing." },
{ id:"m7", title:"450 SL – 1978 – Topaz Blue", price:41000, km:62000, year:1978, engine:"450 SL", trans:"Auto", country:"CH", source:"AutoScout24", color:"Topaz Blue", url:"#", photo:"https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&q=80", seller:"Geneva Motor Heritage", desc:"Exceptional example, verified mileage. 3 owners. Never used in winter." },
{ id:"m8", title:"350 SL – 1971 – Diamond White", price:35000, km:74000, year:1971, engine:"350 SL", trans:"Auto", country:"FR", source:"Argus", color:"Diamond White", url:"#", photo:"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80", seller:"Artcurial Motorcars", desc:"First R107 model year. Original black leather. Complete documentation from new." },
{ id:"m9", title:"500 SL – 1984 – Anthracite Grey", price:18500, km:198000, year:1984, engine:"500 SL", trans:"Auto", country:"ES", source:"Mobile.de", color:"Anthracite Grey", url:"#", photo:"https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=400&q=80", seller:"Barcelona Classics", desc:"Genuine mileage. Engine replaced at 165k. Project or daily driver." },
{ id:"m10",title:"450 SL – 1975 – Sienna Ochre", price:29000, km:103000, year:1975, engine:"450 SL", trans:"Auto", country:"DE", source:"La Centrale", color:"Sienna Ochre", url:"#", photo:"https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80", seller:"Private seller – Munich", desc:"Very solid bodywork for age. Original upholstery in good shape. Roof to replace." },
{ id:"m11",title:"280 SL – 1976 – Brilliant Blue", price:15500, km:221000, year:1976, engine:"280 SL", trans:"Manual", country:"FR", source:"LeBonCoin", color:"Brilliant Blue", url:"#", photo:"https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80", seller:"Private seller – Bordeaux", desc:"Working vehicle. Mechanically OK. Full bodywork restoration needed. Ideal project." },
{ id:"m12",title:"450 SLC – 1979 – Obsidian Black", price:44500, km:48000, year:1979, engine:"450 SLC", trans:"Auto", country:"UK", source:"AutoScout24", color:"Obsidian Black", url:"#", photo:"https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80", seller:"Hertfordshire Classic Cars", desc:"Full restoration 2020–2022. €38k in receipts. Concours condition. Delivery possible." },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function linReg(pts) {
const n = pts.length; if (n < 2) return null;
let sx=0,sy=0,sxy=0,sxx=0;
pts.forEach(p=>{sx+=p.x;sy+=p.y;sxy+=p.x*p.y;sxx+=p.x*p.x;});
const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx), intercept=(sy-slope*sx)/n;
return { slope, intercept, predict: x=>slope*x+intercept };
}
function status(x, y, reg, thresh) {
if (!reg) return "fair";
const r=(y-reg.predict(x))/reg.predict(x);
if (r < -(thresh/100)) return "good";
if (r > (thresh/100)) return "over";
return "fair";
}
function fmt(n) { return n?.toLocaleString("en-GB") ?? "—"; }

function parseCSV(text) {
const lines = text.trim().split(/\r?\n/);
const headers = lines[0].split(",").map(h=>h.trim().toLowerCase().replace(/\s+/g,"_"));
return lines.slice(1).filter(l=>l.trim()).map((line,i)=>{
const vals=line.split(","); const o={};
headers.forEach((h,j)=>{o[h]=(vals[j]||"").trim();});
return {
id:`csv_${i}`,
title: o.title||o.titre||"Untitled",
price: parseInt(o.price||o.prix)||0,
km: parseInt(o.km||o.kilometrage)||0,
year: parseInt(o.year||o.annee)||0,
engine:o.engine||o.moteur||"",
trans: o.trans||o.boite||o.transmission||"",
country:o.country||o.pays||"",
source:o.source||"",
color: o.color||o.couleur||"",
url: o.url||"#",
photo: o.photo||"",
seller:o.seller||o.vendeur||"",
desc: o.desc||o.description||"",
};
});
}

// ── Colours ───────────────────────────────────────────────────────────────────
const C = { bg:"#0A0A0A", surface:"#141414", card:"#1A1A1A", border:"#242424",
gold:"#C8A96E", cream:"#E8E0D0", muted:"#666", dim:"#444",
green:"#4ade80", red:"#f87171" };

// ── Storage helpers ───────────────────────────────────────────────────────────
const STORE_KEY = "r107_v2";
function loadStore() {
try { return JSON.parse(localStorage.getItem(STORE_KEY)||"{}"); } catch { return {}; }
}
function saveStore(data) {
try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch {}
}

// ── Dot ───────────────────────────────────────────────────────────────────────
const Dot = ({ cx,cy,payload,onSelect,selectedId,reg,thresh,watchlist }) => {
if (!cx||!cy) return null;
const s = status(payload.x, payload.y, reg, thresh);
const col = s==="good"?C.green : s==="over"?C.red : C.gold;
const isSel = selectedId===payload.id;
const isWatched = watchlist.has(payload.id);
return (
<g onClick={()=>onSelect(payload)} style={{cursor:"pointer"}}>
<circle cx={cx} cy={cy} r={isSel?10:7} fill={col} fillOpacity={0.85}
stroke={isSel?"#fff":col} strokeWidth={isSel?2:1} style={{transition:"r 0.15s"}}/>
{isWatched && <circle cx={cx+6} cy={cy-6} r={3} fill="#fff" stroke={C.bg} strokeWidth={1}/>}
</g>
);
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
const ChartTip = ({active,payload}) => {
if (!active||!payload?.length) return null;
const d=payload[0]?.payload; if (!d?.title) return null;
return (
<div style={{background:C.card,border:`1px solid ${C.gold}33`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.cream,maxWidth:210}}>
<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1,color:C.gold,marginBottom:3}}>{d.title}</div>
<div style={{fontWeight:600}}>£{fmt(d.price)}</div>
<div style={{color:C.muted}}>{fmt(d.km)} km · {d.year} · {d.source}</div>
</div>
);
};

// ── Notes modal ───────────────────────────────────────────────────────────────
const NotesModal = ({car,initial,onSave,onClose}) => {
const [val,setVal]=useState(initial||"");
return (
<div style={{position:"fixed",inset:0,background:"#000A",zIndex:200,display:"flex",alignItems:"flex-end"}}
onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
<div style={{width:"100%",background:C.surface,borderTop:`1px solid ${C.border}`,borderRadius:"16px 16px 0 0",padding:20}}>
<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:1.5,color:C.cream,marginBottom:4}}>NOTES</div>
<div style={{fontSize:12,color:C.muted,marginBottom:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{car.title}</div>
<textarea
autoFocus value={val} onChange={e=>setVal(e.target.value)}
placeholder="Seen it, rust on driver sill. Called seller 15/06..."
style={{width:"100%",minHeight:100,background:C.card,border:`1px solid ${C.border}`,
borderRadius:8,color:C.cream,fontSize:13,padding:12,resize:"vertical",
fontFamily:"Inter,sans-serif",outline:"none",boxSizing:"border-box"}}/>
<div style={{display:"flex",gap:8,marginTop:12}}>
<button onClick={onClose}
style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,
padding:"10px 0",borderRadius:8,cursor:"pointer",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,fontSize:13}}>
CANCEL
</button>
<button onClick={()=>onSave(val)}
style={{flex:2,background:C.gold+"22",border:`1px solid ${C.gold}`,color:C.gold,
padding:"10px 0",borderRadius:8,cursor:"pointer",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,fontSize:13}}>
SAVE NOTE
</button>
</div>
</div>
</div>
);
};

// ── Settings modal ────────────────────────────────────────────────────────────
const SettingsModal = ({settings,onSave,onClose}) => {
const [thresh,setThresh]=useState(settings.thresh);
const [alertMax,setAlertMax]=useState(settings.alertMax);
const [sheetUrl,setSheetUrl]=useState(settings.sheetUrl||"");
return (
<div style={{position:"fixed",inset:0,background:"#000A",zIndex:200,display:"flex",alignItems:"flex-end"}}
onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
<div style={{width:"100%",background:C.surface,borderTop:`1px solid ${C.border}`,borderRadius:"16px 16px 0 0",padding:20,paddingBottom:32}}>
<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:1.5,color:C.cream,marginBottom:20}}>SETTINGS</div>

<Label>DEAL THRESHOLD — currently {thresh}% below market</Label>
<input type="range" min={5} max={30} value={thresh} onChange={e=>setThresh(+e.target.value)}
style={{width:"100%",accentColor:C.gold,marginBottom:20}}/>

<Label>PRICE ALERT — flag listings under £{fmt(alertMax)}</Label>
<input type="range" min={10000} max={60000} step={1000} value={alertMax}
onChange={e=>setAlertMax(+e.target.value)}
style={{width:"100%",accentColor:C.green,marginBottom:20}}/>

<Label>GOOGLE SHEETS URL (optional — for live data)</Label>
<input value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)}
placeholder="https://docs.google.com/spreadsheets/d/..."
style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,color:C.cream,
padding:"10px 12px",borderRadius:8,fontSize:12,outline:"none",
fontFamily:"Inter,sans-serif",boxSizing:"border-box",marginBottom:20}}/>

<button onClick={()=>onSave({thresh,alertMax,sheetUrl})}
style={{width:"100%",background:C.gold+"22",border:`1px solid ${C.gold}`,color:C.gold,
padding:"13px 0",borderRadius:8,cursor:"pointer",
fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,fontSize:14}}>
SAVE SETTINGS
</button>
</div>
</div>
);
};

const Label = ({children}) => (
<div style={{fontSize:9,letterSpacing:2,color:C.dim,marginBottom:8}}>{children}</div>
);

// ── Detail panel ──────────────────────────────────────────────────────────────
const Detail = ({car,reg,thresh,watchlist,notes,onWatch,onNote,onClose}) => {
if (!car) return null;
const xv = car.km;
const s = status(xv, car.price, reg, thresh);
const pred = reg ? Math.round(reg.predict(xv)) : null;
const diff = pred ? Math.round(((car.price-pred)/pred)*100) : null;
const sColor = s==="good"?C.green:s==="over"?C.red:C.gold;
const sLabel = s==="good"?"GOOD DEAL":s==="over"?"OVERPRICED":"MARKET PRICE";
const isWatched = watchlist.has(car.id);
const note = notes[car.id]||"";

return (
<div style={{position:"fixed",right:0,top:0,bottom:0,width:"min(390px,100vw)",
background:"#0D0D0D",borderLeft:`1px solid ${C.border}`,zIndex:100,
overflowY:"auto",display:"flex",flexDirection:"column",
animation:"slideIn 0.22s ease"}}>
<style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

{/* Photo */}
<div style={{position:"relative",height:210,background:C.card,flexShrink:0}}>
{car.photo
? <img src={car.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.8}}/>
: <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#333",fontSize:40}}>◈</div>}
<button onClick={onClose} style={{position:"absolute",top:12,right:12,
background:"#000C",border:`1px solid ${C.border}`,color:C.cream,
width:32,height:32,borderRadius:16,cursor:"pointer",fontSize:15,
display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
<div style={{position:"absolute",bottom:12,left:12,
background:sColor+"22",border:`1px solid ${sColor}`,color:sColor,
fontSize:10,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,
padding:"3px 10px",borderRadius:4}}>{sLabel}</div>
</div>

<div style={{padding:"18px 18px 36px"}}>
{/* Title */}
<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:19,letterSpacing:1.5,
color:C.cream,lineHeight:1.2,marginBottom:16}}>{car.title}</div>

{/* Price block */}
<div style={{background:C.card,borderRadius:8,padding:14,marginBottom:14}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
<div>
<div style={{fontSize:9,letterSpacing:2,color:C.dim,marginBottom:2}}>ASKING PRICE</div>
<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:C.cream,letterSpacing:1}}>
£{fmt(car.price)}
</div>
</div>
{pred && (
<div style={{textAlign:"right"}}>
<div style={{fontSize:9,letterSpacing:2,color:C.dim,marginBottom:2}}>MARKET EST.</div>
<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:C.muted}}>£{fmt(pred)}</div>
<div style={{fontSize:12,color:sColor,fontWeight:700,marginTop:1}}>
{diff>0?`+${diff}%`:`${diff}%`}
</div>
</div>
)}
</div>
</div>

{/* Specs */}
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
{[["MILEAGE",fmt(car.km)+" km"],["YEAR",car.year],["ENGINE",car.engine],
["GEARBOX",car.trans],["COUNTRY",car.country],["SOURCE",car.source]]
.map(([l,v])=>(
<div key={l} style={{background:C.card,borderRadius:6,padding:"10px 12px"}}>
<div style={{fontSize:9,color:C.dim,letterSpacing:1.5,marginBottom:3}}>{l}</div>
<div style={{fontSize:13,color:C.cream,fontWeight:500}}>{v||"—"}</div>
</div>
))}
</div>

{/* Seller */}
{car.seller && <div style={{fontSize:12,color:C.muted,marginBottom:10}}>
<span style={{fontSize:9,color:C.dim,letterSpacing:1.5}}>SELLER · </span>{car.seller}
</div>}

{/* Desc */}
{car.desc && <div style={{fontSize:13,color:"#AAA",lineHeight:1.65,marginBottom:18,
borderLeft:`2px solid ${C.gold}33`,paddingLeft:12}}>{car.desc}</div>}

{/* Note */}
{note && (
<div style={{background:C.gold+"0F",border:`1px solid ${C.gold}33`,borderRadius:8,
padding:12,marginBottom:14,fontSize:12,color:C.cream,lineHeight:1.6}}>
<span style={{fontSize:9,color:C.gold,letterSpacing:1.5,display:"block",marginBottom:4}}>YOUR NOTE</span>
{note}
</div>
)}

{/* Actions */}
<div style={{display:"flex",gap:8,marginBottom:10}}>
<button onClick={()=>onWatch(car.id)} style={{
flex:1,padding:"11px 0",borderRadius:8,cursor:"pointer",fontSize:12,
fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1.5,
background: isWatched ? C.gold+"22" : "transparent",
border:`1px solid ${isWatched?C.gold:C.border}`,
color: isWatched ? C.gold : C.muted}}>
{isWatched?"★ WATCHING":"☆ WATCH"}
</button>
<button onClick={()=>onNote(car)} style={{
flex:1,padding:"11px 0",borderRadius:8,cursor:"pointer",fontSize:12,
fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1.5,
background: note ? "#ffffff10" : "transparent",
border:`1px solid ${note?C.cream+"44":C.border}`,
color: note ? C.cream : C.muted}}>
{note?"✎ EDIT NOTE":"✎ ADD NOTE"}
</button>
</div>

<a href={car.url} target="_blank" rel="noopener noreferrer" style={{
display:"block",textAlign:"center",
background:s==="good"?C.green+"22":C.gold+"22",
border:`1px solid ${s==="good"?C.green:C.gold}`,
color:s==="good"?C.green:C.gold,
padding:"13px 20px",borderRadius:8,textDecoration:"none",
fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,fontSize:13,
opacity: car.url==="#" ? 0.4 : 1,
pointerEvents: car.url==="#" ? "none" : "auto"}}>
VIEW LISTING →
</a>
</div>
</div>
);
};

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TAB_W = ({label,active,badge,onClick}) => (
<button onClick={onClick} style={{
flex:1,padding:"10px 0",background:"transparent",border:"none",
borderBottom:`2px solid ${active?C.gold:"transparent"}`,
color:active?C.gold:C.muted,cursor:"pointer",fontSize:11,
fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1.5,
position:"relative",transition:"color 0.15s"}}>
{label}
{badge>0 && <span style={{
position:"absolute",top:6,right:"18%",background:C.green,color:"#000",
borderRadius:10,fontSize:8,padding:"1px 5px",fontFamily:"Inter,sans-serif",fontWeight:700}}>{badge}</span>}
</button>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function R107Market() {
// Persist state
const [store, setStore] = useState(() => ({
watchlist: new Set(),
notes: {},
settings: { thresh:12, alertMax:25000, sheetUrl:"" },
...(() => {
const s = loadStore();
return { watchlist: new Set(s.watchlist||[]), notes: s.notes||{}, settings: { thresh:12, alertMax:25000, sheetUrl:"", ...(s.settings||{}) } };
})()
}));

const persist = useCallback((next) => {
setStore(next);
saveStore({ watchlist:[...next.watchlist], notes:next.notes, settings:next.settings });
}, []);

const [data, setData] = useState(MOCK);
const [usingMock, setUsingMock] = useState(true);
const [selected, setSelected] = useState(null);
const [tab, setTab] = useState("market"); // market | watchlist | alerts
const [xAxis, setXAxis] = useState("km"); // km | year
const [filter, setFilter] = useState({ engine:"All", source:"All", country:"All" });
const [showSettings, setShowSettings] = useState(false);
const [noteTarget, setNoteTarget] = useState(null);
const [loading, setLoading] = useState(false);
const fileRef = useRef();

// Fonts
useEffect(() => {
const l=document.createElement("link");
l.href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&display=swap";
l.rel="stylesheet"; document.head.appendChild(l);
}, []);

// Auto-load Google Sheets if URL set
useEffect(() => {
const url = store.settings.sheetUrl;
if (!url) return;
setLoading(true);
// Convert Sheets share URL to CSV export URL
const csvUrl = url.includes("/edit")
? url.replace("/edit.*","").replace("/spreadsheets/d/","/spreadsheets/d/")+"?output=csv"
: url;
fetch(csvUrl)
.then(r=>r.text())
.then(t=>{ const p=parseCSV(t); if(p.length>0){setData(p);setUsingMock(false);} })
.catch(()=>{})
.finally(()=>setLoading(false));
}, [store.settings.sheetUrl]);

const { watchlist, notes, settings } = store;

// Derived
const engines = ["All", ...new Set(data.map(d=>d.engine).filter(Boolean))];
const sources = ["All", ...new Set(data.map(d=>d.source).filter(Boolean))];
const countries = ["All", ...new Set(data.map(d=>d.country).filter(Boolean))];

const filtered = data.filter(d =>
(filter.engine==="All"||d.engine===filter.engine) &&
(filter.source==="All"||d.source===filter.source) &&
(filter.country==="All"||d.country===filter.country)
);

const chartData = filtered.map(d=>({ ...d, x: xAxis==="km"?d.km:d.year, y: d.price }));
const reg = linReg(chartData.map(d=>({x:d.x,y:d.y})));
const xs = chartData.map(d=>d.x);
const regLine = reg&&xs.length>1
? [{x:Math.min(...xs),y:Math.round(reg.predict(Math.min(...xs)))},{x:Math.max(...xs),y:Math.round(reg.predict(Math.max(...xs)))}]
: [];

const goodDeals = filtered.filter(d=>status(xAxis==="km"?d.km:d.year,d.price,reg,settings.thresh)==="good").length;
const alerts = filtered.filter(d=>d.price<=settings.alertMax);
const watched = data.filter(d=>watchlist.has(d.id));
const avgPrice = filtered.length ? Math.round(filtered.reduce((s,d)=>s+d.price,0)/filtered.length) : 0;

// Actions
const toggleWatch = id => {
const w = new Set(watchlist);
w.has(id) ? w.delete(id) : w.add(id);
persist({...store,watchlist:w});
};
const saveNote = (id, text) => {
const n = {...notes}; if(text.trim()) n[id]=text.trim(); else delete n[id];
persist({...store,notes:n}); setNoteTarget(null);
};
const saveSettings = s => { persist({...store,settings:s}); setShowSettings(false); };

const handleFile = e => {
const f=e.target.files?.[0]; if(!f) return;
const r=new FileReader();
r.onload=ev=>{try{const p=parseCSV(ev.target.result);if(p.length>0){setData(p);setUsingMock(false);setSelected(null);}}catch{alert("CSV error — check format.");}};
r.readAsText(f);
};

// List to show per tab
const tabList = tab==="watchlist" ? watched
: tab==="alerts" ? alerts
: filtered.sort((a,b)=>{
const order={good:0,fair:1,over:2};
return order[status(xAxis==="km"?a.km:a.year,a.price,reg,settings.thresh)]
- order[status(xAxis==="km"?b.km:b.year,b.price,reg,settings.thresh)];
});

const sel = { bg:C.bg, ff:"Inter,sans-serif" };

return (
<div style={{minHeight:"100vh",background:C.bg,color:C.cream,fontFamily:"Inter,sans-serif",userSelect:"none"}}>

{/* Header */}
<div style={{borderBottom:`1px solid ${C.border}`,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:C.bg,zIndex:50}}>
<div>
<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:21,letterSpacing:3,color:C.cream}}>
R107 <span style={{color:C.gold}}>MARKET</span>
</div>
<div style={{fontSize:9,color:C.dim,letterSpacing:1.5,marginTop:0}}>MERCEDES-BENZ SL · SLC · 1971–1989</div>
</div>
<div style={{display:"flex",gap:8,alignItems:"center"}}>
{usingMock && <span style={{fontSize:9,color:C.gold,background:C.gold+"18",border:`1px solid ${C.gold}44`,padding:"2px 8px",borderRadius:10,letterSpacing:1}}>DEMO</span>}
{loading && <span style={{fontSize:9,color:C.muted}}>↻</span>}
<button style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,width:30,height:30,borderRadius:8,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}
onClick={()=>fileRef.current?.click()}>↑</button>
<button style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,width:30,height:30,borderRadius:8,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}
onClick={()=>setShowSettings(true)}>⚙</button>
<input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleFile}/>
</div>
</div>

{/* Stats row */}
<div style={{display:"flex",borderBottom:`1px solid ${C.border}`}}>
{[
{label:"LISTINGS", val:filtered.length, color:C.cream},
{label:"GOOD DEALS",val:goodDeals, color:C.green},
{label:"AVG PRICE", val:`£${(avgPrice/1000).toFixed(0)}k`, color:C.gold},
{label:"ALERTS", val:alerts.length, color:alerts.length?C.red:C.dim},
].map((s,i)=>(
<div key={s.label} style={{flex:1,padding:"12px 14px",borderRight:i<3?`1px solid ${C.border}`:"none"}}>
<div style={{fontSize:8,letterSpacing:2,color:C.dim,marginBottom:3}}>{s.label}</div>
<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:s.color,letterSpacing:0.5}}>{s.val}</div>
</div>
))}
</div>

{/* Tabs */}
<div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.surface}}>
<TAB_W label="MARKET" active={tab==="market"} onClick={()=>setTab("market")}/>
<TAB_W label="WATCHLIST" active={tab==="watchlist"} badge={watchlist.size} onClick={()=>setTab("watchlist")}/>
<TAB_W label="ALERTS" active={tab==="alerts"} badge={alerts.length} onClick={()=>setTab("alerts")}/>
</div>

{/* Chart — only on Market tab */}
{tab==="market" && (
<>
{/* Filters */}
<div style={{display:"flex",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.border}`,overflowX:"auto"}}>
<button onClick={()=>setXAxis(xAxis==="km"?"year":"km")}
style={{background:"transparent",border:`1px solid ${xAxis==="km"?C.gold+"66":C.border}`,
color:xAxis==="km"?C.gold:C.muted,padding:"5px 12px",borderRadius:6,
cursor:"pointer",fontSize:10,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1.5,flexShrink:0}}>
{xAxis==="km"?"⟷ KM":"⟷ YEAR"}
</button>
{[["engine",engines],["source",sources],["country",countries]].map(([key,opts])=>(
<select key={key} value={filter[key]} onChange={e=>setFilter(f=>({...f,[key]:e.target.value}))}
style={{background:C.card,border:`1px solid ${C.border}`,color:C.cream,
padding:"5px 8px",borderRadius:6,fontSize:11,cursor:"pointer",flexShrink:0,outline:"none"}}>
{opts.map(o=><option key={o}>{o}</option>)}
</select>
))}
</div>

{/* Scatter chart */}
<div style={{padding:"16px 8px 4px"}}>
<ResponsiveContainer width="100%" height={240}>
<ComposedChart margin={{top:8,right:14,bottom:8,left:0}}>
<CartesianGrid stroke={C.border} strokeDasharray="3 3"/>
<XAxis dataKey="x" type="number" domain={["auto","auto"]}
tick={{fill:C.dim,fontSize:10}} stroke={C.border}
tickFormatter={v=>xAxis==="km"?(v/1000).toFixed(0)+"k":v}/>
<YAxis dataKey="y" type="number" domain={["auto","auto"]}
tick={{fill:C.dim,fontSize:10}} stroke={C.border} width={36}
tickFormatter={v=>"£"+(v/1000).toFixed(0)+"k"}/>
<Tooltip content={<ChartTip/>}/>
{regLine.length===2 && (
<Line data={regLine} dataKey="y" dot={false}
stroke={C.gold} strokeWidth={1.5} strokeDasharray="6 3" type="linear" connectNulls/>
)}
<Scatter data={chartData} shape={props=>(
<Dot {...props} onSelect={setSelected} selectedId={selected?.id}
reg={reg} thresh={settings.thresh} watchlist={watchlist}/>
)}/>
</ComposedChart>
</ResponsiveContainer>
</div>

{/* Legend */}
<div style={{display:"flex",gap:14,padding:"2px 16px 12px",flexWrap:"wrap"}}>
{[[C.green,"Good deal"],[C.gold,"Market price"],[C.red,"Overpriced"]].map(([c,l])=>(
<div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.muted}}>
<div style={{width:7,height:7,borderRadius:"50%",background:c}}/>{l}
</div>
))}
<div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.muted}}>
<div style={{width:14,height:0,borderBottom:`1.5px dashed ${C.gold}`}}/>Regression
</div>
</div>
</>
)}

{/* Empty states */}
{tab==="watchlist" && watchlist.size===0 && (
<div style={{padding:40,textAlign:"center",color:C.dim}}>
<div style={{fontSize:28,marginBottom:8}}>☆</div>
<div style={{fontSize:12,letterSpacing:1}}>No listings on your watchlist yet.</div>
<div style={{fontSize:11,marginTop:6,color:C.dim}}>Open a listing and tap Watch.</div>
</div>
)}
{tab==="alerts" && alerts.length===0 && (
<div style={{padding:40,textAlign:"center",color:C.dim}}>
<div style={{fontSize:28,marginBottom:8}}>✓</div>
<div style={{fontSize:12,letterSpacing:1}}>No listings under £{fmt(settings.alertMax)}.</div>
<div style={{fontSize:11,marginTop:6,color:C.dim}}>Adjust your alert threshold in Settings.</div>
</div>
)}

{/* List */}
<div style={{borderTop:`1px solid ${C.border}`}}>
{tabList.map(car=>{
const s=status(xAxis==="km"?car.km:car.year,car.price,reg,settings.thresh);
const pred=reg?Math.round(reg.predict(xAxis==="km"?car.km:car.year)):null;
const diff=pred?Math.round(((car.price-pred)/pred)*100):null;
const sColor=s==="good"?C.green:s==="over"?C.red:C.gold;
const isWatched=watchlist.has(car.id);
const hasNote=!!notes[car.id];
return (
<div key={car.id} onClick={()=>setSelected(car)}
style={{display:"flex",alignItems:"center",justifyContent:"space-between",
padding:"12px 18px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",
background:s==="good"?C.green+"05":"transparent",
transition:"background 0.15s"}}>
<div style={{flex:1,minWidth:0}}>
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
{isWatched&&<span style={{fontSize:9,color:C.gold}}>★</span>}
{hasNote&&<span style={{fontSize:9,color:C.muted}}>✎</span>}
<div style={{fontSize:13,color:C.cream,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{car.title}</div>
</div>
<div style={{fontSize:11,color:C.muted}}>{fmt(car.km)} km · {car.year} · {car.source} · {car.country}</div>
</div>
<div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
<div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,color:sColor,letterSpacing:0.5}}>
£{fmt(car.price)}
</div>
{diff!==null&&<div style={{fontSize:10,color:sColor,marginTop:1}}>{diff>0?`+${diff}%`:`${diff}%`}</div>}
</div>
</div>
);
})}
</div>

{/* Detail panel */}
{selected && (
<Detail car={selected} reg={reg} thresh={settings.thresh}
watchlist={watchlist} notes={notes}
onWatch={toggleWatch}
onNote={car=>setNoteTarget(car)}
onClose={()=>setSelected(null)}/>
)}

{/* Notes modal */}
{noteTarget && (
<NotesModal car={noteTarget} initial={notes[noteTarget.id]}
onSave={text=>saveNote(noteTarget.id,text)}
onClose={()=>setNoteTarget(null)}/>
)}

{/* Settings modal */}
{showSettings && (
<SettingsModal settings={settings} onSave={saveSettings} onClose={()=>setShowSettings(false)}/>
)}
</div>
);
}

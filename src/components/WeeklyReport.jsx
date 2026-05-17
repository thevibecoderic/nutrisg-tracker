import { startOfWeek, weekDays, addDays, totals, todayStr } from "../lib/helpers";

export default function WeeklyReport({ logs }) {
  const today = todayStr();
  const ws    = startOfWeek(today);
  const days  = weekDays(ws);

  const dayData = days.map(d=>({
    d,
    label: new Date(d+"T00:00:00").toLocaleDateString("en-SG",{weekday:"short"}),
    ...totals(logs[d]||[]),
    logged: (logs[d]||[]).length > 0,
  }));

  const logged  = dayData.filter(d=>d.logged);
  const avgCal  = logged.length ? Math.round(logged.reduce((a,d)=>a+d.cal,0)/logged.length) : 0;
  const avgPro  = logged.length ? Math.round(logged.reduce((a,d)=>a+d.pro,0)/logged.length) : 0;
  const bestDay = logged.reduce((a,d)=>d.cal>a.cal?d:a, {cal:0,d:"",label:""});
  const consistency = Math.round((logged.length/7)*100);

  // most eaten food this week
  const foodCount = {};
  days.forEach(d=>(logs[d]||[]).forEach(e=>{foodCount[e.name]=(foodCount[e.name]||0)+1;}));
  const topFood = Object.entries(foodCount).sort((a,b)=>b[1]-a[1])[0];

  const grade = consistency>=85?"A":consistency>=70?"B":consistency>=50?"C":"D";
  const gradeColor = grade==="A"?"#34c759":grade==="B"?"#007aff":grade==="C"?"#e09c28":"#e05252";

  return (
    <div style={{background:"var(--surface)",borderRadius:16,padding:16,marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <p style={{margin:0,fontWeight:700,fontSize:14}}>This week's report</p>
        <div style={{width:44,height:44,borderRadius:"50%",background:gradeColor+"22",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:20,fontWeight:900,color:gradeColor}}>{grade}</span>
        </div>
      </div>

      {/* Day streak dots */}
      <div style={{display:"flex",gap:6,marginBottom:14,justifyContent:"space-between"}}>
        {dayData.map(d=>(
          <div key={d.d} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{
              width:32,height:32,borderRadius:"50%",
              background:d.logged?"var(--accent)22":"var(--border)",
              border:`2px solid ${d.logged?"var(--accent)":"transparent"}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14
            }}>
              {d.logged?"✓":""}
            </div>
            <span style={{fontSize:9,color:"var(--muted)"}}>{d.label}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[
          {label:"Days logged",   value:`${logged.length} / 7`,    color:"var(--accent)"},
          {label:"Consistency",   value:`${consistency}%`,          color:"var(--accent)"},
          {label:"Avg calories",  value:avgCal?`${avgCal} kcal`:"—", color:"#e09c28"},
          {label:"Avg protein",   value:avgPro?`${avgPro}g`:"—",     color:"#e05252"},
          {label:"Best day",      value:bestDay.label||"—",          color:"#5ca3e0"},
          {label:"Top food",      value:topFood?topFood[0].split(" ").slice(0,2).join(" "):"—", color:"var(--muted)"},
        ].map(s=>(
          <div key={s.label} style={{background:"var(--bg)",borderRadius:10,padding:"10px 12px"}}>
            <p style={{margin:0,fontWeight:800,fontSize:15,color:s.color}}>{s.value}</p>
            <p style={{margin:0,fontSize:10,color:"var(--muted)",marginTop:1}}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

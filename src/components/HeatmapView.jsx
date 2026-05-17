import { addDays, todayStr, totals } from "../lib/helpers";

const GOAL_KEY = "nutrisg_goal_v1";

export default function HeatmapView({ logs }) {
  const today = todayStr();
  const goal  = Number(localStorage.getItem(GOAL_KEY)) || 2000;

  // build 16 weeks × 7 days = 112 days back
  const startDay = addDays(today, -111);
  const days = Array.from({length:112},(_,i)=>addDays(startDay,i));

  // pad to start on Sunday
  const firstDow = new Date(startDay+"T00:00:00").getDay();
  const padded   = [...Array(firstDow).fill(null), ...days];

  const weeks = [];
  for (let i=0; i<padded.length; i+=7) weeks.push(padded.slice(i,i+7));

  const getColor = (d) => {
    if (!d) return "transparent";
    const entries = logs[d]||[];
    if (entries.length===0) return "var(--border)";
    const cal = totals(entries).cal;
    const ratio = cal/goal;
    if (ratio < 0.5) return "#34c75944";
    if (ratio < 0.8) return "#34c75988";
    if (ratio < 1.0) return "#34c759bb";
    if (ratio < 1.2) return "#34c759";
    return "#e05252";
  };

  const months = [];
  let lastMonth = "";
  weeks.forEach((week,wi)=>{
    const firstReal = week.find(d=>d);
    if (firstReal) {
      const m = firstReal.slice(0,7);
      if (m!==lastMonth) { months.push({wi,label:new Date(firstReal+"T00:00:00").toLocaleDateString("en-SG",{month:"short"})}); lastMonth=m; }
    }
  });

  return (
    <div style={{background:"var(--surface)",borderRadius:16,padding:16,marginBottom:16}}>
      <p style={{margin:"0 0 12px",fontWeight:700,fontSize:14}}>Calorie heatmap (16 weeks)</p>

      {/* Month labels */}
      <div style={{display:"flex",marginBottom:4,paddingLeft:18}}>
        {weeks.map((_,wi)=>{
          const m = months.find(x=>x.wi===wi);
          return <div key={wi} style={{width:14,flexShrink:0,fontSize:9,color:"var(--muted)"}}>{m?m.label:""}</div>;
        })}
      </div>

      <div style={{display:"flex",gap:2}}>
        {/* Day labels */}
        <div style={{display:"flex",flexDirection:"column",gap:2,marginRight:2}}>
          {["S","M","T","W","T","F","S"].map((d,i)=>(
            <div key={i} style={{height:12,fontSize:8,color:"var(--muted)",lineHeight:"12px"}}>{i%2===1?d:""}</div>
          ))}
        </div>
        {/* Grid */}
        {weeks.map((week,wi)=>(
          <div key={wi} style={{display:"flex",flexDirection:"column",gap:2}}>
            {week.map((d,di)=>(
              <div key={di} title={d?`${d}: ${totals(logs[d]||[]).cal} kcal`:""} style={{
                width:12,height:12,borderRadius:2,
                background:getColor(d),
                cursor:d?"pointer":"default"
              }}/>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8,justifyContent:"flex-end"}}>
        <span style={{fontSize:9,color:"var(--muted)"}}>Less</span>
        {["var(--border)","#34c75944","#34c75988","#34c759bb","#34c759","#e05252"].map((c,i)=>(
          <div key={i} style={{width:10,height:10,borderRadius:2,background:c}}/>
        ))}
        <span style={{fontSize:9,color:"var(--muted)"}}>Over</span>
      </div>
    </div>
  );
}

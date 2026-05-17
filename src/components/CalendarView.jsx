import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { todayStr, fmtMonth, monthDays, totals } from "../lib/helpers";

export default function CalendarView({ logs, onSelectDay }) {
  const today = todayStr();
  const [ym, setYm] = useState(today.slice(0,7));
  const days     = monthDays(ym);
  const firstDow = new Date(ym+"-01T00:00:00").getDay();

  const prev = () => { const [y,m]=ym.split("-").map(Number); setYm(m===1?`${y-1}-12`:`${y}-${String(m-1).padStart(2,"0")}`); };
  const next = () => { const [y,m]=ym.split("-").map(Number); setYm(m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,"0")}`); };

  return (
    <div style={{ padding:"0 16px 80px" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 4px" }}>
        <button onClick={prev} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text)" }}><ChevronLeft size={20}/></button>
        <span style={{ fontWeight:800,fontSize:18 }}>{fmtMonth(ym+"-01")}</span>
        <button onClick={next} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text)" }}><ChevronRight size={20}/></button>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",textAlign:"center",marginBottom:4 }}>
        {["S","M","T","W","T","F","S"].map((d,i)=><span key={i} style={{ fontSize:11,color:"var(--muted)",fontWeight:600 }}>{d}</span>)}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4 }}>
        {Array.from({length:firstDow},(_,i)=><div key={"e"+i}/>)}
        {days.map(d=>{
          const cal    = totals(logs[d]||[]).cal;
          const isToday= d===today;
          const hasLog = (logs[d]||[]).length>0;
          return (
            <button key={d} onClick={()=>onSelectDay(d)} style={{
              aspectRatio:"1",borderRadius:12,
              border:isToday?"2px solid var(--accent)":"1.5px solid transparent",
              background:hasLog?"var(--accent)22":"var(--surface)",
              cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1
            }}>
              <span style={{ fontSize:13,fontWeight:isToday?800:500,color:isToday?"var(--accent)":"var(--text)" }}>{Number(d.slice(8))}</span>
              {hasLog && <span style={{ fontSize:9,color:"var(--accent)",fontWeight:700 }}>{Math.round(cal)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

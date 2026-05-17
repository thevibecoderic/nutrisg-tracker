import { useState } from "react";
import { Droplets, Plus, Minus } from "lucide-react";
import { haptic, todayStr, WATER_KEY } from "../lib/helpers";

const loadWater = () => {
  try { return JSON.parse(localStorage.getItem(WATER_KEY)) || {}; } catch { return {}; }
};

export default function WaterTracker({ date }) {
  const [water, setWater] = useState(loadWater);
  const glasses = water[date] || 0;
  const goal = 8;

  const update = (n) => {
    const next = { ...water, [date]: Math.max(0, Math.min(12, glasses + n)) };
    setWater(next);
    localStorage.setItem(WATER_KEY, JSON.stringify(next));
    haptic("light");
  };

  const pct = Math.min(100, Math.round((glasses / goal) * 100));

  return (
    <div style={{margin:"0 16px 14px",background:"var(--surface)",borderRadius:14,padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <Droplets size={14} color="#5ca3e0"/>
          <span style={{fontSize:13,fontWeight:700,color:"#5ca3e0"}}>Water</span>
        </div>
        <span style={{fontSize:12,color:"var(--muted)"}}>{glasses} / {goal} glasses</span>
      </div>

      {/* Glass icons */}
      <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
        {Array.from({length:goal},(_,i)=>(
          <div key={i} onClick={()=>update(i<glasses?-(glasses-i):i+1-glasses)} style={{
            width:28,height:34,borderRadius:4,cursor:"pointer",
            background: i<glasses ? "#5ca3e044" : "var(--border)",
            border: `1.5px solid ${i<glasses?"#5ca3e0":"transparent"}`,
            display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:2,
            transition:"all 0.2s",fontSize:14
          }}>
            {i<glasses?"💧":""}
          </div>
        ))}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>update(-1)} style={{width:32,height:32,borderRadius:8,border:"1px solid var(--border)",background:"var(--bg)",cursor:"pointer",color:"var(--text)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Minus size={14}/>
        </button>
        <div style={{flex:1,height:6,borderRadius:3,background:"var(--border)",overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:3,background:"#5ca3e0",width:`${pct}%`,transition:"width 0.3s"}}/>
        </div>
        <button onClick={()=>update(1)} style={{width:32,height:32,borderRadius:8,border:"none",background:"#5ca3e0",cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Plus size={14}/>
        </button>
      </div>
    </div>
  );
}

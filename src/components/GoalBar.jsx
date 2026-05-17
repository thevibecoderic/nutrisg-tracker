import { useState } from "react";
import { Target, X, Check } from "lucide-react";
import { GOAL_KEY, haptic } from "../lib/helpers";

export default function GoalBar({ cal }) {
  const [goal, setGoal]     = useState(() => Number(localStorage.getItem(GOAL_KEY)) || 2000);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]   = useState(String(goal));

  const pct     = Math.min(100, Math.round((cal / goal) * 100));
  const over    = cal > goal;
  const color   = over ? "#e05252" : pct > 85 ? "#e09c28" : "var(--accent)";
  const remain  = goal - cal;

  const save = () => {
    const n = Number(draft);
    if (n > 0) { setGoal(n); localStorage.setItem(GOAL_KEY, String(n)); haptic(); }
    setEditing(false);
  };

  return (
    <div style={{margin:"0 16px 14px",background:"var(--surface)",borderRadius:14,padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <Target size={14} color={color}/>
          <span style={{fontSize:13,fontWeight:700,color}}>
            {over ? `${Math.round(cal-goal)} kcal over goal` : `${Math.round(remain)} kcal remaining`}
          </span>
        </div>
        {editing ? (
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <input
              value={draft}
              onChange={e=>setDraft(e.target.value)}
              type="number"
              style={{width:70,padding:"3px 8px",borderRadius:8,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",fontSize:13,outline:"none"}}
            />
            <button onClick={save} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)"}}><Check size={14}/></button>
            <button onClick={()=>setEditing(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)"}}><X size={14}/></button>
          </div>
        ) : (
          <button onClick={()=>{setDraft(String(goal));setEditing(true);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"var(--muted)"}}>
            Goal: {goal} kcal
          </button>
        )}
      </div>
      <div style={{height:8,borderRadius:4,background:"var(--border)",overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:4,background:color,width:`${pct}%`,transition:"width 0.4s ease"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <span style={{fontSize:10,color:"var(--muted)"}}>{cal} eaten</span>
        <span style={{fontSize:10,color:"var(--muted)"}}>{pct}%</span>
        <span style={{fontSize:10,color:"var(--muted)"}}>{goal} goal</span>
      </div>
    </div>
  );
}

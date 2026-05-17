import { useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { todayStr, fmtMonth, startOfWeek, weekDays, monthDays, addDays, totals } from "../lib/helpers";
import MacroPieChart from "./MacroPieChart";
import HeatmapView from "./HeatmapView";
import WeeklyReport from "./WeeklyReport";

function exportCSV(logs) {
  const rows = [["Date","Meal","Food","Calories","Protein(g)","Carbs(g)","Fat(g)","Serving"]];
  Object.entries(logs).sort().forEach(([date, entries]) => {
    entries.forEach(e => {
      rows.push([date, e.meal||"", e.name, e.cal||0, e.pro||0, e.carb||0, e.fat||0, e.serving||""]);
    });
  });
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "nutrisg_export.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function TrendsView({ logs }) {
  const today = todayStr();
  const [view, setView]           = useState("week");
  const [weekStart, setWeekStart] = useState(startOfWeek(today));
  const [ym, setYm]               = useState(today.slice(0,7));

  const prevWeek  = () => setWeekStart(w=>addDays(w,-7));
  const nextWeek  = () => { const n=addDays(weekStart,7); if(n<=today)setWeekStart(n); };
  const prevMonth = () => { const [y,m]=ym.split("-").map(Number); setYm(m===1?`${y-1}-12`:`${y}-${String(m-1).padStart(2,"0")}`); };
  const nextMonth = () => { const [y,m]=ym.split("-").map(Number); const n=m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,"0")}`; if(n<=today.slice(0,7))setYm(n); };

  const days = view==="week" ? weekDays(weekStart) : monthDays(ym);

  const chartData = days.map(d=>{
    const t = totals(logs[d]||[]);
    const label = view==="week"
      ? new Date(d+"T00:00:00").toLocaleDateString("en-SG",{weekday:"short"})
      : String(Number(d.slice(8)));
    return {day:label,date:d,cal:Math.round(t.cal),pro:Math.round(t.pro),carb:Math.round(t.carb),fat:Math.round(t.fat)};
  });

  const filled  = chartData.filter(d=>d.cal>0);
  const avgCal  = filled.length ? Math.round(filled.reduce((a,d)=>a+d.cal,0)/filled.length) : 0;
  const maxCal  = filled.length ? Math.max(...filled.map(d=>d.cal)) : 0;
  const streak  = (()=>{ let s=0,d=today; while((logs[d]||[]).length>0){s++;d=addDays(d,-1);} return s; })();

  const weekLabel = (()=>{
    const end=addDays(weekStart,6);
    const s=new Date(weekStart+"T00:00:00").toLocaleDateString("en-SG",{day:"numeric",month:"short"});
    const e=new Date(end+"T00:00:00").toLocaleDateString("en-SG",{day:"numeric",month:"short"});
    return `${s} – ${e}`;
  })();

  // totals for pie chart (current view)
  const viewTotals = filled.reduce((a,d)=>({cal:a.cal+d.cal,pro:a.pro+d.pro,carb:a.carb+d.carb,fat:a.fat+d.fat}),{cal:0,pro:0,carb:0,fat:0});

  return (
    <div style={{ padding:"16px 16px 80px" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
        <p style={{ margin:0,fontSize:20,fontWeight:800 }}>Trends</p>
        <button onClick={()=>exportCSV(logs)} style={{ display:"flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:20,padding:"5px 12px",cursor:"pointer",color:"var(--text)",fontSize:12,fontWeight:600 }}>
          <Download size={13}/>Export CSV
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16 }}>
        {[
          {label:"Avg calories",  value:avgCal?`${avgCal} kcal`:"—", color:"var(--accent)"},
          {label:"Best day",      value:maxCal?`${maxCal} kcal`:"—", color:"#e09c28"},
          {label:"Streak",        value:`${streak} days`,             color:"#5ca3e0"},
        ].map(s=>(
          <div key={s.label} style={{ background:"var(--surface)",borderRadius:14,padding:12,textAlign:"center" }}>
            <p style={{ margin:0,fontWeight:800,fontSize:15,color:s.color }}>{s.value}</p>
            <p style={{ margin:0,fontSize:10,color:"var(--muted)",marginTop:2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly report */}
      <WeeklyReport logs={logs}/>

      {/* View toggle */}
      <div style={{ display:"flex",gap:8,marginBottom:12 }}>
        {[["week","Weekly"],["month","Monthly"]].map(([v,label])=>(
          <button key={v} onClick={()=>setView(v)} style={{
            flex:1,padding:"7px",borderRadius:9,border:"1.5px solid",
            borderColor:view===v?"var(--accent)":"var(--border)",
            background:view===v?"var(--accent)":"none",
            color:view===v?"#fff":"var(--text)",cursor:"pointer",fontWeight:600,fontSize:13
          }}>{label}</button>
        ))}
      </div>

      {/* Nav */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,background:"var(--surface)",borderRadius:12,padding:"8px 14px" }}>
        <button onClick={view==="week"?prevWeek:prevMonth} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text)" }}><ChevronLeft size={18}/></button>
        <span style={{ fontWeight:700,fontSize:13 }}>{view==="week"?weekLabel:fmtMonth(ym+"-01")}</span>
        <button onClick={view==="week"?nextWeek:nextMonth} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text)" }}><ChevronRight size={18}/></button>
      </div>

      {/* Calorie chart */}
      <div style={{ background:"var(--surface)",borderRadius:16,padding:16,marginBottom:16 }}>
        <p style={{ margin:"0 0 12px",fontWeight:700,fontSize:14 }}>Calories per day</p>
        {filled.length===0
          ? <p style={{ color:"var(--muted)",fontSize:13,textAlign:"center",padding:"20px 0" }}>No data for this period</p>
          : <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{top:0,right:0,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="day" tick={{fontSize:10,fill:"var(--muted)"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"var(--muted)"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12}} formatter={v=>[v+" kcal","Calories"]}/>
                <Bar dataKey="cal" fill="var(--accent)" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
        }
      </div>

      {/* Macro chart */}
      <div style={{ background:"var(--surface)",borderRadius:16,padding:16,marginBottom:16 }}>
        <p style={{ margin:"0 0 12px",fontWeight:700,fontSize:14 }}>Macros (g)</p>
        {filled.length===0
          ? <p style={{ color:"var(--muted)",fontSize:13,textAlign:"center",padding:"20px 0" }}>No data for this period</p>
          : <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{top:0,right:0,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="day" tick={{fontSize:10,fill:"var(--muted)"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"var(--muted)"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12}}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Line type="monotone" dataKey="pro"  stroke="#e05252" strokeWidth={2} dot={false} name="Protein"/>
                <Line type="monotone" dataKey="carb" stroke="#e09c28" strokeWidth={2} dot={false} name="Carbs"/>
                <Line type="monotone" dataKey="fat"  stroke="#5ca3e0" strokeWidth={2} dot={false} name="Fat"/>
              </LineChart>
            </ResponsiveContainer>
        }
      </div>

      {/* Macro pie */}
      {filled.length>0 && <MacroPieChart pro={viewTotals.pro} carb={viewTotals.carb} fat={viewTotals.fat}/>}

      {/* Heatmap */}
      <HeatmapView logs={logs}/>
    </div>
  );
}

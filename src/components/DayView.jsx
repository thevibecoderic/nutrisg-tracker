import { useState, useRef } from "react";
import { Plus, Trash2, Camera, Edit2, Share2 } from "lucide-react";
import { totals, MEAL_TYPES, todayStr, fmtDate, haptic } from "../lib/helpers";
import GoalBar from "./GoalBar";
import WaterTracker from "./WaterTracker";
import FoodSearchModal from "./FoodSearchModal";
import EditFoodModal from "./EditFoodModal";

function MacroBadge({ icon, label, value, unit, color }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 12px",borderRadius:10,background:color+"22" }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <span style={{ fontSize:15,fontWeight:700,color }}>{Math.round(value)}</span>
      <span style={{ fontSize:10,color:"#888" }}>{unit} {label}</span>
    </div>
  );
}

export default function DayView({ date, logs, onAdd, onRemove, onEdit, onDateChange, favs, onToggleFav, customFoods, recentFoods }) {
  const entries = logs[date] || [];
  const day     = totals(entries);
  const isToday = date === todayStr();

  const [showSearch, setShowSearch]   = useState(false);
  const [editEntry, setEditEntry]     = useState(null);
  const [photoMap, setPhotoMap]       = useState({});
  const fileRef = useRef();
  const [photoTarget, setPhotoTarget] = useState(null);

  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file || !photoTarget) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoMap(m=>({...m,[photoTarget]:ev.target.result}));
    reader.readAsDataURL(file);
  };

  const shareDay = async () => {
    const text = [
      `🔥 NutriSG — ${fmtDate(date)}`,
      `📊 Total: ${Math.round(day.cal)} kcal`,
      `🥩 Protein: ${Math.round(day.pro)}g  🌾 Carbs: ${Math.round(day.carb)}g  💧 Fat: ${Math.round(day.fat)}g`,
      "",
      ...MEAL_TYPES.flatMap(m=>{
        const items = entries.filter(e=>e.meal===m);
        if (!items.length) return [];
        return [`${m}:`, ...items.map(e=>`  • ${e.name} — ${e.cal} kcal`)];
      }),
      "",
      "Tracked with NutriSG 🇸🇬"
    ].join("\n");

    if (navigator.share) {
      await navigator.share({ title:"My food log", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
    haptic();
  };

  const byMeal = MEAL_TYPES.map(m=>({meal:m,items:entries.filter(e=>e.meal===m)}));

  return (
    <div style={{ padding:"0 0 80px" }}>
      {/* Header */}
      <div style={{ padding:"16px 20px 8px" }}>
        <p style={{ margin:0,fontSize:13,color:"var(--muted)" }}>{isToday?"Daily summary":"Summary for"}</p>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <p style={{ margin:0,fontSize:20,fontWeight:800 }}>{fmtDate(date)}</p>
            <input type="date" value={date} max={todayStr()} onChange={e=>{if(e.target.value)onDateChange(e.target.value);}}
              style={{ border:"1px solid var(--border)",borderRadius:8,padding:"4px 8px",fontSize:13,background:"var(--surface)",color:"var(--text)",cursor:"pointer",WebkitAppearance:"none" }}/>
          </div>
          <button onClick={shareDay} style={{ display:"flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:20,padding:"5px 12px",cursor:"pointer",color:"var(--text)",fontSize:12,fontWeight:600 }}>
            <Share2 size={12}/>Share
          </button>
        </div>
      </div>

      {/* Calorie summary */}
      <div style={{ margin:"0 16px 12px",background:"var(--surface)",borderRadius:16,padding:16 }}>
        <div style={{ display:"flex",justifyContent:"center",marginBottom:10 }}>
          <div style={{ textAlign:"center" }}>
            <p style={{ margin:0,fontSize:38,fontWeight:900,color:"var(--accent)",lineHeight:1 }}>{Math.round(day.cal)}</p>
            <p style={{ margin:0,fontSize:12,color:"var(--muted)" }}>{isToday?"kcal today":"kcal this day"}</p>
          </div>
        </div>
        <div style={{ display:"flex",justifyContent:"space-around" }}>
          <MacroBadge icon="🥩" label="protein" value={day.pro}  unit="g" color="#e05252"/>
          <MacroBadge icon="🌾" label="carbs"   value={day.carb} unit="g" color="#e09c28"/>
          <MacroBadge icon="💧" label="fat"     value={day.fat}  unit="g" color="#5ca3e0"/>
        </div>
      </div>

      {/* Goal bar */}
      <GoalBar cal={Math.round(day.cal)}/>

      {/* Water tracker */}
      <WaterTracker date={date}/>

      {/* Meal sections */}
      {byMeal.map(({meal,items})=>(
        <div key={meal} style={{ margin:"0 16px 12px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
            <span style={{ fontWeight:700,fontSize:14 }}>{meal}</span>
            {items.length>0 && <span style={{ fontSize:12,color:"var(--muted)" }}>{Math.round(totals(items).cal)} kcal</span>}
          </div>
          {items.length===0 && <p style={{ fontSize:13,color:"var(--muted)",margin:"4px 0" }}>Nothing logged yet</p>}
          {items.map(e=>(
            <div key={e.id} style={{ display:"flex",alignItems:"center",gap:10,background:"var(--surface)",borderRadius:12,padding:"10px 12px",marginBottom:6 }}>
              {photoMap[e.id]
                ? <img src={photoMap[e.id]} alt="" style={{ width:40,height:40,borderRadius:8,objectFit:"cover" }}/>
                : (
                  <button onClick={()=>{setPhotoTarget(e.id);fileRef.current.click();}}
                    style={{ width:40,height:40,borderRadius:8,border:"1.5px dashed var(--border)",background:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)" }}>
                    <Camera size={14}/>
                  </button>
                )
              }
              <div style={{ flex:1,minWidth:0 }}>
                <p style={{ margin:0,fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{e.name}</p>
                <p style={{ margin:0,fontSize:11,color:"var(--muted)" }}>{e.serving} · P:{e.pro}g C:{e.carb}g F:{e.fat}g</p>
              </div>
              <span style={{ fontWeight:700,color:"var(--accent)",fontSize:13 }}>{e.cal}</span>
              <button onClick={()=>setEditEntry(e)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted)",padding:4 }}><Edit2 size={13}/></button>
              <button onClick={()=>{onRemove(date,e.id);haptic();}} style={{ background:"none",border:"none",cursor:"pointer",color:"#e05252",padding:4 }}><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      ))}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handlePhoto}/>

      <button onClick={()=>setShowSearch(true)} style={{
        position:"fixed",bottom:84,right:20,width:56,height:56,borderRadius:"50%",
        background:"var(--accent)",border:"none",cursor:"pointer",color:"#fff",
        boxShadow:"0 4px 20px rgba(0,0,0,0.25)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50
      }}>
        <Plus size={24}/>
      </button>

      {showSearch && (
        <FoodSearchModal
          onAdd={onAdd}
          onClose={()=>setShowSearch(false)}
          initialDate={date}
          favs={favs}
          onToggleFav={onToggleFav}
          customFoods={customFoods}
          recentFoods={recentFoods}
        />
      )}

      {editEntry && (
        <EditFoodModal
          entry={editEntry}
          onSave={updated=>onEdit(date,updated)}
          onClose={()=>setEditEntry(null)}
        />
      )}
    </div>
  );
}

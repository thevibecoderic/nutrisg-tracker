import { useState } from "react";
import { X, Check } from "lucide-react";
import { MEAL_TYPES, haptic } from "../lib/helpers";

export default function CustomFoodModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name:"", cal:"", pro:"", carb:"", fat:"", serving:"1 serving" });
  const [meal, setMeal] = useState("Lunch");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const valid = form.name.trim() && form.cal;

  const confirm = () => {
    onAdd({
      id: Date.now(),
      name: form.name.trim(),
      cal:  Math.round(Number(form.cal)||0),
      pro:  Math.round(Number(form.pro)||0),
      carb: Math.round(Number(form.carb)||0),
      fat:  Math.round(Number(form.fat)||0),
      serving: "1× "+form.serving,
      meal,
      _isCustom: true,
    });
    haptic();
    onClose();
  };

  const field = (label,key,placeholder,color) => (
    <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
      <span style={{ fontSize:12,color:color||"var(--muted)",fontWeight:600 }}>{label}</span>
      <input
        type={key==="name"||key==="serving"?"text":"number"}
        placeholder={placeholder}
        value={form[key]}
        onChange={e=>set(key,e.target.value)}
        style={{ padding:"8px 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",fontSize:15,outline:"none" }}
      />
    </div>
  );

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:110,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <div style={{ width:"100%",maxWidth:520,background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:20,maxHeight:"92vh",overflowY:"auto",display:"flex",flexDirection:"column",gap:14 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ fontWeight:700,fontSize:17 }}>Custom food</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted)" }}><X size={20}/></button>
        </div>
        {field("Food name *","name","e.g. Mum's fried rice")}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {field("Calories (kcal) *","cal","e.g. 500","var(--accent)")}
          {field("Protein (g)","pro","e.g. 25","#e05252")}
          {field("Carbs (g)","carb","e.g. 60","#e09c28")}
          {field("Fat (g)","fat","e.g. 15","#5ca3e0")}
        </div>
        {field("Serving description","serving","e.g. 1 plate (400g)")}
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          {MEAL_TYPES.map(m=>(
            <button key={m} onClick={()=>setMeal(m)} style={{
              padding:"5px 12px",borderRadius:8,border:"1.5px solid",
              borderColor:meal===m?"var(--accent)":"var(--border)",
              background:meal===m?"var(--accent)":"none",
              color:meal===m?"#fff":"var(--text)",cursor:"pointer",fontSize:13
            }}>{m}</button>
          ))}
        </div>
        <button onClick={confirm} disabled={!valid} style={{
          background:valid?"var(--accent)":"var(--border)",
          color:valid?"#fff":"var(--muted)",
          border:"none",borderRadius:12,padding:"12px",fontWeight:700,fontSize:15,
          cursor:valid?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:6
        }}>
          <Check size={16}/>Add food
        </button>
      </div>
    </div>
  );
}

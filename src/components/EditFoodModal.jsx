import { useState } from "react";
import { X, Check } from "lucide-react";
import { MEAL_TYPES, haptic } from "../lib/helpers";

export default function EditFoodModal({ entry, onSave, onClose }) {
  const [cal,  setCal]  = useState(String(entry.cal));
  const [pro,  setPro]  = useState(String(entry.pro));
  const [carb, setCarb] = useState(String(entry.carb));
  const [fat,  setFat]  = useState(String(entry.fat));
  const [meal, setMeal] = useState(entry.meal);

  const save = () => {
    onSave({
      ...entry,
      cal:  Math.round(Number(cal)  || 0),
      pro:  Math.round(Number(pro)  || 0),
      carb: Math.round(Number(carb) || 0),
      fat:  Math.round(Number(fat)  || 0),
      meal,
    });
    haptic("medium");
    onClose();
  };

  const field = (label, val, setVal, color) => (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <span style={{fontSize:12,color:color||"var(--muted)",fontWeight:600}}>{label}</span>
      <input
        type="number"
        value={val}
        onChange={e=>setVal(e.target.value)}
        style={{padding:"8px 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",fontSize:15,outline:"none"}}
      />
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:110,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:520,background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:20,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <p style={{margin:0,fontWeight:700,fontSize:17}}>Edit entry</p>
            <p style={{margin:0,fontSize:12,color:"var(--muted)"}}>{entry.name}</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)"}}><X size={20}/></button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {field("Calories (kcal)", cal, setCal, "var(--accent)")}
          {field("Protein (g)", pro, setPro, "#e05252")}
          {field("Carbs (g)", carb, setCarb, "#e09c28")}
          {field("Fat (g)", fat, setFat, "#5ca3e0")}
        </div>

        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {MEAL_TYPES.map(m=>(
            <button key={m} onClick={()=>setMeal(m)} style={{
              padding:"5px 12px",borderRadius:8,border:"1.5px solid",
              borderColor:meal===m?"var(--accent)":"var(--border)",
              background:meal===m?"var(--accent)":"none",
              color:meal===m?"#fff":"var(--text)",cursor:"pointer",fontSize:13
            }}>{m}</button>
          ))}
        </div>

        <button onClick={save} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <Check size={16}/>Save changes
        </button>
      </div>
    </div>
  );
}

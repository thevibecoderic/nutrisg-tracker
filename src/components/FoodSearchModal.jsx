import { useState, useEffect, useRef } from "react";
import { Search, X, Check, Star, Edit3, Loader } from "lucide-react";
import { SG_QUICK } from "../lib/foods";
import { smartSearch } from "../lib/foodSearch";
import { MEAL_TYPES, todayStr, fmtDate, haptic } from "../lib/helpers";
import CustomFoodModal from "./CustomFoodModal";

export default function FoodSearchModal({ onAdd, onClose, initialDate, favs, onToggleFav, customFoods, recentFoods }) {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState([...customFoods, ...SG_QUICK].slice(0, 25));
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const [qty, setQty]             = useState(1);
  const [meal, setMeal]           = useState("Lunch");
  const [activeTab, setActiveTab] = useState("search");
  const [showCustom, setShowCustom] = useState(false);
  const [logDate, setLogDate]     = useState(initialDate || todayStr());
  const debounce = useRef();

  const isFav = f => favs.some(x => x.name === f.name);

  useEffect(() => {
    const q = query.replace(/\s+/g," ").trim();
    if (!q) { setResults([...customFoods, ...SG_QUICK].slice(0,25)); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const found = await smartSearch(q, customFoods, SG_QUICK);
      setResults(found);
      setLoading(false);
    }, 400);
  }, [query, customFoods]);

  const confirm = () => {
    if (!selected) return;
    onAdd({
      id: Date.now(),
      name: selected.name,
      cal:  Math.round((selected.cal||0)*qty),
      pro:  Math.round((selected.pro||0)*qty),
      carb: Math.round((selected.carb||0)*qty),
      fat:  Math.round((selected.fat||0)*qty),
      serving: `${qty}× ${selected.serving}`,
      meal,
      targetDate: logDate,
    });
    haptic("medium");
    onClose();
  };

  const displayList = activeTab==="favs" ? favs : activeTab==="recent" ? recentFoods : results;

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <div style={{ width:"100%",maxWidth:520,background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:20,maxHeight:"92vh",display:"flex",flexDirection:"column",gap:10 }}>

        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ fontWeight:700,fontSize:17 }}>Add food</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted)" }}><X size={20}/></button>
        </div>

        {/* Date picker */}
        <div style={{ display:"flex",alignItems:"center",gap:8,background:"var(--surface)",borderRadius:10,padding:"8px 12px" }}>
          <span style={{ fontSize:13,color:"var(--muted)" }}>📅 Log to:</span>
          <input type="date" value={logDate} max={todayStr()} onChange={e=>{if(e.target.value)setLogDate(e.target.value);}}
            style={{ border:"none",background:"none",fontSize:13,color:"var(--accent)",fontWeight:700,cursor:"pointer",outline:"none",flex:1 }}/>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",gap:6 }}>
          {[["search","Search"],["recent","🕐 Recent"],["favs","⭐ Favs"]].map(([id,label])=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={{
              flex:1,padding:"6px",borderRadius:10,border:"1.5px solid",
              borderColor:activeTab===id?"var(--accent)":"var(--border)",
              background:activeTab===id?"var(--accent)11":"none",
              color:activeTab===id?"var(--accent)":"var(--muted)",
              cursor:"pointer",fontWeight:600,fontSize:12
            }}>{label}</button>
          ))}
          <button onClick={()=>setShowCustom(true)} style={{ padding:"6px 10px",borderRadius:10,border:"1.5px solid var(--border)",background:"none",color:"var(--muted)",cursor:"pointer",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:3 }}>
            <Edit3 size={11}/>Custom
          </button>
        </div>

        {/* Search bar */}
        {activeTab==="search" && (
          <div style={{ display:"flex",gap:8,alignItems:"center",background:"var(--surface)",borderRadius:12,padding:"8px 12px" }}>
            <Search size={16} style={{ color:"var(--muted)",flexShrink:0 }}/>
            <input
              placeholder="Search food…"
              value={query}
              onChange={e=>setQuery(e.target.value)}
              onFocus={e=>e.target.scrollIntoView({block:"nearest",behavior:"smooth"})}
              style={{ flex:1,border:"none",background:"none",outline:"none",fontSize:15,color:"var(--text)" }}
            />
            {loading && <Loader size={14} style={{ color:"var(--muted)",animation:"spin 1s linear infinite" }}/>}
            {query && <button onClick={()=>setQuery("")} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted)",padding:0 }}><X size={14}/></button>}
          </div>
        )}

        {/* Results */}
        <div style={{ overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:6 }}>
          {activeTab==="favs" && favs.length===0 && <p style={{ color:"var(--muted)",fontSize:14,textAlign:"center",marginTop:30 }}>No favourites yet — tap ⭐ on any food.</p>}
          {activeTab==="recent" && recentFoods.length===0 && <p style={{ color:"var(--muted)",fontSize:14,textAlign:"center",marginTop:30 }}>No recent foods yet.</p>}
          {activeTab==="search" && !query && <p style={{ fontSize:12,color:"var(--muted)",margin:0 }}>Singapore foods ↓</p>}

          {displayList.map((f,i)=>(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:6 }}>
              <button onClick={()=>setSelected(f)} style={{
                flex:1,display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"10px 12px",borderRadius:10,border:"2px solid",
                borderColor:selected?.name===f.name?"var(--accent)":"transparent",
                background:selected?.name===f.name?"var(--accent)11":"var(--surface)",
                cursor:"pointer",textAlign:"left",gap:8
              }}>
                <div style={{ minWidth:0 }}>
                  <p style={{ margin:0,fontWeight:600,fontSize:14,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:200 }}>{f.name}</p>
                  <p style={{ margin:0,fontSize:12,color:"var(--muted)" }}>
                    {f.serving}
                    {f.source && <span style={{ marginLeft:6,fontSize:10,color:"var(--accent)",fontWeight:600,background:"var(--accent)22",padding:"1px 5px",borderRadius:4 }}>{f.source}</span>}
                  </p>
                </div>
                <span style={{ fontSize:13,fontWeight:700,color:"var(--accent)",whiteSpace:"nowrap" }}>{f.cal} kcal</span>
              </button>
              <button onClick={()=>onToggleFav(f)} style={{ background:"none",border:"none",cursor:"pointer",padding:6,flexShrink:0 }}>
                <Star size={16} fill={isFav(f)?"#e09c28":"none"} color={isFav(f)?"#e09c28":"var(--muted)"}/>
              </button>
            </div>
          ))}
          {activeTab==="search" && displayList.length===0 && !loading && (
            <p style={{ color:"var(--muted)",fontSize:14,textAlign:"center",marginTop:20 }}>No results. Try Custom to add manually.</p>
          )}
        </div>

        {/* Config */}
        {selected && (
          <div style={{ borderTop:"1px solid var(--border)",paddingTop:12,display:"flex",flexDirection:"column",gap:10 }}>
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
            <div style={{ display:"flex",alignItems:"center",gap:12 }}>
              <span style={{ fontSize:13,color:"var(--muted)" }}>Qty</span>
              <button onClick={()=>setQty(q=>Math.max(0.5,q-0.5))} style={{ width:28,height:28,borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",cursor:"pointer",color:"var(--text)",fontSize:16 }}>−</button>
              <span style={{ minWidth:28,textAlign:"center",fontWeight:700 }}>{qty}</span>
              <button onClick={()=>setQty(q=>q+0.5)} style={{ width:28,height:28,borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",cursor:"pointer",color:"var(--text)",fontSize:16 }}>+</button>
              <span style={{ fontSize:12,color:"var(--muted)" }}>= {Math.round(selected.cal*qty)} kcal</span>
            </div>
            <button onClick={confirm} style={{
              background:"var(--accent)",color:"#fff",border:"none",borderRadius:12,
              padding:"12px",fontWeight:700,fontSize:15,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:6
            }}>
              <Check size={16}/>Add to {meal} · {logDate===todayStr()?"Today":fmtDate(logDate)}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      {showCustom && <CustomFoodModal onAdd={e=>{onAdd({...e,targetDate:logDate,_isCustom:true});onClose();}} onClose={()=>setShowCustom(false)}/>}
    </div>
  );
}
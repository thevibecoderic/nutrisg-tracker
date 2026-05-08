import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import {
  Search, Plus, Trash2, Camera, ChevronLeft, ChevronRight,
  Flame, Beef, Wheat, Droplets, TrendingUp, Calendar, Home,
  X, Check, ChevronDown
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate  = d => new Date(d + "T00:00:00").toLocaleDateString("en-SG", { weekday:"short", day:"numeric", month:"short" });
const fmtMonth = d => new Date(d + "T00:00:00").toLocaleDateString("en-SG", { month:"long", year:"numeric" });
const startOfWeek = d => {
  const dt = new Date(d + "T00:00:00");
  const day = dt.getDay();
  dt.setDate(dt.getDate() - day);
  return dt.toISOString().slice(0, 10);
};
const addDays = (d, n) => {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};
const weekDays = start => Array.from({ length: 7 }, (_, i) => addDays(start, i));
const monthDays = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  return Array.from({ length: days }, (_, i) => `${ym}-${String(i+1).padStart(2,"0")}`);
};

const STORAGE_KEY = "nutrisg_logs_v1";
const loadLogs = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } };
const saveLogs = d => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const totals = entries => entries.reduce(
  (a, e) => ({ cal: a.cal + (e.cal||0), pro: a.pro + (e.pro||0), carb: a.carb + (e.carb||0), fat: a.fat + (e.fat||0) }),
  { cal: 0, pro: 0, carb: 0, fat: 0 }
);

// SG-specific food suggestions shown before user types
const SG_QUICK = [
  { name:"Chicken Rice", cal:607, pro:32, carb:74, fat:18, serving:"1 plate (400g)" },
  { name:"Char Kway Teow", cal:744, pro:28, carb:89, fat:30, serving:"1 plate (450g)" },
  { name:"Laksa", cal:589, pro:25, carb:66, fat:25, serving:"1 bowl (500g)" },
  { name:"Nasi Lemak", cal:644, pro:22, carb:76, fat:30, serving:"1 set (380g)" },
  { name:"Roti Prata (plain)", cal:252, pro:7, carb:34, fat:10, serving:"2 pieces" },
  { name:"Mee Goreng", cal:660, pro:20, carb:88, fat:24, serving:"1 plate (420g)" },
  { name:"Bak Chor Mee", cal:540, pro:28, carb:68, fat:16, serving:"1 bowl (400g)" },
  { name:"Wonton Mee", cal:470, pro:24, carb:60, fat:14, serving:"1 bowl (380g)" },
  { name:"Popiah (1 roll)", cal:165, pro:6, carb:23, fat:6, serving:"1 roll (120g)" },
  { name:"Teh Tarik", cal:120, pro:4, carb:17, fat:4, serving:"1 cup (250ml)" },
  { name:"Kaya Toast Set", cal:420, pro:14, carb:55, fat:17, serving:"2 toast + egg" },
  { name:"Economy Rice (3 dishes)", cal:700, pro:26, carb:88, fat:26, serving:"1 plate" },
  { name:"Hokkien Mee", cal:650, pro:29, carb:78, fat:22, serving:"1 plate (430g)" },
  { name:"Satay (5 sticks)", cal:300, pro:28, carb:14, fat:14, serving:"5 sticks + sauce" },
  { name:"Ice Kachang", cal:270, pro:3, carb:60, fat:3, serving:"1 bowl (350g)" },
  { name:"Durian (1 seed)", cal:150, pro:2, carb:23, fat:5, serving:"1 seed (100g)" },
  { name:"Mango Sticky Rice", cal:380, pro:5, carb:68, fat:10, serving:"1 portion" },
  { name:"Kopi-O", cal:35, pro:1, carb:6, fat:1, serving:"1 cup (250ml)" },
  { name:"Milo Dinosaur", cal:310, pro:6, carb:54, fat:8, serving:"1 cup" },
  { name:"Char Siu Bao (steamed)", cal:185, pro:9, carb:25, fat:5, serving:"1 bun (90g)" },
];

// Search Open Food Facts (real API, free)
async function searchOFF(query) {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&fields=product_name,nutriments,serving_size,brands&page_size=10`
    );
    const data = await res.json();
    return (data.products || [])
      .filter(p => p.product_name && p.nutriments?.["energy-kcal_100g"])
      .slice(0, 8)
      .map(p => ({
        name: p.product_name + (p.brands ? ` (${p.brands.split(",")[0]})` : ""),
        cal:  Math.round((p.nutriments["energy-kcal_100g"] || 0)),
        pro:  Math.round((p.nutriments["proteins_100g"] || 0)),
        carb: Math.round((p.nutriments["carbohydrates_100g"] || 0)),
        fat:  Math.round((p.nutriments["fat_100g"] || 0)),
        serving: p.serving_size || "per 100g",
      }));
  } catch { return []; }
}

// ─── components ──────────────────────────────────────────────────────────────

function MacroBadge({ icon: Icon, label, value, unit, color }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"8px 12px", borderRadius:10, background:color+"22" }}>
      <Icon size={14} color={color}/>
      <span style={{ fontSize:15, fontWeight:700, color }}>{Math.round(value)}</span>
      <span style={{ fontSize:10, color:"#888" }}>{unit} {label}</span>
    </div>
  );
}

function FoodSearchModal({ onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(SG_QUICK);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [meal, setMeal] = useState("Lunch");
  const debounce = useRef();

  useEffect(() => {
    if (!query.trim()) { setResults(SG_QUICK); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const sgFiltered = SG_QUICK.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
      const api = await searchOFF(query);
      setResults([...sgFiltered, ...api]);
      setLoading(false);
    }, 500);
  }, [query]);

  const confirm = () => {
    if (!selected) return;
    onAdd({
      id: Date.now(),
      name: selected.name,
      cal:  Math.round((selected.cal  || 0) * qty),
      pro:  Math.round((selected.pro  || 0) * qty),
      carb: Math.round((selected.carb || 0) * qty),
      fat:  Math.round((selected.fat  || 0) * qty),
      serving: qty + "× " + selected.serving,
      meal,
    });
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:520, background:"var(--bg)", borderRadius:"20px 20px 0 0", padding:20, maxHeight:"92vh", display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontWeight:700, fontSize:17 }}>Add food</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)" }}><X size={20}/></button>
        </div>

        {/* Search bar */}
        <div style={{ display:"flex", gap:8, alignItems:"center", background:"var(--surface)", borderRadius:12, padding:"8px 12px" }}>
          <Search size={16} style={{ color:"var(--muted)", flexShrink:0 }}/>
          <input
            autoFocus
            placeholder="Search food (e.g. chicken rice, milo…)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex:1, border:"none", background:"none", outline:"none", fontSize:15, color:"var(--text)" }}
          />
          {loading && <span style={{ fontSize:12, color:"var(--muted)" }}>…</span>}
        </div>

        {/* Results */}
        <div style={{ overflowY:"auto", flex:1, display:"flex", flexDirection:"column", gap:6 }}>
          {!query && <p style={{ fontSize:12, color:"var(--muted)", margin:0 }}>Popular Singapore foods ↓</p>}
          {results.map((f, i) => (
            <button key={i} onClick={() => setSelected(f)} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"10px 12px", borderRadius:10, border:"2px solid",
              borderColor: selected?.name === f.name ? "var(--accent)" : "transparent",
              background: selected?.name === f.name ? "var(--accent)11" : "var(--surface)",
              cursor:"pointer", textAlign:"left", gap:8
            }}>
              <div>
                <p style={{ margin:0, fontWeight:600, fontSize:14, color:"var(--text)" }}>{f.name}</p>
                <p style={{ margin:0, fontSize:12, color:"var(--muted)" }}>{f.serving}</p>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--accent)", whiteSpace:"nowrap" }}>{f.cal} kcal</span>
            </button>
          ))}
          {results.length === 0 && !loading && (
            <p style={{ color:"var(--muted)", fontSize:14, textAlign:"center", marginTop:20 }}>No results. Try a different name.</p>
          )}
        </div>

        {/* Config row */}
        {selected && (
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:12, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {MEAL_TYPES.map(m => (
                <button key={m} onClick={() => setMeal(m)} style={{
                  padding:"5px 12px", borderRadius:8, border:"1.5px solid",
                  borderColor: meal===m ? "var(--accent)" : "var(--border)",
                  background: meal===m ? "var(--accent)" : "none",
                  color: meal===m ? "#fff" : "var(--text)", cursor:"pointer", fontSize:13
                }}>{m}</button>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:13, color:"var(--muted)" }}>Qty</span>
              <button onClick={() => setQty(q => Math.max(0.5, q-0.5))} style={{ width:28, height:28, borderRadius:8, border:"1px solid var(--border)", background:"var(--surface)", cursor:"pointer", color:"var(--text)", fontSize:16 }}>−</button>
              <span style={{ minWidth:28, textAlign:"center", fontWeight:700 }}>{qty}</span>
              <button onClick={() => setQty(q => q+0.5)} style={{ width:28, height:28, borderRadius:8, border:"1px solid var(--border)", background:"var(--surface)", cursor:"pointer", color:"var(--text)", fontSize:16 }}>+</button>
              <span style={{ fontSize:12, color:"var(--muted)" }}>= {Math.round(selected.cal*qty)} kcal</span>
            </div>
            <button onClick={confirm} style={{
              background:"var(--accent)", color:"#fff", border:"none", borderRadius:12,
              padding:"12px", fontWeight:700, fontSize:15, cursor:"pointer", display:"flex",
              alignItems:"center", justifyContent:"center", gap:6
            }}><Check size={16}/>Add to {meal}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Daily view ───────────────────────────────────────────────────────────────

function DayView({ date, logs, onChange }) {
  const entries = logs[date] || [];
  const day = totals(entries);
  const [showSearch, setShowSearch] = useState(false);
  const [photoMap, setPhotoMap] = useState({});
  const fileRef = useRef();
  const [photoTarget, setPhotoTarget] = useState(null);

  const addEntry = entry => onChange(date, [...entries, entry]);
  const removeEntry = id => onChange(date, entries.filter(e => e.id !== id));

  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file || !photoTarget) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoMap(m => ({ ...m, [photoTarget]: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const byMeal = MEAL_TYPES.map(m => ({ meal: m, items: entries.filter(e => e.meal === m) }));

  return (
    <div style={{ padding:"0 0 80px" }}>
      {/* Date header */}
      <div style={{ padding:"16px 20px 8px" }}>
        <p style={{ margin:0, fontSize:13, color:"var(--muted)" }}>Daily summary</p>
        <p style={{ margin:0, fontSize:20, fontWeight:800 }}>{fmtDate(date)}</p>
      </div>

      {/* Macro ring summary */}
      <div style={{ margin:"0 16px 16px", background:"var(--surface)", borderRadius:16, padding:16 }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
          <div style={{ textAlign:"center" }}>
            <p style={{ margin:0, fontSize:38, fontWeight:900, color:"var(--accent)", lineHeight:1 }}>{Math.round(day.cal)}</p>
            <p style={{ margin:0, fontSize:12, color:"var(--muted)" }}>kcal today</p>
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"space-around" }}>
          <MacroBadge icon={Beef} label="protein" value={day.pro} unit="g" color="#e05252"/>
          <MacroBadge icon={Wheat} label="carbs" value={day.carb} unit="g" color="#e09c28"/>
          <MacroBadge icon={Droplets} label="fat" value={day.fat} unit="g" color="#5ca3e0"/>
        </div>
      </div>

      {/* Meal sections */}
      {byMeal.map(({ meal, items }) => (
        <div key={meal} style={{ margin:"0 16px 12px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <span style={{ fontWeight:700, fontSize:14 }}>{meal}</span>
            {items.length > 0 && (
              <span style={{ fontSize:12, color:"var(--muted)" }}>{Math.round(totals(items).cal)} kcal</span>
            )}
          </div>
          {items.length === 0 && (
            <p style={{ fontSize:13, color:"var(--muted)", margin:"4px 0" }}>Nothing logged yet</p>
          )}
          {items.map(e => (
            <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, background:"var(--surface)", borderRadius:12, padding:"10px 12px", marginBottom:6 }}>
              {photoMap[e.id]
                ? <img src={photoMap[e.id]} alt="" style={{ width:40, height:40, borderRadius:8, objectFit:"cover" }}/>
                : (
                  <button onClick={() => { setPhotoTarget(e.id); fileRef.current.click(); }}
                    style={{ width:40, height:40, borderRadius:8, border:"1.5px dashed var(--border)", background:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)" }}>
                    <Camera size={14}/>
                  </button>
                )
              }
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontWeight:600, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e.name}</p>
                <p style={{ margin:0, fontSize:11, color:"var(--muted)" }}>{e.serving} · P:{e.pro}g C:{e.carb}g F:{e.fat}g</p>
              </div>
              <span style={{ fontWeight:700, color:"var(--accent)", fontSize:13 }}>{e.cal}</span>
              <button onClick={() => removeEntry(e.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#e05252", padding:4 }}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>
      ))}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handlePhoto}/>

      {/* FAB */}
      <button onClick={() => setShowSearch(true)} style={{
        position:"fixed", bottom:84, right:20, width:56, height:56, borderRadius:"50%",
        background:"var(--accent)", border:"none", cursor:"pointer", color:"#fff",
        boxShadow:"0 4px 20px rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50
      }}><Plus size={24}/></button>

      {showSearch && <FoodSearchModal onAdd={addEntry} onClose={() => setShowSearch(false)}/>}
    </div>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({ logs, onSelectDay }) {
  const today = todayStr();
  const [ym, setYm] = useState(today.slice(0, 7));

  const days = monthDays(ym);
  const firstDow = new Date(ym + "-01T00:00:00").getDay();

  const prevMonth = () => {
    const [y, m] = ym.split("-").map(Number);
    setYm(m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,"0")}`);
  };
  const nextMonth = () => {
    const [y, m] = ym.split("-").map(Number);
    setYm(m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,"0")}`);
  };

  return (
    <div style={{ padding:"0 16px 80px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 4px" }}>
        <button onClick={prevMonth} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text)" }}><ChevronLeft size={20}/></button>
        <span style={{ fontWeight:800, fontSize:18 }}>{fmtMonth(ym + "-01")}</span>
        <button onClick={nextMonth} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text)" }}><ChevronRight size={20}/></button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", textAlign:"center", marginBottom:4 }}>
        {["S","M","T","W","T","F","S"].map((d,i) => (
          <span key={i} style={{ fontSize:11, color:"var(--muted)", fontWeight:600 }}>{d}</span>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {Array.from({ length: firstDow }, (_, i) => <div key={"e"+i}/>)}
        {days.map(d => {
          const entries = logs[d] || [];
          const cal = totals(entries).cal;
          const isToday = d === today;
          const hasLog = entries.length > 0;
          return (
            <button key={d} onClick={() => onSelectDay(d)} style={{
              aspectRatio:"1", borderRadius:12, border: isToday ? "2px solid var(--accent)" : "1.5px solid transparent",
              background: hasLog ? "var(--accent)22" : "var(--surface)",
              cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1
            }}>
              <span style={{ fontSize:13, fontWeight: isToday ? 800 : 500, color: isToday ? "var(--accent)" : "var(--text)" }}>
                {Number(d.slice(8))}
              </span>
              {hasLog && <span style={{ fontSize:9, color:"var(--accent)", fontWeight:700 }}>{Math.round(cal)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Trends view ─────────────────────────────────────────────────────────────

function TrendsView({ logs }) {
  const [range, setRange] = useState("week");
  const today = todayStr();

  let days;
  if (range === "week") days = weekDays(startOfWeek(today));
  else if (range === "month") days = monthDays(today.slice(0, 7));
  else days = Array.from({ length: 30 }, (_, i) => addDays(today, -29 + i));

  const chartData = days.map(d => {
    const t = totals(logs[d] || []);
    return { day: d.slice(5), cal: Math.round(t.cal), pro: Math.round(t.pro), carb: Math.round(t.carb), fat: Math.round(t.fat) };
  });

  const filled = chartData.filter(d => d.cal > 0);
  const avgCal = filled.length ? Math.round(filled.reduce((a,d) => a+d.cal, 0) / filled.length) : 0;
  const maxCal = Math.max(...chartData.map(d => d.cal), 1);
  const streak = (() => {
    let s = 0, d = today;
    while ((logs[d]||[]).length > 0) { s++; d = addDays(d, -1); }
    return s;
  })();

  return (
    <div style={{ padding:"16px 16px 80px" }}>
      <p style={{ margin:"0 0 16px", fontSize:20, fontWeight:800 }}>Trends</p>

      {/* Stats cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        {[
          { label:"Avg calories", value: avgCal ? avgCal+" kcal" : "—", color:"var(--accent)" },
          { label:"Best day", value: maxCal > 0 ? maxCal+" kcal" : "—", color:"#e09c28" },
          { label:"Logging streak", value: streak+" days", color:"#5ca3e0" },
        ].map(s => (
          <div key={s.label} style={{ background:"var(--surface)", borderRadius:14, padding:12, textAlign:"center" }}>
            <p style={{ margin:0, fontWeight:800, fontSize:18, color:s.color }}>{s.value}</p>
            <p style={{ margin:0, fontSize:10, color:"var(--muted)", marginTop:2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Range selector */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["week","month","30 days"].map(r => (
          <button key={r} onClick={() => setRange(r)} style={{
            padding:"5px 14px", borderRadius:8, border:"1.5px solid",
            borderColor: range===r ? "var(--accent)" : "var(--border)",
            background: range===r ? "var(--accent)" : "none",
            color: range===r ? "#fff" : "var(--text)", cursor:"pointer", fontSize:13
          }}>{r}</button>
        ))}
      </div>

      {/* Calorie bar chart */}
      <div style={{ background:"var(--surface)", borderRadius:16, padding:16, marginBottom:16 }}>
        <p style={{ margin:"0 0 12px", fontWeight:700, fontSize:14 }}>Calories</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
            <XAxis dataKey="day" tick={{ fontSize:10, fill:"var(--muted)" }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:10, fill:"var(--muted)" }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, fontSize:12 }}/>
            <Bar dataKey="cal" fill="var(--accent)" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Macros line chart */}
      <div style={{ background:"var(--surface)", borderRadius:16, padding:16 }}>
        <p style={{ margin:"0 0 12px", fontWeight:700, fontSize:14 }}>Macros (g)</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
            <XAxis dataKey="day" tick={{ fontSize:10, fill:"var(--muted)" }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:10, fill:"var(--muted)" }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, fontSize:12 }}/>
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }}/>
            <Line type="monotone" dataKey="pro" stroke="#e05252" strokeWidth={2} dot={false} name="Protein"/>
            <Line type="monotone" dataKey="carb" stroke="#e09c28" strokeWidth={2} dot={false} name="Carbs"/>
            <Line type="monotone" dataKey="fat" stroke="#5ca3e0" strokeWidth={2} dot={false} name="Fat"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("today");
  const [selectedDay, setSelectedDay] = useState(todayStr());
  const [logs, setLogs] = useState(loadLogs);
  const [dark, setDark] = useState(() => window.matchMedia?.("(prefers-color-scheme:dark)").matches);

  useEffect(() => { saveLogs(logs); }, [logs]);

  const updateDay = (date, entries) => setLogs(l => ({ ...l, [date]: entries }));

  const selectDay = d => { setSelectedDay(d); setTab("day"); };

  const theme = {
    "--bg": dark ? "#111" : "#f5f5f7",
    "--surface": dark ? "#1c1c1e" : "#ffffff",
    "--text": dark ? "#f2f2f7" : "#1c1c1e",
    "--muted": dark ? "#8e8e93" : "#6e6e73",
    "--border": dark ? "#2c2c2e" : "#e5e5ea",
    "--accent": "#34c759",
  };

  const navItems = [
    { id:"today", icon:Home,     label:"Today" },
    { id:"calendar", icon:Calendar, label:"Calendar" },
    { id:"trends", icon:TrendingUp, label:"Trends" },
  ];

  return (
    <div style={{ ...theme, minHeight:"100dvh", background:"var(--bg)", color:"var(--text)", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", maxWidth:480, margin:"0 auto", position:"relative" }}>
      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px 8px", position:"sticky", top:0, background:"var(--bg)", zIndex:40, borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Flame size={20} color="var(--accent)"/>
          <span style={{ fontWeight:900, fontSize:17, letterSpacing:"-0.5px" }}>NutriSG</span>
        </div>
        {tab === "day" && selectedDay !== todayStr() && (
          <button onClick={() => setSelectedDay(todayStr())} style={{ fontSize:12, color:"var(--accent)", background:"none", border:"none", cursor:"pointer" }}>← Today</button>
        )}
        <button onClick={() => setDark(d => !d)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18 }}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Content */}
      {(tab === "today" || tab === "day") && (
        <DayView date={selectedDay} logs={logs} onChange={updateDay}/>
      )}
      {tab === "calendar" && (
        <CalendarView logs={logs} onSelectDay={selectDay}/>
      )}
      {tab === "trends" && (
        <TrendsView logs={logs}/>
      )}

      {/* Bottom nav */}
      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"var(--surface)", borderTop:"1px solid var(--border)", display:"flex", padding:"8px 0 20px", zIndex:40 }}>
        {navItems.map(({ id, icon:Icon, label }) => (
          <button key={id} onClick={() => { if(id==="today") setSelectedDay(todayStr()); setTab(id==="today"?"today":id); }}
            style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"4px 0",
              color: (tab===id || (id==="today" && tab==="day")) ? "var(--accent)" : "var(--muted)" }}>
            <Icon size={22}/>
            <span style={{ fontSize:10, fontWeight:600 }}>{label}</span>
          </button>
        ))}
      </nav>
      <div style={{ textAlign:"center", padding:"12px 0 4px", fontSize:11, color:"var(--muted)" }}>
  © Made by Eric 2026
</div>
    </div>
  );
}

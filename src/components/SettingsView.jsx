import { useState } from "react";
import { ChevronRight, Bell, Target, User, Trash2, LogOut, Ruler, Save } from "lucide-react";
import { GOAL_KEY, ACCENT_KEY, DARK_KEY, haptic } from "../lib/helpers";

const NOTIF_KEY    = "nutrisg_notifs_v1";
const MACRO_KEY    = "nutrisg_macros_v1";
const UNITS_KEY    = "nutrisg_units_v1";

const loadNotifs = () => { try { return JSON.parse(localStorage.getItem(NOTIF_KEY)) || { breakfast:"08:00", lunch:"13:00", dinner:"19:00", enabled:false }; } catch { return { breakfast:"08:00", lunch:"13:00", dinner:"19:00", enabled:false }; } };
const loadMacros = () => { try { return JSON.parse(localStorage.getItem(MACRO_KEY)) || { pro:150, carb:250, fat:65 }; } catch { return { pro:150, carb:250, fat:65 }; } };

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <p style={{ margin:"0 0 8px 4px", fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.5px" }}>{title}</p>
      <div style={{ background:"var(--surface)", borderRadius:16, overflow:"hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ icon:Icon, label, right, color, onClick, border=true }) {
  return (
    <button onClick={onClick||undefined} style={{
      display:"flex", alignItems:"center", gap:12, padding:"14px 16px", width:"100%",
      background:"none", border:"none", borderBottom: border ? "1px solid var(--border)" : "none",
      cursor: onClick ? "pointer" : "default", textAlign:"left"
    }}>
      {Icon && <div style={{ width:32, height:32, borderRadius:8, background:(color||"var(--accent)")+"22", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={16} color={color||"var(--accent)"}/>
      </div>}
      <span style={{ flex:1, fontSize:15, color:"var(--text)", fontWeight:500 }}>{label}</span>
      {right}
    </button>
  );
}

export default function SettingsView({ profile, accent, dark, onSignOut, onSignIn, onDeleteData }) {
  const [goal,    setGoal]    = useState(()=>Number(localStorage.getItem(GOAL_KEY))||2000);
  const [macros,  setMacros]  = useState(loadMacros);
  const [notifs,  setNotifs]  = useState(loadNotifs);
  const [units,   setUnits]   = useState(()=>localStorage.getItem(UNITS_KEY)||"metric");
  const [saved,   setSaved]   = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const saveAll = async () => {
    localStorage.setItem(GOAL_KEY,  String(goal));
    localStorage.setItem(MACRO_KEY, JSON.stringify(macros));
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
    localStorage.setItem(UNITS_KEY, units);

    // request notification permission if enabling
    if (notifs.enabled && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setNotifs(n=>({...n,enabled:false}));
        alert("Notification permission denied. Please enable in your phone settings.");
        return;
      }
      scheduleNotifications(notifs);
    }
    haptic("medium");
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };

  const scheduleNotifications = (n) => {
    // Service worker based — register if available
    if (!("serviceWorker" in navigator)) return;
    // Store schedule for SW to use
    localStorage.setItem("nutrisg_notif_schedule_v1", JSON.stringify(n));
  };

  const numInput = (val, onChange, min=0, max=9999) => (
    <input
      type="number" value={val} min={min} max={max}
      onChange={e=>onChange(Number(e.target.value))}
      style={{ width:70, padding:"5px 8px", borderRadius:8, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", fontSize:14, outline:"none", textAlign:"right" }}
    />
  );

  const timeInput = (val, onChange) => (
    <input
      type="time" value={val}
      onChange={e=>onChange(e.target.value)}
      style={{ padding:"5px 8px", borderRadius:8, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", fontSize:14, outline:"none" }}
    />
  );

  const toggle = (val, onChange) => (
    <div onClick={()=>onChange(!val)} style={{
      width:44, height:26, borderRadius:13, background:val?"var(--accent)":"var(--border)",
      position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0
    }}>
      <div style={{
        position:"absolute", top:3, left: val?20:3, width:20, height:20,
        borderRadius:"50%", background:"#fff", transition:"left 0.2s",
        boxShadow:"0 1px 4px rgba(0,0,0,0.2)"
      }}/>
    </div>
  );

  return (
    <div style={{ padding:"16px 16px 100px" }}>
      <p style={{ margin:"0 0 20px", fontSize:20, fontWeight:800 }}>Settings</p>

      {/* Account */}
      <Section title="Account">
        {profile ? (
          <>
            <Row icon={User} label={`Signed in as ${profile.display_name}`} border={true}
              right={<span style={{ fontSize:12, color:"var(--muted)" }}>@{profile.username}</span>}
            />
            <Row icon={LogOut} label="Sign out" color="#e05252" onClick={onSignOut} border={false}/>
          </>
        ) : (
          <Row icon={User} label="Sign in to sync across devices" color="var(--accent)"
            onClick={onSignIn} border={false}
            right={<ChevronRight size={16} color="var(--muted)"/>}
          />
        )}
      </Section>

      {/* Goals */}
      <Section title="Daily goals">
        <Row icon={Target} label="Calorie goal" border={true}
          right={<div style={{ display:"flex", alignItems:"center", gap:6 }}>{numInput(goal, setGoal, 500, 5000)}<span style={{ fontSize:13, color:"var(--muted)" }}>kcal</span></div>}
        />
        <Row icon={()=><span style={{ fontSize:14 }}>🥩</span>} label="Protein target" border={true}
          right={<div style={{ display:"flex", alignItems:"center", gap:6 }}>{numInput(macros.pro, v=>setMacros(m=>({...m,pro:v})), 0, 500)}<span style={{ fontSize:13, color:"var(--muted)" }}>g</span></div>}
        />
        <Row icon={()=><span style={{ fontSize:14 }}>🌾</span>} label="Carbs target" border={true}
          right={<div style={{ display:"flex", alignItems:"center", gap:6 }}>{numInput(macros.carb, v=>setMacros(m=>({...m,carb:v})), 0, 800)}<span style={{ fontSize:13, color:"var(--muted)" }}>g</span></div>}
        />
        <Row icon={()=><span style={{ fontSize:14 }}>💧</span>} label="Fat target" border={false}
          right={<div style={{ display:"flex", alignItems:"center", gap:6 }}>{numInput(macros.fat, v=>setMacros(m=>({...m,fat:v})), 0, 300)}<span style={{ fontSize:13, color:"var(--muted)" }}>g</span></div>}
        />
      </Section>

      {/* Notifications */}
      <Section title="Meal reminders">
        <Row icon={Bell} label="Enable reminders" border={true}
          right={toggle(notifs.enabled, v=>setNotifs(n=>({...n,enabled:v})))}
        />
        {notifs.enabled && <>
          <Row icon={()=><span style={{ fontSize:14 }}>🌅</span>} label="Breakfast" border={true}
            right={timeInput(notifs.breakfast, v=>setNotifs(n=>({...n,breakfast:v})))}
          />
          <Row icon={()=><span style={{ fontSize:14 }}>☀️</span>} label="Lunch" border={true}
            right={timeInput(notifs.lunch, v=>setNotifs(n=>({...n,lunch:v})))}
          />
          <Row icon={()=><span style={{ fontSize:14 }}>🌙</span>} label="Dinner" border={false}
            right={timeInput(notifs.dinner, v=>setNotifs(n=>({...n,dinner:v})))}
          />
        </>}
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <Row icon={Ruler} label="Units" border={false}
          right={
            <div style={{ display:"flex", gap:4 }}>
              {["metric","imperial"].map(u=>(
                <button key={u} onClick={()=>setUnits(u)} style={{
                  padding:"4px 10px", borderRadius:8, border:"1.5px solid",
                  borderColor:units===u?"var(--accent)":"var(--border)",
                  background:units===u?"var(--accent)":"none",
                  color:units===u?"#fff":"var(--text)", cursor:"pointer", fontSize:12, fontWeight:600
                }}>{u==="metric"?"kg":"lbs"}</button>
              ))}
            </div>
          }
        />
      </Section>

      {/* Data */}
      <Section title="Data">
        {!showClearConfirm ? (
          <Row icon={Trash2} label="Clear all my data" color="#e05252" border={false}
            onClick={()=>setShowClearConfirm(true)}
            right={<ChevronRight size={16} color="#e05252"/>}
          />
        ) : (
          <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ flex:1, fontSize:14, color:"#e05252", fontWeight:600 }}>Are you sure? This can't be undone.</span>
            <button onClick={()=>setShowClearConfirm(false)} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid var(--border)", background:"none", color:"var(--text)", cursor:"pointer", fontSize:13 }}>Cancel</button>
            <button onClick={()=>{ onDeleteData(); setShowClearConfirm(false); haptic("heavy"); }} style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"#e05252", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>Delete</button>
          </div>
        )}
      </Section>

      {/* Save button */}
      <button onClick={saveAll} style={{
        width:"100%", padding:"14px", borderRadius:14, border:"none",
        background: saved ? "#34c759" : "var(--accent)", color:"#fff",
        fontWeight:700, fontSize:16, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        transition:"background 0.3s"
      }}>
        <Save size={18}/>{saved ? "Saved ✓" : "Save settings"}
      </button>

      <p style={{ textAlign:"center", fontSize:11, color:"var(--muted)", marginTop:20 }}>
        NutriSG v6.0 · © Made by Eric 2026
      </p>
    </div>
  );
}

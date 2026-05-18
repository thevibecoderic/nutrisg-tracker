import { useState, useEffect, useRef, useCallback } from "react";
import { Flame, Home, Calendar, TrendingUp, LogIn, LogOut, Loader, Settings } from "lucide-react";
import { todayStr, PROFILE_KEY, ACCENT_KEY, DARK_KEY, haptic } from "./lib/helpers";
import {
  loadLogs, saveLog, loadFavs, saveFavs, loadCustomFoods, saveCustomFoods,
  exchangeToken, refreshSession, signOut, getUser,
  saveSession, loadSession, clearSession
} from "./lib/supabase";
import { registerSW } from "./lib/notifications";
import DayView      from "./components/DayView";
import CalendarView from "./components/CalendarView";
import TrendsView   from "./components/TrendsView";
import SettingsView from "./components/SettingsView";
import { SignInModal, SignOutConfirm } from "./components/Modals";

export default function App() {
  const [tab, setTab]                   = useState("today");
  const [selectedDay, setSelectedDay]   = useState(todayStr());
  const [logs, setLogs]                 = useState({});
  const [favs, setFavs]                 = useState([]);
  const [customFoods, setCustomFoods]   = useState([]);
  const [recentFoods, setRecentFoods]   = useState(()=>{ try{ return JSON.parse(localStorage.getItem("nutrisg_recent_v1"))||[]; }catch{ return []; } });
  const [session,  setSession]  = useState(loadSession);
  const [syncing,  setSyncing]  = useState(false);
  const [showSignIn,   setShowSignIn]   = useState(false);
  const [showSignOut,  setShowSignOut]  = useState(false);
  const [offlineQueue, setOfflineQueue] = useState([]);

  const [accent, setAccent] = useState(()=>localStorage.getItem(ACCENT_KEY)||"#34c759");
  const [dark,   setDark]   = useState(()=>{
    const s=localStorage.getItem(DARK_KEY);
    return s!==null?s==="true":window.matchMedia?.("(prefers-color-scheme:dark)").matches;
  });

  const saveTimer = useRef({});
  const token  = session?.access_token  || null;
  const userId = session?.user?.id      || null;
  const userEmail = session?.user?.email || null;

  // persist prefs
  useEffect(()=>{ localStorage.setItem(ACCENT_KEY,accent); },[accent]);
  useEffect(()=>{ localStorage.setItem(DARK_KEY,String(dark)); },[dark]);

  // register service worker
  useEffect(()=>{ registerSW(); },[]);

  // dark mode toggle from settings
  useEffect(()=>{
    const handler = () => setDark(d=>!d);
    document.addEventListener("toggleDark", handler);
    return ()=>document.removeEventListener("toggleDark", handler);
  },[]);

  // handle magic link callback — check URL for token_hash on load
  useEffect(()=>{
    const url    = new URL(window.location.href);
    const token_hash = url.searchParams.get("token_hash");
    const type       = url.searchParams.get("type");
    if (token_hash && type) {
      // clear URL params immediately
      window.history.replaceState({}, "", window.location.pathname);
      setSyncing(true);
      exchangeToken(token_hash, type)
        .then(data => {
          if (data?.access_token) {
            const sess = { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user };
            setSession(sess);
            saveSession(sess);
          }
        })
        .catch(console.error)
        .finally(()=>setSyncing(false));
    }
  },[]);

  // refresh session on load if expired
  useEffect(()=>{
    if (!session?.refresh_token) return;
    const refresh = async () => {
      try {
        const data = await refreshSession(session.refresh_token);
        if (data?.access_token) {
          const sess = { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user };
          setSession(sess);
          saveSession(sess);
        }
      } catch { clearSession(); setSession(null); }
    };
    refresh();
  },[]);

  // load data when session changes
  useEffect(()=>{
    if (!userId) { setLogs({}); setFavs([]); setCustomFoods([]); return; }
    const load = async () => {
      setSyncing(true);
      try {
        const logRows = await loadLogs(userId, token);
        const obj={};
        (logRows||[]).forEach(r=>{obj[r.date]=r.entries;});
        setLogs(obj);
        const favRow = await loadFavs(userId, token);
        setFavs(favRow?.[0]?.foods||[]);
        const cusRow = await loadCustomFoods(userId, token);
        setCustomFoods(cusRow?.[0]?.foods||[]);
      } catch(e){ console.error("Load error",e); }
      setSyncing(false);
    };
    load();
  },[userId]);

  // flush offline queue when back online
  useEffect(()=>{
    const flush = async () => {
      if (!navigator.onLine || !profile || offlineQueue.length===0) return;
      for (const {date,entries} of offlineQueue) {
        try { await saveLog(profile.id,date,entries); } catch{}
      }
      setOfflineQueue([]);
    };
    window.addEventListener("online",flush);
    return ()=>window.removeEventListener("online",flush);
  },[offlineQueue,profile]);

  const persistDay = useCallback(async (date,entries)=>{
    if (!userId) return;
    if (!navigator.onLine) {
      setOfflineQueue(q=>[...q.filter(x=>x.date!==date),{date,entries}]);
      return;
    }
    try { await saveLog(userId, date, entries, token); }
    catch(e){ console.error("Save error",e); }
  },[userId, token]);

  const updateDay = useCallback((date,entries)=>{
    setLogs(l=>({...l,[date]:entries}));
    clearTimeout(saveTimer.current[date]);
    saveTimer.current[date]=setTimeout(()=>persistDay(date,entries),800);
  },[persistDay]);

  const handleAdd = (entry)=>{
    const targetDate = entry.targetDate||selectedDay;
    const {targetDate:_,...clean}=entry;
    setLogs(prev => {
      const existing = prev[targetDate]||[];
      const next = {...prev,[targetDate]:[...existing,clean]};
      clearTimeout(saveTimer.current[targetDate]);
      saveTimer.current[targetDate]=setTimeout(()=>persistDay(targetDate,[...existing,clean]),800);
      return next;
    });
    setRecentFoods(prev=>{
      const food={name:clean.name,cal:clean.cal,pro:clean.pro,carb:clean.carb,fat:clean.fat,serving:clean.serving.replace(/^\d+× /,"")};
      const next=[food,...prev.filter(f=>f.name!==food.name)].slice(0,10);
      localStorage.setItem("nutrisg_recent_v1",JSON.stringify(next));
      return next;
    });
    if (entry._isCustom && userId) {
      const food={name:clean.name,cal:clean.cal,pro:clean.pro,carb:clean.carb,fat:clean.fat,serving:clean.serving.replace(/^\d+× /,"")};
      setCustomFoods(prev=>{
        const next=[...prev,food];
        saveCustomFoods(userId, next, token).catch(console.error);
        return next;
      });
    }
  };

  const handleRemove = (date,id)=>{
    updateDay(date,(logs[date]||[]).filter(e=>e.id!==id));
  };

  const handleEdit = (date,updated)=>{
    updateDay(date,(logs[date]||[]).map(e=>e.id===updated.id?updated:e));
  };

  const toggleFav = (food)=>{
    const next=favs.some(f=>f.name===food.name)?favs.filter(f=>f.name!==food.name):[...favs,food];
    setFavs(next);
    if (userId) saveFavs(userId, next, token).catch(console.error);
  };

  const handleSignOut = async ()=>{
    if (token) await signOut(token).catch(()=>{});
    clearSession();
    setSession(null);
    setLogs({}); setFavs([]); setCustomFoods([]);
    setShowSignOut(false);
  };

  const handleDeleteData = () => {
    setLogs({}); setFavs([]); setCustomFoods([]); setRecentFoods([]);
    localStorage.removeItem("nutrisg_recent_v1");
  };

  const selectDay=d=>{setSelectedDay(d);setTab("day");};

  const theme={
    "--bg":      dark?"#111":"#f5f5f7",
    "--surface": dark?"#1c1c1e":"#ffffff",
    "--text":    dark?"#f2f2f7":"#1c1c1e",
    "--muted":   dark?"#8e8e93":"#6e6e73",
    "--border":  dark?"#2c2c2e":"#e5e5ea",
    "--accent":  accent,
  };

  const navItems=[
    {id:"today",    icon:Home,       label:"Today"},
    {id:"calendar", icon:Calendar,   label:"Calendar"},
    {id:"trends",   icon:TrendingUp, label:"Trends"},
    {id:"settings", icon:Settings,   label:"Settings"},
  ];

  return (
    <div style={{...theme,minHeight:"100dvh",background:"var(--bg)",color:"var(--text)",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",maxWidth:480,margin:"0 auto",position:"relative"}}>

      {/* Top bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px 8px",position:"sticky",top:0,background:"var(--bg)",zIndex:40,borderBottom:"1px solid var(--border)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <Flame size={20} color="var(--accent)"/>
          <span style={{fontWeight:900,fontSize:17,letterSpacing:"-0.5px"}}>NutriSG</span>
          {syncing && <Loader size={12} style={{color:"var(--muted)",animation:"spin 1s linear infinite"}}/>}
          {!navigator.onLine && <span style={{fontSize:10,color:"#e09c28",fontWeight:600}}>offline</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {tab==="day"&&selectedDay!==todayStr()&&(
            <button onClick={()=>setSelectedDay(todayStr())} style={{fontSize:12,color:"var(--accent)",background:"none",border:"none",cursor:"pointer"}}>← Today</button>
          )}
          <button onClick={()=>userId?setShowSignOut(true):setShowSignIn(true)} style={{background:"none",border:"1px solid var(--border)",borderRadius:20,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"4px 10px",color:"var(--text)"}}>
            {userId?<><LogOut size={13}/><span style={{fontSize:12,fontWeight:600}}>{userEmail?.split("@")[0]}</span></>:<><LogIn size={13}/><span style={{fontSize:12,fontWeight:600}}>Sign in</span></>}
          </button>
          <button onClick={()=>{setDark(d=>!d);haptic();}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18}}>
            {dark?"☀️":"🌙"}
          </button>
        </div>
      </div>

      {/* Content */}
      {(tab==="today"||tab==="day") && (
        <DayView
          date={selectedDay}
          logs={logs}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onEdit={handleEdit}
          onDateChange={setSelectedDay}
          favs={favs}
          onToggleFav={toggleFav}
          customFoods={customFoods}
          recentFoods={recentFoods}
        />
      )}
      {tab==="calendar" && <CalendarView logs={logs} onSelectDay={selectDay}/>}
      {tab==="trends"   && <TrendsView logs={logs}/>}
      {tab==="settings" && (
        <SettingsView
          profile={session?.user}
          accent={accent}
          dark={dark}
          onSignOut={()=>setShowSignOut(true)}
          onSignIn={()=>setShowSignIn(true)}
          onDeleteData={handleDeleteData}
        />
      )}

      {/* Bottom nav */}
      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"var(--surface)",borderTop:"1px solid var(--border)",display:"flex",padding:"8px 0 20px",zIndex:40}}>
        {navItems.map(({id,icon:Icon,label})=>(
          <button key={id}
            onClick={()=>{if(id==="today")setSelectedDay(todayStr());setTab(id==="today"?"today":id);haptic("light");}}
            style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0",
              color:(tab===id||(id==="today"&&tab==="day"))?"var(--accent)":"var(--muted)"}}
          >
            <Icon size={22}/><span style={{fontSize:10,fontWeight:600}}>{label}</span>
          </button>
        ))}
      </nav>

      <div style={{textAlign:"center",padding:"12px 0 4px",fontSize:11,color:"var(--muted)"}}>
        © Made by Eric 2026
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>

      {showSignIn   && <SignInModal onClose={()=>setShowSignIn(false)}/>}
      {showSignOut  && <SignOutConfirm email={userEmail} onConfirm={handleSignOut} onCancel={()=>setShowSignOut(false)}/>}
    </div>
  );
}

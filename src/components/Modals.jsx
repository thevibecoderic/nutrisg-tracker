import { useState } from "react";
import { X, Loader, Check } from "lucide-react";
import { ACCENTS, haptic } from "../lib/helpers";
import { createProfile, findProfile } from "../lib/supabase";

// ─── ColorPicker ──────────────────────────────────────────────────────────────

export function ColorPicker({ accent, onChange, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:320, background:"var(--bg)", borderRadius:20, padding:24, display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontWeight:800, fontSize:17 }}>Choose colour</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)" }}><X size={20}/></button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {ACCENTS.map(a => (
            <button key={a.value} onClick={() => { onChange(a.value); haptic(); onClose(); }} style={{
              padding:"14px 8px", borderRadius:14,
              border:`3px solid ${accent===a.value ? a.value : "transparent"}`,
              background:a.value+"22", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:6
            }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:a.value }}/>
              <span style={{ fontSize:12, fontWeight:600, color:"var(--text)" }}>{a.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SignInModal ──────────────────────────────────────────────────────────────

export function SignInModal({ onClose, onSignIn }) {
  const [username, setUsername] = useState("");
  const [pin, setPin]           = useState("");
  const [mode, setMode]         = useState("signin");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handle = async () => {
    const u = username.trim().toLowerCase();
    if (!u) { setError("Enter a username"); return; }
    if (!pin || pin.length < 4) { setError("PIN must be at least 4 digits"); return; }
    setLoading(true); setError("");
    try {
      if (mode === "create") {
        const existing = await findProfile(u);
        if (existing?.length > 0) { setError("Username taken"); setLoading(false); return; }
        const created = await createProfile(u, pin, username.trim());
        haptic("medium");
        onSignIn({ id: created[0].id, username: u, display_name: created[0].display_name });
      } else {
        const found = await findProfile(u);
        if (!found?.length) { setError("Username not found — create an account first"); setLoading(false); return; }
        if (found[0].pin !== pin) { setError("Wrong PIN"); setLoading(false); return; }
        haptic("medium");
        onSignIn({ id: found[0].id, username: u, display_name: found[0].display_name });
      }
    } catch(e) { setError("Connection error — try again"); console.error(e); }
    setLoading(false);
  };

  const inputStyle = { padding:"10px 14px", borderRadius:10, border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text)", fontSize:15, outline:"none", width:"100%", boxSizing:"border-box" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:360, background:"var(--bg)", borderRadius:20, padding:24, display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontWeight:800, fontSize:18 }}>{mode==="create" ? "Create account" : "Sign in"}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)" }}><X size={20}/></button>
        </div>
        <p style={{ margin:0, fontSize:13, color:"var(--muted)" }}>Syncs across all your devices.</p>
        <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} style={inputStyle}/>
        <input placeholder="PIN (min 4 digits)" type="password" inputMode="numeric" maxLength={8} value={pin} onChange={e=>setPin(e.target.value)} style={inputStyle}/>
        {error && <p style={{ margin:0, fontSize:13, color:"#e05252" }}>{error}</p>}
        <button onClick={handle} disabled={loading} style={{ background:"var(--accent)", color:"#fff", border:"none", borderRadius:12, padding:"12px", fontWeight:700, fontSize:15, cursor:loading?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          {loading && <Loader size={16} style={{ animation:"spin 1s linear infinite" }}/>}
          {mode==="create" ? "Create account" : "Sign in"}
        </button>
        <button onClick={()=>{setMode(m=>m==="create"?"signin":"create");setError("");}} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--accent)", fontSize:14, fontWeight:600 }}>
          {mode==="create" ? "← Back to sign in" : "New here? Create account →"}
        </button>
      </div>
    </div>
  );
}

// ─── SignOutConfirm ───────────────────────────────────────────────────────────

export function SignOutConfirm({ name, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:320, background:"var(--bg)", borderRadius:20, padding:24, display:"flex", flexDirection:"column", gap:14 }}>
        <span style={{ fontWeight:800, fontSize:17 }}>Sign out?</span>
        <p style={{ margin:0, fontSize:14, color:"var(--muted)" }}>You'll be signed out of <strong>{name}</strong>. Your data is saved in the cloud.</p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"11px", borderRadius:12, border:"1.5px solid var(--border)", background:"none", color:"var(--text)", fontWeight:600, fontSize:15, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>{haptic("medium");onConfirm();}} style={{ flex:1, padding:"11px", borderRadius:12, border:"none", background:"#e05252", color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer" }}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

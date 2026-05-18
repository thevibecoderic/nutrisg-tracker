import { useState } from "react";
import { X, Loader, Eye, EyeOff, Check } from "lucide-react";
import { haptic } from "../lib/helpers";
import { signIn, signUp } from "../lib/supabase";

// ── Password strength indicator ───────────────────────────────────────────────

function PasswordStrength({ password }) {
  const checks = [
    { label:"8+ characters",       ok: password.length >= 8 },
    { label:"Uppercase letter",    ok: /[A-Z]/.test(password) },
    { label:"Lowercase letter",    ok: /[a-z]/.test(password) },
    { label:"Number",              ok: /[0-9]/.test(password) },
    { label:"Special character",   ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const passed = checks.filter(c => c.ok).length;
  const color  = passed <= 2 ? "#e05252" : passed <= 3 ? "#e09c28" : "#34c759";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <div style={{ height:4, borderRadius:2, background:"var(--border)" }}>
        <div style={{ height:"100%", borderRadius:2, background:color, width:`${(passed/5)*100}%`, transition:"width 0.3s" }}/>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 10px" }}>
        {checks.map(c => (
          <span key={c.label} style={{ fontSize:11, color: c.ok ? "#34c759" : "var(--muted)", display:"flex", alignItems:"center", gap:3 }}>
            <span>{c.ok ? "✓" : "·"}</span>{c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── SignInModal ───────────────────────────────────────────────────────────────

export function SignInModal({ onClose, onSignIn }) {
  const [mode,        setMode]     = useState("signin"); // signin | signup
  const [email,       setEmail]    = useState("");
  const [password,    setPassword] = useState("");
  const [displayName, setName]     = useState("");
  const [showPw,      setShowPw]   = useState(false);
  const [loading,     setLoading]  = useState(false);
  const [error,       setError]    = useState("");

  const inputStyle = {
    padding:"11px 14px", borderRadius:12, border:"1px solid var(--border)",
    background:"var(--surface)", color:"var(--text)", fontSize:15,
    outline:"none", width:"100%", boxSizing:"border-box",
  };

  const handle = async () => {
    setError("");
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email address"); return; }
    if (!password) { setError("Enter your password"); return; }
    setLoading(true);
    try {
      let user;
      if (mode === "signup") {
        user = await signUp(email.trim(), password, displayName.trim() || email.split("@")[0]);
      } else {
        user = await signIn(email.trim(), password);
      }
      haptic("medium");
      onSignIn({ id: user.userId, email: user.email, displayName: user.displayName });
      onClose();
    } catch(e) {
      setError(e.message || "Something went wrong — try again");
    }
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:380,background:"var(--bg)",borderRadius:20,padding:24,display:"flex",flexDirection:"column",gap:14,maxHeight:"90vh",overflowY:"auto" }}>

        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ fontWeight:800,fontSize:18 }}>{mode==="signup" ? "Create account" : "Sign in"}</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted)" }}><X size={20}/></button>
        </div>

        {mode === "signup" && (
          <input
            placeholder="Display name (optional)"
            value={displayName}
            onChange={e=>setName(e.target.value)}
            style={inputStyle}
          />
        )}

        <input
          placeholder="Email address"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          style={inputStyle}
        />

        <div style={{ position:"relative" }}>
          <input
            placeholder="Password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handle()}
            style={{ ...inputStyle, paddingRight:44 }}
          />
          <button onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--muted)" }}>
            {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
        </div>

        {/* Password strength — only on signup */}
        {mode === "signup" && password.length > 0 && (
          <PasswordStrength password={password}/>
        )}

        {mode === "signin" && (
          <p style={{ margin:0,fontSize:12,color:"var(--muted)" }}>
            Password must be 8+ chars with uppercase, lowercase, number and special character.
          </p>
        )}

        {error && (
          <div style={{ background:"#e0525220",borderRadius:10,padding:"10px 12px" }}>
            <p style={{ margin:0,fontSize:13,color:"#e05252",fontWeight:500 }}>{error}</p>
          </div>
        )}

        <button onClick={handle} disabled={loading} style={{
          background:"var(--accent)",color:"#fff",border:"none",borderRadius:12,
          padding:"13px",fontWeight:700,fontSize:15,
          cursor:loading?"default":"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          opacity:loading?0.7:1
        }}>
          {loading && <Loader size={16} style={{ animation:"spin 1s linear infinite" }}/>}
          {mode==="signup" ? "Create account" : "Sign in"}
        </button>

        <button onClick={()=>{setMode(m=>m==="signup"?"signin":"signup");setError("");setPassword("");}} style={{
          background:"none",border:"none",cursor:"pointer",
          color:"var(--accent)",fontSize:14,fontWeight:600,padding:"4px 0"
        }}>
          {mode==="signup" ? "Already have an account? Sign in →" : "New here? Create account →"}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

// ── SignOutConfirm ────────────────────────────────────────────────────────────

export function SignOutConfirm({ email, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:320,background:"var(--bg)",borderRadius:20,padding:24,display:"flex",flexDirection:"column",gap:14 }}>
        <span style={{ fontWeight:800,fontSize:17 }}>Sign out?</span>
        <p style={{ margin:0,fontSize:14,color:"var(--muted)" }}>
          You'll be signed out of <strong>{email}</strong>. Your data is safely stored in the cloud.
        </p>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onCancel} style={{ flex:1,padding:"11px",borderRadius:12,border:"1.5px solid var(--border)",background:"none",color:"var(--text)",fontWeight:600,fontSize:15,cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>{haptic("medium");onConfirm();}} style={{ flex:1,padding:"11px",borderRadius:12,border:"none",background:"#e05252",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer" }}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
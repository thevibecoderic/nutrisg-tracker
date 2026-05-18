import { useState } from "react";
import { X, Loader, Mail, Check } from "lucide-react";
import { ACCENTS, haptic } from "../lib/helpers";
import { sendMagicLink } from "../lib/supabase";

// ─── ColorPicker ──────────────────────────────────────────────────────────────

export function ColorPicker({ accent, onChange, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:320,background:"var(--bg)",borderRadius:20,padding:24,display:"flex",flexDirection:"column",gap:16 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ fontWeight:800,fontSize:17 }}>Choose colour</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted)" }}><X size={20}/></button>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
          {ACCENTS.map(a=>(
            <button key={a.value} onClick={()=>{onChange(a.value);haptic();onClose();}} style={{
              padding:"14px 8px",borderRadius:14,
              border:`3px solid ${accent===a.value?a.value:"transparent"}`,
              background:a.value+"22",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:6
            }}>
              <div style={{ width:28,height:28,borderRadius:"50%",background:a.value }}/>
              <span style={{ fontSize:12,fontWeight:600,color:"var(--text)" }}>{a.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SignInModal — magic link ─────────────────────────────────────────────────

export function SignInModal({ onClose }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handle = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) { setError("Enter a valid email address"); return; }
    setLoading(true);
    setError("");
    try {
      await sendMagicLink(e);
      setSent(true);
      haptic("medium");
    } catch(err) {
      setError("Could not send link — check your email and try again.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:360,background:"var(--bg)",borderRadius:20,padding:24,display:"flex",flexDirection:"column",gap:16 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ fontWeight:800,fontSize:18 }}>Sign in</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted)" }}><X size={20}/></button>
        </div>

        {!sent ? (
          <>
            <p style={{ margin:0,fontSize:14,color:"var(--muted)",lineHeight:1.5 }}>
              Enter your email and we'll send you a magic link — no password needed. Works on all your devices.
            </p>
            <input
              placeholder="your@email.com"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handle()}
              style={{ padding:"12px 14px",borderRadius:12,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",fontSize:16,outline:"none",width:"100%",boxSizing:"border-box" }}
            />
            {error && <p style={{ margin:0,fontSize:13,color:"#e05252" }}>{error}</p>}
            <button onClick={handle} disabled={loading} style={{
              background:"var(--accent)",color:"#fff",border:"none",borderRadius:12,
              padding:"13px",fontWeight:700,fontSize:15,cursor:loading?"default":"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8
            }}>
              {loading
                ? <Loader size={16} style={{ animation:"spin 1s linear infinite" }}/>
                : <Mail size={16}/>
              }
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"10px 0" }}>
            <div style={{ width:64,height:64,borderRadius:"50%",background:"var(--accent)22",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Check size={32} color="var(--accent)"/>
            </div>
            <p style={{ margin:0,fontWeight:800,fontSize:17 }}>Check your email!</p>
            <p style={{ margin:0,fontSize:14,color:"var(--muted)",textAlign:"center",lineHeight:1.5 }}>
              We sent a magic link to <strong>{email}</strong>. Tap the link to sign in.
            </p>
            <p style={{ margin:0,fontSize:12,color:"var(--muted)",textAlign:"center" }}>
              Link expires in 1 hour. Check spam if you don't see it.
            </p>
            <button onClick={()=>setSent(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--accent)",fontSize:14,fontWeight:600 }}>
              ← Use a different email
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

// ─── SignOutConfirm ───────────────────────────────────────────────────────────

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

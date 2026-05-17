import { useRef, useState } from "react";
import { Sparkles, Loader, X } from "lucide-react";
import { haptic } from "../lib/helpers";

async function scanWithGemini(base64, mimeType) {
  const key = import.meta.env.VITE_GEMINI_KEY;
  if (!key) throw new Error("No Gemini key — add VITE_GEMINI_KEY to .env");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: { mime_type: mimeType, data: base64 }
            },
            {
              text: `You are a Singapore nutrition expert. Identify the food in this photo. Focus on Singapore hawker food, local cuisine, and common foods eaten in Singapore.

Respond ONLY with valid JSON, no markdown, no extra text:
{"name":"specific food name","cal":calories as integer,"pro":protein grams as integer,"carb":carb grams as integer,"fat":fat grams as integer,"serving":"serving description","confidence":"high or medium or low"}`
            }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
      })
    }
  );

  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export default function AIScanner({ onResult }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError]       = useState("");
  const [preview, setPreview]   = useState(null);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setScanning(true);
    setPreview(URL.createObjectURL(file));

    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const result = await scanWithGemini(base64, file.type || "image/jpeg");
      haptic("medium");
      onResult(result);
    } catch(err) {
      setError("Could not identify food. Try a clearer photo or search manually.");
      console.error(err);
    }
    setScanning(false);
    e.target.value = "";
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <button
        onClick={() => inputRef.current.click()}
        disabled={scanning}
        style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          width:"100%", padding:"11px", borderRadius:12,
          border:"1.5px solid var(--accent)",
          background:"var(--accent)11",
          color:"var(--accent)", cursor:scanning?"default":"pointer",
          fontWeight:700, fontSize:14
        }}
      >
        {scanning
          ? <><Loader size={16} style={{ animation:"spin 1s linear infinite" }}/> Scanning with AI…</>
          : <><Sparkles size={16}/> Scan food with AI (free)</>
        }
      </button>

      {preview && (
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src={preview} alt="" style={{ width:50, height:50, borderRadius:8, objectFit:"cover" }}/>
          {scanning && <span style={{ fontSize:13, color:"var(--muted)" }}>Identifying your food…</span>}
          {error && <p style={{ margin:0, fontSize:12, color:"#e05252" }}>{error}</p>}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleFile}/>
    </div>
  );
}

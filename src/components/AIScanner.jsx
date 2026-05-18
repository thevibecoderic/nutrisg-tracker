import { useRef, useState } from "react";
import { Sparkles, Loader } from "lucide-react";
import { haptic } from "../lib/helpers";

async function scanWithGemini(base64, mimeType) {
  const key = import.meta.env.VITE_GEMINI_KEY;
  if (!key) throw new Error("No Gemini key — add VITE_GEMINI_KEY to .env");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            {
              text: `You are a nutrition expert specialising in Singapore and Asian food. Look at this food photo and identify it.

CRITICAL RULES:
- You MUST always return a JSON result, even if you are only 50% sure
- NEVER say you cannot identify it — always make your best guess
- If it looks like a common dish, name it specifically (e.g. "Chicken Rice", "Laksa", "Char Kway Teow")
- Use typical Singapore hawker portion sizes for calorie estimates
- If it's a drink, estimate for a standard cup

Return ONLY this JSON schema structure:
{"name":"food name","cal":500,"pro":25,"carb":60,"fat":15,"serving":"1 serving (400g)","confidence":"high"}`
            }
          ]
        }],
        generationConfig: { 
          temperature: 0.1, 
          maxOutputTokens: 200,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errText}`);
  }
  
  const data  = await res.json();
  const text  = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = text.replace(/^```json\s*|```\s*$/gi, "").trim();
  
  if (!clean) throw new Error("Empty response from Gemini");
  return JSON.parse(clean);
}

// Client-side downscaling helper to prevent 429 Token limit overloads
function resizeAndCompressImage(file, maxWidth = 800, maxHeight = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as highly compressed JPEG string snippet (0.7 quality)
      const base64Str = canvas.toDataURL("image/jpeg", 0.7);
      resolve(base64Str.split(",")[1]);
    };
    img.onerror = (err) => reject(err);
  });
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
      // Downsizes heavy images instantly so you don't exhaust the Free TPM rate limits
      const compressedBase64 = await resizeAndCompressImage(file);
      
      const result = await scanWithGemini(compressedBase64, "image/jpeg");
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
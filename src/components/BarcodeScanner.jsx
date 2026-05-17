import { useRef, useState } from "react";
import { Scan, X, Loader } from "lucide-react";
import { searchBarcode } from "../lib/foods";
import { haptic } from "../lib/helpers";

export default function BarcodeScanner({ onResult }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError]       = useState("");
  const inputRef = useRef();

  // On mobile, use camera input to capture barcode image
  // then extract barcode via BarcodeDetector API if available
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    setError("");

    try {
      // Try BarcodeDetector API (Chrome/Android)
      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({ formats: ["ean_13","ean_8","upc_a","upc_e","code_128","code_39"] });
        const img = await createImageBitmap(file);
        const codes = await detector.detect(img);
        if (codes.length > 0) {
          const barcode = codes[0].rawValue;
          const result = await searchBarcode(barcode);
          if (result) { haptic("medium"); onResult(result); setScanning(false); return; }
          setError(`Barcode ${barcode} not found in database.`);
        } else {
          setError("No barcode detected. Try a clearer photo.");
        }
      } else {
        setError("Barcode scanning not supported on this browser. Try Chrome on Android.");
      }
    } catch(err) {
      setError("Could not scan barcode. Try again.");
      console.error(err);
    }
    setScanning(false);
    e.target.value = "";
  };

  return (
    <div>
      <button
        onClick={() => inputRef.current.click()}
        disabled={scanning}
        style={{
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          width:"100%",padding:"11px",borderRadius:12,
          border:"1.5px solid var(--border)",
          background: scanning ? "var(--surface)" : "none",
          color:"var(--text)",cursor:scanning?"default":"pointer",
          fontWeight:600,fontSize:14
        }}
      >
        {scanning
          ? <><Loader size={16} style={{animation:"spin 1s linear infinite",color:"var(--muted)"}}/> Scanning…</>
          : <><Scan size={16}/> Scan barcode</>
        }
      </button>
      {error && <p style={{margin:"6px 0 0",fontSize:12,color:"#e05252",textAlign:"center"}}>{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFile}/>
    </div>
  );
}

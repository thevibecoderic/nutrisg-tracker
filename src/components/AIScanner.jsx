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
          responseMimeType: "application/json" // 👈 Forces Gemini to deliver pure JSON without Markdown blocks!
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
  
  // Robust fallback clean up regex matching extra line breaks or whitespaces safely
  const clean = text.replace(/^```json\s*|```\s*$/gi, "").trim();
  
  if (!clean) throw new Error("Empty response from Gemini");
  return JSON.parse(clean);
}
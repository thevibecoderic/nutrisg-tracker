// Smart food search: SG list → Open Food Facts → USDA FoodData Central
// USDA is the fallback when nothing else finds the food

const USDA_KEY = import.meta.env.VITE_USDA_KEY || "";

// ── Open Food Facts ───────────────────────────────────────────────────────────
export async function searchOFF(query) {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&fields=product_name,nutriments,serving_size,brands&page_size=8`
    );
    const data = await res.json();
    return (data.products || [])
      .filter(p => p.product_name && p.nutriments?.["energy-kcal_100g"])
      .slice(0, 6)
      .map(p => ({
        name:    p.product_name + (p.brands ? ` (${p.brands.split(",")[0]})` : ""),
        cal:     Math.round(p.nutriments["energy-kcal_100g"] || 0),
        pro:     Math.round(p.nutriments["proteins_100g"] || 0),
        carb:    Math.round(p.nutriments["carbohydrates_100g"] || 0),
        fat:     Math.round(p.nutriments["fat_100g"] || 0),
        serving: p.serving_size || "per 100g",
        source:  "Open Food Facts",
      }));
  } catch { return []; }
}

// ── USDA FoodData Central ─────────────────────────────────────────────────────
export async function searchUSDA(query) {
  if (!USDA_KEY) return [];
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=8&api_key=${USDA_KEY}&dataType=Survey%20(FNDDS),SR%20Legacy,Foundation`
    );
    const data = await res.json();
    return (data.foods || [])
      .filter(f => f.foodNutrients?.length > 0)
      .slice(0, 6)
      .map(f => {
        const get = (id) => {
          const n = f.foodNutrients?.find(n => n.nutrientId === id || n.nutrientNumber === String(id));
          return Math.round(n?.value || 0);
        };
        return {
          name:    f.description,
          cal:     get(1008) || get(208),   // Energy kcal
          pro:     get(1003) || get(203),   // Protein
          carb:    get(1005) || get(205),   // Carbs
          fat:     get(1004) || get(204),   // Fat
          serving: f.servingSize ? `${f.servingSize}${f.servingSizeUnit||"g"}` : "per 100g",
          source:  "USDA",
        };
      })
      .filter(f => f.cal > 0);
  } catch { return []; }
}

// ── Barcode (Open Food Facts) ─────────────────────────────────────────────────
export async function searchBarcode(barcode) {
  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const n = p.nutriments || {};
    return {
      name:    p.product_name || p.product_name_en || "Unknown product",
      cal:     Math.round(n["energy-kcal_100g"] || n["energy-kcal"] || 0),
      pro:     Math.round(n["proteins_100g"] || 0),
      carb:    Math.round(n["carbohydrates_100g"] || 0),
      fat:     Math.round(n["fat_100g"] || 0),
      serving: p.serving_size || "per 100g",
      source:  "Barcode",
    };
  } catch { return null; }
}

// ── Combined smart search ─────────────────────────────────────────────────────
// Returns SG local matches first, then OFF, then USDA as fallback
export async function smartSearch(query, customFoods, sgList) {
  const q = query.replace(/\s+/g, " ").trim().toLowerCase();

  // 1. Local matches (SG + custom)
  const local = [...customFoods, ...sgList].filter(f =>
    f.name.toLowerCase().replace(/\s+/g," ").includes(q) ||
    q.split(" ").filter(Boolean).every(w => f.name.toLowerCase().includes(w))
  );

  // 2. Open Food Facts
  const off = await searchOFF(query);

  // 3. USDA fallback — only if combined results are thin
  const combined = [...local, ...off];
  const names    = new Set(combined.map(f => f.name.toLowerCase()));

  let usda = [];
  if (combined.length < 4 && USDA_KEY) {
    usda = await searchUSDA(query);
    usda = usda.filter(f => !names.has(f.name.toLowerCase()));
  }

  return [...local, ...off.filter(f => !names.has(f.name.toLowerCase())), ...usda];
}

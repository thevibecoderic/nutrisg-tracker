const SUPA_URL = "https://ymytuvjdajqyjhblthyl.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteXR1dmpkYWpxeWpoYmx0aHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzAwODEsImV4cCI6MjA5MzgwNjA4MX0.4JqL2IXusczrME2CK6MBMVbgo17z0EzB1iMYUJerC04";

const headers = (extra={}) => ({
  "apikey": SUPA_KEY,
  "Authorization": `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
  ...extra,
});

export const supa = async (path, method="GET", body=null) => {
  const prefer = (method==="POST"||method==="GET") ? "return=representation" : "return=minimal";
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    method,
    headers: headers({"Prefer":prefer}),
    ...(body ? {body:JSON.stringify(body)} : {}),
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const supaUpsert = async (table, body) => {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({"Prefer":"resolution=merge-duplicates,return=minimal"}),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
};

// ── profile ──────────────────────────────────────────────────────────────────
export const createProfile = (username, pin, display_name) =>
  supa("profiles","POST",{username,pin,display_name});

export const findProfile = username =>
  supa(`profiles?username=eq.${encodeURIComponent(username)}&select=*`);

// ── logs ─────────────────────────────────────────────────────────────────────
export const loadLogs = userId =>
  supa(`logs?user_id=eq.${userId}&select=date,entries`);

export const saveLog = (userId, date, entries) =>
  supaUpsert("logs",{user_id:userId,date,entries});

// ── favourites ───────────────────────────────────────────────────────────────
export const loadFavs = userId =>
  supa(`favourites?user_id=eq.${userId}&select=foods`);

export const saveFavs = (userId, foods) =>
  supaUpsert("favourites",{user_id:userId,foods});

// ── custom foods ─────────────────────────────────────────────────────────────
export const loadCustomFoods = userId =>
  supa(`custom_foods?user_id=eq.${userId}&select=foods`);

export const saveCustomFoods = (userId, foods) =>
  supaUpsert("custom_foods",{user_id:userId,foods});

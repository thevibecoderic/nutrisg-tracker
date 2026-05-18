// All keys read from env — never hardcoded
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_KEY; // anon key only — safe for frontend

const headers = (token, extra={}) => ({
  "apikey": SUPA_KEY,
  "Authorization": `Bearer ${token || SUPA_KEY}`,
  "Content-Type": "application/json",
  ...extra,
});

// ── REST helper ───────────────────────────────────────────────────────────────

export const supa = async (path, method="GET", body=null, token=null) => {
  const prefer = (method==="POST"||method==="GET") ? "return=representation" : "return=minimal";
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    method,
    headers: headers(token, {"Prefer":prefer}),
    ...(body ? {body:JSON.stringify(body)} : {}),
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const supaUpsert = async (table, body, token=null) => {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers(token, {"Prefer":"resolution=merge-duplicates,return=minimal"}),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
};

// ── Auth — calls our serverless function, keys never exposed to browser ───────

export const signUp = async (email, password, displayName) => {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action:"signup", email, password, displayName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Sign up failed");
  return data;
};

export const signIn = async (email, password) => {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action:"signin", email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Sign in failed");
  return data;
};

export const signOut = () => clearSession();

// ── Session ───────────────────────────────────────────────────────────────────

const SESSION_KEY = "nutrisg_session_v2";
export const saveSession  = s  => localStorage.setItem(SESSION_KEY, JSON.stringify(s));
export const loadSession  = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };
export const clearSession = () => localStorage.removeItem(SESSION_KEY);

// ── Data helpers ──────────────────────────────────────────────────────────────

export const loadLogs        = (userId) => supa(`logs?user_id=eq.${userId}&select=date,entries`);
export const saveLog         = (userId, date, entries) => supaUpsert("logs", {user_id:userId, date, entries});
export const loadFavs        = (userId) => supa(`favourites?user_id=eq.${userId}&select=foods`);
export const saveFavs        = (userId, foods) => supaUpsert("favourites", {user_id:userId, foods});
export const loadCustomFoods = (userId) => supa(`custom_foods?user_id=eq.${userId}&select=foods`);
export const saveCustomFoods = (userId, foods) => supaUpsert("custom_foods", {user_id:userId, foods});
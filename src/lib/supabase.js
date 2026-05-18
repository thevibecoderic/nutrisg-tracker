const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_KEY;

const headers = (extra={}) => ({
  "apikey": SUPA_KEY,
  "Authorization": `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
  ...extra,
});

// ── REST helper ───────────────────────────────────────────────────────────────

export const supa = async (path, method="GET", body=null, token=null) => {
  const prefer = (method==="POST"||method==="GET") ? "return=representation" : "return=minimal";
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    method,
    headers: {
      ...headers({"Prefer":prefer}),
      ...(token ? {"Authorization":`Bearer ${token}`} : {}),
    },
    ...(body ? {body:JSON.stringify(body)} : {}),
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const supaUpsert = async (table, body, token=null) => {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...headers({"Prefer":"resolution=merge-duplicates,return=minimal"}),
      ...(token ? {"Authorization":`Bearer ${token}`} : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
};

// ── Auth ──────────────────────────────────────────────────────────────────────

const AUTH_URL = `${SUPA_URL}/auth/v1`;

const authHeaders = (extra={}) => ({
  "apikey": SUPA_KEY,
  "Content-Type": "application/json",
  ...extra,
});

// Send magic link to email
export const sendMagicLink = async (email) => {
  const res = await fetch(`${AUTH_URL}/magiclink`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
};

// Exchange token from magic link URL for a session
export const exchangeToken = async (token_hash, type) => {
  const res = await fetch(`${AUTH_URL}/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ token_hash, type }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // { access_token, refresh_token, user }
};

// Refresh session using refresh token
export const refreshSession = async (refresh_token) => {
  const res = await fetch(`${AUTH_URL}/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

// Sign out
export const signOut = async (access_token) => {
  await fetch(`${AUTH_URL}/logout`, {
    method: "POST",
    headers: authHeaders({ "Authorization":`Bearer ${access_token}` }),
  });
};

// Get current user from access token
export const getUser = async (access_token) => {
  const res = await fetch(`${AUTH_URL}/user`, {
    headers: authHeaders({ "Authorization":`Bearer ${access_token}` }),
  });
  if (!res.ok) return null;
  return await res.json();
};

// ── Session storage ───────────────────────────────────────────────────────────

const SESSION_KEY = "nutrisg_session_v1";

export const saveSession = (session) =>
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

export const loadSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
};

export const clearSession = () =>
  localStorage.removeItem(SESSION_KEY);

// ── Data helpers (now use access token for RLS) ───────────────────────────────

export const loadLogs = (userId, token) =>
  supa(`logs?user_id=eq.${userId}&select=date,entries`, "GET", null, token);

export const saveLog = (userId, date, entries, token) =>
  supaUpsert("logs", {user_id:userId, date, entries}, token);

export const loadFavs = (userId, token) =>
  supa(`favourites?user_id=eq.${userId}&select=foods`, "GET", null, token);

export const saveFavs = (userId, foods, token) =>
  supaUpsert("favourites", {user_id:userId, foods}, token);

export const loadCustomFoods = (userId, token) =>
  supa(`custom_foods?user_id=eq.${userId}&select=foods`, "GET", null, token);

export const saveCustomFoods = (userId, foods, token) =>
  supaUpsert("custom_foods", {user_id:userId, foods}, token);

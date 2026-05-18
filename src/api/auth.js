import bcrypt from "bcryptjs";

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service key — server only, never in frontend

const supaHeaders = {
  "apikey": SUPA_SERVICE_KEY,
  "Authorization": `Bearer ${SUPA_SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// Password rules: min 8 chars, 1 upper, 1 lower, 1 digit, 1 special
function validatePassword(password) {
  if (!password || password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character (!@#$%^&*)";
  return null;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function findUser(email) {
  const res = await fetch(
    `${SUPA_URL}/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&select=*`,
    { headers: supaHeaders }
  );
  const data = await res.json();
  return data?.[0] || null;
}

async function createUser(email, passwordHash, displayName) {
  const res = await fetch(`${SUPA_URL}/rest/v1/app_users`, {
    method: "POST",
    headers: supaHeaders,
    body: JSON.stringify({ email, password_hash: passwordHash, display_name: displayName }),
  });
  const data = await res.json();
  return data?.[0] || null;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "https://nutrisg-tracker.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, email, password, displayName } = req.body || {};

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  // ── SIGN UP ──────────────────────────────────────────────────────────────────
  if (action === "signup") {
    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ error: pwError });

    const existing = await findUser(email.toLowerCase());
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    // bcrypt hash — 12 rounds, server-side only
    const hash = await bcrypt.hash(password, 12);
    const user = await createUser(email.toLowerCase(), hash, displayName || email.split("@")[0]);
    if (!user) return res.status(500).json({ error: "Failed to create account" });

    return res.status(200).json({ userId: user.id, email: user.email, displayName: user.display_name });
  }

  // ── SIGN IN ──────────────────────────────────────────────────────────────────
  if (action === "signin") {
    const user = await findUser(email.toLowerCase());
    if (!user) return res.status(401).json({ error: "No account found with this email" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Incorrect password" });

    return res.status(200).json({ userId: user.id, email: user.email, displayName: user.display_name });
  }

  return res.status(400).json({ error: "Unknown action" });
}

// ============================================================================
//  NINE2FIVE landing — marketing + live demo + founding-member checkout.
//  Nessun segreto hardcoded: tutto via env. Provider supportati (in ordine di
//  precedenza): Lemon Squeezy (LEMON_*), Paddle Billing (PADDLE_*), link
//  generico (PAYMENT_LINK). Se nessuno è configurato → waitlist su file.
//  data/ è effimero su Render free tier: subscribers.json è una cache locale,
//  la fonte di verità resta la dashboard del merchant of record.
// ============================================================================
import express from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHmac, timingSafeEqual } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3400;

// ---- Env-driven provider config ---------------------------------------------
const PAYMENT_LINK = process.env.PAYMENT_LINK || null; // legacy generic link
const LEMON_CHECKOUT_URL = process.env.LEMON_CHECKOUT_URL || null;
const LEMON_WEBHOOK_SECRET = process.env.LEMON_WEBHOOK_SECRET || null;
const PADDLE_CLIENT_TOKEN = process.env.PADDLE_CLIENT_TOKEN || null;
const PADDLE_PRICE_ID = process.env.PADDLE_PRICE_ID || null;
const PADDLE_ENV = process.env.PADDLE_ENV === "production" ? "production" : "sandbox";
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || null;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || null;

const FOUNDING_SEATS = 100;
const ACTIVE_STATUSES = new Set(["active", "on_trial", "trialing"]);

// ---- Storage -----------------------------------------------------------------
const DATA_DIR = join(__dirname, "data");
const LEADS = join(DATA_DIR, "leads.json");
const SUBSCRIBERS = join(DATA_DIR, "subscribers.json");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const readJson = (path, fallback) => {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
};
let leads = readJson(LEADS, []);
let subscribers = readJson(SUBSCRIBERS, []);

const saveLeads = () => writeFileSync(LEADS, JSON.stringify(leads, null, 2));
const saveSubscribers = () => writeFileSync(SUBSCRIBERS, JSON.stringify(subscribers, null, 2));

function upsertSubscriber({ id, email, status, provider }) {
  const now = new Date().toISOString();
  const found = subscribers.find((s) => s.provider === provider && s.id === id);
  if (found) {
    if (email) found.email = email;
    found.status = status;
    found.updatedAt = now;
  } else {
    subscribers.push({ id, email: email || null, status, provider, createdAt: now, updatedAt: now });
  }
  saveSubscribers();
}

const activeCount = () => subscribers.filter((s) => ACTIVE_STATUSES.has(s.status)).length;

// ---- Helpers -----------------------------------------------------------------
const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};
const rawBody = (req) => (Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0));

// ============================================================================
//  Webhooks — registered BEFORE express.json() so they receive the RAW body
//  (signature verification requires the exact bytes on the wire).
// ============================================================================

// ---- Lemon Squeezy: X-Signature = HMAC-SHA256 hex of raw body -----------------
app.post("/webhooks/lemonsqueezy", express.raw({ type: "*/*" }), (req, res) => {
  if (!LEMON_WEBHOOK_SECRET) return res.status(503).json({ error: "webhook not configured" });
  const raw = rawBody(req);
  const digest = createHmac("sha256", LEMON_WEBHOOK_SECRET).update(raw).digest("hex");
  if (!safeEqual(digest, req.get("X-Signature"))) return res.status(401).json({ error: "invalid signature" });

  let payload;
  try { payload = JSON.parse(raw.toString("utf8")); } catch { return res.status(400).json({ error: "invalid json" }); }

  const event = payload?.meta?.event_name;
  const HANDLED = {
    subscription_created: null, // null → use attributes.status
    subscription_updated: null,
    subscription_cancelled: "cancelled",
    subscription_expired: "expired",
  };
  if (!(event in HANDLED)) return res.json({ ok: true, ignored: event || "unknown" });

  const attrs = payload?.data?.attributes || {};
  const id = String(payload?.data?.id ?? "");
  if (!id) return res.status(400).json({ error: "missing subscription id" });
  upsertSubscriber({
    id,
    email: attrs.user_email || null,
    status: HANDLED[event] || attrs.status || "active",
    provider: "lemonsqueezy",
  });
  console.log(`🍋 lemonsqueezy ${event} → sub ${id} (${attrs.user_email || "no email"})`);
  res.json({ ok: true });
});

// ---- Paddle Billing: Paddle-Signature "ts=...;h1=..." --------------------------
//      h1 = HMAC-SHA256 hex of `${ts}:${rawBody}`; reject stale timestamps.
app.post("/webhooks/paddle", express.raw({ type: "*/*" }), (req, res) => {
  if (!PADDLE_WEBHOOK_SECRET) return res.status(503).json({ error: "webhook not configured" });
  const header = String(req.get("Paddle-Signature") || "");
  const parts = Object.fromEntries(
    header.split(";").map((kv) => kv.split("=").map((s) => s.trim())).filter((p) => p.length === 2)
  );
  const ts = Number(parts.ts);
  if (!Number.isFinite(ts) || !parts.h1) return res.status(401).json({ error: "malformed signature header" });
  if (Math.abs(Date.now() / 1000 - ts) > 15 * 60) return res.status(401).json({ error: "stale timestamp" });

  const raw = rawBody(req);
  const digest = createHmac("sha256", PADDLE_WEBHOOK_SECRET).update(`${ts}:${raw.toString("utf8")}`).digest("hex");
  if (!safeEqual(digest, parts.h1)) return res.status(401).json({ error: "invalid signature" });

  let payload;
  try { payload = JSON.parse(raw.toString("utf8")); } catch { return res.status(400).json({ error: "invalid json" }); }

  const event = payload?.event_type;
  const HANDLED = new Set(["subscription.created", "subscription.updated", "subscription.canceled"]);
  if (!HANDLED.has(event)) return res.json({ ok: true, ignored: event || "unknown" });

  const data = payload?.data || {};
  const id = String(data.id ?? "");
  if (!id) return res.status(400).json({ error: "missing subscription id" });
  // Paddle subscription events don't always carry the email — take what exists.
  const custom = data.custom_data && typeof data.custom_data === "object" ? data.custom_data : {};
  const email = custom.email || custom.user_email || data.customer?.email || data.customer_email || null;
  upsertSubscriber({
    id,
    email,
    status: event === "subscription.canceled" ? "canceled" : data.status || "active",
    provider: "paddle",
  });
  console.log(`🏓 paddle ${event} → sub ${id} (${email || "no email"})`);
  res.json({ ok: true });
});

// ============================================================================
//  Regular routes (JSON body + static)
// ============================================================================
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

app.get("/api/config", (_req, res) => {
  const active = activeCount();
  const founders = Math.max(0, Math.min(FOUNDING_SEATS, FOUNDING_SEATS - active - leads.length));

  let provider = null;
  let checkoutUrl;
  if (LEMON_CHECKOUT_URL) {
    provider = "lemonsqueezy";
    checkoutUrl = LEMON_CHECKOUT_URL + (LEMON_CHECKOUT_URL.includes("?") ? "&" : "?") + "checkout[custom][source]=founding";
  } else if (PADDLE_CLIENT_TOKEN && PADDLE_PRICE_ID) {
    provider = "paddle";
  } else if (PAYMENT_LINK) {
    provider = "link";
    checkoutUrl = PAYMENT_LINK;
  }

  const out = { provider, founders, subscribers: active };
  if (checkoutUrl) out.checkoutUrl = checkoutUrl;
  if (provider === "paddle") out.paddle = { token: PADDLE_CLIENT_TOKEN, priceId: PADDLE_PRICE_ID, env: PADDLE_ENV };
  if (PAYMENT_LINK) out.paymentLink = PAYMENT_LINK; // legacy field, kept for old cached frontends
  res.json(out);
});

app.post("/api/waitlist", (req, res) => {
  const email = String((req.body || {}).email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return res.status(400).json({ error: "invalid email" });
  if (!leads.find((l) => l.email === email)) {
    leads.push({ email, at: new Date().toISOString() });
    saveLeads();
  }
  res.json({ ok: true, position: leads.findIndex((l) => l.email === email) + 1 });
});

// ---- Admin: full subscriber list (ADMIN_TOKEN via ?token= or X-Admin-Token) ---
app.get("/api/subscribers", (req, res) => {
  const token = req.query.token || req.get("X-Admin-Token");
  if (!ADMIN_TOKEN || !safeEqual(token, ADMIN_TOKEN))
    return res.status(403).json({ error: "forbidden" });
  res.json({ count: subscribers.length, active: activeCount(), subscribers });
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`🤵 NINE2FIVE landing su http://localhost:${PORT}`));

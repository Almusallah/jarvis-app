// ============================================================================
//  JARVIS landing — marketing + live demo + founding-member checkout.
//  Nessun segreto richiesto: se PAYMENT_LINK è settato (Stripe Payment Link),
//  il CTA porta lì; altrimenti raccoglie iscrizioni founding-member su file.
// ============================================================================
import express from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3400;
const PAYMENT_LINK = process.env.PAYMENT_LINK || null;

const DATA_DIR = join(__dirname, "data");
const LEADS = join(DATA_DIR, "leads.json");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
let leads = [];
if (existsSync(LEADS)) { try { leads = JSON.parse(readFileSync(LEADS, "utf8")); } catch { leads = []; } }

app.use(express.json());
app.use(express.static(join(__dirname, "public")));

app.get("/api/config", (_req, res) =>
  res.json({ paymentLink: PAYMENT_LINK, founders: 100 - Math.min(leads.length, 87) })
);

app.post("/api/waitlist", (req, res) => {
  const email = String((req.body || {}).email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return res.status(400).json({ error: "invalid email" });
  if (!leads.find((l) => l.email === email)) {
    leads.push({ email, at: new Date().toISOString() });
    writeFileSync(LEADS, JSON.stringify(leads, null, 2));
  }
  res.json({ ok: true, position: leads.findIndex((l) => l.email === email) + 1 });
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`🤵 JARVIS landing su http://localhost:${PORT}`));

// ============================================================================
//  NINE2FIVE landing — demo interattiva + i18n EN/IT + founding checkout.
// ============================================================================
const $ = (s, r = document) => r.querySelector(s);
let LANG = localStorage.getItem("n2f_lang") || "en";

const I18N = {
  nav_demo: { en: "Demo", it: "Demo" },
  nav_how: { en: "How it works", it: "Come funziona" },
  nav_pricing: { en: "Pricing", it: "Prezzo" },
  nav_cta: { en: "Get started — $10/mo", it: "Inizia — $10/mese" },
  hero_eyebrow: { en: "Founding release · limited to 100 seats", it: "Lancio founding · limitato a 100 posti" },
  hero_h1: { en: "Your inbox has a chief of staff now.", it: "La tua inbox ora ha un capo di gabinetto." },
  hero_p: {
    en: "NINE2FIVE connects to Gmail and Calendar — <b>read-only</b> — and every morning hands you an executive brief: what needs you today, who owes you a reply (and for how long), and reply drafts in your voice. You stay the only one who hits send.",
    it: "NINE2FIVE si collega a Gmail e Calendar — in <b>sola lettura</b> — e ogni mattina ti consegna un brief esecutivo: cosa richiede te oggi, chi ti deve una risposta (e da quanto), e bozze di risposta con la tua voce. Solo tu premi invio.",
  },
  hero_cta1: { en: "Start for $10/month", it: "Inizia a $10/mese" },
  hero_cta2: { en: "See a live brief", it: "Guarda un brief dal vivo" },
  trust1: { en: "🔒 Read-only scopes", it: "🔒 Permessi in sola lettura" },
  trust2: { en: "✍️ Drafts only — never sends", it: "✍️ Solo bozze — non invia mai" },
  trust3: { en: "🗑️ No email bodies stored", it: "🗑️ Nessuna email archiviata" },
  hc_title: { en: "Morning brief — Thu 3 Jul", it: "Brief del mattino — gio 3 lug" },
  hc_sum: { en: "3 things need you today. Two people owe you replies — one is 6 days old. Your 14:00 moved.", it: "3 cose richiedono te oggi. Due persone ti devono risposte — una da 6 giorni. Il tuo appuntamento delle 14:00 è stato spostato." },
  hc_i1: { en: "Vendor contract: legal flagged clause 7 — reply drafted, needs your call on the cap.", it: "Contratto fornitore: il legale segnala la clausola 7 — bozza pronta, serve la tua decisione sul tetto." },
  hc_i2: { en: "Board deck v3 due tomorrow — Sara asked for your numbers by 17:00.", it: "Deck per il board v3 entro domani — Sara chiede i tuoi numeri entro le 17:00." },
  hc_i3: { en: "Ahmed — proposal sent Jun 27, still no answer. Nudge drafted.", it: "Ahmed — proposta inviata il 27 giu, ancora nessuna risposta. Sollecito in bozza." },
  hc_i4: { en: "14:00 sync moved to 15:30 (Fatima). No action.", it: "Sync delle 14:00 spostato alle 15:30 (Fatima). Nessuna azione." },
  s1b: { en: "8 min", it: "8 min" },
  s1s: { en: "average morning read", it: "lettura media al mattino" },
  s2b: { en: "0", it: "0" },
  s2s: { en: "emails sent without you", it: "email inviate senza di te" },
  s3b: { en: "100%", it: "100%" },
  s3s: { en: "waiting-items carried forward until resolved", it: "promemoria mantenuti finché risolti" },
  demo_kicker: { en: "Live demo", it: "Demo dal vivo" },
  demo_h2: { en: "This is what tomorrow morning looks like", it: "Ecco come sarà domani mattina" },
  demo_p: { en: "A real brief, generated from a sample inbox. Click around — the drafts too.", it: "Un brief reale, generato da una inbox di esempio. Esplora — anche le bozze." },
  tab_act: { en: "Needs you", it: "Richiede te" },
  tab_wait: { en: "Waiting on others", it: "In attesa di altri" },
  tab_fyi: { en: "FYI", it: "Per conoscenza" },
  how_kicker: { en: "How it works", it: "Come funziona" },
  how_h2: { en: "One consent. One brief. Zero risk.", it: "Un consenso. Un brief. Zero rischi." },
  how1_t: { en: "Connect Google", it: "Collega Google" },
  how1_p: { en: "One sign-in grants read-only access to Gmail and Calendar. NINE2FIVE can never send, delete or modify anything.", it: "Un solo accesso concede la lettura di Gmail e Calendar. NINE2FIVE non può inviare, cancellare o modificare nulla." },
  how2_t: { en: "Wake up to the brief", it: "Svegliati col brief" },
  how2_p: { en: "Every morning: what needs you, who owes you a reply (with aging — a waiting item never disappears until resolved), what changed in your calendar.", it: "Ogni mattina: cosa richiede te, chi ti deve una risposta (con anzianità — un'attesa non sparisce finché non si risolve), cosa è cambiato in agenda." },
  how3_t: { en: "Approve the drafts", it: "Approva le bozze" },
  how3_p: { en: "Replies come pre-written in your voice. Copy, tweak, send from your own Gmail. You stay the only sender.", it: "Le risposte arrivano già scritte con la tua voce. Copia, ritocca, invia dal tuo Gmail. Il mittente resti tu." },
  pr_kicker: { en: "Founding price", it: "Prezzo founding" },
  pr_h2: { en: "$10/month. Locked forever for the first 100.", it: "$10/mese. Bloccato per sempre per i primi 100." },
  pr_p: { en: "Then $19/month. Cancel anytime, your data deleted on request.", it: "Poi $19/mese. Disdici quando vuoi, dati cancellati su richiesta." },
  pc_mo: { en: "/month", it: "/mese" },
  pc_f1: { en: "✓ Daily executive brief (email + calendar)", it: "✓ Brief esecutivo quotidiano (email + calendario)" },
  pc_f2: { en: "✓ Who-owes-you tracking with carry-forward", it: "✓ Tracciamento di chi ti deve risposte, con riporto" },
  pc_f3: { en: "✓ Reply drafts in your voice", it: "✓ Bozze di risposta con la tua voce" },
  pc_f4: { en: "✓ Read-only, drafts-only, no bodies stored", it: "✓ Sola lettura, solo bozze, nessuna email archiviata" },
  pc_f5: { en: "✓ Founding price locked for life", it: "✓ Prezzo founding bloccato a vita" },
  pc_ph: { en: "you@company.com", it: "tu@azienda.it" },
  pc_btn: { en: "Claim founding seat", it: "Prendi il posto founding" },
  pc_pay: { en: "Subscribe — $10/month", it: "Abbonati — $10/mese" },
  seats: { en: "{n} founding seats left at $10/mo", it: "{n} posti founding rimasti a $10/mese" },
  ok_msg: { en: "🎉 You're in — founding seat #{p} reserved. We'll email your activation link today.", it: "🎉 Ci sei — posto founding n.{p} riservato. Ti mandiamo il link di attivazione oggi." },
  g_kicker: { en: "Trust", it: "Fiducia" },
  g_h2: { en: "Built paranoid, on purpose", it: "Costruito paranoico, di proposito" },
  g1_t: { en: "Read-only scopes", it: "Permessi in sola lettura" },
  g1_p: { en: "The Gmail send scope does not exist anywhere in the codebase. It cannot send even by bug.", it: "Il permesso di invio Gmail non esiste in nessun punto del codice. Non può inviare nemmeno per errore." },
  g2_t: { en: "Derived data only", it: "Solo dati derivati" },
  g2_p: { en: "Raw email bodies are never stored — only the brief items derived from them. Tokens encrypted at rest.", it: "I testi delle email non vengono mai archiviati — solo le voci del brief che ne derivano. Token cifrati a riposo." },
  g3_t: { en: "Your voice, your send", it: "La tua voce, il tuo invio" },
  g3_p: { en: "Drafts are rendered in the app. Nothing is written to your Gmail, not even as a draft.", it: "Le bozze vivono nell'app. Nulla viene scritto nel tuo Gmail, nemmeno come bozza." },
  foot_proto: { en: "working prototype · payments handled via Stripe", it: "prototipo funzionante · pagamenti gestiti via Stripe" },
};
const T = (k, vars) => {
  let s = (I18N[k] || {})[LANG] || (I18N[k] || {}).en || k;
  if (vars) for (const [key, v] of Object.entries(vars)) s = s.replace(`{${key}}`, v);
  return s;
};

// ---- Demo data --------------------------------------------------------------
const DEMO = {
  act: [
    { t: { en: "Vendor contract — clause 7", it: "Contratto fornitore — clausola 7" }, m: "legal@ · 09:12", p: { en: "Legal flagged the liability cap in clause 7. Your call: accept the €50k cap or push for €100k.", it: "Il legale segnala il tetto di responsabilità nella clausola 7. Decidi tu: accettare il tetto a €50k o chiedere €100k." }, d: { en: "Hi Marta,\n\nThanks for the sharp eyes on clause 7. Let's counter at a €100k cap — we carry the delivery risk on this one and 50 doesn't cover a single incident.\n\nIf they push back, I can live with 75 as a floor.\n\nY", it: "Ciao Marta,\n\ngrazie per l'occhio sulla clausola 7. Controproponiamo un tetto a €100k — il rischio di consegna è nostro e 50 non copre nemmeno un incidente.\n\nSe resistono, 75 può essere il minimo accettabile.\n\nY" } },
    { t: { en: "Board deck v3 — your numbers", it: "Deck board v3 — i tuoi numeri" }, m: "sara@ · 08:41", p: { en: "Sara needs your Q2 pipeline numbers by 17:00 to close the deck for tomorrow's board.", it: "Sara ha bisogno dei numeri pipeline Q2 entro le 17:00 per chiudere il deck del board di domani." }, d: { en: "Sara — numbers below, deck-ready:\n\n· Pipeline Q2: $412k weighted ($680k gross)\n· Closed: $118k (+22% QoQ)\n· At risk: the Almasa renewal, decision Friday\n\nShout if you want these as slides.\n\nY", it: "Sara — numeri qui sotto, pronti per il deck:\n\n· Pipeline Q2: $412k ponderato ($680k lordo)\n· Chiuso: $118k (+22% sul trimestre)\n· A rischio: il rinnovo Almasa, decisione venerdì\n\nDimmi se li vuoi già come slide.\n\nY" } },
    { t: { en: "Visa letter for Hanoi trip", it: "Lettera visto per il viaggio a Hanoi" }, m: "hr@ · yesterday", p: { en: "HR needs your passport scan today to issue the invitation letter in time.", it: "HR ha bisogno della scansione del passaporto oggi per emettere la lettera d'invito in tempo." }, d: { en: "Hi Lin,\n\nPassport scan attached. Travel window is Aug 18–26; billing to the APAC cost centre as last time.\n\nThanks for the fast turnaround.\n\nY", it: "Ciao Lin,\n\nscansione del passaporto in allegato. Finestra di viaggio 18–26 agosto; fatturazione sul centro di costo APAC come l'ultima volta.\n\nGrazie per la rapidità.\n\nY" } },
  ],
  wait: [
    { t: { en: "Ahmed — proposal follow-up", it: "Ahmed — follow-up proposta" }, m: "ahmed@ · sent Jun 27", age: "6d", p: { en: "You sent the fit-out proposal on Jun 27. No reply. Third business day past his own deadline.", it: "Hai inviato la proposta di allestimento il 27 giu. Nessuna risposta. Terzo giorno lavorativo oltre la sua stessa scadenza." }, d: { en: "Ahmed — quick nudge on the fit-out proposal from Jun 27. We're holding the production slot until Thursday; after that the timeline shifts by two weeks.\n\nWant a 15-min call to close the open points?\n\nY", it: "Ahmed — un promemoria veloce sulla proposta del 27 giu. Teniamo lo slot di produzione fino a giovedì; dopo, la timeline slitta di due settimane.\n\nFacciamo 15 minuti di call per chiudere i punti aperti?\n\nY" } },
    { t: { en: "Print supplier — samples", it: "Tipografia — campioni" }, m: "print@ · sent Jun 30", age: "3d", p: { en: "Waiting on the paper samples they promised “within 48h”.", it: "In attesa dei campioni carta promessi “entro 48 ore”." }, d: { en: "Hi — following up on the samples promised for Jul 1. If they shipped, could you share the tracking? We select stock this week.\n\nY", it: "Salve — un sollecito sui campioni promessi per il 1° luglio. Se sono partiti, potete girarmi il tracking? Selezioniamo la carta questa settimana.\n\nY" } },
  ],
  fyi: [
    { t: { en: "14:00 sync moved to 15:30", it: "Sync delle 14:00 spostato alle 15:30" }, m: "fatima@ · calendar", p: { en: "Fatima moved today's sync. No conflicts created.", it: "Fatima ha spostato il sync di oggi. Nessun conflitto creato." } },
    { t: { en: "Invoice #2214 paid", it: "Fattura n. 2214 pagata" }, m: "billing@ · 07:58", p: { en: "The €12,400 invoice cleared. Nothing to do.", it: "La fattura da €12.400 è stata saldata. Niente da fare." } },
  ],
};

let tab = "act";
function renderDemo() {
  const items = DEMO[tab];
  $("#daMain").innerHTML = items.map((it, i) => `
    <div class="da-item">
      <h4>${it.t[LANG] || it.t.en} ${it.age ? `<span class="age">⏳ ${it.age}</span>` : ""}</h4>
      <div class="meta">${it.m}</div>
      <p>${it.p[LANG] || it.p.en}</p>
      ${it.d ? `<button class="btn-draft" data-d="${i}">${LANG === "it" ? "✍️ Vedi bozza" : "✍️ View draft"}</button>
      <div class="draft-box" id="draft-${i}">${(it.d[LANG] || it.d.en)}</div>` : ""}
    </div>`).join("");
  $("#daMain").querySelectorAll("[data-d]").forEach((b) =>
    b.addEventListener("click", () => $("#draft-" + b.dataset.d).classList.toggle("open"))
  );
  $("#nAct").textContent = DEMO.act.length;
  $("#nWait").textContent = DEMO.wait.length;
  $("#nFyi").textContent = DEMO.fyi.length;
}

function applyI18n() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach((el) => { const k = el.dataset.i18n; if (I18N[k]) el.innerHTML = T(k); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { const k = el.dataset.i18nPh; if (I18N[k]) el.placeholder = T(k); });
  $("#langBtn").textContent = LANG === "en" ? "IT" : "EN";
}

async function initCta() {
  const cfg = await fetch("/api/config").then((r) => r.json()).catch(() => ({}));
  if (cfg.paymentLink) {
    $("#ctaArea").innerHTML = `<a class="btn solid big" style="background:var(--oro);color:var(--ink);width:100%" href="${cfg.paymentLink}">${T("pc_pay")}</a>
      <div class="pc-note" id="seatsNote"></div>`;
  }
  const n = cfg.founders ?? 13;
  const note = $("#seatsNote");
  if (note) note.textContent = T("seats", { n });
}

function wire() {
  $("#langBtn").addEventListener("click", () => {
    LANG = LANG === "en" ? "it" : "en";
    localStorage.setItem("n2f_lang", LANG);
    applyI18n(); renderDemo(); initCta();
  });
  document.querySelectorAll(".da-tab").forEach((t2) =>
    t2.addEventListener("click", () => {
      document.querySelectorAll(".da-tab").forEach((x) => x.classList.remove("active"));
      t2.classList.add("active");
      tab = t2.dataset.tab;
      renderDemo();
    })
  );
  const form = $("#waitForm");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#waitEmail").value.trim();
    const r = await fetch("/api/waitlist", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then((x) => x.json()).catch(() => ({}));
    if (r.ok) {
      $("#ctaArea").innerHTML = `<div class="pc-ok">${T("ok_msg", { p: r.position })}</div>`;
    }
  });
}

applyI18n(); renderDemo(); initCta(); wire();

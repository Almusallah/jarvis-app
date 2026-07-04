# NINE2FIVE — Payments go-live (Merchant of Record)

The landing supports two Merchant-of-Record providers, driven purely by env vars.
**No env vars set → the waitlist keeps working as today.** Provider precedence in
`/api/config`: Lemon Squeezy → Paddle → `PAYMENT_LINK` (legacy) → waitlist.

- **Render service**: `jarvis-app` (`srv-d93run4vikkc73avkor0`)
- **Live URL**: https://jarvis-app-pzfc.onrender.com
- **Webhook endpoints** (already implemented, signature-verified):
  - `POST /webhooks/lemonsqueezy`
  - `POST /webhooks/paddle`

> ⚠️ **`data/` is ephemeral on Render free tier.** Every deploy/restart wipes
> `data/subscribers.json` and `data/leads.json`. `subscribers.json` is only a
> local cache used for the live founders counter — the **Lemon Squeezy / Paddle
> dashboard is the source of truth** for who is subscribed. Export leads
> periodically if they matter.

---

## Option A — Lemon Squeezy (recommended)

Lemon Squeezy is the fastest MoR to set up: they are the seller of record,
handle VAT/sales tax globally, and pay out to your bank. Fees ~5% + $0.50.

### 1. Create the store
1. Go to https://app.lemonsqueezy.com/register and sign up (use frassiyuri@gmail.com).
2. Complete the store setup wizard: store name **NINE2FIVE**, currency **USD**.
   You start in **Test mode** (orange banner) — perfect, do everything below in
   test mode first.
3. (Payouts, later) Settings → Payouts → connect your bank. Required before
   activating live mode, not for testing.

### 2. Create the product ($10/mo subscription)
1. Left sidebar → **Store** → **Products** → **+ New product**.
2. Name: **NINE2FIVE Founding**.
3. Description: e.g. "Founding member — daily executive brief. $10/mo locked for life."
4. Pricing: select **Subscription**, price **$10.00**, billed **Monthly**.
5. Click **Publish product**.

### 3. Get the checkout link
1. On the product page click **Share** (or the "…" menu → Share).
2. Copy the **checkout URL** — it looks like
   `https://YOURSTORE.lemonsqueezy.com/buy/xxxxxxxx-xxxx-...`.
   This is your `LEMON_CHECKOUT_URL`. (The app automatically appends
   `?checkout[custom][source]=founding` so orders are tagged.)
3. **Set the post-purchase redirect** so buyers land back on the site:
   product → Edit → **Confirmation modal** → "Redirect after purchase" →
   `https://jarvis-app-pzfc.onrender.com/?welcome=1`
   (this triggers the "You're a founding member" banner).

### 4. Create the webhook
1. Left sidebar → **Settings** → **Webhooks** → **+**.
2. Callback URL: `https://jarvis-app-pzfc.onrender.com/webhooks/lemonsqueezy`
3. Signing secret: generate a long random string (e.g. run
   `openssl rand -hex 32` locally) and paste it. This is your `LEMON_WEBHOOK_SECRET`.
4. Tick these events:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
5. Save.

### 5. Set env vars on Render
Render dashboard → service **jarvis-app** (`srv-d93run4vikkc73avkor0`) →
**Environment** → add:

| Key | Value |
|---|---|
| `LEMON_CHECKOUT_URL` | the checkout URL from step 3 |
| `LEMON_WEBHOOK_SECRET` | the signing secret from step 4 |
| `ADMIN_TOKEN` | any long random string (protects `/api/subscribers`) |

Save → Render redeploys automatically.

### 6. Test-mode end-to-end flow
1. Keep the Lemon store in **Test mode**.
2. Open https://jarvis-app-pzfc.onrender.com — the pricing CTA should now read
   **"Subscribe — $10/month"** and open the Lemon checkout.
3. Pay with the test card **4242 4242 4242 4242**, any future expiry, any CVC.
4. After payment you're redirected to `/?welcome=1` → green success banner.
5. Verify the webhook landed:
   `curl "https://jarvis-app-pzfc.onrender.com/api/subscribers?token=YOUR_ADMIN_TOKEN"`
   → the test subscription appears with `status: "active"`.
6. `curl https://jarvis-app-pzfc.onrender.com/api/config` → `subscribers: 1`
   and `founders` decremented.
7. In Lemon: Settings → Webhooks → your webhook → check deliveries are `200`.
8. When happy: toggle the store to **Live mode**, create the product + webhook
   again in live mode (test data does not carry over), and update the two env
   vars with the LIVE checkout URL and LIVE webhook secret.

---

## Option B — Paddle Billing (alternative)

Paddle is also a full MoR (fees ~5% + $0.50) but the account approval includes
a website review — the landing must show terms/refund policy, so approval can
take a few days. Sandbox works immediately without approval.

### 1. Create accounts
1. **Sandbox** (instant): https://sandbox-login.paddle.com/signup
2. **Production** (needs website verification): https://login.paddle.com/signup
   — submit https://jarvis-app-pzfc.onrender.com for domain approval under
   **Checkout → Website approval**.

### 2. Create product + price
1. Paddle dashboard → **Catalog** → **Products** → **+ New product**.
2. Name: **NINE2FIVE Founding**, tax category "Standard digital goods". Save.
3. On the product → **Prices** → **+ New price**: **$10.00 USD**, billing
   period **Monthly**, quantity 1. Save.
4. Copy the **Price ID** (`pri_...`) — this is `PADDLE_PRICE_ID`.

### 3. Get the client-side token
1. **Developer tools** → **Authentication** → **Client-side tokens** →
   **+ New client-side token**, name "landing".
2. Copy the token (`test_...` in sandbox, `live_...` in production) —
   this is `PADDLE_CLIENT_TOKEN`.

### 4. Create the webhook (notification destination)
1. **Developer tools** → **Notifications** → **+ New destination**.
2. Type: **Webhook**. URL: `https://jarvis-app-pzfc.onrender.com/webhooks/paddle`
3. Select events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
4. Save, then open the destination and copy the **secret key** (`pdl_ntfset_...`)
   — this is `PADDLE_WEBHOOK_SECRET`.

### 5. Set env vars on Render (service jarvis-app)

| Key | Value |
|---|---|
| `PADDLE_CLIENT_TOKEN` | client-side token from step 3 |
| `PADDLE_PRICE_ID` | `pri_...` from step 2 |
| `PADDLE_ENV` | `sandbox` (switch to `production` at go-live) |
| `PADDLE_WEBHOOK_SECRET` | secret from step 4 |
| `ADMIN_TOKEN` | any long random string |

> Make sure no `LEMON_*` vars are set, otherwise Lemon takes precedence.

### 6. Test flow (sandbox)
1. Open the site → CTA opens the Paddle overlay checkout.
2. Test card **4242 4242 4242 4242**, any future expiry, CVC `100`.
3. On success the overlay redirects to `/?welcome=1` → success banner.
4. Check `/api/subscribers?token=...` and `/api/config` as in the Lemon flow.
5. Go-live: repeat product/price/token/webhook in the **production** dashboard,
   set `PADDLE_ENV=production` and swap the three other values.

---

## Reference — what the server does

| Route | Behaviour |
|---|---|
| `GET /api/config` | `{ provider, checkoutUrl?, paddle?: {token,priceId,env}, founders, subscribers }`. `founders = 100 − active subscribers − waitlist leads` (floored at 0, capped at 100). |
| `POST /api/waitlist` | unchanged — fallback when no provider configured. |
| `POST /webhooks/lemonsqueezy` | verifies `X-Signature` (HMAC-SHA256 hex of raw body, constant-time compare), upserts `data/subscribers.json`. Bad signature → 401. |
| `POST /webhooks/paddle` | verifies `Paddle-Signature` (`ts=…;h1=…`, `h1 = HMAC(ts:rawBody)`), rejects timestamps older than 15 min. Bad signature/stale → 401. |
| `GET /api/subscribers` | full cached list; requires `?token=` or `X-Admin-Token` matching `ADMIN_TOKEN`, else 403. |

Active statuses counted for the founders counter: `active`, `on_trial`, `trialing`.
Cancelled/expired subscriptions stay in the file for audit but stop counting.

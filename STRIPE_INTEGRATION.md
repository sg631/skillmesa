# Stripe Connect Integration — Implementation Plan

> **Status: Not yet implemented.** This document describes the intended design. No payment code exists in the codebase yet.

Skillmesa will use **Stripe Connect Express** so service providers receive payments directly, with no monthly platform fee.

---

## How It Works

1. A seller connects their Stripe account via **Settings → Payments**.
2. Stripe hosts the onboarding (identity verification, bank details) — Skillmesa never handles sensitive financial data.
3. A buyer clicks **Purchase** on a listing → is redirected to a Stripe-hosted Checkout page.
4. On successful payment, Stripe fires a webhook → Skillmesa auto-enrolls the buyer.
5. Funds land in the seller's Stripe account (minus Stripe fees).

---

## Fees

| Fee | Amount |
|---|---|
| Stripe processing | 2.9% + 30¢ per charge |
| Connect transfer | 0.25% + 25¢ per transfer |
| **Total per transaction** | **~3.15% + 55¢** |

**Platform fee:** Configurable via `PLATFORM_FEE_BPS` in `functions/index.js` (basis points). Default is `0` (Skillmesa takes no cut).

---

## Setup Checklist

### 1. Stripe Dashboard
- Create a Stripe account at [stripe.com](https://stripe.com)
- Enable **Connect** → set platform name to "Skillmesa"
- In **Connect settings**, set the platform icon and brand color
- Under **Developers → API keys**, copy the **Secret key**

### 2. Set Firebase Secrets
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
# paste your Stripe secret key (sk_live_... or sk_test_... for testing)

firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# paste the webhook signing secret (see step 3)
```

### 3. Configure Webhook
After deploying functions:
- Stripe Dashboard → **Developers → Webhooks → Add endpoint**
- URL: `https://skillmesa.com/api/stripe/webhook`
- Events to listen for: `checkout.session.completed`
- Copy the **Signing secret** → `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`

### 4. Deploy
```bash
firebase deploy --only functions,hosting,firestore:rules
```

---

## Testing

Use Stripe test mode (`sk_test_...`) and test webhook signing secret.

| Test card | Result |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Card declined |

Any future expiry date, any CVC, any ZIP.

To test the full webhook locally, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to https://skillmesa.com/api/stripe/webhook
```

---

## Firestore Collections

### `payments/{stripeSessionId}`
Written by the `stripeWebhook` Cloud Function on `checkout.session.completed`.
```
listingId:             string
buyerUid:              string
sellerUid:             string
stripeSessionId:       string
stripePaymentIntentId: string
amount:                number  (cents)
platformFee:           number  (cents, 0 by default)
status:                "completed"
createdAt:             Timestamp
```

### `users/{uid}` — added fields
```
stripeConnectId:     string   (Stripe Express account ID, e.g. acct_xxx)
stripeAccountStatus: string   ("pending" | "active" | "disabled")
```

### `listings/{id}/enrollments/{buyerUid}` — added field on Stripe-created docs
```
grantedBy:        "stripe"
paymentSessionId: string
```

---

## Cloud Functions

| Function | Route | Purpose |
|---|---|---|
| `stripeConnectOnboard` | `POST /api/stripe/onboard` | Generate Stripe Express onboarding link |
| `stripeConnectStatus`  | `POST /api/stripe/status`  | Sync account status after onboarding return |
| `createCheckoutSession`| `POST /api/stripe/checkout`| Create Checkout session for a buyer |
| `stripeWebhook`        | `POST /api/stripe/webhook` | Receive Stripe events, auto-enroll buyer |

All routes require a Firebase `Authorization: Bearer <idToken>` header except `stripeWebhook`, which uses Stripe's signature verification instead.

---

## Adjusting the Platform Fee

To charge a 5% platform fee, edit `functions/index.js`:
```js
const PLATFORM_FEE_BPS = 500; // 500 basis points = 5%
```
Then redeploy functions. The fee is deducted from the seller's payout and held in the Skillmesa Stripe balance.

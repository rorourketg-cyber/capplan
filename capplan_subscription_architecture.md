# CapPlan — Subscription & Infrastructure Architecture

## Overview

This document scopes the technical infrastructure required to support
CapPlan Business and CapPlan Personal as subscription products sold
directly through capplan.online. It covers authentication, payment
processing, access control, and data persistence.

---

## 1. Product & Pricing Configuration

### CapPlan Business

| Plan     | Monthly | Annual (20% off) | Trial |
|----------|---------|------------------|-------|
| Starter  | $0      | $0               | —     |
| Full Suite | $37/mo | $444/yr ($37/mo) | 14 days |

Free tier includes: Solution Finder + Model 1 (Asset Purchase Analysis)

### CapPlan Personal

| Plan     | Monthly | Annual (20% off) | Trial |
|----------|---------|------------------|-------|
| Starter  | $0      | $0               | —     |
| Full Suite | $12/mo | $115/yr ($9.58/mo) | 14 days |

Free tier includes: Solution Finder + Model P1 (Should I Buy This?)

### Model Access Matrix

```
Suite        Model    Starter    Full Suite
─────────────────────────────────────────
Business     1        ✓          ✓
Business     2–13     ✗          ✓
Personal     P1       ✓          ✓
Personal     P2–P13   ✗          ✓
```

---

## 2. Technology Stack (assembled approach)

Assembling proven services is faster, more maintainable, and more
secure than building authentication and billing from scratch.

### Authentication — Auth0

**Why Auth0:** Handles email/password, social login (Google, Apple),
password reset, MFA, and JWT token management. Free tier covers
7,000 active users — sufficient for launch.

**Implementation:**
- Auth0 tenant configured for capplan.online
- Universal Login for sign-up / sign-in flows
- JWT tokens passed with every API request
- Refresh token rotation for persistent sessions

**User record stores:**
- email, name, suite (business | personal | both)
- plan (starter | full), billing_period (monthly | annual)
- trial_start, trial_end, subscription_status
- stripe_customer_id (link to billing system)

### Payments — Stripe

**Why Stripe:** Industry standard, PCI-compliant, handles
subscriptions, trials, proration, invoicing, and failed payment
recovery automatically.

**Stripe objects:**

```
Products:
  capplan_business_monthly   $37.00 / month
  capplan_business_annual    $444.00 / year
  capplan_personal_monthly   $12.00 / month
  capplan_personal_annual    $115.00 / year

Prices (linked to Products):
  Each product has one Price object with the corresponding amount

Customers:
  One Stripe Customer per registered user
  Linked via stripe_customer_id stored in Auth0 user metadata

Subscriptions:
  One Subscription per active paid plan
  Stores plan, status, current_period_end, trial_end
  Webhooks notify our system of status changes
```

**Stripe Checkout flow:**
1. User clicks "Start free trial" or "Upgrade"
2. Server creates a Stripe Checkout Session with trial period
3. User redirected to Stripe-hosted payment page
4. On success, webhook fires → update user record → redirect to app
5. On cancel, return to pricing page

**Stripe Customer Portal:**
- Stripe-hosted page for users to manage their subscription
- Cancel, upgrade, downgrade, update payment method
- Access via "Manage subscription" link in user account settings

**Webhooks to handle:**
```
customer.subscription.created     → activate access
customer.subscription.updated     → update plan/period
customer.subscription.deleted     → downgrade to free
customer.subscription.trial_will_end → send reminder email
invoice.payment_failed             → send retry email
invoice.payment_succeeded          → send receipt email
```

### Backend API — Serverless (Cloudflare Workers or Vercel Edge)

A thin API layer handles:
- Receiving Stripe webhooks and updating user records
- Serving model access decisions to the frontend
- Persisting saved analyses (future feature)

**Why serverless:** No servers to manage, scales to zero when unused,
low cost at launch volumes, deploys with the static site.

**Key endpoints:**

```
POST /api/stripe/webhook
  Receives Stripe events, updates user subscription state

GET  /api/user/access
  Returns { suite, plan, models_allowed[] } for authenticated user
  Called on app load to determine which models to unlock

POST /api/stripe/create-checkout
  Creates a Stripe Checkout Session for upgrade flow
  Returns { url } for redirect

POST /api/stripe/create-portal
  Creates a Stripe Customer Portal Session
  Returns { url } for redirect
```

### Database — PlanetScale (MySQL) or Supabase (PostgreSQL)

Stores user subscription state that the API reads for access decisions.

**users table:**
```sql
id                uuid PRIMARY KEY
auth0_id          varchar(128) UNIQUE NOT NULL
email             varchar(255) UNIQUE NOT NULL
stripe_customer_id varchar(64)
created_at        timestamp

-- Business subscription
bus_plan          enum('none','starter','full') DEFAULT 'none'
bus_billing       enum('monthly','annual')
bus_status        enum('active','trialing','past_due','canceled')
bus_trial_end     timestamp
bus_period_end    timestamp

-- Personal subscription
per_plan          enum('none','starter','full') DEFAULT 'none'
per_billing       enum('monthly','annual')
per_status        enum('active','trialing','past_due','canceled')
per_trial_end     timestamp
per_period_end    timestamp
```

At launch volume (hundreds of users), this database is trivially
small. Both PlanetScale and Supabase have generous free tiers.

### Hosting — Cloudflare Pages

**Why Cloudflare Pages:** Global CDN, free tier, deploys from Git,
integrates with Cloudflare Workers for the API layer, handles the
capplan.online domain.

**Deployment structure:**
```
capplan.online/               → capplan_landing.html
capplan.online/business/      → Business suite shell + solution finder
capplan.online/personal/      → Personal suite shell + solution finder
capplan.online/app/model-1/   → Model 1 PWA (free)
capplan.online/app/model-2/   → Model 2 PWA (gated)
...
capplan.online/account/       → Subscription management
```

---

## 3. Access Control Architecture

### Frontend gating pattern

Every paid model PWA checks access on load:

```javascript
async function checkAccess(modelId) {
  // 1. Get Auth0 token
  const token = await auth0Client.getTokenSilently();
  if (!token) { showLoginPrompt(); return; }

  // 2. Check model access
  const res = await fetch('/api/user/access', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { models_allowed } = await res.json();

  if (!models_allowed.includes(modelId)) {
    showUpgradePrompt(modelId);
    return;
  }

  // 3. Proceed to render model
  initModel();
}
```

### Upgrade prompt

When a free user tries to access a paid model, they see an inline
prompt within the model shell — not a jarring redirect. The prompt
shows what they get with the full suite and a direct link to the
checkout flow. The model UI is visible but blurred behind the prompt,
so the user understands what they're getting before paying.

### Free tier enforcement

Free tier users (Starter) have access to:
- The solution finder on their branch
- Model 1 (Business) or Model P1 (Personal)
- All features within those models (no artificial limitations)

The free tier is genuinely useful. This is intentional — a
crippled free tier erodes trust. The upgrade incentive is access
to more models, not better functionality within a model.

---

## 4. Email Infrastructure — Resend

Transactional emails triggered by subscription events:

| Trigger | Email |
|---------|-------|
| Registration | Welcome + getting started guide |
| Trial started | What's included, how to get most value |
| Trial ending (3 days out) | Reminder with one-click upgrade |
| Payment succeeded | Receipt + link to invoice |
| Payment failed | Clear instructions to update payment method |
| Subscription cancelled | Confirmation + resubscribe link |

All emails plain-text with minimal HTML — consistent with the
product's analytical, no-nonsense character. No marketing emails
without explicit opt-in.

---

## 5. Launch Checklist

### Pre-launch (technical)

- [ ] Auth0 tenant configured, Universal Login styled to match CapPlan
- [ ] Stripe products, prices, and webhook endpoints configured
- [ ] Database schema deployed
- [ ] API endpoints deployed and tested end-to-end
- [ ] Cloudflare Pages deployment configured
- [ ] capplan.online domain pointed to Cloudflare
- [ ] SSL certificate active
- [ ] All 13 Business PWAs deployed and access-gated
- [ ] Model 1 confirmed accessible on free tier
- [ ] Stripe test mode checkout flow verified
- [ ] Stripe live mode activated

### Pre-launch (operational)

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Refund policy defined (suggested: pro-rata refund within 30 days)
- [ ] Support email configured (support@capplan.online)
- [ ] Stripe tax settings configured for applicable jurisdictions

### Post-launch monitoring

- Stripe dashboard for subscription metrics
- Auth0 dashboard for user growth and login failures
- Cloudflare analytics for traffic and geographic distribution
- Database query performance as user count grows

---

## 6. Future Considerations (not for launch)

**Saved analyses:** Let users save and return to prior analyses.
Requires a `analyses` table linked to `users`. Low complexity once
the database is in place.

**Team/firm subscriptions:** Multiple seats under one billing account.
Requires an `organisations` table and invitation flow. Stripe supports
per-seat pricing natively.

**Accounting software integrations:** Xero, QuickBooks API connections
to pull asset data directly into models. High value for business users,
significant development effort. Post-track-record priority.

**Personal finance platform integrations:** Mint, YNAB, Monarch Money
connections for consumer asset data. Similar priority.

**Usage analytics:** Understanding which models are most used, where
users drop off, and which additional assistance features are most
valuable. Privacy-respecting analytics (Plausible or Fathom, not
Google Analytics) from day one.

---

## 7. Cost Estimate at Launch

| Service | Plan | Monthly cost |
|---------|------|-------------|
| Auth0 | Free (≤7k MAU) | $0 |
| Stripe | Pay as you go | 2.9% + 30¢ per transaction |
| Cloudflare Pages + Workers | Free tier | $0 |
| PlanetScale / Supabase | Free tier | $0 |
| Resend | Free (3k emails/mo) | $0 |
| capplan.online domain | Annual | ~$1.50/mo |
| **Total infrastructure** | | **~$1.50/mo + Stripe fees** |

At 100 Business full suite subscribers ($37/mo):
- Revenue: $3,700/mo
- Stripe fees: ~$110/mo
- Infrastructure: ~$2/mo
- Net before business costs: ~$3,588/mo

The unit economics are excellent. Infrastructure costs remain
negligible until well past initial scale — Cloudflare Pages and
Workers scale automatically, and database costs only become
meaningful beyond tens of thousands of active users.


# CapPlan — Project Reference

## What CapPlan Is
Capital budgeting decision-support tool with two streams:
- **Business** — 13 models for business capital planning decisions
- **Personal** — 9 models for personal financial decisions

Creator: Bob (contact via reply-to on emails; email address is private — never expose to external services without explicit approval)

---

## Tech Stack

| Layer | Service | Purpose |
|---|---|---|
| Hosting | Cloudflare Pages | Auto-deploys from GitHub on push |
| Source control | GitHub | Single repo for all HTML/assets |
| Auth | Auth0 | Triggers only when user opens an individual model |
| Database | Supabase | User/subscription state |
| Email | Resend | Transactional email delivery |

**Architecture:** Thick client — no proprietary server. All logic runs client-side or through managed services. No client data held on Bob's own servers.

---

## Deployment Pattern
- Push to GitHub → Cloudflare auto-deploys
- Index pages: **fully public** (no auth wall)
- Individual models: Auth0 triggers on open (Option C architecture)

---

## Brand

| Element | Business | Personal |
|---|---|---|
| Primary colour | Navy `#1B3F6E` | Teal/green `#2E7D52` |
| Background | `#ffffff` | `#ffffff` |
| Heading font | Playfair Display | Playfair Display |
| Body font | Inter | Inter |

---

## Pricing (confirmed correct)

| Stream | Monthly | Annual (÷12) | Annual rate |
|---|---|---|---|
| Business | $37/month | $30/month | $360/year |
| Personal | $12/month | $10/month | $120/year |

**Trial incentive prices — email delivery only, never on public pages:**
- Business: $179/year first year, renews at $360/year
- Personal: $52/year first year, renews at $120/year

**Bundle (Business subscribers only):** Add Personal for $97/year

---

## Trial Structure
- 2-week free trial, no credit card required
- All models open during trial (13 Business, 9 Personal)
- Expiry without payment → gates all models except model 1
- Model 1 is free permanently for both streams

---

## Email Sequence (both streams, 4 emails each — sent via Resend)

| # | Trigger | Theme |
|---|---|---|
| Email 1 | Day 0 | Welcome / trial started |
| Email 2 | Day 7 | Mid-trial offer |
| Email 3 | Day 12 | Urgency — 2 days left |
| Email 4 | Day 14 | Trial ended / restore access |

---

## Security Rules — CRITICAL

> These rules must never be violated in any user-facing output.

1. **Internal model IDs must never appear in public-facing text.** IDs such as UM1, UM2, P1, P2, model1, model2, personal1, personal9 are internal numbering only. Use model names and taglines only.
2. **Creator email is private.** Never pass to external services or expose in any page, script, or log without explicit approval.

---

## Video Inventory

| Type | Status | Placement |
|---|---|---|
| Business headline | Produced | Landing page + Business index |
| Personal headline | Produced | Landing page + Personal index |
| Individual model videos (Synthesia) | Produced | Inventory — no current placement |
| Personal instruction (how-to) | Needs rescripting | TBD |

- No Business model instruction videos planned
- Solution finders are UI-only (not in marketing videos or landing page)

---

## Website Structure

| Page | Auth | Notes |
|---|---|---|
| Landing page | Public | Simplified sign-up, 2 headline video slots |
| Business index | Public | Model listing, 1 video slot |
| Personal index | Public | Model listing, 1 video slot |
| Individual models | Auth0 | Triggers on open |

---

## Key Decisions

- Pricing: Option A confirmed (index page rates are correct; email incentives are deep discounts off those rates)
- Trial: 2 weeks, all models open, gates to model 1 on expiry
- Solution finders: part of the UI alongside model list — not in marketing
- Index pages fully public (Option C)
- No Business model instruction videos
- Personal instruction videos need rescripting (how-to focus, not yet done)

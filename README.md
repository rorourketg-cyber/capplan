# CapPlan

A suite of Progressive Web App financial planning tools for business and personal capital planning decisions.

## Structure

### Personal Models
- `capplan_personal_finder.html` — Solution Finder router
- `capplan_personal1.html` — Should I Buy This? (free tier)
- `capplan_personal2.html` — Which Option Should I Buy?
- `capplan_personal3.html` — Should I Replace What I Own?
- `capplan_personal4.html` — Which Replacement Is Best?
- `capplan_personal5.html` — When Should I Replace It?
- `capplan_personal9.html` — Lease or Buy?
- `capplan_personal11.html` — What Is This Lease Costing Me?
- `capplan_personal12.html` — What's the Least I Should Accept?
- `capplan_personal13.html` — What's the Most I Should Pay?

### Non-US Business Models (1–13)
Standard depreciation methods. See `capplan_v3.html` through `capplan_model13.html`.

### US Business Models (1–13)
MACRS depreciation, OBBBA bonus depreciation, Section 179.
See `capplan_us_model1.html` through `capplan_us_model13.html`.

### Supporting Files
- `capplan_macrs_data.js` — MACRS property class data and schedule generator
- `capplan_landing.html` — Landing page
- `capplan_subscription_architecture.md` — Technical architecture document

## Technology
Pure HTML/CSS/JavaScript PWA. No build step. No dependencies. All calculation logic runs in the browser.

## Status
Under active development. Subscription infrastructure, PWA manifest, and service worker pending.

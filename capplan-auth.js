/**
 * capplan-auth.js  —  CapPlan auth + access-control library
 *
 * Usage on each model page:
 *   <script src="../capplan-auth.js"></script>  (or ../../capplan-auth.js)
 *   <script>
 *     CapPlanAuth.init('personal1');   // free model — renders immediately
 *     render();
 *   </script>
 */

const CapPlanAuth = (() => {

  // ── Config ────────────────────────────────────────────────────────────────
  const AUTH0_DOMAIN    = 'dev-7g0nuvl1fuufbeyn.us.auth0.com';
  const AUTH0_CLIENT_ID = 'zNrADr5Yz57Tg9tVKH7lcN5YtPguyIuR';
  const STRIPE_PUB_KEY  = 'pk_test_51UKfwkPnu63aqS4gaT5ynA4PKp4xWsZIPFS5adtJOfote9HxFarTdDT18TiE45oHI9Luyx3PbVdYiU3VofMUK4NV00l8zFGQn2';
  const CHECKOUT_WORKER = 'https://patient-base-51d4.rorourketg.workers.dev';

  // Free model IDs — these pass through immediately without auth check
  const FREE_MODELS = ['personal1', 'model1', 'us_model1', 'P1', 'UM1', 'M1'];

  // Suite membership
  const SUITE_MODELS = {
    personal:     ['personal1','personal2','personal3','personal4','personal5',
                   'personal9','personal11','personal12','personal13'],
    business_us:  ['model1','model2','model3','model4','model5','model6','model7',
                   'model8','model9','model10','model11','model12','model13'],
    business_intl:['model1','model2','model3','model4','model5','model6','model7',
                   'model8','model9','model10','model11','model12','model13'],
  };

  // Pricing labels for upgrade overlay
  const SUITE_META = {
    personal:      { name: 'Personal',                    price: '$12/month' },
    business_us:   { name: 'Business — US Edition',       price: '$37/month' },
    business_intl: { name: 'Business — International',    price: '$37/month' },
  };

  // ── Auth0 client (lazy) ───────────────────────────────────────────────────
  let _client = null;

  function loadAuth0SDK() {
    return new Promise((resolve, reject) => {
      if (window.auth0) return resolve();
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@auth0/auth0-spa-js@2.0.3/dist/auth0-spa-js.production.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function getClient() {
    if (_client) return _client;
    await loadAuth0SDK();
    _client = await window.auth0.createAuth0Client({
      domain:   AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: window.location.origin + window.location.pathname,
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
    });
    return _client;
  }

  // ── Determine which suite a model belongs to ──────────────────────────────
  function suiteForModel(modelId) {
    // Personal models start with 'personal'
    if (modelId.startsWith('personal') || modelId === 'P1') return 'personal';
    // US models: we're in business/us/ so modelId is 'model1' etc.
    // International: same filename pattern — we detect by page URL
    if (window.location.pathname.includes('/us/')) return 'business_us';
    if (window.location.pathname.includes('/international/')) return 'business_intl';
    return 'business_us'; // fallback
  }

  // ── Overlays ──────────────────────────────────────────────────────────────
  function showLoginPrompt() {
    document.body.style.overflow = 'hidden';
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999';
    el.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:40px 36px;max-width:400px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,.2);text-align:center">
        <div style="font-size:2rem;margin-bottom:12px">🔐</div>
        <h2 style="margin:0 0 10px;font-size:1.25rem;color:#111">Sign in to CapPlan</h2>
        <p style="margin:0 0 24px;color:#555;line-height:1.6">Create a free account or sign in to use this model.</p>
        <button onclick="CapPlanAuth.login()"
          style="background:#1B3F6E;color:#fff;border:none;border-radius:8px;padding:13px 32px;font-size:1rem;cursor:pointer;width:100%;margin-bottom:10px">
          Sign in / Create account
        </button>
        <a href="/" style="color:#888;font-size:.875rem;text-decoration:none">← Back to home</a>
      </div>`;
    document.body.appendChild(el);
  }

  function showUpgradeOverlay(modelId) {
    const suite = suiteForModel(modelId);
    const meta  = SUITE_META[suite] || { name: 'Full Suite', price: '$37/month' };
    document.body.style.overflow = 'hidden';
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999';
    el.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:40px 36px;max-width:440px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,.2);text-align:center">
        <div style="font-size:2rem;margin-bottom:12px">🔒</div>
        <h2 style="margin:0 0 10px;font-size:1.25rem;color:#111">CapPlan ${meta.name} — Full Suite</h2>
        <p style="margin:0 0 8px;color:#555;line-height:1.6">This model is part of the Full Suite. Start a free 14-day trial — no credit card required until it ends.</p>
        <p style="font-weight:700;font-size:1.1rem;margin:0 0 24px;color:#111">${meta.price} &nbsp;·&nbsp; cancel anytime</p>
        <button onclick="CapPlanAuth.startCheckout('${suite}','monthly')"
          style="background:#2E7D52;color:#fff;border:none;border-radius:8px;padding:13px 32px;font-size:1rem;cursor:pointer;width:100%;margin-bottom:10px">
          Start free trial
        </button>
        <button onclick="CapPlanAuth.startCheckout('${suite}','annual')"
          style="background:#1B3F6E;color:#fff;border:none;border-radius:8px;padding:10px 32px;font-size:.9rem;cursor:pointer;width:100%;margin-bottom:10px">
          Annual plan (save 20%)
        </button>
        <a href="/" style="color:#888;font-size:.875rem;text-decoration:none">← Back to home</a>
      </div>`;
    document.body.appendChild(el);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {

    /**
     * Call on model page load.
     * Free models: pass-through immediately (no auth check).
     * Paid models: check Auth0 session + app_metadata.active_suites.
     */
    async init(modelId) {
      // Free models always pass through
      if (FREE_MODELS.includes(modelId)) return;

      try {
        const client = await getClient();

        // Handle Auth0 redirect callback
        const params = new URLSearchParams(window.location.search);
        if (params.has('code') && params.has('state')) {
          await client.handleRedirectCallback();
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const isAuth = await client.isAuthenticated();
        if (!isAuth) { showLoginPrompt(); return; }

        // Check active_suites in app_metadata (set by Auth0 Action on Stripe webhook)
        const user = await client.getUser();
        const activeSuites = user?.['https://capplan.online/app_metadata']?.active_suites || [];
        const suite = suiteForModel(modelId);

        if (!activeSuites.includes(suite)) {
          showUpgradeOverlay(modelId);
        }

      } catch (e) {
        console.warn('CapPlanAuth.init error:', e);
        // Fail open — don't block the model on auth errors
      }
    },

    /** Redirect to Auth0 Universal Login */
    async login() {
      const client = await getClient();
      await client.loginWithRedirect();
    },

    /** Sign out */
    async signOut() {
      const client = await getClient();
      await client.logout({ logoutParams: { returnTo: window.location.origin } });
    },

    /** Get current user (calls callback with user object or null) */
    async getUser(callback) {
      try {
        const client = await getClient();
        const isAuth = await client.isAuthenticated();
        if (!isAuth) { callback(null); return; }
        const user = await client.getUser();
        callback(user || null);
      } catch { callback(null); }
    },

    /** Start Stripe Checkout — calls the Cloudflare Worker */
    async startCheckout(suiteId, billing) {
      try {
        const userEmail = await new Promise(res => this.getUser(u => res(u?.email || null)));
        const res = await fetch(CHECKOUT_WORKER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            suiteId,
            billing: billing || 'monthly',
            userEmail,
            successUrl: window.location.href,
            cancelUrl:  window.location.href,
          }),
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else alert('Could not start checkout. Please try again.');
      } catch (e) {
        console.error('CapPlanAuth.startCheckout:', e);
        alert('Could not start checkout. Please try again.');
      }
    },
  };

})();

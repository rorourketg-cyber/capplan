/**
 * capplan-auth.js
 * Shared auth + access-control library for all CapPlan pages.
 *
 * Model pages:
 *   CapPlanAuth.init('us_model2').then(ok => { if (ok) render(); });
 *
 * Index / hub pages (no overlay, just check status):
 *   const suites = await CapPlanAuth.getActiveSuites();
 *   const name   = await CapPlanAuth.getDisplayName();
 */

const CapPlanAuth = (() => {

  const AUTH0_DOMAIN    = 'dev-7g0nuvl1fuufbeyn.us.auth0.com';
  const AUTH0_CLIENT_ID = 'zNrADr5Yz57Tg9tVKH7lcN5YtPguyIuR';
  const CHECKOUT_WORKER = 'https://patient-base-51d4.rorourketg.workers.dev';

  // Models that are always free — no auth check needed
  const FREE_MODELS = ['personal1', 'model1', 'us_model1', 'P1', 'UM1', 'M1'];

  // Claim namespace used by Auth0 Action
  const META_CLAIM = 'https://capplan.online/app_metadata';

  let _clientPromise = null;

  // ── Auth0 client (singleton) ───────────────────────────────
  function getClient() {
    if (!_clientPromise) {
      _clientPromise = window.auth0.createAuth0Client({
        domain:   AUTH0_DOMAIN,
        clientId: AUTH0_CLIENT_ID,
        authorizationParams: {
          redirect_uri: window.location.origin + window.location.pathname,
        },
        cacheLocation: 'localstorage',
        useRefreshTokens: true,
      });
    }
    return _clientPromise;
  }

  // ── Determine which suite a model belongs to ───────────────
  function suiteForModel(modelId) {
    const path = window.location.pathname;
    if (path.includes('/us/'))            return 'business_us';
    if (path.includes('/international/')) return 'business_intl';
    if (modelId.startsWith('us_model'))   return 'business_us';
    if (modelId.startsWith('model'))      return 'business_intl';
    return 'personal';
  }

  // ── Overlays ───────────────────────────────────────────────
  function showLoginPrompt() {
    document.body.style.overflow = 'hidden';
    const overlay = document.createElement('div');
    overlay.id = 'capplan-login-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999;';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:40px 36px;max-width:400px;
                  width:90%;box-shadow:0 8px 40px rgba(0,0,0,.18);text-align:center">
        <h2 style="margin:0 0 12px;font-size:1.3rem;color:#111">Sign in to CapPlan</h2>
        <p style="margin:0 0 24px;color:#555;line-height:1.6">
          Create a free account to use this model and save your analyses.
        </p>
        <button onclick="CapPlanAuth.login()"
          style="background:#1B3F6E;color:#fff;border:none;border-radius:8px;
                 padding:14px 32px;font-size:1rem;cursor:pointer;width:100%;margin-bottom:12px">
          Sign in / Create account
        </button>
        <a href="/" style="color:#888;font-size:.9rem;text-decoration:none">Back to home</a>
      </div>`;
    document.body.appendChild(overlay);
  }

  function showUpgradeOverlay(modelId) {
    const suite      = suiteForModel(modelId);
    const isPersonal = suite === 'personal';
    const isUS       = suite === 'business_us';
    const price      = isPersonal ? '$12/month' : '$37/month';
    const suiteName  = isPersonal ? 'Personal'
                     : isUS       ? 'Business — US Edition'
                     :              'Business — International Edition';

    document.body.style.overflow = 'hidden';
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.style.filter = 'blur(4px)';

    const overlay = document.createElement('div');
    overlay.id = 'capplan-upgrade-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:40px 36px;max-width:440px;
                  width:90%;box-shadow:0 8px 40px rgba(0,0,0,.18);text-align:center">
        <div style="font-size:2rem;margin-bottom:12px">🔒</div>
        <h2 style="margin:0 0 12px;font-size:1.3rem;color:#111">
          CapPlan ${suiteName} — Full Suite
        </h2>
        <p style="margin:0 0 24px;color:#555;line-height:1.6">
          This model is included in the Full Suite. Subscribe to access all models
          in this suite.
        </p>
        <p style="font-weight:700;font-size:1.1rem;margin:0 0 24px;color:#111">
          ${price} &nbsp;·&nbsp; cancel anytime
        </p>
        <button onclick="CapPlanAuth.startCheckout('${suite}','monthly')"
          style="background:#1B3F6E;color:#fff;border:none;border-radius:8px;
                 padding:14px 32px;font-size:1rem;cursor:pointer;width:100%;margin-bottom:12px">
          Subscribe — ${price}
        </button>
        <button onclick="history.back()"
          style="background:none;border:none;color:#888;cursor:pointer;font-size:.9rem">
          Go back
        </button>
      </div>`;
    document.body.appendChild(overlay);
  }

  // ── Public API ─────────────────────────────────────────────
  return {

    /**
     * Called on model pages. Returns true if user has access,
     * false if an overlay was shown (login prompt or upgrade prompt).
     */
    async init(modelId) {
      if (FREE_MODELS.includes(modelId)) return true;
      try {
        const client = await getClient();
        const params = new URLSearchParams(window.location.search);

        if (params.has('code') && params.has('state')) {
          await client.handleRedirectCallback();
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (params.has('subscribed')) {
          window.history.replaceState({}, document.title, window.location.pathname);
          await client.loginWithRedirect({
            authorizationParams: { redirect_uri: window.location.origin + window.location.pathname },
          });
          return false;
        }

        const isAuth = await client.isAuthenticated();
        if (!isAuth) { showLoginPrompt(); return false; }

        const user = await client.getUser();
        const activeSuites = user?.[META_CLAIM]?.active_suites || [];
        const suite = suiteForModel(modelId);

        if (!activeSuites.includes(suite)) {
          showUpgradeOverlay(modelId);
          return false;
        }

        return true;
      } catch (e) {
        console.warn('CapPlanAuth.init error:', e);
        return true; // fail open
      }
    },

    /**
     * Returns the array of active suites for the current user,
     * or null if not authenticated. Does NOT show any overlay.
     * Used by index/hub pages to adapt their UI.
     * e.g. ['personal'], ['business_us', 'business_intl']
     */
    async getActiveSuites() {
      try {
        const client = await getClient();
        const params = new URLSearchParams(window.location.search);
        if (params.has('code') && params.has('state')) {
          await client.handleRedirectCallback();
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        const isAuth = await client.isAuthenticated();
        if (!isAuth) return null;
        const user = await client.getUser();
        return user?.[META_CLAIM]?.active_suites || [];
      } catch (e) {
        console.warn('CapPlanAuth.getActiveSuites error:', e);
        return null;
      }
    },

    /**
     * Returns a display name for the logged-in user (first name,
     * nickname, or email prefix), or null if not authenticated.
     */
    async getDisplayName() {
      try {
        const client = await getClient();
        const isAuth = await client.isAuthenticated();
        if (!isAuth) return null;
        const user = await client.getUser();
        if (!user) return null;
        return user.given_name || user.nickname || (user.email ? user.email.split('@')[0] : null);
      } catch (e) {
        return null;
      }
    },

    /** Redirect to Auth0 login */
    async login() {
      const client = await getClient();
      await client.loginWithRedirect({
        authorizationParams: { redirect_uri: window.location.origin + window.location.pathname },
      });
    },

    /** Redirect to Auth0 logout, return to home */
    async logout() {
      const client = await getClient();
      await client.logout({ logoutParams: { returnTo: window.location.origin } });
    },

    /**
     * Launch Stripe Checkout via Cloudflare Worker.
     * suite: 'personal' | 'business_us' | 'business_intl'
     * billing: 'monthly' | 'annual'
     * successUrl: optional — defaults to current page with ?subscribed=1
     */
    async startCheckout(suite, billing = 'monthly', successUrl) {
      try {
        const client = await getClient();
        const isAuth = await client.isAuthenticated();
        if (!isAuth) {
          await client.loginWithRedirect({
            authorizationParams: { redirect_uri: window.location.href },
          });
          return;
        }
        const user = await client.getUser();
        const email = user?.email || '';
        const redirectTo = successUrl || (window.location.origin + window.location.pathname + '?subscribed=1');

        const res = await fetch(CHECKOUT_WORKER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suite, billing, email, successUrl: redirectTo }),
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else throw new Error('No URL returned from checkout worker');
      } catch (e) {
        console.error('CapPlanAuth.startCheckout error:', e);
        alert('Could not start checkout. Please try again.');
      }
    },

    /**
     * Open Stripe Customer Portal via Cloudflare Worker.
     * Requires the worker to support a /portal endpoint.
     */
    async openPortal() {
      try {
        const client = await getClient();
        const user = await client.getUser();
        const email = user?.email || '';
        const res = await fetch(CHECKOUT_WORKER + '/portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, returnUrl: window.location.href }),
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else throw new Error('No portal URL returned');
      } catch (e) {
        console.error('CapPlanAuth.openPortal error:', e);
        alert('Could not open billing portal. Please try again.');
      }
    },
  };

})();

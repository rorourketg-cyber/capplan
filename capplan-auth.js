/**
 * capplan-auth.js
 * Shared auth + access-control library for all CapPlan model pages.
 *
 * Usage (add near top of each model HTML, after the Auth0 SPA SDK):
 *
 *   <script src="https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js"></script>
 *   <script src="/capplan-auth.js"></script>
 *   <script>
 *     // In your model's init code:
 *     CapPlanAuth.init('model3').then(ok => {
 *       if (ok) startModel(); // user has access
 *     });
 *   </script>
 */

const CapPlanAuth = (() => {

  const AUTH0_DOMAIN   = 'dev-74uhps8oq6hjgk8o.us.auth0.com';
  const AUTH0_CLIENT_ID = '1oCZLeLb8rcdIPvQKHOplADLcdFX87T0';
  const AUTH0_AUDIENCE  = 'https://api.capplan.online';
  const API_BASE        = 'https://capplan.online/api';

  let auth0Client = null;
  let accessCache = null; // { models_allowed: [...], business: {...}, personal: {...} }

  // -------------------------------------------------------------------------
  // Auth0 client
  // -------------------------------------------------------------------------
  async function getAuth0Client() {
    if (auth0Client) return auth0Client;
    auth0Client = await window.auth0.createAuth0Client({
      domain:   AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: window.location.origin + window.location.pathname,
        audience: AUTH0_AUDIENCE,
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
    });
    return auth0Client;
  }

  // -------------------------------------------------------------------------
  // Check if returning from Auth0 redirect (handle the callback)
  // -------------------------------------------------------------------------
  async function handleRedirectIfNeeded(client) {
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') && params.has('state')) {
      await client.handleRedirectCallback();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // -------------------------------------------------------------------------
  // Fetch access from our API
  // -------------------------------------------------------------------------
  async function fetchAccess(client) {
    if (accessCache) return accessCache;
    try {
      const token = await client.getTokenSilently();
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      accessCache = data.access;
      return accessCache;
    } catch (e) {
      console.warn('CapPlanAuth: could not fetch access', e);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Show upgrade overlay
  // -------------------------------------------------------------------------
  function showUpgradeOverlay(modelId) {
    // Determine suite from model ID
    // personal* → Personal
    // us_model* → Business US
    // model*    → Business International
    const isPersonal  = modelId.startsWith('personal');
    const isBusinessUS = modelId.startsWith('us_model');
    const suite = isPersonal ? 'personal' : isBusinessUS ? 'business_us' : 'business_intl';
    const price = isPersonal ? '$12/month' : '$37/month';
    const suiteName = isPersonal ? 'Personal'
                    : isBusinessUS ? 'Business — US Edition'
                    : 'Business — International Edition';

    // Blur the page content behind the overlay
    document.body.style.overflow = 'hidden';
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.style.filter = 'blur(4px)';

    const overlay = document.createElement('div');
    overlay.id = 'capplan-upgrade-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.45);
      display:flex;align-items:center;justify-content:center;z-index:9999;
    `;
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:40px 36px;max-width:440px;
                  width:90%;box-shadow:0 8px 40px rgba(0,0,0,.18);text-align:center">
        <div style="font-size:2rem;margin-bottom:12px">🔒</div>
        <h2 style="margin:0 0 12px;font-size:1.3rem;color:#111">
          CapPlan ${suiteName} Full Suite
        </h2>
        <p style="margin:0 0 24px;color:#555;line-height:1.6">
          This model is included in the Full Suite. Start a free 14-day trial
          — no credit card required until the trial ends.
        </p>
        <p style="font-weight:700;font-size:1.1rem;margin:0 0 24px;color:#111">
          ${price} &nbsp;·&nbsp; cancel anytime
        </p>
        <button onclick="CapPlanAuth.startCheckout('${suite}','monthly')"
          style="background:#0057ff;color:#fff;border:none;border-radius:8px;
                 padding:14px 32px;font-size:1rem;cursor:pointer;width:100%;margin-bottom:12px">
          Start free trial
        </button>
        <button onclick="window.location.href='capplan_landing.html#pricing'"
          style="background:none;border:none;color:#888;cursor:pointer;font-size:.9rem">
          See all plans
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // -------------------------------------------------------------------------
  // Show login prompt
  // -------------------------------------------------------------------------
  function showLoginPrompt() {
    const overlay = document.createElement('div');
    overlay.id = 'capplan-login-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.55);
      display:flex;align-items:center;justify-content:center;z-index:9999;
    `;
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:40px 36px;max-width:400px;
                  width:90%;box-shadow:0 8px 40px rgba(0,0,0,.18);text-align:center">
        <h2 style="margin:0 0 12px;font-size:1.3rem;color:#111">Sign in to CapPlan</h2>
        <p style="margin:0 0 24px;color:#555;line-height:1.6">
          Create a free account to use this model and save your analyses.
        </p>
        <button onclick="CapPlanAuth.login()"
          style="background:#0057ff;color:#fff;border:none;border-radius:8px;
                 padding:14px 32px;font-size:1rem;cursor:pointer;width:100%;margin-bottom:12px">
          Sign in / Create account
        </button>
        <a href="/" style="color:#888;font-size:.9rem;text-decoration:none">Back to home</a>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------
  return {

    /**
     * Call this on model page load.
     * Returns true if the user has access to modelId, false otherwise.
     * Handles login redirect, token refresh, and upgrade overlay.
     */
    async init(modelId) {
      const client = await getAuth0Client();
      await handleRedirectIfNeeded(client);

      const isAuthenticated = await client.isAuthenticated();

      if (!isAuthenticated) {
        showLoginPrompt();
        return false;
      }

      const access = await fetchAccess(client);
      if (!access) {
        // API error — allow access rather than blocking (fail open)
        console.warn('CapPlanAuth: access check failed, allowing through');
        return true;
      }

      if (!access.models_allowed.includes(modelId)) {
        showUpgradeOverlay(modelId);
        return false;
      }

      return true;
    },

    /** Redirect to Auth0 login */
    async login() {
      const client = await getAuth0Client();
      await client.loginWithRedirect();
    },

    /** Redirect to Auth0 logout */
    async logout() {
      const client = await getAuth0Client();
      accessCache = null;
      await client.logout({ logoutParams: { returnTo: window.location.origin } });
    },

    /** Get the current user's email (or null) */
    async getEmail() {
      try {
        const client = await getAuth0Client();
        const user = await client.getUser();
        return user?.email || null;
      } catch { return null; }
    },

    /** Start Stripe Checkout for a suite */
    async startCheckout(suite, period = 'monthly') {
      try {
        const client = await getAuth0Client();
        const token = await client.getTokenSilently();
        const res = await fetch(`${API_BASE}/stripe/create-checkout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ suite, period }),
        });
        const { url } = await res.json();
        if (url) window.location.href = url;
      } catch (e) {
        alert('Could not start checkout. Please try again.');
        console.error(e);
      }
    },

    /** Open Stripe Customer Portal */
    async openPortal() {
      try {
        const client = await getAuth0Client();
        const token = await client.getTokenSilently();
        const res = await fetch(`${API_BASE}/stripe/create-portal`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const { url } = await res.json();
        if (url) window.location.href = url;
      } catch (e) {
        alert('Could not open billing portal. Please try again.');
        console.error(e);
      }
    },

    /** Get raw access object (for UI display) */
    getAccess() { return accessCache; },
  };

})();

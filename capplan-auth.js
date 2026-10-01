/**
 * capplan-auth.js
 * Auth0 + Stripe Checkout integration for CapPlan
 *
 * Auth0:  dev-74uhps8oq6hjgk8o.us.auth0.com
 * App:    CapPlan Web (client 1oCZLeLb8rcdIPvQKHOplADLcdFX87T0)
 *
 * Usage (from any suite page):
 *   CapPlanAuth.startCheckout('business_us', 'monthly')
 *   CapPlanAuth.startCheckout('business_intl', 'annual')
 *   CapPlanAuth.startCheckout('personal', 'monthly')
 *   CapPlanAuth.init('UM3')   // called at top of a model page to gate access
 *
 * Two values still need filling in before going live:
 *   STRIPE_PUBLISHABLE_KEY  — your pk_live_... key from Stripe dashboard
 *   CHECKOUT_WORKER_URL     — URL of your deployed Cloudflare Worker
 */

(function (window) {
  'use strict';

  /* ── CONFIGURATION ──────────────────────────────────────────────────────── */

  var AUTH0_DOMAIN    = 'dev-74uhps8oq6hjgk8o.us.auth0.com';
  var AUTH0_CLIENT_ID = '1oCZLeLb8rcdIPvQKHOplADLcdFX87T0';

  // Replace with your Stripe publishable key (pk_test_... for testing, pk_live_... for production)
  var STRIPE_PUBLISHABLE_KEY = 'YOUR_STRIPE_PUBLISHABLE_KEY';

  // Replace with the URL of your deployed Cloudflare Worker that creates Stripe sessions
  var CHECKOUT_WORKER_URL = 'YOUR_CHECKOUT_WORKER_URL';

  /* ── PRICE IDs ──────────────────────────────────────────────────────────── */

  var PRICES = {
    business_us: {
      monthly: 'price_1UL2ltPnu63aqS4gdLs4kz3w',
      annual:  'price_1UL2nYPnu63aqS4gXOgVpPz3'
    },
    business_intl: {
      monthly: 'price_1UKhNfPnu63aqS4gZvZ17R2H',
      annual:  'price_1UKhSRPnu63aqS4g6qEq3TzI'
    },
    personal: {
      monthly: 'price_1UKhUGPnu63aqS4gHy7YIjBj',
      annual:  'price_1UKhWDPnu63aqS4gukWsbyY4'
    }
  };

  /* ── FREE MODELS ────────────────────────────────────────────────────────── */
  // These model IDs are always accessible — no login or subscription required

  var FREE_MODELS = ['UM1', 'M1', 'P1'];

  /* ── SUITE → MODEL PREFIX MAP ───────────────────────────────────────────── */

  var SUITE_PREFIXES = {
    business_us:   'UM',
    business_intl: 'M',
    personal:      'P'
  };

  /* ── SUITE INDEX PAGE PATHS (relative from a model file) ────────────────── */

  var SUITE_PAGES = {
    business_us:   '../../business/us/index.html',
    business_intl: '../../business/international/index.html',
    personal:      '../personal/index.html'
  };

  /* ── AUTH0 SDK LOADER ───────────────────────────────────────────────────── */

  var _auth0Client = null;
  var _auth0Ready  = false;
  var _readyQueue  = [];

  function _loadAuth0SDK(callback) {
    if (_auth0Ready) { callback(); return; }
    _readyQueue.push(callback);
    if (document.getElementById('auth0-spa-js')) return; // already loading

    var script    = document.createElement('script');
    script.id     = 'auth0-spa-js';
    script.src    = 'https://cdn.auth0.com/js/auth0-spa-js/2.1/auth0-spa-js.production.js';
    script.onload = function () {
      window.auth0.createAuth0Client({
        domain:   AUTH0_DOMAIN,
        clientId: AUTH0_CLIENT_ID,
        authorizationParams: {
          redirect_uri: window.location.origin + window.location.pathname
        },
        cacheLocation:    'localstorage',
        useRefreshTokens: true
      }).then(function (client) {
        _auth0Client = client;
        _auth0Ready  = true;
        _readyQueue.forEach(function (fn) { fn(); });
        _readyQueue = [];
      }).catch(function (err) {
        console.error('[CapPlanAuth] Auth0 init failed:', err);
      });
    };
    script.onerror = function () {
      console.error('[CapPlanAuth] Failed to load Auth0 SDK');
    };
    document.head.appendChild(script);
  }

  /* ── AUTH HELPERS ───────────────────────────────────────────────────────── */

  function _isAuthenticated(callback) {
    _loadAuth0SDK(function () {
      _auth0Client.isAuthenticated().then(callback);
    });
  }

  function _getUser(callback) {
    _loadAuth0SDK(function () {
      _auth0Client.getUser().then(callback);
    });
  }

  function _login(options) {
    _loadAuth0SDK(function () {
      _auth0Client.loginWithRedirect(options || {});
    });
  }

  function _logout() {
    _loadAuth0SDK(function () {
      _auth0Client.logout({
        logoutParams: { returnTo: window.location.origin }
      });
    });
  }

  /* ── SUBSCRIPTION CHECK ─────────────────────────────────────────────────── */
  // Reads active_suites from Auth0 app_metadata.
  // Populate this via an Auth0 Action that fires on Stripe webhook events:
  //   customer.subscription.created  → add suite to active_suites
  //   customer.subscription.deleted  → remove suite from active_suites

  function _hasActiveSuite(user, suiteId) {
    if (!user) return false;
    var meta = user['https://capplan.app/app_metadata'] || {};
    var subs = meta.active_suites || [];
    return subs.indexOf(suiteId) !== -1;
  }

  /* ── STRIPE CHECKOUT ────────────────────────────────────────────────────── */

  function _redirectToCheckout(priceId, userEmail) {
    if (!CHECKOUT_WORKER_URL || CHECKOUT_WORKER_URL === 'YOUR_CHECKOUT_WORKER_URL') {
      alert('Checkout is not yet configured. Please contact support@capplan.app.');
      return;
    }

    fetch(CHECKOUT_WORKER_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId:    priceId,
        email:      userEmail || '',
        successUrl: window.location.href + '?checkout=success',
        cancelUrl:  window.location.href + '?checkout=cancelled'
      })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('[CapPlanAuth] No checkout URL:', data);
        alert('Could not start checkout. Please try again.');
      }
    })
    .catch(function (err) {
      console.error('[CapPlanAuth] Checkout error:', err);
      alert('Could not start checkout. Please try again.');
    });
  }

  /* ── RESUME PENDING CHECKOUT ────────────────────────────────────────────── */
  // After a login redirect, pick up where the user left off

  function _resumeCheckout() {
    var suiteId, billing;
    try {
      suiteId = sessionStorage.getItem('capplan_checkout_suite');
      billing = sessionStorage.getItem('capplan_checkout_billing');
      sessionStorage.removeItem('capplan_checkout_suite');
      sessionStorage.removeItem('capplan_checkout_billing');
    } catch (e) {}
    if (suiteId && billing) {
      CapPlanAuth.startCheckout(suiteId, billing);
    }
  }

  /* ── PUBLIC API ─────────────────────────────────────────────────────────── */

  var CapPlanAuth = {};

  /**
   * startCheckout(suiteId, billing)
   * Called by the Subscribe button on suite index pages.
   * Logs the user in first if needed, then opens Stripe Checkout.
   *
   * @param {string} suiteId  'business_us' | 'business_intl' | 'personal'
   * @param {string} billing  'monthly' | 'annual'
   */
  CapPlanAuth.startCheckout = function (suiteId, billing) {
    var priceId = (PRICES[suiteId] || {})[billing];
    if (!priceId) {
      console.error('[CapPlanAuth] Unknown suite/billing:', suiteId, billing);
      return;
    }

    _isAuthenticated(function (authenticated) {
      if (!authenticated) {
        try {
          sessionStorage.setItem('capplan_checkout_suite',   suiteId);
          sessionStorage.setItem('capplan_checkout_billing', billing);
        } catch (e) {}
        _login({
          authorizationParams: {
            redirect_uri: window.location.origin + window.location.pathname,
            screen_hint:  'signup'
          }
        });
        return;
      }
      _getUser(function (user) {
        _redirectToCheckout(priceId, user ? user.email : '');
      });
    });
  };

  /**
   * init(modelId)
   * Call at the top of every gated model page.
   * Free models (UM1, M1, P1) pass through immediately.
   * Paid models verify login + active subscription; redirect to suite page if not.
   *
   * @param {string} modelId  e.g. 'UM3', 'M7', 'P4'
   */
  CapPlanAuth.init = function (modelId) {
    // Free models — open to everyone, no check needed
    if (FREE_MODELS.indexOf(modelId) !== -1) return;

    // Determine suite from model ID prefix
    var suiteId = null;
    var keys = Object.keys(SUITE_PREFIXES);
    for (var i = 0; i < keys.length; i++) {
      if (modelId.indexOf(SUITE_PREFIXES[keys[i]]) === 0) {
        suiteId = keys[i];
        break;
      }
    }
    if (!suiteId) {
      console.warn('[CapPlanAuth] Unknown model prefix:', modelId);
      return;
    }

    _loadAuth0SDK(function () {
      // Handle Auth0 redirect callback (code= in URL after login)
      if (window.location.search.indexOf('code=') !== -1 ||
          window.location.search.indexOf('error=') !== -1) {
        _auth0Client.handleRedirectCallback().then(function () {
          window.history.replaceState({}, document.title, window.location.pathname);
          _resumeCheckout();
        }).catch(function (err) {
          console.error('[CapPlanAuth] Redirect callback error:', err);
        });
        return;
      }

      _isAuthenticated(function (authenticated) {
        if (!authenticated) {
          window.location.href = SUITE_PAGES[suiteId] || '../index.html';
          return;
        }
        _getUser(function (user) {
          if (!_hasActiveSuite(user, suiteId)) {
            window.location.href = SUITE_PAGES[suiteId] || '../index.html';
          }
          // Active subscription confirmed — model page loads normally
        });
      });
    });
  };

  /**
   * signOut()
   * Attach to a sign-out button anywhere on the site.
   */
  CapPlanAuth.signOut = function () {
    _logout();
  };

  /**
   * getUser(callback)
   * Returns the Auth0 user profile object, or null if not logged in.
   * Use to show the user's email or subscription status in the UI.
   *
   * @param {function} callback  called with user object or null
   */
  CapPlanAuth.getUser = function (callback) {
    _isAuthenticated(function (authenticated) {
      if (!authenticated) { callback(null); return; }
      _getUser(callback);
    });
  };

  /* ── EXPOSE ─────────────────────────────────────────────────────────────── */

  window.CapPlanAuth = CapPlanAuth;

}(window));

/**
 * CapPlan Suite Navigation  v2
 * Injected by capplan-auth.js after auth check.
 *
 * Two states:
 *   • Free trial user  — locked pills, benefit tooltips, upgrade slide-in, expiry banner
 *   • Paid subscriber  — all pills active, benefit tooltips on hover
 *
 * Internal model numbers (P1, UM3, M7 …) are NEVER shown to users.
 */
(function () {
  'use strict';

  // ── Trial helpers ────────────────────────────────────────────────────────────
  var TRIAL_KEY      = 'capplan_trial_start';   // localStorage key
  var TRIAL_DAYS     = 30;
  var TRIAL_WARN_DAY = 25;                       // show banner from day 25

  function getTrialStart() {
    try { return parseInt(localStorage.getItem(TRIAL_KEY), 10) || null; } catch(e) { return null; }
  }
  function setTrialStart(ts) {
    try { localStorage.setItem(TRIAL_KEY, String(ts)); } catch(e) {}
  }
  function trialDaysUsed(start) {
    return Math.floor((Date.now() - start) / 86400000);
  }
  function trialDaysLeft(start) {
    return Math.max(0, TRIAL_DAYS - trialDaysUsed(start));
  }

  // ── Suite / model definitions ────────────────────────────────────────────────
  var SUITES = {
    personal: {
      id:      'personal',
      label:   'Personal Suite',
      color:   '#2E7D52',
      homeUrl: '/personal/',
      models: [
        { file: 'personal1.html',  url: '/personal/personal1.html',  benefit: 'Should I buy this asset at this time?' },
        { file: 'personal2.html',  url: '/personal/personal2.html',  benefit: 'Which purchase option should I buy?' },
        { file: 'personal3.html',  url: '/personal/personal3.html',  benefit: 'Should I replace or keep this existing asset?' },
        { file: 'personal4.html',  url: '/personal/personal4.html',  benefit: 'Which replacement gives me the best financial outcome?' },
        { file: 'personal5.html',  url: '/personal/personal5.html',  benefit: 'When is the best time to replace this asset?' },
        { file: 'personal9.html',  url: '/personal/personal9.html',  benefit: 'Which costs less — leasing or buying this asset?' },
        { file: 'personal11.html', url: '/personal/personal11.html', benefit: 'What is this lease costing me?' },
        { file: 'personal12.html', url: '/personal/personal12.html', benefit: 'What is the least I should accept if I sell this asset?' },
        { file: 'personal13.html', url: '/personal/personal13.html', benefit: 'What is the most I should pay for this asset?' }
      ]
    },
    business_us: {
      id:      'business_us',
      label:   'Business Suite',
      color:   '#1B3F6E',
      homeUrl: '/business/us/',
      models: [
        { file: 'capplan_us_model1.html',  url: '/capplan_us_model1.html',  benefit: 'Does this capital investment meet our required return?' },
        { file: 'capplan_us_model2.html',  url: '/capplan_us_model2.html',  benefit: 'Which asset gives the best return on investment?' },
        { file: 'capplan_us_model3.html',  url: '/capplan_us_model3.html',  benefit: 'Does replacing this asset now make financial sense?' },
        { file: 'capplan_us_model4.html',  url: '/capplan_us_model4.html',  benefit: 'Which replacement option gives us the best financial outcome?' },
        { file: 'capplan_us_model5.html',  url: '/capplan_us_model5.html',  benefit: 'What is the optimal period to replace this asset?' },
        { file: 'capplan_us_model6.html',  url: '/capplan_us_model6.html',  benefit: 'What is the minimum lease payment to charge that will recover our costs?' },
        { file: 'capplan_us_model7.html',  url: '/capplan_us_model7.html',  benefit: 'What is the minimum hourly rate we need to charge for equipment rental?' },
        { file: 'capplan_us_model8.html',  url: '/capplan_us_model8.html',  benefit: 'What is the minimum hourly rate we need to charge for equipment rental with operator?' },
        { file: 'capplan_us_model9.html',  url: '/capplan_us_model9.html',  benefit: 'Should we lease or purchase this asset?' },
        { file: 'capplan_us_model10.html', url: '/capplan_us_model10.html', benefit: 'Does a sale and leaseback on this asset make financial sense?' },
        { file: 'capplan_us_model11.html', url: '/capplan_us_model11.html', benefit: 'What is this lease costing us as a financing rate?' },
        { file: 'capplan_us_model12.html', url: '/capplan_us_model12.html', benefit: 'What is the minimum price we should accept to sell this asset?' },
        { file: 'capplan_us_model13.html', url: '/capplan_us_model13.html', benefit: 'What is the maximum we should pay to buy this asset?' }
      ]
    },
    business_intl: {
      id:      'business_intl',
      label:   'Business Suite',
      color:   '#1B3F6E',
      homeUrl: '/business/international/',
      models: [
        { file: 'capplan_model1.html',  url: '/capplan_model1.html',  benefit: 'Does this capital investment meet our required return?' },
        { file: 'capplan_model2.html',  url: '/capplan_model2.html',  benefit: 'Which asset gives the best return on investment?' },
        { file: 'capplan_model3.html',  url: '/capplan_model3.html',  benefit: 'Does replacing this asset now make financial sense?' },
        { file: 'capplan_model4.html',  url: '/capplan_model4.html',  benefit: 'Which replacement option gives us the best financial outcome?' },
        { file: 'capplan_model5.html',  url: '/capplan_model5.html',  benefit: 'What is the optimal period to replace this asset?' },
        { file: 'capplan_model6.html',  url: '/capplan_model6.html',  benefit: 'What is the minimum lease payment to charge that will recover our costs?' },
        { file: 'capplan_model7.html',  url: '/capplan_model7.html',  benefit: 'What is the minimum hourly rate we need to charge for equipment rental?' },
        { file: 'capplan_model8.html',  url: '/capplan_model8.html',  benefit: 'What is the minimum hourly rate we need to charge for equipment rental with operator?' },
        { file: 'capplan_model9.html',  url: '/capplan_model9.html',  benefit: 'Should we lease or purchase this asset?' },
        { file: 'capplan_model10.html', url: '/capplan_model10.html', benefit: 'Does a sale and leaseback on this asset make financial sense?' },
        { file: 'capplan_model11.html', url: '/capplan_model11.html', benefit: 'What is this lease costing us as a financing rate?' },
        { file: 'capplan_model12.html', url: '/capplan_model12.html', benefit: 'What is the minimum price we should accept to sell this asset?' },
        { file: 'capplan_model13.html', url: '/capplan_model13.html', benefit: 'What is the maximum we should pay to buy this asset?' }
      ]
    }
  };

  // ── Detect current suite + model ─────────────────────────────────────────────
  function detectContext() {
    var path = window.location.pathname;
    var suite;
    if (path.indexOf('/personal/') !== -1) {
      suite = SUITES.personal;
    } else if (path.indexOf('/us/') !== -1 || path.indexOf('capplan_us_model') !== -1) {
      suite = SUITES.business_us;
    } else if (path.indexOf('/international/') !== -1 ||
               (path.indexOf('capplan_model') !== -1 && path.indexOf('capplan_us_model') === -1)) {
      suite = SUITES.business_intl;
    }
    if (!suite) return null;

    var currentModel = null;
    for (var i = 0; i < suite.models.length; i++) {
      // Match with or without .html extension (Cloudflare Pages strips .html)
      var fileBase = suite.models[i].file.replace(/\.html$/, '');
      if (path.indexOf(fileBase) !== -1) {
        currentModel = suite.models[i];
        break;
      }
    }
    return { suite: suite, currentModel: currentModel };
  }

  // ── Upgrade slide-in panel ───────────────────────────────────────────────────
  function showUpgradePanel(model, suite) {
    var existing = document.getElementById('cpn-upgrade-panel');
    if (existing) existing.parentNode.removeChild(existing);

    var price     = suite.id === 'personal' ? '$12/month' : '$37/month';
    var suiteName = suite.id === 'personal' ? 'Personal Suite'
                  : suite.id === 'business_us' ? 'Business Suite — US Edition'
                  : 'Business Suite — International Edition';

    var panel = document.createElement('div');
    panel.id = 'cpn-upgrade-panel';
    panel.style.cssText = [
      'position:fixed', 'right:0', 'top:0', 'bottom:0', 'width:min(380px,92vw)',
      'background:#fff', 'box-shadow:-4px 0 32px rgba(15,29,46,.18)',
      'z-index:10000', 'display:flex', 'flex-direction:column',
      'transform:translateX(100%)', 'transition:transform .25s ease',
      'font-family:system-ui,-apple-system,sans-serif'
    ].join(';');

    panel.innerHTML =
      '<div style="background:#1B3F6E;padding:18px 20px;display:flex;justify-content:space-between;align-items:center">' +
        '<span style="color:white;font-size:14px;font-weight:700">Unlock the full suite</span>' +
        '<button id="cpn-panel-close" style="background:none;border:none;color:rgba(255,255,255,.7);font-size:22px;cursor:pointer;line-height:1;padding:0">×</button>' +
      '</div>' +
      '<div style="padding:28px 24px;flex:1;overflow-y:auto">' +
        '<div style="font-size:22px;margin-bottom:16px">🔓</div>' +
        '<div style="font-size:17px;font-weight:700;color:#0F1D2E;line-height:1.4;margin-bottom:12px">' +
          model.benefit +
        '</div>' +
        '<div style="font-size:13px;color:#4A5568;line-height:1.7;margin-bottom:24px">' +
          'This model is part of the CapPlan ' + suiteLabel(suite) + '. ' +
          'Subscribe to access all models and make better financial decisions — faster.' +
        '</div>' +
        '<div style="background:#F0F4F0;border-radius:10px;padding:16px 18px;margin-bottom:20px">' +
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#8A96A6;margin-bottom:10px">What you unlock</div>' +
          buildBenefitList(suite) +
        '</div>' +
        '<button onclick="CapPlanAuth.startCheckout(\'' + suite.id + '\',\'monthly\')" ' +
          'style="width:100%;background:#1B3F6E;color:white;border:none;border-radius:8px;' +
          'padding:14px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:10px">' +
          'Subscribe — ' + price +
        '</button>' +
        '<div style="text-align:center;font-size:11px;color:#8A96A6">Cancel anytime · No commitment</div>' +
      '</div>';

    document.body.appendChild(panel);

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.id = 'cpn-upgrade-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(15,29,46,.4);z-index:9999;transition:opacity .25s';
    backdrop.style.opacity = '0';
    backdrop.addEventListener('click', closeUpgradePanel);
    document.body.appendChild(backdrop);

    // Animate in
    setTimeout(function () {
      panel.style.transform = 'translateX(0)';
      backdrop.style.opacity = '1';
    }, 10);

    document.getElementById('cpn-panel-close').addEventListener('click', closeUpgradePanel);
  }

  function closeUpgradePanel() {
    var panel    = document.getElementById('cpn-upgrade-panel');
    var backdrop = document.getElementById('cpn-upgrade-backdrop');
    if (panel)    { panel.style.transform = 'translateX(100%)'; setTimeout(function(){ if(panel.parentNode) panel.parentNode.removeChild(panel); }, 270); }
    if (backdrop) { backdrop.style.opacity = '0';               setTimeout(function(){ if(backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); }, 270); }
  }

  function suiteLabel(suite) {
    return suite.id === 'personal' ? 'Personal Suite'
         : suite.id === 'business_us' ? 'Business Suite (US Edition)'
         : 'Business Suite (International Edition)';
  }

  function buildBenefitList(suite) {
    var html = '<div style="display:flex;flex-direction:column;gap:8px">';
    for (var i = 0; i < suite.models.length; i++) {
      html += '<div style="display:flex;gap:10px;align-items:flex-start">' +
        '<span style="color:#2E7D52;font-size:13px;flex-shrink:0;margin-top:1px">✓</span>' +
        '<span style="font-size:12px;color:#4A5568;line-height:1.5">' + suite.models[i].benefit + '</span>' +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  // ── Trial expiry banner ──────────────────────────────────────────────────────
  function injectExpiryBanner(daysLeft, suite) {
    if (document.getElementById('cpn-trial-banner')) return;

    var urgent  = daysLeft <= 5;
    var bg      = urgent ? '#C84B31' : '#F59E0B';
    var price   = suite.id === 'personal' ? '$12/month' : '$37/month';
    var msg     = daysLeft === 0
      ? 'Your free trial has ended — subscribe to keep access'
      : daysLeft === 1
      ? 'Last day of your free trial — subscribe to keep access'
      : 'Your free trial ends in ' + daysLeft + ' days';

    var banner = document.createElement('div');
    banner.id = 'cpn-trial-banner';
    banner.style.cssText = [
      'background:' + bg,
      'color:white',
      'font-size:12px',
      'font-weight:600',
      'padding:7px 20px',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'gap:16px',
      'position:sticky',
      'top:68px',
      'z-index:101',
      'font-family:system-ui,-apple-system,sans-serif'
    ].join(';');

    banner.innerHTML =
      '<span>' + msg + '</span>' +
      '<button onclick="CapPlanAuth.startCheckout(\'' + suite.id + '\',\'monthly\')" ' +
        'style="background:white;color:' + bg + ';border:none;border-radius:5px;' +
        'padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">' +
        'Subscribe — ' + price +
      '</button>';

    // Insert before the suite nav (or after masthead)
    var anchor = document.getElementById('model-banner') || document.getElementById('masthead');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(banner, anchor.nextSibling);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }

    return banner;
  }

  // ── Main inject function ─────────────────────────────────────────────────────
  function inject(activeSuites, trialMode) {
    var ctx = detectContext();
    if (!ctx) return;

    var suite        = ctx.suite;
    var currentModel = ctx.currentModel;
    var suiteIds     = activeSuites || [];
    var isPaid       = suiteIds.indexOf(suite.id) !== -1;

    // Free trial: record start date on first visit
    if (!isPaid) {
      var trialStart = getTrialStart();
      if (!trialStart) {
        trialStart = Date.now();
        setTrialStart(trialStart);
      }
      var daysLeft = trialDaysLeft(trialStart);
      if (trialDaysUsed(trialStart) >= TRIAL_WARN_DAY) {
        var banner = injectExpiryBanner(daysLeft, suite);
      }
    }

    // Remove any existing nav
    var existing = document.getElementById('capplan-suite-nav');
    if (existing) existing.parentNode.removeChild(existing);

    var color = suite.color;
    var nav   = document.createElement('div');
    nav.id    = 'capplan-suite-nav';
    nav.style.cssText = [
      'background:' + color,
      'border-bottom:1px solid rgba(255,255,255,0.15)',
      'display:flex',
      'align-items:center',
      'padding:0 16px',
      'height:36px',
      'position:sticky',
      'top:68px',
      'z-index:100',
      'overflow:hidden',
      'font-family:system-ui,-apple-system,sans-serif'
    ].join(';');

    // Adjust top if expiry banner is present
    if (document.getElementById('cpn-trial-banner')) {
      nav.style.top = '94px'; // 68px masthead + 26px banner
    }

    // Left: suite home link
    var homeLink = document.createElement('a');
    homeLink.href = suite.homeUrl;
    homeLink.style.cssText = [
      'color:rgba(255,255,255,0.75)',
      'font-size:11px',
      'font-weight:700',
      'text-decoration:none',
      'white-space:nowrap',
      'padding-right:12px',
      'margin-right:12px',
      'border-right:1px solid rgba(255,255,255,0.2)',
      'display:flex',
      'align-items:center',
      'gap:5px',
      'flex-shrink:0',
      'letter-spacing:0.04em',
      'text-transform:uppercase'
    ].join(';');
    homeLink.innerHTML = '&#8592; ' + suite.label;
    homeLink.addEventListener('mouseenter', function () { homeLink.style.color = 'white'; });
    homeLink.addEventListener('mouseleave', function () { homeLink.style.color = 'rgba(255,255,255,0.75)'; });

    // Right: scrollable model strip
    var strip = document.createElement('div');
    strip.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:4px',
      'overflow-x:auto',
      'flex:1',
      'scrollbar-width:none',
      '-ms-overflow-style:none'
    ].join(';');

    for (var i = 0; i < suite.models.length; i++) {
      var m         = suite.models[i];
      var isCurrent = currentModel && m.file === currentModel.file;
      var isLocked  = !isPaid && !isCurrent;  // current free model is always accessible

      var pill = document.createElement('a');
      pill.title = m.benefit;   // tooltip — benefit language only

      if (isLocked) {
        pill.href = '#';
        pill.addEventListener('click', (function (model, s) {
          return function (e) { e.preventDefault(); showUpgradePanel(model, s); };
        }(m, suite)));
      } else {
        pill.href = m.url;
      }

      // Display: benefit text truncated to ~28 chars for pill, full text in title
      var shortLabel = m.benefit.length > 30 ? m.benefit.substring(0, 28) + '…' : m.benefit;

      pill.style.cssText = [
        'flex-shrink:0',
        'padding:3px 10px',
        'border-radius:20px',
        'font-size:11px',
        'font-weight:600',
        'text-decoration:none',
        'letter-spacing:0.02em',
        'transition:background 0.15s, color 0.15s',
        'white-space:nowrap',
        'max-width:200px',
        'overflow:hidden',
        'text-overflow:ellipsis',
        isCurrent
          ? 'background:rgba(255,255,255,0.95);color:' + color
          : isLocked
          ? 'background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);cursor:pointer'
          : 'background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.85);cursor:pointer'
      ].join(';');

      // Lock icon for unpaid models
      pill.textContent = isLocked ? '🔒 ' + shortLabel : shortLabel;

      if (!isCurrent && !isLocked) {
        pill.addEventListener('mouseenter', function (p) {
          return function () { p.style.background = 'rgba(255,255,255,0.25)'; p.style.color = 'white'; };
        }(pill));
        pill.addEventListener('mouseleave', function (p) {
          return function () { p.style.background = 'rgba(255,255,255,0.12)'; p.style.color = 'rgba(255,255,255,0.85)'; };
        }(pill));
      }
      if (isLocked) {
        pill.addEventListener('mouseenter', function (p) {
          return function () { p.style.background = 'rgba(255,255,255,0.15)'; p.style.color = 'rgba(255,255,255,0.75)'; };
        }(pill));
        pill.addEventListener('mouseleave', function (p) {
          return function () { p.style.background = 'rgba(255,255,255,0.08)'; p.style.color = 'rgba(255,255,255,0.5)'; };
        }(pill));
      }

      strip.appendChild(pill);
    }

    nav.appendChild(homeLink);
    nav.appendChild(strip);

    // Insert after #model-banner (or #masthead)
    var anchor = document.getElementById('model-banner') || document.getElementById('masthead');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(nav, anchor.nextSibling);
    } else {
      document.body.insertBefore(nav, document.body.firstChild);
    }

    // Scroll current pill into view
    if (currentModel) {
      var currentFileBase = currentModel.file.replace(/\.html$/, '');
      for (var j = 0; j < strip.children.length; j++) {
        if (strip.children[j].href && strip.children[j].href.indexOf(currentFileBase) !== -1) {
          setTimeout((function (el) {
            return function () { el.scrollIntoView({ inline: 'center', block: 'nearest' }); };
          }(strip.children[j])), 50);
          break;
        }
      }
    }

    // Adjust stepper
    var stepperTop = 104; // 68 masthead + 36 nav
    if (document.getElementById('cpn-trial-banner')) stepperTop += 26;
    var stepper = document.getElementById('stepper');
    if (stepper) {
      stepper.style.position = 'sticky';
      stepper.style.top      = stepperTop + 'px';
      stepper.style.zIndex   = '98';
    }

    // Webkit scrollbar hide
    if (!document.getElementById('capplan-nav-style')) {
      var style = document.createElement('style');
      style.id  = 'capplan-nav-style';
      style.textContent = '#capplan-suite-nav div::-webkit-scrollbar{display:none}';
      document.head.appendChild(style);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  window.CapPlanNav = {
    inject: inject,
    SUITES: SUITES
  };

}());

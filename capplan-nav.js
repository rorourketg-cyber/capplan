/**
 * CapPlan Suite Navigation
 * Injected automatically by capplan-auth.js after successful auth.
 * No changes needed on individual model pages.
 */
(function() {
  'use strict';

  // ── Suite definitions ─────────────────────────────────────────────────────
  var SUITES = {
    personal: {
      id: 'personal',
      label: 'Personal Suite',
      color: '#2E7D52',
      homeUrl: '/personal/',
      models: [
        { id: 'P1',  label: 'P1',  title: 'Should I Buy This?',           url: '/personal/personal1.html' },
        { id: 'P2',  label: 'P2',  title: 'Which Option Should I Buy?',   url: '/personal/personal2.html' },
        { id: 'P3',  label: 'P3',  title: 'Should I Rent or Buy?',        url: '/personal/personal3.html' },
        { id: 'P4',  label: 'P4',  title: 'Can I Afford This?',           url: '/personal/personal4.html' },
        { id: 'P5',  label: 'P5',  title: 'What Is This Worth to Me?',    url: '/personal/personal5.html' },
        { id: 'P9',  label: 'P9',  title: 'How Should I Pay for This?',   url: '/personal/personal9.html' },
        { id: 'P11', label: 'P11', title: 'What Will This Cost Over Time?',url: '/personal/personal11.html' },
        { id: 'P12', label: 'P12', title: 'Should I Repair or Replace?',  url: '/personal/personal12.html' },
        { id: 'P13', label: 'P13', title: 'What Is My Break-Even?',       url: '/personal/personal13.html' }
      ]
    },
    business_us: {
      id: 'business_us',
      label: 'Business Suite (US)',
      color: '#1B3F6E',
      homeUrl: '/business/us/',
      models: [
        { id: 'UM1',  label: 'UM1',  title: 'Should I Buy This Asset?',         url: '/capplan_us_model1.html' },
        { id: 'UM2',  label: 'UM2',  title: 'Which Asset Option?',              url: '/capplan_us_model2.html' },
        { id: 'UM3',  label: 'UM3',  title: 'Lease or Buy?',                    url: '/capplan_us_model3.html' },
        { id: 'UM4',  label: 'UM4',  title: 'MACRS Depreciation',               url: '/capplan_us_model4.html' },
        { id: 'UM5',  label: 'UM5',  title: 'Straight-Line Depreciation',       url: '/capplan_us_model5.html' },
        { id: 'UM6',  label: 'UM6',  title: 'Bonus Depreciation / §179',        url: '/capplan_us_model6.html' },
        { id: 'UM7',  label: 'UM7',  title: 'Payback Period',                   url: '/capplan_us_model7.html' },
        { id: 'UM8',  label: 'UM8',  title: 'IRR / NPV',                        url: '/capplan_us_model8.html' },
        { id: 'UM9',  label: 'UM9',  title: 'Equipment Replacement',            url: '/capplan_us_model9.html' },
        { id: 'UM10', label: 'UM10', title: 'Fleet Cost Analysis',              url: '/capplan_us_model10.html' },
        { id: 'UM11', label: 'UM11', title: 'Make vs Buy',                      url: '/capplan_us_model11.html' },
        { id: 'UM12', label: 'UM12', title: 'Capital Budget Ranking',           url: '/capplan_us_model12.html' },
        { id: 'UM13', label: 'UM13', title: 'Working Capital',                  url: '/capplan_us_model13.html' }
      ]
    },
    business_intl: {
      id: 'business_intl',
      label: 'Business Suite (Intl)',
      color: '#1B3F6E',
      homeUrl: '/business/international/',
      models: [
        { id: 'M1',  label: 'M1',  title: 'Should I Buy This Asset?',          url: '/capplan_model1.html' },
        { id: 'M2',  label: 'M2',  title: 'Which Asset Option?',               url: '/capplan_model2.html' },
        { id: 'M3',  label: 'M3',  title: 'Lease or Buy?',                     url: '/capplan_model3.html' },
        { id: 'M4',  label: 'M4',  title: 'Straight-Line Depreciation',        url: '/capplan_model4.html' },
        { id: 'M5',  label: 'M5',  title: 'Declining Balance Depreciation',    url: '/capplan_model5.html' },
        { id: 'M6',  label: 'M6',  title: 'Sum-of-Years Depreciation',         url: '/capplan_model6.html' },
        { id: 'M7',  label: 'M7',  title: 'Payback Period',                    url: '/capplan_model7.html' },
        { id: 'M8',  label: 'M8',  title: 'IRR / NPV',                         url: '/capplan_model8.html' },
        { id: 'M9',  label: 'M9',  title: 'Equipment Replacement',             url: '/capplan_model9.html' },
        { id: 'M10', label: 'M10', title: 'Fleet Cost Analysis',               url: '/capplan_model10.html' },
        { id: 'M11', label: 'M11', title: 'Make vs Buy',                       url: '/capplan_model11.html' },
        { id: 'M12', label: 'M12', title: 'Capital Budget Ranking',            url: '/capplan_model12.html' },
        { id: 'M13', label: 'M13', title: 'Working Capital',                   url: '/capplan_model13.html' }
      ]
    }
  };

  // ── Detect which suite and model we're on ─────────────────────────────────
  function detectContext() {
    var path = window.location.pathname;
    var suite, currentModel;

    if (path.indexOf('/personal/') !== -1) {
      suite = SUITES.personal;
    } else if (path.indexOf('/us/') !== -1 || path.indexOf('capplan_us_model') !== -1) {
      suite = SUITES.business_us;
    } else if (path.indexOf('/international/') !== -1 || (path.indexOf('capplan_model') !== -1 && path.indexOf('capplan_us_model') === -1)) {
      suite = SUITES.business_intl;
    }

    if (!suite) return null;

    // Match current model by URL
    var models = suite.models;
    for (var i = 0; i < models.length; i++) {
      var mUrl = models[i].url;
      // Compare just the filename portion to handle any path variation
      var mFile = mUrl.split('/').pop();
      if (path.indexOf(mFile) !== -1) {
        currentModel = models[i];
        break;
      }
    }

    return { suite: suite, currentModel: currentModel };
  }

  // ── Build and inject the nav bar ──────────────────────────────────────────
  function inject(activeSuites) {
    var ctx = detectContext();
    if (!ctx) return; // Not on a model page

    var suite = ctx.suite;
    var currentModel = ctx.currentModel;

    // Only show nav if user has access to this suite
    // (Free model P1/UM1/M1 users can still see nav — they just won't have
    //  access to paid models, which is handled by CapPlanAuth.init on those pages)
    var suiteIds = activeSuites || [];
    var hasSuiteAccess = suiteIds.indexOf(suite.id) !== -1;

    // Build nav HTML
    var color = suite.color;
    var navId = 'capplan-suite-nav';

    // Remove existing nav if any (e.g. on SPA-style re-renders)
    var existing = document.getElementById(navId);
    if (existing) existing.parentNode.removeChild(existing);

    var nav = document.createElement('div');
    nav.id = navId;
    nav.style.cssText = [
      'background:' + color,
      'border-bottom:1px solid rgba(255,255,255,0.15)',
      'display:flex',
      'align-items:center',
      'padding:0 16px',
      'height:36px',
      'position:sticky',
      'top:68px',       // sits just below the 68px masthead
      'z-index:99',
      'overflow:hidden'
    ].join(';');

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
    homeLink.addEventListener('mouseenter', function() {
      homeLink.style.color = 'rgba(255,255,255,1)';
    });
    homeLink.addEventListener('mouseleave', function() {
      homeLink.style.color = 'rgba(255,255,255,0.75)';
    });

    // Right: scrollable model pill strip
    var strip = document.createElement('div');
    strip.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:4px',
      'overflow-x:auto',
      'flex:1',
      'scrollbar-width:none',  // Firefox
      '-ms-overflow-style:none' // IE/Edge
    ].join(';');
    // Hide webkit scrollbar via inline style injection
    strip.style.setProperty('-webkit-overflow-scrolling', 'touch');

    var models = suite.models;
    for (var i = 0; i < models.length; i++) {
      var m = models[i];
      var isCurrent = currentModel && m.id === currentModel.id;

      var pill = document.createElement('a');
      pill.href = m.url;
      pill.title = m.title;
      pill.textContent = m.label;
      pill.style.cssText = [
        'flex-shrink:0',
        'padding:3px 10px',
        'border-radius:20px',
        'font-size:11px',
        'font-weight:700',
        'text-decoration:none',
        'letter-spacing:0.03em',
        'transition:background 0.15s, color 0.15s',
        isCurrent
          ? 'background:rgba(255,255,255,0.95);color:' + color
          : 'background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.8)'
      ].join(';');

      if (!isCurrent) {
        pill.addEventListener('mouseenter', function(p) {
          return function() { p.style.background = 'rgba(255,255,255,0.25)'; p.style.color = 'white'; };
        }(pill));
        pill.addEventListener('mouseleave', function(p) {
          return function() { p.style.background = 'rgba(255,255,255,0.12)'; p.style.color = 'rgba(255,255,255,0.8)'; };
        }(pill));
      }

      strip.appendChild(pill);
    }

    nav.appendChild(homeLink);
    nav.appendChild(strip);

    // ── Insert after #model-banner (or after #masthead if no banner) ─────────
    var anchor = document.getElementById('model-banner') || document.getElementById('masthead');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(nav, anchor.nextSibling);
    } else {
      // Fallback: prepend to body
      document.body.insertBefore(nav, document.body.firstChild);
    }

    // Scroll current pill into view (for wide suites)
    if (currentModel) {
      var pills = strip.querySelectorAll('a');
      for (var j = 0; j < pills.length; j++) {
        if (pills[j].textContent === currentModel.id) {
          setTimeout(function(el) {
            return function() { el.scrollIntoView({ inline: 'center', block: 'nearest' }); };
          }(pills[j]), 50);
          break;
        }
      }
    }

    // Adjust stepper top offset so it doesn't hide behind both sticky bars
    // masthead=68px + nav=36px = 104px
    var stepper = document.getElementById('stepper');
    if (stepper) {
      stepper.style.position = 'sticky';
      stepper.style.top = '104px';
      stepper.style.zIndex = '98';
    }

    // Hide webkit scrollbar for the strip via a <style> tag (once)
    if (!document.getElementById('capplan-nav-style')) {
      var style = document.createElement('style');
      style.id = 'capplan-nav-style';
      style.textContent = '#capplan-suite-nav div::-webkit-scrollbar{display:none}';
      document.head.appendChild(style);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.CapPlanNav = {
    inject: inject,
    SUITES: SUITES
  };

})();

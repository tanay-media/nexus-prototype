// Settings page — Conversion destinations (workspace catalog).
// Prototype only — state in localStorage so toggles persist across navigation.
//
// UI field names ↔ Base / Serving: see integrations-catalog.js (UI_FIELD_MAP)
// and docs/02-base-system/workspace-integrations.md §3.2.

(function () {
  var STORAGE_KEY = "nexus.cd.v2";

  var CUSTOM_SELECT_VALUE = "__custom__";

  var DEFAULT_LANDER_EVENTS = {
    facebook: {
      visit:      { enabled: true, eventName: "PageView" },
      impression: { enabled: true, eventName: "PageView" },
      click:      { enabled: true, eventName: "ViewContent" }
    },
    google: {
      visit:      { enabled: true, eventName: "page_view", conversionLabel: "AbC-D_efG-h", conversionActionId: "customers/2846197723/conversionActions/8841500" },
      impression: { enabled: true, eventName: "view_content", conversionLabel: "XyZ-Impr01", conversionActionId: "customers/2846197723/conversionActions/8841501" },
      click:      { enabled: true, eventName: "cta_click", conversionLabel: "CtA-Click9", conversionActionId: "customers/2846197723/conversionActions/8841502" }
    },
    taboola: {
      visit:      { enabled: true, eventName: "page_view" },
      impression: { enabled: true, eventName: "view_content" },
      click:      { enabled: true, eventName: "cta_click" }
    }
  };
  var LANDER_EVENT_KEYS = [
    { key: "visit", label: "Visit", hint: "Page load" },
    { key: "impression", label: "Impression", hint: "Page rendered" },
    { key: "click", label: "Click", hint: "CTA tap" }
  ];

  function defaultLanderEventMap(src) {
    var d = DEFAULT_LANDER_EVENTS[src];
    return d ? JSON.parse(JSON.stringify(d)) : null;
  }

  // ----- Defaults / seed data -----
  var seed = {
    defaults: { facebook: "cd_meta_prod", google: "cd_google_main", taboola: "cd_taboola_main", gtm: "cd_gtm_main", meta_pixel: "cd_meta_pixel_main" },
    rows: [
      {
        id: "cd_meta_prod",
        name: "Meta — ACME Growth",
        source: "facebook",
        fields: {
          fb_pixel_id: "319847562103948",
          fb_action_source: "website",
          fb_token_ref: "secret://vault/meta/acme-prod",
          fb_test_code: ""
        },
        landerEventMap: defaultLanderEventMap("facebook"),
        eventMap: [
          { from: "lead", to: "Lead" },
          { from: "purchase", to: "Purchase" }
        ],
        createdAt: "2026-03-12"
      },
      {
        id: "cd_meta_promo",
        name: "Meta — Holiday promo",
        source: "facebook",
        fields: {
          fb_pixel_id: "904782156390124",
          fb_action_source: "website",
          fb_token_ref: "secret://vault/meta/acme-promo",
          fb_test_code: "TEST82910"
        },
        eventMap: [
          { from: "lead", to: "Lead" },
          { from: "purchase", to: "Purchase" }
        ],
        landerEventMap: defaultLanderEventMap("facebook"),
        createdAt: "2026-04-22"
      },
      {
        id: "cd_google_main",
        name: "Google Ads — main",
        source: "google",
        fields: {
          g_tag_id: "AW-123456789",
          g_customer_id: "284-619-7723",
          g_token_ref: "secret://vault/google/acme-main"
        },
        landerEventMap: defaultLanderEventMap("google"),
        eventMap: [
          { from: "lead", to: "Submit lead form", conversionActionId: "customers/2846197723/conversionActions/8841502", value: { mode: "static", amount: 40, currency: "USD" } },
          { from: "purchase", to: "purchase_offline", conversionActionId: "customers/2846197723/conversionActions/8841503" }
        ],
        createdAt: "2026-04-04"
      },
      {
        id: "cd_taboola_main",
        name: "Taboola — default",
        source: "taboola",
        fields: { tb_account_id: "1234567", tb_token_ref: "secret://vault/taboola/acme" },
        landerEventMap: defaultLanderEventMap("taboola"),
        eventMap: [{ from: "lead", to: "lead" }],
        createdAt: "2026-04-10"
      },
      {
        id: "cd_gtm_main",
        name: "GTM — house.bestlivingideas.com",
        source: "gtm",
        fields: { gtm_container: "GTM-WX7K2PL", gtm_env: "live" },
        eventMap: [],
        createdAt: "2026-03-28"
      },
      {
        id: "cd_gtm_staging",
        name: "GTM — staging sandbox",
        source: "gtm",
        fields: { gtm_container: "GTM-5QF9D02", gtm_env: "latest" },
        eventMap: [],
        createdAt: "2026-04-19"
      },
      {
        id: "cd_meta_pixel_main",
        name: "Meta Pixel — ACME Growth",
        source: "meta_pixel",
        fields: { pixel_id: "319847562103948" },
        eventMap: [],
        createdAt: "2026-03-15"
      }
    ]
  };

  // ----- State -----
  var state = load();
  var collapsed = {}; // provider id -> collapsed bool

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.rows)) {
          // migrate old single-default model → per-provider defaults
          if (!parsed.defaults) {
            parsed.defaults = { facebook: null, google: null, gtm: null, meta_pixel: null };
            if (parsed.defaultId) {
              var dr = parsed.rows.find(function (x) { return x.id === parsed.defaultId; });
              if (dr) parsed.defaults[dr.source] = dr.id;
            }
          }
          if (!parsed.defaults.meta_pixel && seed.defaults.meta_pixel) {
            parsed.defaults.meta_pixel = seed.defaults.meta_pixel;
          }
          parsed.rows.forEach(function (r) {
            if (!r.landerEventMap && defaultLanderEventMap(r.source)) {
              r.landerEventMap = defaultLanderEventMap(r.source);
            }
            if (r.source === "google" && r.fields && r.fields.g_action_id && r.landerEventMap) {
              var legacyAction = r.fields.g_action_id;
              ["visit", "impression", "click"].forEach(function (key) {
                if (r.landerEventMap[key] && !r.landerEventMap[key].conversionActionId) {
                  r.landerEventMap[key].conversionActionId = legacyAction;
                }
              });
              delete r.fields.g_action_id;
            }
          });
          if (!parsed.rows.some(function (r) { return r.id === "cd_taboola_main"; })) {
            var tb = seed.rows.find(function (r) { return r.id === "cd_taboola_main"; });
            if (tb) parsed.rows.push(JSON.parse(JSON.stringify(tb)));
          }
          if (!parsed.defaults.taboola && seed.defaults.taboola) {
            parsed.defaults.taboola = seed.defaults.taboola;
          }
          if (!parsed.rows.some(function (r) { return r.id === "cd_meta_pixel_main"; })) {
            var mp = seed.rows.find(function (r) { return r.id === "cd_meta_pixel_main"; });
            if (mp) parsed.rows.push(JSON.parse(JSON.stringify(mp)));
          }
          return parsed;
        }
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(seed));
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function infoTip(html) {
    return '<span class="info-tip info-tip--sm" tabindex="0">' +
      '<span class="info-tip__icon">i</span>' +
      '<span class="info-tip__body">' + html + '</span></span>';
  }
  function newId() {
    return "cd_" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  }

  // ----- DOM refs -----
  var body = document.getElementById("cd-body");
  var emptyEl = document.getElementById("cd-empty");
  var tableScroll = body && body.closest(".table-scroll");
  var formDlg = document.getElementById("dialog-cd-form");
  var formTitle = document.getElementById("cd-form-title");
  var formHint = document.getElementById("cd-form-hint");
  var editIdIn = document.getElementById("cd-edit-id");
  var nameIn = document.getElementById("cd-name");
  var setDefaultIn = document.getElementById("cd-set-default");
  var saveBtn = document.getElementById("cd-save-btn");
  var testBtn = document.getElementById("cd-test-btn");
  var deleteDlg = document.getElementById("dialog-cd-delete");
  var deleteMsg = document.getElementById("cd-delete-msg");
  var deleteBtn = document.getElementById("cd-delete-confirm");
  var deletePending = null;

  // ----- Provider thumbs (table) -----
  var SOURCE_LABEL = {
    facebook: { name: "Meta", short: "Meta" },
    google:   { name: "Google Ads", short: "Google" },
    taboola:  { name: "Taboola", short: "Taboola" },
    gtm:      { name: "Google Tag Manager", short: "GTM" },
    meta_pixel: { name: "Meta Pixel", short: "Pixel" }
  };
  var SOURCE_THUMB = {
    facebook: '<span class="cd-thumb cd-thumb--facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></span>',
    google: '<span class="cd-thumb cd-thumb--google"><svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.3-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-1 .6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H2.8v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H2.8a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.1 14.7 2.2 12 2.2A10 10 0 0 0 2.8 7.5l3.6 2.6C7.2 7.8 9.4 6.1 12 6.1z"/></svg></span>',
    taboola: '<span class="cd-thumb cd-thumb--taboola" style="background:#1652DA;color:#fff;font-weight:700;font-size:12px">Tb</span>',
    gtm: '<span class="cd-thumb cd-thumb--gtm"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l10 10-10 10L2 12z" fill="#8AB4F8"/><path d="M12 7l5 5-5 5-5-5z" fill="#4285F4"/></svg></span>',
    meta_pixel: '<span class="cd-thumb cd-thumb--facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></span>'
  };

  function idsCell(row) {
    if (row.source === "facebook") {
      return '<div class="cd-ids">' +
        '<code>pixel ' + escapeHtml(row.fields.fb_pixel_id || "—") + '</code>' +
        '<small>action_source · ' + escapeHtml(row.fields.fb_action_source || "website") + '</small>' +
      '</div>';
    }
    if (row.source === "google") {
      return '<div class="cd-ids">' +
        '<code>' + escapeHtml(row.fields.g_tag_id || row.fields.g_customer_id || "—") + '</code>' +
        '<small>' + escapeHtml(row.fields.g_customer_id || "") + '</small>' +
      '</div>';
    }
    if (row.source === "taboola") {
      return '<div class="cd-ids">' +
        '<code>acct ' + escapeHtml(row.fields.tb_account_id || "—") + '</code>' +
        '<small>S2S · Taboola</small>' +
      '</div>';
    }
    if (row.source === "gtm") {
      return '<div class="cd-ids">' +
        '<code>' + escapeHtml(row.fields.gtm_container || "—") + '</code>' +
        '<small>client-side · dataLayer</small>' +
      '</div>';
    }
    if (row.source === "meta_pixel") {
      return '<div class="cd-ids">' +
        '<code>pixel ' + escapeHtml(row.fields.pixel_id || "—") + '</code>' +
        '<small>client-side · fbq</small>' +
      '</div>';
    }
    return "—";
  }

  // Which landers each integration is applied to (prototype mapping by integration id)
  var APPLIED_LANDERS = {
    cd_meta_prod: ["Summer Sale", "Black Friday", "Founder Letter"],
    cd_meta_promo: ["Holiday Teaser"],
    cd_google_main: ["Referral Q2", "Partner Announce"],
    cd_taboola_main: ["Walk-in Tubs"],
    cd_gtm_main: ["Summer Sale", "Walk-in Tubs", "Fall Preview"],
    cd_gtm_staging: [],
    cd_meta_pixel_main: ["Summer Sale", "Black Friday"]
  };
  function landersCell(row) {
    var ls = APPLIED_LANDERS[row.id] || [];
    if (!ls.length) return '<span class="cd-applied cd-applied--none">Not applied yet</span>';
    var img = window.nexusLanderImage || function () { return "img/lander-1.png"; };
    var shown = ls.slice(0, 5);
    var extra = ls.length - shown.length;
    var stack = shown.map(function (n, i) {
      return '<span class="cd-appl-thumb" style="background-image:url(\'' + img(n) + '\');z-index:' + (10 - i) + '" title="' + escapeHtml(n) + '"></span>';
    }).join("");
    return '<div class="cd-applied" title="' + escapeHtml(ls.join(", ")) + '">' +
      '<span class="cd-appl-stack">' + stack + '</span>' +
      '<span class="cd-appl-count">' + ls.length + (ls.length === 1 ? " lander" : " landers") + '</span>' +
    '</div>';
  }

  function eventsCell(row) {
    var chips = [];
    if (row.landerEventMap) {
      LANDER_EVENT_KEYS.forEach(function (ev) {
        var m = row.landerEventMap[ev.key];
        if (m && m.enabled) chips.push(ev.key);
      });
    }
    var adv = (row.eventMap || []).map(function (m) {
      return '<code><span class="cd-events__from">' + escapeHtml(m.from) + '</span>' +
             '<span class="cd-events__arrow">→</span>' +
             '<span class="cd-events__to">' + escapeHtml(m.to) + '</span></code>';
    }).join("");
    if (!chips.length && !adv) return '<span class="muted" style="font-size:11px">—</span>';
    var landerHtml = chips.length
      ? '<span class="cd-events-lander" title="Lander-level events enabled">' + chips.map(function (c) {
          return '<code class="cd-events-lander__tag">' + escapeHtml(c) + '</code>';
        }).join("") + '</span>'
      : "";
    return '<div class="cd-events">' + landerHtml + adv + '</div>';
  }

  function defaultCell(row) {
    if (state.defaults && state.defaults[row.source] === row.id) {
      return '<span class="cd-default" title="Default for ' + escapeHtml((SOURCE_LABEL[row.source] || {}).name || row.source) + ' in this workspace">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>Default</span>';
    }
    return '<button type="button" class="cd-make-default js-cd-default" data-id="' + row.id + '">Make default</button>';
  }

  // ----- Render -----
  function render() {
    if (!body) return;
    var rows = state.rows || [];
    if (!rows.length) {
      body.innerHTML = "";
      if (tableScroll) tableScroll.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (tableScroll) tableScroll.hidden = false;
    if (emptyEl) emptyEl.hidden = true;

    var GROUP_ORDER = ["facebook", "google", "taboola", "gtm"];
    function rowHtml(r) {
      return '<tr class="cd-acct-row" data-group="' + r.source + '"' + (collapsed[r.source] ? ' hidden' : '') + '>' +
        '<td>' +
          '<div class="cd-name-cell">' +
            (SOURCE_THUMB[r.source] || "") +
            '<div>' +
              '<button type="button" class="dsk-row-name js-cd-edit" data-id="' + r.id + '" title="Edit integration"><strong>' + escapeHtml(r.name) + '</strong></button>' +
              '<small class="cd-id">' + escapeHtml(r.id) + '</small>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td>' + idsCell(r) + '</td>' +
        '<td>' + landersCell(r) + '</td>' +
        '<td>' + defaultCell(r) + '</td>' +
        '<td class="right"><div class="actions">' +
          '<button type="button" class="icon-btn js-cd-edit" data-id="' + r.id + '" title="Edit" aria-label="Edit">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>' +
          '</button>' +
          '<button type="button" class="icon-btn js-cd-del" data-id="' + r.id + '" title="Delete" aria-label="Delete">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>' +
          '</button>' +
        '</div></td>' +
      '</tr>';
    }

    var html = "";
    GROUP_ORDER.forEach(function (src) {
      var grp = rows.filter(function (r) { return r.source === src; });
      if (!grp.length) return;
      var label = SOURCE_LABEL[src] || { name: src };
      var n = grp.length;
      var isCol = !!collapsed[src];
      html += '<tr class="cd-group-row' + (isCol ? ' is-collapsed' : '') + '" data-toggle-group="' + src + '"><td colspan="5">' +
        '<div class="cd-group-head">' +
          '<svg class="cd-group-chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>' +
          (SOURCE_THUMB[src] || "") +
          '<span class="cd-group-name">' + escapeHtml(label.name) + '</span>' +
          '<span class="cd-group-count">' + n + (n === 1 ? " account" : " accounts") + '</span>' +
        '</div>' +
        '</td></tr>';
      html += grp.map(rowHtml).join("");
    });
    body.innerHTML = html;
  }

  // ----- Dialog: provider switching -----
  function setSourceInDialog(src) {
    var groups = document.querySelectorAll("[data-source-fields]");
    groups.forEach(function (g) { g.hidden = g.getAttribute("data-source-fields") !== src; });
    var btns = document.querySelectorAll(".cd-prov");
    btns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-source") === src)); });
    formDlg.setAttribute("data-source", src);
    var isClientPixel = src === "gtm" || src === "meta_pixel";
    var isBuySource = src === "facebook" || src === "google" || src === "taboola";
    var landerSec = document.querySelector("[data-lander-events-section]");
    var advSec = document.querySelector("[data-adv-events-section]");
    var emSec = document.querySelector("[data-adv-events-section]");
    var defSec = document.querySelector("[data-default-section]");
    if (landerSec) landerSec.hidden = !isBuySource;
    if (advSec) advSec.hidden = isClientPixel;
    if (defSec) defSec.hidden = isClientPixel;
    var provName = ({ facebook: "Meta (Facebook)", google: "Google Ads", taboola: "Taboola", gtm: "Google Tag Manager", meta_pixel: "Meta Pixel" })[src] || "Integration";
    var eyebrow = document.getElementById("cd-eyebrow");
    if (eyebrow) eyebrow.textContent = provName;

    // Swap the dialog header icon to the provider logo
    var iconEl = document.querySelector("#form-cd .dskp__icon");
    if (iconEl) {
      iconEl.style.background = "#fff";
      iconEl.innerHTML = ({
        facebook: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#1877F2"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>',
        google:   '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.3-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-1 .6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H2.8v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H2.8a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.1 14.7 2.2 12 2.2A10 10 0 0 0 2.8 7.5l3.6 2.6C7.2 7.8 9.4 6.1 12 6.1z"/></svg>',
        taboola: '<svg viewBox="0 0 24 24" width="22" height="22"><text x="5" y="17" fill="#1652DA" font-size="14" font-weight="700">Tb</text></svg>',
        gtm:      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 2l10 10-10 10L2 12z" fill="#8AB4F8"/><path d="M12 7l5 5-5 5-5-5z" fill="#4285F4"/></svg>',
        meta_pixel: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#1877F2"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>'
      })[src] || '';
    }

    // Update event-map header to reflect chosen destination
    var labelMap = {
      facebook: { name: "Meta event name", sub: 'platform · <code>event_name</code>' },
      google:   { name: "Google conversion", sub: 'platform · <code>conversion_action</code>' },
      taboola:  { name: "Taboola event name", sub: 'Realize · <code>name</code> (exact match)' },
      gtm:      { name: "dataLayer event", sub: 'pushed client-side · <code>event</code>' }
    };
    var l = labelMap[src] || labelMap.facebook;
    // Client-side pixels have no server-side test — relabel the action button
    if (testBtn) {
      var tlbl = isClientPixel ? (src === "gtm" ? "Verify with Tag Assistant" : "Verify pixel") : "Send test event";
      testBtn.innerHTML = (isClientPixel
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>') + " " + tlbl;
    }
    var nameEl = document.querySelector("[data-source-event-label]");
    var subEl = document.querySelector("[data-source-event-sub]");
    if (nameEl) nameEl.textContent = l.name;
    if (subEl) subEl.innerHTML = l.sub;
    var landerDestLbl = document.querySelector("[data-lander-event-dest-label]");
    if (landerDestLbl) landerDestLbl.textContent = l.name;

    // Re-render existing rows so destination dropdowns reflect the new buy source
    if (eventMapEl && eventMapEl.children.length) {
      rerenderEventMapPreservingValues();
    }
    if (landerEventsEl) {
      var cur = collectLanderEventMap();
      renderLanderEventMap(cur && Object.keys(cur).length ? cur : null);
    }
  }

  document.querySelectorAll(".cd-prov").forEach(function (b) {
    b.addEventListener("click", function () { setSourceInDialog(b.getAttribute("data-source")); });
  });

  // ----- Lander-level events editor -----
  var landerEventsEl = document.getElementById("cd-lander-events");

  var LANDER_DEST_OPTIONS = {
    facebook: ["PageView", "ViewContent", "InitiateCheckout", "Lead", "Contact", "AddToCart"],
    google: ["page_view", "view_content", "cta_click", "lead_offline", "purchase_offline"],
    taboola: ["page_view", "view_content", "cta_click", "lead", "purchase"]
  };

  function isCustomSelectValue(val) {
    return val === CUSTOM_SELECT_VALUE;
  }

  function buildPresetSelectOptions(presets, selectedValue, includeEmpty) {
    var opts = includeEmpty ? '<option value=""></option>' : "";
    var inList = selectedValue && presets.indexOf(selectedValue) !== -1;
    var isCustom = selectedValue && !inList;
    presets.forEach(function (v) {
      opts += '<option value="' + escapeHtml(v) + '"' + (v === selectedValue ? " selected" : "") + '>' + escapeHtml(v) + '</option>';
    });
    opts += '<option value="' + CUSTOM_SELECT_VALUE + '"' + (isCustom ? " selected" : "") + '>Custom…</option>';
    return { optionsHtml: opts, isCustom: isCustom, customValue: isCustom ? selectedValue : "" };
  }

  function syncCustomFieldVisibility(selectEl, customInput) {
    if (!selectEl || !customInput) return;
    var show = isCustomSelectValue(selectEl.value);
    customInput.hidden = !show;
    customInput.required = show;
    if (!show) customInput.value = "";
  }

  function readMappedSelectValue(selectEl, customInput) {
    if (!selectEl) return "";
    if (isCustomSelectValue(selectEl.value)) {
      return customInput ? (customInput.value || "").trim() : "";
    }
    return (selectEl.value || "").trim();
  }

  function renderLanderEventRow(evKey, evLabel, evHint, data) {
    var src = currentSource();
    var opts = LANDER_DEST_OPTIONS[src] || [];
    var built = buildPresetSelectOptions(opts, data.eventName || "", false);
    var isGoogle = src === "google";
    var googleSub = isGoogle
      ? '<div class="cd-lander-card__sub">' +
          '<div class="cd-lander-card__field">' +
            '<span class="cd-lander-card__lbl">Conversion label ' + infoTip("Client tag: <code>gtag('event','conversion',&#123; send_to:'AW-…/label' &#125;)</code>") + '</span>' +
            '<input type="text" class="cd-em-custom" data-lander="conversionLabel" placeholder="AbC-D_efG-h" value="' + escapeHtml(data.conversionLabel || "") + '" />' +
          '</div>' +
          '<div class="cd-lander-card__field">' +
            '<span class="cd-lander-card__lbl">Conversion action ' + infoTip("Server upload resource: <code>customers/…/conversionActions/…</code>") + '</span>' +
            '<input type="text" class="cd-em-custom" data-lander="conversionActionId" placeholder="customers/…/conversionActions/…" value="' + escapeHtml(data.conversionActionId || "") + '" />' +
          '</div>' +
        '</div>'
      : "";
    return '<div class="cd-lander-card' + (isGoogle ? " cd-lander-card--google" : "") + '" data-lander-key="' + escapeHtml(evKey) + '">' +
      '<div class="cd-lander-card__head">' +
        '<div class="cd-lander-card__event"><strong>' + escapeHtml(evLabel) + '</strong><small>' + escapeHtml(evHint) + '</small></div>' +
        '<div class="cd-lander-card__dest-wrap">' +
          '<select class="cd-em-select cd-lander-row__dest" data-lander="eventName">' + built.optionsHtml + '</select>' +
          '<input type="text" class="cd-em-custom cd-lander-row__custom" data-lander="eventNameCustom" placeholder="Custom event name" value="' + escapeHtml(built.customValue) + '"' + (built.isCustom ? "" : " hidden") + ' />' +
        '</div>' +
        '<label class="cd-lander-toggle"><input type="checkbox" data-lander="enabled"' + (data.enabled ? " checked" : "") + ' /><span class="cd-lander-toggle__ui"></span></label>' +
      '</div>' +
      googleSub +
    '</div>';
  }

  function renderLanderEventMap(map) {
    if (!landerEventsEl) return;
    var src = currentSource();
    var defaults = defaultLanderEventMap(src) || {};
    var m = map || defaults;
    landerEventsEl.innerHTML = LANDER_EVENT_KEYS.map(function (ev) {
      var d = m[ev.key] || defaults[ev.key] || { enabled: false, eventName: "" };
      return renderLanderEventRow(ev.key, ev.label, ev.hint, d);
    }).join("");
    landerEventsEl.querySelectorAll(".cd-lander-card").forEach(function (row) {
      syncCustomFieldVisibility(
        row.querySelector('[data-lander="eventName"]'),
        row.querySelector('[data-lander="eventNameCustom"]')
      );
    });
  }

  function collectLanderEventMap() {
    if (!landerEventsEl) return null;
    var out = {};
    landerEventsEl.querySelectorAll(".cd-lander-card").forEach(function (row) {
      var key = row.getAttribute("data-lander-key");
      var en = row.querySelector('[data-lander="enabled"]');
      var nm = row.querySelector('[data-lander="eventName"]');
      var custom = row.querySelector('[data-lander="eventNameCustom"]');
      var entry = {
        enabled: !!(en && en.checked),
        eventName: readMappedSelectValue(nm, custom)
      };
      var labelIn = row.querySelector('[data-lander="conversionLabel"]');
      if (labelIn) entry.conversionLabel = (labelIn.value || "").trim();
      var actionIn = row.querySelector('[data-lander="conversionActionId"]');
      if (actionIn) entry.conversionActionId = (actionIn.value || "").trim();
      out[key] = entry;
    });
    return out;
  }

  if (landerEventsEl) {
    landerEventsEl.addEventListener("change", function (e) {
      var t = e.target;
      if (t.matches && t.matches('[data-lander="eventName"]')) {
        var row = t.closest(".cd-lander-card");
        syncCustomFieldVisibility(t, row ? row.querySelector('[data-lander="eventNameCustom"]') : null);
        if (isCustomSelectValue(t.value)) {
          var custom = row && row.querySelector('[data-lander="eventNameCustom"]');
          if (custom) custom.focus();
        }
      }
    });
  }

  // ----- Event map editor (advertiser-level) -----
  var eventMapEl = document.getElementById("cd-eventmap");
  var eventMapAdd = document.getElementById("cd-eventmap-add");

  // Destination events per buy source. Value-bearing events flagged with `v: true`.
  var DEST_EVENTS = {
    facebook: [
      { v: "Lead" },
      { v: "Purchase", value: true },
      { v: "CompleteRegistration" },
      { v: "Subscribe", value: true },
      { v: "StartTrial", value: true },
      { v: "ViewContent" },
      { v: "AddToCart", value: true },
      { v: "InitiateCheckout", value: true },
      { v: "AddPaymentInfo", value: true },
      { v: "Search" },
      { v: "AddToWishlist" },
      { v: "Contact" },
      { v: "Donate", value: true },
      { v: "Schedule" },
      { v: "SubmitApplication" }
    ],
    google: [
      { v: "Submit lead form", value: true },
      { v: "lead_offline" },
      { v: "purchase_offline", value: true },
      { v: "signup_offline" },
      { v: "trial_start_offline", value: true }
    ],
    taboola: [
      { v: "lead" },
      { v: "purchase", value: true },
      { v: "signup" }
    ],
    gtm: [
      { v: "page_view" },
      { v: "form_start" },
      { v: "form_submit" },
      { v: "cta_click" },
      { v: "purchase", value: true }
    ]
  };

  var ADV_EVENTS = ["lead", "purchase", "signup", "subscribe", "trial_start", "view_content", "add_to_cart", "initiate_checkout", "search", "install"];

  function currentSource() { return formDlg.getAttribute("data-source") || "facebook"; }

  function isValueEvent(dest, src) {
    var list = DEST_EVENTS[src || currentSource()] || [];
    var hit = list.find(function (e) { return e.v === dest; });
    return !!(hit && hit.value);
  }

  function renderGoogleAdvActionSubrow(m) {
    if (currentSource() !== "google") return "";
    return '<div class="cd-em-row__google">' +
      '<span class="cd-em-row__field-lbl">Conversion action ' + infoTip("Server upload: <code>customers/…/conversionActions/…</code>") + '</span>' +
      '<input type="text" class="cd-em-custom cd-em-action-id" data-em="conversionActionId" placeholder="customers/…/conversionActions/…" value="' + escapeHtml(m.conversionActionId || "") + '" />' +
    '</div>';
  }

  function renderEventMapRow(m) {
    var src = currentSource();
    var destList = DEST_EVENTS[src] || [];
    var destPresets = destList.map(function (e) { return e.v; });
    var advBuilt = buildPresetSelectOptions(ADV_EVENTS, m.from || "", true);
    var isCustomDest = m.to && destPresets.indexOf(m.to) === -1;
    var destOptions = '<option value=""></option>' + destList.map(function (e) {
      var label = e.v + (e.value ? "  (+ value)" : "");
      return '<option value="' + escapeHtml(e.v) + '"' + (e.v === m.to ? " selected" : "") + '>' + escapeHtml(label) + '</option>';
    }).join("");
    destOptions += '<option value="' + CUSTOM_SELECT_VALUE + '"' + (isCustomDest ? " selected" : "") + '>Custom…</option>';
    var showValue = isValueEvent(m.to, src);

    var val = m.value || {};
    var mode = val.mode === "static" ? "static" : "dynamic";
    var amount = val.amount != null ? String(val.amount) : "";
    var currency = val.currency || "USD";
    var staticDisabled = mode === "dynamic";

    return '<div class="cd-em-row" data-dest="' + escapeHtml(m.to || "") + '">' +
      '<div class="cd-em-row__head">' +
        '<div class="cd-em-select-wrap">' +
          '<select class="cd-em-select cd-em-select--adv" data-em="from">' + advBuilt.optionsHtml + '</select>' +
          '<input type="text" class="cd-em-custom" data-em="fromCustom" placeholder="Custom advertiser event" value="' + escapeHtml(advBuilt.customValue) + '"' + (advBuilt.isCustom ? "" : " hidden") + ' />' +
        '</div>' +
        '<span class="cd-em-arrow">→</span>' +
        '<div class="cd-em-select-wrap">' +
          '<select class="cd-em-select" data-em="to">' + destOptions + '</select>' +
          '<input type="text" class="cd-em-custom" data-em="toCustom" placeholder="Custom platform event" value="' + escapeHtml(isCustomDest ? (m.to || "") : "") + '"' + (isCustomDest ? "" : " hidden") + ' />' +
        '</div>' +
        '<button type="button" class="cd-eventmap__rm" aria-label="Remove">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>' +
        '</button>' +
      '</div>' +
      renderGoogleAdvActionSubrow(m) +
      (showValue ? renderValueSubrow(mode, amount, currency, staticDisabled) : "") +
    '</div>';
  }

  function renderValueSubrow(mode, amount, currency, staticDisabled) {
    return '<div class="cd-em-row__value">' +
      '<span class="cd-em-row__value-lbl">value ' + infoTip("Dynamic: from postback <code>value</code> + <code>currency</code>. Static: fixed amount.") + ':</span>' +
      '<div class="cd-em-mode" data-mode="' + mode + '">' +
        '<button type="button" class="cd-em-mode__btn" data-mode-set="dynamic"' + (mode === "dynamic" ? ' aria-pressed="true"' : '') + '>Dynamic</button>' +
        '<button type="button" class="cd-em-mode__btn" data-mode-set="static"' + (mode === "static" ? ' aria-pressed="true"' : '') + '>Static</button>' +
      '</div>' +
      '<input type="text" class="cd-em-amount" data-em="amount" value="' + escapeHtml(amount) + '" placeholder="' + (staticDisabled ? "from postback" : "65.00") + '"' + (staticDisabled ? ' disabled' : '') + ' inputmode="decimal" />' +
      '<select class="cd-em-currency" data-em="currency"' + (staticDisabled ? ' disabled' : '') + '>' +
        ["USD","EUR","GBP","INR","CAD","AUD","JPY"].map(function (c) {
          return '<option value="' + c + '"' + (c === currency ? " selected" : "") + '>' + c + '</option>';
        }).join("") +
      '</select>' +
    '</div>';
  }

  function renderEventMap(pairs) {
    if (!eventMapEl) return;
    var rows = pairs && pairs.length ? pairs : [{ from: "", to: "" }];
    eventMapEl.innerHTML = rows.map(renderEventMapRow).join("");
    eventMapEl.querySelectorAll(".cd-em-row").forEach(function (row) {
      syncCustomFieldVisibility(row.querySelector('[data-em="from"]'), row.querySelector('[data-em="fromCustom"]'));
      syncCustomFieldVisibility(row.querySelector('[data-em="to"]'), row.querySelector('[data-em="toCustom"]'));
    });
  }

  function rerenderEventMapPreservingValues() {
    var collected = collectEventMap();
    renderEventMap(collected.length ? collected : [{ from: "", to: "" }]);
  }

  if (eventMapAdd) {
    eventMapAdd.addEventListener("click", function () {
      var div = document.createElement("div");
      div.innerHTML = renderEventMapRow({ from: "", to: "" });
      var node = div.firstChild;
      eventMapEl.appendChild(node);
      var firstSel = node.querySelector("select");
      if (firstSel) firstSel.focus();
    });
  }
  if (eventMapEl) {
    // Remove row
    eventMapEl.addEventListener("click", function (e) {
      var rm = e.target.closest(".cd-eventmap__rm");
      if (rm) {
        var row = rm.closest(".cd-em-row");
        if (row && eventMapEl.querySelectorAll(".cd-em-row").length > 1) row.remove();
        else if (row) {
          row.querySelectorAll("select").forEach(function (s) { s.value = ""; });
          var sub = row.querySelector(".cd-em-row__value");
          if (sub) sub.remove();
          var gsub = row.querySelector(".cd-em-row__google");
          if (gsub) {
            var act = gsub.querySelector('[data-em="conversionActionId"]');
            if (act) act.value = "";
          }
        }
        return;
      }
      // Mode toggle (Static / Dynamic)
      var modeBtn = e.target.closest(".cd-em-mode__btn");
      if (modeBtn) {
        var mode = modeBtn.getAttribute("data-mode-set");
        var row = modeBtn.closest(".cd-em-row");
        var amt = row.querySelector('[data-em="amount"]');
        var cur = row.querySelector('[data-em="currency"]');
        row.querySelectorAll(".cd-em-mode__btn").forEach(function (b) { b.removeAttribute("aria-pressed"); });
        modeBtn.setAttribute("aria-pressed", "true");
        row.querySelector(".cd-em-mode").setAttribute("data-mode", mode);
        var dyn = mode === "dynamic";
        if (amt) { amt.disabled = dyn; amt.placeholder = dyn ? "from postback" : "65.00"; }
        if (cur) cur.disabled = dyn;
      }
    });
    // Re-render row when destination event changes (might add/remove value subrow)
    eventMapEl.addEventListener("change", function (e) {
      var t = e.target;
      if (t.matches && t.matches('[data-em="from"]')) {
        var row = t.closest(".cd-em-row");
        syncCustomFieldVisibility(t, row ? row.querySelector('[data-em="fromCustom"]') : null);
        if (isCustomSelectValue(t.value)) {
          var custom = row && row.querySelector('[data-em="fromCustom"]');
          if (custom) custom.focus();
        }
        return;
      }
      if (t.matches && t.matches('[data-em="to"]')) {
        var row = t.closest(".cd-em-row");
        syncCustomFieldVisibility(t, row ? row.querySelector('[data-em="toCustom"]') : null);
        if (isCustomSelectValue(t.value)) {
          var customTo = row && row.querySelector('[data-em="toCustom"]');
          if (customTo) customTo.focus();
        }
        var sub = row.querySelector(".cd-em-row__value");
        var resolvedTo = readMappedSelectValue(t, row.querySelector('[data-em="toCustom"]'));
        var should = isValueEvent(resolvedTo, currentSource());
        if (should && !sub) {
          var valueHtml = renderValueSubrow("dynamic", "", "USD", true);
          var googleSub = row.querySelector(".cd-em-row__google");
          if (googleSub) googleSub.insertAdjacentHTML("afterend", valueHtml);
          else row.insertAdjacentHTML("beforeend", valueHtml);
        } else if (!should && sub) {
          sub.remove();
        }
        row.setAttribute("data-dest", resolvedTo || "");
      }
    });
  }

  function collectEventMap() {
    if (!eventMapEl) return [];
    var out = [];
    eventMapEl.querySelectorAll(".cd-em-row").forEach(function (r) {
      var from = readMappedSelectValue(r.querySelector('[data-em="from"]'), r.querySelector('[data-em="fromCustom"]'));
      var to = readMappedSelectValue(r.querySelector('[data-em="to"]'), r.querySelector('[data-em="toCustom"]'));
      if (!from || !to) return;
      var entry = { from: from, to: to };
      var actionIn = r.querySelector('[data-em="conversionActionId"]');
      if (actionIn && (actionIn.value || "").trim()) {
        entry.conversionActionId = actionIn.value.trim();
      }
      var sub = r.querySelector(".cd-em-row__value");
      if (sub && isValueEvent(to)) {
        var mode = sub.querySelector(".cd-em-mode").getAttribute("data-mode") || "dynamic";
        var amount = parseFloat(sub.querySelector('[data-em="amount"]').value);
        var currency = sub.querySelector('[data-em="currency"]').value;
        if (mode === "static" && !isNaN(amount)) {
          entry.value = { mode: "static", amount: amount, currency: currency };
        } else {
          entry.value = { mode: "dynamic" };
        }
      }
      out.push(entry);
    });
    return out;
  }

  // ----- Token helpers (paste / show) -----
  document.querySelectorAll("[data-token-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      var input = document.getElementById(b.getAttribute("data-target"));
      if (!input) return;
      var showing = input.type === "text";
      input.type = showing ? "password" : "text";
      b.setAttribute("aria-pressed", String(!showing));
      var lbl = b.querySelector("[data-token-toggle-label]");
      if (lbl) lbl.textContent = showing ? "Show" : "Hide";
    });
  });
  document.querySelectorAll("[data-token-paste]").forEach(function (b) {
    b.addEventListener("click", function () {
      var input = document.getElementById(b.getAttribute("data-target"));
      if (!input || !navigator.clipboard || !navigator.clipboard.readText) return;
      navigator.clipboard.readText().then(function (t) { if (t) input.value = t; }).catch(function () {});
    });
  });

  // ----- Open / fill dialog -----
  function fillFormForRow(r) {
    setSourceInDialog(r ? r.source : "facebook");
    nameIn.value = r ? r.name : "";
    document.getElementById("cd-fb-pixel").value = r && r.source === "facebook" ? (r.fields.fb_pixel_id || "") : "";
    document.getElementById("cd-fb-action-source").value = r && r.source === "facebook" ? (r.fields.fb_action_source || "website") : "website";
    document.getElementById("cd-fb-token").value = r && r.source === "facebook" ? "" : "";
    document.getElementById("cd-fb-token").placeholder = r && r.source === "facebook" && r.fields.fb_token_ref ? "Leave blank to keep existing token (vault ref)" : "EAAB••••••••••••••••";
    document.getElementById("cd-g-tag").value = r && r.source === "google" ? (r.fields.g_tag_id || "") : "";
    document.getElementById("cd-g-customer").value = r && r.source === "google" ? (r.fields.g_customer_id || "") : "";
    document.getElementById("cd-g-token").value = "";
    document.getElementById("cd-g-token").placeholder = r && r.source === "google" && r.fields.g_token_ref ? "Leave blank to keep existing token (vault ref)" : "1//••••••••••••••••";
    if (document.getElementById("cd-tb-account")) {
      document.getElementById("cd-tb-account").value = r && r.source === "taboola" ? (r.fields.tb_account_id || "") : "";
    }
    document.getElementById("cd-gtm-container").value = r && r.source === "gtm" ? (r.fields.gtm_container || "") : "";
    if (document.getElementById("cd-gtm-env")) document.getElementById("cd-gtm-env").value = r && r.source === "gtm" ? (r.fields.gtm_env || "live") : "live";
    if (document.getElementById("cd-meta-pixel-id")) document.getElementById("cd-meta-pixel-id").value = r && r.source === "meta_pixel" ? (r.fields.pixel_id || "") : "";
    renderLanderEventMap(r ? r.landerEventMap : null);
    renderEventMap(r ? r.eventMap : [
      { from: "lead", to: "Lead" },
      { from: "purchase", to: "Purchase" }
    ]);
    setDefaultIn.checked = r ? (state.defaults && state.defaults[r.source] === r.id) : false;
  }

  function openAdd(src) {
    editIdIn.value = "";
    formTitle.textContent = "Add integration";
    formHint.textContent = "Connect this account so landers in the workspace can use it.";
    fillFormForRow(null);
    if (src) setSourceInDialog(src);
    if (document.getElementById("cd-test-panel")) document.getElementById("cd-test-panel").hidden = true;
    formDlg.showModal();
  }
  function openEdit(id) {
    var r = state.rows.find(function (x) { return x.id === id; });
    if (!r) return;
    editIdIn.value = id;
    formTitle.textContent = "Edit destination";
    formHint.textContent = "Update credentials and event mappings.";
    fillFormForRow(r);
    if (document.getElementById("cd-test-panel")) document.getElementById("cd-test-panel").hidden = true;
    formDlg.showModal();
  }

  // ----- Save -----
  document.getElementById("form-cd").addEventListener("submit", function (e) {
    e.preventDefault();
    var src = formDlg.getAttribute("data-source") || "facebook";
    var nm = (nameIn.value || "").trim();
    if (!nm) { nameIn.focus(); return; }

    var fields = {};
    if (src === "facebook") {
      fields.fb_pixel_id = document.getElementById("cd-fb-pixel").value.trim();
      fields.fb_action_source = document.getElementById("cd-fb-action-source").value;
      var newTok = document.getElementById("cd-fb-token").value.trim();
      if (newTok) fields.fb_token_ref = "secret://vault/meta/" + nm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    } else if (src === "google") {
      fields.g_tag_id = document.getElementById("cd-g-tag").value.trim();
      fields.g_customer_id = document.getElementById("cd-g-customer").value.trim();
      var newTokG = document.getElementById("cd-g-token").value.trim();
      if (newTokG) fields.g_token_ref = "secret://vault/google/" + nm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    } else if (src === "taboola") {
      fields.tb_account_id = document.getElementById("cd-tb-account").value.trim();
      fields.tb_token_ref = "secret://vault/taboola/" + nm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    } else if (src === "gtm") {
      fields.gtm_container = document.getElementById("cd-gtm-container").value.trim();
      fields.gtm_env = document.getElementById("cd-gtm-env").value;
    } else if (src === "meta_pixel") {
      fields.pixel_id = document.getElementById("cd-meta-pixel-id").value.trim();
    }

    var id = editIdIn.value;
    if (id) {
      var r = state.rows.find(function (x) { return x.id === id; });
      if (r) {
        r.name = nm;
        // Preserve existing secret refs when token field left blank
        var prevFields = r.fields || {};
        ["fb_token_ref", "g_token_ref", "tb_token_ref"].forEach(function (k) {
          if (prevFields[k] && fields[k] == null) fields[k] = prevFields[k];
        });
        r.source = src;
        r.fields = fields;
        r.landerEventMap = collectLanderEventMap();
        r.eventMap = collectEventMap();
      }
    } else {
      var nid = newId();
      state.rows.push({
        id: nid,
        name: nm,
        source: src,
        fields: fields,
        landerEventMap: collectLanderEventMap(),
        eventMap: collectEventMap(),
        createdAt: new Date().toISOString().slice(0, 10)
      });
      if (setDefaultIn.checked || !(state.defaults && state.defaults[src])) {
        state.defaults = state.defaults || {};
        state.defaults[src] = nid;
      }
    }
    if (id && setDefaultIn.checked) {
      var er = state.rows.find(function (x) { return x.id === id; });
      if (er) { state.defaults = state.defaults || {}; state.defaults[er.source] = id; }
    }
    save();
    render();
    formDlg.close();
  });

  // ----- Test event (collapsible panel + mock response) -----
  var testPanel = document.getElementById("cd-test-panel");
  var testResult = document.getElementById("cd-test-result");
  var testClose = document.getElementById("cd-test-close");
  var testRun = document.getElementById("cd-test-run");
  var testEventSel = document.getElementById("cd-test-event");

  function openTestPanel() {
    if (!testPanel) return;
    testPanel.hidden = false;
    testResult.hidden = true;
    testResult.innerHTML = "";
    // Pre-fill event dropdown with mapped destination events
    var dest = formDlg.getAttribute("data-source") || "facebook";
    var defaults = {
      facebook: ["Lead", "Purchase", "ViewContent", "AddToCart", "CompleteRegistration"],
      google:   ["lead_offline", "purchase_offline", "signup_offline"],
      gtm:      ["page_view", "form_submit", "cta_click", "purchase"]
    }[dest];
    // Add any mapped event names from the current editor
    var mapped = [];
    document.querySelectorAll('#cd-eventmap [data-em="to"]').forEach(function (i) {
      var v = (i.value || "").trim();
      if (v && mapped.indexOf(v) === -1) mapped.push(v);
    });
    var list = mapped.length ? mapped : defaults;
    testEventSel.innerHTML = list.map(function (v) {
      return '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>';
    }).join("");
    // Scroll into view
    setTimeout(function () { testPanel.scrollIntoView({ behavior: "smooth", block: "end" }); }, 30);
  }

  if (testBtn) {
    testBtn.addEventListener("click", function () {
      // GTM: there's no server fire to test — send users to Tag Assistant to verify dataLayer
      if ((formDlg.getAttribute("data-source") || "") === "gtm") {
        window.open("https://chromewebstore.google.com/detail/tag-assistant/kejbdjndbnbjgmefkgdddjlbokphdefk?hl=en", "_blank", "noopener");
        return;
      }
      if (testPanel.hidden) { openTestPanel(); }
      else { testPanel.hidden = true; testResult.hidden = true; }
    });
  }
  if (testClose) {
    testClose.addEventListener("click", function () { testPanel.hidden = true; });
  }

  function highlightJson(obj) {
    var s = JSON.stringify(obj, null, 2);
    return escapeHtml(s)
      .replace(/(&quot;)([^&]+?)(&quot;)(\s*:)/g, '<span class="json-key">$1$2$3</span>$4')
      .replace(/:\s*(&quot;)(.*?)(&quot;)/g, ': <span class="json-str">$1$2$3</span>')
      .replace(/:\s*(\d+(?:\.\d+)?)/g, ': <span class="json-num">$1</span>');
  }

  if (testRun) {
    testRun.addEventListener("click", function () {
      var src = formDlg.getAttribute("data-source") || "facebook";
      var ev = testEventSel.value;
      var code = (document.getElementById("cd-test-code").value || "").trim();
      var val = parseFloat(document.getElementById("cd-test-value").value) || 0;
      var cur = document.getElementById("cd-test-currency").value;
      var conversionId = "cv_" + Math.random().toString(36).slice(2, 12);

      var orig = testRun.innerHTML;
      testRun.disabled = true;
      testRun.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 4v4M12 16v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4 12h4M16 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" opacity="0.6"/></svg> Sending…';

      setTimeout(function () {
        testRun.disabled = false;
        testRun.innerHTML = orig;

        var payload, response, endpoint;
        if (src === "facebook") {
          endpoint = "POST graph.facebook.com/v18.0/" + (document.getElementById("cd-fb-pixel").value || "<pixel_id>") + "/events";
          payload = {
            data: [{
              event_id: conversionId,
              event_name: ev,
              event_time: Math.floor(Date.now() / 1000),
              action_source: document.getElementById("cd-fb-action-source").value || "website",
              user_data: {
                fbc: "fb.1.1775171734000.IwY2xjawQp...",
                fbp: "fb.1.1775171734000.1234567890",
                client_ip_address: "107.21.28.235",
                client_user_agent: "Mozilla/5.0 (test)"
              },
              custom_data: { value: val, currency: cur }
            }],
            test_event_code: code || undefined
          };
          response = {
            events_received: 1,
            messages: [],
            fbtrace_id: "A" + Math.random().toString(36).slice(2, 13).toUpperCase()
          };
        } else if (src === "google") {
          var landerMap = collectLanderEventMap() || {};
          var googleAction = (landerMap[ev] && landerMap[ev].conversionActionId)
            || (landerMap.visit && landerMap.visit.conversionActionId)
            || (landerMap.click && landerMap.click.conversionActionId)
            || "<action>";
          endpoint = "POST googleads.googleapis.com/v15/customers/" + (document.getElementById("cd-g-customer").value || "<cid>") + ":uploadClickConversions";
          payload = {
            conversions: [{
              conversion_action: googleAction,
              conversion_date_time: new Date().toISOString().replace("T", " ").slice(0, 19) + "+00:00",
              conversion_value: val,
              currency_code: cur,
              order_id: conversionId,
              gclid: "EAIa-test-gclid-1234567890"
            }],
            partial_failure_enabled: true
          };
          response = {
            results: [{
              gclid: "EAIa-test-gclid-1234567890",
              conversion_action: payload.conversions[0].conversion_action
            }],
            partial_failure_error: null
          };
        } else {
          endpoint = "dataLayer.push() · " + (document.getElementById("cd-gtm-container").value || "GTM-XXXXXXX");
          payload = {
            event: ev,
            value: val,
            currency: cur,
            conversion_id: conversionId
          };
          response = { pushed: true, dataLayer_length: 7 + Math.floor(Math.random() * 5) };
        }

        testResult.hidden = false;
        testResult.innerHTML =
          '<div class="cd-test__result-head">' +
            '<span class="dskp__pill dskp__pill--ok"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>200 OK</span>' +
            '<span class="cd-test__meta"><span>conversion_id <b>' + escapeHtml(conversionId) + '</b></span><span>latency <b>' + (180 + Math.floor(Math.random() * 240)) + 'ms</b></span></span>' +
          '</div>' +
          '<div style="padding:8px 12px 4px; font-size:11px; color:var(--text-muted); font-family:\'JetBrains Mono\', ui-monospace, monospace;">' + escapeHtml(endpoint) + '</div>' +
          '<div class="cd-test__body">' +
            '<div class="cd-test__pane"><div class="cd-test__pane-title">Request payload</div><pre class="cd-test__pre">' + highlightJson(payload) + '</pre></div>' +
            '<div class="cd-test__pane"><div class="cd-test__pane-title">Response</div><pre class="cd-test__pre">' + highlightJson(response) + '</pre></div>' +
          '</div>';
      }, 700);
    });
  }

  // ----- Table interactions -----
  if (body) {
    body.addEventListener("click", function (e) {
      var t;
      var grp = e.target.closest("[data-toggle-group]");
      if (grp) {
        var src = grp.getAttribute("data-toggle-group");
        collapsed[src] = !collapsed[src];
        render();
        return;
      }
      if ((t = e.target.closest(".js-cd-edit"))) { openEdit(t.getAttribute("data-id")); return; }
      if ((t = e.target.closest(".js-cd-default"))) {
        var did = t.getAttribute("data-id");
        var dr = state.rows.find(function (x) { return x.id === did; });
        if (dr) { state.defaults = state.defaults || {}; state.defaults[dr.source] = did; }
        save(); render();
        return;
      }
      if ((t = e.target.closest(".js-cd-del"))) {
        deletePending = t.getAttribute("data-id");
        var r = state.rows.find(function (x) { return x.id === deletePending; });
        if (!r) return;
        var isDefault = state.defaults && state.defaults[r.source] === r.id;
        deleteMsg.innerHTML =
          'You are about to delete <strong>' + escapeHtml(r.name) + '</strong>. ' +
          'Landers inheriting this destination ' +
          (isDefault ? 'will fall back to whatever you set as the new workspace default.' : 'are unaffected.') +
          ' This cannot be undone.';
        deleteDlg.showModal();
      }
    });
  }
  if (deleteBtn) {
    deleteBtn.addEventListener("click", function () {
      if (!deletePending) { deleteDlg.close(); return; }
      state.rows = state.rows.filter(function (x) { return x.id !== deletePending; });
      if (state.defaults) {
        Object.keys(state.defaults).forEach(function (src) {
          if (state.defaults[src] === deletePending) {
            var next = state.rows.find(function (x) { return x.source === src; });
            state.defaults[src] = next ? next.id : null;
          }
        });
      }
      deletePending = null;
      save();
      render();
      deleteDlg.close();
    });
  }

  // ----- Add buttons → open browse catalog -----
  var browseDlg = document.getElementById("dialog-cd-browse");
  function openBrowse() { if (browseDlg) { renderBrowse(); browseDlg.showModal(); } }
  var addBtn = document.getElementById("cd-add-top");
  var addEmpty = document.getElementById("cd-add-empty");
  if (addBtn) addBtn.addEventListener("click", openBrowse);
  if (addEmpty) addEmpty.addEventListener("click", openBrowse);

  // ----- Browse catalog -----
  var CATALOG = [
    { id: "facebook", name: "Meta (Facebook)", cat: "ads", desc: "Server-side conversions via CAPI (pixel + token).", connectable: true,
      logo: '<span class="cd-thumb cd-thumb--facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></span>' },
    { id: "google", name: "Google Ads", cat: "ads", desc: "Offline conversion upload to Google Ads.", connectable: true,
      logo: '<span class="cd-thumb cd-thumb--google"><svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.3-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-1 .6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H2.8v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H2.8a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.1 14.7 2.2 12 2.2A10 10 0 0 0 2.8 7.5l3.6 2.6C7.2 7.8 9.4 6.1 12 6.1z"/></svg></span>' },
    { id: "gtm", name: "Google Tag Manager", cat: "tag", desc: "Client-side behavioral events on your landers.", connectable: true,
      logo: '<span class="cd-thumb cd-thumb--gtm"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l10 10-10 10L2 12z" fill="#8AB4F8"/><path d="M12 7l5 5-5 5-5-5z" fill="#4285F4"/></svg></span>' },
    { id: "meta_pixel", name: "Meta Pixel", cat: "tag", desc: "Browser pixel for PageView and on-site events (fbq).", connectable: true,
      logo: '<span class="cd-thumb cd-thumb--facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></span>' },
    { id: "taboola", name: "Taboola", cat: "ads", desc: "Visit, impression, and click to Taboola (S2S + tag).", connectable: true,
      logo: '<span class="cd-thumb cd-thumb--taboola" style="background:#1652DA">Tb</span>' },
    { id: "ga4", name: "Google Analytics 4", cat: "tag", desc: "Measurement Protocol events.", connectable: false,
      logo: '<span class="cd-thumb" style="background:#E8710A;color:#fff;font-weight:700">GA</span>' }
  ];
  var CAT_LABEL = { all: "All integrations", ads: "Buy sources", tag: "Client-side pixels" };
  var browseState = { cat: "all", q: "" };

  function connectedSources() {
    var set = {};
    (state.rows || []).forEach(function (r) { set[r.source] = true; });
    return set;
  }
  function browseFiltered() {
    var conn = connectedSources();
    return CATALOG.filter(function (it) {
      if (browseState.cat === "connected" && !conn[it.id]) return false;
      if (browseState.cat !== "all" && browseState.cat !== "connected" && it.cat !== browseState.cat) return false;
      if (browseState.q) {
        var b = (it.name + " " + it.desc).toLowerCase();
        if (b.indexOf(browseState.q.toLowerCase()) === -1) return false;
      }
      return true;
    });
  }
  function renderBrowseCounts() {
    var conn = connectedSources();
    var counts = { all: CATALOG.length, connected: Object.keys(conn).length, ads: 0, tag: 0 };
    CATALOG.forEach(function (it) { if (counts[it.cat] != null) counts[it.cat]++; });
    document.querySelectorAll("#brws-nav .brws__cat-count").forEach(function (el) {
      el.textContent = counts[el.getAttribute("data-count")] || 0;
    });
  }
  function renderBrowse() {
    renderBrowseCounts();
    var list = document.getElementById("brws-list");
    if (!list) return;
    var conn = connectedSources();
    var rows = browseFiltered();
    if (!rows.length) { list.innerHTML = '<div class="brws__empty">No integrations match.</div>'; return; }
    list.innerHTML = rows.map(function (it) {
      var isConn = conn[it.id];
      var action = it.connectable
        ? '<button type="button" class="brws__add" data-add="' + it.id + '"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>Add account</button>'
        : '<span class="brws__soon">Soon</span>';
      return '<div class="brws__item">' +
        it.logo +
        '<div class="brws__item-txt"><div class="brws__item-name">' + escapeHtml(it.name) +
          (isConn ? ' <span class="brws__connected">Connected</span>' : '') + '</div>' +
          '<div class="brws__item-desc">' + escapeHtml(it.desc) + '</div></div>' +
        action +
      '</div>';
    }).join("");
  }
  (function wireBrowse() {
    var nav = document.getElementById("brws-nav");
    var search = document.getElementById("brws-search");
    var list = document.getElementById("brws-list");
    if (nav) nav.addEventListener("click", function (e) {
      var b = e.target.closest(".brws__cat");
      if (!b) return;
      browseState.cat = b.getAttribute("data-cat");
      nav.querySelectorAll(".brws__cat").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      renderBrowse();
    });
    if (search) search.addEventListener("input", function () { browseState.q = search.value; renderBrowse(); });
    if (list) list.addEventListener("click", function (e) {
      var add = e.target.closest("[data-add]");
      if (!add) return;
      if (browseDlg) browseDlg.close();
      openAdd(add.getAttribute("data-add"));
    });
  })();

  // ----- Close dialog wires up via existing app.js [data-close-dialog] handler -----

  // initial paint
  render();
})();

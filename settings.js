// Settings page — Conversion destinations (workspace catalog).
// Prototype only — state in localStorage so toggles persist across navigation.

(function () {
  var STORAGE_KEY = "nexus.cd.v2";

  // ----- Defaults / seed data -----
  var seed = {
    defaults: { facebook: "cd_meta_prod", google: "cd_google_main", gtm: "cd_gtm_main" },
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
        eventMap: [
          { from: "lead", to: "Lead" },
          { from: "purchase", to: "Purchase" },
          { from: "view_content", to: "ViewContent" }
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
        createdAt: "2026-04-22"
      },
      {
        id: "cd_google_main",
        name: "Google Ads — main",
        source: "google",
        fields: {
          g_customer_id: "284-619-7723",
          g_action_id: "customers/2846197723/conversionActions/8841502",
          g_token_ref: "secret://vault/google/acme-main"
        },
        eventMap: [
          { from: "lead", to: "lead_offline" },
          { from: "purchase", to: "purchase_offline" }
        ],
        createdAt: "2026-04-04"
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
            parsed.defaults = { facebook: null, google: null, gtm: null };
            if (parsed.defaultId) {
              var dr = parsed.rows.find(function (x) { return x.id === parsed.defaultId; });
              if (dr) parsed.defaults[dr.source] = dr.id;
            }
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
    gtm:      { name: "Google Tag Manager", short: "GTM" }
  };
  var SOURCE_THUMB = {
    facebook: '<span class="cd-thumb cd-thumb--facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></span>',
    google: '<span class="cd-thumb cd-thumb--google"><svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.3-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-1 .6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H2.8v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H2.8a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.1 14.7 2.2 12 2.2A10 10 0 0 0 2.8 7.5l3.6 2.6C7.2 7.8 9.4 6.1 12 6.1z"/></svg></span>',
    gtm: '<span class="cd-thumb cd-thumb--gtm"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l10 10-10 10L2 12z" fill="#8AB4F8"/><path d="M12 7l5 5-5 5-5-5z" fill="#4285F4"/></svg></span>'
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
        '<code>' + escapeHtml(row.fields.g_customer_id || "—") + '</code>' +
        '<small>conv. action · ' + escapeHtml((row.fields.g_action_id || "").split("/").pop() || "—") + '</small>' +
      '</div>';
    }
    if (row.source === "gtm") {
      return '<div class="cd-ids">' +
        '<code>' + escapeHtml(row.fields.gtm_container || "—") + '</code>' +
        '<small>client-side · dataLayer</small>' +
      '</div>';
    }
    return "—";
  }

  // Which landers each integration is applied to (prototype mapping by integration id)
  var APPLIED_LANDERS = {
    cd_meta_prod: ["Summer Sale", "Black Friday", "Founder Letter"],
    cd_meta_promo: ["Holiday Teaser"],
    cd_google_main: ["Referral Q2", "Partner Announce"],
    cd_gtm_main: ["Summer Sale", "Walk-in Tubs", "Fall Preview"],
    cd_gtm_staging: []
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
    if (!row.eventMap || !row.eventMap.length) return '<span class="muted" style="font-size:11px">—</span>';
    var destLabel = ({ facebook: "Meta", google: "Google", gtm: "GTM" })[row.source] || "dest";
    return '<div class="cd-events" title="Advertiser event → ' + destLabel + ' event">' +
      row.eventMap.map(function (m) {
        return '<code><span class="cd-events__from">' + escapeHtml(m.from) + '</span>' +
               '<span class="cd-events__arrow">→</span>' +
               '<span class="cd-events__to">' + escapeHtml(m.to) + '</span></code>';
      }).join("") +
    '</div>';
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

    var GROUP_ORDER = ["facebook", "google", "gtm"];
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
    var isGtm = src === "gtm";
    var emSec = document.querySelector("[data-em-section]");
    var defSec = document.querySelector("[data-default-section]");
    if (emSec) emSec.hidden = isGtm;
    if (defSec) defSec.hidden = isGtm;
    var provName = ({ facebook: "Meta (Facebook)", google: "Google Ads", gtm: "Google Tag Manager" })[src] || "Integration";
    var eyebrow = document.getElementById("cd-eyebrow");
    if (eyebrow) eyebrow.textContent = provName;

    // Swap the dialog header icon to the provider logo
    var iconEl = document.querySelector("#form-cd .dskp__icon");
    if (iconEl) {
      iconEl.style.background = "#fff";
      iconEl.innerHTML = ({
        facebook: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#1877F2"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>',
        google:   '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.3-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-1 .6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H2.8v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H2.8a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.1 14.7 2.2 12 2.2A10 10 0 0 0 2.8 7.5l3.6 2.6C7.2 7.8 9.4 6.1 12 6.1z"/></svg>',
        gtm:      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 2l10 10-10 10L2 12z" fill="#8AB4F8"/><path d="M12 7l5 5-5 5-5-5z" fill="#4285F4"/></svg>'
      })[src] || '';
    }

    // Update event-map header to reflect chosen destination
    var labelMap = {
      facebook: { name: "Meta event name", sub: 'sent in CAPI · <code>event_name</code>' },
      google:   { name: "Google action name", sub: 'used in offline upload · <code>conversion_action</code>' },
      gtm:      { name: "dataLayer event", sub: 'pushed client-side · <code>event</code>' }
    };
    var l = labelMap[src] || labelMap.facebook;
    // GTM has no server-side test — relabel the action button
    if (testBtn) {
      var tlbl = isGtm ? "Verify with Tag Assistant" : "Send test event";
      var span = testBtn.querySelector("span");
      testBtn.innerHTML = (isGtm
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>') + " " + tlbl;
    }
    var nameEl = document.querySelector("[data-source-event-label]");
    var subEl = document.querySelector("[data-source-event-sub]");
    if (nameEl) nameEl.textContent = l.name;
    if (subEl) subEl.innerHTML = l.sub;

    // Re-render existing rows so destination dropdowns reflect the new buy source
    if (eventMapEl && eventMapEl.children.length) {
      rerenderEventMapPreservingValues();
    }
  }

  document.querySelectorAll(".cd-prov").forEach(function (b) {
    b.addEventListener("click", function () { setSourceInDialog(b.getAttribute("data-source")); });
  });

  // ----- Event map editor -----
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
      { v: "lead_offline" },
      { v: "purchase_offline", value: true },
      { v: "signup_offline" },
      { v: "trial_start_offline", value: true }
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

  function renderEventMapRow(m) {
    var src = currentSource();
    var destList = DEST_EVENTS[src] || [];
    var advOptions = '<option value=""></option>' + ADV_EVENTS.map(function (v) {
      return '<option value="' + escapeHtml(v) + '"' + (v === m.from ? " selected" : "") + '>' + escapeHtml(v) + '</option>';
    }).join("");
    if (m.from && ADV_EVENTS.indexOf(m.from) === -1) {
      advOptions = '<option value="' + escapeHtml(m.from) + '" selected>' + escapeHtml(m.from) + '</option>' + advOptions;
    }
    var destOptions = '<option value=""></option>' + destList.map(function (e) {
      var label = e.v + (e.value ? "  (+ value)" : "");
      return '<option value="' + escapeHtml(e.v) + '"' + (e.v === m.to ? " selected" : "") + '>' + escapeHtml(label) + '</option>';
    }).join("");

    var showValue = isValueEvent(m.to, src);
    var val = m.value || {};
    var mode = val.mode === "static" ? "static" : "dynamic";
    var amount = val.amount != null ? String(val.amount) : "";
    var currency = val.currency || "USD";
    var staticDisabled = mode === "dynamic";

    return '<div class="cd-em-row" data-dest="' + escapeHtml(m.to || "") + '">' +
      '<div class="cd-em-row__head">' +
        '<select class="cd-em-select cd-em-select--adv" data-em="from">' + advOptions + '</select>' +
        '<span class="cd-em-arrow">→</span>' +
        '<select class="cd-em-select" data-em="to">' + destOptions + '</select>' +
        '<button type="button" class="cd-eventmap__rm" aria-label="Remove">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>' +
        '</button>' +
      '</div>' +
      (showValue ? renderValueSubrow(mode, amount, currency, staticDisabled) : "") +
    '</div>';
  }

  function renderValueSubrow(mode, amount, currency, staticDisabled) {
    return '<div class="cd-em-row__value">' +
      '<span class="cd-em-row__value-lbl">value:</span>' +
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
      (staticDisabled ? '<span class="cd-em-row__hint">Uses <code>value</code> + <code>currency</code> from the postback at fire time.</span>' : '') +
    '</div>';
  }

  function renderEventMap(pairs) {
    if (!eventMapEl) return;
    var rows = pairs && pairs.length ? pairs : [{ from: "", to: "" }];
    eventMapEl.innerHTML = rows.map(renderEventMapRow).join("");
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
        var hint = row.querySelector(".cd-em-row__hint");
        if (dyn && !hint) {
          var span = document.createElement("span");
          span.className = "cd-em-row__hint";
          span.innerHTML = "Uses <code>value</code> + <code>currency</code> from the postback at fire time.";
          row.querySelector(".cd-em-row__value").appendChild(span);
        } else if (!dyn && hint) {
          hint.remove();
        }
      }
    });
    // Re-render row when destination event changes (might add/remove value subrow)
    eventMapEl.addEventListener("change", function (e) {
      var t = e.target;
      if (t.matches && t.matches('[data-em="to"]')) {
        var row = t.closest(".cd-em-row");
        var sub = row.querySelector(".cd-em-row__value");
        var should = isValueEvent(t.value);
        if (should && !sub) {
          row.insertAdjacentHTML("beforeend", renderValueSubrow("dynamic", "", "USD", true));
        } else if (!should && sub) {
          sub.remove();
        }
        row.setAttribute("data-dest", t.value || "");
      }
    });
  }

  function collectEventMap() {
    if (!eventMapEl) return [];
    var out = [];
    eventMapEl.querySelectorAll(".cd-em-row").forEach(function (r) {
      var from = (r.querySelector('[data-em="from"]').value || "").trim();
      var to = (r.querySelector('[data-em="to"]').value || "").trim();
      if (!from || !to) return;
      var entry = { from: from, to: to };
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
    document.getElementById("cd-g-customer").value = r && r.source === "google" ? (r.fields.g_customer_id || "") : "";
    document.getElementById("cd-g-action").value = r && r.source === "google" ? (r.fields.g_action_id || "") : "";
    document.getElementById("cd-g-token").value = "";
    document.getElementById("cd-g-token").placeholder = r && r.source === "google" && r.fields.g_token_ref ? "Leave blank to keep existing token (vault ref)" : "1//••••••••••••••••";
    document.getElementById("cd-gtm-container").value = r && r.source === "gtm" ? (r.fields.gtm_container || "") : "";
    if (document.getElementById("cd-gtm-env")) document.getElementById("cd-gtm-env").value = r && r.source === "gtm" ? (r.fields.gtm_env || "live") : "live";
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
    formHint.textContent = "Update name, identifiers, or rotate credentials. Leave token blank to keep the existing vault reference.";
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
      fields.g_customer_id = document.getElementById("cd-g-customer").value.trim();
      fields.g_action_id = document.getElementById("cd-g-action").value.trim();
      var newTokG = document.getElementById("cd-g-token").value.trim();
      if (newTokG) fields.g_token_ref = "secret://vault/google/" + nm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    } else if (src === "gtm") {
      fields.gtm_container = document.getElementById("cd-gtm-container").value.trim();
      fields.gtm_env = document.getElementById("cd-gtm-env").value;
    }

    var id = editIdIn.value;
    if (id) {
      var r = state.rows.find(function (x) { return x.id === id; });
      if (r) {
        r.name = nm;
        // Preserve existing secret refs when token field left blank
        var prevFields = r.fields || {};
        ["fb_token_ref", "g_token_ref"].forEach(function (k) {
          if (prevFields[k] && fields[k] == null) fields[k] = prevFields[k];
        });
        r.source = src;
        r.fields = fields;
        r.eventMap = collectEventMap();
      }
    } else {
      var nid = newId();
      state.rows.push({
        id: nid,
        name: nm,
        source: src,
        fields: fields,
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
          endpoint = "POST googleads.googleapis.com/v15/customers/" + (document.getElementById("cd-g-customer").value || "<cid>") + ":uploadClickConversions";
          payload = {
            conversions: [{
              conversion_action: document.getElementById("cd-g-action").value || "<action>",
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
    { id: "taboola", name: "Taboola", cat: "ads", desc: "S2S conversions for Taboola campaigns.", connectable: false,
      logo: '<span class="cd-thumb cd-thumb--taboola" style="background:#1652DA">Tb</span>' },
    { id: "ga4", name: "Google Analytics 4", cat: "tag", desc: "Measurement Protocol events.", connectable: false,
      logo: '<span class="cd-thumb" style="background:#E8710A;color:#fff;font-weight:700">GA</span>' }
  ];
  var CAT_LABEL = { all: "All integrations", ads: "Buy sources", tag: "Tracking platforms" };
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

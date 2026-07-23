/* Shared behaviours across nexus playground pages.
   Prototype only — nothing is persisted. */

(function () {
  // -------------------------------------------------------------------
  // Shared data layer — used by the global Spotlight search.
  // (In the real app this would come from the Base API; here it lives
  //  alongside app.js so every page gets the same index.)
  // -------------------------------------------------------------------
  var NEXUS_DATA = {
    landers: [
      { id: "summer-sale",      name: "Summer Sale",      url: "https://offers.acme.com/summer-sale-hero",  variants: [{ name: "Main hero" }, { name: "Urgency countdown" }] },
      { id: "referral-q2",      name: "Referral Q2",      url: "https://refer.acme.com/referral-q2",        variants: [{ name: "Single-field entry" }, { name: "Testimonial strip" }] },
      { id: "founder-letter",   name: "Founder Letter",   url: "https://offers.acme.com/founder-letter",    variants: [{ name: "Long form" }] },
      { id: "black-friday",     name: "Black Friday",     url: "https://offers.acme.com/black-friday-2026", variants: [{ name: "Orange bold" }] },
      { id: "spring-promo",     name: "Spring Promo",     url: "https://offers.acme.com/spring-promo",      variants: [{ name: "Main promo" }] },
      { id: "partner-announce", name: "Partner Announce", url: "https://try.acme.com/partner-announce",     variants: [{ name: "Press style" }] },
      { id: "walk-in-tubs",     name: "Walk-in Tubs",     url: "https://try.acme.com/walk-in-tubs",         variants: [{ name: "Bathtub safety lede" }, { name: "Senior testimonial" }] },
      { id: "fall-preview",     name: "Fall Preview",     url: "https://offers.acme.com/fall-preview",      variants: [{ name: "Cozy warm palette" }] },
      { id: "holiday-teaser",   name: "Holiday Teaser",   url: "https://offers.acme.com/holiday-teaser",    variants: [{ name: "Gift-led hero" }] },
      { id: "partner-pulse-draft", name: "Partner Pulse", url: "https://try.acme.com/partner-pulse", variants: [{ name: "V1 — Draft hero" }] }
    ],
    domains: [
      { name: "offers.acme.com", routes: ["/summer-sale-hero", "/founder-letter", "/black-friday-2026", "/spring-promo", "/fall-preview", "/holiday-teaser"] },
      { name: "refer.acme.com",  routes: ["/referral-q2"] },
      { name: "try.acme.com",    routes: ["/partner-announce", "/walk-in-tubs", "/partner-pulse"] },
      { name: "hub.acme.com",    routes: [] }
    ],
    offers: [
      { id: "hb-wis",  name: "Walk-in showers",  advertiserName: "Homebuddy",        vertical: "Home Services" },
      { id: "hb-wit",  name: "Walk-in Tubs",     advertiserName: "Homebuddy",        vertical: "Home Services" },
      { id: "hb-roof", name: "Roofing",          advertiserName: "Homebuddy",        vertical: "Home Services" },
      { id: "bv-vin",  name: "VIN Search",       advertiserName: "Beenverified",     vertical: "People Search" },
      { id: "bv-obit", name: "Obituary search",  advertiserName: "Beenverified",     vertical: "People Search" },
      { id: "sf-auto", name: "Auto Insurance",   advertiserName: "Smart Financials", vertical: "Finance" }
    ]
  };
  window.NEXUS_DATA = NEXUS_DATA;

  // Teams → workspaces (team selection comes BEFORE workspace).
  var TEAMS = [
    { id: "acme", name: "Acme Inc", workspaces: [
      { id: "acme-growth",      name: "ACME Growth",      sub: "12 landers · 4 domains" },
      { id: "acme-performance", name: "ACME Performance", sub: "7 landers · 2 domains" }
    ]},
    { id: "finedge", name: "FinanceEdge", workspaces: [
      { id: "finance-edge", name: "FinanceEdge", sub: "21 landers · 6 domains" },
      { id: "insights",     name: "Insights",    sub: "5 landers · 1 domain" }
    ]}
  ];
  function teamOf(wsId) {
    for (var i = 0; i < TEAMS.length; i++) {
      if (TEAMS[i].workspaces.some(function (w) { return w.id === wsId; })) return TEAMS[i];
    }
    return TEAMS[0];
  }
  function allWorkspaces() {
    var out = []; TEAMS.forEach(function (t) { out = out.concat(t.workspaces); }); return out;
  }

  // ---- Combined nested team→workspace multi-select ----
  // selection: null = all; else array of selected workspace ids
  var wsSelection = null;
  (function () {
    try {
      var raw = JSON.parse(localStorage.getItem("nexus:wsSel") || "null");
      if (Array.isArray(raw)) wsSelection = raw;
    } catch (e) {}
  })();
  function selIds() { return wsSelection ? wsSelection.slice() : allWorkspaces().map(function (w) { return w.id; }); }
  function isWsSel(id) { return !wsSelection || wsSelection.indexOf(id) !== -1; }
  function commitSel(arr) {
    var total = allWorkspaces().length;
    wsSelection = (arr.length >= total) ? null : arr;
    try { localStorage.setItem("nexus:wsSel", JSON.stringify(wsSelection)); } catch (e) {}
    var root = document.getElementById("scope-menu-root");
    if (root) { root.innerHTML = scopeMenuInner(); applyIndet(root); }
    var lbl = document.getElementById("scope-active-name");
    if (lbl) lbl.textContent = scopeLabel();
  }
  function scopeLabel() {
    if (!wsSelection) return "All workspaces";
    if (!wsSelection.length) return "None";
    if (wsSelection.length === 1) {
      var w = allWorkspaces().find(function (x) { return x.id === wsSelection[0]; });
      return w ? w.name : "1 workspace";
    }
    // whole-team shorthand
    var fullTeams = TEAMS.filter(function (t) { return t.workspaces.every(function (w) { return isWsSel(w.id); }); });
    if (fullTeams.length === 1 && wsSelection.length === fullTeams[0].workspaces.length) return fullTeams[0].name;
    return wsSelection.length + " workspaces";
  }
  function scopeMenuInner() {
    var html = '<div class="scope-menu__actions">' +
      '<button type="button" class="scope-act" data-scope-act="all">Select all</button>' +
      '<button type="button" class="scope-act" data-scope-act="none">Clear</button>' +
      '</div>';
    TEAMS.forEach(function (t) {
      var ids = t.workspaces.map(function (w) { return w.id; });
      var on = ids.every(isWsSel), some = ids.some(isWsSel);
      html += '<div class="scope-group">' +
        '<label class="scope-team"><input type="checkbox" data-scope-team="' + t.id + '"' +
          (on ? " checked" : "") + (!on && some ? ' data-indet="1"' : '') + ' />' +
          '<span>' + t.name + '</span></label>';
      t.workspaces.forEach(function (w) {
        html += '<label class="scope-ws"><input type="checkbox" data-scope-ws="' + w.id + '"' + (isWsSel(w.id) ? " checked" : "") + ' />' +
          '<span class="scope-ws__name">' + w.name + '</span></label>';
      });
      html += '</div>';
    });
    html += '<div class="ws-menu__sep"></div>' +
      '<div class="ws-menu__foot"><a href="#" class="js-new-workspace">＋ New Workspace</a><a href="settings.html">Manage</a></div>';
    return html;
  }
  function applyIndet(root) {
    if (!root) return;
    root.querySelectorAll('[data-indet="1"]').forEach(function (cb) { cb.indeterminate = true; });
  }

  // -------------------------------------------------------------------
  // Top strip (single source of truth for global chrome).
  // Layout: [Brand logo] · [Workspace name ▾] · [Page name]      [search · bell · avatar]
  // -------------------------------------------------------------------
  var strip = document.querySelector(".top-strip");
  if (strip && !strip.children.length) {
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem("nexus:ws") || "null"); } catch (e) {}

    // Detect the current page name from the sidebar's active link (fallback to filename).
    var pathFile = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var pageName = (function () {
      var a = document.querySelector(".sidebar .nav a.is-active");
      if (a) return (a.textContent || "").replace(/\s+/g, " ").trim();
      var file = pathFile.replace(".html", "");
      var map  = { "index": "Home", "landers": "Landers", "reports": "Reports", "offers": "Offers", "domains": "Domains", "logs": "Logs", "editor": "Editor" };
      return map[file] || (file.charAt(0).toUpperCase() + file.slice(1));
    })();

    var useNexusWordmark = pathFile === "domains.html" || pathFile === "offers.html";
    var brandAnchor =
      '<a href="index.html" class="top-brand' + (useNexusWordmark ? " top-brand--nexus" : "") + '" title="Home" aria-label="nexus">' +
        (useNexusWordmark
          ? '<img src="img/nexus-wordmark.png" alt="nexus" class="top-brand__img top-brand__img--nexus" width="120" height="32" decoding="async" />'
          : '<img src="img/nexus-logo.svg" alt="nexus" class="top-brand__img top-brand__img--mark" width="24" height="24" decoding="async" />') +
      "</a>";

    strip.innerHTML =
      '<div class="top-strip__left">' +
        brandAnchor +
        '<details class="ws pop" id="scope-pop">' +
          '<summary class="ws-switch" title="Filter teams & workspaces">' +
            '<span class="ws-name" id="scope-active-name">' + scopeLabel() + '</span>' +
            '<span class="ws-caret">▾</span>' +
          '</summary>' +
          '<div class="ws-menu ws-menu--scope" role="menu" id="scope-menu-root">' + scopeMenuInner() + '</div>' +
        '</details>' +
        '<span class="top-sep" aria-hidden="true">/</span>' +
        '<span class="top-page" id="top-page-name">' + pageName + '</span>' +
      '</div>' +
      '<div class="top-strip__right">' +
        '<button type="button" class="icon-btn" id="open-spotlight" title="Search (⌘K)" aria-label="Search">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
        '</button>' +
        '<button type="button" class="icon-btn" title="Notifications" aria-label="Notifications">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>' +
        '</button>' +
        '<div class="avatar" title="Kyle Foster">K</div>' +
      '</div>';

    document.querySelectorAll(".sidebar .brand-tile, .sidebar > .avatar").forEach(function (n) { n.remove(); });
    applyIndet(document.getElementById("scope-menu-root"));

    strip.addEventListener("click", function (ev) {
      if (ev.target.closest(".js-new-workspace")) {
        ev.preventDefault();
        var det0 = ev.target.closest("details.ws");
        if (det0) det0.removeAttribute("open");
        var dlg = document.getElementById("dialog-new-workspace");
        if (dlg) {
          var ni = document.getElementById("nw-name");
          if (ni) ni.value = "";
          if (typeof dlg.showModal === "function") dlg.showModal();
          if (ni) requestAnimationFrame(function () { ni.focus(); });
        }
        return;
      }
      // Select all / clear
      var act = ev.target.closest("[data-scope-act]");
      if (act) {
        ev.preventDefault();
        commitSel(act.getAttribute("data-scope-act") === "all" ? allWorkspaces().map(function (w) { return w.id; }) : []);
        return;
      }
    });

    // Nested checkbox changes
    strip.addEventListener("change", function (ev) {
      var set = selIds();
      var wsCb = ev.target.closest("[data-scope-ws]");
      var teamCb = ev.target.closest("[data-scope-team]");
      if (wsCb) {
        var id = wsCb.getAttribute("data-scope-ws");
        if (wsCb.checked) { if (set.indexOf(id) === -1) set.push(id); }
        else set = set.filter(function (x) { return x !== id; });
        commitSel(set);
      } else if (teamCb) {
        var t = TEAMS.find(function (x) { return x.id === teamCb.getAttribute("data-scope-team"); });
        var ids = t.workspaces.map(function (w) { return w.id; });
        if (teamCb.checked) ids.forEach(function (i) { if (set.indexOf(i) === -1) set.push(i); });
        else set = set.filter(function (x) { return ids.indexOf(x) === -1; });
        commitSel(set);
      }
    });
  }

  if (!document.getElementById("dialog-new-workspace")) {
    var nwDlg = document.createElement("dialog");
    nwDlg.id = "dialog-new-workspace";
    nwDlg.className = "modal modal--new-ws";
    nwDlg.innerHTML =
      '<div class="modal__inner">' +
        '<div class="modal__header">' +
          '<div><h2 class="modal__title">New workspace</h2>' +
          '<p class="modal__hint">Create a workspace for a team or campaign. You can rename or archive later.</p></div>' +
          '<button type="button" class="modal__close" data-close-dialog aria-label="Close">✕</button>' +
        '</div>' +
        '<div class="field"><label for="nw-name">Workspace name</label>' +
        '<input type="text" id="nw-name" placeholder="e.g. Q3 Performance" autocomplete="off" /></div>' +
        '<div class="modal__actions">' +
          '<button type="button" class="btn" data-close-dialog>Cancel</button>' +
          '<button type="button" class="btn btn--black" id="nw-create">＋ New Workspace</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(nwDlg);
    nwDlg.addEventListener("click", function (e) {
      if (e.target.closest("[data-close-dialog]")) nwDlg.close();
    });
    document.getElementById("nw-create").addEventListener("click", function () {
      var inp = document.getElementById("nw-name");
      var name = inp && inp.value.trim();
      if (!name) { if (inp) inp.focus(); return; }
      var id = "ws-" + Date.now();
      var firstTeam = TEAMS[0];
      firstTeam.workspaces.push({ id: id, name: name, sub: "0 landers · 0 domains" });
      if (wsSelection) wsSelection.push(id);
      var root = document.getElementById("scope-menu-root");
      if (root) root.innerHTML = scopeMenuInner();
      var lbl = document.getElementById("scope-active-name");
      if (lbl) lbl.textContent = scopeLabel();
      nwDlg.close();
    });
  }

  // Event logs — filter pills + expandable metadata rows
  document.addEventListener("click", function (e) {
    var pill = e.target.closest(".log-filter-pill");
    if (pill) {
      e.preventDefault();
      var filter = pill.getAttribute("data-filter") || "all";
      document.querySelectorAll(".log-filter-pill").forEach(function (p) {
        p.classList.toggle("is-active", p === pill);
      });
      document.querySelectorAll("tr[data-log-row]").forEach(function (row) {
        var ev = row.getAttribute("data-event");
        var match = filter === "all" || ev === filter;
        if (!match) {
          row.hidden = true;
          row.classList.remove("is-expanded");
          row.setAttribute("aria-expanded", "false");
          var ex = row.nextElementSibling;
          if (ex && ex.classList.contains("log-expand-row")) ex.hidden = true;
        } else {
          row.hidden = false;
          var ex2 = row.nextElementSibling;
          if (ex2 && ex2.classList.contains("log-expand-row")) ex2.hidden = !row.classList.contains("is-expanded");
        }
      });
      var note = document.querySelector(".logs-refresh-note");
      if (note) {
        var n = 0;
        document.querySelectorAll("tr[data-log-row]").forEach(function (r) { if (!r.hidden) n++; });
        note.textContent = n + " records · auto-refreshing";
      }
      var rangeEl = document.getElementById("logs-footer-range");
      if (rangeEl) {
        var total = document.querySelectorAll("tr[data-log-row]").length;
        var vis = 0;
        document.querySelectorAll("tr[data-log-row]").forEach(function (r) { if (!r.hidden) vis++; });
        rangeEl.innerHTML = "<strong>Showing " + (vis ? "1" : "0") + "–" + vis + " of " + total + "</strong>";
      }
      return;
    }

    var logRow = e.target.closest("tr[data-log-row]");
    if (logRow && !logRow.hidden) {
      var detail = logRow.nextElementSibling;
      if (detail && detail.classList.contains("log-expand-row")) {
        var opening = !logRow.classList.contains("is-expanded");
        logRow.classList.toggle("is-expanded", opening);
        logRow.setAttribute("aria-expanded", opening ? "true" : "false");
        detail.hidden = !opening;
      }
      return;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var logRow = e.target.closest("tr[data-log-row]");
    if (!logRow || logRow.hidden) return;
    var detail = logRow.nextElementSibling;
    if (!detail || !detail.classList.contains("log-expand-row")) return;
    e.preventDefault();
    var opening = !logRow.classList.contains("is-expanded");
    logRow.classList.toggle("is-expanded", opening);
    logRow.setAttribute("aria-expanded", opening ? "true" : "false");
    detail.hidden = !opening;
  });

  // Expand/collapse rows with chevron toggles
  document.addEventListener("click", function (e) {
    var toggle = e.target.closest(".lander-toggle, .js-domain-toggle");
    if (toggle) {
      var id = toggle.getAttribute("aria-controls");
      if (!id) return;
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      document.querySelectorAll('[data-parent="' + id + '"]').forEach(function (row) {
        row.hidden = open;
      });
      var nested = document.getElementById(id);
      if (nested) nested.hidden = open;
      var label = toggle.querySelector(".js-collapse-label");
      if (label) label.textContent = open ? "expand ▾" : "collapse ▴";
      var parentRow = toggle.closest("tr[data-lander-row]");
      if (parentRow) parentRow.classList.toggle("is-expanded", !open);
    }

    // Close any open <details class="pop"> when clicking outside
    var openPops = document.querySelectorAll("details.pop[open]");
    openPops.forEach(function (det) {
      if (!det.contains(e.target)) det.removeAttribute("open");
    });
  });

  // Tabs — click + deep-link via location hash (e.g. settings.html#integrations)
  var TAB_HASH_ALIASES = { integrations: "dest", destinations: "dest" };
  var TAB_HASH_CANONICAL = { dest: "integrations", general: "general", mcp: "mcp" };

  function resolveTabHash(hash) {
    var h = String(hash || "").replace(/^#/, "").trim().toLowerCase();
    if (!h) return null;
    return TAB_HASH_ALIASES[h] || h;
  }

  function hashForTabKey(key) {
    return TAB_HASH_CANONICAL[key] || key;
  }

  function syncTabHash(key) {
    if (!key) return;
    var hash = "#" + hashForTabKey(key);
    var next = location.pathname + location.search + hash;
    var current = location.pathname + location.search + location.hash;
    if (current === next) return;
    if (history.replaceState) history.replaceState(null, "", next);
    else location.hash = hash;
  }

  function panelsForTabGroup(group) {
    var scope = group.closest("[data-tabs]") || group;
    var inner = scope.querySelectorAll("[data-tab-panel]");
    if (inner.length) return inner;
    var parent = scope.parentElement;
    if (parent) return parent.querySelectorAll("[data-tab-panel]");
    return document.querySelectorAll("[data-tab-panel]");
  }

  function activateTabGroup(group, key) {
    if (!group || !key) return false;
    var buttons = group.querySelectorAll(".tab");
    var target = null;
    buttons.forEach(function (b) {
      if (b.getAttribute("data-tab") === key && !b.disabled) target = b;
    });
    if (!target) return false;
    var panels = panelsForTabGroup(group);
    buttons.forEach(function (b) { b.classList.toggle("is-active", b === target); });
    panels.forEach(function (p) {
      p.hidden = p.getAttribute("data-tab-panel") !== key;
    });
    return true;
  }

  function applyHashTab() {
    var key = resolveTabHash(location.hash);
    if (!key) return;
    document.querySelectorAll("[data-tabs]").forEach(function (group) {
      activateTabGroup(group, key);
    });
  }

  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var buttons = group.querySelectorAll(".tab");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-tab");
        if (activateTabGroup(group, key)) syncTabHash(key);
      });
    });
  });

  applyHashTab();
  window.addEventListener("hashchange", applyHashTab);

  // Chrome dialog tabs (Header / Footer / CMP)
  document.querySelectorAll(".chrome-tabs").forEach(function (tabs) {
    var btns = tabs.querySelectorAll(".chrome-tab");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-chrome-tab");
        btns.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        document.querySelectorAll(".chrome-panel").forEach(function (p) {
          p.classList.toggle("is-active", p.getAttribute("data-chrome-panel") === key);
        });
      });
    });
  });

  // Mock "Edit with AI" — append a comment to the active textarea
  document.querySelectorAll(".js-chrome-ai").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var targetId = btn.getAttribute("data-target");
      var input = document.getElementById(btn.getAttribute("data-input"));
      var ta = document.getElementById(targetId);
      if (!ta) return;
      var prompt = (input && input.value.trim()) || "make it cleaner";
      var stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      ta.value = ta.value.replace(/\n?<!-- nexus-ai:.*?-->\n?$/s, "");
      ta.value += "\n<!-- nexus-ai: \"" + prompt.replace(/-->/g, "--") + "\" applied at " + stamp + " (mocked by Opus 4.7) -->";
      if (input) input.value = "";
    });
  });

  // Close any <dialog> via close buttons
  document.querySelectorAll("[data-close-dialog]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dlg = btn.closest("dialog");
      if (dlg) dlg.close();
    });
  });

  // -------------------------------------------------------------------
  // Global Spotlight — ⌘K / Ctrl K / top-bar search icon.
  // Four sections: Create / Open / Act / Analyse.  Same illustrative example in every row desc.
  // -------------------------------------------------------------------
  var dlg = document.createElement("dialog");
  dlg.className = "spotlight";
  dlg.id = "dialog-spotlight";
  dlg.innerHTML =
    '<div class="spotlight__inner">' +
      '<div class="spotlight__input">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
        '<input id="spotlight-input" placeholder="Create, Open, Act, Analyse — try &lsquo;tub&rsquo;" autocomplete="off" />' +
        '<kbd>esc</kbd>' +
      '</div>' +
      '<div class="spotlight__body" id="spotlight-body"></div>' +
      '<div class="spotlight__foot">' +
        '<span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>' +
        '<span><kbd>↵</kbd> run</span>' +
        '<span><kbd>esc</kbd> close</span>' +
        '<span class="spotlight__foot-ai">AI search · Opus 4.7</span>' +
      '</div>' +
    '</div>';
  document.body.appendChild(dlg);

  var input   = dlg.querySelector("#spotlight-input");
  var body    = dlg.querySelector("#spotlight-body");
  var rows    = [];    // flat list of action rows, for keyboard nav
  var activeI = 0;

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function highlight(text, q) {
    var safe = escapeHtml(text);
    if (!q) return safe;
    var rx = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return safe.replace(rx, '<span class="match">$1</span>');
  }
  function includes(hay, needle) { return hay.toLowerCase().indexOf(needle) !== -1; }

  function open() {
    if (dlg.open) return;
    rows = []; activeI = 0;
    input.value = "";
    renderResults("");
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "true");
    setTimeout(function () { input.focus(); }, 10);
  }
  function close() { if (dlg.open) dlg.close(); }

  // ---------- Rendering ----------
  /** Same example copy on every row so the pattern is obvious (walk-in / bathtub demo). */
  var EX_TUB = "e.g. &lsquo;tub&rsquo;";

  function renderResults(query) {
    var q = query.trim().toLowerCase();
    body.innerHTML = "";
    rows = [];

    // CREATE ----------------------------------------------------------
    var createRows = [];
    if (q) {
      createRows.push({
        icon: "＋",
        title: "Create a new lander about <strong>&lsquo;" + escapeHtml(query.trim()) + "&rsquo;</strong>",
        desc:  "Opens the editor with this prompt · " + EX_TUB,
        hint:  "Create",
        action: function () { window.location.href = "editor.html?new=1&prompt=" + encodeURIComponent(query.trim()); }
      });
    } else {
      createRows.push({
        icon: "＋",
        title: "Create a new lander",
        desc:  "Blank editor, then describe your offer · " + EX_TUB,
        hint:  "Create",
        action: function () { window.location.href = "editor.html?new=1"; }
      });
    }
    renderSection("Create", createRows);

    // OPEN — navigate only
    var openRows = [];
    var openLanderShown = 0;
    var openLanderMax   = !q ? 5 : 50;
    NEXUS_DATA.landers.forEach(function (l) {
      var hitName = q && includes(l.name, q);
      var hitUrl  = q && includes(l.url, q);
      if ((!q || hitName || hitUrl) && openLanderShown < openLanderMax) {
        openLanderShown++;
        openRows.push({
          icon: "▦",
          title: "Open lander " + (hitName ? wrapMatch(l.name, q) : "<strong>" + escapeHtml(l.name) + "</strong>"),
          desc:  (hitUrl ? wrapMatch(l.url.replace(/^https?:\/\//, ""), q) : escapeHtml(l.url.replace(/^https?:\/\//, ""))) + " · " + EX_TUB,
          hint:  "Open",
          action: function () { window.location.href = "editor.html?name=" + encodeURIComponent(l.name); }
        });
      }
    });
    NEXUS_DATA.landers.forEach(function (l) {
      l.variants.forEach(function (v) {
        if (q && includes(v.name, q)) {
          openRows.push({
            icon: "◇",
            title: "Open variant " + wrapMatch(v.name, q),
            desc:  "in " + escapeHtml(l.name) + " · " + EX_TUB,
            hint:  "Open",
            action: function () { window.location.href = "editor.html?name=" + encodeURIComponent(l.name) + "&variant=" + encodeURIComponent(v.name); }
          });
        }
      });
    });
    var openOfferShown = 0;
    var openOfferMax   = !q ? 6 : 50;
    (NEXUS_DATA.offers || []).forEach(function (o) {
      var hitName = q && (includes(o.name, q) || includes(o.advertiserName, q));
      if ((!q || hitName) && openOfferShown < openOfferMax) {
        openOfferShown++;
        openRows.push({
          icon: "🏷",
          title: "Open offer " + (q && includes(o.name, q) ? wrapMatch(o.name, q) : "<strong>" + escapeHtml(o.name) + "</strong>"),
          desc:  escapeHtml(o.advertiserName) + " · " + escapeHtml(o.vertical) + " · Offers Wall · " + EX_TUB,
          hint:  "Open",
          action: function () { window.location.href = "offers.html?offer=" + encodeURIComponent(o.id); }
        });
      }
    });
    NEXUS_DATA.domains.forEach(function (d) {
      if (!d.routes.length) return;
      d.routes.forEach(function (r) {
        var full = d.name + r;
        var tubDemo = includes(full, "tub");
        if ((q && includes(full, q)) || (!q && tubDemo)) {
          openRows.push({
            icon: "◈",
            title: "Open route " + (q && includes(full, q) ? wrapMatch(full, q) : "<strong>" + escapeHtml(full) + "</strong>"),
            desc:  "Domains · " + escapeHtml(d.name) + " · " + EX_TUB,
            hint:  "Open",
            action: function () { window.location.href = "domains.html"; }
          });
        }
      });
    });
    if (q) {
      openRows.push({
        icon: "≡",
        title: "Filter all landers by &lsquo;" + escapeHtml(query.trim()) + "&rsquo;",
        desc:  "Landers table search · " + EX_TUB,
        hint:  "Open",
        action: function () { window.location.href = "landers.html?q=" + encodeURIComponent(query.trim()); }
      });
    }
    renderSection("Open", openRows.slice(0, 10));

    // ACT — configure / mutate (not navigation)
    var actRows = [];
    var actLanderShown = 0;
    var actLanderMax   = !q ? 5 : 50;
    NEXUS_DATA.landers.forEach(function (l) {
      var hitName = q && includes(l.name, q);
      var hitUrl  = q && includes(l.url, q);
      if ((!q || hitName || hitUrl) && actLanderShown < actLanderMax) {
        actLanderShown++;
        actRows.push({
          icon: "⚙",
          title: "Lander settings — " + (hitName ? wrapMatch(l.name, q) : "<strong>" + escapeHtml(l.name) + "</strong>"),
          desc:  "Integrations, macro URLs · editor · " + EX_TUB,
          hint:  "Act",
          action: function () { window.location.href = "editor.html?name=" + encodeURIComponent(l.name); }
        });
      }
    });
    NEXUS_DATA.landers.forEach(function (l) {
      l.variants.forEach(function (v) {
        if (q && includes(v.name, q)) {
          actRows.push({
            icon: "⚙",
            title: "Variant editor + Settings — " + wrapMatch(v.name, q),
            desc:  "in " + escapeHtml(l.name) + " · title, favicon, SEO · " + EX_TUB,
            hint:  "Act",
            action: function () { window.location.href = "editor.html?name=" + encodeURIComponent(l.name) + "&variant=" + encodeURIComponent(v.name); }
          });
        }
      });
    });
    var wantKeys   = !q || includes(q, "key") || includes(q, "ssl") || includes(q, "dns") || includes(q, "domain");
    var wantInteg  = !q || includes(q, "mcp") || includes(q, "integrat") || includes(q, "cursor") || includes(q, "claude");
    var wantAssets = !q || includes(q, "asset") || includes(q, "image") || includes(q, "upload") || includes(q, "gallery");
    if (wantKeys) {
      actRows.push({
        icon: "🔑",
        title: "Domain Service Keys",
        desc:  "Team-scoped keys · Domains tab · " + EX_TUB,
        hint:  "Act",
        action: function () { window.location.href = "domains.html"; }
      });
    }
    if (wantInteg) {
      actRows.push({
        icon: "🧩",
        title: "Integrations (MCP)",
        desc:  "Cursor / Claude · Platform MCP · " + EX_TUB,
        hint:  "Act",
        action: function () { window.location.href = "index.html"; }
      });
    }
    if (wantAssets) {
      actRows.push({
        icon: "🖼",
        title: "Assets library",
        desc:  "Workspace images & uploads · " + EX_TUB,
        hint:  "Act",
        action: function () { window.location.href = "index.html"; }
      });
    }
    renderSection("Act", actRows.slice(0, 10));

    // ANALYSE ---------------------------------------------------------
    var analyseRows = [];
    NEXUS_DATA.landers.forEach(function (l) {
      if (!q || includes(l.name, q) || includes(l.url, q)) {
        analyseRows.push({
          icon: "▲",
          title: "Analyse " + (q && includes(l.name, q) ? wrapMatch(l.name, q) : "<strong>" + escapeHtml(l.name) + "</strong>") + " in Reports",
          desc:  "Pre-filtered lander view · " + EX_TUB,
          hint:  "Analyse",
          action: function () { window.location.href = "reports.html?lander=" + encodeURIComponent(l.name); }
        });
      }
    });
    NEXUS_DATA.landers.forEach(function (l) {
      l.variants.forEach(function (v) {
        if (q && includes(v.name, q)) {
          analyseRows.push({
            icon: "▲",
            title: "Analyse variant " + wrapMatch(v.name, q) + " in Reports",
            desc:  "in " + escapeHtml(l.name) + " · " + EX_TUB,
            hint:  "Analyse",
            action: function () { window.location.href = "reports.html?lander=" + encodeURIComponent(l.name); }
          });
        }
      });
    });
    renderSection("Analyse", analyseRows.slice(0, 8));

    if (!rows.length) {
      body.innerHTML = '<div class="spotlight-empty">No matches. Try a different term — or hit <strong>↵</strong> to create one.</div>';
    }
    setActive(0);
  }

  function renderSection(label, items) {
    if (!items.length) return;
    var sec = document.createElement("div");
    sec.className = "spotlight-section";
    sec.innerHTML = '<div class="spotlight-section__title">' + label + '</div>';
    items.forEach(function (it) {
      var r = document.createElement("div");
      r.className = "spotlight-row";
      r.setAttribute("role", "option");
      r.innerHTML =
        '<span class="spotlight-row__icon">' + it.icon + '</span>' +
        '<span class="spotlight-row__text">' +
          '<div class="spotlight-row__title">' + it.title + '</div>' +
          '<div class="spotlight-row__desc">'  + it.desc  + '</div>' +
        '</span>' +
        '<span class="spotlight-row__hint">' + it.hint + '</span>';
      r.addEventListener("click", function () { it.action && it.action(); close(); });
      r.addEventListener("mouseenter", function () { setActive(rows.indexOf(r)); });
      sec.appendChild(r);
      rows.push(r);
      r.__action = it.action;
    });
    body.appendChild(sec);
  }

  function wrapMatch(text, q) {
    return '<strong>' + highlight(text, q) + '</strong>';
  }

  function setActive(i) {
    if (!rows.length) { activeI = 0; return; }
    if (i < 0) i = rows.length - 1;
    if (i >= rows.length) i = 0;
    rows.forEach(function (r, idx) { r.classList.toggle("is-active", idx === i); });
    activeI = i;
    var r = rows[activeI];
    if (r) r.scrollIntoView({ block: "nearest" });
  }

  // ---------- Events ----------
  input.addEventListener("input", function () { renderResults(input.value); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeI + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeI - 1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      var r = rows[activeI];
      if (r && r.__action) { r.__action(); close(); }
    }
  });
  // Close when clicking on the backdrop (outside .spotlight__inner)
  dlg.addEventListener("click", function (e) {
    if (e.target === dlg) close();
  });

  // Open via top-bar search icon (re-bind because it was injected)
  document.addEventListener("click", function (e) {
    if (e.target.closest("#open-spotlight")) { e.preventDefault(); open(); }
  });
  // Global ⌘K / Ctrl K shortcut
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (dlg.open) close(); else open();
    }
  });
})();

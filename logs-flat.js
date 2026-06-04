// Logs · Conversions (stitched) view — one row per conversion_id.
// Uses SEED_JOURNEYS from logs-journeys.js (window.NEXUS_JOURNEYS).
// Conversion-centric: only journeys that have a postback are shown.

(function () {
  var all = window.NEXUS_JOURNEYS;
  if (!all || !all.length) return;

  // All visits (with or without click/conversion). Drop orphan postbacks (no visit).
  var data = all.filter(function (j) { return j.visit; });

  // Presence flags — impression / click / conversion (deterministic spread)
  function presence(j) {
    var key = (j.visitId || (j.postback && j.postback.conversionId) || "");
    var h = 0; for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    var b = h % 10;
    var imp = (b !== 0 && b !== 7);          // ~20% have no impression
    var click = imp && (b !== 5) && !!(j.ctaForward || imp); // no impression ⇒ no click; b===5 ⇒ no click
    var conv = click && !!j.postback;        // conversion needs a click
    return { imp: imp, click: click, conv: conv };
  }
  function rowKey(j) { return j.visitId || (j.postback && j.postback.conversionId) || ""; }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmtTs(s) { return s ? (s.slice(0, 10) + " " + s.slice(11, 16)) : ""; }
  function fmtD(s) { return s ? s.slice(0, 10) : ""; }

  // ---- Realistic URL generation (deterministic per conversion) ----
  function seededRng(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
  }
  function hexStr(rng, n) {
    var s = "";
    for (var i = 0; i < n; i++) s += "0123456789abcdef"[Math.floor(rng() * 16)];
    return s;
  }
  function bigNum(rng) {
    var s = "1202";
    for (var i = 0; i < 14; i++) s += Math.floor(rng() * 10);
    return s;
  }
  function uuid(rng) {
    return hexStr(rng, 8) + "-" + hexStr(rng, 4) + "-" + hexStr(rng, 4) + "-" + hexStr(rng, 4) + "-" + hexStr(rng, 12);
  }
  function token(rng, n) {
    var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var s = "";
    for (var i = 0; i < n; i++) s += c[Math.floor(rng() * c.length)];
    return s;
  }

  // Entry URL — what the user landed on (campaign params from the buy source)
  function visitRawUrl(j) {
    if (!j.visit) return null;
    var base = "https://" + (j.visit.domain || "") + (j.visit.path || "");
    var rng = seededRng((j.postback && j.postback.conversionId || "") + "|entry");
    var c1 = bigNum(rng), c2 = bigNum(rng), c3 = bigNum(rng);
    var src = j.buySource;
    if (src === "google") {
      var gclid = token(rng, 90);
      return base + "?gclid=" + gclid + "&utm_medium=cpc&utm_source=google&utm_id=" + c1 +
        "&utm_content=" + c3 + "&utm_term=" + c2 + "&utm_campaign=" + c1;
    }
    if (src === "tiktok") {
      var ttclid = token(rng, 60);
      return base + "?ttclid=" + ttclid + "&utm_medium=paid&utm_source=tiktok&utm_id=" + c1 +
        "&utm_content=" + c3 + "&utm_campaign=" + c1;
    }
    var fbclid = "IwZXh0bgNhZW0BMABh" + token(rng, 120) + "_aem_" + token(rng, 22);
    return base + "?c1=" + c1 + "&c2=" + c2 + "&c3=" + c3 + "&fbclid=" + fbclid +
      "&utm_medium=paid&utm_source=fb&utm_id=" + c1 + "&utm_content=" + c3 +
      "&utm_term=" + c2 + "&utm_campaign=" + c1;
  }

  // Click URL — the tracker redirect we send the user to on CTA click
  function clickUrl(j) {
    var rng = seededRng((j.postback && j.postback.conversionId || "") + "|click");
    var adid = token(rng, 8);
    var akey = uuid(rng);
    var ppid = token(rng, 9).toUpperCase();
    var offerId = 2000 + Math.floor(rng() * 7000);
    var affId = 2000 + Math.floor(rng() * 1000);
    var purl = "https://" + (j.visit ? j.visit.domain : "house.bestlivingideas.com") + (j.visit ? j.visit.path : "/offer");
    var rurl = "https://www.mnbasd77.com/aff_c?offer_id=" + offerId + "&aff_id=" + affId +
      "&source=pfm&aff_sub={campaignid}&aff_sub2={publisherID}&aff_sub3={adID}&aff_click_id={clickID}&aff_sub4=gp_d&aff_sub5={matchedKeyword}";
    return "https://trk.pmsrv.co/v2/trk?adid=" + adid + "&akey=" + akey +
      "&rurl=" + encodeURIComponent(rurl) +
      "&cp1=&cp2=&cp3=&cp4=FormsShowersNexus&tpid=&tps=fb&ppid=" + ppid + "&pid=" + ppid +
      "&purl=" + purl;
  }

  // HTTP status from the destination fire
  function httpStatusOf(f) {
    if (!f) return null;
    if (f.status === "ok") return 200;
    if (f.status === "pending") return null;
    var code = f.response && f.response.error && f.response.error.code;
    if (code === 190) return 401;        // OAuth expired
    if (code === 100) return 400;        // bad params
    if (f.response && f.response.partial_failure_error) return 400; // Google click too old
    return f.httpCode || 400;
  }
  function respCell(j) {
    var f = j.destinationFire;
    if (!f) return '<span class="flat-resp flat-resp--none">No fire</span>';
    if (f.status === "pending") return '<span class="flat-resp flat-resp--wait"><span class="flat-resp__dot"></span>Queued</span>';
    var code = httpStatusOf(f);
    if (f.status === "ok") {
      return '<span class="flat-resp flat-resp--ok"><span class="flat-resp__dot"></span>' + code + ' OK</span>';
    }
    var msg = (f.response && f.response.error && f.response.error.message) ||
              (f.response && f.response.partial_failure_error && f.response.partial_failure_error.message) || "Failed";
    return '<span class="flat-resp flat-resp--err" title="' + escapeHtml(msg) + '"><span class="flat-resp__dot"></span>' + code + '</span>';
  }

  // Lander thumbnail — real screenshot, deterministic from name
  function thumbFor(name) {
    var img = (window.nexusLanderImage ? window.nexusLanderImage(name) : "img/lander-1.png");
    return '<span class="flat-thumb" style="background-image:url(\'' + img + '\')"></span>';
  }

  function landerCell(j) {
    if (!j.visit) return '<span class="flat-muted">— unknown —</span>';
    return '<div class="flat-lander">' + thumbFor(j.visit.lander) +
      '<div class="flat-lander__txt"><strong>' + escapeHtml(j.visit.lander) + '</strong></div></div>';
  }

  // ---- Per-stage field helpers ----
  var SOURCE_NAME = { facebook: "Meta", google: "Google", taboola: "Taboola", tiktok: "TikTok" };
  function clidOf(j) {
    var r = seededRng((j.postback && j.postback.conversionId || "") + "|entry");
    bigNum(r); bigNum(r); bigNum(r);
    if (j.buySource === "google") return token(r, 28);
    if (j.buySource === "tiktok") return "C0gO3" + token(r, 18);
    return "IwZXh0bgNhZW0" + token(r, 22);
  }
  function visitIdOf(j) {
    return (j.visit && j.visitId) ? j.visitId : "v_" + hexStr(seededRng(j.postback.conversionId), 8);
  }
  function variantOf(j) { return j.visit && j.visit.variant ? j.visit.variant : "—"; }
  function clickTimeOf(j) { return j.ctaForward ? j.ctaForward.ts : (j.visit ? j.visit.ts : ""); }
  function clickIdOf(j) {
    var r = seededRng((j.postback && j.postback.conversionId || "") + "|clickid");
    return "cl_" + hexStr(r, 10);
  }
  function fireTimeOf(j) { return (j.destinationFire && j.destinationFire.ts) ? j.destinationFire.ts : (j.destinationFire && j.destinationFire.queuedAt) || ""; }

  function sourceCell(j) {
    var s = j.buySource;
    if (!s) return '<span class="flat-muted">—</span>';
    var inner = ({
      facebook: '<span class="flat-src__logo flat-src__logo--facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></span>',
      google: '<span class="flat-src__logo flat-src__logo--google"><svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.3-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-1 .6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H2.8v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H2.8a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.1 14.7 2.2 12 2.2A10 10 0 0 0 2.8 7.5l3.6 2.6C7.2 7.8 9.4 6.1 12 6.1z"/></svg></span>',
      taboola: '<span class="flat-src__logo flat-src__logo--taboola">Tb</span>',
      tiktok: '<span class="flat-src__logo flat-src__logo--tiktok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3v3.5a4.5 4.5 0 0 0 4 4.5v3a7.5 7.5 0 0 1-4-1.2V16a5 5 0 1 1-5-5v3a2 2 0 1 0 2 2V3z"/></svg></span>'
    })[s] || "";
    return '<span class="flat-src">' + inner + '<span>' + escapeHtml(SOURCE_NAME[s] || s) + '</span></span>';
  }
  function destNameCell(j) {
    var f = j.destinationFire;
    if (!f) return '<span class="flat-muted">—</span>';
    return idCell(f.destinationId || "");
  }
  function plain(v) { return v ? '<span class="flat-mono">' + escapeHtml(v) + '</span>' : '<span class="flat-muted">—</span>'; }
  function valCell(j) {
    var p = j.postback; if (!p || !p.value) return '<span class="flat-muted">—</span>';
    return '<span class="flat-mono">' + escapeHtml(p.currency || "") + " " + p.value + '</span>';
  }

  // Copyable URL cell — full URL shown via custom tooltip on hover
  function urlCell(url) {
    if (!url) return '<span class="flat-muted">—</span>';
    return '<span class="flat-url" data-copy="' + escapeHtml(url) + '" data-tip="' + escapeHtml(url) + '">' +
      '<span class="flat-url__text">' + escapeHtml(url) + '</span>' +
      '<svg class="flat-url__copy" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
    '</span>';
  }
  function idCell(id) {
    if (!id) return '<span class="flat-muted">—</span>';
    return '<span class="flat-id" data-copy="' + escapeHtml(id) + '" title="Click to copy">' +
      '<span>' + escapeHtml(id) + '</span>' +
      '<svg class="flat-url__copy" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
    '</span>';
  }

  // ===== State =====
  var selected = {}; // conversionId -> bool
  var state = {
    sort: { col: "time", dir: "desc" },
    colFilters: {},
    filters: { search: "", lander: "", status: "", dateFrom: "", dateTo: "", workspaces: null, hasImp: false, hasClick: false, hasConv: false }
  };

  // ---- Team → Workspace → Lander hierarchy ----
  var TEAMS = [
    { id: "acme", name: "Acme Inc", workspaces: [
      { id: "ACME Growth", name: "ACME Growth" },
      { id: "ACME Retail", name: "ACME Retail" }
    ]},
    { id: "finedge", name: "FinanceEdge", workspaces: [
      { id: "FinanceEdge", name: "FinanceEdge" },
      { id: "Insights", name: "Insights" }
    ]}
  ];
  var LANDER_WORKSPACE = {
    "Summer Sale": "ACME Growth",
    "Black Friday": "ACME Growth",
    "Founder Letter": "ACME Growth",
    "Referral Q2": "ACME Retail",
    "Partner Announce": "ACME Retail",
    "Walk-in Tubs": "FinanceEdge",
    "Holiday Teaser": "FinanceEdge",
    "Fall Preview": "Insights"
  };
  function workspaceOf(j) {
    return j.visit ? (LANDER_WORKSPACE[j.visit.lander] || "ACME Growth") : "ACME Growth";
  }
  var ALL_WORKSPACES = [];
  TEAMS.forEach(function (t) { t.workspaces.forEach(function (w) { ALL_WORKSPACES.push(w.id); }); });

  // Populate lander dropdown
  (function populate() {
    var landerSel = document.getElementById("flat-f-lander");
    if (!landerSel) return;
    var landers = {};
    data.forEach(function (j) { if (j.visit && j.visit.lander) landers[j.visit.lander] = true; });
    Object.keys(landers).sort().forEach(function (l) {
      var opt = document.createElement("option"); opt.value = l; opt.textContent = l; landerSel.appendChild(opt);
    });
  })();

  // ---- Team / workspace multi-select ----
  (function teamFilter() {
    var wrap = document.getElementById("flat-ms");
    var btn = document.getElementById("flat-ms-btn");
    var pop = document.getElementById("flat-ms-pop");
    var label = document.getElementById("flat-ms-label");
    if (!wrap || !btn || !pop) return;

    function renderPop() {
      var sel = state.filters.workspaces; // null = all
      var html = '<div class="ms__actions"><button type="button" class="ms__act" data-act="all">Select all</button>' +
        '<button type="button" class="ms__act" data-act="none">Clear</button></div>';
      TEAMS.forEach(function (t) {
        var wsIds = t.workspaces.map(function (w) { return w.id; });
        var teamOn = wsIds.every(function (id) { return !sel || sel.indexOf(id) !== -1; });
        var someOn = wsIds.some(function (id) { return sel && sel.indexOf(id) !== -1; });
        html += '<div class="ms__group">' +
          '<label class="ms__team"><input type="checkbox" data-team="' + t.id + '"' +
            (teamOn ? " checked" : "") + (!teamOn && someOn ? ' data-indet="1"' : '') + ' />' +
            '<span>' + t.name + '</span></label>';
        t.workspaces.forEach(function (w) {
          var on = !sel || sel.indexOf(w.id) !== -1;
          html += '<label class="ms__ws"><input type="checkbox" data-ws="' + w.id + '"' + (on ? " checked" : "") + ' />' +
            '<span>' + w.name + '</span></label>';
        });
        html += '</div>';
      });
      pop.innerHTML = html;
      // set indeterminate
      pop.querySelectorAll('[data-indet="1"]').forEach(function (cb) { cb.indeterminate = true; });
    }

    function currentSet() {
      // null means all — materialise to array for editing
      if (!state.filters.workspaces) return ALL_WORKSPACES.slice();
      return state.filters.workspaces.slice();
    }
    function commit(arr) {
      // if all selected → null (no filter); if none → empty array
      if (arr.length === ALL_WORKSPACES.length) state.filters.workspaces = null;
      else state.filters.workspaces = arr;
      updateLabel();
      renderPop();
      render();
    }
    function updateLabel() {
      var sel = state.filters.workspaces;
      if (!sel) { label.textContent = "All teams & workspaces"; return; }
      if (!sel.length) { label.textContent = "No workspaces"; return; }
      if (sel.length === 1) { label.textContent = sel[0]; return; }
      label.textContent = sel.length + " workspaces";
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !pop.hidden;
      if (open) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); }
      else { renderPop(); pop.hidden = false; btn.setAttribute("aria-expanded", "true"); }
    });
    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); }
    });
    pop.addEventListener("change", function (e) {
      var set = currentSet();
      var ws = e.target.getAttribute("data-ws");
      var team = e.target.getAttribute("data-team");
      if (ws) {
        if (e.target.checked) { if (set.indexOf(ws) === -1) set.push(ws); }
        else set = set.filter(function (x) { return x !== ws; });
      } else if (team) {
        var t = TEAMS.filter(function (x) { return x.id === team; })[0];
        var ids = t.workspaces.map(function (w) { return w.id; });
        if (e.target.checked) ids.forEach(function (id) { if (set.indexOf(id) === -1) set.push(id); });
        else set = set.filter(function (x) { return ids.indexOf(x) === -1; });
      }
      commit(set);
    });
    pop.addEventListener("click", function (e) {
      var act = e.target.closest(".ms__act");
      if (!act) return;
      commit(act.getAttribute("data-act") === "all" ? ALL_WORKSPACES.slice() : []);
    });

    updateLabel();
  })();

  function pbTime(j) { return j.postback ? j.postback.ts : (j.visit ? j.visit.ts : ""); }

  // ---- Per-column value accessors (for sort + per-column filter) ----
  function colVal(j, key) {
    var pr = presence(j);
    var p = j.postback || {}, v = j.visit || {}, f = j.destinationFire;
    switch (key) {
      case "lander": return v.lander || "";
      case "visit_time": return v.ts || "";
      case "variant": return v.variant || "";
      case "entry_url": return visitRawUrl(j) || "";
      case "visit_id": return visitIdOf(j);
      case "clid": return clidOf(j);
      case "impression_id": return pr.imp ? impressionIdOf(j) : "";
      case "click_url": return pr.click ? (clickUrl(j) || "") : "";
      case "click_id": return pr.click ? clickIdOf(j) : "";
      case "click_time": return pr.click ? (clickTimeOf(j) || "") : "";
      case "time": return pr.conv ? (p.ts || "") : "";
      case "conversion_id": return pr.conv ? (p.conversionId || "") : "";
      case "conversion_type": return pr.conv ? (p.conversionType || "") : "";
      case "conversion_value": return pr.conv ? (p.value || 0) : 0;
      case "fired_time": return pr.conv ? (fireTimeOf(j) || "") : "";
      case "buy_source": return pr.conv ? (SOURCE_NAME[j.buySource] || j.buySource || "") : "";
      case "destination": return pr.conv && f ? (f.destinationId || "") : "";
      case "response": return pr.conv && f ? (f.status === "ok" ? "200 ok" : f.status === "pending" ? "queued" : (httpStatusOf(f) + " failed")) : "";
      case "_imp": return pr.imp ? "1" : "";
      case "_click": return pr.click ? "1" : "";
      case "_conv": return pr.conv ? "1" : "";
      default: return "";
    }
  }
  var NUMERIC_COLS = { conversion_value: 1 };

  function filtered() {
    var f = state.filters;
    return data.filter(function (j) {
      var d = fmtD(pbTime(j));
      if (f.dateFrom && (!d || d < f.dateFrom)) return false;
      if (f.dateTo && (!d || d > f.dateTo)) return false;
      if (f.workspaces && f.workspaces.indexOf(workspaceOf(j)) === -1) return false;
      var pr = presence(j);
      if (f.hasImp && !pr.imp) return false;
      if (f.hasClick && !pr.click) return false;
      if (f.hasConv && !pr.conv) return false;
      if (f.lander && (!j.visit || j.visit.lander !== f.lander)) return false;
      if (f.status) {
        var st = j.destinationFire ? j.destinationFire.status : "none";
        if (f.status !== st) return false;
      }
      if (f.search) {
        var s = f.search.toLowerCase();
        var blob = [
          j.postback && j.postback.conversionId,
          visitRawUrl(j), clickUrl(j),
          j.visit && j.visit.lander
        ].filter(Boolean).join(" ").toLowerCase();
        if (blob.indexOf(s) === -1) return false;
      }
      // per-column text filters
      var cf = state.colFilters;
      for (var k in cf) {
        if (!cf[k]) continue;
        if (String(colVal(j, k)).toLowerCase().indexOf(cf[k].toLowerCase()) === -1) return false;
      }
      return true;
    });
  }

  function sortRows(rows) {
    var dir = state.sort.dir, col = state.sort.col;
    var numeric = NUMERIC_COLS[col];
    return rows.slice().sort(function (a, b) {
      var av = colVal(a, col), bv = colVal(b, col);
      if (numeric) { av = +av || 0; bv = +bv || 0; }
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }

  var SOURCE_NAME = { facebook: "Meta", google: "Google", taboola: "Taboola", tiktok: "TikTok" };
  function sourceCell(j) {
    var s = j.buySource;
    if (!s) return '<span class="flat-muted">—</span>';
    var inner = ({
      facebook: '<span class="flat-src__logo flat-src__logo--facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.8 3.7-3.8 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></span>',
      google: '<span class="flat-src__logo flat-src__logo--google"><svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.3-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-1 .6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H2.8v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H2.8a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.1 14.7 2.2 12 2.2A10 10 0 0 0 2.8 7.5l3.6 2.6C7.2 7.8 9.4 6.1 12 6.1z"/></svg></span>',
      taboola: '<span class="flat-src__logo flat-src__logo--taboola">Tb</span>',
      tiktok: '<span class="flat-src__logo flat-src__logo--tiktok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3v3.5a4.5 4.5 0 0 0 4 4.5v3a7.5 7.5 0 0 1-4-1.2V16a5 5 0 1 1-5-5v3a2 2 0 1 0 2 2V3z"/></svg></span>'
    })[s] || "";
    return '<span class="flat-src">' + inner + '<span>' + escapeHtml(SOURCE_NAME[s] || s) + '</span></span>';
  }

  function impressionIdOf(j) {
    var r = seededRng((j.visitId || (j.postback && j.postback.conversionId) || "") + "|imp");
    return "imp_" + hexStr(r, 10);
  }
  function renderRow(j) {
    var pr = presence(j);
    var f = pr.conv ? j.destinationFire : null;
    var rowCls = "flat-tr";
    if (f && f.status === "error") rowCls += " is-failed";
    var rk = rowKey(j);
    var checked = selected[rk] ? " checked" : "";
    var p = j.postback || {};
    var dash = '<span class="flat-muted">—</span>';
    return '<tr class="' + rowCls + '" data-cid="' + escapeHtml(rk) + '">' +
      '<td class="flat-td-check"><input type="checkbox" class="flat-row-check" data-cid="' + escapeHtml(rk) + '"' + checked + ' /></td>' +
      // 0) lander
      '<td class="col--base">' + landerCell(j) + '</td>' +
      // 1) Visit
      '<td class="col--visit">' + plain(clidOf(j)) + '</td>' +
      '<td class="col--visit">' + escapeHtml(variantOf(j)) + '</td>' +
      '<td class="col--visit">' + plain(fmtTs(j.visit ? j.visit.ts : "")) + '</td>' +
      '<td class="col--visit">' + idCell(visitIdOf(j)) + '</td>' +
      '<td class="col--visit">' + urlCell(visitRawUrl(j)) + '</td>' +
      '<td class="col--visit">' + (pr.imp ? idCell(impressionIdOf(j)) : dash) + '</td>' +
      // 2) Click on Lander
      '<td class="col--click">' + (pr.click ? urlCell(clickUrl(j)) : dash) + '</td>' +
      '<td class="col--click">' + (pr.click ? idCell(clickIdOf(j)) : dash) + '</td>' +
      '<td class="col--click">' + (pr.click ? plain(fmtTs(clickTimeOf(j))) : dash) + '</td>' +
      // 3) Conversion received
      '<td class="col--pb">' + (pr.conv ? plain(fmtTs(p.ts)) : dash) + '</td>' +
      '<td class="col--pb">' + (pr.conv ? idCell(p.conversionId) : dash) + '</td>' +
      '<td class="col--pb">' + (pr.conv ? escapeHtml(p.conversionType || "—") : dash) + '</td>' +
      '<td class="col--pb">' + (pr.conv ? valCell(j) : dash) + '</td>' +
      // 4) Destination fire
      '<td class="col--fire">' + (pr.conv ? plain(fmtTs(fireTimeOf(j))) : dash) + '</td>' +
      '<td class="col--fire">' + (pr.conv ? sourceCell(j) : dash) + '</td>' +
      '<td class="col--fire">' + (pr.conv ? destNameCell(j) : dash) + '</td>' +
      '<td class="col--fire">' + (pr.conv ? respCell(j) : dash) + '</td>' +
      '<td class="flat-td-view">' + (pr.conv ? '<button type="button" class="flat-view js-flat-view" data-cid="' + escapeHtml(rk) + '" title="View object" aria-label="View object"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button>' : '') + '</td>' +
    '</tr>';
  }

  // ---- Build the buy-source object (CAPI / Google / Taboola) for the drawer ----
  function buildObject(j) {
    var p = j.postback, v = j.visit || {}, f = j.destinationFire;
    var r = seededRng(p.conversionId + "|obj");
    var evMap = { lead: "Lead", purchase: "Purchase", signup: "CompleteRegistration", view_content: "ViewContent" };
    var unix = Math.floor(new Date((p.ts || "2026-04-21 09:00:00").replace(" ", "T")).getTime() / 1000) || 1775171935;
    if (j.buySource === "google") {
      return {
        conversions: [{
          conversion_action: (f && f.request && f.request.conversions && f.request.conversions[0].conversion_action) || "customers/2846197723/conversionActions/8841502",
          conversion_date_time: (p.ts || "") + "+00:00",
          conversion_value: p.value || 0,
          currency_code: p.currency || "USD",
          order_id: p.conversionId,
          gclid: "EAIaIQ" + token(r, 18)
        }],
        partial_failure_enabled: true,
        access_token: "1//••••••••••••  (hidden)"
      };
    }
    if (j.buySource === "tiktok") {
      return { event: evMap[p.conversionType] || "Lead", event_id: p.conversionId, timestamp: unix,
        context: { user: { ttclid: "C0gO3" + token(r, 14) }, ip: "107.21.28.235", user_agent: "Mozilla/5.0 (compatible; example)" },
        properties: { value: p.value || 0, currency: p.currency || "USD" },
        access_token: "••••••••••••  (hidden)" };
    }
    // Meta CAPI (default)
    return {
      data: [{
        event_id: p.conversionId,
        user_data: {
          fbc: "fb.1." + unix + "000.IwY2xjawQph_lleHRuA2Fl" + token(r, 60),
          client_ip_address: "107.21.28.235",
          client_user_agent: "Mozilla/5.0 (compatible; example)"
        },
        event_name: evMap[p.conversionType] || "Lead",
        event_time: unix,
        action_source: (v.params && v.params.action_source) || "website",
        custom_data: p.value ? { value: p.value, currency: p.currency || "USD" } : undefined
      }]
    };
  }
  function objLabel(j) {
    return ({ google: "Google Ads — uploadClickConversions", tiktok: "TikTok Events API", facebook: "Meta CAPI — /events" })[j.buySource] || "Conversion object";
  }

  function currentRows() { return sortRows(filtered()); }

  function render() {
    var body = document.getElementById("flat-tbody");
    var empty = document.getElementById("flat-empty");
    var count = document.getElementById("flat-count");
    if (!body) return;
    var rows = currentRows();
    if (!rows.length) {
      body.innerHTML = "";
      empty.hidden = false;
    } else {
      empty.hidden = true;
      body.innerHTML = rows.map(renderRow).join("");
    }
    // counts + selection label
    var selCount = Object.keys(selected).filter(function (k) { return selected[k]; }).length;
    if (count) {
      count.textContent = selCount > 0
        ? (selCount + " selected · " + rows.length + " rows")
        : (rows.length + " rows");
    }
    // sort indicator
    document.querySelectorAll(".flat-thead-cols th").forEach(function (th) {
      th.classList.remove("is-sorted-asc", "is-sorted-desc");
      if (th.getAttribute("data-sort") === state.sort.col) {
        th.classList.add(state.sort.dir === "asc" ? "is-sorted-asc" : "is-sorted-desc");
      }
    });
    syncSelectAll();
  }

  function syncSelectAll() {
    var master = document.getElementById("flat-select-all");
    var lbl = document.getElementById("flat-sel-label");
    if (!master) return;
    var rows = currentRows();
    var visibleCids = rows.map(function (j) { return rowKey(j); });
    var selCount = visibleCids.filter(function (c) { return selected[c]; }).length;
    master.checked = selCount > 0 && selCount === visibleCids.length;
    master.indeterminate = selCount > 0 && selCount < visibleCids.length;
    if (lbl) lbl.textContent = selCount > 0 ? (selCount + " selected") : "Select all";
  }

  // ===== Filters wiring =====
  var fmap = {
    "flat-f-search": "search",
    "flat-f-lander": "lander",
    "flat-f-status": "status",
    "flat-f-date-from": "dateFrom",
    "flat-f-date-to": "dateTo"
  };
  Object.keys(fmap).forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var t;
    el.addEventListener("input", function () {
      state.filters[fmap[id]] = el.value;
      clearTimeout(t); t = setTimeout(render, 100);
    });
    el.addEventListener("change", function () {
      state.filters[fmap[id]] = el.value; render();
    });
  });

  // set default status select to Fired
  var statusSel = document.getElementById("flat-f-status");
  if (statusSel) statusSel.value = "";

  // Presence toggle filters
  [["flat-f-imp","hasImp"],["flat-f-click","hasClick"],["flat-f-conv","hasConv"]].forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    if (el) el.addEventListener("change", function () { state.filters[pair[1]] = el.checked; render(); });
  });

  // Sort (all columns)
  document.querySelectorAll(".flat-thead-cols th.sortable").forEach(function (th) {
    th.addEventListener("click", function () {
      var col = th.getAttribute("data-sort");
      if (state.sort.col === col) state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
      else { state.sort.col = col; state.sort.dir = "asc"; }
      render();
    });
  });

  // Per-column filters
  document.querySelectorAll(".flat-cf").forEach(function (inp) {
    var t;
    inp.addEventListener("input", function () {
      state.colFilters[inp.getAttribute("data-col")] = inp.value;
      clearTimeout(t); t = setTimeout(render, 100);
    });
    inp.addEventListener("click", function (e) { e.stopPropagation(); });
  });

  // Copy all conversion_ids (from current filtered view)
  var copyIdsBtn = document.getElementById("flat-copy-ids");
  if (copyIdsBtn) {
    copyIdsBtn.addEventListener("click", function () {
      var rows = currentRows();
      var selCids = Object.keys(selected).filter(function (k) { return selected[k]; });
      var ids = (selCids.length ? rows.filter(function (j) { return selected[j.postback.conversionId]; }) : rows)
        .map(function (j) { return j.postback.conversionId; });
      var text = ids.join("\n");
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(function () { execCopy(text); });
      else { execCopy(text); }
    });
  }

  // Row checkbox + copy (delegated)
  var tbody = document.getElementById("flat-tbody");
  if (tbody) {
    tbody.addEventListener("change", function (e) {
      var cb = e.target.closest(".flat-row-check");
      if (!cb) return;
      selected[cb.getAttribute("data-cid")] = cb.checked;
      render();
    });
    tbody.addEventListener("click", function (e) {
      var viewBtn = e.target.closest(".js-flat-view");
      if (viewBtn) {
        var jv = data.find(function (x) { return rowKey(x) === viewBtn.getAttribute("data-cid"); });
        if (jv) openDrawer(jv);
        return;
      }
      var copyEl = e.target.closest("[data-copy]");
      if (!copyEl) return;
      var text = copyEl.getAttribute("data-copy");
      var done = function () {
        copyEl.classList.add("is-copied");
        setTimeout(function () { copyEl.classList.remove("is-copied"); }, 1100);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(function () { execCopy(text); done(); });
      } else { execCopy(text); done(); }
    });
  }

  // ---- Object drawer ----
  function openDrawer(j) {
    var dr = document.getElementById("flat-drawer");
    if (!dr) {
      dr = document.createElement("div");
      dr.id = "flat-drawer";
      dr.className = "flat-drawer";
      dr.innerHTML = '<div class="flat-drawer__scrim" data-drawer-close></div>' +
        '<aside class="flat-drawer__panel" role="dialog" aria-modal="true">' +
          '<div class="flat-drawer__head">' +
            '<div><div class="flat-drawer__eyebrow" id="fd-eyebrow"></div><h3 class="flat-drawer__title" id="fd-title"></h3></div>' +
            '<button type="button" class="flat-drawer__x" data-drawer-close aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
          '</div>' +
          '<div class="flat-drawer__sub" id="fd-sub"></div>' +
          '<div class="flat-drawer__bar"><span class="flat-drawer__barlabel">Object sent to buy source</span>' +
            '<button type="button" class="flat-drawer__copy" id="fd-copy"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg> Copy</button>' +
          '</div>' +
          '<pre class="flat-drawer__pre" id="fd-pre"></pre>' +
        '</aside>';
      document.body.appendChild(dr);
      dr.addEventListener("click", function (e) {
        if (e.target.closest("[data-drawer-close]")) dr.classList.remove("is-open");
        var cp = e.target.closest("#fd-copy");
        if (cp) {
          var txt = document.getElementById("fd-pre").textContent;
          var fin = function () { cp.classList.add("is-copied"); cp.innerHTML = "Copied"; setTimeout(function () { cp.classList.remove("is-copied"); cp.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg> Copy'; }, 1200); };
          if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(fin).catch(function () { execCopy(txt); fin(); });
          else { execCopy(txt); fin(); }
        }
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") dr.classList.remove("is-open"); });
    }
    var obj = buildObject(j);
    document.getElementById("fd-eyebrow").textContent = objLabel(j);
    document.getElementById("fd-title").textContent = j.visit ? j.visit.lander : j.postback.conversionId;
    document.getElementById("fd-sub").innerHTML = '<span>conversion_id <b>' + escapeHtml(j.postback.conversionId) + '</b></span> · <span>event_id = conversion_id</span>';
    document.getElementById("fd-pre").textContent = JSON.stringify(obj, function (k, v) { return v === undefined ? undefined : v; }, 2);
    dr.classList.add("is-open");
  }
  function execCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    } catch (e) {}
  }

  // Select all
  var master = document.getElementById("flat-select-all");
  if (master) {
    master.addEventListener("change", function () {
      var rows = currentRows();
      rows.forEach(function (j) { selected[rowKey(j)] = master.checked; });
      render();
    });
  }

  // Download CSV (selected if any, else all visible)
  var dl = document.getElementById("flat-download");
  var dlMenu = document.getElementById("flat-dl-menu");
  var dlWrap = document.getElementById("flat-dl");
  function exportData() {
    var rows = currentRows();
    var selCids = Object.keys(selected).filter(function (k) { return selected[k]; });
    var exportRows = selCids.length ? rows.filter(function (j) { return selected[rowKey(j)]; }) : rows;
    var header = ["received_at", "lander", "entry_url", "country", "device", "click_url", "conversion_id", "type", "value", "currency", "buy_source", "destination", "response"];
    var matrix = [header];
    exportRows.forEach(function (j) {
      var f = j.destinationFire;
      var resp = !f ? "no_fire" : f.status === "pending" ? "queued" : (httpStatusOf(f) + (f.status === "ok" ? " OK" : " FAILED"));
      var p = j.postback;
      matrix.push([
        fmtTs(p.ts), j.visit ? j.visit.lander : "", visitRawUrl(j) || "",
        j.visit ? (j.visit.country || "") : "", j.visit ? (j.visit.device || "") : "",
        clickUrl(j) || "", p.conversionId, p.conversionType || "", p.value || "",
        p.currency || "", SOURCE_NAME[j.buySource] || j.buySource || "",
        f ? (f.destinationId || "") : "", resp
      ]);
    });
    return matrix;
  }
  function triggerDownload(blob, ext) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "nexus-conversions-" + new Date().toISOString().slice(0, 10) + "." + ext;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function downloadCsv() {
    var lines = exportData().map(function (row) {
      return row.map(function (c) {
        c = String(c == null ? "" : c);
        return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
      }).join(",");
    });
    triggerDownload(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }), "csv");
  }
  function downloadXls() {
    // Excel-readable HTML table (.xls)
    var esc = function (c) { return String(c == null ? "" : c).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
    var m = exportData();
    var thead = "<tr>" + m[0].map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr>";
    var tbody = m.slice(1).map(function (row) {
      return "<tr>" + row.map(function (c) { return '<td style="mso-number-format:\'@\'">' + esc(c) + "</td>"; }).join("") + "</tr>";
    }).join("");
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head>' +
      '<body><table border="1">' + thead + tbody + "</table></body></html>";
    triggerDownload(new Blob([html], { type: "application/vnd.ms-excel" }), "xls");
  }
  if (dl && dlMenu) {
    dl.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !dlMenu.hidden;
      dlMenu.hidden = open; dl.setAttribute("aria-expanded", String(!open));
    });
    dlMenu.addEventListener("click", function (e) {
      var item = e.target.closest("[data-dl]");
      if (!item) return;
      if (item.getAttribute("data-dl") === "csv") downloadCsv(); else downloadXls();
      dlMenu.hidden = true; dl.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("click", function (e) {
      if (dlWrap && !dlWrap.contains(e.target)) { dlMenu.hidden = true; dl.setAttribute("aria-expanded", "false"); }
    });
  }

  // ---- Custom hover tooltip for full URLs ----
  (function () {
    var tip = document.createElement("div");
    tip.className = "flat-tip";
    tip.hidden = true;
    document.body.appendChild(tip);
    var tbodyEl = document.getElementById("flat-tbody");
    if (!tbodyEl) return;
    tbodyEl.addEventListener("mouseover", function (e) {
      var el = e.target.closest("[data-tip]");
      if (!el) return;
      tip.textContent = el.getAttribute("data-tip");
      tip.hidden = false;
      var r = el.getBoundingClientRect();
      var top = r.bottom + 6;
      tip.style.left = Math.min(r.left, window.innerWidth - 460) + "px";
      tip.style.top = top + "px";
    });
    tbodyEl.addEventListener("mousemove", function (e) {
      if (tip.hidden) return;
      var el = e.target.closest("[data-tip]");
      if (!el) { tip.hidden = true; }
    });
    tbodyEl.addEventListener("mouseout", function (e) {
      var to = e.relatedTarget;
      if (!to || !to.closest || !to.closest("[data-tip]")) tip.hidden = true;
    });
  })();

  // Flow popover toggle
  (function () {
    var trig = document.getElementById("flow-pop-trigger");
    var pop = document.getElementById("flow-pop");
    var close = document.getElementById("flow-pop-close");
    var wrap = trig && trig.closest(".flow-pop-wrap");
    if (!trig || !pop) return;
    function setOpen(o) { pop.hidden = !o; trig.setAttribute("aria-expanded", String(o)); }
    trig.addEventListener("click", function (e) { e.stopPropagation(); setOpen(pop.hidden); });
    if (close) close.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("click", function (e) { if (wrap && !wrap.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  })();

  render();
})();

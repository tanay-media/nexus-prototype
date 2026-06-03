// Logs · Conversions (stitched) view — one row per conversion_id.
// Uses SEED_JOURNEYS from logs-journeys.js (window.NEXUS_JOURNEYS).
// Conversion-centric: only journeys that have a postback are shown.

(function () {
  var all = window.NEXUS_JOURNEYS;
  if (!all || !all.length) return;

  // Only journeys with a postback (a conversion actually came back).
  var data = all.filter(function (j) { return j.postback; });

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
    if (!j.ctaForward && !j.visit) return null;
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
    return 400;
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
    filters: { search: "", lander: "", status: "ok", dateFrom: "", dateTo: "", workspaces: null }
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

  function pbTime(j) { return j.postback ? j.postback.ts : ""; }

  function filtered() {
    var f = state.filters;
    return data.filter(function (j) {
      var d = fmtD(pbTime(j));
      if (f.dateFrom && (!d || d < f.dateFrom)) return false;
      if (f.dateTo && (!d || d > f.dateTo)) return false;
      if (f.workspaces && f.workspaces.indexOf(workspaceOf(j)) === -1) return false;
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
      return true;
    });
  }

  function sortRows(rows) {
    var dir = state.sort.dir;
    return rows.slice().sort(function (a, b) {
      var av = pbTime(a), bv = pbTime(b);
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }

  function renderRow(j) {
    var cid = j.postback.conversionId;
    var f = j.destinationFire;
    var rowCls = "flat-tr";
    if (f && f.status === "error") rowCls += " is-failed";
    var checked = selected[cid] ? " checked" : "";
    return '<tr class="' + rowCls + '" data-cid="' + escapeHtml(cid) + '">' +
      '<td class="flat-td-check"><input type="checkbox" class="flat-row-check" data-cid="' + escapeHtml(cid) + '"' + checked + ' /></td>' +
      '<td><span class="flat-mono">' + escapeHtml(fmtTs(j.postback.ts)) + '</span></td>' +
      '<td>' + landerCell(j) + '</td>' +
      '<td>' + urlCell(visitRawUrl(j)) + '</td>' +
      '<td>' + urlCell(clickUrl(j)) + '</td>' +
      '<td>' + idCell(cid) + '</td>' +
      '<td>' + respCell(j) + '</td>' +
    '</tr>';
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
        ? (selCount + " selected · " + rows.length + " conversions")
        : (rows.length + " conversions");
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
    var visibleCids = rows.map(function (j) { return j.postback.conversionId; });
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
  if (statusSel) statusSel.value = "ok";

  // Sort
  document.querySelectorAll(".flat-thead-cols th.sortable").forEach(function (th) {
    th.addEventListener("click", function () {
      var col = th.getAttribute("data-sort");
      if (state.sort.col === col) state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
      else { state.sort.col = col; state.sort.dir = "desc"; }
      render();
    });
  });

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
      rows.forEach(function (j) { selected[j.postback.conversionId] = master.checked; });
      render();
    });
  }

  // Download CSV (selected if any, else all visible)
  var dl = document.getElementById("flat-download");
  if (dl) {
    dl.addEventListener("click", function () {
      var rows = currentRows();
      var selCids = Object.keys(selected).filter(function (k) { return selected[k]; });
      var exportRows = selCids.length ? rows.filter(function (j) { return selected[j.postback.conversionId]; }) : rows;
      var header = ["conversion_received_at", "lander", "variant", "entry_url", "click_url", "conversion_id", "buy_source_response"];
      var lines = [header.join(",")];
      exportRows.forEach(function (j) {
        var f = j.destinationFire;
        var resp = !f ? "no_fire" : f.status === "pending" ? "queued" : (httpStatusOf(f) + (f.status === "ok" ? " OK" : " FAILED"));
        var cells = [
          fmtTs(j.postback.ts),
          j.visit ? j.visit.lander : "",
          j.visit ? (j.visit.variant || "") : "",
          visitRawUrl(j) || "",
          clickUrl(j) || "",
          j.postback.conversionId,
          resp
        ].map(function (c) {
          c = String(c == null ? "" : c);
          return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
        });
        lines.push(cells.join(","));
      });
      var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "nexus-conversions-" + new Date().toISOString().slice(0, 10) + ".csv";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
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

  render();
})();

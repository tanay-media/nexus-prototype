/* Report builder — saved views, rows/values/filters, chart modes */
(function () {
  "use strict";

  var STORAGE_KEY = "nexus-saved-reports::";

  var DIMENSIONS = {
    lander_name: "Lander name",
    variant_name: "Variant name",
    domain: "Domain",
    device: "Device",
    visit_id: "visit_id",
    visit_time: "visit_time",
    country: "Country",
    utm_source: "UTM source",
    utm_campaign: "UTM campaign",
    keyword: "Keyword",
    ad_title: "Ad title",
    form_widget: "Form widget",
    kb_widget: "KB widget"
  };

  var MEASURES = {
    visits: "Visits",
    impressions: "Impressions",
    clicks: "Clicks",
    ctr: "CTR",
    conversions: "Conversions",
    cvr: "CVR",
    score: "Score",
    time_on_page: "Time on page",
    scroll_pct: "Scroll %",
    avg_time_on_page: "Avg time on page",
    avg_scroll_pct: "Avg scroll %",
    form_start: "Form start",
    form_submit: "Form submit",
    form_abandon: "Form abandon",
    kb_widget_views: "KB widget views",
    kb_block_clicks: "KB block clicks",
    kb_ad_clicks: "KB ad clicks",
    kb_block_rate: "KB block rate"
  };

  var FILTERS = {
    date: "Last 7 days",
    status: "Published",
    domain: "All domains"
  };

  var CHART_TYPES = [
    { id: "table", label: "Table", group: "Data presentation" },
    { id: "basic_table", label: "Basic table", group: "Data presentation" },
    { id: "metric", label: "# Metric", group: "Data presentation" },
    { id: "line", label: "Line graph", group: "Trend charts" },
    { id: "area", label: "Area chart", group: "Trend charts" },
    { id: "combo", label: "Combo chart", group: "Trend charts" },
    { id: "bar", label: "Bar graph", group: "Comparison charts" },
    { id: "funnel", label: "Funnel graph", group: "Composition charts" }
  ];

  var CURRENT_USER = { id: "kyle", name: "Kyle", isTeamAdmin: true };
  var CURRENT_TEAM = "ACME Growth";

  var SYSTEM_REPORTS = [
    {
      id: "lander-performance",
      title: "Lander performance",
      meta: "Variant × lander · outcomes",
      scope: "system",
      chart: "table",
      rows: ["lander_name", "variant_name"],
      values: ["impressions", "clicks", "ctr", "conversions", "cvr", "score", "avg_time_on_page", "avg_scroll_pct"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    },
    {
      id: "visit-behaviour",
      title: "Visit behaviour trace",
      meta: "Histograms · heatmap · visit table",
      scope: "system",
      layout: "behaviour",
      chart: "table",
      rows: ["visit_id", "lander_name", "variant_name", "device", "visit_time"],
      values: ["time_on_page", "scroll_pct", "form_start", "form_submit", "clicks"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    },
    {
      id: "scroll-time-charts",
      title: "Scroll & time by variant",
      meta: "Behaviour summary · bar chart",
      scope: "system",
      chart: "bar",
      rows: ["variant_name"],
      values: ["time_on_page", "scroll_pct", "visits"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    },
    {
      id: "form-funnels",
      title: "Form funnels",
      meta: "Per-widget starts → steps → submit",
      scope: "system",
      chart: "funnel",
      rows: ["form_widget"],
      values: ["form_start", "form_submit", "form_abandon"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    },
    {
      id: "kb-funnels",
      title: "Keyword block funnels",
      meta: "Widget views → block click → ad click",
      scope: "system",
      chart: "funnel",
      rows: ["keyword", "ad_title"],
      values: ["kb_widget_views", "kb_block_clicks", "kb_ad_clicks"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    },
    {
      id: "channel-breakdown",
      title: "Channel breakdown",
      meta: "UTM source × campaign",
      scope: "system",
      chart: "table",
      rows: ["utm_source", "utm_campaign"],
      values: ["visits", "clicks", "ctr", "conversions", "cvr"],
      filters: { date: "Last 30 days", status: "Published", domain: "All domains" }
    },
    {
      id: "device-geo",
      title: "Device & geo split",
      meta: "Device × country",
      scope: "system",
      chart: "table",
      rows: ["device", "country"],
      values: ["visits", "impressions", "score"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    }
  ];

  var TEAM_REPORTS = [
    {
      id: "team-weekly-rollup",
      title: "Weekly team rollup",
      meta: "ACME Growth · Maya",
      scope: "team",
      createdBy: "maya",
      chart: "table",
      rows: ["lander_name"],
      values: ["visits", "conversions", "cvr", "score"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    },
    {
      id: "team-q2-referral",
      title: "Q2 referral performance",
      meta: "ACME Growth · Sam",
      scope: "team",
      createdBy: "sam",
      chart: "table",
      rows: ["variant_name", "domain"],
      values: ["impressions", "clicks", "ctr", "conversions"],
      filters: { date: "Last 30 days", status: "Published", domain: "refer.acme.com" }
    },
    {
      id: "team-form-dropoff",
      title: "Form drop-off (team)",
      meta: "ACME Growth · Dana",
      scope: "team",
      createdBy: "dana",
      chart: "funnel",
      rows: ["form_widget"],
      values: ["form_start", "form_submit", "form_abandon"],
      filters: { date: "Last 14 days", status: "Published", domain: "All domains" }
    },
    {
      id: "team-kb-keywords",
      title: "KB keywords — team view",
      meta: "ACME Growth · Kyle",
      scope: "team",
      createdBy: "kyle",
      chart: "table",
      rows: ["keyword"],
      values: ["kb_widget_views", "kb_block_clicks", "kb_ad_clicks", "kb_block_rate"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    },
    {
      id: "team-mobile-only",
      title: "Mobile landers only",
      meta: "ACME Growth · Maya",
      scope: "team",
      createdBy: "maya",
      chart: "bar",
      rows: ["lander_name"],
      values: ["time_on_page", "scroll_pct", "visits"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains", device: "mobile" }
    }
  ];

  /* Legacy alias for URL presets */
  var PRESETS = SYSTEM_REPORTS;

  var AGG_ROWS = [
    { lander_name: "Summer Sale", variant_name: "Main hero", impressions: 112613, clicks: 75899, conversions: 52164, score: 0.463, avg_time_on_page: "44s", avg_scroll_pct: "71%", avg_time_sec: 44, avg_scroll_num: 71 },
    { lander_name: "Referral Q2", variant_name: "Single-field", impressions: 16951, clicks: 8608, conversions: 4657, score: 0.275, avg_time_on_page: "38s", avg_scroll_pct: "65%", avg_time_sec: 38, avg_scroll_num: 65 },
    { lander_name: "Founder Letter", variant_name: "Long form", impressions: 14668, clicks: 6601, conversions: 2376, score: 0.162, avg_time_on_page: "52s", avg_scroll_pct: "82%", avg_time_sec: 52, avg_scroll_num: 82 },
    { lander_name: "Hedge Your Future", variant_name: "Reader modal", impressions: 3248, clicks: 47, conversions: 12, score: 0.014, avg_time_on_page: "48s", avg_scroll_pct: "62%", avg_time_sec: 48, avg_scroll_num: 62 },
    { lander_name: "Black Friday", variant_name: "Orange bold", impressions: 5786, clicks: 1042, conversions: 185, score: 0.032, avg_time_on_page: "29s", avg_scroll_pct: "54%", avg_time_sec: 29, avg_scroll_num: 54 }
  ];

  /* Mock visit-level samples for behaviour histograms (time in seconds, scroll 0–100) */
  var VISIT_BEHAVIOUR_SAMPLES = [
    6, 8, 9, 12, 14, 18, 22, 24, 28, 31, 34, 36, 38, 42, 44, 48, 52, 55, 58, 62, 68, 72, 78, 84, 92, 98, 105, 118, 124, 142,
    8, 11, 15, 19, 26, 33, 41, 47, 53, 61, 67, 74, 81, 88, 95, 102, 115, 128, 8, 16, 21, 27, 35, 43, 51, 59, 66, 73, 80, 89
  ].map(function (t, i) {
    var scrolls = [12, 18, 22, 28, 35, 42, 48, 55, 62, 68, 74, 81, 88, 91, 95, 100, 38, 45, 52, 58, 64, 70, 76, 83, 90, 15, 25, 32, 40, 50];
    return { time_sec: t, scroll: scrolls[i % scrolls.length] };
  });

  var VISIT_ROWS = [
    { visit_id: "v_a10ec9aa", lander_name: "Summer Sale", variant_name: "Main hero", device: "mobile", visit_time: "Apr 21, 14:32", time_on_page: "58s", scroll_pct: "84%", form_start: "Yes", form_submit: "Yes", clicks: 1 },
    { visit_id: "v_1f105248", lander_name: "Summer Sale", variant_name: "Main hero", device: "desktop", visit_time: "Apr 21, 14:28", time_on_page: "1m 12s", scroll_pct: "91%", form_start: "Yes", form_submit: "No", clicks: 1 },
    { visit_id: "v_54bde6b4", lander_name: "Referral Q2", variant_name: "Single-field", device: "mobile", visit_time: "Apr 21, 14:19", time_on_page: "34s", scroll_pct: "62%", form_start: "Yes", form_submit: "Abandoned", clicks: 0 },
    { visit_id: "v_adaca551", lander_name: "Founder Letter", variant_name: "Long form", device: "tablet", visit_time: "Apr 21, 13:55", time_on_page: "2m 04s", scroll_pct: "100%", form_start: "Yes", form_submit: "Yes", clicks: 1 },
    { visit_id: "v_8e2b1c3d", lander_name: "Hedge Your Future", variant_name: "Reader modal", device: "mobile", visit_time: "Apr 21, 12:34", time_on_page: "1m 05s", scroll_pct: "76%", form_start: "—", form_submit: "—", clicks: 1 }
  ];

  var CHART_ROWS = [
    { variant_name: "Main hero", time_on_page: 44, scroll_pct: 71, visits: 118420 },
    { variant_name: "Single-field", time_on_page: 38, scroll_pct: 65, visits: 17800 },
    { variant_name: "Long form", time_on_page: 52, scroll_pct: 82, visits: 15420 },
    { variant_name: "Reader modal", time_on_page: 48, scroll_pct: 62, visits: 3347 },
    { variant_name: "Orange bold", time_on_page: 29, scroll_pct: 54, visits: 6050 }
  ];

  var FORM_FUNNEL_STEPS = [
    { label: "Form start", val: 98200, pct: 100 },
    { label: "Step completions (all)", val: 86400, pct: 88.0 },
    { label: "Submit", val: 52164, pct: 53.1 },
    { label: "Abandon", val: 46036, pct: 46.9 }
  ];

  var KB_FUNNEL_STEPS = [
    { label: "Widget views", val: 3248, pct: 100 },
    { label: "Keyword picks", val: 964, pct: 29.7 },
    { label: "Ads shown", val: 941, pct: 97.6 },
    { label: "Ad clicks", val: 47, pct: 5.0 }
  ];

  var FORM_FUNNEL_DATA = [
    {
      id: "lead-short",
      form_widget: "Lead — short qualify",
      form_start: 42100,
      form_submit: 18200,
      form_abandon: 23900,
      steps: [
        { step_id: "step_zip", label: "Zip code", count: 38900 },
        { step_id: "step_age", label: "Age range", count: 22100 }
      ]
    },
    {
      id: "quote-request",
      form_widget: "Quote request",
      form_start: 28400,
      form_submit: 12100,
      form_abandon: 16300,
      steps: [
        { step_id: "step_contact", label: "Contact info", count: 25100 },
        { step_id: "step_coverage", label: "Coverage type", count: 18200 },
        { step_id: "step_review", label: "Review", count: 12100 }
      ]
    },
    {
      id: "long-qualify",
      form_widget: "Long qualify — 5 step",
      form_start: 8600,
      form_submit: 2100,
      form_abandon: 6500,
      steps: [
        { step_id: "step_intro", label: "Intro", count: 7900 },
        { step_id: "step_household", label: "Household", count: 6100 },
        { step_id: "step_income", label: "Income", count: 4800 },
        { step_id: "step_health", label: "Health history", count: 3200 },
        { step_id: "step_confirm", label: "Confirm", count: 2100 }
      ]
    }
  ];

  var KB_KEYWORD_FUNNEL_DATA = [
    {
      id: "kw-passive",
      keyword: "passive income investing",
      kb_widget_views: 3248,
      kb_block_clicks: 412,
      kb_ad_clicks: 24,
      ads: [
        { ad_title: "Earn 8% APY on High-Yield Savings", kb_widget_views: 2100, kb_block_clicks: 280, kb_ad_clicks: 18 },
        { ad_title: "E*TRADE® Account Setup", kb_widget_views: 1148, kb_block_clicks: 132, kb_ad_clicks: 6 }
      ]
    },
    {
      id: "kw-etf",
      keyword: "etf zero fee platform",
      kb_widget_views: 3248,
      kb_block_clicks: 198,
      kb_ad_clicks: 11,
      ads: [
        { ad_title: "Fidelity Zero ETFs", kb_widget_views: 1980, kb_block_clicks: 121, kb_ad_clicks: 7 },
        { ad_title: "Schwab ETF OneSource", kb_widget_views: 1268, kb_block_clicks: 77, kb_ad_clicks: 4 }
      ]
    },
    {
      id: "kw-beginner",
      keyword: "beginner investing start",
      kb_widget_views: 3248,
      kb_block_clicks: 186,
      kb_ad_clicks: 8,
      ads: [
        { ad_title: "Schwab Beginner Guide", kb_widget_views: 1860, kb_block_clicks: 104, kb_ad_clicks: 5 },
        { ad_title: "Start Investing with $0 minimum", kb_widget_views: 1388, kb_block_clicks: 82, kb_ad_clicks: 3 }
      ]
    },
    {
      id: "kw-brokerage",
      keyword: "open brokerage account fast",
      kb_widget_views: 3248,
      kb_block_clicks: 168,
      kb_ad_clicks: 4,
      ads: [
        { ad_title: "Robinhood Sign Up", kb_widget_views: 1680, kb_block_clicks: 168, kb_ad_clicks: 4 }
      ]
    },
    {
      id: "kw-medicare",
      keyword: "medicare advantage",
      kb_widget_views: 1820,
      kb_block_clicks: 412,
      kb_ad_clicks: 19,
      ads: [
        { ad_title: "Compare Medicare Advantage Plans", kb_widget_views: 1100, kb_block_clicks: 248, kb_ad_clicks: 12 },
        { ad_title: "Extra Benefits You May Qualify For", kb_widget_views: 720, kb_block_clicks: 164, kb_ad_clicks: 7 }
      ]
    },
    {
      id: "kw-auto",
      keyword: "auto insurance savings",
      kb_widget_views: 940,
      kb_block_clicks: 188,
      kb_ad_clicks: 8,
      ads: [
        { ad_title: "Save up to $500/yr on auto insurance", kb_widget_views: 620, kb_block_clicks: 124, kb_ad_clicks: 5 },
        { ad_title: "Compare quotes in 2 minutes", kb_widget_views: 320, kb_block_clicks: 64, kb_ad_clicks: 3 }
      ]
    }
  ];

  var state = {
    presetId: "lander-performance",
    chart: "table",
    rows: [],
    values: [],
    filters: {},
    userSaved: [],
    hiddenTeamIds: [],
    histTimeMode: "count",
    histTimeBins: 8,
    histTimeBinSize: 15,
    histScrollMode: "count",
    histScrollBins: 5,
    histScrollBinSize: 10
  };

  function scopeLabel(scope) {
    if (scope === "system") return "System";
    if (scope === "team") return "Team";
    return "You";
  }

  function canDeleteReport(report) {
    if (report.scope === "system") return false;
    if (report.scope === "team") return CURRENT_USER.isTeamAdmin;
    if (report.scope === "user") return report.ownerId === CURRENT_USER.id;
    return false;
  }

  function getAllReports() {
    var team = TEAM_REPORTS.filter(function (r) {
      return state.hiddenTeamIds.indexOf(r.id) === -1;
    });
    return {
      system: SYSTEM_REPORTS,
      team: team,
      user: state.userSaved
    };
  }

  function findReportById(id) {
    var all = getAllReports();
    var found = null;
    all.system.forEach(function (r) { if (r.id === id) found = r; });
    all.team.forEach(function (r) { if (r.id === id) found = r; });
    all.user.forEach(function (r) { if (r.id === id) found = r; });
    return found;
  }

  function nf(n) {
    return Number(n).toLocaleString();
  }

  function pct(a, b) {
    if (!b) return "—";
    return (100 * a / b).toFixed(1) + "%";
  }

  function loadCustomSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY + "user");
      state.userSaved = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.userSaved = [];
    }
    try {
      var hidden = localStorage.getItem(STORAGE_KEY + "hidden-team");
      state.hiddenTeamIds = hidden ? JSON.parse(hidden) : [];
    } catch (e2) {
      state.hiddenTeamIds = [];
    }
    if (!state.userSaved.length) {
      state.userSaved = [
        {
          id: "user-summer-deep-dive",
          title: "Summer Sale deep dive",
          meta: "You · last 7 days",
          scope: "user",
          ownerId: "kyle",
          chart: "table",
          rows: ["variant_name"],
          values: ["impressions", "clicks", "ctr", "score"],
          filters: { date: "Last 7 days", lander: "Summer Sale" }
        },
        {
          id: "user-hero-scroll",
          title: "Hero scroll check",
          meta: "You · behaviour",
          scope: "user",
          ownerId: "kyle",
          chart: "bar",
          rows: ["variant_name"],
          values: ["scroll_pct", "time_on_page"],
          filters: { date: "Last 7 days" }
        }
      ];
    }
  }

  function saveCustomSaved() {
    try {
      localStorage.setItem(STORAGE_KEY + "user", JSON.stringify(state.userSaved));
    } catch (e) {}
  }

  function saveHiddenTeam() {
    try {
      localStorage.setItem(STORAGE_KEY + "hidden-team", JSON.stringify(state.hiddenTeamIds));
    } catch (e) {}
  }

  function applyReport(report) {
    if (!report) return;
    state.presetId = report.id;
    state.chart = report.chart;
    state.rows = report.rows.slice();
    state.values = report.values.slice();
    state.filters = Object.assign({}, report.filters);
    renderBuilder();
    renderResult();
    renderSavedList();
    syncUrl();
  }

  function applyPreset(preset) {
    applyReport(preset);
  }

  function getCurrentConfig() {
    return {
      chart: state.chart,
      rows: state.rows.slice(),
      values: state.values.slice(),
      filters: Object.assign({}, state.filters)
    };
  }

  function renderSavedItem(report) {
    var isActive = state.presetId === report.id;
    var del = canDeleteReport(report)
      ? '<button type="button" class="rb-saved__delete" data-delete="' + report.id + '" aria-label="Delete report" title="Delete">×</button>'
      : "";
    return (
      '<li class="rb-saved__row">' +
      '<button type="button" class="rb-saved__item' + (isActive ? " is-active" : "") + '" data-report="' + report.id + '">' +
      '<div class="rb-saved__item-title">' + report.title + "</div>" +
      '<div class="rb-saved__item-meta">' + scopeLabel(report.scope) + " · " + (report.meta || report.chart) + "</div>" +
      "</button>" + del + "</li>"
    );
  }

  function renderSavedList() {
    var list = document.getElementById("rb-saved-list");
    if (!list) return;
    var groups = getAllReports();
    var html = "";

    html += '<li class="rb-saved__section">System</li>';
    groups.system.forEach(function (r) { html += renderSavedItem(r); });

    if (groups.team.length) {
      html += '<li class="rb-saved__section">Team · ' + CURRENT_TEAM + "</li>";
      groups.team.forEach(function (r) { html += renderSavedItem(r); });
    }

    if (groups.user.length) {
      html += '<li class="rb-saved__section">Your reports</li>';
      groups.user.forEach(function (r) { html += renderSavedItem(r); });
    }

    list.innerHTML = html;

    list.querySelectorAll("[data-report]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var report = findReportById(btn.getAttribute("data-report"));
        if (report) applyReport(report);
      });
    });

    list.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-delete");
        var report = findReportById(id);
        if (!report || !canDeleteReport(report)) return;
        if (!window.confirm('Delete "' + report.title + '"?')) return;
        if (report.scope === "user") {
          state.userSaved = state.userSaved.filter(function (r) { return r.id !== id; });
          saveCustomSaved();
        } else if (report.scope === "team") {
          if (state.hiddenTeamIds.indexOf(id) === -1) state.hiddenTeamIds.push(id);
          saveHiddenTeam();
        }
        if (state.presetId === id) applyReport(SYSTEM_REPORTS[0]);
        else renderSavedList();
      });
    });
  }

  function renderChips(containerId, items, labels, chipClass, onRemove, sortable) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var html = items.map(function (id) {
      var drag = sortable
        ? '<span class="rb-chip__drag" title="Drag to reorder" aria-hidden="true">⋮⋮</span>'
        : "";
      return '<span class="rb-chip' + (chipClass ? " " + chipClass : "") + (sortable ? " rb-chip--draggable" : "") + '" data-id="' + id + '"' + (sortable ? ' draggable="true" title="Drag to reorder"' : "") + ">" +
        drag +
        (labels[id] || id) +
        '<button type="button" class="rb-chip__x" data-remove="' + id + '" aria-label="Remove">×</button></span>';
    }).join("");
    html += '<button type="button" class="rb-chip-add" data-add-to="' + containerId + '" aria-label="Add">+</button>';
    el.innerHTML = html;
    el.querySelectorAll("[data-remove]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        onRemove(btn.getAttribute("data-remove"));
      });
    });
    el.querySelectorAll("[data-add-to]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        showAddPop(e.target, containerId);
      });
    });
    if (sortable) attachChipDragDrop(containerId);
  }

  function attachChipDragDrop(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var stateKey = containerKey(containerId);
    if (!stateKey) return;

    var dragId = null;

    function clearDropMarkers() {
      el.querySelectorAll(".rb-chip--drop-before, .rb-chip--drop-after").forEach(function (c) {
        c.classList.remove("rb-chip--drop-before", "rb-chip--drop-after");
      });
    }

    function reorder(sourceId, targetId, insertBefore) {
      var arr = state[stateKey].slice();
      var fromIdx = arr.indexOf(sourceId);
      var toIdx = arr.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1 || sourceId === targetId) return;
      arr.splice(fromIdx, 1);
      var insertIdx = insertBefore ? toIdx : toIdx + 1;
      if (fromIdx < insertIdx) insertIdx--;
      arr.splice(insertIdx, 0, sourceId);
      state[stateKey] = arr;
      state.presetId = "custom-current";
      renderBuilder();
      renderResult();
    }

    el.querySelectorAll(".rb-chip[data-id]").forEach(function (chip) {
      chip.addEventListener("dragstart", function (e) {
        if (e.target.closest(".rb-chip__x")) {
          e.preventDefault();
          return;
        }
        dragId = chip.getAttribute("data-id");
        chip.classList.add("rb-chip--dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", dragId);
      });

      chip.addEventListener("dragend", function () {
        chip.classList.remove("rb-chip--dragging");
        clearDropMarkers();
        dragId = null;
      });

      chip.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        var targetId = chip.getAttribute("data-id");
        if (!dragId || targetId === dragId) return;
        clearDropMarkers();
        var rect = chip.getBoundingClientRect();
        var before = e.clientX < rect.left + rect.width / 2;
        chip.classList.add(before ? "rb-chip--drop-before" : "rb-chip--drop-after");
      });

      chip.addEventListener("dragleave", function () {
        chip.classList.remove("rb-chip--drop-before", "rb-chip--drop-after");
      });

      chip.addEventListener("drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var sourceId = e.dataTransfer.getData("text/plain") || dragId;
        var targetId = chip.getAttribute("data-id");
        if (!sourceId || !targetId) return;
        var rect = chip.getBoundingClientRect();
        var insertBefore = e.clientX < rect.left + rect.width / 2;
        clearDropMarkers();
        reorder(sourceId, targetId, insertBefore);
      });
    });
  }

  function containerKey(containerId) {
    if (containerId === "rb-rows") return "rows";
    if (containerId === "rb-values") return "values";
    return null;
  }

  function showAddPop(anchor, containerId) {
    var existing = document.getElementById("rb-add-pop");
    if (existing) existing.remove();
    var pool, current, onAdd;
    if (containerId === "rb-rows") {
      pool = DIMENSIONS;
      current = state.rows;
      onAdd = function (id) { if (state.rows.indexOf(id) === -1) state.rows.push(id); renderBuilder(); };
    } else if (containerId === "rb-values") {
      pool = MEASURES;
      current = state.values;
      onAdd = function (id) { if (state.values.indexOf(id) === -1) state.values.push(id); renderBuilder(); };
    } else return;

    var pop = document.createElement("div");
    pop.id = "rb-add-pop";
    pop.className = "rb-add-pop";
    Object.keys(pool).forEach(function (id) {
      if (current.indexOf(id) !== -1) return;
      var opt = document.createElement("button");
      opt.type = "button";
      opt.className = "rb-add-pop__opt";
      opt.textContent = pool[id];
      opt.addEventListener("click", function () {
        onAdd(id);
        pop.remove();
      });
      pop.appendChild(opt);
    });
    document.body.appendChild(pop);
    var rect = anchor.getBoundingClientRect();
    pop.style.position = "fixed";
    pop.style.top = rect.bottom + 6 + "px";
    pop.style.left = rect.left + "px";
    setTimeout(function () {
      document.addEventListener("click", function close(e) {
        if (!pop.contains(e.target) && e.target !== anchor) {
          pop.remove();
          document.removeEventListener("click", close);
        }
      });
    }, 0);
  }

  function renderBuilder() {
    renderChips("rb-rows", state.rows, DIMENSIONS, "", function (id) {
      state.rows = state.rows.filter(function (r) { return r !== id; });
      renderBuilder();
    }, true);
    renderChips("rb-values", state.values, MEASURES, "rb-chip--value", function (id) {
      state.values = state.values.filter(function (v) { return v !== id; });
      renderBuilder();
    }, true);
    var filtersEl = document.getElementById("rb-filters");
    if (filtersEl) {
      var fhtml = Object.keys(state.filters).map(function (k) {
        return '<span class="rb-chip rb-chip--filter">' + k + ": " + state.filters[k] +
          '<button type="button" class="rb-chip__x" aria-label="Remove">×</button></span>';
      }).join("");
      fhtml += '<span class="rb-chip rb-chip--filter">Status: Published</span>';
      fhtml += '<span class="rb-chip rb-chip--filter">Lander: <span id="rb-filter-lander">' + (state.filters.lander || "All") + "</span></span>";
      filtersEl.innerHTML = fhtml;
    }
    var chartLabel = document.getElementById("rb-chart-label");
    var ct = CHART_TYPES.find(function (c) { return c.id === state.chart; });
    if (chartLabel) chartLabel.textContent = ct ? ct.label : "Table";
    document.querySelectorAll(".rb-charts-dd__opt").forEach(function (opt) {
      opt.classList.toggle("is-active", opt.getAttribute("data-chart") === state.chart);
    });
  }

  function renderBarChart(rows, rowKey, valueKeys) {
    var max = 0;
    rows.forEach(function (r) {
      valueKeys.forEach(function (k) {
        var v = typeof r[k] === "number" ? r[k] : parseFloat(r[k]) || 0;
        if (v > max) max = v;
      });
    });
    if (!max) max = 1;
    return '<div class="rb-bar-chart">' + rows.map(function (r) {
      var bars = valueKeys.map(function (k, i) {
        var v = typeof r[k] === "number" ? r[k] : parseFloat(r[k]) || 0;
        var h = Math.max(4, Math.round((v / max) * 150));
        return '<div class="rb-bar rb-bar--' + (i === 0 ? "a" : "b") + '" style="height:' + h + 'px" title="' + (MEASURES[k] || k) + ': ' + v + '"></div>';
      }).join("");
      return '<div class="rb-bar-group"><div class="rb-bar-group__bars">' + bars + '</div><div class="rb-bar-group__label">' + (r[rowKey] || "—") + "</div></div>";
    }).join("") + "</div>";
  }

  function renderFunnel(steps) {
    var funnelSteps = steps || FORM_FUNNEL_STEPS;
    return '<div class="rb-funnel-viz">' + funnelSteps.map(function (s) {
      return '<div class="rb-funnel-viz__step"><span>' + s.label + '</span><div class="rb-funnel-viz__bar"><div class="rb-funnel-viz__fill" style="width:' + s.pct + '%"></div></div><strong>' + nf(s.val) + "</strong></div>";
    }).join("") + "</div>";
  }

  function pctOf(part, whole) {
    if (!whole) return "—";
    return (Math.round((part / whole) * 1000) / 10) + "%";
  }

  function renderFormStepFunnel(form) {
    var prev = form.form_start;
    var bars = [{ label: "Start", count: form.form_start, pct: 100 }];
    form.steps.forEach(function (step, i) {
      var rate = prev ? Math.round((step.count / prev) * 1000) / 10 : 0;
      bars.push({
        label: "Step " + (i + 1) + ": " + step.label,
        count: step.count,
        pct: form.form_start ? Math.round((step.count / form.form_start) * 1000) / 10 : 0,
        drop: rate
      });
      prev = step.count;
    });
    bars.push({
      label: "Submit",
      count: form.form_submit,
      pct: form.form_start ? Math.round((form.form_submit / form.form_start) * 1000) / 10 : 0,
      drop: prev ? Math.round((form.form_submit / prev) * 1000) / 10 : 0
    });
    return '<div class="rb-form-step-funnel">' + bars.map(function (b, idx) {
      var drop = idx > 0 && b.drop != null ? '<span class="rb-form-step-funnel__drop">' + b.drop + "% from prev</span>" : "";
      return '<div class="rb-form-step-funnel__step">' +
        '<div class="rb-form-step-funnel__label">' + b.label + drop + "</div>" +
        '<div class="rb-funnel-viz__bar"><div class="rb-funnel-viz__fill" style="width:' + b.pct + '%"></div></div>' +
        "<strong>" + nf(b.count) + "</strong></div>";
    }).join("") + "</div>";
  }

  function renderFormFunnelTable() {
    var rows = FORM_FUNNEL_DATA.map(function (form) {
      var cvr = pctOf(form.form_submit, form.form_start);
      return '<tr class="rb-form-funnel-row" data-form-funnel="' + form.id + '">' +
        '<td><button type="button" class="rb-form-funnel-toggle" aria-expanded="false" aria-label="Show step funnel">▸</button> ' + form.form_widget + "</td>" +
        "<td>" + nf(form.form_start) + "</td>" +
        "<td>" + form.steps.length + "</td>" +
        "<td>" + nf(form.form_submit) + "</td>" +
        "<td>" + cvr + "</td>" +
        "<td>" + nf(form.form_abandon) + "</td>" +
        "</tr>" +
        '<tr class="rb-form-funnel-detail" data-form-funnel-detail="' + form.id + '" hidden>' +
        '<td colspan="6">' + renderFormStepFunnel(form) + "</td></tr>";
    }).join("");
    return '<p class="muted" style="font-size:12px;margin:0 0 12px;">Form widgets only · expand a row for that form\'s step funnel (steps come from widget schema)</p>' +
      '<div class="kb-funnel-stats" style="margin-bottom:16px;">' +
      '<div class="kb-funnel-step"><div class="kb-funnel-step__label">Form starts</div><div class="kb-funnel-step__val">98,200</div></div>' +
      '<div class="kb-funnel-step"><div class="kb-funnel-step__label">Submits</div><div class="kb-funnel-step__val">52,164</div></div>' +
      '<div class="kb-funnel-step"><div class="kb-funnel-step__label">Avg CVR</div><div class="kb-funnel-step__val">53.1%</div></div>' +
      '<div class="kb-funnel-step"><div class="kb-funnel-step__label">Abandons</div><div class="kb-funnel-step__val">46,036</div></div></div>' +
      '<div class="table-scroll rb-table-wrap"><table class="table rb-form-funnel-table"><thead><tr>' +
      "<th>Form widget</th><th>Starts</th><th>Steps</th><th>Submits</th><th>CVR</th><th>Abandon</th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>";
  }

  function renderKbFunnelTable() {
    var flatRows = [];
    KB_KEYWORD_FUNNEL_DATA.forEach(function (kw) {
      kw.ads.forEach(function (ad) {
        flatRows.push({
          keyword: kw.keyword,
          ad_title: ad.ad_title,
          kb_widget_views: ad.kb_widget_views,
          kb_block_clicks: ad.kb_block_clicks,
          kb_ad_clicks: ad.kb_ad_clicks
        });
      });
    });

    var body = flatRows.map(function (row) {
      return "<tr>" +
        "<td><strong>" + row.keyword + "</strong></td>" +
        "<td>" + row.ad_title + "</td>" +
        '<td class="right">' + nf(row.kb_widget_views) + "</td>" +
        '<td class="right">' + nf(row.kb_block_clicks) + "</td>" +
        '<td class="right">' + nf(row.kb_ad_clicks) + "</td>" +
        "</tr>";
    }).join("");

    var totals = flatRows.reduce(function (acc, row) {
      acc.views += row.kb_widget_views;
      acc.blocks += row.kb_block_clicks;
      acc.clicks += row.kb_ad_clicks;
      return acc;
    }, { views: 0, blocks: 0, clicks: 0 });

    return '<p class="muted" style="font-size:12px;margin:0 0 12px;">Keyword block funnel · one row per keyword + ad title</p>' +
      '<div class="kb-funnel-stats" style="margin-bottom:16px;">' +
      '<div class="kb-funnel-step"><div class="kb-funnel-step__label">Widget views</div><div class="kb-funnel-step__val">6,008</div></div>' +
      '<div class="kb-funnel-step"><div class="kb-funnel-step__label">Keyword picks</div><div class="kb-funnel-step__val">1,564</div></div>' +
      '<div class="kb-funnel-step"><div class="kb-funnel-step__label">Ad clicks</div><div class="kb-funnel-step__val">74</div></div>' +
      '<div class="kb-funnel-step"><div class="kb-funnel-step__label">Ad CTR</div><div class="kb-funnel-step__val">4.7%</div></div></div>' +
      '<div class="table-scroll rb-table-wrap"><table class="table rb-kb-funnel-table"><thead><tr>' +
      "<th>keyword</th><th>ad title</th><th class=\"right\">KB widget views</th><th class=\"right\">KB block clicks</th><th class=\"right\">KB ad clicks</th>" +
      "</tr></thead><tbody>" + body + '</tbody><tfoot><tr class="rb-table-total">' +
      "<td><strong>Grand total</strong></td><td></td>" +
      '<td class="right"><strong>' + nf(totals.views) + "</strong></td>" +
      '<td class="right"><strong>' + nf(totals.blocks) + "</strong></td>" +
      '<td class="right"><strong>' + nf(totals.clicks) + "</strong></td></tr></tfoot></table></div>";
  }

  function wireFormFunnelToggles(root) {
    if (!root) return;
    root.querySelectorAll(".rb-form-funnel-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var row = btn.closest(".rb-form-funnel-row");
        if (!row) return;
        var id = row.getAttribute("data-form-funnel");
        var detail = root.querySelector('[data-form-funnel-detail="' + id + '"]');
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        btn.textContent = open ? "▸" : "▾";
        if (detail) detail.hidden = open;
        row.classList.toggle("is-expanded", !open);
      });
    });
  }

  function computeHistogram(samples, accessor, mode, binCount, binSize, maxVal) {
    var values = samples.map(accessor);
    var max = maxVal || Math.max.apply(null, values.concat([1]));
    var numBins;
    var step;
    if (mode === "size") {
      step = Math.max(1, binSize);
      numBins = Math.ceil(max / step);
      if (numBins > 20) {
        numBins = 20;
        step = Math.ceil(max / numBins);
      }
    } else {
      numBins = Math.max(3, Math.min(16, binCount));
      step = max / numBins;
    }
    var bins = [];
    for (var i = 0; i < numBins; i++) {
      var low = i * step;
      var high = (i + 1) * step;
      var count = values.filter(function (v) {
        if (i === numBins - 1) return v >= low && v <= high;
        return v >= low && v < high;
      }).length;
      bins.push({ low: low, high: high, count: count });
    }
    var avg = values.reduce(function (a, b) { return a + b; }, 0) / (values.length || 1);
    var maxCount = Math.max.apply(null, bins.map(function (b) { return b.count; }).concat([1]));
    return { bins: bins, avg: avg, maxCount: maxCount, step: step };
  }

  function formatHistLabel(low, high, suffix) {
    var a = Math.round(low);
    var b = Math.round(high);
    if (suffix === "%") return a + "–" + b + suffix;
    return a + "–" + b + suffix;
  }

  function renderHistControls(prefix, mode, bins, binSize, sizeOptions, sizeSuffix) {
    var modeOpts = '<option value="count"' + (mode === "count" ? " selected" : "") + ">Number of bins</option>" +
      '<option value="size"' + (mode === "size" ? " selected" : "") + ">Bin size</option>";
    var countOpts = [4, 5, 6, 8, 10, 12, 16].map(function (n) {
      return '<option value="' + n + '"' + (bins === n ? " selected" : "") + ">" + n + " bins</option>";
    }).join("");
    var sizeOpts = sizeOptions.map(function (n) {
      return '<option value="' + n + '"' + (binSize === n ? " selected" : "") + ">" + n + sizeSuffix + "</option>";
    }).join("");
    return (
      '<div class="rb-hist-controls" data-hist="' + prefix + '">' +
      '<label class="rb-hist-controls__field"><span>Grouping</span><select class="rb-hist-mode" data-hist="' + prefix + '">' + modeOpts + "</select></label>" +
      '<label class="rb-hist-controls__field rb-hist-controls__count"' + (mode === "count" ? "" : ' hidden') + '><span>Bins</span><select class="rb-hist-bins" data-hist="' + prefix + '">' + countOpts + "</select></label>" +
      '<label class="rb-hist-controls__field rb-hist-controls__size"' + (mode === "size" ? "" : ' hidden') + '><span>Bin size</span><select class="rb-hist-size" data-hist="' + prefix + '">' + sizeOpts + "</select></label>" +
      "</div>"
    );
  }

  function renderHistogramBars(hist, suffix, avgLine) {
    return '<div class="rb-time-histogram">' + hist.bins.map(function (b, i) {
      var h = Math.max(4, Math.round((b.count / hist.maxCount) * 130));
      var inAvg = avgLine && hist.avg >= b.low && (i === hist.bins.length - 1 ? hist.avg <= b.high : hist.avg < b.high);
      return (
        '<div class="rb-time-histogram__bar-wrap">' +
        '<div class="rb-time-histogram__bar' + (inAvg ? " is-avg" : "") + '" style="height:' + h + 'px" title="' + b.count + ' visits"></div>' +
        '<div class="rb-time-histogram__label">' + formatHistLabel(b.low, b.high, suffix) + "</div>" +
        "</div>"
      );
    }).join("") + "</div>";
  }

  function renderBehaviourHeatmap() {
    return (
      '<div class="rb-heatmap-row">' +
      '<div class="rb-heatmap-preview">' +
      '<div class="rb-heatmap-preview__chrome">' +
      '<div class="rb-heatmap-preview__bar"></div>' +
      '<div class="rb-heatmap-preview__screen">' +
      '<div class="rb-heatmap-preview__screen-inner">' +
      '<div class="rb-heatmap-preview__hero"><h3>Summer Sale — Main hero</h3><p>Limited-time offer on premium plans.</p><span class="rb-heatmap-preview__cta">Get started</span></div>' +
      '<div class="rb-heatmap-preview__block">Social proof · 12k+ customers</div>' +
      '<div class="rb-heatmap-preview__block">Feature grid · Compare plans</div>' +
      '<div class="rb-heatmap-preview__block">FAQ accordion</div>' +
      "</div>" +
      '<div class="rb-heatmap-overlay" aria-hidden="true"></div>' +
      "</div></div></div>" +
      '<div class="rb-heatmap-meta">' +
      "<h3>Full-page click heatmap</h3>" +
      '<p class="muted" style="font-size:12px;margin:4px 0 0;">Aggregated pointer taps &amp; scroll stops · all visits in filter</p>' +
      '<div class="rb-heatmap-stats">' +
      '<div class="rb-heatmap-stat"><div class="rb-heatmap-stat__label">Hot zone</div><div class="rb-heatmap-stat__val">Hero CTA</div></div>' +
      '<div class="rb-heatmap-stat"><div class="rb-heatmap-stat__label">Median scroll</div><div class="rb-heatmap-stat__val">71%</div></div>' +
      '<div class="rb-heatmap-stat"><div class="rb-heatmap-stat__label">Avg time</div><div class="rb-heatmap-stat__val">44s</div></div>' +
      '<div class="rb-heatmap-stat"><div class="rb-heatmap-stat__label">Visits mapped</div><div class="rb-heatmap-stat__val">' + VISIT_BEHAVIOUR_SAMPLES.length + "+</div></div>" +
      "</div>" +
      '<div class="rb-heatmap-legend"><span>Low</span><div class="rb-heatmap-legend__gradient"></div><span>High</span></div>' +
      "</div></div>"
    );
  }

  function renderBehaviourDashboard() {
    var timeHist = computeHistogram(
      VISIT_BEHAVIOUR_SAMPLES,
      function (s) { return s.time_sec; },
      state.histTimeMode,
      state.histTimeBins,
      state.histTimeBinSize,
      150
    );
    var scrollHist = computeHistogram(
      VISIT_BEHAVIOUR_SAMPLES,
      function (s) { return s.scroll; },
      state.histScrollMode,
      state.histScrollBins,
      state.histScrollBinSize,
      100
    );
    return (
      '<div class="rb-behaviour-dashboard">' +
      '<div class="rb-behaviour-charts">' +
      '<div class="rb-hist-card">' +
      '<div class="rb-hist-card__head">' +
      '<div><h3 class="rb-hist-card__title">Time on page</h3><p class="rb-hist-card__sub">Distribution across visits · avg ' + Math.round(timeHist.avg) + "s</p></div>" +
      renderHistControls("time", state.histTimeMode, state.histTimeBins, state.histTimeBinSize, [5, 10, 15, 20, 30, 45], "s") +
      "</div>" +
      renderHistogramBars(timeHist, "s", true) +
      "</div>" +
      '<div class="rb-hist-card">' +
      '<div class="rb-hist-card__head">' +
      '<div><h3 class="rb-hist-card__title">Scroll depth</h3><p class="rb-hist-card__sub">Max scroll % per visit · avg ' + Math.round(scrollHist.avg) + "%</p></div>" +
      renderHistControls("scroll", state.histScrollMode, state.histScrollBins, state.histScrollBinSize, [5, 10, 15, 20, 25], "%") +
      "</div>" +
      renderHistogramBars(scrollHist, "%", true) +
      "</div>" +
      "</div>" +
      renderBehaviourHeatmap() +
      "</div>"
    );
  }

  function wireBehaviourControls(root) {
    if (!root) return;
    root.querySelectorAll(".rb-hist-mode").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var key = sel.getAttribute("data-hist");
        if (key === "time") state.histTimeMode = sel.value;
        else state.histScrollMode = sel.value;
        renderResult();
      });
    });
    root.querySelectorAll(".rb-hist-bins").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var key = sel.getAttribute("data-hist");
        var val = parseInt(sel.value, 10);
        if (key === "time") state.histTimeBins = val;
        else state.histScrollBins = val;
        renderResult();
      });
    });
    root.querySelectorAll(".rb-hist-size").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var key = sel.getAttribute("data-hist");
        var val = parseInt(sel.value, 10);
        if (key === "time") state.histTimeBinSize = val;
        else state.histScrollBinSize = val;
        renderResult();
      });
    });
  }

  function isBehaviourReport() {
    if (state.presetId === "visit-behaviour") return true;
    var report = findReportById(state.presetId);
    return report && report.layout === "behaviour";
  }

  function renderTable(rows, rowCols, valueCols, isVisit) {
    var thead = rowCols.map(function (c) { return "<th>" + (DIMENSIONS[c] || c) + "</th>"; }).join("") +
      valueCols.map(function (c) { return '<th class="right">' + (MEASURES[c] || c) + "</th>"; }).join("");
    var tbody = rows.map(function (r) {
      var cells = rowCols.map(function (c) {
        var v = r[c];
        if (c === "visit_id" && isVisit) {
          return '<td class="mono"><a href="logs.html?tab=lander&visit_id=' + encodeURIComponent(v) + '">' + v + "</a></td>";
        }
        return "<td>" + (v != null ? v : "—") + "</td>";
      }).join("");
      cells += valueCols.map(function (c) {
        var v = r[c];
        if (c === "ctr" && r.clicks != null) v = pct(r.clicks, r.impressions);
        if (c === "cvr" && r.conversions != null) v = pct(r.conversions, r.clicks);
        if (c === "clicks" && typeof v === "number") v = nf(v);
        if (c === "impressions" || c === "conversions") v = nf(v);
        if (c === "score" && typeof v === "number") v = v.toFixed(3);
        return '<td class="right num">' + (v != null ? v : "—") + "</td>";
      }).join("");
      return "<tr>" + cells + "</tr>";
    }).join("");

    var tfoot = "";
    if (!isVisit && rows.length) {
      var sumImp = 0, sumClk = 0, sumConv = 0;
      rows.forEach(function (r) {
        sumImp += r.impressions || 0;
        sumClk += r.clicks || 0;
        sumConv += r.conversions || 0;
      });
      tfoot = '<tfoot><tr class="rb-grand-total"><td colspan="' + rowCols.length + '"><strong>Grand total</strong></td>';
      valueCols.forEach(function (c) {
        if (c === "impressions") tfoot += '<td class="right">' + nf(sumImp) + "</td>";
        else if (c === "clicks") tfoot += '<td class="right">' + nf(sumClk) + "</td>";
        else if (c === "conversions") tfoot += '<td class="right">' + nf(sumConv) + "</td>";
        else if (c === "ctr") tfoot += '<td class="right">' + pct(sumClk, sumImp) + "</td>";
        else if (c === "cvr") tfoot += '<td class="right">' + pct(sumConv, sumClk) + "</td>";
        else if (c === "avg_time_on_page") {
          var wTime = 0;
          rows.forEach(function (r) { wTime += (r.avg_time_sec || 0) * (r.impressions || 0); });
          tfoot += '<td class="right">' + (sumImp ? Math.round(wTime / sumImp) + "s" : "—") + "</td>";
        } else if (c === "avg_scroll_pct") {
          var wScroll = 0;
          rows.forEach(function (r) { wScroll += (r.avg_scroll_num || 0) * (r.impressions || 0); });
          tfoot += '<td class="right">' + (sumImp ? Math.round(wScroll / sumImp) + "%" : "—") + "</td>";
        } else tfoot += '<td class="right">—</td>';
      });
      tfoot += "</tr></tfoot>";
    }

    return '<div class="table-scroll rb-table-wrap"><table class="table"><thead><tr>' + thead + "</tr></thead><tbody>" + tbody + "</tbody>" + tfoot + "</table></div>";
  }

  function renderResult() {
    var chartWrap = document.getElementById("rb-chart-area");
    var tableWrap = document.getElementById("rb-table-area");
    var meta = document.getElementById("rb-result-meta");
    if (!chartWrap || !tableWrap) return;

    var isBehaviour = isBehaviourReport();
    var isVisit = isBehaviour || state.rows.indexOf("visit_id") !== -1;
    var isFormFunnel = state.presetId === "form-funnels" || state.presetId === "team-form-dropoff";
    var isKbFunnel = state.presetId === "kb-funnels";
    var isFunnel = isFormFunnel || isKbFunnel || state.chart === "funnel";
    var isChart = state.chart === "bar" || state.chart === "line" || state.chart === "area";

    var rows, rowCols, valueCols;
    if (isVisit) {
      rows = VISIT_ROWS;
      rowCols = state.rows.length ? state.rows : ["visit_id", "lander_name", "variant_name"];
      valueCols = state.values.length ? state.values : ["time_on_page", "scroll_pct"];
    } else if (isFunnel) {
      rows = [];
      rowCols = [];
      valueCols = [];
    } else if (isChart || state.presetId === "scroll-time-charts") {
      rows = CHART_ROWS;
      rowCols = state.rows.length ? state.rows : ["variant_name"];
      valueCols = state.values.length ? state.values : ["time_on_page", "scroll_pct"];
    } else {
      rows = AGG_ROWS;
      rowCols = state.rows.length ? state.rows : ["lander_name", "variant_name"];
      valueCols = state.values.length ? state.values : ["impressions", "clicks", "ctr"];
    }

    chartWrap.hidden = !isChart && !isFunnel && !isBehaviour;
    if (isBehaviour) {
      chartWrap.innerHTML = renderBehaviourDashboard();
      wireBehaviourControls(chartWrap);
    } else if (isFunnel) {
      chartWrap.innerHTML = renderFunnel(isKbFunnel ? KB_FUNNEL_STEPS : FORM_FUNNEL_STEPS);
    } else if (isChart) {
      var vk = valueCols.filter(function (c) { return ["time_on_page", "scroll_pct", "visits", "impressions", "clicks"].indexOf(c) !== -1; }).slice(0, 2);
      if (!vk.length) vk = ["time_on_page", "scroll_pct"];
      chartWrap.innerHTML = renderBarChart(rows, rowCols[0] || "variant_name", vk);
    } else {
      chartWrap.innerHTML = "";
    }

    if (isFormFunnel) {
      tableWrap.innerHTML = renderFormFunnelTable();
      wireFormFunnelToggles(tableWrap);
    } else if (isKbFunnel) {
      tableWrap.innerHTML = renderKbFunnelTable();
    } else if (state.chart === "funnel") {
      tableWrap.innerHTML = renderFormFunnelTable();
      wireFormFunnelToggles(tableWrap);
    } else {
      if (isBehaviour) {
        tableWrap.innerHTML = '<p class="rb-section-label">Visit-level trace</p>' + renderTable(rows, rowCols, valueCols, true);
      } else {
        tableWrap.innerHTML = renderTable(rows, rowCols, valueCols, isVisit);
      }
    }

    if (meta) {
      var label = (CHART_TYPES.find(function (c) { return c.id === state.chart; }) || {}).label;
      meta.textContent = isBehaviour
        ? rows.length + " visits · histograms + heatmap"
        : rows.length + " rows · " + label;
    }
  }

  function syncUrl() {
    var url = new URL(window.location.href);
    url.searchParams.set("report", state.presetId);
    window.history.replaceState({}, "", url.toString());
  }

  function init() {
    loadCustomSaved();
    var params = new URLSearchParams(window.location.search);
    var reportId = params.get("report");
    var lander = params.get("lander");
    var preset = SYSTEM_REPORTS.find(function (p) { return p.id === reportId; }) || SYSTEM_REPORTS[0];
    applyPreset(preset);
    if (lander) {
      state.filters.lander = lander;
      renderBuilder();
    }

    var chartsBtn = document.getElementById("rb-charts-btn");
    var chartsMenu = document.getElementById("rb-charts-menu");
    if (chartsBtn && chartsMenu) {
      chartsBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        chartsMenu.hidden = !chartsMenu.hidden;
      });
      document.addEventListener("click", function () {
        if (chartsMenu) chartsMenu.hidden = true;
      });
      chartsMenu.querySelectorAll(".rb-charts-dd__opt").forEach(function (opt) {
        opt.addEventListener("click", function () {
          if (opt.classList.contains("is-disabled")) return;
          state.chart = opt.getAttribute("data-chart");
          chartsMenu.hidden = true;
          renderBuilder();
          renderResult();
        });
      });
    }

    var genBtn = document.getElementById("rb-generate");
    if (genBtn) genBtn.addEventListener("click", renderResult);

    var saveBtn = document.getElementById("rb-save-view");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var name = window.prompt("Name this report view:", "My custom report");
        if (!name || !name.trim()) return;
        var cfg = getCurrentConfig();
        var id = "user-" + Date.now().toString(36);
        var report = {
          id: id,
          title: name.trim(),
          meta: "You · " + (CHART_TYPES.find(function (c) { return c.id === cfg.chart; }) || {}).label,
          scope: "user",
          ownerId: CURRENT_USER.id,
          chart: cfg.chart,
          rows: cfg.rows,
          values: cfg.values,
          filters: cfg.filters
        };
        state.userSaved.unshift(report);
        saveCustomSaved();
        applyReport(report);
      });
    }

    var exportBtn = document.getElementById("rb-export");
    if (exportBtn) exportBtn.addEventListener("click", function () {
      alert("Export CSV — prototype only.");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

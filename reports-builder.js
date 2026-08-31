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

  var PRESETS = [
    {
      id: "lander-performance",
      title: "Lander performance",
      meta: "Aggregate · variant × lander",
      type: "agg",
      chart: "table",
      rows: ["lander_name", "variant_name"],
      values: ["impressions", "clicks", "ctr", "conversions", "cvr", "score"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    },
    {
      id: "visit-behaviour",
      title: "Visit behaviour trace",
      meta: "Visit-level · 1 row per visit_id",
      type: "visit",
      chart: "table",
      rows: ["visit_id", "lander_name", "variant_name", "device", "visit_time"],
      values: ["time_on_page", "scroll_pct", "form_start", "form_submit", "clicks"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    },
    {
      id: "scroll-time-charts",
      title: "Scroll & time by variant",
      meta: "Charts · behaviour summary",
      type: "chart",
      chart: "bar",
      rows: ["variant_name"],
      values: ["time_on_page", "scroll_pct", "visits"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    },
    {
      id: "widget-funnels",
      title: "Form & keyword funnels",
      meta: "Widget metrics · funnel steps",
      type: "widget",
      chart: "funnel",
      rows: ["form_widget"],
      values: ["form_start", "form_submit", "kb_widget_views", "kb_block_clicks", "kb_ad_clicks"],
      filters: { date: "Last 7 days", status: "Published", domain: "All domains" }
    }
  ];

  var AGG_ROWS = [
    { lander_name: "Summer Sale", variant_name: "Main hero", impressions: 112613, clicks: 75899, conversions: 52164, score: 0.463 },
    { lander_name: "Referral Q2", variant_name: "Single-field", impressions: 16951, clicks: 8608, conversions: 4657, score: 0.275 },
    { lander_name: "Founder Letter", variant_name: "Long form", impressions: 14668, clicks: 6601, conversions: 2376, score: 0.162 },
    { lander_name: "Hedge Your Future", variant_name: "Reader modal", impressions: 3248, clicks: 47, conversions: 12, score: 0.014 },
    { lander_name: "Black Friday", variant_name: "Orange bold", impressions: 5786, clicks: 1042, conversions: 185, score: 0.032 }
  ];

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

  var FUNNEL_STEPS = [
    { label: "Visits", val: 118420, pct: 100 },
    { label: "Form start", val: 98200, pct: 82.9 },
    { label: "Step 1 complete", val: 86400, pct: 73.8 },
    { label: "Submit", val: 52164, pct: 53.1 },
    { label: "KB widget views", val: 3248, pct: 97.0 },
    { label: "Keyword picks", val: 964, pct: 29.7 },
    { label: "Ad clicks", val: 47, pct: 5.0 }
  ];

  var state = {
    presetId: "lander-performance",
    chart: "table",
    rows: [],
    values: [],
    filters: {},
    customSaved: []
  };

  function nf(n) {
    return Number(n).toLocaleString();
  }

  function pct(a, b) {
    if (!b) return "—";
    return (100 * a / b).toFixed(1) + "%";
  }

  function loadCustomSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY + "custom");
      state.customSaved = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.customSaved = [];
    }
  }

  function saveCustomSaved() {
    try {
      localStorage.setItem(STORAGE_KEY + "custom", JSON.stringify(state.customSaved));
    } catch (e) {}
  }

  function applyPreset(preset) {
    state.presetId = preset.id;
    state.chart = preset.chart;
    state.rows = preset.rows.slice();
    state.values = preset.values.slice();
    state.filters = Object.assign({}, preset.filters);
    renderBuilder();
    renderResult();
    renderSavedList();
    syncUrl();
  }

  function getCurrentConfig() {
    return {
      chart: state.chart,
      rows: state.rows.slice(),
      values: state.values.slice(),
      filters: Object.assign({}, state.filters)
    };
  }

  function renderSavedList() {
    var list = document.getElementById("rb-saved-list");
    if (!list) return;
    var html = "";
    PRESETS.forEach(function (p) {
      html +=
        '<li><button type="button" class="rb-saved__item' + (state.presetId === p.id ? " is-active" : "") + '" data-preset="' + p.id + '">' +
        '<span class="rb-saved__badge rb-saved__badge--' + p.type + '">' + p.type + '</span>' +
        '<div class="rb-saved__item-title">' + p.title + "</div>" +
        '<div class="rb-saved__item-meta">' + p.meta + "</div></button></li>";
    });
    if (state.customSaved.length) {
      html += '<li style="padding:8px 10px 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7a7568;">Your saved views</li>';
      state.customSaved.forEach(function (s, i) {
        html +=
          '<li><button type="button" class="rb-saved__item' + (state.presetId === "custom-" + i ? " is-active" : "") + '" data-custom="' + i + '">' +
          '<div class="rb-saved__item-title">' + s.name + "</div>" +
          '<div class="rb-saved__item-meta">' + s.chart + " · " + s.rows.length + " rows</div></button></li>";
      });
    }
    list.innerHTML = html;
    list.querySelectorAll("[data-preset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-preset");
        var preset = PRESETS.find(function (p) { return p.id === id; });
        if (preset) applyPreset(preset);
      });
    });
    list.querySelectorAll("[data-custom]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(btn.getAttribute("data-custom"), 10);
        var s = state.customSaved[i];
        if (!s) return;
        state.presetId = "custom-" + i;
        state.chart = s.chart;
        state.rows = s.rows.slice();
        state.values = s.values.slice();
        state.filters = Object.assign({}, s.filters);
        renderBuilder();
        renderResult();
        renderSavedList();
      });
    });
  }

  function renderChips(containerId, items, labels, chipClass, onRemove) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var html = items.map(function (id) {
      return '<span class="rb-chip' + (chipClass ? " " + chipClass : "") + '" data-id="' + id + '">' +
        (labels[id] || id) +
        '<button type="button" class="rb-chip__x" data-remove="' + id + '" aria-label="Remove">×</button></span>';
    }).join("");
    html += '<button type="button" class="rb-chip-add" data-add-to="' + containerId + '" aria-label="Add">+</button>';
    el.innerHTML = html;
    el.querySelectorAll("[data-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        onRemove(btn.getAttribute("data-remove"));
      });
    });
    el.querySelectorAll("[data-add-to]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        showAddPop(e.target, containerId);
      });
    });
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
    });
    renderChips("rb-values", state.values, MEASURES, "rb-chip--value", function (id) {
      state.values = state.values.filter(function (v) { return v !== id; });
      renderBuilder();
    });
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

  function renderFunnel() {
    return '<div class="rb-funnel-viz">' + FUNNEL_STEPS.map(function (s) {
      return '<div class="rb-funnel-viz__step"><span>' + s.label + '</span><div class="rb-funnel-viz__bar"><div class="rb-funnel-viz__fill" style="width:' + s.pct + '%"></div></div><strong>' + nf(s.val) + "</strong></div>";
    }).join("") + "</div>";
  }

  function renderTable(rows, rowCols, valueCols, isVisit) {
    var thead = rowCols.map(function (c) { return "<th>" + (DIMENSIONS[c] || c) + "</th>"; }).join("") +
      valueCols.map(function (c) { return '<th class="right">' + (MEASURES[c] || c) + "</th>"; }).join("");
    var tbody = rows.map(function (r) {
      var cells = rowCols.map(function (c) {
        var v = r[c];
        if (c === "visit_id" && isVisit) {
          return '<td class="mono"><a href="logs.html?visit_id=' + encodeURIComponent(v) + '">' + v + "</a></td>";
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
        else tfoot += '<td class="right">—</td>';
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

    var isVisit = state.presetId === "visit-behaviour" || state.rows.indexOf("visit_id") !== -1;
    var isFunnel = state.chart === "funnel" || state.presetId === "widget-funnels";
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

    chartWrap.hidden = !isChart && !isFunnel;
    if (isFunnel) {
      chartWrap.innerHTML = renderFunnel();
    } else if (isChart) {
      var vk = valueCols.filter(function (c) { return ["time_on_page", "scroll_pct", "visits", "impressions", "clicks"].indexOf(c) !== -1; }).slice(0, 2);
      if (!vk.length) vk = ["time_on_page", "scroll_pct"];
      chartWrap.innerHTML = renderBarChart(rows, rowCols[0] || "variant_name", vk);
    } else {
      chartWrap.innerHTML = "";
    }

    if (isFunnel) {
      tableWrap.innerHTML = '<p class="muted" style="font-size:12px;margin:0 0 12px;">Funnel steps — form + keyword block widgets · last 7 days</p>' +
        '<div class="kb-funnel-stats" style="margin-bottom:16px;">' +
        '<div class="kb-funnel-step"><div class="kb-funnel-step__label">Form starts</div><div class="kb-funnel-step__val">98,200</div></div>' +
        '<div class="kb-funnel-step"><div class="kb-funnel-step__label">Submits</div><div class="kb-funnel-step__val">52,164</div></div>' +
        '<div class="kb-funnel-step"><div class="kb-funnel-step__label">KB picks</div><div class="kb-funnel-step__val">964</div></div>' +
        '<div class="kb-funnel-step"><div class="kb-funnel-step__label">Ad clicks</div><div class="kb-funnel-step__val">47</div></div></div>' +
        renderTable([
          { form_widget: "Lead — short qualify", form_start: 42100, form_submit: 18200, kb_widget_views: "—", kb_block_clicks: "—", kb_ad_clicks: "—" },
          { form_widget: "Quote request", form_start: 28400, form_submit: 12100, kb_widget_views: "—", kb_block_clicks: "—", kb_ad_clicks: "—" },
          { form_widget: "Passive investing KB", form_start: "—", form_submit: "—", kb_widget_views: 3248, kb_block_clicks: 964, kb_ad_clicks: 47 }
        ], ["form_widget"], state.values, false);
    } else {
      tableWrap.innerHTML = renderTable(rows, rowCols, valueCols, isVisit);
    }

    if (meta) {
      meta.textContent = rows.length + " rows · " + (CHART_TYPES.find(function (c) { return c.id === state.chart; }) || {}).label;
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
    var preset = PRESETS.find(function (p) { return p.id === reportId; }) || PRESETS[0];
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
        cfg.name = name.trim();
        state.customSaved.push(cfg);
        saveCustomSaved();
        renderSavedList();
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

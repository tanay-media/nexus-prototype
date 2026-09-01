// Widget logs — one row per widget_view_id (widget engagement instance).

(function () {
  "use strict";

  var KB_COLUMNS = [
    { key: "widget_id", label: "widget_id" },
    { key: "lander_name", label: "lander_name" },
    { key: "variant_name", label: "variant_name" },
    { key: "widget_view_id", label: "widget_view_id" },
    { key: "widget_impression_id", label: "widget_impression_id" },
    { key: "widget_click_id", label: "widget_click_id" },
    { key: "widget_view_time", label: "widget_view_time" },
    { key: "widget_impression_time", label: "widget_impression_time" },
    { key: "widget_click_time", label: "widget_click_time" },
    { key: "ad_id", label: "ad_id" },
    { key: "ad_title", label: "ad_title" },
    { key: "ad_tracking_url", label: "ad_tracking_url" },
    { key: "ad_description", label: "ad_description" },
    { key: "ad_display_url", label: "ad_display_url" },
    { key: "ad_cta_label", label: "ad_cta_label" },
    { key: "ad_view_id", label: "ad_view_id" },
    { key: "ad_impression_id", label: "ad_impression_id" },
    { key: "ad_click_id", label: "ad_click_id" },
    { key: "ad_view_time", label: "ad_view_time" },
    { key: "ad_impression_time", label: "ad_impression_time" },
    { key: "ad_click_time", label: "ad_click_time" }
  ];

  var FORM_COLUMNS = [
    { key: "widget_view_id", label: "widget_view_id" },
    { key: "visit_id", label: "visit_id" },
    { key: "widget_name", label: "Widget" },
    { key: "widget_type", label: "Type" },
    { key: "lander_name", label: "Lander" },
    { key: "variant_name", label: "Variant" },
    { key: "started_at", label: "Started" },
    { key: "last_event", label: "Last event" },
    { key: "outcome", label: "Outcome" },
    { key: "event_count", label: "Events" }
  ];

  var ENGAGEMENTS = [
    {
      widget_view_id: "wv_8f2a1b3c",
      visit_id: "v_a10ec9aa",
      widget_id: "w_form_lead_short",
      widget_name: "Lead — short qualify",
      widget_type: "form",
      lander_name: "Summer Sale",
      variant_name: "var_ss_03",
      domain: "offers.acme.com",
      started_at: "2026-04-21 09:41:02",
      last_at: "2026-04-21 09:41:35",
      outcome: "submitted",
      events: [
        { ts: "2026-04-21 09:41:02", event: "form_start", trigger: "visible" },
        { ts: "2026-04-21 09:41:14", event: "form_step_complete", step_id: "step_zip", step_index: 0, label: "Zip code" },
        { ts: "2026-04-21 09:41:28", event: "form_step_complete", step_id: "step_age", step_index: 1, label: "Age range" },
        { ts: "2026-04-21 09:41:35", event: "form_submit", steps_completed: 2, total_time_ms: 33000 }
      ]
    },
    {
      widget_view_id: "wv_3c1d9e0f",
      visit_id: "v_a10ec9aa",
      widget_id: "7f3a8b2c-4d5e-6f70-8192-a3b4c5d6e7f8",
      widget_name: "Passive investing KB",
      widget_type: "keyword_block",
      lander_name: "Summer Sale",
      variant_name: "var_ss_03",
      domain: "offers.acme.com",
      outcome: "ad_click",
      widget_impression_id: "wimp_9a2f44b1",
      widget_click_id: "wclk_7d8e21c0",
      widget_view_time: "2026-04-21 09:42:11",
      widget_impression_time: "2026-04-21 09:42:11",
      widget_click_time: "2026-04-21 09:42:18",
      ad_id: "ad_88421",
      ad_title: "Earn 8% APY on High-Yield Savings",
      ad_tracking_url: "https://trk.pmsrv.co/v2/trk?adid=88421&akey=a3b4c5d6&rurl=https%3A%2F%2Fmax.example%2Fpassive",
      ad_description: "Compare top passive income accounts. No minimum balance.",
      ad_display_url: "save.example.com",
      ad_cta_label: "Compare rates",
      ad_view_id: "adv_55102aa3",
      ad_impression_id: "aimp_33109ef2",
      ad_click_id: "clk_9f2a88b1",
      ad_view_time: "2026-04-21 09:42:18",
      ad_impression_time: "2026-04-21 09:42:18",
      ad_click_time: "2026-04-21 09:42:22",
      events: [
        { ts: "2026-04-21 09:42:11", event: "keyword_blocks_view" },
        { ts: "2026-04-21 09:42:18", event: "keyword_block_click", keyword_term: "passive investing", keyword_slot_id: 2, display_term: "How much can I earn?" },
        { ts: "2026-04-21 09:42:18", event: "keyword_ad_impression", ad_title: "Earn 8% APY on High-Yield Savings", ad_id: "ad_88421", fetch_status: "ok" },
        { ts: "2026-04-21 09:42:22", event: "keyword_ad_click", click_id: "clk_9f2a88b1", campaign_id: "cmp_44102" }
      ]
    },
    {
      widget_view_id: "wv_71b4c2e8",
      visit_id: "v_739da489",
      widget_id: "w_form_quote",
      widget_name: "Quote request",
      widget_type: "form",
      lander_name: "Summer Sale",
      variant_name: "var_ss_03",
      domain: "offers.acme.com",
      started_at: "2026-04-21 08:12:04",
      last_at: "2026-04-21 08:12:41",
      outcome: "abandoned",
      events: [
        { ts: "2026-04-21 08:12:04", event: "form_start", trigger: "interaction" },
        { ts: "2026-04-21 08:12:19", event: "form_step_complete", step_id: "step_contact", step_index: 0, label: "Contact info" },
        { ts: "2026-04-21 08:12:41", event: "form_abandon", last_step_id: "step_coverage", last_step_index: 1 }
      ]
    },
    {
      widget_view_id: "wv_a902f11d",
      visit_id: "v_1f105248",
      widget_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      widget_name: "Medicare savings KB",
      widget_type: "keyword_block",
      lander_name: "Black Friday",
      variant_name: "var_bf_02",
      domain: "offers.acme.com",
      outcome: "in_progress",
      widget_impression_id: "wimp_4c18d902",
      widget_click_id: "wclk_b9021a77",
      widget_view_time: "2026-04-21 09:38:12",
      widget_impression_time: "2026-04-21 09:38:12",
      widget_click_time: "2026-04-21 09:38:28",
      ad_id: "",
      ad_title: "",
      ad_tracking_url: "",
      ad_description: "",
      ad_display_url: "",
      ad_cta_label: "",
      ad_view_id: "",
      ad_impression_id: "",
      ad_click_id: "",
      ad_view_time: "",
      ad_impression_time: "",
      ad_click_time: "",
      events: [
        { ts: "2026-04-21 09:38:12", event: "keyword_blocks_view" },
        { ts: "2026-04-21 09:38:28", event: "keyword_block_click", keyword_term: "medicare advantage", keyword_slot_id: 1, display_term: "Am I eligible for extra benefits?" }
      ]
    },
    {
      widget_view_id: "wv_e44d0a56",
      visit_id: "v_0dd9f781",
      widget_id: "w_form_long",
      widget_name: "Long qualify — 5 step",
      widget_type: "form",
      lander_name: "Walk-in Tubs",
      variant_name: "var_wt_01",
      domain: "house.bestlivingideas.com",
      started_at: "2026-04-21 08:21:10",
      last_at: "2026-04-21 08:23:02",
      outcome: "submitted",
      events: [
        { ts: "2026-04-21 08:21:10", event: "form_start", trigger: "visible" },
        { ts: "2026-04-21 08:21:22", event: "form_step_complete", step_id: "step_intro", step_index: 0, label: "Intro" },
        { ts: "2026-04-21 08:21:38", event: "form_step_complete", step_id: "step_household", step_index: 1, label: "Household" },
        { ts: "2026-04-21 08:22:01", event: "form_step_complete", step_id: "step_income", step_index: 2, label: "Income" },
        { ts: "2026-04-21 08:22:34", event: "form_step_complete", step_id: "step_health", step_index: 3, label: "Health history" },
        { ts: "2026-04-21 08:22:58", event: "form_step_complete", step_id: "step_confirm", step_index: 4, label: "Confirm" },
        { ts: "2026-04-21 08:23:02", event: "form_submit", steps_completed: 5, total_time_ms: 112000 }
      ]
    },
    {
      widget_view_id: "wv_f19c2b80",
      visit_id: "v_739da489",
      widget_id: "c9d8e7f6-a5b4-3210-fedc-ba9876543210",
      widget_name: "Auto insurance KB",
      widget_type: "keyword_block",
      lander_name: "Summer Sale",
      variant_name: "var_ss_03",
      domain: "offers.acme.com",
      outcome: "ad_click",
      widget_impression_id: "wimp_22ae9011",
      widget_click_id: "wclk_88bc4412",
      widget_view_time: "2026-04-21 08:11:02",
      widget_impression_time: "2026-04-21 08:11:02",
      widget_click_time: "2026-04-21 08:11:19",
      ad_id: "ad_55210",
      ad_title: "Save up to $500/yr on auto insurance",
      ad_tracking_url: "https://trk.pmsrv.co/v2/trk?adid=55210&akey=f6e5d4c3&rurl=https%3A%2F%2Fmax.example%2Fauto",
      ad_description: "Get a free quote in 2 minutes. Licensed agents available.",
      ad_display_url: "quote.autosave.com",
      ad_cta_label: "Get quote",
      ad_view_id: "adv_88201cd4",
      ad_impression_id: "aimp_11902ab8",
      ad_click_id: "clk_44aa9012",
      ad_view_time: "2026-04-21 08:11:19",
      ad_impression_time: "2026-04-21 08:11:19",
      ad_click_time: "2026-04-21 08:11:24",
      events: [
        { ts: "2026-04-21 08:11:02", event: "keyword_blocks_view" },
        { ts: "2026-04-21 08:11:19", event: "keyword_block_click", keyword_term: "auto insurance", keyword_slot_id: 3, display_term: "How much can I save?" },
        { ts: "2026-04-21 08:11:19", event: "keyword_ad_impression", ad_title: "Save up to $500/yr on auto insurance", ad_id: "ad_55210", fetch_status: "ok" },
        { ts: "2026-04-21 08:11:24", event: "keyword_ad_click", click_id: "clk_44aa9012", campaign_id: "cmp_88201" }
      ]
    }
  ];

  var OUTCOME_LABELS = {
    submitted: "Submitted",
    abandoned: "Abandoned",
    ad_click: "Ad click",
    in_progress: "In progress"
  };

  var TYPE_LABELS = {
    form: "Form",
    keyword_block: "Keyword block"
  };

  var state = { typeFilter: "" };

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function dash(val) {
    return val ? escapeHtml(val) : '<span class="wl-dash">—</span>';
  }

  function isKbMode() {
    return state.typeFilter === "keyword_block";
  }

  function cellValue(eng, col) {
    if (col.key === "visit_id" && eng.visit_id) {
      return '<a class="mono" href="logs.html?tab=lander&visit_id=' + encodeURIComponent(eng.visit_id) + '">' + escapeHtml(eng.visit_id) + "</a>";
    }
    if (col.key === "widget_type") {
      return '<span class="wl-type wl-type--' + escapeHtml(eng.widget_type) + '">' + escapeHtml(TYPE_LABELS[eng.widget_type] || eng.widget_type) + "</span>";
    }
    if (col.key === "outcome") {
      return '<span class="wl-outcome wl-outcome--' + escapeHtml(eng.outcome) + '">' + escapeHtml(OUTCOME_LABELS[eng.outcome] || eng.outcome) + "</span>";
    }
    if (col.key === "widget_name") return "<strong>" + escapeHtml(eng.widget_name) + "</strong>";
    if (col.key === "last_event") return '<span class="muted">' + escapeHtml(eng.events[eng.events.length - 1].event) + "</span>";
    if (col.key === "event_count") return String(eng.events.length);
    if (col.key === "ad_tracking_url" && eng.ad_tracking_url) {
      return '<span class="wl-url mono" title="' + escapeHtml(eng.ad_tracking_url) + '">' + escapeHtml(eng.ad_tracking_url.slice(0, 42)) + "…</span>";
    }
    var val = eng[col.key];
    if (col.key === "widget_view_id" || col.key === "widget_id" || col.key.indexOf("_id") !== -1) {
      return val ? '<span class="mono">' + escapeHtml(val) + "</span>" : dash("");
    }
    if (col.key.indexOf("_time") !== -1 || col.key === "started_at") {
      return val ? '<span class="muted mono">' + escapeHtml(val) + "</span>" : dash("");
    }
    return dash(val);
  }

  function eventLabel(ev) {
    if (ev.event === "form_step_complete" && ev.label) return "form_step_complete · " + ev.label;
    if (ev.event === "keyword_block_click" && ev.display_term) return "keyword_block_click · " + ev.display_term;
    return ev.event;
  }

  function eventMeta(ev) {
    var parts = [];
    if (ev.step_id) parts.push("step_id=" + ev.step_id);
    if (ev.keyword_term) parts.push("keyword_term=" + ev.keyword_term);
    if (ev.ad_title) parts.push("ad_title=" + ev.ad_title);
    if (ev.click_id) parts.push("click_id=" + ev.click_id);
    if (ev.trigger) parts.push("trigger=" + ev.trigger);
    return parts.join(" · ");
  }

  function renderTimeline(eng) {
    return '<div class="wl-timeline">' + eng.events.map(function (ev) {
      var meta = eventMeta(ev);
      return '<div class="wl-timeline__row">' +
        '<span class="wl-timeline__ts muted mono">' + escapeHtml(ev.ts) + "</span>" +
        '<span class="log-event log-event--' + escapeHtml(ev.event) + '">' + escapeHtml(eventLabel(ev)) + "</span>" +
        (meta ? '<span class="wl-timeline__meta muted mono">' + escapeHtml(meta) + "</span>" : "") +
        "</div>";
    }).join("") + "</div>";
  }

  function renderKbRow(eng) {
    var cells = KB_COLUMNS.map(function (col) {
      return "<td>" + cellValue(eng, col) + "</td>";
    }).join("");
    return '<tr class="wl-row wl-row--kb" data-wl-row data-widget-view-id="' + escapeHtml(eng.widget_view_id) + '" data-widget-type="keyword_block" data-widget-name="' + escapeHtml(eng.widget_name) + '" data-outcome="' + escapeHtml(eng.outcome) + '">' + cells + "</tr>";
  }

  function renderFormRow(eng) {
    var id = eng.widget_view_id;
    var cols = FORM_COLUMNS.map(function (col) {
      return "<td>" + cellValue(eng, col) + "</td>";
    }).join("");
    return '<tr class="log-data-row wl-row wl-row--form" data-wl-row data-widget-view-id="' + escapeHtml(id) + '" data-visit-id="' + escapeHtml(eng.visit_id) + '" data-widget-type="form" data-widget-name="' + escapeHtml(eng.widget_name) + '" data-outcome="' + escapeHtml(eng.outcome) + '" tabindex="0" role="button" aria-expanded="false">' +
      '<td class="log-chev-cell"><span class="log-chev" aria-hidden="true">▸</span></td>' + cols + "</tr>" +
      '<tr class="log-expand-row wl-expand-row" data-wl-detail="' + escapeHtml(id) + '" hidden><td colspan="' + (FORM_COLUMNS.length + 1) + '">' +
      '<div class="log-expand-inner"><div class="log-expand-label">Event timeline · ' + escapeHtml(id) + "</div>" +
      renderTimeline(eng) +
      '<div class="log-expand-foot muted">widget_id: ' + escapeHtml(eng.widget_id) + " · domain: " + escapeHtml(eng.domain) + "</div></div></td></tr>";
  }

  function renderThead(columns, withChevron) {
    var head = document.getElementById("widget-logs-thead");
    if (!head) return;
    var cells = (withChevron ? '<th class="log-th-chev" aria-hidden="true"></th>' : "") +
      columns.map(function (col) { return "<th>" + escapeHtml(col.label) + "</th>"; }).join("");
    head.innerHTML = "<tr>" + cells + "</tr>";
  }

  function filteredEngagements() {
    var q = (document.getElementById("widget-logs-search") || {}).value || "";
    q = q.trim().toLowerCase();
    var type = state.typeFilter;
    var widget = (document.getElementById("widget-logs-widget") || {}).value || "";
    var outcome = (document.getElementById("widget-logs-outcome") || {}).value || "";

    return ENGAGEMENTS.filter(function (eng) {
      if (type && eng.widget_type !== type) return false;
      if (widget && eng.widget_name !== widget) return false;
      if (outcome && eng.outcome !== outcome) return false;
      if (q) {
        var hay = [
          eng.widget_view_id,
          eng.visit_id,
          eng.widget_id,
          eng.widget_name,
          eng.lander_name,
          eng.variant_name,
          eng.ad_id,
          eng.ad_click_id
        ].join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderTable() {
    var tbody = document.getElementById("widget-logs-tbody");
    var table = document.getElementById("widget-logs-table");
    var hint = document.getElementById("widget-logs-hint");
    var disclaimer = document.getElementById("widget-logs-disclaimer");
    if (!tbody || !table) return;

    var rows = filteredEngagements();
    var kb = isKbMode();

    table.classList.toggle("table--widget-logs-kb", kb);
    if (hint) {
      hint.innerHTML = kb
        ? 'Keyword block widget log columns · primary key: <code>widget_view_id</code>'
        : 'Widget engagement instances · primary key: <code>widget_view_id</code> · expand a form row for the event timeline';
    }
    if (disclaimer) {
      disclaimer.textContent = kb
        ? "Each row is one keyword block engagement with widget and ad attribution fields stitched from the event timeline."
        : "Each row is one widget engagement on a visit. Timeline events share the same widget_view_id.";
    }

    if (kb) {
      renderThead(KB_COLUMNS, false);
      tbody.innerHTML = rows.filter(function (e) { return e.widget_type === "keyword_block"; }).map(renderKbRow).join("");
    } else {
      renderThead(FORM_COLUMNS, true);
      tbody.innerHTML = rows.map(function (eng) {
        return eng.widget_type === "form" ? renderFormRow(eng) : renderSummaryKbRow(eng);
      }).join("");
      wireExpand(tbody);
    }

    var rangeEl = document.getElementById("widget-logs-footer-range");
    var total = kb
      ? ENGAGEMENTS.filter(function (e) { return e.widget_type === "keyword_block"; }).length
      : ENGAGEMENTS.length;
    if (rangeEl) rangeEl.innerHTML = "<strong>Showing " + rows.length + " of " + total + " widget engagements</strong>";
  }

  function renderSummaryKbRow(eng) {
    var id = eng.widget_view_id;
    return '<tr class="log-data-row wl-row wl-row--kb-summary" data-wl-row data-widget-view-id="' + escapeHtml(id) + '" data-visit-id="' + escapeHtml(eng.visit_id) + '" data-widget-type="keyword_block" data-widget-name="' + escapeHtml(eng.widget_name) + '" data-outcome="' + escapeHtml(eng.outcome) + '" tabindex="0" role="button" aria-expanded="false">' +
      '<td class="log-chev-cell"><span class="log-chev" aria-hidden="true">▸</span></td>' +
      '<td class="mono"><strong>' + escapeHtml(id) + "</strong></td>" +
      '<td class="mono"><a href="logs.html?tab=lander&visit_id=' + encodeURIComponent(eng.visit_id) + '">' + escapeHtml(eng.visit_id) + "</a></td>" +
      "<td><strong>" + escapeHtml(eng.widget_name) + "</strong></td>" +
      '<td><span class="wl-type wl-type--keyword_block">Keyword block</span></td>' +
      "<td>" + escapeHtml(eng.lander_name) + "</td>" +
      '<td><span class="log-variant-pill mono">' + escapeHtml(eng.variant_name) + "</span></td>" +
      '<td class="muted mono">' + dash(eng.widget_view_time) + "</td>" +
      '<td class="muted">' + escapeHtml(eng.events[eng.events.length - 1].event) + "</td>" +
      '<td><span class="wl-outcome wl-outcome--' + escapeHtml(eng.outcome) + '">' + escapeHtml(OUTCOME_LABELS[eng.outcome] || eng.outcome) + "</span></td>" +
      "<td>" + eng.events.length + "</td>" +
      "</tr>" +
      '<tr class="log-expand-row wl-expand-row" data-wl-detail="' + escapeHtml(id) + '" hidden><td colspan="11">' +
      '<div class="log-expand-inner"><div class="log-expand-label">Event timeline · ' + escapeHtml(id) + "</div>" +
      renderTimeline(eng) +
      '<div class="log-expand-foot muted">widget_id: ' + escapeHtml(eng.widget_id) + "</div></div></td></tr>";
  }

  function wireExpand(root) {
    root.querySelectorAll(".wl-row--form, .wl-row--kb-summary").forEach(function (row) {
      function toggle() {
        var id = row.getAttribute("data-widget-view-id");
        var detail = root.querySelector('[data-wl-detail="' + id + '"]');
        var open = row.getAttribute("aria-expanded") === "true";
        row.setAttribute("aria-expanded", open ? "false" : "true");
        row.classList.toggle("is-expanded", !open);
        if (detail) detail.hidden = open;
      }
      row.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        toggle();
      });
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });
  }

  function populateWidgetFilter(selectEl) {
    if (!selectEl) return;
    while (selectEl.options.length > 1) selectEl.remove(1);
    var seen = {};
    var type = state.typeFilter;
    ENGAGEMENTS.forEach(function (e) {
      if (type && e.widget_type !== type) return;
      if (!seen[e.widget_name]) {
        seen[e.widget_name] = 1;
        var opt = document.createElement("option");
        opt.value = e.widget_name;
        opt.textContent = e.widget_name;
        selectEl.appendChild(opt);
      }
    });
  }

  function onFilterChange() {
    var typeEl = document.getElementById("widget-logs-type");
    state.typeFilter = typeEl ? typeEl.value : "";
    populateWidgetFilter(document.getElementById("widget-logs-widget"));
    renderTable();
  }

  function init() {
    var tbody = document.getElementById("widget-logs-tbody");
    if (!tbody) return;

    var typeEl = document.getElementById("widget-logs-type");
    if (typeEl) state.typeFilter = typeEl.value;

    ["widget-logs-search", "widget-logs-type", "widget-logs-widget", "widget-logs-outcome"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", onFilterChange);
    });

    populateWidgetFilter(document.getElementById("widget-logs-widget"));

    var params = new URLSearchParams(window.location.search);
    var wv = params.get("widget_view_id");
    var visit = params.get("visit_id");
    if (wv || visit) {
      var search = document.getElementById("widget-logs-search");
      if (search) search.value = wv || visit;
    }

    renderTable();

    if (wv && !isKbMode()) {
      var row = tbody.querySelector('[data-widget-view-id="' + wv + '"]');
      if (row && row.getAttribute("aria-expanded") != null) {
        row.setAttribute("aria-expanded", "true");
        row.classList.add("is-expanded");
        var detail = tbody.querySelector('[data-wl-detail="' + wv + '"]');
        if (detail) detail.hidden = false;
        row.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }

    window.NEXUS_WIDGET_LOGS = { engagements: ENGAGEMENTS, kbColumns: KB_COLUMNS };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

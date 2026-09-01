// Widget logs — one row per widget_view_id (widget engagement instance).

(function () {
  "use strict";

  var ENGAGEMENTS = [
    {
      widget_view_id: "wv_8f2a1b3c",
      visit_id: "v_a10ec9aa",
      widget_id: "w_form_lead_short",
      widget_name: "Lead — short qualify",
      widget_type: "form",
      lander: "Summer Sale",
      variant: "var_ss_03",
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
      widget_id: "w_kb_passive",
      widget_name: "Passive investing KB",
      widget_type: "keyword_block",
      lander: "Summer Sale",
      variant: "var_ss_03",
      domain: "offers.acme.com",
      started_at: "2026-04-21 09:42:11",
      last_at: "2026-04-21 09:42:22",
      outcome: "ad_click",
      events: [
        { ts: "2026-04-21 09:42:11", event: "keyword_blocks_view" },
        { ts: "2026-04-21 09:42:18", event: "keyword_block_click", keyword_term: "passive investing", keyword_slot_id: 2, display_term: "How much can I earn?" },
        { ts: "2026-04-21 09:42:18", event: "keyword_ad_impression", ad_title: "Earn 8% APY on savings", ad_id: "ad_88421", fetch_status: "ok" },
        { ts: "2026-04-21 09:42:22", event: "keyword_ad_click", click_id: "clk_9f2a88", campaign_id: "cmp_44102" }
      ]
    },
    {
      widget_view_id: "wv_71b4c2e8",
      visit_id: "v_739da489",
      widget_id: "w_form_quote",
      widget_name: "Quote request",
      widget_type: "form",
      lander: "Summer Sale",
      variant: "var_ss_03",
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
      widget_id: "w_kb_medicare",
      widget_name: "Medicare savings KB",
      widget_type: "keyword_block",
      lander: "Black Friday",
      variant: "var_bf_02",
      domain: "offers.acme.com",
      started_at: "2026-04-21 09:38:12",
      last_at: "2026-04-21 09:38:28",
      outcome: "in_progress",
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
      lander: "Walk-in Tubs",
      variant: "var_wt_01",
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

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

  function renderRow(eng) {
    var id = eng.widget_view_id;
    return '<tr class="log-data-row wl-row" data-wl-row data-widget-view-id="' + escapeHtml(id) + '" data-visit-id="' + escapeHtml(eng.visit_id) + '" data-widget-type="' + escapeHtml(eng.widget_type) + '" data-widget-name="' + escapeHtml(eng.widget_name) + '" data-outcome="' + escapeHtml(eng.outcome) + '" tabindex="0" role="button" aria-expanded="false">' +
      '<td class="log-chev-cell"><span class="log-chev" aria-hidden="true">▸</span></td>' +
      '<td class="mono"><strong>' + escapeHtml(id) + "</strong></td>" +
      '<td class="mono"><a href="logs.html?tab=lander&visit_id=' + encodeURIComponent(eng.visit_id) + '">' + escapeHtml(eng.visit_id) + "</a></td>" +
      "<td><strong>" + escapeHtml(eng.widget_name) + "</strong></td>" +
      '<td><span class="wl-type wl-type--' + escapeHtml(eng.widget_type) + '">' + escapeHtml(TYPE_LABELS[eng.widget_type] || eng.widget_type) + "</span></td>" +
      "<td>" + escapeHtml(eng.lander) + "</td>" +
      '<td><span class="log-variant-pill mono">' + escapeHtml(eng.variant) + "</span></td>" +
      '<td class="muted">' + escapeHtml(eng.started_at) + "</td>" +
      '<td class="muted">' + escapeHtml(eng.events[eng.events.length - 1].event) + "</td>" +
      '<td><span class="wl-outcome wl-outcome--' + escapeHtml(eng.outcome) + '">' + escapeHtml(OUTCOME_LABELS[eng.outcome] || eng.outcome) + "</span></td>" +
      "<td>" + eng.events.length + "</td>" +
      "</tr>" +
      '<tr class="log-expand-row wl-expand-row" data-wl-detail="' + escapeHtml(id) + '" hidden><td colspan="11">' +
      '<div class="log-expand-inner"><div class="log-expand-label">Event timeline · ' + escapeHtml(id) + "</div>" +
      renderTimeline(eng) +
      '<div class="log-expand-foot muted">widget_id: ' + escapeHtml(eng.widget_id) + " · domain: " + escapeHtml(eng.domain) + "</div></div></td></tr>";
  }

  function wireExpand(root) {
    root.querySelectorAll("[data-wl-row]").forEach(function (row) {
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
    var seen = {};
    ENGAGEMENTS.forEach(function (e) {
      if (!seen[e.widget_name]) {
        seen[e.widget_name] = 1;
        var opt = document.createElement("option");
        opt.value = e.widget_name;
        opt.textContent = e.widget_name;
        selectEl.appendChild(opt);
      }
    });
  }

  function applyFilters() {
    var tbody = document.getElementById("widget-logs-tbody");
    var rangeEl = document.getElementById("widget-logs-footer-range");
    if (!tbody) return;

    var q = (document.getElementById("widget-logs-search") || {}).value || "";
    q = q.trim().toLowerCase();
    var type = (document.getElementById("widget-logs-type") || {}).value || "";
    var widget = (document.getElementById("widget-logs-widget") || {}).value || "";
    var outcome = (document.getElementById("widget-logs-outcome") || {}).value || "";

    var visible = 0;
    tbody.querySelectorAll("[data-wl-row]").forEach(function (row) {
      var keep = true;
      if (type && row.getAttribute("data-widget-type") !== type) keep = false;
      if (widget && row.getAttribute("data-widget-name") !== widget) keep = false;
      if (outcome && row.getAttribute("data-outcome") !== outcome) keep = false;
      if (q) {
        var hay = (row.getAttribute("data-widget-view-id") + " " + row.getAttribute("data-visit-id")).toLowerCase();
        if (hay.indexOf(q) === -1) keep = false;
      }
      row.hidden = !keep;
      var detail = tbody.querySelector('[data-wl-detail="' + row.getAttribute("data-widget-view-id") + '"]');
      if (detail) detail.hidden = !keep || row.getAttribute("aria-expanded") !== "true";
      if (keep) visible++;
    });

    if (rangeEl) rangeEl.innerHTML = "<strong>Showing " + visible + " of " + ENGAGEMENTS.length + " widget engagements</strong>";
  }

  function init() {
    var tbody = document.getElementById("widget-logs-tbody");
    if (!tbody) return;

    tbody.innerHTML = ENGAGEMENTS.map(renderRow).join("");
    wireExpand(tbody);
    populateWidgetFilter(document.getElementById("widget-logs-widget"));

    ["widget-logs-search", "widget-logs-type", "widget-logs-widget", "widget-logs-outcome"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", applyFilters);
    });

    var params = new URLSearchParams(window.location.search);
    var wv = params.get("widget_view_id");
    var visit = params.get("visit_id");
    if (wv || visit) {
      var search = document.getElementById("widget-logs-search");
      if (search) search.value = wv || visit;
    }
    applyFilters();

    if (wv) {
      var row = tbody.querySelector('[data-widget-view-id="' + wv + '"]');
      if (row) {
        row.setAttribute("aria-expanded", "true");
        row.classList.add("is-expanded");
        var detail = tbody.querySelector('[data-wl-detail="' + wv + '"]');
        if (detail) detail.hidden = false;
        row.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }

    window.NEXUS_WIDGET_LOGS = { engagements: ENGAGEMENTS };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

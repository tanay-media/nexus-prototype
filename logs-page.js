// Logs page — lander sub-view toggle + URL tab/deep-link handling.

(function () {
  "use strict";

  function activateLanderView(key) {
    var conv = document.getElementById("lander-view-conversions");
    var events = document.getElementById("lander-view-events");
    document.querySelectorAll("[data-lander-view]").forEach(function (btn) {
      var on = btn.getAttribute("data-lander-view") === key;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (conv) conv.hidden = key !== "conversions";
    if (events) events.hidden = key !== "events";
  }

  function activateMainTab(key) {
    var group = document.querySelector('[data-tabs="logs-page"]');
    if (!group) return;
    var buttons = group.querySelectorAll(":scope > .tabs .tab");
    var panels = group.querySelectorAll(":scope > [data-tab-panel]");
    buttons.forEach(function (btn) {
      var on = btn.getAttribute("data-tab") === key;
      btn.classList.toggle("is-active", on);
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-tab-panel") !== key;
    });
  }

  function initLanderSeg() {
    document.querySelectorAll("[data-lander-view]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activateLanderView(btn.getAttribute("data-lander-view"));
      });
    });
  }

  function applyUrlState() {
    var params = new URLSearchParams(window.location.search);
    var tab = params.get("tab");
    if (tab === "widget" || tab === "lander") {
      activateMainTab(tab);
    }
    if (params.get("visit_id") && tab !== "widget") {
      activateLanderView("events");
      var search = document.getElementById("logs-url-filter");
      if (search) {
        search.value = params.get("visit_id");
        search.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initLanderSeg();
      applyUrlState();
    });
  } else {
    initLanderSeg();
    applyUrlState();
  }
})();

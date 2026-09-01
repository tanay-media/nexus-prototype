// Logs page — URL tab/deep-link handling.

(function () {
  "use strict";

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

  function applyUrlState() {
    var params = new URLSearchParams(window.location.search);
    var tab = params.get("tab");
    if (tab === "widget" || tab === "lander") {
      activateMainTab(tab);
    }
    var visitId = params.get("visit_id");
    if (visitId && tab !== "widget") {
      var visitFilter = document.querySelector('.flat-cf[data-col="visit_id"]');
      if (visitFilter) {
        visitFilter.value = visitId;
        visitFilter.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyUrlState);
  } else {
    applyUrlState();
  }
})();

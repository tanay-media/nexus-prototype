// Shared lander thumbnails — maps each lander to one of 5 real screenshots.
// Used on Landers, Domains, Home, and (via logs-flat.js) Logs.
(function () {
  var IMAGES = [
    "img/lander-1.png",
    "img/lander-2.png",
    "img/lander-3.png",
    "img/lander-4.png",
    "img/lander-5.png"
  ];
  window.NEXUS_LANDER_IMAGES = IMAGES;

  function pick(name) {
    var s = String(name || "");
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return IMAGES[h % IMAGES.length];
  }
  window.nexusLanderImage = pick;

  function fill(el) {
    if (el.getAttribute("data-thumb-done")) return;
    var name = el.getAttribute("data-thumb-name");
    if (!name) {
      var cell = el.closest(".lander-cell") || el.parentElement;
      var nameEl = cell && cell.querySelector(".lander-name strong, strong");
      name = nameEl ? nameEl.textContent.trim() : "";
    }
    el.style.backgroundImage = "url('" + pick(name) + "')";
    el.setAttribute("data-thumb-done", "1");
  }
  function scan(root) {
    (root || document).querySelectorAll(".lander-thumb").forEach(fill);
  }

  function init() {
    scan(document);
    var mo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.classList && n.classList.contains("lander-thumb")) fill(n);
          if (n.querySelectorAll) scan(n);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

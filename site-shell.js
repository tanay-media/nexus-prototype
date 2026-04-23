/* Shared site shell (header / footer / CMP): side drawer, preview + chat, localStorage sync for editor + Domains. */
(function (w) {
  "use strict";

  var STORAGE = "nexus-site-shell::";

  var DEFAULT_HEADER =
    '<header class="site-header">\n' +
    '  <a class="logo" href="/">\n' +
    '    <img src="img/nexus-wordmark.png" alt="nexus" width="96" height="24" />\n' +
    "  </a>\n" +
    '  <nav aria-label="Primary">\n' +
    '    <a href="/offers">Offers</a>\n' +
    '    <a href="/help">Help</a>\n' +
    "  </nav>\n" +
    "</header>";

  function migrateForbesToNexus(raw) {
    if (!raw || typeof raw !== "object") return raw;
    ["header", "footer", "cmp"].forEach(function (key) {
      var v = raw[key];
      if (typeof v !== "string") return;
      if (v.indexOf("forbes-logo.svg") === -1 && v.toLowerCase().indexOf("forbes") === -1) return;
      raw[key] = v
        .replace(/img\/forbes-logo\.svg/g, "img/nexus-wordmark.png")
        .replace(/alt="Forbes"/g, 'alt="nexus"')
        .replace(/alt='Forbes'/g, "alt='nexus'")
        .replace(/aria-label="Forbes"/g, 'aria-label="nexus"')
        .replace(/title="Forbes"/g, 'title="nexus"');
    });
    return raw;
  }

  var DEFAULT_FOOTER =
    '<footer class="site-footer">\n' +
    '  <p>© 2026 ACME Inc. · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>\n' +
    "</footer>";

  var DEFAULT_CMP =
    '<div id="cmp-banner" role="region" aria-label="Cookie consent">\n' +
    '  <p>We use cookies to improve your experience. <a href="/cookies">Learn more</a>.</p>\n' +
    '  <div class="cmp-actions">\n' +
    '    <button type="button" data-cmp="reject">Reject all</button>\n' +
    '    <button type="button" data-cmp="accept">Accept all</button>\n' +
    "  </div>\n" +
    "</div>";

  function stripScripts(html) {
    return String(html || "").replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }

  function loadRaw(domain) {
    try {
      var j = localStorage.getItem(STORAGE + domain);
      if (!j) return null;
      var parsed = JSON.parse(j);
      var before = JSON.stringify(parsed);
      parsed = migrateForbesToNexus(parsed);
      if (JSON.stringify(parsed) !== before) {
        try { localStorage.setItem(STORAGE + domain, JSON.stringify(parsed)); } catch (e2) {}
      }
      return parsed;
    } catch (e) {}
    return null;
  }

  function merge(domain) {
    var o = loadRaw(domain) || {};
    return {
      header: o.header != null ? o.header : DEFAULT_HEADER,
      footer: o.footer != null ? o.footer : DEFAULT_FOOTER,
      cmp: o.cmp != null ? o.cmp : DEFAULT_CMP
    };
  }

  function save(domain, data) {
    localStorage.setItem(STORAGE + domain, JSON.stringify(data));
    w.dispatchEvent(new CustomEvent("nexus-shell-saved", { detail: { domain: domain } }));
  }

  var drawer;
  var currentDomain = "offers.acme.com";
  var activePart = "header";

  function previewDoc(fragment) {
    var css =
      "body{margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;background:#faf8f4;color:#2a261f;}" +
      ".site-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #e4ddd0;background:#fff;}" +
      ".site-header .logo img{display:block;height:22px;width:auto;}" +
      ".site-header nav{display:flex;gap:1rem;font-size:13px;}" +
      ".site-header a{color:#3d5a9a;text-decoration:none;font-weight:500;}" +
      ".site-footer{padding:12px 14px;background:#f3efe6;border-top:1px solid #e4ddd0;font-size:12px;color:#5c4a2e;}" +
      ".site-footer a{color:#3d5a9a;}" +
      "#cmp-banner{padding:10px 12px;background:#2a261f;color:#f5f0e7;font-size:12px;}" +
      "#cmp-banner a{color:#c9d4ff;}" +
      ".cmp-actions{display:flex;gap:8px;margin-top:8px;}" +
      ".cmp-actions button{padding:6px 10px;border-radius:6px;border:1px solid #666;background:#444;color:#fff;font-size:11px;cursor:default;}";
    return (
      "<!DOCTYPE html><html><head><meta charset='utf-8'><style>" +
      css +
      "</style></head><body>" +
      stripScripts(fragment) +
      "</body></html>"
    );
  }

  function refreshPreview() {
    var iframe = document.getElementById("nss-preview");
    if (!iframe) return;
    var taH = document.getElementById("nss-header");
    var taF = document.getElementById("nss-footer");
    var taC = document.getElementById("nss-cmp");
    var html = "";
    if (activePart === "header" && taH) html = taH.value;
    else if (activePart === "footer" && taF) html = taF.value;
    else if (activePart === "cmp" && taC) html = taC.value;
    iframe.srcdoc = previewDoc(html);
  }

  function setActiveTab(part) {
    activePart = part;
    var root = document.getElementById("nexus-site-shell-drawer");
    if (!root) return;
    root.querySelectorAll(".nss-chrome-tabs .chrome-tab").forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-chrome-tab") === part);
    });
    var lab = document.getElementById("nss-preview-label");
    if (lab) {
      var name = part === "header" ? "Header" : part === "footer" ? "Footer" : "CMP (consent)";
      lab.textContent = "Live preview · " + name;
    }
    refreshPreview();
  }

  function appendChat(text, who) {
    var log = document.getElementById("nss-chat-log");
    if (!log) return;
    var b = document.createElement("div");
    b.className = "chat-bubble" + (who === "user" ? " user" : "");
    b.textContent = text;
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
  }

  function wireAiMock() {
    var btn = document.getElementById("nss-ai-btn");
    var inp = document.getElementById("nss-ai-input");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    if (inp) {
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          btn.click();
        }
      });
    }
    btn.addEventListener("click", function () {
      var ta = document.getElementById(
        activePart === "header" ? "nss-header" : activePart === "footer" ? "nss-footer" : "nss-cmp"
      );
      if (!ta) return;
      var prompt = (inp && inp.value.trim()) || "make it cleaner";
      appendChat(prompt, "user");
      var stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      ta.value = ta.value.replace(/\n?<!-- nexus-ai:.*?-->\n?$/s, "");
      ta.value += "\n<!-- nexus-ai: \"" + prompt.replace(/-->/g, "--") + "\" applied at " + stamp + " (mocked) -->";
      if (inp) inp.value = "";
      setTimeout(function () {
        appendChat("Preview updated. Tweak the HTML in “HTML source” if you want finer control.", "ai");
        refreshPreview();
      }, 280);
    });
  }

  function ensureDrawer() {
    if (document.getElementById("nexus-site-shell-drawer")) {
      drawer = document.getElementById("nexus-site-shell-drawer");
      return;
    }

    var dlg = document.createElement("dialog");
    dlg.id = "nexus-site-shell-drawer";
    dlg.className = "nss-drawer";
    dlg.innerHTML =
      '<div class="nss-drawer__surface">' +
      '  <header class="site-shell-modal-top">' +
      '    <div class="site-shell-modal-top__left">' +
      '      <h2 class="site-shell-modal-top__title">Site shell</h2>' +
      '      <span class="site-shell-modal-top__domain mono" id="nss-domain-label" title="Domain"></span>' +
      "    </div>" +
      '    <button type="button" class="modal__close nss-close" aria-label="Close">✕</button>' +
      "  </header>" +
      '  <div class="editor-body site-shell-body">' +
      '    <aside class="editor-panel">' +
      '      <div class="editor-panel__head">Nexus AI</div>' +
      '      <div class="editor-chat" id="nss-chat-log"></div>' +
      '      <div class="editor-compose">' +
      '        <div class="suggestion-chips">' +
      '          <button type="button" data-nss-prompt="Make the header sticky on scroll with a light shadow">Sticky header</button>' +
      '          <button type="button" data-nss-prompt="Shrink the header logo slightly and tighten nav spacing">Tighter header</button>' +
      '          <button type="button" data-nss-prompt="Shorten the footer to one line with smaller link text">Tighter footer</button>' +
      '          <button type="button" data-nss-prompt="Make the CMP banner more compact with a smaller Accept button">CMP tweak</button>' +
      "        </div>" +
      '        <div class="compose-row">' +
      '          <input type="text" id="nss-ai-input" placeholder="Tell nexus what to change…" />' +
      '          <button type="button" class="compose-send" id="nss-ai-btn" aria-label="Send">' +
      '            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
      "          </button>" +
      "        </div>" +
      "      </div>" +
      '      <details class="nss-advanced">' +
      '        <summary>HTML source</summary>' +
      '        <div class="nss-ta-stack">' +
      '          <label class="nss-ta-label">Header</label><textarea id="nss-header" class="code-editor nss-ta" spellcheck="false" rows="8"></textarea>' +
      '          <label class="nss-ta-label">Footer</label><textarea id="nss-footer" class="code-editor nss-ta" spellcheck="false" rows="6"></textarea>' +
      '          <label class="nss-ta-label">CMP</label><textarea id="nss-cmp" class="code-editor nss-ta" spellcheck="false" rows="8"></textarea>' +
      "        </div>" +
      "      </details>" +
      '      <p class="nss-proto-note">Prototype — send appends a tagged HTML comment; production would call Opus and patch the source.</p>' +
      "    </aside>" +
      '    <main class="editor-canvas site-shell-canvas">' +
      '      <div class="site-shell-preview-head">' +
      '        <div class="chrome-tabs nss-chrome-tabs" role="tablist">' +
      '          <button type="button" class="chrome-tab is-active" data-chrome-tab="header" role="tab">Header</button>' +
      '          <button type="button" class="chrome-tab" data-chrome-tab="footer" role="tab">Footer</button>' +
      '          <button type="button" class="chrome-tab" data-chrome-tab="cmp" role="tab">CMP (consent)</button>' +
      "        </div>" +
      '        <p class="preview-label site-shell-preview-label" id="nss-preview-label">Live preview · Header</p>' +
      "      </div>" +
      '      <div class="mobile-frame mobile-frame--desktop site-shell-preview-frame">' +
      '        <iframe id="nss-preview" class="nss-preview-iframe" title="Shell preview" sandbox="allow-same-origin"></iframe>' +
      "      </div>" +
      "    </main>" +
      "  </div>" +
      '  <div class="modal__actions site-shell-footer">' +
      '    <button type="button" class="btn nss-close">Cancel</button>' +
      '    <button type="button" class="btn btn--black" id="nss-save-btn">Save site shell</button>' +
      "  </div>" +
      "</div>";

    document.body.appendChild(dlg);
    drawer = dlg;

    dlg.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-nss-prompt]");
      if (!chip) return;
      var inp = document.getElementById("nss-ai-input");
      if (inp) inp.value = chip.getAttribute("data-nss-prompt") || "";
      var send = document.getElementById("nss-ai-btn");
      if (send) send.click();
    });

    dlg.querySelectorAll(".nss-chrome-tabs .chrome-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        setActiveTab(tab.getAttribute("data-chrome-tab"));
      });
    });

    ["nss-header", "nss-footer", "nss-cmp"].forEach(function (id) {
      var ta = document.getElementById(id);
      if (ta)
        ta.addEventListener("input", function () {
          refreshPreview();
        });
    });

    document.getElementById("nss-save-btn").addEventListener("click", function () {
      var h = document.getElementById("nss-header");
      var f = document.getElementById("nss-footer");
      var c = document.getElementById("nss-cmp");
      save(currentDomain, {
        header: h ? h.value : DEFAULT_HEADER,
        footer: f ? f.value : DEFAULT_FOOTER,
        cmp: c ? c.value : DEFAULT_CMP
      });
      dlg.close();
    });

    dlg.querySelectorAll(".nss-close").forEach(function (b) {
      b.addEventListener("click", function () {
        dlg.close();
      });
    });

    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) dlg.close();
    });

    wireAiMock();
  }

  function openSiteShell(domain, part) {
    ensureDrawer();
    currentDomain = domain || "offers.acme.com";
    var m = merge(currentDomain);
    var label = document.getElementById("nss-domain-label");
    if (label) label.textContent = currentDomain;

    var taH = document.getElementById("nss-header");
    var taF = document.getElementById("nss-footer");
    var taC = document.getElementById("nss-cmp");
    if (taH) taH.value = m.header;
    if (taF) taF.value = m.footer;
    if (taC) taC.value = m.cmp;

    var log = document.getElementById("nss-chat-log");
    if (log) {
      log.innerHTML =
        '<div class="chat-note">Shared on this domain. Switches <strong>Header</strong>, <strong>Footer</strong>, or <strong>CMP</strong> above — then describe edits or open <strong>HTML source</strong>.</div>';
      appendChat("Pick a tab, then describe what to change — or expand HTML source.", "ai");
    }

    setActiveTab(part || "header");
    drawer.showModal();
  }

  function applyEditorInjections() {
    var host = document.querySelector("[data-editor-domain]");
    var domain = (host && host.getAttribute("data-editor-domain")) || "offers.acme.com";
    var m = merge(domain);
    var hEl = document.getElementById("editor-shell-header-view");
    var cEl = document.getElementById("editor-shell-cmp-view");
    var fEl = document.getElementById("editor-shell-footer-view");
    if (hEl) hEl.innerHTML = stripScripts(m.header);
    if (cEl) cEl.innerHTML = stripScripts(m.cmp);
    if (fEl) fEl.innerHTML = stripScripts(m.footer);
    if (typeof w.nexusAlignEditorChromeRail === "function") {
      requestAnimationFrame(function () {
        w.nexusAlignEditorChromeRail();
      });
    }
  }

  w.nexusOpenSiteShell = openSiteShell;
  w.nexusShellApplyEditorInjections = applyEditorInjections;
  w.nexusShellMerge = merge;

  function onReady() {
    document.body.addEventListener("click", function (e) {
      var shell = e.target.closest(".js-edit-shell");
      if (shell) {
        e.preventDefault();
        openSiteShell(shell.getAttribute("data-domain") || "offers.acme.com", "header");
        return;
      }
      var open = e.target.closest(".js-site-shell-open");
      if (open) {
        e.preventDefault();
        var d = document.querySelector("[data-editor-domain]");
        var dom = (d && d.getAttribute("data-editor-domain")) || "offers.acme.com";
        var tab = open.getAttribute("data-shell-tab") || "header";
        openSiteShell(dom, tab);
      }
    });

    w.addEventListener("nexus-shell-saved", function () {
      applyEditorInjections();
    });

    if (document.querySelector("[data-editor-domain]")) applyEditorInjections();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onReady);
  else onReady();
})(window);

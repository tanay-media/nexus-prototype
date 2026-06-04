// Settings · General (workspaces) + global Team/Workspace multi-select + MCP copy.
(function () {
  var TEAMS = [
    { id: "acme", name: "Acme Inc", workspaces: [
      { id: "7c2a9f10-4b3d-4e21-9a8c-1f5e8d220a31", name: "ACME Growth", active: true },
      { id: "b8e1d472-2c6a-49f3-8d10-7a93c4e1b520", name: "ACME Retail", active: false }
    ]},
    { id: "finedge", name: "FinanceEdge", workspaces: [
      { id: "3f9a0c61-8d24-4b7e-a512-6e0b9d83f140", name: "FinanceEdge", active: false },
      { id: "d50b7e93-1a4f-4c08-bb29-9c71e2a0d365", name: "Insights", active: false }
    ]}
  ];

  var list = document.getElementById("gen-ws-list");
  var addBtn = document.getElementById("gen-add-ws-top");
  var msBtn = document.getElementById("tw-ms-btn");
  var msPop = document.getElementById("tw-ms-pop");
  var msLabel = document.getElementById("tw-ms-label");
  var msWrap = document.getElementById("tw-ms");
  if (!list) return;

  var uid = 100;
  // selection: null = all; else array of workspace ids
  var selectedWs = null;

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function allWsIds() {
    var ids = [];
    TEAMS.forEach(function (t) { t.workspaces.forEach(function (w) { ids.push(w.id); }); });
    return ids;
  }
  function isSel(id) { return !selectedWs || selectedWs.indexOf(id) !== -1; }
  function fakeUuid(id) { return id; }

  // ---- General list (workspaces from selected teams) ----
  function render() {
    var html = "";
    TEAMS.forEach(function (t) {
      var shown = t.workspaces.filter(function (w) { return isSel(w.id); });
      if (!shown.length) return;
      html += '<tr class="gen-team-row"><td colspan="3">' +
        '<span class="gen-team-name">' + escapeHtml(t.name) + '</span>' +
        '<span class="gen-team-count">' + shown.length + (shown.length === 1 ? " workspace" : " workspaces") + '</span>' +
        '</td></tr>';
      shown.forEach(function (w) {
        html += '<tr class="gen-ws" data-ws="' + w.id + '">' +
          '<td><div class="gen-ws__name"><span class="gen-ws__name-text">' + escapeHtml(w.name) + '</span>' +
            (w.active ? '<span class="gen-ws__badge">Active</span>' : '') + '</div></td>' +
          '<td><span class="gen-ws__id">' + fakeUuid(w.id) + '</span></td>' +
          '<td class="right"><div class="gen-ws__actions">' +
            '<button type="button" class="icon-btn" data-act="rename" title="Rename" aria-label="Rename"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button>' +
            '<button type="button" class="icon-btn" data-act="delete" title="Delete" aria-label="Delete"' + (w.active ? ' disabled style="opacity:.4;cursor:not-allowed"' : '') + '><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg></button>' +
          '</div></td>' +
        '</tr>';
      });
    });
    if (!html) html = '<tr><td colspan="3" class="gen-empty">No workspaces in the selected teams.</td></tr>';
    list.innerHTML = html;
  }

  function findWs(id) {
    for (var i = 0; i < TEAMS.length; i++) {
      var w = TEAMS[i].workspaces.filter(function (x) { return x.id === id; })[0];
      if (w) return { team: TEAMS[i], ws: w };
    }
    return null;
  }
  function startRename(row, w) {
    var nameEl = row.querySelector(".gen-ws__name");
    nameEl.innerHTML = '<input type="text" value="' + escapeHtml(w.name) + '" />' + (w.active ? '<span class="gen-ws__badge">Active</span>' : '');
    var input = nameEl.querySelector("input");
    input.focus(); input.select();
    function commit(save) { if (save) { var v = input.value.trim(); if (v) w.name = v; } render(); renderPop(); updateLabel(); }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") commit(true); else if (e.key === "Escape") commit(false); });
    input.addEventListener("blur", function () { commit(true); });
  }

  list.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var row = btn.closest(".gen-ws");
    var found = findWs(row.getAttribute("data-ws"));
    if (!found) return;
    var act = btn.getAttribute("data-act");
    if (act === "rename") startRename(row, found.ws);
    else if (act === "switch") {
      TEAMS.forEach(function (t) { t.workspaces.forEach(function (x) { x.active = (x === found.ws); }); });
      render();
    } else if (act === "delete") {
      if (found.ws.active) return;
      if (window.confirm('Delete workspace "' + found.ws.name + '"? Landers and domains inside it will be archived.')) {
        found.team.workspaces = found.team.workspaces.filter(function (x) { return x !== found.ws; });
        if (selectedWs) selectedWs = selectedWs.filter(function (x) { return x !== found.ws.id; });
        render(); renderPop(); updateLabel();
      }
    }
  });

  if (addBtn) addBtn.addEventListener("click", function () {
    // add to first selected team (or first team)
    var target = TEAMS[0];
    if (selectedWs && selectedWs.length) { var f = findWs(selectedWs[0]); if (f) target = f.team; }
    var w = { id: "" + (Math.random().toString(16).slice(2, 10)) + "-0000-4000-8000-" + Date.now().toString(16).slice(-12), name: "New workspace", active: false };
    target.workspaces.push(w);
    if (selectedWs) selectedWs.push(w.id);
    render(); renderPop(); updateLabel();
    var rows = list.querySelectorAll('.gen-ws[data-ws="' + w.id + '"]');
    if (rows[0]) startRename(rows[0], w);
  });

  // ---- Top multi-select (teams + workspaces) ----
  function curSet() { return selectedWs ? selectedWs.slice() : allWsIds(); }
  function commitSet(arr) {
    selectedWs = (arr.length === allWsIds().length) ? null : arr;
    updateLabel(); renderPop(); render();
  }
  function updateLabel() {
    if (!msLabel) return;
    if (!selectedWs) { msLabel.textContent = "All teams & workspaces"; return; }
    if (!selectedWs.length) { msLabel.textContent = "No workspaces"; return; }
    if (selectedWs.length === 1) { var f = findWs(selectedWs[0]); msLabel.textContent = f ? f.ws.name : "1 workspace"; return; }
    msLabel.textContent = selectedWs.length + " workspaces";
  }
  function renderPop() {
    if (!msPop) return;
    var html = '<div class="ms__actions"><button type="button" class="ms__act" data-act="all">Select all</button><button type="button" class="ms__act" data-act="none">Clear</button></div>';
    TEAMS.forEach(function (t) {
      var ids = t.workspaces.map(function (w) { return w.id; });
      var on = ids.every(isSel), some = ids.some(isSel);
      html += '<div class="ms__group"><label class="ms__team"><input type="checkbox" data-team="' + t.id + '"' + (on ? " checked" : "") + (!on && some ? ' data-indet="1"' : '') + ' /><span>' + escapeHtml(t.name) + '</span></label>';
      t.workspaces.forEach(function (w) {
        html += '<label class="ms__ws"><input type="checkbox" data-ws="' + w.id + '"' + (isSel(w.id) ? " checked" : "") + ' /><span>' + escapeHtml(w.name) + '</span></label>';
      });
      html += '</div>';
    });
    msPop.innerHTML = html;
    msPop.querySelectorAll('[data-indet="1"]').forEach(function (cb) { cb.indeterminate = true; });
  }
  if (msBtn && msPop) {
    msBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (msPop.hidden) { renderPop(); msPop.hidden = false; msBtn.setAttribute("aria-expanded", "true"); }
      else { msPop.hidden = true; msBtn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("click", function (e) {
      if (msWrap && !msWrap.contains(e.target)) { msPop.hidden = true; msBtn.setAttribute("aria-expanded", "false"); }
    });
    msPop.addEventListener("change", function (e) {
      var set = curSet();
      var ws = e.target.getAttribute("data-ws"), team = e.target.getAttribute("data-team");
      if (ws) {
        if (e.target.checked) { if (set.indexOf(ws) === -1) set.push(ws); }
        else set = set.filter(function (x) { return x !== ws; });
      } else if (team) {
        var t = TEAMS.filter(function (x) { return x.id === team; })[0];
        var ids = t.workspaces.map(function (w) { return w.id; });
        if (e.target.checked) ids.forEach(function (id) { if (set.indexOf(id) === -1) set.push(id); });
        else set = set.filter(function (x) { return ids.indexOf(x) === -1; });
      }
      commitSet(set);
    });
    msPop.addEventListener("click", function (e) {
      var a = e.target.closest(".ms__act");
      if (!a) return;
      commitSet(a.getAttribute("data-act") === "all" ? allWsIds() : []);
    });
  }

  updateLabel();
  render();

  // ---- Toggle the page-header add button per active tab ----
  (function () {
    var genBtn = document.getElementById("gen-add-ws-top");
    var cdBtn = document.getElementById("cd-add-top");
    var tabs = document.querySelectorAll('[data-tabs="settings-page"] .tab');
    function sync() {
      var active = document.querySelector('[data-tabs="settings-page"] .tab.is-active');
      var key = active ? active.getAttribute("data-tab") : "general";
      if (genBtn) genBtn.hidden = key !== "general";
      if (cdBtn) cdBtn.hidden = key !== "dest";
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { setTimeout(sync, 0); }); });
    sync();
  })();

  // ---- MCP copy ----
  function flash(el) { el.classList.add("is-copied"); setTimeout(function () { el.classList.remove("is-copied"); }, 1100); }
  function copy(text, cb) {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(cb).catch(function () { exec(text); cb(); });
    else { exec(text); cb(); }
  }
  function exec(text) { try { var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); } catch (e) {} }
  document.addEventListener("click", function (e) {
    var cb = e.target.closest(".mcp-code__copy");
    if (cb) {
      var pre = cb.closest(".mcp-code");
      copy(pre.getAttribute("data-copy") || pre.querySelector("code").textContent, function () {
        cb.textContent = "Copied"; cb.classList.add("is-copied");
        setTimeout(function () { cb.textContent = "Copy"; cb.classList.remove("is-copied"); }, 1100);
      });
      return;
    }
    var c = e.target.closest(".mcp-copy, .mcp-pre");
    if (c && c.getAttribute("data-copy")) copy(c.getAttribute("data-copy"), function () { flash(c); });
  });
})();

(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const I = global.TreeI18N;

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch])); }
function escapeAttr(s) { return escapeHtml(s).replace(/'/g, "&#39;"); }

function formatMetaValue(v) {
  if (v == null) return "";
  if (Array.isArray(v)) {
    return "[" + v.map(x => {
      if (typeof x === "number") {
        if (Number.isInteger(x)) return String(x);
        return Number(x).toPrecision(6).replace(/\.?0+(e|$)/i, "$1");
      }
      return String(x);
    }).join(", ") + "]";
  }
  if (typeof v === "number") {
    if (Number.isInteger(v)) return String(v);
    return Number(v).toPrecision(6).replace(/\.?0+(e|$)/i, "$1");
  }
  if (typeof v === "object") {
    try { return JSON.stringify(v); } catch (_) { return String(v); }
  }
  return String(v);
}
function collectNodeRows() {
  const root = C.getRoot();
  if (!root) return { rows: [], metaFields: [] };
  const depthMap = new Map();
  (function walk(n, depth, cumLen) {
    depthMap.set(n, { depth, cumLen });
    (n.children || []).forEach(c => walk(c, depth + 1, cumLen + (Number(c.length) || 0)));
  })(root, 0, 0);
  const metaSet = new Set();
  T.allWalk(root, n => (n.meta || []).forEach(f => { if (f && f.field) metaSet.add(f.field); }));
  const PRIORITY = ["posterior", "height", "height_median", "height_95%_HPD", "height_range", "length", "length_median", "length_95%_HPD", "length_range", "rate", "rate_median", "rate_95%_HPD", "rate_range"];
  const metaFields = Array.from(metaSet).sort((a, b) => {
    const ai = PRIORITY.indexOf(a), bi = PRIORITY.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });
  const fmtSupport = v => {
    if (v == null || v === "") return "";
    const fn = global.TreeDrawNode && global.TreeDrawNode.formatBootstrapValue;
    try { return fn ? fn(v) : String(v); } catch (_) { return String(v); }
  };
  const rows = [];
  let idx = 0;
  T.allWalk(root, n => {
    idx++;
    const realChildren = (n.children || []).filter(c => !c.deleted);
    const isLeaf = realChildren.length === 0;
    const parentLabel = n.parent ? (T.labelOf(n.parent) || n.parent.id) : "";
    const dm = depthMap.get(n) || { depth: 0, cumLen: 0 };
    const metaMap = {};
    (n.meta || []).forEach(f => {
      if (f && f.field) {
        const v = formatMetaValue(f.value);
        metaMap[f.field] = metaMap[f.field] ? metaMap[f.field] + "; " + v : v;
      }
    });
    let status = "";
    if (n.deleted) status = "deleted"; else if (n.collapsed) status = "collapsed";
    rows.push({
      _idx: idx, _id: n.id, _isLeaf: isLeaf, _collapsed: !!n.collapsed,
      uid: n.uid || "", label: T.labelOf(n) || "",
      type: isLeaf ? "leaf" : "internal",
      depth: dm.depth, cumLength: dm.cumLen,
      length: (n.length != null) ? Number(n.length) : "",
      supportStr: fmtSupport(n.support),
      parent: parentLabel, children: realChildren.length, status,
      branchColor: n.branchColor || "",
      widthFactor: (n.branchWidthFactor != null && n.branchWidthFactor !== 1) ? n.branchWidthFactor : "",
      branchDash: n.branchDash === true ? "yes" : "",
      truncated: n.truncated ? "yes" : "",
      _meta: metaMap
    });
  });
  return { rows, metaFields };
}
function getFilteredNodeRows() {
  const { rows, metaFields } = collectNodeRows();
  const showLeaf = document.getElementById("showLeafNodes")?.checked !== false;
  const showInternal = document.getElementById("showInternalNodes")?.checked !== false;
  const onlySupport = document.getElementById("showOnlyWithSupport")?.checked === true;
  const query = (document.getElementById("nodeTableSearch")?.value || "").trim().toLowerCase();
  const filtered = rows.filter(r => {
    if (r._isLeaf && !showLeaf) return false;
    if (!r._isLeaf && !showInternal) return false;
    if (onlySupport && !r.supportStr) return false;
    if (query) {
      const metaVals = metaFields.map(f => r._meta[f] || "").join(" ");
      const hay = [r._id, r.uid, r.label, r.parent, metaVals].join(" ").toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  return { rows: filtered, metaFields };
}
function highlightSvgNode(id) {
  const svg = C.getSvg();
  if (!svg) return;
  svg.querySelectorAll('.hover-highlight').forEach(el => {
    el.classList.remove('hover-highlight');
    el.removeAttribute('fill');
    el.removeAttribute('stroke');
    el.removeAttribute('stroke-width');
    el.removeAttribute('data-hover');
  });
  if (!id) return;
  svg.querySelectorAll('[data-id="' + id + '"]').forEach(el => {
    el.classList.add('hover-highlight');
    el.setAttribute('data-hover', '1');
    if (el.classList.contains('node-hotspot')) {
      el.setAttribute('fill', 'rgba(255,75,75,0.22)');
      el.setAttribute('stroke', '#ff4b4b');
      el.setAttribute('stroke-width', '2');
    }
  });
}
function renderNodeTable() {
  const box = document.getElementById("nodeTableWrap");
  if (!box) return;
  if (!C.getRoot()) { box.innerHTML = '<div class="empty-tip">' + I.t('tableEmptyHint') + '</div>'; return; }
  const { rows, metaFields } = getFilteredNodeRows();
  if (!rows.length) { box.innerHTML = '<div class="empty-tip">' + I.t('tableNoMatchHint') + '</div>'; return; }
  const baseHeaders = ["#", "ID", "Label", "Type", "Depth", "CumLength", "Length", "Support", "Parent", "Children", "Status", "BranchColor", "WidthFactor", "BranchDash", "Truncated"];
  const headers = baseHeaders.concat(metaFields.map(f => "Meta: " + f));
  const thead = '<tr>' + headers.map(h => {
    const isHPD = /95%|HPD|posterior/i.test(h);
    const style = isHPD ? ' style="color:#c0392b;font-weight:800;"' : "";
    return `<th${style}>${escapeHtml(h)}</th>`;
  }).join('') + '</tr>';
  const MAX_ROWS = 2000;
  const toShow = rows.slice(0, MAX_ROWS);
  const cell = v => escapeHtml(v == null ? "" : v);
  const editableCell = (id, kind, content, extraStyle) => {
    const st = extraStyle ? ` style="${extraStyle}"` : "";
    const shown = (content === '' || content == null) ? '&nbsp;' : content;
    return `<span class="editable-cell" data-id="${cell(id)}" data-edit="${kind}"${st}>${shown}</span>`;
  };
  const selId = C.getSelectedId();
  const tbody = toShow.map(r => {
    const cells = [
      r._idx,
      "<code>" + cell(r._id) + "</code>",
      editableCell(r._id, "label", cell(r.label)),
      r._isLeaf ? '<span style="color:#2e7d32;">leaf</span>' : '<span style="color:#1f4068;">internal</span>',
      r.depth,
      r.cumLength.toFixed(4),
      editableCell(r._id, "length", r.length === "" ? "" : Number(r.length).toFixed(4)),
      editableCell(r._id, "support", cell(r.supportStr)),
      cell(r.parent),
      r.children,
      r.status === "deleted" ? '<span style="color:#999;">deleted</span>' :
        r.status === "collapsed" ? '<span style="color:#c0392b;">collapsed</span>' : "",
      cell(r.branchColor),
      r.widthFactor === "" ? "" : r.widthFactor,
      cell(r.branchDash),
      cell(r.truncated)
    ];
    metaFields.forEach(f => {
      const v = cell(r._meta[f] || "");
      const isHPD = /95%|HPD|posterior/i.test(f);
      const inner = editableCell(r._id, "meta:" + f, v);
      cells.push(isHPD ? `<span style="color:#c0392b;font-weight:600;">${inner}</span>` : inner);
    });
    const cls = (r._id === selId) ? ' class="row-selected"' : "";
    return '<tr data-id="' + cell(r._id) + '" style="cursor:pointer;"' + cls + '>' + cells.map(c => '<td>' + c + '</td>').join('') + '</tr>';
  }).join('');
  const more = rows.length > toShow.length
    ? `<div class="info-box" style="margin:6px 0 0;">${I.t('tableFiltered', { shown: MAX_ROWS, total: rows.length })}</div>`
    : `<div class="info-box" style="margin:6px 0 0;">${I.t('tableTotal', { n: rows.length })}</div>`;
  box.innerHTML = `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>${more}`;
  box.querySelectorAll('tbody tr[data-id]').forEach(tr => {
    const id = tr.dataset.id;
    tr.addEventListener('mouseenter', () => highlightSvgNode(id));
    tr.addEventListener('mouseleave', () => highlightSvgNode(null));
    tr.addEventListener('click', (e) => {
      if (e.detail > 1) return;
      const cx = e.clientX, cy = e.clientY;
      C.setSelectedId(id);
      global.TreeUI.refreshTreeView();
      box.querySelectorAll('tbody tr').forEach(x => x.classList.remove('row-selected'));
      tr.classList.add('row-selected');
      setTimeout(() => showNodeActionPanel(id, cx, cy), 0);
    });
  });
  box.querySelectorAll('.editable-cell').forEach(span => {
    span.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startEditCell(span);
    });
  });
}
function startEditCell(span) {
  if (!span || span.querySelector('input')) return;
  const id = span.dataset.id;
  const edit = span.dataset.edit;
  const n = T.nodeById(id);
  if (!n) return;
  let raw = '';
  let apply = null;
  if (edit === 'label') {
    raw = n.label != null ? String(n.label) : (n.name || '');
    apply = (v) => { n.label = v === '' ? null : v; };
  } else if (edit === 'length') {
    raw = (n.length != null) ? String(n.length) : '';
    apply = (v) => {
      const num = Number(v);
      if (Number.isFinite(num) && num >= 0) n.length = num;
    };
  } else if (edit === 'support') {
    raw = (n.support != null) ? String(n.support) : '';
    apply = (v) => { n.support = v; };
  } else if (edit.indexOf('meta:') === 0) {
    const field = edit.slice(5);
    const list = (n.meta || []).filter(mm => mm.field === field);
    if (list.length === 0) raw = '';
    else if (list.length === 1) {
      const v = list[0].value;
      raw = (typeof v === 'string') ? v : JSON.stringify(v);
    } else raw = JSON.stringify(list.map(mm => mm.value));
    apply = (v) => {
      n.meta = (n.meta || []).filter(mm => mm.field !== field);
      if (v === '') return;
      let val = v;
      try { val = JSON.parse(v); } catch (_) {}
      if (list.length > 1 && Array.isArray(val)) {
        val.forEach(x => n.meta.push({ field, value: x }));
      } else {
        n.meta.push({ field, value: val });
      }
    };
  }
  if (!apply) return;
  const original = span.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = raw;
  input.style.cssText =
    'width:100%;box-sizing:border-box;font-family:Consolas,Monaco,monospace;' +
    'font-size:12px;padding:1px 4px;border:1px solid #1f4068;border-radius:3px;' +
    'background:#fff;color:#222;outline:none;';
  span.innerHTML = '';
  span.appendChild(input);
  input.focus();
  input.select();
  let done = false;
  function commit() {
    if (done) return;
    done = true;
    const v = input.value;
    if (v !== raw) {
      apply(v);
      const wrap = document.getElementById('nodeTableWrap');
      const scrollTop = wrap ? wrap.scrollTop : 0;
      global.TreeRenderer.draw();
      renderNodeTable();
      if (wrap) wrap.scrollTop = scrollTop;
      const statusEl = document.getElementById('status');
      if (statusEl) statusEl.textContent = I.t('statusCellUpdated', { field: edit.split(':')[0] === 'meta' ? edit.slice(5) : edit });
    } else {
      span.textContent = original;
    }
  }
  function cancel() {
    if (done) return;
    done = true;
    span.textContent = original;
  }
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
}
function showNodeActionPanel(nodeId, clientX, clientY) {
  const n = T.nodeById(nodeId);
  if (!n) return;
  C.setSelectedBranchId(null);
  let panel = document.getElementById("nodeActionPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "nodeActionPanel";
    panel.className = "node-action-panel";
    document.body.appendChild(panel);
    panel.addEventListener("click", e => e.stopPropagation());
  }
  const isLeaf = T.isLeaf(n);
  const hasChildren = (n.children || []).some(c => !c.deleted);
  const curColor = n.branchColor || C.state.branchColor || "#262626";
  const curWidth = n.branchWidthFactor || 1;
  const collapseLabel = n.collapsed ? I.t('napExpand') : I.t('napCollapse');
  const st = C.state;
  const curMode = st.collapsedMode || "actual";
  const curTipOffset = Number(st.collapsedTipOffset) || 0;
  const curFill = st.collapsedFill || "#dbe6f0";
  const curFillOpacity = (st.collapsedFillOpacity != null) ? Number(st.collapsedFillOpacity) : 0.9;
  const curCompress = !!st.collapsedCompress;
  const curCompressLeafCount = Math.max(1, Number(st.collapsedCompressLeafCount) || 3);
  const canExtend = !!st.extendBranches && st.labelPosition === "aligned";
  const modeTooltip = canExtend ? "" : ` title="${I.t('napExtendTooltip')}"`;
  const kindLabel = isLeaf ? I.t('napLeaf') : I.t('napInternal');

  let ownerRange = null;
  for (let cur = n; cur; cur = cur.parent) {
    if (cur.rangeId != null) {
      ownerRange = global.TreeRanges.colorRanges.find(r => r.id === cur.rangeId) || null;
      break;
    }
  }
  const allRanges = global.TreeRanges.colorRanges;

  panel.innerHTML = `
    <div class="nap-title">${I.t('napTitle', { kind: kindLabel, name: escapeHtml(T.labelOf(n)) })}</div>
    <button class="nap-btn" data-nap="delete">${isLeaf ? I.t('napDeleteLeaf') : I.t('napDeleteClade')}</button>
    <button class="nap-btn has-sub" data-nap="collapse-toggle" ${hasChildren ? "" : "disabled"}>${collapseLabel}</button>
    <div class="nap-sub" data-sub="collapse">
      <div class="nap-sub-title">${I.t('napCollapseTitle')}</div>
      <button class="nap-sub-btn ${curMode === 'actual' ? 'active' : ''}" data-collapse-mode="actual">
        <span class="nap-sub-radio">${curMode === 'actual' ? '●' : '○'}</span> ${I.t('napByNode')}
      </button>
      <button class="nap-sub-btn ${curMode === 'extended' ? 'active' : ''}" data-collapse-mode="extended" ${canExtend ? '' : 'disabled'}${modeTooltip}>
        <span class="nap-sub-radio">${curMode === 'extended' ? '●' : '○'}</span> ${I.t('napByExtended')}
      </button>
      <div class="nap-row"><label>${I.t('napTipOffset')}</label><input type="number" class="nap-tip-offset" min="0" step="1" value="${curTipOffset}"></div>
      <div class="nap-row"><label>${I.t('napCompress')}</label><input type="checkbox" class="nap-compress" ${curCompress ? "checked" : ""}></div>
      <div class="nap-row"><label>${I.t('napCompressLeaf')}</label><input type="number" class="nap-compress-leafcount" min="1" step="1" value="${curCompressLeafCount}" ${curCompress ? "" : "disabled"}></div>
      <div class="nap-row"><label>${I.t('napTriangleFill')}</label><input type="color" class="nap-fill" value="${curFill}"></div>
      <div class="nap-row"><label>${I.t('napOpacity')}</label><input type="number" class="nap-fill-opacity" min="0" max="1" step="0.05" value="${curFillOpacity}"></div>
      <div class="nap-hint">${I.t('napCollapseHint')}</div>
    </div>
    <button class="nap-btn" data-nap="reverse" ${isLeaf ? "disabled" : ""}>${I.t('napReverse')}</button>
    <button class="nap-btn" data-nap="dash">${I.t('napDash')}</button>
    <button class="nap-btn has-sub" data-nap="range-toggle">${I.t('napRangeManage')}</button>
    <div class="nap-sub" data-sub="range">
      <div class="nap-sub-title">${I.t('napRangeGroup')}</div>
      ${ownerRange ? `<div class="nap-hint" style="padding:2px 22px 6px;">${I.t('napRangeCurrent')}<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${ownerRange.color};margin-right:4px;vertical-align:middle;"></span>${escapeHtml(ownerRange.label || ('Range ' + ownerRange.id))}</div>` : ''}
      <button class="nap-sub-btn" data-range-action="create">
        <span class="nap-sub-radio">＋</span> ${I.t('napRangeCreate')}
      </button>
      ${allRanges.map(r => `
        <div class="nap-range-row" style="display:flex;align-items:center;gap:6px;padding:4px 14px 4px 22px;">
          <input type="color" class="nap-range-color" data-range-edit="${r.id}" value="${r.color}"
                 title="${I.t('napRangeEditColor')}"
                 style="width:22px;height:22px;padding:0;border:1px solid #ccc;border-radius:3px;cursor:pointer;flex-shrink:0;background:#fff;">
          <button type="button" class="nap-range-name" data-range-apply="${r.id}"
                  title="${I.t('napRangeApply')}"
                  style="flex:1;min-width:0;text-align:left;padding:4px 6px;background:none;border:0;cursor:pointer;font:inherit;font-size:12.5px;color:#1d2c2e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.label || ('Range ' + r.id))}</button>
          <span class="${n.rangeId === r.id ? 'nap-range-check' : 'nap-range-check-empty'}"
                style="${n.rangeId === r.id ? 'color:#c0392b;font-weight:700;' : ''}flex-shrink:0;width:14px;text-align:center;">${n.rangeId === r.id ? '✓' : ' '}</span>
        </div>
      `).join('')}
      <button class="nap-sub-btn" data-range-action="remove" ${n.rangeId == null ? 'disabled' : ''}>
        <span class="nap-sub-radio">−</span> ${I.t('napRangeRemove')}
      </button>
      <div class="nap-hint">${I.t('napRangeHint')}</div>
    </div>
    <div class="nap-row"><label>${I.t('napSubtreeColor')}</label><input type="color" class="nap-color" value="${curColor}"></div>
    <div class="nap-row"><label>${I.t('napWidthFactor')}</label><input type="number" class="nap-width" min="0.2" max="8" step="0.1" value="${curWidth}"></div>
    <button class="nap-btn" data-nap="export-subtree" title="${I.t('napExportSubtreeTip')}">${I.t('napExportSubtree')}</button>
    <button class="nap-btn nap-close" data-nap="close">${I.t('napClose')}</button>
  `;

  panel.style.display = "block";
  const w = panel.offsetWidth || 270;
  const h = panel.offsetHeight || 340;
  panel.style.left = Math.min(clientX + 8, window.innerWidth - w - 8) + "px";
  panel.style.top = Math.min(clientY + 8, window.innerHeight - h - 8) + "px";

  const collapseToggle = panel.querySelector('[data-nap="collapse-toggle"]');
  const collapseSub = panel.querySelector('[data-sub="collapse"]');
  const tipOffsetInput = panel.querySelector(".nap-tip-offset");
  const compressCheck = panel.querySelector(".nap-compress");
  const compressLeafCountInput = panel.querySelector(".nap-compress-leafcount");
  const fillInput = panel.querySelector(".nap-fill");
  const fillOpacityInput = panel.querySelector(".nap-fill-opacity");
  const rangeToggle = panel.querySelector('[data-nap="range-toggle"]');
  const rangeSub = panel.querySelector('[data-sub="range"]');

  if (collapseToggle) {
    collapseToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (collapseToggle.disabled) return;
      if (n.collapsed) {
        n.collapsed = false;
        global.TreeUI.refreshTreeView();
        renderNodeTable();
        collapseToggle.textContent = I.t('napCollapse');
        collapseToggle.classList.remove("open");
        collapseSub.classList.remove("open");
        reposition();
      } else {
        const willOpen = !collapseSub.classList.contains("open");
        collapseSub.classList.toggle("open", willOpen);
        collapseToggle.classList.toggle("open", willOpen);
        if (willOpen) reposition();
      }
    });
  }
  panel.querySelectorAll("[data-collapse-mode]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      const mode = btn.dataset.collapseMode;
      C.state.collapsedMode = mode;
      n.collapsed = true;
      collapseToggle.textContent = I.t('napExpand');
      collapseToggle.classList.add("open");
      collapseSub.classList.add("open");
      panel.querySelectorAll("[data-collapse-mode]").forEach(b => {
        const active = b.dataset.collapseMode === mode;
        b.classList.toggle("active", active);
        const radio = b.querySelector(".nap-sub-radio");
        if (radio) radio.textContent = active ? "●" : "○";
      });
      global.TreeUI.refreshTreeView();
      renderNodeTable();
      reposition();
    });
  });
  if (tipOffsetInput) tipOffsetInput.addEventListener("change", () => {
    const v = Number(tipOffsetInput.value);
    if (!isFinite(v) || v < 0) return;
    C.state.collapsedTipOffset = v;
    if (n.collapsed) global.TreeUI.refreshTreeView();
  });
  if (compressCheck) compressCheck.addEventListener("change", () => {
    C.state.collapsedCompress = compressCheck.checked;
    if (compressLeafCountInput) compressLeafCountInput.disabled = !compressCheck.checked;
    if (n.collapsed) global.TreeUI.refreshTreeView();
  });
  if (compressLeafCountInput) compressLeafCountInput.addEventListener("change", () => {
    const v = Math.max(1, parseInt(compressLeafCountInput.value, 10) || 3);
    C.state.collapsedCompressLeafCount = v;
    if (n.collapsed) global.TreeUI.refreshTreeView();
  });
  if (fillInput) fillInput.addEventListener("input", () => {
    C.state.collapsedFill = fillInput.value || "#dbe6f0";
    if (n.collapsed) global.TreeUI.refreshTreeView();
  });
  if (fillOpacityInput) fillOpacityInput.addEventListener("change", () => {
    const v = Math.max(0, Math.min(1, Number(fillOpacityInput.value)));
    if (!isFinite(v)) return;
    C.state.collapsedFillOpacity = v;
    if (n.collapsed) global.TreeUI.refreshTreeView();
  });
  if (rangeToggle && rangeSub) {
    rangeToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = !rangeSub.classList.contains("open");
      rangeSub.classList.toggle("open", willOpen);
      rangeToggle.classList.toggle("open", willOpen);
      if (willOpen) reposition();
    });
  }

  function refreshRangeChecks(activeId) {
    panel.querySelectorAll(".nap-range-check, .nap-range-check-empty").forEach(chk => {
      chk.className = "nap-range-check-empty";
      chk.style.color = "";
      chk.style.fontWeight = "";
      chk.textContent = " ";
    });
    if (activeId != null) {
      const row = panel.querySelector(`[data-range-apply="${activeId}"]`);
      if (row) {
        const chk = row.closest(".nap-range-row")?.querySelector(".nap-range-check-empty");
        if (chk) {
          chk.className = "nap-range-check";
          chk.style.color = "#c0392b";
          chk.style.fontWeight = "700";
          chk.textContent = "✓";
        }
      }
    }
  }
  panel.querySelectorAll("[data-range-edit]").forEach(inp => {
    inp.addEventListener("click", e => e.stopPropagation());
    inp.addEventListener("input", e => {
      e.stopPropagation();
      const id = Number(inp.dataset.rangeEdit);
      const range = global.TreeRanges.colorRanges.find(r => r.id === id);
      if (!range) return;
      range.color = inp.value;
      global.TreeRenderer.draw();
    });
  });
  panel.querySelectorAll("[data-range-apply]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const id = Number(btn.dataset.rangeApply);
      n.rangeId = id;
      global.TreeUI.refreshTreeView();
      renderNodeTable();
      refreshRangeChecks(id);
      reposition();
    });
  });
  panel.querySelectorAll("[data-range-action]").forEach(rbtn => {
    rbtn.addEventListener("click", e => {
      e.stopPropagation();
      if (rbtn.disabled) return;
      const ract = rbtn.dataset.rangeAction;
      if (ract === "create") {
        global.TreeRanges.createRangeForSelected();
        const rect = panel.getBoundingClientRect();
        panel.style.display = "none";
        setTimeout(() => {
          showNodeActionPanel(n.id, rect.left, rect.top);
        }, 0);
      } else if (ract === "remove") {
        n.rangeId = null;
        global.TreeUI.refreshTreeView();
        renderNodeTable();
        refreshRangeChecks(null);
      }
    });
  });
  panel.querySelectorAll("[data-nap]").forEach(btn => {
    const act = btn.dataset.nap;
    if (act === "collapse-toggle") return;
    if (act === "range-toggle") return;
    if (act === "close") {
      btn.addEventListener("click", (e) => { e.stopPropagation(); panel.style.display = "none"; });
      return;
    }
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      handleNodeAction(act, n);
    });
  });
  const colorInput = panel.querySelector(".nap-color");
  if (colorInput) colorInput.addEventListener("change", () => {
    const val = colorInput.value || "#262626";
    T.allWalk(n, x => { x.branchColor = val; });
    global.TreeUI.refreshTreeView();
    renderNodeTable();
  });
  const widthInput = panel.querySelector(".nap-width");
  if (widthInput) widthInput.addEventListener("change", () => {
    const v = Number(widthInput.value);
    if (!isFinite(v) || v <= 0) return;
    T.allWalk(n, x => { x.branchWidthFactor = v; });
    global.TreeUI.refreshTreeView();
    renderNodeTable();
  });
  function reposition() {
    const w2 = panel.offsetWidth, h2 = panel.offsetHeight;
    const left = Math.min(parseFloat(panel.style.left) || clientX + 8, window.innerWidth - w2 - 8);
    const top = Math.min(parseFloat(panel.style.top) || clientY + 8, window.innerHeight - h2 - 8);
    panel.style.left = Math.max(8, left) + "px";
    panel.style.top = Math.max(8, top) + "px";
  }
}
function showBranchActionPanel(branchNodeId, clientX, clientY) {
  const n = T.nodeById(branchNodeId);
  if (!n || !n.parent) return;
  let panel = document.getElementById("branchActionPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "branchActionPanel";
    panel.className = "node-action-panel";
    document.body.appendChild(panel);
    panel.addEventListener("click", e => e.stopPropagation());
  }
  panel.innerHTML = `
    <div class="nap-title">${I.t('branchTitle', { name: escapeHtml(T.labelOf(n)) })}</div>
    <button class="nap-btn" data-nap="reroot-branch">${I.t('branchReroot')}</button>
    <button class="nap-btn nap-close" data-nap="close">${I.t('branchClose')}</button>
  `;
  panel.style.display = "block";
  const w = panel.offsetWidth || 240;
  const h = panel.offsetHeight || 90;
  panel.style.left = Math.min(clientX + 8, window.innerWidth - w - 8) + "px";
  panel.style.top = Math.min(clientY + 8, window.innerHeight - h - 8) + "px";
  panel.querySelector('[data-nap="reroot-branch"]')?.addEventListener("click", () => {
    if (T.rerootAt(n)) {
      C.state.hasRoot = true;
      const root = C.getRoot();
      if (root) root.rootFlag = true;
      C.setSelectedBranchId(null);
      global.TreeUI.refreshTreeView();
      renderNodeTable();
      global.TreeAppData.rebuildLeafRowsFromTree();
      global.TreeAppData.renderLeafDataPreview();
      global.TreeAppData.refreshDataSummary();
    }
    panel.style.display = "none";
  });
  panel.querySelector('[data-nap="close"]')?.addEventListener("click", () => {
    panel.style.display = "none";
  });
}
function handleNodeAction(action, n) {
  if (!n) return;

  if (action === "export-subtree") {
    const S = global.TreeSerialize;
    if (!S || !S.cropTreeToPathAndSubtree || !S.toPhyloXMLWithMeta) {
      alert(I.t('alertSerializeMissing'));
      return;
    }
    const cropped = S.cropTreeToPathAndSubtree(C.getRoot(), n);
    if (!cropped) { alert(I.t('alertExportSubtreeFail')); return; }
    const xml = S.toPhyloXMLWithMeta(cropped);
    const label = String(T.labelOf(n) || n.id || 'subtree').replace(/[^\w.-]+/g, '_');
    if (global.TreeExport && global.TreeExport.download) {
      global.TreeExport.download(label + '_subtree.xml', xml, 'application/xml;charset=utf-8');
    }
    return;
  }

  if (action === "delete") n.deleted = true;
  else if (action === "reverse") {
    if (n.children && n.children.length > 1) n.children.reverse();
  } else if (action === "dash") {
    let anySolid = false;
    T.allWalk(n, x => {
      if (x === n) return;
      const dashed = x.branchDash !== undefined ? x.branchDash : C.state.dashed;
      if (!dashed) anySolid = true;
    });
    const newDash = anySolid;
    T.allWalk(n, x => { if (x !== n) x.branchDash = newDash; });
  }
  global.TreeUI.refreshTreeView();
  renderNodeTable();
  global.TreeAppData.rebuildLeafRowsFromTree();
  global.TreeAppData.renderLeafDataPreview();
  global.TreeAppData.refreshDataSummary();
}
function exportNodeTableCsv() {
  if (!C.getRoot()) { alert(I.t('alertNeedTreeShort')); return; }
  const { rows, metaFields } = getFilteredNodeRows();
  if (!rows.length) { alert(I.t('alertNoMatchNode')); return; }
  const csvCell = v => {
    const s = String(v == null ? "" : v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const headers = ["index", "id", "label", "type", "depth", "cumulative_length", "branch_length", "support", "parent", "children", "status", "branch_color", "width_factor", "branch_dash", "truncated"]
    .concat(metaFields.map(f => "meta_" + f));
  const lines = [headers.join(",")];
  rows.forEach(r => {
    const row = [r._idx, r._id, r.label, r.type, r.depth, r.cumLength, r.length, r.supportStr, r.parent, r.children, r.status, r.branchColor, r.widthFactor, r.branchDash, r.truncated];
    metaFields.forEach(f => row.push(r._meta[f] || ""));
    lines.push(row.map(csvCell).join(","));
  });
  const csv = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tree_nodes.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function fillNodeIdsInMetaPanel() {
  const ta = document.getElementById("nodeMetaText");
  if (!ta) return;
  const root = C.getRoot();
  if (!root) { alert(I.t('alertNeedTree')); return; }
  const current = (ta.value || "").trim();
  let headers = ["ID"];
  const existing = new Map();
  if (current) {
    const lines = current.split(/\r?\n/).filter(l => l.trim());
    if (lines.length) {
      const delim = lines[0].includes("\t") ? "\t" : lines[0].includes(",") ? "," : /\s+/;
      const parse = line => (delim instanceof RegExp) ? line.trim().split(delim) : line.split(delim).map(s => s.trim());
      const h = parse(lines[0]);
      if (h.length) headers = ["ID", ...h.slice(1)];
      for (let i = 1; i < lines.length; i++) {
        const cells = parse(lines[i]);
        if (cells[0]) existing.set(cells[0].trim(), cells);
      }
    }
  }
  const out = [headers.join("\t")];
  T.allWalk(root, n => {
    const cells = new Array(headers.length).fill("");
    cells[0] = n.id;
    const old = existing.get(n.id);
    if (old) for (let j = 1; j < headers.length; j++) if (old[j] !== undefined) cells[j] = old[j];
    out.push(cells.join("\t"));
  });
  ta.value = out.join("\n");
}
function generateNodeRandomData() {
  const ta = document.getElementById("nodeMetaText");
  if (!ta) return;
  const root = C.getRoot();
  if (!root) { alert(I.t('alertNeedTree')); return; }
  const headers = ["ID", "rand_val1", "rand_val2", "rand_val3", "rand_val4"];
  const out = [headers.join("\t")];
  T.allWalk(root, n => {
    out.push([n.id,
      (Math.random() * 10).toFixed(2),
      (Math.random() * 10).toFixed(2),
      (Math.random() * 10).toFixed(2),
      (Math.random() * 10).toFixed(2)].join("\t"));
  });
  ta.value = out.join("\n");
}
function mergeNodeMetaData() {
  const root = C.getRoot();
  if (!root) { alert(I.t('alertNeedTree')); return; }
  const ta = document.getElementById("nodeMetaText");
  const text = (ta?.value || "").trim();
  if (!text) { alert(I.t('nodeMetaEmpty')); return; }
  const parsed = global.PlotCommon && PlotCommon.parseTable ? PlotCommon.parseTable(text) : null;
  if (!parsed || !parsed.headers.length) { alert(I.t('alertParseFail')); return; }
  const idCol = parsed.headers[0];
  const useId = /^id$/i.test(String(idCol).trim());
  const metaCols = parsed.headers.slice(1);
  if (!metaCols.length) { alert(I.t('nodeMetaNoMetaCol')); return; }
  const byId = new Map(), byLabel = new Map(), byUid = new Map();
  T.allWalk(root, n => {
    byId.set(n.id, n);
    const lbl = T.labelOf(n);
    if (!byLabel.has(lbl)) byLabel.set(lbl, n);
    if (n.name && !byLabel.has(n.name)) byLabel.set(n.name, n);
    if (n.uid && !byUid.has(n.uid)) byUid.set(n.uid, n);
  });
  let matched = 0;
  parsed.data.forEach(row => {
    const key = String(row[idCol] == null ? "" : row[idCol]).trim();
    if (!key) return;
    const n = useId ? byId.get(key) : (byId.get(key) || byLabel.get(key) || byUid.get(key));
    if (!n) return;
    matched++;
    metaCols.forEach(col => {
      const raw = row[col];
      if (raw == null || raw === "") return;
      let val = raw;
      const num = Number(raw);
      if (Number.isFinite(num) && String(num) === String(raw).trim()) val = num;
      n.meta = (n.meta || []).filter(m => m.field !== col);
      n.meta.push({ field: col, value: val });
    });
  });
  if (matched > 0) {
    renderNodeTable();
    if (global.TreeUIAdvanced && global.TreeUIAdvanced.renderAdvancedPanel) {
      const adv = document.getElementById("advancedStylePanel");
      if (adv) global.TreeUIAdvanced.renderAdvancedPanel(adv);
    }
    if (global.TreeRenderer) global.TreeRenderer.draw();
  }
  const st = document.getElementById("status");
  if (st) st.textContent = matched > 0
    ? I.t('nodeMetaMerged', { n: matched })
    : I.t('nodeMetaNoMatch');
}
function addMetaColumn() {
  const root = C.getRoot();
  if (!root) { alert(I.t('alertNeedTree')); return; }
  const input = prompt(I.t('addMetaPrompt'), 'meta1');
  if (input === null) return;
  const field = String(input).trim();
  if (!field) return;
  let count = 0;
  T.allWalk(root, n => {
    n.meta = n.meta || [];
    if (!n.meta.find(m => m.field === field)) {
      n.meta.push({ field, value: '' });
      count++;
    }
  });
  global.TreeUI.refreshTreeView();
  renderNodeTable();
  if (global.TreeUIAdvanced && global.TreeUIAdvanced.renderAdvancedPanel) {
    const adv = document.getElementById("advancedStylePanel");
    if (adv) global.TreeUIAdvanced.renderAdvancedPanel(adv);
  }
  const st = document.getElementById("status");
  if (st) st.textContent = I.t('addMetaStatus', { field, n: count });
}

global.TreeAppNodes = {
  renderNodeTable, showNodeActionPanel, showBranchActionPanel,
  exportNodeTableCsv, fillNodeIdsInMetaPanel, generateNodeRandomData,
  mergeNodeMetaData, addMetaColumn, formatMetaValue
};
})(window);
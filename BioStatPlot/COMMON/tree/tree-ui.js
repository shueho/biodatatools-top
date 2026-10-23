(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const R = global.TreeRanges;
const O = global.TreeOps;
const I = global.TreeI18N;

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch])); }
function escapeAttr(s) { return escapeHtml(s).replace(/'/g, "&#39;"); }

function ensurePaletteDropdownStyles() {
  if (document.getElementById('tree-palette-group-style')) return;
  const s = document.createElement('style');
  s.id = 'tree-palette-group-style';
  s.textContent = `
    .palette-select-dropdown .palette-group-label {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 12px 6px;
      font-size: 11px; font-weight: 700;
      letter-spacing: .08em;
      background: #f4f6fb;
      border-top: 1px solid #e6eaf2;
      position: sticky; top: 0; z-index: 1;
      user-select: none; pointer-events: none;
    }
    .palette-select-dropdown .palette-group-label:first-child { border-top: none; }
    .palette-select-dropdown .palette-group-label::before {
      content: ''; width: 8px; height: 8px; border-radius: 2px; background: #b7c0d0;
    }
    .palette-select-dropdown .palette-group-label[data-group="d3"]    { color: #3b5bdb; }
    .palette-select-dropdown .palette-group-label[data-group="d3"]::before    { background: #3b5bdb; }
    .palette-select-dropdown .palette-group-label[data-group="ggsci"] { color: #2f6f5e; }
    .palette-select-dropdown .palette-group-label[data-group="ggsci"]::before { background: #2f6f5e; }
    .palette-select-dropdown .palette-group-label[data-group="other"] { color: #7c3aed; }
    .palette-select-dropdown .palette-group-label[data-group="other"]::before { background: #7c3aed; }
    .palette-select-dropdown .palette-option[data-group="d3"]    .palette-name { color: #3b5bdb; }
    .palette-select-dropdown .palette-option[data-group="ggsci"] .palette-name { color: #2f6f5e; }
    .palette-select-dropdown .palette-option[data-group="other"] .palette-name { color: #7c3aed; }
    .btn-del-color {
      border: 0; background: none; color: #a33; cursor: pointer;
      font-size: 14px; line-height: 1; padding: 0 2px;
    }
    .btn-del-color:hover { color: #e00; }
  `;
  document.head.appendChild(s);
}

function renderGroupPaletteDropdown(container, opts) {
  opts = opts || {};
  if (!container || !global.TreePalette) return;
  ensurePaletteDropdownStyles();

  const groups = [
    { key: "d3", label: I.t('paletteGroupD3'),
      names: ["tableau10","category10","set1","set2","set3","paired","dark2","accent","pastel1","pastel2"] },
    { key: "ggsci", label: I.t('paletteGroupGgsci'),
      names: ["npg","aaas","nejm","lancet","jama","bmj","jco","locuszoom","uchicago","startrek","tron","futurama","rickandmorty","simpsons"] },
    { key: "other", label: I.t('paletteGroupOther'),
      names: ["okabeito","ibm","tolBright","tolVibrant","tolMuted","tolLight","tolHighContrast","tolMediumContrast","kelly","ggplotHue"] }
  ];

  const pal = global.TreePalette;
  let current = opts.selected || (global.TreeRanges && global.TreeRanges.ringPalette) || "tableau10";

  function swatchesHtml(name) {
    let cols = [];
    try { cols = pal.getCategoricalScheme(name) || []; } catch (_) { cols = []; }
    if (!cols.length) cols = ["#cccccc"];
    return `<div class="palette-swatches-mini">${cols.map(c => `<div style="background:${c}"></div>`).join('')}</div>`;
  }

  container.innerHTML = "";
  container.className = "palette-select-wrap";

  const trigger = document.createElement("div");
  trigger.className = "palette-select-trigger";
  trigger.innerHTML =
    `<span class="palette-name">${current}</span>` +
    `<span class="palette-preview-slot">${swatchesHtml(current)}</span>` +
    `<span class="caret">▼</span>`;

  const dropdown = document.createElement("div");
  dropdown.className = "palette-select-dropdown";

  groups.forEach(g => {
    const gl = document.createElement("div");
    gl.className = "palette-group-label";
    gl.dataset.group = g.key;
    gl.textContent = g.label;
    dropdown.appendChild(gl);
    g.names.forEach(name => {
      const opt = document.createElement("div");
      opt.className = "palette-option" + (name === current ? " active" : "");
      opt.dataset.value = name;
      opt.dataset.group = g.key;
      opt.innerHTML =
        `<span class="palette-name">${name}</span>` +
        swatchesHtml(name) +
        `<span class="palette-check">✓</span>`;
      opt.addEventListener("click", e => {
        e.stopPropagation();
        current = name;
        if (global.TreeRanges) global.TreeRanges.ringPalette = name;
        trigger.querySelector(".palette-name").textContent = name;
        trigger.querySelector(".palette-preview-slot").innerHTML = swatchesHtml(name);
        dropdown.querySelectorAll(".palette-option").forEach(o =>
          o.classList.toggle("active", o.dataset.value === name));
        if (opts.onSelect) opts.onSelect(name);
      });
      dropdown.appendChild(opt);
    });
  });

  trigger.addEventListener("click", e => {
    e.stopPropagation();
    document.querySelectorAll(".palette-select-wrap.open").forEach(el => {
      if (el !== container) el.classList.remove("open");
    });
    container.classList.toggle("open");
  });

  container.appendChild(trigger);
  container.appendChild(dropdown);

  if (!document.__paletteDropdownClickBound) {
    document.__paletteDropdownClickBound = true;
    document.addEventListener("click", () => {
      document.querySelectorAll(".palette-select-wrap.open").forEach(el => el.classList.remove("open"));
    });
  }
}


let drag = null, legendDrag = null, moveDrag = null, scaleDrag = null;
let moveLineEl = null, moveRingEl = null;
let suppressSvgClick = false;
function clientToSvg(svg, cx, cy) {
  const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy;
  const ctm = svg.getScreenCTM();
  return ctm ? pt.matrixTransform(ctm.inverse()) : { x: cx, y: cy };
}
function nodeSize(n) { return T.isLeaf(n) ? 4.5 : 3.8; }
function enableDrag(svg) {
  if (!svg || svg.dataset.dragBound === "1") return;
  svg.dataset.dragBound = "1";

  let legendRaf = null;
  let legendPending = null;

  svg.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    const st = C.state;
    const vb = C.getViewBox();

    const legendEl = e.target.closest && e.target.closest(".legend-box");
    if (legendEl) {
      const rect = svg.getBoundingClientRect();
      const trackId = legendEl.getAttribute("data-track-id");
      let initialX = 0, initialY = 0;
      if (trackId) {
        const t = global.TreeTracks && global.TreeTracks.tracks.find(x => x.id === Number(trackId));
        if (t) {
          initialX = t.legendX != null ? t.legendX : 0;
          initialY = t.legendY != null ? t.legendY : 0;
          if (t.legendX == null || t.legendY == null) {
            const tr = legendEl.getAttribute("transform") || "";
            const m = tr.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
            if (m) {
              initialX = parseFloat(m[1]);
              initialY = parseFloat(m[2]);
              t.legendX = initialX;
              t.legendY = initialY;
            }
          }
        }
      }
      let autoX = Number(st.legendX) || 760;
      let autoY = Number(st.legendY) || 60;
      const tr = legendEl.getAttribute("transform") || "";
      const m = tr.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
      if (m) {
        autoX = parseFloat(m[1]) - (st.legendOffsetX || 0);
        autoY = parseFloat(m[2]) - (st.legendOffsetY || 0);
      }
      legendDrag = {
        el: legendEl,
        trackId: trackId ? Number(trackId) : null,
        startX: e.clientX,
        startY: e.clientY,
        x0: trackId ? initialX : (autoX + (st.legendOffsetX || 0)),
        y0: trackId ? initialY : (autoY + (st.legendOffsetY || 0)),
        autoX: autoX,
        autoY: autoY,
        unitX: (vb.w / st.zoom) / Math.max(1, rect.width),
        unitY: (vb.h / st.zoom) / Math.max(1, rect.height),
        moved: false
      };
      e.preventDefault();
      e.stopPropagation();
      return;    }

    const scaleEl = e.target.closest && e.target.closest(".scale-box");
    if (scaleEl) {
      const rect = svg.getBoundingClientRect();
      scaleDrag = {
        el: scaleEl,
        startX: e.clientX,
        startY: e.clientY,
        ox0: Number(st.scaleBoxOffsetX) || 0,
        oy0: Number(st.scaleBoxOffsetY) || 0,
        unitX: (vb.w / st.zoom) / Math.max(1, rect.width),
        unitY: (vb.h / st.zoom) / Math.max(1, rect.height),
        moved: false
      };
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const rect = svg.getBoundingClientRect();
    drag = {
      startX: e.clientX,
      startY: e.clientY,
      panX: st.panX || 0,
      panY: st.panY || 0,
      unitX: (vb.w / st.zoom) / Math.max(1, rect.width),
      unitY: (vb.h / st.zoom) / Math.max(1, rect.height),
      snapped: false
    };
  });

  svg.addEventListener("pointermove", e => {
    const st = C.state;

    if (legendDrag) {
      const dx = (e.clientX - legendDrag.startX) * legendDrag.unitX;
      const dy = (e.clientY - legendDrag.startY) * legendDrag.unitY;
      if (!legendDrag.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
      if (!legendDrag.moved) {
        C.snapshot();
        legendDrag.moved = true;
        suppressSvgClick = true;
        try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      }
      legendPending = { dx, dy };
      if (!legendRaf) {
        legendRaf = requestAnimationFrame(() => {
          legendRaf = null;
          const p = legendPending;
          legendPending = null;
          if (!legendDrag || !p) return;
          const newX = legendDrag.x0 + p.dx;
          const newY = legendDrag.y0 + p.dy;
            if (legendDrag.trackId) {
              const t = global.TreeTracks && global.TreeTracks.tracks.find(x => x.id === legendDrag.trackId);
              if (t) { t.legendX = newX; t.legendY = newY; }
            } else {
              st.legendOffsetX = newX - (legendDrag.autoX || 0);
              st.legendOffsetY = newY - (legendDrag.autoY || 0);
            }
          if (legendDrag.el) {
            legendDrag.el.setAttribute("transform", `translate(${newX} ${newY})`);
          }
        });
      }
      return;
    }

    if (scaleDrag) {
      const dx = (e.clientX - scaleDrag.startX) * scaleDrag.unitX;
      const dy = (e.clientY - scaleDrag.startY) * scaleDrag.unitY;
      if (!scaleDrag.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
      if (!scaleDrag.moved) {
        C.snapshot();
        scaleDrag.moved = true;
        suppressSvgClick = true;
        try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      }
      st.scaleBoxOffsetX = scaleDrag.ox0 + dx;
      st.scaleBoxOffsetY = scaleDrag.oy0 + dy;
      global.TreeRenderer.draw();
      return;
    }


    if (moveDrag) {
      if (Math.abs(e.clientX - moveDrag.startX) + Math.abs(e.clientY - moveDrag.startY) < 3) return;
      if (!moveDrag.moved) {
        moveDrag.moved = true;
        suppressSvgClick = true;
        try { svg.setPointerCapture(e.pointerId); } catch (_) {}
        const src = T.nodeById(moveDrag.srcId);
        if (src) {
          moveRingEl = C.el("circle", {
            cx: src.x, cy: src.y, r: nodeSize(src) + 6,
            fill: "none", stroke: "#ff3b3b", "stroke-width": 2
          });
          moveLineEl = C.el("line", {
            x1: src.x, y1: src.y, x2: src.x, y2: src.y,
            stroke: "#2f6bd8", "stroke-width": 2, "stroke-dasharray": "5 4"
          });
        }
      }
      const loc = clientToSvg(svg, e.clientX, e.clientY);
      if (moveLineEl) {
        moveLineEl.setAttribute("x2", loc.x);
        moveLineEl.setAttribute("y2", loc.y);
      }
      return;
    }

    if (!drag) return;
    const dx = (e.clientX - drag.startX) * drag.unitX;
    const dy = (e.clientY - drag.startY) * drag.unitY;
    if (Math.abs(dx) + Math.abs(dy) < 2) return;
    if (!drag.snapped) {
      C.snapshot();
      drag.snapped = true;
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
    }
    suppressSvgClick = true;
    st.panX = drag.panX + dx;
    st.panY = drag.panY + dy;
    svg.classList.add("dragging");
    global.TreeRenderer.draw();
  });

const endDrag = e => {
  if (legendDrag) {
    if (legendRaf) { cancelAnimationFrame(legendRaf); legendRaf = null; }
    legendPending = null;
    try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
    const wasMoved = legendDrag.moved;
    legendDrag = null;
    setTimeout(() => {
      suppressSvgClick = false;
      if (wasMoved) global.TreeRenderer.draw();
    }, 0);
    return;
  }

    if (scaleDrag) {
      try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
      const wasMoved = scaleDrag.moved;
      scaleDrag = null;
      setTimeout(() => {
        suppressSvgClick = false;
        if (wasMoved) global.TreeRenderer.draw();
      }, 0);
      return;
    }

    if (moveDrag) {
      const moved = moveDrag.moved;
      const srcId = moveDrag.srcId;
      moveDrag = null;
      moveLineEl = null;
      moveRingEl = null;
      try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
      if (moved) {
        const tgtEl = document.elementFromPoint(e.clientX, e.clientY);
        const tn = tgtEl && tgtEl.closest ? tgtEl.closest("[data-id]") : null;
        const src = T.nodeById(srcId);
        const target = tn ? T.nodeById(tn.dataset.id) : null;
        C.snapshot();
        const statusEl = document.getElementById("status");
        if (src && target && O.moveNodeBeside(src, target)) {
          if (statusEl) statusEl.textContent = I.t('statusMoved', { src: T.labelOf(src), tgt: T.labelOf(target) });
        } else {
          if (statusEl) statusEl.textContent = I.t('statusMoveCancel');
        }
        global.TreeRenderer.draw();
      }
      setTimeout(() => suppressSvgClick = false, 0);
      return;
    }
    if (drag && e.pointerId !== undefined) { try { svg.releasePointerCapture(e.pointerId); } catch (_) {} }
    drag = null;
    svg.classList.remove("dragging");
    setTimeout(() => suppressSvgClick = false, 0);
  };

  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointercancel", endDrag);
}

function bindSvgClick(svg) {
  if (!svg || svg.dataset.clickBound === "1") return;
  svg.dataset.clickBound = "1";
  svg.addEventListener("click", e => {
    if (suppressSvgClick) return;
    const branchEl = e.target.closest && e.target.closest("[data-branch-id]");
    if (branchEl) {
      const bid = branchEl.getAttribute("data-branch-id");
      const bn = T.nodeById(bid);
      if (bn && bn.parent) {
        C.setSelectedId(null);
        C.setSelectedBranchId(bn.id);
        global.TreeRenderer.draw();
        const cx = e.clientX, cy = e.clientY;
        if (global.TreeApp && typeof global.TreeApp.showBranchActionPanel === "function") {
          setTimeout(() => global.TreeApp.showBranchActionPanel(bn.id, cx, cy), 0);
        }
        return;
      }
    }
    const target = e.target.closest && e.target.closest("[data-id]");
    if (!target) {
      const panel = document.getElementById("nodeActionPanel"); if (panel) panel.style.display = "none";
      const bpanel = document.getElementById("branchActionPanel"); if (bpanel) bpanel.style.display = "none";
      C.setSelectedId(null);
      C.setSelectedBranchId(null);
      global.TreeRenderer.draw();
      return;
    }
    let n = null;
    T.allWalk(C.getRoot(), x => { if (x.id === target.dataset.id) n = x; });
    if (!n) return;
    C.setSelectedBranchId(null);
    C.setSelectedId(n.id);
    global.TreeRenderer.draw();
    const cx = e.clientX, cy = e.clientY;
    if (global.TreeApp && typeof global.TreeApp.showNodeActionPanel === "function") {
      setTimeout(() => global.TreeApp.showNodeActionPanel(n.id, cx, cy), 0);
    }
  });

}
global.TreeDrag = { enableDrag, bindSvgClick, clientToSvg };

function renderBasicPanel(container) {
  if (!container) return;
  const st = C.state;
  const metaSet = new Set();
  if (C.getRoot()) {
    T.allWalk(C.getRoot(), n => (n.meta || []).forEach(f => { if (f && f.field) metaSet.add(f.field); }));
  }
  const metaFieldList = Array.from(metaSet).sort();

  container.innerHTML = `
    <div class="mode-tabs" style="margin-bottom:12px;">
      <label><input type="radio" name="treeModeSelect" value="rectangular" ${st.mode==='rectangular'?'checked':''}> ${I.t('panelModeRect')}</label>
      <label><input type="radio" name="treeModeSelect" value="circular" ${st.mode==='circular'?'checked':''}> ${I.t('panelModeCircular')}</label>
    </div>

    <div class="param-panel"><div class="param-panel-title">${I.t('panelCommon')}</div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('panelFontFamily')}</label>
          <select id="fontFamily">
            <option value="Times New Roman" ${st.fontFamily==='Times New Roman'?'selected':''}>Times New Roman</option>
            <option value="Arial" ${st.fontFamily==='Arial'?'selected':''}>Arial</option>
            <option value="Helvetica" ${st.fontFamily==='Helvetica'?'selected':''}>Helvetica</option>
            <option value="Georgia" ${st.fontFamily==='Georgia'?'selected':''}>Georgia</option>
            <option value="Microsoft YaHei" ${st.fontFamily==='Microsoft YaHei'?'selected':''}>${I.t('optMicrosoftYaHei')}</option>
          </select>
        </div>
      </div>

      <div class="param-grid cols-4" style="margin-top:8px;">
        <div class="param-item"><label>${I.t('panelBranchLength')}</label>
          <select id="ignoreLength">
            <option value="false" ${!st.ignoreLength?'selected':''}>${I.t('optUse')}</option>
            <option value="true" ${st.ignoreLength?'selected':''}>${I.t('optIgnore')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('panelBranchLenSource')}</label>
          <select id="branchLengthField">
            <option value="">${I.t('optDefaultLen')}</option>
            ${metaFieldList.map(f => `<option value="${escapeAttr(f)}" ${st.branchLengthField === f ? 'selected' : ''}>${escapeHtml(f)}</option>`).join('')}
          </select>
        </div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="forceMidpointRoot" ${st.forceMidpointRoot ? 'checked' : ''}> ${I.t('forceMidpointRoot')}</label></div>
        <div class="param-item"><label>${I.t('panelSort')}</label>
          <select id="sortModeSelect">
            <option value="none" ${st.sortMode==='none'?'selected':''}>${I.t('optSortNone')}</option>
            <option value="ascending" ${st.sortMode==='ascending'?'selected':''}>${I.t('optSortAsc')}</option>
            <option value="descending" ${st.sortMode==='descending'?'selected':''}>${I.t('optSortDesc')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('panelLeafReverse')}</label>
          <select id="leafReverseSelect">
            <option value="false" ${!st.leafReverse?'selected':''}>${I.t('optReverseKeep')}</option>
            <option value="true" ${st.leafReverse?'selected':''}>${I.t('optReverseReverse')}</option>
          </select>
        </div>
      </div>

      <div class="param-grid cols-4" style="margin-top:8px;">
        <div class="param-item"><label>${I.t('panelLabelsShow')}</label>
          <select id="labelsSelect">
            <option value="true" ${st.labels?'selected':''}>${I.t('optDisplay')}</option>
            <option value="false" ${!st.labels?'selected':''}>${I.t('optHide')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('panelLabelPos')}</label>
          <select id="labelPositionSelect">
            <option value="aligned" ${st.labelPosition==='aligned'?'selected':''}>${I.t('optAligned')}</option>
            <option value="tips" ${st.labelPosition==='tips'?'selected':''}>${I.t('optAtTips')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('leafLabelOffsetX')}</label>
          <input id="leafLabelOffsetX" type="number" value="${st.leafLabelOffsetX != null ? st.leafLabelOffsetX : 8}" step="1"></div>
        <div class="param-item"><label>${I.t('leafLabelOffsetCirc')}</label>
          <input id="leafLabelOffsetCirc" type="number" value="${st.leafLabelOffsetCirc != null ? st.leafLabelOffsetCirc : 8}" step="1"></div>
        <div class="param-item"><label>${I.t('panelLabelFontSize')}</label><input id="fontSize" type="number" value="${st.fontSize}" min="6" max="90"></div>
        <div class="param-item"><label>${I.t('panelLabelColor')}</label><input id="labelColor" type="color" value="${st.labelColor}"></div>
        <div class="param-item"><label class="mini-check"><input id="boldChk" type="checkbox" ${st.bold?'checked':''}> ${I.t('panelLabelBold')}</label></div>
        <div class="param-item"><label class="mini-check"><input id="italicChk" type="checkbox" ${st.italic?'checked':''}> ${I.t('panelLabelItalic')}</label></div>
      </div>

      <div class="param-grid cols-4" style="margin-top:8px;">
        <div class="param-item"><label>${I.t('panelBranchWidth')}</label><input id="branchWidth" type="number" value="${st.branchWidth}" min=".2" max="12" step=".1"></div>
        <div class="param-item"><label>${I.t('panelBranchColor')}</label><input id="branchColor" type="color" value="${st.branchColor}"></div>
        <div class="param-item"><label>${I.t('panelExtendBranches')}</label>
          <select id="extendBranchesSelect">
            <option value="true" ${st.extendBranches?'selected':''}>${I.t('optOn')}</option>
            <option value="false" ${!st.extendBranches?'selected':''}>${I.t('optOff')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('panelDashed')}</label>
          <select id="dashedSelect">
            <option value="false" ${!st.dashed?'selected':''}>${I.t('optOff')}</option>
            <option value="true" ${st.dashed?'selected':''}>${I.t('optOn')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('panelDashSize')}</label><input id="dashSize" type="number" value="${st.dashSize}" min="0" max="16" step=".1"></div>
      </div>

      <div class="param-grid cols-4" style="margin-top:8px;">
        <div class="param-item"><label>${I.t('panelScaleH')}</label><input id="scaleH" type="number" value="${st.scaleH}" min="0.3" max="4" step="0.1"></div>
        <div class="param-item"><label>${I.t('panelScaleV')}</label><input id="scaleV" type="number" value="${st.scaleV}" min="0.3" max="4" step="0.1"></div>
      </div>
    </div>

    <div class="param-panel" id="nodeSymbolsPanel"><div class="param-panel-title">${I.t('panelNodeSymbols')}</div>
      <div class="sub-section-title"><strong>${I.t('panelLeafSymbols')}</strong></div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('panelShow')}</label>
          <select id="leafSymbolsSelect"><option value="false" ${st.leafSymbols?'':'selected'}>${I.t('optHidden')}</option><option value="true" ${st.leafSymbols?'selected':''}>${I.t('optShown')}</option></select>
        </div>
        <div class="param-item"><label>${I.t('panelShape')}</label>
          <select id="leafSymShape">
            <option value="square" ${st.leafSymShape==='square'?'selected':''}>${I.t('optSquareZh')}</option>
            <option value="circle" ${st.leafSymShape==='circle'?'selected':''}>${I.t('optCircleZh')}</option>
            <option value="star" ${st.leafSymShape==='star'?'selected':''}>${I.t('optStarZh')}</option>
            <option value="triangle-left" ${st.leafSymShape==='triangle-left'?'selected':''}>${I.t('optTriangleLeft')}</option>
            <option value="triangle-right" ${st.leafSymShape==='triangle-right'?'selected':''}>${I.t('optTriangleRight')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('panelSize')}</label><input id="leafSymSize" type="number" value="${st.leafSymSize}" min="1" max="20" step="1"></div>
        <div class="param-item"><label>${I.t('panelFill')}</label><input id="leafSymFill" type="color" value="${st.leafSymFill}"></div>
        <div class="param-item"><label>${I.t('panelBorderColor')}</label><input id="leafSymBC" type="color" value="${st.leafSymBC}"></div>
        <div class="param-item"><label>${I.t('panelBorderWidth')}</label><input id="leafSymBW" type="number" value="${st.leafSymBW}" min="0" max="6" step=".5"></div>
      </div>
      <div class="sub-section-title" style="margin-top:8px;"><strong>${I.t('panelIntSymbols')}</strong></div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('panelShow')}</label>
          <select id="internalSymbolsSelect"><option value="false" ${st.internalSymbols?'':'selected'}>${I.t('optHidden')}</option><option value="true" ${st.internalSymbols?'selected':''}>${I.t('optShown')}</option></select>
        </div>
        <div class="param-item"><label>${I.t('panelShape')}</label>
          <select id="intSymShape">
            <option value="square" ${st.intSymShape==='square'?'selected':''}>${I.t('optSquareZh')}</option>
            <option value="circle" ${st.intSymShape==='circle'?'selected':''}>${I.t('optCircleZh')}</option>
            <option value="star" ${st.intSymShape==='star'?'selected':''}>${I.t('optStarZh')}</option>
            <option value="triangle-left" ${st.intSymShape==='triangle-left'?'selected':''}>${I.t('optTriangleLeft')}</option>
            <option value="triangle-right" ${st.intSymShape==='triangle-right'?'selected':''}>${I.t('optTriangleRight')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('panelSize')}</label><input id="intSymSize" type="number" value="${st.intSymSize}" min="1" max="20" step="1"></div>
        <div class="param-item"><label>${I.t('panelFill')}</label><input id="intSymFill" type="color" value="${st.intSymFill}"></div>
        <div class="param-item"><label>${I.t('panelBorderColor')}</label><input id="intSymBC" type="color" value="${st.intSymBC}"></div>
        <div class="param-item"><label>${I.t('panelBorderWidth')}</label><input id="intSymBW" type="number" value="${st.intSymBW}" min="0" max="6" step=".5"></div>
      </div>
    </div>

    <div class="param-panel" id="specificSettingsPanel"><div class="param-panel-title">${I.t('panelSpecific')}</div>
      <div id="specificPanelInner"></div>
    </div>

    <div class="param-panel" id="ticksPanel"><div class="param-panel-title">${I.t('panelTicks')}</div>
      <div class="sub-section-title"><strong>${I.t('panelAxis')}</strong></div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('axisShow')}</label>
          <select id="axisShowSelect">
            <option value="true" ${st.axisShow?'selected':''}>${I.t('optOn')}</option>
            <option value="false" ${!st.axisShow?'selected':''}>${I.t('optOff')}</option>
          </select>
        </div>
        <div class="param-item" id="axisPosItem">
          <label>${I.t('axisPosition')}</label>
          <select id="axisPosSelect">
            <option value="top" ${st.axisPos==='top'?'selected':''}>${I.t('axisPosTop')}</option>
            <option value="bottom" ${st.axisPos==='bottom'?'selected':''}>${I.t('axisPosBottom')}</option>
          </select>
        </div>
        <div class="param-item" id="axisRotItem" style="display:none;">
          <label>${I.t('axisRotation')}</label>
          <input id="axisRotationInput" type="number" value="${st.axisRotation}" min="-360" max="360" step="1">
        </div>
        <div class="param-item">
          <label class="mini-check"><input id="axisReverseChk" type="checkbox" ${st.axisReverse?'checked':''}> ${I.t('axisReverse')}</label>
        </div>
      </div>

      <div class="sub-section-title" style="margin-top:8px;"><strong>${I.t('tickLabelStyle')}</strong></div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('tickLabelFontSize')}</label>
          <input id="tickLabelFontSize" type="number" value="${st.tickLabelFontSize || 20}" min="6" max="40">
        </div>
        <div class="param-item"><label class="mini-check"><input id="tickLabelBold" type="checkbox" ${st.tickLabelBold?'checked':''}> ${I.t('tickLabelBold')}</label></div>
        <div class="param-item"><label class="mini-check"><input id="tickLabelItalic" type="checkbox" ${st.tickLabelItalic?'checked':''}> ${I.t('tickLabelItalic')}</label></div>
      </div>

      <div class="sub-section-title" style="margin-top:8px;"><strong>${I.t('panelPrimaryAxis')}</strong></div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('tickInterval')}</label>
          <input id="tickPrimaryInterval" type="number" value="${st.tickPrimary.interval}" min="0" step="0.01">
        </div>
        <div class="param-item"><label>${I.t('tickShowLabels')}</label>
          <select id="tickPrimaryShowLabels">
            <option value="true" ${st.tickPrimary.showLabels?'selected':''}>${I.t('optOn')}</option>
            <option value="false" ${!st.tickPrimary.showLabels?'selected':''}>${I.t('optOff')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('tickShowGrid')}</label>
          <select id="tickPrimaryShowGrid">
            <option value="true" ${st.tickPrimary.showGrid?'selected':''}>${I.t('optOn')}</option>
            <option value="false" ${!st.tickPrimary.showGrid?'selected':''}>${I.t('optOff')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('tickGridDashed')}</label>
          <select id="tickPrimaryGridDashed">
            <option value="true" ${st.tickPrimary.gridDashed?'selected':''}>${I.t('optOn')}</option>
            <option value="false" ${!st.tickPrimary.gridDashed?'selected':''}>${I.t('optOff')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('tickGridWidth')}</label>
          <input id="tickPrimaryGridWidth" type="number" value="${st.tickPrimary.gridWidth}" min="0.5" max="4" step="0.5">
        </div>
        <div class="param-item"><label>${I.t('tickGridColor')}</label>
          <input id="tickPrimaryGridColor" type="color" value="${st.tickPrimary.gridColor || '#dddddd'}">
        </div>
      </div>

      <div class="sub-section-title" style="margin-top:8px;"><strong>${I.t('tickCustom')}</strong></div>
      <div class="param-grid cols-4">
        <div class="param-item" style="grid-column: span 2;">
          <label>${I.t('tickCustom')}（${I.t('tickCustomHint')}）</label>
          <input id="tickPrimaryCustom" type="text" value="${(st.tickPrimary.customTicks||[]).join(',')}" placeholder="0.1, 0.5, 1">
        </div>
        <div class="param-item"><label>${I.t('tickCustomColor')}</label>
          <input id="customTickColor" type="color" value="${st.customTickColor || '#c0392b'}">
        </div>
        <div class="param-item"><label class="mini-check"><input id="customTickBold" type="checkbox" ${st.customTickBold?'checked':''}> ${I.t('tickCustomBold')}</label></div>
      </div>

      <div class="sub-section-title" style="margin-top:8px;"><strong>${I.t('panelSecondaryAxis')}</strong></div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('tickInterval')}</label>
          <input id="tickSecondaryInterval" type="number" value="${st.tickSecondary.interval}" min="0" step="1">
        </div>
        <div class="param-item"><label>${I.t('tickShowLabels')}</label>
          <select id="tickSecondaryShowLabels">
            <option value="true" ${st.tickSecondary.showLabels?'selected':''}>${I.t('optOn')}</option>
            <option value="false" ${!st.tickSecondary.showLabels?'selected':''}>${I.t('optOff')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('tickShowGrid')}</label>
          <select id="tickSecondaryShowGrid">
            <option value="true" ${st.tickSecondary.showGrid?'selected':''}>${I.t('optOn')}</option>
            <option value="false" ${!st.tickSecondary.showGrid?'selected':''}>${I.t('optOff')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('tickGridDashed')}</label>
          <select id="tickSecondaryGridDashed">
            <option value="true" ${st.tickSecondary.gridDashed?'selected':''}>${I.t('optOn')}</option>
            <option value="false" ${!st.tickSecondary.gridDashed?'selected':''}>${I.t('optOff')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('tickGridWidth')}</label>
          <input id="tickSecondaryGridWidth" type="number" value="${st.tickSecondary.gridWidth}" min="0.5" max="4" step="0.5">
        </div>
        <div class="param-item"><label>${I.t('tickGridColor')}</label>
          <input id="tickSecondaryGridColor" type="color" value="${st.tickSecondary.gridColor || '#dddddd'}">
        </div>
      </div>
    </div>

<div class="param-panel" id="scaleBoxPanel"><div class="param-panel-title">${I.t('panelScaleBox')}</div>
  <div class="param-grid cols-4">
    <div class="param-item"><label class="mini-check"><input id="showScaleBoxChk" type="checkbox" ${st.showScaleBox !== false ? 'checked' : ''}> ${I.t('scaleBoxShow')}</label></div>
    <div class="param-item"><label>${I.t('scaleBoxSize')}</label><input id="scaleBoxSizeInput" type="number" value="${st.scaleBoxSize || 0}" min="0" step="0.01"></div>
    <div class="param-item"><label>${I.t('scaleBoxTitle')}</label><input id="scaleBoxTitleInput" type="text" value="${escapeAttr(st.scaleBoxTitle || 'Scale')}"></div>
  </div>
</div>

    <div class="param-panel"><div class="param-panel-title">${I.t('panelTimeTree')}</div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('rootTickValue')}</label>
          <input id="rootTickValueInput" type="number" value="${st.rootTickValue != null ? st.rootTickValue : 0}" step="0.01"></div>
        <div class="param-item"><label>${I.t('timeScaleFactor')}</label>
          <input id="timeScaleFactorInput" type="number" value="${st.timeScaleFactor}" min="0.000001" step="0.001"></div>
      </div>
      <div class="info-box" style="margin-top:6px;">${I.t('timeTreeHint')}</div>
    </div>
  `;

  const ticksPanel = container.querySelector('#ticksPanel');
  const specPanel = container.querySelector('#specificSettingsPanel');
  if (ticksPanel && specPanel && ticksPanel.parentNode) {
    ticksPanel.parentNode.insertBefore(specPanel, ticksPanel);
  }

  function renderSpecific() {
    const inner = container.querySelector('#specificPanelInner');
    if (!inner) return;
    const m = C.state.mode || 'rectangular';
    if (m === 'circular') {
      inner.innerHTML = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('panelRotation')}</label>
            <input id="rotation" type="number" value="${C.state.rotation}" min="-360" max="360" step="1"></div>
          <div class="param-item"><label>${I.t('panelArc')}</label>
            <input id="arc" type="number" value="${C.state.arc}" min="1" max="360" step="1"></div>
          <div class="param-item"><label>${I.t('panelLabelAnchorCirc')}</label>
            <select id="labelAnchorCircSelect">
              <option value="auto" ${(C.state.labelAnchorCirc||'auto')==='auto'?'selected':''}>${I.t('optAuto')}</option>
              <option value="left" ${C.state.labelAnchorCirc==='left'?'selected':''}>${I.t('optLeft')}</option>
              <option value="right" ${C.state.labelAnchorCirc==='right'?'selected':''}>${I.t('optRight')}</option>
            </select></div>
          <div class="param-item"><label>${I.t('panelLabelOffset')}</label>
            <input id="labelShift" type="number" value="${C.state.labelShift}" min="-160" max="260" step="1"></div>
        </div>
        <div class="info-box" style="margin-top:6px;">${I.t('panelArcHint')}</div>
      `;
      inner.querySelector('#rotation')?.addEventListener('input', e => { C.snapshot(); C.state.rotation = Number(e.target.value); global.TreeRenderer.draw(); });
      inner.querySelector('#arc')?.addEventListener('input', e => { C.snapshot(); C.state.arc = Math.max(1, Math.min(360, Number(e.target.value))); global.TreeRenderer.draw(); });
      inner.querySelector('#labelAnchorCircSelect')?.addEventListener('change', e => { C.snapshot(); C.state.labelAnchorCirc = e.target.value; global.TreeRenderer.draw(); });
      inner.querySelector('#labelShift')?.addEventListener('input', e => { C.snapshot(); C.state.labelShift = Number(e.target.value); global.TreeRenderer.draw(); });
    } else {
      const showAlign = C.state.labelPosition === "aligned";
      inner.innerHTML = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('panelInvert')}</label>
            <select id="invertSelect">
              <option value="false" ${!C.state.invert?'selected':''}>${I.t('optNo')}</option>
              <option value="true" ${C.state.invert?'selected':''}>${I.t('optYes')}</option>
            </select></div>
          <div class="param-item"><label>${I.t('panelLineShape')}</label>
            <select id="lineShapeSelect">
              <option value="straight" ${C.state.lineShape==='straight'?'selected':''}>${I.t('optLineStraight')}</option>
              <option value="slanted" ${C.state.lineShape==='slanted'?'selected':''}>${I.t('optLineSlanted')}</option>
              <option value="curved" ${C.state.lineShape==='curved'?'selected':''}>${I.t('optLineCurved')}</option>
            </select></div>
          <div class="param-item align-item" style="${showAlign?'':'display:none;'}">
            <label>${I.t('panelLabelAnchorRect')}</label>
            <select id="labelAnchorRectSelect">
              <option value="left" ${(C.state.labelAnchorRect||'left')==='left'?'selected':''}>${I.t('optLeft')}</option>
              <option value="right" ${C.state.labelAnchorRect==='right'?'selected':''}>${I.t('optRight')}</option>
            </select></div>
          <div class="param-item"><label>${I.t('panelLabelOffset')}</label>
            <input id="labelShiftRect" type="number" value="${C.state.labelShift}" min="-260" max="260" step="1"></div>
        </div>
      `;
      inner.querySelector('#invertSelect')?.addEventListener('change', e => { C.snapshot(); C.state.invert = e.target.value === 'true'; global.TreeRenderer.draw(); });
      inner.querySelector('#lineShapeSelect')?.addEventListener('change', e => { C.snapshot(); C.state.lineShape = e.target.value; global.TreeRenderer.draw(); });
      inner.querySelector('#labelAnchorRectSelect')?.addEventListener('change', e => { C.snapshot(); C.state.labelAnchorRect = e.target.value; global.TreeRenderer.draw(); });
      inner.querySelector('#labelShiftRect')?.addEventListener('input', e => { C.snapshot(); C.state.labelShift = Number(e.target.value); global.TreeRenderer.draw(); });
    }
  }
  renderSpecific();

  container.querySelectorAll('input[name="treeModeSelect"]').forEach(r => {
    r.addEventListener('change', e => {
      C.snapshot();
      C.state.mode = e.target.value;
      C.state.zoom = 1;
      C.state.panX = 0;
      C.state.panY = 0;
      const isCirc = C.state.mode === 'circular';
      const posItem = container.querySelector('#axisPosItem');
      const rotItem = container.querySelector('#axisRotItem');
      if (posItem) posItem.style.display = isCirc ? 'none' : '';
      if (rotItem) rotItem.style.display = isCirc ? '' : 'none';
      renderSpecific();
      global.TreeRenderer.draw();
      if (global.TreeApp && typeof global.TreeApp.drawTree === "function") global.TreeApp.drawTree();
    });
  });
  const isCirc = C.state.mode === 'circular';
  const posItem = container.querySelector('#axisPosItem');
  const rotItem = container.querySelector('#axisRotItem');
  if (posItem) posItem.style.display = isCirc ? 'none' : '';
  if (rotItem) rotItem.style.display = isCirc ? '' : 'none';

  const posSel = container.querySelector('#labelPositionSelect');
  if (posSel) {
    posSel.addEventListener('change', (e) => {
      const item = container.querySelector('#specificPanelInner .align-item');
      if (item) item.style.display = e.target.value === 'aligned' ? '' : 'none';
    });
  }
}

function renderAdvancedPanel(container) {
  if (!container) return;
  const st = C.state;

  const metaFields = [];
  if (C.getRoot()) {
    T.allWalk(C.getRoot(), n => (n.meta || []).forEach(f => {
      if (f && f.field && !metaFields.includes(f.field)) metaFields.push(f.field);
    }));
  }
  metaFields.sort();
  const nodeDataColumns = ["support", "length", "cumLength", "uid", "label", ...metaFields];
  const rangeFields = metaFields;

  function renderNodeLabelItem(item, index) {
    const isText = item.mode === "text";
    const opts = nodeDataColumns.map(c => `<option value="${escapeAttr(c)}" ${item.column === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
    return `
      <div class="node-label-item" data-nlid="${item.id}">
        <div class="nli-head">
          <span>${I.t('nodeLabelItemTitle')} #${index + 1}</span>
          <button class="nli-remove" data-remove="${item.id}" type="button">×</button>
        </div>
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('nodeLabelDataColumn')}</label>
            <select data-prop="column" data-nlid="${item.id}">
              <option value="">${I.t('trackUntitled')}</option>${opts}
            </select>
          </div>
          <div class="param-item"><label>${I.t('nodeLabelMode')}</label>
            <select data-prop="mode" data-nlid="${item.id}">
              <option value="text" ${isText ? 'selected' : ''}>${I.t('nodeLabelModeText')}</option>
              <option value="symbol" ${!isText ? 'selected' : ''}>${I.t('nodeLabelModeSymbol')}</option>
            </select>
          </div>
          <div class="param-item"><label>${I.t('nodeLabelThresholdLogic')}</label>
            <select data-prop="thresholdLogic" data-nlid="${item.id}">
              <option value="" ${!item.thresholdLogic ? 'selected' : ''}>${I.t('optThresholdNone')}</option>
              <option value="gt" ${item.thresholdLogic === 'gt' ? 'selected' : ''}>${I.t('optThresholdGt')}</option>
              <option value="gte" ${item.thresholdLogic === 'gte' ? 'selected' : ''}>${I.t('optThresholdGte')}</option>
              <option value="lt" ${item.thresholdLogic === 'lt' ? 'selected' : ''}>${I.t('optThresholdLt')}</option>
              <option value="lte" ${item.thresholdLogic === 'lte' ? 'selected' : ''}>${I.t('optThresholdLte')}</option>
            </select>
          </div>
          <div class="param-item"><label>${I.t('nodeLabelThresholdValue')}</label>
            <input type="number" data-prop="threshold" data-nlid="${item.id}" value="${item.threshold != null ? item.threshold : ''}" step="any" ${item.thresholdLogic ? '' : 'disabled'}>
          </div>
          ${isText ? `
            <div class="param-item"><label>${I.t('nodeLabelDecimals')}</label>
              <input type="number" data-prop="decimals" data-nlid="${item.id}" value="${item.decimals != null ? item.decimals : 2}" min="0" max="6">
            </div>
            <div class="param-item"><label class="mini-check">
              <input type="checkbox" data-prop="asPercent" data-nlid="${item.id}" ${item.asPercent ? 'checked' : ''}> ${I.t('nodeLabelAsPercent')}
            </label></div>
          ` : `
            <div class="param-item"><label>${I.t('nodeLabelShape')}</label>
              <select data-prop="shape" data-nlid="${item.id}">
                <option value="circle" ${item.shape === 'circle' ? 'selected' : ''}>${I.t('optShapeCircle')}</option>
                <option value="triangle" ${item.shape === 'triangle' ? 'selected' : ''}>${I.t('optShapeTriangle')}</option>
                <option value="square" ${item.shape === 'square' ? 'selected' : ''}>${I.t('optShapeSquare')}</option>
                <option value="star" ${item.shape === 'star' ? 'selected' : ''}>${I.t('optShapeStar')}</option>
              </select>
            </div>
            <div class="param-item"><label>${I.t('nodeLabelStrokeColor')}</label>
              <input type="color" data-prop="strokeColor" data-nlid="${item.id}" value="${item.strokeColor || '#000000'}"></div>
            <div class="param-item"><label>${I.t('nodeLabelStrokeWidth')}</label>
              <input type="number" data-prop="strokeWidth" data-nlid="${item.id}" value="${item.strokeWidth || 0}" min="0" max="6" step="0.5"></div>
            <div class="param-item"><label>${I.t('nodeLabelFillColor')}</label>
              <input type="color" data-prop="fillColor" data-nlid="${item.id}" value="${item.fillColor || '#E64B35'}"></div>
            <div class="param-item"><label>${I.t('nodeLabelMaxSize')}</label>
              <input type="number" data-prop="maxSize" data-nlid="${item.id}" value="${item.maxSize || 10}" min="1" max="30"></div>
            <div class="param-item"><label>${I.t('nodeLabelMinSize')}</label>
              <input type="number" data-prop="minSize" data-nlid="${item.id}" value="${item.minSize || 2}" min="1" max="30"></div>
          `}
        </div>
      </div>`;
  }
  function renderNodeLabelList() {
    const list = container.querySelector('#nodeLabelList');
    if (!list) return;
    if (!st.nodeLabels.length) { list.innerHTML = ''; return; }
    list.innerHTML = st.nodeLabels.map(renderNodeLabelItem).join('');
    list.querySelectorAll('[data-prop]').forEach(el => {
      el.addEventListener('input', e => {
        const id = Number(el.dataset.nlid);
        const prop = el.dataset.prop;
        const item = C.state.nodeLabels.find(it => it.id === id);
        if (!item) return;
        C.snapshot();
        if (el.type === 'checkbox') item[prop] = el.checked;
        else if (el.type === 'number') item[prop] = el.value === '' ? null : Number(el.value);
        else item[prop] = el.value;
        if (prop === 'mode') renderNodeLabelList();
        if (prop === 'thresholdLogic') {
          const numInput = list.querySelector(`input[data-prop="threshold"][data-nlid="${id}"]`);
          if (numInput) numInput.disabled = !el.value;
        }
        global.TreeRenderer.draw();
      });
    });
    list.querySelectorAll('.nli-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.remove);
        C.snapshot();
        C.state.nodeLabels = C.state.nodeLabels.filter(it => it.id !== id);
        renderNodeLabelList();
        global.TreeRenderer.draw();
      });
    });
  }

  container.innerHTML = `
    <div class="param-panel"><div class="param-panel-title">${I.t('panelLengthLabel')}</div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('lengthLabelShow')}</label>
          <select id="lenLabelShow">
            <option value="false" ${st.lengthLabel.show ? '' : 'selected'}>${I.t('optHidden')}</option>
            <option value="true"  ${st.lengthLabel.show ? 'selected' : ''}>${I.t('optShown')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('lengthLabelFontSize')}</label>
          <input id="lenLabelFontSize" type="number" value="${st.lengthLabel.fontSize}" min="6" max="40"></div>
        <div class="param-item"><label class="mini-check">
          <input id="lenLabelBold" type="checkbox" ${st.lengthLabel.bold ? 'checked' : ''}> ${I.t('lengthLabelBold')}
        </label></div>
        <div class="param-item"><label class="mini-check">
          <input id="lenLabelItalic" type="checkbox" ${st.lengthLabel.italic ? 'checked' : ''}> ${I.t('lengthLabelItalic')}
        </label></div>
        <div class="param-item"><label>${I.t('lengthLabelDecimals')}</label>
          <input id="lenLabelDecimals" type="number" value="${st.lengthLabel.decimals}" min="0" max="6"></div>
        <div class="param-item"><label>${I.t('lengthLabelOffsetY')}</label>
          <input id="lenLabelOffsetY" type="number" value="${st.lengthLabel.offsetY}" step="1"></div>
        <div class="param-item"><label class="mini-check">
          <input id="lenLabelBgShow" type="checkbox" ${st.lengthLabel.bgShow ? 'checked' : ''}> ${I.t('lengthLabelBgShow')}
        </label></div>
        <div class="param-item"><label>${I.t('lengthLabelBgBorderColor')}</label>
          <input id="lenLabelBgBorderColor" type="color" value="${st.lengthLabel.bgBorderColor}"></div>
        <div class="param-item"><label>${I.t('lengthLabelBgBorderWidth')}</label>
          <input id="lenLabelBgBorderWidth" type="number" value="${st.lengthLabel.bgBorderWidth}" min="0" max="6" step="0.5"></div>
        <div class="param-item"><label>${I.t('lengthLabelBgFill')}</label>
          <input id="lenLabelBgFill" type="color" value="${st.lengthLabel.bgFill}"></div>
        <div class="param-item"><label class="mini-check">
          <input id="lenLabelAsTime" type="checkbox" ${st.lengthLabel.asTime ? 'checked' : ''}> ${I.t('lengthLabelAsTime')}
        </label></div>
        <div class="param-item"><label>${I.t('lengthLabelTimeRootAge')}</label>
          <input id="lenLabelTimeRootAge" type="number" value="${st.lengthLabel.timeRootAge != null ? st.lengthLabel.timeRootAge : 0}" step="0.01"></div>
        <div class="param-item"><label>${I.t('lengthLabelTimeFactor')}</label>
          <input id="lenLabelTimeFactor" type="number" value="${st.lengthLabel.timeFactor}" step="0.001"></div>
        <div class="param-item"><label>${I.t('lengthLabelCiField')}</label>
          <select id="lenLabelCiField">
            <option value="">${I.t('optThresholdNone')}</option>
            ${metaFields.map(f => `<option value="${escapeAttr(f)}" ${st.lengthLabel.ciField === f ? 'selected' : ''}>${escapeHtml(f)}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <div class="param-panel"><div class="param-panel-title">${I.t('panelNodeLabelDisplay')}</div>
      <div class="sub-section-title"><strong>${I.t('nodeLabelCommon')}</strong></div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('nodeLabelFontSize')}</label>
          <input id="nodeLabelFontSize" type="number" value="${st.nodeLabelCommon.fontSize}" min="6" max="40"></div>
        <div class="param-item"><label class="mini-check">
          <input id="nodeLabelBold" type="checkbox" ${st.nodeLabelCommon.bold ? 'checked' : ''}> ${I.t('nodeLabelBold')}
        </label></div>
        <div class="param-item"><label class="mini-check">
          <input id="nodeLabelItalic" type="checkbox" ${st.nodeLabelCommon.italic ? 'checked' : ''}> ${I.t('nodeLabelItalic')}
        </label></div>
        <div class="param-item"><label>${I.t('nodeLabelOffsetX')}</label>
          <input id="nodeLabelOffsetX" type="number" value="${st.nodeLabelCommon.offsetX}" step="1"></div>
        <div class="param-item"><label>${I.t('nodeLabelOffsetY')}</label>
          <input id="nodeLabelOffsetY" type="number" value="${st.nodeLabelCommon.offsetY}" step="1"></div>

<div class="param-item"><label>${I.t('nodeLabelOffsetTangent')}</label>
  <input id="nodeLabelOffsetTangent" type="number" value="${st.nodeLabelCommon.offsetTangent || 0}" step="1"></div>
<div class="param-item"><label>${I.t('nodeLabelOffsetRadial')}</label>
  <input id="nodeLabelOffsetRadial" type="number" value="${st.nodeLabelCommon.offsetRadial || 0}" step="1"></div>

        <div class="param-item"><label class="mini-check">
          <input id="nodeLabelMergeText" type="checkbox" ${st.nodeLabelCommon.mergeText !== false ? 'checked' : ''}> ${I.t('nodeLabelMergeText')}
        </label></div>
        <div class="param-item"><label>${I.t('nodeLabelFillColorAs')}</label>
          <select id="nodeLabelFillColorAs">
            <option value="text" ${st.nodeLabelCommon.fillColorAs !== 'background' ? 'selected' : ''}>${I.t('nodeLabelFillAsText')}</option>
            <option value="background" ${st.nodeLabelCommon.fillColorAs === 'background' ? 'selected' : ''}>${I.t('nodeLabelFillAsBackground')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('nodeLabelBgFillLabel')}</label>
          <input id="nodeLabelBgFill" type="color" value="${st.nodeLabelCommon.bgFill || '#eeeeee'}"></div>
        <div class="param-item"><label>${I.t('nodeLabelBgBorderColorLabel')}</label>
          <input id="nodeLabelBgBorderColor" type="color" value="${st.nodeLabelCommon.bgBorderColor || '#cccccc'}"></div>
        <div class="param-item"><label>${I.t('nodeLabelBgBorderWidthLabel')}</label>
          <input id="nodeLabelBgBorderWidth" type="number" value="${st.nodeLabelCommon.bgBorderWidth || 0}" min="0" max="6" step="0.5"></div>
        <div class="param-item"><label>${I.t('nodeLabelTextColorOnBg')}</label>
          <input id="nodeLabelTextColorOnBg" type="color" value="${st.nodeLabelCommon.textColorOnBg || '#222222'}"></div>
        <div class="param-item"><label>${I.t('nodeLabelSeparator')}</label>
          <input id="nodeLabelSeparator" type="text" value="${escapeAttr(st.nodeLabelCommon.separator)}" style="white-space:pre;font-family:monospace"></div>
        <div class="param-item"><label class="mini-check">
          <input id="nodeLabelHideOnLeaves" type="checkbox" ${st.nodeLabelCommon.hideOnLeaves ? 'checked' : ''}> ${I.t('nodeLabelHideOnLeaves')}
        </label></div>
      </div>
      <div id="nodeLabelList" style="margin-top:10px;"></div>
      <div class="btn-group" style="margin-top:10px;">
        <button class="btn" id="addNodeLabelBtn" type="button">${I.t('nodeLabelAdd')}</button>
      </div>
    </div>

    <div class="param-panel"><div class="param-panel-title">${I.t('panelRangeLabelDisplay')}</div>
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('rangeLabelShow')}</label>
          <select id="rangeLabelShow">
            <option value="false" ${st.rangeLabelConfig.show ? '' : 'selected'}>${I.t('optHidden')}</option>
            <option value="true"  ${st.rangeLabelConfig.show ? 'selected' : ''}>${I.t('optShown')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('rangeLabelField')}</label>
          <select id="rangeLabelField">
            <option value="">${I.t('optThresholdNone')}</option>
            ${rangeFields.map(f => `<option value="${escapeAttr(f)}" ${st.rangeLabelConfig.field === f ? 'selected' : ''}>${escapeHtml(f)}</option>`).join('')}
          </select>
        </div>
        <div class="param-item"><label>${I.t('rangeLabelLineHeight')}</label>
          <input id="rangeLabelLineHeight" type="number" value="${st.rangeLabelConfig.lineHeight}" min="1" max="40"></div>
        <div class="param-item"><label>${I.t('rangeLabelColor')}</label>
          <input id="rangeLabelColor" type="color" value="${st.rangeLabelConfig.color}"></div>
        <div class="param-item"><label>${I.t('rangeLabelOutlineColor')}</label>
          <input id="rangeLabelOutlineColor" type="color" value="${st.rangeLabelConfig.outlineColor}"></div>
        <div class="param-item"><label>${I.t('rangeLabelOutlineWidth')}</label>
          <input id="rangeLabelOutlineWidth" type="number" value="${st.rangeLabelConfig.outlineWidth}" min="0" max="8" step="0.5"></div>
        <div class="param-item"><label>${I.t('rangeLabelOpacity')}</label>
          <input id="rangeLabelOpacity" type="number" value="${st.rangeLabelConfig.opacity != null ? st.rangeLabelConfig.opacity : 0.8}" min="0" max="1" step="0.05"></div>
      </div>
    </div>

    <div class="param-panel" id="geoTimePanel">
      <div class="param-panel-title">${I.t('geoPanelTitle')}</div>
      <div class="param-grid cols-4" style="margin-bottom:8px;">
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="geoTimeShowChk"> ${I.t('geoShowToggle')}
        </label></div>
        <div class="param-item"><label>${I.t('geoScaleFactor')}</label>
          <input id="geoScaleFactor" type="number" min="0.000001" step="any" value="${R.geoScaleFactor}">
        </div>
        <div class="param-item" style="grid-column: span 2;">
          <label>${I.t('geoImportLevels')}</label>
          <div style="display:flex;gap:12px;flex-wrap:wrap;padding:4px 0;">
            <label class="mini-check"><input type="checkbox" data-geolevel="eon" checked> ${I.t('geoLevelEon')}</label>
            <label class="mini-check"><input type="checkbox" data-geolevel="era" checked> ${I.t('geoLevelEra')}</label>
            <label class="mini-check"><input type="checkbox" data-geolevel="period" checked> ${I.t('geoLevelPeriod')}</label>
            <label class="mini-check"><input type="checkbox" data-geolevel="epoch"> ${I.t('geoLevelEpoch')}</label>
            <label class="mini-check"><input type="checkbox" data-geolevel="age"> ${I.t('geoLevelAge')}</label>
          </div>
        </div>
      </div>
      <div class="info-box" style="margin:4px 0 10px;line-height:1.7;">
        <div><strong>${I.t('geoHowTo')}</strong></div>
        <div>· <b>${I.t('geoHowToCustom')}</b>${I.t('geoHowToCustomDesc')}</div>
        <div>· <b>${I.t('geoHowToPreset')}</b>${I.t('geoHowToPresetDesc')}</div>
        <div>· <b>${I.t('geoHowToScale')}</b>${I.t('geoHowToScaleDesc')}</div>
        <div>· <b>${I.t('geoHowToAxisSide')}</b>${I.t('geoHowToAxisSideDesc')}</div>
        <div>· <b>${I.t('geoHowToAsFill')}</b>${I.t('geoHowToAsFillDesc')}</div>
        <div>· <b>${I.t('geoHowToRadial')}</b>${I.t('geoHowToRadialDesc')}</div>
        <div>· ${I.t('geoHowToTruncate')}</div>
      </div>
      <div id="geoTimeTrackList" style="display:flex;flex-direction:column;gap:8px;max-height:520px;overflow:auto;"></div>
      <div class="btn-group" style="margin-top:8px;">
        <button class="btn" id="geoImportPresetBtn" type="button">${I.t('geoImportPresetBtn')}</button>
        <button class="btn" id="geoAddTrackBtn" type="button">${I.t('geoAddTrackBtn')}</button>
        <button class="btn" id="geoClearBtn" type="button">${I.t('geoClearBtn')}</button>
      </div>
    </div>
  `;

  const setLen = (k, v) => { C.snapshot(); st.lengthLabel[k] = v; global.TreeRenderer.draw(); };
  container.querySelector('#lenLabelShow')?.addEventListener('change', e => setLen('show', e.target.value === 'true'));
  container.querySelector('#lenLabelFontSize')?.addEventListener('input', e => setLen('fontSize', Number(e.target.value)));
  container.querySelector('#lenLabelBold')?.addEventListener('change', e => setLen('bold', e.target.checked));
  container.querySelector('#lenLabelItalic')?.addEventListener('change', e => setLen('italic', e.target.checked));
  container.querySelector('#lenLabelDecimals')?.addEventListener('input', e => setLen('decimals', Number(e.target.value)));
  container.querySelector('#lenLabelOffsetY')?.addEventListener('input', e => setLen('offsetY', Number(e.target.value)));
  container.querySelector('#lenLabelBgShow')?.addEventListener('change', e => setLen('bgShow', e.target.checked));
  container.querySelector('#lenLabelBgBorderColor')?.addEventListener('input', e => setLen('bgBorderColor', e.target.value));
  container.querySelector('#lenLabelBgBorderWidth')?.addEventListener('input', e => setLen('bgBorderWidth', Number(e.target.value)));
  container.querySelector('#lenLabelBgFill')?.addEventListener('input', e => setLen('bgFill', e.target.value));
  container.querySelector('#lenLabelAsTime')?.addEventListener('change', e => setLen('asTime', e.target.checked));
  container.querySelector('#lenLabelTimeRootAge')?.addEventListener('input', e => setLen('timeRootAge', Number(e.target.value)));
  container.querySelector('#lenLabelTimeFactor')?.addEventListener('input', e => setLen('timeFactor', Number(e.target.value)));
  container.querySelector('#lenLabelCiField')?.addEventListener('change', e => setLen('ciField', e.target.value));

  const setNodeCommon = (k, v) => { C.snapshot(); st.nodeLabelCommon[k] = v; global.TreeRenderer.draw(); };
  container.querySelector('#nodeLabelFontSize')?.addEventListener('input', e => setNodeCommon('fontSize', Number(e.target.value)));
  container.querySelector('#nodeLabelBold')?.addEventListener('change', e => setNodeCommon('bold', e.target.checked));
  container.querySelector('#nodeLabelItalic')?.addEventListener('change', e => setNodeCommon('italic', e.target.checked));
  container.querySelector('#nodeLabelOffsetX')?.addEventListener('input', e => setNodeCommon('offsetX', Number(e.target.value)));
  container.querySelector('#nodeLabelOffsetY')?.addEventListener('input', e => setNodeCommon('offsetY', Number(e.target.value)));
container.querySelector('#nodeLabelOffsetTangent')?.addEventListener('input', e => setNodeCommon('offsetTangent', Number(e.target.value)));
container.querySelector('#nodeLabelOffsetRadial')?.addEventListener('input', e => setNodeCommon('offsetRadial', Number(e.target.value)));
  container.querySelector('#nodeLabelMergeText')?.addEventListener('change', e => setNodeCommon('mergeText', e.target.checked));
  container.querySelector('#nodeLabelFillColorAs')?.addEventListener('change', e => setNodeCommon('fillColorAs', e.target.value));
  container.querySelector('#nodeLabelBgFill')?.addEventListener('input', e => setNodeCommon('bgFill', e.target.value));
  container.querySelector('#nodeLabelBgBorderColor')?.addEventListener('input', e => setNodeCommon('bgBorderColor', e.target.value));
  container.querySelector('#nodeLabelBgBorderWidth')?.addEventListener('input', e => setNodeCommon('bgBorderWidth', Number(e.target.value)));
  container.querySelector('#nodeLabelTextColorOnBg')?.addEventListener('input', e => setNodeCommon('textColorOnBg', e.target.value));
  container.querySelector('#nodeLabelSeparator')?.addEventListener('input', e => setNodeCommon('separator', e.target.value));
  container.querySelector('#nodeLabelHideOnLeaves')?.addEventListener('change', e => setNodeCommon('hideOnLeaves', e.target.checked));

  let nodeLabelSeq = (st.nodeLabels.reduce((m, it) => Math.max(m, it.id || 0), 0)) + 1;
  container.querySelector('#addNodeLabelBtn')?.addEventListener('click', () => {
    C.snapshot();
    st.nodeLabels.push({
      id: nodeLabelSeq++,
      column: "",
      mode: "text",
      decimals: 2, asPercent: false,
      thresholdLogic: "", threshold: null,
      shape: "circle", strokeColor: "#000000", strokeWidth: 1,
      fillColor: "#E64B35", maxSize: 10, minSize: 2
    });
    renderNodeLabelList();
    global.TreeRenderer.draw();
  });
  renderNodeLabelList();

  const setRange = (k, v) => { C.snapshot(); st.rangeLabelConfig[k] = v; global.TreeRenderer.draw(); };
  container.querySelector('#rangeLabelShow')?.addEventListener('change', e => setRange('show', e.target.value === 'true'));
  container.querySelector('#rangeLabelField')?.addEventListener('change', e => setRange('field', e.target.value));
  container.querySelector('#rangeLabelLineHeight')?.addEventListener('input', e => setRange('lineHeight', Number(e.target.value)));
  container.querySelector('#rangeLabelColor')?.addEventListener('input', e => setRange('color', e.target.value));
  container.querySelector('#rangeLabelOutlineColor')?.addEventListener('input', e => setRange('outlineColor', e.target.value));
  container.querySelector('#rangeLabelOutlineWidth')?.addEventListener('input', e => setRange('outlineWidth', Number(e.target.value)));
  container.querySelector('#rangeLabelOpacity')?.addEventListener('input', e => setRange('opacity', Math.max(0, Math.min(1, Number(e.target.value)))));

  bindGeoTimeControls(container);
}

function bindGeoTimeControls(container) {
  const R = global.TreeRanges;
  if (!R) return;

  const showChk = container.querySelector('#geoTimeShowChk');
  if (showChk) {
    showChk.checked = !!R.geoTimeShow;
    showChk.addEventListener('change', e => {
      C.snapshot();
      R.geoTimeShow = e.target.checked;
      global.TreeRenderer.draw();
    });
  }

  const scaleInput = container.querySelector('#geoScaleFactor');
  if (scaleInput) {
    scaleInput.value = R.geoScaleFactor;
    scaleInput.addEventListener('input', e => {
      C.snapshot();
      const v = Number(e.target.value);
      R.geoScaleFactor = (Number.isFinite(v) && v > 0) ? v : 1;
      global.TreeRenderer.draw();
    });
  }

  const list = container.querySelector('#geoTimeTrackList');
  if (!list) return;

  function esc(s) { return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

  function render() {
    const tracks = R.geoTimeTracks;
    if (!tracks.length) {
      list.innerHTML = `<div class="info-box" style="margin:8px 0;padding:8px;">${I.t('geoNoTracks')}</div>`;
      return;
    }
    list.innerHTML = tracks.map(t => {
const hasLevel = !!t.level;
const levelOptions = hasLevel ? R.GEO_LEVELS.map(l =>
  `<option value="${l}" ${t.level === l ? 'selected' : ''}>${R.GEO_LEVEL_LABELS[l]}</option>`
).join('') : '';
const titlePrefix = hasLevel ? `${R.GEO_LEVEL_LABELS[t.level] || t.level}：` : '';
      const entriesHtml = t.entries.map(e => `
        <div class="rp-row" style="flex-wrap:wrap;gap:4px;padding:4px 0;" data-entry-id="${e.id}" data-track-id="${t.id}">
          <input type="number" data-efield="start" data-eid="${e.id}" data-tid="${t.id}" value="${e.start}" placeholder="${I.t('geoEntryStart')}" style="width:80px;" step="any">
          <input type="number" data-efield="end"   data-eid="${e.id}" data-tid="${t.id}" value="${e.end}"   placeholder="${I.t('geoEntryEnd')}" style="width:80px;" step="any">
          <input type="text"   data-efield="name"  data-eid="${e.id}" data-tid="${t.id}" value="${esc(e.name)}"  placeholder="${I.t('geoEntryName')}" style="width:110px;">
          <input type="color"  data-efield="color" data-eid="${e.id}" data-tid="${t.id}" value="${e.color}" style="width:40px;height:26px;padding:0;">
          <button class="rp-x" data-eremove="${e.id}" data-tid="${t.id}" type="button">×</button>
        </div>
      `).join('');
      return `
      <div class="track-item" data-geo-track-id="${t.id}">
        <div class="track-header">
          <span class="track-title">${titlePrefix}${esc(t.name || I.t('geoUntitled'))}</span>
          <button class="track-toggle" data-geo-toggle="${t.id}" type="button">${t.collapsed ? '▼' : '▲'}</button>
          <button class="track-remove" data-geo-remove="${t.id}" type="button">×</button>
        </div>
        <div class="track-body" style="${t.collapsed ? 'display:none;' : ''}">
          <div class="param-grid cols-4">
${hasLevel ? `<div class="param-item"><label>${I.t('geoLevelLabel')}</label>
  <select data-gtrack-field="level" data-tid="${t.id}">${levelOptions}</select></div>` : ''}
            <div class="param-item"><label>${I.t('geoTitleLabel')}</label>
              <input type="text" data-gtrack-field="name" data-tid="${t.id}" value="${esc(t.name)}"></div>
            <div class="param-item"><label class="mini-check">
              <input type="checkbox" data-gtrack-field="nameShow" data-tid="${t.id}" ${t.nameShow ? 'checked' : ''}> ${I.t('geoTitleShowLabel')}</label></div>
            <div class="param-item"><label>${I.t('geoTitleFontSizeLabel')}</label>
              <input type="number" data-gtrack-field="nameFontSize" data-tid="${t.id}" value="${t.nameFontSize}" min="6" max="30"></div>
            <div class="param-item"><label class="mini-check">
              <input type="checkbox" data-gtrack-field="nameBold" data-tid="${t.id}" ${t.nameBold ? 'checked' : ''}> ${I.t('geoTitleBoldLabel')}</label></div>
            <div class="param-item"><label class="mini-check">
              <input type="checkbox" data-gtrack-field="nameItalic" data-tid="${t.id}" ${t.nameItalic ? 'checked' : ''}> ${I.t('geoTitleItalicLabel')}</label></div>
            <div class="param-item"><label>${I.t('geoOutlineColorLabel')}</label>
              <input type="color" data-gtrack-field="outlineColor" data-tid="${t.id}" value="${t.outlineColor}"></div>
            <div class="param-item"><label>${I.t('geoOutlineWidthLabel')}</label>
              <input type="number" data-gtrack-field="outlineWidth" data-tid="${t.id}" value="${t.outlineWidth}" min="0" max="6" step="0.5"></div>
            <div class="param-item"><label>${I.t('geoOpacityLabel')}</label>
              <input type="number" data-gtrack-field="opacity" data-tid="${t.id}" value="${t.opacity}" min="0" max="1" step="0.05"></div>
            <div class="param-item"><label>${I.t('geoHeightLabel')}</label>
              <input type="number" data-gtrack-field="height" data-tid="${t.id}" value="${t.height}" min="4" max="120"></div>
            <div class="param-item"><label>${I.t('geoGapLabel')}</label>
              <input type="number" data-gtrack-field="gap" data-tid="${t.id}" value="${t.gap}" min="0" max="60"></div>
            <div class="param-item"><label>${I.t('geoOffsetLabel')}</label>
              <input type="number" data-gtrack-field="offset" data-tid="${t.id}" value="${t.offset || 0}" step="1"></div>
            <div class="param-item"><label>${I.t('geoTextOrientationLabel')}</label>
              <select data-gtrack-field="textOrientation" data-tid="${t.id}">
                <option value="horizontal" ${t.textOrientation !== 'vertical' ? 'selected' : ''}>${I.t('geoTextHorizontal')}</option>
                <option value="vertical" ${t.textOrientation === 'vertical' ? 'selected' : ''}>${I.t('geoTextVertical')}</option>
              </select></div>
            <div class="param-item"><label>${I.t('geoAxisSideLabel')}</label>
              <select data-gtrack-field="position" data-tid="${t.id}">
                <option value="bottom" ${t.position === 'bottom' ? 'selected' : ''}>${I.t('geoAxisSideBottom')}</option>
                <option value="top" ${t.position === 'top' ? 'selected' : ''}>${I.t('geoAxisSideTop')}</option>
              </select></div>
            <div class="param-item"><label class="mini-check">
              <input type="checkbox" data-gtrack-field="fillTree" data-tid="${t.id}" ${t.fillTree ? 'checked' : ''}> ${I.t('geoFillTreeLabel')}</label></div>
            <div class="param-item"><label>${I.t('geoFillTreeOpacityLabel')}</label>
              <input type="number" data-gtrack-field="fillTreeOpacity" data-tid="${t.id}" value="${t.fillTreeOpacity != null ? t.fillTreeOpacity : 0.14}" min="0" max="1" step="0.02" ${t.fillTree ? '' : 'disabled'}></div>
          </div>
          <div class="sub-section-title" style="margin-top:8px;">${I.t('geoEntriesTitle')}（${t.entries.length}）</div>
          <div style="display:flex;flex-direction:column;gap:2px;max-height:180px;overflow:auto;">
            ${entriesHtml || `<div class="info-box" style="margin:6px 0;padding:6px;">${I.t('geoNoEntries')}</div>`}
          </div>
          <button class="btn" data-geo-add-entry="${t.id}" type="button" style="margin-top:6px;">${I.t('geoAddEntryBtn')}</button>
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('[data-gtrack-field]').forEach(el => {
      el.addEventListener('input', e => {
        const id = Number(el.dataset.tid);
        const field = el.dataset.gtrackField;
        const t = R.geoTimeTracks.find(x => x.id === id); if (!t) return;
        C.snapshot();
        if (el.type === 'checkbox') t[field] = el.checked;
        else if (el.type === 'number') t[field] = Number(el.value);
        else t[field] = el.value;
if (field === 'level') {
  const header = list.querySelector(`[data-geo-track-id="${id}"] .track-title`);
  if (header) {
    const pre = t.level ? `${R.GEO_LEVEL_LABELS[t.level] || t.level}${I.t('trackTitleSep')}` : '';
    header.textContent = pre + (t.name || I.t('geoUntitled'));
  }
}
        global.TreeRenderer.draw();
      });
    });

    list.querySelectorAll('[data-efield]').forEach(el => {
      el.addEventListener('input', e => {
        const tid = Number(el.dataset.tid);
        const eid = Number(el.dataset.eid);
        const field = el.dataset.efield;
        const t = R.geoTimeTracks.find(x => x.id === tid); if (!t) return;
        const entry = t.entries.find(x => x.id === eid); if (!entry) return;
        C.snapshot();
        if (el.type === 'number') entry[field] = Number(el.value);
        else entry[field] = el.value;
        global.TreeRenderer.draw();
      });
    });

    list.querySelectorAll('[data-eremove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = Number(btn.dataset.tid);
        const eid = Number(btn.dataset.eremove);
        C.snapshot();
        R.removeGeoEntry(tid, eid);
        render();
        global.TreeRenderer.draw();
      });
    });

    list.querySelectorAll('[data-geo-add-entry]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = Number(btn.dataset.geoAddEntry);
        const t = R.geoTimeTracks.find(x => x.id === tid); if (!t) return;
        C.snapshot();
        const s = t.entries.length ? Math.min(...t.entries.map(e => e.end)) : 0;
        const e = t.entries.length ? Math.max(...t.entries.map(e => e.start), s + 100) : 100;
        R.addGeoEntry(tid, { start: e, end: s, name: 'New', color: '#888888' });
        render();
        global.TreeRenderer.draw();
      });
    });

    list.querySelectorAll('[data-geo-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.geoToggle);
        const t = R.geoTimeTracks.find(x => x.id === id); if (!t) return;
        t.collapsed = !t.collapsed;
        render();
      });
    });

    list.querySelectorAll('[data-geo-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.geoRemove);
        C.snapshot();
        R.removeGeoTrack(id);
        render();
        global.TreeRenderer.draw();
      });
    });
    list.querySelectorAll('input[type="checkbox"][data-gtrack-field="fillTree"]').forEach(chk => {
      chk.addEventListener('change', () => {
        const id = Number(chk.dataset.tid);
        const opInput = list.querySelector(`input[data-gtrack-field="fillTreeOpacity"][data-tid="${id}"]`);
        if (opInput) opInput.disabled = !chk.checked;
      });
    });
  }

  render();

  container.querySelector('#geoImportPresetBtn')?.addEventListener('click', async () => {
    const levels = [];
    container.querySelectorAll('[data-geolevel]:checked').forEach(c => levels.push(c.dataset.geolevel));
    if (!levels.length) { alert(I.t('geoAlertSelectLevel')); return; }
    try {
      await R.importGeoPreset(levels);
      const chk = container.querySelector('#geoTimeShowChk');
      if (chk) chk.checked = true;
      render();
    } catch (err) {
      alert(I.t('geoAlertImportFail') + ': ' + (err && err.message || err));
    }
  });

  container.querySelector('#geoAddTrackBtn')?.addEventListener('click', () => {
    C.snapshot();
    R.addGeoTrack({ name: '', entries: [] });
    R.geoTimeShow = true;
    const chk = container.querySelector('#geoTimeShowChk');
    if (chk) chk.checked = true;
    render();
    global.TreeRenderer.draw();
  });

  container.querySelector('#geoClearBtn')?.addEventListener('click', () => {
    if (!confirm(I.t('geoConfirmClear'))) return;
    C.snapshot();
    const arr = R.geoTimeTracks;
    arr.length = 0;
    render();
    global.TreeRenderer.draw();
  });
}

function renderDatasetsPanel(container) {
  if (!container) return;

  container.innerHTML = `

    <div class="param-panel" id="leafLabelPanel">
      <div class="param-panel-title">${I.t('leafLabelPanel')}</div>
      <div class="param-grid cols-4">
        <div class="param-item" style="grid-column: span 2;">
          <label>${I.t('leafLabelDataColumn')}</label>
          <select id="leafLabelColumn"><option value="">${I.t('leafLabelUseLeafName')}</option></select>
        </div>
        <div class="param-item" style="align-self:end;">
          <button class="btn" id="applyLeafLabelColumn" type="button">${I.t('applyLeafLabel')}</button>
          <button class="btn btn-outline" id="resetLeafLabelColumn" type="button">${I.t('resetLeafLabel')}</button>
        </div>
      </div>
    </div>

    <div class="param-panel" id="trackCommonPanel">
      <div class="param-panel-title">${I.t('trackCommonPanel')}</div>
      ${subTitle(I.t('trackLegendCommon'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcLegendTitleShow" checked> ${I.t('trackLegendTitleShow')}</label></div>
        <div class="param-item"><label>${I.t('trackLegendFontSize')}</label><input id="tcLegendFontSize" type="number" min="6" max="40" value="11"></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcLegendBold"> ${I.t('trackLegendBold')}</label></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcLegendItalic"> ${I.t('trackLegendItalic')}</label></div>
        <div class="param-item"><label>${I.t('trackLegendTitleFontSize')}</label><input id="tcLegendTitleFontSize" type="number" min="6" max="40" value="30"></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcLegendTitleBold" checked> ${I.t('trackLegendTitleBold')}</label></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcLegendTitleItalic"> ${I.t('trackLegendTitleItalic')}</label></div>
        <div class="param-item"><label>${I.t('trackLegendMaxPerRow')}</label><input id="tcLegendMaxPerRow" type="number" min="0" max="20" value="0" placeholder="0"></div>
        <div class="param-item"><label>${I.t('trackLegendScale')}</label><input id="tcLegendScale" type="number" min="0.3" max="50" step="0.1" value="1"></div>
      </div>
      ${subTitle(I.t('trackNameAndGap'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcTrackNameShow" checked> ${I.t('trackNameShow')}</label></div>
        <div class="param-item"><label>${I.t('trackNameFontSize')}</label><input id="tcTrackNameFontSize" type="number" min="6" max="40" value="26"></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcTrackNameBold" checked> ${I.t('trackNameBold')}</label></div>
        <div class="param-item"><label class="mini-check"><input type="checkbox" id="tcTrackNameItalic"> ${I.t('trackNameItalic')}</label></div>
        <div class="param-item"><label>${I.t('trackNameAngle')}</label><input id="tcTrackNameAngle" type="number" min="-90" max="90" step="1" value="-45"></div>
        <div class="param-item"><label>${I.t('trackGap')}</label><input id="tcTrackGap" type="number" min="0" step="1" value="50"></div>
      </div>
      ${subTitle(I.t('trackShapeSizeCommon'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="tcAutoShapeSize" checked> ${I.t('trackAutoShapeSize')}
        </label></div>
      </div>
    </div>


    <div class="param-panel" id="rangeBackgroundPanel">
      <div class="param-panel-title">${I.t('rangeBackgroundPanel')}</div>
      <div class="param-grid cols-4">
        <div class="param-item">
          <label>${I.t('groupDataColumn')}</label>
          <select id="groupByColumn"><option value="">${I.t('groupChooseColumn')}</option></select>
        </div>
        <div class="param-item" style="grid-column: span 2;">
          <label>${I.t('groupPaletteLabel')}</label>
          <div id="groupPaletteContainer"></div>
        </div>
        <div class="param-item" style="align-self:end;">
          <button class="btn" id="applyGroupByColumn" type="button">${I.t('applyGroup')}</button>
          <button class="btn btn-outline" id="clearGroupsBtn" type="button">${I.t('clearGroup')}</button>
        </div>
      </div>

      <div class="rp-list" id="rpList"
           style="max-height:220px;overflow:auto;margin-top:10px;border:1px solid #eef1f0;border-radius:4px;"></div>

      ${subTitle(I.t('rangeStyleTitle'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label>${I.t('rangeCoverLabel')}</label>
<select id="rangeCoverSelect">
  <option value="label">${I.t('rangeCoverOptLabel')}</option>
  <option value="clade">${I.t('rangeCoverOptClade')}</option>
  <option value="full">${I.t('rangeCoverOptFull')}</option>
  <option value="off">${I.t('rangeCoverOptOff')}</option>
</select>
        </div>
        <div class="param-item"><label>${I.t('rangeBorderWidth')}</label>
          <input id="rpBorder" type="number" min="0" max="8" step="1" value="0">
        </div>
        <div class="param-item"><label>${I.t('rangeBorderColor2')}</label>
          <input id="rpBorderColor" type="color" value="#333333">
        </div>
        <div class="param-item"><label>${I.t('rangeFillStyle')}</label>
          <select id="rangeGradient">
            <option value="false">${I.t('rangeFillSolid')}</option>
            <option value="true">${I.t('rangeFillGradient')}</option>
          </select>
        </div>
        <div class="param-item"><label>${I.t('rangeOpacity2')}</label>
          <input id="rangeOpacity" type="number" min="0" max="1" step="0.05" value="0.15">
        </div>
      </div>

      ${subTitle(I.t('rangeLabelTrackTitle2'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rangeLabelTrackShowChk" checked> ${I.t('rangeLabelTrackShowChk')}
        </label></div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rangeLabelTrackTitleShowChk" checked> ${I.t('rangeLabelTrackTitleShowChk')}
        </label></div>
        <div class="param-item"><label>${I.t('rangeLabelTrackTitleLabel')}</label>
          <input id="rangeLabelTrackTitle" type="text" value="Groups">
        </div>
        <div class="param-item"><label>${I.t('rangeLabelTrackOffsetLabel')}</label>
          <input id="rangeLabelTrackOffset" type="number" step="1" value="0">
        </div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rangeLabelTrackAutoWidthChk"> ${I.t('rangeLabelTrackAutoWidthChk')}
        </label></div>
        <div class="param-item"><label>${I.t('rangeLabelTrackWidthLabel')}</label>
          <input id="rangeLabelTrackWidth" type="number" min="10" max="300" step="1" value="60">
        </div>
        <div class="param-item"><label>${I.t('rangeLabelTrackOpacityLabel')}</label>
          <input id="rangeLabelTrackOpacity" type="number" min="0" max="1" step="0.05" value="1">
        </div>
        <div class="param-item"><label>${I.t('rangeLabelTrackTextOrientation')}</label>
          <select id="rangeLabelTrackTextOrientation">
            <option value="horizontal">${I.t('rangeLabelTextHorizontal')}</option>
            <option value="vertical">${I.t('rangeLabelTextVertical')}</option>
          </select>
        </div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rangeShowLabelsSelect" checked> ${I.t('rangeShowLabelsChk')}
        </label></div>
        <div class="param-item"><label>${I.t('rangeLabelSizeLabel')}</label>
          <input id="rpLabelSize" type="number" min="6" max="60" step="1" value="13">
        </div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rpLabelBoldChk" checked> ${I.t('rangeLabelBoldChk')}
        </label></div>
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="rpLabelItalicChk"> ${I.t('rangeLabelItalicChk')}
        </label></div>
        <div class="param-item"><label>${I.t('rangeLabelColorLabel')}</label>
          <input id="rpLabelColor" type="color" value="#333333">
        </div>
      </div>

      ${subTitle(I.t('legendPanelTitle'))}
      <div class="param-grid cols-4">
        <div class="param-item"><label class="mini-check">
          <input type="checkbox" id="showLegendChk"> ${I.t('legendShowChk')}
        </label></div>
        <div class="param-item"><label>${I.t('legendTitleLabel')}</label>
          <input id="legendTitle" type="text" value="Groups">
        </div>
        <div class="param-item"><label>${I.t('legendColorLabel')}</label>
          <input id="legendColor" type="color" value="#222222">
        </div>
      </div>
    </div>

    <div class="param-panel" id="customTrackPanel">
      <div class="param-panel-title">${I.t('customTrackPanel')}</div>
      <div id="trackList" class="track-list"></div>
      <div class="param-grid cols-4" style="margin-top:12px;">
        <div class="param-item"><label>${I.t('customTrackType')}</label>
          <select id="newTrackType">
            <option value="colorstrip">${I.t('optColorstrip')}</option>
            <option value="binary">${I.t('optBinary')}</option>
            <option value="multisymbol">${I.t('optSymbols')}</option>
            <option value="heatstrip">${I.t('optGradient')}</option>
            <option value="bar">${I.t('optSimpleBar')}</option>
            <option value="stackedbar">${I.t('optMultibar')}</option>
            <option value="pie">${I.t('optPiechart')}</option>
            <option value="text">${I.t('optText')}</option>
          </select>
        </div>
        <div class="param-item" style="align-self:end;">
          <button class="btn" id="addTrackBtn" type="button">${I.t('customTrackAddBtn')}</button>
        </div>
      </div>
    </div>
  `;

  renderGroupPaletteDropdown(container.querySelector('#groupPaletteContainer'), {
    onSelect: (name) => {
      if (global.TreeRanges && global.TreeRanges.colorRanges.length) {
        C.snapshot();
        global.TreeRanges.recolorRangesByPalette();
        if (global.TreeRenderer) global.TreeRenderer.draw();
      }
    }
  });

  bindTrackCommonControls(container);
  syncRangesControls(container);

  const leafLabelSel = container.querySelector('#leafLabelColumn');
  const refreshLeafLabelCols = () => {
    const ld = global.TreeApp && global.TreeApp.leafData;
    const headers = (ld && ld.headers) ? ld.headers.filter(h => h !== 'Leaf') : [];
    const cur = leafLabelSel.value;
    leafLabelSel.innerHTML = `<option value="">${I.t('leafLabelUseLeafName')}</option>` +
      headers.map(h => `<option value="${escapeAttr(h)}" ${h === cur ? 'selected' : ''}>${escapeHtml(h)}</option>`).join('');
  };
  if (leafLabelSel) {
    leafLabelSel.addEventListener('pointerdown', refreshLeafLabelCols);
    leafLabelSel.addEventListener('focus', refreshLeafLabelCols);
    refreshLeafLabelCols();
  }
  container.querySelector('#applyLeafLabelColumn')?.addEventListener('click', () => {
    const col = leafLabelSel ? leafLabelSel.value : '';
    if (!col) { global.TreeRanges.resetLeafLabels(); return; }
    global.TreeRanges.applyLeafLabelColumn(col);
  });
  container.querySelector('#resetLeafLabelColumn')?.addEventListener('click', () => global.TreeRanges.resetLeafLabels());

  const groupSel = container.querySelector('#groupByColumn');
  const refreshCols = () => {
    const ld = global.TreeApp && global.TreeApp.leafData;
    const headers = (ld && ld.headers) ? ld.headers.slice() : [];
    const cur = groupSel.value;
    groupSel.innerHTML = `<option value="">${I.t('groupChooseColumn')}</option>` +
      headers.map(h => `<option value="${escapeAttr(h)}" ${h === cur ? 'selected' : ''}>${escapeHtml(h)}</option>`).join('');
  };
  if (groupSel) {
    groupSel.addEventListener('pointerdown', refreshCols);
    groupSel.addEventListener('focus', refreshCols);
    refreshCols();
  }

  container.querySelector('#applyGroupByColumn')?.addEventListener('click', () => {
    const col = groupSel ? groupSel.value : '';
    if (!col) { alert(I.t('groupChooseColumn')); return; }
    global.TreeRanges.applyGroupsByColumn(col);
  });

  container.querySelector('#clearGroupsBtn')?.addEventListener('click', () => {
    C.snapshot();
    global.TreeRanges.clearAllColorRanges();
    global.TreeRanges.renderRangesPanel();
    if (global.TreeRenderer) global.TreeRenderer.draw();
  });

  container.querySelector('#addTrackBtn')?.addEventListener('click', () => {
    const type = container.querySelector('#newTrackType')?.value || 'colorstrip';
    C.snapshot();
    global.TreeTracks.addCustomTrack({ type });
    refreshTrackList(container);
    global.TreeRenderer.draw();
  });

  refreshTrackList(container);
}

function bindTrackCommonControls(container) {
  const tc = global.TreeTracks.trackCommon;
  const sync = () => {
    container.querySelector('#tcLegendTitleShow').checked = tc.legendTitleShow;
    container.querySelector('#tcLegendFontSize').value = tc.legendFontSize;
    container.querySelector('#tcLegendBold').checked = tc.legendBold;
    container.querySelector('#tcLegendItalic').checked = tc.legendItalic;
    container.querySelector('#tcLegendTitleFontSize').value = tc.legendTitleFontSize;
    container.querySelector('#tcLegendTitleBold').checked = tc.legendTitleBold;
    container.querySelector('#tcLegendTitleItalic').checked = tc.legendTitleItalic;
    container.querySelector('#tcLegendMaxPerRow').value = tc.legendMaxPerRow;
    container.querySelector('#tcLegendScale').value = tc.legendScale;
    container.querySelector('#tcTrackNameShow').checked = tc.trackNameShow;
    container.querySelector('#tcTrackNameFontSize').value = tc.trackNameFontSize;
    container.querySelector('#tcTrackNameBold').checked = tc.trackNameBold;
    container.querySelector('#tcTrackNameItalic').checked = tc.trackNameItalic;
    container.querySelector('#tcTrackNameAngle').value = tc.trackNameAngle;
    container.querySelector('#tcTrackGap').value = tc.trackGap;
    container.querySelector('#tcAutoShapeSize').checked = tc.autoShapeSize !== false;
  };
  sync();

  const bind = (id, prop, type) => {
    container.querySelector('#' + id)?.addEventListener('input', e => {
      C.snapshot();
      let v;
      if (type === 'bool') v = e.target.checked;
      else if (type === 'num') v = Number(e.target.value);
      else v = e.target.value;
      tc[prop] = v;
      global.TreeRenderer.draw();
    });
  };
  bind('tcLegendTitleShow', 'legendTitleShow', 'bool');
  bind('tcLegendFontSize', 'legendFontSize', 'num');
  bind('tcLegendBold', 'legendBold', 'bool');
  bind('tcLegendItalic', 'legendItalic', 'bool');
  bind('tcLegendTitleFontSize', 'legendTitleFontSize', 'num');
  bind('tcLegendTitleBold', 'legendTitleBold', 'bool');
  bind('tcLegendTitleItalic', 'legendTitleItalic', 'bool');
  bind('tcLegendMaxPerRow', 'legendMaxPerRow', 'num');
  bind('tcLegendScale', 'legendScale', 'num');
  bind('tcTrackNameShow', 'trackNameShow', 'bool');
  bind('tcTrackNameFontSize', 'trackNameFontSize', 'num');
  bind('tcTrackNameBold', 'trackNameBold', 'bool');
  bind('tcTrackNameItalic', 'trackNameItalic', 'bool');
  bind('tcTrackNameAngle', 'trackNameAngle', 'num');
  bind('tcTrackGap', 'trackGap', 'num');
  bind('tcAutoShapeSize', 'autoShapeSize', 'bool');
}

function subTitle(text) { return `<div class="sub-section-title">${text}</div>`; }

function legendBlock(t) {
  return subTitle(I.t('legendPanelTitle')) + `
    <div class="param-grid cols-4">
      <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showLegend" data-tid="${t.id}" ${t.showLegend?'checked':''}> ${I.t('legendShowChk')}</label></div>
      <div class="param-item"><label>${I.t('legendTitleLabel')}</label><input type="text" data-tprop="legendTitle" data-tid="${t.id}" value="${escapeAttr(t.legendTitle || '')}" placeholder="${I.t('trackUntitled')}"></div>
      ${t.type === 'heatstrip' ? `
        <div class="param-item"><label>${I.t('legendDirection')}</label><select data-tprop="legendOrientation" data-tid="${t.id}">
          <option value="horizontal" ${t.legendOrientation!=='vertical'?'selected':''}>${I.t('legendHorizontal')}</option>
          <option value="vertical" ${t.legendOrientation==='vertical'?'selected':''}>${I.t('legendVertical')}</option></select></div>
        <div class="param-item"><label>${I.t('heatLegendTickInterval')}</label><input type="number" data-tprop="legendTickInterval" data-tid="${t.id}" value="${t.legendTickInterval != null ? t.legendTickInterval : ''}" min="0" step="any" placeholder="auto"></div>
        <div class="param-item"><label>${I.t('heatLegendTickDecimals')}</label><input type="number" data-tprop="legendTickDecimals" data-tid="${t.id}" value="${t.legendTickDecimals != null ? t.legendTickDecimals : 2}" min="0" max="6" step="1"></div>
      ` : ''}
    </div>`;
}
function customColorBlock(t, values) {
  if (!values.length) return '';
  const cur = t.customColors || {};
  return subTitle(I.t('trackCustomColors')) + `
    <div class="custom-color-list" style="display:flex;flex-wrap:wrap;gap:8px;">
      ${values.map(v => `
        <label style="display:flex;align-items:center;gap:4px;font-size:12px;">
          <input type="color" data-tcolor="${t.id}" data-cval="${escapeAttr(v)}"
                 value="${escapeAttr(cur[v] || '#cccccc')}"
                 style="width:30px;height:22px;padding:0;border:1px solid #ccc;border-radius:3px;cursor:pointer;">
          <span>${escapeHtml(v)}</span>
          <button class="btn-del-color" data-tdelcolor="${t.id}" data-cval="${escapeAttr(v)}" type="button" title="delete">×</button>
        </label>`).join('')}
    </div>`;
}

function shapeMapBlock(t, values) {
  if (!values.length) return '';
  return subTitle(I.t('trackShapeSettings')) + `
    <div class="shape-map-list" style="display:flex;flex-wrap:wrap;gap:8px;">
      ${values.map(v => `
        <label style="display:flex;align-items:center;gap:4px;font-size:12px;">
          <select data-tshape="${t.id}" data-sval="${escapeAttr(v)}" style="padding:2px 4px;">
            <option value="square" ${(t.shapeMap&&t.shapeMap[v])==='square'||(!t.shapeMap||!t.shapeMap[v])?'selected':''}>■</option>
            <option value="triangle" ${t.shapeMap&&t.shapeMap[v]==='triangle'?'selected':''}>▲</option>
            <option value="circle" ${t.shapeMap&&t.shapeMap[v]==='circle'?'selected':''}>●</option>
            <option value="star" ${t.shapeMap&&t.shapeMap[v]==='star'?'selected':''}>★</option>
            <option value="diamond2" ${t.shapeMap&&t.shapeMap[v]==='diamond2'?'selected':''}>◆</option>
          </select>
          <span>${escapeHtml(v)}</span>
        </label>`).join('')}
    </div>`;
}

function paletteWithColors(t, vals) {
  return `
    <div class="param-item"><label>${I.t('groupPaletteLabel')}</label><div class="palette-slot" data-palette="${t.id}"></div></div>
    ${customColorBlock(t, vals)}
  `;
}

function refreshTrackList(container) {
  const box = container.querySelector('#trackList');
  if (!box) return;
  const TT = global.TreeTracks;
  if (!TT || !TT.tracks.length) { box.innerHTML = ''; return; }
  const ld = global.TreeApp && global.TreeApp.leafData;
  const cols = (ld && ld.headers) ? ld.headers.slice() : [];

  box.innerHTML = TT.tracks.map(t => {
    const colOpts = (sel) => `<option value="">${I.t('trackDataColumn')}</option>` +
      cols.map(c => `<option value="${escapeAttr(c)}" ${c === sel ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
    const typeLabel = TT.trackTypeLabel(t.type);
    let body = '';

    if (t.type === 'colorstrip') {
      const vals = TT.collectUniqueValues(t);
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackDataColumn')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escapeAttr(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackMergeGroups')}</label><select data-tprop="mergeGroups" data-tid="${t.id}">
            <option value="true" ${t.mergeGroups?'selected':''}>${I.t('trackMergeGroupsOn')}</option>
            <option value="false" ${!t.mergeGroups?'selected':''}>${I.t('trackMergeGroupsOff')}</option>
          </select></div>
          <div class="param-item"><label>${I.t('trackStripWidth')}</label><input type="number" data-tprop="width" data-tid="${t.id}" value="${t.width || 20}" min="4" max="400" ${t.textAutoWidth?'disabled':''}></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="textAutoWidth" data-tid="${t.id}" ${t.textAutoWidth?'checked':''}> ${I.t('trackTextAutoWidth')}</label></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
          <div class="param-item"><label>${I.t('trackBorderColor')}</label><input type="color" data-tprop="borderColor" data-tid="${t.id}" value="${t.borderColor}"></div>
          <div class="param-item"><label>${I.t('trackBorderWidth')}</label><input type="number" data-tprop="borderWidth" data-tid="${t.id}" value="${t.borderWidth}" min="0" max="6"></div>
          <div class="param-item"><label>${I.t('trackBlockOpacity')}</label><input type="number" data-tprop="fillOpacity" data-tid="${t.id}" value="${t.fillOpacity != null ? t.fillOpacity : 1}" min="0" max="1" step="0.05"></div>
        </div>
        ${subTitle(I.t('trackColorText'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showText" data-tid="${t.id}" ${t.showText?'checked':''}> ${I.t('trackShowText')}</label></div>
          <div class="param-item"><label>${I.t('trackFontSize')}</label><input type="number" data-tprop="textFontSize" data-tid="${t.id}" value="${t.textFontSize || 10}" min="6" max="40"></div>
          <div class="param-item"><label>${I.t('trackTextColor')}</label><input type="color" data-tprop="textColor" data-tid="${t.id}" value="${t.textColor || '#333333'}"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="textBold" data-tid="${t.id}" ${t.textBold?'checked':''}> ${I.t('trackTextBold')}</label></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="textItalic" data-tid="${t.id}" ${t.textItalic?'checked':''}> ${I.t('trackTextItalic')}</label></div>
          <div class="param-item"><label>${I.t('trackTextOrientation')}</label><select data-tprop="textOrientation" data-tid="${t.id}">
            <option value="horizontal" ${t.textOrientation!=='vertical'?'selected':''}>${I.t('trackTextHorizontal')}</option>
            <option value="vertical" ${t.textOrientation==='vertical'?'selected':''}>${I.t('trackTextVertical')}</option>
          </select></div>
        </div>
        <div class="param-grid cols-4" style="margin-top:8px;">${paletteWithColors(t, vals)}</div>
        ${legendBlock(t)}
      `;
    } else if (t.type === 'binary') {
      const valOpts = `<option value="eq" ${t.binaryLogic==='eq'?'selected':''}>${I.t('optEq')}</option>
        <option value="ne" ${t.binaryLogic==='ne'?'selected':''}>${I.t('optNe')}</option>
        <option value="gt" ${t.binaryLogic==='gt'?'selected':''}>${I.t('optGt')}</option>
        <option value="gte" ${t.binaryLogic==='gte'?'selected':''}>${I.t('optGte')}</option>
        <option value="lt" ${t.binaryLogic==='lt'?'selected':''}>${I.t('optLt')}</option>
        <option value="lte" ${t.binaryLogic==='lte'?'selected':''}>${I.t('optLte')}</option>
        <option value="truthy" ${t.binaryLogic==='truthy'?'selected':''}>${I.t('optTruthy')}</option>
        <option value="falsy" ${t.binaryLogic==='falsy'?'selected':''}>${I.t('optFalsy')}</option>
        <option value="contains" ${t.binaryLogic==='contains'?'selected':''}>${I.t('optContains')}</option>
        <option value="startswith" ${t.binaryLogic==='startswith'?'selected':''}>${I.t('optStartsWith')}</option>
        <option value="endswith" ${t.binaryLogic==='endswith'?'selected':''}>${I.t('optEndsWith')}</option>`;
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackDataColumn')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escapeAttr(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackBinaryLogic')}</label><select data-tprop="binaryLogic" data-tid="${t.id}">${valOpts}</select></div>
          <div class="param-item"><label>${I.t('trackBinaryValue')}</label><input type="text" data-tprop="binaryValue" data-tid="${t.id}" value="${escapeAttr(t.binaryValue || '')}"></div>
          <div class="param-item"><label>${I.t('trackBinaryTrueColor')}</label><input type="color" data-tprop="binaryTrueColor" data-tid="${t.id}" value="${t.binaryTrueColor}"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="binaryShowFalse" data-tid="${t.id}" ${t.binaryShowFalse?'checked':''}> ${I.t('trackBinaryShowFalse')}</label></div>
          <div class="param-item"><label>${I.t('trackBinaryFalseColor')}</label><input type="color" data-tprop="binaryFalseColor" data-tid="${t.id}" value="${t.binaryFalseColor}"></div>
          <div class="param-item"><label>${I.t('trackShape')}</label><select data-tprop="shape" data-tid="${t.id}">
            <option value="square" ${t.shape==='square'?'selected':''}>${I.t('optShapeSquare')}</option>
            <option value="triangle" ${t.shape==='triangle'?'selected':''}>${I.t('optShapeTriangle')}</option>
            <option value="circle" ${t.shape==='circle'?'selected':''}>${I.t('optShapeCircle')}</option>
            <option value="star" ${t.shape==='star'?'selected':''}>${I.t('optShapeStar')}</option>
            <option value="diamond2" ${t.shape==='diamond2'?'selected':''}>${I.t('optShapeDiamond')}</option>
          </select></div>
          <div class="param-item"><label>${I.t('trackOutlineColor')}</label><input type="color" data-tprop="outlineColor" data-tid="${t.id}" value="${t.outlineColor}"></div>
          <div class="param-item"><label>${I.t('trackOutlineWidth')}</label><input type="number" data-tprop="outlineWidth" data-tid="${t.id}" value="${t.outlineWidth}" min="0" max="6"></div>
          <div class="param-item"><label>${I.t('trackBinarySize')}</label><input type="number" data-tprop="binarySize" data-tid="${t.id}" value="${t.binarySize || 0}" min="0" max="200" step="1" placeholder="0"></div>

          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
        </div>
        ${legendBlock(t)}
      `;
    } else if (t.type === 'heatstrip') {
      const useCustom = !!(t.gradientStops && t.gradientStops.length >= 2);
      const stops = useCustom ? t.gradientStops : ['#ffffff', '#888888', '#000000'];
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackDataColumn')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escapeAttr(t.name)}"></div>
          <div class="param-item" style="grid-column: span 2;"><label>${I.t('trackContinuousPalette')}</label><div class="palette-slot" data-palette-continuous="${t.id}"></div></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tcustom="${t.id}" ${useCustom?'checked':''}> ${I.t('trackCustomGradient')}</label></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showBorder" data-tid="${t.id}" ${t.showBorder!==false?'checked':''}> ${I.t('trackShowBorder')}</label></div>
          <div class="param-item"><label>${I.t('trackOutlineColorLabel')}</label><input type="color" data-tprop="borderColor" data-tid="${t.id}" value="${t.borderColor}"></div>
          <div class="param-item"><label>${I.t('trackOutlineWidthLabel')}</label><input type="number" data-tprop="borderWidth" data-tid="${t.id}" value="${t.borderWidth}" min="0" max="6"></div>
          <div class="param-item"><label>${I.t('trackStripWidth')}</label><input type="number" data-tprop="width" data-tid="${t.id}" value="${t.width || 20}" min="4" max="80"></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
        </div>
        ${subTitle(I.t('trackColorSettings'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackMinValue')}</label><input type="number" data-tprop="gradientMin" data-tid="${t.id}" value="${t.gradientMin != null ? t.gradientMin : ''}" placeholder="auto"></div>
          <div class="param-item"><label>${I.t('trackMaxValue')}</label><input type="number" data-tprop="gradientMax" data-tid="${t.id}" value="${t.gradientMax != null ? t.gradientMax : ''}" placeholder="auto"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="gradientReverse" data-tid="${t.id}" ${t.gradientReverse?'checked':''}> ${I.t('trackReverse')}</label></div>
        </div>
        <div class="param-grid cols-4" style="${useCustom?'':'display:none;'}" data-customgrad="${t.id}">
          <div class="param-item"><label>${I.t('trackLeftColor')}</label><input type="color" data-tgrad="0" data-tid="${t.id}" value="${stops[0] || '#ffffff'}"></div>
          <div class="param-item"><label>${I.t('trackMidColor')}</label><input type="color" data-tgrad="1" data-tid="${t.id}" value="${stops[1] || '#888888'}"></div>
          <div class="param-item"><label>${I.t('trackRightColor')}</label><input type="color" data-tgrad="2" data-tid="${t.id}" value="${stops[2] || stops[1] || '#000000'}"></div>
        </div>
        ${legendBlock(t)}
      `;
    } else if (t.type === 'bar') {
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackDataColumn')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escapeAttr(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackBarColor')}</label><input type="color" data-tprop="barColor" data-tid="${t.id}" value="${t.barColor}"></div>
          <div class="param-item"><label>${I.t('trackTrackLength')}</label><input type="number" data-tprop="width" data-tid="${t.id}" value="${t.width || 100}" min="20" max="400"></div>
          <div class="param-item"><label>${I.t('trackBarWidth')}</label><input type="number" data-tprop="barWidth" data-tid="${t.id}" value="${t.barWidth || 0}" min="0" max="40" placeholder="0"></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
        </div>
        ${subTitle(I.t('trackBarOutline'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackBarOutlineColor')}</label><input type="color" data-tprop="barOutlineColor" data-tid="${t.id}" value="${t.barOutlineColor}"></div>
          <div class="param-item"><label>${I.t('trackBarOutlineWidth')}</label><input type="number" data-tprop="barOutlineWidth" data-tid="${t.id}" value="${t.barOutlineWidth}" min="0" max="6"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="barOutlineDashed" data-tid="${t.id}" ${t.barOutlineDashed?'checked':''}> ${I.t('trackBarOutlineDashed')}</label></div>
        </div>
        ${subTitle(I.t('trackBox'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showBox" data-tid="${t.id}" ${t.showBox?'checked':''}> ${I.t('trackShowBox')}</label></div>
          <div class="param-item"><label>${I.t('trackBoxColor')}</label><input type="color" data-tprop="boxColor" data-tid="${t.id}" value="${t.boxColor || '#bbbbbb'}"></div>
          <div class="param-item"><label>${I.t('trackBoxWidth')}</label><input type="number" data-tprop="boxWidth" data-tid="${t.id}" value="${t.boxWidth || 0.5}" min="0" max="6" step="0.1"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="boxDashed" data-tid="${t.id}" ${t.boxDashed?'checked':''}> ${I.t('trackBoxDashed')}</label></div>
        </div>
        ${subTitle(I.t('trackXAxis'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showValues" data-tid="${t.id}" ${t.showValues?'checked':''}> ${I.t('trackShowTopValues')}</label></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showAxisNumbers" data-tid="${t.id}" ${t.showAxisNumbers!==false?'checked':''}> ${I.t('trackShowAxisTicks')}</label></div>
          <div class="param-item"><label>${I.t('trackMinValue')}</label><input type="number" data-tprop="axisMin" data-tid="${t.id}" value="${t.axisMin != null ? t.axisMin : ''}" placeholder="auto"></div>
          <div class="param-item"><label>${I.t('trackMaxValue')}</label><input type="number" data-tprop="axisMax" data-tid="${t.id}" value="${t.axisMax != null ? t.axisMax : ''}" placeholder="auto"></div>
          <div class="param-item"><label>${I.t('trackAxisInterval')}</label><input type="number" data-tprop="axisInterval" data-tid="${t.id}" value="${t.axisInterval != null ? t.axisInterval : ''}" placeholder="auto"></div>
        </div>
        ${subTitle(I.t('trackRefLine'))}<div style="margin-top:4px;"><button class="btn btn-outline" data-add-refline="${t.id}" type="button" style="padding:2px 8px;font-size:12px;">${I.t('trackAddRefLine')}</button></div>
        <div class="refline-list">
          ${(t.refLines || []).map((rl, i) => `
            <div class="param-grid cols-4" style="margin-top:6px;">
              <div class="param-item"><label>${I.t('trackRefValue')}</label><input type="number" data-rlidx="${i}" data-rlprop="value" data-tid="${t.id}" value="${rl.value != null ? rl.value : ''}"></div>
              <div class="param-item"><label>${I.t('trackRefColor')}</label><input type="color" data-rlidx="${i}" data-rlprop="color" data-tid="${t.id}" value="${rl.color || '#e74c3c'}"></div>
              <div class="param-item"><label>${I.t('trackRefWidth')}</label><input type="number" data-rlidx="${i}" data-rlprop="width" data-tid="${t.id}" value="${rl.width || 1}" min="0.5" max="4" step="0.5"></div>
              <div class="param-item" style="align-self:end;display:flex;gap:4px;">
                <label class="mini-check"><input type="checkbox" data-rlidx="${i}" data-rlprop="dashed" data-tid="${t.id}" ${rl.dashed?'checked':''}> ${I.t('trackBarOutlineDashed')}</label>
                <button class="btn btn-outline" data-del-refline="${t.id}" data-rlidx="${i}" type="button" style="padding:2px 6px;font-size:12px;">×</button>
              </div>
            </div>`).join('')}
        </div>
        ${legendBlock(t)}
      `;
    } else if (t.type === 'text') {
      const vals = TT.collectUniqueValues(t);
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackDataColumn')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escapeAttr(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackAlign')}</label><select data-tprop="textAlign" data-tid="${t.id}">
            <option value="left" ${t.textAlign==='left'?'selected':''}>${I.t('trackAlignLeft')}</option>
            <option value="center" ${t.textAlign==='center'?'selected':''}>${I.t('trackAlignCenter')}</option>
            <option value="right" ${t.textAlign==='right'?'selected':''}>${I.t('trackAlignRight')}</option>
          </select></div>
          <div class="param-item"><label>${I.t('trackFontSize')}</label><input type="number" data-tprop="textFontSize" data-tid="${t.id}" value="${t.textFontSize}" min="6" max="40"></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="textBold" data-tid="${t.id}" ${t.textBold?'checked':''}> ${I.t('trackTextBold')}</label></div>
          <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="textItalic" data-tid="${t.id}" ${t.textItalic?'checked':''}> ${I.t('trackTextItalic')}</label></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
        </div>
        <div class="param-grid cols-4" style="margin-top:8px;">${paletteWithColors(t, vals)}</div>
      `;
    } else if (t.type === 'multisymbol') {
      const vals = TT.collectUniqueValues(t);
      body = `
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackMultiColHint')}</label><select data-tprop="column" data-tid="${t.id}">${colOpts(t.column || t.shapeColumn)}</select></div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escapeAttr(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackSymbolSize')}</label><input type="number" data-tprop="symbolSize" data-tid="${t.id}" value="${t.symbolSize || 0}" min="0" max="200" step="1" placeholder="0"></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
        </div>
        ${subTitle(I.t('trackUniformShape'))}
        <div class="param-grid cols-4">
          <div class="param-item"><label>${I.t('trackShape')}</label><select data-tprop="uniformShape" data-tid="${t.id}">
            <option value="square" ${t.uniformShape==='square'?'selected':''}>${I.t('optShapeSquare')}</option>
            <option value="triangle" ${t.uniformShape==='triangle'?'selected':''}>${I.t('optShapeTriangle')}</option>
            <option value="circle" ${t.uniformShape==='circle'?'selected':''}>${I.t('optShapeCircle')}</option>
            <option value="star" ${t.uniformShape==='star'?'selected':''}>${I.t('optShapeStar')}</option>
            <option value="diamond2" ${t.uniformShape==='diamond2'?'selected':''}>${I.t('optShapeDiamond')}</option>
          </select></div>
          <div class="param-item"><label>${I.t('trackOutlineColor')}</label><input type="color" data-tprop="outlineColor" data-tid="${t.id}" value="${t.outlineColor}"></div>
          <div class="param-item"><label>${I.t('trackOutlineWidth')}</label><input type="number" data-tprop="outlineWidth" data-tid="${t.id}" value="${t.outlineWidth}" min="0" max="6"></div>
        </div>
        ${shapeMapBlock(t, vals)}
        <div class="param-grid cols-4" style="margin-top:8px;">${paletteWithColors(t, vals)}</div>
        ${legendBlock(t)}
      `;
    } else if (t.type === 'stackedbar' || t.type === 'pie') {
      const colorVals = t.columns || [];
      body = `
        <div class="param-grid cols-4">
          <div class="param-item" style="grid-column: span 2;"><label>${I.t('trackMultiColData')}</label>
            <div class="multi-col-checks" style="max-height:120px;overflow:auto;border:1px solid #ddd;border-radius:4px;padding:6px;">
              ${cols.map(c => `<label class="mini-check" style="display:block;padding:2px 0;">
                <input type="checkbox" data-tcol="${t.id}" data-cname="${escapeAttr(c)}" ${(t.columns||[]).includes(c)?'checked':''}> ${escapeHtml(c)}
              </label>`).join('')}
            </div>
          </div>
          <div class="param-item"><label>${I.t('trackNameLabel')}</label><input type="text" data-tprop="name" data-tid="${t.id}" value="${escapeAttr(t.name)}"></div>
          <div class="param-item"><label>${I.t('trackOffsetLabel')}</label><input type="number" data-tprop="offset" data-tid="${t.id}" value="${t.offset}" step="1"></div>
          ${t.type === 'pie' ? `<div class="param-item"><label>${I.t('trackPieRadius')}</label><input type="number" data-tprop="pieRadius" data-tid="${t.id}" value="${t.pieRadius || 9}" min="2" max="40"></div>` : ''}
          ${t.type === 'stackedbar' ? `
            <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="percentMode" data-tid="${t.id}" ${t.percentMode?'checked':''}> ${I.t('trackPercentMode')}</label></div>
            <div class="param-item"><label>${I.t('trackTrackLength')}</label><input type="number" data-tprop="width" data-tid="${t.id}" value="${t.width || 80}" min="20" max="400"></div>
          ` : ''}
          <div class="param-item"><label>${I.t('groupPaletteLabel')}</label><div class="palette-slot" data-palette="${t.id}"></div></div>
        </div>
        ${subTitle(I.t('trackColumnColors'))}
        <div class="custom-color-list" style="display:flex;flex-wrap:wrap;gap:8px;">
          ${colorVals.map((c, i) => {
            const cols2 = global.TreePalette.getCategoricalScheme(t.palette || 'tableau10');
            const defColor = (t.columnColors && t.columnColors[c]) || cols2[i % cols2.length];
            return `<label style="display:flex;align-items:center;gap:4px;font-size:12px;">
              <input type="color" data-tcolcolor="${t.id}" data-cname="${escapeAttr(c)}" value="${escapeAttr(defColor)}"
                style="width:30px;height:22px;padding:0;border:1px solid #ccc;border-radius:3px;cursor:pointer;">
              <span>${escapeHtml(c)}</span>
              <button class="btn-del-color" data-tdelcolcolor="${t.id}" data-cname="${escapeAttr(c)}" type="button" title="delete">×</button>
            </label>`;
          }).join('')}
        </div>
        ${t.type === 'stackedbar' ? `
          ${subTitle(I.t('trackBox'))}
          <div class="param-grid cols-4">
            <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showBox" data-tid="${t.id}" ${t.showBox?'checked':''}> ${I.t('trackShowBox')}</label></div>
            <div class="param-item"><label>${I.t('trackBoxColor')}</label><input type="color" data-tprop="boxColor" data-tid="${t.id}" value="${t.boxColor || '#bbbbbb'}"></div>
            <div class="param-item"><label>${I.t('trackBoxWidth')}</label><input type="number" data-tprop="boxWidth" data-tid="${t.id}" value="${t.boxWidth || 0.5}" min="0" max="6" step="0.1"></div>
            <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="boxDashed" data-tid="${t.id}" ${t.boxDashed?'checked':''}> ${I.t('trackBoxDashed')}</label></div>
          </div>
          ${subTitle(I.t('trackXAxis'))}
          <div class="param-grid cols-4">
            <div class="param-item"><label class="mini-check"><input type="checkbox" data-tprop="showAxisNumbers" data-tid="${t.id}" ${t.showAxisNumbers!==false?'checked':''}> ${I.t('trackShowAxisTicks')}</label></div>
            <div class="param-item"><label>${I.t('trackMinValue')}</label><input type="number" data-tprop="axisMin" data-tid="${t.id}" value="${t.axisMin != null ? t.axisMin : ''}" placeholder="auto"></div>
            <div class="param-item"><label>${I.t('trackMaxValue')}</label><input type="number" data-tprop="axisMax" data-tid="${t.id}" value="${t.axisMax != null ? t.axisMax : ''}" placeholder="auto"></div>
            <div class="param-item"><label>${I.t('trackAxisInterval')}</label><input type="number" data-tprop="axisInterval" data-tid="${t.id}" value="${t.axisInterval != null ? t.axisInterval : ''}" placeholder="auto"></div>
          </div>
        ` : ''}
        ${legendBlock(t)}
      `;
    }

    return `
      <div class="track-item" data-track-id="${t.id}">
        <div class="track-header">
          <span class="track-title">${escapeHtml(typeLabel)}${I.t('trackTitleSep')}${escapeHtml(t.name || I.t('trackUntitled'))}</span>
          <button class="track-toggle" data-tid="${t.id}" type="button">${t.collapsed ? '▼' : '▲'}</button>
          <button class="track-remove" data-tid="${t.id}" type="button">×</button>
        </div>
        <div class="track-body" style="${t.collapsed ? 'display:none;' : ''}">${body}</div>
      </div>
    `;
  }).join('');

  box.querySelectorAll('[data-tprop]').forEach(el => {
    el.addEventListener('input', e => {
      const id = Number(el.dataset.tid);
      const prop = el.dataset.tprop;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      C.snapshot();
      let v;
      if (el.type === 'checkbox') v = el.checked;
      else if (el.type === 'number') v = el.value === '' ? null : Number(el.value);
      else if (prop === 'mergeGroups') v = el.value === 'true';
      else v = el.value;
      const patch = { [prop]: v };
      if ((prop === 'column' || prop === 'shapeColumn') && v && !t.name) patch.name = v;
      TT.updateCustomTrack(id, patch);
      global.TreeRenderer.draw();
      if (prop === 'column' || prop === 'shapeColumn' || prop === 'colorColumn' || prop === 'textAutoWidth') {
        setTimeout(() => refreshTrackList(container), 0);
      }
    });
  });
  box.querySelectorAll('[data-tcolor]').forEach(el => {
    el.addEventListener('input', e => {
      const id = Number(el.dataset.tcolor);
      const val = el.dataset.cval;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      C.snapshot();
      t.customColors = t.customColors || {};
      t.customColors[val] = el.value;
      t._colorCache = null;
      global.TreeRenderer.draw();
    });
  });

  box.querySelectorAll('[data-tdelcolor]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const id = Number(el.dataset.tdelcolor);
      const val = el.dataset.cval;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      C.snapshot();
      if (t.customColors) delete t.customColors[val];
      t._colorCache = null;
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });

  box.querySelectorAll('[data-tshape]').forEach(el => {
    el.addEventListener('change', e => {
      const id = Number(el.dataset.tshape);
      const val = el.dataset.sval;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      C.snapshot();
      t.shapeMap = t.shapeMap || {};
      t.shapeMap[val] = el.value;
      global.TreeRenderer.draw();
    });
  });

  box.querySelectorAll('[data-tcustom]').forEach(el => {
    el.addEventListener('change', e => {
      const id = Number(el.dataset.tcustom);
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      C.snapshot();
      if (el.checked) {
        const stops = global.TreePalette.getContinuousColors(t.gradient || 'Viridis', 3);
        TT.updateCustomTrack(id, { gradientStops: stops });
      } else TT.updateCustomTrack(id, { gradientStops: null });
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });

  box.querySelectorAll('[data-tgrad]').forEach(el => {
    el.addEventListener('input', e => {
      const id = Number(el.dataset.tid);
      const idx = Number(el.dataset.tgrad);
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      C.snapshot();
      const cur = (t.gradientStops && t.gradientStops.length >= 3) ? t.gradientStops.slice() : ['#ffffff', '#888888', '#000000'];
      cur[idx] = el.value;
      t.gradientStops = cur;
      global.TreeRenderer.draw();
    });
  });

  box.querySelectorAll('[data-tcol]').forEach(el => {
    el.addEventListener('change', e => {
      const id = Number(el.dataset.tcol);
      const cname = el.dataset.cname;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      C.snapshot();
      const set = new Set(t.columns || []);
      if (el.checked) set.add(cname); else set.delete(cname);
      t.columns = [...set];
      TT.updateCustomTrack(id, { columns: t.columns });
      global.TreeRenderer.draw();
      refreshTrackList(container);
    });
  });

  box.querySelectorAll('[data-tcolcolor]').forEach(el => {
    el.addEventListener('input', e => {
      const id = Number(el.dataset.tcolcolor);
      const cname = el.dataset.cname;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      C.snapshot();
      t.columnColors = t.columnColors || {};
      t.columnColors[cname] = el.value;
      global.TreeRenderer.draw();
    });
  });

  box.querySelectorAll('[data-tdelcolcolor]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const id = Number(el.dataset.tdelcolcolor);
      const cname = el.dataset.cname;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      C.snapshot();
      if (t.columnColors) delete t.columnColors[cname];
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });

  box.querySelectorAll('[data-add-refline]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.addRefline);
      C.snapshot();
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      t.refLines = t.refLines || [];
      t.refLines.push({ value: 1, color: '#e74c3c', width: 1, dashed: true });
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-del-refline]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.delRefline);
      const idx = Number(btn.dataset.rlidx);
      C.snapshot();
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      t.refLines.splice(idx, 1);
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });
  box.querySelectorAll('[data-rlprop]').forEach(el => {
    el.addEventListener('input', e => {
      const id = Number(el.dataset.tid);
      const idx = Number(el.dataset.rlidx);
      const prop = el.dataset.rlprop;
      const t = TT.tracks.find(x => x.id === id);
      if (!t) return;
      C.snapshot();
      const rl = t.refLines[idx];
      if (!rl) return;
      if (el.type === 'checkbox') rl[prop] = el.checked;
      else if (el.type === 'number') rl[prop] = el.value === '' ? null : Number(el.value);
      else rl[prop] = el.value;
      global.TreeRenderer.draw();
    });
  });

  box.querySelectorAll('.track-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      TT.toggleCustomTrack(Number(btn.dataset.tid));
      refreshTrackList(container);
    });
  });
  box.querySelectorAll('.track-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      C.snapshot();
      TT.removeCustomTrack(Number(btn.dataset.tid));
      refreshTrackList(container);
      global.TreeRenderer.draw();
    });
  });

  box.querySelectorAll('[data-palette]').forEach(host => {
    const id = Number(host.dataset.palette);
    const t = TT.tracks.find(x => x.id === id);
    if (!t) return;
    renderGroupPaletteDropdown(host, {
      selected: t.palette || 'tableau10',
      onSelect: (name) => {
        C.snapshot();
        const pal = global.TreePalette.getCategoricalScheme(name);
        const vals = TT.collectUniqueValues(t);
        t.customColors = {};
        vals.forEach((v, i) => { t.customColors[v] = pal[i % pal.length]; });
        TT.updateCustomTrack(id, { palette: name, customColors: t.customColors, _colorCache: null });
        global.TreeRenderer.draw();
        refreshTrackList(container);
      }
    });
  });

  box.querySelectorAll('[data-palette-continuous]').forEach(host => {
    const id = Number(host.dataset.paletteContinuous);
    const t = TT.tracks.find(x => x.id === id);
    if (!t || !global.ContinuousPalette) return;
    global.ContinuousPalette.render(host, {
      selected: t.gradient || 'Viridis',
      onSelect: (name) => {
        C.snapshot();
        TT.updateCustomTrack(id, { gradient: name, gradientStops: null });
        global.TreeRenderer.draw();
        refreshTrackList(container);
      }
    });
  });
}

function syncRangesControls(container) {
  const R = global.TreeRanges;
  if (!R) return;
  const setVal = (sel, val) => { const el = container.querySelector(sel); if (el) el.value = val; };
  const setChk = (sel, v) => { const el = container.querySelector(sel); if (el) el.checked = !!v; };
  const bindOnce = (el, evt, handler) => {
    if (!el) return;
    const key = 'bound' + evt.charAt(0).toUpperCase() + evt.slice(1);
    if (el.dataset[key] === '1') return;
    el.dataset[key] = '1';
    el.addEventListener(evt, handler);
  };

  setVal('#rangeCoverSelect', R.rangeCover || 'label');
  setVal('#rpBorder', R.rangeBorder);
  setVal('#rpBorderColor', R.rangeBorderColor);
  setVal('#rangeGradient', String(C.state.rangeGradient));
  setVal('#rangeOpacity', (1 - (Number(C.state.rangeOpacity) || 0)).toFixed(2));

  setChk('#rangeLabelTrackShowChk', R.rangeLabelTrackShow !== false);
  setChk('#rangeLabelTrackTitleShowChk', R.rangeLabelTrackTitleShow !== false);
  setVal('#rangeLabelTrackTitle', R.rangeLabelTrackTitle || 'Groups');
  setVal('#rangeLabelTrackOffset', R.rangeLabelTrackOffset || 0);
  setChk('#rangeLabelTrackAutoWidthChk', !!R.rangeLabelTrackAutoWidth);
  setVal('#rangeLabelTrackWidth', R.rangeLabelTrackWidth || 60);
  const autoW = !!R.rangeLabelTrackAutoWidth;
  const widthInput = container.querySelector('#rangeLabelTrackWidth');
  if (widthInput) widthInput.disabled = autoW;
  setVal('#rangeLabelTrackOpacity', R.rangeLabelTrackOpacity != null ? R.rangeLabelTrackOpacity : 1);
  setVal('#rangeLabelTrackTextOrientation', R.rangeLabelTrackTextOrientation || 'horizontal');
  setChk('#rangeShowLabelsSelect', !!R.rangeShowLabels);
  setVal('#rpLabelSize', R.rangeLabelSize);
  setChk('#rpLabelBoldChk', R.rangeLabelBold);
  setChk('#rpLabelItalicChk', R.rangeLabelItalic);
  setVal('#rpLabelColor', R.rangeLabelColor || '#333333');

  setChk('#showLegendChk', C.state.showLegend);
  setVal('#legendTitle', C.state.legendTitle);
  setVal('#legendColor', C.state.legendColor);

  bindOnce(container.querySelector('#rangeLabelTrackShowChk'), 'change', e => {
    C.snapshot();
    R.rangeLabelTrackShow = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackTitleShowChk'), 'change', e => {
    C.snapshot();
    R.rangeLabelTrackTitleShow = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackTitle'), 'input', e => {
    C.snapshot();
    R.rangeLabelTrackTitle = e.target.value;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackOffset'), 'input', e => {
    C.snapshot();
    R.rangeLabelTrackOffset = Number(e.target.value) || 0;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackAutoWidthChk'), 'change', e => {
    C.snapshot();
    R.rangeLabelTrackAutoWidth = e.target.checked;
    if (widthInput) widthInput.disabled = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackWidth'), 'input', e => {
    if (e.target.disabled) return;
    C.snapshot();
    R.rangeLabelTrackWidth = Math.max(10, Number(e.target.value) || 60);
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackOpacity'), 'input', e => {
    C.snapshot();
    R.rangeLabelTrackOpacity = Math.max(0, Math.min(1, Number(e.target.value)));
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeLabelTrackTextOrientation'), 'change', e => {
    C.snapshot();
    R.rangeLabelTrackTextOrientation = e.target.value;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rangeShowLabelsSelect'), 'change', e => {
    C.snapshot();
    R.rangeShowLabels = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rpLabelSize'), 'input', e => {
    R.rangeLabelSize = Number(e.target.value) || 13;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rpLabelBoldChk'), 'change', e => {
    C.snapshot();
    R.rangeLabelBold = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rpLabelItalicChk'), 'change', e => {
    C.snapshot();
    R.rangeLabelItalic = e.target.checked;
    global.TreeRenderer.draw();
  });
  bindOnce(container.querySelector('#rpLabelColor'), 'input', e => {
    R.rangeLabelColor = e.target.value;
    global.TreeRenderer.draw();
  });
}

function renderEditor() {
  const editor = document.getElementById("selectedEditor"); if (!editor) return;
  const n = T.nodeById(C.getSelectedId());
  if (!n) { editor.classList.add("hidden"); return; }
  editor.classList.remove("hidden");
  editor.innerHTML = `<h4>${I.t('editorTitle', { name: escapeHtml(T.labelOf(n)) })}</h4><div class="inner">
      <label>${I.t('editorLabel')} <input id="selLabel" type="text" value="${escapeAttr(T.labelOf(n))}"></label>
      <label>${I.t('editorColor')} <input id="selColor" type="color" value="${n.color || '#e64b35'}"></label>
      <button class="btn" id="selApply" type="button">${I.t('editorApply')}</button>
      <button class="btn btn-outline" id="selCollapse" type="button">${n.collapsed ? I.t('editorExpand') : I.t('editorCollapse')}</button>
      <button class="btn btn-outline" id="selDelete" type="button" style="color:#dc3545;border-color:#dc3545;">${I.t('editorDelete')}</button>
    </div>`;
  document.getElementById("selApply").onclick = () => { C.snapshot(); n.label = document.getElementById("selLabel").value; n.color = document.getElementById("selColor").value; global.TreeRenderer.draw(); };
  document.getElementById("selCollapse").onclick = () => { C.snapshot(); n.collapsed = !n.collapsed; global.TreeRenderer.draw(); };
  document.getElementById("selDelete").onclick = () => { C.snapshot(); n.deleted = true; global.TreeRenderer.draw(); };
}
global.TreeUI = { renderBasicPanel, renderAdvancedPanel, renderDatasetsPanel, renderEditor, renderRangesPanel: () => R.renderRangesPanel() };

})(window);
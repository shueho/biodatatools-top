(function (global) {
'use strict';
const C = global.TreeCore;
const P = global.TreeParser;
const T = global.TreeTraverse;
const I = global.TreeI18N;

function enableWheelZoom(svg) {
  if (!svg || svg.dataset.wheelZoomBound === "1") return;
  svg.dataset.wheelZoomBound = "1";
  svg.addEventListener("wheel", (e) => {
    if (!C.getRoot()) return;
    e.preventDefault();
    const st = C.state;
    const vb = C.getViewBox();
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const fx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const fy = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const z0 = Math.max(0.1, Number(st.zoom) || 1);
    const px0 = Number(st.panX) || 0, py0 = Number(st.panY) || 0;
    const vx0 = vb.x - px0, vy0 = vb.y - py0;
    const vw0 = vb.w / z0, vh0 = vb.h / z0;
    const wx = vx0 + fx * vw0, wy = vy0 + fy * vh0;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const z1 = Math.min(8, Math.max(0.3, z0 * factor));
    if (Math.abs(z1 - z0) < 1e-6) return;
    const vw1 = vb.w / z1, vh1 = vb.h / z1;
    const vx1 = wx - fx * vw1, vy1 = wy - fy * vh1;
    st.zoom = z1;
    st.panX = vb.x - vx1;
    st.panY = vb.y - vy1;
    svg.setAttribute("viewBox", `${vx1} ${vy1} ${vw1} ${vh1}`);
  }, { passive: false });
}

const TIME_KEY_PATTERNS = [
  { pattern: /^height[_\s]*median$/i,               kind: 'median', looksAge: false },
  { pattern: /^height[_\s]*mean$/i,                 kind: 'mean',   looksAge: false },
  { pattern: /^height[_\s]*95%?[_\s]*(hpd)?$/i,     kind: 'hpd',    looksAge: false },
  { pattern: /^height[_\s]*range$/i,                kind: 'hpd',    looksAge: false },
  { pattern: /^height$/i,                           kind: 'mean',   looksAge: false },
  { pattern: /^(node[_\s]*)?age$/i,                 kind: 'mean',   looksAge: true  },
  { pattern: /^(node[_\s]*)?time$/i,                kind: 'mean',   looksAge: true  }
];

function detectAndFixTimeTree(root) {
  if (!root) return false;
  const medianKeys = new Set(), hpdKeys = new Set(), meanKeys = new Set();
  let ageLike = null;
  let maxH = 0;
  T.allWalk(root, n => {
    (n.meta || []).forEach(f => {
      if (!f || !f.field) return;
      for (const def of TIME_KEY_PATTERNS) {
        if (def.pattern.test(f.field)) {
          if (def.kind === 'median') medianKeys.add(f.field);
          else if (def.kind === 'mean') meanKeys.add(f.field);
          else hpdKeys.add(f.field);
          if (ageLike === null) ageLike = def.looksAge;
          const v = Number(f.value);
          if (Number.isFinite(v) && v > maxH) maxH = v;
          break;
        }
      }
    });
  });
  const hasHeight = medianKeys.size > 0 || hpdKeys.size > 0 || meanKeys.size > 0;
  if (!hasHeight) {
    C.state.isTimeTree = false;
    C.state.timeTreeMode = false;
    C.state.timeTreeMeta = null;
    return false;
  }

  T.allWalk(root, n => {
    if (!isFinite(n.length) || n.length < 0) {
      if (n.length < 0) console.warn('[TreeApp] negative branch length fixed:', n.name || n.id, n.length);
      n.length = 0.12;
    }
  });

  const rootBl = Number(root.length) || 0;
  if (rootBl > 0) {
    root._originalRootLength = rootBl;
    root.length = 0;
  }

  if (C.state.timeScaleFactor == null
      || !isFinite(C.state.timeScaleFactor)
      || C.state.timeScaleFactor <= 0) {
    C.state.timeScaleFactor = 1;
  }

  C.state.axisReverse = true;
  C.state.forceMidpointRoot = true;
  C.state.hasRoot = true;
  C.state.showRoot = true;

  if (!C.state.lengthLabel) C.state.lengthLabel = {};
  C.state.lengthLabel.asTime = true;
  C.state.lengthLabel.timeRootAge = 0;
  C.state.lengthLabel.timeFactor = C.state.timeScaleFactor;

  C.state.isTimeTree = true;
  C.state.timeTreeMode = true;
  C.state.timeTreeMeta = {
    medianKeys: [...medianKeys],
    hpdKeys: [...hpdKeys],
    meanKeys: [...meanKeys]
  };
  return true;
}
function snapshotLeafSet(raw) {
  try {
    const snap = JSON.parse(raw);
    const set = new Set();
    if (snap.root) {
      (function walk(n) {
        const kids = (n.children || []).filter(c => !c.deleted);
        if (n.collapsed || !kids.length) set.add(String(n.name || n.label || n.id));
        else kids.forEach(walk);
      })(snap.root);
    }
    return set;
  } catch (_) { return null; }
}
function sameTree(raw) {
  if (!C.getRoot()) return false;
  const snapSet = snapshotLeafSet(raw);
  if (!snapSet) return false;
  const currentSet = new Set(T.visibleLeaves(C.getRoot()).map(l => String(l.name || l.label || l.id)));
  if (snapSet.size !== currentSet.size) return false;
  for (const s of snapSet) if (!currentSet.has(s)) return false;
  return true;
}
function applyLoadedState(raw, opts) {
  const keepRoot = !!(opts && opts.keepRoot);
  const currentRoot = C.getRoot();
  let snapshotRanges = new Map();
  try {
    const snap = JSON.parse(raw);
    if (keepRoot && snap.root) {
      (function walk(n) {
        const kids = (n.children || []).filter(c => !c.deleted);
        if (n.collapsed || !kids.length) {
          if (n.rangeId != null) snapshotRanges.set(String(n.name || n.label || n.id), n.rangeId);
        } else kids.forEach(walk);
      })(snap.root);
    }
  } catch (_) {}
  C.applySnapshot(raw);
  C.state.zoom = 1;
  C.state.panX = 0;
  C.state.panY = 0;
  if (keepRoot && currentRoot) {
    C.setRoot(currentRoot);
    C.restoreParents(currentRoot, null);
    T.allWalk(currentRoot, n => {
      const kids = (n.children || []).filter(c => !c.deleted);
      if (n.collapsed || !kids.length) {
        const key = String(n.name || n.label || n.id);
        if (snapshotRanges.has(key)) n.rangeId = snapshotRanges.get(key);
      }
    });
  }
  if (global.TreeTracks && global.TreeTracks.tracks) {
    global.TreeTracks.tracks.forEach(t => global.TreeTracks.refreshTrackData(t));
  }
  C.setSelectedId(null);
  C.setSelectedBranchId(null);
  global.TreeAppNodes.renderNodeTable();
  if (!global.TreeAppData.leafData.rows.length) global.TreeAppData.rebuildLeafRowsFromTree();
  global.TreeAppData.renderLeafDataPreview();
  global.TreeAppData.refreshDataSummary();

  if (global.TreeUIBasic) global.TreeUIBasic.renderBasicPanel(document.getElementById("basicStylePanel"));
  if (global.TreeUIAdvanced) global.TreeUIAdvanced.renderAdvancedPanel(document.getElementById("advancedStylePanel"));
  if (global.TreeUITracks) global.TreeUITracks.renderDatasetsPanel(document.getElementById("datasetsPanel"));
  bindAllControls();
  syncControls();
  if (typeof rebuildSidebarNav === 'function') rebuildSidebarNav();
  drawTree();
}
function renderTreeImportPanel() {
  const c = document.getElementById("treeImportPanel");
  if (!c) return;
  c.innerHTML = `
    <div class="mode-tabs">
      <label><input type="radio" name="treeMode" value="file" checked> ${I.t('importUploadFile')}</label>
      <label><input type="radio" name="treeMode" value="text"> ${I.t('importPasteText')}</label>
    </div>
    <div class="file-input">
      <input type="file" id="treeFileInput" class="import-file"
             accept=".nwk,.tree,.tre,.newick,.nex,.nexus,.xml,.phyloxml,.nhx,.txt">
    </div>
    <div class="text-input">
      <textarea id="treeInput" class="import-text" placeholder="${I.t('importPlaceholder')}"></textarea>
    </div>
    <div class="info-box">${I.t('importInfoBox')}</div>
    <div class="btn-group">
      <button type="button" class="btn" id="loadTreeBtn">${I.t('importLoadTree')}</button>
      <button type="button" class="btn" id="loadExampleTimeBtn">${I.t('importLoadExampleTime')}</button>
      <button type="button" class="btn" id="loadExampleBIBtn">${I.t('importLoadExampleBI')}</button>
      <button type="button" class="btn" id="loadExampleMLBtn">${I.t('importLoadExampleML')}</button>
      <button type="button" class="btn" id="loadTreeStateBtn">${I.t('importLoadState')}</button>
      <input type="file" id="treeStateFile" accept=".json" style="display:none;">
    </div>
  `;

  const textarea = document.getElementById("treeInput");
  const fileInput = document.getElementById("treeFileInput");

  function applyTreeMode() {
    const mode = c.querySelector('input[name="treeMode"]:checked').value;
    if (mode === "file") { fileInput.disabled = false; textarea.disabled = true; }
    else { fileInput.disabled = true; textarea.disabled = false; fileInput.value = ""; }
  }
  applyTreeMode();
  c.querySelectorAll('input[name="treeMode"]').forEach(r => r.addEventListener("change", applyTreeMode));

  fileInput?.addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      loadTree(ev.target.result);
      showTreeMsg(I.t('treeMsgFileLoaded', { name: f.name }), "success");
    };
    reader.readAsText(f);
  });
  document.getElementById("loadTreeBtn")?.addEventListener("click", () => {
    const mode = c.querySelector('input[name="treeMode"]:checked').value;
    if (mode === "file") {
      if (!fileInput.files.length) { showTreeMsg(I.t('treeMsgNoFile'), "error"); return; }
      const reader = new FileReader();
      reader.onload = ev => loadTree(ev.target.result);
      reader.readAsText(fileInput.files[0]);
    } else {
      loadTree(textarea.value);
    }
  });

  const loadExample = async (filename, btn) => {
    const textRadio = c.querySelector('input[name="treeMode"][value="text"]');
    if (textRadio && !textRadio.checked) { textRadio.checked = true; textRadio.dispatchEvent(new Event("change")); }
    const oldText = btn.textContent;
    btn.textContent = I.t('importLoading');
    btn.disabled = true;
    showTreeMsg(I.t('treeMsgLoadingExample'), '');
    const JSDELIVR_PATH = `shueho/biodatatools-top@main/BioStatPlot/COMMON/tree/${filename}`;
    const REMOTE_RAW = `https://raw.githubusercontent.com/shueho/biodatatools-top/main/BioStatPlot/COMMON/tree/${filename}`;
    const candidates = [
      `https://jsd.onmicrosoft.cn/gh/${JSDELIVR_PATH}`,
      `https://fastly.jsdelivr.net/gh/${JSDELIVR_PATH}`,
      `https://gcore.jsdelivr.net/gh/${JSDELIVR_PATH}`,
      `https://cdn.jsdelivr.net/gh/${JSDELIVR_PATH}`,
      REMOTE_RAW
    ];
    async function fetchWithTimeout(url, ms = 8000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.text();
      } finally { clearTimeout(timer); }
    }
    let text = '';
    let lastErr = null;
    for (const url of candidates) {
      try {
        text = await fetchWithTimeout(url);
        if (text && text.trim()) break;
      } catch (err) { lastErr = err; }
    }
    btn.textContent = oldText;
    btn.disabled = false;
    if (!text || !text.trim()) {
      const msg = lastErr
        ? I.t('treeMsgLoadExampleFail', { msg: lastErr.message, filename })
        : I.t('treeMsgLoadExampleFailNoErr', { filename });
      if (confirm(msg)) {
        window.open(`https://github.com/shueho/biodatatools-top/blob/main/BioStatPlot/COMMON/tree/${filename}`, '_blank');
      }
      showTreeMsg(I.t('treeMsgLoadExampleFailNoErr', { filename }), 'error');
      return;
    }
    textarea.value = text;
    loadTree(text);
  };
  document.getElementById("loadExampleTimeBtn")?.addEventListener("click", (e) => loadExample('time.tree', e.target));
  document.getElementById("loadExampleBIBtn")?.addEventListener("click", (e) => loadExample('BI.tre', e.target));
  document.getElementById("loadExampleMLBtn")?.addEventListener("click", (e) => loadExample('ml.contree', e.target));

  document.getElementById("loadTreeStateBtn")?.addEventListener("click", () => {
    document.getElementById("treeStateFile")?.click();
  });
  document.getElementById("treeStateFile")?.addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const raw = ev.target.result;
        applyLoadedState(raw, { keepRoot: sameTree(raw) });
        showTreeMsg(I.t('importStateLoaded'), "success");
      } catch (err) { showTreeMsg(I.t('importStateLoadFail', { msg: err.message }), "error"); }
    };
    reader.readAsText(f);
    e.target.value = "";
  });
}
function showTreeMsg(msg, type) {
  const el = document.getElementById("treeMsg");
  if (!el) return;
  el.className = "tip-text " + (type || "");
  el.textContent = msg;
  setTimeout(() => {
    if (el.textContent === msg) { el.textContent = ""; el.className = "tip-text"; }
  }, 4000);
}
function loadTree(text) {
  try {
    if (!text || !String(text).trim()) { showTreeMsg(I.t('treeMsgEmpty'), "error"); return; }
    const fmt = (P.detectTreeFormat && P.detectTreeFormat(text)) || "newick";
    if (fmt === "empty") { showTreeMsg(I.t('treeMsgEmpty2'), "error"); return; }
    if (fmt === "xml") { showTreeMsg(I.t('treeMsgXmlUnsupport'), "error"); return; }
    const t = (P.parseTree && P.parseTree(text)) || P.parseNewick(text);
    if (!t) { showTreeMsg(I.t('treeMsgParseFail'), "error"); return; }
    const leafCount = T.visibleLeaves(t).length;
    if (leafCount < 2) { showTreeMsg(I.t('treeMsgTooFew', { n: leafCount }), "error"); return; }

    C.resetIdSeq();
    P.assign(t, null);
    C.setRoot(t);

    if (global.TreeRanges) {
      global.TreeRanges.clearAllColorRanges();
      global.TreeRanges.rangeSeq = 0;
      if (Array.isArray(global.TreeRanges.geoTimeTracks)) {
        global.TreeRanges.geoTimeTracks.length = 0;
      }
      global.TreeRanges.geoTrackSeq = 0;
      global.TreeRanges.geoEntrySeq = 0;
      global.TreeRanges.geoTimeShow = false;
    }
    if (global.TreeTracks && Array.isArray(global.TreeTracks.tracks)) {
      global.TreeTracks.tracks.length = 0;
    }
    C.state.legendOffsetX = 0;
    C.state.legendOffsetY = 0;

    const isTime = detectAndFixTimeTree(t);

    if (isTime) {
      C.state.hasRoot = true;
      C.state.forceMidpointRoot = true;
      C.state.showRoot = true;
    } else if (t.rootFlag === false) {
      C.state.hasRoot = false;
    } else if (t.rootFlag === true) {
      C.state.hasRoot = true;
    } else {
      C.state.hasRoot = (t._hasExplicitLength === true && Number(t.length) > 0);
    }

    global.TreeAppData.rebuildLeafRowsFromTree();
    global.TreeAppData.renderLeafDataPreview();
    global.TreeAppData.refreshDataSummary();
    global.TreeAppNodes.renderNodeTable();

    if (global.TreeUIBasic) global.TreeUIBasic.renderBasicPanel(document.getElementById("basicStylePanel"));
    if (global.TreeUIAdvanced) global.TreeUIAdvanced.renderAdvancedPanel(document.getElementById("advancedStylePanel"));
    if (global.TreeUITracks) global.TreeUITracks.renderDatasetsPanel(document.getElementById("datasetsPanel"));
    bindAllControls();
    syncControls();
    rebuildSidebarNav();

    const fmtLabel = { newick: "Newick", nexus: "NEXUS", phyloxml: "PhyloXML" }[fmt] || fmt;
    const rootSuffix = C.state.hasRoot ? I.t('treeMsgHasRoot') : I.t('treeMsgNoRoot');
    let extraMsg = '';
    if (t._alternativeTrees > 1) {
      extraMsg = '（该 NEXUS 含 ' + t._alternativeTrees + ' 棵树，已加载 "' +
                 (t._chosenTreeName || 'tree1') + '"）';
    }
    showTreeMsg((isTime
      ? I.t('treeMsgLoadedTime', { fmt: fmtLabel, n: leafCount }) + rootSuffix
      : I.t('treeMsgLoaded', { fmt: fmtLabel, n: leafCount }) + rootSuffix) + extraMsg,
      "success");
    drawTree();
  } catch (e) {
    console.error("[TreeApp] loadTree error:", e);
    showTreeMsg("❌ " + (e && e.message ? e.message : e), "error");
  }
}
function showTip(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = "tip-text " + (type || "");
  el.textContent = msg;
  setTimeout(() => {
    if (el.textContent === msg) { el.textContent = ""; el.className = "tip-text"; }
  }, 5000);
}
function showToolbar(msg) {
  const el = document.getElementById("toolbarTip");
  if (!el) return;
  el.innerHTML = msg ? `<span class="success">${msg}</span>` : "";
}
function drawTree() {
  if (!C.getRoot()) { showTip("msgTip3", I.t('treeMsgNoTree'), "error"); return; }
  if (!window.d3) {
    showTip("msgTip3", I.t('treeMsgD3Loading'));
    if (global.PlotBootstrap && PlotBootstrap.ensureD3) {
      PlotBootstrap.ensureD3().then(() => drawTreeActual()).catch(() => showTip("msgTip3", I.t('treeMsgD3Fail'), "error"));
    } else drawTreeActual();
    return;
  }
  drawTreeActual();
}
function drawTreeActual() {
  const preview = document.getElementById("chartPreview");
  if (!preview) return;
  preview.style.position = "relative";
  let svg = document.getElementById("treeSvg");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "treeSvg";
    svg.style.width = "100%";
    svg.style.height = "600px";
    svg.style.display = "block";
    svg.style.cursor = "default";
    preview.insertBefore(svg, preview.firstChild);
    C.setSvg(svg);
    if (global.TreeDrag) global.TreeDrag.enableDrag(svg);
    if (global.TreeDrag && global.TreeDrag.bindSvgClick) global.TreeDrag.bindSvgClick(svg);
    enableWheelZoom(svg);
    const placeholder = preview.querySelector(".placeholder");
    if (placeholder) placeholder.remove();
  } else if (C.getSvg() !== svg) {
    C.setSvg(svg);
    if (global.TreeDrag) global.TreeDrag.enableDrag(svg);
    if (global.TreeDrag && global.TreeDrag.bindSvgClick) global.TreeDrag.bindSvgClick(svg);
    enableWheelZoom(svg);
  }
  const root = C.getRoot();
  if (root) {
    if (C.state.isTimeTree) {
      C.state.hasRoot = true;
      C.state.forceMidpointRoot = true;
      C.state.showRoot = true;
    } else if (root.rootFlag === false) {
      C.state.hasRoot = false;
    } else if (root.rootFlag === true) {
      C.state.hasRoot = true;
    } else {
      C.state.hasRoot = (root._hasExplicitLength === true && Number(root.length) > 0);
    }
  }
  global.TreeUI.refreshTreeView();
  const vb = C.getViewBox();
  const aspect = vb.h / Math.max(1, vb.w);
  const containerW = Math.max(360, preview.clientWidth - 20);
  svg.style.height = Math.min(1000, Math.max(400, containerW * aspect)) + "px";
  const svgBtn = document.getElementById("exportSvgBtn");
  const pngBtn = document.getElementById("exportPngBtn");
  if (svgBtn) svgBtn.disabled = false;
  if (pngBtn) pngBtn.disabled = false;
  showTip("msgTip3", I.t('treeMsgDrawOK'), "success");
  showToolbar(I.t('treeMsgDrawOK'));
}

function bindAllControls() {
  const on = (el, event, handler) => {
    if (!el) return;
    const k = 'bound' + event.charAt(0).toUpperCase() + event.slice(1);
    if (el.dataset[k] === '1') return;
    el.dataset[k] = '1';
    el.addEventListener(event, handler);
  };
  const bindSel = (id, key, cast) => {
    const el = document.getElementById(id);
    on(el, "change", e => {
      let v = e.target.value;
      if (cast === "bool") v = v === "true";
      else if (cast === "num") v = Number(v);
      C.state[key] = v;
      global.TreeUI.refreshTreeView();
    });
  };
  const bindInp = (id, key, cast) => {
    const el = document.getElementById(id);
    on(el, "input", e => {
      C.state[key] = cast === "num" ? Number(e.target.value) : e.target.value;
      global.TreeUI.refreshTreeView();
    });
  };
  const bindChk = (id, key) => {
    const el = document.getElementById(id);
    on(el, "change", e => {
      C.state[key] = e.target.checked;
      global.TreeUI.refreshTreeView();
    });
  };
  const bindPath = (id, path, cast) => {
    const el = document.getElementById(id);
    on(el, "input", () => {
      const parts = path.split(".");
      let obj = C.state;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      const last = parts[parts.length - 1];
      let v;
      if (el.type === "checkbox") v = el.checked;
      else if (cast === "num") v = Number(el.value);
      else if (cast === "bool") v = el.value === "true";
      else v = el.value;
      obj[last] = v;
      global.TreeUI.refreshTreeView();
    });
  };
  const btn = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.onclick = fn;
  };

  bindSel("fontFamily", "fontFamily");
  bindSel("ignoreLength", "ignoreLength", "bool");
  bindSel("branchLengthField", "branchLengthField");
  bindSel("bootstrapRangeSelect", "bootstrapRange");
  bindSel("invertSelect", "invert", "bool");   
on(document.getElementById("forceMidpointRoot"), "change", e => {
  C.state.forceMidpointRoot = e.target.checked;
  if (e.target.checked) {
    C.state.hasRoot = true;
    C.state.showRoot = true;
  }
  global.TreeUI.refreshTreeView();
});
  bindSel("labelsSelect", "labels", "bool");
  bindSel("labelPositionSelect", "labelPosition");
  bindInp("fontSize", "fontSize", "num");
  bindInp("labelColor", "labelColor");
  bindChk("boldChk", "bold");
  bindChk("italicChk", "italic");
  bindInp("branchWidth", "branchWidth", "num");
  bindInp("branchColor", "branchColor");
  bindSel("extendBranchesSelect", "extendBranches", "bool");
  bindSel("dashedSelect", "dashed", "bool");
  bindInp("dashSize", "dashSize", "num");
  bindInp("circularInvertInnerRadius", "circularInvertInnerRadius", "num");


  on(document.getElementById("sortModeSelect"), "change", e => {
    C.state.sortMode = e.target.value;
    global.TreeUI.refreshTreeView();
  });
  on(document.getElementById("leafReverseSelect"), "change", e => {
    const v = e.target.value === "true";
    if (C.state.leafReverse === v) return;
    C.state.leafReverse = v;
    if (C.getRoot()) {
      T.allWalk(C.getRoot(), n => {
        if (n.children && n.children.length > 1) n.children.reverse();
      });
    }
    global.TreeUI.refreshTreeView();
  });

  bindSel("axisShowSelect", "axisShow", "bool");
  bindSel("axisPosSelect", "axisPos");
  bindInp("axisRotationInput", "axisRotation", "num");
  bindChk("axisReverseChk", "axisReverse");
  bindInp("axisMinValInput", "axisMinVal", "num");
  bindInp("axisMaxValInput", "axisMaxVal", "num");
  bindPath("tickLabelFontSize", "tickLabelFontSize", "num");
  bindPath("tickLabelBold", "tickLabelBold");
  bindPath("tickLabelItalic", "tickLabelItalic");

  bindPath("tickPrimaryInterval", "tickPrimary.interval", "num");
  bindPath("tickPrimaryShowLabels", "tickPrimary.showLabels", "bool");
  bindPath("tickPrimaryShowGrid", "tickPrimary.showGrid", "bool");
  bindPath("tickPrimaryGridDashed", "tickPrimary.gridDashed", "bool");
  bindPath("tickPrimaryGridWidth", "tickPrimary.gridWidth", "num");
  bindPath("tickPrimaryGridColor", "tickPrimary.gridColor");

  on(document.getElementById("tickPrimaryCustom"), "change", e => {
    const raw = String(e.target.value == null ? "" : e.target.value).trim();
    const arr = raw
      ? raw.split(/[,;\s]+/).map(s => Number(s)).filter(v => isFinite(v) && v >= 0)
      : [];
    C.state.tickPrimary.customTicks = arr;
    global.TreeUI.refreshTreeView();
  });
  bindPath("customTickColor", "customTickColor");
  bindPath("customTickBold", "customTickBold");

  bindPath("tickSecondaryInterval", "tickSecondary.interval", "num");
  bindPath("tickSecondaryShowLabels", "tickSecondary.showLabels", "bool");
  bindPath("tickSecondaryShowGrid", "tickSecondary.showGrid", "bool");
  bindPath("tickSecondaryGridDashed", "tickSecondary.gridDashed", "bool");
  bindPath("tickSecondaryGridWidth", "tickSecondary.gridWidth", "num");
  bindPath("tickSecondaryGridColor", "tickSecondary.gridColor");

  bindChk("showScaleBoxChk", "showScaleBox");
  bindInp("scaleBoxSizeInput", "scaleBoxSize", "num");
  bindInp("scaleBoxTitleInput", "scaleBoxTitle");

  bindInp("rootTickValueInput", "rootTickValue", "num");
  bindInp("timeScaleFactorInput", "timeScaleFactor", "num");

  bindSel("nodeIdsSelect", "nodeIds", "bool");
  bindSel("showLengthSelect", "showLength", "bool");
  bindSel("showBootstrapSelect", "showBootstrap", "bool");
  bindSel("bootstrapFormat", "bootstrapFormat");
  bindInp("scaleH", "scaleH", "num");
  bindInp("scaleV", "scaleV", "num");
  bindSel("leafSymbolsSelect", "leafSymbols", "bool");
  bindSel("leafSymShape", "leafSymShape");
  bindInp("leafSymSize", "leafSymSize", "num");
  bindInp("leafSymFill", "leafSymFill");
  bindInp("leafSymBC", "leafSymBC");
  bindInp("leafSymBW", "leafSymBW", "num");
  bindSel("internalSymbolsSelect", "internalSymbols", "bool");
  bindSel("intSymShape", "intSymShape");
  bindInp("intSymSize", "intSymSize", "num");
  bindInp("intSymFill", "intSymFill");
  bindInp("intSymBC", "intSymBC");
  bindInp("intSymBW", "intSymBW", "num");
  bindChk("showLegendChk", "showLegend");
  bindInp("legendTitle", "legendTitle");
  bindInp("legendColor", "legendColor");
  bindInp("ringWidth", "ringWidth", "num");
  bindInp("ringGap", "ringGap", "num");
  bindInp("ringStroke", "ringStroke");
  bindInp("ringStrokeWidth", "ringStrokeWidth", "num");

  on(document.getElementById("rpBorder"), "input", e => { global.TreeRanges.rangeBorder = Number(e.target.value) || 0; global.TreeUI.refreshTreeView(); });
  on(document.getElementById("rpBorderColor"), "input", e => { global.TreeRanges.rangeBorderColor = e.target.value; global.TreeUI.refreshTreeView(); });
  on(document.getElementById("rangeGradient"), "change", e => { C.state.rangeGradient = e.target.value === "true"; global.TreeUI.refreshTreeView(); });
  on(document.getElementById("rangeOpacity"), "input", e => {
    const transparency = Math.max(0, Math.min(1, Number(e.target.value)));
    C.state.rangeOpacity = 1 - transparency;
    global.TreeUI.refreshTreeView();
  });
  on(document.getElementById("rangeCoverSelect"), "change", e => {
    global.TreeRanges.rangeCover = e.target.value;
    global.TreeUI.refreshTreeView();
  });
  on(document.getElementById("rangeShowLabelsSelect"), "change", e => {
    global.TreeRanges.rangeShowLabels = e.target.checked;
    global.TreeUI.refreshTreeView();
  });
  on(document.getElementById("rpLabelBoldChk"), "change", e => {
    global.TreeRanges.rangeLabelBold = e.target.checked;
    global.TreeUI.refreshTreeView();
  });
  on(document.getElementById("rpLabelItalicChk"), "change", e => {
    global.TreeRanges.rangeLabelItalic = e.target.checked;
    global.TreeUI.refreshTreeView();
  });
  on(document.getElementById("rpList"), "click", e => {
    const x = e.target.closest(".rp-x");
    if (x) {
      global.TreeRanges.removeRange(Number(x.dataset.range));
      global.TreeUI.refreshTreeView();
    }
  });
  on(document.getElementById("rpList"), "input", e => {
    const inp = e.target.closest(".rp-color-edit");
    if (!inp) return;
    const range = global.TreeRanges.colorRanges.find(r => r.id === Number(inp.dataset.rangeColor));
    if (!range) return;
    range.color = inp.value;
  });
  on(document.getElementById("rpList"), "change", e => {
    const lb = e.target.closest(".rp-lb-edit");
    if (lb) {
      const r = global.TreeRanges.colorRanges.find(x => x.id === Number(lb.dataset.range));
      if (r) { r.label = lb.value || ""; global.TreeUI.refreshTreeView(); }
    }
    const ce = e.target.closest(".rp-color-edit");
    if (ce) {
      const range = global.TreeRanges.colorRanges.find(r => r.id === Number(ce.dataset.rangeColor));
      if (range) { range.color = ce.value; global.TreeUI.refreshTreeView(); }
    }
  });
  on(document.getElementById("rpLabelSize"), "input", e => {
    global.TreeRanges.rangeLabelSize = Number(e.target.value) || 13;
    global.TreeUI.refreshTreeView();
  });
  on(document.getElementById("rpLabelColor"), "input", e => {
    global.TreeRanges.rangeLabelColor = e.target.value;
    global.TreeUI.refreshTreeView();
  });

  btn("autoCollapseBtn", () => {
    const kind = document.getElementById("autoCollapse").value;
    const t = Math.max(1, Number(document.getElementById("collapseThreshold").value) || 3);
    let count = 0;
    if (kind === "short") {
      T.allWalk(C.getRoot(), n => {
        if (!T.isLeaf(n) && n !== C.getRoot() && T.visibleLeaves(n).length <= t) { n.collapsed = true; count++; }
      });
    }
    if (kind === "long") {
      T.allWalk(C.getRoot(), n => {
        if (!T.isLeaf(n) && n !== C.getRoot() && T.visibleLeaves(n).length >= t) { n.collapsed = true; count++; }
      });
    }
    const st = document.getElementById("status");
    if (st) st.textContent = I.t('statusCollapsed', { n: count });
    global.TreeUI.refreshTreeView();
    global.TreeAppNodes.renderNodeTable();
  });
  btn("expandAllBtn", () => {
    let count = 0;
    T.allWalk(C.getRoot(), n => {
      if (n.collapsed) { n.collapsed = false; count++; }
      if (n.deleted) { n.deleted = false; count++; }
    });
    const st = document.getElementById("status");
    if (st) st.textContent = I.t('statusExpanded', { n: count });
    global.TreeUI.refreshTreeView();
    global.TreeAppNodes.renderNodeTable();
  });
  btn("matchCollapseBtn", () => {
    const q = document.getElementById("matchText").value.trim().toLowerCase();
    if (!q) return;
    const scope = document.getElementById("matchScope").value || "leaf";
    let hideCount = 0, collapseCount = 0;
    T.allWalk(C.getRoot(), n => {
      if (n === C.getRoot()) return;
      const isL = T.isLeaf(n), lbl = T.labelOf(n).toLowerCase();
      if (!lbl.includes(q)) return;
      if (scope === "leaf" && isL) { n.deleted = true; hideCount++; }
      else if (scope === "internal" && !isL) { n.collapsed = true; collapseCount++; }
      else if (scope === "both") {
        if (isL) { n.deleted = true; hideCount++; }
        else { n.collapsed = true; collapseCount++; }
      }
    });
    const st = document.getElementById("status");
    if (st) st.textContent = I.t('statusHidden', { h: hideCount, c: collapseCount });
    global.TreeUI.refreshTreeView();
    global.TreeAppNodes.renderNodeTable();
  });
  btn("bulkEditBtn", () => {
    const prefix = prompt(I.t('alertPrefixPrompt'), "");
    if (prefix !== null && prefix !== "") {
      T.visibleLeaves(C.getRoot()).forEach(n => { n.label = prefix + T.labelOf(n); });
      global.TreeUI.refreshTreeView();
    }
  });
}

function syncControls() {
  const st = C.state;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") el.checked = !!val;
    else el.value = val;
  };
  set("fontFamily", st.fontFamily);
  set("ignoreLength", String(st.ignoreLength));
  set("invertSelect", String(st.invert));
  set("branchLengthField", st.branchLengthField || "");
  set("bootstrapRangeSelect", st.bootstrapRange || "auto");
  set("forceMidpointRoot", st.forceMidpointRoot);
  set("sortModeSelect", st.sortMode);
  set("leafReverseSelect", String(st.leafReverse));
  set("labelsSelect", String(st.labels));
  set("labelPositionSelect", st.labelPosition);
  set("fontSize", st.fontSize);
  set("labelColor", st.labelColor);
  set("boldChk", st.bold);
  set("italicChk", st.italic);
  set("branchWidth", st.branchWidth);
  set("branchColor", st.branchColor);
  set("extendBranchesSelect", String(st.extendBranches));
  set("dashedSelect", String(st.dashed));
  set("dashSize", st.dashSize);
  set("axisShowSelect", String(st.axisShow));
  set("axisPosSelect", st.axisPos);
  set("axisRotationInput", st.axisRotation);
  set("axisReverseChk", st.axisReverse);
  set("axisMinValInput", st.axisMinVal != null ? st.axisMinVal : '');
  set("axisMaxValInput", st.axisMaxVal != null ? st.axisMaxVal : 0);
  set("tickLabelFontSize", st.tickLabelFontSize);
  set("tickLabelBold", st.tickLabelBold);
  set("tickLabelItalic", st.tickLabelItalic);
  set("tickPrimaryInterval", st.tickPrimary.interval);
  set("tickPrimaryShowLabels", String(st.tickPrimary.showLabels));
  set("tickPrimaryShowGrid", String(st.tickPrimary.showGrid));
  set("tickPrimaryGridDashed", String(st.tickPrimary.gridDashed));
  set("tickPrimaryGridWidth", st.tickPrimary.gridWidth);
  set("tickPrimaryGridColor", st.tickPrimary.gridColor || "#dddddd");
  set("tickPrimaryCustom", (st.tickPrimary.customTicks || []).join(","));
  set("customTickColor", st.customTickColor || "#c0392b");
  set("customTickBold", st.customTickBold);
  set("tickSecondaryInterval", st.tickSecondary.interval);
  set("tickSecondaryShowLabels", String(st.tickSecondary.showLabels));
  set("tickSecondaryShowGrid", String(st.tickSecondary.showGrid));
  set("tickSecondaryGridDashed", String(st.tickSecondary.gridDashed));
  set("tickSecondaryGridWidth", st.tickSecondary.gridWidth);
  set("tickSecondaryGridColor", st.tickSecondary.gridColor || "#dddddd");
  set("showScaleBoxChk", st.showScaleBox !== false);
  set("scaleBoxSizeInput", st.scaleBoxSize || 0);
  set("scaleBoxTitleInput", st.scaleBoxTitle || "Scale");
  set("rootTickValueInput", st.rootTickValue != null ? st.rootTickValue : 0);
  set("timeScaleFactorInput", st.timeScaleFactor);
  set("nodeIdsSelect", String(st.nodeIds));
  set("showLengthSelect", String(st.showLength));
  set("showBootstrapSelect", String(st.showBootstrap));
  set("bootstrapFormat", st.bootstrapFormat);
  set("scaleH", st.scaleH);
  set("scaleV", st.scaleV);
  set("leafSymbolsSelect", String(st.leafSymbols));
  set("leafSymShape", st.leafSymShape);
  set("leafSymSize", st.leafSymSize);
  set("leafSymFill", st.leafSymFill);
  set("leafSymBC", st.leafSymBC);
  set("leafSymBW", st.leafSymBW);
  set("internalSymbolsSelect", String(st.internalSymbols));
  set("intSymShape", st.intSymShape);
  set("intSymSize", st.intSymSize);
  set("intSymFill", st.intSymFill);
  set("intSymBC", st.intSymBC);
  set("intSymBW", st.intSymBW);
  set("showLegendChk", st.showLegend);
  set("legendTitle", st.legendTitle);
  set("legendColor", st.legendColor);
  set("ringWidth", st.ringWidth);
  set("ringGap", st.ringGap);
  set("ringStroke", st.ringStroke);
  set("ringStrokeWidth", st.ringStrokeWidth);
}

function rebuildSidebarNav() {
  const sidebar = document.getElementById("treeSidebar");
  if (!sidebar) return;
  const nav = sidebar.querySelector(".tsb-nav");
  if (!nav) return;
  nav.innerHTML = "";
  const cards = document.querySelectorAll(".step-card");
  cards.forEach((card, ci) => {
    const titleEl = card.querySelector(".step-title");
    if (!titleEl) return;
    if (!card.id) card.id = "stepCard" + ci;
    const a = document.createElement("a");
    a.href = "#" + card.id;
    a.className = "tsb-card-link";
    a.textContent = titleEl.textContent.trim();
    a.addEventListener("click", (e) => {
      e.preventDefault();
      card.scrollIntoView({ behavior: "smooth", block: "start" });
      card.classList.add("flash-highlight");
      setTimeout(() => card.classList.remove("flash-highlight"), 1200);
    });
    nav.appendChild(a);
    const seen = new Set();
    card.querySelectorAll(".param-panel-title").forEach((mt, mi) => {
      const panel = mt.closest(".param-panel");
      if (!panel) return;
      const txt = mt.textContent.trim();
      if (!txt || seen.has(txt)) return;
      seen.add(txt);
      if (!panel.id) panel.id = card.id + "-mod" + mi;
      const ma = document.createElement("a");
      ma.href = "#" + panel.id;
      ma.className = "tsb-mod-link";
      ma.textContent = txt;
      ma.addEventListener("click", (e) => {
        e.preventDefault();
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
        panel.classList.add("flash-highlight");
        setTimeout(() => panel.classList.remove("flash-highlight"), 1200);
      });
      nav.appendChild(ma);
    });
  });
}

function initSidebar() {
  const sidebar = document.getElementById("treeSidebar");
  const toggle = document.getElementById("tsbToggle");
  if (!sidebar || !toggle) return;
  const KEY = "tree_sidebar_collapsed";
  if (localStorage.getItem(KEY) === "1") sidebar.classList.add("collapsed");
  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    localStorage.setItem(KEY, sidebar.classList.contains("collapsed") ? "1" : "0");
  });
  function updatePos() {
    const header = document.getElementById("common-header");
    let top = 130;
    if (header) {
      const cs = getComputedStyle(header);
      const rect = header.getBoundingClientRect();
      if (cs.position === "fixed" || cs.position === "sticky") top = Math.max(0, rect.bottom) + 48;
      else top = Math.max(8, rect.bottom + 32);
    }
    if (window.innerWidth <= 900) return;
    sidebar.style.top = top + "px";
    sidebar.style.maxHeight = `calc(100vh - ${top + 16}px)`;
  }
  updatePos();
  setTimeout(updatePos, 200);
  setTimeout(updatePos, 800);
  window.addEventListener("resize", updatePos);
  window.addEventListener("scroll", updatePos, { passive: true });
  const header = document.getElementById("common-header");
  if (header && window.ResizeObserver) {
    const ro = new ResizeObserver(() => updatePos());
    ro.observe(header);
  }
  if (header && window.MutationObserver) {
    const mo = new MutationObserver(() => updatePos());
    mo.observe(header, { childList: true, subtree: true, attributes: true });
  }
  const nav = sidebar.querySelector(".tsb-nav");
  if (nav) {
    nav.addEventListener("click", e => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      e.preventDefault();
      const id = a.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.classList.add("flash-highlight");
        setTimeout(() => target.classList.remove("flash-highlight"), 1200);
      }
    });
  }
  rebuildSidebarNav();
}

function init() {
  if (window.__treeAppInited) return;
  window.__treeAppInited = true;

  renderTreeImportPanel();
  global.TreeAppData.renderDataPanel();
  initSidebar();

  if (global.TreeUIBasic) global.TreeUIBasic.renderBasicPanel(document.getElementById("basicStylePanel"));
  if (global.TreeUIAdvanced) global.TreeUIAdvanced.renderAdvancedPanel(document.getElementById("advancedStylePanel"));
  if (global.TreeUITracks) global.TreeUITracks.renderDatasetsPanel(document.getElementById("datasetsPanel"));

  syncControls();
  bindAllControls();
  rebuildSidebarNav();

  ["showLeafNodes", "showInternalNodes", "showOnlyWithSupport"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", global.TreeAppNodes.renderNodeTable);
  });
  document.getElementById("nodeTableSearch")?.addEventListener("input", global.TreeAppNodes.renderNodeTable);
  document.getElementById("exportNodeTableBtn")?.addEventListener("click", global.TreeAppNodes.exportNodeTableCsv);
  document.getElementById("addMetaColumnBtn")?.addEventListener("click", global.TreeAppNodes.addMetaColumn);
  document.getElementById("fillNodeIdsBtn")?.addEventListener("click", global.TreeAppNodes.fillNodeIdsInMetaPanel);
  document.getElementById("generateNodeRandomBtn")?.addEventListener("click", global.TreeAppNodes.generateNodeRandomData);
  document.getElementById("mergeNodeMetaBtn")?.addEventListener("click", global.TreeAppNodes.mergeNodeMetaData);
  document.getElementById("nodeTableBox")?.addEventListener("toggle", e => {
    if (e.target.open) global.TreeAppNodes.renderNodeTable();
  });

  document.addEventListener("click", (e) => {
    const panel = document.getElementById("nodeActionPanel");
    if (panel && !panel.contains(e.target)) panel.style.display = "none";
    const bpanel = document.getElementById("branchActionPanel");
    if (bpanel && !bpanel.contains(e.target)) bpanel.style.display = "none";
  });
  window.addEventListener("resize", () => {
    const p = document.getElementById("nodeActionPanel");
    if (p && p.style.display === "block") {
      const w = p.offsetWidth, h = p.offsetHeight;
      const l = Math.min(parseFloat(p.style.left) || 0, window.innerWidth - w - 8);
      const t = Math.min(parseFloat(p.style.top) || 0, window.innerHeight - h - 8);
      p.style.left = Math.max(8, l) + "px";
      p.style.top = Math.max(8, t) + "px";
    }
    const bp = document.getElementById("branchActionPanel");
    if (bp && bp.style.display === "block") {
      const w = bp.offsetWidth, h = bp.offsetHeight;
      const l = Math.min(parseFloat(bp.style.left) || 0, window.innerWidth - w - 8);
      const t = Math.min(parseFloat(bp.style.top) || 0, window.innerHeight - h - 8);
      bp.style.left = Math.max(8, l) + "px";
      bp.style.top = Math.max(8, t) + "px";
    }
  });

  document.getElementById("drawBtn")?.addEventListener("click", drawTree);
  document.getElementById("exportSvgBtn")?.addEventListener("click", () => {
    if (!C.getSvg()) return;
    global.TreeExport.download("phylogenetic_tree.svg", global.TreeExport.exportSvgString(), "image/svg+xml;charset=utf-8");
    showToolbar(I.t('treeMsgExportSvg'));
  });
  document.getElementById("exportPngBtn")?.addEventListener("click", async () => {
    if (!C.getSvg()) return;
    try {
      await global.TreeExport.downloadPng(2, "phylogenetic_tree.png");
      showToolbar(I.t('treeMsgExportPng'));
    } catch (_) { showToolbar(I.t('treeMsgExportPngErr')); }
  });
  document.getElementById("saveExportStateBtn")?.addEventListener("click", () => {
    if (!C.getRoot()) return;
    const raw = C.captureSnapshot();
    global.TreeExport.download("tree-export-state.json", raw, "application/json");
  });

  global.TreeAppData.refreshDataSummary();
  global.TreeAppData.renderLeafDataPreview();

  if (global.PlotBootstrap && PlotBootstrap.ensureD3) PlotBootstrap.ensureD3().catch(() => {});

  setTimeout(() => {
    ['donateModal', 'donatePopup', 'donateBox'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.zIndex = '20000';
        if (getComputedStyle(el).position === 'absolute') el.style.position = 'fixed';
      }
    });
  }, 300);
}

global.TreeApp = {
  init, drawTree, loadTree,
  enableWheelZoom,
  refreshTreeView: () => global.TreeUI.refreshTreeView(),
  showNodeActionPanel: (id, x, y) => global.TreeAppNodes.showNodeActionPanel(id, x, y),
  showBranchActionPanel: (id, x, y) => global.TreeAppNodes.showBranchActionPanel(id, x, y),
  rebuildSidebarNav
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

})(window);
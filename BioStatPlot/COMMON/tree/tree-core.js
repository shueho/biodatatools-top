(function (global) {
'use strict';
const ctx = {
  svg: null, root: null, idSeq: 0,
  viewBox: { x: 0, y: 0, w: 1000, h: 760 },
  radialLabelR: 320, selectedId: null, selectedBranchId: null,
  undoStack: [], initialSnapshot: '',
  treeMaxX: 0, treeMinX: 0, maxTextWidth: 0, treeTop: 58, treeBottom: 0,
  rootX: 0, rootY: 0,
  state: {
    mode: "rectangular", rotation: 0, invert: false,
    lineShape: "straight", arc: 348,
    showLength: false, showBootstrap: false, bootstrapFormat: "auto",
    sortMode: "none", leafReverse: false,
    ignoreLength: false, branchLengthField: "", showRoot: true, labels: true,
    forceMidpointRoot: false,
    fontFamily: "Times New Roman", fontSize: 20, labelColor: "#222222",
    bold: false, italic: false,
    labelPosition: "aligned",
    labelAnchorRect: "left",
    labelAnchorCirc: "auto",
    labelShift: 0,
    leafLabelOffsetX: 8,
    leafLabelOffsetCirc: 8,
    showLegend: true, legendX: 760, legendY: 60, legendSize: 14, legendFont: "",
    legendColor: "#222222", legendBold: false, legendItalic: false, legendTitle: "Groups",
    ringWidth: 18, ringGap: 16, ringStroke: "#ffffff", ringStrokeWidth: 0,
    extendBranches: true, branchWidth: 1, branchColor: "#262626",
    rangeGradient: false, rangeOpacity: 0.85,
    barShowAxis: true, barShowValues: true, barWidth: 110, barFontSize: 16,
    dashed: false, dashSize: 0.3,
    nodeIds: false,
    leafSymbols: false, internalSymbols: false,
    leafSymShape: "square", leafSymSize: 5, leafSymFill: "#bdbdbd", leafSymBW: 1, leafSymBC: "#000000",
    intSymShape: "square", intSymSize: 5, intSymFill: "#bdbdbd", intSymBW: 1, intSymBC: "#000000",
    scaleH: 1, scaleV: 1, zoom: 1, panX: 0, panY: 0,
    collapsedMode: "actual", collapsedTipOffset: 0,
    collapsedFill: "#dbe6f0", collapsedFillOpacity: 0.9,
    collapsedCompress: false, collapsedCompressLeafCount: 3,
    isTimeTree: false, timeTreeMeta: null,
    timeTreeMode: false, rootTickValue: 0,
    hasRoot: true,
    axisShow: true, axisPos: "bottom", axisRotation: 0, axisReverse: false,
    tickPrimary: { interval: 0, showLabels: true, showGrid: false, gridDashed: false, gridWidth: 1, gridColor: "#dddddd", customTicks: [] },
    tickSecondary: { interval: 0, showLabels: false, showGrid: false, gridDashed: false, gridWidth: 1, gridColor: "#dddddd", customTicks: [] },
    tickLabelFontSize: 20, tickLabelBold: true, tickLabelItalic: false,
    customTickColor: "#c0392b", customTickBold: true,
    timeScaleFactor: 1,
    showScaleBox: true, scaleBoxSize: 0, scaleBoxTitle: "Scale",
    lengthLabel: {
      show: false, fontSize: 9, bold: false, italic: false,
      decimals: 2, offsetX: 0, offsetY: -3,
      bgShow: false, bgBorderColor: "#999999", bgBorderWidth: 1, bgFill: "#ffffff",
      asTime: false, timeRootAge: 0, timeFactor: 1,
      ciField: ""
    },
    nodeLabels: [],
    nodeLabelCommon: {
      fontSize: 15, bold: false, italic: false,
      offsetX: -10, offsetY: -6,
      offsetTangent: 0, offsetRadial: -40,
      bgShow: false, bgBorderColor: "#999999", bgBorderWidth: 1, bgFill: "#ffffff",
      separator: "/", hideOnLeaves: false
    },
    rangeLabelConfig: {
      show: false, field: "",
      lineHeight: 8, color: "#67cb9e",
      outlineColor: "#333333", outlineWidth: 0,
      opacity: 0.8
    }
  }
};
const providers = [];
function registerSnapshot(name, get, set) { providers.push({ name, get, set }); }
function el(tag, attrs, parent) {
  if (!ctx.svg) return null;
  if (!parent) parent = ctx.svg;
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs || {}).forEach(([k, v]) => { if (v !== undefined && v !== null) node.setAttribute(k, v); });
  parent.appendChild(node);
  return node;
}
function branchLen(c) {
  if (ctx.state.ignoreLength) return 1;
  const field = ctx.state.branchLengthField;
  if (field) {
    const f = (c.meta || []).find(m => m.field === field);
    if (f) {
      let v = f.value;
      if (Array.isArray(v) && v.length >= 2) {
        const a = Number(v[0]), b = Number(v[1]);
        v = (isFinite(a) && isFinite(b)) ? (a + b) / 2 : a;
      }
      const n = Number(v);
      if (isFinite(n) && n > 0) return c.truncated ? Math.min(n, 0.08) : n;
    }
  }
  const L = Math.max(c.length || 1e-9, 1e-9);
  return c.truncated ? Math.min(L, 0.08) : L;
}
let alignedLabelXCache = 690;
function alignedLabelX() { return alignedLabelXCache; }
function nextId() { return "n" + (++ctx.idSeq); }
function resetIdSeq() { ctx.idSeq = 0; }
function restoreParents(n, parent) { 
  if (!n) return;
  n.parent = parent; 
  (n.children || []).forEach(c => restoreParents(c, n)); 
}
function buildSnapshotObj() {
  const extras = {};
  providers.forEach(p => { try { extras[p.name] = p.get(); } catch (_) {} });
  return { root: JSON.parse(JSON.stringify(ctx.root, (k, v) => k === "parent" ? undefined : v)), state: { ...ctx.state }, extras };
}
function snapshot() { ctx.undoStack.push(JSON.stringify(buildSnapshotObj())); if (ctx.undoStack.length > 50) ctx.undoStack.shift(); }
function captureSnapshot() { return JSON.stringify(buildSnapshotObj()); }
function applySnapshot(raw) {
  const snap = JSON.parse(raw);
  if (snap.root) {
    ctx.root = snap.root; 
    restoreParents(ctx.root, null);
  } else {
    if (!ctx.root) ctx.root = null;
  }
  if (snap.state) Object.assign(ctx.state, snap.state);
  if (snap.extras) providers.forEach(p => { if (p.name in snap.extras) { try { p.set(snap.extras[p.name]); } catch (_) {} } });
}
function undo() { const s = ctx.undoStack.pop(); if (!s) return false; applySnapshot(s); return true; }
function resetToInitial() { if (!ctx.initialSnapshot) return false; snapshot(); applySnapshot(ctx.initialSnapshot); ctx.selectedId = null; return true; }
global.TreeCore = {
  ctx,
  get state() { return ctx.state; },
  getSvg: () => ctx.svg, setSvg: e => { ctx.svg = e; },
  getRoot: () => ctx.root, setRoot: r => { ctx.root = r; },
  getViewBox: () => ctx.viewBox, setViewBox: v => { ctx.viewBox = v; },
  getRadialLabelR: () => ctx.radialLabelR, setRadialLabelR: r => { ctx.radialLabelR = r; },
  getSelectedId: () => ctx.selectedId, setSelectedId: i => { ctx.selectedId = i; },
  getSelectedBranchId: () => ctx.selectedBranchId, setSelectedBranchId: i => { ctx.selectedBranchId = i; },
  get treeMaxX() { return ctx.treeMaxX; }, get treeMinX() { return ctx.treeMinX; },
  get maxTextWidth() { return ctx.maxTextWidth; }, get rootX() { return ctx.rootX; }, get rootY() { return ctx.rootY; },
  get undoStack() { return ctx.undoStack; }, get initialSnapshot() { return ctx.initialSnapshot; },
  setInitialSnapshot: s => { ctx.initialSnapshot = s; },
  nextId, resetIdSeq, restoreParents, branchLen, alignedLabelX, el,
  snapshot, captureSnapshot, applySnapshot, undo, resetToInitial, registerSnapshot, buildSnapshotObj
};

function emptyNode(parent) { return { name: "", length: 0.12, children: [], parent, collapsed: false, deleted: false, color: null, label: null, highlight: false, support: "", meta: [], _hasExplicitLength: false }; }
function splitTopLevel(str, sepChar) {
  const out = []; let depth = 0, quote = 0, start = 0; const sc = sepChar.charCodeAt(0);
  for (let j = 0; j < str.length; j++) {
    const c = str.charCodeAt(j);
    if (quote) { if (c === quote) quote = 0; continue; }
    if (c === 39 || c === 34) { quote = c; continue; }
    if (c === 123 || c === 40 || c === 91) { depth++; continue; }
    if (c === 125 || c === 41 || c === 93) { depth--; continue; }
    if (c === sc && depth === 0) { out.push(str.slice(start, j)); start = j + 1; }
  }
  out.push(str.slice(start)); return out;
}
function parseNHXBody(body, node) {
  if (!body) return;
  splitTopLevel(body, ",").forEach(pair => {
    const eq = pair.indexOf("="); if (eq < 0) return;
    const key = pair.slice(0, eq).trim(); let val = pair.slice(eq + 1).trim(); if (!key) return;
    let parsed;
    if (val.startsWith("{") && val.endsWith("}")) {
      parsed = splitTopLevel(val.slice(1, -1), ",").map(x => { const t = x.trim(); const n = Number(t); return Number.isFinite(n) ? n : t; });
    } else if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) { parsed = val.slice(1, -1); }
    else { const n = Number(val); parsed = Number.isFinite(n) ? n : val; }
    node.meta.push({ field: key, value: parsed });
  });
}
function parseNewick(input, translateMap) {
  let s = String(input == null ? "" : input).replace(/^\uFEFF/, "");
  let rootFlag = null;
  const flagMatch = s.match(/^\s*\[&([RU])\]/i);
  if (flagMatch) rootFlag = flagMatch[1].toUpperCase() === 'R';
  if (!s.trim()) throw new Error("Newick 输入为空");
  s = s.replace(/^\s*\[&[RU]\]\s*/i, "").replace(/;\s*$/, "");
  let i = 0; const N = s.length;
  function skipWhite() { while (i < N) { const c = s.charCodeAt(i); if (c === 32 || c === 9 || c === 10 || c === 13) i++; else break; } }
  function consumeAnnotations(node) {
    skipWhite();
    while (i < N && s.charCodeAt(i) === 91) {
      i++; let depth = 1, quote = 0; const cs = i;
      while (i < N && depth > 0) {
        const ch = s.charCodeAt(i);
        if (quote) { if (ch === quote) quote = 0; i++; }
        else if (ch === 39 || ch === 34) { quote = ch; i++; }
        else if (ch === 91) { depth++; i++; }
        else if (ch === 93) { depth--; i++; }
        else i++;
      }
      const content = s.slice(cs, i - 1);
      if (content) {
        if (content.startsWith("&&NHX:")) parseNHXBody(content.slice(6), node);
        else if (content.startsWith("&")) { const body = content.slice(1); if (body !== "R" && body !== "U" && body.includes("=")) parseNHXBody(body, node); }
      }
      skipWhite();
    }
  }
  function readToken() {
    skipWhite(); const start = i;
    if (i < N && (s[i] === "'" || s[i] === '"')) { const q = s[i++]; const s2 = i; while (i < N && s[i] !== q) i++; const tok = s.slice(s2, i); if (s[i] === q) i++; return tok; }
    while (i < N) { const ch = s[i]; if (ch === "(" || ch === ")" || ch === "," || ch === ":" || ch === ";" || ch === "[" || ch === "]") break; i++; }
    return s.slice(start, i).trim();
  }
  function readLength(node) {
    consumeAnnotations(node); skipWhite();
    if (s[i] === ":") { i++; const raw = readToken(); const v = Number.parseFloat(raw); node.length = Number.isFinite(v) && v >= 0 ? v : 0.1; node._hasExplicitLength = true; }
    else { node.length = 0.12; node._hasExplicitLength = false; }
    consumeAnnotations(node);
  }
  function applyTranslate(node) {
    if (!translateMap || !node.name) return;
    const k = String(node.name).trim();
    if (Object.prototype.hasOwnProperty.call(translateMap, k)) node.name = translateMap[k];
  }
  let depthGuard = 0;
  function subtree(parent) {
    if (++depthGuard > 100000) throw new Error("Newick 递归过深");
    skipWhite();
    const node = emptyNode(parent);
    if (i < N && s[i] === "(") {
      i++;
      while (i < N) {
        node.children.push(subtree(node)); skipWhite();
        if (s[i] === ",") { i++; continue; }
        if (s[i] === ")") { i++; break; }
        break;
      }
      consumeAnnotations(node); skipWhite();
      const tok = readToken();
      if (tok) { if (/^\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)*$/.test(tok)) node.support = tok; else node.name = tok; }
      readLength(node);
    } else { node.name = readToken(); readLength(node); }
    applyTranslate(node); return node;
  }
  const root = subtree(null);
  if (!root || ((!root.children || root.children.length === 0) && !root.name)) throw new Error("Newick 结构解析为空");
  if (rootFlag !== null) root.rootFlag = rootFlag;
  else if (!root._hasExplicitLength) root.rootFlag = false;
  return root;
}
function parseNexus(text) {
  const src = String(text == null ? "" : text).replace(/^\uFEFF/, "");
  const lines = src.split(/\r?\n/);
  const translate = {}, trees = [];
  let inTrees = false, inTranslate = false, currentName = null, currentBody = null;
  function parseTranslateLine(line) {
    splitTopLevel(line.replace(/;$/, ""), ",").forEach(raw => {
      const chunk = raw.trim(); if (!chunk) return;
      const mm = chunk.match(/^(\d+)\s+(.+)$/); if (!mm) return;
      let name = mm[2].trim();
      if ((name.startsWith("'") && name.endsWith("'")) || (name.startsWith('"') && name.endsWith('"'))) name = name.slice(1, -1);
      translate[mm[1]] = name;
    });
  }
  function flushTree() { if (currentBody != null) { const body = String(currentBody).replace(/;$/, "").trim(); if (body) trees.push({ name: currentName || ("tree" + (trees.length + 1)), newick: body }); } currentBody = null; }
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim(); if (!line) continue;
    if (!inTrees) { if (/^BEGIN\s+TREES\b/i.test(line)) inTrees = true; continue; }
    if (/^END\b/i.test(line)) { if (inTranslate) inTranslate = false; flushTree(); inTrees = false; continue; }
    if (inTranslate) { if (/^(?:U)?TREE\b/i.test(line)) inTranslate = false; else { parseTranslateLine(line); if (line.endsWith(";")) inTranslate = false; continue; } }
    if (/^TRANSLATE\b/i.test(line)) { inTranslate = true; const rest = line.replace(/^TRANSLATE\s*/i, ""); if (rest) { parseTranslateLine(rest); if (rest.endsWith(";")) inTranslate = false; } continue; }
    if (/^(?:U)?TREE\b/i.test(line)) {
      const m = line.match(/^(?:U)?TREE\s+(.+?)\s*=\s*(.*)$/i);
      if (m) {
        currentName = m[1].trim().replace(/^['"]|['"]$/g, "");
        let body = m[2].trim().replace(/^\[&[UR]\]\s*/i, "");
        if (body.endsWith(";")) { trees.push({ name: currentName, newick: body.slice(0, -1).trim() }); currentBody = null; }
        else currentBody = body;
      }
      continue;
    }
    if (currentBody != null) { currentBody += " " + line; if (line.endsWith(";")) { flushTree(); currentName = null; } }
  }
  flushTree();
  if (!trees.length) throw new Error("NEXUS 中未找到任何 tree 记录");
  const chosen = trees.find(t => t.newick && t.newick.indexOf("(") !== -1) || trees[0];
  if (!chosen.newick) throw new Error("NEXUS 中的 tree 记录为空");
  const tree = parseNewick(chosen.newick, translate);
  if (tree.rootFlag !== false) tree.rootFlag = true;
  return tree;
}
function parsePhyloXML(text) {
  const src = String(text == null ? "" : text).replace(/^\uFEFF/, "");
  const doc = new DOMParser().parseFromString(src, "application/xml");
  if (doc.getElementsByTagName("parsererror")[0]) throw new Error("PhyloXML 解析失败");
  const phylogeny = doc.getElementsByTagName("phylogeny")[0] || doc.getElementsByTagNameNS("*", "phylogeny")[0];
  if (!phylogeny) throw new Error("PhyloXML 中未找到 <phylogeny>");
  const rootClade = Array.from(phylogeny.children || []).find(c => c.localName === "clade" || c.nodeName.replace(/^.*:/, "") === "clade");
  if (!rootClade) throw new Error("PhyloXML 中未找到根 <clade>");
  const seen = {};
  function uniqueName(node) { if (!node.name) return; if (seen[node.name] === undefined) seen[node.name] = 0; else { seen[node.name]++; node.name = node.name + seen[node.name]; } }
  function parseClade(el, parent) {
    const node = emptyNode(parent);
    const lenAttr = el.getAttribute && el.getAttribute("branch_length");
    if (lenAttr != null) { const v = Number.parseFloat(lenAttr); if (Number.isFinite(v) && v >= 0) { node.length = v; node._hasExplicitLength = true; } }
    const childClades = []; let childLen = null;
    for (const child of el.children || []) {
      const tag = child.localName || child.nodeName.replace(/^.*:/, "");
      switch (tag) {
        case "name": if (!node.name) node.name = (child.textContent || "").trim(); break;
        case "branch_length": childLen = child; break;
        case "taxonomy": { const sci = child.getElementsByTagName("scientific_name")[0] || child.getElementsByTagNameNS("*", "scientific_name")[0]; if (sci) node.name = (sci.textContent || "").trim(); break; }
        case "confidence": { const v = (child.textContent || "").trim(); if (v) node.support = v; const t = child.getAttribute("type"); if (t) node.meta.push({ field: "confidence_type", value: t }); break; }
        case "clade": childClades.push(child); break;
        case "property": { const key = child.getAttribute("ref") || child.getAttribute("applies_to"); const val = (child.textContent || "").trim(); if (key && val) node.meta.push({ field: key, value: val }); break; }
      }
    }
    if (childLen) { const v = Number.parseFloat((childLen.textContent || "").trim()); if (Number.isFinite(v) && v >= 0) { node.length = v; node._hasExplicitLength = true; } }
    if (childClades.length) node.children = childClades.map(c => parseClade(c, node));
    uniqueName(node); return node;
  }
  const tree = parseClade(rootClade, null);
  if (tree.rootFlag !== false) tree.rootFlag = true;
  return tree;
}
function detectTreeFormat(text) {
  if (text == null) return "empty";
  let s = String(text); if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  const trimmed = s.trim(); if (!trimmed) return "empty";
  const head = trimmed.slice(0, 4096);
  if (/^#NEXUS\b/i.test(head)) return "nexus";
  if (/<phyloxml\b/i.test(head) || /<phylogeny\b/i.test(head)) return "phyloxml";
  if (/^<\?xml\b/i.test(head)) return (/<phyloxml\b/i.test(s) || /<phylogeny\b/i.test(s)) ? "phyloxml" : "xml";
  if (/^<[a-zA-Z]/.test(head)) return (/<phyloxml\b/i.test(s) || /<phylogeny\b/i.test(s)) ? "phyloxml" : "xml";
  return "newick";
}
function parseTree(text) {
  const fmt = detectTreeFormat(text);
  if (fmt === "nexus") return parseNexus(text);
  if (fmt === "phyloxml") return parsePhyloXML(text);
  if (fmt === "empty") throw new Error("输入为空");
  if (fmt === "xml") throw new Error("不支持的 XML 格式");
  return parseNewick(text);
}
function assign(n, parent) { n.parent = parent; n.id = nextId(); n.uid = n.name || n.support || n.id; (n.children || []).forEach(c => assign(c, n)); }
global.TreeParser = { parseNewick, parseNexus, parsePhyloXML, parseTree, detectTreeFormat, splitTopLevel, assign };

function walk(n, fn) { if (!n || n.deleted) return; fn(n); if (!n.collapsed) (n.children || []).forEach(c => walk(c, fn)); }
function allWalk(n, fn) { if (!n) return; fn(n); (n.children || []).forEach(c => allWalk(c, fn)); }
function visibleChildren(n) { if (n.collapsed) return []; return (n.children || []).filter(c => !c.deleted); }
function isLeaf(n) { return !visibleChildren(n).length || n.collapsed; }
function labelOf(n) { if (n.label) return n.label; if (n.name) return n.name; if (n.collapsed) return "[" + (n.uid || n.id) + "]"; return n.id; }
function visibleLeaves(n) { const out = []; walk(n, x => { if (isLeaf(x) && !x.deleted) out.push(x); }); return out; }
function maxDepth(n, depth = 0) { const kids = visibleChildren(n); if (!kids.length || n.collapsed) return depth; return Math.max(...kids.map(c => maxDepth(c, depth + branchLen(c)))); }
function nodeById(id) { let f = null; allWalk(ctx.root, x => { if (x.id === id) f = x; }); return f; }
function leavesUnder(n) { const out = []; walk(n, x => { if (isLeaf(x)) out.push(x); }); return out; }
function leafRowBounds(leaves, fallbackHeight) {
  const ordered = [...leaves].sort((a, b) => a.y - b.y);
  const bounds = new Map();
  ordered.forEach((leaf, i) => {
    const before = i ? ordered[i-1].y : leaf.y - (ordered[1] ? ordered[1].y - leaf.y : fallbackHeight);
    const after = i + 1 < ordered.length ? ordered[i+1].y : leaf.y + (i ? leaf.y - ordered[i-1].y : fallbackHeight);
    bounds.set(leaf, { top: (before + leaf.y) / 2, bottom: (leaf.y + after) / 2 });
  });
  return bounds;
}
function countInnerLeaves(n) { let c = 0; (function rec(m) { if (m.deleted) return; const kids = (m.children || []).filter(k => !k.deleted); if (!kids.length) { c++; return; } kids.forEach(rec); })(n); return c; }
function collectInnerLeaves(n) { const out = []; (function rec(m) { if (m.deleted) return; const kids = (m.children || []).filter(k => !k.deleted); if (!kids.length) { out.push(m); return; } kids.forEach(rec); })(n); return out; }
global.TreeTraverse = { walk, allWalk, visibleChildren, isLeaf, labelOf, visibleLeaves, maxDepth, nodeById, leavesUnder, leafRowBounds, countInnerLeaves, collectInnerLeaves };

function polar(cx, cy, r, aDeg) { const a = (aDeg - 90) * Math.PI / 180; return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; }
function shiftSubtreeY(n, dy) { n.y += dy; visibleChildren(n).forEach(c => shiftSubtreeY(c, dy)); }
function sortTreeByMode() {
  const st = ctx.state; const mode = st.sortMode || "none"; if (mode === "none") return;
  allWalk(ctx.root, n => {
    if (!n.children) return;
    n.children.sort((a, b) => { const av = visibleLeaves(a).length, bv = visibleLeaves(b).length; return mode === "ascending" ? av - bv : bv - av; });
  });
}
function collapsedOcc(n) {
  const st = ctx.state; const inner = countInnerLeaves(n);
  if (!st.collapsedCompress) return Math.max(1, inner);
  return Math.max(1, Math.min(inner, Math.max(1, Number(st.collapsedCompressLeafCount) || 3)));
}
function isCollapsedBranch(c) { return c.collapsed && (c.children || []).some(k => !k.deleted); }
function layoutRect() {
  sortTreeByMode();
  const st = ctx.state;
  const top = 58, bottom = 52, left = 90;
  const maxD = Math.max(maxDepth(ctx.root), .01);
  const rowH = Math.max(14, st.fontSize * 1.05) * (st.scaleV || 1);
  const isInv = (st.invert === true || st.invert === "true");
  const scaleH = st.scaleH || 1; const treeW = 560 * scaleH;
  const units = [];
  (function collect(n) {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (!kids.length) { units.push({ node: n, isCollapsed: false, occ: 1 }); return; }
    if (n.collapsed) { units.push({ node: n, isCollapsed: true, occ: collapsedOcc(n) }); return; }
    kids.forEach(collect);
  })(ctx.root);
  let cursor = top;
  units.forEach(u => {
    const totalH = u.occ * rowH;
    if (u.isCollapsed) { u.node.y = cursor + totalH / 2; u.node._slotStart = cursor; u.node._slotEnd = cursor + totalH; assignInnerY(u.node, cursor, cursor + totalH); }
    else { u.node.y = cursor + rowH / 2; u.node._slotStart = cursor; u.node._slotEnd = cursor + rowH; }
    cursor += totalH;
  });
  (function assign(n, depth) {
    if (n.deleted) return;
    n.depth = depth;
    const d = depth / maxD; const rel = isInv ? (1 - d) : d;
    n.x = left + rel * treeW;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (!kids.length) return;
    kids.forEach(c => assign(c, depth + branchLen(c)));
    if (n.collapsed) return;
    n.y = kids.reduce((sum, c) => sum + (c.y || 0), 0) / kids.length;
  })(ctx.root, 0);
  const allLeavesForView = collectInnerLeaves(ctx.root);
  let tMax = left, tMin = left + treeW;
  allLeavesForView.forEach(l => { if (l.x > tMax) tMax = l.x; if (l.x < tMin) tMin = l.x; });
  const maxText = Math.max(...allLeavesForView.map(l => labelOf(l).length), 8);
  ctx.treeMaxX = tMax; ctx.treeMinX = tMin; ctx.maxTextWidth = maxText * st.fontSize * 0.62;
  ctx.treeTop = top; ctx.treeBottom = cursor; ctx.rootX = ctx.root.x; ctx.rootY = ctx.root.y;
  const GAP = 20;
  alignedLabelXCache = isInv ? (tMin - GAP) : (tMax + GAP);
  const contentH = cursor + bottom; const minCanvasH = Math.max(240, contentH);
  const extraPad = (minCanvasH - contentH) / 2;
  let vx, vw;
  if (isInv) { vx = tMin - GAP - ctx.maxTextWidth - 60; vw = Math.max(940, (left + treeW) - vx + 60); }
  else { vx = 0; vw = Math.max(940, tMax + GAP + ctx.maxTextWidth + 60); }
  ctx.viewBox = { x: vx, y: -extraPad, w: vw, h: minCanvasH };
}
function assignInnerY(n, startY, endY) {
  const kids = (n.children || []).filter(c => !c.deleted);
  if (!kids.length) { n.y = (startY + endY) / 2; return; }
  const weights = kids.map(c => isCollapsedBranch(c) ? collapsedOcc(c) : countInnerLeaves(c));
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  let cur = startY;
  kids.forEach((c, i) => {
    const w = (endY - startY) * weights[i] / total;
    if (isCollapsedBranch(c)) { c.y = cur + w / 2; c._slotStart = cur; c._slotEnd = cur + w; assignInnerY(c, cur, cur + w); }
    else assignInnerY(c, cur, cur + w);
    cur += w;
  });
  n.y = kids.reduce((s, c) => s + (c.y || 0), 0) / kids.length;
}

function getRadialInnerBase() {
  const st = ctx.state;
  const root = ctx.root;
  if (!root) return 0;
  const maxR = 285 * (st.scaleH || 1);
  const maxD = Math.max(maxDepth(root, 0), 1e-9);
  if (maxD <= 0) return 0;

  let vMin = 0, vMax = maxD;
  const rl = st.rangeLabelConfig;
  if (rl && rl.show && rl.field) {
    allWalk(root, n => {
      const hasKids = (n.children || []).some(c => !c.deleted);
      if (!hasKids) return;
      const m = (n.meta || []).find(mm => mm.field === rl.field);
      if (!m) return;
      const v = m.value;
      if (!Array.isArray(v) || v.length < 2) return;
      const lo = Number(v[0]), hi = Number(v[1]);
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) return;
      vMin = Math.min(vMin, lo);
      vMax = Math.max(vMax, hi);
    });
  }

  const isRev = (st.axisReverse === true || st.axisReverse === "true");
  const tMin = isRev ? (maxD - vMax) : vMin;
  if (tMin >= -1e-9) return 0;
  return Math.max(0, -tMin * maxR / maxD);
}

function layoutRadial() {
  sortTreeByMode();
  const st = ctx.state; const cx = 470, cy = 380;

  const innerBase = getRadialInnerBase();
  const maxR = 285 * (st.scaleH || 1);
  const maxD = Math.max(maxDepth(ctx.root), .01);

  const openGap = Math.max(0, 360 - (st.arc || 348));
  const start = st.rotation + openGap / 2; const span = 360 - openGap;

  const units = [];
  (function collect(n) {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (!kids.length) { units.push({ node: n, isCollapsed: false, occ: 1 }); return; }
    if (n.collapsed) { units.push({ node: n, isCollapsed: true, occ: collapsedOcc(n) }); return; }
    kids.forEach(collect);
  })(ctx.root);

  const totalOcc = units.reduce((s, u) => s + u.occ, 0) || 1;
  const slotW = span / totalOcc; let order = 0;
  units.forEach(u => {
    const slotStart = start + order * slotW;
    const slotEnd = start + (order + u.occ) * slotW;
    if (u.isCollapsed) {
      u.node.angle = (slotStart + slotEnd) / 2;
      u.node._slotStartA = slotStart;
      u.node._slotEndA = slotEnd;
      assignInnerAngle(u.node, slotStart, slotEnd);
    } else {
      u.node.angle = slotStart;
      u.node._slotStartA = slotStart;
      u.node._slotEndA = slotStart + slotW;
    }
    order += u.occ;
  });

  (function assign(n, depth) {
    if (n.deleted) return;
    n.depth = depth;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (kids.length) {
      kids.forEach(c => assign(c, depth + branchLen(c)));
      if (!n.collapsed) n.angle = kids.reduce((a, c) => a + (c.angle || 0), 0) / kids.length;
    }
    const r = innerBase + maxR * (depth / maxD);
    const p = polar(cx, cy, r, n.angle || 0);
    n.x = p.x; n.y = p.y; n.r = r;
  })(ctx.root, 0);

  const visLeaves = visibleLeaves(ctx.root);
  const R_base = innerBase + maxR;
  const geoExtra = (global.TreeRanges && typeof global.TreeRanges.getGeoExtra === 'function')
    ? global.TreeRanges.getGeoExtra() : 0;
  const R_total = R_base + geoExtra;
  const labelR = Math.max(...visLeaves.map(l => l.r || 0), R_total) + 12;
  ctx.radialLabelR = labelR;

  const maxT = Math.max(0, ...visLeaves.map(l => labelOf(l).length * st.fontSize * (l.labelSizeFactor || 1) * 0.6));

  const ext = Math.max(380, labelR + maxT + 14) + 20;
  ctx.viewBox = { x: 470 - ext - 16, y: 380 - ext - 16, w: (ext + 16) * 2, h: (ext + 16) * 2 };
}

function assignInnerAngle(n, startA, endA) {
  const kids = (n.children || []).filter(c => !c.deleted);
  if (!kids.length) { n.angle = (startA + endA) / 2; return; }
  const weights = kids.map(c => isCollapsedBranch(c) ? collapsedOcc(c) : countInnerLeaves(c));
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  let cur = startA;
  kids.forEach((c, i) => {
    const w = (endA - startA) * weights[i] / total;
    if (isCollapsedBranch(c)) { c.angle = cur + w / 2; c._slotStartA = cur; c._slotEndA = cur + w; assignInnerAngle(c, cur, cur + w); }
    else assignInnerAngle(c, cur, cur + w);
    cur += w;
  });
  n.angle = kids.reduce((s, c) => s + (c.angle || 0), 0) / kids.length;
}
global.TreeLayout = { polar, shiftSubtreeY, sortTreeByMode, layoutRect, layoutRadial, collapsedOcc, getRadialInnerBase };

function suppressUnary(node, rt) {
  (node.children || []).slice().forEach(c => suppressUnary(c, rt));
  if (node !== rt && node.parent && (node.children || []).length === 1) {
    const only = node.children[0];
    only.length = Number(only.length || 0) + Number(node.length || 0);
    only.parent = node.parent;
    const idx = node.parent.children.indexOf(node);
    if (idx >= 0) node.parent.children[idx] = only;
  }
}
function rerootAt(target) {
  if (!target || !target.parent) return false;
  const L = Number(target.length || 0), half = L > 0 ? L / 2 : 0;
  const newRoot = { name: "", length: 0, children: [], parent: null, collapsed: false, deleted: false, color: null, label: null, highlight: false };
  const path = [];
  for (let x = target.parent; x; x = x.parent) path.push(x);
  target.parent.children = (target.parent.children || []).filter(c => c !== target);
  let childSide = newRoot, edgeLen = half;
  for (const node of path) {
    const up = node.parent, upEdge = Number(node.length || 0);
    if (up) up.children = (up.children || []).filter(c => c !== node);
    node.parent = childSide; node.length = edgeLen;
    childSide.children.push(node); childSide = node; edgeLen = upEdge;
  }
  target.parent = newRoot; target.length = half;
  newRoot.children.push(target);
  suppressUnary(newRoot, newRoot);
  ctx.root = newRoot; assign(newRoot, null); ctx.selectedId = null; ctx.selectedBranchId = null;
  return true;
}
function moveNodeBeside(src, target) {
  if (!src || !target || src === target || !src.parent) return false;
  for (let p = target; p; p = p.parent) if (p === src) return false;
  const oldP = src.parent;
  oldP.children = oldP.children.filter(c => c !== src);
  const tp = target.parent;
  if (!tp) { target.children = target.children || []; target.children.push(src); src.parent = target; }
  else { const idx = tp.children.indexOf(target); tp.children.splice(idx + 1, 0, src); src.parent = tp; }
  suppressUnary(ctx.root, ctx.root); assign(ctx.root, null);
  return true;
}
global.TreeOps = { suppressUnary, rerootAt, moveNodeBeside };

function newickName(n) {
  const raw = String(n.label || n.name || n.id || "");
  return /[\s(),:;'\[\]]/.test(raw) ? "'" + raw.replace(/'/g, "''") + "'" : raw;
}
function toNewick(node) {
  node = node || ctx.root;
  function r(n) {
    const kids = (n.children || []).filter(c => !c.deleted);
    let s;
    if (kids.length && !n.collapsed) { s = "(" + kids.map(r).join(",") + ")"; if (n.support) s += n.support; }
    else s = newickName(n);
    if (n.length != null && n.parent) s += ":" + String(+Number(n.length).toFixed(6));
    return s;
  }
  return r(node) + ";";
}
function toNexus() { return "#NEXUS\nBEGIN TREES;\n  TREE tree1 = [&R] " + toNewick(ctx.root) + "\nEND;\n"; }
function toPhyloXML() {
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function clade(n) {
    const kids = (n.children || []).filter(c => !c.deleted);
    let s = "<clade>";
    if (n.length != null && n.parent) s += "<branch_length>" + (+Number(n.length).toFixed(6)) + "</branch_length>";
    const nm = n.label || n.name;
    if (nm && !kids.length) s += "<name>" + esc(nm) + "</name>";
    if (n.support) s += '<confidence type="bootstrap">' + esc(n.support) + "</confidence>";
    kids.forEach(c => { s += clade(c); });
    return s + "</clade>";
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n<phyloxml xmlns="http://www.phyloxml.org">\n<phylogeny rooted="true">\n' + clade(ctx.root) + "\n</phylogeny>\n</phyloxml>\n";
}
global.TreeSerialize = { newickName, toNewick, toNexus, toPhyloXML };
})(window);
(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const L = global.TreeLayout;
const GAP_COLOR = "#888888";
const TICK_FONT = "#555";

function isInvert() { const v = C.state.invert; return v === true || v === "true"; }
function isDashed() { const v = C.state.dashed; return v === true || v === "true"; }
function dashAttr() { if (!isDashed()) return ""; const st = C.state; return `${Math.max(1, st.dashSize * 8)} ${Math.max(2, st.dashSize * 12)}`; }
function niceRound(v) {
  if (!isFinite(v) || v <= 0) return 1;
  const exp = Math.floor(Math.log10(v)); const base = Math.pow(10, exp); const n = v / base;
  let m; if (n < 1.5) m = 1; else if (n < 3.5) m = 2; else if (n < 7.5) m = 5; else m = 10;
  return m * base;
}
function branchLenDisplay(n) {
  const field = C.state.branchLengthField;
  if (field) {
    const f = (n.meta || []).find(m => m.field === field);
    if (f) {
      let v = f.value;
      if (Array.isArray(v) && v.length >= 2) {
        const a = Number(v[0]), b = Number(v[1]);
        v = (isFinite(a) && isFinite(b)) ? (a + b) / 2 : a;
      }
      const num = Number(v); if (isFinite(num)) return num;
    }
  }
  return n.length || 0;
}
function timeTickText(v) {
  const st = C.state;
  const rootTick = Number(st.rootTickValue) || 0;
  const timeFactor = Number(st.timeScaleFactor) || 1;
  return (st.timeTreeMode ? (rootTick + v * timeFactor) : v).toFixed(2);
}
function showRootLine() {
  const st = C.state;
  if (st.showRoot === false) return false;
  if (st.forceMidpointRoot) return true;
  return !!st.hasRoot;
}

let _nodeValueRangeCache = {};
function getNodeLabelValue(n, item, raw) {
  if (!n || !item || !item.column) return null;
  const col = item.column;
  if (col === "support") return n.support != null ? n.support : null;
  if (col === "length") return n.length != null ? n.length : null;
  if (col === "cumLength") {
    let cum = 0;
    for (let c = n; c && c.parent; c = c.parent) cum += Number(c.length) || 0;
    return cum;
  }
  if (col === "uid") return n.uid || null;
  if (col === "label") return T.labelOf(n);
  const m = (n.meta || []).find(mm => mm.field === col);
  if (m) {
    if (Array.isArray(m.value) && m.value.length >= 2) {
      if (raw) return m.value.slice();
      const a = Number(m.value[0]), b = Number(m.value[1]);
      if (Number.isFinite(a) && Number.isFinite(b)) return (a + b) / 2;
      return m.value[0];
    }
    return m.value;
  }
  return null;
}
function getNodeLabelValueRange(column) {
  if (_nodeValueRangeCache[column]) return _nodeValueRangeCache[column];
  let mn = Infinity, mx = -Infinity;
  if (C.getRoot()) {
    T.allWalk(C.getRoot(), n => {
      const v = getNodeLabelValue(n, { column });
      const num = parseFloat(v);
      if (Number.isFinite(num)) { mn = Math.min(mn, num); mx = Math.max(mx, num); }
    });
  }
  if (mn === Infinity) return null;
  _nodeValueRangeCache[column] = { min: mn, max: mx };
  return _nodeValueRangeCache[column];
}
function mapSymbolSize(value, item) {
  const num = parseFloat(value);
  const mn = Number(item.minSize) || 2;
  const mx = Number(item.maxSize) || 10;
  if (!Number.isFinite(num)) return mn;
  const rng = getNodeLabelValueRange(item.column);
  if (!rng || rng.max === rng.min) return (mn + mx) / 2;
  const t = Math.max(0, Math.min(1, (num - rng.min) / (rng.max - rng.min)));
  return mn + t * (mx - mn);
}
function formatLabelText(v, it) {
  const d = it.decimals != null ? it.decimals : 2;
  if (Array.isArray(v)) {
    const a = Number(v[0]), b = Number(v[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return "[" + v.join(", ") + "]";
    return `[${a.toFixed(d)}, ${b.toFixed(d)}]`;
  }
  if (v == null || v === "") return "";
  if (it.asPercent) {
    const num = parseFloat(v);
    if (!Number.isFinite(num)) return String(v);
    return (num * 100).toFixed(d) + "%";
  }
  if (!isNaN(parseFloat(v)) && Number.isFinite(Number(v))) {
    return Number(v).toFixed(d);
  }
  return String(v);
}
function passesThreshold(item, value) {
  const logic = item.thresholdLogic;
  if (!logic) return true;
  const tv = Number(item.threshold);
  if (!Number.isFinite(tv)) return true;
  let v = value;
  if (Array.isArray(v)) {
    const a = Number(v[0]), b = Number(v[1]);
    v = (Number.isFinite(a) && Number.isFinite(b)) ? (a + b) / 2 : a;
  }
  const num = parseFloat(v);
  if (!Number.isFinite(num)) return false;
  switch (logic) {
    case 'gt': return num > tv;
    case 'gte': return num >= tv;
    case 'lt': return num < tv;
    case 'lte': return num <= tv;
  }
  return true;
}

function hasRealChildren(n) {
  return !!(n && (n.children || []).some(c => !c.deleted));
}
function branchStroke(n) {
  const st = C.state;
  if (n.branchColor) return n.branchColor;
  if (n.highlight) return n.rangeColor || "#e64b35";
  return st.branchColor;
}
function commonLineAttrs(n, opts) {
  opts = opts || {};
  const st = C.state;
  const dashed = n.branchDash !== undefined ? n.branchDash : isDashed();
  const dash = dashed ? `${Math.max(1,st.dashSize*8)} ${Math.max(2,st.dashSize*12)}` : "";
  const selected = n.id === C.getSelectedBranchId();
  const attrs = {
    stroke: selected ? "#ff4b4b" : branchStroke(n),
    "stroke-width": st.branchWidth * (n.branchWidthFactor || 1) * (selected ? 1.8 : 1),
    "stroke-linecap": "round", "stroke-dasharray": dash,
    fill: "none", opacity: .94, "data-id": n.id
  };
  if (opts.noPointer) attrs["pointer-events"] = "none";
  else { attrs.class = "branch-line clickable"; attrs.style = "cursor:pointer"; if (opts.branchId) attrs["data-branch-id"] = opts.branchId; }
  return attrs;
}
function gapLineAttrs() {
  return { stroke: GAP_COLOR, "stroke-width": 1, "stroke-linecap": "round", "stroke-dasharray": dashAttr(), fill: "none", opacity: .7, "pointer-events": "none" };
}

function drawLengthLabel(parent, child, radial) {
  const st = C.state;
  const cfg = st.lengthLabel || {};
  if (!cfg.show) return;
  const realKids = (child.children || []).filter(c => !c.deleted);
  if (realKids.length === 0) return;
  const fs = Math.max(6, Number(cfg.fontSize) || 9);
  const offX = Number(cfg.offsetX) || 0;
  const offY = Number(cfg.offsetY) || 0;
  const decimals = Math.max(0, Math.min(6, Number(cfg.decimals) || 0));
  const root = C.getRoot();
  const totalDepth = Math.max(T.maxDepth(root, 0) || 1, 1e-9);
  const factor = Number(cfg.timeFactor) || 1;
  const rootAge = (cfg.timeRootAge != null && Number(cfg.timeRootAge) > 0) ? Number(cfg.timeRootAge) : totalDepth;
  function depthToTime(v) {
    const d = Math.max(0, totalDepth - v);
    return Math.max(0, d / totalDepth * rootAge * factor);
  }
  function getCiValue(node, field) {
    if (!node || !field) return null;
    const m = (node.meta || []).find(mm => mm.field === field);
    if (!m) return null;
    const v = m.value;
    if (Array.isArray(v) && v.length >= 2) {
      const lo = Number(v[0]), hi = Number(v[1]);
      if (Number.isFinite(lo) && Number.isFinite(hi)) return [lo, hi];
    }
    if (typeof v === "string") {
      const nums = v.match(/-?\d+(?:\.\d+)?/g);
      if (nums && nums.length >= 2) return [Number(nums[0]), Number(nums[1])];
    }
    if (v && typeof v === "object") {
      const lo = Number(v.lower != null ? v.lower : (v.min != null ? v.min : (v.lo != null ? v.lo : (v.start != null ? v.start : v.from))));
      const hi = Number(v.upper != null ? v.upper : (v.max != null ? v.max : (v.hi != null ? v.hi : (v.end != null ? v.end : v.to))));
      if (Number.isFinite(lo) && Number.isFinite(hi)) return [lo, hi];
    }
    return null;
  }
  function getCiFromAncestors(node, field) {
    let cur = node;
    while (cur) {
      const ci = getCiValue(cur, field);
      if (ci) return ci;
      cur = cur.parent;
    }
    return null;
  }
  let value;
  let ci = null;
  if (cfg.asTime) {
    let cum = 0;
    for (let c = child; c && c.parent; c = c.parent) cum += Number(c.length) || 0;
    value = depthToTime(cum);
    if (cfg.ciField) {
      const raw = getCiFromAncestors(child, cfg.ciField);
      if (raw) ci = [depthToTime(raw[0]), depthToTime(raw[1])];
    }
  } else {
    value = branchLenDisplay(child);
    if (cfg.ciField) {
      const raw = getCiFromAncestors(child, cfg.ciField);
      if (raw) ci = raw;
    }
  }
  let text = Number(value).toFixed(decimals);
  if (ci && Number.isFinite(ci[0]) && Number.isFinite(ci[1])) {
    text = `${text}(${ci[0].toFixed(decimals)} - ${ci[1].toFixed(decimals)})`;
  }
  let x, y, anchor = "middle", rot = 0;
  let radialShift = 0;
  if (radial) {
    const angle = child.angle || 0;
    const nodeR = child.r || 0;
    const inwardOffset = Math.max(fs * 0.8, 5);
    const halfW = text.length * fs * 0.6 / 2;
    const labelR = Math.max(0, nodeR - inwardOffset - halfW);
    const p = L.polar(470, 380, labelR, angle);
    x = p.x; y = p.y;
    rot = angle - 90;
    if (rot > 90) rot -= 180;
    if (rot < -90) rot += 180;
    anchor = "middle";
    radialShift = -fs * 0.5;
  } else {
    if (cfg.asTime) {
      x = child.x - 3;
      y = child.y - 3 + offY;
      anchor = "end";
    } else {
      x = (parent.x + child.x) / 2 + offX;
      y = child.y - 3 + offY;
      anchor = "middle";
    }
  }
  const attrs = {
    x, y,
    "font-size": fs,
    "font-family": st.fontFamily,
    "font-weight": cfg.bold ? "700" : "400",
    "font-style": cfg.italic ? "italic" : "normal",
    "text-anchor": anchor,
    "dominant-baseline": "middle",
    fill: "#000000",
    "data-id": child.id
  };
  if (radial) attrs.transform = `rotate(${rot} ${x} ${y}) translate(0 ${radialShift})`;
  const textEl = C.el("text", attrs);
  textEl.textContent = text;
  if (cfg.bgShow) {
    try {
      const bb = textEl.getBBox();
      const rect = C.el("rect", {
        x: bb.x - 3, y: bb.y - 2, width: bb.width + 6, height: bb.height + 4,
        fill: cfg.bgFill || "#ffffff",
        stroke: (Number(cfg.bgBorderWidth) > 0) ? (cfg.bgBorderColor || "#999999") : "none",
        "stroke-width": Number(cfg.bgBorderWidth) || 0
      });
      if (radial) rect.setAttribute("transform", `rotate(${rot} ${x} ${y}) translate(0 ${radialShift})`);
      C.getSvg().insertBefore(rect, textEl);
    } catch (_) {}
  }
}

function drawRectBranch(parent, child) {
  const st = C.state;
  const shape = st.lineShape || "straight";
  if (shape === "slanted") {
    C.el("line", { x1: parent.x, y1: parent.y, x2: child.x, y2: child.y, ...commonLineAttrs(child, { branchId: child.id }) });
  } else if (shape === "curved") {
    const mx = (parent.x + child.x) / 2;
    C.el("path", { d: `M ${parent.x} ${parent.y} C ${mx} ${parent.y}, ${mx} ${child.y}, ${child.x} ${child.y}`, ...commonLineAttrs(child, { branchId: child.id }) });
  } else {
    C.el("path", { d: `M ${parent.x} ${parent.y} L ${parent.x} ${child.y}`, ...commonLineAttrs(child, { noPointer: true }) });
    C.el("path", { d: `M ${parent.x} ${child.y} L ${child.x} ${child.y}`, ...commonLineAttrs(child, { branchId: child.id }) });
  }
  if (st.lengthLabel && st.lengthLabel.show) {
    drawLengthLabel(parent, child, false);
  } else if (st.showLength) {
    const lenVal = branchLenDisplay(child);
    C.el("text", { x:(parent.x+child.x)/2, y:child.y-3, "font-size":9, "text-anchor":"middle", fill:"#9aa3a3", "data-id":child.id })
      .textContent = lenVal.toFixed(lenVal < 0.1 ? 3 : 2);
  }
  if (st.extendBranches && st.labelPosition === "aligned" && T.isLeaf(child) && !child.collapsed) {
    const targetX = C.alignedLabelX();
    if (Math.abs(targetX - child.x) > 0.5) C.el("line", { x1: child.x, y1: child.y, x2: targetX, y2: child.y, ...gapLineAttrs() });
  }
  if (child.truncated) {
    const mx = (parent.x + child.x) / 2, my = child.y;
    C.el("line", { x1: mx-5, y1: my+6, x2: mx-1, y2: my-6, stroke:"#3a3a3a", "stroke-width":1.8, "stroke-linecap":"round" });
    C.el("line", { x1: mx+1, y1: my+6, x2: mx+5, y2: my-6, stroke:"#3a3a3a", "stroke-width":1.8, "stroke-linecap":"round" });
  }
}
function drawRadialBranch(parent, child) {
  const st = C.state;
  const shape = st.lineShape || "straight";
  if (shape !== "slanted" && parent !== C.getRoot()) {
    const large = Math.abs(child.angle - parent.angle) > 180 ? 1 : 0;
    const sweep = child.angle > parent.angle ? 1 : 0;
    const arcStart = L.polar(470, 380, parent.r, parent.angle);
    const arcEnd = L.polar(470, 380, parent.r, child.angle);
    C.el("path", { d: `M ${arcStart.x} ${arcStart.y} A ${parent.r} ${parent.r} 0 ${large} ${sweep} ${arcEnd.x} ${arcEnd.y}`, ...commonLineAttrs(child, { branchId: child.id }), opacity: .94 });
    C.el("line", { x1: arcEnd.x, y1: arcEnd.y, x2: child.x, y2: child.y, ...commonLineAttrs(child, { branchId: child.id }) });
  } else {
    C.el("line", { x1: parent.x, y1: parent.y, x2: child.x, y2: child.y, ...commonLineAttrs(child, { branchId: child.id }) });
  }
  if (st.extendBranches && T.isLeaf(child) && !child.collapsed) {
    let rEnd;
    if (st.labelPosition === "aligned") rEnd = C.getRadialLabelR() - 8;
    else rEnd = (child.r || 0) + 6;
    if (rEnd > (child.r || 0) + 0.5) {
      const tip = L.polar(470, 380, child.r || 0, child.angle || 0);
      const end = L.polar(470, 380, rEnd, child.angle || 0);
      C.el("line", { x1: tip.x, y1: tip.y, x2: end.x, y2: end.y, ...gapLineAttrs() });
    }
  }
  if (child.truncated) {
    const mx = (parent.x + child.x) / 2, my = (parent.y + child.y) / 2;
    C.el("line", { x1: mx-5, y1: my+5, x2: mx-1, y2: my-5, stroke:"#3a3a3a", "stroke-width":1.8, "stroke-linecap":"round" });
    C.el("line", { x1: mx+1, y1: my+5, x2: mx+5, y2: my-5, stroke:"#3a3a3a", "stroke-width":1.8, "stroke-linecap":"round" });
  }
  if (st.lengthLabel && st.lengthLabel.show) {
    drawLengthLabel(parent, child, true);
  } else if (st.showLength) {
    const mx = (parent.x + child.x) / 2, my = (parent.y + child.y) / 2;
    const lenVal = branchLenDisplay(child);
    C.el("text", { x:mx, y:my-2, "font-size":9, "text-anchor":"middle", fill:"#9aa3a3" })
      .textContent = lenVal.toFixed(lenVal < 0.1 ? 3 : 2);
  }
}
global.TreeDrawBranch = { branchStroke, commonLineAttrs, gapLineAttrs, drawRectBranch, drawRadialBranch };

function collectHiddenLeaves(n) {
  const out = [];
  (function rec(m) { if (m.deleted) return; const kids = (m.children || []).filter(c => !c.deleted); if (!kids.length) { out.push(m); return; } kids.forEach(rec); })(n);
  return out;
}
function drawCollapsedTriangle(n, hiddenLeaves, radial) {
  if (!hiddenLeaves || hiddenLeaves.length < 2) return;
  const st = C.state;
  const mode = st.collapsedMode || "actual";
  const tipOffset = Math.max(0, Number(st.collapsedTipOffset) || 0);
  const canExtend = !!st.extendBranches && st.labelPosition === "aligned";
  const useExtended = (mode === "extended" && canExtend);
  const fill = st.collapsedFill || "#dbe6f0";
  const fillOpacity = (st.collapsedFillOpacity != null) ? Number(st.collapsedFillOpacity) : 0.9;
  const tipPoint = radial ? L.polar(470, 380, (n.r || 0) + tipOffset, n.angle || 0) : { x: (n.x || 0) + tipOffset, y: (n.y || 0) };
  let points;
  if (radial) {
    const sorted = [...hiddenLeaves].sort((a, b) => (a.angle || 0) - (b.angle || 0));
    const first = sorted[0], last = sorted[sorted.length - 1];
    if (useExtended) {
      const baseR = C.getRadialLabelR() - 10;
      const sA = (n._slotStartA != null) ? n._slotStartA : (first.angle || 0);
      const eA = (n._slotEndA != null) ? n._slotEndA : (last.angle || 0);
      const p0 = L.polar(470, 380, baseR, sA), p1 = L.polar(470, 380, baseR, eA);
      points = `${tipPoint.x},${tipPoint.y} ${p0.x},${p0.y} ${p1.x},${p1.y}`;
    } else {
      const p0 = L.polar(470, 380, first.r || 0, first.angle || 0);
      const p1 = L.polar(470, 380, last.r || 0, last.angle || 0);
      points = `${tipPoint.x},${tipPoint.y} ${p0.x},${p0.y} ${p1.x},${p1.y}`;
    }
  } else {
    const sorted = [...hiddenLeaves].sort((a, b) => (a.y || 0) - (b.y || 0));
    const first = sorted[0], last = sorted[sorted.length - 1];
    if (useExtended) {
      const baseX = C.alignedLabelX() - 10;
      const sY = (n._slotStart != null) ? n._slotStart : (first.y || 0);
      const eY = (n._slotEnd != null) ? n._slotEnd : (last.y || 0);
      points = `${tipPoint.x},${tipPoint.y} ${baseX},${sY} ${baseX},${eY}`;
    } else { points = `${tipPoint.x},${tipPoint.y} ${first.x || 0},${first.y || 0} ${last.x || 0},${last.y || 0}`; }
  }
  if (tipOffset > 0) C.el("line", { x1: n.x || 0, y1: n.y || 0, x2: tipPoint.x, y2: tipPoint.y, stroke: "#6b7c8c", "stroke-width": 1.5, "stroke-linecap": "round", "pointer-events": "none" });
  C.el("polygon", { points, fill, stroke: "#6b7c8c", "stroke-width": 1.5, "stroke-linejoin": "round", "fill-opacity": fillOpacity, class: "collapsed-clade clickable", "data-id": n.id });
}
global.TreeCollapsedClade = { collectHiddenLeaves, drawCollapsedTriangle };

function formatBootstrapValue(raw, mode) {
  const text = String(raw == null ? "" : raw);
  const format = mode || C.state.bootstrapFormat || "auto";
  if (!text || format === "raw") return text;
  return text.split("/").map(part => {
    const value = Number(part); if (!Number.isFinite(value)) return part;
    const scale = format === "percent" || (format === "auto" && value >= 0 && value <= 1);
    return scale ? String(Number((value * 100).toFixed(6))) : part;
  }).join("/");
}
function drawSymbol(shape, cx, cy, s, fill, strokeColor, strokeWidth, parent) {
  const attrs = { fill };
  if (strokeColor && strokeWidth > 0) { attrs.stroke = strokeColor; attrs["stroke-width"] = strokeWidth; }
  const el = (tag, a) => C.el(tag, a, parent);
  if (shape === "square") return el("rect", { x: cx-s, y: cy-s, width: s*2, height: s*2, ...attrs });
  if (shape === "triangle") return el("polygon", { points: `${cx},${cy-s} ${cx+s},${cy+s} ${cx-s},${cy+s}`, ...attrs });
  if (shape === "triangle-left") return el("polygon", { points: `${cx+s},${cy-s} ${cx-s},${cy} ${cx+s},${cy+s}`, ...attrs });
  if (shape === "triangle-right") return el("polygon", { points: `${cx-s},${cy-s} ${cx+s},${cy} ${cx-s},${cy+s}`, ...attrs });
  if (shape === "star") {
    let pts = "";
    for (let i = 0; i < 10; i++) { const r = i%2?s*0.45:s; const a = (-90+i*36)*Math.PI/180; pts += `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)} `; }
    return el("polygon", { points: pts.trim(), ...attrs });
  }
  if (shape === "check") { const tx = el("text", { x: cx, y: cy+s*0.7, "font-size": s*2, "text-anchor": "middle", fill }); tx.textContent = "✔"; return tx; }
  return el("circle", { cx, cy, r: s, ...attrs });
}

function richTspans(text, runs) {
  const charStyle = [];
  for (let i = 0; i < text.length; i++) { let st = null; runs.forEach(r => { if (i >= r.start && i < r.end) st = r; }); charStyle.push(st); }
  const groups = [];
  for (let i = 0; i < text.length; i++) {
    const last = groups[groups.length-1];
    if (last && last.st === charStyle[i]) last.text += text[i];
    else groups.push({ st: charStyle[i], text: text[i] });
  }
  return groups;
}

function rangeTextColorOf(n) {
  if (!global.TreeRanges || global.TreeRanges.rangeColorMode !== "text") return null;
  let cur = n;
  while (cur) {
    if (cur.rangeId != null) {
      const r = global.TreeRanges.rangeById(cur.rangeId);
      if (r) return r.color;
    }
    cur = cur.parent;
  }
  return null;
}

function drawLeafLabel(n, radial) {
  const st = C.state;
  const text = T.labelOf(n);
  const size = st.fontSize * (n.labelSizeFactor || 1);
  const rangeColor = rangeTextColorOf(n);
  const color = rangeColor || n.labelColor || st.labelColor;
  const inv = isInvert();
  const isAligned = st.labelPosition === "aligned";
  const GAP = 8; const shift = Number(st.labelShift || 0);
  let x, y, anchor = "start", rotate = 0;
  if (!radial) {
    y = n.y + size * .34;
    if (isAligned) {
      const alignX = C.alignedLabelX() + shift;
      const maxW = C.maxTextWidth || 100;
      const la = st.labelAnchorRect || "left";
      if (!inv) { if (la === "left") { x = alignX + GAP; anchor = "start"; } else { x = alignX + maxW + GAP * 2; anchor = "end"; } }
      else { if (la === "left") { x = alignX - maxW - GAP * 2; anchor = "start"; } else { x = alignX - GAP; anchor = "end"; } }
    } else {
      if (!inv) { x = n.x + GAP; anchor = "start"; } else { x = n.x - GAP; anchor = "end"; }
      if (st.extendBranches) C.el("line", { x1: n.x, y1: n.y, x2: x, y2: n.y, ...gapLineAttrs() });
    }
  } else {
    const angle = n.angle || 0;
    let rLabel;
    if (isAligned) rLabel = C.getRadialLabelR() + shift;
    else {
      rLabel = (n.r || 0) + GAP + shift;
      const tipR = n.r || 0, endR = tipR + GAP + shift;
      if (st.extendBranches && endR > tipR + 0.5) {
        const pA = L.polar(470, 380, tipR, angle);
        const pB = L.polar(470, 380, endR, angle);
        C.el("line", { x1: pA.x, y1: pA.y, x2: pB.x, y2: pB.y, ...gapLineAttrs() });
      }
    }
    const p = L.polar(470, 380, rLabel, angle);
    x = p.x; y = p.y;
    const la = st.labelAnchorCirc || "auto";
    if (la === "left") anchor = "end"; else if (la === "right") anchor = "start";
    else anchor = (angle > 180 && angle < 360) ? "end" : "start";
    rotate = angle - 90; if (anchor === "end") rotate += 180;
  }
  const label = C.el("text", {
    x, y, "text-anchor": anchor, "font-size": size, "font-family": st.fontFamily,
    "font-weight": (st.bold || n.labelBold) ? "700" : "400",
    "font-style": (st.italic || n.labelItalic) ? "italic" : "normal",
    fill: color, class: "leaf-label", "data-id": n.id,
    transform: radial ? `rotate(${rotate} ${x} ${y})` : undefined
  });
  if (n.styleRuns && n.styleRuns.length) {
    richTspans(text, n.styleRuns).forEach(g => {
      const a = {};
      if (g.st) {
        if (g.st.bold) a["font-weight"] = "700";
        if (g.st.italic) a["font-style"] = "italic";
        if (g.st.color) a.fill = g.st.color;
        let fs = g.st.f && g.st.f !== 1 ? size * g.st.f : null;
        if (g.st.sup) { a["baseline-shift"] = "super"; fs = (fs || size) * 0.72; }
        if (g.st.sub) { a["baseline-shift"] = "sub"; fs = (fs || size) * 0.72; }
        if (fs) a["font-size"] = fs;
        if (g.st.dx) a.dx = g.st.dx;
        if (g.st.dy) a.dy = g.st.dy;
      }
      C.el("tspan", a, label).textContent = g.text;
    });
  } else label.textContent = text;
  if (n.labelBg && n.labelBg !== "transparent") {
    let bgX, bgY, bgW, bgH, bb = null;
    try { bb = label.getBBox(); } catch (_) {}
    if (bb && bb.width) { bgX = bb.x-4; bgY = bb.y-2; bgW = bb.width+8; bgH = bb.height+4; }
    else { const approxW = Math.max(18, text.length * size * 0.62); bgX = anchor === "end" ? x - approxW - 4 : x - 4; bgY = y - size * .78; bgW = approxW + 8; bgH = size * 1.12; }
    const bg = C.el("rect", { x: bgX, y: bgY, width: bgW, height: bgH, rx: 3, fill: n.labelBg, opacity: .88 });
    if (radial) bg.setAttribute("transform", `rotate(${rotate} ${x} ${y})`);
    C.getSvg().insertBefore(bg, label);
  }
}

function drawNodeLabels(n, radial) {
  const st = C.state;
  const cfg = st.nodeLabelCommon || {};
  const items = (st.nodeLabels || []).filter(it => it.column);
  if (!items.length) return;
  const realKids = (n.children || []).filter(c => !c.deleted);
  if (cfg.hideOnLeaves && realKids.length === 0) return;
  const fs = Math.max(6, Number(cfg.fontSize) || 10);
  const offX = Number(cfg.offsetX) || 8;
  const offY = Number(cfg.offsetY) || -6;
  const sep = String(cfg.separator != null ? cfg.separator : "/");
  const radialShift = -fs * 0.5;
  const valid = [];
  items.forEach(it => {
    if (it.mode === "symbol") {
      const avg = getNodeLabelValue(n, it, false);
      if (avg == null || avg === "") return;
      const num = parseFloat(avg);
      if (!Number.isFinite(num)) return;
      if (!passesThreshold(it, avg)) return;
      valid.push({ kind: "symbol", item: it, avg: num });
    } else {
      const raw = getNodeLabelValue(n, it, true);
      if (raw == null || raw === "") return;
      if (!passesThreshold(it, raw)) return;
      const txt = formatLabelText(raw, it);
      if (!txt) return;
      valid.push({ kind: "text", item: it, text: txt });
    }
  });
  if (!valid.length) return;
  const textItems = valid.filter(v => v.kind === "text");
  const symbolItems = valid.filter(v => v.kind === "symbol");
  const mergeText = cfg.mergeText !== false;
  const fillColorAs = cfg.fillColorAs || "text";
  const bgFill = cfg.bgFill || "#eeeeee";
  const bgBorderColor = cfg.bgBorderColor || "#cccccc";
  const bgBorderWidth = Number(cfg.bgBorderWidth) || 0;
  const textColorOnBg = cfg.textColorOnBg || "#222222";
  let totalW;
  if (mergeText && textItems.length) {
    const textW = textItems.map(v => v.text).join(sep).length * fs * 0.6;
    const symbolW = symbolItems.reduce((acc, v) => acc + mapSymbolSize(v.avg, v.item) * 2 + 4, 0);
    totalW = textW + symbolW;
  } else {
    totalW = valid.reduce((acc, v) => {
      if (v.kind === "symbol") return acc + mapSymbolSize(v.avg, v.item) * 2 + 4;
      return acc + v.text.length * fs * 0.6;
    }, 0);
  }
  let baseX, baseY, rot = 0;
  if (radial) {
    const angle = n.angle || 0;
    const parent = n.parent;
    const midR = parent ? ((parent.r || 0) + (n.r || 0)) / 2 : (n.r || 0);
    const gap = Math.max(fs * 0.5, 4);
    const maxOuterR = (n.r || 0) - gap;
    const centerR = Math.max(0, Math.min(midR, maxOuterR - totalW / 2));
    const midP = L.polar(470, 380, centerR, angle);
    const tangentOffset = Math.max(fs * 1.2, 8);
    const offP = L.polar(0, 0, tangentOffset, angle + 90);
    baseX = midP.x + offP.x;
    baseY = midP.y + offP.y;
    rot = angle - 90;
    if (rot > 90) rot -= 180;
    if (rot < -90) rot += 180;
  } else {
    baseX = n.x + offX;
    baseY = n.y + offY;
  }
  const group = C.el("g", { transform: `translate(${baseX} ${baseY})${rot ? " rotate(" + rot + ")" : ""}` });
  const commonAttrs = {
    "font-size": fs, "font-family": st.fontFamily,
    "font-weight": cfg.bold ? "700" : "400",
    "font-style": cfg.italic ? "italic" : "normal",
    "dominant-baseline": "middle", fill: "#333333", "data-id": n.id
  };
  const baseYInGroup = radial ? radialShift : 0;
  if (mergeText && textItems.length) {
    let cursorX = -totalW / 2;
    symbolItems.forEach(v => {
      const size = mapSymbolSize(v.avg, v.item);
      const sym = drawSymbol(v.item.shape || "circle", cursorX + size, baseYInGroup, size,
        v.item.fillColor || "#E64B35", v.item.strokeColor, v.item.strokeWidth, group);
      if (sym) sym.setAttribute("data-id", n.id);
      cursorX += size * 2 + 4;
    });
    const combined = textItems.map(v => v.text).join(sep);
    if (combined) {
      const txtFill = fillColorAs === "background" ? textColorOnBg : "#333333";
      const tEl = C.el("text", Object.assign({
        x: cursorX, y: baseYInGroup, "text-anchor": "start", fill: txtFill
      }, commonAttrs), group);
      tEl.textContent = combined;
      if (fillColorAs === "background") {
        try {
          const bb = tEl.getBBox();
          const rect = C.el("rect", {
            x: bb.x - 3, y: bb.y - 1, width: bb.width + 6, height: bb.height + 2,
            fill: bgFill, rx: 2,
            stroke: bgBorderWidth > 0 ? bgBorderColor : "none",
            "stroke-width": bgBorderWidth, "pointer-events": "none"
          }, group);
          group.insertBefore(rect, tEl);
        } catch (_) {}
      }
    }
  } else {
    let cursorX = -totalW / 2;
    let hasText = false;
    valid.forEach(v => {
      if (v.kind === "symbol") {
        const size = mapSymbolSize(v.avg, v.item);
        const sym = drawSymbol(v.item.shape || "circle", cursorX + size, baseYInGroup, size,
          v.item.fillColor || "#E64B35", v.item.strokeColor, v.item.strokeWidth, group);
        if (sym) sym.setAttribute("data-id", n.id);
        cursorX += size * 2 + 4;
        hasText = false;
      } else {
        let txt = v.text;
        if (hasText && sep) txt = sep + txt;
        const txtFill = fillColorAs === "background" ? textColorOnBg : "#333333";
        const tEl = C.el("text", Object.assign({
          x: cursorX, y: baseYInGroup, "text-anchor": "start", fill: txtFill
        }, commonAttrs), group);
        tEl.textContent = txt;
        if (fillColorAs === "background") {
          try {
            const bb = tEl.getBBox();
            const rect = C.el("rect", {
              x: bb.x - 3, y: bb.y - 1, width: bb.width + 6, height: bb.height + 2,
              fill: bgFill, rx: 2,
              stroke: bgBorderWidth > 0 ? bgBorderColor : "none",
              "stroke-width": bgBorderWidth, "pointer-events": "none"
            }, group);
            group.insertBefore(rect, tEl);
          } catch (_) {}
        }
        let w = txt.length * fs * 0.6;
        try { w = tEl.getBBox().width; } catch (_) {}
        cursorX += w;
        hasText = true;
      }
    });
  }
}

function drawRangeLabels(radial) {
  const st = C.state;
  const cfg = st.rangeLabelConfig || {};
  if (!cfg.show || !cfg.field) return;
  const root = C.getRoot();
  if (!root) return;
  const field = cfg.field;
  const maxD = Math.max(T.maxDepth(root, 0), 0.01);
  const treeW = 560 * (st.scaleH || 1);
  const maxR = 285 * (st.scaleH || 1);
  const isInv = (st.invert === true || st.invert === "true");
  const left = 90;
  const scale = treeW / maxD;
  const lineH = Math.max(1, Number(cfg.lineHeight) || 8);
  const color = cfg.color || "#67cb9e";
  const outlineW = Math.max(0, Number(cfg.outlineWidth) || 0);
  const outlineColor = cfg.outlineColor || "#333333";
  const opacity = Math.max(0, Math.min(1, Number(cfg.opacity != null ? cfg.opacity : 0.8)));
  T.allWalk(root, n => {
    if (n.deleted) return;
    if (!hasRealChildren(n)) return;
    const m = (n.meta || []).find(mm => mm.field === field);
    if (!m) return;
    const v = m.value;
    if (!Array.isArray(v) || v.length < 2) return;
    const lo = Number(v[0]), hi = Number(v[1]);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return;
    if (!radial) {
      const posLo = isInv ? (left + lo * scale) : (left + treeW - lo * scale);
      const posHi = isInv ? (left + hi * scale) : (left + treeW - hi * scale);
      const x0 = Math.min(posLo, posHi), x3 = Math.max(posLo, posHi);
      const y = n.y;
      if (outlineW > 0) {
        C.el("line", { x1: x0, x2: x3, y1: y, y2: y, stroke: outlineColor, "stroke-width": lineH + outlineW * 2, "stroke-linecap": "butt", "pointer-events": "none", opacity });
      }
      C.el("line", { x1: x0, x2: x3, y1: y, y2: y, stroke: color, "stroke-width": lineH, "stroke-linecap": "butt", "pointer-events": "none", opacity });
    } else {
      const rLo = 24 + maxR * (1 - lo / maxD);
      const rHi = 24 + maxR * (1 - hi / maxD);
      const angle = n.angle || 0;
      const p1 = L.polar(470, 380, rLo, angle);
      const p2 = L.polar(470, 380, rHi, angle);
      if (outlineW > 0) {
        C.el("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: outlineColor, "stroke-width": lineH + outlineW * 2, "stroke-linecap": "butt", "pointer-events": "none", opacity });
      }
      C.el("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: color, "stroke-width": lineH, "stroke-linecap": "butt", "pointer-events": "none", opacity });
    }
  });
}

function drawNodesAndLabels(radial) {
  const st = C.state, selId = C.getSelectedId(), branchSel = C.getSelectedBranchId();
  if (st.lengthLabel && st.lengthLabel.show && st.lengthLabel.asTime) {
    const root = C.getRoot();
    if (root) {
      const totalDepth = Math.max(T.maxDepth(root, 0) || 1, 1e-9);
      const factor = Number(st.lengthLabel.timeFactor) || 1;
      const rootAge = (st.lengthLabel.timeRootAge != null && Number(st.lengthLabel.timeRootAge) > 0)
                        ? Number(st.lengthLabel.timeRootAge) : totalDepth;
      const displayAge = rootAge * factor;
      const text = displayAge.toFixed(Math.max(0, Number(st.lengthLabel.decimals) || 0));
      const x = radial ? 470 : root.x;
      const y = radial ? 380 - 8 : root.y - 10 + (Number(st.lengthLabel.offsetY) || 0);
      C.el("text", {
        x, y,
        "font-size": Math.max(6, Number(st.lengthLabel.fontSize) || 9),
        "font-family": st.fontFamily,
        "font-weight": st.lengthLabel.bold ? "700" : "400",
        "font-style": st.lengthLabel.italic ? "italic" : "normal",
        "text-anchor": "middle", fill: "#000000"
      }).textContent = text;
    }
  }
  T.walk(C.getRoot(), n => {
    const realKids = (n.children || []).filter(c => !c.deleted);
    if (n.collapsed && realKids.length) {
      const hidden = collectHiddenLeaves(n);
      drawCollapsedTriangle(n, hidden, radial);
    }
    const sx = n.x, sy = n.y;
    let hotspot;
    if ((T.isLeaf(n) && st.leafSymbols) || (!T.isLeaf(n) && st.internalSymbols)) {
      const shp = T.isLeaf(n) ? st.leafSymShape : st.intSymShape;
      const sz = T.isLeaf(n) ? st.leafSymSize : st.intSymSize;
      const fill = n.color || (n.highlight ? "#e64b35" : (T.isLeaf(n) ? st.leafSymFill : st.intSymFill));
      hotspot = drawSymbol(shp, sx, sy, sz, fill);
      hotspot.setAttribute("stroke", T.isLeaf(n) ? st.leafSymBC : st.intSymBC);
      hotspot.setAttribute("stroke-width", T.isLeaf(n) ? st.leafSymBW : st.intSymBW);
      hotspot.setAttribute("class", "node-hotspot");
      hotspot.setAttribute("data-id", n.id);
    } else {
      hotspot = C.el("circle", { cx: sx, cy: sy, r: 7, fill: "transparent", stroke: "transparent", class: "node-hotspot", "data-id": n.id });
    }
    if (n.meta && n.meta.length) {
      const tip = n.meta.map(f => { const v = Array.isArray(f.value) ? "[" + f.value.join(", ") + "]" : f.value; return f.field + ": " + v; }).join(" · ");
      C.el("title", {}, hotspot).textContent = tip;
    }
    if (n.id === selId) {
      if (radial) {
        const angle = n.angle || 0;
        const off = 16, half = 6;
        const tip = L.polar(470, 380, (n.r || 0) + off, angle);
        const baseA = L.polar(470, 380, (n.r || 0) + off + 12, angle + half);
        const baseB = L.polar(470, 380, (n.r || 0) + off + 12, angle - half);
        C.el("polygon", { points: `${tip.x},${tip.y} ${baseA.x},${baseA.y} ${baseB.x},${baseB.y}`, fill: "#ff4b4b", stroke: "#ffffff", "stroke-width": 1.5, "stroke-linejoin": "round", class: "selection-arrow", "pointer-events": "none" }).setAttribute("data-selected-for", n.id);
      } else {
        const tipX = sx - 4, backX = tipX - 14, halfH = 8;
        C.el("polygon", { points: `${tipX},${sy} ${backX},${sy - halfH} ${backX},${sy + halfH}`, fill: "#ff4b4b", stroke: "#ffffff", "stroke-width": 1.5, "stroke-linejoin": "round", class: "selection-arrow", "pointer-events": "none" }).setAttribute("data-selected-for", n.id);
      }
    }
    if (n.id === branchSel && n.parent) {
      if (radial) {
        const midR = ((n.r || 0) + (n.parent.r || 0)) / 2;
        const p = L.polar(470, 380, midR, n.angle || 0);
        C.el("polygon", { points: `${p.x-6},${p.y-4} ${p.x+6},${p.y-4} ${p.x},${p.y+6}`, fill: "#ff4b4b", stroke: "#ffffff", "stroke-width": 1, "pointer-events": "none" });
      } else {
        const mx = (n.parent.x + n.x) / 2;
        C.el("polygon", { points: `${mx-6},${n.y-4} ${mx+6},${n.y-4} ${mx},${n.y+6}`, fill: "#ff4b4b", stroke: "#ffffff", "stroke-width": 1, "pointer-events": "none" });
      }
    }
    if (st.nodeIds && !T.isLeaf(n)) C.el("text", { x: n.x+6, y: n.y-6, "font-size": 10, fill: "#7a8484", class: "node-label", "data-id": n.id }).textContent = n.uid;
    if (st.showBootstrap && !T.isLeaf(n) && n.support) C.el("text", { x: n.x-4, y: n.y-5, "font-size": 10, "text-anchor": "end", fill: "#b5651d", "data-id": n.id }).textContent = formatBootstrapValue(n.support);
    if (st.labels && T.isLeaf(n)) drawLeafLabel(n, radial);
    drawNodeLabels(n, radial);
  });
}
function labelRightEdge() {
  const leaves = T.visibleLeaves(C.getRoot());
  const st = C.state;
  let r = 700;
  leaves.forEach(l => { const startX = st.labelPosition === "aligned" ? C.alignedLabelX() + 10 : l.x + 10; r = Math.max(r, startX + T.labelOf(l).length * st.fontSize * 0.6); });
  C.getSvg().querySelectorAll(".leaf-label").forEach(label => { try { const b = label.getBBox(); r = Math.max(r, b.x + b.width); } catch(_){} });
  return r + 10;
}
global.TreeDrawNode = { formatBootstrapValue, drawSymbol, richTspans, drawLeafLabel,
  drawNodesAndLabels, labelRightEdge, drawNodeLabels, drawRangeLabels, drawLengthLabel };

function drawRootMarker() {
  const root = C.getRoot(); if (!root) return;
  const st = C.state;
  const radial = st.mode !== "rectangular";
  const inv = isInvert();
  let mx, my;
  if (radial) { mx = 470; my = 380; } else { const offset = inv ? 20 : -20; mx = root.x + offset; my = root.y; }
  const marker = C.el("circle", { cx: mx, cy: my, r: 6, fill: "rgba(255,255,255,0.9)", stroke: "#c0392b", "stroke-width": 1.5, class: "root-marker clickable", "data-root-marker": "1", style: "cursor:pointer" });
  C.el("path", { d: `M ${mx-3} ${my-2} L ${mx+3} ${my-2} L ${mx} ${my+3} Z`, fill: "#c0392b", "pointer-events": "none" });
  C.el("title", {}, marker).textContent = "Reroot";
  marker.addEventListener("click", (e) => { e.stopPropagation(); if (global.TreeMenu) { const root = C.getRoot(); if (root) global.TreeMenu.showMenu(root, e.clientX, e.clientY); } });
}

function drawRectTicks(root) {
  const st = C.state;
  const isInv = isInvert();
  const tP = st.tickPrimary || {}; const tS = st.tickSecondary || {};
  const leaves = T.visibleLeaves(root);
  if (!leaves.length) return;
  const ys = leaves.map(l => l.y);
  const yTop = Math.min(...ys) - 10; const yBot = Math.max(...ys) + 10;
  const isTop = st.axisPos === "top";
  const treeW = 560 * (st.scaleH || 1);
  const rootPos = root.x;
  const tipPos = isInv ? (root.x - treeW) : (root.x + treeW);
  const maxD = T.maxDepth(root, 0) || 1;
  const pxPerUnit = treeW / maxD;
  const yAxis = isTop ? (yTop - 20) : (yBot + 30);
  if (!st.axisShow) return;
  function tickPx(v) { const t = st.axisReverse ? (maxD - v) : v; return isInv ? (rootPos - t * pxPerUnit) : (rootPos + t * pxPerUnit); }
  function pxToV(px) {
    const t = isInv ? (rootPos - px) / pxPerUnit : (px - rootPos) / pxPerUnit;
    return st.axisReverse ? (maxD - t) : t;
  }
  const baseMinX = Math.min(rootPos, tipPos);
  const baseMaxX = Math.max(rootPos, tipPos);
  let axisMinX = baseMinX;
  let axisMaxX = baseMaxX;
  const rl = st.rangeLabelConfig;
  if (rl && rl.show && rl.field) {
    T.allWalk(root, n => {
      if (!hasRealChildren(n)) return;
      const m = (n.meta || []).find(mm => mm.field === rl.field);
      if (m && Array.isArray(m.value) && m.value.length >= 2) {
        const lo = Number(m.value[0]), hi = Number(m.value[1]);
        if (Number.isFinite(lo)) { const x = tickPx(lo); axisMinX = Math.min(axisMinX, x); axisMaxX = Math.max(axisMaxX, x); }
        if (Number.isFinite(hi)) { const x = tickPx(hi); axisMinX = Math.min(axisMinX, x); axisMaxX = Math.max(axisMaxX, x); }
      }
    });
  }
  if (rootPos <= tipPos) {
    axisMaxX = Math.min(axisMaxX, tipPos);
  } else {
    axisMinX = Math.max(axisMinX, tipPos);
  }
  const extended = axisMinX < baseMinX - 1e-6 || axisMaxX > baseMaxX + 1e-6;
  C.el("line", { x1: axisMinX, y1: yAxis, x2: axisMaxX, y2: yAxis, stroke: "#333", "stroke-width": 1 });
  function drawOneTick(v, opts) {
    const px = tickPx(v);
    if (!Number.isFinite(px)) return;
    if (px < axisMinX - 1e-6 || px > axisMaxX + 1e-6) return;
    const fs = opts.fs || 11; const bold = !!opts.bold; const italic = !!opts.italic;
    const color = opts.color || "#333"; const tickLen = opts.tickLen || 5;
    const tickY1 = isTop ? yAxis - tickLen : yAxis;
    const tickY2 = isTop ? yAxis : yAxis + tickLen;
    C.el("line", { x1: px, y1: tickY1, x2: px, y2: tickY2, stroke: color, "stroke-width": 1 });
    if (opts.showGrid) {
      const gy1 = isTop ? yAxis : yTop; const gy2 = isTop ? yBot : yAxis;
      C.el("line", { x1: px, y1: gy1, x2: px, y2: gy2, stroke: opts.gridColor || "#dddddd", "stroke-width": opts.gridWidth || 1, "stroke-dasharray": opts.gridDashed ? "4 3" : "" });
    }
    if (opts.showLabel !== false) {
      const ty = isTop ? (yAxis - tickLen - 4) : (yAxis + tickLen + 4);
      const anchor = isTop ? "start" : "end";
      const t = C.el("text", { x: px, y: ty, dy: fs * 0.35, "font-size": fs, "font-family": st.fontFamily, "font-weight": bold ? "700" : "400", "font-style": italic ? "italic" : "normal", "text-anchor": anchor, fill: color, transform: `rotate(-90 ${px} ${ty})` });
      t.textContent = timeTickText(v);
    }
  }
  const unifyFs = Math.max(6, Number(st.tickLabelFontSize) || 11);
  const interval = (tP.interval && tP.interval > 0) ? tP.interval : (maxD / 10);
  if (!extended) {
    const steps = Math.ceil(maxD / interval) + 1;
    for (let i = 0; i < steps; i++) {
      const v = i * interval; if (v > maxD + 1e-6) break;
      drawOneTick(v, { fs: unifyFs, bold: st.tickLabelBold, italic: st.tickLabelItalic, showLabel: tP.showLabels !== false, showGrid: tP.showGrid, gridColor: tP.gridColor, gridWidth: tP.gridWidth, gridDashed: tP.gridDashed });
    }
  } else {
    const vA = pxToV(axisMinX), vB = pxToV(axisMaxX);
    const vLo = Math.min(vA, vB), vHi = Math.max(vA, vB);
    const vStart = Math.floor(vLo / interval - 1e-9) * interval;
    const vEnd   = Math.ceil (vHi / interval + 1e-9) * interval;
    for (let i = 0; ; i++) {
      const v = vStart + i * interval;
      if (v > vEnd + 1e-6) break;
      drawOneTick(v, { fs: unifyFs, bold: st.tickLabelBold, italic: st.tickLabelItalic, showLabel: tP.showLabels !== false, showGrid: tP.showGrid, gridColor: tP.gridColor, gridWidth: tP.gridWidth, gridDashed: tP.gridDashed });
    }
  }
  const interval2 = (tS.interval && tS.interval > 0) ? tS.interval : (interval / 2);
  const isMajor = v => Math.abs(v / interval - Math.round(v / interval)) < 1e-6;
  if (!extended) {
    const steps2 = Math.ceil(maxD / interval2) + 1;
    for (let i = 0; i < steps2; i++) {
      const v = i * interval2; if (v > maxD + 1e-6) break; if (isMajor(v)) continue;
      drawOneTick(v, { fs: unifyFs, bold: st.tickLabelBold, italic: st.tickLabelItalic, tickLen: 3, showLabel: tS.showLabels, showGrid: tS.showGrid, gridColor: tS.gridColor, gridWidth: tS.gridWidth, gridDashed: tS.gridDashed });
    }
  } else {
    const vA = pxToV(axisMinX), vB = pxToV(axisMaxX);
    const vLo = Math.min(vA, vB), vHi = Math.max(vA, vB);
    const vStart2 = Math.floor(vLo / interval2 - 1e-9) * interval2;
    const vEnd2   = Math.ceil (vHi / interval2 + 1e-9) * interval2;
    for (let i = 0; ; i++) {
      const v = vStart2 + i * interval2;
      if (v > vEnd2 + 1e-6) break;
      if (isMajor(v)) continue;
      drawOneTick(v, { fs: unifyFs, bold: st.tickLabelBold, italic: st.tickLabelItalic, tickLen: 3, showLabel: tS.showLabels, showGrid: tS.showGrid, gridColor: tS.gridColor, gridWidth: tS.gridWidth, gridDashed: tS.gridDashed });
    }
  }
  if (Array.isArray(tP.customTicks)) {
    tP.customTicks.forEach(v => {
      if (!isFinite(v)) return;
      drawOneTick(v, { fs: unifyFs, bold: st.customTickBold, italic: st.tickLabelItalic, color: st.customTickColor || "#c0392b", tickLen: 6, showLabel: true, showGrid: true, gridColor: st.customTickColor || "#c0392b", gridWidth: 1, gridDashed: false });
    });
  }
}

function drawCircularTicks(root) {
  const st = C.state;
  const tP = st.tickPrimary || {};
  if (!st.axisShow) return;
  const maxD = T.maxDepth(root, 0) || 1;
  const maxR = 285 * (st.scaleH || 1);
  const interval = (tP.interval && tP.interval > 0) ? tP.interval : (maxD / 10);
  const cx = 470, cy = 380;
  const arc = Number(st.arc) || 348;
  const openGap = Math.max(0, 360 - arc);
  const userRot = Number(st.rotation) || 0;
  const userAxisAdj = Number(st.axisRotation) || 0;
  // 修改：轴线放在豁口正中心（rotation），axisRotation 为用户额外微调
  const axisAngle = userRot + userAxisAdj;
  const unifyFs = Math.max(6, Number(st.tickLabelFontSize) || 11);
  const rOuter = 24 + maxR;
  const isReverse = (st.axisReverse === true || st.axisReverse === "true");
  function radiusOf(v) {
    const vv = isReverse ? (maxD - v) : v;
    if (vv <= 1e-9) return 0;
    return 24 + maxR * (vv / maxD);
  }
  const pOut = L.polar(cx, cy, rOuter, axisAngle);
  C.el("line", { x1: cx, y1: cy, x2: pOut.x, y2: pOut.y, stroke: "#333", "stroke-width": 1 });
  const tickPerpRad = (axisAngle + 90) * Math.PI / 180;
  const labelPerpRad = (axisAngle - 90) * Math.PI / 180;
  const labelOffsetDist = 8;
  function textRotation(a) {
    let rot = a;
    while (rot > 90) rot -= 180;
    while (rot < -90) rot += 180;
    return rot;
  }
  const steps = Math.ceil(maxD / interval) + 1;
  for (let i = 0; i < steps; i++) {
    const v = i * interval;
    if (v > maxD + 1e-6) break;
    const r = radiusOf(v);
    if (r < 0 || r > rOuter + 5) continue;
    const center = L.polar(cx, cy, r, axisAngle);
    if (tP.showGrid) {
      C.el("circle", { cx, cy, r, fill: "none", stroke: tP.gridColor || "#dddddd", "stroke-width": tP.gridWidth || 1, "stroke-dasharray": tP.gridDashed ? "4 3" : "" });
    }
    const dShort = 4;
    C.el("line", {
      x1: center.x + dShort * Math.cos(tickPerpRad),
      y1: center.y + dShort * Math.sin(tickPerpRad),
      x2: center.x - dShort * Math.cos(tickPerpRad),
      y2: center.y - dShort * Math.sin(tickPerpRad),
      stroke: "#333", "stroke-width": 1
    });
    if (tP.showLabels !== false) {
      const tx = center.x + labelOffsetDist * Math.cos(labelPerpRad);
      const ty = center.y + labelOffsetDist * Math.sin(labelPerpRad);
      const rot = textRotation(axisAngle);
      const t = C.el("text", {
        x: tx, y: ty,
        "font-size": unifyFs, "font-family": st.fontFamily,
        "font-weight": st.tickLabelBold ? "700" : "400",
        "font-style": st.tickLabelItalic ? "italic" : "normal",
        "text-anchor": "middle", "dominant-baseline": "middle",
        fill: TICK_FONT,
        transform: `rotate(${rot} ${tx} ${ty})`
      });
      t.textContent = timeTickText(v);
    }
  }
  if (Array.isArray(tP.customTicks)) {
    tP.customTicks.forEach(v => {
      if (!isFinite(v)) return;
      const r = radiusOf(v);
      if (r < 0 || r > rOuter + 5) return;
      const center = L.polar(cx, cy, r, axisAngle);
      const dShort = 6;
      C.el("line", {
        x1: center.x + dShort * Math.cos(tickPerpRad),
        y1: center.y + dShort * Math.sin(tickPerpRad),
        x2: center.x - dShort * Math.cos(tickPerpRad),
        y2: center.y - dShort * Math.sin(tickPerpRad),
        stroke: st.customTickColor || "#c0392b", "stroke-width": 1.2
      });
      const tx = center.x + labelOffsetDist * Math.cos(labelPerpRad);
      const ty = center.y + labelOffsetDist * Math.sin(labelPerpRad);
      const rot = textRotation(axisAngle);
      const t = C.el("text", {
        x: tx, y: ty,
        "font-size": unifyFs, "font-family": st.fontFamily,
        "font-weight": st.customTickBold ? "700" : "400",
        "font-style": st.tickLabelItalic ? "italic" : "normal",
        "text-anchor": "middle", "dominant-baseline": "middle",
        fill: st.customTickColor || "#c0392b",
        transform: `rotate(${rot} ${tx} ${ty})`
      });
      t.textContent = timeTickText(v);
    });
  }
}

function drawScaleBox(root, radial) {
  const st = C.state;
  if (st.showScaleBox === false) return;
  if (!root) return;
  const maxD = T.maxDepth(root, 0) || 1;
  const treeSpan = (st.mode === "circular") ? (285 * (st.scaleH || 1)) : (560 * (st.scaleH || 1));
  const pxPerUnit = treeSpan / maxD;
  let value = Number(st.scaleBoxSize);
  if (!isFinite(value) || value <= 0) { const rawV = 100 / pxPerUnit; value = niceRound(rawV); }
  const barLen = value * pxPerUnit;
  const vb = C.getViewBox();
  const x0 = vb.x + 20; const y0 = vb.y + 26;
  const title = st.scaleBoxTitle || "Scale";
  const titleY = y0 - 18;
  C.el("text", { x: x0, y: titleY, "font-size": 12, "font-family": st.fontFamily, "font-weight": "700", fill: "#333" }).textContent = title;
  C.el("line", { x1: x0, y1: y0, x2: x0 + barLen, y2: y0, stroke: "#333", "stroke-width": 2 });
  C.el("line", { x1: x0, y1: y0 - 5, x2: x0, y2: y0 + 5, stroke: "#333", "stroke-width": 2 });
  C.el("line", { x1: x0 + barLen, y1: y0 - 5, x2: x0 + barLen, y2: y0 + 5, stroke: "#333", "stroke-width": 2 });
  C.el("text", { x: x0 + barLen / 2, y: y0 + 16, "font-size": 12, "font-family": st.fontFamily, "text-anchor": "middle", fill: "#333" }).textContent = String(value);
}
function clearSvg() {
  const svg = C.getSvg(); if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const vb = C.getViewBox(), st = C.state;
  svg.setAttribute("viewBox", `${vb.x - (st.panX || 0)} ${vb.y - (st.panY || 0)} ${vb.w / st.zoom} ${vb.h / st.zoom}`);
}
function refitViewBox() {
  const svg = C.getSvg(); if (!svg) return;
  try {
    const bb = svg.getBBox();
    if (bb && isFinite(bb.width) && isFinite(bb.height) && bb.width > 1 && bb.height > 1) {
      const m = Math.max(16, Math.max(bb.width, bb.height) * 0.02);
      C.setViewBox({ x: bb.x - m, y: bb.y - m, w: bb.width + 2*m, h: bb.height + 2*m });
    }
  } catch (_) {}
}
function drawRect() {
  L.layoutRect(); clearSvg();
  const st = C.state, root = C.getRoot();
  const inv = isInvert();
  const kids = T.visibleChildren(root);
  drawRectTicks(root);
  if (showRootLine() && kids.length) {
    const x1 = inv ? (root.x + 45) : (root.x - 45);
    C.el("line", { x1, y1: root.y, x2: root.x, y2: root.y, stroke: st.branchColor, "stroke-width": st.branchWidth, "stroke-linecap": "round" });
  }
  T.walk(root, n => { T.visibleChildren(n).forEach(c => TreeDrawBranch.drawRectBranch(n, c)); });
  drawNodesAndLabels(false);
  if (global.TreeRanges) global.TreeRanges.drawColoredRanges(false);
  drawRangeLabels(false);
  if (global.TreeDatasets) global.TreeDatasets.drawDatasets(false);
  // 修改：使用新版地质年代表（水平色块条）
  if (global.TreeRanges && global.TreeRanges.drawGeoTimeTracks) global.TreeRanges.drawGeoTimeTracks(false);
}
function drawRadial() {
  L.layoutRadial(); clearSvg();
  const root = C.getRoot();
  drawCircularTicks(root);
  T.walk(root, n => T.visibleChildren(n).forEach(c => TreeDrawBranch.drawRadialBranch(n, c)));
  drawNodesAndLabels(true);
  if (global.TreeRanges) global.TreeRanges.drawColoredRanges(true);
  drawRangeLabels(true);
  if (global.TreeDatasets) global.TreeDatasets.drawDatasets(true);
  // 修改：圆形树的地质年代表
  if (global.TreeRanges && global.TreeRanges.drawGeoTimeTracks) global.TreeRanges.drawGeoTimeTracks(true);
}
function draw() {
  _nodeValueRangeCache = {};
  const svg = C.getSvg(); if (!svg || !C.getRoot()) return;
  const menu = document.getElementById("contextMenu"); if (menu) menu.style.display = "none";
  if (C.state.mode === "rectangular") drawRect(); else drawRadial();
  refitViewBox();
  drawScaleBox(C.getRoot(), false);
  const vb = C.getViewBox(), st = C.state;
  svg.setAttribute("viewBox", `${vb.x - (st.panX || 0)} ${vb.y - (st.panY || 0)} ${vb.w / st.zoom} ${vb.h / st.zoom}`);
  if (global.TreeUI && global.TreeUI.renderEditor) global.TreeUI.renderEditor();
  if (global.TreeUI && global.TreeUI.renderRangesPanel) global.TreeUI.renderRangesPanel();
}
global.TreeRenderer = { clearSvg, refitViewBox, drawRect, drawRadial, draw, showRootLine };
})(window);
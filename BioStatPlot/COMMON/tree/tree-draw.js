(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const L = global.TreeLayout;

function showRootLine() {
  const st = C.state;
  if (st.showRoot === false) return false;
  if (st.forceMidpointRoot) return true;
  return !!st.hasRoot;
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
    if (bb && isFinite(bb.x) && isFinite(bb.y) &&
        isFinite(bb.width) && isFinite(bb.height) &&
        bb.width > 1 && bb.height > 1) {
      const m = Math.max(16, Math.max(bb.width, bb.height) * 0.02);
      C.setViewBox({ x: bb.x - m, y: bb.y - m, w: bb.width + 2 * m, h: bb.height + 2 * m });
    }
  } catch (_) {}
}
function drawScaleBox(root) {
  const st = C.state;
  if (st.showScaleBox === false) return;
  if (!root) return;
  const maxD = T.maxDepth(root, 0) || 1;
let treeSpan;
if (st.mode === "unrooted") {
  let maxR = 0;
  T.allWalk(root, n => {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (!kids.length) {
      const r = Math.hypot(n.x - 470, n.y - 380);
      if (r > maxR) maxR = r;
    }
  });
  treeSpan = Math.max(maxR, 100);
} else if (st.mode === "circular") {
  treeSpan = 285 * (st.scaleH || 1);
} else {
  treeSpan = 560 * (st.scaleH || 1);
}
  const pxPerUnit = treeSpan / maxD;
  let value = Number(st.scaleBoxSize);
  if (!isFinite(value) || value <= 0) {
    const rawV = 100 / pxPerUnit;
    value = global.TreeDrawTicks.niceRound(rawV);
  }
  const barLen = value * pxPerUnit;
  const vb = C.getViewBox();
  const ox = Number(st.scaleBoxOffsetX) || 0;
  const oy = Number(st.scaleBoxOffsetY) || 0;
  const x0 = vb.x + 20 + ox, y0 = vb.y + 26 + oy;
  const title = st.scaleBoxTitle || "Scale";
  const g = C.el("g", { class: "scale-box", "data-scale-box": "1", style: "cursor:move", transform: `translate(${x0} ${y0})` });
  const titleStyle = global.TreeText.fromParts({ font: st.fontFamily, size: 12, bold: true, color: "#333" });
  global.TreeText.draw(g, 0, -18, title, titleStyle);
  C.el("line", { x1: 0, y1: 0, x2: barLen, y2: 0, stroke: "#333", "stroke-width": 2 }, g);
  C.el("line", { x1: 0, y1: -5, x2: 0, y2: 5, stroke: "#333", "stroke-width": 2 }, g);
  C.el("line", { x1: barLen, y1: -5, x2: barLen, y2: 5, stroke: "#333", "stroke-width": 2 }, g);
  const valStyle = global.TreeText.fromParts({ font: st.fontFamily, size: 12, color: "#333" });
  global.TreeText.draw(g, barLen / 2, 16, String(value), valStyle, { "text-anchor": "middle" });
  C.el("rect", { x: -12, y: -34, width: barLen + 24, height: 64, fill: "transparent", "pointer-events": "all" }, g);
}
function drawRect() {
  L.layoutRect(); clearSvg();
  const st = C.state, root = C.getRoot();
  const inv = C.isTrue(st.invert);
  const kids = T.visibleChildren(root);
  global.TreeDrawTicks.drawRectTicks(root);
  if (showRootLine() && kids.length) {
    const x1 = inv ? (root.x + 45) : (root.x - 45);
    C.el("line", { x1, y1: root.y, x2: root.x, y2: root.y, stroke: st.branchColor, "stroke-width": st.branchWidth, "stroke-linecap": "round" });
  }
  T.walk(root, n => { T.visibleChildren(n).forEach(c => global.TreeDrawBranch.drawRectBranch(n, c)); });
  global.TreeDrawNode.drawNodesAndLabels(false);
  if (global.TreeRanges) global.TreeRanges.drawColoredRanges(false);
  global.TreeDrawNode.drawRangeLabels(false);
  if (global.TreeTracks && global.TreeTracks.renderCustomTracks) global.TreeTracks.renderCustomTracks(false);
  if (global.TreeRanges && global.TreeRanges.drawGeoTimeTracks) global.TreeRanges.drawGeoTimeTracks(false);
}
function drawRadial() {
  L.layoutRadial(); clearSvg();
  const st = C.state;
  const root = C.getRoot();
  const kids = T.visibleChildren(root);
  global.TreeDrawTicks.drawCircularTicks(root);
  if (showRootLine() && kids.length && root && st.mode !== "unrooted" && !C.isTrue(st.invert)) {
    const rootR = root.r || 0;
    if (rootR > 0.5) {
      C.el("line", {
        x1: 470, y1: 380, x2: root.x, y2: root.y,
        stroke: st.branchColor, "stroke-width": st.branchWidth, "stroke-linecap": "round"
      });
    }
  }
  T.walk(root, n => T.visibleChildren(n).forEach(c => global.TreeDrawBranch.drawRadialBranch(n, c)));
  global.TreeDrawNode.drawNodesAndLabels(true);
  if (global.TreeRanges) global.TreeRanges.drawColoredRanges(true);
  global.TreeDrawNode.drawRangeLabels(true);
  if (global.TreeTracks && global.TreeTracks.renderCustomTracks) global.TreeTracks.renderCustomTracks(true);
  if (global.TreeRanges && global.TreeRanges.drawGeoTimeTracks) global.TreeRanges.drawGeoTimeTracks(true);
}

function drawUnrooted() {
  L.layoutUnrooted();
  clearSvg();
  const root = C.getRoot();
  T.walk(root, n => T.visibleChildren(n).forEach(c => {
    C.el("line", {
      x1: n.x, y1: n.y, x2: c.x, y2: c.y,
      ...global.TreeDrawBranch.commonLineAttrs(c, { branchId: c.id })
    });
  }));
  global.TreeDrawNode.drawNodesAndLabels('unrooted');
}

function draw() {
  const svg = C.getSvg(); if (!svg || !C.getRoot()) return;
if (C.state.mode === "rectangular") drawRect();
else if (C.state.mode === "unrooted") drawUnrooted();
else drawRadial();
  drawScaleBox(C.getRoot());
  refitViewBox();
  const vb = C.getViewBox(), st = C.state;
  svg.setAttribute("viewBox", `${vb.x - (st.panX || 0)} ${vb.y - (st.panY || 0)} ${vb.w / st.zoom} ${vb.h / st.zoom}`);
  if (global.TreeUI && global.TreeUI.renderEditor) global.TreeUI.renderEditor();
  if (global.TreeUI && global.TreeUI.renderRangesPanel) global.TreeUI.renderRangesPanel();
}
global.TreeRenderer = { clearSvg, refitViewBox, drawRect, drawRadial, drawUnrooted, draw, showRootLine };
})(window);
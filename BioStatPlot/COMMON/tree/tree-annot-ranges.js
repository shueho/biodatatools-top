(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const L = global.TreeLayout;
const TT = global.TreeText;
const SS = global.TreeStyle;
const W = global.TreeCommonWidgets;
const drawText = (p, x, y, t, s, ts, e) => W.drawTextWithBg(TT, p, x, y, t, s, ts, e);

function fontFam() { return C.state.fontFamily || 'Times New Roman'; }

function drawLegend(customX, customY) {
  const st = C.state;
  if (!st.showLegend || !global.TreeRanges) return;
  const colorRanges = global.TreeRanges.colorRanges;
  if (!colorRanges.length) return;
  const tc = (global.TreeTracks && global.TreeTracks.trackCommon) || {};
  const baseX = (customX != null) ? Number(customX) : (Number(st.legendX) || 760);
  const baseY = (customY != null) ? Number(customY) : (Number(st.legendY) || 60);
  const lx = baseX + (st.legendOffsetX || 0);
  const ly = baseY + (st.legendOffsetY || 0);
  const scale = tc.legendScale || 1;
  const tsTitle = SS.textStyle(st.textStyles.legendTitle);
  const tsItem = SS.textStyle(st.textStyles.legendText);
  const fs = Math.max(6, Number(tsItem.fontSize) || 11) * scale;
  const pad = 10;
  const titleFS = Math.max(6, Number(tsTitle.fontSize) || 12) * scale;
  const showTitle = tc.legendTitleShow !== false;
  const title = showTitle ? (st.legendTitle != null ? st.legendTitle : "Groups") : "";
  const maxPerRow = Math.max(0, Number(tc.legendMaxPerRow) || 0);
  const g = C.el("g", { class: "legend-box", "data-legend": "1", style: "cursor:move", transform: `translate(${lx} ${ly})` });
  const titleStyle = TT.fromParts({ font: tsTitle.fontFamily || fontFam(), size: titleFS, bold: tsTitle.bold, italic: tsTitle.italic, color: tsTitle.color || "#222222" });
  const itemStyle = TT.fromParts({ font: tsItem.fontFamily || fontFam(), size: fs, bold: tsItem.bold, italic: tsItem.italic, color: tsItem.color || "#222222" });
  let xx = 0, yy = 0, rowItems = 0;
  if (title) { drawText(g, 0, titleFS, title, titleStyle, tsTitle, { "pointer-events": "none" }); yy = titleFS + 14; }
  const items = colorRanges.map((r, i) => ({ label: r.label || ("Range " + r.id), color: r.color }));
  let maxItemW = 0;
  items.forEach(it => { const w = fs + 8 + global.PlotCommon.measureText(it.label, fs); if (w > maxItemW) maxItemW = w; });
  let maxX = 0;
  items.forEach(it => {
    const wItem = fs + 8 + global.PlotCommon.measureText(it.label, fs);
    if (maxPerRow > 0 && rowItems >= maxPerRow) { xx = 0; yy += fs + 6; rowItems = 0; }
    C.el("rect", { x: xx, y: yy, width: fs, height: fs, fill: it.color, rx: 2 }, g);
    drawText(g, xx + fs + 4, yy + fs * 0.85, it.label, itemStyle, tsItem);
    const stepW = (maxPerRow > 0) ? maxItemW : wItem;
    xx += stepW + 8; rowItems++;
    maxX = Math.max(maxX, xx);
  });
  yy += fs + pad;
  C.el("rect", { x: 0, y: 0, width: maxX + pad, height: yy, fill: "transparent", "pointer-events": "all" }, g).setAttribute("class", "legend-hit");
}

let colorRanges = [];
let rangeSeq = 0;
let rangeCover = "label";
let rangeColorBranches = false;
let rangeColorLabels = false;
let rangeBorder = 0;
let rangeBorderColor = "#333333";
let rangeShowLabels = false;
let rangeLabelSize = 13;
let rangeLabelColor = "";
let rangeLabelBold = true;
let rangeLabelItalic = false;
let rangeLabelFont = "";
let rangeLabelTrackShow = true;
let rangeLabelTrackWidth = 60;
let rangeLabelTrackAutoWidth = false;
let rangeLabelTrackOffset = 0;
let rangeLabelTrackOpacity = 1;
let rangeLabelTrackTextOrientation = 'horizontal';
let rangeLabelTrackTitle = 'Groups';
let rangeLabelTrackTitleShow = true;
let rangeLabelTrackTextOffsetX = 0;
let rangeLabelTrackTextOffsetY = 0;
let ringPalette = "tableau10";

function paletteColor(i) {
  if (global.TreePalette && global.TreePalette.getCategoricalColors) {
    const pal = global.TreePalette.getCategoricalColors(ringPalette || "tableau10", 0);
    return pal[i % Math.max(1, pal.length)] || "#cccccc";
  }
  return "#cccccc";
}
function recolorRangesByPalette() { colorRanges.forEach((r, i) => { r.color = paletteColor(i); }); }
function rangeById(id) { return colorRanges.find(r => r.id === id) || null; }
function getRangeColorForNode(n) {
  if (!n) return null;
  if (!colorRanges.length) return null;
  let cur = n;
  while (cur) {
    if (cur.rangeId != null) {
      const r = colorRanges.find(x => x.id === cur.rangeId);
      return r ? r.color : null;
    }
    cur = cur.parent;
  }
  return null;
}
function rangeMembers(id) {
  const out = [];
  T.allWalk(C.getRoot(), n => { if (n.rangeId === id) out.push(n); });
  return out;
}
function clearAllColorRanges() {
  colorRanges = [];
  T.allWalk(C.getRoot(), n => { if (n.rangeId != null) n.rangeId = null; });
}

function rectangularRangeSegments(leaves, ranges, fallbackHeight) {
  const ordered = [...leaves].sort((a, b) => a.y - b.y);
  const bounds = T.leafRowBounds(ordered, fallbackHeight);
  const ids = new Set(ranges.map(r => r.id));
  const segments = []; let current = null;
  ordered.forEach(leaf => {
    let owner = leaf;
    while (owner && !ids.has(owner.rangeId)) owner = owner.parent;
    if (!owner) { current = null; return; }
    const row = bounds.get(leaf);
    if (!current || current.id !== owner.rangeId) {
      current = { id: owner.rangeId, node: owner, leaves: [], x0: owner.x, top: row.top, bottom: row.bottom };
      segments.push(current);
    }
    current.leaves.push(leaf);
    current.x0 = Math.min(current.x0, owner.x);
    current.bottom = row.bottom;
  });
  return segments;
}

function rangePaint(range, key, radial, inner, outer, invert) {
  inner = inner || 0; outer = outer || 1;
  if (!C.state.rangeGradient) return range.color;
  const id = `range-gradient-${range.id}-${key}${invert ? '-inv' : ''}`;
  const defs = C.getSvg().querySelector("defs") || C.el("defs");
  const gradient = radial
    ? C.el("radialGradient", { id, gradientUnits: "userSpaceOnUse", cx: 470, cy: 380, r: outer }, defs)
    : C.el("linearGradient", { id, x1: invert ? "100%" : "0%", y1: "0%", x2: invert ? "0%" : "100%", y2: "0%" }, defs);
  if (radial) {
    const innerPct = Math.min(99, inner / Math.max(1, outer) * 100);
    if (invert) {
      C.el("stop", { offset: "0%", "stop-color": range.color, "stop-opacity": 0 }, gradient);
      C.el("stop", { offset: `${innerPct}%`, "stop-color": range.color, "stop-opacity": 1 }, gradient);
      C.el("stop", { offset: "100%", "stop-color": range.color, "stop-opacity": 0.02 }, gradient);
    } else {
      C.el("stop", { offset: `${innerPct}%`, "stop-color": range.color, "stop-opacity": 0.02 }, gradient);
      C.el("stop", { offset: "100%", "stop-color": range.color, "stop-opacity": 1 }, gradient);
    }
  } else {
    const innerOp = invert ? 1 : 0.02;
    const outerOp = invert ? 0.02 : 1;
    C.el("stop", { offset: "0%", "stop-color": range.color, "stop-opacity": innerOp }, gradient);
    C.el("stop", { offset: "100%", "stop-color": range.color, "stop-opacity": outerOp }, gradient);
  }
  return `url(#${id})`;
}

function drawRectangularRanges() {
  if (rangeCover === "off" || rangeCover === "none") return;
  const leaves = T.visibleLeaves(C.getRoot());
  const st = C.state;
  const isInv = C.isTrue(st.invert);
  const rowH = Math.max(14, st.fontSize * 1.05) * (st.scaleV || 1);
  const segments = rectangularRangeSegments(leaves, colorRanges, rowH);
  let labelEdge;
  if (isInv) {
    labelEdge = Infinity;
    C.getSvg().querySelectorAll(".leaf-label").forEach(label => {
      try {
        const b = label.getBBox();
        if (isFinite(b.x)) labelEdge = Math.min(labelEdge, b.x - 6);
      } catch (_) {}
    });
    if (!isFinite(labelEdge)) labelEdge = global.TreeDrawNode.labelRightEdge();
  } else {
    labelEdge = -Infinity;
    C.getSvg().querySelectorAll(".leaf-label").forEach(label => {
      try {
        const b = label.getBBox();
        if (isFinite(b.x) && isFinite(b.width)) labelEdge = Math.max(labelEdge, b.x + b.width + 6);
      } catch (_) {}
    });
    if (!isFinite(labelEdge)) labelEdge = global.TreeDrawNode.labelRightEdge();
  }
  const root = C.getRoot();
  const maxD = Math.max(T.maxDepth(root, 0), 1);
  const treeW = 560 * (st.scaleH || 1);
  const rootPos = root.x;
  const pxPerUnit = treeW / maxD;
  const tipPos = isInv ? (rootPos - treeW) : (rootPos + treeW);
  function tickPx(v) {
    const t = st.axisReverse ? (maxD - v) : v;
    return isInv ? (rootPos - t * pxPerUnit) : (rootPos + t * pxPerUnit);
  }
  let axisMinX = Math.min(rootPos, tipPos);
  let axisMaxX = Math.max(rootPos, tipPos);
  const rlCfg = st.rangeLabelConfig;
  if (rlCfg && rlCfg.show && rlCfg.field) {
    T.allWalk(root, n => {
      if (!T.hasRealChildren(n)) return;
      const m = (n.meta || []).find(mm => mm.field === rlCfg.field);
      if (m && Array.isArray(m.value) && m.value.length >= 2) {
        const lo = Number(m.value[0]), hi = Number(m.value[1]);
        if (Number.isFinite(lo)) { const x = tickPx(lo); axisMinX = Math.min(axisMinX, x); axisMaxX = Math.max(axisMaxX, x); }
        if (Number.isFinite(hi)) { const x = tickPx(hi); axisMinX = Math.min(axisMinX, x); axisMaxX = Math.max(axisMaxX, x); }
      }
    });
  }
  {
    const r = C.getAxisRange(maxD);
    const xLo = tickPx(r.vLo);
    const xHi = tickPx(r.vHi);
    if (Number.isFinite(xLo) && Number.isFinite(xHi)) {
      axisMinX = Math.min(axisMinX, xLo, xHi);
      axisMaxX = Math.max(axisMaxX, xLo, xHi);
    }
  }
  const bg = C.el("g", { class: "range-backgrounds" });
  C.getSvg().insertBefore(bg, C.getSvg().firstChild);
  const vb = C.getViewBox();
  segments.forEach((segment, index) => {
    const range = rangeById(segment.id);
    if (!range) return;
    let x0, width;
    if (isInv) {
      const alignedX = C.alignedLabelX();
      if (rangeCover === "full") {
        x0 = Math.min(labelEdge, axisMinX - 10);
        const rightEdge = Math.max(vb.x + vb.w - 20, axisMaxX + 10);
        width = Math.max(3, rightEdge - x0);
      } else if (rangeCover === "clade" && C.state.rangeColorLabels) {
        x0 = Math.min(labelEdge, alignedX + 2);
        width = Math.max(3, segment.x0 - x0);
      } else if (rangeCover === "clade") { x0 = labelEdge; width = Math.max(3, segment.x0 - labelEdge); }
      else { x0 = labelEdge; width = Math.max(3, alignedX - labelEdge); }
    } else {
      x0 = rangeCover === "full" ? Math.min(40, axisMinX - 10)
        : rangeCover === "clade" ? segment.x0
        : (st.labelPosition === "aligned" && st.lineShape !== "slanted") ? C.alignedLabelX()
        : Math.min(...segment.leaves.map(l => l.x));
      let rightEnd;
      if (rangeCover === "full") rightEnd = Math.max(labelEdge, axisMaxX + 10);
      else if (rangeCover === "clade" && C.state.rangeColorLabels) rightEnd = Math.min(labelEdge, C.alignedLabelX() - 2);
      else rightEnd = labelEdge;
      width = Math.max(3, rightEnd - x0);
    }
    const attrs = {
      x: x0, y: segment.top, width,
      height: segment.bottom - segment.top,
      fill: rangePaint(range, index, false, 0, 1, isInv),
      opacity: st.rangeOpacity,
      "data-range": range.id, "data-id": segment.node.id,
      class: "range-background clickable"
    };
    if (rangeBorder > 0) { attrs.stroke = rangeBorderColor; attrs["stroke-width"] = rangeBorder; }
    C.el("rect", attrs, bg);
  });
}

function drawColoredRanges(radial) {
  if (C.state.mode === 'unrooted') return;
  if (rangeCover === "off" || rangeCover === "none") return;
  if (!radial) { drawRectangularRanges(); return; }
  const st = C.state;
  const inv = C.isTrue(st.invert);
  const root = C.getRoot();
  const maxD = Math.max(T.maxDepth(root, 0), 0.01);
  const maxR = 285 * (st.scaleH || 1);
  const innerBase = L.getRadialInnerBase ? L.getRadialInnerBase() : 0;
  const extEnd = Math.max(0, Number(st.axisExtendEnd) || 0);
  const extEndPx = extEnd;
  const vl = T.visibleLeaves(root);
  const gl = vl.map(l => l.angle).filter(a => a != null).sort((a, b) => a - b);
  const gStep = gl.length > 1 ? (gl[gl.length - 1] - gl[0]) / (gl.length - 1) : 6;
  const gTipR = Math.max(...vl.map(l => l.r || 0), 260);
  const lout = vl.map(l => {
    const lbl = C.getSvg().querySelector('.leaf-label[data-id="' + l.id + '"]');
    let w = T.labelOf(l).length * st.fontSize * (l.labelSizeFactor || 1) * 0.6;
    if (lbl) { try { w = lbl.getBBox().width; } catch (_) {} }
    return inv ? (C.getRadialLabelR() - w) : (C.getRadialLabelR() + w);
  });
  const gLabIn = inv ? (C.getRadialLabelR() + 6) : (C.getRadialLabelR() - 6);
  const gLabOut = inv ? (Math.min(...lout) - 10) : (Math.max(...lout) + 10);
  colorRanges.forEach(rg => {
    const _ms = rangeMembers(rg.id);
    if (!_ms.length) return;
    _ms.forEach(n => {
      const lv = T.leavesUnder(n);
      if (!lv.length) return;
      const angs = lv.map(l => l.angle).filter(a => a !== undefined && a !== null);
      if (!angs.length) return;
      const pad = gStep / 2;
      const a0 = Math.min(...angs) - pad, a1 = Math.max(...angs) + pad;
      const cx = 470, cy = 380;
      const ar = C.getAxisRange(maxD);
      const tMaxUsed = Math.max(maxD, ar.vHi);
      const rOutMax = inv ? innerBase : (innerBase + maxR * tMaxUsed / maxD);
      let rIn, rOut;
      if (rangeCover === "clade") {
        if (inv) {
          rIn = (C.state.rangeColorLabels ? (C.getRadialLabelR() + 2) : innerBase);
          rOut = Math.max(innerBase, n.r || 0);
        } else {
          rIn = Math.max(0, n.r || 0);
          rOut = (C.state.rangeColorLabels ? (C.getRadialLabelR() - 2) : (gTipR + 2)) + extEndPx;
        }
      } else if (rangeCover === "full") {
        if (inv) { rIn = gLabOut; rOut = innerBase + maxR * tMaxUsed / maxD; }
        else { rIn = 0; rOut = Math.max(gLabOut, rOutMax) + extEndPx; }
      } else {
        if (inv) { rIn = gLabOut; rOut = innerBase; }
        else { rIn = gLabIn; rOut = Math.max(gLabOut, rOutMax) + extEndPx; }
      }
      if (rIn > rOut) { const _t = rIn; rIn = rOut; rOut = _t; }
      const p0i = L.polar(cx, cy, rIn, a0), p0o = L.polar(cx, cy, rOut, a0);
      const p1o = L.polar(cx, cy, rOut, a1), p1i = L.polar(cx, cy, rIn, a1);
      const large = (a1 - a0) > 180 ? 1 : 0;
      const d = `M ${p0i.x} ${p0i.y} L ${p0o.x} ${p0o.y} A ${rOut} ${rOut} 0 ${large} 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${rIn} ${rIn} 0 ${large} 0 ${p0i.x} ${p0i.y} Z`;
      const attrs = { d, fill: rangePaint(rg, n.id, true, rIn, rOut, inv), opacity: st.rangeOpacity, "data-id": n.id, class: "range-background clickable" };
      if (rangeBorder > 0) { attrs.stroke = rangeBorderColor; attrs["stroke-width"] = rangeBorder; }
      C.getSvg().insertBefore(C.el("path", attrs), C.getSvg().firstChild);
    });
  });
}

function drawRectangularRangeLabelTrack(xBase, leaves, isInv) {
  const st = C.state;
  const tc = (global.TreeTracks && global.TreeTracks.trackCommon) || {};
  const gap = Math.max(0, Number(tc.trackGap) || 0);
  const rowH = Math.max(14, st.fontSize * 1.05) * (st.scaleV || 1);
  const segments = rectangularRangeSegments(leaves, colorRanges, rowH);
  if (!segments.length) return xBase;
  let trackW = Number(rangeLabelTrackWidth) || 60;
  if (rangeLabelTrackAutoWidth) {
    let maxTextW = 40;
    segments.forEach(seg => {
      const r = rangeById(seg.id); if (!r) return;
      const text = r.label || ('Range ' + r.id);
      const tw = global.PlotCommon.measureText(text, rangeLabelSize);
      if (tw > maxTextW) maxTextW = tw;
    });
    trackW = Math.ceil(maxTextW + 16);
  }
  const offset = Number(rangeLabelTrackOffset) || 0;
  const x0 = isInv ? xBase - offset - trackW : xBase + offset;
  const ts = SS.textStyle(C.state.textStyles.rangeLabel);
  const ff = ts.fontFamily || rangeLabelFont || st.fontFamily;
  const textColor = ts.color || rangeLabelColor || '#333333';
  const vertical = rangeLabelTrackTextOrientation === 'vertical';
  const textStyle = TT.fromParts({ font: ff, size: ts.fontSize || rangeLabelSize, bold: ts.bold != null ? ts.bold : rangeLabelBold, italic: ts.italic != null ? ts.italic : rangeLabelItalic, color: textColor });
  segments.forEach(seg => {
    const range = rangeById(seg.id); if (!range) return;
    C.el("rect", { x: x0, y: seg.top, width: trackW, height: Math.max(1, seg.bottom - seg.top), fill: range.color, opacity: rangeLabelTrackOpacity, "data-range": seg.id, class: "range-label-track" });
    if (rangeShowLabels && range.label) {
      const cx = x0 + trackW / 2 + (Number(rangeLabelTrackTextOffsetX) || 0);
      const cy = (seg.top + seg.bottom) / 2 + (Number(rangeLabelTrackTextOffsetY) || 0);
      const extra = { "text-anchor": "middle", "dominant-baseline": "middle", "pointer-events": "none", class: "range-label-track-text" };
      if (vertical) extra.transform = `rotate(-90 ${cx} ${cy})`;
      TT.draw(null, cx, cy, range.label, textStyle, extra);
    }
  });
  if (rangeLabelTrackTitleShow && rangeLabelTrackTitle) {
    const titleFs = Number(tc.trackNameFontSize) || 11;
    const titleBold = tc.trackNameBold !== false ? 700 : 400;
    const titleItalic = tc.trackNameItalic ? 'italic' : 'normal';
    const titleAngle = (tc.trackNameAngle != null) ? Number(tc.trackNameAngle) : -45;
    const angleRad = titleAngle * Math.PI / 180;
    const titleWidth = global.PlotCommon.measureText(rangeLabelTrackTitle, titleFs);
    const lowestOffset = Math.abs((titleWidth / 2) * Math.sin(angleRad)) + Math.abs((titleFs / 2) * Math.cos(angleRad));
    const ys = leaves.map(l => l.y);
    const titleY = Math.min(...ys) - rowH * 0.55 - lowestOffset - 4;
    const cx = x0 + trackW / 2;
    const style = TT.fromParts({ font: ff, size: titleFs, bold: titleBold, italic: titleItalic, color: "#3a4a4a" });
    TT.draw(null, cx, titleY, rangeLabelTrackTitle, style, {
      "text-anchor": "middle", "dominant-baseline": "middle", class: "range-label-track-title",
      transform: titleAngle ? `rotate(${titleAngle} ${cx} ${titleY})` : undefined
    });
  }
  return isInv ? (x0 - gap) : (x0 + trackW + gap);
}

function drawRadialRangeLabelTrack(rBase, leaves) {
  const st = C.state;
  const tc = (global.TreeTracks && global.TreeTracks.trackCommon) || {};
  const gap = Math.max(0, Number(tc.trackGap) || 0);
  const gl = leaves.map(l => l.angle).filter(a => a != null).sort((a, b) => a - b);
  const gStep = gl.length > 1 ? (gl[gl.length - 1] - gl[0]) / (gl.length - 1) : 6;
  const cx = 470, cy = 380;
  const groups = [];
  colorRanges.forEach(rg => {
    const angles = [];
    T.allWalk(C.getRoot(), n => {
      if (n.rangeId === rg.id) {
        T.leavesUnder(n).forEach(l => { if (l.angle != null) angles.push(l.angle); });
      }
    });
    if (!angles.length) return;
    groups.push({ range: rg, a0: Math.min(...angles) - gStep / 2, a1: Math.max(...angles) + gStep / 2 });
  });
  if (!groups.length) return rBase;
  let trackW = Number(rangeLabelTrackWidth) || 60;
  if (rangeLabelTrackAutoWidth) {
    let maxTextW = 40;
    groups.forEach(g => {
      const text = g.range.label || ('Range ' + g.range.id);
      const tw = global.PlotCommon.measureText(text, rangeLabelSize);
      if (tw > maxTextW) maxTextW = tw;
    });
    trackW = Math.ceil(maxTextW + 16);
  }
  const offset = Number(rangeLabelTrackOffset) || 0;
  const isInv = C.isTrue(st.invert);
  const rIn = isInv ? Math.max(4, rBase - offset) : (rBase + offset);
  const rOut = isInv ? Math.max(4, rIn - trackW) : (rIn + trackW);
  const ts = SS.textStyle(C.state.textStyles.rangeLabel);
  const ff = ts.fontFamily || rangeLabelFont || st.fontFamily;
  const textColor = ts.color || rangeLabelColor || '#333333';
  const vertical = rangeLabelTrackTextOrientation === 'vertical';
  const textStyle = TT.fromParts({ font: ff, size: ts.fontSize || rangeLabelSize, bold: ts.bold != null ? ts.bold : rangeLabelBold, italic: ts.italic != null ? ts.italic : rangeLabelItalic, color: textColor });
  groups.forEach(({ range, a0, a1 }) => {
    const p0i = L.polar(cx, cy, rIn, a0), p0o = L.polar(cx, cy, rOut, a0);
    const p1o = L.polar(cx, cy, rOut, a1), p1i = L.polar(cx, cy, rIn, a1);
    const large = (a1 - a0) > 180 ? 1 : 0;
    const d = `M ${p0i.x} ${p0i.y} L ${p0o.x} ${p0o.y} A ${rOut} ${rOut} 0 ${large} 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${rIn} ${rIn} 0 ${large} 0 ${p0i.x} ${p0i.y} Z`;
    C.el("path", { d, fill: range.color, opacity: rangeLabelTrackOpacity, "data-range": range.id, class: "range-label-track" });
    if (rangeShowLabels && range.label) {
      const mid = (a0 + a1) / 2;
      const midR = (rIn + rOut) / 2 + (Number(rangeLabelTrackTextOffsetX) || 0);
      const lp = L.polar(cx, cy, midR, mid);
      const tangentShift = Number(rangeLabelTrackTextOffsetY) || 0;
      const tp = L.polar(0, 0, tangentShift, mid + 90);
      const tx = lp.x + tp.x, ty = lp.y + tp.y;
      let rot;
      if (vertical) { rot = mid; if (rot > 90 && rot < 270) rot -= 180; }
      else { rot = mid - 90; if (rot > 90) rot -= 180; if (rot < -90) rot += 180; }
      TT.draw(null, tx, ty, range.label, textStyle, {
        "text-anchor": "middle", "dominant-baseline": "middle", "pointer-events": "none",
        class: "range-label-track-text", transform: `rotate(${rot} ${tx} ${ty})`
      });
    }
  });
  if (rangeLabelTrackTitleShow && rangeLabelTrackTitle) {
    const tc2 = (global.TreeTracks && global.TreeTracks.trackCommon) || {};
    const nameFs = Math.max(6, Number(tc2.trackNameFontSize) || 11);
    const axisAngle = (Number(st.rotation) || 0) + (Number(st.axisRotation) || 0);
    const titleR = (rIn + rOut) / 2;
    const tp = L.polar(cx, cy, titleR, axisAngle);
    let rot = axisAngle;
    while (rot > 90) rot -= 180;
    while (rot < -90) rot += 180;
    const style = TT.fromParts({ font: ff, size: nameFs, bold: tc2.trackNameBold !== false, italic: tc2.trackNameItalic === true, color: "#3a4a4a" });
    TT.draw(null, tp.x, tp.y, rangeLabelTrackTitle, style, {
      "text-anchor": "middle", "dominant-baseline": "middle", class: "range-label-track-title",
      transform: `rotate(${rot} ${tp.x} ${tp.y})`
    });
  }
  return isInv ? (rOut - gap) : (rOut + gap);
}

function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}

function renderRangesPanel() {
  const list = document.getElementById("rpList");
  if (!list) return;
  const I = global.TreeI18N;
  if (!colorRanges.length) { list.innerHTML = `<div class="info-box" style="margin:8px 0;padding:8px;">${I.t('rangesEmpty')}</div>`; return; }
  const existing = list.querySelectorAll(".rp-row");
  if (existing.length !== colorRanges.length) {
    list.innerHTML = colorRanges.map(r =>
      '<div class="rp-row">' +
        '<input class="rp-sw rp-color-edit" data-range-color="' + r.id + '" type="color" value="' + r.color + '">' +
        '<input class="rp-lb-edit" data-range="' + r.id + '" type="text" value="' + escapeAttr(r.label || ("Range " + r.id)) + '">' +
        '<button class="rp-x" data-range="' + r.id + '" type="button">×</button>' +
      '</div>'
    ).join("");
  } else {
    existing.forEach((row, i) => {
      const r = colorRanges[i];
      const cInp = row.querySelector(".rp-color-edit");
      const lInp = row.querySelector(".rp-lb-edit");
      if (cInp && document.activeElement !== cInp) cInp.value = r.color;
      if (lInp && document.activeElement !== lInp) lInp.value = r.label || ("Range " + r.id);
    });
  }
}

function removeRange(id) {
  colorRanges = colorRanges.filter(r => r.id !== id);
  T.allWalk(C.getRoot(), n => { if (n.rangeId === id) n.rangeId = null; });
}

function createRangeForSelected() {
  const n = T.nodeById(C.getSelectedId());
  if (!n) return;
  const id = ++rangeSeq;
  colorRanges.push({ id, label: "Range " + id, color: paletteColor(colorRanges.length) });
  n.rangeId = id;
  renderRangesPanel();
  global.TreeRenderer.draw();
}

function lcaOfLeaves(leaves) {
  if (!leaves.length) return null;
  if (leaves.length === 1) return leaves[0];
  const pathOf = n => { const p = []; let c = n; while (c) { p.push(c); c = c.parent; } return p; };
  const paths = leaves.map(pathOf);
  const ref = paths[0];
  for (let i = 0; i < ref.length; i++) {
    const cand = ref[i];
    if (paths.every(p => p.indexOf(cand) >= 0)) return cand;
  }
  return C.getRoot();
}

function applyOneGroup(leafArr, label, color) {
  if (!leafArr || !leafArr.length) return;
  const id = ++rangeSeq;
  colorRanges.push({ id, label, color });
  const lca = lcaOfLeaves(leafArr);
  const targetSet = new Set(leafArr);
  const lcaLeaves = lca ? T.leavesUnder(lca) : [];
  if (lca && lcaLeaves.length && lcaLeaves.every(l => targetSet.has(l))) lca.rangeId = id;
  else leafArr.forEach(l => { l.rangeId = id; });
}

function applyGroupsByColumn(colName) {
  if (!colName) return;
  const I = global.TreeI18N;
  const tree = C.getRoot(); if (!tree) return;
  const ld = global.TreeAppData && global.TreeAppData.leafData;
  if (!ld || !ld.rows || !ld.rows.length) { alert(I.t('alertNeedDataTable')); return; }
  const nameToLeaf = new Map();
  T.visibleLeaves(tree).forEach(l => {
    const k = String(l.name || T.labelOf(l) || "").trim();
    if (k && !nameToLeaf.has(k)) nameToLeaf.set(k, l);
  });
  const groups = new Map();
  ld.rows.forEach(row => {
    const leafName = String(row.Leaf || "").trim(); if (!leafName) return;
    const leaf = nameToLeaf.get(leafName); if (!leaf) return;
    const gv = String(row[colName] == null ? "" : row[colName]).trim();
    if (!gv || gv === "NA") return;
    if (!groups.has(gv)) groups.set(gv, []);
    groups.get(gv).push(leaf);
  });
  if (!groups.size) { alert(I.t('alertNoGroupData')); return; }
  clearAllColorRanges();
  const sorted = Array.from(groups.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  let palette = null;
  if (global.TreePalette && global.TreePalette.getCategoricalColors) {
    palette = global.TreePalette.getCategoricalColors(ringPalette || "tableau10", sorted.length, { cycle: true });
  }
  sorted.forEach(([gv, leaves], i) => {
    const color = (palette && palette[i]) || paletteColor(i);
    applyOneGroup(leaves, gv, color);
  });
  rangeShowLabels = true;
  renderRangesPanel();
  global.TreeRenderer.draw();
  return { count: sorted.length };
}

function applyLeafLabelColumn(colName) {
  if (!colName) return;
  const I = global.TreeI18N;
  const tree = C.getRoot(); if (!tree) return;
  const ld = global.TreeAppData && global.TreeAppData.leafData;
  if (!ld || !ld.rows || !ld.rows.length) { alert(I.t('alertNeedDataTable')); return; }
  const nameToLeaf = new Map();
  T.allWalk(tree, n => {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (kids.length === 0) {
      const k = String(n.name || "").trim();
      if (k && !nameToLeaf.has(k)) nameToLeaf.set(k, n);
    }
  });
  const dataMap = new Map();
  ld.rows.forEach(row => {
    const leafName = String(row.Leaf || "").trim();
    if (!leafName) return;
    const raw = row[colName] == null ? "" : String(row[colName]);
    dataMap.set(leafName, raw.replace(/[\r\n\t\u00a0]/g, " "));
  });
  if (!dataMap.size) { alert(I.t('alertNoColumnData')); return; }
  let count = 0;
  dataMap.forEach((val, leafName) => {
    const leaf = nameToLeaf.get(leafName);
    if (leaf) { leaf.label = val; leaf.styleRuns = null; count++; }
  });
  global.TreeRenderer.draw();
  return { count };
}

function resetLeafLabels() {
  const tree = C.getRoot(); if (!tree) return;
  T.allWalk(tree, n => {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (kids.length === 0) { n.label = null; n.styleRuns = null; }
  });
  global.TreeRenderer.draw();
}

function parseStyleCode(text, code) {
  if (!text || !code) return null;
  const runs = [];
  let currentStyle = 1;
  let pos = 0;
  let segStart = 0;
  function flushSegment(endPos) {
    if (endPos > segStart && currentStyle !== 1) {
      const style = {};
      if (currentStyle === 2) style.italic = true;
      else if (currentStyle === 3) style.sup = true;
      else if (currentStyle === 4) style.sub = true;
      if (Object.keys(style).length) runs.push(Object.assign({ start: segStart, end: endPos }, style));
    }
  }
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (ch >= '1' && ch <= '4') {
      flushSegment(pos);
      currentStyle = parseInt(ch, 10);
      segStart = pos;
    } else {
      let matchIdx = -1;
      for (let j = pos; j < text.length; j++) { if (text[j] === ch) { matchIdx = j; break; } }
      if (matchIdx >= 0) { flushSegment(matchIdx); pos = matchIdx + 1; segStart = pos; currentStyle = 1; }
    }
  }
  flushSegment(text.length);
  return runs.length ? runs : null;
}

function applyLeafLabelStyleColumn(colName) {
  if (!colName) return { count: 0 };
  const I = global.TreeI18N;
  const tree = C.getRoot(); if (!tree) return { count: 0 };
  const ld = global.TreeAppData && global.TreeAppData.leafData;
  if (!ld || !ld.rows || !ld.rows.length) { alert(I.t('alertNeedDataTable')); return { count: 0 }; }
  const nameToLeaf = new Map();
  T.allWalk(tree, n => {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (kids.length === 0) {
      const k = String(n.name || "").trim();
      if (k && !nameToLeaf.has(k)) nameToLeaf.set(k, n);
    }
  });
  const dataMap = new Map();
  ld.rows.forEach(row => {
    const leafName = String(row.Leaf || "").trim();
    const val = String(row[colName] == null ? "" : row[colName]).trim();
    if (leafName) dataMap.set(leafName, val);
  });
  if (!dataMap.size) { alert(I.t('alertNoColumnData')); return { count: 0 }; }
  let count = 0;
  dataMap.forEach((styleCode, leafName) => {
    const leaf = nameToLeaf.get(leafName);
    if (!leaf) return;
    const text = T.labelOf(leaf);
    if (!text) return;
    if (styleCode === "") { leaf.styleRuns = null; return; }
    const runs = parseStyleCode(text, styleCode);
    leaf.styleRuns = runs;
    if (runs && runs.length) count++;
  });
  global.TreeRenderer.draw();
  return { count };
}

function resetLeafLabelStyles() {
  const tree = C.getRoot(); if (!tree) return;
  T.allWalk(tree, n => {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (kids.length === 0) n.styleRuns = null;
  });
  global.TreeRenderer.draw();
}

C.registerSnapshot('ranges', () => ({
  colorRanges: JSON.parse(JSON.stringify(colorRanges)),
  rangeCover, rangeBorder, rangeBorderColor,
  rangeColorBranches, rangeColorLabels,
  rangeShowLabels, rangeLabelSize, rangeLabelColor, rangeLabelBold, rangeLabelItalic, rangeLabelFont,
  rangeLabelTrackShow, rangeLabelTrackWidth, rangeLabelTrackAutoWidth, rangeLabelTrackOffset,
  rangeLabelTrackOpacity, rangeLabelTrackTextOrientation, rangeLabelTrackTitle, rangeLabelTrackTitleShow,
  rangeLabelTrackTextOffsetX, rangeLabelTrackTextOffsetY,
  rangeSeq, ringPalette
}), s => {
  if (Array.isArray(s.colorRanges)) colorRanges = s.colorRanges;
  if (typeof s.rangeSeq === "number") rangeSeq = s.rangeSeq;
  if (typeof s.ringPalette === "string") ringPalette = s.ringPalette;
  if (typeof s.rangeCover === "string") rangeCover = s.rangeCover;
  if (typeof s.rangeColorBranches === "boolean") rangeColorBranches = s.rangeColorBranches;
  if (typeof s.rangeColorLabels === "boolean") rangeColorLabels = s.rangeColorLabels;
  if (typeof s.rangeBorder === "number") rangeBorder = s.rangeBorder;
  if (typeof s.rangeBorderColor === "string") rangeBorderColor = s.rangeBorderColor;
  if (typeof s.rangeShowLabels === "boolean") rangeShowLabels = s.rangeShowLabels;
  if (typeof s.rangeLabelSize === "number") rangeLabelSize = s.rangeLabelSize;
  if (typeof s.rangeLabelColor === "string") rangeLabelColor = s.rangeLabelColor;
  if (typeof s.rangeLabelBold === "boolean") rangeLabelBold = s.rangeLabelBold;
  if (typeof s.rangeLabelItalic === "boolean") rangeLabelItalic = s.rangeLabelItalic;
  if (typeof s.rangeLabelFont === "string") rangeLabelFont = s.rangeLabelFont;
  if (typeof s.rangeLabelTrackShow === "boolean") rangeLabelTrackShow = s.rangeLabelTrackShow;
  if (typeof s.rangeLabelTrackWidth === "number") rangeLabelTrackWidth = s.rangeLabelTrackWidth;
  if (typeof s.rangeLabelTrackAutoWidth === "boolean") rangeLabelTrackAutoWidth = s.rangeLabelTrackAutoWidth;
  if (typeof s.rangeLabelTrackOffset === "number") rangeLabelTrackOffset = s.rangeLabelTrackOffset;
  if (typeof s.rangeLabelTrackOpacity === "number") rangeLabelTrackOpacity = s.rangeLabelTrackOpacity;
  if (typeof s.rangeLabelTrackTextOrientation === "string") rangeLabelTrackTextOrientation = s.rangeLabelTrackTextOrientation;
  if (typeof s.rangeLabelTrackTitle === "string") rangeLabelTrackTitle = s.rangeLabelTrackTitle;
  if (typeof s.rangeLabelTrackTitleShow === "boolean") rangeLabelTrackTitleShow = s.rangeLabelTrackTitleShow;
  if (typeof s.rangeLabelTrackTextOffsetX === "number") rangeLabelTrackTextOffsetX = s.rangeLabelTrackTextOffsetX;
  if (typeof s.rangeLabelTrackTextOffsetY === "number") rangeLabelTrackTextOffsetY = s.rangeLabelTrackTextOffsetY;
});

global.TreeLegend = { drawLegend };
if (!global.TreeRanges) global.TreeRanges = {};
Object.defineProperties(global.TreeRanges, {
  colorRanges: { get() { return colorRanges; }, configurable: true },
  ringPalette: { get() { return ringPalette; }, set(v) { ringPalette = v; }, configurable: true },
  rangeCover: { get() { return rangeCover; }, set(v) { rangeCover = v; }, configurable: true },
  rangeBorder: { get() { return rangeBorder; }, set(v) { rangeBorder = v; }, configurable: true },
  rangeBorderColor: { get() { return rangeBorderColor; }, set(v) { rangeBorderColor = v; }, configurable: true },
  rangeColorBranches: { get() { return rangeColorBranches; }, set(v) { rangeColorBranches = v; }, configurable: true },
  rangeColorLabels: { get() { return rangeColorLabels; }, set(v) { rangeColorLabels = v; }, configurable: true },
  rangeShowLabels: { get() { return rangeShowLabels; }, set(v) { rangeShowLabels = v; }, configurable: true },
  rangeLabelSize: { get() { return rangeLabelSize; }, set(v) { rangeLabelSize = v; }, configurable: true },
  rangeLabelColor: { get() { return rangeLabelColor; }, set(v) { rangeLabelColor = v; }, configurable: true },
  rangeLabelBold: { get() { return rangeLabelBold; }, set(v) { rangeLabelBold = v; }, configurable: true },
  rangeLabelItalic: { get() { return rangeLabelItalic; }, set(v) { rangeLabelItalic = v; }, configurable: true },
  rangeLabelFont: { get() { return rangeLabelFont; }, set(v) { rangeLabelFont = v; }, configurable: true },
  rangeLabelTrackShow: { get() { return rangeLabelTrackShow; }, set(v) { rangeLabelTrackShow = v; }, configurable: true },
  rangeLabelTrackWidth: { get() { return rangeLabelTrackWidth; }, set(v) { rangeLabelTrackWidth = v; }, configurable: true },
  rangeLabelTrackAutoWidth: { get() { return rangeLabelTrackAutoWidth; }, set(v) { rangeLabelTrackAutoWidth = v; }, configurable: true },
  rangeLabelTrackOffset: { get() { return rangeLabelTrackOffset; }, set(v) { rangeLabelTrackOffset = v; }, configurable: true },
  rangeLabelTrackOpacity: { get() { return rangeLabelTrackOpacity; }, set(v) { rangeLabelTrackOpacity = v; }, configurable: true },
  rangeLabelTrackTextOrientation: { get() { return rangeLabelTrackTextOrientation; }, set(v) { rangeLabelTrackTextOrientation = v; }, configurable: true },
  rangeLabelTrackTitle: { get() { return rangeLabelTrackTitle; }, set(v) { rangeLabelTrackTitle = v; }, configurable: true },
  rangeLabelTrackTitleShow: { get() { return rangeLabelTrackTitleShow; }, set(v) { rangeLabelTrackTitleShow = v; }, configurable: true },
  rangeLabelTrackTextOffsetX: { get() { return rangeLabelTrackTextOffsetX; }, set(v) { rangeLabelTrackTextOffsetX = v; }, configurable: true },
  rangeLabelTrackTextOffsetY: { get() { return rangeLabelTrackTextOffsetY; }, set(v) { rangeLabelTrackTextOffsetY = v; }, configurable: true },
  rangeSeq: { get() { return rangeSeq; }, set(v) { rangeSeq = v; }, configurable: true }
});
Object.assign(global.TreeRanges, {
  getRangeColorForNode, rangeById, rangeMembers, clearAllColorRanges, rectangularRangeSegments, rangePaint,
  drawRectangularRanges, drawColoredRanges, renderRangesPanel, removeRange,
  drawRectangularRangeLabelTrack, drawRadialRangeLabelTrack,
  createRangeForSelected, applyOneGroup, lcaOfLeaves,
  applyGroupsByColumn, applyLeafLabelColumn, resetLeafLabels,
  applyLeafLabelStyleColumn, resetLeafLabelStyles,
  paletteColor, recolorRangesByPalette
});
})(window);
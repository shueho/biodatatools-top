(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const L = global.TreeLayout;
const N = global.TreeDrawNode;
const I = global.TreeI18N;

function fontFam() { return C.state.fontFamily || 'Times New Roman'; }
function hasRealChildren(n) { return !!(n && (n.children || []).some(c => !c.deleted)); }

function estimateTextWidth(text, fontSize) {
  let w = 0; const s = String(text || '');
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 0x4e00 && code <= 0x9fff) w += fontSize;
    else if (code >= 0x3000 && code <= 0x303f) w += fontSize;
    else if (code >= 0xff00 && code <= 0xffef) w += fontSize;
    else w += fontSize * 0.6;
  }
  return w;
}
function fitText(text, maxW, fs) {
  if (!text) return '';
  const getW = (s) => {
    let w = 0;
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      w += (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3000 && code <= 0x303f) || (code >= 0xff00 && code <= 0xffef) ? fs : fs * 0.6;
    }
    return w;
  };
  if (getW(text) <= maxW) return text;
  
  const ellipsis = '.'; 
  const ellW = getW(ellipsis);
  let curW = 0;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const cW = (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3000 && code <= 0x303f) || (code >= 0xff00 && code <= 0xffef) ? fs : fs * 0.6;
    if (curW + cW + ellW > maxW) break;
    curW += cW;
    out += text[i];
  }
  return out ? out + ellipsis : '';
}

function drawLegend(customX, customY) {
  const st = C.state;
  if (!st.showLegend || !global.TreeRanges) return;
  const colorRanges = global.TreeRanges.colorRanges;
  if (!colorRanges.length) return;
  const tc = (global.TreeTracks && global.TreeTracks.trackCommon) || {};
  const lx = (customX != null) ? Number(customX) : (Number(st.legendX) || 760);
  const ly = (customY != null) ? Number(customY) : (Number(st.legendY) || 60);
  const scale = tc.legendScale || 1;
  const fs = Math.max(6, Number(tc.legendFontSize) || 11) * scale;
  const pad = 10;
  const bw = tc.legendBold ? 700 : 400;
  const fsStyle = tc.legendItalic ? "italic" : "normal";
  const titleFS = Math.max(6, Number(tc.legendTitleFontSize) || 12) * scale;
  const titleBold = tc.legendTitleBold ? 800 : 700;
  const titleItalic = tc.legendTitleItalic ? "italic" : "normal";
  const showTitle = tc.legendTitleShow !== false;
  const title = showTitle ? (st.legendTitle != null ? st.legendTitle : "Groups") : "";
  const maxPerRow = Math.max(0, Number(tc.legendMaxPerRow) || 0);
  const ff = fontFam();
  const fc = st.legendColor || "#222222";
  const labels = colorRanges.map(r => r.label || ("Range " + r.id));
  const items = colorRanges.map((r, i) => ({ label: labels[i], color: r.color }));
  const g = C.el("g", { class: "legend-box", "data-legend": "1", style: "cursor:move",
    transform: `translate(${lx} ${ly})` });
  let xx = 0, yy = 0, rowItems = 0;
  if (title) {
    const tt = C.el("text", { x: pad, y: titleFS, "font-size": titleFS, "font-weight": titleBold,
      "font-style": titleItalic, fill: fc, "pointer-events": "none", "font-family": ff }, g);
    tt.textContent = title;
    yy = titleFS + 6;
  }

  let maxItemW = 0;
  items.forEach(it => {
    const w = fs + 8 + it.label.length * fs * 0.6;
    if (w > maxItemW) maxItemW = w;
  });

  let maxX = 0;
  items.forEach(it => {
    const wItem = fs + 8 + it.label.length * fs * 0.6;
    if (maxPerRow > 0 && rowItems >= maxPerRow) { xx = 0; yy += fs + 6; rowItems = 0; }
    C.el("rect", { x: xx, y: yy, width: fs, height: fs, fill: it.color, rx: 2 }, g);
    const lt = C.el("text", { x: xx + fs + 6, y: yy + fs * 0.85, "font-size": fs,
      "font-weight": bw, "font-style": fsStyle, fill: fc, "font-family": ff }, g);
    lt.textContent = it.label;
    
    const stepW = (maxPerRow > 0) ? maxItemW : wItem;
    xx += stepW + 8; rowItems++;
    maxX = Math.max(maxX, xx);
  });
  yy += fs + pad;
  C.el("rect", { x: 0, y: 0, width: maxX + pad, height: yy,
    fill: "transparent", "pointer-events": "all" }, g).setAttribute("class", "legend-hit");
}

global.TreeLegend = { drawLegend };

let colorRanges = [];
let rangeSeq = 0;
let rangeCover = "label";
let rangeBorder = 0;
let rangeBorderColor = "#333333";
let rangeShowLabels = false;
let rangeLabelSize = 13, rangeLabelColor = "", rangeLabelBold = true, rangeLabelItalic = false, rangeLabelOffset = 10, rangeLabelFont = "";
let rangeLabelTrackShow = true;
let rangeLabelTrackWidth = 60;
let rangeLabelTrackAutoWidth = false;
let rangeLabelTrackOffset = 0;
let rangeLabelTrackOpacity = 1;
let rangeLabelTrackTextOrientation = 'horizontal';
let rangeLabelTrackTitle = 'Groups';
let rangeLabelTrackTitleShow = true;
let ringPalette = "tableau10";

const RING_PALETTES = (function () {
  if (!global.TreePalette || !global.TreePalette.getCategoricalScheme) {
    return { npg: ["#E64B35","#4DBBD5","#00A087","#3C5488","#F39B7F","#8491B4","#91D1C2","#DC0000"] };
  }
  const out = {};
  ['npg','aaas','nejm','lancet','jama','jco','category10','tableau10',
   'set1','set2','set3','paired','dark2','accent','pastel1','pastel2',
   'okabeito','ibm'].forEach(k => {
    const c = global.TreePalette.getCategoricalScheme(k);
    if (c && c.length) out[k] = c;
  });
  return out;
})();

function paletteColor(i) {
  const name = ringPalette || "tableau10";
  if (global.TreePalette && global.TreePalette.getCategoricalColors) {
    const pal = global.TreePalette.getCategoricalColors(name, 0); 
    return pal[i % Math.max(1, pal.length)] || "#cccccc";
  }
  const pal = RING_PALETTES[name] || RING_PALETTES.npg || ["#cccccc"];
  return pal[i % pal.length];
}

function recolorRangesByPalette() { colorRanges.forEach((r, i) => { r.color = paletteColor(i); }); }
function rangeById(id) { return colorRanges.find(r => r.id === id) || null; }
function rangeMembers(id) { const out = []; T.allWalk(C.getRoot(), n => { if (n.rangeId === id) out.push(n); }); return out; }
function clearAllColorRanges() { colorRanges = []; T.allWalk(C.getRoot(), n => { if (n.rangeId != null) n.rangeId = null; }); }

function rectangularRangeSegments(leaves, ranges, fallbackHeight) {
  const ordered = [...leaves].sort((a,b) => a.y - b.y);
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
    : C.el("linearGradient", {
        id, x1: invert ? "100%" : "0%", y1: "0%", x2: invert ? "0%" : "100%", y2: "0%"
      }, defs);
  C.el("stop", { offset: radial ? `${Math.min(99, inner/Math.max(1,outer)*100)}%` : "0%", "stop-color": range.color, "stop-opacity": 0.02 }, gradient);
  C.el("stop", { offset: "100%", "stop-color": range.color, "stop-opacity": 1 }, gradient);
  return `url(#${id})`;
}

function drawRectangularRanges() {
  if (rangeCover === "off") return;
  const leaves = T.visibleLeaves(C.getRoot());
  const st = C.state;
  const isInv = (st.invert === true || st.invert === "true");
  const rowH = Math.max(14, st.fontSize * 1.05) * (st.scaleV || 1);
  const segments = rectangularRangeSegments(leaves, colorRanges, rowH);
  let labelEdge = N.labelRightEdge();
  C.getSvg().querySelectorAll(".leaf-label").forEach(label => {
    try {
      const b = label.getBBox();
      if (isInv) labelEdge = Math.min(labelEdge, b.x - 6);
      else       labelEdge = Math.max(labelEdge, b.x + b.width + 6);
    } catch (_) {}
  });
  const bg = C.el("g", { class: "range-backgrounds" });
  C.getSvg().insertBefore(bg, C.getSvg().firstChild);
  const vb = C.getViewBox();
  segments.forEach((segment, index) => {
    const range = rangeById(segment.id);
    let x0, width;
    if (isInv) {
      const alignedX = C.alignedLabelX();
      if (rangeCover === "full")        { x0 = labelEdge; width = Math.max(3, (vb.x + vb.w - 20) - labelEdge); }
      else if (rangeCover === "clade")  { x0 = labelEdge; width = Math.max(3, segment.x0 - labelEdge); }
      else                              { x0 = labelEdge; width = Math.max(3, alignedX - labelEdge); }
    } else {
      x0 = rangeCover === "full" ? 40
        : rangeCover === "clade" ? segment.x0
        : st.labelPosition === "aligned" ? C.alignedLabelX()
        : Math.min(...segment.leaves.map(l => l.x));
      width = Math.max(3, labelEdge - x0);
    }
    const attrs = { x: x0, y: segment.top, width, height: segment.bottom - segment.top,
      fill: rangePaint(range, index, false, 0, 1, isInv), opacity: st.rangeOpacity,
      "data-range": range.id, "data-id": segment.node.id, class: "range-background clickable" };
    if (rangeBorder > 0) { attrs.stroke = rangeBorderColor; attrs["stroke-width"] = rangeBorder; }
    C.el("rect", attrs, bg);
  });
}

function drawColoredRanges(radial) {
  if (rangeCover === "off") return;
  if (!radial) { drawRectangularRanges(); return; }
  const st = C.state;
  const vl = T.visibleLeaves(C.getRoot());
  const gl = vl.map(l => l.angle).filter(a => a != null).sort((a,b) => a-b);
  const gStep = gl.length > 1 ? (gl[gl.length-1] - gl[0]) / (gl.length-1) : 6;
  const gTipR = Math.max(...vl.map(l => l.r || 0), 260);
  const lout = vl.map(l => {
    const lbl = C.getSvg().querySelector('.leaf-label[data-id="' + l.id + '"]');
    let w = T.labelOf(l).length * st.fontSize * (l.labelSizeFactor || 1) * 0.6;
    if (lbl) { try { w = lbl.getBBox().width; } catch(_){} }
    return C.getRadialLabelR() + w;
  });
  const gLabIn = C.getRadialLabelR() - 6;
  const gLabOut = Math.max(...lout) + 10;
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
      let rIn, rOut;
      if (rangeCover === "clade") { rIn = Math.max(0, n.r || 0); rOut = gTipR + 2; }
      else if (rangeCover === "full") { rIn = 24; rOut = gLabOut; }
      else { rIn = gLabIn; rOut = gLabOut; }
      const p0i = L.polar(cx, cy, rIn, a0), p0o = L.polar(cx, cy, rOut, a0);
      const p1o = L.polar(cx, cy, rOut, a1), p1i = L.polar(cx, cy, rIn, a1);
      const large = (a1 - a0) > 180 ? 1 : 0;
      const d = `M ${p0i.x} ${p0i.y} L ${p0o.x} ${p0o.y} A ${rOut} ${rOut} 0 ${large} 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${rIn} ${rIn} 0 ${large} 0 ${p0i.x} ${p0i.y} Z`;
      const attrs = { d, fill: rangePaint(rg, n.id, true, rIn, rOut), opacity: st.rangeOpacity, "data-id": n.id, class: "range-background clickable" };
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
      const tw = estimateTextWidth(text, rangeLabelSize);
      if (tw > maxTextW) maxTextW = tw;
    });
    trackW = Math.ceil(maxTextW + 16);
  }
  const offset = Number(rangeLabelTrackOffset) || 0;
  const x0 = isInv ? xBase - offset - trackW : xBase + offset;
  const ff = rangeLabelFont || st.fontFamily;
  const textColor = rangeLabelColor || '#333333';
  const vertical = rangeLabelTrackTextOrientation === 'vertical';
  segments.forEach(seg => {
    const range = rangeById(seg.id); if (!range) return;
    C.el("rect", { x: x0, y: seg.top, width: trackW, height: Math.max(1, seg.bottom - seg.top),
      fill: range.color, opacity: rangeLabelTrackOpacity,
      "data-range": seg.id, class: "range-label-track" });
    if (rangeShowLabels && range.label) {
      const cx = x0 + trackW / 2;
      const cy = (seg.top + seg.bottom) / 2;
      const attrs = { x: cx, y: cy, "text-anchor": "middle", "dominant-baseline": "middle",
        "font-size": rangeLabelSize, "font-weight": rangeLabelBold ? 700 : 400,
        "font-style": rangeLabelItalic ? "italic" : "normal", fill: textColor,
        "font-family": ff, "pointer-events": "none", class: "range-label-track-text" };
      if (vertical) attrs.transform = `rotate(-90 ${cx} ${cy})`;
      C.el("text", attrs).textContent = range.label;
    }
  });
  if (rangeLabelTrackTitleShow && rangeLabelTrackTitle) {
    const titleFs = Number(tc.trackNameFontSize) || 11;
    const titleBold = tc.trackNameBold !== false ? 700 : 400;
    const titleItalic = tc.trackNameItalic ? 'italic' : 'normal';
    const titleAngle = (tc.trackNameAngle != null) ? Number(tc.trackNameAngle) : -45;
    const angleRad = titleAngle * Math.PI / 180;
    const titleWidth = estimateTextWidth(rangeLabelTrackTitle, titleFs);
    const lowestOffset = Math.abs((titleWidth / 2) * Math.sin(angleRad)) + Math.abs((titleFs / 2) * Math.cos(angleRad));
    const ys = leaves.map(l => l.y);
    const titleY = Math.min(...ys) - rowH * 0.85 - lowestOffset - 8;
    const cx = x0 + trackW / 2;
    const titleEl = C.el("text", { x: cx, y: titleY, "text-anchor": "middle", "dominant-baseline": "middle",
      "font-size": titleFs, "font-weight": titleBold, "font-style": titleItalic,
      fill: "#3a4a4a", "font-family": ff, class: "range-label-track-title",
      transform: titleAngle ? `rotate(${titleAngle} ${cx} ${titleY})` : undefined });
    titleEl.textContent = rangeLabelTrackTitle;
  }
  return isInv ? (x0 - gap) : (x0 + trackW + gap);
}

function drawRadialRangeLabelTrack(rBase, leaves) {
  const st = C.state;
  const tc = (global.TreeTracks && global.TreeTracks.trackCommon) || {};
  const gap = Math.max(0, Number(tc.trackGap) || 0);
  const gl = leaves.map(l => l.angle).filter(a => a != null).sort((a,b) => a-b);
  const gStep = gl.length > 1 ? (gl[gl.length-1] - gl[0]) / (gl.length-1) : 6;
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
    groups.push({ range: rg, a0: Math.min(...angles) - gStep/2, a1: Math.max(...angles) + gStep/2 });
  });
  if (!groups.length) return rBase;
  let trackW = Number(rangeLabelTrackWidth) || 60;
  if (rangeLabelTrackAutoWidth) {
    let maxTextW = 40;
    groups.forEach(g => {
      const text = g.range.label || ('Range ' + g.range.id);
      const tw = estimateTextWidth(text, rangeLabelSize);
      if (tw > maxTextW) maxTextW = tw;
    });
    trackW = Math.ceil(maxTextW + 16);
  }
  const offset = Number(rangeLabelTrackOffset) || 0;
  const rIn = rBase + offset;
  const rOut = rIn + trackW;
  const ff = rangeLabelFont || st.fontFamily;
  const textColor = rangeLabelColor || '#333333';
  const vertical = rangeLabelTrackTextOrientation === 'vertical';
  groups.forEach(({ range, a0, a1 }) => {
    const p0i = L.polar(cx, cy, rIn, a0), p0o = L.polar(cx, cy, rOut, a0);
    const p1o = L.polar(cx, cy, rOut, a1), p1i = L.polar(cx, cy, rIn, a1);
    const large = (a1 - a0) > 180 ? 1 : 0;
    const d = `M ${p0i.x} ${p0i.y} L ${p0o.x} ${p0o.y} A ${rOut} ${rOut} 0 ${large} 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${rIn} ${rIn} 0 ${large} 0 ${p0i.x} ${p0i.y} Z`;
    C.el("path", { d, fill: range.color, opacity: rangeLabelTrackOpacity,
      "data-range": range.id, class: "range-label-track" });
    if (rangeShowLabels && range.label) {
      const mid = (a0 + a1) / 2;
      const midR = (rIn + rOut) / 2;
      const lp = L.polar(cx, cy, midR, mid);
      let rot;
      if (vertical) { rot = mid; if (rot > 90 && rot < 270) rot -= 180; }
      else { rot = mid - 90; if (rot > 90) rot -= 180; if (rot < -90) rot += 180; }
      C.el("text", { x: lp.x, y: lp.y, "text-anchor": "middle", "dominant-baseline": "middle",
        "font-size": rangeLabelSize, "font-weight": rangeLabelBold ? 700 : 400,
        "font-style": rangeLabelItalic ? "italic" : "normal", fill: textColor,
        "font-family": ff, "pointer-events": "none", class: "range-label-track-text",
        transform: `rotate(${rot} ${lp.x} ${lp.y})` }).textContent = range.label;
    }
  });
  if (rangeLabelTrackTitleShow && rangeLabelTrackTitle) {
    const lastA1 = groups[groups.length-1].a1;
    const firstA0 = groups[0].a0;
    let gapMid = (lastA1 + (firstA0 + 360)) / 2;
    if (gapMid >= 360) gapMid -= 360;
    const titleR = (rIn + rOut) / 2;
    const tp = L.polar(cx, cy, titleR, gapMid);
    let rot = gapMid - 90;
    if (rot > 90) rot -= 180;
    if (rot < -90) rot += 180;
    C.el("text", { x: tp.x, y: tp.y, "text-anchor": "middle", "dominant-baseline": "middle",
      "font-size": Math.max(10, rangeLabelSize - 2), "font-weight": 700,
      fill: "#3a4a4a", "font-family": ff, class: "range-label-track-title",
      transform: `rotate(${rot} ${tp.x} ${tp.y})` }).textContent = rangeLabelTrackTitle;
  }
  return rOut + gap;
}

function escapeAttr(s) { return String(s).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }

function renderRangesPanel() {
  const list = document.getElementById("rpList");
  if (!list) return;

  if (!colorRanges.length) {
    list.innerHTML = `<div class="info-box" style="margin:8px 0;padding:8px;">${I.t('rangesEmpty')}</div>`;
    return;
  }

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

function removeRange(id) { colorRanges = colorRanges.filter(r => r.id !== id); T.allWalk(C.getRoot(), n => { if (n.rangeId === id) n.rangeId = null; }); }

function openRangeModal() {
  const n = T.nodeById(C.getSelectedId()); if (!n) return;
  C.snapshot();
  const id = ++rangeSeq;
  colorRanges.push({ id, label: "Range " + id, color: paletteColor(colorRanges.length) });
  n.rangeId = id; renderRangesPanel(); global.TreeRenderer.draw();
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

function lcaOfLeaves(leaves) {
  if (!leaves.length) return null;
  if (leaves.length === 1) return leaves[0];
  const pathOf = n => { const p = []; let c = n; while (c) { p.push(c); c = c.parent; } return p; };
  const paths = leaves.map(pathOf);
  const ref = paths[0];
  for (let i = 0; i < ref.length; i++) { const cand = ref[i]; if (paths.every(p => p.indexOf(cand) >= 0)) return cand; }
  return C.getRoot();
}

function applyGroupsByColumn(colName) {
  if (!colName) return;
  const tree = C.getRoot(); if (!tree) return;
  const ld = global.TreeApp && global.TreeApp.leafData;
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
  C.snapshot(); clearAllColorRanges();
  const sorted = Array.from(groups.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  let palette = null;
  if (global.TreePalette && global.TreePalette.getCategoricalColors) {
    palette = global.TreePalette.getCategoricalColors(ringPalette || "tableau10", sorted.length, { cycle: true });
  }
  sorted.forEach(([gv, leaves], i) => {
    const color = (palette && palette[i]) || paletteColor(i);
    applyOneGroup(leaves, gv, color);
  });
  rangeShowLabels = true; renderRangesPanel(); global.TreeRenderer.draw();
  return { count: sorted.length };
}

function applyLeafLabelColumn(colName) {
  if (!colName) return;
  const tree = C.getRoot(); if (!tree) return;
  const ld = global.TreeApp && global.TreeApp.leafData;
  if (!ld || !ld.rows || !ld.rows.length) { alert(I.t('alertNeedDataTable')); return; }
  const nameToLeaf = new Map();
  T.allWalk(tree, n => {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (kids.length === 0) {
      const k = String(n.name || T.labelOf(n) || "").trim();
      if (k && !nameToLeaf.has(k)) nameToLeaf.set(k, n);
    }
  });
  const dataMap = new Map();
  ld.rows.forEach(row => {
    const leafName = String(row.Leaf || "").trim();
    const val = String(row[colName] == null ? "" : row[colName]).trim();
    if (leafName && val) dataMap.set(leafName, val);
  });
  if (!dataMap.size) { alert(I.t('alertNoColumnData')); return; }
  C.snapshot();
  let count = 0;
  dataMap.forEach((val, leafName) => {
    const leaf = nameToLeaf.get(leafName);
    if (leaf) { leaf.label = val; count++; }
  });
  global.TreeRenderer.draw();
  return { count };
}

function resetLeafLabels() {
  const tree = C.getRoot(); if (!tree) return;
  C.snapshot();
  T.allWalk(tree, n => {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (kids.length === 0) n.label = null;
  });
  global.TreeRenderer.draw();
}

const GEO_LEVELS = ['eon', 'era', 'period', 'epoch', 'age'];
const GEO_LEVEL_LABELS = { eon: 'Eon', era: 'Era', period: 'Period', epoch: 'Epoch', age: 'Age' };

const GEO_FALLBACK = { children: [
  { name: "Phanerozoic", color: "#9AD9DD", start: 538.8, end: 0, children: [
    { name: "Paleozoic", color: "#99C08D", start: 538.8, end: 251.902, children: [
      { name: "Cambrian", color: "#7FA056", start: 538.8, end: 486.85 },
      { name: "Ordovician", color: "#009270", start: 486.85, end: 443.1 },
      { name: "Silurian", color: "#B3E1B6", start: 443.1, end: 419.62 },
      { name: "Devonian", color: "#CB8C37", start: 419.62, end: 358.86 },
      { name: "Carboniferous", color: "#67A599", start: 358.86, end: 298.9 },
      { name: "Permian", color: "#F04028", start: 298.9, end: 251.902 }
    ]},
    { name: "Mesozoic", color: "#67C5CA", start: 251.902, end: 66, children: [
      { name: "Triassic", color: "#812B92", start: 251.902, end: 201.4 },
      { name: "Jurassic", color: "#34B2C9", start: 201.4, end: 143.1 },
      { name: "Cretaceous", color: "#7FC64E", start: 143.1, end: 66 }
    ]},
    { name: "Cenozoic", color: "#F2F91D", start: 66, end: 0, children: [
      { name: "Paleogene", color: "#FD9A52", start: 66, end: 23.04 },
      { name: "Neogene", color: "#FFE619", start: 23.04, end: 2.58 },
      { name: "Quaternary", color: "#F9F97F", start: 2.58, end: 0 }
    ]}
  ]},
  { name: "Proterozoic", color: "#F73563", start: 2500, end: 538.8 },
  { name: "Archean", color: "#F0047F", start: 4031, end: 2500 },
  { name: "Hadean", color: "#AE027E", start: 4567, end: 4031 }
]};

let geoTimeTracks = [];
let geoTrackSeq = 0;
let geoEntrySeq = 0;
let geoTimeShow = false;
let geoPresetDataCache = null;
let geoPresetLoading = null;
let geoScaleFactor = 1;
function getGeoExtra() {
  if (!geoTimeShow || !geoTimeTracks.length) return 0;
  let maxBand = 0;
  geoTimeTracks.forEach(t => {
    const w = (Number(t.offset) || 0) + (Number(t.height) || 18);
    if (w > maxBand) maxBand = w;
  });
  return maxBand + 20;
}
function geoJsonCandidates() {
  const list = ['geo-timescale-intervals.json', './geo-timescale-intervals.json'];
  try {
    const s = document.currentScript && document.currentScript.src;
    if (s) list.push(s.replace(/[^/]*$/, '') + 'geo-timescale-intervals.json');
  } catch (_) {}
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src && /tree-annot\.js/.test(scripts[i].src)) {
      list.push(scripts[i].src.replace(/[^/]*$/, '') + 'geo-timescale-intervals.json');
      break;
    }
  }
  return Array.from(new Set(list));
}

function makeTimeToDepth(tracks, maxD) {
  const gsf = Number(geoScaleFactor) || 1;
  return t => t * gsf;
}

function loadGeoPresetData() {
  if (geoPresetDataCache) return Promise.resolve(geoPresetDataCache);
  if (geoPresetLoading) return geoPresetLoading;
  geoPresetLoading = (async () => {
    if (global.TreeGeoPresetData && (global.TreeGeoPresetData.children || global.TreeGeoPresetData.name)) {
      geoPresetDataCache = global.TreeGeoPresetData;
      return geoPresetDataCache;
    }
    const paths = geoJsonCandidates();
    for (const p of paths) {
      try {
        const r = await fetch(p);
        if (!r.ok) continue;
        const d = await r.json();
        if (d && (d.children || d.name)) { geoPresetDataCache = d; return d; }
      } catch (_) {}
    }
    geoPresetDataCache = GEO_FALLBACK;
    return GEO_FALLBACK;
  })();
  return geoPresetLoading;
}

function buildGeoLevelBuckets(dataRoot) {
  const levelByDepth = { 1: 'eon', 2: 'era', 3: 'period', 4: 'epoch', 5: 'age' };
  const buckets = {}; GEO_LEVELS.forEach(l => { buckets[l] = []; });
  function walk(node, depth) {
    if (!node) return;
    const lvl = levelByDepth[depth];
    if (lvl && node.name && node.start != null && node.end != null) {
      buckets[lvl].push({
        start: Number(node.start), end: Number(node.end),
        name: String(node.name), color: node.color || '#cccccc'
      });
    }
    (node.children || []).forEach(c => walk(c, depth + 1));
  }
  walk(dataRoot, 0);
  return buckets;
}

function addGeoTrack(cfg) {
  const t = {
    id: ++geoTrackSeq,
    level: cfg.level || '',
    name: cfg.name != null ? cfg.name : 'Track ' + geoTrackSeq,
    nameShow: cfg.nameShow !== false,
    nameFontSize: Number(cfg.nameFontSize) || 11,
    nameBold: cfg.nameBold !== false,
    nameItalic: !!cfg.nameItalic,
    outlineColor: cfg.outlineColor || '#555555',
    outlineWidth: cfg.outlineWidth != null ? Number(cfg.outlineWidth) : 0.5,
    opacity: cfg.opacity != null ? Number(cfg.opacity) : 0.9,
    fillTree: !!cfg.fillTree,
    fillTreeOpacity: cfg.fillTreeOpacity != null ? Number(cfg.fillTreeOpacity) : 0.14,
    position: cfg.position === 'top' ? 'top' : 'bottom',
    offset: Number(cfg.offset) || 0,
    height: Number(cfg.height) || 18,
    gap: Number(cfg.gap) || 4,
    textOrientation: cfg.textOrientation === 'vertical' ? 'vertical' : 'horizontal',
    collapsed: false,
    entries: (cfg.entries || []).map(e => ({
      id: ++geoEntrySeq,
      start: Number(e.start), end: Number(e.end),
      name: e.name || '', color: e.color || '#cccccc'
    }))
  };
  geoTimeTracks.push(t);
  return t;
}

function removeGeoTrack(id) { geoTimeTracks = geoTimeTracks.filter(t => t.id !== id); }

function addGeoEntry(trackId, cfg) {
  const t = geoTimeTracks.find(x => x.id === trackId); if (!t) return null;
  const e = {
    id: ++geoEntrySeq,
    start: Number(cfg.start) || 0, end: Number(cfg.end) || 0,
    name: cfg.name || '', color: cfg.color || '#cccccc'
  };
  t.entries.push(e);
  return e;
}

function removeGeoEntry(trackId, entryId) {
  const t = geoTimeTracks.find(x => x.id === trackId); if (!t) return;
  t.entries = t.entries.filter(e => e.id !== entryId);
}

async function importGeoPreset(levels) {
  const root = C.getRoot();
  if (!root) { alert(I.t('alertNeedTree')); return 0; }
  const data = await loadGeoPresetData();
  const buckets = buildGeoLevelBuckets(data);
  const want = Array.isArray(levels) && levels.length ? levels : ['eon', 'era', 'period'];
  C.snapshot();
  geoTimeTracks = [];
  geoTrackSeq = 0;
  geoEntrySeq = 0;
  want.forEach(l => {
    if (!buckets[l] || !buckets[l].length) return;
    addGeoTrack({
      level: l,
      name: GEO_LEVEL_LABELS[l] + 's',
      fillTree: l === 'eon',
      position: 'bottom',
      entries: buckets[l]
    });
  });
  geoTimeShow = true;
  if (global.TreeRenderer) global.TreeRenderer.draw();
  return geoTimeTracks.length;
}

function drawGeoTrackRectBand(track, y, tickPx, axisLo, axisHi, timeToDepth) {
  const h = track.height;
  const lo = Math.min(axisLo, axisHi);
  const hi = Math.max(axisLo, axisHi);
  track.entries.forEach(e => {
    const v1 = timeToDepth(e.start);
    const v2 = timeToDepth(e.end);
    let px1 = tickPx(v1);
    let px2 = tickPx(v2);
    if (!isFinite(px1) || !isFinite(px2)) return;
    px1 = Math.max(lo, Math.min(hi, px1));
    px2 = Math.max(lo, Math.min(hi, px2));
    let left = Math.min(px1, px2);
    let width = Math.abs(px2 - px1);
    
    if (width < 1.5) {
      const center = left + width / 2;
      left = center - 0.75;
      width = 1.5;
    }
    
    const attrs = { x: left, y, width, height: h,
      fill: e.color, opacity: track.opacity, class: "geotime-band" };
    if (track.outlineWidth > 0) {
      attrs.stroke = track.outlineColor;
      attrs["stroke-width"] = track.outlineWidth;
    }
    C.el("rect", attrs);
    
    if (width > 4 && e.name) {
      const fs = Math.min(11, h * 0.7);
      const maxW = width - 4;
      const txt = fitText(e.name, maxW, fs);
      if (txt) {
        C.el("text", {
          x: left + width / 2, y: y + h / 2 + fs * 0.35,
          "font-size": fs, "text-anchor": "middle",
          "font-weight": "700",
          fill: "#222", "pointer-events": "none", "font-family": C.state.fontFamily
        }).textContent = txt;
      }
    }
  });
}

function drawGeoTrackTitleRect(track, x, y, anchor) {
  if (!track.nameShow || !track.name) return;
  C.el("text", {
    x, y,
    "font-size": track.nameFontSize,
    "font-weight": track.nameBold ? 700 : 400,
    "font-style": track.nameItalic ? 'italic' : 'normal',
    "text-anchor": anchor || "end",
    "dominant-baseline": "middle",
    fill: "#3a4a4a", "font-family": C.state.fontFamily
  }).textContent = track.name;
}

function drawGeoTimeTracks(radial) {
  if (!geoTimeShow || !geoTimeTracks.length) return;
  const st = C.state;
  const root = C.getRoot();
  if (!root) return;
  const leaves = T.visibleLeaves(root);
  if (!leaves.length) return;

  if (radial) { drawGeoTimeTracksRadial(leaves); return; }

  const maxD = Math.max(T.maxDepth(root, 0), 1e-9);
  const treeW = 560 * (st.scaleH || 1);
  const isInv = (st.invert === true || st.invert === "true");
  const ys = leaves.map(l => l.y);
  const yTop = Math.min(...ys) - 20;
  const yBot = Math.max(...ys) + 20;

  const rootPos = root.x;
  const pxPerUnit = treeW / maxD;
  function tickPx(v) {
    const t = st.axisReverse ? (maxD - v) : v;
    return isInv ? (rootPos - t * pxPerUnit) : (rootPos + t * pxPerUnit);
  }
  const tipPos = isInv ? (rootPos - treeW) : (rootPos + treeW);
  let axisLo = Math.min(rootPos, tipPos);
  let axisHi = Math.max(rootPos, tipPos);

  const rl = st.rangeLabelConfig;
  if (rl && rl.show && rl.field) {
    T.allWalk(root, n => {
      if (!hasRealChildren(n)) return;
      const m = (n.meta || []).find(mm => mm.field === rl.field);
      if (m && Array.isArray(m.value) && m.value.length >= 2) {
        const lo = Number(m.value[0]), hi = Number(m.value[1]);
        if (Number.isFinite(lo)) { const x = tickPx(lo); axisLo = Math.min(axisLo, x); axisHi = Math.max(axisHi, x); }
        if (Number.isFinite(hi)) { const x = tickPx(hi); axisLo = Math.min(axisLo, x); axisHi = Math.max(axisHi, x); }
      }
    });
  }
  if (rootPos <= tipPos) {
    axisHi = Math.min(axisHi, tipPos);
  } else {
    axisLo = Math.max(axisLo, tipPos);
  }

  const axisSide = st.axisPos === 'top' ? 'top' : 'bottom';
  const yAxis = axisSide === 'top' ? (yTop - 20) : (yBot + 30);

  const timeToDepth = makeTimeToDepth(geoTimeTracks, maxD);

  const fillBg = C.el("g", { class: "geotime-filltree" });
  C.getSvg().insertBefore(fillBg, C.getSvg().firstChild);
  geoTimeTracks.forEach(track => {
    if (!track.fillTree) return;
    const op = track.fillTreeOpacity != null ? Number(track.fillTreeOpacity) : 0.14;
    track.entries.forEach(e => {
      const v1 = timeToDepth(e.start);
      const v2 = timeToDepth(e.end);
      let px1 = tickPx(v1);
      let px2 = tickPx(v2);
      if (!isFinite(px1) || !isFinite(px2)) return;
      px1 = Math.max(axisLo, Math.min(axisHi, px1));
      px2 = Math.max(axisLo, Math.min(axisHi, px2));
let left = Math.min(px1, px2), width = Math.abs(px2 - px1);
if (width < 1.5) {
  const center = left + width / 2;
  left = center - 0.75;
  width = 1.5;
}
C.el("rect", { x: left, y: yTop, width, height: yBot - yTop,
  fill: e.color, opacity: op, "pointer-events": "none" }, fillBg);
    });
  });

  const sameSide = geoTimeTracks.filter(t => t.position === axisSide);
  const otherSide = geoTimeTracks.filter(t => t.position !== axisSide);
  const sortTracks = arr => arr.slice().sort((a, b) => {
    if (a.fillTree !== b.fillTree) return a.fillTree ? -1 : 1;
    return a.id - b.id;
  });

  const tickSpace = 30;

  let cursorAway, awaySign;
  if (axisSide === 'bottom') { cursorAway = yAxis + tickSpace; awaySign = 1; }
  else { cursorAway = yAxis - tickSpace; awaySign = -1; }

  sortTracks(sameSide).forEach(track => {
    const h = track.height;
    const y = awaySign > 0 ? cursorAway : (cursorAway - h);
    drawGeoTrackRectBand(track, y, tickPx, axisLo, axisHi, timeToDepth);
    drawGeoTrackTitleRect(track, axisLo - 8, y + h / 2, 'end');
    cursorAway = awaySign > 0 ? (y + h + track.gap) : (y - track.gap);
  });

  if (otherSide.length) {
    let cursorIn, inSign;
    if (axisSide === 'bottom') { cursorIn = yAxis - tickSpace; inSign = -1; }
    else { cursorIn = yAxis + tickSpace; inSign = 1; }
    sortTracks(otherSide).forEach(track => {
      const h = track.height;
      const y = inSign > 0 ? cursorIn : (cursorIn - h);
      drawGeoTrackRectBand(track, y, tickPx, axisLo, axisHi, timeToDepth);
      drawGeoTrackTitleRect(track, axisLo - 8, y + h / 2, 'end');
      cursorIn = inSign > 0 ? (y + h + track.gap) : (y - track.gap);
    });
  }
}


function calcRadialInnerBase(root, maxD, maxR) {
  const st = C.state;
  let vMin = 0, vMax = maxD;
  const rl = st.rangeLabelConfig;
  if (rl && rl.show && rl.field) {
    T.allWalk(root, n => {
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

function drawGeoTimeTracksRadial(leaves) {
  const st = C.state;
  const root = C.getRoot();
  const maxD = Math.max(T.maxDepth(root, 0), 1e-9);

  const innerBase = (global.TreeLayout && typeof global.TreeLayout.getRadialInnerBase === 'function')
    ? global.TreeLayout.getRadialInnerBase() : 0;
  const maxR = 285 * (st.scaleH || 1);
  const R_base = innerBase + maxR;

  const cx = 470, cy = 380;
  const isReverse = (st.axisReverse === true || st.axisReverse === "true");
  const baseAngle = Number(st.rotation) || 0;
  const axisAngle = baseAngle + (Number(st.axisRotation) || 0);

  const axisRad = (axisAngle - 90) * Math.PI / 180;
  const ux = Math.cos(axisRad), uy = Math.sin(axisRad);
  const perpRad = (axisAngle - 180) * Math.PI / 180;
  const perpX = Math.cos(perpRad), perpY = Math.sin(perpRad);

  const timeToDepth = makeTimeToDepth(geoTimeTracks, maxD);

  function radiusOfTime(t) {
    const d = timeToDepth(t);
    const vv = isReverse ? (maxD - d) : d;
    return innerBase + maxR * (vv / maxD);
  }

  // 1. 背景填色 (fillTree) - 限制在树的范围内
  const fillBg = C.el("g", { class: "geotime-filltree" });
  C.getSvg().insertBefore(fillBg, C.getSvg().firstChild);
  geoTimeTracks.forEach(track => {
    if (!track.fillTree) return;
    const op = track.fillTreeOpacity != null ? Number(track.fillTreeOpacity) : 0.14;
    track.entries.forEach(e => {
      const r1 = radiusOfTime(e.start);
      const r2 = radiusOfTime(e.end);
      let a = Math.max(innerBase, Math.min(r1, r2));
      let b = Math.min(R_base, Math.max(r1, r2));
      if (b <= a + 1e-9) return;
      if (b - a < 1.5) {
        const center = (a + b) / 2;
        a = Math.max(innerBase, center - 0.75);
        b = Math.min(R_base, center + 0.75);
      }
      C.el("circle", {
        cx, cy, r: (a + b) / 2,
        fill: "none", stroke: e.color,
        "stroke-width": b - a, opacity: op,
        "pointer-events": "none"
      }, fillBg);
    });
  });

  const unifyFs = Math.max(6, Number(st.tickLabelFontSize) || 11);
  const tickLen = 5;
  const labelGap = 4;
  const baseGap = tickLen + labelGap + unifyFs + 6;

  let cursor = baseGap;
  geoTimeTracks.forEach(track => {
    const h = track.height;
    const trackOffset = Number(track.offset) || 0;
    const off1 = cursor + trackOffset;
    const off2 = off1 + h;
    const vertical = track.textOrientation === 'vertical';

    function textRot() {
      let rot;
      if (vertical) rot = axisAngle;
      else rot = axisAngle - 90;
      while (rot > 90) rot -= 180;
      while (rot < -90) rot += 180;
      return rot;
    }

    // 2. 画圆心到根节点 [0, innerBase] 的延伸色带，保证随轴线延长
    if (!isReverse && innerBase > 0.5 && track.entries.length > 0) {
      let innerColor = null;
      let vMinAbs = Infinity;
      track.entries.forEach(e => {
        const d1 = timeToDepth(Number(e.start));
        const d2 = timeToDepth(Number(e.end));
        const vLo = Math.min(d1, d2);
        if (isFinite(vLo) && vLo < vMinAbs) {
          vMinAbs = vLo;
          innerColor = e.color;
        }
      });
      if (innerColor) {
        const p1 = { x: cx + off1 * perpX, y: cy + off1 * perpY };
        const p2 = { x: cx + innerBase * ux + off1 * perpX, y: cy + innerBase * uy + off1 * perpY };
        const p3 = { x: cx + innerBase * ux + off2 * perpX, y: cy + innerBase * uy + off2 * perpY };
        const p4 = { x: cx + off2 * perpX, y: cy + off2 * perpY };
        const extAttrs = {
          points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`,
          fill: innerColor,
          opacity: track.opacity,
          class: "geotime-band geotime-band-ext"
        };
        if (track.outlineWidth > 0) {
          extAttrs.stroke = track.outlineColor;
          extAttrs["stroke-width"] = track.outlineWidth;
        }
        C.el("polygon", extAttrs);
      }
    }

    // 3. 画正常色块（放开 0 的底线，允许延展到圆心）
    track.entries.forEach(e => {
      const r1 = radiusOfTime(e.start);
      const r2 = radiusOfTime(e.end);
      let rLo = Math.max(0, Math.min(r1, r2));
      let rHi = Math.min(R_base, Math.max(r1, r2));
      if (rHi <= rLo + 1e-9) return;
      if (rHi - rLo < 1.5) {
        const center = (rLo + rHi) / 2;
        rLo = Math.max(0, center - 0.75);
        rHi = Math.min(R_base, center + 0.75);
      }

      const p1 = { x: cx + rLo * ux + off1 * perpX, y: cy + rLo * uy + off1 * perpY };
      const p2 = { x: cx + rHi * ux + off1 * perpX, y: cy + rHi * uy + off1 * perpY };
      const p3 = { x: cx + rHi * ux + off2 * perpX, y: cy + rHi * uy + off2 * perpY };
      const p4 = { x: cx + rLo * ux + off2 * perpX, y: cy + rLo * uy + off2 * perpY };

      const attrs = {
        points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`,
        fill: e.color, opacity: track.opacity, class: "geotime-band"
      };
      if (track.outlineWidth > 0) {
        attrs.stroke = track.outlineColor;
        attrs["stroke-width"] = track.outlineWidth;
      }
      C.el("polygon", attrs);

      const isV = track.textOrientation === 'vertical';
      const availLen = isV ? (h - 4) : (rHi - rLo - 4);

      if (availLen > 4 && e.name) {
        const midR = (rLo + rHi) / 2;
        const midOff = (off1 + off2) / 2;
        const tx = cx + midR * ux + midOff * perpX;
        const ty = cy + midR * uy + midOff * perpY;
        const rot = textRot();
        const fs = Math.min(11, h * 0.7);
        const txt = fitText(e.name, availLen, fs);
        if (txt) {
          C.el("text", {
            x: tx, y: ty,
            "font-size": fs, "text-anchor": "middle", "dominant-baseline": "middle",
"font-weight": "700",
            fill: "#222", "pointer-events": "none", "font-family": st.fontFamily,
            transform: `rotate(${rot} ${tx} ${ty})`
          }).textContent = txt;
        }
      }
    });

    if (track.nameShow && track.name) {
      const nameLen = String(track.name || '').length * track.nameFontSize * 0.6;
      const halfAlong = vertical ? track.nameFontSize * 0.5 : nameLen / 2;
      const titleR = R_base + 10 + halfAlong;
      const titlePerp = (off1 + off2) / 2;
      const tx = cx + titleR * ux + titlePerp * perpX;
      const ty = cy + titleR * uy + titlePerp * perpY;
      const rot = textRot();
      C.el("text", {
        x: tx, y: ty,
        "font-size": track.nameFontSize,
        "font-weight": track.nameBold ? 700 : 400,
        "font-style": track.nameItalic ? 'italic' : 'normal',
        "text-anchor": "middle", "dominant-baseline": "middle",
        fill: "#3a4a4a", "font-family": st.fontFamily,
        transform: `rotate(${rot} ${tx} ${ty})`
      }).textContent = track.name;
    }

    cursor += h + track.gap;
  });
}

C.registerSnapshot("ranges", () => ({
  colorRanges: JSON.parse(JSON.stringify(colorRanges)),
  rangeSeq, ringPalette, rangeCover, rangeBorder, rangeBorderColor,
  rangeShowLabels, rangeLabelSize, rangeLabelColor, rangeLabelBold, rangeLabelItalic, rangeLabelOffset, rangeLabelFont,
  rangeLabelTrackShow, rangeLabelTrackWidth, rangeLabelTrackAutoWidth, rangeLabelTrackOffset,
  rangeLabelTrackOpacity, rangeLabelTrackTextOrientation, rangeLabelTrackTitle, rangeLabelTrackTitleShow,
  geoTimeTracks: JSON.parse(JSON.stringify(geoTimeTracks)),
  geoTrackSeq, geoEntrySeq, geoTimeShow, geoScaleFactor
}), s => {
  if (Array.isArray(s.colorRanges)) colorRanges = s.colorRanges;
  if (typeof s.rangeSeq === "number") rangeSeq = s.rangeSeq;
  if (typeof s.ringPalette === "string") ringPalette = s.ringPalette;
  if (typeof s.rangeCover === "string") rangeCover = s.rangeCover;
  if (typeof s.rangeBorder === "number") rangeBorder = s.rangeBorder;
  if (typeof s.rangeBorderColor === "string") rangeBorderColor = s.rangeBorderColor;
  if (typeof s.rangeShowLabels === "boolean") rangeShowLabels = s.rangeShowLabels;
  if (typeof s.rangeLabelSize === "number") rangeLabelSize = s.rangeLabelSize;
  if (typeof s.rangeLabelColor === "string") rangeLabelColor = s.rangeLabelColor;
  if (typeof s.rangeLabelBold === "boolean") rangeLabelBold = s.rangeLabelBold;
  if (typeof s.rangeLabelItalic === "boolean") rangeLabelItalic = s.rangeLabelItalic;
  if (typeof s.rangeLabelOffset === "number") rangeLabelOffset = s.rangeLabelOffset;
  if (typeof s.rangeLabelFont === "string") rangeLabelFont = s.rangeLabelFont;
  if (typeof s.rangeLabelTrackShow === "boolean") rangeLabelTrackShow = s.rangeLabelTrackShow;
  if (typeof s.rangeLabelTrackWidth === "number") rangeLabelTrackWidth = s.rangeLabelTrackWidth;
  if (typeof s.rangeLabelTrackAutoWidth === "boolean") rangeLabelTrackAutoWidth = s.rangeLabelTrackAutoWidth;
  if (typeof s.rangeLabelTrackOffset === "number") rangeLabelTrackOffset = s.rangeLabelTrackOffset;
  if (typeof s.rangeLabelTrackOpacity === "number") rangeLabelTrackOpacity = s.rangeLabelTrackOpacity;
  if (typeof s.rangeLabelTrackTextOrientation === "string") rangeLabelTrackTextOrientation = s.rangeLabelTrackTextOrientation;
  if (typeof s.rangeLabelTrackTitle === "string") rangeLabelTrackTitle = s.rangeLabelTrackTitle;
  if (typeof s.rangeLabelTrackTitleShow === "boolean") rangeLabelTrackTitleShow = s.rangeLabelTrackTitleShow;
  if (Array.isArray(s.geoTimeTracks)) geoTimeTracks = s.geoTimeTracks;
  if (typeof s.geoTrackSeq === "number") geoTrackSeq = s.geoTrackSeq;
  if (typeof s.geoEntrySeq === "number") geoEntrySeq = s.geoEntrySeq;
  if (typeof s.geoTimeShow === "boolean") geoTimeShow = s.geoTimeShow;
  if (typeof s.geoScaleFactor === "number" && s.geoScaleFactor > 0) geoScaleFactor = s.geoScaleFactor;
});

global.TreeRanges = {
  get colorRanges() { return colorRanges; },
  get ringPalette() { return ringPalette; }, set ringPalette(v) { ringPalette = v; },
  get rangeCover() { return rangeCover; }, set rangeCover(v) { rangeCover = v; },
  get rangeBorder() { return rangeBorder; }, set rangeBorder(v) { rangeBorder = v; },
  get rangeBorderColor() { return rangeBorderColor; }, set rangeBorderColor(v) { rangeBorderColor = v; },
  get rangeShowLabels() { return rangeShowLabels; }, set rangeShowLabels(v) { rangeShowLabels = v; },
  get rangeLabelSize() { return rangeLabelSize; }, set rangeLabelSize(v) { rangeLabelSize = v; },
  get rangeLabelColor() { return rangeLabelColor; }, set rangeLabelColor(v) { rangeLabelColor = v; },
  get rangeLabelBold() { return rangeLabelBold; }, set rangeLabelBold(v) { rangeLabelBold = v; },
  get rangeLabelItalic() { return rangeLabelItalic; }, set rangeLabelItalic(v) { rangeLabelItalic = v; },
  get rangeLabelOffset() { return rangeLabelOffset; }, set rangeLabelOffset(v) { rangeLabelOffset = v; },
  get rangeLabelFont() { return rangeLabelFont; }, set rangeLabelFont(v) { rangeLabelFont = v; },
  get rangeLabelTrackShow() { return rangeLabelTrackShow; }, set rangeLabelTrackShow(v) { rangeLabelTrackShow = v; },
  get rangeLabelTrackWidth() { return rangeLabelTrackWidth; }, set rangeLabelTrackWidth(v) { rangeLabelTrackWidth = v; },
  get rangeLabelTrackAutoWidth() { return rangeLabelTrackAutoWidth; }, set rangeLabelTrackAutoWidth(v) { rangeLabelTrackAutoWidth = v; },
  get rangeLabelTrackOffset() { return rangeLabelTrackOffset; }, set rangeLabelTrackOffset(v) { rangeLabelTrackOffset = v; },
  get rangeLabelTrackOpacity() { return rangeLabelTrackOpacity; }, set rangeLabelTrackOpacity(v) { rangeLabelTrackOpacity = v; },
  get rangeLabelTrackTextOrientation() { return rangeLabelTrackTextOrientation; }, set rangeLabelTrackTextOrientation(v) { rangeLabelTrackTextOrientation = v; },
  get rangeLabelTrackTitle() { return rangeLabelTrackTitle; }, set rangeLabelTrackTitle(v) { rangeLabelTrackTitle = v; },
  get rangeLabelTrackTitleShow() { return rangeLabelTrackTitleShow; }, set rangeLabelTrackTitleShow(v) { rangeLabelTrackTitleShow = v; },
  get rangeSeq() { return rangeSeq; }, set rangeSeq(v) { rangeSeq = v; },
  get geoTimeTracks() { return geoTimeTracks; },
  get geoTimeShow() { return geoTimeShow; }, set geoTimeShow(v) { geoTimeShow = v; },
  get geoTrackSeq() { return geoTrackSeq; }, set geoTrackSeq(v) { geoTrackSeq = v; },
  get geoEntrySeq() { return geoEntrySeq; }, set geoEntrySeq(v) { geoEntrySeq = v; },
  get geoScaleFactor() { return geoScaleFactor; }, set geoScaleFactor(v) { geoScaleFactor = (Number(v) > 0) ? Number(v) : 1; },
  getGeoExtra,

  GEO_LEVELS, GEO_LEVEL_LABELS, GEO_FALLBACK,
  addGeoTrack, removeGeoTrack, addGeoEntry, removeGeoEntry, importGeoPreset,
  drawGeoTimeTracks, loadGeoPresetData,
  RING_PALETTES, paletteColor, recolorRangesByPalette,
  rangeById, rangeMembers, clearAllColorRanges, rectangularRangeSegments, rangePaint,
  drawRectangularRanges, drawColoredRanges, renderRangesPanel, removeRange,
  drawRectangularRangeLabelTrack, drawRadialRangeLabelTrack,
  openRangeModal,
  applyOneGroup, lcaOfLeaves, applyGroupsByColumn,
  applyLeafLabelColumn, resetLeafLabels
};

let customTracks = [];
let trackSeq = 0;
let trackCommon = {
  legendTitleShow: true, legendFontSize: 30, legendBold: false, legendItalic: false,
  legendTitleFontSize: 12, legendTitleBold: true, legendTitleItalic: false,
  trackGap: 50, legendMaxPerRow: 0, legendScale: 1,
  trackNameShow: true, trackNameFontSize: 11, trackNameBold: true,
  trackNameItalic: false, trackNameAngle: -45
};
const TRACK_TYPE_LABEL_KEYS = {
  colorstrip: 'trackTypeColorstrip',
  binary: 'trackTypeBinary',
  heatstrip: 'trackTypeHeatstrip',
  bar: 'trackTypeBar',
  text: 'trackTypeText',
  multisymbol: 'trackTypeMultisymbol',
  stackedbar: 'trackTypeStackedbar',
  pie: 'trackTypePie'
};

function trackTypeLabel(type) {
  const k = TRACK_TYPE_LABEL_KEYS[type];
  return k ? I.t(k) : type;
}

const TRACK_SHAPES = ['square','triangle','circle','star','diamond2'];

function trackDefaultName(type, column) {
  return column ? column : trackTypeLabel(type);
}

function newTrackDefaults(type) {
  return {
    id: ++trackSeq, type, name: '',
    column: '', columns: [], colorColumn: '', shapeColumn: '',
    collapsed: false, offset: 0, offsetX: 0, width: 0,
    palette: 'tableau10',
    borderColor: '#ffffff', borderWidth: 0,
    showBorder: true, mergeGroups: false, customColors: {},
    shape: 'square', outlineColor: '#333333', outlineWidth: 1,
    fill0: '#ffffff', fill1: '#E64B35',
    binaryLogic: 'eq', binaryValue: '',
    binaryTrueColor: '#E64B35', binaryFalseColor: '#cccccc',
    binaryShowFalse: false,
    gradient: 'Viridis', gradientMin: null, gradientMax: null, gradientReverse: false, gradientStops: null,
    barColor: '#4DBBD5',
    barOutlineColor: '#333333', barOutlineWidth: 0, barOutlineDashed: false,
    boxColor: '#bbbbbb', boxWidth: 0.5, boxDashed: false, showBox: false,
    barLength: 100, barWidth: 0, showValues: true, showAxisNumbers: true,
    refLines: [], axisMin: null, axisMax: null, axisInterval: null,
    textBold: false, textItalic: false, textFontSize: 10, textAlign: 'left',
    textOrientation: 'horizontal', textAutoWidth: false,
    fillOpacity: 1, showText: false, textColor: '#333333',
    uniformShape: 'square', shapeMap: {}, columnColors: {}, percentMode: false, pieRadius: 9,
    showLegend: true, legendTitle: '', legendOrientation: 'horizontal',
    legendX: null, legendY: null,
    _colorCache: null, _shapeCache: null
  };
}

function getLeafData() { return global.TreeApp && global.TreeApp.leafData; }
function datasetValue(ds, leaf) {
  if (!ds || !ds.data) return null;
  const v = ds.data[T.labelOf(leaf)];
  if (v != null) return v;
  return ds.data[leaf.name];
}
function buildTrackData(column) {
  const ld = getLeafData(); const data = {};
  if (!ld || !ld.rows || !column) return data;
  ld.rows.forEach(r => {
    const k = String(r.Leaf || '').trim(); if (!k) return;
    const v = r[column];
    if (v === undefined || v === null || v === '') return;
    data[k] = v;
  });
  return data;
}
function buildMultiTrackData(columns) {
  const ld = getLeafData(); const data = {};
  if (!ld || !ld.rows || !columns || !columns.length) return data;
  ld.rows.forEach(r => {
    const k = String(r.Leaf || '').trim(); if (!k) return;
    const vals = columns.map(c => parseFloat(r[c])).filter(Number.isFinite);
    if (vals.length) data[k] = vals.join(',');
  });
  return data;
}
function refreshTrackData(t) {
  if (!t) return;
  if (t.type === 'stackedbar' || t.type === 'pie') t.data = buildMultiTrackData(t.columns);
  else if (t.type === 'multisymbol') t.data = buildTrackData(t.column || t.shapeColumn);
  else t.data = buildTrackData(t.column);
  t._colorCache = null; t._shapeCache = null;
}
function defaultLegendTitle(t) {
  if (!t) return '';
  if (t.type === 'stackedbar' || t.type === 'pie') return (t.columns && t.columns[0]) || '';
  if (t.type === 'multisymbol') return t.column || t.shapeColumn || '';
  return t.column || '';
}
function addCustomTrack(cfg) {
  const t = newTrackDefaults(cfg.type || 'colorstrip');
  Object.assign(t, cfg);
  if (t.type === 'multisymbol' && !t.column && t.shapeColumn) t.column = t.shapeColumn;
  refreshTrackData(t);
  t.base = t.barColor || t.fill1 || '#4DBBD5';
  if (!t.legendTitle) t.legendTitle = defaultLegendTitle(t);
  customTracks.push(t);
  return t;
}
function updateCustomTrack(id, patch) {
  const t = customTracks.find(x => x.id === id); if (!t) return;
  const oldDefault = defaultLegendTitle(t);
  const titleWasDefault = !t.legendTitle || t.legendTitle === oldDefault;
  Object.assign(t, patch);
  if (['column','columns','shapeColumn','colorColumn'].some(k => k in patch)) {
    refreshTrackData(t);
    if (titleWasDefault) t.legendTitle = defaultLegendTitle(t);
  }
  if (patch.palette || patch.customColors) t._colorCache = null;
}
function removeCustomTrack(id) { customTracks = customTracks.filter(x => x.id !== id); }
function toggleCustomTrack(id) { const t = customTracks.find(x => x.id === id); if (t) t.collapsed = !t.collapsed; }

function collectUniqueValues(t) {
  const out = []; const seen = new Set();
  const leaves = T.visibleLeaves(C.getRoot());
  const add = v => { const s = String(v); if (!seen.has(s)) { seen.add(s); out.push(s); } };
  leaves.forEach(l => {
    const raw = datasetValue(t, l);
    if (raw == null || raw === '') return;
    if (t.type === 'multisymbol') add(String(raw));
    else if (t.type !== 'stackedbar' && t.type !== 'pie') add(String(raw).split(',')[0]);
  });
  return out;
}
function getTrackColorMap(t) {
  if (t._colorCache) return t._colorCache;
  const pal = global.TreePalette.getCategoricalScheme(t.palette || 'tableau10');
  const cache = {};
  const uniq = collectUniqueValues(t);
  uniq.forEach((v, i) => { cache[v] = (t.customColors && t.customColors[v]) || pal[i % pal.length]; });
  t._colorCache = cache; return cache;
}
function colorOf(track, value, colorMap) {
  const v = String(value);
  return (track.customColors && track.customColors[v]) || colorMap[v] || '#cccccc';
}
function computeTrackWidth(track, opts) {
  opts = opts || {};
  if (!opts.radial && track.type === 'colorstrip' && track.textAutoWidth && track.showText) {
    const ld = getLeafData();
    let maxW = 40;
    if (ld && ld.rows && track.column) {
      const seen = new Set();
      ld.rows.forEach(r => {
        const v = r[track.column]; if (v == null || v === '') return;
        const s = String(v); if (seen.has(s)) return; seen.add(s);
        const tw = estimateTextWidth(s, Number(track.textFontSize) || 10);
        if (tw > maxW) maxW = tw;
      });
    }
    return Math.max(20, Math.ceil(maxW + 16));
  }
  if (Number(track.width) > 0) return Number(track.width);
  switch (track.type) {
    case 'colorstrip': return 20;
    case 'heatstrip': return 20;
    case 'binary': return 22;
    case 'bar': return 100;
    case 'text': return 96;
    case 'multisymbol': return 22;
    case 'stackedbar': return 80;
    case 'pie': return 30;
    default: return 22;
  }
}
function drawTrackSymbol(shape, cx, cy, s, fill, stroke, sw, parent) {
  const attrs = { fill };
  if (stroke && sw > 0) { attrs.stroke = stroke; attrs['stroke-width'] = sw; }
  if (shape === 'square') return C.el('rect', { x: cx-s, y: cy-s, width: s*2, height: s*2, ...attrs }, parent);
  if (shape === 'triangle') return C.el('polygon', { points: `${cx},${cy-s} ${cx+s},${cy+s} ${cx-s},${cy+s}`, ...attrs }, parent);
  if (shape === 'star') {
    let pts = '';
    for (let i = 0; i < 10; i++) { const r = i%2 ? s*0.45 : s; const a = (-90 + i*36) * Math.PI/180; pts += `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)} `; }
    return C.el('polygon', { points: pts.trim(), ...attrs }, parent);
  }
  if (shape === 'diamond2' || shape === 'diamond') return C.el('polygon', { points: `${cx},${cy-s} ${cx+s},${cy} ${cx},${cy+s} ${cx-s},${cy}`, ...attrs }, parent);
  return C.el('circle', { cx, cy, r: s, ...attrs }, parent);
}
function getGradientStops(track) {
  if (Array.isArray(track.gradientStops) && track.gradientStops.length >= 2) return track.gradientStops.slice();
  return global.TreePalette.getContinuousColors(track.gradient || 'Viridis', 9);
}
function sampleTrackColor(track, t) {
  const stops = getGradientStops(track);
  t = Math.max(0, Math.min(1, t));
  if (stops.length === 2) return global.TreePalette.mixColor(stops[0], stops[1], t);
  return global.TreePalette.sampleStops(stops, t);
}
function evalBinaryLogic(track, v) {
  const logic = track.binaryLogic || 'eq';
  const s = String(v).trim(); const n = parseFloat(s);
  const tv = parseFloat(track.binaryValue);
  const ts = String(track.binaryValue == null ? '' : track.binaryValue).trim();
  switch (logic) {
    case 'gt': return Number.isFinite(n) && Number.isFinite(tv) && n > tv;
    case 'gte': return Number.isFinite(n) && Number.isFinite(tv) && n >= tv;
    case 'lt': return Number.isFinite(n) && Number.isFinite(tv) && n < tv;
    case 'lte': return Number.isFinite(n) && Number.isFinite(tv) && n <= tv;
    case 'eq': return s === ts || (Number.isFinite(n) && Number.isFinite(tv) && n === tv);
    case 'ne': return !(s === ts || (Number.isFinite(n) && Number.isFinite(tv) && n === tv));
    case 'truthy': return /^(1|true|yes|y|t)$/i.test(s);
    case 'falsy': return /^(0|false|no|n|f)$/i.test(s);
    case 'contains': return s.includes(ts);
    case 'startswith': return s.startsWith(ts);
    case 'endswith': return s.endsWith(ts);
    default: return false;
  }
}

function drawOneTrack(track, x, w, leaves, rowH, rowBounds, invert) {
  const colorMap = getTrackColorMap(track);
  const ff = fontFam();
  const border = Number(track.borderWidth) > 0 && track.showBorder !== false;
  const stroke = border ? (track.borderColor || '#333') : 'none';
  const sw = border ? Number(track.borderWidth) : 0;
  const rowOf = l => (rowBounds && rowBounds.get(l)) || { top: l.y - rowH/2, bottom: l.y + rowH/2 };
  if (track.type === 'colorstrip') {
    const fillOpacity = track.fillOpacity != null ? Number(track.fillOpacity) : 1;
    const showText = !!track.showText;
    const fontSize = Number(track.textFontSize) || 10;
    const textColor = track.textColor || '#333333';
    const bold = track.textBold ? 700 : 400;
    const italic = track.textItalic ? 'italic' : 'normal';
    const vertical = track.textOrientation === 'vertical';
    const drawBlock = (top, bottom, value) => {
      C.el("rect", { x, y: top, width: w, height: Math.max(1, bottom - top),
        fill: colorOf(track, value, colorMap), opacity: fillOpacity, stroke, "stroke-width": sw });
      if (showText && value != null && value !== '') {
        const cy = (top + bottom) / 2;
        const cx = x + w / 2;
        const attrs = { x: cx, y: cy, "text-anchor": "middle", "dominant-baseline": "middle",
          "font-size": fontSize, "font-weight": bold, "font-style": italic,
          fill: textColor, "font-family": ff, "pointer-events": "none" };
        if (vertical) attrs.transform = `rotate(-90 ${cx} ${cy})`;
        C.el("text", attrs).textContent = String(value);
      }
    };
    if (track.mergeGroups) {
      const ordered = [...leaves].sort((a,b) => a.y - b.y);
      let curV = null, curTop = 0, curBot = 0;
      const segs = [];
      ordered.forEach(l => {
        const v = datasetValue(track, l);
        const row = rowOf(l);
        if (v == null || v === '') { if (curV !== null) { segs.push({ v: curV, top: curTop, bot: curBot }); curV = null; } return; }
        if (String(v) !== curV) {
          if (curV !== null) segs.push({ v: curV, top: curTop, bot: curBot });
          curV = String(v); curTop = row.top; curBot = row.bottom;
        } else curBot = row.bottom;
      });
      if (curV !== null) segs.push({ v: curV, top: curTop, bot: curBot });
      segs.forEach(s => drawBlock(s.top, s.bot, s.v));
    } else {
      leaves.forEach(l => {
        const v = datasetValue(track, l);
        if (v == null || v === '') return;
        const row = rowOf(l);
        drawBlock(row.top, row.bottom, v);
      });
    }
  } else if (track.type === 'heatstrip') {
    const nums = leaves.map(l => parseFloat(datasetValue(track, l))).filter(Number.isFinite);
    let mn = track.gradientMin, mx = track.gradientMax;
    if (!Number.isFinite(mn)) mn = Math.min(...nums);
    if (!Number.isFinite(mx)) mx = Math.max(...nums);
    if (mn === mx) mx = mn + 1;
    leaves.forEach(l => {
      const v = parseFloat(datasetValue(track, l)); if (!Number.isFinite(v)) return;
      let t = (v - mn) / (mx - mn);
      if (track.gradientReverse) t = 1 - t;
      const fill = sampleTrackColor(track, t);
      const row = rowOf(l);
      C.el("rect", { x, y: row.top, width: w, height: row.bottom - row.top, fill, stroke, "stroke-width": sw });
    });
  } else if (track.type === 'binary') {
    leaves.forEach(l => {
      const v = datasetValue(track, l);
      if (v == null || v === '') return;
      const ok = evalBinaryLogic(track, v);
      if (!ok && !track.binaryShowFalse) return;
      const fill = ok ? track.binaryTrueColor : track.binaryFalseColor;
      const row = rowOf(l);
      const cy = (row.top + row.bottom) / 2;
      const size = Math.min(row.bottom - row.top, w) * 0.42;
      drawTrackSymbol(track.shape || 'square', x + w/2, cy, size, fill, track.outlineColor, track.outlineWidth);
    });
  } else if (track.type === 'bar') {
    drawBarTrackAdvanced(track, x, w, leaves, rowOf, invert);
  } else if (track.type === 'text') {
    const align = track.textAlign || 'left';
    const actualAlign = invert ? (align === 'left' ? 'right' : align === 'right' ? 'left' : 'center') : align;
    const fs = Number(track.textFontSize) || 10;
    const italic = track.textItalic ? 'italic' : 'normal';
    leaves.forEach(l => {
      const v = datasetValue(track, l);
      if (v == null || v === '') return;
      const txt = String(v);
      const fill = colorOf(track, txt, colorMap);
      const t = C.el('text', {
        x: actualAlign === 'left' ? x + 2 : actualAlign === 'right' ? x + w - 2 : x + w/2,
        y: l.y + fs * 0.34,
        'font-size': fs, 'font-weight': track.textBold ? 700 : 400,
        'font-style': italic, 'font-family': ff,
        'text-anchor': actualAlign === 'left' ? 'start' : actualAlign === 'right' ? 'end' : 'middle',
        fill
      });
      t.textContent = txt;
    });
  } else if (track.type === 'multisymbol') {
    leaves.forEach(l => {
      const v = datasetValue(track, l);
      if (v == null || v === '') return;
      const key = String(v);
      const shape = (track.shapeMap && track.shapeMap[key]) || track.uniformShape || 'square';
      const fill = colorOf(track, key, colorMap);
      const row = rowOf(l);
      const cy = (row.top + row.bottom) / 2;
      const size = Math.min(row.bottom - row.top, w) * 0.42;
      drawTrackSymbol(shape, x + w/2, cy, size, fill, track.outlineColor, track.outlineWidth || 0);
    });
  } else if (track.type === 'stackedbar') {
    drawStackedBarAdvanced(track, x, w, leaves, rowOf, invert);
  } else if (track.type === 'pie') {
    const cols = global.TreePalette.getCategoricalScheme(track.palette || 'tableau10');
    const colorFor = (col, i) => (track.columnColors && track.columnColors[col]) || cols[i % cols.length];
    leaves.forEach(l => {
      const raw = datasetValue(track, l);
      if (raw == null || raw === '') return;
      const vals = String(raw).split(',').map(parseFloat).filter(Number.isFinite);
      if (!vals.length) return;
      const row = rowOf(l);
      const cy = (row.top + row.bottom) / 2;
      const h = Math.min(row.bottom - row.top, 24);
      const tot = vals.reduce((a, b) => a + Math.max(0, b), 0) || 1;
      const r = Math.max(2, Math.min(h/2, Number(track.pieRadius) || 9));
      let a0 = -90;
      vals.forEach((v, i) => {
        const frac = Math.max(0, v) / tot;
        const a1 = a0 + frac * 360;
        if (frac >= 0.999) { C.el('circle', { cx: x + w/2, cy, r, fill: colorFor(track.columns[i], i) }); return; }
        const p0 = L.polar(x + w/2, cy, r, a0);
        const p1 = L.polar(x + w/2, cy, r, a1);
        const large = (a1 - a0) > 180 ? 1 : 0;
        C.el('path', { d: `M ${x+w/2} ${cy} L ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y} Z`, fill: colorFor(track.columns[i], i) });
        a0 = a1;
      });
    });
  }
}

function barDomain(track, leaves, percent) {
  const allVals = leaves.map(l => {
    const raw = datasetValue(track, l); if (raw == null) return [];
    return String(raw).split(',').map(parseFloat).filter(Number.isFinite);
  });
  const isStack = track.type === 'stackedbar';
  const sums = allVals.map(v => v.reduce((a, b) => a + Math.max(0, b), 0));
  const flat = allVals.flat();
  let mn = track.axisMin, mx = track.axisMax;
  if (percent && isStack) { mn = Number.isFinite(mn) ? mn : 0; mx = Number.isFinite(mx) ? mx : 100; }
  else {
    if (!Number.isFinite(mn)) mn = Math.min(0, ...(isStack ? sums : flat));
    if (!Number.isFinite(mx)) mx = Math.max(...(isStack ? sums : flat));
  }
  if (mn === mx) mx = mn + 1;
  return { mn, mx };
}

function drawStackedBarAdvanced(track, x, w, leaves, rowOf, invert) {
  const { mn, mx } = barDomain(track, leaves, track.percentMode);
  const range = mx - mn || 1;
  const pos = v => invert ? (x + w - (v - mn) / range * w) : (x + (v - mn) / range * w);
  const cols = global.TreePalette.getCategoricalScheme(track.palette || 'tableau10');
  const colorFor = (col, i) => (track.columnColors && track.columnColors[col]) || cols[i % cols.length];
  const yTop = Math.min(...leaves.map(l => rowOf(l).top));
  const yBottom = Math.max(...leaves.map(l => rowOf(l).bottom));
  const sampleRow = rowOf(leaves[0]);
  const rowHeight = sampleRow.bottom - sampleRow.top;
  const h = Math.min(rowHeight, track.barWidth || 12);
  leaves.forEach(l => {
    const raw = datasetValue(track, l);
    if (raw == null || raw === '') return;
    let vals = String(raw).split(',').map(parseFloat).filter(Number.isFinite);
    if (!vals.length) return;
    if (track.percentMode) {
      const tot0 = vals.reduce((a, b) => a + Math.max(0, b), 0) || 1;
      vals = vals.map(v => Math.max(0, v) / tot0 * 100);
    }
    const row = rowOf(l);
    const cy = (row.top + row.bottom) / 2;
    let cursor = pos(mn);
    let cum = 0;
    vals.forEach((v, i) => {
      const nextVal = cum + Math.max(0, v);
      const nextPos = pos(mn + nextVal);
      const segStart = Math.min(cursor, nextPos);
      const segWidth = Math.abs(nextPos - cursor);
      C.el('rect', { x: segStart, y: cy - h/2, width: Math.max(0, segWidth), height: h, fill: colorFor(track.columns[i], i) });
      cursor = nextPos; cum = nextVal;
    });
  });
  const ff = fontFam();
  const fs = Math.max(6, Number(trackCommon.legendFontSize) || 10);
  if (track.showBox) {
    const yAxis = yBottom + 24 + fs;
    C.el('rect', { x, y: yTop, width: w, height: yAxis - yTop, fill: 'none',
      stroke: track.boxColor || '#bbb',
      'stroke-width': Number(track.boxWidth) || 0.5,
      'stroke-dasharray': track.boxDashed ? '4 3' : '' });
  }
  const yAxis = yBottom + 6;
  C.el('line', { x1: x, y1: yAxis, x2: x + w, y2: yAxis, stroke: '#333', 'stroke-width': 0.8 });
  const baseX = pos(mn);
  C.el('line', { x1: baseX, y1: yTop, x2: baseX, y2: yAxis, stroke: '#333', 'stroke-width': 0.8 });
  if (track.showAxisNumbers) {
    const interval = track.axisInterval || (mx - mn) / 5;
    const ticks = [];
    const start = Math.ceil(mn / interval) * interval;
    for (let v = start; v <= mx + 1e-9; v += interval) ticks.push(v);
    ticks.forEach(v => {
      const px = pos(v);
      C.el('line', { x1: px, y1: yAxis, x2: px, y2: yAxis + 3, stroke: '#555', 'stroke-width': 0.8 });
      const t = C.el('text', { x: px, y: yAxis + fs + 4, 'font-size': fs, 'text-anchor': 'middle', fill: '#333', 'font-family': ff });
      t.textContent = track.percentMode ? v.toFixed(0) + '%' : Number(v.toFixed(2));
    });
  }
}

function drawBarTrackAdvanced(track, x, w, leaves, rowOf, invert) {
  const { mn, mx } = barDomain(track, leaves, false);
  const range = mx - mn || 1;
  const pos = v => invert ? (x + w - (v - mn) / range * w) : (x + (v - mn) / range * w);
  const ff = fontFam();
  const yTop = Math.min(...leaves.map(l => rowOf(l).top));
  const yBottom = Math.max(...leaves.map(l => rowOf(l).bottom));
  const sampleRow = rowOf(leaves[0]);
  const rowHeight = sampleRow.bottom - sampleRow.top;
  const barW = Math.max(1, Math.min(Number(track.barWidth) || rowHeight * 0.6, 40));
  const fs = Math.max(6, Number(trackCommon.legendFontSize) || 10);
  if (track.showBox) {
    const yAxis = yBottom + 24 + fs;
    C.el('rect', { x, y: yTop, width: w, height: yAxis - yTop, fill: 'none',
      stroke: track.boxColor || '#bbb',
      'stroke-width': Number(track.boxWidth) || 0.5,
      'stroke-dasharray': track.boxDashed ? '4 3' : '' });
  }
  leaves.forEach(l => {
    const v = parseFloat(datasetValue(track, l)); if (!Number.isFinite(v)) return;
    const vx = pos(v);
    const baseX = pos(mn);
    const barLen = Math.abs(vx - baseX);
    const rectX = Math.min(vx, baseX);
    C.el('rect', { x: rectX, y: l.y - barW/2, width: Math.max(0.5, barLen), height: barW,
      fill: track.barColor,
      stroke: track.barOutlineWidth > 0 ? track.barOutlineColor : 'none',
      'stroke-width': track.barOutlineWidth || 0,
      'stroke-dasharray': (track.barOutlineWidth > 0 && track.barOutlineDashed) ? '4 3' : '' });
    if (track.showValues) {
      const textX = invert ? (vx - 4) : (vx + 4);
      const t = C.el('text', { x: textX, y: l.y + fs * 0.34, 'font-size': fs,
        fill: '#333', 'font-weight': trackCommon.legendBold ? 700 : 400,
        'text-anchor': invert ? 'end' : 'start', 'font-family': ff });
      t.textContent = Number(v).toFixed(2);
    }
  });
  const yAxis = yBottom + 6;
  C.el('line', { x1: x, y1: yAxis, x2: x + w, y2: yAxis, stroke: '#333', 'stroke-width': 0.8 });
  const baseX = pos(mn);
  C.el('line', { x1: baseX, y1: yTop, x2: baseX, y2: yAxis, stroke: '#333', 'stroke-width': 0.8 });
  if (track.showAxisNumbers) {
    const interval = track.axisInterval || (mx - mn) / 5;
    const ticks = [];
    const start = Math.ceil(mn / interval) * interval;
    for (let v = start; v <= mx + 1e-9; v += interval) ticks.push(v);
    ticks.forEach(v => {
      const px = pos(v);
      C.el('line', { x1: px, y1: yAxis, x2: px, y2: yAxis + 3, stroke: '#555', 'stroke-width': 0.8 });
      const t = C.el('text', { x: px, y: yAxis + fs + 4, 'font-size': fs, 'text-anchor': 'middle', fill: '#333', 'font-family': ff });
      t.textContent = Number(v.toFixed(2));
    });
  }
  (track.refLines || []).forEach(rl => {
    if (!Number.isFinite(Number(rl.value))) return;
    const px = pos(Number(rl.value));
    C.el('line', { x1: px, y1: yTop, x2: px, y2: yBottom,
      stroke: rl.color || '#e74c3c', 'stroke-width': Number(rl.width) || 1,
      'stroke-dasharray': rl.dashed ? '4 3' : '' });
  });
}

function drawTrackLegend(track, x, y, colorMap) {
  if (!track.showLegend) return 0;
  const tc = trackCommon;
  const ff = fontFam();
  const scale = tc.legendScale || 1;
  const fs = Math.max(6, Number(tc.legendFontSize) || 11) * scale;
  const bold = tc.legendBold ? 700 : 400;
  const italic = tc.legendItalic ? 'italic' : 'normal';
  const titleFS = Math.max(6, Number(tc.legendTitleFontSize) || 12) * scale;
  const titleBold = tc.legendTitleBold ? 700 : 400;
  const titleItalic = tc.legendTitleItalic ? 'italic' : 'normal';
  const title = (tc.legendTitleShow && track.legendTitle) ? String(track.legendTitle) : '';
  const maxPerRow = Math.max(0, Number(tc.legendMaxPerRow) || 0);
  let items = [];
  let drawAsSymbol = false;
  if (track.type === 'multisymbol') {
    drawAsSymbol = true;
    items = collectUniqueValues(track).map(v => ({
      label: v, color: colorOf(track, v, colorMap),
      shape: (track.shapeMap && track.shapeMap[v]) || track.uniformShape || 'square'
    }));
  } else if (track.type === 'colorstrip' || track.type === 'text') {
    items = collectUniqueValues(track).map(v => ({ label: v, color: colorOf(track, v, colorMap) }));
  } else if (track.type === 'binary') {
    items = [{ label: 'True', color: track.binaryTrueColor }, { label: 'False', color: track.binaryFalseColor }];
  } else if (track.type === 'stackedbar' || track.type === 'pie') {
    const cols = global.TreePalette.getCategoricalScheme(track.palette || 'tableau10');
    items = (track.columns || []).map((c, i) => ({ label: c, color: (track.columnColors && track.columnColors[c]) || cols[i % cols.length] }));
  } else if (track.type === 'heatstrip') {
    const nums = Object.values(track.data || {}).map(parseFloat).filter(Number.isFinite);
    let mn = track.gradientMin, mx = track.gradientMax;
    if (!Number.isFinite(mn)) mn = Math.min(...nums);
    if (!Number.isFinite(mx)) mx = Math.max(...nums);
    if (mn === mx) mx = mn + 1;
    const isVertical = track.legendOrientation === 'vertical';
    const stops = getGradientStops(track);
    const gid = 'tkl-grad-' + track.id + '-' + Math.random().toString(36).slice(2, 8);
    const defs = C.getSvg().querySelector('defs') || C.el('defs');
    const grad = C.el('linearGradient', { id: gid,
      x1: isVertical ? '0%' : '0%', y1: isVertical ? '100%' : '0%',
      x2: isVertical ? '0%' : '100%', y2: isVertical ? '0%' : '0%' }, defs);
    stops.forEach((c, i) => C.el('stop', { offset: (i / (stops.length-1) * 100) + '%', 'stop-color': c }, grad));
    const barW = (isVertical ? 12 : 80) * scale;
    const barH = (isVertical ? 80 : 12) * scale;
    const g = C.el('g', { class: 'track-legend legend-box', 'data-legend': '1', 'data-track-id': track.id, style: 'cursor:move', transform: `translate(${x} ${y})` });
    let cursorY = 0;
    if (title) {
      const tt = C.el('text', { x: 0, y: titleFS, 'font-size': titleFS, 'font-weight': titleBold, 'font-style': titleItalic, fill: '#333', 'font-family': ff }, g);
      tt.textContent = title; cursorY = titleFS + 4;
    }
    C.el('rect', { x: 0, y: cursorY, width: barW, height: barH, fill: `url(#${gid})`, stroke: '#999', 'stroke-width': 0.5 }, g);
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      const val = mx - (mx - mn) * t;
      const text = C.el('text', { x: isVertical ? barW + 4 : t * barW,
        y: isVertical ? cursorY + t * barH + fs * 0.34 : cursorY + barH + fs + 3,
        'font-size': fs, 'font-weight': bold, 'font-style': italic, fill: '#333',
        'font-family': ff, 'text-anchor': isVertical ? 'start' : 'middle' }, g);
      text.textContent = Number(val).toFixed(2);
    }
    return cursorY + barH + fs + 8;
  }
  if (!items.length) return 0;
  const g = C.el('g', { class: 'track-legend legend-box', 'data-legend': '1', 'data-track-id': track.id, style: 'cursor:move', transform: `translate(${x} ${y})` });
  let xx = 0, yy = 0, rowItems = 0;
  if (title) {
    const tt = C.el('text', { x: 0, y: titleFS, 'font-size': titleFS, 'font-weight': titleBold, 'font-style': titleItalic, fill: '#333', 'font-family': ff }, g);
    tt.textContent = title; yy = titleFS + 6;
  }

  let maxItemW = 0;
  items.forEach(it => {
    const w = fs + 8 + it.label.length * fs * 0.6;
    if (w > maxItemW) maxItemW = w;
  });

  items.forEach(it => {
    const wItem = fs + 8 + it.label.length * fs * 0.6;
    if (maxPerRow > 0 && rowItems >= maxPerRow) { xx = 0; yy += fs + 6; rowItems = 0; }
    if (drawAsSymbol) {
      drawTrackSymbol(it.shape, xx + fs / 2, yy + fs / 2, fs * 0.45, it.color, track.outlineColor, track.outlineWidth || 0, g);
    } else {
      C.el('rect', { x: xx, y: yy, width: fs, height: fs, fill: it.color, rx: 2 }, g);
    }
    const t = C.el('text', { x: xx + fs + 4, y: yy + fs * 0.85, 'font-size': fs, 'font-weight': bold, 'font-style': italic, fill: '#333', 'font-family': ff }, g);
    t.textContent = it.label;
    
    const stepW = (maxPerRow > 0) ? maxItemW : wItem;
    xx += stepW + 8; rowItems++;
  });
  return yy + fs + 8;
}

function renderCustomTracks(radial) {
  const st = C.state;
  const leaves = T.visibleLeaves(C.getRoot());
  if (!leaves.length) return;
  const tc = trackCommon;
  const gap = Math.max(0, Number(tc.trackGap) || 0);
  const ff = fontFam();
  if (!radial) {
    const ys = leaves.map(l => l.y);
    const rowH = leaves.length > 1 ? (Math.max(...ys) - Math.min(...ys)) / (leaves.length - 1) : 24;
    const rowBounds = T.leafRowBounds(leaves, Math.max(14, st.fontSize * 1.05) * (st.scaleV || 1));
    const isInv = (st.invert === true || st.invert === "true");
    let xBase;
    if (isInv) {
      let labelLeft = Infinity;
      C.getSvg().querySelectorAll(".leaf-label").forEach(label => {
        try { const b = label.getBBox(); labelLeft = Math.min(labelLeft, b.x - 6); } catch (_) {}
      });
      if (!isFinite(labelLeft)) labelLeft = C.alignedLabelX() - C.maxTextWidth - 20;
      xBase = labelLeft - 16;
    } else {
      xBase = N.labelRightEdge() + 16;
    }
    if (global.TreeRanges && global.TreeRanges.colorRanges.length && global.TreeRanges.rangeLabelTrackShow) {
      xBase = global.TreeRanges.drawRectangularRangeLabelTrack(xBase, leaves, isInv);
    }
    const nameFs = Number(tc.trackNameFontSize) || 11;
    const trackNameAngle = (tc.trackNameAngle != null) ? Number(tc.trackNameAngle) : -45;
    const angleRad = trackNameAngle * Math.PI / 180;
    let maxNameWidth = 0;
    customTracks.forEach(t => {
      if (t.name) { const w = estimateTextWidth(t.name, nameFs); if (w > maxNameWidth) maxNameWidth = w; }
    });
    const lowestOffset = Math.abs((maxNameWidth / 2) * Math.sin(angleRad)) + Math.abs((nameFs / 2) * Math.cos(angleRad));
    const titleY = Math.min(...ys) - rowH * 0.85 - lowestOffset - 8;
    const placed = [];
    customTracks.forEach(track => {
      const w = computeTrackWidth(track);
      let x;
      if (isInv) {
        x = xBase - gap - (Number(track.offset) || 0) - (Number(track.offsetX) || 0) - w;
        xBase = x;
      } else {
        x = xBase + gap + (Number(track.offset) || 0) + (Number(track.offsetX) || 0);
        xBase = x + w;
      }
      if (tc.trackNameShow && track.name) {
        const cx = x + w / 2;
        const titleEl = C.el("text", { x: cx, y: titleY, "font-size": nameFs,
          "font-weight": tc.trackNameBold ? 700 : 400,
          "font-style": tc.trackNameItalic ? 'italic' : 'normal',
          "text-anchor": "middle", "dominant-baseline": "middle",
          fill: "#3a4a4a", "font-family": ff, "data-track-title": track.id,
          transform: trackNameAngle ? `rotate(${trackNameAngle} ${cx} ${titleY})` : undefined });
        titleEl.textContent = track.name;
      }
      drawOneTrack(track, x, w, leaves, rowH, rowBounds, isInv);
      placed.push({ track, x, w });
    });
    const autoLegendX = isInv ? (xBase - 24) : (xBase + 24);
    let legendY = Math.min(...ys) - rowH * 0.85 - 10;
    placed.forEach(item => {
      if (!item.track.showLegend) return;
      if (item.track.legendX != null && item.track.legendY != null) {
        drawTrackLegend(item.track, item.track.legendX, item.track.legendY, getTrackColorMap(item.track));
      } else {
        const h = drawTrackLegend(item.track, autoLegendX, legendY, getTrackColorMap(item.track));
        legendY += h + 10;
      }
    });
    if (st.showLegend && global.TreeRanges && global.TreeRanges.colorRanges.length) {
      global.TreeLegend.drawLegend(autoLegendX, legendY);
      global.TreeTracks._legendDrawn = true;
    }
  } else {
    const cx = 470, cy = 380;
    const gl = leaves.map(l => l.angle).filter(a => a != null).sort((a,b) => a-b);
    const gStep = gl.length > 1 ? (gl[gl.length-1] - gl[0]) / (gl.length - 1) : 6;
    const halfStep = gStep / 2;
    const labelOuter = leaves.map(l => {
      let w = T.labelOf(l).length * st.fontSize * (l.labelSizeFactor || 1) * 0.6;
      const lbl = C.getSvg().querySelector('.leaf-label[data-id="' + l.id + '"]');
      if (lbl) { try { w = lbl.getBBox().width; } catch(_){} }
      return C.getRadialLabelR() + w;
    });
    let rBase = Math.max(...labelOuter, C.getRadialLabelR()) + 20;
    if (global.TreeRanges && global.TreeRanges.colorRanges.length && global.TreeRanges.rangeLabelTrackShow) {
      rBase = global.TreeRanges.drawRadialRangeLabelTrack(rBase, leaves);
    }
    const placed = [];
    customTracks.forEach(track => {
      const ringW = Math.max(6, computeTrackWidth(track, { radial: true }));
      const colorMap = getTrackColorMap(track);
      rBase += gap;
      const ringStart = rBase;
      const rMid = ringStart + ringW / 2;
      leaves.forEach(l => {
        if (l.angle == null) return;
        const v = datasetValue(track, l);
        const a0 = l.angle - halfStep, a1 = l.angle + halfStep;
        const drawRingSegment = (rIn, rOut, fill) => {
          const p0i = L.polar(cx, cy, rIn, a0), p0o = L.polar(cx, cy, rOut, a0);
          const p1o = L.polar(cx, cy, rOut, a1), p1i = L.polar(cx, cy, rIn, a1);
          C.el("path", { d: `M ${p0i.x} ${p0i.y} L ${p0o.x} ${p0o.y} A ${rOut} ${rOut} 0 0 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${rIn} ${rIn} 0 0 0 ${p0i.x} ${p0i.y} Z`, fill });
        };
        if (track.type === 'colorstrip') {
          if (v == null || v === '') return;
          const fillOpacity = track.fillOpacity != null ? Number(track.fillOpacity) : 1;
          const p0i = L.polar(cx, cy, ringStart, a0), p0o = L.polar(cx, cy, ringStart + ringW, a0);
          const p1o = L.polar(cx, cy, ringStart + ringW, a1), p1i = L.polar(cx, cy, ringStart, a1);
          C.el("path", {
            d: `M ${p0i.x} ${p0i.y} L ${p0o.x} ${p0o.y} A ${ringStart + ringW} ${ringStart + ringW} 0 0 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${ringStart} ${ringStart} 0 0 0 ${p0i.x} ${p0i.y} Z`,
            fill: colorOf(track, v, colorMap), opacity: fillOpacity
          });
          if (track.showText) {
            const midAngle = (a0 + a1) / 2;
            const p = L.polar(cx, cy, rMid, midAngle);
            const vertical = track.textOrientation === 'vertical';
            const arcLength = Math.max(2, (a1 - a0) * Math.PI / 180 * rMid);
            const availLength = vertical ? Math.max(4, ringW - 4) : Math.max(4, arcLength - 4);
            let fontSize = Number(track.textFontSize) || 10;
            let text = String(v);
            let textWidth = estimateTextWidth(text, fontSize);
            if (textWidth > availLength) { const ratio = availLength / textWidth; fontSize = Math.max(5, fontSize * ratio); textWidth = estimateTextWidth(text, fontSize); }
            if (textWidth > availLength) { const ratio = availLength / textWidth; const keepLen = Math.max(1, Math.floor(text.length * ratio)); text = text.slice(0, keepLen) + (text.length > keepLen ? '…' : ''); }
            let rot;
            if (vertical) { rot = midAngle; if (midAngle > 90 && midAngle < 270) rot += 180; }
            else { rot = midAngle - 90; if (rot > 90) rot -= 180; if (rot < -90) rot += 180; }
            C.el("text", { x: p.x, y: p.y, "text-anchor": "middle", "dominant-baseline": "middle",
              "font-size": fontSize, "font-weight": track.textBold ? 700 : 400,
              "font-style": track.textItalic ? 'italic' : 'normal',
              fill: track.textColor || '#333333', "font-family": ff,
              "pointer-events": "none", transform: `rotate(${rot} ${p.x} ${p.y})` }).textContent = text;
          }
        } else if (track.type === 'heatstrip') {
          const nums = leaves.map(x => parseFloat(datasetValue(track, x))).filter(Number.isFinite);
          let mn = track.gradientMin, mx = track.gradientMax;
          if (!Number.isFinite(mn)) mn = Math.min(...nums);
          if (!Number.isFinite(mx)) mx = Math.max(...nums);
          if (mn === mx) mx = mn + 1;
          const num = parseFloat(v); if (!Number.isFinite(num)) return;
          let t = (num - mn) / (mx - mn); if (track.gradientReverse) t = 1 - t;
          drawRingSegment(ringStart, ringStart + ringW, sampleTrackColor(track, t));
        } else if (track.type === 'binary') {
          if (v == null || v === '') return;
          const ok = evalBinaryLogic(track, v);
          if (!ok && !track.binaryShowFalse) return;
          const fill = ok ? track.binaryTrueColor : track.binaryFalseColor;
          const p = L.polar(cx, cy, rMid, l.angle);
          const size = Math.min(ringW * 0.42, (gStep * Math.PI / 180) * rMid * 0.42);
          const el = drawTrackSymbol(track.shape || 'square', p.x, p.y, size, fill, track.outlineColor, track.outlineWidth);
          if (el) el.setAttribute("transform", `rotate(${(l.angle - 90)} ${p.x} ${p.y})`);
        } else if (track.type === 'bar') {
          const nums = leaves.map(x => parseFloat(datasetValue(track, x))).filter(Number.isFinite);
          let mn = track.axisMin, mx = track.axisMax;
          if (!Number.isFinite(mn)) mn = Math.min(0, ...nums);
          if (!Number.isFinite(mx)) mx = Math.max(...nums);
          if (mn === mx) mx = mn + 1;
          const num = parseFloat(v); if (!Number.isFinite(num)) return;
          const t = (num - mn) / (mx - mn);
          drawRingSegment(ringStart, ringStart + ringW * t, track.barColor);
        } else if (track.type === 'text') {
          if (v == null || v === '') return;
          const txt = String(v);
          const fill = colorOf(track, txt, colorMap);
          const p = L.polar(cx, cy, rMid, l.angle);
          let rot = l.angle - 90, anchor = 'start';
          if (l.angle > 180 && l.angle < 360) { rot += 180; anchor = 'end'; }
          const fs = Number(track.textFontSize) || 10;
          const t = C.el('text', { x: p.x, y: p.y, 'font-size': fs,
            'font-weight': track.textBold ? 700 : 400,
            'font-style': track.textItalic ? 'italic' : 'normal',
            'font-family': ff, fill, 'text-anchor': anchor,
            'dominant-baseline': 'middle', transform: `rotate(${rot} ${p.x} ${p.y})` });
          t.textContent = txt;
        } else if (track.type === 'multisymbol') {
          if (v == null || v === '') return;
          const key = String(v);
          const shape = (track.shapeMap && track.shapeMap[key]) || track.uniformShape || 'square';
          const fill = colorOf(track, key, colorMap);
          const p = L.polar(cx, cy, rMid, l.angle);
          const size = Math.min(ringW * 0.42, (gStep * Math.PI / 180) * rMid * 0.42);
          const el = drawTrackSymbol(shape, p.x, p.y, size, fill, track.outlineColor, track.outlineWidth || 0);
          if (el) el.setAttribute("transform", `rotate(${(l.angle - 90)} ${p.x} ${p.y})`);
        } else if (track.type === 'stackedbar') {
          if (v == null || v === '') return;
          let vals = String(v).split(',').map(parseFloat).filter(Number.isFinite);
          if (!vals.length) return;
          if (track.percentMode) {
            const tot0 = vals.reduce((a, b) => a + Math.max(0, b), 0) || 1;
            vals = vals.map(x => Math.max(0, x) / tot0 * 100);
          }
          const tot = track.percentMode ? 100 : (vals.reduce((a, b) => a + Math.max(0, b), 0) || 1);
          const cols = global.TreePalette.getCategoricalScheme(track.palette || 'tableau10');
          let rCur = ringStart;
          vals.forEach((val, i) => {
            const fraction = Math.max(0, val) / tot;
            const rNext = rCur + ringW * fraction;
            const color = (track.columnColors && track.columnColors[track.columns[i]]) || cols[i % cols.length];
            drawRingSegment(rCur, rNext, color);
            rCur = rNext;
          });
        } else if (track.type === 'pie') {
          if (v == null || v === '') return;
          const vals = String(v).split(',').map(parseFloat).filter(Number.isFinite);
          if (!vals.length) return;
          const center = L.polar(cx, cy, rMid, l.angle);
          const rPie = Math.max(2, Math.min(Number(track.pieRadius) || 9, ringW * 0.45, (gStep * Math.PI / 180) * rMid * 0.45));
          const tot = vals.reduce((a, b) => a + Math.max(0, b), 0) || 1;
          const cols = global.TreePalette.getCategoricalScheme(track.palette || 'tableau10');
          let pa0 = -90;
          vals.forEach((val, i) => {
            const frac = Math.max(0, val) / tot;
            const pa1 = pa0 + frac * 360;
            const color = (track.columnColors && track.columnColors[track.columns[i]]) || cols[i % cols.length];
            if (frac >= 0.999) { C.el('circle', { cx: center.x, cy: center.y, r: rPie, fill: color }); return; }
            const pp0 = L.polar(center.x, center.y, rPie, pa0);
            const pp1 = L.polar(center.x, center.y, rPie, pa1);
            const large = (pa1 - pa0) > 180 ? 1 : 0;
            C.el('path', { d: `M ${center.x} ${center.y} L ${pp0.x} ${pp0.y} A ${rPie} ${rPie} 0 ${large} 1 ${pp1.x} ${pp1.y} Z`, fill: color });
            pa0 = pa1;
          });
        }
      });
      placed.push({ track, ringW, ringStart });
      rBase = ringStart + ringW;
    });
    const vb = C.getViewBox();
    let legendY = vb.y + 20;
    const legendX = vb.x + vb.w - 220;
    placed.forEach(item => {
      if (!item.track.showLegend) return;
      if (item.track.legendX != null && item.track.legendY != null) {
        drawTrackLegend(item.track, item.track.legendX, item.track.legendY, getTrackColorMap(item.track));
      } else {
        const h = drawTrackLegend(item.track, legendX, legendY, getTrackColorMap(item.track));
        legendY += h + 10;
      }
    });
    if (st.showLegend && global.TreeRanges && global.TreeRanges.colorRanges.length) {
      global.TreeLegend.drawLegend(legendX, legendY);
      global.TreeTracks._legendDrawn = true;
    }
  }
}

C.registerSnapshot('customTracks', () => ({
  tracks: JSON.parse(JSON.stringify(customTracks)),
  trackSeq,
  trackCommon: { ...trackCommon }
}), s => {
  if (Array.isArray(s.tracks)) customTracks = s.tracks;
  if (typeof s.trackSeq === 'number') trackSeq = s.trackSeq;
  if (s.trackCommon) Object.assign(trackCommon, s.trackCommon);
});

global.TreeTracks = {
  get tracks() { return customTracks; },
  get trackCommon() { return trackCommon; }, set trackCommon(v) { Object.assign(trackCommon, v); },
  trackTypeLabel, TRACK_SHAPES,
  trackDefaultName, newTrackDefaults,
  addCustomTrack, updateCustomTrack, removeCustomTrack, toggleCustomTrack,
  buildTrackData, buildMultiTrackData, refreshTrackData,
  getTrackColorMap, collectUniqueValues, renderCustomTracks,
  _legendDrawn: false
};

let datasets = [];
let datasetSeq = 0;
const DS_PALETTE = ["#E64B35","#4DBBD5","#00A087","#3C5488","#F39B7F","#8491B4","#91D1C2","#DC0000"];
function renderDatasetList() {
  const box = document.getElementById("datasetList"); if (!box) return;
  box.innerHTML = datasets.map(d => `<div class="ds-row"><span class="ds-sw" style="background:${d.base}"></span><span class="ds-nm">${d.name} <small>(${d.type})</small></span><button class="ds-x" data-ds="${d.id}">×</button></div>`).join("");
}
C.registerSnapshot("datasets", () => ({ datasets: JSON.parse(JSON.stringify(datasets)), datasetSeq }),
  s => { if (Array.isArray(s.datasets)) datasets = s.datasets; if (typeof s.datasetSeq === "number") datasetSeq = s.datasetSeq; });

global.TreeDatasets = {
  get datasets() { return datasets; },
  DS_PALETTE,
  renderDatasetList,
  drawDatasets(radial) { renderCustomTracks(radial); }
};

})(window);
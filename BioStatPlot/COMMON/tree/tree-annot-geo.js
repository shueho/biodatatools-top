(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const L = global.TreeLayout;
const TT = global.TreeText;
const I = global.TreeI18N;
const SS = global.TreeStyle;
const W = global.TreeCommonWidgets;
const drawText = (p, x, y, t, s, ts, e) => W.drawTextWithBg(TT, p, x, y, t, s, ts, e);
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
  const st = C.state;
  const unifyFs = Math.max(6, Number(st.tickLabelFontSize) || 11);
  const baseGap = 5 + 4 + unifyFs + 6;
  let sum = 0;
  geoTimeTracks.forEach(t => { sum += (Number(t.height) || 18) + (Number(t.gap) || 4); });
  let maxOffset = 0;
  geoTimeTracks.forEach(t => { const off = Number(t.offset) || 0; if (off > maxOffset) maxOffset = off; });
  return baseGap + sum + maxOffset + 20;
}

function geoJsonCandidates() {
  const list = ['geo-timescale-intervals.json', './geo-timescale-intervals.json'];
  try {
    const s = document.currentScript && document.currentScript.src;
    if (s) list.push(s.replace(/[^/]*$/, '') + 'geo-timescale-intervals.json');
  } catch (_) {}
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src && /tree-annot-geo\.js/.test(scripts[i].src)) {
      list.push(scripts[i].src.replace(/[^/]*$/, '') + 'geo-timescale-intervals.json');
      break;
    }
  }
  return Array.from(new Set(list));
}
function makeTimeToDepth(tracks, maxD) { return t => t * (Number(geoScaleFactor) || 1); }
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
  const buckets = {};
  GEO_LEVELS.forEach(l => { buckets[l] = []; });
  function walk(node, depth) {
    if (!node) return;
    const lvl = levelByDepth[depth];
    if (lvl && node.name && node.start != null && node.end != null) {
      buckets[lvl].push({ start: Number(node.start), end: Number(node.end), name: String(node.name), color: node.color || '#cccccc' });
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
    textStyle: cfg.textStyle || null,
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
    entries: (cfg.entries || []).map(e => ({ id: ++geoEntrySeq, start: Number(e.start), end: Number(e.end), name: e.name || '', color: e.color || '#cccccc' }))
  };
  geoTimeTracks.push(t);
  return t;
}
function removeGeoTrack(id) { geoTimeTracks = geoTimeTracks.filter(t => t.id !== id); }
function addGeoEntry(trackId, cfg) {
  const t = geoTimeTracks.find(x => x.id === trackId); if (!t) return null;
  const e = { id: ++geoEntrySeq, start: Number(cfg.start) || 0, end: Number(cfg.end) || 0, name: cfg.name || '', color: cfg.color || '#cccccc' };
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
  geoTimeTracks = []; geoTrackSeq = 0; geoEntrySeq = 0;
  want.forEach(l => {
    if (!buckets[l] || !buckets[l].length) return;
    addGeoTrack({ level: l, name: GEO_LEVEL_LABELS[l] + 's', fillTree: l === 'eon', position: 'bottom', entries: buckets[l] });
  });
  geoTimeShow = true;
  if (global.TreeRenderer) global.TreeRenderer.draw();
  return geoTimeTracks.length;
}

function fitText(text, maxW, fs) {
  if (!text) return '';
  const getW = s => global.PlotCommon.measureText(s, fs);
  if (getW(text) <= maxW) return text;
  const ellipsis = '.';
  const ellW = getW(ellipsis);
  let curW = 0, out = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const cW = (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3000 && code <= 0x303f) || (code >= 0xff00 && code <= 0xffef) ? fs : fs * 0.6;
    if (curW + cW + ellW > maxW) break;
    curW += cW; out += text[i];
  }
  return out ? out + ellipsis : '';
}

function drawGeoTrackRectBand(track, y, tickPx, axisLo, axisHi, timeToDepth) {
  const h = track.height;
  const lo = Math.min(axisLo, axisHi);
  const hi = Math.max(axisLo, axisHi);
  const ts = SS.textStyle(C.state.textStyles.geoText);
  track.entries.forEach(e => {
    const v1 = timeToDepth(e.start);
    const v2 = timeToDepth(e.end);
    const rawX1 = tickPx(v1), rawX2 = tickPx(v2);
    if (!isFinite(rawX1) || !isFinite(rawX2)) return;
    if ((rawX1 < lo && rawX2 < lo) || (rawX1 > hi && rawX2 > hi)) return;
    let px1 = Math.max(lo, Math.min(hi, rawX1));
    let px2 = Math.max(lo, Math.min(hi, rawX2));
    let left = Math.min(px1, px2);
    let width = Math.abs(px2 - px1);
    if (width < 1.5) { const c = left + width / 2; left = c - 0.75; width = 1.5; }
    const attrs = { x: left, y, width, height: h, fill: e.color, opacity: track.opacity, class: "geotime-band" };
    if (track.outlineWidth > 0) { attrs.stroke = track.outlineColor; attrs["stroke-width"] = track.outlineWidth; }
    C.el("rect", attrs);
    if (width > 4 && e.name) {
      const fs = Math.max(6, Number(ts.fontSize) || 11);
      const txt = fitText(e.name, width - 4, fs);
      if (txt) {
        const style = TT.fromParts({ font: ts.fontFamily || C.state.fontFamily, size: fs, bold: ts.bold, italic: ts.italic, color: ts.color });
        drawText(null, left + width / 2, y + h / 2 + fs * 0.35, txt, style, ts, { "text-anchor": "middle", "pointer-events": "none" });
      }
    }
  });
}
function drawGeoTrackTitleRect(track, x, y, anchor) {
  if (!track.nameShow || !track.name) return;
  const ts = SS.textStyle(Object.assign({}, C.state.textStyles.geoText, {
    bold: track.nameBold, italic: track.nameItalic,
    fontSize: track.nameFontSize,
    color: (track.textStyle && track.textStyle.color) || C.state.textStyles.geoText.color
  }));
  const style = TT.fromParts({ font: ts.fontFamily || C.state.fontFamily, size: ts.fontSize, bold: ts.bold, italic: ts.italic, color: ts.color });
  drawText(null, x, y, track.name, style, ts, { "text-anchor": anchor || "end", "dominant-baseline": "middle" });
}

function drawGeoTimeTracks(radial) {
  if (C.state.mode === 'unrooted') return;
  if (!geoTimeShow || !geoTimeTracks.length) return;
  const st = C.state;
  const root = C.getRoot();
  if (!root) return;
  const leaves = T.visibleLeaves(root);
  if (!leaves.length) return;
  if (radial) { drawGeoTimeTracksRadial(leaves); return; }
  const maxD = Math.max(T.maxDepth(root, 0), 1e-9);
  const treeW = 560 * (st.scaleH || 1);
  const isInv = C.isTrue(st.invert);
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
      if (!T.hasRealChildren(n)) return;
      const m = (n.meta || []).find(mm => mm.field === rl.field);
      if (m && Array.isArray(m.value) && m.value.length >= 2) {
        const lo = Number(m.value[0]), hi = Number(m.value[1]);
        if (Number.isFinite(lo)) { const x = tickPx(lo); axisLo = Math.min(axisLo, x); axisHi = Math.max(axisHi, x); }
        if (Number.isFinite(hi)) { const x = tickPx(hi); axisLo = Math.min(axisLo, x); axisHi = Math.max(axisHi, x); }
      }
    });
  }
  if (rootPos <= tipPos) axisHi = Math.min(axisHi, tipPos);
  else axisLo = Math.max(axisLo, tipPos);
  {
    const r = C.getAxisRange(maxD);
    const xLo = tickPx(r.vLo), xHi = tickPx(r.vHi);
    if (Number.isFinite(xLo) && Number.isFinite(xHi)) { axisLo = Math.min(axisLo, xLo, xHi); axisHi = Math.max(axisHi, xLo, xHi); }
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
      const v1 = timeToDepth(e.start), v2 = timeToDepth(e.end);
      let px1 = tickPx(v1), px2 = tickPx(v2);
      if (!isFinite(px1) || !isFinite(px2)) return;
      if ((px1 < axisLo && px2 < axisLo) || (px1 > axisHi && px2 > axisHi)) return;
      px1 = Math.max(axisLo, Math.min(axisHi, px1));
      px2 = Math.max(axisLo, Math.min(axisHi, px2));
      let left = Math.min(px1, px2), width = Math.abs(px2 - px1);
      if (width < 1.5) { const c = left + width / 2; left = c - 0.75; width = 1.5; }
      C.el("rect", { x: left, y: yTop, width, height: yBot - yTop, fill: e.color, opacity: op, "pointer-events": "none" }, fillBg);
    });
  });
  const sameSide = geoTimeTracks.filter(t => t.position === axisSide);
  const otherSide = geoTimeTracks.filter(t => t.position !== axisSide);
  const sortTracks = arr => arr.slice().sort((a, b) => { if (a.fillTree !== b.fillTree) return a.fillTree ? -1 : 1; return a.id - b.id; });
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

function drawGeoTimeTracksRadial(leaves) {
  const st = C.state;
  const root = C.getRoot();
  const maxD = Math.max(T.maxDepth(root, 0), 1e-9);
  const innerBase = (L && typeof L.getRadialInnerBase === 'function') ? L.getRadialInnerBase() : 0;
  const maxR = 285 * (st.scaleH || 1);
  const isReverse = C.isTrue(st.axisReverse);
  const isInv = C.isTrue(st.invert);
  const extEnd = Math.max(0, Number(st.axisExtendEnd) || 0);
  const extEndT = extEnd * maxD / maxR;
  const extStart = Math.max(0, Number(st.axisExtendStart) || 0);
  const extStartT = extStart * maxD / maxR;
  const ar = C.getAxisRange(maxD);
  let vLo = isReverse ? (maxD - ar.vHi) : ar.vLo;
  let vHi = isReverse ? (maxD - ar.vLo) : ar.vHi;
  const rl = st.rangeLabelConfig;
  if (rl && rl.show && rl.field) {
    T.allWalk(root, n => {
      const hasKids = (n.children || []).some(c => !c.deleted);
      if (!hasKids) return;
      const m = (n.meta || []).find(mm => mm.field === rl.field);
      if (!m || !Array.isArray(m.value) || m.value.length < 2) return;
      const lo = Number(m.value[0]), hi = Number(m.value[1]);
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) return;
      const t1 = isReverse ? (maxD - lo) : lo;
      const t2 = isReverse ? (maxD - hi) : hi;
      vLo = Math.min(vLo, t1, t2);
      vHi = Math.max(vHi, t1, t2);
    });
  }
  const tMinUsed = Math.min(0, vLo) - extStartT;
  const tMaxUsed = Math.max(maxD, vHi) + extEndT;
  const rA = isInv ? innerBase + maxR * (maxD - tMaxUsed) / maxD : innerBase + maxR * tMinUsed / maxD;
  const rB = isInv ? innerBase + maxR * (maxD - tMinUsed) / maxD : innerBase + maxR * tMaxUsed / maxD;
  const R_base = Math.max(rA, rB);
  const cx = 470, cy = 380;
  const baseAngle = Number(st.rotation) || 0;
  const axisAngle = baseAngle + (Number(st.axisRotation) || 0);
  const axisRad = (axisAngle - 90) * Math.PI / 180;
  const ux = Math.cos(axisRad), uy = Math.sin(axisRad);
  const perpRad = (axisAngle - 180) * Math.PI / 180;
  const perpX = Math.cos(perpRad), perpY = Math.sin(perpRad);
  const timeToDepth = makeTimeToDepth(geoTimeTracks, maxD);
  function radiusOfTime(t) {
    const d = timeToDepth(t);
    const depthT = isReverse ? (maxD - d) : d;
    if (isInv) return innerBase + maxR * (maxD - depthT) / maxD;
    return innerBase + maxR * depthT / maxD;
  }
  const fillBg = C.el("g", { class: "geotime-filltree" });
  C.getSvg().insertBefore(fillBg, C.getSvg().firstChild);
  geoTimeTracks.forEach(track => {
    if (!track.fillTree) return;
    const op = track.fillTreeOpacity != null ? Number(track.fillTreeOpacity) : 0.14;
    track.entries.forEach(e => {
      const r1 = radiusOfTime(e.start);
      const r2 = radiusOfTime(e.end);
      let a = Math.max(0, Math.min(r1, r2));
      let b = Math.min(R_base, Math.max(r1, r2));
      if (b <= a + 1e-9) return;
      if (b - a < 1.5) { const center = (a + b) / 2; a = Math.max(0, center - 0.75); b = Math.min(R_base, center + 0.75); }
      C.el("circle", { cx, cy, r: (a + b) / 2, fill: "none", stroke: e.color, "stroke-width": b - a, opacity: op, "pointer-events": "none" }, fillBg);
    });
  });
  const unifyFs = Math.max(6, Number(st.tickLabelFontSize) || 11);
  const tickLen = 5, labelGap = 4;
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
      if (vertical) rot = axisAngle; else rot = axisAngle - 90;
      while (rot > 90) rot -= 180;
      while (rot < -90) rot += 180;
      return rot;
    }
    if (!isReverse && innerBase > 0.5 && track.entries.length > 0) {
      let innerColor = null;
      let vMinAbs = Infinity;
      track.entries.forEach(e => {
        const d1 = timeToDepth(Number(e.start)), d2 = timeToDepth(Number(e.end));
        const vLo2 = Math.min(d1, d2);
        if (isFinite(vLo2) && vLo2 < vMinAbs) { vMinAbs = vLo2; innerColor = e.color; }
      });
      if (innerColor) {
        const p1 = { x: cx + off1 * perpX, y: cy + off1 * perpY };
        const p2 = { x: cx + innerBase * ux + off1 * perpX, y: cy + innerBase * uy + off1 * perpY };
        const p3 = { x: cx + innerBase * ux + off2 * perpX, y: cy + innerBase * uy + off2 * perpY };
        const p4 = { x: cx + off2 * perpX, y: cy + off2 * perpY };
        const extAttrs = { points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`, fill: innerColor, opacity: track.opacity, class: "geotime-band geotime-band-ext" };
        if (track.outlineWidth > 0) { extAttrs.stroke = track.outlineColor; extAttrs["stroke-width"] = track.outlineWidth; }
        C.el("polygon", extAttrs);
      }
    }
    track.entries.forEach(e => {
      const r1 = radiusOfTime(e.start);
      const r2 = radiusOfTime(e.end);
      let rLo = Math.max(0, Math.min(r1, r2));
      let rHi = Math.min(R_base, Math.max(r1, r2));
      if (rHi <= rLo + 1e-9) return;
      if (rHi - rLo < 1.5) { const center = (rLo + rHi) / 2; rLo = Math.max(0, center - 0.75); rHi = Math.min(R_base, center + 0.75); }
      const p1 = { x: cx + rLo * ux + off1 * perpX, y: cy + rLo * uy + off1 * perpY };
      const p2 = { x: cx + rHi * ux + off1 * perpX, y: cy + rHi * uy + off1 * perpY };
      const p3 = { x: cx + rHi * ux + off2 * perpX, y: cy + rHi * uy + off2 * perpY };
      const p4 = { x: cx + rLo * ux + off2 * perpX, y: cy + rLo * uy + off2 * perpY };
      const attrs = { points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`, fill: e.color, opacity: track.opacity, class: "geotime-band" };
      if (track.outlineWidth > 0) { attrs.stroke = track.outlineColor; attrs["stroke-width"] = track.outlineWidth; }
      C.el("polygon", attrs);
      const availLen = vertical ? (h - 4) : (rHi - rLo - 4);
      if (availLen > 4 && e.name) {
        const ts = SS.textStyle(st.textStyles.geoText);
        const midR = (rLo + rHi) / 2;
        const midOff = (off1 + off2) / 2;
        const tx = cx + midR * ux + midOff * perpX;
        const ty = cy + midR * uy + midOff * perpY;
        const rot = textRot();
        const fs = Math.max(6, Number(ts.fontSize) || 11);
        const txt = fitText(e.name, availLen, fs);
        if (txt) {
          const style = TT.fromParts({ font: ts.fontFamily || st.fontFamily, size: fs, bold: ts.bold, italic: ts.italic, color: ts.color });
          drawText(null, tx, ty, txt, style, ts, { "text-anchor": "middle", "dominant-baseline": "middle", "pointer-events": "none", transform: `rotate(${rot} ${tx} ${ty})` });
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
      const ts = SS.textStyle(Object.assign({}, st.textStyles.geoText, { bold: track.nameBold, italic: track.nameItalic, fontSize: track.nameFontSize }));
      const style = TT.fromParts({ font: ts.fontFamily || st.fontFamily, size: ts.fontSize, bold: ts.bold, italic: ts.italic, color: ts.color });
      drawText(null, tx, ty, track.name, style, ts, { "text-anchor": "middle", "dominant-baseline": "middle", transform: `rotate(${rot} ${tx} ${ty})` });
    }
    cursor += h + track.gap;
  });
}

C.registerSnapshot('geo', () => ({
  geoTimeTracks: JSON.parse(JSON.stringify(geoTimeTracks)),
  geoTrackSeq, geoEntrySeq, geoTimeShow, geoScaleFactor
}), s => {
  if (Array.isArray(s.geoTimeTracks)) geoTimeTracks = s.geoTimeTracks;
  if (typeof s.geoTrackSeq === 'number') geoTrackSeq = s.geoTrackSeq;
  if (typeof s.geoEntrySeq === 'number') geoEntrySeq = s.geoEntrySeq;
  if (typeof s.geoTimeShow === 'boolean') geoTimeShow = s.geoTimeShow;
  if (typeof s.geoScaleFactor === 'number' && s.geoScaleFactor > 0) geoScaleFactor = s.geoScaleFactor;
});

if (!global.TreeRanges) global.TreeRanges = {};
Object.defineProperties(global.TreeRanges, {
  geoTimeTracks: { get() { return geoTimeTracks; }, configurable: true },
  geoTimeShow: { get() { return geoTimeShow; }, set(v) { geoTimeShow = v; }, configurable: true },
  geoTrackSeq: { get() { return geoTrackSeq; }, set(v) { geoTrackSeq = v; }, configurable: true },
  geoEntrySeq: { get() { return geoEntrySeq; }, set(v) { geoEntrySeq = v; }, configurable: true },
  geoScaleFactor: { get() { return geoScaleFactor; }, set(v) { geoScaleFactor = (Number(v) > 0) ? Number(v) : 1; }, configurable: true }
});
Object.assign(global.TreeRanges, {
  getGeoExtra, GEO_LEVELS, GEO_LEVEL_LABELS, GEO_FALLBACK,
  addGeoTrack, removeGeoTrack, addGeoEntry, removeGeoEntry,
  importGeoPreset, drawGeoTimeTracks, loadGeoPresetData
});
})(window);
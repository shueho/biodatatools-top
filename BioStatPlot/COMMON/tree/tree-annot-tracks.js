(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const L = global.TreeLayout;
const N = global.TreeDrawNode;
const TT = global.TreeText;
const I = global.TreeI18N;
const SS = global.TreeStyle;
const W = global.TreeCommonWidgets;
const drawText = (p, x, y, t, s, ts, e) => W.drawTextWithBg(TT, p, x, y, t, s, ts, e);

function fontFam() { return C.state.fontFamily || 'Times New Roman'; }

function trackTextStyle(t) {
  const base = Object.assign({}, C.state.textStyles.trackText || {});
  const ts = t.textStyle || {};
  return SS.textStyle(Object.assign({}, base, {
    fontFamily: ts.fontFamily || base.fontFamily || C.state.fontFamily,
    fontSize: ts.fontSize != null ? ts.fontSize : (t.textFontSize || base.fontSize || 10),
    bold: ts.bold != null ? ts.bold : (t.textBold != null ? t.textBold : base.bold),
    italic: ts.italic != null ? ts.italic : (t.textItalic != null ? t.textItalic : base.italic),
    color: ts.color || t.textColor || base.color || '#333333',
    opacity: ts.opacity != null ? ts.opacity : (base.opacity != null ? base.opacity : 1),
    bgShow: ts.bgShow != null ? ts.bgShow : base.bgShow,
    bgColor: ts.bgColor || base.bgColor,
    bgOpacity: ts.bgOpacity != null ? ts.bgOpacity : base.bgOpacity,
    bgBorderColor: ts.bgBorderColor || base.bgBorderColor,
    bgBorderWidth: ts.bgBorderWidth != null ? ts.bgBorderWidth : base.bgBorderWidth,
    align: ts.align || base.align,
    x: ts.x != null ? ts.x : base.x,
    y: ts.y != null ? ts.y : base.y,
    offsetTangent: ts.offsetTangent != null ? ts.offsetTangent : base.offsetTangent,
    offsetRadial: ts.offsetRadial != null ? ts.offsetRadial : base.offsetRadial
  }));
}
function trackBorderStyle(t) {
  const bs = t.borderStyle || {};
  return SS.lineStyle({
    stroke: bs.stroke || t.borderColor || '#ffffff',
    strokeWidth: bs.strokeWidth != null ? bs.strokeWidth : (t.borderWidth || 0),
    opacity: bs.opacity != null ? bs.opacity : 1,
    lineStyle: bs.lineStyle || (t.boxDashed ? 'dashed' : 'solid'),
    dashSize: bs.dashSize != null ? bs.dashSize : 4,
    gapSize: bs.gapSize != null ? bs.gapSize : 3
  });
}
function trackShapeStyle(t) {
  const ss = t.shapeStyle || {};
  return SS.shapeStyle({
    shape: ss.shape || t.shape || 'square',
    size: ss.size != null ? ss.size : (t.binarySize || t.symbolSize || 0),
    fillColor: ss.fillColor || t.fill1 || '#E64B35',
    fillOpacity: ss.fillOpacity != null ? ss.fillOpacity : 1,
    strokeColor: ss.strokeColor || t.outlineColor || '#333333',
    strokeWidth: ss.strokeWidth != null ? ss.strokeWidth : (t.outlineWidth || 0)
  });
}

let customTracks = [];
let trackSeq = 0;
let trackCommon = {
  legendTitleShow: true, legendFontSize: 15, legendBold: false, legendItalic: false,
  legendTitleFontSize: 30, legendTitleBold: true, legendTitleItalic: false,
  trackGap: 50, legendMaxPerRow: 0, legendScale: 1,
  trackNameShow: true, trackNameFontSize: 26, trackNameBold: true,
  trackNameItalic: false, trackNameAngle: -45,
  autoShapeSize: true
};
const TRACK_TYPE_LABEL_KEYS = {
  colorstrip: 'trackTypeColorstrip', binary: 'trackTypeBinary', heatstrip: 'trackTypeHeatstrip',
  bar: 'trackTypeBar', text: 'trackTypeText', multisymbol: 'trackTypeMultisymbol',
  stackedbar: 'trackTypeStackedbar', pie: 'trackTypePie', groupedbar: 'trackTypeGroupedbar',
  multiheatmap: 'trackTypeMultiheatmap', legend: 'trackTypeLegend'
};

function trackTypeLabel(type) { const k = TRACK_TYPE_LABEL_KEYS[type]; return k ? I.t(k) : type; }
function trackDefaultName(type, column) { return column ? column : trackTypeLabel(type); }

function newTrackDefaults(type) {
  return {
    id: ++trackSeq, type, name: '',
    column: '', columns: [], colorColumn: '', shapeColumn: '',
    collapsed: false, offset: 0, offsetX: 0, width: 0,
    palette: 'tableau10',
    borderColor: '#ffffff', borderWidth: 0,
    borderStyle: null,
    showBorder: true, mergeGroups: false, customColors: {},
    shape: 'square', outlineColor: '#333333', outlineWidth: 1,
    shapeStyle: null,
    binarySize: 0, symbolSize: 0,
    fill0: '#ffffff', fill1: '#E64B35',
    binaryLogic: 'eq', binaryValue: '',
    binaryTrueColor: '#E64B35', binaryFalseColor: '#cccccc',
    binaryShowFalse: false,
    gradient: 'Viridis', gradientMin: null, gradientMax: null,
    gradientReverse: false, gradientStops: null,
    legendTickInterval: null, legendTickDecimals: 2,
    legendTickCount: 3, legendTickBold: true,
    barColor: '#4DBBD5', barColorMode: 'uniform', barColorColumn: '',
    barAxisValue: 0,
    _barColorCache: null, _barColorMap: null,
    barOutlineColor: '#333333', barOutlineWidth: 0, barOutlineDashed: false,
    boxColor: '#bbbbbb', boxWidth: 0.5, boxDashed: false, showBox: false,
    barLength: 100, barWidth: 0, showValues: true, showAxisNumbers: true,
    refLines: [], axisMin: null, axisMax: null, axisInterval: null,
    textBold: false, textItalic: false, textFontSize: 10, textAlign: 'left',
    textOrientation: 'horizontal', textAutoWidth: false, textStyle: null,
    fillOpacity: 1, showText: false, textColor: '#333333',
    colorstripTextOffsetX: 0, colorstripTextOffsetY: 0,
    uniformShape: 'square', shapeMap: {}, columnColors: {},
    percentMode: false, pieRadius: 9,
    showColLabels: true, colLabelFontSize: 10, colLabelColor: '#333333',
    colLabelOffset: 6, colLabelOrientation: 'vertical',
    showLegend: true, legendTitle: '', legendOrientation: 'horizontal',
    legendX: null, legendY: null,
    excludedValues: [],
    _colorCache: null, _shapeCache: null,
    legendItems: []
  };
}

function getLeafData() { return global.TreeAppData && global.TreeAppData.leafData; }
function datasetValue(ds, leaf) {
  if (!ds || !ds.data) return null;
  const v = ds.data[T.labelOf(leaf)];
  if (v != null) return v;
  return ds.data[leaf.name];
}
function getLeafColumnValue(leaf, column) {
  const ld = getLeafData();
  if (!ld || !column) return null;
  const candidates = [];
  if (leaf.name) candidates.push(String(leaf.name).trim());
  const lbl = T.labelOf(leaf);
  if (lbl && candidates.indexOf(String(lbl).trim()) < 0) candidates.push(String(lbl).trim());
  for (let ci = 0; ci < candidates.length; ci++) {
    const key = candidates[ci];
    if (!key) continue;
    if (ld.leafMap) { const row = ld.leafMap.get(key); if (row) return row[column]; }
    if (ld.rows) {
      for (let i = 0; i < ld.rows.length; i++) {
        if (String(ld.rows[i].Leaf || '').trim() === key) return ld.rows[i][column];
      }
    }
  }
  return null;
}
function getBarColumnValues(track) {
  if (!track || !track.barColorColumn) return [];
  const out = []; const seen = new Set();
  T.visibleLeaves(C.getRoot()).forEach(l => {
    const v = getLeafColumnValue(l, track.barColorColumn);
    if (v == null || v === '') return;
    const s = String(v);
    if (seen.has(s)) return;
    seen.add(s); out.push(s);
  });
  out.sort();
  return out;
}
function getBarColorMap(track) {
  if (track._barColorMap) return track._barColorMap;
  const map = {};
  if (track.barColorMode !== 'column' || !track.barColorColumn) { track._barColorMap = map; return map; }
  const vals = getBarColumnValues(track);
  const pal = global.TreePalette.getCategoricalScheme(track.palette || 'tableau10');
  vals.forEach((v, i) => { map[v] = (track.customColors && track.customColors[v]) || pal[i % pal.length]; });
  track._barColorMap = map;
  return map;
}
function barColorOf(track, leaf, colorMap) {
  const mode = track.barColorMode || 'uniform';
  if (mode === 'leafGroup' && global.TreeRanges && typeof global.TreeRanges.getRangeColorForNode === 'function') {
    const c = global.TreeRanges.getRangeColorForNode(leaf);
    if (c) return c;
    return track.barColor || '#4DBBD5';
  }
  if (mode === 'column' && track.barColorColumn) {
    const v = getLeafColumnValue(leaf, track.barColorColumn);
    if (v == null || v === '') return track.barColor || '#4DBBD5';
    const s = String(v);
    if (/^#[0-9a-fA-F]{3,8}$/.test(s) || /^rgb/.test(s)) return s;
    const map = getBarColorMap(track);
    return map[s] || track.barColor || '#4DBBD5';
  }
  return track.barColor || '#4DBBD5';
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
    const vals = columns.map(c => parseFloat(r[c]));
    data[k] = vals.join(',');
  });
  return data;
}
function refreshTrackData(t) {
  if (!t) return;
  if (t.type === 'stackedbar' || t.type === 'pie' || t.type === 'groupedbar' || t.type === 'multiheatmap') t.data = buildMultiTrackData(t.columns);
  else if (t.type === 'multisymbol') t.data = buildTrackData(t.column || t.shapeColumn);
  else t.data = buildTrackData(t.column);
  t._colorCache = null; t._shapeCache = null;
}
function defaultLegendTitle(t) {
  if (!t) return '';
  if (t.type === 'stackedbar' || t.type === 'pie' || t.type === 'groupedbar') return (t.columns && t.columns[0]) || '';
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
  if (['column', 'columns', 'shapeColumn', 'colorColumn'].some(k => k in patch)) {
    refreshTrackData(t);
    if (titleWasDefault) t.legendTitle = defaultLegendTitle(t);
  }
  if (patch.palette || patch.customColors) t._colorCache = null;
  if (patch.palette || patch.customColors || patch.barColorColumn || patch.barColorMode || patch.barColor) t._barColorMap = null;
  if (['barColorMode','barColorColumn','barColor','palette','customColors'].some(k => k in patch)) t._barColorCache = null;
  if (patch.shapeStyle) t._shapeCache = null;
}
function removeCustomTrack(id) { customTracks = customTracks.filter(x => x.id !== id); }
function toggleCustomTrack(id) {
  const t = customTracks.find(x => x.id === id);
  if (t) t.collapsed = !t.collapsed;
}

function collectUniqueValues(t) {
  const out = []; const seen = new Set();
  const excluded = new Set((t.excludedValues || []).map(String));
  const leaves = T.visibleLeaves(C.getRoot());
  const add = v => { const s = String(v); if (excluded.has(s)) return; if (!seen.has(s)) { seen.add(s); out.push(s); } };
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
  t._colorCache = cache;
  return cache;
}
function colorOf(track, value, colorMap, fallbackColor) {
  const v = String(value);
  const custom = track.customColors && track.customColors[v];
  if (custom) return custom;
  if (fallbackColor) return fallbackColor;
  return colorMap[v] || '#cccccc';
}
function isExcluded(track, value) {
  if (!track || !track.excludedValues || !track.excludedValues.length) return false;
  const s = String(value);
  for (let i = 0; i < track.excludedValues.length; i++) if (String(track.excludedValues[i]) === s) return true;
  return false;
}
function computeTrackWidth(track, opts) {
  opts = opts || {};
  if (track.type === 'legend') return 0;
  if (!opts.radial && track.type === 'colorstrip' && track.textAutoWidth && track.showText) {
    const ld = getLeafData();
    const ts = trackTextStyle(track);
    let maxW = 40;
    if (ld && ld.rows && track.column) {
      const seen = new Set();
      ld.rows.forEach(r => {
        const v = r[track.column];
        if (v == null || v === '') return;
        const s = String(v);
        if (seen.has(s)) return;
        seen.add(s);
        const tw = global.PlotCommon.measureText(s, ts.fontSize);
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
    case 'groupedbar': return 100;
    case 'multiheatmap': {
      const cellW = Number(track.cellWidth) > 0 ? Number(track.cellWidth) : 20;
      const n = Math.max(1, (track.columns || []).length);
      return cellW * n;
    }
    default: return 22;
  }
}
function drawTrackSymbol(shape, cx, cy, s, fill, stroke, sw, parent, fillOpacity) {
  const attrs = { fill };
  if (fillOpacity != null && fillOpacity < 1) attrs["fill-opacity"] = fillOpacity;
  if (stroke && sw > 0) { attrs.stroke = stroke; attrs['stroke-width'] = sw; }
  if (shape === 'square') return C.el('rect', { x: cx - s, y: cy - s, width: s * 2, height: s * 2, ...attrs }, parent);
  if (shape === 'triangle') return C.el('polygon', { points: `${cx},${cy - s} ${cx + s},${cy + s} ${cx - s},${cy + s}`, ...attrs }, parent);
  if (shape === 'star') {
    let pts = '';
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? s * 0.45 : s;
      const a = (-90 + i * 36) * Math.PI / 180;
      pts += `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} `;
    }
    return C.el('polygon', { points: pts.trim(), ...attrs }, parent);
  }
  if (shape === 'diamond2' || shape === 'diamond') {
    return C.el('polygon', { points: `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`, ...attrs }, parent);
  }
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
  const s = String(v).trim();
  const n = parseFloat(s);
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
  const bs = trackBorderStyle(track);
  const showBorder = (track.showBorder !== false) && bs.strokeWidth > 0;
  const stroke = showBorder ? bs.stroke : 'none';
  const sw = showBorder ? bs.strokeWidth : 0;
  const dashArr = showBorder ? SS.dashArrayOf(bs) : '';
  const opa = showBorder ? bs.opacity : 1;
  const rowOf = l => (rowBounds && rowBounds.get(l)) || { top: l.y - rowH / 2, bottom: l.y + rowH / 2 };
  const ts = trackTextStyle(track);

  if (track.type === 'colorstrip') {
    const fillOpacity = track.fillOpacity != null ? Number(track.fillOpacity) : 1;
    const showText = !!track.showText;
    const vertical = track.textOrientation === 'vertical';
    const textStyle = TT.fromParts({ font: ts.fontFamily || ff, size: ts.fontSize, bold: ts.bold, italic: ts.italic, color: ts.color });
    const drawBlock = (top, bottom, value) => {
      const attrs = { x, y: top, width: w, height: Math.max(1, bottom - top), fill: colorOf(track, value, colorMap), opacity: fillOpacity };
      if (showBorder) { attrs.stroke = stroke; attrs["stroke-width"] = sw; attrs["stroke-dasharray"] = dashArr; attrs["stroke-opacity"] = opa; }
      C.el("rect", attrs);
      if (showText && value != null && value !== '') {
        const cy = (top + bottom) / 2 + (Number(track.colorstripTextOffsetY) || 0);
        const cx = x + w / 2 + (Number(track.colorstripTextOffsetX) || 0);
        const extra = { "text-anchor": "middle", "dominant-baseline": "middle", "pointer-events": "none" };
        if (vertical) extra.transform = `rotate(-90 ${cx} ${cy})`;
        drawText(null, cx, cy, String(value), textStyle, ts, extra);
      }
    };
    if (track.mergeGroups) {
      const ordered = [...leaves].sort((a, b) => a.y - b.y);
      let curV = null, curTop = 0, curBot = 0;
      const segs = [];
      ordered.forEach(l => {
        const v = datasetValue(track, l);
        const row = rowOf(l);
        if (v == null || v === '' || isExcluded(track, v)) {
          if (curV !== null) { segs.push({ v: curV, top: curTop, bot: curBot }); curV = null; }
          return;
        }
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
        if (isExcluded(track, v)) return;
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
      const attrs = { x, y: row.top, width: w, height: row.bottom - row.top, fill };
      if (showBorder) { attrs.stroke = stroke; attrs["stroke-width"] = sw; attrs["stroke-dasharray"] = dashArr; attrs["stroke-opacity"] = opa; }
      C.el("rect", attrs);
    });
  } else if (track.type === 'binary') {
    const shapeStyle = trackShapeStyle(track);
    leaves.forEach(l => {
      const v = datasetValue(track, l);
      if (v == null || v === '') return;
      if (isExcluded(track, v)) return;
      const ok = evalBinaryLogic(track, v);
      if (!ok && !track.binaryShowFalse) return;
      const fill = ok ? track.binaryTrueColor : track.binaryFalseColor;
      const row = rowOf(l);
      const cy = (row.top + row.bottom) / 2;
      const autoSize = Math.min(row.bottom - row.top, w) * 0.42;
      const useManual = (trackCommon.autoShapeSize === false) && Number(shapeStyle.size) > 0;
      const size = useManual ? Math.max(1, Number(shapeStyle.size)) : autoSize;
      drawTrackSymbol(shapeStyle.shape || 'square', x + w / 2, cy, size, fill, shapeStyle.strokeColor, shapeStyle.strokeWidth, null, shapeStyle.fillOpacity);
    });
  } else if (track.type === 'bar') {
    drawBarTrackAdvanced(track, x, w, leaves, rowOf, invert);
  } else if (track.type === 'text') {
    const align = track.textAlign || 'left';
    const actualAlign = invert ? (align === 'left' ? 'right' : align === 'right' ? 'left' : 'center') : align;
    leaves.forEach(l => {
      const v = datasetValue(track, l);
      if (v == null || v === '') return;
      if (isExcluded(track, v)) return;
      const txt = String(v);
      const fill = colorOf(track, txt, colorMap, ts.color);
      const xPos = actualAlign === 'left' ? x + 2 : actualAlign === 'right' ? x + w - 2 : x + w / 2;
      const anchor = actualAlign === 'left' ? 'start' : actualAlign === 'right' ? 'end' : 'middle';
      const style = TT.fromParts({ font: ts.fontFamily || ff, size: ts.fontSize, bold: ts.bold, italic: ts.italic, color: fill });
      drawText(null, xPos, l.y + ts.fontSize * 0.34, txt, style, ts, { 'text-anchor': anchor });
    });
  } else if (track.type === 'multisymbol') {
    const shapeStyle = trackShapeStyle(track);
    leaves.forEach(l => {
      const v = datasetValue(track, l);
      if (v == null || v === '') return;
      if (isExcluded(track, v)) return;
      const key = String(v);
      const shape = (track.shapeMap && track.shapeMap[key]) || shapeStyle.shape || 'square';
      const fill = colorOf(track, key, colorMap);
      const row = rowOf(l);
      const cy = (row.top + row.bottom) / 2;
      const autoSize = Math.min(row.bottom - row.top, w) * 0.42;
      const useManual = (trackCommon.autoShapeSize === false) && Number(shapeStyle.size) > 0;
      const size = useManual ? Math.max(1, Number(shapeStyle.size)) : autoSize;
      drawTrackSymbol(shape, x + w / 2, cy, size, fill, shapeStyle.strokeColor, shapeStyle.strokeWidth, null, shapeStyle.fillOpacity);
    });
  } else if (track.type === 'stackedbar') {
    drawStackedBarAdvanced(track, x, w, leaves, rowOf, invert);
  } else if (track.type === 'pie') {
    const cols = global.TreePalette.getCategoricalScheme(track.palette || 'tableau10');
    const colorFor = (col, i) => (track.columnColors && track.columnColors[col]) || cols[i % cols.length];
    leaves.forEach(l => {
      const raw = datasetValue(track, l);
      if (raw == null || raw === '') return;
      const vals = String(raw).split(',').map(v => {
        const num = parseFloat(v);
        return Number.isFinite(num) ? Math.max(0, num) : 0;
      });
      if (!vals.length) return;
      const row = rowOf(l);
      const cy = (row.top + row.bottom) / 2;
      const h = Math.min(row.bottom - row.top, 24);
      const tot = vals.reduce((a, b) => a + b, 0) || 1;
      const r = Math.max(2, Math.min(h / 2, Number(track.pieRadius) || 9));
      let a0 = -90;
      vals.forEach((v, i) => {
        const frac = Math.max(0, v) / tot;
        const a1 = a0 + frac * 360;
        if (frac >= 0.999) { C.el('circle', { cx: x + w / 2, cy, r, fill: colorFor(track.columns[i], i) }); return; }
        const p0 = L.polar(x + w / 2, cy, r, a0);
        const p1 = L.polar(x + w / 2, cy, r, a1);
        const large = (a1 - a0) > 180 ? 1 : 0;
        C.el('path', { d: `M ${x + w / 2} ${cy} L ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y} Z`, fill: colorFor(track.columns[i], i) });
        a0 = a1;
      });
    });
  } else if (track.type === 'groupedbar') {
    drawGroupedBarAdvanced(track, x, w, leaves, rowOf, invert);
  } else if (track.type === 'multiheatmap') {
    drawMultiHeatmapRect(track, x, w, leaves, rowOf);
  }

  const _yTop = Math.min(...leaves.map(l => rowOf(l).top));
  const _yBot = Math.max(...leaves.map(l => rowOf(l).bottom));
  C.el("rect", { x, y: _yTop, width: Math.max(1, w), height: Math.max(1, _yBot - _yTop), fill: "transparent", "pointer-events": "all", "data-track-band": track.id, style: "cursor:grab" });
}

function barDomain(track, leaves, percent) {
  const allVals = leaves.map(l => {
    const raw = datasetValue(track, l);
    if (raw == null) return [];
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
  if (track.type === 'bar') {
    const ax = Number(track.barAxisValue) || 0;
    if (mn > ax) mn = ax;
    if (mx < ax) mx = ax;
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
    let vals = String(raw).split(',').map(parseFloat);
    if (!vals.length) return;
    if (track.percentMode) {
      const tot0 = vals.reduce((a, b) => a + (Number.isFinite(b) ? Math.max(0, b) : 0), 0) || 1;
      vals = vals.map(v => Number.isFinite(v) ? Math.max(0, v) / tot0 * 100 : 0);
    }
    const row = rowOf(l);
    const cy = (row.top + row.bottom) / 2;
    let cursor = pos(mn);
    let cum = 0;
    vals.forEach((v, i) => {
      const nextVal = cum + (Number.isFinite(v) ? Math.max(0, v) : 0);
      const nextPos = pos(mn + nextVal);
      const segStart = Math.min(cursor, nextPos);
      const segWidth = Math.abs(nextPos - cursor);
      C.el('rect', { x: segStart, y: cy - h / 2, width: Math.max(0, segWidth), height: h, fill: colorFor(track.columns[i], i) });
      cursor = nextPos; cum = nextVal;
    });
  });
  const ff = fontFam();
  const ts = trackTextStyle(track);
  const fs = Math.max(6, Number(ts.fontSize) || 10);
  if (track.showBox) {
    const yAxis = yBottom + 24 + fs;
    C.el('rect', { x, y: yTop, width: w, height: yAxis - yTop, fill: 'none', stroke: track.boxColor || '#bbb', 'stroke-width': Number(track.boxWidth) || 0.5, 'stroke-dasharray': track.boxDashed ? '4 3' : '' });
  }
  const yAxis = yBottom + 6;
  C.el('line', { x1: x, y1: yAxis, x2: x + w, y2: yAxis, stroke: '#333', 'stroke-width': 0.8 });
  const baseX = pos(mn);
  C.el('line', { x1: baseX, y1: yTop, x2: baseX, y2: yAxis, stroke: '#333', 'stroke-width': 0.8 });
  if (track.showAxisNumbers) {
    const interval = track.axisInterval || (mx - mn) / 2;
    const ticks = [];
    const start = Math.ceil(mn / interval) * interval;
    for (let v = start; v <= mx + 1e-9; v += interval) ticks.push(v);
    const tickStyle = TT.fromParts({ font: ff, size: fs, color: '#333' });
    ticks.forEach(v => {
      const px = pos(v);
      C.el('line', { x1: px, y1: yAxis, x2: px, y2: yAxis + 3, stroke: '#555', 'stroke-width': 0.8 });
      TT.draw(null, px, yAxis + fs + 4, track.percentMode ? v.toFixed(0) + '%' : Number(v.toFixed(2)), tickStyle, { 'text-anchor': 'middle' });
    });
  }
}

function drawBarTrackAdvanced(track, x, w, leaves, rowOf, invert) {
  const { mn, mx } = barDomain(track, leaves, false);
  const axVal = Number(track.barAxisValue) || 0;
  const range = mx - mn || 1;
  const pos = v => invert ? (x + w - (v - mn) / range * w) : (x + (v - mn) / range * w);
  const ff = fontFam();
  const ts = trackTextStyle(track);
  const colorMap = getTrackColorMap(track);
  const yTop = Math.min(...leaves.map(l => rowOf(l).top));
  const yBottom = Math.max(...leaves.map(l => rowOf(l).bottom));
  const sampleRow = rowOf(leaves[0]);
  const rowHeight = sampleRow.bottom - sampleRow.top;
  const barW = Math.max(1, Math.min(Number(track.barWidth) || rowHeight * 0.6, 40));
  const fs = Math.max(6, Number(ts.fontSize) || 10);
  const tickStyle = TT.fromParts({ font: ff, size: fs, color: ts.color || '#333', bold: ts.bold });
  const baseX = pos(axVal);
  if (track.showBox) {
    const yAxis = yBottom + 24 + fs;
    C.el('rect', { x, y: yTop, width: w, height: yAxis - yTop, fill: 'none', stroke: track.boxColor || '#bbb', 'stroke-width': Number(track.boxWidth) || 0.5, 'stroke-dasharray': track.boxDashed ? '4 3' : '' });
  }
  leaves.forEach(l => {
    const v = parseFloat(datasetValue(track, l)); if (!Number.isFinite(v)) return;
    const vx = pos(v);
    const barLen = Math.abs(vx - baseX);
    const rectX = Math.min(vx, baseX);
    C.el('rect', {
      x: rectX, y: l.y - barW / 2, width: Math.max(0.5, barLen), height: barW,
      fill: barColorOf(track, l, colorMap),
      stroke: track.barOutlineWidth > 0 ? track.barOutlineColor : 'none',
      'stroke-width': track.barOutlineWidth || 0,
      'stroke-dasharray': (track.barOutlineWidth > 0 && track.barOutlineDashed) ? '4 3' : ''
    });
    if (track.showValues) {
      const textX = invert ? (vx - 4) : (vx + 4);
      TT.draw(null, textX, l.y + fs * 0.34, Number(v).toFixed(2), tickStyle, { 'text-anchor': invert ? 'end' : 'start' });
    }
  });
  const yAxis = yBottom + 6;
  C.el('line', { x1: x, y1: yAxis, x2: x + w, y2: yAxis, stroke: '#333', 'stroke-width': 0.8 });
  C.el('line', { x1: baseX, y1: yTop, x2: baseX, y2: yAxis, stroke: '#333', 'stroke-width': 0.8 });
  if (track.showAxisNumbers) {
    const interval = track.axisInterval || (mx - mn) / 2;
    const ticks = [];
    const start = Math.ceil(mn / interval) * interval;
    for (let v = start; v <= mx + 1e-9; v += interval) ticks.push(v);
    ticks.forEach(v => {
      const px = pos(v);
      C.el('line', { x1: px, y1: yAxis, x2: px, y2: yAxis + 3, stroke: '#555', 'stroke-width': 0.8 });
      TT.draw(null, px, yAxis + fs + 4, Number(v.toFixed(2)), tickStyle, { 'text-anchor': 'middle' });
    });
  }
  (track.refLines || []).forEach(rl => {
    if (!Number.isFinite(Number(rl.value))) return;
    const px = pos(Number(rl.value));
    C.el('line', { x1: px, y1: yTop, x2: px, y2: yBottom, stroke: rl.color || '#e74c3c', 'stroke-width': Number(rl.width) || 1, 'stroke-dasharray': rl.dashed ? '4 3' : '' });
  });
}

function drawGroupedBarAdvanced(track, x, w, leaves, rowOf, invert) {
  const cols = track.columns || [];
  if (!cols.length) return;
  const N = cols.length;
  const { mn, mx } = barDomain(track, leaves, false);
  const range = mx - mn || 1;
  const pos = v => invert ? (x + w - (v - mn) / range * w) : (x + (v - mn) / range * w);
  const ff = fontFam();
  const yTop = Math.min(...leaves.map(l => rowOf(l).top));
  const yBottom = Math.max(...leaves.map(l => rowOf(l).bottom));
  const sampleRow = rowOf(leaves[0]);
  const rowHeight = sampleRow.bottom - sampleRow.top;
  const barH = (rowHeight * 0.85) / N;
  const palette = global.TreePalette.getCategoricalScheme(track.palette || 'tableau10');
  const colorFor = (col, i) => (track.columnColors && track.columnColors[col]) || palette[i % palette.length];
  const ts = trackTextStyle(track);
  const fs = Math.max(6, Number(ts.fontSize) || 10);
  const tickStyle = TT.fromParts({ font: ff, size: fs, color: ts.color || '#333', bold: ts.bold });
  if (track.showBox) {
    const yAxis = yBottom + 24 + fs;
    C.el('rect', { x, y: yTop, width: w, height: yAxis - yTop, fill: 'none', stroke: track.boxColor || '#bbb', 'stroke-width': Number(track.boxWidth) || 0.5, 'stroke-dasharray': track.boxDashed ? '4 3' : '' });
  }
  const baseX = pos(mn);
  leaves.forEach(l => {
    const raw = datasetValue(track, l);
    if (raw == null || raw === '') return;
    const vals = String(raw).split(',').map(parseFloat);
    const row = rowOf(l);
    const cy = (row.top + row.bottom) / 2;
    const startY = cy - (barH * N) / 2;
    vals.forEach((v, i) => {
      if (!Number.isFinite(v) || i >= N) return;
      const vx = pos(v);
      const barLen = Math.abs(vx - baseX);
      const rectX = Math.min(vx, baseX);
      const rectY = startY + i * barH;
      C.el('rect', {
        x: rectX, y: rectY + barH * 0.1, width: Math.max(0.5, barLen), height: barH * 0.8,
        fill: colorFor(cols[i], i),
        stroke: track.barOutlineWidth > 0 ? track.barOutlineColor : 'none',
        'stroke-width': track.barOutlineWidth || 0,
        'stroke-dasharray': (track.barOutlineWidth > 0 && track.barOutlineDashed) ? '4 3' : ''
      });
    });
  });
  const yAxis = yBottom + 6;
  C.el('line', { x1: x, y1: yAxis, x2: x + w, y2: yAxis, stroke: '#333', 'stroke-width': 0.8 });
  C.el('line', { x1: baseX, y1: yTop, x2: baseX, y2: yAxis, stroke: '#333', 'stroke-width': 0.8 });
  if (track.showAxisNumbers) {
    const interval = track.axisInterval || (mx - mn) / 2;
    const ticks = [];
    const start = Math.ceil(mn / interval) * interval;
    for (let v = start; v <= mx + 1e-9; v += interval) ticks.push(v);
    ticks.forEach(v => {
      const px = pos(v);
      C.el('line', { x1: px, y1: yAxis, x2: px, y2: yAxis + 3, stroke: '#555', 'stroke-width': 0.8 });
      TT.draw(null, px, yAxis + fs + 4, Number(v.toFixed(2)), tickStyle, { 'text-anchor': 'middle' });
    });
  }
  (track.refLines || []).forEach(rl => {
    if (!Number.isFinite(Number(rl.value))) return;
    const px = pos(Number(rl.value));
    C.el('line', { x1: px, y1: yTop, x2: px, y2: yBottom, stroke: rl.color || '#e74c3c', 'stroke-width': Number(rl.width) || 1, 'stroke-dasharray': rl.dashed ? '4 3' : '' });
  });
}

function drawMultiHeatmapRect(track, x, w, leaves, rowOf) {
  const cols = track.columns || [];
  if (!cols.length) return;
  const N = cols.length;
  const cellW = w / N;
  const allNums = [];
  const ld = global.TreeAppData && global.TreeAppData.leafData;
  if (ld && ld.rows) {
    ld.rows.forEach(r => { cols.forEach(c => { const v = parseFloat(r[c]); if (Number.isFinite(v)) allNums.push(v); }); });
  }
  if (!allNums.length) {
    leaves.forEach(l => {
      const raw = datasetValue(track, l);
      if (raw == null || raw === '') return;
      String(raw).split(',').forEach(s => { const v = parseFloat(s); if (Number.isFinite(v)) allNums.push(v); });
    });
  }
  const gMinRaw = track.gradientMin, gMaxRaw = track.gradientMax;
  let gMin = (gMinRaw != null && gMinRaw !== '' && Number.isFinite(Number(gMinRaw))) ? Number(gMinRaw) : (allNums.length ? Math.min(...allNums) : 0);
  let gMax = (gMaxRaw != null && gMaxRaw !== '' && Number.isFinite(Number(gMaxRaw))) ? Number(gMaxRaw) : (allNums.length ? Math.max(...allNums) : 1);
  if (gMin === gMax) gMax = gMin + 1;
  const bs = trackBorderStyle(track);
  const showBorder = (track.showBorder !== false) && bs.strokeWidth > 0;
  const stroke = showBorder ? bs.stroke : 'none';
  const sw = showBorder ? bs.strokeWidth : 0;
  const dashArr = showBorder ? SS.dashArrayOf(bs) : '';
  const opa = showBorder ? bs.opacity : 1;
  leaves.forEach(l => {
    const raw = datasetValue(track, l);
    if (raw == null || raw === '') return;
    const vals = String(raw).split(',').map(parseFloat);
    const row = rowOf(l);
    vals.forEach((v, i) => {
      if (!Number.isFinite(v) || i >= N) return;
      let t = (v - gMin) / (gMax - gMin);
      if (track.gradientReverse) t = 1 - t;
      const fill = sampleTrackColor(track, t);
      const attrs = { x: x + i * cellW, y: row.top, width: cellW, height: Math.max(1, row.bottom - row.top), fill };
      if (showBorder) { attrs.stroke = stroke; attrs["stroke-width"] = sw; attrs["stroke-dasharray"] = dashArr; attrs["stroke-opacity"] = opa; }
      C.el('rect', attrs);
    });
  });
  if (track.showColLabels !== false && cols.length) {
    const fs = Math.max(6, Number(track.colLabelFontSize) || 10);
    const offset = Number(track.colLabelOffset) || 6;
    const color = track.colLabelColor || '#333333';
    const vertical = (track.colLabelOrientation || 'vertical') === 'vertical';
    const ff = C.state.fontFamily || 'Times New Roman';
    const yBot = Math.max(...leaves.map(l => rowOf(l).bottom));
    const anchorY = yBot + offset;
    const labelStyle = TT.fromParts({ font: ff, size: fs, color });
    cols.forEach((col, i) => {
      const anchorX = x + (i + 0.5) * cellW;
      if (vertical) {
        TT.draw(null, anchorX, anchorY, col, labelStyle, { 'text-anchor': 'end', 'dominant-baseline': 'middle', transform: `rotate(-90 ${anchorX} ${anchorY})` });
      } else {
        TT.draw(null, anchorX, anchorY, col, labelStyle, { 'text-anchor': 'middle', 'dominant-baseline': 'hanging' });
      }
    });
  }
}

function legendTextStyles() {
  const tsTitle = SS.textStyle(C.state.textStyles.legendTitle);
  const tsItem = SS.textStyle(C.state.textStyles.legendText);
  return { tsTitle, tsItem };
}

function drawCustomLegend(track, x, y) {
  const tc = trackCommon;
  const ff = fontFam();
  const { tsTitle, tsItem } = legendTextStyles();
  const scale = tc.legendScale || 1;
  const fs = Math.max(6, Number(tsItem.fontSize) || 11) * scale;
  const titleFS = Math.max(6, Number(tsTitle.fontSize) || 12) * scale;
  const title = (tc.legendTitleShow && track.legendTitle) ? String(track.legendTitle) : '';
  const maxPerRow = Math.max(0, Number(tc.legendMaxPerRow) || 0);
  const items = track.legendItems || [];
  if (!items.length && !title) return 0;
  const g = C.el('g', { class: 'track-legend legend-box', 'data-legend': '1', 'data-track-id': track.id, style: 'cursor:move', transform: `translate(${x} ${y})` });
  const titleStyle = TT.fromParts({ font: tsTitle.fontFamily || ff, size: titleFS, bold: tsTitle.bold, italic: tsTitle.italic, color: tsTitle.color });
  const itemStyle = TT.fromParts({ font: tsItem.fontFamily || ff, size: fs, bold: tsItem.bold, italic: tsItem.italic, color: tsItem.color });
  let xx = 0, yy = 0, rowItems = 0;
  if (title) { drawText(g, 0, titleFS, title, titleStyle, tsTitle); yy = titleFS + 14; }
  let maxItemW = 0;
  items.forEach(it => { const w = fs + 8 + global.PlotCommon.measureText(it.label || '', fs); if (w > maxItemW) maxItemW = w; });
  items.forEach(it => {
    const wItem = fs + 8 + global.PlotCommon.measureText(it.label || '', fs);
    if (maxPerRow > 0 && rowItems >= maxPerRow) { xx = 0; yy += fs + 6; rowItems = 0; }
    drawTrackSymbol(it.shape || 'square', xx + fs / 2, yy + fs / 2, fs * 0.45, it.fillColor || '#4DBBD5', it.strokeColor || '#333333', Number(it.strokeWidth) || 0, g);
    drawText(g, xx + fs + 4, yy + fs * 0.85, it.label || '', itemStyle, tsItem);
    xx += (maxPerRow > 0 ? maxItemW : wItem) + 8;
    rowItems++;
  });
  return yy + fs + 8;
}

function drawTrackLegend(track, x, y, colorMap) {
  if (!track.showLegend || track.type === 'text') return 0;
  if (track.type === 'legend') return drawCustomLegend(track, x, y);
  const tc = trackCommon;
  const ff = fontFam();
  const { tsTitle, tsItem } = legendTextStyles();
  const scale = tc.legendScale || 1;
  const fs = Math.max(6, Number(tsItem.fontSize) || 11) * scale;
  const titleFS = Math.max(6, Number(tsTitle.fontSize) || 12) * scale;
  const _fallbackTitle = (track.type === 'bar' && track.barColorMode === 'column' && track.barColorColumn) ? track.barColorColumn : '';
  const _effectiveTitle = track.legendTitle || _fallbackTitle;
  const title = (tc.legendTitleShow && _effectiveTitle) ? String(_effectiveTitle) : '';
  const maxPerRow = Math.max(0, Number(tc.legendMaxPerRow) || 0);
  const titleStyle = TT.fromParts({ font: tsTitle.fontFamily || ff, size: titleFS, bold: tsTitle.bold, italic: tsTitle.italic, color: tsTitle.color });
  const itemStyle = TT.fromParts({ font: tsItem.fontFamily || ff, size: fs, bold: tsItem.bold, italic: tsItem.italic, color: tsItem.color });
  let items = [];
  let drawAsSymbol = false;
  if (track.type === 'bar') {
    if (track.barColorMode === 'column' && track.barColorColumn) {
      const _vals = getBarColumnValues(track);
      const _cmap = getBarColorMap(track);
      items = _vals.map(v => ({ label: v, color: _cmap[v] || track.barColor || '#4DBBD5' }));
    } else return 0;
  } else if (track.type === 'multisymbol') {
    drawAsSymbol = true;
    items = collectUniqueValues(track).map(v => ({ label: v, color: colorOf(track, v, colorMap), shape: (track.shapeMap && track.shapeMap[v]) || track.uniformShape || 'square' }));
  } else if (track.type === 'colorstrip' || track.type === 'text') {
    items = collectUniqueValues(track).map(v => ({ label: v, color: colorOf(track, v, colorMap) }));
  } else if (track.type === 'binary') {
    items = [{ label: 'True', color: track.binaryTrueColor }, { label: 'False', color: track.binaryFalseColor }];
  } else if (track.type === 'stackedbar' || track.type === 'pie' || track.type === 'groupedbar') {
    const cols = global.TreePalette.getCategoricalScheme(track.palette || 'tableau10');
    items = (track.columns || []).map((c, i) => ({ label: c, color: (track.columnColors && track.columnColors[c]) || cols[i % cols.length] }));
  } else if (track.type === 'heatstrip' || track.type === 'multiheatmap') {
    const nums = [];
    if (track.type === 'multiheatmap' && track.columns && track.columns.length) {
      const ld = global.TreeAppData && global.TreeAppData.leafData;
      if (ld && ld.rows) ld.rows.forEach(r => { track.columns.forEach(c => { const v = parseFloat(r[c]); if (Number.isFinite(v)) nums.push(v); }); });
    }
    if (!nums.length) {
      Object.values(track.data || {}).forEach(raw => {
        if (raw == null || raw === '') return;
        String(raw).split(',').forEach(s => { const v = parseFloat(s); if (Number.isFinite(v)) nums.push(v); });
      });
    }
    const gMinRaw = track.gradientMin, gMaxRaw = track.gradientMax;
    let mn = (gMinRaw != null && gMinRaw !== '' && Number.isFinite(Number(gMinRaw))) ? Number(gMinRaw) : (nums.length ? Math.min(...nums) : 0);
    let mx = (gMaxRaw != null && gMaxRaw !== '' && Number.isFinite(Number(gMaxRaw))) ? Number(gMaxRaw) : (nums.length ? Math.max(...nums) : 1);
    if (mn === mx) mx = mn + 1;
    const isVertical = track.legendOrientation === 'vertical';
    const tickDecimals = Math.max(0, Math.min(6, track.legendTickDecimals != null && Number.isFinite(Number(track.legendTickDecimals)) ? Number(track.legendTickDecimals) : 2));
    const tickInterval = Number(track.legendTickInterval);
    let stops = getGradientStops(track);
    if (track.gradientReverse) stops = stops.slice().reverse();
    let ticks;
    if (Number.isFinite(tickInterval) && tickInterval > 0) {
      ticks = [];
      const start = Math.ceil(mn / tickInterval - 1e-9) * tickInterval;
      for (let v = start; v <= mx + 1e-9; v += tickInterval) { ticks.push(Number(v.toFixed(10))); if (ticks.length > 200) break; }
      if (!ticks.length) ticks = [mn, mx];
    } else {
      const tickCount = Math.max(2, Math.min(11, Number(track.legendTickCount) || 3));
      ticks = [];
      for (let i = 0; i < tickCount; i++) ticks.push(mn + (mx - mn) * i / (tickCount - 1));
    }
    const gid = 'tkl-grad-' + track.id + '-' + Math.random().toString(36).slice(2, 8);
    const defs = C.getSvg().querySelector('defs') || C.el('defs');
    const grad = C.el('linearGradient', { id: gid, x1: '0%', y1: isVertical ? '100%' : '0%', x2: isVertical ? '0%' : '100%', y2: '0%' }, defs);
    stops.forEach((c, i) => C.el('stop', { offset: (i / (stops.length - 1) * 100) + '%', 'stop-color': c }, grad));
    const barW = (isVertical ? 12 : 80) * scale;
    const barH = (isVertical ? 80 : 12) * scale;
    const g = C.el('g', { class: 'track-legend legend-box', 'data-legend': '1', 'data-track-id': track.id, style: 'cursor:move', transform: `translate(${x} ${y})` });
    let cursorY = 0;
    if (title) { drawText(g, 0, titleFS, title, titleStyle, tsTitle); cursorY = titleFS + 14; }
    C.el('rect', { x: 0, y: cursorY, width: barW, height: barH, fill: `url(#${gid})`, stroke: '#999', 'stroke-width': 0.5 }, g);
    ticks.forEach(v => {
      const t = Math.max(0, Math.min(1, (v - mn) / (mx - mn)));
      const pos = isVertical ? (cursorY + (1 - t) * barH) : (t * barW);
      const labelX = isVertical ? (barW + 4) : pos;
      const labelY = isVertical ? (pos + fs * 0.34) : (cursorY + barH + fs + 3);
      const anchor = isVertical ? 'start' : 'middle';
      drawText(g, labelX, labelY, Number(v).toFixed(tickDecimals), itemStyle, tsItem, { 'text-anchor': anchor });
    });
    return cursorY + barH + fs + 8;
  }
  if (!items.length) return 0;
  const g = C.el('g', { class: 'track-legend legend-box', 'data-legend': '1', 'data-track-id': track.id, style: 'cursor:move', transform: `translate(${x} ${y})` });
  let xx = 0, yy = 0, rowItems = 0;
  if (title) { drawText(g, 0, titleFS, title, titleStyle, tsTitle); yy = titleFS + 14; }
  let maxItemW = 0;
  items.forEach(it => { const w = fs + 8 + global.PlotCommon.measureText(it.label, fs); if (w > maxItemW) maxItemW = w; });
  items.forEach(it => {
    const wItem = fs + 8 + global.PlotCommon.measureText(it.label, fs);
    if (maxPerRow > 0 && rowItems >= maxPerRow) { xx = 0; yy += fs + 6; rowItems = 0; }
    if (drawAsSymbol) {
      const shapeStyle = trackShapeStyle(track);
      drawTrackSymbol(it.shape, xx + fs / 2, yy + fs / 2, fs * 0.45, it.color, shapeStyle.strokeColor, shapeStyle.strokeWidth, g, shapeStyle.fillOpacity);
    } else {
      C.el('rect', { x: xx, y: yy, width: fs, height: fs, fill: it.color, rx: 2 }, g);
    }
    drawText(g, xx + fs + 4, yy + fs * 0.85, it.label, itemStyle, tsItem);
    xx += (maxPerRow > 0 ? maxItemW : wItem) + 8;
    rowItems++;
  });
  return yy + fs + 8;
}

function renderCustomTracks(radial) {
  const maxD = Math.max(T.maxDepth(C.getRoot(), 0), 0.01);
  const st = C.state;
  if (st.mode === 'unrooted') return;
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
      if (!isFinite(labelLeft)) labelLeft = C.alignedLabelX() - C.ctx.maxTextWidth - 20;
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
    customTracks.forEach(t => { if (t.name) { const w = global.PlotCommon.measureText(t.name, nameFs); if (w > maxNameWidth) maxNameWidth = w; } });
    const lowestOffset = Math.abs((maxNameWidth / 2) * Math.sin(angleRad)) + Math.abs((nameFs / 2) * Math.cos(angleRad));
    const titleY = Math.min(...ys) - rowH * 0.55 - lowestOffset - 4;
    const placed = [];
    const titleStyle = TT.fromParts({ font: ff, size: nameFs, bold: tc.trackNameBold, italic: tc.trackNameItalic, color: "#3a4a4a" });
    customTracks.forEach(track => {
      if (track.type === 'legend') { placed.push({ track, x: xBase, w: 0 }); return; }
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
        TT.draw(null, cx, titleY, track.name, titleStyle, {
          "text-anchor": "middle", "dominant-baseline": "middle", "data-track-title": track.id,
          transform: trackNameAngle ? `rotate(${trackNameAngle} ${cx} ${titleY})` : undefined
        });
      }
      drawOneTrack(track, x, w, leaves, rowH, rowBounds, isInv);
      placed.push({ track, x, w });
    });
    let autoLegendX;
    if (isInv) {
      const root = C.getRoot();
      autoLegendX = (root ? (root.x || 0) : 800) + 40;
    } else autoLegendX = xBase + 24;
    let legendY = Math.min(...ys) - rowH * 0.85 - 10;
    placed.forEach(item => {
      if (!item.track.showLegend || item.track.type === 'text') return;
      if (item.track.legendX != null && item.track.legendY != null) {
        drawTrackLegend(item.track, item.track.legendX, item.track.legendY, getTrackColorMap(item.track));
      } else {
        const h = drawTrackLegend(item.track, autoLegendX, legendY, getTrackColorMap(item.track));
        legendY += h + 10;
      }
    });
    if (st.showLegend && global.TreeRanges && global.TreeRanges.colorRanges.length) {
      global.TreeLegend.drawLegend(autoLegendX, legendY);
    }
  } else {
    const cx = 470, cy = 380;
    const maxD2 = Math.max(T.maxDepth(C.getRoot(), 0), 0.01);
    const gl = leaves.map(l => l.angle).filter(a => a != null).sort((a, b) => a - b);
    const gStep = gl.length > 1 ? (gl[gl.length - 1] - gl[0]) / (gl.length - 1) : 6;
    const halfStep = gStep / 2;
    const isInv = C.isTrue(st.invert);
    const labelEdges = leaves.map(l => {
      let w = T.labelOf(l).length * st.fontSize * (l.labelSizeFactor || 1) * 0.6;
      const lbl = C.getSvg().querySelector('.leaf-label[data-id="' + l.id + '"]');
      if (lbl) { try { w = lbl.getBBox().width; } catch (_) {} }
      return isInv ? Math.max(4, C.getRadialLabelR() - w - 4) : (C.getRadialLabelR() + w + 4);
    });
    const ar = C.getAxisRange(maxD2);
    const tMaxUsed = Math.max(maxD2, ar.vHi);
    const rOutMax = L.getRadialInnerBase() + (285 * (st.scaleH || 1)) * tMaxUsed / maxD2;
    let rBase;
    if (isInv) rBase = Math.max(20, Math.min(...labelEdges) - 20);
    else rBase = Math.max(...labelEdges, C.getRadialLabelR(), rOutMax) + 20;
    if (global.TreeRanges && global.TreeRanges.colorRanges.length && global.TreeRanges.rangeLabelTrackShow) {
      rBase = global.TreeRanges.drawRadialRangeLabelTrack(rBase, leaves);
    }
    const placed = [];
    customTracks.forEach(track => {
      if (track.type === 'legend') { placed.push({ track, ringW: 0, ringStart: rBase }); return; }
      const ringW = Math.max(6, computeTrackWidth(track, { radial: true }));
      const colorMap = getTrackColorMap(track);
      const trackOffset = Number(track.offset) || 0;
      let ringStart, rMid;
      if (isInv) {
        rBase -= (gap + trackOffset);
        const outer = rBase;
        ringStart = Math.max(4, outer - ringW);
        const _customInner = Number(st.circularInvertInnerRadius);
        const _userBoundary = (Number.isFinite(_customInner) && _customInner > 0) ? _customInner : 0;
        if (_userBoundary > 0 && ringStart < _userBoundary) ringStart = _userBoundary;
        rMid = ringStart + ringW / 2;
        rBase = ringStart;
      } else {
        rBase += (gap + trackOffset);
        ringStart = rBase;
        rMid = ringStart + ringW / 2;
      }
      const isBarLike = track.type === 'bar' || track.type === 'stackedbar' || track.type === 'groupedbar';
      let halfAngle = halfStep;
      let stackDomain = null;
      let colRanges = null;
      if (isBarLike) {
        const fullArcPx = (2 * halfStep) * Math.PI / 180 * rMid;
        const bw = Number(track.barWidth);
        const barPx = (bw > 0) ? bw : fullArcPx * 0.6;
        const ratio = Math.max(0.05, Math.min(1, barPx / Math.max(1, fullArcPx)));
        halfAngle = halfStep * ratio;
      }
      if (track.type === 'stackedbar') stackDomain = barDomain(track, leaves, track.percentMode);
      else if (track.type === 'groupedbar') stackDomain = barDomain(track, leaves, false);
      else if (track.type === 'multiheatmap') {
        const allNums = [];
        leaves.forEach(l => {
          const raw = datasetValue(track, l);
          if (raw == null || raw === '') return;
          String(raw).split(',').forEach(s => { const v = parseFloat(s); if (Number.isFinite(v)) allNums.push(v); });
        });
        const gMinRaw = track.gradientMin, gMaxRaw = track.gradientMax;
        let gMin = (gMinRaw != null && gMinRaw !== '' && Number.isFinite(Number(gMinRaw))) ? Number(gMinRaw) : (allNums.length ? Math.min(...allNums) : 0);
        let gMax = (gMaxRaw != null && gMaxRaw !== '' && Number.isFinite(Number(gMaxRaw))) ? Number(gMaxRaw) : (allNums.length ? Math.max(...allNums) : 1);
        if (gMin === gMax) gMax = gMin + 1;
        colRanges = { min: gMin, max: gMax };
      }
      let barBoxAngles = null;
      if (isBarLike) {
        const sortedA = leaves.map(l => l.angle).filter(a => a != null).sort((a, b) => a - b);
        if (sortedA.length) {
          const aStart = sortedA[0] - halfAngle;
          const aEnd = sortedA[sortedA.length - 1] + halfAngle;
          barBoxAngles = { aStart, aEnd };
          if (track.showBox) {
            const large = (aEnd - aStart) > 180 ? 1 : 0;
            const rOuter = ringStart + ringW;
            const rInner = Math.max(0.5, ringStart);
            const p0i = L.polar(cx, cy, rInner, aStart);
            const p0o = L.polar(cx, cy, rOuter, aStart);
            const p1o = L.polar(cx, cy, rOuter, aEnd);
            const p1i = L.polar(cx, cy, rInner, aEnd);
            C.el('path', {
              d: `M ${p0i.x} ${p0i.y} L ${p0o.x} ${p0o.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${rInner} ${rInner} 0 ${large} 0 ${p0i.x} ${p0i.y} Z`,
              fill: 'none', stroke: track.boxColor || '#bbbbbb', 'stroke-width': Number(track.boxWidth) || 0.5, 'stroke-dasharray': track.boxDashed ? '4 3' : ''
            });
          }
        }
      }
      leaves.forEach(l => {
        if (l.angle == null) return;
        const v = datasetValue(track, l);
        const a0 = l.angle - halfAngle, a1 = l.angle + halfAngle;
        const drawRingSegment = (rIn, rOut, fill) => {
          const p0i = L.polar(cx, cy, rIn, a0), p0o = L.polar(cx, cy, rOut, a0);
          const p1o = L.polar(cx, cy, rOut, a1), p1i = L.polar(cx, cy, rIn, a1);
          C.el("path", { d: `M ${p0i.x} ${p0i.y} L ${p0o.x} ${p0o.y} A ${rOut} ${rOut} 0 0 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${rIn} ${rIn} 0 0 0 ${p0i.x} ${p0i.y} Z`, fill });
        };
        const segInner = (t) => isInv ? (ringStart + ringW * (1 - t)) : (ringStart + ringW * t);
        if (track.type === 'colorstrip') {
          if (v == null || v === '') return;
          if (isExcluded(track, v)) return;
          const fillOpacity = track.fillOpacity != null ? Number(track.fillOpacity) : 1;
          const p0i = L.polar(cx, cy, ringStart, a0), p0o = L.polar(cx, cy, ringStart + ringW, a0);
          const p1o = L.polar(cx, cy, ringStart + ringW, a1), p1i = L.polar(cx, cy, ringStart, a1);
          C.el("path", { d: `M ${p0i.x} ${p0i.y} L ${p0o.x} ${p0o.y} A ${ringStart + ringW} ${ringStart + ringW} 0 0 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${ringStart} ${ringStart} 0 0 0 ${p0i.x} ${p0i.y} Z`, fill: colorOf(track, v, colorMap), opacity: fillOpacity });
        } else if (track.type === 'heatstrip') {
          const nums = leaves.map(x => parseFloat(datasetValue(track, x))).filter(Number.isFinite);
          let mn = track.gradientMin, mx = track.gradientMax;
          if (!Number.isFinite(mn)) mn = Math.min(...nums);
          if (!Number.isFinite(mx)) mx = Math.max(...nums);
          if (mn === mx) mx = mn + 1;
          const num = parseFloat(v); if (!Number.isFinite(num)) return;
          let t = (num - mn) / (mx - mn);
          if (track.gradientReverse) t = 1 - t;
          drawRingSegment(ringStart, ringStart + ringW, sampleTrackColor(track, t));
        } else if (track.type === 'binary') {
          if (v == null || v === '') return;
          if (isExcluded(track, v)) return;
          const ok = evalBinaryLogic(track, v);
          if (!ok && !track.binaryShowFalse) return;
          const fill = ok ? track.binaryTrueColor : track.binaryFalseColor;
          const p = L.polar(cx, cy, rMid, l.angle);
          const autoSize = Math.min(ringW * 0.42, (gStep * Math.PI / 180) * rMid * 0.42);
          const shapeStyle = trackShapeStyle(track);
          const useManual = (tc.autoShapeSize === false) && Number(shapeStyle.size) > 0;
          const size = useManual ? Math.max(1, Number(shapeStyle.size)) : autoSize;
          const el = drawTrackSymbol(shapeStyle.shape || 'square', p.x, p.y, size, fill, shapeStyle.strokeColor, shapeStyle.strokeWidth, null, shapeStyle.fillOpacity);
          if (el) el.setAttribute("transform", `rotate(${(l.angle - 90)} ${p.x} ${p.y})`);
        } else if (track.type === 'bar') {
          const dom = barDomain(track, leaves, false);
          const { mn, mx } = dom;
          const axVal = Number(track.barAxisValue) || 0;
          const num = parseFloat(v); if (!Number.isFinite(num)) return;
          const t = Math.max(0, Math.min(1, (num - mn) / (mx - mn)));
          const tAxis = Math.max(0, Math.min(1, (axVal - mn) / (mx - mn)));
          const rStart = segInner(tAxis);
          const rEnd = segInner(t);
          const barColor = barColorOf(track, l, colorMap);
          drawRingSegment(Math.min(rStart, rEnd), Math.max(rStart, rEnd), barColor);
          if (track.showValues) {
            const tsB = trackTextStyle(track);
            const fs = Math.max(6, Number(tsB.fontSize) || 10);
            const pad = fs * 0.8 + 4;
            const rTxt = isInv ? (rEnd - pad) : (rEnd + pad);
            const pTxt = L.polar(cx, cy, rTxt, l.angle);
            let rot = l.angle - 90;
            if (l.angle > 180 && l.angle < 360) rot += 180;
            const style = TT.fromParts({ font: ff, size: fs, color: tsB.color || '#333', bold: tsB.bold });
            TT.draw(null, pTxt.x, pTxt.y, Number(num).toFixed(2), style, { 'text-anchor': 'middle', 'dominant-baseline': 'middle', transform: `rotate(${rot} ${pTxt.x} ${pTxt.y})` });
          }
        } else if (track.type === 'text') {
          if (v == null || v === '') return;
          if (isExcluded(track, v)) return;
          const txt = String(v);
          const ts = trackTextStyle(track);
          const fill = colorOf(track, txt, colorMap, ts.color);
          const p = L.polar(cx, cy, rMid, l.angle);
          let rot = l.angle - 90, anchor = 'start';
          if (l.angle > 180 && l.angle < 360) { rot += 180; anchor = 'end'; }
          const style = TT.fromParts({ font: ts.fontFamily || ff, size: ts.fontSize, bold: ts.bold, italic: ts.italic, color: fill });
          drawText(null, p.x, p.y, txt, style, ts, { 'text-anchor': anchor, 'dominant-baseline': 'middle', transform: `rotate(${rot} ${p.x} ${p.y})` });
        } else if (track.type === 'multisymbol') {
          if (v == null || v === '') return;
          if (isExcluded(track, v)) return;
          const key = String(v);
          const shapeStyle = trackShapeStyle(track);
          const shape = (track.shapeMap && track.shapeMap[key]) || shapeStyle.shape || 'square';
          const fill = colorOf(track, key, colorMap);
          const p = L.polar(cx, cy, rMid, l.angle);
          const autoSize = Math.min(ringW * 0.42, (gStep * Math.PI / 180) * rMid * 0.42);
          const useManual = (tc.autoShapeSize === false) && Number(shapeStyle.size) > 0;
          const size = useManual ? Math.max(1, Number(shapeStyle.size)) : autoSize;
          const el = drawTrackSymbol(shape, p.x, p.y, size, fill, shapeStyle.strokeColor, shapeStyle.strokeWidth, null, shapeStyle.fillOpacity);
          if (el) el.setAttribute("transform", `rotate(${(l.angle - 90)} ${p.x} ${p.y})`);
        } else if (track.type === 'stackedbar') {
          if (v == null || v === '') return;
          let vals = String(v).split(',').map(parseFloat);
          if (!vals.length) return;
          if (track.percentMode) {
            const tot0 = vals.reduce((a, b) => a + (Number.isFinite(b) ? Math.max(0, b) : 0), 0) || 1;
            vals = vals.map(x => Number.isFinite(x) ? Math.max(0, x) / tot0 * 100 : 0);
          }
          const span = stackDomain ? (stackDomain.mx - stackDomain.mn) : 1;
          const cols = global.TreePalette.getCategoricalScheme(track.palette || 'tableau10');
          let cum = 0;
          vals.forEach((val, i) => {
            const vv = Number.isFinite(val) ? Math.max(0, val) : 0;
            const nextCum = cum + vv;
            const r0 = isInv ? (ringStart + ringW * (1 - nextCum / (span || 1))) : (ringStart + ringW * cum / (span || 1));
            const r1 = isInv ? (ringStart + ringW * (1 - cum / (span || 1))) : (ringStart + ringW * nextCum / (span || 1));
            const color = (track.columnColors && track.columnColors[track.columns[i]]) || cols[i % cols.length];
            drawRingSegment(Math.min(r0, r1), Math.max(r0, r1), color);
            cum = nextCum;
          });
        } else if (track.type === 'pie') {
          if (v == null || v === '') return;
          const vals = String(v).split(',').map(x => { const num = parseFloat(x); return Number.isFinite(num) ? Math.max(0, num) : 0; });
          if (!vals.length) return;
          const center = L.polar(cx, cy, rMid, l.angle);
          const tot = vals.reduce((a, b) => a + b, 0) || 1;
          const useManual = (tc.autoShapeSize === false) && Number(track.pieRadius) > 0;
          const rPie = useManual ? Math.max(2, Number(track.pieRadius)) : Math.max(2, Math.min(Number(track.pieRadius) || 9, ringW * 0.45, (gStep * Math.PI / 180) * rMid * 0.45));
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
        } else if (track.type === 'groupedbar') {
          if (v == null || v === '') return;
          const vals = String(v).split(',').map(parseFloat);
          const N = (track.columns || []).length;
          if (!N) return;
          const dom = stackDomain || barDomain(track, leaves, false);
          const span = dom.mx - dom.mn || 1;
          const localHalf = halfAngle / N;
          const pal = global.TreePalette.getCategoricalScheme(track.palette || 'tableau10');
          vals.forEach((val, i) => {
            if (!Number.isFinite(val) || i >= N) return;
            const t = Math.max(0, Math.min(1, (val - dom.mn) / span));
            const rStart = isInv ? (ringStart + ringW) : ringStart;
            const rEnd = isInv ? (ringStart + ringW * (1 - t)) : (ringStart + ringW * t);
            const rIn = Math.min(rStart, rEnd);
            const rOut = Math.max(rStart, rEnd);
            const centerAngle = l.angle + (i - (N - 1) / 2) * (2 * localHalf);
            const a0b = centerAngle - localHalf, a1b = centerAngle + localHalf;
            const color = (track.columnColors && track.columnColors[track.columns[i]]) || pal[i % pal.length];
            const p0i = L.polar(cx, cy, rIn, a0b), p0o = L.polar(cx, cy, rOut, a0b);
            const p1o = L.polar(cx, cy, rOut, a1b), p1i = L.polar(cx, cy, rIn, a1b);
            C.el("path", { d: `M ${p0i.x} ${p0i.y} L ${p0o.x} ${p0o.y} A ${rOut} ${rOut} 0 0 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${rIn} ${rIn} 0 0 0 ${p0i.x} ${p0i.y} Z`, fill: color });
          });
        } else if (track.type === 'multiheatmap') {
          if (v == null || v === '') return;
          if (!colRanges) return;
          const vals = String(v).split(',').map(parseFloat);
          const N = (track.columns || []).length;
          if (!N) return;
          const cellW = ringW / N;
          vals.forEach((val, i) => {
            if (!Number.isFinite(val) || i >= N) return;
            let t = (val - colRanges.min) / (colRanges.max - colRanges.min);
            if (track.gradientReverse) t = 1 - t;
            const fill = sampleTrackColor(track, t);
            const r0 = ringStart + i * cellW, r1 = ringStart + (i + 1) * cellW;
            const a0b = l.angle - halfStep, a1b = l.angle + halfStep;
            const p0i = L.polar(cx, cy, r0, a0b), p0o = L.polar(cx, cy, r1, a0b);
            const p1o = L.polar(cx, cy, r1, a1b), p1i = L.polar(cx, cy, r0, a1b);
            C.el("path", { d: `M ${p0i.x} ${p0i.y} L ${p0o.x} ${p0o.y} A ${r1} ${r1} 0 0 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${r0} ${r0} 0 0 0 ${p0i.x} ${p0i.y} Z`, fill });
          });
        }
      });
      if (track.type === 'colorstrip' && track.showText) {
        const tsLocal = trackTextStyle(track);
        const verticalText = track.textOrientation === 'vertical';
        const drawOneText = (angle0, angle1, textVal) => {
          const midAngle = (angle0 + angle1) / 2;
          const radialOff = Number(track.colorstripTextOffsetX) || 0;
          const tangentOff = Number(track.colorstripTextOffsetY) || 0;
          const pR = L.polar(cx, cy, rMid + radialOff, midAngle);
          const pT = L.polar(0, 0, tangentOff, midAngle + 90);
          const p = { x: pR.x + pT.x, y: pR.y + pT.y };
          const arcLength = Math.max(2, (angle1 - angle0) * Math.PI / 180 * rMid);
          const availLength = verticalText ? Math.max(4, ringW - 4) : Math.max(4, arcLength - 4);
          const text = global.TreeDrawNode && global.TreeDrawNode.fitText
            ? global.TreeDrawNode.fitText(String(textVal), availLength, tsLocal.fontSize)
            : String(textVal);
          if (!text) return;
          let rot;
          if (verticalText) { rot = midAngle; if (midAngle > 90 && midAngle < 270) rot += 180; }
          else { rot = midAngle - 90; if (rot > 90) rot -= 180; if (rot < -90) rot += 180; }
          const style = TT.fromParts({
            font: tsLocal.fontFamily || ff, size: tsLocal.fontSize,
            bold: tsLocal.bold, italic: tsLocal.italic, color: tsLocal.color
          });
          drawText(null, p.x, p.y, text, style, tsLocal, {
            "text-anchor": "middle", "dominant-baseline": "middle",
            "pointer-events": "none",
            transform: `rotate(${rot} ${p.x} ${p.y})`
          });
        };
        if (track.mergeGroups) {
          let i = 0;
          while (i < leaves.length) {
            let j = i + 1;
            const v = String(datasetValue(track, leaves[i]) || '');
            while (j < leaves.length && String(datasetValue(track, leaves[j]) || '') === v) j++;
            if (v !== '' && leaves[i].angle != null) {
              drawOneText(leaves[i].angle - halfStep, leaves[j - 1].angle + halfStep, v);
            }
            i = j;
          }
        } else {
          leaves.forEach(l => {
            const v = datasetValue(track, l);
            if (v == null || v === '' || l.angle == null) return;
            drawOneText(l.angle - halfStep, l.angle + halfStep, v);
          });
        }
      }
      if (isBarLike && barBoxAngles) {
        const { aStart, aEnd } = barBoxAngles;
        const large = (aEnd - aStart) > 180 ? 1 : 0;
        if (track.showAxisNumbers) {
          const dom = barDomain(track, leaves, track.percentMode);
          const axV = track.type === 'bar' ? (Number(track.barAxisValue) || 0) : dom.mn;
          const tAxis = (dom.mx - dom.mn) ? (axV - dom.mn) / (dom.mx - dom.mn) : 0;
          const segAxis = isInv ? (ringStart + ringW * (1 - Math.max(0, Math.min(1, tAxis)))) : (ringStart + ringW * Math.max(0, Math.min(1, tAxis)));
          const pb0 = L.polar(cx, cy, segAxis, aStart);
          const pb1 = L.polar(cx, cy, segAxis, aEnd);
          C.el('path', { d: `M ${pb0.x} ${pb0.y} A ${segAxis} ${segAxis} 0 ${large} 1 ${pb1.x} ${pb1.y}`, fill: 'none', stroke: '#333', 'stroke-width': 0.8 });
        }
      }
      if (tc.trackNameShow && track.name) {
        const nameFs = Math.max(6, Number(tc.trackNameFontSize) || 11);
        const midR = ringStart + ringW / 2;
        const axisAngle = (Number(st.rotation) || 0) + (Number(st.axisRotation) || 0);
        const p = L.polar(cx, cy, midR, axisAngle);
        let rot = axisAngle;
        while (rot > 90) rot -= 180;
        while (rot < -90) rot += 180;
        const style = TT.fromParts({ font: ff, size: nameFs, bold: tc.trackNameBold, italic: tc.trackNameItalic, color: "#3a4a4a" });
        TT.draw(null, p.x, p.y, track.name, style, { "text-anchor": "middle", "dominant-baseline": "middle", "data-track-title": track.id, transform: `rotate(${rot} ${p.x} ${p.y})` });
      }
      const hitAngs = leaves.map(l => l.angle).filter(a => a != null);
      if (hitAngs.length) {
        const aStartHit = Math.min(...hitAngs) - halfStep;
        const aEndHit = Math.max(...hitAngs) + halfStep;
        const arcSpan2 = aEndHit - aStartHit;
        const largeArc = arcSpan2 > 180 ? 1 : 0;
        const p0i = L.polar(cx, cy, ringStart, aStartHit);
        const p0o = L.polar(cx, cy, ringStart, aEndHit);
        const p1o = L.polar(cx, cy, ringStart + ringW, aEndHit);
        const p1i = L.polar(cx, cy, ringStart + ringW, aStartHit);
        C.el("path", {
          d: `M ${p0i.x} ${p0i.y} A ${ringStart} ${ringStart} 0 ${largeArc} 1 ${p0o.x} ${p0o.y} L ${p1o.x} ${p1o.y} A ${ringStart + ringW} ${ringStart + ringW} 0 ${largeArc} 0 ${p1i.x} ${p1i.y} Z`,
          fill: "transparent", stroke: "none", "pointer-events": "all", "data-track-band": track.id, style: "cursor:grab"
        });
      }
      placed.push({ track, ringW, ringStart });
      rBase = isInv ? ringStart : (ringStart + ringW);
    });
    const _rootR = L.getRadialInnerBase() + (285 * (st.scaleH || 1)) * tMaxUsed / maxD2;
    const legendX = isInv ? (cx + _rootR + 40) : (cx + rBase + 40);
    let legendY = isInv ? (cy - _rootR) : (cy - 150);
    placed.forEach(item => {
      if (!item.track.showLegend || item.track.type === 'text') return;
      if (item.track.legendX != null && item.track.legendY != null) {
        drawTrackLegend(item.track, item.track.legendX, item.track.legendY, getTrackColorMap(item.track));
      } else {
        const h = drawTrackLegend(item.track, legendX, legendY, getTrackColorMap(item.track));
        legendY += h + 10;
      }
    });
    if (st.showLegend && global.TreeRanges && global.TreeRanges.colorRanges.length) {
      global.TreeLegend.drawLegend(legendX, legendY);
    }
  }
}

C.registerSnapshot('customTracks', () => ({
  tracks: JSON.parse(JSON.stringify(customTracks, (k, v) => {
    if (k === '_colorCache' || k === '_shapeCache' || k === 'data') return undefined;
    return v;
  })),
  trackSeq,
  trackCommon: { ...trackCommon }
}), s => {
  if (Array.isArray(s.tracks)) customTracks = s.tracks;
  if (typeof s.trackSeq === 'number') trackSeq = s.trackSeq;
  if (s.trackCommon) Object.assign(trackCommon, s.trackCommon);
  if (global.TreeTracks && global.TreeTracks.tracks) {
    global.TreeTracks.tracks.forEach(t => refreshTrackData(t));
  }
});

global.TreeTracks = {
  get tracks() { return customTracks; },
  get trackCommon() { return trackCommon; }, set trackCommon(v) { Object.assign(trackCommon, v); },
  trackTypeLabel, trackDefaultName, newTrackDefaults,
  addCustomTrack, updateCustomTrack, removeCustomTrack, toggleCustomTrack,
  buildTrackData, buildMultiTrackData, refreshTrackData,
  getTrackColorMap, collectUniqueValues, renderCustomTracks,
  computeTrackWidth, datasetValue, getBarColumnValues, getBarColorMap,
  drawTrackSymbol, sampleTrackColor, evalBinaryLogic,
  trackTextStyle, trackBorderStyle, trackShapeStyle,
  _legendDrawn: false
};
})(window);
(function (global) {
'use strict';
const ctx = {
  svg: null, root: null, idSeq: 0,
  viewBox: { x: 0, y: 0, w: 1000, h: 760 },
  radialLabelR: 320, selectedId: null, selectedBranchId: null,
  treeMaxX: 0, treeMinX: 0, maxTextWidth: 0, treeTop: 58, treeBottom: 0,
  rootX: 0, rootY: 0,
  state: {
    mode: "rectangular", rotation: 0, invert: false,
    unrootedDaylightIter: 0,
    lineShape: "straight", arc: 348, curvature: 0, slantSlope: 1.2,
    showLength: false, showBootstrap: false, bootstrapFormat: "raw",
    bootstrapRange: "auto",
    sortMode: "none", leafReverse: false,
    ignoreLength: false, branchLengthField: "", showRoot: true, labels: true,
    forceMidpointRoot: false,
    fontFamily: "Times New Roman", fontSize: 20, labelColor: "#222222",
    bold: false, italic: false,
    labelPosition: "aligned",
    labelAnchorRect: "left",
    labelAnchorCirc: "auto",
    labelShift: 0,
    showLegend: true, legendX: 760, legendY: 60, 
    legendColor: "#222222", legendTitle: "Groups",
    extendBranches: true, branchWidth: 1, branchColor: "#262626",
    rangeGradient: false, rangeOpacity: 0.85,
    dashed: false, dashSize: 0.3,
    nodeIds: false,
    leafSymbols: false, internalSymbols: false,
    leafSymShape: "square", leafSymSize: 5, leafSymFill: "#bdbdbd", leafSymBW: 1, leafSymBC: "#000000",
    intSymShape: "square", intSymSize: 5, intSymFill: "#bdbdbd", intSymBW: 1, intSymBC: "#000000",
    scaleH: 1, scaleV: 1, zoom: 1, panX: 0, panY: 0,
    circularInvertInnerRadius: 0,
    collapsedMode: "actual", collapsedTipOffset: 0,
    collapsedFill: "#dbe6f0", collapsedFillOpacity: 0.9,
    collapsedCompress: false, collapsedCompressLeafCount: 3,
    isTimeTree: false, timeTreeMeta: null,
    timeTreeMode: false, rootTickValue: 0,
    hasRoot: true,
    axisShow: true, axisPos: "bottom", axisRotation: 0, axisReverse: false,
    axisMinVal: null, axisMaxVal: null,
    axisExtendStart: 0, axisExtendEnd: 0,
    tickPrimary: { interval: 0, showLabels: true, showGrid: false, gridDashed: false, gridWidth: 1, gridColor: "#dddddd", customTicks: [] },
    tickSecondary: { interval: 0, showLabels: false, showGrid: false, gridDashed: false, gridWidth: 1, gridColor: "#dddddd", customTicks: [] },
    tickLabelFontSize: 15, tickLabelBold: false, tickLabelItalic: false,
    customTickColor: "#c0392b", customTickBold: true,
    timeScaleFactor: 1,
    showScaleBox: true, scaleBoxSize: 0, scaleBoxTitle: "Scale",
    scaleBoxOffsetX: 0, scaleBoxOffsetY: 0,
    lengthLabel: {
      show: false, fontSize: 9, bold: false, italic: false,
      color: "#000000", opacity: 1,
      decimals: 2, offsetX: 0, offsetY: -3,
      offsetTangent: 0, offsetRadial: 0,
      bgShow: false, bgColor: "#ffffff", bgOpacity: 1,
      bgBorderColor: "#999999", bgBorderWidth: 1, bgFill: "#ffffff",
      asTime: false, timeRootAge: 0, timeFactor: 1,
      ciField: ""
    },
    nodeLabels: [],
    nodeLabelCommon: {
      fontSize: 15, bold: false, italic: false,
      color: "#333333", opacity: 1,
      offsetX: -10, offsetY: -6,
      offsetTangent: 0, offsetRadial: -40,
      bgShow: false, bgBorderColor: "#999999", bgBorderWidth: 1, bgFill: "#ffffff",
      separator: "/", hideOnLeaves: false
    },
    pieMarker: {
      show: false, columns: [], palette: 'tableau10', columnColors: {},
      radius: 9, hideOnLeaves: false,
      offsetX: 0, offsetY: 0, offsetTangent: 0, offsetRadial: 0
    },
    rangeLabelConfig: {
      show: false, field: "",
      lineHeight: 8, color: "#67cb9e",
      outlineColor: "#333333", outlineWidth: 0,
      opacity: 0.8
    },
    extendLineStyle: {
      stroke: '#888888', strokeWidth: 1, opacity: 0.7,
      lineStyle: 'dashed', dashSize: 2, gapSize: 3
    },
    textStyles: {
      rangeLabel: { fontFamily: '', fontSize: 12, bold: true, italic: false, color: '#333333', opacity: 1,
                    bgShow: false, bgColor: '#ffffff', bgOpacity: 1, bgBorderColor: '#999999', bgBorderWidth: 0,
                    align: 'middle', x: null, y: null, offsetTangent: 0, offsetRadial: 0 },
      geoText:   { fontFamily: '', fontSize: 11, bold: true, italic: false, color: '#222222', opacity: 1,
                    bgShow: false, bgColor: '#ffffff', bgOpacity: 1, bgBorderColor: '#999999', bgBorderWidth: 0,
                    align: 'middle', x: null, y: null, offsetTangent: 0, offsetRadial: 0 },
      pieMarker: { fontFamily: '', fontSize: 10, bold: false, italic: false, color: '#333333', opacity: 1,
                    bgShow: false, bgColor: '#ffffff', bgOpacity: 1, bgBorderColor: '#999999', bgBorderWidth: 0,
                    align: 'middle', x: null, y: null, offsetTangent: 0, offsetRadial: 0 },
      scaleBoxTitle: { fontFamily: '', fontSize: 12, bold: true, italic: false, color: '#333333', opacity: 1,
                    bgShow: false, bgColor: '#ffffff', bgOpacity: 1, bgBorderColor: '#999999', bgBorderWidth: 0,
                    align: 'middle', x: null, y: null, offsetTangent: 0, offsetRadial: 0 },
      scaleBoxText:  { fontFamily: '', fontSize: 12, bold: false, italic: false, color: '#333333', opacity: 1,
                    bgShow: false, bgColor: '#ffffff', bgOpacity: 1, bgBorderColor: '#999999', bgBorderWidth: 0,
                    align: 'middle', x: null, y: null, offsetTangent: 0, offsetRadial: 0 },
      legendTitle:   { fontFamily: '', fontSize: 30, bold: true, italic: false, color: '#333333', opacity: 1,
                    bgShow: false, bgColor: '#ffffff', bgOpacity: 1, bgBorderColor: '#999999', bgBorderWidth: 0,
                    align: 'middle', x: null, y: null, offsetTangent: 0, offsetRadial: 0 },
      legendText:    { fontFamily: '', fontSize: 15, bold: false, italic: false, color: '#333333', opacity: 1,
                    bgShow: false, bgColor: '#ffffff', bgOpacity: 1, bgBorderColor: '#999999', bgBorderWidth: 0,
                    align: 'middle', x: null, y: null, offsetTangent: 0, offsetRadial: 0 },
      trackText:     { fontFamily: '', fontSize: 10, bold: false, italic: false, color: '#333333', opacity: 1,
                    bgShow: false, bgColor: '#ffffff', bgOpacity: 1, bgBorderColor: '#999999', bgBorderWidth: 0,
                    align: 'middle', x: null, y: null, offsetTangent: 0, offsetRadial: 0 }
    }
  }
};

const providers = [];
function registerSnapshot(name, get, set) { providers.push({ name, get, set }); }

function el(tag, attrs, parent) {
  if (!ctx.svg) return null;
  if (!parent) parent = ctx.svg;
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) node.setAttribute(k, v);
  });
  parent.appendChild(node);
  return node;
}

function isTrue(v) { return v === true || v === "true"; }

function getAxisRange(maxD) {
  const st = ctx.state;
  const isTime = !!st.timeTreeMode;
  const timeFactor = isTime ? (Number(st.timeScaleFactor) || 1) : 1;
  const rootTick = isTime ? (Number(st.rootTickValue) || 0) : 0;
  const dataDefaultMin = rootTick;
  const dataDefaultMax = rootTick + maxD * timeFactor;
  const minRaw = st.axisMinVal;
  const maxRaw = st.axisMaxVal;
  const hasMin = minRaw !== null && minRaw !== undefined && minRaw !== '' && Number.isFinite(Number(minRaw));
  const hasMax = maxRaw !== null && maxRaw !== undefined && maxRaw !== '' && Number.isFinite(Number(maxRaw));
  const dataMin = hasMin ? Number(minRaw) : dataDefaultMin;
  const dataMax = hasMax ? Number(maxRaw) : dataDefaultMax;
  const hLo = (dataMin - rootTick) / timeFactor;
  const hHi = (dataMax - rootTick) / timeFactor;
  return { vLo: Math.min(hLo, hHi), vHi: Math.max(hLo, hHi), hasMin, hasMax };
}

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
  return {
    root: JSON.parse(JSON.stringify(ctx.root, (k, v) => k === "parent" ? undefined : v)),
    state: Object.assign({}, ctx.state),
    extras
  };
}
function captureSnapshot() { return JSON.stringify(buildSnapshotObj()); }

function applySnapshot(raw) {
  const snap = JSON.parse(raw);
  if (snap.root) { ctx.root = snap.root; restoreParents(ctx.root, null); }
  if (snap.state) {
    Object.assign(ctx.state, snap.state);
    if (snap.state.axisMinVal === undefined) ctx.state.axisMinVal = 0;
    if (snap.state.axisMaxVal === undefined) ctx.state.axisMaxVal = 0;
  }
  if (snap.extras) providers.forEach(p => {
    if (p.name in snap.extras) { try { p.set(snap.extras[p.name]); } catch (_) {} }
  });
}

let alignedLabelXCache = 690;
function alignedLabelX() { return alignedLabelXCache; }

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

function emptyNode(parent) {
  return {
    name: "", length: 0.12, children: [], parent,
    collapsed: false, deleted: false, color: null, label: null,
    highlight: false, support: "", meta: [], _hasExplicitLength: false
  };
}

global.TreeCore = {
  ctx,
  get state() { return ctx.state; },
  getSvg: () => ctx.svg, setSvg: e => { ctx.svg = e; },
  getRoot: () => ctx.root, setRoot: r => { ctx.root = r; },
  getViewBox: () => ctx.viewBox, setViewBox: v => { ctx.viewBox = v; },
  getRadialLabelR: () => ctx.radialLabelR, setRadialLabelR: r => { ctx.radialLabelR = r; },
  getSelectedId: () => ctx.selectedId, setSelectedId: i => { ctx.selectedId = i; },
  getSelectedBranchId: () => ctx.selectedBranchId, setSelectedBranchId: i => { ctx.selectedBranchId = i; },
  get treeMaxX() { return ctx.treeMaxX; },
  get treeMinX() { return ctx.treeMinX; },
  get maxTextWidth() { return ctx.maxTextWidth; },
  get rootX() { return ctx.rootX; },
  get rootY() { return ctx.rootY; },
  setAlignedLabelX: v => { alignedLabelXCache = v; },
  nextId, resetIdSeq, restoreParents, branchLen, alignedLabelX, el,
  getAxisRange,
  captureSnapshot, applySnapshot, registerSnapshot, buildSnapshotObj,
  isTrue, emptyNode
};
})(window);
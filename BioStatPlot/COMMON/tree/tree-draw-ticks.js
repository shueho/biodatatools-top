(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const L = global.TreeLayout;

function isInvert() { return C.isTrue(C.state.invert); }

function niceRound(v) {
  if (!isFinite(v) || v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const n = v / base;
  let m;
  if (n < 1.5) m = 1;
  else if (n < 3.5) m = 2;
  else if (n < 7.5) m = 5;
  else m = 10;
  return m * base;
}

function timeTickText(v, interval) {
  const st = C.state;
  const rootTick = Number(st.rootTickValue) || 0;
  const timeFactor = Number(st.timeScaleFactor) || 1;
  const val = st.timeTreeMode ? (rootTick + v * timeFactor) : v;
  let prec = 2;
  if (interval != null && isFinite(interval) && interval > 0) {
    if (interval >= 10) prec = 0;
    else if (interval >= 1) prec = 1;
    else {
      prec = 0;
      const probe = Math.max(1e-12, interval);
      while (Math.abs(probe * Math.pow(10, prec) - Math.round(probe * Math.pow(10, prec))) > 1e-9 && prec < 8) prec++;
    }
  } else if (Math.abs(val) > 0 && Math.abs(val) < 0.01) {
    prec = Math.max(2, -Math.floor(Math.log10(Math.abs(val))) + 1);
  }
  let s = val.toFixed(prec);
  if (s.indexOf('.') >= 0) {
    s = s.replace(/\.?0+$/, '');
    if (s === '' || s === '-0') s = '0';
  }
  return s;
}

function drawRectTicks(root) {
  const st = C.state;
  if (st.lineShape === 'slanted') return;
  if (st.ignoreLength) return;
  const isInv = isInvert();
  const tP = st.tickPrimary || {};
  const tS = st.tickSecondary || {};
  const leaves = T.visibleLeaves(root);
  if (!leaves.length) return;
  const ys = leaves.map(l => l.y);
  const yTop = Math.min(...ys) - 10, yBot = Math.max(...ys) + 10;
  const isTop = st.axisPos === "top";
  const treeW = 560 * (st.scaleH || 1);
  const rootPos = root.x;
  const tipPos = isInv ? (root.x - treeW) : (root.x + treeW);
  const maxD = T.maxDepth(root, 0) || 1;
  const pxPerUnit = treeW / maxD;
  const yAxis = isTop ? (yTop - 20) : (yBot + 30);
  if (!st.axisShow) return;
  function tickPx(v) {
    const t = st.axisReverse ? (maxD - v) : v;
    return isInv ? (rootPos - t * pxPerUnit) : (rootPos + t * pxPerUnit);
  }
  function pxToV(px) {
    const t = isInv ? (rootPos - px) / pxPerUnit : (px - rootPos) / pxPerUnit;
    return st.axisReverse ? (maxD - t) : t;
  }
  const baseMinX = Math.min(rootPos, tipPos);
  const baseMaxX = Math.max(rootPos, tipPos);
  let axisMinX = baseMinX, axisMaxX = baseMaxX;
  const rl = st.rangeLabelConfig;
  if (rl && rl.show && rl.field) {
    T.allWalk(root, n => {
      if (!T.hasRealChildren(n)) return;
      const m = (n.meta || []).find(mm => mm.field === rl.field);
      if (m && Array.isArray(m.value) && m.value.length >= 2) {
        const lo = Number(m.value[0]), hi = Number(m.value[1]);
        if (Number.isFinite(lo)) { const x = tickPx(lo); axisMinX = Math.min(axisMinX, x); axisMaxX = Math.max(axisMaxX, x); }
        if (Number.isFinite(hi)) { const x = tickPx(hi); axisMinX = Math.min(axisMinX, x); axisMaxX = Math.max(axisMaxX, x); }
      }
    });
  }
  if (rootPos <= tipPos) axisMaxX = Math.min(axisMaxX, tipPos);
  else axisMinX = Math.max(axisMinX, tipPos);
  {
    const r = C.getAxisRange(maxD);
    const xLo = tickPx(r.vLo);
    const xHi = tickPx(r.vHi);
    if (Number.isFinite(xLo) && Number.isFinite(xHi)) {
      axisMinX = Math.min(axisMinX, xLo, xHi);
      axisMaxX = Math.max(axisMaxX, xLo, xHi);
    }
  }
  const extended = axisMinX < baseMinX - 1e-6 || axisMaxX > baseMaxX + 1e-6;
  C.el("line", { x1: axisMinX, y1: yAxis, x2: axisMaxX, y2: yAxis, stroke: "#333", "stroke-width": 1 });
  function drawOneTick(v, opts) {
    const px = tickPx(v);
    if (!Number.isFinite(px)) return;
    if (px < axisMinX - 1e-6 || px > axisMaxX + 1e-6) return;
    const fs = opts.fs || 11;
    const bold = !!opts.bold;
    const italic = !!opts.italic;
    const color = opts.color || "#333";
    const tickLen = opts.tickLen || 5;
    const tickY1 = isTop ? yAxis - tickLen : yAxis;
    const tickY2 = isTop ? yAxis : yAxis + tickLen;
    C.el("line", { x1: px, y1: tickY1, x2: px, y2: tickY2, stroke: color, "stroke-width": 1 });
    if (opts.showGrid) {
      const gy1 = isTop ? yAxis : yTop;
      const gy2 = isTop ? yBot : yAxis;
      C.el("line", {
        x1: px, y1: gy1, x2: px, y2: gy2,
        stroke: opts.gridColor || "#dddddd",
        "stroke-width": opts.gridWidth || 1,
        "stroke-dasharray": opts.gridDashed ? "4 3" : ""
      });
    }
    if (opts.showLabel !== false) {
      const ty = isTop ? (yAxis - tickLen - 4) : (yAxis + tickLen + 4);
      const anchor = isTop ? "start" : "end";
      const style = global.TreeText.fromParts({ font: st.fontFamily, size: fs, bold, italic, color });
      global.TreeText.draw(null, px, ty,
        opts.labelText != null ? opts.labelText : timeTickText(v, opts.precInterval),
        style, {
          dy: fs * 0.35,
          "text-anchor": anchor,
          transform: `rotate(-90 ${px} ${ty})`
        });
    }
  }
  const unifyFs = Math.max(6, Number(st.tickLabelFontSize) || 11);
  const interval = (tP.interval && tP.interval > 0) ? tP.interval : niceRound(maxD / 10);
  const isMajor = v => Math.abs(v / interval - Math.round(v / interval)) < 1e-6;

  if (!extended) {
    const steps = Math.ceil(maxD / interval) + 1;
    for (let i = 0; i < steps; i++) {
      const v = i * interval;
      if (v > maxD + 1e-6) break;
      drawOneTick(v, { fs: unifyFs, bold: st.tickLabelBold, italic: st.tickLabelItalic, showLabel: tP.showLabels !== false, showGrid: tP.showGrid, gridColor: tP.gridColor, gridWidth: tP.gridWidth, gridDashed: tP.gridDashed, precInterval: interval });
    }
  } else {
    const vA = pxToV(axisMinX), vB = pxToV(axisMaxX);
    const vLo = Math.min(vA, vB), vHi = Math.max(vA, vB);
    const vStart = Math.floor(vLo / interval - 1e-9) * interval;
    const vEnd = Math.ceil(vHi / interval + 1e-9) * interval;
    for (let i = 0; ; i++) {
      const v = vStart + i * interval;
      if (v > vEnd + 1e-6) break;
      drawOneTick(v, { fs: unifyFs, bold: st.tickLabelBold, italic: st.tickLabelItalic, showLabel: tP.showLabels !== false, showGrid: tP.showGrid, gridColor: tP.gridColor, gridWidth: tP.gridWidth, gridDashed: tP.gridDashed, precInterval: interval });
    }
  }
  const interval2 = (tS.interval && tS.interval > 0) ? tS.interval : (interval / 2);
  if (!extended) {
    const steps2 = Math.ceil(maxD / interval2) + 1;
    for (let i = 0; i < steps2; i++) {
      const v = i * interval2;
      if (v > maxD + 1e-6) break;
      if (isMajor(v)) continue;
      drawOneTick(v, { fs: unifyFs, bold: st.tickLabelBold, italic: st.tickLabelItalic, tickLen: 3, showLabel: tS.showLabels, showGrid: tS.showGrid, gridColor: tS.gridColor, gridWidth: tS.gridWidth, gridDashed: tS.gridDashed, precInterval: interval2 });
    }
  } else {
    const vA = pxToV(axisMinX), vB = pxToV(axisMaxX);
    const vLo = Math.min(vA, vB), vHi = Math.max(vA, vB);
    const vStart2 = Math.floor(vLo / interval2 - 1e-9) * interval2;
    const vEnd2 = Math.ceil(vHi / interval2 + 1e-9) * interval2;
    for (let i = 0; ; i++) {
      const v = vStart2 + i * interval2;
      if (v > vEnd2 + 1e-6) break;
      if (isMajor(v)) continue;
      drawOneTick(v, { fs: unifyFs, bold: st.tickLabelBold, italic: st.tickLabelItalic, tickLen: 3, showLabel: tS.showLabels, showGrid: tS.showGrid, gridColor: tS.gridColor, gridWidth: tS.gridWidth, gridDashed: tS.gridDashed, precInterval: interval2 });
    }
  }
  if (Array.isArray(tP.customTicks)) {
    tP.customTicks.forEach(v => {
      if (!isFinite(v)) return;
      drawOneTick(v, { fs: unifyFs, bold: st.customTickBold, italic: st.tickLabelItalic, color: st.customTickColor || "#c0392b", tickLen: 6, showLabel: true, showGrid: st.customTickGridShow !== false, gridColor: st.customTickColor || "#c0392b", gridWidth: 1, gridDashed: false });
    });
  }
}

function drawCircularTicks(root) {
  const st = C.state;
  const tP = st.tickPrimary || {};
  const tS = st.tickSecondary || {};
  if (!st.axisShow) return;
  if (st.ignoreLength) return;
  if (st.mode === 'unrooted') return;
  const maxD = T.maxDepth(root, 0) || 1;
  const innerBase = L.getRadialInnerBase ? L.getRadialInnerBase() : 0;
  const maxR = 285 * (st.scaleH || 1);
  const isInv = C.isTrue(st.invert);
  const isReverse = C.isTrue(st.axisReverse);
  const extEndT = Math.max(0, Number(st.axisExtendEnd) || 0) * maxD / maxR;
  const extStartT = Math.max(0, Number(st.axisExtendStart) || 0) * maxD / maxR;
  const ar = C.getAxisRange(maxD);

  const vToT = v => isReverse ? (maxD - v) : v;
  const tToV = t => isReverse ? (maxD - t) : t;
  const tToR = t => isInv
    ? innerBase + maxR * (maxD - t) / maxD
    : innerBase + maxR * t / maxD;

  const tHiUser = vToT(ar.vHi);
  const tLoUser = vToT(ar.vLo);
  let tMin = Math.min(0, tHiUser, tLoUser);
  let tMax = Math.max(maxD, tHiUser, tLoUser);

  const rl = st.rangeLabelConfig;
  if (rl && rl.show && rl.field) {
    T.allWalk(root, n => {
      const hasKids = (n.children || []).some(c => !c.deleted);
      if (!hasKids) return;
      const m = (n.meta || []).find(mm => mm.field === rl.field);
      if (!m || !Array.isArray(m.value) || m.value.length < 2) return;
      const lo = Number(m.value[0]), hi = Number(m.value[1]);
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) return;
      const tLo = vToT(lo), tHi = vToT(hi);
      tMin = Math.min(tMin, tLo, tHi);
      tMax = Math.max(tMax, tLo, tHi);
    });
  }
  tMin -= extStartT;
  tMax += extEndT;

  const rA = tToR(tMin), rB = tToR(tMax);
  const R_start = Math.max(0, Math.min(rA, rB));
  const R_total = Math.max(rA, rB);

  const vA = tToV(tMin), vB = tToV(tMax);
  const vLo = Math.min(vA, vB);
  const vHi = Math.max(vA, vB);

  const cx = 470, cy = 380;
  const axisAngle = (Number(st.rotation) || 0) + (Number(st.axisRotation) || 0);
  const unifyFs = Math.max(6, Number(st.tickLabelFontSize) || 11);
  const interval = (tP.interval && tP.interval > 0) ? tP.interval : niceRound((vHi - vLo) / 5);

  const axisRad = (axisAngle - 90) * Math.PI / 180;
  const ux = Math.cos(axisRad), uy = Math.sin(axisRad);
  const leftRad = (axisAngle - 180) * Math.PI / 180;
  const lx = Math.cos(leftRad), ly = Math.sin(leftRad);

  if (R_total > R_start + 0.5) {
    C.el("line", {
      x1: cx + R_start * ux, y1: cy + R_start * uy,
      x2: cx + R_total * ux, y2: cy + R_total * uy,
      stroke: "#333", "stroke-width": 1
    });
  }

  const tickLen = 5, labelGap = 4;
  let baseRot = axisAngle - 90;
  while (baseRot > 90) baseRot -= 180;
  while (baseRot < -90) baseRot += 180;

  function drawOneTickAt(v, opts) {
    const t = vToT(v);
    const r = tToR(t);
    if (!isFinite(r) || r < R_start - 0.5 || r > R_total + 0.5) return;
    const centerX = cx + r * ux, centerY = cy + r * uy;

    let gridOn, gridStroke, gridWidth, gridDash;
    if (opts.isCustom) {
      gridOn = st.customTickGridShow !== false;
      gridStroke = st.customTickColor || "#c0392b";
      gridWidth = 1;
      gridDash = "";
    } else if (opts.isSecondary) {
      gridOn = tS.showGrid;
      gridStroke = tS.gridColor || "#dddddd";
      gridWidth = tS.gridWidth || 1;
      gridDash = tS.gridDashed ? "4 3" : "";
    } else {
      gridOn = tP.showGrid;
      gridStroke = tP.gridColor || "#dddddd";
      gridWidth = tP.gridWidth || 1;
      gridDash = tP.gridDashed ? "4 3" : "";
    }
    if (gridOn && r > 0.5) {
      C.el("circle", {
        cx, cy, r, fill: "none",
        stroke: gridStroke, "stroke-width": gridWidth, "stroke-dasharray": gridDash
      });
    }

    const color = opts.color || "#333";
    const tickSize = opts.tickSize || tickLen;

    C.el("line", {
      x1: centerX, y1: centerY,
      x2: centerX + tickSize * lx, y2: centerY + tickSize * ly,
      stroke: color, "stroke-width": 1
    });

    if (opts.showLabel !== false) {
      const tx = centerX + (tickSize + labelGap) * lx;
      const ty = centerY + (tickSize + labelGap) * ly;
      const style = global.TreeText.fromParts({
        font: st.fontFamily,
        size: opts.fs || unifyFs,
        bold: opts.bold,
        italic: opts.italic,
        color
      });
      global.TreeText.draw(null, tx, ty,
        opts.labelText != null ? opts.labelText : timeTickText(v, opts.precInterval),
        style, {
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          transform: `rotate(${baseRot} ${tx} ${ty})`
        });
    }
  }
  const vStart = Math.ceil(vLo / interval - 1e-9) * interval;
  for (let v = vStart; v <= vHi + 1e-9; v += interval) {
    drawOneTickAt(v, {
      fs: unifyFs, bold: st.tickLabelBold, italic: st.tickLabelItalic,
      showLabel: tP.showLabels !== false, precInterval: interval
    });
  }
  const interval2 = (tS.interval && tS.interval > 0) ? tS.interval : (interval / 2);
  const vStart2 = Math.ceil(vLo / interval2 - 1e-9) * interval2;
  for (let v = vStart2; v <= vHi + 1e-9; v += interval2) {
    if (Math.abs(v / interval - Math.round(v / interval)) < 1e-6) continue;
    drawOneTickAt(v, {
      fs: Math.max(6, unifyFs * 0.9), bold: false, italic: st.tickLabelItalic,
      tickSize: 3, showLabel: tS.showLabels === true,
      isSecondary: true, precInterval: interval2
    });
  }
  if (Array.isArray(tP.customTicks)) {
    tP.customTicks.forEach(vv => {
      if (!isFinite(vv)) return;
      drawOneTickAt(vv, {
        fs: unifyFs, bold: st.customTickBold, italic: st.tickLabelItalic,
        color: st.customTickColor || "#c0392b", tickSize: 7, showLabel: true,
        isCustom: true
      });
    });
  }
}
global.TreeDrawTicks = { drawRectTicks, drawCircularTicks, niceRound, timeTickText };
})(window);
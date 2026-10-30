(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const L = global.TreeLayout;
const TT = global.TreeText;
const SS = global.TreeStyle;

function isInvert() { return C.isTrue(C.state.invert); }

function drawSymbol(shape, cx, cy, s, fill, strokeColor, strokeWidth, parent) {
  const attrs = { fill };
  if (strokeColor && strokeWidth > 0) { attrs.stroke = strokeColor; attrs["stroke-width"] = strokeWidth; }
  const el = (tag, a) => C.el(tag, a, parent);
  if (shape === "square") return el("rect", { x: cx - s, y: cy - s, width: s * 2, height: s * 2, ...attrs });
  if (shape === "triangle") return el("polygon", { points: `${cx},${cy - s} ${cx + s},${cy + s} ${cx - s},${cy + s}`, ...attrs });
  if (shape === "triangle-left") return el("polygon", { points: `${cx + s},${cy - s} ${cx - s},${cy} ${cx + s},${cy + s}`, ...attrs });
  if (shape === "triangle-right") return el("polygon", { points: `${cx - s},${cy - s} ${cx + s},${cy} ${cx - s},${cy + s}`, ...attrs });
  if (shape === "star") {
    let pts = "";
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? s * 0.45 : s;
      const a = (-90 + i * 36) * Math.PI / 180;
      pts += `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} `;
    }
    return el("polygon", { points: pts.trim(), ...attrs });
  }
  if (shape === "check") {
    const tx = el("text", { x: cx, y: cy + s * 0.7, "font-size": s * 2, "text-anchor": "middle", fill });
    tx.textContent = "✔";
    return tx;
  }
  if (shape === "diamond2" || shape === "diamond") {
    return el("polygon", { points: `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`, ...attrs });
  }
  return el("circle", { cx, cy, r: s, ...attrs });
}

function richTspans(text, runs) {
  const charStyle = [];
  for (let i = 0; i < text.length; i++) {
    let st = null;
    runs.forEach(r => { if (i >= r.start && i < r.end) st = r; });
    charStyle.push(st);
  }
  const groups = [];
  for (let i = 0; i < text.length; i++) {
    const last = groups[groups.length - 1];
    if (last && last.st === charStyle[i]) last.text += text[i];
    else groups.push({ st: charStyle[i], text: text[i] });
  }
  return groups;
}

function drawLeafLabel(n, radial) {
  const st = C.state;
  const text = T.labelOf(n);
  const size = st.fontSize * (n.labelSizeFactor || 1);
  let color = n.labelColor;
  if (!color && global.TreeRanges && global.TreeRanges.rangeColorLabels) {
    const c = global.TreeRanges.getRangeColorForNode(n);
    if (c) color = c;
  }
  if (!color) color = st.labelColor;
  const inv = isInvert();
  const isAligned = st.labelPosition === "aligned" && st.lineShape !== "slanted";
  const isUnrooted = st.mode === 'unrooted';
  const LABEL_GAP = 8;
  const shift = Number(st.labelShift || 0);
  let x, y, anchor = "start", rotate = 0;

  if (isUnrooted && radial) {
    const cX = 470, cY = 380;
    const dx = n.x - cX, dy = n.y - cY;
    const dist = Math.hypot(dx, dy) || 1;
    x = n.x + dx / dist * LABEL_GAP;
    y = n.y + dy / dist * LABEL_GAP;
    let rot = Math.atan2(dy, dx) * 180 / Math.PI;
    if (rot > 90) { rot -= 180; anchor = "end"; }
    else if (rot < -90) { rot += 180; anchor = "end"; }
    else anchor = "start";
    rotate = rot;
    if (st.extendBranches) C.el("line", { x1: n.x, y1: n.y, x2: x, y2: y, ...global.TreeDrawBranch.gapLineAttrs() });
  } else if (!radial) {
    y = n.y + size * .34;
    if (isAligned) {
      const alignX = C.alignedLabelX() + shift;
      const maxW = C.ctx.maxTextWidth || 100;
      const la = st.labelAnchorRect || "left";
      if (!inv) {
        if (la === "left") { x = alignX + LABEL_GAP; anchor = "start"; }
        else { x = alignX + maxW + LABEL_GAP * 2; anchor = "end"; }
      } else {
        if (la === "left") { x = alignX - maxW - LABEL_GAP * 2; anchor = "start"; }
        else { x = alignX - LABEL_GAP; anchor = "end"; }
      }
    } else {
      if (!inv) { x = n.x + LABEL_GAP + shift; anchor = "start"; }
      else { x = n.x - LABEL_GAP - shift; anchor = "end"; }
      if (st.extendBranches) C.el("line", { x1: n.x, y1: n.y, x2: x, y2: n.y, ...global.TreeDrawBranch.gapLineAttrs() });
    }
  } else {
    const angle = n.angle || 0;
    const rGapSigned = inv ? -LABEL_GAP : LABEL_GAP;
    let rLabel;
    if (isAligned) {
      rLabel = C.getRadialLabelR() + (inv ? -shift : shift);
    } else {
      const tipR = n.r || 0;
      const endR = Math.max(0, tipR + rGapSigned + (inv ? -shift : shift));
      rLabel = endR;
      if (st.extendBranches && Math.abs(endR - tipR) > 0.5) {
        const pA = L.polar(470, 380, tipR, angle);
        const pB = L.polar(470, 380, endR, angle);
        C.el("line", { x1: pA.x, y1: pA.y, x2: pB.x, y2: pB.y, ...global.TreeDrawBranch.gapLineAttrs() });
      }
    }
    const p = L.polar(470, 380, Math.max(4, rLabel), angle);
    x = p.x; y = p.y;
    const la = st.labelAnchorCirc || "auto";
    if (la === "left") anchor = "end";
    else if (la === "right") anchor = "start";
    else anchor = (angle > 180 && angle < 360) ? "end" : "start";
    rotate = angle - 90;
    if (anchor === "end") rotate += 180;
    if (inv) anchor = (anchor === "end") ? "start" : "end";
  }

  const style = TT.fromParts({ font: st.fontFamily, size: size, bold: st.bold || n.labelBold, italic: st.italic || n.labelItalic, color });
  const drawAttrs = {
    "text-anchor": anchor, class: "leaf-label", "data-id": n.id,
    transform: radial ? `rotate(${rotate} ${x} ${y})` : undefined
  };
  if (radial) drawAttrs["dominant-baseline"] = "central";
  const label = TT.draw(null, x, y, text, style, drawAttrs);
  if (n.styleRuns && n.styleRuns.length && label) {
    label.textContent = "";
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
  }
  if (n.labelBg && n.labelBg !== "transparent") {
    let bgX, bgY, bgW, bgH, bb = null;
    try { bb = label.getBBox(); } catch (_) {}
    if (bb && bb.width) { bgX = bb.x - 4; bgY = bb.y - 2; bgW = bb.width + 8; bgH = bb.height + 4; }
    else {
      const approxW = Math.max(18, text.length * size * 0.62);
      bgX = anchor === "end" ? x - approxW - 4 : x - 4;
      bgY = y - size * .78; bgW = approxW + 8; bgH = size * 1.12;
    }
    const bg = C.el("rect", { x: bgX, y: bgY, width: bgW, height: bgH, rx: 3, fill: n.labelBg, opacity: .88 });
    if (radial) bg.setAttribute("transform", `rotate(${rotate} ${x} ${y})`);
    C.getSvg().insertBefore(bg, label);
  }
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
  const prefix = (it.prefix != null) ? String(it.prefix) : "";
  if (prefix) return prefix + String(v);
  const rawStr = String(v).trim();
  if (rawStr.charAt(0) === '+') return rawStr;
  let mult = 1;
  if (it.multiplier != null && it.multiplier !== "" && Number.isFinite(Number(it.multiplier))) {
    mult = Number(it.multiplier);
  } else if (it.asPercent) {
    mult = 100;
  }
  if (mult !== 1) {
    const num = parseFloat(v);
    if (!Number.isFinite(num)) return String(v);
    return (num * mult).toFixed(d);
  }
  if (!isNaN(parseFloat(v)) && Number.isFinite(Number(v))) return Number(v).toFixed(d);
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
  const bgFill = cfg.bgColor || cfg.bgFill || "#eeeeee";
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
  const unrooted = C.state.mode === 'unrooted';
  if (radial && !unrooted) {
    const angle = n.angle || 0;
    const gap = Math.max(fs * 0.6, 6);
    const pNode = L.polar(470, 380, n.r || 0, angle);
    const radialOffset = gap + totalW / 2;
    const offP = L.polar(0, 0, radialOffset, angle);
    const offTangent = Number(cfg.offsetTangent) || 0;
    const offRadial = Number(cfg.offsetRadial) || 0;
    const tangentUser = L.polar(0, 0, offTangent, angle + 90);
    const radialUser = L.polar(0, 0, offRadial, angle);
    baseX = pNode.x + offP.x + tangentUser.x + radialUser.x;
    baseY = pNode.y + offP.y + tangentUser.y + radialUser.y;
    rot = angle - 90;
    if (rot > 90) rot -= 180;
    if (rot < -90) rot += 180;
  } else if (radial && unrooted) {
    baseX = n.x + (Number(offX) || 8);
    baseY = n.y + (Number(offY) || -6);
    rot = 0;
  } else {
    const inv = isInvert();
    const dx = Number(offX) || 0;
    const dy = Number(offY) || 0;
    baseX = inv ? n.x - dx : n.x + dx;
    baseY = n.y + dy;
  }
  const group = C.el("g", {
    transform: `translate(${baseX} ${baseY})${rot ? " rotate(" + rot + ")" : ""}`,
    class: "node-label-group", "data-node-label-group": "1", style: "cursor:move"
  });
  const textStyle = TT.fromParts({ font: st.fontFamily, size: fs, bold: cfg.bold, italic: cfg.italic, color: cfg.color || "#333333" });
  const baseYInGroup = radial ? radialShift : 0;
  const addSymbol = (v, cursorX) => {
    const size = mapSymbolSize(v.avg, v.item);
    const sym = drawSymbol(v.item.shape || "circle", cursorX + size, baseYInGroup, size, v.item.fillColor || "#E64B35", v.item.strokeColor, v.item.strokeWidth, group);
    if (sym) sym.setAttribute("data-id", n.id);
    return size * 2 + 4;
  };
  const addText = (content, cursorX, withBg, colorOverride) => {
    const useBgTextColor = withBg && fillColorAs === "background";
    const txtFill = useBgTextColor ? textColorOnBg : (colorOverride || textStyle.color);
    const tEl = TT.draw(group, cursorX, baseYInGroup, content, textStyle.clone({ color: txtFill }), { "text-anchor": "start", "data-id": n.id, opacity: (cfg.opacity != null ? cfg.opacity : 1) });
    if (withBg) {
      try {
        const bb = tEl.getBBox();
        const rect = C.el("rect", {
          x: bb.x - 3, y: bb.y - 1, width: bb.width + 6, height: bb.height + 2,
          fill: bgFill, rx: 2,
          "fill-opacity": Number(cfg.bgOpacity != null ? cfg.bgOpacity : 1),
          stroke: bgBorderWidth > 0 ? bgBorderColor : "none",
          "stroke-width": bgBorderWidth, "pointer-events": "none"
        }, group);
        group.insertBefore(rect, tEl);
      } catch (_) {}
    }
    return tEl;
  };

  const addMultiColorText = (pieces, cursorX, withBg) => {
    const useBgTextColor = withBg && fillColorAs === "background";
    const firstColor = pieces.length ? pieces[0].color : textStyle.color;
    const tEl = TT.draw(group, cursorX, baseYInGroup, "", textStyle.clone({ color: useBgTextColor ? textColorOnBg : firstColor }), {
      "text-anchor": "start", "data-id": n.id, opacity: (cfg.opacity != null ? cfg.opacity : 1)
    });
    tEl.textContent = "";
    pieces.forEach(p => {
      const span = C.el("tspan", { fill: useBgTextColor ? textColorOnBg : p.color }, tEl);
      span.textContent = p.text;
    });
    if (withBg) {
      try {
        const bb = tEl.getBBox();
        const rect = C.el("rect", {
          x: bb.x - 3, y: bb.y - 1, width: bb.width + 6, height: bb.height + 2,
          fill: bgFill, rx: 2,
          "fill-opacity": Number(cfg.bgOpacity != null ? cfg.bgOpacity : 1),
          stroke: bgBorderWidth > 0 ? bgBorderColor : "none",
          "stroke-width": bgBorderWidth, "pointer-events": "none"
        }, group);
        group.insertBefore(rect, tEl);
      } catch (_) {}
    }
    return tEl;
  };

  const showBg = !!cfg.bgShow || fillColorAs === "background";
  if (mergeText && textItems.length) {
    let cursorX = -totalW / 2;
    symbolItems.forEach(v => { cursorX += addSymbol(v, cursorX); });
    const colors = textItems.map(v => v.item.textColor || textStyle.color);
    const uniform = colors.every(c => c === colors[0]);
    if (uniform) {
      const combined = textItems.map(v => v.text).join(sep);
      if (combined) addText(combined, cursorX, showBg, colors[0]);
    } else {
      const pieces = [];
      textItems.forEach((v, i) => {
        if (i > 0 && sep) pieces.push({ text: sep, color: textStyle.color });      
        pieces.push({ text: v.text, color: v.item.textColor || textStyle.color }); 
      });
      addMultiColorText(pieces, cursorX, showBg);
    }
  } else {
    let cursorX = -totalW / 2;
    let hasText = false;
    valid.forEach(v => {
      if (v.kind === "symbol") {
        cursorX += addSymbol(v, cursorX);
        hasText = false;
      } else {
        let txt = v.text;
        if (hasText && sep) txt = sep + txt;
        const color = v.item.textColor || textStyle.color;
        const tEl = addText(txt, cursorX, showBg, color);
        let w = txt.length * fs * 0.6;
        try { w = tEl.getBBox().width; } catch (_) {}
        cursorX += w;
        hasText = true;
      }
    });
  }
}

function drawPieMarkerForNode(n, radial) {
  const st = C.state;
  const cfg = st.pieMarker;
  if (!cfg || !cfg.show || !cfg.columns || !cfg.columns.length) return null;
  if (cfg.hideOnLeaves) {
    const realKids = (n.children || []).filter(c => !c.deleted);
    if (realKids.length === 0) return null;
  }
  const vals = cfg.columns.map(col => {
    const m = (n.meta || []).find(mm => mm.field === col);
    if (!m) return 0;
    const v = parseFloat(Array.isArray(m.value) ? m.value[0] : m.value);
    return Number.isFinite(v) && v > 0 ? v : 0;
  });
  const total = vals.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let cx, cy;
  const unrooted = C.state.mode === 'unrooted';
  if (radial && !unrooted) {
    const angle = n.angle || 0;
    const p = L.polar(470, 380, (n.r || 0) + (Number(cfg.offsetRadial) || 0), angle);
    const t = L.polar(0, 0, Number(cfg.offsetTangent) || 0, angle + 90);
    cx = p.x + t.x; cy = p.y + t.y;
  } else {
    cx = n.x + (Number(cfg.offsetX) || 0);
    cy = n.y + (Number(cfg.offsetY) || 0);
  }
  const r = Math.max(2, Number(cfg.radius) || 9);
  const g = C.el('g', {
    class: 'pie-marker', 'data-pie-marker-group': '1', 'data-id': n.id,
    style: 'cursor:move', transform: `translate(${cx} ${cy})`
  });
  const pal = global.TreePalette.getCategoricalScheme(cfg.palette || 'tableau10');
  const colors = cfg.columns.map((col, i) => (cfg.columnColors && cfg.columnColors[col]) || pal[i % pal.length]);
  let a0 = -90;
  vals.forEach((v, i) => {
    if (v <= 0) return;
    const frac = v / total;
    const a1 = a0 + frac * 360;
    if (frac >= 0.999) {
      C.el('circle', { cx: 0, cy: 0, r, fill: colors[i], 'pointer-events': 'none' }, g);
      return;
    }
    const p0 = L.polar(0, 0, r, a0), p1 = L.polar(0, 0, r, a1);
    const large = (a1 - a0) > 180 ? 1 : 0;
    C.el('path', {
      d: `M 0 0 L ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y} Z`,
      fill: colors[i], 'pointer-events': 'none'
    }, g);
    a0 = a1;
  });
  C.el('circle', { cx: 0, cy: 0, r, fill: 'none', stroke: '#333', 'stroke-width': 0.8, 'pointer-events': 'none' }, g);
  return g;
}

function drawLengthLabel(parent, child, radial) {
  const st = C.state;
  const cfg = st.lengthLabel || {};
  if (!cfg.show) return;
  const isRoot = (parent === null || parent === undefined);
  if (!isRoot) {
    const realKids = (child.children || []).filter(c => !c.deleted);
    if (realKids.length === 0) return;
  }
  const ts = SS.textStyle(Object.assign({}, st.textStyles.trackText, {
    fontFamily: cfg.fontFamily || '',
    fontSize: cfg.fontSize || 9,
    bold: cfg.bold, italic: cfg.italic,
    color: cfg.color || '#000000',
    opacity: cfg.opacity != null ? Number(cfg.opacity) : 1,
    bgShow: !!cfg.bgShow,
    bgColor: cfg.bgColor || cfg.bgFill || '#ffffff',
    bgOpacity: cfg.bgOpacity != null ? Number(cfg.bgOpacity) : 1,
    bgBorderColor: cfg.bgBorderColor || '#999999',
    bgBorderWidth: cfg.bgBorderWidth != null ? Number(cfg.bgBorderWidth) : 0,
    x: cfg.offsetX != null ? cfg.offsetX : 0,
    y: cfg.offsetY != null ? cfg.offsetY : 0,
    offsetTangent: cfg.offsetTangent || 0,
    offsetRadial: cfg.offsetRadial || 0
  }));
  const fs = ts.fontSize;
  const offX = ts.x || 0;
  const offY = ts.y || 0;
  const offT = ts.offsetTangent || 0;
  const offR = ts.offsetRadial || 0;
  const decimals = Math.max(0, Math.min(6, Number(cfg.decimals) || 0));
  const root = C.getRoot();
  const totalDepth = Math.max(T.maxDepth(root, 0) || 1, 1e-9);
  const factor = Number(C.state.timeScaleFactor) || 1;
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
  let value; let ci = null;
  if (cfg.asTime) {
    let cum = 0;
    for (let c = child; c && c.parent; c = c.parent) cum += Number(c.length) || 0;
    value = depthToTime(cum);
    if (cfg.ciField) {
      const raw = getCiFromAncestors(child, cfg.ciField);
      if (raw) ci = [depthToTime(raw[0]), depthToTime(raw[1])];
    }
  } else {
    value = global.TreeDrawBranch.branchLenDisplay(child);
    if (cfg.ciField) {
      const raw = getCiFromAncestors(child, cfg.ciField);
      if (raw) ci = raw;
    }
  }
  let text = Number(value).toFixed(decimals);
  if (ci && Number.isFinite(ci[0]) && Number.isFinite(ci[1])) {
    text = `${text} (${ci[0].toFixed(decimals)} - ${ci[1].toFixed(decimals)})`;
  }
  let x, y, anchor = "middle", rot = 0;
  let radialShift = 0;
  const unrooted = C.state.mode === 'unrooted';
  if (radial && !unrooted) {
    const angle = child.angle || 0;
    const nodeR = child.r || 0;
    const inwardOffset = Math.max(fs * 0.8, 5);
    const halfW = text.length * fs * 0.6 / 2;
    const baseR = isRoot ? Math.max(fs * 2.5, nodeR + fs * 2) : Math.max(fs * 1.2, nodeR - inwardOffset - halfW);
    const finalR = baseR + offR;
    const p = L.polar(470, 380, finalR, angle);
    x = p.x; y = p.y;
    if (offT) {
      const tanP = L.polar(0, 0, offT, angle + 90);
      x += tanP.x; y += tanP.y;
    }
    rot = angle - 90;
    if (rot > 90) rot -= 180;
    if (rot < -90) rot += 180;
    radialShift = -fs * 0.5;
  } else if (radial && unrooted) {
    if (parent) {
      x = (parent.x + child.x) / 2 + offX;
      y = (parent.y + child.y) / 2 + offY;
      let ang = Math.atan2(child.y - parent.y, child.x - parent.x) * 180 / Math.PI;
      if (ang > 90) ang -= 180;
      if (ang < -90) ang += 180;
      rot = ang;
    } else {
      x = child.x + offX;
      y = child.y + offY;
    }
  } else {
    const shape = st.lineShape || "straight";
    if (cfg.asTime || isRoot) {
      x = child.x - 3 + offX;
      y = child.y - 3 + offY;
      anchor = "end";
    } else if (shape === "slanted" && parent) {
      x = (parent.x + child.x) / 2 + offX;
      y = (parent.y + child.y) / 2 + offY;
      let ang = Math.atan2(child.y - parent.y, child.x - parent.x) * 180 / Math.PI;
      if (ang > 90) ang -= 180;
      if (ang < -90) ang += 180;
      rot = ang;
    } else if (parent) {
      x = (parent.x + child.x) / 2 + offX;
      y = child.y - 3 + offY;
    } else {
      x = child.x + offX;
      y = child.y + offY;
    }
  }
  const transforms = [];
  if (rot) transforms.push(`rotate(${rot} ${x} ${y})`);
  if (radialShift) transforms.push(`translate(0 ${radialShift})`);
  const transformStr = transforms.length ? transforms.join(" ") : undefined;
  const style = TT.fromParts({ font: ts.fontFamily || st.fontFamily, size: fs, bold: ts.bold, italic: ts.italic, color: ts.color });
  const textEl = TT.draw(null, x, y, text, style, {
    "text-anchor": anchor, "dominant-baseline": "middle",
    "data-id": child.id, "data-length-label": "1", class: "length-label",
    style: "cursor:move", transform: transformStr,
    opacity: ts.opacity != null ? ts.opacity : 1
  });
  if (ts.bgShow && textEl) {
    try {
      const bb = textEl.getBBox();
      const rect = C.el("rect", {
        x: bb.x - 3, y: bb.y - 2, width: bb.width + 6, height: bb.height + 4,
        fill: ts.bgColor || "#ffffff", "fill-opacity": ts.bgOpacity,
        stroke: (ts.bgBorderWidth > 0) ? (ts.bgBorderColor || "#999999") : "none",
        "stroke-width": ts.bgBorderWidth || 0,
        "data-length-label": "1", class: "length-label", style: "cursor:move",
        transform: transformStr
      });
      C.getSvg().insertBefore(rect, textEl);
    } catch (_) {}
  }
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
  const isInv = C.isTrue(st.invert);
  const isUnrooted = C.state.mode === 'unrooted';
  let tipPoint;
  if (isUnrooted) {
    const dx = (n.x || 0) - 470, dy = (n.y || 0) - 380;
    const d = Math.hypot(dx, dy) || 1;
    tipPoint = { x: n.x + dx / d * tipOffset, y: n.y + dy / d * tipOffset };
  } else {
    tipPoint = radial
      ? L.polar(470, 380, Math.max(0, isInv ? (n.r || 0) - tipOffset : (n.r || 0) + tipOffset), n.angle || 0)
      : { x: (n.x || 0) + (isInv ? -tipOffset : tipOffset), y: (n.y || 0) };
  }
  let points;
  if (isUnrooted) {
    const sorted = [...hiddenLeaves].sort((a, b) => Math.atan2(a.y - 380, a.x - 470) - Math.atan2(b.y - 380, b.x - 470));
    const first = sorted[0], last = sorted[sorted.length - 1];
    points = `${tipPoint.x},${tipPoint.y} ${first.x},${first.y} ${last.x},${last.y}`;
  } else if (radial) {
    const sorted = [...hiddenLeaves].sort((a, b) => (a.angle || 0) - (b.angle || 0));
    const first = sorted[0], last = sorted[sorted.length - 1];
    if (useExtended) {
      const baseR = isInv ? Math.max(4, C.getRadialLabelR() + 10) : (C.getRadialLabelR() - 10);
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
      const baseX = isInv ? (C.alignedLabelX() + 10) : (C.alignedLabelX() - 10);
      const sY = (n._slotStart != null) ? n._slotStart : (first.y || 0);
      const eY = (n._slotEnd != null) ? n._slotEnd : (last.y || 0);
      points = `${tipPoint.x},${tipPoint.y} ${baseX},${sY} ${baseX},${eY}`;
    } else {
      points = `${tipPoint.x},${tipPoint.y} ${first.x || 0},${first.y || 0} ${last.x || 0},${last.y || 0}`;
    }
  }
  if (tipOffset > 0) {
    C.el("line", {
      x1: n.x || 0, y1: n.y || 0, x2: tipPoint.x, y2: tipPoint.y,
      stroke: "#6b7c8c", "stroke-width": 1.5, "stroke-linecap": "round", "pointer-events": "none"
    });
  }
  C.el("polygon", {
    points, fill, stroke: "#6b7c8c", "stroke-width": 1.5,
    "stroke-linejoin": "round", "fill-opacity": fillOpacity,
    class: "collapsed-clade clickable", "data-id": n.id
  });
}
function collectHiddenLeaves(n) {
  const out = [];
  (function rec(m) {
    if (m.deleted) return;
    const kids = (m.children || []).filter(c => !c.deleted);
    if (!kids.length) { out.push(m); return; }
    kids.forEach(rec);
  })(n);
  return out;
}

function drawNodesAndLabels(radial) {
  const st = C.state;
  const selId = C.getSelectedId();
  const branchSel = C.getSelectedBranchId();
  _nodeValueRangeCache = {};
  T.walk(C.getRoot(), n => {
    const realKids = (n.children || []).filter(c => !c.deleted);
    if (n.collapsed && realKids.length) {
      drawCollapsedTriangle(n, collectHiddenLeaves(n), radial);
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
      const tip = n.meta.map(f => {
        const v = Array.isArray(f.value) ? "[" + f.value.join(", ") + "]" : f.value;
        return f.field + ": " + v;
      }).join(" · ");
      C.el("title", {}, hotspot).textContent = tip;
    }
    if (n.id === selId) {
      if (radial) {
        if (C.state.mode === 'unrooted') {
          C.el("circle", { cx: n.x, cy: n.y, r: 12, fill: "none", stroke: "#ff4b4b", "stroke-width": 2.5, "pointer-events": "none", class: "selection-arrow" }).setAttribute("data-selected-for", n.id);
        } else {
          const angle = n.angle || 0;
          const off = 16, half = 6;
          const tip = L.polar(470, 380, (n.r || 0) + off, angle);
          const baseA = L.polar(470, 380, (n.r || 0) + off + 12, angle + half);
          const baseB = L.polar(470, 380, (n.r || 0) + off + 12, angle - half);
          C.el("polygon", { points: `${tip.x},${tip.y} ${baseA.x},${baseA.y} ${baseB.x},${baseB.y}`, fill: "#ff4b4b", stroke: "#ffffff", "stroke-width": 1.5, "stroke-linejoin": "round", class: "selection-arrow", "pointer-events": "none" }).setAttribute("data-selected-for", n.id);
        }
      } else {
        const tipX = sx - 4, backX = tipX - 14, halfH = 8;
        C.el("polygon", { points: `${tipX},${sy} ${backX},${sy - halfH} ${backX},${sy + halfH}`, fill: "#ff4b4b", stroke: "#ffffff", "stroke-width": 1.5, "stroke-linejoin": "round", class: "selection-arrow", "pointer-events": "none" }).setAttribute("data-selected-for", n.id);
      }
    }
    if (n.id === branchSel && n.parent) {
      if (radial) {
        if (C.state.mode === 'unrooted') {
          const mx = (n.parent.x + n.x) / 2, my = (n.parent.y + n.y) / 2;
          C.el("polygon", { points: `${mx - 6},${my - 4} ${mx + 6},${my - 4} ${mx},${my + 6}`, fill: "#ff4b4b", stroke: "#ffffff", "stroke-width": 1, "pointer-events": "none" });
        } else {
          const midR = ((n.r || 0) + (n.parent.r || 0)) / 2;
          const p = L.polar(470, 380, midR, n.angle || 0);
          C.el("polygon", { points: `${p.x - 6},${p.y - 4} ${p.x + 6},${p.y - 4} ${p.x},${p.y + 6}`, fill: "#ff4b4b", stroke: "#ffffff", "stroke-width": 1, "pointer-events": "none" });
        }
      } else {
        const mx = (n.parent.x + n.x) / 2;
        C.el("polygon", { points: `${mx - 6},${n.y - 4} ${mx + 6},${n.y - 4} ${mx},${n.y + 6}`, fill: "#ff4b4b", stroke: "#ffffff", "stroke-width": 1, "pointer-events": "none" });
      }
    }
    if (st.nodeIds && !T.isLeaf(n)) {
      const style = TT.fromParts({ font: st.fontFamily, size: 10, color: "#7a8484" });
      TT.draw(null, n.x + 6, n.y - 6, n.uid, style, { class: "node-label", "data-id": n.id });
    }
    if (st.showBootstrap && !T.isLeaf(n) && n.support) {
      const style = TT.fromParts({ font: st.fontFamily, size: 10, color: "#b5651d" });
      TT.draw(null, n.x - 4, n.y - 5, formatBootstrapValue(n.support), style, { "text-anchor": "end", "data-id": n.id });
    }
    if (st.labels && T.isLeaf(n)) drawLeafLabel(n, radial);
    drawNodeLabels(n, radial);
    if (st.pieMarker && st.pieMarker.show) drawPieMarkerForNode(n, radial);
  });
  const rootForLabel = C.getRoot();
  if (rootForLabel && st.lengthLabel && st.lengthLabel.show) {
    const rk = (rootForLabel.children || []).filter(c => !c.deleted);
    if (rk.length) drawLengthLabel(null, rootForLabel, radial);
  }
}

function formatBootstrapValue(raw, mode) {
  const text = String(raw == null ? "" : raw);
  const format = mode || C.state.bootstrapFormat || "auto";
  if (!text || format === "raw") return text;
  return text.split("/").map(part => {
    const value = Number(part);
    if (!Number.isFinite(value)) return part;
    const scale = format === "percent" || (format === "auto" && value >= 0 && value <= 1);
    return scale ? String(Number((value * 100).toFixed(6))) : part;
  }).join("/");
}

function labelRightEdge() {
  const st = C.state;
  const leaves = T.visibleLeaves(C.getRoot());
  let r = -Infinity;
  C.getSvg().querySelectorAll(".leaf-label").forEach(label => {
    try {
      const b = label.getBBox();
      if (isFinite(b.x) && isFinite(b.width)) r = Math.max(r, b.x + b.width);
    } catch (_) {}
  });
  if (!isFinite(r)) {
    r = C.alignedLabelX();
    leaves.forEach(l => {
      const startX = st.labelPosition === "aligned" ? C.alignedLabelX() + 10 : l.x + 10;
      const w = (global.PlotCommon && PlotCommon.measureText)
        ? PlotCommon.measureText(T.labelOf(l), st.fontSize)
        : T.labelOf(l).length * st.fontSize * 0.6;
      r = Math.max(r, startX + w);
    });
  }
  return r + 10;
}

function drawRangeLabels(radial) {
  const st = C.state;
  if (!radial && st.lineShape === 'slanted') return;
  if (C.state.mode === 'unrooted') return;
  const cfg = st.rangeLabelConfig || {};
  if (!cfg.show || !cfg.field) return;
  const root = C.getRoot(); if (!root) return;
  const field = cfg.field;
  const maxD = Math.max(T.maxDepth(root, 0), 0.01);
  const treeW = 560 * (st.scaleH || 1);
  const innerBase = L.getRadialInnerBase ? L.getRadialInnerBase() : 24;
  const maxR = 285 * (st.scaleH || 1);
  const isInv = isInvert();
  const left = 90;
  const scale = treeW / maxD;
  const lineH = Math.max(1, Number(cfg.lineHeight) || 8);
  const color = cfg.color || "#67cb9e";
  const outlineW = Math.max(0, Number(cfg.outlineWidth) || 0);
  const outlineColor = cfg.outlineColor || "#333333";
  const opacity = Math.max(0, Math.min(1, Number(cfg.opacity != null ? cfg.opacity : 0.8)));
  T.allWalk(root, n => {
    if (n.deleted) return;
    if (!T.hasRealChildren(n)) return;
    const m = (n.meta || []).find(mm => mm.field === field);
    if (!m) return;
    const v = m.value;
    if (!Array.isArray(v) || v.length < 2) return;
    const lo = Number(v[0]), hi = Number(v[1]);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return;
    if (!radial) {
      const ciPx = (val) => {
        const t = st.axisReverse ? (maxD - val) : val;
        return isInv ? (left + treeW - t * scale) : (left + t * scale);
      };
      const posLo = ciPx(lo), posHi = ciPx(hi);
      const x0 = Math.min(posLo, posHi), x3 = Math.max(posLo, posHi);
      const y = n.y;
      if (outlineW > 0) {
        C.el("line", { x1: x0, x2: x3, y1: y, y2: y, stroke: outlineColor, "stroke-width": lineH + outlineW * 2, "stroke-linecap": "butt", "pointer-events": "none", opacity });
      }
      C.el("line", { x1: x0, x2: x3, y1: y, y2: y, stroke: color, "stroke-width": lineH, "stroke-linecap": "butt", "pointer-events": "none", opacity });
    } else {
      const isRev = C.isTrue(st.axisReverse);
      let r1 = innerBase + maxR * ((isRev ? maxD - lo : lo) / maxD);
      let r2 = innerBase + maxR * ((isRev ? maxD - hi : hi) / maxD);
      if (isInv) { r1 = innerBase + maxR - (r1 - innerBase); r2 = innerBase + maxR - (r2 - innerBase); }
      const rLo = Math.min(r1, r2), rHi = Math.max(r1, r2);
      const angle = n.angle || 0;
      const p1 = L.polar(470, 380, rLo, angle), p2 = L.polar(470, 380, rHi, angle);
      if (outlineW > 0) {
        C.el("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: outlineColor, "stroke-width": lineH + outlineW * 2, "stroke-linecap": "butt", "pointer-events": "none", opacity });
      }
      C.el("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: color, "stroke-width": lineH, "stroke-linecap": "butt", "pointer-events": "none", opacity });
    }
  });
}

global.TreeDrawNode = {
  formatBootstrapValue, drawSymbol, richTspans, drawLeafLabel,
  drawNodesAndLabels, labelRightEdge, drawNodeLabels, drawRangeLabels,
  drawLengthLabel, drawPieMarkerForNode
};
})(window);
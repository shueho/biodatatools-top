(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const L = global.TreeLayout;

const GAP_COLOR = "#888888";

function isDashed() { return C.isTrue(C.state.dashed); }
function gapLineAttrs() {
  return {
    stroke: GAP_COLOR, "stroke-width": 1,
    "stroke-linecap": "round", "stroke-dasharray": "2 3",
    fill: "none", opacity: .7, "pointer-events": "none"
  };
}
function branchStroke(n) {
  const st = C.state;
  if (n.branchColor) return n.branchColor;
  if (n.highlight) return n.rangeColor || "#e64b35";
  if (global.TreeRanges && global.TreeRanges.rangeColorBranches) {
    const c = global.TreeRanges.getRangeColorForNode(n);
    if (c) return c;
  }
  return st.branchColor;
}
function commonLineAttrs(n, opts) {
  opts = opts || {};
  const st = C.state;
  const dashed = n.branchDash !== undefined ? n.branchDash : isDashed();
  const dash = dashed ? `${Math.max(1, st.dashSize * 8)} ${Math.max(2, st.dashSize * 12)}` : "";
  const selected = n.id === C.getSelectedBranchId();
  const attrs = {
    stroke: selected ? "#ff4b4b" : branchStroke(n),
    "stroke-width": st.branchWidth * (n.branchWidthFactor || 1) * (selected ? 1.8 : 1),
    "stroke-linecap": "round",
    "stroke-dasharray": dash,
    fill: "none", opacity: .94, "data-id": n.id
  };
  if (opts.noPointer) attrs["pointer-events"] = "none";
  else {
    attrs.class = "branch-line clickable";
    attrs.style = "cursor:pointer";
    if (opts.branchId) attrs["data-branch-id"] = opts.branchId;
  }
  return attrs;
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

function drawRectBranch(parent, child) {
  const st = C.state;
  const shape = st.lineShape || "straight";

  if (shape === "slanted") {
    C.el("line", {
      x1: parent.x, y1: parent.y,
      x2: child.x, y2: child.y,
      ...commonLineAttrs(child, { branchId: child.id })
    });
  } else {
    const c = Math.max(0, Math.min(1, Number(st.curvature) || 0));
    const x1 = parent.x, y1 = parent.y;
    const x2 = child.x, y2 = child.y;
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (c <= 0.001 || Math.abs(dx) < 0.5 || Math.abs(dy) < 0.5) {
      C.el("path", {
        d: `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`,
        ...commonLineAttrs(child, { branchId: child.id })
      });
    } else {
      const yV = y1 + dy * (1 - c);
      const xQ = x1 + dx * c;
      const d = `M ${x1} ${y1} L ${x1} ${yV} Q ${x1} ${y2} ${xQ} ${y2} L ${x2} ${y2}`;
      C.el("path", { d, ...commonLineAttrs(child, { branchId: child.id }) });
    }
  }

  if (st.lengthLabel && st.lengthLabel.show) {
    global.TreeDrawNode.drawLengthLabel(parent, child, false);
  } else if (st.showLength) {
    const lenVal = branchLenDisplay(child);
    const style = global.TreeText.fromParts({ font: C.state.fontFamily, size: 9, color: '#9aa3a3' });
    global.TreeText.draw(null, (parent.x + child.x) / 2, child.y - 3,
      lenVal.toFixed(lenVal < 0.1 ? 3 : 2), style,
      { "text-anchor": "middle", "data-id": child.id });
  }
  if (st.extendBranches && st.labelPosition === "aligned" && T.isLeaf(child) && !child.collapsed) {
    const LABEL_GAP = 8;
    const shift = Number(st.labelShift || 0);
    const la = st.labelAnchorRect || "left";
    const maxW = C.ctx.maxTextWidth || 100;
    const inv = C.isTrue(st.invert);
    const alignX = C.alignedLabelX() + shift;
    let targetX;
    if (!inv) targetX = la === "left" ? alignX + LABEL_GAP - 2 : alignX + maxW + LABEL_GAP * 2;
    else targetX = la === "left" ? alignX - maxW - LABEL_GAP * 2 : alignX - LABEL_GAP + 2;
    if (Math.abs(targetX - child.x) > 0.5) {
      C.el("line", { x1: child.x, y1: child.y, x2: targetX, y2: child.y, ...gapLineAttrs() });
    }
  }
  if (child.truncated) {
    const mx = (parent.x + child.x) / 2, my = child.y;
    C.el("line", { x1: mx - 5, y1: my + 6, x2: mx - 1, y2: my - 6, stroke: "#3a3a3a", "stroke-width": 1.8, "stroke-linecap": "round" });
    C.el("line", { x1: mx + 1, y1: my + 6, x2: mx + 5, y2: my - 6, stroke: "#3a3a3a", "stroke-width": 1.8, "stroke-linecap": "round" });
  }
}

function drawRadialBranch(parent, child) {
  const st = C.state;
  const parentAtCenter = (parent.r || 0) < 0.5;
  if (parentAtCenter) {
    C.el("line", { x1: parent.x, y1: parent.y, x2: child.x, y2: child.y, ...commonLineAttrs(child, { branchId: child.id }) });
  } else {
    const arcStart = L.polar(470, 380, parent.r, parent.angle);
    const arcEnd = L.polar(470, 380, parent.r, child.angle);
    let diff = child.angle - parent.angle;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    const sweep = diff > 0 ? 1 : 0;
    C.el("path", {
      d: `M ${arcStart.x} ${arcStart.y} A ${parent.r} ${parent.r} 0 0 ${sweep} ${arcEnd.x} ${arcEnd.y}`,
      ...commonLineAttrs(child, { branchId: child.id }),
      opacity: .94
    });
    C.el("line", { x1: arcEnd.x, y1: arcEnd.y, x2: child.x, y2: child.y, ...commonLineAttrs(child, { branchId: child.id }) });
  }
  if (st.extendBranches && st.labelPosition === "aligned" && T.isLeaf(child) && !child.collapsed) {
    const shift = Number(st.labelShift || 0);
    const isInv = C.isTrue(st.invert);
    const tipR = child.r || 0;
    const rEnd = isInv
      ? Math.max(0, C.getRadialLabelR() - shift + 2)
      : C.getRadialLabelR() + shift - 2;
    if (isInv ? (rEnd < tipR - 0.5) : (rEnd > tipR + 0.5)) {
      const tip = L.polar(470, 380, tipR, child.angle || 0);
      const end = L.polar(470, 380, rEnd, child.angle || 0);
      C.el("line", { x1: tip.x, y1: tip.y, x2: end.x, y2: end.y, ...gapLineAttrs() });
    }
  }
  if (child.truncated) {
    const mx = (parent.x + child.x) / 2, my = (parent.y + child.y) / 2;
    C.el("line", { x1: mx - 5, y1: my + 5, x2: mx - 1, y2: my - 5, stroke: "#3a3a3a", "stroke-width": 1.8, "stroke-linecap": "round" });
    C.el("line", { x1: mx + 1, y1: my + 5, x2: mx + 5, y2: my - 5, stroke: "#3a3a3a", "stroke-width": 1.8, "stroke-linecap": "round" });
  }
  if (st.lengthLabel && st.lengthLabel.show) {
    global.TreeDrawNode.drawLengthLabel(parent, child, true);
  } else if (st.showLength) {
    const mx = (parent.x + child.x) / 2, my = (parent.y + child.y) / 2;
    const lenVal = branchLenDisplay(child);
    const style = global.TreeText.fromParts({ font: C.state.fontFamily, size: 9, color: '#9aa3a3' });
    global.TreeText.draw(null, mx, my - 2, lenVal.toFixed(lenVal < 0.1 ? 3 : 2), style, { "text-anchor": "middle" });
  }
}

global.TreeDrawBranch = {
  branchStroke, commonLineAttrs, gapLineAttrs,
  drawRectBranch, drawRadialBranch, branchLenDisplay
};
})(window);
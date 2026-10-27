(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;

function polar(cx, cy, r, aDeg) {
  const a = (aDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function sortTreeByMode() {
  const st = C.state; const mode = st.sortMode || "none";
  if (mode === "none") return;
  T.allWalk(C.getRoot(), n => {
    if (!n.children) return;
    n.children.sort((a, b) => {
      const av = T.visibleLeaves(a).length, bv = T.visibleLeaves(b).length;
      return mode === "ascending" ? av - bv : bv - av;
    });
  });
}
function collapsedOcc(n) {
  const st = C.state;
  const inner = T.countInnerLeaves(n);
  if (!st.collapsedCompress) return Math.max(1, inner);
  return Math.max(1, Math.min(inner, Math.max(1, Number(st.collapsedCompressLeafCount) || 3)));
}
function isCollapsedBranch(c) { return c.collapsed && (c.children || []).some(k => !k.deleted); }

function assignInnerY(n, startY, endY) {
  const kids = (n.children || []).filter(c => !c.deleted);
  if (!kids.length) { n.y = (startY + endY) / 2; return; }
  const weights = kids.map(c => isCollapsedBranch(c) ? collapsedOcc(c) : T.countInnerLeaves(c));
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  let cur = startY;
  kids.forEach((c, i) => {
    const w = (endY - startY) * weights[i] / total;
    if (isCollapsedBranch(c)) {
      c.y = cur + w / 2;
      c._slotStart = cur;
      c._slotEnd = cur + w;
      assignInnerY(c, cur, cur + w);
    } else assignInnerY(c, cur, cur + w);
    cur += w;
  });
  n.y = kids.reduce((s, c) => s + (c.y || 0), 0) / kids.length;
}

function layoutRect() {
  sortTreeByMode();
  const st = C.state;
  const top = 58, bottom = 52, left = 90;
  const isSlanted = (st.lineShape === 'slanted') && (st.mode === 'rectangular');
  const isInv = C.isTrue(st.invert);
  const scaleH = st.scaleH || 1;
  const rowH = Math.max(14, st.fontSize * 1.05) * (st.scaleV || 1);

  let maxD;
  if (isSlanted) {
    maxD = 0;
    (function measure(n, level) {
      if (n.deleted) return;
      if (level > maxD) maxD = level;
      const kids = (n.children || []).filter(c => !c.deleted);
      if (!kids.length) return;
      kids.forEach(c => measure(c, level + 1));
    })(C.getRoot(), 0);
    if (maxD < 1) maxD = 1;
  } else {
    maxD = Math.max(T.maxDepth(C.getRoot()), .01);
  }

  const units = [];
  (function collect(n) {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (!kids.length) { units.push({ node: n, isCollapsed: false, occ: 1 }); return; }
    if (n.collapsed) { units.push({ node: n, isCollapsed: true, occ: collapsedOcc(n) }); return; }
    kids.forEach(collect);
  })(C.getRoot());
  let cursor = top;
  units.forEach(u => {
    const totalH = u.occ * rowH;
    if (u.isCollapsed) {
      u.node.y = cursor + totalH / 2;
      u.node._slotStart = cursor;
      u.node._slotEnd = cursor + totalH;
      assignInnerY(u.node, cursor, cursor + totalH);
    } else {
      u.node.y = cursor + rowH / 2;
      u.node._slotStart = cursor;
      u.node._slotEnd = cursor + rowH;
    }
    cursor += totalH;
  });
  (function assignInternalY(n) {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (!kids.length) return;
    kids.forEach(assignInternalY);
    if (n.collapsed) return;
    let mn = Infinity, mx = -Infinity;
    kids.forEach(c => {
      const cy = c.y || 0;
      if (cy < mn) mn = cy;
      if (cy > mx) mx = cy;
    });
    n.y = (mn + mx) / 2;
  })(C.getRoot());
  (function computeLeafYRange(n) {
    if (n.deleted) return [Infinity, -Infinity];
    const kids = (n.children || []).filter(c => !c.deleted);
    if (!kids.length) {
      n.lminy = n.y;
      n.lmaxy = n.y;
      return [n.y, n.y];
    }
    let mn = Infinity, mx = -Infinity;
    kids.forEach(c => {
      const r = computeLeafYRange(c);
      if (r[0] < mn) mn = r[0];
      if (r[1] > mx) mx = r[1];
    });
    n.lminy = mn;
    n.lmaxy = mx;
    return [mn, mx];
  })(C.getRoot());
   let treeW;
  if (isSlanted) {
    treeW = 560 * scaleH;
    const root = C.getRoot();

    (function computeRanges(n) {
      if (n.deleted) return [Infinity, -Infinity];
      const kids = (n.children || []).filter(c => !c.deleted);
      if (!kids.length || n.collapsed) {
        n.lminy = n.y;
        n.lmaxy = n.y;
        return [n.y, n.y];
      }
      let mn = Infinity, mx = -Infinity;
      kids.forEach(c => {
        const r = computeRanges(c);
        if (r[0] < mn) mn = r[0];
        if (r[1] > mx) mx = r[1];
      });
      n.lminy = mn;
      n.lmaxy = mx;
      n.y = (mn + mx) / 2;
      return [mn, mx];
    })(root);

    const range = Math.max(1e-9, Math.abs((root.lmaxy || 0) - (root.lminy || 0)));
    const slopeK = (2 * treeW) / range;   // = 1 / tan(angle)
    const tanAngle = 1 / slopeK;

    const rootSpan = ((root.lminy || 0) + (root.lmaxy || 0)) /
                     Math.max(1, T.visibleLeaves(root).length);

    function assignSlanted(n, parentX, parentY) {
      if (n.deleted) return;
      if (n.curSlanted) delete n.curSlanted;

      const kids = T.visibleChildren(n);

      if (!kids.length) {
        n.x = isInv ? left : (left + treeW);
        n.depth = Math.abs(n.x - (isInv ? (left + treeW) : left));
        return;
      }

      if (kids.length > 2) {
        kids.sort((a, b) => (a.lminy || 0) - (b.lminy || 0));
      }

      kids.forEach(c => {
        if (c.deleted) return;

        let x;
        if (n.curSlanted != null) {
          const dy = c.y - n.curSlanted - rootSpan;
          const d = treeW - dy / tanAngle;
          x = isInv ? (left + treeW - d) : (left + d);
        } else {
          const dy = Math.abs(c.y - n.y);
          x = isInv ? (parentX - dy * slopeK) : (parentX + dy * slopeK);
        }

        if (isInv) {
          if (x > left + treeW) x = left + treeW;
          if (x < left) x = left;
        } else {
          if (x < left) x = left;
          if (x > left + treeW) x = left + treeW;
        }
        c.x = x;
        c.depth = Math.abs(x - (isInv ? (left + treeW) : left));

        if (kids.length > 2) {
          n.curSlanted = c.lmaxy;
        }

        assignSlanted(c, c.x, c.y);
      });
    }

    root.x = isInv ? (left + treeW) : left;
    root.depth = isInv ? treeW : 0;
    assignSlanted(root, root.x, root.y);
  } else {
    treeW = 560 * scaleH;
    (function assign(n, depth) {
      if (n.deleted) return;
      n.depth = depth;
      const d = depth / maxD;
      const rel = isInv ? (1 - d) : d;
      n.x = left + rel * treeW;
      const kids = (n.children || []).filter(c => !c.deleted);
      if (!kids.length) return;
      kids.forEach(c => assign(c, depth + C.branchLen(c)));
      if (n.collapsed) return;
      n.y = kids.reduce((sum, c) => sum + (c.y || 0), 0) / kids.length;
    })(C.getRoot(), 0);
  }

  const allLeaves = T.collectInnerLeaves(C.getRoot());
  let tMax = left, tMin = left + treeW;
  allLeaves.forEach(l => {
    if (l.x > tMax) tMax = l.x;
    if (l.x < tMin) tMin = l.x;
  });
  const maxText = Math.max(...allLeaves.map(l => T.labelOf(l).length), 8);
  C.ctx.treeMaxX = tMax;
  C.ctx.treeMinX = tMin;
  C.ctx.maxTextWidth = maxText * st.fontSize * 0.62;
  C.ctx.treeTop = top;
  C.ctx.treeBottom = cursor;
  C.ctx.rootX = C.getRoot().x;
  C.ctx.rootY = C.getRoot().y;
  const GAP = 20;
  C.setAlignedLabelX(isInv ? (tMin - GAP) : (tMax + GAP));
  const contentH = cursor + bottom;
  const minCanvasH = Math.max(240, contentH);
  const extraPad = (minCanvasH - contentH) / 2;
  let vx, vw;
  if (isInv) {
    vx = tMin - GAP - C.ctx.maxTextWidth - 60;
    vw = Math.max(940, (left + treeW) - vx + 60);
  } else {
    vx = 0;
    vw = Math.max(940, tMax + GAP + C.ctx.maxTextWidth + 60);
  }
  C.setViewBox({ x: vx, y: -extraPad, w: vw, h: minCanvasH });
}

function daylightLeaves(n) {
  const out = [];
  (function rec(m) {
    if (m.deleted) return;
    const kids = (m.children || []).filter(k => !k.deleted);
    if (!kids.length || m.collapsed) { out.push(m); return; }
    kids.forEach(rec);
  })(n);
  return out;
}
function nodeRadiusFromCenter(n) { return Math.hypot(n.ux || 0, n.uy || 0); }
function visualWidthPixels(n, scale) {
  const ls = daylightLeaves(n);
  if (ls.length < 2) return Math.max(6, scale * 0.1);
  const angles = ls.map(l => {
    let a = Number(l.angle);
    if (!Number.isFinite(a)) a = 0;
    return ((a % 360) + 360) % 360;
  }).sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 0; i < angles.length; i++) {
    const next = (i + 1 < angles.length) ? angles[i + 1] : angles[0] + 360;
    const gap = next - angles[i];
    if (gap > maxGap) maxGap = gap;
  }
  const spanDeg = 360 - maxGap;
  const arc = spanDeg * Math.PI / 180;
  const rMin = Math.min(...ls.map(l => nodeRadiusFromCenter(l)));
  return Math.max(6, 2 * rMin * Math.sin(arc / 2));
}
function minAngleAtNode(n, scale) {
  const r = Math.max(nodeRadiusFromCenter(n), 1e-6);
  const w = visualWidthPixels(n, scale);
  const ratio = Math.min(1, w / (2 * r));
  return Math.max(0.5, 2 * Math.asin(ratio) * 180 / Math.PI);
}
function equalDaylight(root, scale, maxIter) {
  maxIter = Math.max(0, Number(maxIter) || 0);
  function recompute() {
    (function assignPositions(n, pux, puy, pd) {
      if (n === root) {
        n.ux = 0; n.uy = 0; n.depth = 0;
      } else {
        const len = C.branchLen(n) * scale;
        const rad = ((n.angle || 0) - 90) * Math.PI / 180;
        n.ux = pux + len * Math.cos(rad);
        n.uy = puy + len * Math.sin(rad);
        n.depth = pd + C.branchLen(n);
      }
      const kids = (n.children || []).filter(c => !c.deleted);
      if (n.collapsed) {
        kids.forEach(c => {
          c.ux = n.ux; c.uy = n.uy; c.depth = n.depth;
        });
        return;
      }
      kids.forEach(c => assignPositions(c, n.ux, n.uy, n.depth));
    })(root, 0, 0, 0);
  }

  if (maxIter <= 0) { recompute(); return; }

  for (let it = 0; it < maxIter; it++) {
    recompute();
    let maxDelta = 0;
    (function walk(n) {
      if (n.collapsed) return;
      const kids = (n.children || []).filter(c => !c.deleted);
      if (!kids.length) return;
      kids.forEach(walk);

      if (n._slotStartA == null || n._slotEndA == null) {
        let s = Infinity, e = -Infinity;
        kids.forEach(c => {
          if (c._slotStartA != null) s = Math.min(s, c._slotStartA);
          if (c._slotEndA != null) e = Math.max(e, c._slotEndA);
        });
        if (!isFinite(s)) return;
        n._slotStartA = s;
        n._slotEndA = e;
      }

      const span = n._slotEndA - n._slotStartA;
      if (span <= 0) return;

      let mins = kids.map(c => minAngleAtNode(c, scale));
      let totalMin = mins.reduce((a, b) => a + b, 0);
      if (totalMin > span) {
        const f = span / totalMin;
        mins = mins.map(m => m * f);
        totalMin = span;
      }
      const leafCounts = kids.map(c => T.countInnerLeaves(c));
      const totalLeaves = leafCounts.reduce((a, b) => a + b, 0) || 1;
      const avail = Math.max(0, span - totalMin);
      let cur = n._slotStartA;
      kids.forEach((c, i) => {
        const w = mins[i] + avail * (leafCounts[i] / totalLeaves);
        const mid = cur + w / 2;
        const delta = Math.abs((c.angle || mid) - mid);
        if (delta > maxDelta) maxDelta = delta;
        c.angle = mid;
        c._slotStartA = cur;
        c._slotEndA = cur + w;
        if (c.collapsed && c.children && c.children.length) {
          (function reassign(m, startA, spanA) {
            const ks = (m.children || []).filter(k => !k.deleted);
            if (!ks.length) return;
            const weights = ks.map(k => T.countInnerLeaves(k));
            const totalW = weights.reduce((s, v) => s + v, 0) || 1;
            let cur2 = startA;
            ks.forEach((k, j) => {
              const kw = spanA * weights[j] / totalW;
              k._slotStartA = cur2;
              k._slotEndA = cur2 + kw;
              k.angle = cur2 + kw / 2;
              cur2 += kw;
              if (k.collapsed) reassign(k, k._slotStartA, kw);
            });
          })(c, cur, w);
        }
        cur += w;
      });

      n.angle = (n._slotStartA + n._slotEndA) / 2;
    })(root);
    if (maxDelta < 0.05) break;
  }
  recompute();
}

function getRadialInnerBase() {
  const st = C.state;
  const root = C.getRoot();
  if (!root) return 0;
  const maxR = 285 * (st.scaleH || 1);
  const maxD = Math.max(T.maxDepth(root, 0), 1e-9);
  if (maxD <= 0) return 0;
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
  const ar = C.getAxisRange(maxD);
  vMin = Math.min(vMin, ar.vLo);
  vMax = Math.max(vMax, ar.vHi);

  const isRev = C.isTrue(st.axisReverse);
  const tMin = isRev ? (maxD - vMax) : vMin;
  let base = 0;
  if (tMin < -1e-9) base = Math.max(0, -tMin * maxR / maxD);

  const extStart = Math.max(0, Number(st.axisExtendStart) || 0);
  base += extStart;

  if (C.isTrue(st.invert)) {
    const customInner = Number(st.circularInvertInnerRadius);
    const userBoundary = (Number.isFinite(customInner) && customInner > 0) ? customInner : 0;
    const tc = (global.TreeTracks && global.TreeTracks.trackCommon) || {};
    const gap = Math.max(0, Number(tc.trackGap) || 0);

    let maxLabelW = 0;
    T.visibleLeaves(root).forEach(l => {
      const w = T.labelOf(l).length * st.fontSize * (l.labelSizeFactor || 1) * 0.6;
      if (w > maxLabelW) maxLabelW = w;
    });

    let tracksW = 0;
    if (global.TreeTracks && Array.isArray(global.TreeTracks.tracks)) {
      global.TreeTracks.tracks.forEach(t => {
        const w = global.TreeTracks.computeTrackWidth(t, { radial: true });
        tracksW += gap + Math.max(6, w);
      });
    }

    let rangeW = 0;
    if (global.TreeRanges && Array.isArray(global.TreeRanges.colorRanges)
        && global.TreeRanges.colorRanges.length
        && global.TreeRanges.rangeLabelTrackShow) {
      rangeW = gap + (Number(global.TreeRanges.rangeLabelTrackWidth) || 60);
    }

    const pad = 36;
    const innerMin = userBoundary > 0 ? userBoundary : (maxR + 200);
    base = Math.max(base, innerMin + tracksW + rangeW + maxLabelW + pad);
  }
  return base;
}
function assignInnerAngle(n, startA, endA) {
  const kids = (n.children || []).filter(c => !c.deleted);
  if (!kids.length) { n.angle = (startA + endA) / 2; return; }
  const weights = kids.map(c => isCollapsedBranch(c) ? collapsedOcc(c) : T.countInnerLeaves(c));
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  let cur = startA;
  kids.forEach((c, i) => {
    const w = (endA - startA) * weights[i] / total;
    if (isCollapsedBranch(c)) {
      c.angle = cur + w / 2;
      c._slotStartA = cur;
      c._slotEndA = cur + w;
      assignInnerAngle(c, cur, cur + w);
    } else assignInnerAngle(c, cur, cur + w);
    cur += w;
  });
  n.angle = kids.reduce((s, c) => s + (c.angle || 0), 0) / kids.length;
}

function layoutRadial() {
  sortTreeByMode();
  const st = C.state; const cx = 470, cy = 380;
  const innerBase = getRadialInnerBase();
  const maxR = 285 * (st.scaleH || 1);
  const maxD = Math.max(T.maxDepth(C.getRoot()), .01);
  const openGap = Math.max(0, 360 - (st.arc || 348));
  const start = st.rotation + openGap / 2;
  const span = 360 - openGap;
  const units = [];
  (function collect(n) {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (!kids.length) { units.push({ node: n, isCollapsed: false, occ: 1 }); return; }
    if (n.collapsed) { units.push({ node: n, isCollapsed: true, occ: collapsedOcc(n) }); return; }
    kids.forEach(collect);
  })(C.getRoot());
  const totalOcc = units.reduce((s, u) => s + u.occ, 0) || 1;
  const slotW = span / totalOcc;
  let order = 0;
  units.forEach(u => {
    const slotStart = start + order * slotW;
    const slotEnd = start + (order + u.occ) * slotW;
    if (u.isCollapsed) {
      u.node.angle = (slotStart + slotEnd) / 2;
      u.node._slotStartA = slotStart;
      u.node._slotEndA = slotEnd;
      assignInnerAngle(u.node, slotStart, slotEnd);
    } else {
      u.node.angle = slotStart + slotW / 2; 
      u.node._slotStartA = slotStart;
      u.node._slotEndA = slotStart + slotW;
    }
    order += u.occ;
  });
  const isInvRadial = C.isTrue(st.invert);
  (function assign(n, depth) {
    if (n.deleted) return;
    n.depth = depth;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (kids.length) {
      kids.forEach(c => assign(c, depth + C.branchLen(c)));
      if (!n.collapsed) n.angle = kids.reduce((a, c) => a + (c.angle || 0), 0) / kids.length;
    }
    const t = Math.max(0, Math.min(1, depth / maxD));
    const r = isInvRadial
      ? (innerBase + maxR * (1 - t))
      : (innerBase + maxR * t);
    const p = polar(cx, cy, r, n.angle || 0);
    n.x = p.x; n.y = p.y; n.r = r;
  })(C.getRoot(), 0);
  const visLeaves = T.visibleLeaves(C.getRoot());
  const ar = C.getAxisRange(maxD);
  const tMaxUsed = Math.max(maxD, ar.vHi);
  const R_base = innerBase + maxR * tMaxUsed / maxD;
  const geoExtra = (global.TreeRanges && typeof global.TreeRanges.getGeoExtra === 'function')
    ? global.TreeRanges.getGeoExtra() : 0;
  const R_total = R_base + geoExtra;
  const labelR = isInvRadial
    ? Math.max(20, innerBase - 12)
    : (Math.max(...visLeaves.map(l => l.r || 0)) + 12);
  C.setRadialLabelR(labelR);
  const maxT = Math.max(0, ...visLeaves.map(l => T.labelOf(l).length * st.fontSize * (l.labelSizeFactor || 1) * 0.6));
  let tracksExtra = 0;
  if (global.TreeTracks && Array.isArray(global.TreeTracks.tracks) && global.TreeTracks.tracks.length) {
    const tc = global.TreeTracks.trackCommon || {};
    const gap = Math.max(0, Number(tc.trackGap) || 0);
    global.TreeTracks.tracks.forEach(t => {
      const w = (global.TreeTracks.computeTrackWidth && global.TreeTracks.computeTrackWidth(t, { radial: true })) || 0;
      tracksExtra += gap + Math.max(6, w);
    });
  }
  const legendExtra = 320;
  const ext = isInvRadial
    ? Math.max(380, R_total + 20, labelR + maxT + 14) + 20 + tracksExtra + legendExtra
    : Math.max(380, labelR + maxT + 14, R_total + 20) + 20 + tracksExtra + legendExtra;
  C.setViewBox({ x: 470 - ext - 16, y: 380 - ext - 16, w: (ext + 16) * 2, h: (ext + 16) * 2 });
}

function layoutUnrooted() {
  sortTreeByMode();
  const st = C.state;
  const root = C.getRoot();
  if (!root) return;
  const cx = 470, cy = 380;

  const units = [];
  (function collect(n) {
    if (n.deleted) return;
    const kids = (n.children || []).filter(c => !c.deleted);
    if (!kids.length) { units.push({ node: n, occ: 1, isCollapsed: false }); return; }
    if (n.collapsed) { units.push({ node: n, occ: collapsedOcc(n), isCollapsed: true }); return; }
    kids.forEach(collect);
  })(root);

  const arcSpan = Math.max(1, Math.min(360, Number(st.arc) || 360));
  const openGap = 360 - arcSpan;
  const startAngle = (Number(st.rotation) || 0) + openGap / 2;
  const totalOcc = units.reduce((s, u) => s + u.occ, 0) || 1;
  const slotW = arcSpan / totalOcc;
  let order = 0;
  units.forEach(u => {
    const sA = startAngle + order * slotW;
    const eA = startAngle + (order + u.occ) * slotW;
    u.node.angle = (sA + eA) / 2;
    u.node._slotStartA = sA;
    u.node._slotEndA = eA;
    if (u.isCollapsed) assignInnerAngle(u.node, sA, eA);
    order += u.occ;
  });

  root._slotStartA = startAngle;
  root._slotEndA = startAngle + arcSpan;

  (function assignInternalAngles(n) {
    const kids = (n.children || []).filter(c => !c.deleted);
    if (!kids.length) return;
    kids.forEach(assignInternalAngles);
    if (n.collapsed) return;
    let a0 = Infinity, a1 = -Infinity;
    kids.forEach(c => {
      if (c.angle < a0) a0 = c.angle;
      if (c.angle > a1) a1 = c.angle;
    });
    if (isFinite(a0)) n.angle = (a0 + a1) / 2;
  })(root);

  const maxD = Math.max(T.maxDepth(root, 0), 0.01);
  const maxR = 285 * (st.scaleH || 1);
  const scale = maxR / maxD;

  const iter = Math.max(0, Math.min(200, Math.round(Number(st.unrootedDaylightIter) || 0)));
  equalDaylight(root, scale, iter);

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  (function walkVisible(n) {
    if (n.deleted) return;
    if (n.ux < minX) minX = n.ux;
    if (n.ux > maxX) maxX = n.ux;
    if (n.uy < minY) minY = n.uy;
    if (n.uy > maxY) maxY = n.uy;
    if (n.collapsed) return;
    (n.children || []).forEach(c => { if (!c.deleted) walkVisible(c); });
  })(root);

  const ctrX = (minX + maxX) / 2, ctrY = (minY + maxY) / 2;

  T.allWalk(root, n => {
    if (n.deleted) return;
    n.x = cx + (n.ux - ctrX);
    n.y = cy + (n.uy - ctrY);
    n.r = Math.hypot(n.ux - ctrX, n.uy - ctrY);
  });

  const half = Math.max((maxX - minX) / 2, (maxY - minY) / 2, 300) + 100;
  C.setViewBox({ x: cx - half, y: cy - half, w: half * 2, h: half * 2 });
  C.setRadialLabelR(half - 40);

  C.ctx.treeMaxX = cx + (maxX - ctrX);
  C.ctx.treeMinX = cx + (minX - ctrX);
  C.ctx.treeTop = cy + (minY - ctrY);
  C.ctx.treeBottom = cy + (maxY - ctrY);
  C.ctx.rootX = cx - ctrX;
  C.ctx.rootY = cy - ctrY;
}
global.TreeLayout = {
  polar, sortTreeByMode, layoutRect, layoutRadial, layoutUnrooted,
  collapsedOcc, getRadialInnerBase
};
})(window);
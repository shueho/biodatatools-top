(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const I = global.TreeI18N;

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch])); }
function escapeAttr(s) { return escapeHtml(s).replace(/'/g, "&#39;"); }

function renderGroupPaletteDropdown(container, opts) {
  opts = opts || {};
  if (!container || !global.TreePalette) return;
  const groups = [
    { key: "d3", label: I.t('paletteGroupD3'), names: ["tableau10","category10","set1","set2","set3","paired","dark2","accent","pastel1","pastel2"] },
    { key: "ggsci", label: I.t('paletteGroupGgsci'), names: ["npg","aaas","nejm","lancet","jama","bmj","jco","locuszoom","uchicago","startrek","tron","futurama","rickandmorty","simpsons"] },
    { key: "other", label: I.t('paletteGroupOther'), names: ["okabeito","ibm","tolBright","tolVibrant","tolMuted","tolLight","tolHighContrast","tolMediumContrast","kelly","ggplotHue"] }
  ];
  const pal = global.TreePalette;
  let current = opts.selected || (global.TreeRanges && global.TreeRanges.ringPalette) || "tableau10";
  function swatchesHtml(name) {
    let cols = [];
    try { cols = pal.getCategoricalScheme(name) || []; } catch (_) {}
    if (!cols.length) cols = ["#cccccc"];
    return `<div class="palette-swatches-mini">${cols.map(c => `<div style="background:${c}"></div>`).join('')}</div>`;
  }
  container.innerHTML = "";
  container.className = "palette-select-wrap";
  const trigger = document.createElement("div");
  trigger.className = "palette-select-trigger";
  trigger.innerHTML = `<span class="palette-name">${current}</span><span class="palette-preview-slot">${swatchesHtml(current)}</span><span class="caret">▼</span>`;
  const dropdown = document.createElement("div");
  dropdown.className = "palette-select-dropdown";
  groups.forEach(g => {
    const gl = document.createElement("div");
    gl.className = "palette-group-label";
    gl.dataset.group = g.key;
    gl.textContent = g.label;
    dropdown.appendChild(gl);
    g.names.forEach(name => {
      const opt = document.createElement("div");
      opt.className = "palette-option" + (name === current ? " active" : "");
      opt.dataset.value = name;
      opt.dataset.group = g.key;
      opt.innerHTML = `<span class="palette-name">${name}</span>${swatchesHtml(name)}<span class="palette-check">✓</span>`;
      opt.addEventListener("click", e => {
        e.stopPropagation();
        current = name;
        trigger.querySelector(".palette-name").textContent = name;
        trigger.querySelector(".palette-preview-slot").innerHTML = swatchesHtml(name);
        dropdown.querySelectorAll(".palette-option").forEach(o => o.classList.toggle("active", o.dataset.value === name));
        if (opts.onSelect) opts.onSelect(name);
      });
      dropdown.appendChild(opt);
    });
  });
  trigger.addEventListener("click", e => {
    e.stopPropagation();
    document.querySelectorAll(".palette-select-wrap.open").forEach(el => { if (el !== container) el.classList.remove("open"); });
    container.classList.toggle("open");
  });
  container.appendChild(trigger);
  container.appendChild(dropdown);
  if (!document.__paletteDropdownClickBound) {
    document.__paletteDropdownClickBound = true;
    document.addEventListener("click", () => { document.querySelectorAll(".palette-select-wrap.open").forEach(el => el.classList.remove("open")); });
  }
}

let drag = null, legendDrag = null, moveDrag = null, scaleDrag = null;
let trackDrag = null, nodeLabelDrag = null, lengthLabelDrag = null, pieMarkerDrag = null;
let moveLineEl = null, moveRingEl = null;
let suppressSvgClick = false;

function clientToSvg(svg, cx, cy) {
  const pt = svg.createSVGPoint();
  pt.x = cx; pt.y = cy;
  const ctm = svg.getScreenCTM();
  return ctm ? pt.matrixTransform(ctm.inverse()) : { x: cx, y: cy };
}
function nodeSize(n) { return T.isLeaf(n) ? 4.5 : 3.8; }

function enableDrag(svg) {
  if (!svg || svg.dataset.dragBound === "1") return;
  svg.dataset.dragBound = "1";
  let legendRaf = null;
  let legendPending = null;

  svg.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    const st = C.state;
    const vb = C.getViewBox();
    const legendEl = e.target.closest && e.target.closest(".legend-box");
    if (legendEl) {
      const rect = svg.getBoundingClientRect();
      const trackId = legendEl.getAttribute("data-track-id");
      let initialX = 0, initialY = 0;
      if (trackId) {
        const t = global.TreeTracks && global.TreeTracks.tracks.find(x => x.id === Number(trackId));
        if (t) {
          initialX = t.legendX != null ? t.legendX : 0;
          initialY = t.legendY != null ? t.legendY : 0;
          if (t.legendX == null || t.legendY == null) {
            const tr = legendEl.getAttribute("transform") || "";
            const m = tr.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
            if (m) { initialX = parseFloat(m[1]); initialY = parseFloat(m[2]); t.legendX = initialX; t.legendY = initialY; }
          }
        }
      }
      let autoX = Number(st.legendX) || 760;
      let autoY = Number(st.legendY) || 60;
      const tr = legendEl.getAttribute("transform") || "";
      const m = tr.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
      if (m) { autoX = parseFloat(m[1]) - (st.legendOffsetX || 0); autoY = parseFloat(m[2]) - (st.legendOffsetY || 0); }
      legendDrag = {
        el: legendEl, trackId: trackId ? Number(trackId) : null,
        startX: e.clientX, startY: e.clientY,
        x0: trackId ? initialX : (autoX + (st.legendOffsetX || 0)),
        y0: trackId ? initialY : (autoY + (st.legendOffsetY || 0)),
        autoX, autoY,
        unitX: (vb.w / st.zoom) / Math.max(1, rect.width),
        unitY: (vb.h / st.zoom) / Math.max(1, rect.height),
        moved: false
      };
      e.preventDefault(); e.stopPropagation();
      return;
    }
    const scaleEl = e.target.closest && e.target.closest(".scale-box");
    if (scaleEl) {
      const rect = svg.getBoundingClientRect();
      scaleDrag = {
        el: scaleEl, startX: e.clientX, startY: e.clientY,
        ox0: Number(st.scaleBoxOffsetX) || 0, oy0: Number(st.scaleBoxOffsetY) || 0,
        unitX: (vb.w / st.zoom) / Math.max(1, rect.width),
        unitY: (vb.h / st.zoom) / Math.max(1, rect.height),
        moved: false
      };
      e.preventDefault(); e.stopPropagation();
      return;
    }
    const nodeLabelEl = e.target.closest && e.target.closest("[data-node-label-group]");
    if (nodeLabelEl) {
      if (st.mode === "unrooted") { e.preventDefault(); e.stopPropagation(); return; }
      const rect = svg.getBoundingClientRect();
      nodeLabelDrag = {
        startX: e.clientX, startY: e.clientY,
        ox0: Number(st.nodeLabelCommon.offsetX) || 0,
        oy0: Number(st.nodeLabelCommon.offsetY) || 0,
        ot0: Number(st.nodeLabelCommon.offsetTangent) || 0,
        or0: Number(st.nodeLabelCommon.offsetRadial) || 0,
        unitX: (vb.w / st.zoom) / Math.max(1, rect.width),
        unitY: (vb.h / st.zoom) / Math.max(1, rect.height),
        isRadial: st.mode === "circular",
        moved: false
      };
      e.preventDefault(); e.stopPropagation();
      return;
    }
    const lengthLabelEl = e.target.closest && e.target.closest("[data-length-label]");
    if (lengthLabelEl) {
      if (st.mode === "unrooted") { e.preventDefault(); e.stopPropagation(); return; }
      const rect = svg.getBoundingClientRect();
      let refAngleDeg = null;
      if (st.mode === "circular") {
        const nid = lengthLabelEl.getAttribute("data-id");
        const nd = nid ? T.nodeById(nid) : null;
        if (nd && nd.angle != null) refAngleDeg = nd.angle;
        else {
          const pt = clientToSvg(svg, e.clientX, e.clientY);
          const mx = pt.x - 470, my = pt.y - 380;
          if (Math.hypot(mx, my) > 10) refAngleDeg = Math.atan2(my, mx) * 180 / Math.PI + 90;
        }
        if (refAngleDeg == null) refAngleDeg = (Number(st.rotation) || 0) + (Number(st.axisRotation) || 0);
      }
      lengthLabelDrag = {
        startX: e.clientX, startY: e.clientY,
        ox0: Number(st.lengthLabel.offsetX) || 0,
        oy0: Number(st.lengthLabel.offsetY) || 0,
        ot0: Number(st.lengthLabel.offsetTangent) || 0,
        or0: Number(st.lengthLabel.offsetRadial) || 0,
        unitX: (vb.w / st.zoom) / Math.max(1, rect.width),
        unitY: (vb.h / st.zoom) / Math.max(1, rect.height),
        isRadial: st.mode === "circular", refAngleDeg, moved: false
      };
      e.preventDefault(); e.stopPropagation();
      return;
    }
    const pieEl = e.target.closest && e.target.closest("[data-pie-marker-group]");
    if (pieEl) {
      if (st.mode === "unrooted") { e.preventDefault(); e.stopPropagation(); return; }
      const rect = svg.getBoundingClientRect();
      pieMarkerDrag = {
        startX: e.clientX, startY: e.clientY,
        ox0: Number(st.pieMarker.offsetX) || 0, oy0: Number(st.pieMarker.offsetY) || 0,
        ot0: Number(st.pieMarker.offsetTangent) || 0, or0: Number(st.pieMarker.offsetRadial) || 0,
        unitX: (vb.w / st.zoom) / Math.max(1, rect.width),
        unitY: (vb.h / st.zoom) / Math.max(1, rect.height),
        isRadial: st.mode === "circular", moved: false
      };
      e.preventDefault(); e.stopPropagation();
      return;
    }
    const trackEl = e.target.closest && e.target.closest("[data-track-band]");
    if (trackEl) {
      const trackId = Number(trackEl.getAttribute("data-track-band"));
      const track = global.TreeTracks && global.TreeTracks.tracks.find(x => x.id === trackId);
      if (track) {
        const rect = svg.getBoundingClientRect();
        trackDrag = {
          track, trackId, startX: e.clientX, startY: e.clientY,
          offset0: Number(track.offset) || 0,
          unitX: (vb.w / st.zoom) / Math.max(1, rect.width),
          unitY: (vb.h / st.zoom) / Math.max(1, rect.height),
          isRadial: st.mode === "circular", moved: false
        };
        e.preventDefault(); e.stopPropagation();
        return;
      }
    }
    const rect = svg.getBoundingClientRect();
    drag = {
      startX: e.clientX, startY: e.clientY,
      panX: st.panX || 0, panY: st.panY || 0,
      unitX: (vb.w / st.zoom) / Math.max(1, rect.width),
      unitY: (vb.h / st.zoom) / Math.max(1, rect.height),
      snapped: false
    };
  });

  svg.addEventListener("pointermove", e => {
    const st = C.state;
    if (legendDrag) {
      const dx = (e.clientX - legendDrag.startX) * legendDrag.unitX;
      const dy = (e.clientY - legendDrag.startY) * legendDrag.unitY;
      if (!legendDrag.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
      if (!legendDrag.moved) {
        legendDrag.moved = true;
        suppressSvgClick = true;
        try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      }
      legendPending = { dx, dy };
      if (!legendRaf) {
        legendRaf = requestAnimationFrame(() => {
          legendRaf = null;
          const p = legendPending;
          legendPending = null;
          if (!legendDrag || !p) return;
          const newX = legendDrag.x0 + p.dx;
          const newY = legendDrag.y0 + p.dy;
          if (legendDrag.trackId) {
            const t = global.TreeTracks && global.TreeTracks.tracks.find(x => x.id === legendDrag.trackId);
            if (t) { t.legendX = newX; t.legendY = newY; }
          } else {
            st.legendOffsetX = newX - (legendDrag.autoX || 0);
            st.legendOffsetY = newY - (legendDrag.autoY || 0);
          }
          if (legendDrag.el) legendDrag.el.setAttribute("transform", `translate(${newX} ${newY})`);
        });
      }
      return;
    }
    if (scaleDrag) {
      const dx = (e.clientX - scaleDrag.startX) * scaleDrag.unitX;
      const dy = (e.clientY - scaleDrag.startY) * scaleDrag.unitY;
      if (!scaleDrag.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
      if (!scaleDrag.moved) { scaleDrag.moved = true; suppressSvgClick = true; try { svg.setPointerCapture(e.pointerId); } catch (_) {} }
      st.scaleBoxOffsetX = scaleDrag.ox0 + dx;
      st.scaleBoxOffsetY = scaleDrag.oy0 + dy;
      global.TreeRenderer.draw();
      return;
    }
    if (nodeLabelDrag) {
      const dx = (e.clientX - nodeLabelDrag.startX) * nodeLabelDrag.unitX;
      const dy = (e.clientY - nodeLabelDrag.startY) * nodeLabelDrag.unitY;
      if (!nodeLabelDrag.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
      if (!nodeLabelDrag.moved) { nodeLabelDrag.moved = true; suppressSvgClick = true; try { svg.setPointerCapture(e.pointerId); } catch (_) {} }
      if (nodeLabelDrag.isRadial) {
        const axisAngle = (Number(st.rotation) || 0) + (Number(st.axisRotation) || 0);
        const radRad = (axisAngle - 90) * Math.PI / 180;
        const tanRad = axisAngle * Math.PI / 180;
        st.nodeLabelCommon.offsetRadial = nodeLabelDrag.or0 + (dx * Math.cos(radRad) + dy * Math.sin(radRad));
        st.nodeLabelCommon.offsetTangent = nodeLabelDrag.ot0 + (dx * Math.cos(tanRad) + dy * Math.sin(tanRad));
      } else {
        st.nodeLabelCommon.offsetX = nodeLabelDrag.ox0 + dx;
        st.nodeLabelCommon.offsetY = nodeLabelDrag.oy0 + dy;
      }
      global.TreeRenderer.draw();
      return;
    }
    if (lengthLabelDrag) {
      const dx = (e.clientX - lengthLabelDrag.startX) * lengthLabelDrag.unitX;
      const dy = (e.clientY - lengthLabelDrag.startY) * lengthLabelDrag.unitY;
      if (!lengthLabelDrag.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
      if (!lengthLabelDrag.moved) { lengthLabelDrag.moved = true; suppressSvgClick = true; try { svg.setPointerCapture(e.pointerId); } catch (_) {} }
      if (lengthLabelDrag.isRadial) {
        const ang = lengthLabelDrag.refAngleDeg;
        const radRad = (ang - 90) * Math.PI / 180;
        const tanRad = ang * Math.PI / 180;
        st.lengthLabel.offsetRadial = lengthLabelDrag.or0 + (dx * Math.cos(radRad) + dy * Math.sin(radRad));
        st.lengthLabel.offsetTangent = lengthLabelDrag.ot0 + (dx * Math.cos(tanRad) + dy * Math.sin(tanRad));
      } else {
        st.lengthLabel.offsetX = lengthLabelDrag.ox0 + dx;
        st.lengthLabel.offsetY = lengthLabelDrag.oy0 + dy;
      }
      global.TreeRenderer.draw();
      return;
    }
    if (pieMarkerDrag) {
      const dx = (e.clientX - pieMarkerDrag.startX) * pieMarkerDrag.unitX;
      const dy = (e.clientY - pieMarkerDrag.startY) * pieMarkerDrag.unitY;
      if (!pieMarkerDrag.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
      if (!pieMarkerDrag.moved) { pieMarkerDrag.moved = true; suppressSvgClick = true; try { svg.setPointerCapture(e.pointerId); } catch (_) {} }
      if (pieMarkerDrag.isRadial) {
        const axisAngle = (Number(st.rotation) || 0) + (Number(st.axisRotation) || 0);
        const radRad = (axisAngle - 90) * Math.PI / 180;
        const tanRad = axisAngle * Math.PI / 180;
        st.pieMarker.offsetRadial = pieMarkerDrag.or0 + (dx * Math.cos(radRad) + dy * Math.sin(radRad));
        st.pieMarker.offsetTangent = pieMarkerDrag.ot0 + (dx * Math.cos(tanRad) + dy * Math.sin(tanRad));
      } else {
        st.pieMarker.offsetX = pieMarkerDrag.ox0 + dx;
        st.pieMarker.offsetY = pieMarkerDrag.oy0 + dy;
      }
      global.TreeRenderer.draw();
      return;
    }
    if (trackDrag) {
      const rawDx = e.clientX - trackDrag.startX;
      const rawDy = e.clientY - trackDrag.startY;
      if (!trackDrag.moved && Math.abs(rawDx) + Math.abs(rawDy) < 3) return;
      if (!trackDrag.moved) { trackDrag.moved = true; suppressSvgClick = true; try { svg.setPointerCapture(e.pointerId); } catch (_) {} svg.style.cursor = 'grabbing'; }
      if (trackDrag.isRadial) {
        const axisAngle = (Number(C.state.rotation) || 0) + (Number(C.state.axisRotation) || 0);
        const rad = (axisAngle - 90) * Math.PI / 180;
        const ux = Math.cos(rad), uy = Math.sin(rad);
        const dxSvg = rawDx * trackDrag.unitX;
        const dySvg = rawDy * trackDrag.unitY;
        trackDrag.track.offset = trackDrag.offset0 + (dxSvg * ux + dySvg * uy);
      } else {
        const dxSvg = rawDx * trackDrag.unitX;
        trackDrag.track.offset = trackDrag.offset0 + dxSvg;
      }
      global.TreeRenderer.draw();
      return;
    }
    if (moveDrag) {
      if (Math.abs(e.clientX - moveDrag.startX) + Math.abs(e.clientY - moveDrag.startY) < 3) return;
      if (!moveDrag.moved) {
        moveDrag.moved = true;
        suppressSvgClick = true;
        try { svg.setPointerCapture(e.pointerId); } catch (_) {}
        const src = T.nodeById(moveDrag.srcId);
        if (src) {
          moveRingEl = C.el("circle", { cx: src.x, cy: src.y, r: nodeSize(src) + 6, fill: "none", stroke: "#ff3b3b", "stroke-width": 2 });
          moveLineEl = C.el("line", { x1: src.x, y1: src.y, x2: src.x, y2: src.y, stroke: "#2f6bd8", "stroke-width": 2, "stroke-dasharray": "5 4" });
        }
      }
      const loc = clientToSvg(svg, e.clientX, e.clientY);
      if (moveLineEl) { moveLineEl.setAttribute("x2", loc.x); moveLineEl.setAttribute("y2", loc.y); }
      return;
    }
    if (!drag) return;
    const dx = (e.clientX - drag.startX) * drag.unitX;
    const dy = (e.clientY - drag.startY) * drag.unitY;
    if (Math.abs(dx) + Math.abs(dy) < 2) return;
    if (!drag.snapped) { drag.snapped = true; try { svg.setPointerCapture(e.pointerId); } catch (_) {} }
    suppressSvgClick = true;
    st.panX = drag.panX + dx;
    st.panY = drag.panY + dy;
    svg.classList.add("dragging");
    global.TreeRenderer.draw();
  });

  const endDrag = e => {
    if (legendDrag) {
      if (legendRaf) { cancelAnimationFrame(legendRaf); legendRaf = null; }
      legendPending = null;
      try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
      const wasMoved = legendDrag.moved;
      legendDrag = null;
      setTimeout(() => { suppressSvgClick = false; if (wasMoved) global.TreeRenderer.draw(); }, 0);
      return;
    }
    if (scaleDrag) { try { svg.releasePointerCapture(e.pointerId); } catch (_) {} const wasMoved = scaleDrag.moved; scaleDrag = null; setTimeout(() => { suppressSvgClick = false; if (wasMoved) global.TreeRenderer.draw(); }, 0); return; }
    if (nodeLabelDrag) {
      try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
      const wasMoved = nodeLabelDrag.moved; const isRadial = nodeLabelDrag.isRadial;
      nodeLabelDrag = null;
      setTimeout(() => {
        suppressSvgClick = false;
        if (wasMoved) {
          const st = C.state;
          if (isRadial) {
            const ot = document.getElementById('nodeLabelOffsetTangent');
            const or = document.getElementById('nodeLabelOffsetRadial');
            if (ot) ot.value = Math.round(st.nodeLabelCommon.offsetTangent || 0);
            if (or) or.value = Math.round(st.nodeLabelCommon.offsetRadial || 0);
          } else {
            const ox = document.getElementById('nodeLabelOffsetX');
            const oy = document.getElementById('nodeLabelOffsetY');
            if (ox) ox.value = Math.round(st.nodeLabelCommon.offsetX);
            if (oy) oy.value = Math.round(st.nodeLabelCommon.offsetY);
          }
          global.TreeRenderer.draw();
        }
      }, 0);
      return;
    }
    if (lengthLabelDrag) {
      try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
      const wasMoved = lengthLabelDrag.moved;
      lengthLabelDrag = null;
      setTimeout(() => {
        suppressSvgClick = false;
        if (wasMoved) {
          const st = C.state;
          const ox = document.getElementById('lenLabelOffsetX');
          const oy = document.getElementById('lenLabelOffsetY');
          const ot = document.getElementById('lenLabelOffsetTangent');
          const or = document.getElementById('lenLabelOffsetRadial');
          if (ox) ox.value = Math.round(st.lengthLabel.offsetX || 0);
          if (oy) oy.value = Math.round(st.lengthLabel.offsetY || 0);
          if (ot) ot.value = Math.round(st.lengthLabel.offsetTangent || 0);
          if (or) or.value = Math.round(st.lengthLabel.offsetRadial || 0);
          global.TreeRenderer.draw();
        }
      }, 0);
      return;
    }
    if (pieMarkerDrag) {
      try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
      const wasMoved = pieMarkerDrag.moved; const isRadial = pieMarkerDrag.isRadial;
      pieMarkerDrag = null;
      setTimeout(() => {
        suppressSvgClick = false;
        if (wasMoved) {
          const st = C.state;
          if (isRadial) {
            const ot = document.getElementById('pieMarkerOffsetTangent');
            const or = document.getElementById('pieMarkerOffsetRadial');
            if (ot) ot.value = Math.round(st.pieMarker.offsetTangent || 0);
            if (or) or.value = Math.round(st.pieMarker.offsetRadial || 0);
          } else {
            const ox = document.getElementById('pieMarkerOffsetX');
            const oy = document.getElementById('pieMarkerOffsetY');
            if (ox) ox.value = Math.round(st.pieMarker.offsetX);
            if (oy) oy.value = Math.round(st.pieMarker.offsetY);
          }
          global.TreeRenderer.draw();
        }
      }, 0);
      return;
    }
    if (trackDrag) {
      try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
      const wasMoved = trackDrag.moved;
      trackDrag = null;
      svg.style.cursor = '';
      setTimeout(() => { suppressSvgClick = false; if (wasMoved) global.TreeRenderer.draw(); }, 0);
      return;
    }
    if (moveDrag) {
      const moved = moveDrag.moved;
      const srcId = moveDrag.srcId;
      moveDrag = null;
      moveLineEl = null;
      moveRingEl = null;
      try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
      if (moved) {
        const tgtEl = document.elementFromPoint(e.clientX, e.clientY);
        const tn = tgtEl && tgtEl.closest ? tgtEl.closest("[data-id]") : null;
        const src = T.nodeById(srcId);
        const target = tn ? T.nodeById(tn.dataset.id) : null;
        const statusEl = document.getElementById("status");
        if (src && target && T.moveNodeBeside(src, target)) {
          if (statusEl) statusEl.textContent = I.t('statusMoved', { src: T.labelOf(src), tgt: T.labelOf(target) });
        } else {
          if (statusEl) statusEl.textContent = I.t('statusMoveCancel');
        }
        global.TreeRenderer.draw();
      }
      setTimeout(() => suppressSvgClick = false, 0);
      return;
    }
    if (drag && e.pointerId !== undefined) { try { svg.releasePointerCapture(e.pointerId); } catch (_) {} }
    drag = null;
    svg.classList.remove("dragging");
    setTimeout(() => suppressSvgClick = false, 0);
  };

  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointercancel", endDrag);
}

function bindSvgClick(svg) {
  if (!svg || svg.dataset.clickBound === "1") return;
  svg.dataset.clickBound = "1";
  svg.addEventListener("click", e => {
    if (suppressSvgClick) return;
    const branchEl = e.target.closest && e.target.closest("[data-branch-id]");
    if (branchEl) {
      const bid = branchEl.getAttribute("data-branch-id");
      const bn = T.nodeById(bid);
      if (bn && bn.parent) {
        C.setSelectedId(null);
        C.setSelectedBranchId(bn.id);
        global.TreeRenderer.draw();
        const cx = e.clientX, cy = e.clientY;
        if (global.TreeApp && typeof global.TreeApp.showBranchActionPanel === "function") setTimeout(() => global.TreeApp.showBranchActionPanel(bn.id, cx, cy), 0);
        return;
      }
    }
    const target = e.target.closest && e.target.closest("[data-id]");
    if (!target) {
      const panel = document.getElementById("nodeActionPanel");
      if (panel) panel.style.display = "none";
      const bpanel = document.getElementById("branchActionPanel");
      if (bpanel) bpanel.style.display = "none";
      C.setSelectedId(null);
      C.setSelectedBranchId(null);
      global.TreeRenderer.draw();
      return;
    }
    let n = null;
    T.allWalk(C.getRoot(), x => { if (x.id === target.dataset.id) n = x; });
    if (!n) return;
    C.setSelectedBranchId(null);
    C.setSelectedId(n.id);
    global.TreeRenderer.draw();
    const cx = e.clientX, cy = e.clientY;
    if (global.TreeApp && typeof global.TreeApp.showNodeActionPanel === "function") setTimeout(() => global.TreeApp.showNodeActionPanel(n.id, cx, cy), 0);
  });
}

function renderEditor() {
  const editor = document.getElementById("selectedEditor");
  if (!editor) return;
  const n = T.nodeById(C.getSelectedId());
  if (!n) { editor.classList.add("hidden"); return; }
  editor.classList.remove("hidden");
  editor.innerHTML = `<h4>${I.t('editorTitle', { name: escapeHtml(T.labelOf(n)) })}</h4><div class="inner">
    <label>${I.t('editorLabel')} <input id="selLabel" type="text" value="${escapeAttr(T.labelOf(n))}"></label>
    <label>${I.t('editorColor')} <input id="selColor" type="color" value="${n.color || '#e64b35'}"></label>
    <button class="btn" id="selApply" type="button">${I.t('editorApply')}</button>
    <button class="btn btn-outline" id="selCollapse" type="button">${n.collapsed ? I.t('editorExpand') : I.t('editorCollapse')}</button>
    <button class="btn btn-outline" id="selDelete" type="button" style="color:#dc3545;border-color:#dc3545;">${I.t('editorDelete')}</button>
  </div>`;
  document.getElementById("selApply").onclick = () => { n.label = document.getElementById("selLabel").value; n.color = document.getElementById("selColor").value; global.TreeRenderer.draw(); };
  document.getElementById("selCollapse").onclick = () => { n.collapsed = !n.collapsed; global.TreeRenderer.draw(); };
  document.getElementById("selDelete").onclick = () => { n.deleted = true; global.TreeRenderer.draw(); };
}

function refreshTreeView() {
  if (global.TreeRenderer && global.TreeRenderer.draw) global.TreeRenderer.draw();
  if (global.TreeRanges && global.TreeRanges.renderRangesPanel) global.TreeRanges.renderRangesPanel();
}

global.TreeDrag = { enableDrag, bindSvgClick, clientToSvg };
global.TreeUI = {
  renderGroupPaletteDropdown, escapeHtml, escapeAttr,
  renderEditor, refreshTreeView,
  renderRangesPanel: () => global.TreeRanges && global.TreeRanges.renderRangesPanel()
};
})(window);
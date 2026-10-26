(function (global) {
'use strict';
const C = global.TreeCore;

let bmLastFrame = null;

function exportSvgString() {
  const svg = C.getSvg(); const vb = C.getViewBox();
  if (!svg) return '';
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  const k = 1600 / Math.max(vb.w, vb.h, 1);
  clone.setAttribute("width", Math.round(vb.w * k));
  clone.setAttribute("height", Math.round(vb.h * k));
  clone.querySelectorAll('[fill="transparent"]').forEach(el => el.remove());
  clone.querySelectorAll('[stroke="transparent"]').forEach(el => el.remove());
  clone.querySelectorAll('[style*="transparent"]').forEach(el => {
    const s = (el.getAttribute('style') || '');
    if (/fill\s*:\s*transparent/i.test(s) || /stroke\s*:\s*transparent/i.test(s)) el.remove();
  });
  clone.querySelectorAll('.node-hotspot').forEach(el => {
    const fill = el.getAttribute('fill');
    const stroke = el.getAttribute('stroke');
    if (fill === 'transparent' || stroke === 'transparent' ||
        fill === 'none' || stroke === 'none') {
      if ((fill === 'none' || fill === 'transparent') &&
          (stroke === 'none' || stroke === 'transparent')) el.remove();
      else { el.removeAttribute('class'); el.removeAttribute('data-id'); }
    } else { el.removeAttribute('class'); el.removeAttribute('data-id'); }
  });
  clone.querySelectorAll('[class],[style],[data-id],[data-track-band],[data-node-label-group],[data-length-label],[data-pie-marker-group],[data-range],[data-geo]').forEach(el => {
    el.removeAttribute('class');
    el.removeAttribute('style');
    el.removeAttribute('data-id');
    el.removeAttribute('data-track-band');
    el.removeAttribute('data-node-label-group');
    el.removeAttribute('data-length-label');
    el.removeAttribute('data-pie-marker-group');
    el.removeAttribute('data-range');
    el.removeAttribute('data-geo');
    el.removeAttribute('data-selected-for');
    el.removeAttribute('data-palette-version');
  });
  clone.querySelectorAll('[pointer-events],[cursor]').forEach(el => {
    el.removeAttribute('pointer-events');
    el.removeAttribute('cursor');
  });
  clone.querySelectorAll('.legend-hit').forEach(el => el.remove());
  bmLastFrame = { x: vb.x, y: vb.y, w: vb.w * k, h: vb.h * k };
  return new XMLSerializer().serializeToString(clone);
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function renderSvgToCanvas(scale) {
  scale = scale || 2;
  return new Promise(resolve => {
    const svgText = exportSvgString();
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmLastFrame.w * scale);
      canvas.height = Math.round(bmLastFrame.h * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url); resolve(canvas);
    };
    img.src = url;
  });
}

async function downloadPng(scale, filename) {
  const canvas = await renderSvgToCanvas(scale);
  canvas.toBlob(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, "image/png");
}

global.TreeExport = { exportSvgString, download, renderSvgToCanvas, downloadPng };
})(window);
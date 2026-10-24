(function (global) {
'use strict';
const C = global.TreeCore;
const P = global.TreeParser;
const T = global.TreeTraverse;
const S = global.TreeSerialize;
const O = global.TreeOps;
const I = global.TreeI18N;

(function injectFloatStyles() {
  if (document.getElementById('tree-float-style')) return;
  var css = [
    '.rp-list{max-height:200px;overflow:auto;}',
    '.rp-row{display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid #f0f2f1;}',
    '.rp-sw{width:22px;height:18px;flex:0 0 22px;padding:0;border-radius:3px;border:1px solid rgba(0,0,0,.15);background:transparent;cursor:pointer;}',
    '.rp-lb-edit{flex:1;min-width:0;border:1px solid #ccc;padding:2px 6px;font-size:12px;border-radius:4px;}',
    '.rp-x{border:0;background:none;cursor:pointer;font-size:16px;color:#a33;}',
    '.range-modal-backdrop,.meta-modal-backdrop,.ms-modal-backdrop{position:fixed;inset:0;background:rgba(20,30,32,.28);display:none;align-items:center;justify-content:center;z-index:9500;}',
    '.range-modal{width:332px;background:#fff;border-radius:8px;box-shadow:0 24px 60px rgba(8,41,45,.3);overflow:hidden;}',
    '.range-modal .rm-head{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#e9eeec;font-weight:800;}',
    '.rm-close{border:0;background:none;font-size:18px;cursor:pointer;line-height:1;}',
    '.rm-body{padding:14px;}','.rm-row{display:grid;grid-template-columns:70px 1fr;align-items:center;gap:10px;margin-bottom:10px;}',
    '.rm-row input[type=text]{width:100%;padding:5px 7px;border:1px solid #cdd6d4;border-radius:4px;}',
    '.rm-row input[type=color]{width:60px;height:28px;}',
    '.rm-foot{display:flex;justify-content:flex-end;gap:8px;padding:10px 14px;border-top:1px solid #eef1f0;}',
    '.rm-create{background:#2f9e6f;color:#fff;border:0;border-radius:4px;padding:6px 12px;cursor:pointer;font-weight:700;}',
    '.rm-cancel{background:#eee;border:1px solid #ccc;border-radius:4px;padding:6px 12px;cursor:pointer;}',
    '.meta-modal{width:430px;max-height:84%;overflow:auto;background:#fff;border-radius:8px;box-shadow:0 24px 60px rgba(8,41,45,.3);}',
    '.meta-modal .mm-head{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#e9eeec;font-weight:800;}',
    '.mm-close{border:0;background:none;font-size:18px;cursor:pointer;line-height:1;}',
    '.meta-modal .mm-body{padding:14px;}','.mm-labelrow{display:grid;grid-template-columns:70px 1fr;align-items:center;gap:10px;margin-bottom:12px;}',
    '.mm-labelrow input,.mm-frow input{padding:5px 7px;border:1px solid #cdd6d4;border-radius:4px;width:100%;box-sizing:border-box;}',
    '.mm-grid-head{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-weight:800;padding:4px 0 6px;border-bottom:1px solid #e4e9e7;}',
    '.mm-frow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;}',
    '.mm-fieldbtns{display:flex;gap:8px;margin-top:14px;}',
    '.mm-btn-add{background:#e9ecef;border:1px solid #ccc;border-radius:4px;padding:6px 12px;cursor:pointer;font:inherit;}',
    '.mm-btn-del{background:#e74c3c;color:#fff;border:0;border-radius:4px;padding:6px 12px;cursor:pointer;font:inherit;}',
    '.meta-modal .mm-foot{display:flex;justify-content:flex-end;gap:8px;padding:10px 14px;border-top:1px solid #eef1f0;}',
    '.mm-update{background:#18a0a8;color:#fff;border:0;border-radius:4px;padding:6px 14px;cursor:pointer;font-weight:700;}',
    '.mm-cancel{background:#eee;border:1px solid #ccc;border-radius:4px;padding:6px 14px;cursor:pointer;}',
    '.ms-modal{width:560px;max-width:92%;background:#fff;border-radius:8px;box-shadow:0 24px 60px rgba(8,41,45,.3);}',
    '.ms-modal .ms-head{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#e9eeec;font-weight:800;}',
    '.ms-close{border:0;background:none;font-size:18px;cursor:pointer;line-height:1;}',
    '.ms-modal .ms-body{padding:14px;}','.ms-text{width:100%;font-size:20px;padding:6px 8px;border:1px solid #cdd6d4;border-radius:4px;box-sizing:border-box;margin-bottom:12px;}',
    '.ms-toolbar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}',
    '.ms-tb{min-width:32px;height:30px;border:1px solid #cdd6d4;background:#fff;border-radius:4px;cursor:pointer;font:inherit;}',
    '.ms-tb.active{background:#cfcac6;}','.ms-num{width:56px;padding:3px 5px;border:1px solid #cdd6d4;border-radius:4px;}',
    '.ms-modal .ms-foot{display:flex;justify-content:flex-end;gap:8px;padding:10px 14px;border-top:1px solid #eef1f0;}',
    '.ms-set{background:#2f86c5;color:#fff;border:0;border-radius:4px;padding:6px 12px;cursor:pointer;font-weight:700;}',
    '.ms-reset{background:#f1c40f;border:0;border-radius:4px;padding:6px 12px;cursor:pointer;font-weight:700;}',
    '.ms-cancel{background:#eee;border:1px solid #ccc;border-radius:4px;padding:6px 12px;cursor:pointer;}',
    '.ds-row{display:flex;align-items:center;gap:8px;padding:5px 2px;border-bottom:1px solid #eef1f0;}',
    '.ds-sw{width:18px;height:14px;border-radius:3px;border:1px solid rgba(0,0,0,.15);}',
    '.ds-nm{flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.ds-x{border:0;background:none;cursor:pointer;color:#a33;font-size:15px;line-height:1;}',
    '.group-diagnostics{min-height:28px;margin-top:8px;padding:8px 10px;border-radius:6px;background:#f2f2f4;color:#666;font-size:11px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere;}',
    '.selected-card{margin-top:12px;border:1px solid #dce6e3;border-radius:6px;overflow:hidden;}',
    '.selected-card h4{margin:0;padding:9px 12px;background:#f4f8f7;border-bottom:1px solid #dce6e3;font-size:14px;color:#1f4068;}',
    '.selected-card .inner{padding:10px 12px;display:grid;gap:8px;}',
    '.selected-card .inner label{display:flex;flex-direction:column;font-size:13px;color:#666;gap:4px;}',
    '.node-hotspot,.node-label,.leaf-label,.branch-line{cursor:pointer;}',
    '.editable-cell{cursor:cell;display:inline-block;min-width:8px;border-radius:3px;padding:1px 3px;margin:-1px -3px;}',
    '.editable-cell:hover{background:rgba(255,214,102,.35);box-shadow:inset 0 0 0 1px rgba(200,150,0,.35);}',
    '.node-hotspot:hover,.node-label:hover,.leaf-label:hover{filter:drop-shadow(0 0 2px rgba(255,75,75,.7));}',
    '.node-selected{stroke:#ff4b4b !important;stroke-width:3 !important;}',
    '#leafDataPreview table{width:100%;border-collapse:collapse;font-family:Consolas,monospace;font-size:13px;}',
    '#leafDataPreview thead th{position:sticky;top:0;background:#f5f7fa;z-index:2;border:1px solid #ccc;padding:8px 12px;text-align:left;color:#1f4068;}',
    '#leafDataPreview tbody td{border:1px solid #d8e2ec;padding:6px 12px;}',
    '#leafDataPreview tbody tr:nth-child(even){background:#fafbfd;}',
    'details.param-panel{padding:0;margin:8px 0;background:transparent;border:none;}',
    'details.param-panel > summary{list-style:none;display:flex;align-items:center;width:100%;box-sizing:border-box;min-height:36px;padding:0 14px;font-weight:600;font-size:13.5px;color:#1e3a8a;background:#cddff2;border:1px solid #a9c9ec;border-radius:8px;cursor:pointer;user-select:none;transition:background .15s,border-radius .15s;}',
    'details.param-panel > summary::-webkit-details-marker{display:none;}',
    'details.param-panel > summary::marker{content:"";}',
    'details.param-panel > summary::after{content:"";margin-left:auto;width:8px;height:8px;border-right:2px solid #1e3a8a;border-bottom:2px solid #1e3a8a;transform:rotate(45deg);transition:transform .2s;flex-shrink:0;}',
    'details.param-panel > summary:hover{background:#c2d8ef;}',
    'details.param-panel[open] > summary{background:#b4d2ef;border-radius:8px 8px 0 0;}',
    'details.param-panel[open] > summary::after{transform:rotate(-135deg);}',
    'details.param-panel > summary + *{border:1px solid #a9c9ec;border-top:none;border-radius:0 0 8px 8px;background:#fff;box-sizing:border-box;}',
    '.param-panel-title{font-size:15px !important;font-weight:700 !important;color:#1a2233 !important;margin:0 0 10px 0 !important;padding:0 !important;border:none !important;background:transparent !important;letter-spacing:.02em;}',
    '.sub-section-title{display:block;width:100%;box-sizing:border-box;font-size:13px;font-weight:700;color:#3b5bdb;margin:10px 0 6px;padding:0;border:none;background:transparent;letter-spacing:.01em;}',
    '.node-action-panel{position:fixed;z-index:9100;width:270px;max-height:calc(100vh - 20px);overflow-y:auto;background:#f8f8f8;border:1px solid #d4d4d4;border-radius:4px;box-shadow:0 20px 45px rgba(8,41,45,.16);display:none;font-size:13px;padding:4px 0;}',
    '.node-action-panel .nap-title{padding:6px 12px;font-weight:700;font-size:12.5px;color:#1f4068;border-bottom:1px solid #ddd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:246px;}',
    '.node-action-panel .nap-btn{display:block;width:100%;text-align:left;border:0;background:none;padding:7px 14px;cursor:pointer;font:inherit;color:#1d2c2e;position:relative;}',
    '.node-action-panel .nap-btn:hover{background:#cfcac6;}',
    '.node-action-panel .nap-btn:disabled{color:#aaa;cursor:not-allowed;background:none;}',
    '.node-action-panel .nap-btn.has-sub::after{content:"▾";position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#666;font-size:11px;}',
    '.node-action-panel .nap-btn.has-sub.open::after{content:"▴";}',
    '.node-action-panel .nap-row{display:grid;grid-template-columns:90px minmax(0,1fr);align-items:center;gap:8px;padding:6px 12px;}',
    '.node-action-panel .nap-row label{font-size:12.5px;color:#1d2c2e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.node-action-panel .nap-row input[type=color]{width:100%;height:26px;padding:0;border:1px solid #ccc;border-radius:4px;cursor:pointer;background:#fff;}',
    '.node-action-panel .nap-row input[type=number]{width:100%;padding:4px 6px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;}',
    '.node-action-panel .nap-sub{display:none;border-top:1px solid #e4e4e4;background:#f4f7fb;padding:4px 0 6px;}',
    '.node-action-panel .nap-sub.open{display:block;}',
    '.node-action-panel .nap-sub-title{padding:6px 14px 4px;font-size:11.5px;font-weight:700;color:#666;letter-spacing:.5px;}',
    '.node-action-panel .nap-sub-btn{display:flex;align-items:center;gap:8px;width:100%;text-align:left;border:0;background:none;padding:7px 22px;cursor:pointer;font:inherit;color:#1d2c2e;}',
    '.node-action-panel .nap-sub-btn:hover{background:#e6eef8;}',
    '.node-action-panel .nap-sub-btn:disabled{color:#aaa;cursor:not-allowed;background:none;}',
    '.node-action-panel .nap-sub-btn.active{background:#dbe6f0;font-weight:700;}',
    '.node-action-panel .nap-sub-radio{width:14px;display:inline-block;text-align:center;font-size:12px;color:#2a5a8e;}',
    '.node-action-panel .nap-sub-btn.active .nap-sub-radio{color:#c0392b;}',
    '.node-action-panel .nap-sub-actions{display:flex;gap:6px;padding:4px 12px 6px;}',
    '.node-action-panel .nap-sub-mini{flex:1;border:1px solid #cdd6d4;background:#fff;border-radius:4px;padding:5px 8px;font-size:12px;cursor:pointer;color:#1d2c2e;}',
    '.node-action-panel .nap-sub-mini:hover{background:#e6eef8;border-color:#a9c9ec;}',
    '.node-action-panel .nap-hint{padding:2px 14px 6px;font-size:11px;color:#889;line-height:1.4;}',
    '.node-action-panel .nap-close{border-top:1px solid #ddd;color:#666;text-align:center;margin-top:4px;}',
    'tr.row-selected td{background:#fff0f0 !important;color:#b30;}',
    '.node-label-item{border:1px solid #dce6e3;border-radius:6px;padding:10px 12px;margin-bottom:10px;background:#fafcfb;}',
    '.node-label-item .nli-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:700;color:#1f4068;}',
    '.node-label-item .nli-remove{border:0;background:#e74c3c;color:#fff;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:14px;}',
    '.track-list{display:flex;flex-direction:column;gap:8px;margin-top:10px;overflow:visible;}',
    '.track-item{border:1px solid #dce6e3;border-radius:6px;background:#fafcfb;overflow:visible !important;}',
    '.track-header{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#eef3f9;border-bottom:1px solid #dce6e3;}',
    '.track-title{flex:1;font-weight:700;font-size:13px;color:#1f4068;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.track-toggle{border:0;background:none;cursor:pointer;font-size:14px;color:#455;}',
    '.track-remove{border:0;background:#e74c3c;color:#fff;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:14px;line-height:1;}',
    '.track-body{padding:10px 12px;overflow:visible;}',
    '.multi-col-select{width:100%;}',
    '.palette-slot{width:100%;}',
    '.track-legend{cursor:move;}',
    '.track-legend:hover{filter:drop-shadow(0 0 2px rgba(255,75,75,.5));}',
    '.custom-color-list label span{font-size:12px;color:#333;}',
    '.multi-col-checks label{display:block;padding:2px 0;font-size:12px;}',
    '.refline-list .param-item label{font-size:12px;}',
    '.flash-highlight{animation:treeFlash 1.2s ease;}',
    '@keyframes treeFlash{0%{box-shadow:0 0 0 0 rgba(255,75,75,.7);}100%{box-shadow:0 0 0 12px rgba(255,75,75,0);}}',
    '#treeSidebar{position:fixed;top:80px;left:0;width:210px;max-height:calc(100vh - 120px);background:#fff;border:1px solid #d8e2ec;border-left:none;border-radius:0 8px 8px 0;box-shadow:0 6px 18px rgba(15,35,60,.10);z-index:1200;transition:width .2s ease;display:flex;flex-direction:column;overflow:hidden;}',
    '#treeSidebar.collapsed{width:34px;}',
    '#treeSidebar .tsb-toggle{width:100%;height:34px;border:0;background:#eef3f9;cursor:pointer;font-size:14px;color:#1f4068;border-bottom:1px solid #d8e2ec;}',
    '#treeSidebar .tsb-nav{display:flex;flex-direction:column;padding:6px 0;overflow-y:auto;overflow-x:hidden;}',
    '#treeSidebar.collapsed .tsb-nav{display:none;}',
    '#treeSidebar .tsb-nav a{display:block;padding:6px 12px;color:#1e3a8a;text-decoration:none;font-size:12.5px;line-height:1.4;border-left:3px solid transparent;}',
    '#treeSidebar .tsb-nav a.tsb-card-link{font-weight:700;font-size:13px;color:#0f2b52;padding:8px 12px;}',
    '#treeSidebar .tsb-nav a.tsb-mod-link{padding-left:22px;color:#333;font-weight:500;font-size:12.5px;}',
    '#treeSidebar .tsb-nav a:hover{background:#eef3f9;border-left-color:#1e3a8a;}',
    '.step-card,.param-panel{scroll-margin-top:120px;}',
    '@media (max-width:900px){#treeSidebar{top:auto !important;bottom:60px;max-height:280px;}}',
    '.donate-popup, .donate-modal, .donate-box, #donateModal, #donatePopup { z-index: 20000 !important; position: fixed !important; }',
    '.donate-popup *, .donate-modal *, #donateModal *, #donatePopup * { z-index: inherit; }',
    '.modal-backdrop, .popup-backdrop { z-index: 19000 !important; }',
    '.param-grid.cols-4{grid-template-columns:repeat(4,minmax(0,1fr)) !important;}',
    '.param-grid.cols-3{grid-template-columns:repeat(3,minmax(0,1fr)) !important;}',
    '.param-grid.cols-2{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}',
    '.param-item{min-width:0 !important;}',
    '.param-item label{word-break:break-word;overflow-wrap:anywhere;line-height:1.35;}',
    '.param-item input,.param-item select,.param-item textarea{width:100% !important;box-sizing:border-box !important;min-width:0 !important;}',
    '.param-item .mini-check{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}',
    '.param-item .mini-check input[type=checkbox]{width:auto !important;flex:0 0 auto;}'
  ].join('');
  var s = document.createElement('style'); s.id = 'tree-float-style'; s.textContent = css; document.head.appendChild(s);
})();

function refreshTreeView() {
  if (global.TreeRenderer && global.TreeRenderer.draw) global.TreeRenderer.draw();
  if (global.TreeRanges && global.TreeRanges.renderRangesPanel) global.TreeRanges.renderRangesPanel();
}

function enableWheelZoom(svg) {
  if (!svg || svg.dataset.wheelZoomBound === "1") return;
  svg.dataset.wheelZoomBound = "1";
  svg.addEventListener("wheel", (e) => {
    if (!C.getRoot()) return;
    e.preventDefault();
    const st = C.state;
    const vb = C.getViewBox();
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const fx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const fy = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const z0 = Math.max(0.1, Number(st.zoom) || 1);
    const px0 = Number(st.panX) || 0, py0 = Number(st.panY) || 0;
    const vx0 = vb.x - px0, vy0 = vb.y - py0;
    const vw0 = vb.w / z0, vh0 = vb.h / z0;
    const wx = vx0 + fx * vw0, wy = vy0 + fy * vh0;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const z1 = Math.min(8, Math.max(0.3, z0 * factor));
    if (Math.abs(z1 - z0) < 1e-6) return;
    const vw1 = vb.w / z1, vh1 = vb.h / z1;
    const vx1 = wx - fx * vw1, vy1 = wy - fy * vh1;
    st.zoom = z1;
    st.panX = vb.x - vx1;
    st.panY = vb.y - vy1;
    svg.setAttribute("viewBox", `${vx1} ${vy1} ${vw1} ${vh1}`);
  }, { passive: false });
}

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
  
  clone.querySelectorAll('.node-hotspot').forEach(el => {
    const fill = el.getAttribute('fill');
    const stroke = el.getAttribute('stroke');
    if (fill === 'transparent' || stroke === 'transparent') {
      el.remove();                         
    } else {
      el.removeAttribute('class');         
      el.removeAttribute('data-id');
    }
  });
  clone.querySelectorAll('.legend-hit').forEach(el => el.remove());

  bmLastFrame = { x: vb.x, y: vb.y, w: vb.w * k, h: vb.h * k };
  return new XMLSerializer().serializeToString(clone);
}function download(filename, content, type) {
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
    const url = URL.createObjectURL(new Blob([svgText], {type:"image/svg+xml;charset=utf-8"}));
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

function detectAndFixTimeTree(root) {
  if (!root) return false;
  const medianKeys = new Set(), hpdKeys = new Set(), meanKeys = new Set();
  T.allWalk(root, n => {
    (n.meta || []).forEach(f => {
      if (!f || !f.field) return;
      if (/height_median/i.test(f.field)) medianKeys.add(f.field);
      else if (/height_95%|95%_HPD|95%HPD/i.test(f.field)) hpdKeys.add(f.field);
      else if (/height_mean/i.test(f.field)) meanKeys.add(f.field);
    });
  });
  const hasHeight = medianKeys.size > 0 || hpdKeys.size > 0 || meanKeys.size > 0;
  if (!hasHeight) {
    C.state.isTimeTree = false;
    C.state.timeTreeMode = false;
    C.state.timeTreeMeta = null;
    return false;
  }
  T.allWalk(root, n => {
    if (!isFinite(n.length) || n.length < 0) n.length = 0;
  });
  C.state.isTimeTree = true;
  C.state.timeTreeMode = true;
  C.state.timeTreeMeta = {
    medianKeys: [...medianKeys],
    hpdKeys: [...hpdKeys],
    meanKeys: [...meanKeys]
  };
  C.state.axisReverse = true;
  return true;
}

const leafData = { headers: [], rows: [], columnTypes: {}, leafMap: new Map() };

C.registerSnapshot('leafData', () => ({
  headers: leafData.headers.slice(),
  rows: JSON.parse(JSON.stringify(leafData.rows)),
  columnTypes: JSON.parse(JSON.stringify(leafData.columnTypes))
}), s => {
  if (Array.isArray(s.headers)) leafData.headers = s.headers;
  if (Array.isArray(s.rows)) leafData.rows = s.rows;
  if (s.columnTypes) leafData.columnTypes = s.columnTypes;
  rebuildLeafMap();
  renderLeafDataPreview();
  refreshDataSummary();
});
function getTreeLeafNames() {
  if (!C.getRoot()) return [];
  return T.visibleLeaves(C.getRoot()).map(n => n.name || T.labelOf(n));
}
function rebuildLeafMap() {
  leafData.leafMap = new Map();
  if (!leafData.headers.length) return;
  const leafCol = leafData.headers[0];
  leafData.rows.forEach(r => {
    const k = String(r[leafCol] == null ? "" : r[leafCol]).trim();
    if (k) leafData.leafMap.set(k, r);
  });
}
function rebuildLeafRowsFromTree() {
  const leaves = getTreeLeafNames();
  if (!leaves.length) {
    leafData.headers = []; leafData.rows = []; leafData.leafMap = new Map();
    return;
  }
  const prev = new Map();
  if (leafData.rows.length) {
    const leafCol = leafData.headers[0] || "Leaf";
    leafData.rows.forEach(r => {
      const k = String(r[leafCol] == null ? "" : r[leafCol]).trim();
      if (k) prev.set(k, r);
    });
  }
  const extraCols = leafData.headers.slice(1);
  leafData.headers = ["Leaf", ...extraCols];
  leafData.rows = leaves.map(name => {
    const row = { Leaf: name };
    const old = prev.get(name);
    if (old) extraCols.forEach(col => { row[col] = old[col]; });
    return row;
  });
  rebuildLeafMap();
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch])); }
function uniqueColName(base) {
  if (!leafData.headers.includes(base)) return base;
  let i = 2;
  while (leafData.headers.includes(base + "-" + i)) i++;
  return base + "-" + i;
}
function renderLeafDataPreview() {
  const box = document.getElementById("leafDataPreview");
  if (!box) return;
  if (!leafData.headers.length || !leafData.rows.length) {
    box.innerHTML = '<div class="empty-tip">' + I.t('tableEmptyHint') + '</div>';
    return;
  }
  const headers = leafData.headers;
  const rows = leafData.rows.slice(0, 500);
  const thead = '<tr>' + headers.map(h => {
    const t = leafData.columnTypes[h] || '';
    const tag = t ? `<span style="font-size:10px;color:#888;background:#eef;padding:1px 4px;border-radius:3px;margin-left:4px;">${t}</span>` : '';
    return `<th>${escapeHtml(h)}${tag}</th>`;
  }).join('') + '</tr>';
  const tbody = rows.map(row =>
    '<tr>' + headers.map(h => `<td>${escapeHtml(row[h] == null ? '' : row[h])}</td>`).join('') + '</tr>'
  ).join('');
  const more = leafData.rows.length > rows.length
    ? `<div class="info-box" style="margin:6px 0 0;">${I.t('tableFiltered', { shown: rows.length, total: leafData.rows.length })}</div>` : '';
  box.innerHTML = `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>${more}`;
}
function refreshDataSummary() {
  const el = document.getElementById("dataSummary");
  if (!el) return;
  const treeLeaves = getTreeLeafNames();
  if (!treeLeaves.length) { el.textContent = I.t('summaryNeedTree'); el.className = "tip-text"; return; }
  if (!leafData.rows.length) { el.textContent = I.t('summaryNoData'); el.className = "tip-text"; return; }
  let m = 0;
  treeLeaves.forEach(name => { if (leafData.leafMap.has(name)) m++; });
  if (m === treeLeaves.length) {
    el.innerHTML = `<span style="color:#2e7d32;">${I.t('summarySynced', { n: leafData.rows.length, leaves: treeLeaves.length })}</span>`;
  } else {
    el.innerHTML = `<span style="color:#d93025;">${I.t('summaryPartial', { m: m, total: treeLeaves.length })}</span>`;
  }
}
function exportLeafTemplate() {
  if (!leafData.headers.length || !leafData.rows.length) { alert(I.t('alertNeedTree')); return; }
  const csvCell = v => { const s = String(v == null ? "" : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const lines = [leafData.headers.map(csvCell).join(",")];
  leafData.rows.forEach(row => lines.push(leafData.headers.map(h => csvCell(row[h])).join(",")));
  const csv = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "leaf_labels_table.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function copyTableToClipboard() {
  if (!leafData.headers.length || !leafData.rows.length) { alert(I.t('alertEmptyTable')); return; }
  const lines = [leafData.headers.join("\t")];
  leafData.rows.forEach(row => lines.push(leafData.headers.map(h => String(row[h] == null ? "" : row[h])).join("\t")));
  const tsv = lines.join("\n");
  const done = () => {
    const el = document.getElementById("dataSummary");
    if (el) {
      el.innerHTML = '<span style="color:#2e7d32;">' + I.t('alertCopyOK') + '</span>';
      setTimeout(() => refreshDataSummary(), 2000);
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(tsv).then(done).catch(() => fallbackCopy(tsv, done));
  } else fallbackCopy(tsv, done);
  function fallbackCopy(text, cb) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); cb(); }
    catch (e) { alert(I.t('alertCopyFail', { msg: e.message })); }
    document.body.removeChild(ta);
  }
}
function resetTableToLeaves() {
  if (!leafData.rows.length) { alert(I.t('alertEmptyTable')); return; }
  if (!confirm(I.t('alertClearConfirm'))) return;
  const leaves = getTreeLeafNames();
  if (!leaves.length) {
    leafData.headers = []; leafData.rows = []; leafData.columnTypes = {}; leafData.leafMap = new Map();
  } else {
    leafData.headers = ["Leaf"];
    leafData.rows = leaves.map(name => ({ Leaf: name }));
    leafData.columnTypes = {};
  }
  rebuildLeafMap();
  renderLeafDataPreview();
  refreshDataSummary();
}
function autoFillLeavesInExternal() {
  const ta = document.getElementById("externalDataText");
  if (!ta) return;
  const leaves = getTreeLeafNames();
  if (!leaves.length) { alert(I.t('alertNeedTree')); return; }
  const current = (ta.value || "").trim();
  let headers = ["Leaf"];
  const existingRows = new Map();
  if (current) {
    const lines = current.split(/\r?\n/).filter(l => l.trim());
    if (lines.length) {
      const delim = lines[0].includes("\t") ? "\t" : lines[0].includes(",") ? "," : /\s+/;
      const parse = line => (delim instanceof RegExp) ? line.trim().split(delim) : line.split(delim).map(s => s.trim());
      const h = parse(lines[0]);
      if (h.length) headers = h;
      for (let i = 1; i < lines.length; i++) {
        const cells = parse(lines[i]);
        if (cells[0]) existingRows.set(cells[0].trim(), cells);
      }
    }
  }
  const out = [headers.join("\t")];
  leaves.forEach(name => {
    const cells = new Array(headers.length).fill("");
    cells[0] = name;
    const old = existingRows.get(name);
    if (old) for (let j = 1; j < headers.length; j++) if (old[j] !== undefined) cells[j] = old[j];
    out.push(cells.join("\t"));
  });
  ta.value = out.join("\n");
}
function generateRandomColumns() {
  const ta = document.getElementById("externalDataText");
  if (!ta) return;
  if (!getTreeLeafNames().length) { alert(I.t('alertNeedTree')); return; }
  if (!ta.value.trim()) autoFillLeavesInExternal();
  if (!ta.value.trim()) return;
  const lines = ta.value.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return;
  const delim = lines[0].includes("\t") ? "\t" : lines[0].includes(",") ? "," : /\s+/;
  const parse = line => (delim instanceof RegExp) ? line.trim().split(delim) : line.split(delim).map(s => s.trim());
  const headers = parse(lines[0]);
  let binIdx = headers.indexOf("rand_binary");
  let valIdx = headers.indexOf("rand_value");
  let v2Idx  = headers.indexOf("rand_val2");
  let v3Idx  = headers.indexOf("rand_val3");
  if (binIdx < 0) { headers.push("rand_binary"); binIdx = headers.length - 1; }
  if (valIdx < 0) { headers.push("rand_value");  valIdx = headers.length - 1; }
  if (v2Idx  < 0) { headers.push("rand_val2");   v2Idx  = headers.length - 1; }
  if (v3Idx  < 0) { headers.push("rand_val3");   v3Idx  = headers.length - 1; }
  const out = [headers.join("\t")];
  for (let i = 1; i < lines.length; i++) {
    const cells = parse(lines[i]);
    while (cells.length < headers.length) cells.push("");
    cells[binIdx] = Math.random() < 0.5 ? "0" : "1";
    cells[valIdx] = (Math.random() * 10).toFixed(2);
    cells[v2Idx]  = (Math.random() * 10).toFixed(2);
    cells[v3Idx]  = (Math.random() * 10).toFixed(2);
    out.push(cells.join("\t"));
  }
  ta.value = out.join("\n");
  const textRadio = document.querySelector('input[name="extDataMode"][value="text"]');
  if (textRadio && !textRadio.checked) { textRadio.checked = true; textRadio.dispatchEvent(new Event("change")); }
}
function mergeExternalData(parsed) {
  if (!parsed || !parsed.headers.length) return;
  C.snapshot();  
  const leafCol = parsed.headers[0];
  const extraCols = parsed.headers.slice(1);
  extraCols.forEach(col => { if (!leafData.headers.includes(col)) leafData.headers.push(col); });
  const inferred = (global.PlotCommon && PlotCommon.inferColumnTypes)
    ? PlotCommon.inferColumnTypes(parsed.headers, parsed.data) : {};
  Object.assign(leafData.columnTypes, inferred, parsed.columnTypes || {});
  const ext = new Map();
  parsed.data.forEach(r => { const k = String(r[leafCol] == null ? "" : r[leafCol]).trim(); if (k) ext.set(k, r); });
  leafData.rows.forEach(row => {
    const e = ext.get(String(row.Leaf || "").trim());
    extraCols.forEach(col => {
      if (e && e[col] !== undefined && e[col] !== "") row[col] = e[col];
      else if (row[col] === undefined || row[col] === "") row[col] = "NA";
    });
  });
  rebuildLeafMap(); renderLeafDataPreview(); refreshDataSummary();
}
function applyPrefixColumn() {
  if (!leafData.rows.length) { alert(I.t('alertNeedTree')); return; }
  C.snapshot();    
  const rule = document.getElementById("prefixRule")?.value || "chars";
  const param = (document.getElementById("prefixParam")?.value || "").trim();
  let base;
  if (rule === "chars") { const n = Math.max(1, parseInt(param, 10) || 1); base = "prefix-chars" + n; }
  else if (rule === "delimiter") { base = "prefix-delim" + (param ? param.replace(/\s+/g, "_") : "empty"); }
  else { base = "prefix-digit"; }
  const colName = uniqueColName(base);
  leafData.headers.push(colName);
  leafData.rows.forEach(row => {
    const name = String(row.Leaf || "");
    let val = "";
    if (rule === "chars") val = name.slice(0, Math.max(1, parseInt(param, 10) || 1));
    else if (rule === "delimiter") {
      if (!param) val = name;
      else { const idx = name.indexOf(param); val = idx > 0 ? name.slice(0, idx) : name; }
    } else {
      const m = name.match(/^([^\d]*)/);
      val = m && m[1] ? m[1] : "Other";
    }
    row[colName] = val || "NA";
  });
  leafData.columnTypes[colName] = "categorical";
  renderLeafDataPreview(); refreshDataSummary();
}
function applyCladeColumn() {
  const root = C.getRoot();
  if (!root) { alert(I.t('alertNeedTree')); return; }
  C.snapshot();   
  const depth = Math.max(1, Math.min(10, parseInt(document.getElementById("cladeDepth")?.value, 10) || 1));
  const colName = uniqueColName("clade-L" + depth);
  leafData.headers.push(colName);
  const keyOfLeaf = new Map();
  T.visibleLeaves(root).forEach(leaf => {
    const chain = []; let cur = leaf;
    while (cur) { chain.push(cur); cur = cur.parent; }
    chain.reverse();
    let key;
    if (chain.length > depth) { const branch = chain[depth]; key = branch.name || branch.uid || branch.id; }
    else key = "root";
    keyOfLeaf.set(leaf.name || T.labelOf(leaf), key);
  });
  const groups = new Map();
  leafData.rows.forEach(row => { const k = keyOfLeaf.get(row.Leaf); if (k === undefined) return; if (!groups.has(k)) groups.set(k, "clade" + (groups.size + 1)); });
  leafData.rows.forEach(row => { const k = keyOfLeaf.get(row.Leaf); row[colName] = k !== undefined ? (groups.get(k) || "NA") : "NA"; });
  leafData.columnTypes[colName] = "categorical";
  renderLeafDataPreview(); refreshDataSummary();
}
function applyClusterColumn() {
  const root = C.getRoot();
  if (!root) { alert(I.t('alertNeedTree')); return; }
  C.snapshot();   
  const N = Math.max(2, Math.min(20, parseInt(document.getElementById("clusterN")?.value, 10) || 5));
  const colName = uniqueColName("cluster-" + N);
  leafData.headers.push(colName);
  let clades = (root.children || []).filter(c => !c.deleted);
  if (!clades.length) clades = [root];
  let guard = 400;
  while (clades.length < N && guard-- > 0) {
    clades.sort((a, b) => T.leavesUnder(b).length - T.leavesUnder(a).length);
    const big = clades.shift();
    const kids = ((big && big.children) || []).filter(c => !c.deleted);
    if (!kids.length) { clades.push(big); break; }
    clades = clades.concat(kids);
  }
  clades.sort((a, b) => T.leavesUnder(b).length - T.leavesUnder(a).length);
  clades = clades.slice(0, N);
  const map = new Map();
  clades.forEach((c, i) => { const name = "cluster" + (i + 1); T.leavesUnder(c).forEach(l => map.set(l.name || T.labelOf(l), name)); });
  leafData.rows.forEach(row => { row[colName] = map.get(row.Leaf) || "NA"; });
  leafData.columnTypes[colName] = "categorical";
  renderLeafDataPreview(); refreshDataSummary();
}
function applyCustomPrefixColumn() {
  if (!leafData.rows.length) { alert(I.t('alertNeedTree')); return; }
  const col = document.getElementById("customPrefixColumn")?.value || "";
  if (!col) { alert(I.t('alertNeedSelectColumn')); return; }
  const prefix = (document.getElementById("customPrefixInput")?.value || "").trim();
  if (!prefix) { alert(I.t('alertNeedPrefix')); return; }
  const customName = (document.getElementById("customPrefixNewCol")?.value || "").trim();
  const base = customName || (col + "_prefixed");
  const colName = uniqueColName(base);
  C.snapshot();
  leafData.headers.push(colName);
  let count = 0;
  leafData.rows.forEach(row => {
    const raw = row[col];
    if (raw == null || raw === "") { row[colName] = ""; return; }
    row[colName] = prefix + String(raw);
    count++;
  });
  leafData.columnTypes[colName] = leafData.columnTypes[col] || "categorical";
  renderLeafDataPreview();
  refreshDataSummary();
  const st = document.getElementById("status");
  if (count === 0) {
    if (st) st.textContent = I.t('statusPrefixNoData');
    return;
  }
  if (st) st.textContent = I.t('statusPrefixCreated', { col: colName, n: count, prefix, src: col });
}
function refreshCustomPrefixColumns() {
  const sel = document.getElementById("customPrefixColumn");
  if (!sel) return;
  const cur = sel.value;
  const headers = leafData.headers.slice();
  sel.innerHTML = `<option value="">${I.t('colPlaceholder')}</option>` +
    headers.map(h => {
      const display = h === "Leaf" ? `${h}` : h;
      return `<option value="${escapeHtml(h)}" ${h === cur ? 'selected' : ''}>${escapeHtml(display)}</option>`;
    }).join('');
}
function formatMetaValue(v) {
  if (v == null) return "";
  if (Array.isArray(v)) {
    return "[" + v.map(x => {
      if (typeof x === "number") { if (Number.isInteger(x)) return String(x); return Number(x).toPrecision(6).replace(/\.?0+(e|$)/i, "$1"); }
      return String(x);
    }).join(", ") + "]";
  }
  if (typeof v === "number") { if (Number.isInteger(v)) return String(v); return Number(v).toPrecision(6).replace(/\.?0+(e|$)/i, "$1"); }
  if (typeof v === "object") { try { return JSON.stringify(v); } catch (_) { return String(v); } }
  return String(v);
}
function collectNodeRows() {
  const root = C.getRoot();
  if (!root) return { rows: [], metaFields: [] };
  const depthMap = new Map();
  (function walk(n, depth, cumLen) {
    depthMap.set(n, { depth, cumLen });
    (n.children || []).forEach(c => walk(c, depth + 1, cumLen + (Number(c.length) || 0)));
  })(root, 0, 0);
  const metaSet = new Set();
  T.allWalk(root, n => (n.meta || []).forEach(f => { if (f && f.field) metaSet.add(f.field); }));
  const PRIORITY = ["posterior","height","height_median","height_95%_HPD","height_range","length","length_median","length_95%_HPD","length_range","rate","rate_median","rate_95%_HPD","rate_range"];
  const metaFields = Array.from(metaSet).sort((a, b) => {
    const ai = PRIORITY.indexOf(a), bi = PRIORITY.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });
  const fmtSupport = v => {
    if (v == null || v === "") return "";
    const fn = global.TreeDrawNode && global.TreeDrawNode.formatBootstrapValue;
    try { return fn ? fn(v) : String(v); } catch (_) { return String(v); }
  };
  const rows = [];
  let idx = 0;
  T.allWalk(root, n => {
    idx++;
    const realChildren = (n.children || []).filter(c => !c.deleted);
    const isLeaf = realChildren.length === 0;
    const parentLabel = n.parent ? (T.labelOf(n.parent) || n.parent.id) : "";
    const dm = depthMap.get(n) || { depth: 0, cumLen: 0 };
    const metaMap = {};
    (n.meta || []).forEach(f => {
      if (f && f.field) {
        const v = formatMetaValue(f.value);
        metaMap[f.field] = metaMap[f.field] ? metaMap[f.field] + "; " + v : v;
      }
    });
    let status = "";
    if (n.deleted) status = "deleted"; else if (n.collapsed) status = "collapsed";
    rows.push({
      _idx: idx, _id: n.id, _isLeaf: isLeaf, _collapsed: !!n.collapsed,
      uid: n.uid || "", label: T.labelOf(n) || "",
      type: isLeaf ? "leaf" : "internal",
      depth: dm.depth, cumLength: dm.cumLen,
      length: (n.length != null) ? Number(n.length) : "",
      supportStr: fmtSupport(n.support),
      parent: parentLabel, children: realChildren.length, status: status,
      branchColor: n.branchColor || "",
      widthFactor: (n.branchWidthFactor != null && n.branchWidthFactor !== 1) ? n.branchWidthFactor : "",
      branchDash: n.branchDash === true ? "yes" : "",
      truncated: n.truncated ? "yes" : "",
      _meta: metaMap
    });
  });
  return { rows, metaFields };
}
function getFilteredNodeRows() {
  const { rows, metaFields } = collectNodeRows();
  const showLeaf = document.getElementById("showLeafNodes")?.checked !== false;
  const showInternal = document.getElementById("showInternalNodes")?.checked !== false;
  const onlySupport = document.getElementById("showOnlyWithSupport")?.checked === true;
  const query = (document.getElementById("nodeTableSearch")?.value || "").trim().toLowerCase();
  const filtered = rows.filter(r => {
    if (r._isLeaf && !showLeaf) return false;
    if (!r._isLeaf && !showInternal) return false;
    if (onlySupport && !r.supportStr) return false;
    if (query) {
      const metaVals = metaFields.map(f => r._meta[f] || "").join(" ");
      const hay = [r._id, r.uid, r.label, r.parent, metaVals].join(" ").toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  return { rows: filtered, metaFields };
}
function highlightSvgNode(id) {
  const svg = C.getSvg();
  if (!svg) return;
  svg.querySelectorAll('.hover-highlight').forEach(el => {
    el.classList.remove('hover-highlight');
    el.removeAttribute('fill');
    el.removeAttribute('stroke');
    el.removeAttribute('stroke-width');
    el.removeAttribute('data-hover');
  });
  if (!id) return;
  svg.querySelectorAll('[data-id="' + id + '"]').forEach(el => {
    el.classList.add('hover-highlight');
    el.setAttribute('data-hover', '1');
    if (el.classList.contains('node-hotspot')) {
      el.setAttribute('fill', 'rgba(255,75,75,0.22)');
      el.setAttribute('stroke', '#ff4b4b');
      el.setAttribute('stroke-width', '2');
    }
  });
}
function renderNodeTable() {
  const box = document.getElementById("nodeTableWrap");
  if (!box) return;
  if (!C.getRoot()) { box.innerHTML = '<div class="empty-tip">' + I.t('tableEmptyHint') + '</div>'; return; }
  const { rows, metaFields } = getFilteredNodeRows();
  if (!rows.length) { box.innerHTML = '<div class="empty-tip">' + I.t('tableNoMatchHint') + '</div>'; return; }
  const baseHeaders = ["#","ID","Label","Type","Depth","CumLength","Length","Support","Parent","Children","Status","BranchColor","WidthFactor","BranchDash","Truncated"];
  const headers = baseHeaders.concat(metaFields.map(f => "Meta: " + f));
  const thead = '<tr>' + headers.map(h => {
    const isHPD = /95%|HPD|posterior/i.test(h);
    const style = isHPD ? ' style="color:#c0392b;font-weight:800;"' : "";
    return `<th${style}>${escapeHtml(h)}</th>`;
  }).join('') + '</tr>';
  const MAX_ROWS = 2000;
  const toShow = rows.slice(0, MAX_ROWS);
  const cell = v => escapeHtml(v == null ? "" : v);
  const editableCell = (id, kind, content, extraStyle) => {
    const st = extraStyle ? ` style="${extraStyle}"` : "";
    return `<span class="editable-cell" data-id="${cell(id)}" data-edit="${kind}"${st}>${content}</span>`;
  };
  const selId = C.getSelectedId();
  const tbody = toShow.map(r => {
    const cells = [
      r._idx,
      "<code>" + cell(r._id) + "</code>",
      editableCell(r._id, "label", cell(r.label)),
      r._isLeaf ? '<span style="color:#2e7d32;">leaf</span>' : '<span style="color:#1f4068;">internal</span>',
      r.depth,
      r.cumLength.toFixed(4),
      editableCell(r._id, "length", r.length === "" ? "" : Number(r.length).toFixed(4)),
      editableCell(r._id, "support", cell(r.supportStr)),
      cell(r.parent),
      r.children,
      r.status === "deleted" ? '<span style="color:#999;">deleted</span>' :
        r.status === "collapsed" ? '<span style="color:#c0392b;">collapsed</span>' : "",
      cell(r.branchColor),
      r.widthFactor === "" ? "" : r.widthFactor,
      cell(r.branchDash),
      cell(r.truncated)
    ];
    metaFields.forEach(f => {
      const v = cell(r._meta[f] || "");
      const isHPD = /95%|HPD|posterior/i.test(f);
      const inner = editableCell(r._id, "meta:" + f, v);
      cells.push(isHPD ? `<span style="color:#c0392b;font-weight:600;">${inner}</span>` : inner);
    });
    const cls = (r._id === selId) ? ' class="row-selected"' : "";
    return '<tr data-id="' + cell(r._id) + '" style="cursor:pointer;"' + cls + '>' + cells.map(c => '<td>' + c + '</td>').join('') + '</tr>';
  }).join('');
  const more = rows.length > toShow.length
    ? `<div class="info-box" style="margin:6px 0 0;">${I.t('tableFiltered', { shown: MAX_ROWS, total: rows.length })}</div>`
    : `<div class="info-box" style="margin:6px 0 0;">${I.t('tableTotal', { n: rows.length })}</div>`;
  box.innerHTML = `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>${more}`;
  box.querySelectorAll('tbody tr[data-id]').forEach(tr => {
    const id = tr.dataset.id;
    tr.addEventListener('mouseenter', () => highlightSvgNode(id));
    tr.addEventListener('mouseleave', () => highlightSvgNode(null));
    tr.addEventListener('click', (e) => {
      if (e.detail > 1) return;  
      const cx = e.clientX, cy = e.clientY;
      C.setSelectedId(id);
      refreshTreeView();
      box.querySelectorAll('tbody tr').forEach(x => x.classList.remove('row-selected'));
      tr.classList.add('row-selected');
      setTimeout(() => showNodeActionPanel(id, cx, cy), 0);
    });
  });
  box.querySelectorAll('.editable-cell').forEach(span => {
    span.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startEditCell(span);
    });
  });
}
function startEditCell(span) {
  if (!span || span.querySelector('input')) return;
  const id = span.dataset.id;
  const edit = span.dataset.edit;
  const n = T.nodeById(id);
  if (!n) return;

  let raw = '';
  let apply = null;

  if (edit === 'label') {
    raw = n.label != null ? String(n.label) : (n.name || '');
    apply = (v) => { n.label = v === '' ? null : v; };
  } else if (edit === 'length') {
    raw = (n.length != null) ? String(n.length) : '';
    apply = (v) => {
      const num = Number(v);
      if (Number.isFinite(num) && num >= 0) n.length = num;
    };
  } else if (edit === 'support') {
    raw = (n.support != null) ? String(n.support) : '';
    apply = (v) => { n.support = v; };
  } else if (edit.indexOf('meta:') === 0) {
    const field = edit.slice(5);
    const list = (n.meta || []).filter(mm => mm.field === field);
    if (list.length === 0) {
      raw = '';
    } else if (list.length === 1) {
      const v = list[0].value;
      raw = (typeof v === 'string') ? v : JSON.stringify(v);
    } else {
      raw = JSON.stringify(list.map(mm => mm.value));
    }
    apply = (v) => {
      n.meta = (n.meta || []).filter(mm => mm.field !== field);
      if (v === '') return;
      let val = v;
      try { val = JSON.parse(v); } catch (_) { /* 非 JSON 按纯字符串处理 */ }
      if (list.length > 1 && Array.isArray(val)) {
        val.forEach(x => n.meta.push({ field, value: x }));
      } else {
        n.meta.push({ field, value: val });
      }
    };
  }

  if (!apply) return;

  const original = span.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = raw;
  input.style.cssText =
    'width:100%;box-sizing:border-box;font-family:Consolas,Monaco,monospace;' +
    'font-size:12px;padding:1px 4px;border:1px solid #1f4068;border-radius:3px;' +
    'background:#fff;color:#222;outline:none;';

  span.innerHTML = '';
  span.appendChild(input);
  input.focus();
  input.select();

  let done = false;

  function commit() {
    if (done) return;
    done = true;
    const v = input.value;
    if (v !== raw) {
      C.snapshot();
      apply(v);
      const wrap = document.getElementById('nodeTableWrap');
      const scrollTop = wrap ? wrap.scrollTop : 0;
      global.TreeRenderer.draw();
      renderNodeTable();
      if (wrap) wrap.scrollTop = scrollTop;
      const statusEl = document.getElementById('status');
      if (statusEl) statusEl.textContent = I.t('statusCellUpdated', { field: edit.split(':')[0] === 'meta' ? edit.slice(5) : edit });
    } else {
      span.textContent = original;
    }
  }

  function cancel() {
    if (done) return;
    done = true;
    span.textContent = original;
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
}
function showNodeActionPanel(nodeId, clientX, clientY) {
  const n = T.nodeById(nodeId);
  if (!n) return;
  C.setSelectedBranchId(null);
  let panel = document.getElementById("nodeActionPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "nodeActionPanel";
    panel.className = "node-action-panel";
    document.body.appendChild(panel);
    panel.addEventListener("click", e => e.stopPropagation());
  }
  const isLeaf = T.isLeaf(n);
  const hasChildren = (n.children || []).some(c => !c.deleted);
  const curColor = n.branchColor || C.state.branchColor || "#262626";
  const curWidth = n.branchWidthFactor || 1;
  const collapseLabel = n.collapsed ? I.t('napExpand') : I.t('napCollapse');
  const st = C.state;
  const curMode = st.collapsedMode || "actual";
  const curTipOffset = Number(st.collapsedTipOffset) || 0;
  const curFill = st.collapsedFill || "#dbe6f0";
  const curFillOpacity = (st.collapsedFillOpacity != null) ? Number(st.collapsedFillOpacity) : 0.9;
  const curCompress = !!st.collapsedCompress;
  const curCompressLeafCount = Math.max(1, Number(st.collapsedCompressLeafCount) || 3);
  const canExtend = !!st.extendBranches && st.labelPosition === "aligned";
  const modeTooltip = canExtend ? "" : ` title="${I.t('napExtendTooltip')}"`;
  const kindLabel = isLeaf ? I.t('napLeaf') : I.t('napInternal');

  let ownerRange = null;
  for (let cur = n; cur; cur = cur.parent) {
    if (cur.rangeId != null) {
      ownerRange = global.TreeRanges.colorRanges.find(r => r.id === cur.rangeId) || null;
      break;
    }
  }
  const allRanges = global.TreeRanges.colorRanges;

  panel.innerHTML = `
    <div class="nap-title">${I.t('napTitle', { kind: kindLabel, name: escapeHtml(T.labelOf(n)) })}</div>
    <button class="nap-btn" data-nap="delete">${isLeaf ? I.t('napDeleteLeaf') : I.t('napDeleteClade')}</button>
    <button class="nap-btn has-sub" data-nap="collapse-toggle" ${hasChildren ? "" : "disabled"}>${collapseLabel}</button>
    <div class="nap-sub" data-sub="collapse">
      <div class="nap-sub-title">${I.t('napCollapseTitle')}</div>
      <button class="nap-sub-btn ${curMode==='actual'?'active':''}" data-collapse-mode="actual">
        <span class="nap-sub-radio">${curMode==='actual'?'●':'○'}</span> ${I.t('napByNode')}
      </button>
      <button class="nap-sub-btn ${curMode==='extended'?'active':''}" data-collapse-mode="extended" ${canExtend?'':'disabled'}${modeTooltip}>
        <span class="nap-sub-radio">${curMode==='extended'?'●':'○'}</span> ${I.t('napByExtended')}
      </button>
      <div class="nap-row"><label>${I.t('napTipOffset')}</label><input type="number" class="nap-tip-offset" min="0" step="1" value="${curTipOffset}"></div>
      <div class="nap-row"><label>${I.t('napCompress')}</label><input type="checkbox" class="nap-compress" ${curCompress ? "checked" : ""}></div>
      <div class="nap-row"><label>${I.t('napCompressLeaf')}</label><input type="number" class="nap-compress-leafcount" min="1" step="1" value="${curCompressLeafCount}" ${curCompress ? "" : "disabled"}></div>
      <div class="nap-row"><label>${I.t('napTriangleFill')}</label><input type="color" class="nap-fill" value="${curFill}"></div>
      <div class="nap-row"><label>${I.t('napOpacity')}</label><input type="number" class="nap-fill-opacity" min="0" max="1" step="0.05" value="${curFillOpacity}"></div>
      <div class="nap-hint">${I.t('napCollapseHint')}</div>
    </div>
    <button class="nap-btn" data-nap="reverse" ${isLeaf ? "disabled" : ""}>${I.t('napReverse')}</button>
    <button class="nap-btn" data-nap="dash">${I.t('napDash')}</button>
<button class="nap-btn has-sub" data-nap="range-toggle">${I.t('napRangeManage')}</button>
<div class="nap-sub" data-sub="range">
  <div class="nap-sub-title">${I.t('napRangeGroup')}</div>
  ${ownerRange ? `<div class="nap-hint" style="padding:2px 22px 6px;">${I.t('napRangeCurrent')}<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${ownerRange.color};margin-right:4px;vertical-align:middle;"></span>${escapeHtml(ownerRange.label || ('Range ' + ownerRange.id))}</div>` : ''}
  <button class="nap-sub-btn" data-range-action="create">
    <span class="nap-sub-radio">＋</span> ${I.t('napRangeCreate')}
  </button>
${allRanges.map(r => `
  <div class="nap-range-row" style="display:flex;align-items:center;gap:6px;padding:4px 14px 4px 22px;">
    <input type="color" class="nap-range-color" data-range-edit="${r.id}" value="${r.color}"
           title="${I.t('napRangeEditColor')}"
           style="width:22px;height:22px;padding:0;border:1px solid #ccc;border-radius:3px;cursor:pointer;flex-shrink:0;background:#fff;">
    <button type="button" class="nap-range-name" data-range-apply="${r.id}"
            title="${I.t('napRangeApply')}"
            style="flex:1;min-width:0;text-align:left;padding:4px 6px;background:none;border:0;cursor:pointer;font:inherit;font-size:12.5px;color:#1d2c2e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.label || ('Range ' + r.id))}</button>
    <span class="${n.rangeId === r.id ? 'nap-range-check' : 'nap-range-check-empty'}"
          style="${n.rangeId === r.id ? 'color:#c0392b;font-weight:700;' : ''}flex-shrink:0;width:14px;text-align:center;">${n.rangeId === r.id ? '✓' : ' '}</span>
  </div>
`).join('')}
  <button class="nap-sub-btn" data-range-action="remove" ${n.rangeId == null ? 'disabled' : ''}>
    <span class="nap-sub-radio">−</span> ${I.t('napRangeRemove')}
  </button>
  <div class="nap-hint">${I.t('napRangeHint')}</div>
</div>
    <div class="nap-row"><label>${I.t('napSubtreeColor')}</label><input type="color" class="nap-color" value="${curColor}"></div>
    <div class="nap-row"><label>${I.t('napWidthFactor')}</label><input type="number" class="nap-width" min="0.2" max="8" step="0.1" value="${curWidth}"></div>
    <button class="nap-btn" data-nap="export-subtree" title="${I.t('napExportSubtreeTip')}">${I.t('napExportSubtree')}</button>
    <button class="nap-btn nap-close" data-nap="close">${I.t('napClose')}</button>
  `;

  panel.style.display = "block";
  const w = panel.offsetWidth || 270;
  const h = panel.offsetHeight || 340;
  panel.style.left = Math.min(clientX + 8, window.innerWidth - w - 8) + "px";
  panel.style.top = Math.min(clientY + 8, window.innerHeight - h - 8) + "px";

  const collapseToggle = panel.querySelector('[data-nap="collapse-toggle"]');
  const collapseSub = panel.querySelector('[data-sub="collapse"]');
  const tipOffsetInput = panel.querySelector(".nap-tip-offset");
  const compressCheck = panel.querySelector(".nap-compress");
  const compressLeafCountInput = panel.querySelector(".nap-compress-leafcount");
  const fillInput = panel.querySelector(".nap-fill");
  const fillOpacityInput = panel.querySelector(".nap-fill-opacity");
  const rangeToggle = panel.querySelector('[data-nap="range-toggle"]');
  const rangeSub = panel.querySelector('[data-sub="range"]');

  if (collapseToggle) {
    collapseToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (collapseToggle.disabled) return;
      if (n.collapsed) {
        C.snapshot();
        n.collapsed = false;
        refreshTreeView(); renderNodeTable();
        collapseToggle.textContent = I.t('napCollapse');
        collapseToggle.classList.remove("open");
        collapseSub.classList.remove("open");
        reposition();
      } else {
        const willOpen = !collapseSub.classList.contains("open");
        collapseSub.classList.toggle("open", willOpen);
        collapseToggle.classList.toggle("open", willOpen);
        if (willOpen) reposition();
      }
    });
  }
panel.querySelectorAll("[data-collapse-mode]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      const mode = btn.dataset.collapseMode;
      C.snapshot();
      C.state.collapsedMode = mode;
      n.collapsed = true;
      collapseToggle.textContent = I.t('napExpand');
      collapseToggle.classList.add("open");
      collapseSub.classList.add("open");
      panel.querySelectorAll("[data-collapse-mode]").forEach(b => {
        const active = b.dataset.collapseMode === mode;
        b.classList.toggle("active", active);
        const radio = b.querySelector(".nap-sub-radio");
        if (radio) radio.textContent = active ? "●" : "○";
      });
      refreshTreeView(); renderNodeTable(); reposition();
    });
  });

  if (tipOffsetInput) tipOffsetInput.addEventListener("change", () => {
    const v = Number(tipOffsetInput.value);
    if (!isFinite(v) || v < 0) return;
    C.snapshot(); C.state.collapsedTipOffset = v;
    if (n.collapsed) refreshTreeView();
  });
  if (compressCheck) compressCheck.addEventListener("change", () => {
    C.snapshot(); C.state.collapsedCompress = compressCheck.checked;
    if (compressLeafCountInput) compressLeafCountInput.disabled = !compressCheck.checked;
    if (n.collapsed) refreshTreeView();
  });
  if (compressLeafCountInput) compressLeafCountInput.addEventListener("change", () => {
    const v = Math.max(1, parseInt(compressLeafCountInput.value, 10) || 3);
    C.snapshot(); C.state.collapsedCompressLeafCount = v;
    if (n.collapsed) refreshTreeView();
  });
  if (fillInput) fillInput.addEventListener("input", () => {
    C.snapshot(); C.state.collapsedFill = fillInput.value || "#dbe6f0";
    if (n.collapsed) refreshTreeView();
  });
  if (fillOpacityInput) fillOpacityInput.addEventListener("change", () => {
    const v = Math.max(0, Math.min(1, Number(fillOpacityInput.value)));
    if (!isFinite(v)) return;
    C.snapshot(); C.state.collapsedFillOpacity = v;
    if (n.collapsed) refreshTreeView();
  });

  if (rangeToggle && rangeSub) {
    rangeToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = !rangeSub.classList.contains("open");
      rangeSub.classList.toggle("open", willOpen);
      rangeToggle.classList.toggle("open", willOpen);
      if (willOpen) reposition();
    });
  }

function refreshRangeChecks(activeId) {
  panel.querySelectorAll(".nap-range-check, .nap-range-check-empty").forEach(chk => {
    chk.className = "nap-range-check-empty";
    chk.style.color = "";
    chk.style.fontWeight = "";
    chk.textContent = " ";
  });
  if (activeId != null) {
    const row = panel.querySelector(`[data-range-apply="${activeId}"]`);
    if (row) {
      const chk = row.closest(".nap-range-row")?.querySelector(".nap-range-check-empty");
      if (chk) {
        chk.className = "nap-range-check";
        chk.style.color = "#c0392b";
        chk.style.fontWeight = "700";
        chk.textContent = "✓";
      }
    }
  }
}

panel.querySelectorAll("[data-range-edit]").forEach(inp => {
  inp.addEventListener("click", e => e.stopPropagation());
  inp.addEventListener("input", e => {
    e.stopPropagation();
    const id = Number(inp.dataset.rangeEdit);
    const range = global.TreeRanges.colorRanges.find(r => r.id === id);
    if (!range) return;
    if (inp.dataset.editing !== "1") { C.snapshot(); inp.dataset.editing = "1"; }
    range.color = inp.value;
    global.TreeRenderer.draw();
  });
  inp.addEventListener("change", () => { delete inp.dataset.editing; });
});

panel.querySelectorAll("[data-range-apply]").forEach(btn => {
  btn.addEventListener("click", e => {
    e.stopPropagation();
    const id = Number(btn.dataset.rangeApply);
    C.snapshot();
    n.rangeId = id;
    refreshTreeView();
    renderNodeTable();
    refreshRangeChecks(id);
    reposition();
  });
});

panel.querySelectorAll("[data-range-action]").forEach(rbtn => {
  rbtn.addEventListener("click", e => {
    e.stopPropagation();
    if (rbtn.disabled) return;
    const ract = rbtn.dataset.rangeAction;
    if (ract === "create") {
      global.TreeRanges.createRangeForSelected();
      const rect = panel.getBoundingClientRect();
      panel.style.display = "none";
      setTimeout(() => {
        if (global.TreeApp && global.TreeApp.showNodeActionPanel) {
          global.TreeApp.showNodeActionPanel(n.id, rect.left, rect.top);
        }
      }, 0);
    } else if (ract === "remove") {
      C.snapshot();
      n.rangeId = null;
      refreshTreeView();
      renderNodeTable();
      refreshRangeChecks(null);
    }
  });
});

  panel.querySelectorAll("[data-nap]").forEach(btn => {
    const act = btn.dataset.nap;
    if (act === "collapse-toggle") return;
    if (act === "range-toggle") return;   
    if (act === "close") {
      btn.addEventListener("click", (e) => { e.stopPropagation(); panel.style.display = "none"; });
      return;
    }
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      handleNodeAction(act, n);
    });
  });

  const colorInput = panel.querySelector(".nap-color");
  if (colorInput) colorInput.addEventListener("change", () => {
    const val = colorInput.value || "#262626";
    C.snapshot();
    T.allWalk(n, x => { x.branchColor = val; });
    refreshTreeView(); renderNodeTable();
  });
  const widthInput = panel.querySelector(".nap-width");
  if (widthInput) widthInput.addEventListener("change", () => {
    const v = Number(widthInput.value);
    if (!isFinite(v) || v <= 0) return;
    C.snapshot();
    T.allWalk(n, x => { x.branchWidthFactor = v; });
    refreshTreeView(); renderNodeTable();
  });

  function reposition() {
    const w2 = panel.offsetWidth, h2 = panel.offsetHeight;
    const left = Math.min(parseFloat(panel.style.left) || clientX + 8, window.innerWidth - w2 - 8);
    const top = Math.min(parseFloat(panel.style.top) || clientY + 8, window.innerHeight - h2 - 8);
    panel.style.left = Math.max(8, left) + "px";
    panel.style.top = Math.max(8, top) + "px";
  }
}
function showBranchActionPanel(branchNodeId, clientX, clientY) {
  const n = T.nodeById(branchNodeId);
  if (!n || !n.parent) return;
  let panel = document.getElementById("branchActionPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "branchActionPanel";
    panel.className = "node-action-panel";
    document.body.appendChild(panel);
    panel.addEventListener("click", e => e.stopPropagation());
  }
panel.innerHTML = `
  <div class="nap-title">${I.t('branchTitle', { name: escapeHtml(T.labelOf(n)) })}</div>
  <button class="nap-btn" data-nap="reroot-branch">${I.t('branchReroot')}</button>
  <button class="nap-btn nap-close" data-nap="close">${I.t('branchClose')}</button>
`;
  panel.style.display = "block";
  const w = panel.offsetWidth || 240;
  const h = panel.offsetHeight || 90;
  panel.style.left = Math.min(clientX + 8, window.innerWidth - w - 8) + "px";
  panel.style.top = Math.min(clientY + 8, window.innerHeight - h - 8) + "px";

  panel.querySelector('[data-nap="reroot-branch"]')?.addEventListener("click", () => {
    C.snapshot();
    if (O && O.rerootAt(n)) {
      C.state.hasRoot = true;
      const root = C.getRoot();
      if (root) root.rootFlag = true;
      C.setSelectedBranchId(null);
      refreshTreeView();
      renderNodeTable();
      rebuildLeafRowsFromTree();
      renderLeafDataPreview();
      refreshDataSummary();
    }
    panel.style.display = "none";
  });
  panel.querySelector('[data-nap="close"]')?.addEventListener("click", () => {
    panel.style.display = "none";
  });
}

function handleNodeAction(action, n) {
  if (!n) return;

  if (action === "export-subtree") {
    const S = global.TreeSerialize;
if (!S || !S.cropTreeToPathAndSubtree || !S.toPhyloXMLWithMeta) {
  alert(I.t('alertSerializeMissing')); return;
}
const cropped = S.cropTreeToPathAndSubtree(C.getRoot(), n);
if (!cropped) { alert(I.t('alertExportSubtreeFail')); return; }
    const xml = S.toPhyloXMLWithMeta(cropped);
    const label = String(T.labelOf(n) || n.id || 'subtree').replace(/[^\w.-]+/g, '_');
    if (global.TreeExport && global.TreeExport.download) {
      global.TreeExport.download(label + '_subtree.xml', xml, 'application/xml;charset=utf-8');
    } else {
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = label + '_subtree.xml';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    return;
  }

  C.snapshot();

  if (action === "delete") {
    n.deleted = true;
  }
  else if (action === "reverse") {
    if (n.children && n.children.length > 1) n.children.reverse();
  }
  else if (action === "dash") {
    let anySolid = false;
    T.allWalk(n, x => {
      if (x === n) return;
      const dashed = x.branchDash !== undefined ? x.branchDash : C.state.dashed;
      if (!dashed) anySolid = true;
    });
    const newDash = anySolid;
    T.allWalk(n, x => { if (x !== n) x.branchDash = newDash; });
  }

  refreshTreeView();
  renderNodeTable();
  rebuildLeafRowsFromTree();
  renderLeafDataPreview();
  refreshDataSummary();
}

function exportNodeTableCsv() {
  if (!C.getRoot()) { alert(I.t('alertNeedTreeShort')); return; }
  const { rows, metaFields } = getFilteredNodeRows();
  if (!rows.length) { alert(I.t('alertNoMatchNode')); return; }
  const csvCell = v => { const s = String(v == null ? "" : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const headers = ["index","id","label","type","depth","cumulative_length","branch_length","support","parent","children","status","branch_color","width_factor","branch_dash","truncated"]
    .concat(metaFields.map(f => "meta_" + f));
  const lines = [headers.join(",")];
  rows.forEach(r => {
    const row = [r._idx, r._id, r.label, r.type, r.depth, r.cumLength, r.length, r.supportStr, r.parent, r.children, r.status, r.branchColor, r.widthFactor, r.branchDash, r.truncated];
    metaFields.forEach(f => row.push(r._meta[f] || ""));
    lines.push(row.map(csvCell).join(","));
  });
  const csv = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tree_nodes.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function addMetaColumn() {
  const root = C.getRoot();
  if (!root) { alert(I.t('alertNeedTree')); return; }
  const input = prompt(I.t('addMetaPrompt'), 'meta1');
  if (input === null) return;
  const field = String(input).trim();
  if (!field) return;
  C.snapshot();
  let count = 0;
  T.allWalk(root, n => {
    n.meta = n.meta || [];
    if (!n.meta.find(m => m.field === field)) {
      n.meta.push({ field, value: '' });
      count++;
    }
  });
  refreshTreeView();
  renderNodeTable();
  const st = document.getElementById("status");
  if (st) st.textContent = I.t('addMetaStatus', { field, n: count });
}

function snapshotLeafSet(raw) {
  try {
    const snap = JSON.parse(raw);
    const set = new Set();
    if (snap.root) {
      (function walk(n) {
        const kids = (n.children || []).filter(c => !c.deleted);
        if (n.collapsed || !kids.length) set.add(String(n.name || n.label || n.id));
        else kids.forEach(walk);
      })(snap.root);
    }
    return set;
  } catch (_) { return null; }
}
function sameTree(raw) {
  if (!C.getRoot()) return false;
  const snapSet = snapshotLeafSet(raw);
  if (!snapSet) return false;
  const currentSet = new Set(T.visibleLeaves(C.getRoot()).map(l => String(l.name || l.label || l.id)));
  if (snapSet.size !== currentSet.size) return false;
  for (const s of snapSet) if (!currentSet.has(s)) return false;
  return true;
}
function applyLoadedState(raw, opts) {
  const keepRoot = !!(opts && opts.keepRoot);
  const currentRoot = C.getRoot();
  let snapshotRanges = new Map();
  try {
    const snap = JSON.parse(raw);
    if (keepRoot && snap.root) {
      (function walk(n) {
        const kids = (n.children || []).filter(c => !c.deleted);
        if (n.collapsed || !kids.length) {
          if (n.rangeId != null) snapshotRanges.set(String(n.name || n.label || n.id), n.rangeId);
        } else kids.forEach(walk);
      })(snap.root);
    }
  } catch (_) {}
  C.applySnapshot(raw);
  C.state.zoom = 1;
  C.state.panX = 0;
  C.state.panY = 0;
  if (keepRoot && currentRoot) {
    C.setRoot(currentRoot);
    C.restoreParents(currentRoot, null);
    T.allWalk(currentRoot, n => {
      const kids = (n.children || []).filter(c => !c.deleted);
      if (n.collapsed || !kids.length) {
        const key = String(n.name || n.label || n.id);
        if (snapshotRanges.has(key)) n.rangeId = snapshotRanges.get(key);
      }
    });
  }
  if (global.TreeTracks && global.TreeTracks.tracks) {
    global.TreeTracks.tracks.forEach(t => global.TreeTracks.refreshTrackData(t));
  }
  C.setSelectedId(null);
  C.setSelectedBranchId(null);
  renderNodeTable();
  if (!leafData.rows.length) rebuildLeafRowsFromTree();
  renderLeafDataPreview();
  refreshDataSummary();
  
  if (global.TreeUI) {
    if (global.TreeUI.renderBasicPanel) global.TreeUI.renderBasicPanel(document.getElementById("basicStylePanel"));
    if (global.TreeUI.renderAdvancedPanel) global.TreeUI.renderAdvancedPanel(document.getElementById("advancedStylePanel"));
    if (global.TreeUI.renderDatasetsPanel) global.TreeUI.renderDatasetsPanel(document.getElementById("datasetsPanel"));
    if (typeof bindAllControls === 'function') bindAllControls();
    if (typeof syncControls === 'function') syncControls();
  }
  if (typeof rebuildSidebarNav === 'function') rebuildSidebarNav();
  drawTree();
}
function renderTreeImportPanel() {
  const c = document.getElementById("treeImportPanel");
  if (!c) return;
  c.innerHTML = `
    <div class="mode-tabs">
      <label><input type="radio" name="treeMode" value="file" checked> ${I.t('importUploadFile')}</label>
      <label><input type="radio" name="treeMode" value="text"> ${I.t('importPasteText')}</label>
    </div>
    <div class="file-input">
      <input type="file" id="treeFileInput" class="import-file"
             accept=".nwk,.tree,.tre,.newick,.nex,.nexus,.xml,.phyloxml,.nhx,.txt">
    </div>
    <div class="text-input">
      <textarea id="treeInput" class="import-text" placeholder="${I.t('importPlaceholder')}"></textarea>
    </div>
    <div class="info-box">${I.t('importInfoBox')}</div>
    <div class="btn-group">
      <button type="button" class="btn" id="loadTreeBtn">${I.t('importLoadTree')}</button>
      <button type="button" class="btn" id="loadExampleTimeBtn">${I.t('importLoadExampleTime')}</button>
      <button type="button" class="btn" id="loadExampleBIBtn">${I.t('importLoadExampleBI')}</button>
      <button type="button" class="btn" id="loadExampleMLBtn">${I.t('importLoadExampleML')}</button>
      <button type="button" class="btn" id="loadTreeStateBtn">${I.t('importLoadState')}</button>
      <input type="file" id="treeStateFile" accept=".json" style="display:none;">
    </div>
  `;

  const textarea = document.getElementById("treeInput");
  const fileInput = document.getElementById("treeFileInput");

  function applyTreeMode() {
    const mode = c.querySelector('input[name="treeMode"]:checked').value;
    if (mode === "file") { fileInput.disabled = false; textarea.disabled = true; }
    else { fileInput.disabled = true; textarea.disabled = false; fileInput.value = ""; }
  }
  applyTreeMode();
  c.querySelectorAll('input[name="treeMode"]').forEach(r => r.addEventListener("change", applyTreeMode));

  fileInput?.addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => { loadTree(ev.target.result); showTreeMsg(I.t('treeMsgFileLoaded', { name: f.name }), "success"); };
    reader.readAsText(f);
  });

  document.getElementById("loadTreeBtn")?.addEventListener("click", () => {
    const mode = c.querySelector('input[name="treeMode"]:checked').value;
    if (mode === "file") {
      if (!fileInput.files.length) { showTreeMsg(I.t('treeMsgNoFile'), "error"); return; }
      const reader = new FileReader();
      reader.onload = ev => loadTree(ev.target.result);
      reader.readAsText(fileInput.files[0]);
    } else {
      loadTree(textarea.value);
    }
  });

  // 通用多源加载示例函数
  const loadExample = async (filename, btn) => {
    const textRadio = c.querySelector('input[name="treeMode"][value="text"]');
    if (textRadio && !textRadio.checked) { textRadio.checked = true; textRadio.dispatchEvent(new Event("change")); }
    
    const oldText = btn.textContent;
    btn.textContent = I.t('importLoading');
    btn.disabled = true;
    showTreeMsg(I.t('treeMsgLoadingExample'), '');
    
    const JSDELIVR_PATH = `shueho/biodatatools-top@main/BioStatPlot/COMMON/tree/${filename}`;
    const REMOTE_RAW = `https://raw.githubusercontent.com/shueho/biodatatools-top/main/BioStatPlot/COMMON/tree/${filename}`;

    const candidates = [
      `https://jsd.onmicrosoft.cn/gh/${JSDELIVR_PATH}`,
      `https://fastly.jsdelivr.net/gh/${JSDELIVR_PATH}`,
      `https://gcore.jsdelivr.net/gh/${JSDELIVR_PATH}`,
      `https://cdn.jsdelivr.net/gh/${JSDELIVR_PATH}`,
      REMOTE_RAW
    ];
    
    async function fetchWithTimeout(url, ms = 8000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.text();
      } finally {
        clearTimeout(timer);
      }
    }
    
    let text = '';
    let lastErr = null;
    for (const url of candidates) {
      try {
        text = await fetchWithTimeout(url);
        if (text && text.trim()) break;
      } catch (err) {
        lastErr = err;
      }
    }
    
    btn.textContent = oldText;
    btn.disabled = false;
    
    if (!text || !text.trim()) {
      const msg = lastErr 
        ? I.t('treeMsgLoadExampleFail', { msg: lastErr.message, filename })
        : I.t('treeMsgLoadExampleFailNoErr', { filename });
      if (confirm(msg)) {
        window.open(`https://github.com/shueho/biodatatools-top/blob/main/BioStatPlot/COMMON/tree/${filename}`, '_blank');
      }
      showTreeMsg(I.t('treeMsgLoadExampleFailNoErr', { filename }), 'error');
      return;
    }
    
    textarea.value = text;
    loadTree(text);
  };
  
  document.getElementById("loadExampleTimeBtn")?.addEventListener("click", (e) => loadExample('time.tree', e.target));
  document.getElementById("loadExampleBIBtn")?.addEventListener("click", (e) => loadExample('BI.tre', e.target));
  document.getElementById("loadExampleMLBtn")?.addEventListener("click", (e) => loadExample('ml.contree', e.target));

  document.getElementById("loadTreeStateBtn")?.addEventListener("click", () => {
    document.getElementById("treeStateFile")?.click();
  });
  
  document.getElementById("treeStateFile")?.addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
reader.onload = ev => {
  try {
    const raw = ev.target.result;
    applyLoadedState(raw, { keepRoot: sameTree(raw) });
    showTreeMsg(I.t('importStateLoaded'), "success");
  } catch (err) { showTreeMsg(I.t('importStateLoadFail', { msg: err.message }), "error"); }
};
    reader.readAsText(f);
    e.target.value = "";
  });
}
function showTreeMsg(msg, type) {
  const el = document.getElementById("treeMsg"); if (!el) return;
  el.className = "tip-text " + (type || ""); el.textContent = msg;
  setTimeout(() => { if (el.textContent === msg) { el.textContent = ""; el.className = "tip-text"; } }, 4000);
}
function loadTree(text) {
  try {
    if (!text || !String(text).trim()) { showTreeMsg(I.t('treeMsgEmpty'), "error"); return; }
    const fmt = (P.detectTreeFormat && P.detectTreeFormat(text)) || "newick";
    if (fmt === "empty") { showTreeMsg(I.t('treeMsgEmpty2'), "error"); return; }
    if (fmt === "xml")   { showTreeMsg(I.t('treeMsgXmlUnsupport'), "error"); return; }
    const t = (P.parseTree && P.parseTree(text)) || P.parseNewick(text);
    if (!t) { showTreeMsg(I.t('treeMsgParseFail'), "error"); return; }
const leafCount = T.visibleLeaves(t).length;
if (leafCount < 2) { showTreeMsg(I.t('treeMsgTooFew', { n: leafCount }), "error"); return; }

C.resetIdSeq();
P.assign(t, null);
C.setRoot(t);

if (global.TreeRanges) {
  global.TreeRanges.clearAllColorRanges();   
  global.TreeRanges.rangeSeq = 0;
  if (Array.isArray(global.TreeRanges.geoTimeTracks)) {
    global.TreeRanges.geoTimeTracks.length = 0;
  }
  global.TreeRanges.geoTrackSeq = 0;
  global.TreeRanges.geoEntrySeq = 0;
  global.TreeRanges.geoTimeShow = false;
}
if (global.TreeTracks && Array.isArray(global.TreeTracks.tracks)) {
  global.TreeTracks.tracks.length = 0;       
}
C.state.legendOffsetX = 0;
C.state.legendOffsetY = 0;

const isTime = detectAndFixTimeTree(t);

if (t.rootFlag === false) C.state.hasRoot = false;
else if (t.rootFlag === true) C.state.hasRoot = true;
else C.state.hasRoot = (t._hasExplicitLength === true && Number(t.length) > 0);
    rebuildLeafRowsFromTree();
    renderLeafDataPreview();
    refreshDataSummary();
    renderNodeTable();
    C.setInitialSnapshot(C.captureSnapshot());
    if (global.TreeUI) {
      if (global.TreeUI.renderBasicPanel) global.TreeUI.renderBasicPanel(document.getElementById("basicStylePanel"));
      if (global.TreeUI.renderAdvancedPanel) global.TreeUI.renderAdvancedPanel(document.getElementById("advancedStylePanel"));
      if (global.TreeUI.renderDatasetsPanel) global.TreeUI.renderDatasetsPanel(document.getElementById("datasetsPanel"));
      bindAllControls();
      syncControls();
    }

    rebuildSidebarNav();

    const fmtLabel = { newick: "Newick", nexus: "NEXUS", phyloxml: "PhyloXML" }[fmt] || fmt;
    const rootSuffix = C.state.hasRoot ? I.t('treeMsgHasRoot') : I.t('treeMsgNoRoot');
    showTreeMsg(isTime
      ? I.t('treeMsgLoadedTime', { fmt: fmtLabel, n: leafCount }) + rootSuffix
      : I.t('treeMsgLoaded',     { fmt: fmtLabel, n: leafCount }) + rootSuffix,
      "success");
    drawTree();
  } catch (e) {
    console.error("[TreeApp] loadTree error:", e);
    showTreeMsg("❌ " + (e && e.message ? e.message : e), "error");
  }
}
function showTip(id, msg, type) {
  const el = document.getElementById(id); if (!el) return;
  el.className = "tip-text " + (type || ""); el.textContent = msg;
  setTimeout(() => { if (el.textContent === msg) { el.textContent = ""; el.className = "tip-text"; } }, 5000);
}
function showToolbar(msg) {
  const el = document.getElementById("toolbarTip"); if (!el) return;
  el.innerHTML = msg ? `<span class="success">${msg}</span>` : "";
}

function drawTree() {
  if (!C.getRoot()) { showTip("msgTip3", I.t('treeMsgNoTree'), "error"); return; }
  if (!window.d3) {
    showTip("msgTip3", I.t('treeMsgD3Loading'));
    if (global.PlotBootstrap && PlotBootstrap.ensureD3) {
      PlotBootstrap.ensureD3().then(() => drawTreeActual()).catch(() => showTip("msgTip3", I.t('treeMsgD3Fail'), "error"));
    } else drawTreeActual();
    return;
  }
  drawTreeActual();
}
function drawTreeActual() {
  const preview = document.getElementById("chartPreview"); if (!preview) return;
  preview.style.position = "relative";
  let svg = document.getElementById("treeSvg");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "treeSvg";
    svg.style.width = "100%"; svg.style.height = "600px"; svg.style.display = "block"; svg.style.cursor = "default";
    preview.insertBefore(svg, preview.firstChild);
    C.setSvg(svg);
    if (global.TreeDrag) TreeDrag.enableDrag(svg);
    if (global.TreeDrag && TreeDrag.bindSvgClick) TreeDrag.bindSvgClick(svg);
    enableWheelZoom(svg);
    const placeholder = preview.querySelector(".placeholder"); if (placeholder) placeholder.remove();
  } else if (C.getSvg() !== svg) {
    C.setSvg(svg);
    if (global.TreeDrag) TreeDrag.enableDrag(svg);
    if (global.TreeDrag && TreeDrag.bindSvgClick) TreeDrag.bindSvgClick(svg);
    enableWheelZoom(svg);
  }

  const root = C.getRoot();
  if (root) {
    if (root.rootFlag === false) C.state.hasRoot = false;
    else if (root.rootFlag === true) C.state.hasRoot = true;
    else C.state.hasRoot = (root._hasExplicitLength === true && Number(root.length) > 0);
  }

  refreshTreeView();
  const vb = C.getViewBox();
  const aspect = vb.h / Math.max(1, vb.w);
  const containerW = Math.max(360, preview.clientWidth - 20);
  svg.style.height = Math.min(1000, Math.max(400, containerW * aspect)) + "px";
  const svgBtn = document.getElementById("exportSvgBtn");
  const pngBtn = document.getElementById("exportPngBtn");
  if (svgBtn) svgBtn.disabled = false;
  if (pngBtn) pngBtn.disabled = false;
  showTip("msgTip3", I.t('treeMsgDrawOK'), "success");
  showToolbar(I.t('treeMsgDrawOK'));
}

function renderDataPanel() {
  const box = document.getElementById("externalDataText");
  const fileEl = document.getElementById("extDataFile");
  const fileWrap = document.querySelector(".ext-file-input");
  const textWrap = document.querySelector(".ext-text-input");
  document.querySelectorAll('input[name="extDataMode"]').forEach(r => {
    r.addEventListener("change", () => {
      const mode = document.querySelector('input[name="extDataMode"]:checked').value;
      if (mode === "file") {
        if (fileWrap) fileWrap.style.display = "";
        if (textWrap) textWrap.style.display = "none";
        if (box) box.disabled = true;
      } else {
        if (fileWrap) fileWrap.style.display = "none";
        if (textWrap) textWrap.style.display = "";
        if (box) box.disabled = false;
        if (fileEl) fileEl.value = "";
      }
    });
  });
  fileEl?.addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (box) box.value = ev.target.result;
      const textRadio = document.querySelector('input[name="extDataMode"][value="text"]');
      if (textRadio && !textRadio.checked) { textRadio.checked = true; textRadio.dispatchEvent(new Event("change")); }
    };
    reader.readAsText(f);
  });
  document.getElementById("autoFillLeavesBtn")?.addEventListener("click", autoFillLeavesInExternal);
  document.getElementById("generateRandomBtn")?.addEventListener("click", generateRandomColumns);
  document.getElementById("mergeExternalBtn")?.addEventListener("click", () => {
    const text = (box?.value || "").trim();
    if (!text) { alert(I.t('alertNeedDataText')); return; }
    if (!leafData.rows.length) { alert(I.t('alertNeedTree')); return; }
    const parsed = global.PlotCommon && PlotCommon.parseTable ? PlotCommon.parseTable(text) : null;
    if (!parsed || !parsed.headers.length) { alert(I.t('alertParseFail')); return; }
    mergeExternalData(parsed);
  });
  document.getElementById("applyPrefixBtn")?.addEventListener("click", applyPrefixColumn);
  document.getElementById("applyCladeBtn")?.addEventListener("click", applyCladeColumn);
  document.getElementById("applyClusterBtn")?.addEventListener("click", applyClusterColumn);
  document.getElementById("applyCustomPrefixBtn")?.addEventListener("click", applyCustomPrefixColumn);
  document.getElementById("prefixRule")?.addEventListener("change", e => {
    const input = document.getElementById("prefixParam");
    if (!input) return;
    if (e.target.value === "chars") { input.placeholder = I.t('prefixCharsPh'); if (!input.value.trim()) input.value = "3"; }
    else if (e.target.value === "delimiter") { input.placeholder = I.t('prefixDelimPh'); if (input.value === "3") input.value = "_"; }
    else { input.placeholder = I.t('prefixNoParam'); }
  });
  document.getElementById("exportLeafTemplateBtn")?.addEventListener("click", exportLeafTemplate);
  document.getElementById("copyTableBtn")?.addEventListener("click", copyTableToClipboard);
  document.getElementById("clearTableBtn")?.addEventListener("click", resetTableToLeaves);

  const prefixSel = document.getElementById("customPrefixColumn");
  if (prefixSel) {
    prefixSel.addEventListener("focus", refreshCustomPrefixColumns);
    prefixSel.addEventListener("pointerdown", refreshCustomPrefixColumns);
    refreshCustomPrefixColumns();
  }
}

function bindAllControls() {
  const on = (el, event, handler) => {
    if (!el) return;
    const k = 'bound' + event.charAt(0).toUpperCase() + event.slice(1);
    if (el.dataset[k] === '1') return;
    el.dataset[k] = '1';
    el.addEventListener(event, handler);
  };
  const bindSel = (id, key, cast) => {
    const el = document.getElementById(id);
    on(el, "change", e => {
      C.snapshot();
      let v = e.target.value;
      if (cast === "bool") v = v === "true"; else if (cast === "num") v = Number(v);
      C.state[key] = v; refreshTreeView();
    });
  };
  const bindInp = (id, key, cast) => {
    const el = document.getElementById(id);
    on(el, "input", e => {
      C.snapshot();
      C.state[key] = cast === "num" ? Number(e.target.value) : e.target.value;
      refreshTreeView();
    });
  };
  const bindChk = (id, key) => {
    const el = document.getElementById(id);
    on(el, "change", e => { C.snapshot(); C.state[key] = e.target.checked; refreshTreeView(); });
  };
  const bindPath = (id, path, cast) => {
    const el = document.getElementById(id);
    on(el, "input", () => {
      C.snapshot();
      const parts = path.split(".");
      let obj = C.state;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      const last = parts[parts.length - 1];
      let v;
      if (el.type === "checkbox") v = el.checked;
      else if (cast === "num") v = Number(el.value);
      else if (cast === "bool") v = el.value === "true";
      else v = el.value;
      obj[last] = v;
      refreshTreeView();
    });
  };
  const btn = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };

  bindSel("fontFamily", "fontFamily");
  bindSel("ignoreLength", "ignoreLength", "bool");
  bindSel("branchLengthField", "branchLengthField");
  bindSel("bootstrapRangeSelect", "bootstrapRange"); 
  bindChk("forceMidpointRoot", "forceMidpointRoot");
  bindSel("labelsSelect", "labels", "bool");
  bindSel("labelPositionSelect", "labelPosition");
  bindInp("leafLabelOffsetX", "leafLabelOffsetX", "num");
  bindInp("leafLabelOffsetCirc", "leafLabelOffsetCirc", "num");
  bindInp("fontSize", "fontSize", "num");
  bindInp("labelColor", "labelColor");
  bindChk("boldChk", "bold");
  bindChk("italicChk", "italic");
  bindInp("branchWidth", "branchWidth", "num");
  bindInp("branchColor", "branchColor");
  bindSel("extendBranchesSelect", "extendBranches", "bool");
  bindSel("dashedSelect", "dashed", "bool");
  bindInp("dashSize", "dashSize", "num");

  on(document.getElementById("sortModeSelect"), "change", e => {
    C.snapshot();
    C.state.sortMode = e.target.value;
    refreshTreeView();
  });

  on(document.getElementById("leafReverseSelect"), "change", e => {
    const v = e.target.value === "true";
    if (C.state.leafReverse === v) return;
    C.snapshot();
    C.state.leafReverse = v;
    if (C.getRoot()) {
      T.allWalk(C.getRoot(), n => { if (n.children && n.children.length > 1) n.children.reverse(); });
    }
    refreshTreeView();
  });

  bindSel("axisShowSelect", "axisShow", "bool");
  bindSel("axisPosSelect", "axisPos");
  bindInp("axisRotationInput", "axisRotation", "num");
  bindChk("axisReverseChk", "axisReverse");
    bindInp("axisExtendStartInput", "axisExtendStart", "num");
    bindInp("axisExtendEndInput", "axisExtendEnd", "num");
  bindPath("tickLabelFontSize", "tickLabelFontSize", "num");
  bindPath("tickLabelBold", "tickLabelBold");
  bindPath("tickLabelItalic", "tickLabelItalic");

  bindPath("tickPrimaryInterval", "tickPrimary.interval", "num");
  bindPath("tickPrimaryShowLabels", "tickPrimary.showLabels", "bool");
  bindPath("tickPrimaryShowGrid", "tickPrimary.showGrid", "bool");
  bindPath("tickPrimaryGridDashed", "tickPrimary.gridDashed", "bool");
  bindPath("tickPrimaryGridWidth", "tickPrimary.gridWidth", "num");
  bindPath("tickPrimaryGridColor", "tickPrimary.gridColor");

on(document.getElementById("tickPrimaryCustom"), "change", e => {
  C.snapshot();
  const raw = String(e.target.value == null ? "" : e.target.value).trim();
  const arr = raw
    ? raw.split(/[,;\s]+/)
        .map(s => Number(s))
        .filter(v => isFinite(v) && v >= 0)
    : [];
  C.state.tickPrimary.customTicks = arr;
  refreshTreeView();
});
  bindPath("customTickColor", "customTickColor");
  bindPath("customTickBold", "customTickBold");

  bindPath("tickSecondaryInterval", "tickSecondary.interval", "num");
  bindPath("tickSecondaryShowLabels", "tickSecondary.showLabels", "bool");
  bindPath("tickSecondaryShowGrid", "tickSecondary.showGrid", "bool");
  bindPath("tickSecondaryGridDashed", "tickSecondary.gridDashed", "bool");
  bindPath("tickSecondaryGridWidth", "tickSecondary.gridWidth", "num");
  bindPath("tickSecondaryGridColor", "tickSecondary.gridColor");

  bindChk("showScaleBoxChk", "showScaleBox");
  bindInp("scaleBoxSizeInput", "scaleBoxSize", "num");
  bindInp("scaleBoxTitleInput", "scaleBoxTitle");

  bindInp("rootTickValueInput", "rootTickValue", "num");
  bindInp("timeScaleFactorInput", "timeScaleFactor", "num");

  bindSel("nodeIdsSelect", "nodeIds", "bool");
  bindSel("showLengthSelect", "showLength", "bool");
  bindSel("showBootstrapSelect", "showBootstrap", "bool");
  bindSel("bootstrapFormat", "bootstrapFormat");
  bindInp("scaleH", "scaleH", "num");
  bindInp("scaleV", "scaleV", "num");
  bindSel("leafSymbolsSelect", "leafSymbols", "bool");
  bindSel("leafSymShape", "leafSymShape");
  bindInp("leafSymSize", "leafSymSize", "num");
  bindInp("leafSymFill", "leafSymFill");
  bindInp("leafSymBC", "leafSymBC");
  bindInp("leafSymBW", "leafSymBW", "num");
  bindSel("internalSymbolsSelect", "internalSymbols", "bool");
  bindSel("intSymShape", "intSymShape");
  bindInp("intSymSize", "intSymSize", "num");
  bindInp("intSymFill", "intSymFill");
  bindInp("intSymBC", "intSymBC");
  bindInp("intSymBW", "intSymBW", "num");
  bindChk("showLegendChk", "showLegend");
  bindInp("legendTitle", "legendTitle");
  bindInp("legendColor", "legendColor");
  bindInp("ringWidth", "ringWidth", "num");
  bindInp("ringGap", "ringGap", "num");
  bindInp("ringStroke", "ringStroke");
  bindInp("ringStrokeWidth", "ringStrokeWidth", "num");

  on(document.getElementById("rpBorder"), "input", e => { global.TreeRanges.rangeBorder = Number(e.target.value) || 0; refreshTreeView(); });
  on(document.getElementById("rpBorderColor"), "input", e => { global.TreeRanges.rangeBorderColor = e.target.value; refreshTreeView(); });
  on(document.getElementById("rangeGradient"), "change", e => { C.snapshot(); C.state.rangeGradient = e.target.value === "true"; refreshTreeView(); });
  on(document.getElementById("rangeOpacity"), "input", e => {
    C.snapshot();
    const transparency = Math.max(0, Math.min(1, Number(e.target.value)));
    C.state.rangeOpacity = 1 - transparency;
    refreshTreeView();
  });
  on(document.getElementById("rangeCoverSelect"), "change", e => {
    C.snapshot();
    global.TreeRanges.rangeCover = e.target.value;
    refreshTreeView();
  });
  on(document.getElementById("rangeShowLabelsSelect"), "change", e => {
    C.snapshot();
    global.TreeRanges.rangeShowLabels = e.target.value === "true";
    refreshTreeView();
  });
  on(document.getElementById("rpLabelBoldChk"), "change", e => {
    C.snapshot();
    global.TreeRanges.rangeLabelBold = e.target.checked;
    refreshTreeView();
  });
  on(document.getElementById("rpLabelItalicChk"), "change", e => {
    C.snapshot();
    global.TreeRanges.rangeLabelItalic = e.target.checked;
    refreshTreeView();
  });
  on(document.getElementById("rpList"), "click", e => { const x = e.target.closest(".rp-x"); if (x) { C.snapshot(); global.TreeRanges.removeRange(Number(x.dataset.range)); refreshTreeView(); } });
on(document.getElementById("rpList"), "input", e => {
  const inp = e.target.closest(".rp-color-edit"); if (!inp) return;
  const range = global.TreeRanges.colorRanges.find(r => r.id === Number(inp.dataset.rangeColor)); if (!range) return;
  if (inp.dataset.editing !== "1") { C.snapshot(); inp.dataset.editing = "1"; }
  range.color = inp.value;
});
on(document.getElementById("rpList"), "change", e => {
  const lb = e.target.closest(".rp-lb-edit");
  if (lb) {
    const r = global.TreeRanges.colorRanges.find(x => x.id === Number(lb.dataset.range));
    if (r) { C.snapshot(); r.label = lb.value || ""; refreshTreeView(); }
  }
  const ce = e.target.closest(".rp-color-edit");
  if (ce) {
    const range = global.TreeRanges.colorRanges.find(r => r.id === Number(ce.dataset.rangeColor));
    if (range) {
      if (ce.dataset.editing !== "1") C.snapshot();
      range.color = ce.value;
      delete ce.dataset.editing;
      refreshTreeView();
    }
  }
});

  on(document.getElementById("rpLabelSize"), "input", e => { global.TreeRanges.rangeLabelSize = Number(e.target.value) || 13; refreshTreeView(); });
  on(document.getElementById("rpLabelOffset"), "input", e => { global.TreeRanges.rangeLabelOffset = Number(e.target.value) || 0; refreshTreeView(); });
  on(document.getElementById("rpLabelColor"), "input", e => { global.TreeRanges.rangeLabelColor = e.target.value; refreshTreeView(); });

  btn("autoCollapseBtn", () => {
    C.snapshot();
    const kind = document.getElementById("autoCollapse").value;
    const t = Math.max(1, Number(document.getElementById("collapseThreshold").value) || 3);
    let count = 0;
    if (kind === "short") T.allWalk(C.getRoot(), n => { if (!T.isLeaf(n) && n !== C.getRoot() && T.visibleLeaves(n).length <= t) { n.collapsed = true; count++; } });
    if (kind === "long") T.allWalk(C.getRoot(), n => { if (!T.isLeaf(n) && n !== C.getRoot() && T.visibleLeaves(n).length >= t) { n.collapsed = true; count++; } });
    const st = document.getElementById("status"); if (st) st.textContent = I.t('statusCollapsed', { n: count });
    refreshTreeView(); renderNodeTable();
  });
  btn("expandAllBtn", () => {
    C.snapshot(); let count = 0;
    T.allWalk(C.getRoot(), n => { if (n.collapsed) { n.collapsed = false; count++; } if (n.deleted) { n.deleted = false; count++; } });
    const st = document.getElementById("status"); if (st) st.textContent = I.t('statusExpanded', { n: count });
    refreshTreeView(); renderNodeTable();
  });
  btn("matchCollapseBtn", () => {
    C.snapshot();
    const q = document.getElementById("matchText").value.trim().toLowerCase(); if (!q) return;
    const scope = document.getElementById("matchScope").value || "leaf";
    let hideCount = 0, collapseCount = 0;
    T.allWalk(C.getRoot(), n => {
      if (n === C.getRoot()) return;
      const isL = T.isLeaf(n), lbl = T.labelOf(n).toLowerCase();
      if (!lbl.includes(q)) return;
      if (scope === "leaf" && isL) { n.deleted = true; hideCount++; }
      else if (scope === "internal" && !isL) { n.collapsed = true; collapseCount++; }
      else if (scope === "both") { if (isL) { n.deleted = true; hideCount++; } else { n.collapsed = true; collapseCount++; } }
    });
    const st = document.getElementById("status"); if (st) st.textContent = I.t('statusHidden', { h: hideCount, c: collapseCount });
    refreshTreeView(); renderNodeTable();
  });
  btn("bulkEditBtn", () => {
    const prefix = prompt(I.t('alertPrefixPrompt'), "");
    if (prefix !== null && prefix !== "") { C.snapshot(); T.visibleLeaves(C.getRoot()).forEach(n => { n.label = prefix + T.labelOf(n); }); refreshTreeView(); }
  });
}

function syncControls() {
  const st = C.state;
  const set = (id, val) => { const el = document.getElementById(id); if (!el) return; if (el.type === "checkbox") el.checked = !!val; else el.value = val; };

  set("fontFamily", st.fontFamily);
  set("ignoreLength", String(st.ignoreLength));
  set("branchLengthField", st.branchLengthField || "");
  set("bootstrapRangeSelect", st.bootstrapRange || "auto");
  set("forceMidpointRoot", st.forceMidpointRoot);
  set("sortModeSelect", st.sortMode);
  set("leafReverseSelect", String(st.leafReverse));
  set("labelsSelect", String(st.labels));
  set("labelPositionSelect", st.labelPosition);
  set("fontSize", st.fontSize);
  set("labelColor", st.labelColor);
  set("boldChk", st.bold);
  set("italicChk", st.italic);
  set("branchWidth", st.branchWidth);
  set("branchColor", st.branchColor);
  set("extendBranchesSelect", String(st.extendBranches));
  set("dashedSelect", String(st.dashed));
  set("dashSize", st.dashSize);

  set("axisShowSelect", String(st.axisShow));
  set("axisPosSelect", st.axisPos);
  set("axisRotationInput", st.axisRotation);
  set("axisReverseChk", st.axisReverse);
    set("axisExtendStartInput", st.axisExtendStart || 0);
    set("axisExtendEndInput", st.axisExtendEnd || 0);
  set("tickLabelFontSize", st.tickLabelFontSize);
  set("tickLabelBold", st.tickLabelBold);
  set("tickLabelItalic", st.tickLabelItalic);
  set("tickPrimaryInterval", st.tickPrimary.interval);
  set("tickPrimaryShowLabels", String(st.tickPrimary.showLabels));
  set("tickPrimaryShowGrid", String(st.tickPrimary.showGrid));
  set("tickPrimaryGridDashed", String(st.tickPrimary.gridDashed));
  set("tickPrimaryGridWidth", st.tickPrimary.gridWidth);
  set("tickPrimaryGridColor", st.tickPrimary.gridColor || "#dddddd");
  set("tickPrimaryCustom", (st.tickPrimary.customTicks || []).join(","));
  set("customTickColor", st.customTickColor || "#c0392b");
  set("customTickBold", st.customTickBold);
  set("tickSecondaryInterval", st.tickSecondary.interval);
  set("tickSecondaryShowLabels", String(st.tickSecondary.showLabels));
  set("tickSecondaryShowGrid", String(st.tickSecondary.showGrid));
  set("tickSecondaryGridDashed", String(st.tickSecondary.gridDashed));
  set("tickSecondaryGridWidth", st.tickSecondary.gridWidth);
  set("tickSecondaryGridColor", st.tickSecondary.gridColor || "#dddddd");

  set("showScaleBoxChk", st.showScaleBox !== false);
  set("scaleBoxSizeInput", st.scaleBoxSize || 0);
  set("scaleBoxTitleInput", st.scaleBoxTitle || "Scale");

  set("rootTickValueInput", st.rootTickValue != null ? st.rootTickValue : 0);
  set("timeScaleFactorInput", st.timeScaleFactor);

  set("nodeIdsSelect", String(st.nodeIds));
  set("showLengthSelect", String(st.showLength));
  set("showBootstrapSelect", String(st.showBootstrap));
  set("bootstrapFormat", st.bootstrapFormat);
  set("scaleH", st.scaleH);
  set("scaleV", st.scaleV);
  set("leafSymbolsSelect", String(st.leafSymbols));
  set("leafSymShape", st.leafSymShape);
  set("leafSymSize", st.leafSymSize);
  set("leafSymFill", st.leafSymFill);
  set("leafSymBC", st.leafSymBC);
  set("leafSymBW", st.leafSymBW);
  set("internalSymbolsSelect", String(st.internalSymbols));
  set("intSymShape", st.intSymShape);
  set("intSymSize", st.intSymSize);
  set("intSymFill", st.intSymFill);
  set("intSymBC", st.intSymBC);
  set("intSymBW", st.intSymBW);
  set("showLegendChk", st.showLegend);
  set("legendTitle", st.legendTitle);
  set("legendColor", st.legendColor);
  set("ringWidth", st.ringWidth);
  set("ringGap", st.ringGap);
  set("ringStroke", st.ringStroke);
  set("ringStrokeWidth", st.ringStrokeWidth);
}

function rebuildSidebarNav() {
  const sidebar = document.getElementById("treeSidebar");
  if (!sidebar) return;
  const nav = sidebar.querySelector(".tsb-nav");
  if (!nav) return;
  nav.innerHTML = "";
  const cards = document.querySelectorAll(".step-card");
  cards.forEach((card, ci) => {
    const titleEl = card.querySelector(".step-title");
    if (!titleEl) return;
    if (!card.id) card.id = "stepCard" + ci;
    const a = document.createElement("a");
    a.href = "#" + card.id;
    a.className = "tsb-card-link";
    a.textContent = titleEl.textContent.trim();
    
    a.addEventListener("click", (e) => {
      e.preventDefault();
      card.scrollIntoView({ behavior: "smooth", block: "start" });
      card.classList.add("flash-highlight");
      setTimeout(() => card.classList.remove("flash-highlight"), 1200);
    });
    nav.appendChild(a);
    
    const seen = new Set();
    card.querySelectorAll(".param-panel-title").forEach((mt, mi) => {
      const panel = mt.closest(".param-panel");
      if (!panel) return;
      const txt = mt.textContent.trim();
      if (!txt || seen.has(txt)) return;
      seen.add(txt);
      if (!panel.id) panel.id = card.id + "-mod" + mi;
      const ma = document.createElement("a");
      ma.href = "#" + panel.id;
      ma.className = "tsb-mod-link";
      ma.textContent = txt;
      
      ma.addEventListener("click", (e) => {
        e.preventDefault();
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
        panel.classList.add("flash-highlight");
        setTimeout(() => panel.classList.remove("flash-highlight"), 1200);
      });
      nav.appendChild(ma);
    });
  });
}

function initSidebar() {
  const sidebar = document.getElementById("treeSidebar");
  const toggle = document.getElementById("tsbToggle");
  if (!sidebar || !toggle) return;
  const KEY = "tree_sidebar_collapsed";
  if (localStorage.getItem(KEY) === "1") sidebar.classList.add("collapsed");
  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    localStorage.setItem(KEY, sidebar.classList.contains("collapsed") ? "1" : "0");
  });
  function updatePos() {
    const header = document.getElementById("common-header");
    let top = 130;
    if (header) {
      const cs = getComputedStyle(header);
      const rect = header.getBoundingClientRect();
      if (cs.position === "fixed" || cs.position === "sticky") {
        top = Math.max(0, rect.bottom) + 48;
      } else {
        top = Math.max(8, rect.bottom + 32);
      }
    }
    if (window.innerWidth <= 900) return;
    sidebar.style.top = top + "px";
    sidebar.style.maxHeight = `calc(100vh - ${top + 16}px)`;
  }
  updatePos();
  setTimeout(updatePos, 200);
  setTimeout(updatePos, 800);
  window.addEventListener("resize", updatePos);
  window.addEventListener("scroll", updatePos, { passive: true });
  const header = document.getElementById("common-header");
  if (header && window.ResizeObserver) {
    const ro = new ResizeObserver(() => updatePos());
    ro.observe(header);
  }
  if (header && window.MutationObserver) {
    const mo = new MutationObserver(() => updatePos());
    mo.observe(header, { childList: true, subtree: true, attributes: true });
  }
  const nav = sidebar.querySelector(".tsb-nav");
  if (nav) {
    nav.addEventListener("click", e => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      e.preventDefault();
      const id = a.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.classList.add("flash-highlight");
        setTimeout(() => target.classList.remove("flash-highlight"), 1200);
      }
    });
  }
  rebuildSidebarNav();
}

function init() {
  if (window.__treeAppInited) return;
  window.__treeAppInited = true;

  renderTreeImportPanel();
  renderDataPanel();
  initSidebar();

  if (global.TreeUI) {
    if (global.TreeUI.renderBasicPanel) global.TreeUI.renderBasicPanel(document.getElementById("basicStylePanel"));
    if (global.TreeUI.renderAdvancedPanel) global.TreeUI.renderAdvancedPanel(document.getElementById("advancedStylePanel"));
    if (global.TreeUI.renderDatasetsPanel) global.TreeUI.renderDatasetsPanel(document.getElementById("datasetsPanel"));
  }

  syncControls();
  bindAllControls();
  if (global.TreeMenu) global.TreeMenu.bindMenuEvents();
  rebuildSidebarNav();

  ["showLeafNodes","showInternalNodes","showOnlyWithSupport"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", renderNodeTable);
  });
  document.getElementById("nodeTableSearch")?.addEventListener("input", renderNodeTable);
  document.getElementById("exportNodeTableBtn")?.addEventListener("click", exportNodeTableCsv);
  document.getElementById("addMetaColumnBtn")?.addEventListener("click", addMetaColumn);
  document.getElementById("nodeTableBox")?.addEventListener("toggle", e => { if (e.target.open) renderNodeTable(); });

  document.addEventListener("click", (e) => {
    const panel = document.getElementById("nodeActionPanel");
    if (panel && !panel.contains(e.target)) panel.style.display = "none";
    const bpanel = document.getElementById("branchActionPanel");
    if (bpanel && !bpanel.contains(e.target)) bpanel.style.display = "none";
  });
  window.addEventListener("resize", () => {
    const p = document.getElementById("nodeActionPanel");
    if (p && p.style.display === "block") {
      const w = p.offsetWidth, h = p.offsetHeight;
      const l = Math.min(parseFloat(p.style.left) || 0, window.innerWidth - w - 8);
      const t = Math.min(parseFloat(p.style.top) || 0, window.innerHeight - h - 8);
      p.style.left = Math.max(8, l) + "px";
      p.style.top = Math.max(8, t) + "px";
    }
    const bp = document.getElementById("branchActionPanel");
    if (bp && bp.style.display === "block") {
      const w = bp.offsetWidth, h = bp.offsetHeight;
      const l = Math.min(parseFloat(bp.style.left) || 0, window.innerWidth - w - 8);
      const t = Math.min(parseFloat(bp.style.top) || 0, window.innerHeight - h - 8);
      bp.style.left = Math.max(8, l) + "px";
      bp.style.top = Math.max(8, t) + "px";
    }
  });

  document.getElementById("drawBtn")?.addEventListener("click", drawTree);
  document.getElementById("exportSvgBtn")?.addEventListener("click", () => {
    if (!C.getSvg()) return;
    global.TreeExport.download("phylogenetic_tree.svg", global.TreeExport.exportSvgString(), "image/svg+xml;charset=utf-8");
    showToolbar(I.t('treeMsgExportSvg'));
  });
  document.getElementById("exportPngBtn")?.addEventListener("click", async () => {
    if (!C.getSvg()) return;
    try { await global.TreeExport.downloadPng(2, "phylogenetic_tree.png"); showToolbar(I.t('treeMsgExportPng')); }
    catch(_) { showToolbar(I.t('treeMsgExportPngErr')); }
  });
  document.getElementById("saveExportStateBtn")?.addEventListener("click", () => {
    if (!C.getRoot()) return;
    const raw = C.captureSnapshot();
    global.TreeExport.download("tree-export-state.json", raw, "application/json");
  });

  refreshDataSummary();
  renderLeafDataPreview();

  if (global.PlotBootstrap && PlotBootstrap.ensureD3) PlotBootstrap.ensureD3().catch(() => {});

  setTimeout(() => {
    ['donateModal','donatePopup','donateBox'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.zIndex = '20000';
        if (getComputedStyle(el).position === 'absolute') el.style.position = 'fixed';
      }
    });
  }, 300);
}

global.TreeApp = {
  init, drawTree, loadTree,
  exportLeafTemplate, copyTableToClipboard, resetTableToLeaves,
  autoFillLeavesInExternal, generateRandomColumns,
  applyPrefixColumn, applyCustomPrefixColumn, applyCladeColumn, applyClusterColumn,
  renderNodeTable, exportNodeTableCsv, formatMetaValue,
  enableWheelZoom, refreshTreeView, showNodeActionPanel, showBranchActionPanel,
  rebuildSidebarNav,
  get leafData() { return leafData; }
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

})(window);
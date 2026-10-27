(function (global) {
'use strict';
const I = global.TreeI18N;

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function escA(s) { return esc(s); }
function label(key) { return I.t(key); }

function box(titleKey, inner) {
  return `<div class="style-box"><div class="style-box-title">${esc(label(titleKey))}</div><div class="style-box-body">${inner}</div></div>`;
}

function colorOpacity(host, opts) {
  opts = opts || {};
  const colorKey = opts.colorPath || 'color';
  const opKey = opts.opacityPath || 'opacity';
  const style = opts.style || {};
  host.innerHTML = `
    <div class="param-item"><label>${esc(label('styleColor'))}</label>
      <input type="color" data-cw-color value="${escA(style[colorKey] || '#000000')}"></div>
    <div class="param-item"><label>${esc(label('styleOpacity'))}</label>
      <input type="number" data-cw-opacity value="${(style[opKey] != null ? style[opKey] : 1)}" min="0" max="1" step="0.05"></div>
  `;
  host.querySelector('[data-cw-color]').addEventListener('input', e => {
    style[colorKey] = e.target.value;
    opts.onChange && opts.onChange(style);
  });
  host.querySelector('[data-cw-opacity]').addEventListener('input', e => {
    style[opKey] = Math.max(0, Math.min(1, Number(e.target.value) || 0));
    opts.onChange && opts.onChange(style);
  });
}

function textStylePanel(host, style, opts) {
  opts = opts || {};
  const s = global.TreeStyle.textStyle(style || {});
  host.innerHTML = `
    <div class="param-grid cols-4">
      <div class="param-item"><label>${esc(label('styleFontSize'))}</label>
        <input type="number" data-tw-fs value="${s.fontSize}" min="6" max="120"></div>
      <div class="param-item"><label class="mini-check"><input type="checkbox" data-tw-bold ${s.bold ? 'checked' : ''}> ${esc(label('styleBold'))}</label></div>
      <div class="param-item"><label class="mini-check"><input type="checkbox" data-tw-italic ${s.italic ? 'checked' : ''}> ${esc(label('styleItalic'))}</label></div>
      <div class="param-item"><label>${esc(label('styleTextColor'))}</label>
        <input type="color" data-tw-color value="${escA(s.color)}"></div>
      <div class="param-item"><label>${esc(label('styleOpacity'))}</label>
        <input type="number" data-tw-opacity value="${s.opacity}" min="0" max="1" step="0.05"></div>
      <div class="param-item"><label class="mini-check"><input type="checkbox" data-tw-bgshow ${s.bgShow ? 'checked' : ''}> ${esc(label('styleBgShow'))}</label></div>
      <div class="param-item"><label>${esc(label('styleBgColor'))}</label>
        <input type="color" data-tw-bgcolor value="${escA(s.bgColor)}"></div>
      <div class="param-item"><label>${esc(label('styleBgOpacity'))}</label>
        <input type="number" data-tw-bgopacity value="${s.bgOpacity}" min="0" max="1" step="0.05"></div>
      <div class="param-item"><label>${esc(label('styleBgBorderColor'))}</label>
        <input type="color" data-tw-bgbcolor value="${escA(s.bgBorderColor)}"></div>
      <div class="param-item"><label>${esc(label('styleBgBorderWidth'))}</label>
        <input type="number" data-tw-bgbw value="${s.bgBorderWidth}" min="0" max="6" step="0.5"></div>
    </div>
  `;
  const read = () => {
    s.fontSize = Number(host.querySelector('[data-tw-fs]').value) || s.fontSize;
    s.bold = host.querySelector('[data-tw-bold]').checked;
    s.italic = host.querySelector('[data-tw-italic]').checked;
    s.color = host.querySelector('[data-tw-color]').value;
    s.opacity = Math.max(0, Math.min(1, Number(host.querySelector('[data-tw-opacity]').value) || 0));
    s.bgShow = host.querySelector('[data-tw-bgshow]').checked;
    s.bgColor = host.querySelector('[data-tw-bgcolor]').value;
    s.bgOpacity = Math.max(0, Math.min(1, Number(host.querySelector('[data-tw-bgopacity]').value) || 0));
    s.bgBorderColor = host.querySelector('[data-tw-bgbcolor]').value;
    s.bgBorderWidth = Number(host.querySelector('[data-tw-bgbw]').value) || 0;
    if (opts.onChange) opts.onChange(s);
  };
  host.querySelectorAll('input,select').forEach(el => el.addEventListener('input', read));
  host.querySelectorAll('select').forEach(el => el.addEventListener('change', read));
  return s;
}

function lineStylePanel(host, style, opts) {
  opts = opts || {};
  const l = global.TreeStyle.lineStyle(style || {});
  host.innerHTML = `
    <div class="param-grid cols-4">
      <div class="param-item"><label>${esc(label('styleStrokeColor'))}</label>
        <input type="color" data-lw-stroke value="${escA(l.stroke)}"></div>
      <div class="param-item"><label>${esc(label('styleStrokeWidth'))}</label>
        <input type="number" data-lw-sw value="${l.strokeWidth}" min="0.1" max="20" step="0.1"></div>
      <div class="param-item"><label>${esc(label('styleOpacity'))}</label>
        <input type="number" data-lw-opacity value="${l.opacity}" min="0" max="1" step="0.05"></div>
      <div class="param-item"><label>${esc(label('styleLineStyle'))}</label>
        <select data-lw-style>
          <option value="solid" ${l.lineStyle === 'solid' ? 'selected' : ''}>${esc(label('styleLineSolid'))}</option>
          <option value="dashed" ${l.lineStyle === 'dashed' ? 'selected' : ''}>${esc(label('styleLineDashed'))}</option>
        </select></div>
      <div class="param-item"><label>${esc(label('styleDashSize'))}</label>
        <input type="number" data-lw-dash value="${l.dashSize}" min="1" max="40" step="1"></div>
      <div class="param-item"><label>${esc(label('styleGapSize'))}</label>
        <input type="number" data-lw-gap value="${l.gapSize}" min="1" max="40" step="1"></div>
    </div>
  `;
  const read = () => {
    l.stroke = host.querySelector('[data-lw-stroke]').value;
    l.strokeWidth = Number(host.querySelector('[data-lw-sw]').value) || l.strokeWidth;
    l.opacity = Math.max(0, Math.min(1, Number(host.querySelector('[data-lw-opacity]').value) || 0));
    l.lineStyle = host.querySelector('[data-lw-style]').value;
    l.dashSize = Number(host.querySelector('[data-lw-dash]').value) || 2;
    l.gapSize = Number(host.querySelector('[data-lw-gap]').value) || 3;
    if (opts.onChange) opts.onChange(l);
  };
  host.querySelectorAll('input,select').forEach(el => el.addEventListener('input', read));
  host.querySelectorAll('select').forEach(el => el.addEventListener('change', read));
  return l;
}

function shapeStylePanel(host, style, opts) {
  opts = opts || {};
  const s = global.TreeStyle.shapeStyle(style || {});
  host.innerHTML = `
    <div class="param-grid cols-4">
      <div class="param-item"><label>${esc(label('styleShape'))}</label>
        <select data-sw-shape>
          <option value="square" ${s.shape === 'square' ? 'selected' : ''}>${esc(label('optShapeSquare'))}</option>
          <option value="circle" ${s.shape === 'circle' ? 'selected' : ''}>${esc(label('optShapeCircle'))}</option>
          <option value="triangle" ${s.shape === 'triangle' ? 'selected' : ''}>${esc(label('optShapeTriangle'))}</option>
          <option value="star" ${s.shape === 'star' ? 'selected' : ''}>${esc(label('optShapeStar'))}</option>
          <option value="diamond2" ${s.shape === 'diamond2' ? 'selected' : ''}>${esc(label('optShapeDiamond'))}</option>
        </select></div>
      <div class="param-item"><label>${esc(label('styleShapeSize'))}</label>
        <input type="number" data-sw-size value="${s.size}" min="1" max="60" step="0.5"></div>
      <div class="param-item"><label>${esc(label('styleFillColor'))}</label>
        <input type="color" data-sw-fill value="${escA(s.fillColor)}"></div>
      <div class="param-item"><label>${esc(label('styleFillOpacity'))}</label>
        <input type="number" data-sw-fillop value="${s.fillOpacity}" min="0" max="1" step="0.05"></div>
      <div class="param-item"><label>${esc(label('styleShapeStrokeColor'))}</label>
        <input type="color" data-sw-stroke value="${escA(s.strokeColor)}"></div>
      <div class="param-item"><label>${esc(label('styleShapeStrokeWidth'))}</label>
        <input type="number" data-sw-sw value="${s.strokeWidth}" min="0" max="6" step="0.5"></div>
    </div>
  `;
  const read = () => {
    s.shape = host.querySelector('[data-sw-shape]').value;
    s.size = Number(host.querySelector('[data-sw-size]').value) || s.size;
    s.fillColor = host.querySelector('[data-sw-fill]').value;
    s.fillOpacity = Math.max(0, Math.min(1, Number(host.querySelector('[data-sw-fillop]').value) || 0));
    s.strokeColor = host.querySelector('[data-sw-stroke]').value;
    s.strokeWidth = Number(host.querySelector('[data-sw-sw]').value) || 0;
    if (opts.onChange) opts.onChange(s);
  };
  host.querySelectorAll('input,select').forEach(el => el.addEventListener('input', read));
  host.querySelectorAll('select').forEach(el => el.addEventListener('change', read));
  return s;
}

function palettePanel(host, opts) {
  opts = opts || {};
  const values = opts.values || [];
  const palette = opts.palette || 'tableau10';
  const colors = opts.colors || {};
  let html = `<div class="param-item" style="grid-column: span 2;"><label>${esc(label('groupPaletteLabel'))}</label>
    <div class="palette-slot" data-cw-palette></div></div>`;
  if (values.length && !opts.noColorList) {
    html += `<div class="param-item" style="grid-column: 1/-1;"><label>${esc(label('trackCustomColors'))}</label>
      <div class="custom-color-list" style="display:flex;flex-wrap:wrap;gap:8px;">
        ${values.map(v => `
          <label style="display:flex;align-items:center;gap:4px;font-size:12px;">
            <input type="color" data-cw-cval="${escA(v)}" value="${escA(colors[v] || '#cccccc')}"
              style="width:30px;height:22px;padding:0;border:1px solid #ccc;border-radius:3px;cursor:pointer;">
            <span>${esc(v)}</span>
            <button class="btn-del-color" data-cw-delcolor="${escA(v)}" type="button" title="${esc(label('btnDeleteTitle'))}">×</button>
          </label>`).join('')}
      </div></div>`;
  }
  host.innerHTML = html;
  const slot = host.querySelector('[data-cw-palette]');
  if (slot && global.TreeUI) {
    global.TreeUI.renderGroupPaletteDropdown(slot, {
      selected: palette,
      onSelect: name => { opts.onPalette && opts.onPalette(name); }
    });
  }
  host.querySelectorAll('[data-cw-cval]').forEach(el => {
    el.addEventListener('input', e => {
      opts.onColor && opts.onColor(el.dataset.cwCval, e.target.value);
    });
  });
  host.querySelectorAll('[data-cw-delcolor]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      opts.onDeleteColor && opts.onDeleteColor(el.dataset.cwDelcolor);
    });
  });
}
function drawTextWithBg(TT, parent, x, y, text, style, ts, extraAttrs) {
  const mergedExtra = Object.assign({}, extraAttrs || {});
  if (ts && ts.opacity != null && mergedExtra.opacity === undefined) {
    mergedExtra.opacity = ts.opacity;
  }
  const textEl = TT.draw(parent, x, y, text, style, mergedExtra);
  if (!textEl) return textEl;
  if (!ts || !ts.bgShow) return textEl;
  const targetParent = parent || textEl.parentNode;
  if (!targetParent) return textEl;
  try {
    const bb = textEl.getBBox();
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", bb.x - 3);
    rect.setAttribute("y", bb.y - 2);
    rect.setAttribute("width", bb.width + 6);
    rect.setAttribute("height", bb.height + 4);
    rect.setAttribute("fill", ts.bgColor || "#ffffff");
    rect.setAttribute("fill-opacity", ts.bgOpacity != null ? ts.bgOpacity : 1);
    if (ts.bgBorderWidth > 0) {
      rect.setAttribute("stroke", ts.bgBorderColor || "#999999");
      rect.setAttribute("stroke-width", ts.bgBorderWidth);
    }
    rect.setAttribute("pointer-events", "none");
    targetParent.insertBefore(rect, textEl);
  } catch (_) {}
  return textEl;
}
global.TreeCommonWidgets = {
  panelBox: box,
  colorOpacity, textStylePanel, lineStylePanel, shapeStylePanel, palettePanel,
  drawTextWithBg,
  esc, escA, label
};
})(window);
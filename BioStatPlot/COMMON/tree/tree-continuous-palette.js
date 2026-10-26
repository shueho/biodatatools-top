(function (global) {
'use strict';
function tr(key) {
  const I = global.TreeI18N;
  return (I && typeof I.t === 'function') ? I.t(key) : key;
}
function getInterpFn(name) {
  if (!global.d3) return function () { return '#cccccc'; };
  const key = 'interpolate' + name.charAt(0).toUpperCase() + name.slice(1);
  const f = global.d3[key];
  return typeof f === 'function' ? f : function () { return '#cccccc'; };
}
const GROUPS = [
  {
    key: 'div', titleKey: 'paletteGroupDivergent', color: '#7c3aed',
    items: [
      { id: 'RdBu', descKey: 'contPal_RdBu' },
      { id: 'PiYG', descKey: 'contPal_PiYG' },
      { id: 'PRGn', descKey: 'contPal_PRGn' },
      { id: 'PuOr', descKey: 'contPal_PuOr' },
      { id: 'RdYlBu', descKey: 'contPal_RdYlBu' },
      { id: 'RdYlGn', descKey: 'contPal_RdYlGn' },
      { id: 'BrBG', descKey: 'contPal_BrBG' },
      { id: 'Spectral', descKey: 'contPal_Spectral' }
    ]
  },
  {
    key: 'seq', titleKey: 'paletteGroupSequential', color: '#b45309',
    items: [
      { id: 'Viridis', descKey: 'contPal_Viridis' },
      { id: 'Magma', descKey: 'contPal_Magma' },
      { id: 'Inferno', descKey: 'contPal_Inferno' },
      { id: 'Plasma', descKey: 'contPal_Plasma' },
      { id: 'Cividis', descKey: 'contPal_Cividis' },
      { id: 'Turbo', descKey: 'contPal_Turbo' },
      { id: 'YlOrRd', descKey: 'contPal_YlOrRd' },
      { id: 'YlGnBu', descKey: 'contPal_YlGnBu' },
      { id: 'YlGn', descKey: 'contPal_YlGn' },
      { id: 'OrRd', descKey: 'contPal_OrRd' },
      { id: 'BuGn', descKey: 'contPal_BuGn' },
      { id: 'PuBu', descKey: 'contPal_PuBu' },
      { id: 'BuPu', descKey: 'contPal_BuPu' },
      { id: 'GnBu', descKey: 'contPal_GnBu' },
      { id: 'Oranges', descKey: 'contPal_Oranges' },
      { id: 'Blues', descKey: 'contPal_Blues' },
      { id: 'Greens', descKey: 'contPal_Greens' },
      { id: 'Greys', descKey: 'contPal_Greys' },
      { id: 'Purples', descKey: 'contPal_Purples' },
      { id: 'Reds', descKey: 'contPal_Reds' },
      { id: 'Warm', descKey: 'contPal_Warm' },
      { id: 'Cool', descKey: 'contPal_Cool' }
    ]
  }
];
function listNames() {
  const out = [];
  GROUPS.forEach(g => { g.items.forEach(it => out.push(it.id)); });
  return out;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function buildGradientCss(id) {
  const interp = getInterpFn(id);
  const stops = [];
  for (let i = 0; i <= 9; i++) stops.push(interp(i / 9));
  return 'linear-gradient(to right, ' + stops.join(',') + ')';
}
let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const s = document.createElement('style');
  s.id = 'continuous-palette-style';
  s.textContent = [
    '.ctp-wrap{position:relative;width:100%;max-width:none;}',
    '.ctp-trigger{display:flex;align-items:center;gap:10px;padding:7px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;transition:border-color .2s,box-shadow .2s;user-select:none;box-sizing:border-box;}',
    '.ctp-trigger:hover{border-color:#1f4068;}',
    '.ctp-wrap.open .ctp-trigger{border-color:#1f4068;box-shadow:0 0 0 3px rgba(31,64,104,.12);}',
    '.ctp-preview{width:80px;min-width:60px;height:18px;border-radius:3px;flex-shrink:0;border:1px solid rgba(0,0,0,.06);}',
    '.ctp-name{flex:1;text-align:left;font-family:Consolas,Monaco,monospace;font-size:13px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.ctp-caret{color:#666;font-size:10px;transition:transform .2s;flex-shrink:0;}',
    '.ctp-wrap.open .ctp-caret{transform:rotate(180deg);}',
    '.ctp-dropdown{position:absolute;top:calc(100% + 4px);left:0;min-width:340px;max-width:calc(100vw - 40px);background:#fff;border:1px solid #ccc;border-radius:6px;box-shadow:0 8px 20px rgba(31,64,104,.15);max-height:420px;overflow-y:auto;z-index:9500;display:none;}',
    '.ctp-wrap.open .ctp-dropdown{display:block;}',
    '.ctp-group{padding:8px 12px 6px;font-size:11px;font-weight:700;letter-spacing:.04em;background:#f4f6fb;border-top:1px solid #e6eaf2;position:sticky;top:0;z-index:1;user-select:none;pointer-events:none;}',
    '.ctp-group:first-child{border-top:none;}',
    '.ctp-option{display:flex;align-items:center;gap:10px;padding:6px 12px 6px 14px;cursor:pointer;border-bottom:1px solid #f0f4f8;transition:background .15s;}',
    '.ctp-option:hover{background:#eef2f7;}',
    '.ctp-option.active{background:#e3ecf7;}',
    '.ctp-option .ctp-name{font-size:12px;flex-shrink:0;min-width:70px;}',
    '.ctp-option .ctp-desc{color:#999;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.ctp-check{margin-left:auto;color:#1f4068;font-weight:700;font-size:12px;visibility:hidden;flex-shrink:0;}',
    '.ctp-option.active .ctp-check{visibility:visible;}'
  ].join('');
  document.head.appendChild(s);
}
function render(container, opts) {
  opts = opts || {};
  if (!container) return;
  injectStyle();
  const allNames = listNames();
  const cur = (opts.selected && allNames.indexOf(opts.selected) !== -1) ? opts.selected : allNames[0];
  container.innerHTML = '';
  container.className = 'ctp-wrap';
  const trigger = document.createElement('div');
  trigger.className = 'ctp-trigger';
  trigger.innerHTML =
    '<div class="ctp-preview" style="background:' + buildGradientCss(cur) + '"></div>' +
    '<span class="ctp-name">' + escapeHtml(cur) + '</span>' +
    '<span class="ctp-caret">▼</span>';
  const dropdown = document.createElement('div');
  dropdown.className = 'ctp-dropdown';
  GROUPS.forEach(function (group) {
    const gl = document.createElement('div');
    gl.className = 'ctp-group';
    gl.style.color = group.color;
    gl.textContent = tr(group.titleKey);
    dropdown.appendChild(gl);
    group.items.forEach(function (item) {
      const opt = document.createElement('div');
      opt.className = 'ctp-option' + (cur === item.id ? ' active' : '');
      opt.dataset.value = item.id;
      const grad = buildGradientCss(item.id);
      opt.innerHTML =
        '<div class="ctp-preview" style="background:' + grad + '"></div>' +
        '<span class="ctp-name" style="color:' + group.color + ';">' + escapeHtml(item.id) + '</span>' +
        '<span class="ctp-desc">' + escapeHtml(tr(item.descKey)) + '</span>' +
        '<span class="ctp-check">✓</span>';
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.querySelectorAll('.ctp-option').forEach(function (el) { el.classList.remove('active'); });
        opt.classList.add('active');
        trigger.querySelector('.ctp-name').textContent = item.id;
        trigger.querySelector('.ctp-preview').style.background = grad;
        container.classList.remove('open');
        if (opts.onSelect) opts.onSelect(item.id, { group: group.key });
      });
      dropdown.appendChild(opt);
    });
  });
  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    document.querySelectorAll('.ctp-wrap.open').forEach(function (el) {
      if (el !== container) el.classList.remove('open');
    });
    container.classList.toggle('open');
  });
  container.appendChild(trigger);
  container.appendChild(dropdown);
}
document.addEventListener('click', function () {
  document.querySelectorAll('.ctp-wrap.open').forEach(function (el) {
    el.classList.remove('open');
  });
});
function getStops(name, n, reverse) {
  n = Math.max(2, n || 11);
  const base = getInterpFn(name || 'Viridis');
  const interp = reverse ? function (t) { return base(1 - t); } : base;
  const out = [];
  for (let i = 0; i < n; i++) out.push(interp(i / (n - 1)));
  return out;
}
global.ContinuousPalette = {
  render, getStops, listNames,
  getGroups: function () { return GROUPS; }
};
global.ContPalette = global.ContinuousPalette;
if (global.PlotCommon && typeof global.PlotCommon.renderPaletteDropdown === 'function') {
  const _orig = global.PlotCommon.renderPaletteDropdown;
  global.PlotCommon.renderPaletteDropdown = function (container, opts) {
    opts = opts || {};
    if (opts.type === 'continuous') return render(container, opts);
    return _orig.apply(this, arguments);
  };
}
})(window);
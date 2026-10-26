(function (global) {
'use strict';
const D3_FALLBACKS = {
  tableau10: ["#4e79a7","#f28e2c","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab"],
  category10: ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],
  set1: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"],
  set2: ["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f","#e5c494","#b3b3b3"],
  set3: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"],
  paired: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"],
  dark2: ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"],
  accent: ["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f","#bf5b17","#666666"],
  pastel1: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec"],
  pastel2: ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9","#fff2ae","#f1e2cc","#cccccc"]
};
const GGSCI_SCHEMES = {
  npg:          ['#E64B35', '#4DBBD5', '#00A087', '#3C5488', '#F39B7F', '#8491B4', '#91D1C2', '#DC0000', '#7E6148', '#B09C85'],
  aaas:         ['#3B4992', '#EE0000', '#008B45', '#631879', '#008280', '#BB0021', '#5F559B', '#A20056', '#808180', '#1B1919'],
  nejm:         ['#BC3C29', '#0072B5', '#E18727', '#20854E', '#7876B1', '#6F99AD', '#FFDC91', '#EE4C97'],
  lancet:       ['#00468B', '#ED0000', '#42B540', '#0099B4', '#925E9F', '#FDAF91', '#AD002A', '#ADB6B6', '#1B1919'],
  jama:         ['#374E55', '#DF8F44', '#00A1D5', '#B24745', '#79AF97', '#6A6599', '#80796B'],
  bmj:          ['#2A6EBB', '#E18727', '#3DB7E4', '#7E2F8E', '#4DAF4A', '#FF7F00', '#984EA3', '#A65628', '#F781BF', '#999999'],
  jco:          ['#0073C2', '#EFC000', '#868686', '#CD534C', '#7AA6DC', '#003C67', '#8F7700', '#3B3B3B', '#A73030', '#4A6990'],
  locuszoom:    ['#D43F3A', '#EEA236', '#5CB85C', '#46B8DA', '#357EBD', '#9632B8', '#B8B8B8', '#EEEEEE'],
  uchicago:     ['#800000', '#767676', '#FFA319', '#8A9045', '#155F83', '#C16622', '#8F3931', '#58593F', '#350E20'],
  startrek:     ['#E4EAEE', '#CCD6DD', '#AAB8C2', '#939393', '#788B95', '#65737E', '#555D66', '#40474D', '#343A3F', '#1C1C1C'],
  tron:         ['#FF410D', '#6EE2FF', '#F7C530', '#95CC5E', '#D0DFE6', '#F79D1E', '#748AA6'],
  futurama:     ['#FF6F00', '#FF8E00', '#FFC000', '#FFE100', '#FFFF00', '#B0FF00', '#00FF00', '#00FFB0', '#00FFFF', '#00B0FF', '#008EFF', '#006FFF'],
  rickandmorty: ['#FAFD7C', '#82491E', '#24325F', '#B7E4F9', '#FB6467', '#526E2D', '#E89242', '#EEDD62', '#FAE7B5', '#DC5945', '#5244A0', '#D64D8C'],
  simpsons:     ['#FED439', '#709AE1', '#8A9197', '#D2AF81', '#FD7446', '#D5E4A2', '#197EC0', '#F05C3B', '#46732E', '#71D0F5', '#370335', '#075149', '#C80813', '#91331F', '#1A9993', '#FD8CC1']
};
const OTHER_SCHEMES = {
  okabeito:  ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#000000'],
  ibm:       ['#648FFF', '#785EF0', '#DC267F', '#FE6100', '#FFB000'],
  tolBright:         ['#4477AA', '#EE6677', '#228833', '#CCBB44', '#66CCEE', '#AA3377', '#BBBBBB'],
  tolVibrant:        ['#EE7733', '#009988', '#33BBEE', '#EE3377', '#CC3311', '#000000'],
  tolMuted:          ['#CC6677', '#332288', '#DDCC77', '#117733', '#88CCEE', '#882255', '#DDDDDD'],
  tolLight:          ['#77AADD', '#EE8866', '#EEDD88', '#FFAABB', '#99DDCC'],
  tolHighContrast:   ['#004488', '#DDAA33', '#BB5566'],
  tolMediumContrast: ['#6699CC', '#004488', '#EECC66', '#994455', '#997700', '#EE99AA'],
  kelly:      ['#F2F3F4', '#222222', '#F3C300', '#875692', '#F38400', '#A1CAF1', '#BE0032',
               '#C2B280', '#848482', '#008856', '#E68FAC', '#0067A5', '#F99379', '#604E97',
               '#F6A600', '#B3446C', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26'],
  ggplotHue:  ['#F8766E', '#01BEC4', '#7CAE00', '#C77CFF', '#00BA38', '#619CFF']
};
const FALLBACK_CATEGORICAL = D3_FALLBACKS.tableau10;

function hexToRgb(hex) {
  let h = String(hex == null ? '' : hex).trim();
  if (h.startsWith('rgb')) {
    const m = h.match(/(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
    return { r: 0, g: 0, b: 0 };
  }
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  if (isNaN(n) || h.length !== 6) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex(r, g, b) {
  const to2 = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + to2(r) + to2(g) + to2(b);
}
function mixColor(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}
function sampleStops(stops, t) {
  t = Math.max(0, Math.min(1, t));
  const n = stops.length - 1;
  if (n < 1) return stops[0] || '#cccccc';
  const pos = t * n;
  const i = Math.min(n - 1, Math.floor(pos));
  return mixColor(stops[i], stops[i + 1], pos - i);
}
function getContinuousInterpolator(name, reverse) {
  const key = 'interpolate' + String(name).charAt(0).toUpperCase() + String(name).slice(1);
  const f = (global.d3 && typeof global.d3[key] === 'function') ? global.d3[key] : (() => '#cccccc');
  return reverse ? (t => f(1 - t)) : f;
}
function getContinuousColors(name, n, reverse) {
  const interp = getContinuousInterpolator(name, reverse);
  const out = [];
  if (n <= 1) return [interp(0.5)];
  for (let i = 0; i < n; i++) out.push(interp(i / (n - 1)));
  return out;
}
function getCategoricalScheme(name) {
  const o = OTHER_SCHEMES[name];
  if (o && o.length) return o.slice();
  const g = GGSCI_SCHEMES[String(name || '').toLowerCase()];
  if (g && g.length) return g.slice();
  const key = 'scheme' + String(name || '').charAt(0).toUpperCase() + String(name || '').slice(1);
  const arr = global.d3 && global.d3[key];
  if (Array.isArray(arr) && arr.length) return arr.slice();
  if (D3_FALLBACKS[name]) return D3_FALLBACKS[name].slice();
  return FALLBACK_CATEGORICAL.slice();
}
function getCategoricalColors(name, n, opts) {
  opts = opts || {};
  let reverse = false, cycle = false;
  if (typeof opts === 'boolean') reverse = opts;
  else { reverse = !!opts.reverse; cycle = !!opts.cycle; }
  const base = getCategoricalScheme(name);
  let result;
  if (!n || n <= 0) result = base.slice();
  else if (n <= base.length) result = base.slice(0, n);
  else if (cycle) {
    result = [];
    for (let i = 0; i < n; i++) result.push(base[i % base.length]);
  } else {
    result = base.slice();
    while (result.length < n) result.push('#cccccc');
  }
  if (reverse) result = result.slice().reverse();
  return result;
}

const api = {
  GGSCI_SCHEMES, OTHER_SCHEMES, D3_FALLBACKS,
  hexToRgb, rgbToHex, mixColor, sampleStops,
  getCategoricalScheme, getCategoricalColors,
  getContinuousInterpolator, getContinuousColors
};
global.PlotCommon = global.PlotCommon || {};
Object.assign(global.PlotCommon, api);
global.TreePalette = api;
})(window);
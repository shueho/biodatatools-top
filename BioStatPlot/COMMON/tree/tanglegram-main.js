(function (global) {
'use strict';
const P = global.TreeParser;
const PAL = global.TreePalette;
const W = global.TreeCommonWidgets;

const LANG = (document.documentElement.lang || 'zh-CN').toLowerCase().startsWith('en') ? 'en' : 'zh';
const I18N = {
  zh: {
    readFileFailed: '读取文件失败',
    allMirrorsFailed: '所有镜像都失败',
    emptyContent: '内容为空',
    unsupportedXML: '不支持的XML',
    parseFailed: '解析失败',
    emptyTable: '表格为空',
    groupExampleNoTree: '# 请先导入左树或右树，再点击"加载示例"',
    groupExampleNoBranch: '# 当前树无法生成聚类分组',
    groupExampleNoLeaf: '# 当前树没有叶标签',
    selectFileFirst: '请先选择文件',
    pasteTextFirst: '请先粘贴文本',
    exampleLoadFailed: '示例加载失败',
    loading: '加载中...',
    leftLoaded: '左树已加载',
    rightLoaded: '右树已加载',
    groupsLoaded: '分组已加载',
    needLeftTree: '请先加载左树',
    needRightTree: '请先加载右树',
    needTrees: '请先加载树',
    leftExported: '已导出左树',
    rightExported: '已导出右树',
    svgExported: '已导出SVG',
    pngExported: '已导出PNG',
    withMeta: '（含元数据）',
    depthMismatch: '深度不一致',
    unmatched: '未匹配',
    groupStyleTitle: '配色设置',
    groupStyleHint: '此处对所有分组上色；即使暂无分组，也可先设置色板、未匹配色与深度不一致色，加载分组后立即生效。',
    unmatchedColorLabel: '未匹配叶连线颜色',
    mismatchColorLabel: '深度不一致颜色',
    fileMode: '上传文件',
    textMode: '粘贴文本',
    loadBtn: '导入数据',
    exampleBtn: '加载示例'
  },
  en: {
    readFileFailed: 'Failed to read file',
    allMirrorsFailed: 'All mirrors failed',
    emptyContent: 'Empty content',
    unsupportedXML: 'Unsupported XML',
    parseFailed: 'Parse failed',
    emptyTable: 'Empty table',
    groupExampleNoTree: '# Please import left or right tree first, then click "Load example"',
    groupExampleNoBranch: '# Cannot generate cluster groups from current tree',
    groupExampleNoLeaf: '# Current tree has no leaf labels',
    selectFileFirst: 'Please select a file first',
    pasteTextFirst: 'Please paste text first',
    exampleLoadFailed: 'Failed to load example',
    loading: 'Loading...',
    leftLoaded: 'Left tree loaded',
    rightLoaded: 'Right tree loaded',
    groupsLoaded: 'Groups loaded',
    needLeftTree: 'Please load left tree first',
    needRightTree: 'Please load right tree first',
    needTrees: 'Please load trees first',
    leftExported: 'Left tree exported',
    rightExported: 'Right tree exported',
    svgExported: 'SVG exported',
    pngExported: 'PNG exported',
    withMeta: ' (with metadata)',
    depthMismatch: 'Depth mismatch',
    unmatched: 'Unmatched',
    groupStyleTitle: 'Color settings',
    groupStyleHint: 'Set colors for each group here. Even without groups, you can preset the palette, unmatched color and mismatch color; changes take effect once groups are loaded.',
    unmatchedColorLabel: 'Unmatched link color',
    mismatchColorLabel: 'Mismatch link color',
    fileMode: 'Upload file',
    textMode: 'Paste text',
    loadBtn: 'Load data',
    exampleBtn: 'Load example'
  }
};
function T(key) { return (I18N[LANG] && I18N[LANG][key]) || I18N.zh[key] || key; }

const BRANCH_WIDTH = 1.2;

const EXAMPLE_DIR = 'shueho/biodatatools-top@main/BioStatPlot/COMMON/tree';
const EXAMPLE_DIR_RAW = 'https://raw.githubusercontent.com/shueho/biodatatools-top/main/BioStatPlot/COMMON/tree';
function exampleCandidates(filename) {
  const p = EXAMPLE_DIR + '/' + filename;
  return [
    `https://jsd.onmicrosoft.cn/gh/${p}`,
    `https://fastly.jsdelivr.net/gh/${p}`,
    `https://gcore.jsdelivr.net/gh/${p}`,
    `https://cdn.jsdelivr.net/gh/${p}`,
    `${EXAMPLE_DIR_RAW}/${filename}`
  ];
}
async function fetchRemoteExample(filename) {
  let lastErr = null;
  for (const url of exampleCandidates(filename)) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      if (text && text.trim()) return text;
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(lastErr ? lastErr.message : T('allMirrorsFailed'));
}

const state = {
  leftRoot: null,
  rightRoot: null,
  groups: new Map(),
  groupColors: {},
  groupColorOverride: {},
  groupPalette: 'tableau10',
  ignoreLength: true,
  hideLabels: false,
  highlightMismatch: true,
  depthTolerance: null,

  leafRowH: 22,
  treeWidth: 280,
  gapWidth: 460,
  marginX: 40,
  marginY: 50,
  labelFontSize: 13,
  linkOpacity: 0.65,
  linkWidth: 1.5,
  linkCurve: 0.5,
  linkMatchBranch: false,
  linkDashed: false,
  labelOffset: 0,
  history: [],

  topoHighlight: true,
  topoPalette: ['#dc3545', '#1f6feb', '#f59e0b', '#12b886', '#7048e8', '#e8590c', '#0b7285', '#c2255c'],

  gapPadding: 160,
  gapAuto: true,

  labelAlignMode: 'none',
  linkAlignMode: 'label',
  linkPadding: 8,

  unmatchedColor: '#999999',
  mismatchColor: '#dc3545',
  includeMeta: true,
  svg: null,
  selectedNode: null,
  leftDepths: new Map(),
  rightDepths: new Map()
};

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => resolve(ev.target.result || '');
    reader.onerror = () => reject(new Error(T('readFileFailed')));
    reader.readAsText(file);
  });
}
function branchLen(n) {
  if (state.ignoreLength) return 1;
  const v = Number(n.length);
  return Number.isFinite(v) && v > 0 ? v : 0.1;
}
function maxDepth(n, d) {
  d = d || 0;
  const kids = (n.children || []).filter(c => !c._deleted);
  if (!kids.length) return d;
  return Math.max(...kids.map(c => maxDepth(c, d + branchLen(c))));
}
function assignIds(root) {
  let i = 0;
  (function rec(n) {
    n.id = 'tg' + (++i);
    (n.children || []).forEach(rec);
  })(root);
}
function findNode(root, id) {
  let found = null;
  (function rec(n) {
    if (found) return;
    if (n.id === id) { found = n; return; }
    (n.children || []).forEach(rec);
  })(root);
  return found;
}
function leafMap(root) {
  const map = new Map();
  (function rec(n) {
    const kids = (n.children || []).filter(c => !c._deleted);
    if (!kids.length) {
      const key = String(n.name || '').trim();
      if (key && !map.has(key)) map.set(key, n);
    } else kids.forEach(rec);
  })(root);
  return map;
}
function computeDepths(root) {
  const map = new Map();
  if (!root) return map;
  const raw = new Map();
  let maxD = 0;
  (function rec(n, d) {
    const kids = (n.children || []).filter(c => !c._deleted);
    if (!kids.length) {
      const key = String(n.name || '').trim();
      if (key && !raw.has(key)) {
        raw.set(key, d);
        if (d > maxD) maxD = d;
      }
    } else kids.forEach(c => rec(c, d + branchLen(c)));
  })(root, 0);
  const denom = maxD > 0 ? maxD : 1;
  raw.forEach((d, k) => map.set(k, d / denom));
  return map;
}
function rawLabelWidth(s) {
  const t = String(s || '');
  let w = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    w += (c >= 0x4e00 && c <= 0x9fff) ? state.labelFontSize : state.labelFontSize * 0.55;
  }
  return w;
}
function labelWidth(s) {
  if (state.hideLabels) return 0;
  return rawLabelWidth(s);
}

function parseTreeText(text) {
  const fmt = (P.detectTreeFormat && P.detectTreeFormat(text)) || 'newick';
  if (fmt === 'empty') throw new Error(T('emptyContent'));
  if (fmt === 'xml') throw new Error(T('unsupportedXML'));
  const tree = (P.parseTree && P.parseTree(text)) || P.parseNewick(text);
  if (!tree) throw new Error(T('parseFailed'));
  P.assign(tree, null);
  assignIds(tree);
  return tree;
}
function parseGroupsText(text) {
  const parsed = global.PlotCommon.parseTable(text);
  if (!parsed.headers.length) throw new Error(T('emptyTable'));
  const leafCol = parsed.headers[0];
  const groupCol = parsed.headers[1] || parsed.headers[0];
  const colorCol = parsed.headers[2] || null;
  const map = new Map();
  const colorOverride = {};
  parsed.data.forEach(r => {
    const lf = String(r[leafCol] || '').trim();
    if (!lf) return;
    const gp = String(r[groupCol] || '').trim() || 'NA';
    map.set(lf, gp);
    if (colorCol) {
      const cc = String(r[colorCol] || '').trim();
      if (/^#[0-9a-fA-F]{3,8}$/.test(cc)) colorOverride[gp] = cc;
    }
  });
  return { map, colorOverride };
}

function generateGroupExample() {
  const root = state.leftRoot || state.rightRoot;
  if (!root) return T('groupExampleNoTree');
  function countLeaves(n) {
    let c = 0;
    (function rec(m) {
      const kids = (m.children || []).filter(x => !x._deleted);
      if (!kids.length) { c++; return; }
      kids.forEach(rec);
    })(n);
    return c;
  }
  const TARGET = 5;
  let groups = [root];
  while (groups.length < TARGET) {
    let maxIdx = -1, maxCount = -1;
    groups.forEach((g, i) => {
      const c = countLeaves(g);
      if (c > maxCount) { maxCount = c; maxIdx = i; }
    });
    const g = groups[maxIdx];
    const kids = (g.children || []).filter(c => !c._deleted);
    if (kids.length >= 2) {
      groups.splice(maxIdx, 1, ...kids);
    } else {
      let found = false;
      for (let i = 0; i < groups.length; i++) {
        const kk = (groups[i].children || []).filter(c => !c._deleted);
        if (kk.length >= 2) {
          groups.splice(i, 1, ...kk);
          found = true;
          break;
        }
      }
      if (!found) break;
    }
  }
  const lines = ['Leaf\tGroup'];
  const seen = new Set();
  groups.forEach((g, i) => {
    const groupName = 'Cluster' + (i + 1);
    (function walk(n) {
      const kids = (n.children || []).filter(c => !c._deleted);
      if (!kids.length) {
        const name = String(n.name || '').trim();
        if (name && !seen.has(name)) {
          seen.add(name);
          lines.push(name + '\t' + groupName);
        }
        return;
      }
      kids.forEach(walk);
    })(g);
  });
  return lines.length > 1 ? lines.join('\n') : T('groupExampleNoLeaf');
}

function recolorGroups() {
  const groups = [...new Set(state.groups.values())];
  const colors = PAL.getCategoricalScheme(state.groupPalette);
  const out = {};
  groups.forEach((g, i) => { out[g] = colors[i % colors.length]; });
  Object.assign(out, state.groupColorOverride || {});
  state.groupColors = out;
}

function renderGroupStyle() {
  const host = document.getElementById('groupStyleHost');
  if (!host) return;
  const groups = [...new Set(state.groups.values())];
  host.innerHTML = `
    <div class="param-panel">
      <div class="param-panel-title">${T('groupStyleTitle')}</div>
      <div class="info-box" style="margin:0 0 10px;font-size:12.5px;line-height:1.65;">${T('groupStyleHint')}</div>
      <div id="tgGroupPaletteHost"></div>
      <div class="param-grid cols-4" style="margin-top:10px;">
        <div class="param-item"><label>${T('unmatchedColorLabel')}</label>
          <input type="color" id="tgUnmatchedColor" value="${state.unmatchedColor}"></div>
        <div class="param-item"><label>${T('mismatchColorLabel')}</label>
          <input type="color" id="tgMismatchColor" value="${state.mismatchColor}"></div>
      </div>
    </div>`;
  const palHost = host.querySelector('#tgGroupPaletteHost');
  if (palHost && W && W.palettePanel) {
    W.palettePanel(palHost, {
      palette: state.groupPalette,
      values: groups,
      colors: state.groupColors,
      onPalette: name => {
        state.groupPalette = name;
        state.groupColorOverride = {};
        recolorGroups();
        renderGroupStyle();
        renderLegend();
        drawAll();
      },
      onColor: (v, c) => {
        state.groupColorOverride[v] = c;
        state.groupColors[v] = c;
        renderLegend();
        drawAll();
      },
      onDeleteColor: v => {
        delete state.groupColorOverride[v];
        recolorGroups();
        renderGroupStyle();
        renderLegend();
        drawAll();
      }
    });
  }
  const unmatched = host.querySelector('#tgUnmatchedColor');
  if (unmatched) unmatched.addEventListener('input', e => {
    state.unmatchedColor = e.target.value;
    renderLegend();
    drawAll();
  });
  const mismatch = host.querySelector('#tgMismatchColor');
  if (mismatch) mismatch.addEventListener('input', e => {
    state.mismatchColor = e.target.value;
    renderLegend();
    drawAll();
  });
}

function getLabelPlacement(n, name, dir) {
  const w = rawLabelWidth(name);
  const mode = state.labelAlignMode || 'none';
  const offset = Number(state.labelOffset) || 0;
  let labelX, anchor;

  if (mode === 'outer') {
    if (dir > 0) {
      labelX = (state._alignLX != null ? state._alignLX : n._x + 4) + offset;
      anchor = 'start';
    } else {
      labelX = (state._alignRX != null ? state._alignRX : n._x - 4) - offset;
      anchor = 'end';
    }
  } else if (mode === 'center') {
    if (dir > 0) {
      labelX = (state._alignLX != null ? state._alignLX : n._x + 4) + offset;
      anchor = 'middle';
    } else {
      labelX = (state._alignRX != null ? state._alignRX : n._x - 4) - offset;
      anchor = 'middle';
    }
  } else if (mode === 'inner') {
    if (dir > 0) {
      labelX = (state._alignLX != null ? state._alignLX : n._x + 4) + offset;
      anchor = 'end';
    } else {
      labelX = (state._alignRX != null ? state._alignRX : n._x - 4) - offset;
      anchor = 'start';
    }
  } else {
    if (dir > 0) { labelX = n._x + 4 + offset; anchor = 'start'; }
    else { labelX = n._x - 4 - offset; anchor = 'end'; }
  }

  let leftEdge, rightEdge;
  if (anchor === 'start') { leftEdge = labelX; rightEdge = labelX + w; }
  else if (anchor === 'end') { leftEdge = labelX - w; rightEdge = labelX; }
  else { leftEdge = labelX - w / 2; rightEdge = labelX + w / 2; }

  const gapEdge = dir > 0 ? rightEdge : leftEdge;
  const nodeEdge = dir > 0 ? leftEdge : rightEdge;
  return { labelX, anchor, width: w, leftEdge, rightEdge, gapEdge, nodeEdge };
}

function computeLabelLayout() {
  state._alignLX = null;
  state._alignRX = null;
  state._linkStartX = null;
  state._linkEndX = null;

  if (!state.leftRoot && !state.rightRoot) return;

  const lm = state.leftRoot ? leafMap(state.leftRoot) : new Map();
  const rm = state.rightRoot ? leafMap(state.rightRoot) : new Map();

  let maxLeftX = -Infinity, minRightX = Infinity;
  let maxLW = 0, maxRW = 0;
  lm.forEach((ln, name) => {
    if (ln._x > maxLeftX) maxLeftX = ln._x;
    const w = rawLabelWidth(name);
    if (w > maxLW) maxLW = w;
  });
  rm.forEach((rn, name) => {
    if (rn._x < minRightX) minRightX = rn._x;
    const w = rawLabelWidth(name);
    if (w > maxRW) maxRW = w;
  });
  if (!isFinite(maxLeftX)) maxLeftX = state.marginX + state.treeWidth;
  if (!isFinite(minRightX)) minRightX = (state._canvasW || 1000) - state.marginX - state.treeWidth;

  const labelMode = state.labelAlignMode || 'none';
  const linkMode = state.linkAlignMode || 'label';
  const padding = Number(state.linkPadding) || 0;

  if (labelMode === 'outer') {
    state._alignLX = maxLeftX + 4;
    state._alignRX = minRightX - 4;
  } else if (labelMode === 'center') {
    state._alignLX = maxLeftX + 4 + maxLW / 2;
    state._alignRX = minRightX - 4 - maxRW / 2;
  } else if (labelMode === 'inner') {
    state._alignLX = maxLeftX + 4 + maxLW;
    state._alignRX = minRightX - 4 - maxRW;
  }

  if (linkMode === 'alignStart') {
    let maxGapL = -Infinity, minGapR = Infinity;
    lm.forEach((ln, name) => {
      const info = getLabelPlacement(ln, name, +1);
      if (info.gapEdge > maxGapL) maxGapL = info.gapEdge;
    });
    rm.forEach((rn, name) => {
      const info = getLabelPlacement(rn, name, -1);
      if (info.gapEdge < minGapR) minGapR = info.gapEdge;
    });
    state._linkStartX = maxGapL + padding;
    state._linkEndX = minGapR - padding;
  }
}

function autoGapWidth() {
  let maxL = 0, maxR = 0;
  if (state.leftRoot && !state.hideLabels) {
    leafMap(state.leftRoot).forEach((_, name) => {
      const w = rawLabelWidth(name);
      if (w > maxL) maxL = w;
    });
  }
  if (state.rightRoot && !state.hideLabels) {
    leafMap(state.rightRoot).forEach((_, name) => {
      const w = rawLabelWidth(name);
      if (w > maxR) maxR = w;
    });
  }
  const pad = Number(state.gapPadding) || 160;
  return Math.max(160, Math.ceil(maxL + maxR + pad));
}

function layoutOne(root, dir, xRoot, y0) {
  const totalD = Math.max(maxDepth(root, 0), 1e-9);
  const scale = state.treeWidth / totalD;
  let yCursor = y0;
  (function assignY(n) {
    const kids = (n.children || []).filter(c => !c._deleted);
    if (!kids.length) { n._y = yCursor; yCursor += state.leafRowH; return; }
    kids.forEach(assignY);
    n._y = (kids[0]._y + kids[kids.length - 1]._y) / 2;
  })(root);
  (function assignX(n, cum) {
    n._x = xRoot + dir * cum * scale;
    (n.children || []).filter(c => !c._deleted).forEach(c => assignX(c, cum + branchLen(c)));
  })(root, 0);
  return yCursor - y0;
}

function el(tag, attrs, parent) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs || {}).forEach(([k, v]) => { if (v != null) node.setAttribute(k, v); });
  (parent || state.svg).appendChild(node);
  return node;
}

function computeLeafKey(n) {
  const leaves = [];
  (function rec(x) {
    const kids = (x.children || []).filter(c => !c._deleted);
    if (!kids.length) {
      const name = String(x.name || '').trim();
      if (name) leaves.push(name);
      return;
    }
    kids.forEach(rec);
  })(n);
  if (leaves.length < 2) return null;
  leaves.sort();
  return leaves.join('\u0001');
}

function leafSetOf(n) {
  const s = new Set();
  (function rec(x) {
    const kids = (x.children || []).filter(c => !c._deleted);
    if (!kids.length) {
      const name = String(x.name || '').trim();
      if (name) s.add(name);
      return;
    }
    kids.forEach(rec);
  })(n);
  return s;
}

function jaccard(a, b) {
  if (!a || !b || !a.size || !b.size) return 0;
  let inter = 0;
  a.forEach(v => { if (b.has(v)) inter++; });
  const uni = a.size + b.size - inter;
  return uni > 0 ? inter / uni : 0;
}

function computeTopologyMismatch() {
  const L = state.leftRoot, R = state.rightRoot;
  const leftColor = new Map(), rightColor = new Map();
  state._leftTopoMismatch = leftColor;
  state._rightTopoMismatch = rightColor;
  if (!state.topoHighlight) return;
  if (!L || !R) return;

  function prepare(root) {
    (function rec(n) {
      const kids = (n.children || []).filter(c => !c._deleted);
      if (!kids.length) { n._setKey = null; return; }
      kids.forEach(rec);
      const arr = [...leafSetOf(n)].sort();
      n._setKey = arr.length ? arr.join('\u0001') : null;
    })(root);
  }
  prepare(L);
  prepare(R);

  const leftKeyMap = new Map(), rightKeyMap = new Map();
  (function rec(n) {
    const kids = (n.children || []).filter(c => !c._deleted);
    if (!kids.length) return;
    kids.forEach(rec);
    if (n._setKey && !leftKeyMap.has(n._setKey)) leftKeyMap.set(n._setKey, n);
  })(L);
  (function rec(n) {
    const kids = (n.children || []).filter(c => !c._deleted);
    if (!kids.length) return;
    kids.forEach(rec);
    if (n._setKey && !rightKeyMap.has(n._setKey)) rightKeyMap.set(n._setKey, n);
  })(R);

  const leftMismatch = [];
  (function rec(n) {
    const kids = (n.children || []).filter(c => !c._deleted);
    if (!kids.length) return;
    kids.forEach(rec);
    if (!n.parent || !n._setKey) return;
    if (rightKeyMap.has(n._setKey)) return;
    leftMismatch.push({ node: n, set: leafSetOf(n) });
  })(L);

  const rightMismatch = [];
  (function rec(n) {
    const kids = (n.children || []).filter(c => !c._deleted);
    if (!kids.length) return;
    kids.forEach(rec);
    if (!n.parent || !n._setKey) return;
    if (leftKeyMap.has(n._setKey)) return;
    rightMismatch.push({ node: n, set: leafSetOf(n) });
  })(R);

  function addColor(map, id, color) {
    if (!map.has(id)) map.set(id, []);
    const arr = map.get(id);
    if (!arr.includes(color)) arr.push(color);
  }

  const palette = state.topoPalette;
  let colorIdx = 0;
  const fanColorMap = new Map();

  function colorForSet(key) {
    if (!key) return palette[0];
    if (!fanColorMap.has(key)) fanColorMap.set(key, palette[colorIdx++ % palette.length]);
    return fanColorMap.get(key);
  }

  function paint(node, map) {
    const parent = node.parent;
    const color = colorForSet(parent ? parent._setKey : node._setKey);
    addColor(map, node.id, color);
    if (parent) {
      (parent.children || []).forEach(sib => {
        if (sib === node || sib._deleted) return;
        addColor(map, sib.id, color);
      });
    }
  }

  leftMismatch.forEach(lm => paint(lm.node, leftColor));
  rightMismatch.forEach(rm => paint(rm.node, rightColor));
}

function drawAll() {
  const svg = state.svg;
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  if (!state.leftRoot && !state.rightRoot) return;

  state.leftDepths = computeDepths(state.leftRoot);
  state.rightDepths = computeDepths(state.rightRoot);
  computeTopologyMismatch();

  const marginX = state.marginX, marginY = state.marginY;
  state.gapWidth = state.gapAuto
    ? autoGapWidth()
    : Math.max(20, Number(state.gapWidth) || 200);
  const gapInput = document.getElementById('tgGapWidth');
  if (gapInput && state.gapAuto) gapInput.value = state.gapWidth;
  const canvasW = marginX * 2 + state.treeWidth * 2 + state.gapWidth;

  let leftH = 0, rightH = 0;
  if (state.leftRoot) leftH = layoutOne(state.leftRoot, +1, marginX, marginY);
  if (state.rightRoot) rightH = layoutOne(state.rightRoot, -1, canvasW - marginX, marginY);

  const canvasH = Math.max(120, marginY * 2 + Math.max(leftH, rightH, state.leafRowH));
  svg.setAttribute('viewBox', `0 0 ${canvasW} ${canvasH}`);

  state._canvasW = canvasW;
  computeLabelLayout();

  const linkLayer = el('g', { class: 'tg-link-layer' });
  const branchLayer = el('g', { class: 'tg-branch-layer' });
  const nodeLayer = el('g', { class: 'tg-node-layer' });
  const labelLayer = el('g', { class: 'tg-label-layer' });

  if (state.leftRoot) drawTree(state.leftRoot, +1, 'left', branchLayer, nodeLayer, labelLayer);
  if (state.rightRoot) drawTree(state.rightRoot, -1, 'right', branchLayer, nodeLayer, labelLayer);
  drawLinks(linkLayer);
}

function drawTree(root, dir, side, branchLayer, nodeLayer, labelLayer) {
  const stemLen = 8;
  if (root && root._x != null && root._y != null) {
    el('line', {
      x1: root._x - dir * stemLen, y1: root._y,
      x2: root._x, y2: root._y,
      stroke: '#333', 'stroke-width': BRANCH_WIDTH, 'pointer-events': 'none'
    }, branchLayer);
  }
  (function rec(n) {
    const kids = (n.children || []).filter(c => !c._deleted);
    if (kids.length) {
      const colorMap = (side === 'left')
        ? (state._leftTopoMismatch || new Map())
        : (state._rightTopoMismatch || new Map());
      kids.forEach(c => {
        const arr = state.topoHighlight ? (colorMap.get(c.id) || []) : [];
        const vd = `M ${n._x} ${n._y} L ${n._x} ${c._y}`;
        const hd = `M ${n._x} ${c._y} L ${c._x} ${c._y}`;
        if (!arr.length) {
          el('path', {
            d: `M ${n._x} ${n._y} L ${n._x} ${c._y} L ${c._x} ${c._y}`,
            fill: 'none', stroke: '#333', 'stroke-width': BRANCH_WIDTH,
            'pointer-events': 'none'
          }, branchLayer);
        } else if (arr.length === 1) {
          el('path', {
            d: `M ${n._x} ${n._y} L ${n._x} ${c._y} L ${c._x} ${c._y}`,
            fill: 'none', stroke: arr[0], 'stroke-width': BRANCH_WIDTH + 1,
            'pointer-events': 'none'
          }, branchLayer);
        } else {
          const seg = 8;
          const period = seg * arr.length;
          const multiW = BRANCH_WIDTH + 2;
          [vd, hd].forEach(pd => {
            arr.forEach((col, i) => {
              el('path', {
                d: pd, fill: 'none', stroke: col, 'stroke-width': multiW,
                'stroke-dasharray': `${seg} ${period - seg}`,
                'stroke-dashoffset': String(-i * seg),
                'pointer-events': 'none'
              }, branchLayer);
            });
          });
        }
        rec(c);
      });
      const isSel = state.selectedNode && state.selectedNode.id === n.id && state.selectedNode.side === side;
      const g = el('g', { 'data-node-id': n.id, 'data-side': side, style: 'cursor:pointer' }, nodeLayer);
      if (isSel) {
        el('circle', { cx: n._x, cy: n._y, r: 13, fill: 'rgba(255,75,75,0.18)', stroke: '#ff4b4b', 'stroke-width': 2.5, 'pointer-events': 'none' }, g);
      } else {
        el('circle', { cx: n._x, cy: n._y, r: 3, fill: '#1f4068', opacity: 0.35, 'pointer-events': 'none' }, g);
      }
      el('circle', { cx: n._x, cy: n._y, r: 10, fill: 'transparent', stroke: 'transparent', 'pointer-events': 'all' }, g);
    } else if (!state.hideLabels) {
      const lbl = n.name || '';
      const groupName = state.groups.get(lbl);
      const col = state.groupColors[groupName] || '#222';
      const info = getLabelPlacement(n, lbl, dir);
      if (Math.abs(info.nodeEdge - n._x) > 6) {
        el('line', {
          x1: n._x, y1: n._y, x2: info.nodeEdge, y2: n._y,
          stroke: '#bbb', 'stroke-width': 0.8, 'stroke-dasharray': '3 2',
          'pointer-events': 'none'
        }, branchLayer);
      }
      el('text', {
        x: info.labelX, y: n._y + state.labelFontSize * 0.35,
        'font-size': state.labelFontSize,
        'font-family': 'Times New Roman',
        'font-weight': 400,
        'text-anchor': info.anchor, fill: col, 'pointer-events': 'none'
      }, labelLayer).textContent = lbl;
    }
  })(root);
}

function isDepthMismatch(name) {
  if (!state.highlightMismatch) return false;
  if (!state.leftDepths.has(name) || !state.rightDepths.has(name)) return false;
  const diff = Math.abs(state.leftDepths.get(name) - state.rightDepths.get(name));
  let tol = state.depthTolerance;
  if (tol == null || !isFinite(tol) || tol < 0) tol = 0.1;
  return diff > tol;
}

function drawLinks(parent) {
  if (!state.leftRoot || !state.rightRoot) return;
  const lm = leafMap(state.leftRoot);
  const rm = leafMap(state.rightRoot);
  const linkW = state.linkMatchBranch
    ? Math.max(1, state.leafRowH - state.labelFontSize)
    : state.linkWidth;
  lm.forEach((ln, name) => {
    const rn = rm.get(name);
    if (!rn) return;
    let lx, rx;
    const linkMode = state.linkAlignMode || 'label';
    const padding = Number(state.linkPadding) || 0;
    if (linkMode === 'node') {
      lx = ln._x;
      rx = rn._x;
    } else if (linkMode === 'alignStart') {
      lx = state._linkStartX != null ? state._linkStartX : (ln._x + labelWidth(name) + padding);
      rx = state._linkEndX != null ? state._linkEndX : (rn._x - labelWidth(name) - padding);
    } else {
      if (state.hideLabels) {
        lx = ln._x + padding;
        rx = rn._x - padding;
      } else {
        const lInfo = getLabelPlacement(ln, name, +1);
        const rInfo = getLabelPlacement(rn, name, -1);
        lx = lInfo.gapEdge + padding;
        rx = rInfo.gapEdge - padding;
      }
    }
    if (rx <= lx) return;
    const ly = ln._y, ry = rn._y;
    const cx1 = lx + (rx - lx) * state.linkCurve;
    const cx2 = rx - (rx - lx) * state.linkCurve;
    const d = `M ${lx} ${ly} C ${cx1} ${ly}, ${cx2} ${ry}, ${rx} ${ry}`;
    const mismatch = isDepthMismatch(name);
    const groupName = state.groups.get(name);
    const baseColor = groupName ? (state.groupColors[groupName] || state.unmatchedColor) : state.unmatchedColor;
    const color = mismatch ? state.mismatchColor : baseColor;
    const width = mismatch ? linkW + 0.6 : linkW;
    el('path', {
      d, fill: 'none', stroke: color,
      'stroke-width': width,
      opacity: mismatch ? Math.min(1, state.linkOpacity + 0.15) : state.linkOpacity,
      'stroke-dasharray': state.linkDashed ? '6 4' : null,
      'pointer-events': 'none'
    }, parent);
  });
}

function renderLegend() {
  const box = document.getElementById('tgLegend');
  if (!box) return;
  const items = [];
  items.push(`<label class="mini-check" style="cursor:default;"><span class="tg-swatch" style="background:${state.mismatchColor};"></span>${T('depthMismatch')}</label>`);
  items.push(`<label class="mini-check" style="cursor:default;"><span class="tg-swatch" style="background:${state.unmatchedColor};"></span>${T('unmatched')}</label>`);
  const groups = [...new Set(state.groups.values())];
  groups.forEach(g => {
    const c = state.groupColors[g] || state.unmatchedColor;
    items.push(`<label class="mini-check" style="cursor:default;"><span class="tg-swatch" style="background:${c};"></span>${g}</label>`);
  });
  box.innerHTML = items.join('');
}

function bindClick(svg) {
  if (svg.dataset.tgClickBound === '1') return;
  svg.dataset.tgClickBound = '1';
  svg.addEventListener('click', e => {
    const target = e.target.closest && e.target.closest('[data-node-id]');
    if (!target) return;
    const side = target.getAttribute('data-side');
    const id = target.getAttribute('data-node-id');
    const root = side === 'left' ? state.leftRoot : state.rightRoot;
    if (!root) return;
    const node = findNode(root, id);
    if (!node) return;
    const kids = (node.children || []).filter(c => !c._deleted);
    if (kids.length < 2) return;
    state.selectedNode = { id, side, node };
    drawAll();
    showActionPanel(e.clientX, e.clientY);
  });
  if (!document.__tgDocClickBound) {
    document.__tgDocClickBound = true;
    document.addEventListener('click', e => {
      if (e.target.closest('#tgActionPanel')) return;
      if (e.target.closest('[data-node-id]')) return;
      if (!state.selectedNode) return;
      state.selectedNode = null;
      hideActionPanel();
      drawAll();
    });
  }
}
function showActionPanel(x, y) {
  const panel = document.getElementById('tgActionPanel');
  if (!panel) return;
  const undoBtn = panel.querySelector('[data-tgact="undo"]');
  if (undoBtn) undoBtn.disabled = !state.history.length;
  panel.style.display = 'block';
  const w = panel.offsetWidth || 240;
  const h = panel.offsetHeight || 90;
  panel.style.left = Math.min(x + 10, window.innerWidth - w - 8) + 'px';
  panel.style.top = Math.min(y + 10, window.innerHeight - h - 8) + 'px';
}
function hideActionPanel() {
  const panel = document.getElementById('tgActionPanel');
  if (panel) panel.style.display = 'none';
}
function snapshotTrees() {
  function cloneTree(n) {
    const o = {
      name: n.name, length: n.length, support: n.support, label: n.label,
      meta: JSON.parse(JSON.stringify(n.meta || [])),
      children: []
    };
    (n.children || []).forEach(c => o.children.push(cloneTree(c)));
    return o;
  }
  return {
    left: state.leftRoot ? cloneTree(state.leftRoot) : null,
    right: state.rightRoot ? cloneTree(state.rightRoot) : null
  };
}
function restoreSnapshot(snap) {
  if (!snap) return;
  state.leftRoot = snap.left ? snap.left : null;
  if (state.leftRoot) {
    P.assign(state.leftRoot, null);
    assignIds(state.leftRoot);
  }
  state.rightRoot = snap.right ? snap.right : null;
  if (state.rightRoot) {
    P.assign(state.rightRoot, null);
    assignIds(state.rightRoot);
  }
}
function bindActionPanel() {
  const panel = document.getElementById('tgActionPanel');
  if (!panel || panel.dataset.bound === '1') return;
  panel.dataset.bound = '1';
  panel.addEventListener('click', e => {
    const btn = e.target.closest('[data-tgact]');
    if (!btn) return;
    const act = btn.dataset.tgact;
    if (act === 'confirm') {
      if (!state.selectedNode) return;
      state.history.push(snapshotTrees());
      if (state.history.length > 50) state.history.shift();
      const { node } = state.selectedNode;
      const kids = (node.children || []).filter(c => !c._deleted);
      if (kids.length > 1) node.children.reverse();
      state.selectedNode = null;
      hideActionPanel();
      drawAll();
    } else if (act === 'undo') {
      if (!state.history.length) return;
      const snap = state.history.pop();
      restoreSnapshot(snap);
      state.selectedNode = null;
      hideActionPanel();
      drawAll();
    } else if (act === 'cancel') {
      state.selectedNode = null;
      hideActionPanel();
      drawAll();
    }
  });
}

function newickName(s) {
  const raw = String(s || '');
  if (!raw) return '';
  return /[\s(),:;\[\]']/.test(raw) ? "'" + raw.replace(/'/g, "''") + "'" : raw;
}
function nhxEscape(v) {
  const s = String(v == null ? '' : v);
  if (/[;:,\[\]()"\s]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function exportNewick(root, includeMeta) {
  function r(n) {
    const kids = (n.children || []).filter(c => !c._deleted);
    const name = newickName(n.name);
    const support = (n.support != null && String(n.support).trim() !== '')
      ? String(n.support).trim() : '';
    let metaStr = '';
    if (includeMeta && Array.isArray(n.meta) && n.meta.length) {
      const parts = [];
      n.meta.forEach(m => {
        if (!m || m.field == null) return;
        let v = m.value;
        if (v == null || v === '') return;
        if (Array.isArray(v)) v = '{' + v.map(x => String(x)).join(',') + '}';
        parts.push(m.field + '=' + nhxEscape(v));
      });
      if (parts.length) metaStr = '[&&NHX:' + parts.join(':') + ']';
    }
    const len = (n.length != null && n.parent) ? ':' + Number(n.length) : '';
    if (kids.length) {
      let label;
      if (name && support) {
        label = name + '[&&NHX:support=' + nhxEscape(support) + ']';
      } else if (support) {
        label = support;
      } else {
        label = name;
      }
      return '(' + kids.map(r).join(',') + ')' + label + metaStr + len;
    }
    return name + metaStr + len;
  }
  return r(root) + ';';
}
function download(filename, content, type) {
  const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportSvgString() {
  const svg = state.svg;
  if (!svg) return '';
  const clone = svg.cloneNode(true);
  clone.querySelectorAll('[data-node-id]').forEach(el => el.remove());
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const vb = (svg.getAttribute('viewBox') || '0 0 1000 600').split(/\s+/).map(Number);
  clone.setAttribute('width', Math.round(vb[2] || 1000));
  clone.setAttribute('height', Math.round(vb[3] || 600));
  clone.style.background = '#fff';
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', vb[0] || 0);
  bg.setAttribute('y', vb[1] || 0);
  bg.setAttribute('width', vb[2] || 1000);
  bg.setAttribute('height', vb[3] || 600);
  bg.setAttribute('fill', '#fff');
  clone.insertBefore(bg, clone.firstChild);
  return new XMLSerializer().serializeToString(clone);
}
function downloadSvg() {
  if (!state.svg) return;
  download('tanglegram.svg', exportSvgString(), 'image/svg+xml;charset=utf-8');
}
function downloadPng(scale) {
  scale = scale || 2;
  if (!state.svg) return;
  const svgText = exportSvgString();
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const vb = (state.svg.getAttribute('viewBox') || '0 0 1000 600').split(/\s+/).map(Number);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round((vb[2] || 1000) * scale);
    canvas.height = Math.round((vb[3] || 600) * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'tanglegram.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

function importPanelHtml(prefix, accept, placeholder) {
  return `
    <div class="mode-tabs">
      <label><input type="radio" name="${prefix}Mode" value="file" checked> ${T('fileMode')}</label>
      <label><input type="radio" name="${prefix}Mode" value="text"> ${T('textMode')}</label>
    </div>
    <div class="file-input">
      <input type="file" id="${prefix}FileInput" class="import-file" accept="${accept}">
    </div>
    <div class="text-input">
      <textarea id="${prefix}TextInput" class="import-text" placeholder="${placeholder}" style="min-height:110px;" disabled></textarea>
    </div>
    <div class="btn-group">
      <button class="btn" type="button" id="${prefix}LoadBtn">${T('loadBtn')}</button>
      <button class="btn" type="button" id="${prefix}ExampleBtn">${T('exampleBtn')}</button>
    </div>
  `;
}

function attachImportPanel(host, prefix, onLoad, onExample) {
  const fileInput = host.querySelector(`#${prefix}FileInput`);
  const textInput = host.querySelector(`#${prefix}TextInput`);
  const radios = host.querySelectorAll(`input[name="${prefix}Mode"]`);
  function applyMode() {
    const mode = host.querySelector(`input[name="${prefix}Mode"]:checked`).value;
    if (mode === 'file') {
      fileInput.disabled = false;
      textInput.disabled = true;
    } else {
      fileInput.disabled = true;
      textInput.disabled = false;
      fileInput.value = '';
    }
  }
  radios.forEach(r => r.addEventListener('change', applyMode));
  applyMode();

  fileInput.addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const text = await readFileAsText(f);
      onLoad(text, f.name, '');
    } catch (err) {
      onLoad('', '', err.message || String(err));
    }
  });

  host.querySelector(`#${prefix}LoadBtn`).addEventListener('click', async () => {
    try {
      const mode = host.querySelector(`input[name="${prefix}Mode"]:checked`).value;
      if (mode === 'file') {
        if (!fileInput.files || !fileInput.files[0]) { onLoad('', '', T('selectFileFirst')); return; }
        const f = fileInput.files[0];
        const text = await readFileAsText(f);
        onLoad(text, f.name, '');
      } else {
        const v = textInput.value;
        if (!v || !v.trim()) { onLoad('', '', T('pasteTextFirst')); return; }
        onLoad(v, '(text)', '');
      }
    } catch (err) {
      onLoad('', '', err.message || String(err));
    }
  });

  host.querySelector(`#${prefix}ExampleBtn`).addEventListener('click', async () => {
    const btn = host.querySelector(`#${prefix}ExampleBtn`);
    const oldText = btn.textContent;
    const textRadio = host.querySelector(`input[name="${prefix}Mode"][value="text"]`);
    if (textRadio && !textRadio.checked) {
      textRadio.checked = true;
      textRadio.dispatchEvent(new Event('change'));
    }
    btn.disabled = true;
    btn.textContent = T('loading');
    try {
      const text = await Promise.resolve(onExample());
      if (text == null) throw new Error(T('exampleLoadFailed'));
      textInput.value = text;
      onLoad(text, '(example)', '');
    } catch (err) {
      onLoad('', '', err.message || String(err));
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  });
}

function showMsg(id, text, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'tip-text ' + (cls || '');
  if (text) setTimeout(() => {
    if (el.textContent === text) { el.textContent = ''; el.className = 'tip-text'; }
  }, 4000);
}

function buildUI() {
  const leftHost = document.getElementById('leftImportHost');
  leftHost.innerHTML = importPanelHtml('left', '.nwk,.tre,.tree,.nex,.nexus,.xml,.txt',
    LANG === 'en' ? 'Paste Newick / NEXUS / PhyloXML text here' : '在此粘贴 Newick / NEXUS / PhyloXML 文本');
  attachImportPanel(leftHost, 'left',
    (text, name, err) => {
      if (err) { showMsg('leftMsg', '❌ ' + err, 'error'); return; }
      try {
        state.leftRoot = parseTreeText(text);
        recolorGroups();
        renderGroupStyle();
        renderLegend();
        drawAll();
        showMsg('leftMsg', '✅ ' + T('leftLoaded') + ': ' + name, 'success');
      } catch (e) {
        showMsg('leftMsg', '❌ ' + (e.message || e), 'error');
      }
    },
    () => fetchRemoteExample('BI.tre')
  );

  const rightHost = document.getElementById('rightImportHost');
  rightHost.innerHTML = importPanelHtml('right', '.nwk,.tre,.tree,.nex,.nexus,.xml,.txt',
    LANG === 'en' ? 'Paste Newick / NEXUS / PhyloXML text here' : '在此粘贴 Newick / NEXUS / PhyloXML 文本');
  attachImportPanel(rightHost, 'right',
    (text, name, err) => {
      if (err) { showMsg('rightMsg', '❌ ' + err, 'error'); return; }
      try {
        state.rightRoot = parseTreeText(text);
        recolorGroups();
        renderGroupStyle();
        renderLegend();
        drawAll();
        showMsg('rightMsg', '✅ ' + T('rightLoaded') + ': ' + name, 'success');
      } catch (e) {
        showMsg('rightMsg', '❌ ' + (e.message || e), 'error');
      }
    },
    () => fetchRemoteExample('ml.contree')
  );

  const groupsHost = document.getElementById('groupsImportHost');
  groupsHost.innerHTML = importPanelHtml('groups', '.csv,.tsv,.txt',
    LANG === 'en'
      ? 'Col1 leaf, col2 group, optional col3 #RRGGBB (or click "Load example" to auto-generate clusters from current tree)'
      : '第一列叶名，第二列分组名，可选第三列 #RRGGBB（或点击“加载示例”按当前树的聚类自动生成）');
  attachImportPanel(groupsHost, 'groups',
    (text, name, err) => {
      if (err) { showMsg('groupsMsg', '❌ ' + err, 'error'); return; }
      try {
        const { map, colorOverride } = parseGroupsText(text);
        state.groups = map;
        state.groupColorOverride = colorOverride || {};
        recolorGroups();
        renderGroupStyle();
        renderLegend();
        drawAll();
        showMsg('groupsMsg', '✅ ' + T('groupsLoaded') + ': ' + map.size, 'success');
      } catch (e) {
        showMsg('groupsMsg', '❌ ' + (e.message || e), 'error');
      }
    },
    () => generateGroupExample()
  );

  renderGroupStyle();

  const bindNum = (id, key, kind) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (kind === 'bool') state[key] = el.checked;
      else if (kind === 'nullable') state[key] = el.value === '' ? null : Number(el.value);
      else state[key] = Number(el.value);
      drawAll();
    });
  };
  bindNum('tgIgnoreLength', 'ignoreLength', 'bool');
  bindNum('tgHideLabels', 'hideLabels', 'bool');
  bindNum('tgHighlightMismatch', 'highlightMismatch', 'bool');
  bindNum('tgDepthTolerance', 'depthTolerance', 'nullable');
  bindNum('tgLeafRowH', 'leafRowH');
  bindNum('tgTreeWidth', 'treeWidth');
  bindNum('tgGapWidth', 'gapWidth');
  bindNum('tgLabelFontSize', 'labelFontSize');
  bindNum('tgLinkWidth', 'linkWidth');
  bindNum('tgLinkOpacity', 'linkOpacity');
  bindNum('tgLinkCurve', 'linkCurve');
  bindNum('tgLinkMatchBranch', 'linkMatchBranch', 'bool');
  bindNum('tgLinkDashed', 'linkDashed', 'bool');
  bindNum('tgLabelOffset', 'labelOffset');

  const gapAutoChk = document.getElementById('tgGapAuto');
  const gapInput = document.getElementById('tgGapWidth');
  if (gapAutoChk && gapInput) {
    gapAutoChk.checked = state.gapAuto;
    gapInput.readOnly = state.gapAuto;
    gapInput.style.opacity = state.gapAuto ? '0.65' : '1';
    gapAutoChk.addEventListener('change', () => {
      state.gapAuto = gapAutoChk.checked;
      gapInput.readOnly = state.gapAuto;
      gapInput.style.opacity = state.gapAuto ? '0.65' : '1';
      drawAll();
    });
  }

  const topoChk = document.getElementById('tgTopoHighlight');
  if (topoChk) {
    topoChk.checked = state.topoHighlight;
    topoChk.addEventListener('change', () => {
      state.topoHighlight = topoChk.checked;
      drawAll();
    });
  }

  const labelAlignSel = document.getElementById('tgLabelAlignMode');
  if (labelAlignSel) {
    labelAlignSel.value = state.labelAlignMode;
    labelAlignSel.addEventListener('change', () => {
      state.labelAlignMode = labelAlignSel.value;
      drawAll();
    });
  }
  const linkAlignSel = document.getElementById('tgLinkAlignMode');
  if (linkAlignSel) {
    linkAlignSel.value = state.linkAlignMode;
    linkAlignSel.addEventListener('change', () => {
      state.linkAlignMode = linkAlignSel.value;
      drawAll();
    });
  }
  const linkPadInp = document.getElementById('tgLinkPadding');
  if (linkPadInp) {
    linkPadInp.value = state.linkPadding;
    linkPadInp.addEventListener('input', () => {
      state.linkPadding = Number(linkPadInp.value) || 0;
      drawAll();
    });
  }

  function firstLeafKey(node) {
    let minKey = null;
    (function rec(n) {
      const kids = (n.children || []).filter(c => !c._deleted);
      if (!kids.length) {
        const name = String(n.name || '').trim();
        if (name && (minKey === null || name < minKey)) minKey = name;
        return;
      }
      kids.forEach(rec);
    })(node);
    return minKey || '';
  }
  function groupKey(node) {
    const leaves = [];
    (function rec(n) {
      const kids = (n.children || []).filter(c => !c._deleted);
      if (!kids.length) {
        const name = String(n.name || '').trim();
        if (name) leaves.push(name);
        return;
      }
      kids.forEach(rec);
    })(node);
    leaves.sort();
    const first = leaves[0] || '';
    const g = state.groups.get(first) || '';
    return g + '\u0001' + first;
  }
  function sortOneTree(root, mode) {
    if (!root || mode === 'none') return;
    (function rec(n) {
      const active = (n.children || []).filter(c => !c._deleted);
      if (!active.length) return;
      active.forEach(rec);
      active.sort((a, b) => {
        let ka, kb;
        if (mode === 'group') { ka = groupKey(a); kb = groupKey(b); }
        else { ka = firstLeafKey(a); kb = firstLeafKey(b); }
        return mode === 'labelDesc' ? kb.localeCompare(ka) : ka.localeCompare(kb);
      });
      const deleted = (n.children || []).filter(c => c._deleted);
      n.children = active.concat(deleted);
    })(root);
  }
  const sortSel = document.getElementById('tgSortMode');
  if (sortSel) {
    sortSel.addEventListener('change', () => {
      const mode = sortSel.value;
      sortOneTree(state.leftRoot, mode);
      sortOneTree(state.rightRoot, mode);
      drawAll();
    });
  }

  const incMeta = document.getElementById('tgIncludeMeta');
  if (incMeta) incMeta.addEventListener('change', () => {
    state.includeMeta = incMeta.checked;
  });

  document.querySelectorAll('[data-export]').forEach(btn => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.export;
      if (kind === 'left') {
        if (!state.leftRoot) { showMsg('tgMsg', T('needLeftTree'), 'error'); return; }
        download('left-tree.nwk', exportNewick(state.leftRoot, state.includeMeta));
        showMsg('tgMsg', '✅ ' + T('leftExported') + (state.includeMeta ? T('withMeta') : ''), 'success');
      } else if (kind === 'right') {
        if (!state.rightRoot) { showMsg('tgMsg', T('needRightTree'), 'error'); return; }
        download('right-tree.nwk', exportNewick(state.rightRoot, state.includeMeta));
        showMsg('tgMsg', '✅ ' + T('rightExported') + (state.includeMeta ? T('withMeta') : ''), 'success');
      } else if (kind === 'svg') {
        if (!state.leftRoot && !state.rightRoot) { showMsg('tgMsg', T('needTrees'), 'error'); return; }
        downloadSvg();
        showMsg('tgMsg', '✅ ' + T('svgExported'), 'success');
      } else if (kind === 'png') {
        if (!state.leftRoot && !state.rightRoot) { showMsg('tgMsg', T('needTrees'), 'error'); return; }
        downloadPng(2);
        showMsg('tgMsg', '✅ ' + T('pngExported'), 'success');
      }
    });
  });

  bindClick(state.svg);
  bindActionPanel();
}

function init() {
  const svg = document.getElementById('tgSvg');
  if (!svg) return;
  state.svg = svg;
  buildUI();
  renderLegend();
  drawAll();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

global.Tanglegram = { state, drawAll };
})(window);s
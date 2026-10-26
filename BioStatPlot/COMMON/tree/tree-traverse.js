(function (global) {
'use strict';
const C = global.TreeCore;

function walk(n, fn) {
  if (!n || n.deleted) return;
  fn(n);
  if (!n.collapsed) (n.children || []).forEach(c => walk(c, fn));
}
function allWalk(n, fn) {
  if (!n) return;
  fn(n);
  (n.children || []).forEach(c => allWalk(c, fn));
}
function visibleChildren(n) {
  if (n.collapsed) return [];
  return (n.children || []).filter(c => !c.deleted);
}
function isLeaf(n) { return !visibleChildren(n).length || n.collapsed; }
function labelOf(n) {
  if (n.label) return n.label;
  if (n.name) return n.name;
  if (n.collapsed) return "[" + (n.uid || n.id) + "]";
  return n.id;
}
function visibleLeaves(n) {
  const out = [];
  walk(n, x => { if (isLeaf(x) && !x.deleted) out.push(x); });
  return out;
}
function maxDepth(n, depth = 0) {
  const kids = visibleChildren(n);
  if (!kids.length || n.collapsed) return depth;
  return Math.max(...kids.map(c => maxDepth(c, depth + C.branchLen(c))));
}
function nodeById(id) {
  let f = null;
  allWalk(C.getRoot(), x => { if (x.id === id) f = x; });
  return f;
}
function leavesUnder(n) {
  const out = [];
  walk(n, x => { if (isLeaf(x)) out.push(x); });
  return out;
}
function leafRowBounds(leaves, fallbackHeight) {
  const ordered = [...leaves].sort((a, b) => a.y - b.y);
  const bounds = new Map();
  ordered.forEach((leaf, i) => {
    const before = i ? ordered[i - 1].y : leaf.y - (ordered[1] ? ordered[1].y - leaf.y : fallbackHeight);
    const after = i + 1 < ordered.length ? ordered[i + 1].y : leaf.y + (i ? leaf.y - ordered[i - 1].y : fallbackHeight);
    bounds.set(leaf, { top: (before + leaf.y) / 2, bottom: (leaf.y + after) / 2 });
  });
  return bounds;
}
function countInnerLeaves(n) {
  let c = 0;
  (function rec(m) {
    if (m.deleted) return;
    const kids = (m.children || []).filter(k => !k.deleted);
    if (!kids.length) { c++; return; }
    kids.forEach(rec);
  })(n);
  return c;
}
function collectInnerLeaves(n) {
  const out = [];
  (function rec(m) {
    if (m.deleted) return;
    const kids = (m.children || []).filter(k => !k.deleted);
    if (!kids.length) { out.push(m); return; }
    kids.forEach(rec);
  })(n);
  return out;
}
function hasRealChildren(n) { return !!(n && (n.children || []).some(c => !c.deleted)); }

function suppressUnary(node, rt) {
  (node.children || []).slice().forEach(c => suppressUnary(c, rt));
  if (node !== rt && node.parent && (node.children || []).length === 1) {
    const only = node.children[0];
    only.length = Number(only.length || 0) + Number(node.length || 0);
    only.parent = node.parent;
    const idx = node.parent.children.indexOf(node);
    if (idx >= 0) node.parent.children[idx] = only;
  }
}
function rerootAt(target) {
  if (!target || !target.parent) return false;
  const L = Number(target.length || 0), half = L > 0 ? L / 2 : 0;
  const newRoot = {
    name: "", length: 0, children: [], parent: null,
    collapsed: false, deleted: false, color: null, label: null, highlight: false,
    support: "", meta: []
  };
  const path = [];
  for (let x = target.parent; x; x = x.parent) path.push(x);
  target.parent.children = (target.parent.children || []).filter(c => c !== target);
  let childSide = newRoot, edgeLen = half;
  for (const node of path) {
    const up = node.parent, upEdge = Number(node.length || 0);
    if (up) up.children = (up.children || []).filter(c => c !== node);
    node.parent = childSide;
    node.length = edgeLen;
    childSide.children.push(node);
    childSide = node;
    edgeLen = upEdge;
  }
  target.parent = newRoot;
  target.length = half;
  newRoot.children.push(target);
  suppressUnary(newRoot, newRoot);
  C.setRoot(newRoot);
  global.TreeParser.assign(newRoot, null);
  C.setSelectedId(null);
  C.setSelectedBranchId(null);
  return true;
}
function moveNodeBeside(src, target) {
  if (!src || !target || src === target || !src.parent) return false;
  for (let p = target; p; p = p.parent) if (p === src) return false;
  const oldP = src.parent;
  oldP.children = oldP.children.filter(c => c !== src);
  const tp = target.parent;
  if (!tp) {
    target.children = target.children || [];
    target.children.push(src);
    src.parent = target;
  } else {
    const idx = tp.children.indexOf(target);
    tp.children.splice(idx + 1, 0, src);
    src.parent = tp;
  }
  suppressUnary(C.getRoot(), C.getRoot());
  global.TreeParser.assign(C.getRoot(), null);
  return true;
}

// ====== 序列化 ======
function newickName(n) {
  const raw = String(n.label || n.name || n.id || "");
  return /[\s(),:;'\[\]]/.test(raw) ? "'" + raw.replace(/'/g, "''") + "'" : raw;
}
function toNewick(node) {
  node = node || C.getRoot();
  function r(n) {
    const kids = (n.children || []).filter(c => !c.deleted);
    let s;
    if (kids.length && !n.collapsed) {
      s = "(" + kids.map(r).join(",") + ")";
      if (n.support) s += n.support;
    } else s = newickName(n);
    if (n.length != null && n.parent) s += ":" + String(+Number(n.length).toFixed(6));
    return s;
  }
  return r(node) + ";";
}
function toNexus() {
  return "#NEXUS\nBEGIN TREES;\n  TREE tree1 = [&R] " + toNewick(C.getRoot()) + "\nEND;\n";
}
function toPhyloXMLWithMeta(node) {
  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  function clade(n, isRoot) {
    const kids = (n.children || []).filter(c => !c.deleted);
    let s = "<clade>";
    if (!isRoot && n.length != null) s += "<branch_length>" + (+Number(n.length).toFixed(6)) + "</branch_length>";
    const nm = n.label || n.name;
    if (nm && (!kids.length || !isRoot)) s += "<name>" + esc(nm) + "</name>";
    if (n.support) s += '<confidence type="bootstrap">' + esc(n.support) + "</confidence>";
    (n.meta || []).forEach(m => {
      if (!m || m.field == null) return;
      let v = m.value;
      if (Array.isArray(v)) v = "[" + v.map(x => String(x)).join(", ") + "]";
      if (v != null && v !== "")
        s += '<property ref="' + esc(m.field) + '" applies_to="clade">' + esc(v) + "</property>";
    });
    kids.forEach(c => { s += clade(c, false); });
    return s + "</clade>";
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n<phyloxml xmlns="http://www.phyloxml.org">\n<phylogeny rooted="true">\n' +
    clade(node, true) + "\n</phylogeny>\n</phyloxml>\n";
}
function cropTreeToPathAndSubtree(root, target) {
  if (!root || !target) return null;
  const path = []; let cur = target;
  while (cur) { path.unshift(cur); if (cur === root) break; cur = cur.parent; }
  if (path[0] !== root) return null;
  function cloneFull(n) {
    const o = {
      name: n.name || "", length: n.length, support: n.support, label: n.label,
      meta: JSON.parse(JSON.stringify(n.meta || [])),
      children: []
    };
    (n.children || []).forEach(c => { if (!c.deleted) o.children.push(cloneFull(c)); });
    return o;
  }
  let result = cloneFull(target);
  for (let i = path.length - 2; i >= 0; i--) {
    const anc = path[i];
    result = {
      name: anc.name || "", length: anc.length, support: anc.support,
      label: anc.label, meta: [], children: [result]
    };
  }
  return result;
}

global.TreeTraverse = {
  walk, allWalk, visibleChildren, isLeaf, labelOf, visibleLeaves,
  maxDepth, nodeById, leavesUnder, leafRowBounds,
  countInnerLeaves, collectInnerLeaves, hasRealChildren,
  suppressUnary, rerootAt, moveNodeBeside
};
global.TreeSerialize = { newickName, toNewick, toNexus, toPhyloXMLWithMeta, cropTreeToPathAndSubtree };
})(window);
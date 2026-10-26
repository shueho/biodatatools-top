(function (global) {
'use strict';
const C = global.TreeCore;

function splitTopLevel(str, sepChar) {
  const out = []; let depth = 0, quote = 0, start = 0;
  const sc = sepChar.charCodeAt(0);
  for (let j = 0; j < str.length; j++) {
    const c = str.charCodeAt(j);
    if (quote) { if (c === quote) quote = 0; continue; }
    if (c === 39 || c === 34) { quote = c; continue; }
    if (c === 123 || c === 40 || c === 91) { depth++; continue; }
    if (c === 125 || c === 41 || c === 93) { depth--; continue; }
    if (c === sc && depth === 0) { out.push(str.slice(start, j)); start = j + 1; }
  }
  out.push(str.slice(start));
  return out;
}

function parseNHXBody(body, node) {
  if (!body) return;
  splitTopLevel(body, ",").forEach(pair => {
    const eq = pair.indexOf("="); if (eq < 0) return;
    const key = pair.slice(0, eq).trim();
    let val = pair.slice(eq + 1).trim();
    if (!key) return;
    let parsed;
    if (val.startsWith("{") && val.endsWith("}")) {
      parsed = splitTopLevel(val.slice(1, -1), ",").map(x => {
        const t = x.trim(); const n = Number(t);
        return Number.isFinite(n) ? n : t;
      });
    } else if ((val.startsWith("'") && val.endsWith("'")) ||
               (val.startsWith('"') && val.endsWith('"'))) {
      parsed = val.slice(1, -1);
    } else {
      const n = Number(val); parsed = Number.isFinite(n) ? n : val;
    }
    node.meta.push({ field: key, value: parsed });
  });
}

function parseNewick(input, translateMap) {
  let s = String(input == null ? "" : input).replace(/^\uFEFF/, "");
  let rootFlag = null;
  const flagMatch = s.match(/^\s*\[&([RU])\]/i);
  if (flagMatch) rootFlag = flagMatch[1].toUpperCase() === 'R';
  if (!s.trim()) throw new Error("Newick 输入为空");
  s = s.replace(/^\s*\[&[RU]\]\s*/i, "").replace(/;\s*$/, "");
  let i = 0; const N = s.length;
  function skipWhite() {
    while (i < N) { const c = s.charCodeAt(i); if (c === 32 || c === 9 || c === 10 || c === 13) i++; else break; }
  }
  function consumeAnnotations(node) {
    skipWhite();
    while (i < N && s.charCodeAt(i) === 91) {
      i++; let depth = 1, quote = 0; const cs = i;
      while (i < N && depth > 0) {
        const ch = s.charCodeAt(i);
        if (quote) { if (ch === quote) quote = 0; i++; }
        else if (ch === 39 || ch === 34) { quote = ch; i++; }
        else if (ch === 91) { depth++; i++; }
        else if (ch === 93) { depth--; i++; }
        else i++;
      }
      const content = s.slice(cs, i - 1);
      if (content) {
        if (content.startsWith("&&NHX:")) parseNHXBody(content.slice(6), node);
        else if (content.startsWith("&")) {
          const body = content.slice(1);
          if (body !== "R" && body !== "U" && body.includes("=")) parseNHXBody(body, node);
        }
      }
      skipWhite();
    }
  }
  function readToken() {
    skipWhite();
    if (i < N && (s[i] === "'" || s[i] === '"')) {
      const q = s[i++]; let out = '';
      while (i < N) {
        if (s[i] === q) {
          if (s[i + 1] === q) { out += q; i += 2; }
          else { i++; return out; }
        } else out += s[i++];
      }
      return out;
    }
    const start = i;
    while (i < N) {
      const ch = s[i];
      if (ch === "(" || ch === ")" || ch === "," || ch === ":" || ch === ";" || ch === "[" || ch === "]") break;
      i++;
    }
    return s.slice(start, i).trim();
  }
  function readLength(node) {
    consumeAnnotations(node); skipWhite();
    if (s[i] === ":") {
      i++;
      const raw = readToken();
      const v = Number.parseFloat(raw);
      node.length = Number.isFinite(v) && v >= 0 ? v : 0.1;
      node._hasExplicitLength = true;
    } else {
      node.length = 0.12; node._hasExplicitLength = false;
    }
    consumeAnnotations(node);
  }
  function applyTranslate(node) {
    if (!translateMap || !node.name) return;
    const k = String(node.name).trim();
    if (Object.prototype.hasOwnProperty.call(translateMap, k)) node.name = translateMap[k];
  }
  let depthGuard = 0;
  function subtree(parent) {
    if (++depthGuard > 100000) throw new Error("Newick 递归过深");
    skipWhite();
    const node = C.emptyNode(parent);
    if (i < N && s[i] === "(") {
      i++;
      while (i < N) {
        node.children.push(subtree(node)); skipWhite();
        if (s[i] === ",") { i++; continue; }
        if (s[i] === ")") { i++; break; }
        break;
      }
      consumeAnnotations(node); skipWhite();
      const tok = readToken();
      if (tok) {
        const isNumeric = /^\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)*$/.test(tok);
        const parts = isNumeric ? tok.split('/').map(Number) : [];
        const mode = C.state.bootstrapRange || 'auto';
        let asSupport;
        if (!isNumeric) asSupport = false;
        else if (mode === 'none') asSupport = false;
        else if (mode === 'count') asSupport = true;
        else if (mode === '0-1') asSupport = parts.every(v => v >= 0 && v <= 1);
        else if (mode === '0-100') asSupport = parts.every(v => v >= 0 && v <= 100);
        else asSupport = parts.every(v => v >= 0 && v <= 100);
        if (asSupport) node.support = tok;
        else node.name = tok;
      }
      readLength(node);
    } else {
      node.name = readToken();
      readLength(node);
    }
    applyTranslate(node);
    return node;
  }
  const root = subtree(null);
  if (!root || ((!root.children || root.children.length === 0) && !root.name)) throw new Error("Newick 结构解析为空");
  if (rootFlag !== null) root.rootFlag = rootFlag;
  else if (!root._hasExplicitLength) root.rootFlag = false;
  return root;
}

function parseNexus(text) {
  const src = String(text == null ? "" : text).replace(/^\uFEFF/, "");
  const lines = src.split(/\r?\n/);
  const translate = {}, trees = [];
  let inTrees = false, inTranslate = false, currentName = null, currentBody = null;
  function parseTranslateLine(line) {
    splitTopLevel(line.replace(/;$/, ""), ",").forEach(raw => {
      const chunk = raw.trim(); if (!chunk) return;
      const mm = chunk.match(/^(\d+)\s+(.+)$/); if (!mm) return;
      let name = mm[2].trim();
      if ((name.startsWith("'") && name.endsWith("'")) ||
          (name.startsWith('"') && name.endsWith('"'))) name = name.slice(1, -1);
      translate[mm[1]] = name;
    });
  }
  function flushTree() {
    if (currentBody != null) {
      const body = String(currentBody).replace(/;$/, "").trim();
      if (body) trees.push({ name: currentName || ("tree" + (trees.length + 1)), newick: body });
    }
    currentBody = null;
  }
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim(); if (!line) continue;
    if (!inTrees) { if (/^BEGIN\s+TREES\b/i.test(line)) inTrees = true; continue; }
    if (/^END\b/i.test(line)) {
      if (inTranslate) inTranslate = false;
      flushTree(); inTrees = false; continue;
    }
    if (inTranslate) {
      if (/^(?:U)?TREE\b/i.test(line)) inTranslate = false;
      else {
        parseTranslateLine(line);
        if (line.endsWith(";")) inTranslate = false;
        continue;
      }
    }
    if (/^TRANSLATE\b/i.test(line)) {
      inTranslate = true;
      const rest = line.replace(/^TRANSLATE\s*/i, "");
      if (rest) { parseTranslateLine(rest); if (rest.endsWith(";")) inTranslate = false; }
      continue;
    }
    if (/^(?:U)?TREE\b/i.test(line)) {
      const m = line.match(/^(?:U)?TREE\s+(.+?)\s*=\s*(.*)$/i);
      if (m) {
        currentName = m[1].trim().replace(/^['"]|['"]$/g, "");
        let body = m[2].trim().replace(/^\[&[UR]\]\s*/i, "");
        if (body.endsWith(";")) {
          trees.push({ name: currentName, newick: body.slice(0, -1).trim() });
          currentBody = null;
        } else currentBody = body;
      }
      continue;
    }
    if (currentBody != null) {
      currentBody += " " + line;
      if (line.endsWith(";")) { flushTree(); currentName = null; }
    }
  }
  flushTree();
  if (!trees.length) throw new Error("NEXUS 中未找到任何 tree 记录");
  const chosen = trees.find(t => t.newick && t.newick.indexOf("(") !== -1) || trees[0];
  if (!chosen.newick) throw new Error("NEXUS 中的 tree 记录为空");
  const tree = parseNewick(chosen.newick, translate);
  if (tree.rootFlag !== false) tree.rootFlag = true;
  if (trees.length > 1) {
    tree._alternativeTrees = trees.length;
    tree._chosenTreeName = chosen.name || 'tree1';
    console.warn('[TreeParser] NEXUS contains ' + trees.length +
                 ' trees; loaded "' + (chosen.name || 'tree1') + '".');
  }
  return tree;
}

function parsePhyloXML(text) {
  const src = String(text == null ? "" : text).replace(/^\uFEFF/, "");
  const doc = new DOMParser().parseFromString(src, "application/xml");
  if (doc.getElementsByTagName("parsererror")[0]) throw new Error("PhyloXML 解析失败");
  const phylogeny = doc.getElementsByTagName("phylogeny")[0] ||
                    doc.getElementsByTagNameNS("*", "phylogeny")[0];
  if (!phylogeny) throw new Error("PhyloXML 中未找到 <phylogeny>");
  const rootClade = Array.from(phylogeny.children || []).find(
    c => c.localName === "clade" || c.nodeName.replace(/^.*:/, "") === "clade"
  );
  if (!rootClade) throw new Error("PhyloXML 中未找到根 <clade>");
  const seen = {};
  function uniqueName(node) {
    if (!node.name) return;
    if (seen[node.name] === undefined) seen[node.name] = 0;
    else { seen[node.name]++; node.name = node.name + seen[node.name]; }
  }
  function parseClade(el, parent) {
    const node = C.emptyNode(parent);
    const lenAttr = el.getAttribute && el.getAttribute("branch_length");
    if (lenAttr != null) {
      const v = Number.parseFloat(lenAttr);
      if (Number.isFinite(v) && v >= 0) { node.length = v; node._hasExplicitLength = true; }
    }
    const childClades = []; let childLen = null;
    for (const child of el.children || []) {
      const tag = child.localName || child.nodeName.replace(/^.*:/, "");
      switch (tag) {
        case "name": if (!node.name) node.name = (child.textContent || "").trim(); break;
        case "branch_length": childLen = child; break;
        case "taxonomy": {
          const sci = child.getElementsByTagName("scientific_name")[0] ||
                      child.getElementsByTagNameNS("*", "scientific_name")[0];
          if (sci) node.name = (sci.textContent || "").trim();
          break;
        }
        case "confidence": {
          const v = (child.textContent || "").trim();
          if (v) node.support = v;
          const t = child.getAttribute("type");
          if (t) node.meta.push({ field: "confidence_type", value: t });
          break;
        }
        case "clade": childClades.push(child); break;
        case "property": {
          const key = child.getAttribute("ref") || child.getAttribute("applies_to");
          let val = (child.textContent || "").trim();
          if (key && val) {
            const arrMatch = val.match(/^\[\s*(.*?)\s*\]$/);
            if (arrMatch) {
              const parts = arrMatch[1].split(",").map(s => s.trim()).filter(s => s !== "");
              const nums = parts.map(s => Number(s));
              if (nums.length >= 2 && nums.every(n => Number.isFinite(n))) {
                node.meta.push({ field: key, value: nums });
                break;
              }
            }
            if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(val)) {
              const n = Number(val);
              if (Number.isFinite(n)) { node.meta.push({ field: key, value: n }); break; }
            }
            node.meta.push({ field: key, value: val });
          }
          break;
        }
      }
    }
    if (childLen) {
      const v = Number.parseFloat((childLen.textContent || "").trim());
      if (Number.isFinite(v) && v >= 0) { node.length = v; node._hasExplicitLength = true; }
    }
    if (childClades.length) node.children = childClades.map(c => parseClade(c, node));
    uniqueName(node);
    return node;
  }
  const tree = parseClade(rootClade, null);
  if (tree.rootFlag !== false) tree.rootFlag = true;
  return tree;
}

function detectTreeFormat(text) {
  if (text == null) return "empty";
  let s = String(text);
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  const trimmed = s.trim(); if (!trimmed) return "empty";
  const head = trimmed.slice(0, 4096);
  if (/^#NEXUS\b/i.test(head)) return "nexus";
  if (/<phyloxml\b/i.test(head) || /<phylogeny\b/i.test(head)) return "phyloxml";
  if (/^<\?xml\b/i.test(head)) return (/<phyloxml\b/i.test(s) || /<phylogeny\b/i.test(s)) ? "phyloxml" : "xml";
  if (/^<[a-zA-Z]/.test(head)) return (/<phyloxml\b/i.test(s) || /<phylogeny\b/i.test(s)) ? "phyloxml" : "xml";
  return "newick";
}

function parseTree(text) {
  const fmt = detectTreeFormat(text);
  if (fmt === "nexus") return parseNexus(text);
  if (fmt === "phyloxml") return parsePhyloXML(text);
  if (fmt === "empty") throw new Error("输入为空");
  if (fmt === "xml") throw new Error("不支持的 XML 格式");
  return parseNewick(text);
}

function assign(n, parent) {
  n.parent = parent;
  n.id = C.nextId();
  n.uid = n.name || n.support || n.id;
  (n.children || []).forEach(c => assign(c, n));
}

global.TreeParser = { parseNewick, parseNexus, parsePhyloXML, parseTree, detectTreeFormat, splitTopLevel, assign };
})(window);
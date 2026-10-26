(function (global) {
'use strict';
const C = global.TreeCore;
const T = global.TreeTraverse;
const I = global.TreeI18N;

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
    leafData.headers = [];
    leafData.rows = [];
    leafData.leafMap = new Map();
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
  const csvCell = v => {
    const s = String(v == null ? "" : v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
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
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
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
    leafData.headers = [];
    leafData.rows = [];
    leafData.columnTypes = {};
    leafData.leafMap = new Map();
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
  let v2Idx = headers.indexOf("rand_val2");
  let v3Idx = headers.indexOf("rand_val3");
  if (binIdx < 0) { headers.push("rand_binary"); binIdx = headers.length - 1; }
  if (valIdx < 0) { headers.push("rand_value"); valIdx = headers.length - 1; }
  if (v2Idx < 0) { headers.push("rand_val2"); v2Idx = headers.length - 1; }
  if (v3Idx < 0) { headers.push("rand_val3"); v3Idx = headers.length - 1; }
  const out = [headers.join("\t")];
  for (let i = 1; i < lines.length; i++) {
    const cells = parse(lines[i]);
    while (cells.length < headers.length) cells.push("");
    cells[binIdx] = Math.random() < 0.5 ? "0" : "1";
    cells[valIdx] = (Math.random() * 10).toFixed(2);
    cells[v2Idx] = (Math.random() * 10).toFixed(2);
    cells[v3Idx] = (Math.random() * 10).toFixed(2);
    out.push(cells.join("\t"));
  }
  ta.value = out.join("\n");
  const textRadio = document.querySelector('input[name="extDataMode"][value="text"]');
  if (textRadio && !textRadio.checked) { textRadio.checked = true; textRadio.dispatchEvent(new Event("change")); }
}
function mergeExternalData(parsed) {
  if (!parsed || !parsed.headers.length) return;
  const leafCol = parsed.headers[0];
  const extraCols = parsed.headers.slice(1);
  extraCols.forEach(col => { if (!leafData.headers.includes(col)) leafData.headers.push(col); });
  const inferred = (global.PlotCommon && PlotCommon.inferColumnTypes)
    ? PlotCommon.inferColumnTypes(parsed.headers, parsed.data) : {};
  Object.assign(leafData.columnTypes, inferred, parsed.columnTypes || {});
  const ext = new Map();
  parsed.data.forEach(r => {
    const k = String(r[leafCol] == null ? "" : r[leafCol]).trim();
    if (k) ext.set(k, r);
  });
  leafData.rows.forEach(row => {
    const e = ext.get(String(row.Leaf || "").trim());
    extraCols.forEach(col => {
      if (e && e[col] !== undefined && e[col] !== "") row[col] = e[col];
      else if (row[col] === undefined || row[col] === "") row[col] = "NA";
    });
  });
  rebuildLeafMap();
  renderLeafDataPreview();
  refreshDataSummary();
}
function applyPrefixColumn() {
  if (!leafData.rows.length) { alert(I.t('alertNeedTree')); return; }
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
  renderLeafDataPreview();
  refreshDataSummary();
}
function applyCladeColumn() {
  const root = C.getRoot();
  if (!root) { alert(I.t('alertNeedTree')); return; }
  const depth = Math.max(1, Math.min(10, parseInt(document.getElementById("cladeDepth")?.value, 10) || 1));
  const colName = uniqueColName("clade-L" + depth);
  leafData.headers.push(colName);
  const keyOfLeaf = new Map();
  T.visibleLeaves(root).forEach(leaf => {
    const chain = [];
    let cur = leaf;
    while (cur) { chain.push(cur); cur = cur.parent; }
    chain.reverse();
    let key;
    if (chain.length > depth) {
      const branch = chain[depth];
      key = branch.name || branch.uid || branch.id;
    } else key = "root";
    keyOfLeaf.set(leaf.name || T.labelOf(leaf), key);
  });
  const groups = new Map();
  leafData.rows.forEach(row => {
    const k = keyOfLeaf.get(row.Leaf);
    if (k === undefined) return;
    if (!groups.has(k)) groups.set(k, "clade" + (groups.size + 1));
  });
  leafData.rows.forEach(row => {
    const k = keyOfLeaf.get(row.Leaf);
    row[colName] = k !== undefined ? (groups.get(k) || "NA") : "NA";
  });
  leafData.columnTypes[colName] = "categorical";
  renderLeafDataPreview();
  refreshDataSummary();
}
function applyClusterColumn() {
  const root = C.getRoot();
  if (!root) { alert(I.t('alertNeedTree')); return; }
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
  clades.forEach((c, i) => {
    const name = "cluster" + (i + 1);
    T.leavesUnder(c).forEach(l => map.set(l.name || T.labelOf(l), name));
  });
  leafData.rows.forEach(row => { row[colName] = map.get(row.Leaf) || "NA"; });
  leafData.columnTypes[colName] = "categorical";
  renderLeafDataPreview();
  refreshDataSummary();
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
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (box) box.value = ev.target.result;
      const textRadio = document.querySelector('input[name="extDataMode"][value="text"]');
      if (textRadio && !textRadio.checked) {
        textRadio.checked = true;
        textRadio.dispatchEvent(new Event("change"));
      }
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
    if (e.target.value === "chars") {
      input.placeholder = I.t('prefixCharsPh');
      if (!input.value.trim()) input.value = "3";
    } else if (e.target.value === "delimiter") {
      input.placeholder = I.t('prefixDelimPh');
      if (input.value === "3") input.value = "_";
    } else {
      input.placeholder = I.t('prefixNoParam');
    }
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

global.TreeAppData = {
  get leafData() { return leafData; },
  renderDataPanel, rebuildLeafRowsFromTree, renderLeafDataPreview, refreshDataSummary,
  getTreeLeafNames, autoFillLeavesInExternal, generateRandomColumns,
  applyPrefixColumn, applyCustomPrefixColumn, applyCladeColumn, applyClusterColumn,
  exportLeafTemplate, copyTableToClipboard, resetTableToLeaves
};
})(window);
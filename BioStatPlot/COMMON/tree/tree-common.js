(function (global) {
'use strict';
function detectDelimiter(text) {
  const first = (text.split(/\r?\n/).find(l => l.trim()) || '');
  if (first.includes('\t')) return '\t';
  if (first.includes(',')) return ',';
  if (first.includes(';')) return ';';
  return /\s+/;
}
function splitLine(line, sep) {
  if (sep instanceof RegExp) return line.trim().split(sep);
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (ch === sep && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
}
function parseTable(text) {
  if (!text || !text.trim()) return { headers: [], data: [] };
  const sep = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return { headers: [], data: [] };
  const headers = splitLine(lines[0], sep).map((h, i) => h || `Column${i + 1}`);
  const data = lines.slice(1).map(line => {
    const cells = splitLine(line, sep);
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i] !== undefined ? cells[i] : ''; });
    return row;
  });
  return { headers, data };
}
function inferColumnTypes(headers, data) {
  const types = {};
  const sample = Math.min(data.length, 200);
  headers.forEach(h => {
    let num = 0, date = 0, total = 0;
    for (let i = 0; i < sample; i++) {
      const v = data[i][h];
      if (v == null || v === '') continue;
      total++;
      const s = String(v).trim();
      if (s && !isNaN(Number(s))) num++;
      else if (!isNaN(Date.parse(s)) && /[-/:]/.test(s)) date++;
    }
    types[h] = !total ? 'categorical'
      : num / total >= 0.8 ? 'numeric'
      : date / total >= 0.8 ? 'date'
      : 'categorical';
  });
  return types;
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function measureText(text, fs) {
  const s = String(text || '');
  let w = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    w += (c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3000 && c <= 0x303f) || (c >= 0xff00 && c <= 0xffef) ? fs : fs * 0.6;
  }
  return w;
}
global.PlotCommon = Object.assign(global.PlotCommon || {}, {
  detectDelimiter, splitLine, parseTable, inferColumnTypes, escapeHtml, measureText
});
global.TreeCommon = global.PlotCommon;
})(window);
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
        const out = [];
        let cur = '', inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
                else inQuote = !inQuote;
            } else if (ch === sep && !inQuote) {
                out.push(cur); cur = '';
            } else cur += ch;
        }
        out.push(cur);
        return out.map(s => s.trim());
    }

    function parseTable(text) {
        if (!text || !text.trim()) return { headers: [], data: [] };
        const sep = detectDelimiter(text);
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length < 2) return { headers: [], data: [] };
        const rawHeaders = splitLine(lines[0], sep);
        const headers = rawHeaders.map((h, i) => h && h.length ? h : `Column${i + 1}`);
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const cells = splitLine(lines[i], sep);
            const row = {};
            headers.forEach((h, idx) => { row[h] = cells[idx] !== undefined ? cells[idx] : ''; });
            data.push(row);
        }
        return { headers, data };
    }

    function inferColumnTypes(headers, data) {
        const types = {};
        const sampleSize = Math.min(data.length, 200);
        headers.forEach(h => {
            let numericCount = 0, dateCount = 0, total = 0;
            for (let i = 0; i < sampleSize; i++) {
                const v = data[i][h];
                if (v === undefined || v === null || v === '') continue;
                total++;
                const s = String(v).trim();
                if (s !== '' && !isNaN(Number(s))) numericCount++;
                else if (!isNaN(Date.parse(s)) && /[-/:]/.test(s)) dateCount++;
            }
            if (total === 0) types[h] = 'categorical';
            else if (numericCount / total >= 0.8) types[h] = 'numeric';
            else if (dateCount / total >= 0.8) types[h] = 'date';
            else types[h] = 'categorical';
        });
        return types;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    global.PlotCommon = global.PlotCommon || {};
    Object.assign(global.PlotCommon, {
        detectDelimiter, splitLine, parseTable, inferColumnTypes, escapeHtml
    });
    global.TreeCommon = global.PlotCommon;
})(window);
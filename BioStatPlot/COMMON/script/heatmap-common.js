/* ============================================================
   BioDataTools 热图公共模块
   ============================================================ */
(function (global) {
    'use strict';

    const SC = global.StatCommon;

    function getLang() {
        return window.location.pathname.includes('/en/') ? 'en' : 'zh';
    }

    const I18N = {
        zh: {
            secFormat: '格式', secA: '区域 A', secB: '区域 B', secCell: '色块',
            secMark: '格子内文字', secTh: '标记显示阈值', secDiag: '对角线',
            secLab: '外围标签', secOrder: '顺序',

            diagDir: '对角线方向', fmtBLTR: '左下右上（主对角线分割）', fmtTLBR: '左上右下（副对角线分割）',
            colorBlock: '色块', markLabel: '标记',
            none: '不显示', corr: '相关系数色块', sig: '显著性色块',
            valR: '相关系数值', valStars: '显著水平标记', valP: '显著水平 p 值',

            sizeMode: '大小模式', sizeUniform: '等大（占满单元格）', sizeByCorr: '与 |r| 成正比',
            shape: '形状', square: '方形', circle: '圆形',
            shapeStrokeW: '色块描边宽', shapeStrokeC: '色块描边色',
            cellStrokeW: '格子描边宽', cellStrokeC: '格子描边色',

            fontSize: '字号', bold: '粗', italic: '斜', decimals: '小数位数',
            textColor: '文字颜色',
            sameAsCorrFill: '同相关系数色块',
            sameAsSigFill: '同 p 值色块',
            colorCustom: '自定义',
            customColor: '自定义颜色',

            thAbsR: '|r| ≥', thP: 'p ≤', phEmpty: '留空不限制',
            thHint: '两项均留空：全部显示；填任意一项：满足即显示；两项都填：满足任一即显示',

            showGrid: '显示网格线', showText: '显示文字', diagFill: '填充色',

            top: '上', bottom: '下', left: '左', right: '右',
            rotTop: '上角度', rotBottom: '下角度', rotLeft: '左角度', rotRight: '右角度',

            orderLabel: '自定义顺序', orderPlaceholder: '留空使用默认顺序；或如 mpg,disp,hp'
        },
        en: {
            secFormat: 'Format', secA: 'Area A', secB: 'Area B', secCell: 'Cell shape',
            secMark: 'Text inside cell', secTh: 'Mark display threshold', secDiag: 'Diagonal',
            secLab: 'Outer labels', secOrder: 'Order',

            diagDir: 'Diagonal split', fmtBLTR: 'Lower-left / Upper-right (main diagonal)', fmtTLBR: 'Upper-left / Lower-right (anti-diagonal)',
            colorBlock: 'Fill', markLabel: 'Mark',
            none: 'None', corr: 'Correlation fill', sig: 'Significance fill',
            valR: 'Correlation value', valStars: 'Significance stars', valP: 'P-value',

            sizeMode: 'Size mode', sizeUniform: 'Uniform (fill cell)', sizeByCorr: 'Proportional to |r|',
            shape: 'Shape', square: 'Square', circle: 'Circle',
            shapeStrokeW: 'Fill stroke width', shapeStrokeC: 'Fill stroke color',
            cellStrokeW: 'Cell stroke width', cellStrokeC: 'Cell stroke color',

            fontSize: 'Font size', bold: 'B', italic: 'I', decimals: 'Decimals',
            textColor: 'Text color',
            sameAsCorrFill: 'Same as correlation fill',
            sameAsSigFill: 'Same as significance fill',
            colorCustom: 'Custom',
            customColor: 'Custom color',

            thAbsR: '|r| ≥', thP: 'p ≤', phEmpty: 'Leave empty for no limit',
            thHint: 'Both empty: show all; either filled: show when the filled condition is met; both filled: show when either is met',

            showGrid: 'Show grid lines', showText: 'Show text', diagFill: 'Fill color',

            top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right',
            rotTop: 'Top angle', rotBottom: 'Bottom angle', rotLeft: 'Left angle', rotRight: 'Right angle',

            orderLabel: 'Custom order', orderPlaceholder: 'Leave empty for default; e.g. mpg,disp,hp'
        }
    };
    function T() { return I18N[getLang()] || I18N.zh; }

    /* ---------- 基础统计 ---------- */
    function mean(arr) {
        let s = 0;
        for (let i = 0; i < arr.length; i++) s += arr[i];
        return arr.length ? s / arr.length : 0;
    }
    function rank(arr) {
        const n = arr.length;
        const idx = [];
        for (let i = 0; i < n; i++) idx.push({ v: arr[i], i: i });
        idx.sort(function (a, b) { return a.v - b.v; });
        const out = new Array(n);
        let i = 0;
        while (i < n) {
            let j = i;
            while (j < n && idx[j].v === idx[i].v) j++;
            const avg = (i + 1 + j) / 2;
            for (let k = i; k < j; k++) out[idx[k].i] = avg;
            i = j;
        }
        return out;
    }
    function pearson(xs, ys) {
        const n = xs.length;
        if (n < 2) return { r: NaN, p: NaN, n: n };
        const mx = mean(xs), my = mean(ys);
        let cov = 0, vx = 0, vy = 0;
        for (let i = 0; i < n; i++) {
            const dx = xs[i] - mx, dy = ys[i] - my;
            cov += dx * dy; vx += dx * dx; vy += dy * dy;
        }
        if (vx === 0 || vy === 0) return { r: NaN, p: NaN, n: n };
        const r = cov / Math.sqrt(vx * vy);
        const df = n - 2;
        if (df <= 0) return { r: r, p: NaN, n: n };
        const t = r * Math.sqrt(df / (1 - r * r));
        return { r: r, p: 2 * (1 - SC.tCDF(Math.abs(t), df)), n: n };
    }
    function spearman(xs, ys) {
        if (xs.length < 2) return { r: NaN, p: NaN, n: xs.length };
        return pearson(rank(xs), rank(ys));
    }
    function kendall(xs, ys) {
        const n = xs.length;
        if (n < 2) return { r: NaN, p: NaN, n: n };
        let C = 0, D = 0, tieX = 0, tieY = 0;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const dx = xs[i] - xs[j], dy = ys[i] - ys[j];
                if (dx === 0 && dy === 0) continue;
                if (dx === 0) { tieX++; continue; }
                if (dy === 0) { tieY++; continue; }
                if (dx * dy > 0) C++; else D++;
            }
        }
        const n0 = n * (n - 1) / 2;
        const denom = Math.sqrt((n0 - tieX) * (n0 - tieY));
        const tau = denom ? (C - D) / denom : 0;
        const v = 2 * (2 * n + 5) / (9 * n * (n - 1));
        const z = v > 0 ? tau / Math.sqrt(v) : 0;
        return { r: tau, p: 2 * (1 - SC.normCDF(Math.abs(z))), n: n };
    }
    function calcCorrelation(xs, ys, method) {
        if (method === 'spearman') return spearman(xs, ys);
        if (method === 'kendall') return kendall(xs, ys);
        return pearson(xs, ys);
    }
    function corrMatrix(columns, method) {
        const k = columns.length;
        const rMatrix = [], pMatrix = [];
        for (let i = 0; i < k; i++) {
            rMatrix.push(new Array(k).fill(NaN));
            pMatrix.push(new Array(k).fill(NaN));
        }
        for (let i = 0; i < k; i++) {
            rMatrix[i][i] = 1; pMatrix[i][i] = 0;
            for (let j = i + 1; j < k; j++) {
                const res = calcCorrelation(columns[i].values, columns[j].values, method);
                rMatrix[i][j] = res.r; rMatrix[j][i] = res.r;
                pMatrix[i][j] = res.p; pMatrix[j][i] = res.p;
            }
        }
        return { rMatrix: rMatrix, pMatrix: pMatrix };
    }
    function computeCorrFromRaw(rawData, colNames, method) {
        if (!rawData || !rawData.length || !colNames || colNames.length < 2) return null;
        const columns = [];
        for (let ci = 0; ci < colNames.length; ci++) {
            const name = colNames[ci];
            const values = [];
            for (let ri = 0; ri < rawData.length; ri++) {
                const v = parseFloat(rawData[ri][name]);
                values.push(isFinite(v) ? v : NaN);
            }
            columns.push({ name: name, values: values });
        }
        const validIdx = [];
        for (let i = 0; i < rawData.length; i++) {
            let ok = true;
            for (let k = 0; k < columns.length; k++) {
                if (!isFinite(columns[k].values[i])) { ok = false; break; }
            }
            if (ok) validIdx.push(i);
        }
        if (validIdx.length < 3) return null;
        const cleaned = [];
        for (let ci = 0; ci < columns.length; ci++) {
            const c = columns[ci];
            const vals = [];
            for (let vi = 0; vi < validIdx.length; vi++) vals.push(c.values[validIdx[vi]]);
            cleaned.push({ name: c.name, values: vals });
        }
        const res = corrMatrix(cleaned, method || 'pearson');
        const labels = [];
        for (let ci = 0; ci < cleaned.length; ci++) labels.push(cleaned[ci].name);
        return { labels: labels, rMatrix: res.rMatrix, pMatrix: res.pMatrix, validCount: validIdx.length };
    }
    function parsePValue(v) {
        if (v == null) return null;
        const s = String(v).trim();
        if (s === '') return null;
        if (s.charAt(0) === '<') {
            const n = parseFloat(s.slice(1));
            return isFinite(n) ? n * 0.5 : null;
        }
        if (s.charAt(0) === '>') {
            const n = parseFloat(s.slice(1));
            return isFinite(n) ? n : null;
        }
        const n = parseFloat(s);
        return isFinite(n) ? n : null;
    }
    function computeCorrFromMatrix(rawData, headers, forceMode) {
        if (!rawData || !rawData.length || !headers || headers.length < 3) return null;
        const firstCol = headers[0];
        const varNames = headers.slice(1);
        const n = varNames.length;
        const idxMap = new Map();
        for (let i = 0; i < varNames.length; i++) idxMap.set(varNames[i], i);

        const raw = [];
        for (let i = 0; i < n; i++) raw.push(new Array(n).fill(null));
        for (let ri = 0; ri < rawData.length; ri++) {
            const row = rawData[ri];
            const rowLabel = String(row[firstCol] == null ? '' : row[firstCol]).trim();
            const i = idxMap.get(rowLabel);
            if (i === undefined) continue;
            for (let j = 0; j < n; j++) raw[i][j] = row[varNames[j]];
        }

        let mode = forceMode || 'auto';
        if (mode === 'auto') {
            let symmetric = true;
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const a = String(raw[i][j] == null ? '' : raw[i][j]).trim();
                    const b = String(raw[j][i] == null ? '' : raw[j][i]).trim();
                    if (a !== b) { symmetric = false; break; }
                }
                if (!symmetric) break;
            }
            mode = symmetric ? 'pure' : 'mixed';
        }

        const rMatrix = [], pMatrix = [];
        for (let i = 0; i < n; i++) {
            rMatrix.push(new Array(n).fill(NaN));
            pMatrix.push(new Array(n).fill(NaN));
        }

        if (mode === 'pure') {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const v = parseFloat(raw[i][j]);
                    if (isFinite(v)) rMatrix[i][j] = v;
                }
                pMatrix[i][i] = 0;
            }
        } else {
            for (let i = 0; i < n; i++) { rMatrix[i][i] = 1; pMatrix[i][i] = 0; }
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i === j) continue;
                    if (i > j) {
                        const rv = parseFloat(raw[i][j]);
                        if (isFinite(rv)) { rMatrix[i][j] = rv; rMatrix[j][i] = rv; }
                    } else {
                        const pv = parsePValue(raw[i][j]);
                        if (pv != null) { pMatrix[i][j] = pv; pMatrix[j][i] = pv; }
                    }
                }
            }
        }
        return { labels: varNames, rMatrix: rMatrix, pMatrix: pMatrix, validCount: n, mode: mode };
    }
    function detectMatrixFormat(headers, data) {
        if (!headers || headers.length < 3) return false;
        if (!data || data.length !== headers.length - 1) return false;
        const varNames = headers.slice(1);
        const n = varNames.length;
        const idxMap = new Map();
        for (let i = 0; i < varNames.length; i++) idxMap.set(varNames[i], i);

        let rowMatch = 0;
        for (let ri = 0; ri < data.length; ri++) {
            const rowLabel = String(data[ri][headers[0]] == null ? '' : data[ri][headers[0]]).trim();
            if (idxMap.has(rowLabel)) rowMatch++;
        }
        if (rowMatch !== n) return false;

        let diagOK = 0;
        for (let ri = 0; ri < data.length; ri++) {
            const row = data[ri];
            const rowLabel = String(row[headers[0]] == null ? '' : row[headers[0]]).trim();
            const i = idxMap.get(rowLabel);
            if (i === undefined) continue;
            const v = parseFloat(row[varNames[i]]);
            if (isFinite(v) && Math.abs(v - 1) < 0.01) diagOK++;
        }
        return diagOK === n;
    }

    function pToStars(p) {
        if (!isFinite(p)) return '';
        if (p < 0.001) return '***';
        if (p < 0.01) return '**';
        if (p < 0.05) return '*';
        return 'ns';
    }
    function formatP(p) {
        if (!isFinite(p)) return 'NA';
        if (p < 0.001) return '<0.001';
        return p.toFixed(3);
    }
    /* 支持小数位数参数，默认 2 */
    function formatR(r, decimals) {
        if (!isFinite(r)) return 'NA';
        const dec = (decimals != null && isFinite(decimals)) ? Math.max(0, Math.min(6, decimals)) : 2;
        return r.toFixed(dec);
    }
    function sigColor(p) {
        if (!isFinite(p)) return '#f0f0f0';
        if (p < 0.001) return '#d73027';
        if (p < 0.01) return '#fc8d59';
        if (p < 0.05) return '#fee090';
        return '#f0f0f0';
    }
    function textColorOn(bg) {
        if (!bg || bg === 'none' || bg === 'transparent') return '#333';
        let h = String(bg).replace('#', '');
        if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
        const n = parseInt(h, 16);
        if (!isFinite(n)) return '#333';
        const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        return (0.299 * r + 0.587 * g + 0.114 * b) > 165 ? '#333' : '#fff';
    }

    function renderCorrTable(container, opts) {
        if (!container) return;
        opts = opts || {};
        const labels = opts.labels, rMatrix = opts.rMatrix, pMatrix = opts.pMatrix;
        const dec = opts.decimals != null ? opts.decimals : 2;
        const esc = (global.PlotCommon && PlotCommon.escapeHtml) || String;
        if (!rMatrix) {
            const L = (global.PlotCommon && PlotCommon.L) ? PlotCommon.L() : null;
            const defaultText = (L && L.corrEmpty) ? L.corrEmpty : '选择至少2个数值列后将在此处显示相关性系数表';
            container.innerHTML = '<div class="empty-tip">' + (opts.emptyText || defaultText) + '</div>';
            return;
        }
        function fmtR(v) { return isFinite(v) ? v.toFixed(dec) : 'NA'; }
        function fmtP(v) {
            if (!isFinite(v)) return 'NA';
            if (v < 0.001) return '<0.001';
            return v.toFixed(dec);
        }
        const n = labels.length;
        let html = '<table><thead><tr><th></th>';
        for (let i = 0; i < n; i++) html += '<th>' + esc(labels[i]) + '</th>';
        html += '</tr></thead><tbody>';
        for (let i = 0; i < n; i++) {
            html += '<tr><th style="background:#f5f7fa;text-align:center;font-weight:600;color:#1f4068;">' + esc(labels[i]) + '</th>';
            for (let j = 0; j < n; j++) {
                let cell;
                if (i === j) cell = '1';
                else if (i > j) cell = fmtR(rMatrix[i][j]);
                else cell = fmtP(pMatrix[i][j]);
                html += '<td>' + cell + '</td>';
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    function exportCorrTableCsv(opts) {
        opts = opts || {};
        const labels = opts.labels, rMatrix = opts.rMatrix, pMatrix = opts.pMatrix;
        const dec = opts.decimals != null ? opts.decimals : 2;
        if (!rMatrix) return;
        function esc(v) {
            const s = String(v);
            if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
            return s;
        }
        function fmtR(v) { return isFinite(v) ? v.toFixed(dec) : 'NA'; }
        function fmtP(v) {
            if (!isFinite(v)) return 'NA';
            if (v < 0.001) return '<0.001';
            return v.toFixed(dec);
        }
        const n = labels.length;
        const rows = [];
        rows.push([''].concat(labels).map(esc).join(','));
        for (let i = 0; i < n; i++) {
            const row = [labels[i]];
            for (let j = 0; j < n; j++) {
                if (i === j) row.push('1');
                else if (i > j) row.push(fmtR(rMatrix[i][j]));
                else row.push(fmtP(pMatrix[i][j]));
            }
            rows.push(row.map(esc).join(','));
        }
        const csv = '\uFEFF' + rows.join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = opts.filename || 'correlation_table.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function resolveCustomColors(state) {
        let arr;
        if (state.paletteMode === 'custom2') arr = [state.custom2Low, state.custom2High];
        else arr = [state.custom3Low, state.custom3Mid, state.custom3High];
        if (state.reverseColors) arr = arr.slice().reverse();
        return arr;
    }
    function resolveLegendStops(state) {
        if (state.paletteMode === 'preset') {
            return global.ContinuousPalette.getStops(state.paletteName, 11, state.reverseColors);
        }
        return resolveCustomColors(state);
    }
    function resolveLegendGradient(state) {
        return 'linear-gradient(to right, ' + resolveLegendStops(state).join(',') + ')';
    }
    function computeDataRange(rMatrix, dataKind) {
        if (dataKind === 'correlation') return { min: -1, max: 1 };
        let mn = Infinity, mx = -Infinity;
        for (let i = 0; i < rMatrix.length; i++) {
            for (let j = 0; j < rMatrix[i].length; j++) {
                const v = rMatrix[i][j];
                if (!isFinite(v)) continue;
                if (v < mn) mn = v;
                if (v > mx) mx = v;
            }
        }
        if (!isFinite(mn) || !isFinite(mx)) { mn = -1; mx = 1; }
        return { min: Math.min(mn, -0.01), max: Math.max(mx, 0.01) };
    }
    function resolveColorScale(state, range) {
        if (state.paletteMode === 'preset') {
            return global.ContinuousPalette.getColorScale(state.paletteName, range.min, range.max, state.reverseColors);
        }
        const colors = resolveCustomColors(state);
        if (colors.length === 2) return d3.scaleLinear().domain([range.min, range.max]).range(colors).clamp(true);
        const mid = (range.min + range.max) / 2;
        return d3.scaleLinear().domain([range.min, mid, range.max]).range(colors).clamp(true);
    }
    function updateColorPreview(app, state) {
        const grad = resolveLegendGradient(state);
        let el;
        if (state.paletteMode === 'preset') el = app.$('colorPreview');
        else if (state.paletteMode === 'custom2') el = app.$('custom2Preview');
        else el = app.$('custom3Preview');        
        if (el) el.style.background = grad;
    }

    function defaultDisplay() {
        return {
            format: 'BL_TR',
            areas: {
                A: { colorBlock: 'corr', mark: 'stars', markColorMode: 'custom', markColor: '#ffffff' },
                B: { colorBlock: 'none', mark: 'value', markColorMode: 'same-corr', markColor: '#333333' }
            },
            cell: {
                sizeMode: 'uniform',
                baseSize: 50,
                shape: 'square',
                shapeStrokeW: 0,
                shapeStrokeColor: '#ffffff',
                cellStrokeW: 1,
                cellStrokeColor: '#858585',
                markFontSize: 12,
                markDecimals: 3,
                markBold: false,
                markItalic: false
            },
            thresholds: { absR: '', pValue: '' },
            diag: {
                fill: '#f7f7f7',
                showGrid: true,
                showText: true,
                fontSize: 12,
                bold: false,
                italic: false,
                color: '#b93c3c'
            },
            labels: {
                showTop: true, showBottom: false,
                showLeft: true, showRight: false,
                rotTop: -45, rotBottom: -45, rotLeft: 0, rotRight: 0,
                fontSize: 12, bold: true, italic: false
            },
            orderText: ''
        };
    }

    function escapeAttr(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    let panelStyleInjected = false;
    function injectPanelStyle() {
        if (panelStyleInjected) return;
        panelStyleInjected = true;
        const s = document.createElement('style');
        s.id = 'heatmap-panel-style';
        s.textContent = '.hm-subsection{font-size:13px;font-weight:700;color:#1f4068;margin:14px 0 8px 0;padding-bottom:3px;border-bottom:1px solid #e3ebf3;letter-spacing:0.02em;}'
            + '.hm-subsection:first-child{margin-top:0;}';
        document.head.appendChild(s);
    }

    function renderDisplayPanel(containerOrId, display) {
        const c = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
        if (!c) return;
        injectPanelStyle();
        display = display || defaultDisplay();
        const d = display;
        const cs = d.cell, lb = d.labels, dg = d.diag, th = d.thresholds;
        const aA = d.areas.A, aB = d.areas.B;
        const t = T();
        const markDec = (cs.markDecimals != null) ? cs.markDecimals : 3;

        const absRVal = (th.absR === '' || th.absR == null) ? '' : th.absR;
        const pVal = (th.pValue === '' || th.pValue == null) ? '' : th.pValue;

        function markColorOptions(cur) {
            return ''
                + '<option value="same-corr" ' + (cur === 'same-corr' ? 'selected' : '') + '>' + t.sameAsCorrFill + '</option>'
                + '<option value="same-sig" ' + (cur === 'same-sig' ? 'selected' : '') + '>' + t.sameAsSigFill + '</option>'
                + '<option value="custom" ' + (cur === 'custom' ? 'selected' : '') + '>' + t.colorCustom + '</option>';
        }

        c.innerHTML = ''
            + '<div class="hm-subsection">' + t.secFormat + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item" style="grid-column: span 2;">'
            + '    <label>' + t.diagDir + '</label>'
            + '    <select class="hd-format">'
            + '      <option value="BL_TR" ' + (d.format === 'BL_TR' ? 'selected' : '') + '>' + t.fmtBLTR + '</option>'
            + '      <option value="TL_BR" ' + (d.format === 'TL_BR' ? 'selected' : '') + '>' + t.fmtTLBR + '</option>'
            + '    </select>'
            + '  </div>'
            + '</div>'

            + '<div class="hm-subsection">' + t.secA + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label>' + t.colorBlock + '</label>'
            + '    <select class="hd-a-color">'
            + '      <option value="none" ' + (aA.colorBlock === 'none' ? 'selected' : '') + '>' + t.none + '</option>'
            + '      <option value="corr" ' + (aA.colorBlock === 'corr' ? 'selected' : '') + '>' + t.corr + '</option>'
            + '      <option value="sig" ' + (aA.colorBlock === 'sig' ? 'selected' : '') + '>' + t.sig + '</option>'
            + '    </select>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.markLabel + '</label>'
            + '    <select class="hd-a-mark">'
            + '      <option value="none" ' + (aA.mark === 'none' ? 'selected' : '') + '>' + t.none + '</option>'
            + '      <option value="value" ' + (aA.mark === 'value' ? 'selected' : '') + '>' + t.valR + '</option>'
            + '      <option value="stars" ' + (aA.mark === 'stars' ? 'selected' : '') + '>' + t.valStars + '</option>'
            + '      <option value="p" ' + (aA.mark === 'p' ? 'selected' : '') + '>' + t.valP + '</option>'
            + '    </select>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.textColor + '</label>'
            + '    <select class="hd-a-mark-color-mode">' + markColorOptions(aA.markColorMode) + '</select>'
            + '  </div>'
            + '  <div class="param-item hd-a-mark-color-item" style="' + (aA.markColorMode === 'custom' ? '' : 'display:none;') + '">'
            + '    <label>' + t.customColor + '</label>'
            + '    <input type="color" class="hd-a-mark-color" value="' + aA.markColor + '">'
            + '  </div>'
            + '</div>'

            + '<div class="hm-subsection">' + t.secB + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label>' + t.colorBlock + '</label>'
            + '    <select class="hd-b-color">'
            + '      <option value="none" ' + (aB.colorBlock === 'none' ? 'selected' : '') + '>' + t.none + '</option>'
            + '      <option value="corr" ' + (aB.colorBlock === 'corr' ? 'selected' : '') + '>' + t.corr + '</option>'
            + '      <option value="sig" ' + (aB.colorBlock === 'sig' ? 'selected' : '') + '>' + t.sig + '</option>'
            + '    </select>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.markLabel + '</label>'
            + '    <select class="hd-b-mark">'
            + '      <option value="none" ' + (aB.mark === 'none' ? 'selected' : '') + '>' + t.none + '</option>'
            + '      <option value="value" ' + (aB.mark === 'value' ? 'selected' : '') + '>' + t.valR + '</option>'
            + '      <option value="stars" ' + (aB.mark === 'stars' ? 'selected' : '') + '>' + t.valStars + '</option>'
            + '      <option value="p" ' + (aB.mark === 'p' ? 'selected' : '') + '>' + t.valP + '</option>'
            + '    </select>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.textColor + '</label>'
            + '    <select class="hd-b-mark-color-mode">' + markColorOptions(aB.markColorMode) + '</select>'
            + '  </div>'
            + '  <div class="param-item hd-b-mark-color-item" style="' + (aB.markColorMode === 'custom' ? '' : 'display:none;') + '">'
            + '    <label>' + t.customColor + '</label>'
            + '    <input type="color" class="hd-b-mark-color" value="' + aB.markColor + '">'
            + '  </div>'
            + '</div>'

            + '<div class="hm-subsection">' + t.secCell + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label>' + t.sizeMode + '</label>'
            + '    <select class="hd-size-mode">'
            + '      <option value="uniform" ' + (cs.sizeMode === 'uniform' ? 'selected' : '') + '>' + t.sizeUniform + '</option>'
            + '      <option value="byCorr" ' + (cs.sizeMode === 'byCorr' ? 'selected' : '') + '>' + t.sizeByCorr + '</option>'
            + '    </select>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.shape + '</label>'
            + '    <select class="hd-shape">'
            + '      <option value="square" ' + (cs.shape === 'square' ? 'selected' : '') + '>' + t.square + '</option>'
            + '      <option value="circle" ' + (cs.shape === 'circle' ? 'selected' : '') + '>' + t.circle + '</option>'
            + '    </select>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.shapeStrokeW + '</label>'
            + '    <input type="number" class="hd-shape-stroke-w" value="' + cs.shapeStrokeW + '" min="0" max="10" step="0.5">'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.shapeStrokeC + '</label>'
            + '    <input type="color" class="hd-shape-stroke-c" value="' + cs.shapeStrokeColor + '">'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.cellStrokeW + '</label>'
            + '    <input type="number" class="hd-cell-stroke-w" value="' + cs.cellStrokeW + '" min="0" max="10" step="0.5">'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.cellStrokeC + '</label>'
            + '    <input type="color" class="hd-cell-stroke-c" value="' + cs.cellStrokeColor + '">'
            + '  </div>'
            + '</div>'

            + '<div class="hm-subsection">' + t.secMark + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label>' + t.fontSize + '</label>'
            + '    <input type="number" class="hd-mark-fs" value="' + cs.markFontSize + '" min="6" max="36" step="1">'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.decimals + '</label>'
            + '    <input type="number" class="hd-mark-dec" value="' + markDec + '" min="0" max="6" step="1">'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="hd-mark-b" ' + (cs.markBold ? 'checked' : '') + '> ' + t.bold + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="hd-mark-i" ' + (cs.markItalic ? 'checked' : '') + '> ' + t.italic + '</label>'
            + '  </div>'
            + '</div>'

            + '<div class="hm-subsection">' + t.secTh + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item" style="grid-column: span 2;">'
            + '    <label>' + t.thAbsR + '</label>'
            + '    <input type="number" class="hd-th-absr" value="' + escapeAttr(absRVal) + '" step="0.01" min="0" max="1" placeholder="' + escapeAttr(t.phEmpty) + '">'
            + '  </div>'
            + '  <div class="param-item" style="grid-column: span 2;">'
            + '    <label>' + t.thP + '</label>'
            + '    <input type="number" class="hd-th-p" value="' + escapeAttr(pVal) + '" step="0.001" min="0" max="1" placeholder="' + escapeAttr(t.phEmpty) + '">'
            + '  </div>'
            + '</div>'
            + '<div style="font-size:11px;color:#999;margin-top:-4px;">' + t.thHint + '</div>'

            + '<div class="hm-subsection">' + t.secDiag + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="hd-diag-grid" ' + (dg.showGrid !== false ? 'checked' : '') + '> ' + t.showGrid + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="hd-diag-text" ' + (dg.showText !== false ? 'checked' : '') + '> ' + t.showText + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.diagFill + '</label>'
            + '    <input type="color" class="hd-diag-fill" value="' + (dg.fill || '#f7f7f7') + '">'
            + '  </div>'
            + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label>' + t.fontSize + '</label>'
            + '    <input type="number" class="hd-diag-fs" value="' + dg.fontSize + '" min="6" max="36" step="1">'
            + '  </div>'
+ '  <div class="param-item">'
+ '    <label>' + t.textColor + '</label>'
+ '    <input type="color" class="hd-diag-color" value="' + dg.color + '">'
+ '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="hd-diag-b" ' + (dg.bold ? 'checked' : '') + '> ' + t.bold + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="hd-diag-i" ' + (dg.italic ? 'checked' : '') + '> ' + t.italic + '</label>'
            + '  </div>'
            + '</div>'

            + '<div class="hm-subsection">' + t.secLab + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="hd-lab-top" ' + (lb.showTop ? 'checked' : '') + '> ' + t.top + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="hd-lab-bottom" ' + (lb.showBottom ? 'checked' : '') + '> ' + t.bottom + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="hd-lab-left" ' + (lb.showLeft ? 'checked' : '') + '> ' + t.left + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="hd-lab-right" ' + (lb.showRight ? 'checked' : '') + '> ' + t.right + '</label>'
            + '  </div>'
            + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label>' + t.rotTop + '</label>'
            + '    <input type="number" class="hd-rot-top" value="' + lb.rotTop + '" min="-90" max="90" step="1"></div>'
            + '  <div class="param-item"><label>' + t.rotBottom + '</label>'
            + '    <input type="number" class="hd-rot-bottom" value="' + lb.rotBottom + '" min="-90" max="90" step="1"></div>'
            + '  <div class="param-item"><label>' + t.rotLeft + '</label>'
            + '    <input type="number" class="hd-rot-left" value="' + lb.rotLeft + '" min="-90" max="90" step="1"></div>'
            + '  <div class="param-item"><label>' + t.rotRight + '</label>'
            + '    <input type="number" class="hd-rot-right" value="' + lb.rotRight + '" min="-90" max="90" step="1"></div>'
            + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label>' + t.fontSize + '</label>'
            + '    <input type="number" class="hd-lab-fs" value="' + lb.fontSize + '" min="6" max="36" step="1"></div>'
            + '  <div class="param-item"><label class="mini-check"><input type="checkbox" class="hd-lab-b" ' + (lb.bold ? 'checked' : '') + '> ' + t.bold + '</label></div>'
            + '  <div class="param-item"><label class="mini-check"><input type="checkbox" class="hd-lab-i" ' + (lb.italic ? 'checked' : '') + '> ' + t.italic + '</label></div>'
            + '</div>'

            + '<div class="hm-subsection">' + t.secOrder + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item" style="grid-column: span 4;">'
            + '    <label>' + t.orderLabel + '</label>'
            + '    <input type="text" class="hd-order-text" value="' + escapeAttr(d.orderText) + '" placeholder="' + escapeAttr(t.orderPlaceholder) + '" style="flex:1;min-width:240px;">'
            + '  </div>'
            + '</div>';

        const aColorModeSel = c.querySelector('.hd-a-mark-color-mode');
        const aColorItem = c.querySelector('.hd-a-mark-color-item');
        if (aColorModeSel && aColorItem) {
            aColorModeSel.addEventListener('change', function () {
                aColorItem.style.display = (this.value === 'custom') ? '' : 'none';
            });
        }
        const bColorModeSel = c.querySelector('.hd-b-mark-color-mode');
        const bColorItem = c.querySelector('.hd-b-mark-color-item');
        if (bColorModeSel && bColorItem) {
            bColorModeSel.addEventListener('change', function () {
                bColorItem.style.display = (this.value === 'custom') ? '' : 'none';
            });
        }
    }

    function syncDisplayFromDom(containerOrId, display) {
        const c = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
        if (!c) return display;
        const q = function (s) { return c.querySelector(s); };
        const val = function (s, fb) { const e = q(s); return e ? e.value : fb; };
        const chk = function (s, fb) { const e = q(s); return e ? e.checked : fb; };
        const num = function (s, fb) {
            const e = q(s);
            if (!e) return fb;
            const v = parseFloat(e.value);
            return isFinite(v) ? v : fb;
        };
        const int = function (s, fb) {
            const e = q(s);
            if (!e) return fb;
            const v = parseInt(e.value, 10);
            return isFinite(v) ? v : fb;
        };
        const optNum = function (s) {
            const e = q(s);
            if (!e) return '';
            const raw = String(e.value).trim();
            if (raw === '') return '';
            const v = parseFloat(raw);
            return isFinite(v) ? v : '';
        };

        display.format = val('.hd-format', display.format);
        display.areas.A.colorBlock = val('.hd-a-color', display.areas.A.colorBlock);
        display.areas.A.mark = val('.hd-a-mark', display.areas.A.mark);
        display.areas.A.markColorMode = val('.hd-a-mark-color-mode', display.areas.A.markColorMode || 'same-corr');
        display.areas.A.markColor = val('.hd-a-mark-color', display.areas.A.markColor || '#333333');
        display.areas.B.colorBlock = val('.hd-b-color', display.areas.B.colorBlock);
        display.areas.B.mark = val('.hd-b-mark', display.areas.B.mark);
        display.areas.B.markColorMode = val('.hd-b-mark-color-mode', display.areas.B.markColorMode || 'same-corr');
        display.areas.B.markColor = val('.hd-b-mark-color', display.areas.B.markColor || '#333333');

        const cs = display.cell;
        cs.sizeMode = val('.hd-size-mode', cs.sizeMode);
        cs.shape = val('.hd-shape', cs.shape);
        cs.shapeStrokeW = Math.max(0, num('.hd-shape-stroke-w', cs.shapeStrokeW));
        cs.shapeStrokeColor = val('.hd-shape-stroke-c', cs.shapeStrokeColor);
        cs.cellStrokeW = Math.max(0, num('.hd-cell-stroke-w', cs.cellStrokeW));
        cs.cellStrokeColor = val('.hd-cell-stroke-c', cs.cellStrokeColor);
        cs.markFontSize = Math.max(6, num('.hd-mark-fs', cs.markFontSize));
        cs.markDecimals = Math.max(0, Math.min(6, int('.hd-mark-dec', cs.markDecimals != null ? cs.markDecimals : 3)));
        cs.markBold = chk('.hd-mark-b', cs.markBold);
        cs.markItalic = chk('.hd-mark-i', cs.markItalic);

        display.thresholds.absR = optNum('.hd-th-absr');
        display.thresholds.pValue = optNum('.hd-th-p');

        const dg = display.diag;
        dg.showGrid = chk('.hd-diag-grid', dg.showGrid !== false);
        dg.showText = chk('.hd-diag-text', dg.showText !== false);
        dg.fill = val('.hd-diag-fill', dg.fill || '#f7f7f7');
        dg.fontSize = Math.max(6, num('.hd-diag-fs', dg.fontSize));
        dg.color = val('.hd-diag-color', dg.color);
        dg.bold = chk('.hd-diag-b', dg.bold);
        dg.italic = chk('.hd-diag-i', dg.italic);

        const lb = display.labels;
        lb.showTop = chk('.hd-lab-top', lb.showTop);
        lb.showBottom = chk('.hd-lab-bottom', lb.showBottom);
        lb.showLeft = chk('.hd-lab-left', lb.showLeft);
        lb.showRight = chk('.hd-lab-right', lb.showRight);
        lb.rotTop = num('.hd-rot-top', lb.rotTop);
        lb.rotBottom = num('.hd-rot-bottom', lb.rotBottom);
        lb.rotLeft = num('.hd-rot-left', lb.rotLeft);
        lb.rotRight = num('.hd-rot-right', lb.rotRight);
        lb.fontSize = Math.max(6, num('.hd-lab-fs', lb.fontSize));
        lb.bold = chk('.hd-lab-b', lb.bold);
        lb.italic = chk('.hd-lab-i', lb.italic);

        display.orderText = val('.hd-order-text', display.orderText);
        return display;
    }

    function bindDisplayPanel(containerOrId, display, onChange) {
        const c = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
        if (!c) return;
        const fire = function () {
            syncDisplayFromDom(c, display);
            if (onChange) onChange(display);
        };
        const inputs = c.querySelectorAll('input, select');
        for (let i = 0; i < inputs.length; i++) {
            const el = inputs[i];
            el.addEventListener('change', fire);
            if (el.type === 'text' || el.type === 'number') {
                el.addEventListener('input', fire);
            }
        }
    }

    function applyOrder(labels, rMatrix, pMatrix, orderText) {
        if (!orderText || !orderText.trim()) return { labels: labels, rMatrix: rMatrix, pMatrix: pMatrix };
        const wanted = String(orderText).split(/[,，\s]+/).filter(Boolean);
        const idxMap = new Map();
        for (let i = 0; i < labels.length; i++) idxMap.set(labels[i], i);

        const order = [];
        const used = new Set();
        for (let wi = 0; wi < wanted.length; wi++) {
            const w = wanted[wi];
            if (idxMap.has(w)) {
                const i = idxMap.get(w);
                if (!used.has(i)) { order.push(i); used.add(i); }
            }
        }
        for (let i = 0; i < labels.length; i++) {
            if (!used.has(i)) order.push(i);
        }

        const newLabels = [], newR = [], newP = [];
        for (let oi = 0; oi < order.length; oi++) {
            const i = order[oi];
            newLabels.push(labels[i]);
            const rRow = [], pRow = [];
            for (let oj = 0; oj < order.length; oj++) {
                const j = order[oj];
                rRow.push(rMatrix[i][j]);
                pRow.push(pMatrix[i][j]);
            }
            newR.push(rRow);
            newP.push(pRow);
        }
        return { labels: newLabels, rMatrix: newR, pMatrix: newP };
    }

    function applyTLBRReverse(labels, rMatrix, pMatrix, format) {
        if (format !== 'TL_BR') return { labels: labels, rMatrix: rMatrix, pMatrix: pMatrix };
        const n = labels.length;
        const colOrder = [];
        for (let j = n - 1; j >= 0; j--) colOrder.push(j);
        const newLabels = [], newR = [], newP = [];
        for (let cj = 0; cj < colOrder.length; cj++) newLabels.push(labels[colOrder[cj]]);
        for (let i = 0; i < n; i++) {
            const rRow = [], pRow = [];
            for (let cj = 0; cj < colOrder.length; cj++) {
                const j = colOrder[cj];
                rRow.push(rMatrix[i][j]);
                pRow.push(pMatrix[i][j]);
            }
            newR.push(rRow);
            newP.push(pRow);
        }
        return { labels: newLabels, rMatrix: newR, pMatrix: newP };
    }

    function drawHeatmap(root, opts) {
        opts = opts || {};
        const display = opts.display || defaultDisplay();
        const labels = opts.labels || [];
        const rMatrix = opts.rMatrix || [];
        const pMatrix = opts.pMatrix || [];
        const colorScale = opts.colorScale;
        const offset = opts.offset || { x: 0, y: 0 };
        const n = labels.length;
        if (!n) return;

        const d = display;
        const cs = d.cell;
        const lb = d.labels;
        const dg = d.diag;
        const areas = d.areas;
        const format = d.format;
        const th = d.thresholds || {};
        const markDec = (cs.markDecimals != null) ? cs.markDecimals : 3;

        const cellW = cs.baseSize;
        const cellH = cs.baseSize;

        function isDiag(i, j) {
            if (format === 'BL_TR') return i === j;
            return i + j === n - 1;
        }
        function areaOf(i, j) {
            if (isDiag(i, j)) return 'diag';
            if (format === 'BL_TR') return i > j ? 'A' : 'B';
            return (i + j) < (n - 1) ? 'A' : 'B';
        }
        const cfgOf = function (area) { return area === 'A' ? areas.A : areas.B; };

        function isAreaEmpty(area) {
            if (area === 'diag') return false;
            const cfg = cfgOf(area);
            return cfg.colorBlock === 'none' && cfg.mark === 'none';
        }

        const absTh = (th.absR === '' || th.absR == null) ? null : parseFloat(th.absR);
        const pTh = (th.pValue === '' || th.pValue == null) ? null : parseFloat(th.pValue);
        const hasAbs = absTh != null && isFinite(absTh);
        const hasP = pTh != null && isFinite(pTh);

        function shouldShowMark(i, j) {
            if (!hasAbs && !hasP) return true;
            const r = rMatrix[i][j];
            const p = pMatrix[i][j];
            const absR = isFinite(r) ? Math.abs(r) : 0;
            const pOK = isFinite(p) && p <= pTh;
            const rOK = absR >= absTh;
            if (hasAbs && hasP) return rOK || pOK;
            if (hasAbs) return rOK;
            return pOK;
        }

        const fillOf = function (i, j) {
            const area = areaOf(i, j);
            if (area === 'diag') return dg.fill || '#f7f7f7';
            const cfg = cfgOf(area);
            if (cfg.colorBlock === 'none') return 'transparent';
            const r = rMatrix[i][j], p = pMatrix[i][j];
            if (cfg.colorBlock === 'corr') return isFinite(r) ? (colorScale ? colorScale(r) : '#cccccc') : '#f0f0f0';
            return sigColor(p);
        };
        const textOf = function (i, j) {
            const area = areaOf(i, j);
            if (area === 'diag') return '';
            const cfg = cfgOf(area);
            if (cfg.mark === 'none') return '';
            if (!shouldShowMark(i, j)) return '';
            const r = rMatrix[i][j], p = pMatrix[i][j];
            if (cfg.mark === 'value') return formatR(r, markDec);
            if (cfg.mark === 'stars') return pToStars(p);
            if (cfg.mark === 'p') return formatP(p);
            return '';
        };

        const markColorOf = function (i, j) {
            const area = areaOf(i, j);
            const cfg = cfgOf(area);
            const mode = cfg.markColorMode || 'same-corr';
            if (mode === 'custom') return cfg.markColor || '#333';
            if (mode === 'same-sig') {
                const p = pMatrix[i][j];
                return sigColor(p);
            }
            const r = rMatrix[i][j];
            return isFinite(r) ? (colorScale ? colorScale(r) : '#cccccc') : '#f0f0f0';
        };

        const gCells = root.append('g').attr('class', 'hm-cells');

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const x = offset.x + j * cellW;
                const y = offset.y + i * cellH;
                const area = areaOf(i, j);
                const isDiagCell = (area === 'diag');

                if (!isDiagCell && isAreaEmpty(area)) continue;

                const hideDiagGrid = isDiagCell && dg.showGrid === false;
                const strokeW = hideDiagGrid ? 0 : cs.cellStrokeW;

                gCells.append('rect')
                    .attr('x', x).attr('y', y)
                    .attr('width', cellW).attr('height', cellH)
                    .attr('fill', isDiagCell ? (dg.fill || '#f7f7f7') : '#ffffff')
                    .attr('stroke', strokeW > 0 ? cs.cellStrokeColor : 'none')
                    .attr('stroke-width', strokeW);

                if (!isDiagCell) {
                    const fillColor = fillOf(i, j);
                    const r = rMatrix[i][j];
                    const absR = isFinite(r) ? Math.abs(r) : 0;
                    let sizeFactor = 1;
                    if (cs.sizeMode === 'byCorr') {
                        sizeFactor = Math.max(0.15, Math.min(1, absR));
                    }
                    const shapeSize = Math.min(cellW, cellH) * sizeFactor;
                    const cx = x + cellW / 2;
                    const cy = y + cellH / 2;

                    if (fillColor && fillColor !== 'transparent') {
                        if (cs.shape === 'circle') {
                            gCells.append('circle')
                                .attr('cx', cx).attr('cy', cy)
                                .attr('r', shapeSize / 2)
                                .attr('fill', fillColor)
                                .attr('stroke', cs.shapeStrokeW > 0 ? cs.shapeStrokeColor : 'none')
                                .attr('stroke-width', cs.shapeStrokeW);
                        } else {
                            gCells.append('rect')
                                .attr('x', cx - shapeSize / 2).attr('y', cy - shapeSize / 2)
                                .attr('width', shapeSize).attr('height', shapeSize)
                                .attr('fill', fillColor)
                                .attr('stroke', cs.shapeStrokeW > 0 ? cs.shapeStrokeColor : 'none')
                                .attr('stroke-width', cs.shapeStrokeW);
                        }
                    }
                }

                if (isDiagCell) {
                    if (dg.showText !== false) {
                        const txt = labels[i] || '';
                        const maxChars = Math.max(2, Math.floor(cellW / (dg.fontSize * 0.6)));
                        const showTxt = txt.length > maxChars ? txt.slice(0, maxChars) + '…' : txt;
                        gCells.append('text')
                            .attr('x', x + cellW / 2)
                            .attr('y', y + cellH / 2)
                            .attr('text-anchor', 'middle')
                            .attr('dominant-baseline', 'middle')
                            .attr('font-size', dg.fontSize)
                            .attr('font-weight', dg.bold ? 'bold' : 'normal')
                            .attr('font-style', dg.italic ? 'italic' : 'normal')
                            .attr('fill', dg.color)
                            .text(showTxt);
                    }
                } else {
                    const txt = textOf(i, j);
                    if (txt) {
                        gCells.append('text')
                            .attr('x', x + cellW / 2)
                            .attr('y', y + cellH / 2)
                            .attr('text-anchor', 'middle')
                            .attr('dominant-baseline', 'middle')
                            .attr('font-size', cs.markFontSize)
                            .attr('font-weight', cs.markBold ? 'bold' : 'normal')
                            .attr('font-style', cs.markItalic ? 'italic' : 'normal')
                            .attr('fill', markColorOf(i, j))
                            .text(txt);
                    }
                }
            }
        }

        const gLab = root.append('g').attr('class', 'hm-labels');
        const fs = lb.fontSize;
        const fw = lb.bold ? 'bold' : 'normal';
        const fst = lb.italic ? 'italic' : 'normal';

        for (let i = 0; i < n; i++) {
            const yCenter = offset.y + i * cellH + cellH / 2;
            if (lb.showLeft) {
                const cx = offset.x - 6;
                const cy = yCenter;
                const t = gLab.append('text')
                    .attr('x', cx).attr('y', cy)
                    .attr('text-anchor', 'end')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', fs).attr('font-weight', fw).attr('font-style', fst)
                    .attr('fill', '#333')
                    .text(labels[i]);
                if (lb.rotLeft) t.attr('transform', 'rotate(' + lb.rotLeft + ',' + cx + ',' + cy + ')');
            }
            if (lb.showRight) {
                const cx = offset.x + n * cellW + 6;
                const cy = yCenter;
                const t = gLab.append('text')
                    .attr('x', cx).attr('y', cy)
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', fs).attr('font-weight', fw).attr('font-style', fst)
                    .attr('fill', '#333')
                    .text(labels[i]);
                if (lb.rotRight) t.attr('transform', 'rotate(' + lb.rotRight + ',' + cx + ',' + cy + ')');
            }
        }
        for (let j = 0; j < n; j++) {
            const xCenter = offset.x + j * cellW + cellW / 2;
            if (lb.showTop) {
                const cx = xCenter;
                const cy = offset.y - 6;
                const t = gLab.append('text')
                    .attr('x', cx).attr('y', cy)
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', fs).attr('font-weight', fw).attr('font-style', fst)
                    .attr('fill', '#333')
                    .text(labels[j]);
                if (lb.rotTop) t.attr('transform', 'rotate(' + lb.rotTop + ',' + cx + ',' + cy + ')');
            }
            if (lb.showBottom) {
                const cx = xCenter;
                const cy = offset.y + n * cellH + 6;
                const t = gLab.append('text')
                    .attr('x', cx).attr('y', cy)
                    .attr('text-anchor', 'end')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', fs).attr('font-weight', fw).attr('font-style', fst)
                    .attr('fill', '#333')
                    .text(labels[j]);
                if (lb.rotBottom) t.attr('transform', 'rotate(' + lb.rotBottom + ',' + cx + ',' + cy + ')');
            }
        }
    }

    function drawCorrHeatmap(svg, opts) {
        opts = opts || {};
        const state = opts.state;
        const cbCfg = state.colorBar;
        const display = state.display || defaultDisplay();
        const labels = opts.labels;
        const rMatrix = opts.rMatrix;
        const pMatrix = opts.pMatrix;
        const width = opts.width;
        const padLeft = opts.padLeft != null ? opts.padLeft : 140;
        const padTop = opts.padTop != null ? opts.padTop : 120;
        const dataKind = opts.dataKind || 'correlation';

        const dataRange = computeDataRange(rMatrix, dataKind);
        const range = global.ColorBarSettings.resolveRange(cbCfg, dataRange.min, dataRange.max);
        const ticks = global.ColorBarSettings.resolveTicks(cbCfg, range.min, range.max);
        const colorScale = resolveColorScale(state, range);

        drawHeatmap(svg, {
            display: display,
            labels: labels,
            rMatrix: rMatrix,
            pMatrix: pMatrix,
            colorScale: colorScale,
            offset: { x: padLeft, y: padTop }
        });

        if (cbCfg.show) {
            const isH = cbCfg.orientation === 'horizontal';
            const thickness = cbCfg.thickness || 16;
            let cbX, cbY;
            if (isH) {
                cbX = padLeft;
                cbY = padTop + labels.length * display.cell.baseSize + 40;
            } else {
                const heatmapRight = padLeft + labels.length * display.cell.baseSize;
                cbX = Math.min(heatmapRight + 20, width - thickness - 40);
                cbY = padTop;
            }
            global.ContinuousPalette.drawColorBar(svg, {
                cfg: cbCfg,
                x: cbX, y: cbY,
                stops: resolveLegendStops(state),
                min: range.min, max: range.max, ticks: ticks,
                onScaleChange: opts.onScaleChange
            });
        }
    }

    function refreshCorrHeatmap(app, state) {
        const s = app.state;
        const display = state.display || defaultDisplay();

        function emptyView(msg) {
            state.labels = [];
            state.rMatrix = null;
            state.pMatrix = null;
            renderCorrTable(app.$('corrTableWrap'), { labels: [], rMatrix: null, pMatrix: null, decimals: state.tableDecimals });
            const btn = app.$('exportTableBtn');
            if (btn) btn.disabled = true;
            const box = app.$('chartPreview');
            if (box) box.innerHTML = '<div class="placeholder">' + msg + '</div>';
            if (app.exportSvgBtn) app.exportSvgBtn.disabled = true;
            if (app.exportPngBtn) app.exportPngBtn.disabled = true;
        }
        const L = (global.PlotCommon && PlotCommon.L) ? PlotCommon.L() : {};
        const txt = {
            noData: L.noDataPlaceholder || '导入数据并完成设置后，热图将在此处自动生成',
            noCols: L.noColsPlaceholder || '选择至少 2 个数值列后将在此处显示热图',
            noValid: L.noValidPlaceholder || '未能生成有效数据'
        };

        if (!s.data.length) { emptyView(txt.noData); return false; }

        let res;
        if (state.inputIsMatrix === true) {
            res = computeCorrFromMatrix(s.data, s.headers);
        } else {
            if (state.selectedCols.length < 2) { emptyView(txt.noCols); return false; }
            res = computeCorrFromRaw(s.data, state.selectedCols, state.method);
        }
        if (!res) { emptyView(txt.noValid); return false; }

        const ordered = applyOrder(res.labels, res.rMatrix, res.pMatrix, display.orderText);
        const finalData = applyTLBRReverse(ordered.labels, ordered.rMatrix, ordered.pMatrix, display.format);

        state.labels = finalData.labels;
        state.rMatrix = finalData.rMatrix;
        state.pMatrix = finalData.pMatrix;

        renderCorrTable(app.$('corrTableWrap'), {
            labels: finalData.labels, rMatrix: finalData.rMatrix, pMatrix: finalData.pMatrix,
            decimals: state.tableDecimals
        });
        const btn = app.$('exportTableBtn');
        if (btn) btn.disabled = false;

        const fontFamily = app.$('fontFamily') ? app.$('fontFamily').value : 'Times New Roman';
        const showCanvasBorder = app.$('showCanvasBorder') ? app.$('showCanvasBorder').checked : true;
        const n = finalData.labels.length;
        const padLeft = 140, padTop = 120;

        const cbCfg = state.colorBar;
        const showBar = cbCfg.show;
        const isH = cbCfg.orientation === 'horizontal';

        const padRight = (showBar && !isH) ? ((cbCfg.thickness || 16) + 60) : 30;
        const padBottom = (showBar && isH) ? ((cbCfg.length || 120) + 60) : 30;

        const cellPx = display.cell.baseSize;
        const autoWidth = padLeft + n * cellPx + padRight;
        const autoHeight = padTop + n * cellPx + padBottom;
        const userW = parseFloat(app.$('chartWidth') ? app.$('chartWidth').value : 0) || 0;
        const userH = parseFloat(app.$('chartHeight') ? app.$('chartHeight').value : 0) || 0;
        const width = Math.max(autoWidth, userW);
        const height = Math.max(autoHeight, userH);

        const canvas = global.PlotCanvas.create(app.$('chartPreview'), {
            width: width, height: height, fontFamily: fontFamily, border: showCanvasBorder
        });
        const svg = canvas.root;
        app.state.currentSvg = canvas.node;

        drawCorrHeatmap(svg, {
            state: state,
            labels: finalData.labels,
            rMatrix: finalData.rMatrix,
            pMatrix: finalData.pMatrix,
            width: width,
            padLeft: padLeft, padTop: padTop,
            dataKind: 'correlation',
            onScaleChange: function () { refreshCorrHeatmap(app, state); }
        });

        global.PlotAxis.applyFontFamily(svg, fontFamily);

        if (cbCfg.rangeAuto) {
            const dec = cbCfg.decimals || 2;
            const dataRange = computeDataRange(finalData.rMatrix, 'correlation');
            const elMin = document.querySelector('.cb-min');
            const elMax = document.querySelector('.cb-max');
            if (elMin) elMin.value = dataRange.min.toFixed(dec);
            if (elMax) elMax.value = dataRange.max.toFixed(dec);
        }
        if (app.exportSvgBtn) app.exportSvgBtn.disabled = false;
        if (app.exportPngBtn) app.exportPngBtn.disabled = false;
        return true;
    }

    global.HeatmapCommon = {
        pearson: pearson, spearman: spearman, kendall: kendall,
        calcCorrelation: calcCorrelation, corrMatrix: corrMatrix,
        computeCorrFromRaw: computeCorrFromRaw,
        computeCorrFromMatrix: computeCorrFromMatrix,
        detectMatrixFormat: detectMatrixFormat,
        pToStars: pToStars, formatP: formatP, formatR: formatR,
        sigColor: sigColor, textColorOn: textColorOn,
        renderCorrTable: renderCorrTable, exportCorrTableCsv: exportCorrTableCsv,
        resolveCustomColors: resolveCustomColors,
        resolveLegendStops: resolveLegendStops,
        resolveLegendGradient: resolveLegendGradient,
        computeDataRange: computeDataRange, resolveColorScale: resolveColorScale,
        updateColorPreview: updateColorPreview,
        defaultDisplay: defaultDisplay,
        renderDisplayPanel: renderDisplayPanel,
        syncDisplayFromDom: syncDisplayFromDom,
        bindDisplayPanel: bindDisplayPanel,
        applyOrder: applyOrder,
        applyTLBRReverse: applyTLBRReverse,
        drawHeatmap: drawHeatmap, drawCorrHeatmap: drawCorrHeatmap,
        refreshCorrHeatmap: refreshCorrHeatmap,
        T: T
    };
})(window);
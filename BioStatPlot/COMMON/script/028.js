(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';

    const T = {
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select X (FC/logFC) and Y (p/q) columns' : '❌ 请选择X轴（FC/logFC）与Y轴（p/q）列',
        noValid: EN ? '❌ Could not generate valid plot data' : '❌ 未能生成有效绘图数据',
        noDataPlaceholder: EN ? '— Please import data first —' : '— 请先导入数据 —',
        noName: EN ? 'None' : '无',
        noGroup: EN ? 'No groups' : '无分组',
        groupEmptyTip: EN ? 'Select a group column in step 2 to show group colors here.' : '在第二步选择分组列后，此处将显示各分组的颜色。',
        groupNoValues: EN ? 'The selected group column contains no valid values.' : '所选分组列中没有有效值。',

        transformTitle: EN ? 'Data Transform & Thresholds' : '数据转换与阈值',
        xTransformLabel: EN ? 'X-axis transform' : 'X轴转换',
        yTransformLabel: EN ? 'Y-axis transform' : 'Y轴转换',
        xKeepLog: EN ? 'Already log-transformed (keep as-is)' : '已进行对数转换（维持原值）',
        xNeedLog: EN ? 'Not log-transformed (apply log)' : '未对数转换（需取对数）',
        yKeepNegLog: EN ? 'Already -log-transformed (keep as-is)' : '已进行负对数转换（维持原值）',
        yNeedNegLog: EN ? 'Not -log-transformed (apply -log)' : '未负对数转换（需取负对数）',
        logBaseLabel: EN ? 'Base' : '底数',
        thresholdSection: EN ? 'Thresholds' : '阈值',
        xThLabel: EN ? 'X threshold' : 'X阈值',
        pThLabel: EN ? 'P threshold' : 'P阈值',
        showLineLabel: EN ? 'Show threshold lines' : '显示阈值线',
        lineColorLabel: EN ? 'Line color' : '线颜色',
        lineWidthLabel: EN ? 'Width' : '线宽',
        dashLabel: EN ? 'Dashed' : '虚线',

groupColorNonSig: EN ? 'Also use group colors for non-significant group points' : '不显著的分组点也使用分组色',

        transformTip: EN
            ? '<strong>X:</strong> choose "Already log-transformed" when X is logFC; choose "Not log-transformed" when X is raw FC. '
              + '<strong>Y:</strong> choose "Already -log-transformed" when Y is already -log(p), and specify the base; choose "Not -log-transformed" when Y is raw p.'
            : '<strong>X轴：</strong>若X列已是logFC，选择“已进行对数转换”；若X列是原始FC，选择“未对数转换”并设置底数。'
              + '<strong>Y轴：</strong>若Y列已是-log(p)，选择“已进行负对数转换”并给出当时使用的底数；若Y列是原始p值，选择“未负对数转换”并设置底数。'
    };

    function makeExampleData() {
        const pathways = ['Apoptosis', 'Cell cycle', 'DNA repair', 'Metabolism'];
        const rows = ['Gene\tLog2FC\tPvalue\tPathway'];
        let seed = 20240501;
        function rand() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        }
        let gid = 1;
        pathways.forEach(pw => {
            const count = 8 + Math.floor(rand() * 5);
            for (let i = 0; i < count; i++) {
                const x = (rand() - 0.5) * 8;
                let p = Math.pow(10, -(rand() * 6 + Math.abs(x) * 0.85));
                p = Math.min(0.99, Math.max(1e-9, p));
                rows.push('GENE' + (gid++) + '\t' + x.toFixed(2) + '\t' + p.toExponential(2) + '\t' + pw);
            }
        });
        return rows.join('\n');
    }
    const EX_DATA = makeExampleData();

    function injectPageStyle() {
        if (document.getElementById('volcano-group-style')) return;
        const s = document.createElement('style');
        s.id = 'volcano-group-style';
        s.textContent = `
#volcanoPanelContainer .param-grid,
#transformPanelContainer .param-grid { row-gap: 10px; }
#volcanoPanelContainer .param-item input[type="color"],
#transformPanelContainer .param-item input[type="color"] {
    width: 50px !important; min-width: 50px !important; max-width: 50px !important;
    flex: 0 0 50px !important; height: 30px !important; padding: 3px !important; box-sizing: border-box;
}
#volcanoPanelContainer .vp-label-topn-item,
#volcanoPanelContainer .vp-label-custom-item,
#volcanoPanelContainer .vp-label-groupname-item { margin-top: 14px; margin-bottom: 10px; }
#transformPanelContainer .vt-row { margin-top: 6px; }
#transformPanelContainer .vt-row:first-of-type { margin-top: 0; }
#transformPanelContainer .vt-base-item { min-width: 110px; }


`;
        document.head.appendChild(s);
    }

    function defaultVolcanoSettings() {
        return {
            xTransform: 'keepLog', xLogBase: 2,
            yTransform: 'needNegLog', yLogBase: 10,
            xThreshold: 1, pThreshold: 0.05,
            showThresholdLine: true, thresholdColor: '#888888',
            thresholdWidth: 1, thresholdDash: true,

            upColor: '#e15759', downColor: '#4e79a7', normalColor: '#cccccc',
            pointSize: 5, pointAlpha: 0.8,

            labelShow: false,
            highlightSelected: false,
            labelMode: 'top',
            labelTopN: 3,
            labelCustomNames: '',
            labelGroupNames: '',
            labelFontSize: 11, labelBold: true, labelItalic: false,

            labelTextMode: 'group',
            labelTextUniform: '#333333',
            labelBgMode: 'none',
            labelBgUniform: '#ffffff',
            labelBorderColor: '#000000',

            labelLeaderColor: '#999999',
            labelLeaderOffsetX: 0,
            labelLeaderOffsetY: 0,

groupColorNonSig: false,

            showUnclassifiedLegend: true,

            showCount: true,
            upLabel: 'Up', downLabel: 'Down', normalLabel: 'Normal'
        };
    }

    function normalizeXTransform(v) {
        if (v === 'keepLog' || v === 'needLog') return v;
        if (v === 'raw') return 'keepLog';
        if (v === 'log' || v === 'negLog') return 'needLog';
        return 'keepLog';
    }
    function normalizeYTransform(v) {
        if (v === 'keepNegLog' || v === 'needNegLog') return v;
        if (v === 'asNegLog') return 'keepNegLog';
        if (v === 'raw' || v === 'log' || v === 'negLog') return 'needNegLog';
        return 'needNegLog';
    }

    function mergeVolcanoState(st) {
        const d = defaultVolcanoSettings();
        if (!st) return d;
        const out = Object.assign({}, d, st);

        out.xTransform = normalizeXTransform(st.xTransform);
        out.yTransform = normalizeYTransform(st.yTransform);

        if (out.labelBorderColor && typeof out.labelBorderColor === 'object') {
            out.labelBorderColor = out.labelBorderColor.up || d.labelBorderColor;
        }
        if (typeof out.labelBorderColor !== 'string' || !out.labelBorderColor) {
            out.labelBorderColor = d.labelBorderColor;
        }

        if (out.labelMode !== 'top' && out.labelMode !== 'custom' && out.labelMode !== 'group' && out.labelMode !== 'groupName') {
            out.labelMode = 'top';
        }
        if (out.labelTextMode !== 'group' && out.labelTextMode !== 'uniform') out.labelTextMode = 'group';
        if (out.labelBgMode !== 'group' && out.labelBgMode !== 'uniform' && out.labelBgMode !== 'none') out.labelBgMode = 'none';

        return out;
    }

    function transformX(v, mode, base) {
        const n = parseFloat(v);
        if (!isFinite(n)) return NaN;
        if (mode === 'keepLog') return n;
        if (n <= 0) return NaN;
        const b = Math.log(base > 0 ? base : 2);
        return Math.log(n) / b;
    }
    function transformY(v, mode, base) {
        const n = parseFloat(v);
        if (!isFinite(n)) return NaN;
        if (mode === 'keepNegLog') return n;
        if (n <= 0) return NaN;
        const b = Math.log(base > 0 ? base : 10);
        return -Math.log(n) / b;
    }
    function computeXLine(v) {
        const t = Math.abs(parseFloat(v.xThreshold));
        if (!isFinite(t)) return 1;
        if (v.xTransform === 'keepLog') return t;
        const val = transformX(t, v.xTransform, v.xLogBase);
        return isFinite(val) ? Math.abs(val) : t;
    }
    function computeYLine(v) {
        const p = parseFloat(v.pThreshold);
        if (!isFinite(p) || p <= 0) return 0;
        const base = v.yLogBase > 0 ? v.yLogBase : 10;
        return -Math.log(p) / Math.log(base);
    }
    function niceCeil(v) {
        if (!isFinite(v) || v <= 0) return 1;
        const exp = Math.floor(Math.log10(v));
        const base = Math.pow(10, exp);
        const f = v / base;
        const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
        return n * base;
    }

    function fillRoleSelects(app) {
        const s = app.state;
        const xSel = app.$('xColSel');
        const ySel = app.$('yColSel');
        const nSel = app.$('nameColSel');
        const gSel = app.$('groupColSel');
        if (!xSel || !ySel || !nSel || !gSel) return;

        if (!s.headers.length) {
            xSel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            ySel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            nSel.innerHTML = '<option value="">' + T.noName + '</option>';
            gSel.innerHTML = '<option value="">' + T.noGroup + '</option>';
            xSel.disabled = ySel.disabled = nSel.disabled = gSel.disabled = true;
            return;
        }
        xSel.disabled = ySel.disabled = nSel.disabled = gSel.disabled = false;

        const types = s.columnTypes || {};
        const nums = s.headers.filter(h => types[h] === 'numeric');

        xSel.innerHTML = nums.map(h =>
            '<option value="' + PC.escapeHtml(h) + '"' + (h === s.roles.x ? ' selected' : '') + '>' + PC.escapeHtml(h) + '</option>'
        ).join('') || '<option value="">' + T.noDataPlaceholder + '</option>';

        ySel.innerHTML = nums.map(h =>
            '<option value="' + PC.escapeHtml(h) + '"' + (h === s.roles.y ? ' selected' : '') + '>' + PC.escapeHtml(h) + '</option>'
        ).join('') || '<option value="">' + T.noDataPlaceholder + '</option>';

        nSel.innerHTML = '<option value="">' + T.noName + '</option>' + s.headers.map(h =>
            '<option value="' + PC.escapeHtml(h) + '"' + (h === s.roles.name ? ' selected' : '') + '>' + PC.escapeHtml(h) + '</option>'
        ).join('');

        gSel.innerHTML = '<option value="">' + T.noGroup + '</option>' + s.headers.map(h =>
            '<option value="' + PC.escapeHtml(h) + '"' + (h === s.roles.group ? ' selected' : '') + '>' + PC.escapeHtml(h) + '</option>'
        ).join('');
    }

    function renderTransformPanel(app) {
        injectPageStyle();
        const s = app.state;
        const v = s.volcano;
        const c = app.$('transformPanelContainer');
        if (!c) return;

        c.className = 'param-panel';
        c.innerHTML = ''
            + '<div class="param-panel-title">' + T.transformTitle + '</div>'
            + '<div class="param-grid cols-4 vt-row">'
            + '  <div class="param-item" style="grid-column: span 2;"><label>' + T.xTransformLabel + '</label>'
            + '    <select class="vt-x-transform">'
            + '      <option value="keepLog" ' + (v.xTransform === 'keepLog' ? 'selected' : '') + '>' + T.xKeepLog + '</option>'
            + '      <option value="needLog" ' + (v.xTransform === 'needLog' ? 'selected' : '') + '>' + T.xNeedLog + '</option>'
            + '    </select></div>'
            + '  <div class="param-item vt-base-item vt-x-logbase-item" style="' + (v.xTransform === 'needLog' ? '' : 'display:none;') + '">'
            + '    <label>' + T.logBaseLabel + '</label>'
            + '    <input type="number" class="vt-x-logbase" value="' + v.xLogBase + '" min="0.01" step="0.1"></div>'
            + '</div>'
            + '<div class="param-grid cols-4 vt-row">'
            + '  <div class="param-item" style="grid-column: span 2;"><label>' + T.yTransformLabel + '</label>'
            + '    <select class="vt-y-transform">'
            + '      <option value="keepNegLog" ' + (v.yTransform === 'keepNegLog' ? 'selected' : '') + '>' + T.yKeepNegLog + '</option>'
            + '      <option value="needNegLog" ' + (v.yTransform === 'needNegLog' ? 'selected' : '') + '>' + T.yNeedNegLog + '</option>'
            + '    </select></div>'
            + '  <div class="param-item vt-base-item">'
            + '    <label>' + T.logBaseLabel + '</label>'
            + '    <input type="number" class="vt-y-logbase" value="' + v.yLogBase + '" min="0.01" step="0.1"></div>'
            + '</div>'
            + '<div class="axis-subsection">' + T.thresholdSection + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label>' + T.xThLabel + '</label>'
            + '    <input type="number" class="vp-x-threshold" value="' + v.xThreshold + '" step="0.01"></div>'
            + '  <div class="param-item"><label>' + T.pThLabel + '</label>'
            + '    <input type="number" class="vp-p-threshold" value="' + v.pThreshold + '" step="0.001" min="0"></div>'
            + '  <div class="param-item" style="grid-column: span 2;"><label class="mini-check">'
            + '    <input type="checkbox" class="vp-show-threshold" ' + (v.showThresholdLine ? 'checked' : '') + '>' + T.showLineLabel + '</label></div>'
            + '  <div class="param-item"><label>' + T.lineColorLabel + '</label>'
            + '    <input type="color" class="vp-threshold-color" value="' + v.thresholdColor + '"></div>'
            + '  <div class="param-item"><label>' + T.lineWidthLabel + '</label>'
            + '    <input type="number" class="vp-threshold-width" value="' + v.thresholdWidth + '" min="0.5" max="6" step="0.5"></div>'
            + '  <div class="param-item"><label class="mini-check"><input type="checkbox" class="vp-threshold-dash" '
            + (v.thresholdDash ? 'checked' : '') + '>' + T.dashLabel + '</label></div>'
            + '</div>'
            + '<div class="info-box" style="margin-top:10px;">' + T.transformTip + '</div>';

        const xSel = c.querySelector('.vt-x-transform');
        const ySel = c.querySelector('.vt-y-transform');
        const xBaseItem = c.querySelector('.vt-x-logbase-item');
        const xBaseEl = c.querySelector('.vt-x-logbase');
        const yBaseEl = c.querySelector('.vt-y-logbase');
        const xThEl = c.querySelector('.vp-x-threshold');
        const pThEl = c.querySelector('.vp-p-threshold');
        const showThEl = c.querySelector('.vp-show-threshold');
        const colorThEl = c.querySelector('.vp-threshold-color');
        const widthThEl = c.querySelector('.vp-threshold-width');
        const dashThEl = c.querySelector('.vp-threshold-dash');

        const fire = () => { if (s.currentSvg) app.drawChart(); };
        const syncTitle = () => { syncAxisTitles(app); updateAxisTitleInputs(app); fire(); };

        xSel.addEventListener('change', () => {
            v.xTransform = xSel.value;
            xBaseItem.style.display = (v.xTransform === 'needLog') ? '' : 'none';
            syncTitle();
        });
        ySel.addEventListener('change', () => { v.yTransform = ySel.value; syncTitle(); });
        xBaseEl.addEventListener('input', () => {
            const n = parseFloat(xBaseEl.value);
            v.xLogBase = isFinite(n) && n > 0 ? n : 2;
            syncTitle();
        });
        yBaseEl.addEventListener('input', () => {
            const n = parseFloat(yBaseEl.value);
            v.yLogBase = isFinite(n) && n > 0 ? n : 10;
            syncTitle();
        });
        xThEl.addEventListener('input', () => {
            const n = parseFloat(xThEl.value);
            v.xThreshold = isFinite(n) ? n : v.xThreshold;
            fire();
        });
        pThEl.addEventListener('input', () => {
            const n = parseFloat(pThEl.value);
            v.pThreshold = Math.max(0, isFinite(n) ? n : v.pThreshold);
            fire();
        });
        showThEl.addEventListener('change', () => { v.showThresholdLine = showThEl.checked; fire(); });
        colorThEl.addEventListener('input', () => { v.thresholdColor = colorThEl.value; fire(); });
        widthThEl.addEventListener('change', () => {
            const n = parseFloat(widthThEl.value);
            v.thresholdWidth = Math.max(0.5, isFinite(n) ? n : v.thresholdWidth);
            fire();
        });
        dashThEl.addEventListener('change', () => { v.thresholdDash = dashThEl.checked; fire(); });
    }

    function refreshAxisPanel(app) {
        const panel = app.$('axisPanelContainer');
        if (!panel) return;
        PlotAxis.render(panel, {
            state: app.state.axis,
            direction: 'vertical',
            axisTypes: { x: 'numeric', y: 'numeric' },
            onGlobalFontChange: () => { if (app.state.currentSvg) app.drawChart(); },
            onChange: () => { if (app.state.currentSvg) app.drawChart(); },
            onDirectionChange: () => { if (app.state.currentSvg) app.drawChart(); }
        });
        const dir = panel.querySelector('.axis-direction-block');
        if (dir) dir.style.display = 'none';
        ['x', 'y'].forEach(k => {
            const input = panel.querySelector('.ax-' + k + '-title');
            if (input) input.addEventListener('input', () => { app.state.axis[k].titleEdited = true; });
        });
    }

    function formatLogBase(b) {
        const n = parseFloat(b);
        if (!isFinite(n) || n <= 0) return '';
        return String(parseFloat(n.toFixed(6)));
    }
    function syncAxisTitles(app) {
        const s = app.state;
        const v = s.volcano || defaultVolcanoSettings();
        const xCol = String(s.roles.x || '').trim();
        const yCol = String(s.roles.y || '').trim();
        const xBase = formatLogBase(v.xLogBase) || '2';
        const yBase = formatLogBase(v.yLogBase) || '10';
        if (!s.axis.x.titleEdited) {
            s.axis.x.titleContent = (v.xTransform === 'needLog') ? 'Log' + xBase + '(Fold Change)' : xCol;
        }
        if (!s.axis.y.titleEdited) {
            const useP = !yCol || /^p/i.test(yCol);
            s.axis.y.titleContent = '-Log' + yBase + (useP ? '(p)' : '(FDR)');
        }
    }
    function updateAxisTitleInputs(app) {
        const panel = app.$('axisPanelContainer');
        if (!panel) return;
        ['x', 'y'].forEach(k => {
            const input = panel.querySelector('.ax-' + k + '-title');
            if (input) input.value = app.state.axis[k].titleContent || '';
        });
    }

    function scanGroupNames(s) {
        const groupCol = s.roles.group || '';
        if (!groupCol || !s.data.length) return [];
        const seen = new Set();
        const out = [];
        s.data.forEach(row => {
            const g = String(row[groupCol] == null ? '' : row[groupCol]).trim();
            if (g && !seen.has(g)) {
                seen.add(g);
                out.push(g);
            }
        });
        return out;
    }

    function resolveGroupColors(groupNames, paletteName, customColors, opts) {
        opts = opts || {};
        const base = PC.getCategoricalColors(
            paletteName || 'tableau10',
            groupNames.length,
            { reverse: !!opts.reverse, cycle: !!opts.cycleColors }
        );
        const colors = new Map();
        groupNames.forEach((g, i) => {
            colors.set(g, (customColors && customColors[g]) || base[i]);
        });
        return colors;
    }

    function refreshGroupColorAssign(app) {
        const container = app.$('groupColorAssignContainer');
        if (!container) return;
        const s = app.state;

        const groupNames = scanGroupNames(s);
        s.currentGroupOrder = groupNames;

        if (!s.roles.group) {
            container.innerHTML = '<div class="param-panel"><div class="info-box">' + T.groupEmptyTip + '</div></div>';
            return;
        }
        if (!groupNames.length) {
            container.innerHTML = '<div class="param-panel"><div class="info-box">' + T.groupNoValues + '</div></div>';
            return;
        }

        const base = PC.getCategoricalColors(
            s.paletteName || 'tableau10',
            groupNames.length,
            { reverse: s.reverse, cycle: s.cycleColors }
        );

        const wrap = document.createElement('div');
        wrap.className = 'param-panel';
        wrap.innerHTML = '<div class="param-panel-title">' + (EN ? 'Group colors' : '分组颜色') + '</div>';
        const inner = document.createElement('div');
        wrap.appendChild(inner);
        container.innerHTML = '';
        container.appendChild(wrap);

        PC.renderColorAssignment(inner, {
            items: groupNames.map((g, i) => ({
                name: g,
                color: s.customColors[g] || base[i]
            })),
            onChange: (idx, color) => {
                s.customColors[groupNames[idx]] = color;
                if (s.currentSvg) app.drawChart();
            },
            onResetAll: () => {
                s.customColors = {};
                refreshGroupColorAssign(app);
                if (s.currentSvg) app.drawChart();
            }
        });
    }

    function refreshUnclassifiedColorAssign(app) {
        const container = app.$('unclassifiedColorAssignContainer');
        if (!container) return;
        const v = app.state.volcano;
        const items = [
            { name: v.upLabel, color: v.upColor },
            { name: v.downLabel, color: v.downColor },
            { name: v.normalLabel, color: v.normalColor }
        ];
        PC.renderColorAssignment(container, {
            items: items,
            onChange: (idx, c) => {
                if (idx === 0) v.upColor = c;
                else if (idx === 1) v.downColor = c;
                else v.normalColor = c;
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: () => {
                const d = defaultVolcanoSettings();
                v.upColor = d.upColor;
                v.downColor = d.downColor;
                v.normalColor = d.normalColor;
                refreshUnclassifiedColorAssign(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    function updateGroupPaletteVisibility(app) {
        const panel = app.$('groupPalettePanel');
        if (!panel) return;
        const has = !!(app.state.roles.group && app.state.roles.group !== '');
        panel.style.display = has ? '' : 'none';
    }

    function renderVolcanoPanel(app) {
        injectPageStyle();
        const s = app.state;
        const v = s.volcano;
        const c = app.$('volcanoPanelContainer');
        if (!c) return;
        const esc = PC.escapeHtml;
        const hasGroupCol = !!(s.roles.group && s.roles.group !== '');

        c.className = 'param-panel';
        c.innerHTML = ''
            + '<div class="param-panel-title">' + (EN ? 'Volcano Plot Settings' : '火山图设置') + '</div>'

            + '<div class="axis-subsection">' + (EN ? 'Points' : '点样式') + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label>' + (EN ? 'Size' : '大小') + '</label>'
            + '    <input type="number" class="vp-point-size" value="' + v.pointSize + '" min="1" max="20" step="0.5"></div>'
            + '  <div class="param-item"><label>' + (EN ? 'Alpha' : '透明度') + '</label>'
            + '    <input type="number" class="vp-point-alpha" value="' + v.pointAlpha + '" min="0" max="1" step="0.05"></div>'
            + '</div>'

            + '<div class="axis-subsection">' + (EN ? 'Selected points' : '选中的点') + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item" style="grid-column: span 4;"><label class="mini-check">'
            + '    <input type="checkbox" class="vp-highlight-selected" ' + (v.highlightSelected ? 'checked' : '') + '>'
            + '    ' + (EN ? 'Use group colors only for selected points (others keep Up/Down/Normal colors)' : '仅选中的点使用分组色（其余显示为上调/下调/不显著色）') + '</label></div>'
            + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item" style="grid-column: span 4;"><label class="mini-check">'
            + '    <input type="checkbox" class="vp-label-show" ' + (v.labelShow ? 'checked' : '') + '>'
            + '    ' + (EN ? 'Show name labels for selected points' : '为选中的点显示名称标签') + '</label></div>'
            + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item" style="grid-column: span 2;"><label>' + (EN ? 'Selection' : '选择方式') + '</label>'
            + '    <select class="vp-label-mode">'
            + '      <option value="top" ' + (v.labelMode === 'top' ? 'selected' : '') + '>' + (EN ? 'Auto Top N of significant points' : '自动 Top N（显著点）') + '</option>'
            + '      <option value="custom" ' + (v.labelMode === 'custom' ? 'selected' : '') + '>' + (EN ? 'Custom gene names' : '自定义基因名称') + '</option>'
            + (hasGroupCol ? '<option value="group" ' + (v.labelMode === 'group' ? 'selected' : '') + '>' + (EN ? 'All significant group points' : '所有显著的分组点') + '</option>' : '')
            + (hasGroupCol ? '<option value="groupName" ' + (v.labelMode === 'groupName' ? 'selected' : '') + '>' + (EN ? 'By group name(s)' : '按分组名称') + '</option>' : '')
            + '    </select></div>'
            + '  <div class="param-item"><label>' + (EN ? 'Font size' : '字号') + '</label>'
            + '    <input type="number" class="vp-label-fs" value="' + v.labelFontSize + '" min="6" max="36" step="1"></div>'
            + '  <div class="param-item"><label class="mini-check"><input type="checkbox" class="vp-label-bold" '
            + (v.labelBold ? 'checked' : '') + '>' + (EN ? 'Bold' : '加粗') + '</label>'
            + '    <label class="mini-check" style="margin-left:12px;"><input type="checkbox" class="vp-label-italic" '
            + (v.labelItalic ? 'checked' : '') + '>' + (EN ? 'Italic' : '斜体') + '</label></div>'
            + '</div>'
            + '<div class="param-grid cols-4 vp-label-topn-item" style="' + (v.labelMode === 'top' ? '' : 'display:none;') + '">'
            + '  <div class="param-item" style="grid-column: span 4;"><label>' + (EN ? 'Top N per direction' : '每方向 Top N') + '</label>'
            + '    <input type="number" class="vp-label-topn" value="' + v.labelTopN + '" min="1" max="100" step="1"></div>'
            + '</div>'
            + '<div class="param-grid cols-4 vp-label-custom-item" style="' + (v.labelMode === 'custom' ? '' : 'display:none;') + '">'
            + '  <div class="param-item" style="grid-column: span 4;"><label>' + (EN ? 'Gene names (one per line)' : '基因名称（每行一个）') + '</label>'
            + '    <textarea class="vp-label-custom" rows="4" placeholder="GENE1&#10;GENE2&#10;GENE3" style="width:100%;resize:vertical;box-sizing:border-box;">' + esc(v.labelCustomNames) + '</textarea></div>'
            + '</div>'
            + '<div class="param-grid cols-4 vp-label-groupname-item" style="' + (v.labelMode === 'groupName' ? '' : 'display:none;') + '">'
            + '  <div class="param-item" style="grid-column: span 4;"><label>' + (EN ? 'Group names (comma separated)' : '分组名称（仅用逗号分隔，空格视为名称的一部分）') + '</label>'
            + '    <input type="text" class="vp-label-groupnames" value="' + esc(v.labelGroupNames) + '" placeholder="Pathway A, Pathway B"></div>'
            + '</div>'

            + '<div class="axis-subsection">' + (EN ? 'Selected label style' : '选中标签样式') + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label>' + (EN ? 'Text color' : '文字色') + '</label>'
            + '    <select class="vp-label-text-mode">'
            + '      <option value="group" ' + (v.labelTextMode === 'group' ? 'selected' : '') + '>' + (EN ? 'Follow group' : '随分组色') + '</option>'
            + '      <option value="uniform" ' + (v.labelTextMode === 'uniform' ? 'selected' : '') + '>' + (EN ? 'Uniform' : '统一颜色') + '</option>'
            + '    </select></div>'
            + '  <div class="param-item vp-label-text-uniform-item" style="' + (v.labelTextMode === 'uniform' ? '' : 'display:none;') + '"><label>&nbsp;</label>'
            + '    <input type="color" class="vp-label-text-uniform" value="' + v.labelTextUniform + '"></div>'
            + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label>' + (EN ? 'Background' : '背景色') + '</label>'
            + '    <select class="vp-label-bg-mode">'
            + '      <option value="none" ' + (v.labelBgMode === 'none' ? 'selected' : '') + '>' + (EN ? 'None' : '不显示') + '</option>'
            + '      <option value="group" ' + (v.labelBgMode === 'group' ? 'selected' : '') + '>' + (EN ? 'Follow group' : '随分组色') + '</option>'
            + '      <option value="uniform" ' + (v.labelBgMode === 'uniform' ? 'selected' : '') + '>' + (EN ? 'Uniform' : '统一颜色') + '</option>'
            + '    </select></div>'
            + '  <div class="param-item vp-label-bg-uniform-item" style="' + (v.labelBgMode === 'uniform' ? '' : 'display:none;') + '"><label>&nbsp;</label>'
            + '    <input type="color" class="vp-label-bg-uniform" value="' + v.labelBgUniform + '"></div>'
            + '  <div class="param-item"><label>' + (EN ? 'Border color' : '边框色') + '</label>'
            + '    <input type="color" class="vp-label-border" value="' + v.labelBorderColor + '"></div>'
            + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label>' + (EN ? 'Leader color' : '引导线颜色') + '</label>'
            + '    <input type="color" class="vp-leader-color" value="' + v.labelLeaderColor + '"></div>'
            + '  <div class="param-item"><label>' + (EN ? 'Leader offset X' : '引导线水平偏移') + '</label>'
            + '    <input type="number" class="vp-leader-offset-x" value="' + v.labelLeaderOffsetX + '" min="-30" max="30" step="1"></div>'
            + '  <div class="param-item"><label>' + (EN ? 'Leader offset Y' : '引导线垂直偏移') + '</label>'
            + '    <input type="number" class="vp-leader-offset-y" value="' + v.labelLeaderOffsetY + '" min="-30" max="30" step="1"></div>'
            + '</div>'

+ (hasGroupCol ? ''
    + '<div class="axis-subsection">' + (EN ? 'Group points' : '分组点') + '</div>'
    + '<div class="param-grid cols-4">'
    + '  <div class="param-item" style="grid-column: span 4;"><label class="mini-check">'
    + '    <input type="checkbox" class="vp-group-color-nonsig" ' + (v.groupColorNonSig ? 'checked' : '') + '>'
    + '    ' + T.groupColorNonSig + '</label></div>'
    + '</div>'
    : '')

            + '<div class="axis-subsection">' + (EN ? 'Legend' : '图例样式') + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label class="mini-check"><input type="checkbox" class="vp-show-count" '
            + (v.showCount ? 'checked' : '') + '>' + (EN ? 'Show counts' : '显示项目数') + '</label></div>'
            + (hasGroupCol
                ? '<div class="param-item"><label class="mini-check"><input type="checkbox" class="vp-show-unclassified-legend" '
                  + (v.showUnclassifiedLegend ? 'checked' : '') + '>' + (EN ? 'Show Up/Down/Normal in legend' : '图例包含上调/下调/不显著') + '</label></div>'
                : '')
            + '  <div class="param-item"><label>' + (EN ? 'Up label' : '上调文字') + '</label>'
            + '    <input type="text" class="vp-up-label" value="' + esc(v.upLabel) + '"></div>'
            + '  <div class="param-item"><label>' + (EN ? 'Down label' : '下调文字') + '</label>'
            + '    <input type="text" class="vp-down-label" value="' + esc(v.downLabel) + '"></div>'
            + '  <div class="param-item"><label>' + (EN ? 'Normal label' : '不显著文字') + '</label>'
            + '    <input type="text" class="vp-normal-label" value="' + esc(v.normalLabel) + '"></div>'
            + '</div>';

        bindVolcanoPanelEvents(app);
    }

    function readVolcanoPanel(app) {
        const c = app.$('volcanoPanelContainer');
        if (!c) return;
        const v = app.state.volcano;
        const q = s => c.querySelector(s);
        const qv = (s, fb) => { const e = q(s); return e ? e.value : fb; };
        const qc = (s, fb) => { const e = q(s); return e ? e.checked : fb; };
        const qn = (s, fb) => { const e = q(s); if (!e) return fb; const n = parseFloat(e.value); return isFinite(n) ? n : fb; };

        v.pointSize = Math.max(1, qn('.vp-point-size', v.pointSize));
        v.pointAlpha = Math.max(0, Math.min(1, qn('.vp-point-alpha', v.pointAlpha)));

        v.labelShow = qc('.vp-label-show', v.labelShow);
        v.highlightSelected = qc('.vp-highlight-selected', v.highlightSelected);
        v.labelMode = qv('.vp-label-mode', v.labelMode);
        v.labelTopN = Math.max(1, Math.round(qn('.vp-label-topn', v.labelTopN)));
        v.labelCustomNames = qv('.vp-label-custom', v.labelCustomNames);
        v.labelGroupNames = qv('.vp-label-groupnames', v.labelGroupNames);
        v.labelFontSize = Math.max(6, qn('.vp-label-fs', v.labelFontSize));
        v.labelBold = qc('.vp-label-bold', v.labelBold);
        v.labelItalic = qc('.vp-label-italic', v.labelItalic);

        v.labelTextMode = qv('.vp-label-text-mode', v.labelTextMode);
        v.labelTextUniform = qv('.vp-label-text-uniform', v.labelTextUniform) || '#333333';
        v.labelBgMode = qv('.vp-label-bg-mode', v.labelBgMode);
        v.labelBgUniform = qv('.vp-label-bg-uniform', v.labelBgUniform) || '#ffffff';
        v.labelBorderColor = qv('.vp-label-border', v.labelBorderColor) || '#000000';

        v.labelLeaderColor = qv('.vp-leader-color', v.labelLeaderColor) || '#999999';
        v.labelLeaderOffsetX = qn('.vp-leader-offset-x', v.labelLeaderOffsetX);
        v.labelLeaderOffsetY = qn('.vp-leader-offset-y', v.labelLeaderOffsetY);

v.groupColorNonSig = qc('.vp-group-color-nonsig', v.groupColorNonSig);

        v.showCount = qc('.vp-show-count', v.showCount);
        const sul = q('.vp-show-unclassified-legend');
        if (sul) v.showUnclassifiedLegend = sul.checked;
        v.upLabel = qv('.vp-up-label', v.upLabel) || 'Up';
        v.downLabel = qv('.vp-down-label', v.downLabel) || 'Down';
        v.normalLabel = qv('.vp-normal-label', v.normalLabel) || 'Normal';
    }

    function bindVolcanoPanelEvents(app) {
        const c = app.$('volcanoPanelContainer');
        if (!c) return;

        const modeSel = c.querySelector('.vp-label-mode');
        if (modeSel) {
            const updateVis = () => {
                const m = modeSel.value;
                c.querySelectorAll('.vp-label-topn-item').forEach(el => { el.style.display = m === 'top' ? '' : 'none'; });
                c.querySelectorAll('.vp-label-custom-item').forEach(el => { el.style.display = m === 'custom' ? '' : 'none'; });
                c.querySelectorAll('.vp-label-groupname-item').forEach(el => { el.style.display = m === 'groupName' ? '' : 'none'; });

                if (m === 'custom' || m === 'groupName') {
                    const hs = c.querySelector('.vp-highlight-selected');
                    if (hs && !hs.checked) hs.checked = true;
                }
            };
            modeSel.addEventListener('change', updateVis);
        }

        const textModeSel = c.querySelector('.vp-label-text-mode');
        if (textModeSel) {
            const uni = c.querySelector('.vp-label-text-uniform-item');
            textModeSel.addEventListener('change', () => {
                if (uni) uni.style.display = textModeSel.value === 'uniform' ? '' : 'none';
            });
        }
        const bgModeSel = c.querySelector('.vp-label-bg-mode');
        if (bgModeSel) {
            const uni = c.querySelector('.vp-label-bg-uniform-item');
            bgModeSel.addEventListener('change', () => {
                if (uni) uni.style.display = bgModeSel.value === 'uniform' ? '' : 'none';
            });
        }

        c.querySelectorAll('input, select, textarea').forEach(el => {
            const h = () => { readVolcanoPanel(app); if (app.state.currentSvg) app.drawChart(); };
            el.addEventListener('input', h);
            el.addEventListener('change', h);
        });
    }

    function buildLabelSet(pts, v) {
        const set = new Set();
        if (!v.labelShow && !v.highlightSelected) return set;

        if (v.labelMode === 'top') {
            const n = Math.max(1, Math.round(v.labelTopN));
            pts.filter(pt => pt.cat === 'up' && pt.id)
                .sort((a, b) => b.y - a.y).slice(0, n)
                .forEach(pt => set.add(pt));
            pts.filter(pt => pt.cat === 'down' && pt.id)
                .sort((a, b) => b.y - a.y).slice(0, n)
                .forEach(pt => set.add(pt));
        } else if (v.labelMode === 'custom') {
            const names = String(v.labelCustomNames || '')
                .split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
            const nameSet = new Set(names);
            pts.forEach(pt => { if (pt.id && nameSet.has(pt.id)) set.add(pt); });
        } else if (v.labelMode === 'group') {
            pts.forEach(pt => {
                if (pt.group && (pt.cat === 'up' || pt.cat === 'down')) set.add(pt);
            });
} else if (v.labelMode === 'groupName') {
    const names = String(v.labelGroupNames || '')
        .split(/[,，\n]+/).map(s => s.trim()).filter(Boolean);
    const nameSet = new Set(names);
    pts.forEach(pt => {
        if (pt.group && nameSet.has(pt.group) && (pt.cat === 'up' || pt.cat === 'down')) {
            set.add(pt);
        }
    });
}
        return set;
    }

    function drawChart(app) {
        const s = app.state;
        const v = s.volcano;
        app.toolbarTip.textContent = '';

        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.x || !s.roles.y) { app.showTip('msgTip3', T.selectCols, 'error'); return; }

        const groupCol = s.roles.group || '';
        const hasGroupCol = groupCol !== '';

        const pts = [];
        s.data.forEach(row => {
            const rawX = parseFloat(row[s.roles.x]);
            const rawY = parseFloat(row[s.roles.y]);
            if (!isFinite(rawX) || !isFinite(rawY)) return;
            const x = transformX(rawX, v.xTransform, v.xLogBase);
            const y = transformY(rawY, v.yTransform, v.yLogBase);
            if (!isFinite(x) || !isFinite(y)) return;

            const id = s.roles.name ? String(row[s.roles.name] == null ? '' : row[s.roles.name]) : '';
            const group = hasGroupCol
                ? String(row[groupCol] == null ? '' : row[groupCol]).trim()
                : '';

            pts.push({ x, y, id, group });
        });
        if (!pts.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const xLine = computeXLine(v);
        const yLine = computeYLine(v);

        pts.forEach(pt => {
            const sig = pt.y >= yLine;
            if (sig && pt.x >= xLine) pt.cat = 'up';
            else if (sig && pt.x <= -xLine) pt.cat = 'down';
            else pt.cat = 'normal';
        });

        const groupOrder = scanGroupNames(s);
        s.currentGroupOrder = groupOrder;

        const groupColors = resolveGroupColors(
            groupOrder,
            s.paletteName || 'tableau10',
            s.customColors,
            { reverse: s.reverse, cycleColors: s.cycleColors }
        );

        const labelSet = buildLabelSet(pts, v);

        function upDownColor(pt) {
            if (pt.cat === 'up') return v.upColor;
            if (pt.cat === 'down') return v.downColor;
            return v.normalColor;
        }

        function pointColor(pt) {
            const isSig = pt.cat === 'up' || pt.cat === 'down';

            if (pt.group) {
                if (isSig) {
                    if (v.highlightSelected) {
                        if (labelSet.has(pt)) {
                            return groupColors.get(pt.group) || upDownColor(pt);
                        }
                        return upDownColor(pt);
                    }
                    return groupColors.get(pt.group) || upDownColor(pt);
                }
                if (v.groupColorNonSig) {
                    return groupColors.get(pt.group) || v.normalColor;
                }
                return v.normalColor;
            }
            return upDownColor(pt);
        }

        function labelStyleOf(pt) {
            const gc = pt.group ? (groupColors.get(pt.group) || null) : null;

            let textColor;
            if (v.labelTextMode === 'uniform' || !gc) {
                textColor = v.labelTextUniform;
            } else {
                textColor = gc;
            }

            let showBg = v.labelBgMode !== 'none';
            let bgColor = null;
            let borderColor = v.labelBorderColor || '#000000';

            if (showBg) {
                if (v.labelBgMode === 'uniform' || !gc) {
                    bgColor = v.labelBgUniform;
                } else {
                    bgColor = gc;
                    borderColor = gc;
                }
            }
            return { textColor, showBg, bgColor, borderColor };
        }

        const p = PC.readCommonParams(app, { width: 800, height: 600 });
        const axisCfg = s.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        const margin = 30;
        const areaW = p.width - 2 * margin;
        const areaH = p.height - 2 * margin;

        const xLabelFont = axisCfg.x.tickValueShow ? axisCfg.x.tickFontSize : 0;
        const yLabelFont = axisCfg.y.tickValueShow ? axisCfg.y.tickFontSize : 0;
        const xTitleFont = (axisCfg.x.titleShow && axisCfg.x.titleContent) ? axisCfg.x.titleFontSize + 8 : 0;
        const yTitleFont = (axisCfg.y.titleShow && axisCfg.y.titleContent) ? axisCfg.y.titleFontSize + 8 : 0;

        const leftPad = yLabelFont + 10 + yTitleFont + 10;
        const bottomPad = xLabelFont + 12 + xTitleFont + 10;
        const rightPad = 30;
        const topPad = 20;

        const plotX = margin + leftPad;
        const plotY = margin + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, areaH - topPad - bottomPad);

        let maxAbsX = Math.max(1, xLine * 1.15);
        pts.forEach(pt => { maxAbsX = Math.max(maxAbsX, Math.abs(pt.x)); });
        let xDomain;
        if (axisCfg.x.domainAuto) {
            const r = niceCeil(maxAbsX);
            xDomain = [-r, r];
        } else {
            xDomain = [axisCfg.x.domainMin, axisCfg.x.domainMax];
        }

        let yMin = Infinity, yMax = -Infinity;
        pts.forEach(pt => {
            if (pt.y < yMin) yMin = pt.y;
            if (pt.y > yMax) yMax = pt.y;
        });
        if (!isFinite(yMin)) yMin = 0;
        if (!isFinite(yMax)) yMax = 1;
        yMin = Math.min(yMin, 0);
        yMax = Math.max(yMax, yLine, 1);
        const yDomain = PlotAxis.resolveDomain(axisCfg.y, [yMin, yMax * 1.05]);

        const xScaleRaw = d3.scaleLinear().domain(xDomain).range([plotX, plotX + plotW]);
        const xScale = PlotAxis.applyBreak(xScaleRaw, axisCfg.x);
        const xBreakPos = PlotAxis.getBreakPosition(xScale, axisCfg.x);

        const yScaleRaw = d3.scaleLinear().domain(yDomain).range([plotY + plotH, plotY]).nice();
        const yScale = PlotAxis.applyBreak(yScaleRaw, axisCfg.y);
        const yBreakPos = PlotAxis.getBreakPosition(yScale, axisCfg.y);

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        if (axisCfg.y.gridShow) {
            const gridY = svg.append('g').attr('class', 'grid grid-y');
            (yScale.ticks ? yScale.ticks() : yScale.domain()).forEach(t => {
                if (axisCfg.y.breakEnable && t > axisCfg.y.breakFrom && t < axisCfg.y.breakTo) return;
                const y = Math.round(yScale(t)) + 0.5;
                if (!isFinite(y)) return;
                gridY.append('line')
                    .attr('x1', plotX).attr('x2', plotX + plotW)
                    .attr('y1', y).attr('y2', y)
                    .attr('stroke', axisCfg.y.gridColor)
                    .attr('stroke-dasharray', axisCfg.y.gridDash)
                    .attr('stroke-width', 1);
            });
        }
        if (axisCfg.x.gridShow) {
            const gridX = svg.append('g').attr('class', 'grid grid-x');
            (xScale.ticks ? xScale.ticks() : xScale.domain()).forEach(t => {
                if (axisCfg.x.breakEnable && t > axisCfg.x.breakFrom && t < axisCfg.x.breakTo) return;
                const x = Math.round(xScale(t)) + 0.5;
                if (!isFinite(x)) return;
                gridX.append('line')
                    .attr('x1', x).attr('x2', x)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', axisCfg.x.gridColor)
                    .attr('stroke-dasharray', axisCfg.x.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        if (v.showThresholdLine) {
            const thG = svg.append('g').attr('class', 'volcano-thresholds');
            const dash = v.thresholdDash ? '6 4' : null;
            [-xLine, xLine].forEach(xv => {
                const px = Math.round(xScale(xv)) + 0.5;
                if (!isFinite(px) || px < plotX || px > plotX + plotW) return;
                thG.append('line')
                    .attr('x1', px).attr('x2', px)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', v.thresholdColor)
                    .attr('stroke-width', v.thresholdWidth)
                    .attr('stroke-dasharray', dash);
            });
            if (isFinite(yLine)) {
                const py = Math.round(yScale(yLine)) + 0.5;
                if (isFinite(py) && py >= plotY && py <= plotY + plotH) {
                    thG.append('line')
                        .attr('x1', plotX).attr('x2', plotX + plotW)
                        .attr('y1', py).attr('y2', py)
                        .attr('stroke', v.thresholdColor)
                        .attr('stroke-width', v.thresholdWidth)
                        .attr('stroke-dasharray', dash);
                }
            }
        }

        const leaderLen = 10;
        const offX = isFinite(v.labelLeaderOffsetX) ? v.labelLeaderOffsetX : 0;
        const offY = isFinite(v.labelLeaderOffsetY) ? v.labelLeaderOffsetY : 0;
        const leaderColor = v.labelLeaderColor || '#999999';

        const labelItems = [];
        if (v.labelShow && labelSet.size) {
            labelSet.forEach(pt => {
                if (pointColor(pt) === null) return;
                const px = xScale(pt.x);
                const py = yScale(pt.y);
                if (!isFinite(px) || !isFinite(py)) return;

                let side;
                if (pt.cat === 'down') side = 'left';
                else if (pt.cat === 'up') side = 'right';
                else side = pt.x >= 0 ? 'right' : 'left';
                const dir = side === 'left' ? -1 : 1;

                const st = labelStyleOf(pt);
                const r = v.pointSize / 2;
                const lineEndX = px + dir * (r + leaderLen + offX);
                const lineEndY = py + offY;
                const textX = lineEndX + dir * 2;

                labelItems.push({
                    pt: pt,
                    px: px,
                    py: py,
                    lineEndX: lineEndX,
                    lineEndY: lineEndY,
                    textX: textX,
                    textY: lineEndY,
                    anchor: side === 'left' ? 'end' : 'start',
                    st: st
                });
            });
        }

        if (labelItems.length) {
            const defs = svg.append('defs');
            const linesG = svg.append('g').attr('class', 'volcano-labels-lines');
            const r = v.pointSize / 2;
            labelItems.forEach((it, idx) => {
                const maskId = 'vlmask-028-' + idx + '-' + Math.random().toString(36).slice(2, 8);
                const mask = defs.append('mask')
                    .attr('id', maskId)
                    .attr('maskUnits', 'userSpaceOnUse')
                    .attr('x', 0).attr('y', 0)
                    .attr('width', p.width).attr('height', p.height);
                mask.append('rect')
                    .attr('x', 0).attr('y', 0)
                    .attr('width', p.width).attr('height', p.height)
                    .attr('fill', 'white');
                mask.append('circle')
                    .attr('cx', it.px).attr('cy', it.py).attr('r', r)
                    .attr('fill', 'black');

                linesG.append('line')
                    .attr('x1', it.px).attr('y1', it.py)
                    .attr('x2', it.lineEndX).attr('y2', it.lineEndY)
                    .attr('mask', 'url(#' + maskId + ')')
                    .attr('stroke', leaderColor)
                    .attr('stroke-width', 1)
                    .attr('stroke-linecap', 'round');
            });
        }

        const ptsG = svg.append('g').attr('class', 'volcano-points');
        pts.forEach(pt => {
            const color = pointColor(pt);
            if (color === null) return;
            const px = xScale(pt.x);
            const py = yScale(pt.y);
            if (!isFinite(px) || !isFinite(py)) return;
            ptsG.append('circle')
                .attr('cx', px).attr('cy', py)
                .attr('r', v.pointSize / 2)
                .attr('fill', color)
                .attr('opacity', v.pointAlpha);
        });

        if (labelItems.length) {
            const textG = svg.append('g').attr('class', 'volcano-labels-text');
            labelItems.forEach(it => {
                const gLabel = textG.append('g');
                const txt = gLabel.append('text')
                    .attr('x', it.textX).attr('y', it.textY)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', it.anchor)
                    .attr('font-size', v.labelFontSize)
                    .attr('font-weight', v.labelBold ? 'bold' : 'normal')
                    .attr('font-style', v.labelItalic ? 'italic' : 'normal')
                    .attr('fill', it.st.textColor)
                    .text(it.pt.id);

                if (it.st.showBg) {
                    let bb = null;
                    try { bb = txt.node().getBBox(); } catch (e) { bb = null; }
                    if (bb) {
                        gLabel.insert('rect', 'text')
                            .attr('x', bb.x - 3).attr('y', bb.y - 2)
                            .attr('width', bb.width + 6).attr('height', bb.height + 4)
                            .attr('rx', 2)
                            .attr('fill', it.st.bgColor)
                            .attr('stroke', it.st.borderColor)
                            .attr('stroke-width', 1);
                    }
                }
            });
        }
        const xAxisFn = d3.axisBottom(xScale);
        const xTicks = PlotAxis.resolveTicks(axisCfg.x, xScale);
        if (xTicks && xTicks.length) xAxisFn.tickValues(xTicks);
        const xAxisG = svg.append('g').attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + (plotY + plotH) + ')')
            .call(xAxisFn);
        xAxisG.selectAll('.tick').attr('transform', function (d) {
            const x = Math.round(xScale(d)) + 0.5;
            return 'translate(' + x + ',0)';
        });
        PlotAxis.applyAxis(xAxisG, axisCfg.x, 'bottom', xBreakPos);

        const yAxisFn = d3.axisLeft(yScale);
        const yTicks = PlotAxis.resolveTicks(axisCfg.y, yScale);
        let yTickValues = yTicks;
        if (!yTickValues) {
            yTickValues = yScale.ticks ? yScale.ticks() : null;
            if (axisCfg.y.breakEnable && yTickValues) {
                yTickValues = yTickValues.filter(t => !(t > axisCfg.y.breakFrom && t < axisCfg.y.breakTo));
            }
        }
        if (yTickValues && yTickValues.length) yAxisFn.tickValues(yTickValues);
        const yAxisG = svg.append('g').attr('class', 'y-axis')
            .attr('transform', 'translate(' + plotX + ',0)')
            .call(yAxisFn);
        yAxisG.selectAll('.tick').attr('transform', function (d) {
            const y = Math.round(yScale(d)) + 0.5;
            return 'translate(0,' + y + ')';
        });
        PlotAxis.applyAxis(yAxisG, axisCfg.y, 'left', yBreakPos);

        if (axisCfg.x.titleShow && axisCfg.x.titleContent) {
            svg.append('text')
                .attr('x', plotX + plotW / 2)
                .attr('y', plotY + plotH + bottomPad - 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', axisCfg.x.titleFontSize)
                .attr('font-weight', axisCfg.x.titleBold ? 'bold' : 'normal')
                .attr('font-style', axisCfg.x.titleItalic ? 'italic' : 'normal')
                .attr('fill', '#333')
                .text(axisCfg.x.titleContent);
        }
        if (axisCfg.y.titleShow && axisCfg.y.titleContent) {
            svg.append('text')
                .attr('transform', 'translate(' + (plotX - leftPad + 12) + ',' + (plotY + plotH / 2) + ') rotate(-90)')
                .attr('text-anchor', 'middle')
                .attr('font-size', axisCfg.y.titleFontSize)
                .attr('font-weight', axisCfg.y.titleBold ? 'bold' : 'normal')
                .attr('font-style', axisCfg.y.titleItalic ? 'italic' : 'normal')
                .attr('fill', '#333')
                .text(axisCfg.y.titleContent);
        }

        PlotAxis.drawFrameAndRefLines(svg, {
            plotX: plotX, plotY: plotY, plotW: plotW, plotH: plotH,
            xScale: xScale, yScale: yScale, axisCfg: axisCfg
        });

        if (p.showLegend) {
            const items = [];
            const colors = [];
            const usedGroup = new Set();
            const usedUp = { v: false }, usedDown = { v: false }, usedNormal = { v: false };

            pts.forEach(pt => {
                const c = pointColor(pt);
                if (c === null) return;
                if (pt.group && c === groupColors.get(pt.group)) {
                    usedGroup.add(pt.group);
                } else if (c === v.upColor) {
                    usedUp.v = true;
                } else if (c === v.downColor) {
                    usedDown.v = true;
                } else if (c === v.normalColor) {
                    usedNormal.v = true;
                }
            });

            usedGroup.forEach(g => {
                const count = pts.filter(pt => pt.group === g && pointColor(pt) === groupColors.get(g)).length;
                items.push({ name: g + (v.showCount ? ' (' + count + ')' : '') });
                colors.push(groupColors.get(g));
            });

            const showUnclassified = !hasGroupCol || v.showUnclassifiedLegend;
            if (showUnclassified) {
                if (usedUp.v) {
                    const cnt = pts.filter(pt => pt.cat === 'up' && pointColor(pt) === v.upColor).length;
                    items.push({ name: v.upLabel + (v.showCount ? ' (' + cnt + ')' : '') });
                    colors.push(v.upColor);
                }
                if (usedDown.v) {
                    const cnt = pts.filter(pt => pt.cat === 'down' && pointColor(pt) === v.downColor).length;
                    items.push({ name: v.downLabel + (v.showCount ? ' (' + cnt + ')' : '') });
                    colors.push(v.downColor);
                }
                if (usedNormal.v) {
                    const cnt = pts.filter(pt => pt.cat === 'normal' && pointColor(pt) === v.normalColor).length;
                    items.push({ name: v.normalLabel + (v.showCount ? ' (' + cnt + ')' : '') });
                    colors.push(v.normalColor);
                }
            }

            if (items.length) {
                PC.drawLegendOverlay(svg, {
                    p: p,
                    items: items,
                    colors: colors,
                    shape: 'circle',
                    labelFormatter: it => it.name
                });
            }
        }

        PlotAxis.applyFontFamily(svg, p.fontFamily);

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    PlotApp.create({
        exportName: 'volcano_grouped_plot',
        exampleData: EX_DATA,
        importInfo: EN
            ? 'Must include a header row with a <strong>numeric X column (FC / logFC)</strong> and a <strong>numeric Y column (p / q / -log)</strong>. A <strong>name column</strong> and a <strong>group column</strong> (e.g. pathway) are optional.'
            : '需包含表头，至少包含一个<strong>数值X列（FC / logFC）</strong>和一个<strong>数值Y列（p / q / -log）</strong>；<strong>名称列</strong>和<strong>分组列</strong>（如通路）可选。',

        stateExtra: {
            roles: { x: '', y: '', name: '', group: '' },
            columnTypes: {},
            axis: (function () {
                const a = PlotAxis.defaultState();
                a.x.titleEdited = false;
                a.y.titleEdited = false;
                return a;
            })(),
            volcano: null,
            currentGroupOrder: []
        },

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) input.value = '';
        },

        refreshColors: function (app) {
            refreshGroupColorAssign(app);
            refreshUnclassifiedColorAssign(app);
        },

        onPaletteChanged: function (app) {
            refreshGroupColorAssign(app);
        },

        setup: function (app) {
            injectPageStyle();
            const s = app.state;
            s.volcano = mergeVolcanoState(s.volcano);

            syncAxisTitles(app);
            fillRoleSelects(app);
            renderTransformPanel(app);
            refreshAxisPanel(app);
            renderVolcanoPanel(app);
            refreshGroupColorAssign(app);
            refreshUnclassifiedColorAssign(app);
            updateGroupPaletteVisibility(app);

            ['xColSel', 'yColSel', 'nameColSel', 'groupColSel'].forEach(id => {
                const el = app.$(id);
                if (!el) return;
                el.addEventListener('change', () => {
                    if (id === 'xColSel') s.roles.x = el.value;
                    if (id === 'yColSel') s.roles.y = el.value;
                    if (id === 'nameColSel') s.roles.name = el.value;
                    if (id === 'groupColSel') s.roles.group = el.value;
                    syncAxisTitles(app);
                    refreshAxisPanel(app);
                    refreshGroupColorAssign(app);
                    renderVolcanoPanel(app);
                    updateGroupPaletteVisibility(app);
                    if (s.currentSvg) app.drawChart();
                });
            });
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = res.columnTypes || {};
            const types = s.columnTypes;
            const nums = res.headers.filter(h => types[h] === 'numeric');
            const cats = res.headers.filter(h => types[h] !== 'numeric');

            s.roles.x = nums[0] || res.headers[0];
            s.roles.y = nums[1] || nums[0] || res.headers[1] || res.headers[0];
            s.roles.name = cats[0] || '';
            s.roles.group = cats.find(h => h !== s.roles.name) || '';

            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            s.volcano = mergeVolcanoState(s.volcano);

            syncAxisTitles(app);
            fillRoleSelects(app);
            renderTransformPanel(app);
            refreshAxisPanel(app);
            renderVolcanoPanel(app);
            refreshGroupColorAssign(app);
            refreshUnclassifiedColorAssign(app);
            updateGroupPaletteVisibility(app);
        },

        onReset: function (app) {
            const s = app.state;
            s.columnTypes = {};
            s.roles = { x: '', y: '', name: '', group: '' };
            s.axis = PlotAxis.defaultState();
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            s.volcano = defaultVolcanoSettings();
            s.currentGroupOrder = [];
            s.customColors = {};

            fillRoleSelects(app);
            syncAxisTitles(app);
            renderTransformPanel(app);
            refreshAxisPanel(app);
            renderVolcanoPanel(app);
            refreshGroupColorAssign(app);
            refreshUnclassifiedColorAssign(app);
            updateGroupPaletteVisibility(app);
        },

        onStateRestored: function (app) {
            app.state.volcano = mergeVolcanoState(app.state.volcano);
            fillRoleSelects(app);
            renderTransformPanel(app);
            refreshAxisPanel(app);
            renderVolcanoPanel(app);
            refreshGroupColorAssign(app);
            refreshUnclassifiedColorAssign(app);
            updateGroupPaletteVisibility(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
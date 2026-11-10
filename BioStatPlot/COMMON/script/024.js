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

        transformTip: EN
            ? '<strong>X:</strong> choose "Already log-transformed" when X is logFC (the column value is used as-is); choose "Not log-transformed" when X is raw FC, and set the base so the column will be log-transformed. '
              + '<strong>Y:</strong> choose "Already -log-transformed" when Y is already -log(p), and specify the base used at the time of transformation so that P thresholds can be converted onto the Y axis; choose "Not -log-transformed" when Y is raw p-value, and set the base.'
            : '<strong>X轴：</strong>若X列已是logFC，选择“已进行对数转换（维持原值）”直接使用；若X列是原始FC，选择“未对数转换（需取对数）”，并设置转换底数。'
              + '<strong>Y轴：</strong>若Y列已是-log(p)，选择“已进行负对数转换（维持原值）”，同时给出当时使用的底数，以便将P阈值换算到Y轴上；若Y列是原始p值，选择“未负对数转换（需取负对数）”，并设置底数。'
    };

    function makeExampleData() {
        const rows = ['Gene\tLog2FC\tPvalue'];
        let seed = 20240501;
        function rand() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        }
        for (let i = 1; i <= 220; i++) {
            const x = (rand() - 0.5) * 8;
            let p = Math.pow(10, -(rand() * 6 + Math.abs(x) * 0.85));
            p = Math.min(0.99, Math.max(1e-9, p));
            rows.push('GENE' + i + '\t' + x.toFixed(2) + '\t' + p.toExponential(2));
        }
        return rows.join('\n');
    }
    const EX_DATA = makeExampleData();

    function injectVolcanoStyle() {
        if (document.getElementById('volcano-page-style')) return;
        const s = document.createElement('style');
        s.id = 'volcano-page-style';
        s.textContent = `
#volcanoPanelContainer .param-grid,
#transformPanelContainer .param-grid { row-gap: 10px; }
#volcanoPanelContainer .param-item input[type="color"],
#transformPanelContainer .param-item input[type="color"] {
    width: 50px !important;
    min-width: 50px !important;
    max-width: 50px !important;
    flex: 0 0 50px !important;
    height: 30px !important;
    padding: 3px !important;
    box-sizing: border-box;
}
#volcanoPanelContainer .vp-label-topn-item,
#volcanoPanelContainer .vp-label-custom-item { margin-top: 14px; margin-bottom: 10px; }
#volcanoPanelContainer .vp-label-color-row { margin-top: 8px; }
#transformPanelContainer .vt-row { margin-top: 6px; }
#transformPanelContainer .vt-row:first-of-type { margin-top: 0; }
#transformPanelContainer .vt-base-item { min-width: 110px; }

#colorAssignContainer .color-assign-item { padding: 4px 8px !important; gap: 4px !important; }
#colorAssignContainer .color-assign-item input[type="color"] {
    width: 22px !important; height: 22px !important; min-width: 22px !important; padding: 0 !important;
}
#colorAssignContainer .color-assign-item .cat-name { font-size: 12px !important; }
`;
        document.head.appendChild(s);
    }

    const DEFAULT_TEXT_COLOR_NO_BG = { up: '#e15759', down: '#4e79a7', normal: '#666666' };
    const DEFAULT_TEXT_COLOR_WITH_BG = { up: '#ffffff', down: '#ffffff', normal: '#333333' };

    function defaultVolcanoSettings() {
        return {
            xTransform: 'keepLog',
            xLogBase: 2,
            yTransform: 'needNegLog',
            yLogBase: 10,

            xThreshold: 1,
            pThreshold: 0.05,
            showThresholdLine: true,
            thresholdColor: '#888888',
            thresholdWidth: 1,
            thresholdDash: true,

            upColor: '#e15759',
            downColor: '#4e79a7',
            normalColor: '#cccccc',
            pointSize: 5,
            pointAlpha: 0.8,

            labelShow: true,
            labelMode: 'top',
            labelTopN: 3,
            labelCustomNames: '',
            labelFontSize: 11,
            labelBold: true,
            labelItalic: false,
            labelShowBg: false,
            labelTextColor: Object.assign({}, DEFAULT_TEXT_COLOR_NO_BG),
            labelBgColor: { up: '#e15759', down: '#4e79a7', normal: '#ffffff' },
            labelBorderColor: '#000000',
            labelLeaderColor: '#999999',
            labelLeaderOffsetX: 0,
            labelLeaderOffsetY: 0,

            showCount: true,
            upLabel: 'Up',
            downLabel: 'Down',
            normalLabel: 'Normal'
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

        out.labelTextColor = Object.assign({}, d.labelTextColor, st.labelTextColor || {});
        out.labelBgColor = Object.assign({}, d.labelBgColor, st.labelBgColor || {});

        if (out.labelBorderColor && typeof out.labelBorderColor === 'object') {
            out.labelBorderColor = out.labelBorderColor.up || d.labelBorderColor;
        }
        if (typeof out.labelBorderColor !== 'string' || !out.labelBorderColor) {
            out.labelBorderColor = d.labelBorderColor;
        }

        if (!out.labelShowBg) {
            ['up', 'down', 'normal'].forEach(function (k) {
                if (out.labelTextColor[k] === '#ffffff') {
                    out.labelTextColor[k] = d.labelTextColor[k];
                }
            });
        }
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
        let n;
        if (f <= 1) n = 1;
        else if (f <= 2) n = 2;
        else if (f <= 5) n = 5;
        else n = 10;
        return n * base;
    }

    function fillRoleSelects(app) {
        const s = app.state;
        const xSel = app.$('xColSel');
        const ySel = app.$('yColSel');
        const nSel = app.$('nameColSel');
        if (!xSel || !ySel || !nSel) return;

        if (!s.headers.length) {
            xSel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            ySel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            nSel.innerHTML = '<option value="">' + T.noName + '</option>';
            xSel.disabled = ySel.disabled = nSel.disabled = true;
            return;
        }
        xSel.disabled = ySel.disabled = nSel.disabled = false;

        const types = s.columnTypes || {};
        const nums = s.headers.filter(function (h) { return types[h] === 'numeric'; });

        xSel.innerHTML = nums.map(function (h) {
            return '<option value="' + PC.escapeHtml(h) + '"' +
                (h === s.roles.x ? ' selected' : '') + '>' + PC.escapeHtml(h) + '</option>';
        }).join('') || '<option value="">' + T.noDataPlaceholder + '</option>';

        ySel.innerHTML = nums.map(function (h) {
            return '<option value="' + PC.escapeHtml(h) + '"' +
                (h === s.roles.y ? ' selected' : '') + '>' + PC.escapeHtml(h) + '</option>';
        }).join('') || '<option value="">' + T.noDataPlaceholder + '</option>';

        nSel.innerHTML = '<option value="">' + T.noName + '</option>' + s.headers.map(function (h) {
            return '<option value="' + PC.escapeHtml(h) + '"' +
                (h === s.roles.name ? ' selected' : '') + '>' + PC.escapeHtml(h) + '</option>';
        }).join('');
    }

    function renderTransformPanel(app) {
        injectVolcanoStyle();
        const s = app.state;
        const v = s.volcano;
        const c = app.$('transformPanelContainer');
        if (!c) return;

        const xThTip = EN
            ? (v.xTransform === 'keepLog'
                ? ''
                : '')
            : (v.xTransform === 'keepLog'
                ? ''
                : '');

        const infoHtml = T.transformTip + xThTip;

        c.className = 'param-panel';
        c.innerHTML = ''
            + '<div class="param-panel-title">' + T.transformTitle + '</div>'

            /* X 转换一行 */
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

            /* Y 转换一行 */
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

            /* 阈值 */
            + '<div class="axis-subsection">' + T.thresholdSection + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label>' + T.xThLabel + '</label>'
            + '    <input type="number" class="vp-x-threshold" value="' + v.xThreshold + '" step="0.01"></div>'
            + '  <div class="param-item"><label>' + T.pThLabel + '</label>'
            + '    <input type="number" class="vp-p-threshold" value="' + v.pThreshold + '" step="0.001" min="0"></div>'
            + '  <div class="param-item" style="grid-column: span 2;"><label class="mini-check">'
            + '    <input type="checkbox" class="vp-show-threshold" ' + (v.showThresholdLine ? 'checked' : '') + '>'
            + '    ' + T.showLineLabel + '</label></div>'
            + '  <div class="param-item"><label>' + T.lineColorLabel + '</label>'
            + '    <input type="color" class="vp-threshold-color" value="' + v.thresholdColor + '"></div>'
            + '  <div class="param-item"><label>' + T.lineWidthLabel + '</label>'
            + '    <input type="number" class="vp-threshold-width" value="' + v.thresholdWidth + '" min="0.5" max="6" step="0.5"></div>'
            + '  <div class="param-item"><label class="mini-check"><input type="checkbox" class="vp-threshold-dash" '
            + (v.thresholdDash ? 'checked' : '') + '>' + T.dashLabel + '</label></div>'
            + '</div>'

            + '<div class="info-box" style="margin-top:10px;">' + infoHtml + '</div>';

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

function fire() { if (s.currentSvg) app.drawChart(); }
function syncTitleAndRedraw() {
    syncAxisTitles(app);
    updateAxisTitleInputs(app);
    fire();
}

xSel.addEventListener('change', function () {
    v.xTransform = xSel.value;
    xBaseItem.style.display = (v.xTransform === 'needLog') ? '' : 'none';
    syncTitleAndRedraw();
});
ySel.addEventListener('change', function () {
    v.yTransform = ySel.value;
    syncTitleAndRedraw();
});
xBaseEl.addEventListener('input', function () {
    const n = parseFloat(xBaseEl.value);
    v.xLogBase = isFinite(n) && n > 0 ? n : 2;
    syncTitleAndRedraw();
});
yBaseEl.addEventListener('input', function () {
    const n = parseFloat(yBaseEl.value);
    v.yLogBase = isFinite(n) && n > 0 ? n : 10;
    syncTitleAndRedraw();
});
        xThEl.addEventListener('input', function () {
            const n = parseFloat(xThEl.value);
            v.xThreshold = isFinite(n) ? n : v.xThreshold;
            fire();
        });
        pThEl.addEventListener('input', function () {
            const n = parseFloat(pThEl.value);
            v.pThreshold = Math.max(0, isFinite(n) ? n : v.pThreshold);
            fire();
        });
        showThEl.addEventListener('change', function () {
            v.showThresholdLine = showThEl.checked;
            fire();
        });
        colorThEl.addEventListener('input', function () {
            v.thresholdColor = colorThEl.value;
            fire();
        });
        widthThEl.addEventListener('change', function () {
            const n = parseFloat(widthThEl.value);
            v.thresholdWidth = Math.max(0.5, isFinite(n) ? n : v.thresholdWidth);
            fire();
        });
        dashThEl.addEventListener('change', function () {
            v.thresholdDash = dashThEl.checked;
            fire();
        });
    }

    function refreshColorAssign(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const v = app.state.volcano;
        const items = [
            { name: v.upLabel, color: v.upColor },
            { name: v.downLabel, color: v.downColor },
            { name: v.normalLabel, color: v.normalColor }
        ];
        PC.renderColorAssignment(container, {
            items: items,
            onChange: function (idx, c) {
                if (idx === 0) v.upColor = c;
                else if (idx === 1) v.downColor = c;
                else v.normalColor = c;
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: function () {
                const d = defaultVolcanoSettings();
                v.upColor = d.upColor;
                v.downColor = d.downColor;
                v.normalColor = d.normalColor;
                refreshColorAssign(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    function refreshAxisPanel(app) {
        const panel = app.$('axisPanelContainer');
        if (!panel) return;
        PlotAxis.render(panel, {
            state: app.state.axis,
            direction: 'vertical',
            axisTypes: { x: 'numeric', y: 'numeric' },
            onGlobalFontChange: function () {
                if (app.state.currentSvg) app.drawChart();
            },
            onChange: function () {
                if (app.state.currentSvg) app.drawChart();
            },
            onDirectionChange: function () {
                if (app.state.currentSvg) app.drawChart();
            }
        });
        const dir = panel.querySelector('.axis-direction-block');
        if (dir) dir.style.display = 'none';
        ['x', 'y'].forEach(function (k) {
            const input = panel.querySelector('.ax-' + k + '-title');
            if (input) {
                input.addEventListener('input', function () {
                    app.state.axis[k].titleEdited = true;
                });
            }
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
        s.axis.x.titleContent = (v.xTransform === 'needLog')
            ? 'Log' + xBase + '(Fold Change)'
            : xCol;
    }
    if (!s.axis.y.titleEdited) {
        const useP = !yCol || /^p/i.test(yCol);
        s.axis.y.titleContent = '-Log' + yBase + (useP ? '(p)' : '(FDR)');
    }
}

function updateAxisTitleInputs(app) {
    const panel = app.$('axisPanelContainer');
    if (!panel) return;
    ['x', 'y'].forEach(function (k) {
        const input = panel.querySelector('.ax-' + k + '-title');
        if (input) input.value = app.state.axis[k].titleContent || '';
    });
}

    function renderVolcanoPanel(app) {
        injectVolcanoStyle();
        const s = app.state;
        const v = s.volcano;
        const c = app.$('volcanoPanelContainer');
        if (!c) return;
        const esc = PC.escapeHtml;

        const secPoint = EN ? 'Points' : '点样式';
        const secLabel = EN ? 'Labels' : '标签样式';
        const secLegend = EN ? 'Legend' : '图例样式';

        const pointSizeLabel = EN ? 'Size' : '大小';
        const pointAlphaLabel = EN ? 'Alpha' : '透明度';

        const showLabelsLabel = EN ? 'Show labels' : '显示标签';
        const labelModeLabel = EN ? 'Source' : '标签来源';
        const labelModeTop = EN ? 'Auto Top N' : '自动Top N';
        const labelModeCustom = EN ? 'Custom names' : '自定义名称';
        const labelTopNLabel = EN ? 'Top N per direction' : '每方向Top N';
        const labelCustomLabel = EN ? 'Custom names (comma-separated)' : '自定义名称（逗号分隔）';
        const labelFsLabel = EN ? 'Font size' : '字号';
        const labelBoldLabel = EN ? 'Bold' : '加粗';
        const labelItalicLabel = EN ? 'Italic' : '斜体';
        const labelBgLabel = EN ? 'Show background box' : '显示背景框';
        const borderColorLabel = EN ? 'Border color' : '边框色';

        const leaderColorLabel = EN ? 'Leader color' : '引导线颜色';
        const leaderOffsetXLabel = EN ? 'Leader offset X' : '引导线水平偏移';
        const leaderOffsetYLabel = EN ? 'Leader offset Y' : '引导线垂直偏移';

        const upLabel = EN ? 'Up' : '上调';
        const downLabel = EN ? 'Down' : '下调';
        const normalLabel = EN ? 'Normal' : '不显著';
        const textColorLabel = EN ? 'Text' : '文字色';
        const bgColorLabel = EN ? 'Background' : '背景色';

        const showCountLabel = EN ? 'Show counts' : '显示项目数';
        const upTextLabel = EN ? 'Up label' : '上调文字';
        const downTextLabel = EN ? 'Down label' : '下调文字';
        const normalTextLabel = EN ? 'Normal label' : '不显著文字';

        const infoText = EN
            ? '<strong>Note:</strong> Labels for <strong>down-regulated</strong> points are placed on the <strong>left</strong>, and for <strong>up-regulated</strong> points on the <strong>right</strong>, connected by a short leader line. Positive X-offset extends the leader outwards (left for down, right for up); positive Y-offset moves it downwards. Custom names must match values in the name column.'
            : '<strong>说明：</strong>标签中<strong>下调点在左、上调点在右</strong>，通过短引导线连接。引导线水平偏移正值向外延伸（下调向左、上调向右），垂直偏移正值向下移动；自定义名称需与名称列中的值一致。';

        function colorRow(key, label) {
            return ''
                + '<div class="param-grid cols-4 vp-label-color-row">'
                + '  <div class="param-item"><label>' + label + ' · ' + textColorLabel + '</label>'
                + '    <input type="color" class="vp-label-text-' + key + '" value="' + v.labelTextColor[key] + '"></div>'
                + '  <div class="param-item"><label>' + label + ' · ' + bgColorLabel + '</label>'
                + '    <input type="color" class="vp-label-bg-' + key + '" value="' + v.labelBgColor[key] + '"></div>'
                + '</div>';
        }

        c.className = 'param-panel';
        c.innerHTML = ''
            + '<div class="param-panel-title">' + (EN ? 'Volcano Plot Settings' : '火山图设置') + '</div>'

            /* 点 */
            + '<div class="axis-subsection">' + secPoint + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label>' + pointSizeLabel + '</label>'
            + '    <input type="number" class="vp-point-size" value="' + v.pointSize + '" min="1" max="20" step="0.5"></div>'
            + '  <div class="param-item"><label>' + pointAlphaLabel + '</label>'
            + '    <input type="number" class="vp-point-alpha" value="' + v.pointAlpha + '" min="0" max="1" step="0.05"></div>'
            + '</div>'

            /* 标签 */
            + '<div class="axis-subsection">' + secLabel + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label class="mini-check"><input type="checkbox" class="vp-label-show" '
            + (v.labelShow ? 'checked' : '') + '>' + showLabelsLabel + '</label></div>'
            + '  <div class="param-item"><label>' + labelModeLabel + '</label>'
            + '    <select class="vp-label-mode">'
            + '      <option value="top" ' + (v.labelMode === 'top' ? 'selected' : '') + '>' + labelModeTop + '</option>'
            + '      <option value="custom" ' + (v.labelMode === 'custom' ? 'selected' : '') + '>' + labelModeCustom + '</option>'
            + '    </select></div>'
            + '  <div class="param-item"><label>' + labelFsLabel + '</label>'
            + '    <input type="number" class="vp-label-fs" value="' + v.labelFontSize + '" min="6" max="36" step="1"></div>'
            + '  <div class="param-item"><label class="mini-check"><input type="checkbox" class="vp-label-bold" '
            + (v.labelBold ? 'checked' : '') + '>' + labelBoldLabel + '</label>'
            + '    <label class="mini-check" style="margin-left:12px;"><input type="checkbox" class="vp-label-italic" '
            + (v.labelItalic ? 'checked' : '') + '>' + labelItalicLabel + '</label></div>'
            + '</div>'
            + '<div class="param-grid cols-4 vp-label-topn-item" style="' + (v.labelMode === 'top' ? '' : 'display:none;') + '">'
            + '  <div class="param-item" style="grid-column: span 4;"><label>' + labelTopNLabel + '</label>'
            + '    <input type="number" class="vp-label-topn" value="' + v.labelTopN + '" min="1" max="100" step="1"></div>'
            + '</div>'
            + '<div class="param-grid cols-4 vp-label-custom-item" style="' + (v.labelMode === 'custom' ? '' : 'display:none;') + '">'
            + '  <div class="param-item" style="grid-column: span 4;"><label>' + labelCustomLabel + '</label>'
            + '    <input type="text" class="vp-label-custom" value="' + esc(v.labelCustomNames) + '"></div>'
            + '</div>'

            /* 标签样式 */
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item" style="grid-column: span 2;"><label class="mini-check">'
            + '    <input type="checkbox" class="vp-label-bg" ' + (v.labelShowBg ? 'checked' : '') + '>'
            + '    ' + labelBgLabel + '</label></div>'
            + '  <div class="param-item"><label>' + borderColorLabel + '</label>'
            + '    <input type="color" class="vp-label-border" value="' + v.labelBorderColor + '"></div>'
            + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label>' + leaderColorLabel + '</label>'
            + '    <input type="color" class="vp-leader-color" value="' + v.labelLeaderColor + '"></div>'
            + '  <div class="param-item"><label>' + leaderOffsetXLabel + '</label>'
            + '    <input type="number" class="vp-leader-offset-x" value="' + v.labelLeaderOffsetX + '" min="-30" max="30" step="1"></div>'
            + '  <div class="param-item"><label>' + leaderOffsetYLabel + '</label>'
            + '    <input type="number" class="vp-leader-offset-y" value="' + v.labelLeaderOffsetY + '" min="-30" max="30" step="1"></div>'
            + '</div>'

            + colorRow('up', upLabel)
            + colorRow('down', downLabel)
            + colorRow('normal', normalLabel)

            /* 图例 */
            + '<div class="axis-subsection">' + secLegend + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item"><label class="mini-check"><input type="checkbox" class="vp-show-count" '
            + (v.showCount ? 'checked' : '') + '>' + showCountLabel + '</label></div>'
            + '  <div class="param-item"><label>' + upTextLabel + '</label>'
            + '    <input type="text" class="vp-up-label" value="' + esc(v.upLabel) + '"></div>'
            + '  <div class="param-item"><label>' + downTextLabel + '</label>'
            + '    <input type="text" class="vp-down-label" value="' + esc(v.downLabel) + '"></div>'
            + '  <div class="param-item"><label>' + normalTextLabel + '</label>'
            + '    <input type="text" class="vp-normal-label" value="' + esc(v.normalLabel) + '"></div>'
            + '</div>'

            + '<div class="info-box" style="margin-top:12px;">' + infoText + '</div>';

        bindVolcanoPanelEvents(app);
    }

    function readVolcanoPanel(app) {
        const c = app.$('volcanoPanelContainer');
        if (!c) return;
        const v = app.state.volcano;
        const q = function (s) { return c.querySelector(s); };
        const qv = function (s, fb) { const e = q(s); return e ? e.value : fb; };
        const qc = function (s, fb) { const e = q(s); return e ? e.checked : fb; };
        const qn = function (s, fb) {
            const e = q(s);
            if (!e) return fb;
            const n = parseFloat(e.value);
            return isFinite(n) ? n : fb;
        };

        v.pointSize = Math.max(1, qn('.vp-point-size', v.pointSize));
        v.pointAlpha = Math.max(0, Math.min(1, qn('.vp-point-alpha', v.pointAlpha)));

        v.labelShow = qc('.vp-label-show', v.labelShow);
        v.labelMode = qv('.vp-label-mode', v.labelMode);
        v.labelTopN = Math.max(1, Math.round(qn('.vp-label-topn', v.labelTopN)));
        v.labelCustomNames = qv('.vp-label-custom', v.labelCustomNames);
        v.labelFontSize = Math.max(6, qn('.vp-label-fs', v.labelFontSize));
        v.labelBold = qc('.vp-label-bold', v.labelBold);
        v.labelItalic = qc('.vp-label-italic', v.labelItalic);
        v.labelShowBg = qc('.vp-label-bg', v.labelShowBg);

        v.labelBorderColor = qv('.vp-label-border', v.labelBorderColor) || '#000000';
        v.labelLeaderColor = qv('.vp-leader-color', v.labelLeaderColor) || '#999999';
        v.labelLeaderOffsetX = qn('.vp-leader-offset-x', v.labelLeaderOffsetX);
        v.labelLeaderOffsetY = qn('.vp-leader-offset-y', v.labelLeaderOffsetY);

        ['up', 'down', 'normal'].forEach(function (k) {
            v.labelTextColor[k] = qv('.vp-label-text-' + k, v.labelTextColor[k]);
            v.labelBgColor[k] = qv('.vp-label-bg-' + k, v.labelBgColor[k]);
        });

        v.showCount = qc('.vp-show-count', v.showCount);
        v.upLabel = qv('.vp-up-label', v.upLabel) || 'Up';
        v.downLabel = qv('.vp-down-label', v.downLabel) || 'Down';
        v.normalLabel = qv('.vp-normal-label', v.normalLabel) || 'Normal';
    }

    function bindVolcanoPanelEvents(app) {
        const c = app.$('volcanoPanelContainer');
        if (!c) return;

        const modeSel = c.querySelector('.vp-label-mode');
        function updateVis() {
            const isTop = modeSel.value === 'top';
            c.querySelectorAll('.vp-label-topn-item').forEach(function (el) {
                el.style.display = isTop ? '' : 'none';
            });
            c.querySelectorAll('.vp-label-custom-item').forEach(function (el) {
                el.style.display = isTop ? 'none' : '';
            });
        }
        if (modeSel) modeSel.addEventListener('change', updateVis);

        const bgCb = c.querySelector('.vp-label-bg');
        if (bgCb) {
            bgCb.addEventListener('change', function () {
                const on = bgCb.checked;
                const v = app.state.volcano;
                const tc = v.labelTextColor;
                const noBg = DEFAULT_TEXT_COLOR_NO_BG;
                const withBg = DEFAULT_TEXT_COLOR_WITH_BG;

                ['up', 'down', 'normal'].forEach(function (k) {
                    if (on) {
                        if (tc[k] === noBg[k]) tc[k] = withBg[k];
                    } else {
                        if (tc[k] === withBg[k]) tc[k] = noBg[k];
                    }
                });

                const upEl = c.querySelector('.vp-label-text-up');
                const downEl = c.querySelector('.vp-label-text-down');
                const normalEl = c.querySelector('.vp-label-text-normal');
                if (upEl) upEl.value = tc.up;
                if (downEl) downEl.value = tc.down;
                if (normalEl) normalEl.value = tc.normal;
            });
        }

        c.querySelectorAll('input, select').forEach(function (el) {
            const h = function () {
                readVolcanoPanel(app);
                if (app.state.currentSvg) app.drawChart();
            };
            el.addEventListener('input', h);
            el.addEventListener('change', h);
        });

        ['vp-up-label', 'vp-down-label', 'vp-normal-label'].forEach(function (cls) {
            const el = c.querySelector('.' + cls);
            if (el) {
                el.addEventListener('change', function () {
                    readVolcanoPanel(app);
                    refreshColorAssign(app);
                });
            }
        });
    }

    function drawChart(app) {
        const s = app.state;
        const v = s.volcano;
        app.toolbarTip.textContent = '';

        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.x || !s.roles.y) { app.showTip('msgTip3', T.selectCols, 'error'); return; }

        const pts = [];
        s.data.forEach(function (row) {
            const rawX = parseFloat(row[s.roles.x]);
            const rawY = parseFloat(row[s.roles.y]);
            if (!isFinite(rawX) || !isFinite(rawY)) return;
            const x = transformX(rawX, v.xTransform, v.xLogBase);
            const y = transformY(rawY, v.yTransform, v.yLogBase);
            if (!isFinite(x) || !isFinite(y)) return;
            const id = s.roles.name
                ? String(row[s.roles.name] == null ? '' : row[s.roles.name])
                : '';
            pts.push({ x: x, y: y, id: id });
        });
        if (!pts.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const xLine = computeXLine(v);
        const yLine = computeYLine(v);

        pts.forEach(function (pt) {
            const sig = pt.y >= yLine;
            if (sig && pt.x >= xLine) pt.cat = 'up';
            else if (sig && pt.x <= -xLine) pt.cat = 'down';
            else pt.cat = 'normal';
        });

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
        pts.forEach(function (pt) { maxAbsX = Math.max(maxAbsX, Math.abs(pt.x)); });
        let xDomain;
        if (axisCfg.x.domainAuto) {
            const r = niceCeil(maxAbsX);
            xDomain = [-r, r];
        } else {
            xDomain = [axisCfg.x.domainMin, axisCfg.x.domainMax];
        }

        let yMin = Infinity, yMax = -Infinity;
        pts.forEach(function (pt) {
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

        const colorOf = function (cat) {
            if (cat === 'up') return v.upColor;
            if (cat === 'down') return v.downColor;
            return v.normalColor;
        };

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        if (axisCfg.y.gridShow) {
            const gridY = svg.append('g').attr('class', 'grid grid-y');
            (yScale.ticks ? yScale.ticks() : yScale.domain()).forEach(function (t) {
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
            (xScale.ticks ? xScale.ticks() : xScale.domain()).forEach(function (t) {
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
            [-xLine, xLine].forEach(function (xv) {
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

        const ptsG = svg.append('g').attr('class', 'volcano-points');
        pts.forEach(function (pt) {
            const px = xScale(pt.x);
            const py = yScale(pt.y);
            if (!isFinite(px) || !isFinite(py)) return;
            ptsG.append('circle')
                .attr('cx', px).attr('cy', py)
                .attr('r', v.pointSize / 2)
                .attr('fill', colorOf(pt.cat))
                .attr('opacity', v.pointAlpha);
        });

        if (v.labelShow) {
            const labelsG = svg.append('g').attr('class', 'volcano-labels');
            let list = [];
            if (v.labelMode === 'top') {
                const n = Math.max(1, Math.round(v.labelTopN));
                const score = function (pt) { return pt.y; };
                const upPts = pts.filter(function (pt) { return pt.cat === 'up' && pt.id; })
                    .sort(function (a, b) { return score(b) - score(a); })
                    .slice(0, n);
                const downPts = pts.filter(function (pt) { return pt.cat === 'down' && pt.id; })
                    .sort(function (a, b) { return score(b) - score(a); })
                    .slice(0, n);
                list = upPts.concat(downPts);
            } else {
                const names = String(v.labelCustomNames || '')
                    .split(/[,，\s]+/)
                    .map(function (s) { return s.trim(); })
                    .filter(Boolean);
                const set = new Set(names);
                list = pts.filter(function (pt) { return pt.id && set.has(pt.id); });
            }

            const leaderLen = 10;
            const offX = isFinite(v.labelLeaderOffsetX) ? v.labelLeaderOffsetX : 0;
            const offY = isFinite(v.labelLeaderOffsetY) ? v.labelLeaderOffsetY : 0;
            const leaderColor = v.labelLeaderColor || '#999999';

            list.forEach(function (pt) {
                const px = xScale(pt.x);
                const py = yScale(pt.y);
                if (!isFinite(px) || !isFinite(py)) return;

                let side;
                if (pt.cat === 'down') side = 'left';
                else if (pt.cat === 'up') side = 'right';
                else side = pt.x >= 0 ? 'right' : 'left';
                const dir = side === 'left' ? -1 : 1;

                const r = v.pointSize / 2;
                const lineStartX = px + dir * r;
                const lineStartY = py;
                const lineEndX = px + dir * (r + leaderLen + offX);
                const lineEndY = py + offY;
                const textX = lineEndX + dir * 2;
                const textY = lineEndY;
                const anchor = side === 'left' ? 'end' : 'start';
                const textColor = v.labelTextColor[pt.cat] || '#333';

                labelsG.append('line')
                    .attr('x1', lineStartX).attr('y1', lineStartY)
                    .attr('x2', lineEndX).attr('y2', lineEndY)
                    .attr('stroke', leaderColor)
                    .attr('stroke-width', 1)
                    .attr('stroke-linecap', 'round');

                const gLabel = labelsG.append('g');
                const txt = gLabel.append('text')
                    .attr('x', textX)
                    .attr('y', textY)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', anchor)
                    .attr('font-size', v.labelFontSize)
                    .attr('font-weight', v.labelBold ? 'bold' : 'normal')
                    .attr('font-style', v.labelItalic ? 'italic' : 'normal')
                    .attr('fill', textColor)
                    .text(pt.id);

                if (v.labelShowBg) {
                    let bb = null;
                    try { bb = txt.node().getBBox(); } catch (e) { bb = null; }
                    if (bb) {
                        gLabel.insert('rect', 'text')
                            .attr('x', bb.x - 3)
                            .attr('y', bb.y - 2)
                            .attr('width', bb.width + 6)
                            .attr('height', bb.height + 4)
                            .attr('rx', 2)
                            .attr('fill', v.labelBgColor[pt.cat] || '#ffffff')
                            .attr('stroke', v.labelBorderColor || '#000000')
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
                yTickValues = yTickValues.filter(function (t) {
                    return !(t > axisCfg.y.breakFrom && t < axisCfg.y.breakTo);
                });
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
            const counts = { up: 0, down: 0, normal: 0 };
            pts.forEach(function (pt) { counts[pt.cat]++; });
            const items = [
                { name: v.upLabel + (v.showCount ? ' (' + counts.up + ')' : '') },
                { name: v.downLabel + (v.showCount ? ' (' + counts.down + ')' : '') },
                { name: v.normalLabel + (v.showCount ? ' (' + counts.normal + ')' : '') }
            ];
            PC.drawLegendOverlay(svg, {
                p: p,
                items: items,
                colors: [v.upColor, v.downColor, v.normalColor],
                shape: 'circle',
                labelFormatter: function (it) { return it.name; }
            });
        }

        PlotAxis.applyFontFamily(svg, p.fontFamily);

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    PlotApp.create({
        exportName: 'volcano_plot',
        exampleData: EX_DATA,
        importInfo: EN
            ? 'Must include a header row with a <strong>numeric X column (FC / logFC)</strong> and a <strong>numeric Y column (p / q / -log)</strong>; a <strong>name column</strong> (gene / protein ID) is optional.'
            : '需包含表头，至少包含一个 <strong>数值X列（FC / logFC）</strong> 和一个 <strong>数值Y列（p / q / -log值）</strong>；<strong>名称列</strong>（基因名/蛋白名）可选。',

        stateExtra: {
            roles: { x: '', y: '', name: '' },
            columnTypes: {},
            axis: (function () {
                const a = PlotAxis.defaultState();
                a.x.titleEdited = false;
                a.y.titleEdited = false;
                return a;
            })(),
            volcano: null
        },

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) input.value = '';
        },

        refreshColors: function (app) {
            refreshColorAssign(app);
        },

        setup: function (app) {
            injectVolcanoStyle();
            const s = app.state;
            s.volcano = mergeVolcanoState(s.volcano);

            syncAxisTitles(app);
            fillRoleSelects(app);
            renderTransformPanel(app);
            refreshAxisPanel(app);
            renderVolcanoPanel(app);
            refreshColorAssign(app);

            ['xColSel', 'yColSel', 'nameColSel'].forEach(function (id) {
                const el = app.$(id);
                if (!el) return;
                el.addEventListener('change', function () {
                    if (id === 'xColSel') s.roles.x = el.value;
                    if (id === 'yColSel') s.roles.y = el.value;
                    if (id === 'nameColSel') s.roles.name = el.value;
                    syncAxisTitles(app);
                    refreshAxisPanel(app);
                    if (s.currentSvg) app.drawChart();
                });
            });
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = res.columnTypes || {};
            const types = s.columnTypes;
            const nums = res.headers.filter(function (h) { return types[h] === 'numeric'; });
            const cats = res.headers.filter(function (h) { return types[h] !== 'numeric'; });

            s.roles.x = nums[0] || res.headers[0];
            s.roles.y = nums[1] || nums[0] || res.headers[1] || res.headers[0];
            s.roles.name = cats[0] || '';
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            s.volcano = mergeVolcanoState(s.volcano);

            syncAxisTitles(app);
            fillRoleSelects(app);
            renderTransformPanel(app);
            refreshAxisPanel(app);
            renderVolcanoPanel(app);
            refreshColorAssign(app);
        },

        onReset: function (app) {
            const s = app.state;
            s.columnTypes = {};
            s.roles = { x: '', y: '', name: '' };
            s.axis = PlotAxis.defaultState();
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            s.volcano = defaultVolcanoSettings();

            fillRoleSelects(app);
syncAxisTitles(app);          

            renderTransformPanel(app);
            refreshAxisPanel(app);
            renderVolcanoPanel(app);
            refreshColorAssign(app);
        },

        onStateRestored: function (app) {
            app.state.volcano = mergeVolcanoState(app.state.volcano);
            fillRoleSelects(app);
            renderTransformPanel(app);
            refreshAxisPanel(app);
            renderVolcanoPanel(app);
            refreshColorAssign(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
(function () {
    'use strict';

    const PC = window.PlotCommon;
    const LC = window.LineCommon;

    const EN = PlotI18N.lang() === 'en';
    const T = {
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select X and Y columns' : '❌ 请选择X与Y列',
        noValid: EN ? '❌ Could not generate valid plot data' : '❌ 未能生成有效绘图数据',
        colorEmpty: EN ? 'Group colors will be shown here after selecting a group column' : '选择分组列后将在此处显示每个分组的颜色',
        noGroup: EN ? 'None' : '无',
        noDataPlaceholder: EN ? '— Please import data first —' : '— 请先导入数据 —',
        globalColorName: EN ? 'Line' : '折线',
        importInfo: EN
            ? 'Must include a header row with an <strong>X column</strong> (numeric or text), a <strong>numeric Y column</strong>, and an optional <strong>group column</strong>.'
              + '<br>If your data is in <strong>wide format</strong>, please convert it first using the '
              + '<a href="../../en/022.Wide_long_table_reshaping.html" target="_blank" style="color:#1f4068;font-weight:600;">Wide-to-Long Table Converter</a>.'
            : '需包含表头，至少包含一个 <strong>X 列</strong>（数值或文本）和一个 <strong>数值Y列</strong>；<strong>分组列</strong> 可选。'
              + '<br>若您的数据为<strong>宽表</strong>形式，请先使用 '
              + '<a href="../../ch/022.Wide_long_table_reshaping.html" target="_blank" style="color:#1f4068;font-weight:600;">宽长表转换工具</a> 转换后再导入。'
    };

    function makeExampleData() {
        const rows = ['ID\tGender\tTreatment\tValue'];
        for (let i = 0; i < 20; i++) {
            const idVal = i + 1;
            const base = 10 + i * 0.8;
            const maleV = base + Math.sin(i * 1.3) * 1.2 + 0.6;
            const femaleV = base + Math.cos(i * 1.1) * 1.0 - 0.4;
            rows.push([idVal, 'Male', 'A', maleV.toFixed(2)].join('\t'));
            rows.push([idVal, 'Female', 'B', femaleV.toFixed(2)].join('\t'));
        }
        return rows.join('\n');
    }

    const EX_DATA = makeExampleData();

    function fillRoleSelects(app) {
        const s = app.state;
        const xSel = app.$('xColSel');
        const ySel = app.$('yColSel');
        const gSel = app.$('groupColSel');
        if (!xSel || !ySel || !gSel) return;

        if (!s.headers.length) {
            xSel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            ySel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            gSel.innerHTML = '<option value="">' + T.noGroup + '</option>';
            xSel.disabled = ySel.disabled = gSel.disabled = true;
            return;
        }
        xSel.disabled = ySel.disabled = gSel.disabled = false;

        const xOpts = s.headers.map(function (h) {
            return '<option value="' + PlotCommon.escapeHtml(h) + '"' +
                (h === s.roles.x ? ' selected' : '') + '>' + PlotCommon.escapeHtml(h) + '</option>';
        }).join('');
        const yOpts = s.headers.map(function (h) {
            return '<option value="' + PlotCommon.escapeHtml(h) + '"' +
                (h === s.roles.y ? ' selected' : '') + '>' + PlotCommon.escapeHtml(h) + '</option>';
        }).join('');
        const gOpts = '<option value="">' + T.noGroup + '</option>' +
            s.headers.map(function (h) {
                return '<option value="' + PlotCommon.escapeHtml(h) + '"' +
                    (h === s.roles.group ? ' selected' : '') + '>' + PlotCommon.escapeHtml(h) + '</option>';
            }).join('');

        xSel.innerHTML = xOpts;
        ySel.innerHTML = yOpts;
        gSel.innerHTML = gOpts;
    }

    function isXNumeric(app) {
        const s = app.state;
        const xKey = s.roles.x;
        if (!xKey || !s.data.length) return false;
        let any = false;
        for (let i = 0; i < s.data.length; i++) {
            const v = s.data[i][xKey];
            if (v == null || v === '') continue;
            any = true;
            if (!isFinite(parseFloat(v))) return false;
        }
        return any;
    }

    function refreshGroupColors(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const s = app.state;
        const gKey = s.roles.group;
        if (!gKey) {
            const palette = app.resolvePaletteColors(1);
            const globalColor = s.customColors.__global__ || (palette && palette[0]) || '#4e79a7';
            PC.renderColorAssignment(container, {
                items: [{ name: T.globalColorName, color: globalColor }],
                onChange: function (idx, c) {
                    s.customColors.__global__ = c;
                    if (s.currentSvg) app.drawChart();
                },
                onResetAll: function () {
                    delete s.customColors.__global__;
                    refreshGroupColors(app);
                    if (s.currentSvg) app.drawChart();
                }
            });
            return;
        }
        const seen = new Set();
        const groups = [];
        s.data.forEach(function (row) {
            const v = row[gKey];
            if (v === undefined || v === null || v === '') return;
            const t = String(v);
            if (!seen.has(t)) { seen.add(t); groups.push(t); }
        });
        if (!groups.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const baseColors = app.resolvePaletteColors(groups.length);
        PC.renderColorAssignment(container, {
            items: groups.map(function (g, i) {
                return { name: g, color: s.customColors[g] || baseColors[i] };
            }),
            onChange: function (idx, c) {
                s.customColors[groups[idx]] = c;
                if (s.currentSvg) app.drawChart();
            },
            onResetAll: function () {
                s.customColors = {};
                refreshGroupColors(app);
                if (s.currentSvg) app.drawChart();
            }
        });
    }

    function refreshLinePanel(app) {
        const xIsNumeric = isXNumeric(app);
        LC.renderLinePanel(app.$('linePanelContainer'), {
            state: app.state.line || LC.defaultLineSettings(),
            xIsNumeric: xIsNumeric,
            onChange: function () { if (app.state.currentSvg) app.drawChart(); }
        });
    }

    function refreshAxisPanel(app) {
        const direction = app.state.barDirection || 'vertical';
        PlotAxis.render(app.$('axisPanelContainer'), {
            state: app.state.axis,
            direction: direction,
            axisTypes: { x: 'category', y: 'numeric' },
            onGlobalFontChange: function () {
                BarCommon.updatePanelFontInputs(app);
                if (app.state.currentSvg) app.drawChart();
            },
            onChange: function () {
                if (app.state.currentSvg) app.drawChart();
            },
            onDirectionChange: function (newDir) {
                app.state.barDirection = newDir;
                syncAxisTitles(app);
                refreshAxisPanel(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
        ['x', 'y'].forEach(function (k) {
            const input = app.$('axisPanelContainer').querySelector('.ax-' + k + '-title');
            if (input) {
                input.addEventListener('input', function () {
                    app.state.axis[k].titleEdited = true;
                });
            }
        });
    }

    function syncAxisTitles(app) {
        const s = app.state;
        const dir = s.barDirection || 'vertical';
        if (dir === 'horizontal') {
            if (!s.axis.x.titleEdited) s.axis.x.titleContent = s.roles.y || '';
            if (!s.axis.y.titleEdited) s.axis.y.titleContent = s.roles.x || '';
        } else {
            if (!s.axis.x.titleEdited) s.axis.x.titleContent = s.roles.x || '';
            if (!s.axis.y.titleEdited) s.axis.y.titleContent = s.roles.y || '';
        }
    }

    function drawChart(app) {
        const s = app.state;
        app.toolbarTip.textContent = '';

        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.x || !s.roles.y) { app.showTip('msgTip3', T.selectCols, 'error'); return; }

        const built = LC.buildLineData(app);
        if (!built.series.length || !built.xValues.length) {
            app.showTip('msgTip3', T.noValid, 'error');
            return;
        }

        const p = PC.readCommonParams(app, { width: 800, height: 600 });
        const axisCfg = s.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        const lineSettings = LC.readLineSettings(app.$('linePanelContainer'));
        s.line = lineSettings;

        const groupValues = built.groupValues;
        const baseColors = app.resolvePaletteColors(Math.max(1, groupValues.length));
        const colorOf = function (key) {
            if (!key || key === '__all__') {
                return s.customColors.__global__ || baseColors[0] || '#4e79a7';
            }
            const idx = groupValues.indexOf(key);
            return s.customColors[key] || baseColors[idx] || '#cccccc';
        };

        LC.drawLineChart(app, {
            p: p,
            axisCfg: axisCfg,
            xValues: built.xValues,
            groupValues: groupValues,
            series: built.series,
            isNumericX: built.isNumericX,
            colorOf: colorOf,
            lineSettings: lineSettings
        });

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    PlotApp.create({
        exportName: 'grouped_line_chart',
        exampleData: EX_DATA,
        importInfo: T.importInfo,

        stateExtra: (function () {
            const base = BarCommon.createStateExtra();
            base.roles = { x: '', y: '', group: '' };
            base.line = null;
            return base;
        })(),

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = app.state.roles.group || '';
            }
        },

        refreshColors: function (app) {
            refreshGroupColors(app);
        },

        setup: function (app) {
            const s = app.state;
            if (!s.line) s.line = LC.defaultLineSettings();

            syncAxisTitles(app);
            refreshAxisPanel(app);
            refreshLinePanel(app);
            refreshGroupColors(app);

            const xSel = app.$('xColSel');
            const ySel = app.$('yColSel');
            const gSel = app.$('groupColSel');

            if (xSel) xSel.addEventListener('change', function () {
                s.roles.x = xSel.value;
                syncAxisTitles(app);
                refreshAxisPanel(app);
                refreshLinePanel(app);
                if (s.currentSvg) app.drawChart();
            });
            if (ySel) ySel.addEventListener('change', function () {
                s.roles.y = ySel.value;
                syncAxisTitles(app);
                refreshAxisPanel(app);
                if (s.currentSvg) app.drawChart();
            });
            if (gSel) gSel.addEventListener('change', function () {
                s.roles.group = gSel.value;
                s.customColors = {};
                app.syncLegendTitle();
                refreshGroupColors(app);
                if (s.currentSvg) app.drawChart();
            });
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = res.columnTypes || {};
            const types = s.columnTypes;
            const nums = res.headers.filter(function (h) { return types[h] === 'numeric'; });
            const cats = res.headers.filter(function (h) {
                return types[h] === 'categorical' || types[h] === 'date';
            });
            s.roles.x = res.headers[0];
            s.roles.y = res.headers[res.headers.length - 1] || nums[0] || res.headers[0];
            s.roles.group = cats[0] || '';
            s.customColors = {};
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;

            app.syncLegendTitle();
            syncAxisTitles(app);
            fillRoleSelects(app);
            refreshAxisPanel(app);
            refreshLinePanel(app);
            refreshGroupColors(app);
        },

        onReset: function (app) {
            const s = app.state;
            s.columnTypes = {};
            s.roles = { x: '', y: '', group: '' };
            s.customColors = {};
            s.axis = PlotAxis.defaultState();
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            s.line = LC.defaultLineSettings();
            fillRoleSelects(app);
            refreshAxisPanel(app);
            refreshLinePanel(app);
            refreshGroupColors(app);
        },

        onStateRestored: function (app) {
            fillRoleSelects(app);
            refreshAxisPanel(app);
            refreshLinePanel(app);
            refreshGroupColors(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
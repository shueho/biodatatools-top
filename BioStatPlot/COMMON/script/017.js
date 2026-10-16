(function () {
    'use strict';

    const PC = window.PlotCommon;
    const SC = window.ScatterCommon;

    const EN = PlotI18N.lang() === 'en';
    const T = {
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select X and Y columns' : '❌ 请选择X与Y数值列',
        noValid: EN ? '❌ Could not generate valid plot data' : '❌ 未能生成有效绘图数据',
        colorEmpty: EN ? 'Group colors will be shown here after selecting a group column' : '选择分组列后将在此处显示每个分组的颜色',
        noGroup: EN ? 'None' : '无',
        noDataPlaceholder: EN ? '— Please import data first —' : '— 请先导入数据 —',
        globalColorName: EN ? 'Points' : '散点'
    };

    function makeExampleData() {
        const rows = ['Group\tX\tY'];
        const groups = [
            {
                name: 'A',
                n: 40,
                gen: function (t, id) {
                    const x = 1 + t * 6 + Math.sin(id * 1.7) * 0.15;
                    const base = 6.5 - 4.5 * Math.abs(((t * 2) % 1) - 0.5) * 2
                               + 2.0 * Math.cos(t * Math.PI * 2);
                    const y = base + Math.sin(id * 3.1) * 0.30;
                    return { x: x, y: y };
                }
            },
            {
                name: 'B',
                n: 40,
                gen: function (t, id) {
                    const x = 1 + t * 6 + Math.sin(id * 1.7) * 0.15;
                    const y = 3.0 + 1.05 * x
                        + Math.sin(id * 2.3) * 3.5
                        + Math.cos(id * 4.7) * 2.5;
                    return { x: x, y: y };
                }
            },
            {
                name: 'C',
                n: 40,
                gen: function (t, id) {
                    const x = 1 + t * 6 + Math.sin(id * 1.7) * 0.15;
                    const y = 1.2 + 0.85 * x + Math.sin(id * 3.1) * 0.35;
                    return { x: x, y: y };
                }
            }
        ];
        let id = 1;
        groups.forEach(function (g) {
            for (let i = 0; i < g.n; i++) {
                const t = i / (g.n - 1);
                const pt = g.gen(t, id);
                rows.push([g.name, pt.x.toFixed(2), pt.y.toFixed(2)].join('\t'));
                id++;
            }
        });
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

        const types = s.columnTypes || {};
        const nums = s.headers.filter(function (h) { return types[h] === 'numeric'; });
        const cats = s.headers.filter(function (h) {
            return types[h] === 'categorical' || types[h] === 'date';
        });

        const xOpts = nums.map(function (h) {
            return '<option value="' + PlotCommon.escapeHtml(h) + '"' +
                (h === s.roles.x ? ' selected' : '') + '>' + PlotCommon.escapeHtml(h) + '</option>';
        }).join('');
        const yOpts = nums.map(function (h) {
            return '<option value="' + PlotCommon.escapeHtml(h) + '"' +
                (h === s.roles.y ? ' selected' : '') + '>' + PlotCommon.escapeHtml(h) + '</option>';
        }).join('');
        const gOpts = '<option value="">' + T.noGroup + '</option>' +
            cats.concat(s.headers.filter(function (h) { return cats.indexOf(h) < 0; }))
                .map(function (h) {
                    return '<option value="' + PlotCommon.escapeHtml(h) + '"' +
                        (h === s.roles.group ? ' selected' : '') + '>' + PlotCommon.escapeHtml(h) + '</option>';
                }).join('');

        xSel.innerHTML = xOpts || '<option value="">' + T.noDataPlaceholder + '</option>';
        ySel.innerHTML = yOpts || '<option value="">' + T.noDataPlaceholder + '</option>';
        gSel.innerHTML = gOpts;
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

    function refreshScatterPanel(app) {
        SC.renderScatterPanel(app.$('scatterPanelContainer'), {
            state: app.state.scatter || SC.defaultScatterSettings(),
            onChange: function () { if (app.state.currentSvg) app.drawChart(); }
        });
    }

    function refreshFitPanel(app) {
        const hasGroup = !!(app.state.roles.group);
        SC.renderFitPanel(app.$('fitPanelContainer'), {
            state: app.state.fit || SC.defaultFitSettings(),
            hasGroup: hasGroup,
            onChange: function () { if (app.state.currentSvg) app.drawChart(); }
        });
    }

    function hideAxisDirection(app) {
        const panel = app.$('axisPanelContainer');
        if (!panel) return;
        const dir = panel.querySelector('.axis-direction-block');
        if (dir) dir.style.display = 'none';
    }

    function refreshAxisPanel(app) {
        const direction = app.state.barDirection || 'vertical';
        PlotAxis.render(app.$('axisPanelContainer'), {
            state: app.state.axis,
            direction: direction,
            axisTypes: { x: 'numeric', y: 'numeric' },
            onGlobalFontChange: function () {
                BarCommon.updatePanelFontInputs(app);
                if (app.state.currentSvg) app.drawChart();
            },
            onChange: function () {
                if (app.state.currentSvg) app.drawChart();
            },
            onDirectionChange: function (newDir) {
                app.state.barDirection = newDir;
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
        hideAxisDirection(app);
    }

    function syncAxisTitles(app) {
        const s = app.state;
        if (!s.axis.x.titleEdited) s.axis.x.titleContent = s.roles.x || '';
        if (!s.axis.y.titleEdited) s.axis.y.titleContent = s.roles.y || '';
    }

    function drawChart(app) {
        const s = app.state;
        app.toolbarTip.textContent = '';

        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.x || !s.roles.y) { app.showTip('msgTip3', T.selectCols, 'error'); return; }

        const data = SC.buildData(app);
        if (!data.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const p = PC.readCommonParams(app, { width: 800, height: 600 });
        p.direction = 'vertical';
        const axisCfg = s.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        const scatterSettings = SC.readScatterSettings(app.$('scatterPanelContainer'));
        const fitSettings = SC.readFitSettings(app.$('fitPanelContainer'));
        app.state.scatter = scatterSettings;
        app.state.fit = fitSettings;

        const groupKeys = [];
        const seen = new Set();
        if (s.roles.group) {
            data.forEach(function (d) {
                if (!seen.has(d.g)) { seen.add(d.g); groupKeys.push(d.g); }
            });
        }
        const baseColors = app.resolvePaletteColors(Math.max(1, groupKeys.length));
        const colorOf = function (key) {
            if (!key) return s.customColors.__global__ || baseColors[0] || '#4e79a7';
            const idx = groupKeys.indexOf(key);
            return s.customColors[key] || baseColors[idx] || '#cccccc';
        };
        const globalColor = s.customColors.__global__ || baseColors[0] || '#4e79a7';

        const fits = SC.performFits(data, fitSettings);

        SC.drawScatterChart(app, {
            p: p,
            axisCfg: axisCfg,
            data: data,
            groupKeys: groupKeys,
            colorOf: colorOf,
            globalColor: globalColor,
            scatterSettings: scatterSettings,
            fitSettings: fitSettings,
            fits: fits
        });

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    PlotApp.create({
        exportName: 'scatter_chart',
        exampleData: EX_DATA,
        importInfo: EN
            ? 'Must include a header row with a <strong>numeric X column</strong> and a <strong>numeric Y column</strong>; a <strong>group column</strong> is optional.'
            : '需包含表头，至少包含一个 <strong>数值 X 列</strong> 和一个 <strong>数值 Y 列</strong>；<strong>分组列</strong> 可选。',

        stateExtra: (function () {
            const base = BarCommon.createStateExtra();
            base.roles = { x: '', y: '', group: '' };
            base.scatter = null;
            base.fit = null;
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
            if (!s.scatter) s.scatter = SC.defaultScatterSettings();
            if (!s.fit) s.fit = SC.defaultFitSettings();

            syncAxisTitles(app);
            refreshAxisPanel(app);
            refreshScatterPanel(app);
            refreshFitPanel(app);
            refreshGroupColors(app);

            const xSel = app.$('xColSel');
            const ySel = app.$('yColSel');
            const gSel = app.$('groupColSel');

            if (xSel) xSel.addEventListener('change', function () {
                s.roles.x = xSel.value;
                syncAxisTitles(app);
                refreshAxisPanel(app);
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
                refreshFitPanel(app);
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
            s.roles.x = nums[0] || res.headers[0];
            s.roles.y = nums[1] || nums[0] || res.headers[1] || res.headers[0];
            s.roles.group = cats[0] || '';
            s.customColors = {};
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;

            app.syncLegendTitle();
            syncAxisTitles(app);
            fillRoleSelects(app);
            refreshAxisPanel(app);
            refreshScatterPanel(app);
            refreshFitPanel(app);
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
            s.scatter = SC.defaultScatterSettings();
            s.fit = SC.defaultFitSettings();
            fillRoleSelects(app);
            refreshAxisPanel(app);
            refreshScatterPanel(app);
            refreshFitPanel(app);
            refreshGroupColors(app);
        },

        onStateRestored: function (app) {
            fillRoleSelects(app);
            refreshAxisPanel(app);
            refreshScatterPanel(app);
            refreshFitPanel(app);
            refreshGroupColors(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
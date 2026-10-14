(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Must include a header row with at least a <strong>category column</strong>, a <strong>stack-series column</strong> and a <strong>value column</strong>. Values are averaged per category/series before stacking. Supports absolute and percentage stacking, vertical / horizontal orientation, and error bars (range or error value).'
            : '需包含表头，且至少包含 <strong>分类列</strong>、<strong>堆叠系列</strong> 和 <strong>数值列</strong>。同一分类同一系列的多个重复行会自动取均值后堆叠。支持绝对值堆叠与百分比堆叠、竖向 / 横向切换，以及范围棒与误差棒。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select the category, stack-series and value columns' : '❌ 请选择分类列、堆叠系列和数值列',
        noValid: EN ? '❌ Could not generate valid plot data. Please check the value column' : '❌ 未能生成有效绘图数据，请检查数值列',
        colorEmpty: EN ? 'Stack-series colors will be shown here after selecting data columns' : '选择数据列后将在此处显示每个堆叠系列的颜色',
        inputOrder: EN ? 'Input order' : '输入顺序',
        sortByStackLabel: EN ? 'Sort by stack-series value' : '按堆叠系列的值排序',
        sortTopAbs: EN ? 'Top layer · raw value' : '最上层 · 原始值',
        sortTopPct: EN ? 'Top layer · percentage' : '最上层 · 百分比',
        sortBottomAbs: EN ? 'Bottom layer · raw value' : '最下层 · 原始值',
        sortBottomPct: EN ? 'Bottom layer · percentage' : '最下层 · 百分比'
    };

    const SORT_KEYS = {
        TOP_ABS:    '__stackTopAbs__',
        TOP_PCT:    '__stackTopPct__',
        BOTTOM_ABS: '__stackBottomAbs__',
        BOTTOM_PCT: '__stackBottomPct__'
    };

    const VALID_SORT_KEYS = new Set([
        SORT_KEYS.TOP_ABS,
        SORT_KEYS.TOP_PCT,
        SORT_KEYS.BOTTOM_ABS,
        SORT_KEYS.BOTTOM_PCT
    ]);

    const EX_PLAIN =
        'Category\tStackSeries\tValue\tLower\tUpper\tError\n' +
        'A\tS1\t18\t16\t20\t2\n' +
        'A\tS2\t32\t29\t35\t3\n' +
        'A\tS3\t12\t10\t14\t2\n' +
        'B\tS1\t24\t22\t26\t2\n' +
        'B\tS2\t8\t6\t10\t2\n' +
        'B\tS3\t20\t18\t22\t2\n' +
        'C\tS1\t22\t20\t24\t2\n' +
        'C\tS2\t26\t23\t29\t3\n' +
        'C\tS3\t18\t16\t20\t2';

    function sortCategories(app, catRaw) {
        const state = app.state;
        const sortBy = state.sortBy;
        const dir = (state.sortDir === 'asc') ? 1 : -1;
        if (!sortBy || sortBy === '__input__') return catRaw;

        if (!VALID_SORT_KEYS.has(sortBy)) {
            return BarCommon.sortXValues(app, catRaw);
        }

        const ordered = getOrderedGroups(app);
        if (!ordered.length) return catRaw;

        const isTop = (sortBy === SORT_KEYS.TOP_ABS || sortBy === SORT_KEYS.TOP_PCT);
        const usePercent = (sortBy === SORT_KEYS.TOP_PCT || sortBy === SORT_KEYS.BOTTOM_PCT);
        const g = isTop ? ordered[ordered.length - 1] : ordered[0];

        const catTotals = new Map();
        if (usePercent) {
            catRaw.forEach(x => {
                let sum = 0;
                state.data.forEach(r => {
                    if (String(r[state.roles.x]) === x) {
                        const v = parseFloat(r[state.roles.y]);
                        if (isFinite(v)) sum += v;
                    }
                });
                catTotals.set(x, sum);
            });
        }

        const keyMap = new Map();
        catRaw.forEach(x => {
            const vals = state.data
                .filter(r => String(r[state.roles.x]) === x && String(r[state.roles.group]) === g)
                .map(r => parseFloat(r[state.roles.y]))
                .filter(v => isFinite(v));
            let key = 0;
            if (vals.length) {
                const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
                if (usePercent) {
                    const total = catTotals.get(x) || 0;
                    key = total > 0 ? mean / total : 0;
                } else {
                    key = mean;
                }
            }
            keyMap.set(x, key);
        });

        return catRaw.slice().sort((a, b) => {
            const ka = keyMap.get(a) || 0;
            const kb = keyMap.get(b) || 0;
            return (ka - kb) * dir;
        });
    }

    function getOrderedGroups(app) {
        const state = app.state;
        const mode = state.groupOrderMode || 'input';
        const raw = BarCommon.getGroupValues(app, '');
        if (!raw.length) return raw;

        if (mode === 'input') return raw;
        if (mode === 'custom') return BarCommon.applyCustomOrder(raw, state.groupOrder || '');

        const byCat = new Map();
        state.data.forEach(r => {
            const cat = String(r[state.roles.x]);
            const g = String(r[state.roles.group]);
            if (raw.indexOf(g) < 0) return;
            const v = parseFloat(r[state.roles.y]);
            if (!isFinite(v)) return;
            if (!byCat.has(cat)) byCat.set(cat, new Map());
            const m = byCat.get(cat);
            m.set(g, (m.get(g) || 0) + v);
        });

        const keys = new Map();
        raw.forEach(g => {
            let absSum = 0, pctSum = 0, catCount = 0;
            byCat.forEach(m => {
                let total = 0;
                m.forEach(v => { total += v; });
                const v = m.get(g) || 0;
                if (total > 0) {
                    absSum += v;
                    pctSum += v / total;
                    catCount++;
                }
            });
            keys.set(g, {
                abs: absSum,
                pct: catCount > 0 ? pctSum / catCount : 0
            });
        });

        let keyFn, dir;
        switch (mode) {
            case 'absAsc':  keyFn = k => k.abs; dir = 1;  break;
            case 'absDesc': keyFn = k => k.abs; dir = -1; break;
            case 'pctAsc':  keyFn = k => k.pct; dir = 1;  break;
            case 'pctDesc': keyFn = k => k.pct; dir = -1; break;
            default: return raw;
        }

        return raw.slice().sort((a, b) => {
            const ka = keyFn(keys.get(a) || { abs: 0, pct: 0 });
            const kb = keyFn(keys.get(b) || { abs: 0, pct: 0 });
            if (ka !== kb) return (ka - kb) * dir;
            return raw.indexOf(a) - raw.indexOf(b);
        });
    }

    function rebuildSortByOptions(app) {
        const sel = app.sortBySel;
        if (!sel) return;
        const headers = app.state.headers;
        if (!headers.length) return;

        let current = app.state.sortBy;
        const valid = current === '__input__'
            || headers.indexOf(current) >= 0
            || VALID_SORT_KEYS.has(current);
        if (!valid) current = '__input__';
        app.state.sortBy = current;

        const esc = PC.escapeHtml;
        let html = '<option value="__input__"' + (current === '__input__' ? ' selected' : '') + '>'
            + esc(T.inputOrder) + '</option>';
        headers.forEach(h => {
            html += '<option value="' + esc(h) + '"' + (h === current ? ' selected' : '') + '>'
                + esc(h) + '</option>';
        });
        html += '<optgroup label="' + esc(T.sortByStackLabel) + '">';
        html += '<option value="' + SORT_KEYS.TOP_ABS + '"' + (current === SORT_KEYS.TOP_ABS ? ' selected' : '') + '>' + esc(T.sortTopAbs) + '</option>';
        html += '<option value="' + SORT_KEYS.TOP_PCT + '"' + (current === SORT_KEYS.TOP_PCT ? ' selected' : '') + '>' + esc(T.sortTopPct) + '</option>';
        html += '<option value="' + SORT_KEYS.BOTTOM_ABS + '"' + (current === SORT_KEYS.BOTTOM_ABS ? ' selected' : '') + '>' + esc(T.sortBottomAbs) + '</option>';
        html += '<option value="' + SORT_KEYS.BOTTOM_PCT + '"' + (current === SORT_KEYS.BOTTOM_PCT ? ' selected' : '') + '>' + esc(T.sortBottomPct) + '</option>';
        html += '</optgroup>';
        sel.innerHTML = html;
    }

    function syncGroupOrderUI(app) {
        const modeSel = app.$('groupOrderMode');
        const input = app.$('groupOrder');
        const hint = app.$('groupOrderHint');
        if (!modeSel) return;
        const mode = modeSel.value || 'input';
        app.state.groupOrderMode = mode;

        if (input) {
            const custom = (mode === 'custom');
            input.disabled = !custom;
            input.style.opacity = custom ? '1' : '.5';
        }

        if (hint) {
            const map = {
                input:   EN ? 'In the order they first appear in the data.' : '按数据中首次出现的顺序。',
        absAsc:  EN ? 'Sorted by total raw value across all categories (ascending).' : '按各系列在所有分类下的原始值总和升序。',
        absDesc: EN ? 'Sorted by total raw value across all categories (descending).' : '按各系列在所有分类下的原始值总和降序。',
                pctAsc:  EN ? 'Sorted by average percentage across categories (ascending).' : '按各系列在各分类中的平均占比升序。',
                pctDesc: EN ? 'Sorted by average percentage across categories (descending).' : '按各系列在各分类中的平均占比降序。',
                custom:  EN ? 'Use the order typed in the box; values not listed are appended in input order.' : '按输入框填写的顺序；未列出的系列附后，按出现顺序。'
            };
            hint.textContent = map[mode] || map.input;
        }
    }

    function refreshGroupColors(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const groupVals = getOrderedGroups(app);
        if (!groupVals.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const baseColors = app.resolvePaletteColors(groupVals.length);
        const displayItems = groupVals.map((k, i) => ({
            name: k,
            color: app.state.customColors[k] || baseColors[i]
        }));
        PlotCommon.renderColorAssignment(container, {
            items: displayItems,
            onChange: (idx, c) => {
                app.state.customColors[groupVals[idx]] = c;
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: () => {
                app.state.customColors = {};
                refreshGroupColors(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    function drawChart(app) {
        const state = app.state;
        app.toolbarTip.textContent = '';
        if (!state.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!state.roles.x || !state.roles.group || !state.roles.y) {
            app.showTip('msgTip3', T.selectCols, 'error'); return;
        }

        const p = StackedChart.readStackedParams(app);
        const axisCfg = state.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        const catVals = sortCategories(app, BarCommon.getXValues(app));
        const groupVals = getOrderedGroups(app);
        if (!groupVals.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const cells = BarCommon.buildCells(app, catVals, groupVals, true);
        const built = StackedChart.buildStackData(catVals, groupVals, cells, p, { allowErrorBars: true });

        if (!built.stackData.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const prepared = {
            p: p,
            axisCfg: axisCfg,
            catVals: catVals,
            groupVals: groupVals,
            stackData: built.stackData,
            maxValue: built.maxValue
        };

        StackedChart.drawStackedChart(app, prepared, { allowErrorBars: true });

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    PlotApp.create({
        exportName: 'stacked_bar_chart',
        importInfo: T.importInfo,
        exampleData: EX_PLAIN,

        stateExtra: (function () {
            const base = BarCommon.createStateExtra();
            base.stackMode = 'absolute';
            base.showStackTotal = false;
            base.groupOrderMode = 'input';
            return base;
        })(),

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = app.state.roles.group || '';
            }
        },

        setup: function (app) {
            BarCommon.fillRoleSelects(app, '');
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);

            const modeSel = app.$('groupOrderMode');
            if (modeSel) {
                modeSel.value = app.state.groupOrderMode || 'input';
                modeSel.addEventListener('change', function () {
                    syncGroupOrderUI(app);
                    app.refreshColors();
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const orderInput = app.$('groupOrder');
            if (orderInput) {
                orderInput.value = app.state.groupOrder || '';
                orderInput.addEventListener('input', function () {
                    app.state.groupOrder = orderInput.value;
                    if (app.state.groupOrderMode === 'custom') {
                        app.refreshColors();
                        if (app.state.currentSvg) app.drawChart();
                    }
                });
            }

            syncGroupOrderUI(app);

            const stackModeSel = app.$('stackMode');
            if (stackModeSel) {
                stackModeSel.value = app.state.stackMode || 'absolute';
                stackModeSel.addEventListener('change', function () {
                    app.state.stackMode = stackModeSel.value;
                    BarCommon.refreshErrorBarPanel(app);
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            BarCommon.bindRoleEvents(app, null, null, null);

            setTimeout(function () { rebuildSortByOptions(app); }, 0);
        },

        onDataImported: function (app, res) {
            const state = app.state;
            state.columnTypes = res.columnTypes || {};
            const cats = res.headers.filter(h => state.columnTypes[h] === 'categorical' || state.columnTypes[h] === 'date');
            const nums = res.headers.filter(h => state.columnTypes[h] === 'numeric');
            state.roles.x = cats[0] || res.headers[0];
            state.roles.group = cats[1] || cats[0] || res.headers[1] || res.headers[0];
            state.roles.y = nums[0] || res.headers[2] || res.headers[0];
            state.customColors = {};
            state.errBar.mode = 'none';
            state.errBar.lowerCol = '';
            state.errBar.upperCol = '';
            state.errBar.errCol = '';
            state.axis.x.titleEdited = false;
            state.axis.y.titleEdited = false;
            app.syncLegendTitle();
            BarCommon.syncAxisTitlesByDirection(app);
            BarCommon.fillRoleSelects(app, '');
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);

            const modeSel = app.$('groupOrderMode');
            if (modeSel) modeSel.value = state.groupOrderMode || 'input';
            syncGroupOrderUI(app);

            setTimeout(function () { rebuildSortByOptions(app); }, 0);
        },

        onReset: function (app) {
            const state = app.state;
            state.columnTypes = {};
            state.roles = { x: '', group: '', y: '' };
            state.customColors = {};
            state.errBar.mode = 'none';
            state.errBar.lowerCol = '';
            state.errBar.upperCol = '';
            state.errBar.errCol = '';
            state.axis = PlotAxis.defaultState();
            state.axis.x.titleEdited = false;
            state.axis.y.titleEdited = false;
            state.groupOrderMode = 'input';
            state.groupOrder = '';
            const modeSel = app.$('groupOrderMode');
            if (modeSel) modeSel.value = 'input';
            const goEl = app.$('groupOrder');
            if (goEl) goEl.value = '';
            BarCommon.fillRoleSelects(app, '');
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
            syncGroupOrderUI(app);
        },

        onStateRestored: function (app) {
            BarCommon.fillRoleSelects(app, '');
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);

            const modeSel = app.$('groupOrderMode');
            if (modeSel) modeSel.value = app.state.groupOrderMode || 'input';
            const goEl = app.$('groupOrder');
            if (goEl) goEl.value = app.state.groupOrder || '';
            const stackModeSel = app.$('stackMode');
            if (stackModeSel) stackModeSel.value = app.state.stackMode || 'absolute';

            syncGroupOrderUI(app);
            refreshGroupColors(app);
            setTimeout(function () { rebuildSortByOptions(app); }, 0);
        },

        refreshColors: function (app) {
            refreshGroupColors(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
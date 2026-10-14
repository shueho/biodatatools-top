(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Must include a header row. Choose any column as the <strong>category column</strong>; the rest can be selected as <strong>value columns</strong> for stacking.'
            : '需包含表头。可选择任意一列作为<strong>分类列</strong>，其余列作为<strong>数值列</strong>参与堆叠。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        noCat: EN ? '❌ Please select a category column' : '❌ 请选择分类列',
        noVals: EN ? '❌ Please select at least one value column' : '❌ 请至少选择一个数值列',
        noValid: EN ? '❌ Could not generate valid plot data' : '❌ 未能生成有效绘图数据',
        colorEmpty: EN ? 'Category colors will be shown here' : '选择数值列后将在此处显示每个分类的颜色',
        valTip: EN ? 'Import data to select value columns' : '导入数据后可选择数值列',
        noValsTip: EN ? 'No value columns available' : '没有可用的数值列',
        inputOrder: EN ? 'Input order' : '输入顺序',
        sortByStackLabel: EN ? 'By stack-series value' : '按堆叠系列的值排序',
        sortTopAbs:    EN ? 'Top layer · raw value'      : '最上层 · 原始值',
        sortTopPct:    EN ? 'Top layer · percentage'     : '最上层 · 百分比',
        sortBottomAbs: EN ? 'Bottom layer · raw value'   : '最下层 · 原始值',
        sortBottomPct: EN ? 'Bottom layer · percentage'  : '最下层 · 百分比'
    };

    const SORT_KEYS = {
        TOP_ABS:    '__stackTopAbs__',
        TOP_PCT:    '__stackTopPct__',
        BOTTOM_ABS: '__stackBottomAbs__',
        BOTTOM_PCT: '__stackBottomPct__'
    };
    const VALID_SORT_KEYS = new Set([
        SORT_KEYS.TOP_ABS, SORT_KEYS.TOP_PCT,
        SORT_KEYS.BOTTOM_ABS, SORT_KEYS.BOTTOM_PCT
    ]);

    const EX = 'Name\tS1\tS2\tS3\tS4\tS5\tS6\n' +
        'A\t1200\t980\t1500\t870\t1100\t1350\n' +
        'B\t1450\t1600\t1320\t1500\t1700\t1400\n' +
        'C\t820\t700\t950\t600\t740\t880\n' +
        'D\t540\t620\t480\t700\t560\t600\n' +
        'E\t320\t280\t360\t250\t300\t340\n' +
        'F\t260\t310\t280\t320\t290\t270\n' +
        'G\t180\t220\t200\t240\t210\t190\n' +
        'H\t95\t120\t110\t130\t100\t115\n' +
        'I\t70\t85\t75\t90\t80\t82\n' +
        'J\t50\t60\t55\t65\t58\t62\n' +
        'K\t30\t25\t35\t20\t28\t32\n' +
        'L\t18\t22\t20\t25\t21\t19';

    const mainKey = s => s.stackMode === 'percent' ? 'pct' : 'abs';

    /* ============ 每个分类（A、B、C...）的指标 ============ */
    function metrics(app) {
        const s = app.state, cat = s.roles.cat, vals = s.roles.values || [];
        if (!s.data.length || !cat || !vals.length) return [];

        const colSum = {};
        vals.forEach(v => {
            colSum[v] = 0;
            s.data.forEach(r => {
                const n = parseFloat(r[v]);
                if (isFinite(n)) colSum[v] += n;
            });
        });

        const agg = {};
        s.data.forEach(r => {
            const name = String(r[cat] ?? '');
            if (!name) return;
            if (!agg[name]) agg[name] = { name, abs: 0, pctSum: 0, pctCnt: 0 };
            const rec = agg[name];
            vals.forEach(v => {
                const n = parseFloat(r[v]);
                if (!isFinite(n)) return;
                rec.abs += n;
                if (colSum[v] > 0) { rec.pctSum += n / colSum[v]; rec.pctCnt++; }
            });
        });

        return Object.values(agg).map(r => ({
            name: r.name,
            abs: r.abs,
            pct: r.pctCnt ? r.pctSum / r.pctCnt : 0
        }));
    }

    /* ============ 分类合并判断 ============ */
    function plan(app) {
        const s = app.state, key = mainKey(s);
        const m = metrics(app);
        const sorted = m.slice().sort((a, b) => b[key] - a[key]);
        const mode = s.mergeMode || 'none';
        let keepSet, other = false;
        if (mode === 'topN') {
            const n = Math.max(1, Math.round(s.topN || 10));
            keepSet = new Set(sorted.slice(0, n).map(t => t.name));
            other = m.length > n;
        } else if (mode === 'threshold') {
            const total = sorted.reduce((a, t) => a + t[key], 0);
            const thr = total * (s.thresholdPct || 0) / 100;
            keepSet = new Set(sorted.filter(t => t[key] >= thr).map(t => t.name));
            other = keepSet.size < m.length;
        } else {
            keepSet = new Set(m.map(t => t.name));
        }
        const keep = m.filter(t => keepSet.has(t.name)).map(t => t.name);
        return { keep, other, metrics: m };
    }

    /* ============ 堆叠顺序：分类在柱子上自下而上的顺序 ============ */
    function getOrderedGroupValues(app) {
        const s = app.state;
        const p = plan(app);
        const raw = p.keep.slice();
        if (p.other) raw.push('Other');
        if (!raw.length) return raw;

        const mode = s.groupOrderMode || 'input';
        if (mode === 'input') return raw;
        if (mode === 'custom') return BarCommon.applyCustomOrder(raw, s.groupOrder || '');

        const map = {};
        p.metrics.forEach(t => map[t.name] = t);

        let keyFn, dir;
        switch (mode) {
            case 'absAsc':  keyFn = n => (map[n] || { abs: 0 }).abs; dir = 1; break;
            case 'absDesc': keyFn = n => (map[n] || { abs: 0 }).abs; dir = -1; break;
            case 'pctAsc':  keyFn = n => (map[n] || { pct: 0 }).pct; dir = 1; break;
            case 'pctDesc': keyFn = n => (map[n] || { pct: 0 }).pct; dir = -1; break;
            default: return raw;
        }

        return raw.slice().sort((a, b) => {
            if (a === 'Other') return 1;
            if (b === 'Other') return -1;
            const ka = keyFn(a), kb = keyFn(b);
            if (ka !== kb) return (ka - kb) * dir;
            return raw.indexOf(a) - raw.indexOf(b);
        });
    }

    /* ============ X 轴：值列（S1、S2...）的排序 ============ */
    function getOrderedCatValues(app) {
        const s = app.state;
        const vals = (s.roles.values || []).slice();
        const sortBy = s.sortBy || '__input__';
        const dir = (s.sortDir === 'asc') ? 1 : -1;

        if (!vals.length || sortBy === '__input__') return vals;

        const keyMap = {};

        /* 按总和 / 按平均值 */
        if (sortBy === '__total__' || sortBy === '__avg__') {
            vals.forEach(v => {
                let sum = 0, cnt = 0;
                s.data.forEach(r => {
                    const n = parseFloat(r[v]);
                    if (isFinite(n)) { sum += n; cnt++; }
                });
                keyMap[v] = sortBy === '__avg__' ? (cnt ? sum / cnt : 0) : sum;
            });
        }
        /* 最上层 / 最下层 */
        else if (VALID_SORT_KEYS.has(sortBy)) {
            const stackOrder = getOrderedGroupValues(app);
            if (!stackOrder.length) return vals;
            const isTop = (sortBy === SORT_KEYS.TOP_ABS || sortBy === SORT_KEYS.TOP_PCT);
            const usePct = (sortBy === SORT_KEYS.TOP_PCT || sortBy === SORT_KEYS.BOTTOM_PCT);
            const cat = isTop ? stackOrder[stackOrder.length - 1] : stackOrder[0];
            if (!cat) return vals;

            const rows = [];
            s.data.forEach(r => {
                if (String(r[s.roles.cat]) !== cat) return;
                let rowT = 0;
                vals.forEach(v => {
                    const n = parseFloat(r[v]);
                    if (isFinite(n)) rowT += n;
                });
                rows.push({ r, rowT });
            });

            vals.forEach(v => {
                let sum = 0, cnt = 0;
                rows.forEach(({ r, rowT }) => {
                    const n = parseFloat(r[v]);
                    if (!isFinite(n)) return;
                    if (usePct) {
                        if (rowT > 0) { sum += n / rowT; cnt++; }
                    } else {
                        sum += n;
                    }
                });
                keyMap[v] = usePct ? (cnt ? sum / cnt : 0) : sum;
            });
        } else {
            return vals;
        }

        return vals.slice().sort((a, b) => {
            const ka = keyMap[a] || 0, kb = keyMap[b] || 0;
            if (ka !== kb) return (ka - kb) * dir;
            return vals.indexOf(a) - vals.indexOf(b);
        });
    }

    /* ============ 构造绘制数据 ============ */
    function buildCells(app, xVals, groupVals) {
        const s = app.state, p = plan(app), keep = new Set(p.keep);
        const map = {};
        s.data.forEach(r => {
            const name = String(r[s.roles.cat] ?? '');
            const mapped = keep.has(name) ? name : (p.other ? 'Other' : null);
            if (!mapped) return;
            xVals.forEach(v => {
                const n = parseFloat(r[v]);
                if (!isFinite(n)) return;
                const k = v + '\u0001' + mapped;
                map[k] = (map[k] || 0) + n;
            });
        });
        const cells = [];
        xVals.forEach(v => groupVals.forEach(g => {
            const k = v + '\u0001' + g;
            if (map[k] !== undefined) cells.push({ x: v, g: g, value: map[k] });
        }));
        return cells;
    }

    /* ============ UI ============ */
    function renderCats(app) {
        const s = app.state, sel = app.$('catColumnSel');
        if (!s.headers.length) {
            sel.innerHTML = '<option>' + PlotI18N.t('notSelected') + '</option>';
            sel.disabled = true;
            return;
        }
        sel.disabled = false;
        const cur = s.roles.cat || s.headers[0];
        sel.innerHTML = s.headers.map(h =>
            '<option value="' + PlotCommon.escapeHtml(h) + '" ' +
            (h === cur ? 'selected' : '') + '>' + PlotCommon.escapeHtml(h) + '</option>'
        ).join('');
    }

    function renderVals(app) {
        const s = app.state, box = app.$('valueColsBox');
        if (!s.headers.length || !s.roles.cat) {
            box.innerHTML = '<span style="color:#999;">' + T.valTip + '</span>';
            return;
        }
        const cands = s.headers.filter(h => h !== s.roles.cat);
        if (!cands.length) {
            box.innerHTML = '<span style="color:#999;">' + T.noValsTip + '</span>';
            return;
        }
        const sel = new Set(s.roles.values || []);
        box.innerHTML = cands.map(h =>
            '<label class="mini-check"><input type="checkbox" class="value-col-cb" value="' +
            PlotCommon.escapeHtml(h) + '" ' + (sel.has(h) ? 'checked' : '') + '> ' +
            PlotCommon.escapeHtml(h) + '</label>'
        ).join('');
        box.querySelectorAll('.value-col-cb').forEach(cb => {
            cb.addEventListener('change', () => {
                s.roles.values = Array.from(box.querySelectorAll('.value-col-cb:checked')).map(x => x.value);
                s.customColors = {};
                rebuildSortByOptions(app);
                refreshColors(app);
                if (s.currentSvg) app.drawChart();
            });
        });
    }

    /* 颜色按堆叠段（分类 A、B、C...）分配 */
    function refreshColors(app) {
        const c = app.$('colorAssignContainer');
        const list = getOrderedGroupValues(app);
        if (!c) return;
        if (!list.length) {
            c.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const base = app.resolvePaletteColors(list.length);
        PlotCommon.renderColorAssignment(c, {
            items: list.map((k, i) => ({ name: k, color: app.state.customColors[k] || base[i] })),
            onChange: (i, col) => {
                app.state.customColors[list[i]] = col;
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: () => {
                app.state.customColors = {};
                refreshColors(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    /* 排序依据下拉：仅 输入顺序 / 按总和 / 按平均值 / optgroup（最上最下） */
    function rebuildSortByOptions(app) {
        const sel = app.$('sortBy');
        if (!sel) return;
        const s = app.state;

        if (!s.headers.length || !s.data.length) {
            sel.innerHTML = '<option>' + PlotI18N.t('notSelected') + '</option>';
            sel.disabled = true;
            return;
        }
        sel.disabled = false;

        let cur = s.sortBy;
        const valid = cur === '__input__'
            || cur === '__total__'
            || cur === '__avg__'
            || VALID_SORT_KEYS.has(cur);
        if (!valid) cur = '__input__';
        s.sortBy = cur;

        const esc = PC.escapeHtml;
        let html = '<option value="__input__"' + (cur === '__input__' ? ' selected' : '') + '>'
            + esc(T.inputOrder) + '</option>';
        html += '<option value="__total__"' + (cur === '__total__' ? ' selected' : '') + '>'
            + esc(EN ? 'Total' : '按总和') + '</option>';
        html += '<option value="__avg__"' + (cur === '__avg__' ? ' selected' : '') + '>'
            + esc(EN ? 'Average' : '按平均值') + '</option>';
        html += '<optgroup label="' + esc(T.sortByStackLabel) + '">';
        html += '<option value="' + SORT_KEYS.TOP_ABS + '"' + (cur === SORT_KEYS.TOP_ABS ? ' selected' : '') + '>' + esc(T.sortTopAbs) + '</option>';
        html += '<option value="' + SORT_KEYS.TOP_PCT + '"' + (cur === SORT_KEYS.TOP_PCT ? ' selected' : '') + '>' + esc(T.sortTopPct) + '</option>';
        html += '<option value="' + SORT_KEYS.BOTTOM_ABS + '"' + (cur === SORT_KEYS.BOTTOM_ABS ? ' selected' : '') + '>' + esc(T.sortBottomAbs) + '</option>';
        html += '<option value="' + SORT_KEYS.BOTTOM_PCT + '"' + (cur === SORT_KEYS.BOTTOM_PCT ? ' selected' : '') + '>' + esc(T.sortBottomPct) + '</option>';
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
                absAsc:  EN ? 'Sorted by total raw value across all value columns (ascending).' : '按各分类在所有值列下的原始值总和升序。',
                absDesc: EN ? 'Sorted by total raw value across all value columns (descending).' : '按各分类在所有值列下的原始值总和降序。',
                pctAsc:  EN ? 'Sorted by average percentage across value columns (ascending).' : '按各分类在各值列中的平均占比升序。',
                pctDesc: EN ? 'Sorted by average percentage across value columns (descending).' : '按各分类在各值列中的平均占比降序。',
                custom:  EN ? 'Use the order typed in the box; values not listed are appended in input order.' : '按输入框填写的顺序；未列出的分类附后，按出现顺序。'
            };
            hint.textContent = map[mode] || map.input;
        }
    }

    function syncMergeUI(app) {
        const $ = app.$;
        const mode = $('mergeMode').value;
        app.state.mergeMode = mode;
        $('topNItem').style.display = mode === 'topN' ? '' : 'none';
        $('thresholdItem').style.display = mode === 'threshold' ? '' : 'none';
    }

    /* ============ 绘制 ============ */
    function draw(app) {
        const s = app.state;
        app.toolbarTip.textContent = '';
        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.cat) { app.showTip('msgTip3', T.noCat, 'error'); return; }
        if (!s.roles.values || !s.roles.values.length) { app.showTip('msgTip3', T.noVals, 'error'); return; }

        const p = StackedChart.readStackedParams(app);
        s.axis.x.fontFamily = p.fontFamily;
        s.axis.y.fontFamily = p.fontFamily;

        const xVals = getOrderedCatValues(app);       // X 轴：值列
        const groupVals = getOrderedGroupValues(app); // 堆叠段：分类
        if (!xVals.length || !groupVals.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const cells = buildCells(app, xVals, groupVals);
        const built = StackedChart.buildStackData(xVals, groupVals, cells, p, { allowErrorBars: false });
        if (!built.stackData.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        StackedChart.drawStackedChart(app, {
            p: p, axisCfg: s.axis,
            catVals: xVals, groupVals: groupVals,
            stackData: built.stackData, maxValue: built.maxValue
        }, { allowErrorBars: false });

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    /* ============ 注册 ============ */
    PlotApp.create({
        exportName: 'stacked_wide_bar_chart',
        importInfo: T.importInfo,
        exampleData: EX,

        stateExtra: (function () {
            const b = BarCommon.createStateExtra();
            Object.assign(b, {
                roles: { cat: '', values: [] },
                stackMode: 'absolute',
                sortBy: '__input__',
                sortDir: 'desc',
                groupOrderMode: 'input',
                groupOrder: '',
                mergeMode: 'none', topN: 10, thresholdPct: 1
            });
            return b;
        })(),

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = app.state.roles.cat || '';
            }
        },

        setup: function (app) {
            const $ = app.$, s = app.state;
            BarCommon.refreshAxisPanel(app);

            $('catColumnSel').addEventListener('change', function (e) {
                s.roles.cat = e.target.value;
                s.roles.values = s.headers.filter(h => h !== e.target.value);
                s.customColors = {};
                app.syncLegendTitle();
                renderVals(app);
                rebuildSortByOptions(app);
                refreshColors(app);
                if (s.data.length) app.drawChart();
            });

            $('sortBy').addEventListener('change', function (e) {
                s.sortBy = e.target.value;
                refreshColors(app);
                if (s.currentSvg) app.drawChart();
            });
            $('sortDir').addEventListener('change', function (e) {
                s.sortDir = e.target.value;
                refreshColors(app);
                if (s.currentSvg) app.drawChart();
            });

            const modeSel = $('groupOrderMode');
            if (modeSel) {
                modeSel.value = s.groupOrderMode || 'input';
                modeSel.addEventListener('change', function () {
                    syncGroupOrderUI(app);
                    rebuildSortByOptions(app);
                    refreshColors(app);
                    if (s.currentSvg) app.drawChart();
                });
            }
            const orderInput = $('groupOrder');
            if (orderInput) {
                orderInput.value = s.groupOrder || '';
                orderInput.addEventListener('input', function () {
                    s.groupOrder = orderInput.value;
                    if (s.groupOrderMode === 'custom') {
                        refreshColors(app);
                        if (s.currentSvg) app.drawChart();
                    }
                });
            }
            syncGroupOrderUI(app);

            const stackModeSel = $('stackMode');
            if (stackModeSel) {
                stackModeSel.value = s.stackMode || 'absolute';
                stackModeSel.addEventListener('change', function () {
                    s.stackMode = stackModeSel.value;
                    refreshColors(app);
                    if (s.currentSvg) app.drawChart();
                });
            }

            $('mergeMode').value = s.mergeMode;
            $('mergeMode').addEventListener('change', function () {
                syncMergeUI(app);
                rebuildSortByOptions(app);
                refreshColors(app);
                if (s.currentSvg) app.drawChart();
            });
            $('topN').value = s.topN;
            $('topN').addEventListener('input', function (e) {
                s.topN = Math.max(1, parseInt(e.target.value) || 10);
                refreshColors(app);
                if (s.currentSvg) app.drawChart();
            });
            $('thresholdPct').value = s.thresholdPct;
            $('thresholdPct').addEventListener('input', function (e) {
                s.thresholdPct = Math.max(0, parseFloat(e.target.value) || 0);
                refreshColors(app);
                if (s.currentSvg) app.drawChart();
            });

            renderCats(app);
            renderVals(app);
            rebuildSortByOptions(app);
            syncMergeUI(app);

            // 兜底：延迟重建一次，确保数据就绪后下拉正确
            setTimeout(function () { rebuildSortByOptions(app); }, 0);
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = res.columnTypes || {};
            s.roles = { cat: res.headers[0] || '', values: res.headers.slice(1) };
            s.customColors = {};
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            app.syncLegendTitle();
            renderCats(app);
            renderVals(app);
            rebuildSortByOptions(app);
            refreshColors(app);

            const modeSel = app.$('groupOrderMode');
            if (modeSel) modeSel.value = s.groupOrderMode || 'input';
            syncGroupOrderUI(app);

            // 兜底再跑一次
            setTimeout(function () { rebuildSortByOptions(app); }, 0);
        },

        onReset: function (app) {
            const s = app.state, $ = app.$;
            Object.assign(s, {
                columnTypes: {}, roles: { cat: '', values: [] }, customColors: {},
                sortBy: '__input__', sortDir: 'desc',
                groupOrderMode: 'input', groupOrder: '',
                mergeMode: 'none', topN: 10, thresholdPct: 1,
                stackMode: 'absolute'
            });
            s.axis = PlotAxis.defaultState();
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            $('sortDir').value = 'desc';
            $('mergeMode').value = 'none';
            $('topN').value = '10';
            $('thresholdPct').value = '1';
            const modeSel = $('groupOrderMode');
            if (modeSel) modeSel.value = 'input';
            const goEl = $('groupOrder');
            if (goEl) goEl.value = '';
            const stackModeSel = $('stackMode');
            if (stackModeSel) stackModeSel.value = 'absolute';
            BarCommon.refreshAxisPanel(app);
            renderCats(app);
            renderVals(app);
            rebuildSortByOptions(app);
            syncMergeUI(app);
            syncGroupOrderUI(app);
            refreshColors(app);
        },

        onStateRestored: function (app) {
            const s = app.state, $ = app.$;
            BarCommon.refreshAxisPanel(app);
            $('sortDir').value = s.sortDir || 'desc';
            $('mergeMode').value = s.mergeMode || 'none';
            $('topN').value = s.topN || 10;
            $('thresholdPct').value = s.thresholdPct || 1;
            const modeSel = $('groupOrderMode');
            if (modeSel) modeSel.value = s.groupOrderMode || 'input';
            const goEl = $('groupOrder');
            if (goEl) goEl.value = s.groupOrder || '';
            const stackModeSel = $('stackMode');
            if (stackModeSel) stackModeSel.value = s.stackMode || 'absolute';
            if (!s.roles || !s.roles.cat || s.headers.indexOf(s.roles.cat) < 0) {
                s.roles = { cat: s.headers[0] || '', values: s.headers.slice(1) };
            }
            const valid = new Set(s.headers);
            s.roles.values = (s.roles.values || []).filter(h => valid.has(h) && h !== s.roles.cat);
            renderCats(app);
            renderVals(app);
            rebuildSortByOptions(app);
            syncMergeUI(app);
            syncGroupOrderUI(app);
            refreshColors(app);
        },

        refreshColors: refreshColors,
        drawChart: draw
    });
})();
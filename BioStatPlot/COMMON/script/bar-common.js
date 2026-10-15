(function (global) {
    'use strict';

    const PC = global.PlotCommon;

    /* ---------- 角色下拉 ---------- */
    function fillRoleSelects(app, noGroupLabel) {
        const state = app.state;
        const xSel = app.$('xColSel');
        const gSel = app.$('groupColSel');
        const ySel = app.$('yColSel');
        if (!xSel || !gSel || !ySel) return;
        const empty = '<option>' + PlotI18N.t('notSelected') + '</option>';
        if (!state.headers.length) {
            xSel.innerHTML = empty;
            gSel.innerHTML = '<option value="">' + noGroupLabel + '</option>';
            ySel.innerHTML = empty;
            xSel.disabled = true; gSel.disabled = true; ySel.disabled = true;
            return;
        }
        xSel.disabled = false; gSel.disabled = false; ySel.disabled = false;
        const opts = (selVal, allowEmpty) => {
            let html = allowEmpty ? '<option value="">' + noGroupLabel + '</option>' : '';
            html += state.headers.map(h =>
                '<option value="' + PlotCommon.escapeHtml(h) + '" ' +
                (h === selVal ? 'selected' : '') + '>' + PlotCommon.escapeHtml(h) + '</option>'
            ).join('');
            return html;
        };
        xSel.innerHTML = opts(state.roles.x, false);
        const allowEmptyGroup = !!(noGroupLabel && noGroupLabel.trim());
        gSel.innerHTML = opts(state.roles.group, allowEmptyGroup);
        ySel.innerHTML = opts(state.roles.y, false);
    }

    /* ---------- 自定义顺序 ---------- */
    function applyCustomOrder(values, customOrder) {
        if (!customOrder) return values;
        const raw = String(customOrder).trim();
        if (!raw) return values;
        const wanted = raw.split(/[,，\s]+/).filter(Boolean);
        if (!wanted.length) return values;
        const set = new Set(values);
        const out = [];
        const used = new Set();
        wanted.forEach(w => {
            if (set.has(w) && !used.has(w)) { out.push(w); used.add(w); }
        });
        values.forEach(v => { if (!used.has(v)) out.push(v); });
        return out;
    }

    /* ---------- 分类取值 / 排序 ---------- */
    function getXValues(app) {
        const seen = new Set();
        const out = [];
        app.state.data.forEach(row => {
            const v = row[app.state.roles.x];
            if (v === undefined || v === null || v === '') return;
            const s = String(v);
            if (!seen.has(s)) { seen.add(s); out.push(s); }
        });
        return out;
    }

    function sortXValues(app, xVals) {
        const state = app.state;
        const sortBy = state.sortBy;
        const dir = (state.sortDir === 'asc') ? 1 : -1;
        if (!sortBy || sortBy === '__input__') return xVals;
        const keyMap = new Map();
        xVals.forEach(x => {
            let key = null;
            if (sortBy === state.roles.y) {
                const vals = state.data
                    .filter(r => String(r[state.roles.x]) === x)
                    .map(r => parseFloat(r[state.roles.y]))
                    .filter(v => isFinite(v));
                key = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            } else {
                const row = state.data.find(r => String(r[state.roles.x]) === x);
                if (row) {
                    const v = row[sortBy];
                    const n = parseFloat(v);
                    key = isFinite(n) ? n : String(v == null ? '' : v);
                }
            }
            keyMap.set(x, key);
        });
        return xVals.slice().sort((a, b) => {
            const ka = keyMap.get(a);
            const kb = keyMap.get(b);
            const na = parseFloat(ka);
            const nb = parseFloat(kb);
            if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
            return String(ka).localeCompare(String(kb)) * dir;
        });
    }

    /* ---------- 分组取值 / 顺序 ---------- */
    function getGroupValues(app, customOrder) {
        if (!app.state.roles.group) return [];
        const seen = new Set();
        const out = [];
        app.state.data.forEach(row => {
            const v = row[app.state.roles.group];
            if (v === undefined || v === null || v === '') return;
            const s = String(v);
            if (!seen.has(s)) { seen.add(s); out.push(s); }
        });
        if (customOrder) return applyCustomOrder(out, customOrder);
        return out;
    }

    function fillGroupOrderInput(app) {
        const el = app.$('groupOrder');
        if (!el) return;
        const vals = getGroupValues(app, '');
        el.value = vals.join(',');
    }

    /* ---------- 颜色键 ---------- */
    function getColorKeys(app) {
        if (app.state.roles.group) {
            const el = app.$('groupOrder');
            const custom = el ? el.value : '';
            return getGroupValues(app, custom);
        }
        return sortXValues(app, getXValues(app));
    }

    function refreshGroupColors(app, colorEmptyText) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const keys = getColorKeys(app);
        if (!keys.length) {
            container.innerHTML = '<div class="color-assign-empty">' + colorEmptyText + '</div>';
            return;
        }
        const baseColors = app.resolvePaletteColors(keys.length);
        const displayItems = keys.map((k, i) => ({
            name: k,
            color: app.state.customColors[k] || baseColors[i]
        }));
        PlotCommon.renderColorAssignment(container, {
            items: displayItems,
            onChange: (idx, c) => {
                app.state.customColors[keys[idx]] = c;
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: () => {
                app.state.customColors = {};
                refreshGroupColors(app, colorEmptyText);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    /* ---------- 构建单元格 ---------- */
    function buildCells(app, xVals, groupVals, hasGroup) {
        const state = app.state;
        const cellMap = new Map();
        const cellKey = (x, g) => x + '\u0001' + (g || '');

        xVals.forEach(x => {
            if (hasGroup) {
                groupVals.forEach(g => cellMap.set(cellKey(x, g), { x: x, g: g, rows: [] }));
            } else {
                cellMap.set(cellKey(x, ''), { x: x, g: '', rows: [] });
            }
        });
        state.data.forEach(row => {
            const x = String(row[state.roles.x] == null ? '' : row[state.roles.x]);
            const g = hasGroup ? String(row[state.roles.group] == null ? '' : row[state.roles.group]) : '';
            const k = cellKey(x, g);
            if (cellMap.has(k)) cellMap.get(k).rows.push(row);
        });

        const cells = [];
        cellMap.forEach(cell => {
            const vals = cell.rows.map(r => parseFloat(r[state.roles.y])).filter(v => isFinite(v));
            if (!vals.length) return;
            const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
            const firstRow = cell.rows[0];
            const ext = PlotErrorBar.computeErrorExtent(firstRow, mean, state.errBar);
            cells.push({ x: cell.x, g: cell.g, value: mean, ext: ext });
        });
        return cells;
    }

    /* ---------- 轴标题同步 ---------- */
    function syncAxisTitlesByDirection(app) {
        const st = app.state;
        const dir = st.barDirection || 'vertical';
        if (!st.axis.x.titleEdited) {
            st.axis.x.titleContent = (dir === 'horizontal')
                ? (st.roles.y || '')
                : (st.roles.x || '');
        }
        if (!st.axis.y.titleEdited) {
            st.axis.y.titleContent = (dir === 'horizontal')
                ? (st.roles.x || '')
                : (st.roles.y || '');
        }
    }

    /* ---------- 面板辅助（保留） ---------- */
    function updatePanelFontInputs(app) {
        const container = app.$('axisPanelContainer');
        if (!container) return;
        ['x', 'y'].forEach(k => {
            const cfg = app.state.axis[k];
            const q = sel => container.querySelector('.ax-' + k + '-' + sel);
            const setVal = (el, v) => {
                if (!el) return;
                if (el.type === 'checkbox') el.checked = !!v;
                else el.value = v;
            };
            setVal(q('tick-fs'), cfg.tickFontSize);
            setVal(q('tick-b'), cfg.tickBold);
            setVal(q('tick-i'), cfg.tickItalic);
            setVal(q('title-fs'), cfg.titleFontSize);
            setVal(q('title-b'), cfg.titleBold);
            setVal(q('title-i'), cfg.titleItalic);
        });
    }

    /* ---------- 轴面板 ---------- */
    function refreshAxisPanel(app) {
        const direction = app.state.barDirection || 'vertical';
        PlotAxis.render(app.$('axisPanelContainer'), {
            state: app.state.axis,
            direction: direction,
            onGlobalFontChange: function () {
                /* 全局字体变化 → 同步到 X/Y 轴面板显示 */
                updatePanelFontInputs(app);
                if (app.state.currentSvg) app.drawChart();
            },
            onChange: function () {
                if (app.state.currentSvg) app.drawChart();
            },
            onDirectionChange: function (newDir) {
                app.state.barDirection = newDir;
                syncAxisTitlesByDirection(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
        ['x', 'y'].forEach(k => {
            const input = app.$('axisPanelContainer').querySelector('.ax-' + k + '-title');
            if (input) {
                input.addEventListener('input', function () {
                    app.state.axis[k].titleEdited = true;
                });
            }
        });
    }

    /* ---------- 误差棒面板 ---------- */
    function refreshErrorBarPanel(app) {
        const container = app.$('errorBarPanelContainer');
        if (!container) return;

        if (app.state.stackMode === 'percent') {
            const isEn = PlotI18N.lang() === 'en';
            container.className = 'param-panel';
            container.innerHTML =
                '<div class="param-panel-title">' +
                    (isEn ? 'Error Bar Settings' : '误差棒设置') +
                '</div>' +
                '<div class="info-box" style="color:#d93025;">' +
                    (isEn
                        ? 'Error bars are disabled in <strong>percentage stacking</strong>, because converting absolute abundance to percentage cannot be simply scaled for error bars. Please switch to <strong>Absolute stacking</strong> to enable them.'
                        : '百分比堆叠模式下禁止使用误差棒：绝对丰度转换为百分比后，误差棒不能直接等比缩放。请切换到 <strong>绝对值堆叠</strong> 后再设置误差棒。') +
                '</div>';
            return;
        }

        PlotErrorBar.renderErrorBarConfig(container, {
            headers: app.state.headers,
            state: app.state.errBar,
            onChange: () => { if (app.state.currentSvg) app.drawChart(); }
        });
    }

    /* ---------- 角色选择事件 ---------- */
    function bindRoleEvents(app, onXChange, onGroupChange, onYChange) {
        app.$('xColSel').addEventListener('change', () => {
            app.state.roles.x = app.$('xColSel').value;
            app.state.customColors = {};
            app.syncLegendTitle();
            if (onXChange) onXChange(app);
            syncAxisTitlesByDirection(app);
            const input = app.$('axisPanelContainer').querySelector(
                (app.state.barDirection === 'horizontal') ? '.ax-y-title' : '.ax-x-title');
            if (input) input.value = (app.state.barDirection === 'horizontal')
                ? (app.state.axis.y.titleContent || '')
                : (app.state.axis.x.titleContent || '');
            app.refreshColors(app);
            if (app.state.data.length) app.drawChart();
        });
        app.$('groupColSel').addEventListener('change', () => {
            app.state.roles.group = app.$('groupColSel').value;
            app.state.customColors = {};
            app.syncLegendTitle();
            fillGroupOrderInput(app);
            if (onGroupChange) onGroupChange(app);
            app.refreshColors(app);
            if (app.state.data.length) app.drawChart();
        });
        app.$('yColSel').addEventListener('change', () => {
            app.state.roles.y = app.$('yColSel').value;
            if (onYChange) onYChange(app);
            syncAxisTitlesByDirection(app);
            const input = app.$('axisPanelContainer').querySelector(
                (app.state.barDirection === 'horizontal') ? '.ax-x-title' : '.ax-y-title');
            if (input) input.value = (app.state.barDirection === 'horizontal')
                ? (app.state.axis.x.titleContent || '')
                : (app.state.axis.y.titleContent || '');
            app.refreshColors(app);
            if (app.state.data.length) app.drawChart();
        });

        const goEl = app.$('groupOrder');
        if (goEl) {
            goEl.addEventListener('input', () => {
                app.refreshColors(app);
                if (app.state.currentSvg) app.drawChart();
            });
        }
    }

    /* ---------- 状态 ---------- */
    function createStateExtra() {
        return {
            barDirection: 'vertical',
            barType: 'grouped',
            roles: { x: '', group: '', y: '' },
            columnTypes: {},
            sortBy: '__input__',
            sortDir: 'desc',
            axis: (function () {
                const a = PlotAxis.defaultState();
                a.x.titleEdited = false;
                a.y.titleEdited = false;
                return a;
            })(),
            errBar: {
                mode: 'none', lowerCol: '', upperCol: '', errCol: '',
                showWhich: 'both', colorMode: 'uniform',
                errColor: '#e67700', errWidth: 3, capWidth: 8
            }
        };
    }

    /* ---------- 柱形参数 ---------- */
    function readBarParams(app) {
        const $ = app.$;
        return {
            barInnerGap: Math.max(0, Math.min(0.9, PC.num(app, 'barInnerGap', 0.15))),
            barOuterGap: Math.max(0, Math.min(0.9, PC.num(app, 'barOuterGap', 0.3))),
            barWidthScale: Math.max(0.2, Math.min(1, PC.num(app, 'barWidthScale', 1))),
            barStrokeWidth: Math.max(0, PC.num(app, 'barStrokeWidth', 0)),
            barStrokeColor: $('barStrokeColor').value || '#ffffff',
            barShowValue: $('barShowValue').checked,
            barValueFontSize: Math.max(6, PC.num(app, 'barValueFontSize', 12)),
            groupOrder: ($('groupOrder') && $('groupOrder').value) || ''
        };
    }

    /* ---------- 误差棒绘制 ---------- */

    function drawErrorBar(parent, opts) {
        const {
            xPx, yPx,
            barThickness,
            loPx, hiPx,
            valuePx,
            isHorizontal,
            errColor, errWidth, capWidth,
            capMode
        } = opts;

        const capHalf = (capWidth != null)
            ? capWidth / 2
            : Math.min(barThickness * 0.35, 8);
        const mode = capMode || 'both';

        const line = (x1, y1, x2, y2) => parent.append('line')
            .attr('x1', x1).attr('y1', y1)
            .attr('x2', x2).attr('y2', y2)
            .attr('stroke', errColor).attr('stroke-width', errWidth);

        if (isHorizontal) {
            if (mode === 'both') {
                line(loPx, yPx, hiPx, yPx);
                line(loPx, yPx - capHalf, loPx, yPx + capHalf);
                line(hiPx, yPx - capHalf, hiPx, yPx + capHalf);
            } else if (mode === 'upper') {
                const vPx = (valuePx != null) ? valuePx : loPx;
                line(vPx, yPx, hiPx, yPx);
                line(hiPx, yPx - capHalf, hiPx, yPx + capHalf);
            } else if (mode === 'lower') {
                const vPx = (valuePx != null) ? valuePx : hiPx;
                line(vPx, yPx, loPx, yPx);
                line(loPx, yPx - capHalf, loPx, yPx + capHalf);
            }
        } else {
            const topPx = Math.min(loPx, hiPx);
            const botPx = Math.max(loPx, hiPx);
            const vPx = (valuePx != null) ? valuePx : botPx;

            if (mode === 'both') {
                line(xPx, topPx, xPx, botPx);
                line(xPx - capHalf, topPx, xPx + capHalf, topPx);
                line(xPx - capHalf, botPx, xPx + capHalf, botPx);
            } else if (mode === 'upper') {
                line(xPx, vPx, xPx, topPx);
                line(xPx - capHalf, topPx, xPx + capHalf, topPx);
            } else if (mode === 'lower') {
                line(xPx, vPx, xPx, botPx);
                line(xPx - capHalf, botPx, xPx + capHalf, botPx);
            }
        }
    }
    /* ---------- 轴标题绘制 ---------- */
    function drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad) {
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
                .attr('transform', 'translate(' + (plotX - leftPad + 12) + ', ' + (plotY + plotH / 2) + ') rotate(-90)')
                .attr('text-anchor', 'middle')
                .attr('font-size', axisCfg.y.titleFontSize)
                .attr('font-weight', axisCfg.y.titleBold ? 'bold' : 'normal')
                .attr('font-style', axisCfg.y.titleItalic ? 'italic' : 'normal')
                .attr('fill', '#333')
                .text(axisCfg.y.titleContent);
        }
    }

    function resetAfterDirectionChange(app) {
        syncAxisTitlesByDirection(app);
        const container = app.$('axisPanelContainer');
        if (!container) return;
        ['x', 'y'].forEach(k => {
            const input = container.querySelector('.ax-' + k + '-title');
            if (input) input.value = app.state.axis[k].titleContent || '';
        });
    }

    /* ---------- 对外暴露 ---------- */
    global.BarCommon = {
        fillRoleSelects,
        applyCustomOrder,
        getXValues, sortXValues,
        getGroupValues, fillGroupOrderInput,
        getColorKeys, refreshGroupColors,
        buildCells,
        syncAxisTitlesByDirection,
        updatePanelFontInputs,
        refreshAxisPanel, refreshErrorBarPanel,
        bindRoleEvents,
        createStateExtra,
        readBarParams,
        drawErrorBar, drawAxisTitles,
        resetAfterDirectionChange
    };
})(window);
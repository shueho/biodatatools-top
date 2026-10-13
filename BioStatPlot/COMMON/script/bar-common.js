/* ============================================================
   BioDataTools 柱状图家族公共模块
============================================================ */
(function (global) {
    'use strict';

    function num(app, id, fallback) {
        const el = app.$(id);
        if (!el) return fallback;
        const v = parseFloat(el.value);
        return isFinite(v) ? v : fallback;
    }

    function estTextWidth(str, fontSize) {
        let w = 0;
        for (const ch of String(str)) w += /[\u4e00-\u9fa5\uff00-\uffef]/.test(ch) ? 1 : 0.55;
        return w * fontSize;
    }

    function fmtNum(v, d) {
        if (!isFinite(v)) return '';
        if (Number.isInteger(v)) return String(v);
        return Number(v).toFixed(d);
    }

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

    function syncGlobalAxisFontToUI(app) {
        app.$('axisTickFontSize').value = app.state.axis.x.tickFontSize;
        app.$('axisTickBold').checked = app.state.axis.x.tickBold;
        app.$('axisTickItalic').checked = app.state.axis.x.tickItalic;
        app.$('axisTitleFontSize').value = app.state.axis.x.titleFontSize;
        app.$('axisTitleBold').checked = app.state.axis.x.titleBold;
        app.$('axisTitleItalic').checked = app.state.axis.x.titleItalic;
    }

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

    function syncGlobalFromPanel(app) {
        const container = app.$('axisPanelContainer');
        if (!container) return;
        const q = sel => container.querySelector('.ax-x-' + sel);
        const fs = parseFloat(q('tick-fs') && q('tick-fs').value);
        const b = q('tick-b') && q('tick-b').checked;
        const i = q('tick-i') && q('tick-i').checked;
        if (isFinite(fs)) app.$('axisTickFontSize').value = fs;
        if (b !== undefined && b !== null) app.$('axisTickBold').checked = b;
        if (i !== undefined && i !== null) app.$('axisTickItalic').checked = i;

        const tfs = parseFloat(q('title-fs') && q('title-fs').value);
        const tb = q('title-b') && q('title-b').checked;
        const ti = q('title-i') && q('title-i').checked;
        if (isFinite(tfs)) app.$('axisTitleFontSize').value = tfs;
        if (tb !== undefined && tb !== null) app.$('axisTitleBold').checked = tb;
        if (ti !== undefined && ti !== null) app.$('axisTitleItalic').checked = ti;
    }

    function applyGlobalAxisFont(app) {
        const state = app.state;
        const fs = Math.max(6, parseFloat(app.$('axisTickFontSize').value) || 14);
        const b = app.$('axisTickBold').checked;
        const i = app.$('axisTickItalic').checked;
        state.axis.x.tickFontSize = fs;
        state.axis.y.tickFontSize = fs;
        state.axis.x.tickBold = b;
        state.axis.y.tickBold = b;
        state.axis.x.tickItalic = i;
        state.axis.y.tickItalic = i;

        const tfs = Math.max(6, parseFloat(app.$('axisTitleFontSize').value) || 16);
        const tb = app.$('axisTitleBold').checked;
        const ti = app.$('axisTitleItalic').checked;
        state.axis.x.titleFontSize = tfs;
        state.axis.y.titleFontSize = tfs;
        state.axis.x.titleBold = tb;
        state.axis.y.titleBold = tb;
        state.axis.x.titleItalic = ti;
        state.axis.y.titleItalic = ti;

        updatePanelFontInputs(app);
        if (state.currentSvg) app.drawChart();
    }

    function refreshAxisPanel(app) {
        const direction = app.state.barDirection || 'vertical';
        PlotAxis.render(app.$('axisPanelContainer'), {
            state: app.state.axis,
            direction: direction,
            onChange: () => {
                syncGlobalFromPanel(app);
                if (app.state.currentSvg) app.drawChart();
            },
            onDirectionChange: (newDir) => {
                app.state.barDirection = newDir;
                syncAxisTitlesByDirection(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
        ['x', 'y'].forEach(k => {
            const input = app.$('axisPanelContainer').querySelector('.ax-' + k + '-title');
            if (input) {
                input.addEventListener('input', () => {
                    app.state.axis[k].titleEdited = true;
                });
            }
        });
    }

    function refreshErrorBarPanel(app) {
        PlotErrorBar.renderErrorBarConfig(app.$('errorBarPanelContainer'), {
            headers: app.state.headers,
            state: app.state.errBar,
            onChange: () => { if (app.state.currentSvg) app.drawChart(); }
        });
    }

    function bindRoleEvents(app, onXChange, onGroupChange, onYChange) {
        app.$('xColSel').addEventListener('change', () => {
            app.state.roles.x = app.$('xColSel').value;
            app.state.customColors = {};
            app.syncLegendTitle();
            if (onXChange) onXChange(app);
            syncAxisTitlesByDirection(app);
            /* 把新标题同步到面板输入框 */
            const input = app.$('axisPanelContainer').querySelector(
                (app.state.barDirection === 'horizontal') ? '.ax-y-title' : '.ax-x-title');
            if (input) input.value = (app.state.barDirection === 'horizontal')
                ? (app.state.axis.y.titleContent || '')
                : (app.state.axis.x.titleContent || '');
            app.refreshColors();
            if (app.state.data.length) app.drawChart();
        });
        app.$('groupColSel').addEventListener('change', () => {
            app.state.roles.group = app.$('groupColSel').value;
            app.state.customColors = {};
            app.syncLegendTitle();
            fillGroupOrderInput(app);
            if (onGroupChange) onGroupChange(app);
            app.refreshColors();
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
            app.refreshColors();
            if (app.state.data.length) app.drawChart();
        });

        const goEl = app.$('groupOrder');
        if (goEl) {
            goEl.addEventListener('input', () => {
                app.refreshColors();
                if (app.state.currentSvg) app.drawChart();
            });
        }

        ['axisTickFontSize', 'axisTitleFontSize'].forEach(id => {
            const el = app.$(id);
            if (el) {
                el.addEventListener('input', () => applyGlobalAxisFont(app));
                el.addEventListener('change', () => applyGlobalAxisFont(app));
            }
        });
        ['axisTickBold', 'axisTickItalic', 'axisTitleBold', 'axisTitleItalic'].forEach(id => {
            const el = app.$(id);
            if (el) el.addEventListener('change', () => applyGlobalAxisFont(app));
        });
    }

    function createStateExtra() {
        return {
            barDirection: 'vertical',   /* vertical | horizontal */
            barType: 'grouped',          /* grouped | stacked（预留） */
            roles: { x: '', group: '', y: '' },
            columnTypes: {},
            sortBy: '__input__',
            sortDir: 'asc',
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

    function readBarParams(app) {
        const $ = app.$;
        return {
            barInnerGap: Math.max(0, Math.min(0.9, num(app, 'barInnerGap', 0.15))),
            barOuterGap: Math.max(0, Math.min(0.9, num(app, 'barOuterGap', 0.3))),
            barWidthScale: Math.max(0.2, Math.min(1, num(app, 'barWidthScale', 1))),
            barStrokeWidth: Math.max(0, num(app, 'barStrokeWidth', 0)),
            barStrokeColor: $('barStrokeColor').value || '#ffffff',
            barShowValue: $('barShowValue').checked,
            barValueFontSize: Math.max(6, num(app, 'barValueFontSize', 12)),
            groupOrder: ($('groupOrder') && $('groupOrder').value) || ''
        };
    }

    function readTitleLegendParams(app) {
        const $ = app.$;
        return {
            fontFamily: $('fontFamily').value || 'Times New Roman',
            legendFontSize: Math.max(6, num(app, 'legendFontSize', 15)),
            legendBold: $('legendBold').checked,
            legendItalic: $('legendItalic').checked,
            legendTitleFontSize: Math.max(6, num(app, 'legendTitleFontSize', 15)),
            legendTitleBold: $('legendTitleBold').checked,
            legendTitleItalic: $('legendTitleItalic').checked,
            titleFontSize: Math.max(6, num(app, 'titleFontSize', 22)),
            titleBold: $('titleBold').checked,
            titleItalic: $('titleItalic').checked,
            titlePosition: $('titlePosition').value || 'top-center',
            showLegend: $('showLegend').checked,
            legendPosition: $('legendPosition').value || 'right',
            legendGap: Math.max(0, num(app, 'legendGap', 30)),
            showLegendTitle: $('showLegendTitle').checked,
            legendTitle: $('legendTitle').value || '',
            showTitle: $('showTitle').checked,
            chartTitle: $('chartTitle').value || ''
        };
    }

    function readCanvasParams(app, defW, defH) {
        const $ = app.$;
        return {
            width: Math.max(300, num(app, 'chartWidth', defW || 760)),
            height: Math.max(300, num(app, 'chartHeight', defH || 600)),
            showCanvasBorder: $('showCanvasBorder').checked
        };
    }

    function computeLegendArea(p, hasLegendTitle, legendTitleH, legendInlineH, legendColW) {
        const gapShift = Math.max(0, p.legendGap || 0);
        const margin = 30;
        const wantLegend = !!p.showLegend;
        const pos = p.legendPosition || 'right';
        const isRight = wantLegend && pos === 'right';
        const isLeft = wantLegend && pos === 'left';
        const isTop = wantLegend && pos === 'top';
        const isBottom = wantLegend && pos === 'bottom';
        const vert = isRight || isLeft;

        let areaX = margin, areaY = margin;
        let areaW = p.width - 2 * margin;
        let areaH = p.height - 2 * margin;

        if (isRight) areaW = p.width - legendColW - 2 * margin;
        else if (isLeft) { areaX = legendColW + 2 * margin; areaW = p.width - legendColW - 2 * margin; }
        else if (isTop) { areaY = legendInlineH + 2 * margin; areaH = p.height - legendInlineH - 2 * margin; }
        else if (isBottom) areaH = p.height - legendInlineH - 2 * margin;

        areaW = Math.max(20, areaW);
        areaH = Math.max(20, areaH);

        let legendArea = null;
        let orientation = 'vertical';
        if (wantLegend) {
            if (vert) {
                orientation = 'vertical';
                const legendX = isRight
                    ? Math.max(margin, p.width - margin - legendColW - gapShift)
                    : Math.min(p.width - margin - legendColW, margin + gapShift);
                legendArea = { x: legendX, y: areaY, w: legendColW, h: areaH };
            } else {
                orientation = 'horizontal';
                const legendY = isTop
                    ? Math.min(p.height - margin - legendInlineH, margin + gapShift)
                    : Math.max(margin, p.height - margin - legendInlineH - gapShift);
                legendArea = { x: 0, y: legendY, w: p.width, h: legendInlineH };
            }
        }

        return {
            areaX, areaY, areaW, areaH,
            legendArea, legendOrientation: orientation,
            isRight, isLeft, isTop, isBottom, vert
        };
    }

    function drawLegend(svg, p, groupVals, colorOf, legendArea, orientation, hasLegendTitle) {
        PlotLegend.draw(svg, {
            orientation: orientation,
            area: legendArea,
            width: p.width,
            items: groupVals.map(g => ({ label: String(g), color: colorOf(g), shape: 'rect' })),
            fontSize: p.legendFontSize,
            bold: p.legendBold,
            italic: p.legendItalic,
            markerSize: p.legendFontSize,
            textGap: 8,
            itemGap: 20,
            showTitle: hasLegendTitle,
            title: p.legendTitle,
            titleFontSize: p.legendTitleFontSize,
            titleBold: p.legendTitleBold,
            titleItalic: p.legendTitleItalic
        });
    }


    function drawErrorBar(parent, opts) {
        const {
            xPx, yPx,                        
            barThickness,                    
            loPx, hiPx,                     
            isHorizontal,
            errColor, errWidth, capWidth
        } = opts;

        const capHalf = (capWidth != null)
            ? capWidth / 2
            : Math.min(barThickness * 0.35, 8);

        if (isHorizontal) {
            parent.append('line')
                .attr('x1', loPx).attr('y1', yPx)
                .attr('x2', hiPx).attr('y2', yPx)
                .attr('stroke', errColor).attr('stroke-width', errWidth);
            parent.append('line')
                .attr('x1', hiPx).attr('y1', yPx - capHalf)
                .attr('x2', hiPx).attr('y2', yPx + capHalf)
                .attr('stroke', errColor).attr('stroke-width', errWidth).attr('stroke-linecap', 'round');
            parent.append('line')
                .attr('x1', loPx).attr('y1', yPx - capHalf)
                .attr('x2', loPx).attr('y2', yPx + capHalf)
                .attr('stroke', errColor).attr('stroke-width', errWidth).attr('stroke-linecap', 'round');
        } else {
            parent.append('line')
                .attr('x1', xPx).attr('y1', loPx)
                .attr('x2', xPx).attr('y2', hiPx)
                .attr('stroke', errColor).attr('stroke-width', errWidth);
            parent.append('line')
                .attr('x1', xPx - capHalf).attr('y1', hiPx)
                .attr('x2', xPx + capHalf).attr('y2', hiPx)
                .attr('stroke', errColor).attr('stroke-width', errWidth).attr('stroke-linecap', 'round');
            parent.append('line')
                .attr('x1', xPx - capHalf).attr('y1', loPx)
                .attr('x2', xPx + capHalf).attr('y2', loPx)
                .attr('stroke', errColor).attr('stroke-width', errWidth).attr('stroke-linecap', 'round');
        }
    }

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

    global.BarCommon = {
        num, estTextWidth, fmtNum,
        fillRoleSelects,
        applyCustomOrder,
        getXValues, sortXValues,
        getGroupValues, fillGroupOrderInput,
        getColorKeys, refreshGroupColors,
        buildCells,
        syncAxisTitlesByDirection,
        syncGlobalAxisFontToUI, updatePanelFontInputs,
        syncGlobalFromPanel, applyGlobalAxisFont,
        refreshAxisPanel, refreshErrorBarPanel,
        bindRoleEvents,
        createStateExtra,
        readBarParams, readTitleLegendParams, readCanvasParams,
        computeLegendArea, drawLegend,
        drawErrorBar, drawAxisTitles,
        resetAfterDirectionChange
    };
})(window);
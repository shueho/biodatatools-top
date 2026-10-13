(function () {
    'use strict';

    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Must include a header row with at least an <strong>X (independent) column</strong> and a <strong>Y (dependent) column</strong>. Two examples are provided: no grouping (range bars) and grouped (error-value bars).'
            : '需包含表头，且至少包含 <strong>自变量列</strong> 和 <strong>因变量列</strong>。示例提供两个版本：无分组（带范围棒）、有分组（误差值棒）。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select the X (independent) and Y (dependent) columns' : '❌ 请选择自变量（X）与因变量（Y）',
        noValid: EN ? '❌ Could not generate valid plot data. Please check the Y column' : '❌ 未能生成有效绘图数据，请检查因变量列',
        noGroup: EN ? 'No group' : '无',
        colorEmpty: EN ? 'Category colors will be shown here after selecting data columns' : '选择数据列后将在此处显示每个类别的颜色'
    };

    const EX_PLAIN = 'X\tValue\tLower\tUpper\nA\t18\t15\t21\nB\t32\t28\t36\nC\t12\t10\t14\nD\t24\t21\t27\nE\t8\t6\t10';
    const EX_ERRVAL = 'X\tGroup\tValue\tError\nA\tCtrl\t20\t2\nA\tTrt1\t25\t3\nB\tCtrl\t30\t4\nB\tTrt1\t35\t5\nC\tCtrl\t18\t2\nC\tTrt1\t24\t3';

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

    /* ---------------- 角色下拉 ---------------- */
    function fillRoleSelects(app) {
        const state = app.state;
        const xSel = app.$('xColSel');
        const gSel = app.$('groupColSel');
        const ySel = app.$('yColSel');
        const empty = '<option>' + PlotI18N.t('notSelected') + '</option>';
        if (!state.headers.length) {
            xSel.innerHTML = empty;
            gSel.innerHTML = '<option value="">' + T.noGroup + '</option>';
            ySel.innerHTML = empty;
            xSel.disabled = true;
            gSel.disabled = true;
            ySel.disabled = true;
            return;
        }
        xSel.disabled = false;
        gSel.disabled = false;
        ySel.disabled = false;
        const opts = (selVal, allowEmpty) => {
            let html = allowEmpty ? '<option value="">' + T.noGroup + '</option>' : '';
            html += state.headers.map(h =>
                '<option value="' + PlotCommon.escapeHtml(h) + '" ' +
                (h === selVal ? 'selected' : '') + '>' + PlotCommon.escapeHtml(h) + '</option>'
            ).join('');
            return html;
        };
        xSel.innerHTML = opts(state.roles.x, false);
        gSel.innerHTML = opts(state.roles.group, true);
        ySel.innerHTML = opts(state.roles.y, false);
    }

    /* ---------------- X 值获取与排序 ---------------- */
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

    /* ---------------- 分组 / 颜色 ---------------- */
    function getGroupValues(app) {
        if (!app.state.roles.group) return [];
        const seen = new Set();
        const out = [];
        app.state.data.forEach(row => {
            const v = row[app.state.roles.group];
            if (v === undefined || v === null || v === '') return;
            const s = String(v);
            if (!seen.has(s)) { seen.add(s); out.push(s); }
        });
        return out;
    }

    /* 有分组→按分组；无分组→跟随 X 排序 */
    function getColorKeys(app) {
        if (app.state.roles.group) return getGroupValues(app);
        return sortXValues(app, getXValues(app));
    }

    function refreshGroupColors(app) {
        const container = app.$('colorAssignContainer');
        const keys = getColorKeys(app);
        if (!keys.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
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
                refreshGroupColors(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    /* ---------------- 坐标轴字体同步 ---------------- */
    function syncAxisTitles(app) {
        const state = app.state;
        if (!state.axis.x.titleEdited) state.axis.x.titleContent = state.roles.x || '';
        if (!state.axis.y.titleEdited) state.axis.y.titleContent = state.roles.y || '';
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
        PlotAxis.render(app.$('axisPanelContainer'), {
            state: app.state.axis,
            axisTypes: { x: 'category', y: 'numeric' },
            onChange: () => {
                syncGlobalFromPanel(app);
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

    /* ---------------- 参数读取 ---------------- */
    function readParams(app) {
        const $ = app.$;
        return {
            width: Math.max(300, num(app, 'chartWidth', 760)),
            height: Math.max(300, num(app, 'chartHeight', 600)),
            showCanvasBorder: $('showCanvasBorder').checked,

            barInnerGap: Math.max(0, Math.min(0.9, num(app, 'barInnerGap', 0.15))),
            barOuterGap: Math.max(0, Math.min(0.9, num(app, 'barOuterGap', 0.3))),
            barWidthScale: Math.max(0.2, Math.min(1, num(app, 'barWidthScale', 1))),
            barStrokeWidth: Math.max(0, num(app, 'barStrokeWidth', 0)),
            barStrokeColor: $('barStrokeColor').value || '#ffffff',
            barShowValue: $('barShowValue').checked,
            barValueFontSize: Math.max(6, num(app, 'barValueFontSize', 12)),

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

    /* ---------------- 主绘制 ---------------- */
    function drawChart(app) {
        const state = app.state;
        const $ = app.$;
        app.toolbarTip.textContent = '';

        if (!state.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!state.roles.x || !state.roles.y) { app.showTip('msgTip3', T.selectCols, 'error'); return; }

        const p = readParams(app);
        const axisCfg = state.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        /* X 值（已排序） */
        const xVals = sortXValues(app, getXValues(app));
        const groupVals = getGroupValues(app);
        const hasGroup = groupVals.length > 0;

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

        if (!cells.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const isLogY = axisCfg.y.scaleType === 'log';
        const logBaseY = (axisCfg.y.logBase && axisCfg.y.logBase > 0) ? axisCfg.y.logBase : 10;

        /* Y 范围 */
        const maxY = Math.max.apply(null, cells.map(c => c.ext ? Math.max(c.value, c.ext.upper) : c.value));
        const minYData = Math.min.apply(null, cells.map(c => c.ext ? Math.min(c.value, c.ext.lower) : c.value));
        const minY = isLogY ? minYData : Math.min(0, minYData);

        const width = p.width;
        const height = p.height;

        const titleH = (p.showTitle && p.chartTitle) ? p.titleFontSize + 10 : 0;

        const legendColW = 200;
        const legendRowH = p.legendFontSize + 10;
        const hasLegendTitle = !!(p.showLegendTitle && p.legendTitle && p.legendTitle.trim());
        const legendTitleH = hasLegendTitle ? (p.legendTitleFontSize + 10) : 0;
        const legendInlineH = p.legendFontSize + 20 + legendTitleH;
        const gap = p.legendGap;
        const margin = 30;

        const wantLegend = !!p.showLegend && hasGroup;
        const pos = p.legendPosition || 'right';
        const isRight = wantLegend && pos === 'right';
        const isLeft = wantLegend && pos === 'left';
        const isTop = wantLegend && pos === 'top';
        const isBottom = wantLegend && pos === 'bottom';
        const vert = isRight || isLeft;

        let areaX = margin, areaY = margin;
        let areaW = width - 2 * margin;
        let areaH = height - 2 * margin;

        if (isRight) areaW = width - legendColW - 2 * margin;
        else if (isLeft) { areaX = legendColW + 2 * margin; areaW = width - legendColW - 2 * margin; }
        else if (isTop) { areaY = legendInlineH + 2 * margin; areaH = height - legendInlineH - 2 * margin; }
        else if (isBottom) areaH = height - legendInlineH - 2 * margin;
        areaW = Math.max(20, areaW);
        areaH = Math.max(20, areaH);

        const gridAreaH = Math.max(20, areaH - titleH);

        const xLabelFont = axisCfg.x.tickValueShow ? axisCfg.x.tickFontSize : 0;
        const yLabelFont = axisCfg.y.tickValueShow ? axisCfg.y.tickFontSize : 0;
        const xTitleFont = (axisCfg.x.titleShow && axisCfg.x.titleContent) ? axisCfg.x.titleFontSize + 8 : 0;
        const yTitleFont = (axisCfg.y.titleShow && axisCfg.y.titleContent) ? axisCfg.y.titleFontSize + 8 : 0;

        const leftPad = yLabelFont + 10 + yTitleFont + 10;
        const bottomPad = xLabelFont + 12 + xTitleFont + 10;
        const rightPad = 30;
        const topPad = 20;

        const plotX = areaX + leftPad;
        const plotY = areaY + titleH + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, gridAreaH - topPad - bottomPad);

        /* ---------- Y 轴：线性 / 对数 ---------- */
        let yDomain = PlotAxis.resolveDomain(axisCfg.y, [minY, maxY]);
        if (isLogY) {
            if (!isFinite(yDomain[0]) || yDomain[0] <= 0) {
                const posVals = cells.map(c => c.value).filter(v => v > 0);
                yDomain[0] = (posVals.length ? Math.min.apply(null, posVals) : 1) * 0.5;
            }
            if (!isFinite(yDomain[1]) || yDomain[1] <= yDomain[0]) {
                yDomain[1] = yDomain[0] * logBaseY;
            }
        }

        let yScaleRaw;
        if (isLogY) {
            yScaleRaw = d3.scaleLog()
                .base(logBaseY)
                .domain(yDomain)
                .range([plotY + plotH, plotY]);
        } else {
            yScaleRaw = d3.scaleLinear()
                .domain(yDomain)
                .range([plotY + plotH, plotY])
                .nice();
        }

        const yScale = (!isLogY) ? PlotAxis.applyBreak(yScaleRaw, axisCfg.y) : yScaleRaw;
        const yBreakPos = (!isLogY) ? PlotAxis.getBreakPosition(yScale, axisCfg.y) : NaN;

        /* ---------- X 轴：分类 → scaleBand ---------- */
        const xOuter = d3.scaleBand()
            .domain(xVals)
            .range([plotX, plotX + plotW])
            .paddingOuter(p.barOuterGap)
            .paddingInner(p.barOuterGap);

        const xInner = hasGroup
            ? d3.scaleBand()
                .domain(groupVals)
                .range([0, xOuter.bandwidth()])
                .paddingInner(p.barInnerGap)
            : null;

        /* ---------- X 轴的像素位置（横向主轴线） ---------- */
        let xAxisYFinal = plotY + plotH;
        if (axisCfg.x.crossMode === 'max') {
            xAxisYFinal = plotY;
        } else if (axisCfg.x.crossMode === 'zero') {
            xAxisYFinal = isLogY ? (plotY + plotH) : yScale(0);
        } else if (axisCfg.x.crossMode === 'custom' && isFinite(axisCfg.x.crossValue)) {
            const v = axisCfg.x.crossValue;
            xAxisYFinal = isLogY
                ? (v > 0 ? yScale(v) : plotY + plotH)
                : yScale(v);
        }
        if (!isFinite(xAxisYFinal)) xAxisYFinal = plotY + plotH;

        /* ---------- Y 轴像素位置 ---------- */
        const yAxisX = plotX;

        /* ---------- 颜色 ---------- */
        const colorKeys = getColorKeys(app);
        const baseColors = app.resolvePaletteColors(colorKeys.length);
        const colorOf = k => {
            if (!k) return '#cccccc';
            const idx = colorKeys.indexOf(k);
            return state.customColors[k] || baseColors[idx] || '#cccccc';
        };

        /* ---------- 画布 ---------- */
        const canvas = PlotCanvas.create(app.chartPreview, {
            width: width, height: height, fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        state.currentSvg = canvas.node;

        if (p.showTitle && p.chartTitle) {
            PlotTitle.draw(svg, {
                width: width, height: height, position: p.titlePosition, text: p.chartTitle,
                fontSize: p.titleFontSize, bold: p.titleBold, italic: p.titleItalic
            });
        }

        /* ---------- Y 网格 ---------- */
        if (axisCfg.y.gridShow) {
            const gridY = svg.append('g').attr('class', 'grid grid-y');
            const ticks = yScale.ticks ? yScale.ticks() : yScale.domain();
            ticks.forEach(t => {
                if (!isLogY && axisCfg.y.breakEnable && t > axisCfg.y.breakFrom && t < axisCfg.y.breakTo) return;
                const y = yScale(t);
                if (!isFinite(y)) return;
                gridY.append('line')
                    .attr('x1', plotX).attr('x2', plotX + plotW)
                    .attr('y1', y).attr('y2', y)
                    .attr('stroke', axisCfg.y.gridColor)
                    .attr('stroke-dasharray', axisCfg.y.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        /* ---------- X 网格 ---------- */
        if (axisCfg.x.gridShow) {
            const gridX = svg.append('g').attr('class', 'grid grid-x');
            xVals.forEach(xv => {
                const cx = xOuter(xv) + xOuter.bandwidth() / 2;
                gridX.append('line')
                    .attr('x1', cx).attr('x2', cx)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', axisCfg.x.gridColor)
                    .attr('stroke-dasharray', axisCfg.x.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        /* ---------- 柱子 ---------- */
        const barsG = svg.append('g').attr('class', 'bars');
        cells.forEach(cell => {
            const xPos = xOuter(cell.x);
            const fullBandW = hasGroup ? xInner.bandwidth() : xOuter.bandwidth();
            const bandOriginX = hasGroup ? xPos + xInner(cell.g) : xPos;
            const barW = fullBandW * p.barWidthScale;
            const barX = bandOriginX + (fullBandW - barW) / 2;

            let yVal;
            if (isLogY && cell.value <= 0) {
                yVal = xAxisYFinal;
            } else {
                yVal = yScale(cell.value);
            }
            if (!isFinite(yVal)) return;

            const barTop = Math.min(yVal, xAxisYFinal);
            const barBot = Math.max(yVal, xAxisYFinal);
            const barH = barBot - barTop;
            const colorKey = hasGroup ? cell.g : cell.x;

            barsG.append('rect')
                .attr('x', barX).attr('y', barTop)
                .attr('width', barW).attr('height', barH)
                .attr('fill', colorOf(colorKey))
                .attr('stroke', p.barStrokeWidth > 0 ? p.barStrokeColor : 'none')
                .attr('stroke-width', p.barStrokeWidth);

            if (p.barShowValue) {
                barsG.append('text')
                    .attr('x', barX + barW / 2)
                    .attr('y', yVal - 4)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', p.barValueFontSize)
                    .attr('fill', '#333')
                    .text(fmtNum(cell.value, 2));
            }

            /* 误差棒 */
            if (cell.ext) {
                const errColor = PlotErrorBar.resolveErrorColor(state.errBar, colorOf(colorKey));

                let yHi = yScale(cell.ext.upper);
                let yLo = yScale(cell.ext.lower);
                if (isLogY) {
                    if (!isFinite(yHi) || cell.ext.upper <= 0) yHi = xAxisYFinal;
                    if (!isFinite(yLo) || cell.ext.lower <= 0) yLo = xAxisYFinal;
                }
                if (!isFinite(yHi) || !isFinite(yLo)) return;

                const cxBar = barX + barW / 2;
                const capHalf = (state.errBar.capWidth != null)
                    ? state.errBar.capWidth / 2
                    : Math.min(barW * 0.35, 8);

                barsG.append('line')
                    .attr('x1', cxBar).attr('y1', yHi)
                    .attr('x2', cxBar).attr('y2', yLo)
                    .attr('stroke', errColor)
                    .attr('stroke-width', state.errBar.errWidth);
                barsG.append('line')
                    .attr('x1', cxBar - capHalf).attr('y1', yHi)
                    .attr('x2', cxBar + capHalf).attr('y2', yHi)
                    .attr('stroke', errColor)
                    .attr('stroke-width', state.errBar.errWidth)
                    .attr('stroke-linecap', 'round');
                barsG.append('line')
                    .attr('x1', cxBar - capHalf).attr('y1', yLo)
                    .attr('x2', cxBar + capHalf).attr('y2', yLo)
                    .attr('stroke', errColor)
                    .attr('stroke-width', state.errBar.errWidth)
                    .attr('stroke-linecap', 'round');
            }
        });

        /* ---------- 断轴遮罩（仅线性） ---------- */
        if (!isLogY && axisCfg.y.breakEnable) {
            const yRange = yScale.range();
            if (yRange.length === 4) {
                const yTop = Math.min(yRange[1], yRange[2]);
                const yBot = Math.max(yRange[1], yRange[2]);
                svg.append('rect')
                    .attr('class', 'axis-break-mask')
                    .attr('x', plotX).attr('y', yTop)
                    .attr('width', plotW).attr('height', yBot - yTop)
                    .attr('fill', '#ffffff')
                    .attr('pointer-events', 'none');
            }
        }

        /* ---------- X 轴 ---------- */
        const xTicks = PlotAxis.resolveTicks(axisCfg.x, xOuter);
        const xAxisFn = d3.axisBottom(xOuter);
        if (xTicks && xTicks.length) xAxisFn.tickValues(xTicks);
        const xAxisG = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0, ' + xAxisYFinal + ')')
            .call(xAxisFn);
        PlotAxis.applyAxis(xAxisG, axisCfg.x, 'bottom');

        /* ---------- Y 轴 ---------- */
        const yTicks = PlotAxis.resolveTicks(axisCfg.y, yScale);
        let yTickValues = yTicks;
        if (!yTickValues) {
            yTickValues = yScale.ticks ? yScale.ticks() : null;
            if (!isLogY && axisCfg.y.breakEnable && yTickValues) {
                yTickValues = yTickValues.filter(t => !(t > axisCfg.y.breakFrom && t < axisCfg.y.breakTo));
            }
        }
        const yAxisFn = d3.axisLeft(yScale);
        if (yTickValues && yTickValues.length) yAxisFn.tickValues(yTickValues);
        const yAxisG = svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', 'translate(' + yAxisX + ', 0)')
            .call(yAxisFn);
        PlotAxis.applyAxis(yAxisG, axisCfg.y, 'left', yBreakPos);

        /* ---------- 轴标题 ---------- */
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

        /* ---------- 图例 ---------- */
        if (wantLegend) {
            let legendArea, orientation;
            const gapShift = Math.max(0, gap);

            if (vert) {
                orientation = 'vertical';
                const legendX = isRight
                    ? Math.max(margin, width - margin - legendColW - gapShift)
                    : Math.min(width - margin - legendColW, margin + gapShift);
                legendArea = { x: legendX, y: areaY, w: legendColW, h: areaH };
            } else {
                orientation = 'horizontal';
                const legendY = isTop
                    ? Math.min(height - margin - legendInlineH, margin + gapShift)
                    : Math.max(margin, height - margin - legendInlineH - gapShift);
                legendArea = { x: 0, y: legendY, w: width, h: legendInlineH };
            }

            PlotLegend.draw(svg, {
                orientation: orientation,
                area: legendArea,
                width: width,
                items: groupVals.map((g, i) => ({ label: String(g), color: colorOf(g), shape: 'rect' })),
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

        PlotAxis.applyFontFamily(svg, p.fontFamily);

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    /* ---------------- 应用创建 ---------------- */
    PlotApp.create({
        exportName: 'grouped_bar_chart',
        importInfo: T.importInfo,
        examples: [
            { label: EN ? 'Example: no group' : '示例：无分组', data: EX_PLAIN },
            { label: EN ? 'Example: grouped with error bars' : '示例：分组含误差棒', data: EX_ERRVAL }
        ],
        stateExtra: {
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
        },

        syncLegendTitle: function (app) {
            if (!app.state.legendTitleEdited && app.legendTitleInput) {
                app.legendTitleInput.value = app.state.roles.group || app.state.roles.x || '';
            }
        },

        setup: function (app) {
            fillRoleSelects(app);
            syncGlobalAxisFontToUI(app);
            refreshAxisPanel(app);
            refreshErrorBarPanel(app);

            app.$('xColSel').addEventListener('change', () => {
                const state = app.state;
                state.roles.x = app.$('xColSel').value;
                state.customColors = {};
                app.syncLegendTitle();
                if (!state.axis.x.titleEdited) {
                    state.axis.x.titleContent = state.roles.x || '';
                    const input = app.$('axisPanelContainer').querySelector('.ax-x-title');
                    if (input) input.value = state.axis.x.titleContent;
                }
                app.refreshColors();
                if (app.state.data.length) app.drawChart();
            });
            app.$('groupColSel').addEventListener('change', () => {
                app.state.roles.group = app.$('groupColSel').value;
                app.state.customColors = {};
                app.syncLegendTitle();
                app.refreshColors();
                if (app.state.data.length) app.drawChart();
            });
            app.$('yColSel').addEventListener('change', () => {
                app.state.roles.y = app.$('yColSel').value;
                app.refreshColors();
                if (!app.state.axis.y.titleEdited) {
                    app.state.axis.y.titleContent = app.state.roles.y || '';
                    const input = app.$('axisPanelContainer').querySelector('.ax-y-title');
                    if (input) input.value = app.state.axis.y.titleContent;
                }
                if (app.state.data.length) app.drawChart();
            });

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
        },

        onDataImported: function (app, res) {
            const state = app.state;
            state.columnTypes = res.columnTypes || {};
            const cats = res.headers.filter(h => state.columnTypes[h] === 'categorical' || state.columnTypes[h] === 'date');
            const nums = res.headers.filter(h => state.columnTypes[h] === 'numeric');
            state.roles.x = cats[0] || res.headers[0];
            state.roles.group = cats[1] || '';
            state.roles.y = nums[0] || res.headers[1] || res.headers[0];
            state.customColors = {};
            state.sortBy = '__input__';
            state.sortDir = 'asc';
            if (app.sortDirSel) app.sortDirSel.value = 'asc';
            state.errBar.mode = 'none';
            state.errBar.lowerCol = '';
            state.errBar.upperCol = '';
            state.errBar.errCol = '';
            state.axis.x.titleEdited = false;
            state.axis.y.titleEdited = false;
            app.syncLegendTitle();
            syncAxisTitles(app);
            fillRoleSelects(app);
            refreshAxisPanel(app);
            refreshErrorBarPanel(app);
        },

        onReset: function (app) {
            const state = app.state;
            state.columnTypes = {};
            state.roles = { x: '', group: '', y: '' };
            state.customColors = {};
            state.sortBy = '__input__';
            state.sortDir = 'asc';
            if (app.sortDirSel) app.sortDirSel.value = 'asc';
            state.errBar.mode = 'none';
            state.errBar.lowerCol = '';
            state.errBar.upperCol = '';
            state.errBar.errCol = '';
            state.axis = PlotAxis.defaultState();
            state.axis.x.titleEdited = false;
            state.axis.y.titleEdited = false;
            fillRoleSelects(app);
            syncGlobalAxisFontToUI(app);
            refreshAxisPanel(app);
            refreshErrorBarPanel(app);
        },

        onStateRestored: function (app) {
            fillRoleSelects(app);
            syncGlobalAxisFontToUI(app);
            refreshAxisPanel(app);
            refreshErrorBarPanel(app);
            refreshGroupColors(app);
        },

        refreshColors: function (app) {
            refreshGroupColors(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
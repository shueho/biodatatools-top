(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Must include a header row with at least a <strong>big-category column</strong>, a <strong>sub-category column</strong> and a <strong>value column</strong>. Different big categories are colored differently.'
            : '需包含表头，且至少包含 <strong>大类列</strong>、<strong>小类列</strong> 和 <strong>数值列</strong>。不同大类使用不同颜色。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select the big-category, sub-category and value columns' : '❌ 请选择大类列、小类列和数值列',
        noValid: EN ? '❌ Could not generate valid plot data. Please check the value column' : '❌ 未能生成有效绘图数据，请检查数值列',
        colorEmpty: EN ? 'Big-category colors will be shown here after selecting data columns' : '选择数据列后将在此处显示每个大类的颜色'
    };

    const EX_PLAIN =
        'BigCat\tSubCat\tValue\tLower\tUpper\tError\n' +
        'A\tX1\t18\t15\t21\t3\n' +
        'A\tX2\t32\t28\t36\t4\n' +
        'A\tX3\t12\t10\t14\t2\n' +
        'B\tY1\t24\t21\t27\t3\n' +
        'B\tY2\t8\t6\t10\t2\n' +
        'B\tY3\t20\t18\t22\t2\n' +
        'B\tY4\t15\t13\t17\t2\n' +
        'C\tZ1\t22\t20\t24\t2\n' +
        'C\tZ2\t26\t24\t28\t2\n' +
        'C\tZ3\t18\t16\t20\t2';

    function prepareData(app, p) {
        const state = app.state;
        const bigCatRaw = BarCommon.getXValues(app);
        const bigCatVals = BarCommon.applyCustomOrder(bigCatRaw, p.groupOrder);
        const subCatVals = BarCommon.getGroupValues(app, '');

        const rawCells = BarCommon.buildCells(app, bigCatVals, subCatVals, true);

        const sortBy = state.sortBy;
        const dir = state.sortDir === 'asc' ? 1 : -1;

        rawCells.forEach((c, idx) => {
            c._inputIndex = idx;
            if (!sortBy || sortBy === '__input__') {
                c._sortKey = idx;
            } else if (sortBy === state.roles.y) {
                c._sortKey = c.value;
            } else {
                const rows = state.data.filter(r =>
                    String(r[state.roles.x]) === c.x &&
                    String(r[state.roles.group]) === c.g
                );
                const vals = rows.map(r => parseFloat(r[sortBy])).filter(v => isFinite(v));
                c._sortKey = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            }
        });

        const cmp = (a, b) => {
            const ka = a._sortKey, kb = b._sortKey;
            const na = parseFloat(ka), nb = parseFloat(kb);
            if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
            return String(ka).localeCompare(String(kb)) * dir;
        };

        if (state.bigCatSorted) {
            const bigCatOrder = new Map();
            bigCatVals.forEach((b, i) => bigCatOrder.set(b, i));
            rawCells.sort((a, b) => {
                const oa = bigCatOrder.get(a.x) ?? 0;
                const ob = bigCatOrder.get(b.x) ?? 0;
                if (oa !== ob) return oa - ob;
                return cmp(a, b);
            });
        } else {
            rawCells.sort(cmp);
        }

        const cells = rawCells.map((c, i) => ({
            idx: i,
            bigCat: c.x,
            subCat: c.g,
            value: c.value,
            ext: c.ext
        }));

        return { bigCatVals, subCatVals, cells };
    }

    function buildStripGroups(cells) {
        const groups = [];
        let cur = null;
        cells.forEach(s => {
            if (!cur || cur.bigCat !== s.bigCat) {
                cur = { bigCat: s.bigCat, start: s.idx, end: s.idx };
                groups.push(cur);
            } else {
                cur.end = s.idx;
            }
        });
        return groups;
    }

    function readAllParams(app) {
        const $ = app.$;
        const p = Object.assign({},
            PC.readCanvasParams(app, 760, 600),
            BarCommon.readBarParams(app),
            PC.readTitleLegendParams(app)
        );
        p.direction = app.state.barDirection || 'vertical';
        p.bigCatSorted = !!app.state.bigCatSorted;
        p.stripStyle = ($('stripStyle') && $('stripStyle').value) || 'byBar';
        p.stripColor = ($('stripColor') && $('stripColor').value) || '#eef2f7';
        p.stripOpacity = ($('stripOpacity') ? parseFloat($('stripOpacity').value) : 1);
        if (!isFinite(p.stripOpacity)) p.stripOpacity = 1;
        p.stripOpacity = Math.max(0, Math.min(1, p.stripOpacity));
        p.stripStrokeColor = ($('stripStrokeColor') && $('stripStrokeColor').value) || '#c8d2de';
        p.stripStrokeWidth = Math.max(0, PC.num(app, 'stripStrokeWidth', 1));
        p.stripTextColor = ($('stripTextColor') && $('stripTextColor').value) || '#1f4068';
        return p;
    }

    function resolveStripFill(p, bigCat, colorOf) {
        if (p.stripStyle === 'byBar') return colorOf(bigCat);
        return p.stripColor;
    }

    function drawStrip(svg, x1, y1, w, h, p, bigCat, colorOf, horizontal, fs) {
        const fill = resolveStripFill(p, bigCat, colorOf);
        svg.append('rect')
            .attr('x', x1).attr('y', y1)
            .attr('width', w).attr('height', h)
            .attr('fill', fill)
            .attr('fill-opacity', p.stripOpacity)
            .attr('stroke', p.stripStrokeColor)
            .attr('stroke-width', p.stripStrokeWidth);

        const cx = x1 + w / 2;
        const cy = y1 + h / 2;
        const t = svg.append('text')
            .attr('x', cx).attr('y', cy)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', fs)
            .attr('font-weight', 'bold')
            .attr('fill', p.stripTextColor);
        if (horizontal) t.attr('transform', 'rotate(90 ' + cx + ' ' + cy + ')');
        t.text(bigCat);
    }

    function drawVertical(app, prepared) {
        const { p, axisCfg, bigCatVals, cells } = prepared;
        const state = app.state;

        const showStrip = p.bigCatSorted && p.stripStyle !== 'none';

        const isLogY = axisCfg.y.scaleType === 'log';
        const logBaseY = (axisCfg.y.logBase && axisCfg.y.logBase > 0) ? axisCfg.y.logBase : 10;
        const maxY = Math.max.apply(null, cells.map(c => c.ext ? Math.max(c.value, c.ext.upper) : c.value));
        const minYData = Math.min.apply(null, cells.map(c => c.ext ? Math.min(c.value, c.ext.lower) : c.value));
        const minY = isLogY ? minYData : Math.min(0, minYData);

        const margin = 30;
        const areaX = margin;
        const areaY = margin;
        const areaW = p.width - 2 * margin;
        const areaH = p.height - 2 * margin;

        const stripH = showStrip ? 22 : 0;
        const stripGap = showStrip ? 6 : 0;

        const xLabelFont = axisCfg.x.tickValueShow ? axisCfg.x.tickFontSize : 0;
        const yLabelFont = axisCfg.y.tickValueShow ? axisCfg.y.tickFontSize : 0;
        const xTitleFont = (axisCfg.x.titleShow && axisCfg.x.titleContent) ? axisCfg.x.titleFontSize + 8 : 0;
        const yTitleFont = (axisCfg.y.titleShow && axisCfg.y.titleContent) ? axisCfg.y.titleFontSize + 8 : 0;

        const leftPad = yLabelFont + 10 + yTitleFont + 10;
        const bottomPad = xLabelFont + 12 + xTitleFont + 10;
        const rightPad = 30;
        const topPad = stripH + stripGap + 6;

        const plotX = areaX + leftPad;
        const plotY = areaY + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, areaH - topPad - bottomPad);

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
            yScaleRaw = d3.scaleLog().base(logBaseY).domain(yDomain).range([plotY + plotH, plotY]);
        } else {
            yScaleRaw = d3.scaleLinear().domain(yDomain).range([plotY + plotH, plotY]).nice();
        }
        const yScale = (!isLogY) ? PlotAxis.applyBreak(yScaleRaw, axisCfg.y) : yScaleRaw;
        const yBreakPos = (!isLogY) ? PlotAxis.getBreakPosition(yScale, axisCfg.y) : NaN;

        const slotIdx = cells.map((_, i) => i);
        const xScale = d3.scaleBand()
            .domain(slotIdx)
            .range([plotX, plotX + plotW])
            .paddingOuter(p.barOuterGap).paddingInner(p.barOuterGap);

        let xAxisYFinal = plotY + plotH;
        if (axisCfg.x.crossMode === 'max') xAxisYFinal = plotY;
        else if (axisCfg.x.crossMode === 'zero') xAxisYFinal = isLogY ? (plotY + plotH) : yScale(0);
        else if (axisCfg.x.crossMode === 'custom' && isFinite(axisCfg.x.crossValue)) {
            const v = axisCfg.x.crossValue;
            xAxisYFinal = isLogY ? (v > 0 ? yScale(v) : plotY + plotH) : yScale(v);
        }
        if (!isFinite(xAxisYFinal)) xAxisYFinal = plotY + plotH;

        const baseColors = app.resolvePaletteColors(bigCatVals.length);
        const colorOf = k => {
            if (!k) return '#cccccc';
            const idx = bigCatVals.indexOf(k);
            return state.customColors[k] || baseColors[idx] || '#cccccc';
        };

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height, fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        state.currentSvg = canvas.node;

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

        const barsG = svg.append('g').attr('class', 'bars');
        cells.forEach(slot => {
            const bandX = xScale(slot.idx);
            const bandW = xScale.bandwidth();
            const barW = bandW * p.barWidthScale;
            const barX = bandX + (bandW - barW) / 2;

            let yVal;
            if (isLogY && slot.value <= 0) yVal = xAxisYFinal;
            else yVal = yScale(slot.value);
            if (!isFinite(yVal)) return;

            const barTop = Math.min(yVal, xAxisYFinal);
            const barBot = Math.max(yVal, xAxisYFinal);
            const barH = barBot - barTop;
            const color = colorOf(slot.bigCat);

            barsG.append('rect')
                .attr('x', barX).attr('y', barTop)
                .attr('width', barW).attr('height', barH)
                .attr('fill', color)
                .attr('stroke', p.barStrokeWidth > 0 ? p.barStrokeColor : 'none')
                .attr('stroke-width', p.barStrokeWidth);

            if (p.barShowValue) {
                barsG.append('text')
                    .attr('x', barX + barW / 2)
                    .attr('y', yVal - 4)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', p.barValueFontSize)
                    .attr('fill', '#333')
                    .text(PC.fmtNum(slot.value, 2));
            }

            if (slot.ext) {
                const errColor = PlotErrorBar.resolveErrorColor(state.errBar, color);
                let yHi = yScale(slot.ext.upper);
                let yLo = yScale(slot.ext.lower);
                if (isLogY) {
                    if (!isFinite(yHi) || slot.ext.upper <= 0) yHi = xAxisYFinal;
                    if (!isFinite(yLo) || slot.ext.lower <= 0) yLo = xAxisYFinal;
                }
                if (!isFinite(yHi) || !isFinite(yLo)) return;
                BarCommon.drawErrorBar(barsG, {
                    xPx: barX + barW / 2,
                    yPx: 0,
                    barThickness: barW,
                    loPx: yHi,
                    hiPx: yLo,
    valuePx: yVal,                          
    capMode: (slot.ext && slot.ext.capMode) || state.errBar.showWhich, 
                    isHorizontal: false,
                    errColor: errColor,
                    errWidth: state.errBar.errWidth,
                    capWidth: state.errBar.capWidth
                });
            }
        });

        if (!isLogY && axisCfg.y.breakEnable) {
            const yRange = yScale.range();
            if (yRange.length === 4) {
                const yTop = Math.min(yRange[1], yRange[2]);
                const yBot = Math.max(yRange[1], yRange[2]);
                svg.append('rect')
                    .attr('class', 'axis-break-mask')
                    .attr('x', plotX).attr('y', yTop)
                    .attr('width', plotW).attr('height', yBot - yTop)
                    .attr('fill', '#ffffff').attr('pointer-events', 'none');
            }
        }

        if (showStrip) {
            const stripY = areaY + 2;
            const groups = buildStripGroups(cells);
            const fs = Math.min(13, axisCfg.x.tickFontSize);
            groups.forEach(g => {
                const x1 = xScale(g.start);
                const x2 = xScale(g.end) + xScale.bandwidth();
                drawStrip(svg, x1, stripY, x2 - x1, stripH, p, g.bigCat, colorOf, false, fs);
            });
        }

        const xAxisFn = d3.axisBottom(xScale);
        xAxisFn.tickFormat(i => cells[i] ? cells[i].subCat : '');
        const xAxisG = svg.append('g').attr('class', 'x-axis')
            .attr('transform', 'translate(0, ' + xAxisYFinal + ')')
            .call(xAxisFn);
        PlotAxis.applyAxis(xAxisG, axisCfg.x, 'bottom');

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
        const yAxisG = svg.append('g').attr('class', 'y-axis')
            .attr('transform', 'translate(' + plotX + ', 0)')
            .call(yAxisFn);
        PlotAxis.applyAxis(yAxisG, axisCfg.y, 'left', yBreakPos);

        BarCommon.drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad);

        if (p.showLegend && bigCatVals.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: bigCatVals.map(name => ({ name: name, percent: null })),
                colors: bigCatVals.map(name => colorOf(name)),
                shape: 'rect',
                labelFormatter: it => it.name
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function drawHorizontal(app, prepared) {
        const { p, axisCfg, bigCatVals, cells } = prepared;
        const state = app.state;

        const showStrip = p.bigCatSorted && p.stripStyle !== 'none';

        const isLogX = axisCfg.x.scaleType === 'log';
        const logBaseX = (axisCfg.x.logBase && axisCfg.x.logBase > 0) ? axisCfg.x.logBase : 10;
        const maxX = Math.max.apply(null, cells.map(c => c.ext ? Math.max(c.value, c.ext.upper) : c.value));
        const minXData = Math.min.apply(null, cells.map(c => c.ext ? Math.min(c.value, c.ext.lower) : c.value));
        const minX = isLogX ? minXData : Math.min(0, minXData);

        const margin = 30;
        const areaX = margin;
        const areaY = margin;
        const areaW = p.width - 2 * margin;
        const areaH = p.height - 2 * margin;

        const stripW = showStrip ? 24 : 0;
        const stripGap = showStrip ? 6 : 0;

        const xLabelFont = axisCfg.x.tickValueShow ? axisCfg.x.tickFontSize : 0;
        const yLabelFont = axisCfg.y.tickValueShow ? axisCfg.y.tickFontSize : 0;
        const xTitleFont = (axisCfg.x.titleShow && axisCfg.x.titleContent) ? axisCfg.x.titleFontSize + 8 : 0;
        const yTitleFont = (axisCfg.y.titleShow && axisCfg.y.titleContent) ? axisCfg.y.titleFontSize + 8 : 0;

        let maxCatW = 0;
        cells.forEach(c => { maxCatW = Math.max(maxCatW, PC.estTextWidth(c.subCat, axisCfg.y.tickFontSize)); });
        const catLabelSpace = Math.min(maxCatW + 12, areaW * 0.4);

        const leftPad = catLabelSpace + yTitleFont + 10;
        const bottomPad = xLabelFont + 12 + xTitleFont + 10;
        const rightPad = stripW + stripGap + 10;
        const topPad = 20;

        const plotX = areaX + leftPad;
        const plotY = areaY + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, areaH - topPad - bottomPad);

        let xDomain = PlotAxis.resolveDomain(axisCfg.x, [minX, maxX]);
        if (isLogX) {
            if (!isFinite(xDomain[0]) || xDomain[0] <= 0) {
                const posVals = cells.map(c => c.value).filter(v => v > 0);
                xDomain[0] = (posVals.length ? Math.min.apply(null, posVals) : 1) * 0.5;
            }
            if (!isFinite(xDomain[1]) || xDomain[1] <= xDomain[0]) {
                xDomain[1] = xDomain[0] * logBaseX;
            }
        }
        let xScaleRaw;
        if (isLogX) {
            xScaleRaw = d3.scaleLog().base(logBaseX).domain(xDomain).range([plotX, plotX + plotW]);
        } else {
            xScaleRaw = d3.scaleLinear().domain(xDomain).range([plotX, plotX + plotW]).nice();
        }
        const xScale = (!isLogX) ? PlotAxis.applyBreak(xScaleRaw, axisCfg.x) : xScaleRaw;
        const xBreakPos = (!isLogX) ? PlotAxis.getBreakPosition(xScale, axisCfg.x) : NaN;

        const slotIdx = cells.map((_, i) => i);
        const yScale = d3.scaleBand()
            .domain(slotIdx)
            .range([plotY, plotY + plotH])
            .paddingOuter(p.barOuterGap).paddingInner(p.barOuterGap);

        let xAxisYFinal = plotY + plotH;
        if (axisCfg.x.crossMode === 'max') xAxisYFinal = plotY;
        else if (axisCfg.x.crossMode === 'zero') xAxisYFinal = isLogX ? (plotY + plotH) : xScale(0);
        else if (axisCfg.x.crossMode === 'custom' && isFinite(axisCfg.x.crossValue)) {
            const v = axisCfg.x.crossValue;
            xAxisYFinal = isLogX ? (v > 0 ? xScale(v) : plotX) : xScale(v);
        }
        if (!isFinite(xAxisYFinal)) xAxisYFinal = plotY + plotH;

        let yAxisXFinal = plotX;
        if (axisCfg.y.crossMode === 'max') yAxisXFinal = plotX + plotW;

        const baseColors = app.resolvePaletteColors(bigCatVals.length);
        const colorOf = k => {
            if (!k) return '#cccccc';
            const idx = bigCatVals.indexOf(k);
            return state.customColors[k] || baseColors[idx] || '#cccccc';
        };

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height, fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        state.currentSvg = canvas.node;

        if (axisCfg.x.gridShow) {
            const gridX = svg.append('g').attr('class', 'grid grid-x');
            const ticks = xScale.ticks ? xScale.ticks() : xScale.domain();
            ticks.forEach(t => {
                if (!isLogX && axisCfg.x.breakEnable && t > axisCfg.x.breakFrom && t < axisCfg.x.breakTo) return;
                const x = xScale(t);
                if (!isFinite(x)) return;
                gridX.append('line')
                    .attr('x1', x).attr('x2', x)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', axisCfg.x.gridColor)
                    .attr('stroke-dasharray', axisCfg.x.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        const barsG = svg.append('g').attr('class', 'bars');
        cells.forEach(slot => {
            const bandY = yScale(slot.idx);
            const bandH = yScale.bandwidth();
            const barH = bandH * p.barWidthScale;
            const barY = bandY + (bandH - barH) / 2;

            let xVal;
            if (isLogX && slot.value <= 0) xVal = yAxisXFinal;
            else xVal = xScale(slot.value);
            if (!isFinite(xVal)) return;

            const barLeft = Math.min(xVal, yAxisXFinal);
            const barRight = Math.max(xVal, yAxisXFinal);
            const barW = barRight - barLeft;
            const color = colorOf(slot.bigCat);

            barsG.append('rect')
                .attr('x', barLeft).attr('y', barY)
                .attr('width', barW).attr('height', barH)
                .attr('fill', color)
                .attr('stroke', p.barStrokeWidth > 0 ? p.barStrokeColor : 'none')
                .attr('stroke-width', p.barStrokeWidth);

            if (p.barShowValue) {
                const anchor = slot.value >= 0 ? 'start' : 'end';
                const offset = slot.value >= 0 ? 4 : -4;
                barsG.append('text')
                    .attr('x', xVal + offset)
                    .attr('y', barY + barH / 2)
                    .attr('text-anchor', anchor)
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', p.barValueFontSize)
                    .attr('fill', '#333')
                    .text(PC.fmtNum(slot.value, 2));
            }

            if (slot.ext) {
                const errColor = PlotErrorBar.resolveErrorColor(state.errBar, color);
                let xHi = xScale(slot.ext.upper);
                let xLo = xScale(slot.ext.lower);
                if (isLogX) {
                    if (!isFinite(xHi) || slot.ext.upper <= 0) xHi = yAxisXFinal;
                    if (!isFinite(xLo) || slot.ext.lower <= 0) xLo = yAxisXFinal;
                }
                if (!isFinite(xHi) || !isFinite(xLo)) return;
                BarCommon.drawErrorBar(barsG, {
                    xPx: 0,
                    yPx: barY + barH / 2,
                    barThickness: barH,
                    loPx: xLo,
                    hiPx: xHi,
    valuePx: xVal,                          
    capMode: (slot.ext && slot.ext.capMode) || state.errBar.showWhich, 
                    isHorizontal: true,
                    errColor: errColor,
                    errWidth: state.errBar.errWidth,
                    capWidth: state.errBar.capWidth
                });
            }
        });

        if (!isLogX && axisCfg.x.breakEnable) {
            const xRange = xScale.range();
            if (xRange.length === 4) {
                const xLeft = Math.min(xRange[1], xRange[2]);
                const xRight = Math.max(xRange[1], xRange[2]);
                svg.append('rect')
                    .attr('class', 'axis-break-mask')
                    .attr('x', xLeft).attr('y', plotY)
                    .attr('width', xRight - xLeft).attr('height', plotH)
                    .attr('fill', '#ffffff').attr('pointer-events', 'none');
            }
        }

        if (showStrip) {
            const stripX = plotX + plotW + stripGap;
            const groups = buildStripGroups(cells);
            const fs = Math.min(13, axisCfg.y.tickFontSize);
            groups.forEach(g => {
                const y1 = yScale(g.start);
                const y2 = yScale(g.end) + yScale.bandwidth();
                drawStrip(svg, stripX, y1, stripW, y2 - y1, p, g.bigCat, colorOf, true, fs);
            });
        }

        const xTicks = PlotAxis.resolveTicks(axisCfg.x, xScale);
        let xTickValues = xTicks;
        if (!xTickValues) {
            xTickValues = xScale.ticks ? xScale.ticks() : null;
            if (!isLogX && axisCfg.x.breakEnable && xTickValues) {
                xTickValues = xTickValues.filter(t => !(t > axisCfg.x.breakFrom && t < axisCfg.x.breakTo));
            }
        }
        const xAxisFn = d3.axisBottom(xScale);
        if (xTickValues && xTickValues.length) xAxisFn.tickValues(xTickValues);
        const xAxisG = svg.append('g').attr('class', 'x-axis')
            .attr('transform', 'translate(0, ' + xAxisYFinal + ')')
            .call(xAxisFn);
        PlotAxis.applyAxis(xAxisG, axisCfg.x, 'bottom', xBreakPos);

        const yAxisFn = d3.axisLeft(yScale);
        yAxisFn.tickFormat(i => cells[i] ? cells[i].subCat : '');
        const yAxisG = svg.append('g').attr('class', 'y-axis')
            .attr('transform', 'translate(' + yAxisXFinal + ', 0)')
            .call(yAxisFn);
        PlotAxis.applyAxis(yAxisG, axisCfg.y, 'left');

        BarCommon.drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad);

        if (p.showLegend && bigCatVals.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: bigCatVals.map(name => ({ name: name, percent: null })),
                colors: bigCatVals.map(name => colorOf(name)),
                shape: 'rect',
                labelFormatter: it => it.name
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function drawChart(app) {
        const state = app.state;
        app.toolbarTip.textContent = '';
        if (!state.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!state.roles.x || !state.roles.group || !state.roles.y) {
            app.showTip('msgTip3', T.selectCols, 'error'); return;
        }

        const p = readAllParams(app);
        const axisCfg = state.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        const prepared = prepareData(app, p);
        prepared.p = p;
        prepared.axisCfg = axisCfg;

        if (!prepared.cells.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        if (p.direction === 'horizontal') drawHorizontal(app, prepared);
        else drawVertical(app, prepared);

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    function fillBigCatOrderInput(app) {
        const el = app.$('groupOrder');
        if (!el) return;
        const vals = BarCommon.getXValues(app);
        el.value = vals.join(',');
    }

    function refreshBigCatColors(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const bigCatVals = BarCommon.getXValues(app);
        if (!bigCatVals.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const baseColors = app.resolvePaletteColors(bigCatVals.length);
        const displayItems = bigCatVals.map((k, i) => ({
            name: k,
            color: app.state.customColors[k] || baseColors[i]
        }));
        PlotCommon.renderColorAssignment(container, {
            items: displayItems,
            onChange: (idx, c) => {
                app.state.customColors[bigCatVals[idx]] = c;
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: () => {
                app.state.customColors = {};
                refreshBigCatColors(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    PlotApp.create({
        exportName: 'categorized_bar_chart',
        importInfo: T.importInfo,
        exampleData: EX_PLAIN,

        stateExtra: (function () {
            const base = BarCommon.createStateExtra();
            base.bigCatSorted = true;
            return base;
        })(),

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = app.state.roles.x || '';
            }
        },

        setup: function (app) {
            BarCommon.fillRoleSelects(app, '');
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);

            BarCommon.bindRoleEvents(app, null, null, null);

            fillBigCatOrderInput(app);
            app.$('xColSel').addEventListener('change', () => fillBigCatOrderInput(app));
            app.$('groupColSel').addEventListener('change', () => fillBigCatOrderInput(app));

            const chk = app.$('bigCatSorted');
            if (chk) {
                chk.checked = !!app.state.bigCatSorted;
                chk.addEventListener('change', () => {
                    app.state.bigCatSorted = chk.checked;
                    if (app.state.currentSvg) app.drawChart();
                });
            }
        },

        onDataImported: function (app, res) {
            const state = app.state;
            state.columnTypes = res.columnTypes || {};
            const cats = res.headers.filter(h => state.columnTypes[h] === 'categorical' || state.columnTypes[h] === 'date');
            const nums = res.headers.filter(h => state.columnTypes[h] === 'numeric');
            state.roles.x = cats[0] || res.headers[0];
            state.roles.group = cats[1] || res.headers[1] || '';
            state.roles.y = nums[0] || res.headers[2] || res.headers[0];
            state.customColors = {};
            state.errBar.mode = 'none';
            state.errBar.lowerCol = '';
            state.errBar.upperCol = '';
            state.errBar.errCol = '';
            state.axis.x.titleEdited = false;
            state.axis.y.titleEdited = false;

            const chk = app.$('bigCatSorted');
            if (chk) chk.checked = state.bigCatSorted;

            app.syncLegendTitle();
            BarCommon.syncAxisTitlesByDirection(app);
            BarCommon.fillRoleSelects(app, '');
            fillBigCatOrderInput(app);
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
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
            state.bigCatSorted = true;

            const chk = app.$('bigCatSorted');
            if (chk) chk.checked = true;

            const goEl = app.$('groupOrder');
            if (goEl) goEl.value = '';

            BarCommon.fillRoleSelects(app, '');
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
        },

        onStateRestored: function (app) {
            const chk = app.$('bigCatSorted');
            if (chk) chk.checked = !!app.state.bigCatSorted;
            BarCommon.fillRoleSelects(app, '');
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
            refreshBigCatColors(app);
        },

        refreshColors: function (app) {
            refreshBigCatColors(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
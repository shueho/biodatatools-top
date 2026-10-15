(function (global) {
    'use strict';

    const PC = global.PlotCommon;

    function readStackedParams(app, extra) {
        const $ = app.$;
        const p = Object.assign({},
            PC.readCanvasParams(app, 760, 600),
            BarCommon.readBarParams(app),
            PC.readTitleLegendParams(app)
        );
        p.direction = app.state.barDirection || 'vertical';
        p.stackMode = ($('stackMode') && $('stackMode').value) || 'absolute';
        p.showStackTotal = $('showStackTotal') ? $('showStackTotal').checked : false;
        p.stackTotalFontSize = Math.max(6, parseFloat($('stackTotalFontSize') && $('stackTotalFontSize').value) || 12);
        p.stackTotalDecimals = Math.max(0, parseInt($('stackTotalDecimals') && $('stackTotalDecimals').value, 10) || 1);
        if (extra) Object.assign(p, extra);
        return p;
    }

    function buildStackData(catVals, groupVals, cells, p, opts) {
        opts = opts || {};
        const allowExt = opts.allowErrorBars !== false;
        const isPercent = (p.stackMode === 'percent');

        const cellMap = new Map();
        cells.forEach(c => {
            if (!cellMap.has(c.x)) cellMap.set(c.x, new Map());
            cellMap.get(c.x).set(c.g, c);
        });

        const stackData = [];
        let maxValue = 0;

        catVals.forEach(x => {
            const gMap = cellMap.get(x) || new Map();
            const segments = [];
            let cum = 0;
            let total = 0;

            groupVals.forEach(g => {
                const cell = gMap.get(g);
                if (cell) total += cell.value;
            });

            if (total <= 0 && isPercent) return;

            groupVals.forEach(g => {
                const cell = gMap.get(g);
                let value = cell ? cell.value : 0;
                let ext = (allowExt && cell) ? cell.ext : null;

                if (isPercent) {
                    value = total > 0 ? value / total * 100 : 0;
                    ext = null;
                }

                const y0 = cum;
                const y1 = cum + value;
                cum = y1;

                segments.push({ g: g, value: value, ext: ext, y0: y0, y1: y1 });

                let top = y1;
                if (ext && isFinite(ext.upper)) {
                    top = Math.max(top, y0 + ext.upper);
                }
                if (top > maxValue) maxValue = top;
            });

            if (segments.length) {
                stackData.push({
                    x: x,
                    total: isPercent ? 100 : total,
                    segments: segments
                });
            }
        });

        if (maxValue <= 0) maxValue = 1;
        if (isPercent) maxValue = 100;
        return { stackData: stackData, maxValue: maxValue };
    }

    function drawVertical(app, prepared, opts) {
        opts = opts || {};
        const allowExt = opts.allowErrorBars !== false;

        const { p, axisCfg, catVals, groupVals, stackData, maxValue } = prepared;
        const state = app.state;

        const isLogY = axisCfg.y.scaleType === 'log';
        const logBaseY = (axisCfg.y.logBase && axisCfg.y.logBase > 0) ? axisCfg.y.logBase : 10;

        const margin = 30;
        const areaX = margin;
        const areaY = margin;
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

        const plotX = areaX + leftPad;
        const plotY = areaY + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, areaH - topPad - bottomPad);

        let yDomain = PlotAxis.resolveDomain(axisCfg.y, [0, maxValue]);
        if (isLogY) {
            if (!isFinite(yDomain[0]) || yDomain[0] <= 0) {
                yDomain[0] = maxValue > 0 ? maxValue * 0.01 : 1;
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

        const xOuter = d3.scaleBand()
            .domain(catVals)
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

        const baseColors = app.resolvePaletteColors(groupVals.length);
        const colorOf = k => {
            if (!k) return '#cccccc';
            const idx = groupVals.indexOf(k);
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
        stackData.forEach(item => {
            const bandX = xOuter(item.x);
            const bandW = xOuter.bandwidth();
            const barW = bandW * p.barWidthScale;
            const barX = bandX + (bandW - barW) / 2;

            item.segments.forEach(seg => {
                let y0 = seg.y0;
                let y1 = seg.y1;
                if (y0 < 0) y0 = 0;
                if (y1 < 0) y1 = 0;
                if (isLogY && (y0 <= 0 || y1 <= 0)) return;
                const py0 = yScale(y0);
                const py1 = yScale(y1);
                if (!isFinite(py0) || !isFinite(py1)) return;

                const rectY = Math.min(py0, py1);
                const rectH = Math.abs(py0 - py1);
                if (rectH <= 0 && seg.value <= 0) return;

                barsG.append('rect')
                    .attr('x', barX).attr('y', rectY)
                    .attr('width', barW).attr('height', rectH)
                    .attr('fill', colorOf(seg.g))
                    .attr('stroke', p.barStrokeWidth > 0 ? p.barStrokeColor : 'none')
                    .attr('stroke-width', p.barStrokeWidth);
            });
        });

        if (allowExt && p.stackMode !== 'percent' && state.errBar.mode !== 'none') {
            const errG = svg.append('g').attr('class', 'error-bars');
            stackData.forEach(item => {
                const bandX = xOuter(item.x);
                const bandW = xOuter.bandwidth();
                const barW = bandW * p.barWidthScale;
                const barX = bandX + (bandW - barW) / 2;

                item.segments.forEach(seg => {
                    if (!seg.ext) return;
                    const errColor = PlotErrorBar.resolveErrorColor(state.errBar, colorOf(seg.g));

                    let lowerVal = seg.y0 + seg.ext.lower;
                    let upperVal = seg.y0 + seg.ext.upper;
                    if (lowerVal < 0) lowerVal = 0;
                    if (upperVal < 0) upperVal = 0;
                    if (isLogY) {
                        if (lowerVal <= 0) lowerVal = seg.y0 > 0 ? seg.y0 : 0.001;
                        if (upperVal <= 0) upperVal = seg.y0 > 0 ? seg.y0 : 0.001;
                    }
                    const yLower = yScale(lowerVal);
                    const yUpper = yScale(upperVal);
                    if (!isFinite(yLower) || !isFinite(yUpper)) return;

                    BarCommon.drawErrorBar(errG, {
                        xPx: barX + barW / 2,
                        yPx: 0,
                        barThickness: barW,
                        loPx: yLower,
                        hiPx: yUpper,
    valuePx: yScale(seg.y1),                                      
    capMode: (seg.ext && seg.ext.capMode) || state.errBar.showWhich,  
                        isHorizontal: false,
                        errColor: errColor,
                        errWidth: state.errBar.errWidth,
                        capWidth: state.errBar.capWidth
                    });
                });
            });
        }

        const labelG = svg.append('g').attr('class', 'bar-labels');
        stackData.forEach(item => {
            const bandX = xOuter(item.x);
            const bandW = xOuter.bandwidth();
            const barW = bandW * p.barWidthScale;
            const barX = bandX + (bandW - barW) / 2;

            if (p.barShowValue) {
                item.segments.forEach(seg => {
                    if (seg.value <= 0) return;
                    const py0 = yScale(seg.y0);
                    const py1 = yScale(seg.y1);
                    if (!isFinite(py0) || !isFinite(py1)) return;
                    const rectY = Math.min(py0, py1);
                    const rectH = Math.abs(py0 - py1);
                    if (rectH < p.barValueFontSize) return;
                    labelG.append('text')
                        .attr('x', barX + barW / 2)
                        .attr('y', rectY + rectH / 2)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', p.barValueFontSize)
                        .attr('fill', '#333')
                        .text(PC.fmtNum(seg.value, 2));
                });
            }

            if (p.showStackTotal && item.total > 0) {
                const last = item.segments[item.segments.length - 1];
                const topVal = last ? last.y1 : 0;
                if (topVal > 0) {
                    const yTop = yScale(topVal);
                    if (isFinite(yTop)) {
                        const text = (p.stackMode === 'percent')
                            ? '100%'
                            : PC.fmtNum(item.total, p.stackTotalDecimals);
                        labelG.append('text')
                            .attr('x', barX + barW / 2)
                            .attr('y', yTop - 4)
                            .attr('text-anchor', 'middle')
                            .attr('font-size', p.stackTotalFontSize)
                            .attr('fill', '#333')
                            .text(text);
                    }
                }
            }
        });

        const xTicks = PlotAxis.resolveTicks(axisCfg.x, xOuter);
        const xAxisFn = d3.axisBottom(xOuter);
        if (xTicks && xTicks.length) xAxisFn.tickValues(xTicks);
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

        if (p.showLegend && groupVals.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: groupVals.map(g => ({ name: g, percent: null })),
                colors: groupVals.map(g => colorOf(g)),
                shape: 'rect',
                labelFormatter: it => it.name
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function drawHorizontal(app, prepared, opts) {
        opts = opts || {};
        const allowExt = opts.allowErrorBars !== false;

        const { p, axisCfg, catVals, groupVals, stackData, maxValue } = prepared;
        const state = app.state;

        const isLogX = axisCfg.x.scaleType === 'log';
        const logBaseX = (axisCfg.x.logBase && axisCfg.x.logBase > 0) ? axisCfg.x.logBase : 10;

        const margin = 30;
        const areaX = margin;
        const areaY = margin;
        const areaW = p.width - 2 * margin;
        const areaH = p.height - 2 * margin;

        const xLabelFont = axisCfg.x.tickValueShow ? axisCfg.x.tickFontSize : 0;
        const yLabelFont = axisCfg.y.tickValueShow ? axisCfg.y.tickFontSize : 0;
        const xTitleFont = (axisCfg.x.titleShow && axisCfg.x.titleContent) ? axisCfg.x.titleFontSize + 8 : 0;
        const yTitleFont = (axisCfg.y.titleShow && axisCfg.y.titleContent) ? axisCfg.y.titleFontSize + 8 : 0;

        let maxCatW = 0;
        catVals.forEach(c => { maxCatW = Math.max(maxCatW, PC.estTextWidth(c, axisCfg.y.tickFontSize)); });
        const catLabelSpace = Math.min(maxCatW + 12, areaW * 0.4);

        const leftPad = catLabelSpace + yTitleFont + 10;
        const bottomPad = xLabelFont + 12 + xTitleFont + 10;
        const rightPad = 30;
        const topPad = 20;

        const plotX = areaX + leftPad;
        const plotY = areaY + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, areaH - topPad - bottomPad);

        let xDomain = PlotAxis.resolveDomain(axisCfg.x, [0, maxValue]);
        if (isLogX) {
            if (!isFinite(xDomain[0]) || xDomain[0] <= 0) {
                xDomain[0] = maxValue > 0 ? maxValue * 0.01 : 1;
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

        const yOuter = d3.scaleBand()
            .domain(catVals)
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

        const baseColors = app.resolvePaletteColors(groupVals.length);
        const colorOf = k => {
            if (!k) return '#cccccc';
            const idx = groupVals.indexOf(k);
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
        stackData.forEach(item => {
            const bandY = yOuter(item.x);
            const bandH = yOuter.bandwidth();
            const barH = bandH * p.barWidthScale;
            const barY = bandY + (bandH - barH) / 2;

            item.segments.forEach(seg => {
                let x0 = seg.y0;
                let x1 = seg.y1;
                if (x0 < 0) x0 = 0;
                if (x1 < 0) x1 = 0;
                if (isLogX && (x0 <= 0 || x1 <= 0)) return;
                const px0 = xScale(x0);
                const px1 = xScale(x1);
                if (!isFinite(px0) || !isFinite(px1)) return;

                const rectX = Math.min(px0, px1);
                const rectW = Math.abs(px0 - px1);
                if (rectW <= 0 && seg.value <= 0) return;

                barsG.append('rect')
                    .attr('x', rectX).attr('y', barY)
                    .attr('width', rectW).attr('height', barH)
                    .attr('fill', colorOf(seg.g))
                    .attr('stroke', p.barStrokeWidth > 0 ? p.barStrokeColor : 'none')
                    .attr('stroke-width', p.barStrokeWidth);
            });
        });

        if (allowExt && p.stackMode !== 'percent' && state.errBar.mode !== 'none') {
            const errG = svg.append('g').attr('class', 'error-bars');
            stackData.forEach(item => {
                const bandY = yOuter(item.x);
                const bandH = yOuter.bandwidth();
                const barH = bandH * p.barWidthScale;
                const barY = bandY + (bandH - barH) / 2;

                item.segments.forEach(seg => {
                    if (!seg.ext) return;
                    const errColor = PlotErrorBar.resolveErrorColor(state.errBar, colorOf(seg.g));

                    let lowerVal = seg.y0 + seg.ext.lower;
                    let upperVal = seg.y0 + seg.ext.upper;
                    if (lowerVal < 0) lowerVal = 0;
                    if (upperVal < 0) upperVal = 0;
                    if (isLogX) {
                        if (lowerVal <= 0) lowerVal = seg.y0 > 0 ? seg.y0 : 0.001;
                        if (upperVal <= 0) upperVal = seg.y0 > 0 ? seg.y0 : 0.001;
                    }
                    const xLower = xScale(lowerVal);
                    const xUpper = xScale(upperVal);
                    if (!isFinite(xLower) || !isFinite(xUpper)) return;

                    BarCommon.drawErrorBar(errG, {
                        xPx: 0,
                        yPx: barY + barH / 2,
                        barThickness: barH,
                        loPx: xLower,
                        hiPx: xUpper,
    valuePx: xScale(seg.y1),                                     
    capMode: (seg.ext && seg.ext.capMode) || state.errBar.showWhich,  
                        isHorizontal: true,
                        errColor: errColor,
                        errWidth: state.errBar.errWidth,
                        capWidth: state.errBar.capWidth
                    });
                });
            });
        }

        const labelG = svg.append('g').attr('class', 'bar-labels');
        stackData.forEach(item => {
            const bandY = yOuter(item.x);
            const bandH = yOuter.bandwidth();
            const barH = bandH * p.barWidthScale;
            const barY = bandY + (bandH - barH) / 2;

            if (p.barShowValue) {
                item.segments.forEach(seg => {
                    if (seg.value <= 0) return;
                    const px0 = xScale(seg.y0);
                    const px1 = xScale(seg.y1);
                    if (!isFinite(px0) || !isFinite(px1)) return;
                    const rectX = Math.min(px0, px1);
                    const rectW = Math.abs(px0 - px1);
                    if (rectW < p.barValueFontSize) return;
                    labelG.append('text')
                        .attr('x', rectX + rectW / 2)
                        .attr('y', barY + barH / 2)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', p.barValueFontSize)
                        .attr('fill', '#333')
                        .text(PC.fmtNum(seg.value, 2));
                });
            }

            if (p.showStackTotal && item.total > 0) {
                const last = item.segments[item.segments.length - 1];
                const topVal = last ? last.y1 : 0;
                if (topVal > 0) {
                    const xTop = xScale(topVal);
                    if (isFinite(xTop)) {
                        const text = (p.stackMode === 'percent')
                            ? '100%'
                            : PC.fmtNum(item.total, p.stackTotalDecimals);
                        labelG.append('text')
                            .attr('x', xTop + 4)
                            .attr('y', barY + barH / 2)
                            .attr('text-anchor', 'start')
                            .attr('dominant-baseline', 'middle')
                            .attr('font-size', p.stackTotalFontSize)
                            .attr('fill', '#333')
                            .text(text);
                    }
                }
            }
        });

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

        const yAxisFn = d3.axisLeft(yOuter);
        const yAxisG = svg.append('g').attr('class', 'y-axis')
            .attr('transform', 'translate(' + yAxisXFinal + ', 0)')
            .call(yAxisFn);
        PlotAxis.applyAxis(yAxisG, axisCfg.y, 'left');

        BarCommon.drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad);

        if (p.showLegend && groupVals.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: groupVals.map(g => ({ name: g, percent: null })),
                colors: groupVals.map(g => colorOf(g)),
                shape: 'rect',
                labelFormatter: it => it.name
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function drawStackedChart(app, prepared, opts) {
        opts = opts || {};
        const dir = prepared.p.direction || 'vertical';
        if (dir === 'horizontal') drawHorizontal(app, prepared, opts);
        else drawVertical(app, prepared, opts);
    }

    global.StackedChart = {
        readStackedParams: readStackedParams,
        buildStackData: buildStackData,
        drawVertical: drawVertical,
        drawHorizontal: drawHorizontal,
        drawStackedChart: drawStackedChart
    };
})(window);
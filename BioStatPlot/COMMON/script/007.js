(function () {
    'use strict';

    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Must include a header row with at least a <strong>category column</strong> and a <strong>value column</strong>. Two examples are provided: no grouping (range bars) and grouped (error-value bars).'
            : '需包含表头，且至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>。示例提供两个版本：无分组（带范围棒）、有分组（误差值棒）。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select the category and value columns' : '❌ 请选择分类列与数值列',
        noValid: EN ? '❌ Could not generate valid plot data. Please check the value column' : '❌ 未能生成有效绘图数据，请检查数值列',
        noGroup: EN ? 'No group' : '无',
        colorEmpty: EN ? 'Category colors will be shown here after selecting data columns' : '选择数据列后将在此处显示每个类别的颜色'
    };

    const EX_PLAIN = 'X\tValue\tLower\tUpper\nA\t18\t15\t21\nB\t32\t28\t36\nC\t12\t10\t14\nD\t24\t21\t27\nE\t8\t6\t10';
    const EX_ERRVAL = 'X\tGroup\tValue\tError\nA\tCtrl\t20\t2\nA\tTrt1\t25\t3\nB\tCtrl\t30\t4\nB\tTrt1\t35\t5\nC\tCtrl\t18\t2\nC\tTrt1\t24\t3';


    function prepareData(app) {
        const state = app.state;
        const axisCfg = state.axis;
        const p = Object.assign({},
            BarCommon.readCanvasParams(app, 760, 600),
            BarCommon.readBarParams(app),
            BarCommon.readTitleLegendParams(app)
        );
        p.direction = state.barDirection || 'vertical';

        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        let catVals = BarCommon.sortXValues(app, BarCommon.getXValues(app));
        catVals = BarCommon.applyCustomOrder(catVals, axisCfg.x.customOrder || axisCfg.y.customOrder);
        const groupVals = BarCommon.getGroupValues(app, p.groupOrder);
        const hasGroup = groupVals.length > 0;

        const cells = BarCommon.buildCells(app, catVals, groupVals, hasGroup);

        return { p, axisCfg, catVals, groupVals, hasGroup, cells };
    }


    function prepareLayout(p, hasGroup) {
        p.showLegend = p.showLegend && hasGroup;

        const titleH = (p.showTitle && p.chartTitle) ? p.titleFontSize + 10 : 0;
        const legendColW = 200;
        const hasLegendTitle = !!(p.showLegendTitle && p.legendTitle && p.legendTitle.trim());
        const legendTitleH = hasLegendTitle ? (p.legendTitleFontSize + 10) : 0;
        const legendInlineH = p.legendFontSize + 20 + legendTitleH;

        const legendInfo = BarCommon.computeLegendArea(p, hasLegendTitle, legendTitleH, legendInlineH, legendColW);

        return { titleH, hasLegendTitle, legendColW, legendInfo };
    }


    function drawVertical(app, prepared) {
        const { p, axisCfg, catVals, groupVals, hasGroup, cells } = prepared;
        const state = app.state;

        if (!cells.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const isLogY = axisCfg.y.scaleType === 'log';
        const logBaseY = (axisCfg.y.logBase && axisCfg.y.logBase > 0) ? axisCfg.y.logBase : 10;
        const maxY = Math.max.apply(null, cells.map(c => c.ext ? Math.max(c.value, c.ext.upper) : c.value));
        const minYData = Math.min.apply(null, cells.map(c => c.ext ? Math.min(c.value, c.ext.lower) : c.value));
        const minY = isLogY ? minYData : Math.min(0, minYData);

        const { titleH, hasLegendTitle, legendInfo } = prepareLayout(p, hasGroup);
        const { areaX, areaY, areaW, areaH, legendArea, legendOrientation } = legendInfo;
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

        const xOuter = d3.scaleBand()
            .domain(catVals)
            .range([plotX, plotX + plotW])
            .paddingOuter(p.barOuterGap).paddingInner(p.barOuterGap);
        const xInner = hasGroup
            ? d3.scaleBand().domain(groupVals).range([0, xOuter.bandwidth()]).paddingInner(p.barInnerGap)
            : null;

        let xAxisYFinal = plotY + plotH;
        if (axisCfg.x.crossMode === 'max') xAxisYFinal = plotY;
        else if (axisCfg.x.crossMode === 'zero') xAxisYFinal = isLogY ? (plotY + plotH) : yScale(0);
        else if (axisCfg.x.crossMode === 'custom' && isFinite(axisCfg.x.crossValue)) {
            const v = axisCfg.x.crossValue;
            xAxisYFinal = isLogY ? (v > 0 ? yScale(v) : plotY + plotH) : yScale(v);
        }
        if (!isFinite(xAxisYFinal)) xAxisYFinal = plotY + plotH;

        const yAxisX = plotX;

        const colorKeys = BarCommon.getColorKeys(app);
        const baseColors = app.resolvePaletteColors(colorKeys.length);
        const colorOf = k => {
            if (!k) return '#cccccc';
            const idx = colorKeys.indexOf(k);
            return state.customColors[k] || baseColors[idx] || '#cccccc';
        };

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height, fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        state.currentSvg = canvas.node;

        if (p.showTitle && p.chartTitle) {
            PlotTitle.draw(svg, {
                width: p.width, height: p.height, position: p.titlePosition, text: p.chartTitle,
                fontSize: p.titleFontSize, bold: p.titleBold, italic: p.titleItalic
            });
        }

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

        if (axisCfg.x.gridShow) {
            const gridX = svg.append('g').attr('class', 'grid grid-x');
            catVals.forEach(cv => {
                const cx = xOuter(cv) + xOuter.bandwidth() / 2;
                gridX.append('line')
                    .attr('x1', cx).attr('x2', cx)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', axisCfg.x.gridColor)
                    .attr('stroke-dasharray', axisCfg.x.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        const barsG = svg.append('g').attr('class', 'bars');
        cells.forEach(cell => {
            const xPos = xOuter(cell.x);
            const fullBandW = hasGroup ? xInner.bandwidth() : xOuter.bandwidth();
            const bandOriginX = hasGroup ? xPos + xInner(cell.g) : xPos;
            const barW = fullBandW * p.barWidthScale;
            const barX = bandOriginX + (fullBandW - barW) / 2;

            let yVal;
            if (isLogY && cell.value <= 0) yVal = xAxisYFinal;
            else yVal = yScale(cell.value);
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
                    .text(BarCommon.fmtNum(cell.value, 2));
            }

            if (cell.ext) {
                const errColor = PlotErrorBar.resolveErrorColor(state.errBar, colorOf(colorKey));
                let yHi = yScale(cell.ext.upper);
                let yLo = yScale(cell.ext.lower);
                if (isLogY) {
                    if (!isFinite(yHi) || cell.ext.upper <= 0) yHi = xAxisYFinal;
                    if (!isFinite(yLo) || cell.ext.lower <= 0) yLo = xAxisYFinal;
                }
                if (!isFinite(yHi) || !isFinite(yLo)) return;
                BarCommon.drawErrorBar(barsG, {
                    xPx: barX + barW / 2,
                    yPx: 0,
                    barThickness: barW,
                    loPx: yHi,
                    hiPx: yLo,
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
            .attr('transform', 'translate(' + yAxisX + ', 0)')
            .call(yAxisFn);
        PlotAxis.applyAxis(yAxisG, axisCfg.y, 'left', yBreakPos);

        BarCommon.drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad);

        if (legendArea) {
            BarCommon.drawLegend(svg, p, groupVals, colorOf, legendArea, legendOrientation, hasLegendTitle);
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }


    function drawHorizontal(app, prepared) {
        const { p, axisCfg, catVals, groupVals, hasGroup, cells } = prepared;
        const state = app.state;

        if (!cells.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const isLogX = axisCfg.x.scaleType === 'log';
        const logBaseX = (axisCfg.x.logBase && axisCfg.x.logBase > 0) ? axisCfg.x.logBase : 10;
        const maxX = Math.max.apply(null, cells.map(c => c.ext ? Math.max(c.value, c.ext.upper) : c.value));
        const minXData = Math.min.apply(null, cells.map(c => c.ext ? Math.min(c.value, c.ext.lower) : c.value));
        const minX = isLogX ? minXData : Math.min(0, minXData);

        const { titleH, hasLegendTitle, legendInfo } = prepareLayout(p, hasGroup);
        const { areaX, areaY, areaW, areaH, legendArea, legendOrientation } = legendInfo;
        const gridAreaH = Math.max(20, areaH - titleH);

        const xLabelFont = axisCfg.x.tickValueShow ? axisCfg.x.tickFontSize : 0;
        const yLabelFont = axisCfg.y.tickValueShow ? axisCfg.y.tickFontSize : 0;
        const xTitleFont = (axisCfg.x.titleShow && axisCfg.x.titleContent) ? axisCfg.x.titleFontSize + 8 : 0;
        const yTitleFont = (axisCfg.y.titleShow && axisCfg.y.titleContent) ? axisCfg.y.titleFontSize + 8 : 0;

        let maxCatW = 0;
        catVals.forEach(c => { maxCatW = Math.max(maxCatW, BarCommon.estTextWidth(c, axisCfg.y.tickFontSize)); });
        const catLabelSpace = Math.min(maxCatW + 12, areaW * 0.4);

        const leftPad = catLabelSpace + yTitleFont + 10;
        const bottomPad = xLabelFont + 12 + xTitleFont + 10;
        const rightPad = 30;
        const topPad = 20;

        const plotX = areaX + leftPad;
        const plotY = areaY + titleH + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, gridAreaH - topPad - bottomPad);

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

        const yOuter = d3.scaleBand()
            .domain(catVals)
            .range([plotY, plotY + plotH])
            .paddingOuter(p.barOuterGap).paddingInner(p.barOuterGap);
        const yInner = hasGroup
            ? d3.scaleBand().domain(groupVals).range([0, yOuter.bandwidth()]).paddingInner(p.barInnerGap)
            : null;

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

        const colorKeys = BarCommon.getColorKeys(app);
        const baseColors = app.resolvePaletteColors(colorKeys.length);
        const colorOf = k => {
            if (!k) return '#cccccc';
            const idx = colorKeys.indexOf(k);
            return state.customColors[k] || baseColors[idx] || '#cccccc';
        };

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height, fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        state.currentSvg = canvas.node;

        if (p.showTitle && p.chartTitle) {
            PlotTitle.draw(svg, {
                width: p.width, height: p.height, position: p.titlePosition, text: p.chartTitle,
                fontSize: p.titleFontSize, bold: p.titleBold, italic: p.titleItalic
            });
        }

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

        if (axisCfg.y.gridShow) {
            const gridY = svg.append('g').attr('class', 'grid grid-y');
            catVals.forEach(cv => {
                const cy = yOuter(cv) + yOuter.bandwidth() / 2;
                gridY.append('line')
                    .attr('x1', plotX).attr('x2', plotX + plotW)
                    .attr('y1', cy).attr('y2', cy)
                    .attr('stroke', axisCfg.y.gridColor)
                    .attr('stroke-dasharray', axisCfg.y.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        const barsG = svg.append('g').attr('class', 'bars');
        cells.forEach(cell => {
            const yPos = yOuter(cell.x);
            const fullBandH = hasGroup ? yInner.bandwidth() : yOuter.bandwidth();
            const bandOriginY = hasGroup ? yPos + yInner(cell.g) : yPos;
            const barH = fullBandH * p.barWidthScale;
            const barY = bandOriginY + (fullBandH - barH) / 2;

            let xVal;
            if (isLogX && cell.value <= 0) xVal = yAxisXFinal;
            else xVal = xScale(cell.value);
            if (!isFinite(xVal)) return;

            const barLeft = Math.min(xVal, yAxisXFinal);
            const barRight = Math.max(xVal, yAxisXFinal);
            const barW = barRight - barLeft;
            const colorKey = hasGroup ? cell.g : cell.x;

            barsG.append('rect')
                .attr('x', barLeft).attr('y', barY)
                .attr('width', barW).attr('height', barH)
                .attr('fill', colorOf(colorKey))
                .attr('stroke', p.barStrokeWidth > 0 ? p.barStrokeColor : 'none')
                .attr('stroke-width', p.barStrokeWidth);

            if (p.barShowValue) {
                const anchor = cell.value >= 0 ? 'start' : 'end';
                const offset = cell.value >= 0 ? 4 : -4;
                barsG.append('text')
                    .attr('x', xVal + offset)
                    .attr('y', barY + barH / 2)
                    .attr('text-anchor', anchor)
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', p.barValueFontSize)
                    .attr('fill', '#333')
                    .text(BarCommon.fmtNum(cell.value, 2));
            }

            if (cell.ext) {
                const errColor = PlotErrorBar.resolveErrorColor(state.errBar, colorOf(colorKey));
                let xHi = xScale(cell.ext.upper);
                let xLo = xScale(cell.ext.lower);
                if (isLogX) {
                    if (!isFinite(xHi) || cell.ext.upper <= 0) xHi = yAxisXFinal;
                    if (!isFinite(xLo) || cell.ext.lower <= 0) xLo = yAxisXFinal;
                }
                if (!isFinite(xHi) || !isFinite(xLo)) return;
                BarCommon.drawErrorBar(barsG, {
                    xPx: 0,
                    yPx: barY + barH / 2,
                    barThickness: barH,
                    loPx: xLo,
                    hiPx: xHi,
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

        if (legendArea) {
            BarCommon.drawLegend(svg, p, groupVals, colorOf, legendArea, legendOrientation, hasLegendTitle);
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }


    function drawChart(app) {
        const state = app.state;
        app.toolbarTip.textContent = '';
        if (!state.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!state.roles.x || !state.roles.y) { app.showTip('msgTip3', T.selectCols, 'error'); return; }

        const prepared = prepareData(app);
        if (!prepared.cells.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        if ((state.barDirection || 'vertical') === 'horizontal') {
            drawHorizontal(app, prepared);
        } else {
            drawVertical(app, prepared);
        }

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }


    PlotApp.create({
        exportName: 'grouped_bar_chart',
        importInfo: T.importInfo,
        examples: [
            { label: EN ? 'Example: no group' : '示例：无分组', data: EX_PLAIN },
            { label: EN ? 'Example: grouped with error bars' : '示例：分组含误差棒', data: EX_ERRVAL }
        ],
        stateExtra: BarCommon.createStateExtra(),

        syncLegendTitle: function (app) {
            if (!app.state.legendTitleEdited && app.legendTitleInput) {
                app.legendTitleInput.value = app.state.roles.group || app.state.roles.x || '';
            }
        },

        setup: function (app) {
            BarCommon.fillRoleSelects(app, T.noGroup);
            BarCommon.syncGlobalAxisFontToUI(app);
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
            BarCommon.fillGroupOrderInput(app);

            BarCommon.bindRoleEvents(app, null, null, null);
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
            BarCommon.syncAxisTitlesByDirection(app);
            BarCommon.fillRoleSelects(app, T.noGroup);
            BarCommon.fillGroupOrderInput(app);
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
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
            /* 方向保持用户当前选择 */
            const goEl = app.$('groupOrder');
            if (goEl) goEl.value = '';
            BarCommon.fillRoleSelects(app, T.noGroup);
            BarCommon.syncGlobalAxisFontToUI(app);
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
        },

        onStateRestored: function (app) {
            BarCommon.fillRoleSelects(app, T.noGroup);
            BarCommon.syncGlobalAxisFontToUI(app);
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
            BarCommon.refreshGroupColors(app, T.colorEmpty);
        },

        refreshColors: function (app) {
            BarCommon.refreshGroupColors(app, T.colorEmpty);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
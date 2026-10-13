(function () {
    'use strict';

    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Must include a header row with at least a <strong>category column</strong>, a <strong>stack-series column</strong> and a <strong>value column</strong>. Values are averaged per category/series before stacking. Supports absolute and percentage stacking, vertical / horizontal orientation, and error bars (range or error value).'
            : '需包含表头，且至少包含 <strong>分类列</strong>、<strong>堆叠系列</strong> 和 <strong>数值列</strong>。同一分类同一系列的多个重复行会自动取均值后堆叠。支持绝对值堆叠与百分比堆叠、竖向 / 横向切换，以及范围棒与误差值棒。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select the category, stack-series and value columns' : '❌ 请选择分类列、堆叠系列和数值列',
        noValid: EN ? '❌ Could not generate valid plot data. Please check the value column' : '❌ 未能生成有效绘图数据，请检查数值列',
        colorEmpty: EN ? 'Stack-series colors will be shown here after selecting data columns' : '选择数据列后将在此处显示每个堆叠系列的颜色',
        inputOrder: EN ? 'Input order' : '输入顺序',
        sortByStackLabel: EN ? 'Sort by stack-series value' : '按堆叠系列的值排序',
        sortTopAbs: EN ? 'Top layer · absolute' : '最上层 · 绝对值',
        sortTopPct: EN ? 'Top layer · percentage' : '最上层 · 百分比',
        sortBottomAbs: EN ? 'Bottom layer · absolute' : '最下层 · 绝对值',
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
        'Category\tStackSeries\tValue\tLower\tUpper\n' +
        'A\tS1\t18\t16\t20\n' +
        'A\tS2\t32\t29\t35\n' +
        'A\tS3\t12\t10\t14\n' +
        'B\tS1\t24\t22\t26\n' +
        'B\tS2\t8\t6\t10\n' +
        'B\tS3\t20\t18\t22\n' +
        'C\tS1\t22\t20\t24\n' +
        'C\tS2\t26\t23\t29\n' +
        'C\tS3\t18\t16\t20';

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

        if (mode === 'custom') {
            return BarCommon.applyCustomOrder(raw, state.groupOrder || '');
        }

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

        const esc = PlotCommon.escapeHtml;
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
                absAsc:  EN ? 'Sorted by total value across all categories (ascending).' : '按各系列在所有分类下的数值总和升序。',
                absDesc: EN ? 'Sorted by total value across all categories (descending).' : '按各系列在所有分类下的数值总和降序。',
                pctAsc:  EN ? 'Sorted by average percentage across categories (ascending).' : '按各系列在各分类中的平均占比升序。',
                pctDesc: EN ? 'Sorted by average percentage across categories (descending).' : '按各系列在各分类中的平均占比降序。',
                custom:  EN ? 'Use the order typed in the box; values not listed are appended in input order.' : '按输入框填写的顺序；未列出的系列附后，按出现顺序。'
            };
            hint.textContent = map[mode] || map.input;
        }
    }

    function prepareData(app, p) {
        const state = app.state;
        const catRaw = BarCommon.getXValues(app);
        let catVals = sortCategories(app, catRaw);

        const groupVals = getOrderedGroups(app);
        if (!groupVals.length) {
            return { catVals, groupVals, stackData: [], maxValue: 1 };
        }

        const rawCells = BarCommon.buildCells(app, catVals, groupVals, true);

        const cellMap = new Map();
        rawCells.forEach(c => {
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

            if (total <= 0 && p.stackMode === 'percent') return;

            groupVals.forEach(g => {
                const cell = gMap.get(g);
                let value = cell ? cell.value : 0;
                let ext = cell ? cell.ext : null;

                if (p.stackMode === 'percent') {
                    if (total > 0) {
                        value = value / total * 100;
                        if (ext) {
                            ext = {
                                lower: ext.lower / total * 100,
                                upper: ext.upper / total * 100
                            };
                        }
                    } else {
                        value = 0;
                        ext = null;
                    }
                }

                const y0 = cum;
                const y1 = cum + value;
                cum = y1;

                segments.push({
                    g: g,
                    value: value,
                    ext: ext,
                    y0: y0,
                    y1: y1
                });

                let top = y1;
                if (ext && isFinite(ext.upper)) {
                    top = Math.max(top, y0 + ext.upper);
                }
                if (top > maxValue) maxValue = top;
            });

            if (segments.length) {
                stackData.push({
                    x: x,
                    total: p.stackMode === 'percent' ? 100 : total,
                    segments: segments
                });
            }
        });

        if (maxValue <= 0) maxValue = 1;
        if (p.stackMode === 'percent') maxValue = 100;

        return { catVals, groupVals, stackData, maxValue };
    }

    function readAllParams(app) {
        const $ = app.$;
        const p = Object.assign({},
            BarCommon.readCanvasParams(app, 760, 600),
            BarCommon.readBarParams(app),
            BarCommon.readTitleLegendParams(app)
        );
        p.direction = app.state.barDirection || 'vertical';
        p.stackMode = ($('stackMode') && $('stackMode').value) || 'absolute';
        p.showStackTotal = $('showStackTotal') ? $('showStackTotal').checked : false;
        p.stackTotalFontSize = Math.max(6, parseFloat($('stackTotalFontSize') && $('stackTotalFontSize').value) || 12);
        p.stackTotalDecimals = Math.max(0, parseInt($('stackTotalDecimals') && $('stackTotalDecimals').value, 10) || 1);
        return p;
    }

    function computeLayout(p, hasData) {
        p.showLegend = p.showLegend && hasData;
        const titleH = (p.showTitle && p.chartTitle) ? p.titleFontSize + 10 : 0;
        const legendColW = 200;
        const hasLegendTitle = !!(p.showLegendTitle && p.legendTitle && p.legendTitle.trim());
        const legendTitleH = hasLegendTitle ? (p.legendTitleFontSize + 10) : 0;
        const legendInlineH = p.legendFontSize + 20 + legendTitleH;
        const legendInfo = BarCommon.computeLegendArea(p, hasLegendTitle, legendTitleH, legendInlineH, legendColW);
        return { titleH, hasLegendTitle, legendInfo };
    }

    function drawVertical(app, prepared) {
        const { p, axisCfg, catVals, groupVals, stackData, maxValue } = prepared;
        const state = app.state;

        if (!stackData.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const isLogY = axisCfg.y.scaleType === 'log';
        const logBaseY = (axisCfg.y.logBase && axisCfg.y.logBase > 0) ? axisCfg.y.logBase : 10;

        const { titleH, hasLegendTitle, legendInfo } = computeLayout(p, catVals.length > 0);
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

        const yAxisX = plotX;

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

        const errG = svg.append('g').attr('class', 'error-bars');
        stackData.forEach(item => {
            const bandX = xOuter(item.x);
            const bandW = xOuter.bandwidth();
            const barW = bandW * p.barWidthScale;
            const barX = bandX + (bandW - barW) / 2;

            item.segments.forEach(seg => {
                if (!seg.ext || state.errBar.mode === 'none') return;
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
                    isHorizontal: false,
                    errColor: errColor,
                    errWidth: state.errBar.errWidth,
                    capWidth: state.errBar.capWidth
                });
            });
        });

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
                        .text(BarCommon.fmtNum(seg.value, 2));
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
                            : BarCommon.fmtNum(item.total, p.stackTotalDecimals);
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
        const { p, axisCfg, catVals, groupVals, stackData, maxValue } = prepared;
        const state = app.state;

        if (!stackData.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const isLogX = axisCfg.x.scaleType === 'log';
        const logBaseX = (axisCfg.x.logBase && axisCfg.x.logBase > 0) ? axisCfg.x.logBase : 10;

        const { titleH, hasLegendTitle, legendInfo } = computeLayout(p, catVals.length > 0);
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

        const errG = svg.append('g').attr('class', 'error-bars');
        stackData.forEach(item => {
            const bandY = yOuter(item.x);
            const bandH = yOuter.bandwidth();
            const barH = bandH * p.barWidthScale;
            const barY = bandY + (bandH - barH) / 2;

            item.segments.forEach(seg => {
                if (!seg.ext || state.errBar.mode === 'none') return;
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
                    isHorizontal: true,
                    errColor: errColor,
                    errWidth: state.errBar.errWidth,
                    capWidth: state.errBar.capWidth
                });
            });
        });

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
                        .text(BarCommon.fmtNum(seg.value, 2));
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
                            : BarCommon.fmtNum(item.total, p.stackTotalDecimals);
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

        if (legendArea) {
            BarCommon.drawLegend(svg, p, groupVals, colorOf, legendArea, legendOrientation, hasLegendTitle);
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

        if (!prepared.stackData.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        if (p.direction === 'horizontal') drawHorizontal(app, prepared);
        else drawVertical(app, prepared);

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
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
            if (!app.state.legendTitleEdited && app.legendTitleInput) {
                app.legendTitleInput.value = app.state.roles.group || '';
            }
        },

        setup: function (app) {
            BarCommon.fillRoleSelects(app, '');
            BarCommon.syncGlobalAxisFontToUI(app);
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
                stackModeSel.addEventListener('change', function () {
                    app.state.stackMode = stackModeSel.value;
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
            state.groupOrderMode = 'input';
            state.groupOrder = '';
            const modeSel = app.$('groupOrderMode');
            if (modeSel) modeSel.value = 'input';
            const goEl = app.$('groupOrder');
            if (goEl) goEl.value = '';
            BarCommon.fillRoleSelects(app, '');
            BarCommon.syncGlobalAxisFontToUI(app);
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
            syncGroupOrderUI(app);
        },

        onStateRestored: function (app) {
            BarCommon.fillRoleSelects(app, '');
            BarCommon.syncGlobalAxisFontToUI(app);
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
            const modeSel = app.$('groupOrderMode');
            if (modeSel) modeSel.value = app.state.groupOrderMode || 'input';
            const goEl = app.$('groupOrder');
            if (goEl) goEl.value = app.state.groupOrder || '';
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
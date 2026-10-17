(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Must include a header row with a <strong>category column</strong>, a <strong>value column</strong>, and optionally a <strong>group column</strong>. Values can be positive or negative.'
            : '需包含表头，至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>，可选 <strong>分组列</strong>。数值可正可负。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select the category and value columns' : '❌ 请选择分类列与数值列',
        noValid: EN ? '❌ Could not generate valid plot data' : '❌ 未能生成有效绘图数据',
        noGroup: EN ? 'None' : '无',
        colorEmpty: EN ? 'Category colors will be shown here after selecting data columns' : '选择数据列后将在此处显示每个类别的颜色'
    };

    const EX_PLAIN =
        'Category\tGroup\tValue\n' +
        'X1\tA\t30\nX2\tA\t25\nX3\tA\t20\nX4\tA\t15\n' +
        'Y1\tB\t18\nY2\tB\t12\nY3\tB\t5\nY4\tB\t-3\n' +
        'Z1\tC\t10\nZ2\tC\t2\nZ3\tC\t-8\nZ4\tC\t-15';

    function getUniqueValues(app, colKey) {
        const state = app.state;
        if (!colKey || !state.data.length) return [];
        const seen = new Set();
        const out = [];
        state.data.forEach(row => {
            const v = row[colKey];
            if (v === undefined || v === null || v === '') return;
            const t = String(v);
            if (!seen.has(t)) { seen.add(t); out.push(t); }
        });
        return out;
    }

    function prepareData(app, p) {
        const state = app.state;
        const catKey = state.roles.x;
        const grpKey = state.roles.group;
        const valKey = state.roles.y;
        const hasGroup = !!(grpKey && state.headers.indexOf(grpKey) >= 0);

        const catVals = getUniqueValues(app, catKey);
        const grpRaw = hasGroup ? getUniqueValues(app, grpKey) : [];
        const grpVals = hasGroup ? BarCommon.applyCustomOrder(grpRaw, p.groupOrder || '') : [];

        const map = new Map();
        state.data.forEach(row => {
            const cat = String(row[catKey] == null ? '' : row[catKey]);
            if (!cat) return;
            const grp = hasGroup ? String(row[grpKey] == null ? '' : row[grpKey]) : '';
            const v = parseFloat(row[valKey]);
            if (!isFinite(v)) return;
            const key = cat + '\u0001' + grp;
            if (!map.has(key)) map.set(key, { cat: cat, grp: grp, values: [] });
            map.get(key).values.push(v);
        });

        const rawCells = [];
        map.forEach(rec => {
            const mean = rec.values.reduce((a, b) => a + b, 0) / rec.values.length;
            rawCells.push({ cat: rec.cat, grp: rec.grp, value: mean });
        });

        const sortBy = state.sortBy;
        const dir = state.sortDir === 'asc' ? 1 : -1;

        rawCells.forEach((c, idx) => {
            if (!sortBy || sortBy === '__input__') {
                c._sortKey = idx;
            } else if (sortBy === valKey) {
                c._sortKey = c.value;
            } else {
                const rows = state.data.filter(r => {
                    const rc = String(r[catKey]) === c.cat;
                    if (!hasGroup) return rc;
                    return rc && String(r[grpKey]) === c.grp;
                });
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

        if (state.bigCatSorted && hasGroup) {
            const grpOrderMap = new Map();
            grpVals.forEach((g, i) => grpOrderMap.set(g, i));
            rawCells.sort((a, b) => {
                const oa = grpOrderMap.get(a.grp) ?? 0;
                const ob = grpOrderMap.get(b.grp) ?? 0;
                if (oa !== ob) return oa - ob;
                return cmp(a, b);
            });
        } else {
            rawCells.sort(cmp);
        }

        const cells = rawCells.map((c, i) => ({
            idx: i,
            cat: c.cat,
            grp: c.grp,
            value: c.value
        }));

        return { catVals, grpVals, hasGroup, cells };
    }

    function fillShapeSelect() {
        const shapes = window.PlotShapes && window.PlotShapes.SHAPES;
        const sel = document.getElementById('dotShape');
        if (!shapes || !sel) return;
        if (sel.options.length) return;
        const lang = (PlotI18N.lang() === 'en') ? 'en' : 'zh';
        sel.innerHTML = shapes.map(s =>
            '<option value="' + s.id + '">' + (s[lang] || s.zh) + '</option>'
        ).join('');
        sel.value = 'circle';
    }

    function isHollowShape(shapeId) {
        if (window.PlotShapes && window.PlotShapes.isHollow) {
            return window.PlotShapes.isHollow(shapeId);
        }
        return /-hollow$/.test(String(shapeId || ''));
    }

    function resolveStrokeColor(p, fillColor) {
        if (p.dotStrokeMode === 'none') return null;
        if (p.dotStrokeMode === 'same') return fillColor;
        if (p.dotStrokeMode === 'white') return '#ffffff';
        return p.dotStrokeColor;
    }

    function resolveLineColor(p, cell, baselineValue, dotColor) {
        if (p.lineColorMode === 'same') return dotColor;
        if (p.lineColorMode === 'uniform') return p.uniformLineColor;
        if (p.lineColorMode === 'direction') {
            return (cell.value >= baselineValue) ? p.posLineColor : p.negLineColor;
        }
        return dotColor;
    }

    function drawDot(parent, opts) {
        const x = opts.x, y = opts.y;
        const shapeId = opts.shapeId;
        const dotSize = opts.dotSize;
        const dotColor = opts.dotColor;
        const strokeColor = opts.strokeColor;
        const strokeWidth = opts.strokeWidth;
        const hollow = isHollowShape(shapeId);

        if (window.PlotShapes && window.PlotShapes.buildSymbolPath) {
            const pathD = window.PlotShapes.buildSymbolPath(shapeId, dotSize * 2);
            const el = parent.append('path')
                .attr('d', pathD)
                .attr('transform', 'translate(' + x + ',' + y + ')');
            if (hollow) {
                const hollowStroke = (strokeColor != null) ? strokeColor : dotColor;
                el.attr('fill', '#ffffff')
                    .attr('stroke', hollowStroke)
                    .attr('stroke-width', Math.max(1, strokeWidth));
            } else {
                el.attr('fill', dotColor);
                if (strokeColor && strokeWidth > 0) {
                    el.attr('stroke', strokeColor).attr('stroke-width', strokeWidth);
                } else {
                    el.attr('stroke', 'none');
                }
            }
        } else {
            const el = parent.append('circle')
                .attr('cx', x).attr('cy', y)
                .attr('r', dotSize)
                .attr('fill', dotColor);
            if (strokeColor && strokeWidth > 0) {
                el.attr('stroke', strokeColor).attr('stroke-width', strokeWidth);
            } else {
                el.attr('stroke', 'none');
            }
        }
    }

    function readAllParams(app) {
        const $ = app.$;
        const p = Object.assign({},
            PC.readCanvasParams(app, 760, 600),
            PC.readTitleLegendParams(app)
        );
        p.direction = app.state.barDirection || 'vertical';
        p.bigCatSorted = !!app.state.bigCatSorted;
        p.groupOrder = ($('groupOrder') && $('groupOrder').value) || '';
        p.barOuterGap = Math.max(0, Math.min(0.9, PC.num(app, 'barOuterGap', 0.4)));

        p.baselineValue = PC.num(app, 'baselineValue', 0);
        p.showBaseline = $('showBaseline') ? $('showBaseline').checked : true;
        p.baselineColor = ($('baselineColor') && $('baselineColor').value) || '#999999';
        p.baselineWidth = Math.max(0, PC.num(app, 'baselineWidth', 1));
        p.baselineDash = $('baselineDash') ? $('baselineDash').checked : false;

        p.dotSizeMode = ($('dotSizeMode') && $('dotSizeMode').value) || 'uniform';
        p.dotSize = Math.max(2, PC.num(app, 'dotSize', 8));
        p.dotSizeMin = Math.max(1, PC.num(app, 'dotSizeMin', 4));
        p.dotSizeMax = Math.max(p.dotSizeMin, PC.num(app, 'dotSizeMax', 20));
        p.dotShape = ($('dotShape') && $('dotShape').value) || 'circle';
        p.dotStrokeMode = ($('dotStrokeMode') && $('dotStrokeMode').value) || 'same';
        p.dotStrokeColor = ($('dotStrokeColor') && $('dotStrokeColor').value) || '#333333';
        p.dotStrokeWidth = Math.max(0, PC.num(app, 'dotStrokeWidth', 1.5));

        p.lineWidth = Math.max(0.5, PC.num(app, 'lineWidth', 2));
        p.lineColorMode = ($('lineColorMode') && $('lineColorMode').value) || 'same';
        p.uniformLineColor = ($('uniformLineColor') && $('uniformLineColor').value) || '#888888';
        p.posLineColor = ($('posLineColor') && $('posLineColor').value) || '#e15759';
        p.negLineColor = ($('negLineColor') && $('negLineColor').value) || '#4e79a7';
        p.lineDash = $('lineDash') ? $('lineDash').checked : false;

        return p;
    }

    function updateStrokeColorVisibility() {
        const modeSel = document.getElementById('dotStrokeMode');
        const item = document.getElementById('dotStrokeColorItem');
        if (!modeSel || !item) return;
        item.style.display = (modeSel.value === 'custom') ? '' : 'none';
    }

    function updateLineColorVisibility() {
        const modeSel = document.getElementById('lineColorMode');
        const uniformItem = document.getElementById('uniformLineColorItem');
        const posItem = document.getElementById('posLineColorItem');
        const negItem = document.getElementById('negLineColorItem');
        if (!modeSel) return;
        const mode = modeSel.value;
        if (uniformItem) uniformItem.style.display = (mode === 'uniform') ? '' : 'none';
        if (posItem) posItem.style.display = (mode === 'direction') ? '' : 'none';
        if (negItem) negItem.style.display = (mode === 'direction') ? '' : 'none';
    }

    function drawChart(app) {
        const s = app.state;
        app.toolbarTip.textContent = '';
        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.x || !s.roles.y) {
            app.showTip('msgTip3', T.selectCols, 'error'); return;
        }

        const p = readAllParams(app);
        const axisCfg = s.axis;
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

    function computeDotSize(p, cell, maxAbs) {
        if (p.dotSizeMode === 'uniform') return p.dotSize;
        const minS = p.dotSizeMin;
        const maxS = Math.max(minS, p.dotSizeMax);
        if (maxAbs <= 0) return minS;
        const t = Math.min(1, Math.abs(cell.value) / maxAbs);
        return minS + (maxS - minS) * t;
    }

    function drawVertical(app, prepared) {
        const { p, axisCfg, cells, catVals, grpVals, hasGroup } = prepared;
        const s = app.state;

        const isLogY = axisCfg.y.scaleType === 'log';
        const logBaseY = (axisCfg.y.logBase && axisCfg.y.logBase > 0) ? axisCfg.y.logBase : 10;
        const baselineValue = p.baselineValue;

        const valueList = cells.map(c => c.value);
        valueList.push(baselineValue);

        let maxY, minY;
        if (isLogY) {
            const posVals = valueList.filter(v => v > 0);
            maxY = posVals.length ? Math.max.apply(null, posVals) : 10;
            minY = posVals.length ? Math.min.apply(null, posVals) : 1;
        } else {
            maxY = Math.max.apply(null, valueList);
            minY = Math.min.apply(null, valueList);
        }

        const margin = 30;
        const areaX = margin, areaY = margin;
        const areaW = p.width - 2 * margin, areaH = p.height - 2 * margin;

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

        const colorKeys = hasGroup ? grpVals : catVals;
        const baseColors = app.resolvePaletteColors(colorKeys.length);
        const colorOf = k => {
            if (!k) return '#cccccc';
            const idx = colorKeys.indexOf(k);
            return s.customColors[k] || baseColors[idx] || '#cccccc';
        };

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height, fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        if (axisCfg.y.gridShow) {
            const gridY = svg.append('g').attr('class', 'grid grid-y');
            const ticks = yScale.ticks ? yScale.ticks() : yScale.domain();
            ticks.forEach(t => {
                if (!isLogY && axisCfg.y.breakEnable && t > axisCfg.y.breakFrom && t < axisCfg.y.breakTo) return;
                const y = Math.round(yScale(t)) + 0.5;
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
            cells.forEach((_, i) => {
                const cx = Math.round(xScale(i) + xScale.bandwidth() / 2) + 0.5;
                gridX.append('line')
                    .attr('x1', cx).attr('x2', cx)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', axisCfg.x.gridColor)
                    .attr('stroke-dasharray', axisCfg.x.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        if (p.showBaseline) {
            const baselinePx = Math.round(yScale(baselineValue)) + 0.5;
            if (isFinite(baselinePx)) {
                const lineEl = svg.append('line')
                    .attr('class', 'baseline')
                    .attr('x1', plotX).attr('x2', plotX + plotW)
                    .attr('y1', baselinePx).attr('y2', baselinePx)
                    .attr('stroke', p.baselineColor)
                    .attr('stroke-width', p.baselineWidth)
                    .attr('pointer-events', 'none');
                if (p.baselineDash) lineEl.attr('stroke-dasharray', '6 4');
            }
        }

        let maxAbs = 0;
        cells.forEach(c => {
            const v = Math.abs(c.value);
            if (v > maxAbs) maxAbs = v;
        });

        const lollipopG = svg.append('g').attr('class', 'lollipops');
        cells.forEach(cell => {
            const bandX = xScale(cell.idx);
            const bandW = xScale.bandwidth();
            const cx = bandX + bandW / 2;

            const baselinePx = Math.round(yScale(baselineValue)) + 0.5;
            const valuePx = yScale(cell.value);
            if (!isFinite(baselinePx) || !isFinite(valuePx)) return;

            const colorKey = hasGroup ? cell.grp : cell.cat;
            const dotColor = colorOf(colorKey);
            const strokeColor = resolveStrokeColor(p, dotColor);
            const lineColor = resolveLineColor(p, cell, baselineValue, dotColor);
            const dotSize = computeDotSize(p, cell, maxAbs);

            if (Math.abs(valuePx - baselinePx) > 0.5) {
                const lineEl = lollipopG.append('line')
                    .attr('x1', cx).attr('x2', cx)
                    .attr('y1', baselinePx).attr('y2', valuePx)
                    .attr('stroke', lineColor)
                    .attr('stroke-width', p.lineWidth)
                    .attr('stroke-linecap', 'round');
                if (p.lineDash) lineEl.attr('stroke-dasharray', '6 4');
            }

            drawDot(lollipopG, {
                x: cx, y: valuePx,
                shapeId: p.dotShape,
                dotSize: dotSize,
                dotColor: dotColor,
                strokeColor: strokeColor,
                strokeWidth: p.dotStrokeWidth
            });
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

        const xAxisFn = d3.axisBottom(xScale);
        xAxisFn.tickFormat(i => cells[i] ? cells[i].cat : '');
        const xAxisG = svg.append('g').attr('class', 'x-axis')
            .attr('transform', 'translate(0, ' + xAxisYFinal + ')')
            .call(xAxisFn);
        xAxisG.selectAll('.tick').attr('transform', d => {
            const cx = Math.round(xScale(d) + xScale.bandwidth() / 2) + 0.5;
            return `translate(${cx},0)`;
        });
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
        yAxisG.selectAll('.tick').attr('transform', d => {
            const y = Math.round(yScale(d)) + 0.5;
            return `translate(0,${y})`;
        });
        PlotAxis.applyAxis(yAxisG, axisCfg.y, 'left', yBreakPos);

        BarCommon.drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad);

        PlotAxis.drawFrameAndRefLines(svg, {
            plotX, plotY, plotW, plotH,
            xScale: xScale,
            yScale: yScale,
            axisCfg: axisCfg
        });

        if (p.showLegend && hasGroup && grpVals.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: grpVals.map(g => ({ name: g, percent: null })),
                colors: grpVals.map(g => colorOf(g)),
                shape: 'circle',
                labelFormatter: it => it.name
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function drawHorizontal(app, prepared) {
        const { p, axisCfg, cells, catVals, grpVals, hasGroup } = prepared;
        const s = app.state;

        const isLogX = axisCfg.x.scaleType === 'log';
        const logBaseX = (axisCfg.x.logBase && axisCfg.x.logBase > 0) ? axisCfg.x.logBase : 10;
        const baselineValue = p.baselineValue;

        const valueList = cells.map(c => c.value);
        valueList.push(baselineValue);

        let maxX, minX;
        if (isLogX) {
            const posVals = valueList.filter(v => v > 0);
            maxX = posVals.length ? Math.max.apply(null, posVals) : 10;
            minX = posVals.length ? Math.min.apply(null, posVals) : 1;
        } else {
            maxX = Math.max.apply(null, valueList);
            minX = Math.min.apply(null, valueList);
        }

        const margin = 30;
        const areaX = margin, areaY = margin;
        const areaW = p.width - 2 * margin, areaH = p.height - 2 * margin;

        const xLabelFont = axisCfg.x.tickValueShow ? axisCfg.x.tickFontSize : 0;
        const yLabelFont = axisCfg.y.tickValueShow ? axisCfg.y.tickFontSize : 0;
        const xTitleFont = (axisCfg.x.titleShow && axisCfg.x.titleContent) ? axisCfg.x.titleFontSize + 8 : 0;
        const yTitleFont = (axisCfg.y.titleShow && axisCfg.y.titleContent) ? axisCfg.y.titleFontSize + 8 : 0;

        let maxCatW = 0;
        cells.forEach(c => {
            maxCatW = Math.max(maxCatW, PC.estTextWidth(c.cat, axisCfg.y.tickFontSize));
        });
        const catLabelSpace = Math.min(maxCatW + 12, areaW * 0.4);

        const leftPad = catLabelSpace + yTitleFont + 10;
        const bottomPad = xLabelFont + 12 + xTitleFont + 10;
        const rightPad = 30;
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

        const colorKeys = hasGroup ? grpVals : catVals;
        const baseColors = app.resolvePaletteColors(colorKeys.length);
        const colorOf = k => {
            if (!k) return '#cccccc';
            const idx = colorKeys.indexOf(k);
            return s.customColors[k] || baseColors[idx] || '#cccccc';
        };

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height, fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        if (axisCfg.x.gridShow) {
            const gridX = svg.append('g').attr('class', 'grid grid-x');
            const ticks = xScale.ticks ? xScale.ticks() : xScale.domain();
            ticks.forEach(t => {
                if (!isLogX && axisCfg.x.breakEnable && t > axisCfg.x.breakFrom && t < axisCfg.x.breakTo) return;
                const x = Math.round(xScale(t)) + 0.5;
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
            cells.forEach((_, i) => {
                const cy = Math.round(yScale(i) + yScale.bandwidth() / 2) + 0.5;
                gridY.append('line')
                    .attr('x1', plotX).attr('x2', plotX + plotW)
                    .attr('y1', cy).attr('y2', cy)
                    .attr('stroke', axisCfg.y.gridColor)
                    .attr('stroke-dasharray', axisCfg.y.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        if (p.showBaseline) {
            const baselinePx = Math.round(xScale(baselineValue)) + 0.5;
            if (isFinite(baselinePx)) {
                const lineEl = svg.append('line')
                    .attr('class', 'baseline')
                    .attr('x1', baselinePx).attr('x2', baselinePx)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', p.baselineColor)
                    .attr('stroke-width', p.baselineWidth)
                    .attr('pointer-events', 'none');
                if (p.baselineDash) lineEl.attr('stroke-dasharray', '6 4');
            }
        }

        let maxAbs = 0;
        cells.forEach(c => {
            const v = Math.abs(c.value);
            if (v > maxAbs) maxAbs = v;
        });

        const lollipopG = svg.append('g').attr('class', 'lollipops');
        cells.forEach(cell => {
            const bandY = yScale(cell.idx);
            const bandH = yScale.bandwidth();
            const cy = bandY + bandH / 2;

            const baselinePx = Math.round(xScale(baselineValue)) + 0.5;
            const valuePx = xScale(cell.value);
            if (!isFinite(baselinePx) || !isFinite(valuePx)) return;

            const colorKey = hasGroup ? cell.grp : cell.cat;
            const dotColor = colorOf(colorKey);
            const strokeColor = resolveStrokeColor(p, dotColor);
            const lineColor = resolveLineColor(p, cell, baselineValue, dotColor);
            const dotSize = computeDotSize(p, cell, maxAbs);

            if (Math.abs(valuePx - baselinePx) > 0.5) {
                const lineEl = lollipopG.append('line')
                    .attr('x1', baselinePx).attr('x2', valuePx)
                    .attr('y1', cy).attr('y2', cy)
                    .attr('stroke', lineColor)
                    .attr('stroke-width', p.lineWidth)
                    .attr('stroke-linecap', 'round');
                if (p.lineDash) lineEl.attr('stroke-dasharray', '6 4');
            }

            drawDot(lollipopG, {
                x: valuePx, y: cy,
                shapeId: p.dotShape,
                dotSize: dotSize,
                dotColor: dotColor,
                strokeColor: strokeColor,
                strokeWidth: p.dotStrokeWidth
            });
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
        xAxisG.selectAll('.tick').attr('transform', d => {
            const x = Math.round(xScale(d)) + 0.5;
            return `translate(${x},0)`;
        });
        PlotAxis.applyAxis(xAxisG, axisCfg.x, 'bottom', xBreakPos);

        const yAxisFn = d3.axisLeft(yScale);
        yAxisFn.tickFormat(i => cells[i] ? cells[i].cat : '');
        const yAxisG = svg.append('g').attr('class', 'y-axis')
            .attr('transform', 'translate(' + yAxisXFinal + ', 0)')
            .call(yAxisFn);
        yAxisG.selectAll('.tick').attr('transform', d => {
            const cy = Math.round(yScale(d) + yScale.bandwidth() / 2) + 0.5;
            return `translate(0,${cy})`;
        });
        PlotAxis.applyAxis(yAxisG, axisCfg.y, 'left');

        BarCommon.drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad);

        PlotAxis.drawFrameAndRefLines(svg, {
            plotX, plotY, plotW, plotH,
            xScale: xScale,
            yScale: yScale,
            axisCfg: axisCfg
        });

        if (p.showLegend && hasGroup && grpVals.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: grpVals.map(g => ({ name: g, percent: null })),
                colors: grpVals.map(g => colorOf(g)),
                shape: 'circle',
                labelFormatter: it => it.name
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function fillGroupOrderInput(app) {
        const el = app.$('groupOrder');
        if (!el) return;
        const state = app.state;
        const headers = state.headers || [];
        let col = '';
        if (state.roles.group && headers.indexOf(state.roles.group) >= 0) {
            col = state.roles.group;
        } else if (state.roles.x && headers.indexOf(state.roles.x) >= 0) {
            col = state.roles.x;
        }
        if (!col) { el.value = ''; return; }
        const vals = getUniqueValues(app, col);
        el.value = vals.join(',');
    }

    function refreshGroupColors(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const state = app.state;
        const headers = state.headers || [];
        let col = '';
        if (state.roles.group && headers.indexOf(state.roles.group) >= 0) {
            col = state.roles.group;
        } else if (state.roles.x && headers.indexOf(state.roles.x) >= 0) {
            col = state.roles.x;
        }
        if (!col) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const vals = getUniqueValues(app, col);
        if (!vals.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const baseColors = app.resolvePaletteColors(vals.length);
        const displayItems = vals.map((k, i) => ({
            name: k,
            color: state.customColors[k] || baseColors[i]
        }));
        PlotCommon.renderColorAssignment(container, {
            items: displayItems,
            onChange: (idx, c) => {
                state.customColors[vals[idx]] = c;
                if (state.currentSvg) app.drawChart();
            },
            onResetAll: () => {
                state.customColors = {};
                refreshGroupColors(app);
                if (state.currentSvg) app.drawChart();
            }
        });
    }

    PlotApp.create({
        exportName: 'lollipop_chart',
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
                input.value = app.state.roles.group || app.state.roles.x || '';
            }
        },

        setup: function (app) {
            fillShapeSelect();
            BarCommon.fillRoleSelects(app, T.noGroup);
            BarCommon.refreshAxisPanel(app);
            BarCommon.bindRoleEvents(app, null, null, null);

            fillGroupOrderInput(app);
            app.$('xColSel').addEventListener('change', () => {
                fillGroupOrderInput(app);
                refreshGroupColors(app);
            });
            app.$('groupColSel').addEventListener('change', () => {
                fillGroupOrderInput(app);
                refreshGroupColors(app);
            });

            const chk = app.$('bigCatSorted');
            if (chk) {
                chk.checked = !!app.state.bigCatSorted;
                chk.addEventListener('change', () => {
                    app.state.bigCatSorted = chk.checked;
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const strokeModeSel = app.$('dotStrokeMode');
            if (strokeModeSel) {
                strokeModeSel.addEventListener('change', updateStrokeColorVisibility);
            }
            const lineColorSel = app.$('lineColorMode');
            if (lineColorSel) {
                lineColorSel.addEventListener('change', updateLineColorVisibility);
            }
            updateStrokeColorVisibility();
            updateLineColorVisibility();
        },

        onDataImported: function (app, res) {
            const state = app.state;
            state.columnTypes = res.columnTypes || {};
            const cats = res.headers.filter(h => state.columnTypes[h] === 'categorical' || state.columnTypes[h] === 'date');
            const nums = res.headers.filter(h => state.columnTypes[h] === 'numeric');
            state.roles.x = cats[0] || res.headers[0];
            state.roles.group = cats[1] || '';
            state.roles.y = nums[0] || res.headers[2] || res.headers[0];
            state.customColors = {};
            state.axis.x.titleEdited = false;
            state.axis.y.titleEdited = false;

            const chk = app.$('bigCatSorted');
            if (chk) chk.checked = state.bigCatSorted;

            app.syncLegendTitle();
            BarCommon.syncAxisTitlesByDirection(app);
            BarCommon.fillRoleSelects(app, T.noGroup);
            fillGroupOrderInput(app);
            BarCommon.refreshAxisPanel(app);
            refreshGroupColors(app);
            updateStrokeColorVisibility();
            updateLineColorVisibility();
        },

        onReset: function (app) {
            const state = app.state;
            state.columnTypes = {};
            state.roles = { x: '', group: '', y: '' };
            state.customColors = {};
            state.axis = PlotAxis.defaultState();
            state.axis.x.titleEdited = false;
            state.axis.y.titleEdited = false;
            state.bigCatSorted = true;

            const chk = app.$('bigCatSorted');
            if (chk) chk.checked = true;

            const goEl = app.$('groupOrder');
            if (goEl) goEl.value = '';

            BarCommon.fillRoleSelects(app, T.noGroup);
            BarCommon.refreshAxisPanel(app);
            refreshGroupColors(app);
            updateStrokeColorVisibility();
            updateLineColorVisibility();
        },

        onStateRestored: function (app) {
            const chk = app.$('bigCatSorted');
            if (chk) chk.checked = !!app.state.bigCatSorted;
            BarCommon.fillRoleSelects(app, T.noGroup);
            BarCommon.refreshAxisPanel(app);
            refreshGroupColors(app);
            updateStrokeColorVisibility();
            updateLineColorVisibility();
        },

        refreshColors: function (app) {
            refreshGroupColors(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
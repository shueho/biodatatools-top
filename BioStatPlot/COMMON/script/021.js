(function () {
    'use strict';

    const PC = window.PlotCommon;
    const SC = window.StatCommon;
    const PT = window.PlotTest;
    const PEB = window.PlotErrorBar;

    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Headers required. <strong>Category (X-axis)</strong> and <strong>Value</strong> are mandatory. When a category contains duplicate rows, mean and SD/SEM are computed automatically.'
              + '<br>If your data is in <strong>wide format</strong>, please convert it first using the '
              + '<a href="../../en/022.Wide_long_table_reshaping.html" target="_blank" style="color:#1f4068;font-weight:600;">Wide-to-Long Table Converter</a>.'
            : '需包含表头。<strong>分类列（X轴）</strong> 和 <strong>数值列</strong> 必填。同一分类下的多个重复行会自动计算均值与标准差/标准误。'
              + '<br>若您的数据为<strong>宽表</strong>形式，请先使用 '
              + '<a href="../../ch/022.Wide_long_table_reshaping.html" target="_blank" style="color:#1f4068;font-weight:600;">宽长表转换工具</a> 转换后再导入。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select the category and value columns' : '❌ 请选择分类列与数值列',
        noValid: EN ? '❌ Could not generate valid plot data' : '❌ 未能生成有效绘图数据',
        colorEmpty: EN ? 'Category colors will be shown here after selecting data columns' : '选择数据列后将在此处显示每个类别的颜色',
        noDataPlaceholder: EN ? '— Please import data first —' : '— 请先导入数据 —',
        sortAlphaFallback: EN ? 'Category column' : '分类列'
    };

    const EX_DATA =
        'Category\tValue\n' +
        'A\t18.2\nA\t19.0\nA\t17.8\nA\t18.8\nA\t18.0\nA\t19.2\n' +
        'B\t20.0\nB\t28.5\nB\t22.3\nB\t30.1\nB\t18.6\nB\t26.4\n' +
        'C\t15.3\nC\t16.7\nC\t15.9\nC\t16.2\nC\t14.8\nC\t16.5\n' +
        'D\t14.2\nD\t24.8\nD\t18.6\nD\t26.1\nD\t16.3\nD\t22.0\n' +
        'E\t28.2\nE\t27.5\nE\t29.0\nE\t28.8\nE\t27.0\nE\t28.4\n' +
        'F\t8.5\nF\t19.2\nF\t11.4\nF\t22.6\nF\t9.8\nF\t17.5\n' +
        'G\t31.5\nG\t30.2\nG\t32.1\nG\t31.0\nG\t30.8\nG\t31.7\n' +
        'H\t7.2\nH\t13.5\nH\t9.8\nH\t14.2\nH\t8.6\nH\t12.1';

    function fillRoleSelects(app) {
        const s = app.state;
        const xSel = app.$('xColSel');
        const ySel = app.$('yColSel');
        if (!xSel || !ySel) return;

        if (!s.headers.length) {
            xSel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            ySel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            xSel.disabled = ySel.disabled = true;
            return;
        }
        xSel.disabled = ySel.disabled = false;

        const buildOpts = function (cur) {
            return s.headers.map(function (h) {
                return '<option value="' + PlotCommon.escapeHtml(h) + '"' +
                    (h === cur ? ' selected' : '') + '>' +
                    PlotCommon.escapeHtml(h) + '</option>';
            }).join('');
        };
        xSel.innerHTML = buildOpts(s.roles.x || '');
        ySel.innerHTML = buildOpts(s.roles.y || '');
    }

    function syncSortAlphaLabel(app) {
        const opt = document.getElementById('sortAlphaOption');
        if (!opt) return;
        const colName = app.state.roles.x || '';
        opt.textContent = colName ? colName : T.sortAlphaFallback;
    }

    function fillShapeSelect() {
        const shapes = window.PlotShapes && window.PlotShapes.SHAPES;
        const sel = document.getElementById('dotShape');
        if (!shapes || !sel || sel.options.length) return;
        const lang = (PlotI18N.lang() === 'en') ? 'en' : 'zh';
        sel.innerHTML = shapes.map(s =>
            '<option value="' + s.id + '">' + (s[lang] || s.zh) + '</option>'
        ).join('');
        sel.value = 'circle';
    }

    function readParams(app) {
        const $ = app.$;
        const p = Object.assign({},
            PC.readCanvasParams(app, 760, 600),
            PC.readTitleLegendParams(app)
        );
        p.direction = app.state.barDirection || 'vertical';
        p.errBar = PT.readErrBarSettings(app.$('errorBarPanelContainer'));
        p.dotSize = Math.max(2, PC.num(app, 'dotSize', 8));
        p.dotShape = ($('dotShape') && $('dotShape').value) || 'circle';
        p.dotStrokeMode = ($('dotStrokeMode') && $('dotStrokeMode').value) || 'white';
        p.dotStrokeColor = ($('dotStrokeColor') && $('dotStrokeColor').value) || '#333333';
        p.dotStrokeWidth = Math.max(0, PC.num(app, 'dotStrokeWidth', 1.5));
        return p;
    }

    function readOrderParams(app) {
        const $ = app.$;
        return {
            catOrderRaw: $('catOrder') ? $('catOrder').value.trim() : '',
            sortBy: ($('sortByMode') && $('sortByMode').value) || '__input__',
            sortDir: ($('sortDir') && $('sortDir').value) || 'desc'
        };
    }

    function prepareData(app) {
        const s = app.state;
        const catKey = s.roles.x;
        const valKey = s.roles.y;
        if (!catKey || !valKey || !s.data.length) {
            return { cells: [], catOrder: [] };
        }

        const map = new Map();
        const inputOrder = [];
        s.data.forEach(function (row) {
            const cat = String(row[catKey] == null ? '' : row[catKey]);
            if (!cat) return;
            const v = parseFloat(row[valKey]);
            if (!isFinite(v)) return;
            if (!map.has(cat)) {
                map.set(cat, { cat: cat, values: [] });
                inputOrder.push(cat);
            }
            map.get(cat).values.push(v);
        });

        const cells = [];
        inputOrder.forEach(function (cat) {
            const rec = map.get(cat);
            if (!rec.values.length) return;
            cells.push({ cat: cat, values: rec.values });
        });
        if (!cells.length) return { cells: [], catOrder: [] };

        const op = readOrderParams(app);
        let catOrder;

        if (op.catOrderRaw) {
            const wanted = op.catOrderRaw.split(/[,，\s]+/).filter(Boolean);
            const set = new Set(inputOrder);
            const out = [], used = new Set();
            wanted.forEach(function (w) {
                if (set.has(w) && !used.has(w)) { out.push(w); used.add(w); }
            });
            inputOrder.forEach(function (c) { if (!used.has(c)) out.push(c); });
            catOrder = out;
        } else if (op.sortBy === '__input__') {
            catOrder = inputOrder.slice();
        } else {
            const dir = op.sortDir === 'asc' ? 1 : -1;
            const keyFn = function (cat) {
                if (op.sortBy === '__alpha__') return cat;
                const rec = map.get(cat);
                return rec.values.reduce(function (a, b) { return a + b; }, 0) / rec.values.length;
            };
            catOrder = inputOrder.slice().sort(function (a, b) {
                const ka = keyFn(a), kb = keyFn(b);
                if (typeof ka === 'string' && typeof kb === 'string') {
                    return ka.localeCompare(kb) * dir;
                }
                if (ka === kb) return 0;
                return (ka - kb) * dir;
            });
        }

        const ordered = [];
        catOrder.forEach(function (cat) {
            const rec = map.get(cat);
            if (!rec) return;
            ordered.push({ cat: cat, values: rec.values });
        });

        return { cells: ordered, catOrder: catOrder };
    }

    function resolveStrokeColor(p, fillColor) {
        if (p.dotStrokeMode === 'none') return null;
        if (p.dotStrokeMode === 'same') return fillColor;
        if (p.dotStrokeMode === 'white') return '#ffffff';
        return p.dotStrokeColor;
    }

    function isHollowShape(shapeId) {
        if (window.PlotShapes && window.PlotShapes.isHollow) {
            return window.PlotShapes.isHollow(shapeId);
        }
        return /-hollow$/.test(String(shapeId || ''));
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

    function updateStrokeVisibility() {
        const modeSel = document.getElementById('dotStrokeMode');
        const item = document.getElementById('dotStrokeColorItem');
        if (!modeSel || !item) return;
        item.style.display = (modeSel.value === 'custom') ? '' : 'none';
    }

    function attachStats(cells, eb) {
        cells.forEach(function (c) {
            c._stats = SC.computeErrorStats(c.values, eb.errType || 'sd');
        });
    }

    function drawChart(app) {
        const s = app.state;
        app.toolbarTip.textContent = '';
        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.x || !s.roles.y) {
            app.showTip('msgTip3', T.selectCols, 'error');
            return;
        }

        const p = readParams(app);
        const axisCfg = s.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        const prepared = prepareData(app);
        if (!prepared.cells.length) {
            app.showTip('msgTip3', T.noValid, 'error');
            return;
        }
        attachStats(prepared.cells, p.errBar);

        if (p.direction === 'horizontal') drawHorizontal(app, p, axisCfg, prepared);
        else drawVertical(app, p, axisCfg, prepared);

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    function drawVertical(app, p, axisCfg, prepared) {
        const s = app.state;
        const cells = prepared.cells;
        const catOrder = prepared.catOrder;
        const eb = p.errBar;

        const isLogY = axisCfg.y.scaleType === 'log';
        const logBaseY = (axisCfg.y.logBase > 0) ? axisCfg.y.logBase : 10;

        let maxVal = -Infinity, minVal = Infinity;
        cells.forEach(function (c) {
            const st = c._stats;
            const up = (eb.mode === 'none') ? st.mean : st.upper;
            const lo = (eb.mode === 'none') ? st.mean : st.lower;
            if (up > maxVal) maxVal = up;
            if (lo < minVal) minVal = lo;
        });
        if (!isFinite(maxVal)) maxVal = 1;
        if (!isFinite(minVal)) minVal = 0;

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

        const yDomain = PlotAxis.resolveDomain(axisCfg.y, [Math.min(0, minVal), maxVal]);
        if (isLogY && yDomain[0] <= 0) {
            const pos = cells.map(function (c) { return c._stats.mean; }).filter(function (v) { return v > 0; });
            yDomain[0] = (pos.length ? Math.min.apply(null, pos) : 1) * 0.5;
        }

        const yScaleRaw = isLogY
            ? d3.scaleLog().base(logBaseY).domain(yDomain).range([plotY + plotH, plotY])
            : d3.scaleLinear().domain(yDomain).range([plotY + plotH, plotY]).nice();
        const yScale = isLogY ? yScaleRaw : PlotAxis.applyBreak(yScaleRaw, axisCfg.y);
        const yBreakPos = isLogY ? NaN : PlotAxis.getBreakPosition(yScale, axisCfg.y);

        const xOuter = d3.scaleBand().domain(catOrder).range([plotX, plotX + plotW])
            .paddingOuter(0.4).paddingInner(0.4);

        let xAxisY = plotY + plotH;
        if (axisCfg.x.crossMode === 'max') xAxisY = plotY;
        else if (axisCfg.x.crossMode === 'zero') xAxisY = isLogY ? (plotY + plotH) : yScale(0);

        const colorKeys = catOrder;
        const baseColors = app.resolvePaletteColors(colorKeys.length);
        const colorOf = function (k) {
            if (!k) return '#cccccc';
            const idx = colorKeys.indexOf(k);
            return s.customColors[k] || baseColors[idx] || '#cccccc';
        };

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        if (axisCfg.y.gridShow) {
            const gridY = svg.append('g').attr('class', 'grid grid-y');
            (yScale.ticks ? yScale.ticks() : yScale.domain()).forEach(function (t) {
                if (!isLogY && axisCfg.y.breakEnable && t > axisCfg.y.breakFrom && t < axisCfg.y.breakTo) return;
                const y = Math.round(yScale(t)) + 0.5;
                if (!isFinite(y)) return;
                gridY.append('line').attr('x1', plotX).attr('x2', plotX + plotW)
                    .attr('y1', y).attr('y2', y)
                    .attr('stroke', axisCfg.y.gridColor)
                    .attr('stroke-dasharray', axisCfg.y.gridDash)
                    .attr('stroke-width', 1);
            });
        }
        if (axisCfg.x.gridShow) {
            const gridX = svg.append('g').attr('class', 'grid grid-x');
            catOrder.forEach(function (cv) {
                const cx = Math.round(xOuter(cv) + xOuter.bandwidth() / 2) + 0.5;
                gridX.append('line')
                    .attr('x1', cx).attr('x2', cx)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', axisCfg.x.gridColor)
                    .attr('stroke-dasharray', axisCfg.x.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        const errG = svg.append('g').attr('class', 'error-bars');
        const dotG = svg.append('g').attr('class', 'dots');

        cells.forEach(function (cell) {
            const xPos = xOuter(cell.cat);
            const cx = xPos + xOuter.bandwidth() / 2;
            const dotColor = colorOf(cell.cat);
            const st = cell._stats;

            if (eb.mode !== 'none' && st.n >= 2) {
                const yUp = (isLogY && st.upper <= 0) ? yScale(st.mean) : yScale(st.upper);
                const yDn = (isLogY && st.lower <= 0) ? yScale(st.mean) : yScale(st.lower);
                if (isFinite(yUp) && isFinite(yDn)) {
                    BarCommon.drawErrorBar(errG, {
                        xPx: cx,
                        yPx: 0,
                        barThickness: xOuter.bandwidth() * 0.6,
                        loPx: yUp,
                        hiPx: yDn,
                        valuePx: yScale(st.mean),
                        isHorizontal: false,
                        errColor: (PEB && PEB.resolveErrorColor)
                            ? PEB.resolveErrorColor(eb, dotColor)
                            : (eb.errColor || '#333'),
                        errWidth: eb.errWidth,
                        capWidth: eb.capWidth,
                        capMode: eb.showWhich
                    });
                }
            }

            const yMean = (isLogY && st.mean <= 0) ? xAxisY : yScale(st.mean);
            if (!isFinite(yMean)) return;

            drawDot(dotG, {
                x: cx, y: yMean,
                shapeId: p.dotShape,
                dotSize: p.dotSize,
                dotColor: dotColor,
                strokeColor: resolveStrokeColor(p, dotColor),
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

        const xAxisFn = d3.axisBottom(xOuter);
        const xTicks = PlotAxis.resolveTicks(axisCfg.x, xOuter);
        if (xTicks && xTicks.length) xAxisFn.tickValues(xTicks);
        const xAxisG = svg.append('g').attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + xAxisY + ')')
            .call(xAxisFn);
        xAxisG.selectAll('.tick').attr('transform', d => {
            const cx = Math.round(xOuter(d) + xOuter.bandwidth() / 2) + 0.5;
            return `translate(${cx},0)`;
        });
        PlotAxis.applyAxis(xAxisG, axisCfg.x, 'bottom');

        const yAxisFn = d3.axisLeft(yScale);
        const yTicks = PlotAxis.resolveTicks(axisCfg.y, yScale);
        let yTickVals = yTicks;
        if (!yTickVals) {
            yTickVals = yScale.ticks ? yScale.ticks() : null;
            if (!isLogY && axisCfg.y.breakEnable && yTickVals) {
                yTickVals = yTickVals.filter(function (t) {
                    return !(t > axisCfg.y.breakFrom && t < axisCfg.y.breakTo);
                });
            }
        }
        if (yTickVals && yTickVals.length) yAxisFn.tickValues(yTickVals);
        const yAxisG = svg.append('g').attr('class', 'y-axis')
            .attr('transform', 'translate(' + plotX + ',0)')
            .call(yAxisFn);
        yAxisG.selectAll('.tick').attr('transform', d => {
            const y = Math.round(yScale(d)) + 0.5;
            return `translate(0,${y})`;
        });
        PlotAxis.applyAxis(yAxisG, axisCfg.y, 'left', yBreakPos);

        BarCommon.drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad);

        PlotAxis.drawFrameAndRefLines(svg, {
            plotX, plotY, plotW, plotH,
            xScale: xOuter,
            yScale: yScale,
            axisCfg: axisCfg
        });

        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function drawHorizontal(app, p, axisCfg, prepared) {
        const s = app.state;
        const cells = prepared.cells;
        const catOrder = prepared.catOrder;
        const eb = p.errBar;

        const isLogX = axisCfg.x.scaleType === 'log';
        const logBaseX = (axisCfg.x.logBase > 0) ? axisCfg.x.logBase : 10;

        let maxVal = -Infinity, minVal = Infinity;
        cells.forEach(function (c) {
            const st = c._stats;
            const up = (eb.mode === 'none') ? st.mean : st.upper;
            const lo = (eb.mode === 'none') ? st.mean : st.lower;
            if (up > maxVal) maxVal = up;
            if (lo < minVal) minVal = lo;
        });
        if (!isFinite(maxVal)) maxVal = 1;
        if (!isFinite(minVal)) minVal = 0;

        const margin = 30;
        const areaX = margin, areaY = margin;
        const areaW = p.width - 2 * margin, areaH = p.height - 2 * margin;

        const xLabelFont = axisCfg.x.tickValueShow ? axisCfg.x.tickFontSize : 0;
        const yLabelFont = axisCfg.y.tickValueShow ? axisCfg.y.tickFontSize : 0;
        const xTitleFont = (axisCfg.x.titleShow && axisCfg.x.titleContent) ? axisCfg.x.titleFontSize + 8 : 0;
        const yTitleFont = (axisCfg.y.titleShow && axisCfg.y.titleContent) ? axisCfg.y.titleFontSize + 8 : 0;

        let maxCatW = 0;
        catOrder.forEach(function (c) {
            maxCatW = Math.max(maxCatW, PC.estTextWidth(c, axisCfg.y.tickFontSize));
        });
        const catSpace = Math.min(maxCatW + 12, areaW * 0.4);

        const leftPad = catSpace + yTitleFont + 10;
        const bottomPad = xLabelFont + 12 + xTitleFont + 10;
        const rightPad = 40;
        const topPad = 20;

        const plotX = areaX + leftPad;
        const plotY = areaY + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, areaH - topPad - bottomPad);

        const xDomain = PlotAxis.resolveDomain(axisCfg.x, [Math.min(0, minVal), maxVal]);
        if (isLogX && xDomain[0] <= 0) {
            const pos = cells.map(function (c) { return c._stats.mean; }).filter(function (v) { return v > 0; });
            xDomain[0] = (pos.length ? Math.min.apply(null, pos) : 1) * 0.5;
        }

        const xScaleRaw = isLogX
            ? d3.scaleLog().base(logBaseX).domain(xDomain).range([plotX, plotX + plotW])
            : d3.scaleLinear().domain(xDomain).range([plotX, plotX + plotW]).nice();
        const xScale = isLogX ? xScaleRaw : PlotAxis.applyBreak(xScaleRaw, axisCfg.x);
        const xBreakPos = isLogX ? NaN : PlotAxis.getBreakPosition(xScale, axisCfg.x);

        const yOuter = d3.scaleBand().domain(catOrder).range([plotY, plotY + plotH])
            .paddingOuter(0.4).paddingInner(0.4);

        let xAxisY = plotY + plotH;
        if (axisCfg.x.crossMode === 'max') xAxisY = plotY;
        else if (axisCfg.x.crossMode === 'zero') xAxisY = isLogX ? (plotY + plotH) : xScale(0);

        let yAxisX = plotX;
        if (axisCfg.y.crossMode === 'max') yAxisX = plotX + plotW;

        const colorKeys = catOrder;
        const baseColors = app.resolvePaletteColors(colorKeys.length);
        const colorOf = function (k) {
            if (!k) return '#cccccc';
            const idx = colorKeys.indexOf(k);
            return s.customColors[k] || baseColors[idx] || '#cccccc';
        };

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        if (axisCfg.x.gridShow) {
            const gridX = svg.append('g').attr('class', 'grid grid-x');
            (xScale.ticks ? xScale.ticks() : xScale.domain()).forEach(function (t) {
                if (!isLogX && axisCfg.x.breakEnable && t > axisCfg.x.breakFrom && t < axisCfg.x.breakTo) return;
                const x = Math.round(xScale(t)) + 0.5;
                if (!isFinite(x)) return;
                gridX.append('line').attr('x1', x).attr('x2', x)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', axisCfg.x.gridColor)
                    .attr('stroke-dasharray', axisCfg.x.gridDash)
                    .attr('stroke-width', 1);
            });
        }
        if (axisCfg.y.gridShow) {
            const gridY = svg.append('g').attr('class', 'grid grid-y');
            catOrder.forEach(function (cv) {
                const cy = Math.round(yOuter(cv) + yOuter.bandwidth() / 2) + 0.5;
                gridY.append('line')
                    .attr('x1', plotX).attr('x2', plotX + plotW)
                    .attr('y1', cy).attr('y2', cy)
                    .attr('stroke', axisCfg.y.gridColor)
                    .attr('stroke-dasharray', axisCfg.y.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        const errG = svg.append('g').attr('class', 'error-bars');
        const dotG = svg.append('g').attr('class', 'dots');

        cells.forEach(function (cell) {
            const yPos = yOuter(cell.cat);
            const cy = yPos + yOuter.bandwidth() / 2;
            const dotColor = colorOf(cell.cat);
            const st = cell._stats;

            if (eb.mode !== 'none' && st.n >= 2) {
                const xHi = (isLogX && st.upper <= 0) ? xScale(st.mean) : xScale(st.upper);
                const xLo = (isLogX && st.lower <= 0) ? xScale(st.mean) : xScale(st.lower);
                if (isFinite(xHi) && isFinite(xLo)) {
                    BarCommon.drawErrorBar(errG, {
                        xPx: 0,
                        yPx: cy,
                        barThickness: yOuter.bandwidth() * 0.6,
                        loPx: Math.min(xLo, xHi),
                        hiPx: Math.max(xLo, xHi),
                        valuePx: xScale(st.mean),
                        isHorizontal: true,
                        errColor: (PEB && PEB.resolveErrorColor)
                            ? PEB.resolveErrorColor(eb, dotColor)
                            : (eb.errColor || '#333'),
                        errWidth: eb.errWidth,
                        capWidth: eb.capWidth,
                        capMode: eb.showWhich
                    });
                }
            }

            const xMean = (isLogX && st.mean <= 0) ? yAxisX : xScale(st.mean);
            if (!isFinite(xMean)) return;

            drawDot(dotG, {
                x: xMean, y: cy,
                shapeId: p.dotShape,
                dotSize: p.dotSize,
                dotColor: dotColor,
                strokeColor: resolveStrokeColor(p, dotColor),
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

        const xAxisFn = d3.axisBottom(xScale);
        const xTicks = PlotAxis.resolveTicks(axisCfg.x, xScale);
        let xTV = xTicks;
        if (!xTV) {
            xTV = xScale.ticks ? xScale.ticks() : null;
            if (!isLogX && axisCfg.x.breakEnable && xTV) {
                xTV = xTV.filter(function (t) {
                    return !(t > axisCfg.x.breakFrom && t < axisCfg.x.breakTo);
                });
            }
        }
        if (xTV && xTV.length) xAxisFn.tickValues(xTV);
        const xAxisG = svg.append('g').attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + xAxisY + ')')
            .call(xAxisFn);
        xAxisG.selectAll('.tick').attr('transform', d => {
            const x = Math.round(xScale(d)) + 0.5;
            return `translate(${x},0)`;
        });
        PlotAxis.applyAxis(xAxisG, axisCfg.x, 'bottom', xBreakPos);

        const yAxisFn = d3.axisLeft(yOuter);
        const yAxisG = svg.append('g').attr('class', 'y-axis')
            .attr('transform', 'translate(' + yAxisX + ',0)')
            .call(yAxisFn);
        yAxisG.selectAll('.tick').attr('transform', d => {
            const cy = Math.round(yOuter(d) + yOuter.bandwidth() / 2) + 0.5;
            return `translate(0,${cy})`;
        });
        PlotAxis.applyAxis(yAxisG, axisCfg.y, 'left');

        BarCommon.drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad);

        PlotAxis.drawFrameAndRefLines(svg, {
            plotX, plotY, plotW, plotH,
            xScale: xScale,
            yScale: yOuter,
            axisCfg: axisCfg
        });

        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function refreshErrBarPanel(app) {
        const container = app.$('errorBarPanelContainer');
        if (!container) return;
        if (PT && PT.renderErrBarPanel) {
            PT.renderErrBarPanel(container, {
                state: app.state.errBar,
                onChange: function () {
                    if (app.state.currentSvg) app.drawChart();
                }
            });
        }
    }

    function refreshCategoryColors(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const s = app.state;
        if (!s.data.length || !s.roles.x) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const seen = new Set();
        const cats = [];
        s.data.forEach(function (row) {
            const v = row[s.roles.x];
            if (v === undefined || v === null || v === '') return;
            const t = String(v);
            if (!seen.has(t)) { seen.add(t); cats.push(t); }
        });
        if (!cats.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const baseColors = app.resolvePaletteColors(cats.length);
        PlotCommon.renderColorAssignment(container, {
            items: cats.map(function (k, i) {
                return { name: k, color: s.customColors[k] || baseColors[i] };
            }),
            onChange: function (idx, c) {
                s.customColors[cats[idx]] = c;
                if (s.currentSvg) app.drawChart();
            },
            onResetAll: function () {
                s.customColors = {};
                refreshCategoryColors(app);
                if (s.currentSvg) app.drawChart();
            }
        });
    }

    PlotApp.create({
        exportName: 'scatter_errorbar_chart',
        exampleData: EX_DATA,
        importInfo: T.importInfo,

        stateExtra: (function () {
            const base = BarCommon.createStateExtra();
            base.roles = { x: '', y: '' };
            base.errBar = (PT && PT.defaultErrBarSettings)
                ? PT.defaultErrBarSettings()
                : { mode: 'computed', errType: 'sd', showWhich: 'both',
                    colorMode: 'uniform', errColor: '#333333', errWidth: 1.5, capWidth: 8 };
            return base;
        })(),

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = '';
            }
        },

        setup: function (app) {
            fillShapeSelect();
            fillRoleSelects(app);
            syncSortAlphaLabel(app);
            BarCommon.refreshAxisPanel(app);
            refreshErrBarPanel(app);
            refreshCategoryColors(app);

            const xSel = app.$('xColSel');
            if (xSel) {
                xSel.addEventListener('change', function () {
                    app.state.roles.x = xSel.value;
                    app.state.customColors = {};
                    syncSortAlphaLabel(app);
                    refreshCategoryColors(app);
                    if (app.state.currentSvg) app.drawChart();
                });
            }
            const ySel = app.$('yColSel');
            if (ySel) {
                ySel.addEventListener('change', function () {
                    app.state.roles.y = ySel.value;
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const strokeModeSel = app.$('dotStrokeMode');
            if (strokeModeSel) {
                strokeModeSel.addEventListener('change', updateStrokeVisibility);
            }
            updateStrokeVisibility();

            ['sortByMode', 'sortDir'].forEach(function (id) {
                const el = app.$(id);
                if (el) el.addEventListener('change', function () {
                    if (app.state.currentSvg) app.drawChart();
                });
            });
            const catOrderEl = app.$('catOrder');
            if (catOrderEl) {
                catOrderEl.addEventListener('input', function () {
                    if (app.state.currentSvg) app.drawChart();
                });
            }
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = res.columnTypes || {};
            const cats = res.headers.filter(function (h) {
                return s.columnTypes[h] === 'categorical' || s.columnTypes[h] === 'date';
            });
            const nums = res.headers.filter(function (h) { return s.columnTypes[h] === 'numeric'; });
            s.roles.x = cats[0] || res.headers[0];
            s.roles.y = nums[0] || res.headers[1] || res.headers[0];
            s.customColors = {};
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;

            BarCommon.syncAxisTitlesByDirection(app);
            fillRoleSelects(app);
            syncSortAlphaLabel(app);

            const catOrderEl = app.$('catOrder');
            if (catOrderEl) catOrderEl.value = '';

            BarCommon.refreshAxisPanel(app);
            refreshErrBarPanel(app);
            refreshCategoryColors(app);
        },

        onReset: function (app) {
            const s = app.state;
            s.columnTypes = {};
            s.roles = { x: '', y: '' };
            s.customColors = {};
            s.axis = PlotAxis.defaultState();
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            s.errBar = (PT && PT.defaultErrBarSettings)
                ? PT.defaultErrBarSettings()
                : { mode: 'computed', errType: 'sd', showWhich: 'both',
                    colorMode: 'uniform', errColor: '#333333', errWidth: 1.5, capWidth: 8 };

            const catOrderEl = app.$('catOrder');
            if (catOrderEl) catOrderEl.value = '';
            const sortByEl = app.$('sortByMode');
            if (sortByEl) sortByEl.value = '__input__';
            const sortDirEl = app.$('sortDir');
            if (sortDirEl) sortDirEl.value = 'desc';

            fillRoleSelects(app);
            syncSortAlphaLabel(app);
            BarCommon.refreshAxisPanel(app);
            refreshErrBarPanel(app);
            refreshCategoryColors(app);
            updateStrokeVisibility();
        },

        onStateRestored: function (app) {
            fillRoleSelects(app);
            syncSortAlphaLabel(app);
            BarCommon.refreshAxisPanel(app);
            refreshErrBarPanel(app);
            refreshCategoryColors(app);
            updateStrokeVisibility();
        },

        refreshColors: function (app) {
            refreshCategoryColors(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
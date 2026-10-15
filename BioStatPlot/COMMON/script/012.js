(function () {
    'use strict';

    const PC = window.PlotCommon;
    const PT = window.PlotTest;
    const BX = window.BoxCommon;

    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Headers required. <strong>Category (X-axis)</strong> and <strong>Value</strong> are mandatory; <strong>Group</strong> and <strong>Replicate</strong> are optional.'
            : '需包含表头。<strong>分类列（X轴）</strong> 和 <strong>数值列</strong> 必填；<strong>分组列（组内）</strong> 和 <strong>重复标记列</strong> 可选。',
        noData: EN ? '❌ Import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Select Category (X-axis) and Value' : '❌ 请选择分类列（X轴）与数值列',
        noValid: EN ? '❌ No valid data' : '❌ 未能生成有效数据',
        colorEmpty: EN ? 'Category colors will be shown here after selecting data columns' : '选择数据列后将在此处显示每个类别的颜色',
        noGroup: EN ? 'None' : '无',
        noDataPlaceholder: EN ? '— Please import data first —' : '— 请先导入数据 —'
    };

    const EX =
        'Category\tGroup\tRep\tValue\n' +
        'A\tCtrl\t1\t11.0\nA\tCtrl\t2\t15.0\nA\tCtrl\t3\t16.5\nA\tCtrl\t4\t17.8\nA\tCtrl\t5\t18.2\nA\tCtrl\t6\t18.5\nA\tCtrl\t7\t19.0\nA\tCtrl\t8\t19.5\nA\tCtrl\t9\t20.5\nA\tCtrl\t10\t21.5\n' +
        'A\tTrt1\t1\t20.0\nA\tTrt1\t2\t21.5\nA\tTrt1\t3\t22.5\nA\tTrt1\t4\t23.5\nA\tTrt1\t5\t24.0\nA\tTrt1\t6\t24.5\nA\tTrt1\t7\t25.0\nA\tTrt1\t8\t26.5\nA\tTrt1\t9\t27.0\nA\tTrt1\t10\t34.0\n' +
        'B\tCtrl\t1\t15.0\nB\tCtrl\t2\t21.0\nB\tCtrl\t3\t22.0\nB\tCtrl\t4\t22.5\nB\tCtrl\t5\t23.0\nB\tCtrl\t6\t23.5\nB\tCtrl\t7\t24.0\nB\tCtrl\t8\t25.0\nB\tCtrl\t9\t26.0\nB\tCtrl\t10\t27.0\n' +
        'B\tTrt1\t1\t27.0\nB\tTrt1\t2\t28.5\nB\tTrt1\t3\t29.5\nB\tTrt1\t4\t30.5\nB\tTrt1\t5\t31.0\nB\tTrt1\t6\t32.0\nB\tTrt1\t7\t33.0\nB\tTrt1\t8\t34.5\nB\tTrt1\t9\t35.5\nB\tTrt1\t10\t40.0\n' +
        'C\tCtrl\t1\t7.0\nC\tCtrl\t2\t12.5\nC\tCtrl\t3\t13.5\nC\tCtrl\t4\t14.5\nC\tCtrl\t5\t15.5\nC\tCtrl\t6\t16.0\nC\tCtrl\t7\t16.5\nC\tCtrl\t8\t17.0\nC\tCtrl\t9\t17.5\nC\tCtrl\t10\t18.5\n' +
        'C\tTrt1\t1\t17.0\nC\tTrt1\t2\t18.0\nC\tTrt1\t3\t19.0\nC\tTrt1\t4\t19.5\nC\tTrt1\t5\t20.0\nC\tTrt1\t6\t21.0\nC\tTrt1\t7\t22.0\nC\tTrt1\t8\t23.0\nC\tTrt1\t9\t24.0\nC\tTrt1\t10\t31.0';

    const OUTER_GAP = 0.3;
    const INNER_GAP = 0.15;

    function readParams(app) {
        const p = Object.assign({},
            PC.readCanvasParams(app, 760, 600),
            PC.readTitleLegendParams(app)
        );
        p.direction = app.state.barDirection || 'vertical';
        p.box = (BX && BX.readBoxSettings)
            ? BX.readBoxSettings(app.$('boxPanelContainer'))
            : BX.defaultBoxSettings();
        p.test = (PT && PT.readSettings)
            ? PT.readSettings(app.$('testPanelContainer'))
            : { enabled: false };
        return p;
    }

    function fillRoleSelects(app) {
        const s = app.state;
        const xSel = app.$('xColSel');
        const gSel = app.$('groupColSel');
        const ySel = app.$('yColSel');
        if (!xSel || !gSel || !ySel) return;

        if (!s.headers.length) {
            xSel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            gSel.innerHTML = '<option value="">' + T.noGroup + '</option>';
            ySel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            xSel.disabled = gSel.disabled = ySel.disabled = true;
            return;
        }
        xSel.disabled = gSel.disabled = ySel.disabled = false;

        const buildOpts = function (cur, allowEmpty) {
            let html = allowEmpty
                ? '<option value="">' + T.noGroup + '</option>'
                : '';
            html += s.headers.map(function (h) {
                return '<option value="' + PlotCommon.escapeHtml(h) + '"' +
                    (h === cur ? ' selected' : '') + '>' +
                    PlotCommon.escapeHtml(h) + '</option>';
            }).join('');
            return html;
        };

        xSel.innerHTML = buildOpts(s.roles.x || '', false);
        gSel.innerHTML = buildOpts(s.roles.group || '', true);
        ySel.innerHTML = buildOpts(s.roles.y || '', false);
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

        const prepared = PT.prepareCells(app);
        if (!prepared.cells.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        if (p.direction === 'horizontal') {
            drawHorizontal(app, p, axisCfg, prepared);
        } else {
            drawVertical(app, p, axisCfg, prepared);
        }

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    function drawVertical(app, p, axisCfg, prepared) {
        const s = app.state;
        const cells = prepared.cells;
        const hasGroup = prepared.hasGroup;
        const catOrder = prepared.catOrder;
        const grpOrder = prepared.grpOrder;
        const bx = p.box;
        const ts = p.test;

        cells.forEach(function (c) {
            c._boxStats = BX.computeBoxStats(c.values);
        });

        let maxVal = -Infinity, minVal = Infinity;
        cells.forEach(function (c) {
            c.values.forEach(function (v) {
                if (v > maxVal) maxVal = v;
                if (v < minVal) minVal = v;
            });
        });
        if (!isFinite(maxVal)) maxVal = 1;
        if (!isFinite(minVal)) minVal = 0;

        const isLogY = axisCfg.y.scaleType === 'log';
        const logBaseY = (axisCfg.y.logBase > 0) ? axisCfg.y.logBase : 10;

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

        let sigResults = null;
        if (ts.enabled && PT && PT.computeSignificance) {
            sigResults = PT.computeSignificance(cells, ts, hasGroup);
        }
        if (sigResults && sigResults.length && PT.computeAxisHeadroom) {
            const idx = new Map();
            cells.forEach(function (c, i) { idx.set(c, i); });
            const head = PT.computeAxisHeadroom(sigResults, function (c) { return idx.get(c); }, ts, {
                plotPx: plotH,
                dataRange: maxVal - Math.min(0, minVal)
            });
            maxVal += head.extraValue;
        }

        const yDomain = PlotAxis.resolveDomain(axisCfg.y, [Math.min(0, minVal), maxVal]);
        if (isLogY && yDomain[0] <= 0) {
            const pos = cells.map(function (c) { return c._boxStats.median; }).filter(function (v) { return v > 0; });
            yDomain[0] = (pos.length ? Math.min.apply(null, pos) : 1) * 0.5;
        }

        const yScaleRaw = isLogY
            ? d3.scaleLog().base(logBaseY).domain(yDomain).range([plotY + plotH, plotY])
            : d3.scaleLinear().domain(yDomain).range([plotY + plotH, plotY]).nice();
        const yScale = isLogY ? yScaleRaw : PlotAxis.applyBreak(yScaleRaw, axisCfg.y);
        const yBreakPos = isLogY ? NaN : PlotAxis.getBreakPosition(yScale, axisCfg.y);

        const xOuter = d3.scaleBand().domain(catOrder).range([plotX, plotX + plotW])
            .paddingOuter(OUTER_GAP).paddingInner(OUTER_GAP);
        const xInner = hasGroup
            ? d3.scaleBand().domain(grpOrder).range([0, xOuter.bandwidth()]).paddingInner(INNER_GAP)
            : null;

        let xAxisY = plotY + plotH;
        if (axisCfg.x.crossMode === 'max') xAxisY = plotY;
        else if (axisCfg.x.crossMode === 'zero') xAxisY = isLogY ? (plotY + plotH) : yScale(0);

        const colorKeys = hasGroup ? grpOrder : catOrder;
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
                const y = yScale(t);
                if (!isFinite(y)) return;
                gridY.append('line').attr('x1', plotX).attr('x2', plotX + plotW)
                    .attr('y1', y).attr('y2', y)
                    .attr('stroke', axisCfg.y.gridColor)
                    .attr('stroke-dasharray', axisCfg.y.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        const boxesG = svg.append('g').attr('class', 'boxes');
        const pos = new Map();

        cells.forEach(function (cell, cellIdx) {
            const xPos = xOuter(cell.x);
            const fullBandW = hasGroup ? xInner.bandwidth() : xOuter.bandwidth();
            const originX = hasGroup ? xPos + xInner(cell.g) : xPos;
            const boxW = fullBandW * bx.boxWidthScale;
            const cx = originX + fullBandW / 2;
            const color = colorOf(hasGroup ? cell.g : cell.x);

            BX.drawBox(boxesG, {
                cx: cx,
                boxW: boxW,
                stats: cell._boxStats,
                yScale: yScale,
                color: color,
                settings: bx,
                seed: cellIdx * 97.3 + 1
            });

            const s2 = cell._boxStats;
            pos.set(cell, {
                x: cx,
                yTop: yScale(s2.whiskerHi)
            });
        });

        if (sigResults && sigResults.length) {
            PT.drawSignificance(svg, {
                results: sigResults,
                getBarXY: function (c) {
                    const P = pos.get(c);
                    return P ? { x: P.x, y: P.yTop } : null;
                },
                orientation: 'vertical',
                settings: ts
            });
        }

        const xAxisFn = d3.axisBottom(xOuter);
        const xTicks = PlotAxis.resolveTicks(axisCfg.x, xOuter);
        if (xTicks && xTicks.length) xAxisFn.tickValues(xTicks);
        PlotAxis.applyAxis(
            svg.append('g').attr('class', 'x-axis').attr('transform', 'translate(0,' + xAxisY + ')').call(xAxisFn),
            axisCfg.x, 'bottom'
        );

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
        PlotAxis.applyAxis(
            svg.append('g').attr('class', 'y-axis').attr('transform', 'translate(' + plotX + ',0)').call(yAxisFn),
            axisCfg.y, 'left', yBreakPos
        );

        BarCommon.drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad);

        if (p.showLegend && hasGroup && grpOrder.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: grpOrder.map(function (g) { return { name: g, percent: null }; }),
                colors: grpOrder.map(function (g) { return colorOf(g); }),
                shape: 'box',
                labelFormatter: function (it) { return it.name; }
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function drawHorizontal(app, p, axisCfg, prepared) {
        const s = app.state;
        const cells = prepared.cells;
        const hasGroup = prepared.hasGroup;
        const catOrder = prepared.catOrder;
        const grpOrder = prepared.grpOrder;
        const bx = p.box;
        const ts = p.test;

        cells.forEach(function (c) {
            c._boxStats = BX.computeBoxStats(c.values);
        });

        let maxVal = -Infinity, minVal = Infinity;
        cells.forEach(function (c) {
            c.values.forEach(function (v) {
                if (v > maxVal) maxVal = v;
                if (v < minVal) minVal = v;
            });
        });
        if (!isFinite(maxVal)) maxVal = 1;
        if (!isFinite(minVal)) minVal = 0;

        const isLogX = axisCfg.x.scaleType === 'log';
        const logBaseX = (axisCfg.x.logBase > 0) ? axisCfg.x.logBase : 10;

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

        let sigResults = null;
        if (ts.enabled && PT && PT.computeSignificance) {
            sigResults = PT.computeSignificance(cells, ts, hasGroup);
        }
        if (sigResults && sigResults.length && PT.computeAxisHeadroom) {
            const idx = new Map();
            cells.forEach(function (c, i) { idx.set(c, i); });
            const head = PT.computeAxisHeadroom(sigResults, function (c) { return idx.get(c); }, ts, {
                plotPx: plotW,
                dataRange: maxVal - Math.min(0, minVal)
            });
            maxVal += head.extraValue;
        }

        const xDomain = PlotAxis.resolveDomain(axisCfg.x, [Math.min(0, minVal), maxVal]);
        if (isLogX && xDomain[0] <= 0) {
            const pos = cells.map(function (c) { return c._boxStats.median; }).filter(function (v) { return v > 0; });
            xDomain[0] = (pos.length ? Math.min.apply(null, pos) : 1) * 0.5;
        }

        const xScaleRaw = isLogX
            ? d3.scaleLog().base(logBaseX).domain(xDomain).range([plotX, plotX + plotW])
            : d3.scaleLinear().domain(xDomain).range([plotX, plotX + plotW]).nice();
        const xScale = isLogX ? xScaleRaw : PlotAxis.applyBreak(xScaleRaw, axisCfg.x);
        const xBreakPos = isLogX ? NaN : PlotAxis.getBreakPosition(xScale, axisCfg.x);

        const yOuter = d3.scaleBand().domain(catOrder).range([plotY, plotY + plotH])
            .paddingOuter(OUTER_GAP).paddingInner(OUTER_GAP);
        const yInner = hasGroup
            ? d3.scaleBand().domain(grpOrder).range([0, yOuter.bandwidth()]).paddingInner(INNER_GAP)
            : null;

        let xAxisY = plotY + plotH;
        if (axisCfg.x.crossMode === 'max') xAxisY = plotY;
        else if (axisCfg.x.crossMode === 'zero') xAxisY = isLogX ? (plotY + plotH) : xScale(0);

        let yAxisX = plotX;
        if (axisCfg.y.crossMode === 'max') yAxisX = plotX + plotW;

        const colorKeys = hasGroup ? grpOrder : catOrder;
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
                const x = xScale(t);
                if (!isFinite(x)) return;
                gridX.append('line').attr('x1', x).attr('x2', x)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', axisCfg.x.gridColor)
                    .attr('stroke-dasharray', axisCfg.x.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        const boxesG = svg.append('g').attr('class', 'boxes');
        const pos = new Map();

        cells.forEach(function (cell, cellIdx) {
            const yPos = yOuter(cell.x);
            const fullBandH = hasGroup ? yInner.bandwidth() : yOuter.bandwidth();
            const originY = hasGroup ? yPos + yInner(cell.g) : yPos;
            const boxH = fullBandH * bx.boxWidthScale;
            const cy = originY + fullBandH / 2;
            const color = colorOf(hasGroup ? cell.g : cell.x);

            BX.drawBoxHorizontal(boxesG, {
                cy: cy,
                boxH: boxH,
                stats: cell._boxStats,
                xScale: xScale,
                color: color,
                settings: bx,
                seed: cellIdx * 97.3 + 1
            });

            const s2 = cell._boxStats;
            pos.set(cell, {
                x: xScale(s2.whiskerHi),
                y: cy
            });
        });

        if (sigResults && sigResults.length) {
            PT.drawSignificance(svg, {
                results: sigResults,
                getBarXY: function (c) {
                    const P = pos.get(c);
                    return P ? { x: P.x, y: P.y } : null;
                },
                orientation: 'horizontal',
                settings: ts
            });
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
        PlotAxis.applyAxis(
            svg.append('g').attr('class', 'x-axis').attr('transform', 'translate(0,' + xAxisY + ')').call(xAxisFn),
            axisCfg.x, 'bottom', xBreakPos
        );

        PlotAxis.applyAxis(
            svg.append('g').attr('class', 'y-axis').attr('transform', 'translate(' + yAxisX + ',0)').call(d3.axisLeft(yOuter)),
            axisCfg.y, 'left'
        );

        BarCommon.drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad);

        if (p.showLegend && hasGroup && grpOrder.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: grpOrder.map(function (g) { return { name: g, percent: null }; }),
                colors: grpOrder.map(function (g) { return colorOf(g); }),
                shape: 'box',
                labelFormatter: function (it) { return it.name; }
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function refreshBoxPanel(app) {
        const container = app.$('boxPanelContainer');
        if (!container) return;
        if (BX && BX.renderBoxPanel) {
            BX.renderBoxPanel(container, {
                state: app.state.box,
                onChange: function () {
                    if (app.state.currentSvg) app.drawChart();
                }
            });
        }
    }

    function refreshTestPanel(app) {
        const container = app.$('testPanelContainer');
        if (!container) return;
        if (PT && PT.renderTestPanel) {
            PT.renderTestPanel(container, {
                app: app,
                state: app.state.test,
                controlValues: PT.getControlCandidates(app),
                onChange: function () {
                    if (app.state.currentSvg) app.drawChart();
                }
            });
        }
    }

    PlotApp.create({
        exportName: 'significance_box_chart',
        exampleData: EX,
        importInfo: T.importInfo,

        stateExtra: (function () {
            const base = BarCommon.createStateExtra();
            base.roles = { x: '', group: '', y: '', rep: '' };
            base.test = (PT && PT.defaultSettings) ? PT.defaultSettings() : { enabled: false };
            base.box = (BX && BX.defaultBoxSettings) ? BX.defaultBoxSettings() : {};
            return base;
        })(),

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (app.state.legendTitleEdited) return;
            if (input) input.value = app.state.roles.group || app.state.roles.x || '';
        },

        setup: function (app) {
            fillRoleSelects(app);
            PT.fillRepSelect(app);

            const catOrderEl = app.$('catOrder');
            if (catOrderEl) {
                catOrderEl.addEventListener('input', function () {
                    if (app.state.currentSvg) app.drawChart();
                });
            }
            const grpOrderEl = app.$('groupOrder');
            if (grpOrderEl) {
                grpOrderEl.addEventListener('input', function () {
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const xSel = app.$('xColSel');
            if (xSel) {
                xSel.addEventListener('change', function () {
                    app.state.roles.x = xSel.value;
                    app.state.customColors = {};
                    app.syncLegendTitle();
                    refreshTestPanel(app);
                    if (app.state.currentSvg) app.drawChart();
                    app.refreshColors(app);
                });
            }
            const gSel = app.$('groupColSel');
            if (gSel) {
                gSel.addEventListener('change', function () {
                    app.state.roles.group = gSel.value;
                    app.state.customColors = {};
                    app.syncLegendTitle();
                    refreshTestPanel(app);
                    if (app.state.currentSvg) app.drawChart();
                    app.refreshColors(app);
                });
            }
            const ySel = app.$('yColSel');
            if (ySel) {
                ySel.addEventListener('change', function () {
                    app.state.roles.y = ySel.value;
                    app.state.customColors = {};
                    refreshTestPanel(app);
                    if (app.state.currentSvg) app.drawChart();
                    app.refreshColors(app);
                });
            }

            const repSel = app.$('repColSel');
            if (repSel) {
                repSel.addEventListener('change', function () {
                    app.state.roles.rep = repSel.value;
                    refreshTestPanel(app);
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            BarCommon.refreshAxisPanel(app);
            refreshBoxPanel(app);
            refreshTestPanel(app);
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = res.columnTypes || {};
            const cats = res.headers.filter(function (h) {
                return s.columnTypes[h] === 'categorical' || s.columnTypes[h] === 'date';
            });
            const nums = res.headers.filter(function (h) { return s.columnTypes[h] === 'numeric'; });
            s.roles.x = cats[0] || res.headers[0];
            s.roles.group = cats[1] || '';
            s.roles.y = res.headers[res.headers.length - 1] || nums[0] || res.headers[0];
            s.roles.rep = '';
            s.customColors = {};
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;

            app.syncLegendTitle();
            BarCommon.syncAxisTitlesByDirection(app);
            fillRoleSelects(app);
            PT.fillRepSelect(app);

            const seenX = new Set(), catsOut = [];
            res.data.forEach(function (r) {
                const v = r[s.roles.x];
                if (v === undefined || v === null || v === '') return;
                const t = String(v);
                if (!seenX.has(t)) { seenX.add(t); catsOut.push(t); }
            });
            const catOrderEl = app.$('catOrder');
            if (catOrderEl) catOrderEl.value = catsOut.join(',');

            const grpOrderEl = app.$('groupOrder');
            if (grpOrderEl) {
                if (s.roles.group) {
                    const seenG = new Set(), grps = [];
                    res.data.forEach(function (r) {
                        const v = r[s.roles.group];
                        if (v === undefined || v === null || v === '') return;
                        const t = String(v);
                        if (!seenG.has(t)) { seenG.add(t); grps.push(t); }
                    });
                    grpOrderEl.value = grps.join(',');
                } else {
                    grpOrderEl.value = '';
                }
            }

            BarCommon.refreshAxisPanel(app);
            refreshBoxPanel(app);
            refreshTestPanel(app);
        },

        onReset: function (app) {
            const s = app.state;
            s.columnTypes = {};
            s.roles = { x: '', group: '', y: '', rep: '' };
            s.customColors = {};
            s.axis = PlotAxis.defaultState();
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            s.test = (PT && PT.defaultSettings) ? PT.defaultSettings() : { enabled: false };
            s.box = (BX && BX.defaultBoxSettings) ? BX.defaultBoxSettings() : {};

            const catOrderEl = app.$('catOrder');
            if (catOrderEl) catOrderEl.value = '';
            const grpOrderEl = app.$('groupOrder');
            if (grpOrderEl) grpOrderEl.value = '';

            fillRoleSelects(app);
            PT.fillRepSelect(app);
            BarCommon.refreshAxisPanel(app);
            refreshBoxPanel(app);
            refreshTestPanel(app);
        },

        onStateRestored: function (app) {
            fillRoleSelects(app);
            PT.fillRepSelect(app);
            BarCommon.refreshAxisPanel(app);
            refreshBoxPanel(app);
            refreshTestPanel(app);
        },

        refreshColors: function (app) {
            BarCommon.refreshGroupColors(app, T.colorEmpty);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
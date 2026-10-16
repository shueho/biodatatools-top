(function () {
    'use strict';

    const PC = window.PlotCommon;
    const PT = window.PlotTest;
    const BX = window.BoxCommon;

    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Headers required. <strong>Category (X-axis)</strong>, <strong>Group</strong> (exactly 2 unique values) and <strong>Value</strong> are mandatory.'
              + '<br>If your data is in <strong>wide format</strong>, please convert it first using the '
              + '<a href="../../en/022.Wide_long_table_reshaping.html" target="_blank" style="color:#1f4068;font-weight:600;">Wide-to-Long Table Converter</a>.'
            : '需包含表头。<strong>分类列（X轴）</strong>、<strong>分组列</strong>（必须恰好 2 个唯一值）和 <strong>数值列</strong> 必填。'
              + '<br>若您的数据为<strong>宽表</strong>形式，请先使用 '
              + '<a href="../../ch/022.Wide_long_table_reshaping.html" target="_blank" style="color:#1f4068;font-weight:600;">宽长表转换工具</a> 转换后再导入。',
        noData: EN ? '❌ Import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Select Category (X-axis), Group and Value' : '❌ 请选择分类列（X轴）、分组列与数值列',
        noValid: EN ? '❌ No valid data' : '❌ 未能生成有效数据',
        needGroup: EN ? '❌ Group column is required for split violin' : '❌ 分裂小提琴图必须选择分组列',
        needTwoGroups: EN
            ? '❌ Group column must have exactly 2 unique values (currently {n})'
            : '❌ 分组列必须恰好有 2 个唯一取值（当前为 {n} 个）',
        colorEmpty: EN ? 'Group colors will be shown here after selecting data columns' : '选择数据列后将在此处显示每个分组的颜色',
        noGroup: EN ? 'None' : '无',
        noDataPlaceholder: EN ? '— Please import data first —' : '— 请先导入数据 —'
    };

    const EX =
        'Category\tGroup\tRep\tValue\n' +
        'A\tCtrl\t1\t12.0\nA\tCtrl\t2\t14.5\nA\tCtrl\t3\t15.5\nA\tCtrl\t4\t16.5\nA\tCtrl\t5\t17.0\nA\tCtrl\t6\t17.5\nA\tCtrl\t7\t18.0\nA\tCtrl\t8\t18.5\nA\tCtrl\t9\t19.0\nA\tCtrl\t10\t19.5\nA\tCtrl\t11\t20.0\nA\tCtrl\t12\t21.0\nA\tCtrl\t13\t22.0\nA\tCtrl\t14\t23.0\nA\tCtrl\t15\t24.5\nA\tCtrl\t16\t26.0\nA\tCtrl\t17\t28.0\nA\tCtrl\t18\t30.0\n' +
        'A\tTrt\t1\t20.0\nA\tTrt\t2\t22.0\nA\tTrt\t3\t23.0\nA\tTrt\t4\t24.0\nA\tTrt\t5\t24.5\nA\tTrt\t6\t25.0\nA\tTrt\t7\t25.5\nA\tTrt\t8\t26.0\nA\tTrt\t9\t26.5\nA\tTrt\t10\t27.0\nA\tTrt\t11\t27.5\nA\tTrt\t12\t28.0\nA\tTrt\t13\t29.0\nA\tTrt\t14\t30.0\nA\tTrt\t15\t31.0\nA\tTrt\t16\t33.0\nA\tTrt\t17\t35.0\nA\tTrt\t18\t38.0\n' +
        'B\tCtrl\t1\t8.0\nB\tCtrl\t2\t10.0\nB\tCtrl\t3\t11.0\nB\tCtrl\t4\t12.0\nB\tCtrl\t5\t13.0\nB\tCtrl\t6\t13.5\nB\tCtrl\t7\t14.0\nB\tCtrl\t8\t14.5\nB\tCtrl\t9\t15.0\nB\tCtrl\t10\t15.5\nB\tCtrl\t11\t16.0\nB\tCtrl\t12\t17.0\nB\tCtrl\t13\t18.0\nB\tCtrl\t14\t19.0\nB\tCtrl\t15\t20.0\nB\tCtrl\t16\t22.0\nB\tCtrl\t17\t24.0\nB\tCtrl\t18\t28.0\n' +
        'B\tTrt\t1\t22.0\nB\tTrt\t2\t25.0\nB\tTrt\t3\t27.0\nB\tTrt\t4\t28.0\nB\tTrt\t5\t29.0\nB\tTrt\t6\t29.5\nB\tTrt\t7\t30.0\nB\tTrt\t8\t30.5\nB\tTrt\t9\t31.0\nB\tTrt\t10\t31.5\nB\tTrt\t11\t32.0\nB\tTrt\t12\t33.0\nB\tTrt\t13\t34.0\nB\tTrt\t14\t35.0\nB\tTrt\t15\t36.0\nB\tTrt\t16\t38.0\nB\tTrt\t17\t40.0\nB\tTrt\t18\t45.0\n' +
        'C\tCtrl\t1\t15.0\nC\tCtrl\t2\t16.5\nC\tCtrl\t3\t17.5\nC\tCtrl\t4\t18.0\nC\tCtrl\t5\t18.5\nC\tCtrl\t6\t19.0\nC\tCtrl\t7\t19.5\nC\tCtrl\t8\t20.0\nC\tCtrl\t9\t20.5\nC\tCtrl\t10\t21.0\nC\tCtrl\t11\t21.5\nC\tCtrl\t12\t22.0\nC\tCtrl\t13\t23.0\nC\tCtrl\t14\t24.0\nC\tCtrl\t15\t25.0\nC\tCtrl\t16\t27.0\nC\tCtrl\t17\t29.0\nC\tCtrl\t18\t32.0\n' +
        'C\tTrt\t1\t14.0\nC\tTrt\t2\t15.0\nC\tTrt\t3\t16.0\nC\tTrt\t4\t17.0\nC\tTrt\t5\t17.5\nC\tTrt\t6\t18.0\nC\tTrt\t7\t18.5\nC\tTrt\t8\t19.0\nC\tTrt\t9\t19.5\nC\tTrt\t10\t20.0\nC\tTrt\t11\t20.5\nC\tTrt\t12\t21.0\nC\tTrt\t13\t22.0\nC\tTrt\t14\t23.0\nC\tTrt\t15\t24.0\nC\tTrt\t16\t25.0\nC\tTrt\t17\t26.0\nC\tTrt\t18\t28.0';

    const OUTER_GAP = 0.3;

    function readParams(app) {
        const p = Object.assign({},
            PC.readCanvasParams(app, 760, 600),
            PC.readTitleLegendParams(app)
        );
        p.direction = app.state.barDirection || 'vertical';
        p.violin = (BX && BX.readViolinSettings)
            ? BX.readViolinSettings(app.$('violinPanelContainer'))
            : BX.defaultViolinSettings();
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
        if (!s.roles.group) {
            app.showTip('msgTip3', T.needGroup, 'error');
            return;
        }

        const p = readParams(app);
        const axisCfg = s.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        const prepared = PT.prepareCells(app);
        if (!prepared.cells.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }
        if (prepared.grpOrder.length !== 2) {
            app.showTip('msgTip3', T.needTwoGroups.replace('{n}', prepared.grpOrder.length), 'error');
            return;
        }

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
        const grpOrder = prepared.grpOrder;
        const v = p.violin;
        const ts = p.test;

        cells.forEach(function (c) {
            c._boxStats = BX.computeBoxStats(c.values);
            c._kde = BX.computeKDE(c.values, {
                bandwidthMode: v.violinBandwidthMode,
                bandwidth: v.violinBandwidth,
                trim: v.violinTrim
            });
        });

        let maxVal = -Infinity, minVal = Infinity;
        cells.forEach(function (c) {
            c.values.forEach(function (val) {
                if (val > maxVal) maxVal = val;
                if (val < minVal) minVal = val;
            });
            if (c._kde) {
                if (c._kde.lo < minVal) minVal = c._kde.lo;
                if (c._kde.hi > maxVal) maxVal = c._kde.hi;
            }
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
            sigResults = PT.computeSignificance(cells, ts, true);
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
            const pos = cells.map(function (c) { return c._boxStats.median; }).filter(function (val) { return val > 0; });
            yDomain[0] = (pos.length ? Math.min.apply(null, pos) : 1) * 0.5;
        }

        const yScaleRaw = isLogY
            ? d3.scaleLog().base(logBaseY).domain(yDomain).range([plotY + plotH, plotY])
            : d3.scaleLinear().domain(yDomain).range([plotY + plotH, plotY]).nice();
        const yScale = isLogY ? yScaleRaw : PlotAxis.applyBreak(yScaleRaw, axisCfg.y);
        const yBreakPos = isLogY ? NaN : PlotAxis.getBreakPosition(yScale, axisCfg.y);

        const xOuter = d3.scaleBand().domain(catOrder).range([plotX, plotX + plotW])
            .paddingOuter(OUTER_GAP).paddingInner(OUTER_GAP);

        let xAxisY = plotY + plotH;
        if (axisCfg.x.crossMode === 'max') xAxisY = plotY;
        else if (axisCfg.x.crossMode === 'zero') xAxisY = isLogY ? (plotY + plotH) : yScale(0);

        const baseColors = app.resolvePaletteColors(grpOrder.length);
        const colorOf = function (k) {
            if (!k) return '#cccccc';
            const idx = grpOrder.indexOf(k);
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

        const violinG = svg.append('g').attr('class', 'violins');
        const pos = new Map();

        const byCat = new Map();
        cells.forEach(function (c) {
            if (!byCat.has(c.x)) byCat.set(c.x, {});
            byCat.get(c.x)[c.g] = c;
        });

        const gL = grpOrder[0];
        const gR = grpOrder[1];
        const colorL = colorOf(gL);
        const colorR = colorOf(gR);

        let seedCounter = 0;
        catOrder.forEach(function (x) {
            const xPos = xOuter(x);
            const fullBandW = xOuter.bandwidth();
            const bandW = fullBandW * v.violinWidthScale;
            const cx = xPos + fullBandW / 2;
            const halfW = bandW / 2;

            const gMap = byCat.get(x) || {};
            const cL = gMap[gL];
            const cR = gMap[gR];

            if (cL && cL._kde) {
                BX.drawSplitViolin(violinG, {
                    cx: cx, halfW: halfW,
                    kde: cL._kde,
                    stats: cL._boxStats,
                    yScale: yScale,
                    color: colorL,
                    settings: v,
                    side: 'left',
                    seed: seedCounter * 97.3 + 1
                });
                seedCounter++;
            }

            if (cR && cR._kde) {
                BX.drawSplitViolin(violinG, {
                    cx: cx, halfW: halfW,
                    kde: cR._kde,
                    stats: cR._boxStats,
                    yScale: yScale,
                    color: colorR,
                    settings: v,
                    side: 'right',
                    seed: seedCounter * 97.3 + 1
                });
                seedCounter++;
            }

            let yTopPx = Infinity;
            [cL, cR].forEach(function (c) {
                if (!c || !c._boxStats) return;
                let t = yScale(c._boxStats.whiskerHi);
                if (c._kde && c._kde.xs.length) {
                    const kt = yScale(c._kde.xs[c._kde.xs.length - 1]);
                    if (kt < t) t = kt;
                }
                if (t < yTopPx) yTopPx = t;
            });
            if (!isFinite(yTopPx)) yTopPx = yScale(maxVal);

            if (cL) pos.set(cL, { x: cx, yTop: yTopPx });
            if (cR) pos.set(cR, { x: cx, yTop: yTopPx });
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

        if (p.showLegend && grpOrder.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: grpOrder.map(function (g) { return { name: g, percent: null }; }),
                colors: grpOrder.map(function (g) { return colorOf(g); }),
                shape: v.boxOverlay ? 'box' : 'rect',
                labelFormatter: function (it) { return it.name; }
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function drawHorizontal(app, p, axisCfg, prepared) {
        const s = app.state;
        const cells = prepared.cells;
        const catOrder = prepared.catOrder;
        const grpOrder = prepared.grpOrder;
        const v = p.violin;
        const ts = p.test;

        cells.forEach(function (c) {
            c._boxStats = BX.computeBoxStats(c.values);
            c._kde = BX.computeKDE(c.values, {
                bandwidthMode: v.violinBandwidthMode,
                bandwidth: v.violinBandwidth,
                trim: v.violinTrim
            });
        });

        let maxVal = -Infinity, minVal = Infinity;
        cells.forEach(function (c) {
            c.values.forEach(function (val) {
                if (val > maxVal) maxVal = val;
                if (val < minVal) minVal = val;
            });
            if (c._kde) {
                if (c._kde.lo < minVal) minVal = c._kde.lo;
                if (c._kde.hi > maxVal) maxVal = c._kde.hi;
            }
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
            sigResults = PT.computeSignificance(cells, ts, true);
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
            const pos = cells.map(function (c) { return c._boxStats.median; }).filter(function (val) { return val > 0; });
            xDomain[0] = (pos.length ? Math.min.apply(null, pos) : 1) * 0.5;
        }

        const xScaleRaw = isLogX
            ? d3.scaleLog().base(logBaseX).domain(xDomain).range([plotX, plotX + plotW])
            : d3.scaleLinear().domain(xDomain).range([plotX, plotX + plotW]).nice();
        const xScale = isLogX ? xScaleRaw : PlotAxis.applyBreak(xScaleRaw, axisCfg.x);
        const xBreakPos = isLogX ? NaN : PlotAxis.getBreakPosition(xScale, axisCfg.x);

        const yOuter = d3.scaleBand().domain(catOrder).range([plotY, plotY + plotH])
            .paddingOuter(OUTER_GAP).paddingInner(OUTER_GAP);

        let xAxisY = plotY + plotH;
        if (axisCfg.x.crossMode === 'max') xAxisY = plotY;
        else if (axisCfg.x.crossMode === 'zero') xAxisY = isLogX ? (plotY + plotH) : xScale(0);

        let yAxisX = plotX;
        if (axisCfg.y.crossMode === 'max') yAxisX = plotX + plotW;

        const baseColors = app.resolvePaletteColors(grpOrder.length);
        const colorOf = function (k) {
            if (!k) return '#cccccc';
            const idx = grpOrder.indexOf(k);
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

        const violinG = svg.append('g').attr('class', 'violins');
        const pos = new Map();

        const byCat = new Map();
        cells.forEach(function (c) {
            if (!byCat.has(c.x)) byCat.set(c.x, {});
            byCat.get(c.x)[c.g] = c;
        });

        const gL = grpOrder[0];
        const gR = grpOrder[1];
        const colorL = colorOf(gL);
        const colorR = colorOf(gR);

        let seedCounter = 0;
        catOrder.forEach(function (x) {
            const yPos = yOuter(x);
            const fullBandH = yOuter.bandwidth();
            const bandH = fullBandH * v.violinWidthScale;
            const cy = yPos + fullBandH / 2;
            const halfH = bandH / 2;

            const gMap = byCat.get(x) || {};
            const cL = gMap[gL];
            const cR = gMap[gR];

            if (cL && cL._kde) {
                BX.drawSplitViolinHorizontal(violinG, {
                    cy: cy, halfH: halfH,
                    kde: cL._kde,
                    stats: cL._boxStats,
                    xScale: xScale,
                    color: colorL,
                    settings: v,
                    side: 'left',
                    seed: seedCounter * 97.3 + 1
                });
                seedCounter++;
            }

            if (cR && cR._kde) {
                BX.drawSplitViolinHorizontal(violinG, {
                    cy: cy, halfH: halfH,
                    kde: cR._kde,
                    stats: cR._boxStats,
                    xScale: xScale,
                    color: colorR,
                    settings: v,
                    side: 'right',
                    seed: seedCounter * 97.3 + 1
                });
                seedCounter++;
            }

            let xRightPx = -Infinity;
            [cL, cR].forEach(function (c) {
                if (!c || !c._boxStats) return;
                let t = xScale(c._boxStats.whiskerHi);
                if (c._kde && c._kde.xs.length) {
                    const kt = xScale(c._kde.xs[c._kde.xs.length - 1]);
                    if (kt > t) t = kt;
                }
                if (t > xRightPx) xRightPx = t;
            });
            if (!isFinite(xRightPx)) xRightPx = xScale(maxVal);

            if (cL) pos.set(cL, { x: xRightPx, y: cy });
            if (cR) pos.set(cR, { x: xRightPx, y: cy });
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

        if (p.showLegend && grpOrder.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: grpOrder.map(function (g) { return { name: g, percent: null }; }),
                colors: grpOrder.map(function (g) { return colorOf(g); }),
                shape: v.boxOverlay ? 'box' : 'rect',
                labelFormatter: function (it) { return it.name; }
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function refreshViolinPanel(app) {
        const container = app.$('violinPanelContainer');
        if (!container) return;
        if (BX && BX.renderViolinPanel) {
            BX.renderViolinPanel(container, {
                state: app.state.violin,
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
        exportName: 'split_violin_chart',
        exampleData: EX,
        importInfo: T.importInfo,

        stateExtra: (function () {
            const base = BarCommon.createStateExtra();
            base.roles = { x: '', group: '', y: '', rep: '' };
            base.test = (PT && PT.defaultSettings) ? PT.defaultSettings() : { enabled: false };
            base.violin = (BX && BX.defaultViolinSettings) ? BX.defaultViolinSettings() : {};
            return base;
        })(),

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (app.state.legendTitleEdited) return;
            if (input) input.value = app.state.roles.group || '';
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
            refreshViolinPanel(app);
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
                const val = r[s.roles.x];
                if (val === undefined || val === null || val === '') return;
                const t = String(val);
                if (!seenX.has(t)) { seenX.add(t); catsOut.push(t); }
            });
            const catOrderEl = app.$('catOrder');
            if (catOrderEl) catOrderEl.value = catsOut.join(',');

            const grpOrderEl = app.$('groupOrder');
            if (grpOrderEl) {
                if (s.roles.group) {
                    const seenG = new Set(), grps = [];
                    res.data.forEach(function (r) {
                        const val = r[s.roles.group];
                        if (val === undefined || val === null || val === '') return;
                        const t = String(val);
                        if (!seenG.has(t)) { seenG.add(t); grps.push(t); }
                    });
                    grpOrderEl.value = grps.join(',');
                } else {
                    grpOrderEl.value = '';
                }
            }

            BarCommon.refreshAxisPanel(app);
            refreshViolinPanel(app);
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
            s.violin = (BX && BX.defaultViolinSettings) ? BX.defaultViolinSettings() : {};

            const catOrderEl = app.$('catOrder');
            if (catOrderEl) catOrderEl.value = '';
            const grpOrderEl = app.$('groupOrder');
            if (grpOrderEl) grpOrderEl.value = '';

            fillRoleSelects(app);
            PT.fillRepSelect(app);
            BarCommon.refreshAxisPanel(app);
            refreshViolinPanel(app);
            refreshTestPanel(app);
        },

        onStateRestored: function (app) {
            fillRoleSelects(app);
            PT.fillRepSelect(app);
            BarCommon.refreshAxisPanel(app);
            refreshViolinPanel(app);
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
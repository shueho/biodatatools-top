/* ============================================================
   BioDataTools 分面绘图公共模块
   ============================================================ */
(function (global) {
    'use strict';

    const PC = global.PlotCommon;

    function isEn() { return window.location.pathname.indexOf('/en/') >= 0; }

    const I18N = {
        zh: {
            panelTitle: '分面设置',
            layoutLabel: '分面方向',
            layoutVertical: '竖向（上下分面，图形竖放）',
            layoutHorizontal: '横向（左右分面，图形横放）',
            gapXLabel: '水平间距',
            gapYLabel: '垂直间距',
            stripLabel: '显示分面标题',
            stripFill: '标题填充',
            stripStroke: '标题轮廓',
            stripText: '标题文字',
            innerTicksLabel: '非边缘分面显示刻度'
        },
        en: {
            panelTitle: 'Facet Settings',
            layoutLabel: 'Facet direction',
            layoutVertical: 'Vertical (stacked, shapes upright)',
            layoutHorizontal: 'Horizontal (side-by-side, shapes rotated)',
            gapXLabel: 'Horizontal gap',
            gapYLabel: 'Vertical gap',
            stripLabel: 'Show facet title',
            stripFill: 'Title fill',
            stripStroke: 'Title border',
            stripText: 'Title text',
            innerTicksLabel: 'Show ticks on inner facets'
        }
    };
    function L() { return I18N[isEn() ? 'en' : 'zh']; }

    function defaultSettings() {
        return {
            layout: 'vertical',
            gapX: 20,
            gapY: 20,
            showStrip: true,
            stripFill: '#e5e5e5',
            stripStroke: '#cccccc',
            stripText: '#333333',
            showInnerTicks: false
        };
    }

    function renderFacetPanel(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;

        const T = L();
        const base = defaultSettings();
        const st = opts.state || base;
        Object.keys(base).forEach(function (k) {
            if (st[k] === undefined) st[k] = base[k];
        });

        container.className = 'param-panel';
        container._settings = st;

        container.innerHTML = `
            <div class="param-panel-title">${T.panelTitle}</div>
            <div class="param-grid cols-4">
                <div class="param-item">
                    <label>${T.layoutLabel}</label>
                    <select class="ft-layout">
                        <option value="vertical" ${st.layout === 'vertical' ? 'selected' : ''}>${T.layoutVertical}</option>
                        <option value="horizontal" ${st.layout === 'horizontal' ? 'selected' : ''}>${T.layoutHorizontal}</option>
                    </select>
                </div>
                <div class="param-item">
                    <label>${T.gapXLabel}</label>
                    <input type="number" class="ft-gap-x" value="${st.gapX}" min="0" max="200" step="1">
                </div>
                <div class="param-item">
                    <label>${T.gapYLabel}</label>
                    <input type="number" class="ft-gap-y" value="${st.gapY}" min="0" max="200" step="1">
                </div>
                <div class="param-item">
                    <label class="mini-check"><input type="checkbox" class="ft-strip" ${st.showStrip ? 'checked' : ''}>${T.stripLabel}</label>
                </div>
                <div class="param-item">
                    <label>${T.stripFill}</label>
                    <input type="color" class="ft-strip-fill" value="${st.stripFill}">
                </div>
                <div class="param-item">
                    <label>${T.stripStroke}</label>
                    <input type="color" class="ft-strip-stroke" value="${st.stripStroke}">
                </div>
                <div class="param-item">
                    <label>${T.stripText}</label>
                    <input type="color" class="ft-strip-text" value="${st.stripText}">
                </div>
                <div class="param-item">
                    <label class="mini-check"><input type="checkbox" class="ft-inner-ticks" ${st.showInnerTicks ? 'checked' : ''}>${T.innerTicksLabel}</label>
                </div>
            </div>
        `;

        const fire = function () { if (opts.onChange) opts.onChange(); };

        const layoutSel = container.querySelector('.ft-layout');
        if (layoutSel) layoutSel.addEventListener('change', function () {
            st.layout = this.value; fire();
        });
        const gapXEl = container.querySelector('.ft-gap-x');
        if (gapXEl) gapXEl.addEventListener('change', function () {
            const v = parseFloat(this.value);
            st.gapX = isFinite(v) && v >= 0 ? v : 20;
            fire();
        });
        const gapYEl = container.querySelector('.ft-gap-y');
        if (gapYEl) gapYEl.addEventListener('change', function () {
            const v = parseFloat(this.value);
            st.gapY = isFinite(v) && v >= 0 ? v : 20;
            fire();
        });
        const stripCb = container.querySelector('.ft-strip');
        if (stripCb) stripCb.addEventListener('change', function () {
            st.showStrip = this.checked; fire();
        });
        ['fill', 'stroke', 'text'].forEach(function (k) {
            const el = container.querySelector('.ft-strip-' + k);
            if (!el) return;
            el.addEventListener('input', function () {
                st['strip' + k.charAt(0).toUpperCase() + k.slice(1)] = this.value;
                fire();
            });
        });
        const innerCb = container.querySelector('.ft-inner-ticks');
        if (innerCb) innerCb.addEventListener('change', function () {
            st.showInnerTicks = this.checked; fire();
        });
    }

    function readSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return defaultSettings();
        const st = container._settings || defaultSettings();
        const qv = function (s) { const e = container.querySelector(s); return e ? e.value : undefined; };
        const qc = function (s) { const e = container.querySelector(s); return e ? e.checked : false; };
        const qn = function (s, fb) {
            const e = container.querySelector(s);
            if (!e) return fb;
            const v = parseFloat(e.value);
            return isFinite(v) ? v : fb;
        };
        st.layout = qv('.ft-layout') || 'vertical';
        st.gapX = Math.max(0, qn('.ft-gap-x', 20));
        st.gapY = Math.max(0, qn('.ft-gap-y', 20));
        st.showStrip = qc('.ft-strip');
        st.stripFill = qv('.ft-strip-fill') || '#e5e5e5';
        st.stripStroke = qv('.ft-strip-stroke') || '#cccccc';
        st.stripText = qv('.ft-strip-text') || '#333333';
        st.showInnerTicks = qc('.ft-inner-ticks');
        return st;
    }

    function prepareFacets(app, facetCol) {
        const PT = global.PlotTest;
        if (!facetCol || !PT || !PT.prepareCells) return null;
        const s = app.state;

        const facetOrderRaw = [];
        const facetRows = new Map();
        s.data.forEach(function (row) {
            const f = String(row[facetCol] == null ? '' : row[facetCol]);
            if (!facetRows.has(f)) {
                facetOrderRaw.push(f);
                facetRows.set(f, []);
            }
            facetRows.get(f).push(row);
        });

        const globalPrepared = PT.prepareCells(app);
        const globalCatOrder = globalPrepared.catOrder;
        const globalGrpOrder = globalPrepared.grpOrder;
        const globalHasGroup = globalPrepared.hasGroup;

        let facetOrder = facetOrderRaw;
        const el = app.$('facetOrder');
        const custom = el ? el.value.trim() : '';
        if (custom) {
            const wanted = custom.split(/[,，\s]+/).filter(Boolean);
            const set = new Set(facetOrderRaw);
            const out = [], used = new Set();
            wanted.forEach(function (w) { if (set.has(w) && !used.has(w)) { out.push(w); used.add(w); } });
            facetOrderRaw.forEach(function (f) { if (!used.has(f)) out.push(f); });
            facetOrder = out;
        }

        const originalData = s.data;
        const facets = [];
        facetOrder.forEach(function (f) {
            s.data = facetRows.get(f) || [];
            const prepared = PT.prepareCells(app, {
                catOrder: globalCatOrder.join(','),
                groupOrder: globalGrpOrder.join(',')
            });
            facets.push({ name: f, cells: prepared.cells });
        });
        s.data = originalData;

        return {
            facetOrder: facetOrder,
            catOrder: globalCatOrder,
            grpOrder: globalGrpOrder,
            hasGroup: globalHasGroup,
            facets: facets
        };
    }

    function drawFaceted(app, p, axisCfg, facetData, options) {
        options = options || {};
        const PT = global.PlotTest;
        const s = app.state;
        const facets = facetData.facets;
        const catOrder = facetData.catOrder;
        const grpOrder = facetData.grpOrder;
        const hasGroup = facetData.hasGroup;
        const fst = p.facet;
        const isViolin = options.isViolin === true;
        const bx = options.bx || {};
        const ts = p.test;
        const isV = (fst.layout !== 'horizontal');

        if (!catOrder.length) return;

        let gMax = -Infinity, gMin = Infinity;
        facets.forEach(function (f) {
            f.cells.forEach(function (c) {
                c.values.forEach(function (val) {
                    if (val > gMax) gMax = val;
                    if (val < gMin) gMin = val;
                });
                if (c._kde) {
                    if (c._kde.lo < gMin) gMin = c._kde.lo;
                    if (c._kde.hi > gMax) gMax = c._kde.hi;
                }
            });
        });
        if (!isFinite(gMax)) gMax = 1;
        if (!isFinite(gMin)) gMin = 0;

        const sigPerFacet = facets.map(function (f) {
            if (!ts || !ts.enabled || !PT || !PT.computeSignificance) return null;
            return PT.computeSignificance(f.cells, ts, hasGroup);
        });

        const n = facets.length;
        const cols = isV ? 1 : n;
        const rows = isV ? n : 1;

        const margin = 20;
        const outerX = margin, outerY = margin;
        const outerW = p.width - 2 * margin;
        const outerH = p.height - 2 * margin;

        const gapX = fst.gapX;
        const gapY = fst.gapY;
        const cellW = (outerW - gapX * (cols - 1)) / cols;
        const cellH = (outerH - gapY * (rows - 1)) / rows;

        const isLogVal = isV ? (axisCfg.y.scaleType === 'log') : (axisCfg.x.scaleType === 'log');
        const logBase = isV
            ? ((axisCfg.y.logBase > 0) ? axisCfg.y.logBase : 10)
            : ((axisCfg.x.logBase > 0) ? axisCfg.x.logBase : 10);

        const stripThick = fst.showStrip ? 22 : 0;
        const stripGap = fst.showStrip ? 4 : 0;

        const yTickFontV = axisCfg.y.tickValueShow ? axisCfg.y.tickFontSize : 0;
        const yTitleFontV = (axisCfg.y.titleShow && axisCfg.y.titleContent) ? axisCfg.y.titleFontSize + 8 : 0;
        const xTickFontH = axisCfg.x.tickValueShow ? axisCfg.x.tickFontSize : 0;
        const xTitleFontH = (axisCfg.x.titleShow && axisCfg.x.titleContent) ? axisCfg.x.titleFontSize + 8 : 0;

        // 竖向：所有分面用同一个左 padding
        const leftPadV = yTickFontV + 8 + yTitleFontV + 8;
        const bottomPadV = xTickFontH + 10 + xTitleFontH + 8;
        const topPadV = 6;
        const rightPadV = 4;

        // 横向：所有分面用同一个左 padding（含 Y 轴标签空间）
        let maxCatW = 0;
        catOrder.forEach(function (c) {
            maxCatW = Math.max(maxCatW, PC.estTextWidth(c, axisCfg.y.tickFontSize));
        });
        const leftPadH = Math.min(maxCatW + 10, cellW * 0.35) + yTitleFontV + 6;
        const bottomPadH = xTickFontH + 10 + xTitleFontH + 8;
        const topPadH = 6;
        const rightPadH = 8;

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        const colorKeys = hasGroup ? grpOrder : catOrder;
        const baseColors = app.resolvePaletteColors(colorKeys.length);
        const colorOf = function (k) {
            if (!k) return '#cccccc';
            const idx = colorKeys.indexOf(k);
            return s.customColors[k] || baseColors[idx] || '#cccccc';
        };

        const geom = [];
        facets.forEach(function (f, fi) {
            const col = isV ? 0 : fi;
            const row = isV ? fi : 0;
            const cx0 = outerX + col * (cellW + gapX);
            const cy0 = outerY + row * (cellH + gapY);

            let stripX, stripY, stripW, stripH;
            let plotX, plotY, plotW, plotH;

            if (isV) {
                stripW = stripThick;
                stripH = Math.max(1, cellH - topPadV - bottomPadV - 8);
                stripX = cx0 + cellW - rightPadV - stripW;
                stripY = cy0 + topPadV + 4;
                plotX = cx0 + leftPadV;
                plotY = cy0 + topPadV;
                plotW = Math.max(20, stripX - stripGap - plotX);
                plotH = Math.max(20, cellH - topPadV - bottomPadV);
            } else {
                stripX = cx0 + leftPadH;
                stripY = cy0 + topPadH;
                stripW = Math.max(20, cellW - leftPadH - rightPadH);
                stripH = stripThick;
                plotX = stripX;
                plotY = stripY + stripH + stripGap;
                plotW = stripW;
                plotH = Math.max(20, cellH - (plotY - cy0) - bottomPadH);
            }

            geom.push({
                fi: fi, f: f,
                col: col, row: row,
                stripX: stripX, stripY: stripY, stripW: stripW, stripH: stripH,
                plotX: plotX, plotY: plotY, plotW: plotW, plotH: plotH
            });
        });

        let headLevels = 0;
        if (ts && ts.enabled && PT && PT.computeAxisHeadroom) {
            geom.forEach(function (g) {
                const results = sigPerFacet[g.fi];
                if (!results || !results.length) return;
                const idx = new Map();
                g.f.cells.forEach(function (c, k) { idx.set(c, k); });
                const head = PT.computeAxisHeadroom(results, function (c) { return idx.get(c); }, ts, {
                    plotPx: isV ? g.plotH : g.plotW,
                    dataRange: gMax - Math.min(0, gMin) || 1
                });
                if (head.levels > headLevels) headLevels = head.levels;
            });
        }

        const minPlotPx = Math.min.apply(null, geom.map(function (g) { return isV ? g.plotH : g.plotW; }));
        let topMaxVal = gMax;
        if (headLevels > 0) {
            const levelH = ts.brkHeight + ts.brkSpacing + ts.brkFontSize;
            const needPx = 10 + headLevels * levelH + ts.brkFontSize;
            const range = gMax - Math.min(0, gMin) || 1;
            topMaxVal += needPx * (range / Math.max(20, minPlotPx)) * 1.15;
        }

        const valueDomain = isV
            ? PlotAxis.resolveDomain(axisCfg.y, [Math.min(0, gMin), topMaxVal])
            : PlotAxis.resolveDomain(axisCfg.x, [Math.min(0, gMin), topMaxVal]);

        if (isLogVal && valueDomain[0] <= 0) {
            const pos = [];
            facets.forEach(function (f) {
                f.cells.forEach(function (c) {
                    if (c._boxStats && c._boxStats.median > 0) pos.push(c._boxStats.median);
                });
            });
            valueDomain[0] = (pos.length ? Math.min.apply(null, pos) : 1) * 0.5;
        }

        const lastRowIdx = rows - 1;
        const firstColIdx = 0;

        geom.forEach(function (g) {
            if (fst.showStrip) {
                svg.append('rect')
                    .attr('x', g.stripX + 0.5).attr('y', g.stripY + 0.5)
                    .attr('width', Math.max(1, g.stripW - 1))
                    .attr('height', Math.max(1, g.stripH - 1))
                    .attr('fill', fst.stripFill)
                    .attr('stroke', fst.stripStroke)
                    .attr('stroke-width', 1)
                    .attr('rx', 2);

                const tCX = g.stripX + g.stripW / 2;
                const tCY = g.stripY + g.stripH / 2;
                const tEl = svg.append('text')
                    .attr('x', tCX).attr('y', tCY)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', 13)
                    .attr('font-weight', 'bold')
                    .attr('fill', fst.stripText);
                if (isV) tEl.attr('transform', 'rotate(90 ' + tCX + ' ' + tCY + ')');
                tEl.text(g.f.name);
            }

            const plotX = g.plotX, plotY = g.plotY, plotW = g.plotW, plotH = g.plotH;

            let valueScale, breakPos;
            if (isV) {
                const raw = isLogVal
                    ? d3.scaleLog().base(logBase).domain(valueDomain).range([plotY + plotH, plotY])
                    : d3.scaleLinear().domain(valueDomain).range([plotY + plotH, plotY]).nice();
                valueScale = isLogVal ? raw : PlotAxis.applyBreak(raw, axisCfg.y);
                breakPos = isLogVal ? NaN : PlotAxis.getBreakPosition(valueScale, axisCfg.y);
            } else {
                const raw = isLogVal
                    ? d3.scaleLog().base(logBase).domain(valueDomain).range([plotX, plotX + plotW])
                    : d3.scaleLinear().domain(valueDomain).range([plotX, plotX + plotW]).nice();
                valueScale = isLogVal ? raw : PlotAxis.applyBreak(raw, axisCfg.x);
                breakPos = isLogVal ? NaN : PlotAxis.getBreakPosition(valueScale, axisCfg.x);
            }

            if (isV && axisCfg.y.gridShow) {
                const gridY = svg.append('g').attr('class', 'grid grid-y');
                (valueScale.ticks ? valueScale.ticks() : valueScale.domain()).forEach(function (t) {
                    if (!isLogVal && axisCfg.y.breakEnable && t > axisCfg.y.breakFrom && t < axisCfg.y.breakTo) return;
                    const y = valueScale(t);
                    if (!isFinite(y)) return;
                    gridY.append('line')
                        .attr('x1', plotX).attr('x2', plotX + plotW)
                        .attr('y1', y).attr('y2', y)
                        .attr('stroke', axisCfg.y.gridColor)
                        .attr('stroke-dasharray', axisCfg.y.gridDash)
                        .attr('stroke-width', 1);
                });
            }
            if (!isV && axisCfg.x.gridShow) {
                const gridX = svg.append('g').attr('class', 'grid grid-x');
                (valueScale.ticks ? valueScale.ticks() : valueScale.domain()).forEach(function (t) {
                    if (!isLogVal && axisCfg.x.breakEnable && t > axisCfg.x.breakFrom && t < axisCfg.x.breakTo) return;
                    const x = valueScale(t);
                    if (!isFinite(x)) return;
                    gridX.append('line')
                        .attr('x1', x).attr('x2', x)
                        .attr('y1', plotY).attr('y2', plotY + plotH)
                        .attr('stroke', axisCfg.x.gridColor)
                        .attr('stroke-dasharray', axisCfg.x.gridDash)
                        .attr('stroke-width', 1);
                });
            }

            const shapesG = svg.append('g');
            let pos = new Map();

            if (isV) {
                const xOuter = d3.scaleBand().domain(catOrder).range([plotX, plotX + plotW])
                    .paddingOuter(0.3).paddingInner(0.3);
                const xInner = hasGroup
                    ? d3.scaleBand().domain(grpOrder).range([0, xOuter.bandwidth()]).paddingInner(0.15)
                    : null;
                if (options.drawShapeV) {
                    pos = options.drawShapeV(shapesG, {
                        g: g, fi: g.fi, cells: g.f.cells,
                        catOrder: catOrder, grpOrder: grpOrder, hasGroup: hasGroup,
                        isViolin: isViolin, bx: bx, colorOf: colorOf,
                        valueScale: valueScale, xOuter: xOuter, xInner: xInner
                    }) || pos;
                }
            } else {
                const yOuter = d3.scaleBand().domain(catOrder).range([plotY, plotY + plotH])
                    .paddingOuter(0.3).paddingInner(0.3);
                const yInner = hasGroup
                    ? d3.scaleBand().domain(grpOrder).range([0, yOuter.bandwidth()]).paddingInner(0.15)
                    : null;
                if (options.drawShapeH) {
                    pos = options.drawShapeH(shapesG, {
                        g: g, fi: g.fi, cells: g.f.cells,
                        catOrder: catOrder, grpOrder: grpOrder, hasGroup: hasGroup,
                        isViolin: isViolin, bx: bx, colorOf: colorOf,
                        valueScale: valueScale, yOuter: yOuter, yInner: yInner
                    }) || pos;
                }
            }

            const results = sigPerFacet[g.fi];
            if (results && results.length && PT && PT.drawSignificance) {
                PT.drawSignificance(svg, {
                    results: results,
                    getBarXY: function (c) {
                        const P = pos.get(c);
                        return P ? { x: P.x, y: (P.yTop !== undefined ? P.yTop : P.y) } : null;
                    },
                    orientation: isV ? 'vertical' : 'horizontal',
                    settings: ts
                });
            }

            if (isV) {
                const xOuter = d3.scaleBand().domain(catOrder).range([plotX, plotX + plotW])
                    .paddingOuter(0.3).paddingInner(0.3);
                const xAxisFn = d3.axisBottom(xOuter);
                const xTicks = PlotAxis.resolveTicks(axisCfg.x, xOuter);
                if (xTicks && xTicks.length) xAxisFn.tickValues(xTicks);
                const isLastRow = (g.row === lastRowIdx);
                const xCfgLocal = (isLastRow || fst.showInnerTicks)
                    ? axisCfg.x
                    : Object.assign({}, axisCfg.x, { tickShow: false, tickValueShow: false });
                PlotAxis.applyAxis(
                    svg.append('g').attr('class', 'x-axis')
                        .attr('transform', 'translate(0,' + (plotY + plotH) + ')')
                        .call(xAxisFn),
                    xCfgLocal, 'bottom'
                );

                const yAxisFn = d3.axisLeft(valueScale);
                const yTicks = PlotAxis.resolveTicks(axisCfg.y, valueScale);
                let yTV = yTicks;
                if (!yTV) {
                    yTV = valueScale.ticks ? valueScale.ticks() : null;
                    if (!isLogVal && axisCfg.y.breakEnable && yTV) {
                        yTV = yTV.filter(function (t) {
                            return !(t > axisCfg.y.breakFrom && t < axisCfg.y.breakTo);
                        });
                    }
                }
                if (yTV && yTV.length) yAxisFn.tickValues(yTV);
                PlotAxis.applyAxis(
                    svg.append('g').attr('class', 'y-axis')
                        .attr('transform', 'translate(' + plotX + ',0)')
                        .call(yAxisFn),
                    axisCfg.y, 'left', breakPos
                );

                if (axisCfg.y.titleShow && axisCfg.y.titleContent) {
                    const yTitleX = plotX - yTickFontV - 12;
                    svg.append('text')
                        .attr('transform', 'translate(' + yTitleX + ',' + (plotY + plotH / 2) + ') rotate(-90)')
                        .attr('text-anchor', 'middle')
                        .attr('font-size', axisCfg.y.titleFontSize)
                        .attr('font-weight', axisCfg.y.titleBold ? 'bold' : 'normal')
                        .attr('font-style', axisCfg.y.titleItalic ? 'italic' : 'normal')
                        .attr('fill', '#333')
                        .text(axisCfg.y.titleContent);
                }
            } else {
                const xAxisFn = d3.axisBottom(valueScale);
                const xTicks = PlotAxis.resolveTicks(axisCfg.x, valueScale);
                let xTV = xTicks;
                if (!xTV) {
                    xTV = valueScale.ticks ? valueScale.ticks() : null;
                    if (!isLogVal && axisCfg.x.breakEnable && xTV) {
                        xTV = xTV.filter(function (t) {
                            return !(t > axisCfg.x.breakFrom && t < axisCfg.x.breakTo);
                        });
                    }
                }
                if (xTV && xTV.length) xAxisFn.tickValues(xTV);
                PlotAxis.applyAxis(
                    svg.append('g').attr('class', 'x-axis')
                        .attr('transform', 'translate(0,' + (plotY + plotH) + ')')
                        .call(xAxisFn),
                    axisCfg.x, 'bottom', breakPos
                );

                const yOuter = d3.scaleBand().domain(catOrder).range([plotY, plotY + plotH])
                    .paddingOuter(0.3).paddingInner(0.3);
                const yAxisFn = d3.axisLeft(yOuter);
                const isFirstCol = (g.col === firstColIdx);
                const yCfgLocal = (isFirstCol || fst.showInnerTicks)
                    ? axisCfg.y
                    : Object.assign({}, axisCfg.y, { tickShow: false, tickValueShow: false });
                PlotAxis.applyAxis(
                    svg.append('g').attr('class', 'y-axis')
                        .attr('transform', 'translate(' + plotX + ',0)')
                        .call(yAxisFn),
                    yCfgLocal, 'left'
                );

                if (isFirstCol && axisCfg.y.titleShow && axisCfg.y.titleContent) {
                    const yTitleX = plotX - yTickFontV - 12 - Math.max(20, maxCatW);
                    svg.append('text')
                        .attr('transform', 'translate(' + yTitleX + ',' + (plotY + plotH / 2) + ') rotate(-90)')
                        .attr('text-anchor', 'middle')
                        .attr('font-size', axisCfg.y.titleFontSize)
                        .attr('font-weight', axisCfg.y.titleBold ? 'bold' : 'normal')
                        .attr('font-style', axisCfg.y.titleItalic ? 'italic' : 'normal')
                        .attr('fill', '#333')
                        .text(axisCfg.y.titleContent);
                }
            }
        });

        if (axisCfg.x.titleShow && axisCfg.x.titleContent) {
            const lastRow = Math.max.apply(null, geom.map(function (g) { return g.row; }));
            const bottomItems = geom.filter(function (g) { return g.row === lastRow; });
            if (bottomItems.length) {
                const minX = Math.min.apply(null, bottomItems.map(function (g) { return g.plotX; }));
                const maxX = Math.max.apply(null, bottomItems.map(function (g) { return g.plotX + g.plotW; }));
                const bottomY = Math.max.apply(null, bottomItems.map(function (g) { return g.plotY + g.plotH; }));
                const titleY = bottomY + xTickFontH + 10 + axisCfg.x.titleFontSize;
                svg.append('text')
                    .attr('x', (minX + maxX) / 2)
                    .attr('y', titleY)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', axisCfg.x.titleFontSize)
                    .attr('font-weight', axisCfg.x.titleBold ? 'bold' : 'normal')
                    .attr('font-style', axisCfg.x.titleItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(axisCfg.x.titleContent);
            }
        }

        if (p.showLegend && hasGroup && grpOrder.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: grpOrder.map(function (gr) { return { name: gr, percent: null }; }),
                colors: grpOrder.map(function (gr) { return colorOf(gr); }),
                shape: options.legendShape || 'rect',
                labelFormatter: function (it) { return it.name; }
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    global.PlotFacet = {
        defaultSettings: defaultSettings,
        renderFacetPanel: renderFacetPanel,
        readSettings: readSettings,
        prepareFacets: prepareFacets,
        drawFaceted: drawFaceted,
        L: L
    };
})(window);
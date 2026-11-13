(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Must include a header row with a <strong>category column</strong>, a <strong>group column</strong> (exactly 2 groups) and a <strong>value column</strong> (non-negative). Optional error columns: <strong>Lower/Upper</strong> or <strong>Error</strong>.'
            : '需包含表头，至少包含 <strong>分类列</strong>、<strong>分组列</strong>（恰好2个分组）和 <strong>数值列</strong>（非负）。可选误差棒列：<strong>上下限</strong> 或 <strong>误差值</strong>。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select the category, group and value columns' : '❌ 请选择分类列、分组列和数值列',
        needTwoGroups: EN ? '❌ The group column must contain exactly 2 groups' : '❌ 分组列需恰好包含2个分组',
        noValid: EN ? '❌ Could not generate valid plot data. Please check the value column' : '❌ 未能生成有效绘图数据，请检查数值列',
        colorEmpty: EN ? 'Group colors will be shown here after importing data' : '导入数据后将在此处显示分组颜色',
        sortInput: EN ? 'Input order' : '输入顺序',
        noImport: EN ? '— Please import data first —' : '— 请先导入数据 —',
        valueLabel: EN ? 'Value' : '数值'
    };

    const EX_DATA =
        'Term\tGroup\tValue\tLower\tUpper\tError\n' +
        'ATP production\tEnergy\t8.2\t7.8\t8.6\t0.4\n' +
        'Glycolysis\tEnergy\t6.5\t6.1\t6.9\t0.4\n' +
        'TCA cycle\tEnergy\t5.2\t4.8\t5.6\t0.4\n' +
        'Oxidative phosphorylation\tEnergy\t4.1\t3.8\t4.4\t0.3\n' +
        'Fatty acid oxidation\tEnergy\t3.3\t3.0\t3.6\t0.3\n' +
        'Amino acid catabolism\tEnergy\t2.6\t2.3\t2.9\t0.3\n' +
        'Nucleotide synthesis\tEnergy\t1.8\t1.5\t2.1\t0.3\n' +
        'MAPK signaling\tSignaling\t2.4\t2.1\t2.7\t0.3\n' +
        'Wnt signaling\tSignaling\t2.1\t1.8\t2.4\t0.3\n' +
        'Notch signaling\tSignaling\t1.7\t1.4\t2.0\t0.3\n' +
        'TGF-beta signaling\tSignaling\t1.5\t1.3\t1.7\t0.2\n' +
        'JAK-STAT signaling\tSignaling\t1.2\t1.0\t1.4\t0.2\n' +
        'NF-kB signaling\tSignaling\t0.9\t0.75\t1.05\t0.15\n' +
        'Calcium signaling\tSignaling\t0.6\t0.5\t0.7\t0.1';

    function getGroupOrder(app) {
        const state = app.state;
        const gCol = state.roles.group;
        if (!gCol) return [];
        const seen = new Set(), out = [];
        state.data.forEach(function (r) {
            const v = r[gCol];
            if (v === undefined || v === null || v === '') return;
            const s = String(v);
            if (!seen.has(s)) { seen.add(s); out.push(s); }
        });
        return out;
    }

    function niceMax(v) {
        if (!isFinite(v) || v <= 0) return 1;
        const exp = Math.floor(Math.log10(v));
        const base = Math.pow(10, exp);
        const n = v / base;
        let m;
        if (n <= 1) m = 1;
        else if (n <= 2) m = 2;
        else if (n <= 2.5) m = 2.5;
        else if (n <= 5) m = 5;
        else m = 10;
        return m * base;
    }

    function sortCats(app, cats, sortBy, sortDir) {
        const state = app.state;
        const xCol = state.roles.x;
        const dir = sortDir === 'asc' ? 1 : -1;
        if (!sortBy || sortBy === '__input__') {
            cats.sort(function (a, b) { return a.inputIndex - b.inputIndex; });
            return;
        }
        if (sortBy === '__value__') {
            cats.sort(function (a, b) { return (a.value - b.value) * dir; });
            return;
        }
        const keyMap = new Map();
        state.data.forEach(function (row) {
            const x = String(row[xCol] == null ? '' : row[xCol]);
            if (!keyMap.has(x)) keyMap.set(x, []);
            const v = parseFloat(row[sortBy]);
            if (isFinite(v)) keyMap.get(x).push(v);
        });
        cats.forEach(function (c) {
            const arr = keyMap.get(c.x) || [];
            c._sk = arr.length ? arr.reduce(function (a, b) { return a + b; }, 0) / arr.length : 0;
        });
        cats.sort(function (a, b) { return (a._sk - b._sk) * dir; });
    }

    function prepareData(app, p) {
        const state = app.state;
        const xCol = state.roles.x;
        const gCol = state.roles.group;
        const yCol = state.roles.y;

        const groupOrder = getGroupOrder(app);
        let posGroup = groupOrder[0];
        let negGroup = groupOrder[1];
        if (p.swapSides) {
            const tmp = posGroup; posGroup = negGroup; negGroup = tmp;
        }

        const catMap = new Map();
        const inputIndexMap = new Map();
        state.data.forEach(function (row, ri) {
            const x = String(row[xCol] == null ? '' : row[xCol]);
            if (!x) return;
            if (!inputIndexMap.has(x)) inputIndexMap.set(x, ri);
            const v = parseFloat(row[yCol]);
            if (!isFinite(v)) return;
            if (!catMap.has(x)) {
                catMap.set(x, {
                    x: x,
                    g: String(row[gCol] == null ? '' : row[gCol]),
                    values: [],
                    firstRow: row
                });
            }
            catMap.get(x).values.push(v);
        });

        const cats = [];
        catMap.forEach(function (c) {
            const mean = c.values.reduce(function (a, b) { return a + b; }, 0) / c.values.length;
            const ext = PlotErrorBar.computeErrorExtent(c.firstRow, mean, state.errBar);
            cats.push({
                x: c.x, g: c.g, value: mean, ext: ext,
                inputIndex: inputIndexMap.get(c.x) || 0
            });
        });

        const posCats = cats.filter(function (c) { return c.g === posGroup; });
        const negCats = cats.filter(function (c) { return c.g === negGroup; });

        sortCats(app, posCats, p.rightSortBy, p.rightSortDir);
        sortCats(app, negCats, p.leftSortBy, p.leftSortDir);

        return {
            groupOrder: groupOrder,
            posGroup: posGroup,
            negGroup: negGroup,
            posCats: posCats,
            negCats: negCats
        };
    }

    function readAllParams(app) {
        const $ = app.$;
        const p = Object.assign({},
            PC.readCanvasParams(app, 760, 600),
            BarCommon.readBarParams(app),
            PC.readTitleLegendParams(app)
        );
        p.layout = app.state.barDirection === 'vertical' ? 'vertical' : 'horizontal';
        p.showZeroLine = $('showZeroLine') ? $('showZeroLine').checked : true;
        p.swapSides = $('swapSides') ? $('swapSides').checked : false;
        p.flip = $('flipChart') ? $('flipChart').checked : false;

        p.rightSortBy = $('rightSortBy') ? $('rightSortBy').value : '__value__';
        p.rightSortDir = $('rightSortDir') ? $('rightSortDir').value : 'desc';
        p.leftSortBy = $('leftSortBy') ? $('leftSortBy').value : '__value__';
        p.leftSortDir = $('leftSortDir') ? $('leftSortDir').value : 'asc';
        return p;
    }

    function refreshGroupColors(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const keys = getGroupOrder(app);
        if (!keys.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const baseColors = app.resolvePaletteColors(keys.length);
        const displayItems = keys.map(function (k, i) {
            return { name: k, color: app.state.customColors[k] || baseColors[i] };
        });
        PlotCommon.renderColorAssignment(container, {
            items: displayItems,
            onChange: function (idx, c) {
                app.state.customColors[keys[idx]] = c;
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: function () {
                app.state.customColors = {};
                refreshGroupColors(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    function fillSortSelects(app) {
        const state = app.state;
        const xCol = state.roles.x;
        const gCol = state.roles.group;
        const yCol = state.roles.y;
        const others = state.headers.filter(function (h) {
            return h !== xCol && h !== gCol && h !== yCol;
        });
        ['leftSortBy', 'rightSortBy'].forEach(function (id) {
            const sel = app.$(id);
            if (!sel) return;
            if (!state.headers.length) {
                sel.innerHTML = '<option>' + T.noImport + '</option>';
                sel.disabled = true;
                return;
            }
            sel.disabled = false;
            const cur = sel.value;
            let html = '<option value="__input__">' + PlotCommon.escapeHtml(T.sortInput) + '</option>';
            html += '<option value="__value__">' + PlotCommon.escapeHtml(yCol || T.valueLabel) + '</option>';
            others.forEach(function (h) {
                html += '<option value="' + PlotCommon.escapeHtml(h) + '">' +
                    PlotCommon.escapeHtml(h) + '</option>';
            });
            sel.innerHTML = html;
            let found = false;
            for (let i = 0; i < sel.options.length; i++) {
                if (sel.options[i].value === cur) { found = true; break; }
            }
            sel.value = found ? cur : '__value__';
        });
    }

    function computeMaxV(prepared, numCfg) {
        let maxData = 0;
        prepared.posCats.concat(prepared.negCats).forEach(function (c) {
            let v = c.value;
            if (c.ext) v = Math.max(v, c.ext.upper);
            if (v > maxData) maxData = v;
        });
        if (!(maxData > 0)) maxData = 1;
        if (numCfg.domainAuto) {
            const pad = Math.max(0, numCfg.domainPad || 0);
            return niceMax(maxData * (1 + pad / 100));
        }
        return numCfg.domainMax > 0 ? numCfg.domainMax : niceMax(maxData);
    }

    function axisTickFormat(d) {
        const a = Math.abs(d);
        if (Number.isInteger(a)) return String(a);
        return String(Number(a.toPrecision(4)));
    }

    function drawHorizontal(app, prepared, p, axisCfg) {
        const state = app.state;
        const numCfg = axisCfg.x;
        const catCfg = axisCfg.y;
        const maxV = computeMaxV(prepared, numCfg);

        const ordered = prepared.posCats.concat(prepared.negCats);
        if (!ordered.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const margin = 30;
        const areaX = margin, areaY = margin;
        const areaW = p.width - 2 * margin;
        const areaH = p.height - 2 * margin;

        const xLabelFont = numCfg.tickValueShow ? numCfg.tickFontSize : 0;
        const xTitleFont = (numCfg.titleShow && numCfg.titleContent) ? numCfg.titleFontSize + 8 : 0;
        const bottomPad = xLabelFont + 14 + xTitleFont + 10;
        const topPad = 20;
        const leftPad = 20;
        const rightPad = 20;

        const plotX = areaX + leftPad;
        const plotY = areaY + topPad;
        const plotW = Math.max(40, areaW - leftPad - rightPad);
        const plotH = Math.max(40, areaH - topPad - bottomPad);

        const cx = plotX + plotW / 2;

        const posScale = d3.scaleLinear().domain([0, maxV]).range([cx, plotX + plotW]);
        const negScale = d3.scaleLinear().domain([0, maxV]).range([cx, plotX]);
        const axisScale = d3.scaleLinear().domain([-maxV, maxV]).range([plotX, plotX + plotW]);

        const yScale = d3.scaleBand()
            .domain(ordered.map(function (_, i) { return i; }))
            .range([plotY, plotY + plotH])
            .paddingOuter(p.barOuterGap)
            .paddingInner(p.barOuterGap);

        const colorKeys = prepared.groupOrder;
        const baseColors = app.resolvePaletteColors(colorKeys.length);
        const colorOf = function (k) {
            if (!k) return '#cccccc';
            const idx = colorKeys.indexOf(k);
            return state.customColors[k] || baseColors[idx] || '#cccccc';
        };

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        state.currentSvg = canvas.node;

        const tickVals = d3.ticks(-maxV, maxV, 10);

        if (numCfg.gridShow) {
            const gridG = svg.append('g').attr('class', 'grid grid-x');
            tickVals.forEach(function (t) {
                const x = Math.round(axisScale(t)) + 0.5;
                if (!isFinite(x)) return;
                gridG.append('line')
                    .attr('x1', x).attr('x2', x)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', numCfg.gridColor)
                    .attr('stroke-dasharray', numCfg.gridDash)
                    .attr('stroke-width', 1);
            });
        }
        if (catCfg.gridShow) {
            const gridGY = svg.append('g').attr('class', 'grid grid-y');
            ordered.forEach(function (_, i) {
                const y = Math.round(yScale(i) + yScale.bandwidth() / 2) + 0.5;
                gridGY.append('line')
                    .attr('x1', plotX).attr('x2', plotX + plotW)
                    .attr('y1', y).attr('y2', y)
                    .attr('stroke', catCfg.gridColor)
                    .attr('stroke-dasharray', catCfg.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        if (p.showZeroLine) {
            svg.append('line')
                .attr('class', 'zero-line')
                .attr('x1', cx).attr('x2', cx)
                .attr('y1', plotY).attr('y2', plotY + plotH)
                .attr('stroke', '#999999')
                .attr('stroke-dasharray', '4 3')
                .attr('stroke-width', 1)
                .attr('pointer-events', 'none');
        }

        const barsG = svg.append('g').attr('class', 'bars');
        const labelsG = svg.append('g').attr('class', 'cat-labels');
        const errG = svg.append('g').attr('class', 'error-bars');

        const posOnRight = !p.flip;

        ordered.forEach(function (cell, i) {
            const isPos = (cell.g === prepared.posGroup);
            const onRight = isPos ? posOnRight : !posOnRight;
            const scale = onRight ? posScale : negScale;
            const band = yScale(i);
            const bandH = yScale.bandwidth();
            const barH = bandH * p.barWidthScale;
            const barY = band + (bandH - barH) / 2;
            const cy = band + bandH / 2;

            const v = Math.min(cell.value, maxV);
            const xEnd = scale(v);
            const barX = Math.min(cx, xEnd);
            const barW = Math.abs(xEnd - cx);
            const color = colorOf(cell.g);

            barsG.append('rect')
                .attr('x', barX).attr('y', barY)
                .attr('width', Math.max(0, barW)).attr('height', barH)
                .attr('fill', color)
                .attr('stroke', p.barStrokeWidth > 0 ? p.barStrokeColor : 'none')
                .attr('stroke-width', p.barStrokeWidth);

            if (p.barShowValue) {
                const txt = PC.fmtNum(cell.value, 2);
                const textColor = PC.textColorOn(color);
                barsG.append('text')
                    .attr('x', onRight ? cx + 4 : cx - 4)
                    .attr('y', cy)
                    .attr('text-anchor', onRight ? 'start' : 'end')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', p.barValueFontSize)
                    .attr('fill', textColor)
                    .text(txt);
            }

            labelsG.append('text')
                .attr('x', onRight ? cx - 4 : cx + 4)
                .attr('y', cy)
                .attr('text-anchor', onRight ? 'end' : 'start')
                .attr('dominant-baseline', 'middle')
                .attr('font-size', catCfg.tickFontSize)
                .attr('font-weight', catCfg.tickBold ? 'bold' : 'normal')
                .attr('font-style', catCfg.tickItalic ? 'italic' : 'normal')
                .attr('fill', '#333')
                .text(cell.x);

            if (cell.ext) {
                const errColor = PlotErrorBar.resolveErrorColor(state.errBar, color);
                const loVal = Math.min(Math.max(0, cell.ext.lower), maxV);
                const hiVal = Math.min(Math.max(0, cell.ext.upper), maxV);
                const xLo = scale(loVal);
                const xHi = scale(hiVal);
                if (!isFinite(xLo) || !isFinite(xHi)) return;
                BarCommon.drawErrorBar(errG, {
                    xPx: 0, yPx: cy,
                    barThickness: barH,
                    loPx: xLo, hiPx: xHi,
                    valuePx: scale(v),
                    capMode: cell.ext.capMode || state.errBar.showWhich,
                    isHorizontal: true,
                    errColor: errColor,
                    errWidth: state.errBar.errWidth,
                    capWidth: state.errBar.capWidth
                });
            }
        });

        const xAxisFn = d3.axisBottom(axisScale)
            .tickValues(tickVals)
            .tickFormat(axisTickFormat);
        const xAxisG = svg.append('g').attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + (plotY + plotH) + ')')
            .call(xAxisFn);
        PlotAxis.applyAxis(xAxisG, numCfg, 'bottom');

        if (numCfg.titleShow && numCfg.titleContent) {
            svg.append('text')
                .attr('x', plotX + plotW / 2)
                .attr('y', plotY + plotH + bottomPad - 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', numCfg.titleFontSize)
                .attr('font-weight', numCfg.titleBold ? 'bold' : 'normal')
                .attr('font-style', numCfg.titleItalic ? 'italic' : 'normal')
                .attr('fill', '#333')
                .text(numCfg.titleContent);
        }

        PlotAxis.drawFrameAndRefLines(svg, {
            plotX: plotX, plotY: plotY, plotW: plotW, plotH: plotH,
            xScale: axisScale, yScale: yScale, axisCfg: axisCfg
        });

        if (p.showLegend && colorKeys.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: colorKeys.map(function (k) { return { name: k, percent: null }; }),
                colors: colorKeys.map(function (k) { return colorOf(k); }),
                shape: 'rect',
                labelFormatter: function (it) { return it.name; }
            });
        }

        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    function drawVertical(app, prepared, p, axisCfg) {
        const state = app.state;
        const numCfg = axisCfg.y;
        const catCfg = axisCfg.x;
        const maxV = computeMaxV(prepared, numCfg);

        const ordered = prepared.posCats.concat(prepared.negCats);
        if (!ordered.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const margin = 30;
        const areaX = margin, areaY = margin;
        const areaW = p.width - 2 * margin;
        const areaH = p.height - 2 * margin;

        const yLabelFont = numCfg.tickValueShow ? numCfg.tickFontSize : 0;
        const yTitleFont = (numCfg.titleShow && numCfg.titleContent) ? numCfg.titleFontSize + 8 : 0;
        const leftPad = Math.max(40, yLabelFont * 1.6) + yTitleFont + 10;
        const rightPad = 20;
        const topPad = 20;
        const bottomPad = 20;

        const plotX = areaX + leftPad;
        const plotY = areaY + topPad;
        const plotW = Math.max(40, areaW - leftPad - rightPad);
        const plotH = Math.max(40, areaH - topPad - bottomPad);

        const cy = plotY + plotH / 2;
        const halfH = plotH / 2;

        const yScale = d3.scaleLinear().domain([-maxV, maxV]).range([plotY + plotH, plotY]);

        const xScale = d3.scaleBand()
            .domain(ordered.map(function (_, i) { return i; }))
            .range([plotX, plotX + plotW])
            .paddingOuter(p.barOuterGap)
            .paddingInner(p.barOuterGap);

        const colorKeys = prepared.groupOrder;
        const baseColors = app.resolvePaletteColors(colorKeys.length);
        const colorOf = function (k) {
            if (!k) return '#cccccc';
            const idx = colorKeys.indexOf(k);
            return state.customColors[k] || baseColors[idx] || '#cccccc';
        };

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        state.currentSvg = canvas.node;

        const tickVals = d3.ticks(-maxV, maxV, 10);

        if (numCfg.gridShow) {
            const gridG = svg.append('g').attr('class', 'grid grid-y');
            tickVals.forEach(function (t) {
                const y = Math.round(yScale(t)) + 0.5;
                if (!isFinite(y)) return;
                gridG.append('line')
                    .attr('x1', plotX).attr('x2', plotX + plotW)
                    .attr('y1', y).attr('y2', y)
                    .attr('stroke', numCfg.gridColor)
                    .attr('stroke-dasharray', numCfg.gridDash)
                    .attr('stroke-width', 1);
            });
        }
        if (catCfg.gridShow) {
            const gridGX = svg.append('g').attr('class', 'grid grid-x');
            ordered.forEach(function (_, i) {
                const x = Math.round(xScale(i) + xScale.bandwidth() / 2) + 0.5;
                gridGX.append('line')
                    .attr('x1', x).attr('x2', x)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', catCfg.gridColor)
                    .attr('stroke-dasharray', catCfg.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        if (p.showZeroLine) {
            svg.append('line')
                .attr('class', 'zero-line')
                .attr('x1', plotX).attr('x2', plotX + plotW)
                .attr('y1', cy).attr('y2', cy)
                .attr('stroke', '#999999')
                .attr('stroke-dasharray', '4 3')
                .attr('stroke-width', 1)
                .attr('pointer-events', 'none');
        }

        const barsG = svg.append('g').attr('class', 'bars');
        const labelsG = svg.append('g').attr('class', 'cat-labels');
        const errG = svg.append('g').attr('class', 'error-bars');

        const posOnTop = !p.flip;

        ordered.forEach(function (cell, i) {
            const isPos = (cell.g === prepared.posGroup);
            const onTop = isPos ? posOnTop : !posOnTop;
            const band = xScale(i);
            const bandW = xScale.bandwidth();
            const barW = bandW * p.barWidthScale;
            const barX = band + (bandW - barW) / 2;
            const cx = band + bandW / 2;

            const v = Math.min(cell.value, maxV);
            const barH = (v / maxV) * halfH;
            const barY = onTop ? (cy - barH) : cy;
            const color = colorOf(cell.g);

            barsG.append('rect')
                .attr('x', barX).attr('y', barY)
                .attr('width', barW).attr('height', Math.max(0, barH))
                .attr('fill', color)
                .attr('stroke', p.barStrokeWidth > 0 ? p.barStrokeColor : 'none')
                .attr('stroke-width', p.barStrokeWidth);

            if (p.barShowValue) {
                const txt = PC.fmtNum(cell.value, 2);
                const textColor = PC.textColorOn(color);
                barsG.append('text')
                    .attr('x', cx)
                    .attr('y', onTop ? cy - 4 : cy + 4)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', onTop ? 'auto' : 'hanging')
                    .attr('font-size', p.barValueFontSize)
                    .attr('fill', textColor)
                    .text(txt);
            }

            if (onTop) {
                labelsG.append('text')
                    .attr('transform', 'translate(' + cx + ',' + (cy + 4) + ') rotate(90)')
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', catCfg.tickFontSize)
                    .attr('font-weight', catCfg.tickBold ? 'bold' : 'normal')
                    .attr('font-style', catCfg.tickItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(cell.x);
            } else {
                labelsG.append('text')
                    .attr('transform', 'translate(' + cx + ',' + (cy - 4) + ') rotate(-90)')
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', catCfg.tickFontSize)
                    .attr('font-weight', catCfg.tickBold ? 'bold' : 'normal')
                    .attr('font-style', catCfg.tickItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(cell.x);
            }

            if (cell.ext) {
                const errColor = PlotErrorBar.resolveErrorColor(state.errBar, color);
                const lo = Math.min(Math.max(0, cell.ext.lower), maxV);
                const hi = Math.min(Math.max(0, cell.ext.upper), maxV);
                if (onTop) {
                    BarCommon.drawErrorBar(errG, {
                        xPx: cx, yPx: 0,
                        barThickness: barW,
                        loPx: cy - (hi / maxV) * halfH,
                        hiPx: cy - (lo / maxV) * halfH,
                        valuePx: cy - barH,
                        capMode: cell.ext.capMode || state.errBar.showWhich,
                        isHorizontal: false,
                        errColor: errColor,
                        errWidth: state.errBar.errWidth,
                        capWidth: state.errBar.capWidth
                    });
                } else {
                    BarCommon.drawErrorBar(errG, {
                        xPx: cx, yPx: 0,
                        barThickness: barW,
                        loPx: cy + (lo / maxV) * halfH,
                        hiPx: cy + (hi / maxV) * halfH,
                        valuePx: cy + barH,
                        capMode: cell.ext.capMode || state.errBar.showWhich,
                        isHorizontal: false,
                        errColor: errColor,
                        errWidth: state.errBar.errWidth,
                        capWidth: state.errBar.capWidth
                    });
                }
            }
        });

        const yAxisFn = d3.axisLeft(yScale)
            .tickValues(tickVals)
            .tickFormat(axisTickFormat);
        const yAxisG = svg.append('g').attr('class', 'y-axis')
            .attr('transform', 'translate(' + plotX + ',0)')
            .call(yAxisFn);
        PlotAxis.applyAxis(yAxisG, numCfg, 'left');

        if (numCfg.titleShow && numCfg.titleContent) {
            svg.append('text')
                .attr('transform', 'translate(' + (plotX - leftPad + 12) + ',' + (plotY + plotH / 2) + ') rotate(-90)')
                .attr('text-anchor', 'middle')
                .attr('font-size', numCfg.titleFontSize)
                .attr('font-weight', numCfg.titleBold ? 'bold' : 'normal')
                .attr('font-style', numCfg.titleItalic ? 'italic' : 'normal')
                .attr('fill', '#333')
                .text(numCfg.titleContent);
        }

        PlotAxis.drawFrameAndRefLines(svg, {
            plotX: plotX, plotY: plotY, plotW: plotW, plotH: plotH,
            xScale: xScale, yScale: yScale, axisCfg: axisCfg
        });

        if (p.showLegend && colorKeys.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: colorKeys.map(function (k) { return { name: k, percent: null }; }),
                colors: colorKeys.map(function (k) { return colorOf(k); }),
                shape: 'rect',
                labelFormatter: function (it) { return it.name; }
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

        const groupOrder = getGroupOrder(app);
        if (groupOrder.length !== 2) {
            app.showTip('msgTip3', T.needTwoGroups, 'error'); return;
        }

        const p = readAllParams(app);
        const axisCfg = state.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        const prepared = prepareData(app, p);
        if (!prepared.posCats.length && !prepared.negCats.length) {
            app.showTip('msgTip3', T.noValid, 'error'); return;
        }

        if (p.layout === 'vertical') {
            drawVertical(app, prepared, p, axisCfg);
        } else {
            drawHorizontal(app, prepared, p, axisCfg);
        }

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    PlotApp.create({
        exportName: 'bidirectional_bar_chart',
        exampleData: EX_DATA,
        importInfo: T.importInfo,

        stateExtra: (function () {
            const base = BarCommon.createStateExtra();
            base.barDirection = 'horizontal';
            return base;
        })(),

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = app.state.roles.group || '';
            }
        },

        setup: function (app) {
            BarCommon.fillRoleSelects(app, '');
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
            BarCommon.bindRoleEvents(app, null, null, null);

            const swapEl = app.$('swapSides');
            if (swapEl) swapEl.addEventListener('change', function () {
                if (app.state.currentSvg) app.drawChart();
            });
            const flipEl = app.$('flipChart');
            if (flipEl) flipEl.addEventListener('change', function () {
                if (app.state.currentSvg) app.drawChart();
            });
            ['leftSortBy', 'leftSortDir', 'rightSortBy', 'rightSortDir'].forEach(function (id) {
                const el = app.$(id);
                if (el) el.addEventListener('change', function () {
                    if (app.state.currentSvg) app.drawChart();
                });
            });

            fillSortSelects(app);
        },

        onDataImported: function (app, res) {
            const state = app.state;
            state.columnTypes = res.columnTypes || {};
            const cats = res.headers.filter(function (h) {
                return state.columnTypes[h] === 'categorical' || state.columnTypes[h] === 'date';
            });
            const nums = res.headers.filter(function (h) {
                return state.columnTypes[h] === 'numeric';
            });
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

            app.syncLegendTitle();
            BarCommon.syncAxisTitlesByDirection(app);
            BarCommon.fillRoleSelects(app, '');
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
            fillSortSelects(app);
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

            const swapEl = app.$('swapSides');
            if (swapEl) swapEl.checked = false;
            const flipEl = app.$('flipChart');
            if (flipEl) flipEl.checked = false;
            const rDir = app.$('rightSortDir');
            if (rDir) rDir.value = 'desc';
            const lDir = app.$('leftSortDir');
            if (lDir) lDir.value = 'asc';

            BarCommon.fillRoleSelects(app, '');
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
            fillSortSelects(app);
        },

        onStateRestored: function (app) {
            BarCommon.fillRoleSelects(app, '');
            BarCommon.refreshAxisPanel(app);
            BarCommon.refreshErrorBarPanel(app);
            fillSortSelects(app);
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
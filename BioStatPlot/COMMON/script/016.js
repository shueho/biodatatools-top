(function () {
    'use strict';

    const PC = window.PlotCommon;
    const SF = window.StatFitting;

    const EN = PlotI18N.lang() === 'en';
    const T = {
        noData:    EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCol: EN ? '❌ Please select a numeric column' : '❌ 请选择数值列',
        noValid:   EN ? '❌ Could not generate valid plot data' : '❌ 未能生成有效绘图数据',
        legendFit: 'Normal fit',
        freqLabel: 'Frequency',
        freqPctLabel: 'Frequency (%)',
        barColorName: EN ? 'Bar fill' : '柱形填充色'
    };

    const EX_VALUES = [
        40.20, 41.50, 39.30, 38.80, 41.10, 40.60, 39.70, 41.80,
        42.50, 43.80, 42.10, 43.50, 43.00, 42.80, 43.70, 42.30, 43.40, 42.90,
        44.10, 45.80, 44.50, 45.50, 44.80, 45.20, 44.90, 45.60, 44.30, 45.10, 44.60, 45.90, 45.30, 44.70,
        46.10, 47.80, 46.50, 47.50, 46.80, 47.20, 46.90, 47.60, 46.30, 47.10, 46.60, 47.90, 47.30, 46.70, 47.00, 47.40, 46.20, 46.40, 47.70, 46.00,
        48.10, 49.80, 48.50, 49.50, 48.80, 49.20, 48.90, 49.60, 48.30, 49.10, 48.60, 49.90, 49.30, 48.70, 49.00, 49.40, 48.20, 48.40, 49.70, 48.00, 49.45, 48.35, 49.25, 48.75,
        50.10, 51.80, 50.50, 51.50, 50.80, 51.20, 50.90, 51.60, 50.30, 51.10, 50.60, 51.90, 51.30, 50.70, 51.00, 51.40, 50.20, 50.40, 51.70, 50.00, 51.45, 50.35, 51.25, 50.75,
        52.10, 53.80, 52.50, 53.50, 52.80, 53.20, 52.90, 53.60, 52.30, 53.10, 52.60, 53.90, 53.30, 52.70, 53.00, 53.40, 52.20, 52.40, 53.70, 52.00,
        54.10, 55.80, 54.50, 55.50, 54.80, 55.20, 54.90, 55.60, 54.30, 55.10, 54.60, 55.90, 55.30, 54.70,
        56.10, 57.80, 56.50, 57.50, 56.80, 57.20, 56.90, 57.60, 56.30, 57.10,
        58.20, 59.50, 58.80, 60.20, 59.00, 61.50
    ];

    const EX_DATA = 'Sample\tValue\n' + EX_VALUES.map((v, i) =>
        'S' + String(i + 1).padStart(3, '0') + '\t' + v.toFixed(2)
    ).join('\n');

    const CUSTOM_KEY = '__hist_bar__';

    function fillValSelect(app) {
        const s = app.state;
        const sel = app.$('valColSel');
        if (!sel) return;

        if (!s.headers.length) {
            sel.innerHTML = '<option>' + PlotI18N.t('notSelected') + '</option>';
            sel.disabled = true;
            return;
        }
        sel.disabled = false;

        const types = s.columnTypes || {};
        const nums = s.headers.filter(h => types[h] === 'numeric');
        const candidates = nums.length ? nums : s.headers;
        const current = s.roles.value || '';

        sel.innerHTML = candidates.map(h =>
            '<option value="' + PlotCommon.escapeHtml(h) + '" ' +
            (h === current ? 'selected' : '') + '>' +
            PlotCommon.escapeHtml(h) + '</option>'
        ).join('');
    }

    function getValues(app) {
        const s = app.state;
        const col = s.roles.value;
        if (!col) return [];
        const out = [];
        s.data.forEach(row => {
            const v = parseFloat(row[col]);
            if (isFinite(v)) out.push(v);
        });
        return out;
    }

    function readHistParams(app) {
        const $ = app.$;
        const n = (id, fb) => PC.num(app, id, fb);

        const p = PC.readCommonParams(app, { width: 800, height: 600 });

        p.binMode    = ($('binMode')   && $('binMode').value)   || 'count';
        p.binCount   = Math.max(1, Math.round(n('binCount', 12)));
        p.binSpacing = Math.max(0.0001, n('binSpacing', 5));

        p.autoRange = $('autoRange') ? $('autoRange').checked : true;
        p.rangeMin  = n('rangeMin', 0);
        p.rangeMax  = n('rangeMax', 100);

        p.midpointTicks = $('midpointTicks') ? $('midpointTicks').checked : true;
        const tickDecRaw = ($('tickDecimals') && $('tickDecimals').value) || 'auto';
        p.tickDecimals = (tickDecRaw === 'auto') ? 'auto' : parseInt(tickDecRaw, 10);

        p.displayMode = ($('displayMode') && $('displayMode').value) || 'count';

        p.barGap           = Math.max(0, Math.min(0.5, n('barGap', 0)));
        p.barStrokeWidth   = Math.max(0, n('barStrokeWidth', 1));
        p.barStrokeColor   = ($('barStrokeColor') && $('barStrokeColor').value) || '#ffffff';
        p.barShowValue     = $('barShowValue') ? $('barShowValue').checked : false;
        p.barValueFontSize = Math.max(6, n('barValueFontSize', 11));

        p.showNormalFit = $('showNormalFit') ? $('showNormalFit').checked : false;
        p.normalColor   = ($('normalColor') && $('normalColor').value) || '#e15759';
        p.normalWidth   = Math.max(0.5, n('normalWidth', 2));
        p.normalDash    = $('normalDash') ? $('normalDash').checked : false;
        p.showFitStats  = $('showFitStats') ? $('showFitStats').checked : false;

        const palette = app.resolvePaletteColors(1);
        const customColor = app.state.customColors[CUSTOM_KEY];
        const inputEl = $('barFillColor');
        const inputColor = inputEl ? inputEl.value : null;
        p.barFillColor = customColor || inputColor || (palette && palette[0]) || '#4e79a7';

        return p;
    }

    function computeBins(values, p) {
        if (!values.length) return null;

        let minV, maxV;
        if (p.autoRange) {
            minV = Math.min.apply(null, values);
            maxV = Math.max.apply(null, values);
        } else {
            minV = p.rangeMin;
            maxV = p.rangeMax;
        }
        if (!isFinite(minV) || !isFinite(maxV)) return null;
        if (maxV <= minV) maxV = minV + 1;

        let binWidth, binCount;

        if (p.binMode === 'spacing') {
            binWidth = p.binSpacing;
            if (binWidth <= 0) binWidth = 1;
            binCount = Math.ceil((maxV - minV) / binWidth);
            if (binCount < 1) binCount = 1;
            maxV = minV + binWidth * binCount;
        } else {
            binCount = p.binCount;
            binWidth = (maxV - minV) / binCount;
            if (binWidth <= 0) binWidth = 1;
        }

        const bins = [];
        for (let i = 0; i < binCount; i++) {
            const lo = minV + i * binWidth;
            bins.push({ lo: lo, hi: lo + binWidth, count: 0 });
        }

        values.forEach(v => {
            if (v < minV || v > maxV) return;
            let idx = Math.floor((v - minV) / binWidth);
            if (idx >= binCount) idx = binCount - 1;
            if (idx < 0) idx = 0;
            bins[idx].count++;
        });

        const total = bins.reduce((s, b) => s + b.count, 0);

        return {
            min: minV, max: maxV,
            binWidth: binWidth, binCount: binCount,
            bins: bins, total: total
        };
    }

    function computeMidTicks(binData, maxTicks) {
        if (!binData || !binData.binCount) return [];
        const n = binData.binCount;
        const limit = Math.max(2, maxTicks || 15);
        const step = Math.max(1, Math.ceil(n / limit));
        const out = [];
        for (let i = 0; i < n; i += step) {
            const b = binData.bins[i];
            out.push((b.lo + b.hi) / 2);
        }
        return out;
    }

    function midTickFormat(binWidth, decimals) {
        let dec;
        if (decimals === 'auto' || decimals == null || !isFinite(decimals)) {
            if (!isFinite(binWidth) || binWidth <= 0) return null;
            const s = binWidth.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
            const dot = s.indexOf('.');
            dec = dot >= 0 ? (s.length - dot - 1) : 0;
            if (dec > 6) dec = 6;
        } else {
            dec = Math.max(0, Math.min(6, Math.round(decimals)));
        }
        return function (v) {
            if (!isFinite(v)) return '';
            return Number(v).toFixed(dec);
        };
    }

    function syncAxisTitles(app) {
        const s = app.state;
        const dir = s.barDirection || 'vertical';
        const valueLabel = s.roles.value || '';
        const freqLabel = (s.displayMode === 'frequency') ? T.freqPctLabel : T.freqLabel;

        if (dir === 'horizontal') {
            if (!s.axis.x.titleEdited) s.axis.x.titleContent = freqLabel;
            if (!s.axis.y.titleEdited) s.axis.y.titleContent = valueLabel;
        } else {
            if (!s.axis.x.titleEdited) s.axis.x.titleContent = valueLabel;
            if (!s.axis.y.titleEdited) s.axis.y.titleContent = freqLabel;
        }
    }

    function refreshAxisPanel(app) {
        const direction = app.state.barDirection || 'vertical';
        PlotAxis.render(app.$('axisPanelContainer'), {
            state: app.state.axis,
            direction: direction,
            axisTypes: { x: 'numeric', y: 'numeric' },
            onGlobalFontChange: function () {
                BarCommon.updatePanelFontInputs(app);
                if (app.state.currentSvg) app.drawChart();
            },
            onChange: function () {
                if (app.state.currentSvg) app.drawChart();
            },
            onDirectionChange: function (newDir) {
                app.state.barDirection = newDir;
                syncAxisTitles(app);
                refreshAxisPanel(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
        ['x', 'y'].forEach(k => {
            const input = app.$('axisPanelContainer').querySelector('.ax-' + k + '-title');
            if (input) {
                input.addEventListener('input', function () {
                    app.state.axis[k].titleEdited = true;
                });
            }
        });
    }

    function refreshBarColor(app) {
        const s = app.state;
        const palette = app.resolvePaletteColors(1);
        const defaultColor = (palette && palette[0]) || '#4e79a7';
        const current = s.customColors[CUSTOM_KEY] || defaultColor;

        const inputEl = app.$('barFillColor');
        if (inputEl) inputEl.value = current;

        const container = app.$('colorAssignContainer');
        if (!container) return;

        PC.renderColorAssignment(container, {
            items: [{ name: T.barColorName, color: current }],
            onChange: function (idx, newColor) {
                s.customColors[CUSTOM_KEY] = newColor;
                if (inputEl) inputEl.value = newColor;
                if (s.currentSvg) app.drawChart();
            },
            onResetAll: function () {
                delete s.customColors[CUSTOM_KEY];
                refreshBarColor(app);
                if (s.currentSvg) app.drawChart();
            }
        });
    }

    function drawHistogram(app) {
        const s = app.state;
        app.toolbarTip.textContent = '';

        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.value) { app.showTip('msgTip3', T.selectCol, 'error'); return; }

        const values = getValues(app);
        if (!values.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const p = readHistParams(app);
        const binData = computeBins(values, p);
        if (!binData || !binData.binCount) {
            app.showTip('msgTip3', T.noValid, 'error');
            return;
        }

        const isH = (s.barDirection === 'horizontal');
        const axisCfg = s.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        const stats = StatCommon.calcStats(values);
        const mean  = stats ? stats.mean : 0;
        const sd    = stats ? stats.sd   : 1;

        let freqMax = 0;
        binData.bins.forEach(b => {
            const v = (p.displayMode === 'frequency')
                ? (binData.total > 0 ? b.count / binData.total * 100 : 0)
                : b.count;
            if (v > freqMax) freqMax = v;
        });

        let freqFit = 0;
        if (p.showNormalFit && sd > 0) {
            const pdfMax = 1 / (sd * Math.sqrt(2 * Math.PI));
            if (p.displayMode === 'frequency') {
                freqFit = pdfMax * binData.binWidth * 100;
            } else {
                freqFit = pdfMax * binData.binWidth * binData.total;
            }
        }
        const freqTop = Math.max(freqMax, freqFit, 1);

        const barFill = p.barFillColor;

        const valueAxisCfg = isH ? axisCfg.y : axisCfg.x;
        const freqAxisCfg  = isH ? axisCfg.x : axisCfg.y;

        const margin = 30;
        const areaX = margin;
        const areaY = margin;
        const areaW = p.width - 2 * margin;
        const areaH = p.height - 2 * margin;

        const leftCfg = isH ? valueAxisCfg : freqAxisCfg;
        const bottomCfg = isH ? freqAxisCfg : valueAxisCfg;

        const leftLabelFont = leftCfg.tickValueShow ? leftCfg.tickFontSize : 0;
        const leftTitleFont = (leftCfg.titleShow && leftCfg.titleContent) ? leftCfg.titleFontSize + 8 : 0;
        const bottomLabelFont = bottomCfg.tickValueShow ? bottomCfg.tickFontSize : 0;
        const bottomTitleFont = (bottomCfg.titleShow && bottomCfg.titleContent) ? bottomCfg.titleFontSize + 8 : 0;

        let leftPad;
        if (isH) {
            let maxW = 0;
            const step = Math.max(1, Math.floor(binData.binCount / 8));
            for (let i = 0; i < binData.binCount; i += step) {
                const w = PC.estTextWidth(String(binData.bins[i].lo.toFixed(1)), leftLabelFont || 12);
                if (w > maxW) maxW = w;
            }
            if (maxW < 20) maxW = 20;
            leftPad = maxW + 8 + leftTitleFont + 10;
        } else {
            leftPad = leftLabelFont + 10 + leftTitleFont + 10;
        }
        const bottomPad = bottomLabelFont + 12 + bottomTitleFont + 10;
        const rightPad = 30;
        const topPad = 20;

        const plotX = areaX + leftPad;
        const plotY = areaY + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, areaH - topPad - bottomPad);

        const valuePad = (binData.max - binData.min) * 0.02 || 1;
        const valueDomain = [binData.min - valuePad, binData.max + valuePad];
        const freqDomain = PlotAxis.resolveDomain(freqAxisCfg, [0, freqTop]);

        let valueScale, freqScale;
        if (isH) {
            valueScale = d3.scaleLinear().domain(valueDomain).range([plotY + plotH, plotY]).nice();
            freqScale  = d3.scaleLinear().domain(freqDomain).range([plotX, plotX + plotW]).nice();
        } else {
            valueScale = d3.scaleLinear().domain(valueDomain).range([plotX, plotX + plotW]).nice();
            freqScale  = d3.scaleLinear().domain(freqDomain).range([plotY + plotH, plotY]).nice();
        }

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        if (valueAxisCfg.gridShow) {
            const ticks = valueScale.ticks ? valueScale.ticks() : valueScale.domain();
            ticks.forEach(t => {
                const pos = valueScale(t);
                if (!isFinite(pos)) return;
                const line = svg.append('line')
                    .attr('stroke', valueAxisCfg.gridColor)
                    .attr('stroke-dasharray', valueAxisCfg.gridDash)
                    .attr('stroke-width', 1);
                if (isH) {
                    line.attr('x1', plotX).attr('x2', plotX + plotW)
                        .attr('y1', pos).attr('y2', pos);
                } else {
                    line.attr('x1', pos).attr('x2', pos)
                        .attr('y1', plotY).attr('y2', plotY + plotH);
                }
            });
        }
        if (freqAxisCfg.gridShow) {
            const ticks = freqScale.ticks ? freqScale.ticks() : freqScale.domain();
            ticks.forEach(t => {
                const pos = freqScale(t);
                if (!isFinite(pos)) return;
                const line = svg.append('line')
                    .attr('stroke', freqAxisCfg.gridColor)
                    .attr('stroke-dasharray', freqAxisCfg.gridDash)
                    .attr('stroke-width', 1);
                if (isH) {
                    line.attr('x1', pos).attr('x2', pos)
                        .attr('y1', plotY).attr('y2', plotY + plotH);
                } else {
                    line.attr('x1', plotX).attr('x2', plotX + plotW)
                        .attr('y1', pos).attr('y2', pos);
                }
            });
        }

        const barsG = svg.append('g').attr('class', 'bars');
        const freqZeroPx = freqScale(0);

        binData.bins.forEach(b => {
            const freqVal = (p.displayMode === 'frequency')
                ? (binData.total > 0 ? b.count / binData.total * 100 : 0)
                : b.count;

            const vA = valueScale(b.lo);
            const vB = valueScale(b.hi);
            const f0 = freqZeroPx;
            const f1 = freqScale(freqVal);

            if (isH) {
                const fullH = Math.abs(vA - vB);
                const rectH = Math.max(1, fullH * (1 - p.barGap));
                const rectY = Math.min(vA, vB) + (fullH - rectH) / 2;
                const x0 = Math.min(f0, f1);
                const x1 = Math.max(f0, f1);

                barsG.append('rect')
                    .attr('x', x0).attr('y', rectY)
                    .attr('width', Math.max(1, x1 - x0)).attr('height', rectH)
                    .attr('fill', barFill)
                    .attr('stroke', p.barStrokeWidth > 0 ? p.barStrokeColor : 'none')
                    .attr('stroke-width', p.barStrokeWidth);

                if (p.barShowValue && b.count > 0) {
                    const label = (p.displayMode === 'frequency')
                        ? freqVal.toFixed(1) + '%'
                        : String(b.count);
                    barsG.append('text')
                        .attr('x', x1 + 4)
                        .attr('y', rectY + rectH / 2)
                        .attr('text-anchor', 'start')
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', p.barValueFontSize)
                        .attr('fill', '#333')
                        .text(label);
                }
            } else {
                const fullW = Math.abs(vA - vB);
                const rectW = Math.max(1, fullW * (1 - p.barGap));
                const rectX = Math.min(vA, vB) + (fullW - rectW) / 2;
                const y0 = Math.min(f0, f1);
                const y1 = Math.max(f0, f1);

                barsG.append('rect')
                    .attr('x', rectX).attr('y', y0)
                    .attr('width', rectW).attr('height', Math.max(1, y1 - y0))
                    .attr('fill', barFill)
                    .attr('stroke', p.barStrokeWidth > 0 ? p.barStrokeColor : 'none')
                    .attr('stroke-width', p.barStrokeWidth);

                if (p.barShowValue && b.count > 0) {
                    const label = (p.displayMode === 'frequency')
                        ? freqVal.toFixed(1) + '%'
                        : String(b.count);
                    barsG.append('text')
                        .attr('x', rectX + rectW / 2)
                        .attr('y', y0 - 4)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', p.barValueFontSize)
                        .attr('fill', '#333')
                        .text(label);
                }
            }
        });

        if (p.showNormalFit && sd > 0 && isFinite(mean) && SF) {
            const vLo = Math.max(valueScale.domain()[0], binData.min);
            const vHi = Math.min(valueScale.domain()[1], binData.max);
            const pts = SF.sampleNormalCurve({
                mu: mean, sigma: sd,
                xMin: vLo, xMax: vHi,
                n: 200,
                mode: p.displayMode,
                binWidth: binData.binWidth,
                total: binData.total
            });
            if (pts.length) {
                let d = '';
                pts.forEach((pt, i) => {
                    const vp = valueScale(pt.x);
                    const fp = freqScale(pt.y);
                    const px = isH ? fp : vp;
                    const py = isH ? vp : fp;
                    d += (i === 0 ? 'M' : 'L') + px + ' ' + py + ' ';
                });
                const path = svg.append('path')
                    .attr('class', 'normal-fit')
                    .attr('d', d)
                    .attr('fill', 'none')
                    .attr('stroke', p.normalColor)
                    .attr('stroke-width', p.normalWidth);
                if (p.normalDash) path.attr('stroke-dasharray', '6 4');
            }
        }

        if (p.showFitStats && stats && window.PlotFormula) {
            PlotFormula.draw(svg, {
                app: app,
                p: p,
                lines: [
                    [{ text: 'N', italic: true }, { text: ' = ' }, { text: String(stats.n) }],
                    [{ text: 'μ', italic: true }, { text: ' = ' }, { text: stats.mean.toFixed(2) }],
                    [{ text: 'σ', italic: true }, { text: ' = ' }, { text: stats.sd.toFixed(2) }]
                ],
                anchor: 'top-right',
                margin: 15,
                fontSize: 14,
                color: '#333',
                bold: true
            });
        }

        const midFmt = midTickFormat(binData.binWidth, p.tickDecimals);

        const bottomScale = isH ? freqScale : valueScale;
        let bTickVals;
        const bUserTicks = PlotAxis.resolveTicks(bottomCfg, bottomScale);
        if (bUserTicks && bUserTicks.length) {
            bTickVals = bUserTicks;
        } else if (!isH && p.midpointTicks) {
            bTickVals = computeMidTicks(binData, 15);
        } else {
            bTickVals = bottomScale.ticks ? bottomScale.ticks() : null;
        }
        const bAxisFn = d3.axisBottom(bottomScale);
        if (bTickVals && bTickVals.length) {
            bAxisFn.tickValues(bTickVals);
            if (!isH && p.midpointTicks && !bUserTicks && midFmt) {
                bAxisFn.tickFormat(midFmt);
            }
        }
        const bAxisG = svg.append('g').attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + (plotY + plotH) + ')')
            .call(bAxisFn);
        PlotAxis.applyAxis(bAxisG, bottomCfg, 'bottom');

        const leftScale = isH ? valueScale : freqScale;
        let lTickVals;
        const lUserTicks = PlotAxis.resolveTicks(leftCfg, leftScale);
        if (lUserTicks && lUserTicks.length) {
            lTickVals = lUserTicks;
        } else if (isH && p.midpointTicks) {
            lTickVals = computeMidTicks(binData, 12);
        } else {
            lTickVals = leftScale.ticks ? leftScale.ticks() : null;
        }
        const lAxisFn = d3.axisLeft(leftScale);
        if (lTickVals && lTickVals.length) {
            lAxisFn.tickValues(lTickVals);
            if (isH && p.midpointTicks && !lUserTicks && midFmt) {
                lAxisFn.tickFormat(midFmt);
            }
        }
        const lAxisG = svg.append('g').attr('class', 'y-axis')
            .attr('transform', 'translate(' + plotX + ',0)')
            .call(lAxisFn);
        PlotAxis.applyAxis(lAxisG, leftCfg, 'left');

        if (bottomCfg.titleShow && bottomCfg.titleContent) {
            svg.append('text')
                .attr('x', plotX + plotW / 2)
                .attr('y', plotY + plotH + bottomPad - 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', bottomCfg.titleFontSize)
                .attr('font-weight', bottomCfg.titleBold ? 'bold' : 'normal')
                .attr('font-style', bottomCfg.titleItalic ? 'italic' : 'normal')
                .attr('fill', '#333')
                .text(bottomCfg.titleContent);
        }
        if (leftCfg.titleShow && leftCfg.titleContent) {
            svg.append('text')
                .attr('transform', 'translate(' + (plotX - leftPad + 12) + ',' + (plotY + plotH / 2) + ') rotate(-90)')
                .attr('text-anchor', 'middle')
                .attr('font-size', leftCfg.titleFontSize)
                .attr('font-weight', leftCfg.titleBold ? 'bold' : 'normal')
                .attr('font-style', leftCfg.titleItalic ? 'italic' : 'normal')
                .attr('fill', '#333')
                .text(leftCfg.titleContent);
        }

        if (p.showLegend && p.showNormalFit) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: [{ name: T.legendFit, percent: null }],
                colors: [p.normalColor],
                shapeOf: () => (p.normalDash ? 'dashline' : 'line'),
                labelFormatter: it => it.name
            });
        }

        PlotAxis.applyFontFamily(svg, p.fontFamily);

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    function updateBinModeUI(app) {
        const $ = app.$;
        const mode = ($('binMode') && $('binMode').value) || 'count';
        if ($('binCountItem'))   $('binCountItem').style.display   = (mode === 'count')   ? '' : 'none';
        if ($('binSpacingItem')) $('binSpacingItem').style.display = (mode === 'spacing') ? '' : 'none';
    }

    function updateRangeUI(app) {
        const $ = app.$;
        const auto = $('autoRange') ? $('autoRange').checked : true;
        if ($('rangeMin')) $('rangeMin').disabled = auto;
        if ($('rangeMax')) $('rangeMax').disabled = auto;
    }

    PlotApp.create({
        exportName: 'histogram',
        exampleData: EX_DATA,
        importInfo: EN
            ? 'Must include a header row with at least a <strong>numeric column</strong>. You can paste directly from Excel.'
            : '需包含表头，且至少包含 <strong>数值列</strong>。可直接粘贴 Excel 内容。',

        stateExtra: (function () {
            const base = BarCommon.createStateExtra();
            base.roles = { category: '', value: '' };
            return base;
        })(),

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = 'Fit';
            }
        },

        refreshColors: function (app) {
            refreshBarColor(app);
        },

        setup: function (app) {
            syncAxisTitles(app);
            refreshAxisPanel(app);
            refreshBarColor(app);

            const valSel = app.$('valColSel');
            if (valSel) {
                valSel.addEventListener('change', function () {
                    app.state.roles.value = valSel.value;
                    syncAxisTitles(app);
                    refreshAxisPanel(app);
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const binModeEl = app.$('binMode');
            if (binModeEl) {
                binModeEl.addEventListener('change', function () {
                    updateBinModeUI(app);
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const autoEl = app.$('autoRange');
            if (autoEl) {
                autoEl.addEventListener('change', function () {
                    updateRangeUI(app);
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const midEl = app.$('midpointTicks');
            if (midEl) {
                midEl.addEventListener('change', function () {
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const decEl = app.$('tickDecimals');
            if (decEl) {
                decEl.addEventListener('change', function () {
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const barFillEl = app.$('barFillColor');
            if (barFillEl) {
                barFillEl.addEventListener('input', function () {
                    app.state.customColors[CUSTOM_KEY] = barFillEl.value;
                    refreshBarColor(app);
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const dispEl = app.$('displayMode');
            if (dispEl) {
                dispEl.addEventListener('change', function () {
                    syncAxisTitles(app);
                    refreshAxisPanel(app);
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            updateBinModeUI(app);
            updateRangeUI(app);
            fillValSelect(app);
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = res.columnTypes || {};
            const nums = res.headers.filter(h => s.columnTypes[h] === 'numeric');
            s.roles.value = nums[0] || res.headers[0];
            syncAxisTitles(app);
            fillValSelect(app);
            refreshAxisPanel(app);
            refreshBarColor(app);
        },

        onReset: function (app) {
            const s = app.state;
            s.columnTypes = {};
            s.roles = { category: '', value: '' };
            s.customColors = {};
            s.axis = PlotAxis.defaultState();
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            syncAxisTitles(app);
            fillValSelect(app);
            updateBinModeUI(app);
            updateRangeUI(app);
            refreshAxisPanel(app);
            refreshBarColor(app);
        },

        onStateRestored: function (app) {
            fillValSelect(app);
            updateBinModeUI(app);
            updateRangeUI(app);
            syncAxisTitles(app);
            refreshAxisPanel(app);
            refreshBarColor(app);
        },

        drawChart: function (app) {
            drawHistogram(app);
        }
    });
})();
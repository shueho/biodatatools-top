(function () {
    'use strict';

    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Must include a header row with at least a <strong>category column</strong> and a <strong>value column</strong>. Three examples are provided: no error bars, range (lower/upper) error bars, and error-value bars.'
            : '需包含表头，且至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>。示例提供三个版本：无误差棒、上下限（范围）误差棒、误差值误差棒。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select the category and value columns in step 2' : '❌ 请在第 2 步选择分类列和数值列',
        noValid: EN ? '❌ Could not generate valid plot data. Please check the value column' : '❌ 未能生成有效绘图数据，请检查数值列'
    };

    const EX_NO_ERR = 'Category\tValue\nA\t180\nB\t320\nC\t75\nD\t240\nE\t50\nF\t150\nG\t290';
    const EX_RANGE = 'Category\tValue\tLower\tUpper\nA\t180\t160\t200\nB\t320\t290\t350\nC\t75\t60\t90\nD\t240\t215\t265\nE\t50\t40\t60\nF\t150\t130\t170\nG\t290\t265\t315';
    const EX_ERRVAL = 'Category\tValue\tError\nA\t180\t20\nB\t320\t30\nC\t75\t15\nD\t240\t25\nE\t50\t10\nF\t150\t20\nG\t290\t25';

    function num(app, id, fallback) {
        const el = app.$(id);
        if (!el) return fallback;
        const v = parseFloat(el.value);
        return isFinite(v) ? v : fallback;
    }

    function estTextWidth(str, fontSize) {
        let w = 0;
        for (const ch of String(str)) w += /[\u4e00-\u9fa5\uff00-\uffef]/.test(ch) ? 1 : 0.55;
        return w * fontSize;
    }

    function fmtNum(v, d) {
        if (!isFinite(v)) return '';
        if (Number.isInteger(v)) return String(v);
        return Number(v).toFixed(d);
    }

    function textColorOn(bg) {
        const rgb = PlotCommon.hexToRgb(bg);
        const lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        return lum > 165 ? '#333333' : '#ffffff';
    }

    function getMaxValue(app) {
        const items = app.getCategoryItems();
        if (!items.length) return 1;
        const mx = Math.max.apply(null, items.map(d => d.value));
        return (isFinite(mx) && mx > 0) ? mx : 1;
    }

    function updateRefModeUI(app) {
        const sel = app.$('refMode');
        const input = app.$('refValue');
        const isCustom = sel.value === 'custom';
        input.disabled = !isCustom;
        input.style.opacity = isCustom ? '1' : '.5';
        if (!app.state.refValueEdited) input.value = getMaxValue(app);
    }

    function getItemsWithRows(app) {
        const items = app.getCategoryItems();
        const catKey = app.state.roles.category;
        const rowMap = new Map();
        app.state.data.forEach(row => {
            const k = String(row[catKey]);
            if (!rowMap.has(k)) rowMap.set(k, row);
        });
        return items.map(it => Object.assign({}, it, { _firstRow: rowMap.get(it.name) || {} }));
    }

    function refreshErrorBarPanel(app) {
        PlotErrorBar.renderErrorBarConfig(app.$('errorBarPanelContainer'), {
            headers: app.state.headers,
            state: app.state.errBar,
            onChange: () => { if (app.state.currentSvg) app.drawChart(); }
        });
    }

    PlotApp.create({
        exportName: 'radial_bar_chart',
        importInfo: T.importInfo,
        examples: [
            { label: EN ? 'Example: no error bars' : '示例：无误差棒', data: EX_NO_ERR },
            { label: EN ? 'Example: range bars' : '示例：范围棒', data: EX_RANGE },
            { label: EN ? 'Example: error-value bars' : '示例：误差值棒', data: EX_ERRVAL }
        ],
        stateExtra: {
            refValueEdited: false,
            errBar: {
                mode: 'none', lowerCol: '', upperCol: '', errCol: '',
                showWhich: 'both', colorMode: 'uniform',
                errColor: '#e67700', errWidth: 3
            }
        },

        setup: function (app) {
            updateRefModeUI(app);
            refreshErrorBarPanel(app);
            app.$('refMode').addEventListener('change', () => {
                updateRefModeUI(app);
                if (app.state.currentSvg) app.drawChart();
            });
            app.$('refValue').addEventListener('input', () => {
                app.state.refValueEdited = true;
            });
        },
        onDataImported: function (app) {
            app.state.refValueEdited = false;
            app.state.errBar.mode = 'none';
            app.state.errBar.lowerCol = '';
            app.state.errBar.upperCol = '';
            app.state.errBar.errCol = '';
            updateRefModeUI(app);
            refreshErrorBarPanel(app);
        },
        onRoleChanged: function (app) {
            app.state.refValueEdited = false;
            updateRefModeUI(app);
        },
        onReset: function (app) {
            app.state.refValueEdited = false;
            app.state.errBar.mode = 'none';
            app.state.errBar.lowerCol = '';
            app.state.errBar.upperCol = '';
            app.state.errBar.errCol = '';
            updateRefModeUI(app);
            refreshErrorBarPanel(app);
        },

        readParams: function (app) {
            const $ = app.$;
            return {
                width: Math.max(200, num(app, 'chartWidth', 760)),
                height: Math.max(200, num(app, 'chartHeight', 680)),

                innerRadius: Math.max(0, num(app, 'innerRadius', 50)),
                outerRadius: Math.max(60, num(app, 'outerRadius', 230)),
                ringGap: Math.max(0, num(app, 'ringGap', 8)),
                startAngle: num(app, 'startAngle', 0),
                direction: $('orbitDirection').value || 'clockwise',
                ringOrder: $('ringOrder').value || 'inner',

                refMode: $('refMode').value || 'max',
                refValue: num(app, 'refValue', 1),

                showTrackBg: $('showTrackBg').checked,
                trackBgColor: $('trackBgColor').value || '#eef2f7',
                showTrackStroke: $('showTrackStroke').checked,
                trackStrokeColor: $('trackStrokeColor').value || '#d0d8e2',
                roundCap: $('roundCap').checked,

                fontFamily: $('fontFamily').value || 'Times New Roman',

                labelContent: $('labelContent').value || 'none',
                labelDecimals: Math.max(0, Math.round(num(app, 'labelDecimals', 1))),
                labelFontSize: Math.max(6, num(app, 'labelFontSize', 13)),
                labelBold: $('labelBold').checked,
                labelItalic: $('labelItalic').checked,

                legendFontSize: Math.max(6, num(app, 'legendFontSize', 15)),
                legendBold: $('legendBold').checked,
                legendItalic: $('legendItalic').checked,
                legendTitleFontSize: Math.max(6, num(app, 'legendTitleFontSize', 15)),
                legendTitleBold: $('legendTitleBold').checked,
                legendTitleItalic: $('legendTitleItalic').checked,

                titleFontSize: Math.max(6, num(app, 'titleFontSize', 22)),
                titleBold: $('titleBold').checked,
                titleItalic: $('titleItalic').checked,
                titlePosition: $('titlePosition').value || 'top-center',

                showLegend: $('showLegend').checked,
                legendPosition: $('legendPosition').value || 'right',
                legendGap: Math.max(0, num(app, 'legendGap', 30)),
                showLegendTitle: $('showLegendTitle').checked,
                legendTitle: $('legendTitle').value || '',
                showTitle: $('showTitle').checked,
                chartTitle: $('chartTitle').value || '',
                showCanvasBorder: $('showCanvasBorder').checked
            };
        },

        buildData: function (app, p) {
            return getItemsWithRows(app);
        },

        computeLayout: function (p, items, app) {
            const width = p.width;
            const height = p.height;
            const titleH = (p.showTitle && p.chartTitle) ? p.titleFontSize + 10 : 0;

            const legendColW = 200;
            const legendRowH = p.legendFontSize + 10;
            const hasLegendTitle = !!(p.showLegendTitle && p.legendTitle && p.legendTitle.trim());
            const legendTitleH = hasLegendTitle ? (p.legendTitleFontSize + 10) : 0;
            const legendInlineH = p.legendFontSize + 20 + legendTitleH;
            const gap = p.legendGap;
            const margin = 30;

            const wantLegend = !!p.showLegend && items.length > 0;
            const pos = p.legendPosition || 'right';
            const isRight = wantLegend && pos === 'right';
            const isLeft = wantLegend && pos === 'left';
            const isTop = wantLegend && pos === 'top';
            const isBottom = wantLegend && pos === 'bottom';
            const vert = isRight || isLeft;

            let areaX = margin, areaY = margin;
            let areaW = width - 2 * margin;
            let areaH = height - 2 * margin;

            if (isRight) {
                areaW = width - legendColW - gap - 2 * margin;
            } else if (isLeft) {
                areaX = legendColW + gap + margin;
                areaW = width - legendColW - gap - 2 * margin;
            } else if (isTop) {
                areaY = legendInlineH + gap + margin;
                areaH = height - legendInlineH - gap - 2 * margin;
            } else if (isBottom) {
                areaH = height - legendInlineH - gap - 2 * margin;
            }
            areaW = Math.max(20, areaW);
            areaH = Math.max(20, areaH);

            const gridAreaH = Math.max(20, areaH - titleH);
            const availR = Math.max(20, Math.min(areaW / 2, gridAreaH / 2));

            let outerR = Math.max(p.innerRadius + 20, p.outerRadius);
            let innerR = Math.max(0, p.innerRadius);
            if (outerR > availR) {
                const k = availR / outerR;
                outerR *= k;
                innerR *= k;
            }
            innerR = Math.min(innerR, outerR - 10);

            const blockH = titleH + outerR * 2;
            const blockTop = areaY + Math.max(0, (areaH - blockH) / 2);
            const cx = areaX + areaW / 2;
            const cy = blockTop + titleH + outerR;

            return {
                width: width, height: height, cx: cx, cy: cy,
                innerR: innerR, outerR: outerR,
                legendVertical: vert, legendColW: legendColW,
                legendInlineH: legendInlineH, hasLegendTitle: hasLegendTitle,
                isRight: isRight, isTop: isTop,
                areaY: areaY, areaH: areaH, margin: margin, gap: gap
            };
        },

        draw: function (ctx) {
            const { app, root, p, data: items, layout: L, colors } = ctx;
            const { width, height, cx, cy, innerR, outerR, legendVertical, legendColW,
                    legendInlineH, hasLegendTitle, isRight, isTop, areaY, areaH, margin, gap } = L;
            const N = items.length;

            const maxValue = Math.max.apply(null, items.map(d => d.value));
            let ref = (p.refMode === 'max') ? maxValue : p.refValue;
            if (!isFinite(ref) || ref <= 0) ref = maxValue;
            if (!isFinite(ref) || ref <= 0) ref = 1;

            const spanR = Math.max(10, outerR - innerR);
            let ringGap = p.ringGap;
            let ringW = (N === 1) ? spanR : (spanR - ringGap * (N - 1)) / N;
            if (ringW < 2) {
                ringW = Math.max(1, spanR / N);
                ringGap = (N > 1) ? Math.max(0, (spanR - ringW * N) / (N - 1)) : 0;
            }

            function rMidOf(i) {
                const idx = (p.ringOrder === 'outer') ? (N - 1 - i) : i;
                return innerR + idx * (ringW + ringGap) + ringW / 2;
            }

            const startDeg = p.startAngle;
            const isCCW = p.direction === 'counterclockwise';
            const startRad = startDeg * Math.PI / 180;

            function angleAt(t) {
                return isCCW ? (startRad - t * 2 * Math.PI) : (startRad + t * 2 * Math.PI);
            }
            function pointAt(r, t) {
                const a = angleAt(t);
                return [r * Math.sin(a), -r * Math.cos(a)];
            }

            const g = root.append('g').attr('transform', 'translate(' + cx + ',' + cy + ')');

            if (p.showTrackBg || p.showTrackStroke) {
                const bgGroup = g.append('g').attr('class', 'orbit-tracks');
                items.forEach((it, i) => {
                    const rMid = rMidOf(i);
                    if (p.showTrackBg) {
                        bgGroup.append('circle')
                            .attr('cx', 0).attr('cy', 0)
                            .attr('r', rMid)
                            .attr('fill', 'none')
                            .attr('stroke', p.trackBgColor)
                            .attr('stroke-width', ringW);
                    }
                    if (p.showTrackStroke) {
                        const rOuter = rMid + ringW / 2;
                        const rInner = rMid - ringW / 2;
                        if (rOuter > 1) {
                            bgGroup.append('circle')
                                .attr('cx', 0).attr('cy', 0).attr('r', rOuter)
                                .attr('fill', 'none').attr('stroke', p.trackStrokeColor).attr('stroke-width', 1);
                        }
                        if (rInner > 1) {
                            bgGroup.append('circle')
                                .attr('cx', 0).attr('cy', 0).attr('r', rInner)
                                .attr('fill', 'none').attr('stroke', p.trackStrokeColor).attr('stroke-width', 1);
                        }
                    }
                });
            }

            const arcGroup = g.append('g').attr('class', 'orbit-arcs');
            const errGroup = g.append('g').attr('class', 'orbit-error-bars');
            const labelGroup = g.append('g').attr('class', 'orbit-labels');

            const labelWeight = p.labelBold ? 'bold' : 'normal';
            const labelStyle = p.labelItalic ? 'italic' : 'normal';

            items.forEach((it, i) => {
                const rMid = rMidOf(i);
                const C = 2 * Math.PI * rMid;
                const frac = Math.max(0, Math.min(1, it.value / ref));
                const arcDeg = frac * 360;
                const dashLen = Math.min(C, frac * C);
                const rotDeg = startDeg - 90;

                if (dashLen > 0) {
                    const circleEl = arcGroup.append('circle')
                        .attr('cx', 0).attr('cy', 0)
                        .attr('r', rMid)
                        .attr('fill', 'none')
                        .attr('stroke', colors[i])
                        .attr('stroke-width', ringW)
                        .attr('stroke-dasharray', dashLen + ' ' + C)
                        .attr('stroke-linecap', p.roundCap ? 'round' : 'butt')
                        .style('cursor', 'pointer');

                    if (isCCW) {
                        circleEl.attr('transform', 'rotate(' + rotDeg + ') scale(1,-1)');
                    } else {
                        circleEl.attr('transform', 'rotate(' + rotDeg + ')');
                    }

                    circleEl
                        .on('mouseenter', function () {
                            d3.select(this).transition().duration(120).attr('stroke-width', ringW * 1.18);
                        })
                        .on('mouseleave', function () {
                            d3.select(this).transition().duration(120).attr('stroke-width', ringW);
                        });
                }

                if (app.state.errBar.mode !== 'none') {
                    const ext = PlotErrorBar.computeErrorExtent(it._firstRow, it.value, app.state.errBar);
                    if (ext) {
                        let t1 = ext.lower / ref;
                        let t2 = ext.upper / ref;
                        t1 = Math.max(0, Math.min(1, t1));
                        t2 = Math.max(0, Math.min(1, t2));
                        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }

                        if (t2 - t1 > 0.0005) {
                            const p1 = pointAt(rMid, t1);
                            const p2 = pointAt(rMid, t2);
                            const sweep = isCCW ? 0 : 1;
                            const largeArc = (t2 - t1) > 0.5 ? 1 : 0;
                            const errColor = PlotErrorBar.resolveErrorColor(app.state.errBar, colors[i]);

                            errGroup.append('path')
                                .attr('d', 'M ' + p1[0] + ' ' + p1[1] + ' A ' + rMid + ' ' + rMid + ' 0 ' + largeArc + ' ' + sweep + ' ' + p2[0] + ' ' + p2[1])
                                .attr('fill', 'none')
                                .attr('stroke', errColor)
                                .attr('stroke-width', app.state.errBar.errWidth)
                                .attr('stroke-linecap', 'butt')
                                .attr('pointer-events', 'none');

                            const capLen = Math.max(6, ringW * 0.7);
                            [t1, t2].forEach(t => {
                                const a = angleAt(t);
                                const ux = Math.sin(a);
                                const uy = -Math.cos(a);
                                const r1 = rMid - capLen / 2;
                                const r2 = rMid + capLen / 2;
                                errGroup.append('line')
                                    .attr('x1', r1 * ux).attr('y1', r1 * uy)
                                    .attr('x2', r2 * ux).attr('y2', r2 * uy)
                                    .attr('stroke', errColor)
                                    .attr('stroke-width', app.state.errBar.errWidth)
                                    .attr('stroke-linecap', 'round')
                                    .attr('pointer-events', 'none');
                            });
                        }
                    }
                }

                if (p.labelContent === 'none' || arcDeg <= 0) return;

                let midClock;
                if (isCCW) midClock = startDeg - arcDeg / 2;
                else midClock = startDeg + arcDeg / 2;

                const scrRad = (midClock - 90) * Math.PI / 180;
                const lx = rMid * Math.cos(scrRad);
                const ly = rMid * Math.sin(scrRad);

                let txt = '';
                switch (p.labelContent) {
                    case 'name': txt = it.name; break;
                    case 'value': txt = fmtNum(it.value, p.labelDecimals); break;
                    case 'pct': txt = (it.percent * 100).toFixed(p.labelDecimals) + '%'; break;
                    case 'name_pct': txt = it.name + ' (' + (it.percent * 100).toFixed(p.labelDecimals) + '%)'; break;
                }
                if (!txt) return;

                const arcPx = (arcDeg / 360) * C;
                const needPx = estTextWidth(txt, p.labelFontSize);
                if (arcPx < needPx * 0.85) return;

                labelGroup.append('text')
                    .attr('x', lx).attr('y', ly)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', p.labelFontSize)
                    .attr('font-weight', labelWeight)
                    .attr('font-style', labelStyle)
                    .attr('fill', textColorOn(colors[i]))
                    .attr('pointer-events', 'none')
                    .text(txt);
            });

            if (p.showLegend && items.length) {
                let legendArea, orientation;
                if (legendVertical) {
                    orientation = 'vertical';
                    legendArea = { x: isRight ? (width - legendColW - gap) : 0, y: areaY, w: legendColW, h: areaH };
                } else {
                    orientation = 'horizontal';
                    legendArea = { x: 0, y: isTop ? margin : (height - legendInlineH - margin), w: width, h: legendInlineH };
                }
                PlotLegend.draw(root, {
                    orientation: orientation,
                    area: legendArea,
                    width: width,
                    items: items.map((it, i) => ({
                        label: it.name + ' (' + (it.percent * 100).toFixed(1) + '%)',
                        color: colors[i],
                        shape: 'rect'
                    })),
                    fontSize: p.legendFontSize,
                    bold: p.legendBold,
                    italic: p.legendItalic,
                    markerSize: p.legendFontSize,
                    textGap: 8,
                    itemGap: 20,
                    showTitle: hasLegendTitle,
                    title: p.legendTitle,
                    titleFontSize: p.legendTitleFontSize,
                    titleBold: p.legendTitleBold,
                    titleItalic: p.legendTitleItalic
                });
            }
        }
    });
})();
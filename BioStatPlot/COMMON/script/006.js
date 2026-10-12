(function () {
    'use strict';

    function num(app, id, fallback) {
        const el = app.$(id);
        if (!el) return fallback;
        const v = parseFloat(el.value);
        return isFinite(v) ? v : fallback;
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

    PlotApp.create({
        exportName: 'concentric_ring_chart',
        exampleData: 'Category\tValue\nA\t420\nB\t120\nC\t300\nD\t80\nE\t380\nF\t160\nG\t240',
        importInfo: PlotI18N.lang() === 'en'
            ? 'Must include a header row with at least a <strong>category column</strong> and a <strong>value column</strong>. You can paste directly from Excel.'
            : '需包含表头，且至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>。可直接粘贴 Excel 内容。',
        stateExtra: { sortDir: 'asc' },

        onDataImported: function (app) {
            app.state.sortBy = '__input__';
            app.state.sortDir = 'asc';
            if (app.sortDirSel) app.sortDirSel.value = 'asc';
        },
        onReset: function (app) {
            app.state.sortDir = 'asc';
            if (app.sortDirSel) app.sortDirSel.value = 'asc';
        },

        readParams: function (app) {
            const $ = app.$;
            return {
                width: Math.max(200, num(app, 'chartWidth', 760)),
                height: Math.max(200, num(app, 'chartHeight', 680)),

                innerRadius: Math.max(0, num(app, 'innerRadius', 40)),
                outerRadius: Math.max(60, num(app, 'outerRadius', 280)),
                ringGap: Math.max(0, num(app, 'ringGap', 3)),
                startAngle: num(app, 'startAngle', 0),
                endAngle: num(app, 'endAngle', 360),
                ringOrder: $('ringOrder').value || 'inner',

                showRingStroke: $('showRingStroke').checked,
                ringStrokeColor: $('ringStrokeColor').value || '#ffffff',
                ringStrokeWidth: Math.max(0, num(app, 'ringStrokeWidth', 1)),

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
            return app.getCategoryItems();
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
            const { root, p, data: items, layout: L, colors } = ctx;
            const { width, height, cx, cy, innerR, outerR, legendVertical, legendColW,
                    legendInlineH, hasLegendTitle, isRight, isTop, areaY, areaH, margin, gap } = L;
            const N = items.length;

            let gapPx = p.ringGap;
            const totalSpace = outerR - innerR;
            const maxGapPerRing = (N > 1) ? (totalSpace / (N * 3)) : 0;
            if (gapPx > maxGapPerRing) gapPx = maxGapPerRing;

            const totalGap = (N > 1) ? gapPx * (N - 1) : 0;
            const usableSpace = Math.max(1, totalSpace - totalGap);

            const ordered = (p.ringOrder === 'outer') ? items.slice().reverse() : items.slice();
            let cursor = innerR;
            ordered.forEach((it, idx) => {
                const thickness = it.percent * usableSpace;
                it.rIn = cursor;
                it.rOut = cursor + thickness;
                it.midR = (it.rIn + it.rOut) / 2;
                cursor = it.rOut + (idx < N - 1 ? gapPx : 0);
            });

            items.forEach((it, i) => { it._colorIdx = i; });

            let startDeg = p.startAngle;
            let endDeg = p.endAngle;
            if (endDeg <= startDeg) endDeg += 360;
            const isFullCircle = (endDeg - startDeg) >= 359.5;
            if (isFullCircle) endDeg = startDeg + 360;
            const startRad = startDeg * Math.PI / 180;
            const endRad = endDeg * Math.PI / 180;

            const g = root.append('g').attr('transform', 'translate(' + cx + ',' + cy + ')');

            const arcGen = d3.arc()
                .innerRadius(d => d.rIn)
                .outerRadius(d => d.rOut)
                .startAngle(startRad)
                .endAngle(endRad);

            g.selectAll('path.concentric-ring')
                .data(ordered).enter()
                .append('path')
                .attr('class', 'concentric-ring')
                .attr('d', arcGen)
                .attr('fill', d => colors[d._colorIdx])
                .attr('stroke', p.showRingStroke ? p.ringStrokeColor : 'none')
                .attr('stroke-width', p.showRingStroke ? p.ringStrokeWidth : 0)
                .style('cursor', 'pointer')
                .on('mouseenter', function () {
                    d3.select(this).transition().duration(120).attr('transform', 'scale(1.015)');
                })
                .on('mouseleave', function () {
                    d3.select(this).transition().duration(120).attr('transform', 'scale(1)');
                });

            if (p.labelContent !== 'none') {
                const labelWeight = p.labelBold ? 'bold' : 'normal';
                const labelStyle = p.labelItalic ? 'italic' : 'normal';
                const midDeg = isFullCircle ? startDeg : startDeg + (endDeg - startDeg) / 2;
                const midRad = midDeg * Math.PI / 180;

                ordered.forEach(d => {
                    const thickness = d.rOut - d.rIn;
                    if (thickness < 6) return;
                    let txt = '';
                    switch (p.labelContent) {
                        case 'name': txt = d.name; break;
                        case 'value': txt = fmtNum(d.value, p.labelDecimals); break;
                        case 'pct': txt = (d.percent * 100).toFixed(p.labelDecimals) + '%'; break;
                        case 'name_pct': txt = d.name + ' (' + (d.percent * 100).toFixed(p.labelDecimals) + '%)'; break;
                    }
                    if (!txt) return;

                    let fs = p.labelFontSize;
                    if (thickness < fs * 1.1) fs = Math.max(6, thickness * 0.85);

                    const lx = d.midR * Math.sin(midRad);
                    const ly = -d.midR * Math.cos(midRad);

                    g.append('text')
                        .attr('x', lx).attr('y', ly)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', fs)
                        .attr('font-weight', labelWeight)
                        .attr('font-style', labelStyle)
                        .attr('fill', textColorOn(colors[d._colorIdx]))
                        .attr('pointer-events', 'none')
                        .text(txt);
                });
            }

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
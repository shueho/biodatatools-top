(function () {
    'use strict';

    function num(app, id, fallback) {
        const el = app.$(id);
        if (!el) return fallback;
        const v = parseFloat(el.value);
        return isFinite(v) ? v : fallback;
    }

    function polarXY(r, angle) {
        return [r * Math.sin(angle), -r * Math.cos(angle)];
    }

    function estTextWidth(str, fontSize) {
        let w = 0;
        for (const ch of String(str)) w += /[\u4e00-\u9fa5\uff00-\uffef]/.test(ch) ? 1 : 0.55;
        return w * fontSize;
    }

    function buildValueText(item, p) {
        const pct = item.percent * 100;
        switch (p.valueContent) {
            case 'pct': return pct.toFixed(1) + '%';
            case 'value': return String(item.value);
            case 'pct_value': return pct.toFixed(1) + '% (' + item.value + ')';
        }
        return '';
    }

    function ringRadius(t, innerR, maxR, mode) {
        const f = mode === 'sqrt' ? Math.sqrt(t) : t;
        return innerR + (maxR - innerR) * f;
    }

    function petalRadius(ratio, innerR, maxR, mode) {
        const t = Math.max(0, Math.min(1, ratio));
        const f = mode === 'sqrt' ? Math.sqrt(t) : t;
        return Math.max(innerR + 2, innerR + (maxR - innerR) * f);
    }

    PlotApp.create({
        exportName: 'petal_chart',
        exampleData: 'Category\tValue\nA\t320\nB\t280\nC\t240\nD\t200\nE\t160\nF\t120\nG\t80',
        importInfo: PlotI18N.lang() === 'en'
            ? 'Must include a header row with at least a <strong>category column</strong> and a <strong>value column</strong>. You can paste directly from Excel.'
            : '需包含表头，且至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>。可直接粘贴 Excel 内容。',

        readParams: function (app) {
            const $ = app.$;
            return {
                width: Math.max(200, num(app, 'chartWidth', 700)),
                height: Math.max(200, num(app, 'chartHeight', 650)),
                outerRadius: Math.max(40, num(app, 'outerRadius', 220)),
                innerRadius: Math.max(0, num(app, 'innerRadius', 0)),
                radiusScale: $('radiusScale').value || 'linear',
                angleMode: $('angleMode').value || 'proportional',
                direction: $('pieDirection').value || 'clockwise',
                startAngle: Math.max(0, num(app, 'startAngle', 0)),
                gapAngle: Math.max(0, num(app, 'gapAngle', 2)),

                fontFamily: $('fontFamily').value || 'Times New Roman',
                labelFontSize: Math.max(6, num(app, 'labelFontSize', 14)),
                labelBold: $('labelBold').checked,
                labelItalic: $('labelItalic').checked,
                scaleFontSize: Math.max(6, num(app, 'scaleFontSize', 12)),
                scaleBold: $('scaleBold').checked,
                scaleItalic: $('scaleItalic').checked,
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
                showCanvasBorder: $('showCanvasBorder').checked,

                sliceStroke: $('sliceStroke').value || '#ffffff',
                strokeWidth: Math.max(0, num(app, 'strokeWidth', 1.5)),
                mergeSmall: $('mergeSmall').checked,
                mergeThreshold: Math.max(0, num(app, 'mergeThreshold', 3)),

                showRings: $('showRings').value || 'none',
                ringLevels: Math.max(1, Math.round(num(app, 'ringLevels', 4))),
                ringColor: $('ringColor').value || '#d8e2ec',
                ringWidth: Math.max(0, num(app, 'ringWidth', 1)),
                showRadial: $('showRadial').value || 'none',
                axisColor: $('axisColor').value || '#d8e2ec',
                axisWidth: Math.max(0, num(app, 'axisWidth', 1)),
                scalePos: $('scalePos').value || 'none',
                scaleType: $('scaleType').value || 'percent',
                scaleDecimals: Math.max(0, Math.round(num(app, 'scaleDecimals', 0))),

                namePosition: $('namePosition').value || 'inside',
                valuePosition: $('valuePosition').value || 'none',
                valueContent: $('valueContent').value || 'pct',
                labelOffset: Math.max(0, num(app, 'labelOffset', 20))
            };
        },

        buildData: function (app, p) {
            const items = app.getCategoryItems();
            if (!items.length) return [];
            if (p.mergeSmall && p.mergeThreshold > 0) {
                const big = [];
                let othersVal = 0;
                items.forEach(d => {
                    const pct = d.percent * 100;
                    if (pct < p.mergeThreshold) othersVal += d.value;
                    else big.push(d);
                });
                if (othersVal > 0) big.push({ name: 'Other', value: othersVal });
                const sum = big.reduce((s, d) => s + d.value, 0);
                big.forEach(d => d.percent = d.value / sum);
                return big;
            }
            return items;
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
                areaW = width - legendColW  - 2 * margin;
            } else if (isLeft) {
                areaX = legendColW + gap + margin;
                areaW = width - legendColW - 2 * margin;
            } else if (isTop) {
                areaY = legendInlineH + margin;
                areaH = height - legendInlineH - 2 * margin;
            } else if (isBottom) {
                areaH = height - legendInlineH - 2 * margin;
            }
            areaW = Math.max(20, areaW);
            areaH = Math.max(20, areaH);

            const gridAreaH = Math.max(20, areaH - titleH);
            const labelSpace = p.labelOffset + p.labelFontSize;

            const maxR = Math.max(20, Math.min(
                p.outerRadius,
                areaW / 2 - labelSpace,
                gridAreaH / 2 - labelSpace
            ));

            const blockH = titleH + maxR * 2 + labelSpace * 2;
            const blockTop = areaY + Math.max(0, (areaH - blockH) / 2);
            const cx = areaX + areaW / 2;
            const cy = blockTop + titleH + labelSpace + maxR;

            return {
                cx: cx, cy: cy, maxR: maxR, width: width, height: height,
                legendVertical: vert,
                hasLegendTitle: hasLegendTitle,
                legendColW: legendColW, legendInlineH: legendInlineH,
                isRight: isRight, isTop: isTop,
                areaY: areaY, areaH: areaH, margin: margin, gap: gap
            };
        },

        draw: function (ctx) {
            const { app, root, p, data: items, layout: L, colors } = ctx;
            const { cx, cy, maxR, width, height, legendVertical, hasLegendTitle,
                    legendColW, legendInlineH, isRight, isTop, areaY, areaH, margin, gap } = L;

            const g = root.append('g').attr('transform', 'translate(' + cx + ',' + cy + ')');

            if (p.showRings === 'all') {
                const ringGroup = g.append('g').attr('class', 'petal-rings');
                for (let lv = 1; lv <= p.ringLevels; lv++) {
                    const t = lv / p.ringLevels;
                    const r = ringRadius(t, p.innerRadius, maxR, p.radiusScale);
                    ringGroup.append('circle')
                        .attr('cx', 0).attr('cy', 0).attr('r', r)
                        .attr('fill', 'none')
                        .attr('stroke', p.ringColor)
                        .attr('stroke-width', p.ringWidth);
                }
            }

            const N = items.length;
            const startRad = p.startAngle * Math.PI / 180;
            const gapRad = p.gapAngle * Math.PI / 180;
            const ccw = p.direction === 'counterclockwise';

            const sectors = [];
            let cursor = startRad;

            const maxPct = Math.max.apply(null, items.map(it => it.percent));
            const maxValue = Math.max.apply(null, items.map(it => it.value));
            const equalSpan = 2 * Math.PI / N;

            items.forEach((it, i) => {
                const spanRad = p.angleMode === 'equal' ? equalSpan : 2 * Math.PI * it.percent;
                const gg = Math.min(gapRad, spanRad * 0.4);
                const sRaw = cursor + gg / 2;
                const eRaw = cursor + spanRad - gg / 2;
                cursor += spanRad;

                const ratio = it.percent / maxPct;
                const rOuter = petalRadius(ratio, p.innerRadius, maxR, p.radiusScale);

                sectors.push({
                    name: it.name,
                    value: it.value,
                    percent: it.percent,
                    color: colors[i],
                    startAngle: ccw ? -eRaw : sRaw,
                    endAngle: ccw ? -sRaw : eRaw,
                    midAngleRaw: (sRaw + eRaw) / 2,
                    outerR: rOuter
                });
            });

            if (p.showRadial === 'all') {
                const axisGroup = g.append('g').attr('class', 'petal-radial');
                sectors.forEach(s => {
                    const xy = polarXY(maxR, s.midAngleRaw);
                    axisGroup.append('line')
                        .attr('x1', 0).attr('y1', 0)
                        .attr('x2', xy[0]).attr('y2', xy[1])
                        .attr('stroke', p.axisColor)
                        .attr('stroke-width', p.axisWidth);
                });
            }

            if (p.scalePos !== 'none') {
                const scaleGroup = g.append('g').attr('class', 'petal-scale');
                const scaleWeight = p.scaleBold ? 'bold' : 'normal';
                const scaleStyle = p.scaleItalic ? 'italic' : 'normal';
                const off = 6;

                sectors.forEach((s, i) => {
                    if (p.scalePos === 'first' && i !== 0) return;
                    const a = s.midAngleRaw;
                    const ux = Math.sin(a);
                    const uy = -Math.cos(a);
                    const vx = Math.cos(a);
                    const vy = Math.sin(a);
                    const anchor = ux > 0.1 ? 'start' : (ux < -0.1 ? 'end' : 'start');

                    for (let lv = 1; lv <= p.ringLevels; lv++) {
                        const t = lv / p.ringLevels;
                        const r = ringRadius(t, p.innerRadius, maxR, p.radiusScale);
                        const lx = r * ux + vx * off;
                        const ly = r * uy + vy * off;
                        const label = (p.scaleType === 'percent')
                            ? (t * 100).toFixed(p.scaleDecimals) + '%'
                            : (t * maxValue).toFixed(p.scaleDecimals);
                        scaleGroup.append('text')
                            .attr('x', lx).attr('y', ly)
                            .attr('text-anchor', anchor)
                            .attr('dominant-baseline', 'middle')
                            .attr('font-size', p.scaleFontSize)
                            .attr('font-weight', scaleWeight)
                            .attr('font-style', scaleStyle)
                            .attr('fill', '#888')
                            .text(label);
                    }
                });
            }

            const arcGen = d3.arc()
                .innerRadius(p.innerRadius)
                .outerRadius(d => d.outerR)
                .startAngle(d => d.startAngle)
                .endAngle(d => d.endAngle);

            g.selectAll('path.petal')
                .data(sectors).enter()
                .append('path')
                .attr('class', 'petal')
                .attr('d', arcGen)
                .attr('fill', d => d.color)
                .attr('stroke', p.sliceStroke)
                .attr('stroke-width', p.strokeWidth)
                .style('cursor', 'pointer')
                .on('mouseenter', function () {
                    d3.select(this).transition().duration(120).attr('transform', 'scale(1.03)');
                })
                .on('mouseleave', function () {
                    d3.select(this).transition().duration(120).attr('transform', 'scale(1)');
                });

            const labelGroup = g.append('g').attr('class', 'petal-labels');
            const labelWeight = p.labelBold ? 'bold' : 'normal';
            const labelStyle = p.labelItalic ? 'italic' : 'normal';

            sectors.forEach(d => {
                const midAngle = (d.startAngle + d.endAngle) / 2;
                const valueText = (p.valuePosition === 'none') ? '' : buildValueText(d, p);

                const inParts = [];
                if (p.namePosition === 'inside') inParts.push(d.name);
                if (p.valuePosition === 'inside') inParts.push(valueText);
                const inText = inParts.filter(Boolean).join(' ');
                if (inText) {
                    const rIn = Math.max(p.innerRadius + 2, d.outerR - p.labelFontSize * 0.7);
                    const xy = polarXY(rIn, midAngle);
                    labelGroup.append('text')
                        .attr('x', xy[0]).attr('y', xy[1])
                        .attr('text-anchor', 'middle')
                        .attr('dy', '0.35em')
                        .attr('font-size', p.labelFontSize)
                        .attr('font-weight', labelWeight)
                        .attr('font-style', labelStyle)
                        .attr('fill', '#333')
                        .text(inText);
                }

                const outParts = [];
                if (p.namePosition === 'outside') outParts.push(d.name);
                if (p.valuePosition === 'outside') outParts.push(valueText);
                const outText = outParts.filter(Boolean).join(' ');
                if (outText) {
                    const rOut = maxR + p.labelOffset;
                    const xy = polarXY(rOut, midAngle);
                    const cosA = Math.cos(midAngle);
                    const sinA = Math.sin(midAngle);
                    let anchor = 'middle';
                    if (cosA > 0.15 && sinA > 0.15) anchor = 'start';
                    else if (cosA < -0.15 && sinA > 0.15) anchor = 'end';
                    labelGroup.append('text')
                        .attr('x', xy[0]).attr('y', xy[1])
                        .attr('text-anchor', anchor)
                        .attr('dy', '0.35em')
                        .attr('font-size', p.labelFontSize)
                        .attr('font-weight', labelWeight)
                        .attr('font-style', labelStyle)
                        .attr('fill', '#333')
                        .text(outText);
                }
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
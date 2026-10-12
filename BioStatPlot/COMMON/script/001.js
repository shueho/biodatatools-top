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

    function buildValueText(d, p) {
        const pct = d.data.percent * 100;
        switch (p.valueContent) {
            case 'pct': return pct.toFixed(1) + '%';
            case 'value': return String(d.data.value);
            case 'pct_value': return pct.toFixed(1) + '% (' + d.data.value + ')';
        }
        return '';
    }

    PlotApp.create({
        exportName: 'pie_chart',
        exampleData: 'Category\tValue\nA\t320\nB\t180\nC\t120\nD\t75\nE\t42\nF\t20\nG\t8',
        importInfo: PlotI18N.lang() === 'en'
            ? 'Must include a header row with at least a <strong>category column</strong> and a <strong>value column</strong>. You can paste directly from Excel.'
            : '需包含表头，且至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>。可直接粘贴 Excel 内容。',

        readParams: function (app) {
            return {
                width: Math.max(300, num(app, 'chartWidth', 700)),
                height: Math.max(300, num(app, 'chartHeight', 600)),
                outerRadius: Math.max(40, num(app, 'outerRadius', 200)),
                innerRadius: Math.max(0, num(app, 'innerRadius', 0)),
                direction: app.$('pieDirection').value || 'clockwise',

                fontFamily: app.$('fontFamily').value || 'Times New Roman',
                labelFontSize: Math.max(6, num(app, 'labelFontSize', 16)),
                labelBold: app.$('labelBold').checked,
                labelItalic: app.$('labelItalic').checked,
                legendFontSize: Math.max(6, num(app, 'legendFontSize', 15)),
                legendBold: app.$('legendBold').checked,
                legendItalic: app.$('legendItalic').checked,
                legendTitleFontSize: Math.max(6, num(app, 'legendTitleFontSize', 15)),
                legendTitleBold: app.$('legendTitleBold').checked,
                legendTitleItalic: app.$('legendTitleItalic').checked,
                titleFontSize: Math.max(6, num(app, 'titleFontSize', 22)),
                titleBold: app.$('titleBold').checked,
                titleItalic: app.$('titleItalic').checked,
                titlePosition: app.$('titlePosition').value || 'top-center',

                namePosition: app.$('namePosition').value,
                valuePosition: app.$('valuePosition').value,
                valueContent: app.$('valueContent').value,
                labelOffset: Math.max(0, num(app, 'labelOffset', 0)),

                showLegend: app.$('showLegend').checked,
                legendPosition: app.$('legendPosition').value,
                legendGap: Math.max(0, num(app, 'legendGap', 0)),
                showLegendTitle: app.$('showLegendTitle').checked,
                legendTitle: app.$('legendTitle').value || '',
                showTitle: app.$('showTitle').checked,
                chartTitle: app.$('chartTitle').value || '',
                sliceStroke: app.$('sliceStroke').value || '#ffffff',
                strokeWidth: Math.max(0, num(app, 'strokeWidth', 0)),
                mergeSmall: app.$('mergeSmall').checked,
                mergeThreshold: Math.max(0, num(app, 'mergeThreshold', 0)),
                showCanvasBorder: app.$('showCanvasBorder').checked
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
                if (othersVal > 0) big.push({ name: 'Other', value: othersVal, isOther: true });
                const sum = big.reduce((s, d) => s + d.value, 0);
                big.forEach(d => d.percent = d.value / sum);
                return big;
            }
            return items;
        },

        computeLayout: function (p, items, app) {
            const width = p.width;
            const height = p.height;
            const titleH = (p.showTitle && p.chartTitle) ? p.titleFontSize + 50 : 0;

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
            const horiz = isTop || isBottom;

            let maxR;
            if (vert) {
                maxR = Math.min((width - legendColW - gap - 2 * margin) / 2, (height - titleH - 2 * margin) / 2);
            } else if (horiz) {
                maxR = Math.min((width - 2 * margin) / 2, (height - titleH - legendInlineH - gap - 2 * margin) / 2);
            } else {
                maxR = Math.min((width - 2 * margin) / 2, (height - titleH - 2 * margin) / 2);
            }
            maxR = Math.max(40, maxR);

            const outerR = Math.min(p.outerRadius, maxR);
            const innerR = Math.min(p.innerRadius, outerR - 10);

            let cx = width / 2;
            let cy = 0;
            let titleY = 0;
            let legendArea = null;

            if (vert || !wantLegend) {
                const blockH = titleH + outerR * 2;
                const blockTop = Math.max(0, (height - blockH) / 2);
                titleY = blockTop + p.titleFontSize + 10;
                cy = blockTop + titleH + outerR;
                if (isRight) {
                    cx = (width + legendColW + gap) / 2 - legendColW;
                    legendArea = { x: width - legendColW, y: blockTop, w: legendColW, h: blockH };
                } else if (isLeft) {
                    cx = (width - legendColW - gap) / 2 + legendColW + gap;
                    legendArea = { x: 0, y: blockTop, w: legendColW, h: blockH };
                } else {
                    cx = width / 2;
                }
            } else if (isTop) {
                const blockH = titleH + legendInlineH + gap + outerR * 2;
                const blockTop = Math.max(0, (height - blockH) / 2);
                titleY = blockTop + p.titleFontSize + 10;
                cx = width / 2;
                cy = blockTop + titleH + legendInlineH + gap + outerR;
                legendArea = { x: 0, y: blockTop + titleH, w: width, h: legendInlineH };
            } else {
                const blockH = titleH + outerR * 2 + gap + legendInlineH;
                const blockTop = Math.max(0, (height - blockH) / 2);
                titleY = blockTop + p.titleFontSize + 10;
                cx = width / 2;
                cy = blockTop + titleH + outerR;
                legendArea = { x: 0, y: blockTop + titleH + outerR * 2 + gap, w: width, h: legendInlineH };
            }

            return {
                cx, cy, outerR, innerR, legendArea,
                titleH, titleY, width, height,
                legendPos: pos,
                legendVertical: vert,
                legendHorizontal: horiz,
                legendRowH, legendInlineH,
                hasLegendTitle, legendTitleH
            };
        },

        draw: function (ctx) {
            const app = ctx.app;
            const root = ctx.root;
            const p = ctx.p;
            const items = ctx.data;
            const colors = ctx.colors;
            const L = ctx.layout;
            const { cx, cy, outerR, innerR, legendArea, legendVertical, legendHorizontal, hasLegendTitle } = L;

            const pieFn = d3.pie().value(d => d.value).sort(null);
            if (p.direction === 'counterclockwise') {
                pieFn.startAngle(2 * Math.PI).endAngle(0);
            }
            const arcs = pieFn(items);
            const arcGen = d3.arc().innerRadius(innerR).outerRadius(outerR);

            const g = root.append('g').attr('transform', `translate(${cx},${cy})`);

            g.selectAll('path.slice')
                .data(arcs).enter()
                .append('path')
                .attr('class', 'slice')
                .attr('d', arcGen)
                .attr('fill', (d, i) => colors[i])
                .attr('stroke', p.sliceStroke)
                .attr('stroke-width', p.strokeWidth)
                .style('cursor', 'pointer')
                .on('mouseenter', function () {
                    d3.select(this).transition().duration(120)
                        .attr('d', d3.arc().innerRadius(innerR).outerRadius(outerR + 6)(d3.select(this).datum()));
                })
                .on('mouseleave', function () {
                    d3.select(this).transition().duration(120)
                        .attr('d', arcGen(d3.select(this).datum()));
                });

            const innerLabels = g.append('g').attr('class', 'inner-labels');
            const outerLabels = g.append('g').attr('class', 'outer-labels');
            const labelWeight = p.labelBold ? 'bold' : 'normal';
            const labelStyle = p.labelItalic ? 'italic' : 'normal';

            arcs.forEach(d => {
                const valueText = (p.valuePosition === 'none') ? '' : buildValueText(d, p);
                const catName = d.data.name;
                const midAngle = (d.startAngle + d.endAngle) / 2;

                const inParts = [];
                if (p.namePosition === 'inside') inParts.push(catName);
                if (p.valuePosition === 'inside') inParts.push(valueText);
                const inText = inParts.filter(Boolean).join(' ');
                if (inText) {
                    const pos = arcGen.centroid(d);
                    innerLabels.append('text')
                        .attr('x', pos[0]).attr('y', pos[1])
                        .attr('text-anchor', 'middle')
                        .attr('dy', '0.35em')
                        .attr('font-size', p.labelFontSize)
                        .attr('font-weight', labelWeight)
                        .attr('font-style', labelStyle)
                        .attr('fill', '#333')
                        .text(inText);
                }

                const outParts = [];
                if (p.namePosition === 'outside') outParts.push(catName);
                if (p.valuePosition === 'outside') outParts.push(valueText);
                const outText = outParts.filter(Boolean).join(' ');
                if (outText) {
                    const r = outerR + p.labelOffset;
                    const [x, y] = polarXY(r, midAngle);
                    outerLabels.append('text')
                        .attr('x', x).attr('y', y)
                        .attr('text-anchor', 'middle')
                        .attr('dy', '0.35em')
                        .attr('font-size', p.labelFontSize)
                        .attr('font-weight', labelWeight)
                        .attr('font-style', labelStyle)
                        .attr('fill', '#333')
                        .text(outText);
                }
            });

            if (legendArea && (legendVertical || legendHorizontal) && items.length) {
                PlotLegend.draw(root, {
                    orientation: legendVertical ? 'vertical' : 'horizontal',
                    area: legendArea,
                    width: p.width,
                    items: items.map((it, i) => ({
                        label: `${it.name} (${(it.percent * 100).toFixed(1)}%)`,
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
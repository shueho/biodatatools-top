(function () {
    'use strict';

    const PC = window.PlotCommon;

    PlotApp.create({
        exportName: 'pie_chart',
        exampleData: 'Category\tValue\nA\t320\nB\t180\nC\t120\nD\t75\nE\t42\nF\t20\nG\t8',
        importInfo: PlotI18N.lang() === 'en'
            ? 'Must include a header row with at least a <strong>category column</strong> and a <strong>value column</strong>. You can paste directly from Excel.'
            : '需包含表头，且至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>。可直接粘贴 Excel 内容。',

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = app.state.roles.category || '';
            }
        },

        readParams: function (app) {
            const p = PC.readCommonParams(app, { width: 700, height: 600 });

            p.outerRadius = Math.max(40, PC.num(app, 'outerRadius', 200));
            p.innerRadius = Math.max(0, PC.num(app, 'innerRadius', 0));
            p.direction = app.$('pieDirection').value || 'clockwise';

            p.labelFontSize = Math.max(6, PC.num(app, 'labelFontSize', 16));
            p.labelBold = app.$('labelBold').checked;
            p.labelItalic = app.$('labelItalic').checked;

            p.namePosition = app.$('namePosition').value;
            p.valuePosition = app.$('valuePosition').value;
            p.valueContent = app.$('valueContent').value;
            p.labelOffset = Math.max(0, PC.num(app, 'labelOffset', 0));

            p.sliceStroke = app.$('sliceStroke').value || '#ffffff';
            p.strokeWidth = Math.max(0, PC.num(app, 'strokeWidth', 0));

            p.mergeSmall = app.$('mergeSmall').checked;
            p.mergeThreshold = Math.max(0, PC.num(app, 'mergeThreshold', 0));

            return p;
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
            const margin = 30;
            const availW = p.width - 2 * margin;
            const availH = p.height - 2 * margin;
            const maxR = Math.max(40, Math.min(availW, availH) / 2);

            const outerR = Math.min(p.outerRadius, maxR);
            const innerR = Math.min(p.innerRadius, outerR - 10);

            return {
                cx: p.width / 2,
                cy: p.height / 2,
                outerR: outerR,
                innerR: innerR
            };
        },

        draw: function (ctx) {
            const root = ctx.root;
            const p = ctx.p;
            const items = ctx.data;
            const colors = ctx.colors;
            const L = ctx.layout;
            const cx = L.cx;
            const cy = L.cy;
            const outerR = L.outerR;
            const innerR = L.innerR;

            const pieFn = d3.pie().value(d => d.value).sort(null);
            if (p.direction === 'counterclockwise') {
                pieFn.startAngle(2 * Math.PI).endAngle(0);
            }
            const arcs = pieFn(items);
            const arcGen = d3.arc().innerRadius(innerR).outerRadius(outerR);

            const g = root.append('g').attr('transform', 'translate(' + cx + ',' + cy + ')');

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
                const valueText = (p.valuePosition === 'none') ? '' : PC.buildValueText(d.data, p);
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
                    const xy = PC.polarXY(r, midAngle);
                    outerLabels.append('text')
                        .attr('x', xy[0]).attr('y', xy[1])
                        .attr('text-anchor', 'middle')
                        .attr('dy', '0.35em')
                        .attr('font-size', p.labelFontSize)
                        .attr('font-weight', labelWeight)
                        .attr('font-style', labelStyle)
                        .attr('fill', '#333')
                        .text(outText);
                }
            });

            if (p.showLegend && items.length) {
                PC.drawLegendOverlay(root, {
                    p: p,
                    items: items,
                    colors: colors,
                    shape: 'rect'
                });
            }
        }
    });
})();
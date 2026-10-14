(function () {
    'use strict';

    const PC = window.PlotCommon;

    PlotApp.create({
        exportName: 'concentric_ring_chart',
        exampleData: 'Category\tValue\nA\t420\nB\t120\nC\t300\nD\t80\nE\t380\nF\t160\nG\t240',
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
            const p = PC.readCommonParams(app, { width: 760, height: 680 });
            const $ = app.$;

            p.innerRadius = Math.max(0, PC.num(app, 'innerRadius', 40));
            p.outerRadius = Math.max(60, PC.num(app, 'outerRadius', 280));
            p.ringGap = Math.max(0, PC.num(app, 'ringGap', 3));
            p.startAngle = PC.num(app, 'startAngle', 0);
            p.endAngle = PC.num(app, 'endAngle', 360);
            p.ringOrder = $('ringOrder').value || 'inner';

            p.showRingStroke = $('showRingStroke').checked;
            p.ringStrokeColor = $('ringStrokeColor').value || '#ffffff';
            p.ringStrokeWidth = Math.max(0, PC.num(app, 'ringStrokeWidth', 1));

            p.labelContent = $('labelContent').value || 'none';
            p.labelDecimals = Math.max(0, Math.round(PC.num(app, 'labelDecimals', 1)));
            p.labelFontSize = Math.max(6, PC.num(app, 'labelFontSize', 13));
            p.labelBold = $('labelBold').checked;
            p.labelItalic = $('labelItalic').checked;

            return p;
        },

        buildData: function (app, p) {
            return app.getCategoryItems();
        },

        computeLayout: function (p, items, app) {
            const margin = 30;
            const availR = Math.max(20, Math.min(p.width - 2 * margin, p.height - 2 * margin) / 2);

            let outerR = Math.max(p.innerRadius + 20, p.outerRadius);
            let innerR = Math.max(0, p.innerRadius);
            if (outerR > availR) {
                const k = availR / outerR;
                outerR *= k;
                innerR *= k;
            }
            innerR = Math.min(innerR, outerR - 10);

            return {
                cx: p.width / 2,
                cy: p.height / 2,
                innerR: innerR,
                outerR: outerR
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
            const innerR = L.innerR;
            const outerR = L.outerR;
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
                        case 'value': txt = PC.fmtNum(d.value, p.labelDecimals); break;
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
                        .attr('fill', PC.textColorOn(colors[d._colorIdx]))
                        .attr('pointer-events', 'none')
                        .text(txt);
                });
            }

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
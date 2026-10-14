(function () {
    'use strict';

    const PC = window.PlotCommon;

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

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = app.state.roles.category || '';
            }
        },

        readParams: function (app) {
            const p = PC.readCommonParams(app, { width: 700, height: 650 });
            const $ = app.$;

            p.outerRadius = Math.max(40, PC.num(app, 'outerRadius', 220));
            p.innerRadius = Math.max(0, PC.num(app, 'innerRadius', 0));
            p.radiusScale = $('radiusScale').value || 'linear';
            p.angleMode = $('angleMode').value || 'proportional';
            p.direction = $('pieDirection').value || 'clockwise';
            p.startAngle = Math.max(0, PC.num(app, 'startAngle', 0));
            p.gapAngle = Math.max(0, PC.num(app, 'gapAngle', 2));

            p.labelFontSize = Math.max(6, PC.num(app, 'labelFontSize', 14));
            p.labelBold = $('labelBold').checked;
            p.labelItalic = $('labelItalic').checked;

            p.scaleFontSize = Math.max(6, PC.num(app, 'scaleFontSize', 12));
            p.scaleBold = $('scaleBold').checked;
            p.scaleItalic = $('scaleItalic').checked;

            p.sliceStroke = $('sliceStroke').value || '#ffffff';
            p.strokeWidth = Math.max(0, PC.num(app, 'strokeWidth', 1.5));
            p.mergeSmall = $('mergeSmall').checked;
            p.mergeThreshold = Math.max(0, PC.num(app, 'mergeThreshold', 3));

            p.showRings = $('showRings').value || 'none';
            p.ringLevels = Math.max(1, Math.round(PC.num(app, 'ringLevels', 4)));
            p.ringColor = $('ringColor').value || '#d8e2ec';
            p.ringWidth = Math.max(0, PC.num(app, 'ringWidth', 1));

            p.showRadial = $('showRadial').value || 'none';
            p.axisColor = $('axisColor').value || '#d8e2ec';
            p.axisWidth = Math.max(0, PC.num(app, 'axisWidth', 1));

            p.scalePos = $('scalePos').value || 'none';
            p.scaleType = $('scaleType').value || 'percent';
            p.scaleDecimals = Math.max(0, Math.round(PC.num(app, 'scaleDecimals', 0)));

            p.namePosition = $('namePosition').value || 'inside';
            p.valuePosition = $('valuePosition').value || 'none';
            p.valueContent = $('valueContent').value || 'pct';
            p.labelOffset = Math.max(0, PC.num(app, 'labelOffset', 20));

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
                if (othersVal > 0) big.push({ name: 'Other', value: othersVal });
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
            const labelSpace = p.labelOffset + p.labelFontSize;

            const maxR = Math.max(20, Math.min(
                p.outerRadius,
                availW / 2 - labelSpace,
                availH / 2 - labelSpace
            ));

            return {
                cx: p.width / 2,
                cy: p.height / 2,
                maxR: maxR
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
            const maxR = L.maxR;

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
                    const xy = PC.polarXY(maxR, s.midAngleRaw);
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
                const valueText = (p.valuePosition === 'none') ? '' : PC.buildValueText(d, p);

                const inParts = [];
                if (p.namePosition === 'inside') inParts.push(d.name);
                if (p.valuePosition === 'inside') inParts.push(valueText);
                const inText = inParts.filter(Boolean).join(' ');
                if (inText) {
                    const rIn = Math.max(p.innerRadius + 2, d.outerR - p.labelFontSize * 0.7);
                    const xy = PC.polarXY(rIn, midAngle);
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
                    const xy = PC.polarXY(rOut, midAngle);
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
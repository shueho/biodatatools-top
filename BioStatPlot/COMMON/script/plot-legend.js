/* ============================================================
   BioDataTools 图例组件
   职责：统一渲染分类图例，支持：
        - 垂直（左/右）与水平（上/下）两种排列
        - 可选的图例标题
        - 方形 / 圆形标记（未来可扩展为其它形状）
   用法：
       PlotLegend.draw(root, {
           orientation: 'vertical' | 'horizontal',
           area: { x, y, w, h },
           width, height,
           items: [{ label, color, shape }],
           fontSize, bold, italic,
           markerSize, textGap, itemGap,
           showTitle, title, titleFontSize, titleBold, titleItalic
       });
============================================================ */
(function (global) {
    'use strict';

    function estTextWidth(str, fontSize) {
        let w = 0;
        for (const ch of String(str)) {
            w += /[\u4e00-\u9fa5\uff00-\uffef]/.test(ch) ? 1 : 0.55;
        }
        return w * fontSize;
    }

    function drawMarker(group, item, x, y, markerSize) {
        if (item.shape === 'circle') {
            group.append('circle')
                .attr('cx', x + markerSize / 2)
                .attr('cy', y + markerSize / 2)
                .attr('r', markerSize / 2)
                .attr('fill', item.color);
        } else {
            group.append('rect')
                .attr('x', x).attr('y', y)
                .attr('width', markerSize).attr('height', markerSize)
                .attr('rx', 2).attr('fill', item.color);
        }
    }

    function draw(root, opts) {
        opts = opts || {};
        const items = opts.items || [];
        if (!items.length) return null;

        const fontSize = opts.fontSize || 14;
        const markerSize = opts.markerSize || fontSize;
        const textGap = opts.textGap === undefined ? 8 : opts.textGap;
        const itemGap = opts.itemGap === undefined ? 20 : opts.itemGap;
        const weight = opts.bold ? 'bold' : 'normal';
        const style = opts.italic ? 'italic' : 'normal';
        const hasTitle = !!(opts.showTitle && opts.title && String(opts.title).trim());
        const titleFontSize = opts.titleFontSize || fontSize;
        const titleWeight = opts.titleBold ? 'bold' : 'normal';
        const titleStyle = opts.titleItalic ? 'italic' : 'normal';
        const titleH = hasTitle ? (titleFontSize + 10) : 0;

        const group = root.append('g').attr('class', 'chart-legend');

        function title(x, y, anchor) {
            if (!hasTitle) return;
            group.append('text')
                .attr('x', x).attr('y', y)
                .attr('text-anchor', anchor || 'start')
                .attr('dy', '0.35em')
                .attr('font-size', titleFontSize)
                .attr('font-weight', titleWeight)
                .attr('font-style', titleStyle)
                .attr('fill', '#333')
                .text(opts.title);
        }

        const orientation = opts.orientation || 'vertical';

        if (orientation === 'horizontal') {
            const width = opts.width || 700;
            const area = opts.area || { x: 0, y: 0, w: width, h: 0 };
            const labels = items.map(it => String(it.label));
            const widths = labels.map(lb =>
                markerSize + textGap + estTextWidth(lb, fontSize) + itemGap
            );
            const totalW = widths.reduce((a, b) => a + b, 0) - itemGap;
            const startX = Math.max(10, (width - totalW) / 2);
            const itemsY = area.y + titleH + 6;

            title(width / 2, area.y + titleFontSize / 2, 'middle');

            let cursorX = startX;
            items.forEach((it, i) => {
                drawMarker(group, it, cursorX, itemsY, markerSize);
                group.append('text')
                    .attr('x', cursorX + markerSize + textGap)
                    .attr('y', itemsY + markerSize / 2)
                    .attr('dy', '0.35em')
                    .attr('font-size', fontSize)
                    .attr('font-weight', weight)
                    .attr('font-style', style)
                    .attr('fill', '#333')
                    .text(labels[i]);
                cursorX += widths[i];
            });
        } else {
            const area = opts.area || { x: 0, y: 0, w: 200, h: 200 };
            const totalH = titleH + items.length * (markerSize + 8);
            const startY = area.y + Math.max(0, (area.h - totalH) / 2);
            const baseX = area.x + 12;

            title(baseX, startY + titleFontSize / 2, 'start');

            const itemsStartY = startY + titleH;
            items.forEach((it, i) => {
                const y = itemsStartY + i * (markerSize + 8);
                drawMarker(group, it, baseX, y, markerSize);
                group.append('text')
                    .attr('x', baseX + markerSize + textGap)
                    .attr('y', y + markerSize / 2)
                    .attr('dy', '0.35em')
                    .attr('font-size', fontSize)
                    .attr('font-weight', weight)
                    .attr('font-style', style)
                    .attr('fill', '#333')
                    .text(String(it.label));
            });
        }

        return group;
    }

    global.PlotLegend = { draw: draw, estTextWidth: estTextWidth };
})(window);

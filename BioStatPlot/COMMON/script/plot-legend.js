/* ============================================================
   BioDataTools 图例组件
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

    function getLegendOffset() {
        const app = global.PlotApp && global.PlotApp.current;
        if (!app || !app.state) return { dx: 0, dy: 0 };
        if (!app.state.legendOffset) app.state.legendOffset = { dx: 0, dy: 0 };
        return app.state.legendOffset;
    }

    function getLegendMaxPerLine() {
        const el = document.getElementById('legendMaxPerLine');
        if (!el) return 1;
        const v = parseInt(el.value, 10);
        return (isFinite(v) && v > 0) ? v : 1;
    }

    function attachDrag(group) {
        let dragging = false;
        let startX = 0, startY = 0;
        group.style('cursor', 'move');

        const drag = d3.drag()
            .on('start', function (event) {
                dragging = true;
                startX = event.x;
                startY = event.y;
                group.raise();
                group.style('cursor', 'grabbing');
            })
            .on('drag', function (event) {
                if (!dragging) return;
                const off = getLegendOffset();
                off.dx += event.x - startX;
                off.dy += event.y - startY;
                startX = event.x;
                startY = event.y;
                group.attr('transform', 'translate(' + off.dx + ',' + off.dy + ')');
            })
            .on('end', function () {
                dragging = false;
                group.style('cursor', 'move');
            });

        group.call(drag);
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
        const rowH = markerSize + 8;
        const maxPerLine = getLegendMaxPerLine();
        const orientation = opts.orientation || 'vertical';

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

        function drawItem(it, x, y, label) {
            drawMarker(group, it, x, y, markerSize);
            group.append('text')
                .attr('x', x + markerSize + textGap)
                .attr('y', y + markerSize / 2)
                .attr('dy', '0.35em')
                .attr('font-size', fontSize)
                .attr('font-weight', weight)
                .attr('font-style', style)
                .attr('fill', '#333')
                .text(label);
        }

        const labels = items.map(it => String(it.label));


        const itemsPerRow = Math.min(maxPerLine, items.length);
        const rowCount = Math.ceil(items.length / itemsPerRow);

        const colWidths = [];
        for (let c = 0; c < itemsPerRow; c++) {
            let w = 0;
            for (let r = 0; r < rowCount; r++) {
                const idx = r * itemsPerRow + c;
                if (idx >= items.length) break;
                const lw = markerSize + textGap + estTextWidth(labels[idx], fontSize) + itemGap;
                w = Math.max(w, lw);
            }
            if (w > 0) colWidths.push(w);
        }

        const gridW = colWidths.reduce((a, b) => a + b, 0) - itemGap;
        const gridH = rowCount * rowH;

        let startX, startY, titleX, titleY, titleAnchor;

        if (orientation === 'horizontal') {
            const width = opts.width || 700;
            const area = opts.area || { x: 0, y: 0, w: width, h: 0 };
            startX = Math.max(10, (width - gridW) / 2);
            startY = area.y + titleH + 6;
            titleX = width / 2;
            titleY = area.y + titleFontSize / 2;
            titleAnchor = 'middle';
        } else {
            const area = opts.area || { x: 0, y: 0, w: 200, h: 200 };
            startX = area.x + 12;
            startY = area.y + titleH + Math.max(0, (area.h - gridH - titleH) / 2);
            titleX = startX;
            titleY = area.y + Math.max(0, (area.h - gridH - titleH) / 2) + titleFontSize / 2;
            titleAnchor = 'start';
        }

        title(titleX, titleY, titleAnchor);

        items.forEach((it, i) => {
            const r = Math.floor(i / itemsPerRow);
            const c = i % itemsPerRow;
            let colX = startX;
            for (let ci = 0; ci < c; ci++) colX += colWidths[ci];
            const y = startY + r * rowH;
            drawItem(it, colX, y, labels[i]);
        });

        const off = getLegendOffset();
        if (off.dx || off.dy) {
            group.attr('transform', 'translate(' + off.dx + ',' + off.dy + ')');
        }
        attachDrag(group);

        return group;
    }

    global.PlotLegend = {
        draw: draw,
        estTextWidth: estTextWidth,
        attachDrag: attachDrag,
        getLegendOffset: getLegendOffset,
        getLegendMaxPerLine: getLegendMaxPerLine
    };
})(window);
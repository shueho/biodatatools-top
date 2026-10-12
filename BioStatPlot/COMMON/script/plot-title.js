/* ============================================================
   BioDataTools 标题组件
   职责：把标题渲染到画布内，支持九宫格位置：
        top / middle / bottom × left / center / right
   用法：
       PlotTitle.draw(root, {
           width, height,
           position: 'top-center',
           text: 'BioDataTools',
           fontSize: 22, bold: true, italic: false,
           fill: '#1f4068', margin: 30
       });
============================================================ */
(function (global) {
    'use strict';

    const POSITIONS = {
        'top-left':      { x: 'left',   y: 'top' },
        'top-center':    { x: 'center', y: 'top' },
        'top-right':     { x: 'right',  y: 'top' },
        'middle-left':   { x: 'left',   y: 'middle' },
        'middle-center': { x: 'center', y: 'middle' },
        'middle-right':  { x: 'right',  y: 'middle' },
        'bottom-left':   { x: 'left',   y: 'bottom' },
        'bottom-center': { x: 'center', y: 'bottom' },
        'bottom-right':  { x: 'right',  y: 'bottom' }
    };

    function layout(width, height, position, fontSize, margin) {
        margin = (margin === undefined) ? 30 : margin;
        fontSize = fontSize || 22;
        const pos = POSITIONS[position] || POSITIONS['top-center'];

        let x, anchor;
        if (pos.x === 'left') {
            x = margin;
            anchor = 'start';
        } else if (pos.x === 'right') {
            x = width - margin;
            anchor = 'end';
        } else {
            x = width / 2;
            anchor = 'middle';
        }

        let y;
        if (pos.y === 'top') {
            y = margin + fontSize;
        } else if (pos.y === 'middle') {
            y = height / 2;
        } else {
            y = height - margin;
        }

        return { x: x, y: y, anchor: anchor };
    }

    function draw(root, opts) {
        opts = opts || {};
        const fontSize = opts.fontSize || 22;
        let margin = opts.margin;
        if (margin === undefined) {
            const spacingEl = document.getElementById('titleSpacing');
            if (spacingEl) {
                const v = parseFloat(spacingEl.value);
                if (isFinite(v)) margin = v;
            }
        }
        if (margin === undefined) margin = 30;
        const L = layout(opts.width, opts.height, opts.position, fontSize, margin);

        return root.append('text')
            .attr('class', 'chart-title')
            .attr('x', L.x)
            .attr('y', L.y)
            .attr('text-anchor', L.anchor)
            .attr('font-size', fontSize)
            .attr('font-weight', opts.bold ? 'bold' : 'normal')
            .attr('font-style', opts.italic ? 'italic' : 'normal')
            .attr('fill', opts.fill || '#1f4068')
            .text(opts.text || '');
    }

    global.PlotTitle = {
        draw: draw,
        layout: layout,
        positions: Object.keys(POSITIONS)
    };
})(window);

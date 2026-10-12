/* ============================================================
   BioDataTools 画布组件
============================================================ */
(function (global) {
    'use strict';

    function create(container, opts) {
        opts = opts || {};
        const width = opts.width || 700;
        const height = opts.height || 600;
        const fontFamily = opts.fontFamily || 'Times New Roman';
        const background = opts.background || '#ffffff';
        const showBorder = opts.border !== false;

        const svg = d3.select(container).html('')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .style('background', background)
            .style('font-family', fontFamily)
            .style('overflow', 'hidden')
            .style('cursor', 'grab')
            .style('touch-action', 'none');

        if (showBorder) {
            svg.append('rect')
                .attr('class', 'canvas-border')
                .attr('x', 0.5).attr('y', 0.5)
                .attr('width', width - 1).attr('height', height - 1)
                .attr('fill', 'none')
                .attr('stroke', '#c0c8d4')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '4 3')
                .attr('pointer-events', 'none');
        }

        // 所有图形都画在这个 g 里，缩放/平移只作用于内容，不作用于边框
        const root = svg.append('g').attr('class', 'viewport');

        const view = { x: 0, y: 0, k: 1, minK: 0.2, maxK: 8 };

        function applyView() {
            root.attr('transform', `translate(${view.x},${view.y}) scale(${view.k})`);
        }

        function resetView() {
            view.x = 0;
            view.y = 0;
            view.k = 1;
            applyView();
        }

        function zoomAt(px, py, factor) {
            const next = Math.min(view.maxK, Math.max(view.minK, view.k * factor));
            if (next === view.k) return;
            const real = next / view.k;
            view.x = px - (px - view.x) * real;
            view.y = py - (py - view.y) * real;
            view.k = next;
            applyView();
        }

        // 滚轮缩放：以鼠标所在点为锚点
        svg.on('wheel.zoom', function (event) {
            event.preventDefault();
            const rect = this.getBoundingClientRect();
            const px = event.clientX - rect.left;
            const py = event.clientY - rect.top;
            const factor = Math.pow(1.0015, -event.deltaY);
            zoomAt(px, py, factor);
        });

        // 拖拽平移：仅在空白画布上拖动时生效，避免影响扇区/柱子的悬停交互
        let dragStart = null;
        const drag = d3.drag()
            .filter(function (event) {
                return event.button === 0 && event.target === svg.node();
            })
            .on('start', function (event) {
                dragStart = { x: view.x, y: view.y, px: event.x, py: event.y };
                svg.style('cursor', 'grabbing');
            })
            .on('drag', function (event) {
                if (!dragStart) return;
                view.x = dragStart.x + (event.x - dragStart.px);
                view.y = dragStart.y + (event.y - dragStart.py);
                applyView();
            })
            .on('end', function () {
                dragStart = null;
                svg.style('cursor', 'grab');
            });
        svg.call(drag);

        // 双击复位视图
        svg.on('dblclick.reset', function () {
            resetView();
        });

        applyView();

        return {
            svg: svg,          // 外层 svg selection
            root: root,        // 内容层 g selection
            node: svg.node(),
            view: view,
            resetView: resetView,
            zoomAt: zoomAt,
            applyView: applyView
        };
    }

    function getSvgWithoutBorder(node) {
        if (!node) return null;
        const clone = node.cloneNode(true);
        clone.querySelectorAll('.canvas-border').forEach(el => el.remove());
        return clone;
    }

    global.PlotCanvas = { create: create, getSvgWithoutBorder: getSvgWithoutBorder };
})(window);

﻿/* ============================================================
   BioDataTools 画布组件
============================================================ */
(function (global) {
    'use strict';

    let _resizeStyleInjected = false;
    function injectResizeStyle() {
        if (_resizeStyleInjected) return;
        _resizeStyleInjected = true;
        const s = document.createElement('style');
        s.id = 'plot-canvas-resize-style';
        s.textContent = `
.plot-resize-frame{position:absolute;pointer-events:none;z-index:20;}
.plot-resize-handle{position:absolute;pointer-events:auto;background:transparent;
    transition:background .15s;}
.plot-resize-handle:hover{background:rgba(31,64,104,.18);}
.plot-resize-handle-e{right:-4px;top:0;width:8px;height:100%;cursor:ew-resize;}
.plot-resize-handle-s{bottom:-4px;left:0;height:8px;width:100%;cursor:ns-resize;}
.plot-resize-handle-se{right:-6px;bottom:-6px;width:12px;height:12px;
    cursor:nwse-resize;background:rgba(31,64,104,.55);
    border:1px solid #fff;border-radius:2px;
    box-shadow:0 1px 3px rgba(0,0,0,.2);}
.plot-resize-handle-se:hover{background:rgba(31,64,104,.85);}
.plot-resize-badge{position:absolute;right:16px;bottom:16px;
    background:rgba(31,64,104,.85);color:#fff;font:12px/1.4 monospace;
    padding:3px 8px;border-radius:4px;pointer-events:none;opacity:0;
    transition:opacity .15s;white-space:nowrap;}
.plot-resize-frame.dragging .plot-resize-badge{opacity:1;}
.plot-canvas-resizing{
    align-items:start!important;justify-content:start!important;
    justify-items:start!important;align-content:start!important;
    text-align:left!important;
}
`;
        document.head.appendChild(s);
    }

    function injectCanvasInfoBox(container) {
        if (!container || !container.parentNode) return;
        if (document.getElementById('canvasInfoBox')) return;

        const isEn = (global.PlotI18N && typeof PlotI18N.lang === 'function')
            ? PlotI18N.lang() === 'en'
            : window.location.pathname.indexOf('/en/') >= 0;

        const text = isEn
            ? '<strong>Tip:</strong> The dashed frame marks the export area. <strong>Drag the bottom/right edge</strong> to quickly adjust the canvas size; use the <strong>mouse wheel to zoom</strong>; hold and drag on the blank area to pan. If the chart contains a legend, you can <strong>drag it to reposition</strong> and <strong>scroll the wheel over it to scale</strong>.'
            : '<strong>提示：</strong>虚线框内为图片导出范围，<strong>拖拽右/下边界</strong>可快速调整画布尺寸；<strong>鼠标滚轮可调节缩放比例</strong>；在空白处按住鼠标拖动可平移画面；若图表含图例，可<strong>拖动图例调整位置</strong>，将鼠标悬停在图例上<strong>滚动滚轮可缩放图例</strong>。';

        const box = document.createElement('div');
        box.id = 'canvasInfoBox';
        box.className = 'info-box';
        box.style.marginTop = '10px';
        box.innerHTML = text;
        container.parentNode.insertBefore(box, container.nextSibling);
    }

    function attachResize(container, svg, opts) {
        if (!container || !svg) return;
        const widthInput  = document.getElementById('chartWidth');
        const heightInput = document.getElementById('chartHeight');
        if (!widthInput && !heightInput) return;

        injectResizeStyle();
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        const svgNode = svg.node();

        /* 外层 frame 只承载手柄，视觉虚线框复用 SVG 内的 .canvas-border */
        const frame = document.createElement('div');
        frame.className = 'plot-resize-frame';
        ['e', 's', 'se'].forEach(pos => {
            const h = document.createElement('div');
            h.className = 'plot-resize-handle plot-resize-handle-' + pos;
            h.dataset.pos = pos;
            frame.appendChild(h);
        });
        const badge = document.createElement('div');
        badge.className = 'plot-resize-badge';
        frame.appendChild(badge);
        container.appendChild(frame);

        const initW = parseFloat(svgNode.getAttribute('width'))  || opts.width  || 700;
        const initH = parseFloat(svgNode.getAttribute('height')) || opts.height || 600;
        badge.textContent = Math.round(initW) + ' × ' + Math.round(initH);

        function syncFramePos() {
            const cr = container.getBoundingClientRect();
            const sr = svgNode.getBoundingClientRect();
            frame.style.left   = (sr.left - cr.left + container.scrollLeft) + 'px';
            frame.style.top    = (sr.top  - cr.top  + container.scrollTop)  + 'px';
            frame.style.width  = sr.width  + 'px';
            frame.style.height = sr.height + 'px';
        }

        requestAnimationFrame(syncFramePos);
        window.addEventListener('resize', syncFramePos);

        let drag = null;

        frame.addEventListener('pointerdown', function (e) {
            const handle = e.target.closest('.plot-resize-handle');
            if (!handle) return;
            e.preventDefault();
            e.stopPropagation();

            const cr = container.getBoundingClientRect();
            const sr = svgNode.getBoundingClientRect();
            const offsetX = sr.left - cr.left;
            const offsetY = sr.top  - cr.top;
            const cs = getComputedStyle(container);
            const padL = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0);
            const padT = (parseFloat(cs.paddingTop)  || 0) + (parseFloat(cs.borderTopWidth)  || 0);

            drag = {
                pos: handle.dataset.pos,
                startX: e.clientX,
                startY: e.clientY,
                startW: parseFloat(svgNode.getAttribute('width'))  || initW,
                startH: parseFloat(svgNode.getAttribute('height')) || initH,
                origTransform: svgNode.style.transform || ''
            };

            container.classList.add('plot-canvas-resizing');
            svgNode.style.transform =
                'translate(' + (offsetX - padL) + 'px,' + (offsetY - padT) + 'px)';

            syncFramePos();

            frame.classList.add('dragging');
            document.body.style.cursor =
                drag.pos === 's' ? 'ns-resize' :
                drag.pos === 'e' ? 'ew-resize' : 'nwse-resize';

            try { handle.setPointerCapture(e.pointerId); } catch (err) {}
            handle.addEventListener('pointermove', onMove);
            handle.addEventListener('pointerup', onUp, { once: true });
            handle.addEventListener('pointercancel', onUp, { once: true });
        });

        function onMove(e) {
            if (!drag) return;
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;

            let w = drag.startW + ((drag.pos === 'e' || drag.pos === 'se') ? dx : 0);
            let h = drag.startH + ((drag.pos === 's' || drag.pos === 'se') ? dy : 0);
            w = Math.max(100, Math.min(4000, w));
            h = Math.max(50, Math.min(4000, h));

            svgNode.setAttribute('width', w);
            svgNode.setAttribute('height', h);
            svgNode.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

            const border = svgNode.querySelector('.canvas-border');
            if (border) {
                border.setAttribute('width',  Math.max(0, w - 1));
                border.setAttribute('height', Math.max(0, h - 1));
            }

            frame.style.width  = w + 'px';
            frame.style.height = h + 'px';
            badge.textContent  = Math.round(w) + ' × ' + Math.round(h);
        }

        function onUp(e) {
            if (!drag) return;
            const handle = e.currentTarget;
            try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
            handle.removeEventListener('pointermove', onMove);

            const w = parseFloat(svgNode.getAttribute('width'));
            const h = parseFloat(svgNode.getAttribute('height'));

            container.classList.remove('plot-canvas-resizing');
            svgNode.style.transform = drag.origTransform;
            drag = null;
            frame.classList.remove('dragging');
            document.body.style.cursor = '';

            if (widthInput)  widthInput.value  = Math.round(w);
            if (heightInput) heightInput.value = Math.round(h);

            const app = global.PlotApp && global.PlotApp.current;
            if (app && typeof app.drawChart === 'function') {
                app.drawChart();
            }
        }
    }

    function create(container, opts) {
        opts = opts || {};
        const width = opts.width || 700;
        const height = opts.height || 600;
        const fontFamily = opts.fontFamily || 'Times New Roman';
        const background = opts.background || '#ffffff';
        const showBorder = opts.border !== false;

        const app = global.PlotApp && global.PlotApp.current;
        const saved = (app && app.state && app.state.canvasView) || null;

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

        const root = svg.append('g').attr('class', 'viewport');

        const view = {
            x: saved ? (saved.x || 0) : 0,
            y: saved ? (saved.y || 0) : 0,
            k: saved ? (saved.k || 1) : 1,
            minK: 0.2,
            maxK: 8
        };

        function persist() {
            if (app && app.state) {
                app.state.canvasView = { x: view.x, y: view.y, k: view.k };
            }
        }

        function applyView() {
            root.attr('transform', `translate(${view.x},${view.y}) scale(${view.k})`);
            persist();
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

        svg.on('wheel.zoom', function (event) {
            event.preventDefault();
            const rect = this.getBoundingClientRect();
            const px = event.clientX - rect.left;
            const py = event.clientY - rect.top;
            const factor = Math.pow(1.0015, -event.deltaY);
            zoomAt(px, py, factor);
        });

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

        svg.on('dblclick.reset', function () {
            resetView();
        });

        applyView();

        attachResize(container, svg, opts);
        injectCanvasInfoBox(container);

        return {
            svg: svg,
            root: root,
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

global.PlotCanvas = {
    create: create,
    getSvgWithoutBorder: getSvgWithoutBorder,
    injectCanvasInfoBox: injectCanvasInfoBox
};
})(window);
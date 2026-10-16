(function (global) {
    'use strict';

    const PC = global.PlotCommon;

    let _measureCanvas = null;
    let _measureCtx = null;

    function measureTextWidth(text, fontSize, fontFamily, bold, italic) {
        if (!_measureCanvas) {
            _measureCanvas = document.createElement('canvas');
            _measureCtx = _measureCanvas.getContext('2d');
        }
        const parts = [];
        if (italic) parts.push('italic');
        if (bold) parts.push('bold');
        parts.push(fontSize + 'px');
        parts.push(fontFamily || 'sans-serif');
        _measureCtx.font = parts.join(' ');
        return _measureCtx.measureText(String(text)).width;
    }

    function getState(app) {
        const state = (app && app.state) ||
            (global.PlotApp && global.PlotApp.current && global.PlotApp.current.state) || {};
        if (!state.formulaOffset) state.formulaOffset = { dx: 0, dy: 0 };
        if (!state.formulaScale) state.formulaScale = 1;
        return state;
    }

    function normalizeLine(line) {
        if (typeof line === 'string') return [{ text: line }];
        if (Array.isArray(line)) {
            const out = [];
            line.forEach(seg => {
                if (typeof seg === 'string') out.push({ text: seg });
                else if (seg && seg.text != null) out.push(seg);
            });
            return out;
        }
        return [];
    }

    function draw(root, opts) {
        opts = opts || {};
        const app = opts.app || (global.PlotApp && global.PlotApp.current);
        const p = opts.p || {};

        const rawLines = (opts.lines || []).filter(l => l != null);
        const lines = rawLines.map(normalizeLine).filter(arr => arr.length > 0);
        if (!lines.length) return null;

        const state = getState(app);
        const scale = Math.max(0.3, Math.min(3, state.formulaScale || 1));
        const offset = state.formulaOffset || { dx: 0, dy: 0 };

        const baseFontSize = opts.fontSize || p.formulaFontSize || 14;
        const fontSize = baseFontSize * scale;
        const lineGap = (opts.lineGap != null ? opts.lineGap : 6) * scale;
        const pad = (opts.padding != null ? opts.padding : 10) * scale;

        const color = opts.color || '#333';
        const defaultItalic = !!opts.italic;
        const defaultBold = !!opts.bold;
        const fontFamily = opts.fontFamily || p.fontFamily || 'sans-serif';

        function segWidth(seg) {
            const it = (seg.italic != null) ? !!seg.italic : defaultItalic;
            const bo = (seg.bold != null) ? !!seg.bold : defaultBold;
            return measureTextWidth(String(seg.text), fontSize, fontFamily, bo, it);
        }

        let maxW = 0;
        lines.forEach(arr => {
            let w = 0;
            arr.forEach(seg => { w += segWidth(seg); });
            if (w > maxW) maxW = w;
        });
        const lineH = fontSize + lineGap;
        const boxW = maxW + pad * 2;
        const boxH = lines.length * lineH - lineGap + pad * 2;

        const margin = (opts.margin != null) ? opts.margin : 15;
        const anchor = opts.anchor || 'top-right';
        const W = p.width || 800;
        const H = p.height || 600;

        let baseX, baseY;
        if (anchor === 'top-left')           { baseX = margin;             baseY = margin; }
        else if (anchor === 'top-right')     { baseX = W - boxW - margin;  baseY = margin; }
        else if (anchor === 'bottom-right')  { baseX = W - boxW - margin;  baseY = H - boxH - margin; }
        else if (anchor === 'bottom-left')   { baseX = margin;             baseY = H - boxH - margin; }
        else if (anchor === 'left-middle')   { baseX = margin;             baseY = (H - boxH) / 2; }
        else if (anchor === 'top-middle')    { baseX = (W - boxW) / 2;     baseY = margin; }
        else if (anchor === 'bottom-middle') { baseX = (W - boxW) / 2;     baseY = H - boxH - margin; }
        else                                 { baseX = W - boxW - margin;  baseY = (H - boxH) / 2; }

        const group = root.append('g')
            .attr('class', 'chart-formula')
            .datum({ baseX: baseX, baseY: baseY })
            .attr('transform', 'translate(' + (baseX + offset.dx) + ',' + (baseY + offset.dy) + ')');

        const bg = opts.background;
        if (bg && bg !== 'none') {
            const bgRect = group.append('rect')
                .attr('x', 0).attr('y', 0)
                .attr('width', boxW).attr('height', boxH)
                .attr('fill', bg);
            if (opts.border && opts.border !== 'none') {
                bgRect
                    .attr('stroke', opts.border)
                    .attr('stroke-width', (opts.borderWidth != null) ? opts.borderWidth : 0.8);
            }
        }

        group.append('rect')
            .attr('class', 'formula-hit')
            .attr('x', 0).attr('y', 0)
            .attr('width', boxW).attr('height', boxH)
            .attr('fill', 'transparent')
            .attr('pointer-events', 'all');

        lines.forEach((segs, i) => {
            const y = pad + i * lineH + fontSize * 0.8;
            let cx = pad;
            segs.forEach(seg => {
                const segItalic = (seg.italic != null) ? !!seg.italic : defaultItalic;
                const segBold = (seg.bold != null) ? !!seg.bold : defaultBold;
                const segColor = seg.color || color;
                const segText = String(seg.text);

                const t = group.append('text')
                    .attr('x', cx)
                    .attr('y', y)
                    .attr('font-size', fontSize)
                    .attr('font-weight', segBold ? 'bold' : 'normal')
                    .attr('font-style', segItalic ? 'italic' : 'normal')
                    .attr('fill', segColor)
                    .style('white-space', 'pre')
                    .text(segText);

                t.node().setAttribute('xml:space', 'preserve');

                cx += segWidth(seg);
            });
        });

        if (app) attachInteractions(group, app);

        return group;
    }

    function attachInteractions(group, app) {
        const state = getState(app);
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
                if (event.sourceEvent) event.sourceEvent.stopPropagation();
            })
            .on('drag', function (event) {
                if (!dragging) return;
                if (!state.formulaOffset) state.formulaOffset = { dx: 0, dy: 0 };
                state.formulaOffset.dx += event.x - startX;
                state.formulaOffset.dy += event.y - startY;
                startX = event.x;
                startY = event.y;
                const d = group.datum();
                group.attr('transform',
                    'translate(' + (d.baseX + state.formulaOffset.dx) + ',' +
                    (d.baseY + state.formulaOffset.dy) + ')');
            })
            .on('end', function () {
                dragging = false;
                group.style('cursor', 'move');
            });

        group.call(drag);

        group.on('wheel', function (event) {
            event.preventDefault();
            event.stopPropagation();
            const delta = -event.deltaY * 0.001;
            const cur = state.formulaScale || 1;
            state.formulaScale = Math.max(0.3, Math.min(3, cur + delta));
            if (app.state && app.state.currentSvg) app.drawChart();
        });
    }

    function reset(app) {
        const state = getState(app);
        state.formulaOffset = { dx: 0, dy: 0 };
        state.formulaScale = 1;
    }

    global.PlotFormula = {
        draw: draw,
        reset: reset
    };
})(window);
/* ============================================================
   BioDataTools 绘图区边距拖拽模块
   用法：
     PlotMargin.init({ onChange: () => drawChart() });
     PlotMargin.enable();   // 显示拖拽框
     PlotMargin.disable();  // 隐藏
     PlotMargin.get();      // { left, right, top, bottom }
============================================================ */
(function (global) {
    'use strict';

    const state = {
        left: 60,
        right: 60,
        top: 60,
        bottom: 60,
        enabled: false
    };

    let overlay = null;
    let rectEl = null;
    const handles = {};
    let previewEl = null;
    let onChange = null;
    let dragSide = null;
    let startPos = null;
    let startMargins = null;

    function ensurePreview() {
        previewEl = document.getElementById('chartPreview');
        if (!previewEl) return null;
        if (getComputedStyle(previewEl).position === 'static') {
            previewEl.style.position = 'relative';
        }
        return previewEl;
    }

    function build() {
        if (!ensurePreview()) return;
        destroy();

        overlay = document.createElement('div');
        overlay.className = 'plot-margin-overlay';

        rectEl = document.createElement('div');
        rectEl.className = 'plot-margin-rect';
        overlay.appendChild(rectEl);

        ['left', 'right', 'top', 'bottom'].forEach(side => {
            const h = document.createElement('div');
            h.className = 'plot-margin-handle plot-margin-handle-' + side;
            h.dataset.side = side;
            h.addEventListener('pointerdown', onDown);
            overlay.appendChild(h);
            handles[side] = h;
        });

        previewEl.appendChild(overlay);
        layout();
    }

    function destroy() {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = null;
        rectEl = null;
        for (const k in handles) delete handles[k];
    }

    function onDown(e) {
        if (!state.enabled) return;
        e.preventDefault();
        e.stopPropagation();
        dragSide = e.currentTarget.dataset.side;
        startPos = { x: e.clientX, y: e.clientY };
        startMargins = { left: state.left, right: state.right, top: state.top, bottom: state.bottom };
        e.currentTarget.setPointerCapture(e.pointerId);
        document.body.style.cursor =
            (dragSide === 'left' || dragSide === 'right') ? 'ew-resize' : 'ns-resize';
    }

    function onMove(e) {
        if (!dragSide || !previewEl) return;
        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;
        const r = previewEl.getBoundingClientRect();
        const maxW = Math.max(20, r.width * 0.6);
        const maxH = Math.max(20, r.height * 0.6);

        if (dragSide === 'left')   state.left   = clamp(startMargins.left + dx, 0, maxW);
        if (dragSide === 'right')  state.right  = clamp(startMargins.right - dx, 0, maxW);
        if (dragSide === 'top')    state.top    = clamp(startMargins.top + dy, 0, maxH);
        if (dragSide === 'bottom') state.bottom = clamp(startMargins.bottom - dy, 0, maxH);

        layout();
    }

    function onUp() {
        if (!dragSide) return;
        dragSide = null;
        document.body.style.cursor = '';
        if (onChange) onChange(get());
    }

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function layout() {
        if (!overlay || !previewEl) return;
        const svg = previewEl.querySelector('svg');
        const w = svg
            ? (parseFloat(svg.getAttribute('width')) || svg.clientWidth || previewEl.clientWidth)
            : previewEl.clientWidth;
        const h = svg
            ? (parseFloat(svg.getAttribute('height')) || svg.clientHeight || previewEl.clientHeight)
            : previewEl.clientHeight;

        rectEl.style.left   = state.left + 'px';
        rectEl.style.top    = state.top + 'px';
        rectEl.style.width  = Math.max(0, w - state.left - state.right) + 'px';
        rectEl.style.height = Math.max(0, h - state.top - state.bottom) + 'px';

        handles.left.style.left     = (state.left - 6) + 'px';
        handles.right.style.right   = (state.right - 6) + 'px';
        handles.top.style.top       = (state.top - 6) + 'px';
        handles.bottom.style.bottom = (state.bottom - 6) + 'px';
    }

    function get() {
        return { left: state.left, right: state.right, top: state.top, bottom: state.bottom };
    }

    function set(m) {
        if (!m) return;
        ['left', 'right', 'top', 'bottom'].forEach(k => {
            if (isFinite(m[k])) state[k] = m[k];
        });
        layout();
    }

    function enable() {
        state.enabled = true;
        build();
    }

    function disable() {
        state.enabled = false;
        destroy();
    }

    function init(opts) {
        opts = opts || {};
        onChange = opts.onChange || null;
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
        window.addEventListener('resize', layout);
        const preview = ensurePreview();
        if (preview) {
            new MutationObserver(layout).observe(preview, { childList: true, subtree: true });
        }
    }

    global.PlotMargin = {
        init, enable, disable, get, set, layout,
        get state() { return state; }
    };
})(window);
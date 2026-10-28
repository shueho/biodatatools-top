(function (global) {
    'use strict';

    const STR = {
        zh: {
            title: '图表预览（仅供预览，请在最后一步导出图片）',
            empty: '绘制图表后将在此处显示缩略图',
            collapse: '折叠',
            expand: '展开',
            refresh: '刷新',
            resetTitle: '恢复视角',
            hint: '本预览框仅供查看效果，支持拖动平移与滚轮缩放；为避免误触，如需拖拽图例等组件位置，请到第六步完成。右上角 ⟳ 刷新、↺ 恢复视角，拖动左上角可调整窗口大小。'
        },
        en: {
            title: 'Preview (for preview only — please export the image in the final step)',
            empty: 'The chart preview will appear here',
            collapse: 'Collapse',
            expand: 'Expand',
            refresh: 'Refresh',
            resetTitle: 'Reset view',
            hint: 'This preview is for reference only. Drag to pan and scroll to zoom. To avoid accidental edits, please adjust component positions (such as legends) in Step 6. Use ⟳ to refresh and ↺ to reset the view; drag the top-left corner to resize the window.'
        }
    };

    function lang() {
        if (global.PlotI18N && typeof global.PlotI18N.lang === 'function') {
            return global.PlotI18N.lang();
        }
        return window.location.pathname.indexOf('/en/') >= 0 ? 'en' : 'zh';
    }
    function T() {
        return STR[lang()] || STR.zh;
    }

    function injectStyle() {
        if (document.getElementById('tree-mini-preview-style')) return;
        const s = document.createElement('style');
        s.id = 'tree-mini-preview-style';
        s.textContent = `
.mini-preview {
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 560px;
    height: 480px;
    background: #ffffff;
    border: 1px solid #c8d2de;
    border-radius: 8px;
    box-shadow: 0 8px 26px rgba(15, 35, 60, .18);
    z-index: 9998;
    font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
    overflow: visible;
    display: flex;
    flex-direction: column;
    transition: box-shadow .2s ease;
}
.mini-preview.dragging {
    box-shadow: 0 14px 34px rgba(15, 35, 60, .3);
    transition: none;
}
.mini-preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 10px 7px 24px;
    background: linear-gradient(135deg, #1f4068 0%, #2a5a8e 100%);
    color: #fff;
    cursor: move;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    flex-shrink: 0;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
}
.mini-preview-title {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.mini-preview-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}
.mini-preview-btn {
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 5px;
    background: rgba(255, 255, 255, .18);
    color: #fff;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background .15s, transform .15s;
}
.mini-preview-btn:hover { background: rgba(255, 255, 255, .35); }
.mini-preview-btn:active { transform: scale(.92); }
.mini-preview-btn.spin { animation: mini-preview-spin .5s ease; }
@keyframes mini-preview-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}
.mini-preview-body {
    flex: 1 1 auto;
    min-height: 0;
    background: #f7fafd;
    padding: 8px;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
}
.mini-preview-body.dragging { cursor: grabbing; }
.mini-preview-body svg {
    display: block;
    width: 100%;
    height: 100%;
}
.mini-preview-body svg,
.mini-preview-body svg * {
    pointer-events: none !important;
}
.mini-preview-empty {
    color: #9aa7b6;
    font-size: 12px;
    line-height: 1.7;
    text-align: center;
    padding: 0 16px;
    user-select: none;
}
.mini-preview-hint {
    padding: 6px 10px;
    background: #fdecea;
    border-top: 1px solid #f5c2c0;
    font-size: 12px;
    font-weight: 700;
    color: #d93025;
    text-align: left;
    user-select: none;
    white-space: normal;
    word-break: break-word;
    line-height: 1.55;
    flex-shrink: 0;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
}
.mini-preview-resize {
    position: absolute;
    left: 3px;
    top: 3px;
    width: 16px;
    height: 16px;
    padding: 2px;
    box-sizing: border-box;
    cursor: nwse-resize;
    z-index: 11;
    color: rgba(255, 255, 255, 0.55);
    touch-action: none;
    display: block;
}
.mini-preview-resize:hover { color: rgba(255, 255, 255, 1); }
.mini-preview-resize svg {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
.mini-preview.collapsed {
    width: auto !important;
    height: auto !important;
    min-width: 110px;
}
.mini-preview.collapsed .mini-preview-body,
.mini-preview.collapsed .mini-preview-hint,
.mini-preview.collapsed .mini-preview-resize { display: none; }
@media (max-width: 640px) {
    .mini-preview { width: 240px; height: 200px; right: 10px; bottom: 10px; }
    .mini-preview-hint { font-size: 10px; padding: 4px 6px; line-height: 1.5; }
}
`;
        document.head.appendChild(s);
    }
function applyStrokeThreshold(svgEl) {
    if (!svgEl) return;
    let vbW = 940;
    try { const b = svgEl.viewBox.baseVal; if (b && b.width) vbW = b.width; } catch (_) {}
    const rect = bodyEl.getBoundingClientRect();
    const scale = rect.width > 0 ? rect.width / vbW : 1;
    const MIN_STROKE = Math.min(2, Math.max(0.6, 0.8 / Math.max(scale, 0.1)));
    svgEl.querySelectorAll('line, path, polyline, rect, circle, ellipse').forEach(el => {
        const sw = parseFloat(el.getAttribute('stroke-width') || '0');
        if (sw > 0 && sw < MIN_STROKE) el.setAttribute('stroke-width', String(MIN_STROKE));
    });
    svgEl.querySelectorAll('rect').forEach(el => {
        const w = parseFloat(el.getAttribute('width') || '0');
        const h = parseFloat(el.getAttribute('height') || '0');
        if (w > 0 && w < 0.6) el.setAttribute('width', '0.6');
        if (h > 0 && h < 0.6) el.setAttribute('height', '0.6');
    });
    svgEl.querySelectorAll('circle').forEach(el => {
        const r = parseFloat(el.getAttribute('r') || '0');
        if (r > 0 && r < 0.4) el.setAttribute('r', '0.4');
    });
}
    function buildRoot() {
        const root = document.createElement('div');
        root.id = 'treeMiniPreview';
        root.className = 'mini-preview';
        root.innerHTML = [
            '<div class="mini-preview-resize" title="拖拽调整窗口大小">',
            '  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">',
            '    <path d="M1 1 L9 9 M1 4 L6 9 M4 1 L9 6"/>',
            '  </svg>',
            '</div>',
            '<div class="mini-preview-header">',
            '  <span class="mini-preview-title"></span>',
            '  <div class="mini-preview-actions">',
            '    <button type="button" class="mini-preview-btn" data-act="reset"></button>',
            '    <button type="button" class="mini-preview-btn" data-act="refresh"></button>',
            '    <button type="button" class="mini-preview-btn" data-act="toggle"></button>',
            '  </div>',
            '</div>',
            '<div class="mini-preview-body">',
            '  <div class="mini-preview-empty"></div>',
            '</div>',
            '<div class="mini-preview-hint"></div>'
        ].join('');
        return root;
    }

    let rootEl = null;
    let bodyEl = null;
    let titleEl = null;
    let toggleBtn = null;
    let refreshBtn = null;
    let resetBtn = null;
    let hintEl = null;
    let resizeHandle = null;
    let observer = null;
    let refreshTimer = null;
    let collapsed = false;

    let originalVB = null;
    let currentVB = null;
    let panDragging = false;
    let panStartX = 0, panStartY = 0;
    let panVBStartX = 0, panVBStartY = 0;

    function updateTexts() {
        if (!rootEl) return;
        const t = T();
        titleEl.textContent = t.title;
        toggleBtn.title = collapsed ? t.expand : t.collapse;
        toggleBtn.textContent = collapsed ? '+' : '−';
        refreshBtn.title = t.refresh;
        refreshBtn.textContent = '⟳';
        if (resetBtn) {
            resetBtn.title = t.resetTitle;
            if (!resetBtn.querySelector('svg')) {
                resetBtn.innerHTML =
                    '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">' +
                    '<path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>' +
                    '</svg>';
            }
        }
        hintEl.textContent = t.hint;
        if (!bodyEl.querySelector('svg')) {
            bodyEl.innerHTML = '<div class="mini-preview-empty">' + t.empty + '</div>';
        }
    }

    function readSvgViewBox() {
        if (!bodyEl) return null;
        const svgEl = bodyEl.querySelector('svg');
        if (!svgEl) return null;
        let vb = null;
        try { vb = svgEl.viewBox && svgEl.viewBox.baseVal; } catch (_) {}
        if (!vb || !vb.width || !vb.height) return null;
        return { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
    }

    function applyViewBox() {
        if (!currentVB || !bodyEl) return;
        const svgEl = bodyEl.querySelector('svg');
        if (!svgEl) return;
        svgEl.setAttribute('viewBox', `${currentVB.x} ${currentVB.y} ${currentVB.w} ${currentVB.h}`);
    }

    function resetView() {
        if (!originalVB) return;
        currentVB = { x: originalVB.x, y: originalVB.y, w: originalVB.w, h: originalVB.h };
        applyViewBox();
    }

    function isViewModified() {
        if (!originalVB || !currentVB) return false;
        return Math.abs(currentVB.w - originalVB.w) > 0.001 ||
               Math.abs(currentVB.x - originalVB.x) > 0.001 ||
               Math.abs(currentVB.y - originalVB.y) > 0.001;
    }

    function setupZoomPan() {
        if (!bodyEl) return;

        bodyEl.addEventListener('wheel', (e) => {
            if (!currentVB || !originalVB) return;
            if (!bodyEl.querySelector('svg')) return;
            e.preventDefault();
            const rect = bodyEl.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const fx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const fy = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
            const minW = originalVB.w * 0.05;
            const maxW = originalVB.w * 20;
            const newW = Math.max(minW, Math.min(maxW, currentVB.w / factor));
            const ratio = originalVB.h / originalVB.w;
            const newH = newW * ratio;
            const wx = currentVB.x + fx * currentVB.w;
            const wy = currentVB.y + fy * currentVB.h;
            currentVB = {
                x: wx - fx * newW,
                y: wy - fy * newH,
                w: newW,
                h: newH
            };
            applyViewBox();
        }, { passive: false });

        bodyEl.addEventListener('pointerdown', (e) => {
            if (!currentVB) return;
            if (e.button !== 0) return;
            if (!bodyEl.querySelector('svg')) return;
            panDragging = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panVBStartX = currentVB.x;
            panVBStartY = currentVB.y;
            bodyEl.classList.add('dragging');
            try { bodyEl.setPointerCapture(e.pointerId); } catch (_) {}
            e.preventDefault();
        });

        bodyEl.addEventListener('pointermove', (e) => {
            if (!panDragging) return;
            const rect = bodyEl.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const dxPx = e.clientX - panStartX;
            const dyPx = e.clientY - panStartY;
            currentVB.x = panVBStartX - dxPx * currentVB.w / rect.width;
            currentVB.y = panVBStartY - dyPx * currentVB.h / rect.height;
            applyViewBox();
        });

        function endPan(e) {
            if (!panDragging) return;
            panDragging = false;
            bodyEl.classList.remove('dragging');
            try { bodyEl.releasePointerCapture(e.pointerId); } catch (_) {}
        }
        bodyEl.addEventListener('pointerup', endPan);
        bodyEl.addEventListener('pointercancel', endPan);
    }

    function setupResize(handle) {
        if (!handle || !rootEl) return;
        let resizing = false;
        let startX = 0, startY = 0;
        let startW = 0, startH = 0;
        let startLeft = 0, startTop = 0;
        let rightEdge = 0, bottomEdge = 0;

        handle.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            const rect = rootEl.getBoundingClientRect();
            resizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startW = rect.width;
            startH = rect.height;
            startLeft = rect.left;
            startTop = rect.top;
            rightEdge = startLeft + startW;
            bottomEdge = startTop + startH;
            rootEl.style.right = 'auto';
            rootEl.style.bottom = 'auto';
            rootEl.style.left = startLeft + 'px';
            rootEl.style.top = startTop + 'px';
            rootEl.style.width = startW + 'px';
            rootEl.style.height = startH + 'px';
            try { handle.setPointerCapture(e.pointerId); } catch (_) {}
        });

        handle.addEventListener('pointermove', (e) => {
            if (!resizing) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const minW = 240, minH = 200;
            const maxW = Math.max(minW, rightEdge - 8);
            const maxH = Math.max(minH, bottomEdge - 8);

            let newLeft = startLeft + dx;
            let newWidth = rightEdge - newLeft;
            if (newWidth < minW) { newWidth = minW; newLeft = rightEdge - minW; }
            if (newWidth > maxW) { newWidth = maxW; newLeft = rightEdge - maxW; }
            if (newLeft < 8) { newLeft = 8; newWidth = rightEdge - 8; }

            let newTop = startTop + dy;
            let newHeight = bottomEdge - newTop;
            if (newHeight < minH) { newHeight = minH; newTop = bottomEdge - minH; }
            if (newHeight > maxH) { newHeight = maxH; newTop = bottomEdge - maxH; }
            if (newTop < 8) { newTop = 8; newHeight = bottomEdge - 8; }

            rootEl.style.left = newLeft + 'px';
            rootEl.style.top = newTop + 'px';
            rootEl.style.width = newWidth + 'px';
            rootEl.style.height = newHeight + 'px';
        });

        function endResize(e) {
            if (!resizing) return;
            resizing = false;
            try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
        }
        handle.addEventListener('pointerup', endResize);
        handle.addEventListener('pointercancel', endResize);
    }

    function doRefresh() {
        if (!bodyEl) return;

        const oldOriginal = originalVB;
        const oldCurrent = currentVB;
        const hadModified = isViewModified();

        let zoomRatio = 1;
        let relCenterX = 0.5;
        let relCenterY = 0.5;
        if (hadModified && oldOriginal && oldCurrent) {
            zoomRatio = oldCurrent.w / oldOriginal.w;
            relCenterX = (oldCurrent.x + oldCurrent.w / 2 - oldOriginal.x) / oldOriginal.w;
            relCenterY = (oldCurrent.y + oldCurrent.h / 2 - oldOriginal.y) / oldOriginal.h;
        }

        if (!global.TreeExport || typeof global.TreeExport.exportSvgString !== 'function') {
            bodyEl.innerHTML = '<div class="mini-preview-empty">' + T().empty + '</div>';
            originalVB = null;
            currentVB = null;
            return;
        }

        let svgText = '';
        try {
            svgText = global.TreeExport.exportSvgString() || '';
        } catch (e) {
            console.warn('[TreeMiniPreview] exportSvgString failed:', e);
        }

        if (!svgText || svgText.indexOf('<svg') < 0) {
            bodyEl.innerHTML = '<div class="mini-preview-empty">' + T().empty + '</div>';
            originalVB = null;
            currentVB = null;
            return;
        }

        try {
            const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
            const svgEl = doc.documentElement;
            if (!svgEl || svgEl.nodeName.toLowerCase() !== 'svg') throw new Error('bad svg');
            svgEl.removeAttribute('width');
            svgEl.removeAttribute('height');
            svgEl.setAttribute('width', '100%');
            svgEl.setAttribute('height', '100%');
            svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svgEl.setAttribute('shape-rendering', 'geometricPrecision');
            svgEl.setAttribute('text-rendering', 'geometricPrecision');
            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
            svgEl.style.background = '#ffffff';
            svgEl.style.pointerEvents = 'none';
            svgEl.setAttribute('pointer-events', 'none');
            bodyEl.innerHTML = '';
            bodyEl.appendChild(document.importNode(svgEl, true));
            applyStrokeThreshold(bodyEl.querySelector('svg'));
        } catch (e) {
            bodyEl.innerHTML = svgText;
            const svgEl = bodyEl.querySelector('svg');
            if (svgEl) {
                svgEl.removeAttribute('width');
                svgEl.removeAttribute('height');
                svgEl.setAttribute('width', '100%');
                svgEl.setAttribute('height', '100%');
                svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                svgEl.setAttribute('shape-rendering', 'geometricPrecision');
                svgEl.setAttribute('text-rendering', 'geometricPrecision');
                svgEl.style.width = '100%';
                svgEl.style.height = '100%';
                svgEl.style.background = '#ffffff';
                svgEl.style.pointerEvents = 'none';
                svgEl.setAttribute('pointer-events', 'none');
                applyStrokeThreshold(svgEl);

            }
        }

        const newOriginal = readSvgViewBox();
        if (!newOriginal) {
            originalVB = null;
            currentVB = null;
            return;
        }

        originalVB = newOriginal;

        if (hadModified) {
            const newW = newOriginal.w * zoomRatio;
            const newH = newW * (newOriginal.h / newOriginal.w);
            currentVB = {
                x: newOriginal.x + relCenterX * newOriginal.w - newW / 2,
                y: newOriginal.y + relCenterY * newOriginal.h - newH / 2,
                w: newW,
                h: newH
            };
            applyViewBox();
        } else {
            currentVB = { x: newOriginal.x, y: newOriginal.y, w: newOriginal.w, h: newOriginal.h };
        }
    }

    function scheduleRefresh() {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(doRefresh, 80);
    }

    function manualRefresh() {
        clearTimeout(refreshTimer);
        const drawBtn = document.getElementById('drawBtn');
        if (drawBtn) {
            drawBtn.click();
        } else {
            doRefresh();
        }
        if (refreshBtn) {
            refreshBtn.classList.remove('spin');
            void refreshBtn.offsetWidth;
            refreshBtn.classList.add('spin');
            setTimeout(function () {
                refreshBtn.classList.remove('spin');
            }, 520);
        }
    }

    function setCollapsed(flag) {
        collapsed = !!flag;
        rootEl.classList.toggle('collapsed', collapsed);
        updateTexts();
        clampIntoViewport();
    }

    function clampIntoViewport() {
        if (!rootEl) return;
        const rect = rootEl.getBoundingClientRect();
        const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
        const maxTop = Math.max(8, window.innerHeight - rect.height - 8);

        if (rootEl.style.left) {
            const l = Math.min(Math.max(8, parseFloat(rootEl.style.left) || 0), maxLeft);
            rootEl.style.left = l + 'px';
        }
        if (rootEl.style.top) {
            const t = Math.min(Math.max(8, parseFloat(rootEl.style.top) || 0), maxTop);
            rootEl.style.top = t + 'px';
        }
    }

    function bindHeaderDrag(header) {
        let hDragging = false;
        let moved = false;
        let startX = 0, startY = 0, startLeft = 0, startTop = 0;

        header.addEventListener('pointerdown', function (e) {
            if (e.target.closest('.mini-preview-btn')) return;
            if (e.target.closest('.mini-preview-resize')) return;
            if (e.button !== undefined && e.button !== 0) return;

            const rect = rootEl.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startLeft = rect.left;
            startTop = rect.top;
            hDragging = true;
            moved = false;

            rootEl.style.left = startLeft + 'px';
            rootEl.style.top = startTop + 'px';
            rootEl.style.right = 'auto';
            rootEl.style.bottom = 'auto';
            rootEl.classList.add('dragging');

            try { header.setPointerCapture(e.pointerId); } catch (err) {}
            e.preventDefault();
        });

        header.addEventListener('pointermove', function (e) {
            if (!hDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) moved = true;

            const rect = rootEl.getBoundingClientRect();
            const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
            const maxTop = Math.max(8, window.innerHeight - rect.height - 8);

            const nx = Math.min(Math.max(8, startLeft + dx), maxLeft);
            const ny = Math.min(Math.max(8, startTop + dy), maxTop);

            rootEl.style.left = nx + 'px';
            rootEl.style.top = ny + 'px';
        });

        function endHeaderDrag(e) {
            if (!hDragging) return;
            hDragging = false;
            rootEl.classList.remove('dragging');
            try { header.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        header.addEventListener('pointerup', endHeaderDrag);
        header.addEventListener('pointercancel', endHeaderDrag);

        header.addEventListener('click', function (e) {
            if (e.target.closest('.mini-preview-btn')) return;
            if (e.target.closest('.mini-preview-resize')) return;
            if (moved) { moved = false; return; }
            setCollapsed(!collapsed);
        });
    }

    function init() {
        if (!global.TreeExport) return;
        const preview = document.getElementById('chartPreview');
        if (!preview) return;
        if (document.getElementById('treeMiniPreview')) return;
        if (document.getElementById('plotMiniPreview')) return;

        injectStyle();

        rootEl = buildRoot();
        document.body.appendChild(rootEl);

        bodyEl = rootEl.querySelector('.mini-preview-body');
        titleEl = rootEl.querySelector('.mini-preview-title');
        toggleBtn = rootEl.querySelector('[data-act="toggle"]');
        refreshBtn = rootEl.querySelector('[data-act="refresh"]');
        resetBtn = rootEl.querySelector('[data-act="reset"]');
        hintEl = rootEl.querySelector('.mini-preview-hint');
        resizeHandle = rootEl.querySelector('.mini-preview-resize');

        updateTexts();
        bindHeaderDrag(rootEl.querySelector('.mini-preview-header'));
        setupZoomPan();
        setupResize(resizeHandle);

        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            setCollapsed(!collapsed);
        });

        refreshBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            manualRefresh();
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                resetView();
            });
        }

        observer = new MutationObserver(scheduleRefresh);
        observer.observe(preview, { childList: true, subtree: true });

        window.addEventListener('resize', clampIntoViewport);
        scheduleRefresh();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 0);
    }

    global.TreeMiniPreview = {
        refresh: manualRefresh,
        resetView: resetView,
        collapse: function () { setCollapsed(true); },
        expand: function () { setCollapsed(false); },
        toggle: function () { setCollapsed(!collapsed); }
    };
})(window);
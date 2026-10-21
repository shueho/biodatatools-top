(function (global) {
    'use strict';

    const STR = {
        zh: {
            title: '图表预览（仅供预览，请在最后一步导出图片）',
            empty: '绘制图表后将在此处显示缩略图',
            collapse: '折叠',
            expand: '展开',
            refresh: '刷新',
            hint: '调整参数后，建议点击右上角 ⟳ 刷新预览'
        },
        en: {
            title: 'Preview (for preview only — please export the image in the final step)',
            empty: 'The chart preview will appear here',
            collapse: 'Collapse',
            expand: 'Expand',
            refresh: 'Refresh',
            hint: 'After adjusting parameters, click ⟳ (top right) to refresh the preview'
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
    background: #ffffff;
    border: 1px solid #c8d2de;
    border-radius: 10px;
    box-shadow: 0 8px 26px rgba(15, 35, 60, .18);
    z-index: 9998;
    font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
    overflow: hidden;
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
    padding: 7px 10px;
    background: linear-gradient(135deg, #1f4068 0%, #2a5a8e 100%);
    color: #fff;
    cursor: move;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
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
    height: 420px;
    background: #f7fafd;
    padding: 8px;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}
.mini-preview-body svg {
    display: block;
    width: 100%;
    height: 100%;
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
    text-align: center;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.mini-preview.collapsed {
    width: auto;
    min-width: 110px;
}
.mini-preview.collapsed .mini-preview-body,
.mini-preview.collapsed .mini-preview-hint { display: none; }
@media (max-width: 640px) {
    .mini-preview { width: 200px; right: 10px; bottom: 10px; }
    .mini-preview-body { height: 150px; }
    .mini-preview-hint { font-size: 10px; padding: 4px 6px; }
}
`;
        document.head.appendChild(s);
    }

    function buildRoot() {
        const root = document.createElement('div');
        root.id = 'treeMiniPreview';
        root.className = 'mini-preview';
        root.innerHTML = [
            '<div class="mini-preview-header">',
            '  <span class="mini-preview-title"></span>',
            '  <div class="mini-preview-actions">',
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
    let hintEl = null;
    let observer = null;
    let refreshTimer = null;
    let collapsed = false;

    function updateTexts() {
        if (!rootEl) return;
        const t = T();
        titleEl.textContent = t.title;
        toggleBtn.title = collapsed ? t.expand : t.collapse;
        toggleBtn.textContent = collapsed ? '+' : '−';
        refreshBtn.title = t.refresh;
        refreshBtn.textContent = '⟳';
        hintEl.textContent = t.hint;
        if (!bodyEl.querySelector('svg')) {
            bodyEl.innerHTML = '<div class="mini-preview-empty">' + t.empty + '</div>';
        }
    }

    function doRefresh() {
        if (!bodyEl) return;
        if (!global.TreeExport || typeof global.TreeExport.exportSvgString !== 'function') {
            bodyEl.innerHTML = '<div class="mini-preview-empty">' + T().empty + '</div>';
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
            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
            svgEl.style.background = '#ffffff';
            bodyEl.innerHTML = '';
            bodyEl.appendChild(document.importNode(svgEl, true));
        } catch (e) {
            bodyEl.innerHTML = svgText;
            const svgEl = bodyEl.querySelector('svg');
            if (svgEl) {
                svgEl.removeAttribute('width');
                svgEl.removeAttribute('height');
                svgEl.setAttribute('width', '100%');
                svgEl.setAttribute('height', '100%');
                svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                svgEl.style.width = '100%';
                svgEl.style.height = '100%';
                svgEl.style.background = '#ffffff';
            }
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

    function bindDrag(header) {
        let dragging = false;
        let moved = false;
        let startX = 0, startY = 0, startLeft = 0, startTop = 0;

        header.addEventListener('pointerdown', function (e) {
            if (e.target.closest('.mini-preview-btn')) return;
            if (e.button !== undefined && e.button !== 0) return;

            const rect = rootEl.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startLeft = rect.left;
            startTop = rect.top;
            dragging = true;
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
            if (!dragging) return;
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

        function endDrag(e) {
            if (!dragging) return;
            dragging = false;
            rootEl.classList.remove('dragging');
            try { header.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        header.addEventListener('pointerup', endDrag);
        header.addEventListener('pointercancel', endDrag);

        header.addEventListener('click', function (e) {
            if (e.target.closest('.mini-preview-btn')) return;
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
        hintEl = rootEl.querySelector('.mini-preview-hint');

        updateTexts();
        bindDrag(rootEl.querySelector('.mini-preview-header'));

        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            setCollapsed(!collapsed);
        });

        refreshBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            manualRefresh();
        });

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
        collapse: function () { setCollapsed(true); },
        expand: function () { setCollapsed(false); },
        toggle: function () { setCollapsed(!collapsed); }
    };
})(window);
(function (global) {
    'use strict';

    const STR = {
        zh: {
            title: '图表预览（仅供预览，请在最后一步导出图片）',
            empty: '绘制图表后将在此处显示缩略图',
            collapse: '折叠',
            expand: '展开',
            refresh: '刷新',
            hint: '调整参数后，建议点击右上角 ⟳ 刷新预览。开启放大镜后，点击预览区可固定观察位置，再次点击放大镜即可释放。',
            zoomTitle: '设置放大镜倍数',
            zoomPrompt: '请输入放大倍数：',
        },
        en: {
            title: 'Preview (for preview only — please export the image in the final step)',
            empty: 'The chart preview will appear here',
            collapse: 'Collapse',
            expand: 'Expand',
            refresh: 'Refresh',
            hint: 'After adjusting parameters, click ⟳ (top right) to refresh the preview. With the magnifier enabled, click the preview to pin the view; click the magnifier again to release.',
            zoomTitle: 'Set magnifier zoom',
            zoomPrompt: 'Enter magnifier zoom factor:',
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

.mini-preview-body svg,
.mini-preview-body svg * {
    pointer-events: none !important;
    cursor: default !important;
}

.mini-preview-magnifier .mag-content,
.mini-preview-magnifier .mag-content * {
    pointer-events: none !important;
    cursor: default !important;
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
    .mini-preview-hint { font-size: 10px; padding: 4px 6px; line-height: 1.5; }
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
            '    <button type="button" class="mini-preview-btn" data-act="zoom"></button>',
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
    let zoomBtn = null;
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
        if (zoomBtn) {
            zoomBtn.title = t.zoomTitle;
            if (!zoomBtn.querySelector('svg')) {
                zoomBtn.innerHTML =
                    '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" ' +
                    'stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
                    '<circle cx="7" cy="7" r="4.4"/>' +
                    '<line x1="10.4" y1="10.4" x2="14" y2="14"/>' +
                    '</svg>';
            }
        }
        hintEl.textContent = t.hint;
        if (!bodyEl.querySelector('svg')) {
            bodyEl.innerHTML = '<div class="mini-preview-empty">' + t.empty + '</div>';
        }
    }

    function doRefresh() {
        if (!bodyEl) return;
        magSvgClone = null;
        if (magContentWrap) magContentWrap.innerHTML = '';

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
            svgEl.style.pointerEvents = 'none';
            svgEl.setAttribute('pointer-events', 'none');
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
                svgEl.style.pointerEvents = 'none';
                svgEl.setAttribute('pointer-events', 'none');
            }
        }

        if (magLocked && magEl && magEl.style.display !== 'none') {
            const svgEl = bodyEl.querySelector('svg');
            if (svgEl) {
                repositionLockedMag();
                renderMagContent(svgEl, magLockRelX, magLockRelY);
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

        if (magEl) {
            if (collapsed) {
                magEl.style.display = 'none';
            } else if (magLocked) {
                const svgEl = bodyEl.querySelector('svg');
                if (svgEl) {
                    magEl.style.display = 'block';
                    repositionLockedMag();
                    renderMagContent(svgEl, magLockRelX, magLockRelY);
                }
            }
        }
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

        repositionLockedMag();
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

            if (magLocked) repositionLockedMag();
        });

        function endDrag(e) {
            if (!dragging) return;
            dragging = false;
            rootEl.classList.remove('dragging');
            try { header.releasePointerCapture(e.pointerId); } catch (err) {}
            if (magLocked) repositionLockedMag();
        }
        header.addEventListener('pointerup', endDrag);
        header.addEventListener('pointercancel', endDrag);

        header.addEventListener('click', function (e) {
            if (e.target.closest('.mini-preview-btn')) return;
            if (moved) { moved = false; return; }
            setCollapsed(!collapsed);
        });
    }

    let magEl = null;
    let magSvgClone = null;
    const MAG_SIZE = 200;
    let MAG_ZOOM = 1;

    let magLocked = false;
    let magLockRelX = 0.5;
    let magLockRelY = 0.5;
    let magContentWrap = null;

    function syncMagLockUI() {
        if (!magEl) return;
        if (magLocked) {
            magEl.classList.add('locked');
            magEl.style.borderColor = '#d93025';
            magEl.style.boxShadow = '0 8px 24px rgba(217,48,37,.45), inset 0 0 0 2px #fff';
            magEl.style.pointerEvents = 'auto';
            magEl.style.cursor = 'pointer';
        } else {
            magEl.classList.remove('locked');
            magEl.style.borderColor = '#2a5a8e';
            magEl.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3), inset 0 0 0 2px #fff';
            magEl.style.pointerEvents = 'none';
            magEl.style.cursor = '';
        }
    }

    function positionMagAt(clientX, clientY) {
        magEl.style.left = (clientX - MAG_SIZE / 2) + 'px';
        magEl.style.top = (clientY - MAG_SIZE / 2) + 'px';
    }

    function repositionLockedMag() {
        if (!magLocked || !bodyEl || !magEl) return;
        if (bodyEl.offsetWidth === 0 || bodyEl.offsetHeight === 0) return;
        const r = bodyEl.getBoundingClientRect();
        const cx = r.left + magLockRelX * r.width;
        const cy = r.top + magLockRelY * r.height;
        positionMagAt(cx, cy);
    }

    function renderMagContent(svgEl, relX, relY) {
        if (!svgEl || !magContentWrap) return;
        const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
        if (!vb || !vb.width) return;
        if (!magSvgClone || magSvgClone.parentNode !== magContentWrap) {
            magSvgClone = svgEl.cloneNode(true);
            magSvgClone.removeAttribute('width');
            magSvgClone.removeAttribute('height');
            magSvgClone.setAttribute('width', '100%');
            magSvgClone.setAttribute('height', '100%');
            magSvgClone.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            magSvgClone.style.width = '100%';
            magSvgClone.style.height = '100%';
            magSvgClone.style.display = 'block';
            magSvgClone.style.pointerEvents = 'none';
            magSvgClone.setAttribute('pointer-events', 'none');
            magContentWrap.innerHTML = '';
            magContentWrap.appendChild(magSvgClone);
        }
        const magVBW = vb.width / MAG_ZOOM;
        const magVBH = vb.height / MAG_ZOOM;
        const vx = vb.x + relX * vb.width - magVBW / 2;
        const vy = vb.y + relY * vb.height - magVBH / 2;
        magSvgClone.setAttribute('viewBox', `${vx} ${vy} ${magVBW} ${magVBH}`);
    }

    function lockMagnifier(relX, relY, clientX, clientY) {
        if (!bodyEl) return;
        magLocked = true;
        magLockRelX = Math.max(0, Math.min(1, relX));
        magLockRelY = Math.max(0, Math.min(1, relY));
        magEl.style.display = 'block';
        positionMagAt(clientX, clientY);
        const svgEl = bodyEl.querySelector('svg');
        if (svgEl) renderMagContent(svgEl, magLockRelX, magLockRelY);
        syncMagLockUI();
    }

    function unlockMagnifier() {
        if (!magLocked) return;
        magLocked = false;
        syncMagLockUI();
        magEl.style.display = 'none';
        magSvgClone = null;
        if (magContentWrap) magContentWrap.innerHTML = '';
    }

    function setupMagnifier() {
        if (!rootEl || !bodyEl) return;

        magEl = document.createElement('div');
        magEl.className = 'mini-preview-magnifier';
        magEl.style.cssText = `
            position: fixed;
            width: ${MAG_SIZE}px;
            height: ${MAG_SIZE}px;
            border-radius: 4px;
            border: 2px solid #2a5a8e;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3), inset 0 0 0 2px #fff;
            overflow: hidden;
            pointer-events: none;
            display: none;
            background: #fff;
            z-index: 99999;
            transition: border-color .15s ease, box-shadow .15s ease;
        `;
        document.body.appendChild(magEl);

        magContentWrap = document.createElement('div');
        magContentWrap.className = 'mag-content';   
        magContentWrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
        magEl.appendChild(magContentWrap);

        bodyEl.addEventListener('mousemove', (e) => {
            if (magLocked) return;
            if (Number(MAG_ZOOM) <= 1) { magEl.style.display = 'none'; return; }
            const svgEl = bodyEl.querySelector('svg');
            if (!svgEl) { magEl.style.display = 'none'; return; }
            const bodyRect = bodyEl.getBoundingClientRect();
            const x = e.clientX - bodyRect.left;
            const y = e.clientY - bodyRect.top;
            if (x < 0 || y < 0 || x > bodyRect.width || y > bodyRect.height) {
                magEl.style.display = 'none';
                return;
            }
            const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
            if (!vb || !vb.width) { magEl.style.display = 'none'; return; }

            magEl.style.display = 'block';
            positionMagAt(e.clientX, e.clientY);
            renderMagContent(svgEl, x / bodyRect.width, y / bodyRect.height);
        });

        bodyEl.addEventListener('mouseleave', () => {
            if (!magLocked && magEl) magEl.style.display = 'none';
        });

        bodyEl.addEventListener('click', (e) => {
            if (Number(MAG_ZOOM) <= 1) return;
            if (magLocked) return;
            const svgEl = bodyEl.querySelector('svg');
            if (!svgEl) return;
            const bodyRect = bodyEl.getBoundingClientRect();
            const x = e.clientX - bodyRect.left;
            const y = e.clientY - bodyRect.top;
            if (x < 0 || y < 0 || x > bodyRect.width || y > bodyRect.height) return;
            lockMagnifier(x / bodyRect.width, y / bodyRect.height, e.clientX, e.clientY);
        });

        magEl.addEventListener('click', (e) => {
            if (!magLocked) return;
            e.preventDefault();
            e.stopPropagation();
            unlockMagnifier();
        });

        syncMagLockUI();
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
        zoomBtn = rootEl.querySelector('[data-act="zoom"]');
        hintEl = rootEl.querySelector('.mini-preview-hint');

        updateTexts();
        bindDrag(rootEl.querySelector('.mini-preview-header'));
        setupMagnifier();

        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            setCollapsed(!collapsed);
        });

        refreshBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            manualRefresh();
        });

        zoomBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const cur = Number(MAG_ZOOM) || 3;
            const input = prompt(T().zoomPrompt, String(cur));
            if (input == null) return;
            const num = Number(input);
            if (!isFinite(num) || num <= 0) return;
            MAG_ZOOM = num;
            magSvgClone = null;
            if (magContentWrap) magContentWrap.innerHTML = '';

            if (MAG_ZOOM <= 1) {
                if (magLocked) unlockMagnifier();
                else if (magEl) magEl.style.display = 'none';
            } else if (magLocked && bodyEl) {
                const svgEl = bodyEl.querySelector('svg');
                if (svgEl) renderMagContent(svgEl, magLockRelX, magLockRelY);
            }
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
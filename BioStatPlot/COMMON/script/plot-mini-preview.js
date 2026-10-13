/* ============================================================
   BioDataTools 右下角悬浮预览窗口
   用途：在页面右下角显示当前图表的实时缩略预览，
        可拖动、可折叠，页面滚动时保持固定位置。
   用法：在图表页面（除 s001 等数据表页面）引入：
        <script src="../COMMON/script/plot-mini-preview.js"></script>
============================================================ */
(function (global) {
    'use strict';

    const STR = {
        zh: {
            title: '图表预览',
            empty: '绘制图表后将在此处显示缩略图',
            collapse: '折叠',
            expand: '展开'
        },
        en: {
            title: 'Preview',
            empty: 'The chart preview will appear here',
            collapse: 'Collapse',
            expand: 'Expand'
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

    /* ---------------- 样式 ---------------- */
    function injectStyle() {
        if (document.getElementById('plot-mini-preview-style')) return;
        const s = document.createElement('style');
        s.id = 'plot-mini-preview-style';
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
    transition: background .15s;
}
.mini-preview-btn:hover { background: rgba(255, 255, 255, .35); }
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
.mini-preview.collapsed {
    width: auto;
    min-width: 110px;
}
.mini-preview.collapsed .mini-preview-body { display: none; }
@media (max-width: 640px) {
    .mini-preview { width: 200px; right: 10px; bottom: 10px; }
    .mini-preview-body { height: 150px; }
}
`;
        document.head.appendChild(s);
    }

    /* ---------------- 构建 DOM ---------------- */
    function buildRoot() {
        const root = document.createElement('div');
        root.id = 'plotMiniPreview';
        root.className = 'mini-preview';
        root.innerHTML = [
            '<div class="mini-preview-header">',
            '  <span class="mini-preview-title"></span>',
            '  <div class="mini-preview-actions">',
            '    <button type="button" class="mini-preview-btn" data-act="toggle"></button>',
            '  </div>',
            '</div>',
            '<div class="mini-preview-body">',
            '  <div class="mini-preview-empty"></div>',
            '</div>'
        ].join('');
        return root;
    }

    /* ---------------- 主逻辑 ---------------- */
    let rootEl = null;
    let bodyEl = null;
    let titleEl = null;
    let toggleBtn = null;
    let observer = null;
    let refreshTimer = null;
    let collapsed = false;

    function updateTexts() {
        if (!rootEl) return;
        const t = T();
        titleEl.textContent = t.title;
        toggleBtn.title = collapsed ? t.expand : t.collapse;
        toggleBtn.textContent = collapsed ? '+' : '−';
        if (!bodyEl.querySelector('svg')) {
            bodyEl.innerHTML = '<div class="mini-preview-empty">' + t.empty + '</div>';
        }
    }

    /* ------- 刷新缩略图 ------- */
    function doRefresh() {
        const preview = document.getElementById('chartPreview');
        if (!preview || !bodyEl) return;

        const svg = preview.querySelector('svg');
        if (!svg) {
            bodyEl.innerHTML = '<div class="mini-preview-empty">' + T().empty + '</div>';
            return;
        }

        const clone = svg.cloneNode(true);
        clone.querySelectorAll('.canvas-border').forEach(n => n.remove());

        const w = parseFloat(svg.getAttribute('width')) || svg.clientWidth || 700;
        const h = parseFloat(svg.getAttribute('height')) || svg.clientHeight || 600;

        clone.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        clone.setAttribute('width', '100%');
        clone.setAttribute('height', '100%');
        clone.style.background = '#ffffff';

        bodyEl.innerHTML = '';
        bodyEl.appendChild(clone);
    }

    function scheduleRefresh() {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(doRefresh, 80);
    }

    /* ------- 折叠 / 展开 ------- */
    function setCollapsed(flag) {
        collapsed = !!flag;
        rootEl.classList.toggle('collapsed', collapsed);
        updateTexts();
        clampIntoViewport();
    }

    /* ------- 拖动 ------- */
    function clampIntoViewport() {
        if (!rootEl) return;
        const rect = rootEl.getBoundingClientRect();
        const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
        const maxTop = Math.max(8, window.innerHeight - rect.height - 8);

        // 只有被拖动过（left/top 已设置）才需要钳制
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

        // 纯点击（未拖动）→ 切换折叠
        header.addEventListener('click', function (e) {
            if (e.target.closest('.mini-preview-btn')) return;
            if (moved) { moved = false; return; }
            setCollapsed(!collapsed);
        });
    }

    /* ---------------- 初始化 ---------------- */
    function init() {
        const preview = document.getElementById('chartPreview');
        if (!preview) return;                       // 非绘图页，跳过
        if (document.getElementById('plotMiniPreview')) return;

        injectStyle();

        rootEl = buildRoot();
        document.body.appendChild(rootEl);

        bodyEl = rootEl.querySelector('.mini-preview-body');
        titleEl = rootEl.querySelector('.mini-preview-title');
        toggleBtn = rootEl.querySelector('[data-act="toggle"]');

        updateTexts();
        bindDrag(rootEl.querySelector('.mini-preview-header'));

        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            setCollapsed(!collapsed);
        });

        // 监听 chartPreview 内部结构变化
        observer = new MutationObserver(scheduleRefresh);
        observer.observe(preview, { childList: true, subtree: true });

        window.addEventListener('resize', clampIntoViewport);
        scheduleRefresh();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.PlotMiniPreview = {
        refresh: scheduleRefresh,
        collapse: function () { setCollapsed(true); },
        expand: function () { setCollapsed(false); },
        toggle: function () { setCollapsed(!collapsed); }
    };
})(window);
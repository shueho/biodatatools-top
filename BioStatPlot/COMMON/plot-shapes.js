/* ============================================================
   BioDataTools 通用形状设置模块
============================================================ */
(function (global) {
    'use strict';

    const SHAPES = [
        { id: 'square',   zh: '方形',   en: 'Square'   },
        { id: 'circle',   zh: '圆形',   en: 'Circle'   },
        { id: 'diamond',  zh: '菱形',   en: 'Diamond'  },
        { id: 'triangle', zh: '三角形', en: 'Triangle' },
        { id: 'star',     zh: '星形',   en: 'Star'     },
        { id: 'cross',    zh: '十字',   en: 'Cross'    },
        { id: 'wye',      zh: 'Y形',    en: 'Y-shape'  }
    ];

    function getLang() {
        return window.location.pathname.includes('/en/') ? 'en' : 'zh';
    }

    function shapeName(shapeId) {
        const s = SHAPES.find(x => x.id === shapeId);
        if (!s) return shapeId;
        return s[getLang()] || s.zh;
    }

    /**
     * 返回 d3.symbol 类型常量
     * 任何未知形状都退回 circle，保证永远不会返回 undefined
     */
function getSymbolType(shapeId) {
    if (!global.d3) return null;
    const D = global.d3;
    const map = {
        square:   D.symbolSquare,
        circle:   D.symbolCircle,
        diamond:  D.symbolDiamond,
        triangle: D.symbolTriangle,
        star:     D.symbolStar,
        cross:    D.symbolCross,
        wye:      D.symbolWye || D.symbolCircle
    };
    return map[shapeId] || D.symbolCircle;
}

function getSymbolSize(shapeId, targetSize) {
    const t = Math.max(1, Number(targetSize) || 1);
    const t2 = t * t;
    const k = {
        square:   1.00,
        circle:   0.785,
        diamond:  0.55,
        triangle: 1.20,
        star:     0.95,
        cross:    1.10,
        wye:      1.00
    };
    const factor = k[shapeId] || 1;
    return Math.max(1, t2 * factor);
}


    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ------------------------------------------------------------
       渲染形状选择器 UI
    ------------------------------------------------------------ */
    function renderShapeSelector(container, opts) {
        opts = opts || {};
        const items = opts.items || [];
        const st = opts.state || {};
        const lang = getLang();
        const isZh = lang === 'zh';

        if (!st.shapeMode) st.shapeMode = 'uniform';
        if (!st.uniformShape) st.uniformShape = 'square';
        if (!st.categoryShapes) st.categoryShapes = {};

        container.innerHTML = '';

        /* ---- 模式切换 ---- */
        const modeRow = document.createElement('div');
        modeRow.className = 'param-inline';
        modeRow.style.marginBottom = '12px';
        modeRow.innerHTML = `
            <label><input type="radio" name="shapeMode" value="uniform"
                ${st.shapeMode === 'uniform' ? 'checked' : ''}>
                ${isZh ? '统一形状' : 'Uniform shape'}
            </label>
            <label><input type="radio" name="shapeMode" value="perCategory"
                ${st.shapeMode === 'perCategory' ? 'checked' : ''}>
                ${isZh ? '按分类设置形状' : 'Per-category shape'}
            </label>
        `;
        container.appendChild(modeRow);

        modeRow.querySelectorAll('input[name="shapeMode"]').forEach(r => {
            r.addEventListener('change', () => {
                st.shapeMode = modeRow.querySelector('input[name="shapeMode"]:checked').value;
                renderShapeSelector(container, opts);
                opts.onChange && opts.onChange();
            });
        });

        /* ---- 统一形状 ---- */
        if (st.shapeMode === 'uniform') {
            const row = document.createElement('div');
            row.className = 'param-inline';
            row.innerHTML = `
                <label>${isZh ? '形状：' : 'Shape: '}
                    <select class="shape-uniform-select">
                        ${SHAPES.map(s =>
                            `<option value="${s.id}" ${s.id === st.uniformShape ? 'selected' : ''}>
                                ${s[lang] || s.zh}
                            </option>`
                        ).join('')}
                    </select>
                </label>
            `;
            const sel = row.querySelector('.shape-uniform-select');
            sel.addEventListener('change', () => {
                st.uniformShape = sel.value;
                opts.onChange && opts.onChange();
            });
            container.appendChild(row);
            return;
        }

        /* ---- 按分类设置 ---- */
        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'color-assign-empty';
            empty.textContent = isZh
                ? '选择分类列后将在此处显示每个类别的形状'
                : 'Category shapes will appear here after selecting a category column';
            container.appendChild(empty);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'color-assign-grid';
        items.forEach(it => {
            const cur = st.categoryShapes[it.name] || 'square';
            const row = document.createElement('div');
            row.className = 'color-assign-item';
            row.innerHTML = `
                <span style="display:inline-block;width:18px;height:18px;background:${it.color || '#999'};
                             border-radius:3px;flex-shrink:0;"></span>
                <span class="cat-name" title="${escapeHtml(it.name)}">${escapeHtml(it.name)}</span>
                <select class="shape-cat-select" style="width:auto;">
                    ${SHAPES.map(s =>
                        `<option value="${s.id}" ${s.id === cur ? 'selected' : ''}>
                            ${s[lang] || s.zh}
                        </option>`
                    ).join('')}
                </select>
            `;
            const sel = row.querySelector('.shape-cat-select');
            sel.addEventListener('change', () => {
                st.categoryShapes[it.name] = sel.value;
                opts.onChange && opts.onChange();
            });
            grid.appendChild(row);
        });
        container.appendChild(grid);
    }

global.PlotShapes = {
    SHAPES,
    getSymbolType,
    getSymbolSize,
    shapeName,
    renderShapeSelector
};
})(window);
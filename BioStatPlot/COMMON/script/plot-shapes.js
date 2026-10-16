/* ============================================================
   BioDataTools 通用形状设置模块
============================================================ */
(function (global) {
    'use strict';

    const SHAPES = [
        { id: 'square',          symbol: 'square',   hollow: false, zh: '实心方形',   en: 'Square' },
        { id: 'circle',          symbol: 'circle',   hollow: false, zh: '实心圆形',   en: 'Circle' },
        { id: 'diamond',         symbol: 'diamond2', hollow: false, zh: '实心菱形',   en: 'Diamond' },
        { id: 'triangle',        symbol: 'triangle', hollow: false, zh: '实心三角',   en: 'Triangle' },
        { id: 'star',            symbol: 'star',     hollow: false, zh: '实心星形',   en: 'Star' },
        { id: 'cross',           symbol: 'cross',    hollow: false, zh: '实心十字',   en: 'Cross' },
        { id: 'wye',             symbol: 'wye',      hollow: false, zh: '实心Y形',    en: 'Y-shape' },

        { id: 'square-hollow',   symbol: 'square',   hollow: true,  zh: '空心方形',   en: 'Hollow square' },
        { id: 'circle-hollow',   symbol: 'circle',   hollow: true,  zh: '空心圆形',   en: 'Hollow circle' },
        { id: 'diamond-hollow',  symbol: 'diamond2', hollow: true,  zh: '空心菱形',   en: 'Hollow diamond' },
        { id: 'triangle-hollow', symbol: 'triangle', hollow: true,  zh: '空心三角',   en: 'Hollow triangle' },
        { id: 'star-hollow',     symbol: 'star',     hollow: true,  zh: '空心星形',   en: 'Hollow star' },
        { id: 'cross-hollow',    symbol: 'cross',    hollow: true,  zh: '空心十字',   en: 'Hollow cross' },
        { id: 'wye-hollow',      symbol: 'wye',      hollow: true,  zh: '空心Y形',    en: 'Hollow Y-shape' }
    ];

    const SHAPE_MAP = {};
    SHAPES.forEach(s => { SHAPE_MAP[s.id] = s; });

    const SYMBOL_MAP = {
        square:   'symbolSquare',
        circle:   'symbolCircle',
        diamond2: 'symbolDiamond2',
        diamond:  'symbolDiamond',
        triangle: 'symbolTriangle',
        star:     'symbolStar',
        cross:    'symbolCross',
        wye:      'symbolWye'
    };

    const SIZE_FACTOR = {
        square:   1.00,
        circle:   0.785,
        diamond2: 0.60,
        diamond:  0.55,
        triangle: 1.20,
        star:     0.95,
        cross:    1.10,
        wye:      1.00
    };

    function getLang() {
        return window.location.pathname.includes('/en/') ? 'en' : 'zh';
    }

    function findShape(shapeId) {
        return SHAPE_MAP[shapeId] || null;
    }

    function shapeName(shapeId) {
        const s = findShape(shapeId);
        if (!s) return shapeId;
        return s[getLang()] || s.zh;
    }

    function isHollow(shapeId) {
        const s = findShape(shapeId);
        return !!(s && s.hollow);
    }

    function getSymbolType(shapeId) {
        if (!global.d3) return null;
        const D = global.d3;
        const s = findShape(shapeId);
        const symName = s ? s.symbol : 'circle';
        const key = SYMBOL_MAP[symName] || 'symbolCircle';
        return D[key] || D.symbolCircle;
    }

    function getSymbolSize(shapeId, targetSize) {
        const t = Math.max(1, Number(targetSize) || 1);
        const t2 = t * t;
        const s = findShape(shapeId);
        const symName = s ? s.symbol : 'circle';
        const factor = SIZE_FACTOR[symName] || 1;
        return Math.max(1, t2 * factor);
    }

    function buildSymbolPath(shapeId, targetSize) {
        if (!global.d3) return '';
        const symType = getSymbolType(shapeId);
        const size = getSymbolSize(shapeId, targetSize);
        return d3.symbol().type(symType).size(size)();
    }

    function applyShapeStyle(pathSel, shapeId, color, opts) {
        opts = opts || {};
        const hollow = isHollow(shapeId);
        const strokeWidth = (opts.strokeWidth != null) ? opts.strokeWidth : 1.5;

        if (hollow) {
            const fill = (opts.hollowFill !== undefined) ? opts.hollowFill : '#ffffff';
            pathSel
                .attr('fill', fill)
                .attr('stroke', color)
                .attr('stroke-width', strokeWidth);
        } else {
            pathSel
                .attr('fill', color)
                .attr('stroke', opts.stroke || 'none')
                .attr('stroke-width', opts.strokeWidth != null ? opts.strokeWidth : 0);
        }
    }

    function drawShape(parent, opts) {
        opts = opts || {};
        if (!global.d3) return null;
        const shapeId = opts.shapeId || 'circle';
        const x = opts.x || 0;
        const y = opts.y || 0;
        const size = opts.size || 6;
        const color = opts.color || '#333';

        const pathData = buildSymbolPath(shapeId, size);
        const el = parent.append('path')
            .attr('d', pathData)
            .attr('transform', 'translate(' + x + ',' + y + ')');
        applyShapeStyle(el, shapeId, color, opts);
        return el;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

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
        shapeName,
        isHollow,
        getSymbolType,
        getSymbolSize,
        buildSymbolPath,
        applyShapeStyle,
        drawShape,
        renderShapeSelector
    };
})(window);
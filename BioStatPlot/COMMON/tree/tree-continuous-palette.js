/* ============================================================
   BioDataTools 连续色板下拉组件
   全局名：ContinuousPalette（别名 ContPalette）
   ============================================================ */
(function (global) {
    'use strict';

    const VERSION = '1.6.1';

    function getInterpFn(name) {
        if (!global.d3) return function () { return '#cccccc'; };
        const key = 'interpolate' + name.charAt(0).toUpperCase() + name.slice(1);
        const f = global.d3[key];
        return typeof f === 'function' ? f : function () { return '#cccccc'; };
    }

    const GROUPS = [
        {
            key: 'div',
            title: '发散色板（双方向数值）',
            color: '#7c3aed',
            items: [
                { id: 'RdBu',     desc: '红-蓝' },
                { id: 'PiYG',     desc: '粉-黄绿' },
                { id: 'PRGn',     desc: '紫-绿' },
                { id: 'PuOr',     desc: '紫-橙' },
                { id: 'RdYlBu',   desc: '红-黄-蓝' },
                { id: 'RdYlGn',   desc: '红-黄-绿' },
                { id: 'BrBG',     desc: '棕-蓝绿' },
                { id: 'Spectral', desc: '彩虹光谱' }
            ]
        },
        {
            key: 'seq',
            title: '顺序色板（单方向数值）',
            color: '#b45309',
            items: [
                { id: 'Viridis', desc: '蓝→绿→黄' },
                { id: 'Magma',   desc: '黑→红→黄' },
                { id: 'Inferno', desc: '黑→橙→黄' },
                { id: 'Plasma',  desc: '紫→红→黄' },
                { id: 'Cividis', desc: '蓝→黄' },
                { id: 'Turbo',   desc: '彩虹高对比' },
                { id: 'YlOrRd',  desc: '黄→橙→红' },
                { id: 'YlGnBu',  desc: '黄→绿→蓝' },
                { id: 'YlGn',    desc: '黄→绿' },
                { id: 'OrRd',    desc: '橙→红' },
                { id: 'BuGn',    desc: '蓝→绿' },
                { id: 'PuBu',    desc: '紫→蓝' },
                { id: 'BuPu',    desc: '蓝→紫' },
                { id: 'GnBu',    desc: '绿→蓝' },
                { id: 'Oranges', desc: '白→橙' },
                { id: 'Blues',   desc: '白→蓝' },
                { id: 'Greens',  desc: '白→绿' },
                { id: 'Greys',   desc: '白→灰' },
                { id: 'Purples', desc: '白→紫' },
                { id: 'Reds',    desc: '白→红' },
                { id: 'Warm',    desc: '暖色系' },
                { id: 'Cool',    desc: '冷色系' }
            ]
        }
    ];

    function listNames() {
        const out = [];
        GROUPS.forEach(function (g) {
            g.items.forEach(function (it) { out.push(it.id); });
        });
        return out;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildGradientCss(id) {
        const interp = getInterpFn(id);
        const stops = [];
        for (let i = 0; i <= 9; i++) stops.push(interp(i / 9));
        return 'linear-gradient(to right, ' + stops.join(',') + ')';
    }

    let styleInjected = false;
    function injectStyle() {
        if (styleInjected) return;
        styleInjected = true;
        const s = document.createElement('style');
        s.id = 'continuous-palette-style';
        s.textContent = [
            '.ctp-wrap{position:relative;width:100%;max-width:none;}',
            '.ctp-trigger{display:flex;align-items:center;gap:10px;padding:7px 10px;',
                'border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;',
                'transition:border-color .2s,box-shadow .2s;user-select:none;box-sizing:border-box;}',
            '.ctp-trigger:hover{border-color:#1f4068;}',
            '.ctp-wrap.open .ctp-trigger{border-color:#1f4068;box-shadow:0 0 0 3px rgba(31,64,104,.12);}',
            '.ctp-preview{width:80px;min-width:60px;height:18px;border-radius:3px;flex-shrink:0;',
                'border:1px solid rgba(0,0,0,.06);}',
            '.ctp-name{flex:1;text-align:left;font-family:Consolas,Monaco,monospace;font-size:13px;color:#333;',
                'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
            '.ctp-caret{color:#666;font-size:10px;transition:transform .2s;flex-shrink:0;}',
            '.ctp-wrap.open .ctp-caret{transform:rotate(180deg);}',
            '.ctp-dropdown{position:absolute;top:calc(100% + 4px);left:0;',
                'min-width:340px;max-width:calc(100vw - 40px);',
                'background:#fff;border:1px solid #ccc;border-radius:6px;',
                'box-shadow:0 8px 20px rgba(31,64,104,.15);max-height:420px;overflow-y:auto;',
                'z-index:9500;display:none;}',
            '.ctp-wrap.open .ctp-dropdown{display:block;}',
            '.ctp-group{padding:8px 12px 6px;font-size:11px;font-weight:700;letter-spacing:.04em;',
                'background:#f4f6fb;border-top:1px solid #e6eaf2;position:sticky;top:0;',
                'z-index:1;user-select:none;pointer-events:none;}',
            '.ctp-group:first-child{border-top:none;}',
            '.ctp-option{display:flex;align-items:center;gap:10px;padding:6px 12px 6px 14px;',
                'cursor:pointer;border-bottom:1px solid #f0f4f8;transition:background .15s;}',
            '.ctp-option:hover{background:#eef2f7;}',
            '.ctp-option.active{background:#e3ecf7;}',
            '.ctp-option .ctp-name{font-size:12px;flex-shrink:0;min-width:70px;}',
            '.ctp-option .ctp-desc{color:#999;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
            '.ctp-check{margin-left:auto;color:#1f4068;font-weight:700;font-size:12px;visibility:hidden;flex-shrink:0;}',
            '.ctp-option.active .ctp-check{visibility:visible;}'
        ].join('');
        document.head.appendChild(s);
    }


    function render(container, opts) {
        opts = opts || {};
        if (!container) return;
        injectStyle();

        const allNames = listNames();
        const cur = (opts.selected && allNames.indexOf(opts.selected) !== -1)
            ? opts.selected : allNames[0];

        container.innerHTML = '';
        container.className = 'ctp-wrap';
        container.dataset.paletteVersion = VERSION;

        const trigger = document.createElement('div');
        trigger.className = 'ctp-trigger';
        trigger.innerHTML =
            '<div class="ctp-preview" style="background:' + buildGradientCss(cur) + '"></div>' +
            '<span class="ctp-name">' + escapeHtml(cur) + '</span>' +
            '<span class="ctp-caret">▼</span>';

        const dropdown = document.createElement('div');
        dropdown.className = 'ctp-dropdown';

        GROUPS.forEach(function (group) {
            const gl = document.createElement('div');
            gl.className = 'ctp-group';
            gl.style.color = group.color;
            gl.textContent = group.title;
            dropdown.appendChild(gl);

            group.items.forEach(function (item) {
                const opt = document.createElement('div');
                opt.className = 'ctp-option' + (cur === item.id ? ' active' : '');
                opt.dataset.value = item.id;
                const grad = buildGradientCss(item.id);
                opt.innerHTML =
                    '<div class="ctp-preview" style="background:' + grad + '"></div>' +
                    '<span class="ctp-name" style="color:' + group.color + ';">' + escapeHtml(item.id) + '</span>' +
                    '<span class="ctp-desc">' + escapeHtml(item.desc) + '</span>' +
                    '<span class="ctp-check">✓</span>';

                opt.addEventListener('click', function (e) {
                    e.stopPropagation();
                    dropdown.querySelectorAll('.ctp-option').forEach(function (el) {
                        el.classList.remove('active');
                    });
                    opt.classList.add('active');
                    trigger.querySelector('.ctp-name').textContent = item.id;
                    trigger.querySelector('.ctp-preview').style.background = grad;
                    container.classList.remove('open');
                    if (opts.onSelect) opts.onSelect(item.id, { group: group.key });
                });
                dropdown.appendChild(opt);
            });
        });

        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            document.querySelectorAll('.ctp-wrap.open').forEach(function (el) {
                if (el !== container) el.classList.remove('open');
            });
            container.classList.toggle('open');
        });

        container.appendChild(trigger);
        container.appendChild(dropdown);
    }

    document.addEventListener('click', function () {
        document.querySelectorAll('.ctp-wrap.open').forEach(function (el) {
            el.classList.remove('open');
        });
    });

    function getStops(name, n, reverse) {
        n = Math.max(2, n || 11);
        const base = getInterpFn(name || 'Viridis');
        const interp = reverse ? function (t) { return base(1 - t); } : base;
        const out = [];
        for (let i = 0; i < n; i++) out.push(interp(i / (n - 1)));
        return out;
    }

    function getColorScale(name, min, max, reverse) {
        if (!global.d3 || typeof global.d3.scaleSequential !== 'function') return null;
        const base = getInterpFn(name || 'Viridis');
        const interp = reverse ? function (t) { return base(1 - t); } : base;
        return global.d3.scaleSequential(interp).domain([min, max]).clamp(true);
    }

    /* ============================================================
       色条绘制
       tickSide = 'left'  → 纵向：刻度在左；横向：刻度在上
       tickSide = 'right' → 纵向：刻度在右；横向：刻度在下
       ============================================================ */
    let _gradCounter = 0;

    function drawColorBar(svg, opts) {
        opts = opts || {};
        if (!svg || !global.d3) return null;

        const cfg = opts.cfg || {};
        if (!cfg.offset) cfg.offset = { dx: 0, dy: 0 };
        if (!cfg.scale) cfg.scale = 1;

        const isH = cfg.orientation === 'horizontal';
        const thickness = cfg.thickness || 16;
        const barLength = cfg.length || 120;
        const barW = isH ? barLength : thickness;
        const barH = isH ? thickness : barLength;

        const x = opts.x != null ? opts.x : 0;
        const y = opts.y != null ? opts.y : 0;
        const stops = opts.stops || ['#ffffff', '#000000'];
        const title = cfg.title || '';
        const showLabels = cfg.showLabels !== false;
        const tickSide = cfg.tickSide || 'left';

        const minV = isFinite(opts.min) ? opts.min : 0;
        const maxV = isFinite(opts.max) ? opts.max : 1;
        const range = maxV - minV || 1;
        const decimals = cfg.decimals != null ? cfg.decimals : 2;
        const ticks = (opts.ticks && opts.ticks.length) ? opts.ticks : [minV, maxV];

        const labelFS = cfg.labelFontSize || 11;
        const labelBold = !!cfg.labelBold;
        const labelItalic = !!cfg.labelItalic;

        const titleFS = cfg.titleFontSize || 12;
        const titleBold = cfg.titleBold !== false;
        const titleItalic = !!cfg.titleItalic;

        const offset = cfg.offset;
        const scale = Math.max(0.3, Math.min(3, cfg.scale || 1));

        const tickLen = 4;   /* 统一在函数作用域，标题和刻度都会用到 */

        const g = svg.append('g')
            .attr('class', 'continuous-colorbar')
            .datum({ baseX: x, baseY: y })
            .attr('transform',
                'translate(' + (x + offset.dx) + ',' + (y + offset.dy) + ') scale(' + scale + ')');

        /* 渐变 */
        const gradId = 'ctp-grad-' + (++_gradCounter);
        const defs = svg.append('defs');
        const grad = defs.append('linearGradient').attr('id', gradId);
        if (isH) {
            grad.attr('x1', '0%').attr('y1', '50%').attr('x2', '100%').attr('y2', '50%');
        } else {
            grad.attr('x1', '50%').attr('y1', '100%').attr('x2', '50%').attr('y2', '0%');
        }
        stops.forEach(function (c, i) {
            grad.append('stop')
                .attr('offset', (stops.length > 1 ? i / (stops.length - 1) * 100 : 0) + '%')
                .attr('stop-color', c);
        });

        /* 色条本体 */
        g.append('rect')
            .attr('x', 0).attr('y', 0)
            .attr('width', barW).attr('height', barH)
            .attr('fill', 'url(#' + gradId + ')')
            .attr('stroke', '#ccc')
            .attr('stroke-width', 0.5);

        /* 标题：跟随刻度方向锚定 */
        if (title) {
            if (isH) {
                const titleY = (tickSide === 'left') ? (barH + tickLen + 22) : (-tickLen - 14);
                g.append('text')
                    .attr('x', barW / 2)
                    .attr('y', titleY)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', titleFS)
                    .attr('font-weight', titleBold ? 'bold' : 'normal')
                    .attr('font-style', titleItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(title);
            } else {
                /* 纵向：无论刻度在左还是在右，标题始终左对齐到色条左上方 */
                g.append('text')
                    .attr('x', -tickLen - 2)
                    .attr('y', -8)
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'auto')
                    .attr('font-size', titleFS)
                    .attr('font-weight', titleBold ? 'bold' : 'normal')
                    .attr('font-style', titleItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(title);
            }

        }

        function valueToPos(v) {
            const t = (v - minV) / range;
            return isH ? t * barW : barH * (1 - t);
        }
        function fmtVal(v) {
            if (!isFinite(v)) return '';
            return Number(v).toFixed(decimals);
        }

        /* 刻度 */
        if (showLabels) {
            ticks.forEach(function (t) {
                if (!isFinite(t)) return;
                const pos = valueToPos(t);
                if (!isFinite(pos)) return;

                if (isH) {
                    const isTop = (tickSide === 'left');
                    const y1 = isTop ? -tickLen : barH;
                    const y2 = isTop ? 0 : barH + tickLen;
                    const textY = isTop ? (-tickLen - 3) : (barH + tickLen + 3);
                    const baseline = isTop ? 'auto' : 'hanging';

                    g.append('line')
                        .attr('x1', pos).attr('x2', pos)
                        .attr('y1', y1).attr('y2', y2)
                        .attr('stroke', '#333').attr('stroke-width', 1);

                    g.append('text')
                        .attr('x', pos)
                        .attr('y', textY)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', baseline)
                        .attr('font-size', labelFS)
                        .attr('font-weight', labelBold ? 'bold' : 'normal')
                        .attr('font-style', labelItalic ? 'italic' : 'normal')
                        .attr('fill', '#333')
                        .text(fmtVal(t));
                } else {
                    const isLeft = (tickSide === 'left');
                    const x1 = isLeft ? -tickLen : barW;
                    const x2 = isLeft ? 0 : barW + tickLen;
                    const textX = isLeft ? (-tickLen - 2) : (barW + tickLen + 2);
                    const anchor = isLeft ? 'end' : 'start';

                    g.append('line')
                        .attr('x1', x1).attr('x2', x2)
                        .attr('y1', pos).attr('y2', pos)
                        .attr('stroke', '#333').attr('stroke-width', 1);

                    g.append('text')
                        .attr('x', textX)
                        .attr('y', pos)
                        .attr('text-anchor', anchor)
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', labelFS)
                        .attr('font-weight', labelBold ? 'bold' : 'normal')
                        .attr('font-style', labelItalic ? 'italic' : 'normal')
                        .attr('fill', '#333')
                        .text(fmtVal(t));
                }
            });
        }

        /* 透明命中区 */
        g.append('rect')
            .attr('x', -60).attr('y', -30)
            .attr('width', barW + 120).attr('height', barH + 70)
            .attr('fill', 'transparent')
            .attr('pointer-events', 'all');

        /* 拖动 */
        let dragging = false, sx = 0, sy = 0;
        g.style('cursor', 'move');

        const drag = d3.drag()
            .on('start', function (ev) {
                dragging = true;
                sx = ev.x; sy = ev.y;
                g.raise();
                g.style('cursor', 'grabbing');
                if (ev.sourceEvent) ev.sourceEvent.stopPropagation();
            })
            .on('drag', function (ev) {
                if (!dragging) return;
                cfg.offset.dx += ev.x - sx;
                cfg.offset.dy += ev.y - sy;
                sx = ev.x; sy = ev.y;
                const d = g.datum();
                g.attr('transform',
                    'translate(' + (d.baseX + cfg.offset.dx) + ',' +
                    (d.baseY + cfg.offset.dy) + ') scale(' + (cfg.scale || 1) + ')');
            })
            .on('end', function () {
                dragging = false;
                g.style('cursor', 'move');
            });
        g.call(drag);

        /* 滚轮缩放 */
        g.on('wheel', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            const delta = -ev.deltaY * 0.001;
            cfg.scale = Math.max(0.3, Math.min(3, (cfg.scale || 1) + delta));
            if (opts.onScaleChange) opts.onScaleChange(cfg.scale);
        });

        return g;
    }

    global.ContinuousPalette = {
        version: VERSION,
        render: render,
        getStops: getStops,
        getColorScale: getColorScale,
        drawColorBar: drawColorBar,
        listNames: listNames,
        getGroups: function () { return GROUPS; }
    };
    global.ContPalette = global.ContinuousPalette;

    if (global.PlotCommon && typeof global.PlotCommon.renderPaletteDropdown === 'function') {
        const _orig = global.PlotCommon.renderPaletteDropdown;
        global.PlotCommon.renderPaletteDropdown = function (container, opts) {
            opts = opts || {};
            if (opts.type === 'continuous') return render(container, opts);
            if (container && container.dataset &&
                container.dataset.paletteVersion === VERSION) return;
            return _orig.apply(this, arguments);
        };
    }
})(window);
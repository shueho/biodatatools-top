(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';
    const MAX_SETS = 10;

    const T = {
        importInfo: EN
            ? 'Each column is a <strong>set</strong>; the values in a column are the elements of that set. A header row is required. Up to 10 sets are recommended. You can paste directly from Excel.'
            : '每一列代表一个<strong>集合</strong>，列中的值即为该集合的元素。需包含表头，建议集合数不超过 10 个。可直接粘贴 Excel 内容。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectSets: EN ? '❌ Please select at least one set column' : '❌ 请至少选择一个集合列',
        noValid: EN ? '❌ Could not generate valid UpSet data. Please check the selected columns' : '❌ 未能生成有效的 UpSet 数据，请检查所选列',
        emptySet: EN ? 'Selected columns contain no valid elements' : '所选列中没有有效元素',
        noIntersection: EN ? '❌ No intersections to display. Try lowering the minimum intersection size' : '❌ 没有可显示的交集，请尝试降低最小交集大小',
        tooMany: EN ? '❌ Up to 10 sets are recommended' : '❌ 建议集合数不超过 10 个',
        sampleTip: EN ? 'Import data to select sets' : '导入数据后可选择',
        colorEmpty: EN ? 'Set colors will be shown here after selecting set columns' : '选择集合列后将在此处显示每个集合的颜色',
        topAxisPanelTitle: EN ? 'Axis settings (intersection bars)' : '坐标轴设置（交集柱状图）',
        setAxisPanelTitle: EN ? 'Axis settings (set size bars)' : '坐标轴设置（集合大小条形图）'
    };

    let _styleInjected = false;
    function injectUpsetStyle() {
        if (_styleInjected) return;
        _styleInjected = true;
        const s = document.createElement('style');
        s.id = 'upset-style';
        s.textContent = `
.upset-modal{position:fixed;inset:0;background:rgba(15,35,60,0.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;}
.upset-modal-content{background:#fff;border-radius:10px;width:min(520px,92vw);max-height:82vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(15,35,60,0.3);overflow:hidden;}
.upset-modal-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e3ebf3;font-weight:700;color:#1f4068;font-size:14px;gap:12px;}
.upset-modal-header span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.upset-modal-close{background:none;border:none;font-size:24px;cursor:pointer;color:#999;line-height:1;padding:0 4px;flex-shrink:0;}
.upset-modal-close:hover{color:#333;}
.upset-modal-body{flex:1;padding:12px 16px;min-height:0;}
.upset-modal-body textarea{width:100%;height:100%;min-height:220px;resize:vertical;border:1px solid #d0d8e0;border-radius:6px;padding:10px;font-family:Consolas,Monaco,"Courier New",monospace;font-size:13px;line-height:1.6;box-sizing:border-box;background:#fafcfe;color:#333;}
.upset-modal-footer{padding:10px 16px;border-top:1px solid #e3ebf3;text-align:right;}
`;
        document.head.appendChild(s);
    }

    function niceTicks(min, max, step) {
        if (max <= min) return [min];
        if (step > 0) {
            const ticks = [];
            const start = Math.ceil(min / step - 1e-9) * step;
            for (let v = start; v <= max + 1e-9; v += step) {
                ticks.push(Math.round(v * 1e6) / 1e6);
            }
            return ticks;
        }
        const range = max - min;
        const rawStep = range / 5;
        const exp = Math.floor(Math.log10(rawStep));
        const base = Math.pow(10, exp);
        const f = rawStep / base;
        let niceStep;
        if (f <= 1) niceStep = base;
        else if (f <= 2) niceStep = 2 * base;
        else if (f <= 5) niceStep = 5 * base;
        else niceStep = 10 * base;

        const ticks = [];
        const start = Math.ceil(min / niceStep - 1e-9) * niceStep;
        for (let v = start; v <= max + 1e-9; v += niceStep) {
            ticks.push(Math.round(v * 1e6) / 1e6);
        }
        return ticks;
    }

    /* 刻度值：优先用坐标轴面板里的“自定义刻度值”，否则自动生成整数刻度 */
    function pickTicks(cfg, domain) {
        const lo = Math.min(domain[0], domain[1]);
        const hi = Math.max(domain[0], domain[1]);
        if (window.PlotAxis && PlotAxis.resolveTicks) {
            const custom = PlotAxis.resolveTicks(cfg, null);
            if (custom && custom.length) {
                const inRange = custom.filter(v => v >= lo - 1e-9 && v <= hi + 1e-9);
                if (inRange.length) return inRange;
            }
        }
        const ticks = niceTicks(lo, hi, 0);
        // 交集大小、集合大小都是整数，避免出现 0.2、0.4 这样的刻度
        if (ticks.length > 1) {
            const step = ticks[1] - ticks[0];
            if (step > 0 && step < 1) return niceTicks(lo, hi, 1);
        }
        return ticks;
    }

    function maxLabelWidth(values, fontSize) {
        let w = 0;
        (values || []).forEach(v => {
            w = Math.max(w, PC.estTextWidth(String(v), fontSize));
        });
        return w;
    }

    /* 集合名太长时截断，避免盖住点矩阵 */
    function fitText(str, fontSize, maxW) {
        const s = String(str);
        if (!(maxW > 0) || PC.estTextWidth(s, fontSize) <= maxW) return s;
        let out = s;
        while (out.length > 1 && PC.estTextWidth(out + '…', fontSize) > maxW) {
            out = out.slice(0, -1);
        }
        return out + '…';
    }

    function computeIntersections(cols, data) {
        const sets = cols.map(col => {
            const elements = new Set();
            data.forEach(row => {
                const v = row[col];
                if (v === undefined || v === null) return;
                const s = String(v).trim();
                if (s === '') return;
                elements.add(s);
            });
            return { name: col, elements };
        });

        const allElements = new Set();
        sets.forEach(s => s.elements.forEach(e => allElements.add(e)));

        const regionMap = new Map();
        allElements.forEach(elem => {
            let mask = 0;
            sets.forEach((s, i) => {
                if (s.elements.has(elem)) mask |= (1 << i);
            });
            if (mask === 0) return;
            if (!regionMap.has(mask)) regionMap.set(mask, []);
            regionMap.get(mask).push(elem);
        });

        const setSizes = sets.map(s => s.elements.size);

        const intersections = [];
        regionMap.forEach((elements, mask) => {
            const setIdx = [];
            for (let i = 0; i < sets.length; i++) {
                if (mask & (1 << i)) setIdx.push(i);
            }
            intersections.push({
                mask: mask,
                count: elements.length,
                setIdx: setIdx,
                degree: setIdx.length,
                elements: elements.slice().sort()
            });
        });

        return { sets, setSizes, intersections, total: allElements.size };
    }

    function renderSetCols(app) {
        const box = app.$('setColsBox');
        const state = app.state;
        if (!box) return;
        if (!state.headers.length) {
            box.innerHTML = '<span style="color:#999;">' + T.sampleTip + '</span>';
            return;
        }
        box.innerHTML = state.headers.map(h => {
            const checked = state.roles.sets.indexOf(h) >= 0 ? 'checked' : '';
            return '<label><input type="checkbox" class="set-col-cb" value="' +
                PC.escapeHtml(h) + '" ' + checked + '> ' +
                PC.escapeHtml(h) + '</label>';
        }).join('');

        if (box._delegated) return;
        box._delegated = true;
        box.addEventListener('change', e => {
            if (!e.target.classList.contains('set-col-cb')) return;
            const checked = Array.from(box.querySelectorAll('.set-col-cb:checked'));
            if (checked.length > MAX_SETS) {
                e.target.checked = false;
                app.showTip('msgTip3', T.tooMany, 'error');
                return;
            }
            state.roles.sets = checked.map(x => x.value);
            state.customColors = {};
            refreshColors(app);
            if (state.data.length) app.drawChart();
        });
    }

    function refreshColors(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const sets = app.state.roles.sets || [];
        if (!sets.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const baseColors = app.resolvePaletteColors(sets.length);
        PC.renderColorAssignment(container, {
            items: sets.map((s, i) => ({
                name: s,
                color: app.state.customColors[s] || baseColors[i]
            })),
            onChange: (idx, newColor) => {
                app.state.customColors[sets[idx]] = newColor;
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: () => {
                app.state.customColors = {};
                refreshColors(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    function num(app, id, fb) {
        return PC.num(app, id, fb);
    }

    /* ============================================================
       坐标轴状态（上下两个柱形图各用一套，互不影响）
       ============================================================ */
    function createTopAxisState() {
        const st = PlotAxis.defaultState();
        // X 轴：交集分类轴，默认只画轴线，不显示刻度与文字
        st.x.tickShow = false;
        st.x.tickValueShow = false;
        st.x.tickLength = 4;
        st.x.tickFontSize = 10;
        st.x.tickBold = false;
        st.x.tickColor = '#333333';
        st.x.titleShow = true;
        st.x.titleContent = '';
        st.x.lineShow = true;
        st.x.lineColor = '#333333';
        st.x.lineWidth = 1;
        st.x.gridColor = '#eeeeee';

        // Y 轴：交集大小数值轴
        st.y.titleShow = true;
        st.y.titleContent = 'Intersection size';
        st.y.titleFontSize = 12;
        st.y.titleBold = false;
        st.y.tickShow = true;
        st.y.tickLength = 4;
        st.y.tickFontSize = 10;
        st.y.tickBold = false;
        st.y.tickColor = '#333333';
        st.y.lineShow = true;
        st.y.lineColor = '#333333';
        st.y.lineWidth = 1;
        st.y.gridShow = false;
        st.y.gridColor = '#eeeeee';
        return st;
    }

    function createSetAxisState() {
        const st = PlotAxis.defaultState();
        // X 轴：集合大小数值轴（条形图的数值轴）
        st.x.titleShow = true;
        st.x.titleContent = 'Set size';
        st.x.titleFontSize = 11;
        st.x.titleBold = false;
        st.x.tickShow = true;
        st.x.tickLength = 4;
        st.x.tickFontSize = 10;
        st.x.tickBold = false;
        st.x.tickColor = '#666666';
        st.x.lineShow = true;
        st.x.lineColor = '#333333';
        st.x.lineWidth = 1;
        st.x.gridShow = false;
        st.x.gridColor = '#eeeeee';

        // Y 轴：集合名分类轴，文字放在轴线右侧
        st.y.titleShow = true;
        st.y.titleContent = '';
        st.y.tickShow = true;
        st.y.tickValueShow = true;
        st.y.tickLabelPos = 'inside';
        st.y.tickDir = 'in';
        st.y.tickLength = 4;
        st.y.tickFontSize = 12;
        st.y.tickBold = false;
        st.y.tickItalic = false;
        st.y.tickColor = '#333333';
        st.y.lineShow = true;
        st.y.lineColor = '#333333';
        st.y.lineWidth = 1;
        st.y.gridShow = false;
        st.y.gridColor = '#eeeeee';
        return st;
    }

    function ensureAxisState(app) {
        const s = app.state;
        if (!s.axisTop || !s.axisTop.x || !s.axisTop.y) s.axisTop = createTopAxisState();
        if (!s.axisSet || !s.axisSet.x || !s.axisSet.y) s.axisSet = createSetAxisState();
    }

    /* 两个坐标轴面板：使用公共 plot-axis.js，分别控制上下两个柱形图 */
    function renderAxisPanels(app) {
        if (!window.PlotAxis || !PlotAxis.render) return;
        ensureAxisState(app);
        const s = app.state;
        const redraw = () => { if (s.currentSvg) app.drawChart(); };

        PlotAxis.render(app.$('upsetTopAxisPanel'), {
            state: s.axisTop,
            title: T.topAxisPanelTitle,
            showDirection: false,      // UpSet 布局固定，不支持翻转图表方向
            axisTypes: { x: 'category', y: 'numeric' },
            features: { log: false, break: false, cross: false },
            onChange: redraw
        });

        PlotAxis.render(app.$('upsetSetAxisPanel'), {
            state: s.axisSet,
            title: T.setAxisPanelTitle,
            showDirection: false,
            axisTypes: { x: 'numeric', y: 'category' },
            features: { log: false, break: false, cross: false },
            onChange: redraw
        });
    }

    function readParams(app) {
        const p = PC.readCommonParams(app, { width: 800, height: 600 });
        const $ = app.$;

        p.topHeightRatio = Math.max(0.2, Math.min(0.8, num(app, 'upsetTopHeightRatio', 0.5)));
        p.gapH = Math.max(0, num(app, 'upsetGapH', 20));

        p.sortBy = ($('upsetSortBy') && $('upsetSortBy').value) || 'size';
        p.sortDir = ($('upsetSortDir') && $('upsetSortDir').value) || 'desc';
        p.maxItems = Math.max(1, Math.round(num(app, 'upsetMaxItems', 20)));
        p.minCount = Math.max(1, Math.round(num(app, 'upsetMinCount', 1)));

        p.setOrder = ($('upsetSetOrder') && $('upsetSetOrder').value) || 'original';
        p.setCustomOrder = $('upsetSetCustomOrder') ? $('upsetSetCustomOrder').value : '';

        p.topYAxisShow = $('upsetTopYAxisShow') ? $('upsetTopYAxisShow').checked : true;
        p.topYAxisPos = ($('upsetTopYAxisPos') && $('upsetTopYAxisPos').value) || 'left';

        p.barWidth = Math.max(0.1, Math.min(0.95, num(app, 'upsetBarWidth', 0.6)));
        p.barColor = ($('upsetBarColor') && $('upsetBarColor').value) || '#4e79a7';
        p.showCount = $('upsetShowCount') ? $('upsetShowCount').checked : true;
        p.countFontSize = Math.max(6, num(app, 'upsetCountFontSize', 10));
        p.countColor = ($('upsetCountColor') && $('upsetCountColor').value) || '#333333';
        p.countBold = $('upsetCountBold') ? $('upsetCountBold').checked : false;
        p.countItalic = $('upsetCountItalic') ? $('upsetCountItalic').checked : false;

        p.pointSize = Math.max(2, num(app, 'upsetPointSize', 9));
        p.lineWidth = Math.max(0.5, num(app, 'upsetLineWidth', 1.5));
        p.lineColor = ($('upsetLineColor') && $('upsetLineColor').value) || '#888888';

        p.showSetBars = $('upsetShowSetBars') ? $('upsetShowSetBars').checked : true;
        p.setBarWidth = Math.max(0.05, Math.min(1, num(app, 'upsetSetBarWidth', 0.3)));
        p.setBarColorMode = ($('upsetSetBarColorMode') && $('upsetSetBarColorMode').value) || 'set';
        p.setBarColor = ($('upsetSetBarColor') && $('upsetSetBarColor').value) || '#999999';
        p.showSetValues = $('upsetShowSetValues') ? $('upsetShowSetValues').checked : true;
        p.setValueFontSize = Math.max(6, num(app, 'upsetSetValueFontSize', 10));
        p.setValueBold = $('upsetSetValueBold') ? $('upsetSetValueBold').checked : false;
        p.setValueItalic = $('upsetSetValueItalic') ? $('upsetSetValueItalic').checked : false;

        p.setAxisShowX = $('upsetSetAxisShowX') ? $('upsetSetAxisShowX').checked : true;
        p.setAxisShowY = $('upsetSetAxisShowY') ? $('upsetSetAxisShowY').checked : true;

        p.showTrack = $('upsetShowTrack') ? $('upsetShowTrack').checked : true;
        p.trackColor = ($('upsetTrackColor') && $('upsetTrackColor').value) || '#e8edf2';
        p.trackWidth = Math.max(0.5, num(app, 'upsetTrackWidth', 1));

        return p;
    }

    function buildSetOrder(res, p) {
        let order = res.sets.map((s, i) => i);
        if (p.setOrder === 'sizeDesc') {
            order.sort((a, b) => res.setSizes[b] - res.setSizes[a] || a - b);
        } else if (p.setOrder === 'sizeAsc') {
            order.sort((a, b) => res.setSizes[a] - res.setSizes[b] || a - b);
        } else if (p.setOrder === 'custom') {
            const raw = String(p.setCustomOrder || '')
                .split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
            const nameToIdx = new Map();
            res.sets.forEach((s, i) => nameToIdx.set(s.name, i));
            const out = [];
            const used = new Set();
            raw.forEach(name => {
                const idx = nameToIdx.get(name);
                if (idx !== undefined && !used.has(idx)) {
                    out.push(idx);
                    used.add(idx);
                }
            });
            order.forEach(idx => {
                if (!used.has(idx)) out.push(idx);
            });
            order = out;
        }
        return order;
    }

    function buildIntersectionList(res, p) {
        let list = res.intersections.filter(d => d.count >= p.minCount);
        const dir = p.sortDir === 'asc' ? 1 : -1;

        if (p.sortBy === 'size') {
            list.sort((a, b) => (a.count - b.count) * dir || a.mask - b.mask);
        } else if (p.sortBy === 'degree') {
            list.sort((a, b) =>
                (a.degree - b.degree) * dir ||
                (a.count - b.count) * dir ||
                a.mask - b.mask
            );
        } else {
            list.sort((a, b) => (a.mask - b.mask) * dir);
        }

        if (p.maxItems > 0) list = list.slice(0, p.maxItems);
        return list;
    }

    function showIntersectionModal(intersection, sets) {
        const existing = document.getElementById('upsetModal');
        if (existing) existing.remove();

        const setNames = intersection.setIdx.map(i => sets[i].name);
        const title = setNames.join(' ∩ ');
        const elements = intersection.elements || [];

        const modal = document.createElement('div');
        modal.id = 'upsetModal';
        modal.className = 'upset-modal';
        modal.innerHTML = `
            <div class="upset-modal-content">
                <div class="upset-modal-header">
                    <span></span>
                    <button class="upset-modal-close" type="button">×</button>
                </div>
                <div class="upset-modal-body">
                    <textarea readonly></textarea>
                </div>
                <div class="upset-modal-footer">
                    <span class="upset-copy-hint" style="display:none;color:#2e7d32;font-size:13px;margin-right:10px;"></span>
                    <button class="btn upset-copy-btn" type="button">${EN ? 'Copy all' : '复制全部'}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.upset-modal-header span').textContent =
            title + ' · ' + elements.length + (EN ? ' elements' : ' 个元素');
        modal.querySelector('textarea').value = elements.join('\n');

        modal.querySelector('.upset-modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('mousedown', e => { if (e.target === modal) modal.remove(); });

        const copyBtn = modal.querySelector('.upset-copy-btn');
        const hint = modal.querySelector('.upset-copy-hint');

        copyBtn.addEventListener('click', () => {
            const ta = modal.querySelector('textarea');
            ta.select();
            ta.setSelectionRange(0, ta.value.length);
            const done = () => {
                hint.textContent = EN ? '✓ Copied' : '✓ 已复制';
                hint.style.display = 'inline';
                clearTimeout(hint._timer);
                hint._timer = setTimeout(() => { hint.style.display = 'none'; }, 1500);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(ta.value).then(done).catch(() => {
                    try { document.execCommand('copy'); done(); } catch (_) {}
                });
            } else {
                try { document.execCommand('copy'); done(); } catch (_) {}
            }
        });

        const onKey = e => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', onKey);
            }
        };
        document.addEventListener('keydown', onKey);
    }

    function fmtAxisTick(v) {
        return PC.fmtNum(v, 2);
    }

    function axisTitle(svg, opts) {
        svg.append('text')
            .attr('x', opts.x)
            .attr('y', opts.y)
            .attr('transform', opts.transform || null)
            .attr('text-anchor', opts.anchor || 'middle')
            .attr('dominant-baseline', opts.baseline || 'auto')
            .attr('font-size', opts.fontSize)
            .attr('font-weight', opts.bold ? 'bold' : 'normal')
            .attr('font-style', opts.italic ? 'italic' : 'normal')
            .attr('fill', opts.color || '#333')
            .text(opts.text);
    }

    function drawChart(app) {
        injectUpsetStyle();
        const s = app.state;
        app.toolbarTip.textContent = '';

        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        const cols = s.roles.sets || [];
        if (!cols.length) { app.showTip('msgTip3', T.selectSets, 'error'); return; }

        const res = computeIntersections(cols, s.data);
        if (!res.total) { app.showTip('msgTip3', T.emptySet, 'error'); return; }

        const p = readParams(app);
        const list = buildIntersectionList(res, p);
        if (!list.length) { app.showTip('msgTip3', T.noIntersection, 'error'); return; }

        const setOrder = buildSetOrder(res, p);
        const nSets = res.sets.length;

        ensureAxisState(app);
        const axisTop = s.axisTop;
        const axisSet = s.axisSet;
        const cfgTopX = axisTop.x;
        const cfgTopY = axisTop.y;
        const cfgSetX = axisSet.x;
        const cfgSetY = axisSet.y;
        [cfgTopX, cfgTopY, cfgSetX, cfgSetY].forEach(cfg => { cfg.fontFamily = p.fontFamily; });

        const setColors = res.sets.map((st, i) =>
            s.customColors[st.name] || app.resolvePaletteColors(nSets)[i]
        );

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width,
            height: p.height,
            fontFamily: p.fontFamily,
            border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        const margin = 30;
        const W = p.width;
        const H = p.height;
        const innerW = W - 2 * margin;
        const innerH = H - 2 * margin;

        /* ---------- 两个数值轴的范围与刻度 ---------- */
        const countDataMax = list.reduce((m, d) => Math.max(m, d.count), 1);
        const topYDomain = PlotAxis.resolveDomain(cfgTopY, [0, countDataMax]);
        const topYTicks = pickTicks(cfgTopY, topYDomain);

        const setDataMax = res.setSizes.reduce((m, v) => Math.max(m, v), 1);
        const setXDomain = PlotAxis.resolveDomain(cfgSetX, [0, setDataMax]);
        const setXTicks = pickTicks(cfgSetX, setXDomain);

        // 上面 X 轴的交集标签（可在坐标轴面板里打开）
        const topXTickLabels = list.map(d => d.setIdx.map(i => res.sets[i].name).join('∩'));

        /* ---------- 左侧列宽：集合条形 → 集合名轴 → 集合名 → 点矩阵 ---------- */
        const nameShown = p.setAxisShowY && cfgSetY.tickValueShow;
        let maxNameW = 0;
        if (nameShown) {
            res.sets.forEach(st => {
                maxNameW = Math.max(maxNameW, PC.estTextWidth(st.name, cfgSetY.tickFontSize));
            });
        }
        const nameW = nameShown ? Math.min(maxNameW + 4, innerW * 0.2) : 0;
        const nameLabelPad = nameShown
            ? ((cfgSetY.tickShow ? cfgSetY.tickLength : 0) + (cfgSetY.tickLabelPos === 'inside' ? 4 : 6))
            : 0;
        const nameArea = nameW + nameLabelPad;
        const namesInside = cfgSetY.tickLabelPos !== 'outside';

        const barMaxW = p.showSetBars ? Math.min(innerW * 0.18, 180) : 0;
        const matrixGap = 12;

        const barStartX = margin;
        const barAxisX = margin + barMaxW;
        const nameAxisX = barAxisX + (namesInside ? 0 : nameArea);

        /* ---------- 上部分数值轴放在右侧时，右侧要留出空间 ---------- */
        const topYTickLabelW = cfgTopY.tickValueShow
            ? maxLabelWidth(topYTicks, cfgTopY.tickFontSize)
            : 0;
        const topYTitleRoom = (cfgTopY.titleShow && cfgTopY.titleContent)
            ? cfgTopY.titleFontSize + 8
            : 0;
        const topYAxisRoom = (cfgTopY.tickShow ? cfgTopY.tickLength : 0) + topYTickLabelW + 8 + topYTitleRoom;

        let rightRoom = 0;
        if (p.topYAxisShow && p.topYAxisPos === 'right') rightRoom = topYAxisRoom;

        let matrixLeft = nameAxisX + (namesInside ? nameArea : 0) + matrixGap;
        let matrixRight = margin + innerW - rightRoom;

        // 左上角也要放得下数值轴（轴标题 → 刻度文字 → 轴线），避免超出画布
        if (p.topYAxisShow && p.topYAxisPos !== 'right') {
            matrixLeft = Math.max(matrixLeft, margin + topYAxisRoom);
        }
        if (matrixRight - matrixLeft < 80) {
            matrixLeft = Math.max(margin, matrixRight - 80);
        }
        const matrixW = Math.max(20, matrixRight - matrixLeft);

        /* ---------- 高度分配 ---------- */
        const setTickLen = cfgSetX.tickShow ? cfgSetX.tickLength : 0;
        const setTickLabelH = cfgSetX.tickValueShow ? cfgSetX.tickFontSize + 6 : 0;
        const setTitleH = (cfgSetX.titleShow && cfgSetX.titleContent)
            ? cfgSetX.titleFontSize + 10
            : 0;
        const axisGap = 10; // 点矩阵底部到大小轴轴线的距离
        // 没有集合条形时，数值轴没有可对应的数据，直接不画
        const showSizeAxis = p.setAxisShowX && p.showSetBars;
        const bottomAxisH = showSizeAxis
            ? (axisGap + setTickLen + setTickLabelH + setTitleH)
            : 0;

        // 上部分 X 轴的刻度/文字/标题放在“柱-矩阵间距”里
        const topXTickTextW = cfgTopX.tickValueShow
            ? topXTickLabels.reduce((m, s) => Math.max(m, PC.estTextWidth(s, cfgTopX.tickFontSize)), 0)
            : 0;
        const topXRot = Math.abs((((cfgTopX.tickRotate || 0) % 180) + 180) % 180);
        const topXRotExtra = topXTickTextW * 0.5 * Math.sin(topXRot * Math.PI / 180)
            + (cfgTopX.tickValueShow ? cfgTopX.tickFontSize * 0.5 : 0);
        const topXAxisBlockH = (cfgTopX.tickShow ? cfgTopX.tickLength : 0)
            + (cfgTopX.tickValueShow ? cfgTopX.tickFontSize + 6 : 0)
            + topXRotExtra
            + ((cfgTopX.titleShow && cfgTopX.titleContent) ? cfgTopX.titleFontSize + 12 : 0);

        const gapH = p.gapH + topXAxisBlockH;
        const availH = Math.max(80, innerH - gapH - bottomAxisH);
        const topBarH = availH * p.topHeightRatio;
        const matrixH = availH * (1 - p.topHeightRatio);

        const baselineY = margin + topBarH;
        const matrixTop = baselineY + gapH;
        const matrixBottom = matrixTop + matrixH;
        const axisY = matrixBottom + axisGap;

        const topPad = 22;
        const topY = margin + topPad;

        const rowH = matrixH / nSets;
        const rowY = r => matrixTop + rowH * (r + 0.5);

        /* ---------- 比例尺 ---------- */
        const topXScale = d3.scaleBand()
            .domain(list.map((_, i) => i))
            .range([matrixLeft, matrixRight]);
        const yScale = d3.scaleLinear()
            .domain(topYDomain)
            .range([baselineY, topY]);
        const setXScale = d3.scaleLinear()
            .domain(setXDomain)
            .range([barAxisX, barStartX]);
        const nameScale = d3.scaleBand()
            .domain(setOrder.map((_, r) => r))
            .range([matrixTop, matrixBottom]);

        const colW = topXScale.bandwidth();

        const clampToDomain = (v, domain) => {
            const lo = Math.min(domain[0], domain[1]);
            const hi = Math.max(domain[0], domain[1]);
            return Math.max(lo, Math.min(hi, v));
        };

        /* ============================================================
           网格线（使用公共 PlotAxis.drawGrid）
           ============================================================ */
        PlotAxis.drawGrid(svg, yScale, cfgTopY, {
            x: matrixLeft, y: topY, w: matrixW, h: baselineY - topY
        }, 'y', topYTicks);

        if (cfgTopX.gridShow) {
            PlotAxis.drawGrid(svg, topXScale, cfgTopX, {
                x: matrixLeft, y: topY, w: matrixW, h: baselineY - topY
            }, 'x', list.map((_, i) => i));
        }

        PlotAxis.drawGrid(svg, setXScale, cfgSetX, {
            x: barStartX, y: matrixTop, w: barMaxW, h: matrixH
        }, 'x', setXTicks);

        if (cfgSetY.gridShow) {
            const rowGrid = svg.append('g').attr('class', 'grid grid-set-rows');
            setOrder.forEach((oi, r) => {
                rowGrid.append('line')
                    .attr('x1', matrixLeft).attr('x2', matrixRight)
                    .attr('y1', rowY(r)).attr('y2', rowY(r))
                    .attr('stroke', cfgSetY.gridColor)
                    .attr('stroke-dasharray', cfgSetY.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        /* ============================================================
           上部分：交集柱状图
           ============================================================ */
        const topG = svg.append('g').attr('class', 'upset-bars');
        const countWeight = p.countBold ? 'bold' : 'normal';
        const countStyle = p.countItalic ? 'italic' : 'normal';
        const barBaseY = yScale(topYDomain[0]);

        list.forEach((d, idx) => {
            const bandX = topXScale(idx);
            const cx = bandX + colW / 2;
            const barW = Math.max(1, colW * p.barWidth);
            const yTop = yScale(d.count);
            const h = Math.max(0, barBaseY - yTop);
            const x = cx - barW / 2;

            topG.append('rect')
                .attr('x', x).attr('y', yTop)
                .attr('width', barW).attr('height', h)
                .attr('fill', p.barColor);

            if (p.showCount) {
                topG.append('text')
                    .attr('x', cx)
                    .attr('y', yTop - 4)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', p.countFontSize)
                    .attr('font-weight', countWeight)
                    .attr('font-style', countStyle)
                    .attr('fill', p.countColor)
                    .text(String(d.count));
            }

            topG.append('rect')
                .attr('x', bandX)
                .attr('y', topY)
                .attr('width', colW)
                .attr('height', Math.max(0, baselineY - topY))
                .attr('fill', 'transparent')
                .attr('pointer-events', 'all')
                .style('cursor', 'pointer')
                .on('click', function () { showIntersectionModal(d, res.sets); });
        });

        /* 上部分 X 轴（交集分类轴）：默认只画轴线 */
        const topXAxisFn = d3.axisBottom(topXScale);
        topXAxisFn.tickValues(list.map((_, i) => i));
        topXAxisFn.tickFormat(i => topXTickLabels[i] || '');
        const topXAxisG = svg.append('g')
            .attr('class', 'upset-top-xaxis')
            .attr('transform', `translate(0, ${baselineY})`)
            .call(topXAxisFn);
        topXAxisG.selectAll('.tick').attr('transform', d => {
            const cx = Math.round(topXScale(d) + colW / 2) + 0.5;
            return `translate(${cx},0)`;
        });
        PlotAxis.applyAxis(topXAxisG, cfgTopX, 'bottom');

        if (cfgTopX.titleShow && cfgTopX.titleContent) {
            axisTitle(svg, {
                x: matrixLeft + matrixW / 2,
                y: baselineY + (cfgTopX.tickShow ? cfgTopX.tickLength : 0)
                    + (cfgTopX.tickValueShow ? cfgTopX.tickFontSize + 6 : 0)
                    + topXRotExtra
                    + cfgTopX.titleFontSize,
                text: cfgTopX.titleContent,
                fontSize: cfgTopX.titleFontSize,
                bold: cfgTopX.titleBold,
                italic: cfgTopX.titleItalic
            });
        }

        /* 上部分 Y 轴（交集大小数值轴） */
        if (p.topYAxisShow) {
            const isRight = p.topYAxisPos === 'right';
            const orientation = isRight ? 'right' : 'left';
            const axisX = isRight ? matrixRight : matrixLeft;
            const yAxisFn = isRight ? d3.axisRight(yScale) : d3.axisLeft(yScale);
            if (topYTicks.length) yAxisFn.tickValues(topYTicks);
            yAxisFn.tickFormat(fmtAxisTick);
            const yAxisG = svg.append('g')
                .attr('class', 'upset-top-yaxis')
                .attr('transform', `translate(${axisX}, 0)`)
                .call(yAxisFn);
            PlotAxis.applyAxis(yAxisG, cfgTopY, orientation);

            if (cfgTopY.titleShow && cfgTopY.titleContent) {
                const labelW = cfgTopY.tickValueShow
                    ? maxLabelWidth(topYTicks, cfgTopY.tickFontSize) : 0;
                const titleGap = (cfgTopY.tickShow ? cfgTopY.tickLength : 0)
                    + labelW + 8 + cfgTopY.titleFontSize * 0.6;
                const tx = isRight ? axisX + titleGap : axisX - titleGap;
                axisTitle(svg, {
                    x: 0,
                    y: 0,
                    transform: `translate(${tx},${(topY + baselineY) / 2}) rotate(-90)`,
                    text: cfgTopY.titleContent,
                    fontSize: cfgTopY.titleFontSize,
                    bold: cfgTopY.titleBold,
                    italic: cfgTopY.titleItalic,
                    baseline: 'middle'
                });
            }
        }

        /* ============================================================
           下部分：轨道 + 点矩阵
           ============================================================ */
        if (p.showTrack) {
            const trackG = svg.append('g').attr('class', 'upset-tracks');
            setOrder.forEach((oi, r) => {
                trackG.append('line')
                    .attr('x1', matrixLeft).attr('x2', matrixRight)
                    .attr('y1', rowY(r)).attr('y2', rowY(r))
                    .attr('stroke', p.trackColor)
                    .attr('stroke-width', p.trackWidth);
            });
        }

        const matrixG = svg.append('g').attr('class', 'upset-matrix');
        const actualPointR = Math.max(1.5, Math.min(p.pointSize / 2, colW * 0.35, rowH * 0.35));

        list.forEach((d, idx) => {
            const cx = topXScale(idx) + colW / 2;
            const displayRows = d.setIdx
                .map(oi => setOrder.indexOf(oi))
                .filter(r => r >= 0)
                .sort((a, b) => a - b);
            if (!displayRows.length) return;

            if (displayRows.length > 1) {
                const topRow = displayRows[0];
                const botRow = displayRows[displayRows.length - 1];
                matrixG.append('line')
                    .attr('x1', cx).attr('y1', rowY(topRow))
                    .attr('x2', cx).attr('y2', rowY(botRow))
                    .attr('stroke', p.lineColor)
                    .attr('stroke-width', p.lineWidth);
            }

            displayRows.forEach(r => {
                const oi = setOrder[r];
                matrixG.append('circle')
                    .attr('cx', cx).attr('cy', rowY(r))
                    .attr('r', actualPointR)
                    .attr('fill', setColors[oi]);
            });
        });

        /* ============================================================
           下部分：集合大小条形图
           ============================================================ */
        const setG = svg.append('g').attr('class', 'upset-sets');
        const barH = Math.max(2, rowH * p.setBarWidth);

        setOrder.forEach((oi, r) => {
            const y = rowY(r);

            // 关闭“显示集合大小条形”时只保留集合名称：不画条形、数值，大小轴也不画
            if (!p.showSetBars) return;

            const v = clampToDomain(res.setSizes[oi], setXDomain);
            const barLeft = setXScale(v);
            const barLen = Math.max(0, barAxisX - barLeft);
            const fill = p.setBarColorMode === 'uniform' ? p.setBarColor : setColors[oi];

            if (barLen > 0) {
                setG.append('rect')
                    .attr('x', barLeft)
                    .attr('y', y - barH / 2)
                    .attr('width', barLen)
                    .attr('height', barH)
                    .attr('fill', fill);
            }

            if (p.showSetValues) {
                // 数值贴在柱子左侧末端、垂直居中
                setG.append('text')
                    .attr('x', barLeft - 3)
                    .attr('y', y)
                    .attr('text-anchor', 'end')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', p.setValueFontSize)
                    .attr('font-weight', p.setValueBold ? 'bold' : 'normal')
                    .attr('font-style', p.setValueItalic ? 'italic' : 'normal')
                    .attr('fill', '#666')
                    .text(String(res.setSizes[oi]));
            }
        });

        /* 下部分 X 轴（集合大小数值轴） */
        if (showSizeAxis) {
            const setXAxisFn = d3.axisBottom(setXScale);
            if (setXTicks.length) setXAxisFn.tickValues(setXTicks);
            setXAxisFn.tickFormat(fmtAxisTick);
            const setXAxisG = svg.append('g')
                .attr('class', 'upset-set-xaxis')
                .attr('transform', `translate(0, ${axisY})`)
                .call(setXAxisFn);
            setXAxisG.selectAll('.tick').attr('transform', d => {
                const x = Math.round(setXScale(d)) + 0.5;
                return `translate(${x},0)`;
            });
            PlotAxis.applyAxis(setXAxisG, cfgSetX, 'bottom');

            // 轴线向右延伸到集合名轴，和集合名轴在左下角连成一个整体
            setXAxisG.select('.domain').attr('d', `M${barStartX},0.5H${nameAxisX}`);

            if (cfgSetX.titleShow && cfgSetX.titleContent) {
                axisTitle(svg, {
                    x: (barStartX + barAxisX) / 2,
                    y: axisY + setTickLen + (cfgSetX.tickValueShow ? cfgSetX.tickFontSize + 6 : 0) + cfgSetX.titleFontSize,
                    text: cfgSetX.titleContent,
                    fontSize: cfgSetX.titleFontSize,
                    bold: cfgSetX.titleBold,
                    italic: cfgSetX.titleItalic
                });
            }
        }

        /* 下部分 Y 轴（集合名轴）：轴线在名称左侧，文字在轴线右侧 */
        if (p.setAxisShowY) {
            const nameAxisFn = d3.axisLeft(nameScale);
            nameAxisFn.tickValues(setOrder.map((_, r) => r));
            nameAxisFn.tickFormat(r => fitText(res.sets[setOrder[r]].name, cfgSetY.tickFontSize, nameW));
            const nameAxisG = svg.append('g')
                .attr('class', 'upset-name-axis')
                .attr('transform', `translate(${nameAxisX}, 0)`)
                .call(nameAxisFn);
            nameAxisG.selectAll('.tick').attr('transform', d => `translate(0,${Math.round(rowY(d)) + 0.5})`);
            PlotAxis.applyAxis(nameAxisG, cfgSetY, 'left');

            // 轴线向下延伸到集合大小轴（形成左下角连接），不与上面的交集轴对齐
            const axisEndY = showSizeAxis ? axisY : matrixBottom;
            nameAxisG.select('.domain').attr('d', `M0.5,${matrixTop}V${axisEndY}`);

            // 集合名轴的标题（可选）放在名称列上方
            if (cfgSetY.titleShow && cfgSetY.titleContent) {
                axisTitle(svg, {
                    x: nameAxisX + (namesInside ? 1 : -1) * nameArea / 2,
                    y: matrixTop - 8,
                    text: cfgSetY.titleContent,
                    fontSize: cfgSetY.titleFontSize,
                    bold: cfgSetY.titleBold,
                    italic: cfgSetY.titleItalic
                });
            }
        }

        /* ============================================================
           绘图区边框与参考线（两套坐标轴各自控制）
           ============================================================ */
        PlotAxis.drawFrameAndRefLines(svg, {
            plotX: matrixLeft, plotY: topY,
            plotW: matrixW, plotH: baselineY - topY,
            xScale: topXScale, yScale: yScale,
            axisCfg: axisTop
        });

        PlotAxis.drawFrameAndRefLines(svg, {
            plotX: barStartX, plotY: matrixTop,
            plotW: barMaxW, plotH: matrixH,
            xScale: setXScale, yScale: nameScale,
            axisCfg: axisSet
        });

        PlotAxis.applyFontFamily(svg, p.fontFamily);

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    PlotApp.create({
        exportName: 'upset_chart',
        exampleData:
            'Gene\tSet1\tSet2\tSet3\tSet4\n' +
            'G01\tG01\tG01\tG01\tG01\n' +
            'G02\tG02\tG02\tG02\t\n' +
            'G03\tG03\tG03\tG03\t\n' +
            'G04\tG04\tG04\t\t\n' +
            'G05\tG05\tG05\t\t\n' +
            'G06\tG06\tG06\t\t\n' +
            'G07\tG07\t\tG07\t\n' +
            'G08\tG08\t\t\t\n' +
            'G09\tG09\t\t\t\n' +
            'G10\tG10\t\t\t\n' +
            'G11\t\tG11\t\t\n' +
            'G12\t\tG12\t\t\n' +
            'G13\t\t\tG13\t\n' +
            'G14\t\t\t\tG14\n' +
            'G15\t\t\t\tG15\n',
        importInfo: T.importInfo,

        stateExtra: {
            roles: { sets: [] },
            axisTop: createTopAxisState(),
            axisSet: createSetAxisState()
        },

        setup: function (app) {
            injectUpsetStyle();
            renderSetCols(app);
            refreshColors(app);
            renderAxisPanels(app);

            const sel = app.$('upsetSetOrder');
            const wrap = app.$('upsetSetCustomOrderItem');
            if (sel && wrap) {
                const update = () => {
                    wrap.style.display = sel.value === 'custom' ? '' : 'none';
                };
                sel.addEventListener('change', update);
                update();
            }
        },

        onDataImported: function (app, res) {
            const allCols = res.headers.slice();
            const defSets = allCols.slice(0, Math.min(3, allCols.length));
            app.state.roles = { sets: defSets };
            app.state.customColors = {};
            renderSetCols(app);
            refreshColors(app);
        },

        onReset: function (app) {
            app.state.roles = { sets: [] };
            app.state.customColors = {};
            app.state.axisTop = createTopAxisState();
            app.state.axisSet = createSetAxisState();
            renderSetCols(app);
            refreshColors(app);
            renderAxisPanels(app);
        },

        onStateRestored: function (app) {
            if (!app.state.roles.sets) app.state.roles.sets = [];
            ensureAxisState(app);
            renderSetCols(app);
            refreshColors(app);
            renderAxisPanels(app);
        },

        refreshColors: function (app) {
            refreshColors(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();

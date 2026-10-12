/* ============================================================
   BioDataTools 通用二维坐标轴设置模块
============================================================ */
(function (global) {
    'use strict';

    const I18N = {
        zh: {
            panelTitle: '坐标轴设置',
            xAxis: 'X 轴',
            yAxis: 'Y 轴',
            titleLabel: '轴标题',
            titleShow: '显示',
            titleContent: '内容',
            fontSize: '字号',
            bold: '粗',
            italic: '斜',
            domainGroup: '轴范围',
            domainAuto: '自动',
            domainMin: '最小',
            domainMax: '最大',
            domainPad: '外扩(%)',
            breakGroup: '轴截断',
            breakEnable: '启用',
            breakFrom: '断开下限值',
            breakTo: '断开上限值',
            breakTip: '落在两个值之间的数据会被视觉压缩，轴线上显示断口标记',
            tickGroup: '刻度线',
            tickShow: '显示',
            tickDir: '朝向',
            tickDirOut: '向外',
            tickDirIn: '向内',
            tickDirBoth: '双向',
            tickLength: '长度',
            tickWidth: '宽度',
            tickValueGroup: '刻度值',
            tickValueShow: '显示',
            tickValueAuto: '自动',
            tickValueCustom: '自定义',
            tickValueCustomTip: '逗号分隔，如 0,5,10,15',
            tickRotate: '旋转(°)',
            gridGroup: '网格线',
            gridShow: '显示',
            gridColor: '颜色',
            gridDash: '虚线',
            lineGroup: '轴线',
            lineShow: '显示',
            lineWidth: '线宽',
            lineColor: '颜色',
            crossGroup: '轴线位置',
            crossMode: '位置模式',
            crossAuto: '自动（按轴的最小值放置）',
            crossZero: '零点',
            crossMin: '轴最小值',
            crossMax: '轴最大值',
            crossCustom: '自定义',
            crossValue: '数值',
            crossTip: '决定另一条轴（主轴线）绘制的像素位置'
        },
        en: {
            panelTitle: 'Axis Settings',
            xAxis: 'X Axis',
            yAxis: 'Y Axis',
            titleLabel: 'Axis Title',
            titleShow: 'Show',
            titleContent: 'Text',
            fontSize: 'Size',
            bold: 'B',
            italic: 'I',
            domainGroup: 'Axis Range',
            domainAuto: 'Auto',
            domainMin: 'Min',
            domainMax: 'Max',
            domainPad: 'Pad (%)',
            breakGroup: 'Axis Break',
            breakEnable: 'Enable',
            breakFrom: 'Break from',
            breakTo: 'Break to',
            breakTip: 'Data between the two values will be visually compressed; a break mark will be drawn on the axis',
            tickGroup: 'Tick Marks',
            tickShow: 'Show',
            tickDir: 'Direction',
            tickDirOut: 'Out',
            tickDirIn: 'In',
            tickDirBoth: 'Both',
            tickLength: 'Length',
            tickWidth: 'Width',
            tickValueGroup: 'Tick Values',
            tickValueShow: 'Show',
            tickValueAuto: 'Auto',
            tickValueCustom: 'Custom',
            tickValueCustomTip: 'Comma-separated, e.g. 0,5,10,15',
            tickRotate: 'Rotate (°)',
            gridGroup: 'Grid Lines',
            gridShow: 'Show',
            gridColor: 'Color',
            gridDash: 'Dash',
            lineGroup: 'Axis Line',
            lineShow: 'Show',
            lineWidth: 'Width',
            lineColor: 'Color',
            crossGroup: 'Axis Position',
            crossMode: 'Mode',
            crossAuto: 'Auto (at axis minimum)',
            crossZero: 'Zero',
            crossMin: 'Axis minimum',
            crossMax: 'Axis maximum',
            crossCustom: 'Custom',
            crossValue: 'Value',
            crossTip: 'Determines the pixel position where the other axis (main axis) is drawn'
        }
    };

    function getLang() {
        return window.location.pathname.includes('/en/') ? 'en' : 'zh';
    }
    function L() {
        return I18N[getLang()] || I18N.zh;
    }
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function singleAxisDefault() {
        return {
            fontFamily: 'Times New Roman',

            titleShow: true,
            titleContent: '',
            titleFontSize: 16,
            titleBold: false,
            titleItalic: false,

            domainAuto: true,
            domainMin: 0,
            domainMax: 100,
            domainPad: 0,

            breakEnable: false,
            breakFrom: 0,
            breakTo: 0,

            tickShow: true,
            tickDir: 'out',
            tickLength: 6,
            tickWidth: 1,

            tickValueShow: true,
            tickValueAuto: true,
            tickValueCustom: '',
            tickFontSize: 14,
            tickBold: false,
            tickItalic: false,
            tickRotate: 0,

            gridShow: false,
            gridColor: '#e8edf2',
            gridDash: '3 3',

            lineShow: true,
            lineWidth: 1,
            lineColor: '#333333',

            crossMode: 'auto',
            crossValue: 0
        };
    }

    function defaultState() {
        return {
            x: singleAxisDefault(),
            y: singleAxisDefault()
        };
    }

    function axisPanelHTML(key, cfg, t) {
        const isX = (key === 'x');
        return `
        <details class="axis-group" ${isX ? 'open' : ''}>
            <summary>${isX ? t.xAxis : t.yAxis}</summary>

            <div class="font-row">
                <span class="font-label">${t.titleLabel}</span>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-title-show" ${cfg.titleShow ? 'checked' : ''}> ${t.titleShow}</label>
                <input type="text" class="ax-${key}-title" value="${escapeHtml(cfg.titleContent)}" style="width:140px;">
                <input type="number" class="ax-${key}-title-fs" value="${cfg.titleFontSize}" min="6" max="48" style="width:60px;" title="${t.fontSize}">
                <label class="mini-check"><input type="checkbox" class="ax-${key}-title-b" ${cfg.titleBold ? 'checked' : ''}> ${t.bold}</label>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-title-i" ${cfg.titleItalic ? 'checked' : ''}> ${t.italic}</label>
            </div>

            <div class="font-row">
                <span class="font-label">${t.domainGroup}</span>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-domain-auto" ${cfg.domainAuto ? 'checked' : ''}> ${t.domainAuto}</label>
                <label>${t.domainMin} <input type="number" class="ax-${key}-domain-min" value="${cfg.domainMin}" style="width:80px;"></label>
                <label>${t.domainMax} <input type="number" class="ax-${key}-domain-max" value="${cfg.domainMax}" style="width:80px;"></label>
                <label>${t.domainPad} <input type="number" class="ax-${key}-domain-pad" value="${cfg.domainPad}" min="0" max="100" step="1" style="width:60px;"></label>
            </div>

            <div class="font-row">
                <span class="font-label">${t.breakGroup}</span>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-break-en" ${cfg.breakEnable ? 'checked' : ''}> ${t.breakEnable}</label>
                <label>${t.breakFrom} <input type="number" class="ax-${key}-break-from" value="${cfg.breakFrom}" style="width:80px;"></label>
                <label>${t.breakTo} <input type="number" class="ax-${key}-break-to" value="${cfg.breakTo}" style="width:80px;"></label>
            </div>
            <div class="font-row" style="padding-top:0;">
                <span class="font-label"></span>
                <span style="font-size:12px;color:#999;line-height:1.5;">${t.breakTip}</span>
            </div>

            <div class="font-row">
                <span class="font-label">${t.tickGroup}</span>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-tick-show" ${cfg.tickShow ? 'checked' : ''}> ${t.tickShow}</label>
                <label>${t.tickDir}
                    <select class="ax-${key}-tick-dir">
                        <option value="out" ${cfg.tickDir === 'out' ? 'selected' : ''}>${t.tickDirOut}</option>
                        <option value="in" ${cfg.tickDir === 'in' ? 'selected' : ''}>${t.tickDirIn}</option>
                        <option value="both" ${cfg.tickDir === 'both' ? 'selected' : ''}>${t.tickDirBoth}</option>
                    </select>
                </label>
                <label>${t.tickLength} <input type="number" class="ax-${key}-tick-len" value="${cfg.tickLength}" min="0" max="30" style="width:60px;"></label>
                <label>${t.tickWidth} <input type="number" class="ax-${key}-tick-w" value="${cfg.tickWidth}" min="0" max="6" step="0.5" style="width:60px;"></label>
            </div>

            <div class="font-row">
                <span class="font-label">${t.tickValueGroup}</span>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-tickvalue-show" ${cfg.tickValueShow ? 'checked' : ''}> ${t.tickValueShow}</label>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-tickvalue-auto" ${cfg.tickValueAuto ? 'checked' : ''}> ${t.tickValueAuto}</label>
                <input type="text" class="ax-${key}-tickvalue-custom" value="${escapeHtml(cfg.tickValueCustom)}" placeholder="${t.tickValueCustomTip}" style="flex:1;min-width:150px;">
            </div>

            <div class="font-row">
                <span class="font-label"></span>
                <label>${t.fontSize} <input type="number" class="ax-${key}-tick-fs" value="${cfg.tickFontSize}" min="6" max="36" style="width:60px;"></label>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-tick-b" ${cfg.tickBold ? 'checked' : ''}> ${t.bold}</label>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-tick-i" ${cfg.tickItalic ? 'checked' : ''}> ${t.italic}</label>
                <label>${t.tickRotate} <input type="number" class="ax-${key}-tick-rot" value="${cfg.tickRotate}" min="-90" max="90" style="width:60px;"></label>
            </div>

            <div class="font-row">
                <span class="font-label">${t.gridGroup}</span>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-grid-show" ${cfg.gridShow ? 'checked' : ''}> ${t.gridShow}</label>
                <label>${t.gridColor} <input type="color" class="ax-${key}-grid-color" value="${cfg.gridColor}"></label>
                <label>${t.gridDash} <input type="text" class="ax-${key}-grid-dash" value="${escapeHtml(cfg.gridDash)}" style="width:80px;"></label>
            </div>

            <div class="font-row">
                <span class="font-label">${t.lineGroup}</span>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-line-show" ${cfg.lineShow ? 'checked' : ''}> ${t.lineShow}</label>
                <label>${t.lineWidth} <input type="number" class="ax-${key}-line-w" value="${cfg.lineWidth}" min="0" max="6" step="0.5" style="width:60px;"></label>
                <label>${t.lineColor} <input type="color" class="ax-${key}-line-color" value="${cfg.lineColor}"></label>
            </div>

            <div class="font-row">
                <span class="font-label">${t.crossGroup}</span>
                <label>${t.crossMode}
                    <select class="ax-${key}-cross-mode">
                        <option value="auto" ${cfg.crossMode === 'auto' ? 'selected' : ''}>${t.crossAuto}</option>
                        <option value="zero" ${cfg.crossMode === 'zero' ? 'selected' : ''}>${t.crossZero}</option>
                        <option value="min" ${cfg.crossMode === 'min' ? 'selected' : ''}>${t.crossMin}</option>
                        <option value="max" ${cfg.crossMode === 'max' ? 'selected' : ''}>${t.crossMax}</option>
                        <option value="custom" ${cfg.crossMode === 'custom' ? 'selected' : ''}>${t.crossCustom}</option>
                    </select>
                </label>
                <label>${t.crossValue} <input type="number" class="ax-${key}-cross-value" value="${cfg.crossValue}" style="width:80px;"></label>
            </div>
            <div class="font-row" style="padding-top:0;">
                <span class="font-label"></span>
                <span style="font-size:12px;color:#999;line-height:1.5;">${t.crossTip}</span>
            </div>
        </details>
        `;
    }

    function readFromDOM(container, st) {
        ['x', 'y'].forEach(key => {
            const cfg = st[key];
            const g = id => container.querySelector(`.ax-${key}-${id}`);
            const num = (el, fb) => {
                const v = parseFloat(el.value);
                return isFinite(v) ? v : fb;
            };

            cfg.titleShow = g('title-show').checked;
            cfg.titleContent = g('title').value;
            cfg.titleFontSize = num(g('title-fs'), 16);
            cfg.titleBold = g('title-b').checked;
            cfg.titleItalic = g('title-i').checked;

            cfg.domainAuto = g('domain-auto').checked;
            cfg.domainMin = num(g('domain-min'), 0);
            cfg.domainMax = num(g('domain-max'), 100);
            cfg.domainPad = Math.max(0, num(g('domain-pad'), 5));

            cfg.breakEnable = g('break-en').checked;
            cfg.breakFrom = num(g('break-from'), 0);
            cfg.breakTo = num(g('break-to'), 0);

            cfg.tickShow = g('tick-show').checked;
            cfg.tickDir = g('tick-dir').value;
            cfg.tickLength = Math.max(0, num(g('tick-len'), 6));
            cfg.tickWidth = Math.max(0, num(g('tick-w'), 1));

            cfg.tickValueShow = g('tickvalue-show').checked;
            cfg.tickValueAuto = g('tickvalue-auto').checked;
            cfg.tickValueCustom = g('tickvalue-custom').value;
            cfg.tickFontSize = Math.max(6, num(g('tick-fs'), 14));
            cfg.tickBold = g('tick-b').checked;
            cfg.tickItalic = g('tick-i').checked;
            cfg.tickRotate = num(g('tick-rot'), 0);

            cfg.gridShow = g('grid-show').checked;
            cfg.gridColor = g('grid-color').value;
            cfg.gridDash = g('grid-dash').value;

            cfg.lineShow = g('line-show').checked;
            cfg.lineWidth = Math.max(0, num(g('line-w'), 1));
            cfg.lineColor = g('line-color').value;

            cfg.crossMode = g('cross-mode').value;
            cfg.crossValue = num(g('cross-value'), 0);
        });
    }

    function render(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId)
            : containerOrId;
        if (!container) return;

        const t = L();
        const st = opts.state || defaultState();
        if (!st.x) st.x = singleAxisDefault();
        if (!st.y) st.y = singleAxisDefault();

        container.className = 'param-panel';
        container.innerHTML = `
            <div class="param-panel-title">${t.panelTitle}</div>
            ${axisPanelHTML('x', st.x, t)}
            ${axisPanelHTML('y', st.y, t)}
        `;

        let raf = null;
        const onChange = () => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = null;
                readFromDOM(container, st);
                opts.onChange && opts.onChange();
            });
        };
        container.addEventListener('change', onChange);
        container.addEventListener('input', onChange);
    }

    function applyAxis(axisG, cfg, orientation, breakPos) {
        if (!axisG || !cfg) return;

        axisG.select('.domain')
            .style('display', cfg.lineShow ? null : 'none')
            .attr('stroke', cfg.lineColor)
            .attr('stroke-width', cfg.lineWidth);

        const len = cfg.tickLength;
        const horiz = (orientation === 'bottom' || orientation === 'top');
        const outwardSign = horiz
            ? (orientation === 'bottom' ? 1 : -1)
            : (orientation === 'right' ? 1 : -1);

        let v1 = 0, v2 = 0;
        if (cfg.tickDir === 'out') {
            v1 = 0;
            v2 = outwardSign * len;
        } else if (cfg.tickDir === 'in') {
            v1 = 0;
            v2 = -outwardSign * len;
        } else {
            v1 = -outwardSign * len;
            v2 = outwardSign * len;
        }

        axisG.selectAll('.tick line')
            .style('display', cfg.tickShow ? null : 'none')
            .attr('stroke', cfg.lineColor)
            .attr('stroke-width', cfg.tickWidth);

        if (horiz) {
            axisG.selectAll('.tick line')
                .attr('y1', v1)
                .attr('y2', v2);
        } else {
            axisG.selectAll('.tick line')
                .attr('x1', v1)
                .attr('x2', v2);
        }

        axisG.selectAll('.tick text')
            .style('display', cfg.tickValueShow ? null : 'none')
            .style('font-size', cfg.tickFontSize + 'px')
            .style('font-weight', cfg.tickBold ? 'bold' : 'normal')
            .style('font-style', cfg.tickItalic ? 'italic' : 'normal')
            .style('font-family', cfg.fontFamily || null);

        if (cfg.tickRotate) {
            axisG.selectAll('.tick text')
                .attr('transform', `rotate(${cfg.tickRotate})`)
                .style('text-anchor', cfg.tickRotate < 0 ? 'end' : 'start');
        } else {
            axisG.selectAll('.tick text')
                .attr('transform', null)
                .style('text-anchor', null);
        }

        axisG.selectAll('.axis-break-mark').remove();
        if (cfg.breakEnable && isFinite(breakPos)) {
            const s = 5;
            const d = 4;
            const strokeW = Math.max(1.5, cfg.lineWidth);
            if (horiz) {
                axisG.append('line')
                    .attr('class', 'axis-break-mark')
                    .attr('x1', breakPos - d).attr('y1', s)
                    .attr('x2', breakPos).attr('y2', -s)
                    .attr('stroke', cfg.lineColor)
                    .attr('stroke-width', strokeW)
                    .attr('stroke-linecap', 'round');
                axisG.append('line')
                    .attr('class', 'axis-break-mark')
                    .attr('x1', breakPos).attr('y1', s)
                    .attr('x2', breakPos + d).attr('y2', -s)
                    .attr('stroke', cfg.lineColor)
                    .attr('stroke-width', strokeW)
                    .attr('stroke-linecap', 'round');
            } else {
                axisG.append('line')
                    .attr('class', 'axis-break-mark')
                    .attr('x1', -s).attr('y1', breakPos - d)
                    .attr('x2', s).attr('y2', breakPos)
                    .attr('stroke', cfg.lineColor)
                    .attr('stroke-width', strokeW)
                    .attr('stroke-linecap', 'round');
                axisG.append('line')
                    .attr('class', 'axis-break-mark')
                    .attr('x1', -s).attr('y1', breakPos)
                    .attr('x2', s).attr('y2', breakPos + d)
                    .attr('stroke', cfg.lineColor)
                    .attr('stroke-width', strokeW)
                    .attr('stroke-linecap', 'round');
            }
        }
    }

    function resolveDomain(cfg, dataExtent) {
        if (!dataExtent || dataExtent.length < 2) return [0, 1];
        let [lo, hi] = dataExtent;
        if (!isFinite(lo) || !isFinite(hi)) return [0, 1];

        if (cfg.domainAuto) {
            if (lo === hi) {
                const pad = Math.abs(lo) * 0.1 || 1;
                return [lo - pad, hi + pad];
            }
            const pad = (hi - lo) * (cfg.domainPad / 100);
            return [lo - pad, hi + pad];
        }
        return [cfg.domainMin, cfg.domainMax];
    }

    function applyBreak(scale, cfg) {
        if (!cfg || !cfg.breakEnable) return scale;
        if (!isFinite(cfg.breakFrom) || !isFinite(cfg.breakTo)) return scale;
        if (cfg.breakTo <= cfg.breakFrom) return scale;

        const domain = scale.domain();
        if (!Array.isArray(domain) || domain.length !== 2) return scale;
        const [dMin, dMax] = domain;
        if (!isFinite(dMin) || !isFinite(dMax)) return scale;
        if (cfg.breakFrom <= dMin || cfg.breakTo >= dMax) return scale;

        const range = scale.range();
        const [r0, r1] = range;
        const dataBelow = cfg.breakFrom - dMin;
        const dataAbove = dMax - cfg.breakTo;
        const totalData = dataBelow + dataAbove;
        if (totalData <= 0) return scale;

        const totalPx = Math.abs(r1 - r0);
        const gapPx = 14;
        const availPx = totalPx - gapPx;
        if (availPx <= 0) return scale;

        const belowPx = (dataBelow / totalData) * availPx;
        const abovePx = (dataAbove / totalData) * availPx;
        const sign = r1 > r0 ? 1 : -1;

        return d3.scaleLinear()
            .domain([dMin, cfg.breakFrom, cfg.breakTo, dMax])
            .range([
                r0,
                r0 + sign * belowPx,
                r0 + sign * (belowPx + gapPx),
                r0 + sign * (belowPx + gapPx + abovePx)
            ]);
    }

    function getBreakPosition(scale, cfg) {
        if (!cfg || !cfg.breakEnable) return NaN;
        const domain = scale.domain();
        if (!Array.isArray(domain) || domain.length !== 4) return NaN;
        const range = scale.range();
        if (!Array.isArray(range) || range.length !== 4) return NaN;
        return (range[1] + range[2]) / 2;
    }

    function resolveTicks(cfg, scale) {
        if (cfg.tickValueAuto) return null;
        const raw = String(cfg.tickValueCustom || '').trim();
        if (!raw) return null;
        const arr = raw.split(/[,，;\s]+/)
            .map(s => parseFloat(s))
            .filter(v => isFinite(v));
        return arr.length ? arr : null;
    }

    function resolveCrossValue(cfg, domain) {
        const [lo, hi] = domain;
        switch (cfg.crossMode) {
            case 'zero':
                return 0;
            case 'min':
                return lo;
            case 'max':
                return hi;
            case 'custom':
                return cfg.crossValue;
            case 'auto':
            default:
                return lo;
        }
    }

    function drawGrid(g, scale, cfg, plotRect, axis, tickValues) {
        if (!cfg.gridShow) return;
        const ticks = tickValues || (scale.ticks ? scale.ticks() : scale.domain());
        const grid = g.append('g').attr('class', `grid grid-${axis}`);
        const { x, y, w, h } = plotRect;

        if (axis === 'x') {
            grid.selectAll('line')
                .data(ticks).enter()
                .append('line')
                .attr('x1', d => scale(d) + (scale.bandwidth ? scale.bandwidth() / 2 : 0))
                .attr('x2', d => scale(d) + (scale.bandwidth ? scale.bandwidth() / 2 : 0))
                .attr('y1', y).attr('y2', y + h)
                .attr('stroke', cfg.gridColor)
                .attr('stroke-dasharray', cfg.gridDash)
                .attr('stroke-width', 1);
        } else {
            grid.selectAll('line')
                .data(ticks).enter()
                .append('line')
                .attr('x1', x).attr('x2', x + w)
                .attr('y1', d => scale(d))
                .attr('y2', d => scale(d))
                .attr('stroke', cfg.gridColor)
                .attr('stroke-dasharray', cfg.gridDash)
                .attr('stroke-width', 1);
        }
    }

    /**
     * 给 SVG 里的所有文本统一设置字体族
     * @param {SVGElement|D3Selection} target
     * @param {String} family
     */
    function applyFontFamily(target, family) {
        if (!target || !family) return;
        const sel = (target.node && typeof target.node === 'function')
            ? target
            : d3.select(target);
        sel.selectAll('text').style('font-family', family);
    }

    global.PlotAxis = {
        defaultState,
        render,
        applyAxis,
        applyBreak,
        getBreakPosition,
        resolveDomain,
        resolveTicks,
        resolveCrossValue,
        drawGrid,
        applyFontFamily,
        L
    };
})(window);
(function (global) {
    'use strict';

    const PC = global.PlotCommon;

    function isEn() { return window.location.pathname.indexOf('/en/') >= 0; }

    const I18N = {
        zh: {
            panelTitle: '箱线图设置',
            boxSection: '箱体',
            boxWidthScale: '箱体宽度',
            boxFillEnabled: '填充',
            boxFillAlpha: '填充透明度',
            boxStrokeWidth: '描边宽度',
            boxStrokeColor: '描边颜色',
            medianWidth: '中位线宽',
            medianColor: '中位线颜色',
            medianStyle: '中位线样式',
            medianLine: '横线',
            medianCircle: '空心圆',
            medianDot: '实心圆',
            whiskerSection: '须线',
            whiskerWidth: '须线宽度',
            whiskerColor: '须线颜色',
            capWidth: '须帽比例',
            pointSection: '数据点',
            pointShow: '显示',
            pointShowNone: '不显示',
            pointShowIn: '仅箱内',
            pointShowOut: '仅箱外',
            pointShowAll: '全部显示',
            pointShape: '形状',
            shapeCircle: '圆',
            shapeSquare: '方',
            shapeTriangle: '三角',
            shapeDiamond: '菱形',
            pointSize: '大小',
            pointJitter: '分散程度',
            pointColorMode: '颜色模式',
            colorSameAsBox: '与箱子同色',
            colorCustom: '统一颜色',
            inAlpha: '箱内透明度',
            outAlpha: '箱外透明度',
            inColor: '箱内颜色',
            outColor: '箱外颜色',
            outlierSection: '异常值（须外）',
            outlierShow: '显示异常值',
            outlierUsePoint: '与箱外点一致',
            outlierShape: '形状',
            outlierSize: '大小',
            outlierColor: '颜色',
            outlierAlpha: '透明度'
        },
        en: {
            panelTitle: 'Box Plot Settings',
            boxSection: 'Box',
            boxWidthScale: 'Box width',
            boxFillEnabled: 'Fill',
            boxFillAlpha: 'Fill alpha',
            boxStrokeWidth: 'Stroke width',
            boxStrokeColor: 'Stroke color',
            medianWidth: 'Median width',
            medianColor: 'Median color',
            medianStyle: 'Median style',
            medianLine: 'Line',
            medianCircle: 'Hollow circle',
            medianDot: 'Filled dot',
            whiskerSection: 'Whiskers',
            whiskerWidth: 'Width',
            whiskerColor: 'Color',
            capWidth: 'Cap ratio',
            pointSection: 'Data Points',
            pointShow: 'Show',
            pointShowNone: 'None',
            pointShowIn: 'Inside box only',
            pointShowOut: 'Outside box only',
            pointShowAll: 'All',
            pointShape: 'Shape',
            shapeCircle: 'Circle',
            shapeSquare: 'Square',
            shapeTriangle: 'Triangle',
            shapeDiamond: 'Diamond',
            pointSize: 'Size',
            pointJitter: 'Spread',
            pointColorMode: 'Color mode',
            colorSameAsBox: 'Same as box',
            colorCustom: 'Custom',
            inAlpha: 'Inside alpha',
            outAlpha: 'Outside alpha',
            inColor: 'Inside color',
            outColor: 'Outside color',
            outlierSection: 'Outliers (outside whiskers)',
            outlierShow: 'Show outliers',
            outlierUsePoint: 'Match outside points',
            outlierShape: 'Shape',
            outlierSize: 'Size',
            outlierColor: 'Color',
            outlierAlpha: 'Alpha'
        }
    };
    function L() { return I18N[isEn() ? 'en' : 'zh']; }

    function defaultBoxSettings() {
        return {
            boxWidthScale: 0.6,
            boxFillEnabled: true,
            boxFillAlpha: 1,
            boxStrokeWidth: 1.5,
            boxStrokeColor: '#333333',
            medianWidth: 2,
            medianColor: '#333333',
            medianStyle: 'line',
            whiskerWidth: 1.5,
            whiskerColor: '#333333',
            capWidth: 0.5,

            pointShow: 'all',
            pointShape: 'circle',
            pointSize: 4,
            pointJitter: 0.7,
            pointColorMode: 'sameAsBox',
            inAlpha: 0.7,
            outAlpha: 0.3,
            inColor: '#000000',
            outColor: '#888888',

            outlierShow: true,
            outlierUsePoint: true,
            outlierShape: 'circle',
            outlierSize: 4,
            outlierColor: '#888888',
            outlierAlpha: 0.3
        };
    }

    function renderBoxPanel(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;

        const T = L();
        const st = Object.assign(defaultBoxSettings(), opts.state || {});

        container.className = 'param-panel';
        container._settings = st;

        container.innerHTML = `
            <div class="param-panel-title">${T.panelTitle}</div>

            <div class="axis-subsection">${T.boxSection}</div>
            <div class="param-grid cols-4">
                <div class="param-item"><label>${T.boxWidthScale}</label>
                    <input type="number" class="bx-box-width" value="${st.boxWidthScale}" min="0.2" max="1" step="0.05"></div>
                <div class="param-item"><label class="mini-check"><input type="checkbox" class="bx-box-fill" ${st.boxFillEnabled ? 'checked' : ''}>${T.boxFillEnabled}</label></div>
                <div class="param-item"><label>${T.boxFillAlpha}</label>
                    <input type="number" class="bx-box-alpha" value="${st.boxFillAlpha}" min="0" max="1" step="0.05"></div>
                <div class="param-item"><label>${T.boxStrokeWidth}</label>
                    <input type="number" class="bx-stroke-w" value="${st.boxStrokeWidth}" min="0" max="4" step="0.5"></div>
                <div class="param-item"><label>${T.boxStrokeColor}</label>
                    <input type="color" class="bx-stroke-c" value="${st.boxStrokeColor}"></div>
                <div class="param-item"><label>${T.medianWidth}</label>
                    <input type="number" class="bx-median-w" value="${st.medianWidth}" min="0" max="6" step="0.5"></div>
                <div class="param-item"><label>${T.medianColor}</label>
                    <input type="color" class="bx-median-c" value="${st.medianColor}"></div>
                <div class="param-item"><label>${T.medianStyle}</label>
                    <select class="bx-median-s">
                        <option value="line" ${st.medianStyle === 'line' ? 'selected' : ''}>${T.medianLine}</option>
                        <option value="circle" ${st.medianStyle === 'circle' ? 'selected' : ''}>${T.medianCircle}</option>
                        <option value="dot" ${st.medianStyle === 'dot' ? 'selected' : ''}>${T.medianDot}</option>
                    </select></div>
            </div>

            <div class="axis-subsection">${T.whiskerSection}</div>
            <div class="param-grid cols-4">
                <div class="param-item"><label>${T.whiskerWidth}</label>
                    <input type="number" class="bx-whisker-w" value="${st.whiskerWidth}" min="0" max="4" step="0.5"></div>
                <div class="param-item"><label>${T.whiskerColor}</label>
                    <input type="color" class="bx-whisker-c" value="${st.whiskerColor}"></div>
                <div class="param-item"><label>${T.capWidth}</label>
                    <input type="number" class="bx-cap-w" value="${st.capWidth}" min="0" max="1" step="0.05"></div>
            </div>

            <div class="axis-subsection">${T.pointSection}</div>
            <div class="param-grid cols-4">
                <div class="param-item"><label>${T.pointShow}</label>
                    <select class="bx-point-show">
                        <option value="none" ${st.pointShow === 'none' ? 'selected' : ''}>${T.pointShowNone}</option>
                        <option value="in" ${st.pointShow === 'in' ? 'selected' : ''}>${T.pointShowIn}</option>
                        <option value="out" ${st.pointShow === 'out' ? 'selected' : ''}>${T.pointShowOut}</option>
                        <option value="all" ${st.pointShow === 'all' ? 'selected' : ''}>${T.pointShowAll}</option>
                    </select></div>
                <div class="param-item"><label>${T.pointShape}</label>
                    <select class="bx-point-shape">
                        <option value="circle" ${st.pointShape === 'circle' ? 'selected' : ''}>${T.shapeCircle}</option>
                        <option value="square" ${st.pointShape === 'square' ? 'selected' : ''}>${T.shapeSquare}</option>
                        <option value="triangle" ${st.pointShape === 'triangle' ? 'selected' : ''}>${T.shapeTriangle}</option>
                        <option value="diamond" ${st.pointShape === 'diamond' ? 'selected' : ''}>${T.shapeDiamond}</option>
                    </select></div>
                <div class="param-item"><label>${T.pointSize}</label>
                    <input type="number" class="bx-point-size" value="${st.pointSize}" min="1" max="12" step="0.5"></div>
                <div class="param-item"><label>${T.pointJitter}</label>
                    <input type="number" class="bx-point-jitter" value="${st.pointJitter}" min="0" max="1" step="0.05"></div>
                <div class="param-item"><label>${T.pointColorMode}</label>
                    <select class="bx-point-color-mode">
                        <option value="sameAsBox" ${st.pointColorMode === 'sameAsBox' ? 'selected' : ''}>${T.colorSameAsBox}</option>
                        <option value="custom" ${st.pointColorMode === 'custom' ? 'selected' : ''}>${T.colorCustom}</option>
                    </select></div>
                <div class="param-item bx-alpha-in"><label>${T.inAlpha}</label>
                    <input type="number" class="bx-in-alpha" value="${st.inAlpha}" min="0" max="1" step="0.05"></div>
                <div class="param-item bx-alpha-out"><label>${T.outAlpha}</label>
                    <input type="number" class="bx-out-alpha" value="${st.outAlpha}" min="0" max="1" step="0.05"></div>
                <div class="param-item bx-color-in"><label>${T.inColor}</label>
                    <input type="color" class="bx-in-color" value="${st.inColor}"></div>
                <div class="param-item bx-color-out"><label>${T.outColor}</label>
                    <input type="color" class="bx-out-color" value="${st.outColor}"></div>
            </div>

            <div class="axis-subsection">${T.outlierSection}</div>
            <div class="param-grid cols-4">
                <div class="param-item"><label class="mini-check"><input type="checkbox" class="bx-outlier-show" ${st.outlierShow ? 'checked' : ''}>${T.outlierShow}</label></div>
                <div class="param-item"><label class="mini-check"><input type="checkbox" class="bx-outlier-use-point" ${st.outlierUsePoint ? 'checked' : ''}>${T.outlierUsePoint}</label></div>
                <div class="param-item bx-outlier-shape-item"><label>${T.outlierShape}</label>
                    <select class="bx-outlier-shape">
                        <option value="circle" ${st.outlierShape === 'circle' ? 'selected' : ''}>${T.shapeCircle}</option>
                        <option value="square" ${st.outlierShape === 'square' ? 'selected' : ''}>${T.shapeSquare}</option>
                        <option value="triangle" ${st.outlierShape === 'triangle' ? 'selected' : ''}>${T.shapeTriangle}</option>
                        <option value="diamond" ${st.outlierShape === 'diamond' ? 'selected' : ''}>${T.shapeDiamond}</option>
                    </select></div>
                <div class="param-item bx-outlier-size-item"><label>${T.outlierSize}</label>
                    <input type="number" class="bx-outlier-size" value="${st.outlierSize}" min="1" max="12" step="0.5"></div>
                <div class="param-item bx-outlier-color-item"><label>${T.outlierColor}</label>
                    <input type="color" class="bx-outlier-color" value="${st.outlierColor}"></div>
                <div class="param-item bx-outlier-alpha-item"><label>${T.outlierAlpha}</label>
                    <input type="number" class="bx-outlier-alpha" value="${st.outlierAlpha}" min="0" max="1" step="0.05"></div>
            </div>
        `;

        const colorModeSel = container.querySelector('.bx-point-color-mode');
        function updateColorVisibility() {
            const sameAsBox = st.pointColorMode === 'sameAsBox';
            container.querySelectorAll('.bx-alpha-in, .bx-alpha-out').forEach(function (el) {
                el.style.display = sameAsBox ? '' : 'none';
            });
            container.querySelectorAll('.bx-color-in, .bx-color-out').forEach(function (el) {
                el.style.display = sameAsBox ? 'none' : '';
            });
        }
        if (colorModeSel) {
            colorModeSel.addEventListener('change', function () {
                st.pointColorMode = this.value;
                updateColorVisibility();
                opts.onChange && opts.onChange();
            });
        }
        updateColorVisibility();

        const outlierUsePoint = container.querySelector('.bx-outlier-use-point');
        function updateOutlierVisibility() {
            const usePoint = st.outlierUsePoint;
            container.querySelectorAll('.bx-outlier-shape-item, .bx-outlier-size-item, .bx-outlier-color-item, .bx-outlier-alpha-item').forEach(function (el) {
                el.style.display = usePoint ? 'none' : '';
            });
        }
        if (outlierUsePoint) {
            outlierUsePoint.addEventListener('change', function () {
                st.outlierUsePoint = this.checked;
                updateOutlierVisibility();
                opts.onChange && opts.onChange();
            });
        }
        updateOutlierVisibility();

        container.querySelectorAll('input, select').forEach(function (el) {
            if (el === colorModeSel || el === outlierUsePoint) return;
            el.addEventListener('change', function () {
                if (opts.onChange) opts.onChange();
            });
        });
    }

    function readBoxSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return defaultBoxSettings();
        const st = container._settings || defaultBoxSettings();
        const qv = function (s) { const e = container.querySelector(s); return e ? e.value : undefined; };
        const qc = function (s) { const e = container.querySelector(s); return e ? e.checked : false; };
        const qn = function (s, fb) {
            const e = container.querySelector(s);
            if (!e) return fb;
            const v = parseFloat(e.value);
            return isFinite(v) ? v : fb;
        };

        st.boxWidthScale = Math.max(0.2, Math.min(1, qn('.bx-box-width', 0.6)));
        st.boxFillEnabled = qc('.bx-box-fill');
        st.boxFillAlpha = Math.max(0, Math.min(1, qn('.bx-box-alpha', 1)));
        st.boxStrokeWidth = Math.max(0, qn('.bx-stroke-w', 1.5));
        st.boxStrokeColor = qv('.bx-stroke-c') || '#333333';
        st.medianWidth = Math.max(0, qn('.bx-median-w', 2));
        st.medianColor = qv('.bx-median-c') || '#333333';
        st.medianStyle = qv('.bx-median-s') || 'line';
        st.whiskerWidth = Math.max(0, qn('.bx-whisker-w', 1.5));
        st.whiskerColor = qv('.bx-whisker-c') || '#333333';
        st.capWidth = Math.max(0, Math.min(1, qn('.bx-cap-w', 0.5)));

        st.pointShow = qv('.bx-point-show') || 'all';
        st.pointShape = qv('.bx-point-shape') || 'circle';
        st.pointSize = Math.max(1, qn('.bx-point-size', 4));
        st.pointJitter = Math.max(0, Math.min(1, qn('.bx-point-jitter', 0.7)));
        st.pointColorMode = qv('.bx-point-color-mode') || 'sameAsBox';
        st.inAlpha = Math.max(0, Math.min(1, qn('.bx-in-alpha', 0.7)));
        st.outAlpha = Math.max(0, Math.min(1, qn('.bx-out-alpha', 0.3)));
        st.inColor = qv('.bx-in-color') || '#000000';
        st.outColor = qv('.bx-out-color') || '#888888';

        st.outlierShow = qc('.bx-outlier-show');
        st.outlierUsePoint = qc('.bx-outlier-use-point');
        st.outlierShape = qv('.bx-outlier-shape') || 'circle';
        st.outlierSize = Math.max(1, qn('.bx-outlier-size', 4));
        st.outlierColor = qv('.bx-outlier-color') || '#888888';
        st.outlierAlpha = Math.max(0, Math.min(1, qn('.bx-outlier-alpha', 0.3)));

        return st;
    }

    function computeBoxStats(values) {
        if (!values || !values.length) return null;
        const S = global.StatCommon;
        if (!S) return null;
        const sorted = values.slice().sort(function (a, b) { return a - b; });
        const q1 = S.quantile(sorted, 0.25);
        const q2 = S.quantile(sorted, 0.5);
        const q3 = S.quantile(sorted, 0.75);
        const iqr = q3 - q1;
        const loBound = q1 - 1.5 * iqr;
        const hiBound = q3 + 1.5 * iqr;

        let whiskerLo = q1, whiskerHi = q3;
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i] >= loBound) { whiskerLo = sorted[i]; break; }
        }
        for (let i = sorted.length - 1; i >= 0; i--) {
            if (sorted[i] <= hiBound) { whiskerHi = sorted[i]; break; }
        }

        const outliers = [];
        for (let i = 0; i < sorted.length; i++) {
            const v = sorted[i];
            if (v < loBound || v > hiBound) outliers.push(v);
        }

        return {
            q1: q1,
            median: q2,
            q3: q3,
            iqr: iqr,
            whiskerLo: whiskerLo,
            whiskerHi: whiskerHi,
            outliers: outliers,
            values: sorted
        };
    }

    function hexToRgba(hex, alpha) {
        const rgb = PC.hexToRgb(hex);
        return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';
    }

    function seededRand(seed) {
        const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
        return x - Math.floor(x);
    }

    function getSymbolType(shape) {
        if (shape === 'square') return d3.symbolSquare;
        if (shape === 'triangle') return d3.symbolTriangle;
        if (shape === 'diamond') return d3.symbolDiamond;
        return d3.symbolCircle;
    }

    function drawPointShape(parent, shape, x, y, size, fill) {
        const sym = d3.symbol().type(getSymbolType(shape)).size(size * size * 3);
        parent.append('path')
            .attr('d', sym())
            .attr('transform', 'translate(' + x + ',' + y + ')')
            .attr('fill', fill);
    }

    function drawBox(parent, opts) {
        const cx = opts.cx;
        const boxW = opts.boxW;
        const stats = opts.stats;
        const yScale = opts.yScale;
        const color = opts.color;
        const bx = opts.settings;
        const seed = opts.seed || 0;
        if (!stats) return;

        const halfW = boxW / 2;
        const yQ1 = yScale(stats.q1);
        const yQ3 = yScale(stats.q3);
        const yMedian = yScale(stats.median);
        const yWhiskerHi = yScale(stats.whiskerHi);
        const yWhiskerLo = yScale(stats.whiskerLo);

        if (bx.whiskerWidth > 0) {
            parent.append('line')
                .attr('x1', cx).attr('x2', cx)
                .attr('y1', yQ3).attr('y2', yWhiskerHi)
                .attr('stroke', bx.whiskerColor)
                .attr('stroke-width', bx.whiskerWidth);
            parent.append('line')
                .attr('x1', cx).attr('x2', cx)
                .attr('y1', yQ1).attr('y2', yWhiskerLo)
                .attr('stroke', bx.whiskerColor)
                .attr('stroke-width', bx.whiskerWidth);

            const capHalf = halfW * bx.capWidth;
            if (capHalf > 0.5) {
                parent.append('line')
                    .attr('x1', cx - capHalf).attr('x2', cx + capHalf)
                    .attr('y1', yWhiskerHi).attr('y2', yWhiskerHi)
                    .attr('stroke', bx.whiskerColor)
                    .attr('stroke-width', bx.whiskerWidth);
                parent.append('line')
                    .attr('x1', cx - capHalf).attr('x2', cx + capHalf)
                    .attr('y1', yWhiskerLo).attr('y2', yWhiskerLo)
                    .attr('stroke', bx.whiskerColor)
                    .attr('stroke-width', bx.whiskerWidth);
            }
        }

        const boxTop = Math.min(yQ1, yQ3);
        const boxBot = Math.max(yQ1, yQ3);
        parent.append('rect')
            .attr('x', cx - halfW).attr('y', boxTop)
            .attr('width', boxW).attr('height', Math.max(1, boxBot - boxTop))
            .attr('fill', bx.boxFillEnabled ? hexToRgba(color, bx.boxFillAlpha) : 'none')
            .attr('stroke', bx.boxStrokeColor)
            .attr('stroke-width', bx.boxStrokeWidth);

        if (bx.medianWidth > 0) {
            if (bx.medianStyle === 'line') {
                parent.append('line')
                    .attr('x1', cx - halfW).attr('x2', cx + halfW)
                    .attr('y1', yMedian).attr('y2', yMedian)
                    .attr('stroke', bx.medianColor)
                    .attr('stroke-width', bx.medianWidth);
            } else if (bx.medianStyle === 'circle') {
                parent.append('circle')
                    .attr('cx', cx).attr('cy', yMedian)
                    .attr('r', bx.medianWidth)
                    .attr('fill', '#ffffff')
                    .attr('stroke', bx.medianColor)
                    .attr('stroke-width', 1.5);
            } else if (bx.medianStyle === 'dot') {
                parent.append('circle')
                    .attr('cx', cx).attr('cy', yMedian)
                    .attr('r', bx.medianWidth)
                    .attr('fill', bx.medianColor);
            }
        }

        if (bx.pointShow !== 'none') {
            const jitterHalf = halfW * bx.pointJitter;
            const sortedVals = stats.values;
            for (let i = 0; i < sortedVals.length; i++) {
                const v = sortedVals[i];
                const inBox = v >= stats.q1 && v <= stats.q3;
                const isOutlier = v < stats.whiskerLo || v > stats.whiskerHi;
                if (isOutlier) continue;
                if (bx.pointShow === 'in' && !inBox) continue;
                if (bx.pointShow === 'out' && inBox) continue;

                const r = seededRand(seed + i * 1.1 + 1);
                const offset = (r - 0.5) * 2 * jitterHalf;
                const px = cx + offset;
                const py = yScale(v);

                let fill;
                if (bx.pointColorMode === 'sameAsBox') {
                    fill = hexToRgba(color, inBox ? bx.inAlpha : bx.outAlpha);
                } else {
                    fill = inBox ? bx.inColor : bx.outColor;
                }
                drawPointShape(parent, bx.pointShape, px, py, bx.pointSize, fill);
            }
        }

        if (bx.outlierShow && stats.outliers.length) {
            const jitterHalf = halfW * bx.pointJitter;
            const shape = bx.outlierUsePoint ? bx.pointShape : bx.outlierShape;
            const size = bx.outlierUsePoint ? bx.pointSize : bx.outlierSize;

            let fill;
            if (bx.outlierUsePoint) {
                if (bx.pointColorMode === 'sameAsBox') {
                    fill = hexToRgba(color, bx.outAlpha);
                } else {
                    fill = bx.outColor;
                }
            } else {
                fill = hexToRgba(bx.outlierColor, bx.outlierAlpha);
            }

            stats.outliers.forEach(function (v, i) {
                const r = seededRand(seed + (1000 + i) * 1.1 + 1);
                const offset = (r - 0.5) * 2 * jitterHalf;
                drawPointShape(parent, shape, cx + offset, yScale(v), size, fill);
            });
        }
    }

    function drawBoxHorizontal(parent, opts) {
        const cy = opts.cy;
        const boxH = opts.boxH;
        const stats = opts.stats;
        const xScale = opts.xScale;
        const color = opts.color;
        const bx = opts.settings;
        const seed = opts.seed || 0;
        if (!stats) return;

        const halfH = boxH / 2;
        const xQ1 = xScale(stats.q1);
        const xQ3 = xScale(stats.q3);
        const xMedian = xScale(stats.median);
        const xWhiskerHi = xScale(stats.whiskerHi);
        const xWhiskerLo = xScale(stats.whiskerLo);

        if (bx.whiskerWidth > 0) {
            parent.append('line')
                .attr('x1', xQ3).attr('x2', xWhiskerHi)
                .attr('y1', cy).attr('y2', cy)
                .attr('stroke', bx.whiskerColor)
                .attr('stroke-width', bx.whiskerWidth);
            parent.append('line')
                .attr('x1', xQ1).attr('x2', xWhiskerLo)
                .attr('y1', cy).attr('y2', cy)
                .attr('stroke', bx.whiskerColor)
                .attr('stroke-width', bx.whiskerWidth);

            const capHalf = halfH * bx.capWidth;
            if (capHalf > 0.5) {
                parent.append('line')
                    .attr('x1', xWhiskerHi).attr('x2', xWhiskerHi)
                    .attr('y1', cy - capHalf).attr('y2', cy + capHalf)
                    .attr('stroke', bx.whiskerColor)
                    .attr('stroke-width', bx.whiskerWidth);
                parent.append('line')
                    .attr('x1', xWhiskerLo).attr('x2', xWhiskerLo)
                    .attr('y1', cy - capHalf).attr('y2', cy + capHalf)
                    .attr('stroke', bx.whiskerColor)
                    .attr('stroke-width', bx.whiskerWidth);
            }
        }

        const boxLeft = Math.min(xQ1, xQ3);
        const boxRight = Math.max(xQ1, xQ3);
        parent.append('rect')
            .attr('x', boxLeft).attr('y', cy - halfH)
            .attr('width', Math.max(1, boxRight - boxLeft)).attr('height', boxH)
            .attr('fill', bx.boxFillEnabled ? hexToRgba(color, bx.boxFillAlpha) : 'none')
            .attr('stroke', bx.boxStrokeColor)
            .attr('stroke-width', bx.boxStrokeWidth);

        if (bx.medianWidth > 0) {
            if (bx.medianStyle === 'line') {
                parent.append('line')
                    .attr('x1', xMedian).attr('x2', xMedian)
                    .attr('y1', cy - halfH).attr('y2', cy + halfH)
                    .attr('stroke', bx.medianColor)
                    .attr('stroke-width', bx.medianWidth);
            } else if (bx.medianStyle === 'circle') {
                parent.append('circle')
                    .attr('cx', xMedian).attr('cy', cy)
                    .attr('r', bx.medianWidth)
                    .attr('fill', '#ffffff')
                    .attr('stroke', bx.medianColor)
                    .attr('stroke-width', 1.5);
            } else if (bx.medianStyle === 'dot') {
                parent.append('circle')
                    .attr('cx', xMedian).attr('cy', cy)
                    .attr('r', bx.medianWidth)
                    .attr('fill', bx.medianColor);
            }
        }

        if (bx.pointShow !== 'none') {
            const jitterHalf = halfH * bx.pointJitter;
            const sortedVals = stats.values;
            for (let i = 0; i < sortedVals.length; i++) {
                const v = sortedVals[i];
                const inBox = v >= stats.q1 && v <= stats.q3;
                const isOutlier = v < stats.whiskerLo || v > stats.whiskerHi;
                if (isOutlier) continue;
                if (bx.pointShow === 'in' && !inBox) continue;
                if (bx.pointShow === 'out' && inBox) continue;

                const r = seededRand(seed + i * 1.1 + 1);
                const offset = (r - 0.5) * 2 * jitterHalf;
                const px = xScale(v);
                const py = cy + offset;

                let fill;
                if (bx.pointColorMode === 'sameAsBox') {
                    fill = hexToRgba(color, inBox ? bx.inAlpha : bx.outAlpha);
                } else {
                    fill = inBox ? bx.inColor : bx.outColor;
                }
                drawPointShape(parent, bx.pointShape, px, py, bx.pointSize, fill);
            }
        }

        if (bx.outlierShow && stats.outliers.length) {
            const jitterHalf = halfH * bx.pointJitter;
            const shape = bx.outlierUsePoint ? bx.pointShape : bx.outlierShape;
            const size = bx.outlierUsePoint ? bx.pointSize : bx.outlierSize;

            let fill;
            if (bx.outlierUsePoint) {
                if (bx.pointColorMode === 'sameAsBox') {
                    fill = hexToRgba(color, bx.outAlpha);
                } else {
                    fill = bx.outColor;
                }
            } else {
                fill = hexToRgba(bx.outlierColor, bx.outlierAlpha);
            }

            stats.outliers.forEach(function (v, i) {
                const r = seededRand(seed + (1000 + i) * 1.1 + 1);
                const offset = (r - 0.5) * 2 * jitterHalf;
                drawPointShape(parent, shape, xScale(v), cy + offset, size, fill);
            });
        }
    }

    global.BoxCommon = {
        defaultBoxSettings: defaultBoxSettings,
        renderBoxPanel: renderBoxPanel,
        readBoxSettings: readBoxSettings,
        computeBoxStats: computeBoxStats,
        drawBox: drawBox,
        drawBoxHorizontal: drawBoxHorizontal,
        L: L
    };
})(window);
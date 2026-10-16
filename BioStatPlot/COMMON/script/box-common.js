(function (global) {
    'use strict';

    const PC = global.PlotCommon;

    function isEn() { return window.location.pathname.indexOf('/en/') >= 0; }

    const I18N = {
        zh: {
            panelTitle: '箱线图设置',
            panelTitleViolin: '小提琴图设置',

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
            colorSameAsBox: '与箱体同色',
            colorSameAsViolin: '与小提琴同色',
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
            outlierAlpha: '透明度',

            violinSection: '小提琴主体',
            violinWidthScale: '宽度',
            violinFillEnabled: '填充',
            violinFillAlpha: '填充透明度',
            violinFillMode: '填充色',
            violinFillAuto: '跟随分类色板',
            violinFillCustom: '统一颜色',
            violinFillColor: '统一色',
            violinStrokeWidth: '描边宽度',
            violinStrokeColor: '描边颜色',
            violinBandwidthMode: '带宽模式',
            violinBandwidthAuto: '自动（Silverman）',
            violinBandwidthManual: '手动',
            violinBandwidth: '带宽值',
            violinTrim: '截断到数据范围',

            boxOverlaySection: '箱线图叠加',
            boxOverlay: '显示箱线图',
            boxOverlayWidth: '箱体宽度',
            boxOverlayFillMode: '填充色',
            boxOverlayFillSame: '与小提琴同色',
            boxOverlayFillCustom: '统一颜色',
            boxOverlayFillNone: '不填充',
            boxOverlayAlpha: '填充透明度',
            boxOverlayColor: '统一色',
            boxOverlayMedianWidth: '中位线宽',
            boxOverlayMedianColor: '中位线颜色'
        },
        en: {
            panelTitle: 'Box Plot Settings',
            panelTitleViolin: 'Violin Plot Settings',

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
            colorSameAsViolin: 'Same as violin',
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
            outlierAlpha: 'Alpha',

            violinSection: 'Violin',
            violinWidthScale: 'Width',
            violinFillEnabled: 'Fill',
            violinFillAlpha: 'Fill alpha',
            violinFillMode: 'Fill color',
            violinFillAuto: 'Category palette',
            violinFillCustom: 'Custom',
            violinFillColor: 'Custom color',
            violinStrokeWidth: 'Stroke width',
            violinStrokeColor: 'Stroke color',
            violinBandwidthMode: 'Bandwidth',
            violinBandwidthAuto: 'Auto (Silverman)',
            violinBandwidthManual: 'Manual',
            violinBandwidth: 'Bandwidth value',
            violinTrim: 'Trim to data range',

            boxOverlaySection: 'Box overlay',
            boxOverlay: 'Show box plot',
            boxOverlayWidth: 'Box width',
            boxOverlayFillMode: 'Fill',
            boxOverlayFillSame: 'Same as violin',
            boxOverlayFillCustom: 'Custom',
            boxOverlayFillNone: 'None',
            boxOverlayAlpha: 'Fill alpha',
            boxOverlayColor: 'Custom color',
            boxOverlayMedianWidth: 'Median width',
            boxOverlayMedianColor: 'Median color'
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

    function defaultViolinSettings() {
        return {
            violinWidthScale: 0.8,
            violinFillEnabled: true,
            violinFillAlpha: 0.7,
            violinFillMode: 'auto',
            violinFillColor: '#cccccc',
            violinStrokeWidth: 1,
            violinStrokeColor: '#333333',
            violinBandwidthMode: 'auto',
            violinBandwidth: 0,
            violinTrim: false,

            boxOverlay: true,
            boxOverlayWidth: 0.2,
            boxOverlayFillMode: 'same',
            boxOverlayAlpha: 1,
            boxOverlayColor: '#ffffff',
            boxOverlayMedianWidth: 2,
            boxOverlayMedianColor: '#333333',

            pointShow: 'none',
            pointShape: 'circle',
            pointSize: 3,
            pointJitter: 0.4,
            pointColorMode: 'sameAsViolin',
            inColor: '#000000',
            outColor: '#888888',
            pointAlpha: 0.7,

            outlierShow: false,
            outlierShape: 'circle',
            outlierSize: 3,
            outlierColor: '#888888',
            outlierAlpha: 0.7
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

        bindBoxPanelEvents(container, st, opts);
    }

    function renderViolinPanel(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;

        const T = L();
        const st = Object.assign(defaultViolinSettings(), opts.state || {});

        container.className = 'param-panel';
        container._settings = st;

        container.innerHTML = `
            <div class="param-panel-title">${T.panelTitleViolin}</div>

            <div class="axis-subsection">${T.violinSection}</div>
            <div class="param-grid cols-4">
                <div class="param-item"><label>${T.violinWidthScale}</label>
                    <input type="number" class="vi-width" value="${st.violinWidthScale}" min="0.2" max="1.2" step="0.05"></div>
                <div class="param-item"><label class="mini-check"><input type="checkbox" class="vi-fill-en" ${st.violinFillEnabled ? 'checked' : ''}>${T.violinFillEnabled}</label></div>
                <div class="param-item"><label>${T.violinFillAlpha}</label>
                    <input type="number" class="vi-fill-alpha" value="${st.violinFillAlpha}" min="0" max="1" step="0.05"></div>
                <div class="param-item"><label>${T.violinFillMode}</label>
                    <select class="vi-fill-mode">
                        <option value="auto" ${st.violinFillMode === 'auto' ? 'selected' : ''}>${T.violinFillAuto}</option>
                        <option value="custom" ${st.violinFillMode === 'custom' ? 'selected' : ''}>${T.violinFillCustom}</option>
                    </select></div>
                <div class="param-item vi-fill-color-item" style="${st.violinFillMode === 'custom' ? '' : 'display:none;'}">
                    <label>${T.violinFillColor}</label>
                    <input type="color" class="vi-fill-color" value="${st.violinFillColor}"></div>
                <div class="param-item"><label>${T.violinStrokeWidth}</label>
                    <input type="number" class="vi-stroke-w" value="${st.violinStrokeWidth}" min="0" max="4" step="0.5"></div>
                <div class="param-item"><label>${T.violinStrokeColor}</label>
                    <input type="color" class="vi-stroke-c" value="${st.violinStrokeColor}"></div>
                <div class="param-item"><label>${T.violinBandwidthMode}</label>
                    <select class="vi-bw-mode">
                        <option value="auto" ${st.violinBandwidthMode === 'auto' ? 'selected' : ''}>${T.violinBandwidthAuto}</option>
                        <option value="manual" ${st.violinBandwidthMode === 'manual' ? 'selected' : ''}>${T.violinBandwidthManual}</option>
                    </select></div>
                <div class="param-item vi-bw-item" style="${st.violinBandwidthMode === 'manual' ? '' : 'display:none;'}">
                    <label>${T.violinBandwidth}</label>
                    <input type="number" class="vi-bw" value="${st.violinBandwidth}" min="0" step="0.01"></div>
                <div class="param-item"><label class="mini-check"><input type="checkbox" class="vi-trim" ${st.violinTrim ? 'checked' : ''}>${T.violinTrim}</label></div>
            </div>

            <div class="axis-subsection">${T.boxOverlaySection}</div>
            <div class="param-grid cols-4">
                <div class="param-item"><label class="mini-check"><input type="checkbox" class="vi-box-on" ${st.boxOverlay ? 'checked' : ''}>${T.boxOverlay}</label></div>
                <div class="param-item"><label>${T.boxOverlayWidth}</label>
                    <input type="number" class="vi-box-width" value="${st.boxOverlayWidth}" min="0.02" max="0.5" step="0.01"></div>
                <div class="param-item"><label>${T.boxOverlayFillMode}</label>
                    <select class="vi-box-fill-mode">
                        <option value="same" ${st.boxOverlayFillMode === 'same' ? 'selected' : ''}>${T.boxOverlayFillSame}</option>
                        <option value="custom" ${st.boxOverlayFillMode === 'custom' ? 'selected' : ''}>${T.boxOverlayFillCustom}</option>
                        <option value="none" ${st.boxOverlayFillMode === 'none' ? 'selected' : ''}>${T.boxOverlayFillNone}</option>
                    </select></div>
                <div class="param-item vi-box-color-item" style="${st.boxOverlayFillMode === 'custom' ? '' : 'display:none;'}">
                    <label>${T.boxOverlayColor}</label>
                    <input type="color" class="vi-box-color" value="${st.boxOverlayColor}"></div>
                <div class="param-item vi-box-alpha-item" style="${st.boxOverlayFillMode === 'none' ? 'display:none;' : ''}">
                    <label>${T.boxOverlayAlpha}</label>
                    <input type="number" class="vi-box-alpha" value="${st.boxOverlayAlpha}" min="0" max="1" step="0.05"></div>
                <div class="param-item"><label>${T.boxOverlayMedianWidth}</label>
                    <input type="number" class="vi-box-median-w" value="${st.boxOverlayMedianWidth}" min="0" max="6" step="0.5"></div>
                <div class="param-item"><label>${T.boxOverlayMedianColor}</label>
                    <input type="color" class="vi-box-median-c" value="${st.boxOverlayMedianColor}"></div>
            </div>

            <div class="axis-subsection">${T.pointSection}</div>
            <div class="param-grid cols-4">
                <div class="param-item"><label>${T.pointShow}</label>
                    <select class="vi-point-show">
                        <option value="none" ${st.pointShow === 'none' ? 'selected' : ''}>${T.pointShowNone}</option>
                        <option value="in" ${st.pointShow === 'in' ? 'selected' : ''}>${T.pointShowIn}</option>
                        <option value="out" ${st.pointShow === 'out' ? 'selected' : ''}>${T.pointShowOut}</option>
                        <option value="all" ${st.pointShow === 'all' ? 'selected' : ''}>${T.pointShowAll}</option>
                    </select></div>
                <div class="param-item"><label>${T.pointShape}</label>
                    <select class="vi-point-shape">
                        <option value="circle" ${st.pointShape === 'circle' ? 'selected' : ''}>${T.shapeCircle}</option>
                        <option value="square" ${st.pointShape === 'square' ? 'selected' : ''}>${T.shapeSquare}</option>
                        <option value="triangle" ${st.pointShape === 'triangle' ? 'selected' : ''}>${T.shapeTriangle}</option>
                        <option value="diamond" ${st.pointShape === 'diamond' ? 'selected' : ''}>${T.shapeDiamond}</option>
                    </select></div>
                <div class="param-item"><label>${T.pointSize}</label>
                    <input type="number" class="vi-point-size" value="${st.pointSize}" min="1" max="12" step="0.5"></div>
                <div class="param-item"><label>${T.pointJitter}</label>
                    <input type="number" class="vi-point-jitter" value="${st.pointJitter}" min="0" max="1" step="0.05"></div>
                <div class="param-item"><label>${T.pointColorMode}</label>
                    <select class="vi-point-color-mode">
                        <option value="sameAsViolin" ${st.pointColorMode === 'sameAsViolin' ? 'selected' : ''}>${T.colorSameAsViolin}</option>
                        <option value="custom" ${st.pointColorMode === 'custom' ? 'selected' : ''}>${T.colorCustom}</option>
                    </select></div>
                <div class="param-item vi-point-alpha-item"><label>${T.outlierAlpha}</label>
                    <input type="number" class="vi-point-alpha" value="${st.pointAlpha}" min="0" max="1" step="0.05"></div>
                <div class="param-item vi-point-color-item" style="${st.pointColorMode === 'custom' ? '' : 'display:none;'}">
                    <label>${T.inColor}</label>
                    <input type="color" class="vi-point-color" value="${st.inColor}"></div>
            </div>

            <div class="axis-subsection">${T.outlierSection}</div>
            <div class="param-grid cols-4">
                <div class="param-item"><label class="mini-check"><input type="checkbox" class="vi-outlier-show" ${st.outlierShow ? 'checked' : ''}>${T.outlierShow}</label></div>
                <div class="param-item"><label>${T.outlierShape}</label>
                    <select class="vi-outlier-shape">
                        <option value="circle" ${st.outlierShape === 'circle' ? 'selected' : ''}>${T.shapeCircle}</option>
                        <option value="square" ${st.outlierShape === 'square' ? 'selected' : ''}>${T.shapeSquare}</option>
                        <option value="triangle" ${st.outlierShape === 'triangle' ? 'selected' : ''}>${T.shapeTriangle}</option>
                        <option value="diamond" ${st.outlierShape === 'diamond' ? 'selected' : ''}>${T.shapeDiamond}</option>
                    </select></div>
                <div class="param-item"><label>${T.outlierSize}</label>
                    <input type="number" class="vi-outlier-size" value="${st.outlierSize}" min="1" max="12" step="0.5"></div>
                <div class="param-item"><label>${T.outlierColor}</label>
                    <input type="color" class="vi-outlier-color" value="${st.outlierColor}"></div>
                <div class="param-item"><label>${T.outlierAlpha}</label>
                    <input type="number" class="vi-outlier-alpha" value="${st.outlierAlpha}" min="0" max="1" step="0.05"></div>
            </div>
        `;

        bindViolinPanelEvents(container, st, opts);
    }

    function bindBoxPanelEvents(container, st, opts) {
        const fire = () => { if (opts.onChange) opts.onChange(); };

        const colorModeSel = container.querySelector('.bx-point-color-mode');
        function updateColorVis() {
            const sameAsBox = st.pointColorMode === 'sameAsBox';
            container.querySelectorAll('.bx-alpha-in, .bx-alpha-out').forEach(function (el) {
                el.style.display = sameAsBox ? '' : 'none';
            });
            container.querySelectorAll('.bx-color-in, .bx-color-out').forEach(function (el) {
                el.style.display = sameAsBox ? 'none' : '';
            });
        }
        if (colorModeSel) colorModeSel.addEventListener('change', function () {
            st.pointColorMode = this.value; updateColorVis(); fire();
        });
        updateColorVis();

        const outlierUsePoint = container.querySelector('.bx-outlier-use-point');
        function updateOutlierVis() {
            const usePoint = st.outlierUsePoint;
            container.querySelectorAll('.bx-outlier-shape-item, .bx-outlier-size-item, .bx-outlier-color-item, .bx-outlier-alpha-item').forEach(function (el) {
                el.style.display = usePoint ? 'none' : '';
            });
        }
        if (outlierUsePoint) outlierUsePoint.addEventListener('change', function () {
            st.outlierUsePoint = this.checked; updateOutlierVis(); fire();
        });
        updateOutlierVis();

        container.querySelectorAll('input, select').forEach(function (el) {
            if (el === colorModeSel || el === outlierUsePoint) return;
            el.addEventListener('change', fire);
        });
    }

    function bindViolinPanelEvents(container, st, opts) {
        const fire = () => { if (opts.onChange) opts.onChange(); };

        const fillModeSel = container.querySelector('.vi-fill-mode');
        const fillColorItem = container.querySelector('.vi-fill-color-item');
        if (fillModeSel) fillModeSel.addEventListener('change', function () {
            st.violinFillMode = this.value;
            if (fillColorItem) fillColorItem.style.display = (this.value === 'custom') ? '' : 'none';
            fire();
        });

        const bwModeSel = container.querySelector('.vi-bw-mode');
        const bwItem = container.querySelector('.vi-bw-item');
        if (bwModeSel) bwModeSel.addEventListener('change', function () {
            st.violinBandwidthMode = this.value;
            if (bwItem) bwItem.style.display = (this.value === 'manual') ? '' : 'none';
            fire();
        });

        const boxFillSel = container.querySelector('.vi-box-fill-mode');
        const boxColorItem = container.querySelector('.vi-box-color-item');
        const boxAlphaItem = container.querySelector('.vi-box-alpha-item');
        function updateBoxFillVis() {
            const mode = st.boxOverlayFillMode;
            if (boxColorItem) boxColorItem.style.display = (mode === 'custom') ? '' : 'none';
            if (boxAlphaItem) boxAlphaItem.style.display = (mode === 'none') ? 'none' : '';
        }
        if (boxFillSel) boxFillSel.addEventListener('change', function () {
            st.boxOverlayFillMode = this.value; updateBoxFillVis(); fire();
        });
        updateBoxFillVis();

        const pointColorSel = container.querySelector('.vi-point-color-mode');
        const pointColorItem = container.querySelector('.vi-point-color-item');
        function updatePointColorVis() {
            if (pointColorItem) pointColorItem.style.display = (st.pointColorMode === 'custom') ? '' : 'none';
        }
        if (pointColorSel) pointColorSel.addEventListener('change', function () {
            st.pointColorMode = this.value; updatePointColorVis(); fire();
        });
        updatePointColorVis();

        container.querySelectorAll('input, select').forEach(function (el) {
            if (el === fillModeSel || el === bwModeSel || el === boxFillSel || el === pointColorSel) return;
            el.addEventListener('change', fire);
        });
    }

    function readBoxSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return defaultBoxSettings();
        const st = container._settings || defaultBoxSettings();
        const qv = s => { const e = container.querySelector(s); return e ? e.value : undefined; };
        const qc = s => { const e = container.querySelector(s); return e ? e.checked : false; };
        const qn = (s, fb) => {
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

    function readViolinSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return defaultViolinSettings();
        const st = container._settings || defaultViolinSettings();
        const qv = s => { const e = container.querySelector(s); return e ? e.value : undefined; };
        const qc = s => { const e = container.querySelector(s); return e ? e.checked : false; };
        const qn = (s, fb) => {
            const e = container.querySelector(s);
            if (!e) return fb;
            const v = parseFloat(e.value);
            return isFinite(v) ? v : fb;
        };

        st.violinWidthScale = Math.max(0.2, Math.min(1.2, qn('.vi-width', 0.8)));
        st.violinFillEnabled = qc('.vi-fill-en');
        st.violinFillAlpha = Math.max(0, Math.min(1, qn('.vi-fill-alpha', 0.7)));
        st.violinFillMode = qv('.vi-fill-mode') || 'auto';
        st.violinFillColor = qv('.vi-fill-color') || '#cccccc';
        st.violinStrokeWidth = Math.max(0, qn('.vi-stroke-w', 1));
        st.violinStrokeColor = qv('.vi-stroke-c') || '#333333';
        st.violinBandwidthMode = qv('.vi-bw-mode') || 'auto';
        st.violinBandwidth = Math.max(0, qn('.vi-bw', 0));
        st.violinTrim = qc('.vi-trim');

        st.boxOverlay = qc('.vi-box-on');
        st.boxOverlayWidth = Math.max(0.02, Math.min(0.5, qn('.vi-box-width', 0.2)));
        st.boxOverlayFillMode = qv('.vi-box-fill-mode') || 'same';
        st.boxOverlayAlpha = Math.max(0, Math.min(1, qn('.vi-box-alpha', 1)));
        st.boxOverlayColor = qv('.vi-box-color') || '#ffffff';
        st.boxOverlayMedianWidth = Math.max(0, qn('.vi-box-median-w', 2));
        st.boxOverlayMedianColor = qv('.vi-box-median-c') || '#333333';

        st.pointShow = qv('.vi-point-show') || 'none';
        st.pointShape = qv('.vi-point-shape') || 'circle';
        st.pointSize = Math.max(1, qn('.vi-point-size', 3));
        st.pointJitter = Math.max(0, Math.min(1, qn('.vi-point-jitter', 0.4)));
        st.pointColorMode = qv('.vi-point-color-mode') || 'sameAsViolin';
        st.pointAlpha = Math.max(0, Math.min(1, qn('.vi-point-alpha', 0.7)));
        st.inColor = qv('.vi-point-color') || '#000000';

        st.outlierShow = qc('.vi-outlier-show');
        st.outlierShape = qv('.vi-outlier-shape') || 'circle';
        st.outlierSize = Math.max(1, qn('.vi-outlier-size', 3));
        st.outlierColor = qv('.vi-outlier-color') || '#888888';
        st.outlierAlpha = Math.max(0, Math.min(1, qn('.vi-outlier-alpha', 0.7)));

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
            q1: q1, median: q2, q3: q3, iqr: iqr,
            whiskerLo: whiskerLo, whiskerHi: whiskerHi,
            outliers: outliers, values: sorted
        };
    }

    function computeKDE(values, opts) {
        opts = opts || {};
        if (!values || values.length < 2) return null;
        const sorted = values.slice().sort(function (a, b) { return a - b; });
        const n = sorted.length;

        let sum = 0;
        for (let i = 0; i < n; i++) sum += sorted[i];
        const mean = sum / n;

        let ss = 0;
        for (let i = 0; i < n; i++) {
            const d = sorted[i] - mean;
            ss += d * d;
        }
        const sd = n > 1 ? Math.sqrt(ss / (n - 1)) : 0;

        const S = global.StatCommon;
        const q1 = S ? S.quantile(sorted, 0.25) : sorted[Math.floor(n * 0.25)];
        const q3 = S ? S.quantile(sorted, 0.75) : sorted[Math.floor(n * 0.75)];
        const iqr = q3 - q1;

        let bw;
        if (opts.bandwidthMode === 'manual' && opts.bandwidth > 0) {
            bw = opts.bandwidth;
        } else {
            const sigma = Math.min(sd, iqr / 1.34);
            bw = 0.9 * sigma * Math.pow(n, -0.2);
        }
        if (!isFinite(bw) || bw <= 0) {
            bw = (sorted[n - 1] - sorted[0]) / 10 || 1;
        }

        const lo = sorted[0];
        const hi = sorted[n - 1];
        const pad = (hi - lo) * 0.1 || bw;
        const evalLo = opts.trim ? lo : lo - pad;
        const evalHi = opts.trim ? hi : hi + pad;

        const M = 100;
        const step = (evalHi - evalLo) / (M - 1) || 1;
        const xs = [];
        const ys = [];

        for (let i = 0; i < M; i++) {
            const x = evalLo + i * step;
            let d = 0;
            for (let j = 0; j < n; j++) {
                const u = (x - sorted[j]) / bw;
                d += Math.exp(-0.5 * u * u);
            }
            d = d / (n * bw * Math.sqrt(2 * Math.PI));
            xs.push(x);
            ys.push(d);
        }

        return { xs: xs, ys: ys, bandwidth: bw, lo: lo, hi: hi };
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
                .attr('stroke', bx.whiskerColor).attr('stroke-width', bx.whiskerWidth);
            parent.append('line')
                .attr('x1', cx).attr('x2', cx)
                .attr('y1', yQ1).attr('y2', yWhiskerLo)
                .attr('stroke', bx.whiskerColor).attr('stroke-width', bx.whiskerWidth);

            const capHalf = halfW * bx.capWidth;
            if (capHalf > 0.5) {
                parent.append('line')
                    .attr('x1', cx - capHalf).attr('x2', cx + capHalf)
                    .attr('y1', yWhiskerHi).attr('y2', yWhiskerHi)
                    .attr('stroke', bx.whiskerColor).attr('stroke-width', bx.whiskerWidth);
                parent.append('line')
                    .attr('x1', cx - capHalf).attr('x2', cx + capHalf)
                    .attr('y1', yWhiskerLo).attr('y2', yWhiskerLo)
                    .attr('stroke', bx.whiskerColor).attr('stroke-width', bx.whiskerWidth);
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
                    .attr('stroke', bx.medianColor).attr('stroke-width', bx.medianWidth);
            } else if (bx.medianStyle === 'circle') {
                parent.append('circle')
                    .attr('cx', cx).attr('cy', yMedian).attr('r', bx.medianWidth)
                    .attr('fill', '#ffffff').attr('stroke', bx.medianColor).attr('stroke-width', 1.5);
            } else if (bx.medianStyle === 'dot') {
                parent.append('circle')
                    .attr('cx', cx).attr('cy', yMedian).attr('r', bx.medianWidth)
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
                let fill;
                if (bx.pointColorMode === 'sameAsBox') {
                    fill = hexToRgba(color, inBox ? bx.inAlpha : bx.outAlpha);
                } else {
                    fill = inBox ? bx.inColor : bx.outColor;
                }
                drawPointShape(parent, bx.pointShape, cx + offset, yScale(v), bx.pointSize, fill);
            }
        }

        if (bx.outlierShow && stats.outliers.length) {
            const jitterHalf = halfW * bx.pointJitter;
            const shape = bx.outlierUsePoint ? bx.pointShape : bx.outlierShape;
            const size = bx.outlierUsePoint ? bx.pointSize : bx.outlierSize;
            let fill;
            if (bx.outlierUsePoint) {
                fill = (bx.pointColorMode === 'sameAsBox')
                    ? hexToRgba(color, bx.outAlpha)
                    : bx.outColor;
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
                .attr('stroke', bx.whiskerColor).attr('stroke-width', bx.whiskerWidth);
            parent.append('line')
                .attr('x1', xQ1).attr('x2', xWhiskerLo)
                .attr('y1', cy).attr('y2', cy)
                .attr('stroke', bx.whiskerColor).attr('stroke-width', bx.whiskerWidth);

            const capHalf = halfH * bx.capWidth;
            if (capHalf > 0.5) {
                parent.append('line')
                    .attr('x1', xWhiskerHi).attr('x2', xWhiskerHi)
                    .attr('y1', cy - capHalf).attr('y2', cy + capHalf)
                    .attr('stroke', bx.whiskerColor).attr('stroke-width', bx.whiskerWidth);
                parent.append('line')
                    .attr('x1', xWhiskerLo).attr('x2', xWhiskerLo)
                    .attr('y1', cy - capHalf).attr('y2', cy + capHalf)
                    .attr('stroke', bx.whiskerColor).attr('stroke-width', bx.whiskerWidth);
            }
        }

        const boxLeft = Math.min(xQ1, xQ3);
        const boxRight = Math.max(xQ1, xQ3);
        parent.append('rect')
            .attr('x', boxLeft).attr('y', cy - halfH)
            .attr('width', Math.max(1, boxRight - boxLeft)).attr('height', boxH)
            .attr('fill', bx.boxFillEnabled ? hexToRgba(color, bx.boxFillAlpha) : 'none')
            .attr('stroke', bx.boxStrokeColor).attr('stroke-width', bx.boxStrokeWidth);

        if (bx.medianWidth > 0) {
            if (bx.medianStyle === 'line') {
                parent.append('line')
                    .attr('x1', xMedian).attr('x2', xMedian)
                    .attr('y1', cy - halfH).attr('y2', cy + halfH)
                    .attr('stroke', bx.medianColor).attr('stroke-width', bx.medianWidth);
            } else if (bx.medianStyle === 'circle') {
                parent.append('circle')
                    .attr('cx', xMedian).attr('cy', cy).attr('r', bx.medianWidth)
                    .attr('fill', '#ffffff').attr('stroke', bx.medianColor).attr('stroke-width', 1.5);
            } else if (bx.medianStyle === 'dot') {
                parent.append('circle')
                    .attr('cx', xMedian).attr('cy', cy).attr('r', bx.medianWidth)
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
                let fill;
                if (bx.pointColorMode === 'sameAsBox') {
                    fill = hexToRgba(color, inBox ? bx.inAlpha : bx.outAlpha);
                } else {
                    fill = inBox ? bx.inColor : bx.outColor;
                }
                drawPointShape(parent, bx.pointShape, xScale(v), cy + offset, bx.pointSize, fill);
            }
        }

        if (bx.outlierShow && stats.outliers.length) {
            const jitterHalf = halfH * bx.pointJitter;
            const shape = bx.outlierUsePoint ? bx.pointShape : bx.outlierShape;
            const size = bx.outlierUsePoint ? bx.pointSize : bx.outlierSize;
            let fill;
            if (bx.outlierUsePoint) {
                fill = (bx.pointColorMode === 'sameAsBox')
                    ? hexToRgba(color, bx.outAlpha)
                    : bx.outColor;
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

    function resolveViolinFill(st, color) {
        if (!st.violinFillEnabled) return 'none';
        if (st.violinFillMode === 'custom') {
            return hexToRgba(st.violinFillColor, st.violinFillAlpha);
        }
        return hexToRgba(color, st.violinFillAlpha);
    }

    function resolveBoxOverlayFill(st, color) {
        if (st.boxOverlayFillMode === 'none') return 'none';
        if (st.boxOverlayFillMode === 'custom') {
            return hexToRgba(st.boxOverlayColor, st.boxOverlayAlpha);
        }
        return hexToRgba(color, st.boxOverlayAlpha);
    }

    function drawViolin(parent, opts) {
        const cx = opts.cx;
        const halfW = opts.halfW;
        const kde = opts.kde;
        const stats = opts.stats;
        const yScale = opts.yScale;
        const color = opts.color;
        const st = opts.settings;
        const seed = opts.seed || 0;
        if (!kde || !kde.xs.length) return;

        const maxY = Math.max.apply(null, kde.ys);
        const scale = maxY > 0 ? halfW / maxY : 0;

        const leftPts = [];
        const rightPts = [];
        for (let i = 0; i < kde.xs.length; i++) {
            const x = kde.xs[i];
            const py = yScale(x);
            const w = kde.ys[i] * scale;
            leftPts.push([cx - w, py]);
            rightPts.push([cx + w, py]);
        }

        let d = 'M ' + leftPts[0][0] + ' ' + leftPts[0][1];
        for (let i = 1; i < leftPts.length; i++) {
            d += ' L ' + leftPts[i][0] + ' ' + leftPts[i][1];
        }
        for (let i = rightPts.length - 1; i >= 0; i--) {
            d += ' L ' + rightPts[i][0] + ' ' + rightPts[i][1];
        }
        d += ' Z';

        parent.append('path')
            .attr('d', d)
            .attr('fill', resolveViolinFill(st, color))
            .attr('stroke', st.violinStrokeColor)
            .attr('stroke-width', st.violinStrokeWidth)
            .attr('stroke-linejoin', 'round');

        if (st.boxOverlay && stats) {
            drawBoxOverlayVertical(parent, {
                cx: cx,
                halfW: halfW * st.boxOverlayWidth,
                stats: stats,
                yScale: yScale,
                fill: resolveBoxOverlayFill(st, color),
                stroke: st.violinStrokeColor,
                medianWidth: st.boxOverlayMedianWidth,
                medianColor: st.boxOverlayMedianColor
            });
        }

        if (st.pointShow !== 'none') {
            const jitterHalf = halfW * st.pointJitter;
            const sorted = stats ? stats.values : kde.xs;
            for (let i = 0; i < sorted.length; i++) {
                const v = sorted[i];
                const inBox = stats ? (v >= stats.q1 && v <= stats.q3) : true;
                const isOutlier = stats ? (v < stats.whiskerLo || v > stats.whiskerHi) : false;
                if (isOutlier) continue;
                if (st.pointShow === 'in' && !inBox) continue;
                if (st.pointShow === 'out' && inBox) continue;

                const r = seededRand(seed + i * 1.1 + 1);
                const offset = (r - 0.5) * 2 * jitterHalf;
                let fill;
                if (st.pointColorMode === 'sameAsViolin') {
                    fill = hexToRgba(color, st.pointAlpha);
                } else {
                    fill = hexToRgba(st.inColor, st.pointAlpha);
                }
                drawPointShape(parent, st.pointShape, cx + offset, yScale(v), st.pointSize, fill);
            }
        }

        if (st.outlierShow && stats && stats.outliers.length) {
            const jitterHalf = halfW * st.pointJitter;
            stats.outliers.forEach(function (v, i) {
                const r = seededRand(seed + (1000 + i) * 1.1 + 1);
                const offset = (r - 0.5) * 2 * jitterHalf;
                const fill = hexToRgba(st.outlierColor, st.outlierAlpha);
                drawPointShape(parent, st.outlierShape, cx + offset, yScale(v), st.outlierSize, fill);
            });
        }
    }

    function drawViolinHorizontal(parent, opts) {
        const cy = opts.cy;
        const halfH = opts.halfH;
        const kde = opts.kde;
        const stats = opts.stats;
        const xScale = opts.xScale;
        const color = opts.color;
        const st = opts.settings;
        const seed = opts.seed || 0;
        if (!kde || !kde.xs.length) return;

        const maxY = Math.max.apply(null, kde.ys);
        const scale = maxY > 0 ? halfH / maxY : 0;

        const topPts = [];
        const botPts = [];
        for (let i = 0; i < kde.xs.length; i++) {
            const x = kde.xs[i];
            const px = xScale(x);
            const h = kde.ys[i] * scale;
            topPts.push([px, cy - h]);
            botPts.push([px, cy + h]);
        }

        let d = 'M ' + topPts[0][0] + ' ' + topPts[0][1];
        for (let i = 1; i < topPts.length; i++) {
            d += ' L ' + topPts[i][0] + ' ' + topPts[i][1];
        }
        for (let i = botPts.length - 1; i >= 0; i--) {
            d += ' L ' + botPts[i][0] + ' ' + botPts[i][1];
        }
        d += ' Z';

        parent.append('path')
            .attr('d', d)
            .attr('fill', resolveViolinFill(st, color))
            .attr('stroke', st.violinStrokeColor)
            .attr('stroke-width', st.violinStrokeWidth)
            .attr('stroke-linejoin', 'round');

        if (st.boxOverlay && stats) {
            drawBoxOverlayHorizontal(parent, {
                cy: cy,
                halfH: halfH * st.boxOverlayWidth,
                stats: stats,
                xScale: xScale,
                fill: resolveBoxOverlayFill(st, color),
                stroke: st.violinStrokeColor,
                medianWidth: st.boxOverlayMedianWidth,
                medianColor: st.boxOverlayMedianColor
            });
        }

        if (st.pointShow !== 'none') {
            const jitterHalf = halfH * st.pointJitter;
            const sorted = stats ? stats.values : kde.xs;
            for (let i = 0; i < sorted.length; i++) {
                const v = sorted[i];
                const inBox = stats ? (v >= stats.q1 && v <= stats.q3) : true;
                const isOutlier = stats ? (v < stats.whiskerLo || v > stats.whiskerHi) : false;
                if (isOutlier) continue;
                if (st.pointShow === 'in' && !inBox) continue;
                if (st.pointShow === 'out' && inBox) continue;

                const r = seededRand(seed + i * 1.1 + 1);
                const offset = (r - 0.5) * 2 * jitterHalf;
                let fill;
                if (st.pointColorMode === 'sameAsViolin') {
                    fill = hexToRgba(color, st.pointAlpha);
                } else {
                    fill = hexToRgba(st.inColor, st.pointAlpha);
                }
                drawPointShape(parent, st.pointShape, xScale(v), cy + offset, st.pointSize, fill);
            }
        }

        if (st.outlierShow && stats && stats.outliers.length) {
            const jitterHalf = halfH * st.pointJitter;
            stats.outliers.forEach(function (v, i) {
                const r = seededRand(seed + (1000 + i) * 1.1 + 1);
                const offset = (r - 0.5) * 2 * jitterHalf;
                const fill = hexToRgba(st.outlierColor, st.outlierAlpha);
                drawPointShape(parent, st.outlierShape, xScale(v), cy + offset, st.outlierSize, fill);
            });
        }
    }

    function drawBoxOverlayVertical(parent, opts) {
        const cx = opts.cx;
        const halfW = opts.halfW;
        const stats = opts.stats;
        const yScale = opts.yScale;
        const fill = opts.fill;
        const stroke = opts.stroke;
        const medianWidth = opts.medianWidth;
        const medianColor = opts.medianColor;
        if (!stats) return;

        const yQ1 = yScale(stats.q1);
        const yQ3 = yScale(stats.q3);
        const yMed = yScale(stats.median);
        const yHi = yScale(stats.whiskerHi);
        const yLo = yScale(stats.whiskerLo);
        const top = Math.min(yQ1, yQ3);
        const bot = Math.max(yQ1, yQ3);

        parent.append('line')
            .attr('x1', cx).attr('x2', cx)
            .attr('y1', yQ1).attr('y2', yHi)
            .attr('stroke', stroke).attr('stroke-width', 1);
        parent.append('line')
            .attr('x1', cx).attr('x2', cx)
            .attr('y1', yQ3).attr('y2', yLo)
            .attr('stroke', stroke).attr('stroke-width', 1);

        const capHalf = halfW * 0.7;
        if (capHalf > 0.5) {
            parent.append('line')
                .attr('x1', cx - capHalf).attr('x2', cx + capHalf)
                .attr('y1', yHi).attr('y2', yHi)
                .attr('stroke', stroke).attr('stroke-width', 1);
            parent.append('line')
                .attr('x1', cx - capHalf).attr('x2', cx + capHalf)
                .attr('y1', yLo).attr('y2', yLo)
                .attr('stroke', stroke).attr('stroke-width', 1);
        }

        parent.append('rect')
            .attr('x', cx - halfW).attr('y', top)
            .attr('width', halfW * 2).attr('height', Math.max(1, bot - top))
            .attr('fill', fill)
            .attr('stroke', stroke)
            .attr('stroke-width', 1);

        if (medianWidth > 0) {
            parent.append('line')
                .attr('x1', cx - halfW).attr('x2', cx + halfW)
                .attr('y1', yMed).attr('y2', yMed)
                .attr('stroke', medianColor)
                .attr('stroke-width', medianWidth);
        }
    }

    function drawBoxOverlayHorizontal(parent, opts) {
        const cy = opts.cy;
        const halfH = opts.halfH;
        const stats = opts.stats;
        const xScale = opts.xScale;
        const fill = opts.fill;
        const stroke = opts.stroke;
        const medianWidth = opts.medianWidth;
        const medianColor = opts.medianColor;
        if (!stats) return;

        const xQ1 = xScale(stats.q1);
        const xQ3 = xScale(stats.q3);
        const xMed = xScale(stats.median);
        const xHi = xScale(stats.whiskerHi);
        const xLo = xScale(stats.whiskerLo);
        const left = Math.min(xQ1, xQ3);
        const right = Math.max(xQ1, xQ3);

        parent.append('line')
            .attr('x1', xQ3).attr('x2', xHi)
            .attr('y1', cy).attr('y2', cy)
            .attr('stroke', stroke).attr('stroke-width', 1);
        parent.append('line')
            .attr('x1', xQ1).attr('x2', xLo)
            .attr('y1', cy).attr('y2', cy)
            .attr('stroke', stroke).attr('stroke-width', 1);

        const capHalf = halfH * 0.7;
        if (capHalf > 0.5) {
            parent.append('line')
                .attr('x1', xHi).attr('x2', xHi)
                .attr('y1', cy - capHalf).attr('y2', cy + capHalf)
                .attr('stroke', stroke).attr('stroke-width', 1);
            parent.append('line')
                .attr('x1', xLo).attr('x2', xLo)
                .attr('y1', cy - capHalf).attr('y2', cy + capHalf)
                .attr('stroke', stroke).attr('stroke-width', 1);
        }

        parent.append('rect')
            .attr('x', left).attr('y', cy - halfH)
            .attr('width', Math.max(1, right - left)).attr('height', halfH * 2)
            .attr('fill', fill)
            .attr('stroke', stroke)
            .attr('stroke-width', 1);

        if (medianWidth > 0) {
            parent.append('line')
                .attr('x1', xMed).attr('x2', xMed)
                .attr('y1', cy - halfH).attr('y2', cy + halfH)
                .attr('stroke', medianColor)
                .attr('stroke-width', medianWidth);
        }
    }

    global.BoxCommon = {
        defaultBoxSettings: defaultBoxSettings,
        renderBoxPanel: renderBoxPanel,
        readBoxSettings: readBoxSettings,
        computeBoxStats: computeBoxStats,
        drawBox: drawBox,
        drawBoxHorizontal: drawBoxHorizontal,

        defaultViolinSettings: defaultViolinSettings,
        renderViolinPanel: renderViolinPanel,
        readViolinSettings: readViolinSettings,
        computeKDE: computeKDE,
        drawViolin: drawViolin,
        drawViolinHorizontal: drawViolinHorizontal,

        L: L
    };
})(window);
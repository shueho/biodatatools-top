(function (global) {
    'use strict';

    const PC = global.PlotCommon;

    function isEn() { return window.location.pathname.indexOf('/en/') >= 0; }

    const I18N = {
        zh: {
            linePanelTitle: '折线设置',
            lineWidth: '线宽',
            lineDash: '线型',
            dashSolid: '实线',
            dashDashed: '虚线',
            dashDotted: '点线',
            smooth: '平滑曲线',
            smoothTension: '平滑度',
            continuousX: 'X 轴连续刻度',
            continuousXTip: '（数值型 X 轴可勾选）',
            xDomainAuto: '自动生成轴范围',
            xDomainMin: '最小',
            xDomainMax: '最大',
            xTickAuto: '自动生成刻度值',
            xTickCustom: '自定义刻度',
            xTickCustomTip: '逗号分隔，如 0,5,10',
            xTickAutoPlaceholder: '（自动）',
            showPoints: '显示数据点',
            pointShape: '点形状',
            pointSize: '点大小',
            pointStrokeWidth: '点描边',
            pointColorMode: '点颜色',
            colorSameAsLine: '与线条同色',
            colorCustom: '统一颜色',
            pointColor: '点颜色',
            pointAlpha: '点透明度',
            showErrorBar: '显示误差棒',
            showErrorBarTip: '（仅对同 X 同分组有重复值的点生效）',
            errType: '误差类型',
            errTypeSD: '标准差 (SD)',
            errTypeSEM: '标准误 (SEM)',
            errColorMode: '误差棒颜色',
            errColor: '统一颜色',
            errWidth: '误差棒线宽',
            errCapWidth: '误差棒帽宽'
        },
        en: {
            linePanelTitle: 'Line Settings',
            lineWidth: 'Line width',
            lineDash: 'Line style',
            dashSolid: 'Solid',
            dashDashed: 'Dashed',
            dashDotted: 'Dotted',
            smooth: 'Smooth curve',
            smoothTension: 'Tension',
            continuousX: 'Continuous X axis',
            continuousXTip: '(available for numeric X)',
            xDomainAuto: 'Auto axis range',
            xDomainMin: 'Min',
            xDomainMax: 'Max',
            xTickAuto: 'Auto tick values',
            xTickCustom: 'Custom ticks',
            xTickCustomTip: 'Comma-separated, e.g. 0,5,10',
            xTickAutoPlaceholder: '(auto)',
            showPoints: 'Show points',
            pointShape: 'Point shape',
            pointSize: 'Point size',
            pointStrokeWidth: 'Point stroke',
            pointColorMode: 'Point color',
            colorSameAsLine: 'Same as line',
            colorCustom: 'Custom',
            pointColor: 'Point color',
            pointAlpha: 'Point alpha',
            showErrorBar: 'Show error bars',
            showErrorBarTip: '(only for points with replicated values)',
            errType: 'Error type',
            errTypeSD: 'SD',
            errTypeSEM: 'SEM',
            errColorMode: 'Error bar color',
            errColor: 'Custom color',
            errWidth: 'Error bar width',
            errCapWidth: 'Error bar cap'
        }
    };
    function L() { return I18N[isEn() ? 'en' : 'zh']; }

    function defaultLineSettings() {
        return {
            lineWidth: 2,
            lineDash: 'solid',
            smooth: false,
            smoothTension: 0.5,
            continuousX: false,
            xDomainAuto: true,
            xDomainMin: 0,
            xDomainMax: 10,
            xTickAuto: true,
            xTickCustom: '',
            showPoints: true,
            pointShape: 'circle',
            pointSize: 5,
            pointStrokeWidth: 1,
            pointColorMode: 'sameAsLine',
            pointColor: '#ffffff',
            pointAlpha: 0.9,
            showErrorBar: false,
            errType: 'sd',
            errColorMode: 'sameAsLine',
            errColor: '#333333',
            errWidth: 2,
            errCapWidth: 8
        };
    }

    function shapeOptionsHTML(current) {
        if (global.PlotShapes && global.PlotShapes.SHAPES) {
            const lang = isEn() ? 'en' : 'zh';
            return global.PlotShapes.SHAPES.map(function (s) {
                return '<option value="' + s.id + '"' +
                    (s.id === current ? ' selected' : '') + '>' +
                    (s[lang] || s.zh) + '</option>';
            }).join('');
        }
        const list = [
            ['circle', 'Circle'], ['square', 'Square'],
            ['triangle', 'Triangle'], ['diamond', 'Diamond']
        ];
        return list.map(function (p) {
            return '<option value="' + p[0] + '"' +
                (p[0] === current ? ' selected' : '') + '>' + p[1] + '</option>';
        }).join('');
    }

    function renderLinePanel(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;

        const T = L();
        const st = Object.assign(defaultLineSettings(), opts.state || {});
        const xIsNumeric = opts.xIsNumeric !== false;
        const xRange = opts.xRange || [0, 10];

        container.className = 'param-panel';
        container._settings = st;
        container._xIsNumeric = xIsNumeric;
        container._xRange = xRange;

        if (!xIsNumeric) st.continuousX = false;

        const smoothTensionStyle = st.smooth ? '' : 'display:none;';
        const customColorStyle = (st.pointColorMode === 'custom') ? '' : 'display:none;';
        const continuousItemStyle = xIsNumeric ? '' : 'display:none;';
        const continuousBodyStyle = (xIsNumeric && st.continuousX) ? '' : 'display:none;';

        const domAutoDisabled = st.xDomainAuto ? 'disabled' : '';
        const domMinVal = st.xDomainAuto ? xRange[0] : st.xDomainMin;
        const domMaxVal = st.xDomainAuto ? xRange[1] : st.xDomainMax;

        const tickAutoDisabled = st.xTickAuto ? 'disabled' : '';
        const tickVal = st.xTickAuto ? '' : st.xTickCustom;
        const tickPlaceholder = st.xTickAuto ? T.xTickAutoPlaceholder : T.xTickCustomTip;

        const pointBodyStyle = st.showPoints ? '' : 'display:none;';
        const errBodyStyle = st.showErrorBar ? '' : 'display:none;';
        const errColorStyle = (st.errColorMode === 'custom') ? '' : 'display:none;';

        container.innerHTML = `
            <div class="param-panel-title">${T.linePanelTitle}</div>

            <div class="param-grid cols-4">
                <div class="param-item"><label>${T.lineWidth}</label>
                    <input type="number" class="ln-width" value="${st.lineWidth}" min="0.5" max="8" step="0.5"></div>
                <div class="param-item"><label>${T.lineDash}</label>
                    <select class="ln-dash">
                        <option value="solid" ${st.lineDash === 'solid' ? 'selected' : ''}>${T.dashSolid}</option>
                        <option value="dashed" ${st.lineDash === 'dashed' ? 'selected' : ''}>${T.dashDashed}</option>
                        <option value="dotted" ${st.lineDash === 'dotted' ? 'selected' : ''}>${T.dashDotted}</option>
                    </select></div>
                <div class="param-item"><label class="mini-check"><input type="checkbox" class="ln-smooth" ${st.smooth ? 'checked' : ''}>${T.smooth}</label></div>
                <div class="param-item ln-tension-item" style="${smoothTensionStyle}">
                    <label>${T.smoothTension}</label>
                    <input type="number" class="ln-tension" value="${st.smoothTension}" min="0" max="1" step="0.05"></div>
                <div class="param-item ln-continuous-item" style="${continuousItemStyle}">
                    <label class="mini-check"><input type="checkbox" class="ln-continuous" ${st.continuousX ? 'checked' : ''}>${T.continuousX}</label>
                    <span style="font-size:11px;color:#999;margin-left:4px;">${T.continuousXTip}</span></div>
            </div>

            <div class="ln-continuous-body" style="${continuousBodyStyle}">
                <div class="param-grid cols-4" style="margin-top:8px;">
                    <div class="param-item">
                        <label class="mini-check"><input type="checkbox" class="ln-x-dom-auto" ${st.xDomainAuto ? 'checked' : ''}>${T.xDomainAuto}</label>
                    </div>
                    <div class="param-item">
                        <label>${T.xDomainMin}</label>
                        <input type="number" class="ln-x-dom-min" value="${domMinVal}" step="any" ${domAutoDisabled}>
                    </div>
                    <div class="param-item">
                        <label>${T.xDomainMax}</label>
                        <input type="number" class="ln-x-dom-max" value="${domMaxVal}" step="any" ${domAutoDisabled}>
                    </div>
                </div>
                <div class="param-grid cols-4" style="margin-top:8px;">
                    <div class="param-item">
                        <label class="mini-check"><input type="checkbox" class="ln-x-tick-auto" ${st.xTickAuto ? 'checked' : ''}>${T.xTickAuto}</label>
                    </div>
                    <div class="param-item" style="grid-column: span 3;">
                        <label>${T.xTickCustom}</label>
                        <input type="text" class="ln-x-tick-custom" value="${tickVal}" placeholder="${tickPlaceholder}" style="width:100%;" ${tickAutoDisabled}>
                    </div>
                </div>
            </div>

            <div class="param-inline" style="margin-top:8px;">
                <label class="mini-check"><input type="checkbox" class="ln-show-points" ${st.showPoints ? 'checked' : ''}>${T.showPoints}</label>
                <label class="mini-check"><input type="checkbox" class="ln-show-err" ${st.showErrorBar ? 'checked' : ''}>${T.showErrorBar}</label>
                <span style="font-size:11px;color:#999;">${T.showErrorBarTip}</span>
            </div>

            <div class="ln-point-body" style="${pointBodyStyle}">
                <div class="param-grid cols-4" style="margin-top:8px;">
                    <div class="param-item"><label>${T.pointShape}</label>
                        <select class="ln-point-shape">${shapeOptionsHTML(st.pointShape)}</select></div>
                    <div class="param-item"><label>${T.pointSize}</label>
                        <input type="number" class="ln-point-size" value="${st.pointSize}" min="1" max="20" step="0.5"></div>
                    <div class="param-item"><label>${T.pointStrokeWidth}</label>
                        <input type="number" class="ln-point-stroke-w" value="${st.pointStrokeWidth}" min="0" max="4" step="0.5"></div>
                    <div class="param-item"><label>${T.pointColorMode}</label>
                        <select class="ln-point-color-mode">
                            <option value="sameAsLine" ${st.pointColorMode === 'sameAsLine' ? 'selected' : ''}>${T.colorSameAsLine}</option>
                            <option value="custom" ${st.pointColorMode === 'custom' ? 'selected' : ''}>${T.colorCustom}</option>
                        </select></div>
                    <div class="param-item ln-point-color-item" style="${customColorStyle}">
                        <label>${T.pointColor}</label>
                        <input type="color" class="ln-point-color" value="${st.pointColor}"></div>
                    <div class="param-item"><label>${T.pointAlpha}</label>
                        <input type="number" class="ln-point-alpha" value="${st.pointAlpha}" min="0" max="1" step="0.05"></div>
                </div>
            </div>

            <div class="ln-err-body" style="${errBodyStyle}">
                <div class="param-grid cols-4" style="margin-top:8px;">
                    <div class="param-item"><label>${T.errType}</label>
                        <select class="ln-err-type">
                            <option value="sd" ${st.errType === 'sd' ? 'selected' : ''}>${T.errTypeSD}</option>
                            <option value="sem" ${st.errType === 'sem' ? 'selected' : ''}>${T.errTypeSEM}</option>
                        </select></div>
                    <div class="param-item"><label>${T.errColorMode}</label>
                        <select class="ln-err-color-mode">
                            <option value="sameAsLine" ${st.errColorMode === 'sameAsLine' ? 'selected' : ''}>${T.colorSameAsLine}</option>
                            <option value="custom" ${st.errColorMode === 'custom' ? 'selected' : ''}>${T.errColor}</option>
                        </select></div>
                    <div class="param-item ln-err-color-item" style="${errColorStyle}">
                        <label>${T.errColor}</label>
                        <input type="color" class="ln-err-color" value="${st.errColor}"></div>
                    <div class="param-item"><label>${T.errWidth}</label>
                        <input type="number" class="ln-err-width" value="${st.errWidth}" min="0.5" max="6" step="0.5"></div>
                    <div class="param-item"><label>${T.errCapWidth}</label>
                        <input type="number" class="ln-err-cap" value="${st.errCapWidth}" min="0" max="30" step="1"></div>
                </div>
            </div>
        `;

        const fire = function () { opts.onChange && opts.onChange(); };

        const smoothCb = container.querySelector('.ln-smooth');
        const tensionItem = container.querySelector('.ln-tension-item');
        const continuousCb = container.querySelector('.ln-continuous');
        const continuousBody = container.querySelector('.ln-continuous-body');
        const xDomAutoCb = container.querySelector('.ln-x-dom-auto');
        const xDomMinInput = container.querySelector('.ln-x-dom-min');
        const xDomMaxInput = container.querySelector('.ln-x-dom-max');
        const xTickAutoCb = container.querySelector('.ln-x-tick-auto');
        const xTickInput = container.querySelector('.ln-x-tick-custom');
        const showPointsCb = container.querySelector('.ln-show-points');
        const showErrCb = container.querySelector('.ln-show-err');
        const pointBody = container.querySelector('.ln-point-body');
        const errBody = container.querySelector('.ln-err-body');
        const pointColorModeSel = container.querySelector('.ln-point-color-mode');
        const pointColorItem = container.querySelector('.ln-point-color-item');
        const errColorModeSel = container.querySelector('.ln-err-color-mode');
        const errColorItem = container.querySelector('.ln-err-color-item');

        smoothCb.addEventListener('change', function () {
            tensionItem.style.display = smoothCb.checked ? '' : 'none';
            fire();
        });
        continuousCb.addEventListener('change', function () {
            continuousBody.style.display = continuousCb.checked ? '' : 'none';
            fire();
        });
        xDomAutoCb.addEventListener('change', function () {
            const isAuto = xDomAutoCb.checked;
            xDomMinInput.disabled = isAuto;
            xDomMaxInput.disabled = isAuto;
            if (isAuto) {
                xDomMinInput.value = xRange[0];
                xDomMaxInput.value = xRange[1];
            }
            fire();
        });
        xTickAutoCb.addEventListener('change', function () {
            const isAuto = xTickAutoCb.checked;
            xTickInput.disabled = isAuto;
            if (isAuto) {
                xTickInput.value = '';
                xTickInput.placeholder = T.xTickAutoPlaceholder;
            } else {
                xTickInput.placeholder = T.xTickCustomTip;
            }
            fire();
        });
        showPointsCb.addEventListener('change', function () {
            pointBody.style.display = showPointsCb.checked ? '' : 'none';
            fire();
        });
        showErrCb.addEventListener('change', function () {
            errBody.style.display = showErrCb.checked ? '' : 'none';
            fire();
        });
        pointColorModeSel.addEventListener('change', function () {
            pointColorItem.style.display = pointColorModeSel.value === 'custom' ? '' : 'none';
            fire();
        });
        errColorModeSel.addEventListener('change', function () {
            errColorItem.style.display = errColorModeSel.value === 'custom' ? '' : 'none';
            fire();
        });

        container.querySelectorAll('input, select').forEach(function (el) {
            if (el === smoothCb || el === showPointsCb || el === showErrCb
                || el === pointColorModeSel || el === errColorModeSel
                || el === continuousCb || el === xDomAutoCb || el === xTickAutoCb) return;
            el.addEventListener('change', fire);
        });
    }

    function readLineSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return defaultLineSettings();
        const st = container._settings || defaultLineSettings();
        const xRange = container._xRange || [0, 10];
        const qv = function (s) { const e = container.querySelector(s); return e ? e.value : undefined; };
        const qc = function (s) { const e = container.querySelector(s); return e ? e.checked : false; };
        const qn = function (s, fb) {
            const e = container.querySelector(s);
            if (!e) return fb;
            const v = parseFloat(e.value);
            return isFinite(v) ? v : fb;
        };
        st.lineWidth = Math.max(0.5, qn('.ln-width', 2));
        st.lineDash = qv('.ln-dash') || 'solid';
        st.smooth = qc('.ln-smooth');
        st.smoothTension = Math.max(0, Math.min(1, qn('.ln-tension', 0.5)));

        const continuousEl = container.querySelector('.ln-continuous');
        if (continuousEl && container._xIsNumeric !== false) {
            st.continuousX = continuousEl.checked;
        } else {
            st.continuousX = false;
        }

        st.xDomainAuto = qc('.ln-x-dom-auto');
        if (st.xDomainAuto) {
            st.xDomainMin = xRange[0];
            st.xDomainMax = xRange[1];
        } else {
            st.xDomainMin = qn('.ln-x-dom-min', xRange[0]);
            st.xDomainMax = qn('.ln-x-dom-max', xRange[1]);
        }
        st.xTickAuto = qc('.ln-x-tick-auto');
        st.xTickCustom = st.xTickAuto ? '' : (qv('.ln-x-tick-custom') || '');

        st.showPoints = qc('.ln-show-points');
        st.pointShape = qv('.ln-point-shape') || 'circle';
        st.pointSize = Math.max(1, qn('.ln-point-size', 5));
        st.pointStrokeWidth = Math.max(0, qn('.ln-point-stroke-w', 1));
        st.pointColorMode = qv('.ln-point-color-mode') || 'sameAsLine';
        st.pointColor = qv('.ln-point-color') || '#ffffff';
        st.pointAlpha = Math.max(0, Math.min(1, qn('.ln-point-alpha', 0.9)));

        st.showErrorBar = qc('.ln-show-err');
        st.errType = qv('.ln-err-type') || 'sd';
        st.errColorMode = qv('.ln-err-color-mode') || 'sameAsLine';
        st.errColor = qv('.ln-err-color') || '#333333';
        st.errWidth = Math.max(0.5, qn('.ln-err-width', 2));
        st.errCapWidth = Math.max(0, qn('.ln-err-cap', 8));
        return st;
    }

    function buildLineData(app) {
        const s = app.state;
        const xKey = s.roles.x;
        const yKey = s.roles.y;
        const gKey = s.roles.group;
        if (!xKey || !yKey) {
            return { series: [], xValues: [], groupValues: [], isNumericX: false };
        }

        const map = new Map();
        const xSeen = new Set();
        const gSeen = new Set();
        const xValuesRaw = [];
        const groupValues = [];
        let allNumeric = true;
        let hasAny = false;

        s.data.forEach(function (row) {
            const xRaw = row[xKey];
            const yRaw = parseFloat(row[yKey]);
            if (xRaw == null || xRaw === '') return;
            if (!isFinite(yRaw)) return;
            hasAny = true;

            const x = String(xRaw);
            const g = gKey ? String(row[gKey] == null ? '' : row[gKey]) : '__all__';

            if (allNumeric) {
                const n = parseFloat(x);
                if (!isFinite(n)) allNumeric = false;
            }

            if (!xSeen.has(x)) { xSeen.add(x); xValuesRaw.push(x); }
            if (!gSeen.has(g)) { gSeen.add(g); groupValues.push(g); }

            const key = x + '\u0001' + g;
            if (!map.has(key)) map.set(key, { x: x, g: g, values: [] });
            map.get(key).values.push(yRaw);
        });

        if (!hasAny) allNumeric = false;

        let xValues;
        if (allNumeric) {
            xValues = xValuesRaw.slice().sort(function (a, b) {
                return parseFloat(a) - parseFloat(b);
            });
        } else {
            xValues = xValuesRaw.slice();
        }

        const series = groupValues.map(function (g) {
            const points = [];
            xValues.forEach(function (x) {
                const rec = map.get(x + '\u0001' + g);
                if (!rec) return;
                const vals = rec.values;
                const n = vals.length;
                let sum = 0;
                for (let i = 0; i < n; i++) sum += vals[i];
                const mean = sum / n;
                let sd = 0;
                if (n > 1) {
                    let ss = 0;
                    for (let i = 0; i < n; i++) {
                        const d = vals[i] - mean;
                        ss += d * d;
                    }
                    sd = Math.sqrt(ss / (n - 1));
                }
                const sem = n > 1 ? sd / Math.sqrt(n) : 0;
                points.push({
                    x: x,
                    y: mean,
                    n: n,
                    sd: sd,
                    sem: sem
                });
            });
            return { g: g, points: points };
        });

        return { series: series, xValues: xValues, groupValues: groupValues, isNumericX: allNumeric };
    }

    function dashArrayOf(dash) {
        if (dash === 'dashed') return '8 5';
        if (dash === 'dotted') return '2 4';
        return null;
    }

    function drawErrorBarVertical(parent, cx, yTop, yBot, errColor, errWidth, capHalf) {
        parent.append('line')
            .attr('x1', cx).attr('x2', cx)
            .attr('y1', yTop).attr('y2', yBot)
            .attr('stroke', errColor)
            .attr('stroke-width', errWidth)
            .attr('stroke-linecap', 'round');
        if (capHalf > 0.5) {
            parent.append('line')
                .attr('x1', cx - capHalf).attr('x2', cx + capHalf)
                .attr('y1', yTop).attr('y2', yTop)
                .attr('stroke', errColor)
                .attr('stroke-width', errWidth)
                .attr('stroke-linecap', 'round');
            parent.append('line')
                .attr('x1', cx - capHalf).attr('x2', cx + capHalf)
                .attr('y1', yBot).attr('y2', yBot)
                .attr('stroke', errColor)
                .attr('stroke-width', errWidth)
                .attr('stroke-linecap', 'round');
        }
    }

    function drawErrorBarHorizontal(parent, cy, xLeft, xRight, errColor, errWidth, capHalf) {
        parent.append('line')
            .attr('x1', xLeft).attr('x2', xRight)
            .attr('y1', cy).attr('y2', cy)
            .attr('stroke', errColor)
            .attr('stroke-width', errWidth)
            .attr('stroke-linecap', 'round');
        if (capHalf > 0.5) {
            parent.append('line')
                .attr('x1', xLeft).attr('x2', xLeft)
                .attr('y1', cy - capHalf).attr('y2', cy + capHalf)
                .attr('stroke', errColor)
                .attr('stroke-width', errWidth)
                .attr('stroke-linecap', 'round');
            parent.append('line')
                .attr('x1', xRight).attr('x2', xRight)
                .attr('y1', cy - capHalf).attr('y2', cy + capHalf)
                .attr('stroke', errColor)
                .attr('stroke-width', errWidth)
                .attr('stroke-linecap', 'round');
        }
    }

    function parseTickList(str) {
        if (!str) return null;
        const arr = String(str).split(/[,，;\s]+/).map(function (s) {
            return parseFloat(s);
        }).filter(function (v) { return isFinite(v); });
        return arr.length ? arr : null;
    }

    function drawLineChart(app, prepared) {
        const s = app.state;
        const p = prepared.p;
        const axisCfg = prepared.axisCfg;
        const xValues = prepared.xValues;
        const groupValues = prepared.groupValues;
        const series = prepared.series;
        const colorOf = prepared.colorOf;
        const ls = prepared.lineSettings;
        const isNumericX = prepared.isNumericX;

        const isH = (s.barDirection === 'horizontal');
        const useLinearX = !!ls.continuousX && !!isNumericX;

        let vMin = Infinity, vMax = -Infinity;
        series.forEach(function (sr) {
            sr.points.forEach(function (pt) {
                if (pt.y < vMin) vMin = pt.y;
                if (pt.y > vMax) vMax = pt.y;
                if (ls.showErrorBar && pt.n > 1) {
                    const err = (ls.errType === 'sem') ? pt.sem : pt.sd;
                    if (pt.y - err < vMin) vMin = pt.y - err;
                    if (pt.y + err > vMax) vMax = pt.y + err;
                }
            });
        });
        if (!isFinite(vMin)) { vMin = 0; vMax = 1; }
        if (vMax === vMin) vMax = vMin + 1;

        const margin = 30;
        const areaX = margin, areaY = margin;
        const areaW = p.width - 2 * margin;
        const areaH = p.height - 2 * margin;

        const catAxisCfg = isH ? axisCfg.y : axisCfg.x;
        const valAxisCfg = isH ? axisCfg.x : axisCfg.y;

        const catTickFont = catAxisCfg.tickValueShow ? catAxisCfg.tickFontSize : 0;
        const catTitleFont = (catAxisCfg.titleShow && catAxisCfg.titleContent) ? catAxisCfg.titleFontSize + 8 : 0;
        const valTickFont = valAxisCfg.tickValueShow ? valAxisCfg.tickFontSize : 0;
        const valTitleFont = (valAxisCfg.titleShow && valAxisCfg.titleContent) ? valAxisCfg.titleFontSize + 8 : 0;

        let leftPad, bottomPad;
        if (isH) {
            let maxCatW = 0;
            xValues.forEach(function (v) {
                const w = PC.estTextWidth(v, catTickFont || 12);
                if (w > maxCatW) maxCatW = w;
            });
            const catSpace = Math.min(maxCatW + 12, areaW * 0.4);
            leftPad = catSpace + catTitleFont + 10;
            bottomPad = valTickFont + 12 + valTitleFont + 10;
        } else {
            leftPad = valTickFont + 10 + valTitleFont + 10;
            bottomPad = catTickFont + 12 + catTitleFont + 10;
        }
        const rightPad = 30;
        const topPad = 20;

        const plotX = areaX + leftPad;
        const plotY = areaY + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, areaH - topPad - bottomPad);

        const valDomain = PlotAxis.resolveDomain(valAxisCfg, [vMin, vMax]);

        let xScale, valScale;

        if (useLinearX) {
            let xMin = Infinity, xMax = -Infinity;
            xValues.forEach(function (v) {
                const n = parseFloat(v);
                if (n < xMin) xMin = n;
                if (n > xMax) xMax = n;
            });
            if (!isFinite(xMin)) { xMin = 0; xMax = 1; }
            if (xMax === xMin) xMax = xMin + 1;

            let xDomainUsed;
            if (!ls.xDomainAuto) {
                let dMin = ls.xDomainMin;
                let dMax = ls.xDomainMax;
                if (!isFinite(dMin) || !isFinite(dMax) || dMax <= dMin) {
                    dMin = xMin;
                    dMax = xMax;
                }
                xDomainUsed = [dMin, dMax];
            } else {
                const xPad = (xMax - xMin) * 0.05;
                xDomainUsed = [xMin - xPad, xMax + xPad];
            }

            if (isH) {
                xScale = d3.scaleLinear().domain(xDomainUsed).range([plotY, plotY + plotH]);
                valScale = d3.scaleLinear().domain(valDomain).range([plotX, plotX + plotW]).nice();
            } else {
                xScale = d3.scaleLinear().domain(xDomainUsed).range([plotX, plotX + plotW]);
                valScale = d3.scaleLinear().domain(valDomain).range([plotY + plotH, plotY]).nice();
            }
        } else {
            if (isH) {
                xScale = d3.scalePoint().domain(xValues).range([plotY, plotY + plotH]).padding(0.5);
                valScale = d3.scaleLinear().domain(valDomain).range([plotX, plotX + plotW]).nice();
            } else {
                xScale = d3.scalePoint().domain(xValues).range([plotX, plotX + plotW]).padding(0.5);
                valScale = d3.scaleLinear().domain(valDomain).range([plotY + plotH, plotY]).nice();
            }
        }

        function xPixOf(v) {
            if (useLinearX) return xScale(parseFloat(v));
            return xScale(v);
        }

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        if (valAxisCfg.gridShow) {
            const ticks = valScale.ticks ? valScale.ticks() : valScale.domain();
            const grid = svg.append('g').attr('class', 'grid grid-val');
            ticks.forEach(function (t) {
                const pos = Math.round(valScale(t)) + 0.5;
                if (!isFinite(pos)) return;
                const line = grid.append('line')
                    .attr('stroke', valAxisCfg.gridColor)
                    .attr('stroke-dasharray', valAxisCfg.gridDash)
                    .attr('stroke-width', 1);
                if (isH) {
                    line.attr('x1', pos).attr('x2', pos)
                        .attr('y1', plotY).attr('y2', plotY + plotH);
                } else {
                    line.attr('x1', plotX).attr('x2', plotX + plotW)
                        .attr('y1', pos).attr('y2', pos);
                }
            });
        }

        if (catAxisCfg.gridShow) {
            const grid = svg.append('g').attr('class', 'grid grid-cat');
            let positions = [];
            if (useLinearX) {
                const custom = !ls.xTickAuto ? parseTickList(ls.xTickCustom) : null;
                const ticks = custom || (xScale.ticks ? xScale.ticks() : xScale.domain());
                positions = ticks.map(function (t) { return xScale(t); });
            } else {
                positions = xValues.map(function (v) { return xScale(v); });
            }
            positions.forEach(function (pos) {
                if (!isFinite(pos)) return;
                const snapped = Math.round(pos) + 0.5;
                const line = grid.append('line')
                    .attr('stroke', catAxisCfg.gridColor)
                    .attr('stroke-dasharray', catAxisCfg.gridDash)
                    .attr('stroke-width', 1);
                if (isH) {
                    line.attr('x1', plotX).attr('x2', plotX + plotW)
                        .attr('y1', snapped).attr('y2', snapped);
                } else {
                    line.attr('x1', snapped).attr('x2', snapped)
                        .attr('y1', plotY).attr('y2', plotY + plotH);
                }
            });
        }

        const errG = svg.append('g').attr('class', 'line-error-bars');
        const lineG = svg.append('g').attr('class', 'line-series');
        const pointG = svg.append('g').attr('class', 'line-points');
        const dashArr = dashArrayOf(ls.lineDash);

        series.forEach(function (sr) {
            if (!sr.points.length) return;
            const color = colorOf(sr.g);

            const coords = sr.points.map(function (pt) {
                const xp = xPixOf(pt.x);
                const vp = valScale(pt.y);
                if (!isFinite(xp) || !isFinite(vp)) return null;
                return { pt: pt, x: xp, v: vp };
            }).filter(Boolean);

            if (!coords.length) return;

            if (ls.showErrorBar) {
                const errColor = (ls.errColorMode === 'custom') ? ls.errColor : color;
                const capHalf = ls.errCapWidth / 2;
                coords.forEach(function (c) {
                    const pt = c.pt;
                    if (!pt || pt.n <= 1) return;
                    const err = (ls.errType === 'sem') ? pt.sem : pt.sd;
                    if (!isFinite(err) || err <= 0) return;

                    if (isH) {
                        const vLow = valScale(pt.y - err);
                        const vHigh = valScale(pt.y + err);
                        if (!isFinite(vLow) || !isFinite(vHigh)) return;
                        drawErrorBarHorizontal(errG, c.x, Math.min(vLow, vHigh), Math.max(vLow, vHigh),
                            errColor, ls.errWidth, capHalf);
                    } else {
                        const vLow = valScale(pt.y - err);
                        const vHigh = valScale(pt.y + err);
                        if (!isFinite(vLow) || !isFinite(vHigh)) return;
                        drawErrorBarVertical(errG, c.x, Math.min(vLow, vHigh), Math.max(vLow, vHigh),
                            errColor, ls.errWidth, capHalf);
                    }
                });
            }

            const xyCoords = coords.map(function (c) {
                return isH ? [c.v, c.x] : [c.x, c.v];
            });

            let pathD;
            if (ls.smooth && xyCoords.length >= 3) {
                const lineGen = d3.line()
                    .x(function (d) { return d[0]; })
                    .y(function (d) { return d[1]; })
                    .curve(d3.curveCatmullRom.alpha(ls.smoothTension));
                pathD = lineGen(xyCoords);
            } else {
                pathD = xyCoords.map(function (c, i) {
                    return (i === 0 ? 'M' : 'L') + c[0] + ' ' + c[1];
                }).join(' ');
            }

            const pathEl = lineG.append('path')
                .attr('d', pathD)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', ls.lineWidth)
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round');
            if (dashArr) pathEl.attr('stroke-dasharray', dashArr);

            if (ls.showPoints) {
                const pointColor = (ls.pointColorMode === 'custom')
                    ? ls.pointColor
                    : color;
                xyCoords.forEach(function (c) {
                    const pShape = ls.pointShape;
                    if (global.PlotShapes && PlotShapes.buildSymbolPath) {
                        const pathData = PlotShapes.buildSymbolPath(pShape, ls.pointSize * Math.sqrt(3));
                        const pe = pointG.append('path')
                            .attr('d', pathData)
                            .attr('transform', 'translate(' + c[0] + ',' + c[1] + ')');
                        PlotShapes.applyShapeStyle(pe, pShape, pointColor, {
                            strokeWidth: ls.pointStrokeWidth
                        });
                        pe.attr('opacity', ls.pointAlpha);
                    } else {
                        pointG.append('circle')
                            .attr('cx', c[0]).attr('cy', c[1])
                            .attr('r', ls.pointSize / 2)
                            .attr('fill', pointColor)
                            .attr('opacity', ls.pointAlpha);
                    }
                });
            }
        });

        const catAxisFn = isH ? d3.axisLeft(xScale) : d3.axisBottom(xScale);
        if (useLinearX) {
            if (!ls.xTickAuto) {
                const custom = parseTickList(ls.xTickCustom);
                if (custom && custom.length) catAxisFn.tickValues(custom);
            }
        } else {
            catAxisFn.tickValues(xValues);
        }
        const catAxisG = svg.append('g').attr('class', isH ? 'y-axis' : 'x-axis');
        if (isH) {
            catAxisG.attr('transform', 'translate(' + plotX + ',0)').call(catAxisFn);
        } else {
            catAxisG.attr('transform', 'translate(0,' + (plotY + plotH) + ')').call(catAxisFn);
        }

        catAxisG.selectAll('.tick').attr('transform', d => {
            const pos = useLinearX
                ? Math.round(xScale(parseFloat(d))) + 0.5
                : Math.round(xScale(d)) + 0.5;
            return isH ? `translate(0,${pos})` : `translate(${pos},0)`;
        });

        PlotAxis.applyAxis(catAxisG, catAxisCfg, isH ? 'left' : 'bottom');

        const valAxisFn = isH ? d3.axisBottom(valScale) : d3.axisLeft(valScale);
        const valTickValues = PlotAxis.resolveTicks(valAxisCfg, valScale);
        if (valTickValues && valTickValues.length) valAxisFn.tickValues(valTickValues);
        const valAxisG = svg.append('g').attr('class', isH ? 'x-axis' : 'y-axis');
        if (isH) {
            valAxisG.attr('transform', 'translate(0,' + (plotY + plotH) + ')').call(valAxisFn);
        } else {
            valAxisG.attr('transform', 'translate(' + plotX + ',0)').call(valAxisFn);
        }

        valAxisG.selectAll('.tick').attr('transform', d => {
            const pos = Math.round(valScale(d)) + 0.5;
            return isH ? `translate(${pos},0)` : `translate(0,${pos})`;
        });

        PlotAxis.applyAxis(valAxisG, valAxisCfg, isH ? 'bottom' : 'left');

        if (catAxisCfg.titleShow && catAxisCfg.titleContent) {
            if (isH) {
                svg.append('text')
                    .attr('transform', 'translate(' + (plotX - leftPad + 12) + ',' + (plotY + plotH / 2) + ') rotate(-90)')
                    .attr('text-anchor', 'middle')
                    .attr('font-size', catAxisCfg.titleFontSize)
                    .attr('font-weight', catAxisCfg.titleBold ? 'bold' : 'normal')
                    .attr('font-style', catAxisCfg.titleItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(catAxisCfg.titleContent);
            } else {
                svg.append('text')
                    .attr('x', plotX + plotW / 2)
                    .attr('y', plotY + plotH + bottomPad - 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', catAxisCfg.titleFontSize)
                    .attr('font-weight', catAxisCfg.titleBold ? 'bold' : 'normal')
                    .attr('font-style', catAxisCfg.titleItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(catAxisCfg.titleContent);
            }
        }
        if (valAxisCfg.titleShow && valAxisCfg.titleContent) {
            if (isH) {
                svg.append('text')
                    .attr('x', plotX + plotW / 2)
                    .attr('y', plotY + plotH + bottomPad - 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', valAxisCfg.titleFontSize)
                    .attr('font-weight', valAxisCfg.titleBold ? 'bold' : 'normal')
                    .attr('font-style', valAxisCfg.titleItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(valAxisCfg.titleContent);
            } else {
                svg.append('text')
                    .attr('transform', 'translate(' + (plotX - leftPad + 12) + ',' + (plotY + plotH / 2) + ') rotate(-90)')
                    .attr('text-anchor', 'middle')
                    .attr('font-size', valAxisCfg.titleFontSize)
                    .attr('font-weight', valAxisCfg.titleBold ? 'bold' : 'normal')
                    .attr('font-style', valAxisCfg.titleItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(valAxisCfg.titleContent);
            }
        }

        PlotAxis.drawFrameAndRefLines(svg, {
            plotX: plotX, plotY: plotY, plotW: plotW, plotH: plotH,
            xScale: isH ? valScale : xScale,
            yScale: isH ? xScale : valScale,
            axisCfg: axisCfg
        });

        if (p.showLegend && groupValues.length && s.roles.group) {
            const baseShape = ls.lineDash === 'solid' ? 'line' : 'dashline';
            const legendShape = ls.showPoints
                ? (baseShape === 'line' ? 'linepoint' : 'dashlinepoint')
                : baseShape;
            PC.drawLegendOverlay(svg, {
                p: p,
                items: groupValues.map(function (g) { return { name: g, percent: null }; }),
                colors: groupValues.map(function (g) { return colorOf(g); }),
                shapeOf: function () { return legendShape; },
                pointShapeOf: function () { return ls.pointShape; },
                labelFormatter: function (it) { return it.name; }
            });
        }

        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    global.LineCommon = {
        defaultLineSettings: defaultLineSettings,
        renderLinePanel: renderLinePanel,
        readLineSettings: readLineSettings,
        buildLineData: buildLineData,
        drawLineChart: drawLineChart,
        L: L
    };
})(window);
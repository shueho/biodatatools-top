(function (global) {
    'use strict';

    const PC = global.PlotCommon;
    const SF = global.StatFitting;

    function isEn() { return window.location.pathname.indexOf('/en/') >= 0; }

    const I18N = {
        zh: {
            scatterTitle: '散点设置',
            pointShape: '形状',
            pointSize: '点大小',
            pointAlpha: '透明度',
            pointStrokeWidth: '描边宽度',
            pointStrokeColor: '描边色',
            fitTitle: '拟合设置',
            fitEnabled: '显示拟合曲线',
            fitMethod: '方法',
            fitLM: '线性回归 (lm)',
            fitGLM: '广义线性 (glm)',
            fitLOESS: '局部加权 (loess)',
            fitGAM: '广义可加 (gam)',
            fitByGroup: '按组分别拟合',
            fitDegree: '多项式次数',
            fitFamily: '分布族',
            fitGaussian: '高斯',
            fitPoisson: '泊松',
            fitBinomial: '二项',
            fitSpan: '平滑参数',
            fitKnots: '结点数',
            fitColor: '颜色',
            fitWidth: '线宽',
            fitDash: '虚线',
            fitShowStats: '显示拟合统计',
            fitExtend: '延伸比例',
            fitCI: '显示置信区间',
            fitCIAlpha: 'CI 透明度',
            fitCIOutline: 'CI 轮廓线',
            globalColorName: '散点'
        },
        en: {
            scatterTitle: 'Scatter Settings',
            pointShape: 'Shape',
            pointSize: 'Point size',
            pointAlpha: 'Alpha',
            pointStrokeWidth: 'Stroke width',
            pointStrokeColor: 'Stroke color',
            fitTitle: 'Fit Settings',
            fitEnabled: 'Show fit curve',
            fitMethod: 'Method',
            fitLM: 'Linear regression (lm)',
            fitGLM: 'Generalized linear (glm)',
            fitLOESS: 'Local regression (loess)',
            fitGAM: 'Generalized additive (gam)',
            fitByGroup: 'Fit per group',
            fitDegree: 'Polynomial degree',
            fitFamily: 'Family',
            fitGaussian: 'Gaussian',
            fitPoisson: 'Poisson',
            fitBinomial: 'Binomial',
            fitSpan: 'Span',
            fitKnots: 'Knots',
            fitColor: 'Color',
            fitWidth: 'Width',
            fitDash: 'Dashed',
            fitShowStats: 'Show fit statistics',
            fitExtend: 'Extend ratio',
            fitCI: 'Show confidence interval',
            fitCIAlpha: 'CI alpha',
            fitCIOutline: 'CI outline',
            globalColorName: 'Points'
        }
    };
    function L() { return I18N[isEn() ? 'en' : 'zh']; }

    function defaultScatterSettings() {
        return {
            pointShape: 'circle',
            pointSize: 5,
            pointAlpha: 0.85,
            pointStrokeWidth: 1,
            pointStrokeColor: '#ffffff'
        };
    }

    function defaultFitSettings() {
        return {
            fitEnabled: false,
            fitMethod: 'lm',
            fitDegree: 1,
            fitFamily: 'gaussian',
            fitSpan: 0.75,
            fitKnots: 5,
            fitByGroup: true,
            fitColor: '#333333',
            fitWidth: 2,
            fitDash: false,
            fitShowStats: true,
            fitExtend: 0,
            fitCI: false,
            fitCIAlpha: 0.18,
            fitCIOutline: true
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
            ['circle', 'Circle'],
            ['square', 'Square'],
            ['triangle', 'Triangle'],
            ['diamond', 'Diamond']
        ];
        return list.map(function (p) {
            return '<option value="' + p[0] + '"' +
                (p[0] === current ? ' selected' : '') + '>' + p[1] + '</option>';
        }).join('');
    }

    function renderScatterPanel(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;

        const T = L();
        const st = Object.assign(defaultScatterSettings(), opts.state || {});
        container.className = 'param-panel';
        container._settings = st;

        container.innerHTML = `
            <div class="param-panel-title">${T.scatterTitle}</div>
            <div class="param-grid cols-4">
                <div class="param-item"><label>${T.pointShape}</label>
                    <select class="sc-point-shape">${shapeOptionsHTML(st.pointShape)}</select></div>
                <div class="param-item"><label>${T.pointSize}</label>
                    <input type="number" class="sc-point-size" value="${st.pointSize}" min="1" max="30" step="0.5"></div>
                <div class="param-item"><label>${T.pointAlpha}</label>
                    <input type="number" class="sc-point-alpha" value="${st.pointAlpha}" min="0" max="1" step="0.05"></div>
                <div class="param-item"><label>${T.pointStrokeWidth}</label>
                    <input type="number" class="sc-point-stroke-w" value="${st.pointStrokeWidth}" min="0" max="4" step="0.5"></div>
                <div class="param-item"><label>${T.pointStrokeColor}</label>
                    <input type="color" class="sc-point-stroke-c" value="${st.pointStrokeColor}"></div>
            </div>
        `;

        const fire = function () { opts.onChange && opts.onChange(); };
        container.querySelectorAll('input, select').forEach(function (el) {
            el.addEventListener('change', fire);
        });
    }

    function readScatterSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return defaultScatterSettings();
        const st = container._settings || defaultScatterSettings();
        const qv = function (s) { const e = container.querySelector(s); return e ? e.value : undefined; };
        const qn = function (s, fb) {
            const e = container.querySelector(s);
            if (!e) return fb;
            const v = parseFloat(e.value);
            return isFinite(v) ? v : fb;
        };
        st.pointShape = qv('.sc-point-shape') || 'circle';
        st.pointSize = Math.max(1, qn('.sc-point-size', 5));
        st.pointAlpha = Math.max(0, Math.min(1, qn('.sc-point-alpha', 0.85)));
        st.pointStrokeWidth = Math.max(0, qn('.sc-point-stroke-w', 1));
        st.pointStrokeColor = qv('.sc-point-stroke-c') || '#ffffff';
        return st;
    }

    function renderFitPanel(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;

        const T = L();
        const st = Object.assign(defaultFitSettings(), opts.state || {});
        const hasGroup = opts.hasGroup !== false;
        if (!hasGroup) st.fitByGroup = false;

        container.className = 'param-panel';
        container._settings = st;

        const byGroupLabel = hasGroup
            ? '<label><input type="checkbox" class="ft-bygroup"' + (st.fitByGroup ? ' checked' : '') + '>' + T.fitByGroup + '</label>'
            : '';

        container.innerHTML = `
            <div class="param-panel-title">${T.fitTitle}</div>
            <div class="param-inline" style="margin-bottom:8px;">
                <label><input type="checkbox" class="ft-enable" ${st.fitEnabled ? 'checked' : ''}>${T.fitEnabled}</label>
                ${byGroupLabel}
            </div>
            <div class="ft-body" style="${st.fitEnabled ? '' : 'display:none;'}">
                <div class="param-grid cols-4">
                    <div class="param-item"><label>${T.fitMethod}</label>
                        <select class="ft-method">
                            <option value="lm" ${st.fitMethod === 'lm' ? 'selected' : ''}>${T.fitLM}</option>
                            <option value="glm" ${st.fitMethod === 'glm' ? 'selected' : ''}>${T.fitGLM}</option>
                            <option value="loess" ${st.fitMethod === 'loess' ? 'selected' : ''}>${T.fitLOESS}</option>
                            <option value="gam" ${st.fitMethod === 'gam' ? 'selected' : ''}>${T.fitGAM}</option>
                        </select></div>
                    <div class="param-item ft-degree-item" style="${st.fitMethod === 'lm' ? '' : 'display:none;'}">
                        <label>${T.fitDegree}</label>
                        <input type="number" class="ft-degree" value="${st.fitDegree}" min="1" max="6" step="1"></div>
                    <div class="param-item ft-family-item" style="${st.fitMethod === 'glm' ? '' : 'display:none;'}">
                        <label>${T.fitFamily}</label>
                        <select class="ft-family">
                            <option value="gaussian" ${st.fitFamily === 'gaussian' ? 'selected' : ''}>${T.fitGaussian}</option>
                            <option value="poisson" ${st.fitFamily === 'poisson' ? 'selected' : ''}>${T.fitPoisson}</option>
                            <option value="binomial" ${st.fitFamily === 'binomial' ? 'selected' : ''}>${T.fitBinomial}</option>
                        </select></div>
                    <div class="param-item ft-span-item" style="${st.fitMethod === 'loess' ? '' : 'display:none;'}">
                        <label>${T.fitSpan}</label>
                        <input type="number" class="ft-span" value="${st.fitSpan}" min="0.05" max="1" step="0.05"></div>
                    <div class="param-item ft-knots-item" style="${st.fitMethod === 'gam' ? '' : 'display:none;'}">
                        <label>${T.fitKnots}</label>
                        <input type="number" class="ft-knots" value="${st.fitKnots}" min="2" max="20" step="1"></div>
                    <div class="param-item"><label>${T.fitColor}</label>
                        <input type="color" class="ft-color" value="${st.fitColor}"></div>
                    <div class="param-item"><label>${T.fitWidth}</label>
                        <input type="number" class="ft-width" value="${st.fitWidth}" min="0.5" max="6" step="0.5"></div>
                    <div class="param-item"><label class="mini-check"><input type="checkbox" class="ft-dash" ${st.fitDash ? 'checked' : ''}>${T.fitDash}</label></div>
                    <div class="param-item"><label class="mini-check"><input type="checkbox" class="ft-showstats" ${st.fitShowStats ? 'checked' : ''}>${T.fitShowStats}</label></div>
                    <div class="param-item"><label>${T.fitExtend}</label>
                        <input type="number" class="ft-extend" value="${st.fitExtend}" min="0" max="1" step="0.05"></div>
                </div>
                <div class="param-inline" style="margin-top:8px;">
                    <label class="mini-check"><input type="checkbox" class="ft-ci" ${st.fitCI ? 'checked' : ''}>${T.fitCI}</label>
                    <label>${T.fitCIAlpha}
                        <input type="number" class="ft-ci-alpha" value="${st.fitCIAlpha}" min="0" max="1" step="0.02" style="width:70px;"></label>
                    <label class="mini-check"><input type="checkbox" class="ft-ci-outline" ${st.fitCIOutline ? 'checked' : ''}>${T.fitCIOutline}</label>
                </div>
            </div>
        `;

        const enableCb = container.querySelector('.ft-enable');
        const body = container.querySelector('.ft-body');
        const methodSel = container.querySelector('.ft-method');
        const degreeItem = container.querySelector('.ft-degree-item');
        const familyItem = container.querySelector('.ft-family-item');
        const spanItem = container.querySelector('.ft-span-item');
        const knotsItem = container.querySelector('.ft-knots-item');

        function updateMethodVis() {
            const m = methodSel.value;
            degreeItem.style.display = (m === 'lm') ? '' : 'none';
            familyItem.style.display = (m === 'glm') ? '' : 'none';
            spanItem.style.display = (m === 'loess') ? '' : 'none';
            knotsItem.style.display = (m === 'gam') ? '' : 'none';
        }

        enableCb.addEventListener('change', function () {
            body.style.display = enableCb.checked ? '' : 'none';
            opts.onChange && opts.onChange();
        });
        methodSel.addEventListener('change', function () {
            updateMethodVis();
            opts.onChange && opts.onChange();
        });
        updateMethodVis();

        container.querySelectorAll('input, select').forEach(function (el) {
            if (el === enableCb || el === methodSel) return;
            el.addEventListener('change', function () { opts.onChange && opts.onChange(); });
        });
    }

    function readFitSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return defaultFitSettings();
        const st = container._settings || defaultFitSettings();
        const qv = function (s) { const e = container.querySelector(s); return e ? e.value : undefined; };
        const qc = function (s) { const e = container.querySelector(s); return e ? e.checked : false; };
        const qn = function (s, fb) {
            const e = container.querySelector(s);
            if (!e) return fb;
            const v = parseFloat(e.value);
            return isFinite(v) ? v : fb;
        };
        st.fitEnabled = qc('.ft-enable');
        const byGroupEl = container.querySelector('.ft-bygroup');
        st.fitByGroup = byGroupEl ? byGroupEl.checked : false;
        st.fitMethod = qv('.ft-method') || 'lm';
        st.fitDegree = Math.max(1, Math.round(qn('.ft-degree', 1)));
        st.fitFamily = qv('.ft-family') || 'gaussian';
        st.fitSpan = Math.max(0.05, Math.min(1, qn('.ft-span', 0.75)));
        st.fitKnots = Math.max(2, Math.round(qn('.ft-knots', 5)));
        st.fitColor = qv('.ft-color') || '#333333';
        st.fitWidth = Math.max(0.5, qn('.ft-width', 2));
        st.fitDash = qc('.ft-dash');
        st.fitShowStats = qc('.ft-showstats');
        st.fitExtend = Math.max(0, Math.min(1, qn('.ft-extend', 0)));
        st.fitCI = qc('.ft-ci');
        st.fitCIAlpha = Math.max(0, Math.min(1, qn('.ft-ci-alpha', 0.18)));
        st.fitCIOutline = qc('.ft-ci-outline');
        return st;
    }

    function buildData(app) {
        const s = app.state;
        const xKey = s.roles.x;
        const yKey = s.roles.y;
        const gKey = s.roles.group;
        if (!xKey || !yKey) return [];
        const out = [];
        s.data.forEach(function (row) {
            const x = parseFloat(row[xKey]);
            const y = parseFloat(row[yKey]);
            if (!isFinite(x) || !isFinite(y)) return;
            const g = gKey ? String(row[gKey] == null ? '' : row[gKey]) : '';
            out.push({ x: x, y: y, g: g });
        });
        return out;
    }

    function groupData(data) {
        const map = new Map();
        data.forEach(function (d) {
            if (!map.has(d.g)) map.set(d.g, []);
            map.get(d.g).push(d);
        });
        return map;
    }

    function performFits(data, fitSettings) {
        const T = L();
        const st = fitSettings;
        const byGroup = st.fitByGroup;
        const result = [];
        if (!st.fitEnabled) return result;

        function runFit(subset, label) {
            const xs = subset.map(function (d) { return d.x; });
            const ys = subset.map(function (d) { return d.y; });
            const opts = {
                method: st.fitMethod,
                degree: st.fitDegree,
                family: st.fitFamily,
                span: st.fitSpan,
                knots: st.fitKnots
            };
            const fit = SF.fitCurve(xs, ys, opts);
            if (!fit) return;
            result.push({ label: label, fit: fit, data: subset, xs: xs, ys: ys });
        }

        if (byGroup) {
            const grouped = groupData(data);
            grouped.forEach(function (list, key) {
                if (list.length >= 3) runFit(list, key || T.globalColorName);
            });
        } else {
            if (data.length >= 3) runFit(data, '');
        }
        return result;
    }

    function formulaLines(fits, fitSettings, groupColorMap) {
        const st = fitSettings;
        if (!st.fitShowStats) return [];
        const lines = [];
        fits.forEach(function (f) {
            const fit = f.fit;
            const color = (st.fitByGroup && groupColorMap && groupColorMap[f.label]) || st.fitColor;
            const labelPrefix = (st.fitByGroup && f.label) ? f.label + ': ' : '';

            if (fit.type === 'lm') {
                const c = fit.coeffs;
                let eq = labelPrefix + 'y = ' + PC.fmtNum(c[0], 5);
                for (let i = 1; i < c.length; i++) {
                    const sign = c[i] >= 0 ? ' + ' : ' - ';
                    const absC = Math.abs(c[i]);
                    if (i === 1) eq += sign + PC.fmtNum(absC, 5) + 'x';
                    else eq += sign + PC.fmtNum(absC, 5) + 'x^' + i;
                }
                lines.push([
                    { text: eq, color: color },
                    { text: '  R² = ' + fit.r2.toFixed(5), color: color }
                ]);
            } else if (fit.type === 'glm') {
                if (fit.family === 'poisson') {
                    lines.push([{ text: labelPrefix + 'y = exp(' + PC.fmtNum(fit.coeffs[0], 5) + ' + ' + PC.fmtNum(fit.coeffs[1], 5) + 'x)', color: color }]);
                } else if (fit.family === 'binomial') {
                    lines.push([{ text: labelPrefix + 'logit(p) = ' + PC.fmtNum(fit.coeffs[0], 5) + ' + ' + PC.fmtNum(fit.coeffs[1], 5) + 'x', color: color }]);
                } else {
                    lines.push([{ text: labelPrefix + 'y = ' + PC.fmtNum(fit.coeffs[0], 5) + ' + ' + PC.fmtNum(fit.coeffs[1], 5) + 'x', color: color }]);
                }
            } else if (fit.type === 'loess') {
                lines.push([{ text: labelPrefix + 'loess (span=' + fit.span + ')', color: color }]);
            } else if (fit.type === 'gam') {
                lines.push([{ text: labelPrefix + 'gam (knots=' + fit.knots.length + ')', color: color }]);
            }
        });
        return lines;
    }

    function isHollowShape(shapeId) {
        if (global.PlotShapes && global.PlotShapes.isHollow) {
            return PlotShapes.isHollow(shapeId);
        }
        return /-hollow$/.test(String(shapeId || ''));
    }

    function drawScatterChart(app, prepared) {
        const s = app.state;
        const p = prepared.p;
        const axisCfg = prepared.axisCfg;
        const data = prepared.data;
        const groupKeys = prepared.groupKeys;
        const colorOf = prepared.colorOf;
        const sc = prepared.scatterSettings;
        const fitSettings = prepared.fitSettings;
        const fits = prepared.fits;
        const hollowShape = isHollowShape(sc.pointShape);

        let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
        data.forEach(function (d) {
            if (d.x < xMin) xMin = d.x;
            if (d.x > xMax) xMax = d.x;
            if (d.y < yMin) yMin = d.y;
            if (d.y > yMax) yMax = d.y;
        });
        if (!isFinite(xMin)) { xMin = 0; xMax = 1; }
        if (!isFinite(yMin)) { yMin = 0; yMax = 1; }
        if (xMax === xMin) xMax = xMin + 1;
        if (yMax === yMin) yMax = yMin + 1;

        const margin = 30;
        const areaX = margin, areaY = margin;
        const areaW = p.width - 2 * margin;
        const areaH = p.height - 2 * margin;

        const xLabelFont = axisCfg.x.tickValueShow ? axisCfg.x.tickFontSize : 0;
        const yLabelFont = axisCfg.y.tickValueShow ? axisCfg.y.tickFontSize : 0;
        const xTitleFont = (axisCfg.x.titleShow && axisCfg.x.titleContent) ? axisCfg.x.titleFontSize + 8 : 0;
        const yTitleFont = (axisCfg.y.titleShow && axisCfg.y.titleContent) ? axisCfg.y.titleFontSize + 8 : 0;

        const leftPad = yLabelFont + 10 + yTitleFont + 10;
        const bottomPad = xLabelFont + 12 + xTitleFont + 10;
        const rightPad = 30;
        const topPad = 20;

        const plotX = areaX + leftPad;
        const plotY = areaY + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, areaH - topPad - bottomPad);

        const xDomain = PlotAxis.resolveDomain(axisCfg.x, [xMin, xMax]);
        const yDomain = PlotAxis.resolveDomain(axisCfg.y, [yMin, yMax]);

        const xScale = d3.scaleLinear().domain(xDomain).range([plotX, plotX + plotW]).nice();
        const yScale = d3.scaleLinear().domain(yDomain).range([plotY + plotH, plotY]).nice();

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        if (axisCfg.y.gridShow) {
            const gridY = svg.append('g').attr('class', 'grid grid-y');
            const ticks = yScale.ticks ? yScale.ticks() : yScale.domain();
            ticks.forEach(function (t) {
                const y = Math.round(yScale(t)) + 0.5;
                if (!isFinite(y)) return;
                gridY.append('line')
                    .attr('x1', plotX).attr('x2', plotX + plotW)
                    .attr('y1', y).attr('y2', y)
                    .attr('stroke', axisCfg.y.gridColor)
                    .attr('stroke-dasharray', axisCfg.y.gridDash)
                    .attr('stroke-width', 1);
            });
        }
        if (axisCfg.x.gridShow) {
            const gridX = svg.append('g').attr('class', 'grid grid-x');
            const ticks = xScale.ticks ? xScale.ticks() : xScale.domain();
            ticks.forEach(function (t) {
                const x = Math.round(xScale(t)) + 0.5;
                if (!isFinite(x)) return;
                gridX.append('line')
                    .attr('x1', x).attr('x2', x)
                    .attr('y1', plotY).attr('y2', plotY + plotH)
                    .attr('stroke', axisCfg.x.gridColor)
                    .attr('stroke-dasharray', axisCfg.x.gridDash)
                    .attr('stroke-width', 1);
            });
        }

        if (fitSettings.fitEnabled && fits && fits.length) {
            const ciG = svg.append('g').attr('class', 'scatter-ci');
            const fitG = svg.append('g').attr('class', 'scatter-fits');

            fits.forEach(function (f) {
                const fit = f.fit;
                const color = (fitSettings.fitByGroup && f.label)
                    ? colorOf(f.label)
                    : fitSettings.fitColor;

                let dMin = Infinity, dMax = -Infinity;
                f.data.forEach(function (d) {
                    if (d.x < dMin) dMin = d.x;
                    if (d.x > dMax) dMax = d.x;
                });
                if (!isFinite(dMin)) return;
                const span = dMax - dMin;
                const xLo = dMin - span * fitSettings.fitExtend;
                const xHi = dMax + span * fitSettings.fitExtend;

                const pts = SF.sampleFitCurve(fit, xLo, xHi, 200);
                if (!pts.length) return;

                if (fitSettings.fitCI && SF.computeConfidenceBand) {
                    const xGrid = pts.map(function (pt) { return pt.x; });
                    const band = SF.computeConfidenceBand(fit, f.xs, f.ys, xGrid, 0.95);
                    if (band.length) {
                        let d = '';
                        let started = false;
                        band.forEach(function (b) {
                            if (!isFinite(b.hi)) return;
                            const px = xScale(b.x);
                            const py = yScale(b.hi);
                            d += (started ? 'L' : 'M') + px + ' ' + py + ' ';
                            started = true;
                        });
                        for (let i = band.length - 1; i >= 0; i--) {
                            const b = band[i];
                            if (!isFinite(b.lo)) continue;
                            d += 'L' + xScale(b.x) + ' ' + yScale(b.lo) + ' ';
                        }
                        if (started) {
                            d += 'Z';
                            ciG.append('path')
                                .attr('d', d)
                                .attr('fill', color)
                                .attr('fill-opacity', fitSettings.fitCIAlpha)
                                .attr('stroke', 'none');
                        }
                        if (fitSettings.fitCIOutline) {
                            let up = '', lo = '';
                            let startedUp = false, startedLo = false;
                            band.forEach(function (b) {
                                if (isFinite(b.hi)) {
                                    up += (startedUp ? 'L' : 'M') + xScale(b.x) + ' ' + yScale(b.hi) + ' ';
                                    startedUp = true;
                                }
                                if (isFinite(b.lo)) {
                                    lo += (startedLo ? 'L' : 'M') + xScale(b.x) + ' ' + yScale(b.lo) + ' ';
                                    startedLo = true;
                                }
                            });
                            if (startedUp) {
                                ciG.append('path')
                                    .attr('d', up)
                                    .attr('fill', 'none')
                                    .attr('stroke', color)
                                    .attr('stroke-width', 0.8)
                                    .attr('stroke-opacity', 0.7);
                            }
                            if (startedLo) {
                                ciG.append('path')
                                    .attr('d', lo)
                                    .attr('fill', 'none')
                                    .attr('stroke', color)
                                    .attr('stroke-width', 0.8)
                                    .attr('stroke-opacity', 0.7);
                            }
                        }
                    }
                }

                let path = '';
                pts.forEach(function (pt, i) {
                    const px = xScale(pt.x);
                    const py = yScale(pt.y);
                    path += (i === 0 ? 'M' : 'L') + px + ' ' + py + ' ';
                });
                const el = fitG.append('path')
                    .attr('d', path)
                    .attr('fill', 'none')
                    .attr('stroke', color)
                    .attr('stroke-width', fitSettings.fitWidth);
                if (fitSettings.fitDash) el.attr('stroke-dasharray', '8 5');
            });
        }

        const pointsG = svg.append('g').attr('class', 'scatter-points');
        data.forEach(function (d) {
            const px = xScale(d.x);
            const py = yScale(d.y);
            const color = d.g ? colorOf(d.g) : prepared.globalColor;

            let symPath;
            if (global.PlotShapes && PlotShapes.buildSymbolPath) {
                symPath = PlotShapes.buildSymbolPath(sc.pointShape, sc.pointSize * Math.sqrt(3));
            } else {
                symPath = d3.symbol().type(d3.symbolCircle).size(sc.pointSize * sc.pointSize * 3)();
            }

            const el = pointsG.append('path')
                .attr('d', symPath)
                .attr('transform', 'translate(' + px + ',' + py + ')');

            if (global.PlotShapes && PlotShapes.applyShapeStyle) {
                if (hollowShape) {
                    PlotShapes.applyShapeStyle(el, sc.pointShape, color, {
                        strokeWidth: Math.max(1, sc.pointStrokeWidth)
                    });
                } else {
                    PlotShapes.applyShapeStyle(el, sc.pointShape, color, {
                        stroke: sc.pointStrokeWidth > 0 ? sc.pointStrokeColor : 'none',
                        strokeWidth: sc.pointStrokeWidth
                    });
                }
            } else {
                el.attr('fill', color);
                if (!hollowShape && sc.pointStrokeWidth > 0) {
                    el.attr('stroke', sc.pointStrokeColor).attr('stroke-width', sc.pointStrokeWidth);
                }
            }
            el.attr('opacity', sc.pointAlpha);
        });

        const xTicks = PlotAxis.resolveTicks(axisCfg.x, xScale);
        let xTickValues = xTicks;
        if (!xTickValues) xTickValues = xScale.ticks ? xScale.ticks() : null;
        const xAxisFn = d3.axisBottom(xScale);
        if (xTickValues && xTickValues.length) xAxisFn.tickValues(xTickValues);
        const xAxisG = svg.append('g').attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + (plotY + plotH) + ')')
            .call(xAxisFn);

        xAxisG.selectAll('.tick').attr('transform', d => {
            const x = Math.round(xScale(d)) + 0.5;
            return `translate(${x},0)`;
        });

        PlotAxis.applyAxis(xAxisG, axisCfg.x, 'bottom');

        const yTicks = PlotAxis.resolveTicks(axisCfg.y, yScale);
        let yTickValues = yTicks;
        if (!yTickValues) yTickValues = yScale.ticks ? yScale.ticks() : null;
        const yAxisFn = d3.axisLeft(yScale);
        if (yTickValues && yTickValues.length) yAxisFn.tickValues(yTickValues);
        const yAxisG = svg.append('g').attr('class', 'y-axis')
            .attr('transform', 'translate(' + plotX + ',0)')
            .call(yAxisFn);

        yAxisG.selectAll('.tick').attr('transform', d => {
            const y = Math.round(yScale(d)) + 0.5;
            return `translate(0,${y})`;
        });

        PlotAxis.applyAxis(yAxisG, axisCfg.y, 'left');

        BarCommon.drawAxisTitles(svg, axisCfg, plotX, plotY, plotW, plotH, leftPad, bottomPad);

        PlotAxis.drawFrameAndRefLines(svg, {
            plotX, plotY, plotW, plotH,
            xScale: xScale,
            yScale: yScale,
            axisCfg: axisCfg
        });

        if (p.showLegend && groupKeys.length && s.roles.group) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: groupKeys.map(function (g) { return { name: g, percent: null }; }),
                colors: groupKeys.map(function (g) { return colorOf(g); }),
                shapeOf: function () { return sc.pointShape; },
                labelFormatter: function (it) { return it.name; }
            });
        }

        if (fitSettings.fitEnabled && fitSettings.fitShowStats && fits && fits.length && global.PlotFormula) {
            const groupColorMap = {};
            groupKeys.forEach(function (g) { groupColorMap[g] = colorOf(g); });
            const lines = formulaLines(fits, fitSettings, groupColorMap);
            if (lines.length) {
                PlotFormula.draw(svg, {
                    app: app,
                    p: p,
                    lines: lines,
                    anchor: 'top-right',
                    margin: 15,
                    fontSize: 13,
                    color: '#333',
                    bold: false
                });
            }
        }

        PlotAxis.applyFontFamily(svg, p.fontFamily);
    }

    global.ScatterCommon = {
        defaultScatterSettings: defaultScatterSettings,
        defaultFitSettings: defaultFitSettings,
        renderScatterPanel: renderScatterPanel,
        readScatterSettings: readScatterSettings,
        renderFitPanel: renderFitPanel,
        readFitSettings: readFitSettings,
        buildData: buildData,
        groupData: groupData,
        performFits: performFits,
        drawScatterChart: drawScatterChart,
        L: L
    };
})(window);
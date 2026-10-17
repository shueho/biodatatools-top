(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Must include a header row with a <strong>category column</strong>, a <strong>start value column</strong>, and an <strong>end value column</strong>. Repeated rows for the same category are averaged.'
            : '需包含表头，至少包含 <strong>分类列</strong>、<strong>起始值列</strong> 和 <strong>结束值列</strong>。同一分类的多个重复行会自动取均值。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select the category, start and end columns' : '❌ 请选择分类列、起始值列、结束值列',
        noValid: EN ? '❌ Could not generate valid plot data' : '❌ 未能生成有效绘图数据',
        startFallback: 'Start',
        endFallback: 'End'
    };

    const EX =
        'Category\tStart\tEnd\n' +
        'A\t10\t28\n' +
        'B\t22\t45\n' +
        'C\t15\t32\n' +
        'D\t30\t18\n' +
        'E\t12\t40\n' +
        'F\t8\t22';

    function getCatValues(app) {
        const s = app.state;
        if (!s.data.length || !s.roles.x) return [];
        const seen = new Set();
        const out = [];
        s.data.forEach(row => {
            const v = row[s.roles.x];
            if (v === undefined || v === null || v === '') return;
            const t = String(v);
            if (!seen.has(t)) { seen.add(t); out.push(t); }
        });
        return out;
    }

    function aggregateData(app) {
        const s = app.state;
        if (!s.roles.x || !s.roles.start || !s.roles.end) return [];
        const map = new Map();
        s.data.forEach(row => {
            const cat = String(row[s.roles.x] == null ? '' : row[s.roles.x]);
            if (!cat) return;
            const start = parseFloat(row[s.roles.start]);
            const end = parseFloat(row[s.roles.end]);
            if (!map.has(cat)) map.set(cat, { starts: [], ends: [] });
            const rec = map.get(cat);
            if (isFinite(start)) rec.starts.push(start);
            if (isFinite(end)) rec.ends.push(end);
        });
        const out = [];
        map.forEach((v, cat) => {
            if (!v.starts.length || !v.ends.length) return;
            const start = v.starts.reduce((a, b) => a + b, 0) / v.starts.length;
            const end = v.ends.reduce((a, b) => a + b, 0) / v.ends.length;
            out.push({
                cat,
                start,
                end,
                diff: end - start,
                avg: (start + end) / 2,
                max: Math.max(start, end),
                min: Math.min(start, end)
            });
        });
        return out;
    }

    function applySort(app, cats, data) {
        const mode = app.state.sortByMode || 'input';
        if (mode === 'input') return cats;
        const dir = app.state.sortDir === 'desc' ? -1 : 1;
        const m = new Map(data.map(d => [d.cat, d]));
        return cats.slice().sort((a, b) => {
            const da = m.get(a), db = m.get(b);
            if (!da || !db) return 0;
            let ka = 0, kb = 0;
            if (mode === 'start') { ka = da.start; kb = db.start; }
            else if (mode === 'end') { ka = da.end; kb = db.end; }
            else if (mode === 'max') { ka = da.max; kb = db.max; }
            else if (mode === 'min') { ka = da.min; kb = db.min; }
            else if (mode === 'avg') { ka = da.avg; kb = db.avg; }
            else if (mode === 'diff') { ka = da.diff; kb = db.diff; }
            return (ka - kb) * dir;
        });
    }

    function fillRoleSelects(app) {
        const s = app.state;
        const xSel = app.$('xColSel');
        const startSel = app.$('startColSel');
        const endSel = app.$('endColSel');
        if (!xSel || !startSel || !endSel) return;

        const emptyOpt = '<option value="">' + (EN ? '— Please import data first —' : '— 请先导入数据 —') + '</option>';
        if (!s.headers.length) {
            xSel.innerHTML = emptyOpt;
            startSel.innerHTML = emptyOpt;
            endSel.innerHTML = emptyOpt;
            xSel.disabled = startSel.disabled = endSel.disabled = true;
            return;
        }
        xSel.disabled = startSel.disabled = endSel.disabled = false;

        const buildOpts = (cur) => s.headers.map(h =>
            '<option value="' + PlotCommon.escapeHtml(h) + '"' +
            (h === cur ? ' selected' : '') + '>' +
            PlotCommon.escapeHtml(h) + '</option>'
        ).join('');

        xSel.innerHTML = buildOpts(s.roles.x || '');
        startSel.innerHTML = buildOpts(s.roles.start || '');
        endSel.innerHTML = buildOpts(s.roles.end || '');
    }

    function fillShapeSelects() {
        const shapes = window.PlotShapes && window.PlotShapes.SHAPES;
        const startSel = document.getElementById('dotShapeStart');
        const endSel = document.getElementById('dotShapeEnd');
        if (!shapes || !startSel || !endSel) return;
        if (startSel.options.length && endSel.options.length) return;

        const lang = (PlotI18N.lang() === 'en') ? 'en' : 'zh';
        const opts = shapes.map(s =>
            '<option value="' + s.id + '">' + (s[lang] || s.zh) + '</option>'
        ).join('');
        startSel.innerHTML = opts;
        endSel.innerHTML = opts;
        startSel.value = 'circle';
        endSel.value = 'circle';
    }

    function getStartLabel(app) {
        return app.state.roles.start || T.startFallback;
    }
    function getEndLabel(app) {
        return app.state.roles.end || T.endFallback;
    }

    function resolveColors(app) {
        const palette = app.resolvePaletteColors(2);
        const startColor = app.state.customColors.start || palette[0] || '#4e79a7';
        const endColor = app.state.customColors.end || palette[1] || '#e15759';
        const posLineColor = app.state.customColors.posLine || endColor;
        const negLineColor = app.state.customColors.negLine || startColor;
        return { startColor, endColor, posLineColor, negLineColor };
    }

    function refreshLineColorInputs(app) {
        const c = resolveColors(app);
        const posInput = app.$('posLineColor');
        const negInput = app.$('negLineColor');
        if (posInput) posInput.value = c.posLineColor;
        if (negInput) negInput.value = c.negLineColor;
    }

    function updateStrokeColorVisibility() {
        const modeSel = document.getElementById('dotStrokeMode');
        const item = document.getElementById('dotStrokeColorItem');
        if (!modeSel || !item) return;
        item.style.display = (modeSel.value === 'custom') ? '' : 'none';
    }

    function readParams(app) {
        const $ = app.$;
        const num = (id, fb) => PC.num(app, id, fb);
        const p = Object.assign({},
            PC.readCanvasParams(app, 760, 600),
            PC.readTitleLegendParams(app)
        );
        p.direction = app.state.barDirection || 'vertical';
        p.dotSize = Math.max(2, num('dotSize', 8));
        p.dotShapeStart = ($('dotShapeStart') && $('dotShapeStart').value) || 'circle';
        p.dotShapeEnd = ($('dotShapeEnd') && $('dotShapeEnd').value) || 'circle';
        p.dotStrokeMode = ($('dotStrokeMode') && $('dotStrokeMode').value) || 'same';
        p.dotStrokeColor = ($('dotStrokeColor') && $('dotStrokeColor').value) || '#333333';
        p.dotStrokeWidth = Math.max(0, num('dotStrokeWidth', 1.5));
        p.lineWidth = Math.max(0.5, num('lineWidth', 3));
        p.lineDash = $('lineDash') ? $('lineDash').checked : false;
        p.showDiff = $('showDiff') ? $('showDiff').checked : false;
        p.diffFontSize = Math.max(6, num('diffFontSize', 12));
        return p;
    }

    function resolveStrokeColor(p, fillColor) {
        if (p.dotStrokeMode === 'none') return null;
        if (p.dotStrokeMode === 'same') return fillColor;
        if (p.dotStrokeMode === 'white') return '#ffffff';
        return p.dotStrokeColor;
    }

    function isHollowShape(shapeId) {
        if (window.PlotShapes && window.PlotShapes.isHollow) {
            return window.PlotShapes.isHollow(shapeId);
        }
        return /-hollow$/.test(String(shapeId || ''));
    }

    function drawDot(parent, opts) {
        const x = opts.x, y = opts.y;
        const size = opts.size;
        const fill = opts.fill;
        const strokeColor = opts.strokeColor;
        const strokeWidth = opts.strokeWidth;
        const shapeId = opts.shapeId;
        const hollow = isHollowShape(shapeId);

        if (window.PlotShapes && window.PlotShapes.buildSymbolPath) {
            const pathD = window.PlotShapes.buildSymbolPath(shapeId, size * 2);
            const el = parent.append('path')
                .attr('d', pathD)
                .attr('transform', 'translate(' + x + ',' + y + ')');

            if (hollow) {
                const hollowStroke = (strokeColor != null) ? strokeColor : fill;
                el.attr('fill', '#ffffff')
                    .attr('stroke', hollowStroke)
                    .attr('stroke-width', Math.max(1, strokeWidth));
            } else {
                el.attr('fill', fill);
                if (strokeColor && strokeWidth > 0) {
                    el.attr('stroke', strokeColor).attr('stroke-width', strokeWidth);
                } else {
                    el.attr('stroke', 'none');
                }
            }
        } else {
            const el = parent.append('circle')
                .attr('cx', x).attr('cy', y)
                .attr('r', size)
                .attr('fill', fill);
            if (strokeColor && strokeWidth > 0) {
                el.attr('stroke', strokeColor).attr('stroke-width', strokeWidth);
            } else {
                el.attr('stroke', 'none');
            }
        }
    }

    function syncAxisTitles(app) {
        const s = app.state;
        const dir = s.barDirection || 'vertical';
        const catTitle = s.roles.x || '';
        const valTitle = 'Value';
        if (dir === 'horizontal') {
            if (!s.axis.x.titleEdited) s.axis.x.titleContent = valTitle;
            if (!s.axis.y.titleEdited) s.axis.y.titleContent = catTitle;
        } else {
            if (!s.axis.x.titleEdited) s.axis.x.titleContent = catTitle;
            if (!s.axis.y.titleEdited) s.axis.y.titleContent = valTitle;
        }
    }

    function refreshAxisPanel(app) {
        const direction = app.state.barDirection || 'vertical';
        PlotAxis.render(app.$('axisPanelContainer'), {
            state: app.state.axis,
            direction: direction,
            onGlobalFontChange: function () {
                if (app.state.currentSvg) app.drawChart();
            },
            onChange: function () {
                if (app.state.currentSvg) app.drawChart();
            },
            onDirectionChange: function (newDir) {
                app.state.barDirection = newDir;
                syncAxisTitles(app);
                refreshAxisPanel(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
        ['x', 'y'].forEach(k => {
            const input = app.$('axisPanelContainer').querySelector('.ax-' + k + '-title');
            if (input) {
                input.addEventListener('input', function () {
                    app.state.axis[k].titleEdited = true;
                });
            }
        });
    }

    function refreshColors(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const c = resolveColors(app);
        PlotCommon.renderColorAssignment(container, {
            items: [
                { name: getStartLabel(app), color: c.startColor },
                { name: getEndLabel(app), color: c.endColor }
            ],
            onChange: function (idx, col) {
                app.state.customColors[idx === 0 ? 'start' : 'end'] = col;
                refreshLineColorInputs(app);
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: function () {
                app.state.customColors = {};
                refreshColors(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
        refreshLineColorInputs(app);
    }

    function drawChart(app) {
        const s = app.state;
        app.toolbarTip.textContent = '';
        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.x || !s.roles.start || !s.roles.end) {
            app.showTip('msgTip3', T.selectCols, 'error'); return;
        }

        const aggData = aggregateData(app);
        if (!aggData.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const p = readParams(app);
        const axisCfg = s.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        let cats = getCatValues(app);
        cats = applySort(app, cats, aggData);
        const dataMap = new Map(aggData.map(d => [d.cat, d]));
        cats = cats.filter(c => dataMap.has(c));
        if (!cats.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const isH = p.direction === 'horizontal';
        const catAxisCfg = isH ? axisCfg.y : axisCfg.x;
        const valAxisCfg = isH ? axisCfg.x : axisCfg.y;

        let vMin = Infinity, vMax = -Infinity;
        aggData.forEach(d => {
            if (d.start < vMin) vMin = d.start;
            if (d.start > vMax) vMax = d.start;
            if (d.end < vMin) vMin = d.end;
            if (d.end > vMax) vMax = d.end;
        });
        if (!isFinite(vMin)) { vMin = 0; vMax = 1; }
        if (vMax === vMin) { vMin -= 0.5; vMax += 0.5; }

        const margin = 30;
        const areaX = margin, areaY = margin;
        const areaW = p.width - 2 * margin;
        const areaH = p.height - 2 * margin;

        const catTickFont = catAxisCfg.tickValueShow ? catAxisCfg.tickFontSize : 0;
        const catTitleFont = (catAxisCfg.titleShow && catAxisCfg.titleContent) ? catAxisCfg.titleFontSize + 8 : 0;
        const valTickFont = valAxisCfg.tickValueShow ? valAxisCfg.tickFontSize : 0;
        const valTitleFont = (valAxisCfg.titleShow && valAxisCfg.titleContent) ? valAxisCfg.titleFontSize + 8 : 0;

        let leftPad, bottomPad;
        if (isH) {
            let maxCatW = 0;
            cats.forEach(v => {
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

        let catScale, valScale;
        if (isH) {
            catScale = d3.scaleBand().domain(cats).range([plotY, plotY + plotH])
                .paddingOuter(0.4).paddingInner(0.4);
            valScale = d3.scaleLinear().domain(valDomain).range([plotX, plotX + plotW]).nice();
        } else {
            catScale = d3.scaleBand().domain(cats).range([plotX, plotX + plotW])
                .paddingOuter(0.4).paddingInner(0.4);
            valScale = d3.scaleLinear().domain(valDomain).range([plotY + plotH, plotY]).nice();
        }

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        if (valAxisCfg.gridShow) {
            const grid = svg.append('g').attr('class', 'grid grid-val');
            const ticks = valScale.ticks ? valScale.ticks() : valScale.domain();
            ticks.forEach(t => {
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
            cats.forEach(cv => {
                const pos = Math.round(catScale(cv) + catScale.bandwidth() / 2) + 0.5;
                if (!isFinite(pos)) return;
                const line = grid.append('line')
                    .attr('stroke', catAxisCfg.gridColor)
                    .attr('stroke-dasharray', catAxisCfg.gridDash)
                    .attr('stroke-width', 1);
                if (isH) {
                    line.attr('x1', plotX).attr('x2', plotX + plotW)
                        .attr('y1', pos).attr('y2', pos);
                } else {
                    line.attr('x1', pos).attr('x2', pos)
                        .attr('y1', plotY).attr('y2', plotY + plotH);
                }
            });
        }

        const c = resolveColors(app);
        const { startColor, endColor, posLineColor, negLineColor } = c;
        const startStroke = resolveStrokeColor(p, startColor);
        const endStroke = resolveStrokeColor(p, endColor);

        const lineG = svg.append('g').attr('class', 'dumbbell-lines');
        const dotG = svg.append('g').attr('class', 'dumbbell-dots');
        const diffG = svg.append('g').attr('class', 'dumbbell-diffs');

        aggData.forEach(d => {
            if (!cats.includes(d.cat)) return;
            const bandPos = catScale(d.cat);
            const center = bandPos + catScale.bandwidth() / 2;
            const lineColor = (d.diff >= 0) ? posLineColor : negLineColor;

            let startPx, endPx, cx, cy;
            if (isH) {
                cy = center;
                startPx = valScale(d.start);
                endPx = valScale(d.end);
                if (Math.abs(startPx - endPx) > 0.5) {
                    const lineEl = lineG.append('line')
                        .attr('x1', startPx).attr('x2', endPx)
                        .attr('y1', cy).attr('y2', cy)
                        .attr('stroke', lineColor)
                        .attr('stroke-width', p.lineWidth)
                        .attr('stroke-linecap', 'round');
                    if (p.lineDash) lineEl.attr('stroke-dasharray', '6 4');
                }
                drawDot(dotG, {
                    x: startPx, y: cy,
                    shapeId: p.dotShapeStart,
                    size: p.dotSize,
                    fill: startColor,
                    strokeColor: startStroke,
                    strokeWidth: p.dotStrokeWidth
                });
                drawDot(dotG, {
                    x: endPx, y: cy,
                    shapeId: p.dotShapeEnd,
                    size: p.dotSize,
                    fill: endColor,
                    strokeColor: endStroke,
                    strokeWidth: p.dotStrokeWidth
                });
                if (p.showDiff) {
                    const midX = (startPx + endPx) / 2;
                    diffG.append('text')
                        .attr('x', midX).attr('y', cy - p.dotSize - 6)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', p.diffFontSize)
                        .attr('fill', '#333')
                        .text(PC.fmtNum(Math.abs(d.diff), 2));
                }
            } else {
                cx = center;
                startPx = valScale(d.start);
                endPx = valScale(d.end);
                if (Math.abs(startPx - endPx) > 0.5) {
                    const lineEl = lineG.append('line')
                        .attr('x1', cx).attr('x2', cx)
                        .attr('y1', startPx).attr('y2', endPx)
                        .attr('stroke', lineColor)
                        .attr('stroke-width', p.lineWidth)
                        .attr('stroke-linecap', 'round');
                    if (p.lineDash) lineEl.attr('stroke-dasharray', '6 4');
                }
                drawDot(dotG, {
                    x: cx, y: startPx,
                    shapeId: p.dotShapeStart,
                    size: p.dotSize,
                    fill: startColor,
                    strokeColor: startStroke,
                    strokeWidth: p.dotStrokeWidth
                });
                drawDot(dotG, {
                    x: cx, y: endPx,
                    shapeId: p.dotShapeEnd,
                    size: p.dotSize,
                    fill: endColor,
                    strokeColor: endStroke,
                    strokeWidth: p.dotStrokeWidth
                });
                if (p.showDiff) {
                    const midY = (startPx + endPx) / 2;
                    diffG.append('text')
                        .attr('x', cx + p.dotSize + 6).attr('y', midY)
                        .attr('text-anchor', 'start')
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', p.diffFontSize)
                        .attr('fill', '#333')
                        .text(PC.fmtNum(Math.abs(d.diff), 2));
                }
            }
        });

        const catAxisFn = isH ? d3.axisLeft(catScale) : d3.axisBottom(catScale);
        catAxisFn.tickValues(cats);
        const catAxisG = svg.append('g').attr('class', isH ? 'y-axis' : 'x-axis');
        if (isH) {
            catAxisG.attr('transform', 'translate(' + plotX + ',0)').call(catAxisFn);
        } else {
            catAxisG.attr('transform', 'translate(0,' + (plotY + plotH) + ')').call(catAxisFn);
        }
        catAxisG.selectAll('.tick').attr('transform', d => {
            const pos = Math.round(catScale(d) + catScale.bandwidth() / 2) + 0.5;
            return isH ? `translate(0,${pos})` : `translate(${pos},0)`;
        });
        PlotAxis.applyAxis(catAxisG, catAxisCfg, isH ? 'left' : 'bottom');

        const valAxisFn = isH ? d3.axisBottom(valScale) : d3.axisLeft(valScale);
        const valTicks = PlotAxis.resolveTicks(valAxisCfg, valScale);
        if (valTicks && valTicks.length) valAxisFn.tickValues(valTicks);
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
            xScale: isH ? valScale : catScale,
            yScale: isH ? catScale : valScale,
            axisCfg: axisCfg
        });

        if (p.showLegend) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: [
                    { name: getStartLabel(app), percent: null },
                    { name: getEndLabel(app), percent: null }
                ],
                colors: [startColor, endColor],
                shape: 'circle',
                labelFormatter: it => it.name
            });
        }

        PlotAxis.applyFontFamily(svg, p.fontFamily);

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    PlotApp.create({
        exportName: 'dumbbell_chart',
        exampleData: EX,
        importInfo: T.importInfo,

        stateExtra: {
            roles: { x: '', start: '', end: '' },
            sortByMode: 'input',
            sortDir: 'desc',
            barDirection: 'vertical',
            axis: PlotAxis.defaultState()
        },

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = 'Type';
            }
        },

        refreshColors: function (app) {
            refreshColors(app);
        },

        setup: function (app) {
            fillShapeSelects();
            fillRoleSelects(app);
            syncAxisTitles(app);
            refreshAxisPanel(app);
            refreshColors(app);
            updateStrokeColorVisibility();

            const xSel = app.$('xColSel');
            if (xSel) {
                xSel.addEventListener('change', function () {
                    app.state.roles.x = xSel.value;
                    syncAxisTitles(app);
                    refreshAxisPanel(app);
                    if (app.state.currentSvg) app.drawChart();
                });
            }
            const startSel = app.$('startColSel');
            if (startSel) {
                startSel.addEventListener('change', function () {
                    app.state.roles.start = startSel.value;
                    refreshColors(app);
                    if (app.state.currentSvg) app.drawChart();
                });
            }
            const endSel = app.$('endColSel');
            if (endSel) {
                endSel.addEventListener('change', function () {
                    app.state.roles.end = endSel.value;
                    refreshColors(app);
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const posLineEl = app.$('posLineColor');
            if (posLineEl) {
                posLineEl.addEventListener('change', function () {
                    app.state.customColors.posLine = posLineEl.value;
                    if (app.state.currentSvg) app.drawChart();
                });
            }
            const negLineEl = app.$('negLineColor');
            if (negLineEl) {
                negLineEl.addEventListener('change', function () {
                    app.state.customColors.negLine = negLineEl.value;
                    if (app.state.currentSvg) app.drawChart();
                });
            }

            const strokeModeSel = app.$('dotStrokeMode');
            if (strokeModeSel) {
                strokeModeSel.addEventListener('change', updateStrokeColorVisibility);
            }

            const sortSel = app.$('sortByMode');
            if (sortSel) {
                sortSel.value = app.state.sortByMode || 'input';
                sortSel.addEventListener('change', function () {
                    app.state.sortByMode = sortSel.value;
                    if (app.state.currentSvg) app.drawChart();
                });
            }
            const sortDirSel = app.$('sortDir');
            if (sortDirSel) {
                sortDirSel.value = app.state.sortDir || 'desc';
                sortDirSel.addEventListener('change', function () {
                    app.state.sortDir = sortDirSel.value;
                    if (app.state.currentSvg) app.drawChart();
                });
            }
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = res.columnTypes || {};
            const cats = res.headers.filter(h => s.columnTypes[h] === 'categorical' || s.columnTypes[h] === 'date');
            const nums = res.headers.filter(h => s.columnTypes[h] === 'numeric');
            s.roles.x = cats[0] || res.headers[0];
            s.roles.start = nums[0] || res.headers[1] || res.headers[0];
            s.roles.end = nums[1] || nums[0] || res.headers[2] || res.headers[0];
            s.customColors = {};
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            app.syncLegendTitle();
            fillShapeSelects();
            fillRoleSelects(app);
            syncAxisTitles(app);
            refreshAxisPanel(app);
            refreshColors(app);
            updateStrokeColorVisibility();
        },

        onReset: function (app) {
            const s = app.state;
            s.columnTypes = {};
            s.roles = { x: '', start: '', end: '' };
            s.customColors = {};
            s.sortByMode = 'input';
            s.sortDir = 'desc';
            s.axis = PlotAxis.defaultState();
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            const sortSel = app.$('sortByMode');
            if (sortSel) sortSel.value = 'input';
            const sortDirSel = app.$('sortDir');
            if (sortDirSel) sortDirSel.value = 'desc';
            const shapeStart = app.$('dotShapeStart');
            const shapeEnd = app.$('dotShapeEnd');
            const strokeMode = app.$('dotStrokeMode');
            if (shapeStart) shapeStart.value = 'circle';
            if (shapeEnd) shapeEnd.value = 'circle';
            if (strokeMode) strokeMode.value = 'same';
            fillShapeSelects();
            fillRoleSelects(app);
            syncAxisTitles(app);
            refreshAxisPanel(app);
            refreshColors(app);
            updateStrokeColorVisibility();
        },

        onStateRestored: function (app) {
            fillShapeSelects();
            fillRoleSelects(app);
            syncAxisTitles(app);
            refreshAxisPanel(app);
            refreshColors(app);
            updateStrokeColorVisibility();
            const sortSel = app.$('sortByMode');
            if (sortSel) sortSel.value = app.state.sortByMode || 'input';
            const sortDirSel = app.$('sortDir');
            if (sortDirSel) sortDirSel.value = app.state.sortDir || 'desc';
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
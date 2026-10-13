(function () {
    'use strict';

    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'The first column is the <strong>indicator / variable name</strong>; the remaining columns are numeric values for each sample. You can paste directly from Excel.'
            : '第一列为<strong>指标/变量名</strong>，其余列为各样本的数值。可直接粘贴 Excel 内容。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select an indicator column and at least one sample column' : '❌ 请在第二步选择指标列和至少一个样本列',
        noValid: EN ? '❌ Could not generate valid plot data. Please check the indicator column' : '❌ 未能生成有效绘图数据，请检查指标列',
        colorEmpty: EN ? 'Sample colors will be shown here after selecting sample columns' : '选择样本列后将在此处显示每个样本的颜色',
        sampleTip: EN ? 'Import data to select samples' : '导入数据后可选择',
        noSample: EN ? 'No available sample columns' : '没有可用的样本列'
    };

    function num(app, id, fallback) {
        const el = app.$(id);
        if (!el) return fallback;
        const v = parseFloat(el.value);
        return isFinite(v) ? v : fallback;
    }

    function estTextWidth(str, fontSize) {
        let w = 0;
        for (const ch of String(str)) w += /[\u4e00-\u9fa5\uff00-\uffef]/.test(ch) ? 1 : 0.55;
        return w * fontSize;
    }

    function fillAxisSelect(app) {
        const sel = app.$('axisColSel');
        const state = app.state;
        if (!state.headers.length) {
            sel.innerHTML = '<option>' + PlotI18N.t('notSelected') + '</option>';
            sel.disabled = true;
            return;
        }
        sel.disabled = false;
        sel.innerHTML = state.headers.map(h =>
            '<option value="' + PlotCommon.escapeHtml(h) + '" ' +
            (h === state.roles.axis ? 'selected' : '') + '>' +
            PlotCommon.escapeHtml(h) + '</option>'
        ).join('');
    }

    function renderSampleCols(app) {
        const box = app.$('sampleColsBox');
        const state = app.state;
        if (!state.headers.length) {
            box.innerHTML = '<span style="color:#999;">' + T.sampleTip + '</span>';
            return;
        }
        const cands = state.headers.filter(h => h !== state.roles.axis);
        if (!cands.length) {
            box.innerHTML = '<span style="color:#999;">' + T.noSample + '</span>';
            return;
        }
        box.innerHTML = cands.map(h => {
            const checked = state.roles.samples.indexOf(h) >= 0 ? 'checked' : '';
            return '<label><input type="checkbox" class="sample-col-cb" value="' +
                PlotCommon.escapeHtml(h) + '" ' + checked + '> ' + PlotCommon.escapeHtml(h) + '</label>';
        }).join('');
        box.querySelectorAll('.sample-col-cb').forEach(cb => {
            cb.addEventListener('change', () => {
                state.roles.samples = Array.from(box.querySelectorAll('.sample-col-cb:checked'))
                    .map(x => x.value);
                state.customColors = {};
                app.refreshColors();
                /* 换了样本后自动重绘 */
                if (state.data.length) app.drawChart();
            });
        });
    }

    function refreshSampleColors(app) {
        const container = app.$('colorAssignContainer');
        const samples = app.state.roles.samples;
        if (!samples.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const baseColors = app.resolvePaletteColors(samples.length);
        const items = samples.map((s, i) => ({
            name: s,
            color: app.state.customColors[s] || baseColors[i]
        }));
        PlotCommon.renderColorAssignment(container, {
            items: items,
            onChange: (idx, newColor) => {
                app.state.customColors[samples[idx]] = newColor;
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: () => {
                app.state.customColors = {};
                refreshSampleColors(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    function getAxes(app) {
        const axisCol = app.state.roles.axis;
        const samples = app.state.roles.samples;
        if (!axisCol || !samples.length) return [];
        const out = [];
        app.state.data.forEach(row => {
            const name = row[axisCol];
            if (name === undefined || name === null || name === '') return;
            const values = {};
            samples.forEach(s => { values[s] = parseFloat(row[s]); });
            out.push({ name: String(name), values: values });
        });
        return out;
    }

    function getRefValues(axes, samples, p) {
        if (p.scaleMode === 'perAxis') {
            return axes.map(a => {
                const vals = samples.map(s => a.values[s]).filter(isFinite);
                return vals.length ? Math.max.apply(null, vals) : 1;
            });
        }
        const all = [];
        axes.forEach(a => samples.forEach(s => {
            if (isFinite(a.values[s])) all.push(a.values[s]);
        }));
        const gMax = all.length ? Math.max.apply(null, all) : 1;
        return axes.map(() => gMax);
    }

    function readParams(app) {
        const $ = app.$;
        return {
            width: Math.max(200, num(app, 'chartWidth', 800)),
            height: Math.max(200, num(app, 'chartHeight', 700)),
            outerRadius: Math.max(40, num(app, 'outerRadius', 220)),
            gridLevels: Math.max(1, Math.round(num(app, 'gridLevels', 5))),
            gridShape: $('gridShape').value || 'polygon',
            gridColor: $('gridColor').value || '#d8e2ec',
            axisWidth: Math.max(0, num(app, 'axisWidth', 1)),

            showGrid: $('showGrid').checked,
            showAxisLines: $('showAxisLines').checked,

            scaleMode: $('scaleMode').value || 'perAxis',
            scalePos: $('scalePos').value || 'none',
            scaleType: $('scaleType').value || 'ratio',
            scaleDecimals: Math.max(0, Math.round(num(app, 'scaleDecimals', 0))),
            scaleFontSize: Math.max(6, num(app, 'scaleFontSize', 12)),
            scaleBold: $('scaleBold').checked,
            scaleItalic: $('scaleItalic').checked,

            lineWidth: Math.max(0, num(app, 'lineWidth', 2)),
            fillOpacity: Math.max(0, Math.min(1, num(app, 'fillOpacity', 0.2))),
            showFill: $('showFill').checked,

            pointSize: Math.max(1, num(app, 'pointSize', 6)),
            pointStroke: $('pointStroke').value || 'same',
            pointStrokeWidth: Math.max(0, num(app, 'pointStrokeWidth', 1.5)),
            showPoints: $('showPoints').checked,

            fontFamily: $('fontFamily').value || 'Times New Roman',
            axisLabelFontSize: Math.max(6, num(app, 'axisLabelFontSize', 15)),
            axisLabelBold: $('axisLabelBold').checked,
            axisLabelItalic: $('axisLabelItalic').checked,
            legendFontSize: Math.max(6, num(app, 'legendFontSize', 15)),
            legendBold: $('legendBold').checked,
            legendItalic: $('legendItalic').checked,
            legendTitleFontSize: Math.max(6, num(app, 'legendTitleFontSize', 15)),
            legendTitleBold: $('legendTitleBold').checked,
            legendTitleItalic: $('legendTitleItalic').checked,
            titleFontSize: Math.max(6, num(app, 'titleFontSize', 22)),
            titleBold: $('titleBold').checked,
            titleItalic: $('titleItalic').checked,
            titlePosition: $('titlePosition').value || 'top-center',

            showLegend: $('showLegend').checked,
            legendPosition: $('legendPosition').value || 'right',
            legendGap: Math.max(0, num(app, 'legendGap', 30)),
            showLegendTitle: $('showLegendTitle').checked,
            legendTitle: $('legendTitle').value || '',
            showTitle: $('showTitle').checked,
            chartTitle: $('chartTitle').value || '',
            showCanvasBorder: $('showCanvasBorder').checked,
            axisLabelOffset: Math.max(0, num(app, 'axisLabelOffset', 20))
        };
    }

    function drawChart(app) {
        const state = app.state;
        const $ = app.$;
        app.toolbarTip.textContent = '';

        if (!state.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!state.roles.axis || !state.roles.samples.length) {
            app.showTip('msgTip3', T.selectCols, 'error'); return;
        }

        const p = readParams(app);
        const axes = getAxes(app);
        const samples = state.roles.samples;
        if (!axes.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const N = axes.length;
        const width = p.width;
        const height = p.height;
        const refValues = getRefValues(axes, samples, p);

        function norm(v, i) {
            if (!isFinite(v)) return 0;
            const mx = refValues[i];
            if (!isFinite(mx) || mx <= 0) return 0;
            return Math.max(0, Math.min(1, v / mx));
        }

        const titleH = (p.showTitle && p.chartTitle) ? p.titleFontSize + 10 : 0;

        const wantLegend = !!p.showLegend && samples.length > 0;
        const pos = p.legendPosition;
        const isRight = wantLegend && pos === 'right';
        const isLeft = wantLegend && pos === 'left';
        const isTop = wantLegend && pos === 'top';
        const isBottom = wantLegend && pos === 'bottom';

        const legendColW = 200;
        const hasLegendTitle = !!(p.showLegendTitle && p.legendTitle && p.legendTitle.trim());
        const legendTitleH = hasLegendTitle ? (p.legendTitleFontSize + 10) : 0;
        const legendInlineH = p.legendFontSize + 20 + legendTitleH;
        const gap = p.legendGap;
        const margin = 30;

        let areaX = margin, areaY = margin;
        let areaW = width - 2 * margin;
        let areaH = height - 2 * margin;

        /* 图形大小不受 gap 影响 */
        if (isRight) {
            areaW = width - legendColW - 2 * margin;
        } else if (isLeft) {
            areaX = legendColW + 2 * margin;
            areaW = width - legendColW - 2 * margin;
        } else if (isTop) {
            areaY = legendInlineH + 2 * margin;
            areaH = height - legendInlineH - 2 * margin;
        } else if (isBottom) {
            areaH = height - legendInlineH - 2 * margin;
        }
        areaW = Math.max(20, areaW);
        areaH = Math.max(20, areaH);

        const gridAreaH = Math.max(20, areaH - titleH);

        let maxLabelW = 0;
        axes.forEach(a => {
            maxLabelW = Math.max(maxLabelW, estTextWidth(a.name, p.axisLabelFontSize));
        });
        const labelSpace = maxLabelW * 0.5 + p.axisLabelOffset + 8;

        const maxR = Math.max(20, Math.min(
            p.outerRadius,
            areaW / 2 - labelSpace,
            gridAreaH / 2 - labelSpace
        ));

        const blockH = titleH + maxR * 2 + labelSpace * 2;
        const blockTop = areaY + (areaH - blockH) / 2;
        const cx = areaX + areaW / 2;
        const cy = blockTop + titleH + labelSpace + maxR;

        const baseColors = app.resolvePaletteColors(samples.length);
        const colors = samples.map((s, i) => state.customColors[s] || baseColors[i]);

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: width, height: height, fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        state.currentSvg = canvas.node;

        if (p.showTitle && p.chartTitle) {
            PlotTitle.draw(svg, {
                width: width, height: height, position: p.titlePosition, text: p.chartTitle,
                fontSize: p.titleFontSize, bold: p.titleBold, italic: p.titleItalic
            });
        }

        const angles = [];
        for (let i = 0; i < N; i++) angles.push((Math.PI * 2 * i) / N - Math.PI / 2);

        const g = svg.append('g').attr('class', 'radar-chart');

        if (p.showGrid) {
            const gridGroup = g.append('g').attr('class', 'radar-grid');
            for (let lv = 1; lv <= p.gridLevels; lv++) {
                const r = (lv / p.gridLevels) * maxR;
                if (p.gridShape === 'circle') {
                    gridGroup.append('circle')
                        .attr('cx', cx).attr('cy', cy).attr('r', r)
                        .attr('fill', 'none').attr('stroke', p.gridColor).attr('stroke-width', 1);
                } else {
                    const pts = angles.map(a => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
                    gridGroup.append('polygon')
                        .attr('points', pts.map(pt => pt.join(',')).join(' '))
                        .attr('fill', 'none').attr('stroke', p.gridColor).attr('stroke-width', 1);
                }
            }
        }

        if (p.showAxisLines) {
            const axisGroup = g.append('g').attr('class', 'radar-axis');
            angles.forEach(a => {
                axisGroup.append('line')
                    .attr('x1', cx).attr('y1', cy)
                    .attr('x2', cx + maxR * Math.cos(a))
                    .attr('y2', cy + maxR * Math.sin(a))
                    .attr('stroke', p.gridColor)
                    .attr('stroke-width', p.axisWidth);
            });
        }

        if (p.scalePos !== 'none') {
            const scaleGroup = g.append('g').attr('class', 'radar-scale');
            const scaleWeight = p.scaleBold ? 'bold' : 'normal';
            const scaleStyle = p.scaleItalic ? 'italic' : 'normal';
            const off = 6;

            angles.forEach((a, i) => {
                if (p.scalePos === 'first' && i !== 0) return;
                const ref = refValues[i];
                const ux = Math.cos(a);
                const uy = Math.sin(a);
                const vx = Math.cos(a + Math.PI / 2);
                const vy = Math.sin(a + Math.PI / 2);
                const anchor = ux >= 0 ? 'start' : 'end';

                for (let lv = 1; lv <= p.gridLevels; lv++) {
                    const t = lv / p.gridLevels;
                    const r = t * maxR;
                    const lx = cx + r * ux + vx * off;
                    const ly = cy + r * uy + vy * off;
                    const label = (p.scaleType === 'ratio')
                        ? (t * 100).toFixed(p.scaleDecimals) + '%'
                        : (t * ref).toFixed(p.scaleDecimals);
                    scaleGroup.append('text')
                        .attr('x', lx).attr('y', ly)
                        .attr('text-anchor', anchor)
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', p.scaleFontSize)
                        .attr('font-weight', scaleWeight)
                        .attr('font-style', scaleStyle)
                        .attr('fill', '#888')
                        .text(label);
                }
            });
        }

        const dataGroup = g.append('g').attr('class', 'radar-data');
        samples.forEach((s, si) => {
            const pts = axes.map((ax, i) => {
                const r = norm(ax.values[s], i) * maxR;
                return [cx + r * Math.cos(angles[i]), cy + r * Math.sin(angles[i])];
            });

            dataGroup.append('polygon')
                .attr('points', pts.map(pt => pt.join(',')).join(' '))
                .attr('fill', p.showFill ? colors[si] : 'none')
                .attr('fill-opacity', p.showFill ? p.fillOpacity : 0)
                .attr('stroke', colors[si])
                .attr('stroke-width', p.lineWidth)
                .attr('stroke-linejoin', 'round');

            if (p.showPoints) {
                pts.forEach(pt => {
                    const c = dataGroup.append('circle')
                        .attr('cx', pt[0]).attr('cy', pt[1])
                        .attr('r', p.pointSize)
                        .attr('fill', colors[si]);
                    if (p.pointStroke === 'none') c.attr('stroke', 'none');
                    else c.attr('stroke', colors[si]).attr('stroke-width', p.pointStrokeWidth);
                });
            }
        });

        const labelR = maxR + p.axisLabelOffset;
        const lw = p.axisLabelBold ? 'bold' : 'normal';
        const ls = p.axisLabelItalic ? 'italic' : 'normal';
        angles.forEach((a, i) => {
            const lx = cx + labelR * Math.cos(a);
            const ly = cy + labelR * Math.sin(a);
            const c = Math.cos(a);
            let anchor = 'middle';
            if (c > 0.15) anchor = 'start';
            else if (c < -0.15) anchor = 'end';
            svg.append('text')
                .attr('x', lx).attr('y', ly)
                .attr('text-anchor', anchor)
                .attr('dominant-baseline', 'middle')
                .attr('font-size', p.axisLabelFontSize)
                .attr('font-weight', lw)
                .attr('font-style', ls)
                .attr('fill', '#333')
                .text(axes[i].name);
        });

        if (wantLegend) {
            let legendArea, orientation;
            const gapShift = Math.max(0, gap);

            if (isRight || isLeft) {
                orientation = 'vertical';
                const legendX = isRight
                    ? Math.max(margin, width - margin - legendColW - gapShift)
                    : Math.min(width - margin - legendColW, margin + gapShift);
                legendArea = { x: legendX, y: areaY, w: legendColW, h: areaH };
            } else {
                orientation = 'horizontal';
                const legendY = isTop
                    ? Math.min(height - margin - legendInlineH, margin + gapShift)
                    : Math.max(margin, height - margin - legendInlineH - gapShift);
                legendArea = { x: 0, y: legendY, w: width, h: legendInlineH };
            }

            PlotLegend.draw(svg, {
                orientation: orientation,
                area: legendArea,
                width: width,
                items: samples.map((s, i) => ({ label: s, color: colors[i], shape: 'rect' })),
                fontSize: p.legendFontSize,
                bold: p.legendBold,
                italic: p.legendItalic,
                markerSize: p.legendFontSize,
                textGap: 8,
                itemGap: 20,
                showTitle: hasLegendTitle,
                title: p.legendTitle,
                titleFontSize: p.legendTitleFontSize,
                titleBold: p.legendTitleBold,
                titleItalic: p.legendTitleItalic
            });
        }

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    PlotApp.create({
        exportName: 'radar_chart',
        exampleData: 'Indicator\tS1\tS2\tS3\nSpeed\t80\t60\t75\nPower\t70\t90\t65\nAccuracy\t85\t70\t80\nEndurance\t60\t75\t90\nAgility\t90\t65\t70\n',
        importInfo: T.importInfo,
        syncLegendTitle: function (app) {
            if (!app.state.legendTitleEdited && app.legendTitleInput) {
                app.legendTitleInput.value = 'Sample';
            }
        },
        setup: function (app) {
            fillAxisSelect(app);
            renderSampleCols(app);
            app.$('axisColSel').addEventListener('change', () => {
                const state = app.state;
                state.roles.axis = app.$('axisColSel').value;
                state.roles.samples = state.roles.samples.filter(s => s !== state.roles.axis);
                if (!state.roles.samples.length) {
                    state.roles.samples = state.headers.filter(h => h !== state.roles.axis);
                }
                state.customColors = {};
                renderSampleCols(app);
                app.refreshColors();
                if (state.data.length) app.drawChart();
            });
            refreshSampleColors(app);
        },
        onDataImported: function (app, res) {
            const axisCol = res.headers.find(h => res.columnTypes[h] === 'categorical') || res.headers[0];
            let samples = res.headers.filter(h => h !== axisCol && res.columnTypes[h] === 'numeric');
            if (!samples.length) samples = res.headers.filter(h => h !== axisCol);
            app.state.roles = { axis: axisCol, samples: samples.slice() };
            app.state.customColors = {};
            fillAxisSelect(app);
            renderSampleCols(app);
        },
        onReset: function (app) {
            app.state.roles = { axis: '', samples: [] };
            fillAxisSelect(app);
            renderSampleCols(app);
        },
        onStateRestored: function (app) {
            fillAxisSelect(app);
            renderSampleCols(app);
            refreshSampleColors(app);
        },
        refreshColors: function (app) {
            refreshSampleColors(app);
        },
        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
(function () {
    'use strict';

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

    function drawShape(parent, shapeId, cx, cy, cellSize, fill) {
        if (shapeId === 'square') {
            parent.append('rect')
                .attr('x', cx - cellSize / 2)
                .attr('y', cy - cellSize / 2)
                .attr('width', cellSize)
                .attr('height', cellSize)
                .attr('fill', fill);
            return;
        }
        const symType = PlotShapes.getSymbolType(shapeId);
        const size = PlotShapes.getSymbolSize(shapeId, cellSize);
        const pathData = d3.symbol().type(symType).size(size)();
        parent.append('path')
            .attr('d', pathData)
            .attr('transform', `translate(${cx}, ${cy})`)
            .attr('fill', fill);
    }

    function refreshShapeSelector(app) {
        const items = app.getCategoryItems();
        const baseColors = app.resolvePaletteColors(items.length);
        const displayItems = items.map((it, i) => ({
            name: it.name,
            color: app.state.customColors[it.name] || baseColors[i]
        }));
        PlotShapes.renderShapeSelector(app.$('shapeSelectorContainer'), {
            items: displayItems,
            state: app.state,
            onChange: () => { if (app.state.currentSvg) app.drawChart(); }
        });
    }

    function updateWaffleDirectionUI(app) {
        const dir = app.$('waffleDirection').value;
        if (dir === 'horizontal') {
            app.$('colsItem').classList.remove('hide');
            app.$('rowsItem').classList.add('hide');
        } else {
            app.$('colsItem').classList.add('hide');
            app.$('rowsItem').classList.remove('hide');
        }
    }

    function readParams(app) {
        return {
            width: Math.max(200, num(app, 'chartWidth', 700)),
            height: Math.max(200, num(app, 'chartHeight', 600)),
            fontFamily: app.$('fontFamily').value || 'Times New Roman',
            legendFontSize: Math.max(6, num(app, 'legendFontSize', 15)),
            legendBold: app.$('legendBold').checked,
            legendItalic: app.$('legendItalic').checked,
            legendTitleFontSize: Math.max(6, num(app, 'legendTitleFontSize', 15)),
            legendTitleBold: app.$('legendTitleBold').checked,
            legendTitleItalic: app.$('legendTitleItalic').checked,
            titleFontSize: Math.max(6, num(app, 'titleFontSize', 22)),
            titleBold: app.$('titleBold').checked,
            titleItalic: app.$('titleItalic').checked,
            titlePosition: app.$('titlePosition').value || 'top-center',
            showLegend: app.$('showLegend').checked,
            legendPosition: app.$('legendPosition').value || 'right',
            legendGap: Math.max(0, num(app, 'legendGap', 30)),
            showLegendTitle: app.$('showLegendTitle').checked,
            legendTitle: app.$('legendTitle').value || '',
            showTitle: app.$('showTitle').checked,
            chartTitle: app.$('chartTitle').value || '',
            showCanvasBorder: app.$('showCanvasBorder').checked,
            direction: app.$('waffleDirection').value || 'horizontal',
            total: Math.max(1, Math.round(num(app, 'waffleTotal', 100))),
            cols: Math.max(1, num(app, 'waffleCols', 10)),
            rows: Math.max(1, num(app, 'waffleRows', 10)),
            waffleGapX: Math.max(0, num(app, 'waffleGapX', 2)),
            waffleGapY: Math.max(0, num(app, 'waffleGapY', 2))
        };
    }

    function getGrid(p) {
        const total = p.total;
        if (p.direction === 'horizontal') {
            const cols = Math.max(1, Math.round(p.cols));
            const rows = Math.max(1, Math.ceil(total / cols));
            return { rows, cols, total };
        }
        const rows = Math.max(1, Math.round(p.rows));
        const cols = Math.max(1, Math.ceil(total / rows));
        return { rows, cols, total };
    }

    function buildCells(app, p) {
        const items = app.getCategoryItems();
        if (!items.length) return null;
        const grid = getGrid(p);
        const totalCells = grid.total;
        const cells = [];
        let remaining = totalCells;
        items.forEach((it, idx) => {
            let count;
            if (idx === items.length - 1) count = remaining;
            else count = Math.min(Math.round(it.percent * totalCells), remaining);
            for (let i = 0; i < count; i++) cells.push({ category: it.name });
            remaining -= count;
        });
        return { cells, rows: grid.rows, cols: grid.cols };
    }

    PlotApp.create({
        exportName: 'waffle_chart',
        exampleData: 'Category\tValue\nA\t35\nB\t30\nC\t20\nD\t15\n',
        importInfo: PlotI18N.lang() === 'en'
            ? 'Must include a header row with at least a <strong>category column</strong> and a <strong>value column</strong>. You can paste directly from Excel.'
            : '需包含表头，且至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>。可直接粘贴 Excel 内容。',
        stateExtra: { shapeMode: 'uniform', uniformShape: 'square', categoryShapes: {} },

        setup: function (app) {
            updateWaffleDirectionUI(app);
            app.$('waffleDirection').addEventListener('change', () => {
                updateWaffleDirectionUI(app);
                if (app.state.currentSvg) app.drawChart();
            });
            refreshShapeSelector(app);
        },
        onDataImported: function (app) {
            app.state.categoryShapes = {};
            refreshShapeSelector(app);
        },
        onRoleChanged: function (app) {
            app.state.categoryShapes = {};
            refreshShapeSelector(app);
        },
        onSortChanged: function (app) {
            refreshShapeSelector(app);
        },
        onReset: function (app) {
            app.state.categoryShapes = {};
        },
        onColorChanged: function (app) { refreshShapeSelector(app); },
        onPaletteChanged: function (app) { refreshShapeSelector(app); },

        drawChart: function (app) {
            const state = app.state;
            const $ = app.$;
            const chartPreview = app.chartPreview;
            const toolbarTip = app.toolbarTip;
            const exportSvgBtn = app.exportSvgBtn;
            const exportPngBtn = app.exportPngBtn;
            const showTip = app.showTip;

            toolbarTip.textContent = '';
            if (!state.data.length) { showTip('msgTip3', PlotI18N.t('noData'), 'error'); return; }
            if (!state.roles.category || !state.roles.value) {
                showTip('msgTip3', PlotI18N.t('selectColumns'), 'error'); return;
            }

            const p = readParams(app);
            const built = buildCells(app, p);
            if (!built || !built.cells.length) {
                showTip('msgTip3', PlotI18N.t('noValidData'), 'error'); return;
            }
            const { cells, rows, cols } = built;
            const items = app.getCategoryItems();
            const allCatNames = items.map(x => x.name);
            const allBaseColors = app.resolvePaletteColors(allCatNames.length);

            const colorOf = name => {
                if (!name) return '#e8edf2';
                if (state.customColors[name]) return state.customColors[name];
                const idx = allCatNames.indexOf(name);
                return allBaseColors[idx] || '#cccccc';
            };
            const shapeOf = name => {
                if (!name) return 'square';
                if (state.shapeMode === 'uniform') return state.uniformShape;
                return state.categoryShapes[name] || 'square';
            };

            const width = p.width;
            const height = p.height;
            const titleH = (p.showTitle && p.chartTitle) ? p.titleFontSize + 10 : 0;

            const wantLegend = !!p.showLegend && items.length > 0;
            const pos = p.legendPosition;
            const isRight = wantLegend && pos === 'right';
            const isLeft = wantLegend && pos === 'left';
            const isTop = wantLegend && pos === 'top';
            const isBottom = wantLegend && pos === 'bottom';

            const legendColW = 200;
            const legendRowH = p.legendFontSize + 10;
            const hasLegendTitle = !!(p.showLegendTitle && p.legendTitle && p.legendTitle.trim());
            const legendTitleH = hasLegendTitle ? (p.legendTitleFontSize + 10) : 0;
            const legendInlineH = p.legendFontSize + 20 + legendTitleH;
            const gap = p.legendGap;
            const margin = 30;

            let areaX = margin, areaY = margin;
            let areaW = width - 2 * margin;
            let areaH = height - 2 * margin;
            if (isRight) areaW = width - legendColW - gap - 2 * margin;
            else if (isLeft) { areaX = legendColW + gap + margin; areaW = width - legendColW - gap - 2 * margin; }
            else if (isTop) { areaY = legendInlineH + gap + margin; areaH = height - legendInlineH - gap - 2 * margin; }
            else if (isBottom) areaH = height - legendInlineH - gap - 2 * margin;
            areaW = Math.max(20, areaW);
            areaH = Math.max(20, areaH);

            const gridAreaH = Math.max(20, areaH - titleH);
            const gx = p.waffleGapX;
            const gy = p.waffleGapY;
            const cellFromW = (areaW - gx * (cols - 1)) / cols;
            const cellFromH = (gridAreaH - gy * (rows - 1)) / rows;
            const cellSize = Math.max(1, Math.min(cellFromW, cellFromH));
            const fullW = cellSize * cols + gx * (cols - 1);
            const fullH = cellSize * rows + gy * (rows - 1);
            const blockH = titleH + fullH;
            const blockTop = areaY + (areaH - blockH) / 2;
            const gridTop = blockTop + titleH;
            const gridLeft = areaX + (areaW - fullW) / 2;

            const canvas = PlotCanvas.create(chartPreview, {
                width: width, height: height, fontFamily: p.fontFamily, border: p.showCanvasBorder
            });
            const svg = canvas.root;
            state.currentSvg = canvas.node;

            if (p.showTitle && p.chartTitle) {
                PlotTitle.draw(svg, {
                    width, height, position: p.titlePosition, text: p.chartTitle,
                    fontSize: p.titleFontSize, bold: p.titleBold, italic: p.titleItalic
                });
            }

            const g = svg.append('g').attr('class', 'waffle-cells');
            cells.forEach((cell, idx) => {
                let r, c;
                if (p.direction === 'horizontal') { r = Math.floor(idx / cols); c = idx % cols; }
                else { r = idx % rows; c = Math.floor(idx / rows); }
                const cx = gridLeft + c * (cellSize + gx) + cellSize / 2;
                const cy = gridTop + r * (cellSize + gy) + cellSize / 2;
                drawShape(g, shapeOf(cell.category), cx, cy, cellSize, colorOf(cell.category));
            });

            if (wantLegend) {
                const legendGroup = svg.append('g').attr('class', 'chart-legend');
                const markerSize = p.legendFontSize;
                const textGap = 8;
                const itemGap = 20;
                const legendWeight = p.legendBold ? 'bold' : 'normal';
                const legendStyle = p.legendItalic ? 'italic' : 'normal';
                const ltitleWeight = p.legendTitleBold ? 'bold' : 'normal';
                const ltitleStyle = p.legendTitleItalic ? 'italic' : 'normal';
                const labels = items.map(it => `${it.name} (${(it.percent * 100).toFixed(1)}%)`);

                if (isRight || isLeft) {
                    const totalH = (hasLegendTitle ? legendTitleH : 0) + items.length * legendRowH;
                    const startY2 = areaY + (areaH - totalH) / 2;
                    const baseX = isRight ? (width - legendColW - gap + 12) : 12;
                    if (hasLegendTitle) {
                        legendGroup.append('text').attr('x', baseX).attr('y', startY2 + p.legendTitleFontSize / 2)
                            .attr('dy', '0.35em').attr('font-size', p.legendTitleFontSize)
                            .attr('font-weight', ltitleWeight).attr('font-style', ltitleStyle)
                            .attr('fill', '#333').text(p.legendTitle);
                    }
                    const itemsStartY = startY2 + (hasLegendTitle ? legendTitleH : 0);
                    items.forEach((it, i) => {
                        const y = itemsStartY + i * legendRowH;
                        drawShape(legendGroup, shapeOf(it.name), baseX + markerSize / 2, y + markerSize / 2, markerSize, colorOf(it.name));
                        legendGroup.append('text').attr('x', baseX + markerSize + textGap).attr('y', y + markerSize / 2)
                            .attr('dy', '0.35em').attr('font-size', p.legendFontSize)
                            .attr('font-weight', legendWeight).attr('font-style', legendStyle)
                            .attr('fill', '#333').text(labels[i]);
                    });
                } else {
                    const widths = labels.map(lb => markerSize + textGap + estTextWidth(lb, p.legendFontSize) + itemGap);
                    const totalW = widths.reduce((a, b) => a + b, 0) - itemGap;
                    const startX2 = Math.max(10, (width - totalW) / 2);
                    const legendY0 = isTop ? margin : (height - legendInlineH - margin);
                    const itemsY = legendY0 + (hasLegendTitle ? legendTitleH : 0) + 6;
                    if (hasLegendTitle) {
                        legendGroup.append('text').attr('x', width / 2).attr('y', legendY0 + p.legendTitleFontSize / 2)
                            .attr('text-anchor', 'middle').attr('dy', '0.35em').attr('font-size', p.legendTitleFontSize)
                            .attr('font-weight', ltitleWeight).attr('font-style', ltitleStyle)
                            .attr('fill', '#333').text(p.legendTitle);
                    }
                    let cursorX = startX2;
                    items.forEach((it, i) => {
                        drawShape(legendGroup, shapeOf(it.name), cursorX + markerSize / 2, itemsY + markerSize / 2, markerSize, colorOf(it.name));
                        legendGroup.append('text').attr('x', cursorX + markerSize + textGap).attr('y', itemsY + markerSize / 2)
                            .attr('dy', '0.35em').attr('font-size', p.legendFontSize)
                            .attr('font-weight', legendWeight).attr('font-style', legendStyle)
                            .attr('fill', '#333').text(labels[i]);
                        cursorX += widths[i];
                    });
                }
            }

            exportSvgBtn.disabled = false;
            exportPngBtn.disabled = false;
            showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
        }
    });
})();
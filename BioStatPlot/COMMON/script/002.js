(function () {
    'use strict';

    const PC = window.PlotCommon;

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
        const p = PC.readCommonParams(app, { width: 700, height: 600 });

        p.direction = app.$('waffleDirection').value || 'horizontal';
        p.total = Math.max(1, Math.round(PC.num(app, 'waffleTotal', 100)));
        p.cols = Math.max(1, PC.num(app, 'waffleCols', 10));
        p.rows = Math.max(1, PC.num(app, 'waffleRows', 10));
        p.waffleGapX = Math.max(0, PC.num(app, 'waffleGapX', 2));
        p.waffleGapY = Math.max(0, PC.num(app, 'waffleGapY', 2));

        return p;
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

        stateExtra: {
            shapeMode: 'uniform',
            uniformShape: 'square',
            categoryShapes: {}
        },

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = app.state.roles.category || '';
            }
        },

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
            const chartPreview = app.chartPreview;

            if (!state.data.length) {
                app.showTip('msgTip3', PlotI18N.t('noData'), 'error');
                return;
            }
            if (!state.roles.category || !state.roles.value) {
                app.showTip('msgTip3', PlotI18N.t('selectColumns'), 'error');
                return;
            }

            const p = readParams(app);
            const built = buildCells(app, p);
            if (!built || !built.cells.length) {
                app.showTip('msgTip3', PlotI18N.t('noValidData'), 'error');
                return;
            }

            const cells = built.cells;
            const rows = built.rows;
            const cols = built.cols;
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
            const margin = 30;
            const areaX = margin;
            const areaY = margin;
            const areaW = width - 2 * margin;
            const areaH = height - 2 * margin;

            const gx = p.waffleGapX;
            const gy = p.waffleGapY;
            const cellFromW = (areaW - gx * (cols - 1)) / cols;
            const cellFromH = (areaH - gy * (rows - 1)) / rows;
            const cellSize = Math.max(1, Math.min(cellFromW, cellFromH));
            const fullW = cellSize * cols + gx * (cols - 1);
            const fullH = cellSize * rows + gy * (rows - 1);
            const gridTop = areaY + (areaH - fullH) / 2;
            const gridLeft = areaX + (areaW - fullW) / 2;

            const canvas = PlotCanvas.create(chartPreview, {
                width: width,
                height: height,
                fontFamily: p.fontFamily,
                border: p.showCanvasBorder
            });
            const svg = canvas.root;
            state.currentSvg = canvas.node;

            const g = svg.append('g').attr('class', 'waffle-cells');
            cells.forEach((cell, idx) => {
                let r, c;
                if (p.direction === 'horizontal') {
                    r = Math.floor(idx / cols);
                    c = idx % cols;
                } else {
                    r = idx % rows;
                    c = Math.floor(idx / rows);
                }
                const cx = gridLeft + c * (cellSize + gx) + cellSize / 2;
                const cy = gridTop + r * (cellSize + gy) + cellSize / 2;
                drawShape(g, shapeOf(cell.category), cx, cy, cellSize, colorOf(cell.category));
            });

            if (p.showLegend && items.length) {
                PC.drawLegendOverlay(svg, {
                    p: p,
                    items: items,
                    colors: items.map(it => colorOf(it.name)),
                    shapeOf: (i, it) => shapeOf(it.name),
                    margin: 15
                });
            }

            app.exportSvgBtn.disabled = false;
            app.exportPngBtn.disabled = false;
            app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
        }
    });
})();
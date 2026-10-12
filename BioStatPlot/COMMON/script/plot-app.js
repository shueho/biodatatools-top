/* ============================================================
   BioDataTools 图表应用外壳
   把每个图表页面都会重复的部分集中到这里：
        - state / DOM 引用
        - 数据导入面板
        - 分类列、数值列选择
        - 排序选择
        - 色板下拉、颜色分配
        - 反转色板 / 颜色循环
        - 重绘监听、绘制按钮
        - 画布创建（PlotCanvas）、标题绘制（PlotTitle）
        - SVG / PNG 导出、提示、重置
   页面只需要通过 PlotApp.create(config) 提供：
        exportName, exampleData, importInfo, stateExtra,
        readParams, buildData, computeLayout, draw
============================================================ */
(function (global) {
    'use strict';

    function create(cfg) {
        cfg = cfg || {};

        const state = Object.assign({
            headers: [], data: [],
            roles: { category: '', value: '' },
            paletteName: 'tableau10',
            reverse: false,
            cycleColors: false,
            customColors: {},
            sortBy: '',
            sortDir: 'desc',
            legendTitleEdited: false,
            currentSvg: null
        }, cfg.stateExtra || {});

        const $ = id => document.getElementById(id);
        const catColSel = $('catColSel');
        const valColSel = $('valColSel');
        const sortBySel = $('sortBy');
        const sortDirSel = $('sortDir');
        const paletteDropdownContainer = $('paletteDropdownContainer');
        const colorAssignContainer = $('colorAssignContainer');
        const chartPreview = $('chartPreview');
        const exportSvgBtn = $('exportSvgBtn');
        const exportPngBtn = $('exportPngBtn');
        const toolbarTip = $('toolbarTip');
        const legendTitleInput = $('legendTitle');

        const app = {
            state: state,
            $: $,
            catColSel: catColSel,
            valColSel: valColSel,
            sortBySel: sortBySel,
            sortDirSel: sortDirSel,
            paletteDropdownContainer: paletteDropdownContainer,
            colorAssignContainer: colorAssignContainer,
            chartPreview: chartPreview,
            exportSvgBtn: exportSvgBtn,
            exportPngBtn: exportPngBtn,
            toolbarTip: toolbarTip,
            legendTitleInput: legendTitleInput
        };

        /* ---------- 图例标题同步 ---------- */
        if (legendTitleInput) {
            legendTitleInput.addEventListener('input', () => { state.legendTitleEdited = true; });
        }
        function defaultSyncLegendTitle() {
            if (!state.legendTitleEdited && legendTitleInput) {
                legendTitleInput.value = state.roles.category || '';
            }
        }
        function syncLegendTitle() {
            if (cfg.syncLegendTitle) {
                cfg.syncLegendTitle(app);
            } else {
                defaultSyncLegendTitle();
            }
        }

        /* ---------- 角色选择 ---------- */
        function fillRoleSelects() {
            if (!catColSel || !valColSel) return;
            if (!state.headers.length) {
                catColSel.innerHTML = '<option>' + PlotI18N.t('notSelected') + '</option>';
                valColSel.innerHTML = '<option>' + PlotI18N.t('notSelected') + '</option>';
                catColSel.disabled = true;
                valColSel.disabled = true;
                return;
            }
            catColSel.disabled = false;
            valColSel.disabled = false;
            const opts = (selVal) => state.headers.map(h =>
                `<option value="${PlotCommon.escapeHtml(h)}" ${h === selVal ? 'selected' : ''}>${PlotCommon.escapeHtml(h)}</option>`
            ).join('');
            catColSel.innerHTML = opts(state.roles.category);
            valColSel.innerHTML = opts(state.roles.value);
        }

        function fillSortBySelect() {
            if (!sortBySel) return;
            state.sortBy = PlotCommon.fillSortBySelect(sortBySel, state.headers, state.sortBy);
        }

        /* ---------- 色板与颜色 ---------- */
        function initPaletteDropdown() {
            if (!paletteDropdownContainer) return;
            PlotCommon.renderPaletteDropdown(paletteDropdownContainer, {
                type: 'categorical',
                selected: state.paletteName,
                previewCount: 8,
                onSelect: name => {
                    state.paletteName = name;
                    state.customColors = {};
                    refreshColors(app);
                    resetChart();
                    if (cfg.onPaletteChanged) cfg.onPaletteChanged(app);
                }
            });
        }

        function resolvePaletteColors(count) {
            return PlotCommon.getCategoricalColors(state.paletteName, count, {
                reverse: state.reverse,
                cycle: state.cycleColors
            });
        }

        function getCategoryItems() {
            return PlotCommon.aggregateAndSort(state.data, {
                categoryKey: state.roles.category,
                valueKey: state.roles.value,
                sortBy: state.sortBy,
                sortDir: state.sortDir
            });
        }

        function refreshCategoryColors() {
            if (!colorAssignContainer) return;
            const items = getCategoryItems();
            if (!items.length) {
                colorAssignContainer.innerHTML = '<div class="color-assign-empty">' + PlotI18N.t('colorEmpty') + '</div>';
                return;
            }
            const baseColors = resolvePaletteColors(items.length);
            const displayItems = items.map((it, i) => ({
                name: it.name,
                color: state.customColors[it.name] || baseColors[i],
                percent: it.percent
            }));
            PlotCommon.renderColorAssignment(colorAssignContainer, {
                items: displayItems,
                onChange: (idx, newColor) => {
                    state.customColors[items[idx].name] = newColor;
                    if (state.currentSvg) drawChart();
                    if (cfg.onColorChanged) cfg.onColorChanged(app);
                },
                onResetAll: () => {
                    state.customColors = {};
                    refreshColors(app);
                    if (state.currentSvg) drawChart();
                    if (cfg.onColorChanged) cfg.onColorChanged(app);
                }
            });
        }

        const refreshColors = cfg.refreshColors || refreshCategoryColors;

        function resolveItemColors(items) {
            const all = getCategoryItems().map(x => x.name);
            const base = resolvePaletteColors(all.length);
            return items.map((it, i) => {
                if (it.name && state.customColors[it.name]) return state.customColors[it.name];
                const idx = all.indexOf(it.name);
                if (idx >= 0) return base[idx];
                return resolvePaletteColors(items.length)[i] || '#cccccc';
            });
        }

        /* ---------- 提示 / 重置 ---------- */
        function showTip(elId, msg, type) {
            const el = $(elId);
            if (!el) return;
            el.className = 'tip-text ' + (type || '');
            el.textContent = msg;
            setTimeout(() => { el.textContent = ''; el.className = 'tip-text'; }, 3500);
        }

        function resetChart() {
            if (chartPreview) {
                chartPreview.innerHTML = '<div class="placeholder">' + PlotI18N.t('placeholder') + '</div>';
            }
            state.currentSvg = null;
            if (exportSvgBtn) exportSvgBtn.disabled = true;
            if (exportPngBtn) exportPngBtn.disabled = true;
            if (toolbarTip) toolbarTip.textContent = '';
            const tip = $('msgTip3');
            if (tip) tip.textContent = '';
        }

        function getSvgWithoutBorder() {
            if (!state.currentSvg) return null;
            return PlotCanvas.getSvgWithoutBorder(state.currentSvg);
        }

        function resetAll() {
            state.headers = [];
            state.data = [];
            state.roles = { category: '', value: '' };
            state.customColors = {};
            state.sortBy = '';
            state.sortDir = 'desc';
            state.legendTitleEdited = false;
            if (sortDirSel) sortDirSel.value = 'desc';
            if (legendTitleInput) legendTitleInput.value = '';
            if (cfg.onReset) cfg.onReset(app);
            fillRoleSelects();
            fillSortBySelect();
            refreshColors(app);
            resetChart();
        }

        /* ---------- 数据导入 ---------- */
        function onDataImported(res) {
            state.headers = res.headers;
            state.data = res.data;
            const catCol = res.headers.find(h => res.columnTypes[h] === 'categorical') || res.headers[0];
            const valCol = res.headers.find(h => res.columnTypes[h] === 'numeric') || res.headers[1] || res.headers[0];
            state.roles = { category: catCol, value: valCol };
            state.customColors = {};
            state.sortBy = valCol;
            state.sortDir = 'desc';
            if (sortDirSel) sortDirSel.value = 'desc';
            syncLegendTitle();
            if (cfg.onDataImported) cfg.onDataImported(app, res);
            fillRoleSelects();
            fillSortBySelect();
            refreshColors(app);
            resetChart();
        }

        /* ---------- 事件 ---------- */
        if (catColSel) {
            catColSel.addEventListener('change', () => {
                state.roles.category = catColSel.value;
                state.customColors = {};
                syncLegendTitle();
                if (cfg.onRoleChanged) cfg.onRoleChanged(app);
                refreshColors(app);
                resetChart();
            });
        }
        if (valColSel) {
            valColSel.addEventListener('change', () => {
                state.roles.value = valColSel.value;
                state.customColors = {};
                state.sortBy = valColSel.value;
                fillSortBySelect();
                if (cfg.onRoleChanged) cfg.onRoleChanged(app);
                refreshColors(app);
                resetChart();
            });
        }
        if (sortBySel) {
            sortBySel.addEventListener('change', () => {
                state.sortBy = sortBySel.value;
                if (cfg.onSortChanged) cfg.onSortChanged(app);
                refreshColors(app);
                if (state.currentSvg) drawChart();
            });
        }
        if (sortDirSel) {
            sortDirSel.addEventListener('change', () => {
                state.sortDir = sortDirSel.value;
                if (cfg.onSortChanged) cfg.onSortChanged(app);
                refreshColors(app);
                if (state.currentSvg) drawChart();
            });
        }

        const reverseEl = $('reversePalette');
        const cycleEl = $('cycleColors');
        if (reverseEl) {
            reverseEl.addEventListener('change', e => {
                state.reverse = e.target.checked;
                state.customColors = {};
                refreshColors(app);
                if (state.currentSvg) drawChart();
                if (cfg.onPaletteChanged) cfg.onPaletteChanged(app);
            });
        }
        if (cycleEl) {
            cycleEl.addEventListener('change', e => {
                state.cycleColors = e.target.checked;
                state.customColors = {};
                refreshColors(app);
                if (state.currentSvg) drawChart();
                if (cfg.onPaletteChanged) cfg.onPaletteChanged(app);
            });
        }

        const drawBtn = $('drawBtn');
        if (drawBtn) drawBtn.addEventListener('click', drawChart);

        document.querySelectorAll('[data-redraw]').forEach(el => {
            el.addEventListener('change', () => {
                if (state.currentSvg) drawChart();
            });
        });

        /* ---------- 导出 ---------- */
        if (exportSvgBtn) {
            exportSvgBtn.addEventListener('click', () => {
                const svg = getSvgWithoutBorder();
                if (!svg) return;
                PlotCommon.downloadSVG(svg, (cfg.exportName || 'chart') + '.svg');
                if (toolbarTip) toolbarTip.innerHTML = '<span class="success">' + PlotI18N.t('svgOk') + '</span>';
            });
        }
        if (exportPngBtn) {
            exportPngBtn.addEventListener('click', () => {
                const svg = getSvgWithoutBorder();
                if (!svg) return;
                PlotCommon.downloadPNG(svg, (cfg.exportName || 'chart') + '.png', 2, '#ffffff')
                .then(() => { if (toolbarTip) toolbarTip.innerHTML = '<span class="success">' + PlotI18N.t('pngOk') + '</span>'; })
                .catch(() => { if (toolbarTip) toolbarTip.innerHTML = '<span class="error">' + PlotI18N.t('pngFail') + '</span>'; });
            });
        }

        function drawChartOrchestrated() {
            if (toolbarTip) toolbarTip.textContent = '';
            if (!state.data.length) { showTip('msgTip3', PlotI18N.t('noData'), 'error'); return; }
            if (cfg.validate ? !cfg.validate(app) : (!state.roles.category || !state.roles.value)) {
                showTip('msgTip3', cfg.validateMessage || PlotI18N.t('selectColumns'), 'error');
                return;
            }
            const p = cfg.readParams(app);
            const data = cfg.buildData(app, p);
            if (!data || !data.length) { showTip('msgTip3', PlotI18N.t('noValidData'), 'error'); return; }

            const canvas = PlotCanvas.create(chartPreview, {
                width: p.width,
                height: p.height,
                fontFamily: p.fontFamily,
                border: p.showCanvasBorder
            });
            state.currentSvg = canvas.node;

            if (p.showTitle && p.chartTitle) {
                PlotTitle.draw(canvas.root, {
                    width: p.width,
                    height: p.height,
                    position: p.titlePosition,
                    text: p.chartTitle,
                    fontSize: p.titleFontSize,
                    bold: p.titleBold,
                    italic: p.titleItalic,
                });
            }

            const layout = cfg.computeLayout ? cfg.computeLayout(p, data, app) : {};
            const colors = resolveItemColors(data);
            cfg.draw({ app: app, root: canvas.root, p: p, data: data, layout: layout, colors: colors });

            if (exportSvgBtn) exportSvgBtn.disabled = false;
            if (exportPngBtn) exportPngBtn.disabled = false;
            showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
        }

        function drawChart() {
            PlotBootstrap.ensureD3().then(function () {
                if (cfg.drawChart) {
                    cfg.drawChart(app);
                } else {
                    drawChartOrchestrated();
                }
            }).catch(function (err) {
                console.error(err);
                const box = document.getElementById('chartPreview');
                const msg = PlotI18N.lang() === 'en' ? 'Failed to load d3. Please check your network and refresh.' : '无法加载 d3，请检查网络后刷新';
                showTip('msgTip3', msg, 'error');
                if (box) box.innerHTML = '<div class="placeholder" style="color:#c00;">' + msg + '</div>';
            });
        }

        /* ---------- 标题间距控件 ---------- */
        function ensureTitleSpacingInput() {
            if (document.getElementById('titleSpacing')) return;
            const titleInput = document.getElementById('chartTitle');
            if (!titleInput || !titleInput.parentNode) return;
            const label = document.createElement('label');
            label.textContent = PlotI18N.lang() === 'en' ? 'Spacing (px): ' : '间距(px)：';
            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'titleSpacing';
            input.value = '30';
            input.min = '0';
            input.max = '200';
            input.step = '5';
            input.style.width = '70px';
            input.setAttribute('data-redraw', '');
            input.addEventListener('change', () => { if (state.currentSvg) drawChart(); });
            label.appendChild(input);
            titleInput.parentNode.parentNode.insertBefore(label, titleInput.parentNode.nextSibling);
        }

        /* ---------- 初始化 ---------- */
        function init() {
            ensureTitleSpacingInput();
            PlotCommon.renderImportPanel('importPanel', {
                title: cfg.importTitle || PlotI18N.t('importTitle'),
                infoBox: cfg.importInfo || PlotI18N.t('importInfo'),
                exampleData: cfg.exampleData || '',
                examples: cfg.examples,
                defaultMode: 'file',
                onImport: onDataImported,
                onReset: resetAll
            });
    PlotBootstrap.ensureD3().then(function () {
        initPaletteDropdown();
    }).catch(function () {
        initPaletteDropdown();
    });
            if (cfg.setup) cfg.setup(app);
            fillRoleSelects();
            fillSortBySelect();
            refreshColors(app);
            resetChart();
        }

        app.syncLegendTitle = syncLegendTitle;
        app.fillRoleSelects = fillRoleSelects;
        app.fillSortBySelect = fillSortBySelect;
        app.initPaletteDropdown = initPaletteDropdown;
        app.resolvePaletteColors = resolvePaletteColors;
        app.getCategoryItems = getCategoryItems;
        app.refreshCategoryColors = refreshCategoryColors;
        app.refreshColors = refreshColors;
        app.resolveItemColors = resolveItemColors;
        app.showTip = showTip;
        app.resetChart = resetChart;
        app.drawChart = drawChart;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

        return app;
    }

    global.PlotApp = { create: create };
})(window);

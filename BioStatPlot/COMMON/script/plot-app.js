/* ============================================================
   BioDataTools 图表应用外壳
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
            legendOffset: { dx: 0, dy: 0 },
            legendScale: 1,
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
            toolbarTip: toolbarTip
        };

        const isEn = PlotI18N.lang() === 'en';
        const TXT = {
            loadStyle:   isEn ? 'Load Style'    : '加载样式',
            exportStyle: isEn ? 'Export Style'  : '导出样式',
            styleOk:     isEn ? '✅ Style loaded'   : '✅ 样式已恢复',
            styleExport: isEn ? '✅ Style exported' : '✅ 样式已导出',
            styleBad:    isEn ? '❌ Invalid style file' : '❌ 样式文件无效'
        };

        document.addEventListener('input', e => {
            if (e.target && e.target.id === 'legendTitle') {
                state.legendTitleEdited = true;
            }
        });

function defaultSyncLegendTitle() {
    const input = $('legendTitle');
    if (!state.legendTitleEdited && input) {
        input.value = 'Item';
    }
}
        function syncLegendTitle() {
            if (cfg.syncLegendTitle) cfg.syncLegendTitle(app);
            else defaultSyncLegendTitle();
        }

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
            const opts = selVal => state.headers.map(h =>
                `<option value="${PlotCommon.escapeHtml(h)}" ${h === selVal ? 'selected' : ''}>${PlotCommon.escapeHtml(h)}</option>`
            ).join('');
            catColSel.innerHTML = opts(state.roles.category);
            valColSel.innerHTML = opts(state.roles.value);
        }

        function fillSortBySelect() {
            if (!sortBySel) return;
            state.sortBy = PlotCommon.fillSortBySelect(sortBySel, state.headers, state.sortBy);
        }

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
                    if (state.currentSvg) drawChart();
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
            state.legendOffset = { dx: 0, dy: 0 };
            state.legendScale = 1;
            if (sortDirSel) sortDirSel.value = 'desc';
            const lt = $('legendTitle');
            if (lt) lt.value = '';
            if (cfg.onReset) cfg.onReset(app);
            fillRoleSelects();
            fillSortBySelect();
            refreshColors(app);
            resetChart();
        }

        function onDataImported(res) {
            state.headers = res.headers;
            state.data = res.data;
            const catCol = res.headers.find(h => res.columnTypes[h] === 'categorical') || res.headers[0];
            const valCol = res.headers.find(h => res.columnTypes[h] === 'numeric') || res.headers[1] || res.headers[0];
            state.roles = { category: catCol, value: valCol };
            state.customColors = {};
            state.sortBy = valCol;
            state.sortDir = 'desc';
            state.legendOffset = { dx: 0, dy: 0 };
            state.legendScale = 1;
            state.legendTitleEdited = false;
            if (sortDirSel) sortDirSel.value = 'desc';
            syncLegendTitle();
            if (cfg.onDataImported) cfg.onDataImported(app, res);
            fillRoleSelects();
            fillSortBySelect();
            refreshColors(app);

            if (state.data.length) {
                setTimeout(() => drawChart(), 0);
            } else {
                resetChart();
            }
        }

        if (catColSel) {
            catColSel.addEventListener('change', () => {
                state.roles.category = catColSel.value;
                state.customColors = {};
                syncLegendTitle();
                if (cfg.onRoleChanged) cfg.onRoleChanged(app);
                refreshColors(app);
                if (state.data.length) drawChart();
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
                if (state.data.length) drawChart();
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

        function bindRedrawEvents() {
            document.querySelectorAll('[data-redraw]').forEach(el => {
                if (el._redrawBound) return;
                el._redrawBound = true;
                el.addEventListener('change', () => {
                    if (state.currentSvg) drawChart();
                });
            });
        }

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

            const layout = cfg.computeLayout ? cfg.computeLayout(p, data, app) : {};
            const colors = resolveItemColors(data);
            cfg.draw({ app: app, root: canvas.root, p: p, data: data, layout: layout, colors: colors });

            if (exportSvgBtn) exportSvgBtn.disabled = false;
            if (exportPngBtn) exportPngBtn.disabled = false;
            showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
        }

        function drawChart() {
            PlotBootstrap.ensureD3().then(() => {
                if (cfg.drawChart) cfg.drawChart(app);
                else drawChartOrchestrated();
            }).catch(err => {
                console.error(err);
                const box = document.getElementById('chartPreview');
                const msg = PlotI18N.lang() === 'en'
                    ? 'Failed to load d3. Please check your network and refresh.'
                    : '无法加载 d3，请检查网络后刷新';
                showTip('msgTip3', msg, 'error');
                if (box) box.innerHTML = '<div class="placeholder" style="color:#c00;">' + msg + '</div>';
            });
        }

        function collectFormState() {
            const out = {};
            document.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
                if (el.closest('#importPanel')) return;
                if (el.id === 'importStateFile') return;
                if (el.type === 'file') return;
                if (el.type === 'radio') {
                    if (el.checked) out[el.id] = true;
                    return;
                }
                if (el.type === 'checkbox') {
                    out[el.id] = !!el.checked;
                } else {
                    out[el.id] = el.value;
                }
            });
            return out;
        }

        function applyFormState(form) {
            if (!form) return;
            Object.keys(form).forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                const v = form[id];
                if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!v;
                else el.value = v;
            });
        }

        function collectState() {
            const stateCopy = {};
            Object.keys(state).forEach(k => {
                if (k === 'currentSvg') return;
                try { stateCopy[k] = JSON.parse(JSON.stringify(state[k])); } catch (e) {}
            });
            return {
                version: 1,
                exportedAt: new Date().toISOString(),
                exportName: cfg.exportName || 'chart',
                form: collectFormState(),
                state: stateCopy
            };
        }

        function exportStateToFile() {
            const data = collectState();
            const blob = new Blob([JSON.stringify(data, null, 2)],
                { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = (cfg.exportName || 'chart') + '_style.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            if (toolbarTip) toolbarTip.innerHTML = '<span class="success">' + TXT.styleExport + '</span>';
        }

        function applyState(data) {
            if (!data || typeof data !== 'object' || !data.state) {
                throw new Error('invalid style file');
            }
            Object.keys(data.state).forEach(k => {
                if (k === 'currentSvg') return;
                state[k] = data.state[k];
            });
            applyFormState(data.form);

            if (cfg.onStateRestored) {
                try { cfg.onStateRestored(app); } catch (e) { console.warn(e); }
            }

            fillRoleSelects();
            fillSortBySelect();
            initPaletteDropdown();
            if (refreshColors) refreshColors(app);

            const lt = $('legendTitle');
            if (lt && data.state.legendTitle !== undefined) {
                lt.value = data.state.legendTitle;
            }

            if (state.data && state.data.length) {
                setTimeout(() => drawChart(), 0);
            } else {
                resetChart();
            }
            if (toolbarTip) toolbarTip.innerHTML = '<span class="success">' + TXT.styleOk + '</span>';
        }

        function handleImportStateFile(e) {
            const f = e.target.files && e.target.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    applyState(JSON.parse(ev.target.result));
                } catch (err) {
                    console.error(err);
                    if (toolbarTip) toolbarTip.innerHTML = '<span class="error">' + TXT.styleBad + '</span>';
                }
            };
            reader.readAsText(f);
            e.target.value = '';
        }

        function injectStateButtons() {
            const importPanel = document.getElementById('importPanel');
            if (importPanel && !document.getElementById('importStateBtn')) {
                const btnGroup = importPanel.querySelector('.btn-group');
                if (btnGroup) {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.id = 'importStateFile';
                    fileInput.accept = '.json,application/json';
                    fileInput.style.display = 'none';
                    fileInput.addEventListener('change', handleImportStateFile);
                    btnGroup.parentNode.appendChild(fileInput);

                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'btn';
                    btn.id = 'importStateBtn';
                    btn.textContent = TXT.loadStyle;
                    btn.addEventListener('click', () => fileInput.click());
                    btnGroup.appendChild(btn);
                }
            }

            if (exportPngBtn && !document.getElementById('exportStateBtn')) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn';
                btn.id = 'exportStateBtn';
                btn.textContent = TXT.exportStyle;
                btn.addEventListener('click', exportStateToFile);
                exportPngBtn.parentNode.insertBefore(btn, exportPngBtn.nextSibling);
            }
        }

        function init() {
            PlotCommon.renderImportPanel('importPanel', {
                title: cfg.importTitle || PlotI18N.t('importTitle'),
                infoBox: cfg.importInfo || PlotI18N.t('importInfo'),
                exampleData: cfg.exampleData || '',
                examples: cfg.examples,
                defaultMode: 'file',
                onImport: onDataImported,
                onReset: resetAll
            });

            injectStateButtons();

            if (document.getElementById('globalSettingsPanel')) {
                PlotCommon.renderGlobalSettings('globalSettingsPanel');
            }
            if (document.getElementById('legendSettingsPanel')) {
                PlotCommon.renderLegendSettings('legendSettingsPanel');
            }

            defaultSyncLegendTitle();

            if (cfg.setup) cfg.setup(app);

            bindRedrawEvents();

            PlotBootstrap.ensureD3().then(() => {
                initPaletteDropdown();
            }).catch(() => {
                initPaletteDropdown();
            });

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
        app.exportStateToFile = exportStateToFile;
        app.applyState = applyState;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

        global.PlotApp.current = app;
        return app;
    }

    global.PlotApp = { create: create, current: null };
})(window);
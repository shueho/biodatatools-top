(function () {
    'use strict';

    const PC = window.PlotCommon;
    const HC = window.HeatmapCommon;
    const EN = PlotI18N.lang() === 'en';

    const T = {
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        noValid: EN ? '❌ Could not generate valid data' : '❌ 未能生成有效数据',
        drawDone: PlotI18N.t('drawDone'),
        detectedMatrix: EN
            ? '✅ Detected a correlation matrix; switched to matrix mode'
            : '✅ 检测到相关系数矩阵，已自动切换'
    };

    const EXAMPLE_RAW =
        'Car\tmpg\tdisp\thp\tdrat\twt\tqsec\n' +
        'Mazda RX4\t21.0\t160.0\t110\t3.90\t2.620\t16.46\n' +
        'Mazda RX4 Wag\t21.0\t160.0\t110\t3.90\t2.875\t17.02\n' +
        'Datsun 710\t22.8\t108.0\t93\t3.85\t2.320\t18.61\n' +
        'Hornet 4 Drive\t21.4\t258.0\t110\t3.08\t3.215\t19.44\n' +
        'Hornet Sportabout\t18.7\t360.0\t175\t3.15\t3.440\t17.02\n' +
        'Valiant\t18.1\t225.0\t105\t2.76\t3.460\t20.22\n' +
        'Duster 360\t14.3\t360.0\t245\t3.21\t3.570\t15.84\n' +
        'Merc 240D\t24.4\t146.7\t62\t3.69\t3.190\t20.00\n' +
        'Merc 230\t22.8\t140.8\t95\t3.92\t3.150\t22.90\n' +
        'Merc 280\t19.2\t167.6\t123\t3.92\t3.440\t18.30\n' +
        'Merc 280C\t17.8\t167.6\t123\t3.92\t3.440\t18.90\n' +
        'Merc 450SE\t16.4\t275.8\t180\t3.07\t4.070\t17.40\n' +
        'Merc 450SL\t17.3\t275.8\t180\t3.07\t3.730\t17.60\n' +
        'Merc 450SLC\t15.2\t275.8\t180\t3.07\t3.780\t18.00\n' +
        'Cadillac Fleetwood\t10.4\t472.0\t205\t2.93\t5.250\t17.98\n' +
        'Lincoln Continental\t10.4\t460.0\t215\t3.00\t5.424\t17.82\n' +
        'Chrysler Imperial\t14.7\t440.0\t230\t3.23\t5.345\t17.42\n' +
        'Fiat 128\t32.4\t78.7\t66\t4.08\t2.200\t19.47\n' +
        'Honda Civic\t30.4\t75.7\t52\t4.93\t1.615\t18.52\n' +
        'Toyota Corolla\t33.9\t71.1\t65\t4.22\t1.835\t19.90\n' +
        'Toyota Corona\t21.5\t120.1\t97\t3.70\t2.465\t20.01\n' +
        'Dodge Challenger\t15.5\t318.0\t150\t2.76\t3.520\t16.87\n' +
        'AMC Javelin\t15.2\t304.0\t150\t3.15\t3.435\t17.30\n' +
        'Camaro Z28\t13.3\t350.0\t245\t3.73\t3.840\t15.41\n' +
        'Pontiac Firebird\t19.2\t400.0\t175\t3.08\t3.845\t17.05\n' +
        'Fiat X1-9\t27.3\t79.0\t66\t4.08\t1.935\t18.90\n' +
        'Porsche 914-2\t26.0\t120.3\t91\t4.43\t2.140\t16.70\n' +
        'Lotus Europa\t30.4\t95.1\t113\t3.77\t1.513\t16.90\n' +
        'Ford Pantera L\t15.8\t351.0\t264\t4.22\t3.170\t14.50\n' +
        'Ferrari Dino\t19.7\t145.0\t175\t3.62\t2.770\t15.50\n' +
        'Maserati Bora\t15.0\t301.0\t335\t3.54\t3.570\t14.60\n' +
        'Volvo 142E\t21.4\t121.0\t109\t4.11\t2.780\t18.60';

    const EXAMPLE_MATRIX =
        '#\tmpg\tdisp\thp\tdrat\twt\tqsec\n' +
        'mpg\t1\t<0.001\t<0.001\t<0.001\t<0.001\t0.02\n' +
        'disp\t-0.85\t1\t<0.001\t<0.001\t<0.001\t0.01\n' +
        'hp\t-0.78\t0.79\t1\t0.01\t<0.001\t<0.001\n' +
        'drat\t0.68\t-0.71\t-0.45\t1\t<0.001\t0.62\n' +
        'wt\t-0.87\t0.89\t0.66\t-0.71\t1\t0.34\n' +
        'qsec\t0.42\t-0.43\t-0.71\t0.09\t-0.17\t1';

    const state = {
        selectedCols: [],
        method: 'pearson',
        tableDecimals: 2,
        labels: [],
        rMatrix: null,
        pMatrix: null,

        inputIsMatrix: false,

        paletteMode: 'preset',
        paletteName: 'RdBu',
        custom2Low: '#ffffff',
        custom2High: '#d73027',
        custom3Low: '#4575b4',
        custom3Mid: '#ffffff',
        custom3High: '#d73027',
        reverseColors: false,

        colorBar: (window.ColorBarSettings ? window.ColorBarSettings.defaults() : null),
        display: (window.HeatmapCommon ? window.HeatmapCommon.defaultDisplay() : null)
    };

    function setMatrixModeLock(app, locked) {
        const rest = app.$('step2Rest');
        if (rest) {
            rest.style.opacity = locked ? '0.4' : '';
            rest.style.pointerEvents = locked ? 'none' : '';
        }
        const hint = app.$('inputIsMatrixHint');
        if (hint) hint.style.display = locked ? '' : 'none';
        const chk = app.$('inputIsMatrix');
        if (chk) chk.checked = locked;
        state.inputIsMatrix = locked;
    }

    function fillColumnSelect(app) {
        const box = app.$('colSelectBox');
        if (!box) return;
        const s = app.state;

        if (!s.headers.length) {
            box.innerHTML = '<span style="color:#999;">'
                + (EN ? 'Selectable after importing data' : '导入数据后可选择')
                + '</span>';
            state.selectedCols = [];
            return;
        }

        const types = s.columnTypes || {};
        const nums = s.headers.filter(function (h) { return types[h] === 'numeric'; });
        const candidates = nums.length ? nums.slice() : s.headers.slice();

        let needsReset = !state.selectedCols.length;
        if (!needsReset) {
            for (let i = 0; i < state.selectedCols.length; i++) {
                if (candidates.indexOf(state.selectedCols[i]) < 0) {
                    needsReset = true;
                    break;
                }
            }
        }
        if (needsReset) state.selectedCols = candidates.slice();

        const selectedSet = new Set(state.selectedCols);
        box.innerHTML = candidates.map(function (h) {
            const checked = selectedSet.has(h) ? 'checked' : '';
            return '<label class="mini-check"><input type="checkbox" class="col-cb" value="' +
                PC.escapeHtml(h) + '" ' + checked + '> ' + PC.escapeHtml(h) + '</label>';
        }).join('');

        box.querySelectorAll('.col-cb').forEach(function (cb) {
            cb.addEventListener('change', function () {
                state.selectedCols = Array.from(box.querySelectorAll('.col-cb:checked'))
                    .map(function (x) { return x.value; });
                redraw(app);
            });
        });
    }

    function initPaletteDropdown(app) {
        const container = app.$('paletteDropdownContainer');
        if (!container) return;
        if (!window.ContinuousPalette) {
            container.innerHTML = '<div style="color:#c00;padding:8px;">'
                + (EN ? 'Continuous palette component not loaded' : '连续色板组件未加载')
                + '</div>';
            return;
        }
        const validNames = window.ContinuousPalette.listNames();
        if (validNames.indexOf(state.paletteName) < 0) state.paletteName = validNames[0];
        if (validNames.indexOf(app.state.paletteName) < 0) app.state.paletteName = state.paletteName;

        window.ContinuousPalette.render(container, {
            selected: state.paletteName,
            onSelect: function (name) {
                state.paletteName = name;
                app.state.paletteName = name;
                HC.updateColorPreview(app, state);
                renderHeatmap(app);
            }
        });
    }

    function updatePaletteModeVisibility(app) {
        const preset = app.$('presetPaletteWrap');
        const c2 = app.$('custom2PaletteWrap');
        const c3 = app.$('custom3PaletteWrap');
        if (!preset || !c2 || !c3) return;
        preset.style.display = (state.paletteMode === 'preset') ? '' : 'none';
        c2.style.display = (state.paletteMode === 'custom2') ? '' : 'none';
        c3.style.display = (state.paletteMode === 'custom3') ? '' : 'none';
    }

    function renderHeatmap(app) {
        HC.refreshCorrHeatmap(app, state);
    }

    function redraw(app) {
        if (!app.state.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        const ok = HC.refreshCorrHeatmap(app, state);
        if (ok) app.showTip('msgTip3', T.drawDone, 'success');
        else app.showTip('msgTip3', T.noValid, 'error');
    }

    function syncOtherFromDom(app) {
        const $ = app.$;
        const num = (id, fb) => { const el = $(id); if (!el) return fb; const v = parseFloat(el.value); return isFinite(v) ? v : fb; };
        const chk = (id, fb) => { const el = $(id); return el ? el.checked : fb; };
        const val = (id, fb) => { const el = $(id); return el ? el.value : fb; };

        state.method = val('corrMethod', state.method);
        state.tableDecimals = parseInt(val('tableDecimals', state.tableDecimals), 10) || 2;
        state.reverseColors = chk('reverseColors', state.reverseColors);
        state.custom2Low = val('custom2Low', state.custom2Low);
        state.custom2High = val('custom2High', state.custom2High);
        state.custom3Low = val('custom3Low', state.custom3Low);
        state.custom3Mid = val('custom3Mid', state.custom3Mid);
        state.custom3High = val('custom3High', state.custom3High);
    }

    function bindParamEvents(app) {
        const matrixChk = app.$('inputIsMatrix');
        if (matrixChk) {
            matrixChk.addEventListener('change', function () {
                setMatrixModeLock(app, this.checked);
                if (app.state.data.length) renderHeatmap(app);
            });
        }

        ['corrMethod', 'reverseColors', 'chartWidth', 'chartHeight', 'showCanvasBorder', 'fontFamily']
            .forEach(function (id) {
                const el = app.$(id);
                if (!el) return;
                const evt = (el.type === 'number') ? 'input' : 'change';
                el.addEventListener(evt, function () {
                    syncOtherFromDom(app);
                    renderHeatmap(app);
                });
            });

        ['custom2Low', 'custom2High', 'custom3Low', 'custom3Mid', 'custom3High']
            .forEach(function (id) {
                const el = app.$(id);
                if (!el) return;
                el.addEventListener('input', function () {
                    syncOtherFromDom(app);
                    HC.updateColorPreview(app, state);
                    renderHeatmap(app);
                });
            });

        const decEl = app.$('tableDecimals');
        if (decEl) {
            decEl.addEventListener('change', function () {
                syncOtherFromDom(app);
                HC.renderCorrTable(app.$('corrTableWrap'), {
                    labels: state.labels, rMatrix: state.rMatrix,
                    pMatrix: state.pMatrix, decimals: state.tableDecimals
                });
            });
        }

        document.querySelectorAll('input[name="paletteMode"]').forEach(function (r) {
            r.addEventListener('change', function () {
                if (!this.checked) return;
                state.paletteMode = this.value;
                updatePaletteModeVisibility(app);
                HC.updateColorPreview(app, state);
                renderHeatmap(app);
            });
        });

        const exportBtn = app.$('exportTableBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                HC.exportCorrTableCsv({
                    labels: state.labels, rMatrix: state.rMatrix,
                    pMatrix: state.pMatrix, decimals: state.tableDecimals
                });
            });
        }

        const drawBtn = app.$('drawBtn');
        if (drawBtn) {
            drawBtn.addEventListener('click', function () { redraw(app); });
        }
    }

    PlotApp.create({
        exportName: 'correlation_heatmap',
        examples: [
            { label: EN ? 'Raw data example' : '原始数据示例', data: EXAMPLE_RAW },
            { label: EN ? 'Correlation matrix example' : '相关系数矩阵示例', data: EXAMPLE_MATRIX }
        ],
        importInfo: EN
            ? 'Paste a table with a header row. Two formats are supported:<br>' +
              '① <strong>Raw data</strong> (rows = samples, columns = variables). Correlation is computed in this page.<br>' +
              '② <strong>Pre-computed correlation matrix</strong> (first row & first column are variable names). Check the "Imported data is a correlation matrix" option at the top of step 2.<br>' +
              'The lower-left of the matrix is read as correlation coefficients, and the upper-right as significance p-values. <strong>Incorrect placement will produce wrong results.</strong><br>' +
              '<strong>If p-values are not available (e.g. upper-right is empty), the heatmap can still be drawn, but significance markers (stars / p-values / significance color blocks) will not be shown.</strong><br>' +
              'Built-in examples are based on the classic <strong>mtcars</strong> dataset.'
            : '粘贴带表头的表格。支持两种格式：<br>' +
              '① <strong>原始数据</strong>（行=样本，列=变量），将在本网页中计算相关系数。<br>' +
              '② <strong>已算好的相关系数矩阵</strong>（第一行与第一列为变量名），勾选第二步开头的“导入的是相关系数矩阵”。<br>' +
              '内置示例基于 <strong>mtcars</strong> 数据集。左下角数据将被识别为相关性系数，右上角被识别为显著性结果，<strong>如果输入错误将不能得到正确的结果</strong>。<br>' +
              '<strong>如果没有显著性 p 值（例如右上三角为空），仍可正常绘制热图，但图中不会显示显著性相关信息（星号 / p 值 / 显著性色块）。</strong>',

        stateExtra: {
            roles: { category: '', value: '' },
            axis: PlotAxis.defaultState(),
            paletteName: 'RdBu'
        },

        setup: function (app) {
            if (!state.colorBar && window.ColorBarSettings) state.colorBar = window.ColorBarSettings.defaults();
            if (!state.display && window.HeatmapCommon) state.display = window.HeatmapCommon.defaultDisplay();
            if (state.display && window.HeatmapCommon) {
                const def = window.HeatmapCommon.defaultDisplay();
                if (!state.display.thresholds) state.display.thresholds = def.thresholds;
                if (!state.display.diag)       state.display.diag       = def.diag;
                if (!state.display.cell)       state.display.cell       = def.cell;
                if (!state.display.labels)     state.display.labels     = def.labels;
                if (!state.display.areas)      state.display.areas      = def.areas;
            }
            state.colorBar = state.colorBar || {
                show: false, offset: { dx: 0, dy: 0 }, scale: 1,
                orientation: 'vertical', thickness: 16, length: 120,
                rangeAuto: true, min: -1, max: 1,
                tickAuto: true, tickCount: 3, tickCustom: '',
                decimals: 2, labelFontSize: 11
            };
            state.display = state.display || (window.HeatmapCommon ? window.HeatmapCommon.defaultDisplay() : null);

            Object.keys(state).forEach(function (k) {
                if (app.state[k] === undefined) app.state[k] = state[k];
                else state[k] = app.state[k];
            });
            app.state.colorBar = state.colorBar;
            app.state.display = state.display;

            if (window.HeatmapCommon) {
                window.HeatmapCommon.renderDisplayPanel('heatmapDisplayContainer', state.display);
                window.HeatmapCommon.bindDisplayPanel('heatmapDisplayContainer', state.display, function () {
                    renderHeatmap(app);
                });
            }
            if (window.ColorBarSettings) {
                window.ColorBarSettings.render('colorBarSettingsContainer', state.colorBar);
                window.ColorBarSettings.bind('colorBarSettingsContainer', state.colorBar, {
                    onChange: function () { renderHeatmap(app); }
                });
            }

            bindParamEvents(app);
            fillColumnSelect(app);

            if (app.$('globalSettingsPanel')) {
                PlotCommon.renderGlobalSettings('globalSettingsPanel');
                const cw = app.$('chartWidth');
                const ch = app.$('chartHeight');
                if (cw) cw.value = 700;
                if (ch) ch.value = 600;
            }

            setMatrixModeLock(app, !!state.inputIsMatrix);

            if (window.PlotBootstrap && PlotBootstrap.ensureD3) {
                PlotBootstrap.ensureD3().then(function () {
                    initPaletteDropdown(app);
                    updatePaletteModeVisibility(app);
                    HC.updateColorPreview(app, state);
                    renderHeatmap(app);
                });
            } else {
                initPaletteDropdown(app);
                updatePaletteModeVisibility(app);
                HC.updateColorPreview(app, state);
                renderHeatmap(app);
            }
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = (res && res.columnTypes) || {};
            state.selectedCols = [];
            fillColumnSelect(app);

            if (window.HeatmapCommon &&
                window.HeatmapCommon.detectMatrixFormat(res.headers, res.data)) {
                setMatrixModeLock(app, true);
                app.showTip('msgTip3', T.detectedMatrix, 'success');
            } else {
                setMatrixModeLock(app, false);
            }

            if (state.display && (!state.display.orderText || !state.display.orderText.trim())) {
                if (state.selectedCols.length) {
                    state.display.orderText = state.selectedCols.join(',');
                    const wrap = app.$('heatmapDisplayContainer');
                    const inp = wrap && wrap.querySelector('.hd-order-text');
                    if (inp) inp.value = state.display.orderText;
                }
            }

            redraw(app);
        },

        onReset: function (app) {
            state.selectedCols = [];
            state.labels = [];
            state.rMatrix = null;
            state.pMatrix = null;
            state.inputIsMatrix = false;
            setMatrixModeLock(app, false);

            if (state.colorBar) {
                state.colorBar.offset = { dx: 0, dy: 0 };
                state.colorBar.scale = 1;
            }
            fillColumnSelect(app);
            renderHeatmap(app);
        },

        onStateRestored: function (app) {
            Object.keys(state).forEach(function (k) {
                if (app.state[k] !== undefined) state[k] = app.state[k];
            });

            if (state.display && window.HeatmapCommon) {
                const def = window.HeatmapCommon.defaultDisplay();
                if (!state.display.thresholds) state.display.thresholds = def.thresholds;
                if (!state.display.diag)       state.display.diag       = def.diag;
                if (!state.display.cell)       state.display.cell       = def.cell;
                if (!state.display.labels)     state.display.labels     = def.labels;
                if (!state.display.areas)      state.display.areas      = def.areas;
            }

            if (window.HeatmapCommon) {
                window.HeatmapCommon.renderDisplayPanel('heatmapDisplayContainer', state.display);
                window.HeatmapCommon.bindDisplayPanel('heatmapDisplayContainer', state.display, function () {
                    renderHeatmap(app);
                });
            }
            if (window.ColorBarSettings) {
                window.ColorBarSettings.render('colorBarSettingsContainer', state.colorBar);
                window.ColorBarSettings.bind('colorBarSettingsContainer', state.colorBar, {
                    onChange: function () { renderHeatmap(app); }
                });
            }

            setMatrixModeLock(app, !!state.inputIsMatrix);
            initPaletteDropdown(app);
            updatePaletteModeVisibility(app);
            HC.updateColorPreview(app, state);

            document.querySelectorAll('input[name="paletteMode"]').forEach(function (r) {
                r.checked = (r.value === state.paletteMode);
            });

            renderHeatmap(app);
        },

        drawChart: function (app) {
            redraw(app);
        }
    });
})();
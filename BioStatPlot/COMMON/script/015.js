(function () {
    'use strict';

    const PC = window.PlotCommon;
    const PT = window.PlotTest;
    const BX = window.BoxCommon;
    const FT = window.PlotFacet;

    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Headers required. <strong>Category</strong>, <strong>Facet</strong> and <strong>Value</strong> are mandatory; <strong>Group</strong> and <strong>Replicate</strong> are optional.'
              + '<br>If your data is in <strong>wide format</strong>, please convert it first using the '
              + '<a href="../../en/022.Wide_long_table_reshaping.html" target="_blank" style="color:#1f4068;font-weight:600;">Wide-to-Long Table Converter</a>.'
            : '需包含表头。<strong>分类列</strong>、<strong>分面列</strong> 和 <strong>数值列</strong> 必填；<strong>分组列</strong> 和 <strong>重复标记列</strong> 可选。'
              + '<br>若您的数据为<strong>宽表</strong>形式，请先使用 '
              + '<a href="../../ch/022.Wide_long_table_reshaping.html" target="_blank" style="color:#1f4068;font-weight:600;">宽长表转换工具</a> 转换后再导入。',
        noData: EN ? '❌ Import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Select Category, Facet and Value' : '❌ 请选择分类列、分面列与数值列',
        noValid: EN ? '❌ No valid data' : '❌ 未能生成有效数据',
        colorEmpty: EN ? 'Category colors will be shown here after selecting data columns' : '选择数据列后将在此处显示每个类别的颜色',
        noGroup: EN ? 'None' : '无',
        noDataPlaceholder: EN ? '— Please import data first —' : '— 请先导入数据 —',

        plotTypePanelTitle: EN ? 'Plot Type' : '绘图类型',
        typeLabel: EN ? 'Type' : '类型',
        typeBox: EN ? 'Box plot' : '箱线图',
        typeViolin: EN ? 'Violin plot' : '小提琴图'
    };

    function makeExampleData() {
        const facets = ['F1', 'F2'];
        const cats = ['A', 'B', 'C'];
        const groups = ['Ctrl', 'Trt'];
        const reps = 10;
        const rows = ['Category\tGroup\tFacet\tRep\tValue'];
        let id = 1;
        facets.forEach(function (f, fi) {
            cats.forEach(function (c, ci) {
                groups.forEach(function (g) {
                    const base = 15 + ci * 5 + fi * 3;
                    const delta = (g === 'Trt')
                        ? (fi === 0 ? (ci === 0 ? 2 : ci === 1 ? 7 : 4)
                                    : (ci === 0 ? -6 : ci === 1 ? 1 : 9))
                        : 0;
                    for (let r = 0; r < reps; r++) {
                        const noise = Math.sin(id * 1.3) * 3.0;
                        const v = base + delta + noise;
                        rows.push([c, g, f, r + 1, v.toFixed(1)].join('\t'));
                        id++;
                    }
                });
            });
        });
        return rows.join('\n');
    }

    const EX = makeExampleData();

    function defaultPlotType() {
        return { type: 'box' };
    }

    function renderPlotTypePanel(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;

        const base = defaultPlotType();
        const st = opts.state || base;
        Object.keys(base).forEach(function (k) {
            if (st[k] === undefined) st[k] = base[k];
        });

        container.className = 'param-panel';
        container._settings = st;

        container.innerHTML = `
            <div class="param-panel-title">${T.plotTypePanelTitle}</div>
            <div class="param-grid cols-4">
                <div class="param-item">
                    <label>${T.typeLabel}</label>
                    <select class="ptp-type">
                        <option value="box" ${st.type === 'box' ? 'selected' : ''}>${T.typeBox}</option>
                        <option value="violin" ${st.type === 'violin' ? 'selected' : ''}>${T.typeViolin}</option>
                    </select>
                </div>
            </div>
        `;

        const sel = container.querySelector('.ptp-type');
        if (sel) sel.addEventListener('change', function () {
            st.type = this.value;
            opts.onChange && opts.onChange();
        });
    }

    function readPlotTypeSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return defaultPlotType();
        const st = container._settings || defaultPlotType();
        const sel = container.querySelector('.ptp-type');
        if (sel) st.type = sel.value;
        return st;
    }

    function readParams(app) {
        const p = Object.assign({},
            PC.readCanvasParams(app, 900, 700),
            PC.readTitleLegendParams(app)
        );
        p.plotType = readPlotTypeSettings(app.$('plotTypePanelContainer'));
        p.facet = FT.readSettings(app.$('facetPanelContainer'));
        p.box = (BX && BX.readBoxSettings) ? BX.readBoxSettings(app.$('boxPanelContainer')) : BX.defaultBoxSettings();
        p.violin = (BX && BX.readViolinSettings) ? BX.readViolinSettings(app.$('violinPanelContainer')) : BX.defaultViolinSettings();
        p.test = (PT && PT.readSettings) ? PT.readSettings(app.$('testPanelContainer')) : { enabled: false };
        return p;
    }

    function fillRoleSelects(app) {
        const s = app.state;
        const xSel = app.$('xColSel');
        const gSel = app.$('groupColSel');
        const fSel = app.$('facetColSel');
        const ySel = app.$('yColSel');
        if (!xSel || !gSel || !fSel || !ySel) return;

        if (!s.headers.length) {
            xSel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            gSel.innerHTML = '<option value="">' + T.noGroup + '</option>';
            fSel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            ySel.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
            xSel.disabled = gSel.disabled = fSel.disabled = ySel.disabled = true;
            return;
        }
        xSel.disabled = gSel.disabled = fSel.disabled = ySel.disabled = false;

        const buildOpts = function (cur, allowEmpty) {
            let html = allowEmpty ? '<option value="">' + T.noGroup + '</option>' : '';
            html += s.headers.map(function (h) {
                return '<option value="' + PlotCommon.escapeHtml(h) + '"' +
                    (h === cur ? ' selected' : '') + '>' +
                    PlotCommon.escapeHtml(h) + '</option>';
            }).join('');
            return html;
        };

        xSel.innerHTML = buildOpts(s.roles.x || '', false);
        gSel.innerHTML = buildOpts(s.roles.group || '', true);
        fSel.innerHTML = buildOpts(s.roles.facet || '', false);
        ySel.innerHTML = buildOpts(s.roles.y || '', false);
    }

    function hideAxisDirection(app) {
        const panel = app.$('axisPanelContainer');
        if (!panel) return;
        const dir = panel.querySelector('.axis-direction-block');
        if (dir) dir.style.display = 'none';
    }

    function drawChart(app) {
        const s = app.state;
        app.toolbarTip.textContent = '';
        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.x || !s.roles.y || !s.roles.facet) {
            app.showTip('msgTip3', T.selectCols, 'error');
            return;
        }

        const p = readParams(app);
        const axisCfg = s.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        const facetData = FT.prepareFacets(app, s.roles.facet);
        if (!facetData || !facetData.facets.length) {
            app.showTip('msgTip3', T.noValid, 'error');
            return;
        }

        const isViolin = p.plotType.type === 'violin';
        const bx = isViolin ? p.violin : p.box;

        facetData.facets.forEach(function (f) {
            f.cells.forEach(function (c) {
                c._boxStats = BX.computeBoxStats(c.values);
                if (isViolin) {
                    c._kde = BX.computeKDE(c.values, {
                        bandwidthMode: bx.violinBandwidthMode,
                        bandwidth: bx.violinBandwidth,
                        trim: bx.violinTrim
                    });
                }
            });
        });

        FT.drawFaceted(app, p, axisCfg, facetData, {
            isViolin: isViolin,
            bx: bx,
            legendShape: isViolin ? (bx.boxOverlay ? 'box' : 'rect') : 'box',
            drawShapeV: drawShapeVertical,
            drawShapeH: drawShapeHorizontal
        });

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    function drawShapeVertical(shapesG, c) {
        const pos = new Map();
        c.cells.forEach(function (cell, ci) {
            const xPos = c.xOuter(cell.x);
            const fullBandW = c.hasGroup ? c.xInner.bandwidth() : c.xOuter.bandwidth();
            const originX = c.hasGroup ? xPos + c.xInner(cell.g) : xPos;
            let bandW = fullBandW * (c.isViolin ? c.bx.violinWidthScale : c.bx.boxWidthScale);
            const cap = c.isViolin ? 70 : 42;
            if (bandW > cap) bandW = cap;
            const cx = originX + fullBandW / 2;
            const color = c.colorOf(c.hasGroup ? cell.g : cell.x);

            if (c.isViolin) {
                if (cell._kde) {
                    BX.drawViolin(shapesG, {
                        cx: cx, halfW: bandW / 2,
                        kde: cell._kde,
                        stats: cell._boxStats,
                        yScale: c.valueScale,
                        color: color,
                        settings: c.bx,
                        seed: c.fi * 1000 + ci * 97.3 + 1
                    });
                }
            } else {
                BX.drawBox(shapesG, {
                    cx: cx, boxW: bandW,
                    stats: cell._boxStats,
                    yScale: c.valueScale,
                    color: color,
                    settings: c.bx,
                    seed: c.fi * 1000 + ci * 97.3 + 1
                });
            }

            let yTopPx = c.valueScale(cell._boxStats.whiskerHi);
            if (c.isViolin && cell._kde && cell._kde.xs.length) {
                const kt = c.valueScale(cell._kde.xs[cell._kde.xs.length - 1]);
                if (kt < yTopPx) yTopPx = kt;
            }
            pos.set(cell, { x: cx, yTop: yTopPx });
        });
        return pos;
    }

    function drawShapeHorizontal(shapesG, c) {
        const pos = new Map();
        c.cells.forEach(function (cell, ci) {
            const yPos = c.yOuter(cell.x);
            const fullBandH = c.hasGroup ? c.yInner.bandwidth() : c.yOuter.bandwidth();
            const originY = c.hasGroup ? yPos + c.yInner(cell.g) : yPos;
            let bandH = fullBandH * (c.isViolin ? c.bx.violinWidthScale : c.bx.boxWidthScale);
            const cap = c.isViolin ? 70 : 42;
            if (bandH > cap) bandH = cap;
            const cy = originY + fullBandH / 2;
            const color = c.colorOf(c.hasGroup ? cell.g : cell.x);

            if (c.isViolin) {
                if (cell._kde) {
                    BX.drawViolinHorizontal(shapesG, {
                        cy: cy, halfH: bandH / 2,
                        kde: cell._kde,
                        stats: cell._boxStats,
                        xScale: c.valueScale,
                        color: color,
                        settings: c.bx,
                        seed: c.fi * 1000 + ci * 97.3 + 1
                    });
                }
            } else {
                BX.drawBoxHorizontal(shapesG, {
                    cy: cy, boxH: bandH,
                    stats: cell._boxStats,
                    xScale: c.valueScale,
                    color: color,
                    settings: c.bx,
                    seed: c.fi * 1000 + ci * 97.3 + 1
                });
            }

            let xRightPx = c.valueScale(cell._boxStats.whiskerHi);
            if (c.isViolin && cell._kde && cell._kde.xs.length) {
                const kt = c.valueScale(cell._kde.xs[cell._kde.xs.length - 1]);
                if (kt > xRightPx) xRightPx = kt;
            }
            pos.set(cell, { x: xRightPx, y: cy });
        });
        return pos;
    }

    function refreshShapePanel(app) {
        const type = app.state.plotType.type;
        const boxC = app.$('boxPanelContainer');
        const violinC = app.$('violinPanelContainer');
        if (!boxC || !violinC) return;

        if (type === 'violin') {
            boxC.style.display = 'none';
            violinC.style.display = '';
            BX.renderViolinPanel(violinC, {
                state: app.state.violin,
                onChange: function () {
                    if (app.state.currentSvg) app.drawChart();
                }
            });
        } else {
            violinC.style.display = 'none';
            boxC.style.display = '';
            BX.renderBoxPanel(boxC, {
                state: app.state.box,
                onChange: function () {
                    if (app.state.currentSvg) app.drawChart();
                }
            });
        }
    }

    function refreshPlotTypePanel(app) {
        const container = app.$('plotTypePanelContainer');
        if (!container) return;
        renderPlotTypePanel(container, {
            state: app.state.plotType,
            onChange: function () {
                refreshShapePanel(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    function refreshFacetPanel(app) {
        const container = app.$('facetPanelContainer');
        if (!container) return;
        FT.renderFacetPanel(container, {
            state: app.state.facet,
            onChange: function () {
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    function refreshTestPanel(app) {
        const container = app.$('testPanelContainer');
        if (!container) return;
        if (PT && PT.renderTestPanel) {
            PT.renderTestPanel(container, {
                app: app,
                state: app.state.test,
                controlValues: PT.getControlCandidates(app),
                onChange: function () {
                    if (app.state.currentSvg) app.drawChart();
                }
            });
        }
    }

    PlotApp.create({
        exportName: 'faceted_box_violin_chart',
        exampleData: EX,
        importInfo: T.importInfo,

        stateExtra: (function () {
            const base = BarCommon.createStateExtra();
            base.roles = { x: '', group: '', y: '', rep: '', facet: '' };
            base.test = (PT && PT.defaultSettings) ? PT.defaultSettings() : { enabled: false };
            base.box = (BX && BX.defaultBoxSettings) ? BX.defaultBoxSettings() : {};
            base.violin = (BX && BX.defaultViolinSettings) ? BX.defaultViolinSettings() : {};
            base.plotType = defaultPlotType();
            base.facet = FT.defaultSettings();
            return base;
        })(),

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (app.state.legendTitleEdited) return;
            if (input) input.value = app.state.roles.group || app.state.roles.x || '';
        },

        setup: function (app) {
            fillRoleSelects(app);
            PT.fillRepSelect(app);

            ['catOrder', 'groupOrder', 'facetOrder'].forEach(function (id) {
                const el = app.$(id);
                if (el) el.addEventListener('input', function () {
                    if (app.state.currentSvg) app.drawChart();
                });
            });

            const xSel = app.$('xColSel');
            if (xSel) xSel.addEventListener('change', function () {
                app.state.roles.x = xSel.value;
                app.state.customColors = {};
                app.syncLegendTitle();
                refreshTestPanel(app);
                if (app.state.currentSvg) app.drawChart();
                app.refreshColors(app);
            });
            const gSel = app.$('groupColSel');
            if (gSel) gSel.addEventListener('change', function () {
                app.state.roles.group = gSel.value;
                app.state.customColors = {};
                app.syncLegendTitle();
                refreshTestPanel(app);
                if (app.state.currentSvg) app.drawChart();
                app.refreshColors(app);
            });
            const fSel = app.$('facetColSel');
            if (fSel) fSel.addEventListener('change', function () {
                app.state.roles.facet = fSel.value;
                if (app.state.currentSvg) app.drawChart();
            });
            const ySel = app.$('yColSel');
            if (ySel) ySel.addEventListener('change', function () {
                app.state.roles.y = ySel.value;
                app.state.customColors = {};
                refreshTestPanel(app);
                if (app.state.currentSvg) app.drawChart();
                app.refreshColors(app);
            });
            const repSel = app.$('repColSel');
            if (repSel) repSel.addEventListener('change', function () {
                app.state.roles.rep = repSel.value;
                refreshTestPanel(app);
                if (app.state.currentSvg) app.drawChart();
            });

            BarCommon.refreshAxisPanel(app);
            hideAxisDirection(app);
            refreshPlotTypePanel(app);
            refreshFacetPanel(app);
            refreshShapePanel(app);
            refreshTestPanel(app);
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = res.columnTypes || {};
            const cats = res.headers.filter(function (h) {
                return s.columnTypes[h] === 'categorical' || s.columnTypes[h] === 'date';
            });
            const nums = res.headers.filter(function (h) { return s.columnTypes[h] === 'numeric'; });
            s.roles.x = cats[0] || res.headers[0];
            s.roles.group = cats[1] || '';
            s.roles.facet = cats[2] || cats[1] || '';
            s.roles.y = res.headers[res.headers.length - 1] || nums[0] || res.headers[0];
            s.roles.rep = '';
            s.customColors = {};
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;

            app.syncLegendTitle();
            BarCommon.syncAxisTitlesByDirection(app);
            fillRoleSelects(app);
            PT.fillRepSelect(app);

            const seenX = new Set(), catsOut = [];
            res.data.forEach(function (r) {
                const val = r[s.roles.x];
                if (val === undefined || val === null || val === '') return;
                const t = String(val);
                if (!seenX.has(t)) { seenX.add(t); catsOut.push(t); }
            });
            const catOrderEl = app.$('catOrder');
            if (catOrderEl) catOrderEl.value = catsOut.join(',');

            const grpOrderEl = app.$('groupOrder');
            if (grpOrderEl) {
                if (s.roles.group) {
                    const seenG = new Set(), grps = [];
                    res.data.forEach(function (r) {
                        const val = r[s.roles.group];
                        if (val === undefined || val === null || val === '') return;
                        const t = String(val);
                        if (!seenG.has(t)) { seenG.add(t); grps.push(t); }
                    });
                    grpOrderEl.value = grps.join(',');
                } else {
                    grpOrderEl.value = '';
                }
            }

            const facetOrderEl = app.$('facetOrder');
            if (facetOrderEl) {
                if (s.roles.facet) {
                    const seenF = new Set(), fs = [];
                    res.data.forEach(function (r) {
                        const val = r[s.roles.facet];
                        if (val === undefined || val === null || val === '') return;
                        const t = String(val);
                        if (!seenF.has(t)) { seenF.add(t); fs.push(t); }
                    });
                    facetOrderEl.value = fs.join(',');
                } else {
                    facetOrderEl.value = '';
                }
            }

            BarCommon.refreshAxisPanel(app);
            hideAxisDirection(app);
            refreshPlotTypePanel(app);
            refreshFacetPanel(app);
            refreshShapePanel(app);
            refreshTestPanel(app);
        },

        onReset: function (app) {
            const s = app.state;
            s.columnTypes = {};
            s.roles = { x: '', group: '', y: '', rep: '', facet: '' };
            s.customColors = {};
            s.axis = PlotAxis.defaultState();
            s.axis.x.titleEdited = false;
            s.axis.y.titleEdited = false;
            s.test = (PT && PT.defaultSettings) ? PT.defaultSettings() : { enabled: false };
            s.box = (BX && BX.defaultBoxSettings) ? BX.defaultBoxSettings() : {};
            s.violin = (BX && BX.defaultViolinSettings) ? BX.defaultViolinSettings() : {};
            s.plotType = defaultPlotType();
            s.facet = FT.defaultSettings();

            ['catOrder', 'groupOrder', 'facetOrder'].forEach(function (id) {
                const el = app.$(id);
                if (el) el.value = '';
            });

            fillRoleSelects(app);
            PT.fillRepSelect(app);
            BarCommon.refreshAxisPanel(app);
            hideAxisDirection(app);
            refreshPlotTypePanel(app);
            refreshFacetPanel(app);
            refreshShapePanel(app);
            refreshTestPanel(app);
        },

        onStateRestored: function (app) {
            fillRoleSelects(app);
            PT.fillRepSelect(app);
            BarCommon.refreshAxisPanel(app);
            hideAxisDirection(app);
            refreshPlotTypePanel(app);
            refreshFacetPanel(app);
            refreshShapePanel(app);
            refreshTestPanel(app);
        },

        refreshColors: function (app) {
            BarCommon.refreshGroupColors(app, T.colorEmpty);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
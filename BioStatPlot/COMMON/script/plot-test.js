(function (global) {
    'use strict';

    function SC() {
        if (!global.StatCommon) throw new Error('[PlotTest] stat-common.js required');
        return global.StatCommon;
    }
    function ST() {
        if (!global.StatTest) throw new Error('[PlotTest] stat-test.js required');
        return global.StatTest;
    }

    function isEn() { return window.location.pathname.indexOf('/en/') >= 0; }

    const I18N = {
        zh: {
            panelTitle: '显著性检验',
            enable: '启用显著性检验',
            method: '检验方法',
            methodT: 't检验',
            methodW: 'Wilcoxon秩和检验',
            paired: '配对检验',
            pairedNoRep: '未指定重复标记列，配对检验不可用',
            pairedInconsistent: '各分组重复标记不一致，配对检验不可用',
            pairedInconsistentAt: '分类 {x} 内重复标记不一致，配对检验不可用',
            pairedIncomplete: '重复标记数量与观测值数量不匹配，配对检验不可用',
            pairedIncompleteAt: '分类 {x} 内重复标记不完整，配对检验不可用',
            alternative: '尾数',
            altTwo: '双尾',
            altGreater: '单尾（前 > 后）',
            altLess: '单尾（前 < 后）',
            adjust: 'P值校正',
            adjustNone: '不校正',
            adjustBonf: 'Bonferroni',
            adjustHolm: 'Holm',
            adjustBH: 'Benjamini-Hochberg (FDR)',
            sigLevel: '显著性水平',
            compareMode: '比较方式',
            compareAll: '全部两两比较',
            compareCtrl: '仅与对照组比较',
            controlValue: '对照组',
            noCtrl: '无',
            showMode: '结果显示',
            showAll: '显示全部',
            showSig: '仅显示显著',
            labelMode: '显示内容',
            labelStars: '显著性标记（*）',
            labelP: 'P值',
            labelBoth: '标记 + P值',
            brkTitle: '显著性线条样式',
            brkColor: '颜色',
            brkWidth: '线宽',
            brkFontSize: '字号',
            brkBold: '粗',
            brkItalic: '斜',
            brkSpacing: '间距',
            brkHeight: '高度',
            noData: '— 请先导入数据 —',
            noRepCol: '无',

            ebTitle: '误差棒（由重复值计算）',
            ebType: '类型',
            ebSD: '标准差（SD）',
            ebSEM: '标准误（SEM）',
            ebShow: '显示方式',
            ebShowBoth: '上下限都显示',
            ebShowUpper: '仅上限',
            ebShowLower: '仅下限',
            ebColorMode: '颜色模式',
            ebColorUniform: '统一颜色',
            ebColorBar: '与柱子同色',
            ebColor: '颜色',
            ebWidth: '线宽',
            ebCapWidth: '帽宽'
        },
        en: {
            panelTitle: 'Significance Test',
            enable: 'Enable significance test',
            method: 'Method',
            methodT: 't-test',
            methodW: 'Wilcoxon rank-sum',
            paired: 'Paired',
            pairedNoRep: 'No replicate column; paired test unavailable',
            pairedInconsistent: 'Replicate labels inconsistent across groups; paired test unavailable',
            pairedInconsistentAt: 'Replicate labels inconsistent within category {x}; paired test unavailable',
            pairedIncomplete: 'Replicate labels do not match observation count; paired test unavailable',
            pairedIncompleteAt: 'Replicate labels incomplete within category {x}; paired test unavailable',
            alternative: 'Tails',
            altTwo: 'Two-tailed',
            altGreater: 'One-tailed (first > second)',
            altLess: 'One-tailed (first < second)',
            adjust: 'P adjustment',
            adjustNone: 'None',
            adjustBonf: 'Bonferroni',
            adjustHolm: 'Holm',
            adjustBH: 'Benjamini-Hochberg (FDR)',
            sigLevel: 'Significance level',
            compareMode: 'Comparison',
            compareAll: 'All pairwise',
            compareCtrl: 'Vs. control',
            controlValue: 'Control',
            noCtrl: 'None',
            showMode: 'Display',
            showAll: 'All',
            showSig: 'Significant only',
            labelMode: 'Label',
            labelStars: 'Stars',
            labelP: 'P-value',
            labelBoth: 'Stars + P-value',
            brkTitle: 'Bracket style',
            brkColor: 'Color',
            brkWidth: 'Width',
            brkFontSize: 'Font',
            brkBold: 'B',
            brkItalic: 'I',
            brkSpacing: 'Spacing',
            brkHeight: 'Height',
            noData: '— Please import data first —',
            noRepCol: 'None',

            ebTitle: 'Error Bars (computed from replicates)',
            ebType: 'Type',
            ebSD: 'Standard deviation (SD)',
            ebSEM: 'Standard error (SEM)',
            ebShow: 'Display',
            ebShowBoth: 'Both sides',
            ebShowUpper: 'Upper only',
            ebShowLower: 'Lower only',
            ebColorMode: 'Color mode',
            ebColorUniform: 'Uniform',
            ebColorBar: 'Same as bar',
            ebColor: 'Color',
            ebWidth: 'Width',
            ebCapWidth: 'Cap width'
        }
    };

    function L() { return I18N[isEn() ? 'en' : 'zh']; }

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function defaultSettings() {
        return {
            enabled: false,
            method: 't',
            paired: false,
            alternative: 'two-sided',
            adjust: 'none',
            sigLevel: 0.05,
            compareMode: 'all',
            controlValue: '',
            showMode: 'all',
            labelMode: 'stars',
            brkColor: '#333333',
            brkWidth: 1.5,
            brkFontSize: 12,
            brkBold: false,
            brkItalic: false,
            brkSpacing: 8,
            brkHeight: 8
        };
    }

    function defaultErrBarSettings() {
        return {
            mode: 'computed',
            errType: 'sd',
            showWhich: 'both',
            colorMode: 'uniform',
            errColor: '#333333',
            errWidth: 1.5,
            capWidth: 8
        };
    }

    function renderTestPanel(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;

        const T = L();
        const st = Object.assign(defaultSettings(), opts.state || {});
        const ctrlValues = opts.controlValues || [];

        let pairingInfo;
        if (opts.app) {
            pairingInfo = checkPairing(opts.app);
        } else if (opts.pairingInfo) {
            pairingInfo = opts.pairingInfo;
        } else {
            pairingInfo = { ok: false, reason: 'noRep' };
        }
        const canPair = pairingInfo.ok === true;
        if (!canPair) st.paired = false;

        let pairedHint = '';
        if (!canPair) {
            const reason = pairingInfo.reason || 'noRep';
            const at = pairingInfo.at;
            if (reason === 'inconsistent') {
                pairedHint = at
                    ? T.pairedInconsistentAt.replace('{x}', at)
                    : T.pairedInconsistent;
            } else if (reason === 'incomplete') {
                pairedHint = at
                    ? T.pairedIncompleteAt.replace('{x}', at)
                    : T.pairedIncomplete;
            } else {
                pairedHint = T.pairedNoRep;
            }
        }

        container.className = 'param-panel';
        container.innerHTML = `
            <div class="param-panel-title">${T.panelTitle}</div>
            <div class="param-inline" style="margin-bottom:8px;">
                <label><input type="checkbox" class="pt-enable" ${st.enabled ? 'checked' : ''}>${T.enable}</label>
            </div>
            <div class="pt-body" style="${st.enabled ? '' : 'display:none;'}">
                <div class="param-grid cols-4" style="margin-bottom:8px;">
                    <div class="param-item">
                        <label>${T.method}</label>
                        <select class="pt-method">
                            <option value="t" ${st.method === 't' ? 'selected' : ''}>${T.methodT}</option>
                            <option value="wilcoxon" ${st.method === 'wilcoxon' ? 'selected' : ''}>${T.methodW}</option>
                        </select>
                    </div>
                    <div class="param-item">
                        <label>${T.alternative}</label>
                        <select class="pt-alt">
                            <option value="two-sided" ${st.alternative === 'two-sided' ? 'selected' : ''}>${T.altTwo}</option>
                            <option value="greater" ${st.alternative === 'greater' ? 'selected' : ''}>${T.altGreater}</option>
                            <option value="less" ${st.alternative === 'less' ? 'selected' : ''}>${T.altLess}</option>
                        </select>
                    </div>
                    <div class="param-item">
                        <label>${T.adjust}</label>
                        <select class="pt-adjust">
                            <option value="none" ${st.adjust === 'none' ? 'selected' : ''}>${T.adjustNone}</option>
                            <option value="bonferroni" ${st.adjust === 'bonferroni' ? 'selected' : ''}>${T.adjustBonf}</option>
                            <option value="holm" ${st.adjust === 'holm' ? 'selected' : ''}>${T.adjustHolm}</option>
                            <option value="bh" ${st.adjust === 'bh' ? 'selected' : ''}>${T.adjustBH}</option>
                        </select>
                    </div>
                    <div class="param-item">
                        <label>${T.sigLevel}</label>
                        <input type="number" class="pt-sig-level" value="${st.sigLevel}" min="0.001" max="0.5" step="0.001">
                    </div>
                </div>
                <div class="param-inline" style="margin-bottom:8px;">
                    <label class="mini-check" ${canPair ? '' : 'title="' + esc(pairedHint) + '"'}>
                        <input type="checkbox" class="pt-paired"
                            ${st.paired ? 'checked' : ''}
                            ${canPair ? '' : 'disabled'}>
                        ${T.paired}
                    </label>
                    ${canPair ? '' : `<span style="font-size:12px;color:#d93025;margin-left:8px;">${esc(pairedHint)}</span>`}
                </div>
                <div class="param-grid cols-4" style="margin-bottom:8px;">
                    <div class="param-item">
                        <label>${T.compareMode}</label>
                        <select class="pt-compare-mode">
                            <option value="all" ${st.compareMode === 'all' ? 'selected' : ''}>${T.compareAll}</option>
                            <option value="vsControl" ${st.compareMode === 'vsControl' ? 'selected' : ''}>${T.compareCtrl}</option>
                        </select>
                    </div>
                    <div class="param-item pt-ctrl-item" style="${st.compareMode === 'vsControl' ? '' : 'display:none;'}">
                        <label>${T.controlValue}</label>
                        <select class="pt-control-value">
                            ${ctrlValues.length
                                ? ctrlValues.map(v => `<option value="${esc(v)}" ${v === st.controlValue ? 'selected' : ''}>${esc(v)}</option>`).join('')
                                : `<option value="">${T.noCtrl}</option>`}
                        </select>
                    </div>
                    <div class="param-item">
                        <label>${T.showMode}</label>
                        <select class="pt-show-mode">
                            <option value="all" ${st.showMode === 'all' ? 'selected' : ''}>${T.showAll}</option>
                            <option value="sig" ${st.showMode === 'sig' ? 'selected' : ''}>${T.showSig}</option>
                        </select>
                    </div>
                    <div class="param-item">
                        <label>${T.labelMode}</label>
                        <select class="pt-label-mode">
                            <option value="stars" ${st.labelMode === 'stars' ? 'selected' : ''}>${T.labelStars}</option>
                            <option value="p" ${st.labelMode === 'p' ? 'selected' : ''}>${T.labelP}</option>
                            <option value="both" ${st.labelMode === 'both' ? 'selected' : ''}>${T.labelBoth}</option>
                        </select>
                    </div>
                </div>
                <div class="axis-subsection">${T.brkTitle}</div>
                <div class="param-grid cols-4">
                    <div class="param-item"><label>${T.brkColor}</label>
                        <input type="color" class="pt-brk-color" value="${st.brkColor}"></div>
                    <div class="param-item"><label>${T.brkWidth}</label>
                        <input type="number" class="pt-brk-width" value="${st.brkWidth}" min="0.5" max="6" step="0.5"></div>
                    <div class="param-item"><label>${T.brkFontSize}</label>
                        <input type="number" class="pt-brk-fontsize" value="${st.brkFontSize}" min="6" max="24"></div>
                    <div class="param-item"><label>${T.brkSpacing}</label>
                        <input type="number" class="pt-brk-spacing" value="${st.brkSpacing}" min="2" max="30" step="1"></div>
                    <div class="param-item"><label>${T.brkHeight}</label>
                        <input type="number" class="pt-brk-height" value="${st.brkHeight}" min="2" max="30" step="1"></div>
                </div>
                <div class="param-inline" style="margin-top:4px;">
                    <label class="mini-check"><input type="checkbox" class="pt-brk-bold" ${st.brkBold ? 'checked' : ''}>${T.brkBold}</label>
                    <label class="mini-check"><input type="checkbox" class="pt-brk-italic" ${st.brkItalic ? 'checked' : ''}>${T.brkItalic}</label>
                </div>
            </div>
        `;

        container._settings = st;

        const enableCb = container.querySelector('.pt-enable');
        const body = container.querySelector('.pt-body');
        enableCb.addEventListener('change', () => {
            body.style.display = enableCb.checked ? '' : 'none';
            opts.onChange && opts.onChange();
        });

        const compareSel = container.querySelector('.pt-compare-mode');
        const ctrlItem = container.querySelector('.pt-ctrl-item');
        compareSel.addEventListener('change', () => {
            ctrlItem.style.display = compareSel.value === 'vsControl' ? '' : 'none';
        });

        container.querySelectorAll('input, select').forEach(el => {
            if (el === enableCb) return;
            el.addEventListener('change', () => opts.onChange && opts.onChange());
        });
    }

    function readSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return defaultSettings();
        const st = container._settings || defaultSettings();
        const qv = s => { const e = container.querySelector(s); return e ? e.value : undefined; };
        const qc = s => { const e = container.querySelector(s); return e ? e.checked : false; };
        const qn = (s, fb) => {
            const e = container.querySelector(s);
            if (!e) return fb;
            const v = parseFloat(e.value);
            return isFinite(v) ? v : fb;
        };
        st.enabled      = qc('.pt-enable');
        st.method       = qv('.pt-method') || 't';
        const pairedEl  = container.querySelector('.pt-paired');
        st.paired       = (pairedEl && !pairedEl.disabled) ? pairedEl.checked : false;
        st.alternative  = qv('.pt-alt') || 'two-sided';
        st.adjust       = qv('.pt-adjust') || 'none';
        st.sigLevel     = qn('.pt-sig-level', 0.05);
        st.compareMode  = qv('.pt-compare-mode') || 'all';
        st.controlValue = qv('.pt-control-value') || '';
        st.showMode     = qv('.pt-show-mode') || 'all';
        st.labelMode    = qv('.pt-label-mode') || 'stars';
        st.brkColor     = qv('.pt-brk-color') || '#333333';
        st.brkWidth     = qn('.pt-brk-width', 1.5);
        st.brkFontSize  = qn('.pt-brk-fontsize', 12);
        st.brkSpacing   = qn('.pt-brk-spacing', 8);
        st.brkHeight    = qn('.pt-brk-height', 8);
        st.brkBold      = qc('.pt-brk-bold');
        st.brkItalic    = qc('.pt-brk-italic');
        return st;
    }

    function renderErrBarPanel(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;

        const T = L();
        const st = Object.assign(defaultErrBarSettings(), opts.state || {});
        st.mode = 'computed';

        container.className = 'param-panel';
        container._settings = st;

        container.innerHTML = `
            <div class="param-panel-title">${T.ebTitle}</div>
            <div class="param-grid cols-4">
                <div class="param-item">
                    <label>${T.ebType}</label>
                    <select class="eb-err-type">
                        <option value="sd" ${st.errType === 'sd' ? 'selected' : ''}>${T.ebSD}</option>
                        <option value="sem" ${st.errType === 'sem' ? 'selected' : ''}>${T.ebSEM}</option>
                    </select>
                </div>
                <div class="param-item">
                    <label>${T.ebShow}</label>
                    <select class="eb-show-which">
                        <option value="both" ${st.showWhich === 'both' ? 'selected' : ''}>${T.ebShowBoth}</option>
                        <option value="upper" ${st.showWhich === 'upper' ? 'selected' : ''}>${T.ebShowUpper}</option>
                        <option value="lower" ${st.showWhich === 'lower' ? 'selected' : ''}>${T.ebShowLower}</option>
                    </select>
                </div>
                <div class="param-item">
                    <label>${T.ebColorMode}</label>
                    <select class="eb-color-mode">
                        <option value="uniform" ${st.colorMode === 'uniform' ? 'selected' : ''}>${T.ebColorUniform}</option>
                        <option value="sameAsBar" ${st.colorMode === 'sameAsBar' ? 'selected' : ''}>${T.ebColorBar}</option>
                    </select>
                </div>
                <div class="param-item eb-color-opt">
                    <label>${T.ebColor}</label>
                    <input type="color" class="eb-color" value="${st.errColor}">
                </div>
                <div class="param-item">
                    <label>${T.ebWidth}</label>
                    <input type="number" class="eb-width" value="${st.errWidth}" min="0.5" max="12" step="0.5">
                </div>
                <div class="param-item">
                    <label>${T.ebCapWidth}</label>
                    <input type="number" class="eb-cap-w" value="${st.capWidth}" min="0" max="40" step="1">
                </div>
            </div>
        `;

        const colorOpt = container.querySelector('.eb-color-opt');
        const colorModeSel = container.querySelector('.eb-color-mode');
        function updateColorVisibility() {
            if (!colorOpt) return;
            colorOpt.style.display = (st.colorMode === 'uniform') ? '' : 'none';
        }
        if (colorModeSel) {
            colorModeSel.addEventListener('change', function () {
                st.colorMode = this.value;
                updateColorVisibility();
                opts.onChange && opts.onChange();
            });
        }
        updateColorVisibility();

        const bind = (sel, key) => {
            const el = container.querySelector(sel);
            if (!el) return;
            el.addEventListener('change', function () {
                st[key] = this.value;
                opts.onChange && opts.onChange();
            });
        };
        bind('.eb-err-type', 'errType');
        bind('.eb-show-which', 'showWhich');

        const colorInput = container.querySelector('.eb-color');
        if (colorInput) {
            colorInput.addEventListener('input', function () {
                st.errColor = this.value;
                opts.onChange && opts.onChange();
            });
        }
        const widthInput = container.querySelector('.eb-width');
        if (widthInput) {
            widthInput.addEventListener('change', function () {
                const v = parseFloat(this.value);
                st.errWidth = (isFinite(v) && v > 0) ? v : 1.5;
                opts.onChange && opts.onChange();
            });
        }
        const capWInput = container.querySelector('.eb-cap-w');
        if (capWInput) {
            capWInput.addEventListener('change', function () {
                const v = parseFloat(this.value);
                st.capWidth = (isFinite(v) && v >= 0) ? v : 8;
                opts.onChange && opts.onChange();
            });
        }
    }

    function readErrBarSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return defaultErrBarSettings();
        const st = container._settings || defaultErrBarSettings();
        const qv = s => { const e = container.querySelector(s); return e ? e.value : undefined; };
        const qn = (s, fb) => {
            const e = container.querySelector(s);
            if (!e) return fb;
            const v = parseFloat(e.value);
            return isFinite(v) ? v : fb;
        };
        st.mode      = 'computed';
        st.errType   = qv('.eb-err-type') || st.errType || 'sd';
        st.showWhich = qv('.eb-show-which') || st.showWhich || 'both';
        st.colorMode = qv('.eb-color-mode') || st.colorMode || 'uniform';
        st.errColor  = qv('.eb-color') || st.errColor || '#333333';
        st.errWidth  = qn('.eb-width', st.errWidth || 1.5);
        st.capWidth  = qn('.eb-cap-w', st.capWidth || 8);
        return st;
    }

    function prepareCells(app, opts) {
        opts = opts || {};
        const s = app.state;
        const xCol = opts.xCol || s.roles.x;
        const gCol = (opts.groupCol !== undefined) ? opts.groupCol : s.roles.group;
        const yCol = opts.yCol || s.roles.y;
        const repCol = (opts.repCol !== undefined) ? opts.repCol : s.roles.rep;
        const hasGroup = !!gCol;

        if (!xCol) return { cells: [], hasGroup: false, catOrder: [], grpOrder: [] };

        const map = new Map();
        const catOrder = [];
        const grpOrder = [];
        const seenX = new Set(), seenG = new Set();

        s.data.forEach(function (row) {
            const x = String(row[xCol] == null ? '' : row[xCol]);
            if (!x) return;
            const g = hasGroup ? String(row[gCol] == null ? '' : row[gCol]) : '';

            if (!seenX.has(x)) { seenX.add(x); catOrder.push(x); }
            if (hasGroup && !seenG.has(g)) { seenG.add(g); grpOrder.push(g); }

            const key = x + '\u0001' + g;
            if (!map.has(key)) map.set(key, { x: x, g: g, values: [], reps: [] });
            const cell = map.get(key);

            const v = parseFloat(row[yCol]);
            if (!isFinite(v)) return;
            cell.values.push(v);
            if (repCol) cell.reps.push(String(row[repCol] == null ? '' : row[repCol]));
        });

        let customCat = opts.catOrder;
        if (customCat === undefined) {
            const el = app.$ && app.$('catOrder');
            customCat = el ? el.value.trim() : '';
        }
        let orderedCats = catOrder;
        if (customCat) {
            const wanted = String(customCat).split(/[,，\s]+/).filter(Boolean);
            const set = new Set(catOrder);
            const out = [], used = new Set();
            wanted.forEach(function (w) { if (set.has(w) && !used.has(w)) { out.push(w); used.add(w); } });
            catOrder.forEach(function (c) { if (!used.has(c)) out.push(c); });
            orderedCats = out;
        }

        let customGrp = opts.groupOrder;
        if (customGrp === undefined) {
            const el = app.$ && app.$('groupOrder');
            customGrp = el ? el.value.trim() : '';
        }
        let orderedGroups = grpOrder;
        if (hasGroup && customGrp) {
            const wanted = String(customGrp).split(/[,，\s]+/).filter(Boolean);
            const set = new Set(grpOrder);
            const out = [], used = new Set();
            wanted.forEach(function (w) { if (set.has(w) && !used.has(w)) { out.push(w); used.add(w); } });
            grpOrder.forEach(function (g) { if (!used.has(g)) out.push(g); });
            orderedGroups = out;
        }

        const cells = [];
        orderedCats.forEach(function (x) {
            if (hasGroup) {
                orderedGroups.forEach(function (g) {
                    const c = map.get(x + '\u0001' + g);
                    if (c && c.values.length) cells.push(c);
                });
            } else {
                const c = map.get(x + '\u0001');
                if (c && c.values.length) cells.push(c);
            }
        });

        return { cells: cells, hasGroup: hasGroup, catOrder: orderedCats, grpOrder: orderedGroups };
    }

    function checkPairing(app, opts) {
        opts = opts || {};
        const s = app.state;
        const repCol = (opts.repCol !== undefined) ? opts.repCol : s.roles.rep;
        if (!repCol) return { ok: false, reason: 'noRep' };

        const prepared = prepareCells(app, opts);
        const cells = prepared.cells;
        if (!cells.length) return { ok: false, reason: 'noRep' };

        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            if (!c.reps || !c.reps.length || c.reps.length !== c.values.length) {
                return { ok: false, reason: 'incomplete', at: c.x };
            }
        }

        if (prepared.hasGroup) {
            const byX = new Map();
            cells.forEach(function (c) {
                if (!byX.has(c.x)) byX.set(c.x, []);
                byX.get(c.x).push(c);
            });
            for (const entry of byX) {
                const x = entry[0];
                const list = entry[1];
                if (list.length < 2) continue;
                const ref = new Set(list[0].reps.map(String));
                for (let i = 1; i < list.length; i++) {
                    const cur = new Set(list[i].reps.map(String));
                    if (cur.size !== ref.size) return { ok: false, reason: 'inconsistent', at: x };
                    for (const k of ref) {
                        if (!cur.has(k)) return { ok: false, reason: 'inconsistent', at: x };
                    }
                }
            }
        } else {
            const ref = new Set(cells[0].reps.map(String));
            for (let i = 1; i < cells.length; i++) {
                const cur = new Set(cells[i].reps.map(String));
                if (cur.size !== ref.size) return { ok: false, reason: 'inconsistent' };
                for (const k of ref) {
                    if (!cur.has(k)) return { ok: false, reason: 'inconsistent' };
                }
            }
        }

        return { ok: true };
    }

    function getControlCandidates(app) {
        const s = app.state;
        if (!s.data.length || !s.roles.x) return [];
        const key = s.roles.group || s.roles.x;
        const seen = new Set(), out = [];
        s.data.forEach(function (r) {
            const v = r[key];
            if (v === undefined || v === null || v === '') return;
            const t = String(v);
            if (!seen.has(t)) { seen.add(t); out.push(t); }
        });
        return out;
    }

    function fillRepSelect(app) {
        const sel = app.$ && app.$('repColSel');
        if (!sel) return;
        const s = app.state;
        const T = L();
        if (!s.headers.length) {
            sel.innerHTML = '<option value="">' + T.noData + '</option>';
            sel.disabled = true;
            return;
        }
        sel.disabled = false;
        const cur = s.roles.rep || '';
        sel.innerHTML = '<option value="">' + T.noRepCol + '</option>' +
            s.headers.map(function (h) {
                return '<option value="' + esc(h) + '" ' +
                    (h === cur ? 'selected' : '') + '>' + esc(h) + '</option>';
            }).join('');
    }

    function computeSignificance(cells, settings, hasGroup) {
        if (!settings || !settings.enabled || !cells || cells.length < 2) return [];
        const S = SC(), Tst = ST();

        if (hasGroup === undefined || hasGroup === null) {
            hasGroup = cells.some(function (c) { return c.g !== '' && c.g != null; });
        }

        const pairs = [];

        if (hasGroup) {
            const byX = new Map();
            cells.forEach(function (c) {
                if (!byX.has(c.x)) byX.set(c.x, new Map());
                byX.get(c.x).set(c.g, c);
            });
            byX.forEach(function (gMap) {
                const list = Array.from(gMap.values());
                if (settings.compareMode === 'vsControl' && settings.controlValue) {
                    const ctrl = gMap.get(settings.controlValue);
                    if (!ctrl) return;
                    list.forEach(function (c) {
                        if (c.g !== settings.controlValue) pairs.push({ a: ctrl, b: c, x: c.x });
                    });
                } else {
                    for (let i = 0; i < list.length; i++)
                        for (let j = i + 1; j < list.length; j++)
                            pairs.push({ a: list[i], b: list[j], x: list[i].x });
                }
            });
        } else {
            const list = cells;
            if (settings.compareMode === 'vsControl' && settings.controlValue) {
                let ctrl = null;
                for (let i = 0; i < list.length; i++) {
                    if (list[i].x === settings.controlValue) { ctrl = list[i]; break; }
                }
                if (!ctrl) return [];
                list.forEach(function (c) {
                    if (c.x !== settings.controlValue) pairs.push({ a: ctrl, b: c });
                });
            } else {
                for (let i = 0; i < list.length; i++)
                    for (let j = i + 1; j < list.length; j++)
                        pairs.push({ a: list[i], b: list[j] });
            }
        }

        const results = [];

        pairs.forEach(function (pair) {
            const a = pair.a, b = pair.b, x = pair.x;
            let va = a.values, vb = b.values;
            let pairedOk = false;

            if (settings.paired && a.reps && b.reps && a.reps.length && b.reps.length) {
                const setA = new Set(a.reps.map(String));
                const setB = new Set(b.reps.map(String));
                let same = (setA.size === setB.size);
                if (same) {
                    for (const k of setA) {
                        if (!setB.has(k)) { same = false; break; }
                    }
                }
                if (same) {
                    const mapA = new Map();
                    a.reps.forEach(function (r, k) { mapA.set(String(r), a.values[k]); });
                    const mva = [], mvb = [];
                    b.reps.forEach(function (r, k) {
                        const key = String(r);
                        if (mapA.has(key)) { mva.push(mapA.get(key)); mvb.push(b.values[k]); }
                    });
                    if (mva.length >= 2) { va = mva; vb = mvb; pairedOk = true; }
                }
            }

            if (va.length < 2 || vb.length < 2) return;

            const res = Tst.runTest(va, vb, {
                method: settings.method,
                paired: settings.paired && pairedOk,
                varEqual: false,
                alternative: settings.alternative
            });
            if (!res) return;

            results.push({
                a: a, b: b, x: x,
                pValueRaw: res.pValue,
                pValue: res.pValue,
                test: res.test,
                paired: res.paired
            });
        });

        if (settings.adjust && settings.adjust !== 'none' && results.length) {
            const adj = S.adjustP(results.map(function (r) { return r.pValue; }), settings.adjust);
            results.forEach(function (r, k) {
                r.pValue = adj[k];
                r.adjustMethod = settings.adjust;
            });
        }

        results.forEach(function (r) {
            r.stars = S.pToStars(r.pValue);
            r.significant = r.pValue < settings.sigLevel;
        });

        return settings.showMode === 'sig'
            ? results.filter(function (r) { return r.significant; })
            : results;
    }

    function assignLevels(items, tol) {
        const levels = [];
        items.forEach(function (it) {
            for (let i = 0; i < levels.length; i++) {
                const conflict = levels[i].some(function (x) {
                    return !(it.p2 < x.p1 - tol || it.p1 > x.p2 + tol);
                });
                if (!conflict) {
                    levels[i].push(it);
                    it.level = i;
                    return;
                }
            }
            levels.push([it]);
            it.level = levels.length - 1;
        });
        return levels;
    }

    function computeAxisHeadroom(results, getIndex, settings, opts) {
        opts = opts || {};
        const empty = { levels: 0, extraValue: 0 };
        if (!results || !results.length || !settings || typeof getIndex !== 'function') return empty;

        const tol = (opts.tolerance != null) ? opts.tolerance : 0;
        const items = [];
        results.forEach(function (r) {
            const ia = getIndex(r.a);
            const ib = getIndex(r.b);
            if (ia == null || ib == null) return;
            if (!isFinite(ia) || !isFinite(ib)) return;
            items.push({ p1: Math.min(ia, ib), p2: Math.max(ia, ib) });
        });
        if (!items.length) return empty;

        items.sort(function (u, v) {
            const du = u.p2 - u.p1, dv = v.p2 - v.p1;
            return du !== dv ? du - dv : u.p1 - v.p1;
        });

        const levels = assignLevels(items, tol);
        const levelCount = levels.length;
        if (!levelCount) return empty;

        const levelH = (settings.brkHeight || 0) + (settings.brkSpacing || 0) + (settings.brkFontSize || 12);
        const basePx = (opts.basePx != null) ? opts.basePx : 10;
        const extraPx = basePx + levelCount * levelH + (settings.brkFontSize || 12);

        const plotPx = opts.plotPx || 400;
        const dataRange = opts.dataRange || 1;
        const buffer = (opts.buffer != null) ? opts.buffer : 1.15;
        const extraValue = extraPx * (dataRange / plotPx) * buffer;

        return { levels: levelCount, extraValue: extraValue };
    }

    function getBracketLabel(result, settings) {
        const mode = (settings && settings.labelMode) || 'stars';
        const p = result.pValue;

        if (mode === 'stars') return result.stars;

        let ptxt;
        if (!isFinite(p)) ptxt = 'NA';
        else if (p < 0.001) ptxt = '<0.001';
        else ptxt = p.toFixed(3);

        if (mode === 'p') return ptxt;
        if (mode === 'both') return result.stars + ' (' + ptxt + ')';
        return result.stars;
    }

    function drawSignificance(svg, opts) {
        const results = opts.results;
        const getBarXY = opts.getBarXY;
        const orientation = opts.orientation;
        const settings = opts.settings;
        if (!results || !results.length || !settings) return;

        const items = [];
        results.forEach(function (r) {
            const a = getBarXY(r.a), b = getBarXY(r.b);
            if (!a || !b) return;
            items.push({ result: r, a: a, b: b });
        });
        if (!items.length) return;

        const vertical = (orientation !== 'horizontal');
        const brkColor = settings.brkColor;
        const brkWidth = settings.brkWidth;
        const brkFontSize = settings.brkFontSize;
        const brkBold = settings.brkBold;
        const brkItalic = settings.brkItalic;
        const brkSpacing = settings.brkSpacing;
        const brkHeight = settings.brkHeight;

        items.forEach(function (it) {
            if (vertical) {
                it.p1 = Math.min(it.a.x, it.b.x);
                it.p2 = Math.max(it.a.x, it.b.x);
                it.base = Math.min(it.a.y, it.b.y);
            } else {
                it.p1 = Math.min(it.a.y, it.b.y);
                it.p2 = Math.max(it.a.y, it.b.y);
                it.base = Math.max(it.a.x, it.b.x);
            }
        });

        items.sort(function (u, v) {
            const du = u.p2 - u.p1, dv = v.p2 - v.p1;
            return du !== dv ? du - dv : u.p1 - v.p1;
        });

        assignLevels(items, 0);

        const levelH = brkHeight + brkSpacing + brkFontSize;

        let minBaseV = Infinity;
        let maxBaseV = -Infinity;
        items.forEach(function (x) {
            if (x.base < minBaseV) minBaseV = x.base;
            if (x.base > maxBaseV) maxBaseV = x.base;
        });

        items.forEach(function (it) {
            const g = svg.append('g').attr('class', 'sig-bracket');
            const labelText = getBracketLabel(it.result, settings);

            if (vertical) {
                const y = minBaseV - 8 - it.level * levelH;
                const needLine = Math.abs(it.p2 - it.p1) > 2;
                if (needLine) {
                    g.append('path')
                        .attr('d', 'M ' + it.p1 + ' ' + y +
                                  ' L ' + it.p1 + ' ' + (y - brkHeight) +
                                  ' L ' + it.p2 + ' ' + (y - brkHeight) +
                                  ' L ' + it.p2 + ' ' + y)
                        .attr('fill', 'none')
                        .attr('stroke', brkColor)
                        .attr('stroke-width', brkWidth);
                }
                g.append('text')
                    .attr('x', (it.p1 + it.p2) / 2)
                    .attr('y', needLine ? (y - brkHeight - 3) : y)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', brkFontSize)
                    .attr('font-weight', brkBold ? 'bold' : 'normal')
                    .attr('font-style', brkItalic ? 'italic' : 'normal')
                    .attr('fill', brkColor)
                    .text(labelText);
            } else {
                const x = maxBaseV + 8 + it.level * levelH;
                const needLine = Math.abs(it.p2 - it.p1) > 2;
                if (needLine) {
                    g.append('path')
                        .attr('d', 'M ' + x + ' ' + it.p1 +
                                  ' L ' + (x + brkHeight) + ' ' + it.p1 +
                                  ' L ' + (x + brkHeight) + ' ' + it.p2 +
                                  ' L ' + x + ' ' + it.p2)
                        .attr('fill', 'none')
                        .attr('stroke', brkColor)
                        .attr('stroke-width', brkWidth);
                }
                g.append('text')
                    .attr('x', needLine ? (x + brkHeight + 3) : x)
                    .attr('y', (it.p1 + it.p2) / 2)
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', brkFontSize)
                    .attr('font-weight', brkBold ? 'bold' : 'normal')
                    .attr('font-style', brkItalic ? 'italic' : 'normal')
                    .attr('fill', brkColor)
                    .text(labelText);
            }
        });
    }

    global.PlotTest = {
        defaultSettings: defaultSettings,
        defaultErrBarSettings: defaultErrBarSettings,
        renderTestPanel: renderTestPanel,
        readSettings: readSettings,
        renderErrBarPanel: renderErrBarPanel,
        readErrBarSettings: readErrBarSettings,
        prepareCells: prepareCells,
        checkPairing: checkPairing,
        getControlCandidates: getControlCandidates,
        fillRepSelect: fillRepSelect,
        computeSignificance: computeSignificance,
        computeAxisHeadroom: computeAxisHeadroom,
        drawSignificance: drawSignificance
    };
})(window);
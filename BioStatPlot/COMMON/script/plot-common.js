/* ============================================================
   BioDataTools 通用绘图 JS
   色板 / 颜色 / 表格 / 导入 / 聚合 / 导出 / 工具
   / 画布与图例参数 / 覆盖式图例（可拖动·可缩放·可换行）
============================================================ */
(function (global) {
    'use strict';

    /* ---------- i18n ---------- */
    const I18N = {
        zh: {
            noData: '无数据',
            colorEmpty: '选择分类列后将在此处显示每个类别的颜色',
            colorTitle: '类别颜色（点击色块单独修改）',
            colorReset: '↺ 重置全部',
            importTitle: '第一步：导入数据',
            importInfo: '需包含表头，且至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>。可直接粘贴 Excel 内容。',
            modeFile: ' 上传文件',
            modeText: ' 粘贴表格',
            importPlaceholder: '请粘贴逗号/制表符分隔的表格（第一行为表头）',
            importBtn: '导入并预览',
            exampleBtn: '加载示例',
            originPreview: '原始数据预览',
            msgEmptyInput: '❌ 请先粘贴或上传数据',
            msgParseFail: '❌ 未能解析到有效数据，请检查格式',
            msgImportOK: '✅ 数据导入成功',
            rowColFmt: (r, c) => `（共 ${r} 行 × ${c} 列）`,
            fileLoaded: n => `✅ 文件 ${n} 已加载`,
            placeholderImport: '— 请先导入数据 —',
            inputOrder: '输入顺序',
            notSelected: '— 未选择 —',
            noSvg: '❌ 没有可导出的 SVG',
            corrEmpty: '选择至少 2 个数值列后将在此处显示相关系数表',
            noDataPlaceholder: '导入数据并完成设置后，热图将在此处自动生成',
            noColsPlaceholder: '选择至少 2 个数值列后将在此处显示热图',
            noValidPlaceholder: '未能生成有效数据'
        },
        en: {
            noData: 'No data',
            colorEmpty: 'Category colors will be shown here after selecting a category column',
            colorTitle: 'Category colors (click a swatch to customize)',
            colorReset: '↺ Reset all',
            importTitle: 'Step 1: Import Data',
            importInfo: 'Must include a header row with at least a <strong>category column</strong> and a <strong>value column</strong>. You can paste directly from Excel.',
            modeFile: ' Upload File',
            modeText: ' Paste Table',
            importPlaceholder: 'Paste a comma/tab-separated table here (first row is the header)',
            importBtn: 'Import & Preview',
            exampleBtn: 'Load Example',
            originPreview: 'Raw Data Preview',
            msgEmptyInput: '❌ Please paste or upload data first',
            msgParseFail: '❌ Failed to parse valid data. Please check the format.',
            msgImportOK: '✅ Data imported successfully',
            rowColFmt: (r, c) => `(${r} rows × ${c} columns)`,
            fileLoaded: n => `✅ File ${n} loaded`,
            placeholderImport: '— Please import data first —',
            inputOrder: 'Input order',
            notSelected: '— Not selected —',
            noSvg: '❌ No SVG to export',
            corrEmpty: 'Select at least 2 numeric columns to display the correlation table',
            noDataPlaceholder: 'The heatmap will appear here after importing data',
            noColsPlaceholder: 'Select at least 2 numeric columns to display the heatmap',
            noValidPlaceholder: 'Could not generate valid data'
        }
    };

    /* 色板分组标题 i18n */
    const PALETTE_I18N = {
        zh: {
            groupD3:      'D3配色',
            groupGgsci:   'GGSCI配色',
            groupOther:   '其他配色',
            groupD3Cont:  'D3连续配色'
        },
        en: {
            groupD3:      'D3 Palette',
            groupGgsci:   'GGSCI Palette',
            groupOther:   'Other Palette',
            groupD3Cont:  'D3 Continuous'
        }
    };

    function getLang() {
        return window.location.pathname.includes('/en/') ? 'en' : 'zh';
    }
    function L() {
        return I18N[getLang()] || I18N.zh;
    }
    function PT(key) {
        const d = PALETTE_I18N[getLang()] || PALETTE_I18N.zh;
        return d[key] !== undefined ? d[key] : key;
    }
    function getLangUrl() {
        const p = window.location.pathname;
        if (p.includes('/en/')) return p.replace('/en/', '/ch/');
        if (p.includes('/ch/')) return p.replace('/ch/', '/en/');
        return p;
    }
    function t(key, dict) {
        const lang = getLang();
        const d = dict || window.i18n || {};
        if (d[lang] && d[lang][key] !== undefined) return d[lang][key];
        if (d.zh && d.zh[key] !== undefined) return d.zh[key];
        return key;
    }

    /* ---------- 色板 ---------- */
    const CATEGORICAL_LIST = [
        'tableau10', 'category10', 'set1', 'set2', 'set3',
        'paired', 'dark2', 'accent', 'pastel1', 'pastel2'
    ];
    const CONTINUOUS_LIST = [
        'viridis', 'plasma', 'inferno', 'magma', 'cividis', 'turbo',
        'blues', 'greens', 'greys', 'oranges', 'purples', 'reds',
        'brBG', 'piYG', 'rdBu', 'rdYlBu', 'rdYlGn', 'spectral'
    ];
    const FALLBACK_CATEGORICAL = [
        '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
        '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
    ];

    const GGSCI_SCHEMES = {
        npg:          ['#E64B35', '#4DBBD5', '#00A087', '#3C5488', '#F39B7F', '#8491B4', '#91D1C2', '#DC0000', '#7E6148', '#B09C85'],
        aaas:         ['#3B4992', '#EE0000', '#008B45', '#631879', '#008280', '#BB0021', '#5F559B', '#A20056', '#808180', '#1B1919'],
        nejm:         ['#BC3C29', '#0072B5', '#E18727', '#20854E', '#7876B1', '#6F99AD', '#FFDC91', '#EE4C97'],
        lancet:       ['#00468B', '#ED0000', '#42B540', '#0099B4', '#925E9F', '#FDAF91', '#AD002A', '#ADB6B6', '#1B1919'],
        jama:         ['#374E55', '#DF8F44', '#00A1D5', '#B24745', '#79AF97', '#6A6599', '#80796B'],
        bmj:          ['#2A6EBB', '#E18727', '#3DB7E4', '#7E2F8E', '#4DAF4A', '#FF7F00', '#984EA3', '#A65628', '#F781BF', '#999999'],
        jco:          ['#0073C2', '#EFC000', '#868686', '#CD534C', '#7AA6DC', '#003C67', '#8F7700', '#3B3B3B', '#A73030', '#4A6990'],
        locuszoom:    ['#D43F3A', '#EEA236', '#5CB85C', '#46B8DA', '#357EBD', '#9632B8', '#B8B8B8', '#EEEEEE'],
        uchicago:     ['#800000', '#767676', '#FFA319', '#8A9045', '#155F83', '#C16622', '#8F3931', '#58593F', '#350E20'],
        startrek:     ['#E4EAEE', '#CCD6DD', '#AAB8C2', '#939393', '#788B95', '#65737E', '#555D66', '#40474D', '#343A3F', '#1C1C1C'],
        tron:         ['#FF410D', '#6EE2FF', '#F7C530', '#95CC5E', '#D0DFE6', '#F79D1E', '#748AA6'],
        futurama:     ['#FF6F00', '#FF8E00', '#FFC000', '#FFE100', '#FFFF00', '#B0FF00', '#00FF00', '#00FFB0', '#00FFFF', '#00B0FF', '#008EFF', '#006FFF'],
        rickandmorty: ['#FAFD7C', '#82491E', '#24325F', '#B7E4F9', '#FB6467', '#526E2D', '#E89242', '#EEDD62', '#FAE7B5', '#DC5945', '#5244A0', '#D64D8C'],
        simpsons:     ['#FED439', '#709AE1', '#8A9197', '#D2AF81', '#FD7446', '#D5E4A2', '#197EC0', '#F05C3B', '#46732E', '#71D0F5', '#370335', '#075149', '#C80813', '#91331F', '#1A9993', '#FD8CC1']
    };
    const GGSCI_LIST = Object.keys(GGSCI_SCHEMES);

    /* ---------- 其他配色（可自定义） ---------- */
    const OTHER_SCHEMES = {
        okabeito:  ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#000000'],
        ibm:       ['#648FFF', '#785EF0', '#DC267F', '#FE6100', '#FFB000'],

        tolBright:         ['#4477AA', '#EE6677', '#228833', '#CCBB44', '#66CCEE', '#AA3377', '#BBBBBB'],
        tolVibrant:        ['#EE7733', '#009988', '#33BBEE', '#EE3377', '#CC3311', '#000000'],
        tolMuted:          ['#CC6677', '#332288', '#DDCC77', '#117733', '#88CCEE', '#882255', '#DDDDDD'],
        tolLight:          ['#77AADD', '#EE8866', '#EEDD88', '#FFAABB', '#99DDCC'],
        tolHighContrast:   ['#004488', '#DDAA33', '#BB5566'],
        tolMediumContrast: ['#6699CC', '#004488', '#EECC66', '#994455', '#997700', '#EE99AA'],

        kelly:      ['#F2F3F4', '#222222', '#F3C300', '#875692', '#F38400', '#A1CAF1', '#BE0032',
                     '#C2B280', '#848482', '#008856', '#E68FAC', '#0067A5', '#F99379', '#604E97',
                     '#F6A600', '#B3446C', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26'],
        ggplotHue:  ['#F8766E', '#01BEC4', '#7CAE00', '#C77CFF', '#00BA38', '#619CFF']
    };

    const OTHER_LIST = Object.keys(OTHER_SCHEMES);

    function isGgsciName(name) {
        return Object.prototype.hasOwnProperty.call(GGSCI_SCHEMES, String(name || '').toLowerCase());
    }
    function getGgsciScheme(name) {
        const arr = GGSCI_SCHEMES[String(name || '').toLowerCase()];
        return arr ? arr.slice() : null;
    }
    function getOtherScheme(name) {
        const arr = OTHER_SCHEMES[name];
        return arr ? arr.slice() : null;
    }
    function isOtherName(name) {
        return Object.prototype.hasOwnProperty.call(OTHER_SCHEMES, name);
    }
    function isContinuousName(name) {
        return CONTINUOUS_LIST.indexOf(name) !== -1;
    }

    function hexToRgb(hex) {
        let h = String(hex).trim().replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const n = parseInt(h, 16);
        if (isNaN(n) || h.length !== 6) return { r: 0, g: 0, b: 0 };
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    function rgbToHex(r, g, b) {
        const to2 = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
        return '#' + to2(r) + to2(g) + to2(b);
    }
    function mixColor(c1, c2, t) {
        const a = hexToRgb(c1), b = hexToRgb(c2);
        return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
    }
    function sampleStops(stops, t) {
        t = Math.max(0, Math.min(1, t));
        const n = stops.length - 1;
        const pos = t * n;
        const i = Math.min(n - 1, Math.floor(pos));
        const frac = pos - i;
        return mixColor(stops[i], stops[i + 1], frac);
    }
    function expandScheme(base, n) {
        if (!base || !base.length) return [];
        if (n === 1) return [base[0]];
        const out = [];
        for (let i = 0; i < n; i++) {
            const pos = i / (n - 1) * (base.length - 1);
            const idx = Math.floor(pos);
            const frac = pos - idx;
            const c1 = base[idx];
            const c2 = base[Math.min(idx + 1, base.length - 1)];
            out.push(mixColor(c1, c2, frac));
        }
        return out;
    }

    function getContinuousInterpolator(name, reverse) {
        const key = 'interpolate' + name.charAt(0).toUpperCase() + name.slice(1);
        const f = (global.d3 && typeof global.d3[key] === 'function') ? global.d3[key] : (() => '#cccccc');
        return reverse ? (t => f(1 - t)) : f;
    }
    function getContinuousColors(name, n, reverse) {
        const interp = getContinuousInterpolator(name, reverse);
        const out = [];
        if (n <= 1) return [interp(0.5)];
        for (let i = 0; i < n; i++) out.push(interp(i / (n - 1)));
        return out;
    }

    function getCategoricalScheme(name) {
        const o = getOtherScheme(name);
        if (o && o.length) return o;
        const g = getGgsciScheme(name);
        if (g && g.length) return g;
        const key = 'scheme' + name.charAt(0).toUpperCase() + name.slice(1);
        const arr = global.d3 && global.d3[key];
        return (Array.isArray(arr) && arr.length) ? arr.slice() : FALLBACK_CATEGORICAL.slice();
    }

    function listPalettes(type) {
        if (type === 'categorical') return CATEGORICAL_LIST.concat(GGSCI_LIST, OTHER_LIST);
        if (type === 'continuous') return CONTINUOUS_LIST.slice();
        return [];
    }

    /* 分类：3 组（D3 / GGSCI / 其他）；连续：1 组（D3 连续） */
    function listPaletteGroups(type) {
        if (type === 'continuous') {
            return [
                { key: 'd3-cont', label: PT('groupD3Cont'), kind: 'continuous', names: CONTINUOUS_LIST.slice() }
            ];
        }
        return [
            { key: 'd3',    label: PT('groupD3'),    kind: 'categorical', names: CATEGORICAL_LIST.slice() },
            { key: 'ggsci', label: PT('groupGgsci'), kind: 'categorical', names: GGSCI_LIST.slice() },
            { key: 'other', label: PT('groupOther'), kind: 'categorical', names: OTHER_LIST.slice() }
        ];
    }

    function getCategoricalColors(name, n, opts) {
        opts = opts || {};
        let reverse = false, cycle = false;
        if (typeof opts === 'boolean') reverse = opts;
        else { reverse = !!opts.reverse; cycle = !!opts.cycle; }

        const base = getCategoricalScheme(name);

        let result;
        if (!n || n <= 0) {
            result = base.slice();
        } else if (n <= base.length) {
            result = base.slice(0, n);
        } else if (cycle) {
            result = [];
            for (let i = 0; i < n; i++) result.push(base[i % base.length]);
        } else {
            result = base.slice();
            while (result.length < n) result.push('#cccccc');
        }

        if (reverse) result = result.slice().reverse();
        return result;
    }

    /* ---------- 工具 ---------- */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    let uidCounter = 0;
    function uid(prefix) { return (prefix || 'id') + '_' + (++uidCounter) + '_' + Date.now().toString(36); }

    let toastTimer = null;
    function showToast(message, type, duration) {
        let toast = document.querySelector('.plot-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'plot-toast';
            document.body.appendChild(toast);
        }
        toast.className = 'plot-toast show' + (type ? ' ' + type : '');
        toast.textContent = message;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), duration || 2200);
    }

    function num(app, id, fallback) {
        const el = app && app.$ ? app.$(id) : document.getElementById(id);
        if (!el) return fallback;
        const v = parseFloat(el.value);
        return isFinite(v) ? v : fallback;
    }
    function numById(id, fallback) {
        const el = document.getElementById(id);
        if (!el) return fallback;
        const v = parseFloat(el.value);
        return isFinite(v) ? v : fallback;
    }
    function intById(id, fallback) {
        const el = document.getElementById(id);
        if (!el) return fallback;
        const v = parseInt(el.value, 10);
        return isFinite(v) ? v : fallback;
    }
    function estTextWidth(str, fontSize) {
        let w = 0;
        for (const ch of String(str)) {
            w += /[\u4e00-\u9fa5\uff00-\uffef]/.test(ch) ? 1 : 0.55;
        }
        return w * fontSize;
    }
    function fmtNum(v, d) {
        if (!isFinite(v)) return '';
        if (Number.isInteger(v)) return String(v);
        return Number(v).toFixed(d);
    }
    function textColorOn(bg) {
        const rgb = hexToRgb(bg);
        const lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        return lum > 165 ? '#333333' : '#ffffff';
    }
    function polarXY(r, angle) {
        return [r * Math.sin(angle), -r * Math.cos(angle)];
    }
    function buildValueText(item, p) {
        const pct = item.percent * 100;
        switch (p.valueContent) {
            case 'pct': return pct.toFixed(1) + '%';
            case 'value': return String(item.value);
            case 'pct_value': return pct.toFixed(1) + '% (' + item.value + ')';
        }
        return '';
    }

    /* ---------- 色板下拉 ---------- */
    let paletteDropdownStyleInjected = false;
    function injectPaletteDropdownStyle() {
        if (paletteDropdownStyleInjected) return;
        paletteDropdownStyleInjected = true;
        const style = document.createElement('style');
        style.id = 'plot-palette-dropdown-style';
        style.textContent = `
            .palette-select-dropdown { max-height: 420px; overflow-y: auto; }

            .palette-select-dropdown .palette-group-label {
                display: flex; align-items: center; gap: 6px;
                padding: 8px 12px 6px;
                font-size: 11px; font-weight: 700;
                letter-spacing: .08em;
                color: #6b7688;
                background: #f4f6fb;
                border-top: 1px solid #e6eaf2;
                position: sticky; top: 0; z-index: 1;
                user-select: none; pointer-events: none;
            }
            .palette-select-dropdown .palette-group-label:first-child { border-top: none; }
            .palette-select-dropdown .palette-group-label::before {
                content: ''; width: 8px; height: 8px; border-radius: 2px;
                background: #b7c0d0;
            }

            .palette-select-dropdown .palette-group-label[data-group="d3"]      { color: #3b5bdb; }
            .palette-select-dropdown .palette-group-label[data-group="d3"]::before      { background: #3b5bdb; }
            .palette-select-dropdown .palette-group-label[data-group="ggsci"]   { color: #2f6f5e; }
            .palette-select-dropdown .palette-group-label[data-group="ggsci"]::before   { background: #2f6f5e; }
            .palette-select-dropdown .palette-group-label[data-group="other"]   { color: #7c3aed; }
            .palette-select-dropdown .palette-group-label[data-group="other"]::before   { background: #7c3aed; }
            .palette-select-dropdown .palette-group-label[data-group="d3-cont"] { color: #b45309; }
            .palette-select-dropdown .palette-group-label[data-group="d3-cont"]::before { background: #b45309; }

            .palette-select-dropdown .palette-option { padding-left: 20px; }
            .palette-select-dropdown .palette-option[data-group="d3"]      .palette-name { color: #3b5bdb; }
            .palette-select-dropdown .palette-option[data-group="ggsci"]   .palette-name { color: #2f6f5e; }
            .palette-select-dropdown .palette-option[data-group="other"]   .palette-name { color: #7c3aed; }
            .palette-select-dropdown .palette-option[data-group="d3-cont"] .palette-name { color: #b45309; }
        `;
        document.head.appendChild(style);
    }

    function renderPaletteDropdown(container, opts) {
        opts = opts || {};
        const type = opts.type || 'categorical';
        const groups = listPaletteGroups(type);

        const allNames = groups.reduce((acc, g) => acc.concat(g.names), []);
        const defaultName = (opts.selected && allNames.indexOf(opts.selected) !== -1)
            ? opts.selected
            : (allNames[0] || '');

        injectPaletteDropdownStyle();

        container.innerHTML = '';
        container.className = 'palette-select-wrap';

        const trigger = document.createElement('div');
        trigger.className = 'palette-select-trigger';
        trigger.innerHTML = `
            <div class="palette-preview-slot"></div>
            <span class="palette-name">${escapeHtml(defaultName)}</span>
            <span class="caret">▼</span>
        `;

        const dropdown = document.createElement('div');
        dropdown.className = 'palette-select-dropdown';

        function buildPreview(name, kind) {
            if (kind === 'continuous') {
                const interp = getContinuousInterpolator(name);
                const stops = [];
                for (let i = 0; i < 10; i++) stops.push(interp(i / 9));
                return `<div class="palette-gradient-mini" style="background:linear-gradient(to right, ${stops.join(',')})"></div>`;
            }
            const base = getCategoricalScheme(name);
            const count = base.length;
            const colors = getCategoricalColors(name, count);
            return `<div class="palette-swatches-mini">${
                colors.map(c => `<div style="background:${c}"></div>`).join('')
            }</div>`;
        }

        groups.forEach(group => {
            if (!group.names || !group.names.length) return;

            const labelEl = document.createElement('div');
            labelEl.className = 'palette-group-label';
            labelEl.dataset.group = group.key;
            labelEl.textContent = group.label;
            dropdown.appendChild(labelEl);

            group.names.forEach(name => {
                const option = document.createElement('div');
                option.className = 'palette-option' + (defaultName === name ? ' active' : '');
                option.dataset.value = name;
                option.dataset.group = group.key;
                option.dataset.kind = group.kind;
                option.innerHTML = `
                    ${buildPreview(name, group.kind)}
                    <span class="palette-name">${escapeHtml(name)}</span>
                    <span class="palette-check">✓</span>
                `;
                option.addEventListener('click', () => {
                    dropdown.querySelectorAll('.palette-option').forEach(el => el.classList.remove('active'));
                    option.classList.add('active');
                    trigger.querySelector('.palette-name').textContent = name;
                    updateTriggerPreview();
                    container.classList.remove('open');
                    opts.onSelect && opts.onSelect(name, {
                        group: group.key,
                        kind: group.kind
                    });
                });
                dropdown.appendChild(option);
            });
        });

        function updateTriggerPreview() {
            const slot = trigger.querySelector('.palette-preview-slot');
            const activeOpt = dropdown.querySelector('.palette-option.active');
            if (!activeOpt) { slot.innerHTML = ''; return; }
            const previewEl = activeOpt.querySelector('.palette-swatches-mini, .palette-gradient-mini');
            slot.innerHTML = previewEl ? previewEl.outerHTML : '';
        }

        if (!dropdown.querySelector('.palette-option.active')) {
            const first = dropdown.querySelector('.palette-option');
            if (first) {
                first.classList.add('active');
                trigger.querySelector('.palette-name').textContent = first.dataset.value;
            }
        }
        updateTriggerPreview();

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.palette-select-wrap.open').forEach(el => {
                if (el !== container) el.classList.remove('open');
            });
            container.classList.toggle('open');
        });

        container.appendChild(trigger);
        container.appendChild(dropdown);
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.palette-select-wrap.open').forEach(el => el.classList.remove('open'));
    });

    /* ---------- 单色分配 ---------- */
    function renderColorAssignment(container, opts) {
        opts = opts || {};
        const items = opts.items || [];
        container.innerHTML = '';

        if (!items.length) {
            container.innerHTML = `<div class="color-assign-empty">${L().colorEmpty}</div>`;
            return;
        }

        const header = document.createElement('div');
        header.className = 'color-assign-header';
        header.innerHTML = `
            <div class="palette-section-title">${L().colorTitle}</div>
            <button type="button" class="reset-all-btn">${L().colorReset}</button>
        `;
        header.querySelector('.reset-all-btn').addEventListener('click', () => {
            opts.onResetAll && opts.onResetAll();
        });
        container.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'color-assign-grid';
        items.forEach((it, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'color-assign-item';
            const pctHTML = (it.percent !== undefined && it.percent !== null)
                ? `<span class="cat-pct">${(it.percent * 100).toFixed(1)}%</span>`
                : '';
            wrap.innerHTML = `
                <input type="color" value="${it.color}">
                <span class="cat-name" title="${escapeHtml(it.name)}">${escapeHtml(it.name)}</span>
                ${pctHTML}
            `;
            wrap.querySelector('input[type="color"]').addEventListener('input', (e) => {
                opts.onChange && opts.onChange(idx, e.target.value);
            });
            grid.appendChild(wrap);
        });
        container.appendChild(grid);
    }

    /* ---------- 表格解析 ---------- */
    function detectDelimiter(text) {
        const first = (text.split(/\r?\n/).find(l => l.trim()) || '');
        if (first.includes('\t')) return '\t';
        if (first.includes(',')) return ',';
        if (first.includes(';')) return ';';
        return /\s+/;
    }
    function splitLine(line, sep) {
        if (sep instanceof RegExp) return line.trim().split(sep);
        const out = [];
        let cur = '', inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
                else inQuote = !inQuote;
            } else if (ch === sep && !inQuote) {
                out.push(cur); cur = '';
            } else cur += ch;
        }
        out.push(cur);
        return out.map(s => s.trim());
    }
    function parseTable(text) {
        if (!text || !text.trim()) return { headers: [], data: [] };
        const sep = detectDelimiter(text);
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length < 2) return { headers: [], data: [] };
        const rawHeaders = splitLine(lines[0], sep);
        const headers = rawHeaders.map((h, i) => h && h.length ? h : `Column${i + 1}`);
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const cells = splitLine(lines[i], sep);
            const row = {};
            headers.forEach((h, idx) => { row[h] = cells[idx] !== undefined ? cells[idx] : ''; });
            data.push(row);
        }
        return { headers, data };
    }
    function inferColumnTypes(headers, data) {
        const types = {};
        const sampleSize = Math.min(data.length, 200);
        headers.forEach(h => {
            let numericCount = 0, dateCount = 0, total = 0;
            for (let i = 0; i < sampleSize; i++) {
                const v = data[i][h];
                if (v === undefined || v === null || v === '') continue;
                total++;
                const s = String(v).trim();
                if (s !== '' && !isNaN(Number(s))) numericCount++;
                else if (!isNaN(Date.parse(s)) && /[-/:]/.test(s)) dateCount++;
            }
            if (total === 0) types[h] = 'categorical';
            else if (numericCount / total >= 0.8) types[h] = 'numeric';
            else if (dateCount / total >= 0.8) types[h] = 'date';
            else types[h] = 'categorical';
        });
        return types;
    }
    function getUniqueValues(data, key) {
        const seen = new Set();
        const out = [];
        data.forEach(row => {
            const v = row[key];
            if (v === undefined || v === null || v === '') return;
            const s = String(v);
            if (!seen.has(s)) { seen.add(s); out.push(s); }
        });
        return out;
    }
    function renderTablePreview(container, headers, data, opts) {
        opts = opts || {};
        const maxRows = opts.maxRows || 200;
        const types = opts.columnTypes || {};
        const thead = headers.map(h => {
            const tag = types[h] ? `<span class="col-type-tag ${types[h]}">${types[h]}</span>` : '';
            return `<th>${escapeHtml(h)}${tag}</th>`;
        }).join('');
        const rows = data.slice(0, maxRows).map(row =>
            '<tr>' + headers.map(h => `<td>${escapeHtml(row[h] === undefined ? '' : row[h])}</td>`).join('') + '</tr>'
        ).join('');
        container.innerHTML = `
            <table>
                <thead><tr>${thead}</tr></thead>
                <tbody>${rows || `<tr><td colspan="${headers.length}">${L().noData}</td></tr>`}</tbody>
            </table>`;
    }

    /* ---------- 导入面板 ---------- */
    function renderImportPanel(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;

        const L10n = L();
        const title = opts.title || L10n.importTitle;
        const infoHtml = opts.infoBox || L10n.importInfo;
        const defaultMode = opts.defaultMode || 'file';

        let examples = [];
        if (Array.isArray(opts.examples) && opts.examples.length) {
            examples = opts.examples.filter(ex => ex && ex.data)
                .map(ex => ({ label: ex.label || L10n.exampleBtn, data: ex.data }));
        } else if (opts.exampleData) {
            examples = [{ label: L10n.exampleBtn, data: opts.exampleData }];
        }

        container.className = 'step-card';
        container.innerHTML = `
            <div class="step-title">${title}</div>
            <div class="mode-tabs">
                <label><input type="radio" name="inputMode" value="file" ${defaultMode === 'file' ? 'checked' : ''}> ${L10n.modeFile}</label>
                <label><input type="radio" name="inputMode" value="text" ${defaultMode === 'text' ? 'checked' : ''}> ${L10n.modeText}</label>
            </div>
            <div class="file-input"><input type="file" class="import-file" accept=".csv,.tsv,.txt"></div>
            <div class="text-input"><textarea class="import-text" placeholder="${L10n.importPlaceholder}"></textarea></div>
            <div class="info-box">${infoHtml}</div>
            <div class="btn-group">
                <button class="btn import-btn">${L10n.importBtn}</button>
                ${examples.map((ex, i) =>
                    `<button class="btn import-example-btn" data-example-idx="${i}">${escapeHtml(ex.label)}</button>`
                ).join('')}
            </div>
            <div class="import-msg tip-text"></div>
            <div class="import-origin-wrap hide" style="margin-top:14px;">
                <div style="font-size:14px;font-weight:700;color:#1f4068;margin:12px 0 8px;">
                    ${L10n.originPreview} <span class="import-origin-count" style="font-size:12px;color:#999;font-weight:400;"></span>
                </div>
                <div class="table-wrap import-origin-table"></div>
            </div>
        `;

        const fileInput = container.querySelector('.import-file');
        const textArea = container.querySelector('.import-text');
        const msgEl = container.querySelector('.import-msg');
        const originWrap = container.querySelector('.import-origin-wrap');
        const originTable = container.querySelector('.import-origin-table');
        const originCount = container.querySelector('.import-origin-count');
        const importBtn = container.querySelector('.import-btn');

        function showMsg(msg, type) {
            msgEl.className = 'import-msg tip-text ' + (type || '');
            msgEl.textContent = msg;
            setTimeout(() => {
                if (msgEl.textContent === msg) {
                    msgEl.textContent = '';
                    msgEl.className = 'import-msg tip-text';
                }
            }, 3500);
        }

        function setMode(mode) {
            if (mode === 'file') {
                fileInput.disabled = false;
                textArea.disabled = true;
                textArea.value = '';
            } else {
                fileInput.disabled = true;
                fileInput.value = '';
                textArea.disabled = false;
            }
            originWrap.classList.add('hide');
            msgEl.className = 'import-msg tip-text';
            msgEl.textContent = '';
            opts.onReset && opts.onReset();
        }

        container.querySelectorAll('input[name="inputMode"]').forEach(r => {
            r.addEventListener('change', () => {
                const mode = container.querySelector('input[name="inputMode"]:checked').value;
                setMode(mode);
            });
        });

        fileInput.addEventListener('change', e => {
            const f = e.target.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = ev => {
                textArea.value = ev.target.result;
                showToast(L10n.fileLoaded(f.name));
            };
            reader.readAsText(f);
        });

        function importData() {
            const text = textArea.value;
            if (!text || !text.trim()) { showMsg(L10n.msgEmptyInput, 'error'); return; }
            const parsed = parseTable(text);
            if (!parsed.headers.length || !parsed.data.length) {
                showMsg(L10n.msgParseFail, 'error');
                originWrap.classList.add('hide');
                return;
            }
            const columnTypes = inferColumnTypes(parsed.headers, parsed.data);
            renderTablePreview(originTable, parsed.headers, parsed.data, { columnTypes });
            originCount.textContent = L10n.rowColFmt(parsed.data.length, parsed.headers.length);
            originWrap.classList.remove('hide');
            showMsg(L10n.msgImportOK, 'success');
            opts.onImport && opts.onImport({
                headers: parsed.headers,
                data: parsed.data,
                columnTypes
            });
        }

        importBtn.addEventListener('click', importData);

        container.querySelectorAll('.import-example-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.exampleIdx, 10);
                const ex = examples[idx];
                if (!ex || !ex.data) return;
                container.querySelector('input[name="inputMode"][value="text"]').checked = true;
                setMode('text');
                textArea.value = ex.data;
                importData();
            });
        });

        setMode(defaultMode);
    }

    /* ---------- 聚合与排序 ---------- */
    function aggregateAndSort(data, opts) {
        opts = opts || {};
        const categoryKey = opts.categoryKey;
        const valueKey = opts.valueKey;
        const sortBy = opts.sortBy || valueKey;
        const sortDir = opts.sortDir || 'desc';

        if (!categoryKey || !valueKey || !data || !data.length) return [];

        const map = new Map();
        data.forEach((row, rowIndex) => {
            const c = row[categoryKey];
            if (c === undefined || c === null || c === '') return;
            const v = parseFloat(row[valueKey]);
            if (isNaN(v)) return;
            const key = String(c);
            if (!map.has(key)) map.set(key, { value: 0, firstRow: row, firstIndex: rowIndex });
            map.get(key).value += v;
        });

        const dir = (sortDir === 'asc') ? 1 : -1;
        const isInputOrder = (sortBy === '__input__');
        const isNumericSort = (sortBy === valueKey);

        let items = Array.from(map, ([name, rec]) => ({
            name,
            value: rec.value,
            _sortKey: isInputOrder ? rec.firstIndex
                : isNumericSort ? rec.value
                : rec.firstRow[sortBy]
        }));

        items = items.filter(d => d.value > 0);

        items.sort((a, b) => {
            const ka = a._sortKey, kb = b._sortKey;
            const na = parseFloat(ka), nb = parseFloat(kb);
            if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
            return String(ka).localeCompare(String(kb)) * dir;
        });

        const total = items.reduce((s, d) => s + d.value, 0);
        if (total > 0) items.forEach(d => d.percent = d.value / total);
        items.forEach(d => { delete d._sortKey; });
        return items;
    }

    function fillSortBySelect(selectEl, headers, currentValue, opts) {
        opts = opts || {};
        const placeholder = opts.placeholder || L().placeholderImport;
        const inputLabel = opts.inputLabel || L().inputOrder;

        if (!headers || !headers.length) {
            selectEl.innerHTML = `<option>${escapeHtml(placeholder)}</option>`;
            selectEl.disabled = true;
            return currentValue;
        }

        const valid = (currentValue === '__input__') || headers.includes(currentValue);
        if (!valid) currentValue = headers[0];

        selectEl.disabled = false;
        let html = `<option value="__input__" ${currentValue === '__input__' ? 'selected' : ''}>${escapeHtml(inputLabel)}</option>`;
        html += headers.map(h =>
            `<option value="${escapeHtml(h)}" ${h === currentValue ? 'selected' : ''}>${escapeHtml(h)}</option>`
        ).join('');
        selectEl.innerHTML = html;
        return currentValue;
    }

    /* ---------- 角色分配 ---------- */
    function renderRoleAssigner(container, opts) {
        opts = opts || {};
        const headers = opts.headers || [];
        const roles = opts.roles || [];
        const values = opts.values || {};
        const disabled = opts.disabled === true;
        const placeholder = opts.placeholder || L().placeholderImport;
        const notSelected = opts.notSelected || L().notSelected;

        container.innerHTML = '';
        container.className = 'role-grid';

        roles.forEach(role => {
            const wrap = document.createElement('div');
            wrap.className = 'role-item' + (disabled ? ' disabled' : '');

            const optsHtml = [];
            if (disabled) {
                optsHtml.push(`<option value="">${escapeHtml(placeholder)}</option>`);
            } else {
                if (role.allowEmpty !== false) {
                    optsHtml.push(`<option value="">${escapeHtml(notSelected)}</option>`);
                }
                headers.forEach(h => {
                    const sel = (values[role.key] === h) ? 'selected' : '';
                    optsHtml.push(`<option value="${escapeHtml(h)}" ${sel}>${escapeHtml(h)}</option>`);
                });
            }

            const reqMark = role.required ? '<span class="required">*</span>' : '';
            const hint = role.hint ? `<div class="role-hint">${escapeHtml(role.hint)}</div>` : '';
            wrap.innerHTML = `
                <label class="role-label">${reqMark}${escapeHtml(role.label)}</label>
                <select data-role="${escapeHtml(role.key)}" ${disabled ? 'disabled' : ''}>${optsHtml.join('')}</select>
                ${hint}`;

            wrap.querySelector('select').addEventListener('change', function () {
                opts.onChange && opts.onChange(role.key, this.value);
            });
            container.appendChild(wrap);
        });
    }

    /* ---------- 导出 ---------- */
    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function cleanSvgForExport(svgEl) {
        const clone = svgEl.cloneNode(true);
        clone.querySelectorAll('.legend-hit, .node-hotspot, .palette-hit, [fill="transparent"][pointer-events="all"]').forEach(el => el.remove());
        return clone;
    }
    function downloadSVG(svgEl, filename) {
        if (!svgEl) { showToast(L().noSvg, 'error'); return; }
        
        const clone = cleanSvgForExport(svgEl);
        const xml = new XMLSerializer();
        let source = xml.serializeToString(clone);
        
        if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(source)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        triggerDownload(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), filename || 'chart.svg');
    }
    function downloadPNG(svgEl, filename, scale, bg) {
        return new Promise((resolve, reject) => {
            if (!svgEl) { reject(new Error('no svg')); return; }
            scale = scale || 2;
            bg = bg === undefined ? '#ffffff' : bg;
            
            // 1. 克隆并清理透明交互层
            const clone = cleanSvgForExport(svgEl);
            const xml = new XMLSerializer();
            let source = xml.serializeToString(clone);
            
            if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(source)) {
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            
            const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.onload = () => {
                let w = img.width, h = img.height;
                const vb = svgEl.getAttribute && svgEl.getAttribute('viewBox');
                if (vb) {
                    const parts = vb.split(/\s+/).map(Number);
                    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) { w = parts[2]; h = parts[3]; }
                } else if (svgEl.getAttribute) {
                    const wa = parseFloat(svgEl.getAttribute('width'));
                    const ha = parseFloat(svgEl.getAttribute('height'));
                    if (!isNaN(wa)) w = wa;
                    if (!isNaN(ha)) h = ha;
                }
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(w * scale));
                canvas.height = Math.max(1, Math.round(h * scale));
                const ctx = canvas.getContext('2d');
                if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(url);
                canvas.toBlob(blob => {
                    if (!blob) { reject(new Error('toBlob failed')); return; }
                    triggerDownload(blob, filename || 'chart.png');
                    resolve();
                }, 'image/png');
            };
            img.onerror = e => { URL.revokeObjectURL(url); reject(e); };
            img.src = url;
        });
    }
    /* ============================================================
       参数读取
    ============================================================ */
    function readCanvasParams(app, defW, defH) {
        const $ = app.$;
        return {
            width: Math.max(300, num(app, 'chartWidth', defW || 760)),
            height: Math.max(300, num(app, 'chartHeight', defH || 600)),
            showCanvasBorder: $('showCanvasBorder') ? $('showCanvasBorder').checked : false
        };
    }

    function readTitleLegendParams(app) {
        const $ = app.$;
        const chk = id => { const el = $(id); return el ? el.checked : false; };
        const val = (id, fb) => { const el = $(id); return el ? (el.value || fb) : fb; };
        return {
            fontFamily: val('fontFamily', 'Times New Roman'),
            legendFontSize: Math.max(6, num(app, 'legendFontSize', 15)),
            legendBold: chk('legendBold'),
            legendItalic: chk('legendItalic'),
            legendTitleFontSize: Math.max(6, num(app, 'legendTitleFontSize', 15)),
            legendTitleBold: chk('legendTitleBold'),
            legendTitleItalic: chk('legendTitleItalic'),
            showLegend: chk('showLegend'),
            showLegendTitle: chk('showLegendTitle'),
            legendTitle: val('legendTitle', ''),
        };
    }

    function readCommonParams(app, defaults) {
        defaults = defaults || {};
        return Object.assign({},
            readCanvasParams(app, defaults.width || 760, defaults.height || 600),
            readTitleLegendParams(app)
        );
    }

    function validateBasic(app, opts) {
        opts = opts || {};
        const showTip = app.showTip || (() => {});
        const tFn = (global.PlotI18N && global.PlotI18N.t) ? global.PlotI18N.t : (k => k);
        const state = app.state;
        if (!state || !state.data || !state.data.length) {
            showTip('msgTip3', opts.noData || tFn('noData'), 'error');
            return false;
        }
        const roles = state.roles || {};
        if (opts.needCategory !== false && !roles.category) {
            showTip('msgTip3', opts.selectColumns || tFn('selectColumns'), 'error');
            return false;
        }
        if (opts.needValue !== false && !roles.value) {
            showTip('msgTip3', opts.selectColumns || tFn('selectColumns'), 'error');
            return false;
        }
        return true;
    }

    /* ============================================================
       图例：覆盖式，默认右上角，可拖动·可滚轮缩放·可换行
    ============================================================ */
    function getLegendMaxPerLine() {
        const el = document.getElementById('legendMaxPerLine');
        if (!el) return 1;
        const v = parseInt(el.value, 10);
        return (isFinite(v) && v > 0) ? v : 1;
    }

    function getLegendState() {
        const app = global.PlotApp && global.PlotApp.current;
        const state = (app && app.state) || {};
        if (!state.legendOffset) state.legendOffset = { dx: 0, dy: 0 };
        if (!state.legendScale) state.legendScale = 1;
        return { app, state };
    }

    function drawLegendOverlay(root, opts) {
        opts = opts || {};
        const p = opts.p || {};
        const items = opts.items || [];
        const colors = opts.colors || [];
        if (!items.length || !p.showLegend) return null;

        const { app, state } = getLegendState();
        const scale = Math.max(0.3, Math.min(3, state.legendScale || 1));
        const offset = state.legendOffset || { dx: 0, dy: 0 };

        const baseFontSize = p.legendFontSize || 15;
        const fontSize = baseFontSize * scale;
        const markerSize = fontSize;
        const textGap = 8 * scale;
        const itemGap = 20 * scale;
        const rowH = markerSize + 8 * scale;
        const pad = 8 * scale;

        const hasTitle = !!(p.showLegendTitle && p.legendTitle && p.legendTitle.trim());
        const titleFontSize = (p.legendTitleFontSize || 15) * scale;
        const titleH = hasTitle ? (titleFontSize + 10 * scale) : 0;

        const maxPerLine = getLegendMaxPerLine();
        const itemsPerRow = Math.min(maxPerLine, items.length);
        const rowCount = Math.ceil(items.length / itemsPerRow);

        const fmt = opts.labelFormatter ||
            (it => it.name + ' (' + (it.percent * 100).toFixed(1) + '%)');
        const labels = items.map(fmt);

        const shapeFnForWidth = opts.shapeOf || (() => opts.shape || 'rect');

        const colWidths = [];
        for (let c = 0; c < itemsPerRow; c++) {
            let w = 0;
            for (let r = 0; r < rowCount; r++) {
                const idx = r * itemsPerRow + c;
                if (idx >= items.length) break;
                const sCheck = shapeFnForWidth(idx, items[idx]);
const isLineShape = (sCheck === 'line' || sCheck === 'dashline'
    || sCheck === 'linepoint' || sCheck === 'dashlinepoint');
const markerW = isLineShape ? markerSize * 1.5 : markerSize;
                const lw = markerW + textGap + estTextWidth(labels[idx], fontSize) + itemGap;
                if (lw > w) w = lw;
            }
            if (w > 0) colWidths.push(w);
        }
        const gridW = Math.max(0, colWidths.reduce((a, b) => a + b, 0) - itemGap);
        const gridH = titleH + rowCount * rowH;
        const boxW = gridW + pad * 2;
        const boxH = gridH + pad * 2;

        const margin = (opts.margin != null) ? opts.margin : 15;
        const anchor = opts.anchor || 'right-middle';
        let baseX, baseY;
        if (anchor === 'top-left')           { baseX = margin;                   baseY = margin; }
        else if (anchor === 'top-right')     { baseX = p.width - boxW - margin;  baseY = margin; }
        else if (anchor === 'bottom-right')  { baseX = p.width - boxW - margin;  baseY = p.height - boxH - margin; }
        else if (anchor === 'bottom-left')   { baseX = margin;                   baseY = p.height - boxH - margin; }
        else if (anchor === 'left-middle')   { baseX = margin;                   baseY = (p.height - boxH) / 2; }
        else if (anchor === 'top-middle')    { baseX = (p.width - boxW) / 2;     baseY = margin; }
        else if (anchor === 'bottom-middle') { baseX = (p.width - boxW) / 2;     baseY = p.height - boxH - margin; }
        else                                 { baseX = p.width - boxW - margin;  baseY = (p.height - boxH) / 2; }

        const group = root.append('g')
            .attr('class', 'chart-legend')
            .datum({ baseX, baseY })
            .attr('transform', `translate(${baseX + offset.dx},${baseY + offset.dy})`);

        group.append('rect')
            .attr('class', 'legend-hit')
            .attr('x', 0).attr('y', 0)
            .attr('width', boxW).attr('height', boxH)
            .attr('fill', 'transparent')
            .attr('pointer-events', 'all');

        let cursorY = pad;
        if (hasTitle) {
            group.append('text')
                .attr('x', pad)
                .attr('y', cursorY + titleFontSize)
                .attr('text-anchor', 'start')
                .attr('font-size', titleFontSize)
                .attr('font-weight', p.legendTitleBold ? 'bold' : 'normal')
                .attr('font-style', p.legendTitleItalic ? 'italic' : 'normal')
                .attr('fill', '#333')
                .text(p.legendTitle);
            cursorY += titleH;
        }

        items.forEach((it, i) => {
            const r = Math.floor(i / itemsPerRow);
            const c = i % itemsPerRow;
            let colX = pad;
            for (let ci = 0; ci < c; ci++) colX += colWidths[ci];
            const y = cursorY + r * rowH;

            const markerY = y + rowH / 2 - markerSize / 2;
            const markerCX = colX + markerSize / 2;
            const markerCY = markerY + markerSize / 2;
            const shapeFn = opts.shapeOf || (() => opts.shape || 'rect');
            const s = shapeFn(i, it);

            if (s === 'circle') {
                group.append('circle')
                    .attr('cx', markerCX).attr('cy', markerCY)
                    .attr('r', markerSize / 2)
                    .attr('fill', colors[i]);
            } else if (s === 'rect' || s === 'square') {
                group.append('rect')
                    .attr('x', colX).attr('y', markerY)
                    .attr('width', markerSize).attr('height', markerSize)
                    .attr('rx', 2)
                    .attr('fill', colors[i]);
            } else if (s === 'box') {
                const bx = colX;
                const by = markerY;
                const bw = markerSize;
                const bh = markerSize;
                const midX = bx + bw / 2;
                const  q1y = by + bh * 0.22;
                const  q3y = by + bh * 0.78;
                const medY = by + bh * 0.5;
                const topY = by;
                const botY = by + bh;
                const  capHalf = bw * 0.32;

                group.append('rect')
                    .attr('x', bx).attr('y', q1y)
                    .attr('width', bw).attr('height', q3y - q1y)
                    .attr('fill', colors[i])
                    .attr('fill-opacity', 0.7)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 0.8);
                group.append('line')
                    .attr('x1', midX).attr('x2', midX)
                    .attr('y1', q1y).attr('y2', topY)
                    .attr('stroke', '#333').attr('stroke-width', 0.8);
                group.append('line')
                    .attr('x1', midX).attr('x2', midX)
                    .attr('y1', q3y).attr('y2', botY)
                    .attr('stroke', '#333').attr('stroke-width', 0.8);
                group.append('line')
                    .attr('x1', midX - capHalf).attr('x2', midX + capHalf)
                    .attr('y1', topY).attr('y2', topY)
                    .attr('stroke', '#333').attr('stroke-width', 0.8);
                group.append('line')
                    .attr('x1', midX - capHalf).attr('x2', midX + capHalf)
                    .attr('y1', botY).attr('y2', botY)
                    .attr('stroke', '#333').attr('stroke-width', 0.8);
                group.append('line')
                    .attr('x1', bx).attr('x2', bx + bw)
                    .attr('y1', medY).attr('y2', medY)
                    .attr('stroke', '#333').attr('stroke-width', 1.2);
                       } else if (s === 'line' || s === 'dashline') {
                const lineY = markerCY;
                const lineX1 = colX;
                const lineX2 = colX + markerSize * 1.5;
                const lineEl = group.append('line')
                    .attr('x1', lineX1).attr('x2', lineX2)
                    .attr('y1', lineY).attr('y2', lineY)
                    .attr('stroke', colors[i])
                    .attr('stroke-width', 2)
                    .attr('stroke-linecap', 'round');
                if (s === 'dashline') lineEl.attr('stroke-dasharray', '6 4');
            } else if (s === 'linepoint' || s === 'dashlinepoint') {
                const lineY = markerCY;
                const lineX1 = colX;
                const lineX2 = colX + markerSize * 1.5;
                const lineEl = group.append('line')
                    .attr('x1', lineX1).attr('x2', lineX2)
                    .attr('y1', lineY).attr('y2', lineY)
                    .attr('stroke', colors[i])
                    .attr('stroke-width', 2)
                    .attr('stroke-linecap', 'round');
                if (s === 'dashlinepoint') lineEl.attr('stroke-dasharray', '6 4');

                const pShape = opts.pointShapeOf ? opts.pointShapeOf(i, it) : 'circle';
                const midX = (lineX1 + lineX2) / 2;
                if (window.PlotShapes && PlotShapes.buildSymbolPath) {
                    const pathData = PlotShapes.buildSymbolPath(pShape, markerSize * 0.9);
                    const p = group.append('path')
                        .attr('d', pathData)
                        .attr('transform', `translate(${midX}, ${lineY})`);
                    PlotShapes.applyShapeStyle(p, pShape, colors[i], { hollowFill: '#ffffff' });
                } else {
                    group.append('circle')
                        .attr('cx', midX).attr('cy', lineY)
                        .attr('r', markerSize * 0.35)
                        .attr('fill', colors[i]);
                }
            } else if (window.PlotShapes) {
                const pathData = PlotShapes.buildSymbolPath(s, markerSize);
                const p = group.append('path')
                    .attr('d', pathData)
                    .attr('transform', `translate(${markerCX}, ${markerCY})`);
                PlotShapes.applyShapeStyle(p, s, colors[i]);
            } else {
                group.append('rect')
                    .attr('x', colX).attr('y', markerY)
                    .attr('width', markerSize).attr('height', markerSize)
                    .attr('fill', colors[i]);
            }

            group.append('text')
                .attr('x', colX + markerSize + textGap)
                .attr('y', y + rowH / 2)
                .attr('dy', '0.35em')
                .attr('font-size', fontSize)
                .attr('font-weight', p.legendBold ? 'bold' : 'normal')
                .attr('font-style', p.legendItalic ? 'italic' : 'normal')
                .attr('fill', '#333')
                .text(labels[i]);
        });

        if (app) attachLegendInteractions(group, app);

        return group;
    }

    function attachLegendInteractions(group, app) {
        const state = app.state;
        let dragging = false;
        let startX = 0, startY = 0;

        group.style('cursor', 'move');

        const drag = d3.drag()
            .on('start', function (event) {
                dragging = true;
                startX = event.x;
                startY = event.y;
                group.raise();
                group.style('cursor', 'grabbing');
                if (event.sourceEvent) event.sourceEvent.stopPropagation();
            })
            .on('drag', function (event) {
                if (!dragging) return;
                if (!state.legendOffset) state.legendOffset = { dx: 0, dy: 0 };
                state.legendOffset.dx += event.x - startX;
                state.legendOffset.dy += event.y - startY;
                startX = event.x;
                startY = event.y;
                const d = group.datum();
                group.attr('transform',
                    'translate(' + (d.baseX + state.legendOffset.dx) + ',' +
                    (d.baseY + state.legendOffset.dy) + ')');
            })
            .on('end', function () {
                dragging = false;
                group.style('cursor', 'move');
            });

        group.call(drag);

        group.on('wheel', function (event) {
            event.preventDefault();
            event.stopPropagation();
            const delta = -event.deltaY * 0.001;
            const cur = state.legendScale || 1;
            state.legendScale = Math.max(0.3, Math.min(3, cur + delta));
            if (app.state.currentSvg) app.drawChart();
        });
    }

    /* ---------- 公共面板：全局设置 ---------- */
    function renderGlobalSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;
        const isEn = getLang() === 'en';
        const S = {
            title:       isEn ? 'Global Settings' : '全局设置',
            width:       isEn ? 'Width (px)'  : '宽度(px)',
            height:      isEn ? 'Height (px)' : '高度(px)',
            showBorder:  isEn ? 'Show canvas border' : '显示画布边框',
            fontLabel:   isEn ? 'Font' : '字体'
        };

        container.innerHTML = `
            <div class="param-panel">
                <div class="param-panel-title">${S.title}</div>
                <div class="param-grid cols-4">
                    <div class="param-item">
                        <label>${S.width}</label>
                        <input type="number" id="chartWidth" value="700" min="300" data-redraw>
                    </div>
                    <div class="param-item">
                        <label>${S.height}</label>
                        <input type="number" id="chartHeight" value="600" min="300" data-redraw>
                    </div>
                </div>
                <div class="param-inline" style="margin-top:8px;">
                    <label><input type="checkbox" id="showCanvasBorder" checked data-redraw>${S.showBorder}</label>
                </div>
                <div class="param-inline" style="margin-top:8px;">
                    <label>${S.fontLabel}
                        <select id="fontFamily" data-redraw>
                            <option value="Times New Roman" selected>Times New Roman</option>
                            <option value="Arial">Arial</option>
                            <option value="Calibri">Calibri</option>
                            <option value="Helvetica">Helvetica</option>
                            <option value="Microsoft YaHei">微软雅黑</option>
                        </select>
                    </label>
                </div>
            </div>
        `;
    }

    /* ---------- 公共面板：图例组件 ---------- */
    function renderLegendSettings(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return;
        const isEn = getLang() === 'en';
        const S = {
            title:        isEn ? 'Legend'         : '图例',
            show:         isEn ? 'Show'           : '显示',
            perRow:       isEn ? 'Per row:'       : '每行显示：',
            titleRow:     isEn ? 'Legend Title'   : '图例标题',
            titleShow:    isEn ? 'Show'           : '显示',
            content:      isEn ? 'Text:'          : '内容：',
            fontSize:     isEn ? 'Size'           : '字号',
            bold:         isEn ? 'B'              : '粗',
            italic:       isEn ? 'I'              : '斜'
        };

        container.innerHTML = `
            <div class="param-panel">
                <div class="param-panel-title">${S.title}</div>

                <div class="param-inline">
                    <label><input type="checkbox" id="showLegend" checked data-redraw>${S.show}</label>
                    <label>${S.perRow}
                        <input type="number" id="legendMaxPerLine" value="1" min="1" max="50" step="1" style="width:60px;" data-redraw>
                    </label>
                    <label>${S.fontSize}
                        <input type="number" id="legendFontSize" value="15" min="8" max="36" data-redraw>
                    </label>
                    <label class="mini-check"><input type="checkbox" id="legendBold" data-redraw>${S.bold}</label>
                    <label class="mini-check"><input type="checkbox" id="legendItalic" data-redraw>${S.italic}</label>
                </div>

                <div class="param-inline">
                    <label>${S.titleRow}
                        <input type="checkbox" id="showLegendTitle" checked data-redraw>${S.titleShow}
                    </label>
                    <label>${S.content}
                        <input type="text" id="legendTitle" value="Item" style="width:200px;" data-redraw>
                    </label>
                    <label>${S.fontSize}
                        <input type="number" id="legendTitleFontSize" value="15" min="8" max="36" data-redraw>
                    </label>
                    <label class="mini-check"><input type="checkbox" id="legendTitleBold" checked data-redraw>${S.bold}</label>
                    <label class="mini-check"><input type="checkbox" id="legendTitleItalic" data-redraw>${S.italic}</label>
                </div>
            </div>
        `;
    }

    /* ---------- 对外暴露 ---------- */
    global.PlotCommon = {
        hexToRgb, rgbToHex, mixColor, sampleStops, expandScheme,
        getCategoricalScheme,
        isGgsciName, getGgsciScheme,
        isOtherName, getOtherScheme,
        isContinuousName,
        GGSCI_SCHEMES, GGSCI_LIST,
        OTHER_SCHEMES, OTHER_LIST,
        CATEGORICAL_LIST, CONTINUOUS_LIST,
        listPalettes, listPaletteGroups, getCategoricalColors,
        getContinuousInterpolator, getContinuousColors,
        renderPaletteDropdown, renderColorAssignment,

        parseTable, detectDelimiter, inferColumnTypes,
        getUniqueValues, renderTablePreview,
        renderImportPanel,

        aggregateAndSort,
        fillSortBySelect,
        renderRoleAssigner,

        downloadSVG, downloadPNG,
        showToast, escapeHtml, clone, uid,
        getLang, getLangUrl, t, L, PT,

        num, numById, intById,
        estTextWidth, fmtNum, textColorOn,
        polarXY, buildValueText,

        readCanvasParams,
        readTitleLegendParams,
        readCommonParams,
        validateBasic,
        renderGlobalSettings,
        renderLegendSettings,
        getLegendMaxPerLine,
        drawLegendOverlay,
        attachLegendInteractions
    };
})(window);
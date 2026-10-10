/* ============================================================
   BioDataTools 通用绘图页 JS
============================================================ */
(function (global) {
    'use strict';

    /* ============================================================
       0. i18n 字典
    ============================================================ */
    const I18N = {
        zh: {
            noData:              '无数据',
            colorEmpty:          '选择分类列后将在此处显示每个类别的颜色',
            colorTitle:          '类别颜色（点击色块单独修改）',
            colorReset:          '↺ 重置全部',
            importTitle:         '第一步：导入数据',
            importInfo:          '需包含表头，且至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>。可直接粘贴 Excel 内容。',
            modeFile:            ' 上传文件',
            modeText:            ' 粘贴表格',
            importPlaceholder:   '请粘贴逗号/制表符分隔的表格（第一行为表头）',
            importBtn:           '导入并预览',
            exampleBtn:          '加载示例',
            originPreview:       '原始数据预览',
            msgEmptyInput:       '❌ 请先粘贴或上传数据',
            msgParseFail:        '❌ 未能解析到有效数据，请检查格式',
            msgImportOK:         '✅ 数据导入成功',
            rowColFmt:           (r, c) => `（共 ${r} 行 × ${c} 列）`,
            fileLoaded:          n => `✅ 文件 ${n} 已加载`,
            placeholderImport:   '— 请先导入数据 —',
            inputOrder:          '输入顺序',
            notSelected:         '— 未选择 —',
            noSvg:               '❌ 没有可导出的 SVG'
        },
        en: {
            noData:              'No data',
            colorEmpty:          'Category colors will be shown here after selecting a category column',
            colorTitle:          'Category colors (click a swatch to customize)',
            colorReset:          '↺ Reset all',
            importTitle:         'Step 1: Import Data',
            importInfo:          'Must include a header row with at least a <strong>category column</strong> and a <strong>value column</strong>. You can paste directly from Excel.',
            modeFile:            ' Upload File',
            modeText:            ' Paste Table',
            importPlaceholder:   'Paste a comma/tab-separated table here (first row is the header)',
            importBtn:           'Import & Preview',
            exampleBtn:          'Load Example',
            originPreview:       'Raw Data Preview',
            msgEmptyInput:       '❌ Please paste or upload data first',
            msgParseFail:        '❌ Failed to parse valid data. Please check the format.',
            msgImportOK:         '✅ Data imported successfully',
            rowColFmt:           (r, c) => `(${r} rows × ${c} columns)`,
            fileLoaded:          n => `✅ File ${n} loaded`,
            placeholderImport:   '— Please import data first —',
            inputOrder:          'Input order',
            notSelected:         '— Not selected —',
            noSvg:               '❌ No SVG to export'
        }
    };
    function L() {
        const lang = (typeof getLang === 'function' ? getLang() : 'zh');
        return I18N[lang] || I18N.zh;
    }

    /* ============================================================
       1. 分类色板
    ============================================================ */
    const CATEGORICAL_LIST = [
        'tableau10', 'category10', 'set1', 'set2', 'set3',
        'paired', 'dark2', 'accent', 'pastel1', 'pastel2'
    ];

    /* ============================================================
       2. 连续色板
    ============================================================ */
    const CONTINUOUS_LIST = [
        'viridis', 'plasma', 'inferno', 'magma', 'cividis', 'turbo',
        'blues', 'greens', 'greys', 'oranges', 'purples', 'reds',
        'brBG', 'piYG', 'rdBu', 'rdYlBu', 'rdYlGn', 'spectral'
    ];

    const FALLBACK_CATEGORICAL = [
        '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
        '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
    ];

    /* ============================================================
       3. 颜色工具
    ============================================================ */
    function hexToRgb(hex) {
        let h = String(hex).trim().replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const num = parseInt(h, 16);
        if (isNaN(num) || h.length !== 6) return { r: 0, g: 0, b: 0 };
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
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
        if (!base || base.length === 0) return [];
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

    /* ============================================================
       4. 色板 API
    ============================================================ */
    function getCategoricalScheme(name) {
        const key = 'scheme' + name.charAt(0).toUpperCase() + name.slice(1);
        const arr = global.d3 && global.d3[key];
        return (Array.isArray(arr) && arr.length) ? arr.slice() : FALLBACK_CATEGORICAL.slice();
    }

    function listPalettes(type) {
        if (type === 'categorical') return CATEGORICAL_LIST.slice();
        if (type === 'continuous')  return CONTINUOUS_LIST.slice();
        return [];
    }

    function getCategoricalColors(name, n, opts) {
        opts = opts || {};
        let reverse = false, cycle = false;
        if (typeof opts === 'boolean') {
            reverse = opts;
        } else {
            reverse = !!opts.reverse;
            cycle = !!opts.cycle;
        }

        let base = getCategoricalScheme(name);
        if (reverse) base = base.slice().reverse();

        if (!n || n <= 0) return base.slice();
        if (n <= base.length) return base.slice(0, n);

        if (cycle) {
            const out = [];
            for (let i = 0; i < n; i++) out.push(base[i % base.length]);
            return out;
        }

        const out = base.slice();
        while (out.length < n) out.push('#cccccc');
        return out;
    }

    function getContinuousInterpolator(name, reverse) {
        const key = 'interpolate' + name.charAt(0).toUpperCase() + name.slice(1);
        const f = (global.d3 && typeof global.d3[key] === 'function')
            ? global.d3[key]
            : (t => '#cccccc');
        return reverse ? (t => f(1 - t)) : f;
    }

    function getContinuousColors(name, n, reverse) {
        const interp = getContinuousInterpolator(name, reverse);
        const out = [];
        if (n <= 1) return [interp(0.5)];
        for (let i = 0; i < n; i++) out.push(interp(i / (n - 1)));
        return out;
    }

    /* ============================================================
       5. 色板下拉组件
    ============================================================ */
    function renderPaletteDropdown(container, opts) {
        opts = opts || {};
        const type = opts.type || 'categorical';
        const names = listPalettes(type);
        const previewCount = opts.previewCount || 8;

        container.innerHTML = '';
        container.className = 'palette-select-wrap';

        const trigger = document.createElement('div');
        trigger.className = 'palette-select-trigger';
        trigger.innerHTML = `
            <div class="palette-preview-slot"></div>
            <span class="palette-name">${escapeHtml(opts.selected || names[0])}</span>
            <span class="caret">▼</span>
        `;

        const dropdown = document.createElement('div');
        dropdown.className = 'palette-select-dropdown';

        names.forEach(name => {
            const option = document.createElement('div');
            option.className = 'palette-option' + (opts.selected === name ? ' active' : '');
            option.dataset.value = name;

            let previewHTML = '';
            if (type === 'categorical') {
                const colors = getCategoricalColors(name, previewCount);
                previewHTML = `<div class="palette-swatches-mini">${
                    colors.map(c => `<div style="background:${c}"></div>`).join('')
                }</div>`;
            } else {
                const interp = getContinuousInterpolator(name);
                const stops = [];
                for (let i = 0; i < 10; i++) stops.push(interp(i / 9));
                previewHTML = `<div class="palette-gradient-mini" style="background:linear-gradient(to right, ${stops.join(',')})"></div>`;
            }

            option.innerHTML = `
                ${previewHTML}
                <span class="palette-name">${escapeHtml(name)}</span>
                <span class="palette-check">✓</span>
            `;
            option.addEventListener('click', () => {
                dropdown.querySelectorAll('.palette-option').forEach(el => el.classList.remove('active'));
                option.classList.add('active');
                trigger.querySelector('.palette-name').textContent = name;
                updateTriggerPreview();
                container.classList.remove('open');
                opts.onSelect && opts.onSelect(name);
            });
            dropdown.appendChild(option);
        });

        function updateTriggerPreview() {
            const slot = trigger.querySelector('.palette-preview-slot');
            const activeOpt = dropdown.querySelector('.palette-option.active');
            if (!activeOpt) { slot.innerHTML = ''; return; }
            const previewEl = activeOpt.querySelector('.palette-swatches-mini, .palette-gradient-mini');
            slot.innerHTML = previewEl ? previewEl.outerHTML : '';
        }

        const initialActive = dropdown.querySelector('.palette-option.active') || dropdown.firstElementChild;
        if (initialActive && !initialActive.classList.contains('active')) {
            initialActive.classList.add('active');
            trigger.querySelector('.palette-name').textContent = initialActive.dataset.value;
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

    /* ============================================================
       6. 单色分配
    ============================================================ */
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
            <div class="palette-section-title">
                ${L().colorTitle}
            </div>
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
            const colorInput = wrap.querySelector('input[type="color"]');
            colorInput.addEventListener('input', (e) => {
                opts.onChange && opts.onChange(idx, e.target.value);
            });
            grid.appendChild(wrap);
        });
        container.appendChild(grid);
    }

    /* ============================================================
       7. 表格解析
    ============================================================ */
    function detectDelimiter(text) {
        const first = (text.split(/\r?\n/).find(l => l.trim()) || '');
        if (first.includes('\t')) return '\t';
        if (first.includes(','))  return ',';
        if (first.includes(';'))  return ';';
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
            } else {
                cur += ch;
            }
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
            headers.forEach((h, idx) => {
                row[h] = cells[idx] !== undefined ? cells[idx] : '';
            });
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
            if (total === 0) { types[h] = 'categorical'; return; }
            if (numericCount / total >= 0.8) types[h] = 'numeric';
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
        const rows = data.slice(0, maxRows).map(row => {
            return '<tr>' + headers.map(h => {
                const v = row[h] === undefined ? '' : String(row[h]);
                return `<td>${escapeHtml(v)}</td>`;
            }).join('') + '</tr>';
        }).join('');
        container.innerHTML = `
            <table>
                <thead><tr>${thead}</tr></thead>
                <tbody>${rows || `<tr><td colspan="${headers.length}">${L().noData}</td></tr>`}</tbody>
            </table>`;
    }

    /* ============================================================
       8. 第一步：导入数据面板（中英文自动）
    ============================================================ */
    function renderImportPanel(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId)
            : containerOrId;
        if (!container) return;

        const L10n = L();
        const title = opts.title || L10n.importTitle;
        const infoHtml = opts.infoBox || L10n.importInfo;
        const exampleData = opts.exampleData || '';
        const defaultMode = opts.defaultMode || 'file';

        container.className = 'step-card';
        container.innerHTML = `
            <div class="step-title">${title}</div>
            <div class="mode-tabs">
                <label><input type="radio" name="inputMode" value="file" ${defaultMode === 'file' ? 'checked' : ''}> ${L10n.modeFile}</label>
                <label><input type="radio" name="inputMode" value="text" ${defaultMode === 'text' ? 'checked' : ''}> ${L10n.modeText}</label>
            </div>
            <div class="file-input">
                <input type="file" class="import-file" accept=".csv,.tsv,.txt">
            </div>
            <div class="text-input">
                <textarea class="import-text" placeholder="${L10n.importPlaceholder}"></textarea>
            </div>
            <div class="info-box">${infoHtml}</div>
            <div class="btn-group">
                <button class="btn import-btn">${L10n.importBtn}</button>
                <button class="btn import-example-btn">${L10n.exampleBtn}</button>
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
        const exampleBtn = container.querySelector('.import-example-btn');

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
            if (!text || !text.trim()) {
                showMsg(L10n.msgEmptyInput, 'error');
                return;
            }
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
        exampleBtn.addEventListener('click', () => {
            if (!exampleData) return;
            const r = container.querySelector('input[name="inputMode"][value="text"]');
            r.checked = true;
            setMode('text');
            textArea.value = exampleData;
            importData();
        });

        setMode(defaultMode);
    }

    /* ============================================================
       8b. 分类聚合 + 排序
    ============================================================ */
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
            if (!map.has(key)) {
                map.set(key, { value: 0, firstRow: row, firstIndex: rowIndex });
            }
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
            const ka = a._sortKey;
            const kb = b._sortKey;
            const na = parseFloat(ka);
            const nb = parseFloat(kb);
            if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
            return String(ka).localeCompare(String(kb)) * dir;
        });

        const total = items.reduce((s, d) => s + d.value, 0);
        if (total > 0) items.forEach(d => d.percent = d.value / total);
        items.forEach(d => { delete d._sortKey; });
        return items;
    }

    /**
     * 填充"排序依据"下拉框
     * 始终把"输入顺序"（值 = '__input__'）放第一个
     */
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

    /* ============================================================
       9. 角色分配 UI
    ============================================================ */
    function renderRoleAssigner(container, opts) {
        opts = opts || {};
        const headers = opts.headers || [];
        const roles   = opts.roles   || [];
        const values  = opts.values  || {};
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

            const sel = wrap.querySelector('select');
            sel.addEventListener('change', () => {
                opts.onChange && opts.onChange(role.key, sel.value);
            });
            container.appendChild(wrap);
        });
    }

    /* ============================================================
       10. 导出
    ============================================================ */
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
    function downloadSVG(svgEl, filename) {
        if (!svgEl) { showToast(L().noSvg, 'error'); return; }
        const xml = new XMLSerializer();
        let source = xml.serializeToString(svgEl);
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
            const xml = new XMLSerializer();
            let source = xml.serializeToString(svgEl);
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
                    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                        w = parts[2]; h = parts[3];
                    }
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
            img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
            img.src = url;
        });
    }

    /* ============================================================
       11. Toast / 工具
    ============================================================ */
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
        toastTimer = setTimeout(() => { toast.classList.remove('show'); }, duration || 2200);
    }
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
    let uidCounter = 0;
    function uid(prefix) { return (prefix || 'id') + '_' + (++uidCounter) + '_' + Date.now().toString(36); }

    /* ============================================================
       12. i18n 辅助
    ============================================================ */
    function getLang() {
        return window.location.pathname.includes('/en/') ? 'en' : 'zh';
    }
    function getLangUrl() {
        const path = window.location.pathname;
        if (path.includes('/en/')) return path.replace('/en/', '/ch/');
        if (path.includes('/ch/')) return path.replace('/ch/', '/en/');
        return path;
    }
    function t(key, dict) {
        const lang = getLang();
        const d = dict || window.i18n || {};
        if (d[lang] && d[lang][key] !== undefined) return d[lang][key];
        if (d.zh && d.zh[key] !== undefined) return d.zh[key];
        return key;
    }

    /* ============================================================
       13. 对外暴露
    ============================================================ */
    global.PlotCommon = {
        hexToRgb, rgbToHex, mixColor, sampleStops, expandScheme,
        getCategoricalScheme,
        listPalettes, getCategoricalColors,
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
        getLang, getLangUrl, t,
        L
    };
})(window);
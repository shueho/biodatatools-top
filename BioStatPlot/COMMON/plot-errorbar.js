/* ============================================================
   BioDataTools 通用误差棒设置模块
============================================================ */
(function (global) {
    'use strict';

    const I18N = {
        zh: {
            panelTitle: '误差棒设置',
            modeLabel: '模式',
            modeNone: '不显示',
            modeRange: '上下限（两列）',
            modeValue: '误差值（一列）',
            lowerCol: '下限列',
            upperCol: '上限列',
            errCol: '误差值列',
            showWhich: '显示方式',
            showBoth: '上下限都显示',
            showUpper: '仅上限',
            showLower: '仅下限',
            colorModeLabel: '颜色模式',
            colorModeUniform: '统一颜色',
            colorModeBar: '与柱子同色',
            errColor: '误差棒颜色',
            errWidth: '误差棒线宽',
            guide: '需要计算上下限或误差值？可使用 <a href="s001.html" target="_blank" style="color:#1f4068;font-weight:600;">统计量计算器</a> 计算均值与标准差 / 标准误，将结果作为上下限或误差值使用。',
            noCol: '— 请选择 —',
            placeholder: '— 请先导入数据 —'
        },
        en: {
            panelTitle: 'Error Bar Settings',
            modeLabel: 'Mode',
            modeNone: 'None',
            modeRange: 'Range (2 columns)',
            modeValue: 'Error value (1 column)',
            lowerCol: 'Lower column',
            upperCol: 'Upper column',
            errCol: 'Error column',
            showWhich: 'Display',
            showBoth: 'Both',
            showUpper: 'Upper only',
            showLower: 'Lower only',
            colorModeLabel: 'Color mode',
            colorModeUniform: 'Uniform color',
            colorModeBar: 'Same as bar',
            errColor: 'Error bar color',
            errWidth: 'Error bar width',
            guide: 'Need to compute bounds or error values? Use the <a href="s001.html" target="_blank" style="color:#1f4068;font-weight:600;">Statistics Calculator</a> to compute mean and SD (or SEM), then use the results as upper/lower bounds or error values.',
            noCol: '— Select —',
            placeholder: '— Please import data first —'
        }
    };

    function getLang() {
        return window.location.pathname.includes('/en/') ? 'en' : 'zh';
    }

    function L() {
        return I18N[getLang()] || I18N.zh;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderColOptions(headers, current, placeholderText) {
        if (!headers || !headers.length) {
            return `<option>${placeholderText}</option>`;
        }
        const noCol = `<option value="">— 请选择 —</option>`;
        return noCol + headers.map(h =>
            `<option value="${escapeHtml(h)}" ${h === current ? 'selected' : ''}>${escapeHtml(h)}</option>`
        ).join('');
    }

    function renderErrorBarConfig(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId)
            : containerOrId;
        if (!container) return;

        const headers = opts.headers || [];
        const st = opts.state || {};
        const L10n = L();

        if (!st.mode) st.mode = 'none';
        if (!st.showWhich) st.showWhich = 'both';
        if (!st.colorMode) st.colorMode = 'uniform';
        if (!st.errColor) st.errColor = '#e67700';
        if (!st.errWidth) st.errWidth = 3;

        container.className = 'param-panel';
        container.innerHTML = `
            <div class="param-panel-title">${L10n.panelTitle}</div>
            <div class="param-grid cols-4">
                <div class="param-item">
                    <label>${L10n.modeLabel}</label>
                    <select class="eb-mode">
                        <option value="none" ${st.mode === 'none' ? 'selected' : ''}>${L10n.modeNone}</option>
                        <option value="range" ${st.mode === 'range' ? 'selected' : ''}>${L10n.modeRange}</option>
                        <option value="value" ${st.mode === 'value' ? 'selected' : ''}>${L10n.modeValue}</option>
                    </select>
                </div>
                <div class="param-item eb-range-opt">
                    <label>${L10n.lowerCol}</label>
                    <select class="eb-lower-col">${renderColOptions(headers, st.lowerCol, L10n.placeholder)}</select>
                </div>
                <div class="param-item eb-range-opt">
                    <label>${L10n.upperCol}</label>
                    <select class="eb-upper-col">${renderColOptions(headers, st.upperCol, L10n.placeholder)}</select>
                </div>
                <div class="param-item eb-value-opt">
                    <label>${L10n.errCol}</label>
                    <select class="eb-err-col">${renderColOptions(headers, st.errCol, L10n.placeholder)}</select>
                </div>
                <div class="param-item eb-value-opt">
                    <label>${L10n.showWhich}</label>
                    <select class="eb-show-which">
                        <option value="both" ${st.showWhich === 'both' ? 'selected' : ''}>${L10n.showBoth}</option>
                        <option value="upper" ${st.showWhich === 'upper' ? 'selected' : ''}>${L10n.showUpper}</option>
                        <option value="lower" ${st.showWhich === 'lower' ? 'selected' : ''}>${L10n.showLower}</option>
                    </select>
                </div>
                <div class="param-item eb-style-opt">
                    <label>${L10n.colorModeLabel}</label>
                    <select class="eb-color-mode">
                        <option value="uniform" ${st.colorMode === 'uniform' ? 'selected' : ''}>${L10n.colorModeUniform}</option>
                        <option value="sameAsBar" ${st.colorMode === 'sameAsBar' ? 'selected' : ''}>${L10n.colorModeBar}</option>
                    </select>
                </div>
                <div class="param-item eb-style-opt eb-color-opt">
                    <label>${L10n.errColor}</label>
                    <input type="color" class="eb-color" value="${st.errColor}">
                </div>
                <div class="param-item eb-style-opt">
                    <label>${L10n.errWidth}</label>
                    <input type="number" class="eb-width" value="${st.errWidth}" min="0.5" max="12" step="0.5">
                </div>
            </div>
            <div class="info-box" style="margin-top:10px;">${L10n.guide}</div>
        `;

        const modeSel = container.querySelector('.eb-mode');
        const rangeOpts = container.querySelectorAll('.eb-range-opt');
        const valueOpts = container.querySelectorAll('.eb-value-opt');
        const styleOpts = container.querySelectorAll('.eb-style-opt');
        const colorOpt = container.querySelector('.eb-color-opt');
        const colorModeSel = container.querySelector('.eb-color-mode');

        function updateVisibility() {
            const mode = st.mode;
            rangeOpts.forEach(el => { el.style.display = mode === 'range' ? '' : 'none'; });
            valueOpts.forEach(el => { el.style.display = mode === 'value' ? '' : 'none'; });
            styleOpts.forEach(el => { el.style.display = mode === 'none' ? 'none' : ''; });
            /* 统一颜色模式下才显示颜色选择器 */
            if (colorOpt) {
                const showColor = (mode !== 'none') && (st.colorMode === 'uniform');
                colorOpt.style.display = showColor ? '' : 'none';
            }
        }

        modeSel.addEventListener('change', () => {
            st.mode = modeSel.value;
            updateVisibility();
            opts.onChange && opts.onChange();
        });

        const lowerSel = container.querySelector('.eb-lower-col');
        if (lowerSel) lowerSel.addEventListener('change', function () {
            st.lowerCol = this.value;
            opts.onChange && opts.onChange();
        });

        const upperSel = container.querySelector('.eb-upper-col');
        if (upperSel) upperSel.addEventListener('change', function () {
            st.upperCol = this.value;
            opts.onChange && opts.onChange();
        });

        const errSel = container.querySelector('.eb-err-col');
        if (errSel) errSel.addEventListener('change', function () {
            st.errCol = this.value;
            opts.onChange && opts.onChange();
        });

        const whichSel = container.querySelector('.eb-show-which');
        if (whichSel) whichSel.addEventListener('change', function () {
            st.showWhich = this.value;
            opts.onChange && opts.onChange();
        });

        if (colorModeSel) colorModeSel.addEventListener('change', function () {
            st.colorMode = this.value;
            updateVisibility();
            opts.onChange && opts.onChange();
        });

        const colorInput = container.querySelector('.eb-color');
        if (colorInput) colorInput.addEventListener('input', function () {
            st.errColor = this.value;
            opts.onChange && opts.onChange();
        });

        const widthInput = container.querySelector('.eb-width');
        if (widthInput) widthInput.addEventListener('change', function () {
            const v = parseFloat(this.value);
            st.errWidth = isFinite(v) && v > 0 ? v : 3;
            opts.onChange && opts.onChange();
        });

        updateVisibility();
    }

    /**
     * 计算一行数据的误差棒区间
     * @param {object} row 当前行
     * @param {number} value 主值（如均值或求和）
     * @param {object} config { mode, lowerCol, upperCol, errCol, showWhich }
     * @returns {null|{lower:number, upper:number}}
     */
    function computeErrorExtent(row, value, config) {
    if (!config || config.mode === 'none') return null;

    const v = parseFloat(value);
    if (!isFinite(v)) return null;

    if (config.mode === 'range') {
        const hasLower = !!(config.lowerCol);
        const hasUpper = !!(config.upperCol);
        if (!hasLower && !hasUpper) return null;

        let lower = null, upper = null;

        if (hasLower) {
            const lv = parseFloat(row[config.lowerCol]);
            if (isFinite(lv)) lower = lv;
        }
        if (hasUpper) {
            const uv = parseFloat(row[config.upperCol]);
            if (isFinite(uv)) upper = uv;
        }

        /* 两列都填了但都无效 → 不画 */
        if (lower === null && upper === null) return null;

        /* 只填一列时，另一侧用主值补齐，实现"只画下限 / 只画上限" */
        if (lower === null) lower = v;
        if (upper === null) upper = v;

        return { lower: Math.min(lower, upper), upper: Math.max(lower, upper) };
    }

    if (config.mode === 'value') {
        const err = parseFloat(row[config.errCol]);
        if (!isFinite(err) || err < 0) return null;
        if (config.showWhich === 'upper') return { lower: v, upper: v + err };
        if (config.showWhich === 'lower') return { lower: v - err, upper: v };
        return { lower: v - err, upper: v + err };
    }

    return null;
}

    /**
     * 根据模式返回某一条误差棒的颜色
     * @param {object} config state.errBar
     * @param {string} barColor 对应柱/环的填充色
     */
    function resolveErrorColor(config, barColor) {
        if (!config) return '#e67700';
        if (config.colorMode === 'sameAsBar') return barColor || '#e67700';
        return config.errColor || '#e67700';
    }

    global.PlotErrorBar = {
        renderErrorBarConfig,
        computeErrorExtent,
        resolveErrorColor,
        L
    };
})(window);
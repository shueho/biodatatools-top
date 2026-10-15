(function () {
    'use strict';

    const SC = window.StatCommon;
    if (!SC) throw new Error('StatCommon is required by s001.js');

    function lang() {
        try { return PlotI18N.lang() === 'en' ? 'en' : 'zh'; }
        catch (e) { return 'zh'; }
    }
    function isEn() { return lang() === 'en'; }

    const state = {
        headers: [],
        data: [],
        columnTypes: {},
        groupCols: [],
        valueCols: [],
        result: null
    };

    const $ = id => document.getElementById(id);
    const groupColsBox = $('groupColsBox');
    const valueColsBox = $('valueColsBox');
    const resultTableWrap = $('resultTableWrap');
    const exportCsvBtn = $('exportCsvBtn');
    const copyTableBtn = $('copyTableBtn');
    const toolbarTip = $('toolbarTip');

    const EXAMPLE_DATA =
        'Factor1\tFactor2\tValue1\tValue2\n' +
        'A\ta\t85\t42\n' +
        'A\ta\t88\t45\n' +
        'A\ta\t82\t40\n' +
        'A\ta\t86\t43\n' +
        'A\ta\t84\t41\n' +
        'A\tb\t78\t36\n' +
        'A\tb\t80\t38\n' +
        'A\tb\t75\t34\n' +
        'A\tb\t79\t37\n' +
        'A\tb\t77\t35\n' +
        'A\tc\t70\t30\n' +
        'A\tc\t72\t32\n' +
        'A\tc\t68\t28\n' +
        'A\tc\t71\t31\n' +
        'A\tc\t69\t29\n' +
        'B\ta\t90\t48\n' +
        'B\ta\t92\t50\n' +
        'B\ta\t88\t46\n' +
        'B\ta\t91\t49\n' +
        'B\ta\t89\t47\n' +
        'B\tb\t82\t40\n' +
        'B\tb\t84\t42\n' +
        'B\tb\t80\t38\n' +
        'B\tb\t83\t41\n' +
        'B\tb\t81\t39\n' +
        'B\tc\t75\t34\n' +
        'B\tc\t77\t36\n' +
        'B\tc\t73\t32\n' +
        'B\tc\t76\t35\n' +
        'B\tc\t74\t33\n' +
        'C\ta\t95\t54\n' +
        'C\ta\t97\t56\n' +
        'C\ta\t93\t52\n' +
        'C\ta\t96\t55\n' +
        'C\ta\t94\t53\n' +
        'C\tb\t88\t46\n' +
        'C\tb\t90\t48\n' +
        'C\tb\t86\t44\n' +
        'C\tb\t89\t47\n' +
        'C\tb\t87\t45\n' +
        'C\tc\t80\t40\n' +
        'C\tc\t82\t42\n' +
        'C\tc\t78\t38\n' +
        'C\tc\t81\t41\n' +
        'C\tc\t79\t39';

    /* ============================================================
       数据导入与列选择
    ============================================================ */
    function onDataImported(res) {
        state.headers = res.headers;
        state.data = res.data;
        state.columnTypes = res.columnTypes || {};

        const catCols = res.headers.filter(h =>
            state.columnTypes[h] === 'categorical' || state.columnTypes[h] === 'date'
        );
        const numCols = res.headers.filter(h => state.columnTypes[h] === 'numeric');

        state.groupCols = catCols.slice();
        state.valueCols = numCols.slice();

        renderColCheckboxes();
        resetResults();
    }

    function renderColCheckboxes() {
        const emptyTip = isEn()
            ? '<span style="color:#999;font-size:14px;">Available after importing data</span>'
            : '<span style="color:#999;font-size:14px;">导入数据后可选择</span>';

        if (!state.headers.length) {
            groupColsBox.innerHTML = emptyTip;
            valueColsBox.innerHTML = emptyTip;
            return;
        }

        function makeHTML(cls, selected) {
            return state.headers.map(h => {
                const t = state.columnTypes[h] || '';
                const tag = t ? `<span class="col-type-tag ${t}">${t}</span>` : '';
                const checked = selected.includes(h) ? 'checked' : '';
                return `<label><input type="checkbox" class="${cls}" value="${PlotCommon.escapeHtml(h)}" ${checked}> ${PlotCommon.escapeHtml(h)} ${tag}</label>`;
            }).join('');
        }

        groupColsBox.innerHTML = makeHTML('group-col-cb', state.groupCols);
        valueColsBox.innerHTML = makeHTML('value-col-cb', state.valueCols);

        groupColsBox.querySelectorAll('.group-col-cb').forEach(cb => {
            cb.addEventListener('change', () => {
                state.groupCols = Array.from(
                    groupColsBox.querySelectorAll('.group-col-cb:checked')
                ).map(x => x.value);
                resetResults();
            });
        });

        valueColsBox.querySelectorAll('.value-col-cb').forEach(cb => {
            cb.addEventListener('change', () => {
                state.valueCols = Array.from(
                    valueColsBox.querySelectorAll('.value-col-cb:checked')
                ).map(x => x.value);
                resetResults();
            });
        });
    }

    /* ============================================================
       计算统计量
       —— 所有纯统计逻辑都委托给 StatCommon.calcStats
    ============================================================ */
    function compute() {
        if (!state.data.length) {
            showTip('msgTip3',
                isEn() ? '❌ Please import data first' : '❌ 请先导入数据',
                'error');
            return;
        }
        if (!state.valueCols.length) {
            showTip('msgTip3',
                isEn() ? '❌ Please select at least one numeric column' : '❌ 请至少选择一个数值列',
                'error');
            return;
        }

        // 按分组列聚合
        const groups = new Map();
        state.data.forEach(row => {
            const keyVals = state.groupCols.map(c => {
                const v = row[c];
                return (v === undefined || v === null) ? '' : String(v);
            });
            const key = keyVals.join('\u0001');
            if (!groups.has(key)) {
                groups.set(key, { keyValues: keyVals, rows: [] });
            }
            groups.get(key).rows.push(row);
        });

        const sortedGroups = Array.from(groups.values()).sort((a, b) => {
            for (let i = 0; i < a.keyValues.length; i++) {
                const cmp = String(a.keyValues[i]).localeCompare(String(b.keyValues[i]));
                if (cmp !== 0) return cmp;
            }
            return 0;
        });

        const resultHeaders = [
            ...state.groupCols,
            isEn() ? 'Variable' : '变量',
            'n', 'Sum', 'Mean',
            'SD', 'SD_Population', 'SEM',
            'Median', 'Min', 'Max', 'Range',
            'Q1', 'Q3', 'IQR',
            'CV(%)',
            'Skewness', 'SE_Skewness',
            'Kurtosis', 'SE_Kurtosis',
            'CI95_Lower', 'CI95_Upper'
        ];

        const resultRows = [];

        sortedGroups.forEach(g => {
            state.valueCols.forEach(valCol => {
                const values = g.rows
                    .map(r => parseFloat(r[valCol]))
                    .filter(v => isFinite(v));

                if (!values.length) return;

                const s = SC.calcStats(values);
                if (!s) return;

                resultRows.push([
                    ...g.keyValues,
                    valCol,
                    s.n,
                    s.sum,
                    s.mean,
                    s.sd,
                    s.sdPop,
                    s.sem,
                    s.median,
                    s.min,
                    s.max,
                    s.range,
                    s.q1,
                    s.q3,
                    s.iqr,
                    s.cv,
                    s.skewness,
                    s.seSkewness,
                    s.kurtosis,
                    s.seKurtosis,
                    s.ciLower,
                    s.ciUpper
                ]);
            });
        });

        if (!resultRows.length) {
            showTip('msgTip3',
                isEn()
                    ? '❌ No results generated. Please check the selected numeric columns.'
                    : '❌ 未能生成结果，请检查所选数值列',
                'error');
            state.result = null;
            renderResultTable();
            return;
        }

        state.result = { headers: resultHeaders, rows: resultRows };
        renderResultTable();

        exportCsvBtn.disabled = false;
        copyTableBtn.disabled = false;
        showTip('msgTip3',
            isEn()
                ? '✅ Calculation completed (' + resultRows.length + ' rows)'
                : '✅ 统计计算完成（共 ' + resultRows.length + ' 行）',
            'success');
    }

    /* ============================================================
       结果表渲染与导出
    ============================================================ */
    function getDisplayRows() {
        if (!state.result || !state.result.rows.length) return null;
        const { headers, rows } = state.result;
        const groupCount = state.groupCols.length;
        const varColIdx = groupCount;

        return rows.map(row => row.map((v, i) => {
            if (i <= varColIdx) return String(v);
            if (headers[i] === 'n') return String(v);
            return SC.formatNum(v);
        }));
    }

    function renderResultTable() {
        const displayRows = getDisplayRows();
        if (!displayRows) {
            resultTableWrap.innerHTML = '<div class="empty-tip">' +
                (isEn() ? 'Calculation results will be displayed here' : '计算结果将在此处显示') +
                '</div>';
            return;
        }

        const { headers } = state.result;

        const thead = '<tr>' + headers.map(h =>
            `<th>${PlotCommon.escapeHtml(h)}</th>`
        ).join('') + '</tr>';

        const tbody = displayRows.map(row =>
            '<tr>' + row.map(cell =>
                `<td>${PlotCommon.escapeHtml(cell)}</td>`
            ).join('') + '</tr>'
        ).join('');

        resultTableWrap.innerHTML = `
            <table>
                <thead>${thead}</thead>
                <tbody>${tbody}</tbody>
            </table>`;
    }

    function resetResults() {
        state.result = null;
        exportCsvBtn.disabled = true;
        copyTableBtn.disabled = true;
        toolbarTip.textContent = '';
        $('msgTip3').textContent = '';
        renderResultTable();
    }

    /* ============================================================
       导出 / 复制
    ============================================================ */
    function escapeCSV(v) {
        const s = String(v);
        if (/[",\n\r]/.test(s)) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    exportCsvBtn.addEventListener('click', () => {
        const displayRows = getDisplayRows();
        if (!displayRows) return;

        const { headers } = state.result;
        const csvRows = [
            headers.map(escapeCSV).join(','),
            ...displayRows.map(row => row.map(escapeCSV).join(','))
        ];

        const csv = '\uFEFF' + csvRows.join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        downloadBlob(blob, 'descriptive_statistics.csv');
        toolbarTip.innerHTML = '<span class="success">' +
            (isEn() ? '✅ Table exported successfully' : '✅ 表格导出成功') +
            '</span>';
    });

    copyTableBtn.addEventListener('click', () => {
        const displayRows = getDisplayRows();
        if (!displayRows) return;

        const { headers } = state.result;
        const tsvRows = [
            headers.join('\t'),
            ...displayRows.map(row => row.join('\t'))
        ];
        const tsv = tsvRows.join('\n');

        function done() {
            toolbarTip.innerHTML = '<span class="success">' +
                (isEn() ? '✅ Table copied to clipboard' : '✅ 表格已复制到剪贴板') +
                '</span>';
            setTimeout(() => { toolbarTip.textContent = ''; }, 2500);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(tsv).then(done).catch(() => fallbackCopy(tsv, done));
        } else {
            fallbackCopy(tsv, done);
        }
    });

    function fallbackCopy(text, done) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            done();
        } catch (e) {
            toolbarTip.innerHTML = '<span class="error">' +
                (isEn() ? '❌ Copy failed. Please manually select the table.' : '❌ 复制失败，请手动选择表格') +
                '</span>';
        }
        document.body.removeChild(ta);
    }

    /* ============================================================
       工具
    ============================================================ */
    function showTip(elId, msg, type) {
        const el = $(elId);
        el.className = 'tip-text ' + (type || '');
        el.textContent = msg;
        setTimeout(() => { el.textContent = ''; el.className = 'tip-text'; }, 3500);
    }

    /* ============================================================
       初始化
    ============================================================ */
    function init() {
        PlotCommon.renderImportPanel('importPanel', {
            title: isEn() ? 'Step 1: Import Data' : '第一步：导入数据',
            infoBox: isEn()
                ? 'Must contain headers. Can be multi-factor or multi-response tables; you can paste Excel content directly. Example: <strong>Factor1 (A/B/C) × Factor2 (a/b/c)</strong> two-factor grouping, two numeric columns <strong>Value1 / Value2</strong>, <strong>5 replicates</strong> each, 45 rows total.'
                : '需包含表头，可以为多因素或多因变量表格，可直接粘贴 Excel 内容。示例为 <strong>Factor1（A/B/C）× Factor2（a/b/c）</strong> 双因素分组，两个数值列 <strong>Value1 / Value2</strong>，每个组合 <strong>5 次重复</strong>，共 45 行。',
            exampleData: EXAMPLE_DATA,
            defaultMode: 'file',
            onImport: onDataImported,
            onReset: resetAll
        });

        $('calcBtn').addEventListener('click', compute);

        renderColCheckboxes();
        resetResults();
    }

    function resetAll() {
        state.headers = [];
        state.data = [];
        state.columnTypes = {};
        state.groupCols = [];
        state.valueCols = [];
        state.result = null;
        renderColCheckboxes();
        resetResults();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
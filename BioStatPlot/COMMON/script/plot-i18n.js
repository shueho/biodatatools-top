/* ============================================================
   BioDataTools 中英文翻译（公共）
   说明：后续英文版放在 /en/ 目录，语言按 URL 自动判断：
        - 路径包含 /en/ -> 英文
        - 其它 -> 中文
   页面或组件里统一用 PlotI18N.t('key') 取文案。
============================================================ */
(function (global) {
    'use strict';

    const DICT = {
        zh: {
            importTitle: '第一步：导入数据',
            importInfo: '需包含表头，且至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>。可直接粘贴 Excel 内容。',
            noData: '❌ 请先导入数据',
            selectColumns: '❌ 请在第 2 步选择分类列和数值列',
            noValidData: '❌ 未能生成有效绘图数据，请检查数值列',
            drawDone: '✅ 图表绘制完成',
            svgOk: '✅ SVG 导出成功',
            pngOk: '✅ PNG 导出成功',
            pngFail: '❌ PNG 导出失败',
            placeholder: '导入数据并完成设置后，点击“绘制图表”查看结果',
            colorEmpty: '选择分类列后将在此处显示每个类别的颜色',
            notSelected: '— 请先导入数据 —'
        },
        en: {
            importTitle: 'Step 1: Import Data',
            importInfo: 'Must include a header row with at least a <strong>category column</strong> and a <strong>value column</strong>. You can paste directly from Excel.',
            noData: '❌ Please import data first',
            selectColumns: '❌ Please select the category and value columns in step 2',
            noValidData: '❌ Could not generate valid plot data. Please check the value column',
            drawDone: '✅ Chart drawn',
            svgOk: '✅ SVG exported',
            pngOk: '✅ PNG exported',
            pngFail: '❌ PNG export failed',
            placeholder: 'Import data and complete settings, then click "Draw Chart" to see the result',
            colorEmpty: 'Category colors will be shown here after selecting a category column',
            notSelected: '— Please import data first —'
        }
    };

    function lang() {
        return window.location.pathname.indexOf('/en/') >= 0 ? 'en' : 'zh';
    }

    function t(key) {
        const d = DICT[lang()] || DICT.zh;
        if (d[key] !== undefined) return d[key];
        if (DICT.zh[key] !== undefined) return DICT.zh[key];
        return key;
    }

    global.PlotI18N = { lang: lang, t: t, dict: DICT };
})(window);

/**
 * BioDataTools Chart Default Parameters
 */
// ============================================================
// 1. Common defaults
// ============================================================
var COMMON_DEFAULTS = {
    width: 600, height: 600,
    margin: { top: 70, right: 100, bottom: 50, left: 100 },
    fontFamily: 'Times New Roman',
    showTitle: true, title: 'BioStatPlot',
    titleFontSize: 22, titleYOffset: -12,
    titleBold: true, titleItalic: false,
    showLegend: true, showLegendTitle: true,
    legendTitle: 'Legend', legendTitleFontSize: 16,
    legendTitleBold: true, legendTitleItalic: false,
    legendTitleSpacing: 0, legendMarkerSize: 18,
    legendItemSpacing: 22, legendX: 1, legendY: 0.3,
    legendFontSize: 12, legendBold: false, legendItalic: false,
    showPercent: true, percentFontSize: 18,
    percentBold: true, percentItalic: false,
    showCategory: false, categoryFontSize: 12,
    categoryBold: false, categoryItalic: false,
    labelRadiusRatio: 0.78, enableLeaderLine: true,
    opacity: 0.85
};

// ============================================================
// 2. Pie/Donut chart defaults
// ============================================================
var PIE_DEFAULTS = { ...COMMON_DEFAULTS, innerRadiusRatio: 0.6, direction: 'clockwise' };

// ============================================================
// 3. Bar chart defaults
// ============================================================
var BAR_DEFAULTS = {
    ...COMMON_DEFAULTS,
    width: 700, height: 500,
    margin: { top: 70, right: 80, bottom: 70, left: 80 },
    xLabel: 'Category', yLabel: 'Value',
    axisLabelSize: 14,
    barMode: 'grouped', horizontal: false, barGap: 0.2
};

// ============================================================
// 4. Box plot defaults
// ============================================================
var BOX_DEFAULTS = {
    ...COMMON_DEFAULTS,
    width: 700, height: 500,
    margin: { top: 70, right: 60, bottom: 70, left: 80 },
    xLabel: 'Group', yLabel: 'Value',
    axisLabelSize: 14,
    showPoints: false, boxWidth: 0.6
};

// ============================================================
// 5. Scatter plot defaults
// ============================================================
var SCATTER_DEFAULTS = {
    ...COMMON_DEFAULTS,
    width: 700, height: 500,
    margin: { top: 70, right: 60, bottom: 70, left: 80 },
    xLabel: 'X Axis', yLabel: 'Y Axis',
    axisLabelSize: 14,
    pointSize: 7, showTrend: true
};

// ============================================================
// 6. Line chart defaults
// ============================================================
var LINE_DEFAULTS = {
    ...COMMON_DEFAULTS,
    width: 700, height: 500,
    margin: { top: 70, right: 60, bottom: 70, left: 80 },
    xLabel: 'X Axis', yLabel: 'Y Axis',
    axisLabelSize: 14,
    lineWidth: 2.5, showDots: true
};

// ============================================================
// 7. Volcano plot defaults
// ============================================================
var VOLCANO_DEFAULTS = {
    ...COMMON_DEFAULTS,
    width: 700, height: 550,
    margin: { top: 60, right: 60, bottom: 60, left: 80 },
    fcCutoff: 1, pCutoff: 0.05,
    pointSize: 5, topN: 10
};

// ============================================================
// 8. Violin plot defaults
// ============================================================
var VIOLIN_DEFAULTS = {
    ...COMMON_DEFAULTS,
    width: 700, height: 500,
    margin: { top: 70, right: 40, bottom: 70, left: 80 },
    showBox: true, showPoints: false, bandwidth: 0.15
};

// ============================================================
// Parameter ranges
// ============================================================
var PARAM_RANGES = {
    width: { min: 400, max: 1200, step: 10 },
    height: { min: 400, max: 1200, step: 10 },
    margin: { min: 0, max: 200, step: 5 },
    titleFontSize: { min: 12, max: 42, step: 1 },
    titleYOffset: { min: -50, max: 50, step: 2 },
    legendTitleFontSize: { min: 10, max: 20, step: 1 },
    legendTitleSpacing: { min: 0, max: 30, step: 1 },
    legendMarkerSize: { min: 8, max: 28, step: 1 },
    legendItemSpacing: { min: 16, max: 40, step: 1 },
    legendX: { min: 0, max: 1.1, step: 0.01 },
    legendY: { min: 0, max: 1.1, step: 0.01 },
    legendFontSize: { min: 10, max: 20, step: 1 },
    percentFontSize: { min: 10, max: 28, step: 1 },
    categoryFontSize: { min: 10, max: 24, step: 1 },
    labelRadiusRatio: { min: 0.5, max: 1.0, step: 0.01 },
    innerRadiusRatio: { min: 0, max: 0.9, step: 0.01 },
    opacity: { min: 0.1, max: 1.0, step: 0.01 },
    pointSize: { min: 2, max: 15, step: 1 },
    barGap: { min: 0, max: 0.8, step: 0.02 },
    lineWidth: { min: 1, max: 6, step: 0.5 },
    bandwidth: { min: 0.05, max: 0.5, step: 0.01 }
};

// Export to global
window.COMMON_DEFAULTS = COMMON_DEFAULTS;
window.PIE_DEFAULTS = PIE_DEFAULTS;
window.BAR_DEFAULTS = BAR_DEFAULTS;
window.BOX_DEFAULTS = BOX_DEFAULTS;
window.SCATTER_DEFAULTS = SCATTER_DEFAULTS;
window.LINE_DEFAULTS = LINE_DEFAULTS;
window.VOLCANO_DEFAULTS = VOLCANO_DEFAULTS;
window.VIOLIN_DEFAULTS = VIOLIN_DEFAULTS;
window.PARAM_RANGES = PARAM_RANGES;

console.log('✔ BioDataTools defaults loaded (v2.0 - 8 chart types)');

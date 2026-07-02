/**
 * BioDataTools 图表默认参数
 * 所有图表的默认配置集中管理
 */

// ============================================================
// 1. 通用默认配置
// ============================================================
var COMMON_DEFAULTS = {
    // 画布尺寸
    width: 600,
    height: 600,
    
    // 边距
    margin: {
        top: 70,
        right: 100,
        bottom: 50,
        left: 100
    },
    
    // 字体
    fontFamily: 'Times New Roman',
    
    // 标题
    showTitle: true,
    title: 'BioStatPlot',
    titleFontSize: 22,
    titleYOffset: -12,
    titleBold: true,
    titleItalic: false,
    
    // 图例
    showLegend: true,
    showLegendTitle: true,
    legendTitle: 'Legend',
    legendTitleFontSize: 16,
    legendTitleBold: true,
    legendTitleItalic: false,
    legendTitleSpacing: 0,
    legendMarkerSize: 18,
    legendItemSpacing: 22,
    legendX: 1,
    legendY: 0.3,
    legendFontSize: 12,
    legendBold: false,
    legendItalic: false,
    
    // 标注
    showPercent: true,
    percentFontSize: 18,
    percentBold: true,
    percentItalic: false,
    showCategory: false,
    categoryFontSize: 12,
    categoryBold: false,
    categoryItalic: false,
    labelRadiusRatio: 0.78,
    enableLeaderLine: true,
    
    // 透明度
    opacity: 0.85
};

// ============================================================
// 2. 饼图/环图专属配置
// ============================================================
var PIE_DEFAULTS = {
    ...COMMON_DEFAULTS,
    innerRadiusRatio: 0.6,
    direction: 'clockwise'
};

// ============================================================
// 3. 参数范围定义（所有图表共享）
// ============================================================
var PARAM_RANGES = {
    // 画布尺寸
    width: { min: 400, max: 1200, step: 10 },
    height: { min: 400, max: 1200, step: 10 },
    
    // 边距
    margin: { min: 0, max: 200, step: 5 },
    
    // 标题
    titleFontSize: { min: 12, max: 42, step: 1 },
    titleYOffset: { min: -50, max: 50, step: 2 },
    
    // 图例
    legendTitleFontSize: { min: 10, max: 20, step: 1 },
    legendTitleSpacing: { min: 0, max: 30, step: 1 },
    legendMarkerSize: { min: 8, max: 28, step: 1 },
    legendItemSpacing: { min: 16, max: 40, step: 1 },
    legendX: { min: 0, max: 1.1, step: 0.01 },
    legendY: { min: 0, max: 1.1, step: 0.01 },
    legendFontSize: { min: 10, max: 20, step: 1 },
    
    // 标注
    percentFontSize: { min: 10, max: 28, step: 1 },
    categoryFontSize: { min: 10, max: 24, step: 1 },
    labelRadiusRatio: { min: 0.5, max: 1.0, step: 0.01 },
    
    // 饼图特有
    innerRadiusRatio: { min: 0, max: 0.9, step: 0.01 },
    
    // 透明度
    opacity: { min: 0.1, max: 1.0, step: 0.01 }
};

// ============================================================
// 4. 柱形图专属默认配置（预留）
// ============================================================
var BAR_DEFAULTS = {
    ...COMMON_DEFAULTS
    // 柱形图特有参数（后续添加）
    // barWidth: 0.7,
    // showValues: true
};

// ============================================================
// 5. 散点图专属默认配置（预留）
// ============================================================
var SCATTER_DEFAULTS = {
    ...COMMON_DEFAULTS
    // 散点图特有参数（后续添加）
    // pointSize: 8,
    // showTrend: false
};

// ============================================================
// 6. 导出到全局
// ============================================================
window.COMMON_DEFAULTS = COMMON_DEFAULTS;
window.PIE_DEFAULTS = PIE_DEFAULTS;
window.BAR_DEFAULTS = BAR_DEFAULTS;
window.SCATTER_DEFAULTS = SCATTER_DEFAULTS;
window.PARAM_RANGES = PARAM_RANGES;

console.log('✅ BioDataTools 默认参数已加载');
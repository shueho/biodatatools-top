/**
 * BioDataTools 中英文语言包
 * 独立管理所有界面文本
 */

// ============================================================
// 1. 语言配置字典
// ============================================================
var LANG_CONFIG = {
    en: {
        // ===== 通用 =====
        yes: 'Yes',
        no: 'No',
        
        // ===== 数据面板 =====
        dataPanelTitle: '📊 Data Management & Preview',
        importLabel: 'Import Data',
        csvPlaceholder: 'Example:\nA\t30\nB\t25\nC\t20\nD\t15',
        applyBtn: 'Apply',
        exportBtn: 'Export (with colors)',
        uploadLabel: 'Upload File',
        importTip: 'Copy two columns from Excel: Category, Value.',
        paletteLabel: '🎨 Color Palette',
        paletteTip: 'Switch color scheme, colors will auto-update',
        thName: 'Category',
        thValue: 'Value',
        thColor: 'Color',
        delBtn: 'Del',
        addBtn: '+ Add Category',
        totalLabel: 'Total',
        
        // ===== 配置面板 =====
        configPanelTitle: '⚙️ Chart Configuration',
        
        // 画布与边距
        secCanvas: '📐 Canvas & Margins',
        lblWidth: 'Width (px)',
        lblHeight: 'Height (px)',
        lblTop: 'Top Margin',
        lblBottom: 'Bottom Margin',
        lblLeft: 'Left Margin',
        lblRight: 'Right Margin',
        
        // 标题设置
        secTitle: '📝 Title Settings',
        lblShowTitle: 'Show Title',
        lblTitleText: 'Title Text',
        lblTitleSize: 'Font Size',
        lblTitleBold: 'Bold',
        lblTitleItalic: 'Italic',
        lblTitleYOffset: 'Y Offset (px)',
        
        // 图例设置
        secLegend: '📍 Legend Settings',
        lblShowLegend: 'Show Legend',
        lblShowLegendTitle: 'Show Legend Title',
        lblLegendTitle: 'Legend Title',
        lblLegendTitleSize: 'Title Font Size',
        lblLegendTitleBold: 'Title Bold',
        lblLegendTitleItalic: 'Title Italic',
        lblLegendTitleSpacing: 'Title Spacing',
        lblLegendMarkerSize: 'Marker Size',
        lblLegendItemSpacing: 'Item Spacing',
        lblLegendX: 'Legend X (0-1.1)',
        lblLegendY: 'Legend Y (0-1.1)',
        lblLegendFontSize: 'Font Size',
        lblLegendBold: 'Bold',
        lblLegendItalic: 'Italic',
        
        // 标注与引导线
        secLabel: '🔤 Labels & Leader Lines',
        lblShowPercent: 'Show Percent',
        lblPercentSize: 'Percent Font Size',
        lblPercentBold: 'Percent Bold',
        lblPercentItalic: 'Percent Italic',
        lblShowCategory: 'Show Category',
        lblCategorySize: 'Category Font Size',
        lblCategoryBold: 'Category Bold',
        lblCategoryItalic: 'Category Italic',
        lblLabelRadius: 'Label Radius Ratio',
        lblLeaderLine: 'Leader Line (<8%)',
        optEnable: 'Enable',
        optDisable: 'Disable',
        
        // 环形/饼图样式
        secStyle: '🎨 Pie / Donut Style',
        lblInnerRadius: 'Inner Radius (0=Pie)',
        lblDirection: 'Direction',
        optClockwise: 'Clockwise',
        optCounter: 'Counterclockwise',
        lblFontFamily: 'Font Family',
        lblOpacity: 'Opacity',
        
        // 导出与配置
        secExport: '📎 Export & Config',
        btnSVG: 'SVG',
        btnPNG: 'PNG',
        btnPDF: 'PDF',
        btnReset: 'Reset Default',
        btnExportConfig: 'Export Config',
        btnImportConfig: 'Import Config',
        configTip: 'Config auto-saved to local storage',
        
        // ===== 绘图区 =====
        toolbarTip: 'Small slices (＜8%) show external leader lines',
        
        // ===== 语言切换 =====
        langBtn: '中文',
        
        // ===== 提示信息 =====
        noData: 'No data',
        pasteData: 'Please paste data',
        noValidData: 'No valid data parsed',
        noSVG: 'No SVG element',
        pngFailed: 'PNG export failed',
        pdfFailed: 'PDF export failed',
        invalidConfig: 'Invalid config file',
        drawFailed: 'Draw failed'
    },
    
    zh: {
        // ===== 通用 =====
        yes: '是',
        no: '否',
        
        // ===== 数据面板 =====
        dataPanelTitle: '📊 数据管理 & 预览',
        importLabel: '导入数据',
        csvPlaceholder: '示例：\nA\t30\nB\t25\nC\t20\nD\t15',
        applyBtn: '应用数据',
        exportBtn: '导出数据(含颜色)',
        uploadLabel: '上传文件',
        importTip: '可以直接从EXCEL复制两列数据，第一列为分类，第二列为值。',
        paletteLabel: '🎨 配色方案',
        paletteTip: '切换配色，颜色将自动更新',
        thName: '分类名称',
        thValue: '数值',
        thColor: '颜色',
        delBtn: '删',
        addBtn: '+ 添加分类',
        totalLabel: '总计',
        
        // ===== 配置面板 =====
        configPanelTitle: '⚙️ 图表参数配置',
        
        // 画布与边距
        secCanvas: '📐 画布与边距',
        lblWidth: '宽度 (px)',
        lblHeight: '高度 (px)',
        lblTop: '上边距',
        lblBottom: '下边距',
        lblLeft: '左边距',
        lblRight: '右边距',
        
        // 标题设置
        secTitle: '📝 标题设置',
        lblShowTitle: '显示标题',
        lblTitleText: '标题文字',
        lblTitleSize: '标题字号',
        lblTitleBold: '标题加粗',
        lblTitleItalic: '标题斜体',
        lblTitleYOffset: '标题Y偏移 (px)',
        
        // 图例设置
        secLegend: '📍 图例设置',
        lblShowLegend: '显示图例',
        lblShowLegendTitle: '显示图例标题',
        lblLegendTitle: '图例标题',
        lblLegendTitleSize: '标题字号',
        lblLegendTitleBold: '标题加粗',
        lblLegendTitleItalic: '标题斜体',
        lblLegendTitleSpacing: '标题与图例项间距(px)',
        lblLegendMarkerSize: '图例标记大小 (px)',
        lblLegendItemSpacing: '图例项垂直间距(px)',
        lblLegendX: '图例X (0-1.1)',
        lblLegendY: '图例Y (0-1.1)',
        lblLegendFontSize: '图例项字号',
        lblLegendBold: '图例项加粗',
        lblLegendItalic: '图例项斜体',
        
        // 标注与引导线
        secLabel: '🔤 标注与引导线',
        lblShowPercent: '显示百分比',
        lblPercentSize: '百分比字号',
        lblPercentBold: '百分比加粗',
        lblPercentItalic: '百分比斜体',
        lblShowCategory: '显示分类名',
        lblCategorySize: '分类字号',
        lblCategoryBold: '分类加粗',
        lblCategoryItalic: '分类斜体',
        lblLabelRadius: '文字半径比例',
        lblLeaderLine: '小份额引导线(＜8%)',
        optEnable: '启用外部引导线',
        optDisable: '禁用(留在扇形内)',
        
        // 环形/饼图样式
        secStyle: '🎨 环形/饼图样式',
        lblInnerRadius: '内径比例 (0=饼图)',
        lblDirection: '扇形方向',
        optClockwise: '顺时针',
        optCounter: '逆时针',
        lblFontFamily: '全局字体',
        lblOpacity: '透明度',
        
        // 导出与配置
        secExport: '📎 导出 & 配置',
        btnSVG: 'SVG',
        btnPNG: 'PNG',
        btnPDF: 'PDF',
        btnReset: '重置默认',
        btnExportConfig: '导出配置',
        btnImportConfig: '导入配置',
        configTip: '配置自动保存至本地存储',
        
        // ===== 绘图区 =====
        toolbarTip: '小份额扇形 (＜8%) 自动显示外部引导线',
        
        // ===== 语言切换 =====
        langBtn: 'English',
        
        // ===== 提示信息 =====
        noData: '无有效数据',
        pasteData: '请粘贴数据',
        noValidData: '未解析到有效数据',
        noSVG: '无SVG元素',
        pngFailed: 'PNG导出失败',
        pdfFailed: 'PDF导出失败',
        invalidConfig: '配置文件无效',
        drawFailed: '绘图失败'
    }
};

// ============================================================
// 2. 语言管理工具
// ============================================================
var LangManager = {
    currentLang: 'en',
    
    /**
     * 获取当前语言
     */
    getLang: function() {
        return this.currentLang;
    },
    
    /**
     * 设置当前语言
     */
    setLang: function(lang) {
        if (lang === 'en' || lang === 'zh') {
            this.currentLang = lang;
        }
    },
    
    /**
     * 获取指定语言的文本
     * @param {string} key - 文本键名
     * @param {string} lang - 语言代码 (en/zh)，不传则使用当前语言
     * @returns {string} 对应语言的文本
     */
    t: function(key, lang) {
        lang = lang || this.currentLang;
        var result = LANG_CONFIG[lang];
        if (!result) return key;
        return result[key] || key;
    },
    
    /**
     * 切换语言并更新页面
     * @param {string} lang - 目标语言 (en/zh)
     * @param {object} context - Vue 组件上下文（可选）
     */
    switchLanguage: function(lang, context) {
        if (lang !== 'en' && lang !== 'zh') return;
        this.currentLang = lang;
        
        // 1. 更新所有带 data-lang-key 属性的元素
        var elements = document.querySelectorAll('[data-lang-key]');
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            var key = el.getAttribute('data-lang-key');
            var text = this.t(key, lang);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else {
                el.textContent = text;
            }
        }
        
        // 2. 更新下拉框选项（带 data-lang-options 属性）
        var selects = document.querySelectorAll('select[data-lang-options]');
        for (var j = 0; j < selects.length; j++) {
            var select = selects[j];
            var optionKey = select.getAttribute('data-lang-options');
            var options = window[optionKey] || [];
            var currentValue = select.value;
            select.innerHTML = '';
            for (var k = 0; k < options.length; k++) {
                var opt = options[k];
                var option = document.createElement('option');
                option.value = opt.value;
                option.textContent = typeof opt.label === 'function' ? opt.label(lang) : opt.label;
                if (opt.value === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            }
        }
        
        // 3. 更新语言切换按钮文本
        var btn = document.getElementById('langSwitchBtn');
        if (btn) {
            btn.textContent = this.t('langBtn', lang);
            btn.setAttribute('data-lang', lang);
        }
        
        // 4. 更新图例标题
        if (context && context.config) {
            context.config.legendTitle = lang === 'en' ? 'Legend' : '图例';
        }
        
        // 5. 触发自定义事件，通知其他组件
        var event = new CustomEvent('languageChanged', {
            detail: { lang: lang }
        });
        document.dispatchEvent(event);
    },
    
    /**
     * 初始化页面语言
     * @param {string} initialLang - 初始语言 (en/zh)
     * @param {object} context - Vue 组件上下文（可选）
     */
    initPage: function(initialLang, context) {
        initialLang = initialLang || 'en';
        this.switchLanguage(initialLang, context);
    }
};

// ============================================================
// 3. 导出到全局
// ============================================================
window.LANG_CONFIG = LANG_CONFIG;
window.LangManager = LangManager;

console.log('✅ BioDataTools 语言包已加载');
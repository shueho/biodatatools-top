(function () {
    'use strict';

    const PC = window.PlotCommon;

    const I18N = {
        zh: {
            'common.auto': '自动',
            'common.none': '（无）',
            'tip.placeholder': '导入数据并完成设置后，点击“绘制图表”查看结果',
            'tip.success': '✅ 图表绘制完成',
            'genome.empty': '尚未导入基因组结构文件',
            'genome.colChr': '染色体编号列',
            'genome.colLen': '染色体长度列',
            'genome.colCen': '着丝粒位置列（可选）',
            'density.empty': '尚未导入基因密度文件',
            'density.colChr': '染色体编号列',
            'density.colStart': '起始列',
            'density.colEnd': '终止列',
            'density.colValue': '数值列',
            'chrColor.mode': '着色方式',
            'chrColor.modePalette': '按色板分配',
            'chrColor.modeUniform': '统一颜色',
            'chrColor.palette': '离散色板',
            'chrColor.uniform': '统一颜色',
            'chrColor.empty': '导入数据后可单独调整每条染色体的颜色',
            'densityColor.mode': '色板模式',
            'densityColor.modePreset': '预设色板',
            'densityColor.mode2': '自定义双色',
            'densityColor.mode3': '自定义三色',
            'densityColor.reverse': '反转色板方向',
            'densityColor.low': '低值颜色',
            'densityColor.mid': '中间颜色',
            'densityColor.high': '高值颜色',
            'layout.title': '布局',
            'layout.orient': '坐标轴方向',
            'layout.orientV': '纵向',
            'layout.orientH': '横向',
            'layout.perLineV': '每行染色体个数',
            'layout.perLineH': '每列染色体个数',
            'layout.maxLen': '最长长度 (px)',
            'layout.chrWidth': '染色体宽度',
            'layout.chrGap': '染色体间距',
            'layout.groupGap': '组间距（行/列之间）',
            'layout.curvature': '端部曲率',
            'layout.centromere': '显示着丝粒',
            'layout.strokeColor': '描边颜色',
            'layout.strokeWidth': '描边粗细',
            'layout.opacity': '染色体透明度',
            'layout.labelPos': '染色体编号位置',
            'layout.labelPosNone': '不显示',
            'layout.labelPosTop': '上方',
            'layout.labelPosBottom': '下方',
            'layout.labelSize': '编号字号',
            'layout.bold': '加粗',
            'layout.italic': '斜体',
            'axis.title': '坐标轴（染色体长度轴）',
            'axis.show': '显示坐标轴',
            'axis.groupAlign': '刻度对齐每组最长染色体',
            'axis.unit': '单位',
            'axis.offset': '轴线偏移 (px)',
            'axis.tickShow': '显示刻度值',
            'axis.tickMode': '刻度模式',
            'axis.tickAuto': '自动',
            'axis.tickRange': '范围',
            'axis.tickCustom': '自定义列表',
            'axis.tickCount': '刻度数量',
            'axis.min': '最小值',
            'axis.max': '最大值',
            'axis.step': '间隔',
            'axis.customList': '自定义刻度值（逗号分隔，单位同上）',
            'axis.customPlaceholder': '如 0,50,100,150',
            'axis.fontSize': '字号',
            'axis.tickBold': '刻度值加粗',
            'axis.tickColor': '刻度颜色',
            'axis.lineColor': '轴线颜色',
            'axis.titleShow': '显示轴标题',
            'axis.titleContent': '标题内容',
            'axis.titleFontSize': '标题字号',
            'axis.info': '坐标轴方向由“布局”中的“坐标轴方向”统一控制；刻度范围、间隔、自定义刻度值均以所选单位填写。',
            'colorbar.title': '色条设置',
            'colorbar.show': '显示色条',
            'colorbar.orient': '方向',
            'colorbar.orientV': '纵向',
            'colorbar.orientH': '横向',
            'colorbar.titleText': '标题',
            'colorbar.thickness': '粗细 (px)',
            'colorbar.length': '长度 (px，留空自动)',
            'colorbar.tickSide': '刻度位置',
            'colorbar.tickSideLeft': '左 / 上',
            'colorbar.tickSideRight': '右 / 下',
            'colorbar.tickMode': '刻度模式',
            'colorbar.tickAuto': '自动',
            'colorbar.tickCustom': '自定义',
            'colorbar.tickCount': '刻度数量',
            'colorbar.customList': '自定义刻度值（逗号分隔）',
            'colorbar.customPlaceholder': '如 0,5,10',
            'colorbar.decimals': '小数位数',
            'colorbar.labelFontSize': '刻度字号',
            'colorbar.titleFontSize': '标题字号',
            'colorbar.tickColor': '刻度颜色',
            'colorbar.min': '最小值（留空自动）',
            'colorbar.max': '最大值（留空自动）',
            'labels.title': '基因标注',
            'labels.show': '显示基因标注',
            'labels.side': '标注方向',
            'labels.sideRight': '右侧/下方',
            'labels.sideLeft': '左侧/上方',
            'labels.fontSize': '字号',
            'labels.color': '文字颜色',
            'labels.leadLen': '引导线长度',
            'labels.leadColor': '引导线颜色',
            'labels.bold': '加粗',
            'labels.italic': '斜体',
            'labels.dataLabel': '标注数据（标签名/染色体/位置）',
            'labels.apply': '应用文本',
            'labels.sample': '生成示例',
            'labels.import': '导入文件',
            'labels.hint': '每行一条，位置填统一坐标（如基因中点/起点/终点）即可。',
            'labels.errCols': '标注数据至少需要3列：标签名、染色体、位置。',
            'labels.errNoData': '请先导入数据',
            'import.genomeTitle': '基因组结构文件（可选）',
            'import.genomeInfo': '需包含表头，至少包含 <strong>染色体编号列</strong> 和 <strong>染色体长度列</strong>；<strong>着丝粒位置列</strong>可选。',
            'import.densityTitle': '基因密度文件（可选）',
            'import.densityInfo': '需包含表头，至少包含 <strong>染色体编号列</strong>、<strong>起始列</strong>、<strong>终止列</strong>、<strong>数值列</strong>。',
            'err.d3': 'd3 加载失败，请刷新页面重试。',
            'err.png': 'PNG导出失败，请使用SVG导出。',
            'style.load': '加载样式',
            'style.export': '导出样式',
            'style.restored': '✅ 样式已恢复',
            'style.exported': '✅ 样式已导出',
            'style.invalid': '❌ 样式文件无效'
        },
        en: {
            'common.auto': 'Auto',
            'common.none': '(None)',
            'tip.placeholder': 'Import data and configure settings, then click "Draw Chart" to view the result',
            'tip.success': '✅ Chart rendered successfully',
            'genome.empty': 'No genome structure file imported yet',
            'genome.colChr': 'Chromosome ID column',
            'genome.colLen': 'Chromosome length column',
            'genome.colCen': 'Centromere position column (optional)',
            'density.empty': 'No gene density file imported yet',
            'density.colChr': 'Chromosome ID column',
            'density.colStart': 'Start column',
            'density.colEnd': 'End column',
            'density.colValue': 'Value column',
            'chrColor.mode': 'Coloring mode',
            'chrColor.modePalette': 'Assign by palette',
            'chrColor.modeUniform': 'Uniform color',
            'chrColor.palette': 'Categorical palette',
            'chrColor.uniform': 'Uniform color',
            'chrColor.empty': 'Import data to customize the color of each chromosome',
            'densityColor.mode': 'Palette mode',
            'densityColor.modePreset': 'Preset palette',
            'densityColor.mode2': 'Custom two-color',
            'densityColor.mode3': 'Custom three-color',
            'densityColor.reverse': 'Reverse palette direction',
            'densityColor.low': 'Low value color',
            'densityColor.mid': 'Mid value color',
            'densityColor.high': 'High value color',
            'layout.title': 'Layout',
            'layout.orient': 'Axis orientation',
            'layout.orientV': 'Vertical',
            'layout.orientH': 'Horizontal',
            'layout.perLineV': 'Chromosomes per row',
            'layout.perLineH': 'Chromosomes per column',
            'layout.maxLen': 'Max length (px)',
            'layout.chrWidth': 'Chromosome width',
            'layout.chrGap': 'Chromosome spacing',
            'layout.groupGap': 'Group spacing (between rows/columns)',
            'layout.curvature': 'End curvature',
            'layout.centromere': 'Show centromere',
            'layout.strokeColor': 'Stroke color',
            'layout.strokeWidth': 'Stroke width',
            'layout.opacity': 'Chromosome opacity',
            'layout.labelPos': 'Chromosome label position',
            'layout.labelPosNone': 'Hide',
            'layout.labelPosTop': 'Top',
            'layout.labelPosBottom': 'Bottom',
            'layout.labelSize': 'Label font size',
            'layout.bold': 'Bold',
            'layout.italic': 'Italic',
            'axis.title': 'Axis (chromosome length axis)',
            'axis.show': 'Show axis',
            'axis.groupAlign': 'Align ticks to longest chromosome in each group',
            'axis.unit': 'Unit',
            'axis.offset': 'Axis offset (px)',
            'axis.tickShow': 'Show tick labels',
            'axis.tickMode': 'Tick mode',
            'axis.tickAuto': 'Auto',
            'axis.tickRange': 'Range',
            'axis.tickCustom': 'Custom list',
            'axis.tickCount': 'Tick count',
            'axis.min': 'Min',
            'axis.max': 'Max',
            'axis.step': 'Step',
            'axis.customList': 'Custom tick values (comma separated, in the unit above)',
            'axis.customPlaceholder': 'e.g. 0,50,100,150',
            'axis.fontSize': 'Font size',
            'axis.tickBold': 'Bold tick labels',
            'axis.tickColor': 'Tick color',
            'axis.lineColor': 'Axis line color',
            'axis.titleShow': 'Show axis title',
            'axis.titleContent': 'Title text',
            'axis.titleFontSize': 'Title font size',
            'axis.info': 'Axis orientation is controlled by "Axis orientation" in the Layout panel; range, step and custom tick values are entered in the selected unit.',
            'colorbar.title': 'Color Bar Settings',
            'colorbar.show': 'Show color bar',
            'colorbar.orient': 'Orientation',
            'colorbar.orientV': 'Vertical',
            'colorbar.orientH': 'Horizontal',
            'colorbar.titleText': 'Title',
            'colorbar.thickness': 'Thickness (px)',
            'colorbar.length': 'Length (px, leave blank for auto)',
            'colorbar.tickSide': 'Tick side',
            'colorbar.tickSideLeft': 'Left / Top',
            'colorbar.tickSideRight': 'Right / Bottom',
            'colorbar.tickMode': 'Tick mode',
            'colorbar.tickAuto': 'Auto',
            'colorbar.tickCustom': 'Custom',
            'colorbar.tickCount': 'Tick count',
            'colorbar.customList': 'Custom tick values (comma separated)',
            'colorbar.customPlaceholder': 'e.g. 0,5,10',
            'colorbar.decimals': 'Decimal places',
            'colorbar.labelFontSize': 'Tick font size',
            'colorbar.titleFontSize': 'Title font size',
            'colorbar.tickColor': 'Tick color',
            'colorbar.min': 'Min value (blank = auto)',
            'colorbar.max': 'Max value (blank = auto)',
            'labels.title': 'Gene labels',
            'labels.show': 'Show gene labels',
            'labels.side': 'Label side',
            'labels.sideRight': 'Right / Bottom',
            'labels.sideLeft': 'Left / Top',
            'labels.fontSize': 'Font size',
            'labels.color': 'Text color',
            'labels.leadLen': 'Leader length',
            'labels.leadColor': 'Leader color',
            'labels.bold': 'Bold',
            'labels.italic': 'Italic',
            'labels.dataLabel': 'Label data (name · chromosome · position bp)',
            'labels.apply': 'Apply text',
            'labels.sample': 'Generate sample',
            'labels.import': 'Import file',
            'labels.hint': 'One entry per line; position uses the unified coordinate (e.g. gene midpoint / start / end).',
            'labels.errCols': 'Label data needs at least 3 columns: name, chromosome, position.',
            'labels.errNoData': 'Please import data first',
            'import.genomeTitle': 'Genome structure file (optional)',
            'import.genomeInfo': 'Header required; must contain <strong>chromosome ID</strong> and <strong>chromosome length</strong> columns; <strong>centromere position</strong> is optional.',
            'import.densityTitle': 'Gene density file (optional)',
            'import.densityInfo': 'Header required; must contain <strong>chromosome ID</strong>, <strong>start</strong>, <strong>end</strong> and <strong>value</strong> columns.',
            'err.d3': 'Failed to load d3. Please refresh the page and try again.',
            'err.png': 'PNG export failed. Please use SVG export instead.',
            'style.load': 'Load Style',
            'style.export': 'Export Style',
            'style.restored': '✅ Style restored',
            'style.exported': '✅ Style exported',
            'style.invalid': '❌ Invalid style file'
        }
    };

    function detectLang() {
        let lang = '';
        try {
            if (window.PlotI18n && typeof window.PlotI18n.getLang === 'function') {
                lang = window.PlotI18n.getLang() || '';
            }
        } catch (e) {}
        if (!lang) {
            try {
                const qs = new URLSearchParams(window.location.search);
                lang = qs.get('lang') || '';
            } catch (e) {}
        }
        if (!lang) {
            try {
                lang = localStorage.getItem('plot-lang') || localStorage.getItem('plotLang') || localStorage.getItem('lang') || '';
            } catch (e) {}
        }
        if (!lang) lang = document.documentElement.lang || 'zh';
        lang = String(lang).toLowerCase();
        return lang.indexOf('en') === 0 ? 'en' : 'zh';
    }

    let LANG = detectLang();

    function t(key, params) {
        const dict = I18N[LANG] || I18N.zh;
        let s = dict[key];
        if (s == null) s = I18N.zh[key];
        if (s == null) s = key;
        if (params) {
            s = String(s).replace(/\{(\w+)\}/g, function (m, k) {
                return Object.prototype.hasOwnProperty.call(params, k) ? params[k] : m;
            });
        }
        return s;
    }

    function debounce(fn, ms) {
        let t = null;
        return function () {
            const args = arguments, ctx = this;
            if (t) clearTimeout(t);
            t = setTimeout(function () { t = null; fn.apply(ctx, args); }, ms);
        };
    }
    function readFileAsText(file) {
        return new Promise(function (resolve, reject) {
            const r = new FileReader();
            r.onload = function (e) { resolve(e.target.result); };
            r.onerror = reject;
            r.readAsText(file);
        });
    }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function toNum(v) { const n = parseFloat(v); return isFinite(n) ? n : NaN; }
    function escapeXml(s) { return PC.escapeHtml(s); }
    function naturalCompare(a, b) {
        const re = /(\d+)|(\D+)/g;
        const ax = String(a).match(re) || [];
        const bx = String(b).match(re) || [];
        const len = Math.min(ax.length, bx.length);
        for (let i = 0; i < len; i++) {
            const an = parseFloat(ax[i]), bn = parseFloat(bx[i]);
            if (isFinite(an) && isFinite(bn)) {
                if (an !== bn) return an - bn;
            } else {
                const c = ax[i].localeCompare(bx[i]);
                if (c !== 0) return c;
            }
        }
        return ax.length - bx.length;
    }
    function fmtTick(v, unit) {
        if (!isFinite(v)) return '';
        if (unit === 'bp') return String(Math.round(v));
        if (unit === 'Kb') return (v / 1e3).toFixed(v % 1e3 === 0 ? 0 : 1);
        return (v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1);
    }
    function fmtNumShort(v) {
        const abs = Math.abs(v);
        if (abs >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
        if (abs >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
        if (abs >= 1) return v.toFixed(abs < 10 ? 1 : 0).replace(/\.0$/, '');
        return v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    }
    function unitMult(unit) {
        if (unit === 'Kb') return 1e3;
        if (unit === 'Mb') return 1e6;
        return 1;
    }

    function buildAxisTicks(cLength, A) {
        const mult = unitMult(A.unit);
        if (A.tickMode === 'custom') {
            const raw = String(A.tickCustom || '').trim();
            if (raw) {
                return raw.split(/[,，;\s]+/)
                    .map(function (s) { return parseFloat(s); })
                    .filter(function (v) { return isFinite(v); })
                    .map(function (v) { return v * mult; })
                    .filter(function (v) { return v >= 0 && v <= cLength; });
            }
        }
        if (A.tickMode === 'range' && isFinite(A.min) && isFinite(A.max) && A.step > 0) {
            const minBp = Math.max(0, A.min * mult);
            const maxBp = Math.min(cLength, A.max * mult);
            const stepBp = A.step * mult;
            const out = [];
            for (let v = minBp; v <= maxBp + stepBp * 0.001; v += stepBp) {
                out.push(v);
            }
            return out;
        }
        return d3.ticks(0, cLength, A.ticks).filter(function (t) { return t >= 0 && t <= cLength; });
    }

    function injectPageStyle() {
        if (document.getElementById('chr-page-style')) return;
        const s = document.createElement('style');
        s.id = 'chr-page-style';
        s.textContent = `
.chr-color-row { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
.chr-color-row input[type=color] { width: 36px; height: 24px; padding: 0; border: 1px solid #d0d8e3; border-radius: 4px; }
.chr-color-row .cc-name { flex: 1; font-size: 13px; color: #334155; }
.chr-color-row .cc-hex { font-size: 12px; color: #94a3b8; font-family: monospace; }
`;
        document.head.appendChild(s);
    }

    let CHR_PALETTES = null;
    let DENSITY_PALETTES = null;

    function initPalettes() {
        if (CHR_PALETTES) return;
        CHR_PALETTES = {
            tableau10: { name: 'Tableau 10', colors: d3.schemeTableau10 },
            category10: { name: 'Category 10', colors: d3.schemeCategory10 },
            set1: { name: 'Set 1', colors: d3.schemeSet1 },
            set2: { name: 'Set 2', colors: d3.schemeSet2 },
            set3: { name: 'Set 3', colors: d3.schemeSet3 },
            paired: { name: 'Paired', colors: d3.schemePaired },
            dark2: { name: 'Dark 2', colors: d3.schemeDark2 },
            accent: { name: 'Accent', colors: d3.schemeAccent }
        };
        DENSITY_PALETTES = {
            viridis: { name: 'Viridis', fn: d3.interpolateViridis },
            plasma: { name: 'Plasma', fn: d3.interpolatePlasma },
            inferno: { name: 'Inferno', fn: d3.interpolateInferno },
            magma: { name: 'Magma', fn: d3.interpolateMagma },
            cividis: { name: 'Cividis', fn: d3.interpolateCividis },
            turbo: { name: 'Turbo', fn: d3.interpolateTurbo },
            blues: { name: 'Blues', fn: d3.interpolateBlues },
            reds: { name: 'Reds', fn: d3.interpolateReds },
            greens: { name: 'Greens', fn: d3.interpolateGreens },
            purples: { name: 'Purples', fn: d3.interpolatePurples },
            oranges: { name: 'Oranges', fn: d3.interpolateOranges },
            rdylbu: { name: 'RdYlBu', fn: d3.interpolateRdYlBu },
            rdylgn: { name: 'RdYlGn', fn: d3.interpolateRdYlGn },
            spectral: { name: 'Spectral', fn: d3.interpolateSpectral },
            rainbow: { name: 'Rainbow', fn: d3.interpolateRainbow }
        };
    }

    function makeGenomeExample() {
        const rows = ['Chr\tLength\tCentromere'];
        const chrData = [
            ['chr1', 248956422, 123400000],
            ['chr2', 242193529, 93900000],
            ['chr3', 198295559, 90900000],
            ['chr4', 190214555, 50000000],
            ['chr5', 181538259, 48800000],
            ['chr6', 170805979, 59800000]
        ];
        chrData.forEach(function (c) {
            rows.push(c[0] + '\t' + c[1] + '\t' + c[2]);
        });
        return rows.join('\n');
    }

    function makeDensityExample() {
        const rows = ['Chr\tStart\tEnd\tValue'];
        const chrData = [
            ['chr1', 248956422],
            ['chr2', 242193529],
            ['chr3', 198295559],
            ['chr4', 190214555],
            ['chr5', 181538259],
            ['chr6', 170805979]
        ];
        const bins = 40;
        chrData.forEach(function (c, ci) {
            const len = c[1];
            const binSize = Math.floor(len / bins);
            for (let i = 0; i < bins; i++) {
                const start = i * binSize;
                const end = Math.min((i + 1) * binSize, len);
                const v = (Math.sin(i * 0.4 + ci * 1.7) + 1) * 8 + Math.cos(i * 1.3) * 3 + 5;
                rows.push(c[0] + '\t' + start + '\t' + end + '\t' + v.toFixed(2));
            }
        });
        return rows.join('\n');
    }

    const state = {
        genome: { headers: [], data: [], cols: { chr: '', len: '', cen: '' }, fileName: '' },
        density: { headers: [], data: [], cols: { chr: '', start: '', end: '', value: '' }, fileName: '' },

        colors: {
            chrMode: 'palette',
            chrPalette: 'tableau10',
            chrUniform: '#5b8ff9',
            chrCustom: {},
            densityPaletteMode: 'preset',
            densityPalette: 'viridis',
            densityReverse: false,
            densityCustom2Low: '#2166ac',
            densityCustom2High: '#b2182b',
            densityCustom3Low: '#2166ac',
            densityCustom3Mid: '#f7f7f7',
            densityCustom3High: '#b2182b',
            densityMin: null,
            densityMax: null
        },
        layout: {
            orientation: 'vertical',
            perLine: 8,
            maxLenPx: 320,
            chrWidth: 22,
            chrGap: 50,
            groupGap: 64,
            curvature: 0.7,
            showCentromere: true
        },
        style: {
            chrLabelPos: 'top',
            chrLabelSize: 12,
            chrLabelBold: true,
            chrLabelItalic: false,
            chrStroke: '#334155',
            chrStrokeWidth: 1,
            chrOpacity: 1
        },
        axis: {
            show: true,
            unit: 'Mb',
            fontSize: 10,
            ticks: 5,
            offset: 36,
            tickValueShow: true,
            groupAlign: false,
            tickColor: '#333333',
            tickBold: false,
            lineColor: '#333333',
            tickMode: 'auto',
            tickCustom: '',
            min: null,
            max: null,
            step: null,
            titleShow: true,
            title: 'Sequence position (Mb)',
            titleAuto: true,
            titleFontSize: 12,
            titleBold: true,
            titleItalic: false
        },
        colorbar: {
            show: true,
            title: 'Density',
            height: 180,
            orientation: 'vertical',
            thickness: 15,
            length: null,
            tickSide: 'right',
            tickCount: 5,
            tickMode: 'auto',
            tickCustom: '',
            decimals: 1,
            labelFontSize: 10,
            titleFontSize: 12,
            tickColor: '#333333',
            offset: { dx: 0, dy: 0 }
        },
        labels: {
            show: true,
            data: [],
            side: 'right',
            size: 10,
            bold: false,
            italic: false,
            color: '#334155',
            leadLen: 24,
            leadColor: '#94a3b8',
        },
        currentSvg: null,
        canvasView: null
    };

    const scheduleDraw = debounce(drawChart, 80);

    function buildModel() {
        const g = state.genome, d = state.density;
        const genomeReady = g.data.length > 0 && g.cols.chr && g.cols.len;
        const densityReady = d.data.length > 0 && d.cols.chr && d.cols.start && d.cols.end && d.cols.value;

        const map = new Map();
        function ensure(name) {
            if (!map.has(name)) map.set(name, { name: name, length: 0, centromere: null, bins: [] });
            return map.get(name);
        }

        const genomeSet = new Set();
        if (genomeReady) {
            for (const row of g.data) {
                const name = String(row[g.cols.chr] ?? '').trim();
                if (!name) continue;
                const len = toNum(row[g.cols.len]);
                const cen = g.cols.cen ? toNum(row[g.cols.cen]) : NaN;
                if (isFinite(len) && len > 0) genomeSet.add(name);
                const c = ensure(name);
                if (isFinite(len) && len > 0) c.length = Math.max(c.length, len);
                if (isFinite(cen) && cen > 0) c.centromere = cen;
            }
        }

        if (densityReady) {
            for (const row of d.data) {
                const name = String(row[d.cols.chr] ?? '').trim();
                if (!name) continue;
                if (genomeSet.size > 0 && !genomeSet.has(name)) continue;
                const s = toNum(row[d.cols.start]);
                const e = toNum(row[d.cols.end]);
                const v = toNum(row[d.cols.value]);
                if (!isFinite(s) || !isFinite(e)) continue;
                const c = ensure(name);
                const lo = Math.min(s, e), hi = Math.max(s, e);
                c.bins.push({ start: lo, end: hi, value: isFinite(v) ? v : 0 });
                c.length = Math.max(c.length, hi);
            }
        }

        const chromosomes = Array.from(map.values())
            .filter(function (c) {
                if (genomeSet.size > 0) return genomeSet.has(c.name) && c.length > 0;
                return c.length > 0;
            })
            .sort(function (a, b) { return naturalCompare(a.name, b.name); });
        const vals = [];
        for (const c of chromosomes)
            for (const b of c.bins) if (isFinite(b.value)) vals.push(b.value);

        let domain = [0, 1];
        if (vals.length) {
            const hi = Math.max.apply(null, vals);
            domain = [0, hi > 0 ? hi : 1];
        }

        return { chromosomes: chromosomes, hasDensity: vals.length > 0, domain: domain };
    }

    function chrColor(name, index) {
        if (state.colors.chrCustom[name]) return state.colors.chrCustom[name];
        if (state.colors.chrMode === 'uniform') return state.colors.chrUniform;
        const colors = PC.getCategoricalScheme(state.colors.chrPalette);
        if (!colors || !colors.length) return '#cccccc';
        return colors[index % colors.length];
    }

    function roundedRectPath(x, y, w, h, r) {
        r = clamp(r, 0, Math.min(w, h) / 2);
        if (r <= 0.01) return 'M ' + x + ' ' + y + ' H ' + (x + w) + ' V ' + (y + h) + ' H ' + x + ' Z';
        return [
            'M ' + (x + r) + ' ' + y,
            'H ' + (x + w - r),
            'A ' + r + ' ' + r + ' 0 0 1 ' + (x + w) + ' ' + (y + r),
            'V ' + (y + h - r),
            'A ' + r + ' ' + r + ' 0 0 1 ' + (x + w - r) + ' ' + (y + h),
            'H ' + (x + r),
            'A ' + r + ' ' + r + ' 0 0 1 ' + x + ' ' + (y + h - r),
            'V ' + (y + r),
            'A ' + r + ' ' + r + ' 0 0 1 ' + (x + r) + ' ' + y,
            'Z'
        ].join(' ');
    }

    function chromosomeLocalPath(thickness, length, radius, cenFrac) {
        const w = thickness, h = length;
        const r = clamp(radius, 0, w / 2);

        if (cenFrac == null || !isFinite(cenFrac) || cenFrac <= 0.02 || cenFrac >= 0.98)
            return roundedRectPath(0, 0, w, h, r);

        const cy = h * cenFrac;
        const neckW = Math.max(w * 0.26, 2.5);
        const neckH = Math.max(w * 1.35, 12);

        const safeTop = Math.max(2, cy - neckH - 2);
        const safeBot = Math.max(2, h - cy - neckH - 2);
        const rEff = Math.min(r, safeTop, safeBot);

        const lx = (w - neckW) / 2;
        const rx = lx + neckW;
        const p = [];

        p.push('M ' + rEff + ' 0');
        p.push('L ' + (w - rEff) + ' 0');
        if (rEff > 0.5) p.push('A ' + rEff + ' ' + rEff + ' 0 0 1 ' + w + ' ' + rEff);

        p.push('L ' + w + ' ' + (cy - neckH));
        p.push('C ' + w + ' ' + (cy - neckH * 0.22) + ' ' + rx + ' ' + (cy - neckH * 0.36) + ' ' + rx + ' ' + cy);
        p.push('C ' + rx + ' ' + (cy + neckH * 0.36) + ' ' + w + ' ' + (cy + neckH * 0.22) + ' ' + w + ' ' + (cy + neckH));

        p.push('L ' + w + ' ' + (h - rEff));
        if (rEff > 0.5) p.push('A ' + rEff + ' ' + rEff + ' 0 0 1 ' + (w - rEff) + ' ' + h);
        p.push('L ' + rEff + ' ' + h);
        if (rEff > 0.5) p.push('A ' + rEff + ' ' + rEff + ' 0 0 1 0 ' + (h - rEff));

        p.push('L 0 ' + (cy + neckH));
        p.push('C 0 ' + (cy + neckH * 0.22) + ' ' + lx + ' ' + (cy + neckH * 0.36) + ' ' + lx + ' ' + cy);
        p.push('C ' + lx + ' ' + (cy - neckH * 0.36) + ' 0 ' + (cy - neckH * 0.22) + ' 0 ' + (cy - neckH));

        p.push('L 0 ' + rEff);
        if (rEff > 0.5) p.push('A ' + rEff + ' ' + rEff + ' 0 0 1 ' + rEff + ' 0');

        p.push('Z');
        return p.join(' ');
    }

    function buildSvgContent(model) {
        const L = state.layout, S = state.style, A = state.axis, CB = state.colorbar, LB = state.labels;
        const chromosomes = model.chromosomes;
        const hasDensity = model.hasDensity;
        const domain = model.domain;

        const isV = L.orientation === 'vertical';
        const n = chromosomes.length;
        const perLine = Math.max(1, Math.floor(L.perLine));
        const maxLen = Math.max.apply(null, chromosomes.map(function (c) { return c.length; })) || 1;
        const scale = L.maxLenPx / maxLen;
        const T = L.chrWidth;

        const hasLabels = LB.show && LB.data.length > 0;
        const maxLabelW = hasLabels
            ? Math.max.apply(null, LB.data.map(function (l) { return PC.estTextWidth(l.name, LB.size); }).concat([LB.size * 3]))
            : 0;
        const leadSpan = LB.leadLen;

        const cols = isV ? Math.min(perLine, n) : Math.ceil(n / perLine);
        const rows = isV ? Math.ceil(n / perLine) : Math.min(perLine, n);

        const groupGap = (L.groupGap != null) ? L.groupGap : 64;

        const cellW = isV ? T + L.chrGap : L.maxLenPx + groupGap;
        const cellH = isV ? L.maxLenPx + groupGap : T + L.chrGap;

        let padL = isV ? 72 : 84;
        let padT = 44;
        let padR = (hasDensity && CB.show) ? 104 : 34;
        let padB = 46;

        if (A.show) {
            const extra = A.offset + 20 + ((A.titleShow && A.title) ? A.titleFontSize + 16 : 0);
            if (isV) padL += extra;
            else padT += extra;
        }

        if (hasLabels) {
            const axisOff = (A.show && LB.side === 'left') ? A.offset : 0;
            const labelSpace = leadSpan + maxLabelW + 16 + axisOff;
            if (isV && LB.side !== 'left') padR += labelSpace;
            if (isV && LB.side === 'left') padL += labelSpace;
            if (!isV && LB.side === 'left') padT += labelSpace;
            if (!isV && LB.side !== 'left') padB += labelSpace;
        }

        const contentW = cols * cellW;
        const contentH = rows * cellH;
        const svgW = Math.ceil(padL + contentW + padR);
        const svgH = Math.ceil(padT + contentH + padB);

        let domLo = (state.colors.densityMin != null && isFinite(state.colors.densityMin))
            ? state.colors.densityMin : domain[0];
        let domHi = (state.colors.densityMax != null && isFinite(state.colors.densityMax))
            ? state.colors.densityMax : domain[1];
        if (domLo === domHi) { domLo -= 1; domHi += 1; }
        if (domLo > domHi) { const t = domLo; domLo = domHi; domHi = t; }

        let colorScale;
        const C = state.colors;
        if (C.densityPaletteMode === 'custom2') {
            const lo = C.densityCustom2Low;
            const hi = C.densityCustom2High;
            colorScale = d3.scaleLinear()
                .domain([domLo, domHi])
                .range(C.densityReverse ? [hi, lo] : [lo, hi])
                .clamp(true);
        } else if (C.densityPaletteMode === 'custom3') {
            const lo = C.densityCustom3Low;
            const mid = C.densityCustom3Mid;
            const hi = C.densityCustom3High;
            const midV = (domLo + domHi) / 2;
            colorScale = d3.scaleLinear()
                .domain([domLo, midV, domHi])
                .range(C.densityReverse ? [hi, mid, lo] : [lo, mid, hi])
                .clamp(true);
        } else {
            const palEntry = DENSITY_PALETTES[C.densityPalette] || DENSITY_PALETTES.viridis;
            colorScale = d3.scaleSequential(palEntry.fn)
                .domain(C.densityReverse ? [domHi, domLo] : [domLo, domHi]);
        }

        const items = chromosomes.map(function (c, i) {
            const col = isV ? (i % perLine) : Math.floor(i / perLine);
            const row = isV ? Math.floor(i / perLine) : (i % perLine);
            return {
                c: c, i: i, col: col, row: row,
                x: padL + col * cellW,
                y: padT + row * cellH,
                lenPx: c.length * scale
            };
        });

        const defs = [];
        const body = [];
        items.forEach(function (it) {
            if (isV) {
                it.showAxis = (it.col === 0);
            } else {
                it.showAxis = (it.row === 0);
            }
        });

        items.forEach(function (it) {
            if (!it.showAxis) return;
            let gm = 0;
            items.forEach(function (o) {
                if (isV) {
                    if (o.row === it.row) gm = Math.max(gm, o.c.length);
                } else {
                    if (o.col === it.col) gm = Math.max(gm, o.c.length);
                }
            });
            it.axisMaxLen = gm > 0 ? gm : maxLen;
        });

        for (const it of items) {
            const c = it.c, x = it.x, y = it.y, lenPx = it.lenPx;
            const radius = (T / 2) * L.curvature;
            const cenFrac = (L.showCentromere && c.centromere != null && c.length > 0)
                ? clamp(c.centromere / c.length, 0, 1) : null;

            const d = chromosomeLocalPath(T, lenPx, radius, cenFrac);
            const transform = isV
                ? 'translate(' + x + ',' + y + ')'
                : 'translate(' + x + ',' + (y + T) + ') rotate(-90)';

            const fill = chrColor(c.name, it.i);
            const clipId = 'chrc-' + it.i;
            defs.push('<clipPath id="' + clipId + '"><path d="' + d + '"/></clipPath>');

            body.push('<path d="' + d + '" transform="' + transform + '" fill="' + fill + '" fill-opacity="' + S.chrOpacity + '"/>');

            if (hasDensity) {
                const tiles = [];

                tiles.push('<rect x="-1" y="0" width="' + (T + 2) + '" height="' + lenPx.toFixed(2) +
                           '" fill="' + colorScale(domLo) + '"/>');

                const sortedBins = c.bins.slice().sort(function (a, b) { return a.start - b.start; });
                for (const b of sortedBins) {
                    const y1 = (b.start / c.length) * lenPx;
                    const y2 = (b.end / c.length) * lenPx;
                    const hgt = Math.max(y2 - y1, 0.6);
                    tiles.push('<rect x="-1" y="' + y1.toFixed(2) + '" width="' + (T + 2) +
                               '" height="' + hgt.toFixed(2) + '" fill="' + colorScale(b.value) + '"/>');
                }

                body.push('<g transform="' + transform + '" clip-path="url(#chrc-' + it.i + ')">' + tiles.join('') + '</g>');
            }

            if (S.chrStrokeWidth > 0) {
                body.push('<path d="' + d + '" transform="' + transform + '" fill="none" stroke="' + S.chrStroke + '" stroke-width="' + S.chrStrokeWidth + '" stroke-linejoin="round"/>');
            }

            if (A.show && it.showAxis) {
                const axisMax = (A.groupAlign && it.axisMaxLen) ? it.axisMaxLen : maxLen;
                const axisLenPx = (A.groupAlign && it.axisMaxLen)
                    ? (it.axisMaxLen * scale)
                    : L.maxLenPx;
                const ticks = buildAxisTicks(axisMax, A);
                const tickClr = A.tickColor || '#7b8aa3';
                const tickWeight = A.tickBold ? '700' : '400';
                const axisClr = A.lineColor || '#94a3b8';

                if (isV) {
                    const axisX = x - A.offset;
                    body.push('<line x1="' + axisX + '" y1="' + y + '" x2="' + axisX + '" y2="' + (y + axisLenPx) + '" stroke="' + axisClr + '" stroke-width="1"/>');
                    for (const t of ticks) {
                        const py = y + (t / axisMax) * axisLenPx;
                        body.push('<line x1="' + (axisX - 4) + '" y1="' + py + '" x2="' + axisX + '" y2="' + py + '" stroke="' + axisClr + '" stroke-width="1"/>');
                        if (A.tickValueShow !== false) {
                            body.push('<text x="' + (axisX - 7) + '" y="' + py + '" text-anchor="end" dominant-baseline="middle" font-size="' + A.fontSize + '" font-weight="' + tickWeight + '" fill="' + tickClr + '" font-family="inherit">' + fmtTick(t, A.unit) + '</text>');
                        }
                    }
                    if (A.titleShow && A.title) {
                        const ttx = axisX - A.fontSize - 26;
                        const tcy = y + axisLenPx / 2;
                        body.push('<text transform="translate(' + ttx + ',' + tcy + ') rotate(-90)" text-anchor="middle" dominant-baseline="middle" font-size="' + A.titleFontSize + '" fill="#334155" font-weight="' + (A.titleBold ? '700' : '400') + '" font-style="' + (A.titleItalic ? 'italic' : 'normal') + '" font-family="inherit">' + escapeXml(A.title) + '</text>');
                    }
                } else {
                    const ay = y - A.offset;
                    body.push('<line x1="' + x + '" y1="' + ay + '" x2="' + (x + axisLenPx) + '" y2="' + ay + '" stroke="' + axisClr + '" stroke-width="1"/>');
                    for (const t of ticks) {
                        const px = x + (t / axisMax) * axisLenPx;
                        body.push('<line x1="' + px + '" y1="' + (ay - 4) + '" x2="' + px + '" y2="' + ay + '" stroke="' + axisClr + '" stroke-width="1"/>');
                        if (A.tickValueShow !== false) {
                            body.push('<text x="' + px + '" y="' + (ay - 7) + '" text-anchor="middle" dominant-baseline="auto" font-size="' + A.fontSize + '" font-weight="' + tickWeight + '" fill="' + tickClr + '" font-family="inherit">' + fmtTick(t, A.unit) + '</text>');
                        }
                    }
                    if (A.titleShow && A.title) {
                        const tty = ay - A.fontSize - 10;
                        body.push('<text x="' + (x + axisLenPx / 2) + '" y="' + tty + '" text-anchor="middle" dominant-baseline="auto" font-size="' + A.titleFontSize + '" fill="#334155" font-weight="' + (A.titleBold ? '700' : '400') + '" font-style="' + (A.titleItalic ? 'italic' : 'normal') + '" font-family="inherit">' + escapeXml(A.title) + '</text>');
                    }
                }
            }
            if (S.chrLabelPos !== 'none') {
                const weight = S.chrLabelBold ? '700' : '400';
                const style = S.chrLabelItalic ? 'italic' : 'normal';
                const fs = S.chrLabelSize;

                if (isV) {
                    const labelY = S.chrLabelPos === 'top' ? (y - 9) : (y + L.maxLenPx + 20);
                    body.push('<text x="' + (x + T / 2) + '" y="' + labelY + '" text-anchor="middle" font-size="' + fs + '" font-weight="' + weight + '" font-style="' + style + '" fill="#334155" font-family="inherit">' + escapeXml(c.name) + '</text>');
                } else {
                    const labelX = S.chrLabelPos === 'top' ? (x - 9) : (x + L.maxLenPx + 12);
                    const anchor = S.chrLabelPos === 'top' ? 'end' : 'start';
                    body.push('<text x="' + labelX + '" y="' + (y + T / 2) + '" text-anchor="' + anchor + '" dominant-baseline="middle" font-size="' + fs + '" font-weight="' + weight + '" font-style="' + style + '" fill="#334155" font-family="inherit">' + escapeXml(c.name) + '</text>');
                }
            }
        }

        if (hasLabels) body.push(renderLabels(items, isV, T));

        if (hasDensity && CB.show) {
            body.push(renderColorbar(padL, contentW, padT, contentH, colorScale, domLo, domHi));
        }

        const html = '<defs>' + defs.join('') + '</defs>'
            + body.join('');

        return { html: html, width: svgW, height: svgH };
    }

    function renderLabels(items, isV, T) {
        const LB = state.labels;
        const out = [];

        const weight = LB.bold ? '700' : '400';
        const style = LB.italic ? 'italic' : 'normal';
        const fs = LB.size;
        const lineH = fs * 1.35;

        const byChr = new Map();
        for (const lb of LB.data) {
            const key = String(lb.chr ?? '').trim();
            if (!byChr.has(key)) byChr.set(key, []);
            byChr.get(key).push(lb);
        }

        function assignTargets(anchors, minGap) {
            const n = anchors.length;
            if (!n) return [];
            const targets = anchors.slice();
            for (let i = 1; i < n; i++) {
                if (targets[i] - targets[i - 1] < minGap) {
                    targets[i] = targets[i - 1] + minGap;
                }
            }
            for (let i = n - 2; i >= 0; i--) {
                if (targets[i + 1] - targets[i] < minGap) {
                    targets[i] = targets[i + 1] - minGap;
                }
            }
            return targets;
        }

        for (const it of items) {
            const list = byChr.get(it.c.name);
            if (!list || !list.length) continue;

            const sorted = list
                .map(function (l) { return Object.assign({}, l, { _pos: clamp(Number(l.pos) || 0, 0, it.c.length) }); })
                .sort(function (a, b) { return a._pos - b._pos; });

            const n = sorted.length;

            if (isV) {
                const onRight = LB.side !== 'left';
                const axisOff = (state.axis.show ? state.axis.offset : 0);
                const startX = onRight ? it.x + T : it.x;
                const tx = onRight
                    ? it.x + T + LB.leadLen
                    : it.x - axisOff - LB.leadLen;
                const anchor = onRight ? 'start' : 'end';
                const textX = tx + (onRight ? 2 : -2);

                const anchors = sorted.map(function (l) {
                    return it.y + (l._pos / it.c.length) * it.lenPx;
                });
                const targets = assignTargets(anchors, lineH);

                for (let i = 0; i < n; i++) {
                    const lb = sorted[i];
                    const ay = anchors[i];
                    const ty = targets[i];
                    out.push('<line x1="' + startX + '" y1="' + ay + '" x2="' + tx + '" y2="' + ty + '" stroke="' + LB.leadColor + '" stroke-width="0.9" stroke-linecap="round"/>');
                    out.push('<text x="' + textX + '" y="' + ty + '" text-anchor="' + anchor + '" dominant-baseline="middle" font-size="' + fs + '" font-weight="' + weight + '" font-style="' + style + '" fill="' + LB.color + '" font-family="inherit">' + escapeXml(lb.name) + '</text>');
                }
            } else {
                const onTop = LB.side === 'left';
                const axisOff = (state.axis.show ? state.axis.offset : 0);
                const startY = onTop ? it.y : it.y + T;
                const ty = onTop
                    ? it.y - axisOff - LB.leadLen
                    : it.y + T + LB.leadLen;
                const anchor = onTop ? 'start' : 'end';

                const anchorsX = sorted.map(function (l) {
                    return it.x + (l._pos / it.c.length) * it.lenPx;
                });
                const targetsX = assignTargets(anchorsX, lineH);

                for (let i = 0; i < n; i++) {
                    const lb = sorted[i];
                    const ax = anchorsX[i];
                    const tx = targetsX[i];
                    out.push('<line x1="' + ax + '" y1="' + startY + '" x2="' + tx + '" y2="' + ty + '" stroke="' + LB.leadColor + '" stroke-width="0.9" stroke-linecap="round"/>');
                    out.push('<text transform="translate(' + tx + ',' + ty + ') rotate(-90)" text-anchor="' + anchor + '" dominant-baseline="middle" font-size="' + fs + '" font-weight="' + weight + '" font-style="' + style + '" fill="' + LB.color + '" font-family="inherit">' + escapeXml(lb.name) + '</text>');
                }
            }
        }

        return out.join('');
    }

    function resolveColorbarTicks(CB, domLo, domHi) {
        if (CB.tickMode === 'custom') {
            const raw = String(CB.tickCustom || '').trim();
            if (raw) {
                return raw.split(/[,，;\s]+/)
                    .map(function (s) { return parseFloat(s); })
                    .filter(function (v) { return isFinite(v); });
            }
        }
        const count = Math.max(2, Math.min(20, Math.round(CB.tickCount || 5)));
        const out = [];
        for (let i = 0; i < count; i++) {
            out.push(domLo + (domHi - domLo) * i / (count - 1));
        }
        return out;
    }

    function renderColorbar(padL, contentW, padT, contentH, colorScale, domLo, domHi) {
        const CB = state.colorbar;
        if (!CB.offset) CB.offset = { dx: 0, dy: 0 };

        const isH = CB.orientation === 'horizontal';
        const thickness = CB.thickness || 15;
        const autoLen = isH
            ? Math.min(320, svgW * 0.45)
            : Math.min(CB.height || 180, Math.max(120, contentH * 0.7));
        const length = CB.length != null ? CB.length : autoLen;
        const barW = isH ? length : thickness;
        const barH = isH ? thickness : length;

        const baseX = isH
            ? (padL + 20)
            : (padL + contentW + 30);
        const baseY = isH
            ? (padT + contentH + 30)
            : (padT + 12);

        const stops = [];
        const STEPS = 30;
        for (let i = 0; i <= STEPS; i++) {
            const t = i / STEPS;
            const v = domLo + (domHi - domLo) * t;
            stops.push('<stop offset="' + (t * 100).toFixed(2) + '%" stop-color="' + colorScale(v) + '"/>');
        }

        const gradId = 'cv-density-grad';
        const parts = [];

        const gradAttrs = isH
            ? 'x1="0%" y1="50%" x2="100%" y2="50%"'
            : 'x1="50%" y1="100%" x2="50%" y2="0%"';

        parts.push('<defs><linearGradient id="' + gradId + '" ' + gradAttrs + '>' + stops.join('') + '</linearGradient></defs>');

        const inner = [];
        inner.push('<rect x="0" y="0" width="' + barW + '" height="' + barH + '" fill="url(#' + gradId + ')" rx="2"/>');
        inner.push('<rect x="0" y="0" width="' + barW + '" height="' + barH + '" fill="none" stroke="#d7dfeb" stroke-width="1" rx="2"/>');

        const ticks = resolveColorbarTicks(CB, domLo, domHi);
        const tickSide = CB.tickSide || 'right';
        const decimals = CB.decimals != null ? CB.decimals : 1;
        const labelFS = CB.labelFontSize || 10;
        const tickLen = 4;
        const tickColor = CB.tickColor || '#333';

        for (const t of ticks) {
            const p = (t - domLo) / (domHi - domLo);
            if (isH) {
                const px = p * barW;
                const isTop = tickSide === 'left';
                const y1 = isTop ? -tickLen : barH;
                const y2 = isTop ? 0 : barH + tickLen;
                const textY = isTop ? -tickLen - 3 : barH + tickLen + 3;
                const baseline = isTop ? 'auto' : 'hanging';
                inner.push('<line x1="' + px + '" y1="' + y1 + '" x2="' + px + '" y2="' + y2 + '" stroke="' + tickColor + '" stroke-width="1"/>');
                inner.push('<text x="' + px + '" y="' + textY + '" text-anchor="middle" dominant-baseline="' + baseline + '" font-size="' + labelFS + '" fill="' + tickColor + '" font-family="inherit">' + Number(t).toFixed(decimals) + '</text>');
            } else {
                const py = barH - p * barH;
                const isLeft = tickSide === 'left';
                const x1 = isLeft ? -tickLen : barW;
                const x2 = isLeft ? 0 : barW + tickLen;
                const textX = isLeft ? -tickLen - 2 : barW + tickLen + 2;
                const anchor = isLeft ? 'end' : 'start';
                inner.push('<line x1="' + x1 + '" y1="' + py + '" x2="' + x2 + '" y2="' + py + '" stroke="' + tickColor + '" stroke-width="1"/>');
                inner.push('<text x="' + textX + '" y="' + py + '" text-anchor="' + anchor + '" dominant-baseline="middle" font-size="' + labelFS + '" fill="' + tickColor + '" font-family="inherit">' + Number(t).toFixed(decimals) + '</text>');
            }
        }

        if (CB.title) {
            const titleFS = CB.titleFontSize || 12;
            if (isH) {
                const titleY = (tickSide === 'left') ? (barH + tickLen + 18) : (-tickLen - 14);
                inner.push('<text x="' + (barW / 2) + '" y="' + titleY + '" text-anchor="middle" dominant-baseline="middle" font-size="' + titleFS + '" font-weight="600" fill="#333" font-family="inherit">' + escapeXml(CB.title) + '</text>');
            } else {
                inner.push('<text x="' + (-tickLen - 2) + '" y="-8" text-anchor="start" font-size="' + titleFS + '" font-weight="600" fill="#333" font-family="inherit">' + escapeXml(CB.title) + '</text>');
            }
        }

        inner.push('<rect x="-60" y="-30" width="' + (barW + 120) + '" height="' + (barH + 70) + '" fill="transparent" style="cursor:move;pointer-events:all;"/>');

        parts.push('<g id="cv-colorbar" data-base-x="' + baseX + '" data-base-y="' + baseY + '" transform="translate(' + (baseX + CB.offset.dx) + ',' + (baseY + CB.offset.dy) + ')">' + inner.join('') + '</g>');

        return parts.join('');
    }

    function setExportEnabled(v) {
        const svgBtn = document.getElementById('exportSvgBtn');
        const pngBtn = document.getElementById('exportPngBtn');
        if (svgBtn) svgBtn.disabled = !v;
        if (pngBtn) pngBtn.disabled = !v;
    }

    function drawChart() {
        const container = document.getElementById('chartPreview');
        if (!container) return;

        if (!CHR_PALETTES) initPalettes();

        const model = buildModel();
        if (!model.chromosomes.length) {
            container.innerHTML = '<div class="placeholder">' + escapeXml(t('tip.placeholder')) + '</div>';
            state.currentSvg = null;
            setExportEnabled(false);
            return;
        }

        const content = buildSvgContent(model);

        const userW = PC.numById('chartWidth', 0);
        const userH = PC.numById('chartHeight', 0);
        const canvasW = userW > 0 ? userW : content.width;
        const canvasH = userH > 0 ? userH : content.height;

        const fontFamily = (document.getElementById('fontFamily') || {}).value || 'Times New Roman';
        const showBorderEl = document.getElementById('showCanvasBorder');
        const showBorder = showBorderEl ? showBorderEl.checked : true;

        const canvas = PlotCanvas.create(container, {
            width: canvasW,
            height: canvasH,
            fontFamily: fontFamily,
            border: showBorder
        });

        const scale = Math.min(canvasW / content.width, canvasH / content.height) || 1;
        const offsetX = (canvasW - content.width * scale) / 2;
        const offsetY = (canvasH - content.height * scale) / 2;
        canvas.root.html(
            '<g transform="translate(' + offsetX.toFixed(2) + ',' + offsetY.toFixed(2) +
            ') scale(' + scale.toFixed(4) + ')">' + content.html + '</g>'
        );
        (function () {
            const cbNode = canvas.node.querySelector('#cv-colorbar');
            if (!cbNode) return;
            const d3g = d3.select(cbNode);
            let sx = 0, sy = 0;
            d3g.call(d3.drag()
                .on('start', function (ev) {
                    sx = ev.x; sy = ev.y;
                    d3g.raise();
                    d3g.style('cursor', 'grabbing');
                    if (ev.sourceEvent) ev.sourceEvent.stopPropagation();
                })
                .on('drag', function (ev) {
                    state.colorbar.offset.dx += ev.x - sx;
                    state.colorbar.offset.dy += ev.y - sy;
                    sx = ev.x; sy = ev.y;
                    const baseX = parseFloat(cbNode.getAttribute('data-base-x'));
                    const baseY = parseFloat(cbNode.getAttribute('data-base-y'));
                    cbNode.setAttribute('transform',
                        'translate(' + (baseX + state.colorbar.offset.dx) + ',' + (baseY + state.colorbar.offset.dy) + ')');
                })
                .on('end', function () {
                    d3g.style('cursor', 'move');
                })
            );
        })();
        state.currentSvg = canvas.node;
        setExportEnabled(true);

        const tip = document.getElementById('msgTip3');
        if (tip) {
            const msg = t('tip.success');
            tip.className = 'tip-text success';
            tip.textContent = msg;
            setTimeout(function () {
                if (tip.textContent === msg) {
                    tip.textContent = '';
                    tip.className = 'tip-text';
                }
            }, 3500);
        }
    }

    function autoDetectGenomeCols() {
        const h = state.genome.headers;
        if (!h.length) return;
        const lower = h.map(function (x) { return x.toLowerCase(); });
        const pick = function (patterns) {
            for (const p of patterns) {
                const idx = lower.findIndex(function (x) { return x.indexOf(p) >= 0; });
                if (idx >= 0) return h[idx];
            }
            return '';
        };
        state.genome.cols.chr = pick(['chr', 'chrom', 'seqid', '染色体', 'id']) || h[0];
        state.genome.cols.len = pick(['length', 'len', 'size', '长度']) || h[1] || h[0];
        state.genome.cols.cen = pick(['centromere', 'centro', 'cen', '着丝粒']) || '';
    }

    function autoDetectDensityCols() {
        const h = state.density.headers;
        if (!h.length) return;
        const lower = h.map(function (x) { return x.toLowerCase(); });
        const pick = function (patterns) {
            for (const p of patterns) {
                const idx = lower.findIndex(function (x) { return x.indexOf(p) >= 0; });
                if (idx >= 0) return h[idx];
            }
            return '';
        };
        state.density.cols.chr = pick(['chr', 'chrom', 'seqid', '染色体']) || h[0];
        state.density.cols.start = pick(['start', 'begin', 'from', '起始', 'pos']) || h[1] || h[0];
        state.density.cols.end = pick(['end', 'stop', 'to', '终止', '结束']) || h[2] || h[0];
        state.density.cols.value = pick(['value', 'val', 'density', 'count', 'score', '值', '密度']) || h[3] || h[0];
    }

    function renderColMapPanel() {
        renderGenomeColPanel();
        renderDensityColPanel();
    }

    function renderGenomeColPanel() {
        const box = document.getElementById('cols-genome');
        if (!box) return;
        if (!state.genome.data.length) {
            box.innerHTML = '<p class="empty-tip">' + escapeXml(t('genome.empty')) + '</p>';
            return;
        }
        const h = state.genome.headers;
        function opt(sel, nullable) {
            const blank = nullable ? '<option value="">' + escapeXml(t('common.none')) + '</option>' : '';
            return blank + h.map(function (x) {
                return '<option value="' + escapeXml(x) + '"' + (x === sel ? ' selected' : '') + '>' + escapeXml(x) + '</option>';
            }).join('');
        }
        box.innerHTML =
            '<div class="param-grid cols-4">' +
            '  <div class="param-item"><label>' + escapeXml(t('genome.colChr')) + ' <span style="color:#d9534f;">*</span></label>' +
            '    <select id="g-col-chr">' + opt(state.genome.cols.chr, false) + '</select></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('genome.colLen')) + ' <span style="color:#d9534f;">*</span></label>' +
            '    <select id="g-col-len">' + opt(state.genome.cols.len, false) + '</select></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('genome.colCen')) + '</label>' +
            '    <select id="g-col-cen">' + opt(state.genome.cols.cen, true) + '</select></div>' +
            '</div>';

        document.getElementById('g-col-chr').addEventListener('change', function (e) {
            state.genome.cols.chr = e.target.value; renderChrColorList(); scheduleDraw();
        });
        document.getElementById('g-col-len').addEventListener('change', function (e) {
            state.genome.cols.len = e.target.value; scheduleDraw();
        });
        document.getElementById('g-col-cen').addEventListener('change', function (e) {
            state.genome.cols.cen = e.target.value; scheduleDraw();
        });
    }

    function renderDensityColPanel() {
        const box = document.getElementById('cols-density');
        if (!box) return;
        if (!state.density.data.length) {
            box.innerHTML = '<p class="empty-tip">' + escapeXml(t('density.empty')) + '</p>';
            return;
        }
        const h = state.density.headers;
        function opt(sel) {
            return h.map(function (x) {
                return '<option value="' + escapeXml(x) + '"' + (x === sel ? ' selected' : '') + '>' + escapeXml(x) + '</option>';
            }).join('');
        }
        box.innerHTML =
            '<div class="param-grid cols-4">' +
            '  <div class="param-item"><label>' + escapeXml(t('density.colChr')) + ' <span style="color:#d9534f;">*</span></label>' +
            '    <select id="d-col-chr">' + opt(state.density.cols.chr) + '</select></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('density.colStart')) + ' <span style="color:#d9534f;">*</span></label>' +
            '    <select id="d-col-start">' + opt(state.density.cols.start) + '</select></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('density.colEnd')) + ' <span style="color:#d9534f;">*</span></label>' +
            '    <select id="d-col-end">' + opt(state.density.cols.end) + '</select></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('density.colValue')) + ' <span style="color:#d9534f;">*</span></label>' +
            '    <select id="d-col-value">' + opt(state.density.cols.value) + '</select></div>' +
            '</div>';

        document.getElementById('d-col-chr').addEventListener('change', function (e) {
            state.density.cols.chr = e.target.value; renderChrColorList(); scheduleDraw();
        });
        document.getElementById('d-col-start').addEventListener('change', function (e) {
            state.density.cols.start = e.target.value; scheduleDraw();
        });
        document.getElementById('d-col-end').addEventListener('change', function (e) {
            state.density.cols.end = e.target.value; scheduleDraw();
        });
        document.getElementById('d-col-value').addEventListener('change', function (e) {
            state.density.cols.value = e.target.value; scheduleDraw();
        });
    }

    function renderColorPanel() {
        renderChrColorPanel();
        renderDensityColorPanel();
    }

    function renderChrColorPanel() {
        const box = document.getElementById('chrColorPanel');
        if (!box) return;
        box.innerHTML =
            '<div class="param-grid cols-4">' +
            '  <div class="param-item"><label>' + escapeXml(t('chrColor.mode')) + '</label>' +
            '    <select id="sel-chr-mode">' +
            '      <option value="palette"' + (state.colors.chrMode === 'palette' ? ' selected' : '') + '>' + escapeXml(t('chrColor.modePalette')) + '</option>' +
            '      <option value="uniform"' + (state.colors.chrMode === 'uniform' ? ' selected' : '') + '>' + escapeXml(t('chrColor.modeUniform')) + '</option>' +
            '    </select></div>' +
            '  <div class="param-item" style="grid-column: span 2;"><label>' + escapeXml(t('chrColor.palette')) + '</label>' +
            '    <div id="chrPaletteDropdown"></div></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('chrColor.uniform')) + '</label>' +
            '    <input type="color" id="inp-chr-uniform" value="' + state.colors.chrUniform + '"></div>' +
            '</div>' +
            '<div id="chrColorContainer" style="margin-top:12px;"></div>';

        PC.renderPaletteDropdown(document.getElementById('chrPaletteDropdown'), {
            type: 'categorical',
            selected: state.colors.chrPalette,
            onSelect: function (name) {
                state.colors.chrPalette = name;
                state.colors.chrCustom = {};
                renderChrColorList();
                scheduleDraw();
            }
        });

        document.getElementById('sel-chr-mode').addEventListener('change', function (e) {
            state.colors.chrMode = e.target.value;
            renderChrColorList();
            scheduleDraw();
        });
        document.getElementById('inp-chr-uniform').addEventListener('input', function (e) {
            state.colors.chrUniform = e.target.value;
            renderChrColorList();
            scheduleDraw();
        });

        renderChrColorList();
    }

    function renderChrColorList() {
        const container = document.getElementById('chrColorContainer');
        if (!container) return;
        const chromosomes = buildModel().chromosomes;
        if (!chromosomes.length) {
            container.innerHTML = '<div class="color-assign-empty">' + escapeXml(t('chrColor.empty')) + '</div>';
            return;
        }
        PC.renderColorAssignment(container, {
            items: chromosomes.map(function (c, i) { return { name: c.name, color: chrColor(c.name, i) }; }),
            onChange: function (idx, color) {
                const current = buildModel().chromosomes;
                if (current[idx]) state.colors.chrCustom[current[idx].name] = color;
                scheduleDraw();
            },
            onResetAll: function () {
                state.colors.chrCustom = {};
                renderChrColorList();
                scheduleDraw();
            }
        });
    }

    function renderDensityColorPanel() {
        const box = document.getElementById('densityColorPanel');
        if (!box) return;
        const C = state.colors;
        const mode = C.densityPaletteMode || 'preset';

        box.innerHTML =
            '<div class="param-grid cols-4">' +
            '  <div class="param-item"><label>' + escapeXml(t('densityColor.mode')) + '</label>' +
            '    <select id="sel-density-palette-mode">' +
            '      <option value="preset"' + (mode === 'preset' ? ' selected' : '') + '>' + escapeXml(t('densityColor.modePreset')) + '</option>' +
            '      <option value="custom2"' + (mode === 'custom2' ? ' selected' : '') + '>' + escapeXml(t('densityColor.mode2')) + '</option>' +
            '      <option value="custom3"' + (mode === 'custom3' ? ' selected' : '') + '>' + escapeXml(t('densityColor.mode3')) + '</option>' +
            '    </select></div>' +
            '  <div class="param-item" style="grid-column: span 3;"><label class="mini-check"><input type="checkbox" id="chk-density-reverse"' +
            (C.densityReverse ? ' checked' : '') + '>' + escapeXml(t('densityColor.reverse')) + '</label></div>' +
            '</div>' +
            '<div class="dp-preset-item" style="margin-top:8px;' + (mode === 'preset' ? '' : 'display:none;') + '">' +
            '  <div id="densityPaletteDropdown"></div>' +
            '</div>' +
            '<div class="dp-custom2-item param-grid cols-4" style="margin-top:8px;' + (mode === 'custom2' ? '' : 'display:none;') + '">' +
            '  <div class="param-item"><label>' + escapeXml(t('densityColor.low')) + '</label>' +
            '    <input type="color" id="inp-density-c2-low" value="' + C.densityCustom2Low + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('densityColor.high')) + '</label>' +
            '    <input type="color" id="inp-density-c2-high" value="' + C.densityCustom2High + '"></div>' +
            '</div>' +
            '<div class="dp-custom3-item param-grid cols-4" style="margin-top:8px;' + (mode === 'custom3' ? '' : 'display:none;') + '">' +
            '  <div class="param-item"><label>' + escapeXml(t('densityColor.low')) + '</label>' +
            '    <input type="color" id="inp-density-c3-low" value="' + C.densityCustom3Low + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('densityColor.mid')) + '</label>' +
            '    <input type="color" id="inp-density-c3-mid" value="' + C.densityCustom3Mid + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('densityColor.high')) + '</label>' +
            '    <input type="color" id="inp-density-c3-high" value="' + C.densityCustom3High + '"></div>' +
            '</div>';

        PC.renderPaletteDropdown(document.getElementById('densityPaletteDropdown'), {
            type: 'continuous',
            selected: C.densityPalette,
            onSelect: function (name) { C.densityPalette = name; scheduleDraw(); }
        });

        function updateVis() {
            const m = C.densityPaletteMode;
            box.querySelector('.dp-preset-item').style.display = (m === 'preset') ? '' : 'none';
            box.querySelector('.dp-custom2-item').style.display = (m === 'custom2') ? '' : 'none';
            box.querySelector('.dp-custom3-item').style.display = (m === 'custom3') ? '' : 'none';
        }

        document.getElementById('sel-density-palette-mode').addEventListener('change', function (e) {
            C.densityPaletteMode = e.target.value;
            updateVis();
            scheduleDraw();
        });
        document.getElementById('chk-density-reverse').addEventListener('change', function (e) {
            C.densityReverse = e.target.checked;
            scheduleDraw();
        });
        document.getElementById('inp-density-c2-low').addEventListener('input', function (e) {
            C.densityCustom2Low = e.target.value; scheduleDraw();
        });
        document.getElementById('inp-density-c2-high').addEventListener('input', function (e) {
            C.densityCustom2High = e.target.value; scheduleDraw();
        });
        document.getElementById('inp-density-c3-low').addEventListener('input', function (e) {
            C.densityCustom3Low = e.target.value; scheduleDraw();
        });
        document.getElementById('inp-density-c3-mid').addEventListener('input', function (e) {
            C.densityCustom3Mid = e.target.value; scheduleDraw();
        });
        document.getElementById('inp-density-c3-high').addEventListener('input', function (e) {
            C.densityCustom3High = e.target.value; scheduleDraw();
        });
    }

    function setPath(path, value) {
        const parts = path.split('.');
        let obj = state;
        for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
        obj[parts[parts.length - 1]] = value;
    }
    function bindNumber(sel, path, min, max, integer, after, allowNull) {
        const el = document.getElementById(sel);
        if (!el) return;
        el.addEventListener('input', function () {
            const raw = String(el.value).trim();
            if (raw === '') {
                if (allowNull) { setPath(path, null); scheduleDraw(); }
                return;
            }
            let v = parseFloat(raw);
            if (!isFinite(v)) return;
            if (min !== undefined) v = Math.max(min, v);
            if (max !== undefined) v = Math.min(max, v);
            if (integer) v = Math.round(v);
            setPath(path, v);
            if (after) after(v);
            scheduleDraw();
        });
    }
    function bindCheck(sel, path, after) {
        const el = document.getElementById(sel);
        if (!el) return;
        el.addEventListener('change', function () {
            setPath(path, el.checked);
            if (after) after(el.checked);
            scheduleDraw();
        });
    }
    function bindColor(sel, path) {
        const el = document.getElementById(sel);
        if (!el) return;
        el.addEventListener('input', function () {
            setPath(path, el.value);
            scheduleDraw();
        });
    }
    function bindText(sel, path) {
        const el = document.getElementById(sel);
        if (!el) return;
        el.addEventListener('input', function () {
            setPath(path, el.value);
            scheduleDraw();
        });
    }
    function bindSelect(sel, path) {
        const el = document.getElementById(sel);
        if (!el) return;
        el.addEventListener('change', function () {
            setPath(path, el.value);
            scheduleDraw();
        });
    }

    function renderLayoutPanel() {
        const box = document.getElementById('layoutPanel');
        if (!box) return;
        box.className = 'param-panel';
        box.innerHTML =
            '<div class="param-panel-title">' + escapeXml(t('layout.title')) + '</div>' +
            '<div class="param-grid cols-4">' +
            '  <div class="param-item"><label>' + escapeXml(t('layout.orient')) + '</label>' +
            '    <select id="sel-orient">' +
            '      <option value="vertical"' + (state.layout.orientation === 'vertical' ? ' selected' : '') + '>' + escapeXml(t('layout.orientV')) + '</option>' +
            '      <option value="horizontal"' + (state.layout.orientation === 'horizontal' ? ' selected' : '') + '>' + escapeXml(t('layout.orientH')) + '</option>' +
            '    </select></div>' +
            '  <div class="param-item"><label id="lbl-perLine">' +
            escapeXml(state.layout.orientation === 'vertical' ? t('layout.perLineV') : t('layout.perLineH')) + '</label>' +
            '    <input type="number" id="inp-perLine" value="' + state.layout.perLine + '" min="1" max="60"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('layout.maxLen')) + '</label>' +
            '    <input type="number" id="inp-maxLenPx" value="' + state.layout.maxLenPx + '" min="80" max="1200" step="20"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('layout.chrWidth')) + '</label>' +
            '    <input type="number" id="inp-chrWidth" value="' + state.layout.chrWidth + '" min="3" max="120"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('layout.chrGap')) + '</label>' +
            '    <input type="number" id="inp-chrGap" value="' + state.layout.chrGap + '" min="4" max="300"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('layout.groupGap')) + '</label>' +
            '    <input type="number" id="inp-groupGap" value="' + (state.layout.groupGap != null ? state.layout.groupGap : 64) + '" min="8" max="400"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('layout.curvature')) + ' <span id="lbl-curv" class="axis-tip" style="display:inline">' + state.layout.curvature.toFixed(2) + '</span></label>' +
            '    <input type="range" id="inp-curvature" value="' + state.layout.curvature + '" min="0" max="1" step="0.01"></div>' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-centromere"' +
            (state.layout.showCentromere ? ' checked' : '') + '>' + escapeXml(t('layout.centromere')) + '</label></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('layout.strokeColor')) + '</label>' +
            '    <input type="color" id="inp-chrStroke" value="' + state.style.chrStroke + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('layout.strokeWidth')) + '</label>' +
            '    <input type="number" id="inp-chrStrokeWidth" value="' + state.style.chrStrokeWidth + '" min="0" max="8" step="0.5"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('layout.opacity')) + ' <span id="lbl-opacity" class="axis-tip" style="display:inline">' + state.style.chrOpacity.toFixed(2) + '</span></label>' +
            '    <input type="range" id="inp-chrOpacity" value="' + state.style.chrOpacity + '" min="0" max="1" step="0.01"></div>' +
            '</div>' +
            '<div class="param-grid cols-4" style="margin-top:10px;">' +
            '  <div class="param-item"><label>' + escapeXml(t('layout.labelPos')) + '</label>' +
            '    <select id="sel-chrLabelPos">' +
            '      <option value="none"' + (state.style.chrLabelPos === 'none' ? ' selected' : '') + '>' + escapeXml(t('layout.labelPosNone')) + '</option>' +
            '      <option value="top"' + (state.style.chrLabelPos === 'top' ? ' selected' : '') + '>' + escapeXml(t('layout.labelPosTop')) + '</option>' +
            '      <option value="bottom"' + (state.style.chrLabelPos === 'bottom' ? ' selected' : '') + '>' + escapeXml(t('layout.labelPosBottom')) + '</option>' +
            '    </select></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('layout.labelSize')) + '</label>' +
            '    <input type="number" id="inp-chrLabelSize" value="' + state.style.chrLabelSize + '" min="6" max="36"></div>' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-chrLabelBold"' +
            (state.style.chrLabelBold ? ' checked' : '') + '>' + escapeXml(t('layout.bold')) + '</label></div>' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-chrLabelItalic"' +
            (state.style.chrLabelItalic ? ' checked' : '') + '>' + escapeXml(t('layout.italic')) + '</label></div>' +
            '</div>';

        document.getElementById('sel-orient').addEventListener('change', function (e) {
            state.layout.orientation = e.target.value;
            document.getElementById('lbl-perLine').textContent =
                state.layout.orientation === 'vertical' ? t('layout.perLineV') : t('layout.perLineH');
            scheduleDraw();
        });
        bindNumber('inp-perLine', 'layout.perLine', 1, 80, true);
        bindNumber('inp-maxLenPx', 'layout.maxLenPx', 80, 1600, true);
        bindNumber('inp-chrWidth', 'layout.chrWidth', 3, 120, true);
        bindNumber('inp-chrGap', 'layout.chrGap', 4, 400, true);
        bindNumber('inp-groupGap', 'layout.groupGap', 8, 400, true);

        const curvEl = document.getElementById('inp-curvature');
        curvEl.addEventListener('input', function () {
            state.layout.curvature = parseFloat(curvEl.value);
            document.getElementById('lbl-curv').textContent = state.layout.curvature.toFixed(2);
            scheduleDraw();
        });
        bindCheck('chk-centromere', 'layout.showCentromere');
        bindColor('inp-chrStroke', 'style.chrStroke');
        bindNumber('inp-chrStrokeWidth', 'style.chrStrokeWidth', 0, 10);

        const opEl = document.getElementById('inp-chrOpacity');
        opEl.addEventListener('input', function () {
            state.style.chrOpacity = parseFloat(opEl.value);
            document.getElementById('lbl-opacity').textContent = state.style.chrOpacity.toFixed(2);
            scheduleDraw();
        });

        bindSelect('sel-chrLabelPos', 'style.chrLabelPos');
        bindNumber('inp-chrLabelSize', 'style.chrLabelSize', 6, 48, true);
        bindCheck('chk-chrLabelBold', 'style.chrLabelBold');
        bindCheck('chk-chrLabelItalic', 'style.chrLabelItalic');
    }

    function renderAxisPanel() {
        const box = document.getElementById('axisPanel');
        if (!box) return;
        box.className = 'param-panel';
        const A = state.axis;
        box.innerHTML =
            '<div class="param-panel-title">' + escapeXml(t('axis.title')) + '</div>' +
            '<div class="param-grid cols-4">' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-axisShow"' + (A.show ? ' checked' : '') + '>' + escapeXml(t('axis.show')) + '</label></div>' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-axisGroupAlign"' + (A.groupAlign ? ' checked' : '') + '>' + escapeXml(t('axis.groupAlign')) + '</label></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('axis.unit')) + '</label>' +
            '    <select id="sel-axisUnit">' +
            '      <option value="bp"' + (A.unit === 'bp' ? ' selected' : '') + '>bp</option>' +
            '      <option value="Kb"' + (A.unit === 'Kb' ? ' selected' : '') + '>Kb</option>' +
            '      <option value="Mb"' + (A.unit === 'Mb' ? ' selected' : '') + '>Mb</option>' +
            '    </select></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('axis.offset')) + '</label>' +
            '    <input type="number" id="inp-axisOffset" value="' + A.offset + '" min="0" max="200" step="4"></div>' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-axisTickShow"' + (A.tickValueShow !== false ? ' checked' : '') + '>' + escapeXml(t('axis.tickShow')) + '</label></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('axis.tickMode')) + '</label>' +
            '    <select id="sel-axisTickMode">' +
            '      <option value="auto"' + (A.tickMode === 'auto' ? ' selected' : '') + '>' + escapeXml(t('axis.tickAuto')) + '</option>' +
            '      <option value="range"' + (A.tickMode === 'range' ? ' selected' : '') + '>' + escapeXml(t('axis.tickRange')) + '</option>' +
            '      <option value="custom"' + (A.tickMode === 'custom' ? ' selected' : '') + '>' + escapeXml(t('axis.tickCustom')) + '</option>' +
            '    </select></div>' +
            '  <div class="param-item axis-auto-item"><label>' + escapeXml(t('axis.tickCount')) + '</label>' +
            '    <input type="number" id="inp-axisTicks" value="' + A.ticks + '" min="2" max="20"></div>' +
            '  <div class="param-item axis-range-item"><label>' + escapeXml(t('axis.min')) + '</label>' +
            '    <input type="number" id="inp-axisMin" value="' + (A.min != null ? A.min : '') + '" step="any" placeholder="' + escapeXml(t('common.auto')) + '"></div>' +
            '  <div class="param-item axis-range-item"><label>' + escapeXml(t('axis.max')) + '</label>' +
            '    <input type="number" id="inp-axisMax" value="' + (A.max != null ? A.max : '') + '" step="any" placeholder="' + escapeXml(t('common.auto')) + '"></div>' +
            '  <div class="param-item axis-range-item"><label>' + escapeXml(t('axis.step')) + '</label>' +
            '    <input type="number" id="inp-axisStep" value="' + (A.step != null ? A.step : '') + '" step="any" placeholder="' + escapeXml(t('common.auto')) + '"></div>' +
            '  <div class="param-item axis-custom-item" style="grid-column: span 2;"><label>' + escapeXml(t('axis.customList')) + '</label>' +
            '    <input type="text" id="inp-axisCustom" value="' + escapeXml(A.tickCustom) + '" placeholder="' + escapeXml(t('axis.customPlaceholder')) + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('axis.fontSize')) + '</label>' +
            '    <input type="number" id="inp-axisFontSize" value="' + A.fontSize + '" min="6" max="24"></div>' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-axisTickBold"' + (A.tickBold ? ' checked' : '') + '>' + escapeXml(t('axis.tickBold')) + '</label></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('axis.tickColor')) + '</label>' +
            '    <input type="color" id="inp-axisTickColor" value="' + A.tickColor + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('axis.lineColor')) + '</label>' +
            '    <input type="color" id="inp-axisLineColor" value="' + A.lineColor + '"></div>' +
            '</div>' +
            '<div class="param-grid cols-4" style="margin-top:10px;">' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-axisTitleShow"' + (A.titleShow ? ' checked' : '') + '>' + escapeXml(t('axis.titleShow')) + '</label></div>' +
            '  <div class="param-item" style="grid-column: span 2;"><label>' + escapeXml(t('axis.titleContent')) + '</label>' +
            '    <input type="text" id="inp-axisTitle" value="' + escapeXml(A.title || '') + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('axis.titleFontSize')) + '</label>' +
            '    <input type="number" id="inp-axisTitleFs" value="' + A.titleFontSize + '" min="6" max="30"></div>' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-axisTitleBold"' + (A.titleBold ? ' checked' : '') + '>' + escapeXml(t('layout.bold')) + '</label></div>' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-axisTitleItalic"' + (A.titleItalic ? ' checked' : '') + '>' + escapeXml(t('layout.italic')) + '</label></div>' +
            '</div>' +
            '<div class="info-box" style="margin-top:10px;">' + escapeXml(t('axis.info')) + '</div>';

        function bindOptionalNumber(sel, path) {
            const el = document.getElementById(sel);
            if (!el) return;
            el.addEventListener('input', function () {
                const raw = String(el.value).trim();
                if (raw === '') {
                    setPath(path, null);
                } else {
                    const n = parseFloat(raw);
                    setPath(path, isFinite(n) ? n : null);
                }
                scheduleDraw();
            });
        }

        function updateVis() {
            const mode = document.getElementById('sel-axisTickMode').value;
            document.querySelectorAll('#axisPanel .axis-auto-item').forEach(function (el) {
                el.style.display = (mode === 'auto') ? '' : 'none';
            });
            document.querySelectorAll('#axisPanel .axis-range-item').forEach(function (el) {
                el.style.display = (mode === 'range') ? '' : 'none';
            });
            document.querySelectorAll('#axisPanel .axis-custom-item').forEach(function (el) {
                el.style.display = (mode === 'custom') ? '' : 'none';
            });
        }

        bindCheck('chk-axisShow', 'axis.show');

        const unitEl = document.getElementById('sel-axisUnit');
        unitEl.addEventListener('change', function () {
            state.axis.unit = unitEl.value;
            if (state.axis.titleAuto) {
                state.axis.title = 'Sequence position (' + unitEl.value + ')';
                const titleInput = document.getElementById('inp-axisTitle');
                if (titleInput) titleInput.value = state.axis.title;
            }
            scheduleDraw();
        });
        bindNumber('inp-axisOffset', 'axis.offset', 0, 200, true);
        bindCheck('chk-axisTickShow', 'axis.tickValueShow');
        bindCheck('chk-axisGroupAlign', 'axis.groupAlign');
        document.getElementById('sel-axisTickMode').addEventListener('change', function (e) {
            state.axis.tickMode = e.target.value;
            updateVis();
            scheduleDraw();
        });
        updateVis();

        bindNumber('inp-axisTicks', 'axis.ticks', 2, 20, true);
        bindOptionalNumber('inp-axisMin', 'axis.min');
        bindOptionalNumber('inp-axisMax', 'axis.max');
        bindOptionalNumber('inp-axisStep', 'axis.step');
        bindText('inp-axisCustom', 'axis.tickCustom');
        bindNumber('inp-axisFontSize', 'axis.fontSize', 6, 30, true);
        bindCheck('chk-axisTickBold', 'axis.tickBold');
        bindColor('inp-axisTickColor', 'axis.tickColor');
        bindColor('inp-axisLineColor', 'axis.lineColor');
        bindCheck('chk-axisTitleShow', 'axis.titleShow');
        const titleInputEl = document.getElementById('inp-axisTitle');
        titleInputEl.addEventListener('input', function () {
            state.axis.title = titleInputEl.value;
            state.axis.titleAuto = /^Sequence position \((bp|Kb|Mb)\)$/.test(titleInputEl.value.trim());
            scheduleDraw();
        });
        bindNumber('inp-axisTitleFs', 'axis.titleFontSize', 6, 36, true);
        bindCheck('chk-axisTitleBold', 'axis.titleBold');
        bindCheck('chk-axisTitleItalic', 'axis.titleItalic');
    }

    function renderColorbarPanel() {
        const box = document.getElementById('colorbarPanel');
        if (!box) return;
        box.className = 'param-panel';
        const CB = state.colorbar;

        const model = buildModel();
        const autoMinTxt = model.hasDensity ? fmtNumShort(model.domain[0]) : t('common.auto');
        const autoMaxTxt = model.hasDensity ? fmtNumShort(model.domain[1]) : t('common.auto');

        box.innerHTML =
            '<div class="param-panel-title">' + escapeXml(t('colorbar.title')) + '</div>' +
            '<div class="param-grid cols-4">' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-colorbar"' + (CB.show ? ' checked' : '') + '>' + escapeXml(t('colorbar.show')) + '</label></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.orient')) + '</label>' +
            '    <select id="sel-cb-orient">' +
            '      <option value="vertical"' + (CB.orientation === 'vertical' ? ' selected' : '') + '>' + escapeXml(t('colorbar.orientV')) + '</option>' +
            '      <option value="horizontal"' + (CB.orientation === 'horizontal' ? ' selected' : '') + '>' + escapeXml(t('colorbar.orientH')) + '</option>' +
            '    </select></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.titleText')) + '</label>' +
            '    <input type="text" id="inp-cb-title" value="' + escapeXml(CB.title) + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.thickness')) + '</label>' +
            '    <input type="number" id="inp-cb-thickness" value="' + CB.thickness + '" min="6" max="60"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.length')) + '</label>' +
            '    <input type="number" id="inp-cb-length" value="' + (CB.length != null ? CB.length : '') + '" min="40" max="600" placeholder="' + escapeXml(t('common.auto')) + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.tickSide')) + '</label>' +
            '    <select id="sel-cb-tickSide">' +
            '      <option value="left"' + (CB.tickSide === 'left' ? ' selected' : '') + '>' + escapeXml(t('colorbar.tickSideLeft')) + '</option>' +
            '      <option value="right"' + (CB.tickSide === 'right' ? ' selected' : '') + '>' + escapeXml(t('colorbar.tickSideRight')) + '</option>' +
            '    </select></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.tickMode')) + '</label>' +
            '    <select id="sel-cb-tickMode">' +
            '      <option value="auto"' + (CB.tickMode === 'auto' ? ' selected' : '') + '>' + escapeXml(t('colorbar.tickAuto')) + '</option>' +
            '      <option value="custom"' + (CB.tickMode === 'custom' ? ' selected' : '') + '>' + escapeXml(t('colorbar.tickCustom')) + '</option>' +
            '    </select></div>' +
            '  <div class="param-item cb-auto-item"><label>' + escapeXml(t('colorbar.tickCount')) + '</label>' +
            '    <input type="number" id="inp-cb-tickCount" value="' + CB.tickCount + '" min="2" max="20"></div>' +
            '  <div class="param-item cb-custom-item" style="grid-column: span 2;"><label>' + escapeXml(t('colorbar.customList')) + '</label>' +
            '    <input type="text" id="inp-cb-tickCustom" value="' + escapeXml(CB.tickCustom) + '" placeholder="' + escapeXml(t('colorbar.customPlaceholder')) + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.decimals')) + '</label>' +
            '    <input type="number" id="inp-cb-decimals" value="' + CB.decimals + '" min="0" max="6"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.labelFontSize')) + '</label>' +
            '    <input type="number" id="inp-cb-labelFS" value="' + CB.labelFontSize + '" min="6" max="24"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.titleFontSize')) + '</label>' +
            '    <input type="number" id="inp-cb-titleFS" value="' + CB.titleFontSize + '" min="6" max="24"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.tickColor')) + '</label>' +
            '    <input type="color" id="inp-cb-tickColor" value="' + CB.tickColor + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.min', { v: autoMinTxt })) + '</label>' +
            '    <input type="number" id="inp-density-min" placeholder="' + escapeXml(autoMinTxt) + '" value="' +
            (state.colors.densityMin != null ? state.colors.densityMin : '') + '" step="any"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('colorbar.max', { v: autoMaxTxt })) + '</label>' +
            '    <input type="number" id="inp-density-max" placeholder="' + escapeXml(autoMaxTxt) + '" value="' +
            (state.colors.densityMax != null ? state.colors.densityMax : '') + '" step="any"></div>' +
            '</div>';

        function updateVis() {
            const mode = document.getElementById('sel-cb-tickMode').value;
            document.querySelectorAll('#colorbarPanel .cb-auto-item').forEach(function (el) {
                el.style.display = (mode === 'auto') ? '' : 'none';
            });
            document.querySelectorAll('#colorbarPanel .cb-custom-item').forEach(function (el) {
                el.style.display = (mode === 'custom') ? '' : 'none';
            });
        }

        bindCheck('chk-colorbar', 'colorbar.show');
        bindSelect('sel-cb-orient', 'colorbar.orientation');
        bindText('inp-cb-title', 'colorbar.title');
        bindNumber('inp-cb-thickness', 'colorbar.thickness', 6, 60, true);
        bindNumber('inp-cb-length', 'colorbar.length', 40, 600, true, null, true);
        bindSelect('sel-cb-tickSide', 'colorbar.tickSide');
        document.getElementById('sel-cb-tickMode').addEventListener('change', function (e) {
            state.colorbar.tickMode = e.target.value;
            updateVis();
            scheduleDraw();
        });
        updateVis();
        bindNumber('inp-cb-tickCount', 'colorbar.tickCount', 2, 20, true);
        bindText('inp-cb-tickCustom', 'colorbar.tickCustom');
        bindNumber('inp-cb-decimals', 'colorbar.decimals', 0, 6, true);
        bindNumber('inp-cb-labelFS', 'colorbar.labelFontSize', 6, 24, true);
        bindNumber('inp-cb-titleFS', 'colorbar.titleFontSize', 6, 24, true);
        bindColor('inp-cb-tickColor', 'colorbar.tickColor');
        bindNumber('inp-density-min', 'colors.densityMin', undefined, undefined, false, null, true);
        bindNumber('inp-density-max', 'colors.densityMax', undefined, undefined, false, null, true);
    }

    function renderLabelPanel() {
        const box = document.getElementById('labelPanel');
        if (!box) return;
        box.className = 'param-panel';
        box.innerHTML =
            '<div class="param-panel-title">' + escapeXml(t('labels.title')) + '</div>' +
            '<div class="param-grid cols-4">' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-labelsShow"' +
            (state.labels.show ? ' checked' : '') + '>' + escapeXml(t('labels.show')) + '</label></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('labels.side')) + '</label>' +
            '    <select id="sel-labelSide">' +
            '      <option value="right"' + (state.labels.side === 'right' ? ' selected' : '') + '>' + escapeXml(t('labels.sideRight')) + '</option>' +
            '      <option value="left"' + (state.labels.side === 'left' ? ' selected' : '') + '>' + escapeXml(t('labels.sideLeft')) + '</option>' +
            '    </select></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('labels.fontSize')) + '</label>' +
            '    <input type="number" id="inp-labelSize" value="' + state.labels.size + '" min="6" max="24"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('labels.color')) + '</label>' +
            '    <input type="color" id="inp-labelColor" value="' + state.labels.color + '"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('labels.leadLen')) + '</label>' +
            '    <input type="number" id="inp-labelLead" value="' + state.labels.leadLen + '" min="-200" max="400"></div>' +
            '  <div class="param-item"><label>' + escapeXml(t('labels.leadColor')) + '</label>' +
            '    <input type="color" id="inp-labelLeadColor" value="' + state.labels.leadColor + '"></div>' +
            '  <div class="param-item"><label class="mini-check"><input type="checkbox" id="chk-labelBold"' +
            (state.labels.bold ? ' checked' : '') + '>' + escapeXml(t('labels.bold')) + '</label>' +
            '    <label class="mini-check" style="margin-left:12px;"><input type="checkbox" id="chk-labelItalic"' +
            (state.labels.italic ? ' checked' : '') + '>' + escapeXml(t('labels.italic')) + '</label></div>' +
            '</div>' +
            '<div style="margin-top:8px; display:flex; flex-direction:column; gap:8px; align-items:stretch;">' +
            '  <label style="display:block;">' + escapeXml(t('labels.dataLabel')) + '</label>' +
            '  <textarea id="txt-labels" rows="5" style="width:100%;resize:vertical;box-sizing:border-box;" placeholder="name&#9;chr&#9;pos&#10;TP53&#9;chr1&#9;15000000&#10;BRCA1&#9;chr2&#9;32000000"></textarea>' +
            '  <div style="display:flex; flex-wrap:wrap; gap:8px;">' +
            '    <button class="btn" id="btn-labels-apply">' + escapeXml(t('labels.apply')) + '</button>' +
            '    <button class="btn" id="btn-labels-sample">' + escapeXml(t('labels.sample')) + '</button>' +
            '    <button class="btn" id="btn-labels-file">' + escapeXml(t('labels.import')) + '</button>' +
            '    <input type="file" id="file-labels" accept=".tsv,.csv,.txt" hidden>' +
            '  </div>' +
            '  <div class="info-box">' + escapeXml(t('labels.hint')) + '</div>' +
            '</div>';

        bindCheck('chk-labelsShow', 'labels.show');
        bindSelect('sel-labelSide', 'labels.side');
        bindNumber('inp-labelSize', 'labels.size', 6, 30, true);
        bindColor('inp-labelColor', 'labels.color');
        bindNumber('inp-labelLead', 'labels.leadLen', -200, 400, true);
        bindColor('inp-labelLeadColor', 'labels.leadColor');
        bindCheck('chk-labelBold', 'labels.bold');
        bindCheck('chk-labelItalic', 'labels.italic');

        document.getElementById('btn-labels-apply').addEventListener('click', applyLabelText);
        document.getElementById('btn-labels-sample').addEventListener('click', generateSampleLabels);
        document.getElementById('btn-labels-file').addEventListener('click', function () {
            document.getElementById('file-labels').click();
        });
        document.getElementById('file-labels').addEventListener('change', function (e) {
            const f = e.target.files[0];
            if (!f) return;
            readFileAsText(f).then(function (text) {
                document.getElementById('txt-labels').value = text.trim();
                applyLabelText();
            });
            e.target.value = '';
        });
    }

    function applyLabelText() {
        const text = document.getElementById('txt-labels').value;
        if (!text.trim()) { state.labels.data = []; scheduleDraw(); return; }
        const parsed = PC.parseTable(text);
        const out = [];
        const headers = parsed.headers;
        if (headers.length < 3) { alert(t('labels.errCols')); return; }
        for (const row of parsed.data) {
            const name = String(row[headers[0]] || '').trim();
            const chr = String(row[headers[1]] || '').trim();
            const pos = parseFloat(row[headers[2]]);
            if (name && chr && isFinite(pos)) out.push({ name: name, chr: chr, pos: pos });
        }
        state.labels.data = out;
        scheduleDraw();
    }

    function generateSampleLabels() {
        const model = buildModel();
        if (!model.chromosomes.length) { alert(t('labels.errNoData')); return; }
        const geneNames = ['TP53', 'BRCA1', 'EGFR', 'MYC', 'KRAS', 'PTEN', 'RB1', 'APC',
            'VHL', 'NF1', 'ALK', 'MET', 'RET', 'BRAF', 'PIK3CA', 'CDKN2A', 'SMAD4', 'ARID1A'];
        const out = [];
        for (const c of model.chromosomes) {
            const count = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                out.push({
                    name: geneNames[Math.floor(Math.random() * geneNames.length)] + '-' + (i + 1),
                    chr: c.name,
                    pos: Math.floor(c.length * (0.05 + Math.random() * 0.9))
                });
            }
        }
        state.labels.data = out;
        document.getElementById('txt-labels').value = out.map(function (l) {
            return l.name + '\t' + l.chr + '\t' + l.pos;
        }).join('\n');
        scheduleDraw();
    }

    const DATA_STATE_FIELDS = ['currentSvg', 'genome', 'density'];

    function collectFormState() {
        const out = {};
        document.querySelectorAll('input[id], select[id], textarea[id]').forEach(function (el) {
            if (el.closest('#genomeImportPanel')) return;
            if (el.closest('#densityImportPanel')) return;
            if (el.id === 'importStateFile') return;
            if (el.id === 'file-labels') return;
            if (el.type === 'file') return;
            if (el.type === 'radio') {
                if (el.checked) out[el.id] = true;
                return;
            }
            if (el.type === 'checkbox') {
                out[el.id] = !!el.checked;
            } else {
                out[el.id] = el.value;
            }
        });
        return out;
    }

    function applyFormState(form) {
        if (!form) return;
        Object.keys(form).forEach(function (id) {
            const el = document.getElementById(id);
            if (!el) return;
            const v = form[id];
            if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!v;
            else el.value = v;
        });
    }

    function collectState() {
        const copy = {};
        Object.keys(state).forEach(function (k) {
            if (DATA_STATE_FIELDS.indexOf(k) >= 0) return;
            try { copy[k] = JSON.parse(JSON.stringify(state[k])); } catch (e) {}
        });
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            exportName: 'chromosome-view',
            form: collectFormState(),
            state: copy
        };
    }

    function showToolbarTip(msg, type) {
        const tip = document.getElementById('toolbarTip');
        if (!tip) return;
        tip.className = 'tip-text ' + (type || '');
        tip.textContent = msg;
        setTimeout(function () {
            if (tip.textContent === msg) {
                tip.textContent = '';
                tip.className = 'tip-text';
            }
        }, 3500);
    }

    function exportStateToFile() {
        const data = collectState();
        const blob = new Blob([JSON.stringify(data, null, 2)],
            { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chromosome-view_style.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        showToolbarTip(t('style.exported'), 'success');
    }

    function applyState(data) {
        if (!data || typeof data !== 'object' || !data.state) {
            throw new Error('invalid style file');
        }

        Object.keys(data.state).forEach(function (k) {
            if (DATA_STATE_FIELDS.indexOf(k) >= 0) return;
            state[k] = data.state[k];
        });

        if (!state.colorbar.offset) state.colorbar.offset = { dx: 0, dy: 0 };

        applyFormState(data.form);

        renderColMapPanel();
        renderColorPanel();
        renderColorbarPanel();
        renderAxisPanel();
        renderLayoutPanel();
        renderLabelPanel();

        drawChart();

        setTimeout(function () {
            showToolbarTip(t('style.restored'), 'success');
        }, 100);
    }

    function handleImportStateFile(e) {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                applyState(JSON.parse(ev.target.result));
            } catch (err) {
                console.error(err);
                showToolbarTip(t('style.invalid'), 'error');
            }
        };
        reader.readAsText(f);
        e.target.value = '';
    }

    function bindExport() {
        document.getElementById('exportSvgBtn').addEventListener('click', function () {
            const svg = PlotCanvas.getSvgWithoutBorder(state.currentSvg);
            if (!svg) return;
            PC.downloadSVG(svg, 'chromosome-view.svg');
        });
        document.getElementById('exportPngBtn').addEventListener('click', function () {
            const svg = PlotCanvas.getSvgWithoutBorder(state.currentSvg);
            if (!svg) return;
            PC.downloadPNG(svg, 'chromosome-view.png', 2, '#ffffff')
                .catch(function () { alert(t('err.png')); });
        });

        const importBtn = document.getElementById('importStateBtn');
        const importFile = document.getElementById('importStateFile');
        const exportBtn = document.getElementById('exportStateBtn');

        if (importBtn) importBtn.textContent = t('style.load');
        if (exportBtn) exportBtn.textContent = t('style.export');

        if (importBtn && importFile) {
            importBtn.addEventListener('click', function () { importFile.click(); });
            importFile.addEventListener('change', handleImportStateFile);
        }
        if (exportBtn) {
            exportBtn.addEventListener('click', exportStateToFile);
        }
    }

    function init() {
        injectPageStyle();
        initPalettes();

        if (document.getElementById('globalSettingsPanel')) {
            PC.renderGlobalSettings('globalSettingsPanel');
            const cw = document.getElementById('chartWidth');
            const ch = document.getElementById('chartHeight');
            if (cw && !cw.value) cw.value = 900;
            if (ch && !ch.value) ch.value = 700;
        }

        PC.renderImportPanel('genomeImportPanel', {
            groupName: 'inputModeGenome',
            embedded: true,
            title: t('import.genomeTitle'),
            infoBox: t('import.genomeInfo'),
            exampleData: makeGenomeExample(),
            defaultMode: 'file',
            onImport: function (res) {
                state.genome = { headers: res.headers, data: res.data, cols: { chr: '', len: '', cen: '' }, fileName: '' };
                autoDetectGenomeCols();
                renderGenomeColPanel();
                renderChrColorList();
                renderColorbarPanel();
                scheduleDraw();
            },
            onReset: function () {
                state.genome = { headers: [], data: [], cols: { chr: '', len: '', cen: '' }, fileName: '' };
                renderGenomeColPanel();
                renderChrColorList();
                renderDensityColorPanel();
                scheduleDraw();
            }
        });

        PC.renderImportPanel('densityImportPanel', {
            groupName: 'inputModeDensity',
            embedded: true,
            title: t('import.densityTitle'),
            infoBox: t('import.densityInfo'),
            exampleData: makeDensityExample(),
            defaultMode: 'file',
            onImport: function (res) {
                state.density = { headers: res.headers, data: res.data, cols: { chr: '', start: '', end: '', value: '' }, fileName: '' };
                autoDetectDensityCols();
                renderDensityColPanel();
                renderChrColorList();
                renderColorbarPanel();
                scheduleDraw();
            },
            onReset: function () {
                state.density = { headers: [], data: [], cols: { chr: '', start: '', end: '', value: '' }, fileName: '' };
                renderDensityColPanel();
                renderChrColorList();
                renderDensityColorPanel();
                scheduleDraw();
            }
        });

        renderColMapPanel();
        renderColorPanel();
        renderColorbarPanel();
        renderAxisPanel();
        renderLayoutPanel();
        renderLabelPanel();

        document.querySelectorAll('[data-redraw]').forEach(function (el) {
            el.addEventListener('change', scheduleDraw);
        });

        document.getElementById('drawBtn').addEventListener('click', drawChart);
        bindExport();

        window.PlotApp = window.PlotApp || { current: null };
        window.PlotApp.current = {
            state: state,
            drawChart: drawChart,
            $: function (id) { return document.getElementById(id); }
        };

        drawChart();
    }

    function boot() {
        PlotBootstrap.ensureD3().then(init).catch(function (err) {
            console.error(err);
            const box = document.getElementById('chartPreview');
            if (box) box.innerHTML = '<div class="placeholder" style="color:#c00;">' + escapeXml(t('err.d3')) + '</div>';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
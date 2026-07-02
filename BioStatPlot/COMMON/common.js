/**
 * BioDataTools 公共模块
 * 包含：配置管理、导出帮助、数据导入导出、状态持久化
 * 
 * 注意：语言管理已移至 lang.js
 */

// ============================================================
// 1. 配置管理器
// ============================================================
var ConfigManager = function(defaultConfig) {
    this.defaultConfig = this._clone(defaultConfig);
    this.currentConfig = this._clone(defaultConfig);
};

ConfigManager.prototype._clone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};

ConfigManager.prototype.reset = function() {
    this.currentConfig = this._clone(this.defaultConfig);
    return this.currentConfig;
};

ConfigManager.prototype.importFromJSON = function(jsonStr) {
    try {
        var imported = JSON.parse(jsonStr);
        this.currentConfig = this._deepMerge(this._clone(this.defaultConfig), imported);
        return this.currentConfig;
    } catch (e) {
        console.error(e);
        return null;
    }
};

ConfigManager.prototype.exportToJSON = function() {
    return JSON.stringify(this.currentConfig, null, 2);
};

ConfigManager.prototype._deepMerge = function(target, source) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                target[key] = this._deepMerge(target[key] || {}, source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
};

// ============================================================
// 2. 导出帮助类
// ============================================================
var ExportHelper = {};

ExportHelper.exportSVG = function(svgElement, filename) {
    filename = filename || 'chart.svg';
    if (!svgElement) return;
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svgElement);
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    var blob = new Blob([source], { type: 'image/svg+xml' });
    this._download(blob, filename);
};

ExportHelper.exportPNGFromSVG = function(svgElement, scale) {
    scale = scale || 2;
    return new Promise(function(resolve, reject) {
        var svgString = new XMLSerializer().serializeToString(svgElement);
        var img = new Image();
        var blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var w = svgElement.width.baseVal.value;
            var h = svgElement.height.baseVal.value;
            canvas.width = w * scale;
            canvas.height = h * scale;
            var ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
    });
};

ExportHelper.exportPDFFromSVG = function(svgElement, filename, scale) {
    filename = filename || 'chart.pdf';
    scale = scale || 2;
    var self = this;
    return new Promise(function(resolve, reject) {
        self.exportPNGFromSVG(svgElement, scale).then(function(dataURL) {
            var img = new Image();
            img.src = dataURL;
            img.onload = function() {
                var jsPDF = window.jspdf.jsPDF;
                var orientation = img.width > img.height ? 'landscape' : 'portrait';
                var pdf;
                if (orientation === 'landscape') {
                    pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                } else {
                    pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                }
                var imgWidth = pdf.internal.pageSize.getWidth();
                var imgHeight = (img.height * imgWidth) / img.width;
                pdf.addImage(dataURL, 'PNG', 0, 0, imgWidth, imgHeight);
                pdf.save(filename);
                resolve();
            };
            img.onerror = reject;
        }).catch(reject);
    });
};

ExportHelper._download = function(blob, filename) {
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
};

// ============================================================
// 3. 数据导入导出工具
// ============================================================
var DataHelper = {};

DataHelper.exportToCSV = function(data) {
    var csv = "name,value,color\n";
    for (var i = 0; i < data.length; i++) {
        csv += data[i].name + ',' + data[i].value + ',' + data[i].color + '\n';
    }
    return csv;
};

DataHelper.importFromCSV = function(csvStr) {
    var lines = csvStr.trim().split(/\r?\n/);
    if (lines.length < 2) return null;
    var delimiter = ',';
    var firstLine = lines[0];
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes(',')) delimiter = ',';
    else if (firstLine.includes(' ')) delimiter = ' ';
    
    var headers = lines[0].split(delimiter).map(function(h) { return h.trim().toLowerCase(); });
    var nameIdx = headers.indexOf('name');
    var valueIdx = headers.indexOf('value');
    var colorIdx = headers.indexOf('color');
    if (nameIdx === -1 || valueIdx === -1 || colorIdx === -1) return null;
    
    var data = [];
    for (var i = 1; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        var parts = line.split(delimiter);
        parts = parts.map(function(p) { return p.trim().replace(/^"|"$/g, ''); });
        if (parts.length < 3) continue;
        var name = parts[nameIdx];
        var value = parseFloat(parts[valueIdx]);
        var color = parts[colorIdx];
        if (isNaN(value)) continue;
        data.push({ name: name, value: value, color: color });
    }
    return data.length > 0 ? data : null;
};

// ============================================================
// 4. 状态持久化
// ============================================================
var StateManager = function(storageKey) {
    this.storageKey = storageKey;
};

StateManager.prototype.saveState = function(data, config, palette, opacity) {
    var state = { data: data, config: config, palette: palette };
    if (opacity !== undefined) {
        state.opacity = opacity;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(state));
};

StateManager.prototype.loadState = function() {
    var raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch(e) {
        return null;
    }
};

StateManager.prototype.clearState = function() {
    localStorage.removeItem(this.storageKey);
};

// ============================================================
// 5. 通用工具函数
// ============================================================
function downloadFile(content, filename, mimeType) {
    mimeType = mimeType || 'text/plain';
    var blob = new Blob([content], { type: mimeType });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function showMessage(msg, type) {
    type = type || 'info';
    if (window.showToast) {
        window.showToast(msg);
    } else {
        alert(msg);
    }
}

// ============================================================
// 6. 通用图表数据管理
// ============================================================
var ChartDataManager = {
    /**
     * 初始化数据状态
     */
    init: function(defaultData, storageKey, defaultPalette) {
        defaultPalette = defaultPalette || 'academic';
        var stateManager = new StateManager(storageKey);
        var saved = stateManager.loadState();
        var data = [];
        
        if (saved && saved.data) {
            data = saved.data;
        } else {
            data = JSON.parse(JSON.stringify(defaultData));
        }
        
        return {
            chartData: data,
            stateManager: stateManager,
            currentPalette: saved ? (saved.palette || defaultPalette) : defaultPalette
        };
    },
    
    /**
     * 计算数据总和
     */
    updateTotal: function(chartData) {
        var sum = 0;
        for (var i = 0; i < chartData.length; i++) {
            sum += chartData[i].value || 0;
        }
        return sum;
    },
    
    /**
     * 生成CSV文本
     */
    toCSVText: function(chartData) {
        return chartData.map(function(item) {
            return item.name + '\t' + item.value;
        }).join('\n');
    },
    
    /**
     * 添加数据行
     */
    addRow: function(chartData, palette) {
        var colors = ColorUtils.getPalette(palette || 'academic', chartData.length + 1);
        var lang = LangManager.getLang();
        chartData.push({
            name: lang === 'en' ? 'New' : '新分类',
            value: 10,
            color: colors[chartData.length]
        });
        return chartData;
    },
    
    /**
     * 删除数据行
     */
    removeRow: function(chartData, idx) {
        if (chartData.length > 1) {
            chartData.splice(idx, 1);
        }
        return chartData;
    },
    
    /**
     * 从CSV文本解析数据
     */
    applyCSV: function(csvText, palette) {
        var text = csvText.trim();
        if (!text) return null;
        
        var lines = text.split(/\r?\n/);
        var newData = [];
        var colors = ColorUtils.getPalette(palette || 'academic');
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            
            var delimiter = line.includes('\t') ? '\t' : 
                           (line.includes(',') ? ',' : 
                           (/\s+/.test(line) ? ' ' : null));
            if (!delimiter) continue;
            
            var parts = line.split(delimiter);
            if (parts.length < 2) continue;
            
            var name = parts[0].trim();
            var value = parseFloat(parts[1]);
            if (isNaN(value)) continue;
            
            var color = colors[newData.length % colors.length];
            newData.push({ name: name, value: value, color: color });
        }
        
        return newData.length > 0 ? newData : null;
    },
    
    /**
     * 导出数据为CSV文件
     */
    exportDataToCSV: function(chartData) {
        var csv = "name\tvalue\tcolor\n";
        for (var i = 0; i < chartData.length; i++) {
            var d = chartData[i];
            csv += d.name + '\t' + d.value + '\t' + d.color + '\n';
        }
        downloadFile(csv, 'chart_data_full.tsv', 'text/tsv');
    },
    
    /**
     * 切换配色方案
     */
    switchPalette: function(chartData, paletteName) {
        var hexColors = ColorUtils.getPalette(paletteName, chartData.length);
        for (var i = 0; i < chartData.length; i++) {
            chartData[i].color = hexColors[i % hexColors.length];
        }
        return chartData;
    }
};

// ============================================================
// 7. 通用配置管理
// ============================================================
var ConfigHelper = {
    /**
     * 重置配置到默认值
     */
    resetConfig: function(config, defaultConfig, chartData, defaultPalette) {
        var newConfig = JSON.parse(JSON.stringify(defaultConfig));
        var colors = ColorUtils.getPalette(defaultPalette || 'academic', chartData.length);
        for (var i = 0; i < chartData.length; i++) {
            chartData[i].color = colors[i % colors.length];
        }
        return {
            config: newConfig,
            chartData: chartData,
            palette: defaultPalette || 'academic'
        };
    },
    
    /**
     * 导出配置为JSON文件
     */
    exportConfig: function(config) {
        downloadFile(JSON.stringify(config, null, 2), 'chart_config.json', 'application/json');
    },
    
    /**
     * 从JSON文件导入配置
     */
    importConfig: function(file, defaultConfig, callback) {
        var reader = new FileReader();
        reader.onload = function(ev) {
            try {
                var imported = JSON.parse(ev.target.result);
                var newConfig = {
                    ...defaultConfig,
                    ...imported,
                    margin: { ...defaultConfig.margin, ...imported.margin }
                };
                if (callback) callback(newConfig);
            } catch(err) {
                alert(LangManager.t('invalidConfig'));
            }
        };
        reader.readAsText(file);
    }
};

// ============================================================
// 8. 图表导出工具
// ============================================================
var ChartExportHelper = {
    /**
     * 通用导出方法
     */
    exportChart: function(chartDiv, format, filename) {
        filename = filename || 'chart';
        var svgElem = chartDiv.querySelector('svg');
        if (!svgElem) {
            alert(LangManager.t('noSVG'));
            return;
        }
        
        switch(format) {
            case 'svg':
                ExportHelper.exportSVG(svgElem, filename + '.svg');
                break;
            case 'png':
                ExportHelper.exportPNGFromSVG(svgElem, 3)
                    .then(function(dataURL) {
                        var link = document.createElement('a');
                        link.download = filename + '.png';
                        link.href = dataURL;
                        link.click();
                    })
                    .catch(function(err) {
                        alert(LangManager.t('pngFailed') + ': ' + err.message);
                    });
                break;
            case 'pdf':
                ExportHelper.exportPDFFromSVG(svgElem, filename + '.pdf', 3)
                    .catch(function(err) {
                        alert(LangManager.t('pdfFailed') + ': ' + err.message);
                    });
                break;
            default:
                alert('Unsupported format: ' + format);
        }
    }
};

// ============================================================
// 9. 导出到全局
// ============================================================
window.ConfigManager = ConfigManager;
window.ExportHelper = ExportHelper;
window.DataHelper = DataHelper;
window.StateManager = StateManager;
window.downloadFile = downloadFile;
window.showMessage = showMessage;
window.ChartDataManager = ChartDataManager;
window.ConfigHelper = ConfigHelper;
window.ChartExportHelper = ChartExportHelper;

console.log('✅ BioDataTools 公共模块已加载');
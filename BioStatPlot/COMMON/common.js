/**
 * BioDataTools 公共模块（精简版）
 * 包含：配置管理、导出帮助（支持SVG/PNG/PDF）、数据导入导出、状态持久化
 */
// ========== 配置管理器 ==========
class ConfigManager {
    constructor(defaultConfig) {
        this.defaultConfig = this._clone(defaultConfig);
        this.currentConfig = this._clone(defaultConfig);
    }
    _clone(obj) { return JSON.parse(JSON.stringify(obj)); }
    reset() { this.currentConfig = this._clone(this.defaultConfig); return this.currentConfig; }
    importFromJSON(jsonStr) {
        try {
            const imported = JSON.parse(jsonStr);
            this.currentConfig = this._deepMerge(this._clone(this.defaultConfig), imported);
            return this.currentConfig;
        } catch (e) { console.error(e); return null; }
    }
    exportToJSON() { return JSON.stringify(this.currentConfig, null, 2); }
    _deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]))
                    target[key] = this._deepMerge(target[key] || {}, source[key]);
                else target[key] = source[key];
            }
        }
        return target;
    }
}

// ========== 导出帮助类 ==========
class ExportHelper {
    static async exportSVG(svgElement, filename = 'chart.svg') {
        if (!svgElement) return;
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        const blob = new Blob([source], { type: 'image/svg+xml' });
        this._download(blob, filename);
    }

    // 基于 SVG 元素直接导出 PNG（避免 html2canvas 偏移）
    static async exportPNGFromSVG(svgElement, scale = 2) {
        return new Promise((resolve, reject) => {
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const w = svgElement.width.baseVal.value;
                const h = svgElement.height.baseVal.value;
                canvas.width = w * scale;
                canvas.height = h * scale;
                const ctx = canvas.getContext('2d');
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0, w, h);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    static async exportPDFFromSVG(svgElement, filename = 'chart.pdf', scale = 2) {
        const dataURL = await this.exportPNGFromSVG(svgElement, scale);
        const img = new Image();
        img.src = dataURL;
        await new Promise(resolve => { img.onload = resolve; });
        const { jsPDF } = jspdf;
        const orientation = img.width > img.height ? 'landscape' : 'portrait';
        let pdf;
        if (orientation === 'landscape') pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        else pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (img.height * imgWidth) / img.width;
        pdf.addImage(dataURL, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(filename);
    }

    static _download(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
}

// ========== 数据导入导出工具 ==========
class DataHelper {
    static exportToCSV(data) {
        let csv = "name,value,color\n";
        data.forEach(item => { csv += `${item.name},${item.value},${item.color}\n`; });
        return csv;
    }
    static importFromCSV(csvStr) {
        const lines = csvStr.trim().split(/\r?\n/);
        if (lines.length < 2) return null;
        let delimiter = ',';
        const firstLine = lines[0];
        if (firstLine.includes('\t')) delimiter = '\t';
        else if (firstLine.includes(';')) delimiter = ';';
        else if (firstLine.includes(',')) delimiter = ',';
        else if (firstLine.includes(' ')) delimiter = ' ';
        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('name');
        const valueIdx = headers.indexOf('value');
        const colorIdx = headers.indexOf('color');
        if (nameIdx === -1 || valueIdx === -1 || colorIdx === -1) return null;
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            let parts = line.split(delimiter);
            parts = parts.map(p => p.trim().replace(/^"|"$/g, ''));
            if (parts.length < 3) continue;
            const name = parts[nameIdx];
            const value = parseFloat(parts[valueIdx]);
            const color = parts[colorIdx];
            if (isNaN(value)) continue;
            data.push({ name, value, color });
        }
        return data.length > 0 ? data : null;
    }
}

// ========== 状态持久化 ==========
class StateManager {
    constructor(storageKey) { this.storageKey = storageKey; }
    saveState(data, config) { localStorage.setItem(this.storageKey, JSON.stringify({ data, config })); }
    loadState() {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch(e) { return null; }
    }
    clearState() { localStorage.removeItem(this.storageKey); }
}

// ========== 通用工具函数 ==========
function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function showMessage(msg, type = 'info') {
    if (window.showToast) window.showToast(msg);
    else alert(msg);
}

// 导出全局变量
window.ConfigManager = ConfigManager;
window.ExportHelper = ExportHelper;
window.DataHelper = DataHelper;
window.StateManager = StateManager;
window.downloadFile = downloadFile;
window.showMessage = showMessage;
/**
 * BioDataTools 公用配色方案
 * 适用于所有图表（饼图、柱状图、散点图、热图等）
 * 使用方式：在 HTML 中引入 <script src="../COMMON/colors.js"></script>
 */

// ============================================================
// 1. 基础调色板（10色，适用于大部分场景）
// ============================================================
const COLOR_PALETTES = {
    academic: [
        "#E64B35", "#4DBBD5", "#00A087", "#3C5488", "#F39B7F",
        "#8491B4", "#91D1C2", "#DC0000", "#7E6148", "#B09C85"
    ],
    vibrant: [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
        "#DDA0DD", "#FF8A5C", "#A29BFE", "#FD79A8", "#00CEC9"
    ],
    warm: [
        "#F94144", "#F3722C", "#F8961E", "#F9C74F", "#F9844A",
        "#F94144", "#DC2F02", "#E85D04", "#F48C06", "#FAA307"
    ],
    cool: [
        "#03045E", "#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8",
        "#023E8A", "#0096C7", "#48CAE4", "#ADE8F4", "#E0F7FA"
    ],
    earth: [
        "#8B5A2B", "#A67B5B", "#C4A882", "#D4C4A8", "#E8DCC8",
        "#6B4423", "#8B7355", "#A08C6E", "#B8A48A", "#D2C4B0"
    ],
    gradient: {
        ryg: ["#D73027", "#F46D43", "#FDAE61", "#FEE08B", "#D9EF8B", "#A6D96A", "#66BD63", "#1A9850"],
        bwr: ["#2166AC", "#4393C3", "#92C5DE", "#D1E5F0", "#FDDBC7", "#F4A582", "#D6604D", "#B2182B"],
        bpr: ["#313695", "#4575B4", "#74ADD1", "#ABD9E9", "#FDAE61", "#F46D43", "#D73027", "#A50026"],
        yor: ["#FFFFB2", "#FED976", "#FEB24C", "#FD8D3C", "#F03B20", "#BD0026", "#800026"],
        gb: ["#E5F5E0", "#C7E9C0", "#A1D99B", "#74C476", "#41AB5D", "#238B45", "#005A32"]
    }
};

// ============================================================
// 2. 配色显示名称（中英文）
// ============================================================
const PALETTE_DISPLAY = {
    en: {
        academic: 'Academic',
        vibrant: 'Vibrant',
        warm: 'Warm',
        cool: 'Cool',
        earth: 'Earth'
    },
    zh: {
        academic: '学术风格',
        vibrant: '鲜艳风格',
        warm: '暖色系',
        cool: '冷色系',
        earth: '大地色系'
    }
};

// ============================================================
// 3. 配色工具函数
// ============================================================
const ColorUtils = {
    getPalette: function(name, count) {
        name = name || 'academic';
        count = count || 10;
        var palette = COLOR_PALETTES[name] || COLOR_PALETTES.academic;
        var colors = [];
        for (var i = 0; i < count; i++) {
            colors.push(palette[i % palette.length]);
        }
        return colors;
    },

    getPaletteNames: function() {
        var keys = [];
        for (var key in COLOR_PALETTES) {
            if (key !== 'gradient') {
                keys.push(key);
            }
        }
        return keys;
    },

    getPaletteDisplayName: function(name, lang) {
        lang = lang || 'en';
        return PALETTE_DISPLAY[lang]?.[name] || name;
    },

    getPaletteOptions: function(lang) {
        lang = lang || 'en';
        var names = this.getPaletteNames();
        var result = [];
        for (var i = 0; i < names.length; i++) {
            result.push({
                value: names[i],
                label: this.getPaletteDisplayName(names[i], lang)
            });
        }
        return result;
    },

    // ============================================================
    // 透明度相关方法
    // ============================================================

    getPaletteWithOpacity: function(name, count, opacity) {
        name = name || 'academic';
        count = count || 10;
        opacity = opacity || 1;
        var colors = this.getPalette(name, count);
        return this.applyOpacity(colors, opacity);
    },

    getColorWithOpacity: function(color, opacity) {
        opacity = opacity || 0.5;
        if (!color) return 'rgba(0,0,0,' + opacity + ')';
        if (color.startsWith('rgba')) return color;
        var rgb = this.hexToRgb(color);
        return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + opacity + ')';
    },

    applyOpacity: function(colors, opacity) {
        opacity = opacity || 0.5;
        var result = [];
        for (var i = 0; i < colors.length; i++) {
            if (colors[i].startsWith('rgba')) {
                result.push(colors[i]);
            } else {
                var rgb = this.hexToRgb(colors[i]);
                result.push('rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + opacity + ')');
            }
        }
        return result;
    },

    // ============================================================
    // 原有方法
    // ============================================================

    getGradient: function(name, count) {
        name = name || 'ryg';
        count = count || 10;
        var gradient = COLOR_PALETTES.gradient[name] || COLOR_PALETTES.gradient.ryg;
        if (count <= gradient.length) {
            return gradient.slice(0, count);
        }
        var colors = [];
        for (var i = 0; i < count; i++) {
            var pos = (i / (count - 1)) * (gradient.length - 1);
            var idx1 = Math.floor(pos);
            var idx2 = Math.min(idx1 + 1, gradient.length - 1);
            var frac = pos - idx1;
            var c1 = this.hexToRgb(gradient[idx1]);
            var c2 = this.hexToRgb(gradient[idx2]);
            var r = Math.round(c1.r + (c2.r - c1.r) * frac);
            var g = Math.round(c1.g + (c2.g - c1.g) * frac);
            var b = Math.round(c1.b + (c2.b - c1.b) * frac);
            colors.push(this.rgbToHex(r, g, b));
        }
        return colors;
    },

    getColor: function(index, palette) {
        palette = palette || 'academic';
        var colors = this.getPalette(palette);
        return colors[index % colors.length];
    },

    hexToRgb: function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    },

    rgbToHex: function(r, g, b) {
        var hexR = Math.round(r).toString(16);
        var hexG = Math.round(g).toString(16);
        var hexB = Math.round(b).toString(16);
        return '#' + (hexR.length === 1 ? '0' + hexR : hexR) +
                     (hexG.length === 1 ? '0' + hexG : hexG) +
                     (hexB.length === 1 ? '0' + hexB : hexB);
    },

    isLight: function(color) {
        var rgb = this.hexToRgb(color);
        var luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return luminance > 0.5;
    },

    getContrastColor: function(color) {
        return this.isLight(color) ? '#1a202c' : '#ffffff';
    },

    withOpacity: function(color, opacity) {
        opacity = opacity || 0.5;
        var rgb = this.hexToRgb(color);
        return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + opacity + ')';
    },

    darken: function(color, amount) {
        amount = amount || 20;
        var rgb = this.hexToRgb(color);
        var r = Math.max(0, rgb.r - amount);
        var g = Math.max(0, rgb.g - amount);
        var b = Math.max(0, rgb.b - amount);
        return this.rgbToHex(r, g, b);
    },

    lighten: function(color, amount) {
        amount = amount || 20;
        var rgb = this.hexToRgb(color);
        var r = Math.min(255, rgb.r + amount);
        var g = Math.min(255, rgb.g + amount);
        var b = Math.min(255, rgb.b + amount);
        return this.rgbToHex(r, g, b);
    }
};

// ============================================================
// 4. 导出到全局
// ============================================================
window.COLOR_PALETTES = COLOR_PALETTES;
window.ColorUtils = ColorUtils;
window.PALETTE_DISPLAY = PALETTE_DISPLAY;

window.getColors = function(name, count) {
    return ColorUtils.getPalette(name, count);
};
window.getGradient = function(name, count) {
    return ColorUtils.getGradient(name, count);
};

console.log('✅ BioDataTools 配色方案已加载');
console.log('   - ' + ColorUtils.getPaletteNames().length + ' 个调色板');
console.log('   - ' + Object.keys(COLOR_PALETTES.gradient).length + ' 个渐变色');
console.log('   - 支持透明度: getPaletteWithOpacity(name, count, opacity)');
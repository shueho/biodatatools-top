/**
 * BioDataTools 公共模块 v5.0
 * 使用 viewBox 实现缩放平移，颜色选择器用 class 控制
 */
// ==================== 工具函数 ====================
function throttle(fn, delay = 16) {
    let last = 0;
    return (...args) => {
        const now = Date.now();
        if (now - last >= delay) {
            last = now;
            fn.apply(this, args);
        }
    }
}

function downloadFile(content, filename, mimeType) {
    mimeType = mimeType || 'text/plain';
    var blob = new Blob([content], { type: mimeType });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}
function showMessage(msg) { alert(msg); }

// ==================== 配置管理器 ====================
var ConfigManager = function(defaultConfig) {
    this.defaultConfig = JSON.parse(JSON.stringify(defaultConfig));
    this.currentConfig = JSON.parse(JSON.stringify(defaultConfig));
};
ConfigManager.prototype._clone = function(obj) { return JSON.parse(JSON.stringify(obj)); };
ConfigManager.prototype.reset = function() { this.currentConfig = this._clone(this.defaultConfig); return this.currentConfig; };
ConfigManager.prototype.importFromJSON = function(jsonStr) {
    try { var imported = JSON.parse(jsonStr); this.currentConfig = this._deepMerge(this._clone(this.defaultConfig), imported); return this.currentConfig; } catch(e) { return null; }
};
ConfigManager.prototype.exportToJSON = function() { return JSON.stringify(this.currentConfig, null, 2); };
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

// ==================== 导出帮助 ====================
var ExportHelper = {
    exportSVG: function(svgElement, filename) {
        filename = filename || 'chart.svg';
        if (!svgElement) return;
        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(svgElement);
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        var blob = new Blob([source], { type: 'image/svg+xml' });
        this._download(blob, filename);
    },
    exportPNGFromSVG: function(svgElement, scale) {
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
    },
    exportPDFFromSVG: function(svgElement, filename, scale) {
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
                    var pdf = new jsPDF({ orientation: orientation, unit: 'mm', format: 'a4' });
                    var imgWidth = pdf.internal.pageSize.getWidth();
                    var imgHeight = (img.height * imgWidth) / img.width;
                    pdf.addImage(dataURL, 'PNG', 0, 0, imgWidth, imgHeight);
                    pdf.save(filename);
                    resolve();
                };
                img.onerror = reject;
            }).catch(reject);
        });
    },
    _download: function(blob, filename) {
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
};

// ==================== 状态持久化 ====================
var StateManager = function(storageKey) {
    this.storageKey = storageKey;
};
StateManager.prototype.saveState = function(data, config, palette, opacity) {
    var state = { data: data, config: config, palette: palette };
    if (opacity !== undefined) state.opacity = opacity;
    localStorage.setItem(this.storageKey, JSON.stringify(state));
};
StateManager.prototype.loadState = function() {
    var raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
};
StateManager.prototype.clearState = function() {
    localStorage.removeItem(this.storageKey);
};

// ==================== 数据管理器 ====================
var ChartDataManager = {
    init: function(storageKey, defaultData, defaultPalette) {
        defaultPalette = defaultPalette || 'academic';
        var stateManager = new StateManager(storageKey);
        var saved = stateManager.loadState();
        var data = saved && saved.data ? saved.data : JSON.parse(JSON.stringify(defaultData));
        var palette = saved && saved.palette ? saved.palette : defaultPalette;
        var opacity = saved && saved.opacity !== undefined ? saved.opacity : 0.85;
        var colors = ColorUtils.getPalette(palette, data.length);
        data.forEach(function(item, idx) {
            if (!item.color || !item.color.startsWith('#')) {
                item.color = colors[idx % colors.length];
            }
        });
        return { data: data, palette: palette, opacity: opacity, stateManager: stateManager };
    },
    updateTotal: function(data) {
        return data.reduce(function(sum, d) { return sum + (d.value || 0); }, 0);
    },
    toCSVText: function(data) {
        return data.map(function(item) { return item.name + '\t' + item.value; }).join('\n');
    },
    parseCSV: function(text, palette) {
        var lines = text.trim().split(/\r?\n/);
        var newData = [];
        var colors = ColorUtils.getPalette(palette || 'academic');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            var parts = line.split(/\t|,|\s+/);
            if (parts.length < 2) continue;
            var name = parts[0].trim();
            var value = parseFloat(parts[1]);
            if (isNaN(value) || value <= 0) continue;
            newData.push({ name: name, value: value, color: colors[newData.length % colors.length] });
        }
        return newData.length > 0 ? newData : null;
    },
    addRow: function(data, palette) {
        var colors = ColorUtils.getPalette(palette || 'academic', data.length + 1);
        var lang = LangManager ? LangManager.getLang() : 'en';
        data.push({ name: lang === 'en' ? 'New' : '新分类', value: 10, color: colors[data.length] });
        return data;
    },
    removeRow: function(data, idx) {
        if (data.length > 1) data.splice(idx, 1);
        return data;
    },
    switchPalette: function(data, paletteName) {
        var colors = ColorUtils.getPalette(paletteName, data.length);
        data.forEach(function(item, idx) { item.color = colors[idx % colors.length]; });
        return data;
    },
    exportToCSVFile: function(data, includeColor) {
        includeColor = includeColor !== undefined ? includeColor : false;
        var csv = "name\tvalue" + (includeColor ? "\tcolor" : "") + "\n";
        data.forEach(function(d) { csv += d.name + '\t' + d.value + (includeColor ? '\t' + d.color : '') + '\n'; });
        downloadFile(csv, 'chart_data.tsv', 'text/tsv');
    }
};

// ==================== 配置辅助 ====================
var ConfigHelper = {
    reset: function(config, defaultConfig, data, defaultPalette) {
        var newConfig = JSON.parse(JSON.stringify(defaultConfig));
        var colors = ColorUtils.getPalette(defaultPalette || 'academic', data.length);
        data.forEach(function(item, idx) { item.color = colors[idx % colors.length]; });
        return { config: newConfig, data: data, palette: defaultPalette || 'academic' };
    },
    exportJSON: function(config) { downloadFile(JSON.stringify(config, null, 2), 'chart_config.json', 'application/json'); },
    importJSON: function(file, defaultConfig, callback) {
        var reader = new FileReader();
        reader.onload = function(ev) {
            try {
                var imported = JSON.parse(ev.target.result);
                var newConfig = { ...defaultConfig, ...imported, margin: { ...defaultConfig.margin, ...imported.margin } };
                if (callback) callback(newConfig);
            } catch(err) { alert('Invalid config file'); }
        };
        reader.readAsText(file);
    }
};

// ==================== 图表导出快捷工具 ====================
var ChartExportHelper = {
    exportChart: function(chartDiv, format, filename) {
        filename = filename || 'chart';
        var svgElem = chartDiv.querySelector('svg');
        if (!svgElem) { alert('No SVG element'); return; }
        var originalViewBox = svgElem.getAttribute('viewBox');
        var w = svgElem.width.baseVal.value;
        var h = svgElem.height.baseVal.value;
        svgElem.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        switch(format) {
            case 'svg':
                ExportHelper.exportSVG(svgElem, filename + '.svg');
                break;
            case 'png':
                ExportHelper.exportPNGFromSVG(svgElem, 3).then(function(dataURL) {
                    var link = document.createElement('a');
                    link.download = filename + '.png';
                    link.href = dataURL;
                    link.click();
                }).catch(function(err) { alert('PNG export failed: ' + err.message); });
                break;
            case 'pdf':
                ExportHelper.exportPDFFromSVG(svgElem, filename + '.pdf', 3).catch(function(err) { alert('PDF export failed: ' + err.message); });
                break;
            default: alert('Unsupported format');
        }
        if (originalViewBox) {
            svgElem.setAttribute('viewBox', originalViewBox);
        } else {
            svgElem.removeAttribute('viewBox');
        }
    }
};

// ==================== 交互控制 ====================
var ChartInteraction = {
    makeDraggable: function(selection) {
        var drag = d3.drag()
            .on("start", function(event, d) { d3.select(this).raise().classed("dragging", true); })
            .on("drag", function(event, d) {
                var currentTransform = d3.select(this).attr("transform") || "";
                var match = currentTransform.match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/);
                var x = match ? parseFloat(match[1]) : 0;
                var y = match ? parseFloat(match[2]) : 0;
                x += event.dx;
                y += event.dy;
                d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
            })
            .on("end", function(event, d) { d3.select(this).classed("dragging", false); });
        selection.call(drag);
        selection.style("cursor", "move");
        return selection;
    }
};

// ==================== 图表渲染器（无边框） ====================
var ChartRenderer = {
    drawPie: function(container, data, config, transform, opacity, onSliceClick, onLegendDragEnd) {
        container.innerHTML = '';
        var t = transform || { k: 1, x: 0, y: 0 };
        var w = config.width, h = config.height;
        var margin = config.margin;
        var innerW = w - margin.left - margin.right;
        var innerH = h - margin.top - margin.bottom;
        var centerX = margin.left + innerW / 2;
        var centerY = margin.top + innerH / 2;
        var radius = Math.min(innerW, innerH) / 2 * 0.85;
        var innerRadius = radius * config.innerRadiusRatio;

        var svg = d3.select(container).append("svg")
            .attr("width", w)
            .attr("height", h)
            .style("background", "#fff");

        // 不再绘制任何边框或背景填充

        var g = svg.append("g");

        var validData = data.filter(function(d) { return d.value > 0; });
        if (validData.length === 0) {
            svg.append("text").attr("x", w/2).attr("y", h/2).attr("text-anchor", "middle").text("无数据");
            return { svg: svg, g: g };
        }

        var total = validData.reduce(function(s, d) { return s + d.value; }, 0);
        var colorScale = d3.scaleOrdinal()
            .domain(validData.map(function(d) { return d.name; }))
            .range(validData.map(function(d) {
                return ColorUtils.getColorWithOpacity(d.color, opacity);
            }));

        var pie = d3.pie().value(function(d) { return d.value; }).sort(null);
        if (config.direction === "counterclockwise") {
            pie = pie.startAngle(Math.PI * 2).endAngle(0);
        }
        var arcs = pie(validData);
        var arcGen = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(radius)
            .padAngle(0.01);

        var pieGroup = g.append("g")
            .attr("transform", "translate(" + centerX + "," + centerY + ")");

        var slices = pieGroup.selectAll("path")
            .data(arcs)
            .join("path")
            .attr("d", arcGen)
            .attr("fill", function(d) { return colorScale(d.data.name); })
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer");

        slices.each(function(d, i) {
            var path = this;
            path.addEventListener('click', function(event) {
                event.stopPropagation();
                var idx = i;
                console.log("✅ 扇形被点击！索引:", idx);
                if (typeof onSliceClick === 'function') {
                    onSliceClick(idx, d.data);
                }
            });
        });

        // ---- 标签 ----
        var labelRadius = radius * Math.min(config.labelRadiusRatio, 0.95);
        var labelArc = d3.arc().innerRadius(labelRadius).outerRadius(labelRadius);
        var outerArc = d3.arc().innerRadius(radius).outerRadius(radius);
        var useLeaderLine = config.enableLeaderLine;

        arcs.forEach(function(d) {
            var percentVal = d.data.value / total * 100;
            var needLeader = useLeaderLine && percentVal < 8;
            var centroid = labelArc.centroid(d);
            var angle = Math.atan2(centroid[1], centroid[0]);
            var cosA = Math.cos(angle), sinA = Math.sin(angle);

            if (needLeader) {
                var startPoint = outerArc.centroid(d);
                var x0 = startPoint[0], y0 = startPoint[1];
                var radialPoint = [x0 + cosA * 15, y0 + sinA * 15];
                var endPoint = [radialPoint[0] + (cosA > 0 ? 65 : -65), radialPoint[1]];

                pieGroup.append("polyline")
                    .attr("points", startPoint[0] + ',' + startPoint[1] + ' ' +
                        radialPoint[0] + ',' + radialPoint[1] + ' ' +
                        endPoint[0] + ',' + endPoint[1])
                    .attr("class", "label-line")
                    .attr("fill", "none")
                    .attr("stroke", "#888")
                    .attr("stroke-width", 1.2)
                    .attr("stroke-dasharray", "3 2");
                pieGroup.append("circle")
                    .attr("cx", startPoint[0])
                    .attr("cy", startPoint[1])
                    .attr("class", "leader-anchor")
                    .attr("r", 3)
                    .attr("fill", "#e11d48")
                    .attr("stroke", "white")
                    .attr("stroke-width", 1);

                var textAnchor = cosA > 0 ? "start" : "end";
                var xOffset = cosA > 0 ? 6 : -6;
                var baseX = endPoint[0] + xOffset;
                var baseY = endPoint[1] + 4;
                var labelText = "";
                if (config.showCategory && config.showPercent) {
                    labelText = d.data.name + " (" + percentVal.toFixed(1) + "%)";
                } else if (config.showCategory) {
                    labelText = d.data.name;
                } else if (config.showPercent) {
                    labelText = percentVal.toFixed(1) + "%";
                }
                if (labelText) {
                    pieGroup.append("text")
                        .attr("x", baseX)
                        .attr("y", baseY)
                        .attr("dy", "0.35em")
                        .attr("text-anchor", textAnchor)
                        .style("font-size", (config.showCategory ? config.categoryFontSize : config.percentFontSize) + "px")
                        .style("font-family", config.fontFamily)
                        .style("fill", "#2c3e50")
                        .text(labelText);
                }
            } else {
                if (config.showCategory && config.showPercent) {
                    if (config.showCategory) {
                        pieGroup.append("text")
                            .attr("x", centroid[0])
                            .attr("y", centroid[1] - 8)
                            .attr("text-anchor", "middle")
                            .style("font-size", config.categoryFontSize + "px")
                            .style("font-family", config.fontFamily)
                            .style("font-weight", config.categoryBold ? "bold" : "normal")
                            .style("font-style", config.categoryItalic ? "italic" : "normal")
                            .style("fill", "#334155")
                            .text(d.data.name);
                    }
                    if (config.showPercent) {
                        pieGroup.append("text")
                            .attr("x", centroid[0])
                            .attr("y", centroid[1] + 8)
                            .attr("text-anchor", "middle")
                            .style("font-size", config.percentFontSize + "px")
                            .style("font-family", config.fontFamily)
                            .style("font-weight", config.percentBold ? "bold" : "normal")
                            .style("font-style", config.percentItalic ? "italic" : "normal")
                            .style("fill", "#1e293b")
                            .text(percentVal.toFixed(1) + "%");
                    }
                } else {
                    var text = "";
                    var fontSize = 14;
                    if (config.showCategory) {
                        text = d.data.name;
                        fontSize = config.categoryFontSize;
                    } else if (config.showPercent) {
                        text = percentVal.toFixed(1) + "%";
                        fontSize = config.percentFontSize;
                    }
                    if (text) {
                        pieGroup.append("text")
                            .attr("x", centroid[0])
                            .attr("y", centroid[1])
                            .attr("dy", "0.35em")
                            .attr("text-anchor", "middle")
                            .style("font-size", fontSize + "px")
                            .style("font-family", config.fontFamily)
                            .style("fill", "#1e293b")
                            .text(text);
                    }
                }
            }
        });

        // ---- 标题 ----
        var titleEl = null;
        if (config.showTitle && config.title) {
            var titleY = margin.top + 30;
            titleEl = svg.append("text")
                .attr("class", "chart-title draggable")
                .attr("x", w / 2)
                .attr("y", titleY)
                .attr("text-anchor", "middle")
                .style("font-size", config.titleFontSize + "px")
                .style("font-family", config.fontFamily)
                .style("font-weight", config.titleBold ? "bold" : "normal")
                .style("font-style", config.titleItalic ? "italic" : "normal")
                .style("fill", "#0f172a")
                .text(config.title);
            ChartInteraction.makeDraggable(titleEl);
        }

        // ---- 图例 ----
        var legendEl = null;
        if (config.showLegend) {
            var lx = Math.min(1.1, Math.max(0, config.legendX));
            var ly = Math.min(1.1, Math.max(0, config.legendY));
            var legendAbsX = margin.left + innerW * lx;
            var legendAbsY = margin.top + innerH * ly;
            legendEl = svg.append("g")
                .attr("class", "chart-legend draggable")
                .attr("transform", "translate(" + legendAbsX + "," + legendAbsY + ")");

            var yOffset = 0;
            if (config.showLegendTitle && config.legendTitle) {
                legendEl.append("text")
                    .attr("x", 0)
                    .attr("y", yOffset)
                    .style("font-size", config.legendTitleFontSize + "px")
                    .style("font-family", config.fontFamily)
                    .style("font-weight", config.legendTitleBold ? "bold" : "normal")
                    .style("font-style", config.legendTitleItalic ? "italic" : "normal")
                    .style("fill", "#1f4068")
                    .text(config.legendTitle);
                var titleHeight = config.legendTitleFontSize + 2;
                yOffset += titleHeight + (config.legendTitleSpacing || 0);
            }
            var markerSize = config.legendMarkerSize || 12;
            var itemSpacing = config.legendItemSpacing || 22;
            validData.forEach(function(d, i) {
                var legItem = legendEl.append("g")
                    .attr("transform", "translate(0," + (yOffset + i * itemSpacing) + ")");
                legItem.append("rect")
                    .attr("width", markerSize)
                    .attr("height", markerSize)
                    .attr("fill", colorScale(d.name))
                    .attr("rx", 2);
                legItem.append("text")
                    .attr("x", markerSize + 6)
                    .attr("y", markerSize / 2)
                    .attr("dy", "0.35em")
                    .style("font-size", config.legendFontSize + "px")
                    .style("font-family", config.fontFamily)
                    .style("font-weight", config.legendBold ? "bold" : "normal")
                    .style("font-style", config.legendItalic ? "italic" : "normal")
                    .style("fill", "#334155")
                    .text(d.name);
            });

            if (onLegendDragEnd) {
                var drag = d3.drag()
                    .on("drag", function(event) {
                        var currentTransform = d3.select(this).attr("transform") || "";
                        var match = currentTransform.match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/);
                        var x = match ? parseFloat(match[1]) : 0;
                        var y = match ? parseFloat(match[2]) : 0;
                        x += event.dx;
                        y += event.dy;
                        d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
                    })
                    .on("end", function(event) {
                        var currentTransform = d3.select(this).attr("transform") || "";
                        var match = currentTransform.match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/);
                        if (match) {
                            var x = parseFloat(match[1]);
                            var y = parseFloat(match[2]);
                            var newLx = (x - margin.left) / innerW;
                            var newLy = (y - margin.top) / innerH;
                            onLegendDragEnd(Math.min(1.1, Math.max(0, newLx)), Math.min(1.1, Math.max(0, newLy)));
                        }
                    });
                legendEl.call(drag);
                legendEl.style("cursor", "move");
            } else {
                ChartInteraction.makeDraggable(legendEl);
            }
        }

        return { svg: svg, g: g, slices: slices, titleEl: titleEl, legendEl: legendEl };
    }
};

// ==================== Shape Utilities ====================
var ShapeUtils = {
    // 线条虚线模式
    dashStyles: {
        solid: null,
        dashed: [6, 4],
        dotted: [2, 3],
        dashdot: [8, 4, 2, 4]
    },

    // 点形状生成函数 (返回 SVG 路径或标记)
    getPointPath: function(shape, size) {
        var s = size || 5;
        var r = s / 2;
        switch(shape) {
            case 'circle': return d3.symbol().type(d3.symbolCircle).size(s * s)();
            case 'square': return d3.symbol().type(d3.symbolSquare).size(s * s)();
            case 'diamond': return d3.symbol().type(d3.symbolDiamond).size(s * s)();
            case 'triangle': return d3.symbol().type(d3.symbolTriangle).size(s * s)();
            case 'cross': return d3.symbol().type(d3.symbolCross).size(s * s)();
            default: return d3.symbol().type(d3.symbolCircle).size(s * s)();
        }
    },

    getPointShapeOptions: function(lang) {
        lang = lang || 'en';
        var labels = lang === 'en' ? 
            {circle:'Circle', square:'Square', diamond:'Diamond', triangle:'Triangle', cross:'Cross'} :
            {circle:'圆形', square:'方形', diamond:'菱形', triangle:'三角形', cross:'十字'};
        return [
            { value: 'circle', label: labels.circle },
            { value: 'square', label: labels.square },
            { value: 'diamond', label: labels.diamond },
            { value: 'triangle', label: labels.triangle },
            { value: 'cross', label: labels.cross }
        ];
    },

    getLineStyleOptions: function(lang) {
        lang = lang || 'en';
        var labels = lang === 'en' ?
            {solid:'Solid', dashed:'Dashed', dotted:'Dotted', dashdot:'Dash-Dot'} :
            {solid:'实线', dashed:'虚线', dotted:'点线', dashdot:'点划线'};
        return [
            { value: 'solid', label: labels.solid },
            { value: 'dashed', label: labels.dashed },
            { value: 'dotted', label: labels.dotted },
            { value: 'dashdot', label: labels.dashdot }
        ];
    }
};


// ==================== 导出到全局 ====================
window.ConfigManager = ConfigManager;
window.ExportHelper = ExportHelper;
window.StateManager = StateManager;
window.ChartDataManager = ChartDataManager;
window.ConfigHelper = ConfigHelper;
window.ChartExportHelper = ChartExportHelper;
window.ChartInteraction = ChartInteraction;
window.ChartRenderer = ChartRenderer;
window.downloadFile = downloadFile;
window.showMessage = showMessage;
window.ShapeUtils = ShapeUtils;


console.log('✅ BioDataTools 公共模块 v5.0 已加载（无边框，缩放修正）');
(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';

    const T = {
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectCols: EN ? '❌ Please select protein and domains columns' : '❌ 请选择蛋白列与结构域数据列',
        longColsMissing: EN ? '❌ Long format requires start/end columns' : '❌ 长格式需要指定起始/终止列',
        noValid: EN ? '❌ Could not generate valid plot data' : '❌ 未能生成有效绘图数据',
        noDataPlaceholder: EN ? '— Please import data first —' : '— 请先导入数据 —',
        colorEmpty: EN ? 'Domain colors will appear here' : '结构域颜色将在此处显示',
        unnamed: EN ? '(unnamed)' : '(未命名)',
        none: EN ? '(none)' : '（无）'
    };

    const EX_WIDE =
        'Protein\tLength\tDomains\n' +
        'Protein_1\t520\tSP=1-25|TM=120-155|Kinase=200-420\n' +
        'Protein_2\t480\tSP=1-22|TM=90-120|SH2=180-260|Kinase=280-450\n' +
        'Protein_3\t600\tSP=1-28|EGF=80-140|EGF=150-210|TM=380-420|Kinase=440-580\n' +
        'Protein_4\t350\tTM=50-85|SH3=120-180|SH2=200-280\n' +
        'Protein_5\t750\tSP=1-30|Ig=60-150|Ig=160-250|Ig=260-350|TM=500-540|Kinase=560-730';

    const EX_LONG =
        'Protein\tStart\tEnd\tName\tLength\n' +
        'Protein_1\t1\t25\tSP\t520\n' +
        'Protein_1\t120\t155\tTM\t520\n' +
        'Protein_1\t200\t420\tKinase\t520\n' +
        'Protein_2\t1\t22\tSP\t480\n' +
        'Protein_2\t90\t120\tTM\t480\n' +
        'Protein_2\t180\t260\tSH2\t480\n' +
        'Protein_2\t280\t450\tKinase\t480\n' +
        'Protein_3\t1\t28\tSP\t600\n' +
        'Protein_3\t80\t140\tEGF\t600\n' +
        'Protein_3\t150\t210\tEGF\t600\n' +
        'Protein_3\t380\t420\tTM\t600\n' +
        'Protein_3\t440\t580\tKinase\t600';

    function parseDomainString(raw) {
        if (raw == null || raw === '') return [];
        const out = [];
        String(raw).split(/[|;]/).forEach(seg => {
            const s = seg.trim();
            if (!s) return;
            const eq = s.indexOf('=');
            let name = '', rangePart = s;
            if (eq >= 0) { name = s.slice(0, eq).trim(); rangePart = s.slice(eq + 1).trim(); }
            const m = rangePart.match(/^(-?\d+(?:\.\d+)?)\s*[-~]\s*(-?\d+(?:\.\d+)?)$/);
            if (!m) return;
            let a = Number(m[1]), b = Number(m[2]);
            if (!Number.isFinite(a) || !Number.isFinite(b)) return;
            if (a > b) { const t = a; a = b; b = t; }
            out.push({ start: a, end: b, name });
        });
        return out;
    }

    function fillRoleSelects(app) {
        const s = app.state;
        const ids = ['proteinColSel', 'lengthColSel', 'domainsColSel', 'startColSel', 'endColSel', 'nameColSel'];
        if (!s.headers.length) {
            ids.forEach(id => {
                const el = app.$(id);
                if (!el) return;
                el.innerHTML = '<option value="">' + T.noDataPlaceholder + '</option>';
                el.disabled = true;
            });
            return;
        }
        ids.forEach(id => { const el = app.$(id); if (el) el.disabled = false; });

        const opts = (cur, allowEmpty) =>
            (allowEmpty ? '<option value="">' + T.none + '</option>' : '') +
            s.headers.map(h => `<option value="${PC.escapeHtml(h)}" ${h === cur ? 'selected' : ''}>${PC.escapeHtml(h)}</option>`).join('');

        const setVal = (id, cur, allowEmpty) => {
            const el = app.$(id);
            if (el) el.innerHTML = opts(cur, allowEmpty);
        };
        setVal('proteinColSel', s.roles.protein, false);
        setVal('lengthColSel', s.roles.length, true);
        setVal('domainsColSel', s.roles.domains, false);
        setVal('startColSel', s.roles.start, true);
        setVal('endColSel', s.roles.end, true);
        setVal('nameColSel', s.roles.name, true);
    }

    function buildRows(app) {
        const s = app.state;
        if (!s.roles.protein) return [];
        const isLong = s.dataFormat === 'long';
        const map = new Map();
        const order = [];

        s.data.forEach(row => {
            const key = String(row[s.roles.protein] == null ? '' : row[s.roles.protein]).trim();
            if (!key) return;
            if (!map.has(key)) {
                map.set(key, { name: key, domains: [], length: null });
                order.push(key);
            }
            const rec = map.get(key);

            if (isLong) {
                if (!s.roles.start || !s.roles.end) return;
                const st = parseFloat(row[s.roles.start]);
                const en = parseFloat(row[s.roles.end]);
                if (Number.isFinite(st) && Number.isFinite(en)) {
                    rec.domains.push({
                        start: Math.min(st, en),
                        end: Math.max(st, en),
                        name: s.roles.name ? String(row[s.roles.name] || '').trim() : ''
                    });
                }
            } else {
                if (!s.roles.domains) return;
                parseDomainString(row[s.roles.domains]).forEach(d => rec.domains.push(d));
            }

            if (s.roles.length) {
                const len = parseFloat(row[s.roles.length]);
                if (Number.isFinite(len) && len > 0) {
                    if (rec.length == null || len > rec.length) rec.length = len;
                }
            }
        });

        let rows = order.map(k => map.get(k));
        rows.forEach(r => {
            let maxEnd = 0;
            r.domains.forEach(d => { if (d.end > maxEnd) maxEnd = d.end; });
            r.dataMax = r.length != null ? Math.max(r.length, maxEnd) : maxEnd;
        });

        const dir = s.sortDir === 'desc' ? -1 : 1;
        if (s.sortBy === 'name') rows.sort((a, b) => String(a.name).localeCompare(String(b.name)) * dir);
        else if (s.sortBy === 'length') rows.sort((a, b) => (a.dataMax - b.dataMax) * dir);
        else if (s.sortBy === 'count') rows.sort((a, b) => (a.domains.length - b.domains.length) * dir);

        return rows;
    }

    function collectDomainNames(rows) {
        const seen = new Set(); const out = [];
        rows.forEach(r => r.domains.forEach(d => {
            const k = d.name || T.unnamed;
            if (!seen.has(k)) { seen.add(k); out.push(k); }
        }));
        return out;
    }

    function refreshColorPanel(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const s = app.state;
        const rows = buildRows(app);
        const names = collectDomainNames(rows);
        if (!names.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const baseColors = app.resolvePaletteColors(names.length);
        PC.renderColorAssignment(container, {
            items: names.map((n, i) => ({ name: n, color: s.customColors[n] || baseColors[i] })),
            onChange: (idx, c) => {
                s.customColors[names[idx]] = c;
                if (s.currentSvg) app.drawChart();
            },
            onResetAll: () => {
                s.customColors = {};
                refreshColorPanel(app);
                if (s.currentSvg) app.drawChart();
            }
        });
    }

    function drawDomainShape(parent, o) {
        const { x, y, w, h, cornerRadius, fill, stroke, strokeWidth, opacity } = o;
        const rx = Math.max(0, Math.min(cornerRadius || 0, Math.min(w, h) / 2));
        const el = parent.append('rect')
            .attr('x', x).attr('y', y)
            .attr('width', Math.max(0.5, w))
            .attr('height', Math.max(0.5, h));
        if (rx > 0) el.attr('rx', rx).attr('ry', rx);
        el.attr('fill', fill);
        if (opacity != null) el.attr('opacity', opacity);
        if (stroke && strokeWidth > 0) {
            el.attr('stroke', stroke);
            el.attr('stroke-width', strokeWidth);
        }
        return el;
    }

    function drawDomainMask(parent, o) {
        const { x, y, w, h } = o;
        parent.append('rect')
            .attr('x', x).attr('y', y)
            .attr('width', Math.max(0.5, w))
            .attr('height', Math.max(0.5, h))
            .attr('fill', '#ffffff')
            .attr('pointer-events', 'none');
    }

    function drawDomainLabel(parent, o) {
        const { x, y, w, h, text, style, rotate } = o;
        const fs = style.fontSize;
        const availW = rotate ? h : w;
        const availH = rotate ? w : h;
        if (fs > availH * 0.9) return;

        let display = text;
        if (PC.estTextWidth(display, fs) > availW - 4) {
            if (!style.truncate) return;
            let t = text;
            while (t.length > 1 && PC.estTextWidth(t + '…', fs) > availW - 4) t = t.slice(0, -1);
            display = t.length < text.length ? t + '…' : text;
            if (PC.estTextWidth(display, fs) > availW - 4) return;
        }

        const el = parent.append('text')
            .attr('x', x).attr('y', y)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', fs)
            .attr('font-weight', style.bold ? 'bold' : 'normal')
            .attr('font-style', style.italic ? 'italic' : 'normal')
            .attr('fill', style.color)
            .attr('pointer-events', 'none')
            .text(display);
        if (rotate) el.attr('transform', `rotate(-90 ${x} ${y})`);
    }

    function drawChart(app) {
        const s = app.state;
        app.toolbarTip.textContent = '';
        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.protein) { app.showTip('msgTip3', T.selectCols, 'error'); return; }
        if (s.dataFormat === 'long' && (!s.roles.start || !s.roles.end)) {
            app.showTip('msgTip3', T.longColsMissing, 'error'); return;
        }
        if (s.dataFormat !== 'long' && !s.roles.domains) {
            app.showTip('msgTip3', T.selectCols, 'error'); return;
        }

        const rows = buildRows(app);
        if (!rows.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const p = PC.readCommonParams(app, { width: 900, height: 600 });
        p.direction = s.barDirection || 'horizontal';

        const axisCfg = s.axis;
        axisCfg.x.fontFamily = p.fontFamily;
        axisCfg.y.fontFamily = p.fontFamily;

        const num = (id, fb) => {
            const el = app.$(id);
            if (!el) return fb;
            const v = parseFloat(el.value);
            return Number.isFinite(v) ? v : fb;
        };
        const chk = (id, fb) => {
            const el = app.$(id);
            return el ? el.checked : fb;
        };
        const val = (id, fb) => {
            const el = app.$(id);
            return el ? el.value : fb;
        };

        const ds = {
            cornerRadius: num('domainCorner', 4),
            strokeColor: val('domainStrokeColor', '#ffffff'),
            strokeWidth: num('domainStrokeWidth', 0.5),
            opacity: num('domainOpacity', 0.9)
        };
        s.domainStyle = ds;

        const bb = {
            show: chk('backboneShow', true),
            color: val('backboneColor', '#888888'),
            width: num('backboneWidth', 1),
            dash: chk('backboneDash', false),
            endMode: val('backboneEnd', 'global')
        };
        s.backboneStyle = bb;

        const lb = {
            show: chk('domainLabelShow', true),
            fontSize: num('domainLabelFontSize', 10),
            color: val('domainLabelColor', '#ffffff'),
            bold: chk('domainLabelBold', false),
            italic: chk('domainLabelItalic', false),
            truncate: chk('domainLabelTruncate', true)
        };
        s.labelStyle = lb;

        const barRatio = Math.max(0.1, Math.min(1, num('barHeightRatio', 0.65)));

        let maxEnd = 0;
        rows.forEach(r => { if (r.dataMax > maxEnd) maxEnd = r.dataMax; });
        if (maxEnd <= 0) maxEnd = 100;

        const isH = p.direction === 'horizontal';
        const valCfg = isH ? axisCfg.x : axisCfg.y;
        const catCfg = isH ? axisCfg.y : axisCfg.x;
        const valDomain = PlotAxis.resolveDomain(valCfg, [0, maxEnd]);
        const catOrder = rows.map(r => r.name);

        const margin = 30;
        const areaX = margin, areaY = margin;
        const areaW = p.width - 2 * margin;
        const areaH = p.height - 2 * margin;

        const valTickFont = valCfg.tickValueShow ? valCfg.tickFontSize : 0;
        const valTitleFont = (valCfg.titleShow && valCfg.titleContent) ? valCfg.titleFontSize + 8 : 0;
        const catTickFont = catCfg.tickValueShow ? catCfg.tickFontSize : 0;
        const catTitleFont = (catCfg.titleShow && catCfg.titleContent) ? catCfg.titleFontSize + 8 : 0;

        let leftPad, bottomPad;
        if (isH) {
            let maxCatW = 0;
            catOrder.forEach(c => {
                const w = PC.estTextWidth(c, catCfg.tickFontSize || 12);
                if (w > maxCatW) maxCatW = w;
            });
            leftPad = Math.min(maxCatW + 12, areaW * 0.4) + catTitleFont + 10;
            bottomPad = valTickFont + 12 + valTitleFont + 10;
        } else {
            leftPad = valTickFont + 10 + valTitleFont + 10;
            bottomPad = catTickFont + 12 + catTitleFont + 10;
        }
        const rightPad = 40;
        const topPad = 20;

        const plotX = areaX + leftPad;
        const plotY = areaY + topPad;
        const plotW = Math.max(20, areaW - leftPad - rightPad);
        const plotH = Math.max(20, areaH - topPad - bottomPad);

        let valScale, catScale;
        if (isH) {
            valScale = d3.scaleLinear().domain(valDomain).range([plotX, plotX + plotW]).nice();
            catScale = d3.scaleBand().domain(catOrder).range([plotY, plotY + plotH]).paddingInner(0.1);
        } else {
            valScale = d3.scaleLinear().domain(valDomain).range([plotY + plotH, plotY]).nice();
            catScale = d3.scaleBand().domain(catOrder).range([plotX, plotX + plotW]).paddingInner(0.1);
        }

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: p.width, height: p.height,
            fontFamily: p.fontFamily, border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        if (valCfg.gridShow) {
            const gridG = svg.append('g').attr('class', 'grid grid-val');
            const ticks = valScale.ticks ? valScale.ticks() : valScale.domain();
            ticks.forEach(t => {
                const pos = Math.round(valScale(t)) + 0.5;
                if (!isFinite(pos)) return;
                const line = gridG.append('line')
                    .attr('stroke', valCfg.gridColor)
                    .attr('stroke-dasharray', valCfg.gridDash)
                    .attr('stroke-width', 1);
                if (isH) line.attr('x1', pos).attr('x2', pos).attr('y1', plotY).attr('y2', plotY + plotH);
                else     line.attr('x1', plotX).attr('x2', plotX + plotW).attr('y1', pos).attr('y2', pos);
            });
        }
        if (catCfg.gridShow) {
            const gridG = svg.append('g').attr('class', 'grid grid-cat');
            catOrder.forEach(c => {
                const pos = Math.round(catScale(c) + catScale.bandwidth() / 2) + 0.5;
                if (!isFinite(pos)) return;
                const line = gridG.append('line')
                    .attr('stroke', catCfg.gridColor)
                    .attr('stroke-dasharray', catCfg.gridDash)
                    .attr('stroke-width', 1);
                if (isH) line.attr('x1', plotX).attr('x2', plotX + plotW).attr('y1', pos).attr('y2', pos);
                else     line.attr('x1', pos).attr('x2', pos).attr('y1', plotY).attr('y2', plotY + plotH);
            });
        }

        const names = collectDomainNames(rows);
        const baseColors = app.resolvePaletteColors(Math.max(1, names.length));
        const colorOf = (name) => {
            const key = name || T.unnamed;
            const idx = names.indexOf(key);
            if (idx < 0) return '#cccccc';
            return s.customColors[key] || baseColors[idx] || '#cccccc';
        };

        const barsG = svg.append('g').attr('class', 'domains');

        rows.forEach(r => {
            const catPos = catScale(r.name);
            if (!isFinite(catPos)) return;
            const catCenter = catPos + catScale.bandwidth() / 2;
            const barThick = catScale.bandwidth() * barRatio;

            if (bb.show && maxEnd > 0) {
                const backboneEnd = (bb.endMode === 'self') ? r.dataMax : maxEnd;
                const startPos = valScale(0);
                const endPos = valScale(backboneEnd);
                if (isFinite(startPos) && isFinite(endPos)) {
                    const line = barsG.append('line')
                        .attr('stroke', bb.color)
                        .attr('stroke-width', bb.width)
                        .attr('pointer-events', 'none');
                    if (bb.dash) line.attr('stroke-dasharray', '4 3');
                    if (isH) line.attr('x1', startPos).attr('x2', endPos).attr('y1', catCenter).attr('y2', catCenter);
                    else     line.attr('y1', startPos).attr('y2', endPos).attr('x1', catCenter).attr('x2', catCenter);
                }
            }

            r.domains.forEach(d => {
                const startPos = valScale(d.start);
                const endPos = valScale(d.end);
                if (!isFinite(startPos) || !isFinite(endPos)) return;
                const pos1 = Math.min(startPos, endPos);
                const pos2 = Math.max(startPos, endPos);
                const fill = colorOf(d.name);
                const needMask = bb.show && ds.opacity < 1;

                if (isH) {
                    const x = pos1, y = catCenter - barThick / 2;
                    const w = pos2 - pos1, h = barThick;
                    if (needMask) drawDomainMask(barsG, { x, y, w, h });
                    drawDomainShape(barsG, {
                        x, y, w, h, cornerRadius: ds.cornerRadius,
                        fill, stroke: ds.strokeColor, strokeWidth: ds.strokeWidth, opacity: ds.opacity
                    });
                    if (lb.show && d.name) {
                        drawDomainLabel(barsG, { x: x + w / 2, y: catCenter, w, h, text: d.name, style: lb, rotate: false });
                    }
                } else {
                    const x = catCenter - barThick / 2, y = pos1;
                    const w = barThick, h = pos2 - pos1;
                    if (needMask) drawDomainMask(barsG, { x, y, w, h });
                    drawDomainShape(barsG, {
                        x, y, w, h, cornerRadius: ds.cornerRadius,
                        fill, stroke: ds.strokeColor, strokeWidth: ds.strokeWidth, opacity: ds.opacity
                    });
                    if (lb.show && d.name) {
                        drawDomainLabel(barsG, { x: catCenter, y: y + h / 2, w, h, text: d.name, style: lb, rotate: true });
                    }
                }
            });
        });

        const catAxisFn = isH ? d3.axisLeft(catScale) : d3.axisBottom(catScale);
        const catAxisG = svg.append('g').attr('class', isH ? 'y-axis' : 'x-axis');
        if (isH) catAxisG.attr('transform', `translate(${plotX},0)`).call(catAxisFn);
        else     catAxisG.attr('transform', `translate(0,${plotY + plotH})`).call(catAxisFn);
        catAxisG.selectAll('.tick').attr('transform', d => {
            const c = Math.round(catScale(d) + catScale.bandwidth() / 2) + 0.5;
            return isH ? `translate(0,${c})` : `translate(${c},0)`;
        });
        PlotAxis.applyAxis(catAxisG, Object.assign({}, catCfg, { tickShow: false, tickLength: 0 }), isH ? 'left' : 'bottom');

        const valAxisFn = isH ? d3.axisBottom(valScale) : d3.axisLeft(valScale);
        const valTicks = PlotAxis.resolveTicks(valCfg, valScale);
        if (valTicks && valTicks.length) valAxisFn.tickValues(valTicks);
        const valAxisG = svg.append('g').attr('class', isH ? 'x-axis' : 'y-axis');
        if (isH) valAxisG.attr('transform', `translate(0,${plotY + plotH})`).call(valAxisFn);
        else     valAxisG.attr('transform', `translate(${plotX},0)`).call(valAxisFn);
        valAxisG.selectAll('.tick').attr('transform', d => {
            const pos = Math.round(valScale(d)) + 0.5;
            return isH ? `translate(${pos},0)` : `translate(0,${pos})`;
        });
        PlotAxis.applyAxis(valAxisG, valCfg, isH ? 'bottom' : 'left');

        if (catCfg.titleShow && catCfg.titleContent) {
            if (isH) {
                svg.append('text')
                    .attr('transform', `translate(${plotX - leftPad + 12},${plotY + plotH / 2}) rotate(-90)`)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', catCfg.titleFontSize)
                    .attr('font-weight', catCfg.titleBold ? 'bold' : 'normal')
                    .attr('font-style', catCfg.titleItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(catCfg.titleContent);
            } else {
                svg.append('text')
                    .attr('x', plotX + plotW / 2)
                    .attr('y', plotY + plotH + bottomPad - 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', catCfg.titleFontSize)
                    .attr('font-weight', catCfg.titleBold ? 'bold' : 'normal')
                    .attr('font-style', catCfg.titleItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(catCfg.titleContent);
            }
        }
        if (valCfg.titleShow && valCfg.titleContent) {
            if (isH) {
                svg.append('text')
                    .attr('x', plotX + plotW / 2)
                    .attr('y', plotY + plotH + bottomPad - 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', valCfg.titleFontSize)
                    .attr('font-weight', valCfg.titleBold ? 'bold' : 'normal')
                    .attr('font-style', valCfg.titleItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(valCfg.titleContent);
            } else {
                svg.append('text')
                    .attr('transform', `translate(${plotX - leftPad + 12},${plotY + plotH / 2}) rotate(-90)`)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', valCfg.titleFontSize)
                    .attr('font-weight', valCfg.titleBold ? 'bold' : 'normal')
                    .attr('font-style', valCfg.titleItalic ? 'italic' : 'normal')
                    .attr('fill', '#333')
                    .text(valCfg.titleContent);
            }
        }

        PlotAxis.drawFrameAndRefLines(svg, {
            plotX, plotY, plotW, plotH,
            xScale: isH ? valScale : catScale,
            yScale: isH ? catScale : valScale,
            axisCfg: axisCfg
        });

        if (p.showLegend && names.length) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: names.map(n => ({ name: n, percent: null })),
                colors: names.map(n => colorOf(n)),
                shape: 'rect',
                labelFormatter: it => it.name
            });
        }
        PlotAxis.applyFontFamily(svg, p.fontFamily);

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    function renderDataFormatPanel(app) {
        const container = app.$('dataFormatPanelContainer');
        if (!container) return;
        const s = app.state;
        container.innerHTML = `
          <div class="param-panel">
            <div class="param-panel-title">${EN ? 'Data Format' : '数据格式'}</div>
            <div class="mode-tabs">
              <label><input type="radio" name="dataFormat" value="wide" ${s.dataFormat !== 'long' ? 'checked' : ''}> ${EN ? 'Wide: domains string' : '宽格式：结构域字符串列'}</label>
              <label><input type="radio" name="dataFormat" value="long" ${s.dataFormat === 'long' ? 'checked' : ''}> ${EN ? 'Long: start/end/name' : '长格式：起始/终止/名称列'}</label>
            </div>
            <div class="param-grid cols-4">
              <div class="param-item" id="domainsColItem" style="${s.dataFormat === 'long' ? 'display:none;' : ''}">
                <label>${EN ? 'Domains column' : '结构域字符串列'}</label>
                <select id="domainsColSel" disabled><option value="">${T.noDataPlaceholder}</option></select>
              </div>
              <div class="param-item" id="startColItem" style="${s.dataFormat === 'long' ? '' : 'display:none;'}">
                <label>${EN ? 'Start column' : '起始列'}</label>
                <select id="startColSel" disabled><option value="">${T.noDataPlaceholder}</option></select>
              </div>
              <div class="param-item" id="endColItem" style="${s.dataFormat === 'long' ? '' : 'display:none;'}">
                <label>${EN ? 'End column' : '终止列'}</label>
                <select id="endColSel" disabled><option value="">${T.noDataPlaceholder}</option></select>
              </div>
              <div class="param-item" id="nameColItem" style="${s.dataFormat === 'long' ? '' : 'display:none;'}">
                <label>${EN ? 'Name column' : '名称列'}</label>
                <select id="nameColSel" disabled><option value="">${T.noDataPlaceholder}</option></select>
              </div>
            </div>
            <div style="font-size:12px;color:#999;margin-top:6px;">
              ${EN
                ? 'Wide: <code>Name=Start-End|Name=Start-End</code>'
                : '宽格式：<code>名称=起始-终止|名称=起始-终止</code>'}
            </div>
          </div>
        `;

        container.querySelectorAll('input[name="dataFormat"]').forEach(r => {
            r.addEventListener('change', () => {
                const v = container.querySelector('input[name="dataFormat"]:checked').value;
                app.state.dataFormat = v;
                const isLong = v === 'long';
                ['domainsColItem', 'startColItem', 'endColItem', 'nameColItem'].forEach(id => {
                    const el = app.$(id);
                    if (el) el.style.display =
                        (id === 'domainsColItem') ? (isLong ? 'none' : '') : (isLong ? '' : 'none');
                });
                fillRoleSelects(app);
                refreshColorPanel(app);
                if (app.state.currentSvg) app.drawChart();
            });
        });

        const roleMap = {
            proteinColSel: 'protein',
            lengthColSel: 'length',
            domainsColSel: 'domains',
            startColSel: 'start',
            endColSel: 'end',
            nameColSel: 'name'
        };
        Object.keys(roleMap).forEach(id => {
            const el = app.$(id);
            if (!el || el.dataset.bound) return;
            el.dataset.bound = '1';
            el.addEventListener('change', () => {
                app.state.roles[roleMap[id]] = el.value;
                refreshColorPanel(app);
                if (app.state.currentSvg) app.drawChart();
            });
        });
    }

    function renderSortPanel(app) {
        const container = app.$('sortPanelContainer');
        if (!container) return;
        const s = app.state;
        container.innerHTML = `
          <div class="param-panel">
            <div class="param-panel-title">${EN ? 'Sort' : '排序'}</div>
            <div class="param-grid cols-4">
              <div class="param-item"><label>${EN ? 'Sort by' : '排序依据'}</label>
                <select id="sortBy">
                  <option value="input" ${s.sortBy === 'input' ? 'selected' : ''}>${EN ? 'Input order' : '输入顺序'}</option>
                  <option value="name" ${s.sortBy === 'name' ? 'selected' : ''}>${EN ? 'Protein name' : '按蛋白名'}</option>
                  <option value="length" ${s.sortBy === 'length' ? 'selected' : ''}>${EN ? 'Protein length' : '按蛋白长度'}</option>
                  <option value="count" ${s.sortBy === 'count' ? 'selected' : ''}>${EN ? 'Domain count' : '按结构域数量'}</option>
                </select></div>
              <div class="param-item"><label>${EN ? 'Direction' : '方向'}</label>
                <select id="sortDir">
                  <option value="asc" ${s.sortDir !== 'desc' ? 'selected' : ''}>${EN ? 'Ascending' : '升序'}</option>
                  <option value="desc" ${s.sortDir === 'desc' ? 'selected' : ''}>${EN ? 'Descending' : '降序'}</option>
                </select></div>
            </div>
          </div>
        `;
        app.$('sortBy').addEventListener('change', () => {
            app.state.sortBy = app.$('sortBy').value;
            if (app.state.currentSvg) app.drawChart();
        });
        app.$('sortDir').addEventListener('change', () => {
            app.state.sortDir = app.$('sortDir').value;
            if (app.state.currentSvg) app.drawChart();
        });
    }

    function renderDomainPanel(app) {
        const container = app.$('domainPanelContainer');
        if (!container) return;
        const s = app.state;
        const ds = s.domainStyle || {};
        const bb = s.backboneStyle || {};
        const lb = s.labelStyle || {};

        container.className = 'param-panel';
        container.innerHTML = `
          <div class="param-panel-title">${EN ? 'Domain Settings' : '结构域设置'}</div>

          <div class="axis-subsection">${EN ? 'Domain Style' : '结构域样式'}</div>
          <div class="param-grid cols-4">
            <div class="param-item"><label>${EN ? 'Corner radius' : '圆角半径'}</label>
              <input type="number" id="domainCorner" value="${ds.cornerRadius != null ? ds.cornerRadius : 4}" min="0" max="60" step="1" data-redraw></div>
            <div class="param-item"><label>${EN ? 'Stroke color' : '描边色'}</label>
              <input type="color" id="domainStrokeColor" value="${ds.strokeColor || '#ffffff'}" data-redraw></div>
            <div class="param-item"><label>${EN ? 'Stroke width' : '描边宽'}</label>
              <input type="number" id="domainStrokeWidth" value="${ds.strokeWidth != null ? ds.strokeWidth : 0.5}" min="0" max="6" step="0.1" data-redraw></div>
            <div class="param-item"><label>${EN ? 'Opacity' : '透明度'}</label>
              <input type="number" id="domainOpacity" value="${ds.opacity != null ? ds.opacity : 0.9}" min="0" max="1" step="0.05" data-redraw></div>
          </div>

          <div class="axis-subsection">${EN ? 'Backbone' : '骨架线'}</div>
          <div class="param-grid cols-4">
            <div class="param-item"><label class="mini-check"><input type="checkbox" id="backboneShow" ${bb.show !== false ? 'checked' : ''} data-redraw> ${EN ? 'Show backbone' : '显示骨架线'}</label></div>
            <div class="param-item"><label>${EN ? 'Color' : '颜色'}</label>
              <input type="color" id="backboneColor" value="${bb.color || '#888888'}" data-redraw></div>
            <div class="param-item"><label>${EN ? 'Width' : '线宽'}</label>
              <input type="number" id="backboneWidth" value="${bb.width != null ? bb.width : 1}" min="0.1" max="6" step="0.1" data-redraw></div>
            <div class="param-item"><label class="mini-check"><input type="checkbox" id="backboneDash" ${bb.dash ? 'checked' : ''} data-redraw> ${EN ? 'Dashed' : '虚线'}</label></div>
            <div class="param-item" style="grid-column: span 2;"><label>${EN ? 'Backbone end' : '骨架线终点'}</label>
              <select id="backboneEnd" data-redraw>
                <option value="global" ${(bb.endMode || 'global') === 'global' ? 'selected' : ''}>${EN ? 'Longest protein (global)' : '对齐最长蛋白质'}</option>
                <option value="self" ${bb.endMode === 'self' ? 'selected' : ''}>${EN ? 'Own length' : '对齐自身长度'}</option>
              </select></div>
          </div>

          <div class="axis-subsection">${EN ? 'Domain Labels' : '结构域标签'}</div>
          <div class="param-grid cols-4">
            <div class="param-item"><label class="mini-check"><input type="checkbox" id="domainLabelShow" ${lb.show !== false ? 'checked' : ''} data-redraw> ${EN ? 'Show labels' : '显示标签'}</label></div>
            <div class="param-item"><label>${EN ? 'Font size' : '字号'}</label>
              <input type="number" id="domainLabelFontSize" value="${lb.fontSize || 10}" min="4" max="40" step="1" data-redraw></div>
            <div class="param-item"><label>${EN ? 'Color' : '颜色'}</label>
              <input type="color" id="domainLabelColor" value="${lb.color || '#ffffff'}" data-redraw></div>
            <div class="param-item"><label class="mini-check"><input type="checkbox" id="domainLabelBold" ${lb.bold ? 'checked' : ''} data-redraw> ${EN ? 'Bold' : '粗体'}</label></div>
            <div class="param-item"><label class="mini-check"><input type="checkbox" id="domainLabelItalic" ${lb.italic ? 'checked' : ''} data-redraw> ${EN ? 'Italic' : '斜体'}</label></div>
            <div class="param-item"><label class="mini-check"><input type="checkbox" id="domainLabelTruncate" ${lb.truncate !== false ? 'checked' : ''} data-redraw> ${EN ? 'Truncate if too long' : '过长时截断'}</label></div>
          </div>

          <div class="axis-subsection">${EN ? 'Layout' : '布局'}</div>
          <div class="param-grid cols-4">
            <div class="param-item"><label>${EN ? 'Bar height ratio' : '条形高度比例'}</label>
              <input type="number" id="barHeightRatio" value="${s.barHeightRatio != null ? s.barHeightRatio : 0.65}" min="0.1" max="1" step="0.05" data-redraw></div>
          </div>
        `;

        container.querySelectorAll('[data-redraw]').forEach(el => {
            el.addEventListener('change', () => { if (app.state.currentSvg) app.drawChart(); });
        });
    }

    function renderAxisPanel(app) {
        const dir = app.state.barDirection || 'horizontal';
        PlotAxis.render(app.$('axisPanelContainer'), {
            state: app.state.axis,
            direction: dir,
            axisTypes: dir === 'horizontal'
                ? { x: 'numeric', y: 'category' }
                : { x: 'category', y: 'numeric' },
            onGlobalFontChange: function () { if (app.state.currentSvg) app.drawChart(); },
            onChange: function () { if (app.state.currentSvg) app.drawChart(); },
            onDirectionChange: function (newDir) {
                app.state.barDirection = newDir;
                renderAxisPanel(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    function initStateExtra() {
        return {
            roles: { protein: '', length: '', domains: '', start: '', end: '', name: '' },
            dataFormat: 'wide',
            sortBy: 'input',
            sortDir: 'asc',
            barDirection: 'horizontal',
            customColors: {},
            domainStyle: {
                cornerRadius: 4,
                strokeColor: '#ffffff', strokeWidth: 0.5, opacity: 0.9
            },
            backboneStyle: { show: true, color: '#888888', width: 1, dash: false, endMode: 'global' },
            labelStyle: { show: true, fontSize: 10, color: '#ffffff', bold: false, italic: false, truncate: true },
            barHeightRatio: 0.65,
            axis: PlotAxis.defaultState()
        };
    }

    PlotApp.create({
        exportName: 'structure_domain',
        examples: [
            { label: EN ? 'Wide format example' : '宽格式示例', data: EX_WIDE },
            { label: EN ? 'Long format example' : '长格式示例', data: EX_LONG }
        ],
importInfo: EN
    ? 'Provide a table with a <strong>protein column</strong> and a <strong>domains column</strong> in the format <code>Name=Start-End|Name=Start-End</code>. A <strong>total length</strong> column is optional. You can also use the <a href="../../en/040.Motif_parser.html" target="_blank" rel="noopener noreferrer">Motif (MEME/MAST) Parser</a> to generate a motif structure column.'
    : '需包含 <strong>蛋白列</strong> 和 <strong>结构域字符串列</strong>，格式 <code>名称=起始-终止|名称=起始-终止</code>。<strong>总长度</strong>列可选。可使用 <a href="../../ch/040.Motif_parser.html" target="_blank" rel="noopener noreferrer">Motif（MEME/MAST）结果解析器</a> 生成基序的结构信息列。',
        stateExtra: initStateExtra(),

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) input.value = 'Domain';
        },

        refreshColors: function (app) {
            refreshColorPanel(app);
        },

        setup: function (app) {
            const s = app.state;
            if (!s.domainStyle) s.domainStyle = initStateExtra().domainStyle;
            if (!s.backboneStyle) s.backboneStyle = initStateExtra().backboneStyle;
            if (!s.labelStyle) s.labelStyle = initStateExtra().labelStyle;
            if (s.barDirection == null) s.barDirection = 'horizontal';

            const lt = app.$('legendTitle');
            if (lt && !s.legendTitleEdited) lt.value = 'Domain';
            if (s.axis) {
                if (s.axis.x && !s.axis.x.titleContent) s.axis.x.titleContent = 'Position';
                if (s.axis.y && !s.axis.y.titleContent) s.axis.y.titleContent = 'Protein';
            }

            renderDataFormatPanel(app);
            renderSortPanel(app);
            renderDomainPanel(app);
            fillRoleSelects(app);
            refreshColorPanel(app);
            renderAxisPanel(app);
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = res.columnTypes || {};

            const headers = res.headers || [];
            const findHeader = (re) => headers.find(h => re.test(h));
            const proteinCol = headers.find(h => /^(protein|gene|id|name|seq|target)/i.test(h)) || headers[0] || '';
            const lenCol = findHeader(/^(length|len|size)/i);
            const domCol = findHeader(/domain|motif|feature/i);
            const startCol = findHeader(/^(start|begin|from)/i);
            const endCol = findHeader(/^(end|stop|to)/i);
            const nameCol = findHeader(/^(name|type|label|domain)/i) && findHeader(/^(name|type|label|domain)/i) !== domCol
                ? findHeader(/^(name|type|label|domain)/i)
                : '';

            s.roles = {
                protein: proteinCol,
                domains: domCol || '',
                start: startCol || '',
                end: endCol || '',
                name: nameCol || '',
                length: lenCol || ''
            };

            s.dataFormat = (startCol && endCol) ? 'long' : 'wide';
            s.customColors = {};
            s.sortBy = 'input';
            s.sortDir = 'asc';
            s.axis = PlotAxis.defaultState();
            s.axis.x.titleContent = 'Position';
            s.axis.y.titleContent = 'Protein';

            renderDataFormatPanel(app);
            renderSortPanel(app);
            renderDomainPanel(app);
            fillRoleSelects(app);
            refreshColorPanel(app);
            renderAxisPanel(app);

            if (typeof app.syncLegendTitle === 'function') app.syncLegendTitle();
        },

        onReset: function (app) {
            const s = app.state;
            const fresh = initStateExtra();
            s.roles = fresh.roles;
            s.dataFormat = fresh.dataFormat;
            s.sortBy = fresh.sortBy;
            s.sortDir = fresh.sortDir;
            s.customColors = fresh.customColors;
            s.domainStyle = fresh.domainStyle;
            s.backboneStyle = fresh.backboneStyle;
            s.labelStyle = fresh.labelStyle;
            s.barHeightRatio = fresh.barHeightRatio;
            s.axis = fresh.axis;

            renderDataFormatPanel(app);
            renderSortPanel(app);
            renderDomainPanel(app);
            fillRoleSelects(app);
            refreshColorPanel(app);
            renderAxisPanel(app);
        },

        onStateRestored: function (app) {
            const s = app.state;
            if (!s.domainStyle) s.domainStyle = initStateExtra().domainStyle;
            if (!s.backboneStyle) s.backboneStyle = initStateExtra().backboneStyle;
            if (!s.labelStyle) s.labelStyle = initStateExtra().labelStyle;
            if (s.barDirection == null) s.barDirection = 'horizontal';

            if (s.domainStyle) {
                delete s.domainStyle.shape;
                delete s.domainStyle.fillMode;
                delete s.domainStyle.uniformColor;
            }
            if (s.backboneStyle && s.backboneStyle.endMode == null) {
                s.backboneStyle.endMode = 'global';
            }

            renderDataFormatPanel(app);
            renderSortPanel(app);
            renderDomainPanel(app);
            fillRoleSelects(app);
            refreshColorPanel(app);
            renderAxisPanel(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
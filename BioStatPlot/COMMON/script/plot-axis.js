/* ============================================================
   BioDataTools 通用二维坐标轴设置模块
============================================================ */
(function (global) {
    'use strict';

    const I18N = {
        zh: {
            panelTitle: '坐标轴设置',

            directionGroup: '图表方向',
            directionVertical: '竖向',
            directionHorizontal: '横向',
            directionTip: '切换柱形朝向',

            globalFontGroup: '坐标轴字体',

            frameGroup: '绘图区边框',
            frameShow: '显示',
            frameColor: '颜色',
            frameWidth: '线宽',
            frameDash: '虚线',

            refLineGroup: '参考线',
            refLineTip: '空格或逗号分隔，如5 11',
            refLineColor: '颜色',
            refLineWidth: '线宽',
            refLineDash: '虚线',

            xAxis: 'X轴',
            yAxis: 'Y轴',
            typeNumeric: '数字轴',
            typeCategory: '标签轴',

            titleLabel: '轴标题',
            titleShow: '显示',
            titleContent: '内容',
            fontSize: '字号',
            bold: '粗',
            italic: '斜',

            domainGroup: '轴范围',
            domainAuto: '自动',
            domainMin: '最小',
            domainMax: '最大',
            domainPad: '外扩(%)',

            scaleGroup: '刻度类型',
            scaleLinear: '线性',
            scaleLog: '对数',
            scaleLogTip: '对数轴不能有0或负数，也不能与"轴截断"同时使用',
            logBase: '底数',
            logBaseTip: '常用2/e/10',

            breakGroup: '轴截断',
            breakEnable: '启用',
            breakFrom: '断开下限值',
            breakTo: '断开上限值',
            breakTip: '落在两个值之间的数据会被视觉压缩，轴线上显示断口标记',

            tickGroup: '刻度线',
            tickShow: '显示',
            tickDir: '朝向',
            tickDirOut: '向外',
            tickDirIn: '向内',
            tickDirBoth: '双向',
            tickLength: '长度',
            tickWidth: '宽度',

            tickValueGroup: '刻度值',
            tickValueShow: '显示',
            tickValueAuto: '自动',
            tickValueCustom: '自定义',
            tickValueCustomTip: '逗号分隔，如 0,5,10,15',
            tickFontGroup: '刻度字体',
            tickRotate: '旋转(°)',
            tickLabelPosLabel: '位置',
            tickLabelPosOutside: '轴外',
            tickLabelPosInside: '轴内',

            gridGroup: '网格线',
            gridShow: '显示',
            gridColor: '颜色',
            gridDash: '虚线',

            lineGroup: '轴线',
            lineShow: '显示',
            lineWidth: '线宽',
            lineColor: '颜色',

            crossGroup: '轴线位置',
            crossMode: '位置模式',
            crossAuto: '自动（按轴的最小值放置）',
            crossZero: '零点',
            crossMin: '轴最小值',
            crossMax: '轴最大值',
            crossCustom: '自定义',
            crossValue: '数值',
            crossTip: '决定另一条轴（主轴线）绘制的像素位置'
        },
        en: {
            panelTitle: 'Axis Settings',

            directionGroup: 'Chart Direction',
            directionVertical: 'Vertical',
            directionHorizontal: 'Horizontal',
            directionTip: 'Switch bar orientation',

            globalFontGroup: 'Axis Font',

            frameGroup: 'Plot Frame',
            frameShow: 'Show',
            frameColor: 'Color',
            frameWidth: 'Width',
            frameDash: 'Dash',

            refLineGroup: 'Reference Lines',
            refLineTip: 'Space or comma separated, e.g. 5 11',
            refLineColor: 'Color',
            refLineWidth: 'Width',
            refLineDash: 'Dash',

            xAxis: 'X Axis',
            yAxis: 'Y Axis',
            typeNumeric: 'Numeric',
            typeCategory: 'Category',

            titleLabel: 'Axis Title',
            titleShow: 'Show',
            titleContent: 'Text',
            fontSize: 'Size',
            bold: 'B',
            italic: 'I',

            domainGroup: 'Axis Range',
            domainAuto: 'Auto',
            domainMin: 'Min',
            domainMax: 'Max',
            domainPad: 'Pad (%)',

            scaleGroup: 'Scale Type',
            scaleLinear: 'Linear',
            scaleLog: 'Log',
            scaleLogTip: 'Log axis cannot contain 0 or negative values, and cannot be combined with "Axis Break"',
            logBase: 'Base',
            logBaseTip: 'Common: 2 / e / 10',

            breakGroup: 'Axis Break',
            breakEnable: 'Enable',
            breakFrom: 'Break from',
            breakTo: 'Break to',
            breakTip: 'Data between the two values will be visually compressed; a break mark will be drawn on the axis',

            tickGroup: 'Tick Marks',
            tickShow: 'Show',
            tickDir: 'Direction',
            tickDirOut: 'Out',
            tickDirIn: 'In',
            tickDirBoth: 'Both',
            tickLength: 'Length',
            tickWidth: 'Width',

            tickValueGroup: 'Tick Values',
            tickValueShow: 'Show',
            tickValueAuto: 'Auto',
            tickValueCustom: 'Custom',
            tickValueCustomTip: 'Comma-separated, e.g. 0,5,10,15',
            tickFontGroup: 'Tick Font',
            tickRotate: 'Rotate (°)',
            tickLabelPosLabel: 'Position',
            tickLabelPosOutside: 'Outside',
            tickLabelPosInside: 'Inside',

            gridGroup: 'Grid Lines',
            gridShow: 'Show',
            gridColor: 'Color',
            gridDash: 'Dash',

            lineGroup: 'Axis Line',
            lineShow: 'Show',
            lineWidth: 'Width',
            lineColor: 'Color',

            crossGroup: 'Axis Position',
            crossMode: 'Mode',
            crossAuto: 'Auto (at axis minimum)',
            crossZero: 'Zero',
            crossMin: 'Axis minimum',
            crossMax: 'Axis maximum',
            crossCustom: 'Custom',
            crossValue: 'Value',
            crossTip: 'Determines the pixel position where the other axis (main axis) is drawn'
        }
    };

    function getLang() {
        return window.location.pathname.includes('/en/') ? 'en' : 'zh';
    }
    function L() {
        return I18N[getLang()] || I18N.zh;
    }
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function singleAxisDefault() {
        return {
            fontFamily: 'Times New Roman',
            titleShow: true,
            titleContent: '',
            titleFontSize: 16,
            titleBold: true,
            titleItalic: false,
            domainAuto: true,
            domainMin: 0,
            domainMax: 100,
            domainPad: 0,
            scaleType: 'linear',
            logBase: 10,
            breakEnable: false,
            breakFrom: 0,
            breakTo: 0,
            tickShow: true,
            tickDir: 'out',
            tickLength: 6,
            tickWidth: 1,
            tickValueShow: true,
            tickValueAuto: true,
            tickValueCustom: '',
            tickLabelPos: 'outside',
            tickFontSize: 14,
            tickBold: true,
            tickItalic: false,
            tickRotate: 0,
            gridShow: false,
            gridColor: '#e8edf2',
            gridDash: '3 3',
            lineShow: true,
            lineWidth: 1,
            lineColor: '#333333',
            crossMode: 'auto',
            crossValue: 0,
            refLines: '',
            refLineColor: '#e15759',
            refLineWidth: 1.5,
            refLineDash: false
        };
    }

    function frameDefault() {
        return { show: false, color: '#333333', width: 1, dash: false };
    }

    function defaultState() {
        return {
            x: singleAxisDefault(),
            y: singleAxisDefault(),
            frame: frameDefault()
        };
    }

    function injectStyle() {
        if (document.getElementById('plot-axis-style')) return;
        const s = document.createElement('style');
        s.id = 'plot-axis-style';
        s.textContent = `
.axis-block {
    margin: 0 0 14px 0;
    padding: 10px 12px;
    background: #fbfdff;
    border: 1px solid #e3ebf3;
    border-radius: 6px;
}
.axis-block:last-child { margin-bottom: 0; }
.axis-direction-block {
    background: #f6fbfd;
    border-color: #c5dce6;
}
.axis-block-title {
    font-size: 14px;
    font-weight: 700;
    color: #1f4068;
    margin: 0 0 10px 0;
    padding: 0 0 6px 0;
    border-bottom: 2px solid #1f4068;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.axis-block-title .axis-type-hint {
    font-size: 11px;
    font-weight: 400;
    color: #8da3b8;
    background: #eef4fb;
    padding: 2px 8px;
    border-radius: 10px;
}
.axis-subsection {
    font-size: 12px;
    font-weight: 700;
    color: #4a6784;
    margin: 10px 0 6px 0;
}
.axis-subsection:first-child { margin-top: 0; }
.axis-tip {
    font-size: 12px;
    color: #999;
    line-height: 1.5;
}
.axis-direction-radio {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-right: 16px;
    cursor: pointer;
    font-size: 13px;
    color: #1f4068;
}
`;
        document.head.appendChild(s);
    }

    function directionPanelHTML(t, currentDir) {
        return `
        <div class="axis-block axis-direction-block">
            <div class="axis-block-title">
                <span>${t.directionGroup}</span>
            </div>
            <div class="font-row">
                <label class="axis-direction-radio">
                    <input type="radio" name="axisDirection" value="vertical"
                           ${currentDir === 'vertical' ? 'checked' : ''}>
                    ${t.directionVertical}
                </label>
                <label class="axis-direction-radio">
                    <input type="radio" name="axisDirection" value="horizontal"
                           ${currentDir === 'horizontal' ? 'checked' : ''}>
                    ${t.directionHorizontal}
                </label>
                <span class="axis-tip" style="margin-left:10px;">${t.directionTip}</span>
            </div>
        </div>
        `;
    }

    function globalFontPanelHTML(t, st) {
        const fs = st.x.tickFontSize;
        const fb = st.x.tickBold;
        const fi = st.x.tickItalic;
        const tfs = st.x.titleFontSize;
        const tb = st.x.titleBold;
        const ti = st.x.titleItalic;

        return `
        <div class="axis-block">
            <div class="axis-block-title">
                <span>${t.globalFontGroup}</span>
            </div>
            <div class="font-row">
                <span class="font-label">${t.tickFontGroup}</span>
                <input type="number" id="axisTickFontSize" value="${fs}" min="6" max="36" style="width:60px;">
                <label class="mini-check"><input type="checkbox" id="axisTickBold" ${fb ? 'checked' : ''}> ${t.bold}</label>
                <label class="mini-check"><input type="checkbox" id="axisTickItalic" ${fi ? 'checked' : ''}> ${t.italic}</label>
            </div>
            <div class="font-row">
                <span class="font-label">${t.titleLabel}</span>
                <input type="number" id="axisTitleFontSize" value="${tfs}" min="6" max="48" style="width:60px;">
                <label class="mini-check"><input type="checkbox" id="axisTitleBold" ${tb ? 'checked' : ''}> ${t.bold}</label>
                <label class="mini-check"><input type="checkbox" id="axisTitleItalic" ${ti ? 'checked' : ''}> ${t.italic}</label>
            </div>
        </div>
        `;
    }

    function framePanelHTML(t, frameCfg) {
        const f = Object.assign(frameDefault(), frameCfg || {});
        return `
        <div class="axis-block">
            <div class="axis-block-title"><span>${t.frameGroup}</span></div>
            <div class="font-row">
                <label class="mini-check"><input type="checkbox" class="ax-frame-show" ${f.show ? 'checked' : ''}> ${t.frameShow}</label>
                <label>${t.frameColor}
                    <input type="color" class="ax-frame-color" value="${f.color}">
                </label>
                <label>${t.frameWidth}
                    <input type="number" class="ax-frame-width" value="${f.width}" min="0" max="10" step="0.5" style="width:60px;">
                </label>
                <label class="mini-check"><input type="checkbox" class="ax-frame-dash" ${f.dash ? 'checked' : ''}> ${t.frameDash}</label>
            </div>
        </div>
        `;
    }

    function axisPanelHTML(key, cfg, t, axisType) {
        const isX = (key === 'x');
        const isNumeric = (axisType === 'numeric');

        let html = `<div class="axis-block">`;

        html += `
            <div class="axis-block-title">
                <span>${isX ? t.xAxis : t.yAxis}</span>
                <span class="axis-type-hint">${isNumeric ? t.typeNumeric : t.typeCategory}</span>
            </div>
        `;

        html += `
            <div class="axis-subsection">${t.titleLabel}</div>
            <div class="font-row">
                <label class="mini-check"><input type="checkbox" class="ax-${key}-title-show" ${cfg.titleShow ? 'checked' : ''}> ${t.titleShow}</label>
                <input type="text" class="ax-${key}-title" value="${escapeHtml(cfg.titleContent)}" style="flex:1;min-width:140px;">
                <label>${t.fontSize}
                    <input type="number" class="ax-${key}-title-fs" value="${cfg.titleFontSize}" min="6" max="48" style="width:60px;">
                </label>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-title-b" ${cfg.titleBold ? 'checked' : ''}> ${t.bold}</label>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-title-i" ${cfg.titleItalic ? 'checked' : ''}> ${t.italic}</label>
            </div>
        `;

        if (isNumeric) {
            html += `
                <div class="axis-subsection">${t.domainGroup}</div>
                <div class="font-row">
                    <label class="mini-check"><input type="checkbox" class="ax-${key}-domain-auto" ${cfg.domainAuto ? 'checked' : ''}> ${t.domainAuto}</label>
                    <label>${t.domainMin}
                        <input type="number" class="ax-${key}-domain-min" value="${cfg.domainMin}" style="width:80px;">
                    </label>
                    <label>${t.domainMax}
                        <input type="number" class="ax-${key}-domain-max" value="${cfg.domainMax}" style="width:80px;">
                    </label>
                    <label>${t.domainPad}
                        <input type="number" class="ax-${key}-domain-pad" value="${cfg.domainPad}" min="0" max="100" step="1" style="width:60px;">
                    </label>
                </div>

                <div class="axis-subsection">${t.refLineGroup}</div>
                <div class="font-row">
                    <input type="text" class="ax-${key}-reflines" value="${escapeHtml(cfg.refLines || '')}" placeholder="${t.refLineTip}" style="flex:1;min-width:150px;">
                    <label>${t.refLineColor}
                        <input type="color" class="ax-${key}-refline-color" value="${cfg.refLineColor || '#e15759'}">
                    </label>
                    <label>${t.refLineWidth}
                        <input type="number" class="ax-${key}-refline-width" value="${cfg.refLineWidth || 1.5}" min="0.5" max="10" step="0.5" style="width:60px;">
                    </label>
                    <label class="mini-check"><input type="checkbox" class="ax-${key}-refline-dash" ${cfg.refLineDash ? 'checked' : ''}> ${t.refLineDash}</label>
                </div>

                <div class="axis-subsection">${t.scaleGroup}</div>
                <div class="font-row">
                    <select class="ax-${key}-scale-type">
                        <option value="linear" ${cfg.scaleType === 'linear' ? 'selected' : ''}>${t.scaleLinear}</option>
                        <option value="log" ${cfg.scaleType === 'log' ? 'selected' : ''}>${t.scaleLog}</option>
                    </select>
                    <label class="ax-${key}-logbase-wrap" style="display:${cfg.scaleType === 'log' ? '' : 'none'}">
                        ${t.logBase}
                        <input type="number" class="ax-${key}-log-base" value="${cfg.logBase || 10}" min="0.0001" step="0.1" style="width:70px;">
                        <span class="axis-tip" style="margin-left:8px;">${t.logBaseTip}</span>
                    </label>
                </div>

                <div class="axis-subsection">${t.breakGroup}</div>
                <div class="font-row">
                    <label class="mini-check"><input type="checkbox" class="ax-${key}-break-en" ${cfg.breakEnable ? 'checked' : ''}> ${t.breakEnable}</label>
                    <label>${t.breakFrom}
                        <input type="number" class="ax-${key}-break-from" value="${cfg.breakFrom}" style="width:80px;">
                    </label>
                    <label>${t.breakTo}
                        <input type="number" class="ax-${key}-break-to" value="${cfg.breakTo}" style="width:80px;">
                    </label>
                </div>
                <div class="font-row" style="padding-top:0;">
                    <span class="font-label"></span>
                    <span class="axis-tip">${t.breakTip}</span>
                </div>
            `;
        }

        html += `
            <div class="axis-subsection">${t.tickGroup}</div>
            <div class="font-row">
                <label class="mini-check"><input type="checkbox" class="ax-${key}-tick-show" ${cfg.tickShow ? 'checked' : ''}> ${t.tickShow}</label>
                <label>${t.tickDir}
                    <select class="ax-${key}-tick-dir">
                        <option value="out" ${cfg.tickDir === 'out' ? 'selected' : ''}>${t.tickDirOut}</option>
                        <option value="in" ${cfg.tickDir === 'in' ? 'selected' : ''}>${t.tickDirIn}</option>
                        <option value="both" ${cfg.tickDir === 'both' ? 'selected' : ''}>${t.tickDirBoth}</option>
                    </select>
                </label>
                <label>${t.tickLength}
                    <input type="number" class="ax-${key}-tick-len" value="${cfg.tickLength}" min="0" max="30" style="width:60px;">
                </label>
                <label>${t.tickWidth}
                    <input type="number" class="ax-${key}-tick-w" value="${cfg.tickWidth}" min="0" max="6" step="0.5" style="width:60px;">
                </label>
            </div>
        `;

        html += `
            <div class="axis-subsection">${t.tickValueGroup}</div>
            <div class="font-row">
                <label class="mini-check"><input type="checkbox" class="ax-${key}-tickvalue-show" ${cfg.tickValueShow ? 'checked' : ''}> ${t.tickValueShow}</label>
                <label>${t.tickLabelPosLabel}
                    <select class="ax-${key}-ticklabel-pos">
                        <option value="outside" ${cfg.tickLabelPos !== 'inside' ? 'selected' : ''}>${t.tickLabelPosOutside}</option>
                        <option value="inside" ${cfg.tickLabelPos === 'inside' ? 'selected' : ''}>${t.tickLabelPosInside}</option>
                    </select>
                </label>
        `;
        if (isNumeric) {
            html += `
                <label class="mini-check"><input type="checkbox" class="ax-${key}-tickvalue-auto" ${cfg.tickValueAuto ? 'checked' : ''}> ${t.tickValueAuto}</label>
                <input type="text" class="ax-${key}-tickvalue-custom" value="${escapeHtml(cfg.tickValueCustom)}" placeholder="${t.tickValueCustomTip}" style="flex:1;min-width:150px;">
            `;
        }
        html += `</div>`;

        html += `
            <div class="font-row">
                <span class="font-label">${t.tickFontGroup}</span>
                <label>${t.fontSize}
                    <input type="number" class="ax-${key}-tick-fs" value="${cfg.tickFontSize}" min="6" max="36" style="width:60px;">
                </label>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-tick-b" ${cfg.tickBold ? 'checked' : ''}> ${t.bold}</label>
                <label class="mini-check"><input type="checkbox" class="ax-${key}-tick-i" ${cfg.tickItalic ? 'checked' : ''}> ${t.italic}</label>
                <label>${t.tickRotate}
                    <input type="number" class="ax-${key}-tick-rot" value="${cfg.tickRotate}" min="-90" max="90" style="width:60px;">
                </label>
            </div>
        `;

        html += `
            <div class="axis-subsection">${t.gridGroup}</div>
            <div class="font-row">
                <label class="mini-check"><input type="checkbox" class="ax-${key}-grid-show" ${cfg.gridShow ? 'checked' : ''}> ${t.gridShow}</label>
                <label>${t.gridColor}
                    <input type="color" class="ax-${key}-grid-color" value="${cfg.gridColor}">
                </label>
                <label>${t.gridDash}
                    <input type="text" class="ax-${key}-grid-dash" value="${escapeHtml(cfg.gridDash)}" style="width:80px;">
                </label>
            </div>
        `;

        html += `
            <div class="axis-subsection">${t.lineGroup}</div>
            <div class="font-row">
                <label class="mini-check"><input type="checkbox" class="ax-${key}-line-show" ${cfg.lineShow ? 'checked' : ''}> ${t.lineShow}</label>
                <label>${t.lineWidth}
                    <input type="number" class="ax-${key}-line-w" value="${cfg.lineWidth}" min="0" max="6" step="0.5" style="width:60px;">
                </label>
                <label>${t.lineColor}
                    <input type="color" class="ax-${key}-line-color" value="${cfg.lineColor}">
                </label>
            </div>
        `;

        html += `
            <div class="axis-subsection">${t.crossGroup}</div>
            <div class="font-row">
                <label>${t.crossMode}
                    <select class="ax-${key}-cross-mode">
                        <option value="auto" ${cfg.crossMode === 'auto' ? 'selected' : ''}>${t.crossAuto}</option>
                        <option value="zero" ${cfg.crossMode === 'zero' ? 'selected' : ''}>${t.crossZero}</option>
                        <option value="min" ${cfg.crossMode === 'min' ? 'selected' : ''}>${t.crossMin}</option>
                        <option value="max" ${cfg.crossMode === 'max' ? 'selected' : ''}>${t.crossMax}</option>
                        <option value="custom" ${cfg.crossMode === 'custom' ? 'selected' : ''}>${t.crossCustom}</option>
                    </select>
                </label>
                <label>${t.crossValue}
                    <input type="number" class="ax-${key}-cross-value" value="${cfg.crossValue}" style="width:80px;">
                </label>
            </div>
            <div class="font-row" style="padding-top:0;">
                <span class="font-label"></span>
                <span class="axis-tip">${t.crossTip}</span>
            </div>
        `;

        html += `</div>`;
        return html;
    }

    function readFromDOM(container, st) {
        const val = (g, id) => { const el = g(id); return el ? el.value : undefined; };
        const chk = (g, id) => { const el = g(id); return el ? el.checked : undefined; };
        const num = (g, id, fb) => {
            const el = g(id);
            if (!el) return undefined;
            const v = parseFloat(el.value);
            return isFinite(v) ? v : fb;
        };
        const setIf = (cfg, key, v) => { if (v !== undefined) cfg[key] = v; };

        ['x', 'y'].forEach(key => {
            const cfg = st[key];
            const g = id => container.querySelector(`.ax-${key}-${id}`);

            setIf(cfg, 'titleShow', chk(g, 'title-show'));
            setIf(cfg, 'titleContent', val(g, 'title'));
            setIf(cfg, 'titleFontSize', num(g, 'title-fs', 16));
            setIf(cfg, 'titleBold', chk(g, 'title-b'));
            setIf(cfg, 'titleItalic', chk(g, 'title-i'));

            setIf(cfg, 'domainAuto', chk(g, 'domain-auto'));
            setIf(cfg, 'domainMin', num(g, 'domain-min', 0));
            setIf(cfg, 'domainMax', num(g, 'domain-max', 100));
            const pad = num(g, 'domain-pad', 0);
            if (pad !== undefined) cfg.domainPad = Math.max(0, pad);

            setIf(cfg, 'refLines', val(g, 'reflines'));
            setIf(cfg, 'refLineColor', val(g, 'refline-color'));
            const rlw = num(g, 'refline-width', 1.5);
            if (rlw !== undefined) cfg.refLineWidth = Math.max(0.5, rlw);
            setIf(cfg, 'refLineDash', chk(g, 'refline-dash'));

            setIf(cfg, 'scaleType', val(g, 'scale-type'));
            const lb = num(g, 'log-base', 10);
            if (lb !== undefined) cfg.logBase = (lb > 0 ? lb : 10);

            setIf(cfg, 'breakEnable', chk(g, 'break-en'));
            setIf(cfg, 'breakFrom', num(g, 'break-from', 0));
            setIf(cfg, 'breakTo', num(g, 'break-to', 0));

            setIf(cfg, 'tickShow', chk(g, 'tick-show'));
            setIf(cfg, 'tickDir', val(g, 'tick-dir'));
            const tl = num(g, 'tick-len', 6);
            if (tl !== undefined) cfg.tickLength = Math.max(0, tl);
            const tw = num(g, 'tick-w', 1);
            if (tw !== undefined) cfg.tickWidth = Math.max(0, tw);

            setIf(cfg, 'tickValueShow', chk(g, 'tickvalue-show'));
            setIf(cfg, 'tickValueAuto', chk(g, 'tickvalue-auto'));
            setIf(cfg, 'tickValueCustom', val(g, 'tickvalue-custom'));
            setIf(cfg, 'tickLabelPos', val(g, 'ticklabel-pos'));
            const tfs = num(g, 'tick-fs', 14);
            if (tfs !== undefined) cfg.tickFontSize = Math.max(6, tfs);
            setIf(cfg, 'tickBold', chk(g, 'tick-b'));
            setIf(cfg, 'tickItalic', chk(g, 'tick-i'));
            setIf(cfg, 'tickRotate', num(g, 'tick-rot', 0));

            setIf(cfg, 'gridShow', chk(g, 'grid-show'));
            setIf(cfg, 'gridColor', val(g, 'grid-color'));
            setIf(cfg, 'gridDash', val(g, 'grid-dash'));

            setIf(cfg, 'lineShow', chk(g, 'line-show'));
            const lw = num(g, 'line-w', 1);
            if (lw !== undefined) cfg.lineWidth = Math.max(0, lw);
            setIf(cfg, 'lineColor', val(g, 'line-color'));

            setIf(cfg, 'crossMode', val(g, 'cross-mode'));
            setIf(cfg, 'crossValue', num(g, 'cross-value', 0));
        });

        if (!st.frame) st.frame = frameDefault();
        const fShow = container.querySelector('.ax-frame-show');
        const fColor = container.querySelector('.ax-frame-color');
        const fWidth = container.querySelector('.ax-frame-width');
        const fDash = container.querySelector('.ax-frame-dash');
        if (fShow) st.frame.show = fShow.checked;
        if (fColor) st.frame.color = fColor.value;
        if (fWidth) {
            const v = parseFloat(fWidth.value);
            if (isFinite(v)) st.frame.width = Math.max(0, v);
        }
        if (fDash) st.frame.dash = fDash.checked;
    }

    function getAxisTypesForDirection(direction) {
        if (direction === 'horizontal') return { x: 'numeric', y: 'category' };
        return { x: 'category', y: 'numeric' };
    }

    function render(containerOrId, opts) {
        opts = opts || {};
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId)
            : containerOrId;
        if (!container) return;

        injectStyle();

        const t = L();
        const st = opts.state || defaultState();
        if (!st.x) st.x = singleAxisDefault();
        if (!st.y) st.y = singleAxisDefault();
        if (!st.frame) st.frame = frameDefault();

        let currentDirection = opts.direction || 'vertical';

        function build() {
            const axisTypes = opts.axisTypes || getAxisTypesForDirection(currentDirection);
            container.className = 'param-panel';
            container.innerHTML = `
                <div class="param-panel-title">${t.panelTitle}</div>
                ${directionPanelHTML(t, currentDirection)}
                ${globalFontPanelHTML(t, st)}
                ${framePanelHTML(t, st.frame)}
                ${axisPanelHTML('x', st.x, t, axisTypes.x)}
                ${axisPanelHTML('y', st.y, t, axisTypes.y)}
            `;

            container.querySelectorAll('input[name="axisDirection"]').forEach(r => {
                r.addEventListener('change', () => {
                    const newDir = container.querySelector('input[name="axisDirection"]:checked').value;
                    if (newDir === currentDirection) return;
                    readFromDOM(container, st);
                    ['refLines', 'refLineColor', 'refLineWidth', 'refLineDash'].forEach(k => {
                        const tmp = st.x[k];
                        st.x[k] = st.y[k];
                        st.y[k] = tmp;
                    });
                    currentDirection = newDir;
                    if (opts.onDirectionChange) opts.onDirectionChange(newDir);
                    build();
                });
            });

            ['x', 'y'].forEach(key => {
                const sel = container.querySelector(`.ax-${key}-scale-type`);
                const wrap = container.querySelector(`.ax-${key}-logbase-wrap`);
                if (sel && wrap) {
                    const update = () => { wrap.style.display = (sel.value === 'log') ? '' : 'none'; };
                    sel.addEventListener('change', update);
                    update();
                }
            });

            bindGlobalFont();
        }

        function bindGlobalFont() {
            function readGlobalFont() {
                const fs = parseFloat((document.getElementById('axisTickFontSize') || {}).value);
                const fb = !!(document.getElementById('axisTickBold') || {}).checked;
                const fi = !!(document.getElementById('axisTickItalic') || {}).checked;
                const tfs = parseFloat((document.getElementById('axisTitleFontSize') || {}).value);
                const tb = !!(document.getElementById('axisTitleBold') || {}).checked;
                const ti = !!(document.getElementById('axisTitleItalic') || {}).checked;

                ['x', 'y'].forEach(k => {
                    if (isFinite(fs)) st[k].tickFontSize = Math.max(6, fs);
                    st[k].tickBold = fb;
                    st[k].tickItalic = fi;
                    if (isFinite(tfs)) st[k].titleFontSize = Math.max(6, tfs);
                    st[k].titleBold = tb;
                    st[k].titleItalic = ti;
                });

                if (opts.onGlobalFontChange) opts.onGlobalFontChange();
                if (opts.onChange) opts.onChange();
            }

            ['axisTickFontSize', 'axisTitleFontSize'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('input', readGlobalFont);
                    el.addEventListener('change', readGlobalFont);
                }
            });
            ['axisTickBold', 'axisTickItalic', 'axisTitleBold', 'axisTitleItalic'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('change', readGlobalFont);
            });
        }

        build();

        let raf = null;
        const onChange = () => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = null;
                readFromDOM(container, st);
                opts.onChange && opts.onChange();
            });
        };
        container.addEventListener('change', onChange);
        container.addEventListener('input', onChange);
    }

    function applyAxis(axisG, cfg, orientation, breakPos) {
        if (!axisG || !cfg) return;

        const domain = axisG.select('.domain');
        domain
            .style('display', cfg.lineShow ? null : 'none')
            .attr('stroke', cfg.lineColor)
            .attr('stroke-width', cfg.lineWidth);

        const pathD = domain.attr('d');
        if (pathD) {
            const horiz = (orientation === 'bottom' || orientation === 'top');
            if (horiz) {
                const m = pathD.match(/^M\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:V\s*(-?[\d.]+)\s*)?H\s*(-?[\d.]+)/);
                if (m && m[3] !== undefined) {
                    domain.attr('d', `M${m[1]},${m[3]}H${m[4]}`);
                }
            } else {
                const m = pathD.match(/^M\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*H\s*(-?[\d.]+)\s*(?:V\s*(-?[\d.]+))?/);
                if (m && m[4] !== undefined) {
                    domain.attr('d', `M${m[3]},${m[2]}V${m[4]}`);
                }
            }
        }

        axisG.selectAll('.tick').each(function () {
            const t = d3.select(this);
            const textEl = t.select('text');
            if (textEl.empty() || !textEl.text().trim()) {
                t.style('display', 'none');
            }
        });

        const len = cfg.tickLength;
        const horiz = (orientation === 'bottom' || orientation === 'top');
        const outwardSign = horiz
            ? (orientation === 'bottom' ? 1 : -1)
            : (orientation === 'right' ? 1 : -1);

        let v1 = 0, v2 = 0;
        if (cfg.tickDir === 'out') {
            v1 = 0; v2 = outwardSign * len;
        } else if (cfg.tickDir === 'in') {
            v1 = 0; v2 = -outwardSign * len;
        } else {
            v1 = -outwardSign * len; v2 = outwardSign * len;
        }

        axisG.selectAll('.tick line')
            .style('display', cfg.tickShow ? null : 'none')
            .attr('stroke', cfg.lineColor)
            .attr('stroke-width', cfg.tickWidth);

        if (horiz) {
            axisG.selectAll('.tick line').attr('y1', v1).attr('y2', v2);
        } else {
            axisG.selectAll('.tick line').attr('x1', v1).attr('x2', v2);
        }

        axisG.selectAll('.tick text')
            .style('display', cfg.tickValueShow ? null : 'none')
            .style('font-size', cfg.tickFontSize + 'px')
            .style('font-weight', cfg.tickBold ? 'bold' : 'normal')
            .style('font-style', cfg.tickItalic ? 'italic' : 'normal')
            .style('font-family', cfg.fontFamily || null);

        const labelPos = cfg.tickLabelPos || 'outside';
        const tickLen = cfg.tickShow ? cfg.tickLength : 0;

        if (horiz) {
            if (labelPos === 'inside') {
                axisG.selectAll('.tick text')
                    .attr('y', -(tickLen + 4))
                    .attr('dy', '0.35em')
                    .attr('text-anchor', 'middle');
            } else {
                axisG.selectAll('.tick text')
                    .attr('y', tickLen + 6)
                    .attr('dy', '0.71em')
                    .attr('text-anchor', 'middle');
            }
        } else {
            if (labelPos === 'inside') {
                axisG.selectAll('.tick text')
                    .attr('x', tickLen + 4)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', 'start');
            } else {
                axisG.selectAll('.tick text')
                    .attr('x', -(tickLen + 6))
                    .attr('dy', '0.35em')
                    .attr('text-anchor', 'end');
            }
        }

        if (cfg.tickRotate) {
            axisG.selectAll('.tick text').attr('transform', `rotate(${cfg.tickRotate})`);
        } else {
            axisG.selectAll('.tick text').attr('transform', null);
        }

        axisG.selectAll('.axis-break-mark').remove();
        if (cfg.breakEnable && isFinite(breakPos)) {
            const s = 5, d = 4;
            const strokeW = Math.max(1.5, cfg.lineWidth);
            if (horiz) {
                axisG.append('line').attr('class', 'axis-break-mark')
                    .attr('x1', breakPos - d).attr('y1', s)
                    .attr('x2', breakPos).attr('y2', -s)
                    .attr('stroke', cfg.lineColor).attr('stroke-width', strokeW).attr('stroke-linecap', 'round');
                axisG.append('line').attr('class', 'axis-break-mark')
                    .attr('x1', breakPos).attr('y1', s)
                    .attr('x2', breakPos + d).attr('y2', -s)
                    .attr('stroke', cfg.lineColor).attr('stroke-width', strokeW).attr('stroke-linecap', 'round');
            } else {
                axisG.append('line').attr('class', 'axis-break-mark')
                    .attr('x1', -s).attr('y1', breakPos - d)
                    .attr('x2', s).attr('y2', breakPos)
                    .attr('stroke', cfg.lineColor).attr('stroke-width', strokeW).attr('stroke-linecap', 'round');
                axisG.append('line').attr('class', 'axis-break-mark')
                    .attr('x1', -s).attr('y1', breakPos)
                    .attr('x2', s).attr('y2', breakPos + d)
                    .attr('stroke', cfg.lineColor).attr('stroke-width', strokeW).attr('stroke-linecap', 'round');
            }
        }
    }

    function resolveDomain(cfg, dataExtent) {
        if (!dataExtent || dataExtent.length < 2) return [0, 1];
        let [lo, hi] = dataExtent;
        if (!isFinite(lo) || !isFinite(hi)) return [0, 1];
        if (cfg.domainAuto) {
            if (lo === hi) {
                const pad = Math.abs(lo) * 0.1 || 1;
                return [lo - pad, hi + pad];
            }
            const pad = (hi - lo) * (cfg.domainPad / 100);
            return [lo - pad, hi + pad];
        }
        return [cfg.domainMin, cfg.domainMax];
    }

    function applyBreak(scale, cfg) {
        if (!cfg || !cfg.breakEnable) return scale;
        if (!isFinite(cfg.breakFrom) || !isFinite(cfg.breakTo)) return scale;
        if (cfg.breakTo <= cfg.breakFrom) return scale;
        const domain = scale.domain();
        if (!Array.isArray(domain) || domain.length !== 2) return scale;
        const [dMin, dMax] = domain;
        if (!isFinite(dMin) || !isFinite(dMax)) return scale;
        if (cfg.breakFrom <= dMin || cfg.breakTo >= dMax) return scale;
        const range = scale.range();
        const [r0, r1] = range;
        const dataBelow = cfg.breakFrom - dMin;
        const dataAbove = dMax - cfg.breakTo;
        const totalData = dataBelow + dataAbove;
        if (totalData <= 0) return scale;
        const totalPx = Math.abs(r1 - r0);
        const gapPx = 14;
        const availPx = totalPx - gapPx;
        if (availPx <= 0) return scale;
        const belowPx = (dataBelow / totalData) * availPx;
        const abovePx = (dataAbove / totalData) * availPx;
        const sign = r1 > r0 ? 1 : -1;
        return d3.scaleLinear()
            .domain([dMin, cfg.breakFrom, cfg.breakTo, dMax])
            .range([
                r0,
                r0 + sign * belowPx,
                r0 + sign * (belowPx + gapPx),
                r0 + sign * (belowPx + gapPx + abovePx)
            ]);
    }

    function getBreakPosition(scale, cfg) {
        if (!cfg || !cfg.breakEnable) return NaN;
        const domain = scale.domain();
        if (!Array.isArray(domain) || domain.length !== 4) return NaN;
        const range = scale.range();
        if (!Array.isArray(range) || range.length !== 4) return NaN;
        return (range[1] + range[2]) / 2;
    }

    function resolveTicks(cfg, scale) {
        if (cfg.tickValueAuto) return null;
        const raw = String(cfg.tickValueCustom || '').trim();
        if (!raw) return null;
        const arr = raw.split(/[,，;\s]+/).map(s => parseFloat(s)).filter(v => isFinite(v));
        return arr.length ? arr : null;
    }

    function resolveCrossValue(cfg, domain) {
        const [lo, hi] = domain;
        switch (cfg.crossMode) {
            case 'zero':   return 0;
            case 'min':    return lo;
            case 'max':    return hi;
            case 'custom': return cfg.crossValue;
            case 'auto':
            default:       return lo;
        }
    }

    function drawGrid(g, scale, cfg, plotRect, axis, tickValues) {
        if (!cfg.gridShow) return;
        const ticks = tickValues || (scale.ticks ? scale.ticks() : scale.domain());
        const grid = g.append('g').attr('class', `grid grid-${axis}`);
        const { x, y, w, h } = plotRect;

        if (axis === 'x') {
            grid.selectAll('line').data(ticks).enter().append('line')
                .attr('x1', d => scale(d) + (scale.bandwidth ? scale.bandwidth() / 2 : 0))
                .attr('x2', d => scale(d) + (scale.bandwidth ? scale.bandwidth() / 2 : 0))
                .attr('y1', y).attr('y2', y + h)
                .attr('stroke', cfg.gridColor).attr('stroke-dasharray', cfg.gridDash).attr('stroke-width', 1);
        } else {
            grid.selectAll('line').data(ticks).enter().append('line')
                .attr('x1', x).attr('x2', x + w)
                .attr('y1', d => scale(d)).attr('y2', d => scale(d))
                .attr('stroke', cfg.gridColor).attr('stroke-dasharray', cfg.gridDash).attr('stroke-width', 1);
        }
    }

    function drawFrameAndRefLines(svg, opts) {
        opts = opts || {};
        const axisCfg = opts.axisCfg || {};
        const plotX = opts.plotX, plotY = opts.plotY;
        const plotW = opts.plotW, plotH = opts.plotH;

        const f = axisCfg.frame;
        if (f && f.show) {
            svg.append('rect')
                .attr('class', 'axis-frame')
                .attr('x', plotX).attr('y', plotY)
                .attr('width', plotW).attr('height', plotH)
                .attr('fill', 'none')
                .attr('stroke', f.color || '#333333')
                .attr('stroke-width', f.width || 1)
                .attr('stroke-dasharray', f.dash ? '5 3' : null)
                .attr('pointer-events', 'none');
        }

        ['x', 'y'].forEach(key => {
            const axCfg = axisCfg[key];
            if (!axCfg || !axCfg.refLines) return;
            const raw = String(axCfg.refLines).trim();
            if (!raw) return;
            const values = raw.split(/[,，\s]+/).map(parseFloat).filter(v => isFinite(v));
            if (!values.length) return;

            const scale = opts[key + 'Scale'];
            if (!scale) return;
            const isLog = axCfg.scaleType === 'log';

            const g = svg.append('g').attr('class', 'axis-ref-lines axis-ref-lines-' + key);
            values.forEach(v => {
                if (isLog && v <= 0) return;
                const pos = Math.round(scale(v)) + 0.5;
                if (!isFinite(pos)) return;
                const line = g.append('line')
                    .attr('stroke', axCfg.refLineColor || '#e15759')
                    .attr('stroke-width', axCfg.refLineWidth || 1.5)
                    .attr('stroke-dasharray', axCfg.refLineDash ? '6 4' : null)
                    .attr('pointer-events', 'none');
                if (key === 'y') {
                    line.attr('x1', plotX).attr('x2', plotX + plotW)
                        .attr('y1', pos).attr('y2', pos);
                } else {
                    line.attr('x1', pos).attr('x2', pos)
                        .attr('y1', plotY).attr('y2', plotY + plotH);
                }
            });
        });
    }

    function applyFontFamily(target, family) {
        if (!target || !family) return;
        const sel = (target.node && typeof target.node === 'function') ? target : d3.select(target);
        sel.selectAll('text').style('font-family', family);
    }

    global.PlotAxis = {
        defaultState,
        singleAxisDefault,
        frameDefault,
        getAxisTypesForDirection,
        render,
        applyAxis,
        applyBreak,
        getBreakPosition,
        resolveDomain,
        resolveTicks,
        resolveCrossValue,
        drawGrid,
        drawFrameAndRefLines,
        applyFontFamily,
        L
    };
})(window);
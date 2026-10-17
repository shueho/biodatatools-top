/* ============================================================
   BioDataTools 色条（图例）设置面板
   全局名：ColorBarSettings
   ============================================================ */
(function (global) {
    'use strict';

    const I18N = {
        zh: {
            appearance: '外观', show: '显示色条', title: '标题',
            orientation: '方向', vertical: '纵向', horizontal: '横向',
            thickness: '粗细', length: '长度', showLabels: '显示刻度', decimals: '小数位数',
            tickSide: '刻度位置', tickSideLeft: '左 / 上', tickSideRight: '右 / 下',
            range: '范围', auto: '自动', min: '最小值', max: '最大值',
            ticks: '刻度', tickAuto: '自动等分', tickCount: '等分数量', tickCustom: '自定义刻度',
            tickPlaceholder: '如 -1, 0, 1',
            titleText: '标题文字', labelText: '刻度文字',
            fontSize: '字号', bold: '粗', italic: '斜'
        },
        en: {
            appearance: 'Appearance', show: 'Show color bar', title: 'Title',
            orientation: 'Orientation', vertical: 'Vertical', horizontal: 'Horizontal',
            thickness: 'Thickness', length: 'Length', showLabels: 'Show ticks', decimals: 'Decimals',
            tickSide: 'Tick side', tickSideLeft: 'Left / Top', tickSideRight: 'Right / Bottom',
            range: 'Range', auto: 'Auto', min: 'Min', max: 'Max',
            ticks: 'Ticks', tickAuto: 'Auto even split', tickCount: 'Count', tickCustom: 'Custom ticks',
            tickPlaceholder: 'e.g. -1, 0, 1',
            titleText: 'Title text', labelText: 'Tick text',
            fontSize: 'Size', bold: 'B', italic: 'I'
        }
    };

    function getLang() {
        return window.location.pathname.includes('/en/') ? 'en' : 'zh';
    }
    function T() {
        return I18N[getLang()] || I18N.zh;
    }

    function defaults() {
        const isEn = getLang() === 'en';
        return {
            show: true,
            title: isEn ? 'Correlation r' : 'Correlation r',
            titleFontSize: 19,
            titleBold: true,
            titleItalic: false,
            orientation: 'vertical',
            thickness: 16,
            length: 120,
            showLabels: true,
            decimals: 1,
            tickSide: 'left',
            offset: { dx: 0, dy: 0 },
            scale: 1,
            rangeAuto: true,
            min: -1,
            max: 1,
            tickAuto: true,
            tickCount: 5,
            tickCustom: '',
            labelFontSize: 11,
            labelBold: true,
            labelItalic: false
        };
    }

    function escapeAttr(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    let styleInjected = false;
    function injectStyle() {
        if (styleInjected) return;
        styleInjected = true;
        const s = document.createElement('style');
        s.id = 'color-bar-panel-style';
        s.textContent = '.hm-subsection{font-size:13px;font-weight:700;color:#1f4068;margin:14px 0 8px 0;padding-bottom:3px;border-bottom:1px solid #e3ebf3;letter-spacing:0.02em;}'
            + '.hm-subsection:first-child{margin-top:0;}';
        document.head.appendChild(s);
    }

    function render(containerOrId, cfg) {
        const c = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
        if (!c) return;
        injectStyle();
        cfg = cfg || defaults();
        const t = T();
        const tickSide = cfg.tickSide || 'left';

        c.innerHTML = ''
            + '<div class="hm-subsection">' + t.appearance + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="cb-show" ' + (cfg.show ? 'checked' : '') + '> ' + t.show + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.title + '</label>'
            + '    <input type="text" class="cb-title" value="' + escapeAttr(cfg.title) + '" style="width:100%;">'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.orientation + '</label>'
            + '    <select class="cb-orientation">'
            + '      <option value="vertical" ' + (cfg.orientation === 'vertical' ? 'selected' : '') + '>' + t.vertical + '</option>'
            + '      <option value="horizontal" ' + (cfg.orientation === 'horizontal' ? 'selected' : '') + '>' + t.horizontal + '</option>'
            + '    </select>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.thickness + '</label>'
            + '    <input type="number" class="cb-thickness" value="' + cfg.thickness + '" min="6" max="60" step="1">'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.length + '</label>'
            + '    <input type="number" class="cb-length" value="' + cfg.length + '" min="40" max="400" step="1">'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="cb-show-labels" ' + (cfg.showLabels ? 'checked' : '') + '> ' + t.showLabels + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.tickSide + '</label>'
            + '    <select class="cb-tick-side">'
            + '      <option value="left" ' + (tickSide === 'left' ? 'selected' : '') + '>' + t.tickSideLeft + '</option>'
            + '      <option value="right" ' + (tickSide === 'right' ? 'selected' : '') + '>' + t.tickSideRight + '</option>'
            + '    </select>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.decimals + '</label>'
            + '    <input type="number" class="cb-decimals" value="' + cfg.decimals + '" min="0" max="6" step="1">'
            + '  </div>'
            + '</div>'

            + '<div class="hm-subsection">' + t.range + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="cb-range-auto" ' + (cfg.rangeAuto ? 'checked' : '') + '> ' + t.auto + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.min + '</label>'
            + '    <input type="number" class="cb-min" value="' + cfg.min + '" step="0.01" ' + (cfg.rangeAuto ? 'disabled' : '') + '>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.max + '</label>'
            + '    <input type="number" class="cb-max" value="' + cfg.max + '" step="0.01" ' + (cfg.rangeAuto ? 'disabled' : '') + '>'
            + '  </div>'
            + '</div>'

            + '<div class="hm-subsection">' + t.ticks + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="cb-tick-auto" ' + (cfg.tickAuto ? 'checked' : '') + '> ' + t.tickAuto + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label>' + t.tickCount + '</label>'
            + '    <input type="number" class="cb-tick-count" value="' + cfg.tickCount + '" min="2" max="20" step="1" ' + (cfg.tickAuto ? '' : 'disabled') + '>'
            + '  </div>'
            + '  <div class="param-item" style="grid-column: span 2;">'
            + '    <label>' + t.tickCustom + '</label>'
            + '    <input type="text" class="cb-tick-custom" value="' + escapeAttr(cfg.tickCustom) + '" placeholder="' + escapeAttr(t.tickPlaceholder) + '" style="flex:1;min-width:160px;" ' + (cfg.tickAuto ? 'disabled' : '') + '>'
            + '  </div>'
            + '</div>'

            + '<div class="hm-subsection">' + t.titleText + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label>' + t.fontSize + '</label>'
            + '    <input type="number" class="cb-title-fs" value="' + cfg.titleFontSize + '" min="6" max="36">'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="cb-title-bold" ' + (cfg.titleBold ? 'checked' : '') + '> ' + t.bold + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="cb-title-italic" ' + (cfg.titleItalic ? 'checked' : '') + '> ' + t.italic + '</label>'
            + '  </div>'
            + '</div>'

            + '<div class="hm-subsection">' + t.labelText + '</div>'
            + '<div class="param-grid cols-4">'
            + '  <div class="param-item">'
            + '    <label>' + t.fontSize + '</label>'
            + '    <input type="number" class="cb-label-fs" value="' + cfg.labelFontSize + '" min="6" max="36">'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="cb-label-bold" ' + (cfg.labelBold ? 'checked' : '') + '> ' + t.bold + '</label>'
            + '  </div>'
            + '  <div class="param-item">'
            + '    <label class="mini-check"><input type="checkbox" class="cb-label-italic" ' + (cfg.labelItalic ? 'checked' : '') + '> ' + t.italic + '</label>'
            + '  </div>'
            + '</div>';
    }

    function syncFromDom(containerOrId, cfg) {
        const c = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
        if (!c) return cfg;
        const q = function (s) { return c.querySelector(s); };
        const val = function (s, fb) { const e = q(s); return e ? e.value : fb; };
        const chk = function (s, fb) { const e = q(s); return e ? e.checked : fb; };
        const num = function (s, fb) { const e = q(s); if (!e) return fb; const v = parseFloat(e.value); return isFinite(v) ? v : fb; };
        const int = function (s, fb) { const e = q(s); if (!e) return fb; const v = parseInt(e.value, 10); return isFinite(v) ? v : fb; };

        cfg.show = chk('.cb-show', cfg.show);
        cfg.title = val('.cb-title', cfg.title);
        cfg.orientation = val('.cb-orientation', cfg.orientation);
        cfg.thickness = Math.max(6, num('.cb-thickness', cfg.thickness));
        cfg.length = Math.max(40, num('.cb-length', cfg.length));
        cfg.showLabels = chk('.cb-show-labels', cfg.showLabels);
        cfg.tickSide = val('.cb-tick-side', cfg.tickSide || 'left');
        cfg.decimals = Math.max(0, Math.min(6, int('.cb-decimals', cfg.decimals)));

        cfg.rangeAuto = chk('.cb-range-auto', cfg.rangeAuto);
        cfg.min = num('.cb-min', cfg.min);
        cfg.max = num('.cb-max', cfg.max);

        cfg.tickAuto = chk('.cb-tick-auto', cfg.tickAuto);
        cfg.tickCount = Math.max(2, Math.min(20, int('.cb-tick-count', cfg.tickCount)));
        cfg.tickCustom = val('.cb-tick-custom', cfg.tickCustom);

        cfg.titleFontSize = Math.max(6, num('.cb-title-fs', cfg.titleFontSize));
        cfg.titleBold = chk('.cb-title-bold', cfg.titleBold);
        cfg.titleItalic = chk('.cb-title-italic', cfg.titleItalic);

        cfg.labelFontSize = Math.max(6, num('.cb-label-fs', cfg.labelFontSize));
        cfg.labelBold = chk('.cb-label-bold', cfg.labelBold);
        cfg.labelItalic = chk('.cb-label-italic', cfg.labelItalic);

        return cfg;
    }

    function updateDisable(containerOrId, cfg) {
        const c = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
        if (!c) return;
        const setDis = function (s, dis) { const e = c.querySelector(s); if (e) e.disabled = dis; };
        setDis('.cb-min', cfg.rangeAuto);
        setDis('.cb-max', cfg.rangeAuto);
        setDis('.cb-tick-count', !cfg.tickAuto);
        setDis('.cb-tick-custom', cfg.tickAuto);
    }

    function bind(containerOrId, cfg, opts) {
        const c = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
        if (!c) return;
        opts = opts || {};

        const fire = function () {
            syncFromDom(c, cfg);
            updateDisable(c, cfg);
            if (opts.onChange) opts.onChange(cfg);
        };

        const inputs = c.querySelectorAll('input, select');
        for (let i = 0; i < inputs.length; i++) {
            const el = inputs[i];
            el.addEventListener('change', fire);
            if (el.type === 'text' || el.type === 'number') el.addEventListener('input', fire);
        }

        const orientSel = c.querySelector('.cb-orientation');
        if (orientSel) {
            orientSel.addEventListener('change', function () {
                cfg.offset = { dx: 0, dy: 0 };
            });
        }
    }

    function resolveRange(cfg, dataMin, dataMax) {
        let min, max;
        if (cfg.rangeAuto) { min = dataMin; max = dataMax; }
        else { min = cfg.min; max = cfg.max; }
        if (!isFinite(min)) min = -1;
        if (!isFinite(max)) max = 1;
        if (min >= max) max = min + 0.01;
        return { min: min, max: max };
    }

    function resolveTicks(cfg, min, max) {
        if (cfg.tickAuto !== false) {
            const count = Math.max(2, Math.min(20, Math.round(cfg.tickCount || 3)));
            const out = [];
            for (let i = 0; i < count; i++) {
                const v = min + (max - min) * i / (count - 1);
                out.push(Number(v.toFixed(10)));
            }
            return out;
        }
        if (cfg.tickCustom && String(cfg.tickCustom).trim()) {
            const arr = String(cfg.tickCustom).split(/[,，\s]+/).map(function (s) { return parseFloat(s); }).filter(function (v) { return isFinite(v); });
            if (arr.length) return arr;
        }
        return [min, max];
    }

    global.ColorBarSettings = {
        defaults: defaults,
        render: render,
        bind: bind,
        syncFromDom: syncFromDom,
        updateDisable: updateDisable,
        resolveRange: resolveRange,
        resolveTicks: resolveTicks,
        L: T
    };
})(window);
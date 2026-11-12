(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';
    const MAX_SETS = 5;
    const SAMPLE_N = 200;
    const BOUNDARY_STEPS = 64;

    const T = {
        importInfo: EN
            ? 'Each column is a <strong>set</strong>; the values in a column are the elements of that set. A header row is required. Up to 5 sets are supported. You can paste directly from Excel.'
            : '每一列代表一个<strong>集合</strong>，列中的值即为该集合的元素。需包含表头，最多支持 5 个集合。可直接粘贴 Excel 内容。',
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectSets: EN ? '❌ Please select at least one set column' : '❌ 请至少选择一个集合列',
        sampleTip: EN ? 'Import data to select sets' : '导入数据后可选择',
        colorEmpty: EN ? 'Set colors will be shown here after selecting set columns' : '选择集合列后将在此处显示每个集合的颜色',
        tooMany: EN ? '❌ Up to 5 sets are supported' : '❌ 最多支持 5 个集合',
        emptySet: EN ? 'Selected columns contain no valid elements' : '所选列中没有有效元素'
    };

    const LAYOUT = {
        1: [
            { cx: 0, cy: 0, rx: 1, ry: 1, rotation: 0 }
        ],
4: [
    { cx: 181, cy: 238, rx: 185, ry: 115, rotation:  40, labelX:  51, labelY: 320 },
    { cx: 242, cy: 177, rx: 185, ry: 115, rotation:  40, labelX: 120, labelY:  40 },
    { cx: 259, cy: 177, rx: 185, ry: 115, rotation: 140, labelX: 381, labelY:  40 },
    { cx: 320, cy: 238, rx: 185, ry: 115, rotation: 140, labelX: 450, labelY: 320 }
],
        5: [
            { cx: 455.54, cy: 377.84, rx: 240, ry: 460, rotation:    0, labelX:  500, labelY: -100 },
            { cx: 370.08, cy: 504.54, rx: 240, ry: 460, rotation:  110, labelX:  -60, labelY:  180 },
            { cx: 464.17, cy: 624.96, rx: 240, ry: 460, rotation: -145, labelX:    0, labelY: 1040 },
            { cx: 607.77, cy: 572.70, rx: 240, ry: 460, rotation:  -35, labelX:  780, labelY: 1040 },
            { cx: 602.44, cy: 419.96, rx: 240, ry: 460, rotation: 72.5, labelX: 1060, labelY:  250 }
        ]
    };

    function buildDynamicLayout(n, p) {
        if (n === 2) {
            const cx = Math.max(0.05, p.vennCircleOffset * 0.7);
            const r = 0.72;
            return [
                { cx: -cx, cy: 0, rx: r, ry: r, rotation: 0 },
                { cx:  cx, cy: 0, rx: r, ry: r, rotation: 0 }
            ];
        }
        if (n === 3) {
            const Rc = Math.max(0.05, p.vennCircleOffset * 1.1);
            const r = 0.75;
            const h = Rc * Math.sqrt(3) / 2;
            if (p.vennTriangleLayout === 'down') {
                return [
                    { cx: -h, cy: -Rc * 0.5, rx: r, ry: r, rotation: 0 },
                    { cx:  h, cy: -Rc * 0.5, rx: r, ry: r, rotation: 0 },
                    { cx:  0, cy:  Rc,       rx: r, ry: r, rotation: 0 }
                ];
            }
            return [
                { cx:  0, cy: -Rc,       rx: r, ry: r, rotation: 0 },
                { cx: -h, cy:  Rc * 0.5, rx: r, ry: r, rotation: 0 },
                { cx:  h, cy:  Rc * 0.5, rx: r, ry: r, rotation: 0 }
            ];
        }
        return LAYOUT[n];
    }

    let _styleInjected = false;
    function injectVennStyle() {
        if (_styleInjected) return;
        _styleInjected = true;
        const s = document.createElement('style');
        s.id = 'venn-style';
        s.textContent = `
.venn-modal{position:fixed;inset:0;background:rgba(15,35,60,0.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;}
.venn-modal-content{background:#fff;border-radius:10px;width:min(520px,92vw);max-height:82vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(15,35,60,0.3);overflow:hidden;}
.venn-modal-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e3ebf3;font-weight:700;color:#1f4068;font-size:14px;gap:12px;}
.venn-modal-header span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.venn-modal-close{background:none;border:none;font-size:24px;cursor:pointer;color:#999;line-height:1;padding:0 4px;flex-shrink:0;}
.venn-modal-close:hover{color:#333;}
.venn-modal-body{flex:1;padding:12px 16px;min-height:0;}
.venn-modal-body textarea{width:100%;height:100%;min-height:220px;resize:vertical;border:1px solid #d0d8e0;border-radius:6px;padding:10px;font-family:Consolas,Monaco,"Courier New",monospace;font-size:13px;line-height:1.6;box-sizing:border-box;background:#fafcfe;color:#333;}
.venn-modal-footer{padding:10px 16px;border-top:1px solid #e3ebf3;text-align:right;}
`;
        document.head.appendChild(s);
    }

    function pointInEllipse(px, py, s) {
        const rot = (s.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rot), sin = Math.sin(rot);
        const dx = px - s.cx, dy = py - s.cy;
        const lx = dx * cos + dy * sin;
        const ly = -dx * sin + dy * cos;
        return (lx * lx) / (s.rx * s.rx) + (ly * ly) / (s.ry * s.ry) <= 1;
    }

    function ellipseBoundary(s, steps) {
        const rot = (s.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rot), sin = Math.sin(rot);
        const pts = [];
        const n = steps || BOUNDARY_STEPS;
        for (let i = 0; i < n; i++) {
            const ang = i / n * Math.PI * 2;
            const x = Math.cos(ang) * s.rx;
            const y = Math.sin(ang) * s.ry;
            pts.push([s.cx + x * cos - y * sin, s.cy + x * sin + y * cos]);
        }
        return pts;
    }

    function ellipseAABB(s) {
        const rot = (s.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rot), sin = Math.sin(rot);
        const hw = Math.sqrt(Math.pow(s.rx * cos, 2) + Math.pow(s.ry * sin, 2));
        const hh = Math.sqrt(Math.pow(s.rx * sin, 2) + Math.pow(s.ry * cos, 2));
        return { minX: s.cx - hw, maxX: s.cx + hw, minY: s.cy - hh, maxY: s.cy + hh };
    }

function computeRegionPositions(shapes, n) {
if (n === 2) {
    const r = shapes[0].rx;
    const cx = Math.abs(shapes[0].cx);
    const d = r - cx / 3;
    const positions = new Map();
    positions.set(1, { x: -d, y: 0 });
    positions.set(2, { x:  d, y: 0 });
    positions.set(3, { x: 0,  y: 0 });
    return positions;
}

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    shapes.forEach(s => {
        const bb = ellipseAABB(s);
        if (bb.minX < minX) minX = bb.minX;
        if (bb.maxX > maxX) maxX = bb.maxX;
        if (bb.minY < minY) minY = bb.minY;
        if (bb.maxY > maxY) maxY = bb.maxY;
    });
    const w = Math.max(1e-6, maxX - minX);
    const h = Math.max(1e-6, maxY - minY);

    const acc = {};
    for (let i = 0; i < SAMPLE_N; i++) {
        const x = minX + w * (i + 0.5) / SAMPLE_N;
        for (let j = 0; j < SAMPLE_N; j++) {
            const y = minY + h * (j + 0.5) / SAMPLE_N;
            let mask = 0;
            for (let k = 0; k < n; k++) {
                if (pointInEllipse(x, y, shapes[k])) mask |= (1 << k);
            }
            if (mask === 0) continue;
            if (!acc[mask]) acc[mask] = { sx: 0, sy: 0, cnt: 0 };
            acc[mask].sx += x;
            acc[mask].sy += y;
            acc[mask].cnt++;
        }
    }

    const positions = new Map();
    Object.keys(acc).forEach(k => {
        const a = acc[k];
        positions.set(Number(k), { x: a.sx / a.cnt, y: a.sy / a.cnt });
    });
    return positions;
}
    function computeSetLabelAnchor(shape, shapes) {
        let dx, dy;

        if (shape.labelX != null && shape.labelY != null) {
            dx = shape.labelX - shape.cx;
            dy = shape.labelY - shape.cy;
        } else {
            let sx = 0, sy = 0;
            shapes.forEach(s => { sx += s.cx; sy += s.cy; });
            sx /= shapes.length;
            sy /= shapes.length;
            dx = shape.cx - sx;
            dy = shape.cy - sy;
        }

        const len = Math.hypot(dx, dy);
        if (len < 1e-6) { dx = 0; dy = -1; } else { dx /= len; dy /= len; }

        const bd = ellipseBoundary(shape);
        let anchorX = bd[0][0], anchorY = bd[0][1];
        let bestProj = -Infinity;
        bd.forEach(p => {
            const proj = (p[0] - shape.cx) * dx + (p[1] - shape.cy) * dy;
            if (proj > bestProj) {
                bestProj = proj;
                anchorX = p[0];
                anchorY = p[1];
            }
        });
        return { anchorX: anchorX, anchorY: anchorY, dirX: dx, dirY: dy };
    }

    function updateVennUI(app) {
        const n = (app.state.roles.sets || []).length;
        const offsetItem = app.$('vennCircleOffsetItem');
        const offsetLabel = app.$('vennCircleOffsetLabel');
        const triangleItem = app.$('vennTriangleLayoutItem');
        if (offsetItem) {
            if (n === 2 || n === 3) {
                offsetItem.style.display = '';
                if (offsetLabel) offsetLabel.textContent = (n === 2) ? '集合间距' : '集合收缩';
            } else {
                offsetItem.style.display = 'none';
            }
        }
        if (triangleItem) {
            triangleItem.style.display = n === 3 ? '' : 'none';
        }
    }

    function renderSetCols(app) {
        const box = app.$('setColsBox');
        const state = app.state;
        if (!box) return;
        if (!state.headers.length) {
            box.innerHTML = '<span style="color:#999;">' + T.sampleTip + '</span>';
            updateVennUI(app);
            return;
        }
        box.innerHTML = state.headers.map(h => {
            const checked = state.roles.sets.indexOf(h) >= 0 ? 'checked' : '';
            return '<label><input type="checkbox" class="set-col-cb" value="' +
                PC.escapeHtml(h) + '" ' + checked + '> ' +
                PC.escapeHtml(h) + '</label>';
        }).join('');

        if (box._delegated) return;
        box._delegated = true;
        box.addEventListener('change', e => {
            if (!e.target.classList.contains('set-col-cb')) return;
            const checked = Array.from(box.querySelectorAll('.set-col-cb:checked'));
            if (checked.length > MAX_SETS) {
                e.target.checked = false;
                app.showTip('msgTip3', T.tooMany, 'error');
                return;
            }
            state.roles.sets = checked.map(x => x.value);
            state.customColors = {};
            refreshSetColors(app);
            updateVennUI(app);
            if (state.data.length) app.drawChart();
        });

        updateVennUI(app);
    }

    function refreshSetColors(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const sets = app.state.roles.sets || [];
        if (!sets.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const baseColors = app.resolvePaletteColors(sets.length);
        PC.renderColorAssignment(container, {
            items: sets.map((s, i) => ({
                name: s,
                color: app.state.customColors[s] || baseColors[i]
            })),
            onChange: (idx, newColor) => {
                app.state.customColors[sets[idx]] = newColor;
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: () => {
                app.state.customColors = {};
                refreshSetColors(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    function computeRegions(cols, data) {
        const sets = cols.map(col => {
            const elements = new Set();
            data.forEach(row => {
                const v = row[col];
                if (v === undefined || v === null) return;
                const s = String(v).trim();
                if (s === '') return;
                elements.add(s);
            });
            return { name: col, elements };
        });

        const allElements = new Set();
        sets.forEach(s => s.elements.forEach(e => allElements.add(e)));

        const regions = {};
        allElements.forEach(elem => {
            let mask = 0;
            sets.forEach((s, i) => {
                if (s.elements.has(elem)) mask |= (1 << i);
            });
            if (mask === 0) return;
            let key = '';
            for (let i = 0; i < sets.length; i++) {
                key += (mask & (1 << i)) ? '1' : '0';
            }
            if (!regions[key]) regions[key] = [];
            regions[key].push(elem);
        });

        return { sets, regions, total: allElements.size };
    }

function showRegionModal(mask, elements, sets, onClose) {
    const existing = document.getElementById('vennRegionModal');
    if (existing) existing.remove();

    const included = [];
    const excluded = [];
    for (let i = 0; i < sets.length; i++) {
        if (mask[i] === '1') included.push(sets[i]);
        else excluded.push(sets[i]);
    }

    const title = included.join(' ∩ ') +
        (excluded.length
            ? (EN ? ' (not ' + excluded.join(', ') + ')' : '（不含 ' + excluded.join('、') + '）')
            : '');

    const modal = document.createElement('div');
    modal.id = 'vennRegionModal';
    modal.className = 'venn-modal';
    modal.innerHTML = `
        <div class="venn-modal-content">
            <div class="venn-modal-header">
                <span></span>
                <button class="venn-modal-close" type="button">×</button>
            </div>
            <div class="venn-modal-body">
                <textarea readonly></textarea>
            </div>
            <div class="venn-modal-footer">
                <span class="venn-copy-hint" style="display:none;color:#2e7d32;font-size:13px;margin-right:10px;"></span>
                <button class="btn venn-copy-btn" type="button">${EN ? 'Copy all' : '复制全部'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.venn-modal-header span').textContent =
        title + ' · ' + elements.length + (EN ? ' elements' : ' 个元素');
    modal.querySelector('textarea').value = elements.join('\n');

    const close = () => {
        modal.remove();
        if (onClose) onClose();
    };

    modal.querySelector('.venn-modal-close').addEventListener('click', close);
    modal.addEventListener('mousedown', e => { if (e.target === modal) close(); });

    const copyBtn = modal.querySelector('.venn-copy-btn');
    const hint = modal.querySelector('.venn-copy-hint');

    copyBtn.addEventListener('click', () => {
        const ta = modal.querySelector('textarea');
        ta.select();
        ta.setSelectionRange(0, ta.value.length);

        const done = () => {
            hint.textContent = EN ? 'Copied' : '已复制';
            hint.style.display = 'inline';
            clearTimeout(hint._timer);
            hint._timer = setTimeout(() => { hint.style.display = 'none'; }, 1500);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(ta.value).then(done).catch(() => {
                try { document.execCommand('copy'); done(); } catch (_) {}
            });
        } else {
            try { document.execCommand('copy'); done(); } catch (_) {}
        }
    });

    const onKey = e => {
        if (e.key === 'Escape') {
            close();
            document.removeEventListener('keydown', onKey);
        }
    };
    document.addEventListener('keydown', onKey);
}

    function readParams(app) {
        const p = PC.readCommonParams(app, { width: 700, height: 600 });
        p.vennOpacity = Math.max(0.05, Math.min(1, PC.num(app, 'vennOpacity', 0.35)));
        p.vennStrokeWidth = Math.max(0, PC.num(app, 'vennStrokeWidth', 2));
        p.vennStrokeColorMode = app.$('vennStrokeColorMode').value || 'group';
        p.vennStrokeColor = app.$('vennStrokeColor').value || '#333333';
        p.vennCircleOffset = app.$('vennCircleOffset')
            ? Math.max(0.1, Math.min(1.0, PC.num(app, 'vennCircleOffset', 0.5)))
            : 0.5;
        p.vennTriangleLayout = app.$('vennTriangleLayout')
            ? (app.$('vennTriangleLayout').value || 'up')
            : 'up';
        p.vennShowLabels = app.$('vennShowLabels').checked;
        p.vennShowZeroLabels = app.$('vennShowZeroLabels').checked;
        p.vennShowSetNames = app.$('vennShowSetNames').checked;
        p.vennLabelFontSize = Math.max(8, PC.num(app, 'vennLabelFontSize', 14));
        p.vennLabelBold = app.$('vennLabelBold').checked;
        p.vennLabelItalic = app.$('vennLabelItalic').checked;
        p.vennLabelColor = app.$('vennLabelColor').value || '#333333';
        p.vennLabelContent = app.$('vennLabelContent').value || 'count';
        p.vennZeroBold = app.$('vennZeroBold').checked;
        p.vennZeroItalic = app.$('vennZeroItalic').checked;
        p.vennZeroColor = app.$('vennZeroColor').value || '#999999';
        p.vennSetNameFontSize = Math.max(8, PC.num(app, 'vennSetNameFontSize', 16));
        p.vennSetNameBold = app.$('vennSetNameBold').checked;
        p.vennSetNameItalic = app.$('vennSetNameItalic').checked;
        p.vennSetNameColorMode = app.$('vennSetNameColorMode').value || 'group';
        p.vennSetNameColor = app.$('vennSetNameColor').value || '#333333';
        p.vennSetNameOffset = Math.max(0, PC.num(app, 'vennSetNameOffset', 20));
        return p;
    }

    function drawChart(app) {
        const state = app.state;
        if (!state.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        const sets = state.roles.sets || [];
        if (!sets.length) { app.showTip('msgTip3', T.selectSets, 'error'); return; }

        const data = computeRegions(sets, state.data);
        if (!data.total) { app.showTip('msgTip3', T.emptySet, 'error'); return; }

        const p = readParams(app);
        const n = sets.length;
        const width = p.width;
        const height = p.height;

        const canvas = PlotCanvas.create(app.chartPreview, {
            width, height,
            fontFamily: p.fontFamily,
            border: p.showCanvasBorder
        });
        const svg = canvas.root;
        state.currentSvg = canvas.node;

        const source = buildDynamicLayout(n, p);
        if (!source) { app.showTip('msgTip3', 'Unsupported set count', 'error'); return; }

        const shapes = source.map(s => ({ ...s }));
        shapes.forEach(s => {
            const lp = computeSetLabelAnchor(s, shapes);
            s.anchorX = lp.anchorX;
            s.anchorY = lp.anchorY;
            s.dirX = lp.dirX;
            s.dirY = lp.dirY;
        });

        const regionPositions = computeRegionPositions(shapes, n);

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        shapes.forEach(s => {
            const bb = ellipseAABB(s);
            if (bb.minX < minX) minX = bb.minX;
            if (bb.maxX > maxX) maxX = bb.maxX;
            if (bb.minY < minY) minY = bb.minY;
            if (bb.maxY > maxY) maxY = bb.maxY;
            if (s.anchorX < minX) minX = s.anchorX;
            if (s.anchorX > maxX) maxX = s.anchorX;
            if (s.anchorY < minY) minY = s.anchorY;
            if (s.anchorY > maxY) maxY = s.anchorY;
        });

        const margin = 60;
        const availW = Math.max(20, width - 2 * margin);
        const availH = Math.max(20, height - 2 * margin);
        const boxW = Math.max(1e-6, maxX - minX);
        const boxH = Math.max(1e-6, maxY - minY);
        const scale = Math.min(availW / boxW, availH / boxH);

        const cxMid = (minX + maxX) / 2;
        const cyMid = (minY + maxY) / 2;
        const tx = width / 2 - cxMid * scale;
        const ty = height / 2 - cyMid * scale;
        const toPx = (x, y) => ({ x: x * scale + tx, y: y * scale + ty });

        const baseColors = app.resolvePaletteColors(n);
        const colors = sets.map((s, i) => state.customColors[s] || baseColors[i]);
        const strokeColorOf = i => p.vennStrokeColorMode === 'uniform' ? p.vennStrokeColor : colors[i];
        const setNameColorOf = i => p.vennSetNameColorMode === 'uniform' ? p.vennSetNameColor : colors[i];
const shapesG = svg.append('g').attr('class', 'venn-shapes');
shapes.forEach((s, i) => {
    const c = toPx(s.cx, s.cy);
    shapesG.append('ellipse')
        .attr('class', 'venn-shape')
        .attr('data-idx', i)
        .attr('cx', c.x).attr('cy', c.y)
        .attr('rx', s.rx * scale).attr('ry', s.ry * scale)
        .attr('transform', `rotate(${s.rotation || 0} ${c.x} ${c.y})`)
        .attr('fill', colors[i])
        .attr('fill-opacity', p.vennOpacity)
        .attr('stroke', strokeColorOf(i))
        .attr('stroke-width', p.vennStrokeWidth)
        .attr('stroke-opacity', 0.85);
});

let persistentHighlight = false;
function setHighlight(maskBits) {
    svg.selectAll('.venn-shape').each(function () {
        const el = d3.select(this);
        const idx = +this.getAttribute('data-idx');
        if (maskBits == null) {
            el.attr('fill-opacity', p.vennOpacity)
              .attr('stroke-width', p.vennStrokeWidth)
              .attr('stroke-opacity', 0.85);
        } else {
            const involved = (maskBits >> idx) & 1;
            if (involved) {
                el.attr('fill-opacity', p.vennOpacity)
                  .attr('stroke-width', p.vennStrokeWidth)
                  .attr('stroke-opacity', 0.85);
            } else {
                el.attr('fill-opacity', p.vennOpacity * 0.15)
                  .attr('stroke-width', p.vennStrokeWidth)
                  .attr('stroke-opacity', 0.2);
            }
        }
    });
}

        if (p.vennShowSetNames) {
            const namesG = svg.append('g').attr('class', 'venn-set-names');
            shapes.forEach((s, i) => {
                const anc = toPx(s.anchorX, s.anchorY);
                const lx = anc.x + s.dirX * p.vennSetNameOffset;
                const ly = anc.y + s.dirY * p.vennSetNameOffset;
                let anchor = 'middle';
                if (s.dirX > 0.3) anchor = 'start';
                else if (s.dirX < -0.3) anchor = 'end';

                namesG.append('text')
                    .attr('x', lx).attr('y', ly)
                    .attr('text-anchor', anchor)
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', p.vennSetNameFontSize)
                    .attr('font-weight', p.vennSetNameBold ? 'bold' : 'normal')
                    .attr('font-style', p.vennSetNameItalic ? 'italic' : 'normal')
                    .attr('fill', setNameColorOf(i))
                    .text(sets[i]);
            });
        }

        if (p.vennShowLabels) {
            const labelsG = svg.append('g').attr('class', 'venn-labels');
            const nMask = (1 << n) - 1;
            const twoLine = (p.vennLabelContent === 'both');
            const subRatio = 0.75;

            for (let m = 1; m <= nMask; m++) {
                let key = '';
                for (let i = 0; i < n; i++) {
                    key += ((m >> i) & 1) ? '1' : '0';
                }
                const elems = data.regions[key] || [];
                const cnt = elems.length;
                if (cnt === 0 && !p.vennShowZeroLabels) continue;

                const pos = regionPositions.get(m);
                if (!pos) continue;

                const pxPos = toPx(pos.x, pos.y);
                const fs = p.vennLabelFontSize;
                const clickR = Math.max(18, fs * 1.6);
                const clickH = twoLine ? fs * 2.2 : fs * 1.5;

                const isZero = cnt === 0;
                const fontWeight = isZero
                    ? (p.vennZeroBold ? 'bold' : 'normal')
                    : (p.vennLabelBold ? 'bold' : 'normal');
                const fontStyle = isZero
                    ? (p.vennZeroItalic ? 'italic' : 'normal')
                    : (p.vennLabelItalic ? 'italic' : 'normal');
                const fill = isZero ? p.vennZeroColor : p.vennLabelColor;

const labelGroup = labelsG.append('g')
    .attr('class', 'venn-label')
    .style('cursor', cnt > 0 ? 'pointer' : 'default')
    .on('mouseenter', function () { if (!persistentHighlight) setHighlight(m); })
    .on('mouseleave', function () { if (!persistentHighlight) setHighlight(null); });

labelGroup.on('click', function (event) {
    event.stopPropagation();
    if (cnt > 0) {
        persistentHighlight = true;
        setHighlight(m);
        showRegionModal(key, elems, sets, () => {
            persistentHighlight = false;
            setHighlight(null);
        });
    }
});

                labelGroup.append('rect')
                    .attr('x', pxPos.x - clickR)
                    .attr('y', pxPos.y - clickH / 2)
                    .attr('width', clickR * 2)
                    .attr('height', clickH)
                    .attr('fill', 'transparent')
                    .attr('pointer-events', 'all');

                if (twoLine) {
                    const pct = data.total > 0 ? (cnt / data.total * 100).toFixed(1) : '0.0';
                    labelGroup.append('text')
                        .attr('x', pxPos.x).attr('y', pxPos.y - fs * 0.4)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', fs)
                        .attr('font-weight', fontWeight)
                        .attr('font-style', fontStyle)
                        .attr('fill', fill)
                        .style('pointer-events', 'none')
                        .text(String(cnt));
                    labelGroup.append('text')
                        .attr('x', pxPos.x).attr('y', pxPos.y + fs * 0.55)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', Math.max(8, fs * subRatio))
                        .attr('font-weight', fontWeight)
                        .attr('font-style', fontStyle)
                        .attr('fill', fill)
                        .style('pointer-events', 'none')
                        .text('(' + pct + '%)');
                } else {
                    let text;
                    if (p.vennLabelContent === 'percent') {
                        text = data.total > 0 ? (cnt / data.total * 100).toFixed(1) + '%' : '0.0%';
                    } else {
                        text = String(cnt);
                    }
                    labelGroup.append('text')
                        .attr('x', pxPos.x).attr('y', pxPos.y)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', fs)
                        .attr('font-weight', fontWeight)
                        .attr('font-style', fontStyle)
                        .attr('fill', fill)
                        .style('pointer-events', 'none')
                        .text(text);
                }
            }
        }

        if (p.showLegend) {
            PC.drawLegendOverlay(svg, {
                p: p,
                items: sets.map(s => ({ name: s, percent: null })),
                colors: colors,
                shape: 'rect',
                labelFormatter: it => it.name
            });
        }

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }

    PlotApp.create({
        exportName: 'venn_chart',
        exampleData: 'Group1\tGroup2\tGroup3\tGroup4\tGroup5\nGeneA\tGeneA\tGeneB\tGeneC\tGeneD\nGeneB\tGeneC\tGeneC\tGeneA\tGeneF\nGeneC\tGeneD\tGeneE\tGeneE\tGeneH\nGeneD\tGeneE\t\tGeneG\tGeneI\nGeneF\tGeneF\t\t\t\n',
        importInfo: T.importInfo,

        stateExtra: {
            roles: { category: '', value: '', sets: [] },
            vennOpacity: 0.35,
            vennStrokeWidth: 2,
            vennStrokeColorMode: 'group',
            vennStrokeColor: '#333333',
            vennShowLabels: true,
            vennShowZeroLabels: false,
            vennShowSetNames: true,
            vennLabelFontSize: 14,
            vennLabelBold: false,
            vennLabelItalic: false,
            vennLabelColor: '#333333',
            vennLabelContent: 'count',
            vennZeroBold: false,
            vennZeroItalic: true,
            vennZeroColor: '#999999',
            vennSetNameFontSize: 16,
            vennSetNameBold: true,
            vennSetNameItalic: false,
            vennSetNameColorMode: 'group',
            vennSetNameColor: '#333333',
            vennSetNameOffset: 20
        },

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = 'Sets';
            }
        },

        setup: function (app) {
            injectVennStyle();
            renderSetCols(app);
            refreshSetColors(app);
        },

        onDataImported: function (app, res) {
            const allCols = res.headers.slice();
            const defSets = allCols.slice(0, Math.min(3, allCols.length));
            app.state.roles = { category: '', value: '', sets: defSets };
            app.state.customColors = {};
            renderSetCols(app);
            refreshSetColors(app);
        },

        onReset: function (app) {
            app.state.roles = { category: '', value: '', sets: [] };
            renderSetCols(app);
            refreshSetColors(app);
        },

        onStateRestored: function (app) {
            if (!app.state.roles.sets) app.state.roles.sets = [];
            renderSetCols(app);
            refreshSetColors(app);
        },

        refreshColors: function (app) {
            refreshSetColors(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
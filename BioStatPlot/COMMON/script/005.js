(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';
    const T = {
        importInfo: EN
            ? 'Must include a header row with a <strong>category column</strong>, a <strong>value column</strong>, and columns for error bars (<strong>Lower/Upper</strong> for range bars, or <strong>Error</strong> for error-value bars). You can paste directly from Excel.'
            : '需包含表头，至少包含 <strong>分类列</strong> 和 <strong>数值列</strong>，以及误差棒所需的列（<strong>上下限</strong> 用于范围棒，或 <strong>误差值</strong> 用于误差值棒）。可直接粘贴 Excel 内容。'
    };

    const EX_COMBO =
        'Category\tValue\tLower\tUpper\tError\n' +
        'A\t180\t160\t200\t20\n' +
        'B\t320\t290\t350\t30\n' +
        'C\t75\t60\t90\t15\n' +
        'D\t240\t215\t265\t25\n' +
        'E\t50\t40\t60\t10\n' +
        'F\t150\t130\t170\t20\n' +
        'G\t290\t265\t315\t25';

    function getMaxValue(app) {
        const items = app.getCategoryItems();
        if (!items.length) return 1;
        const mx = Math.max.apply(null, items.map(d => d.value));
        return (isFinite(mx) && mx > 0) ? mx : 1;
    }

    function updateRefModeUI(app) {
        const sel = app.$('refMode');
        const input = app.$('refValue');
        const isCustom = sel.value === 'custom';
        input.disabled = !isCustom;
        input.style.opacity = isCustom ? '1' : '.5';
        if (!app.state.refValueEdited) input.value = getMaxValue(app);
    }

    function getItemsWithRows(app) {
        const items = app.getCategoryItems();
        const catKey = app.state.roles.category;
        const rowMap = new Map();
        app.state.data.forEach(row => {
            const k = String(row[catKey]);
            if (!rowMap.has(k)) rowMap.set(k, row);
        });
        return items.map(it => Object.assign({}, it, { _firstRow: rowMap.get(it.name) || {} }));
    }

    function refreshErrorBarPanel(app) {
        PlotErrorBar.renderErrorBarConfig(app.$('errorBarPanelContainer'), {
            headers: app.state.headers,
            state: app.state.errBar,
            onChange: () => { if (app.state.currentSvg) app.drawChart(); }
        });
    }

    PlotApp.create({
        exportName: 'radial_bar_chart',
        exampleData: EX_COMBO,
        importInfo: T.importInfo,

        stateExtra: {
            refValueEdited: false,
            errBar: {
                mode: 'none', lowerCol: '', upperCol: '', errCol: '',
                showWhich: 'both', colorMode: 'uniform',
                errColor: '#e67700', errWidth: 3, capWidth: 8
            }
        },

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = app.state.roles.category || '';
            }
        },

        setup: function (app) {
            updateRefModeUI(app);
            refreshErrorBarPanel(app);
            app.$('refMode').addEventListener('change', () => {
                updateRefModeUI(app);
                if (app.state.currentSvg) app.drawChart();
            });
            app.$('refValue').addEventListener('input', () => {
                app.state.refValueEdited = true;
            });
        },

        onDataImported: function (app) {
            app.state.refValueEdited = false;
            app.state.errBar.mode = 'none';
            app.state.errBar.lowerCol = '';
            app.state.errBar.upperCol = '';
            app.state.errBar.errCol = '';
            updateRefModeUI(app);
            refreshErrorBarPanel(app);
        },
        onRoleChanged: function (app) {
            app.state.refValueEdited = false;
            updateRefModeUI(app);
        },
        onReset: function (app) {
            app.state.refValueEdited = false;
            app.state.errBar.mode = 'none';
            app.state.errBar.lowerCol = '';
            app.state.errBar.upperCol = '';
            app.state.errBar.errCol = '';
            updateRefModeUI(app);
            refreshErrorBarPanel(app);
        },
        onStateRestored: function (app) {
            refreshErrorBarPanel(app);
            updateRefModeUI(app);
        },

        readParams: function (app) {
            const p = PC.readCommonParams(app, { width: 760, height: 680 });
            const $ = app.$;

            p.innerRadius = Math.max(0, PC.num(app, 'innerRadius', 50));
            p.outerRadius = Math.max(60, PC.num(app, 'outerRadius', 230));
            p.ringGap = Math.max(0, PC.num(app, 'ringGap', 8));
            p.startAngle = PC.num(app, 'startAngle', 0);
            p.direction = $('orbitDirection').value || 'clockwise';
            p.ringOrder = $('ringOrder').value || 'inner';

            p.refMode = $('refMode').value || 'max';
            p.refValue = PC.num(app, 'refValue', 1);

            p.showTrackBg = $('showTrackBg').checked;
            p.trackBgColor = $('trackBgColor').value || '#eef2f7';
            p.showTrackStroke = $('showTrackStroke').checked;
            p.trackStrokeColor = $('trackStrokeColor').value || '#d0d8e2';
            p.roundCap = $('roundCap').checked;

            p.labelContent = $('labelContent').value || 'none';
            p.labelDecimals = Math.max(0, Math.round(PC.num(app, 'labelDecimals', 1)));
            p.labelFontSize = Math.max(6, PC.num(app, 'labelFontSize', 13));
            p.labelBold = $('labelBold').checked;
            p.labelItalic = $('labelItalic').checked;

            return p;
        },

        buildData: function (app, p) {
            return getItemsWithRows(app);
        },

        computeLayout: function (p, items, app) {
            const margin = 30;
            const availR = Math.max(20, Math.min(p.width - 2 * margin, p.height - 2 * margin) / 2);

            let outerR = Math.max(p.innerRadius + 20, p.outerRadius);
            let innerR = Math.max(0, p.innerRadius);
            if (outerR > availR) {
                const k = availR / outerR;
                outerR *= k;
                innerR *= k;
            }
            innerR = Math.min(innerR, outerR - 10);

            return {
                cx: p.width / 2,
                cy: p.height / 2,
                innerR: innerR,
                outerR: outerR
            };
        },

        draw: function (ctx) {
            const app = ctx.app;
            const root = ctx.root;
            const p = ctx.p;
            const items = ctx.data;
            const colors = ctx.colors;
            const L = ctx.layout;
            const cx = L.cx;
            const cy = L.cy;
            const innerR = L.innerR;
            const outerR = L.outerR;
            const N = items.length;

            const maxValue = Math.max.apply(null, items.map(d => d.value));
            let ref = (p.refMode === 'max') ? maxValue : p.refValue;
            if (!isFinite(ref) || ref <= 0) ref = maxValue;
            if (!isFinite(ref) || ref <= 0) ref = 1;

            const spanR = Math.max(10, outerR - innerR);
            let ringGap = p.ringGap;
            let ringW = (N === 1) ? spanR : (spanR - ringGap * (N - 1)) / N;
            if (ringW < 2) {
                ringW = Math.max(1, spanR / N);
                ringGap = (N > 1) ? Math.max(0, (spanR - ringW * N) / (N - 1)) : 0;
            }

            function rMidOf(i) {
                const idx = (p.ringOrder === 'outer') ? (N - 1 - i) : i;
                return innerR + idx * (ringW + ringGap) + ringW / 2;
            }

            const startDeg = p.startAngle;
            const isCCW = p.direction === 'counterclockwise';
            const startRad = startDeg * Math.PI / 180;

            function angleAt(t) {
                return isCCW ? (startRad - t * 2 * Math.PI) : (startRad + t * 2 * Math.PI);
            }
            function pointAt(r, t) {
                const a = angleAt(t);
                return [r * Math.sin(a), -r * Math.cos(a)];
            }

            const g = root.append('g').attr('transform', 'translate(' + cx + ',' + cy + ')');

            if (p.showTrackBg || p.showTrackStroke) {
                const bgGroup = g.append('g').attr('class', 'orbit-tracks');
                items.forEach((it, i) => {
                    const rMid = rMidOf(i);
                    if (p.showTrackBg) {
                        bgGroup.append('circle')
                            .attr('cx', 0).attr('cy', 0)
                            .attr('r', rMid)
                            .attr('fill', 'none')
                            .attr('stroke', p.trackBgColor)
                            .attr('stroke-width', ringW);
                    }
                    if (p.showTrackStroke) {
                        const rOuter = rMid + ringW / 2;
                        const rInner = rMid - ringW / 2;
                        if (rOuter > 1) {
                            bgGroup.append('circle')
                                .attr('cx', 0).attr('cy', 0).attr('r', rOuter)
                                .attr('fill', 'none').attr('stroke', p.trackStrokeColor).attr('stroke-width', 1);
                        }
                        if (rInner > 1) {
                            bgGroup.append('circle')
                                .attr('cx', 0).attr('cy', 0).attr('r', rInner)
                                .attr('fill', 'none').attr('stroke', p.trackStrokeColor).attr('stroke-width', 1);
                        }
                    }
                });
            }

            const arcGroup = g.append('g').attr('class', 'orbit-arcs');
            const errGroup = g.append('g').attr('class', 'orbit-error-bars');
            const labelGroup = g.append('g').attr('class', 'orbit-labels');

            const labelWeight = p.labelBold ? 'bold' : 'normal';
            const labelStyle = p.labelItalic ? 'italic' : 'normal';

            items.forEach((it, i) => {
                const rMid = rMidOf(i);
                const C = 2 * Math.PI * rMid;
                const frac = Math.max(0, Math.min(1, it.value / ref));
                const arcDeg = frac * 360;
                const dashLen = Math.min(C, frac * C);
                const rotDeg = startDeg - 90;

                if (dashLen > 0) {
                    const circleEl = arcGroup.append('circle')
                        .attr('cx', 0).attr('cy', 0)
                        .attr('r', rMid)
                        .attr('fill', 'none')
                        .attr('stroke', colors[i])
                        .attr('stroke-width', ringW)
                        .attr('stroke-dasharray', dashLen + ' ' + C)
                        .attr('stroke-linecap', p.roundCap ? 'round' : 'butt')
                        .style('cursor', 'pointer');

                    if (isCCW) {
                        circleEl.attr('transform', 'rotate(' + rotDeg + ') scale(1,-1)');
                    } else {
                        circleEl.attr('transform', 'rotate(' + rotDeg + ')');
                    }

                    circleEl
                        .on('mouseenter', function () {
                            d3.select(this).transition().duration(120).attr('stroke-width', ringW * 1.18);
                        })
                        .on('mouseleave', function () {
                            d3.select(this).transition().duration(120).attr('stroke-width', ringW);
                        });
                }

                if (app.state.errBar.mode !== 'none') {
                    const ext = PlotErrorBar.computeErrorExtent(it._firstRow, it.value, app.state.errBar);
                    if (ext) {
                        let t1 = ext.lower / ref;
                        let t2 = ext.upper / ref;
                        t1 = Math.max(0, Math.min(1, t1));
                        t2 = Math.max(0, Math.min(1, t2));
                        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }

                        if (t2 - t1 > 0.0005) {
                            const p1 = pointAt(rMid, t1);
                            const p2 = pointAt(rMid, t2);
                            const sweep = isCCW ? 0 : 1;
                            const largeArc = (t2 - t1) > 0.5 ? 1 : 0;
                            const errColor = PlotErrorBar.resolveErrorColor(app.state.errBar, colors[i]);

                            errGroup.append('path')
                                .attr('d', 'M ' + p1[0] + ' ' + p1[1] + ' A ' + rMid + ' ' + rMid + ' 0 ' + largeArc + ' ' + sweep + ' ' + p2[0] + ' ' + p2[1])
                                .attr('fill', 'none')
                                .attr('stroke', errColor)
                                .attr('stroke-width', app.state.errBar.errWidth)
                                .attr('stroke-linecap', 'butt')
                                .attr('pointer-events', 'none');

                            const capLen = (app.state.errBar.capWidth != null)
                                ? app.state.errBar.capWidth
                                : Math.max(6, ringW * 0.7);
                            [t1, t2].forEach(t => {
                                const a = angleAt(t);
                                const ux = Math.sin(a);
                                const uy = -Math.cos(a);
                                const r1 = rMid - capLen / 2;
                                const r2 = rMid + capLen / 2;
                                errGroup.append('line')
                                    .attr('x1', r1 * ux).attr('y1', r1 * uy)
                                    .attr('x2', r2 * ux).attr('y2', r2 * uy)
                                    .attr('stroke', errColor)
                                    .attr('stroke-width', app.state.errBar.errWidth)
                                    .attr('stroke-linecap', 'round')
                                    .attr('pointer-events', 'none');
                            });
                        }
                    }
                }

                if (p.labelContent === 'none' || arcDeg <= 0) return;

                let midClock;
                if (isCCW) midClock = startDeg - arcDeg / 2;
                else midClock = startDeg + arcDeg / 2;

                const scrRad = (midClock - 90) * Math.PI / 180;
                const lx = rMid * Math.cos(scrRad);
                const ly = rMid * Math.sin(scrRad);

                let txt = '';
                switch (p.labelContent) {
                    case 'name': txt = it.name; break;
                    case 'value': txt = PC.fmtNum(it.value, p.labelDecimals); break;
                    case 'pct': txt = (it.percent * 100).toFixed(p.labelDecimals) + '%'; break;
                    case 'name_pct': txt = it.name + ' (' + (it.percent * 100).toFixed(p.labelDecimals) + '%)'; break;
                }
                if (!txt) return;

                const arcPx = (arcDeg / 360) * C;
                const needPx = PC.estTextWidth(txt, p.labelFontSize);
                if (arcPx < needPx * 0.85) return;

                labelGroup.append('text')
                    .attr('x', lx).attr('y', ly)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', p.labelFontSize)
                    .attr('font-weight', labelWeight)
                    .attr('font-style', labelStyle)
                    .attr('fill', PC.textColorOn(colors[i]))
                    .attr('pointer-events', 'none')
                    .text(txt);
            });

            if (p.showLegend && items.length) {
                PC.drawLegendOverlay(root, {
                    p: p,
                    items: items,
                    colors: colors,
                    shape: 'rect'
                });
            }

            app.exportSvgBtn.disabled = false;
            app.exportPngBtn.disabled = false;
            app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
        }
    });
})();
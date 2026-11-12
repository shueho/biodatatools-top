(function () {
    'use strict';

    const PC = window.PlotCommon;
    const EN = PlotI18N.lang() === 'en';

    const T = {
        noData: EN ? '❌ Please import data first' : '❌ 请先导入数据',
        selectSeq: EN ? '❌ Please select the sequence column' : '❌ 请选择序列列',
        noValid: EN ? '❌ No valid sequences found' : '❌ 未找到有效的序列',
        colorEmpty: EN ? 'Color groups will appear here after importing data' : '导入数据后将在此处显示每个分组的颜色',
        importInfo: EN
            ? 'Headers required. Optionally one column as <strong>Sequence ID</strong> (text), and another as <strong>Consensus</strong> sequence in MEME/minimal motif format, e.g. <code>AC[M:0.6;T:0.4]GT</code>. If no ID column is selected, sequences will be auto-numbered.' +
              '<br><strong>Need to convert your data?</strong><br>' +
              '· If you have a <strong>Motif (MEME/MAST) result file</strong>, please use the <a href="../../en/040.Motif_parser.html" target="_blank" style="color:#1f4068;font-weight:600;text-decoration:underline;">Motif (MEME/MAST) Result Parser</a> to convert it.<br>' +
              '· If you have a <strong>Multiple Sequence Alignment</strong>, please use the <a href="../../en/055.Fasta_alignment_consensus.html" target="_blank" style="color:#1f4068;font-weight:600;text-decoration:underline;">FASTA Alignment to Single-Line Consensus</a> tool to convert it.'
            : '需包含表头。可选一列作为 <strong>序列ID</strong>（文本），另一列为<strong>Consensus序列</strong>，格式如 AC[M:0.6;T:0.4]GT（方括号内为“字母:频率”，未加方括号的单个字母表示频率1.0）。未选择ID列时自动编号为Sequence 1、Sequence 2……' +
              '<br><strong>需要转换数据？</strong><br>' +
              '· 如果您有 <strong>Motif（MEME/MAST）结果文件</strong>，请前往 <a href="../../ch/040.Motif_parser.html" target="_blank" style="color:#1f4068;font-weight:600;text-decoration:underline;">Motif（MEME/MAST）结果解析器</a> 进行转换。<br>' +
              '· 如果您的数据是 <strong>多序列比对结果（FASTA aligned）</strong>，请前往 <a href="../../ch/055.Fasta_alignment_consensus.html" target="_blank" style="color:#1f4068;font-weight:600;text-decoration:underline;">FASTA比对序列转单行序列</a> 进行转换。'
    };

    const EX_DATA = 'Motif_ID\tConsensus\n' +
        'motif_1\tCRLRW[M:0.3125;T:0.1875;I:0.125;K:0.125;L:0.125;V:0.125]NYL[R:0.9375;K:0.0625]P[D:0.4375;G:0.3125;N:0.125;S:0.125][I:0.6875;V:0.1875;L:0.125]KRG[N:0.625;H:0.125;K:0.125;M:0.125][F:0.625;I:0.1875;M:0.125;L:0.0625][S:0.625;T:0.375][E:0.25;P:0.1875;Q:0.1875;F:0.125;K:0.125;R:0.0625;S:0.0625][D:0.5625;E:0.4375]E[E:0.75;D:0.125;K:0.125][D:0.875;E:0.125][L:0.75;T:0.1875;S:0.0625]I[I:0.6875;V:0.1875;L:0.125][R:0.625;H:0.125;K:0.125;Q:0.125]L[H:0.9375;Y:0.0625][S:0.4375;K:0.1875;E:0.125;N:0.125;R:0.125][L:0.75;I:0.125;M:0.125]LG[N:0.9375;S:0.0625][R:0.75;K:0.25]WS[L:0.625;A:0.25;V:0.125]IA[G:0.875;A:0.125][R:0.9375;K:0.0625][L:0.8125;I:0.1875]PGRTDN\n' +
        'motif_2\t[M:0.9286;T:0.0714][G:0.9286;K:0.0714][R:0.9286;V:0.0714][K:0.3571;A:0.2143;T:0.2143;S:0.1429;P:0.0714][P:0.9286;A:0.0714]CC[E:0.2857;S:0.2857;A:0.2143;D:0.1429;V:0.0714]K[E:0.4286;A:0.1429;M:0.1429;N:0.1429;V:0.1429][G:0.8571;H:0.1429][L:0.8571;T:0.1429][K:0.4286;R:0.3571;N:0.2143][K:0.9286;R:0.0714]G[P:0.7857;A:0.1429;T:0.0714]W[T:0.7857;S:0.2143][P:0.4286;S:0.2143;K:0.1429;T:0.1429;A:0.0714][E:0.5714;K:0.3571;M:0.0714]ED[Q:0.4286;E:0.1429;K:0.1429;L:0.1429;M:0.0714;S:0.0714][I:0.3571;L:0.3571;K:0.1429;R:0.1429]L[T:0.4286;I:0.3571;V:0.1429;S:0.0714][N:0.6429;D:0.2143;S:0.1429][Y:0.8571;F:0.1429]I[K:0.4286;N:0.2143;Q:0.2143;R:0.1429][E:0.2857;K:0.2857;Q:0.1429;S:0.1429;T:0.0714;V:0.0714][N:0.5;H:0.3571;E:0.1429]G[E:0.7143;H:0.1429;S:0.1429]G[Q:0.2857;N:0.2143;C:0.1429;K:0.1429;R:0.1429;G:0.0714]WR[S:0.5714;T:0.2143;A:0.1429;N:0.0714]LP[K:0.9286;R:0.0714][K:0.2857;N:0.2857;A:0.1429;R:0.1429;L:0.0714;Q:0.0714]AGL[L:0.6429;Q:0.2143;K:0.1429]RCG\n' +
        'motif_3\tE[I:0.75;V:0.1875;L:0.0625]KN[Y:0.6875;F:0.1875;V:0.125]W[N:0.9375;H:0.0625]T[H:0.9375;N:0.0625][L:0.6875;I:0.3125][K:0.3125;I:0.1875;S:0.1875;R:0.125;G:0.0625;L:0.0625;N:0.0625][K:0.9375;R:0.0625][K:0.875;R:0.125][L:0.875;S:0.125][K:0.4375;I:0.25;C:0.125;L:0.125;Q:0.0625]';

    const BUILTIN_SCHEMES = {
        dna: [
            {
                key: 'base',
                name: 'Nucleotide Base',
                groups: [
                    { name: 'A', letters: ['A'], defaultColor: '#109648' },
                    { name: 'C', letters: ['C'], defaultColor: '#255C99' },
                    { name: 'G', letters: ['G'], defaultColor: '#F7B32B' },
                    { name: 'T/U', letters: ['T', 'U'], defaultColor: '#D62839' }
                ]
            },
            {
                key: 'purine',
                name: 'Purine / Pyrimidine',
                groups: [
                    { name: 'Purine', letters: ['A', 'G'], defaultColor: '#D62839' },
                    { name: 'Pyrimidine', letters: ['C', 'T', 'U'], defaultColor: '#255C99' }
                ]
            },
            {
                key: 'hbond',
                name: 'Hydrogen Bonds',
                groups: [
                    { name: 'Strong', letters: ['G', 'C'], defaultColor: '#D62839' },
                    { name: 'Weak', letters: ['A', 'T', 'U'], defaultColor: '#109648' }
                ]
            },
            {
                key: 'aminoketo',
                name: 'Amino / Keto',
                groups: [
                    { name: 'Amino', letters: ['A', 'C'], defaultColor: '#255C99' },
                    { name: 'Keto', letters: ['G', 'T', 'U'], defaultColor: '#F7B32B' }
                ]
            }
        ],
        protein: [
            {
                key: 'meme8',
                name: 'MEME 8 Groups',
                groups: [
                    { name: 'Hydrophobic', letters: ['A', 'C', 'F', 'I', 'L', 'M', 'V', 'W'], defaultColor: '#0000CC' },
                    { name: 'Acidic',      letters: ['D', 'E'],                              defaultColor: '#FF00FF' },
                    { name: 'Basic',       letters: ['K', 'R'],                              defaultColor: '#CC0000' },
                    { name: 'Histidine',   letters: ['H'],                                   defaultColor: '#FFCCCC' },
                    { name: 'Polar',       letters: ['N', 'Q', 'S', 'T'],                    defaultColor: '#008000' },
                    { name: 'Tyrosine',    letters: ['Y'],                                   defaultColor: '#33E6CC' },
                    { name: 'Glycine',     letters: ['G'],                                   defaultColor: '#FFB300' },
                    { name: 'Proline',     letters: ['P'],                                   defaultColor: '#FFFF00' }
                ]
            },
            {
                key: 'murphy5',
                name: 'Murphy 5 Groups',
                groups: [
                    { name: 'Hydrophobic', letters: ['A', 'C', 'F', 'I', 'L', 'M', 'V', 'W'], defaultColor: '#1F2937' },
                    { name: 'Acidic',      letters: ['D', 'E'],                              defaultColor: '#DC2626' },
                    { name: 'Basic',       letters: ['H', 'K', 'R'],                         defaultColor: '#2563EB' },
                    { name: 'Polar',       letters: ['N', 'Q', 'S', 'T', 'Y'],               defaultColor: '#2E8B57' },
                    { name: 'Special',     letters: ['G', 'P'],                              defaultColor: '#6B7280' }
                ]
            },
            {
                key: 'gavli7',
                name: 'GAVLI 7 Groups',
                groups: [
                    { name: 'GAVLI',           letters: ['G', 'A', 'V', 'L', 'I'], defaultColor: '#1F2937' },
                    { name: 'Aromatic',        letters: ['F', 'Y', 'W'],           defaultColor: '#92400E' },
                    { name: 'Sulfur',          letters: ['C', 'M'],                defaultColor: '#B45309' },
                    { name: 'Small Polar',     letters: ['S', 'T'],                defaultColor: '#2E8B57' },
                    { name: 'Basic',           letters: ['K', 'R', 'H'],           defaultColor: '#DC2626' },
                    { name: 'Acidic / Amide',  letters: ['D', 'E', 'N', 'Q'],      defaultColor: '#7C3AED' },
                    { name: 'Proline',         letters: ['P'],                     defaultColor: '#6B7280' }
                ]
            },
            {
                key: 'dayhoff6',
                name: 'Dayhoff 6 Groups',
                groups: [
                    { name: 'C',     letters: ['C'],                     defaultColor: '#EAB308' },
                    { name: 'STPAG', letters: ['S', 'T', 'P', 'A', 'G'], defaultColor: '#2E8B57' },
                    { name: 'NDEQ',  letters: ['N', 'D', 'E', 'Q'],      defaultColor: '#7C3AED' },
                    { name: 'HRK',   letters: ['H', 'R', 'K'],           defaultColor: '#2563EB' },
                    { name: 'MILV',  letters: ['M', 'I', 'L', 'V'],      defaultColor: '#1F2937' },
                    { name: 'FYW',   letters: ['F', 'Y', 'W'],           defaultColor: '#92400E' }
                ]
            },
            {
                key: 'tri3',
                name: '3 Groups (Hydro/Polar/Charged)',
                groups: [
                    { name: 'Hydrophobic', letters: ['A', 'C', 'F', 'I', 'L', 'M', 'V', 'W', 'P', 'G'], defaultColor: '#1F2937' },
                    { name: 'Polar',       letters: ['N', 'Q', 'S', 'T', 'Y'],                       defaultColor: '#2E8B57' },
                    { name: 'Charged',     letters: ['D', 'E', 'K', 'R', 'H'],                       defaultColor: '#DC2626' }
                ]
            },
            {
                key: 'chemistry',
                name: 'WebLogo Chemistry',
                groups: [
                    { name: 'Polar',       letters: ['G', 'S', 'T', 'Y', 'C'], defaultColor: '#2E8B57' },
                    { name: 'Neutral',     letters: ['Q', 'N'], defaultColor: '#8B5CF6' },
                    { name: 'Basic',       letters: ['K', 'R', 'H'], defaultColor: '#2563EB' },
                    { name: 'Acidic',      letters: ['D', 'E'], defaultColor: '#DC2626' },
                    { name: 'Hydrophobic', letters: ['A', 'V', 'L', 'I', 'P', 'W', 'F', 'M'], defaultColor: '#1F2937' }
                ]
            },
            {
                key: 'clustal',
                name: 'Clustal X',
                groups: [
                    { name: 'Acidic',      letters: ['D', 'E'],           defaultColor: '#DC2626' },
                    { name: 'Basic',       letters: ['K', 'R'],           defaultColor: '#2563EB' },
                    { name: 'Polar',       letters: ['S', 'T', 'N', 'Q'], defaultColor: '#2E8B57' },
                    { name: 'Hydrophobic', letters: ['A', 'V', 'L', 'I', 'M'], defaultColor: '#1F2937' },
                    { name: 'Aromatic',    letters: ['F', 'W', 'Y'],      defaultColor: '#92400E' },
                    { name: 'Special',     letters: ['G', 'P', 'C'],      defaultColor: '#6B7280' },
                    { name: 'Histidine',   letters: ['H'],                defaultColor: '#0EA5E9' }
                ]
            },
            {
                key: 'charges',
                name: 'Charges / Polarity',
                groups: [
                    { name: 'Positive',    letters: ['K', 'R', 'H'], defaultColor: '#2563EB' },
                    { name: 'Negative',    letters: ['D', 'E'], defaultColor: '#DC2626' },
                    { name: 'Polar',       letters: ['S', 'T', 'N', 'Q', 'C', 'Y'], defaultColor: '#2E8B57' },
                    { name: 'Hydrophobic', letters: ['A', 'V', 'L', 'I', 'M', 'F', 'W', 'P'], defaultColor: '#1F2937' },
                    { name: 'Special',     letters: ['G'], defaultColor: '#6B7280' }
                ]
            }
        ]
    };

    function esc(s) { return PC.escapeHtml(String(s == null ? '' : s)); }

    let _measureCanvas = null;
    const _capHeightCache = {};
    function getCapHeightRatio(fontFamily) {
        const key = String(fontFamily || 'sans-serif');
        if (Object.prototype.hasOwnProperty.call(_capHeightCache, key)) return _capHeightCache[key];
        if (!_measureCanvas) _measureCanvas = document.createElement('canvas');
        const ctx = _measureCanvas.getContext('2d');
        let ratio = 0.72;
        const fs = 200;
        ctx.font = 'bold ' + fs + 'px "' + key + '", sans-serif';
        const m = ctx.measureText('H');
        if (m && m.actualBoundingBoxAscent > 0) {
            const r = m.actualBoundingBoxAscent / fs;
            if (isFinite(r) && r >= 0.4 && r <= 1.2) ratio = r;
        }
        _capHeightCache[key] = ratio;
        return ratio;
    }

    function parseConsensus(consensus) {
        const positions = [];
        let i = 0;
        const n = consensus.length;
        while (i < n) {
            const ch = consensus[i];
            if (ch === '[') {
                let j = i + 1;
                let depth = 1;
                while (j < n && depth > 0) {
                    if (consensus[j] === '[') depth++;
                    else if (consensus[j] === ']') depth--;
                    if (depth === 0) break;
                    j++;
                }
                const inner = consensus.slice(i + 1, j);
                const parts = inner.split(/[;；]/).map(function (s) { return s.trim(); }).filter(Boolean);
                const freqs = [];
                parts.forEach(function (p) {
                    const m = p.match(/^([A-Za-z])\s*[:：]\s*([\d.eE+\-]+)$/);
                    if (m) {
                        const f = parseFloat(m[2]);
                        if (isFinite(f) && f >= 0) freqs.push({ letter: m[1].toUpperCase(), freq: f });
                    }
                });
                const sum = freqs.reduce(function (a, b) { return a + b.freq; }, 0);
                if (sum > 0) freqs.forEach(function (f) { f.freq = f.freq / sum; });
                positions.push(freqs);
                i = j + 1;
            } else if (/[A-Za-z]/.test(ch)) {
                positions.push([{ letter: ch.toUpperCase(), freq: 1.0 }]);
                i++;
            } else if (ch === '-' || ch === '.') {
                positions.push([]);
                i++;
            } else {
                i++;
            }
        }
        return positions;
    }

    function buildSequences(app) {
        const s = app.state;
        const seqCol = s.roles.seq;
        if (!seqCol) return [];
        const idCol = s.roles.id && s.roles.id !== seqCol ? s.roles.id : null;
        const out = [];
        s.data.forEach(function (row, idx) {
            const raw = row[seqCol];
            if (!raw || !String(raw).trim()) return;
            const positions = parseConsensus(String(raw).trim());
            if (!positions.length) return;
            const id = idCol
                ? (String(row[idCol] || '').trim() || ('Sequence ' + (idx + 1)))
                : ('Sequence ' + (idx + 1));
            out.push({ id: id, positions: positions });
        });
        return out;
    }

    function parseCustomGroups(text) {
        if (!text || !String(text).trim()) return [];
        const raw = String(text);
        const parts = (raw.indexOf('\n') >= 0) ? raw.split(/\r?\n/) : raw.split(/[;；]/);
        const groups = [];
        parts.forEach(function (part, idx) {
            const line = part.trim();
            if (!line) return;
            let name = 'Group ' + (idx + 1);
            let lettersPart = line;
            const m = line.match(/^([^:：]+)[:：](.+)$/);
            if (m) {
                name = m[1].trim();
                lettersPart = m[2];
            }
            const letters = lettersPart.replace(/[^A-Za-z]/g, '').toUpperCase().split('');
            if (!letters.length) return;
            groups.push({ name: name, letters: letters, defaultColor: null });
        });
        return groups;
    }

    function getSeqType(app) {
        const el = app.$('seqType');
        return (el && el.value) || 'protein';
    }

    function getAlphabetSize(seqType) {
        return seqType === 'protein' ? 20 : 4;
    }

    function getAlphabet(seqType) {
        if (seqType === 'protein') return 'ACDEFGHIKLMNPQRSTVWY'.split('');
        return 'ACGTU'.split('');
    }

    function resolveGroups(app) {
        const s = app.state;
        const seqType = getSeqType(app);
        let groups = [];
        if (s.colorMode === 'custom') {
            groups = parseCustomGroups(s.customGroupsText);
        } else if (s.colorMode === 'none') {
            groups = getAlphabet(seqType).map(function (L) {
                return { name: L, letters: [L], defaultColor: null };
            });
        } else {
            const schemes = BUILTIN_SCHEMES[seqType] || [];
            let scheme = schemes.find(function (sc) { return sc.key === s.builtinScheme; });
            if (!scheme) scheme = schemes[0];
            if (scheme) {
                groups = scheme.groups.map(function (g) {
                    return { name: g.name, letters: g.letters.slice(), defaultColor: g.defaultColor };
                });
            }
        }

        const actualLetters = new Set();
        const seqCol = s.roles.seq;
        if (seqCol && s.data && s.data.length) {
            s.data.forEach(function (row) {
                const raw = row[seqCol];
                if (raw) {
                    const matches = String(raw).match(/[A-Za-z]/g);
                    if (matches) {
                        matches.forEach(function (L) { actualLetters.add(L.toUpperCase()); });
                    }
                }
            });
        }

        if (actualLetters.size > 0) {
            const definedLetters = new Set();
            groups.forEach(function (g) {
                g.letters.forEach(function (L) { definedLetters.add(L); });
            });

            const otherLetters = [];
            actualLetters.forEach(function (L) {
                if (!definedLetters.has(L)) otherLetters.push(L);
            });

            if (otherLetters.length > 0) {
                otherLetters.sort();
                let otherGroup = groups.find(function(g) { return g.name.toLowerCase() === 'other'; });
                if (otherGroup) {
                    otherLetters.forEach(function(L) {
                        if (otherGroup.letters.indexOf(L) === -1) otherGroup.letters.push(L);
                    });
                } else {
                    groups.push({
                        name: 'Other',
                        letters: otherLetters,
                        defaultColor: '#9CA3AF'
                    });
                }
            }
        }

        return groups;
    }

    function resolveGroupColors(app, groups) {
        const palette = app.resolvePaletteColors(groups.length);
        const map = {};
        groups.forEach(function (g, i) {
            map[g.name] = app.state.customColors[g.name] || palette[i] || g.defaultColor || '#cccccc';
        });
        return map;
    }

    function fillSeqIdSelect(app) {
        const sel = app.$('seqIdColSel');
        if (!sel) return;
        const s = app.state;
        if (!s.headers.length) {
            sel.innerHTML = `<option value="">${EN ? 'None (Auto)' : '无（自动编号）'}</option>`;
            sel.disabled = true;
            return;
        }
        sel.disabled = false;
        let html = `<option value="">${EN ? 'None (Auto)' : '无（自动编号）'}</option>`;
        html += s.headers.map(function (h) {
            return '<option value="' + esc(h) + '"' + (h === s.roles.id ? ' selected' : '') + '>' + esc(h) + '</option>';
        }).join('');
        sel.innerHTML = html;
    }

    function fillSeqColSelect(app) {
        const sel = app.$('seqColSel');
        if (!sel) return;
        const s = app.state;
        if (!s.headers.length) {
            sel.innerHTML = `<option value="">${EN ? '— Please import data —' : '— 请先导入数据 —'}</option>`;
            sel.disabled = true;
            return;
        }
        sel.disabled = false;
        sel.innerHTML = s.headers.map(function (h) {
            return '<option value="' + esc(h) + '"' + (h === s.roles.seq ? ' selected' : '') + '>' + esc(h) + '</option>';
        }).join('');
    }

    function refreshBuiltinSchemeSelect(app) {
        const sel = app.$('builtinSchemeSel');
        if (!sel) return;
        const seqType = getSeqType(app);
        const schemes = BUILTIN_SCHEMES[seqType] || [];
        sel.innerHTML = schemes.map(function (sc) {
            return '<option value="' + sc.key + '">' + esc(sc.name) + '</option>';
        }).join('');
        const cur = app.state.builtinScheme;
        if (cur && schemes.some(function (sc) { return sc.key === cur; })) {
            sel.value = cur;
        } else if (schemes.length) {
            sel.value = schemes[0].key;
            app.state.builtinScheme = schemes[0].key;
        }
        updateBuiltinHint(app);
    }

    function updateBuiltinHint(app) {
        const el = app.$('builtinGroupHint');
        if (!el) return;
        const seqType = getSeqType(app);
        const schemes = BUILTIN_SCHEMES[seqType] || [];
        const scheme = schemes.find(function (sc) { return sc.key === app.state.builtinScheme; });
        if (!scheme) { el.innerHTML = ''; return; }
        el.innerHTML = scheme.groups.map(function (g) {
            return '<strong>' + esc(g.name) + '</strong>: ' + g.letters.join(' ');
        }).join(' | ');
    }

    function applyBuiltinScheme(app, key) {
        app.state.builtinScheme = key;
        app.state.customColors = {};
        const seqType = getSeqType(app);
        const schemes = BUILTIN_SCHEMES[seqType] || [];
        const scheme = schemes.find(function (sc) { return sc.key === key; });
        if (scheme) {
            scheme.groups.forEach(function (g) {
                if (g.defaultColor) app.state.customColors[g.name] = g.defaultColor;
            });
        }
        updateBuiltinHint(app);
    }

    function updateColorModeUI(app) {
        const mode = app.state.colorMode || 'builtin';
        const builtinWrap = app.$('builtinSchemeWrap');
        const customWrap = app.$('customGroupWrap');
        if (builtinWrap) builtinWrap.style.display = mode === 'builtin' ? '' : 'none';
        if (customWrap) customWrap.style.display = mode === 'custom' ? '' : 'none';
    }

    function refreshColorAssign(app) {
        const container = app.$('colorAssignContainer');
        if (!container) return;
        const groups = resolveGroups(app);
        if (!groups.length) {
            container.innerHTML = '<div class="color-assign-empty">' + T.colorEmpty + '</div>';
            return;
        }
        const colors = resolveGroupColors(app, groups);
        const items = groups.map(function (g) {
            return {
                name: g.name + ' (' + g.letters.join(',') + ')',
                color: colors[g.name]
            };
        });
        PC.renderColorAssignment(container, {
            items: items,
            onChange: function (idx, newColor) {
                const g = groups[idx];
                if (!g) return;
                app.state.customColors[g.name] = newColor;
                if (app.state.currentSvg) app.drawChart();
            },
            onResetAll: function () {
                app.state.customColors = {};
                const seqType = getSeqType(app);
                if (app.state.colorMode === 'builtin') {
                    const schemes = BUILTIN_SCHEMES[seqType] || [];
                    const scheme = schemes.find(function (sc) { return sc.key === app.state.builtinScheme; });
                    if (scheme) {
                        scheme.groups.forEach(function (g) {
                            if (g.defaultColor) app.state.customColors[g.name] = g.defaultColor;
                        });
                    }
                }
                refreshColorAssign(app);
                if (app.state.currentSvg) app.drawChart();
            }
        });
    }

    function fillLogoFontSelect(app) {
        const sel = app.$('logoLetterFont');
        if (!sel) return;
        const cur = app.state.logoLetterFont || 'Arial';
        if (PC.fontOptionsHTML) {
            sel.innerHTML = PC.fontOptionsHTML(cur);
        }
        app.state.logoLetterFont = sel.value || cur;
    }

    function readParams(app) {
        const $ = app.$;
        const p = PC.readCommonParams(app, { width: 800, height: 600 });
        p.yMode = ($('logoYMode') && $('logoYMode').value) || 'bits';
        p.sampleSize = Math.max(0, parseInt(PC.num(app, 'logoSampleSize', 0), 10));
        p.legendShowLetters = $('logoLegendShowLetters') ? $('logoLegendShowLetters').checked : true;
        
        p.letterFont = app.state.logoLetterFont ||
            ($('logoLetterFont') && $('logoLetterFont').value) || 'Arial';
        p.minBand = Math.max(8, PC.num(app, 'logoMinBand', 14));
        p.positionGap = Math.max(0, PC.num(app, 'logoPositionGap', 0));

        p.titlePos = ($('logoTitlePos') && $('logoTitlePos').value) || 'top';
        p.titleOffset = PC.num(app, 'logoTitleLeftOffset', 8);
        p.facetGap = Math.max(0, PC.num(app, 'logoFacetGap', 16));

        p.titleFontSize = PC.num(app, 'logoTitleFontSize', 14);
        p.titleColor = ($('logoTitleColor') && $('logoTitleColor').value) || '#1f4068';
        p.titleBold = $('logoTitleBold') ? $('logoTitleBold').checked : true;
        p.titleItalic = $('logoTitleItalic') ? $('logoTitleItalic').checked : false;

        p.letterBold = $('logoLetterBold') ? $('logoLetterBold').checked : true;
        p.letterItalic = $('logoLetterItalic') ? $('logoLetterItalic').checked : false;

        p.yMaxMode = ($('logoYMaxMode') && $('logoYMaxMode').value) || 'auto';
        p.yMax = PC.num(app, 'logoYMax', 4.5);
        p.yTickInterval = Math.max(0, PC.num(app, 'logoYTickInterval', 0));
        p.showYAxisLine = $('logoShowYAxisLine') ? $('logoShowYAxisLine').checked : true;
        
        p.yTitleMode = ($('logoYTitleMode') && $('logoYTitleMode').value) || 'perFacet';
        p.yTitleText = ($('logoYTitleText') && $('logoYTitleText').value) || '';

        p.xLabelMode = ($('logoXLabelMode') && $('logoXLabelMode').value) || 'number';
        p.xTickInterval = Math.max(0, Math.round(PC.num(app, 'logoXTickInterval', 1)));
        p.showXTickLabels = $('logoShowXTickLabels') ? $('logoShowXTickLabels').checked : true;
        
        p.xTitleMode = ($('logoXTitleMode') && $('logoXTitleMode').value) || 'perFacet';
        p.xTitleText = ($('logoXTitleText') && $('logoXTitleText').value) || '';

        p.axisTitleFontSize = PC.num(app, 'logoAxisTitleFontSize', 13);
        p.axisTitleBold = $('logoAxisTitleBold') ? $('logoAxisTitleBold').checked : true;
        p.axisTitleItalic = $('logoAxisTitleItalic') ? $('logoAxisTitleItalic').checked : false;

        p.tickFontSize = PC.num(app, 'logoTickFontSize', 11);
        p.tickBold = $('logoTickBold') ? $('logoTickBold').checked : false;
        p.tickItalic = $('logoTickItalic') ? $('logoTickItalic').checked : false;
        
        p.axisColor = ($('logoAxisColor') && $('logoAxisColor').value) || '#333333';
        p.axisWidth = PC.num(app, 'logoAxisWidth', 1);
        p.tickLength = PC.num(app, 'logoTickLength', 4);
        p.tickWidth = PC.num(app, 'logoTickWidth', 1);
        p.showYGrid = $('logoShowYGrid') ? $('logoShowYGrid').checked : false;
        p.gridColor = ($('logoGridColor') && $('logoGridColor').value) || '#e8edf2';

        p.outlineMode = ($('logoOutlineMode') && $('logoOutlineMode').value) || 'none';
        p.outlineColor = ($('logoOutlineColor') && $('logoOutlineColor').value) || '#333333';

        return p;
    }

    function drawOneLogo(svg, seq, opts) {
        const positions = seq.positions;
        const nPos = positions.length;
        if (!nPos) return;

        const bandW = opts.bandW;
        const leftPad = opts.leftPad;
        const plotX = opts.x + leftPad;
        const topPad = opts.showTitle && opts.titlePos === 'top' ? 30 : 10;
        const plotY = opts.y + topPad;
        const dataW = bandW * nPos + Math.max(0, nPos - 1) * opts.positionGap;
        
        let bottomPad = opts.tickLength + 13 + opts.tickFontSize + 5;
        if (opts.xTitleMode === 'perFacet' && opts.xTitleText) {
            bottomPad += opts.axisTitleFontSize + 10;
        }
        
        const plotH = Math.max(20, opts.h - topPad - bottomPad);
        const yScale = d3.scaleLinear().domain([0, opts.yMax]).range([plotY + plotH, plotY]);

        if (opts.showTitle) {
            if (opts.titlePos === 'left') {
                svg.append('text')
                    .attr('class', 'logo-seq-title')
                    .attr('x', plotX - opts.titleOffset)
                    .attr('y', plotY + plotH / 2)
                    .attr('text-anchor', 'end')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', opts.titleFontSize)
                    .attr('font-weight', opts.titleBold ? 'bold' : 'normal')
                    .attr('font-style', opts.titleItalic ? 'italic' : 'normal')
                    .attr('fill', opts.titleColor)
                    .text(seq.id);
            } else {
                svg.append('text')
                    .attr('class', 'logo-seq-title')
                    .attr('x', opts.x + opts.w / 2)
                    .attr('y', opts.y + 18 + opts.titleOffset)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', opts.titleFontSize)
                    .attr('font-weight', opts.titleBold ? 'bold' : 'normal')
                    .attr('font-style', opts.titleItalic ? 'italic' : 'normal')
                    .attr('fill', opts.titleColor)
                    .text(seq.id);
            }
        }

        const BASE_FS = 100;
        const capRatio = opts.capRatio;
        const baseHeight = BASE_FS * capRatio;

        const outlineMode = opts.outlineMode || 'none';
        const outlineColor = opts.outlineColor || '#333333';
        const strokeW = Math.max(1, Math.min(2.5, bandW * 0.1));

        const clipId = 'clip_' + Math.random().toString(36).substr(2, 9);
        svg.append('defs').append('clipPath')
            .attr('id', clipId)
            .append('rect')
            .attr('x', plotX - 10) 
            .attr('y', plotY - 10) 
            .attr('width', dataW + 20)
            .attr('height', plotH + 10); 

        const lettersG = svg.append('g').attr('clip-path', 'url(#' + clipId + ')');

        if (opts.showYGrid) {
            const yAxisTemp = d3.axisLeft(yScale);
            let tickVals = yAxisTemp.scale().ticks(5);
            if (opts.yTickInterval > 0) {
                tickVals = [];
                const step = opts.yTickInterval;
                const max = opts.yMax;
                for (let v = 0; v <= max + 1e-9; v += step) {
                    tickVals.push(Number(v.toFixed(10)));
                }
            }
            const gridG = svg.append('g').attr('class', 'y-grid');
            tickVals.forEach(v => {
                const y = Math.round(yScale(v)) + 0.5;
                gridG.append('line')
                    .attr('x1', plotX).attr('x2', plotX + dataW)
                    .attr('y1', y).attr('y2', y)
                    .attr('stroke', opts.gridColor)
                    .attr('stroke-dasharray', '3 3')
                    .attr('stroke-width', 1);
            });
        }

        positions.forEach(function (pos, i) {
            if (!pos.length) return;
            const sorted = pos.slice().sort(function (a, b) { return b.freq - a.freq; });
            let H = 0;
            sorted.forEach(function (l) {
                if (l.freq > 0) H -= l.freq * Math.log2(l.freq);
            });
            
            let e_n = 0;
            if (opts.sampleSize > 0) {
                const K = Math.pow(2, opts.maxBits);
                e_n = (K - 1) / (2 * Math.LN2 * opts.sampleSize);
            }
            const R = Math.max(0, opts.maxBits - (H + e_n));
            const totalH = opts.yMode === 'bits' ? R : 1.0;

            let cum = totalH;
            sorted.forEach(function (l) {
                const h = l.freq * totalH;
                if (h <= 0) return;
                const yTop = cum;
                const yBot = cum - h;
                cum = yBot;
                const yB = yScale(yBot);
                const yT = yScale(yTop);
                const hPx = yB - yT;
                if (hPx < 0.6) return;

                const xLeft = plotX + i * (bandW + opts.positionGap);
                const sx = bandW / BASE_FS;
                const sy = hPx / baseHeight;

                const letterColor = opts.colorOfLetter(l.letter);

                const t = lettersG.append('text')
                    .attr('class', 'logo-letter')
                    .attr('text-anchor', 'start')
                    .attr('font-size', BASE_FS)
                    .attr('font-family', opts.letterFont)
                    .attr('font-weight', opts.letterBold ? 'bold' : 'normal')
                    .attr('font-style', opts.letterItalic ? 'italic' : 'normal')
                    .attr('textLength', BASE_FS)
                    .attr('lengthAdjust', 'spacingAndGlyphs')
                    .attr('transform', 'translate(' + xLeft + ',' + yB + ') scale(' + sx + ',' + sy + ')')
                    .attr('x', 0)
                    .attr('y', 0)
                    .text(l.letter);

                if (outlineMode === 'outlineOnly') {
                    t.attr('fill', 'none')
                        .attr('stroke', letterColor)
                        .attr('stroke-width', strokeW)
                        .attr('vector-effect', 'non-scaling-stroke');
                } else if (outlineMode === 'outline') {
                    t.attr('fill', letterColor)
                        .attr('stroke', outlineColor)
                        .attr('stroke-width', strokeW)
                        .attr('vector-effect', 'non-scaling-stroke')
                        .attr('paint-order', 'stroke');
                } else {
                    t.attr('fill', letterColor);
                }
            });
        });

        if (opts.showYAxisLine) {
            const yAxis = d3.axisLeft(yScale);
            if (opts.yTickInterval > 0) {
                const step = opts.yTickInterval;
                const max = opts.yMax;
                const count = Math.floor(max / step) + 1;
                if (count <= 60) {
                    const vals = [];
                    for (let k = 0; k < count; k++) {
                        const v = k * step;
                        if (v > max + 1e-9) break;
                        vals.push(Number(v.toFixed(10)));
                    }
                    if (vals.length) yAxis.tickValues(vals);
                    else yAxis.ticks(5);
                } else {
                    yAxis.ticks(5);
                }
            } else {
                yAxis.ticks(5);
            }
            const yAxisG = svg.append('g')
                .attr('class', 'y-axis')
                .attr('transform', 'translate(' + plotX + ',0)')
                .call(yAxis);

            yAxisG.select('.domain').attr('stroke', opts.axisColor).attr('stroke-width', opts.axisWidth);
            
            yAxisG.selectAll('.tick line')
                .attr('x1', -opts.tickLength)
                .attr('x2', 0)
                .attr('y1', 0)
                .attr('y2', 0)
                .attr('stroke', opts.axisColor)
                .attr('stroke-width', opts.tickWidth);
                
            yAxisG.selectAll('text')
                .style('font-family', opts.p.fontFamily || 'sans-serif')
                .style('font-size', opts.tickFontSize + 'px')
                .style('font-weight', opts.tickBold ? 'bold' : 'normal')
                .style('font-style', opts.tickItalic ? 'italic' : 'normal')
                .attr('fill', opts.axisColor);
        }

        if (opts.yTitleMode === 'perFacet' && opts.yTitleText) {
            const titleX = opts.showYAxisLine ? (plotX - 42) : (plotX - 15);
            svg.append('text')
                .attr('transform', 'translate(' + titleX + ',' + (plotY + plotH / 2) + ') rotate(-90)')
                .attr('text-anchor', 'middle')
                .attr('font-size', opts.axisTitleFontSize)
                .attr('font-weight', opts.axisTitleBold ? 'bold' : 'normal')
                .attr('font-style', opts.axisTitleItalic ? 'italic' : 'normal')
                .attr('fill', opts.axisColor)
                .text(opts.yTitleText);
        }

        svg.append('line')
            .attr('x1', plotX).attr('x2', plotX + dataW)
            .attr('y1', plotY + plotH).attr('y2', plotY + plotH)
            .attr('stroke', opts.axisColor).attr('stroke-width', opts.axisWidth);

        if (opts.showXTickLabels) {
            let step;
            if (opts.xTickInterval > 0) {
                step = Math.round(opts.xTickInterval);
            } else {
                const maxTicks = Math.max(5, Math.floor(dataW / 40));
                step = Math.max(1, Math.ceil(nPos / maxTicks));
            }
            for (let i = 0; i < nPos; i += step) {
                const cx = plotX + i * (bandW + opts.positionGap) + bandW / 2;
                svg.append('line')
                    .attr('x1', cx).attr('x2', cx)
                    .attr('y1', plotY + plotH).attr('y2', plotY + plotH + opts.tickLength)
                    .attr('stroke', opts.axisColor).attr('stroke-width', opts.tickWidth);
                
                let label;
                if (opts.xLabelMode === 'number') {
                    label = String(i + 1);
                } else {
                    const pos = positions[i];
                    if (pos && pos.length) {
                        let best = pos[0];
                        pos.forEach(function (l) { if (l.freq > best.freq) best = l; });
                        label = best.letter;
                    } else {
                        label = '';
                    }
                }
                svg.append('text')
                    .attr('x', cx)
                    .attr('y', plotY + plotH + opts.tickLength + 13)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', opts.tickFontSize)
                    .attr('font-weight', opts.tickBold ? 'bold' : 'normal')
                    .attr('font-style', opts.tickItalic ? 'italic' : 'normal')
                    .attr('fill', opts.axisColor)
                    .text(label);
            }
        }

        if (opts.xTitleMode === 'perFacet' && opts.xTitleText) {
            const yPos = plotY + plotH + opts.tickLength + 13 + opts.tickFontSize + 6;
            svg.append('text')
                .attr('x', plotX + dataW / 2)
                .attr('y', yPos)
                .attr('text-anchor', 'middle')
                .attr('font-size', opts.axisTitleFontSize)
                .attr('font-weight', opts.axisTitleBold ? 'bold' : 'normal')
                .attr('font-style', opts.axisTitleItalic ? 'italic' : 'normal')
                .attr('fill', opts.axisColor)
                .text(opts.xTitleText);
        }
    }
    function drawGroupLegend(svg, groups, groupColors, p, canvasW, canvasH) {
        if (!p.showLegend || !groups.length) return;
        const items = groups.map(function (g) { 
            return { name: g.name, letters: g.letters, percent: null }; 
        });
        const colors = groups.map(function (g) { return groupColors[g.name]; });
        
        PC.drawLegendOverlay(svg, {
            p: Object.assign({}, p, { width: canvasW, height: canvasH }),
            items: items,
            colors: colors,
            shape: 'rect',
            anchor: 'top-right',
            margin: 15,
            labelFormatter: function (it) {
                if (p.legendShowLetters && it.letters && it.letters.length) {
                    return it.name + ' (' + it.letters.join('') + ')';
                }
                return it.name;
            }
        });
    }

    function drawChart(app) {
        const s = app.state;
        app.toolbarTip.textContent = '';

        if (!s.data.length) { app.showTip('msgTip3', T.noData, 'error'); return; }
        if (!s.roles.seq) { app.showTip('msgTip3', T.selectSeq, 'error'); return; }

        const toDraw = buildSequences(app);
        if (!toDraw.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }

        const seqType = getSeqType(app);
        const groups = resolveGroups(app);
        if (!groups.length) { app.showTip('msgTip3', T.noValid, 'error'); return; }
        const groupColors = resolveGroupColors(app, groups);

        const letterColor = {};
        groups.forEach(function (g) {
            g.letters.forEach(function (L) { letterColor[L] = groupColors[g.name]; });
        });
        const colorOfLetter = function (L) { return letterColor[L] || '#888888'; };

        const p = readParams(app);
        const capRatio = getCapHeightRatio(p.letterFont);

        const nPosMax = Math.max.apply(null, toDraw.map(function (m) { return m.positions.length; }));

        let leftPad = 10;
        if (p.showYAxisLine) leftPad += 32;
        if (p.yTitleMode === 'perFacet' && p.yTitleText) leftPad += 30;
        if (p.titlePos === 'left') {
            let maxTitleW = 0;
            toDraw.forEach(function (m) {
                maxTitleW = Math.max(maxTitleW, PC.estTextWidth(m.id, p.titleFontSize));
            });
            leftPad += maxTitleW + p.titleOffset;
        }

        const fixedRight = 24;
        const outerMargin = 20;
        const targetCanvasW = PC.num(app, 'chartWidth', 800);

        const totalGap = Math.max(0, nPosMax - 1) * p.positionGap;
        let bandW = (targetCanvasW - leftPad - fixedRight - 2 * outerMargin - totalGap) / nPosMax;
        if (!isFinite(bandW) || bandW <= 0) bandW = 2;
        bandW = Math.min(60, bandW);

        const plotWMax = bandW * nPosMax + Math.max(0, nPosMax - 1) * p.positionGap;
        const width = leftPad + plotWMax + fixedRight + 2 * outerMargin;
        const height = Math.max(200, PC.num(app, 'chartHeight', 600));

        const K = getAlphabetSize(seqType);
        const maxBits = Math.log2(K);

        let yMax;
        if (p.yMode === 'probability') {
            yMax = (p.yMaxMode === 'custom') ? p.yMax : 1.0;
        } else {
            yMax = (p.yMaxMode === 'custom') ? p.yMax : maxBits;
        }
        if (!isFinite(yMax) || yMax <= 0) yMax = maxBits;

        const canvas = PlotCanvas.create(app.chartPreview, {
            width: width,
            height: height,
            fontFamily: p.fontFamily,
            border: p.showCanvasBorder
        });
        const svg = canvas.root;
        s.currentSvg = canvas.node;

        const margin = outerMargin;
        const outerX = margin;
        const outerY = margin;
        const outerW = width - 2 * margin;
        
        let bottomSinglePad = (p.xTitleMode === 'single' && p.xTitleText) ? 30 : 0;
        let outerH = Math.max(20, height - 2 * margin - bottomSinglePad);

        const n = toDraw.length;
        const gap = p.facetGap;
        const eachH = Math.max(30, (outerH - gap * (n - 1)) / n);

        toDraw.forEach(function (m, idx) {
            const y0 = outerY + idx * (eachH + gap);
            drawOneLogo(svg, m, {
                x: outerX, y: y0, w: outerW, h: eachH,
                bandW: bandW,
                leftPad: leftPad,
                yMax: yMax, maxBits: maxBits,
                yMode: p.yMode,
                sampleSize: p.sampleSize, 
                xLabelMode: p.xLabelMode,
                letterFont: p.letterFont,
                capRatio: capRatio,
                colorOfLetter: colorOfLetter,
                showTitle: true,
                titlePos: p.titlePos,
                titleOffset: p.titleOffset,
                titleFontSize: p.titleFontSize,
                titleColor: p.titleColor,
                titleBold: p.titleBold,
                titleItalic: p.titleItalic,
                letterBold: p.letterBold,
                letterItalic: p.letterItalic,
                positionGap: p.positionGap,
                p: p,
                xTickInterval: p.xTickInterval,
                yTickInterval: p.yTickInterval,
                showXTickLabels: p.showXTickLabels,
                showYAxisLine: p.showYAxisLine,
                yTitleMode: p.yTitleMode,
                yTitleText: p.yTitleText,
                xTitleMode: p.xTitleMode,
                xTitleText: p.xTitleText,
                axisTitleFontSize: p.axisTitleFontSize,
                axisTitleBold: p.axisTitleBold,
                axisTitleItalic: p.axisTitleItalic,
                tickFontSize: p.tickFontSize,
                tickBold: p.tickBold,
                tickItalic: p.tickItalic,
                axisColor: p.axisColor,
                axisWidth: p.axisWidth,
                tickLength: p.tickLength,
                tickWidth: p.tickWidth,
                showYGrid: p.showYGrid,
                gridColor: p.gridColor,
                outlineMode: p.outlineMode,
                outlineColor: p.outlineColor
            });
        });

        if (p.yTitleMode === 'single' && p.yTitleText) {
            const titleX = (outerX + leftPad) - (p.showYAxisLine ? 42 : 15);
            const titleY = outerY + outerH / 2;
            svg.append('text')
                .attr('class', 'logo-y-title')
                .attr('transform', 'translate(' + titleX + ',' + titleY + ') rotate(-90)')
                .attr('text-anchor', 'middle')
                .attr('font-size', p.axisTitleFontSize)
                .attr('font-weight', p.axisTitleBold ? 'bold' : 'normal')
                .attr('font-style', p.axisTitleItalic ? 'italic' : 'normal')
                .attr('fill', p.axisColor)
                .text(p.yTitleText);
        }

        if (p.xTitleMode === 'single' && p.xTitleText) {
            const totalPlotW = bandW * nPosMax + Math.max(0, nPosMax - 1) * p.positionGap;
            const titleX = outerX + leftPad + totalPlotW / 2;
            const titleY = outerY + outerH + bottomSinglePad - 5;
            svg.append('text')
                .attr('class', 'logo-x-title')
                .attr('x', titleX)
                .attr('y', titleY)
                .attr('text-anchor', 'middle')
                .attr('font-size', p.axisTitleFontSize)
                .attr('font-weight', p.axisTitleBold ? 'bold' : 'normal')
                .attr('font-style', p.axisTitleItalic ? 'italic' : 'normal')
                .attr('fill', p.axisColor)
                .text(p.xTitleText);
        }

        drawGroupLegend(svg, groups, groupColors, p, width, height);

        if (p.fontFamily) {
            svg.selectAll('text').style('font-family', p.fontFamily);
        }
        svg.selectAll('.logo-letter').style('font-family', p.letterFont);

        app.exportSvgBtn.disabled = false;
        app.exportPngBtn.disabled = false;
        app.showTip('msgTip3', PlotI18N.t('drawDone'), 'success');
    }
    PlotApp.create({
        exportName: 'seq_logo',
        exampleData: EX_DATA,
        importInfo: T.importInfo,

        stateExtra: {
            roles: { id: '', seq: '' },
            colorMode: 'builtin',
            builtinScheme: '',
            customGroupsText: '',
            customColors: {},
            logoLetterFont: 'Arial',
            logoYTitleEdited: false
        },

        syncLegendTitle: function (app) {
            const input = app.$('legendTitle');
            if (!app.state.legendTitleEdited && input) {
                input.value = 'Residues';
            }
        },

        refreshColors: function (app) {
            refreshColorAssign(app);
        },

        setup: function (app) {
            const s = app.state;

            const idSel = app.$('seqIdColSel');
            if (idSel) {
                idSel.addEventListener('change', function () {
                    s.roles.id = idSel.value;
                    if (s.currentSvg) app.drawChart();
                });
            }

            const seqSel = app.$('seqColSel');
            if (seqSel) {
                seqSel.addEventListener('change', function () {
                    s.roles.seq = seqSel.value;
                    if (s.currentSvg) app.drawChart();
                });
            }

            const seqTypeSel = app.$('seqType');
            if (seqTypeSel) {
                seqTypeSel.addEventListener('change', function () {
                    refreshBuiltinSchemeSelect(app);
                    const seqType = getSeqType(app);
                    const schemes = BUILTIN_SCHEMES[seqType] || [];
                    if (schemes.length) applyBuiltinScheme(app, schemes[0].key);
                    refreshColorAssign(app);
                    if (s.currentSvg) app.drawChart();
                });
            }

            document.querySelectorAll('input[name="colorMode"]').forEach(function (r) {
                r.addEventListener('change', function () {
                    const checked = document.querySelector('input[name="colorMode"]:checked');
                    if (!checked) return;
                    s.colorMode = checked.value;
                    updateColorModeUI(app);
                    refreshColorAssign(app);
                    if (s.currentSvg) app.drawChart();
                });
            });

            const schemeSel = app.$('builtinSchemeSel');
            if (schemeSel) {
                schemeSel.addEventListener('change', function () {
                    applyBuiltinScheme(app, schemeSel.value);
                    refreshColorAssign(app);
                    if (s.currentSvg) app.drawChart();
                });
            }

            const customText = app.$('customGroupText');
            if (customText) {
                customText.addEventListener('input', function () {
                    s.customGroupsText = customText.value;
                    refreshColorAssign(app);
                    if (s.currentSvg) app.drawChart();
                });
            }

            const customFile = app.$('customGroupFile');
            if (customFile) {
                customFile.addEventListener('change', function () {
                    const f = customFile.files && customFile.files[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = function (ev) {
                        const text = String(ev.target.result || '');
                        s.customGroupsText = text;
                        if (customText) customText.value = text;
                        const radio = document.querySelector('input[name="colorMode"][value="custom"]');
                        if (radio) radio.checked = true;
                        s.colorMode = 'custom';
                        updateColorModeUI(app);
                        refreshColorAssign(app);
                        if (s.currentSvg) app.drawChart();
                    };
                    reader.readAsText(f);
                    customFile.value = '';
                });
            }

            const yMaxModeSel = app.$('logoYMaxMode');
            if (yMaxModeSel) {
                yMaxModeSel.addEventListener('change', function () {
                    const el = app.$('logoYMax');
                    if (el) el.disabled = yMaxModeSel.value !== 'custom';
                });
            }

            const yModeSel = app.$('logoYMode');
            const yTitleInput = app.$('logoYTitleText');
            if (yTitleInput) {
                yTitleInput.addEventListener('input', function () {
                    s.logoYTitleEdited = true;
                });
            }
            if (yModeSel) {
                yModeSel.addEventListener('change', function () {
                    if (!s.logoYTitleEdited && yTitleInput) {
                        yTitleInput.value = (yModeSel.value === 'probability')
                            ? 'Probability' : 'Information (bits)';
                    }
                });
            }

            fillLogoFontSelect(app);
            const lfSel = app.$('logoLetterFont');
            if (lfSel) {
                lfSel.addEventListener('change', function () {
                    s.logoLetterFont = lfSel.value;
                    if (s.currentSvg) app.drawChart();
                });
            }

            fillSeqIdSelect(app);
            fillSeqColSelect(app);
            refreshBuiltinSchemeSelect(app);
            if (!s.builtinScheme) {
                const seqType = getSeqType(app);
                const schemes = BUILTIN_SCHEMES[seqType] || [];
                if (schemes.length) applyBuiltinScheme(app, schemes[0].key);
            }
            updateColorModeUI(app);
            refreshColorAssign(app);
        },

        onDataImported: function (app, res) {
            const s = app.state;
            s.columnTypes = res.columnTypes || {};

            let idCol = '';
            let seqCol = '';
            if (res.headers.length >= 2) {
                idCol = res.headers[0];
                seqCol = res.headers[1];
            } else if (res.headers.length === 1) {
                seqCol = res.headers[0];
            }

            s.roles.id = idCol;
            s.roles.seq = seqCol;
            s.customColors = {};
            s.colorMode = 'builtin';

            let seqType = 'dna';
            if (res.data.length && seqCol) {
                const raw = String(res.data[0][seqCol] || '');
                const allLetters = raw.replace(/[^A-Za-z]/g, '').toUpperCase();
                let hasNonDNA = false;
                for (let i = 0; i < allLetters.length; i++) {
                    if ('ACGTU'.indexOf(allLetters[i]) < 0) { hasNonDNA = true; break; }
                }
                if (hasNonDNA) seqType = 'protein';
            }
            const stSel = app.$('seqType');
            if (stSel) stSel.value = seqType;

            fillSeqIdSelect(app);
            fillSeqColSelect(app);
            refreshBuiltinSchemeSelect(app);
            const schemes = BUILTIN_SCHEMES[seqType] || [];
            if (schemes.length) applyBuiltinScheme(app, schemes[0].key);
            refreshColorAssign(app);
        },

        onReset: function (app) {
            const s = app.state;
            s.columnTypes = {};
            s.roles = { id: '', seq: '' };
            s.customColors = {};
            s.colorMode = 'builtin';
            s.builtinScheme = '';
            s.customGroupsText = '';
            s.logoLetterFont = 'Arial';
            s.logoYTitleEdited = false;

            const ct = app.$('customGroupText');
            if (ct) ct.value = '';
            const radio = document.querySelector('input[name="colorMode"][value="builtin"]');
            if (radio) radio.checked = true;

            const setV = function (id, v) { const el = app.$(id); if (el) el.value = v; };
            const setC = function (id, v) { const el = app.$(id); if (el) el.checked = v; };
            setV('logoXTickInterval', 1);
            setV('logoYTickInterval', 0);
            setC('logoShowXTickLabels', true);
            setC('logoShowYAxisLine', true);
            setV('logoYTitleMode', 'perFacet');
            setV('logoYTitleText', 'Information (bits)');
            setV('logoYTitleFontSize', 13);
            setC('logoYTitleBold', true);
            setC('logoYTitleItalic', false);
            setV('logoXTitleText', 'Position');
            setV('logoXTitleFontSize', 13);
            setC('logoXTitleBold', true);
            setC('logoXTitleItalic', false);
            setV('logoAxisColor', '#333333');
            setV('logoAxisWidth', 1);
            setV('logoTickLength', 4);
            setV('logoTickWidth', 1);
            setC('logoShowYGrid', false);
            setV('logoGridColor', '#e8edf2');
            setV('logoOutlineMode', 'none');
            setV('logoOutlineColor', '#333333');
            setV('logoTitlePos', 'top');
            setV('logoTitleLeftOffset', 8);
            setV('logoFacetGap', 16);
            setV('logoTitleFontSize', 14);
            setV('logoTitleColor', '#1f4068');
            setC('logoTitleBold', true);
            setC('logoTitleItalic', false);
            setC('logoLetterBold', true);
            setC('logoLetterItalic', false);
            setV('logoPositionGap', 0);
            setV('logoTickFontSize', 11);
            setC('logoTickBold', false);
            setC('logoTickItalic', false);
            setC('logoShowLegend', true);
            setV('logoXTitleMode', 'perFacet');
            setV('logoAxisTitleFontSize', 13);
            setC('logoAxisTitleBold', true);
            setC('logoAxisTitleItalic', false);
            setC('logoLegendShowLetters', true);
            setV('logoSampleSize', 0);
            fillLogoFontSelect(app);

            fillSeqIdSelect(app);
            fillSeqColSelect(app);
            refreshBuiltinSchemeSelect(app);
            updateColorModeUI(app);
            refreshColorAssign(app);
        },

        onStateRestored: function (app) {
            const s = app.state;
            const radio = document.querySelector('input[name="colorMode"][value="' + (s.colorMode || 'builtin') + '"]');
            if (radio) radio.checked = true;
            const ct = app.$('customGroupText');
            if (ct) ct.value = s.customGroupsText || '';

            fillLogoFontSelect(app);

            fillSeqIdSelect(app);
            fillSeqColSelect(app);
            refreshBuiltinSchemeSelect(app);
            updateColorModeUI(app);
            refreshColorAssign(app);
        },

        drawChart: function (app) {
            drawChart(app);
        }
    });
})();
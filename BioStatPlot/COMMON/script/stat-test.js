/* ============================================================
   BioDataTools 假设检验模块
   支持：
     - 独立样本 t 检验（Student / Welch）
     - 配对样本 t 检验
     - Mann-Whitney U 检验（独立样本 Wilcoxon 秩和）
     - Wilcoxon 符号秩检验（配对样本）
   依赖：stat-common.js
   用法：
     StatTest.runTest(groupA, groupB, {
         method: 't' | 'wilcoxon',
         paired: true | false,
         varEqual: true | false,          // 仅 t 检验使用
         alternative: 'two-sided' | 'greater' | 'less'
     });
   ============================================================ */
(function (global) {
    'use strict';

    const SC = global.StatCommon;
    if (!SC) throw new Error('StatCommon is required by stat-test.js');

    /* ============================================================
       独立样本 t 检验
       opts: { varEqual, alternative }
    ============================================================ */
    function tTestIndependent(a, b, opts) {
        opts = opts || {};
        const alternative = opts.alternative || 'two-sided';
        const varEqual = opts.varEqual === true;

        const n1 = a.length, n2 = b.length;
        if (n1 < 2 || n2 < 2) return null;

        const m1 = SC.mean(a), m2 = SC.mean(b);
        const v1 = SC.variance(a, true), v2 = SC.variance(b, true);

        let t, df, se;
        if (varEqual) {
            // Student's t：合并方差
            const sp2 = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
            se = Math.sqrt(sp2 * (1 / n1 + 1 / n2));
            t = se > 0 ? (m1 - m2) / se : 0;
            df = n1 + n2 - 2;
        } else {
            // Welch's t：不假设方差相等
            const se2 = v1 / n1 + v2 / n2;
            se = Math.sqrt(se2);
            t = se > 0 ? (m1 - m2) / se : 0;
            const num = se2 * se2;
            const den = (v1 / n1) * (v1 / n1) / (n1 - 1) +
                        (v2 / n2) * (v2 / n2) / (n2 - 1);
            df = den > 0 ? num / den : (n1 + n2 - 2);
        }

        const p = SC.pFromT(t, df, alternative);

        return {
            test: 't-test (independent)',
            paired: false,
            method: varEqual ? 'Student' : 'Welch',
            alternative,
            statistic: t,
            df: df,
            pValue: p,
            n1, n2,
            mean1: m1, mean2: m2,
            meanDiff: m1 - m2,
            sd1: Math.sqrt(v1), sd2: Math.sqrt(v2),
            sem1: Math.sqrt(v1 / n1), sem2: Math.sqrt(v2 / n2),
            seDiff: se
        };
    }

    /* ============================================================
       配对样本 t 检验
       opts: { alternative }
    ============================================================ */
    function tTestPaired(a, b, opts) {
        opts = opts || {};
        const alternative = opts.alternative || 'two-sided';

        const n = Math.min(a.length, b.length);
        if (n < 2) return null;

        const diffs = [];
        for (let i = 0; i < n; i++) diffs.push(a[i] - b[i]);

        const md = SC.mean(diffs);
        const sdd = SC.sd(diffs, true);
        const sed = sdd / Math.sqrt(n);
        const t = sed > 0 ? md / sed : 0;
        const df = n - 1;
        const p = SC.pFromT(t, df, alternative);

        return {
            test: 't-test (paired)',
            paired: true,
            method: 'Paired Student',
            alternative,
            statistic: t,
            df: df,
            pValue: p,
            n,
            mean1: SC.mean(a),
            mean2: SC.mean(b),
            meanDiff: md,
            sdDiff: sdd,
            seDiff: sed
        };
    }

    /* ============================================================
       Mann-Whitney U 检验（独立样本 Wilcoxon 秩和）
       opts: { alternative }
       —— 正态近似，含并列秩校正与连续性校正
    ============================================================ */
    function mannWhitneyU(a, b, opts) {
        opts = opts || {};
        const alternative = opts.alternative || 'two-sided';

        const n1 = a.length, n2 = b.length;
        if (n1 < 1 || n2 < 1) return null;

        const combined = [];
        for (let i = 0; i < n1; i++) combined.push({ v: a[i], g: 0 });
        for (let i = 0; i < n2; i++) combined.push({ v: b[i], g: 1 });
        combined.sort((x, y) => x.v - y.v);

        const N = combined.length;
        const ranks = new Array(N);
        const tieGroups = [];
        let i = 0;
        while (i < N) {
            let j = i;
            while (j < N && combined[j].v === combined[i].v) j++;
            const avgRank = (i + 1 + j) / 2;
            for (let k = i; k < j; k++) ranks[k] = avgRank;
            if (j - i > 1) tieGroups.push(j - i);
            i = j;
        }

        let R1 = 0;
        for (let k = 0; k < N; k++) {
            if (combined[k].g === 0) R1 += ranks[k];
        }

        const U1 = R1 - n1 * (n1 + 1) / 2;
        const U2 = n1 * n2 - U1;
        const U = Math.min(U1, U2);

        const mu = n1 * n2 / 2;

        let tieCorr = 0;
        tieGroups.forEach(t => { tieCorr += t * t * t - t; });

        const sigma2 = n1 * n2 / 12 * ((N + 1) - tieCorr / (N * (N - 1)));
        const sigma = Math.sqrt(Math.max(sigma2, 1e-12));

        const diff = U1 - mu;
        const cc = diff > 0 ? -0.5 : 0.5;
        const z = sigma > 0 ? (diff + cc) / sigma : 0;

        const p = SC.pFromZ(z, alternative);

        return {
            test: 'Mann-Whitney U (Wilcoxon rank-sum)',
            paired: false,
            method: 'Mann-Whitney U',
            alternative,
            statistic: U,
            U1, U2,
            z,
            pValue: p,
            n1, n2,
            mean1: SC.mean(a), mean2: SC.mean(b),
            median1: SC.median(a), median2: SC.median(b),
            rankSum1: R1
        };
    }

    /* ============================================================
       Wilcoxon 符号秩检验（配对样本）
       opts: { alternative }
       —— 正态近似，含并列秩校正与连续性校正
    ============================================================ */
    function wilcoxonSignedRank(a, b, opts) {
        opts = opts || {};
        const alternative = opts.alternative || 'two-sided';

        const n = Math.min(a.length, b.length);
        if (n < 1) return null;

        const diffs = [];
        for (let i = 0; i < n; i++) {
            const d = a[i] - b[i];
            if (d !== 0) diffs.push(d);
        }
        const m = diffs.length;

        if (m === 0) {
            return {
                test: 'Wilcoxon signed-rank (paired)',
                paired: true,
                method: 'Wilcoxon signed-rank',
                alternative,
                statistic: 0,
                Wplus: 0, Wminus: 0,
                z: 0,
                pValue: 1,
                n, m: 0,
                meanDiff: 0, medianDiff: 0
            };
        }

        const absVals = diffs.map(d => Math.abs(d));
        const idx = absVals.map((v, i) => ({ v, i })).sort((x, y) => x.v - y.v);

        const ranks = new Array(m);
        const tieGroups = [];
        let i2 = 0;
        while (i2 < m) {
            let j = i2;
            while (j < m && idx[j].v === idx[i2].v) j++;
            const avg = (i2 + 1 + j) / 2;
            for (let k = i2; k < j; k++) ranks[idx[k].i] = avg;
            if (j - i2 > 1) tieGroups.push(j - i2);
            i2 = j;
        }

        let Wplus = 0, Wminus = 0;
        for (let k = 0; k < m; k++) {
            if (diffs[k] > 0) Wplus += ranks[k];
            else Wminus += ranks[k];
        }
        const W = Math.min(Wplus, Wminus);

        const mu = m * (m + 1) / 4;

        let tieCorr = 0;
        tieGroups.forEach(t => { tieCorr += t * t * t - t; });

        const sigma2 = m * (m + 1) * (2 * m + 1) / 24 - tieCorr / 48;
        const sigma = Math.sqrt(Math.max(sigma2, 1e-12));

        const diff = Wplus - mu;
        const cc = diff > 0 ? -0.5 : 0.5;
        const z = (diff + cc) / sigma;

        const p = SC.pFromZ(z, alternative);

        return {
            test: 'Wilcoxon signed-rank (paired)',
            paired: true,
            method: 'Wilcoxon signed-rank',
            alternative,
            statistic: W,
            Wplus, Wminus,
            z,
            pValue: p,
            n, m,
            meanDiff: SC.mean(diffs),
            medianDiff: SC.median(diffs)
        };
    }

    /* ============================================================
       统一入口
       opts: {
         method: 't' | 'wilcoxon',
         paired: true | false,
         varEqual: true | false,       // 仅 t 检验使用
         alternative: 'two-sided' | 'greater' | 'less'
       }
    ============================================================ */
    function runTest(a, b, opts) {
        opts = opts || {};
        const method = opts.method || 't';
        const paired = !!opts.paired;

        if (method === 't') {
            return paired
                ? tTestPaired(a, b, opts)
                : tTestIndependent(a, b, opts);
        }
        if (method === 'wilcoxon') {
            return paired
                ? wilcoxonSignedRank(a, b, opts)
                : mannWhitneyU(a, b, opts);
        }
        return null;
    }

    /* ============================================================
       多组两两比较 + 多重校正
       groups: [{ name, values }, ...]
       opts: { method, paired, varEqual, alternative, adjust }
       adjust: 'none' | 'bonferroni' | 'holm' | 'bh'
    ============================================================ */
    function pairwiseTests(groups, opts) {
        opts = opts || {};
        const pairs = [];
        for (let i = 0; i < groups.length; i++) {
            for (let j = i + 1; j < groups.length; j++) {
                const res = runTest(groups[i].values, groups[j].values, opts);
                if (res) {
                    res.groupA = groups[i].name;
                    res.groupB = groups[j].name;
                    pairs.push(res);
                }
            }
        }

        if (opts.adjust && opts.adjust !== 'none') {
            const pvals = pairs.map(p => p.pValue);
            const adj = SC.adjustP(pvals, opts.adjust);
            pairs.forEach((p, i) => {
                p.pValueRaw = p.pValue;
                p.pValue = adj[i];
                p.pAdjusted = true;
                p.adjustMethod = opts.adjust;
            });
        }

        return pairs;
    }

    /* ============================================================
       对外暴露
    ============================================================ */
    global.StatTest = {
        tTestIndependent,
        tTestPaired,
        mannWhitneyU,
        wilcoxonSignedRank,
        runTest,
        pairwiseTests
    };
})(window);
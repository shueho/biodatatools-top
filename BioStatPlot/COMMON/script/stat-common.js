/* ============================================================
   BioDataTools 通用统计工具模块
   用途：描述统计、分布函数、p 值、显著性星号、多重比较校正
   ============================================================ */
(function (global) {
    'use strict';

    /* ============================================================
       基础数值工具
    ============================================================ */
    function mean(arr) {
        if (!arr || !arr.length) return 0;
        let s = 0;
        for (const v of arr) s += v;
        return s / arr.length;
    }

    function sum(arr) {
        let s = 0;
        for (const v of arr) s += v;
        return s;
    }

    function variance(arr, sample) {
        const n = arr.length;
        if (n < 1) return 0;
        const m = mean(arr);
        let s = 0;
        for (const v of arr) {
            const d = v - m;
            s += d * d;
        }
        if (sample === false) return s / n;
        return n > 1 ? s / (n - 1) : 0;
    }

    function sd(arr, sample) {
        return Math.sqrt(variance(arr, sample === undefined ? true : sample));
    }

    function sem(arr) {
        const n = arr.length;
        if (n < 2) return 0;
        return sd(arr, true) / Math.sqrt(n);
    }

    function median(arr) {
        const s = arr.slice().sort((a, b) => a - b);
        const n = s.length;
        if (!n) return 0;
        return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    }

    function quantile(sorted, p) {
        const n = sorted.length;
        if (n === 0) return 0;
        if (n === 1) return sorted[0];
        const pos = (n - 1) * p;
        const lo = Math.floor(pos);
        const hi = Math.ceil(pos);
        if (lo === hi) return sorted[lo];
        const frac = pos - lo;
        return sorted[lo] * (1 - frac) + sorted[hi] * frac;
    }

    /* ============================================================
       特殊函数（用于精确计算 p 值）
    ============================================================ */
    // Lanczos 近似下的 ln Γ(x)
    function logGamma(x) {
        const g = 7;
        const C = [
            0.99999999999980993,
            676.5203681218851,
            -1259.1392167224028,
            771.32342877765313,
            -176.61502916214059,
            12.507343278686905,
            -0.13857109526572012,
            9.9843695780195716e-6,
            1.5056327351493116e-7
        ];
        if (x < 0.5) {
            return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
        }
        x -= 1;
        let a = C[0];
        const t = x + g + 0.5;
        for (let i = 1; i < g + 2; i++) a += C[i] / (x + i);
        return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
    }

    // 正则化不完全贝塔函数：连分式部分
    function betacf(a, b, x) {
        const MAXIT = 200;
        const EPS = 3e-12;
        const FPMIN = 1e-300;
        const qab = a + b;
        const qap = a + 1;
        const qam = a - 1;
        let c = 1;
        let d = 1 - qab * x / qap;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        d = 1 / d;
        let h = d;
        for (let m = 1; m <= MAXIT; m++) {
            const m2 = 2 * m;
            let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
            d = 1 + aa * d;
            if (Math.abs(d) < FPMIN) d = FPMIN;
            c = 1 + aa / c;
            if (Math.abs(c) < FPMIN) c = FPMIN;
            d = 1 / d;
            h *= d * c;
            aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
            d = 1 + aa * d;
            if (Math.abs(d) < FPMIN) d = FPMIN;
            c = 1 + aa / c;
            if (Math.abs(c) < FPMIN) c = FPMIN;
            d = 1 / d;
            const del = d * c;
            h *= del;
            if (Math.abs(del - 1) < EPS) break;
        }
        return h;
    }

    // 正则化不完全贝塔函数 I_x(a, b)
    function betai(a, b, x) {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        const bt = Math.exp(
            logGamma(a + b) - logGamma(a) - logGamma(b) +
            a * Math.log(x) + b * Math.log(1 - x)
        );
        if (x < (a + 1) / (a + b + 2)) {
            return bt * betacf(a, b, x) / a;
        }
        return 1 - bt * betacf(b, a, 1 - x) / b;
    }

    // 学生 t 分布 CDF：P(T ≤ t)
    function tCDF(t, df) {
        if (!isFinite(t) || !isFinite(df) || df <= 0) return NaN;
        const x = df / (df + t * t);
        const ib = betai(df / 2, 0.5, x);
        return t > 0 ? 1 - ib / 2 : ib / 2;
    }

    // 标准正态 CDF（Abramowitz & Stegun 26.2.17，误差 < 1e-7）
    function normCDF(z) {
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.3989422804014327 * Math.exp(-z * z / 2);
        const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
        return z >= 0 ? 1 - p : p;
    }

    // 标准正态逆 CDF（Acklam 算法）
    function normInv(p) {
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;
        const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
        const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
        const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
        const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
        const pLow = 0.02425;
        const pHigh = 1 - pLow;
        let q, r;
        if (p < pLow) {
            q = Math.sqrt(-2 * Math.log(p));
            return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                   ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
        } else if (p <= pHigh) {
            q = p - 0.5;
            r = q * q;
            return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
                   (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
        } else {
            q = Math.sqrt(-2 * Math.log(1 - p));
            return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
        }
    }

    // 由 t 统计量计算 p 值
    // alternative: 'two-sided' | 'greater' | 'less'
    function pFromT(t, df, alternative) {
        alternative = alternative || 'two-sided';
        if (alternative === 'two-sided') {
            return 2 * (1 - tCDF(Math.abs(t), df));
        }
        if (alternative === 'greater') return 1 - tCDF(t, df);
        return tCDF(t, df);
    }

    // 由 z 统计量计算 p 值
    function pFromZ(z, alternative) {
        alternative = alternative || 'two-sided';
        if (alternative === 'two-sided') {
            return 2 * (1 - normCDF(Math.abs(z)));
        }
        if (alternative === 'greater') return 1 - normCDF(z);
        return normCDF(z);
    }

    /* ============================================================
       描述统计
    ============================================================ */
    // t 分布 95% 双侧临界值（供小样本置信区间使用；df > 30 用 1.96）
    function t95(df) {
        if (df <= 0) return 0;
        const table = {
            1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
            6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
            11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
            16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
            21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
            26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042
        };
        return table[df] || 1.96;
    }

    // 完整描述统计
    function calcStats(values) {
        const n = values.length;
        if (n === 0) return null;

        const sorted = values.slice().sort((a, b) => a - b);

        let sumV = 0;
        for (const v of values) sumV += v;
        const meanV = sumV / n;

        let ss = 0, m3 = 0, m4 = 0;
        for (const v of values) {
            const d = v - meanV;
            ss += d * d;
            m3 += d * d * d;
            m4 += d * d * d * d;
        }

        const sdV = n > 1 ? Math.sqrt(ss / (n - 1)) : 0;
        const sdPop = Math.sqrt(ss / n);
        const semV = n > 1 ? sdV / Math.sqrt(n) : 0;

        const med = (n % 2 === 1)
            ? sorted[(n - 1) / 2]
            : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

        const min = sorted[0];
        const max = sorted[n - 1];
        const range = max - min;

        const q1 = quantile(sorted, 0.25);
        const q3 = quantile(sorted, 0.75);
        const iqr = q3 - q1;

        const cv = meanV !== 0 ? (sdV / Math.abs(meanV)) * 100 : 0;

        let skewness = null, seSkewness = null;
        if (n > 2 && sdV > 0) {
            skewness = (n / ((n - 1) * (n - 2))) * (m3 / Math.pow(sdV, 3));
            seSkewness = Math.sqrt(6 * n * (n - 1) / ((n - 2) * (n + 1) * (n + 3)));
        }

        let kurtosis = null, seKurtosis = null;
        if (n > 3 && sdV > 0) {
            kurtosis = (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * (m4 / Math.pow(sdV, 4))
                     - 3 * (n - 1) * (n - 1) / ((n - 2) * (n - 3));
            seKurtosis = 2 * seSkewness * Math.sqrt((n * n - 1) / ((n - 3) * (n + 5)));
        }

        const tVal = t95(n - 1);
        const ciHalf = tVal * semV;
        const ciLower = meanV - ciHalf;
        const ciUpper = meanV + ciHalf;

        return {
            n, sum: sumV, mean: meanV,
            sd: sdV, sdPop: sdPop, sem: semV,
            median: med,
            min, max, range,
            q1, q3, iqr,
            cv,
            skewness, seSkewness,
            kurtosis, seKurtosis,
            ciHalf, ciLower, ciUpper
        };
    }

    /* ============================================================
       格式化与星号
    ============================================================ */
    function formatNum(v, decimals) {
        if (v === null || v === undefined) return '';
        if (!isFinite(v)) return '';
        if (decimals === undefined) {
            if (Number.isInteger(v)) return String(v);
            return parseFloat(v.toFixed(4)).toString();
        }
        return Number(v).toFixed(decimals);
    }

    function formatP(p, opts) {
        opts = opts || {};
        if (!isFinite(p)) return 'NA';
        const eps = opts.eps || 0.001;
        const decimals = opts.decimals === undefined ? 4 : opts.decimals;
        if (p < eps) return '<' + eps;
        return p.toFixed(decimals);
    }

    // 0.05 阈值对应显著性星号
    function pToStars(p) {
        if (!isFinite(p)) return '';
        if (p < 0.001) return '***';
        if (p < 0.01) return '**';
        if (p < 0.05) return '*';
        return 'ns';
    }

    /* ============================================================
       多重比较校正
       method: 'none' | 'bonferroni' | 'holm' | 'bh'
    ============================================================ */
    function adjustP(pvals, method) {
        method = method || 'holm';
        const n = pvals.length;
        const out = new Array(n);

        if (method === 'none') {
            for (let i = 0; i < n; i++) out[i] = pvals[i];
            return out;
        }

        if (method === 'bonferroni') {
            for (let i = 0; i < n; i++) out[i] = Math.min(1, pvals[i] * n);
            return out;
        }

        const idx = pvals.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);

        if (method === 'holm') {
            let prev = 0;
            idx.forEach((it, k) => {
                const adj = Math.max(prev, (n - k) * it.p);
                out[it.i] = Math.min(1, adj);
                prev = adj;
            });
            return out;
        }

        if (method === 'bh') {
            let prev = 1;
            for (let k = n - 1; k >= 0; k--) {
                const adj = Math.min(prev, idx[k].p * n / (k + 1));
                out[idx[k].i] = adj;
                prev = adj;
            }
            return out;
        }

        return out;
    }

    /* ============================================================
       由重复观测值计算误差棒（SD / SEM）
       @param {number[]} values
       @param {'sd'|'sem'} type
    ============================================================ */
    function computeErrorStats(values, type) {
        type = type || 'sd';
        if (!values || !values.length) {
            return { n: 0, mean: 0, sd: 0, sem: 0, err: 0, upper: 0, lower: 0 };
        }
        const n = values.length;
        const m = mean(values);
        const s = sd(values, true);
        const se = n > 1 ? s / Math.sqrt(n) : 0;
        const err = (type === 'sem') ? se : s;
        return { n: n, mean: m, sd: s, sem: se, err: err, upper: m + err, lower: m - err };
    }

    /* ============================================================
       对外暴露
    ============================================================ */
    global.StatCommon = {
        mean, sum, variance, sd, sem, median, quantile,
        logGamma, betacf, betai, tCDF, normCDF, normInv,
        pFromT, pFromZ,
        t95, calcStats,
        computeErrorStats, 
        formatNum, formatP, pToStars,
        adjustP
    };
})(window);
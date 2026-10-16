/* ============================================================
   BioDataTools 曲线拟合工具模块
   ============================================================ */
(function (global) {
    'use strict';

    /* ---------- 正态分布概率密度函数 ---------- */
    function normalPDF(x, mu, sigma) {
        if (!isFinite(x) || !isFinite(mu) || !isFinite(sigma) || sigma <= 0) return 0;
        const z = (x - mu) / sigma;
        return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
    }

    /* ---------- 正态曲线采样 ----------
       opts:
         mu, sigma           : 正态参数
         xMin, xMax          : 采样区间
         n                   : 采样点数（默认 200）
         mode                : 'count'（频数）| 'frequency'（频率）
         binWidth            : 组间距
         total               : 样本总数（count 模式使用）
       返回：[{x, y}, ...]
    ------------------------------------ */
    function sampleNormalCurve(opts) {
        opts = opts || {};
        const mu = opts.mu;
        const sigma = opts.sigma;
        const xMin = opts.xMin;
        const xMax = opts.xMax;
        const n = Math.max(2, opts.n || 200);
        const mode = opts.mode || 'count';
        const binWidth = opts.binWidth || 1;
        const total = opts.total || 0;

        if (!isFinite(mu) || !isFinite(sigma) || sigma <= 0) return [];
        if (!isFinite(xMin) || !isFinite(xMax) || xMax <= xMin) return [];

        const pts = [];
        for (let i = 0; i <= n; i++) {
            const x = xMin + (xMax - xMin) * i / n;
            const pdf = normalPDF(x, mu, sigma);
            let y;
            if (mode === 'frequency') {
                y = pdf * binWidth * 100;
            } else {
                y = pdf * binWidth * total;
            }
            pts.push({ x: x, y: y });
        }
        return pts;
    }

    /* ---------- 简单线性回归：y = intercept + slope * x ---------- */
    function linearRegression(xs, ys) {
        const n = Math.min(xs.length, ys.length);
        if (n < 2) return null;
        let sx = 0, sy = 0, sxx = 0, sxy = 0;
        for (let i = 0; i < n; i++) {
            sx  += xs[i];
            sy  += ys[i];
            sxx += xs[i] * xs[i];
            sxy += xs[i] * ys[i];
        }
        const denom = n * sxx - sx * sx;
        if (Math.abs(denom) < 1e-12) return null;
        const slope     = (n * sxy - sx * sy) / denom;
        const intercept = (sy - slope * sx) / n;
        return {
            slope: slope,
            intercept: intercept,
            predict: function (x) { return intercept + slope * x; }
        };
    }

    /* ---------- 多项式最小二乘拟合（degree 次） ---------- */
    function polyFit(xs, ys, degree) {
        const n = Math.min(xs.length, ys.length);
        degree = degree || 1;
        if (n < degree + 1) return null;

        const m = degree + 1;
        const A = [];
        const b = new Array(m).fill(0);
        for (let i = 0; i < m; i++) A.push(new Array(m).fill(0));

        for (let k = 0; k < n; k++) {
            const x = xs[k], y = ys[k];
            const powers = [1];
            for (let p = 1; p <= 2 * degree; p++) powers.push(powers[p - 1] * x);
            for (let i = 0; i < m; i++) {
                for (let j = 0; j < m; j++) A[i][j] += powers[i + j];
                b[i] += powers[i] * y;
            }
        }

        // 高斯消元
        for (let i = 0; i < m; i++) {
            let pivot = i;
            for (let r = i + 1; r < m; r++) {
                if (Math.abs(A[r][i]) > Math.abs(A[pivot][i])) pivot = r;
            }
            if (Math.abs(A[pivot][i]) < 1e-12) return null;
            if (pivot !== i) {
                const tmp = A[i]; A[i] = A[pivot]; A[pivot] = tmp;
                const tb = b[i]; b[i] = b[pivot]; b[pivot] = tb;
            }
            const div = A[i][i];
            for (let j = i; j < m; j++) A[i][j] /= div;
            b[i] /= div;
            for (let r = 0; r < m; r++) {
                if (r === i) continue;
                const f = A[r][i];
                if (f === 0) continue;
                for (let j = i; j < m; j++) A[r][j] -= f * A[i][j];
                b[r] -= f * b[i];
            }
        }

        const coeffs = b.slice();
        return {
            coeffs: coeffs,
            predict: function (x) {
                let s = 0, p = 1;
                for (let i = 0; i < coeffs.length; i++) {
                    s += coeffs[i] * p;
                    p *= x;
                }
                return s;
            }
        };
    }

    global.StatFitting = {
        normalPDF: normalPDF,
        sampleNormalCurve: sampleNormalCurve,
        linearRegression: linearRegression,
        polyFit: polyFit
    };
})(window);
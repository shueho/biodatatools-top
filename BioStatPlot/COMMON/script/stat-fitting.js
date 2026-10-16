(function (global) {
    'use strict';

    /* ============================================================
       基础分布
    ============================================================ */
    function normalPDF(x, mu, sigma) {
        if (!isFinite(x) || !isFinite(mu) || !isFinite(sigma) || sigma <= 0) return 0;
        const z = (x - mu) / sigma;
        return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
    }

    function normalCDF(z) {
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.3989422804014327 * Math.exp(-z * z / 2);
        const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
        return z >= 0 ? 1 - p : p;
    }

    function sampleNormalCurve(opts) {
        opts = opts || {};
        const mu = opts.mu, sigma = opts.sigma;
        const xMin = opts.xMin, xMax = opts.xMax;
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
            let y = (mode === 'frequency') ? pdf * binWidth * 100 : pdf * binWidth * total;
            pts.push({ x: x, y: y });
        }
        return pts;
    }

    function logGamma(x) {
        const g = 7;
        const C = [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
        ];
        if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
        x -= 1;
        let a = C[0];
        const t = x + g + 0.5;
        for (let i = 1; i < g + 2; i++) a += C[i] / (x + i);
        return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
    }

    function betacf(a, b, x) {
        const MAXIT = 200, EPS = 3e-12, FPMIN = 1e-300;
        const qab = a + b, qap = a + 1, qam = a - 1;
        let c = 1;
        let d = 1 - qab * x / qap;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        d = 1 / d;
        let h = d;
        for (let m = 1; m <= MAXIT; m++) {
            const m2 = 2 * m;
            let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
            d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
            c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
            d = 1 / d; h *= d * c;
            aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
            d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
            c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
            d = 1 / d;
            const del = d * c;
            h *= del;
            if (Math.abs(del - 1) < EPS) break;
        }
        return h;
    }

    function betai(a, b, x) {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b)
            + a * Math.log(x) + b * Math.log(1 - x));
        if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
        return 1 - bt * betacf(b, a, 1 - x) / b;
    }

    function localTCDF(t, df) {
        if (!isFinite(t) || !isFinite(df) || df <= 0) return NaN;
        const x = df / (df + t * t);
        const ib = betai(df / 2, 0.5, x);
        return t > 0 ? 1 - ib / 2 : ib / 2;
    }

    function coefPValue(stat, df, asymptotic) {
        if (!isFinite(stat)) return NaN;
        if (asymptotic) return 2 * (1 - normalCDF(Math.abs(stat)));
        if (df > 0 && isFinite(df)) {
            const cdf = localTCDF(Math.abs(stat), df);
            if (isFinite(cdf)) return 2 * (1 - cdf);
        }
        return 2 * (1 - normalCDF(Math.abs(stat)));
    }

    /* ============================================================
       工具函数
    ============================================================ */
    function sanitizePairs(xs, ys) {
        const outX = [], outY = [];
        const n = Math.min(xs.length, ys.length);
        for (let i = 0; i < n; i++) {
            const x = xs[i], y = ys[i];
            if (isFinite(x) && isFinite(y)) { outX.push(x); outY.push(y); }
        }
        return { xs: outX, ys: outY, n: outX.length, removed: n - outX.length };
    }

    function solveLinearSystem(A, b) {
        const n = A.length;
        if (n === 0) return null;
        const scale = new Array(n);
        for (let i = 0; i < n; i++) {
            let mx = 0;
            for (let j = 0; j < n; j++) mx = Math.max(mx, Math.abs(A[i][j]));
            scale[i] = mx > 1e-300 ? 1 / mx : 1;
        }
        const M = A.map(function (row, i) {
            const r = row.map(function (v) { return v * scale[i]; });
            r.push(b[i] * scale[i]);
            return r;
        });
        for (let i = 0; i < n; i++) {
            let pivot = i, maxAbs = Math.abs(M[i][i]);
            for (let r = i + 1; r < n; r++) {
                const v = Math.abs(M[r][i]);
                if (v > maxAbs) { maxAbs = v; pivot = r; }
            }
            if (maxAbs < 1e-14) return null;
            if (pivot !== i) { const tmp = M[i]; M[i] = M[pivot]; M[pivot] = tmp; }
            const div = M[i][i];
            for (let c = i; c <= n; c++) M[i][c] /= div;
            for (let r = 0; r < n; r++) {
                if (r === i) continue;
                const f = M[r][i];
                if (f === 0) continue;
                for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
            }
        }
        const x = new Array(n).fill(0);
        for (let i = 0; i < n; i++) x[i] = M[i][n];
        return x;
    }

    function invertMatrix(A) {
        const n = A.length;
        if (n === 0) return null;
        const scale = new Array(n);
        for (let i = 0; i < n; i++) {
            let mx = 0;
            for (let j = 0; j < n; j++) mx = Math.max(mx, Math.abs(A[i][j]));
            scale[i] = mx > 1e-300 ? 1 / mx : 1;
        }
        const M = A.map(function (row, i) {
            return row.map(function (v) { return v * scale[i]; });
        });
        const inv = [];
        for (let i = 0; i < n; i++) {
            const e = new Array(n).fill(0);
            e[i] = 1;
            inv.push(e);
        }
        for (let i = 0; i < n; i++) {
            let pivot = i, maxAbs = Math.abs(M[i][i]);
            for (let r = i + 1; r < n; r++) {
                const v = Math.abs(M[r][i]);
                if (v > maxAbs) { maxAbs = v; pivot = r; }
            }
            if (maxAbs < 1e-14) return null;
            if (pivot !== i) {
                const tmp = M[i]; M[i] = M[pivot]; M[pivot] = tmp;
                const tmp2 = inv[i]; inv[i] = inv[pivot]; inv[pivot] = tmp2;
            }
            const div = M[i][i];
            for (let j = 0; j < n; j++) { M[i][j] /= div; inv[i][j] /= div; }
            for (let r = 0; r < n; r++) {
                if (r === i) continue;
                const f = M[r][i];
                if (f === 0) continue;
                for (let j = 0; j < n; j++) {
                    M[r][j] -= f * M[i][j];
                    inv[r][j] -= f * inv[i][j];
                }
            }
        }
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) inv[i][j] *= scale[j];
        }
        return inv;
    }

    function quadForm(v, Ainv) {
        const p = v.length;
        let s = 0;
        for (let i = 0; i < p; i++) {
            if (v[i] === 0) continue;
            let rowSum = 0;
            for (let j = 0; j < p; j++) {
                if (v[j] === 0) continue;
                rowSum += Ainv[i][j] * v[j];
            }
            s += v[i] * rowSum;
        }
        return s;
    }

    function binom(n, k) {
        if (k < 0 || k > n) return 0;
        if (k > n - k) k = n - k;
        let r = 1;
        for (let i = 1; i <= k; i++) r = r * (n - k + i) / i;
        return r;
    }

    /* ============================================================
       多项式
    ============================================================ */
    function polyFit(xs, ys, degree) {
        const n = Math.min(xs.length, ys.length);
        degree = degree || 1;
        if (n < degree + 1) return null;
        let xMean = 0;
        for (let i = 0; i < n; i++) xMean += xs[i];
        xMean /= n;
        let varX = 0;
        for (let i = 0; i < n; i++) { const d = xs[i] - xMean; varX += d * d; }
        let xScale = Math.sqrt(varX / n);
        if (!isFinite(xScale) || xScale < 1e-12) xScale = 1;
        const xsN = xs.map(function (x) { return (x - xMean) / xScale; });
        const m = degree + 1;
        const A = [], b = new Array(m).fill(0);
        for (let i = 0; i < m; i++) A.push(new Array(m).fill(0));
        for (let k = 0; k < n; k++) {
            const x = xsN[k], y = ys[k];
            const powers = [1];
            for (let p = 1; p <= 2 * degree; p++) powers.push(powers[p - 1] * x);
            for (let i = 0; i < m; i++) {
                for (let j = 0; j < m; j++) A[i][j] += powers[i + j];
                b[i] += powers[i] * y;
            }
        }
        const coeffsN = solveLinearSystem(A, b);
        if (!coeffsN) return null;
        const origCoeffs = new Array(m).fill(0);
        for (let i = 0; i < m; i++) {
            const ci = coeffsN[i] / Math.pow(xScale, i);
            for (let j = 0; j <= i; j++) {
                origCoeffs[j] += ci * binom(i, j) * Math.pow(-xMean, i - j);
            }
        }
        return {
            coeffs: origCoeffs, coeffsN: coeffsN,
            xMean: xMean, xScale: xScale,
            predict: function (x) {
                const t = (x - xMean) / xScale;
                let s = 0, p = 1;
                for (let i = 0; i < coeffsN.length; i++) { s += coeffsN[i] * p; p *= t; }
                return s;
            }
        };
    }

    function linearRegression(xs, ys) {
        const s = sanitizePairs(xs, ys);
        if (s.n < 2) return null;
        const X = s.xs, Y = s.ys;
        let sx = 0, sy = 0, sxx = 0, sxy = 0;
        for (let i = 0; i < s.n; i++) {
            sx += X[i]; sy += Y[i];
            sxx += X[i] * X[i]; sxy += X[i] * Y[i];
        }
        const denom = s.n * sxx - sx * sx;
        if (Math.abs(denom) < 1e-12) return null;
        const slope = (s.n * sxy - sx * sy) / denom;
        const intercept = (sy - slope * sx) / s.n;
        return {
            slope: slope, intercept: intercept,
            predict: function (x) { return intercept + slope * x; }
        };
    }

    /* ============================================================
       LM
    ============================================================ */
    function lmFit(xs, ys, opts) {
        opts = opts || {};
        const clean = sanitizePairs(xs, ys);
        if (clean.n < 2) return null;
        const X = clean.xs, Y = clean.ys;
        const n = clean.n;
        const degree = opts.degree || 1;
        const result = polyFit(X, Y, degree);
        if (!result) return null;
        const p = degree + 1;
        const df = Math.max(1, n - p);
        let meanY = 0;
        for (let i = 0; i < n; i++) meanY += Y[i];
        meanY /= n;
        let ssTot = 0, ssRes = 0;
        for (let i = 0; i < n; i++) {
            const yHat = result.predict(X[i]);
            ssTot += (Y[i] - meanY) * (Y[i] - meanY);
            ssRes += (Y[i] - yHat) * (Y[i] - yHat);
        }
        const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
        const sigma2 = ssRes / df;
        const rmse = Math.sqrt(sigma2);
        const xMean = result.xMean, xScale = result.xScale;
        const XtX = [];
        for (let i = 0; i < p; i++) XtX.push(new Array(p).fill(0));
        for (let k = 0; k < n; k++) {
            const t = (X[k] - xMean) / xScale;
            const powers = [1];
            for (let q = 1; q < p; q++) powers.push(powers[q - 1] * t);
            for (let i = 0; i < p; i++) {
                for (let j = 0; j < p; j++) XtX[i][j] += powers[i] * powers[j];
            }
        }
        const XtXInv = invertMatrix(XtX);
        const coefSE = new Array(p).fill(NaN);
        const coefT = new Array(p).fill(NaN);
        const coefP = new Array(p).fill(NaN);
        if (XtXInv) {
            for (let i = 0; i < p; i++) {
                const v = XtXInv[i][i];
                if (v >= 0) {
                    coefSE[i] = Math.sqrt(v * sigma2);
                    if (coefSE[i] > 0) {
                        coefT[i] = result.coeffsN[i] / coefSE[i];
                        coefP[i] = coefPValue(coefT[i], df, false);
                    }
                }
            }
        }
        const sigma2ML = ssRes / n;
        let aic = NaN;
        if (sigma2ML > 0) aic = n * (Math.log(2 * Math.PI) + 1 + Math.log(sigma2ML)) + 2 * (p + 1);
        return {
            type: 'lm', degree: degree,
            coeffs: result.coeffs, coeffsN: result.coeffsN,
            xMean: xMean, xScale: xScale, XtXInv: XtXInv,
            predict: result.predict,
            r2: r2, rmse: rmse, sigma2: sigma2, df: df, n: n,
            coefSE: coefSE, coefT: coefT, coefP: coefP, aic: aic
        };
    }

    /* ============================================================
       GLM
    ============================================================ */
    function glmFit(xs, ys, opts) {
        opts = opts || {};
        const family = opts.family || 'gaussian';

        let useCbind = false;
        let succArr = null, failArr = null;

        let clean;
        if (Array.isArray(ys) && ys.length && typeof ys[0] === 'object' && ys[0] !== null
            && ys[0].success != null && ys[0].failure != null) {
            const n0 = Math.min(xs.length, ys.length);
            const cx = [], cs = [], cf = [];
            for (let i = 0; i < n0; i++) {
                const x = xs[i], o = ys[i];
                if (!isFinite(x)) continue;
                const sc = Number(o.success), fl = Number(o.failure);
                if (!isFinite(sc) || !isFinite(fl)) continue;
                cx.push(x); cs.push(sc); cf.push(fl);
            }
            clean = { xs: cx, n: cx.length };
            useCbind = true;
            succArr = cs; failArr = cf;
        } else if (opts.nTrials && Array.isArray(opts.nTrials) && opts.nTrials.length === ys.length) {
            clean = sanitizePairs(xs, ys);
            useCbind = true;
            succArr = clean.ys.slice();
            failArr = opts.nTrials.map(function (t, i) {
                const s = succArr[i];
                return Math.max(0, t - s);
            });
        } else {
            clean = sanitizePairs(xs, ys);
        }
        if (!clean || clean.n < 2) return null;
        const X = clean.xs;
        const n = clean.n;

        if (family === 'gaussian') {
            const Y = useCbind
                ? succArr.map(function (s, i) { return s / (s + failArr[i]); })
                : clean.ys;
            const lm = lmFit(X, Y, { degree: 1 });
            if (lm) { lm.type = 'glm'; lm.family = 'gaussian'; }
            return lm;
        }

        let Y, weights_special = null;
        if (useCbind) {
            Y = succArr.map(function (s, i) {
                const t = s + failArr[i];
                return t > 0 ? s / t : 0.5;
            });
            weights_special = succArr.map(function (s, i) { return s + failArr[i]; });
        } else {
            Y = clean.ys;
        }

        let b0 = 0, b1 = 0;
        let converged = false;

        if (family === 'poisson') {
            let meanY = 0;
            for (let i = 0; i < n; i++) meanY += Y[i];
            meanY /= n;
            b0 = Math.log(Math.max(meanY, 0.1));
            b1 = 0;
            const logY = Y.map(function (y) { return Math.log(y + 0.5); });
            const init = polyFit(X, logY, 1);
            if (init && isFinite(init.coeffs[0]) && isFinite(init.coeffs[1])) {
                b0 = init.coeffs[0];
                b1 = init.coeffs[1];
            }
            for (let iter = 0; iter < 100; iter++) {
                let sw = 0, swx = 0, swz = 0, swxx = 0, swxz = 0;
                let ok = true;
                for (let i = 0; i < n; i++) {
                    const eta = b0 + b1 * X[i];
                    const mu = Math.exp(eta);
                    if (!isFinite(mu) || mu <= 0) { ok = false; break; }
                    const w = mu;
                    const z = eta + (Y[i] - mu) / mu;
                    sw += w; swx += w * X[i]; swz += w * z;
                    swxx += w * X[i] * X[i]; swxz += w * X[i] * z;
                }
                if (!ok || sw === 0) break;
                const denom = sw * swxx - swx * swx;
                if (Math.abs(denom) < 1e-12) break;
                const nb1 = (sw * swxz - swx * swz) / denom;
                const nb0 = (swz - nb1 * swx) / sw;
                if (!isFinite(nb0) || !isFinite(nb1)) break;
                const delta = Math.abs(nb0 - b0) + Math.abs(nb1 - b1);
                b0 = nb0; b1 = nb1;
                if (delta < 1e-10) { converged = true; break; }
            }
        } else if (family === 'binomial') {
            let meanY = 0;
            for (let i = 0; i < n; i++) meanY += Y[i];
            meanY /= n;
            meanY = Math.max(0.01, Math.min(0.99, meanY));
            b0 = Math.log(meanY / (1 - meanY));
            b1 = 0;
            for (let iter = 0; iter < 100; iter++) {
                let sw = 0, swx = 0, swz = 0, swxx = 0, swxz = 0;
                for (let i = 0; i < n; i++) {
                    const eta = b0 + b1 * X[i];
                    const mu = 1 / (1 + Math.exp(-eta));
                    const mi = weights_special ? weights_special[i] : 1;
                    const w = Math.max(mu * (1 - mu) * mi, 1e-12);
                    const z = eta + (Y[i] - mu) / Math.max(mu * (1 - mu), 1e-12);
                    sw += w; swx += w * X[i]; swz += w * z;
                    swxx += w * X[i] * X[i]; swxz += w * X[i] * z;
                }
                const denom = sw * swxx - swx * swx;
                if (Math.abs(denom) < 1e-12) break;
                const nb1 = (sw * swxz - swx * swz) / denom;
                const nb0 = (swz - nb1 * swx) / sw;
                if (!isFinite(nb0) || !isFinite(nb1)) break;
                const delta = Math.abs(nb0 - b0) + Math.abs(nb1 - b1);
                b0 = nb0; b1 = nb1;
                if (delta < 1e-10) { converged = true; break; }
            }
        } else {
            return null;
        }

        const XtWX = [[0, 0], [0, 0]];
        let logLik = 0;
        let deviance = 0;

        for (let i = 0; i < n; i++) {
            const eta = b0 + b1 * X[i];
            let w, ll, dev_i;
            if (family === 'poisson') {
                const mu = Math.exp(eta);
                w = mu;
                const y = Y[i];
                ll = y * Math.log(mu) - mu - logGamma(y + 1);
                dev_i = y > 0 ? 2 * (y * Math.log(y / mu) - (y - mu)) : 2 * mu;
            } else {
                const mu = 1 / (1 + Math.exp(-eta));
                const muC = Math.max(1e-12, Math.min(1 - 1e-12, mu));
                const mi = weights_special ? weights_special[i] : 1;
                w = Math.max(muC * (1 - muC) * mi, 1e-12);
                const y = Y[i];
                if (useCbind) {
                    const s = succArr[i], f = failArr[i];
                    ll = s * Math.log(muC) + f * Math.log(1 - muC)
                        + logGamma(s + f + 1) - logGamma(s + 1) - logGamma(f + 1);
                    dev_i = -2 * (s * Math.log(muC) + f * Math.log(1 - muC)
                        - s * Math.log(s / (s + f) || 1) - f * Math.log(f / (s + f) || 1));
                } else {
                    ll = y * Math.log(muC) + (1 - y) * Math.log(1 - muC);
                    dev_i = -2 * ll;
                }
            }
            XtWX[0][0] += w;
            XtWX[0][1] += w * X[i];
            XtWX[1][0] += w * X[i];
            XtWX[1][1] += w * X[i] * X[i];
            logLik += ll;
            deviance += dev_i;
        }

        const XtWXInv = invertMatrix(XtWX);

        const coefSE = [NaN, NaN];
        const coefZ = [NaN, NaN];
        const coefP = [NaN, NaN];
        if (XtWXInv) {
            for (let i = 0; i < 2; i++) {
                const v = XtWXInv[i][i];
                if (v >= 0) {
                    coefSE[i] = Math.sqrt(v);
                    if (coefSE[i] > 0) {
                        coefZ[i] = (i === 0 ? b0 : b1) / coefSE[i];
                        coefP[i] = coefPValue(coefZ[i], n, true);
                    }
                }
            }
        }

        const aic = -2 * logLik + 2 * 2;

        return {
            type: 'glm',
            family: family,
            coeffs: [b0, b1],
            XtWXInv: XtWXInv,
            converged: converged,
            n: n,
            df: Math.max(1, n - 2),
            deviance: deviance,
            logLik: logLik,
            aic: aic,
            coefSE: coefSE, coefZ: coefZ, coefP: coefP,
            useCbind: useCbind,
            predict: function (x) {
                const eta = b0 + b1 * x;
                if (family === 'poisson') return Math.exp(eta);
                return 1 / (1 + Math.exp(-eta));
            }
        };
    }

    /* ============================================================
       Loess
    ============================================================ */
    function loessFit(xs, ys, opts) {
        opts = opts || {};
        const clean = sanitizePairs(xs, ys);
        if (clean.n < 3) return null;
        const X = clean.xs, Y = clean.ys;
        const n = clean.n;

        const span = Math.max(0.05, Math.min(1, opts.span || 0.75));
        let degree = opts.degree != null ? opts.degree : 2;
        if (!isFinite(degree)) degree = 2;
        degree = Math.max(0, Math.min(2, Math.round(degree)));
        const robust = !!opts.robust;
        const nSpan = Math.max(degree + 1, Math.ceil(span * n));
        const p = degree + 1;

        const fitted = new Array(n).fill(0);
        let weights = new Array(n).fill(1);

        function localSolve(x0, wts, wantInverse) {
            const dists = [];
            for (let k = 0; k < n; k++) dists.push({ i: k, d: Math.abs(X[k] - x0) });
            dists.sort(function (a, b) { return a.d - b.d; });
            const window = dists.slice(0, nSpan);
            const maxD = window[window.length - 1].d || 1e-10;
            const A = [], b = new Array(p).fill(0);
            for (let a = 0; a < p; a++) A.push(new Array(p).fill(0));
            for (let k = 0; k < window.length; k++) {
                const idx = window[k].i;
                const u = Math.min(1, window[k].d / maxD);
                const tricube = Math.pow(1 - u * u * u, 3);
                const w = tricube * wts[idx];
                const xi = X[idx] - x0;
                const yi = Y[idx];
                const powers = [1];
                for (let q = 1; q <= 2 * degree; q++) powers.push(powers[q - 1] * xi);
                for (let a = 0; a < p; a++) {
                    for (let bb = 0; bb < p; bb++) A[a][bb] += w * powers[a + bb];
                    b[a] += w * powers[a] * yi;
                }
            }
            const beta = solveLinearSystem(A, b);
            const Ainv = wantInverse ? invertMatrix(A) : null;
            return { beta: beta, Ainv: Ainv, nWin: window.length };
        }

        function fitPass(wts) {
            for (let i = 0; i < n; i++) {
                const r = localSolve(X[i], wts, false);
                if (r.beta) fitted[i] = r.beta[0];
                else fitted[i] = Y[i];
            }
        }

        fitPass(weights);

        if (robust) {
            let resid = fitted.map(function (f, i) { return Y[i] - f; });
            let prevWeights = weights.slice();
            for (let iter = 0; iter < 20; iter++) {
                const med = resid.slice().sort(function (a, b) { return a - b; })[Math.floor(n / 2)];
                const absR = resid.map(function (r) { return Math.abs(r - med); });
                absR.sort(function (a, b) { return a - b; });
                let mad = absR[Math.floor(n / 2)];
                if (mad < 1e-12) break;
                weights = resid.map(function (r) {
                    const u = Math.abs(r - med) / (6 * mad);
                    return u >= 1 ? 0 : Math.pow(1 - u * u, 2);
                });
                let delta = 0;
                for (let i = 0; i < n; i++) delta += Math.abs(weights[i] - prevWeights[i]);
                prevWeights = weights.slice();
                if (delta < 1e-4) break;
                fitPass(weights);
                resid = fitted.map(function (f, i) { return Y[i] - f; });
            }
        }

        let edf = 0;
        for (let i = 0; i < n; i++) {
            const r = localSolve(X[i], weights, true);
            if (r.Ainv) edf += r.Ainv[0][0];
        }
        if (!isFinite(edf) || edf < 1) edf = Math.min(n, nSpan);
        if (edf > n - 1) edf = n - 1;
        const df = Math.max(1, n - edf);

        let ssRes = 0;
        for (let i = 0; i < n; i++) {
            const r = Y[i] - fitted[i];
            ssRes += r * r;
        }
        const rmse = Math.sqrt(ssRes / df);

        return {
            type: 'loess',
            span: span, degree: degree, robust: robust,
            n: n, nSpan: nSpan,
            edf: edf, df: df, rmse: rmse, ssRes: ssRes,
            fitted: fitted,
            weights: weights,
            xs: X, ys: Y,
            predict: function (x0) {
                const r = localSolve(x0, weights, false);
                return r.beta ? r.beta[0] : 0;
            },
            predictSE: function (x0) {
                const r = localSolve(x0, weights, true);
                if (!r.Ainv) return NaN;
                let ss = 0, cnt = 0;
                const dists = [];
                for (let k = 0; k < n; k++) dists.push({ i: k, d: Math.abs(X[k] - x0) });
                dists.sort(function (a, b) { return a.d - b.d; });
                const window = dists.slice(0, nSpan);
                for (let k = 0; k < window.length; k++) {
                    const idx = window[k].i;
                    const res = Y[idx] - fitted[idx];
                    ss += res * res;
                    cnt++;
                }
                const sigma2Local = cnt > 0 ? ss / cnt : 0;
                return Math.sqrt(Math.max(0, r.Ainv[0][0] * sigma2Local));
            }
        };
    }

    /* ============================================================
       GAM
    ============================================================ */
    function gamFit(xs, ys, opts) {
        opts = opts || {};
        const clean = sanitizePairs(xs, ys);
        if (clean.n < 6) return null;
        const X = clean.xs, Y = clean.ys;
        const n = clean.n;

        const nKnots = Math.max(3, Math.round(opts.knots || Math.min(10, Math.max(3, Math.floor(n / 5)))));
        const sortedX = X.slice().sort(function (a, b) { return a - b; });
        const knots = [];
        for (let i = 1; i <= nKnots; i++) {
            knots.push(sortedX[Math.floor(i * n / (nKnots + 1))]);
        }

        const K = knots.length;
        const tK = knots[K - 1];

        function dk(x, k) {
            const tk = knots[k];
            const dt = tK - tk;
            if (dt < 1e-12) return 0;
            const a = x > tk ? Math.pow(x - tk, 3) : 0;
            const b = x > tK ? Math.pow(x - tK, 3) : 0;
            return (a - b) / dt;
        }
        function basis(x) {
            const b = [1, x];
            if (K >= 3) {
                const dKm1 = dk(x, K - 2);
                for (let k = 0; k < K - 2; k++) b.push(dk(x, k) - dKm1);
            }
            return b;
        }

        const Xmat = X.map(basis);
        const p = Xmat[0].length;

        const D2 = [];
        for (let i = 0; i < p - 2; i++) {
            const row = new Array(p).fill(0);
            row[i] = 1; row[i + 1] = -2; row[i + 2] = 1;
            D2.push(row);
        }
        const PtP = [];
        for (let i = 0; i < p; i++) PtP.push(new Array(p).fill(0));
        for (let k = 0; k < D2.length; k++) {
            for (let i = 0; i < p; i++) {
                for (let j = 0; j < p; j++) PtP[i][j] += D2[k][i] * D2[k][j];
            }
        }

        const XtX = [];
        for (let i = 0; i < p; i++) XtX.push(new Array(p).fill(0));
        for (let k = 0; k < n; k++) {
            for (let i = 0; i < p; i++) {
                for (let j = 0; j < p; j++) XtX[i][j] += Xmat[k][i] * Xmat[k][j];
            }
        }
        const Xty = new Array(p).fill(0);
        for (let k = 0; k < n; k++) {
            for (let j = 0; j < p; j++) Xty[j] += Xmat[k][j] * Y[k];
        }

        function solveWithLambda(lambda) {
            const M = XtX.map(function (row, i) {
                const r = row.slice();
                for (let j = 0; j < p; j++) r[j] += lambda * PtP[i][j];
                return r;
            });
            return solveLinearSystem(M, Xty);
        }

        let lambda;
        if (opts.lambda != null && isFinite(opts.lambda)) {
            lambda = opts.lambda;
        } else {
            const lambdas = [1e-8, 1e-7, 1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1, 10];
            let bestLambda = 1e-6, bestGCV = Infinity;
            for (let li = 0; li < lambdas.length; li++) {
                const lam = lambdas[li];
                const beta = solveWithLambda(lam);
                if (!beta) continue;
                const fitted = Xmat.map(function (row) {
                    let s = 0;
                    for (let j = 0; j < p; j++) s += beta[j] * row[j];
                    return s;
                });
                let rss = 0;
                for (let i = 0; i < n; i++) {
                    const r = Y[i] - fitted[i];
                    rss += r * r;
                }
                let traceH = 0;
                const M = XtX.map(function (row, i) {
                    const r = row.slice();
                    for (let j = 0; j < p; j++) r[j] += lam * PtP[i][j];
                    return r;
                });
                const Minv = invertMatrix(M);
                if (Minv) {
                    for (let i = 0; i < n; i++) {
                        const v = Xmat[i];
                        traceH += quadForm(v, Minv);
                    }
                }
                const gcv = n * rss / Math.pow(Math.max(1e-6, n - traceH), 2);
                if (isFinite(gcv) && gcv < bestGCV) {
                    bestGCV = gcv;
                    bestLambda = lam;
                }
            }
            lambda = bestLambda;
        }

        const beta = solveWithLambda(lambda);
        if (!beta) return null;

        const Mreg = XtX.map(function (row, i) {
            const r = row.slice();
            for (let j = 0; j < p; j++) r[j] += lambda * PtP[i][j];
            return r;
        });
        const MregInv = invertMatrix(Mreg);

        let edf = 0;
        if (MregInv) {
            for (let k = 0; k < n; k++) {
                const v = Xmat[k];
                edf += quadForm(v, MregInv);
            }
            if (edf > n - 1) edf = n - 1;
            if (edf < 1) edf = 1;
        } else {
            edf = Math.min(n - 1, p);
        }

        let ssRes = 0;
        for (let i = 0; i < n; i++) {
            let yHat = 0;
            for (let j = 0; j < p; j++) yHat += beta[j] * Xmat[i][j];
            ssRes += (Y[i] - yHat) * (Y[i] - yHat);
        }
        const df = Math.max(1, n - edf);
        const sigma2 = ssRes / df;
        const sigma2ML = ssRes / n;

        const coefSE = new Array(p).fill(NaN);
        const coefT = new Array(p).fill(NaN);
        const coefP = new Array(p).fill(NaN);
        if (MregInv) {
            for (let i = 0; i < p; i++) {
                const v = MregInv[i][i];
                if (v >= 0) {
                    coefSE[i] = Math.sqrt(v * sigma2);
                    if (coefSE[i] > 0) {
                        coefT[i] = beta[i] / coefSE[i];
                        coefP[i] = coefPValue(coefT[i], df, false);
                    }
                }
            }
        }

        let aic = NaN;
        if (sigma2ML > 0) aic = n * (Math.log(2 * Math.PI) + 1 + Math.log(sigma2ML)) + 2 * (edf + 1);

        return {
            type: 'gam',
            knots: knots,
            coeffs: beta,
            lambda: lambda,
            XtXRegInv: MregInv,
            penalty: PtP,
            basis: basis,
            n: n, edf: edf, df: df, rmse: Math.sqrt(sigma2),
            sigma2: sigma2, ssRes: ssRes,
            coefSE: coefSE, coefT: coefT, coefP: coefP, aic: aic,
            predict: function (x) {
                const b = basis(x);
                let s = 0;
                for (let i = 0; i < p; i++) s += beta[i] * b[i];
                return s;
            }
        };
    }

    /* ============================================================
       统一入口
    ============================================================ */
    function fitCurve(xs, ys, opts) {
        opts = opts || {};
        const method = opts.method || 'lm';
        if (!xs || !ys || xs.length < 2) return null;
        switch (method) {
            case 'lm': return lmFit(xs, ys, opts);
            case 'glm': return glmFit(xs, ys, opts);
            case 'loess': return loessFit(xs, ys, opts);
            case 'gam': return gamFit(xs, ys, opts);
            default: return null;
        }
    }

    function sampleFitCurve(fit, xMin, xMax, n) {
        if (!fit || typeof fit.predict !== 'function') return [];
        n = Math.max(2, n || 200);
        const out = [];
        for (let i = 0; i <= n; i++) {
            const x = xMin + (xMax - xMin) * i / n;
            const y = fit.predict(x);
            if (isFinite(y)) out.push({ x: x, y: y });
        }
        return out;
    }

    function tValue95(df) {
        if (!isFinite(df) || df <= 0) return 1.96;
        const table = {
            1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
            6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
            11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
            16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
            21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
            26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042
        };
        const dfi = Math.round(df);
        if (dfi <= 30) return table[dfi] || table[30];
        const z = 1.959963984540054;
        return z
            + (z * z * z + z) / (4 * df)
            + (5 * Math.pow(z, 5) + 16 * z * z * z + 3 * z) / (96 * df * df)
            + (3 * Math.pow(z, 7) + 19 * Math.pow(z, 5) + 17 * z * z * z - 15 * z) / (384 * df * df * df);
    }

    function lmSE(fit, x0) {
        const p = (fit.degree || 1) + 1;
        const XtXInv = fit.XtXInv;
        if (!XtXInv) return NaN;
        const t = (x0 - fit.xMean) / fit.xScale;
        const v = [1];
        for (let i = 1; i < p; i++) v.push(v[i - 1] * t);
        return Math.sqrt(Math.max(0, quadForm(v, XtXInv)));
    }

    function gamSE(fit, x0) {
        if (!fit.XtXRegInv || typeof fit.basis !== 'function') return NaN;
        return Math.sqrt(Math.max(0, quadForm(fit.basis(x0), fit.XtXRegInv)));
    }

    function glmPredictSE(fit, x0) {
        if (!fit.XtWXInv) return { seEta: NaN, seMu: NaN };
        const v = [1, x0];
        const varEta = quadForm(v, fit.XtWXInv);
        if (!isFinite(varEta) || varEta < 0) return { seEta: NaN, seMu: NaN };
        const seEta = Math.sqrt(varEta);
        const eta = fit.coeffs[0] + fit.coeffs[1] * x0;
        let dMu;
        if (fit.family === 'poisson') dMu = Math.exp(eta);
        else { const mu = 1 / (1 + Math.exp(-eta)); dMu = mu * (1 - mu); }
        return { seEta: seEta, seMu: Math.abs(dMu) * seEta };
    }

    function computeConfidenceBand(fit, xs, ys, xGrid, level) {
        if (!fit || typeof fit.predict !== 'function') return [];
        if (!xs || !ys || xs.length < 3) return [];
        level = level || 0.95;

        const clean = sanitizePairs(xs, ys);
        const X = clean.xs, Y = clean.ys;
        const n = clean.n;
        if (n < 3) return [];

        let ssRes = 0;
        for (let i = 0; i < n; i++) {
            const yHat = fit.predict(X[i]);
            if (isFinite(yHat)) ssRes += (Y[i] - yHat) * (Y[i] - yHat);
        }

        let df, sigma, tVal;
        if (fit.type === 'lm') {
            df = Math.max(1, n - ((fit.degree || 1) + 1));
            sigma = Math.sqrt(ssRes / df);
            tVal = tValue95(df);
        } else if (fit.type === 'glm') {
            df = fit.df != null ? fit.df : Math.max(1, n - 2);
            sigma = 1;
            tVal = tValue95(df);
        } else if (fit.type === 'gam') {
            df = fit.df != null ? fit.df : Math.max(1, n - (fit.coeffs ? fit.coeffs.length : 2));
            sigma = Math.sqrt(ssRes / df);
            tVal = tValue95(df);
        } else if (fit.type === 'loess') {
            df = fit.df != null ? fit.df : Math.max(1, n - 2);
            sigma = Math.sqrt(ssRes / df);
            tVal = tValue95(df);
        } else {
            df = Math.max(1, n - 2);
            sigma = Math.sqrt(ssRes / df);
            tVal = tValue95(df);
        }

        const out = [];
        for (let k = 0; k < xGrid.length; k++) {
            const x0 = xGrid[k];
            const yHat = fit.predict(x0);
            if (!isFinite(yHat)) {
                out.push({ x: x0, y: NaN, lo: NaN, hi: NaN, se: NaN });
                continue;
            }

            if (fit.type === 'glm') {
                const r = glmPredictSE(fit, x0);
                if (!isFinite(r.seEta)) {
                    out.push({ x: x0, y: yHat, se: NaN, lo: NaN, hi: NaN });
                    continue;
                }
                const eta = fit.coeffs[0] + fit.coeffs[1] * x0;
                const etaLo = eta - tVal * r.seEta;
                const etaHi = eta + tVal * r.seEta;
                let lo, hi;
                if (fit.family === 'poisson') {
                    lo = Math.exp(etaLo);
                    hi = Math.exp(etaHi);
                } else {
                    lo = 1 / (1 + Math.exp(-etaLo));
                    hi = 1 / (1 + Math.exp(-etaHi));
                }
                out.push({ x: x0, y: yHat, se: r.seMu, lo: lo, hi: hi });
                continue;
            }

            let se;
            if (fit.type === 'lm') {
                se = sigma * lmSE(fit, x0);
            } else if (fit.type === 'gam') {
                se = sigma * gamSE(fit, x0);
            } else if (fit.type === 'loess') {
                se = typeof fit.predictSE === 'function' ? fit.predictSE(x0) : (sigma / Math.sqrt(n));
            } else {
                se = sigma / Math.sqrt(n);
            }

            if (!isFinite(se) || se < 0) se = sigma / Math.sqrt(n);

            out.push({
                x: x0, y: yHat, se: se,
                lo: yHat - tVal * se,
                hi: yHat + tVal * se
            });
        }
        return out;
    }

    global.StatFitting = {
        normalPDF: normalPDF,
        normalCDF: normalCDF,
        sampleNormalCurve: sampleNormalCurve,
        linearRegression: linearRegression,
        polyFit: polyFit,
        lmFit: lmFit,
        glmFit: glmFit,
        loessFit: loessFit,
        gamFit: gamFit,
        fitCurve: fitCurve,
        sampleFitCurve: sampleFitCurve,
        computeConfidenceBand: computeConfidenceBand,
        tValue95: tValue95
    };
})(window);
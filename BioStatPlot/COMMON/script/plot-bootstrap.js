
(function (global) {
    'use strict';

    const D3_SOURCES = [
        'https://cdn.jsdmirror.com/npm/d3@7',
        'https://cdn.bootcdn.net/ajax/libs/d3/7.9.0/d3.min.js',
        'https://cdn.staticfile.org/d3/7.9.0/d3.min.js',
    ];

    let loadPromise = null;

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = url;
            s.async = false;
            s.onload = () => resolve(url);
            s.onerror = () => reject(new Error('load fail: ' + url));
            document.head.appendChild(s);
        });
    }

    function ensureD3() {
        if (global.d3 && global.d3.version) return Promise.resolve(global.d3);
        if (loadPromise) return loadPromise;

        loadPromise = (async () => {
            for (const url of D3_SOURCES) {
                try {
                    await loadScript(url);
                    if (global.d3 && global.d3.version) {
                        console.log('[PlotBootstrap] d3 v' + global.d3.version + ' ← ' + url);
                        return global.d3;
                    }
                } catch (e) {
                    console.warn('[PlotBootstrap] 失败:', url);
                }
            }
            throw new Error('所有d3源均加载失败');
        })();

        return loadPromise;
    }

    global.PlotBootstrap = { ensureD3, ready: ensureD3 };
})(window);
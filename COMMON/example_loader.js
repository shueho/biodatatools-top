(function (window) {
    'use strict';

    var BASE_REPO = 'shueho/biodatatools-top@main/example/';

    function buildCandidates(filename) {
        var path = BASE_REPO + filename;
        return [
            'https://jsd.onmicrosoft.cn/gh/' + path,
            'https://fastly.jsdelivr.net/gh/' + path,
            'https://gcore.jsdelivr.net/gh/' + path,
            'https://cdn.jsdelivr.net/gh/' + path,
            'https://raw.githubusercontent.com/shueho/biodatatools-top/main/example/' + filename
        ];
    }

    function fetchWithTimeout(url, ms) {
        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, ms || 8000);
        return fetch(url, { signal: controller.signal, cache: 'no-store' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .finally(function () { clearTimeout(timer); });
    }

    function tryNext(urls, index) {
        if (index >= urls.length) return Promise.reject(new Error('示例加载失败'));
        return fetchWithTimeout(urls[index])
            .then(function (text) {
                if (text && text.trim()) return text;
                return tryNext(urls, index + 1);
            })
            .catch(function () {
                return tryNext(urls, index + 1);
            });
    }

    window.loadExampleFile = function (filename) {
        if (!filename) return Promise.reject(new Error('缺少文件名'));
        return tryNext(buildCandidates(filename), 0);
    };
})(window);
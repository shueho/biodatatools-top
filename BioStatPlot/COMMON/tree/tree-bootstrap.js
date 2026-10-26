(function (global) {
'use strict';
const SRC = [
  'https://cdn.jsdmirror.com/npm/d3@7',
  'https://cdn.bootcdn.net/ajax/libs/d3/7.9.0/d3.min.js',
  'https://cdn.staticfile.org/d3/7.9.0/d3.min.js'
];
let promise = null;
function loadScript(url) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = url; s.async = false;
    s.onload = () => res(url);
    s.onerror = () => rej(url);
    document.head.appendChild(s);
  });
}
function ensureD3() {
  if (global.d3 && global.d3.version) return Promise.resolve(global.d3);
  if (promise) return promise;
  promise = (async () => {
    for (const url of SRC) {
      try {
        await loadScript(url);
        if (global.d3 && global.d3.version) return global.d3;
      } catch (_) {}
    }
    throw new Error('d3 load failed');
  })();
  return promise;
}
global.PlotBootstrap = { ensureD3, ready: ensureD3 };
global.TreeBootstrap = global.PlotBootstrap;
})(window);